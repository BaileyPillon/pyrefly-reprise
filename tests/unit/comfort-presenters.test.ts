// @vitest-environment jsdom
/**
 * OPTIONS accessibility A2 (D-285, PR-0032): what each comfort flag does to the
 * presenters that honour it, measured on the real classes.
 *
 * - REDUCE MOTION (D-220 Q2, option (a)): the battle camera's rig changes become
 *   cuts and its shake, punch, push, roll and idle sway stop (`ComfortCamera.ts`,
 *   `BattleCamera.swayOff`), while every awaited move still takes the same time;
 *   the Ink & Gold wipe and cut-ins follow the row (`inkgold/wipe.ts`).
 * - LOW EFFECTS: the hit sparks draw a fraction of their particles
 *   (`VFX.SparkBurst.emit`), and the spell effects drop to their `low` tier.
 * - TEXT SIZE: the FFX desktop command list shows four rows at 130 % and five at
 *   115 % (`hudTextSize.ts`), the phone keeps all of them.
 *
 * Game case: both for the camera, the flags and the effects; the command list is FFX only.
 */
import { PerspectiveCamera } from 'three';
import { afterEach, describe, expect, it } from 'vitest';

import { BattleCamera } from '../../src/engine/BattleCamera.ts';
import { LOW_EFFECTS_SPARK_SHARE, StillCamera } from '../../src/engine/ComfortCamera.ts';
import type { CameraPort } from '../../src/engine/BattlePresenterPorts.ts';
import { SparkBurst } from '../../src/engine/VFX.ts';
import { resolveFxQuality } from '../../src/engine/spellfx/SpellFxParams.ts';
import { prefersReducedMotion } from '../../src/ui/inkgold/wipe.ts';
import { applyComfort } from '../../src/app/applyComfort.ts';
import { SaveStore } from '../../src/app/SaveData.ts';
import { battleComfort } from '../../src/app/screens/battleComfort.ts';
import { commandRowsCap, currentTextScale, grownFromTopLeft } from '../../src/ui/common/hudTextSize.ts';
import { CommandMenu } from '../../src/ui/ffx/CommandMenu.ts';
import { makeFakeCombatants, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

afterEach(() => {
  applyComfort({ textSize: 1, reduceMotion: false, lowEffects: false });
  document.documentElement.removeAttribute('data-phone-battle');
  document.body.innerHTML = '';
});

// ------------------------------------------------------------ REDUCE MOTION

type Call = [string, ...unknown[]];
function fakeCamera(): CameraPort & { calls: Call[] } {
  const calls: Call[] = [];
  return {
    calls,
    moveTo: async (rig, ms) => void calls.push(['moveTo', rig, ms]),
    snapTo: (rig) => void calls.push(['snapTo', rig]),
    shake: (a, ms) => void calls.push(['shake', a, ms]),
    punch: async (f, ms) => void calls.push(['punch', f, ms]),
    push: async (f, ms) => void calls.push(['push', f, ms]),
    release: async (ms) => void calls.push(['release', ms]),
    roll: async (d, ms) => void calls.push(['roll', d, ms]),
    rigNames: ['idle', 'attack'],
    rigName: 'idle',
  };
}

describe('REDUCE MOTION on the battle camera (StillCamera)', () => {
  it('off: every call passes through untouched', async () => {
    const inner = fakeCamera();
    const cam = new StillCamera(inner, () => false);
    cam.shake(0.2, 300);
    await cam.punch(0.12, 420);
    await cam.push(0.1, 900);
    await cam.roll(-4, 420);
    await cam.moveTo('attack', 600);
    expect(inner.calls).toEqual([
      ['shake', 0.2, 300],
      ['punch', 0.12, 420],
      ['push', 0.1, 900],
      ['roll', -4, 420],
      ['moveTo', 'attack', 600],
    ]);
  });

  it('on: no shake; punch, push and roll keep their time with no movement; a rig change is a cut', async () => {
    const inner = fakeCamera();
    const cam = new StillCamera(inner, () => true);
    cam.shake(0.2, 300);
    await cam.punch(0.12, 420);
    await cam.push(0.1, 900);
    await cam.roll(-4, 420);
    await cam.release(420);
    await cam.moveTo('attack', 600);
    expect(inner.calls).toEqual([
      ['punch', 0, 420],
      ['push', 0, 900],
      ['roll', 0, 420],
      ['release', 420],
      ['snapTo', 'attack'],
      ['moveTo', 'attack', 600],
    ]);
  });

  it('on the real BattleCamera: the cut lands at once, the move still resolves after its ms, and nothing sways or shakes', async () => {
    const three = new PerspectiveCamera(40, 16 / 9, 0.1, 100);
    const rigs = {
      idle: { position: [0, 2, 8] as [number, number, number], lookAt: [0, 1, 0] as [number, number, number] },
      attack: { position: [3, 2, 6] as [number, number, number], lookAt: [1, 1, 0] as [number, number, number] },
    };
    const bc = new BattleCamera(three, { rigs, initial: 'idle' });
    let still = true;
    bc.swayOff = () => still;
    const cam = new StillCamera(bc, () => still);

    let done = false;
    void cam.moveTo('attack', 600).then(() => (done = true));
    bc.update(0.016);
    expect(three.position.x, 'a cut: already on the new rig').toBeCloseTo(3, 5);
    await Promise.resolve();
    expect(done, 'but the move has not finished').toBe(false);
    for (let t = 0; t < 40; t++) bc.update(0.016); // 640 ms
    await Promise.resolve();
    await Promise.resolve();
    expect(done, 'it resolves after its own 600 ms').toBe(true);

    cam.shake(0.3, 400);
    const at = three.position.clone();
    for (let t = 0; t < 30; t++) bc.update(0.05);
    expect(three.position.distanceTo(at), 'no sway, no shake').toBeLessThan(1e-9);

    still = false;
    cam.shake(0.3, 400);
    for (let t = 0; t < 5; t++) bc.update(0.05);
    expect(three.position.distanceTo(at), 'with the row off, the camera breathes and shakes again').toBeGreaterThan(1e-4);
  });

  it('the Ink & Gold wipe follows the row, not only the OS query', () => {
    expect(prefersReducedMotion()).toBe(false);
    applyComfort({ reduceMotion: true });
    expect(prefersReducedMotion()).toBe(true);
    // An injected host (the unit-test path) still answers for itself.
    expect(prefersReducedMotion({ matchMedia: () => ({ matches: false }) } as never)).toBe(false);
  });

  it('battleComfort() reads the save the pause writes', () => {
    const store = new SaveStore('comfort-presenters', null);
    store.setSettings({ reduceMotion: true, lowEffects: true });
    expect(battleComfort()).toEqual({ reduceMotion: true, lowEffects: true });
    store.setSettings({ reduceMotion: false, lowEffects: false });
    expect(battleComfort().lowEffects).toBe(false);
  });
});

// -------------------------------------------------------------- LOW EFFECTS

describe('LOW EFFECTS', () => {
  it('the hit sparks draw a fraction of their particles, and all of them with the row off', () => {
    const sparks = new SparkBurst({ count: 110 });
    sparks.emit({ x: 0, y: 0, z: 0 }, 1, LOW_EFFECTS_SPARK_SHARE);
    expect(sparks.geometry.drawRange.count).toBe(Math.round(110 * LOW_EFFECTS_SPARK_SHARE));
    sparks.emit({ x: 0, y: 0, z: 0 });
    expect(sparks.geometry.drawRange.count).toBe(110);
    sparks.dispose();
  });

  it('the spell effects drop to their low tier (bloom only)', () => {
    expect(resolveFxQuality({ lowEffects: true, reduceMotion: false, width: 1600, height: 900 })).toBe('low');
    expect(resolveFxQuality({ lowEffects: false, reduceMotion: false, width: 1600, height: 900 })).toBe('full');
  });
});

// ---------------------------------------------------------------- TEXT SIZE

describe('TEXT SIZE on the FFX command list', () => {
  const openMenu = (): CommandMenu => {
    const menu = new CommandMenu();
    document.body.append(menu.stackEl, menu.breadcrumbEl);
    void menu.open({ actorId: 'tidus', commands: makeFakeCommands(), previewRank: () => [], combatants: makeFakeCombatants(), setHelp: () => {} });
    return menu;
  };
  const rows = (m: CommandMenu): number => m.stackEl.querySelectorAll('.ig-cmd').length;

  it('the cap follows the step, and the upright phone keeps every row', () => {
    expect(commandRowsCap(6)).toBe(6);
    applyComfort({ textSize: 1.15 });
    expect(currentTextScale()).toBe(1.15);
    expect(commandRowsCap(6)).toBe(5);
    applyComfort({ textSize: 1.3 });
    expect(commandRowsCap(6)).toBe(4);
    expect(commandRowsCap(3)).toBe(3);
    document.documentElement.setAttribute('data-phone-battle', 'ffx');
    expect(commandRowsCap(6)).toBe(6);
  });

  it('the rendered stack shows four rows at 130 % and scrolls (the more-arrow is up)', () => {
    const total = rows(openMenu());
    document.body.innerHTML = '';
    expect(total).toBeGreaterThan(4);
    applyComfort({ textSize: 1.3 });
    const menu = openMenu();
    expect(rows(menu)).toBe(4);
    expect(menu.stackEl.querySelector('.ffx-cmd-more')).not.toBeNull();
  });

  it('the advisor solver keeps the grown help slab clear', () => {
    const slot = { left: 24, top: 125, right: 196, bottom: 154 };
    expect(grownFromTopLeft(slot)).toEqual(slot);
    applyComfort({ textSize: 1.3 });
    const grown = grownFromTopLeft(slot);
    expect(grown.left).toBe(24);
    expect(grown.top).toBe(125);
    expect(grown.right).toBeCloseTo(24 + 172 * 1.3, 6);
    expect(grown.bottom).toBeCloseTo(125 + 29 * 1.3, 6);
  });
});
