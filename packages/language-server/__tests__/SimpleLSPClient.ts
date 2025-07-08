
import { spawn, ChildProcess } from 'child_process';

export interface Position {
  line: number;
  character: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface Location {
  uri: string;
  range: Range;
}

export class SimpleLSPClient {
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
        const output = data.toString();
        // Check for our debug messages before processing LSP messages
        if (output.includes('[REFS]')) {
          console.log('🔍 REFS STDOUT:', output.trim());
        }
        this.buffer += output;
        this.processMessageBuffer();
      });

      this.process.stderr?.on('data', (data) => {
        if (!this.isShuttingDown && !data.toString().includes('Debugger')) {
          const output = data.toString();
          if (output.includes('[REFS]')) {
            console.log('🔍 REFS DEBUG:', output.trim());
          } else if (output.includes('[DEBUG]')) {
            console.log('⚠️ DEBUG:', output.trim());
          } else {
            console.log('Language server stderr:', output);
          }
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
    // Determine language ID based on file extension
    const languageId = uri.toLowerCase().endsWith('.espace') ? 'espace' : 'xxp';
    
    await this.sendNotification('textDocument/didOpen', {
      textDocument: {
        uri,
        languageId,
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
      }, 10000000);
      
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