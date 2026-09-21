/**
 * **Seymour + two Guado Guardians + Anima**, Macalania Temple antechamber —
 * the three acts, the two Guardians' branch table and Anima's three clocks.
 *
 * Source: `research/ffx-seymour-anima-macalania.md` §5 (fight structure), §2.3
 * (the Guardians' three jobs), §3.4 (Boost), §4 (the action rows).
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. This is an FFX encounter script
 * registered in the FFX AI registry; the FFX-2 ATB engine has no equivalent and
 * gets none. The *capabilities* this script leans on — enemy Cover, the
 * pre-summon clamp, the mid-battle arrival, the gauge-on-being-targeted hook —
 * are general additive plumbing in `src/battle/ffx/**` and are documented as
 * "both" in `docs/handoff/chapter-macalania-engine.md`, because shared plumbing
 * is "both" per `critic/CHECKS.md` CHK-020. None of them changes an FFX-2
 * outcome: nothing in `src/battle/ffx2/**` imports any of it.
 *
 * ---
 *
 * ## The shape
 *
 * ```
 * act 1  Seymour 6,000 + two Guardians. He cycles ice -> lightning -> water ->
 *        fire, -ra tier, one random party member a turn, and NEVER varies.
 *        -ga tier instead whenever a player aeon is on the field, even when
 *        the aeon absorbs it. Guardians Cover him against physicals, heal him,
 *        and harass.
 *   |    at HP 3,000: he summons Anima and EVERY LIVING GUARDIAN DIES.
 * act 2  Anima 18,000 arrives in slot 3. Seymour stays on the field and idles.
 *        She alternates Boost and Pain while a third clock — her own gauge —
 *        fills Boost-independently toward Oblivion.
 *   |    at Anima 0 HP: "Seymour dismisses Anima!" and she is removed.
 * act 3  Seymour back to 6,000 with Magic 25 -> 32, casting the Multi- version
 *        of his -ra spell TWICE in one turn.
 * ```
 *
 * **He cannot be killed before he summons.** Ship the HD behaviour: clamp
 * every hit on him to 5,999 and floor his HP at 1 until the summon has run
 * [§5.2, verified: 2 sources]. The PS2 softlock is a bug.
 *
 * **There is no alternation guard.** The "two turns in a row -> no-op" rule is
 * specific to the Flux fight; §5.1 says explicitly not to copy it here.
 *
 * ## Owner-approved assumptions (Bailey, 2026-09-21, "Yes to all
 * recommendations"). Each is **AUTHORED**, not canon, and each is one line from
 * being flipped. See {@link MACALANIA_ASSUMPTIONS}.
 *
 * ---
 *
 * **This file is the encounter's rules and its two act transitions.** The three
 * rotations that read them are in `./seymour-anima-macalania.ts`, which is
 * where the AI registry entries live; the split is the 400-line house limit
 * [AGENTS.md hard rule 7], not a seam in the design.
 */

import type { CombatantId, FFXCombatant, StatusId, StatusInstance } from '../../common/types.ts';
import { type Ctx, isAlive, rtOf, tryActor } from '../state.ts';
import { healOutsideChain, koActor } from '../hp.ts';
import { revealEnemy } from '../forms.ts';

// ---------------------------------------------------------------------------
// Ids — duplicated from the data file on purpose: `src/battle/**` must not
// import `src/data/**` (the engine is handed its content through the registry).
// ---------------------------------------------------------------------------

export const SEYMOUR_ID = 'seymour-macalania';
export const ANIMA_ID = 'anima-macalania';
export const GUARDIAN_IDS = ['guado-guardian-a', 'guado-guardian-b'] as const;

export const SEYMOUR_MACALANIA_SCRIPT = 'seymour-macalania';
export const GUADO_GUARDIAN_SCRIPT = 'guado-guardian-macalania';
export const ANIMA_MACALANIA_SCRIPT = 'anima-macalania';

