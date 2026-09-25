/**
 * The five chapters.
 *
 * **Contract file.** `ChapterSelect`, `PartyPrep`, the cutscene runner, the
 * battle screens and the debug API all key off {@link ChapterId}. Everything
 * else about a chapter hangs off the record here, so adding content means
 * editing the referenced data module, not this file.
 *
 * Scope is fixed by `docs/ARCHITECTURE.md` and confirmed in
 * `research/writing-bible.md` §0.1. Note two things the research settles:
 * - Braska's Final Aeon, the possessed aeons and Yu Yevon are **one** chapter.
 * - FFX-2 Bahamut is a chapter in its own right, and its story knowledge state
 *   is **Chapter 2, Limbo** even though we label it chapter 4
 *   [writing-bible §0.3].
 */

import type {
  EnemyGroupDef,
  FFXPartyBuild,
  FFX2PartyBuild,
  GameId,
  MusicKey,
} from '../battle/common/types.ts';
import type { ChapterScripts } from '../story/dsl.ts';

import { gagazetBuild } from './ffx/builds/gagazet.ts';
import { zanarkandBuild } from './ffx/builds/zanarkand.ts';
import { dreamsEndBuild } from './ffx/builds/dreams-end.ts';
import { seymourFluxGroup } from './ffx/enemies/seymour-flux.ts';
import { yunalescaGroup } from './ffx/enemies/yunalesca.ts';
import { braskasFinalAeonGroup } from './ffx/enemies/braskas-final-aeon.ts';

import { bevelleBuild } from './ffx2/builds/bevelle.ts';
import { farplaneBuild } from './ffx2/builds/farplane.ts';
import { chateauBuild } from './ffx2/builds/chateau.ts';
import { bahamutGroup } from './ffx2/enemies/bahamut.ts';
import { vegnagunTailGroup } from './ffx2/enemies/vegnagun-shuyin.ts';
import { leblancEntranceGroup } from './ffx2/enemies/leblanc-syndicate-acts.ts';

import { seymourFluxScripts } from '../story/scripts/seymour-flux.ts';
import { yunalescaScripts } from '../story/scripts/yunalesca.ts';
import { braskasFinalAeonScripts } from '../story/scripts/braskas-final-aeon.ts';
import { ffx2BahamutScripts } from '../story/scripts/ffx2-bahamut.ts';
import { ffx2VegnagunShuyinScripts } from '../story/scripts/ffx2-vegnagun-shuyin.ts';
import { ffx2LeblancScripts } from '../story/scripts/ffx2-leblanc.ts';

// Chapter 7's record lives in its own file for the 400-line rule; it imports
// only the `Chapter` type from here, so there is no runtime cycle.
import { SEYMOUR_ANIMA_MACALANIA } from './chapter-seymour-anima-macalania.ts';
// Chapter 8's record, same reason and the same type-only import.
import { EVRAE_AIRSHIP } from './chapter-evrae-airship.ts';
// Chapter 9's record (listed 2026-09-24) and the registered-but-unlisted list (same reason).
import { YOJIMBO_CAVERN } from './chapter-yojimbo-cavern.ts';
import { UNLISTED_CHAPTERS } from './chapters-unlisted.ts';

/**
 * Every registered chapter id. Also the keys used in `SaveData.chapters`.
 * `'seymour-natus'`, `'ffx2-fallen-aeons'` and `'seymour-omnis'` are registered but unlisted: see `UNLISTED_CHAPTERS`.
 */
export type ChapterId =
  | 'seymour-flux'
  | 'yunalesca'
  | 'braskas-final-aeon'
  | 'ffx2-bahamut'
  | 'ffx2-vegnagun-shuyin'
  | 'ffx2-leblanc'
  | 'seymour-anima-macalania'
  | 'evrae-airship'
  | 'yojimbo-cavern'
  | 'seymour-natus' | 'ffx2-fallen-aeons'
  | 'seymour-omnis';

