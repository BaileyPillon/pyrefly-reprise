/**
 * Chapter XIII — Cloister 100 of the Via Infinito: Paragon, then Trema, one battle in two
 * links with the party carried between them.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: `research/ffx2-trema.md` §1.1,
 * §3.1 and §4.2; every number carries that file's tag (rule 6).
 *
 * The staging, `[verified: 5 sources]` (research §1.1): when Paragon falls, Trema appears,
 * finishes it, and his battle starts **with no healing and no chance to change equipment**;
 * the party starts it in whatever state the Paragon fight left them. So Trema's link:
 * - carries HP, MP, KO, **statuses and the worn dressphere** (`carriesPartyState`; gates reset,
 *   a new battle), and restores nothing;
 * - is the retry checkpoint (`checkpointOnEntry`, plan TR5 = b): a loss to Trema retries
 *   Trema in Paragon's end state, kept in memory only (never saved, D-100), so this chapter
 *   is not save-data class.
 *
 * Music, TR16 = a: Paragon under `scene-bevelle-underground` (the game plays "The Bevelle
 * Underground" there, research §6.3), Trema under `boss-ffx2-aeon`, the plan's named stand-in
 * until a `boss-trema` sketch is picked (O-6, rule 13).
 */

import type { EnemyDef, EnemyGroupDef } from '../../../battle/common/types.ts';
import { CLOISTER_BOSS_IMMUNITY, paragon } from './paragon.ts';
import { ACTION_TIME_ESTIMATE_SECONDS } from '../../../battle/ffx2/action-time.ts';

export const CLOISTER_PARAGON = 'ffx2-cloister-paragon';
export const CLOISTER_TREMA = 'ffx2-cloister-trema';
/** The two links in play order. */
export const TREMA_CHAPTER_CHAIN_ORDER = [CLOISTER_PARAGON, CLOISTER_TREMA] as const;

/**
 * **Option 3 (E4), OFF: action time on Chapter XIII's links only.** Seconds each action takes
 * before its actor's gauge refills (`src/battle/ffx2/action-time.ts`): the rule is sourced
 * `[verified: 2 sources]`, the length is not (research §12.4). To turn it on for this chapter alone,
 * set `CLOISTER_ACTION_TIME_ON = true`: every action then takes `ACTION_TIME_ESTIMATE_SECONDS` (1.5 s, an
 * `[estimate]`). Needs Bailey's word.
 */
export const CLOISTER_ACTION_TIME_ON: boolean = false;
/** Seconds of action time on the Cloister links: 0 while the switch is off. */
export const CLOISTER_ACTION_TIME = CLOISTER_ACTION_TIME_ON ? ACTION_TIME_ESTIMATE_SECONDS : 0;
const actionTime = CLOISTER_ACTION_TIME > 0 ? { actionTimeSeconds: CLOISTER_ACTION_TIME } : {};

