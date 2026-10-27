export interface TimelineMark { t: number; k: string; v: unknown }
export interface TimelinePart { name: string; startMs: number; endMs: number; ms: number }
export interface TimelineSplit {
  totalMs: number;
  parts: TimelinePart[];
  deadMs: number;
  loadMs: number;
  authoredMs: number;
  facts: Record<string, number | null>;
  warm: { before: string[]; after: Array<{ atMs: number; what: string }> };
  worstGapMs: number;
  gapsOver100: number;
  gapsOver250: number;
  lostMs: number;
  lostFirst9sMs: number;
}
/** Cut one fight-start run (the instrument's marks) into its parts, from the press to the first command menu. Pure. */
export declare function splitTimeline(ft: { marks: TimelineMark[]; gaps: Array<[number, number]>; long?: Array<[number, number]>; warm?: Array<{ ms: number; what: string }> | null }): TimelineSplit;
