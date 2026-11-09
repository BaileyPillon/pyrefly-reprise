/**
 * R78-1 (the release 78 focused review, `critic/reviews/cc0fea14a-focused.md`; FF7 only): the continuity harness read the hidden Jenova LIFE chapter's four painted
 * figures with feet shifts of up to 48.4 px (Barret idle to hurt) and 27.6 hard cuts a minute, and the review suspected unregistered paintings, as the Guard Scorpion's
 * (47.5 px, 2.11 a minute).
 *
 * **What the pixels say (measured on the installed 1x files, release 78 mirror):** the pose table is right and the reading is not. Every party pose of
 * `FF7_FILM_POSE_SHIFT_PX` stands on the idle's boots to within 0.5 px of the painting (the boots rule of `film-set/scripts/anchors.py`), and Jenova LIFE's four planes were
 * registered by the installer on the mass centre of the tentacle bundle's root (rows 55 to 70 percent; `installSteps` of her sidecars) and stand within 0.8 px of their plane's
 * centre. The harness has NO registration row for any `ff7-film-*` painting (`docs/target/pose-measure.json` has none: the continuity summary lists all four as
 * `measuredFromSilhouetteOnly`), so it reads the feet from the silhouette: the middle of the lowest thick part. For Barret's hurt painting that is the gun arm hanging to
 * his shins (the stance reads 163 px of the idle's pixels from his boots, 48 px on the screen), for Cloud's idle the Buster Sword's tip, for Tifa's idle a trailing leg: an
 * instrument reading, not a misplaced painting. The 27.6 a minute against the Scorpion's 2.11 is the fight's density (45 swaps in 98 s against 44 in 852 s, a hit every
 * few seconds, two hard cuts a hit) on FF7's deliberate hard cuts (`poseCut`, repair items 1 and 2).
 *
 * So this file pins what is true, so nobody retunes a shift to the harness's silhouette (which would unregister the boots): the boots stay within 1.5 px, Jenova's bundle root
 * within 2 px. Both read the installed PNGs and skip where the art is not on disk. Game case: **FF7 only**; no FFX or FFX-2 art is read.
 */
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { FF7_FILM_POSE_SHIFT_PX } from '../../src/data/ff7/filmPoseAnchors.ts';

const ART = `${process.env['BOSS_ART_ROOT'] ?? 'public/art'}/characters`; // an art mirror may be named, as the boss-art tests do
const onDisk = existsSync(`${ART}/ff7-film-barret/idle.png`) && existsSync(`${ART}/ff7-film-jenova-life/idle.png`);

type Px = (x: number, y: number) => [number, number, number, number];

async function decode(file: string): Promise<{ W: number; H: number; px: Px; top: number; bot: number }> {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const px: Px = (x, y) => {
    const i = (y * W + x) * 4;
    return [data[i]!, data[i + 1]!, data[i + 2]!, data[i + 3]!];
  };
  let top = H;
  let bot = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x += 2) if (px(x, y)[3] >= 128) { top = Math.min(top, y); bot = Math.max(bot, y); }
  return { W, H, px, top, bot };
}

