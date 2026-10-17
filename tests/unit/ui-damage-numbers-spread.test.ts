// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DamageNumbers } from '../../src/ui/common/DamageNumbers.ts';
import { BURST_GAP_MS } from '../../src/ui/common/damageLadder.ts';

/**
 * A long multi-target spread keeps each target's ladder across the rounds of the action (FFX only; release 53, the driver's check on RC10's hit-order lane).
 *
 * Since RC10 an action that hits several targets more than once shows its hits ROUND BY ROUND (the first hit on everyone, then the second: `battle/ffx/hit-order.ts`), so two numerals on one
 * target are as far apart as every other target's numeral in between. At the presenter's cadence (190 ms a hit in a multi-hit action, plus the 85 ms hold of a heavy blow) a target of EIGHT is
 * quiet for 8 x 275 = 2.2 s between its own two numerals: far over `BURST_GAP_MS` (800 ms), where the layer used to start the target's burst afresh. The check below plays that spread
 * (eight targets, three hits each, calculation indexes 3k, 3k+1, 3k+2) and the same twenty-four hits target by target (the order before RC10), and requires every numeral to take the same
 * slot, the same column and the same place in both.
 */
const FRAME = { width: 1600, height: 900 };
const TARGETS = 8;
const HITS = 3;
/** The presenter's beat for one blow of a multi-hit Overdrive: `TIMING.perHit` 190 plus FFX's heavy hold 85. */
const BEAT_MS = 275;

/** Eight foes in a row across the field, as a wide formation stands. */
const POINTS: Record<string, { x: number; y: number }> = Object.fromEntries(Array.from({ length: TARGETS }, (_, k) => [`t${k}`, { x: 220 + k * 150, y: 420 }]));

interface Shown {
  target: string;
  hitIndex: number;
  slot: string;
  x: number;
  y: number;
}

function readTranslate(el: HTMLElement): [number, number] {
  const all = [...el.style.transform.matchAll(/translate\((-?[\d.]+)px,\s*(-?[\d.]+)px\)/g)];
  const last = all[all.length - 1];
  return last ? [Number(last[1]), Number(last[2])] : [NaN, NaN];
}

/** Play the spread: `order` lists [target, hit] pairs in the order they are shown, one blow every `BEAT_MS`; each numeral is read 120 ms after it spawns. */
function play(order: ReadonlyArray<readonly [number, number]>): Shown[] {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const numbers = new DamageNumbers({ root, project: (id) => POINTS[id] ?? null, scale: () => 1, avoid: () => [] });
  numbers.mount();
  numbers.el.getBoundingClientRect = (): DOMRect =>
    ({ x: 0, y: 0, left: 0, top: 0, right: FRAME.width, bottom: FRAME.height, width: FRAME.width, height: FRAME.height, toJSON: () => ({}) }) as DOMRect;
  const run = (ms: number): void => {
    for (let t = 0; t < ms; t += 10) numbers.update(0.01);
  };
  const out: Shown[] = [];
  for (const [k, j] of order) {
    const hitIndex = k * HITS + j;
    const el = numbers.spawnEvent({ type: 'damage', targetId: `t${k}`, amount: 1000 + hitIndex, hitIndex, hitCount: TARGETS * HITS });
    run(120);
    const [x, y] = readTranslate(el!);
    out.push({ target: `t${k}`, hitIndex, slot: el!.dataset['slot'] ?? '', x, y });
    run(BEAT_MS - 120);
  }
  numbers.unmount();
  return out;
}

const roundByRound = (): Array<readonly [number, number]> => Array.from({ length: HITS }, (_, j) => Array.from({ length: TARGETS }, (_, k) => [k, j] as const)).flat();
const targetByTarget = (): Array<readonly [number, number]> => Array.from({ length: TARGETS }, (_, k) => Array.from({ length: HITS }, (_, j) => [k, j] as const)).flat();

