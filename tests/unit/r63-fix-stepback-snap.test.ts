// @vitest-environment jsdom
/**
 * R63-PLAY, the overnight fix of the skeptic's m1 (the Chapter I step-back snap; FFX).
 */
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PartyStatusWindow } from '../../src/ui/ffx/PartyStatusWindow.ts';

const REPO = join(__dirname, '..', '..');
const src = (rel: string): string => readFileSync(join(REPO, rel), 'utf8').replace(/\r\n/g, '\n');
void src;
void vi;

// ------------------------------------------------------------------------------------------------ H: the step-back snap (Chapter I, FFX)


describe('H: a re-render of the party rows does not snap the slim cards to full height (the skeptic\'s m1)', () => {
  const party = (): Record<string, never> =>
    Object.fromEntries(['tidus', 'yuna'].map((id) => [id, { id, name: id, side: 'party', alive: true, hp: 100, mp: 10, stats: { maxHp: 100, maxMp: 10 }, statuses: {}, portraitKey: id, spriteKey: id }])) as never;

  it('each new row starts from the height its old row had and the inline style is gone once the transition is armed', () => {
    const host = document.createElement('div');
    host.className = 'hud-f1';
    const w = new PartyStatusWindow();
    host.append(w.el);
    document.body.append(host);
    // the used height of a row, per read: the old row first (slim), then the new one (the stylesheet says full for Tidus: the class came off in the same frame)
    let seq: Record<string, string[]> = {};
    const spy = vi.spyOn(window, 'getComputedStyle').mockImplementation(((el: Element) => ({ height: seq[(el as HTMLElement).dataset['actor'] ?? '']?.shift() ?? '0px' })) as never);
    try {
      w.render(['tidus', 'yuna'], party() as never, null); // the first render: no old rows, nothing to carry
      expect(w.el.querySelectorAll('.ig-stat')).toHaveLength(2);
      seq = { tidus: ['20.5px', '28px'], yuna: ['20.5px', '20.5px'] };
      const reads: string[] = []; // what the inline style says at the moment the page is made to lay out
      const orig = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight')!;
      Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get(this: HTMLElement) { reads.push(`${this.dataset['actor']} ${this.style.height} ${this.style.transition}`); return 0; } });
      try {
        w.render(['tidus', 'yuna'], party() as never, 'tidus');
      } finally {
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', orig);
      }
      // Tidus's new row stood at the 20.5 it had, with no transition, while the page laid out, then was released to the stylesheet's 28; Yuna's height did not change and was not touched
      expect(reads).toEqual(['tidus 20.5px none']);
      for (const row of w.el.querySelectorAll<HTMLElement>('.ig-stat')) {
        expect(row.style.height).toBe('');
        expect(row.style.transition).toBe('');
      }
    } finally {
      spy.mockRestore();
      host.remove();
    }
  });

  it('outside the F1 HUD nothing is measured or set (today\'s HUD renders as it always did)', () => {
    const w = new PartyStatusWindow();
    document.body.append(w.el);
    const spy = vi.spyOn(window, 'getComputedStyle');
    try {
      w.render(['tidus'], party() as never, null);
      w.render(['tidus'], party() as never, null);
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
      w.el.remove();
    }
  });
});
