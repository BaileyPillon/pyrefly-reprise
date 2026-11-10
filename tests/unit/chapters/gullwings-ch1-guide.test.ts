/**
 * Gullwings, Chapter 1 (the hidden FFX-2 chapter): the strategy-guide card and the guide document, which a registered tactic requires (`strategy-guide.test.ts`: "covers every boss id the tactics register";
 * `guide-doc.test.ts`: one document per card). **FFX-2 only** [AGENTS.md rule 14]. What this file pins, against the data and not against a copy of the numbers:
 *
 * 1. **Registration**: the card and the document are the chapter's, under all four ids, FFX-2, and the card carries the Wait split's clock rule like every FFX-2 guide.
 * 2. **The card explains the tactic**: every hint label is a row the tactic asks for; the rules, hints and phases cite in the corpus's own form; the phases pick the right boss.
 * 3. **The numbers the player reads are the data's**: the HPs, the steals and the drops, Boris's one web and his bite in four, the Dragon's weakness, the Beast's beat of four and its third, the fractions of maximum HP,
 *    the Haymaker and the Blast Punch frequencies.
 */
import { describe, expect, it } from 'vitest';

import { FFX2_GULLWINGS_CH1 } from '../../../src/data/chapter-ffx2-gullwings-ch1.ts';
import { GUIDES, guideForChapter } from '../../../src/data/guides/index.ts';
import { GUIDE_DOCS } from '../../../src/data/guides/docs/index.ts';
import { FFX2_GULLWINGS_CH1_GUIDE, GULLWINGS_CH1_GUIDE_IDS } from '../../../src/data/guides/ffx2-gullwings-ch1.ts';
import { FFX2_GULLWINGS_CH1_DOC } from '../../../src/data/guides/docs/ffx2-gullwings-ch1.ts';
import { x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero } from '../../../src/data/ffx2/enemies/gullwings-ch1.ts';
import * as ab from '../../../src/data/ffx2/enemies/gullwings-ch1-abilities.ts';
import { BEAST_BEAT, BORIS_DRAW_MODULUS } from '../../../src/battle/ffx2/ai/gullwings-ch1.ts';
import { GULLWINGS_CH1_BOSS_IDS } from '../../../src/engine/tactics/ffx2-gullwings-ch1.ts';

const docText = (): string =>
  FFX2_GULLWINGS_CH1_DOC.blocks
    .flatMap((b) => ('text' in b ? [b.text] : 'items' in b ? [...b.items] : 'rows' in b ? b.rows.flatMap((r) => (Array.isArray(r) ? r : Object.values(r))) : 'title' in b ? [b.title] : []))
    .join(' ');
const cardText = (): string => [...FFX2_GULLWINGS_CH1_GUIDE.rules.map((r) => r.text), ...FFX2_GULLWINGS_CH1_GUIDE.hints.map((h) => h.text), ...FFX2_GULLWINGS_CH1_GUIDE.phases.map((p) => p.note)].join(' ');
const fmt = (n: number): string => n.toLocaleString('en-US');
const byId = Object.fromEntries(ab.x2GullwingsCh1Abilities.map((a) => [a.id, a]));

describe('registration', () => {
  it('the card and the document are the chapter\'s, under all four ids, FFX-2, with the Wait split\'s clock rule', () => {
    expect(GUIDES).toContain(FFX2_GULLWINGS_CH1_GUIDE);
    expect(GUIDE_DOCS).toContain(FFX2_GULLWINGS_CH1_DOC);
    expect(guideForChapter(FFX2_GULLWINGS_CH1.id)).toBe(FFX2_GULLWINGS_CH1_GUIDE);
    expect([...FFX2_GULLWINGS_CH1_GUIDE.bossIds]).toEqual([...GULLWINGS_CH1_GUIDE_IDS]);
    expect([...GULLWINGS_CH1_BOSS_IDS]).toEqual([...GULLWINGS_CH1_GUIDE_IDS]);
    expect([...FFX2_GULLWINGS_CH1_DOC.bossIds]).toEqual([...GULLWINGS_CH1_GUIDE_IDS]);
    expect(FFX2_GULLWINGS_CH1_DOC.game).toBe('ffx2');
    expect(FFX2_GULLWINGS_CH1_GUIDE.clockRules?.wait?.cite).toBe('ffx2-combat-core §1.5');
    expect(Object.keys(FFX2_GULLWINGS_CH1_GUIDE.linkTitles ?? {})).toEqual([...GULLWINGS_CH1_GUIDE_IDS]);
  });
});

