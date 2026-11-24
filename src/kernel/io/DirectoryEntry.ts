/** Single direct child entry returned by DirectoryAccess (Adapter domain DTO). */
export class DirectoryEntry {
  constructor(
    readonly name: string,
    readonly kind: 'dir' | 'file' | 'symlink' | 'other',
  ) {}
}
