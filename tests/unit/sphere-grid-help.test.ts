// @vitest-environment jsdom
/**
 * The Sphere Grid's first-time explainer (A) and AUTO-LEARN result (C), as the
 * tab drives them (Bailey's pick D-290). FFX only.
 *
 * - the card opens once, is recorded through the existing coaching list, and
 *   `?` reopens it; `?coach=off`-style suppression hides it like every coach surface;
 * - while it is open it takes every key, so Enter never reaches the shell;
 * - AUTO-LEARN's UNDO restores the build, KEEP keeps it, and leaving the tab keeps it.
 */

import { afterEach, describe, expect, it } from 'vitest';

import type { Button, InputSnapshot } from '../../src/app/Input.ts';
import { gagazetBuild } from '../../src/data/ffx/builds/gagazet.ts';
import { hasSeen, resetCoach, setCoachingEnabled } from '../../src/ui/coach/coachState.ts';
import { CARD_ID, SphereGridHelp } from '../../src/ui/ffx/party-prep/sphereGridHelp.ts';
import { SphereGridModel } from '../../src/ui/ffx/party-prep/sphereGridModel.ts';
import { SphereGridView } from '../../src/ui/ffx/party-prep/SphereGridView.ts';

function input(...down: Button[]): InputSnapshot & { eaten: Set<Button> } {
  const eaten = new Set<Button>();
  return {
    eaten,
    pressed: (b) => down.includes(b),
    justPressed: (b) => down.includes(b) && !eaten.has(b),
    justReleased: () => false,
    consume: (b) => {
      if (!down.includes(b) || eaten.has(b)) return false;
      eaten.add(b);
      return true;
    },
    axis: { x: 0, y: 0 },
    actions: [],
    gamepadConnected: false,
    lastDevice: 'keyboard',
  };
}

function rig() {
  document.body.innerHTML = '<div class="prep"><div class="prep__stage"><div class="prep__panel"></div></div></div>';
  const container = document.querySelector<HTMLElement>('.prep__panel')!;
  const build = structuredClone(gagazetBuild);
  const model = new SphereGridModel(build);
  const view = new SphereGridView();
  view.show(model, 'tidus');
  let refreshed = 0;
  const said: string[] = [];
  const help = new SphereGridHelp({
    container,
    model: () => model,
    view: () => view,
    memberId: () => 'tidus',
    memberName: () => 'Tidus',
    refresh: () => refreshed++,
    say: (m) => said.push(m),
  });
  return { container, build, model, view, help, said, refreshed: () => refreshed };
}

afterEach(() => {
  resetCoach();
  document.body.innerHTML = '';
});

describe('Sphere Grid explainer card (A, FFX only)', () => {
  it('opens the first time, over the stage, and is recorded as seen when closed', () => {
    const { help } = rig();
    expect(hasSeen(CARD_ID)).toBe(false);
    help.maybeShowFirstTime();
    const card = document.querySelector('.prep__stage > .sgx-layer--card');
    expect(card).not.toBeNull();
    expect(card!.textContent).toContain("Spend Tidus's Sphere Levels before the fight");
    expect(card!.textContent).toContain('not saved');
    help.press('got');
    expect(document.querySelector('.sgx-layer--card')).toBeNull();
    expect(hasSeen(CARD_ID)).toBe(true);

    // A later mount does not show it again; `?` does.
    const again = rig();
    again.help.maybeShowFirstTime();
    expect(document.querySelector('.sgx-layer--card')).toBeNull();
    again.help.press('help');
    expect(document.querySelector('.sgx-layer--card')).not.toBeNull();
  });

  it('stays away when coaching is suppressed (captures, ?coach=off)', () => {
    setCoachingEnabled(false);
    const { help } = rig();
    help.maybeShowFirstTime();
    expect(document.querySelector('.sgx-layer--card')).toBeNull();
  });

  it('takes every key while open: Enter presses GOT IT and never reaches the shell', () => {
    const { help } = rig();
    help.openCard();
    const arrows = input('right', 'up');
    expect(help.handleInput(arrows)).toBe(true);
    expect(arrows.eaten.has('right') && arrows.eaten.has('up')).toBe(true);
    // Right chose SHOW ME; Left goes back to GOT IT.
    help.handleInput(input('left'));
    const enter = input('confirm');
    expect(help.handleInput(enter)).toBe(true);
    expect(enter.eaten.has('confirm')).toBe(true);
    expect(document.querySelector('.sgx-layer--card')).toBeNull();
    // Nothing open: the keys are the panel's and the shell's again.
    expect(help.handleInput(input('confirm'))).toBe(false);
  });
});

describe('AUTO-LEARN result (C, FFX only)', () => {
  it('UNDO restores the build exactly; KEEP keeps it', () => {
    const { build, help, view } = rig();
    const before = JSON.stringify(build);
    help.press('auto');
    expect(help.pending?.activated.length).toBe(4);
    expect(view.highlights.size).toBe(4);
    expect(document.querySelector('.sgx-result')!.textContent).toContain('4 nodes along his own path');
    help.press('undo');
    expect(JSON.stringify(build)).toBe(before);
    expect(view.highlights.size).toBe(0);
    expect(document.querySelector('.sgx-result')).toBeNull();

    help.press('auto');
    const after = JSON.stringify(build);
    help.press('keep');
    expect(JSON.stringify(build)).toBe(after);
    expect(after).not.toBe(before);
    expect(document.querySelector('.sgx-result')).toBeNull();
  });

  it('leaving the tab settles an open result as kept', async () => {
    const { build, container, help } = rig();
    help.press('auto');
    const after = JSON.stringify(build);
    container.hidden = true;
    await new Promise((r) => setTimeout(r, 0));
    expect(help.pending).toBeNull();
    expect(JSON.stringify(build)).toBe(after);
  });

  it('says so, and changes nothing, when nothing can be paid for', () => {
    const { build, help, said } = rig();
    for (const k of Object.keys(build.sphereInventory)) build.sphereInventory[k] = 0;
    const before = JSON.stringify(build);
    help.press('auto');
    expect(JSON.stringify(build)).toBe(before);
    expect(said.at(-1)).toContain('Nothing on Tidus');
  });
});
