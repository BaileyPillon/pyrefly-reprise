/** Types for `tools/hires-install.mjs`, so the unit tests can import it (release 39). */
export interface InstallJob {
  kind: 'link' | 'derive3';
  id: string;
  from: string;
  to: string;
  bytes: number;
  size?: [number, number];
}
export declare function oneXPath(art: string, outputPath: string): string;
export declare function plan(opts: { lib: string; art: string; only: string[]; scales: number[]; backdropMax?: number; redo3?: boolean }): Promise<{ jobs: InstallJob[]; skipped: Array<{ id: string; why: string }> }>;
export declare function derive3(sharp: unknown, job: { from: string; to: string; size: [number, number] }): Promise<void>;