/** Trema, Via Infinito story version, bestiary #243 on the wiki (§3.1). International / HD (TR2 = a). */
export const trema: EnemyDef = {
  id: 'trema',
  name: 'Trema',
  spriteKey: 'trema', // not painted yet (O-1 picked A; plan §6); TR18: the chapter stays unlisted
  slot: 0,
  stats: {
    hp: 999999, // [verified: 6 sources]
    mp: 999, // [verified: 5 sources] (T-9: one unfinished entry prints 9,999)
    maxHp: 999999,
    maxMp: 999,
    str: 255, // STR / MAG / DEF / MDEF [verified: 3 sources]
    mag: 255,
    def: 255,
    mdef: 255,
    agi: 129, // T-8 [conflict, minor]: SinirothX 129, wiki 128; use 129
    eva: 99, // [verified: 2 sources]
    luck: 26, // SinirothX (wiki Luck 26)
    acc: 0, // SinirothX
  },
  hp: 999999,
  mp: 999,
  level: 99, // [verified: 2 sources]
  affinities: { gravity: 'immune' }, // neutral to Fire, Ice, Lightning, Water, Holy; Gravity immune [verified: 4 sources]
  // Paragon's list plus Reflect [verified: 3 sources]: nothing lands on him.
  immunities: { ...CLOISTER_BOSS_IMMUNITY, reflect: 255 },
  immunityFlags: ['boss', 'immune-to-percentage-damage'],
  // Spellspring, International / HD only [verified: 2 sources — SinirothX `<Spellspring>`, Split_Infinity].
  autoStatuses: ['spellspring'],
  forms: [{ name: 'Trema', spriteKey: 'trema', hp: 999999 }],
  aiScriptId: 'trema',
  rewards: {
    ap: 50, // EXP / AP / Gil / Pilfer gil: SinirothX + wiki; EXP, AP, gil [verified: 3 sources]
    apOverkill: 50,
    gil: 10000,
    stolenGil: 300,
    exp: 10000,
    overkillThreshold: 0,
    // Dark Matter / Dark Matter x2, drop rate 100 % [verified: 3 sources]. The chapter's
    // reward, the Iron Duke Garment Grid [verified: 4 sources], is not an `EnemyRewards` field.
    drops: [{ itemId: 'x2-dark-matter', count: 1 }],
    steal: {
      baseChance: 50, // no source gives it (only the rate below): the house default, `[estimate]`
      stealRate: 128, // about 50 % [SinirothX + wiki]
      common: { itemId: 'x2-ether', count: 1 },
      rare: { itemId: 'x2-turbo-ether', count: 2 }, // T-10 [conflict, minor]: SinirothX x2, wiki x1
    },
  },
  abilityIds: [
    'trema-dying-star', 'trema-falling-leaf', 'trema-thundering-wave', 'trema-choking-mist',
    'trema-beguiling-mire', 'trema-waning-moon', 'trema-demi', 'trema-flare', 'trema-ultima', 'trema-meteor',
  ],
  flags: { isBoss: true },
  // No `scanText`: the game's Scan line (research §3.1) is not carried into the build (rule 8).
  // Our words over research §4.2 (the HP triggers); not a game line.
  sensorText: 'Nothing sticks to him. Watch his HP: at a half and at a quarter, the sky falls.',
};

/** Link 1: Paragon, on Cloister 100 before Trema (research §1.1, `[verified: 5 sources]`). */
export const cloisterParagonGroup: EnemyGroupDef = {
  id: CLOISTER_PARAGON,
  game: 'ffx2',
  enemies: [paragon],
  canEscape: false, // nothing sourced lets the party escape (plan O-4: no Flee)
  nextGroupId: CLOISTER_TREMA,
  musicCues: [{ at: 'start', track: 'scene-bevelle-underground', fadeMs: 800 }], // TR16 = a
  timedAilmentDefaults: true, // Paragon's Confuse wears off (§2.8 default 133), method check E1
  ...actionTime, // option 3 (E4), OFF
};

/** Link 2: Trema. `Bevelle - Secret Dungeon - Level 100 - BOSS 229 Trema 1` [SinirothX]. */
export const cloisterTremaGroup: EnemyGroupDef = {
  id: CLOISTER_TREMA,
  game: 'ffx2',
  enemies: [trema],
  canEscape: false,
  musicCues: [{ at: 'start', track: 'boss-ffx2-aeon', fadeMs: 800 }], // TR16 = a, the stand-in for `boss-trema`
  carriesPartyState: true, // "whatever state the Paragon fight left them" [verified: 5 sources]
  checkpointOnEntry: true, // TR5 = b
  timedAilmentDefaults: true, // Beguiling Mire's Stop wears off (§2.8, 100 [estimate]), method check E1
  ...actionTime, // option 3 (E4), OFF
};

export const tremaGroups: readonly EnemyGroupDef[] = [cloisterParagonGroup, cloisterTremaGroup];
