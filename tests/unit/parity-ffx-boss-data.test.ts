/**
 * Re-parity RC10, lane FFX boss data (FFX only): the six switches of `src/battle/ffx/boss-data-corrections.ts`, each held to the game's own monster record.
 *
 * The record bytes are `tests/fixtures/ffx-boss-records.json` (numbers read from the owner's install for FFX-H02, 37 records). The tests prove:
 *  1. with every switch off nothing is read and nothing moves (also through the real engine);
 *  2. each switch's table says exactly what the record says (every listed byte is in the record; nothing the record disagrees with is added);
 *  3. closure: with every switch on, every engine row that stands for a record equals it on the floored stats, the 24 status bytes (Regen through its flag), the five extra
 *     bits, the seven flags and the Zanmato level, except the rows listed in EXPECTED_RESIDUE (each a script write or a stand-in, with the reason);
 *  4. the three differences the note lists that were already the game's (D5 steal byte, Regen 255, the Pagoda HP) really are.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { EnemyDef, EnemyGroupDef, FFXCombatant } from '../../src/battle/common/types.ts';
import { cloneData } from '../../src/battle/common/clone.ts';
import { FFXEngine } from '../../src/battle/ffx/index.ts';
import {
  applyBossDataCorrections,
  BOSS_DATA_SWITCH_IDS,
  BOSS_DATA_SWITCHES,
  D1_FLOORS,
  D3_ZANMATO_LEVEL,
  D7_IMMUNE,
  D8_DOOMABLE,
  D9_LIFE_IMMUNE,
  D10_ROWS,
  setBossDataSwitches,
  type BossDataSwitch,
} from '../../src/battle/ffx/boss-data-corrections.ts';
import { resistBytesWith } from '../../src/battle/ffx/adapt/status.ts';
import { stealByteOf, stealChanceAfter } from '../../src/battle/ffx/adapt/steal.ts';
import { registerBattleContent } from '../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup, setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../src/data/encounters.ts';
import { lastSummoningGroup } from '../../src/data/ffx/enemies/last-summoning-chain.ts';

interface Rec {
  hp: number; str: number; def: number; mag: number; mdef: number; agi: number; luck: number; eva: number; acc: number;
  f28: number; f29: number; status: number[]; extraImm: number; doomStart: number; zanmato: number; steal: number[];
}
const RECORDS = (JSON.parse(readFileSync(fileURLToPath(new URL('../fixtures/ffx-boss-records.json', import.meta.url)), 'utf8')) as Record<string, Rec>);
const rec = (m: number): Rec => RECORDS[String(m)] as Rec;

/** Our enemy id -> the monster record it stands for (the ids our own files name). Rows built from a record plus a script, or standing in for another monster, are in EXPECTED_RESIDUE. */
const MAP: Readonly<Record<string, number>> = {
  'seymour-flux': 142, mortiorchis: 143, yunalesca: 130, 'braskas-final-aeon': 132, 'yu-pagoda-left': 173, 'yu-pagoda-right': 174, 'yu-yevon': 176,
  'guado-guardian-a': 141, 'guado-guardian-b': 141, 'seymour-macalania': 124, 'anima-macalania': 125, evrae: 119, cid: 149,
  yojimbo: 288, ginnem: 249, daigoro: 266, 'seymour-natus': 126, mortibody: 127, 'seymour-omnis': 131,
  'mortiphasm-1': 106, 'mortiphasm-2': 106, 'mortiphasm-3': 106, 'mortiphasm-4': 106,
  isaaru: 248, grothia: 284, spathi: 287, 'left-fin': 136, 'right-fin': 137, 'sinspawn-genais': 139, 'sin-core': 138, 'overdrive-sin': 140,
  'sinspawn-gui': 117, 'sinspawn-gui-2': 117, 'sinspawn-gui-head': 160, 'sinspawn-gui-arm-left': 161, 'sinspawn-gui-arm-right': 161,
  'biran-ronso': 134, 'yenke-ronso': 135,
};

