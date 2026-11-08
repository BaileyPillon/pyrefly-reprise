/**
 * The hidden Omega Ruins chapter's data (FFX only; number 43): the fourteen move rows pinned word for word to the kernel fixtures (`tests/fixtures/parity/ffx/command_records.json` and `command_status.json`), the three bodies
 * pinned field by field to the note (`research/re-ffx-omega-ultima-nemesis.md` sections 1, 2 and 5, "RE n"), the three formations as a chain, and the battle layer's copies of the ids pinned equal to the data layer's.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { FORMULA_NUMBER } from '../../../src/battle/ffx/adapt/command.ts';
import {
  NM_ID, NM_SCRIPT, OW_ID, OW_SCRIPT, UW_ID, UW_SCRIPT, WEAPON_MOVES,
  NM_COUNTER_FLAG, NM_STEP_FLAG, OW_COUNTER_FLAG, OW_STEP_FLAG, UW_TURN_FLAG,
} from '../../../src/battle/ffx/ai/weapons-rules.ts';
import { FORCED_ACTION_WORD } from '../../../src/battle/ffx/kernel/forced-action-table.ts';
import { MIX_ITEM_IDS } from '../../../src/battle/ffx/kernel/mix-table.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import {
  COMMAND_RECORDS_WEAPONS, WEAPON_ABILITIES, armageddon, coreEnergy, etherealCannon, nemesisAttack, nemesisUltima, omegaAttack, omegaNova, shimmeringRain, ultimaAttack, ultraSpark, weaponBreak, weaponConfuse, weaponSilence, weaponSleep,
} from '../../../src/data/ffx/enemies/weapons-abilities.ts';
import { RECORDS, WEAPON_DOOM_TURNS, WEAPON_OVERKILL, WEAPON_ZANMATO_BYTE, nemesis, omegaWeapon, ultimaWeapon } from '../../../src/data/ffx/enemies/weapons.ts';
import { nemesisGroup, omegaWeaponGroup, ultimaWeaponGroup } from '../../../src/data/ffx/enemies/weapons-groups.ts';
import {
  NEMESIS_GROUP_ID, NEMESIS_ID, NEMESIS_SCRIPT, OMEGA_GROUP_ID, OMEGA_WEAPON_ID, OMEGA_WEAPON_SCRIPT, ULTIMA_GROUP_ID, ULTIMA_WEAPON_ID, ULTIMA_WEAPON_SCRIPT, WEAPON_FLAGS, WEAPON_ROWS,
} from '../../../src/data/ffx/omega-ruins-ids.ts';
import { getAiScript } from '../../../src/battle/ffx/ai/types.ts';
import '../../../src/battle/ffx/ai/index.ts';

interface Fixture { columns: string[]; rows: number[][] }
const records = JSON.parse(readFileSync(new URL('../../fixtures/parity/ffx/command_records.json', import.meta.url), 'utf8')) as Fixture;
const statusFixture = JSON.parse(readFileSync(new URL('../../fixtures/parity/ffx/command_status.json', import.meta.url), 'utf8')) as { rows: Array<[number, number, number, number, number, number, Array<[number, number]>, Array<[number, number]>]> };
const COL = Object.fromEntries(records.columns.map((name, i) => [name, i])) as Record<string, number>;
const GAME = new Map(records.rows.map((r) => [r[0] as number, r]));
const STATUS = new Map(statusFixture.rows.map((r) => [r[0], r]));
const field = (row: number[], name: string): number => row[COL[name] as number] as number;

/** The fourteen rows: our ability, the game's record id, and the note's section 5 line (formula number, power, hits, the low two bits of the damage flags, the 99,999 cap, the accuracy formula). */
const ROWS = [
  { ability: ultimaAttack, id: 0x407f, formula: 1, power: 16, dmgType: 1, cap: false, accFormula: 2, accuracy: 120, crit: 0 },
  { ability: coreEnergy, id: 0x4022, formula: 3, power: 44, dmgType: 2, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: shimmeringRain, id: 0x4023, formula: 3, power: 30, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: weaponBreak, id: 0x604f, formula: 3, power: 0, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: weaponSilence, id: 0x606e, formula: 3, power: 0, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: weaponConfuse, id: 0x6072, formula: 3, power: 0, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: weaponSleep, id: 0x6071, formula: 3, power: 0, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: omegaAttack, id: 0x410f, formula: 1, power: 16, dmgType: 1, cap: true, accFormula: 0, accuracy: 0, crit: 25 },
  { ability: omegaNova, id: 0x4067, formula: 3, power: 60, dmgType: 0, cap: false, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: nemesisAttack, id: 0x40f0, formula: 1, power: 16, dmgType: 1, cap: true, accFormula: 0, accuracy: 0, crit: 10 },
  { ability: etherealCannon, id: 0x40d8, formula: 3, power: 255, dmgType: 2, cap: true, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: ultraSpark, id: 0x40d9, formula: 1, power: 32, dmgType: 0, cap: true, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: armageddon, id: 0x40f4, formula: 2, power: 36, dmgType: 0, cap: true, accFormula: 0, accuracy: 0, crit: 0 },
  { ability: nemesisUltima, id: 0x40f3, formula: 3, power: 70, dmgType: 2, cap: true, accFormula: 0, accuracy: 0, crit: 0 },
] as const;

