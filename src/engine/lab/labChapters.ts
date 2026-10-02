/**
 * CAMERA LAB: the two chapters' staging and the shot numbers, as data.
 *
 * Starting points (AGENTS.md: "use their numbers"; judged on frames in the perspectives round,
 * `docs/concepts/perspectives-2026-09-27/`):
 * - **Chapter I (FFX)** keeps today's formation: the per-action camera the judges liked best
 *   (M4) was filmed on it, and its party-to-boss line already runs into the painted set.
 * - **Chapter IV (FFX-2)** takes P2/P2h's restaged party (the best FFX-2 still, 8.0), moved as one
 *   so Bahamut keeps today's spot over his pool and reflection. The over-the-shoulder master is
 *   P2h's camera moved by the same offset.
 * - The shot numbers below are ours, seeded from M2-M4's rigs (`mock-scripts/motion-shots-*`) and
 *   from P2h, P3, P7 and P22 (`frames/frames.json`), re-expressed against each actor's line to its
 *   target so they hold for any actor.
 *
 * Rear paintings are the round's candidates (never installed): copied into this branch's
 * `public/mock-art/`, never into `public/art`. Their known flaws are named in the lab panel.
 *
 * Pure data. Game case (rule 14): Chapter I is FFX, Chapter IV is FFX-2; every placement is ours.
 */

import type { LabChapterId, LabGame, LabStyle } from './LabTypes.ts';
import type { LabRig } from './labGeometry.ts';

export type Spot = [number, number, number];

export interface ShoulderTune {
  /** Degrees off the line to the target, behind the actor and toward the viewer. */
  angle: number;
  /** The same when the actor has no rear painting (VIEWS off, a spherechanged girl, an aeon): more side-on. */
  frontAngle: number;
  dist: number;
  camH: number;
  lookH: number;
  fov: number;
  /** Where the actor's torso lands on screen (-1 left .. 1 right). */
  wantX: number;
}

export interface EnemyTune {
  /** Degrees off the enemy's line to the party, toward the viewer. */
  angle: number;
  distPerHeight: number;
  camH: number;
  lookPerHeight: number;
  fov: number;
}

export interface ShotTuning {
  hero: ShoulderTune;
  heroClose: ShoulderTune;
  casterLow: ShoulderTune;
  itemClose: ShoulderTune;
  target: EnemyTune;
  enemyFront: EnemyTune;
  impactWide: EnemyTune;
  partyWide: { back: number; side: number; camH: number; lookH: number; fov: number };
  lungeSide: { angle: number; dist: number; camH: number; lookH: number; fov: number };
  enemyBehindParty: { back: number; side: number; camH: number; lookPerHeight: number; fov: number; wantX: number };
  colossus: { towardPerHeight: number; sidePerHeight: number; camH: number; lookPerHeight: number; fov: number };
  victory: { dist: number; camH: number; lookH: number; fov: number };
}

const SHARED: Omit<ShotTuning, 'hero' | 'heroClose'> = {
  casterLow: { angle: 58, frontAngle: 64, dist: 2.4, camH: 0.42, lookH: 1.45, fov: 42, wantX: -0.2 },
  itemClose: { angle: 52, frontAngle: 62, dist: 2.6, camH: 1.3, lookH: 1.0, fov: 38, wantX: -0.22 },
  target: { angle: 28, distPerHeight: 1.35, camH: 1.0, lookPerHeight: 0.55, fov: 34 },
  enemyFront: { angle: 35, distPerHeight: 1.6, camH: 1.6, lookPerHeight: 0.55, fov: 36 },
  impactWide: { angle: 24, distPerHeight: 2.3, camH: 2.2, lookPerHeight: 0.5, fov: 36 },
  partyWide: { back: 7, side: 1.6, camH: 3.1, lookH: 1.0, fov: 34 },
  // M4's side4: 15-17 units out on a 24-degree lens, so the lunge and the boss share the frame while the view stays on the set.
  lungeSide: { angle: 50, dist: 15, camH: 0.95, lookH: 1.45, fov: 24 },
  // Clair Obscur's enemy turn: well behind the party (the heroes small), low, a lens sized to the boss.
  enemyBehindParty: { back: 8, side: 0.9, camH: 0.8, lookPerHeight: 0.55, fov: 34, wantX: 0.1 },
  // M4's colo4: 5.2 units in front of the boss toward the party, 0.3 off the floor, 40-degree lens.
  colossus: { towardPerHeight: 1.27, sidePerHeight: 0.2, camH: 0.3, lookPerHeight: 0.63, fov: 40 },
  // M4's hero4: low (0.45), a few units in front, 34-degree lens.
  victory: { dist: 3.4, camH: 0.45, lookH: 1.3, fov: 34 },
};

/** Persona: hip height, slight up-tilt, wide lens, still. Clair Obscur: chest height, normal lens, 2-3 m, drift. */
export const STYLE_TUNING: Readonly<Record<LabStyle, ShotTuning>> = {
  persona: {
    ...SHARED,
    hero: { angle: 47, frontAngle: 64, dist: 3.3, camH: 0.95, lookH: 1.75, fov: 46, wantX: -0.38 },
    heroClose: { angle: 47, frontAngle: 64, dist: 3.3, camH: 0.95, lookH: 1.75, fov: 46, wantX: -0.38 },
  },
  clair: {
    ...SHARED,
    hero: { angle: 40, frontAngle: 62, dist: 2.7, camH: 1.42, lookH: 1.5, fov: 36, wantX: -0.36 },
    heroClose: { angle: 34, frontAngle: 58, dist: 2.0, camH: 1.05, lookH: 1.5, fov: 34, wantX: -0.44 },
  },
};

