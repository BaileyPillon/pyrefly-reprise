/**
 * Ifrit at Kilika Temple (the hidden FFX-2 chapter): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register";
 * `guide-doc.test.ts`: one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under his id, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for; the rules and hints cite in the corpus's own form.
 * 3. **The numbers the player reads are the data's**: his HP, Strength 82 and Defense 98, the gauge's 7 and 5, the marks 30, 60 and 90 and the 100, the Fire absorption and the Ice weakness, the three magic moves Shell
 *    halves, the steal and the drop.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_IFRIT_KILIKA } from '../../../src/data/chapter-ffx2-ifrit-kilika.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_IFRIT_KILIKA_GUIDE, IFRIT_KILIKA_GUIDE_IDS } from '../../../src/data/guides/ffx2-ifrit-kilika.ts';
import { FFX2_IFRIT_KILIKA_DOC } from '../../../src/data/guides/docs/ffx2-ifrit-kilika.ts';
import { x2Ifrit } from '../../../src/data/ffx2/enemies/ifrit.ts';
import { IFRIT_FIRAGA_ID, IFRIT_HELLFIRE_ID, IFRIT_METEOR_STRIKE_ID, x2IfritAbilities } from '../../../src/data/ffx2/enemies/ifrit-abilities.ts';
import { IFRIT_AC_PER_ACTION, IFRIT_AC_PER_RESULT, IFRIT_METEOR_MARKS } from '../../../src/battle/ffx2/ai/ifrit.ts';
import { AC_OVERDRIVE } from '../../../src/battle/ffx2/ai/fallen-aeons.ts';
import { IFRIT_KILIKA_BOSS_IDS } from '../../../src/engine/tactics/ffx2-ifrit-kilika.ts';

const docText = (): string =>
  FFX2_IFRIT_KILIKA_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_IFRIT_KILIKA_GUIDE.rules.map((r) => r.text), ...FFX2_IFRIT_KILIKA_GUIDE.hints.map((h) => h.text), ...FFX2_IFRIT_KILIKA_GUIDE.phases.map((p) => p.note)].join(' ');

/** The numbers the guide spells in words. */
const WORDS: Readonly<Record<number, string>> = { 5: 'five', 7: 'seven', 30: 'thirty', 60: 'sixty', 90: 'ninety', 100: 'a hundred' };

