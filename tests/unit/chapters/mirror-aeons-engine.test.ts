/**
 * The hidden Mirror Aeons chapter on the real FFX engine (the party preset against the Dark Aeons, **no boss AI**: the engine's own fallback, a plain Attack, until the reverse-engineering session's scripts land): the
 * opening state of both acts (the starting gauges, the battle id, the dog that takes no turns), Yuna's optional aeons summoned through the real command, the chain from Act I to Act II, and the `all-ko` trigger
 * that plays the seam. What is NOT asserted: how hard the fight is (the bench's job, and it waits for the AI).
 */
import { describe, expect, it } from 'vitest';

import type { BattleSetup, Command, FFXCombatant } from '../../../src/battle/common/types.ts';
import { createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { setupForNextLink } from '../../../src/app/screens/BattleScreenSetup.ts';
import { ENEMY_GROUPS_BY_ID } from '../../../src/data/ffx/index.ts';
import { SISTERS_START_GAUGE, mirrorAeonsBuild } from '../../../src/data/ffx/builds/mirror-aeons.ts';
import { DARK_BATTLE_ID_FLAG, DARK_GAUGE_PER_TURN_FLAG } from '../../../src/battle/ffx/ai/dark-aeons-seams.ts';
import { mirrorAeonsScripts } from '../../../src/story/scripts/mirror-aeons.ts';
import { MIRROR_ACT_II_GROUP, MIRROR_SEAM, YOJIMBO_TIERS, sistersGroupId, yojimboGroupId } from '../../../src/data/ffx/mirror-aeons-ids.ts';
import * as H from '../helpers/mirrorAeonsDrive.ts';

/** The next player input. */
function nextInput(engine: ReturnType<typeof H.newEngine>): H.Input {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended');
  }
  throw new Error('no player input');
}

/** Advance (defending) to Yuna's input. */
function yunaInput(engine: ReturnType<typeof H.newEngine>): H.Input {
  let input = nextInput(engine);
  for (let guard = 0; input.actorId !== 'yuna' && guard < 12; guard++) {
    engine.submit(H.defend());
    input = nextInput(engine);
  }
  return input;
}

describe('Act I opens as the files say (the trio kino00_70)', () => {
  const engine = H.newEngine(1, sistersGroupId('kino00_70'));

  it("Mindy, Sandy and Cindy stand in the game's slot order with every Overdrive gauge at 100, and the battle id is published", () => {
    expect(engine.state().enemyIds).toEqual(['dark-mindy', 'dark-sandy', 'dark-cindy']);
    for (const id of engine.state().enemyIds) expect(H.actor(engine, id).overdrive?.gauge, id).toBe(100);
    expect(H.flags(engine)[DARK_BATTLE_ID_FLAG]).toBe(0x00dc0046);
    expect(H.flags(engine)[DARK_GAUGE_PER_TURN_FLAG]).toBeUndefined();
  });

  it('the party is Tidus, Yuna and Lulu with Auron, Wakka, Kimahri and Rikku on the bench; Escape is off (the Flee row is greyed)', () => {
    expect(engine.state().activeIds).toEqual(['tidus', 'yuna', 'lulu']);
    expect([...engine.state().reserveIds].sort()).toEqual(['auron', 'kimahri', 'rikku', 'wakka']);
    const escapes = nextInput(engine).commands.filter((c) => c.command.kind === 'escape');
    expect(escapes.every((c) => !c.enabled)).toBe(true);
  });

  it('the other formations open with a gauge of 0; the solo and pair ones hold the sisters they name', () => {
    for (const file of ['kino01_71', 'kino01_72', 'kino05_70', 'kino05_71']) {
      const e = H.newEngine(1, sistersGroupId(file));
      for (const id of e.state().enemyIds) expect(H.actor(e, id).overdrive?.gauge, `${file} ${id}`).toBe(0);
    }
    expect(H.newEngine(1, sistersGroupId('kino01_71')).state().enemyIds).toEqual(['dark-cindy']);
    expect(H.newEngine(1, sistersGroupId('kino01_72')).state().enemyIds).toEqual(['dark-mindy', 'dark-sandy']);
  });
});

