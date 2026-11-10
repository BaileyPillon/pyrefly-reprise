// @vitest-environment jsdom
/**
 * Test 9 of the FFX-2 Special look (step A; game case: FFX-2 only: the three Special dresspheres exist only in FFX-2; the three early-outs live in shared mix code that FFX and FF7 players load, inert for them):
 * a Special ships NO twirl keys, and "no twirl keys" is not what stops the ordinary change. `twirlPlan(from, to)` plays the old dress's `twirl-start`, `twirl-going` and any `twirl-mid` whatever keys the Special
 * ships, `TwirlSlot.watch` begins a change on any painted-subject change, and `HeldShots` fires on any painted-subject change; so each gets an early-out when either art id is a Special (`SpecialArtIds.ts`).
 *
 * Removal: delete the early-out in `twirlPlan` and the first two cases return the old dress's keys.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { parseArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';

vi.mock('../../src/engine/PaintedArt.ts', () => ({
  artUrl: (p: string) => p,
  softSilhouette: () => null,
  prewarmPainted: () => Promise.resolve(true),
  tryLoadMeta: () => Promise.resolve({ baselineY: 700, scale: 1, width: 600, height: 800 }),
  loadPainted: (url: string) => Promise.resolve({ texture: { dispose: () => undefined }, meta: { width: 600, height: 800, baselineY: 700, scale: 1 }, placeholder: false, url }),
}));

import { Vector3 } from 'three';
import type { Actor, Pose } from '../../src/engine/fx/mix/geometry.ts';
import { HeldShots } from '../../src/engine/fx/mix/heldShots.ts';
import type { RigWatch } from '../../src/engine/fx/mix/rigWatch.ts';
import { TwirlSlot } from '../../src/engine/fx/mix/twirl.ts';
import { twirlPlan } from '../../src/engine/fx/mix/twirlPlan.ts';
import { HIDE_CLASS } from '../../src/engine/fx/mix/twirlColumn.ts';

const MIX = resolve(__dirname, '..', '..', 'src', 'engine', 'fx', 'mix');

const STATES: Record<string, string[]> = {
  'yuna-gunner': ['idle', 'twirl-start', 'twirl-going', 'twirl-mid'],
  'yuna-thief': ['idle', 'twirl-forming', 'twirl-end'],
  'yuna-floral-fallal': ['idle', 'cast'],
  'exp-leblanc-yuna-gunner': ['idle', 'twirl-start', 'twirl-going', 'twirl-mid'],
  'exp-leblanc-yuna-floral-fallal': ['idle'],
};
const statesOf = (id: string): readonly string[] | null => STATES[id] ?? null;
const others = Object.keys(STATES);

describe('twirlPlan plays nothing into or out of a Special', () => {
  it("into a Special: the old dress's twirl-start, twirl-going and twirl-mid are NOT played, although the old dress lists them", () => {
    expect(statesOf('yuna-gunner')).toEqual(expect.arrayContaining(['twirl-start', 'twirl-going', 'twirl-mid']));
    expect(twirlPlan('yuna-gunner', 'yuna-floral-fallal', statesOf, others)).toEqual([]);
  });

  it("out of a Special (the exit, the fall): the new dress's twirl-forming and twirl-end are NOT played, although it lists them", () => {
    expect(statesOf('yuna-thief')).toEqual(expect.arrayContaining(['twirl-forming', 'twirl-end']));
    expect(twirlPlan('yuna-floral-fallal', 'yuna-thief', statesOf, others)).toEqual([]);
  });

  it('inside an art namespace the same holds', () => {
    expect(twirlPlan('exp-leblanc-yuna-gunner', 'exp-leblanc-yuna-floral-fallal', statesOf, others)).toEqual([]);
    expect(twirlPlan('exp-leblanc-yuna-floral-fallal', 'exp-leblanc-yuna-gunner', statesOf, others)).toEqual([]);
  });

  it('an ordinary change plays exactly what it played before', () => {
    expect(twirlPlan('yuna-gunner', 'yuna-thief', statesOf, others)).toEqual([
      { figure: 'yuna-gunner', key: 'twirl-start' },
      { figure: 'yuna-gunner', key: 'twirl-going' },
      { figure: 'yuna-gunner', key: 'twirl-mid' },
      { figure: 'yuna-thief', key: 'twirl-forming' },
      { figure: 'yuna-thief', key: 'twirl-end' },
    ]);
  });
});

describe('TwirlSlot.watch begins no twirl into or out of a Special', () => {
  const defer = (): { resolve: () => void; promise: Promise<void> } => {
    let resolve!: () => void;
    const promise = new Promise<void>((r) => (resolve = r));
    return { resolve, promise };
  };
  const flush = async (n = 16): Promise<void> => {
    for (let i = 0; i < n; i++) await Promise.resolve();
  };
  const girl = (idle: string) => ({
    name: 'yuna',
    poseUrls: { idle } as Record<string, string>,
    slots: [{ mesh: {}, pose: 'idle', fade: 1 }, { mesh: {}, pose: 'idle', fade: 0 }],
    active: 0,
    poses: new Map<string, unknown>([['idle', { texture: { dispose: () => undefined }, meta: { scale: 1 } }]]),
    loadPoses: (_poses?: unknown, _initial?: string) => defer().promise,
    flash: vi.fn(),
    applyPose: () => undefined,
    syncOpacity: () => undefined,
  });

  beforeEach(() => {
    document.documentElement.classList.remove(HIDE_CLASS);
    setArtManifest(parseArtManifest({ subjects: Object.fromEntries(Object.entries(STATES).map(([k, v]) => [k, { states: v }])) }));
  });
  afterEach(() => setArtManifest(null));

  const change = async (from: string, to: string): Promise<{ changes: number; begun: number }> => {
    const a = girl(`/art/characters/${from}/idle.png`);
    const t = new TwirlSlot();
    t.on = true;
    t.eager = false;
    t.watch(a as unknown as Parameters<TwirlSlot['watch']>[0]);
    void a.loadPoses({ idle: `/art/characters/${to}/idle.png` });
    await flush();
    const out = { changes: t.stats.changes, begun: t.takeBegun().length };
    t.dispose();
    return out;
  };

  it('an ordinary change begins (the control: this method can see a twirl at all)', async () => {
    expect(await change('yuna-gunner', 'yuna-thief')).toEqual({ changes: 1, begun: 1 });
  });

  it('into a Special and out of it, none begins and the held shot is not asked to start', async () => {
    expect(await change('yuna-gunner', 'yuna-floral-fallal')).toEqual({ changes: 0, begun: 0 });
    expect(await change('yuna-floral-fallal', 'yuna-thief')).toEqual({ changes: 0, begun: 0 });
    expect(await change('exp-leblanc-yuna-gunner', 'exp-leblanc-yuna-floral-fallal')).toEqual({ changes: 0, begun: 0 });
  });
});

describe('HeldShots holds no DRESSPHERE SHOT into or out of a Special', () => {
  type RowIn = { name: string; pct: number; ready?: boolean };
  const rows = (items: RowIn[]): void => {
    const mk = (r: RowIn) => ({
      querySelector: (sel: string) => (sel === '.ffx2atb__fill' ? { style: { width: `${r.pct}%` } } : sel === '.ig-stat__name' ? { textContent: r.name } : sel === '.ffx2atb--ready' ? (r.ready ? {} : null) : null),
    });
    vi.spyOn(document, 'querySelectorAll').mockImplementation(((sel: string) => (sel === '.ig-stat' ? items.map(mk) : [])) as unknown as typeof document.querySelectorAll);
    vi.spyOn(document, 'querySelector').mockImplementation((() => null) as unknown as typeof document.querySelector);
  };
  afterEach(() => {
    vi.restoreAllMocks();
  });

  const pose: Pose = { pos: new Vector3(0, 2, 10), look: new Vector3(0, 1, 0), fov: 30 };
  const rigs = { write: () => undefined } as unknown as RigWatch;
  const actor = (name: string, over: Record<string, unknown>, idle: string): Actor =>
    ({ name, facing: 1, visible: true, lifeState: 'idle', pose: 'idle', poseUrls: { idle }, tweens: { size: 0 }, ...over }) as unknown as Actor;
  const o = (actors: Actor[]) => ({ actors, master: pose, lens: [0, 0] as [number, number], odOn: false, scOn: true, menu: false, ready: true });

  /** A girl changes her painted subject while an enemy is mid-action; after the 0.6 s wait the shot is skipped and the attempt is logged. */
  function run(from: string, to: string): { decisions: number; skipped: number } {
    rows([{ name: 'Yuna', pct: 0 }, { name: 'Paine', pct: 10 }]);
    const yuna = actor('Yuna', {}, `art/characters/${from}/idle.png`);
    const ixion = actor('Ixion', { facing: -1, lifeState: 'act' }, 'art/characters/ixion/idle.png');
    const s = new HeldShots('ffx2', rigs);
    s.update(1 / 60, o([yuna, ixion]));
    (yuna as unknown as { poseUrls: Record<string, string> }).poseUrls = { idle: `art/characters/${to}/idle.png` };
    for (let i = 0; i < 70; i++) s.update(1 / 60, o([yuna, ixion]));
    return { decisions: s.decisions.length, skipped: s.stats.skipped };
  }

  it('an ordinary change is tried (the control)', () => {
    expect(run('yuna-gunner', 'yuna-thief')).toEqual({ decisions: 1, skipped: 1 });
  });

  it('a party actor whose subject goes yuna-gunner -> yuna-floral-fallal, or back, is not tried at all', () => {
    expect(run('yuna-gunner', 'yuna-floral-fallal')).toEqual({ decisions: 0, skipped: 0 });
    expect(run('yuna-floral-fallal', 'yuna-gunner')).toEqual({ decisions: 0, skipped: 0 });
    expect(run('exp-leblanc-yuna-gunner', 'exp-leblanc-yuna-floral-fallal')).toEqual({ decisions: 0, skipped: 0 });
  });
});

describe('the three shared files import the dependency-free file, never the tracker', () => {
  for (const f of ['twirlPlan.ts', 'twirl.ts', 'heldShots.ts']) {
    it(`${f} imports isSpecialArtId from SpecialArtIds.ts and not from SpecialFormTracker.ts`, () => {
      const text = readFileSync(resolve(MIX, f), 'utf8');
      expect(text).toMatch(/import \{ isSpecialArtId \} from '\.\.\/\.\.\/SpecialArtIds\.ts';/);
      expect(text).not.toMatch(/SpecialFormTracker/);
      expect(text).not.toMatch(/battle\/ffx2\/special/);
    });
  }
});