describe('registration', () => {
  it('the card and the document are the chapter\'s, under his id, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_IFRIT_KILIKA_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_IFRIT_KILIKA_DOC);
    expect(guideForChapter(FFX2_IFRIT_KILIKA.id)).toBe(FFX2_IFRIT_KILIKA_GUIDE);
    expect([...FFX2_IFRIT_KILIKA_GUIDE.bossIds]).toEqual([...IFRIT_KILIKA_GUIDE_IDS]);
    expect([...IFRIT_KILIKA_BOSS_IDS]).toEqual([...IFRIT_KILIKA_GUIDE_IDS]);
    expect([...FFX2_IFRIT_KILIKA_DOC.bossIds]).toEqual([...IFRIT_KILIKA_GUIDE_IDS]);
    expect(FFX2_IFRIT_KILIKA_DOC.game).toBe('ffx2');
    expect(FFX2_IFRIT_KILIKA_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['darkness', 'protect', 'shell', 'power break', 'armor break', 'curaga', 'cura', 'hi-potion', 'phoenix down', 'life', 'pray']);
    for (const h of FFX2_IFRIT_KILIKA_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      expect(h.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    }
    for (const r of FFX2_IFRIT_KILIKA_GUIDE.rules) expect(r.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    for (const p of FFX2_IFRIT_KILIKA_GUIDE.phases) expect(p.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
  });

  it('there is no Mega-Potion hint: the preset\'s bag holds none, and the tactic never asks for one', () => {
    expect(FFX2_IFRIT_KILIKA_GUIDE.hints.some((h) => (h.when.labels ?? []).includes('Mega-Potion'))).toBe(false);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  const fmt = (n: number): string => n.toLocaleString('en-US');

  it('the document prints his HP, the steal and the drop, his Strength and Defense; the page and the data agree', () => {
    const text = docText();
    expect(text).toContain(fmt(x2Ifrit.hp));
    expect(text).toContain('Fiery Gleam');
    expect(text).toContain('Angel Earrings');
    expect(x2Ifrit.rewards.drops.map((d) => d.itemId)).toEqual(['angel-earrings']);
    expect(x2Ifrit.rewards.steal?.common?.itemId).toBe('fiery-gleam');
    expect(text).toContain(`Strength of ${x2Ifrit.stats.str}`);
    expect(text).toContain(`${x2Ifrit.stats.def} of it`);
    expect(cardText()).toContain(`Strength of ${x2Ifrit.stats.str}`);
    expect(cardText()).toContain(`Defense of ${x2Ifrit.stats.def}`);
  });

  it('the count the card and the page describe is the script\'s: seven for his actions, five for his blows, Meteor Strike at thirty, sixty and ninety, Hellfire at a hundred; neither Meteor nor Hellfire raises it', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toContain(WORDS[IFRIT_AC_PER_ACTION]!);
      expect(text).toContain(WORDS[IFRIT_AC_PER_RESULT]!);
      for (const mark of IFRIT_METEOR_MARKS) expect(text).toContain(WORDS[mark]!);
      expect(text).toContain(WORDS[AC_OVERDRIVE]!);
    }
    expect(docText()).toMatch(/do not raise the count themselves/);
    expect(cardText()).toMatch(/do not raise it themselves/);
    expect([IFRIT_AC_PER_ACTION, IFRIT_AC_PER_RESULT, ...IFRIT_METEOR_MARKS, AC_OVERDRIVE]).toEqual([7, 5, 30, 60, 90, 100]);
  });

  it('"Fire heals him" and "Ice is his weakness" are the affinities, and "Shell halves every one" is true of Firaga, Meteor Strike and Hellfire (magical) and not of anything he does that is not', () => {
    expect(x2Ifrit.affinities).toMatchObject({ fire: 'absorb', ice: 'weak', gravity: 'immune' });
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Fire (spell|heals)/i);
      expect(text).toMatch(/Ice/);
    }
    const byId = Object.fromEntries(x2IfritAbilities.map((a) => [a.id, a]));
    for (const id of [IFRIT_FIRAGA_ID, IFRIT_METEOR_STRIKE_ID, IFRIT_HELLFIRE_ID]) expect(byId[id]!.damageType, id).toBe('magical');
    expect(cardText()).toMatch(/Firaga, Meteor Strike and Hellfire are all magic, so Shell halves every one/);
    expect(docText()).toMatch(/Firaga, Meteor Strike and Hellfire are all magic, so Shell halves every one/);
  });

  it('what lands and what does not: Breaks and Slow land (the card and the page say so), Gravity does nothing, Death, Sleep, Silence, Darkness, Poison, Confusion, Berserk, Stop and Doom do not land', () => {
    const resisted = (s: string): number => (x2Ifrit.immunities as Record<string, number | undefined>)[s] ?? 0;
    for (const s of ['slow', 'str-down', 'def-down', 'mag-down', 'mdef-down']) expect(resisted(s), s).toBe(0);
    for (const s of ['ko', 'sleep', 'silence', 'darkness', 'poison', 'confuse', 'berserk', 'stop', 'doom']) expect(resisted(s), s).toBe(255);
    expect(cardText()).toMatch(/Breaks and Slow both land/);
    expect(docText()).toMatch(/Breaks and Slow both land/);
    expect(cardText()).toMatch(/Gravity does nothing/);
    expect(docText()).toMatch(/Gravity does nothing/);
  });

  it('Meteor Strike goes to the girl farthest from him, Yuna at the start (the card and the page say so, the script and the scene back it)', () => {
    expect(cardText()).toMatch(/farthest from him, Yuna at the start/);
    expect(docText()).toMatch(/farthest from him/);
  });
});
