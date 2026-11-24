import * as vscode from 'vscode';
import type { SvgOutlineNode } from './SvgOutlineNode';
import { SvgOutlineParser } from './SvgOutlineParser';

/**
 * VSCode DocumentSymbolProvider that adapts SvgOutlineParser's AST into native
 * DocumentSymbol nodes so VSCode's Outline view renders nested SVG structure,
 * jumps to source on click, and updates live as the user edits.
 */
export class SvgDocumentSymbolProvider implements vscode.DocumentSymbolProvider {
  private readonly parser = new SvgOutlineParser();

  provideDocumentSymbols(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    if (!document.uri.fsPath.toLowerCase().endsWith('.svg')) {
      return [];
    }
    const nodes = this.parser.parse(document.getText());
    return nodes.map((node) => this.toDocumentSymbol(node, document));
  }

  private toDocumentSymbol(node: SvgOutlineNode, document: vscode.TextDocument): vscode.DocumentSymbol {
    const range = new vscode.Range(document.positionAt(node.startOffset), document.positionAt(node.endOffset));
    const selectionRange = new vscode.Range(
      document.positionAt(node.nameStartOffset),
      document.positionAt(node.nameEndOffset),
    );
    const kind = node.children.length > 0 ? vscode.SymbolKind.Namespace : vscode.SymbolKind.Object;
    const symbol = new vscode.DocumentSymbol(node.label(), '', kind, range, selectionRange);
    symbol.children = node.children.map((child) => this.toDocumentSymbol(child, document));
    return symbol;
  }
}
