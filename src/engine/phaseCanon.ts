/**
 * D-224 (Bailey, 2026-09-26, "I'll go with all of your recommendations"):
 * phase lighting, option A, the reduced version: on a boss's **canon** phase
 * beats only, the arena's grade, fog, floor glow and a bounce/rim tint on the
 * figures turn over about 1.5 s. Which beats count is research §9 row 4
 * (`research/ffx-vs-ffx2-presentation.md`): "No source describes phase
 * lighting in either game ... hang it on beats canon actually has". Lighting
 * on our own invented beats is the failure mode that row names, so the table
 * below is the whole list.
 *
 * Game case (rule 14): the mechanism is shared plumbing (both); each trigger
 * row is its own game's beat, tagged below. The looks are ours (hand-picked,
 * hue and exposure only, never albedo, per the tile's risk note), not data.
 *
 * Pure: no `three`, no DOM. The presenter reads {@link phaseCue} per event
 * (`BattlePresenterPhase.ts`); the stage reads {@link phaseForFormation} and
 * {@link phaseForFlags} (`PhaseLighting.ts`).
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';

export type PhaseId =
  | 'base'
  | 'flux-reflect'
  | 'mortiorchis-charge'
  | 'mortiorchis-imminent'
  | 'yunalesca-2'
  | 'yunalesca-3'
  | 'anima'
  | 'evrae-far'
  | 'bahamut-countdown'
  | 'bahamut-imminent'
  | 'vegnagun-leg'
  | 'vegnagun-body'
  | 'vegnagun-head';

/** The canon beat behind each phase, with its game and source. */
export const PHASE_TRIGGERS: Readonly<Record<Exclude<PhaseId, 'base'>, { game: 'ffx' | 'ffx2'; beat: string; cite: string }>> = Object.freeze({
  'flux-reflect': { game: 'ffx', beat: 'Seymour Flux casts Reflect on himself below 50% HP (Ch I)', cite: 'research/ffx-seymour-flux.md §4.4 ("Immediately casts Reflect on himself + enters Phase 2")' },
  'mortiorchis-charge': { game: 'ffx', beat: 'Mortiorchis: Auto-Attack Mode (Ch I)', cite: 'research/ffx-seymour-flux.md §4.4.2, charge turn 1' },
  'mortiorchis-imminent': { game: 'ffx', beat: 'Mortiorchis: Ready To Annihilate (Ch I)', cite: 'research/ffx-seymour-flux.md §4.4.2, charge turn 2' },
  'yunalesca-2': { game: 'ffx', beat: "Yunalesca's second form (Ch II)", cite: 'research/ffx-yunalesca.md §2.2 and §17.5' },
  'yunalesca-3': { game: 'ffx', beat: "Yunalesca's third form (Ch II)", cite: 'research/ffx-yunalesca.md §2.2 and §17.5' },
  anima: { game: 'ffx', beat: 'Seymour summons Anima (Ch VII)', cite: 'src/battle/ffx/ai/macalania-rules.ts §5.2 (the summon at half his bar)' },
  'evrae-far': { game: 'ffx', beat: 'Cid pulls the Fahrenheit back (Ch VIII)', cite: "research/ffx-evrae-airship.md §2.3 (Cid flies the queued order); state.flags['airship.range']" },
  'bahamut-countdown': { game: 'ffx2', beat: "Bahamut's Mega Flare countdown, 5 to 3 (Ch IV)", cite: 'research/ffx2-bahamut.md §2.1 (the script: five countdown turns, then Mega Flare)' },
  'bahamut-imminent': { game: 'ffx2', beat: "Bahamut's Mega Flare countdown, 2 to 0 (Ch IV)", cite: 'research/ffx2-bahamut.md §2.1 (the script: five countdown turns, then Mega Flare)' },
  'vegnagun-leg': { game: 'ffx2', beat: "Vegnagun's second link, the leg (Ch V)", cite: 'research/ffx2-vegnagun-shuyin.md (tail, leg, body, head: "a different camera framing of the same object")' },
  'vegnagun-body': { game: 'ffx2', beat: "Vegnagun's third link, the body (Ch V)", cite: 'research/ffx2-vegnagun-shuyin.md, as above' },
  'vegnagun-head': { game: 'ffx2', beat: "Vegnagun's fourth link, the head (Ch V)", cite: 'research/ffx2-vegnagun-shuyin.md, as above' },
});

