import type { SceneBuild, SceneBuildOptions, SceneFactory } from './types.ts';
import type { SceneSlots, Spot } from './index.ts';
import { ZANARKAND_DOME_SLOTS, buildZanarkandDomeScene } from './zanarkand-dome.ts';
import { GAUNTLET_CREATURES, ULTIMA_BUSTER_ARM_LEFT_ID, ULTIMA_BUSTER_ARM_RIGHT_ID, ULTIMA_BUSTER_HEAD_ID, type GauntletCombatantId } from '../data/ffx/gauntlet-ids.ts';

// ---------------------------------------------------------------------------
// The Gauntlet (FFX): the hidden chapter's one stage, the Zanarkand Dome's, standing in for the Monster Arena of the Calm Lands
// ---------------------------------------------------------------------------
//
// Game case: FFX only [AGENTS.md rule 14]. `docs/plans/ch-gauntlet-review.md` pick GA11 and section 5 (the arena options). Built 2026-11-10.
//
// **A STAND-IN, THE PREFLIGHT'S OPTION (c).** No Calm Lands arena plate exists (the art mirror of release 79 holds none), and GA11 (a new `monster-arena` plate, a light colour per creature) is **held for Bailey's pick, with a
// mockup, before anything is painted** (hard rule 9). Until then the nine acts are fought on Chapter II's Zanarkand Dome: a round arena (wrong place, right shape) with its lights, particles and seven camera rigs, the party
// held on its slots. The scene IS the Dome's (`./zanarkand-dome.ts`, which is not touched) with this chapter's enemy staging, as the Spectral Keeper's (`./spectral-keeper.ts`) is. The plate every formation names
// (`EnemyGroupDef.plate`, `data/ffx/gauntlet-ids.ts#GAUNTLET_PLATE`) is that plate, so the battle screen's plate swap is a no-op here; when the new plate lands it is one line there and in `data/art/artNamespace.ts`.
//
// ONE STAGE, NINE ACTS. The chapter is a chain of nine fresh fights and a chain keeps one scene: the staging below knows every creature by its combatant id, so each act places its own and the others are never on the field
// together. The Dome's own enemy slot 0 (x 2.5, z -4.0; solved against the HUD safe area: the CTB queue owns everything right of 0.843 of the canvas, `./zanarkand-dome.ts`) is where the Ultima Buster stands; the other
// eight stand at the same depth, further right (G-1, below). The Ultima Buster alone has parts: its Head and its two Arms stand behind the body, the Arms either side of it.
//
// **G-1 (2026-11-10, FFX only): THE STAND-INS STOOD ON AURON.** Each plane is centred on its spot and `worldHeight` is the height of the whole sheet down to its ground row, so a wide stand-in reaches half its width left of
// the spot (the King's winged `pterya` sheet is 1,785 x 950: 3.6 m of painted box at 2.3 m). Yunalesca's narrow painting (188 px wide at 1600) is clear of Auron from x 2.8; these nine, from x 2.5, reached 122 to 252 px into
// Auron's box (79 to 263 into Tidus's) at 1600 x 900, and overlapped it at 1366 x 768 and 390 x 844 too (`docs/handoff/ch-gauntlet.md`, "G-1 staging fix"). The party stands on the Dome's slots and the shared framing
// (`engine/fx/mix`) steps it 0.7 m toward a boss that stands clear of it, so the room is what is left of that frame: Auron's box ends at 1061 of 1600 px (his sword) and the turn list's rows begin at 1330, a column about 240 px
// wide (Yunalesca stands 188 wide, Spherimorph 195). So the eight bodies stand at the Dome's boss depth at x 4.5 to 4.75 with **the height at which their painting is no wider than the column**: the narrow stand-ins (Don
// Tonberry, Catastrophe, Th'uban, Neslug) lose 0 to 19 percent, the wide ones (the King, Earth Eater, Jormungand, the Greater Sphere) 31 to 48. Standing deeper would not buy the size back (the box is as wide on screen
// wherever it stands) and the phone refits its camera to hold the whole fight in one slice, so every metre between Auron and a figure's far edge is paid for there in the party's size. **The Ultima Buster is not moved**:
// its four pieces cannot share the column at a size that reads (the numbers and the two options are in the handoff note).
//
// **THE HEIGHTS ARE ESTIMATES** for the framing (no stature row exists for any of the nine: `data/ffx/fiend-stature.ts` is keyed by other monsters): the party stands 1.78 and the Dome's own boss 2.9. The painting that
// stands in for each creature (`GAUNTLET_SPRITE`) is not the creature, so the height is read off the creature as the guides describe it (a giant Cactuar, a king Tonberry, a great serpent, a heavy ground-bound beast, a
// round machine, a vast thorned monster, a robed giant, a bulky shelled slug, a towering machine), capped at what the Dome's rigs frame. They were LOOKED AT in the stage 5 browser inspection of `docs/handoff/ch-gauntlet.md` (all nine acts' first menus):
// the first pass put the nine on Yunalesca's spot (x 2.8) at 2.2 to 3.4 m, and the wide stand-in paintings (the King's winged `pterya`, Earth Eater's `sinspawn-gui`) reached the turn list's rail, and the Arms' stand-in
// `gate-lock` (a 659 x 394 bar) at 1.8 m was a 3 m beam across the party; so the second pass stood them on the Dome's own slot 0 (x 2.5) with the King, Earth Eater and the Arms smaller (G-1 above moved the bodies again, and the heights below are the third pass's). A figure that clips the
// frame is a one-number change here; the art lane's paintings are solved against the safe area.

