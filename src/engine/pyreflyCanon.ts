/**
 * Where pyreflies belong, from the sources: who comes apart into them when
 * beaten (A-5), and which arenas have them in the air (A-6, with D-225's
 * three rows). "Pyreflies are not atmosphere, they are a statement about the
 * dead. Putting them in a room where canon does not put them is a lore error,
 * not a mood choice" (`research/ffx-vs-ffx2-presentation.md` §8).
 *
 * Game case, per row: each location row is its own game's (FFX or FFX-2, as
 * tagged); the dissolve rule is the same in both games (the departures table
 * in that file, row "Unsent": "Same", [verified: 2 sources]).
 *
 * Pure: no `three`, no DOM. Read by the stage (`PyreflyStage.ts`); no scene
 * reads it, and a scene's own motes stay the scene's.
 */

import type { CombatantId } from '../battle/common/types.ts';
import { departureKindOf } from './BattlePresenterDepartures.ts';
import { DJOSE_CHAMBER_PLATE } from '../data/ixion-plates.ts';

/**
 * People, who die as people: the presentation plan's A-5 row ("Humans
 * (Leblanc, Logos, Ormi, Isaaru, the goons) never dissolve"). Leblanc, Logos
 * and Ormi already yield (D-035, `BattlePresenterDepartures.ts`); Isaaru is
 * never a combatant (his aeons are). The goons keep today's plain dissolve,
 * because D-035 names only the three, but never release pyreflies.
 */
export const NEVER_PYREFLIES: ReadonlySet<CombatantId> = new Set(['dr-goon', 'fem-goon']);

/**
 * True when a beaten enemy comes apart into pyreflies (the approved tile
 * "Dissolved into pyreflies, not faded out"): only the `'dissolve'`
 * departures, and never a person.
 */
export function pyreflyDissolves(id: CombatantId): boolean {
  return departureKindOf(id) === 'dissolve' && !NEVER_PYREFLIES.has(id);
}

/**
 * What the sources say about pyreflies in a location's air.
 * - `attested`: canon puts them there; the stage adds the faint lens band.
 * - `absent`: canon puts none there (the scene draws none, or holds them for a beat).
 * - `unattested`: no source says either way; nothing is added and today's scene stays as it is.
 */
export type PyreflyVerdict = 'attested' | 'absent' | 'unattested';

export interface PyreflyCanonRow {
  game: 'ffx' | 'ffx2' | 'ff7';
  verdict: PyreflyVerdict;
  /** Where the verdict comes from (a research file and section, and its confidence tag). */
  cite: string;
  /** What the scene does about it, when that is more than "nothing added". */
  treatment?: string;
}

const PRES = 'research/ffx-vs-ffx2-presentation.md §8';

