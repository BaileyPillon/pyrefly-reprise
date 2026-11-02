// @vitest-environment jsdom
/**
 * THE LIFT OF CHAPTER XII'S F1 HUD HOLD (lane r74-omnis, 2026-11-02; FFX only, rule 14).
 *
 * The r72 focused review put a `hud` hold on `seymour-omnis` (job J-HUD-5b: the target flag over the Move advisor card). r74-omnis steers the advisor off the flag (`ui/ffx/flagSteer.ts`) and lifts the row. What this file pins:
 *  - the table: Chapter XII is on the list, FFX, holds `breath`, `cam` and `moments` and plays the F1 HUD; no other chapter's holds moved;
 *  - the F1 HUD plays in XII at 100 and 115 and steps down to today's at 130 (`F1_TEXT_CEILING`), exactly as Chapter IX's does;
 *  - the handoff note (`docs/handoff/r74-omnis.md`) keeps the lifted row's text with its numbers and its "Lifts when" (to put back), carries the job specs with predictions, the game case, the CHANGELOG lines, the open questions, and the hold condition
 *    that says the lift stands on a model until the browser walk has read 0;
 *  - no shipped string names a folder of the build machine (the privacy gate of `hold-reasons-no-local-paths.test.ts` covers every hold; the new module's strings are read here).
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { getChapter } from '../../src/data/encounters.ts';
import { F1_TEXT_CEILING, hudF1On } from '../../src/ui/hudf1/HudF1Switch.ts';
import { PIECE_HOLDS, TREATED_CHAPTERS, TREATED_PIECES, isTreatedChapter, setDemoChapter, setTreatedScope, treatedHold, treatedHolds } from '../../src/engine/motion/DemoGate.ts';
import { findLocalPaths } from '../../tools/dist-local-paths.mjs';

const OMNIS = 'seymour-omnis';
const note = (): string => readFileSync(resolve('docs/handoff/r74-omnis.md'), 'utf8').replace(/\r\n/g, '\n');

afterEach(() => {
  setTreatedScope(null);
  setDemoChapter(undefined);
  document.documentElement.removeAttribute('data-text-size');
  document.documentElement.removeAttribute('data-text-size-wide');
});

describe('Chapter XII plays the F1 HUD again and holds the three pieces it held before the r72 review', () => {
  it('is on the list, FFX in the registry and in the table, with no hud row', () => {
    expect(getChapter(OMNIS)?.game).toBe('ffx');
    expect(TREATED_CHAPTERS[OMNIS]).toEqual({ game: 'ffx', since: 'r71' });
    expect(Object.keys(PIECE_HOLDS[OMNIS]!)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHolds(OMNIS)).toEqual(['breath', 'cam', 'moments']);
    expect(treatedHold(OMNIS, 'hud')).toBeUndefined();
    for (const p of ['breath', 'cam', 'moments'] as const) expect(treatedHold(OMNIS, p), p).toMatch(/Lifts when/);
  });

  it('under all it plays every piece but the three; under `?treated=pack` (release 68) none', () => {
    setTreatedScope('all');
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), p).toBe(!['breath', 'cam', 'moments'].includes(p));
    setTreatedScope('pack');
    for (const p of TREATED_PIECES) expect(isTreatedChapter(OMNIS, p), `${p} pack`).toBe(false);
  });

  it('the F1 HUD is on in XII at 100 and 115, off at 130 (the ceiling every FFX chapter that plays it shares with IX), off under pack', () => {
    expect(F1_TEXT_CEILING[OMNIS]).toBe(115);
    setTreatedScope('all');
    setDemoChapter(OMNIS);
    const root = document.documentElement;
    for (const [size, on] of [[undefined, true], ['100', true], ['115', true], ['130', false]] as const) {
      if (size) root.setAttribute('data-text-size', size);
      else root.removeAttribute('data-text-size');
      expect(hudF1On(), `TEXT SIZE ${size ?? 'unset'}`).toBe(on);
    }
    root.removeAttribute('data-text-size');
    setTreatedScope('pack');
    expect(hudF1On(), 'pack').toBe(false);
  });

  it('no other chapter holds hud, and the other chapters\' hold sets are the ones release 73 carried', () => {
    for (const [id, rows] of Object.entries(PIECE_HOLDS)) expect(Object.prototype.hasOwnProperty.call(rows, 'hud'), id).toBe(false);
    expect(Object.keys(PIECE_HOLDS['yojimbo-cavern']!)).toEqual(['breath', 'cam', 'moments']);
    expect(Object.keys(TREATED_CHAPTERS)).toHaveLength(18);
    expect(Object.keys(TREATED_CHAPTERS)).not.toContain('sin-fins-core');
  });
});

describe('the handoff note (docs/handoff/r74-omnis.md)', () => {
  it('says FFX only, nothing deploys, and that the lift stands on a model until the browser walk has read 0', () => {
    const top = note().slice(0, note().indexOf('## 1. '));
    expect(top).toMatch(/Game case \(rule 14\): FFX only/);
    expect(top).toMatch(/HOLD CONDITION/);
    expect(top).toMatch(/offline proof only/);
    expect(top).toMatch(/J74-1 to J74-4/);
    expect(top).toMatch(/Nothing deploys from this branch/);
  });

  it('keeps the lifted row with its numbers and its "Lifts when", ready to put back (section 8)', () => {
    const n = note();
    const at = n.indexOf('## 8. ');
    expect(at).toBeGreaterThan(0);
    const s = n.slice(at, n.indexOf('## 9. '));
    for (const w of [/232 cursor|walked the cursor 232 stops/, /34 of them/, /1600 x 900 in 5 of 29/, /1366 x 768 in 2/, /1440 x 810 in 9/, /1536 x 864 in 6/, /1920 x 1080 in 11/, /15\.3 grid px/, /1\.7 grid px/, /87 of 87/, /41 of 87/, /0 teleports/]) {
      expect(s, String(w)).toMatch(w);
    }
    expect(s).toMatch(/Lifts when the advisor card is steered against the flag's dock boxes, or hidden while the cursor is up at those widths, and the 29-stop cursor walk reads 0 overlapping pairs at 1280, 1366, 1440, 1536, 1600, 1920 and 2560 wide at TEXT SIZE 100 and 115 with 0 console errors\./);
    expect(s).toMatch(/33 stops over the advisor and one over the Enemy Intent line/); // the count, corrected
  });

  it('carries the jobs J74-1 to J74-6 with predictions, the CHANGELOG lines with their game tags and the open questions', () => {
    const n = note();
    const jobs = n.slice(n.indexOf('## 6. '), n.indexOf('## 7. '));
    for (const j of ['J74-1', 'J74-2', 'J74-3', 'J74-4', 'J74-5', 'J74-6']) expect(jobs, j).toContain(`**${j}**`);
    expect(jobs).toMatch(/predictions \(written before any run\)/);
    expect(jobs).toMatch(/0 pairs at every stop of every state/);
    const log = n.slice(n.indexOf('## 7. '), n.indexOf('## 8. '));
    expect(log).toMatch(/\*\*FFX only \(Chapter XII, Seymour Omnis\):\*\*/);
    expect(log).toMatch(/\*\*Both games, tooling and records, nothing a player sees:\*\*/);
    const open = n.slice(n.indexOf('## 9. '), n.indexOf('## 10. '));
    expect(open).toMatch(/R72-1 stays open for today's HUD/);
  });
});

describe('the new module names no folder of the build machine and is a small file', () => {
  const src = readFileSync(resolve('src/ui/ffx/flagSteer.ts'), 'utf8');

  it('no drive-letter or user-profile path, no scratch folder name', () => {
    expect(findLocalPaths(src)).toEqual([]);
    expect(/pyrefly-scratch/i.test(src)).toBe(false);
  });

  it('is under the house limit of 400 lines', () => {
    expect((src.match(/\n/g) ?? []).length).toBeLessThan(400);
  });
});
