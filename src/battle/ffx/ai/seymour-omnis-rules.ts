/**
 * **Chapter XII — Seymour Omnis and the four Mortiphasms: the fight's rules.**
 *
 * Source: `research/ffx-seymour-omnis.md` §4 (the discs, the affinity ladder,
 * the attack counter, Dispel → Ultima, the reset) and the §4.7 reference
 * pseudocode; `docs/plans/chapter-omnis-review.md` §4.2 (the engine gaps
 * O-G1 to O-G7) and its Review corrections; Bailey's answers to B8-B13, B22
 * and B23 (2026-09-25, "I'll go with all your recommendations").
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every key below lives under
 * `omnis.` on `BattleState.flags`, and every hook is a no-op unless the Omnis
 * formation set those keys at setup, so no other chapter changes.
 *
 * ## The discs are state, and they decide everything
 *
 * `omnis.discs` holds what each disc shows him, left to right. From it:
 *
 * - **his affinity** ({@link omnisAffinities}): per element, 1 disc = half,
 *   2 = immune, 3 = absorb, 4 = absorb **and** weak to the opposite
 *   [§4.2, verified: 5 sources]; Holy is never touched;
 * - **his spells** (`seymour-omnis.ts`, the volley planner): one per disc, of
 *   its element, **-ra** if the element shows on 1-2 discs, **-ga** on 3-4
 *   [§4.1, verified: 4 sources].
 *
 * A **landed** hit on a disc turns it 90°: a physical hit **left**, a spell
 * **right** [§4.3, verified: 6 sources]. A disc takes no damage (it is
 * `immune-to-damage`), and the engine still emits the hit's `damage` event
 * with `amount: 0` (`abilities.ts`, "a connecting hit that computes to zero
 * is still a hit"): that event is the "hit landed" signal (plan O-G1). Misses,
 * Nul charges and bounces emit no `damage`, so they turn nothing.
 *
 * ## The attack counter (O-G5)
 *
 * **6** attacks on Seymour (**3** once his HP is **below 20,000**) and he
 * **glows red**; his next turn is **Dispel** on the party (his Defense drops to
 * 100), the turn after is **Ultima** (Defense 150), and the discs then reset
 * to the next colour of the cycle [§4.4, verified: 4-5 sources; the Defense
 * values single source: wiki]. Counters and **his own reflected spells**
 * count [single source: wiki]. The count is read off the turn's events at
 * the turn's end (`ticks.ts#onTurnEnd`), so a Magic Counter or a spell
 * bounced off a Reflected member mid-volley counts like any other hit.
 */

import type {
  AbilityDef,
  Affinity,
  BattleState,
  CombatantId,
  ElementalAffinities,
  FFXCombatant,
} from '../../common/types.ts';
import type { ActorRuntime } from '../state.ts';
import { type Ctx, abilityOf, isAlive, tryActor } from '../state.ts';

/** Ids mirrored from `src/data/ffx/enemies/seymour-omnis.ts` (the tests pin them equal). */
export const OMNIS_ID = 'seymour-omnis';
export const OMNIS_SCRIPT = 'seymour-omnis';
export const MORTIPHASM_SCRIPT = 'mortiphasm';
export const MORTIPHASM_IDS: readonly CombatantId[] = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'];

export type Element4 = 'fire' | 'ice' | 'lightning' | 'water';
export type OmnisState = 'normal' | 'red' | 'dispelled' | 'reset-due';

// ---------------------------------------------------------------------------
// State keys (on `BattleState.flags`, so a story trigger or the HUD can read them)
// ---------------------------------------------------------------------------

/** What each disc shows him, left to right, comma-separated: `'fire,fire,fire,fire'`. */
export const OMNIS_DISCS = 'omnis.discs';
/** Index into {@link OMNIS_RESET_CYCLE} of the colour the discs last reset to. */
export const OMNIS_CYCLE = 'omnis.cycle';
/** Attacks on Seymour since the last Ultima. */
export const OMNIS_HITS = 'omnis.hits';
/** `normal` → `red` (glowing) → `dispelled` → `reset-due` → `normal`. */
export const OMNIS_STATE = 'omnis.state';
/** How far into `state.log` the turn-end scan has read. */
export const OMNIS_SCANNED = 'omnis.scannedTo';

// ---------------------------------------------------------------------------
// Constants, each with its source or its label
// ---------------------------------------------------------------------------

