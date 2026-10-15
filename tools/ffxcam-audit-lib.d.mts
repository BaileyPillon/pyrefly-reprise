/** Types for `tools/ffxcam-audit-lib.mjs`, so the unit tests (type-checked by `tsc --noEmit`) can import it. */

/** A figure is in frame when at least this fraction of its box is on screen. */
export declare const SEEN_MIN: number;
/** The tracked figures of the first records. */
export declare const DEFAULT_IDS: string[];
/** The programs that are views of the whole fight. */
export declare const DEFAULT_VIEW_PROGRAMS: Set<string>;
/** The best-placed subject takes less than this fraction of the picture's height: a speck (not part of the verdict). */
export declare const SPECK_HEIGHT: number;
/** A gap in the record longer than this ends a lost stretch. */
export declare const GAP_MS: number;

/** Column indices of a frame row for `n` tracked figures (`win`: the window reading, one fraction per figure; `rect`: the window's four edges, in records made since the phone fix). */
export declare function layout(n: number): { frame: number; t: number; steps: number; prog: number; beat: number; fr: number; eye: number; ref: number; roll: number; fov: number; boxes: number; net: number; range: number; win: number; rect: number };

/** The readings of "in frame" a verdict can use: the net's, the window's (what the player sees), or the window's when the record has it. */
export declare const READINGS: readonly ['auto', 'net', 'window'];
export type Reading = (typeof READINGS)[number];

export interface AuditBeat {
  i?: number;
  t?: number;
  step?: number;
  beat: string;
  actor: string | null;
  side?: string | null;
  targets: string[];
  ability?: string | null;
  kind?: string | null;
  shape?: string | null;
}

/** One record as the page writes it (the parts the arithmetic reads). */
export interface AuditRecord {
  seed?: number;
  /** The canvas's aspect and the window's (a phone shows a slice of a 16:9 canvas). */
  aspect?: number;
  windowAspect?: number;
  cfg?: { ids?: string[]; /** The website table camera's whole-fight shot ids (the default views, the scenes, the victory, the defeat): its record names them, the programs' ids are the default. */ wholeFight?: string[] };
  programs: string[];
  beats: AuditBeat[];
  frames: number[][];
  interventions?: Array<{ kind: string; step: number; key: string }>;
}

export interface AuditRow {
  i: number;
  t: number;
  dt: number;
  step: number;
  program: string;
  beat: string;
  beatIndex: number;
  rule: 'default' | 'action';
  subjects: string[];
  best: number | null;
  bestApp: number | null;
  lost: boolean;
  /** In frame but a speck: the best subject takes less than SPECK_HEIGHT of the picture's height. */
  speck: boolean;
  net: number;
  /** The airship was pulled back (null for a record that does not say). */
  far: boolean | null;
  /** The reading this verdict used: the net's, or the window's. */
  reading: 'net' | 'window';
  /** Evrae's fraction in frame under that reading, or null when the record does not track him or he is hidden. */
  evrae: number | null;
  file: string;
}

export interface LostStretch {
  first: AuditRow;
  last: AuditRow;
  ms: number;
  lastT: number;
  programs: Set<string>;
}

/** The open action after each beat. */
export declare function openActions(beats: AuditBeat[]): Array<{ actor: string | null; targets: string[] } | null>;
/** One record into per-frame verdicts. */
export declare function analyse(rec: AuditRecord, file?: string, seen?: number, reading?: Reading): AuditRow[];
/** Runs of consecutive lost frames. */
export declare function stretches(rows: AuditRow[]): LostStretch[];
/** Totals and lost time per key. */
export declare function group(rows: AuditRow[], keyOf: (row: AuditRow) => string): Map<string, { total: number; lost: number; frames: number }>;
/** The program a net event's key names. */
export declare function programOfKey(key: string): string;
