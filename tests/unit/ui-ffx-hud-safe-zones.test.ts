// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { menuOwnsCancel } from '../../src/ui/common/menuCancel.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import {
  ADVISOR_CHIP_RESERVE,
  advisorZone,
  GAP,
  MAX_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
  SPRITE_FOOT_MARGIN_RATIO,
  SPRITE_HALF_WIDTH_RATIO,
  SPRITE_TOP_MARGIN_RATIO,
  type Rect,
} from '../../src/ui/ffx/hudSafeZones.ts';
import { makeFakeBattleState, makeFakeCommands, makeFakeTurnPreview } from '../../src/ui/ffx/testFixtures.ts';
import { openKimahriRage } from '../../src/ui/ffx/minigames/index.ts';

/**
 * The fix-3 round's two HUD guarantees, both from Bailey's Chapter 1 capture:
 *
 * 1. **No title slab outlives its decision.** An Overdrive picker's ivory head
 *    stayed on the field through the next character's turn, printed over the
 *    `G GUIDE` chip and the Sensor card.
 * 2. **No optional panel lands on a fighter.** The advisor card sat across
 *    Tidus and Kimahri because it was measured against the HUD's panels and
 *    knows nothing about the party standing between them.
 *
 * The zone arithmetic is pinned against the rects measured live at 1600x900 on
 * the 640x360 grid (`docs/handoff/fix3-ffx-hud.md` has the run and the raw
 * numbers), so a later change to a party slot or a HUD rail that breaks the
 * guarantee fails here rather than in a screenshot.
 */

// ---------------------------------------------------------------- measured

/** The always-on chrome, identical in all three FFX chapters. */
const CHROME = {
  cmdArea: { left: 30.2, top: 204.5, right: 210.7, bottom: 334.2 },
  partyStatus: { left: 402.7, top: 258.3, right: 616.9, bottom: 348 },
  guide: { left: 21.3, top: 44, right: 153.3, bottom: 200 },
  sensor: { left: 191.7, top: 24, right: 308.3, bottom: 102 },
} as const;

/**
 * The party, measured live through the debug API at 1600x900, on the grid.
 *
 * Each sprite is recorded twice, because the HUD and the player see different
 * things and the gap between them is where the last round's bug lived:
 *
 * - `head` / `feet` are the only two things the HUD is given. `HudPort`'s
 *   projector answers with **points**, so `FFXBattleHud.partySpriteRects`
 *   reconstructs a rectangle from them;
 * - `quad` is the actor's painted plane — what the player actually sees, and
 *   what a panel may not be drawn over.
 *
 * A reconstruction that does not contain the quad is a fighter the "no panel on
 * a fighter" rule cannot see, which is why `covers` is asserted first.
 */
interface SpriteSample {
  name: string;
  head: { x: number; y: number };
  feet: { x: number; y: number };
  quad: Rect;
}

const PARTY: Record<string, SpriteSample[]> = {
  'seymour-flux': [
    { name: 'tidus', head: { x: 192, y: 188.8 }, feet: { x: 196.1, y: 313.8 },
      quad: { left: 144.7, top: 175.6, right: 241.2, bottom: 314.1 } },
    { name: 'yuna', head: { x: 113, y: 174.2 }, feet: { x: 118.7, y: 283.1 },
      quad: { left: 65.3, top: 162.6, right: 164.3, bottom: 283.4 } },
    { name: 'kimahri', head: { x: 249.8, y: 162.5 }, feet: { x: 251.5, y: 258.5 },
      quad: { left: 214.4, top: 152.4, right: 285.7, bottom: 258.7 } },
  ],
  yunalesca: [
    { name: 'tidus', head: { x: 323.6, y: 212.2 }, feet: { x: 323.5, y: 340.4 },
      quad: { left: 277.1, top: 198.8, right: 369.8, bottom: 340.9 } },
    { name: 'yuna', head: { x: 254.9, y: 204.3 }, feet: { x: 255.6, y: 318.4 },
      quad: { left: 206.7, top: 192.3, right: 302.8, bottom: 318.9 } },
    { name: 'auron', head: { x: 338, y: 195.2 }, feet: { x: 337.9, y: 293 },
      quad: { left: 301.8, top: 185.2, right: 374.1, bottom: 293.3 } },
  ],
  'braskas-final-aeon': [
    { name: 'tidus', head: { x: 191.6, y: 213.9 }, feet: { x: 193.5, y: 338.9 },
      quad: { left: 145.7, top: 200.8, right: 238.3, bottom: 339.2 } },
    { name: 'yuna', head: { x: 114.7, y: 203.1 }, feet: { x: 117.3, y: 311.8 },
      quad: { left: 68.4, top: 191.8, right: 162.5, bottom: 312 } },
    { name: 'auron', head: { x: 248.7, y: 194.6 }, feet: { x: 249.5, y: 290.1 },
      quad: { left: 213, top: 184.8, right: 284.6, bottom: 290.3 } },
  ],
};

