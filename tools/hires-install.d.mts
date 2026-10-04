/** Types for `tools/hires-install.mjs`, so the unit tests can import it (release 39). */
export interface InstallJob {
  kind: 'link' | 'derive3' | 'replace' | 'drop';
  id: string;
  from: string | null;
  to: string;
  bytes: number;
  size?: [number, number];
}
export declare function oneXPath(art: string, outputPath: string): string;
export declare const HELD_BACKDROPS: Readonly<Record<string, string>>;
export declare function backdropKey(outputPath: string): string | null;
export declare function sameFile(a: string, b: string): boolean;
export declare function park(to: string, art: string, parkDir: string | null): { path: string; bytes: number; links: number; note?: string; parkedTo?: string };
export declare function plan(opts: { lib: string; art: string; only: string[]; scales: number[]; backdropMax?: number; redo3?: boolean; replaceFrom?: string | null; held?: Readonly<Record<string, string>> }): Promise<{ jobs: InstallJob[]; skipped: Array<{ id: string; why: string }> }>;
export declare function derive3(sharp: unknown, job: { from: string; to: string; size: [number, number] }): Promise<void>;
