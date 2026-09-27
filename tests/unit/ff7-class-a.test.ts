// @vitest-environment jsdom
/**
 * The class-A fixes after the release-readiness check and the FF7 purist review (7.4), FF7 only:
 *
 *  - Boss scale (the review's major): Guard Scorpion towers over the party, about 1.6x to 2x a
 *    member's standing height on screen, feet on the floor above the band, the whole body and the
 *    raised tail under the message window and inside the frame, at 1600x900 and 390x844.
 *  - C-2: FF7's defeat panel reads the experiments store (attempts, best), never the main save.
 *  - After the merge of main's A-5 and A-6: no Spira pyreflies in FF7's reactor (no band, no dissolve).
 *  - C-3: `types.ts` carries FF7's additions as one-liners only; `EnemyDef.ff7` arrives by module
 *    augmentation from `types-ff7.ts`.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { Group, PerspectiveCamera, Vector3 } from 'three';

import type { App } from '../../src/app/App.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { ResultsScreen } from '../../src/app/screens/ResultsScreen.ts';
import { FF7_REACH_PER_HEIGHT } from '../../src/app/screens/BattleScreenFf7Motion.ts';
import {
  recordExperimentAttempt,
  recordExperimentClear,
  setExperimentStorageForTests,
} from '../../src/app/experiments/experimentRecords.ts';
import type { BattleResult, EnemyDef, Ff7EnemyFields } from '../../src/battle/common/types.ts';
import { FF7_GUARD_SCORPION } from '../../src/data/chapter-ff7-guard-scorpion.ts';
import { pyreflyCanonFor } from '../../src/engine/pyreflyCanon.ts';
import { PyreflyStage, type DissolveSource } from '../../src/engine/PyreflyStage.ts';
import * as S from '../../src/scenes/sector1-reactor-staging.ts';
import { ff7Geometry } from '../../src/ui/ff7/ff7Geometry.ts';
import type { LedgerLine } from '../../src/ui/common/resultsPage.ts';

const HERE = dirname(fileURLToPath(import.meta.url));

afterEach(() => {
  document.body.innerHTML = '';
  setExperimentStorageForTests(undefined);
});

// ------------------------------------------------------------------ boss scale

/**
 * The installed Film paintings (`film-set/scripts/install.py`, x0.75, each padded to centre on the
 * rear foot): the tail-down idle 1890x808 (baseline 795, painted box x 276..1878, top 12) and the
 * tail-raised idle 1614x1094 (baseline 1082, box x 136..1601, top 12, subject scale 1442/1060).
 */
const IDLE = { w: 1890, baseline: 795, x0: 276, x1: 1878, top: 12 };
const RAISED = { w: 1614, baseline: 1082, x0: 136, x1: 1601, top: 12, scale: 1442 / 1060 };

function camera(w: number, h: number): PerspectiveCamera {
  const rig = S.sector1RigsFor(w / h).idle;
  const cam = new PerspectiveCamera(rig.fov, w / h, 0.1, 200);
  cam.position.set(...(rig.position as [number, number, number]));
  cam.lookAt(new Vector3(...(rig.lookAt as [number, number, number])));
  cam.updateMatrixWorld();
  return cam;
}

describe("Guard Scorpion towers over the party, sides switched (the boss-scale major; D-259, D-262)", () => {
  for (const [W, H] of [[1600, 900], [390, 844]] as const) {
    it(`${W}x${H}: the raised machine towers over Cloud and runs twice his height long; whole body in frame, above the band`, () => {
      const layout = S.sector1Layout(W / H);
      const cam = camera(W, H);
      const sy = (p: readonly number[]): number => ((1 - new Vector3(p[0], p[1], p[2]).project(cam).y) / 2) * H;
      const sx = (p: readonly number[]): number => ((new Vector3(p[0], p[1], p[2]).project(cam).x + 1) / 2) * W;
      const g = ff7Geometry(W, H);
      const band = Math.min(g.bandL.y, g.bandR.y);
      const msgBottom = g.msg.y + g.msg.h;

      const hb = S.SECTOR1_HEIGHTS['guard-scorpion'];
      const unit = hb / IDLE.baseline; // world units per installed px, both paintings (the raised one's subject scale evens it)
      const rUnit = (hb / RAISED.baseline) * RAISED.scale;
      const [bx, , bz] = layout.boss;
      const feet = sy(layout.boss);
      const idleTop = sy([bx, (IDLE.baseline - IDLE.top) * unit, bz]);
      const raisedTop = sy([bx, (RAISED.baseline - RAISED.top) * rUnit, bz]);
      const head = sx([bx - (IDLE.w / 2 - IDLE.x0) * unit, 0, bz]);
      const tail = sx([bx + (IDLE.x1 - IDLE.w / 2) * unit, 0, bz]);

      const cloud = S.rowSpot(0, 'front', layout);
      const cloudPx = sy(cloud) - sy([cloud[0], S.SECTOR1_HEIGHTS.cloud, cloud[2]]);
      expect((feet - raisedTop) / cloudPx).toBeGreaterThanOrEqual(1.4);
      expect((tail - head) / cloudPx).toBeGreaterThanOrEqual(W > H ? 2.2 : 1.8);
      expect(feet).toBeLessThan(band - 15);
      expect(idleTop).toBeGreaterThan(msgBottom);
      expect(raisedTop).toBeGreaterThan(msgBottom - 12); // the lens tucks just under the message window
      expect(head).toBeGreaterThan(0);
      if (W > H) expect(tail).toBeLessThan(W); // on a phone the lowered tail may trail off the right edge (E1)
      const chest = (feet + idleTop) / 2;
      expect(chest).toBeGreaterThan(msgBottom);
      expect(chest).toBeLessThan(band);
    });
  }

  it('keeps the melee strike point just in front of the rifles, on the party side, in both layouts', () => {
    for (const layout of [S.SECTOR1_DESK, S.SECTOR1_PHONE]) {
      const [x] = S.strikeSpot(layout);
      const rifles = layout.boss[0] - S.SECTOR1_BOSS_FRONT;
      expect(rifles - x, layout.name).toBeGreaterThan(0.2);
      expect(rifles - x, layout.name).toBeLessThan(0.8);
      expect(x, layout.name).toBeGreaterThan(layout.front[0]![0]); // Cloud runs toward the boss
    }
    expect(FF7_REACH_PER_HEIGHT).toBeGreaterThan(0);
  });
});

