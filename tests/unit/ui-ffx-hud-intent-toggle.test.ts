// @vitest-environment jsdom
/**
 * `E` is a toggle, and a toggle gives back what it took.
 *
 * ## The regression this file exists for
 *
 * The pre-release verifier (2026-09-19, `docs/handoff/fix3-verify2-findings.json`,
 * key `ffx-hud`, failure 1) drove the built app on the real GPU and measured, in
 * all three FFX chapters at 1280x720 and 1600x900:
 *
 * | moment | `advisorPlacement` | `.mad__card` |
 * |---|---|---|
 * | before `E` | `shelf`, 132-141 wide | painted |
 * | after one `E` | `null` | gone |
 * | after a second `E` — the read-out folded again | **still `null`** | **still gone** |
 *
 * One press of the enemy-move key cost the player the NEXT BEST MOVE card for
 * the **rest of the turn** — 53 measured states of one Chapter 1 decision, every
 * menu row, all six submenus, every cancel — and only the next actor's decision
 * brought it back. That is the panel Bailey's onboarding criterion rests on, and
 * `E` is the exact key round-02 #14 asked players to press.
 *
 * The cause was not the solver. It was `FFXBattleHud`'s free-placement latch:
 * once a decision had failed to find a zone it was pinned to the free placement
 * for the whole of that decision, so the *room coming back* was never looked at.
 *
 * ## Why this is a jsdom test and what is stubbed
 *
 * jsdom lays nothing out, so every HUD panel measures zero and the solver sees
 * an empty screen. The one thing standing in for the browser here is the
 * **painted box of `.eint__panel`** — the read-out slab the player opens, 150 x
 * 168 grid px at its largest (`EnemyIntent.MAX_HEIGHT_FRACTION`). Everything
 * else is real: a real `FFXBattleHud`, real `KeyboardEvent`s dispatched at
 * `window` exactly as a player's `E` arrives, the real `EnemyIntentPanel`
 * listening for them, and the real `advisorZone` solver deciding what fits.
 *
 * GAME CASE: **FFX only.** `src/ui/ffx` is the FFX HUD; FFX-2 has its own
 * (`src/ui/ffx2`) with its own intent panel and its own advisor placement, and
 * nothing here is imported by it. Bailey's rule of 2026-09-19.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';

afterEach(() => {
  document.body.innerHTML = '';
});

function mountHud(): FFXBattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return hud;
}

/**
 * The letterbox jsdom's 1024x768 window gives `FFXBattleHud.hudScale()`.
 *
 * `this.el` measures 0x0 in jsdom, so `hudScale` falls back to the window:
 * `min(1024/640, 768/360)` = 1.6, and the stage origin the HUD divides through
 * is `(0 - 640*1.6)/2, (0 - 360*1.6)/2` = (-512, -288).
 */
const SCALE = 1.6;
const ORIGIN = { x: -512, y: -288 };

/** A viewport-pixel rect for a box given on the 640x360 authoring grid. */
function viewportRectForGrid(left: number, top: number, right: number, bottom: number): DOMRect {
  const l = left * SCALE + ORIGIN.x;
  const t = top * SCALE + ORIGIN.y;
  const r = right * SCALE + ORIGIN.x;
  const b = bottom * SCALE + ORIGIN.y;
  return {
    left: l,
    top: t,
    right: r,
    bottom: b,
    width: r - l,
    height: b - t,
    x: l,
    y: t,
    toJSON: () => ({}),
  } as DOMRect;
}

const NO_BOX = viewportRectForGrid(0, 0, 0, 0);

/**
 * Paint the enemy-move read-out over the band the browser measured it in.
 *
 * Grid y 60..300 across the frame: too tall for the card to fit above or below
 * it (`MIN_ADVISOR_HEIGHT + ADVISOR_CHIP_RESERVE` is 83 and the clear bands are
 * 48 and 28), and deliberately *not* the whole stage, so the `N BEST MOVE`
 * chip still has ground to dock on — which is the shape of the real frame the
 * verifier measured.
 */
