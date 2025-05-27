# Development Guide

This guide helps you customize and extend the XXP & ESPACE Language Support extension.

## Setting Up Development Environment

1. Open the `packages/vs-code-extension` folder in VS Code
2. Install dependencies: `npm install`
3. Build the extension: `npm run build`
4. Press F5 to launch a new Extension Development Host window

## Customizing Language Support

### Updating Syntax Highlighting

The syntax highlighting is defined by TextMate grammar files located in the `syntaxes/` directory:

- `syntaxes/xxp.tmLanguage.json` - Grammar for XXP language
- `syntaxes/espace.tmLanguage.json` - Grammar for ESPACE language

#### Key Grammar Components

1. **Scope Name**: Unique identifier for the language (e.g., `source.xxp`)
2. **File Types**: Array of file extensions
3. **Patterns**: Array of grammar rules that match different language constructs
4. **Repository**: Named grammar rules that can be reused

#### Example Grammar Rule

```json
{
    "name": "keyword.control.xxp",
    "match": "\\b(if|else|while|for)\\b"
}
```

### Updating Language Configuration

Language configuration files are in the `language-configuration/` directory:

- `language-configuration/xxp-language-configuration.json`
- `language-configuration/espace-language-configuration.json`

#### Configurable Features

- **Comments**: Line and block comment patterns
- **Brackets**: Bracket matching pairs
- **Auto-closing pairs**: Characters that auto-close
- **Surrounding pairs**: Characters for text selection surrounding
- **Indentation rules**: Patterns for automatic indentation
- **Folding**: Code folding markers
- **Word patterns**: Regular expressions defining word boundaries

## Adding Language Features

The main extension file (`src/extension.ts`) contains placeholder functions for adding advanced language features:

### Code Completion

```typescript
function registerXXPLanguageFeatures(context: vscode.ExtensionContext) {
    const provider = vscode.languages.registerCompletionItemProvider('xxp', {
        provideCompletionItems(document, position, token, context) {
            // Return completion items
        }
    });
    context.subscriptions.push(provider);
}
```

### Hover Information

```typescript
const hoverProvider = vscode.languages.registerHoverProvider('xxp', {
    provideHover(document, position, token) {
        // Return hover information
    }
});
```

### Go to Definition

```typescript
const definitionProvider = vscode.languages.registerDefinitionProvider('xxp', {
    provideDefinition(document, position, token) {
        // Return definition location
    }
});
```

## Testing Your Changes

1. **Manual Testing**: Use F5 to launch Extension Development Host
2. **Test Files**: Use the sample files in `test-files/` directory
3. **Syntax Highlighting**: Create `.xxp` and `.espace` files to test highlighting

## Building and Packaging

```bash
# Build the extension
npm run build

# Watch for changes during development
npm run build:watch

# Package for distribution
npm run package
```

## File Structure

```
├── .vscode/                 # VS Code configuration
│   ├── launch.json         # Debug configuration
│   └── tasks.json          # Build tasks
├── dist/                   # Compiled output
├── language-configuration/ # Language settings
├── src/                    # TypeScript source
├── syntaxes/              # TextMate grammars
├── test-files/            # Sample files for testing
├── package.json           # Extension manifest
├── tsconfig.json         # TypeScript configuration
└── README.md             # Documentation
```

## Useful Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [TextMate Grammar Guide](https://macromates.com/manual/en/language_grammars)
- [Language Configuration Guide](https://code.visualstudio.com/api/language-extensions/language-configuration-guide)
- [Syntax Highlighting Guide](https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide)
- [VS Code Extension Samples](https://github.com/microsoft/vscode-extension-samples)

## Publishing

When ready to publish:

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Run `npm run package`
4. Publish to VS Code Marketplace using `vsce publish`
