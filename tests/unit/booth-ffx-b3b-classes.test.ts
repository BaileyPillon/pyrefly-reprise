/**
 * THE DEFECT CLASSES THE EARLIER BATCHES FOUND, READ FOR BATCH 3b (release 71, branch `booth-ffx-b3b`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapters III, XII and XIV. The driver's brief named seven classes; classes 1 (a title or
 * mark outliving a chained link's seam) and 5 (a form change cueing a freeze) are pinned by `booth-ffx-b3b-chain` on the real chains, class 6 (a swap-scope exception must hold `smear`) by `booth-hold-guard` and `booth-ffx-b3b-rows`, class 7 (`public/fx` is gitignored) is a
 * note for the browser jobs. This file reads the other three offline, with the real code and no browser:
 *
 * 2. a story script cutting the camera to a rig while the follower runs on top (`ProAutoStage.SCRIPTED_RIGS`): FFX has no follower, and none of the three chapters' scripts cuts to a rig the table names;
 * 3. the camera pushing a figure's painted rectangle outside the viewport: the FFX director's real shots (`ProShots.laidShot`, the play's own `fitDolly`) laid on each chapter's stage WITH THE PARTY WHERE THE LIVE GAME STANDS IT (CHAPTER FRAMING's row, through the real `standFor` and
 *    `sideShift`; review m1) and with a summoned aeon as the actor (m2), the actor projected (`ProFit.ndcRect`) at 16:9 and 21:9, against the approved Chapter I laid the same way. The model overstates (it reads the approved chapter's own cast shot as cropping the caster in most
 *    samples: no director clamp, no pillars), so the claim is RELATIVE (five points of tolerance), and `PIECE_HOLDS[id].cam` is asserted exactly when a read exceeds it: held in XII and XIV, played in III;
 * 4. the moments piece turning a knock-out into a hard cut whose step is over 0.5 of the drawn height (Leblanc's Rikku Thief 0.62, Yuna Gunner 0.50 to 0.52): the offline estimate of each figure's hurt-to-KO step (`tools` script in the handoff), calibrated on the three FFX-2
 *    dresses that were measured in the page; `PIECE_HOLDS[id].moments` is asserted exactly when a figure the chapter can field is over the bounds (review M1: held in III and XII for the reserve Rikku, 0.52).
 */
