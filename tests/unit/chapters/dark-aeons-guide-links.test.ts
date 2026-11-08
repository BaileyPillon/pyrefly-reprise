/**
 * **The strategy guide opens on the foe that is on screen, at every one of the Dark Aeons chapter's seven links** (FFX only; round 35's PR-0637).
 *
 * Link 4, the second Dark Ixion, is another formation and another combatant id (`dark-ixion-2`); the guide document's Ixion head was anchored on `dark-ixion` alone, so on link 4 no block matched, `startBlockIndex` fell back to
 * block 0 and the panel opened on Dark Valefor's page (HP 800,000, "She resists every element") over Ixion's painting. The test runs the REAL engine on each link's own formation (`darkAeonsDrive`, the chapter's party, seed 1) and
 * asks the panel's own two functions (`docForState`, `startBlockIndex`, `headingAt`, `src/ui/common/guideDoc.ts`) which page they open: its heading must be the combatant's name, and the same foe's card (`DARK_AEONS_GUIDE.phases`)
 * must have a phase for it. Without the second anchor, link 4 fails here with "Dark Valefor".
 */
import { describe, expect, it } from 'vitest';

import { DARK_SIX_LINKS } from '../../../src/data/ffx/dark-aeons-six-ids.ts';
import { DARK_AEONS_GUIDE, DARK_AEONS_GUIDE_IDS } from '../../../src/data/guides/dark-aeons.ts';
import { DARK_AEONS_DOC } from '../../../src/data/guides/docs/dark-aeons.ts';
import { docForState, headingAt, startBlockIndex } from '../../../src/ui/common/guideDoc.ts';
import * as H from '../helpers/darkAeonsDrive.ts';

describe('the guide document opens on the foe of every link (PR-0637)', () => {
  it('the chapter has the seven links and the guide and the document name the same seven foes (the chapter plays Anima before Bahamut; the guide lists them the other way)', () => {
    const links = DARK_SIX_LINKS.map((l) => l.bodyId).sort();
    expect(links).toHaveLength(7);
    expect(links).toEqual([...DARK_AEONS_GUIDE_IDS].sort());
    expect([...DARK_AEONS_DOC.bossIds].sort()).toEqual(links);
    expect([...DARK_AEONS_GUIDE.bossIds].sort()).toEqual(links);
  });

  for (const link of DARK_SIX_LINKS) {
    it(`link ${link.link} (${link.bodyId}): the document is found, opens on a heading, and the heading is the foe's own name`, () => {
      const state = H.newEngine(1, link.key).state();
      const doc = docForState(state);
      expect(doc?.id, 'the Dark Aeons document is on the board').toBe('dark-aeons');
      const at = startBlockIndex(doc!, state);
      const block = doc!.blocks[at]!;
      expect(block.t, 'it opens on a heading, not on a stray block').toBe('head');
      const name = H.actor(H.newEngine(1, link.key), link.bodyId).name;
      expect(headingAt(doc!, at)).toBe(name);
      // The anchor is the foe's own: the opened block names this link's combatant id.
      expect((block as { at?: readonly string[] }).at).toContain(link.bodyId);
    });

    it(`link ${link.link} (${link.bodyId}): the foe's card has a phase for it`, () => {
      const phase = DARK_AEONS_GUIDE.phases.find((p) => p.bossId === link.bodyId);
      expect(phase, 'a phase line for the foe').toBeDefined();
      expect(phase!.label).toContain(H.actor(H.newEngine(1, link.key), link.bodyId).name.toUpperCase());
    });
  }

  it('six different pages for the seven links: only the two Ixion fights share one (their text covers both)', () => {
    const titles = DARK_SIX_LINKS.map((link) => {
      const state = H.newEngine(1, link.key).state();
      const doc = docForState(state)!;
      return headingAt(doc, startBlockIndex(doc, state));
    });
    expect(titles).toEqual(['Dark Valefor', 'Dark Ifrit', 'Dark Ixion', 'Dark Ixion', 'Dark Shiva', 'Dark Anima', 'Dark Bahamut']);
    expect(new Set(titles).size).toBe(6);
  });

  it('every boss id the document answers to is anchored by one of its heads (none falls back to the top of the page)', () => {
    const anchored = new Set(DARK_AEONS_DOC.blocks.flatMap((b) => (b.t === 'head' && b.at ? b.at : [])));
    for (const id of DARK_AEONS_DOC.bossIds) expect(anchored.has(id), id).toBe(true);
  });
});
