import { ParseTree } from 'antlr4ng';
import { ESPACEVisitor } from '@extremexp/core';
import { DocumentAnalysis, ExperimentAnalysis, Reference } from '../types/AnalysisTypes.js';
import { Symbol } from './SymbolTable.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class ESPACEAnalyzer extends ESPACEVisitor<any> {
  private uri: string = '';
  private symbols: Symbol[] = [];
  private references: Reference[] = [];
  private imports: string[] = [];
  private experiment: ExperimentAnalysis | undefined;

  analyze(parseTree: ParseTree, uri: string): DocumentAnalysis {
    this.uri = uri;
    this.symbols = [];
    this.references = [];
    this.imports = [];
    this.experiment = undefined;

    // Visit the parse tree
    this.visit(parseTree);

    return {
      uri,
      languageId: 'espace',
      symbols: this.symbols,
      references: this.references,
      imports: this.imports,
      experiment: this.experiment,
    };
  }

  override visitExperimentDeclaration = (ctx: any): any => {
    const name = ctx.experimentHeader().IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.experimentHeader().IDENTIFIER());

    // Create experiment symbol
    const experimentSymbol: Symbol = {
      name,
      type: 'experiment',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: 'global',
    };

    this.symbols.push(experimentSymbol);

    // Create experiment analysis
    this.experiment = {
      name,
      nameRange,
      spaces: [],
      dataDefinitions: [],
    };

    // Visit experiment body
    this.visitChildren(ctx);

    // Store experiment data in symbol
    experimentSymbol.data = this.experiment;

    return null;
  };

  override visitSpaceDeclaration = (ctx: any): any => {
    const name = ctx.spaceHeader().IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.spaceHeader().IDENTIFIER());

    const workflowName = ctx.spaceHeader().workflowNameRead().IDENTIFIER().getText();
    const workflowNameRange = ASTUtils.getNodeRange(ctx.spaceHeader().workflowNameRead());

    // Add workflow import
    this.imports.push(workflowName);

    // Add workflow reference
    this.references.push({
      name: workflowName,
      type: 'workflow',
      scope: 'global',
      range: workflowNameRange,
      isDefinition: false,
    });

    // Create space symbol
    this.symbols.push({
      name,
      type: 'space',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: this.experiment?.name || 'global',
    });

    // Create space analysis
    const spaceAnalysis: any = {
      name,
      nameRange,
      workflowName,
      workflowNameRange,
      strategy: 'gridsearch', // default
      strategyRange: nameRange, // placeholder
      parameters: [],
      taskConfigurations: [],
    };

    // Process space body
    const body = ctx.spaceBody();
    for (const content of body.spaceContent()) {
      if (content.strategyStatement()) {
        spaceAnalysis.strategy = content.strategyStatement().IDENTIFIER().getText();
        spaceAnalysis.strategyRange = ASTUtils.getNodeRange(
          content.strategyStatement().IDENTIFIER()
        );
      } else if (content.paramDefinition()) {
        this.handleParamDefinition(content.paramDefinition(), spaceAnalysis);
      } else if (content.taskConfiguration()) {
        this.visitSpaceTaskConfiguration(content.taskConfiguration(), spaceAnalysis);
      } else if (content.dataDefinition()) {
        this.handleSpaceDataDefinition(content.dataDefinition(), spaceAnalysis);
      }
    }

    if (this.experiment) {
      this.experiment.spaces.push(spaceAnalysis);
    }

    return this.visitChildren(ctx);
  };

  override visitControlBlock = (ctx: any): any => {
    if (!this.experiment) return this.visitChildren(ctx);

    const transitions: any[] = [];
    const body = ctx.controlBody();

    for (const content of body.controlContent()) {
      if (content.simpleTransition()) {
        this.processSimpleTransition(content.simpleTransition(), transitions);
      } else if (content.conditionalTransition()) {
        this.processConditionalTransition(content.conditionalTransition(), transitions);
      }
    }

    this.experiment.controlFlow = {
      transitions,
      range: ASTUtils.getNodeRange(ctx),
    };

    return this.visitChildren(ctx);
  };

  override visitDataDefinition = (ctx: any): any => {
    const name = ctx.IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());
    const value = ctx.STRING().getText().slice(1, -1);
    const valueRange = ASTUtils.getNodeRange(ctx.STRING());

    // Create data symbol
    this.symbols.push({
      name,
      type: 'data',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: this.experiment?.name || 'global',
    });

    // Add to experiment analysis
    if (this.experiment) {
      this.experiment.dataDefinitions.push({
        name,
        nameRange,
        value,
        valueRange,
      });
    }

    return this.visitChildren(ctx);
  };

  private handleParamDefinition(ctx: any, spaceAnalysis: any): void {
    const name = ctx.IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    let type: string = 'value';
    const values: any[] = [];

    const paramValue = ctx.paramValue();
    if (paramValue.enumFunction()) {
      type = 'enum';
      // Extract enum values
    } else if (paramValue.rangeFunction()) {
      type = 'range';
      // Extract range values
    } else if (paramValue.expression()) {
      type = 'value';
      // Extract single value
    }

    spaceAnalysis.parameters.push({
      name,
      nameRange,
      type,
      values,
      range: ASTUtils.getNodeRange(ctx),
    });

    // Create parameter symbol
    this.symbols.push({
      name,
      type: 'parameter',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: `${this.experiment?.name}:${spaceAnalysis.name}`,
    });
  }

  private visitSpaceTaskConfiguration(ctx: any, spaceAnalysis: any): void {
    const taskName = ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER().getText();
    const taskNameRange = ASTUtils.getNodeRange(
      ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER()
    );

    // Add task reference
    this.references.push({
      name: taskName,
      type: 'task',
      scope: spaceAnalysis.workflowName,
      range: taskNameRange,
      isDefinition: false,
    });

    const taskConfig: any = {
      taskName,
      taskNameRange,
      parameters: [],
      range: ASTUtils.getNodeRange(ctx),
    };

    // Process configuration body
    const body = ctx.taskConfigurationBody();
    for (const content of body.configurationContent()) {
      if (content.paramAssignment()) {
        const paramName = content.paramAssignment().IDENTIFIER().getText();
        const paramRange = ASTUtils.getNodeRange(content.paramAssignment().IDENTIFIER());

        taskConfig.parameters.push({
          name: paramName,
          nameRange: paramRange,
          type: 'value',
          values: [],
          range: ASTUtils.getNodeRange(content.paramAssignment()),
        });
      }
    }

    spaceAnalysis.taskConfigurations.push(taskConfig);
  }

  private handleSpaceDataDefinition(ctx: any, spaceAnalysis: any): void {
    const name = ctx.IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());
    const value = ctx.STRING().getText().slice(1, -1);
    const valueRange = ASTUtils.getNodeRange(ctx.STRING());

    // Create data symbol with space scope
    this.symbols.push({
      name,
      type: 'data',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: `${this.experiment?.name}:${spaceAnalysis.name}`,
    });

    // Add to space data definitions
    if (!spaceAnalysis.dataDefinitions) {
      spaceAnalysis.dataDefinitions = [];
    }
    spaceAnalysis.dataDefinitions.push({
      name,
      nameRange,
      value,
      valueRange,
    });
  }

  private processSimpleTransition(ctx: any, transitions: any[]): void {
    const spaceNames = ctx.spaceNameRead();

    for (let i = 0; i < spaceNames.length - 1; i++) {
      const fromNode = spaceNames[i];
      const toNode = spaceNames[i + 1];
      const from = fromNode.IDENTIFIER().getText();
      const to = toNode.IDENTIFIER().getText();

      transitions.push({
        from,
        to,
        range: ASTUtils.getNodeRange(ctx),
      });

      // Add space references
      if (from !== 'START' && from !== 'END') {
        this.references.push({
          name: from,
          type: 'space',
          scope: this.experiment?.name || 'global',
          range: ASTUtils.getNodeRange(fromNode),
          isDefinition: false,
        });
      }

      if (to !== 'START' && to !== 'END') {
        this.references.push({
          name: to,
          type: 'space',
          scope: this.experiment?.name || 'global',
          range: ASTUtils.getNodeRange(toNode),
          isDefinition: false,
        });
      }
    }
  }

  private processConditionalTransition(ctx: any, transitions: any[]): void {
    const header = ctx.conditionalTransitionHeader();
    const from = header.spaceNameRead()[0].IDENTIFIER().getText();
    const to = header.spaceNameRead()[1].IDENTIFIER().getText();

    const body = ctx.conditionalTransitionBody();
    for (const condition of body.condition()) {
      const conditionText = condition.STRING().getText().slice(1, -1);

      transitions.push({
        from,
        to,
        condition: conditionText,
        range: ASTUtils.getNodeRange(ctx),
      });
    }

    // Add space references
    if (from !== 'START' && from !== 'END') {
      this.references.push({
        name: from,
        type: 'space',
        scope: this.experiment?.name || 'global',
        range: ASTUtils.getNodeRange(header.spaceNameRead()[0].IDENTIFIER()),
        isDefinition: false,
      });
    }

    if (to !== 'START' && to !== 'END') {
      this.references.push({
        name: to,
        type: 'space',
        scope: this.experiment?.name || 'global',
        range: ASTUtils.getNodeRange(header.spaceNameRead()[1].IDENTIFIER()),
        isDefinition: false,
      });
    }
  }
}