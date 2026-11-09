/**
 * **The line model of the prep card's briefing column, held to the stylesheets and to the two browser reads** (shared by both games: the party prep's CHAPTER tab is one component; `tests/unit/helpers/prepTipBand.ts`;
 * release 75 second code pass, the driver's decision 3, 2026-11-03). The model is an estimate until a browser reads it (job TIP-1, `docs/handoff/r75-boss-art.md`), so this file pins the three things that keep it honest:
 *
 * 1. **The geometry is the CSS's.** Every spacing, line height, type token and the band itself is read back out of `chapter-panel.css` and `chapter-panel-tab.css` and compared with the helper's constants, so a
 *    stylesheet change fails here instead of leaving the model stale.
 * 2. **The calibration agrees with what was seen.** The Maesters' 320-character tip is ten lines at 1600 x 900 (MA-10) at any width from 33 to 38 characters; Chapter I's 151-character tip is known to sit in the card
 *    unclipped there, and is five lines from 34 characters but six at 33, so the model uses 34 (the narrowest width that agrees with both). The room at 1600 x 900 is 5.1 lines, "about five" as the read said; the
 *    checker's 6.4 and 7.2 leave the OBJECTIVES head row out of the stack (this file shows the head is exactly the difference).
 * 3. **The list of tips the model says overflow is the list the handoff carries** (job TIP-1), so changing a chapter's tip without rereading the handoff fails here. Nothing is shortened by this file: a browser read decides.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { CHAPTERS, EXPERIMENT_CHAPTERS, UNLISTED_CHAPTERS } from '../../../src/data/encounters.ts';
import { prepTipFor } from '../../../src/data/chapter-prep-tips.ts';
import {
  BAND,
  COMPRESS,
  CPL_REFERENCE,
  FONT,
  HEAD_BORDER,
  HEAD_LINE_HEIGHT,
  OBJECTIVE_EXTRA_CHARS,
  ROOMY,
  TIP_FONT_REFERENCE,
  TIP_VIEWPORTS,
  TYPE_FLOOR_PX,
  bandAt,
  shownTip,
  tipFit,
  tipLines,
  tipRoom,
  wrapLines,
} from '../helpers/prepTipBand.ts';

const css = (file: string): string => readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');
const panel = css('src/ui/common/chapter-panel.css');
const tab = css('src/ui/ffx/party-prep/chapter-panel-tab.css');

/** The body of the first rule that starts with `selector {` at or after `from`. */
function ruleBody(text: string, selector: string, from = 0): string {
  const at = text.indexOf(`\n${selector} {`, from);
  expect(at, `${selector} is in the stylesheet`).toBeGreaterThanOrEqual(0);
  return text.slice(at, text.indexOf('}', at));
}
/** The first number of a declaration's value: `margin-top: calc(5.33 * var(--cp-u))` is 5.33, `padding: 2.5px 3.5px` is 2.5, `line-height: 1.45` is 1.45. */
function num(body: string, prop: string): number {
  const m = new RegExp(`\\n\\s*${prop}:\\s*(?:calc\\()?\\s*(-?[\\d.]+)`).exec(body);
  expect(m, `${prop} in ${body.slice(0, 40)}`).not.toBeNull();
  return Number(m![1]);
}

