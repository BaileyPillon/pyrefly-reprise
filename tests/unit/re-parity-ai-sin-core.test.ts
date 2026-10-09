/**
 * **Sinspawn Genais and Sin's Core follow their scripts** (re-parity, AI lane C; FFX only; Chapter XVII, link 3).
 *
 * The decision tables are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 6 (m139 Genais and m138 the Core in
 * `ssbt02_00`, run in the note's interpreter over all 16,384 buff layouts and the 36,000-wide modulus); the engine rules they
 * rely on are its section 1.1 (`onHit` once per action per target; only what a hook *queues* is filtered). Rows D-14, D-23 to
 * D-30 and D-34 of its section 8:
 *
 *   D-14 the opening: Genais's CTB is 0 and each party counter is one tick later
 *   D-23 Genais starts IN its shell; its first turn leaves it (Agility 25 in, 26 out)
 *   D-24 the thresholds are strict: out above 12,000, in below 10,000
 *   D-25 entering the shell restarts the Venom, Venom, Thrashing cycle
 *   D-26 in the shell Cura answers every hit event except the Core's Gravija: a miss and a status-only action included
 *   D-27 out of the shell a command whose damage-formula byte is 3 is answered with Waterga on the attacker
 *   D-28 the Core counters with the probability that a draw mod 36,000 exceeds its HP, after a failed Negation roll
 *   D-29 the Core's Negation score is rebuilt each Core turn and lowered by 3 on every hit event
 *   D-30 an absorbed spell is replaced before it resolves: no roll, no decay and no counter
 *   D-34 a party counter-attack still moves the counters; only the command it queues is dropped
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant, StatusId } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { drainReactions } from '../../src/battle/ffx/hit-hooks.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { coreScore } from '../../src/battle/ffx/ai/sin-negation.ts';
import { setShell, syncGenaisCoreLiveness } from '../../src/battle/ffx/ai/sin-genais-core-rules.ts';
import { sinFinsCoreBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const G = 'sinspawn-genais';
const C = 'sin-core';
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { genais: FFXCombatant; core: FFXCombatant; rng: ScriptedRng; flags: Record<string, unknown> };

/** Link 3 as the engine opens it: Genais shelled, the Core charging, the party Tidus, Yuna and Auron in front. */
function fight(): Fight {
  const live = liveBattle('sin-genais-core', { party: sinFinsCoreBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  return { ...live, genais: live.at(G), core: live.at(C), rng, flags: live.ctx.state.flags };
}

/** Genais out of its shell, the way its first turn leaves it. */
function out(): Fight {
  const t = fight();
  setShell(t.ctx, t.genais, false);
  return t;
}

const wideDraws = (t: Fight): number => t.rng.calls.filter(([lo, hi]) => lo === 0 && hi === 0xffff).length;
const queued = (t: Fight): string[] => (t.ctx.rt.reactions ?? []).map((r) => idOf(r.command));
const give = (c: FFXCombatant, status: StatusId): void => {
  c.statuses[status] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
};

/** Run one named action of `who` against `target`. */
function act(t: Fight, who: string, abilityId: string, target: string): AbilityDef {
  const def = t.ctx.content.ability(abilityId);
  if (!def) throw new Error(`no ability '${abilityId}'`);
  resolveAbility(t.ctx, t.at(who), def, [target]);
  return def;
}

/** An action that deals exactly 50 HP damage per point of `power` (Fixed, no variance) and nothing else. */
function exact(power: number, extra: Partial<AbilityDef> = {}): AbilityDef {
  return ability({
    id: 'exact-test', name: 'exact', category: 'skill', formula: 'fixed-no-variance', power, damageType: 'other',
    targeting: 'single-enemy', canMiss: false, ...extra,
  });
}

/** Run the reactions a hook queued, the way `engine-end.ts#afterAction` does: each as a free action while `inReaction` is set. */
function runReactions(t: Fight): void {
  for (const r of drainReactions(t.ctx)) {
    t.ctx.rt.inReaction = true;
    executeCommand(t.ctx, t.at(r.actorId), r.command, true);
    t.ctx.rt.inReaction = false;
  }
}

describe('Genais’s opening (D-14, D-23; m139 @0x009 to 0x118)', () => {
  it('starts in its shell, Armored and percentage-immune, Agility 25, with the Core charging', () => {
    const t = fight();
    expect(t.flags['sin.genais.shelled']).toBe(true);
    expect(t.genais.immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage']));
    expect(t.genais.stats.agi).toBe(25);
    expect([t.flags['sin.core.state'], t.core.flags.outOfMeleeReach]).toEqual(['charging', true]);
  });

  it('acts first: CTB 0 for Genais and one tick more than the ordinary opening for each of the seven party counters', () => {
    const t = fight();
    expect(rtOf(t.ctx, G).ctb).toBe(0);
    for (const id of [...t.ctx.state.activeIds, ...t.ctx.state.reserveIds]) expect(rtOf(t.ctx, id).ctb, id).toBeGreaterThanOrEqual(1);
  });

  it('leaves the shell on its first turn: the exit dummy at his own position, Armored off, Agility 26, no draw', () => {
    const t = fight();
    const first = chooseAiCommand(t.ctx, t.genais);
    expect([idOf(first), targetsOf(first)]).toEqual(['sin-genais-shell-out', [G]]);
    expect(t.flags['sin.genais.shelled']).toBe(false);
    expect(t.genais.immunityFlags).not.toContain('armored');
    expect(t.genais.immunityFlags).not.toContain('immune-to-percentage-damage');
    expect(t.genais.stats.agi).toBe(26);
    expect(t.flags['sin.core.state'], 'the Core waits while he is out').toBe('inactive');
    expect(t.rng.calls).toEqual([]);
  });
});

describe('Genais’s turn (D-24, D-25; m139 onTurn @0x11d)', () => {
  it('leaves the shell above 12,000 HP and sighs at 12,000 or less (strict)', () => {
    for (const [hp, want] of [[12_001, 'sin-genais-shell-out'], [12_000, 'sin-genais-sigh'], [1, 'sin-genais-sigh']] as const) {
      const t = fight();
      t.genais.hp = hp;
      expect(idOf(chooseAiCommand(t.ctx, t.genais)), `${hp} HP`).toBe(want);
    }
  });

  it('enters the shell below 10,000 HP and not at 10,000 (strict): Armored on, Agility 25, the Core charging', () => {
    const at10 = out();
    at10.genais.hp = 10_000;
    expect(idOf(chooseAiCommand(at10.ctx, at10.genais))).toBe('sin-genais-venom');
    const t = out();
    t.genais.hp = 9_999;
    const enter = chooseAiCommand(t.ctx, t.genais);
    expect([idOf(enter), targetsOf(enter)]).toEqual(['sin-genais-shell-in', [G]]);
    expect([t.flags['sin.genais.shelled'], t.genais.stats.agi, t.flags['sin.core.state']]).toEqual([true, 25, 'charging']);
    expect(t.genais.immunityFlags).toEqual(expect.arrayContaining(['armored', 'immune-to-percentage-damage']));
  });

  it('runs Venom, Venom, Thrashing and repeats, and entering the shell restarts the cycle', () => {
    const t = out();
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) seen.push(idOf(chooseAiCommand(t.ctx, t.genais)));
    expect(seen).toEqual(['sin-genais-venom', 'sin-genais-venom', 'sin-genais-thrashing', 'sin-genais-venom']);
    t.genais.hp = 9_000;
    expect(idOf(chooseAiCommand(t.ctx, t.genais))).toBe('sin-genais-shell-in');
    t.genais.hp = 20_000;
    expect(idOf(chooseAiCommand(t.ctx, t.genais))).toBe('sin-genais-shell-out');
    const again: string[] = [];
    for (let i = 0; i < 3; i++) again.push(idOf(chooseAiCommand(t.ctx, t.genais)));
    expect(again, 'the one Venom already spent before the shell is forgotten').toEqual(['sin-genais-venom', 'sin-genais-venom', 'sin-genais-thrashing']);
  });

  it('picks the Venom victim among the living by a draw only when two or more stand, in ascending actor order', () => {
    const t = out();
    t.rng.set(2);
    const venom = chooseAiCommand(t.ctx, t.genais);
    expect([idOf(venom), targetsOf(venom)], 'Tidus 0, Yuna 1, Auron 2').toEqual(['sin-genais-venom', ['auron']]);
    expect(t.rng.calls).toEqual([[0, 2]]);
    t.at('yuna').alive = false;
    t.at('auron').alive = false;
    t.rng.calls.length = 0;
    expect(targetsOf(chooseAiCommand(t.ctx, t.genais))).toEqual(['tidus']);
    expect(t.rng.calls, 'a lone candidate costs no draw').toEqual([]);
  });
});

describe('Genais’s hook (D-26, D-27; m139 onHit @0x278)', () => {
  it('in the shell answers every hit event with Cura on himself: a hit, a miss and a status-only action', () => {
    const hit = fight();
    act(hit, 'tidus', 'attack', G);
    expect([queued(hit), targetsOf(hit.ctx.rt.reactions![0]!.command)]).toEqual([['sin-genais-cura'], [G]]);
    const status = fight();
    act(status, 'tidus', 'slow', G);
    expect(queued(status), 'a status-only action').toEqual(['sin-genais-cura']);
    const miss = fight();
    const whiff = ability({ id: 'whiff', name: 'whiff', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', targeting: 'single-enemy', accuracy: 0 });
    miss.rng.set(255);
    resolveAbility(miss.ctx, miss.at('tidus'), whiff, [G]);
    expect(queued(miss), 'a miss').toEqual(['sin-genais-cura']);
  });

  it('refuses the Core’s Gravija, and the Cura it casts is itself an event that asks for nothing more', () => {
    const t = fight();
    resolveAbility(t.ctx, t.core, t.ctx.content.ability('sin-core-gravija')!, [G]);
    expect(queued(t)).toEqual([]);
    act(t, 'tidus', 'attack', G);
    runReactions(t);
    expect(queued(t), 'the Cura does not chain').toEqual([]);
  });

  it('asks for one Cura at a time: a second hit while one waits queues nothing', () => {
    const t = fight();
    act(t, 'tidus', 'attack', G);
    act(t, 'auron', 'attack', G);
    expect(queued(t)).toEqual(['sin-genais-cura']);
  });

  it('out of the shell answers a command whose formula byte is 3 with Waterga on the attacker, and nothing else', () => {
    const rows: Array<[who: string, id: string, waterga: boolean]> = [
      ['lulu', 'fire', true], ['kimahri', 'lancet', true], ['lulu', 'scan', true], ['rikku', 'reflect', true],
      ['tidus', 'attack', false], ['tidus', 'slow', false], ['rikku', 'cure', false], ['tidus', 'cheer', false],
    ];
    for (const [who, id, waterga] of rows) {
      const t = out();
      act(t, who, id, G);
      expect(queued(t), `${who} ${id}`).toEqual(waterga ? ['sin-genais-waterga'] : []);
      if (waterga) expect(targetsOf(t.ctx.rt.reactions![0]!.command)).toEqual([who]);
    }
  });

  it('does not Cura out of the shell, and does not Waterga in it', () => {
    const outside = out();
    act(outside, 'tidus', 'attack', G);
    expect(queued(outside)).toEqual([]);
    const inside = fight();
    act(inside, 'lulu', 'fire', G);
    expect(queued(inside)).toEqual(['sin-genais-cura']);
  });

  it('answers a counter-attack’s hit with nothing (D-34)', () => {
    const t = fight();
    t.ctx.rt.inReaction = true;
    act(t, 'tidus', 'attack', G);
    expect(queued(t)).toEqual([]);
  });
});

describe('the Core’s turn (m138 onTurn @0x35f)', () => {
  it('waits while Genais is out, gathers while he is shelled or dead, and Gravijas the front line and Genais once charged', () => {
    const t = out();
    expect(idOf(chooseAiCommand(t.ctx, t.core)), 'Genais out').toBe('sin-core-inactive');
    setShell(t.ctx, t.genais, true);
    expect(idOf(chooseAiCommand(t.ctx, t.core)), 'Genais shelled').toBe('sin-core-gathers');
    expect(t.flags['sin.core.state']).toBe('ready');
    const gravija = chooseAiCommand(t.ctx, t.core);
    expect([idOf(gravija), targetsOf(gravija)]).toEqual(['sin-core-gravija', ['tidus', 'yuna', 'auron', G]]);
    expect(t.flags['sin.core.state'], 'back to waiting on a shelled Genais').toBe('charging');
  });

  it('Gravijas Genais whatever he is doing now, then waits when he is out and runs free when he is gone', () => {
    const t = fight();
    t.flags['sin.core.state'] = 'ready';
    setShell(t.ctx, t.genais, false);
    t.flags['sin.core.state'] = 'ready';
    expect(targetsOf(chooseAiCommand(t.ctx, t.core))).toEqual(['tidus', 'yuna', 'auron', G]);
    expect(t.flags['sin.core.state']).toBe('inactive');
    t.genais.hp = 0;
    t.genais.alive = false;
    t.flags['sin.core.state'] = 'ready';
    expect(targetsOf(chooseAiCommand(t.ctx, t.core)), 'a dead Genais is not a target').toEqual(['tidus', 'yuna', 'auron']);
    expect(t.flags['sin.core.state']).toBe('free');
    expect(idOf(chooseAiCommand(t.ctx, t.core)), 'free: gathers again').toBe('sin-core-gathers');
  });

  it('rebuilds its stored score from the party at the start of each of its turns', () => {
    const t = fight();
    give(t.at('tidus'), 'shell');
    chooseAiCommand(t.ctx, t.core);
    expect(t.flags['sin.core.score']).toBe(1);
    give(t.at('yuna'), 'haste');
    chooseAiCommand(t.ctx, t.core);
    expect(t.flags['sin.core.score'], 'Haste is worth 2 here').toBe(3);
  });

  it('scores Shell +1, Haste +2, Reflect +1 per slot, Protect 1 / 0 / 2, Armor Break +3, Mental Break +3 on all 16,384 layouts', () => {
    const t = fight();
    const slots = ['tidus', 'yuna', 'auron'].map((id) => t.at(id));
    let checked = 0;
    for (let layout = 0; layout < 4096; layout++) {
      let want = 0;
      slots.forEach((c, slot) => {
        for (const s of ['shell', 'protect', 'reflect', 'haste'] as const) delete c.statuses[s];
        const bits = (layout >> (slot * 4)) & 15;
        if (bits & 1) { give(c, 'shell'); want += 1; }
        if (bits & 2) { give(c, 'protect'); want += slot === 0 ? 1 : slot === 2 ? 2 : 0; }
        if (bits & 4) { give(c, 'reflect'); want += 1; }
        if (bits & 8) { give(c, 'haste'); want += 2; }
      });
      for (const breaks of [0, 1, 2, 3]) {
        delete t.core.statuses['armor-break'];
        delete t.core.statuses['mental-break'];
        if (breaks & 1) give(t.core, 'armor-break');
        if (breaks & 2) give(t.core, 'mental-break');
        expect(coreScore(t.ctx, t.core), `layout ${layout}, breaks ${breaks}`).toBe(want + (breaks & 1 ? 3 : 0) + (breaks & 2 ? 3 : 0));
        checked++;
      }
    }
    expect(checked).toBe(16_384);
  });
});

describe('the Core’s hook (D-28, D-29; m138 onHit @0x460)', () => {
  const MAX = 36_000;

  /** One hit on the Core by Wakka’s ranged swing, for exactly `damage` HP, with the two draws the script takes. */
  function swing(t: Fight, r1: number, r2: number, damage = 0): void {
    t.rng.wide.push(r1, r2);
    resolveAbility(t.ctx, t.at('wakka'), exact(damage / 50, { canMiss: false }), [C]);
  }

  it('takes two draws per hit event, the first reduced by the Core’s maximum HP and the second mod 8', () => {
    const t = out();
    expect(t.core.stats.maxHp).toBe(MAX);
    t.flags['sin.core.score'] = 6;
    swing(t, 12_345, 7);
    expect(wideDraws(t)).toBe(2);
    expect(t.flags['sin.core.score'], 'a roll of 7 is not under 3').toBe(3);
    expect(queued(t)).toEqual([]);
  });

  it('answers with Negation when the second draw is under the stored score less 3, which then falls by 3 a hit event, floor 0', () => {
    // The note: with a stored score of 15 the chances on successive events are 100 %, 100 %, 75 %, 37.5 % and 0 %.
    const rows: Array<[stored: number, roll: number, fires: boolean]> = [
      [15, 7, true], [12, 7, true], [9, 5, true], [9, 6, false], [6, 2, true], [6, 3, false], [3, 0, false], [0, 0, false],
    ];
    for (const [stored, roll, fires] of rows) {
      const t = out();
      t.flags['sin.core.score'] = stored;
      swing(t, 0, roll);
      expect(queued(t), `stored ${stored}, roll ${roll}`).toEqual(fires ? ['sin-core-negation'] : []);
      expect(t.flags['sin.core.score']).toBe(Math.max(0, stored - 3));
      expect(t.flags['sin.core.guard']).toBe(fires);
    }
  });

  it('wipes the party, the Core and Genais with its Negation, and swallows its own hit event: no draw, no decay, guard cleared', () => {
    const t = out();
    t.flags['sin.core.score'] = 15;
    for (const id of ['tidus', 'yuna', 'auron']) give(t.at(id), 'haste');
    give(t.core, 'shell');
    give(t.genais, 'protect');
    swing(t, 0, 0);
    const before = wideDraws(t);
    runReactions(t);
    for (const [who, status] of [['tidus', 'haste'], ['yuna', 'haste'], [C, 'shell'], [G, 'protect']] as const) {
      expect(t.at(who).statuses[status], `${who} ${status}`).toBeUndefined();
    }
    expect([wideDraws(t), t.flags['sin.core.score'], t.flags['sin.core.guard']], 'its own event drew nothing and cost nothing').toEqual([before, 12, false]);
  });

  it('counters with the next element of Fire, Blizzard, Thunder, Water iff the first draw mod 36,000 is above its HP', () => {
    const t = out();
    t.core.hp = 1_000;
    const seen: string[] = [];
    for (const [r1, fires] of [[1_001, true], [1_000, false], [37_001, true], [36_000, false], [35_999, true], [1_002, true], [65_535, true], [0, false]] as const) {
      t.flags['sin.core.score'] = 0;
      t.rng.calls.length = 0;
      t.ctx.rt.reactions = [];
      swing(t, r1, 0);
      expect(queued(t), `draw ${r1}`).toEqual(fires ? [expect.stringMatching(/^sin-core-(fire|blizzard|thunder|water)$/)] : []);
      if (fires) seen.push(queued(t)[0]!);
    }
    expect(seen, 'the cycle moves only when one fires').toEqual(['sin-core-fire', 'sin-core-blizzard', 'sin-core-thunder', 'sin-core-water', 'sin-core-fire']);
  });

  it('never counters at full HP and about 45 % of the time at half HP (the shares of the 65,536 draws)', () => {
    const share = (hp: number): number => {
      let n = 0;
      for (let x = 0; x < 65_536; x++) if (hp < x % MAX) n++;
      return n / 65_536;
    };
    expect(share(MAX)).toBe(0);
    expect(share(30_000)).toBeCloseTo(0.09154, 4);
    expect(share(18_000)).toBeCloseTo(0.45065, 4);
    expect(share(6_000)).toBeCloseTo(0.81686, 4);
    expect(share(1)).toBeCloseTo(0.99994, 4);
  });

  it('a Negation that fires is the only answer: no element goes with it, and the element cycle stays put', () => {
    const t = out();
    t.core.hp = 1_000;
    t.flags['sin.core.score'] = 15;
    swing(t, 30_000, 0);
    expect(queued(t)).toEqual(['sin-core-negation']);
    expect(t.flags['sin.core.counterStep']).toBe(0);
  });

  it('a party counter-attack moves the score and takes both draws, and the command it would queue is dropped (D-34)', () => {
    const t = out();
    t.flags['sin.core.score'] = 15;
    t.ctx.rt.inReaction = true;
    swing(t, 0, 0);
    expect([wideDraws(t), t.flags['sin.core.score'], queued(t)]).toEqual([2, 12, []]);
  });
});

describe('the absorbed spell (D-30; m138 onTargeted @0x417)', () => {
  it('is replaced before it resolves while Genais is OUT: no damage, no draw, no decay, no counter, and Genais answers "Magic absorbed."', () => {
    const t = out();
    t.flags['sin.core.score'] = 15;
    t.core.hp = 1_000;
    const hp = t.core.hp;
    t.rng.wide.push(5_000, 0);
    act(t, 'lulu', 'fire', C);
    expect([t.core.hp, wideDraws(t), t.flags['sin.core.score']]).toEqual([hp, 0, 15]);
    expect(queued(t)).toEqual(['sin-magic-absorbed']);
    expect(t.ctx.rt.reactions![0]!.actorId).toBe(G);
  });

  it('lands normally while Genais is shelled, with a roll and a decay', () => {
    const t = fight();
    t.flags['sin.core.score'] = 6;
    const hp = t.core.hp;
    t.rng.wide.push(0, 7);
    act(t, 'lulu', 'fire', C);
    expect(t.core.hp).toBeLessThan(hp);
    expect([wideDraws(t), t.flags['sin.core.score']]).toEqual([2, 3]);
  });

  it('lands normally once Genais is dead, and the Core can then be walked up to', () => {
    const t = out();
    t.genais.hp = 0;
    t.genais.alive = false;
    syncGenaisCoreLiveness(t.ctx);
    expect(t.core.flags.outOfMeleeReach).toBe(false);
    expect(t.core.immunityFlags).not.toContain('immune-to-magical-damage');
    const hp = t.core.hp;
    t.rng.wide.push(0, 7);
    act(t, 'lulu', 'fire', C);
    expect(t.core.hp).toBeLessThan(hp);
    expect(wideDraws(t)).toBe(2);
  });

  it('lets a physical swing and a special command through while Genais is out (only the magical type is replaced)', () => {
    const t = out();
    const hp = t.core.hp;
    t.rng.wide.push(0, 7);
    act(t, 'wakka', 'attack', C);
    expect(t.core.hp, 'Wakka’s ranged swing').toBeLessThan(hp);
    expect(wideDraws(t)).toBe(2);
    const lancet = fight();
    setShell(lancet.ctx, lancet.genais, false);
    lancet.rng.wide.push(0, 7);
    act(lancet, 'kimahri', 'lancet', C);
    expect(wideDraws(lancet), 'Lancet is special, not magical, so it passes and draws').toBe(2);
  });
});
