// @vitest-environment jsdom
/**
 * The advisor's `N` chip at both of the sizes it can take (`src/ui/ffx/advisorChipSizes.ts`; FFX only, Chapters I and III while the guide is folded).
 *
 * The folded guide's dock (`advisorFolded.ts`) is sized by what the chip **can** be, never by what it is at the moment of the solve: sized by what it is, the dock was solved for the badge while the
 * tip was up, found room, put the card up (the chip grew to its whole label), was solved again for the label, found none, and put the tip up again, without end; and `N` moved the dock for a word one
 * letter shorter. So the sizes are read off a copy of the chip that is never seen, once for each word and once with none, and kept until the letterbox, the key or the type size changes:
 *
 *  - the chip itself is not touched (its class, its content, its position), and the copy is gone before anything else runs, even when the read throws;
 *  - the copy is read **as the chip can be**: the tip's rule that hides the word (`.mad--tip .mad__toggle span`) does not make the whole label the badge;
 *  - the whole label is the longer of the two words the chip says (`hide moves` with the card up, `best move` with it put away), pinned against the real chip;
 *  - the answer is kept (no layout per frame) and asked again when the scale, the key or the type size changes; an answer of nothing is never kept.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: the FFX HUD's solver; FFX-2's HUD never reads it.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { BADGE_CLASS, CHIP_WORDS, NChipMeter } from '../../src/ui/ffx/advisorChipSizes.ts';
import { MoveAdvisor } from '../../src/ui/common/MoveAdvisor.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

interface Rig {
  root: HTMLElement;
  chip: HTMLElement;
  /** What the fake layout was asked, in order (the copy's text at the time). */
  asked: string[];
  box: (el: HTMLElement) => { left: number; top: number; right: number; bottom: number } | null;
}

/** A root with the toggle in it as `MoveAdvisor` builds it, and a layout of our own: 5 grid px a character, 10.4 high, +6 for the padding. */
function rig(opts: { tip?: boolean; key?: string; word?: string } = {}): Rig {
  const root = document.createElement('div');
  root.className = 'mad';
  if (opts.tip) root.classList.add(BADGE_CLASS);
  const chip = document.createElement('button');
  chip.className = 'mad__toggle';
  chip.dataset['role'] = 'move-advisor-toggle';
  chip.style.left = '65px';
  chip.style.bottom = '316px';
  chip.title = 'Hide the move advisor';
  chip.innerHTML = `<b>${opts.key ?? 'N'}</b><span>${opts.word ?? 'hide moves'}</span>`;
  root.appendChild(chip);
  document.body.appendChild(root);
  const asked: string[] = [];
  const box: Rig['box'] = (el) => {
    const span = el.querySelector('span');
    const shown = span && span.style.display !== 'none' ? span.textContent ?? '' : '';
    asked.push(`${el.querySelector('b')?.textContent ?? ''}|${shown}`);
    const w = 6 + 5 * ((el.querySelector('b')?.textContent ?? '').length + shown.length);
    return { left: 20, top: 30, right: 20 + w, bottom: 40.4 };
  };
  return { root, chip, asked, box };
}

describe('the two sizes', () => {
  it('reads the whole label (the longer word) and the badge (the key alone), in whole grid px rounded up', () => {
    const r = rig();
    const sizes = new NChipMeter().measure(r.chip, r.box, 2.5);
    // 'hide moves' is 10 characters, 'best move' 9: the whole label is the longer one; the badge is the key's one character
    expect(sizes.full).toEqual({ width: 6 + 5 * 11, height: 11 });
    expect(sizes.badge).toEqual({ width: 6 + 5 * 1, height: 11 });
    expect(r.asked).toEqual(['N|hide moves', 'N|best move', 'N|']);
  });

  it('takes the longer of the two words whichever it is', () => {
    const r = rig();
    const swapped = (el: HTMLElement) => {
      const span = el.querySelector('span');
      const w = span?.textContent === 'best move' ? 90 : span?.textContent === 'hide moves' ? 70 : 20;
      return { left: 0, top: 0, right: w, bottom: 11 };
    };
    expect(new NChipMeter().measure(r.chip, swapped, 1).full).toEqual({ width: 90, height: 11 });
  });

  it('pins the two words against what the real chip says with the card up and put away', () => {
    const stage = document.createElement('div');
    document.body.appendChild(stage);
    let visible = true;
    const adv = new MoveAdvisor({ game: 'ffx', anchors: { left: 0, right: 640, bottom: 0 }, readVisible: () => visible, writeVisible: (v) => void (visible = v) });
    adv.mount(stage);
    const chip = adv.el.querySelector<HTMLElement>('[data-role="move-advisor-toggle"]')!;
    const words = (): string => chip.querySelector('span')!.textContent ?? '';
    expect(words()).toBe(CHIP_WORDS[0]);
    adv.toggle();
    expect(words()).toBe(CHIP_WORDS[1]);
    adv.unmount();
  });
});

