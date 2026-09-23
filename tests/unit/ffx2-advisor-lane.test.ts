// @vitest-environment jsdom
/**
 * PR-0091 (critic round 09, FFX-2 only): after a chain seam the move-advisor
 * card sat on the party HP rows.
 *
 * Reproduced through the real presenter (own vite server, chapter 5, seed 1,
 * 1600x900, `autoBattle('intended')` paused at each seam): at link 2 the
 * `party-right` fence stood at 425.74 and the `party-column` fence at 451.67,
 * so the band between them was 13 grid px. `MoveAdvisor.layout` then held the
 * card at its 132 px minimum *from the left fence*, painting it at
 * [1059,616,1436,835] across rows [1173,650,1582,720] and [1163,728,1572,798]
 * (46,010 px2 of overlap; link 3: 44,820). The figures below are the three
 * girls at that seam, read off the same frame (scale 2.5, stage px).
 */
import { afterEach, describe, expect, it } from 'vitest';
import { MoveAdvisor } from '../../src/ui/common/MoveAdvisor.ts';
import {
  MIN_UNDER_ROOM,
  solveAdvisorLane,
  type LaneFigure,
  type LaneInput,
} from '../../src/ui/ffx2/advisorLane.ts';
import { makeFakeBattleState, makeFakeCommands } from '../../src/ui/ffx/testFixtures.ts';

const SCALE = 2.5; // 1600x900
const WALL = 451.67; // party-column fence at link 2
const BASE = 360 - 26;
const CHIP = 10;
/** The party rows at link 2, viewport px -> stage px. */
const ROWS = [
  [1173, 650, 1582, 720],
  [1163, 728, 1572, 798],
  [1153, 805, 1562, 875],
].map(([l, t, r, b]) => ({ left: l! / SCALE, top: t! / SCALE, right: r! / SCALE, bottom: b! / SCALE }));

/** Yuna, Rikku, Paine after the ch5 link-2 seam (lean for a 59-grid card added). */
const SEAM_FIGURES: LaneFigure[] = [
  { left: 93.9, right: 178.1, foot: 310 },
  { left: 289.5, right: 362.5, foot: 278 },
  { left: 363.7, right: 425.74, foot: 256 },
];

const live: MoveAdvisor[] = [];
afterEach(() => {
  while (live.length) live.pop()!.unmount();
  document.body.innerHTML = '';
});

/** jsdom has no layout engine, so a fence has to be told what box it occupies. */
function fence(left: number): HTMLElement {
  const el = document.createElement('i');
  Object.defineProperty(el, 'offsetLeft', { value: left, configurable: true });
  Object.defineProperty(el, 'offsetWidth', { value: 1, configurable: true });
  return el;
}

/** Mount the card the way `FFX2BattleHud` does and lay it out once between two fences. */
function placeCard(after: number, wall: number): { left: number; right: number } {
  const stage = document.createElement('div');
  document.body.appendChild(stage);
  const a = fence(after);
  const b = fence(wall);
  const advisor = new MoveAdvisor({
    game: 'ffx2',
    anchors: { after: () => a, before: () => b, left: 160, right: 458, bottom: 26, wall: 'before' },
    readVisible: () => true,
    writeVisible: () => {},
  });
  advisor.mount(stage);
  live.push(advisor);
  advisor.showDecision('tidus', makeFakeCommands(), makeFakeBattleState());
  advisor.update(16);
  const card = stage.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
  const left = parseFloat(card.style.left);
  return { left, right: left + parseFloat(card.style.width) };
}

function input(over: Partial<LaneInput> = {}): LaneInput {
  return { figures: SEAM_FIGURES, floor: 160, wall: WALL, base: BASE, chip: CHIP, cardHeight: 59.2, cap: null, ...over };
}

describe('PR-0091: the card never crosses the party rows', () => {
  it('holds its right edge before the rows when the band is narrower than the card (the seam state)', () => {
    // The fences exactly as the seam left them.
    const card = placeCard(425.74, WALL);
    expect(card.right).toBeLessThanOrEqual(WALL - 6 + 1e-6);
    for (const row of ROWS) expect(card.right).toBeLessThan(row.left);
  });

  it('passes under the girls’ feet at the seam, as live did, instead of squeezing against the rows', () => {
    const lane = solveAdvisorLane(input());
    expect(lane.mode).toBe('under');
    expect(lane.after).toBeCloseTo(178.1, 5); // past Yuna, who stands lowest
    // Short enough to clear Rikku's feet (278) with the chip above it.
    expect(lane.maxHeight).not.toBeNull();
    expect(BASE - lane.maxHeight! - CHIP).toBeGreaterThanOrEqual(278);
    expect(lane.maxHeight!).toBeGreaterThanOrEqual(MIN_UNDER_ROOM);
    const card = placeCard(lane.after, WALL);
    expect(card.right).toBeLessThanOrEqual(WALL - 6 + 1e-6);
    expect(card.right - card.left).toBeGreaterThanOrEqual(132);
  });

  it('keeps the old lane wherever the old lane still fits (link 1)', () => {
    // Link 1's own fences: party-right 230.64, the whole band past the girls free.
    const figures: LaneFigure[] = [{ left: 120, right: 230.64, foot: 300 }];
    const lane = solveAdvisorLane(input({ figures }));
    expect(lane).toEqual({ after: 230.64, maxHeight: null, mode: 'clear' });
  });

  it('slides over the girls, never the rows, when no lane leaves a readable card', () => {
    const figures: LaneFigure[] = [
      { left: 100, right: 250, foot: 320 },
      { left: 240, right: 440, foot: 318 },
    ];
    const lane = solveAdvisorLane(input({ figures, cardHeight: 88 }));
    expect(lane.mode).toBe('squeezed');
    const card = placeCard(lane.after, WALL);
    expect(card.right).toBeLessThanOrEqual(WALL - 6 + 1e-6);
  });

  it('only tightens a cap within one decision', () => {
    expect(solveAdvisorLane(input({ cap: 30 })).maxHeight).toBe(30);
    expect(solveAdvisorLane(input({ cap: 80 })).maxHeight).toBeLessThan(80);
  });

  it('ignores a girl standing under the rows themselves', () => {
    const figures: LaneFigure[] = [{ left: 470, right: 540, foot: 330 }];
    expect(solveAdvisorLane(input({ figures })).mode).toBe('clear');
  });

  it('never lets the card cross the rows for any formation (sweep)', () => {
    for (let x = 160; x <= 440; x += 20) {
      for (let foot = 230; foot <= 330; foot += 25) {
        for (const h of [40, 59, 88, 104]) {
          const figures: LaneFigure[] = [
            { left: 90, right: 175, foot: 310 },
            { left: x - 35, right: x + 35, foot },
            { left: x + 20, right: x + 75, foot: foot - 20 },
          ];
          const lane = solveAdvisorLane(input({ figures, cardHeight: h }));
          const card = placeCard(lane.after, WALL);
          expect(card.right).toBeLessThanOrEqual(WALL - 6 + 1e-6);
          if (lane.mode !== 'squeezed') expect(card.right - card.left).toBeGreaterThanOrEqual(132);
        }
      }
    }
  });
});
