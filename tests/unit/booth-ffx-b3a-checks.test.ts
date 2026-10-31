/**
 * THE DEFECT CLASSES OF THE BOOTH TREATMENT, CHECKED FOR THE THREE CHAPTERS OF BATCH 3a (release 71, branch `booth-ffx-b3a`; FFX only; Bailey 2026-10-30). Seven classes were found in batches 1 and 2; this file is the offline half of each for Chapters VII, X and IX, with the
 * number it stands on (`docs/handoff/booth-ffx-b3a.md` section 4 has the rest and the browser jobs that read what a unit test cannot):
 *  (1) a title or mark outliving a chained link: none of the three is a chain (`booth-ffx-b3a-fights`);
 *  (2) a script cutting the camera to a rig the scene draws by position, while a camera piece runs on top: walked below;
 *  (3) the follower pushing a figure out of the viewport: the follower is FFX-2's; the FFX director is shot-based (it plays a run only while an action does) and carries a never-crop fit; the victory close-up it takes is read here against the two beats the scenes author by hand;
 *  (4) the knock-out cut over 0.5 of the drawn height: not computable from the registration table; held with the recorded numbers (`booth-treated-chapters` pins the hold texts that cite them);
 *  (5) a form change cueing a freeze: none of the three has one, and the guard is shared (`booth-yunalesca-forms`);
 *  (6) a swap-scope exception must hold the smear: none of the three is one (`booth-hold-guard` iterates the list and covers them);
 *  (7) `public/fx` is gitignored: nothing here compares pixels.
 */
import { describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { SCOPE_EXCEPTIONS } from '../../src/engine/motion/SwapSwitch.ts';
import { AUTO_STAGES, SCRIPTED_RIGS } from '../../src/engine/procam/ProAutoStage.ts';
import { PRO_SHOTS } from '../../src/data/procam/proShots.ts';
import { lengthOf, registerKeys, registrationOf, sampleKeys } from '../../src/engine/procam/ProTrack.ts';
import { MACALANIA_TEMPLE_RIGS } from '../../src/scenes/macalania-temple.ts';
import { HIGHBRIDGE_RIGS } from '../../src/scenes/highbridge.ts';
import { CAVERN_STOLEN_FAYTH_RIGS, CAVERN_STOLEN_FAYTH_SLOTS } from '../../src/scenes/cavern-stolen-fayth.ts';
import { MACALANIA_TEMPLE_SLOTS } from '../../src/scenes/macalania-temple.ts';
import { CAVERN_PLATE, platePoint } from '../../src/scenes/cavern-stolen-fayth.ts';

const IDS = ['seymour-anima-macalania', 'seymour-natus', 'yojimbo-cavern'] as const;
const RIGS: Record<(typeof IDS)[number], Readonly<Record<string, unknown>>> = {
  'seymour-anima-macalania': MACALANIA_TEMPLE_RIGS,
  'seymour-natus': HIGHBRIDGE_RIGS,
  'yojimbo-cavern': CAVERN_STOLEN_FAYTH_RIGS,
};

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

describe('(2) the story scripts cut only to rigs every scene has, never to a rig drawn by position', () => {
  it.each(IDS)('%s: every camera cut of its scripts is one of the scene\'s own rigs and a base one (idle, action, victory...); the two bespoke rigs of the Macalania arrival are cut by the scene\'s arrival director, never by a script', (id) => {
    const cuts = cameraCuts(getChapter(id)!.scriptsRef);
    expect(cuts.size).toBeGreaterThan(0);
    const rigs = Object.keys(RIGS[id]);
    for (const rig of cuts) {
      expect(rigs, `${id} ${rig}`).toContain(rig);
      expect(['anima-low', 'anima'], `${id} ${rig}`).not.toContain(rig);
    }
  });

  it('`SCRIPTED_RIGS` and `AUTO_STAGES` (the FFX-2 follower\'s tables) name none of the three: the follower is FFX-2\'s, and the FFX director plays a run only while an action does', () => {
    for (const id of IDS) {
      expect(Object.keys(SCRIPTED_RIGS), id).not.toContain(id);
      expect(Object.keys(AUTO_STAGES), id).not.toContain(id);
      expect(getChapter(id)!.game).toBe('ffx');
    }
  });

  it('(6) none of the three is a swap-scope exception, so the smear hold of `booth-hold-guard` has nothing to hold here', () => {
    for (const id of IDS) expect(Object.keys(SCOPE_EXCEPTIONS), id).not.toContain(id);
  });
});

describe('(3) what the real victory close-up keeps in frame, against the beat each scene authors by hand (offline; the shot unfit, as the director lays it before the never-crop dolly)', () => {
  const rad = Math.PI / 180;
  type V3 = [number, number, number];
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a: V3, b: V3): number => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a: V3): V3 => {
    const l = Math.hypot(...a);
    return [a[0] / l, a[1] / l, a[2] / l];
  };
  /** Is the point inside the 16:9 frame of this pose? */
  function inFrame(pos: V3, look: V3, fov: number, p: V3): boolean {
    const f = norm(sub(look, pos));
    const r = norm(cross(f, [0, 1, 0]));
    const u = cross(r, f);
    const d = sub(p, pos);
    const z = dot(d, f);
    if (z <= 0.01) return false;
    const tv = Math.tan((fov * rad) / 2);
    return Math.abs(dot(d, r) / (z * tv * (16 / 9))) <= 1 && Math.abs(dot(d, u) / (z * tv)) <= 1;
  }
  /** Of the victory close-ups laid on this stage (every variant of every character that has a row, once per party slot as the actor), how many keep the point in frame at the shot's last key. */
  function victoryShare(party: Array<[number, number, number]>, boss: [number, number, number], height: number, point: V3): { layings: number; end: number; perChar: Record<string, [number, number]> } {
    let layings = 0;
    let end = 0;
    const perChar: Record<string, [number, number]> = {};
    for (const [group, list] of Object.entries(PRO_SHOTS)) {
      if (!group.startsWith('victory.')) continue;
      for (const row of list) {
        for (const actor of party) {
          const live = { actor, target: boss, height };
          const keys = registerKeys(row, live, registrationOf(row, live, 'party'));
          const e = sampleKeys(keys, lengthOf(keys));
          const ok = inFrame(e.pos as V3, e.look as V3, e.fov, point);
          layings++;
          if (ok) end++;
          const c = (perChar[group] ??= [0, 0]);
          c[0]++;
          if (ok) c[1]++;
        }
      }
    }
    return { layings, end, perChar };
  }

  it("Chapter VII: Seymour's body (he lies where he fell and stays through the victory, D-046) is in frame at the last key of 2 of the 18 victory close-ups: 0 of 6 for Tidus, 0 of 6 for Yuna, 2 of 6 for Kimahri; Rikku has no victory row at all, so the scene's own victory rig plays whenever she acts last", () => {
    const v = victoryShare(MACALANIA_TEMPLE_SLOTS.party as Array<[number, number, number]>, [2.5, 0, -5.8], 1.75, [2.5, 0.15, -5.8]);
    expect(v.layings).toBe(18);
    expect(v.end).toBe(2);
    expect(v.perChar['victory.tidus']).toEqual([6, 0]);
    expect(v.perChar['victory.yuna']).toEqual([6, 0]);
    expect(v.perChar['victory.kimahri']).toEqual([6, 2]);
    expect(Object.keys(PRO_SHOTS).filter((g) => g === 'victory.rikku' || g === 'victory.lulu')).toEqual([]);
  });

  it("Chapter IX: the lit pad (the plate pixel the scene wakes after Yojimbo is recalled) is in frame at the last key of 4 of the 18 close-ups (0 of 6 for Yuna, 4 of 6 for Kimahri, and Tidus has a row too); Lulu has no victory row, so the scene's own victory rig plays whenever she acts last", () => {
    const pad = platePoint(CAVERN_PLATE.pad.cx, CAVERN_PLATE.pad.cy);
    const v = victoryShare(CAVERN_STOLEN_FAYTH_SLOTS.party as Array<[number, number, number]>, [2.75, 0, -2.0], 1.75, pad);
    expect(v.layings).toBe(18);
    expect(v.end).toBe(4);
    expect(v.perChar['victory.yuna']).toEqual([6, 0]);
    expect(v.perChar['victory.kimahri']).toEqual([6, 4]);
  });
});
