/**
 * Site B's readouts (`learn/studio/readout.ts`): the strings the studio stage
 * prints.
 *
 * Every expectation is derived from a real `runExampleTurn` trace rather than
 * typed as a literal, so a change in the engine shows up here as a failing
 * relationship, not as a stale number nobody rechecks (AGENTS.md hard rule 3).
 */

import { describe, expect, it } from 'vitest';
import {
  actorNextTick,
  baseTicks,
  bossIntent,
  commandBanner,
  commandNote,
  damageAmount,
  elementChip,
  hitChips,
  overdriveBar,
  statusChip,
  stepLive,
  turnRowsAfter,
  turnRowsBefore,
} from '../../learn/studio/readout.ts';
import { runExampleTurn } from '../../learn/studio/trace.ts';
import { STUDIO_COMPONENTS } from '../../learn/studio/rules.ts';

const trace = runExampleTurn({ seed: 1 });

describe('the turn list', () => {
  it('names every row and marks only the actor that is up', () => {
    const rows = turnRowsBefore(trace, 5);
    expect(rows).toHaveLength(5);
    expect(rows.every((row) => row.name.length > 0)).toBe(true);
    expect(rows.filter((row) => row.now)).toHaveLength(1);
    expect(rows[0]?.actorId).toBe(trace.actorId);
  });

  it("reads the ticks straight off the trace, in the trace's own order", () => {
    const step = trace.steps.find((s) => s.component === 'turn');
    if (step === undefined || step.component !== 'turn') throw new Error('no turn step');
    expect(turnRowsBefore(trace, 5).map((r) => r.tick)).toEqual(step.before.slice(0, 5).map((e) => e.tick));
    expect(turnRowsAfter(trace, 8).map((r) => r.tick)).toEqual(step.after.slice(0, 8).map((e) => e.tick));
  });

  it('only ever points a face at art this project actually has', () => {
    for (const row of [...turnRowsBefore(trace, 8), ...turnRowsAfter(trace, 8)]) {
      if (row.art === undefined) continue;
      expect(row.art).toMatch(/^(portraits|characters)\//);
      expect(row.art.endsWith('.png')).toBe(true);
    }
  });
});

describe('base ticks, derived from the engine and never invented', () => {
  it("is the actor's own next counter divided by the command's rank", () => {
    const next = actorNextTick(trace);
    const command = trace.steps.find((s) => s.component === 'command');
    if (command === undefined || command.component !== 'command') throw new Error('no command step');
    expect(next).not.toBeNull();
    expect(baseTicks(trace)).toBe((next ?? 0) / command.rank);
  });

  it('follows a real Agility change, in the direction the rule says', () => {
    const faster = runExampleTurn({ seed: 1, agility: 44 });
    const slow = baseTicks(trace);
    const fast = baseTicks(faster);
    expect(slow).not.toBeNull();
    expect(fast).not.toBeNull();
    expect(fast ?? 0).toBeLessThan(slow ?? 0);
  });
});

describe('the pinned readouts', () => {
  it('names the command and its rank', () => {
    const banner = commandBanner(trace);
    expect(banner.label).toBe(trace.commandLabel);
    expect(banner.rank).toMatch(/^Rank \d+$/);
    expect(commandNote(trace)).toContain(String(actorNextTick(trace)));
  });

  it('prints the engine\'s own damage, hit and critical numbers', () => {
    const damage = trace.steps.find((s) => s.component === 'damage');
    if (damage === undefined || damage.component !== 'damage') throw new Error('no damage step');
    expect(damageAmount(trace)).toBe(damage.amount);
    const hit = trace.steps.find((s) => s.component === 'hit');
    if (hit === undefined || hit.component !== 'hit') throw new Error('no hit step');
    expect(hitChips(trace)[0]?.value).toBe(hit.hitPercent === null ? 'never misses' : `${hit.hitPercent}%`);
    expect(hitChips(trace)[1]?.value).toBe(`${hit.critPercent}%`);
  });

  it('turns the affinity into its sourced multiplier', () => {
    expect(elementChip(trace).value).toBe('×1.0');
    expect(elementChip(trace).label).toBe('No element');
  });

  it('says so plainly when the command carries no status', () => {
    expect(statusChip(trace).label).toBe('No status applied');
  });

  it('reads the gauge and the queued move off the trace', () => {
    const od = trace.steps.find((s) => s.component === 'overdrive');
    if (od === undefined || od.component !== 'overdrive') throw new Error('no overdrive step');
    expect(overdriveBar(trace)).toMatchObject({ before: od.before, after: od.after, mode: od.mode });
    const boss = trace.steps.find((s) => s.component === 'boss');
    if (boss === undefined || boss.component !== 'boss') throw new Error('no boss step');
    expect(bossIntent(trace).move).toBe(boss.moveName);
  });
});

describe('every step card has a live line', () => {
  it('fills all eight, with no empty value', () => {
    for (const component of STUDIO_COMPONENTS) {
      const live = stepLive(component.id, trace);
      expect(live.value.length).toBeGreaterThan(0);
    }
  });

  it('changes the turn-order line when the Agility changes', () => {
    const faster = runExampleTurn({ seed: 1, agility: 44 });
    expect(stepLive('turn', faster).value).not.toBe(stepLive('turn', trace).value);
  });
});
