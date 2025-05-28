import { ControlDefinition, TransitionDefinition } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';

export class ControlFlowGenerator {
  generate(experiment: ExperimentModel): ControlDefinition {
    if (!experiment.controlFlow) {
      // Create default control flow if none specified
      return this.createDefaultControlFlow(experiment);
    }

    const transitions: TransitionDefinition[] = [];
    let startSpace = '';

    // Find START transition
    for (const transition of experiment.controlFlow.transitions) {
      if (transition.from === 'START') {
        startSpace = transition.to;
      } else {
        transitions.push(
          new TransitionDefinition(transition.from, transition.to, transition.condition)
        );
      }
    }

    // Add remaining transitions
    for (const transition of experiment.controlFlow.transitions) {
      if (transition.from !== 'START') {
        const existing = transitions.find(
          t =>
            t.from === transition.from &&
            t.to === transition.to &&
            t.condition === transition.condition
        );

        if (!existing) {
          transitions.push(
            new TransitionDefinition(transition.from, transition.to, transition.condition)
          );
        }
      }
    }

    return new ControlDefinition(startSpace, transitions);
  }

  private createDefaultControlFlow(experiment: ExperimentModel): ControlDefinition {
    if (experiment.spaces.length === 0) {
      throw new Error('No spaces defined in experiment');
    }

    if (experiment.spaces.length === 1) {
      // Single space - simple flow
      return new ControlDefinition(experiment.spaces[0]!.name, [
        new TransitionDefinition(experiment.spaces[0]!.name, 'END'),
      ]);
    }

    // Multiple spaces - linear flow
    const transitions: TransitionDefinition[] = [];
    const startSpace = experiment.spaces[0]!.name;

    for (let i = 0; i < experiment.spaces.length - 1; i++) {
      transitions.push(
        new TransitionDefinition(experiment.spaces[i]!.name, experiment.spaces[i + 1]!.name)
      );
    }

    // Last space to END
    transitions.push(
      new TransitionDefinition(experiment.spaces[experiment.spaces.length - 1]!.name, 'END')
    );

    return new ControlDefinition(startSpace, transitions);
  }
}