export interface LabRear {
  /** Path under the site's base, e.g. `mock-art/tidus/rear34-hi.png`. */
  path: string;
}

export interface LabChapter {
  id: LabChapterId;
  game: LabGame;
  /** The panel's name for it. */
  title: string;
  /** Party spots by slot (0-2); the reserve slots stay today's. */
  partySlots: Spot[];
  /** Who stands in slots 0-2 (a check, logged when the build disagrees). */
  expectParty: string[];
  /** Enemies pinned where the lab wants them (the stage's own `enemySpots`). */
  enemyPins: Record<string, Spot>;
  /** Rear paintings by art id (FFX-2: the girl plus her dressphere). */
  rears: Record<string, LabRear>;
  /** Boss specials that take the colossus angle (by ability id or name, lower case). */
  big: string[];
  /** Max view heading off -z, degrees (the painted set). */
  band: number;
  /** The FFX-2 over-the-shoulder master (P2h); null for FFX, which cuts per actor. */
  partyShoulder: LabRig | null;
  /** Named in the lab panel: what is wrong with the candidate paintings. */
  flaws: string[];
}

/** P2/P2h's Chapter IV staging moved as one by Bahamut's offset, so he keeps today's spot. */
const CH4_SHIFT: Spot = [-1.68, 0, -0.36];
const shift = (p: Spot): Spot => [p[0] + CH4_SHIFT[0], p[1], p[2] + CH4_SHIFT[2]];

export const LAB_CHAPTERS: Readonly<Record<LabChapterId, LabChapter>> = {
  'seymour-flux': {
    id: 'seymour-flux',
    game: 'ffx',
    title: 'I · Seymour Flux (FFX)',
    // Today's (gagazet.ts PARTY_SLOTS and GAGAZET_STAGING): M4 was filmed on it.
    partySlots: [
      [-1.31, 0, 1.55],
      [0.3, 0, 1.0],
      [-0.61, 0, -1.05],
    ],
    expectParty: ['tidus', 'yuna', 'kimahri'],
    enemyPins: { 'seymour-flux': [3.54, 0, -7.6], mortiorchis: [1.03, 1.01, -7.6] },
    rears: {
      tidus: { path: 'mock-art/tidus/rear34-hi.png' },
      yuna: { path: 'mock-art/yuna/rear34.png' },
      kimahri: { path: 'mock-art/kimahri/rear34.png' },
    },
    big: ['total-annihilation', 'total annihilation'],
    band: 30,
    partyShoulder: null,
    flaws: [
      "Tidus's rear painting has the red knit sleeve on the wrong arm.",
      "Yuna's rear painting holds her staff upright (the idle holds it low).",
      "Kimahri's horn was trimmed by hand; his spearhead is gold, not silver.",
    ],
  },
  'ffx2-bahamut': {
    id: 'ffx2-bahamut',
    game: 'ffx2',
    title: 'IV · Bahamut (FFX-2)',
    partySlots: [shift([-2.35, 0, 2.2]), shift([-1.2, 0, 1.05]), shift([-0.05, 0, -0.15])],
    expectParty: ['yuna', 'rikku', 'paine'],
    enemyPins: { bahamut: shift([2.73, 0, -5.44]) },
    rears: {
      'yuna-white-mage': { path: 'mock-art/yuna-white-mage/rear34-hi.png' },
      'rikku-dark-knight': { path: 'mock-art/rikku-dark-knight/rear34.png' },
      'paine-warrior': { path: 'mock-art/paine-warrior/rear34.png' },
    },
    big: ['mega-flare', 'mega flare'],
    band: 30,
    // P2h: (-2.7, 3.35, 9.2) looking at (1.2, 1.45, -5.8), fov 28.5, moved with the party.
    partyShoulder: { position: [-4.38, 3.35, 8.84], lookAt: [-0.48, 1.45, -6.16], fov: 28.5 },
    flaws: [
      "White Mage Yuna's rear painting shows an open back with a pink panel (the idle's robe is closed).",
      "Dark Knight Rikku's rear painting adds a blue cape panel with orange tips.",
      "Warrior Paine's rear painting shows a red top between the shoulder blades; her crossguard is white.",
      'A girl who spherechanges has no rear painting: she keeps her front one and the camera stays off her back.',
    ],
  },
};

export function labChapter(id: string): LabChapter | null {
  return (LAB_CHAPTERS as Record<string, LabChapter>)[id] ?? null;
}

/** True when `abilityId` or `abilityName` is one of the chapter's boss specials. */
export function isBigAbility(chapter: LabChapter, abilityId: string | null, abilityName: string | null): boolean {
  const keys = [abilityId, abilityName].filter((k): k is string => !!k).map((k) => k.toLowerCase());
  return keys.some((k) => chapter.big.includes(k));
}
