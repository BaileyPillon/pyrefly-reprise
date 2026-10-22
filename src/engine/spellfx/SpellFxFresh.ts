/**
 * The new effects' clocks and draw functions (motion pass, lane "fx"; `FxSwitch.ts`): one {@link FxSpec} per effect the demo chapters draw differently when the new effects are on. A copy of an
 * effect that was started with the new effects on (`RunningFx.fresh`) reads its spec from here (`SpellFxTimeline.specOf`); anything not listed keeps today's spec and only gains the painted
 * finish. `FX_SPECS` itself is untouched (it is pinned by tests and by the live game).
 *
 * Marks (when the numeral lands) are today's or earlier, and every hold cap is today's `SPELL_HOLD_CAP_MS` (900 ms): the new effects are longer and livelier, never slower to land. FFX-2's ATB
 * never waits for an effect at all (`research/re-ffx2-timing-measured.md`; the presenter pays the mark and no more).
 *
 * Game case, per effect (AGENTS.md rule 14): Cure is FFX's column (Chapter I) and a neutral painted Cure for FFX-2's White Mage (Chapter IV); the five buffs are one neutral design in two skins;
 * the hit is per weapon, each game's own weapons; Fire, Blizzard and Thunder are shared by both games. See each file for what is sourced and what is [ours].
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { BUFF_END, BUFF_MARK, DISPEL_MARK, dispel, haste, protect, reflect, shell } from './effects-painted-buffs.ts';
import { COLUMN_STAGGER, CURE_END, CURE_MARK, cureColumn, cureWhiteMage } from './effects-painted-cure.ts';
import { fireNew, iceNew, thunderNew } from './effects-painted-elements.ts';
import { HIT_END, HIT_MARK, HIT_START, hitWeapon } from './effects-painted-hit.ts';
import type { FxTarget } from './effects-shared.ts';
import { SPELL_HOLD_CAP_MS } from './SpellFxSpecials.ts';
import type { FxSpec, FreshFxId } from './SpellFxTimeline.ts';
import type { FxGame } from './SpellFxRegistry.ts';

/** Cure: FFX's column (and its small item forms), FFX-2's neutral painted Cure. */
function cureFresh(o: FxDrawList, t: number, T: FxTarget): void {
  if (o.game === 'ffx2') cureWhiteMage(o, t, T);
  else cureColumn(o, t, T);
}

const buff = (draw: FxSpec['draw'], mark = BUFF_MARK): FxSpec => ({ draw, marks: () => [mark], end: BUFF_END, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS });

export const FRESH_SPECS: Readonly<Partial<Record<FreshFxId, FxSpec>>> = Object.freeze({
  cure: {
    draw: cureFresh,
    marks: (g: FxGame) => [g === 'ffx2' ? 0.5 : CURE_MARK],
    end: Math.max(CURE_END, 2.1),
    startAt: 0,
    perHit: false,
    holdCapMs: SPELL_HOLD_CAP_MS,
    staggerFor: (g: FxGame) => (g === 'ffx' ? COLUMN_STAGGER : 0),
  },
  hit: { draw: hitWeapon, marks: () => [HIT_MARK], end: HIT_END, startAt: HIT_START, perHit: true, holdCapMs: SPELL_HOLD_CAP_MS },
  fire: { draw: fireNew, marks: () => [0.5], end: 2.35, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  ice: { draw: iceNew, marks: () => [0.5], end: 2.8, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  thunder: { draw: thunderNew, marks: () => [0.42], end: 1.65, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  haste: buff(haste),
  shell: buff(shell),
  protect: buff(protect),
  reflect: buff(reflect),
  dispel: buff(dispel, DISPEL_MARK),
});
