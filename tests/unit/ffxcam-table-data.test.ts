/**
 * **The Evrae fight's shot table, as shipped** (`src/data/ffx/camera/evrae-shots*.ts`, written by `tools/ffxcam-table-build.mjs`; FFX only): the website's camera. These are the data's guards; the director that plays
 * it is `ffxcam-table-director.test.ts`'s. What this file pins:
 *
 * 1. **It is our own table of numbers, not the game's scripts**: the header says where it came from; no instruction name, no program id, no script key is in the source; every number is a pose or a curve.
 * 2. **It is well formed**: keys in step order, each reached by a cut, a linear or cosine blend, or a trapezoid whose phases add up to the blend; every id a route, a row or a view names exists and is of the right kind;
 *    cell keys, weights and branch totals are as the director reads them; every row is an ability, item or plain Attack the engine has.
 * 3. **Variant B holds**: at every step of every shot the eye's azimuth about the look-at is within 35 degrees of the near default view's and the look direction's pitch is inside the plate's band (to the fit's
 *    tolerance), and the default views, the victory and the defeat are wholly on the painting at 16:9; the action shots and the scenes are as on it as measured (below).
 * 4. **The near default view is FFX's own**, to 0.01.
 * 5. **It is small enough to ship**: no source file over the house 400 lines, the whole under a size.
 *
 * The measured coverage (`node tools/ffxcam-plate.mjs --table`) is pinned loosely so a rebuild that gets worse fails. The plate is one painting, so the build does not bake a shot that leaves it by more than a tenth
 * of the frame for half a second (a spell cast at Evrae at FAR, Cid's missiles, the Move in): those are `''` (the camera keeps the shot it had) and, for the scene, a still of the default view it started from.
 * Game case: FFX only.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { EVRAE_SHOTS } from '../../src/data/ffx/camera/evrae-shots.ts';
import type { Branch, ShotDef } from '../../src/data/ffx/camera/shotTypes.ts';
import { ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { coverageOf, paintedWorld } from '../../src/engine/ffxcam/plateFit.ts';
import { poseAt } from '../../src/engine/ffxcam/shotTrack.ts';
import { FFXCAM_B_AZIMUTH_LIMIT_DEG, FFXCAM_B_PITCH_MAX_DEG, FFXCAM_B_PITCH_MIN_DEG, azimuthDeg, pitchDeg } from '../../src/engine/ffxcam/variant.ts';
import { FFX_NEAR_VIEW } from '../../src/engine/ffx3d/ffxStaging.ts';
import { ffxEye } from '../../src/engine/ffx3d/ffxWorld.ts';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATA = join(REPO, 'src', 'data', 'ffx', 'camera');
const files = readdirSync(DATA).filter((f) => /^evrae-shots.*\.ts$/.test(f));
const texts = files.map((f) => ({ f, text: readFileSync(join(DATA, f), 'utf8') }));
const all = texts.map((t) => t.text).join('\n');
const T = EVRAE_SHOTS;
const shotIds = Object.keys(T.shots);
const wrap = (deg: number): number => ((((deg + 180) % 360) + 360) % 360) - 180;
const lastStep = (s: ShotDef): number => s.keys[s.keys.length - 1]![0];
const branchLists = (): Array<readonly Branch[]> => [
  ...Object.values(T.routes).flatMap((cells) => Object.values(cells)),
  T.scenes.pullBack,
  T.scenes.moveIn,
  T.victory.n,
  T.victory.f,
  ...Object.values(T.defeat),
];

describe('what it is', () => {
  it('says where it came from: derived by replaying the programs from Bailey\'s own copy, simplified to keyframes and clamped (variant B); not the game\'s scripts', () => {
    const head = (texts.find((t) => t.f === 'evrae-shots.ts')?.text ?? '').split('*/')[0]!.replace(/\s+/g, ' ');
    expect(head).toContain("Derived by replaying FFX's battle-camera programs for the Evrae fight from Bailey's own copy, simplified to keyframes and clamped (variant B); not the game's scripts");
    expect(head).toContain('numbers only');
    expect(T.format).toBe('echoes-evrae-shots/1');
  });

  it('holds no program instruction: no call name, no program or script id, no script key, no `op`, no condition', () => {
    const code = all.replace(/\/\*[\s\S]*?\*\//g, ''); // the headers are prose
    const banned = [/\b(?:cam|ref)(?:Set|Move|Reset|Wait|Req)\w*/, /\bbtl[A-Z]\w*/, /\breadBtlChrProperty\b/, /\b(?:camRand|GetRandomValue|chosenCommand|countChrOverlap)\b/, /hiku15/, /system_01/, /\bentryIndex\b/, /ffx-cam-ir/, /\bop\s*:/, /\bworker\b/, /\bwait\s*\(/, /\bswitch\b/, /\bjmp\b/, /\bif\s*\(/, /=>/];
    for (const re of banned) expect(code.match(re)?.[0], String(re)).toBeUndefined();
    // what is there is data: after the import lines, `export const` and the object, every character is a number, a quote, a bracket, a key name or a separator
    expect(code).not.toMatch(/function\s|\bclass\s|\bnew\s|\breturn\b|\bfor\s*\(/);
  });

  it('is small enough to ship, and no source file passes the house 400 lines', () => {
    for (const { f, text } of texts) expect(text.split('\n').length, f).toBeLessThan(400);
    expect(all.length).toBeLessThan(160_000);
    expect(shotIds.length).toBeLessThan(200);
    expect(shotIds.reduce((n, id) => n + T.shots[id]!.keys.length, 0)).toBeLessThan(3000);
  });
});

describe('it is well formed', () => {
  it('every shot has keys in step order, the first a cut at step 0, every trapezoid\'s phases adding up to its blend, a positive lens, and a length no shorter than its last motion', () => {
    for (const id of shotIds) {
      const s = T.shots[id]!;
      expect(s.keys.length, id).toBeGreaterThan(0);
      expect(s.keys[0]![0], id).toBe(0);
      expect(s.keys[0]![5], id).toBe(0);
      expect(s.len, id).toBeGreaterThanOrEqual(lastStep(s));
      expect(['default', 'scene', 'victory', 'defeat', 'action'], id).toContain(s.kind);
      let prev = -1;
      for (const k of s.keys) {
        expect(k[0], id).toBeGreaterThan(prev);
        prev = k[0];
        for (const n of [...k[1], ...k[2], k[3], k[4]]) expect(Number.isFinite(n), id).toBe(true);
        expect(k[4], id).toBeGreaterThan(0);
        const shape = k[5];
        if (Array.isArray(shape)) {
          expect(shape[0], id).toBe(3);
          const before = s.keys[s.keys.indexOf(k) - 1]!;
          expect(shape[1] + shape[2] + shape[3], `${id} at ${k[0]}`).toBe(k[0] - before[0]);
        } else expect([0, 1, 2], id).toContain(shape);
      }
    }
  });

  it('every id a route, a row, a view, a scene, the victory and the defeat name exists, and is the right kind of shot', () => {
    const kindOf = (id: string): string | undefined => T.shots[id]?.kind;
    for (const bs of branchLists()) for (const [id] of bs) expect(id === '' || T.shots[id] !== undefined, id).toBe(true);
    expect(kindOf(T.views.near)).toBe('default');
    expect(kindOf(T.views.far)).toBe('default');
    for (const [id] of [...T.scenes.pullBack, ...T.scenes.moveIn]) expect(kindOf(id)).toBe('scene');
    for (const [id] of [...T.victory.n, ...T.victory.f]) expect(kindOf(id)).toBe('victory');
    for (const bs of Object.values(T.defeat)) for (const [id] of bs) expect(kindOf(id)).toBe('defeat');
    for (const [row, r] of Object.entries(T.rows)) {
      for (const routeId of [r.open, r.launch]) if (routeId !== undefined) expect(T.routes[routeId], `${row} -> ${routeId}`).toBeDefined();
      expect(r.open ?? r.launch, row).toBeDefined();
    }
    for (const id of shotIds) expect(shotIds.includes(id)).toBe(true);
  });

  it('cell keys, weights and totals are as the director reads them: range, slot and target, weights positive integers, and every cell of a route drawn the same number of times', () => {
    for (const [routeId, cells] of Object.entries(T.routes)) {
      const totals = new Set<number>();
      for (const [cell, bs] of Object.entries(cells)) {
        expect(cell, `${routeId} ${cell}`).toMatch(/^[nf*][012m*](?:e|s|p|x|a[012]|\*)$/);
        let total = 0;
        for (const [, w] of bs) {
          expect(Number.isInteger(w) && w > 0, `${routeId} ${cell}`).toBe(true);
          total += w;
        }
        totals.add(total);
      }
      expect(totals.size, routeId).toBe(1);
    }
    for (const k of Object.keys(T.defeat)) expect(k).toMatch(/^[nf][012]$/);
  });

  it('every row is an ability, an item or the plain Attack of a side that the engine has', () => {
    for (const row of Object.keys(T.rows)) {
      if (row.startsWith('@attack.')) expect(['@attack.party', '@attack.monster']).toContain(row);
      else expect(row in ABILITIES || row in ITEMS, row).toBe(true);
    }
  });
});

describe('variant B holds', () => {
  const centre = FFX_NEAR_VIEW.thetaDeg;
  const world = paintedWorld();

  it('at every step of every shot: the azimuth within 35 degrees of the near default view\'s and the pitch in the plate\'s band, to the fit\'s tolerance', () => {
    let worstAz = 0;
    let worstHigh = -Infinity;
    let worstLow = Infinity;
    for (const id of shotIds) {
      const s = T.shots[id]!;
      for (let t = 0; t <= Math.max(s.len, lastStep(s)); t++) {
        const p = poseAt(s, t);
        const az = azimuthDeg(p);
        if (az !== null) worstAz = Math.max(worstAz, Math.abs(wrap(az - centre)));
        const pitch = pitchDeg(p);
        if (pitch !== null) {
          worstHigh = Math.max(worstHigh, pitch);
          worstLow = Math.min(worstLow, pitch);
        }
      }
    }
    expect(worstAz).toBeLessThanOrEqual(FFXCAM_B_AZIMUTH_LIMIT_DEG + 1.5); // the fit lets the eye stand half a unit off its path, and a close eye is a degree
    expect(worstHigh).toBeLessThanOrEqual(FFXCAM_B_PITCH_MAX_DEG + 0.7);
    expect(worstLow).toBeGreaterThanOrEqual(FFXCAM_B_PITCH_MIN_DEG - 0.7);
  });

  it('the near default view is FFX\'s own, to 0.01, and is wholly on the painting; the far default is too', () => {
    const near = poseAt(T.shots[T.views.near]!, 0);
    const eye = ffxEye(FFX_NEAR_VIEW);
    near.eye.forEach((n, i) => expect(n).toBeCloseTo(eye[i]!, 1));
    near.ref.forEach((n, i) => expect(n).toBeCloseTo(FFX_NEAR_VIEW.ref[i]!, 1));
    expect(near.scrDpt).toBe(1024);
    for (const id of [T.views.near, T.views.far]) {
      for (const aspect of [4 / 3, 16 / 9]) expect(coverageOf(world, poseAt(T.shots[id]!, 0), aspect).covered, `${id} ${aspect}`).toBeGreaterThanOrEqual(0.995);
    }
  });

  it('the default views, the victory and the defeat are wholly on the painting at 16:9 at every step; the action shots and the scenes are mostly (the numbers the build measured)', () => {
    const stats: Record<string, { steps: number; sum: number; full: number }> = {};
    for (const id of shotIds) {
      const s = T.shots[id]!;
      const k = (stats[s.kind] ??= { steps: 0, sum: 0, full: 0 });
      for (let t = 0; t <= Math.max(s.len, lastStep(s)); t++) {
        const c = coverageOf(world, poseAt(s, t), 16 / 9).covered;
        k.steps++;
        k.sum += c;
        if (c >= 0.99) k.full++;
      }
    }
    for (const kind of ['default', 'victory', 'defeat']) expect(stats[kind]!.full, kind).toBe(stats[kind]!.steps);
    expect(stats['action']!.sum / stats['action']!.steps).toBeGreaterThan(0.98); // measured 99.7 percent of the frame on the painting
    expect(stats['action']!.full / stats['action']!.steps).toBeGreaterThan(0.9); // and 95 percent of the steps wholly
    expect(stats['scene']!.sum / stats['scene']!.steps).toBeGreaterThan(0.97); // measured 99 percent
  });
});
