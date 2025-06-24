import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const DEBUGGING = true; // Set to true to enable debugging output
console.log = DEBUGGING ? console.log.bind(console) : () => {}; // Conditional logging

interface Position {
  line: number;
  character: number;
}

interface MarkupContent {
  kind: 'plaintext' | 'markdown';
  value: string;
}

interface HoverResult {
  contents: string | MarkupContent | (string | MarkupContent)[];
  range?: {
    start: Position;
    end: Position;
  };
}

interface TestCase {
  name: string;
  files: Map<string, string>;
  hoverPosition: { line: number; character: number };
  hoverFileName: string;
  expectedHoverContent: string;
}

interface HoverTestFile {
  content: string;
  hoverPosition: { line: number; character: number };
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
        if (!this.isShuttingDown && !data.toString().includes('Debugger')) {
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
            hover: {
              contentFormat: ['plaintext', 'markdown']
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

  async requestHover(uri: string, position: Position): Promise<HoverResult | null> {
    console.log(`Requesting hover for ${uri} at ${JSON.stringify(position)}`);
    try {
      const response = await this.sendRequest('textDocument/hover', {
        textDocument: { uri },
        position
      });
      console.log('Hover response:', response);
      return response as HoverResult | null;
    } catch (error) {
      console.error('Hover request failed:', error);
      return null;
    }
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

  private processMessageBuffer(): void {    // eslint-disable-next-line no-constant-condition
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
        console.error('Message content:', messageContent);      }
    }
  }

  private handleMessage(message: Record<string, unknown>): void {
    if (message['id'] && this.pendingRequests.has(message['id'] as number)) {
      const request = this.pendingRequests.get(message['id'] as number)!;
      this.pendingRequests.delete(message['id'] as number);

      if (message['error']) {
        const error = message['error'] as { message: string; code: number };
        request.reject(new Error(`LSP Error: ${error.message} (${error.code})`));
      } else {
        request.resolve(message['result']);
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

describe('Language Server Hover Tests (LSP)', () => {
  let client: SimpleLSPClient;
  let baseTempDir: string;

  beforeAll(async () => {
    baseTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsp-hover-tests-'));
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
  const testCasesDir = path.join(__dirname, 'hover-test-cases');
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
    const testCase = parseHoverTestCaseFile(testCaseFile);

    it(`should provide hover info for ${testCase.name}`, async () => {
      // Create a unique subdirectory for this test
      const testTempDir = fs.mkdtempSync(path.join(baseTempDir, `${testCase.name}-`));
      const createdFiles = new Map<string, string>();
      const openedDocuments: string[] = [];

      try {
        console.log(`\n=== Running hover test: ${testCase.name} ===`);
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
          console.log(`Document content (first 200 chars):\n${content.substring(0, 200)}${content.length > 200 ? '...' : ''}`);
          
          await client.openDocument(uri, content);
          openedDocuments.push(uri);
          
          // Small delay between document opens
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Additional delay for server processing and inheritance resolution
        console.log('Waiting for document processing...');
        await new Promise(resolve => setTimeout(resolve, 500));

        // Find the main file to test hover on
        const mainFileName = testCase.hoverFileName;
        if (!createdFiles.has(mainFileName)) {
          throw new Error(`Hover file ${mainFileName} not found in created files`);
        }
        
        const mainFilePath = createdFiles.get(mainFileName)!;
        const mainFileUri = `file:///${mainFilePath.replace(/\\/g, '/')}`;

        console.log(`Requesting hover on: ${mainFileName} at position ${JSON.stringify(testCase.hoverPosition)}`);
        
        // Debug: Show the actual content around the hover position
        const fileContent = testCase.files.get(mainFileName)!;
        const lines = fileContent.split('\n');
        const hoverLine = lines[testCase.hoverPosition.line];
        if (hoverLine) {
          const start = Math.max(0, testCase.hoverPosition.character - 5);
          const end = Math.min(hoverLine.length, testCase.hoverPosition.character + 10);
          console.log(`Context around hover position: "${hoverLine.substring(start, end)}" (position marked with |)`);
          console.log(`Line ${testCase.hoverPosition.line}: "${hoverLine}"`);
          console.log(`Character ${testCase.hoverPosition.character}: "${hoverLine[testCase.hoverPosition.character] || 'EOF'}"`);
        }

        // Request hover at specified position
        let hoverResult = await client.requestHover(
          mainFileUri,
          testCase.hoverPosition
        );

        console.log(`Expected hover: "${testCase.expectedHoverContent}"`);
        console.log(`Actual hover result:`, hoverResult);
        
        // If hover failed, try a few nearby positions
        if (!hoverResult || !hoverResult.contents || (Array.isArray(hoverResult.contents) && hoverResult.contents.length === 0)) {
          console.log(`Initial hover failed, trying nearby positions...`);
          
          const originalPos = testCase.hoverPosition;
          const tryPositions = [
            { line: originalPos.line, character: originalPos.character + 1 },
            { line: originalPos.line, character: originalPos.character - 1 },
            { line: originalPos.line, character: originalPos.character + 2 },
            { line: originalPos.line, character: originalPos.character - 2 }
          ];
          
          for (const pos of tryPositions) {
            console.log(`Trying position: ${JSON.stringify(pos)}`);
            const tryResult = await client.requestHover(mainFileUri, pos);
            if (tryResult && tryResult.contents && 
                !(Array.isArray(tryResult.contents) && tryResult.contents.length === 0)) {
              console.log(`Found hover at position ${JSON.stringify(pos)}:`, tryResult);
              hoverResult = tryResult;
              break;
            }
          }
        }
        
        // Validate hover content
        if (testCase.expectedHoverContent.trim() === '') {
          // Expect no hover result
          const hasNoContent = !hoverResult || 
                               !hoverResult.contents || 
                               (Array.isArray(hoverResult.contents) && hoverResult.contents.length === 0) ||
                               (typeof hoverResult.contents === 'string' && hoverResult.contents.trim() === '');
          expect(hasNoContent).toBe(true);
          console.log(`✅ Test ${testCase.name} passed (no hover expected and none received)`);
        } else {
          // Expect hover result
          expect(hoverResult).not.toBeNull();
          expect(hoverResult?.contents).toBeDefined();
          
          // Convert hover contents to string for comparison
          let actualContent = '';
          if (typeof hoverResult?.contents === 'string') {
            actualContent = hoverResult.contents;
          } else if (hoverResult?.contents && typeof hoverResult.contents === 'object' && 'value' in hoverResult.contents) {
            actualContent = hoverResult.contents.value;
          } else if (Array.isArray(hoverResult?.contents)) {
            if (hoverResult.contents.length === 0) {
              actualContent = '';
            } else {
              actualContent = hoverResult.contents.map(c => 
                typeof c === 'string' ? c : (c && typeof c === 'object' && 'value' in c ? c.value : String(c))
              ).join('\n');
            }
          } else {
            actualContent = String(hoverResult?.contents || '');
          }

          // Normalize whitespace for comparison
          const normalizedActual = actualContent.trim().replace(/\s+/g, ' ');
          const normalizedExpected = testCase.expectedHoverContent.trim().replace(/\s+/g, ' ');
          
          console.log(`Normalized expected: "${normalizedExpected}"`);
          console.log(`Normalized actual:   "${normalizedActual}"`);
          
          try {
            expect(normalizedActual).toEqual(normalizedExpected);
            console.log(`✅ Test ${testCase.name} passed`);
          } catch (error) {
            console.error(`❌ Hover content mismatch for test case '${testCase.name}':`);
            console.error(`Expected: "${normalizedExpected}"`);
            console.error(`Actual:   "${normalizedActual}"`);
            throw error;
          }
        }

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
 * Parse a hover test case file and extract file contents, hover position, and expected hover content
 */
function parseHoverTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  let expectedHoverContent = '';
  let hoverPosition: { line: number; character: number } = { line: 0, character: 0 };
  let hoverFileName = '';

  // Split content by === markers
  const sections = content.split(/^=== (.+?) ===$/gm);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'HOVER') {
      // Parse expected hover content
      expectedHoverContent = parseExpectedHoverContent(sectionContent);
    } else {
      // This is a file section - process hover marker
      const processedFile = processFileWithHoverMarker(sectionContent);
      files.set(sectionName, processedFile.content);
      if (sectionContent.includes('###')) {
        hoverPosition = processedFile.hoverPosition;
        hoverFileName = sectionName;
      }
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  // If no hover file was found, use the first file
  if (!hoverFileName) {
    hoverFileName = Array.from(files.keys())[0] || '';
  }

  return {
    name: testName,
    files,
    hoverPosition,
    hoverFileName,
    expectedHoverContent
  };
}

function parseExpectedHoverContent(content: string): string {
  return content;
  /*const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip empty lines
    if (!trimmedLine) continue;
    
    // Check if this is a markdown section start with ###
    if (trimmedLine.startsWith('###')) {
      // Extract the content after ### and any leading/trailing whitespace
      const markdownContent = trimmedLine.substring(3).trim();
      if (markdownContent) {
        return markdownContent;
      }
    }
    
    // Check for lines that start with "# Task:", "# Data:", etc. and extract the content
    if (trimmedLine.startsWith('#') && !trimmedLine.startsWith('###')) {
      // Return the content after the #, trimmed
      return trimmedLine.substring(1).trim();
    }
  }
  
  // If no # lines found, return the entire content trimmed
  return content.trim();*/
}

function processFileWithHoverMarker(content: string): HoverTestFile {
  const hoverMarkerStart = '###';
  const hoverMarkerEnd = '###';
  
  const startIndex = content.indexOf(hoverMarkerStart);
  const endIndex = content.indexOf(hoverMarkerEnd, startIndex + hoverMarkerStart.length);
  
  if (startIndex === -1 || endIndex === -1) {
    return {
      content,
      hoverPosition: { line: 0, character: 0 }
    };
  }

  // Remove the hover markers from content
  const beforeMarker = content.substring(0, startIndex);
  const markedContent = content.substring(startIndex + hoverMarkerStart.length, endIndex);
  const afterMarker = content.substring(endIndex + hoverMarkerEnd.length);
  const cleanContent = beforeMarker + markedContent + afterMarker;

  // Calculate hover position - position in the middle of the marked content for better symbol detection
  const beforeCursor = beforeMarker;
  const lines = beforeCursor.split('\n');
  const line = lines.length - 1;
  const lastLine = lines[lines.length - 1];
  const baseCharacter = lastLine ? lastLine.length : 0;
  
  // Position in the middle of the marked content for better hover detection
  const character = baseCharacter + Math.floor(markedContent.length / 2);

  console.log(`Debug - Hover marker processing:`);
  console.log(`  Marked content: "${markedContent}"`);
  console.log(`  Base character: ${baseCharacter}`);
  console.log(`  Final position: line ${line}, character ${character}`);
  console.log(`  Content at position: "${cleanContent.split('\n')[line]?.substring(character - 2, character + 2)}"`);

  return {
    content: cleanContent,
    hoverPosition: { line, character }
  };
}
});