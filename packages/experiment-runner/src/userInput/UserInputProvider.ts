/**
 * Interface for user input providers.
 * Defines the contract for handling user input requests during experiment execution.
 */

/**
 * Interface for providing user input during experiment execution.
 * Implementations can handle input through various channels (CLI, web, etc.).
 */
export interface UserInputProvider {
  /**
   * Requests input from the user with the given prompt.
   * 
   * @param prompt - Message to display to the user requesting input
   * @returns Promise resolving to the user's input as a string
   */
  getInput(prompt: string): Promise<string>;
}
