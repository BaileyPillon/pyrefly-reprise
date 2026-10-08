// @vitest-environment jsdom
/**
 * **A scene may cap the FFX-2 move-advisor card's height (Chapter VI, FFX-2 only; branch r3941-stage).**
 *
 * Bailey's "Option 3: bosses forward" (2026-10-07) stands every Syndicate fiend at its real size, nearer the party, and the nearest fiends' feet then reach the
 * band the move-advisor card hangs from (y 651 at its full height at 1600x900). `SceneStaging.advisorCap` is the scene's own cap on the card, in HUD grid px; the
 * card prints fewer lines and its top edge stays under their feet (`docs/handoff/r3941-stage.md`). Every decision starts from it (`FFX2BattleHud.resetAdvisorCap`),
 * and a scene that names none leaves the card as it always was.
 *
 * The scene -> HUD wiring is `BattleScreen` -> `createHud(game, field, engine, artNamespace, advisorCap)` -> `new FFX2BattleHud({ advisorCap })`.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { createHud } from '../../src/app/screens/BattleScreenWiring.ts';
import { LEBLANC_LAST_ROOM_SLOTS } from '../../src/scenes/leblanc-last-room.ts';
import { LEBLANC_ADVISOR_CAP } from '../../src/scenes/leblanc-staging.ts';
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

describe('only Chapter VI\'s room names a cap (FFX chapters and every other FFX-2 room are as they were)', () => {
  it('the Last Room publishes LEBLANC_ADVISOR_CAP', () => {
    expect(LEBLANC_LAST_ROOM_SLOTS.advisorCap).toBe(LEBLANC_ADVISOR_CAP);
    expect(LEBLANC_ADVISOR_CAP).toBeGreaterThan(36); // `MIN_UNDER_ROOM`: under that the card is a strip of names
    expect(LEBLANC_ADVISOR_CAP).toBeLessThan(104); // the stylesheet's own cap: a cap that is not lower is no cap
  });

  it('no other scene file sets advisorCap', () => {
    const dir = join(here, '../../src/scenes');
    const users = readdirSync(dir)
      .filter((f) => f.endsWith('.ts'))
      .filter((f) => /advisorCap/.test(readFileSync(join(dir, f), 'utf8')))
      .sort();
    // the type and its copier, the scene's staging and the room that reads it
    expect(users).toEqual(['leblanc-last-room.ts', 'leblanc-staging.ts', 'types.ts']);
  });
});
