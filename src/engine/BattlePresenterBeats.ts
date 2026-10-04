/**
 * The named beats each `BattleEvent` resolves into: the wind-up, the hit, the
 * send, the telegraph, the victory pose.
 *
 * Split out of `BattlePresenterEvents.ts` so the dispatch switch there stays
 * readable at a glance. Same rules apply: no `three`, no DOM, ports only.
 */

import type { BattleEvent, CombatantId } from '../battle/common/types.ts';
import { MOMENT_TIMING } from './BattleMoments.ts';
import { depart } from './BattlePresenterDepartures.ts';
import { MOMENT_GUARD_MS, MOTION_GUARD_MS, type MotionCtx } from './BattlePresenterMotion.ts';
import { awaitSpellLanding, beginSpellAction, endSpellAction } from './BattlePresenterSpellFx.ts';
import { poseForAction } from './EnemyActionPose.ts';
import { victoryPoseOf } from './VictoryPose.ts';
import { downWithoutKoPainting } from './KoFallback.ts';
import { sendCompanions } from './SentCompanions.ts';
import { armContact, meetContact, releaseContact, type LungeContact } from './ContactBeat.ts';
import { impactAtApex, windUpLeads } from './KeyPoses.ts';
import { armOdKey, endOdKey, odApex, odOpensAction, showOdOnOpen, telegraphUp } from './KeySlots.ts'; // r37 slots: a move's own key painting, the boss telegraph painting (empty until installed)
import { telegraphHold } from './TelegraphHold.ts'; // r38 keys (FFX only): the boss's telegraph painting held before Flux's and Braska's headline moves
import { partyOffStage } from './SummonStaging.ts';
import { fxActionOpen, fxDissolve, fxHit, fxVictory } from './fx/c/presenterHooks.ts'; // eye-candy option C (`?fx=c`); no-ops without it
import {
  banner,
  cue,
  elementCue,
  numeral,
  reasonText,
  settled,
  TIMING,
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
  beginSpellAction(ctx, event);
  await telegraphHold(ctx, event); // r38 keys: Flux's Lance of Atrophy, Braska's Ultimate Jecht Shot (950 ms, only with the painting; else nothing happens)
  const actor = ctx.stage.actor(event.actorId);
  // An enemy's physical ability draws its own attack painting (iter2
  // attack-pose, both games); everything else is `poseForCommand` as before.
  const pose = poseForAction(event, ctx.stage.sideOf(event.actorId), ctx.deps.abilityFacts, (p) =>
    ctx.stage.paints?.(event.actorId, p) === true,
  );
  const od = armOdKey(ctx, event); // r37 slot: this move's own Overdrive / Special painting (null when it has none)
  const windUp = !odOpensAction(od) && !ctx.deps.actionMotion?.ownsWindUp?.(event) && windUpLeads(ctx, event.actorId, pose); // D-313: the wind-up painting, then the impact at the apex
  if (odOpensAction(od)) showOdOnOpen(ctx, od); // FFX: the held shot and the strike are on the key painting
  else actor?.setPose(windUp ? 'ready' : pose);
  const motion = ctx.deps.actionMotion; // FF7: the melee run to the target (none for FFX and FFX-2)
  if (motion) await settled(ctx, motion.open(event, motionCtx(ctx)), MOTION_GUARD_MS);

  if (event.abilityName) {
    void ctx.deps.messageBar?.show(event.abilityName, 'ability');
  }

  // The shot. An Overdrive earns its own rig — letterbox, name slab, held
  // push-in — and everything else gets the ordinary punch-in on the attacker.
  if (event.command.kind === 'overdrive') {
    await ctx.moments.overdriveStart(event.actorId, event.abilityName ?? 'OVERDRIVE');
  } else {
    await ctx.moments.actionOpen(event.actorId, pose, event.targets ?? []);
  }
  await fxActionOpen(ctx, event);

  if (pose === 'attack') {
    cue(ctx, 'attack', { volume: 0.8 });
    const contact = (): LungeContact => (windUp ? impactAtApex(ctx, event.actorId, armContact(ctx, event.actorId)) : armContact(ctx, event.actorId));
    if (!motion?.ownsWindUp?.(event)) void Promise.all([actor?.lunge(1.4, 440, contact()), actor?.squash(260, 0.45)]); // FF7: its painted keys
  } else if (pose === 'cast') {
    cue(ctx, 'cast', { volume: 0.7 });
    actor?.flash(0x9fd8ff, 560, 0.45);
  } else if (pose === 'item') {
    cue(ctx, 'item', { volume: 0.7 }); // D-302: the item-use sound (voiced chapters only)
  }
  await ctx.sleep(pose === 'attack' ? TIMING.windUp : TIMING.actionStart);
}

