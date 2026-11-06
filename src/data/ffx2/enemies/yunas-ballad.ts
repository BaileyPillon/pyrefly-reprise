/**
 * The possessed Rikku and the possessed Paine: the Den of Woe's first two fights, "Yuna's Ballad", as the hidden chapter of that name. **FFX-2 only** [AGENTS.md rule 14]: ATB, dresspheres and the FFX-2
 * monster rows 254 and 256 (`research/re-ffx2-yunas-ballad.md`).
 *
 * Bailey, 2026-11-06 (relayed by the release driver, verbatim): "implement all unimplemented chapters please"; "yes on all these too"; and, 2026-10-31, "you make the executive decisions for the next few days. i'll go
 * with all of your recommendations." Every pick here is the paper preflight's own recommendation (`docs/plans/ch-wraith-review.md`; `docs/handoff/ch-yunas-ballad.md` lists each with its alternative, "driver's call, his to
 * overturn"). It ships **hidden behind a typed word** (`src/app/screens/frontend/wraithDoor.ts`), chapter number 40 (`src/data/chapter-ffx2-yunas-ballad.ts`).
 *
 * **The numbers are the game's own rows** (`research/re-ffx2-yunas-ballad.md` section 4), each tagged `[RE §n]` below; `attachMonsterRecords` lays the rows on each enemy at the foot of this file (ACC 95, the resist
 * bytes, the special word, the steal byte). `tests/unit/chapters/yunas-ballad-data.test.ts` pins this file and the records against `tests/fixtures/parity/ffx2/yunas_ballad_rows.json`.
 *
 * **Two links (YB1), HP and MP carried (YB2).** Rikku, then Paine, by `nextGroupId`, with Yuna alone (a party of one: `FFX2PartyBuild.members` may hold one or two girls since 2026-11-06). The game does not heal
 * between the five Den fights (wiki-level, 4 sources): the second link carries the whole party state (`carriesFullPartyState`, the Den's GP3 a), and it is the retry checkpoint (`checkpointOnEntry`, the Den's GP4 b), so a
 * defeat by Paine retries Paine with the HP and MP Yuna entered with; a defeat by Rikku starts over. **Escape is off** on both (the fights are scripted).
 *
 * **Art (r76b art install, `docs/handoff/r76b-art-install.md`):** the two fighters wear `x2-possessed-rikku` and `x2-possessed-paine`, mirrored, cold-tinted copies of the party's own `rikku` and `paine-warrior` sets
 * (they face left, so the presenter draws them as they are); the possession look is our invention, to show Bailey. A tree without the art draws the placeholder. The sizes are the girls' own (the
 * scene stands them at the party's world height, `src/scenes/den-of-woe.ts`).
 */

import type { EnemyDef, EnemyGroupDef, StatusImmunities } from '../../../battle/common/types.ts';
import {
  PAINE_DUEL_GROUP_ID,
  POSSESSED_PAINE_SCRIPT_ID,
  POSSESSED_PAINE_SPRITE,
  POSSESSED_RIKKU_SCRIPT_ID,
  POSSESSED_RIKKU_SPRITE,
  RIKKU_DUEL_GROUP_ID,
  X2_POSSESSED_PAINE_ID,
  X2_POSSESSED_RIKKU_ID,
} from '../../yunas-ballad-ids.ts';
import { attachMonsterRecords } from '../monster-records/index.ts';
import {
  POSSESSED_PAINE_ATTACK_ID,
  POSSESSED_RIKKU_ARCTIC_WIND_ID,
  POSSESSED_RIKKU_BOMB_CORE_ID,
  POSSESSED_RIKKU_DRAGON_SCALE_ID,
  POSSESSED_RIKKU_GRENADE_ID,
  POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
  POSSESSED_RIKKU_SPIDER_ATTACK_ID,
} from './yunas-ballad-abilities.ts';

/**
 * The ailments both are immune to [RE §4.2]: Death, Petrify, Silence, Poison, Curse and Eject (group 1), Stop and Doom (group 2), the special word's Interrupt bit (bit 9) and no-ATB-damage bit (bit 6).
 * **Sleep, Darkness, Confusion, Berserk and Slow are NOT listed: they land** (the bytes read 0), and so does every stat stage. The monster record replaces these bytes wherever the engine has a slot.
 */
const POSSESSED_IMMUNE: StatusImmunities = {
  ko: 255,
  petrify: 255,
  silence: 255,
  poison: 255,
  curse: 255,
  eject: 255,
  stop: 255,
  doom: 255,
  'delay-effect': 255,
  'action-cancel': 255,
};

/** Both duels play the Den's own cue (`boss-den-of-woe`), as the three shades do (a flagged stand-in for the duels, YB8; Bailey's ears for the final, rule 13). */
const DUEL_CUE = [{ at: 'start' as const, track: 'boss-den-of-woe' as const, fadeMs: 800 }];

