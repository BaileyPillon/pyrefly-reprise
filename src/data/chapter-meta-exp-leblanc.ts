/**
 * Pause-screen and prebattle-tab metadata — **Experimental: Leblanc (new art)**, the Leblanc preview
 * (`./chapter-exp-leblanc.ts`; FFX-2 only, Bailey 2026-10-06).
 *
 * Chapter VI's record with the preview's name: the objectives, the tip, the quote and the music keys are Chapter VI's
 * (`./chapter-meta-ffx2-leblanc.ts`), because the encounter is. The paintings are the preview's own, from its art namespace
 * (`./art/artNamespace.ts`): the hero plate is `pause/exp-leblanc-leblanc` (the CHAPTER tab, the party-prep chapter panel), its fallback the
 * namespace's `portraits/exp-leblanc-leblanc.png`, and the three journal snapshots are the preview's own plate and the idles of Leblanc and Ormi
 * (`characters/exp-leblanc-<id>/idle.png`), in the same order and with Chapter VI's captions. The numeral is `EXP` (the card, the cutscene eyebrow
 * and the prep header say so too).
 */

import type { ChapterMeta } from './chapter-meta.ts';
import { FFX2_LEBLANC_META } from './chapter-meta-ffx2-leblanc.ts';
import { EXP_LEBLANC_ID, EXP_LEBLANC_TEXT } from './chapter-exp-leblanc.ts';
import { EXP_LEBLANC_SCENE, inArtNamespace } from './art/artNamespace.ts';

/** Chapter VI's snapshot, as the preview's own painting: its backdrop is the preview's plate, a character is its namespaced idle. */
type Snapshot = ChapterMeta['snapshots'][number];
function ownSnapshot(snap: Snapshot): Snapshot {
  if (snap.image === 'backdrops/leblanc-last-room.png') return { ...snap, image: `backdrops/${EXP_LEBLANC_SCENE}.png` };
  const [dir, id, file, ...more] = snap.image.split('/');
  if (dir === 'characters' && id && file === 'idle.png' && more.length === 0) return { ...snap, image: `characters/${inArtNamespace('exp-leblanc', id)}/idle.png` };
  return snap;
}

const [SNAP_PLATE, SNAP_LEBLANC, SNAP_ORMI] = FFX2_LEBLANC_META.snapshots;

export const EXP_LEBLANC_META: ChapterMeta = {
  ...FFX2_LEBLANC_META,
  id: EXP_LEBLANC_ID,
  numeral: 'EXP',
  ...EXP_LEBLANC_TEXT,
  heroArt: `pause/${inArtNamespace('exp-leblanc', 'leblanc')}`,
  heroArtFallback: `portraits/${inArtNamespace('exp-leblanc', 'leblanc')}.png`,
  snapshots: [ownSnapshot(SNAP_PLATE), ownSnapshot(SNAP_LEBLANC), ownSnapshot(SNAP_ORMI)], // Chapter VI's three, one for one
};
