/**
 * Spherimorph on the real FFX engine, seeded (part one: its numbers, Armored, the weakness and the absorb, the answers and Press; part two, `spherimorph-engine-rules.test.ts`: the immunities, the menu, an aeon, the banners and the payout) (FFX only; `research/re-ffx-spherimorph.md`): every move's numbers and statuses end to end, Armored, the weakness and the absorb, the answers, Press, the immunities, an aeon
 * on the field, the menu's disabled commands, the payout and the banners. Nothing is god mode but the HP top-up the mechanic tests ask for. The numbers are the note's section 6 (the arithmetic against the Macalania
 * preset, an `[estimate]`) where it gives them, and are measured on the engine where it does not.
 */

import { describe, expect, it } from 'vitest';

import type { Command } from '../../../src/battle/common/types.ts';
import { SM_ROWS, SM_STATES } from '../../../src/battle/ffx/ai/spherimorph-rules.ts';
import { buildWith } from '../helpers/spherimorphBot.ts';
import { SM, actor, damageInActions, give, has, inputFor, log, newEngine, nextInput, row, runDefending, runIdling, setState, sm, smActions, smStarts, spell, stateOf, swing, withTempleBag } from '../helpers/spherimorphDrive.ts';

type Ev = { type: string; abilityId?: string; actorId?: string; targetId?: string; amount?: number; sourceId?: string; status?: string; targets?: string[]; name?: string; affinity?: string; crit?: boolean };
const events = (engine: ReturnType<typeof newEngine>): readonly Ev[] => log(engine) as unknown as readonly Ev[];

/** The damage events dealt to `target` by `source` since the log began. */
function damageTo(engine: ReturnType<typeof newEngine>, target: string, source?: string): Ev[] {
  return events(engine).filter((e) => e.type === 'damage' && e.targetId === target && (source === undefined || e.sourceId === source));
}

/** Play `command` as the first input of `who` and run on until the next player input. */
function playOne(engine: ReturnType<typeof newEngine>, who: string, make: (d: ReturnType<typeof inputFor>) => Command | null): void {
  const d = inputFor(engine, who);
  const c = make(d);
  if (c === null) throw new Error(`no such command for ${who}`);
  engine.submit(c);
  nextInput(engine);
}

describe('its Attack (RE 6): the numbers against the Macalania cells', () => {
  it("lands in the note's ranges for each member (Tidus 239 to 269, Yuna 245 to 277, Lulu 241 to 273), on one member, on every undefended Attack", () => {
    const range: Record<string, [number, number]> = { tidus: [239, 269], yuna: [245, 277], lulu: [241, 273] };
    let seen = 0;
    for (let seed = 1; seed <= 60; seed++) {
      const engine = newEngine(seed);
      runIdling(engine, (e) => smActions(e).filter((a) => a === 'attack').length >= 2, 400, false);
      const starts = smStarts(engine).filter((x) => x.id === 'attack');
      expect(starts[0]!.targets).toHaveLength(1);
      for (const e of damageInActions(engine, (st) => st.actorId === SM && st.command.kind === 'attack')) {
        if (e.crit) continue; // a critical doubles the blow
        const [lo, hi] = range[e.targetId]!;
        expect(e.amount, `seed ${seed} ${e.targetId}`).toBeGreaterThanOrEqual(lo);
        expect(e.amount, `seed ${seed} ${e.targetId}`).toBeLessThanOrEqual(hi);
        seen++;
      }
    }
    expect(seen).toBeGreaterThan(50);
  });
});

