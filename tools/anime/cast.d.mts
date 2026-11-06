/** Types for `tools/anime/cast.mjs`: the anime chapter's three girls, made from the stored Meshy LOD1 files. */
import type { Glb } from './glbkit.mjs';
import type { ProportionParams } from './proportion.mjs';
import type { RetargetReport } from './retarget.mjs';

export declare const RECIPES: Readonly<Record<'yuna' | 'rikku' | 'paine', Omit<ProportionParams, 'k'>>>;
export declare const CLIP_MAP: ReadonlyArray<readonly [string, string]>;
export declare function makeGirl(id: 'yuna' | 'rikku' | 'paine', origFile: string, wwFile: string, p?: Partial<ProportionParams>): { glb: Glb; measure: { total: number; headLength: number; hips: number }; clips: RetargetReport[] };