export async function actionEnd(ctx: EventCtx): Promise<void> {
  endOdKey(ctx, ctx.actingId);
  releaseContact(ctx); // VP-1001-06: a strike still held at its apex goes home
  const actor = ctx.actingId ? ctx.stage.actor(ctx.actingId) : undefined;
  const motion = ctx.deps.actionMotion; // FF7: the run back home
  if (motion && ctx.actingId) await settled(ctx, motion.close(ctx.actingId, motionCtx(ctx)), MOTION_GUARD_MS);
  actor?.setPose('idle');
  ctx.actingId = null;
  endSpellAction(ctx);
  // Whatever the shot was — Overdrive letterbox, telegraph zoom, a plain
  // punch-in — this is where the frame comes back to neutral.
  await ctx.moments.actionClose();
  await ctx.sleep(TIMING.settle);
}

/** The slice of the playback a game's motion may use. */
function motionCtx(ctx: EventCtx): MotionCtx {
  return { stage: ctx.stage, speed: ctx.speed(), sleep: (ms) => ctx.sleep(ms) };
}

export async function damage(
  ctx: EventCtx,
  event: Extract<BattleEvent, { type: 'damage' }>,
): Promise<void> {
  const target = ctx.stage.actor(event.targetId);

  // Rule 5: a `heals`-flagged action is negative damage, not a `heal` event.
  if (event.amount < 0) {
    await awaitSpellLanding(ctx, event, true);
    odApex(ctx, event.sourceId ?? ctx.actingId); // r37 slot (FFX-2: the move's apex)
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
    await meetContact(ctx, event.targetId); // VP-1001-06
    odApex(ctx, event.sourceId ?? ctx.actingId);
    numeral(ctx, event.targetId, { kind: 'miss', text: event.affinity === 'immune' ? 'IMMUNE' : '0' });
    return ctx.sleep(TIMING.miss);
  }

  // The spell reaches the target before its numeral does (B1 spell effects).
  await awaitSpellLanding(ctx, event, false);
  await meetContact(ctx, event.targetId); // VP-1001-06: the blow lands on the strike's apex
  odApex(ctx, event.sourceId ?? ctx.actingId);

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
  const fxc = fxHit(ctx, event, heavy); // option C: null = today's shake and hit-stop sleep
  if (heavy) {
    if (!fxc?.shook) ctx.stage.camera.shake(0.16, 340);
    await ctx.sleep(Math.max(TIMING.hitStop, fxc?.waitMs ?? 0));
  } else if (event.hitIndex === 0 && !fxc?.shook) {
    ctx.stage.camera.shake(0.08, 220);
  }

  // Multi-hit actions run tight; a single blow gets room to land.
  await ctx.sleep(event.hitCount > 1 ? TIMING.perHit : TIMING.damage);
}

/** A miss, landing on the strike's apex like a hit (VP-1001-06). */
export async function missed(ctx: EventCtx, event: Extract<BattleEvent, { type: 'miss' }>): Promise<void> {
  await meetContact(ctx, event.targetId);
  odApex(ctx, event.sourceId);
  numeral(ctx, event.targetId, { kind: 'miss', text: reasonText(event.reason) });
  cue(ctx, 'miss', { volume: 0.5 });
  ctx.stage.actor(event.targetId)?.hop(0.18, 200);
  await ctx.sleep(TIMING.miss);
}

