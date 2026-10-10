/**
 * **The possessed aeons follow their own scripts** (re-parity, AI lane B; FFX only; Chapter III, links 2 to 6).
 *
 * The decision tables are `research/re-ffx-ai-yunalesca-bfa.md` section 5 (m163 to m169 in `sins07_00` to `sins07_06`).
 * Rows A3 to A8 of the note's section 9 (the chain's order and the Magus Sisters, A1 and A2, are Bailey's: "Keep fixed chain
 * for now", D-412):
 *
 *   A3 the stats the aeon copies from the player's own, and the ones it does not (Luck 0, MP 1)
 *   A4 affinities (Ifrit absorbs Fire, Ixion Thunder, Shiva Ice) and immunity to Slow
 *   A5 the move tables: a draw for the target first, then the roll; special on a 50% roll or against a counter, else Attack
 *   A6 the gauge: mod 10 on its own turn and per hit event, ignored at 0 HP, at 100 or by a command that does not touch HP
 *   A7 a character the fayth revives acts next (CTB 0)
 *   A8 the opening turn order: the aeon first, the Pagodas at 24, the party two ticks later
 */

import { describe, expect, it } from 'vitest';
import type { AbilityDef, Command, FFXCombatant } from '../../src/battle/common/types.ts';
import { SeededRng } from '../../src/battle/common/rng.ts';
import { chooseAiCommand, koActor, resolveAbility } from '../../src/battle/ffx/index.ts';
import { rtOf } from '../../src/battle/ffx/state.ts';
import { seedInitialCtb } from '../../src/battle/ffx/turnQueue.ts';
import { buildPossessedAeonChain } from '../../src/data/ffx/enemies/braskas-final-aeon.ts';
import { dreamsEndBuild } from '../../src/data/ffx/builds/dreams-end.ts';
import { ability } from './ffx-fixtures.test.ts';
import { type LiveBattle, ScriptedRng, liveBattle } from './helpers/aiScript.ts';

const idOf = (command: Command | null): string => (command === null ? 'pass' : command.kind === 'ability' ? command.id : command.kind);
const targetsOf = (command: Command | null): string[] => (command === null ? [] : [...command.targets]);
const PARTY = ['tidus', 'yuna', 'auron'];
const FIVE = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'] as const;

type Fight = LiveBattle & { rng: ScriptedRng; aeon: FFXCombatant; mem: Record<string, number | string | boolean> };

/** A possessed-aeon battle on the shipped data, its first (no-effect) turn already taken. */
function fight(aeonId: string, options: { opened?: boolean } = {}): Fight {
  const group = buildPossessedAeonChain([aeonId as 'valefor'])[0];
  const live = liveBattle(`possessed-${aeonId}`, group ? { group } : {});
  const rng = new ScriptedRng();
  live.ctx.rng = rng;
  const aeon = live.at(`possessed-${aeonId}`);
  const mem = rtOf(live.ctx, aeon.id).ai;
  if (options.opened !== false) mem['opened'] = 1;
  return { ...live, rng, aeon, mem };
}

const GAUGE = 'aeon.gauge';

describe('what the aeon copies from the player’s (A3) and what it keeps (A4)', () => {
  it.each(FIVE)('possessed %s takes the party aeon’s Strength, Defense, Magic, Magic Defense, Agility, Evasion, Accuracy and HP; Luck 0, MP 1', (id) => {
    const t = fight(id);
    const mine = dreamsEndBuild.aeons.find((a) => a.id === id)!.stats;
    const s = t.aeon.stats;
    expect([s.str, s.def, s.mag, s.mdef, s.agi, s.eva, s.acc, s.maxHp]).toEqual([mine.str, mine.def, mine.mag, mine.mdef, mine.agi, mine.eva, mine.acc, mine.maxHp]);
    expect([t.aeon.hp, s.hp, s.luck, s.mp, s.maxMp, t.aeon.mp]).toEqual([mine.maxHp, mine.maxHp, 0, 1, 1, 1]);
  });

  it('Ifrit absorbs Fire, Ixion Thunder and Shiva Ice; Valefor and Bahamut have no affinity; every one is immune to Slow', () => {
    const affinities = Object.fromEntries(FIVE.map((id) => [id, fight(id).aeon.affinities]));
    expect(affinities).toEqual({
      valefor: {}, ifrit: { fire: 'absorb' }, ixion: { lightning: 'absorb' }, shiva: { ice: 'absorb' }, bahamut: {},
    });
    for (const id of FIVE) expect(fight(id).aeon.immunities['slow'], id).toBe(255);
  });
});

