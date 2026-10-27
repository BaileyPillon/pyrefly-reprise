/** Types for `tools/measure/capture.mjs` and `channels.mjs`. */
export interface CaptureResult { started: string; hz: number; query: string; chapter: string; frames: any[]; events: any[]; result: any; steps: number[]; virtualMs: number; consoleErrors: string[]; diag: Record<string, unknown> }
export declare function captureSession(o: {
  root: string; base: string; query?: string; chapter: string; hz: number; viewport?: { width: number; height: number }; who: string; what: string; maxMinutes?: number; log?: (...a: unknown[]) => void;
  play: (s: { g: any; stepper: any; acc: any; hz: number }) => Promise<any>; afterOpen?: (g: any) => Promise<void>;
}): Promise<CaptureResult>;
