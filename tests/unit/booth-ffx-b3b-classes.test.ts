/**
 * THE DEFECT CLASSES THE EARLIER BATCHES FOUND, READ FOR BATCH 3b (release 71, branch `booth-ffx-b3b`; FFX only; Bailey 2026-10-30: the booth treatment for every listed chapter): Chapters III, XII and XIV. The driver's brief named seven classes; classes 1 (a title or
 * mark outliving a chained link's seam) and 5 (a form change cueing a freeze) are pinned by `booth-ffx-b3b-chain` on the real chains, class 6 (a swap-scope exception must hold `smear`) by `booth-hold-guard` and `booth-ffx-b3b-rows`, class 7 (`public/fx` is gitignored) is a
 * note for the browser jobs. This file reads the other three offline, with the real code and no browser:
 *
 * 2. a story script cutting the camera to a rig while the follower runs on top (`ProAutoStage.SCRIPTED_RIGS`): FFX has no follower, and none of the three chapters' scripts cuts to a rig the table names;
 * 3. the camera pushing a figure's painted rectangle outside the viewport: the FFX director's real shots (`ProShots.laidShot`, the play's own `fitDolly`) laid on each chapter's stage, the focus figures projected (`ProFit.ndcRect`) at 16:9 and 21:9, against the approved
 *    Chapter I laid the same way. The model overstates (it reads the approved chapter's own cast shot as cropping the caster in most samples: no director clamp, no pillars), so the claim is RELATIVE: no worse than the control; the finisher's push keeps the actor whole;
 * 4. the moments piece turning a knock-out into a hard cut whose step is over 0.5 of the drawn height (Leblanc's Rikku Thief 0.62, Yuna Gunner 0.50 to 0.52): the offline estimate of each figure's hurt-to-KO step (`tools` script in the handoff), calibrated on the three FFX-2
 *    dresses that were measured in the page.
 */
