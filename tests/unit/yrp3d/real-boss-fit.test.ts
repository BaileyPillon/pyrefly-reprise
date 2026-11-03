/**
 * **The game's Bahamut stands on the floor, at the height the staging names, inside the picked frame** (ch-yrp review MAJOR-4, 2026-11-02; FFX-2 only). The real model's default pose is centred on his middle (wings spread, 87.85 tall,
 * from 57 below the origin to 31 above) and his idle stands on the floor (57 tall), so the old fit by the default pose left the idle floating 2.6 world units up with his horns at 6.5, and his size was never what the staging named.
 * `YrpModel` now fits him by the pose he rests in (`layout.ts` `fitBoxOf`), and `BOSS_HEIGHT` (4.5) is the height of that idle silhouette. This reads the real files (local only: **skipped without `public/models-exp`**, the release
 * tree's junction runs it) through three's real loader and the chapter's own `YrpModel`, and pins, by every vertex of the posed mesh (16,179 on the HD file):
 *
 * 1. **Grounded**: the lowest vertex of the idle is on the floor, and the silhouette is `BOSS_HEIGHT` tall; the girls are unchanged (their default pose already stands on the floor).
 * 2. **The game's proportion is kept in his model**: his idle over a girl's is 3.3 to 3.7 (the sources: 3.3, \`research/ffx2-bahamut.md\` 9.3); the staging shows less of it (2.4) so the picked frame can hold him, and says so.
 * 3. **In frame b** (the default camera): through the lens at 16:9 and 4:3, the idle's horns are 5 percent of the frame below its top or more, the cast pose's 1 percent or more, his feet land above the HUD band, and the far wing
 *    tip leaves the left edge by no more than a fifth of the width at 16:9.
 *
 * Game case: FFX-2 only (Chapter IV's Bahamut).
 */
import { existsSync, readFileSync } from 'node:fs';
import { Box3 } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { describe, expect, it } from 'vitest';

import { IDLE_B } from '../../../src/engine/yrp3d/frames.ts';
import { BOSS_HEIGHT, BOSS_SPOT, BOSS_YAW, PARTY_HEIGHT, project } from '../../../src/engine/yrp3d/layout.ts';
import { plansFor } from '../../../src/engine/yrp3d/clipMap.ts';
import { chrScaleOf } from '../../../src/engine/yrp3d/load.ts';
import { YrpModel } from '../../../src/engine/yrp3d/model.ts';
import { parseReal, worldVertices } from '../helpers/yrpReal.ts';

const DIR = 'public/models-exp/yrp';
const HD = 'public/models-exp/yrp-hd';
const have = existsSync(`${HD}/bahamut.glb`) && existsSync(`${DIR}/bahamut-anims.glb`) && existsSync(`${DIR}/clipmap.json`) && existsSync(`${DIR}/yuna.glb`) && existsSync(`${DIR}/yuna-anims.glb`);
const map = have ? (JSON.parse(readFileSync(`${DIR}/clipmap.json`, 'utf8')) as unknown) : null;

type Parsed = Awaited<ReturnType<typeof parseReal>>;
const cache = new Map<string, Promise<Parsed>>();
const load = (path: string): Promise<Parsed> => {
  let p = cache.get(path);
  if (!p) cache.set(path, (p = parseReal(path)));
  return p;
};

/** A model as the chapter builds it (the shipped boss: the HD mesh with the base folder's clips), standing at `spot` turned by `yaw`. */
async function build(id: 'yuna' | 'bahamut', height: number, spot = BOSS_SPOT, yaw = BOSS_YAW): Promise<YrpModel> {
  const mesh = await load(id === 'bahamut' ? `${HD}/bahamut.glb` : `${DIR}/${id}.glb`);
  const anims = await load(`${DIR}/${id}-anims.glb`);
  const plans = plansFor(id, map, anims.animations.map((c) => c.name));
  const m = new YrpModel(id, clone(mesh.scene), anims.animations, height, 'own', { plans, chrScale: chrScaleOf(mesh.scene.userData as Record<string, unknown>) });
  m.root.position.set(spot[0], spot[1], spot[2]);
  m.setYaw(yaw);
  return m;
}

const posedBox = (m: YrpModel): Box3 => new Box3().setFromPoints(worldVertices(m.root));