function paintIntentReadOut(hud: FFXBattleHud): void {
  const panel = hud.el.querySelector<HTMLElement>('.eint__panel')!;
  const painted = viewportRectForGrid(6, 60, 634, 300);
  // `[hidden]` is `display: none` in `tokens.css`, which is a zero box in a
  // browser. `EnemyIntentPanel.applyVisible` is the only writer of this flag.
  panel.getBoundingClientRect = (): DOMRect => (panel.hidden ? NO_BOX : painted);
}

function pressE(): void {
  window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE' }));
}

function advisorCard(hud: FFXBattleHud): HTMLElement {
  return hud.el.querySelector<HTMLElement>('[data-role="move-advisor-card"]')!;
}

function cardGeometry(card: HTMLElement): string {
  return [card.style.left, card.style.width, card.style.bottom, card.style.maxHeight].join('|');
}

describe('the enemy-move read-out and the advice card share one band', () => {
  it('gives the card back, in the same box, when a second E folds the read-out', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    paintIntentReadOut(hud);
    hud.update(16);

    const card = advisorCard(hud);
    const before = hud.advisorPlacement;
    expect(before).not.toBeNull();
    expect(card.hidden).toBe(false);
    const geometryBefore = cardGeometry(card);

    // One `E`: the read-out takes the band, and the card yields to it. That
    // much is the design — two opaque slabs, one band, and the player just
    // asked for the other one.
    pressE();
    hud.update(16);
    expect(hud.enemyIntent.isVisible).toBe(true);
    expect(hud.advisorPlacement).toBeNull();
    expect(card.hidden).toBe(true);

    // A second `E` folds the read-out again. The screen is the screen that
    // solved a 132-wide card one frame ago, so the card comes back — in the
    // same box, without waiting for the next actor's decision.
    pressE();
    hud.update(16);
    expect(hud.enemyIntent.isVisible).toBe(false);
    expect(hud.advisorPlacement).not.toBeNull();
    expect(card.hidden).toBe(false);
    expect(hud.advisorPlacement).toEqual(before);
    expect(cardGeometry(card)).toBe(geometryBefore);
  });

  it('survives E pressed four times inside one decision', () => {
    // The verifier pressed it twice; a toggle that only survives one round trip
    // is not a toggle. The decision never changes here — no `chooseCommand`,
    // no `turn-start` — so every restoration is the latch releasing, not a new
    // decision papering over it.
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    paintIntentReadOut(hud);
    hud.update(16);
    const card = advisorCard(hud);
    const before = hud.advisorPlacement;
    expect(before).not.toBeNull();

    for (let i = 0; i < 4; i++) {
      pressE();
      hud.update(16);
      expect(hud.advisorPlacement).toBeNull();
      expect(card.hidden).toBe(true);

      pressE();
      hud.update(16);
      expect(hud.advisorPlacement).toEqual(before);
      expect(card.hidden).toBe(false);
    }
  });

  it('does not flap while the read-out stays open, however many frames pass', () => {
    // The latch this replaces existed for a real reason: the card must not
    // cross between a measured zone and its own placement while the player is
    // reading it. Panels opening and closing is a genuine layout change; a
    // frame going by is not.
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    paintIntentReadOut(hud);
    hud.update(16);
    pressE();
    hud.update(16);
    expect(hud.advisorPlacement).toBeNull();
    const card = advisorCard(hud);
    for (let i = 0; i < 60; i++) {
      hud.update(16);
      expect(hud.advisorPlacement).toBeNull();
      expect(card.hidden).toBe(true);
    }
  });

  it('still hands the next decision a fresh solve', () => {
    // The decision-scoped half of the old latch is kept: a new decision starts
    // with no memory of the last one's declined solve.
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    paintIntentReadOut(hud);
    hud.update(16);
    pressE();
    hud.update(16);
    expect(hud.advisorPlacement).toBeNull();

    void hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    hud.update(16);
    // The read-out is still open, so the answer is still `null` — but it was
    // *asked* again rather than remembered, which is what the next assertion
    // proves: folding it now restores the card inside this new decision too.
    expect(hud.advisorPlacement).toBeNull();
    pressE();
    hud.update(16);
    expect(hud.advisorPlacement).not.toBeNull();
    expect(advisorCard(hud).hidden).toBe(false);
  });
});
