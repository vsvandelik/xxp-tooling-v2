import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Range } from 'vscode-languageserver/node.js';
import { XXPParser, ESPACEParser } from '@extremexp/core';

export class ASTUtils {
  static getAncestors(node: ParseTree): ParseTree[] {
    const ancestors: ParseTree[] = [];
    let current = node.parent;

    while (current) {
      ancestors.push(current);
      current = current.parent;
    }

    return ancestors;
  }

  static getRuleName(node: ParseTree, parser?: any): string | null {
    if (node instanceof ParserRuleContext) {
      const ruleIndex = node.ruleIndex;
      
      // Try to get rule name from parser if available
      if (parser && parser.ruleNames && parser.ruleNames[ruleIndex]) {
        return parser.ruleNames[ruleIndex];
      }
      
      // Fallback to common rule names based on context
      // This is a temporary solution until we have proper parser integration
      const className = node.constructor.name;
      if (className.endsWith('Context')) {
        return className.replace('Context', '').toLowerCase();
      }
      
      return `rule_${ruleIndex}`;
    }
    return null;
  }

  static getReferenceInfo(node: ParseTree, languageId: string): any | null {
    if (!(node instanceof TerminalNode)) return null;

    const text = node.getText();
    const parent = node.parent;
    if (!parent) return null;

    // Walk up the tree to find context
    const context = this.findContextType(node);
    
    if (languageId === 'xxp') {
      return this.getXXPReferenceInfo(text, context, node);
    } else if (languageId === 'espace') {
      return this.getESPACEReferenceInfo(text, context, node);
    }

    return null;
  }

  static getSymbolInfo(node: ParseTree, languageId: string): any | null {
    if (!(node instanceof TerminalNode)) return null;

    const text = node.getText();
    const parent = node.parent;
    if (!parent) return null;

    const context = this.findContextType(node);

    if (languageId === 'xxp') {
      return this.getXXPSymbolInfo(text, context, node);
    } else if (languageId === 'espace') {
      return this.getESPACESymbolInfo(text, context, node);
    }

    return null;
  }

  static getNodeRange(node: ParseTree): Range {
    if (node instanceof TerminalNode) {
      const token = node.symbol;
      return {
        start: {
          line: token.line - 1, // Convert to 0-based
          character: token.column,
        },
        end: {
          line: token.line - 1,
          character: token.column + (token.text?.length || 0),
        },
      };
    }

    if (node instanceof ParserRuleContext) {
      const start = node.start;
      const stop = node.stop;

      if (start && stop) {
        let endLine = stop.line - 1;
        let endChar = stop.column;

        if (stop.text) {
          endChar += stop.text.length;
        } else {
          const stopIndex = stop.stop;
          if (stopIndex >= 0) {
            endChar = stop.column + (stopIndex - stop.start + 1);
          }
        }

        return {
          start: {
            line: start.line - 1,
            character: start.column,
          },
          end: {
            line: endLine,
            character: endChar,
          },
        };
      }
    }

    return {
      start: { line: 0, character: 0 },
      end: { line: 0, character: 0 },
    };
  }

  static findNodeAtPosition(tree: ParseTree, line: number, character: number): ParseTree | null {
    const targetLine = line + 1; // Convert to 1-based for ANTLR
    
    // If this is a terminal node, check if position is within it
    if (tree instanceof TerminalNode) {
      const token = tree.symbol;
      if (token.line === targetLine) {
        const start = token.column;
        const end = start + (token.text?.length || 0);
        if (character >= start && character < end) {
          return tree;
        }
      }
      return null;
    }

    // If this is a parser rule context, check children
    if (tree instanceof ParserRuleContext) {
      // First check if position is within this node's range
      const range = this.getNodeRange(tree);
      if (!this.isPositionInRange({ line, character }, range)) {
        return null;
      }

      // Check children from most specific to least specific
      for (let i = 0; i < tree.getChildCount(); i++) {
        const child = tree.getChild(i);
        if (child) {
          const result = this.findNodeAtPosition(child, line, character);
          if (result) {
            return result;
          }
        }
      }

      // If no child contains the position, return this node
      return tree;
    }

    return null;
  }

  private static isPositionInRange(position: { line: number; character: number }, range: Range): boolean {
    if (position.line < range.start.line || position.line > range.end.line) {
      return false;
    }

    if (position.line === range.start.line && position.character < range.start.character) {
      return false;
    }

    if (position.line === range.end.line && position.character >= range.end.character) {
      return false;
    }

    return true;
  }

  private static findContextType(node: ParseTree): string {
    let current: ParseTree | undefined = node.parent;

    while (current) {
      if (current instanceof ParserRuleContext) {
        const className = current.constructor.name;
        
        // Map class names to context types
        if (className.includes('WorkflowHeader')) return 'workflowHeader';
        if (className.includes('WorkflowDeclaration')) return 'workflowDeclaration';
        if (className.includes('TaskDefinition')) return 'taskDefinition';
        if (className.includes('TaskConfiguration')) return 'taskConfiguration';
        if (className.includes('TaskChain')) return 'taskChain';
        if (className.includes('DataDefinition')) return 'dataDefinition';
        if (className.includes('WorkflowNameRead')) return 'workflowNameRead';
        if (className.includes('TaskNameRead')) return 'taskNameRead';
        if (className.includes('DataNameRead')) return 'dataNameRead';
        
        if (className.includes('ExperimentHeader')) return 'experimentHeader';
        if (className.includes('ExperimentDeclaration')) return 'experimentDeclaration';
        if (className.includes('SpaceHeader')) return 'spaceHeader';
        if (className.includes('SpaceDeclaration')) return 'spaceDeclaration';
        if (className.includes('ControlBlock')) return 'controlBlock';
        if (className.includes('SpaceNameRead')) return 'spaceNameRead';
        if (className.includes('ParamDefinition')) return 'paramDefinition';
      }
      current = current.parent;
    }

    return 'unknown';
  }

