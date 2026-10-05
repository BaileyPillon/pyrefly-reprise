/** Types for `critic/runner/lib/continuity-strips.mjs`, so the unit tests can import it. */
export interface StripGeometry { view: number[]; ring: number[]; crop: number[]; cell: number[] }
export declare function toCell(strip: StripGeometry, x: number, y: number): [number, number];
export declare function composeStrip(o: {
  strip: StripGeometry; frames: (string | null)[]; marks: ({ feet: number[] | null; head: number[] | null } | null)[];
  guide: { headY: number | null; feetY: number | null }; title: string; captions: string[]; eventCell: number; quality?: number;
}): Promise<Buffer>;
