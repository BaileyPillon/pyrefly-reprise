import type { ModelRow, PoseReading } from './pose-model.mjs';

/** The stamped fields, in the order they are written. */
export const STAMP_FIELDS: readonly ['status', 'class', 'stature', 'headReal', 'lengthRatio', 'iou', 'sha'];

export type TableTag = 'ffx' | 'ffx2' | 'foes' | 'exp';
export const TABLE_GROUPS: ReadonlyArray<{ tag: TableTag; file: string; name: string }>;

export interface ParsedRow {
  key: string;
  /** `[field, TypeScript source of the value]`, in file order. */
  entries: Array<[string, string]>;
}
export interface ParsedSubject {
  key: string;
  rows: ParsedRow[];
}
export interface ParsedTable {
  eol: string;
  head: string[];
  name: string;
  subjects: ParsedSubject[];
  tail: string[];
}

export interface Stamp {
  subject: string;
  pose: string;
  fields: Partial<ModelRow>;
  status: 'ok' | 'held' | 'waived' | 'blocked';
  game: string;
  record: { game?: string } | undefined;
}

export function parseTable(text: string): ParsedTable;
export function renderTable(t: ParsedTable): string;
export function groupFor(subject: string, record: { game?: string } | undefined, modelGame: string): TableTag;
export function computeStamps(
  readings: PoseReading[],
  inputs: { table: Record<string, Record<string, ModelRow>> },
  records: { subjects?: Record<string, { game?: string; poses?: Record<string, Record<string, unknown>> }> } | undefined,
  waivers: Map<string, unknown>,
): Stamp[];
export function applyStamps(
  tables: Record<string, ParsedTable>,
  stamps: Stamp[],
  opt?: { only?: Set<string> },
): { changed: Set<string>; added: number; updated: number };
export function readTables(root: string): Record<string, ParsedTable>;
export function writeTables(root: string, tables: Record<string, ParsedTable>, tags: Set<string>): void;
