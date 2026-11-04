// @vitest-environment jsdom
/**
 * **The Fallen Maesters' prep tip fits the band it is shown in** (FFX-2 only: the hidden Chapter 30; the release 74 browser read MA-10, the driver's decision 219v item 5, 2026-11-03).
 *
 * The read: the prep card's TIP was ten lines in a briefing column that shows about five at 1600 x 900, so the text was cut mid-line until the player scrolled with PgDn; the phone's stacked card (the full height, the page
 * scrolls) was not clipped. The fix is the chapter's short tip (`data/chapter-prep-tips.ts`): a short form the desktop card shows (from 600 px up), while the full `tip` stays for the pause screen's prose and the phone, which have the room. No new
 * screen, no layout change, nothing for any other chapter (their markup is byte for byte what it was).
 *
 * jsdom has no layout, so the budget is a model calibrated on the browser read itself: a greedy word wrap at a characters-per-line width. The full 320-character tip is TEN lines there, and the model gives ten lines for
 * any width from 33 to 38 characters, so 33 (the narrowest that reproduces the read) is the conservative width; the card shows five lines. The reference that the card holds is Chapter I's tip, 151 characters, the card
 * Bailey's screenshots are taken at 1600 x 900 on. At 2000 x 1012 the band is taller in screen pixels and the type at its floor the same size, so the budget is looser there than at 1600 x 900.
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

/** Greedy word wrap at `cpl` characters a line: the number of lines `text` takes. */
function lines(text: string, cpl: number): number {
  let count = 0;
  let line = '';
  for (const word of text.split(' ')) {
    if (line === '') line = word;
    else if ((line + ' ' + word).length <= cpl) line += ' ' + word;
    else {
      count++;
      line = word;
    }
  }
  return line === '' ? count : count + 1;
}

/** The narrowest width at which the model reproduces the MA-10 read (ten lines for the full tip), and the lines the band shows. */
const CPL = 33;
const BAND_LINES = 5;
/** Chapter I's tip, the longest that the card is known to hold at 1600 x 900 (Bailey's own screenshots): the length ceiling. */
const REFERENCE_CHARS = 151;

const meta = FALLEN_MAESTERS_META;
const short = prepTipFor(FALLEN_MAESTERS_ID)!;

describe('the model reproduces the browser read (MA-10)', () => {
  it('the full tip (320 characters) is ten lines wherever the model is 33 to 38 characters wide, and more below that: the read is the model\'s', () => {
    expect(meta.tip).toHaveLength(320);
    for (const cpl of [33, 34, 35, 36, 37, 38]) expect(lines(meta.tip, cpl), `${cpl} characters a line`).toBe(10);
    expect(lines(meta.tip, 32)).toBeGreaterThan(10);
  });

  it('Chapter I\'s tip (151 characters), the card Bailey\'s screenshots are taken on, is the length ceiling: it wraps to no more lines than the band shows plus one', () => {
    expect(getChapterMeta('seymour-flux')!.tip).toHaveLength(REFERENCE_CHARS);
    expect(lines(getChapterMeta('seymour-flux')!.tip, CPL)).toBeLessThanOrEqual(BAND_LINES + 1);
  });
});

describe('the short form fits (1600 x 900 is the binding case; 2000 x 1012 has more room)', () => {
  it('is no longer than Chapter I\'s tip and wraps to the five lines the band shows at the narrowest width the read allows (mutation: the full tip fails)', () => {
    expect(short.length).toBeLessThanOrEqual(REFERENCE_CHARS);
    expect(lines(short, CPL)).toBeLessThanOrEqual(BAND_LINES);
    for (const cpl of [34, 36, 38]) expect(lines(short, cpl), `${cpl} characters a line`).toBeLessThanOrEqual(BAND_LINES);
  });

  it('what the desktop card shows (the short form, or the tip where a chapter has none) fits for the Maesters; the full tip alone does not (the read)', () => {
    expect(lines(prepTipFor(meta.id) ?? meta.tip, CPL)).toBeLessThanOrEqual(BAND_LINES);
    expect(lines(meta.tip, CPL)).toBeGreaterThan(BAND_LINES);
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

  it('no other chapter has a short form, so every other chapter\'s prep block is byte for byte its pause block (the prep card is shared: both games)', () => {
    const others = [...CHAPTER_META, ...UNLISTED_CHAPTER_META].filter((m) => m.id !== FALLEN_MAESTERS_ID);
    expect(Object.keys(PREP_TIPS), 'the table has the Maesters alone').toEqual([FALLEN_MAESTERS_ID]);
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
