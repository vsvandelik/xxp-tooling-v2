export interface UserInputProvider {
  getInput(prompt: string): Promise<string>;
}