// ---------------------------------------------------------------------------
// Sourced constants
// ---------------------------------------------------------------------------

/** §5.2 [verified: 2 sources] — the summon fires at exactly half his bar. */
export const SUMMON_HP_THRESHOLD = 3000;
/** §5.2 [verified: 2 sources] — the HD build's pre-summon clamp and floor. */
export const PRE_SUMMON_DAMAGE_CAP = 5999;
export const PRE_SUMMON_HP_FLOOR = 1;
/** §5.4 [verified: 2 sources] — Magic 25 -> 32 when Anima is dismissed. */
export const ACT_THREE_MAGIC = 32;
/** §2.3 [verified: 2 sources] — the Hi-Potion-on-Seymour branch's threshold, 80 % of 6,000. */
export const GUARDIAN_HI_POTION_THRESHOLD = 4800;
/** §5.2 [verified: 2 sources] — fixed, and it never varies. */
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
// AUTHORED assumptions — owner-approved 2026-09-21, none of them canon
// ---------------------------------------------------------------------------

/**
 * **AUTHORED (C-2).** Seymour is *present but untargetable* while Anima is on
 * the field. No source says whether the player can select him; the research
 * calls this "the single most behaviourally load-bearing open question in the
 * file". Two reasons for the reading: the HD build explicitly prevents killing
 * him before the summon, and a targetable Seymour in act two lets the player
 * finish him and skip the aeon duel, contradicting every guide's three-act
 * description. Flipping it is one line.
 *
 * It has a second half the research does not spell out but that follows from
 * the same reading: **nothing** may kill him while she is on the field, not
 * only nothing the player can aim at. His HP floor of 1 is therefore held from
 * setup until the dismissal, rather than being released at the summon — see
 * `summonAnima` for what happens without it.
 */
export const SEYMOUR_UNTARGETABLE_IN_ACT_TWO = true;

/**
 * **AUTHORED (C-11).** Auto-Potion fires on **any** damage, not physical only.
 * The FF Wiki contradicts itself on a single page. This is the majority reading
 * and the harsher one; it changes the magic route's feel, not its viability.
 */
export const AUTO_POTION_ON_ANY_DAMAGE = true;

/**
 * **AUTHORED (C-14).** The ice -> lightning -> water -> fire order persists
 * into act three. `[single source: GamerGuides]`; the wiki only says he casts
 * his -ra spells twice per turn. It is the only sourced claim, all four Multi-
 * rows exist in the data, and the chapter's whole Nul-spell finale rests on it.
 */
export const ACT_THREE_KEEPS_ELEMENT_ORDER = true;

/**
 * **AUTHORED (C-4 / G-1).** Anima's Overdrive gauge increment. Every source
 * says only "a fixed amount every time she gets a turn or is attacked". The
 * research's own labelled `[estimate]` is +10 % per turn taken and +5 % per
 * targeting, which produces an Oblivion roughly every 4–5 exchanges —
 * consistent with every guide treating Oblivion as a thing you race, not a
 * thing you eat repeatedly. **Surface it as an estimate in-product.**
 */
export const ANIMA_GAUGE_PER_TURN = 10;
export const ANIMA_GAUGE_PER_TARGETING = 5;

/** The four assumptions, as data, so the guide and the board can print them. */
export const MACALANIA_ASSUMPTIONS = [
  { id: 'C-2', claim: 'Seymour is present but untargetable while Anima is out', value: SEYMOUR_UNTARGETABLE_IN_ACT_TWO },
  { id: 'C-11', claim: "The Guardians' Auto-Potion fires on any damage", value: AUTO_POTION_ON_ANY_DAMAGE },
  { id: 'C-14', claim: 'The element order persists into act three', value: ACT_THREE_KEEPS_ELEMENT_ORDER },
  { id: 'C-4', claim: "Anima's gauge: +10% per turn taken, +5% per targeting", value: ANIMA_GAUGE_PER_TURN },
] as const;