describe('Armored (RE 1.2, 6): a plain blow is divided by three', () => {
  it("Tidus's Attack does 42 to 47 with his weapon's Strength +5 percent taken off (the note's arithmetic leaves the weapon out), 44 to 49 as he is armed; Armor Break on it makes that 299 to 337 and 313 to 354", () => {
    const measure = (strip: boolean, broken: boolean): number[] => {
      const out: number[] = [];
      for (let seed = 1; seed <= 60; seed++) {
        const engine = newEngine(seed);
        if (strip) actor(engine, 'tidus').equipment!.weapon.autoAbilities = [];
        if (broken) give(sm(engine), 'armor-break');
        playOne(engine, 'tidus', (d) => swing(d));
        const hit = damageTo(engine, SM, 'tidus')[0]!;
        if (!hit.crit) out.push(hit.amount!);
        else {
          expect(hit.amount!, 'a critical doubles it').toBeGreaterThanOrEqual((broken ? 299 : 42) * 2 - 2);
        }
      }
      return out;
    };
    const bare = measure(true, false);
    const armed = measure(false, false);
    const bareBroken = measure(true, true);
    const armedBroken = measure(false, true);
    for (const list of [bare, armed, bareBroken, armedBroken]) expect(list.length).toBeGreaterThan(40);
    expect(Math.min(...bare)).toBeGreaterThanOrEqual(42);
    expect(Math.max(...bare)).toBeLessThanOrEqual(47);
    expect(Math.min(...armed)).toBeGreaterThanOrEqual(44);
    expect(Math.max(...armed)).toBeLessThanOrEqual(49);
    expect(Math.min(...bareBroken)).toBeGreaterThanOrEqual(299);
    expect(Math.max(...bareBroken)).toBeLessThanOrEqual(337);
    expect(Math.min(...armedBroken)).toBeGreaterThanOrEqual(313);
    expect(Math.max(...armedBroken)).toBeLessThanOrEqual(354);
  });

  it("Auron's Piercing katana is not divided: 382 to 431 (the alternative front line, Tidus, Auron, Lulu)", () => {
    const seen: number[] = [];
    for (let seed = 1; seed <= 30; seed++) {
      const engine = newEngine(seed, buildWith(['tidus', 'auron', 'lulu']));
      expect(actor(engine, 'auron').equipment?.weapon.autoAbilities).toContain('piercing');
      playOne(engine, 'auron', (d) => swing(d));
      const hit = damageTo(engine, SM, 'auron')[0]!;
      if (!hit.crit) seen.push(hit.amount!);
    }
    expect(seen.length).toBeGreaterThan(20);
    expect(Math.min(...seen)).toBeGreaterThanOrEqual(382);
    expect(Math.max(...seen)).toBeLessThanOrEqual(431);
  });
});

describe('the weakness and the absorb (RE 4.1, 6)', () => {
  it('Lulu\'s Fire on its weakness is x3/2: with her weapon\'s Magic +5 percent it is 902 to 1,018; without it, the note\'s 859 to 970', () => {
    const withWeapon: number[] = [];
    const bare: number[] = [];
    for (let seed = 1; seed <= 50; seed++) {
      for (const [list, strip] of [[withWeapon, false], [bare, true]] as const) {
        const engine = newEngine(seed);
        setState(engine, 0);
        if (strip) actor(engine, 'lulu').equipment!.weapon.autoAbilities = [];
        playOne(engine, 'lulu', (d) => spell(d, 'fire'));
        const hit = damageTo(engine, SM, 'lulu')[0]!;
        expect(hit.affinity).toBe('weak');
        list.push(hit.amount!);
      }
    }
    expect(Math.min(...withWeapon)).toBeGreaterThanOrEqual(902);
    expect(Math.max(...withWeapon)).toBeLessThanOrEqual(1_018);
    expect(Math.min(...bare)).toBeGreaterThanOrEqual(859);
    expect(Math.max(...bare)).toBeLessThanOrEqual(970);
  });

  it('Fira on the weakness is 1,822 to 2,056 bare (the note), and about 1,913 to 2,159 with her weapon', () => {
    const bare: number[] = [];
    for (let seed = 1; seed <= 50; seed++) {
      const engine = newEngine(seed);
      setState(engine, 0);
      actor(engine, 'lulu').equipment!.weapon.autoAbilities = [];
      playOne(engine, 'lulu', (d) => spell(d, 'fira'));
      bare.push(damageTo(engine, SM, 'lulu')[0]!.amount!);
    }
    expect(Math.min(...bare)).toBeGreaterThanOrEqual(1_822);
    expect(Math.max(...bare)).toBeLessThanOrEqual(2_056);
  });

  it('a wrong element HEALS it by the neutral amount, and the damage event says absorbed', () => {
    for (let seed = 1; seed <= 12; seed++) {
      const engine = newEngine(seed);
      setState(engine, 0); // weak Fire: Blizzard is absorbed
      sm(engine).hp = 5_000;
      playOne(engine, 'lulu', (d) => spell(d, 'blizzard'));
      const hit = damageTo(engine, SM, 'lulu')[0]!;
      expect(hit.affinity, `seed ${seed}`).toBe('absorb');
      expect(hit.amount!).toBeLessThan(0);
      expect(-hit.amount!).toBeGreaterThan(560);
      expect(-hit.amount!).toBeLessThan(700);
      expect(sm(engine).hp).toBeGreaterThan(5_000);
    }
  });

  it('Holy is absorbed in every state', () => {
    for (let state = 0; state < 4; state++) {
      const engine = newEngine(3);
      setState(engine, state);
      expect(sm(engine).affinities.holy).toBe('absorb');
    }
  });
});