describe('its first turn and the move tables (A5; m163 f2 @0x02D6 and its siblings)', () => {
  /** The special each aeon's script names, and what its Attack row is. */
  const SPECIAL: Record<(typeof FIVE)[number], string> = {
    valefor: 'possessed-valefor-sonic-wings',
    ifrit: 'possessed-ifrit-meteor-strike',
    ixion: 'possessed-ixion-aerospark',
    shiva: 'possessed-shiva-heavenly-strike',
    bahamut: 'possessed-bahamut-impulse',
  };

  /** Give a party member an auto-ability through a copy of its gear (the build's gear objects are shared). */
  function wears(t: Fight, id: string, auto: 'counterattack' | 'evade-and-counter'): void {
    const gear = t.at(id).equipment!;
    t.at(id).equipment = {
      weapon: { ...gear.weapon, autoAbilities: [...gear.weapon.autoAbilities, auto] },
      armor: { ...gear.armor, autoAbilities: [...gear.armor.autoAbilities] },
    };
  }

  it('opens with a no-effect turn: "Possessed by Yu Yevon", no attack', () => {
    const t = fight('valefor', { opened: false });
    expect(chooseAiCommand(t.ctx, t.aeon)).toBeNull();
    expect(t.events.some((e) => e.type === 'message' && e.text.includes('Possessed by Yu Yevon'))).toBe(true);
    expect(t.rng.calls, 'nothing is rolled').toEqual([]);
    t.rng.feed(0);
    expect(chooseAiCommand(t.ctx, t.aeon)).not.toBeNull();
  });

  it.each(['valefor', 'ifrit', 'ixion', 'shiva'] as const)(
    '%s: picks a random living actor first, then rolls: the special on under 50, else the special against a counter, else Attack',
    (id) => {
      for (const [roll, counter, expected] of [
        [49, false, SPECIAL[id]], [0, false, SPECIAL[id]], [50, false, 'attack'], [99, false, 'attack'], [50, true, SPECIAL[id]],
      ] as const) {
        const t = fight(id);
        if (counter) wears(t, 'yuna', 'counterattack');
        t.rng.feed(1);
        t.rng.wide.push(roll, 0);
        const command = chooseAiCommand(t.ctx, t.aeon);
        expect([idOf(command), targetsOf(command)], `roll ${roll}${counter ? ' against a counter' : ''}`).toEqual([expected, ['yuna']]);
        expect(t.rng.calls, 'the pick (three living), the roll, then the gauge').toEqual([[0, 2], [0, 0xffff], [0, 0xffff]]);
      }
    },
  );

  it('Evade and Counter counts as a counter too', () => {
    const t = fight('ifrit');
    wears(t, 'yuna', 'evade-and-counter');
    t.rng.feed(1);
    t.rng.wide.push(99, 0);
    expect(idOf(chooseAiCommand(t.ctx, t.aeon))).toBe(SPECIAL.ifrit);
  });

  it('Bahamut: Impulse on the whole front line on a 50% roll or against a counter, else Attack on the actor it picked', () => {
    for (const [roll, counter, want] of [[49, false, 'impulse'], [50, false, 'attack'], [50, true, 'impulse']] as const) {
      const t = fight('bahamut');
      if (counter) wears(t, 'auron', 'counterattack');
      t.rng.feed(2);
      t.rng.wide.push(roll, 0);
      const command = chooseAiCommand(t.ctx, t.aeon);
      expect([idOf(command), targetsOf(command)], `roll ${roll}`).toEqual(want === 'impulse' ? [SPECIAL.bahamut, PARTY] : ['attack', ['auron']]);
    }
  });

  it('Anima: Pain on a random living actor, always; the pick is the only roll of the turn besides the gauge', () => {
    const t = fight('anima');
    t.rng.feed(0);
    t.rng.wide.push(4);
    const command = chooseAiCommand(t.ctx, t.aeon);
    expect([idOf(command), targetsOf(command)]).toEqual(['possessed-anima-pain', ['tidus']]);
    expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff]]);
    expect(t.mem[GAUGE]).toBe(4);
  });

  it('Yojimbo: one coin picks Kozuka or Wakizashi, never Attack (one row stands for both here: a data gap)', () => {
    for (const coin of [0, 1]) {
      const t = fight('yojimbo');
      t.rng.feed(1);
      t.rng.wide.push(coin, 0);
      const command = chooseAiCommand(t.ctx, t.aeon);
      expect(idOf(command)).toBe('possessed-yojimbo-daigoro');
      expect(targetsOf(command)).toEqual(['yuna']);
      expect(t.rng.calls).toEqual([[0, 2], [0, 0xffff], [0, 0xffff]]);
    }
  });

  it('takes no draw for the target when one actor is left', () => {
    const t = fight('valefor');
    for (const id of ['tidus', 'auron']) t.at(id).alive = false;
    t.rng.wide.push(10, 0);
    const command = chooseAiCommand(t.ctx, t.aeon);
    expect(targetsOf(command)).toEqual(['yuna']);
    expect(t.rng.calls).toEqual([[0, 0xffff], [0, 0xffff]]);
  });

  it('lands a special on exactly the actor the script aimed at, and Energy Ray / Impulse on the whole front line', () => {
    const t = fight('valefor');
    /** Who took a damage event since the last look (HP is no witness: the fayth's Auto-Life refills a KO). */
    let seen = 0;
    const hurt = (): string[] => {
      const ids = t.events.slice(seen).filter((e) => e.type === 'damage').map((e) => (e.type === 'damage' ? e.targetId : ''));
      seen = t.events.length;
      return [...new Set(ids)];
    };
    resolveAbility(t.ctx, t.aeon, t.ctx.content.ability('possessed-valefor-sonic-wings')!, ['yuna']);
    expect(hurt(), 'one actor hurt').toEqual(['yuna']);
    resolveAbility(t.ctx, t.aeon, t.ctx.content.ability('possessed-valefor-energy-ray')!, PARTY);
    expect(hurt(), 'the whole front line hurt').toEqual(PARTY);
    resolveAbility(t.ctx, t.aeon, t.ctx.content.ability('possessed-bahamut-impulse')!, PARTY);
    expect(hurt()).toEqual(PARTY);
    resolveAbility(t.ctx, t.aeon, t.ctx.content.ability('possessed-ifrit-meteor-strike')!, ['auron']);
    expect(hurt(), 'Meteor Strike on the one it was aimed at').toEqual(['auron']);
  });
});

