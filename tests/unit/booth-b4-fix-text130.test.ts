// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { TREATED_CHAPTERS, setDemoChapter, setTreatedScope, treatedHold } from '../../src/engine/motion/DemoGate.ts';
import { HUD_F1_CLASS, HudF1, type HudF1Host } from '../../src/ui/hudf1/HudF1.ts';
import { F1_DAMAGE_K, F1_TEXT_CEILING, hudF1On, hudF1TextSizeOk, setHudF1Mode, setHudF1TextMode } from '../../src/ui/hudf1/HudF1Switch.ts';
import { TIER_SIZE, sizeFactor } from '../../src/ui/common/proNumbers.ts';
import { F1_ROWS, commandRowsCap } from '../../src/ui/common/hudTextSize.ts';
import { itPlays, playsPiece } from './booth-r70-withdrawn.ts';

/**
 * THE REVIEW OF `booth-b4`, FINDING c1 (2026-10-31; FFX only, rule 14: Chapter IX `yojimbo-cavern` and Chapter XII `seymour-omnis`; FFX-2 has no panel of this kind).
 *
 * At TEXT SIZE 130 the Zanmato gauge (IX) reaches 7.4 grid px (about 30 px at 2560 x 1440) into the grown boss ribbon's end and 8.0 into the turn strip's box, and the Omnis disc strip (XII) reaches 9.2 into the ribbon's:
 * a regression against the live site (release 69 draws today's HUD there) in an accessibility setting (`booth-ffx-b4-hud-layout.test.ts` pins the sheet's arithmetic). The fix is the one condition the lane offered: those two
 * chapters keep today's HUD above TEXT SIZE 115 (`HudF1Switch.F1_TEXT_CEILING`), exactly what release 69 draws there, and every reader that follows `hudF1On()` (the command rows, the damage numeral, the layer's class)
 * follows it. Each case below fails without the table.
 */
const CEILING_IDS = ['yojimbo-cavern', 'seymour-omnis'] as const;
const root = document.documentElement;

const sizeBoth = (v: string): void => {
  root.dataset['textSize'] = v;
  root.dataset['textSizeWide'] = v;
};

beforeEach(() => {
  setTreatedScope('all');
  setHudF1Mode('f1');
});
afterEach(() => {
  setHudF1Mode(null);
  setHudF1TextMode(null);
  setDemoChapter(undefined);
  setTreatedScope(null);
  root.removeAttribute('data-text-size');
  root.removeAttribute('data-text-size-wide');
  root.removeAttribute('data-phone-battle');
  history.replaceState(null, '', '/');
});

describe('the table', () => {
  it('names Chapter IX and Chapter XII and nothing else, at 115, both FFX, both treated; IX plays the hud piece (the ceiling is its only exception) and XII HOLDS it since the r72 review (J-HUD-5b), the ceiling kept for the day the hold lifts', () => {
    expect(Object.keys(F1_TEXT_CEILING).sort()).toEqual([...CEILING_IDS].sort());
    for (const [id, max] of Object.entries(F1_TEXT_CEILING)) {
      expect(max, id).toBe(115);
      expect(getChapter(id)?.game, id).toBe('ffx');
      expect(TREATED_CHAPTERS[id]?.game, id).toBe('ffx');
      if (id === 'seymour-omnis') expect(treatedHold(id, 'hud'), 'XII holds the hud piece').toMatch(/Lifts when .*29-stop cursor walk reads 0 overlapping pairs/);
      else expect(treatedHold(id, 'hud'), `${id} plays the hud piece (the ceiling is its only exception)`).toBeUndefined();
    }
  });

  it('Chapter XII holds the F1 HUD (r72 review, J-HUD-5b): the release 71 HUD at every TEXT SIZE, the F1 readers off, while the ceiling rows stay for the lift', () => {
    expect(playsPiece('seymour-omnis', 'hud')).toBe(false);
    setDemoChapter('seymour-omnis');
    for (const v of ['100', '115', '130']) {
      sizeBoth(v);
      expect(hudF1On(), `XII at ${v}`).toBe(false);
      if (v === '130') expect(commandRowsCap(6), "XII rows at 130: TEXT SIZE's own four").toBe(4);
      expect(sizeFactor('damage', 'normal'), `XII numeral at ${v}: the glass one`).toBe(TIER_SIZE.normal);
    }
    setHudF1TextMode('grow');
    sizeBoth('100');
    expect(hudF1On(), 'XII under ?f1text=grow: the hold beats the word').toBe(false);
  });
  it('is frozen (a later edit is a decision made in the file)', () => {
    expect(Object.isFrozen(F1_TEXT_CEILING)).toBe(true);
  });
});

