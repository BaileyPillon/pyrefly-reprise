// @vitest-environment jsdom
/**
 * **The nine short prep tips of job TIP-1 fit the band the browser read them cut in, and say only their chapter's own words** (release 75, the driver's decision 220a, under Bailey's delegation; the browser read of
 * 2026-11-06, `docs/handoff/r75-boss-art.md` "Browser job TIP-1: the result").
 *
 * The read: the party prep's CHAPTER tab shows the TIP in a fixed band that holds five lines (4.68 where the first objective wraps to two lines) at 1600 x 900, 32 chapters at five viewports. Nine full tips were cut mid-line there:
 * the **FFX** Seymour Natus, Seymour Omnis, Isaaru and Mirror Aeons, and the **FFX-2** Fallen Aeons, Trema, the Den of Woe, the Experiment (hidden) and Tourist Trap (hidden). The Fallen Maesters' short form (release 74 MA-10) fit, and so
 * did Biran and Yenke, which the line model had flagged and the browser did not cut. Each of the nine now has a short form in `data/chapter-prep-tips.ts`, shown by the desktop card (from 600 px up) beside the whole tip, which the pause
 * screen and the phone keep. Nothing else changed: the card, the CSS and every other chapter's markup are what they were.
 *
 * Two budgets, both asserted. The shared line model (`helpers/prepTipBand.ts`: 34 characters a line, 5.1 lines of room at 1600 x 900, 5.84 at 2000 x 1012, 4.17 for the Experiment) is the pessimistic one, so a form that fits it
 * fits the browser; the browser's own measure (35 characters a line, 5.61 lines of room, 4.68 for the Experiment) is asserted as well. Rule 6: a short form uses only words of its chapter's tip and in the tip's own order.
 * Game case (rule 14): the nine are single-game chapters, so each form is that game's only; the prep card is one shared component (the markup tests mount the real panel for the game of each chapter).
 * Mutations: a form lengthened by one clause fails the budget tests; a word that is not the tip's fails the words test; dropping a form fails the table.
 */
import { describe, expect, it } from 'vitest';
import { CHAPTER_META, UNLISTED_CHAPTER_META, getChapterMeta } from '../../../src/data/chapter-meta.ts';
import { PREP_TIPS, prepTipFor } from '../../../src/data/chapter-prep-tips.ts';
import { getChapter } from '../../../src/data/encounters.ts';
import { tipHtml } from '../../../src/ui/common/chapterPanel.ts';
import { makeChapterPanel } from '../../../src/ui/ffx/party-prep/ChapterPanel.ts';
import { bandAt, shownTip, tipFit, tipRoom, wrapLines } from '../helpers/prepTipBand.ts';

