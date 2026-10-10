// @vitest-environment jsdom
/**
 * **Which fights start with the strategy guide folded, and how that gets to the HUD (FFX only: Chapters I and III; branch r3943-int, Bailey's "A2" of 2026-10-09).**
 *
 * `SceneStaging.guideFolded` is the scene's own word that its fights start with the guide folded to its `G` chip and the full NEXT BEST MOVE card standing in the guide's place
 * (`ui-strategy-guide-start-folded.test.ts` pins the guide's half, `ui-ffx-advisor-folded.test.ts` the card's). This file pins the plumbing in between:
 *
 *  - `stagingOf` copies it when a scene says `true` and only then, like every optional staging field;
 *  - **exactly two scenes say it**: Seymour Flux's (Gagazet) and Braska's Final Aeon's (the Dream's End), the two FFX fights whose giants filled the sky the card stood in. No other scene file names it,
 *    so no other chapter's guide or card moves;
 *  - `createHud` hands it to the FFX HUD and to nothing else: the FFX-2 HUD takes the same argument list and ignores it, and a scene that does not say it leaves the guide to the saved preference;
 *  - the HUD guards the folded card against being cut off at its foot (`FFXBattleHud.guardFoldedCard`): a card still taller than its rail on the last rung of the density ladder for a few frames in a row
 *    is replaced by the tip for the rest of that decision, and the card is tried again at the next.
 *
 * **Game case: FFX only** [AGENTS.md rule 14]: FFX Chapters I and III; FFX-2 never reads it.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { DREAMS_END_STAGING } from '../../src/scenes/dreams-end-giants.ts';
import { GAGAZET_STAGING } from '../../src/scenes/gagazet-giants.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mounted: Array<{ unmount(): void }> = [];

beforeEach(() => {
  Object.defineProperty(navigator, 'getGamepads', { configurable: true, writable: true, value: () => [] });
  delete document.documentElement.dataset['phoneBattle'];
});
afterEach(() => {
  for (const h of mounted.splice(0)) h.unmount();
  document.body.innerHTML = '';
  delete document.documentElement.dataset['phoneBattle'];
});

describe('SceneStaging.guideFolded', () => {
  it('stagingOf copies it when a scene says true, and only then', () => {
    expect(stagingOf({ guideFolded: true }).guideFolded).toBe(true);
    expect('guideFolded' in stagingOf({})).toBe(false);
    expect('guideFolded' in stagingOf({ guideFolded: false })).toBe(false);
  });

  it('is said by Seymour Flux\'s and Braska\'s Final Aeon\'s scenes (Chapters I and III)', () => {
    expect(GAGAZET_STAGING.guideFolded).toBe(true);
    expect(DREAMS_END_STAGING.guideFolded).toBe(true);
    expect(stagingOf(GAGAZET_STAGING).guideFolded).toBe(true);
    expect(stagingOf(DREAMS_END_STAGING).guideFolded).toBe(true);
  });

  it('is named by no other scene file: only the type, its copier and the two giants\' staging files', () => {
    const dir = join(here, '../../src/scenes');
    const users = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /\bguideFolded\b/.test(readFileSync(join(dir, f), 'utf8')))
      .sort();
    expect(users).toEqual(['dreams-end-giants.ts', 'gagazet-giants.ts', 'types.ts']);
  });

  it('reaches the engine\'s scene slots by the one spread every scene goes through (`scenes/index.ts`: `...stagingOf(build)`)', () => {
    const index = readFileSync(join(here, '../../src/scenes/index.ts'), 'utf8');
    expect(index).toMatch(/\.\.\.stagingOf\(build\)/);
  });
});

/** The strategy guide's sheet in a mounted HUD, after the first frame. */
function sheetOf(root: HTMLElement): HTMLElement {
  return root.querySelector<HTMLElement>('.sgd__panel')!;
}

describe('createHud', () => {
  const mountedHud = (game: 'ffx' | 'ffx2', folded: boolean | undefined): HTMLElement => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = createHud(game, undefined, null, undefined, undefined, undefined, folded);
    hud.mount(root);
    mounted.push(hud);
    return root;
  };

  it('starts the FFX HUD\'s guide folded, from the first frame, when the scene says so', () => {
    const root = mountedHud('ffx', true);
    hudUpdate(root);
    expect(sheetOf(root).hidden, 'the sheet is folded to its chip').toBe(true);
    expect(root.querySelector<HTMLElement>('.sgd__toggle')!.hidden, 'and the chip is there to bring it back').toBe(false);
  });

  it('leaves the guide on the saved preference (on) when the scene does not say it', () => {
    for (const folded of [undefined, false]) {
      const root = mountedHud('ffx', folded);
      hudUpdate(root);
      expect(sheetOf(root).hidden, `folded ${String(folded)}`).toBe(false);
      root.remove();
    }
  });

  it('is ignored by the FFX-2 HUD', () => {
    const root = mountedHud('ffx2', true);
    hudUpdate(root);
    expect(sheetOf(root).hidden).toBe(false);
  });

  it('is the FFX HUD\'s own call: `startGuideFolded` on a bare HUD does the same', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.startGuideFolded();
    hud.mount(root);
    mounted.push(hud);
    expect(hud.strategyGuide.isVisible, 'the fold lands with the first frame, not at mount').toBe(true);
    hud.update(1 / 60);
    expect(hud.strategyGuide.isVisible).toBe(false);
  });
});