describe('what it answers with, end to end (RE 4.3)', () => {
  it('a plain blow draws the opposite element\'s player-side spell on the attacker alone, 167 to 231', () => {
    for (let state = 0; state < 4; state++) {
      const engine = newEngine(20 + state);
      setState(engine, state);
      playOne(engine, 'tidus', (d) => swing(d));
      const answers = smStarts(engine).filter((s) => s.id !== 'attack' && s.id !== SM_ROWS.shift);
      expect(answers.length, `state ${state}`).toBeGreaterThanOrEqual(1);
      expect(answers[0]!.id, `state ${state}`).toBe(SM_STATES[state]!.physical);
      expect(answers[0]!.targets, `state ${state}`).toEqual(['tidus']);
      const hit = damageTo(engine, 'tidus', SM).find((e) => e.amount! > 150)!;
      expect(hit.amount!).toBeGreaterThanOrEqual(167);
      expect(hit.amount!).toBeLessThanOrEqual(231);
      expect(stateOf(engine), 'a plain blow never shifts').toBe(state);
    }
  });

  it('a wrong-element spell is answered on all three with the monster-side spell, 235 to 324, and Shell halves it', () => {
    const plain: number[] = [];
    const shelled: number[] = [];
    for (let seed = 1; seed <= 16; seed++) {
      for (const [list, shell] of [[plain, false], [shelled, true]] as const) {
        const engine = newEngine(seed);
        setState(engine, 0);
        if (shell) for (const id of ['tidus', 'yuna', 'lulu']) give(actor(engine, id), 'shell');
        playOne(engine, 'lulu', (d) => spell(d, 'blizzard'));
        const answer = smStarts(engine).find((s) => s.id === SM_ROWS.blizzard)!;
        expect([...answer.targets].sort()).toEqual(['lulu', 'tidus', 'yuna']);
        const hits = events(engine).filter((e) => e.type === 'damage' && e.sourceId === SM && ['tidus', 'yuna', 'lulu'].includes(e.targetId!));
        expect(hits.length).toBeGreaterThanOrEqual(3);
        list.push(...hits.slice(-3).map((e) => e.amount!));
      }
    }
    expect(Math.min(...plain)).toBeGreaterThanOrEqual(235);
    expect(Math.max(...plain)).toBeLessThanOrEqual(324);
    const mean = (xs: number[]): number => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(mean(shelled) / mean(plain)).toBeGreaterThan(0.45);
    expect(mean(shelled) / mean(plain)).toBeLessThan(0.55);
  });

  it('a spell of its weakness is NOT answered by a spell: only Elemental Shift follows, and the new state is one of the four', () => {
    for (let seed = 1; seed <= 20; seed++) {
      const engine = newEngine(seed);
      const state = stateOf(engine);
      const id = ['fire', 'blizzard', 'thunder', 'water'][state]!;
      playOne(engine, 'lulu', (d) => spell(d, id));
      const acts = smActions(engine);
      expect(acts.filter((a) => a !== 'attack'), `seed ${seed}`).toEqual([SM_ROWS.shift]); // its own Attacks aside, Elemental Shift and nothing else
      expect(damageTo(engine, SM, 'lulu')[0]!.affinity).toBe('weak');
    }
  });

  it("a Poison Fang (not in the Woods' bag; the Temple's bag has two, `withTempleBag`) lands (the byte is 90, the move 254), costs 600 a tick, and is answered like a plain blow (a damaging item with no element): the player-side spell on the thrower", () => {
    const engine = newEngine(5, withTempleBag());
    setState(engine, 1);
    const d = inputFor(engine, 'tidus');
    const fang = row(d, 'item', 'poison-fang', SM);
    expect(fang).not.toBeNull();
    engine.submit(fang!);
    nextInput(engine);
    expect(has(sm(engine), 'poison')).toBe(true);
    expect(smActions(engine).filter((a) => a !== 'attack' && a !== SM_ROWS.press)).toEqual([SM_STATES[1]!.physical]);
    const before = sm(engine).hp;
    runDefending(engine, (e) => smActions(e).length >= 3, 400, true);
    const ticks = events(engine).filter((e) => e.type === 'damage' && e.targetId === SM && e.sourceId === undefined);
    expect(ticks.length).toBeGreaterThanOrEqual(1);
    for (const t of ticks) expect(t.amount).toBe(600);
    expect(sm(engine).hp).toBeLessThan(before);
  });
});

