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
import { EXPERIMENT_GROUNDS_PLATE } from '../data/experiment-plates.ts';
import { TOURIST_TRAP_SCENE } from '../data/tourist-trap-ids.ts';
import { GAGAZET_RONSO_SCENE } from '../data/ffx/biran-yenke-ids.ts';
import { MIRROR_AEONS_SCENE } from '../data/ffx/mirror-aeons-ids.ts';
import { LAST_SUMMONING_SCENE } from '../data/ffx/last-summoning-ids.ts';
import { SPECTRAL_KEEPER_SCENE } from '../data/ffx/spectral-keeper-ids.ts';
import { DARK_AEONS_SCENE } from '../data/ffx/dark-aeons-six-ids.ts';
import { PENANCE_SCENE } from '../data/ffx/penance-ids.ts';
import { FLOODED_WAYS_SCENE } from '../data/ffx/flooded-ways-ids.ts';
import { SHINRYU_SCENE } from '../data/ffx/shinryu-ids.ts';
import { SANCTUARY_KEEPER_SCENE } from '../data/ffx/sanctuary-keeper-ids.ts';
import { SPHERIMORPH_SCENE } from '../data/ffx/spherimorph-ids.ts';
import { OMEGA_RUINS_SCENE } from '../data/ffx/omega-ruins-ids.ts';
import { WENDIGO_SCENE } from '../data/ffx/wendigo-ids.ts';
import { BELGEMINE_SCENE } from '../data/ffx/belgemine-ids.ts';
import { GARIK_RONSO_SCENE } from '../data/garik-ronso-ids.ts';
import { OBLITZERATOR_SCENE } from '../data/ffx/oblitzerator-ids.ts';
import { ANGRA_MAINYU_SCENE } from '../data/angra-mainyu-ids.ts';
import { EXP_YRP_SCENE } from '../data/yrp-ids.ts';
import { EXP_WINDWAKER_SCENE } from '../data/windwaker-ids.ts';
import { EXP_ANIME_SCENE } from '../data/anime-ids.ts';

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
  // The experimental Leblanc chapter (FFX-2 only; `scenes/exp-leblanc-last-room.ts`): Chapter VI's room over its own plate, so Chapter VI's row.
  'exp-leblanc-last-room': {
    game: 'ffx2',
    verdict: 'absent',
    cite: `${PRES}, Chateau Leblanc [single source]: "Indoor dust at most. No pyreflies."`,
    treatment: "D-225, as Chapter VI: no glow motes; the warm dust stays",
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
  // Sin's chapters (XVII, XVIII; FFX only): the same deck over Sin's plates (`scenes/evrae-airship-sin.ts`), so the deck's row.
  'sin-fahrenheit-flight': { game: 'ffx', verdict: 'absent', cite: `${PRES}, The airship deck [verified: 2 sources]: "Open sky"` },
  'sin-fahrenheit-bevelle': { game: 'ffx', verdict: 'absent', cite: `${PRES}, The airship deck [verified: 2 sources]: "Open sky"` },
  // The hidden Fayth chapter (FFX only; `scenes/exp-fayth-deck.ts`): Chapter VIII's deck over Chapter VIII's own plate, so the deck's row (the deck itself: research/ffx-evrae-airship.md §12.3).
  'exp-fayth-deck': { game: 'ffx', verdict: 'absent', cite: `${PRES}, The airship deck [verified: 2 sources]: "Open sky"; the deck is Chapter VIII's, research/ffx-evrae-airship.md §12.3` },
  'bevelle-underground': { game: 'ffx2', verdict: 'absent', cite: `${PRES}, Bevelle Underground [single source]: "Machina, not spirits"` },
  'cavern-stolen-fayth': {
    game: 'ffx',
    verdict: 'unattested',
    cite: 'research/ffx-yojimbo.md §6.2 beat 3: pyreflies gather into Lady Ginnem (an event, not the air); nothing on the room',
  },
  'garden-of-pain': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-seymour-omnis.md §7: the arena rows name no particles' },
  'bevelle-highbridge': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-seymour-natus-highbridge.md §7: the arena rows name no particles' },
  'via-purifico': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-isaaru-bevelle.md §7: the arena rows name no particles' },
  // The hidden Sinspawn Gui chapter (FFX only; `scenes/mushroom-rock-road.ts`): no source puts pyreflies in the air of Mushroom Rock Road (a fiend's own death is another matter: the stage's dissolve).
  'mushroom-rock-road': { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-sinspawn-gui.md §7: the arena rows name no ambient particles' },
  // Ixion at Djose (Chapter XVI, FFX-2 only): the Chamber on its stand-in plate (the key is the plate's, `data/ixion-plates.ts`).
  [DJOSE_CHAMBER_PLATE]: { game: 'ffx2', verdict: 'unattested', cite: 'research/ffx2-ixion-djose.md §6.1: the arena rows name no particles' },
  // The Experiment at Djose (the hidden chapter, FFX-2 only): the Fayth Antechamber; the key is its plate's (`data/experiment-plates.ts`).
  [EXPERIMENT_GROUNDS_PLATE]: { game: 'ffx2', verdict: 'unattested', cite: 'research/ffx2-experiment.md §6.1: the arena rows name no particles' },
  // The Tourist Trap (the hidden chapter, FFX-2 only): the Cavern of the Stolen Fayth under the FFX-2 camera.
  [TOURIST_TRAP_SCENE]: { game: 'ffx2', verdict: 'unattested', cite: 'research/ffx-yojimbo.md §8.2: the mission page names no particles in the chamber' },
  // Biran and Yenke (the hidden chapter, FFX only): Chapter I's mountain plate for the Mountain Gate, so the mountain's row: no source puts pyreflies in the air on the trail (the brothers are beaten and lie down, they are not sent).
  [GAGAZET_RONSO_SCENE]: {
    game: 'ffx',
    verdict: 'unattested',
    cite: `${PRES}, Mt. Gagazet [single source]: "No pyreflies are attested on the trail" (an absence, not a contradiction); the brothers' bodies stay (research/re-ffx-biran-yenke.md section 5.1)`,
    treatment: "As Gagazet: snow and glitter, nothing added; the brothers lie down and stay (`BattlePresenterDepartures.ts`), they do not dissolve",
  },
  // Mirror Aeons (the hidden chapter, FFX only): Mushroom Rock Road, then the Cavern's plate under a white pulse; no source puts pyreflies in the air of either (Mushroom Rock Road's own row, the Cavern's: research/ffx-yojimbo.md section 6).
  [MIRROR_AEONS_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-mirror-aeons.md section 2 and 3: the guides name no ambient particles on the road or in the cavern; the fiends are summoned aeons and leave as the stage dissolves them' },
  // The Last Summoning (the hidden chapter, FFX only): Dream's End as Chapter III builds it, so Dream's End's row.
  [LAST_SUMMONING_SCENE]: { game: 'ffx', verdict: 'attested', cite: `${PRES}, Dream's End [verified: 2 sources]` },
  // The Dark Aeons (the hidden chapter, FFX only): seven existing plates under one stage; the guides name no ambient particles for these places and the aeons leave as the stage dissolves them.
  [DARK_AEONS_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/re-ffx-dark-aeons-six.md section 2.4 and 9: the guides name where each Dark Aeon stands and no ambient particles; the aeons are summoned shapes and leave as the stage dissolves them' },
  // The Sanctuary Keeper (the hidden chapter, FFX only; `scenes/sanctuary-keeper.ts`): Chapter I's Mt. Gagazet plate and scene, so the mountain's row.
  [SANCTUARY_KEEPER_SCENE]: { game: 'ffx', verdict: 'unattested', cite: `${PRES}, Mt. Gagazet [single source]: "No pyreflies are attested on the trail" (an absence, not a contradiction); the stage is Chapter I's`, treatment: "As Gagazet: snow and glitter, nothing added" },
  // Garik Ronso (the hidden chapter, FFX-2 only; `scenes/gagazet-summit.ts`): Chapter I's Mt. Gagazet plate under a snow grade of its own, so the mountain's row; no FFX-2 note names particles at the summit (`research/re-ffx2-garik-ronso.md`).
  [GARIK_RONSO_SCENE]: { game: 'ffx2', verdict: 'unattested', cite: `${PRES}, Mt. Gagazet [single source]: "No pyreflies are attested on the trail" (an absence, not a contradiction); the stage borrows Chapter I's plate (research/re-ffx2-garik-ronso.md)`, treatment: 'As Gagazet: snow and glitter, nothing added' },
  // The Spectral Keeper (the hidden chapter, FFX only): the Zanarkand Dome as Chapter II builds it, so the Dome's row.
  [SPECTRAL_KEEPER_SCENE]: { game: 'ffx', verdict: 'attested', cite: `${PRES}, Zanarkand Dome [verified: 2 sources]` },
  // Penance (the hidden chapter, FFX only; `scenes/penance.ts`): Chapter VIII's deck over Chapter VIII's own plate, so the deck's row.
  [PENANCE_SCENE]: { game: 'ffx', verdict: 'absent', cite: `${PRES}, The airship deck [verified: 2 sources]: "Open sky"; the deck is Chapter VIII's, research/ffx-evrae-airship.md §12.3` },
  // The Flooded Ways (the hidden chapter, FFX only): the Via Purifico's plate under a chapter-owned stage; the guides name no ambient particles for the flooded tunnels or the Baaj Temple.
  [FLOODED_WAYS_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/re-ffx-geosgaeno-evrae-altana.md sections 2 and 9: the guides name water and no ambient particles; the plate stands in for four places' },
  // Spherimorph (the hidden chapter, FFX only; `scenes/spherimorph.ts`): the fight is at the spring in the Macalania Woods, whose springs are pyrefly-lit; the stage is the Temple's plate standing in, whose Chamber-door motes stay held.
  [SPHERIMORPH_SCENE]: { game: 'ffx', verdict: 'attested', cite: `${PRES}, Macalania Woods [single source]: "springs infused with pyreflies"; the stage is the Temple's plate (a stand-in), so no motes are added` },
  // The Omega Ruins (the hidden chapter, FFX only; `scenes/omega-ruins.ts`): the Cavern of the Stolen Fayth's plate and scene, so the Cavern's row; no source names particles in the Ruins (research/re-ffx-omega-ultima-nemesis.md section 2).
  [OMEGA_RUINS_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-yojimbo.md §6.2 beat 3 (the Cavern, whose plate the Ruins stand on): nothing on the room; research/re-ffx-omega-ultima-nemesis.md §2: the formations name no particles', treatment: 'As the Cavern: cold light and mist, nothing added; the guardians go dark where they stood' },
  // Wendigo (the hidden chapter, FFX only; `scenes/wendigo-lake.ts`): Chapter VII's Macalania Temple stage standing in for frozen Lake Macalania; no source was read for the lake itself, so the lake is unattested and the stage keeps the Temple's own treatment.
  [WENDIGO_SCENE]: { game: 'ffx', verdict: 'unattested', cite: `${PRES}, Lake Macalania [no source read]: the stage is Chapter VII's Macalania Temple`, treatment: 'As the Temple: ice glitter, the Chamber-door motes held, nothing added' },
  // Belgemine's Challenge (the hidden chapter, FFX only; `scenes/belgemine.ts`): the Remiem court has no plate; the stage is the Cavern of the Stolen Fayth's plate on the Mushroom Rock Road stage, so the Cavern's row (no source names particles at Remiem: research/re-ffx-belgemine-aeon-duels.md).
  [BELGEMINE_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/ffx-yojimbo.md §6.2 beat 3 (the Cavern, whose plate the Remiem court stands on): nothing on the room; research/re-ffx-belgemine-aeon-duels.md: the formations name no particles', treatment: 'As the Cavern: cold light and mist, nothing added' },
  // Shinryu (the hidden chapter, FFX only; `scenes/shinryu.ts`): the Via Purifico's stage on the submerged plate, standing in for the Monster Arena's sea stage; the guides name an underwater arena and no ambient particles.
  [SHINRYU_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/re-ffx-shinryu.md sections 1 and 5: the guides name an underwater arena and no ambient particles; the Flooded Ways plate stands in for the game\'s sea stage' },
  // The Oblitzerator (the hidden chapter, FFX only; `scenes/luca-dock.ts`): the fight is on the Luca dock; no source read names pyreflies on the dock, and the stage is the Mushroom Rock Road's plate standing in.
  [OBLITZERATOR_SCENE]: { game: 'ffx', verdict: 'unattested', cite: 'research/re-ffx-oblitzerator-crane.md section 2: the formation names no particles; the stage is the Mushroom Rock Road (a stand-in) and no dock plate exists', treatment: 'As the coast road: nothing added' },
  // The 3D Bahamut (the hidden chapter, FFX-2 only; `scenes/exp-yrp-3d-stage.ts`): Chapter IV's chamber, so the Bevelle underground's row.
  [EXP_YRP_SCENE]: { game: 'ffx2', verdict: 'absent', cite: `${PRES}, Bevelle Underground [single source]: "Machina, not spirits"; the chamber is Chapter IV's` },
  // Valefor at Besaid in Wind Waker style (the hidden chapter, FFX-2 only; `scenes/exp-windwaker-stage.ts`): hidden chapter 24's fight, so its row (the Djose chamber's stand-in for Besaid's); the temple is a stand-in.
  [EXP_WINDWAKER_SCENE]: { game: 'ffx2', verdict: 'unattested', cite: "research/ffx2-ixion-djose.md §6.1 (the chamber the chapter 24 fight stands in): the arena rows name no particles; no source describes Besaid's chamber" },
  // Valefor at Besaid in an anime style (the hidden chapter, FFX-2 only; `scenes/exp-anime-stage.ts`): hidden chapter 24's fight on the Wind Waker chapter's stand-in temple, so the same row.
  [EXP_ANIME_SCENE]: { game: 'ffx2', verdict: 'unattested', cite: "research/ffx2-ixion-djose.md §6.1 (the chamber the chapter 24 fight stands in): the arena rows name no particles; no source describes Besaid's chamber" },
  // Angra Mainyu (the hidden chapter, FFX-2 only): the Bikanel Desert.
  [ANGRA_MAINYU_SCENE]: { game: 'ffx2', verdict: 'unattested', cite: 'research/ffx2-angra-mainyu.md §1: no source names particles in the desert fight' },
  // FF7 only (the hidden Guard Scorpion experiment): pyreflies are Spira's, so the stage adds neither the band nor the dissolve.
  'sector1-reactor': {
    game: 'ff7',
    verdict: 'absent',
    cite: `research/ffx-vs-ffx2-presentation.md §3.1: pyreflies are Spira's (the life of its fiends and unsent); FF7 is not set in Spira, so nothing attests them in the No. 1 Reactor [derived]`,
    treatment: 'FF7: no lens band and no pyrefly dissolve; the beaten boss keeps the house plain dissolve it had before A-5',
  },
  // FF7 only (the hidden Jenova LIFE chapter, the altar of the Forgotten Capital): the same reason as the reactor's row.
  'forgotten-capital': {
    game: 'ff7',
    verdict: 'absent',
    cite: `research/ffx-vs-ffx2-presentation.md §3.1: pyreflies are Spira's; FF7 is not set in Spira, so nothing attests them at the altar of the Forgotten Capital [derived]`,
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
