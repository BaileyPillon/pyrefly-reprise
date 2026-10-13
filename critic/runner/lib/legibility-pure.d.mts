/** Types for `critic/runner/lib/legibility-pure.mjs`, so the unit tests can import it. */
export declare const LEGIBILITY_FLOOR_PX: number;
export declare const UNDER_KEPT: number;
export interface TextItem { t: string; px: number; cls: string; sw: number; cw: number; clipped: boolean; ell: boolean }
export interface TextRaw { vw: number; vh: number; scrollW: number; clientW: number; items: TextItem[] }
export interface Legibility {
  floor: number; count: number; min: number | null; underCount: number; under: { text: string; px: number; cls: string }[];
  truncatedCount: number; truncated: { text: string; sw: number; cw: number; cls: string }[];
  scrollW: number | null; clientW: number | null; vw: number | null; vh: number | null; hScroll: boolean | null;
}
export declare function collectText(): TextRaw;
export declare function judgeLegibility(raw: TextRaw | null | undefined, floor?: number): Legibility;
export interface Surface { label: string; size?: string | null; result: Legibility | { unverified: string } | null }
export interface SweepSummary {
  floor: number; surfaces: number; measured: number; unverified: { label: string; size: string | null; why: string }[]; elements: number; min: number | null;
  underCount: number; surfacesUnder: string[]; truncatedCount: number; surfacesTruncated: string[]; hScroll: string[];
}
export declare function sweepSummary(surfaces: Surface[], floor?: number): SweepSummary;
export declare function sweepReportLine(name: string, summary: SweepSummary): string;
