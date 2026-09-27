/**
 * The seven option-B effects, and D-233's two special moments, on a clock: when each one lands, when it is over,
 * and one running copy of an effect on one target.
 *
 * A mark is the moment a blow lands inside the effect (the fire column's ring,
 * the thunder strike, the water orb's burst, each of FFX-2 Holy's eight
 * strikes). The presenter holds a damage numeral until the effect reaches the
 * mark for that hit (`BattlePresenterSpellFx.ts`), so the number appears when
 * the spell lands and not before it.
 *
 * Pure: no `three`, no DOM.
 */

import { fire, ice, thunder, water } from './effects-elements.ts';
import { cure, hit, holy, X2_HOLY_STRIKES } from './effects-light.ts';
import { MEGAFLARE_MARK, SPECIAL_END, SPIRAL_MARK, megaflare, spiral } from './effects-specials.ts';
import { SPECIAL_HOLD_CAP_MS, SPECIAL_REPEAT_START_S, SPELL_HOLD_CAP_MS } from './SpellFxSpecials.ts';
import type { FxTarget } from './effects-shared.ts';
import type { FxDrawList } from './FxDrawList.ts';
import type { FxGame, SpellFxId } from './SpellFxRegistry.ts';

export type { FxTarget } from './effects-shared.ts';

export type DrawnFxId = Exclude<SpellFxId, 'bloom'>;

export interface FxSpec {
  draw(o: FxDrawList, t: number, T: FxTarget): void;
  /** Seconds into the effect at which hit 0, 1, ... land. */
  marks(game: FxGame): readonly number[];
  /** Seconds until the last particle has gone. */
  end: number;
  /** Where the clock starts: a blow skips the lead-in it has no time for. */
  startAt: number;
  /** A fresh copy for every hit (the blow), rather than one per action. */
  perHit: boolean;
  /**
   * One copy for the whole action, drawn on the caster and landing on the
   * centre of its targets (Mega Flare), rather than one copy per target.
   */
  group?: boolean;
  /** The longest the numeral waits for a mark, ms at normal speed. */
  holdCapMs: number;
  /** Where the clock starts when this effect has already played this battle; unset = `startAt`. */
  repeatStartAt?: number;
}

export const FX_SPECS: Readonly<Record<DrawnFxId, FxSpec>> = Object.freeze({
  fire: { draw: fire, marks: () => [0.5], end: 2.35, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  ice: { draw: ice, marks: () => [0.5], end: 2.8, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  thunder: { draw: thunder, marks: () => [0.42], end: 1.65, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  water: { draw: water, marks: () => [0.8], end: 1.85, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  holy: { draw: holy, marks: (g: FxGame) => (g === 'ffx2' ? X2_HOLY_STRIKES : [0.85]), end: 2.1, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  cure: { draw: cure, marks: () => [0.5], end: 2.1, startAt: 0, perHit: false, holdCapMs: SPELL_HOLD_CAP_MS },
  hit: { draw: hit, marks: () => [0.3], end: 0.8, startAt: 0.2, perHit: true, holdCapMs: SPELL_HOLD_CAP_MS },
  // D-233's special moments (`SpellFxSpecials.ts` has the hold rule).
  spiral: { draw: spiral, marks: () => [SPIRAL_MARK], end: SPECIAL_END, startAt: 0, perHit: false, holdCapMs: SPECIAL_HOLD_CAP_MS, repeatStartAt: SPECIAL_REPEAT_START_S },
  megaflare: {
    draw: megaflare,
    marks: () => [MEGAFLARE_MARK],
    end: SPECIAL_END,
    startAt: 0,
    perHit: false,
    group: true,
    holdCapMs: SPECIAL_HOLD_CAP_MS,
    repeatStartAt: SPECIAL_REPEAT_START_S,
  },
});

/** Draw one effect at local time t into the list. */
export function drawSpellFx(id: DrawnFxId, o: FxDrawList, t: number, T: FxTarget): void {
  o.begin();
  FX_SPECS[id].draw(o, t, T);
  o.add = false;
}

/** One effect playing on one target. */
export class RunningFx {
  t: number;
  /** Last known on-screen target; kept when the figure leaves mid-effect. */
  target: FxTarget | null = null;

  readonly id: DrawnFxId;
  readonly targetId: string;
  readonly game: FxGame;
  /** Density multiplier for this copy (quality tier, split across targets). */
  readonly dens: number;
  /** Which action started it; the presenter's counter. */
  readonly action: number;

  constructor(id: DrawnFxId, targetId: string, game: FxGame, dens: number, action: number, startAt = FX_SPECS[id].startAt) {
    this.id = id;
    this.targetId = targetId;
    this.game = game;
    this.dens = dens;
    this.action = action;
    this.t = startAt;
  }

  get spec(): FxSpec {
    return FX_SPECS[this.id];
  }

  /** Debug captures only: the clock stays at `t` until the layer is cleared. */
  held = false;
  /** How wide the bloom over the figure is: 1.3 once a crit lands in this copy. */
  bloom = 1;
  /** A group effect's targets (it is drawn on {@link targetId}, the caster, and lands on their centre). */
  groupIds: readonly string[] = [];

  get done(): boolean {
    return !this.held && this.t >= this.spec.end;
  }

  advance(dt: number): void {
    if (!this.held) this.t += dt;
  }

  /** Milliseconds until hit `k` lands (at most the spec's hold cap); 0 when it has, or when the effect has no such mark. */
  msToMark(k: number): number {
    const m = this.spec.marks(this.game)[k];
    return m === undefined ? 0 : Math.min(this.spec.holdCapMs, Math.max(0, Math.round((m - this.t) * 1000)));
  }
}
