import { ParseTree, ParserRuleContext } from 'antlr4ng';
import { DocumentSymbol, SymbolKind, Range } from 'vscode-languageserver/node.js';
import { XXPVisitor, ESPACEVisitor } from '@extremexp/core';
import { ASTUtils } from '../utils/ASTUtils.js';

export class DocumentSymbols {
  extractSymbols(parseTree: ParseTree, languageId: string): DocumentSymbol[] {
    if (languageId === 'xxp') {
      const extractor = new XXPSymbolExtractor();
      return extractor.extract(parseTree);
    } else if (languageId === 'espace') {
      const extractor = new ESPACESymbolExtractor();
      return extractor.extract(parseTree);
    }
    return [];
  }
}

class XXPSymbolExtractor extends XXPVisitor<DocumentSymbol[]> {
  extract(parseTree: ParseTree): DocumentSymbol[] {
    return this.visit(parseTree) || [];
  }

  handleWorkflowDeclaration(ctx: any): DocumentSymbol[] {
    const name = ctx.workflowHeader().IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.workflowHeader().IDENTIFIER());

    const workflowSymbol: DocumentSymbol = {
      name,
      detail: ctx.workflowHeader().workflowNameRead()
        ? `extends ${ctx.workflowHeader().workflowNameRead().IDENTIFIER().getText()}`
        : undefined,
      kind: SymbolKind.Class,
      range,
      selectionRange,
      children: [],
    };

    // Visit children to get nested symbols
    const body = ctx.workflowBody();
    for (const content of body.workflowContent()) {
      if (content.taskDefinition()) {
        const taskSymbol = this.visitTaskDefinitionSymbol(content.taskDefinition());
        if (taskSymbol) {
          workflowSymbol.children!.push(taskSymbol);
        }
      } else if (content.dataDefinition()) {
        const dataSymbol = this.visitDataDefinitionSymbol(content.dataDefinition());
        if (dataSymbol) {
          workflowSymbol.children!.push(dataSymbol);
        }
      } else if (content.taskChain()) {
        const chainSymbol = this.visitTaskChainSymbol(content.taskChain());
        if (chainSymbol) {
          workflowSymbol.children!.push(chainSymbol);
        }
      } else if (content.taskConfiguration()) {
        const configSymbol = this.visitTaskConfigurationSymbol(content.taskConfiguration());
        if (configSymbol) {
          workflowSymbol.children!.push(configSymbol);
        }
      }
    }

    return [workflowSymbol];
  }

  private visitTaskDefinitionSymbol(ctx: any): DocumentSymbol {
    const name = ctx.IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    return {
      name,
      detail: 'task',
      kind: SymbolKind.Function,
      range,
      selectionRange,
      children: [],
    };
  }

  private visitDataDefinitionSymbol(ctx: any): DocumentSymbol {
    const name = ctx.IDENTIFIER().getText();
    const value = ctx.STRING() ? ctx.STRING().getText() : undefined;
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    return {
      name,
      detail: value ? `= ${value}` : 'data',
      kind: SymbolKind.Variable,
      range,
      selectionRange,
      children: [],
    };
  }

  private visitTaskChainSymbol(ctx: any): DocumentSymbol {
    const elements = ctx.chainElement().map((e: any) => {
      if (e.START()) return 'START';
      if (e.END()) return 'END';
      if (e.taskNameRead()) return e.taskNameRead().IDENTIFIER().getText();
      return '?';
    });

    const range = ASTUtils.getNodeRange(ctx);

    return {
      name: 'Task Chain',
      detail: elements.join(' → '),
      kind: SymbolKind.Event,
      range,
      selectionRange: range,
      children: [],
    };
  }

  private visitTaskConfigurationSymbol(ctx: any): DocumentSymbol {
    const taskName = ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(
      ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER()
    );

    const configSymbol: DocumentSymbol = {
      name: `configure ${taskName}`,
      kind: SymbolKind.Method,
      range,
      selectionRange,
      children: [],
    };

    // Add configuration items as children
    const body = ctx.taskConfigurationBody();
    for (const content of body.configurationContent()) {
      if (content.implementation()) {
        const impl = content.implementation().STRING().getText();
        configSymbol.children!.push({
          name: 'implementation',
          detail: impl,
          kind: SymbolKind.Property,
          range: ASTUtils.getNodeRange(content.implementation()),
          selectionRange: ASTUtils.getNodeRange(content.implementation()),
          children: [],
        });
      } else if (content.paramAssignment()) {
        const paramName = content.paramAssignment().IDENTIFIER().getText();
        configSymbol.children!.push({
          name: paramName,
          detail: 'parameter',
          kind: SymbolKind.Property,
          range: ASTUtils.getNodeRange(content.paramAssignment()),
          selectionRange: ASTUtils.getNodeRange(content.paramAssignment().IDENTIFIER()),
          children: [],
        });
      }
    }

    return configSymbol;
  }
}

class ESPACESymbolExtractor extends ESPACEVisitor<DocumentSymbol[]> {
  extract(parseTree: ParseTree): DocumentSymbol[] {
    return this.visit(parseTree) || [];
  }

  handleExperimentDeclaration(ctx: any): DocumentSymbol[] {
    const name = ctx.experimentHeader().IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.experimentHeader().IDENTIFIER());