/** The Dome's own enemy slot 0 (`ZANARKAND_DOME_SLOTS.enemy[0]`; Yunalesca stands a little right of it, at 2.8): the Ultima Buster stands here (the published slot too). */
const BOSS_SPOT: Spot = [2.5, 0, -4.0];

/** The other eight bodies' depth: the Dome's own, so the camera and the phone's slice fit are planned for the stage as every other chapter on it gets them. */
const BODY_Z = -4.0;

/**
 * Where each combatant stands, by id. **G-1:** the eight single bodies stand right of Auron at the Dome's depth, each at the x that puts its painting's left edge about 24 px right of his sword in the frame the framing plan picks
 * (1600 x 900; 22 at 1366 x 768) with its right edge left of the turn list's rows (at 1326 of 1330); the King's x is lower than the rest because its winged sheet is lopsided (its box runs 1.46 m left of the spot and 2.18
 * right at 2.3 m, the others are centred on theirs). The parts of the Ultima Buster stand behind the body, the Arms either side of it and the Head above them.
 */
export const GAUNTLET_SPOTS: Readonly<Record<GauntletCombatantId, Spot>> = {
  'cactuar-king': [4.54, 0, BODY_Z],
  'don-tonberry': [4.7, 0, BODY_Z],
  jormungand: [4.75, 0, BODY_Z],
  'earth-eater': [4.75, 0, BODY_Z],
  'greater-sphere': [4.75, 0, BODY_Z],
  catastrophe: [4.74, 0, BODY_Z],
  thuban: [4.74, 0, BODY_Z],
  neslug: [4.74, 0, BODY_Z],
  'ultima-buster': BOSS_SPOT,
  [ULTIMA_BUSTER_HEAD_ID]: [2.5, 0, -8.0],
  [ULTIMA_BUSTER_ARM_LEFT_ID]: [0.7, 0, -6.0],
  [ULTIMA_BUSTER_ARM_RIGHT_ID]: [3.6, 0, -6.0],
};

/**
 * World heights, metres: the party stands 1.78. Estimates for the framing, `[estimate]` (see the note above). **G-1:** the eight single bodies are the largest height at which the stand-in's painted box fits the column
 * right of Auron (the comment on each is the height it had, read off the creature as the guides describe it); the column is the HUD's, so the art lane's real paintings re-solve them. The Ultima Buster keeps its estimates.
 */
