import {
  ExperimentModel,
  SpaceModel,
  ParameterDefinition,
  ExpressionType,
} from '../models/ExperimentModel.js';

export interface ParameterCombination {
  spaceId: string;
  combinations: Record<string, ExpressionType>[];
}

export class ParameterResolver {
  resolve(experiment: ExperimentModel): ParameterCombination[] {
    const results: ParameterCombination[] = [];

    for (const space of experiment.spaces) {
      const combinations = this.generateParameterCombinations(space);
      results.push({
        spaceId: space.name,
        combinations,
      });
    }

    return results;
  }

  private generateParameterCombinations(space: SpaceModel): Record<string, ExpressionType>[] {
    const parameterSets = this.collectParameterSets(space);

    if (space.strategy === 'gridsearch') {
      return this.generateGridSearchCombinations(parameterSets);
    } else if (space.strategy === 'randomsearch') {
      return this.generateRandomSearchCombinations(parameterSets);
    } else {
      throw new Error(`Unknown strategy: ${space.strategy}`);
    }
  }

  private collectParameterSets(space: SpaceModel): Map<string, ExpressionType[]> {
    const parameterSets = new Map<string, ExpressionType[]>();

    // Collect space-level parameters
    for (const param of space.parameters) {
      parameterSets.set(param.name, this.expandParameterValues(param));
    }

    // Collect task-level parameters with prefixed names
    for (const taskConfig of space.taskConfigurations) {
      for (const param of taskConfig.parameters) {
        const prefixedName = `${taskConfig.taskName}:${param.name}`;
        parameterSets.set(prefixedName, this.expandParameterValues(param));
      }
    }

    return parameterSets;
  }

  private expandParameterValues(param: ParameterDefinition): ExpressionType[] {
    switch (param.type) {
      case 'enum':
        return param.values;

      case 'range': {
        if (param.values.length !== 3) {
          throw new Error(`Range parameter must have exactly 3 values, got ${param.values.length}`);
        }

        const [min, max, step] = param.values;
        if (typeof min !== 'number' || typeof max !== 'number' || typeof step !== 'number') {
          throw new Error('Range parameter values must be numbers');
        }

        const values: number[] = [];
        for (let value = min; value <= max; value += step) {
          // Handle floating point precision issues
          values.push(Math.round(value * 10000) / 10000);
        }
        return values;
      }

      case 'value':
        return [param.values[0]!];

      default:
        throw new Error(`Unknown parameter type: ${param.type}`);
    }
  }

  private generateGridSearchCombinations(
    parameterSets: Map<string, ExpressionType[]>
  ): Record<string, ExpressionType>[] {
    const paramNames = Array.from(parameterSets.keys());
    const paramValues = paramNames.map(name => parameterSets.get(name)!);

    if (paramNames.length === 0) {
      return [{}];
    }

    const combinations: Record<string, ExpressionType>[] = [];

    const generateCombination = (index: number, current: Record<string, ExpressionType>) => {
      if (index === paramNames.length) {
        combinations.push({ ...current });
        return;
      }

      const paramName = paramNames[index]!;
      const values = paramValues[index]!;

      for (const value of values) {
        current[paramName] = value;
        generateCombination(index + 1, current);
      }
    };

    generateCombination(0, {});
    return combinations;
  }

  private generateRandomSearchCombinations(
    parameterSets: Map<string, ExpressionType[]>,
    count: number = 10
  ): Record<string, ExpressionType>[] {
    const paramNames = Array.from(parameterSets.keys());
    const combinations: Record<string, ExpressionType>[] = [];

    for (let i = 0; i < count; i++) {
      const combination: Record<string, ExpressionType> = {};

      for (const paramName of paramNames) {
        const values = parameterSets.get(paramName)!;
        const randomIndex = Math.floor(Math.random() * values.length);
        combination[paramName] = values[randomIndex]!;
      }

      combinations.push(combination);
    }

    return combinations;
  }
}
