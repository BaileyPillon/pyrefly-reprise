// @vitest-environment jsdom
/**
 * The guided first run (fb2-0929 O2, D-289; built to
 * `docs/concepts/fb2-0929/onboard/o2-step*-*.jpg`, preflight
 * `docs/plans/firstrun-o2-review.md`).
 *
 * What must hold, whatever else changes:
 * - The words are the mockup's, and step 3 keeps Auron's approved first-command
 *   line word for word (one voice, one surface).
 * - It runs on a first run only: armed after the briefing, resumed only when a
 *   started guide is unfinished, never for a finished one. The seen-state is the
 *   existing `seenCoach` list; the harness's "mark everything seen" covers it.
 * - It never blocks the control it points at: in guide mode a confirm on the menu
 *   is not swallowed, and only the player's own cancel counts as a skip (a line the
 *   layer takes down itself does not end the guide).
 * - Placement reproduces the mockup's anchors at 1600x900 and 390x844.
 *
 * Game case: steps 1 and 2 both games; step 3 FFX only (an FFX-2 first battle ends
 * the guide at its start).
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { CoachMark } from '../../src/ui/coach/CoachMark.ts';
import { marksFor } from '../../src/ui/coach/coachCopy.ts';
import { hasSeen, markAllSeen, markSeen, resetCoach } from '../../src/ui/coach/coachState.ts';
import { FIRST_RUN_IDS, FIRST_RUN_STEPS } from '../../src/ui/coach/firstRunCopy.ts';
import {
  armFirstRunGuide,
  firstRunActive,
  firstRunBattleBegan,
  firstRunTurnGuide,
  resumeFirstRunGuide,
  stopFirstRun,
} from '../../src/ui/coach/firstRunGuide.ts';
import { place, slabHtml } from '../../src/ui/coach/firstRunView.ts';

let absorbed = 0;
const host = () => ({ root: document.body, absorbInput: () => void (absorbed += 1) });

beforeEach(() => {
  resetCoach();
  stopFirstRun();
  absorbed = 0;
});
afterEach(() => {
  stopFirstRun();
  document.body.innerHTML = '';
});

describe('the words are the approved mockup\'s (option.html, O2)', () => {
  it('steps 1 and 2, pointer and touch wordings', () => {
    const [board, prep] = FIRST_RUN_STEPS;
    expect(board.quote).toBe('“Start with the first one.”');
    expect(board.line.pointer).toBe('Click its picture to begin. The others wait on the board.');
    expect(board.line.touch).toBe('Tap its picture to begin. The other fights wait on the board.');
    expect(prep.quote).toBe('“Your party is ready.”');
    expect(prep.line.pointer).toBe('The tabs are for later. Start the battle.');
    expect(prep.line.touch).toBe('Tabs are for later. Tap START BATTLE.');
  });

  it('step 3 wears Auron\'s approved first-command line unchanged, with the mockup\'s two lines under it', () => {
    const approved = marksFor('ffx').find((m) => m.id === 'ffx-turn-order')!.body;
    expect(approved).toBe('“He moves after you. Not before. Use it.”');
    const html = slabHtml(FIRST_RUN_STEPS[2], approved);
    const el = document.createElement('div');
    el.innerHTML = html;
    expect(el.querySelector('.frg__eyebrow')!.textContent).toBe('Auron · 3 of 3');
    expect(el.querySelector('.frg__quote')!.textContent).toBe(approved);
    expect(el.querySelector('.frg__line')!.textContent).toBe('Your turn.');
    expect(el.querySelector('.frg__act .frg__pointer')!.textContent).toBe('Pick ATTACK, then pick who it hits.');
    expect(el.querySelector('.frg__act .frg__touch')!.textContent).toBe('Tap ATTACK, then tap who it hits.');
    expect(el.querySelectorAll('.frg__steps .on')).toHaveLength(3);
  });
});

describe('first run only, through the existing seen-list', () => {
  it('arms after the briefing and draws a layer; a finished guide never arms again', () => {
    armFirstRunGuide(host());
    expect(firstRunActive()).toBe(true);
    expect(document.querySelector('.frg')).not.toBeNull();
    stopFirstRun();
    for (const id of FIRST_RUN_IDS) markSeen(id);
    armFirstRunGuide(host());
    expect(firstRunActive()).toBe(false);
  });

  it('a returning player (nothing of the guide seen) is not resumed; a started, unfinished guide is', () => {
    markSeen('briefing');
    resumeFirstRunGuide(host());
    expect(firstRunActive()).toBe(false);
    markSeen('firstrun-board');
    resumeFirstRunGuide(host());
    expect(firstRunActive()).toBe(true);
  });

  it('the harness hook marks the guide seen too (CHK-016)', () => {
    markAllSeen();
    for (const id of FIRST_RUN_IDS) expect(hasSeen(id)).toBe(true);
  });

  it('a battle mounting marks steps 1-2 done; an FFX-2 first battle ends the guide (step 3 is FFX only)', () => {
    armFirstRunGuide(host());
    firstRunBattleBegan('ffx2');
    for (const id of FIRST_RUN_IDS) expect(hasSeen(id)).toBe(true);
  });

  it('an FFX first battle leaves step 3 for the first command', () => {
    armFirstRunGuide(host());
    firstRunBattleBegan('ffx');
    expect(hasSeen('firstrun-prep')).toBe(true);
    expect(hasSeen('firstrun-battle')).toBe(false);
    expect(firstRunTurnGuide()).not.toBeNull();
  });

  it('no step 3 dress unless the guide is armed and past party prep', () => {
    expect(firstRunTurnGuide()).toBeNull();
    armFirstRunGuide(host());
    expect(firstRunTurnGuide()).toBeNull(); // still on the board
  });
});

function mountLine(cursorOnAttack = true): { line: CoachMark; attack: HTMLElement } {
  const root = document.createElement('div');
  const talk = `<div class="ig-cmd${cursorOnAttack ? '' : ' ig-cmd--selected'}">Talk</div>`;
  const attack = `<div class="ig-cmd${cursorOnAttack ? ' ig-cmd--selected' : ''}">Attack</div>`;
  root.innerHTML = `<div class="ffxhud"><div class="ig-cmd-stack">${talk}${attack}</div></div><div class="coach-layer"></div>`;
  document.body.appendChild(root);
  armFirstRunGuide(host());
  firstRunBattleBegan('ffx');
  const line = new CoachMark({
    root: root.querySelector('.coach-layer') as HTMLElement,
    mark: marksFor('ffx')[0]!,
    game: 'ffx',
    reduceMotion: true,
    setTimer: () => 0,
    clearTimer: () => undefined,
    guide: firstRunTurnGuide(),
  });
  return { line, attack: root.querySelectorAll('.ig-cmd')[1] as HTMLElement };
}

const key = (code: string): KeyboardEvent => new KeyboardEvent('keydown', { code, key: code, bubbles: true, cancelable: true });

describe('step 3 is FFX\'s line in the guide\'s dress, and never blocks ATTACK', () => {
  it('the dressed line keeps the approved words and carries the guide flag', () => {
    const { line } = mountLine();
    void line.show();
    expect(line.el.dataset['guide']).toBe('3');
    expect(line.el.querySelector('.frg__quote')!.textContent).toBe('“He moves after you. Not before. Use it.”');
  });

  it('a confirm on the menu is not swallowed in guide mode (the approved line alone swallows it, PR-0051)', async () => {
    const { line } = mountLine();
    const settled = line.show();
    const enter = key('Enter');
    window.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(false);
    await expect(settled).resolves.toBe('confirmed');
    expect(hasSeen('firstrun-battle')).toBe(true);
    expect(absorbed).toBe(0); // an answer, not a skip: the press is left to the menu
  });

  it('with the cursor elsewhere (Kimahri\'s first menu opens on TALK) the approved rule stands: a bare Enter only takes the line down', async () => {
    const { line } = mountLine(false);
    const settled = line.show();
    const enter = key('Enter');
    window.dispatchEvent(enter);
    expect(enter.defaultPrevented).toBe(true);
    await expect(settled).resolves.toBe('confirmed');
  });

  it('the player\'s own Esc skips the whole guide and takes the press back (no pause behind it)', async () => {
    const { line } = mountLine();
    const settled = line.show();
    window.dispatchEvent(key('Escape'));
    await expect(settled).resolves.toBe('cancelled');
    for (const id of FIRST_RUN_IDS) expect(hasSeen(id)).toBe(true);
    expect(absorbed).toBe(1);
    expect(firstRunActive()).toBe(false);
  });

  it('a line the layer takes down itself (a beat, auto-play) is not a skip: step 3 stays due', async () => {
    const { line } = mountLine();
    const settled = line.show();
    line.dismiss();
    await expect(settled).resolves.toBe('cancelled');
    expect(hasSeen('firstrun-battle')).toBe(false);
    expect(firstRunTurnGuide()).not.toBeNull();
  });

  it('the skip words skip', () => {
    const { line } = mountLine();
    void line.show();
    (line.el.querySelector('[data-role="firstrun-skip"]') as HTMLElement).click();
    expect(line.finished).toBe(true);
    expect(hasSeen('firstrun-battle')).toBe(true);
    expect(firstRunActive()).toBe(false);
  });
});

describe('placement reproduces the mockup\'s anchors (option.html)', () => {
  it('desktop 1600x900: slab right of the picture, left of START BATTLE, right of ATTACK', () => {
    const plate = { left: 64, top: 133, width: 778, height: 407 };
    const s1 = place(1, plate, 172, 1600, 900, false);
    expect(s1.slab.left).toBe(900); // mockup: 900
    expect(s1.chev).toMatchObject({ left: 866, dir: 'left' }); // mockup: 866
    expect(Math.round(s1.chev.top)).toBe(319); // mockup: 318
    const start = { left: 1233, top: 642, width: 307, height: 61 };
    const s2 = place(2, start, 158, 1600, 900, false);
    expect(s2.slab.left).toBe(650); // mockup: 650
    expect(s2.chev).toMatchObject({ left: 1196, dir: 'right' }); // mockup: 1196
    const attack = { left: 88, top: 513, width: 390, height: 57 };
    const s3 = place(3, attack, 185, 1600, 900, false);
    expect(s3.slab.left).toBe(540); // mockup: 540
    expect(s3.chev).toMatchObject({ left: 494, dir: 'left' }); // mockup: 494
  });

  it('phone 390x844: under the picture, above START BATTLE, the line under the top band', () => {
    const plate = { left: 12, top: 34, width: 367, height: 139 };
    const s1 = place(1, plate, 148, 390, 844, true);
    expect(s1.slab).toMatchObject({ left: 22, top: 222 }); // mockup: 22, 222
    expect(s1.chev).toMatchObject({ top: 186, dir: 'up' }); // mockup: 186
    const start = { left: 7, top: 782, width: 376, height: 46 };
    const s2 = place(2, start, 129, 390, 844, true);
    expect(s2.slab.top).toBe(520); // mockup: 520
    expect(s2.chev).toMatchObject({ top: 742, dir: 'down' }); // mockup: 742
    const attack = { left: 199, top: 610, width: 183, height: 55 };
    const s3 = place(3, attack, 176, 390, 844, true, 136);
    expect(s3.slab.top).toBe(150); // mockup: 150
    expect(s3.chev).toMatchObject({ top: 582, dir: 'down' }); // mockup: 582
  });
});
