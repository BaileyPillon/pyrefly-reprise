/**
 * **Chapter XII — Seymour Omnis and the four Mortiphasms: the fight's state and rules.**
 *
 * Source (re-parity): the game's own scripts, `research/re-ffx-ai-seymour.md` section 5 (m131 Omnis, m106 the discs,
 * the `sins03_00` formation script; D-24 to D-33). This replaces the authored version built from the wiki and
 * `research/ffx-seymour-omnis.md`, with Bailey's B8-B13, B22 and B23 answers of 2026-09-25 ("I'll go with all your
 * recommendations") and D-184 (the GameFAQs ring kept as "our estimate"). Those were estimates for what no source
 * settled; the scripts settle the ring, the reset order, the cast order and targets, the hit count and when his
 * affinity changes. The decisions they replace are listed in `docs/handoff/re-parity-ai-seymour.md`.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Every key below lives under `omnis.` on `BattleState.flags`, and every
 * hook is a no-op unless the Omnis formation set those keys at setup, so no other chapter changes.
 *
 * ## The discs are state, and they decide everything
 *
 * `omnis.discs` holds what each disc shows him, left to right. From it: his **affinity** (`./omnis-affinity.ts`) and his
 * **four spells** (the cast order, and -ra or -ga by how many discs show the element). **A hit that reaches a disc turns
 * it by the hit's damage type alone**: magical +1, physical -1, any other type nothing, on the ring
 * **Fire -> Ice -> Water -> Thunder -> Fire** (the +1 direction). No target mode, item or spell is looked at.
 *
 * ## When his affinity changes
 *
 * Only when one of two routines runs: his own pre-turn (outside his glow / Dispel / Ultima / reset turns) and the
 * pre-turn the formation script gives **every party member and aeon**, i.e. at the start of each actor's turn
 * ({@link refreshOmnisAffinities}, registered as a formation pre-turn handler in `./seymour-omnis.ts`). A disc turned during an
 * action is seen at the next turn start, not inside the same action: a Doublecast's second spell meets the old affinity.
 *
 * ## The attack counter
 *
 * His `onHit`: below 20,000 HP the threshold latches at 2 (it never goes back to 5). While he is in his normal state
 * each action that reaches him adds one to the counter, a miss, a heal and a status-only move included; a counter
 * above the threshold (the 6th hit, or the 3rd once latched) zeroes it and **glows** him red. Hits during the glow,
 * the Dispel, the Ultima and the reset turn are ignored.
 */

import type {
  BattleState,
  CombatantId,
  ElementalAffinities,
  FFXCombatant,
} from '../../common/types.ts';
import type { ActorRuntime } from '../state.ts';
import { type Ctx, tryActor } from '../state.ts';
import { OMNIS_CALLOUTS as SAY, omnisCalloutAfter, omnisCalloutOnce } from './seymour-omnis-callouts.ts';
import { type Element4, OPPOSITE, omnisAffinities } from './omnis-affinity.ts';

export { type Element4, OPPOSITE, omnisAffinities };
export { aimsAtSlots, countDiscs, layoutKey, omnisCastOrder } from './omnis-affinity.ts';

/** Ids mirrored from `src/data/ffx/enemies/seymour-omnis.ts` (the tests pin them equal). */
export const OMNIS_ID = 'seymour-omnis';
export const OMNIS_SCRIPT = 'seymour-omnis';
export const MORTIPHASM_SCRIPT = 'mortiphasm';
export const MORTIPHASM_IDS: readonly CombatantId[] = ['mortiphasm-1', 'mortiphasm-2', 'mortiphasm-3', 'mortiphasm-4'];

export type OmnisState = 'normal' | 'red' | 'dispelled' | 'reset-due';

// ---------------------------------------------------------------------------
// State keys (on `BattleState.flags`, so a story trigger or the HUD can read them)
// ---------------------------------------------------------------------------

/** What each disc shows him, left to right, comma-separated: `'fire,fire,fire,fire'`. */
export const OMNIS_DISCS = 'omnis.discs';
/** The script's reset counter: it moves on at each reset, and the colour is `OMNIS_RESET_CYCLE[counter mod 4]`. */
export const OMNIS_CYCLE = 'omnis.cycle';
/** Attacks on Seymour since the last glow. */
export const OMNIS_HITS = 'omnis.hits';
/** `normal` -> `red` (glowing) -> `dispelled` -> `reset-due` -> `normal`: the script's St 0 to 3. */
export const OMNIS_STATE = 'omnis.state';
/** True once his HP has been under a quarter: the glow threshold is then 3 for good. */
export const OMNIS_LOW = 'omnis.lowLatched';

