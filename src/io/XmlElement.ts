import type { XmlText } from './XmlText';

/** A parsed XML element: name, attributes in source order, child nodes. */
export class XmlElement {
  readonly attributes = new Map<string, string>();
  readonly children: (XmlElement | XmlText)[] = [];

  constructor(readonly name: string) {}

  elements(): XmlElement[] {
    return this.children.filter((child): child is XmlElement => child instanceof XmlElement);
  }

  /** Concatenated character data of all descendants. */
  textContent(): string {
    return this.children.map((child) => child.textContent()).join('');
  }
}
