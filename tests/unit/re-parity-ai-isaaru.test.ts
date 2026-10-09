/**
 * **Isaaru's three aeons follow their own scripts** (re-parity, AI lane C; FFX only; Chapter XIV, the Via Purifico).
 *
 * The decision tables are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 4 (m284 Grothia, m254 Pterya, m287 Spathi in
 * `bvyt09_10` to `_12`, run in the note's interpreter for every branch); the engine rules are sections 1.1 (`onHit` once per
 * action per target; what a hook queues is filtered), 1.5 (the random sources: `findMatchingChr` draws only with two or more
 * candidates, `GetRandomValue() mod 3` splits 21,846 / 21,845 / 21,845) and 1.6 (the opening). Rows of section 8:
 *
 *   D-14 the opening: the aeon's CTB is 0 and each party counter is one tick later
 *   D-15 with no aeon out Grothia (+5) and Pterya (+10) still fill their gauges on every attack at Yuna, and attack her
 *        whatever the gauge reads
 *   D-16 the Attack against Fira / Sonic Wings is `mod 3`: the special on 21,846 of 65,536 (33.334 %), the Attack on 43,690
 *   D-17 every aeon's first turn is a Summon aimed at Isaaru (Spathi's first Mega Flare is on his 7th turn)
 *   D-18 the loss is "no recruited aeon but the mirror has HP above 0": already the engine's outcome (`isaaru-duel.test.ts`)
 *   4.6  the gain when hit: Grothia +3, Pterya +15, while they can counter and the hit is not a reaction; Spathi has none
 */

import { describe, expect, it } from 'vitest';
import type { Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { summonAeon } from '../../src/battle/ffx/aeons.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { viaPurificoBuild } from '../../src/data/ffx/builds/via-purifico.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);

type Fight = LiveBattle & { boss: FFXCombatant; rng: ScriptedRng };

function fight(group: string, bossId: string): Fight {
  const live = liveBattle(group, { party: viaPurificoBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, boss: live.at(bossId), rng };
}

/** Past the Summon turn, optionally with one of Yuna's aeons on the field. */
function turns(group: string, bossId: string, options: { aeon?: string; gauge?: number } = {}): Fight {
  const t = fight(group, bossId);
  chooseAiCommand(t.ctx, t.boss);
  if (options.aeon !== undefined) summonAeon(t.ctx, 'yuna', options.aeon);
  if (options.gauge !== undefined) t.boss.overdrive!.gauge = options.gauge;
  t.rng.calls.length = 0;
  return t;
}

const gauge = (t: Fight): number => t.boss.overdrive!.gauge;

describe('the first turn (D-17; row 1 of each script)', () => {
  it('is a Summon aimed at Isaaru for all three aeons, with no draw and no gauge change', () => {
    for (const [group, boss, summon, start] of [
      ['isaaru-grothia', 'grothia', 'grothia-summon', 100],
      ['isaaru-pterya', 'pterya', 'pterya-summon', 0],
    ] as const) {
      const t = fight(group, boss);
      const first = chooseAiCommand(t.ctx, t.boss)!;
      expect([idOf(first), [...first.targets], gauge(t)], boss).toEqual([summon, ['isaaru'], start]);
      expect(t.rng.calls).toEqual([]);
    }
    const spathi = fight('isaaru-spathi', 'spathi');
    const first = chooseAiCommand(spathi.ctx, spathi.boss)!;
    expect([idOf(first), [...first.targets], spathi.ctx.state.flags['isaaru.count']]).toEqual(['spathi-summon', ['isaaru'], 5]);
  });

  it('opens with the aeon at CTB 0 and every party counter one tick later (D-14)', () => {
    for (const [group, boss] of [['isaaru-grothia', 'grothia'], ['isaaru-pterya', 'pterya'], ['isaaru-spathi', 'spathi']] as const) {
      const t = fight(group, boss);
      expect(rtOf(t.ctx, boss).ctb, boss).toBe(0);
      expect(rtOf(t.ctx, 'yuna').ctb, `${boss}: Yuna`).toBeGreaterThanOrEqual(1);
    }
  });
});

describe('Grothia’s turn (m284 f2 @0x271; rows 2 to 4)', () => {
  it('casts Hellfire on the front line at 100 with an aeon out, spends the gauge, and takes nothing for it', () => {
    const t = turns('isaaru-grothia', 'grothia', { aeon: 'shiva', gauge: 100 });
    const hellfire = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(hellfire), gauge(t)]).toEqual(['grothia-hellfire', 0]);
    expect(t.rng.calls, 'no pick, no roll').toEqual([]);
  });

  it('otherwise picks a living member (no draw: the aeon stands alone), then `mod 3`: Fira on 21,846 of 65,536, else Attack (D-16); +5', () => {
    const t = turns('isaaru-grothia', 'grothia', { aeon: 'shiva', gauge: 20 });
    const counts = new Map<string, number>();
    for (let v = 0; v <= 0xffff; v++) {
      t.boss.overdrive!.gauge = 20;
      t.rng.set(v);
      const move = chooseAiCommand(t.ctx, t.boss)!;
      counts.set(idOf(move), (counts.get(idOf(move)) ?? 0) + 1);
      expect(gauge(t)).toBe(25);
    }
    expect(Object.fromEntries(counts)).toEqual({ 'grothia-fira': 21_846, 'grothia-attack': 43_690 });
  });

  it('with Yuna alone he attacks her whatever the gauge reads, and the attack still fills the gauge (D-15, capped at 100)', () => {
    const t = turns('isaaru-grothia', 'grothia', { gauge: 100 });
    const attack = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(attack), [...attack.targets], gauge(t)], 'a full gauge does not call Hellfire without an aeon').toEqual(['grothia-attack-yuna', ['yuna'], 100]);
    t.boss.overdrive!.gauge = 40;
    chooseAiCommand(t.ctx, t.boss);
    expect(gauge(t)).toBe(45);
    expect(t.rng.calls, 'one candidate: no pick, and no `mod 3` on the Yuna branch').toEqual([]);
  });
});

