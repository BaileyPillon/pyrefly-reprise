/**
 * Pause-screen and prebattle-tab metadata — **Tourist Trap**, the hidden chapter (`./chapter-ffx2-tourist-trap.ts`; FFX-2 only, Bailey 2026-10-13/14).
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14].
 *
 * - `title`, `subtitle`, `location` and `blurb` are the record's (one premise on the card and the prep).
 * - `numeral` is `EXP` like the other hidden chapters (the board has no card for it; the prep header and the pause screen say so).
 * - `handwritten` and `tip` are our own words over the sourced facts (`research/ffx-yojimbo.md` section 8.2): the count, Zanmato at its end, Kozuka's Poison.
 * - `objectives`: cure the Poison Kozuka leaves, survive Zanmato, defeat Yojimbo.
 * - `heroArt` has no painting of its own yet: the card shows Chapter IX's Yojimbo idle as `heroArtFallback` (PROVISIONAL, the FFX painting reused unchanged).
 * - `snapshots`: the Cavern plate, Yojimbo's idle and Daigoro's idle (all approved art, read only).
 * - `musicKeys`: the field bed, the aeon cue and the fanfare, as the record's.
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { TOURIST_TRAP_ID, TOURIST_TRAP_TEXT } from './chapter-ffx2-tourist-trap.ts';
import { TOURIST_TRAP_PLATE } from './tourist-trap-ids.ts';
import { YOJIMBO_ACTIONS } from './ffx2/enemies/tourist-trap-abilities.ts';

export const TOURIST_TRAP_META: ChapterMeta = {
  id: TOURIST_TRAP_ID,
  gameLabel: 'FFX-2',
  numeral: 'EXP',
  ...TOURIST_TRAP_TEXT,
  heroArt: 'pause/ffx2-tourist-trap', // no painting yet: the fallback below shows
  heroArtFallback: 'characters/yojimbo-cavern/idle.png',
  quote: { text: 'Is the dog okay? Please say the dog is okay.', speaker: 'Rikku' },
  handwritten: 'count with him. heal when it fills',
  objectives: [
    { id: 'cure-the-poison', label: 'Cure the Poison that Kozuka leaves', rule: { kind: 'status-cured', status: 'poison' } },
    { id: 'survive-zanmato', label: 'Survive Zanmato', rule: { kind: 'survived-ability', ability: YOJIMBO_ACTIONS.zanmato } },
    { id: 'defeat-yojimbo', label: 'Defeat Yojimbo', rule: { kind: 'victory' } },
  ],
  tip:
    'Yojimbo keeps a count, and when it is full he takes the whole party down to one HP, about seven attacks in. ' +
    'Keep a heal ready for the turn after, and cure the Poison his Kozuka leaves.',
  snapshots: [
    { image: `backdrops/${TOURIST_TRAP_PLATE}.png`, caption: 'the old chamber' },
    { image: 'characters/yojimbo-cavern/idle.png', caption: 'a swordsman, not himself' },
    { image: 'characters/daigoro/idle.png', caption: 'the dog stays close' },
  ],
  focalCharacterId: 'yuna',
  musicKeys: ['scene-bevelle-underground', 'boss-ffx2-fallen-aeons', 'victory-ffx2'],
};

export default TOURIST_TRAP_META;