export const GAUNTLET_HEIGHTS: Readonly<Record<GauntletCombatantId, number>> = {
  'cactuar-king': 1.37, // was 2.3: the stand-in is a wide winged beast (1,785 x 950), its box 3.6 m wide at 2.3 m
  'don-tonberry': 2.2, // unchanged: the narrow stand-in needed a move and no shrink
  jormungand: 1.99, // was 3.2: the stand-in (`geosgaeno`) is a long serpent
  'earth-eater': 1.51, // was 2.9: the stand-in is a wide, heavy body
  'greater-sphere': 2.06, // was 3.0
  catastrophe: 2.86, // was 3.4
  thuban: 2.39, // was 2.9 (the Sanctuary Keeper painting it stands in with is the Spectral Keeper's 2.9 on this very stage)
  neslug: 2.27, // was 2.8
  'ultima-buster': 3.4,
  [ULTIMA_BUSTER_HEAD_ID]: 1.3,
  [ULTIMA_BUSTER_ARM_LEFT_ID]: 1.1, // the stand-in is a wide bar (659 x 394): 1.8 made a 3 m beam
  [ULTIMA_BUSTER_ARM_RIGHT_ID]: 1.1,
};

/** This stage's staging: the Dome's (the party held on its slots) with every creature's spot and height. */
export const GAUNTLET_STAGING = {
  holdParty: true,
  enemySpots: GAUNTLET_SPOTS as Record<string, Spot>,
  figureHeights: GAUNTLET_HEIGHTS as Record<string, number>,
} as const;

/** The published slots, same shape every other scene exports (the registry row, `./experiment-scenes.ts`): the body's spot, then the Ultima Buster's three part slots. */
export const GAUNTLET_SLOTS: SceneSlots = {
  party: ZANARKAND_DOME_SLOTS.party.map((s) => [...s] as Spot),
  enemy: [BOSS_SPOT, GAUNTLET_SPOTS[ULTIMA_BUSTER_HEAD_ID], GAUNTLET_SPOTS[ULTIMA_BUSTER_ARM_LEFT_ID], GAUNTLET_SPOTS[ULTIMA_BUSTER_ARM_RIGHT_ID]].map((s) => [...s] as Spot),
  partyHeight: ZANARKAND_DOME_SLOTS.partyHeight,
  enemyHeight: GAUNTLET_HEIGHTS['ultima-buster'],
  ...GAUNTLET_STAGING,
};

/** The nine creatures the staging knows (the formations' bodies; a test pins that this is the data's list). */
export const GAUNTLET_STAGED_BODIES: readonly string[] = GAUNTLET_CREATURES;

type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/** `build` with some fields replaced; the getters (the backdrop that hot-swaps in a dev server) are copied as getters, so the scene still reads the live one. */
function derive(build: SceneBuild, over: Partial<Mutable<SceneBuild>>): SceneBuild {
  const out = Object.defineProperties(Object.create(Object.getPrototypeOf(build)) as object, Object.getOwnPropertyDescriptors(build)) as Mutable<SceneBuild>;
  Object.assign(out, over);
  return out;
}

/**
 * **The Dome for the Gauntlet**: Chapter II's scene with this chapter's staging in place of Yunalesca's. It owns no actors (`docs/ENGINE-API.md#scene-builder-contract`). Chapter II's staging is kept whole (the party held
 * on its slots: Bailey's pick for Chapters I to III, which this hidden variant shares) and the nine creatures' spots and heights are added to it.
 */
export const buildGauntletScene: SceneFactory = async (opts: SceneBuildOptions = {}) => {
  const base = await buildZanarkandDomeScene(opts);
  return derive(base, { enemySpots: GAUNTLET_STAGING.enemySpots, figureHeights: GAUNTLET_STAGING.figureHeights });
};
