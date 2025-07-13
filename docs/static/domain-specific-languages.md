---
title: Domain-Specific Languages
group: Documentation
category: User Guide
children:
    - xxp-language-reference.md
    - espace-language-reference.md
---

# Domain-Specific Languages

ExtremeXP introduces two core Domain-Specific Languages (DSLs), **XXP** (eXperiment eXecution Plan) and **ESPACE** (Experiment Space), specifically designed for defining and managing data-driven experiments. These languages provide a structured, readable, and reproducible approach to experiment definition, while offering the flexibility needed for complex scientific workflows.

They work complementarily: XXP defines the static structure and dependencies of an experiment workflow, while ESPACE builds upon these definitions to specify parameter variations, execution strategies, and conditional flows for comprehensive experimentation.

## File Naming and Structure Constraints

To ensure proper recognition and processing by the ExtremeXP tools, adhere to the following critical file naming and structure rules:

* **Workflow/Experiment Name vs. Filename**:
    * The identifier declared within an XXP `workflow` (e.g., `workflow MyAnalysis`) or an ESPACE `experiment` (e.g., `experiment HyperparameterOptimization`) must be in **CapitalizedCase** (or PascalCase).
    * The corresponding filename (without the extension) must be the **camelCase** version of this identifier.
    * **Example**: A workflow declared as `workflow DataProcessing` must be saved as `dataProcessing.xxp`. An experiment declared as `experiment MLOptimization` must be saved as `mlOptimization.espace`.
* **One Definition Per File**: Each `.xxp` file must contain exactly one `workflow` definition, and each `.espace` file must contain exactly one `experiment` definition.
* **Case Sensitivity**: Identifiers (workflow names, task names, data names, parameter names) and keywords within the files are case-sensitive. Filenames are also treated as case-sensitive by the ExtremeXP system to ensure precise matching with internal identifiers.
    * **Example**: `DataProcessing.xxp` and `dataprocessing.xxp` are considered different files by the system. Ensure your filename strictly follows the camelCase rule derived from the CapitalizedCase identifier.

## Next Steps

To dive deeper into each language:

* Explore the [XXP Language Reference](xxp-language-reference.md) to define your core experiment workflows.
* Learn about the [ESPACE Language Reference](espace-language-reference.md) to create sophisticated experiment spaces and control execution.