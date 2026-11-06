/**
 * Penance's guide card, page and prep tip teach the guides' winning line (FFX only; `src/data/guides/penance.ts`, `docs/penance.ts`, `chapter-meta-penance.ts`; hidden chapter 35, the word `judgment`).
 *
 * The line is the public guides' (Jegged, GamerGuides, eip.gg and Game8 between them; no one page gives all of it), in our own words, and it is the line `docs/handoff/ch-penance.md` section 5.1 plays on the real engine (55 of 100 battles, 65 of 100 on held-out seeds; none without Three Stars):
 * the Nul-All Mix, then Three Stars and Quick Hit; one hand down at every one of Penance's turns, a hand's last blow held until just before it acts; Dispel Penance's Regen and whoever Immolation breaks.
 *
 * What is pinned: the registration of the card and the page (the registries pair them: `strategy-guide.test.ts`, `guide-doc.test.ts`); that every rule, hint and phase is cited in the corpus form; that each of the three
 * teachings is in the tip, the card and the page; that the page prints the data's HP, Steal and Drops; that no number is invented; that the tip fits the prep card's band at 1600 x 900; that the panel finds the card on Penance's
 * board; and the tripwire the brief asked for: **no move advisor line is registered for Penance**, so there is nothing to point at the guide line yet; the day one is registered this test fails and says to point it at the line.
 */
import { describe, expect, it } from 'vitest';

import { penanceGroup } from '../../../src/data/ffx/enemies/penance.ts';
import { PENANCE_ID, PENANCE_LEFT_ARM_ID, PENANCE_RIGHT_ARM_ID } from '../../../src/data/ffx/penance-ids.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { PENANCE_GUIDE, PENANCE_GUIDE_IDS } from '../../../src/data/guides/penance.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { PENANCE_META } from '../../../src/data/chapter-meta-penance.ts';
import { TACTICS } from '../../../src/engine/tactics/index.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { docStrings } from '../helpers/guideDocStrings.ts';
import { tipFit } from '../helpers/prepTipBand.ts';
import { newEngine } from '../helpers/penanceDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;
const text = (g: typeof PENANCE_GUIDE): string => [...g.rules.map((r) => r.text), ...g.hints.map((h) => h.text), ...g.phases.map((p) => p.note)].join(' ');

