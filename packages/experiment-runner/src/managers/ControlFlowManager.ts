/**
 * @fileoverview Control flow manager for experiment execution flow.
 * Handles transition logic between spaces, condition evaluation,
 * and state persistence for experiment resumption.
 */

import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Transition } from '../types/artifact.types.js';
import { UserInputProvider } from '../userInput/UserInputProvider.js';

/**
 * Manager responsible for controlling experiment execution flow.
 * Evaluates transition conditions, determines next spaces to execute,
 * and manages control state for resumption capabilities.
 */
export class ControlFlowManager {
  /**
   * Creates a new control flow manager.
   * 
   * @param repository - Database repository for state persistence
   * @param progress - Progress emitter for status updates
   * @param userInputProvider - Provider for user input during condition evaluation
   */
  constructor(
    private repository: DatabaseRepository,
    private progress: ProgressEmitter,
    private userInputProvider: UserInputProvider
  ) {}

  /**
   * Determines the next space to execute based on transition conditions.
   * Evaluates transition conditions and handles user input for dynamic decisions.
   * 
   * @param runId - Unique identifier for the experiment run
   * @param currentSpace - Current space being executed
   * @param transitions - Array of possible transitions from current space
   * @returns Promise resolving to next space ID or 'END' if no valid transitions
   * @throws Error if condition evaluation fails
   */
  async getNextSpace(
    runId: string,
    currentSpace: string,
    transitions: Transition[]
  ): Promise<string> {
    const spaceTransitions = transitions.filter(t => t.from === currentSpace);

    if (spaceTransitions.length === 0) {
      return 'END';
    }

    if (spaceTransitions.length === 1 && !spaceTransitions[0]!.condition) {
      return spaceTransitions[0]!.to;
    }

    // Evaluate conditions
    for (const transition of spaceTransitions) {
      if (!transition.condition) {
        return transition.to;
      }

      // Create a function that evaluates the condition
      const conditionFunc = new Function('input', `return ${transition.condition}`);

      this.progress.emitUserInputRequired(transition.condition);
      const userInput = await this.userInputProvider.getInput(
        'Enter value for condition evaluation'
      );

      // Create input function that returns the user input
      const inputFunc = () => userInput;

      if (conditionFunc(inputFunc)) {
        return transition.to;
      }
    }

    throw new Error('No transition condition evaluated to true');
  }

  async saveState(runId: string, currentSpace: string): Promise<void> {
    await this.repository.saveControlState(runId, currentSpace);
  }

  async getState(runId: string): Promise<string | null> {
    return await this.repository.getControlState(runId);
  }
}
