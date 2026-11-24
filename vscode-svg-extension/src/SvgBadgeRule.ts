/**
 * Pure badge decision rule decoupled from the `vscode` runtime so it can be
 * unit-tested directly without launching an Extension Development Host.
 */
export class SvgBadgeRule {
  static readonly BADGE = '[]';
  static readonly TOOLTIP = 'SVG Vector File';

  /** Returns `[]` only for regular `.svg` files; directories and other files return null. */
  evaluate(fsPath: string, isDirectory: boolean): { badge: string; tooltip: string } | null {
    if (isDirectory) {
      return null;
    }
    if (!fsPath.toLowerCase().endsWith('.svg')) {
      return null;
    }
    return { badge: SvgBadgeRule.BADGE, tooltip: SvgBadgeRule.TOOLTIP };
  }
}