/** Where the posed model's vertices land on a 16:9 or 4:3 window through frame b: the extent as fractions of the frame. */
function screenExtent(m: YrpModel, aspect: number): { left: number; right: number; top: number; bottom: number } {
  const pts = worldVertices(m.root).map((v) => project(IDLE_B, aspect, [v.x, v.y, v.z]));
  return { left: Math.min(...pts.map((p) => p.x)), right: Math.max(...pts.map((p) => p.x)), top: Math.min(...pts.map((p) => p.y)), bottom: Math.max(...pts.map((p) => p.y)) };
}

describe.skipIf(!have)('the game\'s Bahamut on the real files (local only)', () => {
  it('stands on the floor in his idle, BOSS_HEIGHT tall (he used to float 2.6 up, 3.9 tall, with his horns at 6.5)', async () => {
    const boss = await build('bahamut', BOSS_HEIGHT);
    const box = posedBox(boss);
    expect(box.min.y, 'the lowest vertex is on the floor').toBeGreaterThan(-0.05);
    expect(box.min.y).toBeLessThan(0.08);
    expect(box.max.y - box.min.y, 'the idle silhouette is the staging height').toBeGreaterThan(BOSS_HEIGHT * 0.97);
    expect(box.max.y - box.min.y).toBeLessThan(BOSS_HEIGHT * 1.03);
    for (let t = 0; t < 2; t += 1 / 30) boss.update(1 / 30);
    const later = posedBox(boss);
    expect(later.min.y, 'still on the floor two seconds on').toBeGreaterThan(-0.1);
    expect(later.min.y).toBeLessThan(0.12);
    expect(later.max.y).toBeLessThan(BOSS_HEIGHT * 1.05);
  }, 120_000);

  it('leaves the girls as they were: Yuna\'s default pose already stands on the floor, so her fit is by it', async () => {
    const yuna = await build('yuna', PARTY_HEIGHT, [0, 0, 0], 0);
    expect(yuna.trueHeight).toBeGreaterThan(16.2); // the default pose's 16.5, not the idle's 16.0
    const box = posedBox(yuna);
    expect(box.min.y).toBeGreaterThan(-0.05);
    expect(box.min.y).toBeLessThan(0.08);
    expect(box.max.y).toBeLessThan(PARTY_HEIGHT * 1.05);
  }, 120_000);

  it('keeps the game\'s proportion in his model: his idle over Yuna\'s is 3.3 to 3.7 (the sources say 3.3 in battle)', async () => {
    const boss = await build('bahamut', BOSS_HEIGHT);
    const yuna = await build('yuna', PARTY_HEIGHT, [0, 0, 0], 0);
    const ratio = boss.trueHeight / yuna.trueHeight;
    expect(ratio).toBeGreaterThan(3.3);
    expect(ratio).toBeLessThan(3.7);
    expect(BOSS_HEIGHT / PARTY_HEIGHT, 'the staging shows less of it so the picked frame can hold him').toBeLessThan(ratio);
  }, 120_000);

  it('is inside frame b: the horns clear the top (idle 5 percent, cast 1), the feet clear the HUD band, the far wing tip leaves the left edge by under a fifth at 16:9', async () => {
    const boss = await build('bahamut', BOSS_HEIGHT);
    for (const aspect of [16 / 9, 4 / 3]) {
      const idle = screenExtent(boss, aspect);
      expect(idle.top, `idle top at ${aspect.toFixed(2)}`).toBeGreaterThan(0.05);
      expect(idle.bottom, `idle feet at ${aspect.toFixed(2)}`).toBeLessThan(0.9);
    }
    const wide = screenExtent(boss, 16 / 9);
    expect(wide.left).toBeGreaterThan(-0.2);
    expect(wide.right, 'his tail and wing do not reach the girls\' row').toBeLessThan(0.5);
    boss.noteOpen('cast', 0.5);
    for (let t = 0; t < 1; t += 1 / 30) boss.update(1 / 30);
    for (const aspect of [16 / 9, 4 / 3]) expect(screenExtent(boss, aspect).top, `cast top at ${aspect.toFixed(2)}`).toBeGreaterThan(0.01);
  }, 120_000);
});
