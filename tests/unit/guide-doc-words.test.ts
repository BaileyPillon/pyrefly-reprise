// @vitest-environment jsdom
/**
 * Nothing the strategy guide shows names where its advice came from.
 *
 * Bailey, 2026-10-03: "Do not say adapted from Jegged or cite worded that just sounds stupid." The
 * guide reads as a plain, confident boss guide: never "adapted from", a source or citation wording,
 * a section sign, a file path, a decision id. The data may keep its provenance in code comments for
 * maintainers (`research/jegged-encounter-guides-*.md` holds the pages); this file fails on any
 * string the player can see, in the documents themselves and in the real text and attributes of the
 * mounted panel for every chapter.
 *
 * Sentences are our own words: the only text a document shares with the page it follows is the short
 * stat labels ("HP", "Steal", "Drops", "In Game Description") and the boss headings, so a long
 * sentence that matches a published guide word for word would be a copyright defect. That is checked
 * against the saved pages by hand (the handoff says how), not here, because the pages are not in the
 * repository.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { GUIDE_DOCS } from '../../src/data/guides/docs/index.ts';
import { StrategyGuide } from '../../src/ui/common/StrategyGuide.ts';
import { boardForDoc, docStrings } from './helpers/guideDocStrings.ts';

/** What a player must never read. `source` also catches `resource`: no guide sentence needs it. */
const SOURCE_WORDS = /jegged|adapt|source|cite|citation|§|research\/|docs\/|\.ts\b|\bD-\d{3}\b|\bPR-\d{4}\b|walkthrough guide|according to/i;

describe('no document string names a source', () => {
  for (const d of GUIDE_DOCS) {
    it(`${d.id}`, () => {
      const hits = docStrings(d).filter((s) => SOURCE_WORDS.test(s));
      expect(hits).toEqual([]);
    });
  }

  it('checks the strings it should: the headers, the stat lines, the lists and the table cells', () => {
    const all = GUIDE_DOCS.flatMap(docStrings);
    expect(all.length).toBeGreaterThan(600);
    expect(all).toContain('Seymour Flux');
    expect(all).toContain('In Game Description');
    expect(all).toContain('Mute Shock');
  });
});

/**
 * A pointer into a part of the guide it follows that this panel does not have ("the Overdrive section
 * covers it", "the ... page under Tips and Tricks"): a dead end for the player, and the one kind of
 * source naming `SOURCE_WORDS` cannot see. A reference to something above or below in the same
 * document is fine and is not matched.
 */
const POINTS_ELSEWHERE = /\bsections?\b|\bpages?\b|tips and tricks/i;

describe('no document string points at a part of a guide this panel does not have', () => {
  for (const d of GUIDE_DOCS) {
    it(`${d.id}`, () => {
      const hits = docStrings(d).filter((s) => POINTS_ELSEWHERE.test(s));
      expect(hits).toEqual([]);
    });
  }
});

describe('the mounted panel prints no source either', () => {
  const live: Array<{ unmount(): void }> = [];
  afterEach(() => {
    while (live.length) live.pop()!.unmount();
    document.body.innerHTML = '';
  });

  for (const d of GUIDE_DOCS) {
    it(`${d.id}: text, attributes and chip`, () => {
      const stage = document.createElement('div');
      document.body.appendChild(stage);
      const guide = new StrategyGuide({
        game: d.game,
        anchors: { top: 44, bottom: 34 },
        readVisible: () => true,
        writeVisible: () => undefined,
      });
      guide.mount(stage);
      live.push(guide);
      guide.sync(boardForDoc(d));

      const root = stage.querySelector<HTMLElement>('[data-role="strategy-guide"]')!;
      expect(root.hidden, `${d.id}: the panel did not open`).toBe(false);
      expect(root.querySelectorAll('.sgd__cite').length).toBe(0);
      const visibleText = root.textContent ?? '';
      expect(visibleText.length).toBeGreaterThan(500);
      expect(visibleText).not.toMatch(SOURCE_WORDS);
      // attributes and titles too (aria labels, tooltips), not only the text nodes
      const attrs: string[] = [];
      for (const el of [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))]) {
        for (const a of Array.from(el.attributes)) if (!['class', 'style'].includes(a.name)) attrs.push(`${a.name}=${a.value}`);
      }
      expect(attrs.filter((a) => SOURCE_WORDS.test(a))).toEqual([]);
    });
  }
});
