/** Types for `tools/measure/ab-compose.mjs`. */
export declare const FFMPEG: string;
export declare function ffmpeg(args: string[], bin?: string, cwd?: string): void;
export declare function encodeSequence(o: { dir: string; fps: number; out: string; bin?: string; budget?: { maxBytes: number; crf: number; crfStep: number; crfMax: number }; maxFrames?: number }): { file: string; bytes: number; crf: number; over: boolean };
export interface ComposeResult { hz: number; crop: { x: number; y: number; w: number; h: number }; frames: number; window: { before: number; after: number }; clipCappedFromMs: number | null; files: Array<{ kind: string; file: string; bytes: number; seconds?: number; crf?: number; fps?: number; over?: boolean }>; key: Record<string, { id: string; name?: string }>; numbers: Record<string, unknown> }
export declare function composeCard(o: { spec: Record<string, any>; workDir: string; outDir: string; root: string; ffmpeg?: string; info?: Record<string, unknown> }): Promise<ComposeResult[]>;
export declare const badge: (letter: string, w: number, h: number) => Buffer;
export declare const stamp: (text: string, w: number, h: number, hot?: boolean) => Buffer;
export declare const esc: (s: string) => string;
export declare function sharp(root: string): Promise<any>;
export declare function writeStill(o: { S: any; file: string; title: string; subtitle: string; rows: Array<{ letter: string; cells: Buffer[] }>; cellW: number; cellH: number; foot?: string }): Promise<{ width: number; height: number }>;
