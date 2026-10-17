/**
 * The game's hit-reaction clip lengths for every body an FFX-2 chapter of ours fights or is fought by (re-parity lane X2-A,
 * slice 1; **FFX-2 only**). Numbers only: motion-set numbers and frame counts, in our ids. No game text, no file names.
 *
 * What the numbers are. When a damaging hit lands, the game starts the target's damage motion: `dmg1` for a normal hit,
 * `hdmg1` for a critical, in motion frames (one frame is one logic step at the normal animation speed). The target is in hit
 * reaction for as long as that clip plays, and its chain counter lives exactly that long (note FFX2-G01 section 7: 93,000
 * character updates against the exe, 0 mismatches; live game 2026-10-13, Q2: the counter is on for exactly the reaction).
 * `-1` means the motion set has no such clip.
 *
 * Sources. Note FFX2-G01 section 7.3 (the girls' per-set table and the bosses' table) and its proof data: the game's own
 * frame tables, read as numbers, for the 51 girl motion sets and the 36 monster motion sets below. Every set is looked up
 * by number; no two definitions of one set disagree.
 *
 * The three maps a unit goes through:
 * - a girl: her id (`yuna` / `rikku` / `paine`) and the dressphere she wears give a SLOT (`DRESSPHERE_SLOT`), and her slot
 *   gives a motion set (`GIRL_MOTION_SETS`, in slot order); the set gives the clips (`GIRL_CLIP_FRAMES`);
 * - a monster, part or boss: the game's monster row its record carries (`enemy.ffx2Record.row`) gives a motion set
 *   (`MONSTER_MOTION_SET`); the set gives the clips (`MONSTER_CLIP_FRAMES`).
 *
 * How a girl's slot is known [I, calibrated by the live game]: the game keeps 17 motion sets per girl, in the order of her
 * dressphere jobs (job n is the n-th set: 1 Gunner, 2 Gun Mage, 3 Alchemist, 4 Warrior, 5 Samurai, 6 Dark Knight, 7 Berserker,
 * 8 Songstress, 9 Black Mage, 10 White Mage, 11 Thief, 12 Trainer, 13 Lady Luck, 14 Mascot, 15 the Special's body, 16 and 17 its
 * pods; the pods' motion-set numbers run in step across the three girls, which is the file's own sign that slots 16 and 17 are
 * the pods). The order is read from the game's frame table; the live game fixes slot 14 only (the three Mascot lengths of
 * 2026-10-13, Q1: Yuna 31 steps = her slot 14's 30 frames + 1, Paine 37 = 36 + 1, a Hasted Rikku 15 = 28 / 2 + 1). The other
 * thirteen slots rest on the same order and are not measured.
 *
 * Not in the data, so the engine keeps today's 2 s / 3 s window on them (`reaction.ts`): the two Right and Left Bulwarks
 * (motion sets 0x1120 and 0x1121 have no damage clip, -1; what the game does with no clip is not established), the
 * International-only `psychic` and `festivalist` dresspheres (no motion set of their own in the frame table), the Special's pods
 * (not units in this engine), and any unit built without a monster row.
 *
 * Shuyin. Chapter V's Shuyin is monster row 260 (the script the research calls m260), whose motion set is 0x1104, 30 frames. The
 * 135-frame set 0x1125 that note FFX2-G01 flags as a probable placeholder belongs to row 293, a second, inert Shuyin record of the
 * Vegnagun scene (80,000 HP, a script that does nothing); no unit of ours is built from it.
 */

/** `[dmg1, hdmg1]` in motion frames; `-1` = the motion set has no such clip. */
export type ClipFrames = readonly [dmg1: number, hdmg1: number];

/** The three girls, as their ids spell them. */
export type GirlId = 'yuna' | 'rikku' | 'paine';

/** A motion set with no damage clip. */
export const NO_CLIP = -1;

/** Dressphere id to the slot (1 to 17) of the girl's own list of motion sets. The three Specials are slot 15, the body of the form. */
export const DRESSPHERE_SLOT: Readonly<Record<string, number>> = {
  'gunner': 1,
  'gun-mage': 2,
  'alchemist': 3,
  'warrior': 4,
  'samurai': 5,
  'dark-knight': 6,
  'berserker': 7,
  'songstress': 8,
  'black-mage': 9,
  'white-mage': 10,
  'thief': 11,
  'trainer': 12,
  'lady-luck': 13,
  'mascot': 14,
  'floral-fallal': 15,
  'machina-maw': 15,
  'full-throttle': 15,
};

/** A girl's motion sets in slot order (index 0 is slot 1): the order of the 17 blocks the game keeps for her, FFX2-G01 section 7.3. */
export const GIRL_MOTION_SETS: Readonly<Record<GirlId, readonly number[]>> = {
  yuna: [0x1, 0x2, 0x3, 0xb, 0xc, 0xd, 0xe, 0x10, 0x11, 0x12, 0x6, 0x7, 0x13, 0x8, 0x14, 0x44, 0x3ce],
  rikku: [0x1a, 0x15, 0x16, 0x17, 0x1f, 0x20, 0x21, 0x22, 0x24, 0x25, 0x26, 0x1b, 0x27, 0x1c, 0x28, 0x45, 0x3cf],
  paine: [0x33, 0x29, 0x2a, 0x2b, 0x34, 0x35, 0x36, 0x38, 0x39, 0x3a, 0x2e, 0x2f, 0x3b, 0x30, 0x3c, 0x46, 0x3d0],
};

