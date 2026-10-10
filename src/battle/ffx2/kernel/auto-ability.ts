/**
 * FFX-2 auto-ability words: which bit is which ability, and the battle rules that read them (MP cost, the Gunner's rapid-shot
 * window, the HP / MP limits).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69) and `battle/kernel/a_ability.bin`.
 * Spec: `research/re-ffx2-dressphere.md` section 4.  Pure, deterministic, no DOM, no engine types.  Not wired into the engine.
 *
 * A character holds three 16-bit words (`Chr+0x650`, `+0x652`, `+0x654`, copied from the save record's `+0x50`, `+0x52`,
 * `+0x54`); every auto-ability row sets some of their bits (u16 at row `+0xa4`, `+0xa6`, `+0xa8`) and the battle code tests
 * bits.  The English names below are the abilities' own names in the Steam build's text; the engine's script names for the
 * bits (`ABILITY_LEAD` and `ABILITY_FIRST` for bits 0 and 1 of the first word) are the other way round from the English:
 * bit 0 is **First Strike** (acts at the start of the battle), bit 1 is **Initiative** (raises the preemptive-strike chance).
 *
 * Exe addresses (live build): 0x0061acd0 MP cost; 0x00647590 the rapid-shot window opener; 0x00754ef0 the window's countdown,
 * called once per logic step from the HUD update (0x0075e110, inside the logic step 0x0061e440); rom `rapid_shot[3]` at VA 0x00df7e8c.
 */

/** Word 0 (`Chr+0x650`) masks. */
export const W0 = {
  FIRST_STRIKE: 0x0001,
  INITIATIVE: 0x0002,
  COUNTERATTACK: 0x0004,
  EVADE_AND_COUNTER: 0x0008,
  MAGIC_COUNTER: 0x0010,
  MAGIC_BOOSTER: 0x0020,
  MORE_ENCOUNTERS: 0x0040,
  CHEMIST: 0x0100,
  ELEMENTALIST: 0x0200,
  PHYSICIST: 0x0400,
  DOUBLE_AP: 0x1000,
  TRIPLE_AP: 0x2000,
  BREAK_HP_LIMIT: 0x4000,
  BREAK_MP_LIMIT: 0x8000,
} as const;

/** Word 1 (`Chr+0x652`) masks. */
export const W1 = {
  BREAK_DAMAGE_LIMIT: 0x0001,
  BUTTERFINGERS: 0x0002,
  GILLIONAIRE: 0x0010,
  DOUBLE_ITEMS: 0x0020,
  DOUBLE_EXP: 0x0040,
  ITEM_HUNTER: 0x0200,
  PIERCING_MAGIC: 0x0400,
  HP_STROLL: 0x0800,
  MP_STROLL: 0x1000,
  NO_ENCOUNTERS: 0x2000,
  TRIGGER_HAPPY_1: 0x4000,
  TRIGGER_HAPPY_2: 0x8000,
} as const;

/** Word 2 (`Chr+0x654`) masks. */
export const W2 = {
  SCAN_1: 0x0001,
  SCAN_2: 0x0002,
  HALF_MP_COST: 0x0004,
  ONE_MP_COST: 0x0008,
} as const;

// ---------------------------------------------------------------------------------------------------
// MP cost
// ---------------------------------------------------------------------------------------------------

/** What `commandMpCost` reads of a command row and of the caster. */
export interface Ffx2MpCostInput {
  /** Row byte `+0x26`. */
  readonly costMp: number;
  /** Row dword `+0x14` (bit 28 marks a command paid in HP, which no MP rule touches). */
  readonly flagsMisc: number;
  /** Row byte `+0x0e`: the menu category (1 and 2 are the spell menus the Magic Booster doubles). */
  readonly menuCategory: number;
  /** `Chr+0x434` (in battle) or the record's `+0x4c` (out of battle): bit 13 is Spellspring, the "free MP" status. */
  readonly status1: number;
  /** Word 0 and word 2. */
  readonly word0: number;
  readonly word2: number;
}

