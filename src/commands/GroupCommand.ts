import { EditorError } from '../model/EditorError';
import { Group } from '../model/Group';
import type { Shape } from '../model/Shape';
import type { SvgDocument } from '../model/SvgDocument';
import type { Command } from './Command';
import { Placement } from './Placement';

/**
 * `group <newGid> <id1> <id2> …` — wraps existing shapes in a new `<g>`.
 * The group takes the place of the first member (in document order); members
 * keep their relative document order inside it. One undo unit.
 */
export class GroupCommand implements Command {
  private readonly group: Group;
  private placements: Placement[] = [];

  constructor(
    private readonly doc: SvgDocument,
    groupId: string,
    private readonly memberIds: readonly string[],
  ) {
    this.group = new Group(groupId);
  }

  execute(): string {
    const members = this.validate();
    const first = Placement.detach(members[0]);
    this.placements = [first, ...members.slice(1).map((member) => Placement.detach(member))];
    first.parent.insert(this.group, first.index);
    for (const member of members) {
      this.group.insert(member);
    }
    return `${this.group.ref()} created with ${members.length} children`;
  }

  undo(): string {
    for (const placement of this.placements) {
      this.group.remove(placement.shape);
    }
    Placement.detach(this.group);
    for (const placement of [...this.placements].reverse()) {
      placement.restore();
    }
    return `${this.group.ref()} grouping undone`;
  }

  /** All checks happen before any change; returns the members in document order. */
  private validate(): Shape[] {
    this.doc.requireNewId(this.group.id);
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
    const order = this.doc.allShapes();
    return [...members].sort((a, b) => order.indexOf(a) - order.indexOf(b));
  }
}
