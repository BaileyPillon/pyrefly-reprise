/**
 * **Evrae on the deck of the Fahrenheit: scene staging and the NEAR / FAR switch.**
 *
 * Checked against the pure exports of `src/scenes/evrae-airship-deck.ts` (slots,
 * rigs, the rolled backdrop plane) and `src/scenes/evrae-airship-range.ts` (the
 * range tables, the head-ratio scale, the shift timeline), and against the real
 * range director driven by the real FFX engine. The factory itself paints
 * canvases and needs a DOM (the standing shape of every scene,
 * `docs/handoff/chapter-leblanc-scene.md` §4); its real-input check is the
 * browser pass in `docs/handoff/chapter-evrae-scene.md`.
 *
 * The HUD-safe-area claim is measured the way Macalania's is: through a real
 * three.js camera on each range's `idle` rig at 16:9, against the FFX rail at
 * 0.79 of the width (`docs/ENGINE-API.md#hud-safe-area`).
 *
 * **Game case: FFX only** [AGENTS.md rule 14].
 */

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import type { BattleEngine, Command, Decision } from '../../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ENEMY_GROUPS_BY_ID, ITEMS } from '../../../src/data/ffx/index.ts';
import { fahrenheitBuild } from '../../../src/data/ffx/builds/fahrenheit.ts';
import { evraeGroup } from '../../../src/data/ffx/enemies/evrae.ts';
import { BattleCamera } from '../../../src/engine/BattleCamera.ts';
import { LightRig } from '../../../src/engine/Lighting.ts';
import {
  EVRAE_AIRSHIP_ACTOR_HEIGHTS as H,
  EVRAE_AIRSHIP_DECK_BACKDROP as BACKDROP,
  EVRAE_AIRSHIP_DECK_RIGS as RIGS,
  EVRAE_AIRSHIP_DECK_SLOTS as SLOTS,
  EVRAE_ENEMY_SLOT,
} from '../../../src/scenes/evrae-airship-deck.ts';
import {
  AirshipRangeDirector,
  airshipRangeDirectorOf,
  attachAirshipRange,
} from '../../../src/scenes/evrae-airship-director.ts';
import {
  DECK,
  EVRAE_BASELINE_PX,
  EVRAE_FAR_HEAD_RATIO,
  EVRAE_FAR_WIDTH_PX,
  RANGE_SHIFT_MS,
  RANGE_STAGING,
  airshipOrderOf,
  airshipRangeOf,
  farActorScale,
  farWorldWidth,
  rangeShiftAt,
  type RigNumbers,
} from '../../../src/scenes/evrae-airship-range.ts';
import type { AirshipDeck } from '../../../src/scenes/evrae-airship-sky.ts';

const FFX_HUD_RAIL = 0.79;

function camFor(r: RigNumbers | { position: unknown; lookAt: unknown; fov?: number }): PerspectiveCamera {
  const cam = new PerspectiveCamera(r.fov ?? 34, 16 / 9, 0.1, 400);
  const [px, py, pz] = r.position as [number, number, number];
  const [lx, ly, lz] = r.lookAt as [number, number, number];
  cam.position.set(px, py, pz);
  cam.lookAt(new Vector3(lx, ly, lz));
  cam.updateMatrixWorld();
  cam.updateProjectionMatrix();
  return cam;
}

/** Screen box (0..1, y down) of a plane `w` x `h` whose baseline sits at `spot`. */
function box(cam: PerspectiveCamera, spot: readonly number[], w: number, h: number): { l: number; r: number; t: number; b: number } {
  const pts = [
    [spot[0]! - w / 2, spot[1]!, spot[2]!],
    [spot[0]! + w / 2, spot[1]!, spot[2]!],
    [spot[0]! - w / 2, spot[1]! + h, spot[2]!],
    [spot[0]! + w / 2, spot[1]! + h, spot[2]!],
  ].map((p) => new Vector3(p[0], p[1], p[2]).project(cam));
  return {
    l: Math.min(...pts.map((p) => (p.x + 1) / 2)),
    r: Math.max(...pts.map((p) => (p.x + 1) / 2)),
    t: Math.min(...pts.map((p) => (1 - p.y) / 2)),
    b: Math.max(...pts.map((p) => (1 - p.y) / 2)),
  };
}

