import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

interface Position {
  line: number;
  character: number;
}

interface CompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  documentation?: string;
}

interface CompletionResponse {
  items?: CompletionItem[];
  isIncomplete?: boolean;
}

interface TestCase {
  name: string;
  files: Map<string, string>;
  cursorPosition: { line: number; character: number };
  cursorFileName: string;
  expectedSuggestions: string[];
  notExpectedSuggestions?: string[];
}

interface CompletionTestFile {
  content: string;
  cursorPosition: { line: number; character: number };
}

class SimpleLSPClient {
  private process: ChildProcess | null = null;
  private messageId = 1;
  private pendingRequests = new Map<number, { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }>();
  private buffer = '';
  private isShuttingDown = false;
  
  async start(command: string, args: string[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      this.process = spawn(command, args, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.process.stdout || !this.process.stdin) {
        reject(new Error('Failed to create language server process'));
        return;
      }

      // Handle responses with proper buffering
      this.process.stdout.on('data', (data) => {
        this.buffer += data.toString();
        this.processMessageBuffer();
      });

      this.process.stderr?.on('data', (data) => {
        if (!this.isShuttingDown) {
          console.error('Language server stderr:', data.toString());
        }
      });

      this.process.on('error', (error) => {
        if (!this.isShuttingDown) {
          console.error('Process error:', error);
        }
        this.cleanup();
        reject(error);
      });

      this.process.on('exit', (code, signal) => {
        if (!this.isShuttingDown) {
          console.log(`Process exited with code ${code}, signal ${signal}`);
        }
        this.cleanup();
      });

      // Initialize the language server
      this.sendRequest('initialize', {
        processId: process.pid,
        rootUri: null,
        capabilities: {
          textDocument: {
            completion: {
              completionItem: {
                snippetSupport: true,
                documentationFormat: ['plaintext']
              },
              contextSupport: true
            }
          }
        }
      }).then(() => {
        return this.sendNotification('initialized', {});
      }).then(() => {
        resolve();
      }).catch(reject);
    });
  }

  async stop(): Promise<void> {
    if (this.process && !this.isShuttingDown) {
      this.isShuttingDown = true;
      console.log('Shutting down language server...');
      
      try {
        // Send shutdown sequence
        await Promise.race([
          this.sendRequest('shutdown', {}),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Shutdown timeout')), 5000))
        ]);
        
        await this.sendNotification('exit', {});
        
        // Wait for process to exit naturally
        await new Promise<void>((resolve) => {
          if (!this.process) {
            resolve();
            return;
          }
          
          const timeout = setTimeout(() => {
            if (this.process && !this.process.killed) {
              console.log('Force killing language server process');
              this.process.kill('SIGKILL');
            }
            resolve();
          }, 3000);
          
          this.process.on('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        
      } catch (error) {
        console.log('Error during shutdown, force killing:', error);
        if (this.process && !this.process.killed) {
          this.process.kill('SIGKILL');
        }
      }
      
      this.process = null;
    }
  }

  async openDocument(uri: string, content: string): Promise<void> {
    await this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId: 'xxp',
        version: 1,
        text: content
      }
    });
  }

  async closeDocument(uri: string): Promise<void> {
    await this.sendNotification('textDocument/didClose', {
      textDocument: { uri }
    });
  }

  async requestCompletion(uri: string, position: Position): Promise<CompletionResponse> {
    console.log(`Requesting completion for ${uri} at ${JSON.stringify(position)}`);
    const response = await this.sendRequest('textDocument/completion', {
      textDocument: { uri },
      position,
      context: {
        triggerKind: 1 // Invoked manually
      }
    });
    console.log('Completion response:', response);
    
    // Handle both array and object response formats
    if (Array.isArray(response)) {
      return { items: response as CompletionItem[] };
    }
    return response as CompletionResponse;
  }

  private async sendRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    if (this.isShuttingDown && method !== 'shutdown') {
      throw new Error('Client is shutting down');
    }

    const id = this.messageId++;
    const message = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for method: ${method}`));
        }
      }, 10000);
      
      this.pendingRequests.set(id, {
        resolve: (value: unknown) => {
          clearTimeout(timeout);
          resolve(value);
        },
        reject: (reason?: unknown) => {
          clearTimeout(timeout);
          reject(reason);
        }
      });
      
      this.sendMessage(message);
    });
  }

  private async sendNotification(method: string, params: Record<string, unknown>): Promise<void> {
    const message = {
      jsonrpc: '2.0',
      method,
      params
    };
    this.sendMessage(message);
  }

  private sendMessage(message: Record<string, unknown>): void {
    if (!this.process?.stdin || this.isShuttingDown) return;
    
    const content = JSON.stringify(message);
    const header = `Content-Length: ${Buffer.byteLength(content, 'utf8')}\r\n\r\n`;
    this.process.stdin.write(header + content);
  }

  private processMessageBuffer(): void {
    while (true) {
      // Look for complete message
      const headerEnd = this.buffer.indexOf('\r\n\r\n');
      if (headerEnd === -1) {
        break; // No complete header found
      }

      // Parse header
      const headers = this.buffer.substring(0, headerEnd);
      const contentLengthMatch = headers.match(/Content-Length:\s*(\d+)/i);
      
      if (!contentLengthMatch) {
        // Invalid header, skip
        this.buffer = this.buffer.substring(headerEnd + 4);
        continue;
      }

      const contentLength = parseInt(contentLengthMatch[1]!);
      const messageStart = headerEnd + 4;
      
      // Check if we have the complete message
      if (this.buffer.length < messageStart + contentLength) {
        break; // Incomplete message, wait for more data
      }

      // Extract the complete message
      const messageContent = this.buffer.substring(messageStart, messageStart + contentLength);
      this.buffer = this.buffer.substring(messageStart + contentLength);

      // Process the message
      try {
        const parsed = JSON.parse(messageContent);
        this.handleMessage(parsed);
      } catch (error) {
        console.error('Error parsing JSON message:', error);
        console.error('Message content:', messageContent);
      }
    }
  }

  private handleMessage(message: any): void {
    if (message.id && this.pendingRequests.has(message.id)) {
      const request = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        request.reject(new Error(`LSP Error: ${message.error.message} (${message.error.code})`));
      } else {
        request.resolve(message.result);
      }
    }
    // Ignore notifications and other messages
  }

  private cleanup(): void {
    // Reject all pending requests
    this.pendingRequests.forEach(({ reject }) => {
      reject(new Error('Language server process terminated'));
    });
    this.pendingRequests.clear();
    this.buffer = '';
  }
}

describe('Language Server Completion Tests (LSP)', () => {
  let client: SimpleLSPClient;
  let baseTempDir: string;

  beforeAll(async () => {
    baseTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsp-completion-tests-'));
    client = new SimpleLSPClient();
    
    // Start the language server using the built server.js
    const serverPath = path.join(__dirname, '../dist/server.js');
    console.log(`Starting language server: ${serverPath}`);
    await client.start('node', [serverPath, '--stdio']);
  }, 30000);

  afterAll(async () => {
    if (client) {
      await client.stop();
    }
    // Clean up base temp directory
    if (fs.existsSync(baseTempDir)) {
      fs.rmSync(baseTempDir, { recursive: true, force: true });
    }
  }, 20000);

  // Dynamic test cases from files
  const testCasesDir = path.join(__dirname, 'completion-test-cases');
  let testCaseFiles: string[] = [];
  if (fs.existsSync(testCasesDir)) {
    testCaseFiles = fs.readdirSync(testCasesDir)
      .filter(file => file.endsWith('.test'))
      .map(file => path.join(testCasesDir, file));
  }

  if (testCaseFiles.length === 0) {
    it('should find at least one test case file when test cases directory exists', () => {
      if (fs.existsSync(testCasesDir)) {
        expect(testCaseFiles.length).toBeGreaterThan(0);
      } else {
        // Skip this test if directory doesn't exist
        expect(true).toBe(true);
      }
    });
  }

  // Parse each test case file and create dynamic tests
  testCaseFiles.forEach(testCaseFile => {
    const testCase = parseCompletionTestCaseFile(testCaseFile);

    it(`should provide completions for ${testCase.name}`, async () => {
      // Create a unique subdirectory for this test
      const testTempDir = fs.mkdtempSync(path.join(baseTempDir, `${testCase.name}-`));
      const createdFiles = new Map<string, string>();
      const openedDocuments: string[] = [];

      try {
        console.log(`\n=== Running test: ${testCase.name} ===`);
        console.log(`Test temp directory: ${testTempDir}`);

        // Create temporary files for this test case
        for (const [fileName, content] of testCase.files) {
          const filePath = path.join(testTempDir, fileName);
          const dirPath = path.dirname(filePath);
          
          if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
          }
          
          fs.writeFileSync(filePath, content, 'utf8');
          createdFiles.set(fileName, filePath);
          console.log(`Created file: ${fileName} at ${filePath}`);
        }

        // Small delay to ensure filesystem operations complete
        await new Promise(resolve => setTimeout(resolve, 50));

        // Open all documents via LSP
        for (const [fileName, filePath] of createdFiles) {
          const content = testCase.files.get(fileName)!;
          const uri = `file:///${filePath.replace(/\\/g, '/')}`;
          
          console.log(`Opening document: ${fileName} -> ${uri}`);
          console.log(`Document content:\n${content}`);
          
          await client.openDocument(uri, content);
          openedDocuments.push(uri);
          
          // Small delay between document opens
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Additional delay for server processing
        await new Promise(resolve => setTimeout(resolve, 200));

        // Find the main file to test completions on
        const mainFileName = testCase.cursorFileName;
        if (!createdFiles.has(mainFileName)) {
          throw new Error(`Cursor file ${mainFileName} not found in created files`);
        }
        
        const mainFilePath = createdFiles.get(mainFileName)!;
        const mainFileUri = `file:///${mainFilePath.replace(/\\/g, '/')}`;

        console.log(`Requesting completions on: ${mainFileName} at position ${JSON.stringify(testCase.cursorPosition)}`);

        // Request completion at cursor position
        const completions = await client.requestCompletion(
          mainFileUri,
          testCase.cursorPosition
        );

        // Check results
        const completionLabels = completions.items?.map(item => item.label) || [];
        
        console.log(`Expected: [${testCase.expectedSuggestions.join(', ')}]`);
        console.log(`Actual:   [${completionLabels.join(', ')}]`);
        
        // Validate expected suggestions
        for (const expectedSuggestion of testCase.expectedSuggestions) {
          expect(completionLabels).toContain(expectedSuggestion);
        }

        // Validate not expected suggestions
        if (testCase.notExpectedSuggestions) {
          for (const notExpectedSuggestion of testCase.notExpectedSuggestions) {
            expect(completionLabels).not.toContain(notExpectedSuggestion);
          }
        }

        console.log(`✅ Test ${testCase.name} passed`);

      } catch (error) {
        console.error(`❌ Test case '${testCase.name}' failed:`);
        console.error(`Test temp directory: ${testTempDir}`);
        console.error(`Created files: ${Array.from(createdFiles.keys()).join(', ')}`);
        console.error('Error:', error);
        throw error;
      } finally {
        // Close all opened documents
        try {
          for (const uri of openedDocuments) {
            await client.closeDocument(uri);
          }
        } catch (error) {
          console.warn('Error closing documents:', error);
        }

        // Clean up test directory and files
        try {
          if (fs.existsSync(testTempDir)) {
            fs.rmSync(testTempDir, { recursive: true, force: true });
            console.log(`Cleaned up test directory: ${testTempDir}`);
          }
        } catch (error) {
          console.warn('Error cleaning up test directory:', error);
        }
      }
    }, 20000);
  });

