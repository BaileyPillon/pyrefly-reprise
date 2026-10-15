/**
 * The forced-action word of the monsters the project ships: `Chr+0x6c6`, the default attack's command id (re-parity RC9 lane FFX-G slice G-c; **FFX only**).
 *
 * The character initialiser copies the monster record's word `R+0x70` into `Chr+0x6c6` (VA 0x0079ba19); every party member and aeon gets the constant 0x3000 instead
 * (VA 0x0079b68d). The word is the monster's default attack: the Berserk, Confuse and Provoke turns queue it, and **a word of 0 queues nothing** (the turn is dropped,
 * `kernel/forced-turn.ts#forcedRecord`). Of the 361 monster records 172 carry 0, among them every boss of the project's chapters but the Sinspawn Gui (0x6000);
 * Biran Ronso's is Bulldoze (0x60a5), Yenke's none (`research/re-ffx-biran-yenke.md`, `research/re-ffx-targeting.md` §7).
 *
 * Numbers only: our enemy ids against the words of the monster files they were matched to (the private FFX-H02 note's engine comparison; `mNNN` is the
 * monster file). An enemy the table does not hold (the four possessed aeons other than Valefor and Pterya have no monster file matched yet) keeps the engine's generic
 * Attack, 0x3000, as before.
 */

const ROWS: ReadonlyArray<readonly [string, number]> = [
  ['braskas-final-aeon', 0x0000], // m132
  ['yu-pagoda-left', 0x0000], // m173
  ['yu-pagoda-right', 0x0000], // m174
  ['possessed-valefor', 0x0000], // m254
  ['yu-yevon', 0x0000], // m176
  ['evrae', 0x0000], // m119
  ['cid', 0x0000], // m149
  ['isaaru', 0x0000], // m248
  ['grothia', 0x0000], // m284
  ['spathi', 0x0000], // m287
  ['overdrive-sin', 0x0000], // m140
  ['guado-guardian-a', 0x0000], // m141
  ['seymour-macalania', 0x0000], // m124
  ['guado-guardian-b', 0x0000], // m141
  ['seymour-flux', 0x0000], // m142
  ['mortiorchis', 0x0000], // m143
  ['seymour-natus', 0x0000], // m126
  ['mortibody', 0x0000], // m127
  ['seymour-omnis', 0x0000], // m131
  ['mortiphasm-1', 0x0000], // m106
  ['mortiphasm-2', 0x0000], // m106
  ['mortiphasm-3', 0x0000], // m106
  ['mortiphasm-4', 0x0000], // m106
  ['left-fin', 0x0000], // m136
  ['right-fin', 0x0000], // m137
  ['sinspawn-genais', 0x0000], // m139
  ['sin-core', 0x0000], // m138
  ['sinspawn-gui', 0x6000], // m117
  ['sinspawn-gui-2', 0x6000], // m118
  ['yojimbo', 0x0000], // m288
  ['ginnem', 0x0000], // m249
  ['daigoro', 0x0000], // m266
  ['yunalesca', 0x0000], // m130
  ['biran-ronso', 0x60a5], // research/re-ffx-biran-yenke.md, the stat record's forced action word
  ['yenke-ronso', 0x0000], // research/re-ffx-biran-yenke.md, the stat record's forced action word
];

/** The forced-action word of an enemy by our id, or `undefined` when no monster file is matched to it. */
export const FORCED_ACTION_WORD: ReadonlyMap<string, number> = new Map(ROWS);