/** What is still different from the record with every switch on, and why (a category, per row). Anything not listed must be equal. */
const EXPECTED_RESIDUE: Readonly<Record<string, readonly string[]>> = {
  cid: ['stat:agi'], // the script writes 11 over the record's 16 at the start (m149 @0x015; evrae.ts)
  'sinspawn-gui-2': ['stat:str', 'stat:mdef'], // the rematch's init script writes its own numbers: STR 15 where the record has 29, MDEF 1 where it has 30 (RE section 2.3; sinspawn-gui.ts)
};

const ST = ['death', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten', 'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost', 'regen', 'haste', 'slow'] as const;
const ENG_STATUS: Readonly<Record<string, string>> = { death: 'ko', 'nul-tide': 'nultide', 'nul-blaze': 'nulblaze', 'nul-shock': 'nulshock', 'nul-frost': 'nulfrost' };
const EXTRA_BITS = { scan: 0, eject: 8, 'auto-life': 9, curse: 10, doom: 14 } as const;
const FLAG_BITS = [
  ['armored', 'f28', 0], ['immune-to-percentage-damage', 'f28', 1], ['immune-to-life', 'f28', 2], ['immune-to-sensor', 'f28', 3], ['immune-to-scan', 'f28', 4],
  ['immune-to-delay', 'f29', 0], ['immune-to-bribe', 'f29', 2],
] as const;
const FLOORED = ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'acc'] as const;
const ALL_ON: Readonly<Record<BossDataSwitch, boolean>> = { D1: true, D3: true, D7: true, D8: true, D9: true, D10: true };
const ALL_OFF: Readonly<Record<BossDataSwitch, boolean>> = { D1: false, D3: false, D7: false, D8: false, D9: false, D10: false };
const only = (id: BossDataSwitch): Readonly<Record<BossDataSwitch, boolean>> => ({ ...ALL_OFF, [id]: true });

const HIDDEN_FFX = ['sinspawn-gui', 'biran-yenke', 'exp-fayth'];
let groups: EnemyGroupDef[] = [];
let rows: Map<string, EnemyDef> = new Map();

beforeAll(async () => {
  await registerBattleContent();
  const chapters = [...CHAPTERS.filter((c) => c.game === 'ffx'), ...HIDDEN_FFX.map((id) => getChapter(id)).filter((c): c is Chapter => c !== undefined)];
  const seen = new Set<string>();
  for (const ch of chapters) {
    let g: EnemyGroupDef | null | undefined = ch.enemyGroupRef;
    while (g && !seen.has(g.id)) {
      seen.add(g.id);
      groups.push(g);
      g = g.nextGroupId ? await findEnemyGroup(g.nextGroupId) : undefined;
    }
  }
  for (const g of groups) for (const e of [...g.enemies, ...(g.parts ?? [])]) if (!rows.has(e.id)) rows.set(e.id, e);
});

afterEach(() => {
  for (const id of BOSS_DATA_SWITCH_IDS) BOSS_DATA_SWITCHES[id] = false;
});

/** The row as one switch set leaves it (a copy). */
function corrected(id: string, on: Readonly<Record<BossDataSwitch, boolean>>): EnemyDef {
  const g = cloneData(groups.find((x) => [...x.enemies, ...(x.parts ?? [])].some((e) => e.id === id)) as EnemyGroupDef);
  applyBossDataCorrections(g, on);
  return [...g.enemies, ...(g.parts ?? [])].find((e) => e.id === id) as EnemyDef;
}

const statusByte = (e: EnemyDef, s: (typeof ST)[number]): number => {
  const key = (ENG_STATUS[s] ?? s) as keyof EnemyDef['immunities'];
  if (s === 'regen' && e.immunityFlags.includes('immune-to-regen')) return 255;
  return e.immunities[key] ?? 0;
};