// ---------------------------------------------------------------------------
// Constants, each with its source
// ---------------------------------------------------------------------------

/** The glow comes on the 6th hit; the 3rd once his HP has been under a quarter (`counter > threshold`, 5 then 2). */
export const ATTACKS_TO_GLOW = 6;
export const LOW_HP_BELOW = 20_000;
export const ATTACKS_TO_GLOW_LOW = 3;
/** Set by his Dispel turn and his Ultima turn, and never restored to the 180 he opens with. */
export const DEF_AFTER_DISPEL = 100;
export const DEF_AFTER_ULTIMA = 150;

/**
 * **The colour ring around one disc: Fire → Ice → Water → Thunder → Fire.**
 * **Sourced (2026-10-07, research O-7; the same ring in `research/re-ffx-ai-seymour.md` section 5.2, m106 @0x1842 to
 * 0x1b28, the disc scenes):** the game's own battle AI script (Steam HD Remaster build 25501027) steps a disc along it,
 * **forward for a magic hit, back for a physical one**. It replaces the 2026-09-25 estimate (Fire, Water, Ice, Thunder:
 * GameFAQs' reset cycle drawn as the ring, B8 = b), which had Ice and Water swapped. The painted disc turns clockwise
 * for a spell, and its quarters are re-seated to this order (`src/scenes/garden-of-pain-discs.ts`).
 */
export const DISC_RING: readonly Element4[] = ['fire', 'ice', 'water', 'lightning'];

/** What a disc shows after one turn: a spell (`'right'`) steps forward along the ring, a blow (`'left'`) back; `turnDisc` and the advisor both call it. */
export function discAfterTurn(now: Element4, direction: 'left' | 'right'): Element4 {
  const at = DISC_RING.indexOf(now);
  return at < 0 ? now : (DISC_RING[(at + (direction === 'right' ? 1 : DISC_RING.length - 1)) % DISC_RING.length] as Element4);
}

/**
 * **What the reset turns the discs to** (the script's own order, O-11 now settled by it: the earlier build used
 * GameFAQs' Fire, Water, Ice, Thunder, B8 = b): the counter starts at 0 and moves on first, so the order of resets is
 * **Ice, Water, Thunder, Fire** (index 1, 2, 3, 0), then Ice again: the {@link DISC_RING} order.
 */
export const OMNIS_RESET_CYCLE: readonly Element4[] = ['fire', 'ice', 'water', 'lightning'];

/** His -ra and -ga rows per element. */
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
// The discs
// ---------------------------------------------------------------------------

const ELEMENTS: readonly Element4[] = ['fire', 'ice', 'lightning', 'water'];

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

/** The affinities he has now, with the four disc elements replaced by what `discs` give (other elements stay). */
function withDiscAffinities(omnis: FFXCombatant, discs: readonly Element4[]): ElementalAffinities {
  const next: ElementalAffinities = { ...omnis.affinities, ...omnisAffinities(discs) };
  for (const e of ELEMENTS) if (next[e] === 'normal') delete next[e];
  return next;
}

/**
 * **His pre-turn routine**: set his affinities from the discs as they are now. Run by the formation's turn-start
 * handler for every actor, and by his own pre-turn outside his glow / Dispel / Ultima / reset turns.
 */
export function refreshOmnisAffinities(ctx: Ctx): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (!omnis || !omnisPresent(ctx)) return;
  omnis.affinities = withDiscAffinities(omnis, omnisDiscs(ctx.state));
}

function facings(discs: readonly Element4[]): Record<CombatantId, Element4> {
  const out: Record<CombatantId, Element4> = {};
  MORTIPHASM_IDS.forEach((id, i) => {
    const e = discs[i];
    if (e) out[id] = e;
  });
  return out;
}

/**
 * Turn disc `index` one quarter along {@link DISC_RING}: a spell (`'right'`) moves it +1, a blow (`'left'`) -1
 * ({@link discAfterTurn}, which the advisor's preview calls too). The state changes now; his affinity follows at the
 * next turn start. The event names what the layout makes him (the readout and the Sensor redraw from it), which is
 * what the next refresh will write.
 */
