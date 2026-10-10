/**
 * **Chapter I: what Seymour Flux and the Mortiorchis answer a hit with** (m142 `onHit`, m143 `onHit`;
 * `research/re-ffx-ai-seymour.md` section 2.5). **Game case: FFX only** [AGENTS.md rule 14].
 *
 * Both hooks run once per action per target, after the last of that action's hit records on the target,
 * whoever acted: the party, Flux's own Flare, a spell bounced off a Reflect, the mount's own drain
 * (D-07). A Poison tick never reaches them: Flux has no `postPoison` hook, so Poison carrying him past a
 * line changes nothing until the next real hit (D-130 stays true).
 *
 * | Flux, in order | |
 * |---|---|
 * | HP is 0 | stop |
 * | HP below the Protect line (52,500, strictly) and it has not fired | forced Protect on himself if he has none; the line := 0 (**one shot**: a later Dispel is never answered, D-04); phase := 1 |
 * | HP below the Reflect line (35,000) and it has not fired | forced Reflect if he has none; the line := 0; phase := 2; `s` := 1; the second cycle begins (its first notice) |
 *
 * Both rows can fire in one event. The commands are Flux's own and **forced** (queued whatever his state).
 */

import type { FFXCombatant } from '../../common/types.ts';
import { type Ctx, has, tryActor } from '../state.ts';
import { type ScriptHooks, type UsedCommand, queueReaction, registerScriptHooks } from './hooks.ts';
import { reviveMount } from './mount-revive.ts';
import {
  DELAY_COMMAND_IDS,
  DELAY_FLAG,
  FLUX_ID,
  MORTIORCHIS_FIRST_REVIVE_HP,
  PHASE,
  PROTECT_LINE,
  REFLECT_LINE,
  REVIVE_HP,
  announceCharge,
  fluxFrontline,
  fluxLine,
  fluxOnCommand150,
  fluxPhaseNumber,
  mountOf,
  setFluxCycle,
} from './seymour-flux-rules.ts';

function onFluxHit(ctx: Ctx, flux: FFXCombatant, used: UsedCommand): void {
  if (flux.hp <= 0) return;
  const protectLine = fluxLine(ctx, flux, 'protect');
  if (protectLine !== 0 && flux.hp < protectLine) {
    if (!has(flux, 'protect')) {
      queueReaction(ctx, flux.id, { kind: 'ability', id: 'protect', targets: [flux.id] }, { forced: true, byId: used.user.id });
    }
    ctx.state.flags[PROTECT_LINE] = 0;
    if (fluxPhaseNumber(ctx) < 1) ctx.state.flags[PHASE] = 1;
  }
  const reflectLine = fluxLine(ctx, flux, 'reflect');
  if (reflectLine !== 0 && flux.hp < reflectLine) {
    if (!has(flux, 'reflect')) {
      queueReaction(ctx, flux.id, { kind: 'ability', id: 'reflect', targets: [flux.id] }, { forced: true, byId: used.user.id });
    }
    ctx.state.flags[REFLECT_LINE] = 0;
    ctx.state.flags[PHASE] = 2;
    setFluxCycle(ctx, 1);
    const mount = mountOf(ctx);
    if (mount) announceCharge(ctx, mount, 'Auto-Attack Mode'); // the first Total Annihilation notice, at the phase change
  }
}

function onMountHit(ctx: Ctx, mount: FFXCombatant, used: UsedCommand): void {
  if (mount.hp <= 0) {
    reviveMount(ctx, mount, FLUX_ID, REVIVE_HP, MORTIORCHIS_FIRST_REVIVE_HP, used.user.id);
    return;
  }
  // Hit by Delay Attack or Delay Buster (and only those): the mount queues Command 150 on Flux, whose
  // armed flag makes him answer with a forced Slowga on the front line (D-05). Evaluated in place.
  if (DELAY_COMMAND_IDS.includes(used.def.id)) {
    ctx.state.flags[DELAY_FLAG] = 255;
    if (fluxOnCommand150(ctx).kind !== 'slowga' || !tryActor(ctx, FLUX_ID)) return;
    queueReaction(ctx, FLUX_ID, { kind: 'ability', id: 'slowga-counter', targets: fluxFrontline(ctx).map((c) => c.id) }, {
      forced: true,
      byId: used.user.id,
    });
  }
}

registerScriptHooks(FLUX_ID, { onHit: (ctx, self, used) => onFluxHit(ctx, self, used) } satisfies ScriptHooks);
registerScriptHooks('mortiorchis', {
  holdsDeath: true,
  onHit: (ctx, self, used) => onMountHit(ctx, self, used),
} satisfies ScriptHooks);