/** §4.4 [verified: 5 sources]. */
export const ATTACKS_TO_GLOW = 6;
/** §4.4 [verified: 4 sources]: below this HP the counter drops to {@link ATTACKS_TO_GLOW_LOW}. */
export const LOW_HP_BELOW = 20_000;
export const ATTACKS_TO_GLOW_LOW = 3;
/** §1.1 / §4.4 [single source: wiki]. */
export const DEF_AFTER_DISPEL = 100;
export const DEF_AFTER_ULTIMA = 150;

/**
 * **The reset cycle after Ultima: Fire → Water → Ice → Thunder** (O-11,
 * GameFAQs' explicit order; the wiki's list reads Fire, Ice, Water, Thunder).
 * **B8 = b: built as GameFAQs says, labelled, and the chapter stays unlisted
 * until Bailey confirms it** (B8 = a, then).
 */
export const OMNIS_RESET_CYCLE: readonly Element4[] = ['fire', 'water', 'ice', 'lightning'];

/**
 * **The colour order around one disc, clockwise: Fire, Water, Ice, Thunder.**
 * **Our estimate, twice over** (O-7 is unsourced; B8 = b draws GameFAQs' reset
 * cycle as the physical ring, the option sheets' reading). A spell turns a
 * disc clockwise, which brings the section **before** the facing one round to
 * face him (Fire → Thunder, as the O-4 sheet shows); a blow turns it
 * counter-clockwise (Fire → Water).
 */
export const DISC_RING: readonly Element4[] = ['fire', 'water', 'ice', 'lightning'];

/**
 * Opposite pairs for the four-of-a-kind weakness: **Fire ↔ Ice** (all-Fire
 * opens weak to Ice, verified: 3 sources) and **Thunder ↔ Water** (the
 * standard FFX pair; no Omnis source names it, O-5).
 */
export const OPPOSITE: Readonly<Record<Element4, Element4>> = { fire: 'ice', ice: 'fire', lightning: 'water', water: 'lightning' };

/**
 * **B9 = faithful: the two-Water bug.** With exactly two Water discs he
 * becomes immune to **Fire**, not Water [§4.2, single source: wiki, "persists
 * across all versions"]. One constant; the guide's notes disclose it.
 */
export const TWO_WATER_BUG = true;

/** **B23 = a**: the discs reset on his next turn after Ultima (wiki *Mortiphasm* + GamerGuides, 2 against 1). */
export const RESET_ON_NEXT_TURN = true;

/** **B11 = no** (our estimate): hits on a disc do not count toward the 6 / 3 (the sources say "attacks on Seymour"). */
export const DISC_HITS_COUNT = false;

/** His -ra and -ga rows per element [§3.1]. */
export const OMNIS_RA: Readonly<Record<Element4, string>> = {
  fire: 'omnis-fira',
  ice: 'omnis-blizzara',
  lightning: 'omnis-thundara',
  water: 'omnis-watera',
};
export const OMNIS_GA: Readonly<Record<Element4, string>> = {
  fire: 'omnis-firaga',
  ice: 'omnis-blizzaga',
  lightning: 'omnis-thundaga',
  water: 'omnis-waterga',
};
export const OMNIS_DISPEL_ID = 'omnis-dispel';
export const OMNIS_ULTIMA_ID = 'omnis-ultima';
export const OMNIS_VOLLEY_ID = 'omnis-volley';

// ---------------------------------------------------------------------------
// The discs and the affinity ladder
// ---------------------------------------------------------------------------

const ELEMENTS: readonly Element4[] = ['fire', 'ice', 'lightning', 'water'];
const LADDER: readonly Affinity[] = ['normal', 'resist', 'immune', 'absorb', 'absorb'];
const RANK: Readonly<Record<Affinity, number>> = { normal: 0, resist: 1, weak: 2, immune: 3, absorb: 4 };

function isElement4(v: string): v is Element4 {
  return (ELEMENTS as readonly string[]).includes(v);
}

/** True when the Omnis formation set its state at setup. */
export function omnisPresent(ctx: Pick<Ctx, 'state'>): boolean {
  return typeof ctx.state.flags[OMNIS_DISCS] === 'string';
}

/** What each disc shows him, left to right. */
export function omnisDiscs(state: Pick<BattleState, 'flags'>): Element4[] {
  const raw = state.flags[OMNIS_DISCS];
  if (typeof raw !== 'string') return [];
  return raw.split(',').filter(isElement4);
}

function writeDiscs(ctx: Ctx, discs: readonly Element4[]): void {
  ctx.state.flags[OMNIS_DISCS] = discs.join(',');
}

/** The disc a combatant id names, as an index 0-3, or -1. */
export function discIndex(id: CombatantId): number {
  return MORTIPHASM_IDS.indexOf(id);
}

