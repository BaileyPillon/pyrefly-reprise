/**
 * What the two halves of the Special look's fight-surface tests share (FFX-2 only: the three Special dresspheres exist only in FFX-2). `special-surfaces-fight.test.ts` (the cut-in, the Guide, the
 * intent slab, the advisor, the phone framing) and `special-surfaces-fight-hud.test.ts` (the results page, the party column, the held list, the pro KO marks) were one file of 444 lines until the
 * review fix pass 2 (item O3) split it by whole `describe` blocks; the pieces more than one block reads live here and nowhere else. No assertion is in this file.
 *
 * Both test files run in jsdom (`// @vitest-environment jsdom` on each) and call {@link useFightHooks} once at the top level.
 */

import { afterEach, beforeEach, vi } from 'vitest';
import type { BattleState } from '../../../src/battle/common/types.ts';
import { setPortraitMode } from '../../../src/engine/CutInMode.ts';
import { setDemoChapter } from '../../../src/engine/motion/DemoGate.ts';
import { setProMode, setProPiece } from '../../../src/engine/look/pro/ProSwitch.ts';
import { buildAdvisorView, clearAdvisorCache } from '../../../src/engine/tactics/advisor.ts';
import { buildGuideView } from '../../../src/engine/tactics/guide.ts';
import { setAtbBarsSmooth } from '../../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../../src/ui/ffx2/FFX2BattleHud.ts';
import { ffx2Options } from './ffx2ChapterDrive.ts';
import { openSpecial } from './specialDrive.ts';
import { bahamutGroup, chapterIV } from './specialFormState.ts';
import type { Moment } from './specialSurfaces.ts';

export const CARD = { ffx2: { abilities: ffx2Options().abilities, items: ffx2Options().items } };
export const GIRL_IDS = ['yuna', 'rikku', 'paine'] as const;

/** Chapter IV's state with the switch OFF: the ordinary three girls and the foe. */
export const off = (): BattleState => openSpecial({ build: chapterIV(), group: bahamutGroup, seed: 1, specials: false }).state() as BattleState;

/** The jsdom page, the animation-frame and clock stubs and the look switches the fight-surface cases set, reset around every case. Call once at the top level of a test file. */
export function useFightHooks(): void {
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.stubGlobal('requestAnimationFrame', () => 0);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.spyOn(performance, 'now').mockReturnValue(1000);
    setAtbBarsSmooth(false);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setAtbBarsSmooth(null);
    setPortraitMode(null);
    setProMode(null);
    setProPiece(null);
    setDemoChapter(undefined);
    document.body.innerHTML = '';
  });
}

/** The panel's line for a menu: the acting plate, the target's words, the watch rows and the phase label (hint prose is static chapter text and is not read). */
export function guideLine(m: Moment) {
  const view = buildGuideView(m.state, { actorId: m.d.actorId, commands: m.d.commands });
  return { chapter: view?.chapterId ?? null, actor: view?.next?.actorName ?? null, target: view?.next?.targetName ?? null, label: view?.next?.label ?? null, watch: (view?.watch ?? []).map((w) => w.enemyName), phase: view?.phase?.label ?? null };
}

export function cardOf(m: Moment) {
  clearAdvisorCache();
  const view = buildAdvisorView(m.state, { actorId: m.d.actorId, commands: m.d.commands }, CARD);
  return { view, lines: (view?.suggestions ?? []).flatMap((x) => [x.label, x.targetName, x.reason, x.effect, x.warning, x.menu]).concat(view ? [view.actorName, view.note] : []) };
}

export function mountHud(m: Moment): { hud: FFX2BattleHud; root: HTMLElement; ids: () => string[] } {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const hud = new FFX2BattleHud();
  hud.mount(root);
  hud.sync(m.state, m.snapshot);
  return { hud, root, ids: () => [...root.querySelectorAll<HTMLElement>('.ffx2hud__party .ig-stat')].map((e) => e.dataset['actorId'] as string) };
}