describe('the battle layer keeps the data layer\'s ids (hard rule 1: the battle imports no src/data)', () => {
  it('the combatant, script and flag ids agree', () => {
    expect([UW_ID, OW_ID, NM_ID]).toEqual([ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID]);
    expect([UW_SCRIPT, OW_SCRIPT, NM_SCRIPT]).toEqual([ULTIMA_WEAPON_SCRIPT, OMEGA_WEAPON_SCRIPT, NEMESIS_SCRIPT]);
    expect([UW_TURN_FLAG, OW_COUNTER_FLAG, OW_STEP_FLAG, NM_COUNTER_FLAG, NM_STEP_FLAG]).toEqual([WEAPON_FLAGS.ultimaTurn, WEAPON_FLAGS.omegaCounter, WEAPON_FLAGS.omegaStep, WEAPON_FLAGS.nemesisCounter, WEAPON_FLAGS.nemesisStep]);
  });

  it('the seventeen move ids agree, and every one is a row the content registry has', () => {
    expect(WEAPON_MOVES).toEqual(WEAPON_ROWS);
    const known = new Set(ALL_ABILITIES.map((a) => a.id));
    for (const id of Object.values(WEAPON_ROWS)) expect(known.has(id), id).toBe(true);
  });

  it('the three scripts are registered under the ids the bodies name', () => {
    for (const id of [ULTIMA_WEAPON_SCRIPT, OMEGA_WEAPON_SCRIPT, NEMESIS_SCRIPT]) expect(getAiScript(id), id).toBeTypeOf('function');
    expect([ultimaWeapon().aiScriptId, omegaWeapon().aiScriptId, nemesis().aiScriptId]).toEqual([ULTIMA_WEAPON_SCRIPT, OMEGA_WEAPON_SCRIPT, NEMESIS_SCRIPT]);
  });
});

