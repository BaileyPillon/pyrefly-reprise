/**
 * Pause-screen and prebattle-tab metadata — Chapter IX, Yojimbo, in the
 * Cavern of the Stolen Fayth (FFX) [research/ffx-yojimbo.md].
 *
 * **Game case: FFX only** [AGENTS.md rule 14]. Lady Ginnem's Yojimbo (D-049),
 * a CTB fight with aeons, an enemy Overdrive gauge and Ronso Rage Doom.
 * Nothing here is true of the FFX-2 Yojimbo.
 *
 * - `title` "Yojimbo" and `location` "Cavern of the Stolen Fayth": B5, D-053.
 * - `subtitle`, `blurb`, `handwritten` and `tip` are our own words over the
 *   research's sourced facts (§6.2 beats 3-4; §2.1 Defense 80 / Magic
 *   Defense 0; §4.1 the gauge rises when he is targeted).
 * - `quote` is line 18 of `docs/plans/yojimbo-story-draft.md`, an `[ORIGINAL]`
 *   line in Lulu's voice (writing-bible §1.6), and the line the pre scene
 *   (`src/story/scripts/yojimbo-cavern.ts`) actually plays.
 * - `heroArt` is the installed hero plate B, drawing Zanmato (D-074):
 *   `public/art/pause/ch9-yojimbo.png`. `heroArtFallback` is Lulu's portrait,
 *   the chapter's focal character (research §5.2: the fight is hers).
 * - `snapshots` are the locked art: the Cavern backdrop (O-4 A, D-061), the
 *   Yojimbo cast with the longer blade (D-132) and Lady Ginnem's pyrefly-edged
 *   idle (O-3 B, D-060).
 * - `objectives` follow the research's sourced strategies (§5.3): Doom him
 *   (strategy 1), let an aeon take Zanmato (strategy 3), and the win. The
 *   choice of these three rows is **ours** (the plan names none); each rule is
 *   one the evaluator in `src/ui/common/chapterObjectives.ts` already answers.
 * - `musicKeys` are the cues the chapter plays: `scene-gagazet` (the stand-in
 *   under the walk in, the Chapter VII precedent), `boss-yojimbo` (O-6 A,
 *   D-063; from Ginnem's appearance through the battle, research §6.4) and
 *   the shared `victory-ffx` fanfare.
 *
 * **Listed** 2026-09-24 with the chapter itself: it sits in `./chapter-meta.ts`'s
 * `CHAPTER_META`, after Chapter VIII's record (it was in `UNLISTED_CHAPTER_META`
 * while the chapter was registered but unlisted).
 */

import type { ChapterMeta } from './chapter-meta.ts';

/** Chapter IX — Yojimbo, the last chamber of the Cavern of the Stolen Fayth. */
export const YOJIMBO_META: ChapterMeta = {
  id: 'yojimbo-cavern',
  gameLabel: 'FFX',
  numeral: 'IX',
  title: 'Yojimbo',
  subtitle: "A Guardian's Last Duty",
  location: 'Cavern of the Stolen Fayth',
  blurb:
    'Lulu guarded one summoner before Yuna, and that summoner died in this cave without ever being sent. ' +
    'Her aeon still answers her, and every blow it takes brings its killing stroke closer.',
  heroArt: 'pause/ch9-yojimbo',
  heroArtFallback: 'portraits/lulu.png',
  quote: {
    text: 'I still owe her a guardian.',
    speaker: 'Lulu',
  },
  handwritten: 'every hit feeds his blade',
  objectives: [
    {
      // Strategy 1 [§5.3, verified: 4 sources]: Kimahri's Ronso Rage Doom,
      // count 5 [§2.1]. Ticks once the Rage resolves with the party standing.
      id: 'doom-yojimbo',
      label: 'Doom Yojimbo',
      rule: { kind: 'survived-ability', ability: 'doom' },
    },
    {
      // Strategy 3 [§5.3, verified: 2 sources]: 9,999 to everyone [§3.1]
      // is survivable only with an aeon in front of it [§3.3].
      id: 'survive-zanmato',
      label: 'Survive Zanmato',
      rule: { kind: 'survived-ability', ability: 'yojimbo-zanmato' },
    },
    {
      id: 'defeat-yojimbo',
      label: 'Defeat Yojimbo',
      rule: { kind: 'victory' },
    },
  ],
  tip: 'Spells land at full strength and swords at about half. Every action that targets him fills his gauge, so hit him hard and rarely.',
  snapshots: [
    { image: 'backdrops/cavern-stolen-fayth.png', caption: 'the last chamber, cold light' },
    { image: 'characters/yojimbo-cavern/cast.png', caption: 'the long blade, drawn' },
    { image: 'characters/ginnem/idle.png', caption: 'Lady Ginnem, never sent' },
  ],
  focalCharacterId: 'lulu',
  musicKeys: ['scene-gagazet', 'boss-yojimbo', 'victory-ffx'],
};

export default YOJIMBO_META;
