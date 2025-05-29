import { UserInputProvider } from './UserInputProvider.js';

export class ConsoleInputProvider implements UserInputProvider {
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
