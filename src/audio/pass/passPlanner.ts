/**
 * THE AUDIO PASS PLANNER (conference demo sound pass, 2026-10-22; decision 184). Pure: facts in, a {@link PassPlan} out; no DOM, no Web Audio, no state. The tables are `passRecipes.ts`.
 *
 * `src/app/screens/battleSfxVoice.ts` calls it with the facts it already resolves for the recorded set (who acts, with which weapon, what lands, whether it is a critical), and the presenter
 * hands the plan to the mixer with the cue (`BattlePresenterSfx.playCue` -> `AudioManager.playSfx`). With the pass off nothing here is called, so today's sound is untouched.
 *
 * Game case (AGENTS.md rule 14): a plan is made per game; the FFX weapons and the FFX-2 weapons never mix (`weapons.ts`), a character's accent is looked up in its own game's table, and an id the
 * table does not list for the game gets no accent.
 */

import type { Weapon } from '../sfxV2/weapons.ts';
import { CHARACTER_LAYERS, DIPS, ENEMY_RECIPES, HEADLINE_BLOWS, THUMPS, WEAPON_RECIPES } from './passRecipes.ts';
import type { BigKind, DipPlan, LayerSpec, PassPlan, SfxLayer } from './passTypes.ts';

export type PassGame = 'ffx' | 'ffx2';

/** The facts of one blow. */
export interface HitFacts {
  game: PassGame;
  /** `party`, `enemy` or `aeon`: the striker's side. */
  actorSide: 'party' | 'enemy' | 'aeon' | null;
  actorId: string | null;
  /** The striker's weapon (`weapons.ts`), when a party member's cue is a weapon's. */
  weapon: Weapon | null;
  /** True when the blow is a weapon's (a physical attack): not a spell, not an item, not a tick. */
  physical: boolean;
  crit: boolean;
  /** The ability the blow belongs to, and which hit of how many it is (the headline moves have one big hit). */
  abilityId: string | null;
  hitIndex: number;
  hitCount: number;
  /** The action's command kind (`attack`, `overdrive`, ...). */
  commandKind: string | null;
}

const db = (x: number): number => 10 ** (x / 20);

function layerOf(spec: LayerSpec, role: string): SfxLayer {
  return { key: spec.key.replace(/^first:/, ''), gain: db(spec.db), pitch: spec.pitch, skipMs: spec.skipMs, trimMs: spec.trimMs, fadeMs: spec.fadeMs, lagMs: Math.max(0, spec.lagMs ?? 0), pan: spec.pan ?? 0, role };
}

/** dB the weapon's layers come down on a critical (measured: against the `critical` base the texture sat 2.4 to 4.3 dB under it, the accent 11 to 13, instead of 6.5 and 15). */
export const CRIT_LAYER_DB = -4;

function trimmed(layer: SfxLayer, gain: number): SfxLayer {
  return gain === 1 ? layer : { ...layer, gain: layer.gain * gain };
}

/** Is this blow a big moment, and which kind: a critical, the finisher of an Overdrive (or Special), or the headline hit of a boss move. */
export function bigKindOf(f: Pick<HitFacts, 'crit' | 'abilityId' | 'hitIndex' | 'hitCount' | 'commandKind' | 'actorSide'>): BigKind | null {
  const which = f.abilityId ? HEADLINE_BLOWS[f.abilityId] : undefined;
  if (which !== undefined && (which === 'first' ? f.hitIndex === 0 : f.hitIndex === f.hitCount - 1)) return 'boss';
  if (f.commandKind === 'overdrive' && f.hitIndex === Math.max(0, f.hitCount - 1)) return 'overdrive';
  if (f.crit) return 'crit';
  return null;
}

/**
 * The plan for one blow. A physical blow gets its weapon's layer (the crack or the body), the striker's small accent and, when its base cue starts late, a base that starts on its first
 * audible sample; a big blow also gets the thump. A spell's landing gets no texture (its cue is the element's own, timed to the effect's mark: `planLanding`) but a big spell gets the thump.
 * Returns `null` when the pass adds nothing (the caller then plays today's cue exactly).
 */
export function planHit(f: HitFacts): PassPlan | null {
  const layers: SfxLayer[] = [];
  const big = bigKindOf(f);
  let baseSkip = false;
  // A critical plays the `critical` cue, not the weapon's hit: the recipes' levels are set against the weapon's hit, so on a critical (a quieter base) they come down {@link CRIT_LAYER_DB} to stay under it.
  const critTrim = f.crit ? db(CRIT_LAYER_DB) : 1;
  if (f.physical) {
    const recipe = f.actorSide === 'party' && f.weapon ? WEAPON_RECIPES[f.weapon] : f.actorSide === 'enemy' ? ENEMY_RECIPES[f.game] : undefined;
    if (recipe?.texture) layers.push(trimmed(layerOf(recipe.texture, 'texture'), critTrim));
    if (recipe?.body) layers.push(trimmed(layerOf(recipe.body, 'body'), critTrim));
    const accent = f.actorSide === 'party' && f.actorId ? CHARACTER_LAYERS[f.game][f.actorId] : undefined;
    if (accent) layers.push(trimmed(layerOf(accent, 'character'), critTrim));
    baseSkip = recipe !== undefined;
  }
  if (big) layers.push(layerOf(THUMPS[big], 'thump'));
  if (layers.length === 0 && !baseSkip) return null;
  return { ...(baseSkip ? { baseSkip: true as const } : {}), layers, ...(big ? { big, dip: DIPS[big] } : {}) };
}

/**
 * The delay to put on a spell's landing sound so it sounds when the effect lands, never before: `markInMs` is how far the effect's own clock still is from the mark of this blow
 * (`VfxPort.markIn`, 0 once it has reached it). The sound's own audible onset (`onsetMs`, from `passOnsets.ts` or the manifest) is subtracted: a cue that is silent for its first 40 ms starts 40 ms
 * early so it is heard on the mark. Never negative, never more than `maxMs` (a guard against a clock that does not advance).
 */
export function landingDelayMs(markInMs: number, onsetMs: number, maxMs = 600): number {
  if (!Number.isFinite(markInMs) || markInMs <= 0) return 0;
  return Math.max(0, Math.min(maxMs, markInMs - Math.max(0, onsetMs)));
}

/** The attack of a dip, ms: the music goes down this fast (fast enough to read as a hole in front of the blow, slow enough not to click). */
export const DIP_ATTACK_MS = 18;

/**
 * When a dip happens, in ms from now, for a blow `aheadMs` away: it goes down `leadMs` before the blow (at once when the blow is nearer than that), stays down `holdMs` past it, and is back at
 * full level `releaseMs` after that. `downAt` is when the ramp down starts; the ramp takes {@link DIP_ATTACK_MS}.
 */
export function dipTimes(aheadMs: number, plan: DipPlan): { downAt: number; holdUntil: number; backAt: number } {
  const ahead = Math.max(0, aheadMs);
  const downAt = Math.max(0, ahead - plan.leadMs);
  const holdUntil = ahead + plan.holdMs;
  return { downAt, holdUntil, backAt: holdUntil + plan.releaseMs };
}
