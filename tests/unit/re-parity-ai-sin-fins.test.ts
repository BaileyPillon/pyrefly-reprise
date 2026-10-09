/**
 * **The Left Fin, the Right Fin and Cid follow their scripts** (re-parity, AI lane C; FFX only; Chapter XVII, links 1 and 2).
 *
 * The decision tables are `research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 5 (m136 and m137 in `ssbt00_00` and
 * `ssbt01_00`, run in the note's interpreter over every draw and all 16,384 buff layouts); the engine rules they rely on are its
 * section 1.1 (`onHit` once per action per target; only what a hook *queues* is filtered) and 1.2 (the party slots and "an aeon
 * holds the field"). Rows D-19 to D-22 and D-34 of its section 8:
 *
 *   D-19 the Left Fin draws `mod 3` on every NEAR regular turn, even when the outcome is certain
 *   D-20 the hit counter takes +1 per hit event (+2 with an aeon out), and the Fin's own Negation and do-nothing Gravija count
 *   D-21 the Negation score: Shell/Reflect +1 per slot, Protect slot 1 +1 / slot 3 +2, Haste 0/3/4/5, Armor Break +2, Mental Break +1
 *   D-22 one draw on every hit event, whether or not a Negation is possible
 *   D-34 a party counter-attack still moves the counters; only the command it queues is dropped
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant, StatusId } from '../../src/battle/common/types.ts';
import { chooseAiCommand, resolveAbility } from '../../src/battle/ffx/index.ts';
import { drainReactions } from '../../src/battle/ffx/hit-hooks.ts';
import { executeCommand } from '../../src/battle/ffx/execute.ts';
import { finNegationChance, finScore } from '../../src/battle/ffx/ai/sin-negation.ts';
import { sinFinsCoreBuild } from '../../src/data/ffx/builds/sin-fahrenheit.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

type Group = 'sin-left-fin' | 'sin-right-fin';
const FIN: Record<Group, string> = { 'sin-left-fin': 'left-fin', 'sin-right-fin': 'right-fin' };
const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);

type Fight = LiveBattle & { fin: FFXCombatant; rng: ScriptedRng; flags: Record<string, unknown> };

function fight(group: Group, range: 'near' | 'far' = 'near'): Fight {
  const live = liveBattle(group, { party: sinFinsCoreBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  const t = { ...live, fin: live.at(FIN[group]), rng, flags: live.ctx.state.flags };
  t.flags['airship.range'] = range;
  return t;
}

/** The draws of `GetRandomValue()` taken so far (an `int(0, 65535)`); the actions' own variance rolls are narrower. */
const wideDraws = (t: Fight): number => t.rng.calls.filter(([lo, hi]) => lo === 0 && hi === 0xffff).length;
const queued = (t: Fight): string[] => (t.ctx.rt.reactions ?? []).map((r) => idOf(r.command));

/** Run one action of `who` against the Fin. */
function act(t: Fight, who: string, abilityId: string): AbilityDef {
  const def = t.ctx.content.ability(abilityId);
  if (!def) throw new Error(`no ability '${abilityId}'`);
  resolveAbility(t.ctx, t.at(who), def, [t.fin.id]);
  return def;
}

