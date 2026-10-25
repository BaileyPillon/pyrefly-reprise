export const FILES_DOC: string;
export interface FileRow {
  file: string;
  old: string | null;
  new: string;
}
export type RowState = 'ready' | 'done' | 'add' | 'missing' | 'conflict';
export interface ClassifiedRow extends FileRow {
  have: string | null;
  state: RowState;
}
export function parseFilesDoc(md: string): FileRow[];
export function classify(rows: FileRow[], shaOf: (file: string) => string | null): ClassifiedRow[];
export function summarize(classified: ClassifiedRow[]): { ready: number; done: number; add: number; missing: number; conflict: number; total: number; ok: boolean };
export function install(classified: ClassifiedRow[], artDir: string, mirrorDir: string): string[];