/** Rikku, the first duel: `monster.bin` row 254 (id 0x10fe), Lv 53, scene `kino13_228`. */
export const x2PossessedRikku: EnemyDef = {
  id: X2_POSSESSED_RIKKU_ID,
  name: 'Rikku',
  spriteKey: POSSESSED_RIKKU_SPRITE,
  slot: 0,
  stats: {
    hp: 7800, // [RE §4.1 row 254]
    mp: 92,
    maxHp: 7800,
    maxMp: 92,
    str: 42, // STR / DEF / MAG / MDEF 42 / 31 / 39 / 82 [RE §4.1]
    def: 31,
    mag: 39,
    mdef: 82,
    agi: 82, // AGI 82, ACC 95, EVA 18, LCK 12 [RE §4.1]
    eva: 18,
    luck: 12,
    acc: 95,
  },
  hp: 7800,
  mp: 92,
  level: 53,
  affinities: { gravity: 'immune' }, // null byte 0x10 [RE §4.1]; weak to nothing
  immunities: POSSESSED_IMMUNE, // special 0x3c3: bit 6 (no ATB damage) and bit 9 (Interrupt) [RE §4.1]
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'], // special bits 0, 6 and 8
  forms: [{ name: 'Rikku', spriteKey: POSSESSED_RIKKU_SPRITE, hp: 7800 }],
  aiScriptId: POSSESSED_RIKKU_SCRIPT_ID,
  rewards: {
    ap: 3, // EXP / Gil / AP 800 / 200 / 3, Pilfer Gil 300 [RE §4.1]
    apOverkill: 3,
    gil: 200,
    stolenGil: 300,
    exp: 800,
    overkillThreshold: 0,
    drops: [], // Black Lore x1 [RE §4.1]: not in the item catalog (the gap is in the records' header)
    // No steal table: Bushido Lore x1 [RE §4.1] is not in the item catalog (the record's steal slots are empty; the steal byte 128 is the row's)
  },
  abilityIds: [
    POSSESSED_RIKKU_SPIDER_ATTACK_ID,
    POSSESSED_RIKKU_BOMB_CORE_ID,
    POSSESSED_RIKKU_ARCTIC_WIND_ID,
    POSSESSED_RIKKU_LIGHTNING_MARBLE_ID,
    POSSESSED_RIKKU_DRAGON_SCALE_ID,
    POSSESSED_RIKKU_GRENADE_ID,
  ],
  flags: { isBoss: true },
  sensorText: 'Her throws are all one size. Four in ten are a flurry; the rest are fire, ice, lightning, water and a grenade.',
  scanText: 'Rikku, held by Shuyin\'s despair: she thinks Yuna is a guard with a gun to her head.',
};

/** Paine, the second duel: `monster.bin` row 256 (id 0x1100), Lv 58, scene `kino13_229`. */
export const x2PossessedPaine: EnemyDef = {
  id: X2_POSSESSED_PAINE_ID,
  name: 'Paine',
  spriteKey: POSSESSED_PAINE_SPRITE,
  slot: 0,
  stats: {
    hp: 9200, // [RE §4.1 row 256]
    mp: 55,
    maxHp: 9200,
    maxMp: 55,
    str: 56, // STR / DEF / MAG / MDEF 56 / 70 / 16 / 7 [RE §4.1]
    def: 70,
    mag: 16,
    mdef: 7,
    agi: 51, // AGI 51, ACC 95, EVA 0, LCK 10 [RE §4.1]
    eva: 0,
    luck: 10,
    acc: 95,
  },
  hp: 9200,
  mp: 55,
  level: 58,
  affinities: { gravity: 'immune' },
  immunities: POSSESSED_IMMUNE,
  immunityFlags: ['boss', 'immune-to-percentage-damage', 'immune-to-delay', 'immune-to-bribe'],
  forms: [{ name: 'Paine', spriteKey: POSSESSED_PAINE_SPRITE, hp: 9200 }],
  aiScriptId: POSSESSED_PAINE_SCRIPT_ID,
  rewards: {
    ap: 3, // EXP / Gil / AP 800 / 200 / 3, Pilfer Gil 300 [RE §4.1]
    apOverkill: 3,
    gil: 200,
    stolenGil: 300,
    exp: 800,
    overkillThreshold: 0,
    drops: [{ itemId: 'champion-belt', count: 1 }], // Champion Belt x1, common and rare [RE §4.1]
    // No steal table: Sword Lore x1 [RE §4.1] is not in the item catalog
  },
  abilityIds: [POSSESSED_PAINE_ATTACK_ID],
  flags: { isBoss: true },
  sensorText: 'One sword stroke at whoever has the most HP, and a long breath between. Her blade is armoured; her mind is not.',
  scanText: 'Paine, held by Shuyin\'s despair: she thinks Yuna is a guard with a gun to her head.',
};

/** Duel 1: Rikku (`kino13_228`). Chains to Paine. */
export const rikkuDuelGroup: EnemyGroupDef = {
  id: RIKKU_DUEL_GROUP_ID,
  game: 'ffx2',
  enemies: [x2PossessedRikku],
  canEscape: false,
  nextGroupId: PAINE_DUEL_GROUP_ID,
  musicCues: DUEL_CUE,
};

/** Duel 2: Paine (`kino13_229`). Yuna enters with the HP and MP she left Rikku with (YB2), and a defeat retries this duel from there. The last link. */
export const paineDuelGroup: EnemyGroupDef = {
  id: PAINE_DUEL_GROUP_ID,
  game: 'ffx2',
  enemies: [x2PossessedPaine],
  canEscape: false,
  musicCues: DUEL_CUE,
  carriesFullPartyState: true, // YB2: the game does not heal between the Den's fights; the Den's GP3 a
  checkpointOnEntry: true, // a defeat retries this duel from its entry state; the Den's GP4 b seam (Trema's `checkpointOnEntry`)
};

export const yunasBalladGroups: readonly EnemyGroupDef[] = [rikkuDuelGroup, paineDuelGroup];

// The game's own monster rows on these enemies (re-parity W3): ACC, the resist bytes, the steal byte and gil. `../monster-records/records-yunas-ballad.ts`.
for (const group of yunasBalladGroups) attachMonsterRecords(group);
