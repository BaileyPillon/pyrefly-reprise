/**
 * The clocks of step 3's effects (motion pass, lane "fx"; `SpellFxFresh.ts` merges them): the bosses' attacks, the charge, an Overdrive's ready aura, Kimahri's Jump, the dress change and
 * Rikku's Darkness. Same rules as `SpellFxFresh.ts`: a spec here is read only by a copy started with the new effects on, in a demo chapter (`FxSwitch.ts`); nothing here changes the live game.
 *
 * Marks (when a numeral lands): the Chapter I attacks 0.32 to 1.02 s, the Chapter IV attacks 0.55 to 0.82 s, every hold cap is today's 900 ms (`SPELL_HOLD_CAP_MS`). A move that drew the bare
 * bloom before made its numeral wait for nothing; the wait that is added now is the effect's own mark and no more, and FFX-2's ATB never waits for an effect at all. What waits for nothing:
 * `gather`, `odaura` and `dress` are decoration (the presenter does not hold a numeral for them).
 *
 * Game case, per effect: see each draw file. Pure: no `three`, no DOM.
 */

import { ANNIHILATE_END, ANNIHILATE_MARKS, ANNIHILATE_STAGGER, CLEAVE_END, CLEAVE_MARK, CLEAVE_STAGGER, FLARE_END, FLARE_MARK, annihilate, atrophy, ATROPHY_END, ATROPHY_MARK, cleave, flare } from './effects-painted-flux.ts';
import { BANISH_END, BANISH_MARK, DRAIN_END, DRAIN_MARK, FULLLIFE_END, FULLLIFE_MARK, SLOWGA_END, SLOWGA_MARK, banish, drain, fulllife, slowga } from './effects-painted-spirit.ts';
import { CURSE_END, CURSE_MARK, DARKNESS_END, DARKNESS_MARK, GATHER_END, GATHER_MARK, IMPULSE_END, IMPULSE_MARK, curse, darkness, gather, impulse } from './effects-painted-bahamut.ts';
import { DRESS_END, DRESS_MARK, JUMP_END, JUMP_MARK, ODAURA_END, ODAURA_MARK, dress, jump, odaura } from './effects-painted-od.ts';
import type { BossFxId } from './BossFx.ts';
import { SPELL_HOLD_CAP_MS } from './SpellFxSpecials.ts';
import type { FxSpec } from './SpellFxTimeline.ts';

const one = (draw: FxSpec['draw'], mark: number, end: number, extra: Partial<FxSpec> = {}): FxSpec => ({ draw, marks: () => [mark], end, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS, ...extra });

export const BOSS_SPECS: Readonly<Record<BossFxId, FxSpec>> = Object.freeze({
  // Chapter I (FFX only): Seymour Flux and Mortiorchis
  atrophy: one(atrophy, ATROPHY_MARK, ATROPHY_END),
  fulllife: one(fulllife, FULLLIFE_MARK, FULLLIFE_END),
  cleave: one(cleave, CLEAVE_MARK, CLEAVE_END, { staggerFor: (g) => (g === 'ffx' ? CLEAVE_STAGGER : 0) }),
  annihilate: { draw: annihilate, marks: () => ANNIHILATE_MARKS, end: ANNIHILATE_END, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS, staggerFor: (g) => (g === 'ffx' ? ANNIHILATE_STAGGER : 0) },
  flare: one(flare, FLARE_MARK, FLARE_END),
  banish: one(banish, BANISH_MARK, BANISH_END),
  slowga: one(slowga, SLOWGA_MARK, SLOWGA_END),
  drain: one(drain, DRAIN_MARK, DRAIN_END, { group: true }),
  jump: one(jump, JUMP_MARK, JUMP_END),
  // Chapter IV (FFX-2 only): Bahamut, and Rikku's Darkness
  curse: one(curse, CURSE_MARK, CURSE_END),
  impulse: one(impulse, IMPULSE_MARK, IMPULSE_END, { group: true }),
  darkness: one(darkness, DARKNESS_MARK, DARKNESS_END, { group: true }),
  // the openings: decoration, no numeral waits for them (both games, each its own skin)
  gather: one(gather, GATHER_MARK, GATHER_END),
  odaura: one(odaura, ODAURA_MARK, ODAURA_END),
  dress: one(dress, DRESS_MARK, DRESS_END),
});
