/**
 * **The loot records of the 43 monsters the FFX chapters ship**, as the game's own numbers (re-parity RC9, lane FFX-M; **FFX only**).
 *
 * Source: `FFX_Data.vbf` of the Steam build 25501027 (`FFX_Data.vbf` is read only; nothing is copied from it but these numbers). For each monster the file
 * `ffx_ps2/ffx/master/jppc/battle/mon/_mNNN/mNNN.bin` holds the monster's loot record as chunk 4, 0x118 bytes; the fields below are the ones the kill-rewards roll reads
 * (FFX.exe 0x007990d0, `battle/ffx/kernel/drops.ts`): the layout is the private note FFX-H02 section 3.1, and the record of every one of the 361 monsters was read by this lane's own
 * script and compared with that note's table field by field (0 differences in 361 records x 31 fields). `source` names the file, the chunk and the first 16 hex digits of the SHA-256
 * of the 0x118 bytes, so a later read can be compared byte for byte.
 *
 * Each row is `record(file, gil, ap, apOverkill, [chance1, chance2], gearChance, items, qty, overkillItems, overkillQty, bribeItem, bribeFactor, digest)`:
 * `items` is slot 1 common, slot 1 rare, slot 2 common, slot 2 rare (the game's item numbers, 0x2000 + n); `chance` is the byte a stream-10 draw `% 255` must be below. The
 * gear fields of a record are not kept (the gear drop is proven but not wired, M2): only `gearChance`, for the roll's one draw and for the measurement.
 *
 * These are the file's numbers. A script that writes over a record at run time (Sinspawn Gui's parts zero their chances) is applied by `./index.ts#lootRewards`, beside the
 * monster that owns it, and says so in the record's `note`.
 */

import type { FfxLootRecord } from '../../../battle/common/types.ts';

/** One loot record; `digest` is the first 16 hex digits of the SHA-256 of the 0x118 bytes. */
function record(
  file: number, gil: number, ap: number, apOverkill: number, chance: [number, number], gearChance: number,
  items: [number, number, number, number], qty: [number, number, number, number],
  overkillItems: [number, number, number, number], overkillQty: [number, number, number, number],
  bribeItem: number, bribeFactor: number, digest: string,
): FfxLootRecord {
  const name = `m${String(file).padStart(3, '0')}`;
  return {
    file, gil, ap, apOverkill, chance, gearChance, items, qty, overkillItems, overkillQty, bribeItem, bribeFactor,
    source: `FFX_Data.vbf battle/mon/_${name}/${name}.bin chunk 4 (0x118 bytes), sha256/16 ${digest}`,
  };
}