describe('the model\'s geometry is read back from the stylesheets', () => {
  it('the band: 120 grid px with 8.89 of padding top and bottom, and the 14 px type floor', () => {
    const prepchap = ruleBody(tab, '.prepchap');
    expect(num(prepchap, 'height')).toBe(BAND.height);
    expect(num(prepchap, 'padding')).toBe(BAND.pad);
    expect(panel).toContain(`--cp-fs-floor: calc(${TYPE_FLOOR_PX}px / var(--lb-scale, 1));`);
  });

  it('the type tokens: tip 5.11, body 5.33, head 4.89 grid px before the floor', () => {
    expect(panel).toMatch(new RegExp(`--cp-fs-tip: max\\(calc\\(${FONT.tip} \\* var\\(--cp-u\\)\\), var\\(--cp-fs-floor\\)\\)`));
    expect(panel).toMatch(new RegExp(`--cp-fs-body: max\\(calc\\(${FONT.body} \\* var\\(--cp-u\\)\\), var\\(--cp-fs-floor\\)\\)`));
    expect(panel).toMatch(new RegExp(`--cp-fs-head: max\\(calc\\(${FONT.head} \\* var\\(--cp-u\\)\\), var\\(--cp-fs-floor\\)\\)`));
  });

  it('the roomy spacing (1440 x 810 and up): the brief column, the head, the objectives and the tip block', () => {
    expect(num(ruleBody(tab, '.prepchap__col--brief'), 'padding-top')).toBe(ROOMY.padTop);
    expect(num(ruleBody(panel, '.cpanel__head'), 'padding-bottom')).toBe(ROOMY.headPad);
    expect(num(ruleBody(panel, '.cpanel__head'), 'border-bottom')).toBe(HEAD_BORDER);
    expect(num(ruleBody(panel, '.cpanel__objectives'), 'margin')).toBe(ROOMY.objMargin);
    expect(num(ruleBody(panel, '.cpanel__objectives'), 'gap')).toBe(ROOMY.objGap);
    expect(num(ruleBody(panel, '.cpanel__objective'), 'line-height')).toBe(ROOMY.objLineHeight);
    expect(num(ruleBody(panel, '.cpanel__tip'), 'margin-top')).toBe(ROOMY.tipMargin);
    expect(num(ruleBody(panel, '.cpanel__tip'), 'padding')).toBe(ROOMY.tipPad);
    expect(num(ruleBody(panel, '.cpanel__tip-text'), 'line-height')).toBe(ROOMY.tipLineHeight);
  });

  it('the compress spacing, and the query that turns it on (600 up to 1439 wide, or 809 high or less)', () => {
    const query = '@media (min-width: 600px) and (max-width: 1439px), (min-width: 600px) and (max-height: 809px) {';
    const at = tab.indexOf(query);
    expect(at, 'the compress media query is in the tab stylesheet').toBeGreaterThanOrEqual(0);
    const block = tab.slice(at, tab.indexOf('\n}\n', at));
    const inner = (selector: string): string => block.slice(block.indexOf(`  ${selector} {`), block.indexOf('}', block.indexOf(`  ${selector} {`))).replace(/\n  /g, '\n');
    const rule = (selector: string, prop: string): number => num(`\n${inner(selector)}`, prop);
    expect(rule('.prepchap__col--brief', 'padding-top')).toBe(COMPRESS.padTop);
    expect(rule('.prepchap__cols .cpanel__head', 'padding-bottom')).toBe(COMPRESS.headPad);
    expect(rule('.prepchap__cols .cpanel__objectives', 'margin-top')).toBe(COMPRESS.objMargin);
    expect(rule('.prepchap__cols .cpanel__objectives', 'gap')).toBe(COMPRESS.objGap);
    expect(rule('.prepchap__cols .cpanel__objective', 'line-height')).toBe(COMPRESS.objLineHeight);
    expect(rule('.prepchap__cols .cpanel__tip', 'margin-top')).toBe(COMPRESS.tipMargin);
    expect(rule('.prepchap__cols .cpanel__tip', 'padding')).toBe(COMPRESS.tipPad);
    expect(rule('.prepchap__cols .cpanel__tip-text', 'line-height')).toBe(COMPRESS.tipLineHeight);
    // the query's edges, as the helper reads them
    expect([bandAt(1439, 900).compress, bandAt(1440, 810).compress, bandAt(1440, 809).compress, bandAt(599, 900).compress, bandAt(1280, 720).compress]).toEqual([true, false, true, false, true]);
  });
});

