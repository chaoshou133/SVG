/** Generates `tag + n` ids (rect1, rect2 …) that collide with no id already in use. */
export class IdAllocator {
  private readonly used: Set<string>;
  private readonly counters = new Map<string, number>();

  constructor(used: Iterable<string>) {
    this.used = new Set(used);
  }

  next(tagName: string): string {
    let n = this.counters.get(tagName) ?? 1;
    while (this.used.has(`${tagName}${n}`)) {
      n++;
    }
    const id = `${tagName}${n}`;
    this.counters.set(tagName, n + 1);
    this.used.add(id);
    return id;
  }
}