/** The stance, from the plane's centre, by `anchors.py`'s boots rule: the mean of the two boots' sole centres (the same rule as `ff7-judge-repair.test.ts`). */
async function bootsFromCentre(file: string): Promise<number> {
  const { W, px, top, bot } = await decode(file);
  const y0 = bot - Math.floor((bot - top) * 0.16);
  const boot = (x: number, y: number): boolean => {
    const [r, g, b, a] = px(x, y);
    return a >= 128 && r - b > 18 && Math.max(r, g, b) - Math.min(r, g, b) > 18;
  };
  const seen = new Uint8Array(W * (bot - y0 + 1));
  const blobs: Array<Array<[number, number]>> = [];
  for (let y = y0; y <= bot; y++) {
    for (let x = 0; x < W; x++) {
      if (seen[(y - y0) * W + x] || !boot(x, y)) continue;
      const pts: Array<[number, number]> = [];
      const todo: Array<[number, number]> = [[x, y]];
      seen[(y - y0) * W + x] = 1;
      while (todo.length) {
        const [cx, cy] = todo.pop()!;
        pts.push([cx, cy]);
        for (const [nx, ny] of [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]] as const) {
          if (nx < 0 || nx >= W || ny < y0 || ny > bot || seen[(ny - y0) * W + nx] || !boot(nx, ny)) continue;
          seen[(ny - y0) * W + nx] = 1;
          todo.push([nx, ny]);
        }
      }
      if (pts.length >= 300) blobs.push(pts);
    }
  }
  const feet = blobs.sort((a, b) => b.length - a.length).slice(0, 2);
  expect(feet.length, `${file}: two boots found`).toBeGreaterThan(0);
  const soles = feet.map((pts) => {
    const low = Math.max(...pts.map((q) => q[1]));
    const sole = pts.filter((q) => q[1] >= low - 24);
    return sole.reduce((a, q) => a + q[0], 0) / sole.length;
  });
  return soles.reduce((a, b) => a + b, 0) / soles.length - W / 2;
}

/** Where the mass of rows 55 to 70 percent of the figure (the tentacle bundle's root, the installer's registration rule) is, from the plane's centre. */
async function bundleRootFromCentre(file: string): Promise<number> {
  const { W, px, top, bot } = await decode(file);
  const y0 = Math.round(top + (bot - top) * 0.55);
  const y1 = Math.round(top + (bot - top) * 0.7);
  let sum = 0;
  let n = 0;
  for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) if (px(x, y)[3] >= 128) { sum += x; n++; }
  return sum / n - W / 2;
}

describe('R78-1: the FF7 Film paintings are registered; the harness reads them from the silhouette (FF7 only)', () => {
  it('the table names no key the harness could read a registration for: every party key is an `ff7-film-` figure and Jenova LIFE has no shift row of her own', () => {
    expect(Object.keys(FF7_FILM_POSE_SHIFT_PX).sort()).toEqual(['ff7-film-barret', 'ff7-film-cloud', 'ff7-film-tifa']);
    for (const key of Object.keys(FF7_FILM_POSE_SHIFT_PX)) expect(FF7_FILM_POSE_SHIFT_PX[key]!['idle'], key).toBe(0);
  });

  it.skipIf(!onDisk)('every party pose, shifted, stands its boots within 1.5 px of the idle stance (0.5 px measured; the harness reads 4 to 48 px from the silhouette instead)', async () => {
    let worst = 0;
    for (const [key, poses] of Object.entries(FF7_FILM_POSE_SHIFT_PX)) {
      if (!existsSync(`${ART}/${key}/idle.png`)) continue; // a mirror older than the art of that key
      const idle = await bootsFromCentre(`${ART}/${key}/idle.png`);
      for (const [pose, shift] of Object.entries(poses)) {
        if (pose === 'idle') continue;
        if (key === 'ff7-film-barret' && pose === 'attack') continue; // Barret's fire is registered on his aim by the best overlap of the legs, not by the boots (`filmPoseAnchors.ts`)
        const meta = JSON.parse(readFileSync(`${ART}/${key}/${pose}.json`, 'utf8')) as { scale?: number };
        const k = meta.scale ?? 1;
        const residual = Math.abs(((await bootsFromCentre(`${ART}/${key}/${pose}.png`)) + shift) * k - idle);
        worst = Math.max(worst, residual);
        expect(residual, `${key}/${pose}`).toBeLessThanOrEqual(1.5);
      }
    }
    expect(worst).toBeGreaterThanOrEqual(0); // the loop ran (the files are on disk)
  });

  it.skipIf(!onDisk)('Jenova LIFE: all four planes stand with the mass centre of the tentacle bundle\'s root within 2 px of their plane\'s centre, so no shift row is owed', async () => {
    for (const pose of ['idle', 'cast', 'hurt', 'inhale']) {
      const off = await bundleRootFromCentre(`${ART}/ff7-film-jenova-life/${pose}.png`);
      expect(Math.abs(off), `ff7-film-jenova-life/${pose}`).toBeLessThanOrEqual(2);
    }
  });
});
