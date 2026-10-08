// @vitest-environment jsdom
/**
 * **A scene may cap the FFX-2 move-advisor card's height (the plumbing; FFX-2 only; branch r3941-stage, kept by r3941-spacing).**
 *
 * Release 39.4.1's "bosses forward" lane stood the Syndicate's feet in the band the move-advisor card hangs from (y 651 at its full height at 1600x900), and
 * `SceneStaging.advisorCap` is the scene's own cap on the card, in HUD grid px: the card prints fewer lines and its top edge stays under the feet
 * (`docs/handoff/r3941-stage.md`). Every decision starts from it (`FFX2BattleHud.resetAdvisorCap`), and a scene that names none leaves the card as it always was.
 *
 * **Chapter VI no longer names one** (Bailey, 2026-10-08, "Old spacing, real sizes": the fiends stand where 39.4 stood them, 40 px or more above the card at its
 * full height, so there is nothing to cap, `docs/handoff/r3941-spacing.md`). The field, `stagingOf`'s copy of it and the HUD's reading of it stay: the
 * wave-2 rooms (`r3942-stage`) name caps of their own, and a room that stood a fiend low would need it again.
 *
 * The scene -> HUD wiring is `BattleScreen` -> `createHud(game, field, engine, artNamespace, advisorCap)` -> `new FFX2BattleHud({ advisorCap })`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { LEBLANC_LAST_ROOM_SLOTS } from '../../src/scenes/leblanc-last-room.ts';
import { FORWARD_FIEND_ADVISOR_CAP } from '../../src/scenes/advisor-cap.ts';
import { CLOISTER_100_SLOTS } from '../../src/scenes/cloister-100.ts';
import { DEN_OF_WOE_SLOTS } from '../../src/scenes/den-of-woe.ts';
import { ROAD_TO_THE_FARPLANE_SLOTS } from '../../src/scenes/road-to-the-farplane.ts';
import { stagingOf } from '../../src/scenes/types.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';

const here = dirname(fileURLToPath(import.meta.url));
const mounted: Array<{ unmount(): void }> = [];
afterEach(() => {
  for (const h of mounted.splice(0)) h.unmount();
  document.body.innerHTML = '';
});

/** The advisor card's inline `max-height` once a decision has been reset on a mounted HUD. */
function cardCap(make: () => FFX2BattleHud): string {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = make();
  hud.mount(root);
  mounted.push(hud);
  hud.closeCommandMenu(); // a decision starts over: the cap with it
  const card = root.querySelector<HTMLElement>('.mad__card');
  expect(card, 'the advisor card is on the HUD').not.toBeNull();
  return card!.style.maxHeight;
}

describe('SceneStaging.advisorCap, through to the FFX-2 HUD', () => {
  it('a scene that names a cap holds the card to it at every decision', () => {
    expect(cardCap(() => new FFX2BattleHud({ advisorCap: 46 }))).toBe('46px');
  });

  it('a scene that names none leaves the card to its stylesheet, as it always was', () => {
    expect(cardCap(() => new FFX2BattleHud())).toBe('');
    expect(cardCap(() => new FFX2BattleHud({}))).toBe('');
  });

  it('createHud hands the scene\'s cap to the FFX-2 HUD, and only the FFX-2 HUD', () => {
    const root = document.createElement('div');
    document.body.appendChild(root);
    const hud = createHud('ffx2', undefined, null, undefined, 46);
    hud.mount(root);
    mounted.push(hud);
    hud.closeCommandMenu?.();
    expect(root.querySelector<HTMLElement>('.mad__card')?.style.maxHeight).toBe('46px');
    // an FFX HUD takes the same argument and ignores it: its card is placed through `ffx/hudSafeZones.ts`
    expect(() => createHud('ffx', undefined, null, undefined, 46)).not.toThrow();
  });

  it('stagingOf copies the cap when a scene sets one, and only then', () => {
    expect(stagingOf({ advisorCap: 46 }).advisorCap).toBe(46);
    expect('advisorCap' in stagingOf({})).toBe(false);
    expect(stagingOf({ advisorCap: 0 }).advisorCap).toBe(0); // a stated zero is a stated cap, not "unset"
  });
});

describe('Chapter VI\'s room names no cap (r3941-spacing: the card is as 39.4 had it); the three rooms r3942-stage brought fiends forward in name the shared one', () => {
  it('the Last Room publishes none', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.advisorCap).toBeUndefined();
  });

  it('r3942-stage: the Road to the Farplane, the Cloister and the Den of Woe name the shared cap', () => {
    expect(FORWARD_FIEND_ADVISOR_CAP).toBeGreaterThan(36);
    expect(FORWARD_FIEND_ADVISOR_CAP).toBeLessThan(104);
    expect(ROAD_TO_THE_FARPLANE_SLOTS.advisorCap).toBe(FORWARD_FIEND_ADVISOR_CAP);
    expect(CLOISTER_100_SLOTS.advisorCap).toBe(FORWARD_FIEND_ADVISOR_CAP);
    expect(DEN_OF_WOE_SLOTS.advisorCap).toBe(FORWARD_FIEND_ADVISOR_CAP);
  });

  it('no other scene file sets advisorCap: the type and its copier, the shared cap and the three rooms that name it', () => {
    const dir = join(here, '../../src/scenes');
    const users = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /advisorCap/.test(readFileSync(join(dir, f), 'utf8')))
      .sort();
    expect(users).toEqual(['advisor-cap.ts', 'cloister-100.ts', 'den-of-woe.ts', 'road-to-the-farplane.ts', 'types.ts']);
  });
});
