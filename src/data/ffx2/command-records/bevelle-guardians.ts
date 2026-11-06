/**
 * The game's own command rows for the moves of Georapella, the Precepts Guard and the first Baralai in their NORMAL versions (the Bevelle Underground floors 3 and 7; the hidden chapter "The Guardians of the Bevelle
 * Underground"). Re-parity W3's shape; **FFX-2 only**.
 *
 * Source: `kernel/monmagic.bin` (ids 0x4000 and up) and `kernel/command.bin` (ids 0x3000 and up) of the Steam HD build 25501027, read byte by byte by the RE lane (`research/re-ffx2-bevelle-underground.md` §7, 2026-11-06),
 * numbers only, no game text and no game code. Merged into `FFX2_COMMAND_RECORDS` by `./index.ts`.
 *
 * **Almost every row is one the repo already holds**, taken here by name from where it lives (a change there is a deliberate decision; `tests/unit/chapters/bevelle-guardians-data.test.ts` pins every row to the lane's fixture,
 * which was read from the kernel tables again, so a drift fails loudly): Demi 0x3082, Bio 0x3085, Death 0x3087 and Drain 0x3081 are the Dark Knight's own commands; Slow 0x406c is the Left Redoubt's; Osmose 0x406d is the
 * Leblanc Syndicate's; Baralai's Attack 0x41da, Chain Attack 0x4100, Glint 0x4101, Looming Glacier 0x4102, Drill Shot 0x4103 and Absorb 0x4040 are the Den of Woe shade's (the shade runs the same rows; the first Baralai differs
 * only in the stats the attacker term reads, and in the script). **The four Ga spells 0x41f1 to 0x41f4** are written here (the Angra Mainyu chapter's Zarich holds the same rows, aimed at one girl): formula 2, power 19, shatter 20,
 * 24 MP and a 3.3 s charge (cast 70), the whole party, reflectable.
 *
 * Confidence: [verified: the game's own table, pinned by `tests/unit/chapters/bevelle-guardians-data.test.ts` against `tests/fixtures/parity/ffx2/bevelle_guardians_rows.json`].
 */

import type { FFX2CommandRecord } from '../../../battle/common/types.ts';
import { COMMAND_RECORDS_ENEMIES } from './enemies.ts';
import { COMMAND_RECORDS_PARTY } from './party.ts';

/** A row that is one of the existing tables': the same numbers, taken by name from where the repo holds them. */
function borrowed(table: Readonly<Record<string, FFX2CommandRecord>>, key: string): FFX2CommandRecord {
  const record = table[key];
  if (record === undefined) throw new Error(`bevelle-guardians command records: no row ${key}`);
  return { ...record };
}

const NO_KILLER = { killer: 0, critByte: 0 } as const;
/** The four Ga spells share everything but the id and the element bit. */
const GA = { costAtb: 0, costCast: 70, category: 1, flagsTarget: 0x4b3, flagsMisc: 0x20208086, flagsDamage: 0x2, damageClass: 1, formula: 2, ...NO_KILLER, accuracy: 0, power: 19, hits: 1, shatter: 20 } as const;

export const COMMAND_RECORDS_BEVELLE_GUARDIANS: Readonly<Record<string, FFX2CommandRecord>> = {
  // ---- Georapella ---------------------------------------------------------------------------------------------------------------
  'x2-georapella-firaga': { id: 0x41f1, ...GA, element: 0x1 },
  'x2-georapella-blizzaga': { id: 0x41f2, ...GA, element: 0x2 },
  'x2-georapella-thundaga': { id: 0x41f3, ...GA, element: 0x4 },
  'x2-georapella-waterga': { id: 0x41f4, ...GA, element: 0x8 },
  'x2-georapella-osmose': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-leblanc-osmose'), // 0x406d: the MP class, formula 4, power 3, absorbed

  // ---- Precepts Guard -----------------------------------------------------------------------------------------------------------
  'x2-precepts-guard-demi': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-demi'), // 0x3082: formula 4, power 4, Gravity
  'x2-precepts-guard-bio': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-bio'), // 0x3085: Poison at 100
  'x2-precepts-guard-slow': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-redoubt-left-slow'), // 0x406c: the ATB class, formula 4, power 16, Slow 130 (counter 126)
  'x2-precepts-guard-death': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-death'), // 0x3087: Death 254, accuracy formula 4
  'x2-precepts-guard-osmose': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-leblanc-osmose'), // 0x406d
  'x2-precepts-guard-drain': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-drain'), // 0x3081: formula 9, power 12, absorbed

  // ---- Baralai ------------------------------------------------------------------------------------------------------------------
  'x2-baralai-attack': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-attack'), // 0x41da: power 16, accuracy formula 2
  'x2-baralai-chain-attack': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-triple-attack'), // 0x4100: power 12, always hits
  'x2-baralai-chain-attack-2': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-triple-attack-2'),
  'x2-baralai-chain-attack-3': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-triple-attack-3'),
  'x2-baralai-glint': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-glint'), // 0x4101: power 20, the whole party
  'x2-baralai-looming-glacier': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-looming-glacier'), // 0x4102: the MP class, formula 7, power 16, Stop 254 (counter 126)
  'x2-baralai-drill-shot': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-drill-shot'), // 0x4103: formula 7, power 12, physical-only
  'x2-baralai-demi': borrowed(COMMAND_RECORDS_PARTY, 'x2-dark-knight-demi'), // 0x3082
  'x2-baralai-absorb': borrowed(COMMAND_RECORDS_ENEMIES, 'x2-den-baralai-absorb'), // 0x4040: HP and MP together, absorbed
};
