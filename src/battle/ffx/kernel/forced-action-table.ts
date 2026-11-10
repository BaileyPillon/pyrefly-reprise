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
  // Chapter XXVII's Dark Aeons (added on the r51 merge; the lane predates the chapter): the stat record's forced action word is "none" in all five rows (`research/re-ffx-dark-aeons.md` 1.2, [bytes]).
  ['dark-yojimbo', 0x0000], // m340
  ['dark-cindy', 0x0000], // m341
  ['dark-sandy', 0x0000], // m342
  ['dark-mindy', 0x0000], // m343
  ['dark-daigoro', 0x0000], // m116, the Sinscale file used as the dog's stand-in
  // The hidden Dark Aeons chapter (2026-11-06): the six other Dark Aeons (m334 to m339; Dark Ixion's two fights are two ids over m336): the stat record's forced action word is "none" in all six (`research/re-ffx-dark-aeons-six.md` 1.2, [bytes]).
  ...['dark-valefor', 'dark-ifrit', 'dark-ixion', 'dark-ixion-2', 'dark-shiva', 'dark-bahamut', 'dark-anima'].map((id): readonly [string, number] => [id, 0x0000]),
  // The hidden Spectral Keeper chapter (2026-11-02): the Keeper (m129) and its seven Circles (m146) carry no forced action (`research/re-ffx-spectral-keeper.md` 1.2: forced action word "none"), so Berserk, Confuse and Provoke drop their turns.
  ['spectral-keeper', 0x0000], // m129
  // The hidden Flooded Ways chapter (2026-11-06): Evrae Altana (m120) carries the Critical Strike word 0x6066 and Geosgaeno (m109) the Attack word 0x6000 as their forced actions (`research/re-ffx-geosgaeno-evrae-altana.md` 1.1, 1.2: both words never fire, Berserk, Confuse and Provoke being immune); the Gate Locks (m162, m171) carry none.
  ['evrae-altana', 0x6066], ['geosgaeno', 0x6000], ['gate-lock-1', 0x0000], ['gate-lock-2', 0x0000],
  // The hidden Sanctuary Keeper chapter (2026-11-06): m128's forced-action byte is Tail Sweep 0x6044 (`research/re-ffx-sanctuary-keeper.md` 1.1: a Provoke-forced move; Provoke is immune, and a Berserk or Confuse that lands takes it).
  ['sanctuary-keeper', 0x6044], // m128
  // The hidden Spherimorph chapter (2026-11-06): m121's forced-action byte is Attack 0x6000 (`research/re-ffx-spherimorph.md` 1.1: a Provoke-forced move that never fires, because Provoke, Berserk and Confuse are all immune).
  ['spherimorph', 0x6000], // m121
  // The hidden Wendigo chapter (2026-11-06): Wendigo (m212) carries the Attack word 0x4000 (its default punch, x3/2 under Berserk) and the Guado Guardians (m213) the Thundara word 0x3047 (`research/re-ffx-wendigo-lake-macalania.md` 1.1, 1.3; the Guardians are Berserk- and Confuse-immune, and a Provoked one throws the engine's generic Attack, not Thundara).
  ['wendigo', 0x4000], ['lake-guardian-a', 0x3047], ['lake-guardian-b', 0x3047], // m212, m213 twice
  ...[1, 2, 3, 4, 5, 6, 7].map((n): readonly [string, number] => [`spectral-circle-${n}`, 0x0000]), // m146
  // The hidden Penance chapter (2026-11-06): Penance (m344) and its two arms (m345, m346) carry no forced action (`research/re-ffx-penance.md` 3: "none"), so Berserk, Confuse and Provoke drop their turns (all three are immune anyway).
  ['penance', 0x0000], // m344
  ['penance-right-arm', 0x0000], // m345
  ['penance-left-arm', 0x0000], // m346
  // The hidden Omega Ruins chapter (2026-11-06): Ultima Weapon (m99) and Omega Weapon (m100) carry the monster Attack 0x4000 as their forced action; Nemesis (m276) none (`research/re-ffx-omega-ultima-nemesis.md` 1.1). All three are immune to Berserk, Confuse and Provoke, so the word is never read.
  ['ultima-weapon', 0x4000], // m99
  ['omega-weapon', 0x4000], // m100
  ['nemesis', 0x0000], // m276
  // The hidden Belgemine's Challenge chapter (2026-11-09): the five bodies whose monster files the table already holds under other ids carry those files' word (m254 Valefor, m284 Ifrit, m287 Bahamut, m288 Yojimbo, m266 the dog: all 0x0000, rows above). The other six (m285 Ixion, m286 Shiva, m265 Anima, m289 to m291 the Sisters) and Belgemine herself (m250) are not matched in the census, so they keep the generic Attack (all of them are immune to Berserk, Confuse and Provoke, which are what read this word): not invented (rule 6).
  ...['belg-valefor', 'belg-ifrit', 'belg-bahamut', 'belg-yojimbo', 'belg-daigoro'].map((id): readonly [string, number] => [id, 0x0000]),
  // The hidden Shinryu chapter (2026-11-07): Shinryu (m283) carries no forced action (`research/re-ffx-shinryu.md` 0: forcedAction 0), so Berserk, Confuse and Provoke (all immune) would drop its turn.
  ['shinryu', 0x0000], // m283
  // The hidden Gauntlet chapter (2026-11-10): the Monster Arena creations (m314, m317, m311, m279, m281, m277, m282, m105, m280, and the Ultima Buster's Head m272 and Arm m273) carry no forced action (the record's word +0x70 is 0 in all nine bodies and the Head and Arm: `tests/fixtures/parity/ffx/gauntlet_rows.json`), so Berserk, Confuse and Provoke, all immune, would drop their turns.
  ...['cactuar-king', 'don-tonberry', 'jormungand', 'earth-eater', 'greater-sphere', 'catastrophe', 'thuban', 'neslug', 'ultima-buster', 'ultima-buster-head', 'ultima-buster-arm-left', 'ultima-buster-arm-right'].map((id): readonly [string, number] => [id, 0x0000]),
];

/** The forced-action word of an enemy by our id, or `undefined` when no monster file is matched to it. */
export const FORCED_ACTION_WORD: ReadonlyMap<string, number> = new Map(ROWS);
