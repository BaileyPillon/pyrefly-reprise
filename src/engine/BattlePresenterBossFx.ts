/**
 * The presenter's half of step 3's effects (motion pass, lane "fx"; Bailey 2026-10-22: "the bosses' attacks", Overdrives "Each game's own intro"; `spellfx/FxSwitch.ts`): four small beats that the
 * presenter's handlers call, each a no-op unless the new effects are on in a demo chapter.
 *
 * - {@link statusFxLanding}: a move that deals no damage (Haste, Shell, Protect, Reflect, Dispel, Banish, Slowga, Curse) emits no `damage` event, so the spell layer was never asked to draw it
 *   (`battle/ffx/hit-apply.ts`: a `formula: 'none'` row emits none). Its status events start the effect and (FFX only) wait 250 ms for it to be seen starting (there is no numeral to hold). **This also
 *   makes step 2's five buffs reachable in a real fight; until now only the debug trigger drew them.**
 * - {@link freshBlowHeld}: a blow of one of the new boss moves keeps its numeral and HP row back until the effect's mark, whatever SKILL TRAVEL does (review M1).
 * - {@link prerollFx}: FFX-2 only: Bahamut's and Rikku's long moves start their effect when the cast starts, so the presenter waits for the rest of the lead-in and not all of it (review M2).
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
import { claimBigBlow } from './feel/BlowClaim.ts';
import { rumbleCharge } from './feel/FeelHooks.ts';
import { OD_AURA_OF, PSEUDO_FX, bossFxFor, pieceOfFx } from './spellfx/BossFx.ts';
import { fxBeat } from './spellfx/FxMotionAdapter.ts';
import { fxGame, fxNewOn, fxPieceOn } from './spellfx/FxSwitch.ts';
import { ODAURA_BUILD } from './spellfx/effects-painted-od.ts';

/**
 * How long a status event waits for its effect: a move with no damage has no numeral to hold, so the wait is only to let the effect be seen starting; the effect goes on drawing while the presenter moves
 * on. 250 ms [ours] (the marks are 0.35 to 0.55 s: waiting for them cost every Haste about 0.45 s). **FFX only**: FFX is turn-based and the wait costs no game time.
 */
export const STATUS_WAIT_MS = 250;
/**
 * FFX-2: no wait. This port's presenter does not tick the ATB while a burst plays (`BattlePresenterActive.runActivePump`, `battle/ffx2/engine.ts`), so every millisecond the presenter waits is paused ATB,
 * and the retail game never waits for an effect (`research/re-ffx2-timing-measured.md`). The effect goes on drawing while the girl returns to her place (review M2).
 */
export const STATUS_WAIT_FFX2_MS = 0;

/** The new boss effects whose lead-in is long enough to be worth starting with the cast (all of them FFX-2's: Curse 0.55 s, Impulse 0.8 s, Darkness 0.82 s to the mark). */
const PREROLL_FX: ReadonlySet<string> = new Set(['curse', 'impulse', 'darkness']);
/** Decoration, not a landing: nothing holds a numeral for these. */
const DECORATION_FX: ReadonlySet<string> = new Set(['gather', 'odaura', 'dress']);

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
 * A status event of the action on screen: start its effect (if it is one no damage event starts) and wait for it to be seen starting (`STATUS_WAIT_MS`, no longer than its mark). `sourceId` is the event's own when the engine names it (FFX-2),
 * else the action on screen is used (FFX).
 */
export function statusFxLanding(ctx: EventCtx, targetId: CombatantId, sourceId?: CombatantId): Promise<void> | undefined {
  if (!fxPieceOn('status')) return undefined; // nothing to wait for: the caller awaits only a promise (a switch-off run takes no extra turn)
  const vfx = ctx.stage.vfx;
  if (!vfx.land) return undefined;
  const a = actionOfBlow(ctx, sourceId);
  if (!a?.abilityId) return undefined;
  const ms = vfx.land(targetId, { abilityId: a.abilityId, hitIndex: 0, targets: a.targets, action: a.serial, sourceId: a.actorId, status: true });
  const wait = fxGame() === 'ffx2' ? STATUS_WAIT_FFX2_MS : STATUS_WAIT_MS;
  return ms > 0 && wait > 0 ? ctx.sleep(Math.min(ms, wait)) : undefined;
}

