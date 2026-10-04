/**
 * Types for `tools/decisions-ledger-lib.mjs`, so tests/unit/decisions-ledger.test.ts (TypeScript, type-checked by
 * `tsc --noEmit`) can import the ledger's loader, validator and renderer directly instead of shelling out to node.
 *
 * Same arrangement as `tools/critic-pending.mjs` / `critic-pending.d.mts`. This file declares the module's whole
 * public surface: if you add an export over there, add it here too.
 */

export type DecisionState = 'proposed' | 'adopted' | 'deferred' | 'rejected' | 'superseded' | 'verified';
export type GameCase = 'ffx' | 'ffx2' | 'both' | 'ff7';
export type Delivery = 'not-scheduled' | 'in-progress' | 'implemented' | 'verified' | null;

/** One recommendation split out of a bundled acceptance; it inherits what it does not set. */
export interface DecisionPart {
  ref: string;
  title: string;
  changed: string;
  words?: string | null;
  state?: DecisionState;
  supersededBy?: string;
  game?: GameCase;
  delivery?: Delivery;
  area?: string;
  where?: string;
}

/** A row of docs/target/decisions.json or docs/target/decisions-early.json. */
export interface DecisionRow {
  id: string;
  date: string;
  title: string;
  words: string | null;
  state: DecisionState;
  supersededBy?: string;
  game: GameCase;
  delivery: Delivery;
  area?: string;
  changed?: string;
  rule?: string;
  parts?: DecisionPart[];
  where: string;
  [other: string]: unknown;
}

export interface DecisionsFile {
  note?: string;
  decisions: DecisionRow[];
}

export interface TargetTile {
  label: string;
  state: string;
  [other: string]: unknown;
}

export interface TargetsFile {
  groups: Array<{ id: string; evidence?: string; tiles: TargetTile[]; [other: string]: unknown }>;
  [other: string]: unknown;
}

export interface LedgerModel {
  registry: DecisionsFile;
  early: DecisionsFile;
  targets: TargetsFile;
}

/** One decision as the ledger lists it: a registry row, an early row, a part of one, or a picture decision. */
export interface LedgerEntry {
  id: string | null;
  kind: 'registry' | 'early' | 'part' | 'picture';
  date: string | null;
  title: string;
  words: string | null;
  state: string;
  game: GameCase | null;
  delivery: Delivery;
  area: string;
  changed: string | null;
  rule?: string;
  where: string;
  parent?: string;
}

export const STATES: readonly DecisionState[];
export const DELIVERIES: readonly Delivery[];
export const GAMES: readonly GameCase[];
export const AREAS: readonly string[];
export const PROJECT_START: string;
export const BLANKET: RegExp;

/** True when Bailey's words are a blanket yes that accepts a list without naming it. */
export function isBlanket(words: unknown): boolean;

/** Reads the three data files from a repo root (a missing early file is an empty one). */
export function loadModel(root: string): LedgerModel;

/** Every decision as one flat list: registry rows, early rows, their parts, then the picture decisions. */
export function buildEntries(model: LedgerModel): LedgerEntry[];

/** Problems in the data as readable lines; empty means the ledger can be rendered. */
export function validateModel(model: LedgerModel): string[];

/** The whole ledger as markdown, validated first (throws on invalid data). */
export function render(model: LedgerModel): string;