describe('the card is registered under the chapter and its three bodies, and cites every sentence it prints', () => {
  it('is in GUIDES, names the formation\'s three bodies, and keeps three to five rules with short lines that fit the rail', () => {
    expect(GUIDES.find((g) => g.id === 'penance')).toBe(PENANCE_GUIDE);
    expect([...PENANCE_GUIDE_IDS]).toEqual([PENANCE_ID, PENANCE_RIGHT_ARM_ID, PENANCE_LEFT_ARM_ID]);
    expect(PENANCE_GUIDE.bossIds).toEqual([...PENANCE_GUIDE_IDS]);
    expect(penanceGroup.enemies.map((e) => e.id).sort()).toEqual([...PENANCE_GUIDE_IDS].sort());
    expect(PENANCE_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(PENANCE_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of PENANCE_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file) and names the chapter\'s own note somewhere in each', () => {
    for (const x of [...PENANCE_GUIDE.rules, ...PENANCE_GUIDE.hints, ...PENANCE_GUIDE.phases]) {
      expect(x.cite, 'a cite in the corpus form').toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s note or the combat core').toMatch(/re-ffx-penance §|ffx-combat-core §/);
    }
    for (const r of PENANCE_GUIDE.rules) expect(r.cite, r.short).toMatch(/re-ffx-penance §/);
  });

  it('every hint speaks to a row the guide teaches, and the Dispel hints are tried most specific first', () => {
    const taught = ['Three Stars', 'Quick Hit', 'Dispel', 'Esuna', 'Remedy', 'Curaga', 'X-Potion', 'Elixir', 'Phoenix Down'];
    for (const h of PENANCE_GUIDE.hints) for (const label of h.when.labels ?? []) expect(taught, label).toContain(label);
    const dispel = PENANCE_GUIDE.hints.filter((h) => h.when.labels?.includes('Dispel'));
    expect(dispel.length).toBeGreaterThanOrEqual(3);
    expect(dispel.at(-1)!.when.targetId, 'the general Dispel hint is the last').toBeUndefined();
    expect(dispel.at(-1)!.when.targetHas, 'the general Dispel hint is the last').toBeUndefined();
  });

  it('invents no number: every figure the card prints is one of the note\'s (99,999, 20, 12, six, three quarters)', () => {
    const allowed = ['99,999', '20', '12'];
    for (const n of text(PENANCE_GUIDE).match(/\d[\d,]*/g) ?? []) expect(allowed, n).toContain(n);
  });
});

describe('the three teachings are in the tip, the card and the page', () => {
  const doc = docForChapter('penance')!;
  const page = docStrings(doc).join('\n');
  const rules = PENANCE_GUIDE.rules.map((r) => r.text).join('\n');

  it('the Nul-All Mix, then Three Stars, then Quick Hit (the measured line opens with the Mix, so the tip names it before Three Stars)', () => {
    expect(PENANCE_META.tip).toMatch(/^Nul-All Mix, Three Stars, Quick Hit\./);
    expect(rules).toMatch(/Three Stars on your first calm turn/);
    expect(rules).toMatch(/Quick Hit, Dispel and Esuna/);
    expect(page).toMatch(/Then use Three Stars on the first calm turn/);
    expect(page).toMatch(/Take a hand down with Quick Hit/);
  });

  it('keep one hand down at every one of Penance\'s turns, and hold a hand\'s last blow until just before it acts', () => {
    expect(PENANCE_META.tip).toMatch(/Keep a hand down each Penance turn/);
    expect(PENANCE_META.tip).toMatch(/hold its last blow till just before it acts/);
    expect(rules).toMatch(/Keep one hand down at every one of Penance's turns/);
    expect(rules).toMatch(/hold the last until just before its turn/);
    expect(page).toMatch(/Keep one hand down at every one of Penance's turns/);
    expect(page).toMatch(/hold the last until just before its turn/);
  });

  it('Dispel the Regen and whoever Immolation breaks', () => {
    expect(PENANCE_META.tip).toMatch(/Dispel its Regen and anyone Immolation breaks/);
    expect(rules).toMatch(/Dispel the Regen off Penance/);
    expect(rules).toMatch(/Dispel whoever Immolation hits/);
    expect(page).toMatch(/Dispel the Regen off Penance/);
    expect(page).toMatch(/Dispel whoever Immolation breaks/);
  });

  it('the old tip\'s warning survives in the teaching: both hands up is what Judgment Day needs', () => {
    expect(rules).toMatch(/Judgment Day[^.]*only goes off while both hands stand/);
    expect(page).toMatch(/only while both hands stand/);
  });
});

describe('the tip fits the prep card\'s band at 1600 x 900, so no short form and no overflow-table row is owed', () => {
  it('five lines or fewer by the line model, whole lines only', () => {
    const fit = tipFit(PENANCE_META, 1600, 900);
    expect(fit.fits, JSON.stringify(fit)).toBe(true);
    expect(fit.lines).toBeLessThanOrEqual(5);
    expect(PENANCE_META.tip.length).toBeLessThanOrEqual(170);
  });
});

describe('the page: the header, the stat lines the data holds, and the strategy', () => {
  it('is registered with the card\'s bosses, prints the records\' HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('penance')!;
    expect(doc).toMatchObject({ id: 'penance', game: 'ffx', bossIds: [...PENANCE_GUIDE_IDS] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('penance'))).toBe(true);
    const body = penanceGroup.enemies.find((e) => e.id === PENANCE_ID)!;
    const arm = penanceGroup.enemies.find((e) => e.id === PENANCE_LEFT_ARM_ID)!;
    const field = (label: string): number | null => {
      const b = doc.blocks.find((x) => x.t === 'field' && x.label === label);
      return b && b.t === 'field' ? Number(b.value.replace(/,/g, '')) : null;
    };
    expect(field('HP')).toBe(body.stats.maxHp);
    expect(field('Arm HP')).toBe(arm.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Elixir (common)', 'Megalixir x2 (rare)']);
    expect(body.rewards.steal?.common).toEqual({ itemId: 'elixir', count: 1 });
    expect(body.rewards.steal?.rare).toEqual({ itemId: 'megalixir', count: 2 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Master Sphere x3']);
    expect(body.rewards.drops).toEqual([{ itemId: 'master-sphere', count: 3 }]);
  });
});

describe('the panel on the real board, and the advisor tripwire', () => {
  it('finds the card on Penance\'s board', () => {
    expect(guideForState(newEngine(1).state())?.id).toBe('penance');
  });

  it('no move advisor line is registered for Penance: when one is, point it at the guide line (Three Stars, Quick Hit with the last blow held, one hand down, the Dispels) and update this test', () => {
    const registered = TACTICS.filter((t) => (PENANCE_GUIDE_IDS as readonly string[]).includes(t.bossId)).map((t) => t.bossId);
    expect(registered).toEqual([]);
  });
});