/** One row per registered scene key (`src/scenes/index.ts`). */
export const PYREFLY_CANON: Readonly<Record<string, PyreflyCanonRow>> = Object.freeze({
  'zanarkand-dome': { game: 'ffx', verdict: 'attested', cite: `${PRES}, Zanarkand Dome [verified: 2 sources]` },
  'dreams-end': { game: 'ffx', verdict: 'attested', cite: `${PRES}, Dream's End [verified: 2 sources]` },
  farplane: { game: 'ffx2', verdict: 'attested', cite: `${PRES}, The Farplane [verified: 2 sources]` },
  'road-to-the-farplane': {
    game: 'ffx2',
    verdict: 'attested',
    cite: `${PRES}, The Farplane [verified: 2 sources]; the Road is its approach (research/ffx2-fallen-aeons.md §1.2 item 5)`,
  },
  'via-infinito': {
    game: 'ffx2',
    verdict: 'attested',
    cite: 'research/ffx2-trema.md §6.1: "Pyreflies and Yevon flags are everywhere" [single source: Blackestmage]',
  },
  'den-of-woe': {
    game: 'ffx2',
    verdict: 'attested',
    cite: 'research/ffx2-gippal-den-of-woe.md §6.1: "A pyrefly-filled cave" [single source: GamerGuides]',
  },
  // D-225 (Bailey, 2026-09-26): the three rows the sources settle.
  'macalania-temple': {
    game: 'ffx',
    verdict: 'absent',
    cite: `${PRES}, Macalania Temple [verified: 2 sources]; §8.1 "Save pyreflies for the moment Seymour dies"`,
    treatment: "D-225: the Chamber-door motes are held until Seymour's death (`HELD_PYREFLIES`)",
  },
  'leblanc-last-room': {
    game: 'ffx2',
    verdict: 'absent',
    cite: `${PRES}, Chateau Leblanc [single source]: "Indoor dust at most. No pyreflies."`,
    treatment: "D-225: the magenta and cyan glow motes are removed; the warm dust stays",
  },
  gagazet: {
    game: 'ffx',
    verdict: 'unattested',
    cite: `${PRES}, Mt. Gagazet [single source]: "No pyreflies are attested on the trail" (an absence, not a contradiction)`,
    treatment: "D-225: snow and glitter, nothing added; today's scene is unchanged",
  },
  demo: {
    game: 'ffx',
    verdict: 'unattested',
    cite: `${PRES}, Mt. Gagazet (the demo draws the Gagazet diorama)`,
    treatment: 'As Gagazet',
  },
  'evrae-airship-deck': { game: 'ffx', verdict: 'absent', cite: `${PRES}, The airship deck [verified: 2 sources]: "Open sky"` },
  'bevelle-underground': { game: 'ffx2', verdict: 'absent', cite: `${PRES}, Bevelle Underground [single source]: "Machina, not spirits"` },
  'cavern-stolen-fayth': {
    game: 'ffx',
    verdict: 'unattested',
    cite: 'research/ffx-yojimbo.md §6.2 beat 3: pyreflies gather into Lady Ginnem (an event, not the air); nothing on the room',
  },
  'garden-of-pain': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-seymour-omnis.md §7: the arena rows name no particles' },
  'bevelle-highbridge': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-seymour-natus-highbridge.md §7: the arena rows name no particles' },
  'via-purifico': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-isaaru-bevelle.md §7: the arena rows name no particles' },
  // Ixion at Djose (Chapter XVI, FFX-2 only): the Chamber on its stand-in plate (the key is the plate's, `data/ixion-plates.ts`).
  [DJOSE_CHAMBER_PLATE]: { game: 'ffx2', verdict: 'unattested', cite: 'research/ffx2-ixion-djose.md §6.1: the arena rows name no particles' },
  // FF7 only (the hidden Guard Scorpion experiment): pyreflies are Spira's, so the stage adds neither the band nor the dissolve.
  'sector1-reactor': {
    game: 'ff7',
    verdict: 'absent',
    cite: `research/ffx-vs-ffx2-presentation.md §3.1: pyreflies are Spira's (the life of its fiends and unsent); FF7 is not set in Spira, so nothing attests them in the No. 1 Reactor [derived]`,
    treatment: 'FF7: no lens band and no pyrefly dissolve; the beaten boss keeps the house plain dissolve it had before A-5',
  },
});

/** The row for a scene key, or undefined for a key the table does not know. */
export function pyreflyCanonFor(sceneKey: string | undefined): PyreflyCanonRow | undefined {
  return sceneKey && Object.hasOwn(PYREFLY_CANON, sceneKey) ? PYREFLY_CANON[sceneKey] : undefined;
}

/**
 * Motes a scene holds hidden until a beat, by the name its particle field
 * carries (`Object3D.name`), with the combatant whose departure releases them.
 * D-225: Macalania's Chamber-door motes wait for Seymour's death.
 */
export const HELD_PYREFLIES: Readonly<Record<string, CombatantId>> = Object.freeze({
  'pyreflies:after-seymour-macalania': 'seymour-macalania',
});

/**
 * The approved atmosphere tile's budget (docs/concepts/polish/pyrefly-atmosphere
 * card: "38 far, 22 mid, 7 on the lens"). Every attested scene already draws its
 * own far and mid bands, so the stage adds only the lens band.
 */
export const LENS_BAND_COUNT = 7;