/**
 * His four elemental affinities for a disc layout [§4.2]. Pure. Holy and every
 * other element are not in the result: the discs never touch them.
 */
export function omnisAffinities(discs: readonly Element4[], twoWaterBug = TWO_WATER_BUG): ElementalAffinities {
  const out: Record<Element4, Affinity> = { fire: 'normal', ice: 'normal', lightning: 'normal', water: 'normal' };
  const raise = (e: Element4, a: Affinity): void => {
    if (RANK[a] > RANK[out[e]]) out[e] = a;
  };
  for (const e of ELEMENTS) {
    const n = discs.filter((d) => d === e).length;
    if (n === 0) continue;
    // B9: exactly two Water discs make him immune to Fire, and leave Water alone.
    if (twoWaterBug && e === 'water' && n === 2) {
      raise('fire', 'immune');
      continue;
    }
    raise(e, LADDER[Math.min(n, 4)] as Affinity);
    if (n === 4) raise(OPPOSITE[e], 'weak');
  }
  return out;
}

/** Write the disc-driven affinities onto Omnis, keeping every other element. */
function applyAffinities(ctx: Ctx, omnis: FFXCombatant): ElementalAffinities {
  const next = { ...omnis.affinities, ...omnisAffinities(omnisDiscs(ctx.state)) };
  for (const e of ELEMENTS) if (next[e] === 'normal') delete next[e];
  omnis.affinities = next;
  return { ...next };
}

function facings(discs: readonly Element4[]): Record<CombatantId, Element4> {
  const out: Record<CombatantId, Element4> = {};
  MORTIPHASM_IDS.forEach((id, i) => {
    const e = discs[i];
    if (e) out[id] = e;
  });
  return out;
}

/** Turn disc `index` one quarter [§4.3; the ring is {@link DISC_RING}, our estimate]. */
export function turnDisc(ctx: Ctx, index: number, direction: 'left' | 'right'): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  const discs = omnisDiscs(ctx.state);
  const now = discs[index];
  if (!omnis || now === undefined) return;
  const at = DISC_RING.indexOf(now);
  const step = direction === 'right' ? -1 : 1;
  discs[index] = DISC_RING[(at + step + DISC_RING.length) % DISC_RING.length] as Element4;
  writeDiscs(ctx, discs);
  const affinities = applyAffinities(ctx, omnis);
  ctx.emit({
    type: 'affinity-change',
    targetId: OMNIS_ID,
    affinities,
    cause: 'part-turn',
    partId: MORTIPHASM_IDS[index] as CombatantId,
    direction,
    facings: facings(discs),
  });
}

/** Every disc to the next colour of the cycle [§4.4; the cycle is O-11, B8 = b]. */
export function resetDiscs(ctx: Ctx): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (!omnis) return;
  const prev = ctx.state.flags[OMNIS_CYCLE];
  const cycle = (typeof prev === 'number' ? prev : 0) + 1;
  ctx.state.flags[OMNIS_CYCLE] = cycle;
  const colour = OMNIS_RESET_CYCLE[cycle % OMNIS_RESET_CYCLE.length] as Element4;
  const discs = MORTIPHASM_IDS.map(() => colour);
  writeDiscs(ctx, discs);
  const affinities = applyAffinities(ctx, omnis);
  ctx.emit({ type: 'affinity-change', targetId: OMNIS_ID, affinities, cause: 'reset', facings: facings(discs) });
}

// ---------------------------------------------------------------------------
// The counter and the states
// ---------------------------------------------------------------------------

export function omnisState(ctx: Pick<Ctx, 'state'>): OmnisState {
  const v = ctx.state.flags[OMNIS_STATE];
  return v === 'red' || v === 'dispelled' || v === 'reset-due' ? v : 'normal';
}

export function setOmnisState(ctx: Ctx, next: OmnisState): void {
  ctx.state.flags[OMNIS_STATE] = next;
}

export function omnisHits(ctx: Pick<Ctx, 'state'>): number {
  const v = ctx.state.flags[OMNIS_HITS];
  return typeof v === 'number' ? v : 0;
}

/** 6, or 3 once his HP is below 20,000 [§4.4]. */
export function glowThreshold(ctx: Ctx): number {
  const omnis = tryActor(ctx, OMNIS_ID);
  return omnis && omnis.hp < LOW_HP_BELOW ? ATTACKS_TO_GLOW_LOW : ATTACKS_TO_GLOW;
}

/**
 * Which way a landed hit of `def` turns a disc, or `null` (B10 = a, our
 * estimate): a single-target physical action turns it **left**, a
 * single-target damaging spell **right**; all-target actions, items and
 * status-only rows turn nothing.
 */