// ------------------------------------------------------------------ C-2

function memoryStorage(): Pick<Storage, 'getItem' | 'setItem'> {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}

function defeatLedger(save: SaveStore): LedgerLine[] {
  const result: BattleResult = {
    outcome: 'defeat', turns: 7, elapsedTicks: 0, elapsedMs: 30_000, ap: 0, exp: 0, gil: 0,
    drops: [], overkilled: [], sphereLevelsGained: {},
  };
  const screen = new ResultsScreen({ chapterId: FF7_GUARD_SCORPION.id, result });
  const root = document.createElement('div');
  document.body.appendChild(root);
  screen.app = { save, fade: () => Promise.resolve() } as unknown as App;
  screen.root = root;
  void screen.enter();
  return (screen as unknown as { ledger: LedgerLine[] }).ledger;
}

describe('C-2: FF7\'s defeat panel reads the experiments store', () => {
  it('shows the store\'s attempts and best time, and leaves the main save as it was', () => {
    setExperimentStorageForTests(memoryStorage());
    for (let i = 0; i < 3; i++) recordExperimentAttempt(FF7_GUARD_SCORPION.id, 1000 + i);
    recordExperimentClear(FF7_GUARD_SCORPION.id, 95_000);
    const save = new SaveStore('ff7-class-a-test', null);
    const before = JSON.stringify(save.value);
    const ledger = defeatLedger(save);
    const row = (key: string): LedgerLine | undefined => ledger.find((l) => l.key === key);
    expect(row('ATTEMPTS')?.value).toBe('3');
    expect(row('BEST')?.value).not.toBe('—');
    expect(row('BEST')?.detail).toBeUndefined();
    expect(JSON.stringify(save.value)).toBe(before);
  });

  it('with no record in the store: one attempt, never cleared', () => {
    setExperimentStorageForTests(memoryStorage());
    const ledger = defeatLedger(new SaveStore('ff7-class-a-test-2', null));
    expect(ledger.find((l) => l.key === 'ATTEMPTS')?.value).toBe('1');
    expect(ledger.find((l) => l.key === 'BEST')?.detail).toBe('NEVER CLEARED');
  });
});

// ------------------------------------------------------------------ C-3

describe('C-3: types.ts does not grow for FF7', () => {
  it('holds FF7 in one-liners and takes EnemyDef.ff7 by augmentation from types-ff7.ts', () => {
    const src = readFileSync(join(HERE, '..', '..', 'src', 'battle', 'common', 'types.ts'), 'utf8');
    expect(src.split('\n').filter((l) => /ff7/i.test(l)).length).toBeLessThanOrEqual(11);
    expect(src).not.toMatch(/ff7\?: Ff7EnemyFields/);
    const ff7Src = readFileSync(join(HERE, '..', '..', 'src', 'battle', 'common', 'types-ff7.ts'), 'utf8');
    expect(ff7Src).toMatch(/declare module '\.\/types\.ts'/);
    // Compile-time: the augmented field is on the shared EnemyDef.
    const fields = undefined as Ff7EnemyFields | undefined;
    const probe: Pick<EnemyDef, 'ff7'> = { ff7: fields };
    expect(probe).toHaveProperty('ff7');
  });
});

// ------------------------------------------------------------------ pyreflies (after the merge)

describe("main's pyreflies stay out of FF7 (A-5, A-6 are Spira's)", () => {
  const figure = (): DissolveSource & { style: string } => ({
    dissolveLevel: 0,
    style: 'plain',
    contentQuad: (out) => out ?? [new Vector3(), new Vector3(), new Vector3(), new Vector3()],
    setDissolveStyle(s) {
      this.style = s;
    },
  });

  it('the reactor has an FF7 row, absent; the beaten boss keeps the plain dissolve; an FFX fiend still gets pyreflies', () => {
    expect(pyreflyCanonFor('sector1-reactor')).toMatchObject({ game: 'ff7', verdict: 'absent' });
    const ff7 = new PyreflyStage(new Group(), () => 'full', 'sector1-reactor');
    const boss = figure();
    ff7.stage('guard-scorpion', 'enemy', boss);
    expect(boss.style).toBe('plain');
    expect(ff7.trackedIds).toEqual([]);
    const ffx = new PyreflyStage(new Group(), () => 'full', 'zanarkand-dome');
    const fiend = figure();
    ffx.stage('seymour-flux', 'enemy', fiend);
    expect(fiend.style).toBe('pyrefly');
  });
});
