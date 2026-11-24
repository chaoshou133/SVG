/** Declared extension contributions from a plugin's `package.json` `contributes` field. */
export interface PluginManifest {
  readonly name: string;
  readonly contributes?: {
    readonly shapes?: readonly string[];
    readonly commands?: readonly string[];
    readonly decorators?: readonly string[];
    readonly attributes?: readonly string[];
  };
}
