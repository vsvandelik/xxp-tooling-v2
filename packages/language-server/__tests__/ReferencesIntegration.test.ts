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

interface Range {
  start: Position;
  end: Position;
}

interface Location {
  uri: string;
  range: Range;
}

interface TestCase {
  name: string;
  files: Map<string, string>;
  requestPosition: { line: number; character: number };
  requestFileName: string;
  expectedDefinition: Range | null;
  expectedReferences: Range[];
}

interface TestFile {
  content: string;
  requestPosition: { line: number; character: number };
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
            definition: {
              linkSupport: true
            },
            references: {
              dynamicRegistration: true
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

  async requestDefinition(uri: string, position: Position): Promise<Location | Location[] | null> {
    console.log(`Requesting definition for ${uri} at ${JSON.stringify(position)}`);
    try {
      const response = await this.sendRequest('textDocument/definition', {
        textDocument: { uri },
        position
      });
      console.log('Definition response:', response);
      return response as Location | Location[] | null;
    } catch (error) {
      console.error('Definition request failed:', error);
      return null;
    }
  }

  async requestReferences(uri: string, position: Position): Promise<Location[] | null> {
    console.log(`Requesting references for ${uri} at ${JSON.stringify(position)}`);
    try {
      const response = await this.sendRequest('textDocument/references', {
        textDocument: { uri },
        position,
        context: {
          includeDeclaration: true
        }
      });
      console.log('References response:', response);
      return response as Location[] | null;
    } catch (error) {
      console.error('References request failed:', error);
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

  private processMessageBuffer(): void {
    // eslint-disable-next-line no-constant-condition
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

describe('Language Server Definition and References Tests (LSP)', () => {
  let client: SimpleLSPClient;
  let baseTempDir: string;

  beforeAll(async () => {
    baseTempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsp-def-ref-tests-'));
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
  const testCasesDir = path.join(__dirname, 'references-test-cases');
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
    const testCase = parseTestCaseFile(testCaseFile);

    it(`should provide definition and references for ${testCase.name}`, async () => {
      // Create a unique subdirectory for this test
      const testTempDir = fs.mkdtempSync(path.join(baseTempDir, `${testCase.name}-`));
      const createdFiles = new Map<string, string>();
      const openedDocuments: string[] = [];

      try {
        console.log(`\n=== Running definition/references test: ${testCase.name} ===`);
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

        // Find the main file to test on
        const mainFileName = testCase.requestFileName;
        if (!createdFiles.has(mainFileName)) {
          throw new Error(`Request file ${mainFileName} not found in created files`);
        }
        
        const mainFilePath = createdFiles.get(mainFileName)!;
        const mainFileUri = `file:///${mainFilePath.replace(/\\/g, '/')}`;

        console.log(`Testing on: ${mainFileName} at position ${JSON.stringify(testCase.requestPosition)}`);
        
        // Debug: Show the actual content around the request position
        const fileContent = testCase.files.get(mainFileName)!;
        const lines = fileContent.split('\n');
        const requestLine = lines[testCase.requestPosition.line];
        if (requestLine) {
          const start = Math.max(0, testCase.requestPosition.character - 5);
          const end = Math.min(requestLine.length, testCase.requestPosition.character + 10);
          console.log(`Context around request position: "${requestLine.substring(start, end)}"`);
          console.log(`Line ${testCase.requestPosition.line}: "${requestLine}"`);
          console.log(`Character ${testCase.requestPosition.character}: "${requestLine[testCase.requestPosition.character] || 'EOF'}"`);
        }

        // Debug: Show all lines with character positions for reference
        console.log(`File content with line numbers and character positions:`);
        lines.forEach((line, index) => {
          console.log(`  ${index}: "${line}"`);
          if (index < 3) { // Show character ruler for first few lines
            const ruler = Array.from({length: line.length}, (_, i) => (i % 10).toString()).join('');
            console.log(`     ${ruler}`);
          }
        });

        // Request definition
        const definitionResult = await client.requestDefinition(mainFileUri, testCase.requestPosition);
        console.log(`Definition result:`, JSON.stringify(definitionResult, null, 2));

        // Request references
        const referencesResult = await client.requestReferences(mainFileUri, testCase.requestPosition);
        console.log(`References result:`, JSON.stringify(referencesResult, null, 2));        
        
        // Validate definition
        if (testCase.expectedDefinition === null) {
          expect(definitionResult).toBeNull();
          console.log(`✅ Definition test passed (no definition expected)`);
        } else {
          expect(definitionResult).not.toBeNull();
          
          console.log(`Expected definition range: ${rangeToString(testCase.expectedDefinition)}`);
          
          // Handle both single location and array of locations
          const definitions = Array.isArray(definitionResult) ? definitionResult : [definitionResult as Location];
          expect(definitions.length).toBeGreaterThan(0);
          
          console.log(`Actual definition ranges:`);
          definitions.forEach((def, i) => {
            console.log(`  [${i}] ${rangeToString(def.range)} in ${normalizeUri(def.uri)}`);
          });
          
          // Find a definition that matches our expected range (checking only the main file for simplicity)
          const matchingDef = definitions.find(def => 
            normalizeUri(def.uri) === normalizeUri(mainFileUri) && 
            rangesEqual(def.range, testCase.expectedDefinition!)
          );
          
          if (!matchingDef) {
            console.error(`❌ No matching definition found!`);
            console.error(`Expected: ${rangeToString(testCase.expectedDefinition)} in ${normalizeUri(mainFileUri)}`);
            console.error(`Available definitions:`);
            definitions.forEach((def, i) => {
              console.error(`  [${i}] ${rangeToString(def.range)} in ${normalizeUri(def.uri)}`);
            });
            throw new Error(`Definition test failed - no matching definition found. Expected: ${rangeToString(testCase.expectedDefinition)} in ${normalizeUri(mainFileUri)}`);
          } else {
            console.log(`✅ Definition test passed at ${rangeToString(testCase.expectedDefinition)}`);
          }
        }        // Validate references
        if (testCase.expectedReferences.length === 0) {
          expect(referencesResult).toBeNull();
          console.log(`✅ References test passed (no references expected)`);
        } else {
          expect(referencesResult).not.toBeNull();
          expect(Array.isArray(referencesResult)).toBe(true);
          
          const references = referencesResult as Location[];
          console.log(`Expected ${testCase.expectedReferences.length} references, got ${references.length}`);
          
          console.log(`Expected reference ranges:`);
          testCase.expectedReferences.forEach((range, i) => {
            console.log(`  [${i}] ${rangeToString(range)}`);
          });
          
          console.log(`Actual reference ranges:`);
          references.forEach((ref, i) => {
            console.log(`  [${i}] ${rangeToString(ref.range)} in ${normalizeUri(ref.uri)}`);
          });
          
          // Filter references to main file only (for multi-file support later)
          const mainFileReferences = references.filter(ref => normalizeUri(ref.uri) === normalizeUri(mainFileUri));
          
          console.log(`Expected ${testCase.expectedReferences.length} references in main file, got ${mainFileReferences.length}`);
          
          if (mainFileReferences.length !== testCase.expectedReferences.length) {
            console.error(`❌ Reference count mismatch!`);
            console.error(`Expected ${testCase.expectedReferences.length} references, got ${mainFileReferences.length}`);
            console.error(`Main file references:`);
            mainFileReferences.forEach((ref, i) => {
              console.error(`  [${i}] ${rangeToString(ref.range)}`);
            });
            throw new Error(`References test failed - expected ${testCase.expectedReferences.length} references, got ${mainFileReferences.length}`);
          } else {
            // Check that each expected reference is found
            const missingReferences: Range[] = [];
            for (const expectedRange of testCase.expectedReferences) {
              const matchingRef = mainFileReferences.find(ref => rangesEqual(ref.range, expectedRange));
              if (matchingRef) {
                console.log(`✅ Found expected reference at ${rangeToString(expectedRange)}`);
              } else {
                console.error(`❌ Missing expected reference at ${rangeToString(expectedRange)}`);
                missingReferences.push(expectedRange);
              }
            }
            
            if (missingReferences.length > 0) {
              const missingRangesStr = missingReferences.map(rangeToString).join(', ');
              throw new Error(`References test failed - missing expected references at: ${missingRangesStr}`);
            } else {
              console.log(`✅ References test passed`);
            }
          }
        }        console.log(`📊 Test ${testCase.name} completed (debug mode)`);

      } catch (error) {
        console.error(`📊 Test ${testCase.name} failed: ${error}`);
        throw error; // Re-throw to fail the test
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
});

/**
 * Parse a test case file and extract file contents, request position, and expected results
 */
function parseTestCaseFile(filePath: string): TestCase {
  const content = fs.readFileSync(filePath, 'utf8');
  const testName = path.basename(filePath, '.test');
  const files = new Map<string, string>();
  let expectedDefinition: Range | null = null;
  const expectedReferences: Range[] = [];
  let requestPosition: { line: number; character: number } = { line: 0, character: 0 };
  let requestFileName = '';

  // Split content by === markers
  const sections = content.split(/^=== (.+?) ===$/gm);

  // First element is empty or contains content before first marker
  for (let i = 1; i < sections.length; i += 2) {
    const sectionName = sections[i]?.trim();
    const sectionContent = sections[i + 1]?.trim() || '';

    if (!sectionName) continue;

    if (sectionName === 'DEFINITION') {
      expectedDefinition = parseRangeFromContent(sectionContent);
    } else if (sectionName === 'REFERENCES') {
      expectedReferences.push(...parseRangesFromContent(sectionContent));
    } else {
      // This is a file section - process marker
      const processedFile = processFileWithMarker(sectionContent);
      files.set(sectionName, processedFile.content);
      if (sectionContent.includes('###')) {
        requestPosition = processedFile.requestPosition;
        requestFileName = sectionName;
      }
    }
  }

  if (files.size === 0) {
    throw new Error(`No file sections found in test case: ${filePath}`);
  }

  // If no request file was found, use the first file
  if (!requestFileName) {
    requestFileName = Array.from(files.keys())[0] || '';
  }

  return {
    name: testName,
    files,
    requestPosition,
    requestFileName,
    expectedDefinition,
    expectedReferences
  };
}

function parseRangeFromContent(content: string): Range | null {
  const line = content.trim();
  if (!line) return null;
  
  const match = line.match(/^(\d+):(\d+)-(\d+)$/);
  if (!match) {
    throw new Error(`Invalid range format: ${line}. Expected format: line:start-end`);
  }
  
  const [, lineNum, startChar, endChar] = match;
  // Convert from 1-indexed (test format) to 0-indexed (LSP format)
  return {
    start: { line: parseInt(lineNum!) - 1, character: parseInt(startChar!) - 1 },
    end: { line: parseInt(lineNum!) - 1, character: parseInt(endChar!) - 1 }
  };
}

function parseRangesFromContent(content: string): Range[] {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const ranges: Range[] = [];
  
  for (const line of lines) {
    const range = parseRangeFromContent(line);
    if (range) {
      ranges.push(range);
    }
  }
  
  return ranges;
}

function processFileWithMarker(content: string): TestFile {
  const markerStart = '###';
  const markerEnd = '###';
  
  const startIndex = content.indexOf(markerStart);
  const endIndex = content.indexOf(markerEnd, startIndex + markerStart.length);
  
  if (startIndex === -1 || endIndex === -1) {
    return {
      content,
      requestPosition: { line: 0, character: 0 }
    };
  }

  // Remove the markers from content
  const beforeMarker = content.substring(0, startIndex);
  const markedContent = content.substring(startIndex + markerStart.length, endIndex);
  const afterMarker = content.substring(endIndex + markerEnd.length);
  const cleanContent = beforeMarker + markedContent + afterMarker;

  // Calculate request position - position in the middle of the marked content
  const beforeCursor = beforeMarker;
  const lines = beforeCursor.split('\n');
  const line = lines.length - 1;
  const lastLine = lines[lines.length - 1];
  const baseCharacter = lastLine ? lastLine.length : 0;
  
  // Position in the middle of the marked content
  const character = baseCharacter + Math.floor(markedContent.length / 2);

  console.log(`Debug - Marker processing:`);
  console.log(`  Marked content: "${markedContent}"`);
  console.log(`  Base character: ${baseCharacter}`);
  console.log(`  Final position: line ${line}, character ${character}`);

  return {
    content: cleanContent,
    requestPosition: { line, character }
  };
}

function rangesEqual(range1: Range, range2: Range): boolean {
  return range1.start.line === range2.start.line &&
         range1.start.character === range2.start.character &&
         range1.end.line === range2.end.line &&
         range1.end.character === range2.end.character;
}

function rangeToString(range: Range): string {
  // Convert back to 1-indexed for display
  return `${range.start.line + 1}:${range.start.character + 1}-${range.end.character + 1}`;
}

function normalizeUri(uri: string): string {
  // Normalize URI for comparison by converting to lowercase and using forward slashes
  return uri.toLowerCase().replace(/\\/g, '/');
}