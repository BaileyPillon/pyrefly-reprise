/**
 * FF7 stage harness (dev only, never shipped): the Guard Scorpion battle on the
 * No. 1 Reactor core with the real engine, the real `PaintedStage`, the real
 * `BattlePresenter` and the FF7 staging hook, and **no HUD** (the FF7 HUD is
 * built on its own branch). With `hud: null` the presenter draws its own
 * fallback damage numerals and message bar, exactly as `BattleScreen` does
 * when no HUD is mounted.
 *
 * Game case: FF7 only. Serve the repo with Vite and open
 * `/tools/ff7-stage/harness.html?seed=1`; `tools/ff7-stage-shots.mjs` drives it.
 *
 * The player is a fixed test policy, not a person: Barret uses Change on his
 * first turn (so the back row shows), everyone Defends while the tail is up
 * (the hint), and otherwise Attacks.
 */

import { setFf7ExperimentReadyForTests } from '../../src/app/experiments/ff7Flag.ts';
import { attachStageHook } from '../../src/app/screens/BattleScreenStageHook.ts';
import { createEngine } from '../../src/app/screens/BattleScreenWiring.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import type { BattleEvent, Command } from '../../src/battle/common/types.ts';
import type { Ff7Combatant } from '../../src/battle/common/types-ff7.ts';
import { FF7_GUARD_SCORPION } from '../../src/data/chapter-ff7-guard-scorpion.ts';
import { BattlePresenter } from '../../src/engine/BattlePresenter.ts';
import { createDamageNumbers, createMessageBar } from '../../src/engine/BattlePresenterFallbacks.ts';
import { PaintedStage } from '../../src/engine/BattlePresenterStage.ts';
import { attackStrategy, defendStrategy } from '../../src/engine/BattlePresenterStrategies.ts';
import type { AutoStrategy } from '../../src/engine/BattlePresenterPorts.ts';
import { Renderer } from '../../src/engine/Renderer.ts';
import { loadScene } from '../../src/scenes/index.ts';

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed') ?? '1');
const game = document.getElementById('game')!;
const ui = document.getElementById('ui')!;

setFf7ExperimentReadyForTests(true); // the test-only override: the constant stays false

const renderer = new Renderer({ container: game, fov: 34 });
const loaded = await loadScene(FF7_GUARD_SCORPION.sceneKey, renderer.camera);
renderer.applyPalette(loaded.palette);
const stage = new PaintedStage({
  scene: loaded.scene,
  camera: renderer.camera,
  battleCamera: loaded.battleCamera,
  slots: loaded.slots,
  canvas: renderer.renderer.domElement,
  overlayRoot: ui,
});
const engine = await createEngine('ff7', setupForChapter(FF7_GUARD_SCORPION, seed));
await stage.stage(engine.state());
const hook = await attachStageHook('ff7', loaded, stage, engine.state());

const seen: Array<{ type: BattleEvent['type']; at: number }> = [];
let changed = false;
const policy: AutoStrategy = (actorId, commands, eng) => {
  const boss = eng.state().combatants['guard-scorpion'] as Ff7Combatant | undefined;
  if (actorId === 'barret' && !changed) {
    const change = commands.find((c) => c.command.kind === 'row-change' && c.enabled !== false);
    if (change) {
      changed = true;
      return change.command as Command;
    }
  }
  if (boss?.ff7.formIndex === 1) return defendStrategy(actorId, commands, eng);
  return attackStrategy(actorId, commands, eng);
};

const presenter = new BattlePresenter({
  stage,
  hud: null,
  damageNumbers: createDamageNumbers(ui),
  messageBar: createMessageBar(ui),
  midScripts: {},
});
presenter.setAutoPlay(policy);
const origPlay = presenter.play.bind(presenter);
presenter.play = (events) => {
  for (const e of events) seen.push({ type: e.type, at: performance.now() });
  return origPlay(events);
};

let last = performance.now();
let frames = 0;
function frame(now: number): void {
  const dt = Math.min((now - last) / 1000, 1 / 20);
  last = now;
  loaded.update(dt);
  hook?.sync(engine.state());
  stage.update(dt);
  renderer.render(loaded.scene, renderer.camera);
  frames++;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

let outcome: string | null = null;
void presenter.run(engine).then((o) => {
  outcome = o.kind;
});

Object.assign(window, {
  __ff7stage: {
    frames: () => frames,
    outcome: () => outcome,
    events: () => seen.map((e) => e.type),
    rows: () =>
      Object.fromEntries(engine.state().activeIds.map((id) => [id, (engine.state().combatants[id] as Ff7Combatant).ff7.row])),
    formIndex: () => (engine.state().combatants['guard-scorpion'] as Ff7Combatant).ff7.formIndex ?? 0,
    snapshot: () =>
      stage.snapshot().map((s) => {
        const a = stage.actor(s.id)!;
        return { ...s, x: a.position.x, y: a.position.y, z: a.position.z, feet: stage.project(s.id, 'feet'), head: stage.project(s.id, 'head'), rect: stage.projectRect(s.id) };
      }),
    camera: () => ({ position: renderer.camera.position.toArray(), fov: renderer.camera.fov, rig: loaded.battleCamera.rigName }),
    numerals: () => [...ui.querySelectorAll('.pf-num')].map((n) => n.textContent),
  },
});
