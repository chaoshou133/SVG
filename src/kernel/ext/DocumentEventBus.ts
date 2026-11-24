import type { DocumentEvent } from './DocumentEvent';
import type { DocumentEventListener } from './DocumentEventListener';

/** Simple synchronous event bus owned by EditorSession (Observer pattern). */
export class DocumentEventBus {
  private readonly listeners: DocumentEventListener[] = [];

  subscribe(listener: DocumentEventListener): void {
    this.listeners.push(listener);
  }

  emit(event: DocumentEvent): void {
    for (const listener of this.listeners) {
      listener.onDocumentEvent(event);
    }
  }
}
