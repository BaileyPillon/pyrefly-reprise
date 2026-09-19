/**
 * One animation per `BattleEvent`. The presenter's vocabulary of moves.
 *
 * Kept apart from `BattlePresenter.ts` so the loop stays readable and so the
 * house 400-line rule holds. Like the loop, this module imports no `three` and
 * no DOM — only the ports — so it runs under vitest against fakes.
 *
 * The timing table at the top is the single place to tune battle rhythm. A boss
 * that needs a different beat should emit `wait` / `camera` / `vfx` / `sfx`
 * pacing events from its data file rather than getting a special case here
 * (CONTRACTS.md, playback rule 4).
 */

import type { BattleEvent, CombatantId, ElementId, MessageKind } from '../battle/common/types.ts';
import { BattleMoments } from './BattleMoments.ts';
import {
  ELEMENT_SFX,
  SFX_FALLBACKS,
  type DamageNumbersPort,
  type PlaybackSpeed,
  type PresenterDeps,
  type BattleStage,
} from './BattlePresenterPorts.ts';
import {
  actionEnd,
  actionStart,
  charge,
  damage,
  defeat,
  formChange,
  ko,
  summon,
  turnStart,
  victory,
} from './BattlePresenterBeats.ts';

/** One numeral, minus the screen position the stage supplies. */
type Numeral = Omit<Parameters<DamageNumbersPort['show']>[0], 'x' | 'y'>;

/**
 * How long past its own stated length an actor animation may run before
 * playback stops waiting for it.
 *
 * **This is the fix for "Chapter 4 is won and then never ends"** (critic round
 * 02 #01). Measured live at `speed: 'skip'`: Bahamut at 0/8400, the engine's
 * own `result` already `victory`, turn 75, and the presenter parked at
 * `phase: "play:ko"` — inside `await actor.dissolveTo(...)` for the killing
 * blow, which never resolved, so the `victory` event after it never played and
 * the screen never finished.
 *
 * The root cause is one line below this layer: `TweenGroup.toAsync` resolves
 * from `Tween.onComplete`, and `Tween.kill()` (which `PaintedActor.dispose` ->
 * `tweens.killAll()` calls) sets `_killed` **without firing it**. Any actor
 * animation the presenter is awaiting when that actor's tweens are killed is
 * abandoned mid-await, forever. Fixing `Tween.kill()` to settle belongs to
 * whoever owns `src/engine/Tween.ts`; it is written up in
 * `docs/handoff/builda-flow.md`.
 *
 * What belongs *here* is that playback must drain whatever the stage does. A
 * beat that overruns costs a dropped animation; a beat that never returns costs
 * the chapter.
 */
export const ACTOR_ANIM_GRACE_MS = 2_000;

/**
 * Await an actor animation, but never forever.
 *
 * Resolves when the animation does, or `ms + ACTOR_ANIM_GRACE_MS` after it was
 * started, whichever comes first. The timer is the *presenter's* clock
 * (`ctx.sleep`), so it scales with the playback speed exactly as the animation
 * it is guarding is meant to.
 */
export async function settled(ctx: EventCtx, p: void | Promise<void>, ms: number): Promise<void> {
  if (!p || typeof (p as Promise<void>).then !== 'function') return;
  const overran = Symbol('overran');
  const startedAt = Date.now();
  const raced = await Promise.race([
    (p as Promise<void>).then(() => null),
    ctx.sleep(ms + ACTOR_ANIM_GRACE_MS).then(() => overran),
  ]);
  // At `speed: 'skip'` every wait collapses to zero, so the guard wins every
  // race by design and there is nothing to report — that run asked for no
  // animation at all. Only a guard that genuinely waited and still had to give
  // up is worth a line in the console.
  if (raced === overran && Date.now() - startedAt >= 50) {
    console.warn(`[presenter] an actor animation did not finish within ${ms + ACTOR_ANIM_GRACE_MS}ms; carrying on`);
  }
}

/** Every duration the presenter uses, in milliseconds at `timeScale` 1. */
export const TIMING = {
  turnStart: 90,
  actionStart: 380,
  windUp: 220,
  perHit: 190,
  hitStop: 85,
  damage: 240,
  heal: 320,
  miss: 260,
  status: 220,
  ko: 620,
  revive: 520,
  formChange: 950,
  summon: 1100,
  dismiss: 520,
  switchOut: 340,
  charge: 760,
  message: 850,
  victory: 900,
  defeat: 1100,
  settle: 200,
} as const;

/** Mutable state the handlers share across one battle. */
export interface EventCtx {
  readonly stage: BattleStage;
  readonly deps: PresenterDeps;
  sleep(ms: number): Promise<void>;
  /** Whoever is mid-action, so `action-end` can put them back to idle. */
  actingId: CombatantId | null;
  /**
   * Which shot the battle is on. Every `camera.moveTo` the beats used to make
   * by hand now goes through here — see `BattleMoments.ts` for why.
   */
  readonly moments: BattleMoments;
}