/**
 * A charge ladder's lighting is transient: when its payload has resolved (the
 * charger's action ends), the arena returns to the phase it had before.
 */
export const TRANSIENT_PHASES: ReadonlySet<PhaseId> = new Set(['mortiorchis-charge', 'mortiorchis-imminent', 'bahamut-countdown', 'bahamut-imminent']);

/** The payload each charger fires at the top of its ladder. */
const PAYLOADS: Readonly<Record<CombatantId, string>> = { mortiorchis: 'total-annihilation', bahamut: 'mega-flare' };

/** What a cue asks for: a phase, or a return to the phase under a charge ladder. */
export type PhaseCue = PhaseId | 'restore' | null;

/** Per-battle memory the cues need (whose payload is in flight). */
export interface PhaseMemo {
  payloadBy?: CombatantId | undefined;
}

/**
 * FFX-2 Bahamut's combatant id in Chapter IV (its form id, `bahamut`, read
 * live from the battle state; the enemy record is `ffx2-bahamut`). FFX's aeon
 * Bahamut shares the id but emits no `charge` event, and a `'restore'` with no
 * ladder running changes nothing.
 */
function isBahamut(id: CombatantId): boolean {
  return id === 'bahamut';
}

/** The phase an event asks for, or null when it is not a canon beat. */
export function phaseCue(e: BattleEvent, memo: PhaseMemo): PhaseCue {
  switch (e.type) {
    case 'action-start': {
      if (e.actorId === 'seymour-flux' && e.abilityId === 'reflect') return 'flux-reflect';
      const payload = PAYLOADS[e.actorId];
      if (payload && e.abilityId === payload) memo.payloadBy = e.actorId;
      return null;
    }
    case 'action-end':
      if (memo.payloadBy && memo.payloadBy === e.actorId) {
        memo.payloadBy = undefined;
        return 'restore';
      }
      return null;
    case 'charge':
      if (e.enemyId === 'mortiorchis') return e.stage === 2 ? 'mortiorchis-imminent' : 'mortiorchis-charge';
      if (isBahamut(e.enemyId)) return e.stage === 2 ? 'bahamut-imminent' : 'bahamut-countdown';
      return null;
    case 'form-change':
      if (e.enemyId === 'yunalesca') return e.formIndex >= 2 ? 'yunalesca-3' : e.formIndex === 1 ? 'yunalesca-2' : null;
      return null;
    case 'part-restored':
      return e.partId === 'anima-macalania' ? 'anima' : null;
    default:
      return null;
  }
}

/** Vegnagun's links, from who is on the field (a link's seam re-stages the formation). */
export function phaseForFormation(enemyIds: readonly CombatantId[]): PhaseId | null {
  if (enemyIds.includes('vegnagun-head')) return 'vegnagun-head';
  if (enemyIds.includes('vegnagun-body')) return 'vegnagun-body';
  if (enemyIds.includes('vegnagun-leg')) return 'vegnagun-leg';
  // The tail's link is the start, and Shuyin's fight after the head is not Vegnagun's.
  if (enemyIds.includes('vegnagun-tail') || enemyIds.includes('shuyin')) return 'base';
  return null;
}

/**
 * The *Fahrenheit*'s range, from `AIRSHIP_RANGE`. Evrae set it first (Ch VIII); Sin's Fins (Ch XVII, links 1-2)
 * and Overdrive Sin's pull (Ch XVIII) set it on the same deck, so their FAR takes the same colder grade: the
 * beat is the same ship pulling back (research/ffx-sin.md §4, §5.4), a **placeholder** until Sin's own looks
 * are picked (FFX only; plan REVIEW must-change 4). The id stays `evrae-far`: link 4's staging is unchanged.
 */
export function phaseForFlags(flags: Readonly<Record<string, unknown>> | undefined): PhaseId | null {
  const range = flags?.['airship.range'];
  if (range === 'far') return 'evrae-far';
  if (range === 'near') return 'base';
  return null;
}

