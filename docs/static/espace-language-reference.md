---
title: ESPACE Language Reference
group: Documentation
category: User Guide
parent: domain-specific-languages.md
---

# ESPACE Language (Experiment Space)

ESPACE is the complementary language to XXP, enabling you to define and manage complex experimental scenarios by building upon existing XXP workflows. It focuses on exploring parameter spaces, defining multi-level experiments, and implementing conditional execution based on experiment outcomes.

## Purpose and Scope

ESPACE (`.espace` files) allows you to:

* **Parameter Space Exploration**: Systematically define and explore combinations of parameters for your experiments.
* **Conditional Execution**: Implement advanced control flow based on intermediate results or external conditions.
* **Multi-level Experiments**: Structure hierarchical experiments with different stages or phases.
* **Dynamic Adaptation**: Adapt experiment execution based on previous outcomes.

## Language Structure

An ESPACE file defines an `experiment` by referencing one or more XXP workflows and specifying how they should be executed under various conditions and parameter settings.

### Experiment Declaration

Every ESPACE file must begin with an experiment declaration:

```espace
experiment ExperimentName {
    // Experiment content
}
````

  * `ExperimentName`: A unique identifier for your experiment, written in `CapitalizedCase`. The filename must be `camelCase` (e.g., `myExperiment.espace`).

### Core Elements

Within an `experiment` block, you define its components using the following statements:

#### 1\. Space Declarations (`space ... of WorkflowName`)

Defines a specific parameter space based on an existing XXP workflow. Each `space` represents a set of configurations for the workflow it references.

```espace
space HyperparameterTuning of MLPipeline {
    strategy gridsearch;
    param learning_rate = range(0.001, 0.1, 0.01);

    configure task modelTraining {
        param epochs = 100;
    }
}
```

  * `HyperparameterTuning`: A unique name for this parameter space.
  * `of MLPipeline`: Specifies the XXP workflow (`MLPipeline`) that this space will configure and execute.

#### 2\. Strategy Statements (`strategy`)

Defines the exploration strategy for the parameters within a `space`.

```espace
strategy random;
strategy gridsearch;
```

  * `random`: Explores the parameter space by randomly sampling combinations.
  * `gridsearch`: Explores the parameter space by exhaustively testing all combinations of defined parameters.

#### 3\. Parameter Definitions (`param`)

Defines parameter variations within a `space` using specific functions or direct values. These parameters will override or set values for parameters defined in the underlying XXP workflow.

```espace
param learning_rate = range(0.001, 0.1, 0.01);
param batch_size = enum(16, 32, 64);
param optimizer = "adam";
```

  * **Parameter Precedence**: When a parameter is defined in multiple places, the order of precedence is:
    1.  `configure task` block within an ESPACE `space`.
    2.  `param` definition directly within an ESPACE `space`.
    3.  `param` definition within an XXP `configure task` block.
        A more specific definition always overrides a more general one.

#### 4\. Task Configurations (`configure task`) within a `space`

Allows you to override or set specific parameter values for tasks defined in the underlying XXP workflow, *within the context of this specific space*.

```espace
configure task modelTraining {
    param epochs = 100;
    param dropout_rate = range(0.1, 0.5, 0.1);
}
```

  * **Important**: Only `param` values can be specified or overridden within an ESPACE `configure task` block. You cannot change a task's `implementation`, `input`, or `output` within ESPACE; these are defined solely in XXP.

#### 5\. Control Blocks (`control`)

Defines the execution flow of the experiment, including transitions between different `space`s.

```espace
control {
    START -> InitialExploration -> RefinedOptimization -> END; // Simple sequence

    RefinedOptimization -?> FinalValidation { // Conditional transition
        condition "validation_accuracy > 0.9";
        condition "training_time < 3600";
    }
}
```

  * `START` and `END`: Keywords representing the beginning and end of the experiment control flow.
  * `->`: Simple transition, meaning the next space executes unconditionally after the current one completes.
  * `-?>`: Conditional transition. The next space (`FinalValidation`) only executes if all specified `condition`s are met.
  * `condition "..."`: Defines a condition for a conditional transition. The content within the quotes is a string that will be evaluated by the experiment runner.
      * Currently, simple comparisons and the `input()` function are supported (e.g., `condition "input() == 'yes'"`). The `input()` function is used for simple user interaction or predefined external input channels. The exact evaluation environment and available variables depend on the experiment runner's implementation.

#### 6\. Data Definitions (`define data`) within an `experiment` or `space`

Defines experiment-level data variables. These variables *must* be initialized with a string value.

```espace
define data experimentLog = "logs/hyperparameter_experiment.log";
```

  * These are typically used for overall experiment outputs or initial data inputs that apply across the entire experiment. Data variables populated by tasks (e.g., intermediate results) do not need to be explicitly defined here unless they are meant to serve as an initial input for a subsequent space.

### ESPACE Language Examples

#### Basic Parameter Space Example (`HyperparameterOptimization.espace`)

```espace
experiment HyperparameterOptimization {
    define data experimentLog = "logs/hyperparameter_experiment.log";
    define data bestModel = "models/best_model.pkl";

    space MLTraining of SimpleAnalysis {
        strategy gridsearch;

        param learning_rate = range(0.001, 0.1, 0.01);
        param batch_size = enum(16, 32, 64, 128);
        param optimizer = enum("adam", "sgd", "rmsprop");

        configure task machineLearning {
            param algorithm = enum("random_forest", "svm", "neural_network");
            param validation_split = range(0.1, 0.3, 0.1);
        }
    }

    control {
        START -> MLTraining -> END;
    }
}
```

#### Advanced Conditional Experiment (`AdaptiveExperiment.espace`)

```espace
experiment AdaptiveExperiment {
    define data preliminaryResults = "results/preliminary.json";
    define data finalResults = "results/final.json";

    // Initial exploration space
    space InitialExploration of SimpleAnalysis {
        strategy random;

        param learning_rate = range(0.001, 0.1, 0.001);
        param batch_size = enum(16, 32, 64);

        configure task machineLearning {
            param algorithm = enum("random_forest", "svm");
            param max_iter = range(100, 1000, 100);
        }
    }

    // Refined space based on initial results
    space RefinedOptimization of AdvancedAnalysis {
        strategy gridsearch;

        param learning_rate = range(0.01, 0.05, 0.005);
        param batch_size = enum(32, 64);

        configure task machineLearning {
            param algorithm = "neural_network";
            param hidden_layers = range(2, 6, 1);
            param dropout_rate = range(0.1, 0.5, 0.1);
        }
    }

    // Final validation space
    space FinalValidation of AdvancedAnalysis {
        strategy gridsearch;

        param learning_rate = 0.025; // Fixed optimal value
        param batch_size = 64;       // Fixed optimal value

        configure task machineLearning {
            param cross_validation_folds = enum(5, 10);
            param ensemble_size = range(3, 7, 2);
        }
    }

    // Conditional control flow
    control {
        START -> InitialExploration -> RefinedOptimization -> END;

        // Conditional transition to final validation
        RefinedOptimization -?> FinalValidation {
            condition "validation_accuracy > 0.9";
            condition "training_time < 3600";
        }
    }
}
```

### Parameter Functions Reference

These functions are used within ESPACE to define parameter values for exploration.

#### `range(start, end, step)`

Generates a sequence of numeric values.

```espace
param learning_rate = range(0.001, 0.1, 0.01);
```

  * `start`: The starting value (inclusive).
  * `end`: The ending value (exclusive), similar to Python's `range()` function. The sequence will stop before reaching `end`.
  * `step`: The increment between values.
  * **Example**: `range(0.001, 0.03, 0.01)` generates `[0.001, 0.011, 0.021]`.

#### `enum(value1, value2, ...)`

Defines a discrete set of values for a parameter.

```espace
param algorithm = enum("adam", "sgd", "rmsprop");
```

  * `value1, value2, ...`: A comma-separated list of literal values (numbers, strings, booleans).
  * **Example**: `enum(16, 32, 64)` generates `[16, 32, 64]`.

#### Direct Values

You can directly assign a single, fixed value to a parameter.

```espace
param fixed_value = 42;
param string_value = "constant";
param boolean_value = true;
```

### Comments

Both XXP and ESPACE support C-style line comments, starting with `//`:

```espace
experiment MyExperiment {
    // This is a single-line comment
    space MySpace of MyWorkflow {
        // Comments can appear anywhere
        param value = 10; // End-of-line comments too
    }
}
```