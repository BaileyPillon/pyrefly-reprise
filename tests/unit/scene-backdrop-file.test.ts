/**
 * LIVE-R50-01 (FFX only, Chapter XXVII; r51): nothing asks for `art/backdrops/mirror-aeons.png`, a file that does not exist.
 *
 * By convention a chapter's scene key is its backdrop's name, and the board, the party prep, the cutscene stage, the battle's start card, the pause tab and the preload all build `art/backdrops/<sceneKey>.png` from it.
 * Mirror Aeons' scene `mirror-aeons` is one stage built from Mushroom Rock Road's plates (Act II swaps in the Cavern's), so it is a code key with no file of its own and every one of those requests answered 404 on the
 * live host. `artNamespace.ts#SCENE_BACKDROP_FILE` now names the plate it draws (the road) and each of those sites reads it. This file pins the record and, where the art is on this disk, that every chapter's
 * backdrop file exists.
 */

import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { plateUrlFor } from '../../src/app/screens/battlePreload.ts';
import { backdropFileOf, SCENE_BACKDROP_FILE } from '../../src/data/art/artNamespace.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../src/data/encounters.ts';
import { MIRROR_ACT_I_PLATE, MIRROR_AEONS_SCENE } from '../../src/data/ffx/mirror-aeons-ids.ts';
import { SPECTRAL_KEEPER_SCENE } from '../../src/data/ffx/spectral-keeper-ids.ts';
import { SPHERIMORPH_SCENE } from '../../src/data/ffx/spherimorph-ids.ts';
import { EXP_YRP_SCENE } from '../../src/data/yrp-ids.ts';
import { DJOSE_CHAMBER_PLATE } from '../../src/data/ixion-plates.ts';
import { EXP_WINDWAKER_SCENE } from '../../src/data/windwaker-ids.ts';

const BACKDROPS = new URL('../../public/art/backdrops/', import.meta.url);

describe('a scene key that is a code key names the backdrop file it draws', () => {
  it('Mirror Aeons draws Mushroom Rock Road\'s plate; every other scene key is its own file name', () => {
    expect(backdropFileOf(MIRROR_AEONS_SCENE)).toBe('mushroom-rock-road');
    expect(MIRROR_ACT_I_PLATE).toBe('mushroom-rock-road');
    expect(backdropFileOf('gagazet')).toBe('gagazet');
    expect(backdropFileOf(undefined)).toBeUndefined();
    expect(backdropFileOf('constructor')).toBe('constructor'); // a key on Object.prototype is not an entry
    expect(backdropFileOf(SPECTRAL_KEEPER_SCENE)).toBe('zanarkand-dome'); // the hidden Spectral Keeper's stage draws Chapter II's Dome plate
    expect(backdropFileOf(SPHERIMORPH_SCENE)).toBe('macalania-temple'); // the hidden Spherimorph's stage draws the Macalania Temple's plate (ch-spherimorph, 2026-11-06)
    expect(Object.keys(SCENE_BACKDROP_FILE)).toEqual([MIRROR_AEONS_SCENE, SPECTRAL_KEEPER_SCENE, SPHERIMORPH_SCENE, EXP_YRP_SCENE, EXP_WINDWAKER_SCENE]);
    expect(backdropFileOf(EXP_YRP_SCENE)).toBe('bevelle-underground'); // the hidden 3D Bahamut is drawn over Chapter IV's own plate (ch-yrp)
    // the hidden Wind Waker chapter (FFX-2 only, Chapter 32) is the second code key: its stage is 3D with no plate of its own, and the board, the prep wash and the cutscenes show hidden chapter 24's (the Djose chamber's)
    expect(backdropFileOf(EXP_WINDWAKER_SCENE)).toBe(DJOSE_CHAMBER_PLATE);
  });

  it('the battle preload warms the plate the stage opens on, not backdrops/mirror-aeons.png', () => {
    expect(plateUrlFor(MIRROR_AEONS_SCENE)).toMatch(/art\/backdrops\/mushroom-rock-road\.png$/);
    expect(plateUrlFor(MIRROR_AEONS_SCENE)).not.toMatch(/mirror-aeons/);
  });

  it.skipIf(!existsSync(BACKDROPS))('every chapter\'s backdrop file is there (the local art)', () => {
    for (const c of [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].filter((x) => x.game !== 'ff7')) { // FF7's plate has its own path (`battlePreload.ts#SCENE_PLATES`)
      const file = backdropFileOf(c.sceneKey);
      expect(existsSync(new URL(`${file}.png`, BACKDROPS)), `${c.id}: art/backdrops/${file}.png`).toBe(true);
    }
  });
});