describe('Chapter IX and Chapter XII: the F1 HUD plays at 100 and 115 and gives way to today\'s at 130', () => {
  for (const id of CEILING_IDS) {
    itPlays(id, 'hud')(`${id}: on at no attribute, 100 and 115, off at 130 in either attribute, and back on when it returns to 115`, () => {
      setDemoChapter(id);
      expect(hudF1On(), 'no attribute').toBe(true);
      sizeBoth('100');
      expect(hudF1On(), '100').toBe(true);
      sizeBoth('115');
      expect(hudF1On(), '115').toBe(true);
      expect(hudF1TextSizeOk(), '115').toBe(true);
      sizeBoth('130');
      expect(hudF1On(), '130 both').toBe(false);
      expect(hudF1TextSizeOk(), '130 both').toBe(false);
      sizeBoth('100');
      root.dataset['textSize'] = '130';
      expect(hudF1On(), 'data-text-size 130 only').toBe(false);
      sizeBoth('100');
      root.dataset['textSizeWide'] = '130';
      expect(hudF1On(), 'data-text-size-wide 130 only').toBe(false);
      sizeBoth('115');
      expect(hudF1On(), 'back to 115').toBe(true);
    });

    itPlays(id, 'hud')(`${id}: the readers that follow hudF1On() fall back with it at 130 (command rows, damage numeral) and keep F1's at 115`, () => {
      setDemoChapter(id);
      sizeBoth('115');
      expect(commandRowsCap(6), '115 rows').toBe(F1_ROWS);
      expect(sizeFactor('damage', 'normal'), '115 numeral').toBeCloseTo(TIER_SIZE.normal * F1_DAMAGE_K, 6);
      sizeBoth('130');
      expect(commandRowsCap(6), '130 rows: TEXT SIZE\'s own four').toBe(4);
      expect(sizeFactor('damage', 'normal'), '130 numeral: the glass one').toBe(TIER_SIZE.normal);
    });
  }

  it('the layer follows a change live, under the battle (the MutationObserver re-asks): off at 130, on again at 115, class and layer in step', async () => {
    const stage = document.createElement('div');
    const host = document.createElement('div');
    host.append(stage);
    document.body.append(host);
    const hud: HudF1Host = { game: 'ffx', root: host, stage, cmdStack: () => null, cmdBlock: () => null, helpText: () => '', heroRow: () => null };
    const flush = (): Promise<void> => new Promise((r) => setTimeout(r, 0));
    setDemoChapter('yojimbo-cavern');
    const f1 = new HudF1('ffx');
    f1.mount(hud);
    expect(f1.on).toBe(true);
    root.dataset['textSize'] = '130';
    await flush();
    expect(f1.on).toBe(false);
    expect(host.classList.contains(HUD_F1_CLASS)).toBe(false);
    expect(stage.querySelector<HTMLElement>('.f1-layer')!.hidden).toBe(true);
    root.dataset['textSize'] = '115';
    await flush();
    expect(f1.on).toBe(true);
    expect(host.classList.contains(HUD_F1_CLASS)).toBe(true);
    f1.unmount();
    host.remove();
  });
});

describe('nothing else changes', () => {
  it('every other treated chapter, the booth pair among them, keeps the F1 HUD at 100, 115 and 130 (in either attribute)', () => {
    const others = Object.keys(TREATED_CHAPTERS).filter((id) => !(CEILING_IDS as readonly string[]).includes(id));
    expect(others).toHaveLength(15); // sixteen before the second focused review of the release 71 candidate took Sin's face off the list; seventeen treated less the two ceiling chapters after r72-hud
    for (const id of others) {
      setDemoChapter(id);
      for (const v of ['100', '115', '130']) {
        sizeBoth(v);
        expect(hudF1On(), `${id} at ${v}`).toBe(true);
      }
      sizeBoth('100');
      root.dataset['textSizeWide'] = '130';
      expect(hudF1On(), `${id} at wide 130`).toBe(true);
    }
  });

  it('a chapter off the list, a hidden id and the hostile ids answer as they did (the ceiling reads own keys only)', () => {
    sizeBoth('130');
    for (const id of ['sin-fins-core', 'exp-leblanc', 'nonsense', '__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
      setDemoChapter(id);
      expect(hudF1TextSizeOk(), id).toBe(true);
      expect(hudF1On(), id).toBe(false); // not treated: today's HUD whatever the size
    }
    setDemoChapter(undefined);
    expect(hudF1TextSizeOk(), 'no chapter').toBe(true);
  });

  it('?f1text=today still gives every chapter release 67\'s step-down at 115 and 130 (the two chapters included), and ?f1text=grow beats the ceiling at 130', () => {
    setHudF1TextMode('today');
    for (const id of ['seymour-flux', 'yojimbo-cavern', 'seymour-omnis'].filter((c) => playsPiece(c, 'hud'))) { // XII holds the hud piece (r72 review): it answers off at every size, pinned above
      setDemoChapter(id);
      sizeBoth('100');
      expect(hudF1On(), `${id} at 100`).toBe(true);
      for (const v of ['115', '130']) {
        sizeBoth(v);
        expect(hudF1On(), `${id} at ${v} under ?f1text=today`).toBe(false);
      }
    }
    setHudF1TextMode(null);
    history.replaceState(null, '', '/?f1text=grow');
    for (const id of CEILING_IDS.filter((c) => playsPiece(c, 'hud'))) {
      setDemoChapter(id);
      sizeBoth('130');
      expect(hudF1On(), `${id} at 130 under ?f1text=grow`).toBe(true);
    }
  });

  it('on a phone nothing changes: the F1 layer never draws there (the ceiling adds no new way on)', async () => {
    const stage = document.createElement('div');
    const host = document.createElement('div');
    host.append(stage);
    document.body.append(host);
    const hud: HudF1Host = { game: 'ffx', root: host, stage, cmdStack: () => null, cmdBlock: () => null, helpText: () => '', heroRow: () => null };
    root.setAttribute('data-phone-battle', '');
    setDemoChapter('seymour-omnis');
    const f1 = new HudF1('ffx');
    f1.mount(hud);
    expect(f1.on).toBe(false);
    f1.unmount();
    host.remove();
  });
});
