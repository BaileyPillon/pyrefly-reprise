/**
 * Spherimorph against a REAL Doublecast (FFX only; the review of 2026-11-06, m3): Lulu with Doublecast learned casts a pair through the engine's own `resolveDoublecast` (`src/battle/ffx/doublecast.ts`), with no flag set by
 * hand, and the script's gate (`sm.doublecast`, read from the one additive runtime field `FFXRuntime.doublecasting`) does what `research/re-ffx-spherimorph.md` section 4.3 says: **the first spell of a pair is ignored (no
 * answer, no shift), the second is handled normally**. The cases are the four orders of a weakness hit and an absorbed spell, and a same-spell pair; each reads the battle's own log. The flag is down again once the pair
 * has resolved, and before any Doublecast it is not set at all.
 */

import { describe, expect, it } from 'vitest';

import type { Command, FFXPartyBuild } from '../../../src/battle/common/types.ts';
import { buildWith } from '../helpers/spherimorphBot.ts';
import { SM, actionList, actor, ctxOf, flags, inputFor, log, newEngine, nextInput, setState } from '../helpers/spherimorphDrive.ts';

/** The shipped party with Doublecast learned by Lulu (the preset does not have it: the review asked for a real pair, so it is added for this file only). */
function withDoublecast(): FFXPartyBuild {
  const base = buildWith(['tidus', 'yuna', 'lulu']);
  return { ...base, members: base.members.map((m) => (m.id === 'lulu' ? { ...m, learnedAbilityIds: [...m.learnedAbilityIds, 'doublecast'] } : m)) };
}

interface Result {
  readonly actions: string[];
  readonly shifts: number;
  readonly flagAfter: boolean | undefined;
}

/** Lulu's Doublecast `pair` (a weakness of Fire is drawn) from a fresh fight, run to the next input; what the log says happened. */
function cast(pair: Partial<Command> & Record<string, unknown>, seed = 5): Result {
  const engine = newEngine(seed, withDoublecast());
  setState(engine, 0); // weak to Fire
  const d = inputFor(engine, 'lulu', 60, true);
  setState(engine, 0);
  const row = d.commands.find((r) => r.enabled && r.command.kind === 'ability' && (r.command as { id?: string }).id === 'doublecast');
  expect(row, 'the Doublecast row is on the menu once it is learned').toBeDefined();
  const lulu = actor(engine, 'lulu');
  lulu.mp = lulu.stats.maxMp;
  const before = log(engine).length;
  engine.submit({ kind: 'ability', id: 'doublecast', targets: [SM], ...pair } as unknown as Command);
  nextInput(engine, true);
  return { actions: actionList(log(engine).slice(before)), shifts: Number(flags(engine)['sm.shifts'] ?? 0), flagAfter: ctxOf(engine).rt.doublecasting };
}

describe('the Doublecast gate on the engine\'s own pair (Lulu, a weakness to Fire drawn)', () => {
  it('before any Doublecast the field is not set at all', () => {
    const engine = newEngine(3, withDoublecast());
    expect(ctxOf(engine).rt.doublecasting).toBeUndefined();
    nextInput(engine, true);
    expect(ctxOf(engine).rt.doublecasting).toBeUndefined();
  });

  it('Fire twice (a weakness hit twice): the first is ignored, the second shifts it: ONE Elemental Shift and no answer', () => {
    const r = cast({ wrappedId: 'fire' });
    expect(r.actions).toEqual(['lulu:fire', 'spherimorph:spherimorph-elemental-shift']);
    expect(r.shifts).toBe(1);
    expect(r.flagAfter).toBe(false);
  });

  it('Fira twice (the same, at the highest tier): one shift', () => {
    const r = cast({ wrappedId: 'fira' });
    expect(r.actions).toEqual(['lulu:fira', 'spherimorph:spherimorph-elemental-shift']);
    expect(r.shifts).toBe(1);
  });

  it('Blizzard twice (absorbed twice): the first is ignored, the second is answered: ONE reply on the front line, no shift', () => {
    const r = cast({ wrappedId: 'blizzard' });
    expect(r.actions).toEqual(['lulu:blizzard', 'spherimorph:spherimorph-blizzard']);
    expect(r.shifts).toBe(0);
    expect(r.flagAfter).toBe(false);
  });

  it('Fire then Blizzard (the weakness hit comes FIRST): it is the ignored one, so there is no shift, and the absorbed second is answered', () => {
    const r = cast({ casts: [{ id: 'fire', targets: [SM] }, { id: 'blizzard', targets: [SM] }] });
    expect(r.actions).toEqual(['lulu:fire', 'lulu:blizzard', 'spherimorph:spherimorph-blizzard']);
    expect(r.shifts).toBe(0);
  });

  it('Blizzard then Fire (the weakness hit comes SECOND): the absorbed first is ignored (no answer) and the second shifts it', () => {
    const r = cast({ casts: [{ id: 'blizzard', targets: [SM] }, { id: 'fire', targets: [SM] }] });
    expect(r.actions).toEqual(['lulu:blizzard', 'lulu:fire', 'spherimorph:spherimorph-elemental-shift']);
    expect(r.shifts).toBe(1);
  });

  it('a plain cast after a pair is handled as ever (the flag is down)', () => {
    const engine = newEngine(5, withDoublecast());
    setState(engine, 0);
    inputFor(engine, 'lulu', 60, true);
    setState(engine, 0);
    actor(engine, 'lulu').mp = actor(engine, 'lulu').stats.maxMp;
    engine.submit({ kind: 'ability', id: 'doublecast', targets: [SM], wrappedId: 'blizzard' } as unknown as Command);
    nextInput(engine, true);
    expect(ctxOf(engine).rt.doublecasting).toBe(false);
    setState(engine, 0);
    const next = inputFor(engine, 'lulu', 60, true);
    setState(engine, 0);
    const fire = next.commands.find((r) => r.enabled && r.command.kind === 'ability' && (r.command as { id?: string }).id === 'fire');
    expect(fire).toBeDefined();
    const before = log(engine).length;
    engine.submit({ ...fire!.command, targets: [SM] } as Command);
    nextInput(engine, true);
    expect(actionList(log(engine).slice(before))).toContain('spherimorph:spherimorph-elemental-shift');
  });
});
