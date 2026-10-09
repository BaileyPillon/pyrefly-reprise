/**
 * **Re-parity, Chapter I: Seymour Flux and the Mortiorchis follow the game's own scripts** (FFX only).
 *
 * Every row of `research/re-ffx-ai-seymour.md` section 2 (tables 2.3, 2.4 and 2.5) as an assertion on the
 * shipped data: the turn tables of both actors, the hooks, the revive loop, the Delay punishment, the
 * threshold lines. The rows that differ from the old AI are D-01 to D-08 of the note's section 6.
 *
 * Each describe names the rows it pins. The numbers are the interpreter's: the six-step and four-step cycles,
 * the revive values 4,000, 3,000, 2,000, 1,000, 1,000 (the run of the real `m143` hook), the lines 52,500 and
 * 35,000 (strictly below).
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef } from '../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../src/battle/ffx/index.ts';
import { drainScriptReactions } from '../../src/battle/ffx/ai/reaction-drain.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { onTurnEnd } from '../../src/battle/ffx/ticks.ts';
import { ALL_ABILITIES } from '../../src/data/ffx/index.ts';
import { act, at, counters, exactHit, idOf, realCtx, status } from './helpers/seymourParity.ts';

const FLUX = 'seymour-flux';
const MOUNT = 'mortiorchis';
const CYCLE = 'seymour.cycle';
const ability = (id: string): AbilityDef => {
  const def = ALL_ABILITIES.find((a) => a.id === id);
  if (!def) throw new Error(`no ability ${id}`);
  return def;
};

function fresh(seed = 1) {
  const { ctx, events } = realCtx('seymour-flux', seed);
  return { ctx, events };
}

describe('Flux and the Mortiorchis: the turn tables (m142 onTurn @0x241, m143 onTurn @0x12e)', () => {
  it('the first cycle: Flux acts on steps 1, 3, 5 and wastes 2, 4, 6 (table 2.3 rows 2 to 5)', () => {
    const want: Array<[string, number]> = [['lance-of-atrophy', 2], ['pass', 2], ['lance-of-atrophy', 4], ['pass', 4], ['dispel', 6], ['pass', 6]];
    for (let s = 1; s <= 6; s++) {
      const { ctx } = fresh();
      ctx.state.flags[CYCLE] = s;
      const command = chooseAiCommand(ctx, at(ctx, FLUX));
      expect([idOf(command), ctx.state.flags[CYCLE]], `s = ${s}`).toEqual(want[s - 1]);
    }
  });

  it('the first cycle: the mount answers on steps 2, 4, 6 and wastes 1, 3, 5 (table 2.4 rows 3 to 5)', () => {
    const want: Array<[string, number]> = [['pass', 1], ['full-life', 3], ['pass', 3], ['full-life', 5], ['pass', 5], ['cross-cleave', 1]];
    for (let s = 1; s <= 6; s++) {
      const { ctx } = fresh();
      ctx.state.flags[CYCLE] = s;
      const command = chooseAiCommand(ctx, at(ctx, MOUNT));
      expect([idOf(command), ctx.state.flags[CYCLE]], `s = ${s}`).toEqual(want[s - 1]);
    }
  });

  it('the second cycle (phase 2): Flare, ready notice, Reflect, Total Annihilation (table 2.3 rows 6 to 8, table 2.4 rows 6 to 8)', () => {
    const flux: Array<[string, number]> = [['flare-self', 2], ['pass', 2], ['reflect', 4], ['pass', 4], ['pass', 5], ['pass', 6]];
    const mount: Array<[string, number]> = [['pass', 1], ['pass', 3], ['pass', 3], ['total-annihilation', 1], ['pass', 5], ['pass', 6]];
    for (let s = 1; s <= 6; s++) {
      const a = fresh().ctx;
      a.state.flags[CYCLE] = s;
      a.state.flags['seymour.phase'] = 2;
      expect([idOf(chooseAiCommand(a, at(a, FLUX))), a.state.flags[CYCLE]], `Flux at s = ${s}`).toEqual(flux[s - 1]);
      const b = fresh().ctx;
      b.state.flags[CYCLE] = s;
      b.state.flags['seymour.phase'] = 2;
      expect([idOf(chooseAiCommand(b, at(b, MOUNT))), b.state.flags[CYCLE]], `the mount at s = ${s}`).toEqual(mount[s - 1]);
    }
  });

  it('step 3 of the second cycle with Reflect already up is a caption only, and the step still moves (row 7)', () => {
    const { ctx } = fresh();
    ctx.state.flags['seymour.phase'] = 2;
    ctx.state.flags[CYCLE] = 3;
    at(ctx, FLUX).statuses['reflect'] = status('reflect');
    expect(chooseAiCommand(ctx, at(ctx, FLUX))).toBeNull();
    expect(ctx.state.flags[CYCLE]).toBe(4);
  });

  it('the mount\'s step-2 turn in phase 2 is the "ready" notice: a charge event and a pass, no command (row 6)', () => {
    const { ctx, events } = fresh();
    ctx.state.flags['seymour.phase'] = 2;
    ctx.state.flags[CYCLE] = 2;
    expect(chooseAiCommand(ctx, at(ctx, MOUNT))).toBeNull();
    const charge = events.filter((e) => e.type === 'charge');
    expect(charge).toHaveLength(1);
    expect(charge[0]).toMatchObject({ enemyId: MOUNT, name: 'Ready To Annihilate', stage: 2, turnsLeft: 0 });
    expect(rtOf(ctx, MOUNT).charge).toMatchObject({ name: 'Ready To Annihilate' });
  });

  it('the telegraph clears when Total Annihilation fires (row 7: Special 2 on himself)', () => {
    const { ctx } = fresh();
    ctx.state.flags['seymour.phase'] = 2;
    ctx.state.flags[CYCLE] = 4;
    rtOf(ctx, MOUNT).charge = { name: 'Ready To Annihilate', turnsLeft: 0, stage: 2 };
    expect(idOf(chooseAiCommand(ctx, at(ctx, MOUNT)))).toBe('total-annihilation');
    expect(rtOf(ctx, MOUNT).charge).toBeNull();
  });

  it('the cycle is driven by the shared state, not by who acted last: two turns of the same actor waste the second (D-01)', () => {
    const { ctx } = fresh();
    expect(idOf(chooseAiCommand(ctx, at(ctx, FLUX)))).toBe('lance-of-atrophy');
    expect(chooseAiCommand(ctx, at(ctx, FLUX))).toBeNull();
    // the mount first at the start of the fight wastes its turn and leaves the state alone
    const other = fresh().ctx;
    expect(chooseAiCommand(other, at(other, MOUNT))).toBeNull();
    expect(other.state.flags[CYCLE] ?? 1).toBe(1);
    // and a banish turn does not shift the parity: the same cycle resumes where it was
    other.state.aeonId = 'valefor';
    expect(idOf(chooseAiCommand(other, at(other, FLUX)))).toBe('banish');
    expect(other.state.flags[CYCLE] ?? 1).toBe(1);
  });

  it('an aeon in the battle: Flux banishes it on his next turn and the mount passes, the cycle frozen, in both phases (row 1, D-02)', () => {
    for (const phase of [0, 2]) {
      const { ctx } = fresh();
      ctx.state.flags['seymour.phase'] = phase;
      ctx.state.flags[CYCLE] = 4;
      ctx.state.aeonId = 'valefor'; // no turns taken: the old AI waited for one
      const flux = chooseAiCommand(ctx, at(ctx, FLUX));
      expect(idOf(flux)).toBe('banish');
      expect(flux?.targets).toEqual(['valefor']);
      expect(chooseAiCommand(ctx, at(ctx, MOUNT))).toBeNull();
      expect(ctx.state.flags[CYCLE]).toBe(4);
    }
  });

  it('after its turn the mount copies Flux\'s CTB counter into its own, except while an aeon is out (m143 @0x162, D-08)', () => {
    const { ctx } = fresh();
    ctx.state.flags[CYCLE] = 2;
    rtOf(ctx, FLUX).ctb = 23;
    rtOf(ctx, MOUNT).ctb = 0;
    chooseAiCommand(ctx, at(ctx, MOUNT));
    expect(rtOf(ctx, MOUNT).ctb).toBe(23);
    rtOf(ctx, FLUX).ctb = 31;
    ctx.state.aeonId = 'valefor';
    chooseAiCommand(ctx, at(ctx, MOUNT));
    expect(rtOf(ctx, MOUNT).ctb).toBe(23);
  });

  it('Full-Life goes to a random Zombie member, or to a random living one when nobody is Zombie (table 2.4 row 3)', () => {
    let zombieOnly = true;
    let spread = new Set<string>();
    for (let seed = 1; seed <= 60; seed++) {
      const { ctx } = fresh(seed);
      ctx.state.flags[CYCLE] = 2;
      const living = ctx.state.activeIds;
      at(ctx, living[0]!).statuses['zombie'] = status('zombie');
      at(ctx, living[2]!).statuses['zombie'] = status('zombie');
      const target = chooseAiCommand(ctx, at(ctx, MOUNT))?.targets[0];
      if (target !== living[0] && target !== living[2]) zombieOnly = false;
      const plain = fresh(seed).ctx;
      plain.state.flags[CYCLE] = 2;
      spread.add(chooseAiCommand(plain, at(plain, MOUNT))?.targets[0] ?? '?');
    }
    expect(zombieOnly).toBe(true);
    expect(spread.size).toBe(3); // no Zombie anywhere: any of the three living members
    spread = new Set();
  });
});

describe('Flux\'s onHit (m142 @0x533): the lines, one shot each, strictly below (table 2.5)', () => {
  const HIT = (amount: number) => exactHit(`hit-${amount}`, amount);

  it('does nothing at exactly 52,500 and queues a forced Protect below it (D-04: strictly, one shot)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 52_600;
    const at52 = act(ctx, 'tidus', HIT(100), [FLUX]);
    expect(at(ctx, FLUX).hp).toBe(52_500);
    expect(counters(at52, FLUX)).toEqual([]);
    const below = act(ctx, 'tidus', HIT(50), [FLUX]);
    expect(at(ctx, FLUX).hp).toBe(52_450);
    expect(counters(below, FLUX)).toEqual(['protect']);
    expect(at(ctx, FLUX).statuses['protect']).toBeDefined();
    expect(ctx.state.flags['seymour.phase']).toBe(1);
    expect(ctx.state.flags['seymour.protectLine']).toBe(0);
  });

  it('a Dispel is never answered again: the line is spent (D-04)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 52_400;
    act(ctx, 'tidus', HIT(50), [FLUX]);
    expect(at(ctx, FLUX).statuses['protect']).toBeDefined();
    delete at(ctx, FLUX).statuses['protect']; // the party's Dispel
    const later = act(ctx, 'tidus', HIT(500), [FLUX]);
    expect(counters(later, FLUX)).toEqual([]);
    expect(at(ctx, FLUX).statuses['protect']).toBeUndefined();
  });

  it('the line is spent even when he already holds Protect (the command is skipped, the line is not kept)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 52_600;
    at(ctx, FLUX).statuses['protect'] = status('protect');
    const events = act(ctx, 'tidus', HIT(200), [FLUX]);
    expect(counters(events, FLUX)).toEqual([]);
    expect(ctx.state.flags['seymour.protectLine']).toBe(0);
    delete at(ctx, FLUX).statuses['protect'];
    expect(counters(act(ctx, 'tidus', HIT(100), [FLUX]), FLUX)).toEqual([]);
  });

  it('below 35,000 he queues a forced Reflect, opens the second cycle at step 1 and gives the first Total Annihilation notice', () => {
    const { ctx, events } = fresh();
    at(ctx, FLUX).hp = 35_100;
    at(ctx, FLUX).statuses['protect'] = status('protect');
    ctx.state.flags['seymour.protectLine'] = 0;
    ctx.state.flags[CYCLE] = 5;
    const hit = act(ctx, 'tidus', HIT(100), [FLUX]);
    expect(at(ctx, FLUX).hp).toBe(35_000);
    expect(counters(hit, FLUX)).toEqual([]); // 35,000 is not below 35,000
    const crossing = act(ctx, 'tidus', HIT(50), [FLUX]);
    expect(counters(crossing, FLUX)).toEqual(['reflect']);
    expect(ctx.state.flags['seymour.phase']).toBe(2);
    expect(ctx.state.flags[CYCLE]).toBe(1);
    const charge = events.filter((e) => e.type === 'charge');
    expect(charge[0]).toMatchObject({ name: 'Auto-Attack Mode', stage: 1, turnsLeft: 1 });
  });

  it('one big hit crosses both lines and answers with both, Protect then Reflect (rows 3 and 4 in one event)', () => {
    const { ctx } = fresh();
    const hit = act(ctx, 'tidus', HIT(40_000), [FLUX]);
    expect(at(ctx, FLUX).hp).toBe(30_000);
    expect(counters(hit, FLUX)).toEqual(['protect', 'reflect']);
    expect(ctx.state.flags['seymour.phase']).toBe(2);
  });

  it('the answer comes once per ACTION, however many hits it lands (the hook runs after the last record)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 52_600;
    const three = exactHit('three-hits', 100, { hits: 3 });
    const hit = act(ctx, 'tidus', three, [FLUX]);
    expect(at(ctx, FLUX).hp).toBe(52_300);
    expect(counters(hit, FLUX)).toEqual(['protect']);
  });

  it('an enemy-side attacker runs the hook too: the mount hitting him (D-07)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 52_600;
    const selfInflicted = exactHit('mount-hits-flux', 300, { targeting: 'single-ally' });
    const events = act(ctx, MOUNT, selfInflicted, [FLUX]);
    expect(counters(events, FLUX)).toEqual(['protect']);
    expect(ctx.state.flags['seymour.phase']).toBe(1);
  });

  it('Poison never reaches the hook: it has no postPoison (a tick below the line changes nothing until the next hit)', () => {
    const { ctx } = fresh();
    const flux = at(ctx, FLUX);
    flux.hp = 35_100;
    flux.statuses['poison'] = status('poison');
    ctx.state.flags['seymour.protectLine'] = 0;
    // the 2 % tick (1,400) on his own turn takes 35,100 to 33,700, below the Reflect line
    onTurnEnd(ctx, flux);
    expect(flux.hp).toBe(33_700);
    expect(drainScriptReactions({ ctx, push: ctx.emit })).toBeUndefined();
    expect(ctx.state.flags['seymour.phase'] ?? 0).toBe(0);
    expect(flux.statuses['reflect']).toBeUndefined();
    // the next real hit finds him below the line and answers
    expect(counters(act(ctx, 'tidus', HIT(50), [FLUX]), FLUX)).toEqual(['reflect']);
    expect(ctx.state.flags['seymour.phase']).toBe(2);
  });
});

describe('The Mortiorchis\'s onHit (m143 @0x17d): it cannot die, and Delay is punished (table 2.5)', () => {
  const KILL = exactHit('kill-mount', 9_000);

  it('a lethal hit sets its HP and max HP to the revive value before the death check: 4,000, 3,000, 2,000, 1,000, 1,000 (D-06)', () => {
    const { ctx } = fresh();
    const mount = at(ctx, MOUNT);
    const flux = at(ctx, FLUX);
    const seen: Array<[number, number, number]> = [];
    for (let i = 0; i < 6; i++) {
      const fluxBefore = flux.hp;
      act(ctx, 'tidus', KILL, [MOUNT]);
      seen.push([mount.hp, mount.stats.maxHp, fluxBefore - flux.hp]);
      expect(mount.alive).toBe(true);
      expect(mount.statuses['ko']).toBeUndefined();
    }
    // [HP after, max HP after, what the master lost]: the drain equals the value it came back at
    expect(seen).toEqual([
      [4_000, 4_000, 4_000],
      [3_000, 3_000, 3_000],
      [2_000, 2_000, 2_000],
      [1_000, 1_000, 1_000],
      [1_000, 1_000, 1_000],
      [1_000, 1_000, 1_000],
    ]);
  });

  it('it keeps the presenter\'s fall cue (a ko and a part-destroyed event) and announces its return with the Mortibsorption heal', () => {
    const { ctx } = fresh();
    const events = act(ctx, 'tidus', KILL, [MOUNT]);
    const types = events.map((e) => e.type);
    expect(types.indexOf('ko')).toBeGreaterThan(-1);
    expect(types.indexOf('part-destroyed')).toBeGreaterThan(types.indexOf('ko'));
    const heal = events.findIndex((e) => e.type === 'heal' && e.cause === 'mortibsorption');
    expect(heal).toBeGreaterThan(types.indexOf('part-destroyed'));
  });

  it('a multi-hit action that kills it revives it once, after the last hit (one onHit per action)', () => {
    const { ctx } = fresh();
    const mount = at(ctx, MOUNT);
    const events = act(ctx, 'tidus', exactHit('three-hits', 9_000, { hits: 3 }), [MOUNT]);
    expect(events.filter((e) => e.type === 'ko')).toHaveLength(1);
    expect(events.filter((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toHaveLength(1);
    expect(mount.hp).toBe(4_000);
  });

  it('with Flux already at 0 HP there is no drain and the revive value is not lowered (row 1: "if Flux\'s HP is 0, stop")', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 0;
    const events = act(ctx, 'tidus', KILL, [MOUNT]);
    expect(at(ctx, MOUNT).hp).toBe(4_000);
    expect(events.some((e) => e.type === 'heal' && e.cause === 'mortibsorption')).toBe(false);
    expect(ctx.state.flags['mortiorchis.reviveHp'] ?? 4_000).toBe(4_000);
  });

  it('the drain runs Flux\'s own hook: a drain across a line is answered (reactions are first in, first out)', () => {
    const { ctx } = fresh();
    at(ctx, FLUX).hp = 56_000; // the 4,000 drain lands on 52,000, below the Protect line
    const events = act(ctx, 'tidus', KILL, [MOUNT]);
    expect(at(ctx, FLUX).hp).toBe(52_000);
    expect(counters(events, FLUX)).toEqual(['protect']);
  });

  it('Delay Attack or Delay Buster on the mount arms the punishment, and Flux answers with a forced Slowga on the party (D-05)', () => {
    for (const id of ['delay-attack', 'delay-buster']) {
      const { ctx } = fresh();
      const events = act(ctx, 'tidus', ability(id), [MOUNT]);
      expect(counters(events, FLUX), id).toEqual(['slowga-counter']);
      expect(ctx.state.flags['seymour.delayFlag'], id).toBe(0); // armed and consumed in the same chain
    }
  });

  it('no other delay answers: not Delay on Flux himself, not another move that carries a delay (D-05)', () => {
    const onFlux = fresh().ctx;
    expect(counters(act(onFlux, 'tidus', ability('delay-attack'), [FLUX]), FLUX)).toEqual([]);
    const other = fresh().ctx;
    const aeonDelay = exactHit('other-delay', 100, { flags: ['weak-delay'] });
    expect(counters(act(other, 'tidus', aeonDelay, [MOUNT]), FLUX)).toEqual([]);
    const strong = fresh().ctx;
    expect(counters(act(strong, 'tidus', exactHit('strong-delay', 100, { flags: ['strong-delay'] }), [MOUNT]), FLUX)).toEqual([]);
  });
});