const NEAR_W = H.evrae * (1171 / 784); // idle-near.json 1171x784
const FAR_W = farWorldWidth(H.evrae);
const FAR_H = FAR_W * (477 / 1024); // idle-far.json 1024x477

describe('evrae-airship-deck: formation and marks', () => {
  it('indexes the enemy slots exactly as the data file numbers them', () => {
    expect(evraeGroup.enemies).toHaveLength(2);
    for (const e of evraeGroup.enemies) {
      const idx = EVRAE_ENEMY_SLOT[e.id as keyof typeof EVRAE_ENEMY_SLOT];
      expect(idx, e.id).toBe(e.slot);
      expect(SLOTS.enemy[idx]).toBeDefined();
    }
    expect(SLOTS.party).toHaveLength(3);
  });

  it('gives Cid no mark of his own: his slot repeats Evrae’s, so the formation lane is not widened', () => {
    expect(SLOTS.enemy[EVRAE_ENEMY_SLOT.cid]).toEqual(SLOTS.enemy[EVRAE_ENEMY_SLOT.evrae]);
  });

  it('stands the party on the deck, in front of the rail', () => {
    // R13-04 option B: the back row stands at the rail, 0.2 to 0.4 in front of its line; the front man well inside.
    for (const s of SLOTS.party) {
      expect(s[1]).toBe(0);
      expect(s[2]).toBeGreaterThanOrEqual(DECK.edgeZ + 0.2);
    }
    expect(Math.max(...SLOTS.party.map((s) => s[2]))).toBeGreaterThan(DECK.edgeZ + 3);
  });

  it('hangs NEAR Evrae past the rail with its coils below the deck line and its head above the rail', () => {
    const near = RANGE_STAGING.near.evrae;
    expect(near[2]).toBeLessThan(DECK.edgeZ);
    expect(near[1]).toBeLessThan(0);
    // idle-near's head sits in the top quarter of the painting (eye at row 175 of 784).
    const headY = near[1] + H.evrae * (1 - 175 / 784);
    expect(headY).toBeGreaterThan(DECK.railHeight);
  });
});

describe('evrae-airship-deck: framing, measured through a real camera', () => {
  it('keeps NEAR Evrae inside the frame and left of the FFX HUD rail on NEAR’s idle rig', () => {
    const b = box(camFor(RANGE_STAGING.near.rigs.idle), RANGE_STAGING.near.evrae, NEAR_W, H.evrae);
    expect(b.l).toBeGreaterThan(0.3);
    expect(b.r).toBeLessThan(FFX_HUD_RAIL);
    expect(b.t).toBeGreaterThan(0.05);
  });

  it('draws FAR Evrae small, in the sky above the rail line, left of the HUD rail, on FAR’s idle rig', () => {
    const cam = camFor(RANGE_STAGING.far.rigs.idle);
    const far = box(cam, RANGE_STAGING.far.evrae, FAR_W, FAR_H);
    const near = box(camFor(RANGE_STAGING.near.rigs.idle), RANGE_STAGING.near.evrae, NEAR_W, H.evrae);
    expect(far.r).toBeLessThan(FFX_HUD_RAIL);
    expect(far.r - far.l).toBeLessThan((near.r - near.l) * 0.5);
    const railTop = new Vector3(0, DECK.railHeight, DECK.edgeZ).project(cam);
    expect(far.b).toBeLessThan((1 - railTop.y) / 2);
  });

  it('pulls FAR’s camera back and up: more deck underfoot (C’s staging)', () => {
    const n = RANGE_STAGING.near.rigs.idle;
    const f = RANGE_STAGING.far.rigs.idle;
    expect(f.position[2]).toBeGreaterThan(n.position[2]);
    expect(f.position[1]).toBeGreaterThan(n.position[1]);
    expect(f.fov).toBeGreaterThanOrEqual(n.fov);
  });

  it('hides the painted rail behind the deck edge at every idle rig (the rolled plane)', () => {
    // The painting's rail, in image fractions, rotated by the roll about the plane's centre.
    const Hp = (BACKDROP.width * 1536) / 2688;
    const rot = (x: number, y: number): [number, number] => [
      x * Math.cos(BACKDROP.roll) - y * Math.sin(BACKDROP.roll),
      x * Math.sin(BACKDROP.roll) + y * Math.cos(BACKDROP.roll),
    ];
    const a = rot(-BACKDROP.width / 2, Hp * (0.5 - 0.93));
    const b = rot(BACKDROP.width / 2, Hp * (0.5 - 0.57));
    expect(Math.abs(a[1] - b[1])).toBeLessThan(0.5); // level after the roll
    const railTop = BACKDROP.centreY + Math.max(a[1], b[1]) + 1.6; // + the rail's half thickness
    for (const r of [RANGE_STAGING.near.rigs.idle, RANGE_STAGING.far.rigs.idle, RIGS['intro']!]) {
      const [, py, pz] = r.position as [number, number, number];
      // Sightline over the deck's far edge, continued to the painting plane.
      const t = (BACKDROP.distance - pz) / (DECK.edgeZ - pz);
      const yAtPlane = py + (0 - py) * t;
      expect(yAtPlane, JSON.stringify(r.position)).toBeGreaterThan(railTop);
    }
  });
});

