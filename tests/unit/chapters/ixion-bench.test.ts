/**
 * Ixion at Djose (FFX-2; our Chapter XVII, registered unlisted): the human-pace bench. **FFX-2 only**
 * [AGENTS.md rule 14]. Measure, never tune: no boss number moves here (rule 6); a result goes to Bailey.
 *
 * The model is the one the Chapter XI and XIII benches use: bench speed is zero decision time; human speed is
 * the live default, **Wait split**, 1.5 s a menu (0.5 s on the top-level list with the clock running, 1.0 s
 * inside a submenu, held). 200 seeds a row. Lines (`../helpers/ixionDrive.ts`): **sensible** (the guides'
 * clear, answering the Recharge tell) and **naive** (no Shell, no Protect, the tell ignored).
 *
 * The chapter is built with action time **off** (`DJOSE_ACTION_TIME_ON`, Bailey's pick); the "ON" rows are
 * the same fight with the switch's 3 s, the length Chapters XI and XIII ship. The table is copied into
 * `docs/plans/ixion-bench.md`.
 */

import { describe, expect, it } from 'vitest';
import type { FFX2PartyBuild } from '../../../src/battle/common/types.ts';
import { djoseBuild } from '../../../src/data/ffx2/builds/djose.ts';
import { DJOSE_ACTION_TIME_ON, DJOSE_ACTION_TIME_SECONDS, djoseIxionGroup } from '../../../src/data/ffx2/enemies/ixion-djose.ts';
import { driveIxion, type IxionDriveOptions, type IxionLine, type IxionRun } from '../helpers/ixionDrive.ts';

const SEEDS = 200;
const HUMAN: IxionDriveOptions = { decisionMs: 1500, topMs: 500, engine: { atbMode: 'wait', waitSplit: true } };
const BENCH: IxionDriveOptions = {};
/** The switch's length laid on as an engine option (the same ticks the formation field would give). */
const on = (o: IxionDriveOptions): IxionDriveOptions => ({ ...o, engine: { ...o.engine, actionTimeSeconds: DJOSE_ACTION_TIME_SECONDS } });
const rows: string[] = [];

interface Tally {
  wins: number; seeds: number; unfinished: number; minutes: number; ixionTurns: number; partyTurns: number;
  hammers: number; fightsWithHammer: number; hammerKos: number; lossesAfterHammer: number;
}

function measure(line: IxionLine, opts: IxionDriveOptions, seeds = SEEDS): Tally {
  const t: Tally = { wins: 0, seeds, unfinished: 0, minutes: 0, ixionTurns: 0, partyTurns: 0, hammers: 0, fightsWithHammer: 0, hammerKos: 0, lossesAfterHammer: 0 };
  for (let seed = 1; seed <= seeds; seed++) {
    const r: IxionRun = driveIxion(line, seed, opts);
    t.minutes += r.ticks / 3000 / 60;
    t.ixionTurns += r.ixionTurns;
    t.partyTurns += r.partyTurns;
    t.hammers += r.hammers;
    t.hammerKos += r.hammerKos;
    if (r.hammers > 0) t.fightsWithHammer += 1;
    if (r.outcome === 'victory') t.wins += 1;
    else if (r.outcome === undefined) t.unfinished += 1;
    else {
      // A loss "after the Hammer": Ixion's last action before the wipe was Thor's Hammer.
      const last = [...r.log].reverse().find((e) => e.type === 'action-start' && (e as { actorId: string }).actorId === 'x2-ixion') as { abilityId?: string } | undefined;
      if (last?.abilityId === 'x2-ixion-thors-hammer') t.lossesAfterHammer += 1;
    }
  }
  return t;
}

const avg = (n: number, t: Tally): string => (n / t.seeds).toFixed(2);

