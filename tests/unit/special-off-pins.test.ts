// @vitest-environment jsdom
/**
 * Test 25 of the FFX-2 Special look (step A; game case: FFX-2 only in what is pinned: the FFX-2 battle HUD's party column and its three sheets).
 *
 * The switch `specialDressUp` is OFF in every shipped chapter. With it off the mounted FFX-2 HUD must draw the party column it draws at the head the
 * look steps start from, and the CSS rules those steps will add to must still say what they say. Pinned in `tests/fixtures/specials/off-pins/`:
 *  - the `innerHTML` of the party column of a real `FFX2BattleHud` after `sync` for Chapter IV and Chapter V, in both ATB-bar looks (`?atbbars=today`
 *    and the smooth default; pattern `atb-live.test.ts`);
 *  - the rules of `ffx2-hud.css`, `hudf1-ffx2.css` and `phone-hud.css` whose selectors are NAMED here (each must exist today), never a whole sheet.
 * The row and face-stack pins are `party-rows-off-pin.test.ts`. The FFX chapter's HUD, the command menu, the ally pick and the results snapshots belong to
 * the later steps that edit those surfaces (D1, PROOF).
 *
 * What the pins do NOT prove: they are taken at the branch head, so they prove the look steps' OFF. The engine commits between the older base and the head
 * are covered only by the flag-off A/B of the PROOF step.
 *
 * Removal check: change one character of a pinned CSS declaration or of a row template and the matching case fails.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BattleState, FFX2PartyBuild } from '../../src/battle/common/types.ts';
import { FFX2Engine } from '../../src/battle/ffx2/index.ts';
import { getChapter } from '../../src/data/encounters.ts';
import { setAtbBarsSmooth } from '../../src/ui/ffx2/AtbLive.ts';
import { FFX2BattleHud } from '../../src/ui/ffx2/FFX2BattleHud.ts';
import { ffx2Options } from './helpers/ffx2ChapterDrive.ts';
import { expectPinned } from './helpers/offPins.ts';

const REPO = resolve(__dirname, '..', '..');

describe('OFF pin 3: the party column of a mounted FFX2BattleHud', () => {
  let root: HTMLElement;
  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    vi.spyOn(performance, 'now').mockReturnValue(1000); // the shimmer's phase comes from the page clock (`AtbLive.shimmerDelay`)
  });
  afterEach(() => {
    vi.restoreAllMocks();
    setAtbBarsSmooth(null);
    document.body.innerHTML = '';
  });

  function column(chapterId: string, smooth: boolean): string {
    const chapter = getChapter(chapterId)!;
    const engine = new FFX2Engine(ffx2Options());
    engine.setSeed(1);
    engine.init({ game: 'ffx2', party: chapter.buildRef as FFX2PartyBuild, enemies: chapter.enemyGroupRef, triggers: [], seed: 1, condition: 'normal', canEscape: false });
    setAtbBarsSmooth(smooth);
    const hud = new FFX2BattleHud();
    hud.mount(root);
    hud.sync(engine.state() as BattleState, engine.gaugeSnapshot());
    const party = root.querySelector<HTMLElement>('.ffx2hud__party');
    expect(party, chapterId).not.toBeNull();
    expect(party!.querySelectorAll('.ig-stat').length, chapterId).toBe(3);
    return party!.innerHTML;
  }

  it('Chapter IV and Chapter V draw the pinned column, today-bars and smooth-bars', () => {
    const out: Record<string, string> = {};
    for (const smooth of [false, true]) {
      for (const id of ['ffx2-bahamut', 'ffx2-vegnagun-shuyin']) {
        out[`${id}/${smooth ? 'smooth' : 'today'}`] = column(id, smooth);
        root.innerHTML = '';
      }
    }
    expectPinned('hud-party-column', out);
  });
});

interface CssRule {
  at: string;
  selectors: string[];
  body: string;
}

/** A small reader for the flat rules and the `@media`/`@supports` blocks these sheets use; `@keyframes` and `@font-face` are skipped. */
function readRules(css: string, at = ''): CssRule[] {
  const out: CssRule[] = [];
  const text = css.replace(/\/\*[\s\S]*?\*\//g, '');
  let i = 0;
  while (i < text.length) {
    const open = text.indexOf('{', i);
    if (open < 0) break;
    const prelude = text.slice(i, open).replace(/^[\s;}]+/, '').trim();
    let depth = 1;
    let j = open + 1;
    while (j < text.length && depth > 0) {
      if (text[j] === '{') depth += 1;
      else if (text[j] === '}') depth -= 1;
      j += 1;
    }
    const inner = text.slice(open + 1, j - 1);
    if (/^@(media|supports|container|layer)\b/.test(prelude)) out.push(...readRules(inner, `${at}${at ? ' ' : ''}${prelude.replace(/\s+/g, ' ')}`));
    else if (!prelude.startsWith('@')) out.push({ at, selectors: prelude.split(',').map((s) => s.replace(/\s+/g, ' ').trim()), body: inner.replace(/\s+/g, ' ').trim() });
    i = j;
  }
  return out;
}

