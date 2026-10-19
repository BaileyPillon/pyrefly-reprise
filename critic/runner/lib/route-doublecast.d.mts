/** Types for `critic/runner/lib/route-doublecast.mjs`, so the unit test can import it. */
export function doublecastCasts(label: unknown): string[];
export function isSpellRow(name: string): (label: string) => boolean;
export function containsSpellRow(name: string): (label: string) => boolean;
export interface DoublecastRecord { turn: number; actor: string; want: { label: string; target: string | null }; casts: string[]; steps: Array<{ found?: string | null; k?: number; spell?: string | null }> }
export function playDoublecast(o: {
  chooser: { choose: (pred: (label: string) => boolean) => Promise<string | null> };
  adv: { label: string; target: string | null };
  confirmTarget: (name: string | null) => Promise<unknown>;
  menuStillOpen: () => Promise<boolean>;
  wait: (ms: number) => Promise<void>;
  turn: number;
  phase: string;
}): Promise<DoublecastRecord>;