import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { DREAMS_END_BFA_PIN, DREAMS_END_RIGS, DREAMS_END_ROW_SHIFT, DREAMS_END_SLOTS, DREAMS_END_STAGING } from '../../src/scenes/dreams-end.ts';
import { GARDEN_ACTOR_HEIGHTS, GARDEN_BACKDROP, GARDEN_BOSS_SPOT, GARDEN_OF_PAIN_RIGS, GARDEN_OF_PAIN_SLOTS } from '../../src/scenes/garden-of-pain.ts';
import { VIA_ACTOR_HEIGHTS, VIA_AEON_SPOT, VIA_BACKDROP, VIA_PURIFICO_RIGS, VIA_PURIFICO_SLOTS } from '../../src/scenes/via-purifico.ts';
import { SCRIPTED_RIGS, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { characterOf, finisherKeys, laidShot, pickRow, rowsOf } from '../../src/engine/procam/ProShots.ts';
import { lengthOf, sampleKeys } from '../../src/engine/procam/ProTrack.ts';
import { bandOf, fitDolly, ndcRect, type Box } from '../../src/engine/procam/ProFit.ts';
import { standFor } from '../../src/engine/fx/mix/stageTable.ts';
import type { CameraRig } from '../../src/engine/BattleCamera.ts';
import { liveFeet } from './booth-ffx-b3b-live-stage.ts';

const IDS = ['braskas-final-aeon', 'seymour-omnis', 'isaaru-via-purifico'] as const;

/** Every `{ type: 'camera', rig }` step anywhere inside a chapter's scripts (the pre and post scripts, the mid-battle ones). */
function cameraCuts(node: unknown, into: Set<string> = new Set()): Set<string> {
  if (Array.isArray(node)) for (const n of node) cameraCuts(n, into);
  else if (node !== null && typeof node === 'object') {
    const o = node as Record<string, unknown>;
    if (o['type'] === 'camera' && typeof o['rig'] === 'string') into.add(o['rig']);
    for (const v of Object.values(o)) cameraCuts(v, into);
  }
  return into;
}

describe('class 2: the scripts cut the camera to the scene\'s own rigs, and none is a rig the follower stands down on', () => {
  const RIGS: Record<string, readonly string[]> = {
    'braskas-final-aeon': Object.keys(DREAMS_END_RIGS),
    'seymour-omnis': Object.keys(GARDEN_OF_PAIN_RIGS),
    'isaaru-via-purifico': Object.keys(VIA_PURIFICO_RIGS),
  };

  it('the table names FFX-2 chapters only (rule 14: the Road of Chapter XI is the one scene that draws a plate by the camera position); none of the three is in it, and the stand-down answers false for every rig', () => {
    for (const id of Object.keys(SCRIPTED_RIGS)) expect(getChapter(id)?.game, id).toBe('ffx2');
    for (const id of IDS) {
      expect(Object.keys(SCRIPTED_RIGS), id).not.toContain(id);
      for (const rig of RIGS[id]!) expect(scriptedShot(id, rig), `${id} ${rig}`).toBe(false);
    }
  });

  it.each(IDS)('%s: every camera step of its scripts (pre, post and mid-battle) names one of the scene\'s own rigs, so no cut lands on a pose the scene draws a plate by', (id) => {
    const rigs = cameraCuts(getChapter(id)!.scriptsRef);
    expect(rigs.size).toBeGreaterThan(0); // the walk finds them (idle, action, victory, intro, enemy)
    for (const rig of rigs) expect(RIGS[id], `${id} cuts to ${rig}`).toContain(rig);
  });
});

// ------------------------------------------------------------------------------------------------ class 3: the camera read
type V3 = [number, number, number];
interface Stage {
  readonly plate: { readonly width: number; readonly distance: number; readonly centreY: number };
  readonly party: ReadonlyArray<{ readonly char: string; readonly feet: V3; readonly height?: number; readonly aspect?: number }>;
  readonly boss: { readonly feet: V3; readonly height: number; readonly aspect: number };
}
const HEIGHT: Record<string, number> = { tidus: 1.82, yuna: 1.68, kimahri: 1.95, auron: 1.93 };
const ASPECT: Record<string, number> = { tidus: 0.645, yuna: 0.75, kimahri: 0.64, auron: 0.66 }; // silhouette width over height of the idle paintings

const STAGES: Record<string, Stage> = {
  // Chapter I, the approved control: Gagazet's party slots (`scenes/gagazet.ts` PARTY_SLOTS), the plate (82 wide at z -48, centre y -10.7) and Seymour Flux at his real 0.6 share of 100 over Tidus's 18.15 (6.017, `data/ffx/fiend-stature.ts`) at (3.54, -7.6)
  gagazet: { plate: { width: 82, distance: -48, centreY: -10.7 }, party: [['tidus', [-1.31, 0, 1.55]], ['yuna', [0.3, 0, 1.0]], ['kimahri', [-0.61, 0, -1.05]]].map(([char, feet]) => ({ char: char as string, feet: feet as V3 })), boss: { feet: [3.54, 0, -7.6], height: 6.017, aspect: 0.62 } },
  'braskas-final-aeon': {
    plate: { width: 80, distance: -50, centreY: 1.23 },
    party: ['tidus', 'yuna', 'auron'].map((char, i) => ({ char, feet: DREAMS_END_SLOTS.party[i] as V3 })),
    // the aeon at his pin plus the CHAPTER FRAMING row's shift: where a desktop ends him (4.753, -8.947), 0.75 of his real height
    boss: { feet: [DREAMS_END_BFA_PIN[0] + DREAMS_END_ROW_SHIFT['braskas-final-aeon'][0], 0, DREAMS_END_BFA_PIN[2] + DREAMS_END_ROW_SHIFT['braskas-final-aeon'][1]], height: DREAMS_END_STAGING.figureHeights['braskas-final-aeon']!, aspect: 1.06 },
  },
  'seymour-omnis': {
    plate: GARDEN_BACKDROP,
    party: ['tidus', 'yuna', 'auron'].map((char, i) => ({ char, feet: GARDEN_OF_PAIN_SLOTS.party[i] as V3 })),
    boss: { feet: GARDEN_BOSS_SPOT, height: GARDEN_ACTOR_HEIGHTS.omnis, aspect: 0.7 },
  },
  'isaaru-via-purifico': {
    plate: VIA_BACKDROP,
    party: [{ char: 'yuna', feet: VIA_PURIFICO_SLOTS.party[0] as V3 }],
    boss: { feet: VIA_AEON_SPOT, height: VIA_ACTOR_HEIGHTS.aeon, aspect: 1.0 }, // Isaaru's aeon (Grothia 0.95, Pterya 1.6, Spathi 1.0 wide): the middle one
  },
};

const box = (feet: V3, h: number, aspect: number, band: [number, number] = [0, 1]): Box => {
  const w = aspect * h;
  const b: Box = { x0: feet[0] - w / 2, x1: feet[0] + w / 2, y0: 0, y1: h, z0: feet[2] - 0.15, z1: feet[2] + 0.15 };
  return band[1] < 1 ? bandOf(b, band[0], band[1]) : b;
};
const rad = Math.PI / 180;
const sub3 = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross3 = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => {
  const l = Math.hypot(...a);
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** The share of a frame's rays that miss the backdrop plane above its top edge or past a side (below its bottom edge the 3D ground covers the frame). */
function exposed(pl: Stage['plate'], pos: V3, look: V3, fov: number, aspect: number): number {
  const h = (pl.width * 1536) / 2688;
  const f = unit(sub3(look, pos));
  const r = unit(cross3(f, [0, 1, 0]));
  const u = cross3(r, f);
  const tv = Math.tan((fov * rad) / 2);
  let miss = 0;
  let n = 0;
  for (let i = 0; i <= 12; i++)
    for (let j = 0; j <= 8; j++) {
      const a = (i / 12) * 2 - 1;
      const b = (j / 8) * 2 - 1;
      const d: V3 = [f[0] + a * tv * aspect * r[0] + b * tv * u[0], f[1] + a * tv * aspect * r[1] + b * tv * u[1], f[2] + a * tv * aspect * r[2] + b * tv * u[2]];
      n++;
      if (d[2] >= -1e-6) {
        miss++;
        continue;
      }
      const t = (pl.distance - pos[2]) / d[2];
      const x = pos[0] + d[0] * t;
      const y = pos[1] + d[1] * t;
      if (Math.abs(x) > pl.width / 2 || y > pl.centreY + h / 2) miss++;
    }
  return miss / n;
}

interface Read {
  /** The share of 50 ms samples of the shot (after the play's fit) in which the actor's rectangle leaves the viewport. */
  readonly outside: number;
  /** The mean share of the frame's rays that miss the plate. */
  readonly plate: number;
}
/** One kind of shot over every actor of the stage's party, at an aspect: the real rows laid on the live pair, fitted as the play fits (actor and the boss's body, the play's safe rectangle and `maxK`). */
function read(stage: Stage, kind: 'cast' | 'overdrive' | 'finisher', aspect: number): Read {
  let outside = 0;
  let samples = 0;
  let plate = 0;
  let shots = 0;
  const bossBody = box(stage.boss.feet, stage.boss.height, stage.boss.aspect, [0, stage.boss.height > 3 ? 0.75 : 1]);
  for (const m of stage.party) {
    const ph = m.height ?? HEIGHT[m.char] ?? 1.8;
    const actorBox = box(m.feet, ph, m.aspect ?? ASPECT[m.char] ?? 0.65);
    const live = { actor: m.feet, target: stage.boss.feet, height: ph };
    const ch = characterOf(m.char, m.char);
    let keys;
    let safe = { x: 0.92, y: 0.95 };
    if (kind === 'finisher') {
      const row = rowsOf(`attack.${ch}.finisher`)[0];
      if (!row) continue;
      keys = finisherKeys(laidShot(row, live, 'party', null), live.actor, live.target).slice(0, 2);
      safe = { x: 0.9, y: 0.95 };
    } else {
      const group = kind === 'cast' ? `cast.start.${ch}` : rowsOf(`skill.start.${ch}`).length ? `skill.start.${ch}` : 'skill.start.tidus';
      const row = pickRow(rowsOf(group), 2, 0.5);
      if (!row) continue;
      keys = laidShot(row, live, 'party', null);
    }
    shots++;
    let sum = 0;
    let count = 0;
    for (let t = 0; t <= lengthOf(keys); t += 50) {
      const p = fitDolly(sampleKeys(keys, t), aspect, [actorBox, bossBody], safe, 1.8).pose;
      const nd = ndcRect(actorBox, p, aspect);
      if (!nd || Math.max(Math.abs(nd.x0), Math.abs(nd.x1), Math.abs(nd.y0), Math.abs(nd.y1)) > 1.001) outside++;
      samples++;
      sum += exposed(stage.plate, p.pos as V3, p.look as V3, p.fov, aspect);
      count++;
    }
    plate += sum / Math.max(1, count);
  }
  return { outside: outside / Math.max(1, samples), plate: plate / Math.max(1, shots) };
}

// ------------------------------------------------------------------------------------------------ the live stage and the aeons (review m1 and m2)
/** A scene's own numbers: its resting (`idle`) rig, which CHAPTER FRAMING moves the party from, its party slots, and the height a party-side aeon stands at (`BattlePresenterArt.worldHeightFor`: 0.7 of the scene's enemy height; the Via names its aeons' 3.2). */
const SCENES: Record<string, { rig: CameraRig; slots: readonly V3[]; humans: readonly string[]; aeonHeight: number; boss: string }> = {
  'braskas-final-aeon': { rig: DREAMS_END_RIGS['idle']!, slots: DREAMS_END_SLOTS.party as V3[], humans: ['tidus', 'yuna', 'auron'], aeonHeight: (DREAMS_END_SLOTS.enemyHeight ?? 4.2) * 0.7, boss: 'braskas-final-aeon' },
  'seymour-omnis': { rig: GARDEN_OF_PAIN_RIGS['idle']!, slots: GARDEN_OF_PAIN_SLOTS.party as V3[], humans: ['tidus', 'yuna', 'auron'], aeonHeight: (GARDEN_OF_PAIN_SLOTS.enemyHeight ?? 4.2) * 0.7, boss: 'seymour-omnis' },
  'isaaru-via-purifico': { rig: VIA_PURIFICO_RIGS['idle']!, slots: VIA_PURIFICO_SLOTS.party as V3[], humans: ['yuna'], aeonHeight: VIA_ACTOR_HEIGHTS.aeon, boss: 'grothia' },
};
const AEON_ASPECT = 0.9; // the painted aeons' silhouette width over height, our estimate (the Valefor, Ifrit, Ixion, Shiva and Bahamut paintings stand 0.8 to 1.0): rule 6 does not reach a camera model's input, and the control uses the same number
const CONTROL_AEON_HEIGHT = 4.2 * 0.7; // Gagazet names no enemy height: the presenter's default 4.2, at 0.7 for an aeon

/** Where the live game puts a party member: the scene's slot moved by CHAPTER FRAMING's row (`fx/mix/stageTable.ts`, on by default for FFX on a desktop), read through the real `standFor` and `sideShift` from today's resting rig, for the member's combatant id. */
const livePlace = (id: string, member: string, slot: number): V3 => liveFeet(SCENES[id]!.boss, SCENES[id]!.rig, SCENES[id]!.slots[slot]!, member);

/** A chapter's stage with the party the live game fields: the humans of the line-up, or the one aeon a summon stands in Yuna's slot (slot 1; the Via's comment says the same). */
function liveStage(id: string, who: 'human' | 'aeon'): Stage {
  const sc = SCENES[id]!;
  const base = STAGES[id]!;
  if (who === 'human') return { ...base, party: sc.humans.map((char, i) => ({ char, feet: livePlace(id, char, i) })) };
  return { ...base, party: [{ char: 'valefor', feet: livePlace(id, 'valefor', 1), height: sc.aeonHeight, aspect: AEON_ASPECT }] };
}
const controlStage = (who: 'human' | 'aeon'): Stage => (who === 'human' ? STAGES['gagazet']! : { ...STAGES['gagazet']!, party: [{ char: 'valefor', feet: [0.3, 0, 1.0] as V3, height: CONTROL_AEON_HEIGHT, aspect: AEON_ASPECT }] });

/** Every way the chapter's directed camera reads worse than the approved Chapter I laid the same way, at an aspect (the tolerance is the lane's: five points). Empty: the camera plays. */
const TOLERANCE = 0.05;
function camFailures(id: string, aspect: number): string[] {
  const out: string[] = [];
  for (const who of ['human', 'aeon'] as const) {
    const stage = liveStage(id, who);
    const control = controlStage(who);
    for (const kind of ['cast', 'overdrive', 'finisher'] as const) {
      const mine = read(stage, kind, aspect);
      const base = read(control, kind, aspect);
      if (mine.outside > base.outside + TOLERANCE) out.push(`${who} ${kind}: ${(100 * mine.outside).toFixed(1)}% of samples outside against Chapter I's ${(100 * base.outside).toFixed(1)}%`);
      if (mine.plate > base.plate + TOLERANCE) out.push(`${who} ${kind}: ${(100 * mine.plate).toFixed(1)}% of the frame past the plate against Chapter I's ${(100 * base.plate).toFixed(1)}%`);
    }
  }
  return out;
}
const ASPECTS = [['16:9', 16 / 9], ['21:9', 3440 / 1440]] as const;

describe('class 3: the directed camera of each chapter, with the party where the live game stands it and with an aeon as the actor, against the approved Chapter I laid the same way (the model overstates; the claim is relative)', () => {
  it('the live stage is the real one: Chapter XII moves its three apart and back (the row has a step for each), Chapter III moves the party right, Chapter XIV has no row; the Garden\'s middle foot-and-knee line moves from 0.152 to 0.225', () => {
    const [tidus, yuna, auron] = ['tidus', 'yuna', 'auron'].map((m, i) => livePlace('seymour-omnis', m, i)) as [V3, V3, V3];
    const raw = SCENES['seymour-omnis']!.slots;
    expect(Math.hypot(tidus[0] - raw[0]![0], tidus[2] - raw[0]![2])).toBeGreaterThan(1.5);
    expect(Math.hypot(yuna[0] - raw[1]![0], yuna[2] - raw[1]![2])).toBeGreaterThan(1.5);
    expect(Math.hypot(auron[0] - raw[2]![0], auron[2] - raw[2]![2])).toBeGreaterThan(1.9);
    expect(tidus[0]).toBeLessThan(yuna[0]); // Tidus left, Yuna right, Auron between and back
    expect(auron[2]).toBeLessThan(Math.min(tidus[2], yuna[2]));
    expect(livePlace('braskas-final-aeon', 'tidus', 0)[0] - SCENES['braskas-final-aeon']!.slots[0]![0]).toBeGreaterThan(0.1);
    expect(standFor('ffx', [SCENES['isaaru-via-purifico']!.boss], false)).toBeNull();
    expect(livePlace('isaaru-via-purifico', 'yuna', 0)).toEqual(SCENES['isaaru-via-purifico']!.slots[0]);
  });

  it.each(IDS)('%s: the cast and the Overdrive crop no more samples and expose no more of the plate than Chapter I\'s, and the human killing blow never crops the actor, at 16:9 and 21:9', (id) => {
    for (const [, aspect] of ASPECTS) {
      const stage = liveStage(id, 'human');
      for (const kind of ['cast', 'overdrive'] as const) {
        const mine = read(stage, kind, aspect);
        const control = read(controlStage('human'), kind, aspect);
        expect(mine.outside, `${id} ${kind} outside`).toBeLessThanOrEqual(control.outside + TOLERANCE);
        expect(mine.plate, `${id} ${kind} plate`).toBeLessThanOrEqual(control.plate + TOLERANCE);
      }
      expect(read(stage, 'finisher', aspect).outside, `${id} finisher`).toBe(0);
    }
  });

  it('the directed camera is held where, and only where, the corrected read finds a shot worse than Chapter I\'s (an aeon as the actor, the killing blow\'s plate at the live positions); the holds name the numbers and what lifts them', () => {
    const failing = IDS.filter((id) => ASPECTS.some(([, aspect]) => camFailures(id, aspect).length > 0));
    for (const id of IDS) {
      const why = ASPECTS.flatMap(([name, aspect]) => camFailures(id, aspect).map((f) => `${name} ${f}`));
      expect(treatedHold(id, 'cam') !== undefined, `${id}: ${why.join(' | ') || 'every shot within five points of Chapter I\'s'}`).toBe(failing.includes(id));
      if (failing.includes(id)) {
        expect(treatedHold(id, 'cam'), id).toMatch(/Lifts when/);
        expect(treatedHold(id, 'cam'), id).toMatch(/J2/);
      }
    }
    expect(failing, 'the corrected read must still tell the three apart: Chapter III passes').not.toContain('braskas-final-aeon');
  });
});

// ------------------------------------------------------------------------------------------------ class 4: the knock-out's hard cut
/**
 * The offline estimate of each figure's hurt-to-KO step (the vertical distance between where the silhouette's centroid stands above the floor in the two paintings, by `docs/target/pose-measure.json`'s baselines and scales, over the idle's drawn height; `ko-step-tmp.py`
 * of the lane, `docs/handoff/booth-ffx-b3b.md` section 4). CALIBRATION: the same estimate gives 0.47 for Rikku Thief, 0.33 for Yuna Gunner and 0.37 for Rikku Dark Knight, whose swap jerks were MEASURED in the page at 0.62 to 0.63, 0.50 to 0.52 and 0.48 of the drawn height
 * (the cap that excuses a planned smear is 0.5, `critic/policy.json` `continuity.smear.maxJerkShare`): a ratio of 0.64 to 0.77 and no single ratio that sorts the three right, so it is a crude instrument that UNDER-reads. The rule is therefore two bounds, both raw: no figure the chapter
 * can field stands above the cap of 0.5 (the review's M1: Rikku, 0.52, was over it and the lane played the moments anyway), and none above the largest estimate of the approved Chapter I's own active line-up (Kimahri, 0.43), the dress the target already plays.
 */
const KO_STEP: Readonly<Record<string, number>> = {
  tidus: 0.36, yuna: 0.24, auron: 0.29,
  kimahri: 0.43, wakka: 0.4, lulu: 0.39, rikku: 0.52,
  valefor: 0.2, ifrit: 0.14, ixion: 0.13, shiva: 0.31, bahamut: 0.09, // the aeons, on the party's side and the possessed ones
  'braskas-final-aeon-1': 0.3, 'braskas-final-aeon-2': 0.05, 'yu-pagoda': 0.14, 'yu-yevon': 0.09, grothia: 0.14, pterya: 0.2, spathi: 0.08, // the foes with a KO painting
};
const MEASURED_CAP = 0.5;
const AEONS = ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut'];
const FOES = ['braskas-final-aeon-1', 'braskas-final-aeon-2', 'yu-pagoda', 'yu-yevon', 'grothia', 'pterya', 'spathi'];
const activeOf = (id: string): string[] => {
  const setup = setupForChapter(getChapter(id)!, 1);
  const slots = (setup.party as { activeSlots?: readonly string[] }).activeSlots; // the FFX build's forced line-up (Tidus, Yuna and Auron; Yuna alone in Chapter XIV)
  return setup.party.members.filter((m) => slots?.includes(m.id) ?? true).map((m) => m.id);
};
const fieldable = (id: string): string[] => [...setupForChapter(getChapter(id)!, 1).party.members.map((m) => m.id), ...AEONS, ...FOES];
const TARGET_LIMIT = Math.max(...activeOf('seymour-flux').map((m) => KO_STEP[m]!));
const heldMoments = (id: string): boolean => fieldable(id).some((m) => KO_STEP[m]! > Math.min(MEASURED_CAP, TARGET_LIMIT) + 0.005);
/** Held for want of a read, not for a number over the bounds (the review of booth-b3, M1): Yuna alone, estimated 0.24 and about 0.40 by the recorded ratio, with no read of her at a hard cut; her aeons never take the cut (`booth-b2-ko-rule`). */
const UNREAD_HELD = ['isaaru-via-purifico'];

describe('class 4: the moments are held in a chapter that can field a figure stepping further at the hurt-to-KO cut than the cap or the approved target\'s own line-up', () => {
  it('the bounds: the target\'s own limit is Kimahri\'s 0.43 (Tidus, Yuna and Kimahri are Chapter I\'s active line-up), under the 0.5 cap; the instrument\'s calibration dresses are ordered the way the page measured them (Thief over Dark Knight)', () => {
    expect(activeOf('seymour-flux').sort()).toEqual(['kimahri', 'tidus', 'yuna']);
    expect(TARGET_LIMIT).toBe(0.43);
    expect(0.47).toBeGreaterThan(0.37); // Rikku Thief (0.62 measured, held in Leblanc) over Rikku Dark Knight (0.48 measured, plays in Chapter IV)
    expect(KO_STEP['rikku']).toBeGreaterThan(MEASURED_CAP); // the raw estimate alone is over the cap
  });

  it.each(IDS)('%s: the moments piece is held exactly when a figure the chapter can field is over the bounds, or has no read at all, and the hold names the dress and the number, or the lack of a read', (id) => {
    const over = fieldable(id).filter((m) => KO_STEP[m]! > Math.min(MEASURED_CAP, TARGET_LIMIT) + 0.005);
    expect(treatedHold(id, 'moments') !== undefined, `${id}: over the bounds: ${over.join(', ') || 'none'}`).toBe(heldMoments(id) || UNREAD_HELD.includes(id));
    if (heldMoments(id)) {
      expect(over, id).toEqual(['rikku']); // the only dress over: Kimahri, Wakka and Lulu are at or under the target's own
      expect(treatedHold(id, 'moments'), id).toMatch(/Rikku at 0\.52/);
      expect(treatedHold(id, 'moments'), id).toMatch(/Lifts when/);
      expect(treatedHold(id, 'moments'), id).toMatch(/J5/);
    } else if (UNREAD_HELD.includes(id)) {
      expect(over, id).toEqual([]); // the estimate alone would have let it play: that is the point, an estimate is not a read
      expect(treatedHold(id, 'moments'), id).toMatch(/NO READ of FFX Yuna/);
      expect(treatedHold(id, 'moments'), id).toMatch(/Lifts when/);
      expect(treatedHold(id, 'moments'), id).toMatch(/J5/);
    }
  });

  it('Chapters III and XII can field all seven of Chapter I\'s party (Rikku among them) and so hold the moments; Chapter XIV is Yuna alone with her aeons, all under the bounds on the estimate, and holds them anyway for want of a read', () => {
    expect(heldMoments('braskas-final-aeon')).toBe(true);
    expect(heldMoments('seymour-omnis')).toBe(true);
    expect(heldMoments('isaaru-via-purifico')).toBe(false); // the estimate is under the bounds...
    expect(treatedHold('isaaru-via-purifico', 'moments')).toBeDefined(); // ...and the chapter holds the moments all the same (booth-b3 M1)
    expect(fieldable('braskas-final-aeon')).toContain('rikku');
    expect(fieldable('seymour-omnis')).toContain('rikku');
    expect(fieldable('isaaru-via-purifico')).not.toContain('rikku');
    expect(activeOf('braskas-final-aeon').sort()).toEqual(['auron', 'tidus', 'yuna']);
  });
});
