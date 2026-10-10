/**
 * **Overdrive Sin follows his script** (re-parity, AI lane C; FFX only; Chapter XVIII, the face of Sin).
 *
 * The decision tables are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 7 (m140 in `ssbt03_00`, run in the note's
 * interpreter for its first 14 turns and the Gaze counter for the party, an aeon and the Magus Sisters); the reach rule is its
 * section 1.3. Rows D-14, D-31, D-32, D-33 and D-34 of its section 8:
 *
 *   D-14 the opening: Sin's CTB is 0 and each party counter is one tick later
 *   D-31 Giga-Graviton is Sin's 12th turn (3 pulls, 8 mouth turns), a scripted Game Over
 *   D-32 the distance is 3 at the start and after pull 1, 1 after pull 2, 0 after pull 3: at 1 only reach-0 commands miss
 *   D-33 the Gaze counter rises on every hit event from the first, fires only after the pulls, above 5 (party) or 2 (aeon out)
 *   D-34 a party counter-attack still moves the count; only the command it queues is dropped
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { reachesFoesAtRange, validTargets } from '../../src/battle/ffx/targeting.ts';
import { REACH_ZERO_COMMANDS, isReachZero } from '../../src/battle/ffx/reach.ts';
import { SCRIPTED_GAME_OVER_FLAG } from '../../src/battle/ffx/results.ts';
import { GIGA_GRAVITON_TURN, mouthStage } from '../../src/battle/ffx/ai/overdrive-sin-rules.ts';
import { sinFahrenheitBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { type LiveBattle, ScriptedRng, liveBattle, queuedCounters } from './helpers/aiScript.ts';

const SIN = 'overdrive-sin';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { sin: FFXCombatant; rng: ScriptedRng; flags: Record<string, unknown> };

function fight(): Fight {
  const live = liveBattle('overdrive-sin', { party: sinFahrenheitBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, sin: live.at(SIN), rng, flags: live.ctx.state.flags };
}

const wideDraws = (t: Fight): number => t.rng.calls.filter(([lo, hi]) => lo === 0 && hi === 0xffff).length;
const queued = (t: Fight): string[] => queuedCounters(t.ctx).map((r) => idOf(r.command));
const ability = (t: Fight, id: string): AbilityDef => {
  const def = t.ctx.content.ability(id);
  if (!def) throw new Error(`no ability '${id}'`);
  return def;
};

/** Open the melee window: the pulls are over, the ship is in. */
function inside(t: Fight): void {
  t.flags['sin.turn'] = 3;
  t.flags['airship.range'] = 'near';
  t.flags['airship.distance'] = 0;
}

/** Run one Fire of Lulu's at Sin (magic crosses the gap, so it works in every phase). */
const fire = (t: Fight, who = 'lulu'): void => { resolveAbility(t.ctx, t.at(who), ability(t, 'fire'), [SIN]); };

describe('the clock (D-31; m140 onTurn @0x234)', () => {
  it('pulls on turns 1 to 3, poses on 4 to 11, and fires Giga-Graviton on turn 12', () => {
    expect(GIGA_GRAVITON_TURN).toBe(12);
    const t = fight();
    const seen: string[] = [];
    for (let n = 1; n <= 12; n++) {
      const command = chooseAiCommand(t.ctx, t.sin);
      seen.push(idOf(command));
      expect([t.flags['sin.turn'], t.flags['sin.turnsLeft']], `after turn ${n}`).toEqual([n, 12 - n]);
    }
    expect(seen).toEqual([
      'overdrive-sin-drawn', 'overdrive-sin-drawn', 'overdrive-sin-drawn',
      'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass', 'pass',
      'overdrive-sin-giga-graviton',
    ]);
    expect(t.flags[SCRIPTED_GAME_OVER_FLAG], 'the Game Over is raised with Giga-Graviton and not before').toBe(true);
  });

  it('raises the Game Over on the 12th turn only', () => {
    const t = fight();
    for (let n = 1; n <= 11; n++) chooseAiCommand(t.ctx, t.sin);
    expect(t.flags[SCRIPTED_GAME_OVER_FLAG]).toBeUndefined();
    chooseAiCommand(t.ctx, t.sin);
    expect(t.flags[SCRIPTED_GAME_OVER_FLAG]).toBe(true);
  });

  it('draws nothing and aims the pulls at himself', () => {
    const t = fight();
    const first = chooseAiCommand(t.ctx, t.sin);
    expect(targetsOf(first)).toEqual([SIN]);
    expect(t.rng.calls).toEqual([]);
  });

  it('opens the mouth by stages over the pose turns (presentation only: the stages are our estimate)', () => {
    expect([1, 2, 3, 4, 7, 10, 11, 12].map((n) => mouthStage(n, 12))).toEqual([0, 0, 0, 1, 2, 3, 4, 4]);
  });
});