describe('Act II opens as the files say (the five tiers of Dark Yojimbo)', () => {
  for (const tier of YOJIMBO_TIERS) {
    it(`${tier.file}: his gauge is 0, the battle id and the tier's fill (${tier.gaugePerTurn} a turn) are published`, () => {
      const e = H.newEngine(1, yojimboGroupId(tier.file));
      expect(e.state().enemyIds).toEqual(['dark-yojimbo', 'dark-daigoro']);
      expect(H.actor(e, 'dark-yojimbo').overdrive?.gauge).toBe(0);
      expect(H.flags(e)[DARK_BATTLE_ID_FLAG]).toBe(tier.battleId);
      expect(H.flags(e)[DARK_GAUGE_PER_TURN_FLAG]).toBe(tier.gaugePerTurn);
    });
  }

  it('the dog takes no turns, cannot be targeted and is no part of the victory', () => {
    const e = H.newEngine(3, H.ACT_II_GROUP);
    const seen = new Set<string>();
    let outcome = '';
    for (let i = 0; i < 80 && outcome === ''; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') { outcome = d.result.outcome; break; }
      if (d.kind !== 'player-input') continue;
      for (const c of d.commands) for (const t of c.validTargets) seen.add(t);
      (e.state().combatants['dark-yojimbo'] as FFXCombatant).hp = 1; // one blow ends it; the dog is still standing
      e.submit(H.row(d, 'attack', undefined, 'dark-yojimbo') ?? H.defend());
    }
    expect(outcome).toBe('victory');
    expect(seen.has('dark-yojimbo')).toBe(true);
    expect(seen.has('dark-daigoro')).toBe(false);
    expect(H.actions(H.log(e), 'dark-daigoro')).toEqual([]);
    expect((e.state().combatants['dark-daigoro'] as FFXCombatant).alive).toBe(true);
  });
});

describe("Yuna's Yojimbo and Magus Sisters through the real summon command (the reverse-engineering session's lane FFX-K engine)", () => {
  const summon = (e: ReturnType<typeof H.newEngine>, label: string): void => {
    const row = yunaInput(e).commands.find((c) => c.enabled && c.command.kind === 'summon' && c.label === label);
    expect(row, `${label} summon row`).toBeDefined();
    e.submit({ ...row!.command, targets: [] } as Command);
  };

  it('the roster holds seven summons: the five story aeons, Yojimbo and the Sisters (one summon, offered as Cindy; Anima is left out)', () => {
    const names = yunaInput(H.newEngine(1)).commands.filter((c) => c.command.kind === 'summon').map((c) => c.label).sort();
    expect(names).toEqual(['Bahamut', 'Cindy', 'Ifrit', 'Ixion', 'Shiva', 'Valefor', 'Yojimbo']);
    expect(mirrorAeonsBuild.aeons.map((a) => a.id)).toHaveLength(9); // nine aeons in the build: the three Sisters are three rows of the one summon
    expect(mirrorAeonsBuild.yojimbo).toEqual({ compatibility: 128, hireAnswer: 2 });
    expect(Object.keys(mirrorAeonsBuild.sisters!.motivation).sort()).toEqual(['cindy', 'mindy', 'sandy']);
  });

  it('both are summonable in BOTH acts: the game bars nothing against the dark twins (RE note 9)', () => {
    for (const group of [H.ACT_I_GROUP, H.ACT_II_GROUP]) {
      const labels = yunaInput(H.newEngine(2, group)).commands.filter((c) => c.enabled && c.command.kind === 'summon').map((c) => c.label);
      expect(labels, group).toEqual(expect.arrayContaining(['Yojimbo', 'Cindy']));
    }
  });

  it('Yojimbo arrives with his own menu, Pay and Dismiss; a payment buys one of the roll\'s commands, is taken from the gil, and moves his compatibility', () => {
    // Dark Yojimbo may act before the summoned aeon's first turn (and kill him): take the first seed on which Yojimbo's menu opens.
    let e = H.newEngine(1, H.ACT_II_GROUP);
    let d: H.Input | undefined;
    for (let seed = 1; seed <= 20 && d?.actorId !== 'yojimbo'; seed++) {
      e = H.newEngine(seed, H.ACT_II_GROUP);
      summon(e, 'Yojimbo');
      expect(e.state().aeonId).toBe('yojimbo');
      d = nextInput(e);
    }
    if (d === undefined) throw new Error('no menu');
    expect(d.actorId).toBe('yojimbo');
    expect(d.commands.filter((c) => c.enabled).map((c) => c.label)).toEqual(['Pay', 'Dismiss']);
    expect(H.flags(e)['yojimbo:gil']).toBe(1_500_000);
    expect(H.flags(e)['yojimbo:compatibility']).toBe(128);
    const pay = d.commands.find((c) => c.label === 'Pay')!;
    const events = e.submit({ ...pay.command, targets: [], gilSpent: 100_000 } as Command);
    const acted = events.filter((ev) => ev.type === 'action-start').map((ev) => (ev.type === 'action-start' ? ev.abilityId : ''));
    expect(acted.some((id) => ['daigoro', 'kozuka', 'wakizashi-single', 'wakizashi-multi', 'zanmato'].includes(id ?? ''))).toBe(true);
    expect(H.flags(e)['yojimbo:gil']).toBe(1_400_000);
    expect(H.flags(e)['yojimbo:compatibility']).not.toBe(128);
  });

  it('the Sisters arrive as ONE summon of three: Cindy asks, all three take the field, and the first one\'s menu lights Combine powers because their gauges start full', () => {
    const e = H.newEngine(2);
    summon(e, 'Cindy');
    expect(e.state().aeonId).toBe('cindy');
    expect(e.state().aeonIds).toEqual(['cindy', 'sandy', 'mindy']);
    for (const id of ['cindy', 'sandy', 'mindy']) expect(H.actor(e, id).overdrive?.gauge, id).toBe(SISTERS_START_GAUGE);
    const d = nextInput(e);
    expect(['cindy', 'sandy', 'mindy']).toContain(d.actorId);
    const combine = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'sister-order-combine');
    expect(combine?.enabled).toBe(true);
    expect(d.commands.some((c) => c.command.kind === 'dismiss' && c.enabled)).toBe(true);
    const events = e.submit({ ...combine!.command, targets: [] } as Command);
    expect(events.filter((ev) => ev.type === 'action-start').map((ev) => (ev.type === 'action-start' ? ev.abilityId : ''))).toContain('delta-attack');
    for (const id of ['cindy', 'sandy', 'mindy']) expect(H.actor(e, id).overdrive?.gauge, `${id} paid the bar`).toBe(0);
  });

  it('with the gauges empty their menu offers Dismiss and nothing else that works (the other seven orders are not built): the reason the preset starts them full', () => {
    const party = structuredClone(mirrorAeonsBuild);
    for (const a of party.aeons) if (['cindy', 'sandy', 'mindy'].includes(a.id)) a.overdriveGauge = 0;
    const e = H.newEngine(2, H.ACT_I_GROUP, party);
    summon(e, 'Cindy');
    const d = nextInput(e);
    expect(d.commands.filter((c) => c.enabled).map((c) => c.command.kind)).toEqual(['dismiss']);
  });
});

