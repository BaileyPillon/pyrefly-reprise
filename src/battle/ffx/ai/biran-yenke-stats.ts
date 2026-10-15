/**
 * **The numbers the Ronso duel writes on Biran and Yenke from Kimahri's** (the hidden Biran and Yenke chapter; **FFX only** [AGENTS.md rule 14]). Pure: no imports, so the data
 * layer can precompute the shipped preset's numbers from the same function the battle runs (`data/ffx/enemies/biran-yenke.ts`).
 *
 * Source: `research/ffx-biran-yenke.md` §2.2. The two records (m134, m135) hold the same placeholder block (HP 9,999, Str 25, Mag 30, Agi 32, `[decompiled]`); the battle writes HP,
 * Strength, Magic and Agility from Kimahri's own stats when it starts. The formulas are the FF Wiki's, read through the web search tool's summaries (`[search]`: the pages were
 * refused by the session's network policy), with the conflicts of §11.1 resolved as that table says. Every constant is named, so a verified reading is a one-line change (§11.2).
 */

/** The four numbers of Kimahri's the battle reads. */
export interface KimahriNumbers {
  readonly str: number;
  readonly mag: number;
  /** His HP when the battle starts (Game8 reads it as the current HP; the preset starts at full). */
  readonly hp: number;
  readonly agi: number;
}

/** What the battle writes on one Ronso. */
export interface RonsoNumbers {
  readonly hp: number;
  readonly str: number;
  readonly mag: number;
  readonly agi: number;
}

/** Biran's Strength by step (the FF Wiki's table, `[search: single source]`). */
export const BIRAN_STR_TABLE: readonly number[] = [11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 27];
/**
 * Yenke's Magic by step. **Only its ends were legible** (8 at step 0, 22 at step 11 and above, `[search]`); the steps between are `[estimate]`: a straight line between the ends,
 * rounded half up, which at step 8 gives the same 18 as the shape of Biran's own table (§2.2, §11.2 item 1).
 */
export const YENKE_MAG_TABLE: readonly number[] = [8, 9, 11, 12, 13, 14, 16, 17, 18, 19, 21, 22];
/** `(V1 + V2) / 2 * 16 / 15`: the wiki's 16/15 (conflict B-1: one GameFAQs post writes 15/16). */
export const HP_SCALE_NUM = 16;
export const HP_SCALE_DEN = 15;
/** `* 586 / 730`: FFX's defence factor for Defense 30, the Ronso's own (§2.2, `[derived]`). */
export const HP_DEF_NUM = 586;
export const HP_DEF_DEN = 730;
/** Biran's HP is eight of the value, Yenke's six (conflict B-2: an older wiki copy has eight for Yenke too). */
export const BIRAN_HP_MULT = 8;
export const YENKE_HP_MULT = 6;
/** The step: `(Kimahri's HP - 644) / 200`, whole steps, 0 to 11. */
export const STEP_HP_BASE = 644;
export const STEP_HP_SIZE = 200;
/** Agility: Kimahri's less 4 (Biran) and less 8 (Yenke; conflict B-3: one post says 6). */
export const BIRAN_AGI_OFFSET = 4;
export const YENKE_AGI_OFFSET = 8;

/** The step the Strength and Magic tables are read at, 0 to 11. */
export function ronsoStep(kimahriHp: number): number {
  const step = Math.floor((Math.max(0, kimahriHp) - STEP_HP_BASE) / STEP_HP_SIZE);
  return Math.max(0, Math.min(BIRAN_STR_TABLE.length - 1, step));
}

/** The HP value both Ronso's HP are a multiple of: about one average of Kimahri's physical and magical blow against Defense 30. */
export function ronsoHpValue(k: KimahriNumbers): number {
  const half = Math.floor((k.str ** 3 + k.mag ** 3) / 2);
  const scaled = Math.floor((half * HP_SCALE_NUM) / HP_SCALE_DEN);
  return Math.floor(((Math.floor(scaled / 32) + 30) * HP_DEF_NUM) / HP_DEF_DEN);
}

/** The battle clamps every stat but HP and MP to 1..255 when it starts (as for every FFX monster). */
const clampStat = (n: number): number => Math.max(1, Math.min(255, Math.floor(n)));

/** Biran's numbers from Kimahri's. His Magic is half of Yenke's (`[search]`). */
export function biranNumbers(k: KimahriNumbers): RonsoNumbers {
  const step = ronsoStep(k.hp);
  return {
    hp: ronsoHpValue(k) * BIRAN_HP_MULT,
    str: clampStat(BIRAN_STR_TABLE[step] as number),
    mag: clampStat((YENKE_MAG_TABLE[step] as number) / 2),
    agi: clampStat(k.agi - BIRAN_AGI_OFFSET),
  };
}

/** Yenke's numbers from Kimahri's. His Strength is half of Biran's (`[inferred]`, §2.2: the summaries cut the line off; StrategyWiki's Bulldoze damage fits only this). */
export function yenkeNumbers(k: KimahriNumbers): RonsoNumbers {
  const step = ronsoStep(k.hp);
  return {
    hp: ronsoHpValue(k) * YENKE_HP_MULT,
    str: clampStat((BIRAN_STR_TABLE[step] as number) / 2),
    mag: clampStat(YENKE_MAG_TABLE[step] as number),
    agi: clampStat(k.agi - YENKE_AGI_OFFSET),
  };
}
