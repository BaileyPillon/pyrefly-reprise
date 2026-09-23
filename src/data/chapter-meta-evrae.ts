/**
 * Pause-screen and prebattle-tab metadata — Evrae, on the deck of the
 * *Fahrenheit* (FFX) [research/ffx-evrae-airship.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Nothing here is true of FFX-2.
 *
 * **Registered** in `./chapter-meta.ts`'s `CHAPTER_META` by the integrator
 * (`docs/handoff/chapter-evrae.md`), now a real `ChapterMeta`: the
 * `DraftChapterMeta` relaxation went away once `src/data/encounters.ts`
 * widened `ChapterId` with `'evrae-airship'` (the formation's id and the
 * COMING row's) and the chapter took number 8 (display order, the D-018 rule).
 * The chapter stays LOCKED as COMING on chapter select until Bailey approves
 * its art (`docs/concepts/chapters/evrae/` is CANDIDATE).
 *
 * `heroArt` names the installed chapter-card plate,
 * `public/art/pause/evrae-chapter-card.png` (CANDIDATE, options round not yet
 * picked by Bailey — `docs/concepts/chapters/evrae/options.json`).
 * `heroArtFallback` is Tidus's existing portrait, since the chapter has no
 * playable Yuna and Tidus carries the beat sheet's opening lines
 * (`research/ffx-evrae-airship.md` §12.4).
 *
 * `musicKeys` are the chapter's own two cues, `scene-fahrenheit` and
 * `boss-evrae` (original compositions to research §12.6's brief; §12.6 still
 * records "no source states which track plays for the Evrae battle" as C-16,
 * so they fill the slot rather than claim the canon track), plus the shared
 * `victory-ffx` fanfare. Candidates until Bailey's ear rules (rule 13).
 */

import type { ChapterMeta } from './chapter-meta.ts';

/**
 * Evrae — on the deck of the *Fahrenheit*.
 * Beats: `research/ffx-evrae-airship.md` §12.4-12.5. Strategies: §8 (the
 * numbered player-strategy table cited row by row below).
 */
export const EVRAE_META: ChapterMeta = {
  id: 'evrae-airship',
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
  musicKeys: ['scene-fahrenheit', 'boss-evrae', 'victory-ffx'],
};

export default EVRAE_META;
