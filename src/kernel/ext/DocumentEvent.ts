import type { SvgDocument } from '../model/SvgDocument';

/** Lifecycle event emitted by EditorSession for stateful observer plugins (e.g. modified-star). */
export class DocumentEvent {
  constructor(
    readonly kind: 'init' | 'read' | 'save' | 'canvas' | 'edit' | 'undo' | 'redo',
    readonly document: SvgDocument,
  ) {}
}