/**
 * Does this blow's numeral (and HP row) wait for the new effect's mark? True for a blow of a boss move of the new set that has an effect with a strike to wait for (Lance of Atrophy, Full-Life, Cross Cleave,
 * Total Annihilation, Flare, Banish, Slowga, Mortibsorption, Jump, Curse, Impulse, Darkness; not the charge, the aura or the dress change), when the new effects are on in a demo chapter and its piece (`bosses`) is on.
 * `SkillTravel.blowHeld` asks this first, so the hold does not depend on a shot flying: the new boss effects draw their own approach and refuse the shot (`SpellFxFreshLayer.canTravelFx`), which had
 * dropped the hold (review M1: the number came 0.3 to 1.0 s before the strike, or before the effect started). A blow with no `sourceId` (Darkness's HP cost on its caster, a status tick) belongs to no
 * action and shows at once, as before. Needs the presenter's `reveal` to release it. Inert with the new effects off.
 */
export function freshBlowHeld(ctx: EventCtx, event: BattleEvent): boolean {
  if (event.type !== 'damage' || event.sourceId === undefined || ctx.reveal === undefined || !fxNewOn()) return false;
  const game = fxGame();
  const id = actionOfBlow(ctx, event.sourceId)?.abilityId;
  const fx = game !== undefined && id !== undefined ? bossFxFor(id, game) : null;
  return fx !== null && !DECORATION_FX.has(fx) && fxPieceOn(pieceOfFx(fx));
}

/**
 * Is this blow the HP cost of a new-set boss move, paid by its own caster (Rikku's Darkness: a `damage` on her with no striker)? It does not wait for the move's effect: the effect lands with the blow on
 * the foe, which waits for its mark alone. Before this the cost blow waited for the mark and the foe's numeral came 240 ms after the strike (browser frames at 60 and 144 Hz: Darkness at effect 1.065 against
 * its mark of 0.82), and the move took that much longer in a port whose ATB stops while the presenter plays. Inert with the new effects off.
 */
export function costOfFreshMove(event: Extract<BattleEvent, { type: 'damage' }>, a: ActingAction | undefined): boolean {
  if (!fxNewOn() || !a?.abilityId || event.sourceId !== undefined || event.targetId !== a.actorId) return false;
  const game = fxGame();
  const fx = game === undefined ? null : bossFxFor(a.abilityId, game);
  return fx !== null && !DECORATION_FX.has(fx) && fxPieceOn(pieceOfFx(fx));
}

/**
 * FFX-2 only (review M2): a long boss move starts its effect when the cast starts, not at the first blow. The effect keeps its faithful lead-in (Darkness's bolt and ring, Impulse's streams, Curse's gathering) and
 * the cast pose's own 380 ms runs inside it, so the presenter waits for what is left of the lead-in at the blow (about 0.4 s for Darkness and Impulse) and not for all of it (0.8 s): in this port the ATB does
 * not tick while the presenter plays. The copy is decoration to the layer (`LandOpts.deco`): it covers no blow, and the blows find it by the action's number and wait for their own marks as before.
 */
export function prerollFx(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): void {
  if (!fxNewOn() || fxGame() !== 'ffx2') return;
  const a = actionOfBlow(ctx, event.actorId);
  const fx = a?.abilityId ? bossFxFor(a.abilityId, 'ffx2') : null;
  if (!a || fx === null || !PREROLL_FX.has(fx) || !fxPieceOn(pieceOfFx(fx))) return;
  // Bahamut's party-wide Impulse names no target when it starts (the engine resolves them in the action): the other team's figures on the field are who it will hit.
  const side = ctx.stage.sideOf(a.actorId);
  const foeSide = side === 'party' ? 'enemy' : 'party';
  const targets = a.targets.length > 0 ? a.targets : side === undefined ? [] : ctx.stage.staged().filter((id) => ctx.stage.sideOf(id) === foeSide);
  const first = targets[0];
  if (first === undefined) return;
  ctx.stage.vfx.land?.(first, { abilityId: a.abilityId, hitIndex: 0, targets, action: a.serial, sourceId: a.actorId, deco: true });
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
  claimBigBlow(event); // the stop, the punch and the pulse for this beat are the feel rules' (`feel/BlowClaim.ts`): this blow is read as the finisher of a big action, once
}

