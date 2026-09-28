/**
 * Pause-screen and prebattle-tab metadata — Chapter XVI, Ixion at Djose (FFX-2), the Chapter 3 finale
 * [research/ffx2-ixion-djose.md].
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. ATB, dresspheres, the fallen aeons' action counter; nothing here
 * is true of an FFX chapter (the FFX Ixion shares a name and two move names, §0).
 *
 * - `title`, `location` and `blurb` are the record's (FOC19-06: one premise on the card and the prep).
 *   `subtitle` is the pause card's 2-4 word tagline, "Where the Fayth Stood": ours (inferred, not Bailey's).
 * - `handwritten` and `tip` are our own words over the research's sourced facts: the loop and the counter
 *   (§4.2, `[verified: 2 sources]`), Recharge then Thor's Hammer (`[verified: 3 sources]`), Shell before the Hammer
 *   (§4.5, `[verified: 2 sources]`), absorbs Lightning, weak to Water (§3.1, `[verified: 4 sources]`).
 * - `quote` is Rikku's opening line, quoted by the research (§7.3, `[verified: 2 sources]`), which the pre scene
 *   plays (`src/story/scripts/ffx2-ixion-djose.ts`).
 * - `objectives`: survive Thor's Hammer (the lesson), bring him under half, the win.
 * - `heroArt`: no hero plate is painted for this chapter (a painting round, rule 9), so the card shows a
 *   **stand-in** composite (`pause/ch16-ffx2-ixion-djose-standin`, PROVISIONAL, not approved: Ixion's look B idle
 *   over the Chamber stand-in, no GPU, `docs/concepts/chapters/ixion-djose-2026-09-27/stand-ins/make_hero_standin.py`).
 *   `heroArtFallback` is Ixion's look B idle (D-268, approved `bailey:2026-09-27-ixion`).
 * - `snapshots`: the Chamber's stand-in plate (`./ixion-plates.ts`, PROVISIONAL, not approved), Ixion's cast pose
 *   (the Recharge glow, locked with look B) and Rikku's FFX-2 portrait (approved).
 * - `musicKeys`: the field bed, the house aeon cue ("Aeons", §6.3), the FFX-2 fanfare.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FFX2_IXION_DJOSE } from './chapter-ffx2-ixion-djose.ts';
import { DJOSE_CHAMBER_PLATE } from './ixion-plates.ts';

export const IXION_DJOSE_META: ChapterMeta = {
  id: 'ffx2-ixion-djose',
  gameLabel: 'FFX-2',
  numeral: 'XVI',
  title: FFX2_IXION_DJOSE.title,
  subtitle: 'Where the Fayth Stood',
  location: FFX2_IXION_DJOSE.location,
  blurb: FFX2_IXION_DJOSE.blurb,
  heroArt: 'pause/ch16-ffx2-ixion-djose-standin', // STAND-IN, see the header
  heroArtFallback: 'characters/x2-ixion/idle.png',
  quote: { text: "This can't be happening.", speaker: 'Rikku' },
  handwritten: 'recharge means the hammer is next',
  objectives: [
    { id: 'survive-thors-hammer', label: "Survive Thor's Hammer", rule: { kind: 'survived-ability', ability: 'thors-hammer' } },
    { id: 'ixion-below-half', label: 'Bring Ixion below half', rule: { kind: 'boss-hp-below', fraction: 0.5 } },
    { id: 'defeat-ixion', label: 'Defeat Ixion', rule: { kind: 'victory' } },
  ],
  tip:
    "Every blow fills a hidden count. When he casts Recharge, Thor's Hammer is next: put Shell up and heal. " +
    'Lightning heals him; Water hurts him.',
  snapshots: [
    { image: `backdrops/${DJOSE_CHAMBER_PLATE}.png`, caption: 'where the fayth stood' },
    { image: 'characters/x2-ixion/cast.png', caption: 'the horn lights: Recharge' },
    { image: 'portraits/rikku-x2.png', caption: "this can't be happening" },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-aeon', 'victory-ffx2'],
};

export default IXION_DJOSE_META;