  private static getXXPReferenceInfo(text: string, context: string, node: ParseTree): any | null {
    switch (context) {
      case 'workflowNameRead':
        return {
          name: text,
          type: 'workflow',
          scope: 'global',
          range: this.getNodeRange(node),
        };
      case 'taskNameRead':
        return {
          name: text,
          type: 'task',
          scope: this.getCurrentWorkflow(node),
          workflow: this.getCurrentWorkflow(node),
          range: this.getNodeRange(node),
        };
      case 'dataNameRead':
        return {
          name: text,
          type: 'data',
          scope: this.getCurrentWorkflow(node),
          range: this.getNodeRange(node),
        };
      default:
        return null;
    }
  }

  private static getESPACEReferenceInfo(text: string, context: string, node: ParseTree): any | null {
    switch (context) {
      case 'workflowNameRead':
        return {
          name: text,
          type: 'workflow',
          scope: 'global',
          range: this.getNodeRange(node),
        };
      case 'spaceNameRead':
        return {
          name: text,
          type: 'space',
          scope: this.getCurrentExperiment(node),
          range: this.getNodeRange(node),
        };
      case 'taskNameRead':
        return {
          name: text,
          type: 'task',
          scope: this.getCurrentSpace(node),
          workflow: this.getSpaceWorkflow(node),
          range: this.getNodeRange(node),
        };
      default:
        return null;
    }
  }

  private static getXXPSymbolInfo(text: string, context: string, node: ParseTree): any | null {
    switch (context) {
      case 'workflowHeader':
      case 'workflowDeclaration':
        return {
          name: text,
          type: 'workflow',
          scope: 'global',
          range: this.getNodeRange(node),
        };
      case 'taskDefinition':
        return {
          name: text,
          type: 'task',
          scope: this.getCurrentWorkflow(node),
          range: this.getNodeRange(node),
        };
      case 'dataDefinition':
        return {
          name: text,
          type: 'data',
          scope: this.getCurrentWorkflow(node),
          range: this.getNodeRange(node),
        };
      default:
        return null;
    }
  }

  private static getESPACESymbolInfo(text: string, context: string, node: ParseTree): any | null {
    switch (context) {
      case 'experimentHeader':
      case 'experimentDeclaration':
        return {
          name: text,
          type: 'experiment',
          scope: 'global',
          range: this.getNodeRange(node),
        };
      case 'spaceHeader':
      case 'spaceDeclaration':
        return {
          name: text,
          type: 'space',
          scope: this.getCurrentExperiment(node),
          range: this.getNodeRange(node),
        };
      case 'paramDefinition':
        return {
          name: text,
          type: 'parameter',
          scope: this.getCurrentSpace(node),
          range: this.getNodeRange(node),
        };
      default:
        return null;
    }
  }

  private static getCurrentWorkflow(node: ParseTree): string {
    let current: ParseTree | undefined = node;

    while (current) {
      if (current instanceof ParserRuleContext) {
        const className = current.constructor.name;
        if (className.includes('WorkflowDeclaration')) {
          // Find the identifier in the workflow header
          return this.extractIdentifierFromContext(current, 'workflowHeader') || 'global';
        }
      }
      current = current.parent;
    }

    return 'global';
  }

  private static getCurrentExperiment(node: ParseTree): string {
    let current: ParseTree | undefined = node;

    while (current) {
      if (current instanceof ParserRuleContext) {
        const className = current.constructor.name;
        if (className.includes('ExperimentDeclaration')) {
          return this.extractIdentifierFromContext(current, 'experimentHeader') || 'global';
        }
      }
      current = current.parent;
    }

    return 'global';
  }

  private static getCurrentSpace(node: ParseTree): string {
    let current: ParseTree | undefined = node;

    while (current) {
      if (current instanceof ParserRuleContext) {
        const className = current.constructor.name;
        if (className.includes('SpaceDeclaration')) {
          return this.extractIdentifierFromContext(current, 'spaceHeader') || 'global';
        }
      }
      current = current.parent;
    }

    return 'global';
  }

  private static getSpaceWorkflow(node: ParseTree): string | undefined {
    let current: ParseTree | undefined = node;

    while (current) {
      if (current instanceof ParserRuleContext) {
        const className = current.constructor.name;
        if (className.includes('SpaceDeclaration')) {
          // Find workflow name in space header
          return this.extractWorkflowFromSpaceHeader(current);
        }
      }
      current = current.parent;
    }

    return undefined;
  }

  private static extractIdentifierFromContext(context: ParserRuleContext, headerType: string): string | null {
    // This is a simplified extraction - in a real implementation you'd traverse the tree properly
    for (let i = 0; i < context.getChildCount(); i++) {
      const child = context.getChild(i);
      if (child instanceof TerminalNode && child.symbol.type === /* IDENTIFIER */ 1) {
        return child.getText();
      }
    }
    return null;
  }

  private static extractWorkflowFromSpaceHeader(context: ParserRuleContext): string | null {
    // Similar simplified extraction for workflow name from space header
    // In a real implementation, you'd properly navigate to the workflowNameRead
    for (let i = 0; i < context.getChildCount(); i++) {
      const child = context.getChild(i);
      // This is a placeholder - would need proper tree navigation
    }
    return null;
  }
}