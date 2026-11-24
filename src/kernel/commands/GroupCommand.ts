import type { ShapeRegistry } from '../ext/ShapeRegistry';
import type { Container } from '../model/Container';
import { EditorError } from '../model/EditorError';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import { Placement } from './Placement';
import type { UndoableCommand } from './UndoableCommand';

/**
 * `group <newGid> <id1> <id2> …`
 * Instantiates the `<g>` container via ShapeRegistry (no concrete Group import)
 * and guards composite child ownership invariants before detaching any member.
 */
export class GroupCommand implements UndoableCommand {
  private groupShape: Shape | null = null;
  private groupContainer: Container | null = null;
  private placements: Placement[] = [];

  constructor(
    private readonly doc: SvgDocument,
    private readonly groupId: string,
    private readonly memberIds: readonly string[],
    private readonly shapes: ShapeRegistry,
  ) {}

  execute(): string {
    const members = this.validate();
    const groupShape = this.groupShape ?? this.shapes.createFromArgs('g', this.groupId, []);
    const groupContainer = groupShape.asContainer();
    if (groupContainer === null) {
      throw new EditorError('registered g shape is not a container');
    }
    this.groupShape = groupShape;
    this.groupContainer = groupContainer;

    const first = Placement.detach(members[0]);
    this.placements = [first, ...members.slice(1).map((member) => Placement.detach(member))];
    first.parent.insert(groupShape, first.index);
    for (const member of members) {
      groupContainer.insert(member);
    }
    return `${groupShape.ref()} created with ${members.length} children`;
  }

  undo(): string {
    const groupShape = this.groupShape as Shape;
    const groupContainer = this.groupContainer as Container;
    for (const placement of this.placements) {
      groupContainer.remove(placement.shape);
    }
    Placement.detach(groupShape);
    for (const placement of [...this.placements].reverse()) {
      placement.restore();
    }
    return `${groupShape.ref()} grouping undone`;
  }

  private validate(): Shape[] {
    this.doc.requireNewId(this.groupId);
    const members = this.memberIds.map((id) => this.doc.require(id));
    const seen = new Set<string>();
    for (const member of members) {
      if (seen.has(member.id)) {
        throw new EditorError(`duplicate id in group: ${member.id}`);
      }
      seen.add(member.id);
    }
    for (const outer of members) {
      if (members.some((inner) => outer.isAncestorOf(inner))) {
        throw new EditorError(`cannot group a container into its own descendant: ${outer.id}`);
      }
    }
    for (const member of members) {
      (member.parent as Container).assertCanDetachChild(member);
    }
    const order = this.doc.allShapes();
    return [...members].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
}
