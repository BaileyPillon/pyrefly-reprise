// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import type { BattleState } from '../../src/battle/common/types.ts';
import { FFXBattleHud } from '../../src/ui/ffx/FFXBattleHud.ts';
import {
  advisorZone,
  GAP,
  MAX_ADVISOR_HEIGHT,
  MIN_ADVISOR_WIDTH,
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

/** Party sprite rects, measured through the debug API at 1600x900. */
const PARTY: Record<string, Rect[]> = {
  'seymour-flux': [
    { left: 144.1, top: 175.9, right: 240.6, bottom: 314.3 }, // Tidus
    { left: 214.2, top: 152.6, right: 285.4, bottom: 258.8 }, // Kimahri
    { left: 65, top: 162.8, right: 163.9, bottom: 283.4 }, // Yuna
  ],
  yunalesca: [
    { left: 273.7, top: 197.4, right: 366.5, bottom: 339.5 }, // Tidus
    { left: 204.5, top: 191.3, right: 300.4, bottom: 317.7 }, // Yuna
    { left: 300.5, top: 184.6, right: 372.8, bottom: 292.8 }, // Auron
  ],
  'braskas-final-aeon': [
    { left: 143.9, top: 200.8, right: 236.3, bottom: 338.7 }, // Tidus
    { left: 67.7, top: 191.7, right: 161.4, bottom: 311.5 }, // Yuna
    { left: 212.3, top: 184.8, right: 283.7, bottom: 290.1 }, // Auron
  ],
};

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

describe('advisorZone', () => {
  for (const [chapter, sprites] of Object.entries(PARTY)) {
    describe(chapter, () => {
      it('never puts the card on a party sprite, at any height the card can reach', () => {
        const zone = advisorZone({ ...CHROME, sprites });
        expect(zone).not.toBeNull();
        const box = cardRect(zone!, zone!.maxHeight);
        for (const sprite of sprites) {
          expect({ chapter, sprite, box, overlaps: overlaps(box, sprite) }).toMatchObject({ overlaps: false });
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

  it('takes the bottom pocket where the party leaves one — chapters 1 and 3', () => {
    expect(advisorZone({ ...CHROME, sprites: PARTY['seymour-flux']! })!.kind).toBe('pocket');
    expect(advisorZone({ ...CHROME, sprites: PARTY['braskas-final-aeon']! })!.kind).toBe('pocket');
  });

  it('moves up to the shelf in chapter 2, where the party stands across the pocket', () => {
    // Yunalesca's party reaches x 373 and the party-status rail starts at 403:
    // the pocket is 30px wide before the gap is paid, so there is none.
    const zone = advisorZone({ ...CHROME, sprites: PARTY['yunalesca']! })!;
    expect(zone.kind).toBe('shelf');
    expect(zone.left).toBeGreaterThanOrEqual(CHROME.guide.right);
  });

  it('drops the shelf below the Sensor card rather than under it', () => {
    const withSensor = advisorZone({ ...CHROME, sprites: PARTY['yunalesca']! })!;
    const noSensor = advisorZone({ ...CHROME, sensor: null, sprites: PARTY['yunalesca']! })!;
    expect(withSensor.maxHeight).toBeLessThanOrEqual(noSensor.maxHeight);
    expect(cardRect(withSensor, withSensor.maxHeight).top).toBeGreaterThanOrEqual(CHROME.sensor.bottom);
  });

  it('uses the whole band when the guide is off, since its rail is gone', () => {
    const on = advisorZone({ ...CHROME, sprites: PARTY['yunalesca']! })!;
    const off = advisorZone({ ...CHROME, guide: null, sprites: PARTY['yunalesca']! })!;
    expect(off.left).toBeLessThan(on.left);
    expect(off.width).toBeGreaterThan(on.width);
  });

  it('hands back null rather than a nonsense box when the party fills the frame', () => {
    const wall: Rect[] = [{ left: 0, top: 0, right: 640, bottom: 360 }];
    expect(advisorZone({ ...CHROME, sprites: wall })).toBeNull();
  });

  it('keeps the measured gap between the card and whatever bounds it', () => {
    const zone = advisorZone({ ...CHROME, sprites: PARTY['seymour-flux']! })!;
    const spritesRight = Math.max(...PARTY['seymour-flux']!.map((r) => r.right));
    expect(zone.left).toBeGreaterThanOrEqual(spritesRight + GAP - 0.001);
    expect(zone.left + zone.width).toBeLessThanOrEqual(CHROME.partyStatus.left - GAP + 0.001);
  });

  it('never offers more height than the card was designed at', () => {
    // The pocket's ceiling in chapters 1 and 3 is the stage's own top, so the
    // raw room is ~220px — three times the card. Without the clamp the card
    // grows to fill it and the NEXT BEST MOVE slab becomes a column.
    for (const sprites of Object.values(PARTY)) {
      expect(advisorZone({ ...CHROME, sprites })!.maxHeight).toBeLessThanOrEqual(MAX_ADVISOR_HEIGHT);
    }
  });

  it('still hands back the smaller room when the zone is the tighter of the two', () => {
    // Chapter 2's shelf is bounded above by the Sensor card and below by the
    // party's heads; that is less than MAX_ADVISOR_HEIGHT and must survive.
    const zone = advisorZone({ ...CHROME, sprites: PARTY['yunalesca']! })!;
    const headsTop = Math.min(...PARTY['yunalesca']!.map((r) => r.top));
    expect(zone.maxHeight).toBe(headsTop - GAP - (CHROME.sensor.bottom + GAP));
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
    const low: Rect = { left: 256, top: 24, right: 396, bottom: 180 };
    const withSensor = advisorZone({ ...CHROME, sensor: low, sprites: PARTY['seymour-flux']! })!;
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
