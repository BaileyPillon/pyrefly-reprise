/**
 * Per-chapter "pause screen" and prebattle-tab flavour data.
 *
 * This is presentation content layered on top of `./encounters.ts` — it does
 * not replace `Chapter.subtitle`/`Chapter.blurb`/`Chapter.sensorTexts`, which
 * stay exactly as they are for the chapter-select card and the in-battle
 * Sensor panel. `ChapterMeta` is written for a different reader: the
 * "Until Dawn"-style pause menu's character-relationship tab and the new
 * prebattle screen tab it shares layout with (see
 * `docs/handoff/pause-screen.md`).
 *
 * Every fact here is derived from `research/writing-bible.md` (voices,
 * §5.4 victory quips) and each chapter's own research document — the beat
 * sheet and player-strategies sections cited chapter-by-chapter below. All
 * `quote.text` values are original lines written for this screen, in the
 * focal character's documented voice; they are not transcriptions of any
 * script line.
 */

import type { GameId } from '../battle/common/types.ts';
import type { ChapterId } from './encounters.ts';
import { FFX2_LEBLANC_META } from './chapter-meta-ffx2-leblanc.ts';
import { SEYMOUR_ANIMA_MACALANIA_META } from './chapter-meta-seymour-anima-macalania.ts';
import { EVRAE_META } from './chapter-meta-evrae.ts';
import { YOJIMBO_META } from './chapter-meta-yojimbo.ts';
import { TREMA_META } from './chapter-meta-trema.ts';
import { FALLEN_AEONS_META } from './chapter-meta-fallen-aeons.ts';
import { SEYMOUR_OMNIS_META } from './chapter-meta-seymour-omnis.ts';
import { DEN_OF_WOE_META } from './chapter-meta-den-of-woe.ts';
import { NATUS_META } from './chapter-meta-natus.ts';
import { ISAARU_META } from './chapter-meta-isaaru.ts';

/**
 * The pause screen's objective rule vocabulary. Each rule is a pure
 * descriptor — small, serialisable, and meant to be evaluated by the pause
 * screen against a live `BattleState` (see `docs/handoff/pause-screen.md`
 * for the evaluator contract). This module only *describes* objectives; it
 * does not evaluate them, so it has no dependency on `BattleState` itself.
 *
 * `link-reached` refers to the chapter's own battle-chain position
 * (`EnemyGroupDef.nextGroupId`/`BattleSetup.chained`, i.e. which link of a
 * multi-battle chapter is live — Yunalesca's forms are `form-reached`
 * instead, since hers is one battle with in-place transformations, not a
 * chain of separate `EnemyGroupDef`s). `parts-downed` and `chain-landed`
 * extend the six example shapes in the brief for the two objectives that
 * don't fit them: Braska's Final Aeon's Yu Pagoda pair, and FFX-2 Bahamut's
 * Chain Attack counter (`FFXCombatant.chainCount`, distinct from a chapter
 * "link").
 */
export type ObjectiveRule =
  | { kind: 'status-cured'; status: string }
  | { kind: 'survived-ability'; ability: string }
  | { kind: 'form-reached'; form: number }
  | { kind: 'boss-hp-below'; fraction: number }
  | { kind: 'link-reached'; link: number }
  | { kind: 'parts-downed'; targetIds: readonly string[] }
  | { kind: 'chain-landed'; count: number }
  | { kind: 'victory' };

/** One pause-screen objective row: a checklist entry plus the rule that clears it. */
export interface ChapterObjective {
  id: string;
  label: string;
  rule: ObjectiveRule;
}

/**
 * One "snapshot" tile on the pause screen's chapter tab — a small still with
 * a handwritten-style caption, like a photo tucked into a journal. `image`
 * is a path relative to `public/art/`, extension included, and always an
 * **existing, already-shipped** asset (a backdrop or a character sheet) —
 * never a new commission.
 */
export interface ChapterSnapshot {
  image: string;
  caption: string;
}

/**
 * Pause-screen and prebattle-tab metadata for one chapter.
 *
 * `heroArt` is the new "Until Dawn"-style close-up commissioned for this
 * screen — a path relative to `public/art/`, **no extension**, because the
 * art pipeline hasn't rendered it yet (see `docs/handoff/pause-screen.md`,
 * §Art status). `heroArtFallback` is a path relative to `public/art/`,
 * extension included, to an existing portrait/character asset the screen
 * renders instead until `heroArt` exists.
 */
