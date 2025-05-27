# XXP & ESPACE Language Support

This VS Code extension provides language support for XXP and ESPACE programming languages.

## Features

- Syntax highlighting for `.xxp` and `.espace` files
- Language configuration with proper commenting, brackets, and indentation rules
- Auto-closing pairs and surrounding pairs for quotes and brackets
- Code folding support

## Language Features

### XXP Language Support
- File extension: `.xxp`
- Syntax highlighting based on tmLanguage grammar
- Language configuration for improved editing experience

### ESPACE Language Support
- File extension: `.espace`
- Syntax highlighting based on tmLanguage grammar
- Language configuration for improved editing experience

## Installation

This extension is part of the XXP tooling package and can be installed locally for development.

## Development

For detailed development instructions and customization guide, see [DEVELOPMENT.md](./DEVELOPMENT.md).

### Quick Start

```bash
npm run build              # Build the extension
npm run build:watch        # Watch for changes
npm run package           # Package for distribution
```

### Testing

1. Open this folder in VS Code
2. Press F5 to launch Extension Development Host
3. Open `.xxp` or `.espace` files to test syntax highlighting

## Customizing Language Support

### Updating Syntax Highlighting

Replace the placeholder tmLanguage files in the `syntaxes/` directory with your actual grammar definitions:

- `syntaxes/xxp.tmLanguage.json` - TextMate grammar for XXP language
- `syntaxes/espace.tmLanguage.json` - TextMate grammar for ESPACE language

### Updating Language Configuration

Modify the JSON files in the `language-configuration/` directory to customize:

- Comment styles
- Bracket matching
- Auto-closing pairs
- Indentation rules
- Word patterns

## Contributing

1. Update the tmLanguage grammar files with your specific language syntax
2. Modify language configuration files as needed
3. Test the extension in a VS Code development environment
4. Build and package the extension

## License

MIT