describe('the folded card guard', () => {
  interface Guarded {
    guardFoldedCard(card: HTMLElement, zone: unknown, cardUp: boolean): void;
    foldedClipped: number;
    foldedStuck: number;
    advisorDecisionSeq: number;
    heldAdvisor: unknown;
  }
  const ZONE = { kind: 'shelf', left: 13, width: 154, bottom: 243, maxHeight: 66, chip: { left: 80, bottom: 312 } };

  function rig(): { hud: Guarded; card: HTMLElement; set: (o: { scrollH?: number; density?: number }) => void; stuckFrames: () => number } {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = new FFXBattleHud();
    hud.startGuideFolded();
    hud.mount(root);
    mounted.push(hud);
    const card = root.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
    const state = { scrollH: 87, density: 7 };
    Object.defineProperty(card, 'scrollHeight', { configurable: true, get: () => state.scrollH });
    Object.defineProperty(hud.moveAdvisor, 'printedDensity', { configurable: true, get: () => state.density });
    const g = hud as unknown as Guarded;
    g.heldAdvisor = { key: 'held', zone: ZONE, chipDock: null };
    g.advisorDecisionSeq = 5;
    return { hud: g, card, set: (o) => void Object.assign(state, o), stuckFrames: () => g.foldedStuck };
  }

  it('asks for the tip, and drops the held placement, after four frames of a card taller than its rail on the last rung', () => {
    const { hud, card } = rig();
    for (let i = 0; i < 3; i++) {
      hud.guardFoldedCard(card, ZONE, true);
      expect(hud.foldedClipped, `frame ${i + 1}: not yet`).toBe(-1);
      expect(hud.heldAdvisor).not.toBeNull();
    }
    hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped, 'the decision whose card does not fit').toBe(5);
    expect(hud.heldAdvisor, 'the next frame solves the tip').toBeNull();
  });

  it("is a decision's, and the card is tried again at the next one", () => {
    const { hud, card } = rig();
    for (let i = 0; i < 4; i++) hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped).toBe(5);
    hud.advisorDecisionSeq = 7; // the next decision opens
    hud.heldAdvisor = { key: 'new', zone: ZONE, chipDock: null };
    hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped, "the old decision's mark does not bind the new one").toBe(5);
    expect(hud.foldedStuck, 'and the count starts again').toBe(1);
    expect(hud.heldAdvisor).not.toBeNull();
  });

  it('leaves a card that fits alone, however many frames: the count only runs while it is cut off', () => {
    const { hud, card, set } = rig();
    set({ scrollH: 66 }); // the ladder's own tolerance is one grid px over the box (66 + 1)
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped).toBe(-1);
    set({ scrollH: 67 });
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped, 'one grid px over the box is the ladder\'s tolerance, and padding').toBe(-1);
    // a frame of fit between two frames of a cut-off card resets the count
    set({ scrollH: 87 });
    for (let i = 0; i < 3; i++) hud.guardFoldedCard(card, ZONE, true);
    set({ scrollH: 60 });
    hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedStuck).toBe(0);
    set({ scrollH: 87 });
    for (let i = 0; i < 3; i++) hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped).toBe(-1);
  });

  it('waits for the ladder to run out of rungs (a card still walking it is not cut off, it is being fitted)', () => {
    const { hud, card, set } = rig();
    set({ density: 4 });
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, ZONE, true);
    expect(hud.foldedClipped).toBe(-1);
  });

  it('only guards the card in the folded guide\'s rail: not the tip, not a card the player put away, not a zone with no chip dock', () => {
    const { hud, card } = rig();
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, { ...ZONE, kind: 'tip' }, true);
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, ZONE, false);
    for (let i = 0; i < 30; i++) hud.guardFoldedCard(card, { ...ZONE, chip: undefined }, true);
    expect(hud.foldedClipped).toBe(-1);
  });
});

/** One frame of the HUD the way the screen ticks it: the `update` of whatever `createHud` returned, found through the mounted root's HUD. */
function hudUpdate(root: HTMLElement): void {
  const last = mounted[mounted.length - 1] as unknown as { update?(dt: number): void };
  last.update?.(1 / 60);
  expect(root.isConnected).toBe(true);
}