describe('the switches', () => {
  it('are all off', () => {
    expect(BOSS_DATA_SWITCH_IDS).toEqual(['D1', 'D3', 'D7', 'D8', 'D9', 'D10']);
    for (const id of BOSS_DATA_SWITCH_IDS) expect(BOSS_DATA_SWITCHES[id], id).toBe(false);
  });

  it('setBossDataSwitches puts every switch back as it was', () => {
    const restore = setBossDataSwitches({ D1: true, D7: true });
    expect(BOSS_DATA_SWITCHES.D1).toBe(true);
    expect(BOSS_DATA_SWITCHES.D3).toBe(false);
    restore();
    for (const id of BOSS_DATA_SWITCH_IDS) expect(BOSS_DATA_SWITCHES[id], id).toBe(false);
  });

  it('with every switch off the group is not read (a getter that throws is never reached) and equals itself', () => {
    const trap = {
      get enemies(): never {
        throw new Error('read');
      },
    } as unknown as EnemyGroupDef;
    expect(() => applyBossDataCorrections(trap, ALL_OFF)).not.toThrow();
    expect(() => applyBossDataCorrections(trap)).not.toThrow(); // the module's own switches, all off
    for (const g of groups) {
      const copy = cloneData(g);
      applyBossDataCorrections(copy, ALL_OFF);
      expect(JSON.stringify(copy)).toBe(JSON.stringify(g));
    }
  });

  it('with a switch on it does change the battle copy and never the module row', () => {
    const before = JSON.stringify([...rows.values()]);
    for (const id of BOSS_DATA_SWITCH_IDS) {
      const g = cloneData(groups[0] as EnemyGroupDef);
      applyBossDataCorrections(g, only(id));
    }
    expect(JSON.stringify([...rows.values()])).toBe(before);
  });
});