/**
 * `MsGetCommandMp` (exe 0x0061acd0): the MP a command costs this caster.  Spellspring zeroes the base.  For a command paid in
 * MP: Half MP Cost makes it `(1 + cost) / 2` (rounded up); One MP Cost makes a non-zero cost 1 and cancels the halving;
 * Magic Booster doubles it for the spell menus (category 1 or 2) and cancels the "+1" of the halving, so Half with Booster
 * costs the plain cost and One with Booster costs 2.  The last step is an unsigned division.
 */
export function commandMpCost(i: Ffx2MpCostInput): number {
  let cost = (i.status1 & 0x2000) === 0 ? i.costMp & 0xff : 0;
  let mult = 1;
  let add = 0;
  let div = 1;
  if ((i.flagsMisc & 0x10000000) === 0) {
    if ((i.word2 & W2.HALF_MP_COST) !== 0) {
      add = 1;
      div = 2;
    }
    if ((i.word2 & W2.ONE_MP_COST) !== 0 && cost !== 0) {
      cost = 1;
      div = 1;
      add = 0;
    }
    if ((i.word0 & W0.MAGIC_BOOSTER) !== 0 && (i.menuCategory === 1 || i.menuCategory === 2)) {
      mult = 2;
      add = 0;
    }
  }
  return Math.floor((add + mult * cost) / div);
}

// ---------------------------------------------------------------------------------------------------
// The Gunner's rapid-shot window
// ---------------------------------------------------------------------------------------------------

/** `rom.bin` `rapid_shot[3]`, VA 0x00df7e8c: the window handed to the HUD, in the HUD's own units (hundredths of a second, shown as S:CC). */
export const FFX2_RAPID_SHOT: readonly [number, number, number] = [180, 220, 260];

/** The window's level (exe 0x00647590): 2 with Trigger Happy 2 (bit 15 of word 1), else 1 with Trigger Happy 1 (bit 14), else 0. */
export function rapidShotLevel(word1: number): 0 | 1 | 2 {
  if ((word1 & W1.TRIGGER_HAPPY_2) !== 0) return 2;
  return (word1 & W1.TRIGGER_HAPPY_1) !== 0 ? 1 : 0;
}

/** The window for a caster, in the HUD's units. */
export function rapidShotWindow(word1: number): number {
  return FFX2_RAPID_SHOT[rapidShotLevel(word1)] as number;
}

/**
 * The HUD's countdown (exe 0x00754ef0, run once per logic step from the HUD update at 0x0075e110): each step adds 30 to a hundredths
 * accumulator and 1 to the elapsed count, repeating up to four times until the accumulator passes 99 (then it keeps the
 * remainder), so a step advances `elapsed` by 3 or 4 -- 100/30 on average, one second of the display per 30 steps.  The shown
 * remainder is `total - elapsed` plus a display jitter of 0 to 3 from a private generator, and the window ends when it reads 0:
 * the first step that leaves `elapsed` above the total always ends it (the function then clamps `elapsed` to the total and the
 * remainder to 0), and a step that lands exactly ON the total ends it only when the jitter draws 0.  `first` is the first step with
 * `elapsed >= total` (the earliest possible end), `last` the first with `elapsed > total` (the latest); they differ only when the
 * walk lands on the total.
 */
export function rapidShotRun(total: number, start = 0): { first: number; last: number; sub: number; elapsed: number } {
  let sub = start;
  let elapsed = 0;
  let first = 0;
  for (let steps = 1; ; steps++) {
    for (let k = 0; k < 4; k++) {
      sub += 30;
      elapsed += 1;
      if (sub > 99) {
        sub %= 100;
        break;
      }
    }
    if (first === 0 && elapsed >= total) first = steps;
    if (total < elapsed) return { first, last: steps, sub, elapsed: total };
  }
}

/** The latest end, in logic steps, from an accumulator of `start` (0 for a fresh game): 55, 67 and 79 steps for the three windows. */
export function rapidShotSteps(total: number, start = 0): number {
  return rapidShotRun(total, start).last;
}