describe('the Overdrive gauge (A6; m163 f2 @0x035E and f4 @0x03F0)', () => {
  const hit = (t: Fight, attacker = 'tidus', def?: AbilityDef): void =>
    void resolveAbility(t.ctx, t.at(attacker), def ?? t.ctx.content.ability('attack')!, [t.aeon.id]);

  it('adds mod 10 after each turn it attacks, clamps at 100, and re-reads nothing else', () => {
    const t = fight('valefor');
    t.rng.feed(0);
    t.rng.wide.push(0, 7);
    chooseAiCommand(t.ctx, t.aeon);
    expect(t.mem[GAUGE]).toBe(7);
    t.mem[GAUGE] = 95;
    t.rng.feed(0);
    t.rng.wide.push(0, 9);
    chooseAiCommand(t.ctx, t.aeon);
    expect(t.mem[GAUGE]).toBe(100);
  });

  it('spends a full gauge on the Overdrive, forced on the whole front line, with no pick, no roll and no gain', () => {
    const expected: Record<string, string> = {
      valefor: 'possessed-valefor-energy-ray',
      ifrit: 'possessed-ifrit-hellfire',
      ixion: 'possessed-ixion-thors-hammer',
      shiva: 'possessed-shiva-diamond-dust',
      bahamut: 'possessed-bahamut-mega-flare',
      anima: 'possessed-anima-oblivion',
      yojimbo: 'possessed-yojimbo-zanmato',
    };
    for (const [id, overdrive] of Object.entries(expected)) {
      const t = fight(id);
      t.mem[GAUGE] = 100;
      const command = chooseAiCommand(t.ctx, t.aeon);
      expect([idOf(command), targetsOf(command)], id).toEqual([overdrive, PARTY]);
      expect(t.mem[GAUGE], id).toBe(0);
      expect(t.rng.calls, `${id}: nothing is drawn on an Overdrive turn`).toEqual([]);
    }
  });

  it('Valefor’s is Energy Blast when the party’s Valefor knows it (read once, at the start), else Energy Ray', () => {
    const t = fight('valefor');
    t.ctx.rt.aeonRoster.get('valefor')!.overdrive!.unlockedOverdriveIds.push('energy-blast');
    t.mem[GAUGE] = 100;
    expect(idOf(chooseAiCommand(t.ctx, t.aeon))).toBe('possessed-valefor-energy-blast');
  });

  it('adds mod 10 for every action that reaches it and touches HP, a miss included', () => {
    const t = fight('ixion');
    t.rng.wide.push(6);
    hit(t);
    expect(t.mem[GAUGE]).toBe(6);
    applyDarkness(t);
    t.rng.set(100, 100, 100, 100);
    t.rng.wide.push(2);
    hit(t);
    expect(t.events.some((e) => e.type === 'miss'), 'the swing missed').toBe(true);
    expect(t.mem[GAUGE], 'a miss is still a hit event').toBe(8);
  });

  it('ignores a command that does not touch HP, a hit at a full gauge and a hit that kills it', () => {
    const t = fight('shiva');
    resolveAbility(t.ctx, t.at('yuna'), ability({ id: 'poke', name: 'poke', category: 'skill', targeting: 'single-enemy', canMiss: false }), [t.aeon.id]);
    expect(t.mem[GAUGE], 'no HP class: no gauge').toBeUndefined();
    t.mem[GAUGE] = 100;
    t.rng.wide.push(5);
    hit(t);
    expect(t.mem[GAUGE]).toBe(100);
    expect(t.rng.calls.filter(([, hi]) => hi === 0xffff), 'and no draw taken').toEqual([]);
    t.mem[GAUGE] = 40;
    t.aeon.hp = 1;
    t.rng.wide.push(5);
    resolveAbility(t.ctx, t.at('tidus'), ability({ id: 'killer', name: 'killer', category: 'skill', formula: 'fixed-no-variance', power: 200, damageType: 'physical', canMiss: false, targeting: 'single-enemy' }), [t.aeon.id]);
    expect(t.aeon.hp).toBe(0);
    expect(t.mem[GAUGE], 'HP 0 returns before the gain').toBe(40);
  });

  it('clamps at 100', () => {
    const t = fight('bahamut');
    t.mem[GAUGE] = 97;
    t.rng.wide.push(9);
    hit(t);
    expect(t.mem[GAUGE]).toBe(100);
  });
});

