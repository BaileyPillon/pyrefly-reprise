/**
 * Pause-screen and prebattle-tab metadata for Sin's two chapters, **FFX only** [AGENTS.md rule 14;
 * research/ffx-sin.md §0.3]: Chapter XVII, "Sin: the Fins and the Core", and Chapter XVIII, "Sin: the Face"
 * (D-270's working titles; Bailey confirms them at listing).
 *
 * **Listed 2026-09-29** (D-279: the driver's picks, which Bailey delegated; he can swap any of them).
 * `./chapter-meta.ts` spreads {@link SIN_CHAPTER_META} into `CHAPTER_META`, after Chapter XVI (plan §6).
 *
 * **The picks, and what is still a stand-in:**
 * - `heroArt` names each chapter's pause plate, the driver's pick (D-279;
 *   `docs/concepts/chapters/sin-2026-09-29/install/INSTALL.md` "Pause hero plates"): XVII is the Left Fin over
 *   the rail at NEAR with its core gathering, XVIII is head C at stage 3 on its own plate. Until the files are
 *   installed under `public/art/pause/`, the screen shows `heroArtFallback`, an existing portrait.
 * - `snapshots` are existing, shipped stills only (the rule `ChapterSnapshot` states): the *Fahrenheit*'s deck,
 *   Bevelle, and portraits.
 * - `musicKeys` are the stand-in cues the records play (plan §3.6; THEMES.md "Owed cues"), labelled: agents
 *   cannot hear (rule 13), so the cues are the driver's stand-ins until Bailey judges the owed ones by ear.
 *
 * The teach lines are the concept sheet's "What it teaches" (plan §3.4): range buys safety, not damage;
 * Armor Break opens every link; kill order is yours; a burst against a clock; Wards against Gaze. Quotes are
 * original lines in the speaker's documented voice (research/writing-bible.md §1), not transcriptions.
 */

import type { ChapterMeta } from './chapter-meta.ts';

/**
 * Chapter XVII — the Fins and the Core. Beats: research §9.2 beats 1 to 8. Strategies: §8 rows 1 to 7.
 */
export const SIN_FINS_CORE_META: ChapterMeta = {
  id: 'sin-fins-core',
  gameLabel: 'FFX',
  numeral: 'XVII',
  title: 'Sin: the Fins and the Core',
  subtitle: 'No Rest Between Links', // the pause card's 2-4 word tagline: ours (research §1.2, summarised)
  location: "Deck of the Fahrenheit, then Sin's back — in flight",
  blurb:
    'All of Spira sings the Hymn so Sin will hold still, and the Fahrenheit flies straight at it. One fin, ' +
    'then the other, then the party jumps onto its back, and nothing heals in between.',
  heroArt: 'pause/ch17-sin-fins-core', // D-279, the driver's pick; the fallback shows until it is installed
  heroArtFallback: 'portraits/tidus.png',
  quote: { text: "We've got the ball. Nobody hands it back now.", speaker: 'Tidus' },
  handwritten: 'distance is safety, not damage',
  objectives: [
    { id: 'reach-right-fin', label: 'Tear off the Left Fin', rule: { kind: 'link-reached', link: 2 } },
    { id: 'reach-the-core', label: "Jump onto Sin's back", rule: { kind: 'link-reached', link: 3 } },
    { id: 'destroy-the-core', label: "Destroy Sin's Core", rule: { kind: 'victory' } },
  ],
  tip: 'Close in, Armor Break, pull back. When the core on the fin glows, get the ship out before Gravija lands, if Cid acts first.',
  snapshots: [
    { image: 'backdrops/evrae-airship-deck.png', caption: 'same deck, bigger enemy' },
    { image: 'portraits/cid.png', caption: 'no missiles this time' },
    { image: 'portraits/lulu.png', caption: 'her plan: the Hymn' },
  ],
  focalCharacterId: 'tidus',
  musicKeys: ['scene-fahrenheit', 'boss-evrae', 'victory-ffx'], // stand-ins (THEMES.md, owed: the assault cue)
  bossLine: 'Sin', // the first formation is the Left Fin; the chapter is about Sin
};

/**
 * Chapter XVIII — the Face. Beats: research §9.2 beats 9 to 11. Strategies: §8 rows 8 and 9.
 */
export const SIN_FACE_META: ChapterMeta = {
  id: 'sin-face',
  gameLabel: 'FFX',
  numeral: 'XVIII',
  title: 'Sin: the Face',
  subtitle: 'Before the Mouth Opens', // the pause card's 2-4 word tagline: ours (research §5.4, summarised)
  location: 'Deck of the Fahrenheit — above Bevelle',
  blurb:
    'Sin fell into Bevelle and rose again with wings. The main gun is still broken, so Cid flies the ship ' +
    'straight at its face, and the mouth begins to open.',
  heroArt: 'pause/ch18-sin-face', // D-279, the driver's pick; the fallback shows until it is installed
  heroArtFallback: 'portraits/yuna.png',
  quote: { text: 'He is waiting for you.', speaker: 'Auron' },
  handwritten: 'the mouth is the clock',
  objectives: [
    { id: 'outlast-the-pull', label: 'Ride out the pull', rule: { kind: 'survived-ability', ability: 'overdrive-sin-drawn' } },
    { id: 'half-sin', label: 'Bring Sin below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-sin', label: 'Defeat Sin before the mouth opens', rule: { kind: 'victory' } },
  ],
  tip: 'Wakka and Lulu in and Hastega during the three pulls; Armor Break the moment it is in range; then everything, Overdrives included. Any Ward stops Gaze.',
  snapshots: [
    { image: 'backdrops/bevelle-highbridge.png', caption: 'Bevelle, below the wings' },
    { image: 'backdrops/evrae-airship-deck.png', caption: 'nose to nose with it' },
    { image: 'portraits/auron.png', caption: 'he is waiting' },
  ],
  focalCharacterId: 'tidus',
  musicKeys: ['scene-fahrenheit', 'boss-evrae', 'victory-ffx'], // stand-ins (THEMES.md, owed: the countdown cue, S-21)
};

/** Both, in chapter order, for `./chapter-meta.ts#CHAPTER_META`. */
export const SIN_CHAPTER_META: readonly ChapterMeta[] = [SIN_FINS_CORE_META, SIN_FACE_META];