    const experimentSymbol: DocumentSymbol = {
      name,
      kind: SymbolKind.Class,
      range,
      selectionRange,
      children: [],
    };

    // Visit children
    const body = ctx.experimentBody();
    for (const content of body.experimentContent()) {
      if (content.spaceDeclaration()) {
        const spaceSymbol = this.visitSpaceDeclarationSymbol(content.spaceDeclaration());
        if (spaceSymbol) {
          experimentSymbol.children!.push(spaceSymbol);
        }
      } else if (content.controlBlock()) {
        const controlSymbol = this.visitControlBlockSymbol(content.controlBlock());
        if (controlSymbol) {
          experimentSymbol.children!.push(controlSymbol);
        }
      } else if (content.dataDefinition()) {
        const dataSymbol = this.visitDataDefinitionSymbol(content.dataDefinition());
        if (dataSymbol) {
          experimentSymbol.children!.push(dataSymbol);
        }
      }
    }

    return [experimentSymbol];
  }

  private visitSpaceDeclarationSymbol(ctx: any): DocumentSymbol {
    const name = ctx.spaceHeader().IDENTIFIER().getText();
    const workflowName = ctx.spaceHeader().workflowNameRead().IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.spaceHeader().IDENTIFIER());

    const spaceSymbol: DocumentSymbol = {
      name,
      detail: `of ${workflowName}`,
      kind: SymbolKind.Module,
      range,
      selectionRange,
      children: [],
    };

    // Visit space body
    const body = ctx.spaceBody();
    for (const content of body.spaceContent()) {
      if (content.strategyStatement()) {
        const strategy = content.strategyStatement().IDENTIFIER().getText();
        spaceSymbol.children!.push({
          name: 'strategy',
          detail: strategy,
          kind: SymbolKind.Property,
          range: ASTUtils.getNodeRange(content.strategyStatement()),
          selectionRange: ASTUtils.getNodeRange(content.strategyStatement().IDENTIFIER()),
          children: [],
        });
      } else if (content.paramDefinition()) {
        const paramSymbol = this.visitParamDefinitionSymbol(content.paramDefinition());
        if (paramSymbol) {
          spaceSymbol.children!.push(paramSymbol);
        }
      } else if (content.taskConfiguration()) {
        const configSymbol = this.visitTaskConfigurationSymbol(content.taskConfiguration());
        if (configSymbol) {
          spaceSymbol.children!.push(configSymbol);
        }
      }
    }

    return spaceSymbol;
  }

  private visitControlBlockSymbol(ctx: any): DocumentSymbol {
    const range = ASTUtils.getNodeRange(ctx);

    const controlSymbol: DocumentSymbol = {
      name: 'Control Flow',
      kind: SymbolKind.Event,
      range,
      selectionRange: range,
      children: [],
    };

    // Add transitions as children
    const body = ctx.controlBody();
    let transitionIndex = 0;

    for (const content of body.controlContent()) {
      if (content.simpleTransition()) {
        const spaceNames = content
          .simpleTransition()
          .spaceNameRead()
          .map((s: any) => s.IDENTIFIER().getText());

        controlSymbol.children!.push({
          name: `Transition ${++transitionIndex}`,
          detail: spaceNames.join(' → '),
          kind: SymbolKind.Event,
          range: ASTUtils.getNodeRange(content.simpleTransition()),
          selectionRange: ASTUtils.getNodeRange(content.simpleTransition()),
          children: [],
        });
      } else if (content.conditionalTransition()) {
        const header = content.conditionalTransition().conditionalTransitionHeader();
        const from = header.spaceNameRead()[0].IDENTIFIER().getText();
        const to = header.spaceNameRead()[1].IDENTIFIER().getText();

        controlSymbol.children!.push({
          name: `Conditional ${++transitionIndex}`,
          detail: `${from} → ${to}`,
          kind: SymbolKind.Event,
          range: ASTUtils.getNodeRange(content.conditionalTransition()),
          selectionRange: ASTUtils.getNodeRange(header),
          children: [],
        });
      }
    }

    return controlSymbol;
  }

  private visitParamDefinitionSymbol(ctx: any): DocumentSymbol {
    const name = ctx.IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    let detail = 'parameter';
    const paramValue = ctx.paramValue();
    if (paramValue.enumFunction()) {
      detail = 'enum';
    } else if (paramValue.rangeFunction()) {
      detail = 'range';
    }

    return {
      name,
      detail,
      kind: SymbolKind.Variable,
      range,
      selectionRange,
      children: [],
    };
  }

  private visitTaskConfigurationSymbol(ctx: any): DocumentSymbol {
    const taskName = ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(
      ctx.taskConfigurationHeader().taskNameRead().IDENTIFIER()
    );

    const configSymbol: DocumentSymbol = {
      name: `configure ${taskName}`,
      kind: SymbolKind.Method,
      range,
      selectionRange,
      children: [],
    };

    return configSymbol;
  }

  private visitDataDefinitionSymbol(ctx: any): DocumentSymbol {
    const name = ctx.IDENTIFIER().getText();
    const value = ctx.STRING().getText();
    const range = ASTUtils.getNodeRange(ctx);
    const selectionRange = ASTUtils.getNodeRange(ctx.IDENTIFIER());

    return {
      name,
      detail: `= ${value}`,
      kind: SymbolKind.Variable,
      range,
      selectionRange,
      children: [],
    };
  }
}
