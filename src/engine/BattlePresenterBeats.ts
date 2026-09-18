/**
 * The named beats each `BattleEvent` resolves into: the wind-up, the hit, the
 * send, the telegraph, the victory pose.
 *
 * Split out of `BattlePresenterEvents.ts` so the dispatch switch there stays
 * readable at a glance. Same rules apply: no `three`, no DOM, ports only.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import {
  banner,
  cue,
  elementCue,
  numeral,
  TIMING,
  poseForCommand,
  type EventCtx,
} from './BattlePresenterEvents.ts';

// ----------------------------------------------------------------- handlers

export async function turnStart(ctx: EventCtx, actorId: CombatantId): Promise<void> {
  ctx.stage.actor(actorId)?.setPose('idle');
  void ctx.moments.turnStart();
  await ctx.sleep(TIMING.turnStart);
}

export async function actionStart(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'action-start' }>,
): Promise<void> {
  ctx.actingId = event.actorId;
  const actor = ctx.stage.actor(event.actorId);
  const pose = poseForCommand(event.command.kind);
  actor?.setPose(pose);

  if (event.abilityName) {
    void ctx.deps.messageBar?.show(event.abilityName, 'ability');
  }

  // The shot. An Overdrive earns its own rig — letterbox, name slab, held
  // push-in — and everything else gets the ordinary punch-in on the attacker.
  if (event.command.kind === 'overdrive') {
    await ctx.moments.overdriveStart(event.actorId, event.abilityName ?? 'OVERDRIVE');
  } else {
    await ctx.moments.actionOpen(event.actorId, pose);
  }

  if (pose === 'attack') {
    cue(ctx, 'attack', { volume: 0.8 });
    void actor?.lunge(1.4, 440);
    void actor?.squash(260, 0.45);
  } else if (pose === 'cast') {
    cue(ctx, 'cast', { volume: 0.7 });
    actor?.flash(0x9fd8ff, 560, 0.45);
  }
  await ctx.sleep(pose === 'attack' ? TIMING.windUp : TIMING.actionStart);
}

export async function actionEnd(ctx: EventCtx): Promise<void> {
  const actor = ctx.actingId ? ctx.stage.actor(ctx.actingId) : undefined;
  actor?.setPose('idle');
  ctx.actingId = null;
  // Whatever the shot was — Overdrive letterbox, telegraph zoom, a plain
  // punch-in — this is where the frame comes back to neutral.
  await ctx.moments.actionClose();
  await ctx.sleep(TIMING.settle);
}

export async function damage(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'damage' }>,
): Promise<void> {
  const target = ctx.stage.actor(event.targetId);

  // Rule 5: a `heals`-flagged action is negative damage, not a `heal` event.
  if (event.amount < 0) {
    target?.flash(0x9dffc4, 320, 0.6);
    numeral(ctx, event.targetId, {
      kind: 'heal',
      amount: -event.amount,
      hitIndex: event.hitIndex,
      hitCount: event.hitCount,
    });
    cue(ctx, 'heal', { volume: 0.7 });
    return ctx.sleep(TIMING.perHit);
  }

  if (event.affinity === 'immune' || event.amount === 0) {
    numeral(ctx, event.targetId, { kind: 'miss', text: event.affinity === 'immune' ? 'IMMUNE' : '0' });
    return ctx.sleep(TIMING.miss);
  }

  // The cut to the target, on the frame the hit lands. Only the first hit of a
  // multi-hit action moves the camera (see `BattleMoments.impact`).
  const heavy = event.crit || event.overkill === true || event.capped === true;
  ctx.moments.impact(event.targetId, { hitIndex: event.hitIndex, heavy });

  void ctx.stage.vfx.impact(event.targetId, { element: event.element, crit: event.crit });
  target?.flash(event.crit ? 0xffffff : 0xffd0c0, event.crit ? 260 : 200, event.crit ? 1 : 0.8);
  target?.shake(event.crit ? 0.16 : 0.1, 340);
  void target?.recoil(360, event.crit ? 0.34 : 0.22);
  cue(ctx, elementCue(event.element, event.crit), { volume: event.crit ? 1 : 0.8 });

  numeral(ctx, event.targetId, {
    kind: 'damage',
    amount: event.amount,
    crit: event.crit,
    hitIndex: event.hitIndex,
    hitCount: event.hitCount,
  });

  // Hit-stop: the whole frame holds for a beat on a crit or a finishing blow.
  // (The punch that goes with it is part of the impact cut, above.)
  if (heavy) {
    ctx.stage.camera.shake(0.16, 340);
    await ctx.sleep(TIMING.hitStop);
  } else if (event.hitIndex === 0) {
    ctx.stage.camera.shake(0.08, 220);
  }

  // Multi-hit actions run tight; a single blow gets room to land.
  await ctx.sleep(event.hitCount > 1 ? TIMING.perHit : TIMING.damage);
}

export async function ko(ctx: EventCtx, id: CombatantId): Promise<void> {
  const actor = ctx.stage.actor(id);
  const side = ctx.stage.sideOf(id);
  cue(ctx, 'ko');
  if (side === 'enemy') {
    // A fiend is sent: it comes apart into pyreflies and leaves the field.
    await actor?.dissolveTo(1, TIMING.ko, 0x9dffc4);
    ctx.stage.removeCombatant(id);
    return;
  }
  // A KO'd party member stays on the field, down.
  actor?.setPose('ko');
  actor?.flash(0x4a5a78, 320, 0.7);
  await ctx.sleep(TIMING.ko);
}

export async function summon(ctx: EventCtx, combatantId: CombatantId, aeonId: string): Promise<void> {
  ctx.stage.vfx.screenFlash('#ffffff', 260);
  cue(ctx, 'summon');
  const actor = await ctx.stage.addCombatant(combatantId, {
    artId: aeonId,
    side: 'aeon',
    slot: 1,
  });
  actor?.setAlpha(0);
  await actor?.fadeTo(1, 620);
  void actor?.hop(0.5, 520);
  await ctx.sleep(TIMING.summon - 620);
}

export async function formChange(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'form-change' }>,
): Promise<void> {
  const actor = ctx.stage.actor(event.enemyId);
  // Hold on the boss while the flash carries the swap, so the new form is
  // revealed in close-up rather than noticed later at the idle framing.
  await ctx.moments.formChange(event.enemyId);
  ctx.stage.vfx.screenFlash('#ffffff', 220);
  ctx.stage.camera.shake(0.2, 520);
  cue(ctx, 'form-change');
  await actor?.fadeTo(0.15, 320);
  // The art session ships boss forms as `<id>-<n>` (yunalesca-1/2/3), so an
  // event that omits `spriteKey` still resolves to the right painting.
  await ctx.stage.setArt(event.enemyId, event.spriteKey ?? `${event.enemyId}-${event.formIndex + 1}`);
  await actor?.fadeTo(1, 380);
  await ctx.sleep(TIMING.formChange - 700);
  await ctx.moments.formChangeEnd();
}

export async function charge(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'charge' }>,
): Promise<void> {
  const actor = ctx.stage.actor(event.enemyId);
  const imminent = event.stage === 2;
  actor?.flash(imminent ? 0xff6b5a : 0xffc46b, 620, imminent ? 1 : 0.7);
  if (imminent) {
    ctx.stage.vfx.screenFlash('rgba(255,70,50,0.28)', 420);
    ctx.stage.camera.shake(0.07, 520);
  }
  cue(ctx, 'charge', { volume: imminent ? 1 : 0.7 });
  // Total Annihilation, Mega Flare, the Ultimate Jecht Shot, Terror of
  // Zanarkand: the HUD raises its banner from `onEvent`; the moment is the
  // slow zoom onto the boss and the heartbeat vignette pulse under it.
  void ctx.moments.telegraph(event.enemyId, imminent ? 2 : 1, event.name);
  await banner(ctx, event.name, 'telegraph');
  await ctx.sleep(TIMING.charge);
}

export async function victory(ctx: EventCtx): Promise<void> {
  cue(ctx, 'victory');
  for (const id of ctx.stage.staged()) {
    const side = ctx.stage.sideOf(id);
    if (side === 'party' || side === 'aeon') ctx.stage.actor(id)?.setPose('victory');
  }
  void ctx.moments.victory();
  await ctx.sleep(TIMING.victory);
}

export async function defeat(ctx: EventCtx): Promise<void> {
  ctx.moments.clear();
  ctx.stage.vfx.screenFlash('rgba(0,0,0,0.55)', 900);
  for (const id of ctx.stage.staged()) {
    if (ctx.stage.sideOf(id) === 'party') ctx.stage.actor(id)?.setPose('ko');
  }
  await ctx.sleep(TIMING.defeat);
}
