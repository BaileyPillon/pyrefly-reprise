/**
 * The presenter's half of step 3's effects (motion pass, lane "fx"; Bailey 2026-10-22: "the bosses' attacks", Overdrives "Each game's own intro"; `spellfx/FxSwitch.ts`): four small beats that the
 * presenter's handlers call, each a no-op unless the new effects are on in a demo chapter.
 *
 * - {@link statusFxLanding}: a move that deals no damage (Haste, Shell, Protect, Reflect, Dispel, Banish, Slowga, Curse) emits no `damage` event, so the spell layer was never asked to draw it
 *   (`battle/ffx/hit-apply.ts`: a `formula: 'none'` row emits none). Its status events start the effect and wait for its mark, no longer than the 900 ms cap every spell keeps. **This also makes step
 *   2's five buffs reachable in a real fight; until now only the debug trigger drew them.**
 * - {@link curseDim}: Bahamut's Curse "darkens the cursed character's model" (`research/ffx2-bahamut.md` line 292, interpretive): the girl is drawn at 0.78 brightness until the status ends.
 * - {@link chargeFx}: a boss's `charge` event draws the gather (FFX-2's Bahamut counts 5, 4, 3, 2 before Mega Flare; FFX's Mortiorchis climbs the Total Annihilation ladder).
 * - {@link odIntro} and {@link dressFx}: an Overdrive's ready aura, and a girl's dress change.
 *
 * Game case (rule 14): the presenter does not know its game; the spell layer does and resolves the ids per game (`spellfx/BossFx.ts`), so FFX's aura never draws in Chapter IV and the dress change
 * never draws in Chapter I. Same rules as the other beat modules: no `three`, no DOM, ports only.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { actionOfBlow, type ActingAction } from './BattlePresenterSpellFx.ts';
import { OD_AURA_OF, PSEUDO_FX } from './spellfx/BossFx.ts';
import { fxBeat } from './spellfx/FxMotionAdapter.ts';
import { fxNewOn } from './spellfx/FxSwitch.ts';
import { ODAURA_BUILD } from './spellfx/effects-painted-od.ts';
import { SPELL_HOLD_CAP_MS } from './spellfx/SpellFxSpecials.ts';

/** How far a curse dims a girl (brightness, 1 = none). */
export const CURSE_BRIGHTNESS = 0.78;
/** The calm between an Overdrive's opening and its strike: the footage shows about 0.5 s of quiet pose (V1, `motion-fx-reference.md` 2.7); 0.35 s here [ours]. */
export const OD_CALM_MS = 350;

const calmFor = (ctx: EventCtx): boolean => ctx.moments?.reducedMotion === true;

/** The Overdrive action each presenter has open (its serial), so its first blow can tell the other lanes' hooks it is the strike. */
const odSerial = new WeakMap<EventCtx, number>();
/** The last big moment each presenter told the hooks about, as `serial:kind`, so a party-wide move stops the frame once and not once per target. */
const lastBig = new WeakMap<EventCtx, string>();

/** Boss moves that are big blows, and which of their hits is the big one: `first` or `last` (Total Annihilation's fifth). Mega Flare is FFX-2's (and FFX's aeon keeps its own id). */
const BIG_BLOWS: Readonly<Record<string, 'first' | 'last'>> = Object.freeze({
  'total-annihilation': 'last',
  'cross-cleave': 'first',
  'mega-flare': 'first',
  'x2-bahamut-mega-flare': 'first',
});

/**
 * A status event of the action on screen: start its effect (if it is one no damage event starts) and wait for its mark. `sourceId` is the event's own when the engine names it (FFX-2),
 * else the action on screen is used (FFX).
 */
export async function statusFxLanding(ctx: EventCtx, targetId: CombatantId, sourceId?: CombatantId): Promise<void> {
  if (!fxNewOn()) return;
  const vfx = ctx.stage.vfx;
  if (!vfx.land) return;
  const a = actionOfBlow(ctx, sourceId);
  if (!a?.abilityId) return;
  const ms = vfx.land(targetId, { abilityId: a.abilityId, hitIndex: 0, targets: a.targets, action: a.serial, sourceId: a.actorId, status: true });
  if (ms > 0) await ctx.sleep(Math.min(ms, SPELL_HOLD_CAP_MS));
}

