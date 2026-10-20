import type { ShapeFactory } from '../factory/ShapeFactory';
import type { Container } from '../model/Container';
import { EditorError } from '../model/EditorError';
import { Num } from '../model/Num';
import { SvgDocument } from '../model/SvgDocument';
import { IdAllocator } from './IdAllocator';
import type { XmlElement } from './XmlElement';
import { XmlParser } from './XmlParser';

/**
 * SVG text → SvgDocument. Elements are built through the ShapeFactory, so the
 * reader knows no concrete shape type. Missing or duplicate ids are replaced
 * by generated ones and reported through `warn`.
 */
export class SvgReader {
  constructor(private readonly factory: ShapeFactory) {}

  read(source: string, warn: (message: string) => void): SvgDocument {
    const root = XmlParser.parse(source);
    if (root.name !== 'svg') {
      throw new EditorError(`invalid svg: root element is <${root.name}>, expected <svg>`);
    }
    const [width, height] = this.canvasSize(root);
    const doc = new SvgDocument(width, height);
    const allocator = new IdAllocator(this.explicitIds(root));
    this.readChildren(root, doc, new Set<string>(), allocator, warn);
    return doc;
  }

  private readChildren(element: XmlElement, parent: Container, claimed: Set<string>, allocator: IdAllocator, warn: (message: string) => void): void {
    for (const child of element.elements()) {
      if (!this.factory.has(child.name)) {
        warn(`skipped unsupported element <${child.name}>`);
        continue;
      }
      const id = this.chooseId(child, claimed, allocator, warn);
      const shape = this.factory.createFromElement(child.name, id, child.attributes, child.textContent().trim());
      if (shape === null) {
        continue;
      }
      parent.insert(shape);
      const container = shape.asContainer();
      if (container !== null) {
        this.readChildren(child, container, claimed, allocator, warn);
      }
    }
  }

  private chooseId(element: XmlElement, claimed: Set<string>, allocator: IdAllocator, warn: (message: string) => void): string {
    const explicit = element.attributes.get('id');
    if (explicit !== undefined && explicit !== '' && !claimed.has(explicit)) {
      claimed.add(explicit);
      return explicit;
    }
    const id = allocator.next(element.name);
    claimed.add(id);
    if (explicit === undefined || explicit === '') {
      warn(`assigned id ${id} to unnamed <${element.name}>`);
    } else {
      warn(`duplicate id ${explicit} on <${element.name}>, reassigned to ${id}`);
    }
    return id;
  }

  /** Every id present on a supported element, so generated ids never collide with later ones. */
  private explicitIds(element: XmlElement): string[] {
    return element.elements().flatMap((child) => {
      if (!this.factory.has(child.name)) {
        return [];
      }
      const id = child.attributes.get('id');
      return [...(id ? [id] : []), ...this.explicitIds(child)];
    });
  }

  /** width/height attributes, else the viewBox size, else the default canvas. */
  private canvasSize(root: XmlElement): [number, number] {
    const viewBox = (root.attributes.get('viewBox') ?? '').trim().split(/[\s,]+/);
    const width = this.dimension(root.attributes.get('width')) || this.dimension(viewBox[2]) || SvgDocument.DEFAULT_WIDTH;
    const height = this.dimension(root.attributes.get('height')) || this.dimension(viewBox[3]) || SvgDocument.DEFAULT_HEIGHT;
    return [width, height];
  }

  /** Absolute length or 0 when absent, relative (%) or not positive. */
  private dimension(value: string | undefined): number {
    if (value === undefined || value.trim().endsWith('%')) {
      return 0;
    }
    const n = Num.parseLenient(value);
    return n > 0 ? n : 0;
  }
}