export function turnDisc(ctx: Ctx, index: number, direction: 'left' | 'right'): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  const discs = omnisDiscs(ctx.state);
  const now = discs[index];
  if (!omnis || now === undefined) return;
  discs[index] = discAfterTurn(now, direction);
  writeDiscs(ctx, discs);
  ctx.emit({
    type: 'affinity-change',
    targetId: OMNIS_ID,
    affinities: withDiscAffinities(omnis, discs),
    cause: 'part-turn',
    partId: MORTIPHASM_IDS[index] as CombatantId,
    direction,
    facings: facings(discs),
  });
}

/** Every disc to one colour, by the reset counter (his reset turn). */
export function resetDiscs(ctx: Ctx): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (!omnis) return;
  const prev = ctx.state.flags[OMNIS_CYCLE];
  const cycle = ((typeof prev === 'number' ? prev : 0) + 1) % 4;
  ctx.state.flags[OMNIS_CYCLE] = cycle;
  const colour = OMNIS_RESET_CYCLE[cycle] as Element4;
  const discs = MORTIPHASM_IDS.map(() => colour);
  writeDiscs(ctx, discs);
  ctx.emit({ type: 'affinity-change', targetId: OMNIS_ID, affinities: withDiscAffinities(omnis, discs), cause: 'reset', facings: facings(discs) });
  omnisCalloutOnce(ctx, 'reset', SAY.reset); // the first reset's line (B15)
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

/** 6, or 3 once his HP has been under a quarter (latched). */
export function glowThreshold(ctx: Pick<Ctx, 'state'>): number {
  return ctx.state.flags[OMNIS_LOW] === true ? ATTACKS_TO_GLOW_LOW : ATTACKS_TO_GLOW;
}

/**
 * **His `onHit`**: one action reached him (after its last hit record on him, before the death check). Latch the low
 * threshold under a quarter; in the normal state count it, and glow when the counter passes the threshold.
 */
export function recordOmnisHit(ctx: Ctx, omnis: FFXCombatant): void {
  if (omnis.hp < Math.floor(omnis.stats.maxHp / 4)) {
    ctx.state.flags[OMNIS_LOW] = true;
    omnisCalloutAfter(ctx, 'low', SAY.low);
  }
  if (omnisState(ctx) !== 'normal') return;
  const hits = omnisHits(ctx) + 1;
  if (hits < glowThreshold(ctx)) {
    ctx.state.flags[OMNIS_HITS] = hits;
    return;
  }
  ctx.state.flags[OMNIS_HITS] = 0;
  setOmnisState(ctx, 'red');
  // The game's only telegraph is the red glow; placeholder copy for the log until the glow itself is drawn (O-8).
  ctx.emit({ type: 'message', text: 'Seymour Omnis glows red', kind: 'telegraph' });
  omnisCalloutAfter(ctx, 'glow', SAY.glow);
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

/**
 * The opening state: the formation script's opening scene turns the discs so that **all four show Fire** (verified:
 * 3 sources), so he opens absorbing Fire and weak to Ice. Nothing is emitted (setup events never reach the
 * presenter; it reads the state).
 */
export function applyOmnisSetup(ctx: Ctx): void {
  const omnis = tryActor(ctx, OMNIS_ID);
  if (!omnis || omnis.enemy?.aiScriptId !== OMNIS_SCRIPT) return;
  writeDiscs(ctx, MORTIPHASM_IDS.map(() => 'fire'));
  ctx.state.flags[OMNIS_CYCLE] = 0;
  ctx.state.flags[OMNIS_HITS] = 0;
  ctx.state.flags[OMNIS_STATE] = 'normal';
  ctx.state.flags[OMNIS_LOW] = false;
  refreshOmnisAffinities(ctx);
  markOmnisRuntime(ctx.state, ctx.rt.actors);
  // Ifrit drinks his Fire, Ixion his Thunder and Shiva his Ice (verified: 2 sources): all three are their default
  // armour in every FFX battle (`setup.ts` AEON_INNATE_AFFINITIES, rule 14), so there is nothing to set here.
}

/**
 * The runtime mark this encounter needs — the discs own no CTB slot — read off the published state alone, so a
 * rebuilt runtime can re-apply it. The one-command preview's rebuild (`simulate.ts#runtimeFor`) does not call it:
 * a preview never reads the turn order, so the mark changes nothing there.
 */
export function markOmnisRuntime(state: Readonly<BattleState>, actors: ReadonlyMap<CombatantId, ActorRuntime>): void {
  if (typeof state.flags[OMNIS_DISCS] !== 'string') return;
  for (const id of MORTIPHASM_IDS) {
    const rt = actors.get(id);
    if (rt) rt.ordersOnly = true;
  }
}
