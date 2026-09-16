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
import {
  ELEMENT_SFX,
  SFX_FALLBACKS,
  type DamageNumbersPort,
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
  /** Set while the camera is parked on the action rig. */
  onActionRig: boolean;
}

export function createEventCtx(deps: PresenterDeps, sleep: (ms: number) => Promise<void>): EventCtx {
  return { stage: deps.stage, deps, sleep, actingId: null, onActionRig: false };
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
      await a?.fadeTo(0, TIMING.dismiss);
      ctx.stage.removeCombatant(event.combatantId);
      return;
    }

    case 'switch': {
      const out = ctx.stage.actor(event.outId);
      await out?.fadeTo(0, TIMING.switchOut);
      ctx.stage.removeCombatant(event.outId);
      const to = ctx.stage.actor(event.inId);
      to?.setAlpha(0);
      await to?.fadeTo(1, TIMING.switchOut);
      return;
    }

    case 'form-change':
      return formChange(ctx, event);

    case 'counter': {
      const a = ctx.stage.actor(event.actorId);
      a?.setPose('attack');
      await a?.lunge(0.6, 280);
      a?.setPose('idle');
      return;
    }

    case 'charge':
      return charge(ctx, event);

    case 'part-destroyed': {
      const a = ctx.stage.actor(event.partId);
      await a?.dissolveTo(1, TIMING.ko, 0x9dffc4);
      ctx.stage.removeCombatant(event.partId);
      ctx.stage.camera.shake(0.12, 320);
      return;
    }

    case 'part-restored': {
      const a = ctx.stage.actor(event.partId);
      a?.setDissolve(0);
      a?.setAlpha(0);
      await a?.fadeTo(1, TIMING.revive);
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

    case 'camera':
      ctx.onActionRig = event.rig !== 'idle';
      await ctx.stage.camera.moveTo(event.rig, event.ms ?? 700);
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
