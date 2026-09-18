/**
 * The menu register — "menus-clair-obscur".
 *
 * Voices for `title`, `chapter-select` and `pause`: the three cues a player
 * hears most and the three that have to sound like a chamber recital rather
 * than an orchestra. Everything here is small, close and quiet — one player to
 * a part, slow to speak, long to die away.
 *
 * Why these exist when `keys.ts` and `sustained.ts` already have a piano and a
 * string section: a menu is intimate. The section presets stack two or three
 * desks precisely so they sound like a section, which is the wrong answer for
 * a waltz nobody is supposed to notice they have been listening to for six
 * minutes. `string-quartet` is four players; `piano-felt` is the same
 * Salamander with the lid down.
 *
 * STATUS — not yet wired into a cue. Every channel in my three cues names an
 * instrument that also exists in the *synthesised* registry
 * (`src/audio/instruments.ts`), because that registry is the runtime safety net
 * and `getInstrument()` throws on a name it does not know: a cue built on a
 * sampled-only voice goes silent if its MP3 ever fails to decode. These five
 * are ready the moment the synthesised registry grows stand-ins for them —
 * request #1 in `docs/audio/requests-menus-clair-obscur.md`, which is a
 * score-wide blocker, not a menus one. Switching a cue over is one line: the
 * `VOICE` map at the top of each of my track files.
 */

import type { PresetGroup } from './types.ts';

export const menusClairObscurPresets: PresetGroup = {
  'piano-felt': {
    name: 'piano-felt',
    about: 'Salamander with the lid down — the close, dark end of the grand, for a room with one listener in it.',
    seat: 'piano',
    layers: [{ lib: 'salamander', bank: 0, program: 0, gain: 0.82 }],
    // Salamander records sixteen real velocity layers, so a soft note is
    // already a darker recording; tilting it again would smother it.
    velocityTilt: false,
    // Steeper than the concert preset's 1.25: the same written dynamics come
    // out with a wider gap between a whisper and a phrase, which is what a
    // player does when the room is small.
    velocityCurve: 1.55,
    releaseSec: 1.5,
    tailSec: 2.2,
    timingJitterMs: 7,
    gain: 0.78,
  },

  'string-quartet': {
    name: 'string-quartet',
    about: 'Four players, not four desks: two solo violins detuned apart, violas kept quiet underneath, solo cello.',
    seat: 'strings-wide',
    layers: [
      { lib: 'sonatina', name: 'Violin Solo', pan: -0.42, tuneCents: -4 },
      { lib: 'sonatina', name: 'Violin Solo', pan: -0.14, tuneCents: 5, gain: 0.78 },
      { lib: 'sonatina', name: 'Viola Section Sustai', pan: 0.26, gain: 0.34 },
      { lib: 'sonatina', name: 'Cello Solo', pan: 0.46, gain: 0.7 },
    ],
    attackSec: 0.075,
    releaseSec: 0.95,
    tailSec: 1.5,
    // Four players listening to each other are tighter than a section but
    // nothing like a grid — between the section's 22 and a soloist's 8.
    timingJitterMs: 12,
    velocityCurve: 1.5,
    gain: 0.68,
    caveat:
      'The viola line is the Sonatina viola SECTION at low gain — no free library we ship has ' +
      'a solo viola. Three real soloists and one section pretending to be the fourth chair.',
  },

  'soprano-distant': {
    name: 'soprano-distant',
    about: 'One voice at the back of the hall: breathy to speak, long to fade, further away than the choir.',
    seat: 'choir',
    layers: [{ lib: 'sonatina', name: 'Mixed Choir' }],
    // A quarter of a second to speak is a singer taking a breath first. It is
    // also what keeps this from ever sounding like a pad being triggered.
    attackSec: 0.25,
    releaseSec: 1.6,
    tailSec: 2.4,
    timingJitterMs: 10,
    velocityCurve: 1.45,
    gain: 0.5,
    pan: -0.08,
    caveat:
      'Derived from the Sonatina mixed-choir samples like `soprano`, not a solo-soprano ' +
      'recording. Written high and quiet it reads as one distant voice; written low or loud ' +
      'it reads as what it is.',
  },

  'flute-alone': {
    name: 'flute-alone',
    about: 'Solo flute with nothing under it — the four unaccompanied notes at the top of a menu.',
    seat: 'flute',
    // The `flute` preset layers a section under the soloist at 0.35 to give it
    // body in a tutti. Four notes alone in silence want the opposite.
    layers: [{ lib: 'sonatina', name: 'Flute Solo' }],
    attackSec: 0.07,
    releaseSec: 0.55,
    tailSec: 1.1,
    timingJitterMs: 10,
    velocityCurve: 1.5,
    gain: 0.9,
  },

  'harp-close': {
    name: 'harp-close',
    about: 'The harp moved to the front of the platform: drier and more present than the orchestral seat.',
    seat: 'celesta',
    layers: [{ lib: 'sonatina', name: 'Concert Harp' }],
    releaseSec: 1.8,
    tailSec: 2.4,
    velocityCurve: 1.35,
    timingJitterMs: 5,
    gain: 0.88,
    pan: -0.22,
  },
};