/** `[dmg1, hdmg1]` of every girl motion set above (the girls' two clips differ in one set only: Paine's 0x2b). */
export const GIRL_CLIP_FRAMES: Readonly<Record<number, ClipFrames>> = {
  0x1: [30, 30], 0x2: [30, 30], 0x3: [35, 35], 0xb: [24, 24],
  0xc: [35, 35], 0xd: [29, 29], 0xe: [28, 28], 0x10: [29, 29],
  0x11: [35, 35], 0x12: [35, 35], 0x6: [35, 35], 0x7: [33, 33],
  0x13: [23, 23], 0x8: [30, 30], 0x14: [50, 50], 0x44: [34, 34],
  0x3ce: [26, 26],
  0x1a: [33, 33], 0x15: [33, 33], 0x16: [33, 33], 0x17: [33, 33],
  0x1f: [28, 28], 0x20: [26, 26], 0x21: [32, 32], 0x22: [28, 28],
  0x24: [24, 24], 0x25: [30, 30], 0x26: [40, 40], 0x1b: [26, 26],
  0x27: [32, 32], 0x1c: [28, 28], 0x28: [40, 40], 0x45: [36, 36],
  0x3cf: [35, 35],
  0x33: [40, 40], 0x29: [35, 35], 0x2a: [35, 35], 0x2b: [35, 32],
  0x34: [30, 30], 0x35: [32, 32], 0x36: [32, 32], 0x38: [30, 30],
  0x39: [35, 35], 0x3a: [35, 35], 0x2e: [30, 30], 0x2f: [40, 40],
  0x3b: [35, 35], 0x30: [36, 36], 0x3c: [50, 50], 0x46: [32, 32],
  0x3d0: [32, 32],
};

/**
 * The game's monster row to its motion set, for every enemy and part of the FFX-2 chapters (read from monster.bin). monster2.bin agrees on all of them
 * but rows 176 and 284 to 286, where it names another set (found by the lane's independent check); the set used here is monster.bin's, and the
 * difference has no effect on any window of ours (comment corrected at the stacking on r52; no number changed).
 */
export const MONSTER_MOTION_SET: Readonly<Record<number, number>> = {
  135: 0x1085, // dr-goon
  138: 0x1088, // fem-goon
  152: 0x1096, // paragon (both tables)
  164: 0x10a4, // x2-valefor
  166: 0x10a6, // x2-ixion
  167: 0x10a7, // x2-shiva
  168: 0x10a8, // bahamut
  169: 0x10a9, // x2-anima
  170: 0x10aa, // x2-yojimbo
  171: 0x10ab, // cindy
  172: 0x10ac, // sandy
  173: 0x10ad, // mindy
  174: 0x10ae, // x2-daigoro
  176: 0x10b0, // shade-baralai
  177: 0x10b1, // shade-gippal
  194: 0x10c2, // x2-experiment-prototype, x2-experiment
  243: 0x1081, // ormi-entrance
  244: 0x1081, // ormi-logos-room
  245: 0x1081, // ormi
  249: 0x1082, // logos-room
  250: 0x1082, // logos
  253: 0x1083, // leblanc
  258: 0x1102, // shade-nooj
  260: 0x1104, // shuyin (Chapter V's; see the header)
  268: 0x110c, // x2-angra-mainyu
  269: 0x110d, // x2-zarich
  270: 0x110e, // x2-tawrich
  282: 0x111a, // vegnagun-tail
  283: 0x111b, // vegnagun-leg
  284: 0x111c, // node-a
  285: 0x111d, // node-b
  286: 0x111e, // node-c
  287: 0x111f, // vegnagun-body
  288: 0x1120, // bulwark-r (no damage clip)
  289: 0x1121, // bulwark-l (no damage clip)
  290: 0x1122, // vegnagun-head
  291: 0x1123, // redoubt-r
  292: 0x1124, // redoubt-l
  295: 0x1127, // trema (the fight and the arena)
};

/** `[dmg1, hdmg1]` of every monster motion set above. */
export const MONSTER_CLIP_FRAMES: Readonly<Record<number, ClipFrames>> = {
  0x1081: [50, 50],
  0x1082: [32, 32],
  0x1083: [30, 30],
  0x1085: [30, 30],
  0x1088: [32, 32],
  0x1096: [61, 75],
  0x10a4: [39, 50],
  0x10a6: [34, 55],
  0x10a7: [57, 65],
  0x10a8: [51, 81],
  0x10a9: [40, 40],
  0x10aa: [30, 57],
  0x10ab: [44, 59],
  0x10ac: [30, 30],
  0x10ad: [60, 60],
  0x10ae: [60, 60],
  0x10b0: [35, 36],
  0x10b1: [32, 32],
  0x10c2: [22, 22],
  0x1102: [20, 33],
  0x1104: [30, 30],
  0x110c: [34, 34],
  0x110d: [34, 34],
  0x110e: [34, 34],
  0x111a: [16, 16],
  0x111b: [16, 16],
  0x111c: [10, 10],
  0x111d: [10, 10],
  0x111e: [10, 10],
  0x111f: [16, 16],
  0x1120: [NO_CLIP, NO_CLIP],
  0x1121: [NO_CLIP, NO_CLIP],
  0x1122: [10, 10],
  0x1123: [16, 16],
  0x1124: [16, 16],
  0x1127: [15, 15],
};
