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

/** What the build writes for one art JSON file (r47-rc, FOC46-06). */
export interface ShippedArtJson {
  /** The text the build writes. */
  text: string;
  /** True for a painting sidecar (cut to the fields the game reads), false for any other art JSON (local paths replaced). */
  sidecar: boolean;
  /** A sidecar: the keys kept, in the master's order. */
  kept: string[];
  /** A sidecar: the keys left out (names only). */
  dropped: string[];
  /** Any other file: string values rewritten, and paths replaced. */
  strings: number;
  paths: number;
  /** Any other file: true when the text was not JSON and was redacted as plain text. */
  plain: boolean;
}

export interface BuildRedaction {
  /** Art JSON files seen. */
  files: number;
  /** Of them, painting sidecars. */
  sidecars: number;
  /** Keys kept and keys left out, summed over the sidecars. */
  keysKept: number;
  keysDropped: number;
  /** Files written (a file already in its shipped form is not written again). */
  changed: number;
  /** Non-sidecar files: string values rewritten and local paths replaced. */
  strings: number;
  paths: number;
  changedFiles: string[];
  plain: string[];
}

export function redactJsonText(text: string): JsonRedaction;
/** The text the build writes for an art JSON file: a sidecar cut to the fields the game reads, any other file with its local paths replaced. */
export function shippedArtJsonText(rel: string, masterText: string): ShippedArtJson;
export function listMasterSidecars(publicDir: string): MasterSidecar[];
export function redactBuildSidecars(outDir: string): BuildRedaction;
