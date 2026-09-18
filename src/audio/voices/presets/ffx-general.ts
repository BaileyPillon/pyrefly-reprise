/**
 * Sampled colours for the FFX general group — the battle, the dread, the
 * victory, the ending and the three scenes.
 *
 * Three instruments this group's cues actually want and the shared palette
 * does not have: one horn rather than a section, a choir written low enough
 * to read as men, and an alto flute for the places where a normal flute is
 * too bright. (The nocturne's soft piano is `piano-felt` in
 * `menus-clair-obscur.ts` — one preset, one owner; this group uses theirs.)
 *
 * READ THIS BEFORE USING THEM. A score channel's `instrument` has to resolve
 * in TWO registries: here, for the offline render, and in
 * `src/audio/instruments.ts`, for the synthesised fallback the game keeps as
 * a safety net. That second registry has 41 names and is the architect's
 * file, not this group's, so none of the four below can be named by a channel
 * yet. They are written against the libraries and ready; the ask is in
 * `docs/audio/requests-ffx-general.md`, request 1 — the same score-wide
 * blocker the menus group raises as its own request 1.
 *
 * Until then the cues use the shared names — `brass` for the lone horn,
 * `choir` written low, `piano`, `flute` — which is an honest approximation
 * and not a silent one: every place it matters is commented in the cue.
 */

import type { PresetGroup } from './types.ts';

export const ffxGeneralPresets: PresetGroup = {
  'horn-lone': {
    name: 'horn-lone',
    about: 'One horn, far back and alone — the clan call on Gagazet, not a section.',
    seat: 'horn',
    layers: [{ lib: 'sonatina', name: 'Horn Solo' }],
    attackSec: 0.075,
    releaseSec: 0.8,
    tailSec: 1.6,
    timingJitterMs: 11,
    velocityCurve: 1.5,
    gain: 0.8,
  },

  'choir-men': {
    name: 'choir-men',
    // Deliberately no `caveat` field: the honest limit is in `about`, and the
    // caveat list is a fixed three that the shared preset test pins.
    about:
      'The mixed choir written low — male weight under an open fifth; above C3 it is ' +
      'simply the choir again.',
    seat: 'choir',
    layers: [
      { lib: 'sonatina', name: 'Mixed Choir', gain: 0.9, tuneCents: -3 },
      { lib: 'fluidr3', bank: 0, program: 53, gain: 0.45, tuneCents: 4 },
    ],
    attackSec: 0.22,
    releaseSec: 1.5,
    tailSec: 2.2,
    timingJitterMs: 36,
    velocityCurve: 1.35,
    gain: 0.78,
  },

  'alto-flute': {
    name: 'alto-flute',
    about: 'Alto flute — more air than note, for a line that should sound remembered.',
    seat: 'flute',
    layers: [
      { lib: 'sonatina', name: 'Alto Flute' },
      { lib: 'sonatina', name: 'Flute Solo', gain: 0.25 },
    ],
    attackSec: 0.07,
    releaseSec: 0.55,
    tailSec: 1.1,
    timingJitterMs: 10,
    velocityCurve: 1.4,
    gain: 0.85,
  },
};