/** Per-chapter music cues. Every value is a key into `src/audio/tracks`. */
export interface ChapterMusic {
  /**
   * The chapter's establishing cue.
   *
   * Every shipped `pre` script sets its own bed in its opening steps, so this
   * is the fallback for a script that says nothing — and the chapter's entry
   * in the pause menu's jukebox. It therefore names the cue the scene actually
   * uses (`scene-gagazet`, `scene-zanarkand-dome`, ...) rather than a generic
   * one the script would immediately crossfade away
   * (`BattleScreenFlow.playCutscene`).
   */
  scene: MusicKey;
  /**
   * The chapter's own boss theme.
   *
   * The formation's `musicCues` `{ at: 'start' }` entry wins over this at the
   * battle screen (`BattleEncounterChain.cueForGroup`); the two agree for all
   * five chapters. FFX chapters name FFX cues and FFX-2 chapters FFX-2 cues —
   * the cue map in `docs/audio/THEMES.md` never crosses the two scores.
   */
  battle: MusicKey;
  /** The cue the chapter's second phase or later link switches to, when it has one. */
  phase2?: MusicKey;
  /**
   * Victory fanfare, played by `BattleScreenFlow.showResults`. FFX chapters use
   * `victory-ffx` ("Relief, not triumph"), FFX-2 chapters `victory-ffx2`
   * ("That was fun") — the cue map in `docs/audio/THEMES.md` §"The cue map"
   * rows 15 and 20. Chapter 4 is deliberately silent — see its record.
   */
  victory?: MusicKey;
  /**
   * The cue the post-battle scene plays under, when the script does not set
   * one itself. All five scripts do (each opens with `music(null)` — the coda
   * lands in silence and brings its own theme up afterwards), so this is
   * absent everywhere and exists for a chapter whose post scene is scored from
   * the outside.
   */
  post?: MusicKey;
}

/** One chapter: everything the app needs to select, stage, fight and resolve it. */
export interface Chapter {
  id: ChapterId;
  game: GameId;
  /** Display order on the chapter-select screen, 1–12 (an unlisted chapter keeps its number). */
  number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Card title. The encounter's name. */
  title: string;
  /** Card subtitle. One clause, no period. */
  subtitle: string;
  /** Where it happens, as the player would say it. */
  location: string;
  /** Two or three sentences in FFX's register for the chapter-select card. Short. */
  blurb: string;
  /** Diorama builder key in `src/scenes/`. */
  sceneKey: string;
  /** Chapter-select card art key. */
  thumbnailKey: string;
  /** The party at this chapter's build point. */
  buildRef: FFXPartyBuild | FFX2PartyBuild;
  /** The first (or only) enemy formation. Chained encounters link on via `nextGroupId`. */
  enemyGroupRef: EnemyGroupDef;
  /** Pre/post cutscenes, mid-battle triggers and victory quips. */
  scriptsRef: ChapterScripts;
  music: ChapterMusic;
  /**
   * Targeting-bar Sensor lines, keyed by enemy combatant id. Duplicated from
   * the enemy records so the Sensor panel has one lookup, and so a chapter can
   * override a line without editing the stat block.
   * [writing-bible §5.3 — Sensor text is in-world advice and is allowed to be wrong.]
   */
  sensorTexts: Record<string, string>;
}

/** Chapter 1. */
export const SEYMOUR_FLUX: Chapter = {
  id: 'seymour-flux',
  game: 'ffx',
  number: 1,
  title: 'Seymour Flux',
  subtitle: 'The mountain of the Ronso, and what was done to them',
  location: 'Mt. Gagazet — the Prominence',
  blurb:
    'The Ronso held the gate so the summoner could pass. Seymour calls it mercy. ' +
    'He is still unsent, he is waiting on the trail, and everything he says about Jecht is true.',
  sceneKey: 'gagazet',
  thumbnailKey: 'chapter-seymour-flux',
  buildRef: gagazetBuild,
  enemyGroupRef: seymourFluxGroup,
  scriptsRef: seymourFluxScripts,
  music: {
    scene: 'scene-gagazet',
    battle: 'boss-seymour',
    victory: 'victory-ffx',
  },
  sensorTexts: {
    'seymour-flux': 'Turns healing into a weapon. Kill the floating thing before it finishes counting.',
    mortiorchis: 'It is not attacking you. It is waiting for a number to fill.',
  },
};

/** Chapter 2. */
export const YUNALESCA: Chapter = {
  id: 'yunalesca',
  game: 'ffx',
  number: 2,
  title: 'Lady Yunalesca',
  subtitle: 'The first summoner, and the price she set',
  location: 'Zanarkand Dome — the great hall',
  blurb:
    'A thousand years of pilgrims came here to be told what it costs. ' +
    'She will explain it kindly. She will change twice. Someone has to refuse her.',
  sceneKey: 'zanarkand-dome',
  thumbnailKey: 'chapter-yunalesca',
  buildRef: zanarkandBuild,
  enemyGroupRef: yunalescaGroup,
  scriptsRef: yunalescaScripts,
  music: {
    scene: 'scene-zanarkand-dome',
    // One cue through all three forms: the rite does not change its mind
    // [docs/audio/THEMES.md cue map row 7, "a rite that will finish with or
    // without you"]. Her forms are form-changes inside one formation, not a
    // chain, so there is no second cue to switch to.
    battle: 'boss-yunalesca',
    victory: 'victory-ffx',
  },
  sensorTexts: {
    yunalesca: 'Weak to Holy, they say. They have been saying it for a thousand years.',
  },
};