describe('Pterya’s turn (m254 f2 @0x1D7; rows 2 to 4)', () => {
  it('casts Energy Ray at 100 with an aeon out, spends the gauge; otherwise Sonic Wings on 21,846 of 65,536 (D-16), +10', () => {
    const full = turns('isaaru-pterya', 'pterya', { aeon: 'ixion', gauge: 100 });
    expect([idOf(chooseAiCommand(full.ctx, full.boss)), gauge(full)]).toEqual(['pterya-energy-ray', 0]);
    const t = turns('isaaru-pterya', 'pterya', { aeon: 'ixion', gauge: 30 });
    const counts = new Map<string, number>();
    for (let v = 0; v <= 0xffff; v++) {
      t.boss.overdrive!.gauge = 30;
      t.rng.set(v);
      const move = idOf(chooseAiCommand(t.ctx, t.boss));
      counts.set(move, (counts.get(move) ?? 0) + 1);
      expect(gauge(t)).toBe(40);
    }
    expect(Object.fromEntries(counts)).toEqual({ 'pterya-sonic-wings': 21_846, 'pterya-attack': 43_690 });
  });

  it('attacks Yuna herself whatever the gauge reads when no aeon is out, +10 (D-15)', () => {
    const t = turns('isaaru-pterya', 'pterya', { gauge: 100 });
    const attack = chooseAiCommand(t.ctx, t.boss)!;
    expect([idOf(attack), [...attack.targets], gauge(t)]).toEqual(['pterya-attack-yuna', ['yuna'], 100]);
    t.boss.overdrive!.gauge = 5;
    chooseAiCommand(t.ctx, t.boss);
    expect(gauge(t)).toBe(15);
  });
});

describe('their onHit (§4.6; m284 f3 @0x6F8, m254 f3 @0x604)', () => {
  const shiva = (t: Fight): void => void resolveAbility(t.ctx, t.at('shiva'), t.ctx.content.ability('shiva-attack')!, [t.boss.id]);

  it('adds 3 to Grothia and 15 to Pterya once per action that reaches them, a miss included, capped at 100', () => {
    for (const [group, boss, per] of [['isaaru-grothia', 'grothia', 3], ['isaaru-pterya', 'pterya', 15]] as const) {
      const t = turns(group, boss, { aeon: 'shiva', gauge: 10 });
      shiva(t);
      expect(gauge(t), boss).toBe(10 + per);
      t.boss.overdrive!.gauge = 99;
      shiva(t);
      expect(gauge(t), `${boss} is capped`).toBe(100);
    }
  });

  it('adds nothing for a counter-attack, or while the aeon is Threatened or asleep', () => {
    const a = turns('isaaru-grothia', 'grothia', { aeon: 'shiva', gauge: 10 });
    a.ctx.rt.inReaction = true;
    shiva(a);
    expect(gauge(a)).toBe(10);
    const b = turns('isaaru-pterya', 'pterya', { aeon: 'shiva', gauge: 10 });
    b.boss.statuses['threaten'] = { id: 'threaten', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    shiva(b);
    expect(gauge(b)).toBe(10);
  });

  it('gives Spathi no hit reaction: a hit changes neither his count nor anything he does', () => {
    const t = turns('isaaru-spathi', 'spathi', { aeon: 'shiva' });
    const count = t.ctx.state.flags['isaaru.count'];
    shiva(t);
    expect(t.ctx.state.flags['isaaru.count']).toBe(count);
    expect(t.ctx.rt.reactions ?? []).toEqual([]);
  });
});

describe('Spathi’s countdown (m287 f2 @0x228; rows 1 to 3)', () => {
  it('turn 1 is the Summon, turns 2 to 6 show 5 to 1, turn 7 is Mega Flare, and the count starts again (D-17)', () => {
    const t = fight('isaaru-spathi', 'spathi');
    const seen: string[] = [];
    for (let i = 0; i < 14; i++) seen.push(idOf(chooseAiCommand(t.ctx, t.boss)));
    const flare = 'spathi-mega-flare';
    const count = 'spathi-countdown';
    expect(seen).toEqual(['spathi-summon', ...Array(5).fill(count), flare, ...Array(5).fill(count), flare, count]);
    expect(seen.indexOf(flare) + 1, 'the 7th turn').toBe(7);
  });

  it('keeps counting with Yuna alone, so Mega Flare lands on her (there is no aeon test)', () => {
    const t = turns('isaaru-spathi', 'spathi');
    for (let i = 0; i < 5; i++) expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('spathi-countdown');
    expect(idOf(chooseAiCommand(t.ctx, t.boss))).toBe('spathi-mega-flare');
  });
});
