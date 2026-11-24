/** Character data inside an XML element (entities already decoded). */
export class XmlText {
  constructor(readonly value: string) {}

  textContent(): string {
    return this.value;
  }
}
