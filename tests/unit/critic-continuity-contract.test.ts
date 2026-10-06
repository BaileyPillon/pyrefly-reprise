/**
 * What the continuity probe reads off the running game, pinned to the engine's source.
 *
 * `critic/runner/lib/continuity-probe.mjs` runs inside a build's page and reads the engine's own state (no engine hook was
 * added, so it also works on a build that is already live): `window.__pyrefly.app.screens` -> the battle screen
 * (`name`, `fieldShown`, `stage`) -> `stage.actors` (id -> { actor, side, kind, anchor, artId }) and `stage.opts`
 * (`camera`, `canvas`) -> the painted actor (`slots`, `active`, `_alpha`, `showFigure`, `poseUrls`) -> each plane
 * (`pose`, `fade`, `meta`, `mesh`, `painted`), plus `window.__pyrefly.battleState().log`. Those are names of fields, some of them
 * private in TypeScript and all of them plain properties at runtime. If one is renamed the probe would see an empty
 * battle and the harness would say UNVERIFIED, so this test fails first and says which file to look at.
 *
 * Game case: both (shared critic plumbing).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const WHY = 'rename it in critic/runner/lib/continuity-probe.mjs too (and critic/CHECKS.md CHK-026 says what the probe reads)';

describe('the engine fields the continuity probe reads', () => {
  const actor = read('src/engine/PaintedActor.ts');
  const stage = read('src/engine/BattlePresenterStage.ts');
  const battle = read('src/app/screens/BattleScreen.ts');
  const app = read('src/app/App.ts');
  const api = read('src/debug/api.ts');
  const probe = read('critic/runner/lib/continuity-probe.mjs');

  it('PaintedActor keeps two planes, which one is active, its alpha, its figure flag and its painting urls', () => {
    expect(actor, `PaintedActor.slots: ${WHY}`).toMatch(/private readonly slots: \[PlaneSlot, PlaneSlot\];/);
    expect(actor, `PaintedActor.active: ${WHY}`).toMatch(/private active = 0;/);
    expect(actor, `PaintedActor._alpha: ${WHY}`).toMatch(/private _alpha = 1;/);
    expect(actor, `PaintedActor.showFigure: ${WHY}`).toMatch(/showFigure\b/);
    expect(actor, `PaintedActor.poseUrls: ${WHY}`).toMatch(/readonly poseUrls: PoseMap = \{\};/);
  });

  it('a plane has a mesh, a fade, a pose and its painting\'s size', () => {
    const slot = /interface PlaneSlot \{([\s\S]*?)\n\}/.exec(actor)?.[1] ?? '';
    for (const field of ['mesh: Mesh;', 'fade: number;', 'pose: string;', 'meta: PoseMeta;', 'painted: PaintedTexture | null;']) expect(slot, `PlaneSlot ${field} ${WHY}`).toContain(field);
    const frame = /export interface PoseFrame \{([\s\S]*?)\n\}/.exec(read('src/engine/PaintedScale.ts'))?.[1] ?? '';
    expect(frame, `PoseFrame.width: ${WHY}`).toContain('width: number;');
    expect(frame, `PoseFrame.height: ${WHY}`).toContain('height: number;');
  });

  it('the stage keeps its figures by combatant id, with their side, kind, art id and a part anchor, and its camera and canvas in opts', () => {
    expect(stage, `PaintedStage.actors: ${WHY}`).toMatch(/private readonly actors = new Map<CombatantId, StagedActor>\(\);/);
    const staged = /interface StagedActor \{([\s\S]*?)\n\}/.exec(stage)?.[1] ?? '';
    for (const field of ['actor: PaintedActor;', 'side: Side;', 'artId: string;', "kind: 'party' | 'enemy';", 'anchor?: PartAnchor;']) expect(staged, `StagedActor ${field} ${WHY}`).toContain(field);
    expect(stage, `PaintedStage.opts: ${WHY}`).toMatch(/private readonly opts: PaintedStageOptions;/);
    const opts = /export interface PaintedStageOptions \{([\s\S]*?)\n\}/.exec(stage)?.[1] ?? '';
    expect(opts, `PaintedStageOptions.camera: ${WHY}`).toContain('camera: PerspectiveCamera;');
    expect(opts, `PaintedStageOptions.canvas: ${WHY}`).toContain('canvas: HTMLCanvasElement;');
  });

  it('the battle screen is named "battle", holds its stage, and draws nothing until its field is shown', () => {
    expect(battle, `BattleScreen.name: ${WHY}`).toMatch(/readonly name = 'battle';/);
    expect(battle, `BattleScreen.stage: ${WHY}`).toMatch(/private stage: PaintedStage \| null = null;/);
    expect(battle, `BattleScreen.fieldShown: ${WHY}`).toMatch(/private fieldShown = false;/);
    expect(battle, 'render() returns nothing until the field is shown: that is why the probe waits for it').toMatch(/if \(!this\.scene \|\| !this\.fieldShown\) return null;/);
  });

  it('the app lists its screens bottom first and resolves nextFrame() after the frame it rendered', () => {
    expect(app, `App.screens: ${WHY}`).toMatch(/get screens\(\): readonly Screen\[\] \{\s*return this\.stack;/);
    expect(app, `App.nextFrame: ${WHY}`).toMatch(/nextFrame\(\): Promise<void>/);
    // the resolve comes after the render in `step`, which is what makes the probe read the frame that was just drawn
    const from = app.indexOf('  step(dt: number');
    expect(from, 'App.step(dt) exists').toBeGreaterThan(-1);
    const step = app.slice(from, app.indexOf('/** Aggregate state for the debug API. */', from));
    expect(step.indexOf('this.renderer.render('), 'step() renders the frame').toBeGreaterThan(-1);
    expect(step.indexOf('this.frameWaiters.splice'), 'and resolves its waiters after it').toBeGreaterThan(step.indexOf('this.renderer.render('));
  });

  it('the debug api hands out the app and the live battle state', () => {
    expect(api, `__pyrefly.app: ${WHY}`).toMatch(/readonly app: App;/);
    expect(api, `__pyrefly.battleState: ${WHY}`).toMatch(/battleState\(\): Readonly<BattleState> \| null;/);
  });

  it('the probe reads exactly these names and no engine hook', () => {
    for (const name of ['slots', 'active', '_alpha', 'showFigure', 'poseUrls', 'painted', 'stage', 'actors', 'opts', 'fieldShown', 'matrixWorld', 'projectionMatrix', 'matrixWorldInverse']) expect(probe).toContain(name);
    expect(probe, 'the probe must not depend on a hook that only a newer build has').not.toMatch(/onPoseSwap|__pyrefly\.motion|__pyrefly\.continuity/);
  });
});
