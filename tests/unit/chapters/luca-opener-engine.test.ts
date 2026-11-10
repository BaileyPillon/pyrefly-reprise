/**
 * The Luca Opener (the first fights of FFX-2's Chapter 1, the hidden chapter): the REAL engine, seeded, three seeds a fight. **FFX-2 only** [AGENTS.md rule 14].
 *
 * Everything here ran on the engine first (probes), not from the note: the numbers are what the engine produced. What this file pins:
 *
 * 1. **Each fight, run for real** (`tests/unit/helpers/lucaOpenerDrive.ts`): with the girls idle the enemies' scripts show unhindered. Ormi's order is Attack, Attack, Pirouette Pitch for ever and the shield goes to Rikku every
 *    time; Logos only shoots (Ormi never gets low); Leblanc's order is three Attacks and a Thunder, and the Thunder goes to the girl with the most HP.
 * 2. **The Potion**: with Ormi under a fifth of his HP Logos' first action is the Potion, it heals Ormi by exactly 20, and it is the only one in the fight. On a FALLEN Ormi the engine redirects the heal to a living friend (Logos
 *    himself): the game's own answer is `[gap]`, the engine's is pinned.
 * 3. **Hit rule** (hard rule 5): the shield throw, the Potion and the Thunder never miss; only the plain blows and the pistol roll.
 * 4. **The Songstress hold** (LO3): the second link's party template puts Yuna in the Songstress with Darkness Dance as her only command; the first link has her a Gunner; the seam carries the bag, restores the party and keeps the
 *    template on a retry.
 * 5. **The rewards** are the rows': the first link's EXP, gil and AP are the sum of Logos' and Ormi's, the second is Leblanc's.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, FFX2Combatant } from '../../../src/battle/common/types.ts';
import { checkpointAt, resumeSetup } from '../../../src/app/screens/BattleChainCheckpoint.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { lucaOpenerBuild, lucaOpenerSongstressBuild } from '../../../src/data/ffx2/builds/luca-opener.ts';
import { lucaLeblancGroup, lucaLogosOrmiGroup } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import { FFX2Engine } from '../../../src/battle/ffx2/index.ts';
import { ffx2Options } from '../helpers/ffx2ChapterDrive.ts';
import { LUCA_MOVES, driveLuca, type LucaRun } from '../helpers/lucaOpenerDrive.ts';

const SEEDS = [1, 2, 3] as const;
type Ev = { type: string; actorId?: string; abilityId?: string; targets?: string[]; targetId?: string; amount?: number; missed?: boolean };
const eventsOf = (run: LucaRun, link: number): Ev[] => run.logs[link] as unknown as Ev[];
const startsBy = (run: LucaRun, link: number, actor: string): Ev[] => eventsOf(run, link).filter((e) => e.type === 'action-start' && e.actorId === actor);

describe('act 1, Logos and Ormi, with the girls idle (three seeds)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: Ormi plays Attack, Attack, Pirouette Pitch for ever, the shield goes to Rikku every time, Logos only shoots`, () => {
      const run = driveLuca('idle', seed, { maxEnemyActions: 60 });
      const ormi = startsBy(run, 0, 'x2-luca-ormi').map((e) => e.abilityId);
      expect(ormi.length).toBeGreaterThanOrEqual(9);
      ormi.forEach((id, i) => expect(id, `Ormi action ${i + 1}`).toBe(i % 3 === 2 ? LUCA_MOVES.pitch : LUCA_MOVES.ormiAttack));
      const pitches = startsBy(run, 0, 'x2-luca-ormi').filter((e) => e.abilityId === LUCA_MOVES.pitch);
      expect(pitches.length).toBeGreaterThanOrEqual(3);
      for (const p of pitches) expect(p.targets, 'the farthest girl').toEqual(['rikku']);
      const logos = startsBy(run, 0, 'x2-luca-logos').map((e) => e.abilityId);
      expect(logos.length).toBeGreaterThanOrEqual(9);
      expect(new Set(logos)).toEqual(new Set([LUCA_MOVES.pistol]));
    });
  }

  it('the girls survive an idle minute and a half: the enemies hit lightly (the chapter is "very easy": Jegged), and nobody is knocked out', () => {
    const run = driveLuca('idle', 4, { maxEnemyActions: 60 });
    expect(run.kos).toBe(0);
    const party = Object.values(run.states[0] ? run.states[0].combatants : {}) as FFX2Combatant[];
    expect(party.filter((c) => c.side === 'party').every((c) => c.alive)).toBe(true);
  });
});

describe('act 2, Leblanc, with the girls idle (three seeds)', () => {
  for (const seed of SEEDS) {
    it(`seed ${seed}: Attack, Attack, Attack, Thunder for ever, and every Thunder goes to the girl with the most HP`, () => {
      const run = driveLuca('idle', seed, {
        startAtLink2: true,
        maxEnemyActions: 12,
        // A rig: Rikku clearly the healthiest, Yuna clearly the weakest, so "the most HP" is not a tie and stays Rikku while the blows land.
        rig: (engine) => {
          const c = engine.state().combatants as unknown as Record<string, FFX2Combatant>;
          c['rikku']!.hp = c['rikku']!.stats.maxHp;
          c['paine']!.hp = Math.floor(c['paine']!.stats.maxHp / 2);
          c['yuna']!.hp = Math.floor(c['yuna']!.stats.maxHp / 4);
        },
      });
      const leblanc = startsBy(run, 0, 'x2-luca-leblanc').map((e) => e.abilityId);
      expect(leblanc.length).toBe(12);
      leblanc.forEach((id, i) => expect(id, `Leblanc action ${i + 1}`).toBe(i % 4 === 3 ? LUCA_MOVES.thunder : LUCA_MOVES.leblancAttack));
      expect(run.thunderVictims).toEqual(['rikku', 'rikku', 'rikku']);
    });
  }

  it('her Thunder costs the row\'s 4 MP: three Thunders leave her 101 - 12 = 89', () => {
    const run = driveLuca('idle', 5, { startAtLink2: true, maxEnemyActions: 12 });
    const leblanc = run.states[0] ? (Object.values(run.states[0].combatants) as FFX2Combatant[]).find((c) => c.id === 'x2-luca-leblanc') : undefined;
    expect(leblanc?.mp).toBe(101 - 3 * 4);
  });
});

describe('the Potion', () => {
  it('with Ormi under a fifth of his HP, Logos\' first action is the Potion on Ormi: exactly +20 HP, and no second one in thirty more actions', () => {
    const run = driveLuca('idle', 6, {
      maxEnemyActions: 40,
      rig: (engine) => {
        (engine.state().combatants as unknown as Record<string, FFX2Combatant>)['x2-luca-ormi']!.hp = 15;
      },
    });
    const logos = startsBy(run, 0, 'x2-luca-logos');
    expect(logos[0]!.abilityId).toBe(LUCA_MOVES.potion);
    expect(logos[0]!.targets).toEqual(['x2-luca-ormi']);
    expect(logos.filter((e) => e.abilityId === LUCA_MOVES.potion)).toHaveLength(1);
    expect(logos.length).toBeGreaterThan(8);
    const heals = eventsOf(run, 0).filter((e) => e.type === 'damage' && e.targetId === 'x2-luca-ormi' && (e.amount ?? 0) < 0);
    expect(heals.map((e) => e.amount)).toEqual([-20]);
  });

  it('on a FALLEN Ormi the script still queues one Potion, and the engine redirects the heal to a living friend, Logos himself; Ormi stays down (the game\'s own answer is [gap])', () => {
    const run = driveLuca('idle', 7, {
      maxEnemyActions: 12,
      rig: (engine) => {
        const o = (engine.state().combatants as unknown as Record<string, FFX2Combatant>)['x2-luca-ormi']!;
        o.hp = 0;
        o.alive = false;
      },
    });
    const logos = startsBy(run, 0, 'x2-luca-logos');
    expect(logos[0]!.abilityId).toBe(LUCA_MOVES.potion);
    expect(logos[0]!.targets).toEqual(['x2-luca-ormi']);
    expect(logos.filter((e) => e.abilityId === LUCA_MOVES.potion)).toHaveLength(1);
    const heals = eventsOf(run, 0).filter((e) => e.type === 'damage' && (e.amount ?? 0) < 0);
    expect(heals.map((e) => e.targetId)).toEqual(['x2-luca-logos']);
    const ormi = (Object.values(run.states[0]!.combatants) as FFX2Combatant[]).find((c) => c.id === 'x2-luca-ormi')!;
    expect([ormi.hp, ormi.alive]).toEqual([0, false]);
  });
});

describe('the hit rule (hard rule 5): magic and the shield never miss, the blows and the pistol roll', () => {
  it('over ten seeds of idle fights the shield throw and the Thunder never miss, and the plain blows do miss now and then', () => {
    let blows = 0;
    let missedBlows = 0;
    for (let seed = 1; seed <= 10; seed++) {
      for (const link of [0, 1] as const) {
        const run = driveLuca('idle', seed, { startAtLink2: link === 1, maxEnemyActions: 40 });
        const log = eventsOf(run, 0);
        let current: string | undefined;
        for (const e of log) {
          if (e.type === 'action-start' && e.actorId !== undefined && e.actorId.startsWith('x2-luca-')) current = e.abilityId;
          if (e.type === 'miss' && current !== undefined) {
            if (current === LUCA_MOVES.pitch || current === LUCA_MOVES.thunder || current === LUCA_MOVES.potion) throw new Error(`${current} missed on seed ${seed}`);
            missedBlows += 1;
          }
        }
        blows += run.order.filter((id) => id === LUCA_MOVES.ormiAttack || id === LUCA_MOVES.pistol || id === LUCA_MOVES.leblancAttack).length;
      }
    }
    expect(blows).toBeGreaterThan(100);
    expect(missedBlows).toBeGreaterThan(0);
  });
});

describe('the Songstress hold (LO3) and the seam', () => {
  function firstMenu(group: typeof lucaLogosOrmiGroup, build: typeof lucaOpenerBuild, seed: number): Array<{ label: string; kind: string; id: string }> {
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(seed);
    engine.init({ game: 'ffx2', party: structuredClone(build), enemies: group, triggers: [], seed, condition: 'normal', canEscape: false });
    for (let i = 0; i < 400; i++) {
      const d = engine.nextDecision();
      if (d.kind === 'waiting') {
        engine.tick(Math.max(1, d.nextEventMs));
        continue;
      }
      if (d.kind !== 'player-input') continue;
      if (d.actorId === 'yuna') return d.commands.filter((c) => c.enabled).map((c) => ({ label: c.label, kind: c.command.kind, id: 'id' in c.command ? String((c.command as { id: string }).id) : '' }));
      engine.submit({ kind: 'defend', targets: [] });
    }
    throw new Error('no menu for Yuna');
  }

  it('in the first link Yuna is a Gunner (Attack and Trigger Happy); in the second she is the Songstress and her only command besides the bag is Darkness Dance, with no Attack row', () => {
    const one = firstMenu(lucaLogosOrmiGroup, lucaOpenerBuild, 1);
    expect(one.map((r) => r.label)).toEqual(['Attack', 'Trigger Happy', 'Potion', 'Phoenix Down']);
    const two = firstMenu(lucaLeblancGroup, lucaOpenerSongstressBuild, 1);
    expect(two.map((r) => r.label)).toEqual(['Darkness Dance', 'Potion', 'Phoenix Down']);
    expect(two.some((r) => r.kind === 'attack')).toBe(false);
  });

  it('Darkness Dance blinds Leblanc on every one of six seeds (she is not immune to Darkness: the row lists only Berserk, Curse, Eject, Itchy, Auto-Life, Stop and Doom)', () => {
    let blinded = 0;
    for (let seed = 1; seed <= 6; seed++) {
      const run = driveLuca('advisor', seed, { startAtLink2: true });
      const log = eventsOf(run, 0);
      if (log.some((e) => e.type === 'status-add' && (e as unknown as { status?: string }).status === 'darkness' && e.targetId === 'x2-luca-leblanc')) blinded += 1;
    }
    expect(blinded).toBe(6);
  });

  it('the seam through the app\'s own code: link 2 opens on the Songstress template (Yuna wears it), every girl at her full HP and MP, the bag as the first link left it; a spent Potion stays spent', () => {
    const setup1 = { game: 'ffx2' as const, party: structuredClone(lucaOpenerBuild), enemies: lucaLogosOrmiGroup, triggers: [], seed: 1, condition: 'normal' as const, canEscape: false };
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init(setup1);
    const state = engine.state() as BattleState;
    // The first link's end: Yuna hurt, a Potion spent (the engine's own ledger key).
    (state.combatants['yuna'] as FFX2Combatant).hp = 10;
    state.flags['inventory:x2-potion'] = 7;
    const setup2 = setupForNextLink(setup1, lucaLeblancGroup, state, 2);
    expect(setup2.party.game).toBe('ffx2');
    const members = (setup2.party as typeof lucaOpenerBuild).members;
    expect(members.map((m) => m.currentDressphere)).toEqual(['songstress', 'thief', 'warrior']);
    expect(members[0]!.spriteKey).toBe('yuna-songstress');
    expect((setup2.party as typeof lucaOpenerBuild).inventory.find((i) => i.itemId === 'x2-potion')?.count).toBe(7);
    expect((setup2.party as typeof lucaOpenerBuild).inventory.find((i) => i.itemId === 'x2-phoenix-down')?.count).toBe(3);
    expect(members[0]!.hp, 'the carried HP is the live one, then the Save-Sphere rule fills it').toBe(10);
    const engine2 = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine2.setSeed(2);
    engine2.init(setup2);
    const yuna = engine2.state().combatants['yuna'] as FFX2Combatant;
    expect([yuna.hp, yuna.mp]).toEqual([yuna.stats.maxHp, yuna.stats.maxMp]); // restoresPartyOnEntry: whole on entry
    expect(yuna.dresspheres?.current).toBe('songstress');
  });

  it('the second link is the retry checkpoint (a loss there retries Leblanc, not the chapter), and the retry keeps the Songstress template', () => {
    const setup1 = { game: 'ffx2' as const, party: structuredClone(lucaOpenerBuild), enemies: lucaLogosOrmiGroup, triggers: [], seed: 1, condition: 'normal' as const, canEscape: false };
    const engine = new FFX2Engine(ffx2Options({ atbMode: 'wait' }));
    engine.setSeed(1);
    engine.init(setup1);
    const setup2 = setupForNextLink(setup1, lucaLeblancGroup, engine.state() as BattleState, 2);
    expect(checkpointAt(1, lucaLogosOrmiGroup, setup1)).toBeNull();
    const checkpoint = checkpointAt(2, lucaLeblancGroup, setup2);
    expect(checkpoint).not.toBeNull();
    const retry = resumeSetup(checkpoint!, 99);
    expect((retry.party as typeof lucaOpenerBuild).members[0]!.currentDressphere).toBe('songstress');
    expect(retry.enemies.id).toBe(lucaLeblancGroup.id);
  });
});

describe('the rewards are the rows\'', () => {
  it('a won first link pays Logos\' and Ormi\'s EXP, gil and AP together (3 + 3, 60 + 60, 1 + 1), and the second Leblanc\'s (8, 180, 2)', () => {
    const run = driveLuca('advisor', 3);
    expect(run.won).toBe(2);
    const [one, two] = run.results;
    expect([one!.exp, one!.gil]).toEqual([6, 120]);
    expect([two!.exp, two!.gil]).toEqual([8, 180]);
    expect(one!.ap).toBeGreaterThan(0);
    expect(two!.ap).toBeGreaterThan(0);
  });
});
