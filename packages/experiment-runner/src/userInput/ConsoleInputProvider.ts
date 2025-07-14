/**
 * Console-based user input provider implementation.
 * Provides user input functionality through command-line interface
 * using Node.js readline for interactive prompts.
 */

import { UserInputProvider } from './UserInputProvider.js';

/**
 * Console-based implementation of user input provider.
 * Uses Node.js readline interface to prompt users for input
 * during experiment execution through the command line.
 */
export class ConsoleInputProvider implements UserInputProvider {
  /**
   * Prompts the user for input through the console.
   * Creates a readline interface and waits for user input.
   * 
   * @param prompt - Message to display to the user
   * @returns Promise resolving to the user's input string
   */
  async getInput(prompt: string): Promise<string> {
    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    return new Promise(resolve => {
      rl.question(prompt + ' ', answer => {
        rl.close();
        resolve(answer);
      });
    });
  }
}
