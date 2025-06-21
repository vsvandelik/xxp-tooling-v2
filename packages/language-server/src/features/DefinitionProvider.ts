// packages/language-server/src/features/DefinitionProvider.ts
import {
  TextDocumentPositionParams,
  Definition,
  LocationLink,
  Range,
} from 'vscode-languageserver/node';
import { DocumentManager } from '../documents/DocumentManager.js';
import { ASTUtils } from '../utils/ASTUtils.js';

export class DefinitionProvider {
  constructor(private documentManager: DocumentManager) {}

  async provideDefinition(params: TextDocumentPositionParams): Promise<Definition | null> {
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const symbolTable = this.documentManager.getSymbolTable();

    // Find the node at the current position
    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    // Determine what kind of reference we're looking at
    const referenceInfo = ASTUtils.getReferenceInfo(node, document.languageId);
    if (!referenceInfo) return null;

    // Look up the symbol in the symbol table
    const symbol = symbolTable.resolveSymbol(
      referenceInfo.name,
      referenceInfo.scope,
      referenceInfo.type
    );

    if (!symbol) return null;

    // Return the definition location
    if (symbol.uri === params.textDocument.uri) {
      // Same file - return as Location
      return {
        uri: symbol.uri,
        range: symbol.selectionRange || symbol.range,
      };
    } else {
      // Different file - return as LocationLink for better navigation
      return {
        targetUri: symbol.uri,
        targetRange: symbol.range,
        targetSelectionRange: symbol.selectionRange || symbol.range,
        originSelectionRange: referenceInfo.range,
      } as LocationLink;
    }
  }

  async provideTypeDefinition(params: TextDocumentPositionParams): Promise<Definition | null> {
    // For parameters and data, we might want to go to their type definition
    const document = this.documentManager.getDocument(params.textDocument.uri);
    if (!document || !document.parseTree) return null;

    const position = params.position;
    const node = this.documentManager.getNodeAtPosition(
      params.textDocument.uri,
      position.line,
      position.character
    );

    if (!node) return null;

    const referenceInfo = ASTUtils.getReferenceInfo(node, document.languageId);
    if (!referenceInfo) return null;

    // Special handling for different types
    switch (referenceInfo.type) {
      case 'workflow':
        // For workflow references in ESPACE files, go to the workflow definition
        return this.provideWorkflowDefinition(referenceInfo.name);
        
      case 'task':
        // For task references, go to the task definition
        return this.provideTaskDefinition(referenceInfo.name, referenceInfo.workflow);
        
      case 'parameter':
        // For parameter references, go to where it's first defined
        return this.provideParameterDefinition(
          referenceInfo.name,
          referenceInfo.task,
          referenceInfo.workflow
        );
        
      case 'data':
        // For data references, go to the data definition
        return this.provideDataDefinition(referenceInfo.name, referenceInfo.scope);
        
      default:
        return null;
    }
  }

  private async provideWorkflowDefinition(workflowName: string): Promise<Definition | null> {
    const symbolTable = this.documentManager.getSymbolTable();
    const symbol = symbolTable.resolveSymbol(workflowName, 'global', 'workflow');
    
    if (!symbol) return null;

    return {
      uri: symbol.uri,
      range: symbol.selectionRange || symbol.range,
    };
  }

  private async provideTaskDefinition(
    taskName: string,
    workflowName?: string
  ): Promise<Definition | null> {
    if (!workflowName) return null;

    const symbolTable = this.documentManager.getSymbolTable();
    const workflowInfo = symbolTable.getWorkflowInfo(workflowName);
    
    if (!workflowInfo) return null;

    // Find the task in the workflow or its parents
    const task = workflowInfo.tasks.find(t => t.name === taskName);
    if (!task || !task.definitionLocation) return null;

    return {
      uri: task.definitionLocation.uri,
      range: task.definitionLocation.range,
    };
  }

  private async provideParameterDefinition(
    paramName: string,
    taskName?: string,
    workflowName?: string
  ): Promise<Definition | null> {
    if (!taskName || !workflowName) return null;

    const symbolTable = this.documentManager.getSymbolTable();
    const taskInfo = symbolTable.getTaskInfo(workflowName, taskName);
    
    if (!taskInfo) return null;

    const param = taskInfo.parameters.find(p => p.name === paramName);
    if (!param || !param.definitionLocation) return null;

    return {
      uri: param.definitionLocation.uri,
      range: param.definitionLocation.range,
    };
  }

  private async provideDataDefinition(
    dataName: string,
    scope: string
  ): Promise<Definition | null> {
    const symbolTable = this.documentManager.getSymbolTable();
    
    // Try to find data definition in the appropriate scope
    const symbol = symbolTable.resolveSymbol(dataName, scope, 'data');
    
    if (!symbol) {
      // Try global scope as fallback
      const globalSymbol = symbolTable.resolveSymbol(dataName, 'global', 'data');
      if (globalSymbol) {
        return {
          uri: globalSymbol.uri,
          range: globalSymbol.selectionRange || globalSymbol.range,
        };
      }
    }

    if (!symbol) return null;

    return {
      uri: symbol.uri,
      range: symbol.selectionRange || symbol.range,
    };
  }
}