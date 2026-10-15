/**
 * **The two brothers' stats, derived from Kimahri's** (FFX only; the hidden Biran and Yenke chapter). One pure function, `ronsoStatsFromKimahri`, and the two tables it reads.
 *
 * **Source: the game's own files**, `research/re-ffx-biran-yenke.md` section 3 ("RE section 3", `[bytes]`; the arithmetic is integer and truncating, `[inferred]` as in the earlier AI lanes). Both monster records are
 * placeholders for six stats (HP 9,999, STR 25, MAG 30, MDF 10, AGI 32): the formation's opening scene **overwrites maximum HP and HP, STR, MAG, AGI and MDF from Kimahri's own STR, MAG, AGI and current HP**:
 *
 * 1. `A = STR^3`, `B = MAG^3`, `C = ((A + B) / 2) * 16 / 15`, `U = ((C / 32) + 30) * 586 / 730` (Kimahri's STR and MAG);
 * 2. **Biran's HP = 8 U, Yenke's HP = 6 U**;
 * 3. `k = (HP - 644) / 200` when Kimahri's current HP is above 644, else 0 (11 or more reads the last column); a table by `k` gives **Biran's STR** and **Yenke's MAG**;
 * 4. **Biran's MAG = Yenke's MAG / 2**, **Yenke's STR = Biran's STR / 2**, **Biran's AGI = Kimahri's AGI - 4**, **Yenke's AGI = Kimahri's AGI - 8**, both **MDF = 50**.
 *
 * The note's worked examples (pinned in `tests/unit/chapters/biran-yenke-stats.test.ts`): Kimahri STR / MAG 30 / 20 gives U 492 (Biran 3,936 HP, Yenke 2,952); 40 / 20 gives U 987 (7,896 / 5,922); 50 / 25 gives
 * U 1,904 (15,232 / 11,424); 60 / 30 gives U 3,275 (26,200 / 19,650).
 *
 * **Not proved** (RE section 9 item 5, listed in the handoff): whether the game clamps these writes (maximum HP caps, the stat byte range) and which exact numbers the script reads from Kimahri (his current battle STR,
 * MAG and AGI "including gear and boosts", and his current HP at that moment). Here the function takes whatever it is given, and the only clamp is the engine's own: a stat reads at least 1 (the battle clamps
 * every stat to 1..255 when it starts, as the Sinspawn Gui chapter's rows note).
 *
 * Pure: no `Ctx`, no state, no draw. The engine calls it once, at the battle's start (`biran-yenke-setup.ts`).
 */

/** The four numbers of Kimahri the opening scene reads. */
export interface KimahriNumbers {
  /** His current battle Strength. */
  readonly str: number;
  /** His current battle Magic. */
  readonly mag: number;
  /** His current battle Agility. */
  readonly agi: number;
  /** His current HP when the battle starts. */
  readonly hp: number;
}

/** What the opening scene writes onto one brother. */
export interface BrotherNumbers {
  /** Maximum HP and HP. */
  readonly hp: number;
  readonly str: number;
  readonly mag: number;
  readonly agi: number;
  readonly mdef: number;
}

export interface BrothersFromKimahri {
  /** The HP unit `U` (Biran is 8 of them, Yenke 6). */
  readonly u: number;
  /** The index into the two tables (0 to 11). */
  readonly k: number;
  readonly biran: BrotherNumbers;
  readonly yenke: BrotherNumbers;
}

/** RE section 3, step 3: Biran's Strength by `k`. */
export const BIRAN_STR_BY_K: readonly number[] = [11, 12, 13, 15, 17, 19, 21, 22, 23, 24, 25, 27];
/** RE section 3, step 3: Yenke's Magic by `k`. */
export const YENKE_MAG_BY_K: readonly number[] = [8, 8, 9, 10, 12, 14, 16, 17, 19, 20, 21, 22];

/** Both brothers' Magic Defense after the opening scene (RE section 3, step 4). */
export const BROTHER_MDEF = 50;

const trunc = Math.trunc;
const atLeast1 = (n: number): number => Math.max(1, trunc(n));

/** `U`: `A = STR^3`, `B = MAG^3`, `C = ((A + B) / 2) * 16 / 15`, `U = ((C / 32) + 30) * 586 / 730`, every division truncating. */
export function hpUnit(str: number, mag: number): number {
  const a = str ** 3;
  const b = mag ** 3;
  const c = trunc(trunc(trunc((a + b) / 2) * 16) / 15);
  return trunc(trunc((trunc(c / 32) + 30) * 586) / 730);
}

/** `k = (HP - 644) / 200` while Kimahri's HP is above 644 (else 0), capped at the tables' last column. */
export function tableIndex(kimahriHp: number): number {
  const k = kimahriHp > 644 ? trunc((kimahriHp - 644) / 200) : 0;
  return Math.min(k, BIRAN_STR_BY_K.length - 1);
}

/** What the battle's opening scene writes onto Biran and Yenke, from Kimahri's STR, MAG, AGI and current HP. */
export function ronsoStatsFromKimahri(kimahri: KimahriNumbers): BrothersFromKimahri {
  const u = hpUnit(kimahri.str, kimahri.mag);
  const k = tableIndex(kimahri.hp);
  const biranStr = BIRAN_STR_BY_K[k] ?? 11;
  const yenkeMag = YENKE_MAG_BY_K[k] ?? 8;
  return {
    u,
    k,
    biran: { hp: atLeast1(8 * u), str: atLeast1(biranStr), mag: atLeast1(yenkeMag / 2), agi: atLeast1(kimahri.agi - 4), mdef: BROTHER_MDEF },
    yenke: { hp: atLeast1(6 * u), str: atLeast1(biranStr / 2), mag: atLeast1(yenkeMag), agi: atLeast1(kimahri.agi - 8), mdef: BROTHER_MDEF },
  };
}

/** The "x5/4" a survivor gets when its brother dies: `floor(x / 4) * 5` (RE section 5.4: it lowers STR 11 to 10, leaves 15 unchanged, raises 17 to 20 and 27 to 30). */
export function fiveQuarters(x: number): number {
  return trunc(x / 4) * 5;
}
