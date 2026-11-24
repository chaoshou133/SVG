import type { ShapeRegistry } from '../ext/ShapeRegistry';
import { EditorError } from '../model/EditorError';
import { Num } from '../model/Num';
import type { Shape } from '../model/Shape';
import { SvgDocument } from '../model/SvgDocument';
import { IdAllocator } from './IdAllocator';
import type { XmlElement } from './XmlElement';
import { XmlParser } from './XmlParser';

/**
 * SVG text → SvgDocument.
 * Elements are built through ShapeRegistry, so the reader knows no concrete
 * shape class. Supports specialized `data-kind` composite providers with
 * clean fallback degradation when a plugin is absent or structure is incomplete,
 * while strictly rejecting duplicate IDs involving composite shapes.
 */
export class SvgReader {
  constructor(private readonly shapes: ShapeRegistry) {}

  read(source: string, warn: (message: string) => void): SvgDocument {
    const root = XmlParser.parse(source);
    if (root.name !== 'svg') {
      throw new EditorError(`invalid svg: root element is <${root.name}>, expected <svg>`);
    }
    const [width, height] = this.canvasSize(root);
    const doc = new SvgDocument(width, height);
    const allocator = new IdAllocator(this.explicitIds(root));
    const claimed = new Set<string>();
    const children = this.readElementList(root, claimed, allocator, warn, false);
    for (const shape of children) {
      doc.insert(shape);
    }
    return doc;
  }

  private readElementList(
    parentXml: XmlElement,
    claimed: Set<string>,
    allocator: IdAllocator,
    warn: (message: string) => void,
    strictUniqueIds: boolean,
  ): Shape[] {
    const result: Shape[] = [];
    for (const child of parentXml.elements()) {
      const dataKind = child.attributes.get('data-kind');
      const specialized = this.shapes.findSpecialized(child.name, dataKind);
      const plain = this.shapes.findForElement(child.name, undefined);

      if (specialized === undefined && plain === undefined) {
        warn(`skipped unsupported element <${child.name}>`);
        continue;
      }

      const isCompositeRead = specialized !== undefined;
      const enforceUnique = strictUniqueIds || isCompositeRead;
      const id = this.chooseId(child, claimed, allocator, warn, enforceUnique);

      if (isCompositeRead) {
        // Parse child subtree first so specialized provider can validate invariants.
        const parsedChildren = this.readElementList(child, claimed, allocator, warn, true);
        const composite = specialized.createFromElement(
          id,
          child.attributes,
          child.textContent().trim(),
          parsedChildren,
          warn,
        );
        if (composite !== null) {
          result.push(composite);
          continue;
        }
        // Degradation fallback: construct plain container (e.g. <g>) and keep parsed children.
        if (plain !== undefined) {
          const fallback = plain.createFromElement(id, child.attributes, child.textContent().trim(), [], warn);
          if (fallback !== null) {
            const container = fallback.asContainer();
            if (container !== null) {
              for (const c of parsedChildren) {
                container.insert(c);
              }
            }
            result.push(fallback);
          }
        }
        continue;
      }

      const shape = (plain as NonNullable<typeof plain>).createFromElement(
        id,
        child.attributes,
        child.textContent().trim(),
        [],
        warn,
      );
      if (shape === null) {
        continue;
      }
      const container = shape.asContainer();
      if (container !== null) {
        const sub = this.readElementList(child, claimed, allocator, warn, enforceUnique);
        for (const subShape of sub) {
          container.insert(subShape);
        }
      }
      result.push(shape);
    }
    return result;
  }

  private chooseId(
    element: XmlElement,
    claimed: Set<string>,
    allocator: IdAllocator,
    warn: (message: string) => void,
    rejectDuplicate: boolean,
  ): string {
    const explicit = element.attributes.get('id');
    if (explicit !== undefined && explicit !== '') {
      if (!claimed.has(explicit)) {
        claimed.add(explicit);
        return explicit;
      }
      if (rejectDuplicate) {
        throw new EditorError(`duplicate id in svg: ${explicit}`);
      }
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

  private explicitIds(element: XmlElement): string[] {
    return element.elements().flatMap((child) => {
      if (!this.shapes.hasTag(child.name)) {
        return [];
      }
      const id = child.attributes.get('id');
      return [...(id ? [id] : []), ...this.explicitIds(child)];
    });
  }

  private canvasSize(root: XmlElement): [number, number] {
    const viewBox = (root.attributes.get('viewBox') ?? '').trim().split(/[\s,]+/);
    const width = this.dimension(root.attributes.get('width')) || this.dimension(viewBox[2]) || SvgDocument.DEFAULT_WIDTH;
    const height = this.dimension(root.attributes.get('height')) || this.dimension(viewBox[3]) || SvgDocument.DEFAULT_HEIGHT;
    return [width, height];
  }

  private dimension(value: string | undefined): number {
    if (value === undefined || value.trim().endsWith('%')) {
      return 0;
    }
    const n = Num.parseLenient(value);
    return n > 0 ? n : 0;
  }
}
