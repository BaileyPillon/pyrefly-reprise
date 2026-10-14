export interface JsonRedaction {
  /** The text with each string value that held a local path rewritten (the input itself when nothing changed). */
  text: string;
  /** String values rewritten. */
  strings: number;
  /** Local paths replaced. */
  paths: number;
  /** True when the text was not JSON and was redacted as plain text. */
  plain: boolean;
}

export interface MasterSidecar {
  rel: string;
  full: string;
  bytes: number;
}

export interface BuildRedaction {
  files: number;
  changed: number;
  strings: number;
  paths: number;
  changedFiles: string[];
  plain: string[];
}

export function redactJsonText(text: string): JsonRedaction;
export function listMasterSidecars(publicDir: string): MasterSidecar[];
export function redactBuildSidecars(outDir: string): BuildRedaction;
