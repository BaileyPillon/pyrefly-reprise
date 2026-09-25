// @vitest-environment jsdom
/**
 * The "Oversoul!" caption in the FFX-2 battle message line.
 *
 * **Game case: FFX-2 only** [AGENTS.md rule 14]. Source: the FF Wiki page
 * *Oversoul (Final Fantasy X-2)* (revid 4041089) and its screenshot
 * *File:Oversoul FFX-2.jpg* (file page revid 2493543), which shows an
 * "Oversoul!" action caption over the fiends as they change
 * (`docs/concepts/chapters/trema/oversoul/README.md`). The engine plays the
 * Oversoul as the line "Paragon oversouls!" with no `action-start`.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { MESSAGE_HOLD_MS } from '../../src/ui/ffx2/battleMessage.ts';

describe('FFX2 message line: the Oversoul caption', () => {
  let root: HTMLElement;
  let hud: FFX2BattleHud;
  const banner = (): HTMLElement => root.querySelector<HTMLElement>('[data-role="battle-message"]')!;
  const nameOf = (): string => banner().querySelector('[data-role="name"]')!.textContent ?? '';
  const chipOf = (): string => banner().querySelector('[data-role="chip"]')!.textContent ?? '';

  beforeEach(() => {
    vi.useFakeTimers();
    root = document.createElement('div');
    document.body.appendChild(root);
    hud = new FFX2BattleHud();
    hud.mount(root);
  });
  afterEach(() => {
    hud.unmount();
    root.remove();
    vi.useRealTimers();
  });

  it('shows "Paragon · Oversoul!" at the line, never the last girl\'s name', () => {
    void hud.onEvent({ seq: 1, type: 'action-start', actorId: 'rikku' } as never);
    void hud.onEvent({ seq: 2, type: 'message', text: 'Paragon oversouls!', kind: 'system' });
    expect(banner().hidden).toBe(false);
    expect(nameOf()).toBe('Paragon');
    expect(chipOf()).toBe('Oversoul!');
  });

  it('shows it once per fiend', () => {
    void hud.onEvent({ seq: 1, type: 'message', text: 'Paragon oversouls!', kind: 'system' });
    vi.advanceTimersByTime(MESSAGE_HOLD_MS + 10);
    expect(banner().hidden).toBe(true);
    void hud.onEvent({ seq: 2, type: 'message', text: 'Paragon oversouls!', kind: 'system' });
    expect(banner().hidden).toBe(true);
  });

  it('leaves every other line as it was', () => {
    void hud.onEvent({ seq: 1, type: 'action-start', actorId: 'rikku' } as never);
    void hud.onEvent({ seq: 2, type: 'message', text: 'Nothing was stolen!', kind: 'system' });
    expect(chipOf()).toBe('Nothing was stolen!');
  });
});