// ---------------------------------------------------------------------------
// Battle-scoped flags, on `state.flags` so a story trigger, the HUD and the
// tactic can all read them without reaching into engine internals.
// ---------------------------------------------------------------------------

export const MAC_ACT = 'macalania.act';
export const MAC_ELEMENT_STEP = 'macalania.elementStep';
export const MAC_ANIMA_SUMMONED = 'macalania.animaSummoned';
export const MAC_BOOST_NEXT = 'macalania.animaBoostNext';
/** `macalania.hasPotions.<guardianId>` — mirrored every action so the tactic can read it. */
export const MAC_HAS_POTIONS = 'macalania.hasPotions.';

function num(ctx: Ctx, key: string, fallback: number): number {
  const v = ctx.state.flags[key];
  return typeof v === 'number' ? v : fallback;
}

/** Which act is running. 1 until the summon, 2 while Anima is out, 3 after. */
export function macalaniaAct(ctx: Ctx): 1 | 2 | 3 {
  const v = num(ctx, MAC_ACT, 1);
  return v === 3 ? 3 : v === 2 ? 2 : 1;
}

/** True when this battle is the Macalania encounter at all. */
function isMacalania(ctx: Ctx): boolean {
  return tryActor(ctx, SEYMOUR_ID)?.enemy?.aiScriptId === SEYMOUR_MACALANIA_SCRIPT;
}