/** Give a status to a combatant (no duration logic: these tests read the statuses, not their expiry). */
function give(c: FFXCombatant, status: StatusId): void {
  c.statuses[status] = { id: status, turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

/** Run the reactions a hook queued, the way `engine-end.ts#afterAction` does: each as a free action while `inReaction` is set. */
function runReactions(t: Fight): void {
  for (const r of drainReactions(t.ctx)) {
    t.ctx.rt.inReaction = true;
    executeCommand(t.ctx, t.at(r.actorId), r.command, true);
    t.ctx.rt.inReaction = false;
  }
}

describe('the Left Fin’s turn (D-19; m136 f3 @0x203)', () => {
  const ram = 'sin-fin-ram';
  const dummy = 'sin-motionless';

  it('Rams at NEAR iff the draw mod 3 is at most the hit count, with one draw per regular turn', () => {
    const rows: Array<[hits: number, draw: number, want: string]> = [
      [0, 0, ram], [0, 1, dummy], [0, 2, dummy], [0, 3, ram], [0, 65_535, ram],
      [1, 1, ram], [1, 2, dummy], [1, 65_534, dummy], [1, 65_533, ram],
      [2, 2, ram], [2, 65_534, ram], [9, 2, ram],
    ];
    for (const [hits, draw, want] of rows) {
      const t = fight('sin-left-fin');
      t.flags['sin.fin.hits'] = hits;
      t.rng.wide.push(draw);
      expect(idOf(chooseAiCommand(t.ctx, t.fin)), `${hits} hits, draw ${draw}`).toBe(want);
      expect(wideDraws(t), 'the draw is spent even when it cannot matter').toBe(1);
    }
  });

  it('is 21,846, 43,691 and 65,536 of the 65,536 draws (33.334 %, 66.667 %, 100 %)', () => {
    const wins = (hits: number): number => {
      let n = 0;
      for (let x = 0; x < 65_536; x++) if (x % 3 <= hits) n++;
      return n;
    };
    expect([wins(0), wins(1), wins(2)]).toEqual([21_846, 43_691, 65_536]);
  });

  it('counts a regular turn whether or not he attacks, gathers after three, then Gravija, and Gravija is not a regular turn', () => {
    const t = fight('sin-left-fin');
    t.rng.wide.push(1, 1, 0, 1, 1, 1); // dummy, dummy, Ram, then (after Gravija) dummy, dummy, dummy
    const seen: string[] = [];
    for (let i = 0; i < 10; i++) seen.push(idOf(chooseAiCommand(t.ctx, t.fin)));
    expect(seen).toEqual([dummy, dummy, ram, 'sin-fin-gathers', 'sin-fin-gravija', dummy, dummy, dummy, 'sin-fin-gathers', 'sin-fin-gravija']);
    expect(wideDraws(t), 'only the six regular turns drew').toBe(6);
  });

  it('Smacks at FAR above 6 hits and not before, with no draw, and zeroes the counter', () => {
    const t = fight('sin-left-fin', 'far');
    t.flags['sin.fin.hits'] = 6;
    expect(idOf(chooseAiCommand(t.ctx, t.fin))).toBe(dummy);
    t.flags['sin.fin.hits'] = 7;
    expect(idOf(chooseAiCommand(t.ctx, t.fin))).toBe('sin-fin-smack');
    expect([t.flags['sin.fin.hits'], t.flags['sin.fin.regularActs'], wideDraws(t)], 'FAR neither charges nor draws').toEqual([0, 0, 0]);
  });

  it('turns a charge that resolves at FAR into the do-nothing Gravija aimed at himself, and starts the count again', () => {
    const t = fight('sin-left-fin');
    t.flags['sin.fin.regularActs'] = 3;
    t.rng.wide.push(0);
    expect(idOf(chooseAiCommand(t.ctx, t.fin))).toBe('sin-fin-gathers');
    t.flags['airship.range'] = 'far';
    const dodge = chooseAiCommand(t.ctx, t.fin);
    expect([idOf(dodge), targetsOf(dodge), t.flags['sin.fin.charged'], t.flags['sin.fin.regularActs']]).toEqual(['sin-fin-gravija-far', ['left-fin'], false, 0]);
  });
});

describe('the Right Fin’s turn (m137 f2 @0x202)', () => {
  it('never draws: NEAR Rams above 3 hits or once latched, FAR Smacks above 4 hits (above 2 once latched)', () => {
    const rows: Array<[range: 'near' | 'far', hits: number, latched: boolean, want: string]> = [
      ['near', 3, false, 'sin-motionless'], ['near', 4, false, 'sin-fin-ram'], ['near', 0, true, 'sin-fin-ram'],
      ['far', 4, false, 'sin-motionless'], ['far', 5, false, 'sin-fin-smack'],
      ['far', 2, true, 'sin-motionless'], ['far', 3, true, 'sin-fin-smack'],
    ];
    for (const [range, hits, latched, want] of rows) {
      const t = fight('sin-right-fin', range);
      t.flags['sin.fin.hits'] = hits;
      t.flags['sin.fin.latched'] = latched;
      expect(idOf(chooseAiCommand(t.ctx, t.fin)), `${range}, ${hits} hits, latched ${latched}`).toBe(want);
      expect(wideDraws(t)).toBe(0);
    }
  });
});

describe('the hit counter (D-20; m136 f5 @0x47c)', () => {
  it('rises by 1 on every hit event: a hit, a miss, a heal and a status-only action alike', () => {
    const t = fight('sin-left-fin');
    act(t, 'tidus', 'attack');
    expect(t.flags['sin.fin.hits']).toBe(1);
    const whiff = ability({ id: 'whiff', name: 'whiff', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', targeting: 'single-enemy', accuracy: 0 });
    t.rng.set(255);
    resolveAbility(t.ctx, t.at('tidus'), whiff, [t.fin.id]);
    expect(t.flags['sin.fin.hits'], 'a miss').toBe(2);
    act(t, 'yuna', 'cure');
    expect(t.flags['sin.fin.hits'], 'a heal').toBe(3);
    act(t, 'tidus', 'slow');
    expect(t.flags['sin.fin.hits'], 'a status-only action').toBe(4);
  });

  it('counts a many-hit action once', () => {
    const t = fight('sin-left-fin');
    const volley = ability({ id: 'volley', name: 'volley', category: 'skill', formula: 'strength', power: 1, damageType: 'physical', hits: 9, canMiss: false, targeting: 'single-enemy' });
    resolveAbility(t.ctx, t.at('tidus'), volley, [t.fin.id]);
    expect(t.flags['sin.fin.hits']).toBe(1);
  });

  it('rises by 2 while an aeon 8 to 14 holds the field, whoever the attacker is', () => {
    const t = fight('sin-left-fin');
    t.ctx.state.aeonId = 'valefor';
    act(t, 'tidus', 'attack');
    expect(t.flags['sin.fin.hits']).toBe(2);
    t.ctx.state.aeonId = null;
    act(t, 'tidus', 'attack');
    expect(t.flags['sin.fin.hits']).toBe(3);
  });

  it('resets when the Fin attacks, not when he sits still', () => {
    const t = fight('sin-right-fin');
    t.flags['sin.fin.hits'] = 3;
    chooseAiCommand(t.ctx, t.fin);
    expect(t.flags['sin.fin.hits'], 'a skipped Ram keeps the count').toBe(3);
    t.flags['sin.fin.hits'] = 4;
    chooseAiCommand(t.ctx, t.fin);
    expect(t.flags['sin.fin.hits']).toBe(0);
  });

  it('moves on a party counter-attack too, and the Negation it would have queued is dropped (D-34)', () => {
    const t = fight('sin-left-fin');
    for (const id of ['tidus', 'yuna', 'auron']) give(t.at(id), 'haste');
    t.rng.wide.push(0);
    t.ctx.rt.inReaction = true;
    act(t, 'tidus', 'attack');
    expect([t.flags['sin.fin.hits'], wideDraws(t), queued(t)]).toEqual([1, 1, []]);
  });
});

describe('the Negation score (D-21; m136 @0x4e3 to 0x71a, m137 @0x4e2 to 0x719)', () => {
  it('matches the note’s closed form on all 16,384 layouts of Shell, Protect, Reflect and Haste on three slots and the two Breaks', () => {
    const t = fight('sin-left-fin');
    const slots = ['tidus', 'yuna', 'auron'].map((id) => t.at(id));
    const hasteWeight = [0, 3, 4, 5];
    let checked = 0;
    for (let layout = 0; layout < 4096; layout++) {
      let want = 0;
      let hasted = 0;
      slots.forEach((c, slot) => {
        for (const s of ['shell', 'protect', 'reflect', 'haste'] as const) delete c.statuses[s];
        const bits = (layout >> (slot * 4)) & 15;
        if (bits & 1) { give(c, 'shell'); want += 1; }
        if (bits & 2) { give(c, 'protect'); want += slot === 0 ? 1 : slot === 2 ? 2 : 0; }
        if (bits & 4) { give(c, 'reflect'); want += 1; }
        if (bits & 8) { give(c, 'haste'); hasted++; }
      });
      want += hasteWeight[hasted]!;
      for (const breaks of [0, 1, 2, 3]) {
        delete t.fin.statuses['armor-break'];
        delete t.fin.statuses['mental-break'];
        if (breaks & 1) give(t.fin, 'armor-break');
        if (breaks & 2) give(t.fin, 'mental-break');
        expect(finScore(t.ctx, t.fin), `layout ${layout}, breaks ${breaks}`).toBe(want + (breaks & 1 ? 2 : 0) + (breaks & 2 ? 1 : 0));
        checked++;
      }
    }
    expect(checked).toBe(16_384);
  });

  it('reads the summoner’s slot as the aeon and the other two as empty while an aeon is out', () => {
    const t = fight('sin-left-fin');
    for (const id of ['tidus', 'yuna', 'auron']) { give(t.at(id), 'shell'); give(t.at(id), 'reflect'); }
    expect(finScore(t.ctx, t.fin)).toBe(6);
    t.ctx.state.aeonId = 'valefor';
    give(t.at('valefor'), 'shell');
    expect(finScore(t.ctx, t.fin), 'only the aeon in Yuna’s slot counts, and it has Shell').toBe(1);
  });

  it('is the exact share of the 65,536 draws: k / 16 for the Left Fin, (5,461 k + min(k, 4)) / 65,536 for the Right', () => {
    const share = (m: number, k: number): number => {
      let n = 0;
      for (let x = 0; x < 65_536; x++) if (x % m < k) n++;
      return n;
    };
    const slots = (t: Fight): FFXCombatant[] => ['tidus', 'yuna', 'auron'].map((id) => t.at(id));
    const layouts: Array<[name: string, build: (t: Fight) => void, score: number]> = [
      ['nothing', () => {}, 0],
      ['Shell on three and Protect on slot 3', (t) => { slots(t).forEach((c) => give(c, 'shell')); give(t.at('auron'), 'protect'); }, 5],
      ['Shell and Reflect on three, Protect on slots 1 and 3', (t) => { slots(t).forEach((c) => { give(c, 'shell'); give(c, 'reflect'); }); give(t.at('tidus'), 'protect'); give(t.at('auron'), 'protect'); }, 9],
      ['and Haste on three', (t) => { slots(t).forEach((c) => { give(c, 'shell'); give(c, 'reflect'); give(c, 'haste'); }); give(t.at('tidus'), 'protect'); give(t.at('auron'), 'protect'); }, 14],
      ['and both Breaks on the Fin', (t) => { slots(t).forEach((c) => { give(c, 'shell'); give(c, 'reflect'); give(c, 'haste'); }); give(t.at('tidus'), 'protect'); give(t.at('auron'), 'protect'); give(t.fin, 'armor-break'); give(t.fin, 'mental-break'); }, 17],
    ];
    for (const [name, build, score] of layouts) {
      for (const group of ['sin-left-fin', 'sin-right-fin'] as const) {
        const t = fight(group);
        build(t);
        expect(finScore(t.ctx, t.fin), name).toBe(score);
        const k = Math.max(0, score - 3);
        expect(finNegationChance(t.ctx, FIN[group]), `${group}, ${name}`).toBe(share(group === 'sin-left-fin' ? 16 : 12, k) / 65_536);
      }
    }
    // The note’s published chances for the Right Fin by score S (k = S - 3): S = 4 8.334 %, 5 16.669 %, 6 25.003 %, 8 41.670 %, 10 58.336 %, 14 91.667 %, 15 certain.
    for (const [score, pct] of [[4, 8.334], [5, 16.669], [6, 25.003], [8, 41.67], [10, 58.336], [14, 91.667], [15, 100]] as const) {
      expect(share(12, score - 3) / 655.36, `S = ${score}`).toBeCloseTo(pct, 2);
    }
  });
});

describe('the NEAR Negation roll (D-22; m136 @0x74e to 0x78a)', () => {
  /** A layout with score 6 (Shell on three slots, Protect on slot 3): Negation iff the draw's residue is under 3. */
  const armed = (group: Group): Fight => {
    const t = fight(group);
    for (const id of ['tidus', 'yuna', 'auron']) give(t.at(id), 'shell');
    give(t.at('auron'), 'protect');
    give(t.at('tidus'), 'reflect');
    return t;
  };

  it('draws once per hit event and queues Negation iff the draw mod 16 (Left) or 12 (Right) is under max(0, score - 3)', () => {
    const rows: Array<[Group, draw: number, fires: boolean]> = [
      ['sin-left-fin', 2, true], ['sin-left-fin', 3, false], ['sin-left-fin', 18, true], ['sin-left-fin', 19, false],
      ['sin-right-fin', 2, true], ['sin-right-fin', 3, false], ['sin-right-fin', 14, true], ['sin-right-fin', 15, false],
    ];
    for (const [group, draw, fires] of rows) {
      const t = armed(group);
      t.rng.wide.push(draw);
      act(t, 'tidus', 'attack');
      expect(wideDraws(t)).toBe(1);
      expect(queued(t), `${group} draw ${draw}`).toEqual(fires ? ['sin-fin-negation'] : []);
    }
  });

  it('spends the draw even when the score is 3 or less and nothing can fire', () => {
    const t = fight('sin-left-fin');
    for (const id of ['tidus', 'yuna', 'auron']) give(t.at(id), 'shell');
    t.rng.wide.push(0);
    act(t, 'tidus', 'attack');
    expect([wideDraws(t), queued(t)], 'score 3 less 3 is 0: even a draw of 0 is not under it').toEqual([1, []]);
  });

  it('aims the Negation at the whole front line and the Fin himself', () => {
    const t = armed('sin-left-fin');
    t.rng.wide.push(0);
    act(t, 'tidus', 'attack');
    const [reaction] = t.ctx.rt.reactions ?? [];
    expect(targetsOf(reaction!.command)).toEqual(['tidus', 'yuna', 'auron', 'left-fin']);
  });

  it('then hits himself with it: his own event adds a second point to the counter and queues nothing', () => {
    const t = armed('sin-left-fin');
    t.rng.wide.push(0, 0);
    act(t, 'tidus', 'attack');
    expect(t.flags['sin.fin.hits']).toBe(1);
    runReactions(t);
    expect(t.at('tidus').statuses['shell'], 'the Negation took the buffs').toBeUndefined();
    expect([t.flags['sin.fin.hits'], wideDraws(t), queued(t)], 'the self-hit is an event: counted, drawn for, with a score of 0 by now').toEqual([2, 2, []]);
  });

  it('does not queue a second Negation while one is waiting', () => {
    const t = armed('sin-left-fin');
    t.rng.wide.push(0, 0);
    act(t, 'tidus', 'attack');
    act(t, 'auron', 'attack');
    expect(queued(t)).toEqual(['sin-fin-negation']);
  });

  it('stays off with the bench switch set, but still counts and draws', () => {
    const t = armed('sin-left-fin');
    t.flags['sin.negation.off'] = true;
    t.rng.wide.push(0);
    act(t, 'tidus', 'attack');
    expect([t.flags['sin.fin.hits'], wideDraws(t), queued(t)]).toEqual([1, 1, []]);
  });

  it('a Threatened or asleep Fin keeps counting and drawing, and the queue refuses the Negation (the hook always runs)', () => {
    for (const status of ['threaten', 'sleep', 'confuse', 'berserk'] as const) {
      const t = armed('sin-left-fin');
      give(t.fin, status);
      t.rng.wide.push(0);
      act(t, 'tidus', 'slow'); // damage would wake him; a status-only action is an event too
      expect([t.flags['sin.fin.hits'], wideDraws(t), queued(t)], status).toEqual([1, 1, []]);
    }
  });
});

describe('the FAR Negation and the guard (D-22; m136 @0x71a to 0x744, @0x473)', () => {
  // At FAR only magic reaches him (`targeting.ts#reachesFoesAtRange`), so Lulu’s Fire is the action here.
  it('draws mod 100 on every hit event, with or without Mental Break; only Mental Break and a draw under 80 queue Negation on himself', () => {
    const rows: Array<[mentalBreak: boolean, draw: number, fires: boolean]> = [
      [false, 5, false], [true, 5, true], [true, 79, true], [true, 80, false], [true, 179, true], [true, 180, false], [true, 99, false],
    ];
    for (const [mb, draw, fires] of rows) {
      const t = fight('sin-left-fin', 'far');
      if (mb) give(t.fin, 'mental-break');
      t.rng.wide.push(draw);
      act(t, 'lulu', 'fire');
      expect(wideDraws(t), `Mental Break ${mb}, draw ${draw}`).toBe(1);
      expect(queued(t)).toEqual(fires ? ['sin-fin-negation-far'] : []);
      expect(t.flags['sin.fin.negationGuard']).toBe(fires);
    }
  });

  it('is aimed at himself alone, and its own hit event is swallowed: no count, no draw, the guard cleared', () => {
    const t = fight('sin-left-fin', 'far');
    give(t.fin, 'mental-break');
    t.rng.wide.push(0);
    act(t, 'lulu', 'fire');
    expect(targetsOf(t.ctx.rt.reactions![0]!.command)).toEqual(['left-fin']);
    runReactions(t);
    expect(t.fin.statuses['mental-break'], 'the Negation wiped his Mental Break').toBeUndefined();
    expect([t.flags['sin.fin.hits'], wideDraws(t), t.flags['sin.fin.negationGuard']]).toEqual([1, 1, false]);
  });

  it('is 52,436 of the 65,536 draws (80.011 %) with Mental Break, and 0 without', () => {
    let n = 0;
    for (let x = 0; x < 65_536; x++) if (x % 100 < 80) n++;
    expect(n).toBe(52_436);
    const t = fight('sin-right-fin', 'far');
    expect(finNegationChance(t.ctx, 'right-fin')).toBe(0);
    give(t.fin, 'mental-break');
    expect(finNegationChance(t.ctx, 'right-fin')).toBe(52_436 / 65_536);
  });

  it('adds a point and rolls again for the do-nothing Gravija, which is his own turn: a Negation rolled in its event is kept', () => {
    const t = fight('sin-left-fin', 'far');
    give(t.fin, 'mental-break');
    t.flags['sin.fin.charged'] = true;
    t.rng.wide.push(0);
    const dodge = chooseAiCommand(t.ctx, t.fin)!;
    expect(idOf(dodge)).toBe('sin-fin-gravija-far');
    executeCommand(t.ctx, t.fin, dodge, true);
    expect([t.flags['sin.fin.hits'], wideDraws(t), queued(t)]).toEqual([1, 1, ['sin-fin-negation-far']]);
  });
});

describe('the Right Fin’s latch (m137 @0x445 to 0x469)', () => {
  const touch = (t: Fight): void => { act(t, 'tidus', 'slow'); };

  it('is set at a hit event once his HP is under 16,250 (strict), before the guard is looked at, and never clears', () => {
    const t = fight('sin-right-fin');
    t.fin.hp = 16_250;
    touch(t);
    expect(t.flags['sin.fin.latched']).toBe(false);
    t.fin.hp = 16_249;
    expect(idOf(chooseAiCommand(t.ctx, t.fin)), 'no hit event yet').toBe('sin-motionless');
    expect(t.flags['sin.fin.latched']).toBe(false);
    t.flags['sin.fin.negationGuard'] = true; // a swallowed event still latches
    touch(t);
    expect(t.flags['sin.fin.latched']).toBe(true);
    t.fin.hp = 60_000;
    touch(t);
    expect(t.flags['sin.fin.latched'], 'a Cura above the line does not undo it').toBe(true);
  });

  it('is the Right Fin’s alone', () => {
    const t = fight('sin-left-fin');
    t.fin.hp = 1_000;
    touch(t);
    expect(t.flags['sin.fin.latched']).toBe(false);
  });
});
