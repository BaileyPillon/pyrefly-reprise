/**
 * **Seymour + two Guado Guardians + Anima**, Macalania Temple antechamber: the ids, the numbers, the battle flags
 * and the opening. **Game case: FFX only** [AGENTS.md rule 14]: an FFX encounter registered in the FFX AI registry;
 * the FFX-2 ATB engine has no equivalent and gets none.
 *
 * Source (re-parity): the game's own scripts for this formation, `research/re-ffx-ai-seymour.md` section 3
 * (m124 Seymour, m141 the Guardian, m125 Anima, `mcyt06_00` the formation), read from the live Steam copy and run
 * through an interpreter. This replaces the authored version that was built from the wiki
 * (`research/ffx-seymour-anima-macalania.md`), whose four owner-approved assumptions (C-2, C-4, C-11, C-14) the
 * scripts now answer: Seymour **is** untargetable while Anima is out (the script switches it off), the Guardians'
 * Auto-Potion **does** answer any damage that takes HP, the element order **does** carry into act three, and Anima's
 * gauge **is** +5 on a Pain turn and +5 per action that reaches her (not +10 a turn). The decisions that adopted the
 * estimates (D-019/c2, c11, c14, g1) were placeholders for a missing source; the list is in
 * `docs/handoff/re-parity-ai-seymour.md`.
 *
 * ## The shape
 *
 * ```
 * act 1  Seymour 6,000 + two Guardians. The Guardians open with a real Protect each, Seymour with a real Shell
 *        (the start hook puts every monster first in the queue). He cycles ice -> thunder -> water -> fire, -ra
 *        tier, one random party member a turn; -ga tier instead whenever an aeon is on the field. A physical
 *        command naming him puts the Guard on a Guardian, which then takes the blow.
 *   |    HP at or below 3,000, or a lethal hit: he summons Anima, his HP and max HP go to 6,000, the Guardians die.
 * act 2  Anima 18,000 arrives (counter 0, each active party member's +1). Seymour is untargetable and takes no
 *        turns. She runs Boost, Pain, Boost, Pain; at 100 her gauge is spent on Oblivion instead.
 *   |    Anima at 0 HP: Seymour is re-initialised (full HP, no statuses), Magic 32, back in the queue.
 * act 3  Seymour casts the Multi- version of the spell his cycle is on, as two commands at two party slots.
 * ```
 */

import type { Ctx } from '../state.ts';
import { rtOf, tryActor } from '../state.ts';
import { normalise } from '../turnQueue.ts';

// ---------------------------------------------------------------------------
// Ids: duplicated from the data file on purpose, `src/battle/**` must not import `src/data/**`.
// ---------------------------------------------------------------------------

export const SEYMOUR_ID = 'seymour-macalania';
export const ANIMA_ID = 'anima-macalania';
export const GUARDIAN_IDS = ['guado-guardian-a', 'guado-guardian-b'] as const;

export const SEYMOUR_MACALANIA_SCRIPT = 'seymour-macalania';
export const GUADO_GUARDIAN_SCRIPT = 'guado-guardian-macalania';
export const ANIMA_MACALANIA_SCRIPT = 'anima-macalania';

// ---------------------------------------------------------------------------
// The numbers, each from the scripts (research/re-ffx-ai-seymour.md section 3)
// ---------------------------------------------------------------------------

/** His summon line, inclusive: HP <= 3,000 (`floor(6000 / 6) * 3`). */
export const SUMMON_HP_THRESHOLD = 3000;
/** What the script writes to his max HP and HP at the summon and at a lethal hit before it. */
export const SEYMOUR_SUMMON_HP = 6000;
/** His Magic from the summon on (the script writes it once, then again after the re-initialisation). */
export const ACT_THREE_MAGIC = 32;
/** The Guardians' Hi-Potion line: `floor(Seymour's HP at battle start * 4 / 5)`, read once. */
export const GUARDIAN_HI_POTION_THRESHOLD = 4800;
/** Anima's gauge: +5 on each Pain, +5 per action that reaches her, Oblivion at 100. */
export const ANIMA_GAUGE_STEP = 5;
export const ANIMA_GAUGE_FULL = 100;

/** The fixed cycle: the script's spell-set index 0 to 3. */
export const ELEMENT_CYCLE = ['ice', 'lightning', 'water', 'fire'] as const;
export type CycleElement = (typeof ELEMENT_CYCLE)[number];

export const RA_SPELL: Record<CycleElement, string> = {
  ice: 'mac-blizzara',
  lightning: 'mac-thundara',
  water: 'mac-watera',
  fire: 'mac-fira',
};
export const GA_SPELL: Record<CycleElement, string> = {
  ice: 'mac-blizzaga',
  lightning: 'mac-thundaga',
  water: 'mac-waterga',
  fire: 'mac-firaga',
};
export const MULTI_SPELL: Record<CycleElement, string> = {
  ice: 'mac-multi-blizzara',
  lightning: 'mac-multi-thundara',
  water: 'mac-multi-watera',
  fire: 'mac-multi-fira',
};

// ---------------------------------------------------------------------------
// Battle flags, on `state.flags` so a story trigger, the HUD, the tactic and the advisor's forecast can read them
// (the forecast rebuilds a runtime from the state alone, so nothing a script remembers may live anywhere else).
// ---------------------------------------------------------------------------

