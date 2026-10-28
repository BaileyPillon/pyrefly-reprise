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
import { battleScreenSource } from './helpers/battleScreenSource.ts';

const ROOT = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(ROOT, rel), 'utf8');
const WHY = 'rename it in critic/runner/lib/continuity-probe.mjs too (and critic/CHECKS.md CHK-026 says what the probe reads)';

describe('the engine fields the continuity probe reads', () => {
  // The actor is a chain of classes since 2026-10-28 (ChatGPT's point 8b, `docs/handoff/split-presenter.md`): its fields are declared in the state and base classes, `PlaneSlot` in the types file.
  const actor = ['PaintedActor', 'PaintedActorState', 'PaintedActorBase', 'PaintedActorTypes'].map((f) => read(`src/engine/${f}.ts`)).join('\n');
  const stage = read('src/engine/BattlePresenterStage.ts');
  const battle = battleScreenSource();
  const app = read('src/app/App.ts');
  const api = read('src/debug/api.ts');
  const probe = read('critic/runner/lib/continuity-probe.mjs');

  it('PaintedActor keeps two planes, which one is active, its alpha, its figure flag and its painting urls', () => {
    expect(actor, `PaintedActor.slots: ${WHY}`).toMatch(/(?:private|protected) readonly slots: \[PlaneSlot, PlaneSlot\];/);
    expect(actor, `PaintedActor.active: ${WHY}`).toMatch(/(?:private|protected) active = 0;/);
    expect(actor, `PaintedActor._alpha: ${WHY}`).toMatch(/(?:private|protected) _alpha = 1;/);
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
    expect(battle, `BattleScreen.stage: ${WHY}`).toMatch(/(?:private|protected) stage: PaintedStage \| null = null;/);
    expect(battle, `BattleScreen.fieldShown: ${WHY}`).toMatch(/(?:private|protected) fieldShown = false;/);
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

  it('the planned-smear log (motion pass, step 2): the debug api hands out `smearLog`, and an entry has the fields the harness matches on', () => {
    expect(read('src/debug/smearApi.ts'), `__pyrefly.smearLog: ${WHY}`).toMatch(/api\['smearLog'\] = /);
    expect(read('src/main.ts'), 'main.ts installs the smear debug api').toMatch(/installSmearDebug\(debugApi\)/);
    expect(probe, 'the probe reads window.__pyrefly.smearLog').toMatch(/win\.__pyrefly\.smearLog/);
    const entry = /export interface PlannedSmear \{([\s\S]*?)\n\}/.exec(read('src/engine/motion/SmearLog.ts'))?.[1] ?? '';
    for (const field of ['at: number;', 'actor: string;', 'from: string;', 'to: string;', 'cutMs: number;', 'overlap: number | null;', 'anchorDistance: number | null;', "kind: 'plane' | 'rig';", 'cutAt: number;']) expect(entry, `PlannedSmear ${field} ${WHY}`).toContain(field);
    // the entry's names are the harness's pose names: a painting set logs its planes' pose names (the slot's `pose`, which the probe records), a rig its key names
    expect(read('src/engine/motion/SmearDirector.ts'), 'the plane log uses the plane pose names').toMatch(/poseOf\(out\)/);
  });

  it('a rigged figure keeps the public surface the rig reader reads (R57-002): its key, its move, its landmarks, its feet, its box and its part meshes', () => {
    const rig = read('src/engine/rig/RigActor.ts');
    const figure = read('src/engine/rig/RigFigure.ts');
    const reader = read('critic/runner/lib/continuity-rig-probe.mjs');
    for (const sig of ['override get pose(): string', 'override get blending(): boolean', 'rigInfo(): {', 'landmark(name: string): { x: number; y: number } | null', 'feetPoint(): Vector3 | null', 'override contentQuad(', 'get figure(): RigFigure']) {
      expect(rig, `RigActor ${sig}: ${WHY.replace('continuity-probe.mjs', 'continuity-rig-probe.mjs')}`).toContain(sig);
    }
    expect(figure, `RigFigure.plane: ${WHY}`).toMatch(/readonly plane = new Group\(\);/);
    expect(figure, 'a part mesh is named by its part, which is how the reader finds the head').toContain('mesh.name = p.name;');
    for (const name of ['rigInfo', 'landmark', 'feetPoint', 'contentQuad', 'blending', 'figure', 'plane', 'children', 'geometry', 'getAttribute', 'matrixWorld']) expect(reader).toContain(name);
    expect(reader, 'the reader must not depend on a hook that only a newer build has').not.toMatch(/onPoseSwap|__pyrefly\.motion|__pyrefly\.continuity/);
  });

  it('a rig is judged by whether it is DRAWN, not by the painted actor\'s figure flag (R58-T1): it is built with figure: false, so that flag is false for its whole life', () => {
    const rig = read('src/engine/rig/RigActor.ts');
    const figure = read('src/engine/rig/RigFigure.ts');
    const probe = read('critic/runner/lib/continuity-probe.mjs');
    expect(rig, 'RigActor draws no plane: it hands PaintedActor figure: false, which is what makes showFigure false (and its carrier meshes hidden)').toMatch(/super\(\{\s*\.\.\.opts,\s*figure: false,/);
    expect(figure, 'the rig switches its parts with the actor: plane.visible = visible && alpha > 0.001, the thing the probe reads').toMatch(/this\.plane\.visible = on;/);
    expect(figure).toMatch(/const on = visible && alpha > 0\.001;/);
    const sampleRig = /const sampleRig = [\s\S]*?\n  \};/.exec(probe)?.[0] ?? '';
    expect(sampleRig.length, 'sampleRig is found').toBeGreaterThan(200);
    expect(sampleRig, 'sampleRig must not gate a rig on the carrier\'s showFigure (every rig swap was dropped as notShowing in release 58)').not.toMatch(/\ba\.showFigure\b/);
    expect(sampleRig).toMatch(/rigPlane\.visible === false/);
  });

  it('the probe reads exactly these names and no engine hook', () => {
    for (const name of ['slots', 'active', '_alpha', 'showFigure', 'poseUrls', 'painted', 'stage', 'actors', 'opts', 'fieldShown', 'matrixWorld', 'projectionMatrix', 'matrixWorldInverse']) expect(probe).toContain(name);
    expect(probe, 'the probe must not depend on a hook that only a newer build has').not.toMatch(/onPoseSwap|__pyrefly\.motion|__pyrefly\.continuity/);
  });
});
