/**
 * **Macalania Temple — scene staging and Anima's arrival.**
 *
 * Checked against the pure exports of `src/scenes/macalania-temple.ts` (slots,
 * heights, rigs, backdrop plane) and `src/scenes/macalania-temple-arrival.ts`
 * (the arrival timeline). The factory itself paints canvases and needs a DOM
 * (the standing shape of every scene, `docs/handoff/chapter-leblanc-scene.md`
 * §4); its real-input check is the browser pass in
 * `docs/handoff/chapter-macalania-scene.md`.
 *
 * Unlike the Leblanc scene, the HUD-safe-area claim is **measured** here: the
 * slots are pushed through a real three.js `PerspectiveCamera` on the `idle`
 * rig at 16:9 and every enemy must sit left of the FFX rail (0.79 of the width,
 * `docs/ENGINE-API.md#hud-safe-area`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import {
  ANIMA_HOVER,
  MACALANIA_ENEMY_SLOT,
  MACALANIA_TEMPLE_ACTOR_HEIGHTS as H,
  MACALANIA_TEMPLE_BACKDROP,
  MACALANIA_TEMPLE_RIGS,
  MACALANIA_TEMPLE_SLOTS,
  SEYMOUR_STEP_BACK,
} from '../../../src/scenes/macalania-temple.ts';
import {
  ANIMA_ARRIVAL_CAMERA,
  ANIMA_ARRIVAL_MS,
  animaArrivalAt,
  animaRiseY,
} from '../../../src/scenes/macalania-temple-arrival.ts';
import { seymourAnimaMacalaniaGroup } from '../../../src/data/ffx/enemies/seymour-anima-macalania.ts';

const FFX_HUD_RAIL = 0.79;

function camFor(rig: string): PerspectiveCamera {
  const r = MACALANIA_TEMPLE_RIGS[rig]!;
  const cam = new PerspectiveCamera(r.fov ?? 32, 16 / 9, 0.1, 200);
  const [px, py, pz] = r.position as [number, number, number];
  const [lx, ly, lz] = r.lookAt as [number, number, number];
  cam.position.set(px, py, pz);
  cam.lookAt(new Vector3(lx, ly, lz));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

/** Screen x range (0..1) of a figure of `height` standing at `spot`, width from its painting's aspect. */
function xRange(cam: PerspectiveCamera, spot: [number, number, number], height: number, aspect: number): [number, number] {
  const w = height * aspect;
  const xs = [
    [spot[0] - w / 2, spot[1], spot[2]],
    [spot[0] + w / 2, spot[1], spot[2]],
    [spot[0] - w / 2, spot[1] + height, spot[2]],
    [spot[0] + w / 2, spot[1] + height, spot[2]],
  ].map((p) => (new Vector3(p[0], p[1], p[2]).project(cam).x + 1) / 2);
  return [Math.min(...xs), Math.max(...xs)];
}

// Painted aspect (width / height) from each idle's sidecar (public/art/characters/*/idle.json).
const ASPECT = { seymour: 553 / 1176, guardian: 602 / 1179, anima: 733 / 1203 };

describe('macalania-temple — formation and marks', () => {
  it('has one slot per formation slot, indexed exactly as the data file numbers them', () => {
    const all = [...seymourAnimaMacalaniaGroup.enemies, ...(seymourAnimaMacalaniaGroup.parts ?? [])];
    expect(all).toHaveLength(4);
    for (const e of all) {
      const idx = MACALANIA_ENEMY_SLOT[e.id as keyof typeof MACALANIA_ENEMY_SLOT];
      expect(idx, e.id).toBe(e.slot);
      expect(MACALANIA_TEMPLE_SLOTS.enemy[idx]).toBeDefined();
    }
    expect(MACALANIA_TEMPLE_SLOTS.party).toHaveLength(3);
  });

  it('flanks Seymour with one Guardian either side of him in depth (options.json cast notes, research §9.3)', () => {
    const [a, s, b] = MACALANIA_TEMPLE_SLOTS.enemy as Array<[number, number, number]>;
    expect(a![2]).toBeGreaterThan(s![2]); // A nearer the party
    expect(b![2]).toBeLessThan(s![2]); // B further back
    expect(a![0]).toBeLessThan(s![0]);
    expect(b![0]).toBeGreaterThan(s![0]);
  });

  it('keeps every enemy left of the FFX HUD rail at idle, measured with a real camera', () => {
    const cam = camFor('idle');
    const e = MACALANIA_TEMPLE_SLOTS.enemy as Array<[number, number, number]>;
    const checks: Array<[[number, number, number], number, number]> = [
      [e[0]!, H.guadoGuardian, ASPECT.guardian],
      [e[1]!, H.seymour, ASPECT.seymour],
      [e[2]!, H.guadoGuardian, ASPECT.guardian],
      [[e[3]![0], ANIMA_HOVER, e[3]![2]], H.anima, ASPECT.anima],
      [SEYMOUR_STEP_BACK, H.seymour, ASPECT.seymour],
    ];
    for (const [spot, h, a] of checks) {
      const [l, r] = xRange(cam, spot, h, a);
      expect(l).toBeGreaterThan(0.05);
      expect(r).toBeLessThan(FFX_HUD_RAIL);
    }
  });

  it("uses Seymour's sourced height and keeps the Guardians no taller (research §9.2, §9.3)", () => {
    expect(H.seymour).toBe(1.87);
    expect(H.guadoGuardian).toBeLessThanOrEqual(H.seymour);
    expect(H.anima).toBeGreaterThan(H.seymour * 1.5);
  });

  it("puts the painting's floor seam (0.89 of its height) just above the 3D floor", () => {
    const { width, centreY } = MACALANIA_TEMPLE_BACKDROP;
    const h = width / (2688 / 1536);
    const seam = centreY + h / 2 - 0.89 * h;
    expect(seam).toBeGreaterThan(0);
    expect(seam).toBeLessThan(0.5);
  });
});

