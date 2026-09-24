// @vitest-environment jsdom
/**
 * PR-0005 option B (FFX only, Bailey's D-042, `docs/concepts/layout/pr-0005-ffx/b-under.png`):
 * while the turn cut-in plays, only the live command cascade is drawn above the slab; every
 * other part of the FFX HUD stays drawn under it. The repair 5846f4e0 hid every other stage
 * child instead (CTB list, party status, Sensor panel, telegraph banner and border vanished
 * for the whole hold); this pins the layering that replaced it.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { FFX_HUD_CUTIN_BELOW, liftCommandArea } from '../../src/ui/ffx/cutInLift.ts';
import { playTurnCutIn } from '../../src/ui/common/transitions/TurnCutInLayer.ts';

function mountHud(): { hud: FFXBattleHud; root: HTMLElement; host: HTMLElement } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  const host = document.createElement('div');
  host.className = 'pf-mom';
  root.appendChild(host);
  return { hud, root, host };
}

const stageOf = (hud: FFXBattleHud) => hud.el.querySelector<HTMLElement>(':scope > .ffxhud__stage:not(.ffxhud__lift)')!;
const liftOf = (hud: FFXBattleHud) => hud.el.querySelector<HTMLElement>(':scope > .ffxhud__lift')!;
const childClasses = (el: HTMLElement) => [...el.children].map((c) => c.className);

afterEach(() => {
  document.body.innerHTML = '';
});

describe('PR-0005 B: the cut-in lifts only the command cascade (FFX only)', () => {
  it('the HUD carries an empty lift layer after the stage, with the same letterbox transform', () => {
    const { hud } = mountHud();
    const lift = liftOf(hud);
    expect(lift).not.toBeNull();
    expect(lift.children.length).toBe(0);
    expect(lift.previousElementSibling).toBe(stageOf(hud));
    expect(lift.style.transform).toBe(stageOf(hud).style.transform);
  });

  it('moves .ffx-cmd-area into the lift and back to its own slot, leaving every other stage child in place', () => {
    const { hud } = mountHud();
    const stage = stageOf(hud);
    const before = childClasses(stage);
    const area = stage.querySelector<HTMLElement>(':scope > .ffx-cmd-area')!;
    const others = [...stage.children].filter((c) => c !== area);

    const undo = liftCommandArea(hud.el);
    expect(hud.el.classList.contains(FFX_HUD_CUTIN_BELOW)).toBe(true);
    expect(area.parentElement).toBe(liftOf(hud));
    // CTB list, info, party status, Sensor, telegraph banner and border all stay put.
    for (const o of others) expect(o.parentElement).toBe(stage);
    expect(stage.querySelector('.ig-ctb')).not.toBeNull();

    undo();
    expect(hud.el.classList.contains(FFX_HUD_CUTIN_BELOW)).toBe(false);
    expect(childClasses(stage)).toEqual(before);
    expect(liftOf(hud).children.length).toBe(0);
  });

  it('playTurnCutIn (FFX) lifts the cascade for exactly its own lifetime; FFX-2 is untouched', async () => {
    const { hud, host } = mountHud();
    const area = hud.el.querySelector<HTMLElement>('.ffx-cmd-area')!;
    const req = { actorId: 'tidus', name: 'Tidus', label: 'CTB 1 OF 3', side: 'left' as const, holdMs: 0 };

    const done = playTurnCutIn(host, { ...req, game: 'ffx' });
    expect(area.parentElement).toBe(liftOf(hud));
    expect(host.querySelector('[data-role="turn-cut-in"]')).not.toBeNull();
    await done;
    expect(area.parentElement).toBe(stageOf(hud));
    expect(hud.el.classList.contains(FFX_HUD_CUTIN_BELOW)).toBe(false);

    const done2 = playTurnCutIn(host, { ...req, game: 'ffx2' });
    expect(area.parentElement).toBe(stageOf(hud));
    expect(hud.el.classList.contains(FFX_HUD_CUTIN_BELOW)).toBe(false);
    await done2;
  });

  it('ffx-hud.css raises only the lift, never hides stage children, never gives the stage a z-index', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/ui/ffx/ffx-hud.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(css).not.toMatch(/cutin-below[^{]*\.ffxhud__stage[^{]*\{[^}]*visibility\s*:\s*hidden/);
    expect(css).not.toMatch(/cutin-below\s+\.ffxhud__stage\s*\{/);
    expect(css).toMatch(/\.ffxhud--cutin-below\s+\.ffxhud__lift\s*\{\s*z-index:\s*37;/);
  });
});