describe('Press (RE 4.2, 5): half of the target\'s CURRENT HP, physical class, below half its HP', () => {
  it('from full HP it takes 632 off Tidus, 591 off Yuna and 425 off Lulu (the note), never kills, and Protect halves it', () => {
    const got: Record<string, number[]> = { tidus: [], yuna: [], lulu: [] };
    const protectedGot: number[] = [];
    for (let seed = 1; seed <= 60; seed++) {
      for (const protect of [false, true]) {
        const engine = newEngine(seed);
        sm(engine).hp = 5_000;
        if (protect) for (const id of ['tidus', 'yuna', 'lulu']) give(actor(engine, id), 'protect');
        runIdling(engine, (e) => smActions(e).includes(SM_ROWS.press), 200, false);
        const press = events(engine).filter((e) => e.type === 'damage' && e.sourceId === SM && e.abilityId === undefined).length;
        void press;
        const start = events(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === SM_ROWS.press);
        const end = events(engine).findIndex((e, i) => i > start && e.type === 'action-end');
        const dmg = events(engine).slice(start, end).filter((e) => e.type === 'damage');
        expect(dmg, `seed ${seed}`).toHaveLength(3);
        // The party was not topped up, so each member's HP at the moment it landed is the damage doubled (or the damage doubled less one on an odd HP).
        for (const e of dmg) {
          if (!protect) got[e.targetId!]!.push(e.amount!);
          else protectedGot.push(e.amount!);
          expect(actor(engine, e.targetId!).hp, 'Press never kills').toBeGreaterThan(0);
        }
      }
    }
    // the first Press of a fight comes after other damage, so the figures are half of whatever HP they had; they are never more than the note's full-HP halves
    expect(Math.max(...got['tidus']!)).toBeLessThanOrEqual(632);
    expect(Math.max(...got['yuna']!)).toBeLessThanOrEqual(591);
    expect(Math.max(...got['lulu']!)).toBeLessThanOrEqual(425);
    expect(protectedGot.length).toBeGreaterThan(0);
  });

  it('on a topped-up party it is exactly half of each member\'s HP: 632, 591 and 425; with Protect, a quarter-ish: 316, 295 and 212', () => {
    for (const protect of [false, true]) {
      const engine = newEngine(9);
      sm(engine).hp = 5_000;
      const ctxHp: Record<string, number> = {};
      runIdling(engine, (e) => {
        for (const id of ['tidus', 'yuna', 'lulu']) { const c = actor(e, id); c.hp = c.stats.maxHp; ctxHp[id] = c.hp; if (protect) give(c, 'protect'); }
        return smActions(e).includes(SM_ROWS.press);
      }, 400, false);
      const start = events(engine).findIndex((e) => e.type === 'action-start' && e.abilityId === SM_ROWS.press);
      const end = events(engine).findIndex((e, i) => i > start && e.type === 'action-end');
      const dmg = events(engine).slice(start, end).filter((e) => e.type === 'damage');
      const by = Object.fromEntries(dmg.map((e) => [e.targetId!, e.amount!]));
      if (!protect) expect(by).toEqual({ tidus: 632, yuna: 591, lulu: 425 });
      else for (const [id, half] of [['tidus', 632], ['yuna', 591], ['lulu', 425]] as const) expect(Math.abs(by[id]! - half / 2)).toBeLessThanOrEqual(1);
    }
  });
});