describe('the fourteen rows are the game\'s, word for word (RE 5)', () => {
  it('there are fourteen, each registered by its own id, each with a record', () => {
    expect(ROWS).toHaveLength(14);
    expect(Object.keys(WEAPON_ABILITIES)).toHaveLength(14);
    expect(Object.keys(COMMAND_RECORDS_WEAPONS).sort()).toEqual(Object.keys(WEAPON_ABILITIES).sort());
    for (const r of ROWS) expect(WEAPON_ABILITIES[r.ability.id], r.ability.id).toBe(r.ability);
  });

  for (const r of ROWS) {
    it(`${r.ability.id} is the record 0x${r.id.toString(16)}: type, both flag words, class, rank, shatter and every status byte of the fixtures`, () => {
      const rec = COMMAND_RECORDS_WEAPONS[r.ability.id]!;
      const game = GAME.get(r.id)!;
      const status = STATUS.get(r.id)!;
      expect(rec.id).toBe(r.id);
      expect([rec.type, rec.flagsMisc, rec.flagsDamage, rec.damageClass]).toEqual([field(game, 'type'), field(game, 'flagsMisc'), field(game, 'flagsDamage'), field(game, 'damageClass')]);
      expect(rec.shatter ?? 0).toBe(field(game, 'shatter'));
      const [, rank, extra, stageMask, , buff, chances, durations] = status;
      expect(rec.rank).toBe(rank);
      expect(rec.extra ?? 0).toBe(extra);
      expect(rec.stage?.[0] ?? 0).toBe(stageMask);
      expect(rec.buff ?? 0).toBe(buff);
      expect(JSON.stringify(rec.chances ?? [])).toBe(JSON.stringify(chances));
      expect(JSON.stringify(rec.durations ?? [])).toBe(JSON.stringify(durations));
    });

    it(`${r.ability.id} carries the note's numbers: formula ${r.formula}, power ${r.power}, ${r.dmgType === 1 ? 'physical' : r.dmgType === 2 ? 'magical' : 'special'}${r.cap ? ', the 99,999 cap' : ''}`, () => {
      const a = r.ability;
      const game = GAME.get(r.id)!;
      // A status-only row (Break, Silence, Confuse, Sleep) carries formula 3 in the game's record and power 0; ours is `none` (the engine reads the record, and the data test compares formulas only where a row damages).
      if (r.power === 0) expect(a.formula).toBe('none');
      else expect(FORMULA_NUMBER[a.formula]).toBe(r.formula);
      expect(field(game, 'formula')).toBe(r.formula);
      expect(a.power).toBe(r.power);
      expect(field(game, 'power')).toBe(r.power);
      expect(a.hits).toBe(field(game, 'hits'));
      expect(field(game, 'flagsDamage') & 3).toBe(r.dmgType);
      expect((field(game, 'flagsDamage') & 0x80) !== 0).toBe(r.cap);
      expect((field(game, 'flagsMisc') >>> 3) & 7).toBe(r.accFormula);
      expect(a.accuracy ?? 0).toBe(r.accuracy);
      expect(field(game, 'accuracy')).toBe(r.accuracy);
      expect(a.bonusCrit ?? 0).toBe(r.crit);
      expect(field(game, 'critBonus')).toBe(r.crit);
      expect(a.rank).toBe(3);
      expect(a.mpCost).toBe(0);
      expect(a.game).toBe('ffx');
      expect(a.category).toBe('enemy');
    });
  }

  it('rule 5: every row whose accuracy formula is 0 never misses (canMiss false); Ultima Weapon\'s Attack is the one that rolls', () => {
    for (const r of ROWS) {
      if (r.accFormula === 0) expect(r.ability.canMiss, r.ability.id).toBe(false);
      else expect(r.ability.canMiss, r.ability.id).toBeUndefined();
    }
    expect(ultimaAttack.accuracy).toBe(120);
  });

  it('the statuses the rows carry equal the record\'s: Break is Petrify 254, Silence and Sleep 100 for three turns, Confuse 100, Ultra Spark Poison, Power Break, Slow and Curse at 254', () => {
    expect(weaponBreak.statusEffects).toEqual([{ status: 'petrify', chance: 254, duration: 254 }]);
    expect(weaponSilence.statusEffects).toEqual([{ status: 'silence', chance: 100, duration: 3 }]);
    expect(weaponSleep.statusEffects).toEqual([{ status: 'sleep', chance: 100, duration: 3 }]);
    expect(weaponConfuse.statusEffects).toEqual([{ status: 'confuse', chance: 100, duration: 254 }]);
    expect(ultraSpark.statusEffects.map((s) => [s.status, s.chance, s.duration])).toEqual([['poison', 254, 254], ['power-break', 254, 254], ['slow', 254, 254], ['curse', 254, 254]]);
    for (const a of [weaponBreak, weaponSilence, weaponConfuse, weaponSleep]) expect(a.flags, a.id).toContain('reflectable');
    expect(nemesisUltima.flags).not.toContain('reflectable');
  });

  it('Nova is Omega Weapon\'s own monster row (0x4067, magic 60), not Kimahri\'s Ronso Rage Nova (0x3073, power 70)', () => {
    expect(COMMAND_RECORDS_WEAPONS[WEAPON_ROWS.nova]!.id).toBe(0x4067);
    const kimahri = ALL_ABILITIES.find((a) => a.record?.id === 0x3073);
    expect(kimahri).toBeDefined();
    expect(kimahri!.id).not.toBe(WEAPON_ROWS.nova);
    expect(omegaNova.power).toBe(60);
    expect(kimahri!.power).toBe(70);
  });
});