export function createEventCtx(
  deps: PresenterDeps,
  sleep: (ms: number) => Promise<void>,
  speed: () => PlaybackSpeed,
): EventCtx {
  const moments = new BattleMoments({
    stage: deps.stage,
    moments: deps.moments ?? null,
    audio: deps.audio ?? null,
    // Only the opening moment uses this, and only to keep the HUD down until
    // the boss reveal has finished — see `BattleMoments.battleStart`.
    hud: deps.hud ?? null,
    sleep,
    speed,
  });
  return { stage: deps.stage, deps, sleep, actingId: null, moments };
}

// --------------------------------------------------------------------- audio

export function cue(ctx: EventCtx, name: string, opts?: { volume?: number; delay?: number }): void {
  const audio = ctx.deps.audio;
  if (!audio) return;
  // Unknown keys fall back to a generic cue rather than going silent, so a
  // boss's bespoke `sfxKey` never has to exist before the fight is playable.
  const key = SFX_FALLBACKS[name] ?? name;
  try {
    audio.playSfx(key, opts);
  } catch {
    try {
      audio.playSfx(SFX_FALLBACKS['generic']!, opts);
    } catch {
      /* audio is optional; never break playback for a missing cue */
    }
  }
}

export function elementCue(element: ElementId | undefined, crit: boolean): string {
  if (element && element !== 'none' && ELEMENT_SFX[element]) return ELEMENT_SFX[element]!;
  return crit ? 'damage-crit' : 'damage';
}

// ------------------------------------------------------------------ numerals

export function numeral(ctx: EventCtx, id: CombatantId, n: Numeral): void {
  const dn = ctx.deps.damageNumbers;
  if (!dn) return;
  const at = ctx.stage.project(id);
  if (!at) return;
  dn.show({ ...n, x: at.x, y: at.y });
}

export async function banner(ctx: EventCtx, text: string, kind: MessageKind): Promise<void> {
  const bar = ctx.deps.messageBar;
  if (!bar) return;
  await bar.show(text, kind);
}

// ------------------------------------------------------------------ dispatch

