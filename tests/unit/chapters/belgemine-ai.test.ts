/**
 * **Belgemine's eight aeons' scripts** (the hidden Belgemine's Challenge chapter; **FFX only**): `src/battle/ffx/ai/belgemine.ts`, `belgemine-b.ts` and `belgemine-sisters.ts` pinned to the note's harness output
 * (`research/re-ffx-belgemine-aeon-duels.md` section 3, "RE 3.n": the ten monster scripts' real bytecode run in the earlier lanes' interpreter; the quoted lines below are its `t-belgemine.out.txt`, `t-extra.out.txt` and
 * `t-extra2.out.txt`). Each test sets the scripted stream's draws (a `GetRandomValue()` is `int(0, 65535)`; a pick among two or more candidates draws too, a pick among one draws nothing), plays the REAL script on the REAL
 * data and reads the command, the gauge and the flags it leaves.
 */

import { describe, expect, it } from 'vitest';
import type { Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { chooseAiCommand } from '../../../src/battle/ffx/index.ts';
import { runOnDeath, runOnHit } from '../../../src/battle/ffx/ai/hooks.ts';
import { rtOf } from '../../../src/battle/ffx/state.ts';
import { ALL_ABILITIES } from '../../../src/data/ffx/index.ts';
import { belgemineBuild } from '../../../src/data/ffx/builds/belgemine.ts';
import { MEM } from '../../../src/battle/ffx/ai/belgemine-rules.ts';
import { type LiveBattle, ScriptedRng, liveBattle, queuedCounters, takeQueuedCounters } from '../helpers/aiScript.ts';

const idOf = (c: Command | null): string => (c === null ? 'pass' : c.kind === 'ability' ? c.id : c.kind);
const aims = (c: Command | null): string[] => (c === null ? [] : [...c.targets]);

type Fight = LiveBattle & { rng: ScriptedRng; mem: (id: string) => Record<string, number | string | boolean> };

/** One act's battle on the chapter's own data and party; `opened` skips the Summon turn of every body. */
function fight(groupId: string, opened = true): Fight {
  const live = liveBattle(groupId, { party: belgemineBuild });
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  const mem = (id: string): Record<string, number | string | boolean> => rtOf(live.ctx, id).ai;
  if (opened) for (const id of live.ctx.state.enemyIds) mem(id)[MEM.firstDone] = true;
  return { ...live, rng, mem };
}

const act = (t: Fight, id: string): Command | null => chooseAiCommand(t.ctx, t.at(id));
const gauge = (t: Fight, id: string): number => t.at(id).overdrive?.gauge ?? 0;
const setGauge = (t: Fight, id: string, n: number): void => void (t.at(id).overdrive!.gauge = n);
const def = (id: string) => ALL_ABILITIES.find((a) => a.id === id)!;

/** The target is hit once by `abilityId` from Yuna's side: the script's `onHit`. */
function hit(t: Fight, target: string, abilityId: string, lastDamage = 100): void {
  const used = { def: def(abilityId), user: t.at('yuna') as FFXCombatant };
  runOnHit(t.ctx, used, t.at(target), { hpBefore: t.at(target).hp, lostHp: lastDamage > 0, lastDamage, affectsHp: true });
}
const MAGICAL = 'fira';
const PHYSICAL = 'pterya-sonic-wings';

describe('every aeon\'s first turn is the Summon, aimed at Belgemine, with no draw and no gauge', () => {
  const FIRST: Array<[string, string, string]> = [
    ['belgemine-1-valefor', 'belg-valefor', 'pterya-summon'], ['belgemine-2-ifrit', 'belg-ifrit', 'grothia-summon'], ['belgemine-3-ixion', 'belg-ixion', 'belg-summon-ixion'],
    ['belgemine-4-shiva', 'belg-shiva', 'belg-summon-shiva'], ['belgemine-5-bahamut', 'belg-bahamut', 'spathi-summon'], ['belgemine-6-yojimbo', 'belg-yojimbo', 'yojimbo-summon'],
    ['belgemine-7-anima', 'belg-anima', 'belg-summon-anima'], ['belgemine-8-sisters', 'belg-cindy', 'belg-summon-sisters'],
  ];
  for (const [group, body, row] of FIRST) {
    it(`${body}: ${row}`, () => {
      const t = fight(group, false);
      const command = act(t, body);
      expect(idOf(command)).toBe(row);
      expect(aims(command)).toEqual(['belgemine']);
      expect(t.rng.calls).toEqual([]);
      expect(gauge(t, body)).toBe(0);
    });
  }

  it('Belgemine owns no turn: her script passes', () => {
    expect(act(fight('belgemine-1-valefor'), 'belgemine')).toBeNull();
  });
});

describe('Valefor (RE 3.5)', () => {
  it('draw mod 3: 0 Sonic Wings, 1 and 2 Attack (the 0x407F row), +10 a turn: the harness\'s OD 10, 20, 30', () => {
    const t = fight('belgemine-1-valefor');
    t.rng.set(0, 1, 2);
    expect(idOf(act(t, 'belg-valefor'))).toBe('pterya-sonic-wings');
    expect(gauge(t, 'belg-valefor')).toBe(10);
    expect(idOf(act(t, 'belg-valefor'))).toBe('grothia-attack-yuna');
    expect(idOf(act(t, 'belg-valefor'))).toBe('grothia-attack-yuna');
    expect(gauge(t, 'belg-valefor')).toBe(30);
    expect(aims(act(t, 'belg-valefor'))).toEqual(['yuna']); // Yuna alone: the pick draws nothing
  });

  it('a magical hit adds 15 and raises the Ray flag; with the gauge at 30 or more the next turn is Energy Ray on the front line, then +10 (harness: 20 to 35, Ray, 45)', () => {
    const t = fight('belgemine-1-valefor');
    setGauge(t, 'belg-valefor', 20);
    hit(t, 'belg-valefor', MAGICAL);
    expect(gauge(t, 'belg-valefor')).toBe(35);
    expect(t.mem('belg-valefor')[MEM.rayFlag]).toBe(true);
    const command = act(t, 'belg-valefor');
    expect(idOf(command)).toBe('pterya-energy-ray');
    expect(gauge(t, 'belg-valefor')).toBe(45);
    expect(t.mem('belg-valefor')[MEM.rayFlag]).toBe(false);
  });

  it('a physical hit adds 5 and no flag (harness: 20 to 25, next turn Attack); a magical one under 30 raises the flag but the Ray waits for 30 and the flag is spent (10 to 25, Attack)', () => {
    const phys = fight('belgemine-1-valefor');
    setGauge(phys, 'belg-valefor', 20);
    hit(phys, 'belg-valefor', PHYSICAL);
    expect(gauge(phys, 'belg-valefor')).toBe(25);
    phys.rng.set(1);
    expect(idOf(act(phys, 'belg-valefor'))).toBe('grothia-attack-yuna');

    const low = fight('belgemine-1-valefor');
    setGauge(low, 'belg-valefor', 10);
    hit(low, 'belg-valefor', MAGICAL);
    expect(gauge(low, 'belg-valefor')).toBe(25);
    low.rng.set(1);
    expect(idOf(act(low, 'belg-valefor'))).toBe('grothia-attack-yuna');
    expect(low.mem('belg-valefor')[MEM.rayFlag]).toBe(false);
    setGauge(low, 'belg-valefor', 40);
    low.rng.set(1);
    expect(idOf(act(low, 'belg-valefor'))).toBe('grothia-attack-yuna'); // the flag was spent: 40 alone is no Ray
  });

  it('gauge 100: Energy Blast on the front line, gauge 0, no draw (harness: Energy Blast[0x40a6])', () => {
    const t = fight('belgemine-1-valefor');
    setGauge(t, 'belg-valefor', 100);
    const command = act(t, 'belg-valefor');
    expect(idOf(command)).toBe('belg-energy-blast');
    expect(gauge(t, 'belg-valefor')).toBe(0);
    expect(t.rng.calls).toEqual([]);
  });

  it('a hit that is itself a reaction (a counter\'s) adds nothing: the gate is isCounterattackAllowed', () => {
    const t = fight('belgemine-1-valefor');
    t.ctx.rt.inReaction = true;
    setGauge(t, 'belg-valefor', 30);
    hit(t, 'belg-valefor', MAGICAL);
    expect(gauge(t, 'belg-valefor')).toBe(30);
  });
});

describe('Ifrit (RE 3.6)', () => {
  it('Attack every turn until a physical hit; the hit adds 3 and raises the flag; the next turn is Meteor Strike, then Attack again; +7 a turn (harness: OD 24)', () => {
    const t = fight('belgemine-2-ifrit');
    expect(idOf(act(t, 'belg-ifrit'))).toBe('grothia-attack');
    expect(gauge(t, 'belg-ifrit')).toBe(7);
    hit(t, 'belg-ifrit', PHYSICAL);
    expect(gauge(t, 'belg-ifrit')).toBe(10);
    expect(idOf(act(t, 'belg-ifrit'))).toBe('belg-meteor-strike');
    expect(gauge(t, 'belg-ifrit')).toBe(17);
    expect(idOf(act(t, 'belg-ifrit'))).toBe('grothia-attack');
    expect(gauge(t, 'belg-ifrit')).toBe(24);
  });

  it('a magical hit adds 3 and raises no flag', () => {
    const t = fight('belgemine-2-ifrit');
    hit(t, 'belg-ifrit', MAGICAL);
    expect(gauge(t, 'belg-ifrit')).toBe(3);
    expect(idOf(act(t, 'belg-ifrit'))).toBe('grothia-attack');
  });

  it('MAG is written 35 on an ordinary turn and 48 for Hellfire (gauge 100: Hellfire on the front line, gauge 0)', () => {
    const t = fight('belgemine-2-ifrit');
    act(t, 'belg-ifrit');
    expect(t.at('belg-ifrit').stats.mag).toBe(35);
    setGauge(t, 'belg-ifrit', 100);
    expect(idOf(act(t, 'belg-ifrit'))).toBe('grothia-hellfire');
    expect(t.at('belg-ifrit').stats.mag).toBe(48);
    expect(gauge(t, 'belg-ifrit')).toBe(0);
  });

  it('with the flag raised and the gauge full, Hellfire goes first and the flag stays (the script\'s order)', () => {
    const t = fight('belgemine-2-ifrit');
    hit(t, 'belg-ifrit', PHYSICAL);
    setGauge(t, 'belg-ifrit', 100);
    expect(idOf(act(t, 'belg-ifrit'))).toBe('grothia-hellfire');
    expect(idOf(act(t, 'belg-ifrit'))).toBe('belg-meteor-strike');
  });
});

describe('Ixion (RE 3.7)', () => {
  it('his second call queues an Attack and goes on to the turn: brace or evade leave the Attack standing (harness T2: Attack, OD 5), Aerospark and Attack replace it (OD 10)', () => {
    for (const [draw, command, od] of [[0, 'grothia-attack', 5], [1, 'grothia-attack', 5], [2, 'belg-aerospark', 10], [3, 'grothia-attack', 10]] as const) {
      const t = fight('belgemine-3-ixion');
      t.rng.set(draw);
      expect(idOf(act(t, 'belg-ixion')), `draw ${draw}`).toBe(command);
      expect(gauge(t, 'belg-ixion'), `draw ${draw}`).toBe(od);
    }
  });

  it('after that: draw mod 4, 0 brace (no action, Defense and Magic Defense 255), 1 evade (no action, Evasion 255), 2 Aerospark, 3 Attack, +5 for the last two (harness T3: "-", OD 5)', () => {
    const t = fight('belgemine-3-ixion');
    t.mem('belg-ixion')[MEM.secondDone] = true;
    t.rng.set(0);
    expect(act(t, 'belg-ixion')).toBeNull();
    expect([t.at('belg-ixion').stats.def, t.at('belg-ixion').stats.mdef, t.at('belg-ixion').stats.eva]).toEqual([255, 255, 10]);
    expect(gauge(t, 'belg-ixion')).toBe(0);
    t.rng.set(1);
    expect(act(t, 'belg-ixion')).toBeNull();
    expect([t.at('belg-ixion').stats.def, t.at('belg-ixion').stats.mdef, t.at('belg-ixion').stats.eva]).toEqual([40, 40, 255]);
    t.rng.set(2);
    expect(idOf(act(t, 'belg-ixion'))).toBe('belg-aerospark');
    expect([t.at('belg-ixion').stats.def, t.at('belg-ixion').stats.eva]).toEqual([40, 10]); // reset every turn
    t.rng.set(3);
    expect(idOf(act(t, 'belg-ixion'))).toBe('grothia-attack');
    expect(gauge(t, 'belg-ixion')).toBe(10);
  });

  it('gauge 100: Thor\'s Hammer on the front line, gauge 0, no draw', () => {
    const t = fight('belgemine-3-ixion');
    t.mem('belg-ixion')[MEM.secondDone] = true;
    setGauge(t, 'belg-ixion', 100);
    expect(idOf(act(t, 'belg-ixion'))).toBe('belg-thors-hammer');
    expect(gauge(t, 'belg-ixion')).toBe(0);
    expect(t.rng.calls).toEqual([]);
  });

  it('braced: a magical hit adds 25, a physical one 5; evading: a physical hit adds 25, a magical one 5 (harness: 5 to 30 and to 10)', () => {
    const cell = (guard: 0 | 1, ability: string): number => {
      const t = fight('belgemine-3-ixion');
      t.mem('belg-ixion')[MEM.secondDone] = true;
      t.rng.set(guard);
      act(t, 'belg-ixion');
      setGauge(t, 'belg-ixion', 5);
      hit(t, 'belg-ixion', ability);
      return gauge(t, 'belg-ixion');
    };
    expect(cell(0, MAGICAL)).toBe(30);
    expect(cell(0, PHYSICAL)).toBe(10);
    expect(cell(1, PHYSICAL)).toBe(30);
    expect(cell(1, MAGICAL)).toBe(10);
  });
});

describe('Shiva (RE 3.8)', () => {
  it('above half HP: draw mod 4, 0 Heavenly Strike, 1 Blizzara, 2 and 3 Attack, +10 each (harness: 25% each of the first two, 50% Attack)', () => {
    const t = fight('belgemine-4-shiva');
    t.rng.set(0, 1, 2, 3);
    expect([act(t, 'belg-shiva'), act(t, 'belg-shiva'), act(t, 'belg-shiva'), act(t, 'belg-shiva')].map(idOf)).toEqual(['belg-heavenly-strike', 'blizzara', 'grothia-attack-yuna', 'grothia-attack-yuna']);
    expect(gauge(t, 'belg-shiva')).toBe(40);
  });

  it('under half HP: 0 Blizzaga on herself (+20, a heal: she absorbs Ice), 1 Heavenly Strike, 2 Blizzara, 3 Attack (+10)', () => {
    const t = fight('belgemine-4-shiva');
    t.at('belg-shiva').hp = 5_000;
    t.rng.set(0);
    const heal = act(t, 'belg-shiva');
    expect([idOf(heal), aims(heal)]).toEqual(['blizzaga', ['belg-shiva']]);
    expect(gauge(t, 'belg-shiva')).toBe(20);
    t.rng.set(1, 2, 3);
    expect([act(t, 'belg-shiva'), act(t, 'belg-shiva'), act(t, 'belg-shiva')].map(idOf)).toEqual(['belg-heavenly-strike', 'blizzara', 'grothia-attack-yuna']);
    expect(gauge(t, 'belg-shiva')).toBe(50);
  });

  it('gauge 100: Diamond Dust on the front line, gauge 0; a hit that took HP adds 5 and is NOT gated by the counter rule', () => {
    const t = fight('belgemine-4-shiva');
    setGauge(t, 'belg-shiva', 100);
    expect(idOf(act(t, 'belg-shiva'))).toBe('belg-diamond-dust');
    expect(gauge(t, 'belg-shiva')).toBe(0);
    t.ctx.rt.inReaction = true;
    hit(t, 'belg-shiva', PHYSICAL);
    expect(gauge(t, 'belg-shiva')).toBe(5);
    hit(t, 'belg-shiva', PHYSICAL, 0); // no HP taken
    expect(gauge(t, 'belg-shiva')).toBe(5);
  });
});

describe('Bahamut (RE 3.9)', () => {
  it('five empty turns (gauge 20, 40, 60, 80, 100), then Mega Flare on the front line and the gauge at 0, then empty again (harness: "-" x5, Mega Flare, "-" at 20)', () => {
    const t = fight('belgemine-5-bahamut');
    const seen: Array<[string, number]> = [];
    for (let i = 0; i < 8; i++) seen.push([idOf(act(t, 'belg-bahamut')), gauge(t, 'belg-bahamut')]);
    expect(seen).toEqual([['pass', 20], ['pass', 40], ['pass', 60], ['pass', 80], ['pass', 100], ['spathi-mega-flare', 0], ['pass', 20], ['pass', 40]]);
    expect(t.rng.calls).toEqual([]);
  });

  it('every allowed hit is countered with an Attack on the attacker; the fifth, and every fifth after, with Impulse on the front line (harness: hits 1 to 4 Attack, 5 Impulse, 6 Attack)', () => {
    const t = fight('belgemine-5-bahamut');
    const out: string[] = [];
    for (let i = 0; i < 6; i++) {
      hit(t, 'belg-bahamut', PHYSICAL);
      const q = takeQueuedCounters(t.ctx);
      out.push(...q.map((c) => `${c.actorId}:${idOf(c.command)}>${aims(c.command).join(',')}`));
    }
    expect(out).toEqual([
      'belg-bahamut:grothia-attack-yuna>yuna', 'belg-bahamut:grothia-attack-yuna>yuna', 'belg-bahamut:grothia-attack-yuna>yuna', 'belg-bahamut:grothia-attack-yuna>yuna', 'belg-bahamut:belg-impulse>',
      'belg-bahamut:grothia-attack-yuna>yuna',
    ]);
  });

  it('a hit that is itself a reaction is not counted and not answered', () => {
    const t = fight('belgemine-5-bahamut');
    t.ctx.rt.inReaction = true;
    hit(t, 'belg-bahamut', PHYSICAL);
    expect(queuedCounters(t.ctx)).toEqual([]);
    expect(t.mem('belg-bahamut')[MEM.hits]).toBeUndefined();
  });
});

describe('Yojimbo and the dog (RE 3.10)', () => {
  it('the bands: under 25 the dog; 25 to 49 Kozuka one in four, the dog otherwise; 50 to 79 Wakizashi one in five, Kozuka one in five; 80 to 99 Wakizashi and Kozuka one in four each; 100 Zanmato', () => {
    const roll = (g: number, draw: number): string => {
      const t = fight('belgemine-6-yojimbo');
      setGauge(t, 'belg-yojimbo', g);
      t.rng.set(draw);
      return idOf(act(t, 'belg-yojimbo'));
    };
    expect([roll(0, 0), roll(24, 3)]).toEqual(['belg-daigoro-order', 'belg-daigoro-order']);
    expect([roll(25, 0), roll(25, 1), roll(49, 3)]).toEqual(['yojimbo-kozuka', 'belg-daigoro-order', 'belg-daigoro-order']);
    expect([roll(50, 0), roll(50, 1), roll(50, 2), roll(79, 4)]).toEqual(['yojimbo-wakizashi', 'yojimbo-kozuka', 'belg-daigoro-order', 'belg-daigoro-order']);
    expect([roll(80, 0), roll(80, 1), roll(80, 2), roll(99, 3)]).toEqual(['yojimbo-wakizashi', 'yojimbo-kozuka', 'belg-daigoro-order', 'belg-daigoro-order']);
    expect(roll(100, 0)).toBe('yojimbo-zanmato');
  });

  it('the order is aimed at the dog; +2 after every turn but the Summon, Zanmato\'s included (it ends at 2); an allowed hit adds 3', () => {
    const t = fight('belgemine-6-yojimbo');
    const order = act(t, 'belg-yojimbo');
    expect(aims(order)).toEqual(['belg-daigoro']);
    expect(gauge(t, 'belg-yojimbo')).toBe(2);
    hit(t, 'belg-yojimbo', PHYSICAL);
    expect(gauge(t, 'belg-yojimbo')).toBe(5);
    setGauge(t, 'belg-yojimbo', 100);
    expect(idOf(act(t, 'belg-yojimbo'))).toBe('yojimbo-zanmato');
    expect(gauge(t, 'belg-yojimbo')).toBe(2);
    t.ctx.rt.inReaction = true;
    hit(t, 'belg-yojimbo', PHYSICAL);
    expect(gauge(t, 'belg-yojimbo')).toBe(2);
  });

  it('the dog owns no turn', () => {
    expect(act(fight('belgemine-6-yojimbo'), 'belg-daigoro')).toBeNull();
  });
});

describe('Anima (RE 3.11)', () => {
  it('draw mod 10: 0 Dispel, 1 and 2 Demi, 3 to 5 Pain, 6 to 9 Attack; her own actions add nothing (harness: OD 0 after every draw)', () => {
    const t = fight('belgemine-7-anima');
    const rows: string[] = [];
    for (let d = 0; d < 10; d++) {
      t.rng.set(d);
      rows.push(idOf(act(t, 'belg-anima')));
    }
    expect(rows).toEqual(['dispel', 'demi', 'demi', 'belg-pain', 'belg-pain', 'belg-pain', 'belg-anima-attack', 'belg-anima-attack', 'belg-anima-attack', 'belg-anima-attack']);
    expect(gauge(t, 'belg-anima')).toBe(0);
  });

  it('every hit adds 5, even one that is itself a reaction; at 100 the next turn is Oblivion on the front line and the gauge goes to 0', () => {
    const t = fight('belgemine-7-anima');
    t.ctx.rt.inReaction = true;
    for (let i = 0; i < 20; i++) hit(t, 'belg-anima', PHYSICAL);
    expect(gauge(t, 'belg-anima')).toBe(100);
    expect(idOf(act(t, 'belg-anima'))).toBe('belg-oblivion');
    expect(gauge(t, 'belg-anima')).toBe(0);
  });
});

describe('the Magus Sisters (RE 3.12)', () => {
  const SISTERS = ['belg-mindy', 'belg-sandy', 'belg-cindy'];

  it('Mindy: draw mod 6 over the first table (Flare, Thundara, Fira, Blizzara, Watera, Passado) at a quarter of her HP or more, the second (Ultima, Thundaga, Firaga, Blizzaga, Waterga, Passado) under it; +10', () => {
    const t = fight('belgemine-8-sisters');
    t.rng.set(0, 1, 2, 3, 4, 5);
    expect(Array.from({ length: 6 }, () => idOf(act(t, 'belg-mindy')))).toEqual(['flare', 'thundara', 'fira', 'blizzara', 'watera', 'belg-passado']);
    expect(gauge(t, 'belg-mindy')).toBe(60);
    t.at('belg-mindy').hp = 4_999;
    t.rng.set(0, 1, 2, 3, 4, 5);
    expect(Array.from({ length: 6 }, () => idOf(act(t, 'belg-mindy')))).toEqual(['ultima', 'thundaga', 'firaga', 'blizzaga', 'waterga', 'belg-passado']);
    t.at('belg-mindy').hp = 5_000;
    t.rng.set(0);
    expect(idOf(act(t, 'belg-mindy'))).toBe('flare'); // exactly a quarter is not under it
  });

  it('Sandy: draw mod 4, 0 Razzia, otherwise Attack; +10 (harness: Razzia on draw 0, Attack on 1 to 3)', () => {
    const t = fight('belgemine-8-sisters');
    t.rng.set(0, 1, 2, 3);
    expect(Array.from({ length: 4 }, () => idOf(act(t, 'belg-sandy')))).toEqual(['belg-razzia', 'grothia-attack-yuna', 'grothia-attack-yuna', 'grothia-attack-yuna']);
    expect(gauge(t, 'belg-sandy')).toBe(40);
  });

  it('Cindy: the Summon first; Mighty Guard on her third turn after it, then every seventh (the counter starts at 4), on the three, +5 (harness: Summon, Shell, Shell, Mighty Guard[25])', () => {
    const t = fight('belgemine-8-sisters', false);
    expect(idOf(act(t, 'belg-cindy'))).toBe('belg-summon-sisters');
    const turns: string[] = [];
    for (let i = 0; i < 12; i++) {
      t.rng.set(1, 0, 0, 0); // never the spell branch, no pick draws needed beyond the scripted ones
      turns.push(idOf(act(t, 'belg-cindy')));
    }
    expect(turns.indexOf('belg-mighty-guard')).toBe(2);
    expect(turns.lastIndexOf('belg-mighty-guard')).toBe(9);
    expect(turns.filter((x) => x === 'belg-mighty-guard')).toHaveLength(2);
    const guard = fight('belgemine-8-sisters');
    guard.mem('belg-cindy')[ 'belgemine.guardCount' ] = 6;
    const command = act(guard, 'belg-cindy');
    expect(idOf(command)).toBe('belg-mighty-guard');
    expect(aims(command).sort()).toEqual([...SISTERS].sort());
    expect(gauge(guard, 'belg-cindy')).toBe(5);
  });

  it('Cindy: all three gauges at 100 and all three alive: the Delta Attack on the front line, all three gauges 0, no draw, the counter untouched', () => {
    const t = fight('belgemine-8-sisters');
    for (const id of SISTERS) setGauge(t, id, 100);
    const command = act(t, 'belg-cindy');
    expect(idOf(command)).toBe('belg-delta-attack');
    expect(SISTERS.map((id) => gauge(t, id))).toEqual([0, 0, 0]);
    expect(t.rng.calls).toEqual([]);
    expect(t.mem('belg-cindy')['belgemine.guardCount']).toBeUndefined();
  });

  it('Cindy: one Sister down and the Delta Attack is over for good (the death handler writes her gauge 0)', () => {
    const t = fight('belgemine-8-sisters');
    for (const id of SISTERS) setGauge(t, id, 100);
    t.at('belg-mindy').hp = 0;
    t.at('belg-mindy').alive = false;
    runOnDeath(t.ctx, t.at('belg-mindy'), 'yuna');
    expect(gauge(t, 'belg-mindy')).toBe(0);
    t.rng.set(1, 0, 0, 0);
    expect(idOf(act(t, 'belg-cindy'))).not.toBe('belg-delta-attack');
  });

  it('Cindy: all three under half HP, then one draw in four is White Wind on the Sisters, +5 (harness: draw 0 White Wind, draw 1 Shell)', () => {
    const t = fight('belgemine-8-sisters');
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    for (const id of SISTERS) t.at(id).hp = Math.floor(t.at(id).stats.maxHp / 2) - 1;
    t.rng.set(0);
    const command = act(t, 'belg-cindy');
    expect(idOf(command)).toBe('belg-white-wind');
    expect(aims(command).sort()).toEqual([...SISTERS].sort());
    expect(gauge(t, 'belg-cindy')).toBe(5);
    // draw 1: no White Wind; the next draw (0) is the spell branch, then Holy (pick 0)
    t.rng.set(1, 0, 0);
    expect(idOf(act(t, 'belg-cindy'))).toBe('holy');
  });

  it('Cindy: one draw in four a spell by a second draw mod 6: Holy, Drain, Osmose, Demi, Dispel, Camisade; +10', () => {
    const t = fight('belgemine-8-sisters');
    const rows: string[] = [];
    for (let pick = 0; pick < 6; pick++) {
      t.mem('belg-cindy')['belgemine.guardCount'] = 0;
      t.rng.set(0, pick);
      rows.push(idOf(act(t, 'belg-cindy')));
    }
    expect(rows).toEqual(['holy', 'drain', 'osmose-spell', 'demi', 'dispel', 'belg-camisade']);
    expect(gauge(t, 'belg-cindy')).toBe(60);
  });

  it('Cindy\'s buffs: Shell on a Sister who lacks it, else Protect on one who lacks it, else Cura one time in three and Regen otherwise (+10)', () => {
    const t = fight('belgemine-8-sisters');
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    t.rng.set(1, 0); // not the spell branch; the pick among the three who lack Shell takes index 0 (Mindy)
    const shell = act(t, 'belg-cindy');
    expect([idOf(shell), aims(shell)]).toEqual(['shell', ['belg-mindy']]);
    expect(gauge(t, 'belg-cindy')).toBe(10);
    for (const id of SISTERS) (t.at(id).statuses as Record<string, unknown>)['shell'] = { id: 'shell', turnsRemaining: 6, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    t.rng.set(1, 2);
    const protect = act(t, 'belg-cindy');
    expect([idOf(protect), aims(protect)]).toEqual(['protect', ['belg-cindy']]);
    for (const id of SISTERS) (t.at(id).statuses as Record<string, unknown>)['protect'] = { id: 'protect', turnsRemaining: 6, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    t.rng.set(1, 1, 0); // the buff branch, then the draw mod 3 (1: Regen), then the pick of a Sister
    expect(idOf(act(t, 'belg-cindy'))).toBe('regen');
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    t.rng.set(1, 2, 1);
    expect(idOf(act(t, 'belg-cindy'))).toBe('regen');
    t.mem('belg-cindy')['belgemine.guardCount'] = 0;
    t.rng.set(1, 0, 0);
    expect(idOf(act(t, 'belg-cindy'))).toBe('cura');
  });

  it('a Sister\'s hit that took HP adds 5, gated by the counter rule; one that took none adds nothing', () => {
    const t = fight('belgemine-8-sisters');
    for (const id of SISTERS) {
      hit(t, id, PHYSICAL);
      expect(gauge(t, id), id).toBe(5);
      hit(t, id, PHYSICAL, 0);
      expect(gauge(t, id), id).toBe(5);
    }
    t.ctx.rt.inReaction = true;
    hit(t, 'belg-mindy', PHYSICAL);
    expect(gauge(t, 'belg-mindy')).toBe(5);
  });
});