describe('the three bodies are the records of m99, m100 and m276 (RE 1.1 to 1.3)', () => {
  it('the stat blocks', () => {
    expect(RECORDS.ultima).toEqual([99_999, 99, 50, 60, 45, 60, 32, 15, 0, 0]);
    expect(RECORDS.omega).toEqual([999_999, 999, 64, 90, 57, 80, 38, 15, 0, 0]);
    expect(RECORDS.nemesis).toEqual([10_000_000, 9_999, 255, 150, 255, 150, 200, 0, 0, 150]);
    for (const [e, r] of [[ultimaWeapon(), RECORDS.ultima], [omegaWeapon(), RECORDS.omega], [nemesis(), RECORDS.nemesis]] as const) {
      expect([e.stats.hp, e.stats.mp, e.stats.str, e.stats.def, e.stats.mag, e.stats.mdef, e.stats.agi, e.stats.luck, e.stats.eva, e.stats.acc]).toEqual([...r]);
      expect([e.hp, e.mp, e.stats.maxHp, e.stats.maxMp]).toEqual([r[0], r[1], r[0], r[1]]);
    }
  });

  it('the overkill thresholds, the Zanmato bytes (3, 3, 4: the level is the byte plus one) and the Doom bytes', () => {
    expect(WEAPON_OVERKILL).toEqual({ ultima: 13_560, omega: 66_666, nemesis: 99_999 });
    expect(WEAPON_ZANMATO_BYTE).toEqual({ ultima: 3, omega: 3, nemesis: 4 });
    expect([ultimaWeapon().zanmatoLevel, omegaWeapon().zanmatoLevel, nemesis().zanmatoLevel]).toEqual([4, 4, 5]);
    expect([ultimaWeapon().doomTurns, omegaWeapon().doomTurns, nemesis().doomTurns]).toEqual([99, 222, 255]);
    expect(WEAPON_DOOM_TURNS).toEqual({ ultima: 99, omega: 222, nemesis: 255 });
    expect([ultimaWeapon().rewards.overkillThreshold, omegaWeapon().rewards.overkillThreshold, nemesis().rewards.overkillThreshold]).toEqual([13_560, 66_666, 99_999]);
  });

  it('every ailment is 255 on all three except Ultima Weapon\'s Silence and Darkness (95), Threaten never lands (a success percentage of 0), Slow is 255, and Scan, Eject and Auto-Life are immune', () => {
    const ailments = ['ko', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'sleep', 'slow', 'scan', 'eject', 'auto-life'] as const;
    for (const e of [ultimaWeapon(), omegaWeapon(), nemesis()]) {
      for (const s of ailments) expect(e.immunities[s], `${e.id} ${s}`).toBe(255);
      expect(e.threatenChance, e.id).toBe(0);
    }
    expect([ultimaWeapon().immunities.silence, ultimaWeapon().immunities.darkness]).toEqual([95, 95]);
    for (const e of [omegaWeapon(), nemesis()]) expect([e.immunities.silence, e.immunities.darkness], e.id).toEqual([255, 255]);
    for (const e of [ultimaWeapon(), omegaWeapon(), nemesis()]) for (const s of ['shell', 'protect', 'reflect', 'regen', 'haste'] as const) expect(e.immunities[s] ?? 0, `${e.id} ${s}`).toBe(0);
  });

  it('elements: Ultima Weapon none, Omega Weapon and Nemesis absorb all five', () => {
    expect(ultimaWeapon().affinities).toEqual({});
    for (const e of [omegaWeapon(), nemesis()]) expect(e.affinities, e.id).toEqual({ fire: 'absorb', ice: 'absorb', lightning: 'absorb', water: 'absorb', holy: 'absorb' });
  });

  it('the flag bytes: Nemesis alone is Armored; Ultima Weapon alone can be bribed; delay does nothing to any; all three are bosses (no Escape)', () => {
    expect(nemesis().immunityFlags).toContain('armored');
    expect(ultimaWeapon().immunityFlags).not.toContain('armored');
    expect(omegaWeapon().immunityFlags).not.toContain('armored');
    expect(ultimaWeapon().immunityFlags).not.toContain('immune-to-bribe');
    expect(omegaWeapon().immunityFlags).toContain('immune-to-bribe');
    expect(nemesis().immunityFlags).toContain('immune-to-bribe');
    for (const e of [ultimaWeapon(), omegaWeapon(), nemesis()]) for (const f of ['boss', 'immune-to-delay', 'immune-to-percentage-damage', 'immune-to-life', 'immune-to-sensor', 'immune-to-scan'] as const) expect(e.immunityFlags, `${e.id} ${f}`).toContain(f);
  });

  it('the rewards: gil, AP, drops and steals of the loot rows (RE 1.3)', () => {
    const u = ultimaWeapon().rewards;
    expect([u.gil, u.ap, u.apOverkill]).toEqual([20_000, 40_000, 50_000]);
    expect(u.drops).toEqual([{ itemId: 'lv-3-key-sphere', count: 3 }]);
    expect(u.steal).toEqual({ baseChance: 100, common: { itemId: 'door-to-tomorrow', count: 10 }, rare: { itemId: 'door-to-tomorrow', count: 20 } });
    expect(u.bribe).toEqual({ item: { itemId: 'pendulum', count: 99 }, immune: false });
    const o = omegaWeapon().rewards;
    expect([o.gil, o.ap, o.apOverkill]).toEqual([30_000, 50_000, 60_000]);
    expect(o.drops).toEqual([{ itemId: 'lv-4-key-sphere', count: 3 }]);
    expect(o.steal).toEqual({ baseChance: 100, common: { itemId: 'gamblers-spirit', count: 30 }, rare: { itemId: 'gamblers-spirit', count: 30 } });
    const n = nemesis().rewards;
    expect([n.gil, n.ap, n.apOverkill]).toEqual([0, 55_000, 55_000]);
    expect(n.drops).toEqual([{ itemId: 'warp-sphere', count: 1, rare: { itemId: 'dark-matter', count: 1, chance: 12.5 } }]);
    expect(n.steal).toEqual({ baseChance: 100, common: { itemId: 'lv-4-key-sphere', count: 1 }, rare: { itemId: 'warp-sphere', count: 1 } });
  });

  it('every item a reward names is an item of the game\'s 112 (the catalogue or the Mix chart\'s own ids)', () => {
    const named = new Set<string>();
    for (const e of [ultimaWeapon(), omegaWeapon(), nemesis()]) {
      const r = e.rewards;
      for (const d of r.drops) { named.add(d.itemId); if (d.rare) named.add(d.rare.itemId); }
      if (r.steal) { named.add(r.steal.common.itemId); named.add(r.steal.rare.itemId); }
      if (r.bribe) named.add(r.bribe.item.itemId);
    }
    for (const id of named) expect(MIX_ITEM_IDS.includes(id) || ITEMS[id] !== undefined, id).toBe(true);
  });

  it('the forced-action words: Attack 0x4000 for the two Weapons, none for Nemesis (all three are immune to Berserk, Confuse and Provoke)', () => {
    expect([FORCED_ACTION_WORD.get(ULTIMA_WEAPON_ID), FORCED_ACTION_WORD.get(OMEGA_WEAPON_ID), FORCED_ACTION_WORD.get(NEMESIS_ID)]).toEqual([0x4000, 0x4000, 0]);
  });

  it('each body lists the moves its script uses (RE 1.2), every one a known ability', () => {
    const known = new Set(ALL_ABILITIES.map((a) => a.id));
    for (const e of [ultimaWeapon(), omegaWeapon(), nemesis()]) for (const id of e.abilityIds) expect(known.has(id), `${e.id} ${id}`).toBe(true);
    expect(ultimaWeapon().abilityIds).toEqual(['ruins-ultima-attack', 'ruins-core-energy', 'ruins-shimmering-rain', 'ruins-break', 'ruins-silence', 'ruins-confuse', 'ruins-sleep', 'holy']);
    expect(omegaWeapon().abilityIds).toEqual(['ruins-omega-attack', 'ruins-core-energy', 'ruins-shimmering-rain', 'ruins-break', 'ruins-confuse', 'ruins-nova', 'ultima', 'demi']);
    expect(nemesis().abilityIds).toEqual(['ruins-nemesis-attack', 'ruins-ethereal-cannon', 'ruins-ultra-spark', 'ruins-armageddon', 'ruins-nemesis-ultima']);
  });
});