/** One row per chapter of the TIP-1 list: the game, the whole tip's length, the short form's length, and the read's lines for the whole tip at 1600 x 900 (the browser's count, with the band's room). */
interface Row {
  readonly id: string;
  readonly game: 'FFX' | 'FFX-2';
  readonly fullChars: number;
  readonly shortChars: number;
  /** Lines the whole tip took in the browser at 1600 x 900, and the room (lines) the band had. */
  readonly readLines: number;
  readonly readRoom: number;
  /** Words of the whole tip that the short form leaves out, in the order they stand: the clause that went (the test checks each is a clause of the tip, so the record cannot drift from the data). */
  readonly dropped: readonly string[];
}
const ROWS: readonly Row[] = [
  { id: 'seymour-natus', game: 'FFX', fullChars: 195, shortChars: 162, readLines: 6, readRoom: 5.62, dropped: ['Soften a stone guardian at once,'] },
  { id: 'ffx2-fallen-aeons', game: 'FFX-2', fullChars: 215, shortChars: 154, readLines: 7, readRoom: 5.62, dropped: ['of them', 'that Pain leaves; its stat losses stay for the fight'] },
  { id: 'seymour-omnis', game: 'FFX', fullChars: 180, shortChars: 137, readLines: 6, readRoom: 5.62, dropped: ['Each disc casts its own colour at him, and'] },
  { id: 'ffx2-trema', game: 'FFX-2', fullChars: 197, shortChars: 158, readLines: 6, readRoom: 5.62, dropped: [': no status, no stat change, no Gravity'] },
  { id: 'isaaru-via-purifico', game: 'FFX', fullChars: 185, shortChars: 132, readLines: 6, readRoom: 5.62, dropped: ['One you lose stays down for the rest of the contest.'] },
  { id: 'ffx2-den-of-woe', game: 'FFX-2', fullChars: 243, shortChars: 148, readLines: 7, readRoom: 5.62, dropped: ['Nothing heals between the three shades.', 'Near the end', ', 5,000 to all, once', 'from half his health,'] },
  { id: 'mirror-aeons', game: 'FFX', fullChars: 216, shortChars: 140, readLines: 7, readRoom: 5.62, dropped: ['Two sisters, no joint attack, and every fallen member costs a Phoenix Down:'] },
  { id: 'ffx2-masterpiece-theatre', game: 'FFX-2', fullChars: 145, shortChars: 121, readLines: 5, readRoom: 4.68, dropped: ['and settle your healing'] },
  { id: 'ffx2-tourist-trap', game: 'FFX-2', fullChars: 184, shortChars: 145, readLines: 6, readRoom: 5.62, dropped: [', and cure the Poison his Kozuka leaves'] },
];
const IDS = ROWS.map((r) => r.id);
/** Chapters whose short form the TIP-1 read did NOT ask for but the line model would have: Biran and Yenke fit in the browser (5 lines in 5.61). */
const FITS_IN_THE_BROWSER = ['biran-yenke'] as const;
/** The browser's measure at 1600 x 900: characters a line (one chapter still off, the read says), and the lines of room for the text itself. */
const BROWSER_CPL = 35;