/**
 * A blow has just landed in its effect (`awaitSpellLanding`, after the wait for the mark): if it is a boss's big blow or an Overdrive's first, tell the other lanes' hit-stop, punch and rumble
 * hooks (`FxMotionAdapter.ts`). Bailey's picks: hit-stop and rumble on "big hits dealt or taken, Overdrives, Mega Flare"; once per action. Inert unless the new effects are on and a hook is registered.
 */
export function bigBlow(ctx: EventCtx, event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined): void {
  if (!fxNewOn() || !a) return;
  const which = a.abilityId ? BIG_BLOWS[a.abilityId] : undefined;
  const hit = event.hitIndex ?? 0;
  const boss = which !== undefined && (which === 'first' ? hit === 0 : hit === event.hitCount - 1);
  const od = odSerial.get(ctx) === a.serial && hit === 0;
  if (!boss && !od) return;
  const key = `${a.serial}:${boss ? 'boss' : 'od'}`;
  if (lastBig.get(ctx) === key) return;
  lastBig.set(ctx, key);
  fxBeat(boss ? 'boss-big' : 'od-strike', a.actorId, { calm: calmFor(ctx) });
}

/** Curse darkens the cursed girl (Bahamut's Curse only: the ability is named `...bahamut-curse`); it ends with the status. */
export function curseDim(ctx: EventCtx, status: string, targetId: CombatantId, on: boolean): void {
  if (!fxNewOn() || status !== 'curse' || ctx.stage.sideOf(targetId) !== 'party') return;
  if (on && !/bahamut-curse$/.test(ctx.acting?.abilityId ?? '')) return;
  ctx.stage.actor(targetId)?.setBrightness(on ? CURSE_BRIGHTNESS : 1);
}

/** The charge level a `charge` event stands for, 1 to 5: Bahamut's countdown names the number (`5` is the first step, level 1); a ladder step is level 2 (charging) or 4 (imminent). */
export function chargeLevel(event: Extract<BattleEvent, { type: 'charge' }>): number {
  const n = Number(event.name);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? 6 - n : event.stage === 2 ? 4 : 2;
}

export function chargeFx(ctx: EventCtx, event: Extract<BattleEvent, { type: 'charge' }>): void {
  if (!fxNewOn()) return;
  const level = chargeLevel(event);
  ctx.stage.vfx.land?.(event.enemyId, { abilityId: PSEUDO_FX.gather, hitIndex: 0, level, deco: true });
  if (event.turnsLeft <= 0) fxBeat('boss-charge', event.enemyId, { calm: calmFor(ctx) });
}

/**
 * An Overdrive opens (`open` is the ordinary opening: the letterbox, the name slab, the held push): with the new effects on, the ready aura builds on the actor under it (FFX: the footage's flame
 * and ring, `effects-painted-od.ts`), the other lanes' wind-up hooks are told (`FxMotionAdapter`), and a calm beat follows before the strike. With them off it is just `open()`.
 */
export async function odOpening(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>, open: () => Promise<void>): Promise<void> {
  if (!fxNewOn()) return open();
  const id = event.actorId;
  ctx.stage.vfx.land?.(id, { abilityId: PSEUDO_FX.odaura, hitIndex: 0, variant: OD_AURA_OF[id] ?? '', deco: true });
  if (ctx.acting) odSerial.set(ctx, ctx.acting.serial);
  fxBeat('od-open', id, { calm: calmFor(ctx), ms: ODAURA_BUILD * 1000 });
  await open();
  await ctx.sleep(OD_CALM_MS);
}

/** A girl changes dress: the painted burst under the HUD's own flourish (Chapter IV only; the layer draws nothing for it in Chapter I). */
export function dressFx(ctx: EventCtx, who: CombatantId): void {
  if (!fxNewOn()) return;
  ctx.stage.vfx.land?.(who, { abilityId: PSEUDO_FX.dress, hitIndex: 0, variant: who, deco: true });
}