function row(line: string, mode: string, t: Tally): void {
  rows.push(
    `| ${line} | ${mode} | ${t.wins}/${t.seeds} | ${((100 * t.wins) / t.seeds).toFixed(1)} % | ${avg(t.minutes, t)} | ${avg(t.ixionTurns, t)} | ` +
      `${avg(t.partyTurns, t)} | ${avg(t.hammers, t)} | ${t.fightsWithHammer}/${t.seeds} | ${t.hammerKos} | ${t.seeds - t.wins - t.unfinished} (${t.lossesAfterHammer}) |`,
  );
}

const withLevels = (lv: [number, number, number]): FFX2PartyBuild => ({
  ...djoseBuild,
  members: djoseBuild.members.map((m, i) => ({ ...m, level: lv[i]! })) as FFX2PartyBuild['members'],
});

describe('Ixion at Djose: 200 seeds, sensible and naive, bench and human pace (Wait split)', () => {
  const tallies = new Map<string, Tally>();

  it('the chapter is built with action time off (the switch is Bailey\'s)', () => {
    expect(DJOSE_ACTION_TIME_ON).toBe(false);
    expect(djoseIxionGroup.actionTimeSeconds).toBeUndefined();
  });

  for (const [label, wrap] of [['action time OFF (as built)', (o: IxionDriveOptions) => o], [`action time ON, ${DJOSE_ACTION_TIME_SECONDS} s (the switch)`, on]] as const) {
    for (const line of ['sensible', 'naive'] as const) {
      it(`${line}, ${label}: bench and human`, () => {
        const b = measure(line, wrap(BENCH));
        const h = measure(line, wrap(HUMAN));
        tallies.set(`${line}|${label}|bench`, b);
        tallies.set(`${line}|${label}|human`, h);
        row(`**${line}**, ${label}`, 'bench, D=0', b);
        row(`**${line}**, ${label}`, 'human, Wait split', h);
        expect(b.unfinished + h.unfinished).toBe(0);
      }, 900_000);
    }
  }

  it('measured options at human pace, the switch off and on (none is built; each is one flag or preset away)', () => {
    const options: Array<[string, IxionLine, IxionDriveOptions]> = [
      ['F-8 other reading: 2/3 : 1/3 (wiki)', 'sensible', { ...HUMAN, flags: { ixionThundaraSplit: 'wiki' } }],
      ['Q4 / FA8 b: landed damage only feeds the counter', 'sensible', { ...HUMAN, flags: { fallenAeonsAcTrigger: 'damaged' } }],
      ['preset at the band\'s floor, Lv 30 / 30 / 30', 'sensible', { ...HUMAN, build: withLevels([30, 30, 30]) }],
      ['preset at the band\'s top, Lv 36 / 36 / 36', 'sensible', { ...HUMAN, build: withLevels([36, 36, 36]) }],
      ['action time 1.5 s', 'sensible', { ...HUMAN, engine: { ...HUMAN.engine, actionTimeSeconds: 1.5 } }],
      ['action time 1.5 s', 'naive', { ...HUMAN, engine: { ...HUMAN.engine, actionTimeSeconds: 1.5 } }],
    ];
    for (const [name, line, o] of options) {
      const off = measure(line, o);
      row(`${line}; OPTION ${name}`, 'human, Wait split, switch OFF', off);
      expect(off.unfinished).toBe(0);
      if (name.startsWith('action time')) continue;
      const withOn = measure(line, on(o));
      row(`${line}; OPTION ${name}`, 'human, Wait split, switch ON', withOn);
      expect(withOn.unfinished).toBe(0);
    }
  }, 1_800_000);

  it('the switch ON separates the lines: sensible wins more often than naive at human pace', () => {
    const label = `action time ON, ${DJOSE_ACTION_TIME_SECONDS} s (the switch)`;
    expect(tallies.get(`sensible|${label}|human`)!.wins).toBeGreaterThan(tallies.get(`naive|${label}|human`)!.wins);
  });

  it('prints the table', () => {
    console.log([
      '| Line | Mode | Wins | Rate | Avg min | Ixion turns | Party turns | Hammers / fight | Fights with a Hammer | Hammers that KO\'d | Losses (after a Hammer) |',
      '|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---|',
      ...rows,
    ].join('\n'));
  });
});