/** The shipped monsters' records, by monster file number. */
export const FFX_LOOT_RECORDS: Readonly<Record<number, FfxLootRecord>> = {
  // m106 Mortiphasm (Seymour Omnis, the four discs)
  106: record(106, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '1f6c9de2e555d5d5'),
  // m117 Sinspawn Gui, the body
  117: record(117, 1000, 400, 600, [255, 0], 255, [0x2051, 0x2051, 0, 0], [3, 3, 0, 0], [0x2051, 0x2051, 0, 0], [6, 6, 0, 0], 0x2000, 1, 'd0e9103696d78aec'),
  // m119 Evrae
  119: record(119, 2600, 5400, 8100, [255, 0], 255, [0x204f, 0x204f, 0, 0], [1, 1, 0, 0], [0x204f, 0x204f, 0, 0], [2, 2, 0, 0], 0x2000, 1, 'e42fc92392f0e614'),
  // m124 Seymour (Macalania)
  124: record(124, 5000, 2000, 3000, [255, 0], 255, [0x204f, 0x204c, 0, 0], [1, 1, 0, 0], [0x204f, 0x204c, 0, 0], [2, 2, 0, 0], 0x2000, 1, '85f0b263ae237b03'),
  // m125 Anima (Macalania)
  125: record(125, 3000, 2500, 3750, [255, 0], 255, [0x2049, 0x2049, 0, 0], [1, 1, 0, 0], [0x2049, 0x2049, 0, 0], [2, 2, 0, 0], 0x2000, 1, 'fd48515a78d4fb1a'),
  // m126 Seymour Natus
  126: record(126, 3500, 6300, 9450, [255, 0], 255, [0x2052, 0x2052, 0, 0], [2, 2, 0, 0], [0x2052, 0x2052, 0, 0], [4, 4, 0, 0], 0x2000, 1, '57a921728ae8dbd1'),
  // m127 Mortibody (Seymour Natus)
  127: record(127, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m130 Yunalesca
  130: record(130, 9000, 14000, 21000, [255, 0], 255, [0x2053, 0x2053, 0, 0], [1, 1, 0, 0], [0x2053, 0x2053, 0, 0], [2, 2, 0, 0], 0x2000, 1, '8231a5f88935b91d'),
  // m131 Seymour Omnis
  131: record(131, 12000, 24000, 36000, [255, 0], 255, [0x2053, 0x2053, 0, 0], [1, 2, 0, 0], [0x2053, 0x2053, 0, 0], [2, 4, 0, 0], 0x2000, 1, 'a471d525eb7d16e9'),
  // m132 Braska's Final Aeon
  132: record(132, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '223950db9fcaabc9'),
  // m134 Biran Ronso
  134: record(134, 1500, 4500, 6750, [255, 0], 255, [0x2060, 0x2061, 0, 0], [1, 1, 0, 0], [0x2060, 0x2061, 0, 0], [2, 2, 0, 0], 0x2000, 1, '0b48cf574d692d90'),
  // m135 Yenke Ronso
  135: record(135, 1500, 4500, 6750, [255, 0], 255, [0x2060, 0x2061, 0, 0], [1, 1, 0, 0], [0x2060, 0x2061, 0, 0], [2, 2, 0, 0], 0x2000, 1, '0b48cf574d692d90'),
  // m136 Sin, the Left Fin
  136: record(136, 10000, 16000, 24000, [255, 0], 255, [0x2055, 0x2055, 0, 0], [1, 1, 0, 0], [0x2055, 0x2055, 0, 0], [2, 2, 0, 0], 0x2000, 1, 'fe22e2c3210240f9'),
  // m137 Sin, the Right Fin
  137: record(137, 10000, 17000, 25500, [255, 0], 255, [0x2053, 0x2053, 0, 0], [1, 1, 0, 0], [0x2053, 0x2053, 0, 0], [2, 2, 0, 0], 0x2000, 1, 'd1cd949f466f0e4d'),
  // m138 Sin's Core
  138: record(138, 10000, 18000, 27000, [255, 0], 255, [0x2056, 0x2056, 0, 0], [1, 1, 0, 0], [0x2056, 0x2056, 0, 0], [2, 2, 0, 0], 0x2000, 1, '7af5bdd35f1670d9'),
  // m139 Sinspawn Genais
  139: record(139, 10000, 1800, 2700, [255, 0], 255, [0x2060, 0x2060, 0, 0], [1, 1, 0, 0], [0x2060, 0x2060, 0, 0], [2, 2, 0, 0], 0x2000, 1, '22af125265d73218'),
  // m140 Overdrive Sin
  140: record(140, 12000, 20000, 30000, [255, 0], 255, [0x2053, 0x2053, 0, 0], [1, 1, 0, 0], [0x2053, 0x2053, 0, 0], [2, 2, 0, 0], 0x2000, 1, '867547afd3465723'),
  // m141 Guado Guardian
  141: record(141, 300, 290, 435, [255, 0], 255, [0x2049, 0x2049, 0, 0], [1, 1, 0, 0], [0x2049, 0x2049, 0, 0], [2, 2, 0, 0], 0x2004, 10, '54896bdbef24b618'),
  // m142 Seymour Flux
  142: record(142, 6000, 10000, 15000, [255, 0], 255, [0x2054, 0x2054, 0, 0], [1, 1, 0, 0], [0x2054, 0x2054, 0, 0], [2, 2, 0, 0], 0x2000, 1, '758e629d132179ad'),
  // m143 Mortiorchis (Seymour Flux)
  143: record(143, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m149 Cid (the Fahrenheit)
  149: record(149, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m160 Sinspawn Gui, the head
  160: record(160, 200, 48, 72, [255, 0], 30, [0x2047, 0x2047, 0, 0], [1, 1, 0, 0], [0x2047, 0x2047, 0, 0], [2, 2, 0, 0], 0x2000, 1, '474728dec3aa0c3c'),
  // m161 Sinspawn Gui, an arm
  161: record(161, 300, 37, 55, [255, 0], 30, [0x2048, 0x2048, 0, 0], [1, 1, 0, 0], [0x2048, 0x2048, 0, 0], [2, 2, 0, 0], 0x2000, 1, 'eb86de12fae1e0b6'),
  // m163 Possessed Valefor
  163: record(163, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m164 Possessed Ifrit
  164: record(164, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m165 Possessed Ixion
  165: record(165, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m166 Possessed Shiva
  166: record(166, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m167 Possessed Bahamut
  167: record(167, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m168 Possessed Anima
  168: record(168, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m169 Possessed Yojimbo
  169: record(169, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, 'afcb50bb2f0c2e07'),
  // m173 Yu Pagoda (left)
  173: record(173, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '9f755422f48fbc02'),
  // m174 Yu Pagoda (right)
  174: record(174, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '9f755422f48fbc02'),
  // m176 Yu Yevon
  176: record(176, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '9f755422f48fbc02'),
  // m178 Possessed Cindy
  178: record(178, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m179 Possessed Sandy
  179: record(179, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m180 Possessed Mindy
  180: record(180, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m248 Isaaru
  248: record(248, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '9f755422f48fbc02'),
  // m249 Lady Ginnem
  249: record(249, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '9f755422f48fbc02'),
  // m254 Pterya
  254: record(254, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '5e877dbf98eef3b8'),
  // m266 Daigoro
  266: record(266, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '1f6c9de2e555d5d5'),
  // m284 Grothia
  284: record(284, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '1f6c9de2e555d5d5'),
  // m287 Spathi
  287: record(287, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '1f6c9de2e555d5d5'),
  // m288 Yojimbo
  288: record(288, 0, 0, 0, [0, 0], 0, [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], 0x0000, 0, '1f6c9de2e555d5d5'),
};
