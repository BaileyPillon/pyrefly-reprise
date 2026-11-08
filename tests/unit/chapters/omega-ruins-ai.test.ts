/**
 * Ultima Weapon's and Omega Weapon's scripts (FFX only; `src/battle/ffx/ai/ultima-weapon.ts` and `omega-weapon.ts`): the rules pinned to the interpreter's exact tallies in the note
 * (`research/re-ffx-omega-ultima-nemesis.md` 4.1 and 4.2) and run on the real engine. Ultima Weapon's two six-turn cycles and the three draws of each status turn; Omega Weapon's Nova counter (the note's exact
 * distribution, rebuilt here from the real script's own transitions), its two four-step cycles and its Attack share. Nemesis's script is `omega-ruins-nemesis.test.ts`. The draws are forced by a queue on the
 * script stream where a table cell is pinned; the cycles are also played on the real engine from the first turn.
 */

import { describe, expect, it } from 'vitest';

import { omegaWeaponTurn } from '../../../src/battle/ffx/ai/omega-weapon.ts';
import { ultimaWeaponTurn } from '../../../src/battle/ffx/ai/ultima-weapon.ts';
import {
  OW_COUNTER_FLAG, OW_NOVA_AT, OW_STEP_FLAG, UW_TURN_FLAG, WEAPON_MOVES as M, aeonOnField,
} from '../../../src/battle/ffx/ai/weapons-rules.ts';
import { OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import * as H from '../helpers/omegaRuinsDrive.ts';
import { type Engine, FRONT, summon, turn } from '../helpers/omegaRuinsScript.ts';

describe('Ultima Weapon: the six-turn cycle, every cell (RE 4.1)', () => {
  const engineAt = (n: number): Engine => {
    const e = H.newEngine(1, ULTIMA_GROUP_ID);
    H.ctxOf(e).state.flags[UW_TURN_FLAG] = n - 1; // the counter is raised at the start of the turn
    return e;
  };

  it('with no aeon out: Attack, Break/Silence/Confuse, Core Energy, Holy/Sleep/Confuse, Attack, Rain on the front line', () => {
    expect(aeonOnField(H.ctxOf(H.newEngine(1, ULTIMA_GROUP_ID)))).toBe(false);
    const cells: Array<[number, number[], string]> = [
      [1, [], M.ultimaAttack], [2, [0], M.break], [2, [1], M.silence], [2, [2], M.confuse], [3, [], M.coreEnergy],
      [4, [0], M.holy], [4, [1], M.sleep], [4, [2], M.confuse], [5, [], M.ultimaAttack], [6, [], M.shimmeringRain],
    ];
    for (const [n, draws, id] of cells) {
      const out = turn(engineAt(n), ultimaWeaponTurn, draws)!;
      expect(out[0], `turn ${n} draws ${draws}`).toBe(id);
      if (id === M.shimmeringRain) expect([...out[1]].sort()).toEqual([...FRONT].sort());
      else expect(out[1], `turn ${n}`).toHaveLength(1);
    }
  });

  it('the status draw is modulo 3 of the 16-bit value: 21,846 of 65,536 for the first move, 21,845 for each of the others (RE 4.1)', () => {
    const tally = [0, 0, 0];
    for (let raw = 0; raw <= 0xffff; raw++) tally[raw % 3]!++;
    expect(tally).toEqual([21_846, 21_845, 21_845]);
    // and the script reads exactly that residue: the move at raw is the move of residue raw mod 3 (a sample of the whole range)
    const e = engineAt(2);
    for (const raw of [0, 1, 2, 3, 4, 5, 65_533, 65_534, 65_535, 21_845, 21_846, 43_690]) {
      H.ctxOf(e).state.flags[UW_TURN_FLAG] = 1;
      expect(turn(e, ultimaWeaponTurn, [raw])![0], `raw ${raw}`).toBe([M.break, M.silence, M.confuse][raw % 3]);
    }
  });

  it('with an aeon out: Attack, Core Energy, Rain, Core Energy, Attack, Rain (the curses are replaced by more Core Energy and rain), and no status draw at all', () => {
    const e = H.newEngine(1, ULTIMA_GROUP_ID);
    summon(e, 'valefor');
    expect(aeonOnField(H.ctxOf(e))).toBe(true);
    const expected = [M.ultimaAttack, M.coreEnergy, M.shimmeringRain, M.coreEnergy, M.ultimaAttack, M.shimmeringRain];
    for (let n = 1; n <= 6; n++) {
      H.ctxOf(e).state.flags[UW_TURN_FLAG] = n - 1;
      const out = turn(e, ultimaWeaponTurn, [])!; // an empty queue: any status draw would throw
      expect(out[0], `turn ${n}`).toBe(expected[n - 1]);
      expect(out[1].every((t) => t === 'valefor'), `turn ${n} aims at the aeon, the whole front line`).toBe(true);
    }
  });

  it('the counter is raised at every turn and zeroed on the sixth', () => {
    const e = H.newEngine(2, ULTIMA_GROUP_ID);
    const seen: number[] = [];
    for (let i = 0; i < 8; i++) {
      turn(e, ultimaWeaponTurn, [0, 0]);
      seen.push(H.ctxOf(e).state.flags[UW_TURN_FLAG] as number);
    }
    expect(seen).toEqual([1, 2, 3, 4, 5, 0, 1, 2]);
  });

  it('the branch is tested at every turn, so an aeon summoned in the middle of the cycle changes the next cell and keeps the position (turn 3 is Core Energy with none, Rain with one)', () => {
    const e = H.newEngine(1, ULTIMA_GROUP_ID);
    H.ctxOf(e).state.flags[UW_TURN_FLAG] = 2;
    summon(e, 'ifrit');
    expect(turn(e, ultimaWeaponTurn, [])![0]).toBe(M.shimmeringRain);
  });

  it('on the real engine from the first turn: two full cycles of fourteen turns, in the game\'s order, every seed', () => {
    for (const seed of [1, 2, 3]) {
      const e = H.newEngine(seed, ULTIMA_GROUP_ID);
      H.runDefending(e, (en) => H.foeActions(en).length >= 14);
      const acts = H.foeActions(e).slice(0, 14);
      const first = [M.ultimaAttack, '?', M.coreEnergy, '?', M.ultimaAttack, M.shimmeringRain];
      const status2 = new Set<string>([M.break, M.silence, M.confuse]);
      const status4 = new Set<string>([M.holy, M.sleep, M.confuse]);
      for (let i = 0; i < 14; i++) {
        const cell = first[i % 6]!;
        if (cell !== '?') expect(acts[i], `seed ${seed} turn ${i + 1}`).toBe(cell);
        else expect((i % 6 === 1 ? status2 : status4).has(acts[i]!), `seed ${seed} turn ${i + 1}: ${acts[i]}`).toBe(true);
      }
    }
  });

  it('on the real engine with an aeon out the whole time: Attack, Core Energy, Rain, Core Energy, Attack, Rain, twice', () => {
    const e = H.newEngine(4, ULTIMA_GROUP_ID);
    summon(e, 'valefor');
    const aeon = H.actor(e, 'valefor');
    for (let i = 0; i < 400 && H.foeActions(e).length < 12; i++) {
      aeon.stats.maxHp = aeon.hp = 9_999_999;
      const d = e.nextDecision();
      if (d.kind === 'battle-over') throw new Error('the battle ended');
      if (d.kind === 'player-input') e.submit(H.defend());
    }
    const cycle = [M.ultimaAttack, M.coreEnergy, M.shimmeringRain, M.coreEnergy, M.ultimaAttack, M.shimmeringRain];
    expect(H.foeActions(e).slice(0, 12)).toEqual([...cycle, ...cycle]);
  });
});

describe('Omega Weapon: the Nova counter and the cycle (RE 4.2)', () => {
  const omega = (): Engine => H.newEngine(1, OMEGA_GROUP_ID);

  it('a third of its turns an Attack (21,846 of 65,536), the rest a special', () => {
    const tally = [0, 0, 0];
    for (let raw = 0; raw <= 0xffff; raw++) tally[raw % 3]!++;
    expect(tally[0]).toBe(21_846);
    const e = omega();
    for (const [raw, id] of [[0, M.omegaAttack], [3, M.omegaAttack], [65_535, M.omegaAttack], [1, M.coreEnergy], [2, M.coreEnergy], [4, M.coreEnergy]] as Array<[number, string]>) {
      H.ctxOf(e).state.flags[OW_COUNTER_FLAG] = 0;
      H.ctxOf(e).state.flags[OW_STEP_FLAG] = 0;
      expect(turn(e, omegaWeaponTurn, [raw, 0])![0], `raw ${raw}`).toBe(id);
    }
  });

  it('an Attack adds 5 to the counter and leaves the cycle alone; a special adds 2 and advances the cycle', () => {
    const e = omega();
    turn(e, omegaWeaponTurn, [0]);
    expect([H.ctxOf(e).state.flags[OW_COUNTER_FLAG], H.ctxOf(e).state.flags[OW_STEP_FLAG] ?? 0]).toEqual([5, 0]);
    turn(e, omegaWeaponTurn, [1, 0]);
    expect([H.ctxOf(e).state.flags[OW_COUNTER_FLAG], H.ctxOf(e).state.flags[OW_STEP_FLAG]]).toEqual([7, 1]);
  });

  it('at the start of a turn with the counter at 30 or more: Nova on the whole front line, the counter back to 0, and no draw taken', () => {
    expect(OW_NOVA_AT).toBe(30);
    for (const start of [30, 31, 34]) {
      const e = omega();
      H.ctxOf(e).state.flags[OW_COUNTER_FLAG] = start;
      const out = turn(e, omegaWeaponTurn, [])!; // an empty queue: any draw would throw
      expect(out[0]).toBe(M.nova);
      expect([...out[1]].sort()).toEqual([...FRONT].sort());
      expect(H.ctxOf(e).state.flags[OW_COUNTER_FLAG]).toBe(0);
    }
    const e = omega();
    H.ctxOf(e).state.flags[OW_COUNTER_FLAG] = 29;
    expect(turn(e, omegaWeaponTurn, [0])![0]).toBe(M.omegaAttack); // 29 is not 30
  });

  it('with no aeon: Core Energy, Break or Confuse (modulo 2: 0 is Break), Rain on the front line, Ultima or Demi (modulo 2: 0 is Ultima), then the cycle starts again', () => {
    const e = omega();
    const special = 1; // a draw modulo 3 that is 1: a special
    const out = (draws: number[]): [string, string[]] => turn(e, omegaWeaponTurn, draws)!;
    expect(out([special])[0]).toBe(M.coreEnergy);
    expect(out([special, 0])[0]).toBe(M.break);
    H.ctxOf(e).state.flags[OW_STEP_FLAG] = 1;
    expect(out([special, 1])[0]).toBe(M.confuse);
    H.ctxOf(e).state.flags[OW_STEP_FLAG] = 2;
    const rain = out([special]);
    expect(rain[0]).toBe(M.shimmeringRain);
    expect([...rain[1]].sort()).toEqual([...FRONT].sort());
    H.ctxOf(e).state.flags[OW_STEP_FLAG] = 3;
    const ult = out([special, 0]);
    expect(ult[0]).toBe(M.ultima);
    expect([...ult[1]].sort()).toEqual([...FRONT].sort());
    expect(H.ctxOf(e).state.flags[OW_STEP_FLAG]).toBe(0);
    H.ctxOf(e).state.flags[OW_STEP_FLAG] = 3;
    expect(out([special, 1])[0]).toBe(M.demi);
  });

  it('with an aeon out: Core Energy, Rain, Core Energy, Rain (no curse, no Ultima, no Demi, no second draw)', () => {
    const e = omega();
    summon(e, 'ixion');
    const expected = [M.coreEnergy, M.shimmeringRain, M.coreEnergy, M.shimmeringRain];
    for (let i = 0; i < 8; i++) expect(turn(e, omegaWeaponTurn, [1])![0], `special ${i + 1}`).toBe(expected[i % 4]); // one draw only: the Attack/special draw
    expect(H.ctxOf(e).state.flags[OW_STEP_FLAG]).toBe(0);
  });

  /** The counter's transitions read from the REAL script: from counter c, a draw of class 0 (an Attack), 1 or 2 (a special), the masses of the 16-bit residues. */
  function novaDistribution(): number[] {
    const e = omega();
    const mass = [21_846 / 65_536, 21_845 / 65_536, 21_845 / 65_536];
    const next = (c: number, cls: number): number => {
      H.ctxOf(e).state.flags[OW_COUNTER_FLAG] = c;
      H.ctxOf(e).state.flags[OW_STEP_FLAG] = 0;
      turn(e, omegaWeaponTurn, [cls, 0]);
      return H.ctxOf(e).state.flags[OW_COUNTER_FLAG] as number;
    };
    let states = new Map<number, number>([[0, 1]]);
    const out: number[] = [];
    for (let k = 1; k <= 17; k++) {
      const after = new Map<number, number>();
      let nova = 0;
      for (const [c, p] of states) {
        if (c >= OW_NOVA_AT) { nova += p; continue; }
        for (let cls = 0; cls < 3; cls++) {
          const n = next(c, cls);
          after.set(n, (after.get(n) ?? 0) + p * mass[cls]!);
        }
      }
      out.push(nova);
      states = after;
    }
    return out;
  }

  it('the Nova arrives on the 7th to the 16th turn only, in the note\'s exact shares (0.14, 0.55, 8.11, 26.18, 9.10, 32.51, 18.01, 1.54, 3.51, 0.34 percent), the mean 11.443', () => {
    // `d[t - 1]` is the chance that turn t is the Nova (the counter is tested at the start of the turn, so the turn at which it stands at 30 or more is the Nova turn: the Nova turn counts, as in the note).
    const d = novaDistribution();
    const percent = (t: number): number => Math.round(d[t - 1]! * 10_000) / 100;
    const note: Array<[number, number]> = [[7, 0.14], [8, 0.55], [9, 8.11], [10, 26.18], [11, 9.1], [12, 32.51], [13, 18.01], [14, 1.54], [15, 3.51], [16, 0.34]];
    for (const [t, share] of note) expect(percent(t), `the Nova on turn ${t}`).toBe(share);
    expect(d.slice(0, 6).every((x) => x === 0)).toBe(true);
    expect(d[16]).toBe(0); // never on the 17th
    expect(d.reduce((a, x) => a + x, 0)).toBeCloseTo(1, 10);
    const mean = d.reduce((a, x, i) => a + x * (i + 1), 0);
    expect(Math.round(mean * 1_000) / 1_000).toBe(11.443);
  });

  it('draws all 0 (only Attacks) give the Nova on the 7th turn; draws all 1 (only specials) on the 16th, in both branches', () => {
    for (const aeon of [false, true]) {
      for (const [raw, turns] of [[0, 7], [1, 16]] as const) {
        const e = omega();
        if (aeon) summon(e, 'ixion');
        let n = 0;
        let id = '';
        do {
          n++;
          id = turn(e, omegaWeaponTurn, [raw, 0])![0];
        } while (id !== M.nova && n < 40);
        expect([n, id], `aeon ${aeon} draws all ${raw}`).toEqual([turns, M.nova]);
      }
    }
  });

  it('on the real engine from the first turn: its own moves only, the Nova never before the 7th turn, and a Nova resets the count', () => {
    const e = H.newEngine(5, OMEGA_GROUP_ID);
    // The engine ends a fight with no HP progress for 400 turns (the party's, too) as an escape, so the run stops at the first Nova or at twenty of its turns: the Nova is due by the sixteenth.
    H.runDefending(e, (en) => H.foeActions(en).includes(M.nova) || H.foeActions(en).length >= 20);
    const acts = H.foeActions(e);
    expect(acts.includes(M.nova)).toBe(true);
    expect(acts.indexOf(M.nova)).toBeGreaterThanOrEqual(6);
    expect(acts.indexOf(M.nova)).toBeLessThanOrEqual(15);
    expect(new Set(acts.slice(0, acts.indexOf(M.nova)))).not.toContain('attack'); // its own Attack row, never the party's generic one
    expect(H.ctxOf(e).state.flags[OW_COUNTER_FLAG] as number).toBeLessThan(OW_NOVA_AT);
    for (const a of acts) expect([M.omegaAttack, M.coreEnergy, M.break, M.confuse, M.shimmeringRain, M.ultima, M.demi, M.nova], a).toContain(a);
  });
});