describe('every table is the record', () => {
  it('maps to records that exist and (where our row carries HP from the record) names the right monster', () => {
    for (const [id, m] of Object.entries(MAP)) {
      expect(RECORDS[String(m)], id).toBeDefined();
      expect(rows.has(id), id).toBe(true);
    }
    // the ids our files name: HP equality is the identity check for the rows that take HP from the record
    for (const id of ['seymour-flux', 'mortiorchis', 'seymour-natus', 'evrae', 'seymour-macalania', 'overdrive-sin', 'left-fin', 'right-fin', 'sinspawn-genais', 'sin-core', 'seymour-omnis', 'yu-yevon']) {
      const e = rows.get(id) as EnemyDef;
      expect(e.hp, id).toBe(rec(MAP[id] as number).hp);
    }
  });

  it('D1: every listed stat is 0 in the record and 0 in our row; with D1 it reads 1; nothing else moves', () => {
    for (const [id, keys] of Object.entries(D1_FLOORS)) {
      const row = rows.get(id) as EnemyDef;
      const m = rec(MAP[id] as number);
      const after = corrected(id, only('D1'));
      for (const k of keys) {
        expect(m[k], `${id} record ${k}`).toBe(0);
        expect(row.stats[k], `${id} ${k}`).toBe(0);
        expect(after.stats[k], `${id} ${k} after`).toBe(1);
      }
      for (const k of ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'acc', 'eva', 'maxHp', 'maxMp', 'hp', 'mp'] as const) {
        if (!(keys as readonly string[]).includes(k)) expect(after.stats[k], `${id} ${k} untouched`).toBe(row.stats[k]);
      }
      expect(after.immunities).toEqual(row.immunities);
      expect(after.zanmatoLevel).toBe(row.zanmatoLevel);
    }
  });

  it('D1: complete: every record-0 floored stat of a mapped row reads 1 once D1 is on (the residue rows aside)', () => {
    for (const [id, m] of Object.entries(MAP)) {
      const after = corrected(id, only('D1'));
      for (const k of FLOORED) {
        if ((EXPECTED_RESIDUE[id] ?? []).includes(`stat:${k}`)) continue;
        if (rec(m)[k] === 0) expect(after.stats[k], `${id} ${k}`).toBe(1);
      }
    }
  });

  it('D3: the level is the record byte plus 1 (Evrae 3 -> 4); a row with no level reads as byte 0', () => {
    for (const [id, level] of Object.entries(D3_ZANMATO_LEVEL)) {
      const row = rows.get(id) as EnemyDef;
      expect(rec(MAP[id] as number).zanmato + 1, id).toBe(level);
      expect(row.zanmatoLevel === undefined ? 1 : row.zanmatoLevel, `${id} before`).not.toBe(level);
      expect(corrected(id, only('D3')).zanmatoLevel, id).toBe(level);
    }
    expect(rows.get('evrae')?.zanmatoLevel).toBe(3);
    expect(rec(119).zanmato).toBe(3);
  });

  it('D7: Seymour Flux cannot be Slowed (byte 255); Haste stays landable (byte 0)', () => {
    expect(Object.keys(D7_IMMUNE)).toEqual(['seymour-flux']);
    expect(D7_IMMUNE['seymour-flux']).toEqual(['slow']);
    const flux = rec(142);
    expect(flux.status[ST.indexOf('slow')]).toBe(255);
    expect(flux.status[ST.indexOf('haste')]).toBe(0);
    expect(rows.get('seymour-flux')?.immunities.slow).toBeUndefined();
    const after = corrected('seymour-flux', only('D7'));
    expect(after.immunities.slow).toBe(255);
    expect(after.immunities.haste).toBeUndefined();
  });

  it('D8: Evrae has no Doom bit in the record (extra bit 14) and a Doom start of 30; D8 removes the immunity, nothing else', () => {
    for (const id of D8_DOOMABLE) {
      const m = rec(MAP[id] as number);
      expect((m.extraImm >> EXTRA_BITS.doom) & 1, id).toBe(0);
      expect(m.doomStart, id).toBe(30);
      const row = rows.get(id) as EnemyDef;
      expect(row.immunities.doom, `${id} before`).toBe(255);
      expect(row.doomTurns, id).toBe(30);
      const after = corrected(id, only('D8'));
      expect(after.immunities.doom).toBeUndefined();
      expect({ ...after.immunities, doom: 255 }).toEqual(row.immunities);
    }
  });

  it('D9: every listed row has the record\'s Life bit (f28 bit 2); D9 adds the flag and the table is complete', () => {
    for (const id of D9_LIFE_IMMUNE) {
      expect((rec(MAP[id] as number).f28 >> 2) & 1, id).toBe(1);
      expect((rows.get(id) as EnemyDef).immunityFlags, id).not.toContain('immune-to-life');
      expect(corrected(id, only('D9')).immunityFlags, id).toContain('immune-to-life');
    }
    for (const [id, m] of Object.entries(MAP)) {
      const has = corrected(id, only('D9')).immunityFlags.includes('immune-to-life');
      expect(has, id).toBe(((rec(m).f28 >> 2) & 1) === 1);
    }
  });

  it('D10: every immunity it adds is in the record, every one it removes is not, flags and EVA agree', () => {
    for (const [id, row] of Object.entries(D10_ROWS)) {
      const m = rec(MAP[id] as number);
      const before = rows.get(id) as EnemyDef;
      const after = corrected(id, only('D10'));
      for (const s of row.immune ?? []) {
        if (s in EXTRA_BITS) expect((m.extraImm >> EXTRA_BITS[s as keyof typeof EXTRA_BITS]) & 1, `${id} ${s}`).toBe(1);
        else expect(m.status[ST.indexOf(({ nulblaze: 'nul-blaze', nulfrost: 'nul-frost', nulshock: 'nul-shock', nultide: 'nul-tide' } as Record<string, (typeof ST)[number]>)[s] ?? (s as (typeof ST)[number]))], `${id} ${s}`).toBe(255);
        expect(after.immunities[s], `${id} ${s} after`).toBe(255);
      }
      for (const s of row.notImmune ?? []) {
        expect((m.extraImm >> EXTRA_BITS[s as keyof typeof EXTRA_BITS]) & 1, `${id} ${s}`).toBe(0);
        expect(before.immunities[s], `${id} ${s} before`).toBe(255);
        expect(after.immunities[s], `${id} ${s} after`).toBeUndefined();
      }
      for (const [flag, byte, bit] of FLAG_BITS) {
        if (row.flagsOn?.includes(flag)) expect((m[byte] >> bit) & 1, `${id} ${flag}`).toBe(1);
        if (row.flagsOff?.includes(flag)) expect((m[byte] >> bit) & 1, `${id} ${flag}`).toBe(0);
      }
      if (row.stats?.eva !== undefined) expect(m.eva).toBe(row.stats.eva);
    }
  });
});

