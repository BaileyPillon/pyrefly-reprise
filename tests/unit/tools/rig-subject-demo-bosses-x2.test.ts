/**
 * **The demo bosses' second build, `-x2`** (r61-rigs, 2026-10-21): the same two rigs as `ffx2-bahamut-x` (FFX-2 ONLY: Chapter IV's Bahamut) and `seymour-flux-x` (FFX ONLY: Chapter I's Seymour Flux), with two
 * changes. (1) FOC60-01 of the release 60 focused review: CHK-026's head reading is the head part's MESH area (`critic/runner/lib/continuity-rig.mjs`), the lane held the head's OPAQUE area (`scaleArea` of 1.15 to 1.39
 * made the mesh 15 to 39 percent bigger than the idle's, an 18 percent change of the head's size at the swap): the head variants now name `opaqueArea` and `meshArea` (both the idle head), so the two readings are one number.
 * (2) the HD-2D look's normal pieces (`build.normals`, `rig_normals.py`). Nothing else differs: this holds that, so a later lane cannot drift the second build from the first by accident. No art is read.
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (f: string): any => JSON.parse(readFileSync(f, 'utf8'));
const pairs = [
  { x: 'ffx2-bahamut-x', x2: 'ffx2-bahamut-x2', art: 'ffx2-bahamut', parts: ['body', 'head', 'tail', 'wingL', 'wingR'] },
  { x: 'seymour-flux-x', x2: 'seymour-flux-x2', art: 'seymour-flux-body', parts: ['arm', 'body', 'hairM', 'hairU', 'head', 'leg'] },
];
const POSES = ['attack', 'cast', 'hurt', 'ko', 'telegraph'];
/** The same JSON (a `-0` the lane's tools wrote and a `0` the copy wrote are the same number in a file). */
const same = (x: unknown, y: unknown, why = ''): void => expect(JSON.stringify(x), why).toBe(JSON.stringify(y));

for (const p of pairs) {
  describe(`${p.x2} against ${p.x}`, () => {
    const a = read(`tools/rig/subjects/${p.x}.json`);
    const b = read(`tools/rig/subjects/${p.x2}.json`);

    it('is the same figure: the art id, scale, costume, cut, skeleton, skin, fit, marks and motion are the first build\'s', () => {
      expect(b.subject).toBe(p.art);
      for (const k of ['subject', 'scale', 'costume', 'hooks', 'cut', 'fit', 'landmarks', 'authored', 'motion']) same(b[k], a[k], k);
      same(b.build.bones, a.build.bones);
      same(b.build.skin, a.build.skin);
      expect(Object.keys(b.build.variants).sort()).toEqual([...p.parts].sort());
    });

    it('cuts every variant but the head\'s exactly as the first build did', () => {
      for (const part of p.parts.filter((n) => n !== 'head')) same(b.build.variants[part], a.build.variants[part], part);
    });

    it('holds each head piece by the OPAQUE area and the MESH area of the idle head (both 1), where the first build tuned scaleArea for the opaque area alone', () => {
      for (const pose of POSES) {
        const was = a.build.variants.head[pose].from_painting;
        const now = b.build.variants.head[pose].from_painting;
        expect(was.scaleArea, `${pose}: the first build`).toBeGreaterThan(1);
        expect(now.scaleArea, pose).toBeUndefined();
        expect(now.opaqueArea, pose).toBe(1);
        expect(now.meshArea, pose).toBe(1);
        const { scaleArea: _s, opaqueArea: _o, meshArea: _m, ...rest } = now;
        const { scaleArea: _s2, ...restWas } = was;
        same(rest, restWas, `${pose}: the cut, the mask, the mesh steps and the texture scale are the first build's`);
      }
    });

    it('asks for the normal pieces from the maps folder at 0.3 of the master', () => {
      expect(b.build.normals).toEqual({ dir: 'D:/pyrefly-art-maps', scale: 0.3 });
      expect(a.build.normals).toBeUndefined();
    });
  });
}
