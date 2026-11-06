// @vitest-environment jsdom
/**
 * **The Fallen Maesters' prep tip fits the band it is shown in** (FFX-2 only: the hidden Chapter 30; the release 74 browser read MA-10, the driver's decision 219v item 5, 2026-11-03; the line model recalibrated in the
 * release 75 second code pass, the driver's decision 3).
 *
 * The read: the prep card's TIP was ten lines in a briefing column that shows about five at 1600 x 900, so the text was cut mid-line until the player scrolled with PgDn; the phone's stacked card (the full height, the page
 * scrolls) was not clipped. The fix is the chapter's short tip (`data/chapter-prep-tips.ts`): a short form the desktop card shows (from 600 px up), while the full `tip` stays for the pause screen's prose and the phone, which have the room. No new
 * screen, no layout change, nothing for any other chapter (their markup is byte for byte what it was; since job TIP-1 of release 75 nine more chapters have a short form, pinned in `prep-tip-short-forms.test.ts`).
 *
 * jsdom has no layout, so the budget is a model, and it is the SHARED one (`tests/unit/helpers/prepTipBand.ts`, held to the stylesheets and to the two reads by `prep-tip-band.test.ts`). The first version of this file counted
 * five lines and tested Chapter I against `5 + 1` at 33 characters, which was inconsistent with its own reference: Chapter I's 151-character tip, the card Bailey's screenshots are taken on at 1600 x 900, is six lines at 33
 * and five from 34, so the model is now 34 characters a line at 1600 x 900 (the narrowest width that agrees with both the ten-line read and the reference), the room is the stack's (5.1 lines there, 5.8 at 2000 x 1012,
 * 4.2 at 1440 x 810, each for three one-line objectives), and the reference must FIT, not fit with a line to spare. At 1440 x 810, the thinnest supported desktop, the model says even the short tip is cut (six lines in 4.2):
 * that is not fixed here (nothing else is shortened either), it is job TIP-1 in `docs/handoff/r75-boss-art.md`.
 * Mutation: dropping the short tip (or lengthening it past five lines) fails the budget tests; showing it on the phone, or dropping the full tip, fails the phone tests.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { FALLEN_MAESTERS_META } from '../../../src/data/chapter-meta-ffx2-fallen-maesters.ts';
import { PREP_TIPS, prepTipFor } from '../../../src/data/chapter-prep-tips.ts';
import { FALLEN_MAESTERS_ID } from '../../../src/data/fallen-maesters-ids.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { tipHtml } from '../../../src/ui/common/chapterPanel.ts';
import { makeChapterPanel } from '../../../src/ui/ffx/party-prep/ChapterPanel.ts';
import { bandAt, shownTip, tipFit, wrapLines } from '../helpers/prepTipBand.ts';

/** Chapter I's tip, the longest that the card is known to hold at 1600 x 900 (Bailey's own screenshots): the length ceiling. */
const REFERENCE_CHARS = 151;

const meta = FALLEN_MAESTERS_META;
const short = prepTipFor(FALLEN_MAESTERS_ID)!;
const chapter1 = getChapterMeta('seymour-flux')!;

describe('the model reproduces the browser read (MA-10) and the reference card', () => {
  it('the full tip (320 characters) is ten lines wherever the model is 33 to 38 characters wide, and more below that: the read is the model\'s', () => {
    expect(meta.tip).toHaveLength(320);
    for (const cpl of [33, 34, 35, 36, 37, 38]) expect(wrapLines(meta.tip, cpl), `${cpl} characters a line`).toBe(10);
    expect(wrapLines(meta.tip, 32)).toBeGreaterThan(10);
  });

  it('Chapter I\'s tip (151 characters), the card Bailey\'s screenshots are taken on, FITS the band at 1600 x 900: it is the length ceiling, and the model has to agree that it fits', () => {
    expect(chapter1.tip).toHaveLength(REFERENCE_CHARS);
    const fit = tipFit(chapter1, 1600, 900);
    expect(fit.fits, `${fit.lines} lines in ${fit.room.toFixed(2)}`).toBe(true);
    expect(fit.lines).toBe(5);
  });
});

describe('the short form fits (1600 x 900 is the binding case; 2000 x 1012 has more room)', () => {
  it('is no longer than Chapter I\'s tip and fits the band at 1600 x 900 and at 2000 x 1012 (mutation: the full tip fails)', () => {
    expect(short.length).toBeLessThanOrEqual(REFERENCE_CHARS);
    for (const [w, h] of [[1600, 900], [2000, 1012]] as const) {
      const fit = tipFit(meta, w, h, short);
      expect(fit.fits, `${w} x ${h}: ${fit.lines} lines in ${fit.room.toFixed(2)}`).toBe(true);
    }
    expect(tipFit(meta, 1600, 900, short).lines).toBe(5);
  });

  it('holds for every width the reads allow (34 to 37 characters at 1600 x 900), not only the model\'s own', () => {
    for (const cpl of [34, 35, 36, 37]) expect(wrapLines(short, cpl), `${cpl} characters a line`).toBeLessThanOrEqual(5);
  });

  it('what the desktop card shows (the short form, or the tip where a chapter has none) fits for the Maesters; the full tip alone does not (the read)', () => {
    expect(tipFit(meta, 1600, 900, shownTip(meta)).fits).toBe(true);
    expect(shownTip(meta)).toBe(short);
    expect(tipFit(meta, 1600, 900).fits).toBe(false);
    expect(tipFit(meta, 1600, 900).lines).toBe(10);
  });

  it('at 1440 x 810, the thinnest supported desktop, the model says the room is 4.2 lines against the short tip\'s six: recorded, not fixed here (job TIP-1 reads it)', () => {
    const fit = tipFit(meta, 1440, 810, short);
    expect(bandAt(1440, 810).compress).toBe(false);
    expect([fit.lines, Number(fit.room.toFixed(1))]).toEqual([6, 4.2]);
  });
});

