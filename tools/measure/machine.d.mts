/** Types for `tools/measure/machine.mjs` (the parts the tests read). */
export interface MachineSummary { gpu: object | null; cpuBusy: { avg: number | null; max: number } | null }
export declare const BUSY_CPU_AVG: number;
export declare function busyNote(summary: { cpuBusy?: { avg: number | null; max: number } | null } | null | undefined): string | null;
export declare function summariseMachine(s: { smi: Array<{ at: number; v: unknown[] }>; cpu: Array<{ at: number; busy: number }> }, from: number, to: number): MachineSummary;
