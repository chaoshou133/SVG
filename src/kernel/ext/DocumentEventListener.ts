import type { DocumentEvent } from './DocumentEvent';

/** Observer interface allowing plugins to react to document edits, saves, undos, and loads. */
export interface DocumentEventListener {
  onDocumentEvent(event: DocumentEvent): void;
}
