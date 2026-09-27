/**
 * The FF7 command window's rules (`src/ui/ff7/ff7MenuModel.ts`), pure: the four
 * fixed slots, Limit replacing Attack, blanks the finger skips, the Magic grid,
 * grey commands, the target step, the Wait level and SELECT's help
 * (`docs/plans/ff7-hud-faithful-a-spec.md` §3.5, §3.7, §5.8). Game case: FF7 only.
 */
import { describe, expect, it } from 'vitest';

import type { AvailableCommand } from '../../src/battle/common/types.ts';
import {
  aimedTargets,
  buildSlots,
  menuLevel,
  openMenu,
  step,
  tapTarget,
  type Ff7MenuState,
  type MenuInput,
} from '../../src/ui/ff7/ff7MenuModel.ts';
import { Ff7HudFixture } from '../../src/ui/ff7/ff7HudFixture.ts';

function press(st: Ff7MenuState, ...inputs: MenuInput[]): ReturnType<typeof step> {
  let r = { state: st, handled: true } as ReturnType<typeof step>;
  for (const i of inputs) {
    r = step(r.state, i);
    if (r.done) return r;
  }
  return r;
}

describe('the four slots', () => {
  it('reads Attack, Magic, blank, Item for Cloud at the Guard Scorpion', () => {
    const slots = buildSlots(new Ff7HudFixture().commands('cloud'));
    expect(slots.map((s) => s?.label ?? null)).toEqual(['Attack', 'Magic', null, 'Item']);
  });

  it('puts Limit in slot 1 instead of Attack while the gauge is full', () => {
    const fx = new Ff7HudFixture();
    fx.fighters['cloud']!.limit = 255;
    const slots = buildSlots(fx.commands('cloud'));
    expect(slots[0]?.label).toBe('Limit');
    expect(slots.some((s) => s?.label === 'Attack')).toBe(false);
  });

  it('ignores rows that are not FF7 battle commands', () => {
    const odd = { command: { kind: 'defend', targets: [] }, label: 'Defend', category: 'special', mpCost: 0, enabled: true, validTargets: [] } as unknown as AvailableCommand;
    expect(buildSlots([odd]).every((s) => s === null)).toBe(true);
  });

  it('skips the blank Summon slot, both ways, and wraps', () => {
    const st = openMenu(new Ff7HudFixture().commands('cloud'));
    expect(st.topIdx).toBe(0);
    expect(press(st, 'down', 'down').state.topIdx).toBe(3);
    expect(press(st, 'up').state.topIdx).toBe(3);
    expect(press(st, 'down', 'down', 'down').state.topIdx).toBe(0);
  });
});

describe('choosing', () => {
  const cmds = new Ff7HudFixture().commands('cloud');

  it('Attack goes to the target step, confirm sends it at the boss', () => {
    const r = press(openMenu(cmds), 'confirm');
    expect(r.state.view).toBe('target');
    expect(aimedTargets(r.state)).toEqual(['guard-scorpion']);
    const done = step(r.state, 'confirm');
    expect(done.done).toEqual({ kind: 'attack', targets: ['guard-scorpion'] });
  });

  it('Magic opens the three-column list; Bolt sits right of Ice', () => {
    const r = press(openMenu(cmds), 'down', 'confirm');
    expect(r.state.view).toBe('magic');
    const bolt = press(r.state, 'right', 'confirm', 'confirm');
    expect(bolt.done).toEqual({ kind: 'ability', id: 'bolt', targets: ['guard-scorpion'] });
  });

  it('a grey command refuses and stays put', () => {
    const r = press(openMenu(cmds), 'down', 'down', 'confirm', 'down');
    expect(r.state.view).toBe('item');
    expect(r.state.subIdx).toBe(1); // Phoenix Down: no one to revive
    const refused = step(r.state, 'confirm');
    expect(refused.refused).toBe(true);
    expect(refused.state.view).toBe('item');
  });

  it('a spell you cannot pay for is grey', () => {
    const fx = new Ff7HudFixture();
    fx.fighters['cloud']!.mp = 3;
    const r = press(openMenu(fx.commands('cloud')), 'down', 'confirm', 'confirm');
    expect(r.refused).toBe(true);
  });

  it('Potion aims at the party, opening on the preferred ally order', () => {
    const r = press(openMenu(cmds), 'down', 'down', 'confirm', 'confirm');
    expect(r.state.view).toBe('target');
    expect(r.state.targets).toEqual(['cloud', 'barret']);
    const moved = step(r.state, 'down');
    expect(aimedTargets(moved.state)).toEqual(['barret']);
  });

  it('the Limit window lists Braver and sends a limit command', () => {
    const fx = new Ff7HudFixture();
    fx.fighters['cloud']!.limit = 255;
    const r = press(openMenu(fx.commands('cloud')), 'confirm');
    expect(r.state.view).toBe('limit');
    const done = press(r.state, 'confirm', 'confirm');
    expect(done.done).toEqual({ kind: 'limit', id: 'braver', targets: ['guard-scorpion'] });
  });

  it('an All command aims at every target at once', () => {
    const all = { command: { kind: 'ability', id: 'x', targets: [] }, label: 'X', category: 'blackmagic', mpCost: 0, enabled: true, validTargets: ['a', 'b'], targeting: 'all-enemies' } as AvailableCommand;
    const r = press(openMenu([all]), 'confirm', 'confirm');
    expect(r.state.targetAll).toBe(true);
    expect(aimedTargets(r.state)).toEqual(['a', 'b']);
    expect(step(r.state, 'confirm').done).toEqual({ kind: 'ability', id: 'x', targets: ['a', 'b'] });
  });
});

describe('cancel, Wait and help', () => {
  const cmds = new Ff7HudFixture().commands('cloud');

  it("steps back one level; cancel on the slots is not the menu's (the pause may take Esc)", () => {
    const deep = press(openMenu(cmds), 'down', 'confirm', 'confirm');
    expect(deep.state.view).toBe('target');
    const back = step(deep.state, 'cancel');
    expect(back.state.view).toBe('magic');
    const top = step(back.state, 'cancel');
    expect(top.state.view).toBe('top');
    expect(step(top.state, 'cancel').handled).toBe(false);
  });

  it("reports 'top' on the slots and 'deep' in a list or aiming (Wait stops time there)", () => {
    const st = openMenu(cmds);
    expect(menuLevel(st)).toBe('top');
    expect(menuLevel(press(st, 'down', 'confirm').state)).toBe('deep');
    expect(menuLevel(press(st, 'confirm').state)).toBe('deep');
  });

  it('SELECT (help) toggles without moving the finger', () => {
    const st = openMenu(cmds);
    const on = step(st, 'help');
    expect(on.state.help).toBe(true);
    expect(on.state.topIdx).toBe(st.topIdx);
    expect(step(on.state, 'help').state.help).toBe(false);
  });

  it('a tap on a target moves the finger; a tap on the aimed one confirms', () => {
    const aim = press(openMenu(cmds), 'down', 'down', 'confirm', 'confirm').state;
    const moved = tapTarget(aim, 'barret');
    expect(moved.done).toBeUndefined();
    expect(aimedTargets(moved.state)).toEqual(['barret']);
    expect(tapTarget(moved.state, 'barret').done).toEqual({ kind: 'item', id: 'potion', targets: ['barret'] });
  });
});
