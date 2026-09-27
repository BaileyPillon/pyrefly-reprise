// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { ActingFade, ACTING_CLASS } from '../../src/ui/ffx/actingFade.ts';

/**
 * PR-0157, FFX half (method check: the fade): while an action plays, the FFX
 * HUD's cards step back so none sits over the actor, the target or the party.
 * The class rides B2's acting signal (`HudPort.setActing`). FFX only.
 */
describe('ActingFade', () => {
  it('sets the class on action-start and clears it on action-end', () => {
    const root = document.createElement('div');
    const fade = new ActingFade(root);
    fade.set({ phase: 'action-start', actorId: 'seymour-flux', targets: ['tidus'] });
    expect(root.classList.contains(ACTING_CLASS)).toBe(true);
    fade.set({ phase: 'action-end', actorId: 'seymour-flux' });
    expect(root.classList.contains(ACTING_CLASS)).toBe(false);
  });

  it('a cancelled action clears it too', () => {
    const root = document.createElement('div');
    const fade = new ActingFade(root);
    fade.set({ phase: 'action-start', actorId: 'tidus', targets: [] });
    fade.set({ phase: 'cancel', actorId: 'tidus' });
    expect(root.classList.contains(ACTING_CLASS)).toBe(false);
  });

  it('clear() takes it off whatever the signal said (unmount, a new decision)', () => {
    const root = document.createElement('div');
    const fade = new ActingFade(root);
    fade.set({ phase: 'action-start', actorId: 'tidus', targets: [] });
    fade.clear();
    expect(root.classList.contains(ACTING_CLASS)).toBe(false);
  });
});
