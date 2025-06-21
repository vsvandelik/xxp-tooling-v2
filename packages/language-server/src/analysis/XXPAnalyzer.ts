import { ParseTree } from 'antlr4ng';
import { XXPVisitor } from '@extremexp/core';
import { 
  DocumentAnalysis, 
  WorkflowAnalysis, 
  TaskAnalysis,
  Reference 
} from '../types/AnalysisTypes.js';
import { Symbol } from './SymbolTable.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class XXPAnalyzer extends XXPVisitor<any> {
  private uri: string = '';
  private symbols: Symbol[] = [];
  private references: Reference[] = [];
  private imports: string[] = [];
  private workflow: WorkflowAnalysis | undefined;

  analyze(parseTree: ParseTree, uri: string): DocumentAnalysis {
    this.uri = uri;
    this.symbols = [];
    this.references = [];
    this.imports = [];
    this.workflow = undefined;

    // Visit the parse tree
    this.visit(parseTree);

    return {
      uri,
      languageId: 'xxp',
      symbols: this.symbols,
      references: this.references,
      imports: this.imports,
      workflow: this.workflow,
    };
  }

  visitWorkflowDeclaration(ctx: any): any {
    const name = ctx.workflowHeader().IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.workflowHeader().IDENTIFIER());
    
    let parentWorkflow: string | undefined;
    let parentWorkflowRange: any | undefined;
    
    if (ctx.workflowHeader().workflowNameRead()) {
      parentWorkflow = ctx.workflowHeader().workflowNameRead().IDENTIFIER().getText();
      parentWorkflowRange = ASTUtils.getNodeRange(
        ctx.workflowHeader().workflowNameRead().IDENTIFIER()
      );
      
      // Add parent workflow to imports
      this.imports.push(parentWorkflow);
      
      // Add reference to parent workflow
      this.references.push({
        name: parentWorkflow,
        type: 'workflow',
        scope: 'global',
        range: parentWorkflowRange,
        isDefinition: false,
      });
    }

    // Create workflow symbol
    const workflowSymbol: Symbol = {
      name,
      type: 'workflow',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: 'global',
    };

    this.symbols.push(workflowSymbol);

    // Create workflow analysis
    this.workflow = {
      name,
      nameRange,
      parentWorkflow,
      parentWorkflowRange,
      tasks: [],
      data: [],
    };

    // Visit workflow body
    this.visitChildren(ctx);

    // Store workflow data in symbol
    workflowSymbol.data = {
      name: this.workflow.name,
      uri: this.uri,
      parentWorkflow: this.workflow.parentWorkflow,
      tasks: this.workflow.tasks.map(t => ({
        name: t.name,
        implementation: t.implementation,
        parameters: t.parameters,
        inputs: t.inputs,
        outputs: t.outputs,
        definitionLocation: {
          uri: this.uri,
          range: t.nameRange,
        },
      })),
      data: this.workflow.data,
      taskChain: this.workflow.taskChain,
    };

    return null;
  }

  visitTaskDefinition(ctx: any): any {
    const name = ctx.IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    // Create task symbol
    const taskSymbol: Symbol = {
      name,
      type: 'task',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: this.workflow?.name || 'global',
    };

    this.symbols.push(taskSymbol);

    // Add to workflow analysis
    if (this.workflow) {
      const taskAnalysis: TaskAnalysis = {
        name,
        nameRange,
        parameters: [],
        inputs: [],
        outputs: [],
      };
      this.workflow.tasks.push(taskAnalysis);
    }

    return null;
  }

  visitTaskConfiguration(ctx: any): any {
    const taskName = ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER().getText();
    
    // Find the task in workflow
    const task = this.workflow?.tasks.find(t => t.name === taskName);
    if (!task) return null;

    // Process configuration content
    const body = ctx.taskConfigurationBody();
    for (const content of body.configurationContent()) {
      if (content.implementation()) {
        task.implementation = content.implementation().STRING().getText().slice(1, -1);
        task.implementationRange = ASTUtils.getNodeRange(content.implementation().STRING());
      } else if (content.paramAssignment()) {
        const paramName = content.paramAssignment().IDENTIFIER().getText();
        const paramRange = ASTUtils.getNodeRange(content.paramAssignment());
        
        task.parameters.push({
          name: paramName,
          range: paramRange,
          required: !content.paramAssignment().expression(),
          hasDefault: !!content.paramAssignment().expression(),
        });
        
        // Create parameter symbol
        this.symbols.push({
          name: paramName,
          type: 'parameter',
          kind: 'definition',
          uri: this.uri,
          range: paramRange,
          scope: `${this.workflow?.name}:${taskName}`,
        });
      } else if (content.inputStatement()) {
        const dataNames = content.inputStatement().dataNameList().dataNameRead();
        for (const dataName of dataNames) {
          const name = dataName.IDENTIFIER().getText();
          task.inputs.push(name);
          
          if (!task.inputRanges) task.inputRanges = {};
          task.inputRanges[name] = ASTUtils.getNodeRange(dataName.IDENTIFIER());
          
          // Add data reference
          this.references.push({
            name,
            type: 'data',
            scope: this.workflow?.name || 'global',
            range: ASTUtils.getNodeRange(dataName.IDENTIFIER()),
            isDefinition: false,
          });
        }
      } else if (content.outputStatement()) {
        const dataNames = content.outputStatement().dataNameList().dataNameRead();
        for (const dataName of dataNames) {
          const name = dataName.IDENTIFIER().getText();
          task.outputs.push(name);
          
          if (!task.outputRanges) task.outputRanges = {};
          task.outputRanges[name] = ASTUtils.getNodeRange(dataName.IDENTIFIER());
          
          // Create data symbol for output
          this.symbols.push({
            name,
            type: 'data',
            kind: 'definition',
            uri: this.uri,
            range: ASTUtils.getNodeRange(dataName.IDENTIFIER()),
            scope: this.workflow?.name || 'global',
          });
        }
      }
    }

    return null;
  }

  visitTaskChain(ctx: any): any {
    if (!this.workflow) return null;

    const elements: string[] = [];
    const elementRanges: Record<string, any> = {};

    for (const element of ctx.chainElement()) {
      let name: string;
      
      if (element.START()) {
        name = 'START';
      } else if (element.END()) {
        name = 'END';
      } else if (element.taskNameRead()) {
        name = element.taskNameRead().IDENTIFIER().getText();
        
        // Add task reference
        this.references.push({
          name,
          type: 'task',
          scope: this.workflow.name,
          range: ASTUtils.getNodeRange(element.taskNameRead().IDENTIFIER()),
          isDefinition: false,
        });
      } else {
        continue;
      }
      
      elements.push(name);
      elementRanges[name] = ASTUtils.getNodeRange(element);
    }

    this.workflow.taskChain = {
      elements,
      elementRanges,
      range: ASTUtils.getNodeRange(ctx),
    };

    return null;
  }

  visitDataDefinition(ctx: any): any {
    const name = ctx.IDENTIFIER().getText();
    const nameRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());
    
    let value: string | undefined;
    let valueRange: any | undefined;
    
    if (ctx.STRING()) {
      value = ctx.STRING().getText().slice(1, -1);
      valueRange = ASTUtils.getNodeRange(ctx.STRING());
    }

    // Create data symbol
    this.symbols.push({
      name,
      type: 'data',
      kind: 'definition',
      uri: this.uri,
      range: ASTUtils.getNodeRange(ctx),
      selectionRange: nameRange,
      scope: this.workflow?.name || 'global',
    });

    // Add to workflow analysis
    if (this.workflow) {
      this.workflow.data.push({
        name,
        nameRange,
        value,
        valueRange,
      });
    }

    return null;
  }
}