/**
 * Exactly what `FFXBattleHud.partySpriteRects` builds from the two anchors.
 *
 * Kept in step with that method by hand — it is four lines, and duplicating
 * them here is what lets the whole zone question be answered in Node.
 */
function reconstruct(s: SpriteSample): Rect {
  const span = Math.abs(s.feet.y - s.head.y);
  const half = span * SPRITE_HALF_WIDTH_RATIO;
  return {
    left: s.head.x - half,
    right: s.head.x + half,
    top: Math.min(s.head.y, s.feet.y) - span * SPRITE_TOP_MARGIN_RATIO,
    bottom: Math.max(s.head.y, s.feet.y) + span * SPRITE_FOOT_MARGIN_RATIO,
  };
}

const rectsFor = (chapter: string): Rect[] => PARTY[chapter]!.map(reconstruct);

/** The card's box on the grid, from a zone plus the height it renders at. */
function cardRect(zone: { left: number; width: number; bottom: number }, height: number): Rect {
  return {
    left: zone.left,
    right: zone.left + zone.width,
    top: 360 - zone.bottom - height,
    bottom: 360 - zone.bottom,
  };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

// ------------------------------------------------------------- advisorZone

describe('the sprite rect the HUD reconstructs', () => {
  for (const [chapter, sprites] of Object.entries(PARTY)) {
    for (const s of sprites) {
      it(`covers all of ${s.name}'s painted quad in ${chapter}`, () => {
        const r = reconstruct(s);
        expect({
          left: r.left <= s.quad.left,
          top: r.top <= s.quad.top,
          right: r.right >= s.quad.right,
          bottom: r.bottom >= s.quad.bottom,
        }).toEqual({ left: true, top: true, right: true, bottom: true });
      });
    }
  }
});

describe('advisorZone', () => {
  for (const chapter of Object.keys(PARTY)) {
    describe(chapter, () => {
      const sprites = rectsFor(chapter);

      it('never puts the card on a party sprite, at any height the card can reach', () => {
        const zone = advisorZone({ ...CHROME, sprites });
        expect(zone).not.toBeNull();
        const box = cardRect(zone!, zone!.maxHeight);
        // Against the **painted** quad, not against the reconstruction the
        // zone was solved from: covering the estimate is not the promise.
        for (const s of PARTY[chapter]!) {
          expect({ chapter, sprite: s.name, box, overlaps: overlaps(box, s.quad) }).toMatchObject({ overlaps: false });
        }
      });

      it('never puts the card on the command stack or the party-status column', () => {
        const zone = advisorZone({ ...CHROME, sprites });
        const box = cardRect(zone!, zone!.maxHeight);
        expect(overlaps(box, CHROME.cmdArea)).toBe(false);
        expect(overlaps(box, CHROME.partyStatus)).toBe(false);
      });

      it('gives the card at least the width its chips need', () => {
        expect(advisorZone({ ...CHROME, sprites })!.width).toBeGreaterThanOrEqual(MIN_ADVISOR_WIDTH);
      });
    });
  }

  it('takes the shelf in all three chapters — no party leaves a usable pocket', () => {
    // Against the party's real width the gap between the rightmost fighter and
    // the party-status rail measures 93.5 (Chapter 1), none at all (Chapter 2)
    // and 94.2 (Chapter 3) — all under the card's 132. The 96 floor the last
    // round used to keep the card in the pocket was reading a sprite rect two
    // measurement errors too narrow; see `SPRITE_HALF_WIDTH_RATIO`.
    for (const chapter of Object.keys(PARTY)) {
      expect({ chapter, kind: advisorZone({ ...CHROME, sprites: rectsFor(chapter) })!.kind })
        .toMatchObject({ kind: 'shelf' });
    }
  });

  it('still takes the pocket when an encounter does leave one', () => {
    // The pocket is not dead code: a party standing left of x 250 leaves 146
    // grid px of it, and that is the placement nearest where the card shipped.
    const tucked: Rect[] = [
      { left: 60, top: 180, right: 150, bottom: 320 },
      { left: 140, top: 170, right: 250, bottom: 330 },
    ];
    const zone = advisorZone({ ...CHROME, sprites: tucked })!;
    expect(zone.kind).toBe('pocket');
    expect(zone.left).toBeGreaterThanOrEqual(250 + GAP);
  });

  it('keeps room above the card for its own chip', () => {
    // The chip rides above the card, so it is the chip that has to clear
    // whatever bounds the zone from above. The live matrix caught it poking
    // into the Sensor card in every state the Sensor was up.
    const sprites = rectsFor('braskas-final-aeon');
    const zone = advisorZone({ ...CHROME, sprites })!;
    const chipTop = 360 - zone.bottom - zone.maxHeight - ADVISOR_CHIP_RESERVE;
    expect(chipTop).toBeGreaterThanOrEqual(CHROME.sensor.bottom);
  });

  it('drops the shelf below the Sensor card rather than under it', () => {
    const sprites = rectsFor('yunalesca');
    const withSensor = advisorZone({ ...CHROME, sprites })!;
    const noSensor = advisorZone({ ...CHROME, sensor: null, sprites })!;
    expect(withSensor.maxHeight).toBeLessThanOrEqual(noSensor.maxHeight);
    expect(cardRect(withSensor, withSensor.maxHeight).top).toBeGreaterThanOrEqual(CHROME.sensor.bottom);
  });

  it('clears the command stack when a submenu grows it up into the shelf', () => {
    // Opening a Skill list raises the stack's top edge from 204.5 to 177.8,
    // which is inside Chapter 2's shelf. The card has to come up with it.
    const sprites = rectsFor('yunalesca');
    const open = { ...CHROME.cmdArea, top: 177.8 };
    const zone = advisorZone({ ...CHROME, cmdArea: open, sprites })!;
    const box = cardRect(zone, zone.maxHeight);
    expect(overlaps(box, open)).toBe(false);
    expect(box.bottom).toBeLessThanOrEqual(open.top - GAP + 0.001);
  });

  it('uses the whole band when the guide is off, since its rail is gone', () => {
    const sprites = rectsFor('yunalesca');
    const on = advisorZone({ ...CHROME, sprites })!;
    const off = advisorZone({ ...CHROME, guide: null, sprites })!;
    expect(off.left).toBeLessThan(on.left);
    expect(off.width).toBeGreaterThan(on.width);
  });

  it('hands back null rather than a nonsense box when the party fills the frame', () => {
    const wall: Rect[] = [{ left: 0, top: 0, right: 640, bottom: 360 }];
    expect(advisorZone({ ...CHROME, sprites: wall })).toBeNull();
  });

  it('keeps the measured gap between the card and whatever bounds it', () => {
    const sprites = rectsFor('seymour-flux');
    const zone = advisorZone({ ...CHROME, sprites })!;
    const headsTop = Math.min(...sprites.map((r) => r.top));
    expect(zone.left).toBeGreaterThanOrEqual(CHROME.guide.right + GAP - 0.001);
    expect(zone.left + zone.width).toBeLessThanOrEqual(CHROME.partyStatus.left - GAP + 0.001);
    expect(360 - zone.bottom).toBeLessThanOrEqual(headsTop - GAP + 0.001);
  });

  it('never offers more height than the card was designed at', () => {
    // The pocket's ceiling in chapters 1 and 3 is the stage's own top, so the
    // raw room is ~220px — three times the card. Without the clamp the card
    // grows to fill it and the NEXT BEST MOVE slab becomes a column.
    for (const chapter of Object.keys(PARTY)) {
      expect(advisorZone({ ...CHROME, sprites: rectsFor(chapter) })!.maxHeight).toBeLessThanOrEqual(MAX_ADVISOR_HEIGHT);
    }
  });

  it('still hands back the smaller room when the zone is the tighter of the two', () => {
    // Chapter 2's shelf is bounded above by the Sensor card and below by the
    // party's heads; that is less than MAX_ADVISOR_HEIGHT and must survive.
    const zone = advisorZone({ ...CHROME, sprites: rectsFor('yunalesca') })!;
    const headsTop = Math.min(...rectsFor('yunalesca').map((r) => r.top));
    expect(zone.maxHeight).toBe(headsTop - GAP - (CHROME.sensor.bottom + GAP) - ADVISOR_CHIP_RESERVE);
    expect(zone.maxHeight).toBeLessThan(MAX_ADVISOR_HEIGHT);
  });

  it('refuses a pocket too short to hold the card rather than squeezing one in', () => {
    // A party that stands clear of the pocket's x span but whose sprites hang
    // down to the stage floor leaves a wide pocket with no vertical room.
    const floorHugger: Rect[] = [{ left: 100, top: 20, right: 250, bottom: 356 }];
    const zone = advisorZone({
      ...CHROME,
      sensor: { left: 250, top: 24, right: 396, bottom: 330 },
      sprites: floorHugger,
    });
    expect(zone?.kind).not.toBe('pocket');
  });

  it('lifts the pocket clear of the Sensor card when the two share a column', () => {
    const tucked: Rect[] = [{ left: 60, top: 180, right: 250, bottom: 330 }];
    const low: Rect = { left: 256, top: 24, right: 396, bottom: 180 };
    const withSensor = advisorZone({ ...CHROME, sensor: low, sprites: tucked })!;
    expect(withSensor.kind).toBe('pocket');
    expect(cardRect(withSensor, withSensor.maxHeight).top).toBeGreaterThanOrEqual(low.bottom);
  });
});

// ------------------------------------------------ no title outlives its turn

function mountHud(): FFXBattleHud {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFXBattleHud();
  hud.mount(root);
  return hud;
}

/** The `.ig-minigame` slabs still on the HUD's stage. */
function slabs(hud: FFXBattleHud): number {
  return hud.el.querySelectorAll('.ig-minigame').length;
}

/** An Overdrive picker left on the stage by hand, as a leak would leave it. */
function leakSlab(hud: FFXBattleHud): void {
  const stage = hud.el.querySelector<HTMLElement>('.ffxhud__stage')!;
  const slab = document.createElement('div');
  slab.className = 'ig-minigame ffx-mg';
  slab.innerHTML = '<div class="ig-minigame__title">Ronso Rage</div>';
  stage.appendChild(slab);
}

afterEach(() => {
  document.body.innerHTML = '';
});

describe('a title slab never outlives its decision', () => {
  it('is gone by the time the next character is asked for a command', async () => {
    const hud = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    leakSlab(hud);
    expect(slabs(hud)).toBe(1);

    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(slabs(hud)).toBe(0);
    void pending;
  });

  it('is gone when the turn passes to another actor', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    leakSlab(hud);
    hud.onEvent({ type: 'turn-start', actorId: 'tidus', seq: 1 } as never);
    expect(slabs(hud)).toBe(0);
  });

  it('stays put while the same actor is still taking their turn', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    leakSlab(hud);
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 1 } as never);
    expect(slabs(hud)).toBe(1);
  });

  it('is gone once the battle has a result', () => {
    const hud = mountHud();
    const state = makeFakeBattleState();
    hud.sync(state, makeFakeTurnPreview());
    leakSlab(hud);
    const decided: BattleState = { ...state, result: { outcome: 'victory' } as unknown as BattleState['result'] };
    hud.sync(decided, makeFakeTurnPreview());
    expect(slabs(hud)).toBe(0);
  });

  it('takes the message banner down with it, so one turn cannot label the next', () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    hud.onEvent({ type: 'turn-start', actorId: 'kimahri', seq: 0 } as never);
    hud.onEvent({ type: 'message', text: 'Kimahri uses Ronso Rage', kind: 'action', seq: 1 } as never);
    const banner = hud.el.querySelector<HTMLElement>('.ig-banner')!;
    expect(banner.hidden).toBe(false);
    hud.onEvent({ type: 'turn-start', actorId: 'tidus', seq: 2 } as never);
    expect(banner.hidden).toBe(true);
  });
});

