// @vitest-environment jsdom
/**
 * The Save Sphere card between Chapter XI's links (O-4 = C, D-120).
 * **FFX-2 only**: only the Sisters and Anima links ever call it.
 *
 * Pins the order c-2 depends on: the wash is up before the link is swapped, the
 * card reads exactly as drawn, the swap happens once, and the overlay leaves no
 * trace, including when the swap throws.
 */

import { beforeEach, describe, expect, it } from 'vitest';

import {
  buildSaveSphereCard,
  playSaveSphereCard,
  SAVE_SPHERE_LABEL,
  SAVE_SPHERE_LINE,
  SAVE_SPHERE_TIMING,
} from '../../src/app/screens/SaveSphereCard.ts';

let root: HTMLElement;

beforeEach(() => {
  document.body.innerHTML = '';
  root = document.createElement('div');
  document.body.appendChild(root);
});

function card(): HTMLElement | null {
  return root.querySelector('[data-testid="save-sphere"]');
}

describe('the card reads as c-2 draws it', () => {
  it('SAVE SPHERE over "HP and MP restored", an orb, and a live region', () => {
    const el = buildSaveSphereCard();
    expect(el.querySelector('.ssphere__label')?.textContent).toBe('SAVE SPHERE');
    expect(el.querySelector('.ssphere__line')?.textContent).toBe('HP and MP restored');
    expect(SAVE_SPHERE_LABEL).toBe('SAVE SPHERE');
    expect(SAVE_SPHERE_LINE).toBe('HP and MP restored');
    expect(el.querySelector('.ssphere__orb')).not.toBeNull();
    expect(el.querySelector('.ssphere__wash')).not.toBeNull();
    expect(el.getAttribute('role')).toBe('status');
    // No status is promised: whether a Save Sphere clears them is unsourced.
    expect(el.textContent).not.toMatch(/status/i);
  });
});

describe('the beat', () => {
  it('washes in, swaps under the cover, shows the card, washes out, and leaves nothing', async () => {
    const trace: string[] = [];
    let swaps = 0;
    await playSaveSphereCard({
      root,
      swap: async () => {
        swaps++;
        const el = card();
        trace.push(`swap:${el ? [...el.classList].join(' ') : 'none'}`);
      },
      sleep: async (ms) => {
        const el = card();
        trace.push(`sleep ${ms}:${el ? [...el.classList].join(' ') : 'none'}`);
      },
    });
    expect(swaps).toBe(1);
    expect(trace).toEqual([
      `sleep ${SAVE_SPHERE_TIMING.washIn}:ssphere ssphere--in`,
      'swap:ssphere ssphere--in',
      `sleep ${SAVE_SPHERE_TIMING.hold}:ssphere ssphere--in ssphere--card`,
      `sleep ${SAVE_SPHERE_TIMING.washOut}:ssphere ssphere--card ssphere--out`,
    ]);
    expect(card()).toBeNull();
  });

  it('instant (speed skip) swaps and draws nothing', async () => {
    let swaps = 0;
    let sawCard = false;
    await playSaveSphereCard({
      root,
      instant: true,
      swap: async () => {
        swaps++;
        sawCard = card() !== null;
      },
      sleep: () => {
        throw new Error('an instant card must not wait');
      },
    });
    expect(swaps).toBe(1);
    expect(sawCard).toBe(false);
    expect(root.children.length).toBe(0);
  });

  it('a swap that throws still takes the overlay down', async () => {
    await expect(
      playSaveSphereCard({
        root,
        swap: async () => {
          throw new Error('stage failed');
        },
        sleep: async () => {},
      }),
    ).rejects.toThrow('stage failed');
    expect(card()).toBeNull();
  });
});

describe('leaving the screen during the card (fa-flow repair)', () => {
  it('cancelled during the wash-in: never swaps, and the overlay is gone at once', async () => {
    let cancelled = false;
    let swaps = 0;
    const slept: number[] = [];
    await playSaveSphereCard({
      root,
      swap: async () => {
        swaps++;
      },
      sleep: async (ms) => {
        slept.push(ms);
        cancelled = true; // the pause's CHAPTER SELECT, during the wash-in
      },
      cancelled: () => cancelled,
    });
    expect(swaps).toBe(0);
    expect(slept).toEqual([SAVE_SPHERE_TIMING.washIn]);
    expect(card()).toBeNull();
  });

  it('cancelled under the card: swapped once, no wash-out wait, overlay gone', async () => {
    let cancelled = false;
    let swaps = 0;
    const slept: number[] = [];
    await playSaveSphereCard({
      root,
      swap: async () => {
        swaps++;
      },
      sleep: async (ms) => {
        slept.push(ms);
        if (ms === SAVE_SPHERE_TIMING.hold) cancelled = true;
      },
      cancelled: () => cancelled,
    });
    expect(swaps).toBe(1);
    expect(slept).toEqual([SAVE_SPHERE_TIMING.washIn, SAVE_SPHERE_TIMING.hold]);
    expect(card()).toBeNull();
  });

  it('already cancelled: draws nothing and swaps nothing, even at skip speed', async () => {
    let swaps = 0;
    await playSaveSphereCard({ root, instant: true, swap: async () => void swaps++, cancelled: () => true });
    await playSaveSphereCard({ root, swap: async () => void swaps++, cancelled: () => true });
    expect(swaps).toBe(0);
    expect(root.children.length).toBe(0);
  });
});
