/**
 * FF7's effects on the spell-FX clock (FF7 only; D-244, D-260): which effect an
 * FF7 action draws, when each blow lands inside it, and how long it lasts.
 *
 * The house layer (`SpellFxLayer.ts`) runs them exactly as it runs FFX's and
 * FFX-2's: the presenter holds a numeral until its effect's mark, one copy per
 * target (Bolt, Ice, Cure, the slash, Braver), or one copy drawn from the
 * caster onto its targets (Barret's shot, Big Shot, and every Guard Scorpion
 * move: Tail Laser sweeps its one beam across both party members). The phone
 * tier's density and particle cap (`SpellFxParams.ts`) apply unchanged.
 *
 * Pure: no `three`, no DOM. FF7's ability ids are the engine's
 * (`src/data/ff7/abilities.ts`, `enemies/guard-scorpion.ts`).
 */

import type { FxSpec } from '../SpellFxTimeline.ts';
import { SPELL_HOLD_CAP_MS } from '../SpellFxSpecials.ts';
import { ff7Bolt, ff7Cure, ff7Ice, FF7_BOLT_MARK, FF7_CURE_MARK, FF7_ICE_MARK } from './effects-ff7-magic.ts';
import { ff7BigShot, ff7Braver, ff7Shot, ff7Slash, FF7_BIGSHOT_MARK, FF7_BRAVER_MARK, FF7_SHOT_MARK, FF7_SLASH_MARK } from './effects-ff7-party.ts';
import { ff7Rifle, ff7Scope, ff7ScorpionTail, ff7TailLaser, FF7_LASER_MARK, FF7_RIFLE_MARK, FF7_SCOPE_MARK, FF7_TAIL_MARK } from './effects-ff7-boss.ts';

export type Ff7FxId = 'ff7-bolt' | 'ff7-ice' | 'ff7-cure' | 'ff7-slash' | 'ff7-shot' | 'ff7-braver' | 'ff7-bigshot' | 'ff7-scope' | 'ff7-rifle' | 'ff7-tail' | 'ff7-laser';

export const FF7_FX_IDS: readonly Ff7FxId[] = ['ff7-bolt', 'ff7-ice', 'ff7-cure', 'ff7-slash', 'ff7-shot', 'ff7-braver', 'ff7-bigshot', 'ff7-scope', 'ff7-rifle', 'ff7-tail', 'ff7-laser'];

/** Effects whose flash frame and camera shake mark a big hit (the options sheet: "one flash frame on the two big hits"). */
export const FF7_BIG_HITS: ReadonlySet<Ff7FxId> = new Set(['ff7-laser', 'ff7-braver']);

const cap = SPELL_HOLD_CAP_MS;
const one = (m: number) => (): readonly number[] => [m];

export const FF7_FX_SPECS: Readonly<Record<Ff7FxId, FxSpec>> = Object.freeze({
  'ff7-bolt': { draw: ff7Bolt, marks: one(FF7_BOLT_MARK), end: 1.6, startAt: 0, perHit: false, holdCapMs: cap },
  'ff7-ice': { draw: ff7Ice, marks: one(FF7_ICE_MARK), end: 2.0, startAt: 0, perHit: false, holdCapMs: cap },
  'ff7-cure': { draw: ff7Cure, marks: one(FF7_CURE_MARK), end: 1.8, startAt: 0, perHit: false, holdCapMs: cap },
  'ff7-slash': { draw: ff7Slash, marks: one(FF7_SLASH_MARK), end: 0.85, startAt: 0.18, perHit: true, holdCapMs: cap },
  'ff7-shot': { draw: ff7Shot, marks: one(FF7_SHOT_MARK), end: 0.9, startAt: 0, perHit: true, group: true, holdCapMs: cap },
  'ff7-braver': { draw: ff7Braver, marks: one(FF7_BRAVER_MARK), end: 1.6, startAt: 0.1, perHit: false, holdCapMs: cap },
  'ff7-bigshot': { draw: ff7BigShot, marks: one(FF7_BIGSHOT_MARK), end: 2.0, startAt: 0.3, perHit: false, group: true, holdCapMs: 1_500 },
  'ff7-scope': { draw: ff7Scope, marks: one(FF7_SCOPE_MARK), end: 1.7, startAt: 0, perHit: false, group: true, holdCapMs: cap },
  'ff7-rifle': { draw: ff7Rifle, marks: one(FF7_RIFLE_MARK), end: 0.9, startAt: 0, perHit: true, group: true, holdCapMs: cap },
  'ff7-tail': { draw: ff7ScorpionTail, marks: one(FF7_TAIL_MARK), end: 1.1, startAt: 0, perHit: false, group: true, holdCapMs: cap },
  'ff7-laser': { draw: ff7TailLaser, marks: one(FF7_LASER_MARK), end: 1.9, startAt: 0, perHit: false, group: true, holdCapMs: cap },
});

/** The effect by the engine's ability id. */
const BY_ABILITY: Readonly<Record<string, Ff7FxId>> = {
  bolt: 'ff7-bolt',
  ice: 'ff7-ice',
  cure: 'ff7-cure',
  braver: 'ff7-braver',
  'big-shot': 'ff7-bigshot',
  'search-scope': 'ff7-scope',
  rifle: 'ff7-rifle',
  'scorpion-tail': 'ff7-tail',
  'tail-laser': 'ff7-laser',
};

/**
 * The effect an FF7 action draws. Attack is the one id both fighters share:
 * Cloud's sword draws the slash, Barret's gun (Long Range, drawn from him) the
 * shot, told apart by who struck. A heal (Potion) draws Cure's motes.
 */
export function ff7FxFor(abilityId: string | undefined, sourceId: string | undefined, heal: boolean): Ff7FxId | 'bloom' {
  if (abilityId && BY_ABILITY[abilityId]) return BY_ABILITY[abilityId]!;
  if (abilityId === 'attack') return sourceId === 'barret' ? 'ff7-shot' : 'ff7-slash';
  if (heal) return 'ff7-cure';
  return 'bloom';
}