beforeEach(() => {
  vi.spyOn(Math, 'random').mockReturnValue(0.5);
  Object.defineProperty(window.HTMLElement.prototype, 'offsetWidth', { configurable: true, get(this: HTMLElement) { return (this.textContent?.length ?? 0) * 9; } });
});

afterEach(() => {
  vi.restoreAllMocks();
  document.body.innerHTML = '';
});

/** Play the spread with target 0's second hit a MISS (a numeral with no hit index), sweeping every 10 ms: the figures of one target must never print through each other. */
function sweepWithAMiss(order: ReadonlyArray<readonly [number, number]>): string[] {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const numbers = new DamageNumbers({ root, project: (id) => POINTS[id] ?? null, scale: () => 1, avoid: () => [] });
  numbers.mount();
  numbers.el.getBoundingClientRect = (): DOMRect =>
    ({ x: 0, y: 0, left: 0, top: 0, right: FRAME.width, bottom: FRAME.height, width: FRAME.width, height: FRAME.height, toJSON: () => ({}) }) as DOMRect;
  const overlaps: string[] = [];
  const check = (at: number): void => {
    const shown = [...root.querySelectorAll<HTMLElement>('.dnum')].filter((el) => Number(el.style.opacity) > 0).map((el) => ({ el, t: el.dataset['target'], pos: readTranslate(el) }));
    for (let i = 0; i < shown.length; i++)
      for (let j = i + 1; j < shown.length; j++) {
        const a = shown[i]!;
        const b = shown[j]!;
        if (a.t !== b.t) continue;
        const clear = Math.abs(a.pos[0] - b.pos[0]) >= 36 || Math.abs(a.pos[1] - b.pos[1]) >= 16;
        if (!clear) overlaps.push(`${a.t}: ${a.el.textContent} and ${b.el.textContent} at ${at}ms (${a.pos.join(',')}) vs (${b.pos.join(',')})`);
      }
  };
  let clock = 0;
  for (const [k, j] of order) {
    const hitIndex = k * HITS + j;
    if (k === 0 && j === 1) numbers.spawnEvent({ type: 'miss', targetId: 't0' });
    else numbers.spawnEvent({ type: 'damage', targetId: `t${k}`, amount: 1000 + hitIndex, hitIndex, hitCount: TARGETS * HITS });
    for (let t = 0; t < BEAT_MS; t += 10) {
      numbers.update(0.01);
      clock += 10;
      check(clock);
    }
  }
  numbers.unmount();
  return overlaps;
}

describe('a spread of eight targets shown round by round', () => {
  it('is quiet on each target for longer than the burst gap between its own numerals (the case the gap was not made for)', () => {
    expect(TARGETS * BEAT_MS).toBeGreaterThan(BURST_GAP_MS);
  });

  it('gives every numeral the slot its calculation index names, as the same hits shown target by target do', () => {
    const rounds = play(roundByRound());
    const direct = play(targetByTarget());
    const slots = (shown: Shown[]): string[] => shown.sort((a, b) => a.hitIndex - b.hitIndex).map((s) => s.slot);
    expect(slots(rounds)).toEqual(Array.from({ length: TARGETS * HITS }, (_, i) => String(i)));
    expect(slots(rounds)).toEqual(slots(direct));
  });

  it('puts every numeral in the same place as the same hit shown target by target (no target\'s fan is re-shaped between rounds)', () => {
    const rounds = play(roundByRound()).sort((a, b) => a.hitIndex - b.hitIndex);
    const direct = play(targetByTarget()).sort((a, b) => a.hitIndex - b.hitIndex);
    for (let i = 0; i < rounds.length; i++) {
      const a = rounds[i]!;
      const b = direct[i]!;
      expect(`${a.target} hit ${a.hitIndex}: x ${a.x.toFixed(1)}`).toBe(`${b.target} hit ${b.hitIndex}: x ${b.x.toFixed(1)}`);
    }
  });

  it("never prints one target's figures through each other, a MISS in the second round included (it takes the chest again, two seconds after the first figure left it)", () => {
    expect(sweepWithAMiss(roundByRound())).toEqual([]);
  });
});