describe('an Overdrive picker with nothing to pick', () => {
  it('backs out on cancel and takes its overlay off the field', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [] });
    expect(root.querySelectorAll('.ig-minigame').length).toBe(1);

    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Escape' }));
    await expect(pending).rejects.toThrow(/backed out/);
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });

  it('accepts confirm as a way out too, so it can never become a wall', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [] });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(pending).rejects.toThrow(/backed out/);
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });

  it('still resolves normally when there is a Rage to choose', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [{ id: 'jump', name: 'Jump' }] });
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter' }));
    await expect(pending).resolves.toMatchObject({ kind: 'kimahri-rage', rage: { rageId: 'jump' } });
    expect(root.querySelectorAll('.ig-minigame').length).toBe(0);
  });
});

// ------------------------------------------------- one press, one meaning

/**
 * `src/ui/ffx/cancelClaim.ts` has the full account. In short: the menus answer
 * `keydown` the instant it arrives, `BattleScreen` polls the same press as an
 * edge on the next frame, and a claim dropped synchronously left that poll
 * looking at a free Esc — so one tap backed out of a submenu *and* opened the
 * pause menu. Every job of the live HUD matrix died on it.
 */
const afterFrame = (): Promise<void> =>
  new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve());
    else setTimeout(() => resolve(), 0);
  });