describe('the FAR painting’s scale, from the head length', () => {
  it('is the measured head ratio, applied to NEAR’s pixel scale', () => {
    expect(EVRAE_FAR_HEAD_RATIO).toBeCloseTo(69.5 / 55.1, 6);
    expect(farActorScale(EVRAE_BASELINE_PX.near, EVRAE_BASELINE_PX.far)).toBeCloseTo(0.757, 3);
    expect(farWorldWidth(4.1)).toBeCloseTo(6.9, 1);
  });

  it('matches the installed sidecars when the art is on this disk (public/art is gitignored)', () => {
    const dir = fileURLToPath(new URL('../../../public/art/characters/evrae/', import.meta.url));
    const near = `${dir}idle-near.json`;
    const far = `${dir}idle-far.json`;
    if (!existsSync(near) || !existsSync(far)) return;
    const n = JSON.parse(readFileSync(near, 'utf8')) as { baselineY: number };
    const f = JSON.parse(readFileSync(far, 'utf8')) as { baselineY: number; width: number };
    expect(n.baselineY).toBe(EVRAE_BASELINE_PX.near);
    expect(f.baselineY).toBe(EVRAE_BASELINE_PX.far);
    expect(f.width).toBe(EVRAE_FAR_WIDTH_PX);
  });
});

describe('the range shift timeline', () => {
  it('fades Evrae out, swaps, fades it in, with the wind answering first', () => {
    const at = (ms: number) => rangeShiftAt(ms);
    expect(at(0).evraeAlpha).toBe(1);
    expect(at(0).swapped).toBe(false);
    expect(at(RANGE_SHIFT_MS.fadeOutMs - 1).evraeAlpha).toBeLessThan(0.05);
    expect(at(RANGE_SHIFT_MS.fadeOutMs).swapped).toBe(true);
    expect(at(RANGE_SHIFT_MS.windMs).wind).toBe(1);
    expect(at(RANGE_SHIFT_MS.windMs).blend).toBeLessThan(1);
    let prev = -1;
    for (let ms = 0; ms <= RANGE_SHIFT_MS.cameraMs; ms += 50) {
      expect(at(ms).blend).toBeGreaterThanOrEqual(prev);
      prev = at(ms).blend;
    }
    expect(at(RANGE_SHIFT_MS.fadeOutMs + RANGE_SHIFT_MS.fadeInMs).evraeAlpha).toBe(1);
    expect(at(RANGE_SHIFT_MS.total - 1).done).toBe(false);
    expect(at(RANGE_SHIFT_MS.total + 1).done).toBe(true);
  });
});

// ---------------------------------------------------------------- director

function fakeDeck(): AirshipDeck & { hazeValue: number } {
  const d = {
    group: new Group(),
    layers: [],
    haze: null as never,
    wind: 1,
    hazeValue: 0,
    setHaze(v: number): void {
      d.hazeValue = v;
    },
    update(): void {},
    dispose(): void {},
  };
  return d;
}