describe('the heal between the acts (the release driver\'s delegated pick: two separate fights in the game)', () => {
  it('Act II opens on a whole party and whole aeons, a fallen aeon standing again; the gauges, the bag, the gil and Yojimbo\'s compatibility carry as Act I left them', () => {
    const setup1 = H.setup(3, H.groupIdOf('kino01_72'));
    const e1 = createFFXEngine({ content: H.content, autoResolveMinigames: true });
    e1.init(setup1);
    const s1 = e1.state();
    const tidus = s1.combatants['tidus'] as FFXCombatant;
    tidus.hp = 123;
    const lulu = s1.combatants['lulu'] as FFXCombatant;
    lulu.hp = 0;
    lulu.alive = false;
    lulu.statuses['ko'] = { id: 'ko', turnsRemaining: null, ticksRemaining: null, charges: null, stacks: 0, permanent: false };
    const bahamut = s1.combatants['bahamut'] as FFXCombatant;
    bahamut.hp = 0;
    bahamut.alive = false;
    bahamut.aeon!.reviveCountdown = 3;
    (s1.combatants['ifrit'] as FFXCombatant).hp = 77;
    (s1.combatants['shiva'] as FFXCombatant).overdrive!.gauge = 33;
    s1.flags['inventory:phoenix-down'] = 5;
    s1.flags['yojimbo:gil'] = 1_100_000;
    s1.flags['yojimbo:compatibility'] = 150;

    const group2 = ENEMY_GROUPS_BY_ID[MIRROR_ACT_II_GROUP]!;
    const setup2 = setupForNextLink(setup1, group2, s1, 9) as BattleSetup;
    const e2 = createFFXEngine({ content: H.content, autoResolveMinigames: true });
    e2.init(setup2);
    const s2 = e2.state();
    for (const id of ['tidus', 'yuna', 'lulu']) {
      const m = s2.combatants[id] as FFXCombatant;
      expect([m.hp, m.stats.maxHp, m.alive, m.statuses['ko']], id).toEqual([9_999, 9_999, true, undefined]);
    }
    const aeon = (id: string): FFXCombatant => s2.combatants[id] as FFXCombatant;
    for (const a of mirrorAeonsBuild.aeons) expect(aeon(a.id).hp, a.id).toBe(a.stats.maxHp);
    expect(aeon('bahamut').alive && (aeon('bahamut').aeon!.reviveCountdown ?? 0) === 0, 'the fallen aeon stands again with no recovery count').toBe(true);
    expect(aeon('shiva').overdrive!.gauge, 'a Save Sphere does not touch a gauge').toBe(33);
    expect(s2.flags['yojimbo:gil']).toBe(1_100_000);
    expect(s2.flags['yojimbo:compatibility']).toBe(150);
    expect(setup2.party.inventory.find((i) => i.itemId === 'phoenix-down')?.count, 'the bag carries what is left').toBe(5);
  });

  it('the Act I groups and the pair carry no heal of their own: only the Yojimbo groups do, and a battle that is not a link restores nothing', () => {
    const e = H.newEngine(1);
    (e.state().combatants['tidus'] as FFXCombatant).hp = 1;
    expect(ENEMY_GROUPS_BY_ID[H.ACT_I_GROUP]?.restoresAeonsOnEntry).toBeUndefined();
    expect(ENEMY_GROUPS_BY_ID[MIRROR_ACT_II_GROUP]?.restoresAeonsOnEntry).toBe(true);
  });
});