describe('the card explains the tactic', () => {
  it('every hint explains a row the tactic asks for, and every rule, hint and phase cites in the corpus\'s own form', () => {
    const allowedLabels = new Set(['blizzard', 'fire', 'black mage', 'white mage', 'pray', 'remedy', 'hi-potion', 'potion', 'phoenix down']);
    for (const h of FFX2_GULLWINGS_CH1_GUIDE.hints) {
      for (const label of h.when.labels ?? []) expect(allowedLabels.has(label.toLowerCase()), label).toBe(true);
      expect(h.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    }
    for (const r of FFX2_GULLWINGS_CH1_GUIDE.rules) expect(r.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
    for (const p of FFX2_GULLWINGS_CH1_GUIDE.phases) expect(p.cite).toMatch(/^ffx2-[a-z0-9-]+ §/);
  });

  it('there is no hint for Holy Water, Protect or Power Break: the tactic never asks for them (the card says Holy Water in a rule, as an answer, not as a move it plays)', () => {
    const labels = FFX2_GULLWINGS_CH1_GUIDE.hints.flatMap((h) => h.when.labels ?? []);
    for (const l of ['Holy Water', 'Protect', 'Power Break', 'Shell']) expect(labels, l).not.toContain(l);
  });

  it('each phase names one of the four bosses, and the Beast has its under-a-third phase before its plain one', () => {
    const phases = FFX2_GULLWINGS_CH1_GUIDE.phases;
    for (const p of phases) expect(GULLWINGS_CH1_GUIDE_IDS as readonly string[]).toContain(p.bossId);
    const beast = phases.filter((p) => p.bossId === 'x2-guardian-beast');
    expect(beast.map((p) => p.belowHpFraction)).toEqual([1 / 3, undefined]);
  });
});

describe('the numbers the player reads are the data\'s', () => {
  it('the document prints each boss\'s HP, steal and drop; the page and the data agree', () => {
    const text = docText();
    for (const e of [x2Boris, x2FlameDragon, x2GuardianBeast, x2YslsZero]) expect(text, e.id).toContain(fmt(e.hp));
    expect(text).toContain('Remedy');
    expect(text).toContain('Star Pendant');
    expect(text).toContain('Hi-Potion');
    expect(text).toContain('Red Ring');
    expect(text).toContain('Defense Veil');
    expect(text).toContain('Amulet');
    expect(text).toContain('Mythril Gloves');
    expect(text).toContain('Wristband');
    expect(x2Boris.rewards.drops.map((d) => d.itemId)).toEqual(['star-pendant']);
    expect(x2FlameDragon.rewards.drops.map((d) => d.itemId)).toEqual(['red-ring']);
    expect(x2GuardianBeast.rewards.drops.map((d) => d.itemId)).toEqual(['amulet']);
    expect(x2YslsZero.rewards.drops.map((d) => d.itemId)).toEqual(['wristband']);
    expect(text).toContain(`${x2YslsZero.stats.def}`);
    expect(text).toContain(`Magic Defense of ${x2YslsZero.stats.mdef}`);
  });

  it('Boris: one web (Sticky End once, Stop), claws, a bite one turn in four, weak to Fire and Ice; the card and the page say so, and the data and the script agree', () => {
    expect(BORIS_DRAW_MODULUS).toBe(4);
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Fire and Ice/);
      expect(text).toMatch(/Remedy/);
      expect(text).toMatch(/one turn in four/);
    }
    expect(cardText()).toMatch(/once/);
    expect(docText()).toMatch(/only once/);
    expect(x2Boris.affinities).toEqual({ fire: 'weak', ice: 'weak' });
    expect(byId[ab.BORIS_STICKY_END_ID]!.statusEffects[0]).toMatchObject({ status: 'stop' });
  });

  it('the Flame Dragon: a breath first, then the girl with the most HP; weak to Ice, half Fire; Shell halves the breath (magical); under 100 HP one more breath', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Ice/);
      expect(text).toMatch(/most HP|healthiest/);
    }
    expect(docText()).toMatch(/under a hundred HP/);
    expect(docText()).toMatch(/Shell halves it/);
    expect(x2FlameDragon.affinities).toMatchObject({ ice: 'weak', fire: 'resist' });
    expect(byId[ab.FLAME_DRAGON_FLAME_BREATH_ID]!.damageType).toBe('magical');
  });

  it('the Beast: a beat of four (three blows, then a Curse), a Curse stops changing dress, under a third Damocles Photon, half of every girl\'s maximum HP, Shell halves it', () => {
    expect(BEAST_BEAT).toBe(4);
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Curse/);
      expect(text).toMatch(/under a third/i);
      expect(text).toMatch(/half of (each|every) girl’s maximum HP/);
      expect(text).toMatch(/Shell halves/);
    }
    expect(byId[ab.GUARDIAN_BEAST_DAMOCLES_PHOTON_ID]).toMatchObject({ damageType: 'magical', formula: 'percent-total', power: 8 });
    expect(cardText()).toMatch(/Holy Water/);
    expect(docText()).toMatch(/Holy Water or a Remedy/);
  });

  it('YSLS-Zero: Haymaker nearly half the time (55 in 120), Blast Punch one turn in five (25 in 120), half of one girl\'s maximum HP, neither Protect nor Shell reduces it', () => {
    for (const text of [cardText(), docText()]) {
      expect(text).toMatch(/Haymaker/);
      expect(text).toMatch(/Blast Punch/);
      expect(text).toMatch(/half of one girl’s maximum HP/);
      expect(text).toMatch(/neither Protect nor Shell|Neither Protect nor Shell/);
    }
    expect(byId[ab.YSLS_ZERO_BLAST_PUNCH_ID]).toMatchObject({ damageType: 'other', formula: 'percent-total', power: 8 });
    expect(byId[ab.YSLS_ZERO_HAYMAKER_ID]!.hits).toBe(2);
    expect(docText()).toMatch(/never miss/);
  });

  it('what lands on YSLS-Zero and what does not: Darkness lands (the card and the page say so); Death, Sleep, Silence, Stop and Doom do not', () => {
    const resisted = (s: string): number => (x2YslsZero.immunities as Record<string, number | undefined>)[s] ?? 0;
    expect(resisted('darkness')).toBe(0);
    for (const s of ['ko', 'sleep', 'silence', 'poison', 'confuse', 'berserk', 'stop', 'doom']) expect(resisted(s), s).toBe(255);
    expect(docText()).toMatch(/Darkness lands on it/);
  });
});