export interface ChapterMeta {
  id: ChapterId;
  gameLabel: 'FFX' | 'FFX-2';
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX' | 'X' | 'XI' | 'XII' | 'XIII' | 'XIV' | 'XV';
  title: string;
  subtitle: string;
  location: string;
  blurb: string;
  heroArt: string;
  heroArtFallback: string;
  quote: { text: string; speaker: string };
  handwritten: string;
  objectives: readonly [ChapterObjective, ChapterObjective, ChapterObjective];
  tip: string;
  snapshots: readonly [ChapterSnapshot, ChapterSnapshot, ChapterSnapshot];
  focalCharacterId: string;
  musicKeys: readonly string[];
}

/** `GameId` ('ffx' | 'ffx2') → the pause screen's display label. */
export const GAME_LABELS: Record<GameId, 'FFX' | 'FFX-2'> = {
  ffx: 'FFX',
  ffx2: 'FFX-2',
};

/**
 * Chapter 1 — Seymour Flux, Mt. Gagazet.
 * Beats: `research/ffx-seymour-flux.md` §8. Strategies: §6, rows 5, 13–14.
 */
const SEYMOUR_FLUX_META: ChapterMeta = {
  id: 'seymour-flux',
  gameLabel: 'FFX',
  numeral: 'I',
  title: 'Seymour Flux',
  subtitle: 'The Prominence',
  location: 'Mt. Gagazet',
  blurb:
    'The Ronso died holding this gate, and Seymour is still standing over the bodies when the party ' +
    "arrives. He is offering the pilgrimage's ending early, and he is not lying about the cost.",
  heroArt: 'pause/ch1-seymour-flux',
  heroArtFallback: 'portraits/seymour.png',
  quote: {
    text: 'Sorrow is honest, at least. That is more than the Ronso could say of hope.',
    speaker: 'Seymour',
  },
  handwritten: 'the mountain remembers everything',
  objectives: [
    {
      id: 'cure-zombie-before-full-life',
      label: 'Holy Water a Zombie before Full-Life lands',
      rule: { kind: 'status-cured', status: 'zombie' },
    },
    {
      id: 'survive-total-annihilation',
      label: 'Survive Total Annihilation',
      rule: { kind: 'survived-ability', ability: 'total-annihilation' },
    },
    {
      id: 'defeat-seymour-flux',
      label: 'Defeat Seymour Flux',
      rule: { kind: 'victory' },
    },
  ],
  tip: "Bio him turn one — it deals a straight percentage every enemy turn and never triggers his HP-threshold reactions, so Protect and Reflect come out late.",
  snapshots: [
    { image: 'backdrops/gagazet.png', caption: 'the Prominence, at last' },
    { image: 'characters/seymour-flux/idle.png', caption: 'unhurried, always unhurried' },
    { image: 'characters/mortiorchis/idle.png', caption: 'the machine beneath him' },
  ],
  focalCharacterId: 'seymour',
  musicKeys: ['scene-gagazet', 'boss-seymour', 'victory-ffx'],
};

/**
 * Chapter 2 — Yunalesca, Zanarkand Dome.
 * Beats: `research/ffx-yunalesca.md` §13. Strategies: §10.1–10.5.
 */
