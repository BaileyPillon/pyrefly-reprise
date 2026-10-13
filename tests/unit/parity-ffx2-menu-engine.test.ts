/**
 * The FFX-2 command menu through the engine (re-parity RC7 lane X2-B; **FFX-2 only**): what a girl's menu lists, greys and charges, against the game.
 *
 * The oracle is `tests/fixtures/parity/ffx2/command_menu.json`: the REAL game's whole-menu refresh (exe 0x626e50) run in the emulator harness for every
 * dressphere on every girl, once with nothing learned and once with everything learned. The engine is asked for the same menu of the same girl
 * (`buildCommands`, the real data registries) and the two are compared command for command. Where the engine has no ability for a game command
 * (the data gaps listed below) the command is left out of both sides. Kernel proofs: `parity-ffx2-command-menu.test.ts`; the note: FFX2-G02.
 *
 * Case: FFX-2 only (dresspheres; FFX has no counterpart of the rebuild, FFX2-G02 line 3).
 */

import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import type { AvailableCommand, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine, refreshDerivedStats } from '../../src/battle/ffx2/index.ts';
import { aiUnit, bahamutEnemy, bevelleParty, group, member, setup } from '../../src/battle/ffx2/fixtures.ts';
import { applyStatus } from '../../src/battle/ffx2/index.ts';
import { chainRegistries, defaultAbilities } from '../../src/battle/ffx2/abilities.ts';
import { ABILITY_GAME_ID, DRESSPHERE_JOB, abilityOfGameId, gameIdOf } from '../../src/battle/ffx2/adapt/game-ids.ts';
import { effectiveMpCost, buildCommands, type MenuContext } from '../../src/battle/ffx2/menu.ts';
import { menuRow } from '../../src/battle/ffx2/kernel/command-menu-rows.ts';
import { abilityRow } from '../../src/battle/ffx2/kernel/dressphere-rows.ts';
import { FFX2_JOB_ABILITIES } from '../../src/battle/ffx2/kernel/dressphere-grids.ts';
import { girlJob } from '../../src/battle/ffx2/kernel/dressphere-stats.ts';
import { ffx2EngineOptions, registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import * as ffx2data from '../../src/data/ffx2/index.ts';

beforeAll(async () => {
  await registerBattleContent();
});

const STANDARD = ffx2data.STANDARD_DRESSPHERES as Record<string, (typeof ffx2data.STANDARD_DRESSPHERES)[keyof typeof ffx2data.STANDARD_DRESSPHERES]>;
const GIRLS = ['yuna', 'rikku', 'paine'] as const;
const category = (id: number): number => id >> 12;

/** The pairs of a job as [prerequisite, id]. */
function pairs(job: number): Array<[number, number]> {
  const row = FFX2_JOB_ABILITIES[job & 0xfff] ?? [];
  const out: Array<[number, number]> = [];
  for (let k = 0; k + 1 < row.length; k += 2) if (row[k + 1] !== 0) out.push([row[k] as number, row[k + 1] as number]);
  return out;
}
/** Every job (one per girl for the Trainer and the Mascot) a dressphere of ours is on the game's side. */
function jobsOf(sphere: string): number[] {
  const stored = DRESSPHERE_JOB[sphere] as number;
  return [...new Set(GIRLS.map((_, g) => girlJob(g, stored)))];
}
const COMPOSITES: Record<number, number[]> = {
  0x100: [0x3069, 0x306a, 0x306b, 0x306c],
  0x101: [0x8006, 0x8007],
};
const apOf = (g: number): number => (category(g) === 3 ? menuRow(g & 0xfff).ap : abilityRow(g).ap);

describe('our ladders against the game\'s pairs (data; the note FFX2-G02 section 3.5)', () => {
  const standards = Object.keys(STANDARD).filter((id) => DRESSPHERE_JOB[id] !== undefined);

  it('every ability on a ladder of ours has a game id, and the game\'s own ladder names it (the Blue Bullets are children of a parent and in no pair)', () => {
    const off: string[] = [];
    for (const sphere of standards) {
      const ladder = jobsOf(sphere).flatMap((j) => pairs(j).map(([, id]) => id));
      for (const e of STANDARD[sphere]!.abilities) {
        const g = gameIdOf(e.abilityId);
        if (g === undefined) off.push(`${sphere}: ${e.abilityId} has no game id`);
        else if (!ladder.includes(g) && !(sphere === 'gun-mage' && menuRow(g & 0xfff).child === 7)) off.push(`${sphere}: ${e.abilityId} (${g.toString(16)}) is not on the game's ladder`);
      }
    }
    expect(off).toEqual([]);
  });

  it('a pair with prerequisite 0 is flagged free, and nothing else is', () => {
    const wrong: string[] = [];
    for (const sphere of standards) {
      const free = new Set(jobsOf(sphere).flatMap((j) => pairs(j).filter(([pre]) => pre === 0).map(([, id]) => id)));
      for (const e of STANDARD[sphere]!.abilities) {
        const g = gameIdOf(e.abilityId) as number;
        if ((e.free === true) !== free.has(g)) wrong.push(`${sphere}: ${e.abilityId} free=${String(e.free)} but the game says ${free.has(g)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  it('the prerequisites, the key items and the AP of every entry are the game\'s (the Trainer and the Mascot are partial ladders, not compared)', () => {
    const wrong: string[] = [];
    for (const sphere of standards.filter((s) => s !== 'trainer' && s !== 'mascot' && s !== 'gun-mage')) {
      const game = new Map(jobsOf(sphere).flatMap((j) => pairs(j)).map(([pre, id]) => [id, pre]));
      for (const e of STANDARD[sphere]!.abilities) {
        const g = gameIdOf(e.abilityId) as number;
        const pre = game.get(g) as number;
        let want: number;
        if (e.free === true) want = 0;
        else if (e.keyItem !== undefined) want = 0x7000 + e.keyItem;
        else if (e.prereqAll !== undefined) {
          const ids = e.prereqAll.map((id) => gameIdOf(id) as number).sort();
          want = Number(Object.entries(COMPOSITES).find(([, parts]) => parts.length === ids.length && [...parts].sort().every((p, i) => p === ids[i]))?.[0] ?? -1);
        } else if (e.prereq !== undefined) want = gameIdOf(e.prereq) as number;
        else want = 1;
        if (want !== pre) wrong.push(`${sphere}: ${e.abilityId} prerequisite ${want.toString(16)}, the game's ${pre.toString(16)}`);
        // the AP counts toward mastery; a free pair carries it too, but our "known from the start" entries keep 0 (the published totals leave them out)
        if (e.free !== true && e.apCost !== apOf(g)) wrong.push(`${sphere}: ${e.abilityId} AP ${e.apCost}, the game's ${apOf(g)}`);
      }
    }
    expect(wrong).toEqual([]);
  });

  /** What the game's ladder has and ours lacks: the data gaps found while matching (FFX2-G02 section 3.5), pinned so closing one is a deliberate change. */
  const KNOWN_GAPS: Record<string, string[]> = {
    'gun-mage': ['300a', '303e', '303f', '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '801a', '801b'],
    berserker: ['3091', '3092', '805d', '806e'],
    'lady-luck': ['30ec', '30e9', '30ea', '8011', '8079', '800f', '8010'],
    thief: [],
    songstress: [],
    'dark-knight': [],
    samurai: [],
    alchemist: [],
    warrior: [],
    gunner: [],
    'white-mage': [],
    'black-mage': [],
  };

  it('the entries the game has and ours lacks are exactly the listed gaps (Bailey decides the rest: Fiend Hunter, three Berserker moves, seven Lady Luck entries)', () => {
    const got: Record<string, string[]> = {};
    for (const sphere of Object.keys(KNOWN_GAPS)) {
      const ours = new Set(STANDARD[sphere]!.abilities.map((e) => gameIdOf(e.abilityId)));
      got[sphere] = jobsOf(sphere).flatMap((j) => pairs(j).map(([, id]) => id)).filter((id) => !ours.has(id) && category(id) !== 0 && id !== 0x302c && id !== 0x302d && id !== 0x302e && id !== 0x302f).map((id) => id.toString(16));
    }
    expect(got).toEqual(KNOWN_GAPS);
  });

  it('the AP of a ladder adds up to the published mastery total wherever the ladder is complete', () => {
    const complete = ['gunner', 'warrior', 'white-mage', 'black-mage', 'thief', 'songstress', 'dark-knight', 'samurai', 'alchemist'];
    for (const sphere of complete) {
      const d = STANDARD[sphere]!;
      expect(d.abilities.reduce((a, e) => a + e.apCost, 0), sphere).toBe(d.masteryAp);
    }
  });

  it('the game ids are unique per ability, and the reverse lookup finds the ability for a command only one dressphere has', () => {
    expect(new Set(Object.keys(ABILITY_GAME_ID)).size).toBe(Object.keys(ABILITY_GAME_ID).length);
    expect(abilityOfGameId(0x3033)).toBe('x2-gunner-potshot');
    expect(abilityOfGameId(0x302d)).toBeUndefined(); // Attack: four dresspheres share the row
  });
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// the whole menu against the real game
// ---------------------------------------------------------------------------------------------------------------------------------------------

interface World {
  cls: string;
  idx: number;
  records: Record<string, { job: number }>;
  lists: Record<string, number[]>;
}
const fixture = JSON.parse(readFileSync(new URL('../fixtures/parity/ffx2/command_menu.json', import.meta.url), 'utf8')) as { vectors: World[] };
const ATTACKS = new Set([0x302c, 0x302d, 0x302e, 0x302f]);

function context(unit: ReturnType<typeof aiUnit>, canEscape = false): MenuContext {
  const opts = ffx2EngineOptions();
  return { units: [unit], abilities: chainRegistries(opts.abilities, defaultAbilities), dresspheres: opts.dresspheres!, canEscape };
}

function wearing(girl: string, sphere: string, learned: Record<string, { learned: string[]; ap: number }>): ReturnType<typeof aiUnit> {
  const unit = aiUnit(girl, 'party');
  unit.dresspheres = { current: sphere, owned: [sphere], garmentGrid: { id: 'first-steps', nodePosition: 0, passedGates: [], wornThisBattle: [] }, abilitiesLearned: learned };
  return unit;
}

/** Everything of every standard dressphere learned (the game's "mastered" state). */
function everything(): Record<string, { learned: string[]; ap: number }> {
  return Object.fromEntries(Object.entries(STANDARD).map(([id, d]) => [id, { learned: (d?.abilities ?? []).map((e) => e.abilityId), ap: 0 }]));
}

/** The game ids the engine's menu lists for a girl (the generic Attack as the first Attack id). */
function engineSet(girl: string, sphere: string, mode: 'none' | 'all'): Set<number> {
  const learned = mode === 'all' ? everything() : { [sphere]: { learned: ['x2-nothing-learned-yet'], ap: 0 } };
  const unit = wearing(girl, sphere, learned);
  const out = new Set<number>();
  for (const row of buildCommands(unit, context(unit))) {
    if (row.command.kind === 'attack') out.add(0x302c);
    else if (row.command.kind === 'ability') {
      const g = gameIdOf(row.command.id);
      if (g !== undefined) out.add(g);
    }
  }
  return out;
}

/** What the game lists, kept to the commands the engine has an ability for. */
function gameSet(v: World): Set<number> {
  const ours = new Set(Object.values(ABILITY_GAME_ID));
  const out = new Set<number>();
  for (const list of Object.values(v.lists)) {
    for (const id of list) {
      if (id <= 0x3002) continue;
      if (ATTACKS.has(id)) out.add(0x302c);
      else if (ours.has(id)) out.add(id);
    }
  }
  return out;
}

describe('the engine\'s menu against the real game, dressphere by dressphere, girl by girl (tests/fixtures/parity/ffx2/command_menu.json)', () => {
  const sweep = fixture.vectors.filter((v) => v.cls.startsWith('sweep-'));
  const dresses = Object.keys(STANDARD).filter((id) => DRESSPHERE_JOB[id] !== undefined);

  for (const mode of ['none', 'all'] as const) {
    it(`with ${mode === 'none' ? 'nothing' : 'everything'} learned, all ${dresses.length} dresspheres on all three girls list the commands the game lists`, () => {
      let compared = 0;
      const differences: string[] = [];
      for (const [g, girl] of GIRLS.entries()) {
        for (const sphere of dresses) {
          const v = sweep.find((x) => x.cls === `sweep-${mode}` && x.idx === g && x.records[String(g)]?.job === DRESSPHERE_JOB[sphere]);
          expect(v, `${girl} ${sphere}: no vector`).toBeDefined();
          const want = [...gameSet(v!)].sort((a, b) => a - b);
          const got = [...engineSet(girl, sphere, mode)].sort((a, b) => a - b);
          // the Songstress, White Mage and Black Mage have no Attack command, and the engine's generic Attack row agrees
          if (JSON.stringify(want) !== JSON.stringify(got)) differences.push(`${girl}/${sphere}/${mode}: game ${want.map((x) => x.toString(16)).join(' ')} | engine ${got.map((x) => x.toString(16)).join(' ')}`);
          compared += 1;
        }
      }
      expect(differences).toEqual([]);
      expect(compared).toBe(3 * dresses.length);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------------------------------------
// the rules the menu carries
// ---------------------------------------------------------------------------------------------------------------------------------------------



describe('what a girl lists: the free pairs, the prerequisite, the passives', () => {
  it('a Warrior who learned two moves also lists Power Break (a free pair) and nothing she did not learn', () => {
    const unit = wearing('paine', 'warrior', { warrior: { learned: ['x2-warrior-armor-break', 'x2-warrior-sentinel'], ap: 0 } });
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toEqual(['x2-warrior-armor-break', 'x2-warrior-sentinel', 'x2-warrior-power-break']);
  });

  it('a move whose prerequisite she skipped is listed (the prerequisite is taken as learned) but the prerequisite itself is not, unless it is free', () => {
    const unit = wearing('paine', 'warrior', { warrior: { learned: ['x2-warrior-mental-break'], ap: 0 } });
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toContain('x2-warrior-mental-break');
    expect(ids).not.toContain('x2-warrior-magic-break');
  });

  it('a passive auto-ability is not a command: a mastered Gunner has no Darkproof, Sleepproof or Trigger Happy Lv. 2 row', () => {
    const unit = wearing('yuna', 'gunner', {});
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toContain('x2-gunner-trigger-happy');
    for (const id of ['x2-gunner-darkproof', 'x2-gunner-sleepproof', 'x2-gunner-trigger-happy-lv2', 'x2-gunner-trigger-happy-lv3']) expect(ids).not.toContain(id);
  });

  it('the Trainer is one girl\'s own: Yuna lists Kogoro Blaze and not Sneaky Ghiki, Rikku the other way round', () => {
    const labels = (girl: string): string[] => {
      const unit = wearing(girl, 'trainer', {});
      return buildCommands(unit, context(unit)).map((r) => r.label);
    };
    expect(labels('yuna')).toContain('Kogoro Blaze');
    expect(labels('yuna')).not.toContain('Sneaky Ghiki');
    expect(labels('rikku')).toContain('Sneaky Ghiki');
    expect(labels('rikku')).not.toContain('Kogoro Blaze');
  });

  it('a composite prerequisite is taken as learned: Demi Sword alone is listed, the four swords it needs are not', () => {
    const unit = wearing('paine', 'warrior', { warrior: { learned: ['x2-warrior-demi-sword'], ap: 0 } });
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toContain('x2-warrior-demi-sword');
    for (const sword of ['x2-warrior-flametongue', 'x2-warrior-ice-brand', 'x2-warrior-thunder-blade', 'x2-warrior-liquid-steel']) expect(ids).not.toContain(sword);
  });

  it('a Gun Mage whose build names nothing has the whole ladder, Blue Bullets included (children of a heading, in no pair)', () => {
    const unit = wearing('yuna', 'gun-mage', {});
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toEqual(expect.arrayContaining(['x2-gun-mage-scan', 'x2-gun-mage-white-wind', 'x2-gun-mage-1000-needles', 'x2-gun-mage-cry-in-the-night']));
  });

  it('a dressphere the registry does not know (the Specials: no ladder of ours) lists no ability, as before', () => {
    const unit = wearing('yuna', 'floral-fallal', {});
    expect(buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability')).toEqual([]);
  });

  it('a unit that is not one of the three girls keeps the old rule (her learned list, or the ladder)', () => {
    const unit = wearing('p1', 'warrior', { warrior: { learned: ['x2-warrior-armor-break', 'x2-warrior-darkness-made-up'], ap: 0 } });
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toEqual(['x2-warrior-armor-break']); // an unknown id has no ability; no free pair is added for a stranger
  });

  it('a Mascot lists the moves she learned as a Dark Knight under the Arcana heading the Mascot\'s ladder names (the cross-dress expansion)', () => {
    const unit = wearing('yuna', 'mascot', { 'dark-knight': { learned: ['x2-dark-knight-drain', 'x2-dark-knight-bio'], ap: 0 } });
    const ids = buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => (r.command as { id: string }).id);
    expect(ids).toEqual(expect.arrayContaining(['x2-dark-knight-drain', 'x2-dark-knight-bio']));
  });
});

describe('Itch greys every row instead of hiding it (FFX2-G02 E1)', () => {
  it('an Itchy Gunner keeps Attack, her abilities and her items, all greyed; Escape and the spherechange stay usable', () => {
    const unit = wearing('yuna', 'gunner', {});
    unit.dresspheres!.owned = ['gunner', 'thief'];
    applyStatus(unit, { status: 'itchy', chance: 255, duration: 3 });
    const opts = ffx2EngineOptions();
    const rows = buildCommands(unit, { ...context(unit, true), grid: opts.garmentGrids!.get('first-steps')!, gridNodes: ['gunner', 'thief', null, null, null, null], items: opts.items!, inventory: { 'x2-potion': 3 } });
    const kinds = new Map<string, AvailableCommand[]>();
    for (const r of rows) kinds.set(r.command.kind, [...(kinds.get(r.command.kind) ?? []), r]);
    for (const kind of ['attack', 'ability', 'item']) {
      expect(kinds.get(kind)?.length, kind).toBeGreaterThan(0);
      for (const r of kinds.get(kind)!) expect([r.label, r.enabled, r.disabledReason]).toEqual([r.label, false, expect.stringMatching(/Itchy/)]);
    }
    expect(kinds.get('escape')?.[0]?.enabled).toBe(true);
    expect(kinds.get('spherechange')?.every((r) => r.enabled)).toBe(true);
  });

  it('with no spherechange and no Escape an Itchy girl is still offered one row she can answer (the Wait row)', () => {
    const unit = wearing('yuna', 'gunner', {});
    applyStatus(unit, { status: 'itchy', chance: 255, duration: 3 });
    const rows = buildCommands(unit, context(unit));
    expect(rows.some((r) => r.enabled)).toBe(true);
    expect(rows.filter((r) => r.enabled).map((r) => r.command.kind)).toEqual(['defend']);
  });
});

describe('Silence stops the rows that carry the silenceable bit, not only the two spell menus (FFX2-G02 E2)', () => {
  function silenced(girl: string, sphere: string): Map<string, boolean> {
    const unit = wearing(girl, sphere, {});
    applyStatus(unit, { status: 'silence', chance: 255, duration: 3 });
    return new Map(buildCommands(unit, context(unit)).filter((r) => r.command.kind === 'ability').map((r) => [(r.command as { id: string }).id, r.disabledReason === 'Silenced']));
  }
  it('Arcana, every Dance and the White Magic spells are stopped; Pray, Vigor, Focus, MP Absorb, Charon and Darkness are not', () => {
    const dk = silenced('yuna', 'dark-knight');
    for (const id of ['x2-dark-knight-drain', 'x2-dark-knight-demi', 'x2-dark-knight-death']) expect(dk.get(id), id).toBe(true);
    for (const id of ['x2-dark-knight-darkness', 'x2-dark-knight-charon']) expect(dk.get(id), id).toBe(false);
    const song = silenced('yuna', 'songstress');
    for (const id of ['x2-songstress-darkness-dance', 'x2-songstress-slow-dance', 'x2-songstress-battle-cry']) expect(song.get(id), id).toBe(true);
    const wm = silenced('yuna', 'white-mage');
    expect(wm.get('x2-white-mage-cure')).toBe(true);
    expect(wm.get('x2-white-mage-pray')).toBe(false);
    expect(wm.get('x2-white-mage-vigor')).toBe(false);
    const bm = silenced('yuna', 'black-mage');
    expect(bm.get('x2-black-mage-fire')).toBe(true);
    expect(bm.get('x2-black-mage-focus')).toBe(false);
    expect(bm.get('x2-black-mage-mp-absorb')).toBe(false);
  });
  it('a Gunplay move, a Swordplay move and a Steal are not silenceable', () => {
    expect(silenced('yuna', 'gunner').get('x2-gunner-potshot')).toBe(false);
    expect(silenced('paine', 'warrior').get('x2-warrior-armor-break')).toBe(false);
    expect(silenced('rikku', 'thief').get('x2-thief-pilfer-gil')).toBe(false);
  });
});

describe('a Special form has no Item and no Escape command (FFX2-G02 E8)', () => {
  it('Yuna in Floral Fallal is offered Attack but no item and no Escape, though the party has items and may flee', () => {
    const unit = wearing('yuna', 'floral-fallal', {});
    const opts = ffx2EngineOptions();
    const rows = buildCommands(unit, { ...context(unit, true), items: opts.items!, inventory: { 'x2-potion': 3 } });
    expect(rows.map((r) => r.command.kind)).toEqual(['attack']);
    const plain = wearing('yuna', 'gunner', {});
    expect(buildCommands(plain, { ...context(plain, true), items: opts.items!, inventory: { 'x2-potion': 3 } }).map((r) => r.command.kind)).toEqual(expect.arrayContaining(['item', 'escape']));
  });
});

describe('the auto-ability words follow the Garment Grid and its gates (setup and spherechange)', () => {
  it('Font of Power gives Half MP Cost from the equip effect and One MP Cost once its three gates are passed; the words are re-read on every refresh', () => {
    const opts = ffx2EngineOptions();
    const engine = new FFX2Engine({ ...opts, minigames: false });
    const s = setup(group('x', [bahamutEnemy()]), { seed: 3 });
    engine.setSeed(3);
    engine.init({ ...s, party: { ...bevelleParty(24, 'font-of-power'), members: [member('yuna', 'Yuna', 'white-mage', 24, 'font-of-power'), member('rikku', 'Rikku', 'thief', 24, 'font-of-power'), member('paine', 'Paine', 'warrior', 24, 'font-of-power')] } });
    const units = (engine as unknown as { units: Array<ReturnType<typeof aiUnit>> }).units;
    const yuna = units.find((u) => u.id === 'yuna')!;
    expect((yuna.autoWords?.[2] ?? 0) & 0xc).toBe(4); // Half, not One
    yuna.dresspheres!.garmentGrid.passedGates = ['red', 'yellow', 'blue'];
    refreshDerivedStats(yuna, { dresspheres: opts.dresspheres!, grids: opts.garmentGrids!, gridNodes: {} });
    expect((yuna.autoWords?.[2] ?? 0) & 0xc).toBe(0xc); // both words; the cost formula lets One cancel the halving
    expect(effectiveMpCost(yuna, opts.abilities!.get('x2-white-mage-cure')!)).toBe(1);
  });
});

describe('the MP cost goes through Half MP Cost, One MP Cost and Magic Booster (FFX2-G02 E3; exe 0x61acd0)', () => {
  const cure = (): ReturnType<typeof ffx2EngineOptions>['abilities'] => ffx2EngineOptions().abilities;
  function cost(words: [number, number, number], id = 'x2-white-mage-cure', spellspring = false): number {
    const unit = aiUnit('yuna', 'party');
    unit.autoWords = words;
    if (spellspring) applyStatus(unit, { status: 'spellspring', chance: 255, duration: 3 });
    return effectiveMpCost(unit, cure()!.get(id)!);
  }
  it('Cure (4 MP): plain 4, Half 2, One 1, Booster 8, Half with Booster 4, One with Booster 2, Spellspring 0', () => {
    expect(cost([0, 0, 0])).toBe(4);
    expect(cost([0, 0, 4])).toBe(2);
    expect(cost([0, 0, 8])).toBe(1);
    expect(cost([0x20, 0, 0])).toBe(8);
    expect(cost([0x20, 0, 4])).toBe(4);
    expect(cost([0x20, 0, 8])).toBe(2);
    expect(cost([0x20, 0, 12], 'x2-white-mage-cure')).toBe(2);
    expect(cost([0x20, 0, 4], 'x2-white-mage-cure', true)).toBe(0);
  });
  it('the Booster doubles the spell menus only: Pray (cost 0) and a Thief\'s Steal are unchanged', () => {
    expect(cost([0x20, 0, 0], 'x2-white-mage-cura')).toBe(2 * ffx2EngineOptions().abilities!.get('x2-white-mage-cura')!.mpCost);
    expect(cost([0x20, 0, 0], 'x2-white-mage-pray')).toBe(0);
  });
  it('the Booster reads the menu category of the row, not our label: Thunder (a Black Magic row with no record of ours) doubles, a Kogoro Cure (the game files it under the Trainer, ours calls it White Magic) does not', () => {
    const abilities = ffx2EngineOptions().abilities!;
    expect(cost([0x20, 0, 0], 'x2-black-mage-thunder')).toBe(2 * abilities.get('x2-black-mage-thunder')!.mpCost);
    expect(cost([0x20, 0, 0], 'x2-trainer-kogoro-cure')).toBe(abilities.get('x2-trainer-kogoro-cure')!.mpCost);
  });
  it('an HP row is not touched: Darkness costs no MP whatever the words', () => {
    expect(cost([0x20, 0, 4], 'x2-dark-knight-darkness')).toBe(0);
  });
  it('a girl on a Garment Grid with Half MP Cost pays half, in the menu and when she casts (setup, menu and resolve all read the same words)', () => {
    const party = (grid: string): FFX2PartyBuild => ({ ...bevelleParty(24, grid), members: [member('yuna', 'Yuna', 'white-mage', 24, grid), member('rikku', 'Rikku', 'thief', 24, grid), member('paine', 'Paine', 'warrior', 24, grid)] });
    const play = (grid: string): { shown: number; paid: number } => {
      const engine = new FFX2Engine({ ...ffx2EngineOptions(), minigames: false });
      const s = setup(group('x', [bahamutEnemy()]), { seed: 3 });
      engine.setSeed(3);
      engine.init({ ...s, party: party(grid) });
      for (let step = 0; step < 4000; step++) {
        const d = engine.nextDecision();
        if (d.kind === 'waiting') engine.tick(Math.max(1, d.nextEventMs));
        else if (d.kind === 'player-input' && d.actorId === 'yuna') {
          const row = d.commands.find((c) => c.command.kind === 'ability' && c.command.id === 'x2-white-mage-cure')!;
          const before = (engine.state() as { combatants: Record<string, { mp: number }> }).combatants['yuna']!.mp;
          engine.submit({ kind: 'ability', id: 'x2-white-mage-cure', targets: ['yuna'] });
          // the spell charges before it fires: pump the clock until her MP moves
          let after = before;
          for (let n = 0; n < 3000 && after === before; n++) {
            const next = engine.nextDecision();
            if (next.kind === 'waiting') engine.tick(Math.max(1, next.nextEventMs));
            else if (next.kind === 'player-input') {
              const other = next.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? next.commands.find((c) => c.enabled)!;
              engine.submit({ ...other.command, targets: other.validTargets.slice(0, 1) } as never);
            }
            after = (engine.state() as { combatants: Record<string, { mp: number }> }).combatants['yuna']!.mp;
          }
          return { shown: row.mpCost, paid: before - after };
        } else if (d.kind === 'player-input') {
          const attack = d.commands.find((c) => c.enabled && c.command.kind === 'attack') ?? d.commands.find((c) => c.enabled)!;
          engine.submit({ ...attack.command, targets: attack.validTargets.slice(0, 1) } as never);
        }
      }
      throw new Error('Yuna never got a turn');
    };
    expect(play('first-steps')).toEqual({ shown: 4, paid: 4 });
    expect(play('font-of-power')).toEqual({ shown: 2, paid: 2 });
  });
});
