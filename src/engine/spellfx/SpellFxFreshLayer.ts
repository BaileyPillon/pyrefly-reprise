/**
 * The spell layer's half of the new effects (motion pass, lane "fx"; `FxSwitch.ts`), kept out of `SpellFxLayer.ts` so that file stays under the house line cap: which effect ids exist only in the
 * new set and what the layer shows for them when it is off, the per-copy inputs the new draw functions read (a blow's weapon and direction, a heal's item form), the frame-time guard and its
 * scale step, and how a frame's draw list is configured for one running copy.
 *
 * Pure: no `three`, no DOM.
 */

import type { FxDrawList } from './FxDrawList.ts';
import { bossFxFor, pieceOfFx } from './BossFx.ts';
import { FxPerfGuard, fxShare } from './FxPerfGuard.ts';
import { fxNewOn, fxPieceOn } from './FxSwitch.ts';
import type { LandOpts } from './LandOpts.ts';
import { resolveAbilityFx } from './SpellFxLookup.ts';
import { FRESH_ONLY_FX, type FxGame, type SpellFxId } from './SpellFxRegistry.ts';
import { FX_SPECS, specOf, type FreshFxId, type FxSpec, type RunningFx } from './SpellFxTimeline.ts';

type Rect = { x: number; y: number; w: number; h: number };

/** An effect that exists only in the new set draws as the bloom it always did unless the new effects are on here and now. */
export function shownFx(fx: SpellFxId): SpellFxId {
  return FRESH_ONLY_FX.has(fx) && !fxNewOn() ? 'bloom' : fx;
}

/** The new set's effect for this ability when the new effects are on and the effect's piece is not turned off (`FxSwitch.fxPieceOn`), else null. */
function gatedBossFx(abilityId: string | undefined, game: FxGame): ReturnType<typeof bossFxFor> {
  if (!fxNewOn()) return null;
  const fx = bossFxFor(abilityId, game);
  return fx !== null && fxPieceOn(pieceOfFx(fx)) ? fx : null;
}

/**
 * The effect a landing draws: the new set's table first (the bosses' attacks, the charge, the openings; `BossFx.ts`) when the new effects are on in a demo chapter, else the ordinary lookup
 * exactly as it always was. `low` quality is the caller's (it draws the bloom).
 */
export function resolveFx(o: LandOpts, game: FxGame): SpellFxId {
  const fresh = gatedBossFx(o.abilityId, game);
  return shownFx(fresh ?? resolveAbilityFx(o.abilityId, game, o.element, o.heal === true, o.sourceId));
}

/**
 * Would SKILL TRAVEL draw a shot for this ability? Not for a special that draws its own effect (D-233: Spiral Cut, Mega Flare), and not for any effect of the new set's table: those draw their
 * own approach (the lance, the wavefront, the streams), and a second shot on top of them would double it.
 */
export function canTravelFx(abilityId: string | undefined, game: FxGame, from: string): boolean {
  if (gatedBossFx(abilityId, game) !== null) return false;
  const fx = resolveAbilityFx(abilityId, game, undefined, false, from);
  return fx !== 'spiral' && fx !== 'megaflare';
}

/** The spec an effect would run on if started now (the new set's when the new effects are on), or undefined for the bloom and anything with no drawn effect. */
export function specForFx(fx: SpellFxId): FxSpec | undefined {
  if (fx === 'bloom') return undefined;
  return Object.hasOwn(FX_SPECS, fx) || (fxNewOn() && FRESH_ONLY_FX.has(fx)) ? specOf(fx as FreshFxId, fxNewOn()) : undefined;
}

/** What a new copy reads from the blow that started it. */
export interface CopyTagOpts {
  sourceId?: string | undefined;
  abilityId?: string | undefined;
  item?: boolean | undefined;
  level?: number | undefined;
  variant?: string | undefined;
}

/**
 * The new effects' per-copy inputs: the weapon of a blow (`generic` for anyone the table does not name), the item form of a heal (a Phoenix Down is the warm one), and the way the blow goes on
 * screen (from the striker's side of the target; 1 = left to right).
 */
export function tagCopy(r: RunningFx, o: CopyTagOpts, weaponOf: ((id: string) => string | null) | undefined, rectOf: (id: string) => Rect | null): void {
  if (!r.fresh) return;
  if (r.id === 'hit') r.variant = (o.sourceId ? weaponOf?.(o.sourceId) : null) ?? 'generic';
  else if (r.id === 'cure' && o.item === true) r.variant = /phoenix|(^|-)life$/.test(o.abilityId ?? '') ? 'phoenix' : 'potion';
  else if (r.id === 'gather') r.variant = String(Math.max(1, Math.min(5, Math.round(o.level ?? 1)))); // the charge's level
  else if (r.id === 'odaura' || r.id === 'dress') r.variant = o.variant ?? ''; // whose aura (tidus, auron), whose change (yuna, rikku, paine)
  const from = o.sourceId ? rectOf(o.sourceId) : null;
  const to = rectOf(r.targetId);
  if (from && to) r.dir = from.x + from.w / 2 <= to.x + to.w / 2 ? 1 : -1;
}

/** Configure the frame's list for one running copy: the painted finish, the guard's share of particles and trails (the phone tier's 0.6 on the trails), the copy's inputs and its seed. */
export function configureList(out: FxDrawList, r: RunningFx, share: { particles: number; trails: number }, tier: number, seed: number): void {
  out.dens = r.fresh ? r.dens * share.particles : r.dens;
  out.paint = r.fresh ? 1 : 0;
  out.trailK = r.fresh ? tier * share.trails : 1;
  out.variant = r.variant;
  out.dir = r.dir;
  out.seedBase = seed;
}

/** Where a new copy's clock starts: a special that has played this battle skips part of its lead-in (`FxSpec.repeatStartAt`). */
export class StartClock {
  private readonly played = new Set<FreshFxId>();

  startFor(fx: FreshFxId, spec: FxSpec): number {
    if (spec.repeatStartAt === undefined) return spec.startAt;
    if (this.played.has(fx)) return spec.repeatStartAt;
    this.played.add(fx);
    return spec.startAt;
  }
}

/** The layer's frame-time watch: the guard, fed once per drawn frame; it passes the scale step on once and gives the scale back at the end. */
export class FreshWatch {
  readonly guard = new FxPerfGuard();
  private lastAt = 0;
  private applied = 0;

  /** One drawn frame at clock reading `now` (ms): the interval since the last, and whether a new-effects copy was on screen in it. */
  frame(now: number, busy: boolean, scaleCut: ((factor: number) => void) | undefined): void {
    const dt = this.lastAt > 0 ? now - this.lastAt : 0;
    this.lastAt = now;
    if (dt <= 0) return;
    this.guard.frame(dt, busy);
    fxShare.particles = this.guard.share.particles;
    fxShare.trails = this.guard.share.trails;
    if (this.guard.scaleStep !== this.applied) {
      this.applied = this.guard.scaleStep;
      scaleCut?.(this.guard.scaleFactor);
    }
  }

  /** The battle is over: the scene's size goes back and the share with it. */
  end(scaleCut: ((factor: number) => void) | undefined): void {
    if (this.applied > 0) scaleCut?.(1);
    this.applied = 0;
    this.guard.reset(true);
    fxShare.particles = fxShare.trails = 1;
  }
}
