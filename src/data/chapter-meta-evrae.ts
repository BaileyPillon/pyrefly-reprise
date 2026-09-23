/**
 * Pause-screen and prebattle-tab metadata — Evrae, on the deck of the
 * *Fahrenheit* (FFX) [research/ffx-evrae-airship.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Nothing here is true of FFX-2.
 *
 * **Not registered.** `src/data/chapter-meta.ts`'s `CHAPTER_META` carries a
 * hard length-parity assertion against `CHAPTERS` (`tests/unit/chapter-meta.test.ts`)
 * that fails until `src/data/encounters.ts` (a contract file) widens
 * `ChapterId` and adds the chapter record — integrator-only work
 * (`docs/handoff/chapter-evrae-engine.md` "Owed to other tracks"). The chapter
 * stays LOCKED as Coming in chapter select until then, and its art
 * (`docs/concepts/chapters/evrae/`) is CANDIDATE, not Bailey-approved.
 *
 * `numeral` is typed loosely here (`string`, not the closed union
 * `ChapterMeta` uses) via `DraftChapterMeta` — the same relaxation
 * `chapter-meta-seymour-anima-macalania.ts` used before its own promotion —
 * because this chapter's real display number is an integrator decision this
 * track does not make.
 *
 * `heroArt` names the installed chapter-card plate,
 * `public/art/pause/evrae-chapter-card.png` (CANDIDATE, options round not yet
 * picked by Bailey — `docs/concepts/chapters/evrae/options.json`).
 * `heroArtFallback` is Tidus's existing portrait, since the chapter has no
 * playable Yuna and Tidus carries the beat sheet's opening lines
 * (`research/ffx-evrae-airship.md` §12.4).
 *
 * `musicKeys` names no new cue: §12.6 explicitly records "no source states
 * which track plays for the Evrae battle" as C-16. Chapter 1's
 * `scene-gagazet` / `boss-seymour` pair is reused as the recorded stopgap
 * (the same pattern `chapter-meta-seymour-anima-macalania.ts` used), plus the
 * shared `victory-ffx` fanfare. A future music track can compose this
 * chapter's own cues and swap both.
 */

import type { ChapterObjective, ChapterSnapshot } from './chapter-meta.ts';

/** Same relaxation `chapter-meta-seymour-anima-macalania.ts` used before its own promotion. */
interface DraftChapterMeta {
  id: string;
  gameLabel: 'FFX' | 'FFX-2';
  numeral: string;
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

/**
 * Evrae — on the deck of the *Fahrenheit*.
 * Beats: `research/ffx-evrae-airship.md` §12.4-12.5. Strategies: §8 (the
 * numbered player-strategy table cited row by row below).
 */
export const EVRAE_META: DraftChapterMeta = {
  id: 'evrae',
  gameLabel: 'FFX',
  numeral: 'VIII',
  title: 'Evrae',
  subtitle: "Bevelle's Doormat",
  location: 'The deck of the Fahrenheit',
  blurb:
    'Home is gone, Yuna is being married inside the hour, and Cid puts the ship on course before anyone ' +
    'finishes asking. Bevelle posted a guard for exactly this approach, and it was already waiting.',
  heroArt: 'pause/evrae-chapter-card',
  heroArtFallback: 'portraits/tidus.png',
  quote: {
    text: "It's Bevelle's welcome mat. Watch your feet — it bites.",
    speaker: 'Auron',
  },
  handwritten: 'no Yuna, nobody can heal',
  objectives: [
    {
      id: 'dodge-poison-breath',
      label: 'Survive Poison Breath',
      rule: { kind: 'survived-ability', ability: 'poison-breath' },
    },
    {
      id: 'cure-petrify',
      label: 'Cure a petrified ally',
      rule: { kind: 'status-cured', status: 'petrify' },
    },
    {
      id: 'defeat-evrae',
      label: 'Defeat Evrae',
      rule: { kind: 'victory' },
    },
  ],
  tip: "Pull back the moment the fight opens. Cid's missiles do more from FAR, for no party turn at all, than a full turn of swinging ever does.",
  snapshots: [
    { image: 'backdrops/evrae-airship-deck.png', caption: 'the foredeck, open sky' },
    { image: 'characters/evrae/idle-far.png', caption: 'a streak across clean sky' },
    { image: 'characters/evrae/breath-charge.png', caption: 'the throat, charging' },
  ],
  focalCharacterId: 'tidus',
  musicKeys: ['scene-gagazet', 'boss-seymour', 'victory-ffx'],
};

export default EVRAE_META;