/** Chapter 3 — one continuous chapter, four battles deep. */
export const BRASKAS_FINAL_AEON: Chapter = {
  id: 'braskas-final-aeon',
  game: 'ffx',
  number: 3,
  title: "Braska's Final Aeon",
  subtitle: 'A father, a promise, and the thing that was wearing him',
  location: "Dream's End — inside Sin",
  blurb:
    'The arena is a stadium remembered wrong. Jecht is waiting in it, and he is not sorry, ' +
    'and he cannot stop. Afterwards the aeons come back one at a time, wearing someone else.',
  sceneKey: 'dreams-end',
  thumbnailKey: 'chapter-braskas-final-aeon',
  buildRef: dreamsEndBuild,
  enemyGroupRef: braskasFinalAeonGroup,
  scriptsRef: braskasFinalAeonScripts,
  music: {
    scene: 'scene-dreams-end',
    // Jecht, then Yu Yevon. Each formation in the chain declares the same two
    // cues itself (`braskas-final-aeon.ts:247`, `:481`); these are the
    // chapter-level statement of the same thing, and what the jukebox lists.
    battle: 'boss-jecht',
    phase2: 'boss-yu-yevon',
    victory: 'victory-ffx',
  },
  sensorTexts: {
    'braskas-final-aeon': 'The pillars keep it standing. Take the pillars.',
    'yu-pagoda-left': 'Every kindness it performs is aimed at you.',
    'yu-pagoda-right': 'Every kindness it performs is aimed at you.',
    'yu-yevon': 'It cannot be reasoned with. It stopped being anyone a long time ago.',
  },
};

/**
 * Chapter 4.
 *
 * Uniquely, this fight has **no victory pose and no fanfare** — the Results
 * screen comes up silent [writing-bible §5.4], which is why `music.victory` is
 * absent rather than set to a track.
 */
export const FFX2_BAHAMUT: Chapter = {
  id: 'ffx2-bahamut',
  game: 'ffx2',
  number: 4,
  title: 'Bahamut',
  subtitle: 'Something she used to call by name',
  location: 'Bevelle Underground — Limbo',
  blurb:
    'Under the temple, in the hangar where Vegnagun used to stand, an aeon is waiting ' +
    'and it is not itself. Nobody cheers when this one is over.',
  sceneKey: 'bevelle-underground',
  thumbnailKey: 'chapter-ffx2-bahamut',
  buildRef: bevelleBuild,
  enemyGroupRef: bahamutGroup,
  scriptsRef: ffx2BahamutScripts,
  music: {
    scene: 'scene-bevelle-underground',
    // "Yuna's Ballad" — the one aeon fight with its own leitmotif rather than a
    // boss theme [bahamut.ts:114; THEMES.md cue map row 17].
    battle: 'boss-ffx2-aeon',
    // No `victory`: the flourish is suppressed for this chapter.
  },
  sensorTexts: {
    bahamut: 'An aeon that once fought alongside Yuna.',
  },
};

/** Chapter 5 — five battles with no menu between. */
export const FFX2_VEGNAGUN_SHUYIN: Chapter = {
  id: 'ffx2-vegnagun-shuyin',
  game: 'ffx2',
  number: 5,
  title: 'Vegnagun',
  subtitle: 'Take it apart before it finishes the note',
  location: 'Heart of the Farplane — Vegnagun’s chamber',
  blurb:
    'A thousand-year gun the size of a cathedral, and a boy inside it who has been ' +
    'grieving for just as long. Tail, leg, body, head. Then the boy.',
  sceneKey: 'farplane',
  thumbnailKey: 'chapter-ffx2-vegnagun-shuyin',
  buildRef: farplaneBuild,
  enemyGroupRef: vegnagunTailGroup,
  scriptsRef: ffx2VegnagunShuyinScripts,
  music: {
    scene: 'scene-farplane',
    // The gun, then the boy inside it — the four Vegnagun formations each
    // declare `boss-vegnagun` and `shuyin.ts:90` declares `boss-shuyin`.
    battle: 'boss-vegnagun',
    phase2: 'boss-shuyin',
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    'vegnagun-tail': 'Kill the arms before you look it in the face.',
    'vegnagun-head': 'Kill the arms before you look it in the face.',
    shuyin: 'Fights like someone you loved. He is not.',
  },
};