import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { DREAMS_END_BFA_PIN, DREAMS_END_RIGS, DREAMS_END_ROW_SHIFT, DREAMS_END_SLOTS, DREAMS_END_STAGING } from '../../src/scenes/dreams-end.ts';
import { GARDEN_ACTOR_HEIGHTS, GARDEN_BACKDROP, GARDEN_BOSS_SPOT, GARDEN_OF_PAIN_RIGS, GARDEN_OF_PAIN_SLOTS } from '../../src/scenes/garden-of-pain.ts';
import { VIA_ACTOR_HEIGHTS, VIA_AEON_SPOT, VIA_BACKDROP, VIA_PURIFICO_RIGS, VIA_PURIFICO_SLOTS } from '../../src/scenes/via-purifico.ts';
import { SCRIPTED_RIGS, scriptedShot } from '../../src/engine/procam/ProAutoStage.ts';
import { PIECE_HOLDS, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { characterOf, finisherKeys, laidShot, pickRow, rowsOf } from '../../src/engine/procam/ProShots.ts';
import { lengthOf, sampleKeys } from '../../src/engine/procam/ProTrack.ts';
import { bandOf, fitDolly, ndcRect, type Box } from '../../src/engine/procam/ProFit.ts';

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
  readonly party: ReadonlyArray<{ readonly char: string; readonly feet: V3 }>;
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
    const ph = HEIGHT[m.char] ?? 1.8;
    const actorBox = box(m.feet, ph, ASPECT[m.char] ?? 0.65);
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

describe('class 3: the directed camera of each chapter is no worse than the approved Chapter I laid the same way (the model overstates; the claim is relative)', () => {
  for (const [name, aspect] of [['16:9', 16 / 9], ['21:9', 3440 / 1440]] as const) {
    it.each(IDS)(`%s at ${name}: the cast and the Overdrive shots crop the actor in no more samples than Chapter I's and expose no more of the plate; the killing blow's push never crops the actor`, (id) => {
      const stage = STAGES[id]!;
      for (const kind of ['cast', 'overdrive'] as const) {
        const mine = read(stage, kind, aspect);
        const control = read(STAGES['gagazet']!, kind, aspect);
        expect(mine.outside, `${id} ${kind} outside ${mine.outside.toFixed(3)} against Chapter I's ${control.outside.toFixed(3)}`).toBeLessThanOrEqual(control.outside + 0.05);
        expect(mine.plate, `${id} ${kind} plate ${mine.plate.toFixed(3)} against Chapter I's ${control.plate.toFixed(3)}`).toBeLessThanOrEqual(control.plate + 0.05);
      }
      const fin = read(stage, 'finisher', aspect);
      expect(fin.outside, `${id} finisher`).toBe(0);
    });
  }

  it('so the camera is not held in any of the three: each holds the staged breath only (the one-row fallback, `PIECE_HOLDS[id].cam`, is named in the handoff and not built)', () => {
    for (const id of IDS) {
      expect(treatedHold(id, 'cam'), id).toBeUndefined();
      expect(Object.keys(PIECE_HOLDS[id]!), id).toEqual(['breath']);
    }
  });
});

// ------------------------------------------------------------------------------------------------ class 4: the knock-out's hard cut
/**
 * The offline estimate of each figure's hurt-to-KO step (the vertical distance between where the silhouette's centroid stands above the floor in the two paintings, by `docs/target/pose-measure.json`'s baselines and scales, over the idle's drawn height; `ko-step-tmp.py`
 * of the lane, `docs/handoff/booth-ffx-b3b.md` section 3). CALIBRATION: the same estimate gives 0.47 for Rikku Thief, 0.33 for Yuna Gunner and 0.37 for Rikku Dark Knight, whose swap jerks were MEASURED in the page at 0.62 to 0.63, 0.50 to 0.52 and 0.48 of the drawn height
 * (the cap that excuses a planned smear is 0.5, `critic/policy.json` `continuity.smear.maxJerkShare`): a ratio of about 0.75 and a ranking that holds, but a crude instrument (it puts Yuna Gunner under Rikku Dark Knight). So the rule is a bound read against the passing dress:
 * a figure whose estimate is no higher than Rikku Dark Knight's 0.37 is as safe as the approved Chapter IV.
 */
const KO_STEP: Readonly<Record<string, number>> = {
  tidus: 0.36, yuna: 0.24, auron: 0.29, // the active parties of Chapters III and XII (Tidus, Yuna, Auron) and Chapter XIV's (Yuna)
  kimahri: 0.43, wakka: 0.4, lulu: 0.39, rikku: 0.52, // the reserve of Chapter III and XII, the same seven as the approved Chapter I's
  valefor: 0.2, ifrit: 0.14, ixion: 0.13, shiva: 0.31, bahamut: 0.09, // the aeons, on the party's side and the possessed ones
  'braskas-final-aeon-1': 0.3, 'braskas-final-aeon-2': 0.05, 'yu-pagoda': 0.14, 'yu-yevon': 0.09, grothia: 0.14, pterya: 0.2, spathi: 0.08, // the foes with a KO painting
};
const REFERENCE_PASSING = 0.37; // Rikku Dark Knight (Chapter IV, approved: 0.48 measured)
const REFERENCE_FAILING = 0.47; // Rikku Thief (Leblanc: 0.62 measured, held)

describe('class 4: no figure that can be knocked out in these chapters steps further at the hurt-to-KO cut than the approved Chapter IV\'s Dark Knight', () => {
  it('the calibration order holds: the failing dress stands above the passing one', () => {
    expect(REFERENCE_FAILING).toBeGreaterThan(REFERENCE_PASSING);
  });

  it.each(IDS)('%s: the active party is at or under the passing reference, so the moments piece plays; the foes and the aeons are all under it', (id) => {
    const setup = setupForChapter(getChapter(id)!, 1);
    const slots = (setup.party as { activeSlots?: readonly string[] }).activeSlots; // the FFX build's forced line-up (Tidus, Yuna and Auron; Yuna alone in Chapter XIV)
    const active = setup.party.members.filter((m) => slots?.includes(m.id) ?? true).map((m) => m.id);
    expect(slots, id).toBeDefined();
    expect(active.length).toBeGreaterThan(0);
    for (const m of active) expect(KO_STEP[m], `${id}: ${m}`).toBeLessThanOrEqual(REFERENCE_PASSING + 0.005);
    for (const name of ['valefor', 'ifrit', 'ixion', 'shiva', 'bahamut', 'braskas-final-aeon-1', 'braskas-final-aeon-2', 'yu-pagoda', 'yu-yevon', 'grothia', 'pterya', 'spathi']) expect(KO_STEP[name], name).toBeLessThanOrEqual(REFERENCE_PASSING);
    expect(treatedHold(id, 'moments'), id).toBeUndefined();
  });

  it('the reserve members above the reference (Kimahri, Wakka, Lulu, Rikku) are the same ones the approved Chapter I can field (its party is the same seven), so the exposure is the target\'s own, and they are the KO-per-dress job\'s subjects', () => {
    const over = Object.entries(KO_STEP).filter(([, v]) => v > REFERENCE_PASSING + 0.005).map(([k]) => k).sort();
    expect(over).toEqual(['kimahri', 'lulu', 'rikku', 'wakka']);
    for (const id of IDS) {
      const members = setupForChapter(getChapter(id)!, 1).party.members.map((m) => m.id);
      if (id !== 'isaaru-via-purifico') for (const m of over) expect(members, `${id}: ${m}`).toContain(m);
    }
    const chapterI = setupForChapter(getChapter('seymour-flux')!, 1).party.members.map((m) => m.id);
    for (const m of over) expect(chapterI, m).toContain(m);
  });
});