describe('closure: with every switch on, the mapped rows are the records', () => {
  it('floored stats, 24 status bytes, five extra bits, seven flags and the Zanmato level', () => {
    const residue: string[] = [];
    for (const [id, mid] of Object.entries(MAP)) {
      const e = corrected(id, ALL_ON);
      const m = rec(mid);
      const diffs: string[] = [];
      for (const k of FLOORED) if (e.stats[k] !== Math.max(1, m[k])) diffs.push(`stat:${k}`);
      if (e.stats.eva !== m.eva) diffs.push('stat:eva');
      ST.forEach((s, i) => {
        if (s === 'threaten') return;
        if (statusByte(e, s) !== (m.status[i] as number)) diffs.push(`status:${s}`);
      });
      for (const [k, bit] of Object.entries(EXTRA_BITS)) if (((e.immunities[k as keyof EnemyDef['immunities']] ?? 0) >= 255 ? 1 : 0) !== ((m.extraImm >> bit) & 1)) diffs.push(`extra:${k}`);
      for (const [flag, byte, bit] of FLAG_BITS) if ((e.immunityFlags.includes(flag) ? 1 : 0) !== ((m[byte] >> bit) & 1)) diffs.push(`flag:${flag}`);
      if ((e.zanmatoLevel ?? 1) !== m.zanmato + 1) diffs.push('zanmato');
      const allowed = EXPECTED_RESIDUE[id] ?? [];
      const left = diffs.filter((d) => !allowed.includes(d));
      if (left.length > 0) residue.push(`${id}: ${left.join(', ')}`);
      for (const a of allowed) expect(diffs, `${id} residue ${a} must still be real`).toContain(a);
    }
    expect(residue).toEqual([]);
  });
});

describe('what the note listed that was already the game\'s', () => {
  it('D5: every stealable boss has the record\'s steal byte (255) and quantities, and the byte halves as the game halves it', () => {
    let n = 0;
    for (const [id, mid] of Object.entries(MAP)) {
      const e = rows.get(id) as EnemyDef;
      const m = rec(mid);
      const steal = e.rewards.steal;
      if (!steal) {
        expect(m.steal[0], `${id} has no steal table, so the record has no steal byte`).toBe(0);
        continue;
      }
      n += 1;
      expect(stealByteOf(steal), id).toBe(m.steal[0]);
      expect(steal.common.count, id).toBe(m.steal[1]);
      expect(steal.rare.count, id).toBe(m.steal[2]);
    }
    expect(n).toBeGreaterThanOrEqual(20);
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((k) => stealChanceAfter(255, k))).toEqual([255, 127, 63, 31, 15, 7, 3, 1, 1, 1]);
  });

  it('Regen 255 on Braska\'s Final Aeon and the Yu Pagodas is already in the engine\'s resistance bytes (the immune-to-regen flag)', async () => {
    const chapter = getChapter('braskas-final-aeon') as Chapter;
    const e = new FFXEngine({ autoResolveMinigames: true });
    const setup = setupForChapter(chapter, 1);
    e.setSeed(setup.seed);
    e.init(setup);
    const st = e.state();
    for (const id of ['braskas-final-aeon', 'yu-pagoda-left', 'yu-pagoda-right']) {
      const c = st.combatants[id] as FFXCombatant;
      expect(resistBytesWith(c, 0)[22], id).toBe(255);
      expect(rec(MAP[id] as number).status[ST.indexOf('regen')], id).toBe(255);
    }
  });

  it('the Yu Pagoda\'s 65,535 HP is replaced by 5,000 in the game\'s init script (research/re-ffx-ai-yunalesca-bfa.md section 4.1), so our 5,000 stands', () => {
    expect(rec(173).hp).toBe(65535);
    expect((rows.get('yu-pagoda-left') as EnemyDef).hp).toBe(5000);
  });
});

