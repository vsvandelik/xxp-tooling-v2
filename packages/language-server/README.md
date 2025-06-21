# ExtremeXP Language Server

This package implements the Language Server Protocol (LSP) for the XXP and ESPACE languages, providing intelligent language features for the ExtremeXP workflow and experiment system.

## Features

### Core Language Features

- **Syntax Checking**: Real-time syntax validation with detailed error messages
- **Code Completion**: Context-aware completions for keywords, symbols, and references
- **Go to Definition**: Navigate to symbol definitions across files
- **Find All References**: Find all uses of a symbol across the workspace
- **Rename Symbol**: Safely rename symbols with preview
- **Hover Information**: Rich documentation on hover
- **Document Symbols**: Outline view support
- **Diagnostics**: Comprehensive error and warning reporting
- **Code Actions**: Quick fixes for common issues

### Language-Specific Features

#### XXP (Workflow) Features
- Workflow inheritance validation
- Task chain validation
- Data flow analysis
- Implementation file checking
- Parameter resolution through inheritance
- Circular dependency detection

#### ESPACE (Experiment) Features
- Workflow reference validation
- Control flow analysis
- Strategy validation
- Parameter usage checking
- Space reachability analysis
- Required data input validation

## Architecture

### Core Components

1. **Document Manager**: Manages parsed documents and maintains the symbol table
2. **Symbol Table**: Global registry of all symbols with cross-file resolution
3. **Validators**: Language-specific and common validation rules
4. **Providers**: Implementation of LSP features (completion, definition, etc.)
5. **Analyzers**: Language-specific AST analysis

### File Structure

```
src/
├── server.ts                 # Main language server entry point
├── documents/
│   ├── DocumentManager.ts    # Document lifecycle management
│   ├── DocumentSymbols.ts    # Symbol extraction
│   └── DocumentAnalyzer.ts   # Document analysis orchestration
├── features/
│   ├── CompletionProvider.ts # Code completion
│   ├── DefinitionProvider.ts # Go to definition
│   ├── ReferenceProvider.ts  # Find references
│   ├── RenameProvider.ts     # Rename refactoring
│   ├── DiagnosticProvider.ts # Error/warning diagnostics
│   ├── HoverProvider.ts      # Hover documentation
│   ├── DocumentSymbolProvider.ts # Document outline
│   └── CodeActionProvider.ts # Quick fixes
├── analysis/
│   ├── SymbolTable.ts        # Global symbol registry
│   ├── XXPAnalyzer.ts        # XXP-specific analysis
│   └── ESPACEAnalyzer.ts     # ESPACE-specific analysis
├── validation/
│   ├── CommonValidator.ts    # Cross-language validations
│   ├── XXPValidator.ts       # XXP-specific validations
│   └── ESPACEValidator.ts    # ESPACE-specific validations
├── completion/
│   ├── CompletionEngine.ts   # Completion context analysis
│   ├── XXPCompletions.ts     # XXP-specific completions
│   └── ESPACECompletions.ts  # ESPACE-specific completions
└── utils/
    ├── ASTUtils.ts           # AST traversal utilities
    ├── ErrorListener.ts      # ANTLR error handling
    └── PositionUtils.ts      # Position/range utilities
```

## Extension Guide

### Adding a New Validation

1. Add the validation logic to the appropriate validator:
   ```typescript
   // In XXPValidator.ts or ESPACEValidator.ts
   private validateNewRule(document: ParsedDocument): ValidationResult[] {
     const results: ValidationResult[] = [];
     
     // Your validation logic here
     if (conditionViolated) {
       results.push({
         severity: 'error',
         range: violationRange,
         message: 'Description of the issue',
         code: 'unique-error-code',
       });
     }
     
     return results;
   }
   ```

2. Call your validation from the main validate method:
   ```typescript
   async validate(document: ParsedDocument): Promise<ValidationResult[]> {
     const results: ValidationResult[] = [];
     
     // ... existing validations ...
     results.push(...this.validateNewRule(document));
     
     return results;
   }
   ```

### Adding a New Completion

1. Add completion logic to the appropriate completions class:
   ```typescript
   // In XXPCompletions.ts or ESPACECompletions.ts
   private getNewCompletions(context: CompletionContext): CompletionItem[] {
     const items: CompletionItem[] = [];
     
     if (context.isInSpecificContext) {
       items.push({
         label: 'suggestion',
         kind: CompletionItemKind.Snippet,
         insertText: 'template ${1:placeholder}',
         insertTextFormat: InsertTextFormat.Snippet,
         documentation: 'Description',
       });
     }
     
     return items;
   }
   ```

### Adding a New Quick Fix

1. Add the error code to handle in CodeActionProvider:
   ```typescript
   case 'your-error-code':
     actions.push(...this.getYourQuickFixes(diagnostic, uri));
     break;
   ```

2. Implement the quick fix:
   ```typescript
   private getYourQuickFixes(diagnostic: Diagnostic, uri: string): CodeAction[] {
     const actions: CodeAction[] = [];
     
     actions.push({
       title: 'Fix the issue',
       kind: CodeActionKind.QuickFix,
       diagnostics: [diagnostic],
       edit: {
         changes: {
           [uri]: [{
             range: diagnostic.range,
             newText: 'corrected text',
           }],
         },
       },
     });
     
     return actions;
   }
   ```

## Testing

### Unit Tests

Run unit tests with:
```bash
npm test
```

### Integration Tests

The language server can be tested with the VS Code extension by:
1. Opening the extension in VS Code
2. Pressing F5 to launch a new Extension Development Host
3. Opening XXP/ESPACE files to test features

### Manual Testing

Test specific features:
- **Completion**: Type partial keywords or references
- **Validation**: Introduce errors and check diagnostics
- **Navigation**: Ctrl+Click on references
- **Hover**: Hover over symbols
- **Rename**: F2 on a symbol

## Performance Considerations

1. **Incremental Parsing**: Only re-parse changed documents
2. **Symbol Table Caching**: Cache symbol resolutions
3. **Debounced Validation**: Delay validation on rapid edits
4. **Lazy Analysis**: Only analyze visible documents fully

## Debugging

Enable debug logging by setting the `EXTREMEXP_LSP_DEBUG` environment variable:
```bash
EXTREMEXP_LSP_DEBUG=true code .
```

The language server logs to the VS Code output channel "ExtremeXP Language Server".

## Future Enhancements

1. **Semantic Highlighting**: Token-based syntax highlighting
2. **Code Lens**: Inline reference counts and run buttons
3. **Folding Ranges**: Custom folding for language constructs
4. **Format Document**: Code formatting support
5. **Signature Help**: Parameter hints for functions
6. **Workspace Symbols**: Global symbol search
7. **Call Hierarchy**: Show call relationships
8. **Type Hierarchy**: Show inheritance relationships

## Contributing

When contributing to the language server:

1. Follow the existing code structure
2. Add tests for new features
3. Update this README for significant changes
4. Ensure backward compatibility
5. Run the full test suite before submitting

## License

MIT