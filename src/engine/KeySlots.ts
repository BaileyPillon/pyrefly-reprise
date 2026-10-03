/**
 * Two painted key-pose slots under BATTLE SPECTACLE (r37 slots, 2026-10-03; both games, presentation only,
 * ports only: no `three`, no DOM, no engine state, no RNG). Both are empty until a painting is installed, and a
 * figure without one plays exactly as before: `BattleStage.paints` is asked first, so there is no request, no
 * swap, no changed wait and no changed framing.
 *
 * **1. The Overdrive / Special key pose** (`od-<abilityId>.png` in the acting figure's folder, with its sidecar,
 * e.g. `public/art/characters/tidus/od-swordplay.png`, `.../yuna-gunner/od-<special>.png`). When the acting
 * figure has a painting for the move it chose, the presenter shows it at the move's apex:
 * - **FFX** (CTB): from the action's opening, so the held Overdrive shot (letterbox, name slab, push-in) and the
 *   whole strike are on it. No wind-up or impact painting leads, and no follow-through replaces it.
 * - **FFX-2** (ATB): at the apex, the first blow landing (a lunge's contact, or the first hit, miss or heal of a
 *   spell): the wind-up (`ready`) still leads. The ATB gauges keep filling and the action takes exactly as long as
 *   today: the painting only replaces the painting on screen, it adds no wait.
 * Either way it stays up until `action-end`, which returns the figure to idle as for every action.
 *
 * **2. The boss telegraph** (`telegraph.png` in the boss's folder). The `charge` beat the presenter already plays
 * (the zoom, the heartbeat vignette, the banner) puts the painting up and holds it for that beat; added waits: none.
 * Outside an action it goes back to idle when the beat ends, inside one `action-end` does.
 *
 * Gates, shared: BATTLE SPECTACLE is on (`BattleStage.fx.enabled()`, the same port the splash and the hit-stops
 * use); FFX-2 only: not while a command menu is open ({@link FFX2_SUPPRESS_WHILE_MENU}, the brief's "never while
 * an FFX-2 menu is open"; under Active ATB a menu is often open, so those moves keep today's look). REDUCE MOTION:
 * a single cut (`immediate`, no crossfade, one swap per slot per action).
 */
import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import type { EventCtx } from './BattlePresenterEvents.ts';
import { OD_POSE_PREFIX } from './BattlePresenterArt.ts';

/** FFX-2 only: keep both slots off while a command menu is open (the brief). Flip with Bailey's word. */
export const FFX2_SUPPRESS_WHILE_MENU = true;

/** The telegraph slot's pose name (`BattlePresenterArt.ENEMY_POSES`). */
export const TELEGRAPH_POSE = 'telegraph';

/** PREVIEW: ability ids that share one key painting, by family name (never the id itself). */
export function odFamilyOf(abilityId: string): string[] {
  if (/^mix-/.test(abilityId)) return ['mix'];
  if (/^(fire|ice|water|thunder)-shot$/.test(abilityId)) return ['element-reels'];
  if (/^[a-z]+-fury$/.test(abilityId)) return ['fury'];
  if (/^x2-black-mage-(fire|blizzard|thunder|water)(a|ra|ga)?$/.test(abilityId)) return ['x2-black-mage-cast'];
  return [];
}

/** The pose name of a move's key painting. */
export function odPoseFor(abilityId: string): string {
  return `${OD_POSE_PREFIX}${abilityId}`;
}

function spectacleOn(ctx: EventCtx): boolean {
  const fx = (ctx.stage as { fx?: { enabled(): boolean } } | undefined)?.fx;
  return fx?.enabled() === true;
}

/** The presenter is playing an FFX-2 (ATB) battle: the same signal the shot picker's FFX-2 framing uses. */
function isFfx2(ctx: EventCtx): boolean {
  return ctx.moments?.shots?.ffx2Framing === true;
}

/** FFX-2 only: a command menu is open right now. */
function menuBlocks(ctx: EventCtx): boolean {
  return FFX2_SUPPRESS_WHILE_MENU && isFfx2(ctx) && ctx.menuOpen?.() === true;
}

/** A single cut under REDUCE MOTION (no crossfade), the figure's usual crossfade otherwise. */
function cutTo(ctx: EventCtx, actor: { setPose(name: string, opts?: { immediate?: boolean }): void }, pose: string): void {
  if (ctx.moments?.reducedMotion === true) actor.setPose(pose, { immediate: true });
  else actor.setPose(pose);
}