describe('the three formations are one chain (RE 2, preflight WP2)', () => {
  it('Ultima Weapon, then Omega Weapon, then Nemesis, each alone, registered by id in the data layer', () => {
    expect([ultimaWeaponGroup.id, omegaWeaponGroup.id, nemesisGroup.id]).toEqual([ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]);
    for (const g of [ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup]) expect(ENEMY_GROUPS_BY_ID[g.id], g.id).toBe(g);
    expect([ultimaWeaponGroup.nextGroupId, omegaWeaponGroup.nextGroupId, nemesisGroup.nextGroupId]).toEqual([OMEGA_GROUP_ID, NEMESIS_GROUP_ID, undefined]);
    expect([ultimaWeaponGroup.enemies, omegaWeaponGroup.enemies, nemesisGroup.enemies].map((e) => e.map((x) => x.id))).toEqual([[ULTIMA_WEAPON_ID], [OMEGA_WEAPON_ID], [NEMESIS_ID]]);
    expect([ultimaWeaponGroup.bossId, omegaWeaponGroup.bossId, nemesisGroup.bossId]).toEqual([ULTIMA_WEAPON_ID, OMEGA_WEAPON_ID, NEMESIS_ID]);
  });

  it('Escape and Flee are off for characters and aeons in all three (the two Ruins fights by the formation scripts; Nemesis\'s by the chapter\'s pick, WP12)', () => {
    for (const g of [ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup]) {
      expect(g.canEscape, g.id).toBe(false);
      expect(g.commandDisables, g.id).toEqual([{ who: 'everyone', command: 0x3003 }, { who: 'everyone', command: 0x3018 }]);
    }
  });

  it('the heal between the acts: Acts II and III restore the party and the aeons on entry, with no Save Sphere card, and are retry checkpoints; only the last link pools the spoils', () => {
    for (const g of [omegaWeaponGroup, nemesisGroup]) {
      expect([g.checkpointOnEntry, g.restoresPartyOnEntry, g.restoresAeonsOnEntry, g.noSaveSphereCard], g.id).toEqual([true, true, true, true]);
    }
    expect([ultimaWeaponGroup.checkpointOnEntry, ultimaWeaponGroup.restoresPartyOnEntry]).toEqual([undefined, undefined]);
    expect([ultimaWeaponGroup.poolsChainSpoils, omegaWeaponGroup.poolsChainSpoils, nemesisGroup.poolsChainSpoils]).toEqual([undefined, undefined, true]);
  });

  it('the music: the generic boss cue for the two Weapons, Yu Yevon\'s theme for Nemesis (flagged stand-ins; rule 13)', () => {
    expect(ultimaWeaponGroup.musicCues).toEqual([{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }]);
    expect(omegaWeaponGroup.musicCues).toEqual([{ at: 'start', track: 'boss-challenge', fadeMs: 1200 }]);
    expect(nemesisGroup.musicCues).toEqual([{ at: 'start', track: 'boss-yu-yevon', fadeMs: 1200 }]);
  });
});
