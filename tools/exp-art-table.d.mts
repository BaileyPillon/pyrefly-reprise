type Row = { scale?: number; stanceX?: number; feetRow?: number; upright?: true };
export type RegistrationTable = Record<string, Record<string, Row>>;
export interface BaseTables {
  registration: Record<string, Record<string, Row>>;
  ko: Record<string, number>;
}
export interface InstalledRecord {
  baselineY?: number;
  row?: Row;
  [key: string]: unknown;
}
export interface BuildOptions {
  readSidecar?: (subject: string, pose: string) => { baselineY?: number; scale?: number } | null;
  statesOf?: (subject: string) => readonly string[];
}
export function loadBaseTables(): Promise<BaseTables>;
export function buildExpRegistration(
  base: BaseTables,
  subjects: readonly string[],
  installed?: Record<string, Record<string, InstalledRecord>>,
  opts?: BuildOptions,
): RegistrationTable;
export function renderExpRegistration(table: RegistrationTable): string;
export interface ExpFigureMetricsRow {
  width: number;
  height: number;
  baselineY: number;
  facing: 'right' | 'left' | 'front' | 'auto';
}
export function buildExpFigureMetrics(
  subjects: readonly string[],
  readIdle: (subject: string) => { width?: number; height?: number; baselineY?: number; facing?: string } | null,
): Record<string, ExpFigureMetricsRow>;
export function renderExpFigureMetrics(table: Record<string, ExpFigureMetricsRow>): string;