export async function ko(ctx: EventCtx, id: CombatantId): Promise<void> {
  const actor = ctx.stage.actor(id);
  const side = ctx.stage.sideOf(id);
  cue(ctx, 'ko');
  if (side === 'enemy') {
    // Evrae falls out of the sky; Leblanc, Logos, Ormi and the Guado
    // Guardians yield; Seymour at Macalania falls and his body stays
    // (`BattlePresenterDepartures.ts`). Everyone else is sent.
    const left = await depart(ctx, id, actor);
    if (left === 'stays') return;
    if (left === 'removed') {
      ctx.stage.removeCombatant(id);
      return;
    }
    // A fiend is sent: it comes apart into pyreflies and leaves the field.
    //
    // `settled`, not a bare await: this is the exact line the whole of critic
    // round 02 #01 came down to. The last enemy's dissolve never resolved, so
    // the `victory` event queued behind it never played and the chapter never
    // ended. See `ACTOR_ANIM_GRACE_MS`.
    const off = ctx.deps.actionMotion?.sendOff; // FF7: the boss's own death (flash, sparks, debris, a 1 s fade)
    if (off) await settled(ctx, off.call(ctx.deps.actionMotion, id, motionCtx(ctx)), MOMENT_GUARD_MS);
    else {
      fxDissolve(ctx, id);
      // VP-1001-28: a fused part (Mortiorchis under Seymour Flux) goes with him (`SentCompanions.ts`).
      const parts = sendCompanions(ctx, id, TIMING.ko, 0x9dffc4, (other) => fxDissolve(ctx, other));
      await Promise.all([settled(ctx, actor?.dissolveTo(1, TIMING.ko, 0x9dffc4), TIMING.ko), parts]);
    }
    ctx.stage.removeCombatant(id);
    return;
  }
  // A KO'd party member stays on the field, down.
  actor?.setPose('ko');
  downWithoutKoPainting(actor); // VP-1001-04: no KO painting, so the idle lies down
  actor?.flash(0x4a5a78, 320, 0.7);
  const down = ctx.deps.actionMotion; // FF7: laid down at once, not at the wipe-out
  if (down?.ko) void settled(ctx, down.ko(id, motionCtx(ctx)), MOTION_GUARD_MS);
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
  // PR-0181: the party leaves the field as the aeon arrives (`SummonStaging.ts`).
  await settled(ctx, Promise.all([actor?.fadeTo(1, 620), partyOffStage(ctx.stage, combatantId)]).then(() => undefined), 620);
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
  const fade = ctx.deps.actionMotion?.opaqueForms !== true; // FF7: an opaque swap under the flash
  if (fade) await settled(ctx, actor?.fadeTo(0.15, 320), 320);
  else await ctx.sleep(120);
  // The art session ships boss forms as `<id>-<n>` (yunalesca-1/2/3), so an
  // event that omits `spriteKey` still resolves to the right painting.
  await ctx.stage.setArt(event.enemyId, event.spriteKey ?? `${event.enemyId}-${event.formIndex + 1}`);
  if (fade) await settled(ctx, actor?.fadeTo(1, 380), 380);
  else await ctx.sleep(580);
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
  const telegraphDone = telegraphUp(ctx, event.enemyId); // r37 slot: the boss's own telegraph painting for this beat
  // Total Annihilation, Mega Flare, the Ultimate Jecht Shot, Terror of
  // Zanarkand: the HUD raises its banner from `onEvent`; the moment is the
  // slow zoom onto the boss and the heartbeat vignette pulse under it.
  void ctx.moments.telegraph(event.enemyId, imminent ? 2 : 1, event.name);
  await banner(ctx, event.name, 'telegraph');
  await ctx.sleep(TIMING.charge);
  telegraphDone?.();
}

export async function victory(ctx: EventCtx): Promise<void> {
  const own = ctx.deps.actionMotion?.victory; // FF7: D1's win poses, then a hold in silence
  if (own) return void (await settled(ctx, own.call(ctx.deps.actionMotion, motionCtx(ctx)), MOMENT_GUARD_MS));
  // A-4: where the sources withhold the celebration ('hold'), the figures keep
  // their battle stance and the fanfare stays quiet; the rig still settles.
  if (victoryPoseOf(ctx.deps) === 'hold') {
    void ctx.moments.victory();
    await ctx.sleep(Math.max(TIMING.victory, fxVictory(ctx, 'hold')));
    return;
  }
  cue(ctx, 'victory');
  for (const id of ctx.stage.staged()) {
    const side = ctx.stage.sideOf(id);
    if (side === 'party' || side === 'aeon') ctx.stage.actor(id)?.setPose('victory');
  }
  void ctx.moments.victory();
  await ctx.sleep(Math.max(TIMING.victory, fxVictory(ctx, 'pose')));
}

export async function defeat(ctx: EventCtx): Promise<void> {
  ctx.moments.clear();
  ctx.stage.vfx.screenFlash('rgba(0,0,0,0.55)', 900);
  for (const id of ctx.stage.staged()) {
    if (ctx.stage.sideOf(id) !== 'party') continue;
    ctx.stage.actor(id)?.setPose('ko');
    downWithoutKoPainting(ctx.stage.actor(id));
  }
  await ctx.sleep(TIMING.defeat);
  const own = ctx.deps.actionMotion?.defeat; // FF7: G1's pan up over the fallen party
  if (own) await settled(ctx, own.call(ctx.deps.actionMotion, motionCtx(ctx)), MOMENT_GUARD_MS);
}

/**
 * Before a command menu opens: if the shot is anywhere but `idle`, bring it
 * back (and let go of any held push) so the player chooses with the whole
 * field in frame.
 *
 * PR-0094: at the seam into chapter 5's link 5, `shuyin-appears` ends on
 * `camera('action')`, and Shuyin's first turn raises the Terror of Zanarkand
 * telegraph (held zoom on the `enemy` rig) and starts its cast; FFX-2's ATB
 * then opens Yuna's menu mid-cast, so the menu sat on a Shuyin close-up with
 * Yuna and Rikku off-frame and Paine cut at the edge. The telegraph's vignette
 * and the HUD's banner stay up; only the framing returns. Presenter plumbing,
 * so **both games** (CHK-020); FFX's CTB rarely opens a menu off `idle`, since
 * every action's close already returns there.
 */
export async function settleForMenu(ctx: EventCtx): Promise<void> {
  const idle = ctx.moments.pick('idle');
  if (!idle || ctx.stage.camera.rigName === idle) return;
  const ms = MOMENT_TIMING.returnOut;
  await Promise.all([ctx.stage.camera.release?.(ctx.moments.ms(ms)), ctx.moments.moveToRig(idle, ms)]);
}
