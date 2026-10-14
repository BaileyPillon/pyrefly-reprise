/**
 * Which of the game's auto-ability rows a girl has, in the engine's ids (re-parity X2-D; **FFX-2 only**).
 *
 * The game keeps an auto-ability as a row of `a_ability.bin` (ids 0x8000 to 0x80a1) and lists a girl's rows from the dressphere she
 * wears (its sixteen (prerequisite, ability) pairs, `kernel/dressphere-grids.ts#FFX2_JOB_ABILITIES`), her garment grid and her two
 * accessories. The engine names its dresspheres, abilities and accessories by string. This module is the one place the two meet:
 * three small tables, each line citing where the pairing comes from. Numbers only, in our ids; no game text.
 *
 * **Not listed here, on purpose** (stays unbuilt, `docs/handoff/re-parity-rc7-x2auto.md` "Still only decompiled"): the garment
 * grids (the engine lays gates as colours, the game as numbered gate slots with conditions), the Festivalist and Psychic dresspheres
 * (the engine has no ability table for them), the Berserker's own Auto-Regen and Lady Luck's SOS Spellspring (the engine has no ability
 * by that name to learn), and every row that is a ward, a weapon touch or a cast-speed entry (those belong to the status and menu lanes).
 */

/** The dressphere ids the game lists abilities for: `0x5000 + row` of `job.bin` (`research/re-ffx2-dressphere.md` section 1.3). */
export const JOB_OF_DRESSPHERE: Readonly<Record<string, number>> = {
  gunner: 0x5001,
  'gun-mage': 0x5002,
  alchemist: 0x5003,
  warrior: 0x5004,
  samurai: 0x5005,
  'dark-knight': 0x5006,
  berserker: 0x5007,
  songstress: 0x5008,
  'black-mage': 0x5009,
  'white-mage': 0x500a,
  thief: 0x500b,
  trainer: 0x500c,
  'lady-luck': 0x500d,
  mascot: 0x500e,
};

/**
 * An engine ability that is one of the game's auto-ability rows, and the row. Each pairs an ability of the dressphere's list with the
 * row the game's job pair names for it (the pair, with its prerequisite, is checked by `parity-ffx2-auto-sources.test.ts`).
 * Note FFX2-G04 section 3.4; `research/re-ffx2-dressphere.md` section 4.1.
 */
export const AUTO_ROW_OF_ABILITY: Readonly<Record<string, number>> = {
  'x2-berserker-counterattack': 0x8002,
  'x2-berserker-evade-and-counter': 0x8003,
  'x2-berserker-magic-counter': 0x8004,
  'x2-mascot-auto-shell': 0x806a,
  'x2-mascot-auto-protect': 0x806b,
  'x2-lady-luck-critical': 0x8070,
  'x2-warrior-sos-protect': 0x8075,
  'x2-samurai-sos-critical': 0x807b,
};

/**
 * The auto-ability rows an accessory carries that keep a status or set an SOS set (note FFX2-G04 section 3.4, "Accessories that
 * carry them": 16 of the 128). The accessory ids are the engine's (the build files' spelling); the rows are the game's.
 */
export const AUTO_ROWS_OF_ACCESSORY: Readonly<Record<string, readonly number[]>> = {
  'shmooth-shailing': [0x8069], // Super Ribbon: Slow, kept
  'moon-bracer': [0x806a], // Auto-Shell
  'shining-bracer': [0x806b], // Auto-Protect
  'defense-bracer': [0x806c], // Auto-Wall: Shell and Protect
  adamantite: [0x806c], // Auto-Wall
  'star-bracer': [0x806d], // Auto-Reflect
  'recovery-bracer': [0x806e], // Auto-Regen
  'speed-bracer': [0x806f], // Auto-Haste
  ragnarok: [0x8071], // Spellspring
  'regen-bangle': [0x8077], // SOS Regen
  'haste-bangle': [0x8078], // SOS Haste
  'cat-nip': [0x807a], // SOS: Berserk, Damage 9999 and Slow together, only while HP is under a third
  'wall-ring': [0x809b], // SOS Wall: Shell and Protect
  bloodlust: [0x8095], // Kijo's Soul: Poison and Berserk, kept
  wring: [0x8096], // Majo's Soul: Poison and Haste, kept
  "minerva's-plate": [0x809c], // group 1 bit 16 (Pointless), kept
};