describe('only the chapter\'s own sourced words (rule 6)', () => {
  /** The words of a sentence, a possessive read as its noun ("Paine’s" is Paine). */
  const words = (text: string): string[] => text.toLowerCase().replace(/’s\b/g, '').replace(/[^a-z0-9 -]/g, ' ').split(/\s+/).filter(Boolean);

  it('every word of the short form is a word of the full tip: nothing is added, the card says less', () => {
    const full = new Set(words(meta.tip));
    expect(words(short).filter((w) => !full.has(w))).toEqual([]);
  });

  it('keeps the three facts the card must say that nothing else on the screen does: the hit that cracks the shell, the gates, the Dark Knight', () => {
    expect(short).toContain('about twenty thousand');
    expect(short).toContain('The End’s red and green gates');
    expect(short).toContain('Dark Knight');
    expect(short).toContain('Concherer');
  });

  it('the full tip is unchanged, word for word: the pause screen and the phone show what they showed', () => {
    expect(meta.tip).toBe(
      'Each floor is a fresh fight, and the glyph between them mends you. Concherer’s shell breaks on one hit of about twenty thousand, ' +
        'which only Paine’s Break Damage Limit reaches: Change her across The End’s red and green gates and back to the Dark Knight first. ' +
        'Chac turns girls to stone, and a blow on stone destroys them.',
    );
  });
});

describe('the markup: both forms in the prep card, one in the pause screen, nothing new for any other chapter', () => {
  it('the prep card\'s block holds the full tip (--full) and the short one (--short); the pause screen\'s block is the single span it always was', () => {
    const prep = tipHtml(meta, { prep: true });
    expect(prep).toContain('cpanel__tip-text cpanel__tip-text--full');
    expect(prep).toContain('cpanel__tip-text cpanel__tip-text--short');
    expect(prep).toContain(meta.tip.replace(/’/g, '’'));
    expect(prep).toContain(short);
    const pause = tipHtml(meta);
    expect(pause).toBe(`<div class="cpanel__tip"><span class="cpanel__tip-label">TIP</span><span class="cpanel__tip-text">${meta.tip}</span></div>`);
    expect(pause).not.toContain('--short');
  });

  it('a chapter without a short form has its prep block byte for byte its pause block (the prep card is shared: both games); since job TIP-1 the table holds the Maesters and nine more (`prep-tip-short-forms.test.ts` pins them)', () => {
    const withForm = Object.keys(PREP_TIPS);
    expect(withForm, 'the Maesters is in the table, with the nine of TIP-1').toContain(FALLEN_MAESTERS_ID);
    expect(withForm).toHaveLength(10);
    const others = [...CHAPTER_META, ...UNLISTED_CHAPTER_META].filter((m) => !withForm.includes(m.id));
    expect(others.length).toBeGreaterThan(20);
    for (const m of others) {
      expect(prepTipFor(m.id), m.id).toBeUndefined();
      expect(tipHtml(m, { prep: true }), m.id).toBe(tipHtml(m));
    }
  });

  it('the real prep panel mounts the Maesters with both spans in its briefing column, and a chapter without a short form with the one span', () => {
    const maesters = getChapter(FALLEN_MAESTERS_ID)!;
    const el = document.createElement('div');
    makeChapterPanel('ffx2').mount(el, { chapter: maesters, memberId: 'yuna' });
    const brief = el.querySelector('.prepchap__col--brief')!;
    expect(brief.querySelector('.cpanel__tip-text--full')?.textContent).toBe(meta.tip);
    expect(brief.querySelector('.cpanel__tip-text--short')?.textContent).toBe(short);

    const plain = document.createElement('div');
    makeChapterPanel('ffx').mount(plain, { chapter: getChapter('seymour-flux')!, memberId: 'tidus' });
    expect(plain.querySelectorAll('.cpanel__tip-text')).toHaveLength(1);
    expect(plain.querySelector('.cpanel__tip-text--short')).toBeNull();
  });
});

describe('the stylesheets: the desktop card shows the short form, the phone is untouched', () => {
  const css = (file: string): string => readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');
  const tab = css('src/ui/ffx/party-prep/chapter-panel-tab.css');
  const phone = css('src/ui/ffx/party-prep/chapter-panel-phone.css');

  it('hides the short form by default and swaps the two from 600 px up (the phone layout is under 600 px)', () => {
    expect(tab).toMatch(/\.prepchap__cols \.cpanel__tip-text--short \{\s*display: none;\s*\}/);
    const swap = /@media \(min-width: 600px\) \{\s*\.prepchap__cols \.cpanel__tip-text--full \{\s*display: none;\s*\}\s*\.prepchap__cols \.cpanel__tip-text--short \{\s*display: block;\s*\}\s*\}/;
    expect(tab).toMatch(swap);
    expect(phone).toContain('@media (max-width: 599px)');
  });

  it('does not touch the phone: its sheet knows neither form, so the stacked card shows the full tip at its full height', () => {
    expect(phone).not.toContain('tip-text--short');
    expect(phone).not.toContain('tip-text--full');
    expect(phone).not.toMatch(/cpanel__tip-text\s*\{[^}]*display:\s*none/);
  });
});