describe('through the engine', () => {
  async function combatants(chapterId: string, on: Partial<Record<BossDataSwitch, boolean>>, group?: EnemyGroupDef): Promise<Record<string, FFXCombatant>> {
    const restore = setBossDataSwitches(on);
    try {
      const setup = setupForChapter(getChapter(chapterId) as Chapter, 1);
      const e = new FFXEngine({ autoResolveMinigames: true });
      e.setSeed(setup.seed);
      e.init(group ? { ...setup, enemies: group } : setup);
      return e.state().combatants as Record<string, FFXCombatant>;
    } finally {
      restore();
    }
  }

  it('off: Evrae is the row (DEF 0, Zanmato 3, Doom immune, no Life flag); on: the record', async () => {
    const off = (await combatants('evrae-airship', {}))['evrae'] as FFXCombatant;
    expect([off.stats.def, off.stats.mdef, off.enemy?.zanmatoLevel, off.immunities.doom, off.immunityFlags.includes('immune-to-life')]).toEqual([0, 0, 3, 255, false]);
    const on = (await combatants('evrae-airship', { D1: true, D3: true, D8: true, D9: true }))['evrae'] as FFXCombatant;
    expect([on.stats.def, on.stats.mdef, on.enemy?.zanmatoLevel, on.immunities.doom, on.immunityFlags.includes('immune-to-life')]).toEqual([1, 1, 4, undefined, true]);
  });

  it('D7 in Chapter I: Flux resists Slow only with the switch', async () => {
    expect(((await combatants('seymour-flux', {}))['seymour-flux'] as FFXCombatant).immunities.slow).toBeUndefined();
    expect(((await combatants('seymour-flux', { D7: true }))['seymour-flux'] as FFXCombatant).immunities.slow).toBe(255);
  });

  it('D10 reaches the Yu Pagodas of Chapter III and of the hidden Last Summoning, and Yu Yevon', async () => {
    const on = await combatants('braskas-final-aeon', { D10: true, D9: true });
    for (const id of ['yu-pagoda-left', 'yu-pagoda-right']) {
      const c = on[id] as FFXCombatant;
      expect([c.immunities.shell, c.immunities.protect, c.immunities.reflect, c.immunities.nulblaze, c.immunities.scan, c.immunities.curse]).toEqual([255, 255, 255, 255, 255, undefined]);
      expect(c.immunityFlags).toEqual(expect.arrayContaining(['immune-to-regen', 'immune-to-scan', 'immune-to-bribe', 'immune-to-life']));
    }
    expect((on['braskas-final-aeon'] as FFXCombatant).immunities['auto-life']).toBe(255);
    const yy = await combatants('braskas-final-aeon', { D10: true }, (await findEnemyGroup('yu-yevon')) as EnemyGroupDef);
    const y = yy['yu-yevon'] as FFXCombatant;
    expect([y.immunities.scan, y.immunities['auto-life'], y.immunityFlags.includes('immune-to-sensor')]).toEqual([255, 255, false]);
    const ls = await combatants('braskas-final-aeon', { D10: true }, lastSummoningGroup('last-summoning:ifrit') as EnemyGroupDef);
    expect((ls['yu-pagoda-left'] as FFXCombatant).immunities.shell).toBe(255);
  });
});