describe('the model agrees with the browser reads', () => {
  const maesters = getChapterMeta('ffx2-fallen-maesters')!;
  const chapter1 = getChapterMeta('seymour-flux')!;

  it('the Maesters\' 320-character tip is ten lines at any width from 33 to 38 characters (MA-10), and the model\'s width is inside that range', () => {
    expect(maesters.tip).toHaveLength(320);
    for (const cpl of [33, 34, 35, 36, 37, 38]) expect(wrapLines(maesters.tip, cpl), `${cpl} characters a line`).toBe(10);
    expect(CPL_REFERENCE).toBeGreaterThanOrEqual(33);
    expect(CPL_REFERENCE).toBeLessThanOrEqual(38);
  });

  it('Chapter I\'s 151-character tip, known to sit in the card at 1600 x 900, is six lines at 33 characters but five from 34: the model uses 34, the narrowest width that agrees with both reads', () => {
    expect(chapter1.tip).toHaveLength(151);
    expect(wrapLines(chapter1.tip, 33)).toBe(6);
    for (const cpl of [34, 35, 36, 37]) expect(wrapLines(chapter1.tip, cpl), `${cpl} characters a line`).toBe(5);
    expect(CPL_REFERENCE).toBe(34);
    expect(bandAt(1600, 900).tipCpl).toBe(CPL_REFERENCE);
    expect(bandAt(1600, 900).tipFont).toBeCloseTo(TIP_FONT_REFERENCE, 6); // the 14 px floor on a 2.5 stage
  });

  it('an objective wraps 8 characters wider than the tip: the smallest that keeps Chapter I\'s 42-character first objective on one line at 1600 x 900, where the card is known to hold its tip in five', () => {
    expect(OBJECTIVE_EXTRA_CHARS).toBe(8);
    expect(chapter1.objectives[0]!.label).toHaveLength(42);
    const band = bandAt(1600, 900);
    expect(band.objectiveCpl).toBe(CPL_REFERENCE + OBJECTIVE_EXTRA_CHARS);
    expect(wrapLines(chapter1.objectives[0]!.label, band.objectiveCpl)).toBe(1);
    expect(wrapLines(chapter1.objectives[0]!.label, band.objectiveCpl - 1)).toBe(2); // one character narrower and the reference would lose a line of tip
  });

  it('the room is 5.1 lines at 1600 x 900 ("about five", the read), 5.8 at 2000 x 1012 and 4.2 at 1440 x 810, for three one-line objectives', () => {
    const oneLine = ['a', 'b', 'c'];
    expect(tipRoom(bandAt(1600, 900), oneLine)).toBeCloseTo(5.1, 1);
    expect(tipRoom(bandAt(2000, 1012), oneLine)).toBeCloseTo(5.84, 1);
    expect(tipRoom(bandAt(1440, 810), oneLine)).toBeCloseTo(4.23, 1);
    expect(tipRoom(bandAt(2000, 1012), oneLine)).toBeGreaterThan(tipRoom(bandAt(1600, 900), oneLine)); // the band is taller in screen pixels and the type at its floor the same size
  });

  it('the checker\'s 6.4 and 7.2 are this stack without the OBJECTIVES head row: the head is exactly the difference', () => {
    const oneLine = ['a', 'b', 'c'];
    for (const [w, h, checker] of [[1600, 900, 6.4], [2000, 1012, 7.2]] as const) {
      const band = bandAt(w, h);
      const head = (HEAD_LINE_HEIGHT * band.headFont + band.spacing.headPad + HEAD_BORDER) / (band.spacing.tipLineHeight * band.tipFont);
      expect(tipRoom(band, oneLine) + head, `${w} x ${h}`).toBeCloseTo(checker, 1);
      expect(head).toBeGreaterThan(1.2);
    }
  });

  it('Chapter I fits at 1600 x 900 (it is the reference), the Maesters\' whole tip does not (the read), and its short form does at 1600 x 900 and 2000 x 1012', () => {
    expect(tipFit(chapter1, 1600, 900).fits).toBe(true);
    expect(tipFit(maesters, 1600, 900)).toMatchObject({ lines: 10, fits: false });
    expect(shownTip(maesters)).toBe(prepTipFor(maesters.id));
    expect(tipFit(maesters, 1600, 900, shownTip(maesters)).fits).toBe(true);
    expect(tipFit(maesters, 2000, 1012, shownTip(maesters)).fits).toBe(true);
  });

  it('at 1440 x 810, the thinnest supported desktop, the model says the room is 4.2 lines: the Maesters\' short tip (6 lines) is expected to be cut there, as is Chapter I\'s (5 and a wrapped objective); TIP-1 reads it', () => {
    const short = tipFit(maesters, 1440, 810, shownTip(maesters));
    expect(short.lines).toBe(6);
    expect(short.room).toBeLessThan(5);
    expect(tipFit(chapter1, 1440, 810).fits).toBe(false);
  });

  it('the line count only grows as the viewport narrows (the type floor binds): no chapter has fewer lines at 1440 x 810 than at 1600 x 900, or at 1600 x 900 than at 2000 x 1012', () => {
    for (const meta of [...CHAPTER_META, ...UNLISTED_CHAPTER_META]) {
      const [thin, mid, wide] = TIP_VIEWPORTS.map((v) => tipLines(bandAt(v.width, v.height), meta.tip));
      expect(thin!, meta.id).toBeGreaterThanOrEqual(mid!);
      expect(mid!, meta.id).toBeGreaterThanOrEqual(wide!);
    }
  });
});

