import * as vscode from 'vscode';
import { SvgBadgeRule } from './SvgBadgeRule';

/**
 * VSCode FileDecorationProvider that attaches a `[]` badge next to `.svg` files
 * in the Explorer without modifying file names or contents.
 */
export class SvgFileDecorationProvider implements vscode.FileDecorationProvider {
  private readonly rule = new SvgBadgeRule();

  async provideFileDecoration(uri: vscode.Uri): Promise<vscode.FileDecoration | undefined> {
    if (uri.scheme !== 'file') {
      return undefined;
    }
    let isDirectory = false;
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      isDirectory = (stat.type & vscode.FileType.Directory) !== 0;
    } catch {
      return undefined;
    }
    const result = this.rule.evaluate(uri.fsPath, isDirectory);
    if (result === null) {
      return undefined;
    }
    return new vscode.FileDecoration(result.badge, result.tooltip);
  }
}
