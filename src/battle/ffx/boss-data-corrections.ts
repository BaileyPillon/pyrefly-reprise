/**
 * The boss rows' remaining differences from the game's own monster records, each behind a switch that is **off** (re-parity RC10, lane FFX boss data; **FFX only**).
 *
 * Source: the private note FFX-H02 section 7 (rows D1, D3, D7, D8, D9, D10) and the status / element / flag paragraph under it, re-read for this lane from the game's own
 * monster files (361 records, 6,498 fields compared with the note's decode, 0 differences). Every number below is a byte of a record, written as our ids and our status names:
 * no game text, no game code. `tests/unit/parity-ffx-boss-data.test.ts` holds each table to a fixture of those bytes (`tests/fixtures/ffx-boss-records.json`).
 *
 * **House rule for boss data: never tune a boss number.** These are the game's, built so they can be measured and then chosen by the owner; nothing here is on. With every
 * switch false `applyBossDataCorrections` returns before it reads a row, so every battle is the one it was (proved: the 12-seed logs of every FFX chapter are byte-identical).
 *
 * Rows the note lists that are **not** here, and why: D5 (steal chance byte 255) is already the game's since re-parity W5 (`adapt/steal.ts` turns the table's 100 percent into
 * the byte 255 and halves a byte: 255, 127, 63 ...); D2 (enemy Overdrive reference damage) has no reader; D4 (two missing drops) was closed by the kill-rewards lane; D6 (Bribe items of
 * Bribe-immune bosses) is unreachable; D11 to D16 match. Regen 255 on Braska's Final Aeon and the Yu Pagodas is already the game's through their `immune-to-regen` flag
 * (`adapt/status.ts#resistBytesWith` makes the Regen byte 255).
 *
 * The corrections are applied to the battle's own deep copy of the group (`setup.ts#buildBattle`), so the module-level rows in `src/data/ffx/enemies/**` are never touched.
 */

import type { EnemyDef, EnemyGroupDef, ImmunityFlag, StatBlock, StatusId } from '../common/types.ts';

/** One switch per row of the note's section 7 (D1, D3, D7, D8, D9, D10). */
export type BossDataSwitch = 'D1' | 'D3' | 'D7' | 'D8' | 'D9' | 'D10';

export const BOSS_DATA_SWITCH_IDS: readonly BossDataSwitch[] = ['D1', 'D3', 'D7', 'D8', 'D9', 'D10'];

/**
 * The switches. All **false** (the owner decides; a bench or a test flips one and puts it back with the function `setBossDataSwitches` returns).
 * - **D1** monster stat floors: STR, DEF, MAG, MDEF, AGI, LCK and ACC are at least 1 in the game's character (EVA and the poison percent may be 0).
 * - **D3** the Zanmato level of the rows whose record byte plus 1 differs from ours (Evrae 3 -> 4; Mortibody, Ginnem, Isaaru carry none).
 * - **D7** Seymour Flux cannot be Slowed (the record's Slow byte is 255; the data said landable).
 * - **D8** Evrae can be Doomed (the record's Doom immunity bit is clear; the data followed the wiki).
 * - **D9** the Life-immune flag the record sets on nine of our rows.
 * - **D10** the immunity bytes, bits and flags the record has and our rows lack (Braska's Final Aeon, Yu Pagodas, Mortiphasm, Yu Yevon, Cid, Ginnem, Daigoro, Isaaru).
 */
export const BOSS_DATA_SWITCHES: Record<BossDataSwitch, boolean> = { D1: false, D3: false, D7: false, D8: false, D9: false, D10: false };

/** Set switches; the returned function puts every switch back as it was. */
export function setBossDataSwitches(on: Partial<Record<BossDataSwitch, boolean>>): () => void {
  const before = { ...BOSS_DATA_SWITCHES };
  for (const id of BOSS_DATA_SWITCH_IDS) {
    const v = on[id];
    if (v !== undefined) BOSS_DATA_SWITCHES[id] = v;
  }
  return () => {
    for (const id of BOSS_DATA_SWITCH_IDS) BOSS_DATA_SWITCHES[id] = before[id];
  };
}

