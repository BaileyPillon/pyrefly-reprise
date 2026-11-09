/**
 * The Luca Opener (the hidden FFX-2 chapter): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register"; `guide-doc.test.ts`: one
 * document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under its three ids, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for; the rules and hints cite in the corpus's own form.
 * 3. **The numbers the player reads are the data's**: Logos' 86 HP and Defense of 2, Ormi's 97 HP and Defense of 60, Leblanc's 130 HP, the steals and the drops, the fifth for the Potion, the three swings before the Thunder.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_LUCA_OPENER } from '../../../src/data/chapter-ffx2-luca-opener.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_LUCA_OPENER_GUIDE, LUCA_OPENER_GUIDE_IDS } from '../../../src/data/guides/ffx2-luca-opener.ts';
import { FFX2_LUCA_OPENER_DOC } from '../../../src/data/guides/docs/ffx2-luca-opener.ts';
import { x2LucaLeblanc, x2LucaLogos, x2LucaOrmi } from '../../../src/data/ffx2/enemies/luca-opener.ts';
import { LUCA_OPENER_BOSS_IDS } from '../../../src/engine/tactics/ffx2-luca-opener.ts';
import { LUCA_POTION_DIVISOR } from '../../../src/battle/ffx2/ai/luca-opener.ts';

const docText = (): string =>
  FFX2_LUCA_OPENER_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_LUCA_OPENER_GUIDE.rules.map((r) => r.text), ...FFX2_LUCA_OPENER_GUIDE.hints.map((h) => h.text), ...FFX2_LUCA_OPENER_GUIDE.phases.map((p) => p.note)].join(' ');

describe('registration', () => {
  it('the card and the document are the chapter\'s, under its three ids, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_LUCA_OPENER_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_LUCA_OPENER_DOC);
    expect(guideForChapter(FFX2_LUCA_OPENER.id)).toBe(FFX2_LUCA_OPENER_GUIDE);
    expect([...FFX2_LUCA_OPENER_GUIDE.bossIds]).toEqual([...LUCA_OPENER_GUIDE_IDS]);
    expect([...LUCA_OPENER_BOSS_IDS]).toEqual([...LUCA_OPENER_GUIDE_IDS]);
    expect([...FFX2_LUCA_OPENER_DOC.bossIds]).toEqual([...LUCA_OPENER_GUIDE_IDS]);
    expect(FFX2_LUCA_OPENER_DOC.game).toBe('ffx2');
    expect(FFX2_LUCA_OPENER_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['steal', 'darkness dance', 'potion', 'phoenix down']);
    for (const h of FFX2_LUCA_OPENER_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      expect(h.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    }
    for (const r of FFX2_LUCA_OPENER_GUIDE.rules) expect(r.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    for (const p of FFX2_LUCA_OPENER_GUIDE.phases) expect(p.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
  });

  it('every row the tactic asks for has a hint: the Steal, the Dance, the Potion and the Phoenix Down', () => {
    const labels = new Set(FFX2_LUCA_OPENER_GUIDE.hints.flatMap((h) => h.when.labels ?? []));
    for (const want of ['Steal', 'Darkness Dance', 'Potion', 'Phoenix Down']) expect(labels.has(want), want).toBe(true);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  it('the document prints each fighter\'s HP, the steals and the drops; the page and the data agree', () => {
    const text = docText();
    for (const [enemy, steal, drop] of [[x2LucaLogos, 'Silver Glasses', 'Potion'], [x2LucaOrmi, 'Iron Bangle', 'Potion'], [x2LucaLeblanc, 'Silver Bracer', 'Hi-Potion']] as const) {
      expect(text, enemy.name).toContain(`${enemy.hp}`);
      expect(text, enemy.name).toContain(steal);
      expect(text, enemy.name).toContain(drop);
    }
    expect(x2LucaLogos.rewards.steal?.common.itemId).toBe('silver-glasses');
    expect(x2LucaOrmi.rewards.steal?.common.itemId).toBe('iron-bangle');
    expect(x2LucaLeblanc.rewards.steal?.common.itemId).toBe('silver-bracer');
    expect(x2LucaLogos.rewards.drops.map((d) => d.itemId)).toEqual(['x2-potion']);
    expect(x2LucaLeblanc.rewards.drops.map((d) => d.itemId)).toEqual(['x2-hi-potion']);
  });

  it('Logos\' 86 HP and Defense of 2, Ormi\'s 97 HP and Defense of 60 and Leblanc\'s 130 HP are said on the card and the page, in the data\'s own numbers', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toContain(`${x2LucaLogos.hp} life`.replace('life', text === cardText() ? 'life' : 'HP'));
      expect(text).toContain(`Defense of ${x2LucaLogos.stats.def}`);
      expect(text).toContain(`Defense of ${x2LucaOrmi.stats.def}`);
      expect(text).toContain(`${x2LucaLeblanc.hp}`);
    }
    expect(x2LucaLogos.stats.def).toBe(2);
    expect(x2LucaOrmi.stats.def).toBe(60);
  });

  it('the Potion is "a fifth" of Ormi\'s life and thrown once; Leblanc swings three times before the Thunder; the Thunder goes to whoever has the most life', () => {
    expect(LUCA_POTION_DIVISOR).toBe(5);
    expect(cardText()).toMatch(/under a fifth of his life, and never again/);
    expect(docText()).toMatch(/down to a fifth of his HP, Logos throws him one Potion, once/);
    expect(cardText()).toMatch(/swings three times and then casts Thunder on whoever has the most life/);
    expect(docText()).toMatch(/swings three times and then casts Thunder on whoever has the most HP/);
  });

  it('the shield goes to the girl farthest from Ormi, Rikku at the start (the scene\'s positions), and Logos goes first', () => {
    for (const text of [cardText(), docText()]) expect(text).toMatch(/farthest from him, Rikku at the start/);
    expect(cardText()).toMatch(/Take Logos first/);
    expect(docText()).toMatch(/Take him first/);
  });

  it('Leblanc can be blinded (the row does not wall Darkness) and Darkness Dance is Yuna\'s one command; the page says her Thunder never misses', () => {
    expect((x2LucaLeblanc.immunities as Record<string, number | undefined>)['darkness'] ?? 0).toBe(0);
    expect(cardText()).toMatch(/Darkness Dance is her one command/);
    expect(docText()).toMatch(/Darkness Dance is her one command/);
    expect(docText()).toMatch(/Thunder never misses/);
  });
});