describe('the tips the model says overflow at 1600 x 900 are the ones job TIP-1 lists (nothing is shortened here)', () => {
  const all = [...CHAPTER_META, ...UNLISTED_CHAPTER_META];
  const handoff = css('docs/handoff/r75-boss-art.md');
  const start = handoff.indexOf('### Browser job TIP-1');
  const end = handoff.indexOf('\n### ', start + 5);
  const section = start < 0 ? '' : handoff.slice(start, end < 0 ? undefined : end);

  it('every listed and hidden chapter is put through the model (as many as the chapter registries hold: the count follows them, it was a literal that every new hidden chapter moved), each with three objectives', () => {
    // every chapter the registries hold has its record in the model, the FF7 Guard Scorpion (no pause-screen record) alone excepted: the ids are compared, so the count follows the registries
    const registered = [...CHAPTERS, ...UNLISTED_CHAPTERS, ...EXPERIMENT_CHAPTERS].map((c) => c.id).filter((id) => id !== 'ff7-guard-scorpion' && id !== 'ff7-jenova-life'); // the two FF7 chapters have no pause record (FF7 has no pause metadata)
    expect(all.map((m) => m.id).sort()).toEqual(registered.sort());
    for (const meta of all) expect(meta.objectives, meta.id).toHaveLength(3);
  });

  it('the handoff\'s TIP-1 section exists and names every chapter whose full tip does not fit at 1600 x 900 (the Maesters among them, already answered by its short form), and says nothing was shortened', () => {
    expect(section.length, 'the TIP-1 section is in the handoff').toBeGreaterThan(500);
    const overflowing = all.filter((m) => !tipFit(m, 1600, 900).fits).map((m) => m.id);
    expect(overflowing.length).toBeGreaterThan(5);
    for (const id of overflowing) expect(section, id).toContain(`\`${id}\``);
    expect(section).toMatch(/do not shorten|not shortened|nothing is shortened/i);
  });

  it('and no chapter that fits at 1600 x 900 is in its overflow table (the table is the model\'s list, not a hand-kept one)', () => {
    const table = section.slice(section.indexOf('| id |'), section.indexOf('\n\n', section.indexOf('| id |')));
    const listed = [...table.matchAll(/^\| `([a-z0-9-]+)` \|/gm)].map((m) => m[1]!);
    const overflowing = new Set<string>(all.filter((m) => !tipFit(m, 1600, 900).fits).map((m) => m.id));
    expect(listed.length).toBeGreaterThan(5);
    for (const id of listed) expect(overflowing.has(id), `${id} fits at 1600 x 900 by the model`).toBe(true);
    expect(new Set(listed)).toEqual(overflowing);
  });
});