type StatKey = 'str' | 'def' | 'mag' | 'mdef' | 'agi' | 'luck' | 'acc';

/**
 * D1: the stats whose record byte is 0 and whose row still says 0 (record id in the comment). Rows that already read 1 (the Gui chapter's, Cid's MAG, LCK and ACC, the
 * Mortiphasm's MAG, LCK and ACC) and rows whose value a script writes (the possessed aeons, the Dark Aeons) are not listed.
 */
export const D1_FLOORS: Readonly<Record<string, readonly StatKey[]>> = {
  mortiorchis: ['mdef'], // m143
  yunalesca: ['acc'], // m130
  'yu-pagoda-left': ['def', 'acc'], // m173
  'yu-pagoda-right': ['def', 'acc'], // m174
  'yu-yevon': ['def', 'mdef', 'luck', 'acc'], // m176
  'guado-guardian-a': ['def', 'mdef'], // m141
  'guado-guardian-b': ['def', 'mdef'], // m141
  'seymour-macalania': ['def'], // m124
  'anima-macalania': ['def', 'mdef'], // m125
  evrae: ['def', 'mdef'], // m119
  cid: ['def', 'mdef'], // m149
  yojimbo: ['mdef', 'acc'], // m288
  ginnem: ['def', 'mag', 'mdef', 'agi'], // m249
  daigoro: ['def', 'mag', 'mdef', 'agi', 'acc'], // m266
  'seymour-natus': ['def', 'mdef'], // m126
  mortibody: ['mdef'], // m127
  'seymour-omnis': ['acc'], // m131
  'mortiphasm-1': ['def', 'mdef', 'agi'], // m106
  'mortiphasm-2': ['def', 'mdef', 'agi'],
  'mortiphasm-3': ['def', 'mdef', 'agi'],
  'mortiphasm-4': ['def', 'mdef', 'agi'],
  isaaru: ['def', 'mag', 'mdef', 'agi', 'acc'], // m248
  grothia: ['mdef', 'acc'], // m284
  spathi: ['def', 'mdef', 'acc'], // m287
  'left-fin': ['acc'], // m136
  'right-fin': ['acc'], // m137
  'sinspawn-genais': ['acc'], // m139
  'sin-core': ['acc'], // m138
  'overdrive-sin': ['acc'], // m140
};

/** D3: the Zanmato level (the record's byte plus 1) of the rows that differ. Evrae is the note's row; the other three carry no level and read as byte 0. */
export const D3_ZANMATO_LEVEL: Readonly<Record<string, number>> = {
  evrae: 4, // m119, byte 3
  mortibody: 4, // m127, byte 3
  ginnem: 5, // m249, byte 4
  isaaru: 5, // m248, byte 4
};

/** D7: statuses a row cannot receive (byte 255) that the data lets land. */
export const D7_IMMUNE: Readonly<Record<string, readonly StatusId[]>> = {
  'seymour-flux': ['slow'], // m142
};

/** D8: rows whose Doom immunity (extra-immunity bit 14) the record does not set. */
export const D8_DOOMABLE: readonly string[] = ['evrae']; // m119

/** D9: rows the record flags immune to Life (flag byte 0x28, bit 2). */
export const D9_LIFE_IMMUNE: readonly string[] = [
  'evrae', // m119
  'overdrive-sin', // m140
  'seymour-macalania', // m124
  'left-fin', // m136
  'right-fin', // m137
  'sinspawn-genais', // m139
  'sin-core', // m138
  'yu-pagoda-left', // m173
  'yu-pagoda-right', // m174
];