describe("macalania-temple — Anima's arrival (A + B's tag, driver's recommendation, INFERRED)", () => {
  it('is one continuous move: every camera step is a timed move, in order, ending on idle', () => {
    let last = -1;
    for (const c of ANIMA_ARRIVAL_CAMERA) {
      expect(c.atMs).toBeGreaterThan(last);
      expect(c.ms).toBeGreaterThan(300);
      expect(MACALANIA_TEMPLE_RIGS[c.rig]).toBeDefined();
      last = c.atMs;
    }
    expect(ANIMA_ARRIVAL_CAMERA.at(-1)!.rig).toBe('idle');
  });

  it('shows chains before her, and the Guardians are gone before she has cleared the ice (§9.4, §5.2)', () => {
    const T = ANIMA_ARRIVAL_MS;
    expect(T.chainsStart).toBeLessThan(T.riseStart);
    expect(animaArrivalAt(T.riseStart).rise).toBeCloseTo(0, 9);
    expect(animaArrivalAt(T.riseStart).chains).toBeGreaterThan(0.5);
    expect(animaArrivalAt(T.riseEnd - 1).guardiansGone).toBe(1);
    expect(animaArrivalAt(T.guardiansDie - 1).guardiansGone).toBe(0);
  });

  it('starts wholly under the ice and ends on her own baseline, never jumping', () => {
    expect(animaRiseY(0, H.anima, ANIMA_HOVER) + H.anima + ANIMA_HOVER).toBeLessThan(0);
    expect(animaRiseY(1, H.anima, ANIMA_HOVER)).toBe(0);
    let prev = -Infinity;
    for (let ms = 0; ms <= ANIMA_ARRIVAL_MS.end; ms += 50) {
      const y = animaRiseY(animaArrivalAt(ms).rise, H.anima, ANIMA_HOVER);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });

  it("lights B's tag only once she is up and Seymour has stepped back, and hands control back before the camera settles", () => {
    const T = ANIMA_ARRIVAL_MS;
    expect(animaArrivalAt(T.tagOn - 1).tagOn).toBe(false);
    expect(animaArrivalAt(T.tagOn).rise).toBe(1);
    expect(animaArrivalAt(T.tagOn).stepBack).toBe(1);
    expect(animaArrivalAt(T.tagOn).occluding).toBe(false);
    expect(T.controlReturns).toBeLessThan(T.settleEnd);
    expect(animaArrivalAt(T.end).done).toBe(true);
  });
});

describe('macalania-temple — FFX-only absence [AGENTS.md rule 14]', () => {
  it('imports nothing from the FFX-2 side of the engine or data tree', () => {
    for (const f of ['macalania-temple', 'macalania-temple-arrival', 'macalania-temple-painted', 'macalania-temple-debug']) {
      const src = readFileSync(fileURLToPath(new URL(`../../../src/scenes/${f}.ts`, import.meta.url)), 'utf8');
      expect(src, f).not.toMatch(/from ['"].*\/battle\/ffx2\//);
      expect(src, f).not.toMatch(/from ['"].*\/data\/ffx2\//);
    }
  });
});
