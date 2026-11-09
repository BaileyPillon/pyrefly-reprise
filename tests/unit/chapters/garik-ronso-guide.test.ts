/**
 * Garik Ronso and the Ronso Youths (the hidden FFX-2 chapter): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register";
 * `guide-doc.test.ts`: one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under its five bodies, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for; the rules, hints and phases cite in the corpus's own form (an RE note is a research slug too).
 * 3. **The numbers the player reads are the data's**: both pools, the guard's seventh turn, the roll of four, the roll of eight, the bout's beat, the Black Mage rule, what a Dispel strips and what Darkness ignores, the steals and the drops.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_GARIK_RONSO } from '../../../src/data/chapter-ffx2-garik-ronso.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_GARIK_RONSO_GUIDE, GARIK_RONSO_GUIDE_IDS } from '../../../src/data/guides/ffx2-garik-ronso.ts';
import { FFX2_GARIK_RONSO_DOC } from '../../../src/data/guides/docs/ffx2-garik-ronso.ts';
import { garikFriendlyGroup, garikHostileGroup, x2GarikRonso, x2RonsoYouthA } from '../../../src/data/ffx2/enemies/garik-ronso.ts';
import { MIGHTY_GUARD_STATUSES, x2GarikRonsoAbilities } from '../../../src/data/ffx2/enemies/garik-ronso-abilities.ts';
import { ABILITIES } from '../../../src/data/ffx2/index.ts';
import { GARIK_BOUT_PROTECT_AT, GARIK_BOUT_SHELL_AT, GARIK_DRAW_MODULUS, GARIK_GUARD_AT, YOUTH_DRAW_MODULUS } from '../../../src/battle/ffx2/ai/garik-ronso.ts';
import { GARIK_RONSO_BOSS_IDS } from '../../../src/engine/tactics/ffx2-garik-ronso.ts';

const docText = (): string =>
  FFX2_GARIK_RONSO_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_GARIK_RONSO_GUIDE.rules.map((r) => r.text), ...FFX2_GARIK_RONSO_GUIDE.hints.map((h) => h.text), ...FFX2_GARIK_RONSO_GUIDE.phases.map((p) => p.note)].join(' ');
const fmt = (n: number): string => n.toLocaleString('en-US');
const total = (hp: number[]): number => hp.reduce((a, b) => a + b, 0);

describe('registration', () => {
  it('the card and the document are the chapter\'s, under its five bodies, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_GARIK_RONSO_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_GARIK_RONSO_DOC);
    expect(guideForChapter(FFX2_GARIK_RONSO.id)).toBe(FFX2_GARIK_RONSO_GUIDE);
    expect([...FFX2_GARIK_RONSO_GUIDE.bossIds]).toEqual([...GARIK_RONSO_GUIDE_IDS]);
    expect([...GARIK_RONSO_BOSS_IDS]).toEqual([...GARIK_RONSO_GUIDE_IDS]);
    expect([...FFX2_GARIK_RONSO_DOC.bossIds]).toEqual([...GARIK_RONSO_GUIDE_IDS]);
    expect(FFX2_GARIK_RONSO_DOC.game).toBe('ffx2');
    expect(FFX2_GARIK_RONSO_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
    expect(FFX2_GARIK_RONSO_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(FFX2_GARIK_RONSO_GUIDE.rules.length).toBeLessThanOrEqual(5);
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['darkness', 'protect', 'curaga', 'cura', 'hi-potion', 'phoenix down', 'life', 'pray']);
    const cite = /^(re-)?ffx2-[a-z0-9-]+ §/;
    for (const h of FFX2_GARIK_RONSO_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      expect(h.cite).toMatch(cite);
    }
    for (const r of FFX2_GARIK_RONSO_GUIDE.rules) expect(r.cite).toMatch(cite);
    for (const p of FFX2_GARIK_RONSO_GUIDE.phases) expect(p.cite).toMatch(cite);
  });

  it('there is no Shell hint and no Dispel hint: the tactic asks for neither, and the card says why (nothing here is magic; Darkness ignores the guard)', () => {
    expect(FFX2_GARIK_RONSO_GUIDE.hints.some((h) => (h.when.labels ?? []).some((l) => ['shell', 'dispel'].includes(l.toLowerCase())))).toBe(false);
    expect(cardText()).toMatch(/there is no magic to Shell against/);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  it('the pools: 15,000 HP in the hostile fight and 10,940 in the bout, on the card and on the page, and each is the sum of the bodies', () => {
    expect(total(garikHostileGroup.enemies.map((e) => e.hp))).toBe(15_000);
    expect(total(garikFriendlyGroup.enemies.map((e) => e.hp))).toBe(10_940);
    for (const text of [cardText(), docText()]) {
      expect(text).toContain('15,000');
      expect(text).toContain('10,940');
    }
  });

  it('the page prints the bodies\' HP, the steals and the drops, and the data agrees', () => {
    const text = docText();
    expect(text).toContain(fmt(x2GarikRonso.hp));
    expect(text).toContain(fmt(x2RonsoYouthA.hp));
    for (const name of ['Icy Gleam', 'Mythril Bangle', 'Shining Bracer', 'Remedy']) expect(text).toContain(name);
    expect(x2GarikRonso.rewards.steal?.common.itemId).toBe('icy-gleam');
    expect(x2RonsoYouthA.rewards.steal?.common.itemId).toBe('mythril-bangle');
    expect(x2GarikRonso.rewards.drops.map((d) => d.itemId)).toEqual(['shining-bracer']);
    expect(x2RonsoYouthA.rewards.drops.map((d) => d.itemId)).toEqual(['x2-remedy']);
  });

  it('the guard on his seventh turn, the roll of four (Blind one in four) and the roll of eight (MP Blowout one in eight) are the script\'s; the bout\'s beat is Protect first and Shell on the fifth', () => {
    expect([GARIK_GUARD_AT, GARIK_DRAW_MODULUS, YOUTH_DRAW_MODULUS]).toEqual([7, 4, 8]);
    for (const text of [cardText(), docText()]) expect(text).toMatch(/seventh turn/);
    expect(cardText()).toMatch(/three turns in four/);
    expect(cardText()).toMatch(/one in four/);
    expect(cardText()).toMatch(/One turn in eight/);
    expect(docText()).toMatch(/one turn in four/);
    expect(docText()).toMatch(/one turn in eight/);
    expect(GARIK_BOUT_PROTECT_AT).toBe(4); // the counter starts at 3, so the first poll is Protect; Shell is the eighth poll in the cycle: the fifth turn
    expect(GARIK_BOUT_SHELL_AT - 3).toBe(5);
    expect(cardText()).toMatch(/Protect first, Shell on his fifth turn/);
    expect(docText()).toMatch(/Protect on himself, three blows, Shell on himself, three blows/);
  });

  it('Mighty Guard is Shell, Protect, Regen and Haste and Defense, Magic Defense and Evasion up, on his whole side; the page and the card list the same seven', () => {
    expect(MIGHTY_GUARD_STATUSES.map((s) => s.status)).toEqual(['shell', 'protect', 'regen', 'haste', 'def-up', 'mdef-up', 'eva-up']);
    expect(ABILITIES['x2-dark-knight-darkness']!.damageType).toBe('other');
    expect(x2GarikRonsoAbilities.find((a) => a.id === 'x2-garik-mighty-guard')!.targeting).toBe('all-allies');
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Shell, Protect, Regen and Haste, and higher Defense, Magic Defense and Evasion/);
      expect(text).toMatch(/Dispel strips the first four/);
      expect(text).toMatch(/Darkness ignores/);
    }
  });

  it('Bane Lance curses the first of Yuna, Rikku and Paine who wears Black Mage and is not cursed; a cursed girl cannot change dresspheres (the card and the page say so)', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Yuna, Rikku and Paine|Yuna before Rikku before Paine/);
      expect(text).toMatch(/cannot change dresspheres/);
      expect(text).toMatch(/Black Mage/);
    }
    expect(x2GarikRonsoAbilities.find((a) => a.id === 'x2-garik-bane-lance')!.statusEffects).toEqual([{ status: 'curse', chance: 254, duration: 0 }]);
  });

  it('every blow of his and the Youths\' is physical (the card says Protect halves it): Attack, Bane Lance and MP Blowout', () => {
    for (const id of ['x2-garik-attack', 'x2-garik-bane-lance', 'x2-ronso-youth-attack', 'x2-ronso-youth-mp-blowout']) expect(x2GarikRonsoAbilities.find((a) => a.id === id)!.damageType, id).toBe('physical');
    expect(cardText()).toMatch(/Protect halves it/);
  });

  it('a delay slows a Youth and does nothing to Garik (the card says so, the special words back it)', () => {
    expect(x2RonsoYouthA.immunityFlags).not.toContain('immune-to-delay');
    expect(x2GarikRonso.immunityFlags).toContain('immune-to-delay');
    expect(cardText()).toMatch(/delay slows a Youth and does nothing to Garik/);
    expect(docText()).toMatch(/A delay does slow a Youth/);
    expect(docText()).toMatch(/a delay does nothing to him/);
  });
});