/** 1 until the summon, 2 while Anima is out, 3 after: the script's mode 0 / 128 / 255. */
export const MAC_ACT = 'macalania.act';
/** Seymour's spell-set index, 0 to 3; the next spell is `ELEMENT_CYCLE[index]`. */
export const MAC_ELEMENT_STEP = 'macalania.elementStep';
export const MAC_ANIMA_SUMMONED = 'macalania.animaSummoned';
/** Anima's turn index 0 to 3: Boost, Pain, Boost, Pain, whatever she spends a turn on. */
export const MAC_ANIMA_CYCLE = 'macalania.animaCycle';
/** Seymour has cast his opening Shell. */
export const MAC_SHELLED = 'macalania.shelled';
/** `macalania.protected.<id>`: a Guardian has cast its opening Protect. */
export const MAC_PROTECTED = 'macalania.protected.';
/** `macalania.asleepWhenTargeted.<id>`: the Guardian was asleep when the command named it (the script's mark 255). */
export const MAC_ASLEEP_MARK = 'macalania.asleepWhenTargeted.';
/** `macalania.hasPotions.<guardianId>`: mirrored every action so the tactic can read it. */
export const MAC_HAS_POTIONS = 'macalania.hasPotions.';
/** Anima's arrival flag: 128 on arrival, 240 after her first turn, 255 after that turn ends. */
export const MAC_ANIMA_ARRIVAL = 'macalania.animaArrival';

export function flagNum(ctx: Pick<Ctx, 'state'>, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** Which act is running. 1 until the summon, 2 while Anima is out, 3 after. */
export function macalaniaAct(ctx: Pick<Ctx, 'state'>): 1 | 2 | 3 {
  const v = flagNum(ctx, MAC_ACT, 1);
  return v === 3 ? 3 : v === 2 ? 2 : 1;
}

/** True when this battle is the Macalania encounter at all. */
export function isMacalania(ctx: Ctx): boolean {
  return tryActor(ctx, SEYMOUR_ID)?.enemy?.aiScriptId === SEYMOUR_MACALANIA_SCRIPT;
}

// ---------------------------------------------------------------------------
// Setup: called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

/**
 * The encounter's flags, Anima's gauge and **the formation's start hook** (`mcyt06_00` @0x27a9): every monster's
 * counter goes to 0 and Seymour's to 1, and each party member (the three active and the four reserves) gets +2 on
 * its own counter. So both Guardians act first, then Seymour, then the party: the Guardians' Protect and his Shell
 * are real turns, not a free opening [D-09]. The statuses are *not* applied here any more.
 */
export function applyMacalaniaSetup(ctx: Ctx): void {
  if (!isMacalania(ctx)) return;
  const seymour = tryActor(ctx, SEYMOUR_ID);
  if (!seymour) return;

  ctx.state.flags[MAC_ACT] = 1;
  ctx.state.flags[MAC_ELEMENT_STEP] = 0;
  ctx.state.flags[MAC_ANIMA_SUMMONED] = false;
  ctx.state.flags[MAC_ANIMA_CYCLE] = 0;
  ctx.state.flags[MAC_SHELLED] = false;
  for (const id of GUARDIAN_IDS) {
    if (tryActor(ctx, id)) {
      ctx.state.flags[`${MAC_HAS_POTIONS}${id}`] = true;
      ctx.state.flags[`${MAC_PROTECTED}${id}`] = false;
    }
  }

  const anima = tryActor(ctx, ANIMA_ID);
  if (anima) {
    // Her own gauge, on the shipped 0-100 scale; only her script writes it (the game's mode is "aeons only").
    anima.overdrive = { gauge: 0, mode: 'stoic', unlockedOverdriveIds: ['anima-oblivion'] };
  }

  for (const id of ctx.state.enemyIds) rtOf(ctx, id).ctb = 0;
  rtOf(ctx, SEYMOUR_ID).ctb = 1;
  for (const id of [...ctx.state.activeIds, ...ctx.state.reserveIds]) rtOf(ctx, id).ctb += 2;
  normalise(ctx);
}

// ---------------------------------------------------------------------------
// The element cycle
// ---------------------------------------------------------------------------

/** The next element of the fixed cycle, **consuming** one step (the script advances the index before it casts). */
export function nextElement(ctx: Ctx): CycleElement {
  const step = flagNum(ctx, MAC_ELEMENT_STEP, 0) % ELEMENT_CYCLE.length;
  ctx.state.flags[MAC_ELEMENT_STEP] = (step + 1) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[step] as CycleElement;
}

/**
 * The element Seymour will use on his **next** turn, without consuming it: the order is fixed, it never varies, and
 * it is published in his own Scan text, so the player can always pre-cast the matching Nul. The tactic and the
 * guide read it from here.
 */
export function macalaniaNextElement(ctx: Pick<Ctx, 'state'>): CycleElement {
  const step = flagNum(ctx, MAC_ELEMENT_STEP, 0) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[step] as CycleElement;
}

// ---------------------------------------------------------------------------
// The Trigger Command: this chapter's own Talk table, in `./macalania-talk.ts`
// (split out for the 400-line house rule, AGENTS.md rule 7).
// ---------------------------------------------------------------------------

export { consumeMacalaniaTalk, macalaniaTalkAvailable } from './macalania-talk.ts';
