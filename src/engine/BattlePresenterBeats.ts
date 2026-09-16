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
  if (ctx.onActionRig) {
    ctx.onActionRig = false;
    void ctx.stage.camera.moveTo('idle', 620);
  }
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

  if (!ctx.onActionRig && ctx.stage.camera.rigNames.includes('action')) {
    ctx.onActionRig = true;
    void ctx.stage.camera.moveTo('action', 300);
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
  const heavy = event.crit || event.overkill === true || event.capped === true;
  if (heavy) {
    ctx.stage.camera.shake(0.16, 340);
    void ctx.stage.camera.punch(0.11, 460);
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
  ctx.stage.vfx.screenFlash('#ffffff', 220);
  ctx.stage.camera.shake(0.2, 520);
  cue(ctx, 'form-change');
  await actor?.fadeTo(0.15, 320);
  // The art session ships boss forms as `<id>-<n>` (yunalesca-1/2/3), so an
  // event that omits `spriteKey` still resolves to the right painting.
  await ctx.stage.setArt(event.enemyId, event.spriteKey ?? `${event.enemyId}-${event.formIndex + 1}`);
  await actor?.fadeTo(1, 380);
  await ctx.sleep(TIMING.formChange - 700);
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
  await banner(ctx, event.name, 'telegraph');
  await ctx.sleep(TIMING.charge);
}

export async function victory(ctx: EventCtx): Promise<void> {
  cue(ctx, 'victory');
  for (const id of ctx.stage.staged()) {
    const side = ctx.stage.sideOf(id);
    if (side === 'party' || side === 'aeon') ctx.stage.actor(id)?.setPose('victory');
  }
  if (ctx.stage.camera.rigNames.includes('victory')) {
    void ctx.stage.camera.moveTo('victory', 900);
  }
  await ctx.sleep(TIMING.victory);
}

export async function defeat(ctx: EventCtx): Promise<void> {
  ctx.stage.vfx.screenFlash('rgba(0,0,0,0.55)', 900);
  for (const id of ctx.stage.staged()) {
    if (ctx.stage.sideOf(id) === 'party') ctx.stage.actor(id)?.setPose('ko');
  }
  await ctx.sleep(TIMING.defeat);
}
