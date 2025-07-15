/**
 * Generator for experiment control flow definitions.
 * Converts experiment control flow models into executable control definitions.
 */

import { ControlDefinition, TransitionDefinition } from '../models/ArtifactModel.js';
import { ExperimentModel } from '../models/ExperimentModel.js';

/**
 * Generates control flow definitions for experiment artifacts.
 * Handles both explicit control flows and default flow generation.
 */
export class ControlFlowGenerator {
  /**
   * Generates a control flow definition from an experiment model.
   *
   * @param experiment - The experiment model containing control flow information
   * @returns Control definition for the artifact
   */
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

  /**
   * Creates a default control flow when none is explicitly defined.
   *
   * @param experiment - The experiment model
   * @returns Default control definition (linear flow for multiple spaces, direct flow for single space)
   */
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