// ------------------------------------------------------- the Overdrive / Special key pose

interface OdKey {
  readonly actorId: CombatantId;
  readonly pose: string;
  readonly ffx2: boolean;
  shown: boolean;
}

/** One armed key per acting figure (the ATB can have a second action open while the first resolves). */
const keys = new WeakMap<EventCtx, Map<CombatantId, OdKey>>();

function keyOf(ctx: EventCtx, actorId: CombatantId | null | undefined): OdKey | undefined {
  return actorId ? keys.get(ctx)?.get(actorId) : undefined;
}

/**
 * `action-start`: does this move have a key painting to show? Arms it and returns it, else null (and any key
 * this figure had left from an earlier action is dropped). Nothing is shown yet.
 */
export function armOdKey(ctx: EventCtx, event: Extract<BattleEvent, { type: 'action-start' }>): OdKey | null {
  keys.get(ctx)?.delete(event.actorId);
  const id = event.abilityId ?? (event.command as { id?: string }).id;
  if (!id || !spectacleOn(ctx) || menuBlocks(ctx)) return null;
  // PREVIEW (preview-picks): the move's own painting first, then its FAMILY painting (`od-mix`, `od-element-reels`,
  // `od-fury`, `od-x2-black-mage-cast`): the engine resolves a Mix or a Reel result to a result ability id, so one
  // file per family replaces 43 Mix copies, 4 Reel copies and 12 spell copies per mage.
  const pose = [odPoseFor(id), ...odFamilyOf(id).map(odPoseFor)].find((p) => ctx.stage?.paints?.(event.actorId, p) === true);
  if (!pose) return null;
  const key: OdKey = { actorId: event.actorId, pose, ffx2: isFfx2(ctx), shown: false };
  let m = keys.get(ctx);
  if (!m) keys.set(ctx, (m = new Map()));
  m.set(event.actorId, key);
  return key;
}

/** Does the armed key open the action (FFX: the held shot and the strike are on it)? Then no wind-up painting leads. */
export function odOpensAction(key: OdKey | null): boolean {
  return key !== null && !key.ffx2;
}

function showOd(ctx: EventCtx, key: OdKey): boolean {
  const actor = ctx.stage.actor(key.actorId);
  if (!actor) return false;
  cutTo(ctx, actor, key.pose);
  key.shown = true;
  return true;
}

/** FFX, right after the action's own opening pose: put the key painting up for the held shot. */
export function showOdOnOpen(ctx: EventCtx, key: OdKey | null): void {
  if (key && !key.ffx2) showOd(ctx, key);
}

/**
 * The move's apex for `actorId`: FFX-2 puts the key painting up (once); FFX already has it up. True when the key
 * painting is on screen, so the caller must not put its own (impact, follow-through) over it.
 */
export function odApex(ctx: EventCtx, actorId: CombatantId | null): boolean {
  const key = keyOf(ctx, actorId);
  if (!key) return false;
  if (key.shown) return true;
  if (menuBlocks(ctx)) return false;
  return showOd(ctx, key);
}

/** Is a key painting armed (and not blocked by a menu) for this figure? The follow-through stands aside for it. */
export function odKeyHolds(ctx: EventCtx, actorId: CombatantId): boolean {
  const key = keyOf(ctx, actorId);
  return key !== undefined && (key.shown || !menuBlocks(ctx));
}

/** `action-end`: the action is over; the figure goes to idle as always, and the key is dropped. */
export function endOdKey(ctx: EventCtx, actorId: CombatantId | null): void {
  if (actorId) keys.get(ctx)?.delete(actorId);
}

// ------------------------------------------------------------------- the boss telegraph

/**
 * The `charge` beat opens: put the boss's telegraph painting up when it has one. Returns what to call when the
 * beat ends (it puts the boss back to idle unless an action of its own is still open, whose `action-end` does),
 * or null when nothing was shown.
 */
export function telegraphUp(ctx: EventCtx, enemyId: CombatantId): (() => void) | null {
  if (!spectacleOn(ctx) || menuBlocks(ctx)) return null;
  if (ctx.stage?.paints?.(enemyId, TELEGRAPH_POSE) !== true) return null;
  const actor = ctx.stage.actor(enemyId);
  if (!actor) return null;
  cutTo(ctx, actor, TELEGRAPH_POSE);
  return () => {
    if (ctx.actingId === enemyId) return;
    ctx.stage.actor(enemyId)?.setPose('idle');
  };
}
