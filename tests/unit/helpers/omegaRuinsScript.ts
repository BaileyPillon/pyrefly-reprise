/**
 * Test helpers for the Weapons' scripts (FFX only; the hidden Omega Ruins chapter): force the script stream's draws, play one turn of a script from a state and read the command it returns, summon an aeon through the real command.
 * Test-only.
 */

import { expect } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { aiContextFor } from '../../../src/battle/ffx/ai/types.ts';
import { FfxStream } from '../../../src/battle/ffx/adapt/streams.ts';
import type { ultimaWeaponTurn } from '../../../src/battle/ffx/ai/ultima-weapon.ts';
import * as H from './omegaRuinsDrive.ts';

export type Engine = ReturnType<typeof H.newEngine>;


/** Force the script stream's draws: each `GetRandomValue()` takes the next value of the queue (a draw with the queue empty throws, so a rule that must draw nothing is pinned). Returns how many were taken. */
export function forceDraws(engine: Engine, values: number[]): { taken: () => number } {
  const ctx = H.ctxOf(engine);
  const real = ctx.rng.on.bind(ctx.rng);
  let taken = 0;
  ctx.rng.on = ((stream: number) => {
    if (stream !== FfxStream.Script) return real(stream);
    return { int: () => { if (taken >= values.length) throw new Error('an unexpected script draw'); return values[taken++] as number; } } as unknown as ReturnType<typeof real>;
  }) as typeof ctx.rng.on;
  return { taken: () => taken };
}

/** The command the script returns for one turn from a state, as `[ability id, targets]`. */
export function turn(engine: Engine, script: typeof ultimaWeaponTurn, draws: number[] = []): [string, string[]] | null {
  const ctx = H.ctxOf(engine);
  const foe = H.foeOf(engine);
  const force = forceDraws(engine, draws);
  const cmd = script(aiContextFor(ctx, foe)) as Command | null;
  expect(force.taken(), 'the draws the turn took').toBeLessThanOrEqual(draws.length);
  if (cmd === null) return null;
  return [cmd.kind === 'ability' ? cmd.id : cmd.kind, [...cmd.targets]];
}

export const FRONT = ['tidus', 'yuna', 'lulu'];

/** Summon `label` through the real command so an aeon is out. */
export function summon(engine: Engine, id: string): void {
  const d = H.inputFor(engine, 'yuna');
  const row = d.commands.find((c) => c.enabled && c.command.kind === 'summon' && 'id' in c.command && c.command.id === id);
  expect(row, `${id} summon row`).toBeDefined();
  engine.submit({ ...row!.command, targets: [] } as Command);
}