/** The selectors this step names, per sheet: each exists today, and a later step may add rules but not change these. */
const SHEETS: Record<string, string[]> = {
  'src/ui/ffx2/ffx2-hud.css': [
    '.ffx2hud .ig-stat-list', '.ffx2hud .ig-stat', '.ffx2stat__face', '.ig-stat--acting .ffx2stat__face', '.ffx2stat__face-img', '.ffx2stat__mono',
    '.ffx2stat__job', '.ffx2stat__body', '.ffx2stat__top', '.ffx2party__status', '.ffx2atb--haste .ffx2atb__fill', '.ffx2hud--targeting-enemy .ffx2hud__party',
    '.ffx2hud .ffx2hud__party',
  ],
  'src/ui/hudf1/hudf1-ffx2.css': [
    '.ffx2hud.hud-f1 .ig-stat-list', '.ffx2hud.hud-f1 .ig-stat', '.ffx2hud.hud-f1 .ig-stat--acting', '.ffx2hud.hud-f1 .ffx2stat__face', '.ffx2hud.hud-f1 .ffx2stat__job',
    '.ffx2hud.hud-f1 .ffx2stat__body', '.ffx2hud.hud-f1 .ffx2stat__top', '.ffx2hud.hud-f1 .ffx2party__status',
  ],
  'src/ui/ffx2/phone-hud.css': [
    "html[data-phone-battle='ffx2'] .ffx2hud .ig-stat-list", "html[data-phone-battle='ffx2'] .ffx2hud .ig-stat", "html[data-phone-battle='ffx2'] .ffx2hud .ig-stat--acting",
    "html[data-phone-battle='ffx2'] .ffx2stat__body", "html[data-phone-battle='ffx2'] .ffx2stat__top", "html[data-phone-battle='ffx2'] .ffx2stat__face",
    "html[data-phone-battle='ffx2'] .ffx2stat__mono", "html[data-phone-battle='ffx2'] .ffx2stat__job", "html[data-phone-battle='ffx2'] .ffx2party__status",
    "html[data-phone-battle='ffx2'] .ffx2hud--targeting-enemy .ffx2hud__party",
  ],
};

describe('OFF pin 4: the named CSS rules of the three FFX-2 HUD sheets', () => {
  it('the reader finds a selector it is asked for, and not one it is not', () => {
    const rules = readRules('/* c */ .a, .b { x: 1; } @media (max-width: 1px) { .a { y: 2; } } @keyframes k { from { z: 0; } }');
    expect(rules).toEqual([
      { at: '', selectors: ['.a', '.b'], body: 'x: 1;' },
      { at: '@media (max-width: 1px)', selectors: ['.a'], body: 'y: 2;' },
    ]);
  });

  for (const [file, selectors] of Object.entries(SHEETS)) {
    it(`${file}: every named selector exists today and its rules are the pinned text`, () => {
      const rules = readRules(readFileSync(resolve(REPO, file), 'utf8'));
      const out: Record<string, Array<{ at: string; selectors: string[]; body: string }>> = {};
      for (const sel of selectors) {
        const found = rules.filter((r) => r.selectors.includes(sel));
        expect(found.length, `${file}: ${sel}`).toBeGreaterThan(0);
        out[sel] = found;
      }
      expectPinned(`css-${file.split('/').pop()!.replace('.css', '')}`, out);
    });
  }
});
