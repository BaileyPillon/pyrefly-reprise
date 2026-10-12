/** Types for `critic/runner/lib/gap-boot.mjs`, so the unit tests can import it. */
import type { BootedChapter } from './sweep.mjs';

export interface BootOptions {
  base: string; evidence: string; id: string; dir: string; size?: string; touch?: boolean; word?: string | null; seed?: number; untilMenu?: boolean; stopAtPrep?: boolean;
}
export declare function bootChapter(o: BootOptions): Promise<BootedChapter & Record<string, any>>;
