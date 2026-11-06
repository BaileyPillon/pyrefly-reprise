/**
 * Yuna's Ballad (the hidden FFX-2 chapter): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register"; `guide-doc.test.ts`:
 * one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under both fighters' ids, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for (Warrior or Gunner, the three potions, Cura) or the attack row; the rules and hints cite in the corpus's own form.
 * 3. **The numbers the player reads are the data's**: Rikku's and Paine's HP, the throws' 281 to 317, the draw's shares (four, two and one in ten), Paine's Defense 70 and Magic Defense 7, the ailments that land and
 *    the ones that do not, and Paine's Champion Belt.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_YUNAS_BALLAD } from '../../../src/data/chapter-ffx2-yunas-ballad.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_YUNAS_BALLAD_GUIDE, YUNAS_BALLAD_GUIDE_IDS } from '../../../src/data/guides/ffx2-yunas-ballad.ts';
import { FFX2_YUNAS_BALLAD_DOC } from '../../../src/data/guides/docs/ffx2-yunas-ballad.ts';
import { x2PossessedPaine, x2PossessedRikku } from '../../../src/data/ffx2/enemies/yunas-ballad.ts';
import { RIKKU_DRAW_MODULUS } from '../../../src/battle/ffx2/ai/yunas-ballad.ts';
import { YUNAS_BALLAD_BOSS_IDS } from '../../../src/engine/tactics/ffx2-yunas-ballad.ts';
import { COMMAND_RECORDS_YUNAS_BALLAD } from '../../../src/data/ffx2/command-records/yunas-ballad.ts';

const docText = (): string =>
  FFX2_YUNAS_BALLAD_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_YUNAS_BALLAD_GUIDE.rules.map((r) => r.text), ...FFX2_YUNAS_BALLAD_GUIDE.hints.map((h) => h.text), ...FFX2_YUNAS_BALLAD_GUIDE.phases.map((p) => p.note)].join(' ');

describe('registration', () => {
  it('the card and the document are the chapter\'s, under both fighters, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_YUNAS_BALLAD_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_YUNAS_BALLAD_DOC);
    expect(guideForChapter(FFX2_YUNAS_BALLAD.id)).toBe(FFX2_YUNAS_BALLAD_GUIDE);
    expect([...FFX2_YUNAS_BALLAD_GUIDE.bossIds]).toEqual([...YUNAS_BALLAD_GUIDE_IDS]);
    expect([...YUNAS_BALLAD_BOSS_IDS]).toEqual([...YUNAS_BALLAD_GUIDE_IDS]);
    expect([...FFX2_YUNAS_BALLAD_DOC.bossIds]).toEqual([...YUNAS_BALLAD_GUIDE_IDS]);
    expect(FFX2_YUNAS_BALLAD_DOC.game).toBe('ffx2');
    expect(FFX2_YUNAS_BALLAD_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule and hint cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['warrior', 'gunner', 'x-potion', 'hi-potion', 'potion', 'cura', 'pray']);
    for (const h of FFX2_YUNAS_BALLAD_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      if (h.when.labels === undefined) expect(h.when.kinds, h.text).toEqual(['attack']);
      expect(h.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    }
    for (const r of FFX2_YUNAS_BALLAD_GUIDE.rules) expect(r.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    for (const p of FFX2_YUNAS_BALLAD_GUIDE.phases) expect(p.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  const fmt = (n: number): string => n.toLocaleString('en-US');

  it('the document prints both fighters\' HP, Paine\'s drop and the table; the page and the data agree', () => {
    const text = docText();
    expect(text).toContain(fmt(x2PossessedRikku.hp));
    expect(text).toContain(fmt(x2PossessedPaine.hp));
    expect(text).toContain('Champion Belt');
    expect(x2PossessedPaine.rewards.drops.map((d) => d.itemId)).toEqual(['champion-belt']);
    expect(text).toContain(String(x2PossessedRikku.stats.mdef)); // Rikku's Magic Defense 82
    expect(text).toContain(`Defense is ${x2PossessedPaine.stats.def}`);
    expect(text).toContain(`Magic Defense is only ${x2PossessedPaine.stats.mdef}`);
  });

  it('the draw the card and the page print (four, two and one in ten) is the script\'s modulus, and the throws\' range is the record\'s 281 to 317', () => {
    expect(RIKKU_DRAW_MODULUS).toBe(10);
    expect(cardText()).toMatch(/four in ten/);
    expect(cardText()).toMatch(/two in ten/);
    expect(cardText()).toMatch(/one in ten/);
    expect(docText()).toMatch(/Four times in ten/);
    expect(docText()).toMatch(/281 and 317/);
    // formula 8, power 6: `v x 6 x 50 / 256` with the variance 240 to 271 is 281 to 317 (the engine's own check is `yunas-ballad-engine.test.ts`)
    const throwRow = COMMAND_RECORDS_YUNAS_BALLAD['x2-possessed-rikku-bomb-core']!;
    expect([throwRow.formula, throwRow.power]).toEqual([8, 6]);
    expect([Math.floor((240 * 6 * 50) / 256), Math.floor((271 * 6 * 50) / 256)]).toEqual([281, 317]);
  });

  it('what lands and what does not: Sleep, Slow, Darkness, Confuse and Berserk land; Stop, Silence and Poison do not', () => {
    for (const enemy of [x2PossessedRikku, x2PossessedPaine]) {
      const resisted = (s: string): number => (enemy.immunities as Record<string, number | undefined>)[s] ?? 0;
      for (const s of ['sleep', 'slow', 'darkness', 'confuse', 'berserk']) expect(resisted(s), `${enemy.id} ${s}`).toBe(0);
      for (const s of ['stop', 'silence', 'poison']) expect(resisted(s), `${enemy.id} ${s}`).toBe(255);
    }
    expect(docText()).toMatch(/Sleep, slowed, blinded or enraged/);
    expect(docText()).toMatch(/not Stopped, Silenced or poisoned/);
  });

  it('Confuse is not offered as an answer: the byte reads 0 (it lands) but the engine leaves a Confused monster to its script (pick YB9), so neither the card nor the page prints it', () => {
    expect((x2PossessedRikku.immunities as Record<string, number | undefined>)['confuse'] ?? 0).toBe(0);
    expect(cardText()).not.toMatch(/confus/i);
    expect(docText()).not.toMatch(/confus/i);
    expect(FFX2_YUNAS_BALLAD_GUIDE.rules.map((r) => r.short).join(' ')).not.toMatch(/confus/i);
  });

  it('the cadence the card and the page print is the engine\'s measured pace (yunas-ballad-engine.test.ts: Rikku 6 s, Paine 7.5 s with Yuna defending), not the note\'s recovery steps', () => {
    expect(cardText()).toContain('She acts about every six seconds');
    expect(docText()).toContain('She acts about every six seconds');
    expect(cardText()).toContain('every seven or eight seconds');
    expect(docText()).toContain('every seven or eight seconds');
    expect(cardText()).not.toMatch(/every four seconds/);
    expect(docText()).not.toMatch(/every four seconds/);
  });

  it('"a White Mage has no attack" cites the combat-core note\'s White Mage section (3.5), not the Den note, and the page says a Warrior needs about ten blows (the engine test measures them)', () => {
    const whiteMage = FFX2_YUNAS_BALLAD_GUIDE.rules.find((r) => /no attack/.test(r.text))!;
    expect(whiteMage.cite).toBe('ffx2-combat-core §3.5');
    for (const h of FFX2_YUNAS_BALLAD_GUIDE.hints) if (/no attack|cannot attack/.test(h.text)) expect(h.cite, h.text).toBe('ffx2-combat-core §3.5');
    expect(docText()).toContain('about ten blows');
    expect(docText()).not.toMatch(/scrape/);
  });
});
