import { ParseTree, ParserRuleContext, TerminalNode } from 'antlr4ng';
import { Range } from 'vscode-languageserver/node.js';

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

  static getRuleName(node: ParseTree): string | null {
    if (node instanceof ParserRuleContext) {
      const ruleIndex = node.ruleIndex;
      // This would need the parser instance to get the actual name
      // For now, return a placeholder
      return `rule_${ruleIndex}`;
    }
    return null;
  }

  static getReferenceInfo(node: ParseTree, languageId: string): any | null {
    // Analyze the node to determine what it references
    if (node instanceof TerminalNode) {
      const text = node.getText();
      const parent = node.parent;

      if (!parent) return null;

      // Determine reference type based on context
      const ruleName = this.getRuleName(parent);

      // XXP-specific references
      if (languageId === 'xxp') {
        if (this.isInContext(node, 'workflowNameRead')) {
          return {
            name: text,
            type: 'workflow',
            scope: 'global',
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'taskNameRead')) {
          return {
            name: text,
            type: 'task',
            scope: this.getCurrentWorkflow(node),
            workflow: this.getCurrentWorkflow(node),
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'dataNameRead')) {
          return {
            name: text,
            type: 'data',
            scope: this.getCurrentWorkflow(node),
            range: this.getNodeRange(node),
          };
        }
      }

      // ESPACE-specific references
      if (languageId === 'espace') {
        if (this.isInContext(node, 'workflowNameRead')) {
          return {
            name: text,
            type: 'workflow',
            scope: 'global',
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'spaceNameRead')) {
          return {
            name: text,
            type: 'space',
            scope: this.getCurrentExperiment(node),
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'taskNameRead')) {
          return {
            name: text,
            type: 'task',
            scope: this.getCurrentSpace(node),
            workflow: this.getSpaceWorkflow(node),
            range: this.getNodeRange(node),
          };
        }
      }
    }

    return null;
  }

  static getSymbolInfo(node: ParseTree, languageId: string): any | null {
    // Similar to getReferenceInfo but for symbol definitions
    if (node instanceof TerminalNode) {
      const text = node.getText();
      const parent = node.parent;

      if (!parent) return null;

      // Determine symbol type based on context
      if (languageId === 'xxp') {
        if (this.isInContext(node, 'workflowHeader')) {
          return {
            name: text,
            type: 'workflow',
            scope: 'global',
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'taskDefinition')) {
          return {
            name: text,
            type: 'task',
            scope: this.getCurrentWorkflow(node),
            range: this.getNodeRange(node),
          };
        }
      }

      if (languageId === 'espace') {
        if (this.isInContext(node, 'experimentHeader')) {
          return {
            name: text,
            type: 'experiment',
            scope: 'global',
            range: this.getNodeRange(node),
          };
        }
        if (this.isInContext(node, 'spaceHeader')) {
          return {
            name: text,
            type: 'space',
            scope: this.getCurrentExperiment(node),
            range: this.getNodeRange(node),
          };
        }
      }
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

    // For parser rule contexts, calculate range from children
    if (node instanceof ParserRuleContext) {
      const start = node.start;
      const stop = node.stop;

      if (start && stop) {
        // Calculate the actual end position including the stop token's text
        let endLine = stop.line - 1;
        let endChar = stop.column;

        // If we have the text, add its length
        if (stop.text) {
          endChar += stop.text.length;
        } else {
          // If no text, try to get it from the stop index
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

  private static isInContext(node: ParseTree, contextName: string): boolean {
    let current: ParseTree | undefined = node.parent || undefined;

    while (current) {
      const ruleName = this.getRuleName(current);
      if (ruleName === contextName) {
        return true;
      }
      current = current.parent || undefined;
    }

    return false;
  }

  private static getCurrentWorkflow(node: ParseTree): string {
    // Walk up the tree to find the workflow name
    let current: ParseTree | undefined = node;

    while (current) {
      if (this.getRuleName(current) === 'workflowDeclaration') {
        // Extract workflow name from the declaration
        // This is simplified - actual implementation would parse the tree properly
        return 'currentWorkflow';
      }
      current = current.parent || undefined;
    }

    return 'global';
  }

  private static getCurrentExperiment(node: ParseTree): string {
    // Similar to getCurrentWorkflow but for experiments
    return 'currentExperiment';
  }

  private static getCurrentSpace(node: ParseTree): string {
    // Similar to getCurrentWorkflow but for spaces
    return 'currentSpace';
  }

  private static getSpaceWorkflow(node: ParseTree): string | undefined {
    // Extract the workflow associated with the current space
    return undefined;
  }
}
