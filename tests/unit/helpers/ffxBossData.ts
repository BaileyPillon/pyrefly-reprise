/**
 * Shared pieces of the boss-data tests (re-parity RC10, lane FFX boss data; **FFX only**): the record fixture, our enemy id -> record id map, the engine rows of every
 * FFX chapter (listed and hidden, link by link), and the row as a switch set leaves it. See `parity-ffx-boss-data.test.ts`.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { EnemyDef, EnemyGroupDef } from '../../../src/battle/common/types.ts';
import { cloneData } from '../../../src/battle/common/clone.ts';
import { applyBossDataCorrections, type BossDataSwitch } from '../../../src/battle/ffx/boss-data-corrections.ts';
import { registerBattleContent } from '../../../src/app/screens/BattleScreenContent.ts';
import { findEnemyGroup } from '../../../src/app/screens/BattleScreenSetup.ts';
import { CHAPTERS, getChapter, type Chapter } from '../../../src/data/encounters.ts';

export interface Rec {
  hp: number; str: number; def: number; mag: number; mdef: number; agi: number; luck: number; eva: number; acc: number;
  f28: number; f29: number; status: number[]; extraImm: number; doomStart: number; zanmato: number; steal: number[];
}
export const RECORDS = JSON.parse(readFileSync(fileURLToPath(new URL('../../fixtures/ffx-boss-records.json', import.meta.url)), 'utf8')) as Record<string, Rec>;
export const rec = (m: number): Rec => RECORDS[String(m)] as Rec;

/** Our enemy id -> the monster record it stands for (the ids our own files name). Rows built from a record plus a script are in EXPECTED_RESIDUE. */
export const MAP: Readonly<Record<string, number>> = {
  'seymour-flux': 142, mortiorchis: 143, yunalesca: 130, 'braskas-final-aeon': 132, 'yu-pagoda-left': 173, 'yu-pagoda-right': 174, 'yu-yevon': 176,
  'guado-guardian-a': 141, 'guado-guardian-b': 141, 'seymour-macalania': 124, 'anima-macalania': 125, evrae: 119, cid: 149,
  yojimbo: 288, ginnem: 249, daigoro: 266, 'seymour-natus': 126, mortibody: 127, 'seymour-omnis': 131,
  'mortiphasm-1': 106, 'mortiphasm-2': 106, 'mortiphasm-3': 106, 'mortiphasm-4': 106,
  isaaru: 248, grothia: 284, spathi: 287, 'left-fin': 136, 'right-fin': 137, 'sinspawn-genais': 139, 'sin-core': 138, 'overdrive-sin': 140,
  'sinspawn-gui': 117, 'sinspawn-gui-2': 117, 'sinspawn-gui-head': 160, 'sinspawn-gui-arm-left': 161, 'sinspawn-gui-arm-right': 161,
  'biran-ronso': 134, 'yenke-ronso': 135,
};

/** What is still different from the record with every switch on, and why (a category, per row). Anything not listed must be equal. */
export const EXPECTED_RESIDUE: Readonly<Record<string, readonly string[]>> = {
  cid: ['stat:agi'], // the script writes 11 over the record's 16 at the start (m149 @0x015; evrae.ts)
  'sinspawn-gui-2': ['stat:str', 'stat:mdef'], // the rematch's init script writes its own numbers: STR 15 where the record has 29, MDEF 1 where it has 30 (RE section 2.3; sinspawn-gui.ts)
};

export const ST = ['death', 'zombie', 'petrify', 'poison', 'power-break', 'magic-break', 'armor-break', 'mental-break', 'confuse', 'berserk', 'provoke', 'threaten', 'sleep', 'silence', 'darkness', 'shell', 'protect', 'reflect', 'nul-tide', 'nul-blaze', 'nul-shock', 'nul-frost', 'regen', 'haste', 'slow'] as const;
export const ENG_STATUS: Readonly<Record<string, string>> = { death: 'ko', 'nul-tide': 'nultide', 'nul-blaze': 'nulblaze', 'nul-shock': 'nulshock', 'nul-frost': 'nulfrost' };
export const EXTRA_BITS = { scan: 0, eject: 8, 'auto-life': 9, curse: 10, doom: 14 } as const;
export const FLAG_BITS = [
  ['armored', 'f28', 0], ['immune-to-percentage-damage', 'f28', 1], ['immune-to-life', 'f28', 2], ['immune-to-sensor', 'f28', 3], ['immune-to-scan', 'f28', 4],
  ['immune-to-delay', 'f29', 0], ['immune-to-bribe', 'f29', 2],
] as const;
export const FLOORED = ['str', 'def', 'mag', 'mdef', 'agi', 'luck', 'acc'] as const;
export const ALL_ON: Readonly<Record<BossDataSwitch, boolean>> = { D1: true, D3: true, D7: true, D8: true, D9: true, D10: true };
export const ALL_OFF: Readonly<Record<BossDataSwitch, boolean>> = { D1: false, D3: false, D7: false, D8: false, D9: false, D10: false };
export const only = (id: BossDataSwitch): Readonly<Record<BossDataSwitch, boolean>> => ({ ...ALL_OFF, [id]: true });

const HIDDEN_FFX = ['sinspawn-gui', 'biran-yenke', 'exp-fayth'];

/** Every enemy group of every FFX chapter (the groups, link by link) and the first row of each enemy id; filled in place by {@link loadWorld}. */
export const world = { groups: [] as EnemyGroupDef[], rows: new Map<string, EnemyDef>() };

export async function loadWorld(): Promise<void> {
  await registerBattleContent();
  if (world.groups.length > 0) return;
  const chapters = [...CHAPTERS.filter((c) => c.game === 'ffx'), ...HIDDEN_FFX.map((id) => getChapter(id)).filter((c): c is Chapter => c !== undefined)];
  const seen = new Set<string>();
  for (const ch of chapters) {
    let g: EnemyGroupDef | null | undefined = ch.enemyGroupRef;
    while (g && !seen.has(g.id)) {
      seen.add(g.id);
      world.groups.push(g);
      g = g.nextGroupId ? await findEnemyGroup(g.nextGroupId) : undefined;
    }
  }
  for (const g of world.groups) for (const e of [...g.enemies, ...(g.parts ?? [])]) if (!world.rows.has(e.id)) world.rows.set(e.id, e);
}

/** The row as one switch set leaves it (a copy). */
export function corrected(id: string, on: Readonly<Record<BossDataSwitch, boolean>>): EnemyDef {
  const g = cloneData(world.groups.find((x) => [...x.enemies, ...(x.parts ?? [])].some((e) => e.id === id)) as EnemyGroupDef);
  applyBossDataCorrections(g, on);
  return [...g.enemies, ...(g.parts ?? [])].find((e) => e.id === id) as EnemyDef;
}

/** The resistance byte the engine ends up with for a status (Regen through its flag). */
export const statusByte = (e: EnemyDef, s: (typeof ST)[number]): number => {
  const key = (ENG_STATUS[s] ?? s) as keyof EnemyDef['immunities'];
  if (s === 'regen' && e.immunityFlags.includes('immune-to-regen')) return 255;
  return e.immunities[key] ?? 0;
};