describe('the chip is not touched', () => {
  it('leaves its class, content, position and the root as they were, with the tip up or not', () => {
    for (const tip of [false, true]) {
      const r = rig({ tip });
      const before = r.root.outerHTML;
      new NChipMeter().measure(r.chip, r.box, 2);
      expect(r.root.outerHTML, `tip ${tip}`).toBe(before);
      expect(r.root.classList.contains(BADGE_CLASS)).toBe(tip);
      expect(r.chip.style.left).toBe('65px');
    }
  });

  it('puts the copy in the chip\'s own parent for the read (so every rule that sizes the chip sizes it), hidden, unfindable by role, and removes it', () => {
    const r = rig();
    let seen: HTMLElement | null = null;
    new NChipMeter().measure(
      r.chip,
      (el) => {
        seen = el;
        expect(el.parentElement).toBe(r.root);
        expect(el.style.visibility).toBe('hidden');
        expect(el.style.pointerEvents).toBe('none');
        expect(el.getAttribute('aria-hidden')).toBe('true');
        expect(el.dataset['role'], 'nothing that finds the chip by its role finds the copy').toBeUndefined();
        expect(r.root.querySelectorAll('[data-role="move-advisor-toggle"]').length).toBe(1);
        expect(el.className).toBe('mad__toggle');
        return { left: 0, top: 0, right: 40, bottom: 11 };
      },
      1,
    );
    expect(seen).not.toBeNull();
    expect(r.root.children.length, 'the copy is gone').toBe(1);
  });

  it('removes the copy even when the read throws', () => {
    const r = rig();
    expect(() =>
      new NChipMeter().measure(
        r.chip,
        () => {
          throw new Error('layout failed');
        },
        1,
      ),
    ).toThrow('layout failed');
    expect(r.root.children.length).toBe(1);
  });

  it('reads the whole label as the chip CAN be even while the tip hides the word (the word is shown on the copy)', () => {
    const r = rig({ tip: true });
    let shown = '';
    new NChipMeter().measure(
      r.chip,
      (el) => {
        const span = el.querySelector('span');
        if (span?.textContent === 'hide moves') shown = span.style.display;
        return { left: 0, top: 0, right: 40, bottom: 11 };
      },
      1,
    );
    expect(shown).toBe('inline-block');
  });
});

describe('the answer is kept', () => {
  it('does not read again for the same scale, key and type size, and reads again when any of them changes', () => {
    const r = rig();
    const meter = new NChipMeter();
    const a = meter.measure(r.chip, r.box, 2.5);
    const reads = r.asked.length;
    expect(meter.measure(r.chip, r.box, 2.5)).toBe(a);
    expect(r.asked.length, 'no read for the same answer').toBe(reads);
    meter.measure(r.chip, r.box, 2.25);
    expect(r.asked.length, 'the letterbox changed').toBe(reads + 3);
    r.chip.querySelector('b')!.textContent = 'Y';
    meter.measure(r.chip, r.box, 2.25);
    expect(r.asked.length, 'the key changed (a pad)').toBe(reads + 6);
    r.chip.style.fontSize = '9px';
    meter.measure(r.chip, r.box, 2.25);
    expect(r.asked.length, 'the type size changed').toBe(reads + 9);
  });

  it('is the same answer with the card up or put away (the word the chip says now is not part of the question)', () => {
    const up = rig({ word: 'hide moves' });
    const away = rig({ word: 'best move' });
    expect(new NChipMeter().measure(away.chip, away.box, 2)).toEqual(new NChipMeter().measure(up.chip, up.box, 2));
  });

  it('answers nothing, and keeps nothing, for no chip, no scale, or a chip that is not on the screen', () => {
    const r = rig();
    const meter = new NChipMeter();
    expect(meter.measure(null, r.box, 2)).toEqual({ full: null, badge: null });
    expect(meter.measure(r.chip, r.box, 0)).toEqual({ full: null, badge: null });
    expect(meter.measure(r.chip, () => null, 2)).toEqual({ full: null, badge: null });
    const asked = r.asked.length;
    const real = meter.measure(r.chip, r.box, 2);
    expect(real.full).not.toBeNull();
    expect(r.asked.length, 'asked again after an answer of nothing').toBeGreaterThan(asked);
  });
});