/** What D10 changes on one row. */
export interface D10Row {
  /** Statuses to make immune (byte 255, or extra-immunity bit set). */
  immune?: readonly StatusId[];
  /** Immunities the data has and the record does not. */
  notImmune?: readonly StatusId[];
  flagsOn?: readonly ImmunityFlag[];
  flagsOff?: readonly ImmunityFlag[];
  /** An exact stat the record holds (EVA, which the floor of D1 does not touch). */
  stats?: Partial<StatBlock>;
}

const NULS: readonly StatusId[] = ['nulblaze', 'nulfrost', 'nulshock', 'nultide'];
const PAGODA: D10Row = {
  immune: ['shell', 'protect', 'reflect', ...NULS, 'scan'], // Regen 255 is the 'immune-to-regen' flag already
  notImmune: ['curse'],
  flagsOn: ['immune-to-scan', 'immune-to-bribe'],
};
const MORTIPHASM: D10Row = {
  immune: ['scan'],
  notImmune: ['curse'],
  flagsOn: ['immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  stats: { eva: 0 },
};

/** D10: the record's bits, per row (record ids in the comments). */
export const D10_ROWS: Readonly<Record<string, D10Row>> = {
  'braskas-final-aeon': { immune: ['auto-life'] }, // m132 (Regen 255 already through the flag)
  'yu-pagoda-left': PAGODA, // m173
  'yu-pagoda-right': PAGODA, // m174
  'mortiphasm-1': MORTIPHASM, // m106
  'mortiphasm-2': MORTIPHASM,
  'mortiphasm-3': MORTIPHASM,
  'mortiphasm-4': MORTIPHASM,
  'yu-yevon': { immune: ['scan', 'auto-life'], flagsOff: ['immune-to-sensor'] }, // m176
  cid: { immune: ['scan'] }, // m149
  ginnem: { immune: ['scan', 'auto-life'] }, // m249
  daigoro: { immune: ['scan', 'eject', 'auto-life'], flagsOn: ['immune-to-bribe'] }, // m266
  isaaru: { immune: ['scan', 'auto-life'] }, // m248
};

function addFlags(e: EnemyDef, flags: readonly ImmunityFlag[]): void {
  for (const f of flags) if (!e.immunityFlags.includes(f)) e.immunityFlags.push(f);
}

function correct(e: EnemyDef, on: Readonly<Record<BossDataSwitch, boolean>>): void {
  if (on.D1) for (const k of D1_FLOORS[e.id] ?? []) if (e.stats[k] === 0) e.stats[k] = 1;
  const level = D3_ZANMATO_LEVEL[e.id];
  if (on.D3 && level !== undefined) e.zanmatoLevel = level;
  if (on.D7) for (const s of D7_IMMUNE[e.id] ?? []) e.immunities[s] = 255;
  if (on.D8 && D8_DOOMABLE.includes(e.id)) delete e.immunities.doom;
  if (on.D9 && D9_LIFE_IMMUNE.includes(e.id)) addFlags(e, ['immune-to-life']);
  const row = on.D10 ? D10_ROWS[e.id] : undefined;
  if (row !== undefined) {
    for (const s of row.immune ?? []) e.immunities[s] = 255;
    for (const s of row.notImmune ?? []) delete e.immunities[s];
    addFlags(e, row.flagsOn ?? []);
    if (row.flagsOff) e.immunityFlags = e.immunityFlags.filter((f) => !row.flagsOff?.includes(f));
    if (row.stats) Object.assign(e.stats, row.stats);
  }
}

/**
 * Apply the switched-on corrections to a battle's own copy of its enemy group (the engine calls this once, on the deep copy it made). With no switch on it returns at once
 * and reads nothing, which is what keeps every battle byte-identical while the switches are off.
 */
export function applyBossDataCorrections(group: EnemyGroupDef, on: Readonly<Record<BossDataSwitch, boolean>> = BOSS_DATA_SWITCHES): void {
  if (!BOSS_DATA_SWITCH_IDS.some((id) => on[id])) return;
  for (const e of group.enemies) correct(e, on);
  for (const p of group.parts ?? []) correct(p, on);
}