const metaOf = (id: string) => getChapterMeta(id)!;
/** The words of a text, a possessive read as its noun, quotes of either kind dropped: the tip's words, as the Maesters' test reads them. */
const words = (text: string): string[] => text.toLowerCase().replace(/[’']s\b/g, '').replace(/[^a-z0-9 -]/g, ' ').split(/\s+/).filter(Boolean);
/** Is `short`'s word list the tip's, in the tip's order, with words left out and none added? */
function isInOrderSubsetOf(short: string, full: string): boolean {
  const s = words(short);
  let at = 0;
  for (const w of words(full)) if (at < s.length && s[at] === w) at++;
  return at === s.length;
}

describe('the table: the nine of TIP-1 and the Maesters, and nothing else', () => {
  it('has a short form for the Fallen Maesters and exactly the nine chapters the browser read cut at 1600 x 900', () => {
    expect(Object.keys(PREP_TIPS).sort()).toEqual([...IDS, 'ffx2-fallen-maesters'].sort());
    expect(ROWS).toHaveLength(9);
  });

  it('every one of the nine is a real chapter of one game, listed or hidden (the game the table says), and the table\'s ids are all chapters', () => {
    const all = new Map<string, unknown>([...CHAPTER_META, ...UNLISTED_CHAPTER_META].map((m) => [m.id, m]));
    for (const row of ROWS) {
      expect(all.has(row.id), row.id).toBe(true);
      expect(metaOf(row.id).gameLabel, row.id).toBe(row.game);
      expect(getChapter(row.id), row.id).toBeDefined();
    }
    for (const id of Object.keys(PREP_TIPS)) expect(all.has(id), id).toBe(true);
    // four FFX and five FFX-2 (the Maesters is a sixth FFX-2 form, pinned in its own file)
    expect(ROWS.filter((r) => r.game === 'FFX').map((r) => r.id)).toEqual(['seymour-natus', 'seymour-omnis', 'isaaru-via-purifico', 'mirror-aeons']);
    expect(ROWS.filter((r) => r.game === 'FFX-2')).toHaveLength(5);
  });

  it('a chapter the browser read showed fitting has no short form: its card is what it was (Biran and Yenke: the model said cut, the browser read five lines in 5.61)', () => {
    for (const id of FITS_IN_THE_BROWSER) {
      expect(prepTipFor(id), id).toBeUndefined();
      expect(tipHtml(metaOf(id), { prep: true }), id).toBe(tipHtml(metaOf(id)));
    }
  });

  it('every chapter without a short form renders the same block in the prep card as in the pause screen (the prep card is shared by both games)', () => {
    const without = [...CHAPTER_META, ...UNLISTED_CHAPTER_META].filter((m) => prepTipFor(m.id) === undefined);
    expect(without).toHaveLength([...CHAPTER_META, ...UNLISTED_CHAPTER_META].length - 10); // 32 - 10 at the release; each hidden chapter added after it brings its own (fitting) tip
    for (const m of without) expect(tipHtml(m, { prep: true }), m.id).toBe(tipHtml(m));
  });
});

describe('the whole tips are unchanged: the pause screen and the phone show what they showed', () => {
  it.each(ROWS)('$id: the full tip is $fullChars characters and is longer than its short form', (row) => {
    const meta = metaOf(row.id);
    expect(meta.tip).toHaveLength(row.fullChars);
    expect(meta.tip.length).toBeGreaterThan(prepTipFor(row.id)!.length);
  });

  it('the pause screen\'s block is the single span it always was, for all nine', () => {
    for (const id of IDS) {
      const pause = tipHtml(metaOf(id));
      expect(pause, id).not.toContain('--short');
      expect(pause, id).not.toContain('--full');
      expect(pause.match(/class="cpanel__tip-text"/g), id).toHaveLength(1);
    }
  });
});

describe('the short forms fit the band (1600 x 900 is the binding case; 2000 x 1012 has more room)', () => {
  it.each(ROWS)('$id: the model fits it at 1600 x 900 and at 2000 x 1012, and the whole tip does not (the reason it has one)', (row) => {
    const meta = metaOf(row.id);
    const short = prepTipFor(row.id)!;
    expect(short).toHaveLength(row.shortChars);
    for (const [w, h] of [[1600, 900], [2000, 1012]] as const) {
      const fit = tipFit(meta, w, h, short);
      expect(fit.fits, `${w} x ${h}: ${fit.lines} lines in ${fit.room.toFixed(2)}`).toBe(true);
    }
    expect(tipFit(meta, 1600, 900).fits, 'the whole tip is cut in the model too').toBe(false);
    expect(shownTip(meta)).toBe(short);
  });

  it.each(ROWS)('$id: it holds at every width the reads allow, 34 to 37 characters a line, and at the browser\'s own 35 with the browser\'s own room', (row) => {
    const short = prepTipFor(row.id)!;
    const room = Math.floor(row.readRoom);
    for (const cpl of [34, 35, 36, 37]) expect(wrapLines(short, cpl), `${cpl} characters a line`).toBeLessThanOrEqual(row.id === 'ffx2-masterpiece-theatre' ? 4 : 5);
    expect(wrapLines(short, BROWSER_CPL), 'the browser\'s measure').toBeLessThanOrEqual(room);
    // the read: the whole tip was cut in the browser (lines above the room), by the lines of the table
    expect(row.readLines).toBeGreaterThan(row.readRoom);
  });

  it('the Experiment\'s band holds four lines, not five (its first objective wraps to two), and its form is four lines at every width the reads allow', () => {
    const meta = metaOf('ffx2-masterpiece-theatre');
    const room = tipRoom(bandAt(1600, 900), meta.objectives.map((o) => o.label));
    expect(room).toBeCloseTo(4.17, 1);
    expect(meta.objectives[0]!.label.length).toBeGreaterThan(42); // longer than Chapter I's first objective, which sits on one line
    for (const cpl of [34, 35, 36, 37]) expect(wrapLines(prepTipFor('ffx2-masterpiece-theatre')!, cpl), `${cpl} characters a line`).toBe(4);
  });

  it('the longest form is Natus\'s 162 characters, five lines at every width the reads allow (a line holds fewer than 34 characters only by the model\'s own pessimism, Chapter I\'s 151 being five lines)', () => {
    const longest = Math.max(...ROWS.map((r) => r.shortChars));
    expect(longest).toBe(162);
    expect(prepTipFor('seymour-natus')).toHaveLength(longest);
    for (const id of IDS) expect(prepTipFor(id)!.length, id).toBeLessThanOrEqual(longest);
  });
});

describe('only the chapter\'s own sourced words, in the tip\'s own order (rule 6)', () => {
  it.each(ROWS)('$id: every word of the short form is a word of the whole tip, in its order: nothing is added, the card says less', (row) => {
    const full = metaOf(row.id).tip;
    const short = prepTipFor(row.id)!;
    expect(isInOrderSubsetOf(short, full), `${short}\n  is not an in-order selection of\n  ${full}`).toBe(true);
    expect(words(short).length).toBeLessThan(words(full).length);
  });

  it.each(ROWS)('$id: what it leaves out is what the table says it leaves out (each dropped clause is in the whole tip, none is in the short form)', (row) => {
    const full = metaOf(row.id).tip;
    const short = prepTipFor(row.id)!;
    for (const clause of row.dropped) {
      expect(full, `"${clause}" is in the whole tip`).toContain(clause);
      expect(short, `"${clause}" is left out of the short form`).not.toContain(clause);
    }
  });

  it('the facts each form must keep are in it (the one thing the card says that no other line on the screen does)', () => {
    const keep: Record<string, string[]> = {
      'seymour-natus': ['no Defense', 'Haste only Tidus and Auron', 'send Bahamut alone', 'Rikku Reflect Natus'],
      'ffx2-fallen-aeons': ['Delta Attack needs all three Sisters', 'a Remedy clears the Silence, Darkness and Itchy'],
      'seymour-omnis': ['-ga', 'Hit a disc to turn it', 'Nul the colour he shows most', 'heal above 4,000 before Ultima'],
      'ffx2-trema': ['Nothing sticks to Trema', 'below a half', 'below a quarter', 'Meteor'],
      'isaaru-via-purifico': ['never the same aeon he has out', "Grothia's gauge is full", "Spathi's count reads 1"],
      'ffx2-den-of-woe': ['at eight hits back for three quarters of max HP', 'Lightfall', 'Hero Drink', 'Invincible'],
      'mirror-aeons': ['heal early', 'spells on Mindy', 'Cheer first', "call Yuna's Yojimbo in before his blade is full"],
      'ffx2-masterpiece-theatre': ['Act I is a warm-up', 'Act II hits hard', 'Darkness', 'Phoenix Down'],
      'ffx2-tourist-trap': ['keeps a count', 'one HP', 'about seven attacks in', 'Keep a heal ready'],
    };
    expect(Object.keys(keep).sort()).toEqual([...IDS].sort());
    for (const [id, facts] of Object.entries(keep)) for (const fact of facts) expect(prepTipFor(id)!.toLowerCase(), `${id}: ${fact}`).toContain(fact.toLowerCase());
  });

  it('each form is whole sentences: it starts with a capital and ends with a full stop', () => {
    for (const id of IDS) {
      const short = prepTipFor(id)!;
      expect(short, id).toMatch(/^[A-Z]/);
      expect(short, id).toMatch(/\.$/);
      expect(short, id).not.toMatch(/\s{2,}/);
    }
  });
});

describe('the markup: both forms in the prep card, one in the pause screen, for every one of the nine', () => {
  it('the prep card\'s block holds the whole tip (--full) and the short one (--short) as text', () => {
    for (const id of IDS) {
      const holder = document.createElement('div');
      holder.innerHTML = tipHtml(metaOf(id), { prep: true });
      expect(holder.querySelector('.cpanel__tip-text--full')?.textContent, id).toBe(metaOf(id).tip);
      expect(holder.querySelector('.cpanel__tip-text--short')?.textContent, id).toBe(prepTipFor(id));
    }
  });

  it('the real prep panel of each chapter\'s game mounts both spans in its briefing column', () => {
    for (const row of ROWS) {
      const chapter = getChapter(row.id)!;
      const el = document.createElement('div');
      makeChapterPanel(row.game === 'FFX' ? 'ffx' : 'ffx2').mount(el, { chapter, memberId: row.game === 'FFX' ? 'tidus' : 'yuna' });
      const brief = el.querySelector('.prepchap__col--brief')!;
      expect(brief.querySelector('.cpanel__tip-text--full')?.textContent, row.id).toBe(metaOf(row.id).tip);
      expect(brief.querySelector('.cpanel__tip-text--short')?.textContent, row.id).toBe(prepTipFor(row.id));
    }
  });
});