/** Darkness on Tidus so his swing can miss. */
function applyDarkness(t: Fight): void {
  t.at('tidus').statuses['darkness'] = { id: 'darkness', turnsRemaining: 3, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
}

describe('the opening and the fayth’s revival (A7, A8)', () => {
  it('the possessed aeon acts first, both Pagodas wait 24 ticks and the party two more than usual', () => {
    for (const id of FIVE) {
      const t = fight(id);
      const seeded = fight(id);
      // What the engine had before the possession opening: the same 26 opening draws again (re-parity W2: the opening is the game's
      // fixed draws now, not a jitter the old 'scripted' start left out), from the battle's own seed.
      seeded.ctx.rng = new SeededRng(1);
      seedInitialCtb(seeded.ctx, 'scripted');
      const ctb = (f: Fight, who: string): number => rtOf(f.ctx, who).ctb;
      expect(ctb(t, `possessed-${id}`), id).toBe(0);
      expect([ctb(t, 'yu-pagoda-left'), ctb(t, 'yu-pagoda-right')], id).toEqual([24, 24]);
      for (const member of PARTY) expect(ctb(t, member), `${id} ${member}`).toBe(ctb(seeded, member) + 2);
    }
  });

  it('Yu Yevon’s battle moves the Pagodas to 24 and the party one tick, and leaves his own counter to the engine', () => {
    const t = liveBattle('yu-yevon');
    const seeded = liveBattle('yu-yevon');
    seeded.ctx.rng = new SeededRng(1); // the same 26 opening draws again (re-parity W2), from the battle's own seed
    seedInitialCtb(seeded.ctx, 'scripted');
    const ctb = (b: LiveBattle, who: string): number => rtOf(b.ctx, who).ctb;
    for (const pagoda of ['yu-pagoda-left', 'yu-pagoda-right']) expect(ctb(t, pagoda)).toBe(24);
    for (const member of PARTY) expect(ctb(t, member)).toBe(ctb(seeded, member) + 1);
    expect(ctb(t, 'yu-yevon'), 'the hook never writes his own').toBe(ctb(seeded, 'yu-yevon'));
  });

  it('a character the fayth revives gets CTB 0 and a quarter of its HP, and keeps the gift', () => {
    const t = fight('valefor');
    const tidus = t.at('tidus');
    rtOf(t.ctx, 'tidus').ctb = 77;
    koActor(t.ctx, tidus, t.aeon.id);
    expect([tidus.alive, tidus.hp, rtOf(t.ctx, 'tidus').ctb]).toEqual([true, Math.floor(tidus.stats.maxHp / 4), 0]);
    expect(tidus.statuses['auto-life']?.permanent).toBe(true);
  });
});
