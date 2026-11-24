import * as vscode from 'vscode';
import { SvgDocumentSymbolProvider } from './SvgDocumentSymbolProvider';
import { SvgFileDecorationProvider } from './SvgFileDecorationProvider';

export function activate(context: vscode.ExtensionContext): void {
  const decorationProvider = new SvgFileDecorationProvider();
  const symbolProvider = new SvgDocumentSymbolProvider();

  context.subscriptions.push(
    vscode.window.registerFileDecorationProvider(decorationProvider),
    vscode.languages.registerDocumentSymbolProvider({ pattern: '**/*.svg' }, symbolProvider),
  );
}

export function deactivate(): void {
  // All providers are disposed automatically via context.subscriptions.
}