const key = (code: string): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { code }));
};

/** Walk the stack down to the first row that opens a submenu. */
function stepToGroupRow(hud: FFXBattleHud): void {
  for (let i = 0; i < 8; i++) {
    if (hud.el.querySelector('.ig-cmd--selected .ffx-cmd__chev')) return;
    key('ArrowDown');
  }
  throw new Error('no group row in the fixture command list');
}

describe('Esc in a menu does not also open the pause', () => {
  it('keeps the claim through the frame that carries the press, then drops it', async () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    expect(menuOwnsCancel()).toBe(false); // top row: Esc belongs to the pause

    stepToGroupRow(hud);
    key('Enter');
    expect(menuOwnsCancel()).toBe(true); // in a submenu: Esc is the back button

    key('Escape');
    // The step back has already happened...
    expect(hud.el.querySelector('.ig-cmd--selected .ffx-cmd__chev')).not.toBeNull();
    // ...but the claim is still up, which is what `BattleScreen` polls next.
    expect(menuOwnsCancel()).toBe(true);

    await afterFrame();
    expect(menuOwnsCancel()).toBe(false); // a *second* tap pauses, as it should

    void pending;
  });

  it('drops the claim at once when the decision was made with confirm', async () => {
    const hud = mountHud();
    hud.sync(makeFakeBattleState(), makeFakeTurnPreview());
    const pending = hud.chooseCommand('tidus', makeFakeCommands(), () => makeFakeTurnPreview());
    key('Enter'); // Attack, straight to targeting
    expect(menuOwnsCancel()).toBe(true);
    key('Enter'); // confirm the target — the command is submitted
    expect(menuOwnsCancel()).toBe(false);
    await expect(pending).resolves.toMatchObject({ kind: 'attack' });
  });

  it('holds it for an Overdrive picker backed out of with Esc', async () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const pending = openKimahriRage(root, { rages: [{ id: 'jump', name: 'Jump' }] });
    expect(menuOwnsCancel()).toBe(true);

    key('Escape');
    expect(menuOwnsCancel()).toBe(true);
    await expect(pending).rejects.toThrow(/backed out/);

    await afterFrame();
    expect(menuOwnsCancel()).toBe(false);
  });
});