describe('the opening (D-14; the formation start hook @0x2c3c)', () => {
  it('writes his CTB 0 and adds one tick to each of the seven party counters', () => {
    const t = fight();
    expect(rtOf(t.ctx, SIN).ctb).toBe(0);
    for (const id of [...t.ctx.state.activeIds, ...t.ctx.state.reserveIds]) expect(rtOf(t.ctx, id).ctb, id).toBeGreaterThanOrEqual(1);
  });
});

describe('the ship’s distance (D-32; m140 @0x237 to 0x30c)', () => {
  it('is 3 at the start and after pull 1, 1 after pull 2, and 0 after pull 3, when the ship is also NEAR', () => {
    const t = fight();
    expect([t.flags['airship.distance'], t.flags['airship.range']]).toEqual([3, 'far']);
    const seen: Array<[unknown, unknown]> = [];
    for (let n = 1; n <= 4; n++) {
      chooseAiCommand(t.ctx, t.sin);
      seen.push([t.flags['airship.distance'], t.flags['airship.range']]);
    }
    expect(seen).toEqual([[3, 'far'], [1, 'far'], [0, 'near'], [0, 'near']]);
  });
});

describe('what reaches at each distance (D-32; note 1.3)', () => {
  /** [who, ability, reach class]: the class the game’s command table gives it. */
  const table: Array<[who: string, id: string, reach: 0 | 1 | 2 | 3]> = [
    ['auron', 'armor-break', 0], ['rikku', 'steal', 0], ['tidus', 'delay-attack', 0], ['rikku', 'mug', 0], ['auron', 'provoke', 0],
    ['tidus', 'blitz-ace', 0], ['auron', 'spiral-cut', 0], ['kimahri', 'jump', 0], ['kimahri', 'nova', 0],
    ['yuna', 'hellfire', 1], ['yuna', 'thors-hammer', 1], ['yuna', 'diamond-dust', 1], ['yuna', 'mega-flare', 1], ['yuna', 'zanmato', 1],
    ['yuna', 'delta-attack', 1], ['rikku', 'spare-change', 1], ['kimahri', 'fire-breath', 1],
    ['rikku', 'grenade', 2], ['wakka', 'attack-reels', 2], ['wakka', 'element-reels', 2], ['yuna', 'energy-ray', 2], ['yuna', 'energy-blast', 2],
    ['kimahri', 'seed-cannon', 2],
    ['lulu', 'fire', 3], ['kimahri', 'lancet', 3], ['kimahri', 'doom', 3], ['yuna', 'sonic-wings', 3],
  ];

  it('lets every command of reach 1 or more land at distance 1, and none of reach 0 (except a ranged weapon)', () => {
    const t = fight();
    t.flags['airship.distance'] = 1;
    for (const [who, id, reach] of table) {
      expect(reachesFoesAtRange(t.ctx, t.at(who), ability(t, id)), `${who} ${id} (reach ${reach})`).toBe(reach >= 1);
    }
  });

  it('keeps the old gate at distance 3: only spells, Lancet and a ranged weapon cross it, never Use, items or the reels', () => {
    const t = fight();
    for (const [who, id, reach] of table) {
      if (reach === 3 && ['doom', 'sonic-wings'].includes(id)) continue; // the old category gate is narrower than the table for these (open item)
      expect(reachesFoesAtRange(t.ctx, t.at(who), ability(t, id)), `${who} ${id} (reach ${reach})`).toBe(reach === 3);
    }
  });

  it('reaches everything at distance 0', () => {
    const t = fight();
    inside(t);
    for (const [who, id] of table) expect(reachesFoesAtRange(t.ctx, t.at(who), ability(t, id)), `${who} ${id}`).toBe(true);
  });

  it('puts Sin in the target list of a reachable command and out of an unreachable one, as the menu reads it', () => {
    const t = fight();
    t.flags['airship.distance'] = 1;
    expect(validTargets(t.ctx, t.at('rikku'), ability(t, 'steal'))).not.toContain(SIN);
    expect(validTargets(t.ctx, t.at('lulu'), ability(t, 'fire'))).toContain(SIN);
    expect(validTargets(t.ctx, t.at('yuna'), ability(t, 'zanmato'))).toContain(SIN);
    t.flags['airship.distance'] = 3;
    expect(validTargets(t.ctx, t.at('yuna'), ability(t, 'zanmato'))).not.toContain(SIN);
  });

  it('after his second pull Wakka’s weapon still lands, Tidus’s does not, and the first pull changes nothing', () => {
    const t = fight();
    const melee = ability(t, 'delay-attack');
    t.ctx.rt.actors.get('wakka')!.rangedWeapon = true;
    chooseAiCommand(t.ctx, t.sin);
    expect(reachesFoesAtRange(t.ctx, t.at('rikku'), ability(t, 'grenade')), 'after pull 1: distance 3').toBe(false);
    chooseAiCommand(t.ctx, t.sin);
    expect(reachesFoesAtRange(t.ctx, t.at('rikku'), ability(t, 'grenade')), 'after pull 2: distance 1').toBe(true);
    expect(reachesFoesAtRange(t.ctx, t.at('wakka'), melee), 'Wakka’s weapon (the usage-bit exception)').toBe(true);
    expect(reachesFoesAtRange(t.ctx, t.at('tidus'), melee), 'Tidus’s').toBe(false);
    chooseAiCommand(t.ctx, t.sin);
    expect(reachesFoesAtRange(t.ctx, t.at('tidus'), melee), 'after pull 3: distance 0').toBe(true);
  });

  it('knows its ids: every reach-0 id is a game command id in the 0x3000 table and no item or Use is among them', () => {
    for (const id of REACH_ZERO_COMMANDS) expect(id >> 8, id.toString(16)).toBe(0x30);
    const t = fight();
    expect(isReachZero(ability(t, 'grenade'))).toBe(false);
    expect(isReachZero(ability(t, 'use'))).toBe(false);
    expect(isReachZero(ability(t, 'steal'))).toBe(true);
  });
});