function newEngine(seed = 1): BattleEngine {
  const content = new FFXContentRegistry();
  content.addAbilities(ALL_ABILITIES);
  content.addItems(Object.values(ITEMS));
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init({
    game: 'ffx',
    party: fahrenheitBuild,
    enemies: ENEMY_GROUPS_BY_ID['evrae-airship']!,
    triggers: [],
    seed,
    condition: 'normal',
    canEscape: false,
  });
  return engine;
}

describe('the range director, driven by the real engine', () => {
  const palette = { sky: 0x6d8fbd, horizon: 0xc7d3e6, ground: 0x7a8394, key: 0xffe0b0, bounce: 0x8894a8 };

  it('is published on the scene group and found by the presenter’s lookup, and on no other scene', () => {
    const director = new AirshipRangeDirector(fakeDeck(), new LightRig({ palette, shadows: false }));
    const g = new Group();
    const child = new Group();
    g.add(child);
    attachAirshipRange(child, director);
    expect(airshipRangeDirectorOf(g)).toBe(director);
    expect(airshipRangeDirectorOf(new Group())).toBeNull();
  });

  it('follows the flag: an order flown by Cid moves the camera, the wind and the haze to FAR', () => {
    const deck = fakeDeck();
    const director = new AirshipRangeDirector(deck, new LightRig({ palette, shadows: false }));
    const camera = new BattleCamera(new PerspectiveCamera(34, 16 / 9, 0.1, 400), {
      rigs: RIGS as Record<string, never>,
      initial: 'idle',
    });
    director.bindCamera(camera);
    const engine = newEngine(1);
    director.sync(engine.state());
    expect(director.current).toBe('near');
    expect(airshipRangeOf(engine.state())).toBe('near');

    // Tidus or Rikku orders the pull-back; everyone else defends until Cid flies it.
    let ordered = false;
    for (let i = 0; i < 400 && airshipRangeOf(engine.state()) === 'near'; i++) {
      const d: Decision = engine.nextDecision();
      if (d.kind === 'battle-over') break;
      if (d.kind !== 'player-input') continue;
      const order = d.commands.find((c) => c.command.kind === 'trigger' && c.command.id === 'pull-back' && c.enabled);
      const cmd: Command = !ordered && order ? order.command : { kind: 'defend', targets: [] };
      if (cmd.kind === 'trigger') ordered = true;
      engine.submit(cmd);
    }
    expect(airshipOrderOf(engine.state())).toBeNull(); // Cid consumed it
    expect(ordered).toBe(true);
    expect(airshipRangeOf(engine.state())).toBe('far');

    director.sync(engine.state());
    expect(director.current).toBe('far');
    expect(director.shifting).toBe(true);
    const farIdle = camera.getRig('idle')!;
    expect((farIdle.position as Vector3).toArray()).toEqual(RANGE_STAGING.far.rigs.idle.position);
    for (let t = 0; t < 2.5; t += 1 / 30) {
      director.update(1 / 30);
      camera.update(1 / 30);
    }
    expect(director.shifting).toBe(false);
    expect(deck.wind).toBeCloseTo(RANGE_STAGING.far.wind, 5);
    expect(deck.hazeValue).toBeCloseTo(RANGE_STAGING.far.haze, 5);
  });

  it('never sees a range in a battle without the mechanic', () => {
    expect(airshipRangeOf({ flags: {} })).toBeNull();
    expect(airshipRangeOf(null)).toBeNull();
  });
});

describe('FFX only [AGENTS.md rule 14]', () => {
  const dir = fileURLToPath(new URL('../../../src/scenes/', import.meta.url));
  const mine = readdirSync(dir).filter((f) => f.startsWith('evrae-airship'));

  it('the scene files import nothing from FFX-2', () => {
    expect(mine.length).toBeGreaterThanOrEqual(7);
    for (const f of mine) {
      const src = readFileSync(`${dir}${f}`, 'utf8');
      expect(src, f).not.toMatch(/battle\/ffx2|data\/ffx2|ui\/ffx2/);
    }
  });

  it('no other scene imports them (the registry, index.ts, is the integrator’s one exception)', () => {
    for (const f of readdirSync(dir).filter((x) => x.endsWith('.ts') && !x.startsWith('evrae-airship') && x !== 'index.ts')) {
      expect(readFileSync(`${dir}${f}`, 'utf8'), f).not.toMatch(/evrae-airship/);
    }
  });
});