/**
 * One phase's look, as changes to the scene's own palette. Hue and exposure
 * only: `gain` multiplies the palette's gain per channel, `exposure` its
 * exposure; the shadow tint and vignette nudge; the fog, the floor glow under
 * the party and the figures' bounce and rim take a colour. Ours, hand-picked.
 */
export interface PhaseGrade {
  gain: [number, number, number];
  exposure: number;
  shadowTint?: [number, number, number];
  shadowTintAdd?: number;
  vignetteAdd?: number;
  fog?: string;
  floor?: { color: string; strength: number };
  rim?: string;
}

export const NEUTRAL_GRADE: Readonly<PhaseGrade> = Object.freeze({ gain: [1, 1, 1] as [number, number, number], exposure: 1 });

export const PHASE_GRADES: Readonly<Record<PhaseId, PhaseGrade>> = Object.freeze({
  base: NEUTRAL_GRADE,
  // FFX: Seymour Flux turns cold under his own Reflect.
  'flux-reflect': { gain: [0.96, 0.97, 1.08], exposure: 0.9, shadowTint: [0.5, 0.42, 0.95], shadowTintAdd: 0.06, fog: '#8aa6e0', floor: { color: '#8fb8ff', strength: 0.22 }, rim: '#b8c8ff' },
  // FFX: the Mortiorchis ladder warms, then reddens.
  'mortiorchis-charge': { gain: [1.06, 0.99, 0.92], exposure: 0.95, floor: { color: '#ffb050', strength: 0.26 }, rim: '#ffc080' },
  'mortiorchis-imminent': { gain: [1.1, 0.94, 0.9], exposure: 0.88, vignetteAdd: 0.1, floor: { color: '#ff5a3c', strength: 0.36 }, rim: '#ff8a70' },
  // FFX: Yunalesca's forms; the third is the green one (the tile's frame: the violet drains, the room drops, a cold green key from the floor).
  'yunalesca-2': { gain: [1.0, 0.96, 1.04], exposure: 0.86, floor: { color: '#c090ff', strength: 0.2 }, rim: '#d8b8ff' },
  'yunalesca-3': { gain: [0.9, 1.06, 0.96], exposure: 0.72, shadowTint: [0.3, 0.7, 0.5], shadowTintAdd: 0.08, vignetteAdd: 0.08, fog: '#5a9a7a', floor: { color: '#7dffb0', strength: 0.42 }, rim: '#9dffc4' },
  // FFX: Anima comes up out of the floor.
  anima: { gain: [1.06, 0.92, 1.0], exposure: 0.82, shadowTint: [0.6, 0.2, 0.4], shadowTintAdd: 0.06, fog: '#6a3050', floor: { color: '#b03050', strength: 0.32 }, rim: '#ff7090' },
  // FFX: the ship pulls back into colder, thinner air (the range director keeps its own haze and wind).
  'evrae-far': { gain: [0.97, 1.0, 1.05], exposure: 0.96, floor: { color: '#9fd8ff', strength: 0.12 } },
  // FFX-2: Bahamut's countdown, violet, then pale and hard for the last two.
  'bahamut-countdown': { gain: [1.02, 0.96, 1.08], exposure: 0.9, floor: { color: '#b048f0', strength: 0.24 }, rim: '#d8b8ff' },
  'bahamut-imminent': { gain: [1.04, 0.94, 1.1], exposure: 0.8, vignetteAdd: 0.1, floor: { color: '#d8b8ff', strength: 0.42 }, rim: '#f7b6d9' },
  // FFX-2: each Vegnagun link a little deeper and pinker.
  'vegnagun-leg': { gain: [1.0, 0.98, 1.04], exposure: 0.95, floor: { color: '#9fd8ff', strength: 0.14 } },
  'vegnagun-body': { gain: [1.03, 0.96, 1.05], exposure: 0.9, floor: { color: '#ff9ae0', strength: 0.2 }, rim: '#ffc8ec' },
  'vegnagun-head': { gain: [1.06, 0.94, 1.04], exposure: 0.85, vignetteAdd: 0.08, floor: { color: '#ff6a9a', strength: 0.3 }, rim: '#ffb0d0' },
});

/** The tween's length, seconds: "about 1.5 s". */
export const PHASE_TWEEN_S = 1.5;
/** At most three light changes start in any second. */
export const MIN_PHASE_GAP_S = 1 / 3;