/**
 * Parse a completion test case file and extract file contents, cursor position, and expected suggestions
 */
function parseCompletionTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  const expectedSuggestions: string[] = [];
  const notExpectedSuggestions: string[] = [];
  let cursorPosition: { line: number; character: number } = { line: 0, character: 0 };
  let cursorFileName = '';

  // Split content by === markers
  const sections = content.split(/^=== (.+?) ===$/gm);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'SUGGESTIONS') {
      // Parse expected suggestions
      parseExpectedSuggestions(sectionContent, expectedSuggestions);
    } else if (sectionName === 'NOT_EXPECTED') {
      // Parse suggestions that should NOT be present
      parseExpectedSuggestions(sectionContent, notExpectedSuggestions);
    } else {
      // This is a file section - process cursor marker
      const processedFile = processFileWithCursor(sectionContent);
      files.set(sectionName, processedFile.content);
      if (sectionContent.includes('<-CURSOR->')) {
        cursorPosition = processedFile.cursorPosition;
        cursorFileName = sectionName;
      }
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  // If no cursor file was found, use the first file
  if (!cursorFileName) {
    cursorFileName = Array.from(files.keys())[0] || '';
  }

  return {
    name: testName,
    files,
    cursorPosition,
    cursorFileName,
    expectedSuggestions,
    notExpectedSuggestions
  };
}

function parseExpectedSuggestions(content: string, suggestions: string[]): void {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  
  for (const line of lines) {
    if (line.startsWith('- ')) {
      const suggestion = line.substring(2).trim();
      if (suggestion) {
        suggestions.push(suggestion);
      }
    } else if (line) {
      suggestions.push(line);
    }
  }
}

function processFileWithCursor(content: string): CompletionTestFile {
  const cursorMarker = '<-CURSOR->';
  const cursorIndex = content.indexOf(cursorMarker);
  
  if (cursorIndex === -1) {
    return {
      content,
      cursorPosition: { line: 0, character: 0 }
    };
  }

  // Remove the cursor marker from content
  const cleanContent = content.replace(cursorMarker, '');

  // Calculate line and character position
  const beforeCursor = content.substring(0, cursorIndex);
  const lines = beforeCursor.split('\n');
  const line = lines.length - 1;
  const lastLine = lines[lines.length - 1];
  const character = lastLine ? lastLine.length : 0;

  return {
    content: cleanContent,
    cursorPosition: { line, character }
  };
}
});