function buff(status: StatusId): StatusInstance {
  return { id: status, turnsRemaining: 254, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

// ---------------------------------------------------------------------------
// Setup — called once from `setup.ts#buildBattle`; a no-op in every other battle
// ---------------------------------------------------------------------------

/**
 * The scripted opening and the encounter's engine-internal wiring.
 *
 * §5.2 `[verified: 2 sources]`: **before the player's first turn** both
 * Guardians cast Protect on themselves and Seymour casts Shell on himself. The
 * board the player first sees is already buffed, and the research is explicit
 * that this is "a scripted pre-turn sequence, not three ordinary turns" — so
 * the statuses are applied here rather than costing three enemy turns the
 * player would watch resolve before acting.
 */
export function applyMacalaniaSetup(ctx: Ctx): void {
  if (!isMacalania(ctx)) return;
  const seymour = tryActor(ctx, SEYMOUR_ID);
  if (!seymour) return;

  ctx.state.flags[MAC_ACT] = 1;
  ctx.state.flags[MAC_ELEMENT_STEP] = 0;
  ctx.state.flags[MAC_ANIMA_SUMMONED] = false;
  ctx.state.flags[MAC_BOOST_NEXT] = false;

  // §5.2 — the scripted opening.
  seymour.statuses['shell'] = buff('shell');
  // §5.2 — and he cannot be killed before he summons.
  const seymourRt = rtOf(ctx, SEYMOUR_ID);
  seymourRt.damageCapPerHit = PRE_SUMMON_DAMAGE_CAP;
  seymourRt.hpFloor = PRE_SUMMON_HP_FLOOR;

  for (const id of GUARDIAN_IDS) {
    const g = tryActor(ctx, id);
    if (!g) continue;
    g.statuses['protect'] = buff('protect');
    // §2.3 [verified: 2 sources] — a living Guardian intercepts **physical**
    // attacks aimed at Seymour. Magic is never covered.
    rtOf(ctx, id).coversAllyId = SEYMOUR_ID;
    ctx.state.flags[`${MAC_HAS_POTIONS}${id}`] = true;
  }

  const anima = tryActor(ctx, ANIMA_ID);
  if (anima) {
    // §3.4 — her own gauge, on the shipped 0-100 scale. `enemyToCombatant`
    // does not build one (only Braska's Final Aeon has a scripted gauge, and
    // that one is set the same way), so it is attached here.
    anima.overdrive = { gauge: 0, mode: 'stoic', unlockedOverdriveIds: ['anima-oblivion'] };
    rtOf(ctx, ANIMA_ID).gaugePerTargeting = ANIMA_GAUGE_PER_TARGETING;
  }
}

// ---------------------------------------------------------------------------
// Act transitions — driven from the hit hook, not from a turn
// ---------------------------------------------------------------------------

/** §2.4 — `hasPotions` is `stealCount === 0`; mirrored so the tactic can read it. */
function mirrorPotionSupply(ctx: Ctx): void {
  for (const id of GUARDIAN_IDS) {
    ctx.state.flags[`${MAC_HAS_POTIONS}${id}`] = rtOf(ctx, id).stealCount === 0;
  }
}

/**
 * Act one -> two. He summons at 3,000 and **every living Guardian dies**
 * [§5.2, verified: 2 sources].
 */
function summonAnima(ctx: Ctx, seymour: FFXCombatant): void {
  ctx.state.flags[MAC_ANIMA_SUMMONED] = true;
  ctx.state.flags[MAC_ACT] = 2;
  ctx.emit({ type: 'message', text: 'Seymour summons Anima', kind: 'telegraph' });

  for (const id of GUARDIAN_IDS) {
    const g = tryActor(ctx, id);
    if (g && isAlive(g)) koActor(ctx, g, SEYMOUR_ID);
  }

  // §5.2's 5,999 clamp is explicitly "until Anima has been summoned", so it
  // goes here.
  //
  // **The HP floor does not.** It is held through act two, as the other half of
  // C-2 — see {@link SEYMOUR_UNTARGETABLE_IN_ACT_TWO}. Measured without it on
  // seeds 1-8: `untargetable` stops the player *aiming* at him, but a Poison
  // landed in act one keeps ticking 600 a turn on his own turns, so he died in
  // act two on every seed and the battle was won at turn 55 with Anima still
  // standing on ~14,000 HP. The aeon duel — the middle third of the chapter —
  // never happened. Nothing may kill him while she is out, not just nothing the
  // player can point at.
  const rt = rtOf(ctx, SEYMOUR_ID);
  delete rt.damageCapPerHit;
  if (SEYMOUR_UNTARGETABLE_IN_ACT_TWO) seymour.flags.untargetable = true;

  const anima = tryActor(ctx, ANIMA_ID);
  if (anima) revealEnemy(ctx, anima);
}

/**
 * Act two -> three. "Seymour dismisses Anima!", he returns to **6,000 HP** and
 * his Magic goes **25 -> 32** [§5.4, verified: 2 sources].
 *
 * His bar coming back is the chapter's thesis in one mechanic: an HP bar is not
 * a progress bar, and the thing you actually killed was his mother.
 */
function dismissAnima(ctx: Ctx, seymour: FFXCombatant): void {
  ctx.state.flags[MAC_ACT] = 3;
  ctx.emit({ type: 'message', text: 'Seymour dismisses Anima', kind: 'telegraph' });

  const anima = tryActor(ctx, ANIMA_ID);
  if (anima) {
    anima.removed = true;
    anima.flags.hidden = true;
  }

  seymour.flags.untargetable = false;
  delete rtOf(ctx, SEYMOUR_ID).hpFloor; // act three is the act he can be killed in
  seymour.stats.mag = ACT_THREE_MAGIC;
  const missing = seymour.stats.maxHp - seymour.hp;
  if (missing > 0) healOutsideChain(ctx, seymour, missing, 'seymour-restored', SEYMOUR_ID);
}

/**
 * Both act transitions, evaluated after every action.
 *
 * Called from `engine.ts#afterAction` beside `runMortibsorptionIfDown` and
 * again at the top of each of this encounter's own turns, because the summon
 * threshold can also be crossed by a Poison tick inside `onTurnEnd`, which runs
 * after the engine hook.
 *
 * A no-op in every other battle.
 */
export function runMacalaniaPhaseHooks(ctx: Ctx): void {
  const seymour = tryActor(ctx, SEYMOUR_ID);
  if (!seymour || ctx.state.flags[MAC_ACT] === undefined) return;
  mirrorPotionSupply(ctx);

  if (ctx.state.flags[MAC_ANIMA_SUMMONED] !== true) {
    if (seymour.hp <= SUMMON_HP_THRESHOLD) summonAnima(ctx, seymour);
    return;
  }
  if (macalaniaAct(ctx) !== 2) return;
  const anima = tryActor(ctx, ANIMA_ID);
  if (!anima || !isAlive(anima)) dismissAnima(ctx, seymour);
}

/** The next element of the fixed cycle, **consuming** one step. */
export function nextElement(ctx: Ctx): CycleElement {
  const step = num(ctx, MAC_ELEMENT_STEP, 0) % ELEMENT_CYCLE.length;
  ctx.state.flags[MAC_ELEMENT_STEP] = (step + 1) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[step] as CycleElement;
}

/**
 * The element Seymour will use on his **next** turn, without consuming it.
 *
 * This is the whole pre-commitment loop the chapter teaches: the order is
 * fixed, it never varies, and it is published in his own Scan text, so the
 * player can always pre-cast the matching Nul [§5.2, verified: 2 sources].
 * The tactic and the guide read it from here.
 */
export function macalaniaNextElement(ctx: Ctx): CycleElement {
  const step = num(ctx, MAC_ELEMENT_STEP, 0) % ELEMENT_CYCLE.length;
  return ELEMENT_CYCLE[step] as CycleElement;
}

// ---------------------------------------------------------------------------
// The Trigger Command
// ---------------------------------------------------------------------------

/**
 * **This chapter's own Talk table — Tidus, Yuna, Wakka** [§5.5, verified: 2
 * sources].
 *
 * ⚠ **Not the Flux fight's set.** The *Trigger Command* master table lists
 * Tidus / Yuna / Wakka for *this* Seymour, Tidus / Yuna / Auron for Natus and
 * Yuna / Kimahri for Flux. `research/…-macalania.md` §13 row 4 calls a shared
 * table a **major** defect, so this table is deliberately its own record and
 * `ai/index.ts` dispatches on the boss standing opposite.
 *
 * The bonus lands on `stats`, not as a status, for the same reason
 * `consumeSeymourTalk` does it that way: only real stat points move the cubic
 * POWER term.
 */
const MACALANIA_TALK_BONUS: Readonly<
  Record<string, { readonly stat: 'str' | 'mdef'; readonly amount: number; readonly label: string }>
> = {
  tidus: { stat: 'str', amount: 10, label: 'Strength' },
  yuna: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
  wakka: { stat: 'mdef', amount: 10, label: 'Magic Defense' },
};

const MAC_TALKED = 'macalania.talked.';

/** Who still has a Talk line left, for the menu and the intent panel. */
export function macalaniaTalkAvailable(ctx: Ctx, talkerId: CombatantId): boolean {
  if (!(talkerId in MACALANIA_TALK_BONUS)) return false;
  return ctx.state.flags[`${MAC_TALKED}${talkerId}`] !== true;
}

/** Spend `talker`'s one Talk line. Returns false when there is nothing to say. */
export function consumeMacalaniaTalk(ctx: Ctx, talker: FFXCombatant): boolean {
  const bonus = MACALANIA_TALK_BONUS[talker.id];
  if (!bonus) return false;
  const key = `${MAC_TALKED}${talker.id}`;
  if (ctx.state.flags[key] === true) return false;
  ctx.state.flags[key] = true;
  talker.stats[bonus.stat] += bonus.amount;
  ctx.emit({ type: 'message', text: `${talker.name}: +${bonus.amount} ${bonus.label}`, kind: 'story' });
  return true;
}