describe('the chain and the seam (the all-ko trigger on the real engine)', () => {
  const triggers = mirrorAeonsScripts.mid;

  /** A blow that lands: a blade on Cindy and Sandy; on Mindy (Evasion 240) only a spell finds her, so only Lulu can answer. */
  function blow(d: H.Input, target: string): Command | null {
    if (target !== 'dark-mindy') return H.row(d, 'attack', undefined, target);
    const spell = d.commands.find((c) => c.enabled && c.command.kind === 'ability' && ['Fire', 'Thunder', 'Blizzard', 'Water'].includes(c.label) && c.validTargets.includes(target));
    return spell ? ({ ...spell.command, targets: [target] } as Command) : null;
  }

  /** Fell the sisters of `file` in `order`, each at 1 HP, one blow each; every script-trigger name fired after each submitted action, and the result. */
  function fell(file: string, order: string[], stopAfter = 200) {
    const e = H.createEngineWithTriggers(1, sistersGroupId(file), triggers);
    for (const id of order) (e.state().combatants[id] as FFXCombatant).hp = 1;
    const fired: string[][] = [];
    let result: { outcome: string; nextGroupId?: string } | undefined;
    for (let i = 0; i < stopAfter && result === undefined; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') { result = d.result; break; }
      if (d.kind !== 'player-input') continue;
      const target = order.find((id) => (e.state().combatants[id] as FFXCombatant).alive);
      if (!target) break;
      const events = e.submit(blow(d, target) ?? H.defend());
      fired.push(events.flatMap((ev) => (ev.type === 'script-trigger' ? [ev.name] : [])));
    }
    return { fired, result, engine: e };
  }

  it('the seam fires once, in the action that fells the LAST of the three sisters, whatever the order', () => {
    for (const order of [['dark-mindy', 'dark-sandy', 'dark-cindy'], ['dark-cindy', 'dark-sandy', 'dark-mindy'], ['dark-sandy', 'dark-cindy', 'dark-mindy']]) {
      const { fired, result } = fell('kino00_70', order);
      const at = fired.map((names, i) => (names.includes(MIRROR_SEAM) ? i : -1)).filter((i) => i >= 0);
      expect(at, order.join()).toHaveLength(1);
      expect(result?.outcome).toBe('victory');
      expect(result?.nextGroupId).toBe(MIRROR_ACT_II_GROUP); // the chain goes on to Act II
    }
  });

  it('a lone sister (a rung of the ladder) plays the same seam when she falls; two of three down plays nothing', () => {
    expect(fell('kino05_71', ['dark-mindy']).fired.flat().filter((n) => n === MIRROR_SEAM)).toHaveLength(1);
    const { fired, engine } = fell('kino00_70', ['dark-mindy', 'dark-sandy'], 40);
    expect(fired.flat()).not.toContain(MIRROR_SEAM);
    expect((engine.state().combatants['dark-cindy'] as FFXCombatant).alive).toBe(true);
  });

  it('the seam never fires in Act II, and Act II ends the chain', () => {
    const e = H.createEngineWithTriggers(1, H.ACT_II_GROUP, triggers);
    (e.state().combatants['dark-yojimbo'] as FFXCombatant).hp = 1;
    const names: string[] = [];
    let result: { outcome: string; nextGroupId?: string } | undefined;
    for (let i = 0; i < 60 && result === undefined; i++) {
      const d = e.nextDecision();
      if (d.kind === 'battle-over') { result = d.result; break; }
      if (d.kind !== 'player-input') continue;
      names.push(...e.submit(H.row(d, 'attack', undefined, 'dark-yojimbo') ?? H.defend()).flatMap((ev) => (ev.type === 'script-trigger' ? [ev.name] : [])));
    }
    expect(names).not.toContain(MIRROR_SEAM);
    expect(result?.outcome).toBe('victory');
    expect(result?.nextGroupId).toBeUndefined();
  });
});