/**
 * Chapter 6 — The Leblanc Syndicate, Chateau Leblanc.
 *
 * `docs/target/decisions.json` D-018 (Bailey, 2026-09-21, "Yes to all
 * recommendations"): number 6, id `ffx2-leblanc`, per the paper preflight's
 * Q1 (`docs/plans/chapter-leblanc-review.md` §5) — this is FFX-2's own
 * Chapter 2 mission ("Faking and Entering") narratively, numbered 6th in
 * display/select order because it lands after the five chapters already
 * shipped.
 *
 * `enemyGroupRef` is Act I's entrance formation; the engine follows its
 * `nextGroupId` chain through Act II (Logos' room) into Act III (the Last
 * Room, all three Syndicate members) the same way Chapter 5 chains Vegnagun's
 * four parts into Shuyin.
 *
 * `sceneKey` reuses the one Leblanc diorama that has been built and staged
 * (`docs/handoff/chapter-leblanc-scene.md`) for all three acts, including the
 * entrance and Logos' room — no options round has picked distinct dioramas
 * for those two yet, so the Last Room's backdrop and camera rigs stand in for
 * the whole mission rather than nothing at all. Recorded as a gap, not a
 * silent guess.
 *
 * `music`: no dedicated cues exist for this chapter yet
 * (`docs/plans/music-modern-sound.md` and `docs/audio/THEMES.md` name none).
 * Per the integrator's brief, this falls back to the cues Chapter 4 uses —
 * `scene-bevelle-underground` and `boss-ffx2-aeon` — rather than inventing a
 * new `MusicKey`/track pair, which would need real composition and a
 * `docs/audio/THEMES.md` cue-map row this track cannot author. `victory-ffx2`
 * is the real, already-shipped FFX-2 victory fanfare (D-018: this chapter
 * ships its flourish, unlike Chapter 4's suppressed one).
 */
export const FFX2_LEBLANC: Chapter = {
  id: 'ffx2-leblanc',
  game: 'ffx2',
  number: 6,
  title: 'Leblanc',
  subtitle: 'A Farce, Armed',
  location: 'Chateau Leblanc, Guadosalam',
  blurb:
    'Three stolen uniforms get the girls through the front door of a mansion playing dress-up as a rival ' +
    "crew — right up until the ambush underground turns real. What they walk out with matters more than " +
    'either side realizes yet.',
  sceneKey: 'leblanc-last-room',
  thumbnailKey: 'chapter-ffx2-leblanc',
  buildRef: chateauBuild,
  enemyGroupRef: leblancEntranceGroup,
  scriptsRef: ffx2LeblancScripts,
  music: {
    // Fallback to Chapter 4's cues — see the class doc above.
    scene: 'scene-bevelle-underground',
    battle: 'boss-ffx2-aeon',
    victory: 'victory-ffx2',
  },
  sensorTexts: {
    leblanc: 'Defense 10. She wants spells thrown at her, not swords.',
    logos: 'Evasion 40, the highest in the room. A plain swing mostly finds air.',
    ormi: 'Defense 84, Magic Defense 16. Magic is the only thing that gets through.',
  },
};

export { SEYMOUR_ANIMA_MACALANIA, EVRAE_AIRSHIP, YOJIMBO_CAVERN };
export { UNLISTED_CHAPTERS }; // registered, not listed: `./chapters-unlisted.ts`

/**
 * All nine, in play order (Chapter IX listed 2026-09-24). A listed chapter
 * whose id is in `LOCKED_CHAPTER_IDS` (`src/app/screens/frontend/comingChapters.ts`)
 * still shows as a COMING card on chapter select until Bailey approves its art.
 */
export const CHAPTERS: readonly Chapter[] = [
  SEYMOUR_FLUX,
  YUNALESCA,
  BRASKAS_FINAL_AEON,
  FFX2_BAHAMUT,
  FFX2_VEGNAGUN_SHUYIN,
  FFX2_LEBLANC,
  SEYMOUR_ANIMA_MACALANIA,
  EVRAE_AIRSHIP,
  YOJIMBO_CAVERN,
] as const;

/** Chapter ids, in play order. */
export const CHAPTER_IDS: readonly ChapterId[] = [
  'seymour-flux',
  'yunalesca',
  'braskas-final-aeon',
  'ffx2-bahamut',
  'ffx2-vegnagun-shuyin',
  'ffx2-leblanc',
  'seymour-anima-macalania',
  'evrae-airship',
  'yojimbo-cavern',
] as const;

/** Look a chapter up by id, listed or not. Returns `undefined` for an unknown id. */
export function getChapter(id: string): Chapter | undefined {
  return CHAPTERS.find((c) => c.id === id) ?? UNLISTED_CHAPTERS.find((c) => c.id === id);
}