export function discTurnFor(def: AbilityDef | undefined): 'left' | 'right' | null {
  if (!def || def.category === 'item') return null;
  if (def.targeting !== 'single-enemy' && def.targeting !== 'single-any') return null;
  if (def.damageType === 'physical') return 'left';
  if (def.damageType === 'magical' && def.formula !== 'none' && !def.flags.includes('heals')) return 'right';
  return null;
}

/**
 * **The turn-end hook** (`ticks.ts#onTurnEnd`): read the events this turn
 * added, count the attacks that landed on Seymour, turn the discs that were
 * hit, then light the glow when the count is due. A no-op in every battle but
 * Chapter XII.
 */
export function runOmnisTurnEnd(ctx: Ctx): void {
  if (!omnisPresent(ctx)) return;
  const log = ctx.state.log;
  const from = ctx.state.flags[OMNIS_SCANNED];
  let def: AbilityDef | undefined;
  let counted = false;
  let hits = omnisHits(ctx);
  const turns: Array<{ index: number; direction: 'left' | 'right' }> = [];
  for (let i = typeof from === 'number' ? from : 0; i < log.length; i++) {
    const e = log[i];
    if (!e) continue;
    if (e.type === 'action-start') {
      def = e.abilityId !== undefined ? abilityOf(ctx, e.abilityId) : undefined;
      counted = false;
      continue;
    }
    if (e.type !== 'damage' || e.sourceId === undefined) continue;
    if (e.targetId === OMNIS_ID) {
      if (!counted && !(def?.flags.includes('heals') ?? false)) {
        hits += 1;
        counted = true;
      }
      continue;
    }
    const index = discIndex(e.targetId);
    if (index < 0) continue;
    if (DISC_HITS_COUNT && !counted) {
      hits += 1;
      counted = true;
    }
    const direction = discTurnFor(def);
    if (direction) turns.push({ index, direction });
  }
  ctx.state.flags[OMNIS_HITS] = hits;
  for (const t of turns) turnDisc(ctx, t.index, t.direction);

  const omnis = tryActor(ctx, OMNIS_ID);
  if (omnis && isAlive(omnis) && omnisState(ctx) === 'normal' && hits >= glowThreshold(ctx)) {
    setOmnisState(ctx, 'red');
    // The game's only telegraph is the red glow [§4.4, §7]; placeholder copy
    // for the log until the glow itself is drawn (O-8).
    ctx.emit({ type: 'message', text: 'Seymour Omnis glows red', kind: 'telegraph' });
  }
  ctx.state.flags[OMNIS_SCANNED] = log.length;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * The opening state [§4.1 "all four discs show Fire", verified: 3 sources]:
 * four Fire discs, so he opens absorbing Fire and weak to Ice. Nothing is
 * emitted (setup events never reach the presenter; it reads the state).
 */
export function applyOmnisSetup(ctx: Ctx): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (!omnis || omnis.enemy?.aiScriptId !== OMNIS_SCRIPT) return;
  writeDiscs(ctx, MORTIPHASM_IDS.map(() => 'fire'));
  ctx.state.flags[OMNIS_CYCLE] = 0;
  ctx.state.flags[OMNIS_HITS] = 0;
  ctx.state.flags[OMNIS_STATE] = 'normal';
  ctx.state.flags[OMNIS_SCANNED] = ctx.state.log.length;
  applyAffinities(ctx, omnis);
  markOmnisRuntime(ctx.state, ctx.rt.actors);
  // §4.5 [verified: 2 sources]: Ifrit drinks his Fire, Ixion his Thunder and
  // Shiva his Ice. Nothing to set here: all three eaters are their default
  // armour in every FFX battle (`setup.ts` AEON_INNATE_AFFINITIES, rule 14).
}

/**
 * The runtime mark this encounter needs — the discs own no CTB slot (B22 = a,
 * the Daigoro seam `ActorRuntime.ordersOnly`) — read off the published state
 * alone, so a rebuilt runtime can re-apply it (the `markEvraeRuntime` lesson).
 * The one-command preview's rebuild (`simulate.ts#runtimeFor`) does not call
 * it: a preview never reads the turn order, so the mark changes nothing there.
 */
export function markOmnisRuntime(state: Readonly<BattleState>, actors: ReadonlyMap<CombatantId, ActorRuntime>): void {
  if (typeof state.flags[OMNIS_DISCS] !== 'string') return;
  for (const id of MORTIPHASM_IDS) {
    const rt = actors.get(id);
    if (rt) rt.ordersOnly = true;
  }
}
