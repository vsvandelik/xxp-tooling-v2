import * as vscode from 'vscode';

/**
 * This method is called when your extension is activated
 * Your extension is activated the very first time the command is executed
 */
export function activate(context: vscode.ExtensionContext) {
  console.log('XXP & ESPACE Language Support extension is now active!');

  // Register language features for XXP
  registerXXPLanguageFeatures(context);

  // Register language features for ESPACE
  registerESPACELanguageFeatures(context);
}

/**
 * Register language features for XXP language
 */
function registerXXPLanguageFeatures(context: vscode.ExtensionContext) {
  // You can add language features here such as:
  // - Code completion providers
  // - Hover providers
  // - Definition providers
  // - Symbol providers
  // etc.

  console.log('XXP language features registered', context);
}

/**
 * Register language features for ESPACE language
 */
function registerESPACELanguageFeatures(context: vscode.ExtensionContext) {
  // You can add language features here such as:
  // - Code completion providers
  // - Hover providers
  // - Definition providers
  // - Symbol providers
  // etc.

  console.log('ESPACE language features registered', context);
}

/**
 * This method is called when your extension is deactivated
 */
export function deactivate() {
  console.log('XXP & ESPACE Language Support extension is now deactivated');
}