/**
 * Curse darkens the cursed girl (Bahamut's Curse only: the ability is named `...bahamut-curse`); it ends with the status. `sourceId` is the status event's own: FFX-2's ATB overlaps actions and
 * `ctx.acting` is the latest one started, so the action is found by its caster, as `statusFxLanding` does (review m2).
 */
export function curseDim(ctx: EventCtx, status: string, targetId: CombatantId, on: boolean, sourceId?: CombatantId): void {
  if (!fxPieceOn('bosses') || status !== 'curse' || ctx.stage.sideOf(targetId) !== 'party') return;
  if (on && !/bahamut-curse$/.test(actionOfBlow(ctx, sourceId)?.abilityId ?? '')) return;
  ctx.stage.actor(targetId)?.setBrightness(on ? CURSE_BRIGHTNESS : 1);
}

/** The charge level a `charge` event stands for, 1 to 5: Bahamut's countdown names the number (`5` is the first step, level 1); a ladder step is level 2 (charging) or 4 (imminent). */
export function chargeLevel(event: Extract<BattleEvent, { type: 'charge' }>): number {
  const n = Number(event.name);
  return Number.isInteger(n) && n >= 1 && n <= 5 ? 6 - n : event.stage === 2 ? 4 : 2;
}

export function chargeFx(ctx: EventCtx, event: Extract<BattleEvent, { type: 'charge' }>): void {
  if (!fxPieceOn('openings')) return;
  const level = chargeLevel(event);
  ctx.stage.vfx.land?.(event.enemyId, { abilityId: PSEUDO_FX.gather, hitIndex: 0, level, deco: true });
  if (event.turnsLeft <= 0) {
    fxBeat('boss-charge', event.enemyId, { calm: calmFor(ctx) });
    rumbleCharge(ctx); // the light pulse of the beat, through the feel lane's gates (`?rumble=`, REDUCE MOTION, an open FFX-2 menu)
  }
}

/**
 * An Overdrive opens (`open` is the ordinary opening: the letterbox, the name slab, the held push): with the new effects on, the ready aura builds on the actor under it (FFX: the footage's flame
 * and ring, `effects-painted-od.ts`), the other lanes' wind-up hooks are told (`FxMotionAdapter`), and a calm beat follows before the strike. With them off it is just `open()`.
 */
export async function odOpening(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>, open: () => Promise<void>): Promise<void> {
  if (!fxPieceOn('openings')) return open();
  const id = event.actorId;
  ctx.stage.vfx.land?.(id, { abilityId: PSEUDO_FX.odaura, hitIndex: 0, variant: OD_AURA_OF[id] ?? '', deco: true });
  if (ctx.acting) odSerial.set(ctx, ctx.acting.serial);
  fxBeat('od-open', id, { calm: calmFor(ctx), ms: ctx.speed() === 'normal' ? ODAURA_BUILD * 1000 : 0, actor: ctx.stage.actor(id) }); // 0 ms at a fast-forward: no gather over a build that is cut short
  await open();
  await ctx.sleep(OD_CALM_MS);
}

/** A girl changes dress: the painted burst under the HUD's own flourish (Chapter IV only; the layer draws nothing for it in Chapter I). */
export function dressFx(ctx: EventCtx, who: CombatantId): void {
  if (!fxPieceOn('openings')) return;
  ctx.stage.vfx.land?.(who, { abilityId: PSEUDO_FX.dress, hitIndex: 0, variant: who, deco: true });
}
