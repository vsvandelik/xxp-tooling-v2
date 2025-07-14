/**
 * ANTLR visitor for converting ESPACE parse trees to experiment models.
 * Implements the visitor pattern to transform parsed ESPACE syntax into structured data models.
 */

import { ESPACEVisitor } from '@extremexp/core';
import {
  ControlBlockContext,
  ControlChainElementContext,
  DataDefinitionContext,
  ExperimentDeclarationContext,
  ExpressionContext,
  ParamDefinitionContext,
  ParamValueContext,
  SpaceDeclarationContext,
  TaskConfigurationContext,
} from '@extremexp/core/src/language/generated/ESPACEParser';

import {
  ControlFlow,
  DataDefinition,
  ExperimentModel,
  ExpressionType,
  ParameterDefinition,
  SpaceModel,
  TaskConfiguration,
  Transition,
} from '../models/ExperimentModel.js';

/**
 * ANTLR visitor that converts ESPACE parse trees into experiment models.
 * Traverses the parse tree and builds structured data models representing the experiment.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ExperimentModelVisitor extends ESPACEVisitor<any> {
  override visitExperimentDeclaration = (ctx: ExperimentDeclarationContext): ExperimentModel => {
    const header = ctx.experimentHeader();
    const body = ctx.experimentBody();

    const experimentName = header.IDENTIFIER().getText();
    const spaces: SpaceModel[] = [];
    const dataDefinitions: DataDefinition[] = [];
    let controlFlow: ControlFlow | null = null;

    for (const content of body.experimentContent()) {
      if (content.spaceDeclaration()) {
        spaces.push(this.visit(content.spaceDeclaration()!));
      } else if (content.controlBlock()) {
        controlFlow = this.visit(content.controlBlock()!);
      } else if (content.dataDefinition()) {
        dataDefinitions.push(this.visit(content.dataDefinition()!));
      }
    }

    // TODO: Error when some of the parts are not defined

    return new ExperimentModel(experimentName, spaces, dataDefinitions, controlFlow);
  };

  override visitSpaceDeclaration = (ctx: SpaceDeclarationContext): SpaceModel => {
    const header = ctx.spaceHeader();
    const body = ctx.spaceBody();

    const spaceName = header.IDENTIFIER().getText();
    const workflowName = header.workflowNameRead().IDENTIFIER().getText();

    const parameters: ParameterDefinition[] = [];
    const taskConfigurations: TaskConfiguration[] = [];
    const dataDefinitions: DataDefinition[] = [];
    let strategy = 'gridsearch';

    for (const content of body.spaceContent()) {
      if (content.strategyStatement()) {
        strategy = content.strategyStatement()!.strategyName().getText();
      } else if (content.paramDefinition()) {
        parameters.push(this.visit(content.paramDefinition()!));
      } else if (content.taskConfiguration()) {
        taskConfigurations.push(this.visit(content.taskConfiguration()!));
      } else if (content.dataDefinition()) {
        dataDefinitions.push(this.visit(content.dataDefinition()!));
      }
    }

    return new SpaceModel(
      spaceName,
      workflowName,
      strategy,
      parameters,
      taskConfigurations,
      dataDefinitions
    );
  };

  override visitParamDefinition = (ctx: ParamDefinitionContext): ParameterDefinition => {
    const paramName = ctx.IDENTIFIER().getText();
    const paramValue = this.visit(ctx.paramValue());

    return new ParameterDefinition(paramName, paramValue.type, paramValue.values);
  };

  override visitParamValue = (
    ctx: ParamValueContext
  ): { type: string; values: ExpressionType[] } => {
    if (ctx.enumFunction()) {
      const expressions = ctx.enumFunction()!.expression();
      const values = expressions.map((expr: ExpressionContext) => this.parseExpression(expr));
      return { type: 'enum', values };
    } else if (ctx.rangeFunction()) {
      const numbers = ctx.rangeFunction()!.NUMBER();

      if (numbers.length !== 3) {
        throw new Error('Range function must have exactly three numbers');
      }

      const min = parseFloat(numbers[0]!.getText());
      const max = parseFloat(numbers[1]!.getText());
      const step = parseFloat(numbers[2]!.getText());
      return { type: 'range', values: [min, max, step] };
    } else if (ctx.expression()) {
      const value = this.parseExpression(ctx.expression()!);
      return { type: 'value', values: [value] };
    }

    throw new Error('Unknown parameter value type');
  };

  override visitTaskConfiguration = (ctx: TaskConfigurationContext): TaskConfiguration => {
    const header = ctx.taskConfigurationHeader();
    const body = ctx.taskConfigurationBody();

    const taskName = header.taskNameRead().IDENTIFIER().getText();
    const parameters: ParameterDefinition[] = [];

    for (const content of body.configurationContent()) {
      if (content.paramAssignment()) {
        const paramAssignment = content.paramAssignment();
        const paramName = paramAssignment.IDENTIFIER().getText();
        const paramValue = this.visit(paramAssignment.paramValue());
        parameters.push(new ParameterDefinition(paramName, paramValue.type, paramValue.values));
      }
    }

    return new TaskConfiguration(taskName, parameters);
  };

  override visitControlBlock = (ctx: ControlBlockContext): ControlFlow => {
    const body = ctx.controlBody();
    const transitions: Transition[] = [];

    for (const content of body.controlContent()) {
      if (!content.simpleTransition() && !content.conditionalTransition()) {
        throw new Error('Invalid control flow content');
      }
      if (content.simpleTransition()) {
        const simpleTransition = content.simpleTransition();
        const controlChainElements = simpleTransition?.controlChainElement() || [];
        const spaceNames: string[] = [];

        for (const element of controlChainElements) {
          if (element.spaceNameRead()) {
            spaceNames.push(element.spaceNameRead()!.IDENTIFIER().getText());
          } else if (element.START()) {
            spaceNames.push('START');
          } else if (element.END()) {
            spaceNames.push('END');
          }
        }

        if (spaceNames.length < 2) {
          throw new Error('Simple transition must have at least two spaces');
        }
        for (let i = 0; i < spaceNames.length - 1; i++) {
          transitions.push(new Transition(spaceNames[i]!, spaceNames[i + 1]!));
        }
      } else if (content.conditionalTransition()) {
        const conditionalTransition = content.conditionalTransition();

        if (
          !conditionalTransition!.conditionalTransitionHeader() ||
          !conditionalTransition!.conditionalTransitionBody()
        ) {
          throw new Error('Invalid conditional transition structure');
        }

        const header = conditionalTransition!.conditionalTransitionHeader();
        const body = conditionalTransition!.conditionalTransitionBody();

        const controlChainElements = header.controlChainElement();
        if (controlChainElements.length !== 2) {
          throw new Error('Conditional transition must have exactly two spaces');
        }

        const fromSpace = this.getSpaceNameFromControlChainElement(controlChainElements[0]!);
        const toSpace = this.getSpaceNameFromControlChainElement(controlChainElements[1]!);

        const conditions = body.condition().map(cond => cond.STRING().getText().slice(1, -1)); // Remove quotes

        for (const condition of conditions) {
          transitions.push(new Transition(fromSpace, toSpace, condition));
        }
      }
    }

    return new ControlFlow(transitions);
  };

  override visitDataDefinition = (ctx: DataDefinitionContext): DataDefinition => {
    const name = ctx.IDENTIFIER().getText();
    const value = ctx.STRING().getText().slice(1, -1); // Remove quotes
    return new DataDefinition(name, value);
  };

  private parseExpression(ctx: ExpressionContext): ExpressionType {
    if (ctx.NUMBER()) {
      const text = ctx.NUMBER()!.getText();
      return text.includes('.') ? parseFloat(text) : parseInt(text);
    } else if (ctx.STRING()) {
      return ctx.STRING()!.getText().slice(1, -1); // Remove quotes
    } else if (ctx.BOOLEAN()) {
      return ctx.BOOLEAN()!.getText() === 'true';
    }
    throw new Error('Unknown expression type');
  }

  /**
   * Helper method to extract space name from ControlChainElement
   */
  private getSpaceNameFromControlChainElement(element: ControlChainElementContext): string {
    if (element.spaceNameRead()) {
      return element.spaceNameRead()!.IDENTIFIER().getText();
    } else if (element.START()) {
      return 'START';
    } else if (element.END()) {
      return 'END';
    } else {
      throw new Error('Invalid control chain element');
    }
  }
}