/** Play one event. Resolves when its animation has settled. */
export async function playEvent(ctx: EventCtx, event: BattleEvent): Promise<void> {
  switch (event.type) {
    case 'turn-start':
      return turnStart(ctx, event.actorId);

    case 'action-start':
      return actionStart(ctx, event);

    case 'action-end':
      return actionEnd(ctx);

    case 'damage':
      return damage(ctx, event);

    case 'heal': {
      const a = ctx.stage.actor(event.targetId);
      a?.flash(0x9dffc4, 320, 0.6);
      numeral(ctx, event.targetId, { kind: 'heal', amount: event.amount });
      cue(ctx, 'heal', { volume: 0.7 });
      return ctx.sleep(TIMING.heal);
    }

    case 'miss':
      numeral(ctx, event.targetId, { kind: 'miss', text: reasonText(event.reason) });
      cue(ctx, 'miss', { volume: 0.5 });
      ctx.stage.actor(event.targetId)?.hop(0.18, 200);
      return ctx.sleep(TIMING.miss);

    case 'mp-damage':
      numeral(ctx, event.targetId, { kind: 'mp-damage', amount: event.amount });
      return ctx.sleep(TIMING.status);

    case 'mp-heal':
      numeral(ctx, event.targetId, { kind: 'mp-heal', amount: event.amount });
      return ctx.sleep(TIMING.status);

    case 'status-add': {
      ctx.stage.actor(event.targetId)?.flash(0xc9a6ff, 260, 0.5);
      cue(ctx, 'status', { volume: 0.5 });
      return ctx.sleep(TIMING.status);
    }

    case 'status-remove':
    case 'status-tick':
      return ctx.sleep(TIMING.status * 0.4);

    case 'ko':
      return ko(ctx, event.targetId);

    case 'revive': {
      const a = ctx.stage.actor(event.targetId);
      a?.setAlpha(1);
      a?.setDissolve(0);
      a?.setPose('idle');
      a?.flash(0xfff3c0, 520, 0.9);
      numeral(ctx, event.targetId, { kind: 'heal', amount: event.hp });
      cue(ctx, 'heal');
      return ctx.sleep(TIMING.revive);
    }

    case 'overdrive-gauge':
      if (event.to >= 100 && event.from < 100) cue(ctx, 'overdrive');
      return;

    case 'message':
      await banner(ctx, event.text, event.kind);
      return ctx.sleep(TIMING.message);

    case 'sensor':
      await banner(ctx, event.text, 'system');
      return ctx.sleep(TIMING.message);

    case 'summon':
      return summon(ctx, event.combatantId, event.aeonId);

    case 'dismiss': {
      const a = ctx.stage.actor(event.combatantId);
      await settled(ctx, a?.fadeTo(0, TIMING.dismiss), TIMING.dismiss);
      ctx.stage.removeCombatant(event.combatantId);
      return;
    }

    case 'switch': {
      // The member coming in has to be STAGED, not just looked up.
      //
      // `PaintedStage.stage()` only ever builds actors for the active three
      // (plus the aeon and the fiends) — a benched character is `removed` and
      // is deliberately not on the field. So `stage.actor(event.inId)` was
      // always `undefined` here, the fade-in was a no-op on nothing, and the
      // outgoing figure was removed with nobody put in its place: after any
      // Switch the field was one figure short and the character the player had
      // just swapped in did not exist. Verified live before the fix —
      // `activeIds` read `["auron","yuna","kimahri"]` while the field held
      // `["yuna","kimahri",...]`, and aiming a Potion at Auron drew a bracket
      // over empty ground.
      //
      // The incoming member takes the slot the outgoing one vacated, which is
      // what FFX's swap does: the arc keeps its shape.
      const slot = ctx.stage.slotOf?.(event.outId) ?? 0;
      const out = ctx.stage.actor(event.outId);
      await settled(ctx, out?.fadeTo(0, TIMING.switchOut), TIMING.switchOut);
      ctx.stage.removeCombatant(event.outId);

      let to = ctx.stage.actor(event.inId);
      if (!to) {
        // `artId` is the combatant id; the stage's own resolver tries the
        // mapped id, the sprite key and the raw id before any stand-in.
        to = await ctx.stage.addCombatant(event.inId, {
          artId: event.inId,
          side: 'party',
          slot,
        });
      }
      to?.setAlpha(0);
      await settled(ctx, to?.fadeTo(1, TIMING.switchOut), TIMING.switchOut);
      return;
    }

    case 'form-change':
      return formChange(ctx, event);

    case 'counter': {
      const a = ctx.stage.actor(event.actorId);
      a?.setPose('attack');
      await settled(ctx, a?.lunge(0.6, 280), 280);
      a?.setPose('idle');
      return;
    }

    case 'charge':
      return charge(ctx, event);

    case 'part-destroyed': {
      const a = ctx.stage.actor(event.partId);
      await settled(ctx, a?.dissolveTo(1, TIMING.ko, 0x9dffc4), TIMING.ko);
      ctx.stage.removeCombatant(event.partId);
      ctx.stage.camera.shake(0.12, 320);
      return;
    }

    case 'part-restored': {
      const a = ctx.stage.actor(event.partId);
      a?.setDissolve(0);
      a?.setAlpha(0);
      await settled(ctx, a?.fadeTo(1, TIMING.revive), TIMING.revive);
      return;
    }

    case 'escape-attempt':
      await banner(ctx, event.success ? 'Escaped' : "Can't escape!", 'system');
      return ctx.sleep(TIMING.message);

    case 'victory':
      return victory(ctx);

    case 'defeat':
      return defeat(ctx);

    case 'chain':
      return;

    case 'atb':
      return;

    case 'spherechange': {
      const a = ctx.stage.actor(event.who);
      a?.flash(0xffffff, 420, 1);
      ctx.stage.vfx.screenFlash('#ffffff', 180);
      await ctx.stage.setArt(event.who, `${event.who}-${event.to}`);
      cue(ctx, 'summon', { volume: 0.6 });
      return ctx.sleep(TIMING.status);
    }

    // An explicit `camera` event from a boss's data file overrides the moment
    // the beats would have picked (CONTRACTS.md playback rule 4), so it goes
    // straight to the port — but it still has to obey the playback speed, or a
    // `'skip'` run sits on a 700 ms tween per event.
    case 'camera':
      await ctx.moments.moveToRig(event.rig, event.ms ?? 700);
      return;

    case 'vfx':
      return ctx.stage.vfx.play(event.key, event.at);

    case 'sfx':
      cue(ctx, event.key);
      return;

    case 'wait':
      return ctx.sleep(event.ms);

    // `minigame-request` and `script-trigger` are handled by the loop itself.
    case 'minigame-request':
    case 'script-trigger':
      return;
  }
}

// -------------------------------------------------------------------- helpers

/** Which painted pose a command puts its actor into. */
export function poseForCommand(kind: string): string {
  switch (kind) {
    case 'attack':
    case 'overdrive':
      return 'attack';
    case 'ability':
    case 'summon':
    case 'spherechange':
      return 'cast';
    case 'item':
      return 'item';
    case 'defend':
      return 'defend';
    default:
      return 'ready';
  }
}

function reasonText(reason: 'evaded' | 'nullified' | 'immune' | 'wrong-state'): string {
  switch (reason) {
    case 'nullified':
      return 'NULLIFIED';
    case 'immune':
      return 'IMMUNE';
    case 'wrong-state':
      return 'NO EFFECT';
    default:
      return 'MISS';
  }
}