const YUNALESCA_META: ChapterMeta = {
  id: 'yunalesca',
  gameLabel: 'FFX',
  numeral: 'II',
  title: 'Lady Yunalesca',
  subtitle: 'What Was Promised',
  location: 'Zanarkand Dome',
  blurb:
    'A thousand years of summoners came here to be told the same kind lie. She will not raise her ' +
    'voice, she will not once say anything untrue, and someone still has to refuse her.',
  heroArt: 'pause/ch2-yunalesca',
  heroArtFallback: 'portraits/yunalesca.png',
  quote: {
    text: 'You are so very tired. Let me be the last kindness you ever need.',
    speaker: 'Yunalesca',
  },
  handwritten: 'she is telling the truth',
  objectives: [
    {
      id: 'stay-zombie-into-form-3',
      label: 'Reach Form III with a Zombie still standing',
      rule: { kind: 'form-reached', form: 3 },
    },
    {
      id: 'dispel-her-regen',
      label: "Dispel Yunalesca's Regen",
      rule: { kind: 'status-cured', status: 'regen' },
    },
    {
      id: 'defeat-all-forms',
      label: 'Defeat all three forms',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'Do not cure every Zombie before Form III — the one left standing survives Mega Death and can raise everyone else.',
  snapshots: [
    { image: 'backdrops/zanarkand-dome.png', caption: 'the great hall' },
    { image: 'characters/yunalesca-3/idle.png', caption: 'the third shape' },
    { image: 'portraits/auron.png', caption: "it isn't over" },
  ],
  focalCharacterId: 'yunalesca',
  musicKeys: ['scene-zanarkand-dome', 'boss-yunalesca', 'victory-ffx'],
};

/**
 * Chapter 3 — Braska's Final Aeon (Jecht) through Yu Yevon, Dream's End.
 * Beats: `research/ffx-bfa-yu-yevon.md` §5. Strategies: §1.4, Yu Pagoda
 * targeting rule and Overdrive-gauge tuning ("kill both or neither").
 */
const BRASKAS_FINAL_AEON_META: ChapterMeta = {
  id: 'braskas-final-aeon',
  gameLabel: 'FFX',
  numeral: 'III',
  title: "Braska's Final Aeon",
  subtitle: 'A Father, Wearing Him',
  location: "Dream's End",
  blurb:
    'Jecht is waiting alone in a stadium remembered wrong, and he is not sorry, and he cannot stop. ' +
    'Whatever comes back afterward wearing someone else has to be sent too, one at a time.',
  heroArt: 'pause/ch3-braskas-final-aeon',
  heroArtFallback: 'portraits/jecht.png',
  quote: {
    text: "Hey — don't look so scared. Somebody's gotta lose, and it ain't gonna be you.",
    speaker: 'Jecht',
  },
  handwritten: 'he never gets to be sorry',
  objectives: [
    {
      id: 'down-both-pagodas',
      label: 'Down both Yu Pagodas at once',
      rule: { kind: 'parts-downed', targetIds: ['yu-pagoda-left', 'yu-pagoda-right'] },
    },
    {
      id: 'survive-ultimate-jecht-shot',
      label: 'Survive Ultimate Jecht Shot',
      rule: { kind: 'survived-ability', ability: 'ultimate-jecht-shot' },
    },
    {
      id: 'send-yu-yevon',
      label: 'Send Yu Yevon',
      rule: { kind: 'victory' },
    },
  ],
  tip: "Kill both Pagodas the same turn — a lone survivor turns aggressive, and a live Power Wave heals him 1,500 and fuels his Overdrive by 20%.",
  snapshots: [
    { image: 'backdrops/dreams-end.png', caption: 'a stadium remembered wrong' },
    { image: 'characters/braskas-final-aeon-1/idle.png', caption: 'still cryin, figures' },
    { image: 'characters/braskas-final-aeon-2/idle.png', caption: 'the second shape' },
  ],
  focalCharacterId: 'jecht',
  musicKeys: ['scene-dreams-end', 'boss-jecht', 'boss-yu-yevon', 'victory-ffx', 'ending-ffx'],
};

/**
 * Chapter 4 — FFX-2 Bahamut, Bevelle Underground / Limbo.
 * Beats: `research/ffx2-bahamut.md` §5. Strategies: §3 (Magic Break line,
 * Chain Attack as the fast, defense-ignoring damage route).
 *
 * No victory quip and no victory pose ship for this chapter's Results screen
 * [writing-bible §5.4] — that suppression lives on `Chapter.music` in
 * `./encounters.ts` (no `victory` key) and is untouched here. This chapter's
 * pause-tab objectives are still tracked; only the battle-end flourish is
 * silent.
 */
const FFX2_BAHAMUT_META: ChapterMeta = {
  id: 'ffx2-bahamut',
  gameLabel: 'FFX-2',
  numeral: 'IV',
  title: 'Bahamut',
  subtitle: 'Something She Named',
  location: 'Bevelle Underground',
  blurb:
    'Two years on, the aeon Yuna once called by name is standing in the dark with nobody home behind ' +
    'its eyes. She tries to talk it down anyway, because that is what she knows how to do.',
  heroArt: 'pause/ch4-ffx2-bahamut',
  heroArtFallback: 'portraits/yuna.png',
  quote: {
    text: "Bahamut, it's me. Please — you have to hear me, just this once.",
    speaker: 'Yuna',
  },
  handwritten: 'no fanfare when this ends',
  objectives: [
    {
      id: 'survive-mega-flare',
      label: 'Survive a Mega Flare',
      rule: { kind: 'survived-ability', ability: 'mega-flare' },
    },
    {
      id: 'land-a-five-hit-chain',
      label: 'Land a 5-hit Chain Attack',
      rule: { kind: 'chain-landed', count: 5 },
    },
    {
      id: 'defeat-bahamut',
      label: 'Defeat Bahamut',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'Magic Break first, five stacks — it caps Mega Flare at a sixth of its damage and Impulse at a sixteenth, and it stacks with Shell.',
  snapshots: [
    { image: 'backdrops/bevelle-underground.png', caption: 'Limbo, a thousand years dark' },
    { image: 'characters/ffx2-bahamut/idle.png', caption: 'nobody is home' },
    { image: 'characters/paine-warrior/idle.png', caption: "you don't get another option" },
  ],
  focalCharacterId: 'yuna-ffx2',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-aeon'],
};

/**
 * Chapter 5 — Vegnagun / Shuyin, Heart of the Farplane.
 * Beats: `research/ffx2-vegnagun-shuyin.md` §9. Strategies: §7.2 (Darkness
 * as the ignores-Defense damage route through all five battles).
 */
const FFX2_VEGNAGUN_SHUYIN_META: ChapterMeta = {
  id: 'ffx2-vegnagun-shuyin',
  gameLabel: 'FFX-2',
  numeral: 'V',
  title: 'Vegnagun',
  subtitle: 'Before the Last Note',
  location: 'Heart of the Farplane',
  blurb:
    'A thousand-year gun the size of a cathedral, and a boy inside it who has been grieving for just ' +
    'as long. Tail, leg, body, head — and then, finally, the boy holding the trigger.',
  heroArt: 'pause/ch5-ffx2-vegnagun-shuyin',
  heroArtFallback: 'characters/shuyin/idle.png',
  quote: {
    text: 'A thousand years of silence, and Spira never once stopped to listen.',
    speaker: 'Shuyin',
  },
  handwritten: 'a thousand years, one note',
  objectives: [
    {
      id: 'destroy-all-four-parts',
      label: "Destroy all four of Vegnagun's parts",
      rule: { kind: 'link-reached', link: 4 },
    },
    {
      id: 'weather-terror-of-zanarkand',
      label: 'Survive Terror of Zanarkand',
      rule: { kind: 'survived-ability', ability: 'terror-of-zanarkand' },
    },
    {
      id: 'free-shuyin',
      label: 'Free Shuyin',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'Two Dark Knights spamming Darkness ignore every part’s Defense, hit every target at once, and cost HP a Mega-Potion undoes.',
  snapshots: [
    { image: 'backdrops/farplane.png', caption: "Vegnagun's chamber" },
    { image: 'characters/vegnagun-head/idle.png', caption: 'kill the arms first' },
    { image: 'characters/lenne/idle.png', caption: 'the note he circles' },
  ],
  focalCharacterId: 'shuyin',
  musicKeys: ['scene-farplane', 'boss-vegnagun', 'boss-shuyin', 'victory-ffx2', 'ending-ffx2'],
};

/** All thirteen listed chapters' pause-screen metadata, in play order. */
export const CHAPTER_META: readonly ChapterMeta[] = [
  SEYMOUR_FLUX_META,
  YUNALESCA_META,
  BRASKAS_FINAL_AEON_META,
  FFX2_BAHAMUT_META,
  FFX2_VEGNAGUN_SHUYIN_META,
  FFX2_LEBLANC_META,
  SEYMOUR_ANIMA_MACALANIA_META,
  EVRAE_META,
  YOJIMBO_META,
  NATUS_META, // Chapter X (FFX), listed 2026-09-25
  SEYMOUR_OMNIS_META, // Chapter XII (FFX), listed 2026-09-25
  TREMA_META, // Chapter XIII (FFX-2), listed 2026-09-25
  ISAARU_META, // Chapter XIV (FFX), listed 2026-09-25
] as const;

/**
 * Metadata for chapters that are registered but not listed
 * (`./chapters-unlisted.ts`): the pause screen and the prep panel find them by
 * id, and `CHAPTER_META` stays one-to-one with the listed chapters. Listing a
 * chapter moves its record from here into `CHAPTER_META`.
 */
export const UNLISTED_CHAPTER_META: readonly ChapterMeta[] = [FALLEN_AEONS_META, DEN_OF_WOE_META] as const; // Chapter XI (FFX-2), Chapter XV (FFX-2)

/** Look a chapter's pause-screen metadata up by id. `undefined` for an unknown id. */
export function getChapterMeta(id: string): ChapterMeta | undefined {
  return CHAPTER_META.find((m) => m.id === id) ?? UNLISTED_CHAPTER_META.find((m) => m.id === id);
}
