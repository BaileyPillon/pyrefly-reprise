/**
 * The Youth League Tournament (the hidden FFX-2 chapter): the tactic, the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics
 * register"; `guide-doc.test.ts`: one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card, the document and the tactic are the chapter's, under all twenty fighters' ids, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for or the attack row; the rules and hints cite in the corpus's own form.
 * 3. **The numbers the player reads are the data's**: the fighters' HP, Lucil's Doom of about ten seconds, the Flash Bomb's fifty, the drops and the steals; and what the sources and the engine say of Doom.
 * (What the tactic does to the shipped autopilot's results is measured in `youth-league-bench.test.ts`.)
 */
import { describe, expect, it } from 'vitest';

import { FFX2_YOUTH_LEAGUE } from '../../../src/data/chapter-ffx2-youth-league.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_YOUTH_LEAGUE_GUIDE, YOUTH_LEAGUE_GUIDE_IDS } from '../../../src/data/guides/ffx2-youth-league.ts';
import { FFX2_YOUTH_LEAGUE_DOC } from '../../../src/data/guides/docs/ffx2-youth-league.ts';
import { KINDS } from '../../../src/data/ffx2/enemies/youth-league.ts';
import { ACT_ENEMY_IDS } from '../../../src/data/youth-league-ids.ts';
import { YOUTH_LEAGUE_BOSS_IDS } from '../../../src/engine/tactics/ffx2-youth-league.ts';
import { TACTICS } from '../../../src/engine/tactics/index.ts';
import { COMMAND_RECORDS_YOUTH_LEAGUE } from '../../../src/data/ffx2/command-records/youth-league.ts';

const docText = (): string =>
  FFX2_YOUTH_LEAGUE_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_YOUTH_LEAGUE_GUIDE.rules.map((r) => r.text), ...FFX2_YOUTH_LEAGUE_GUIDE.hints.map((h) => h.text), ...FFX2_YOUTH_LEAGUE_GUIDE.phases.map((p) => p.note)].join(' ');
const fmt = (n: number): string => n.toLocaleString('en-US');

describe('registration', () => {
  it('the card, the document and the tactic are the chapter\'s, under all twenty fighters, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_YOUTH_LEAGUE_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_YOUTH_LEAGUE_DOC);
    expect(guideForChapter(FFX2_YOUTH_LEAGUE.id)).toBe(FFX2_YOUTH_LEAGUE_GUIDE);
    expect([...FFX2_YOUTH_LEAGUE_GUIDE.bossIds]).toEqual([...ACT_ENEMY_IDS.flat()]);
    expect([...YOUTH_LEAGUE_GUIDE_IDS]).toEqual([...ACT_ENEMY_IDS.flat()]);
    expect([...YOUTH_LEAGUE_BOSS_IDS]).toEqual([...ACT_ENEMY_IDS.flat()]);
    expect([...FFX2_YOUTH_LEAGUE_DOC.bossIds]).toEqual([...ACT_ENEMY_IDS.flat()]);
    expect(FFX2_YOUTH_LEAGUE_DOC.game).toBe('ffx2');
    expect(FFX2_YOUTH_LEAGUE_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
    expect(TACTICS.filter((t) => t.chapterId === 'ffx2-youth-league').map((t) => t.bossId)).toEqual([...ACT_ENEMY_IDS.flat()]);
  });
});

describe('the card says which lines are the chapter\'s own picks', () => {
  it('the carry and the retry are the chapter\'s picks (YL3, YL4), not the research section that records them as unmapped: they cite the Den of Woe\'s carry and say "in this version"', () => {
    const carry = FFX2_YOUTH_LEAGUE_GUIDE.rules.find((r) => r.short === 'Nothing mends you between the bouts')!;
    expect(carry.cite).toBe('ffx2-gippal-den-of-woe §2');
    expect(carry.text).toMatch(/In this version, if you lose from the second fight on/);
    for (const h of FFX2_YOUTH_LEAGUE_GUIDE.hints.filter((x) => /nothing mends the party between the bouts/.test(x.text))) {
      expect(h.cite, h.text).toBe('ffx2-gippal-den-of-woe §2');
    }
    // Doom's figure is the engine's measurement (the research gives none): the card says "about ten seconds" and cites only the sourced beat (§5.2).
    for (const h of FFX2_YOUTH_LEAGUE_GUIDE.hints.filter((x) => /Doom kills/.test(x.text))) expect(h.text).not.toMatch(/10\.5/);
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowed = new Set(['darkness', 'phoenix down', 'mega phoenix', 'life', 'mega-potion', 'curaga', 'x-potion', 'cura', 'pray']);
    for (const h of FFX2_YOUTH_LEAGUE_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowed.has(label.toLowerCase()), label).toBe(true);
      if (h.when.labels === undefined) expect(h.when.kinds, h.text).toEqual(['attack']);
      expect(h.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    }
    for (const r of FFX2_YOUTH_LEAGUE_GUIDE.rules) expect(r.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    for (const p of FFX2_YOUTH_LEAGUE_GUIDE.phases) expect(p.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  it('the document prints every type\'s HP, steals and drops; the page and the data agree', () => {
    const text = docText();
    for (const kind of Object.values(KINDS)) {
      expect(text, kind.name).toContain(fmt(kind.stats.hp));
      expect(text, kind.name).toContain(kind.name.replace('League ', 'League ').replace(/^Yaibal$/, 'Yaibal'));
    }
    expect(text).toContain('Muscle Belt');
    expect(text).toContain('Circlet');
    expect(text).toContain(`Magic Defense of ${KINDS.elma.stats.mdef}`);
  });

  it('Doom: about ten seconds (the engine measured 10.5) and no cure, as the engine measured (youth-league-engine.test.ts) and the sources say (nothing cures Doom); Harbinger\'s row carries the counter 4', () => {
    expect(cardText()).toMatch(/about ten seconds after it lands/);
    expect(docText()).toMatch(/about ten seconds after it lands/);
    expect(cardText()).toMatch(/Nothing cures Doom/);
    expect(docText()).toMatch(/Nothing in the bag or in the menus cures Doom/);
    expect(COMMAND_RECORDS_YOUTH_LEAGUE['x2-lucil-harbinger']!.statusTime).toEqual({ 14: 4 });
  });

  it('the League\'s Flash Bomb is said to cost about fifty and blind no one at the party\'s level (the engine measured 0 landings), and no line promises Confuse or Hush', () => {
    expect(docText()).toMatch(/about fifty a girl, and it will not blind anyone at your level/);
    expect(KINDS.slasher.sensorText).toMatch(/will not blind anyone at your level/);
    expect(KINDS.mage.sensorText).toMatch(/will not take at your level/);
    expect(cardText()).not.toMatch(/blind/i);
  });

  it('what the three named fighters do, as the scripts do it: Yaibal mends Yuna alone (two turns in three), Elma guards first, Lucil counts five', () => {
    expect(cardText()).toMatch(/Yaibal looks after Yuna and nobody else/);
    expect(docText()).toMatch(/two turns in three/);
    expect(cardText()).toMatch(/guards her whole line first/);
    expect(cardText()).toMatch(/Every fifth action of Lucil is Harbinger/);
    expect(docText()).toMatch(/counts to five/);
  });
});
