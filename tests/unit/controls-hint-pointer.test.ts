// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';

import { ControlsHint } from '../../src/ui/common/ControlsHint.ts';

/** A hint that names one action is also its button, for a mouse or touch player. */
describe('ControlsHint pointer actions', () => {
  const mount = () => {
    const root = document.createElement('div');
    const hint = new ControlsHint({
      root,
      items: [
        { keyboard: 'Left/Right', gamepad: 'D-pad', label: 'choose' },
        { keyboard: 'Enter', gamepad: 'Cross', label: 'select', action: 'confirm' },
        { keyboard: 'Esc', gamepad: 'Circle', label: 'back', action: 'cancel' },
      ],
    });
    hint.mount();
    return hint;
  };

  it('puts the action on the chips that have one, as buttons', () => {
    const items = [...mount().el.querySelectorAll<HTMLElement>('.chint__item')];
    expect(items.map((i) => i.dataset['action'] ?? null)).toEqual([null, 'confirm', 'cancel']);
    expect(items[2]!.getAttribute('role')).toBe('button');
  });

  it('leaves a hint with no single target click-through', () => {
    const first = mount().el.querySelector<HTMLElement>('.chint__item')!;
    expect(first.hasAttribute('data-action')).toBe(false);
    expect(first.hasAttribute('role')).toBe(false);
  });

  it('keeps the action when the wording follows a new device', () => {
    const hint = mount();
    hint.handleInput({ lastDevice: 'gamepad' } as Parameters<ControlsHint['handleInput']>[0]);
    const back = [...hint.el.querySelectorAll<HTMLElement>('.chint__item')][2]!;
    expect(back.textContent).toContain('Circle');
    expect(back.dataset['action']).toBe('cancel');
  });
});
