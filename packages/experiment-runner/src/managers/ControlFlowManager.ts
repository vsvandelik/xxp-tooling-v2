import { DatabaseRepository } from '../database/DatabaseRepository.js';
import { ProgressEmitter } from '../progress/ProgressEmitter.js';
import { Transition } from '../types/artifact.types.js';
import { UserInputProvider } from '../userInput/UserInputProvider.js';

export class ControlFlowManager {
  constructor(
    private repository: DatabaseRepository,
    private progress: ProgressEmitter,
    private userInputProvider: UserInputProvider
  ) {}

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