describe('the Gaze counter (D-33; m140 onHit @0x464)', () => {
  it('rises by 1 on every hit event from the first one, also during the pulls, and nothing fires yet', () => {
    const t = fight();
    for (let i = 1; i <= 8; i++) {
      fire(t);
      expect(t.flags['sin.gazeCounter'], `hit event ${i}`).toBe(i);
    }
    expect(queued(t)).toEqual([]);
    expect(wideDraws(t)).toBe(0);
  });

  it('counts a status-only action and a damaging spell once each', () => {
    const t = fight();
    resolveAbility(t.ctx, t.at('tidus'), ability(t, 'slow'), [SIN]);
    expect(t.flags['sin.gazeCounter']).toBe(1);
    resolveAbility(t.ctx, t.at('lulu'), ability(t, 'firaga'), [SIN]);
    expect(t.flags['sin.gazeCounter']).toBe(2);
  });

  it('fires above 5 with the party in front, once the pulls are over: a draw mod 3 picks Zombie, Petrify or Confuse on the front line', () => {
    const rows: Array<[draw: number, want: string]> = [
      [0, 'overdrive-sin-gaze-zombie'], [1, 'overdrive-sin-gaze-petrify'], [2, 'overdrive-sin-gaze-confuse'], [65_535, 'overdrive-sin-gaze-zombie'], [65_534, 'overdrive-sin-gaze-confuse'],
    ];
    for (const [draw, want] of rows) {
      const t = fight();
      inside(t);
      t.rng.wide.push(draw);
      for (let i = 1; i <= 5; i++) { fire(t); expect(queued(t), `event ${i}`).toEqual([]); }
      expect(wideDraws(t), 'no draw until the Gaze fires').toBe(0);
      fire(t);
      expect(queued(t), `draw ${draw}`).toEqual([want]);
      expect(targetsOf(queuedCounters(t.ctx)[0]!.command)).toEqual(['tidus', 'yuna', 'auron']);
      expect([t.flags['sin.gazeCounter'], wideDraws(t)]).toEqual([0, 1]);
    }
  });

  it('is 21,846, 21,845 and 21,845 of the 65,536 draws for Zombie, Petrify and Confuse', () => {
    const counts = [0, 0, 0];
    for (let x = 0; x < 65_536; x++) counts[x % 3]!++;
    expect(counts).toEqual([21_846, 21_845, 21_845]);
  });

  it('fires above 2 with an aeon 8 to 14 on the field, with the aeon Gaze on it and no draw', () => {
    const t = fight();
    inside(t);
    t.ctx.state.aeonId = 'valefor';
    fire(t, 'valefor');
    fire(t, 'valefor');
    expect(queued(t)).toEqual([]);
    fire(t, 'valefor');
    expect(queued(t)).toEqual(['overdrive-sin-gaze-aeon']);
    expect(targetsOf(queuedCounters(t.ctx)[0]!.command)).toEqual(['valefor']);
    expect([t.flags['sin.gazeCounter'], wideDraws(t)]).toEqual([0, 0]);
  });

  it('tests the threshold at the moment of the hit: party hits before the aeon came out count toward the aeon’s 3', () => {
    const t = fight();
    inside(t);
    fire(t);
    fire(t);
    t.ctx.state.aeonId = 'ifrit';
    fire(t, 'ifrit');
    expect(queued(t), 'three events in all, tested against 2 with an aeon out').toEqual(['overdrive-sin-gaze-aeon']);
  });

  it('carries a count above the threshold out of the pull phase and fires on the first hit after the third pull', () => {
    const t = fight();
    for (let i = 0; i < 9; i++) fire(t);
    expect([t.flags['sin.gazeCounter'], queued(t)]).toEqual([9, []]);
    for (let n = 1; n <= 3; n++) chooseAiCommand(t.ctx, t.sin);
    t.rng.wide.push(1);
    fire(t);
    expect(queued(t)).toEqual(['overdrive-sin-gaze-petrify']);
    expect(t.flags['sin.gazeCounter']).toBe(0);
  });

  it('keeps the pull phase until the third pull has been taken (turn 3), not the second', () => {
    const t = fight();
    for (let i = 0; i < 6; i++) fire(t);
    for (let n = 1; n <= 2; n++) chooseAiCommand(t.ctx, t.sin);
    fire(t);
    expect(queued(t), 'two pulls are not enough').toEqual([]);
    chooseAiCommand(t.ctx, t.sin);
    fire(t);
    expect(queued(t)).toHaveLength(1);
  });

  it('moves on a party counter-attack too, and the Gaze it would have queued is dropped (D-34)', () => {
    const t = fight();
    inside(t);
    t.flags['sin.gazeCounter'] = 5;
    t.ctx.rt.inReaction = true;
    t.rng.wide.push(0);
    fire(t);
    expect([t.flags['sin.gazeCounter'], queued(t), wideDraws(t)]).toEqual([0, [], 1]);
  });

  it('asks for one Gaze at a time', () => {
    const t = fight();
    inside(t);
    t.flags['sin.gazeCounter'] = 5;
    fire(t);
    t.flags['sin.gazeCounter'] = 5;
    fire(t);
    expect(queued(t)).toHaveLength(1);
  });
});
