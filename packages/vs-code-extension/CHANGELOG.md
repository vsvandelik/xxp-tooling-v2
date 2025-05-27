# Changelog

All notable changes to the XXP & ESPACE Language Support extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-05-27

### Added
- Initial release of XXP & ESPACE Language Support extension
- Syntax highlighting for `.xxp` files using TextMate grammar
- Syntax highlighting for `.espace` files using TextMate grammar
- Language configuration for XXP language including:
  - Comment support (line and block comments)
  - Bracket matching and auto-closing
  - Auto-surrounding pairs
  - Indentation rules
  - Code folding support
- Language configuration for ESPACE language including:
  - Comment support (line and block comments)
  - Bracket matching and auto-closing
  - Auto-surrounding pairs
  - Indentation rules
  - Code folding support
- Basic extension structure with placeholder for future language features
- Sample test files for both languages
- Build and packaging configuration

### Technical Details
- Extension entry point with activation support
- Placeholder functions for registering language features:
  - Code completion providers (future)
  - Hover providers (future)
  - Definition providers (future)
  - Symbol providers (future)
- VS Code development environment setup with launch and task configurations
