/**
 * Jenova LIFE's guide card and page teach the line the bench plays (FF7 only; `src/data/guides/ff7-jenova-life.ts`, `docs/ff7-jenova-life.ts`; hidden chapter 44, the word `bluelight`).
 *
 * The line is the public guides', in our own words, and it is the line `docs/handoff/ch-jenova-life.md` plays on the real engine: blows and Limit breaks and not spells, Quake2 as one free opener, MBarrier and
 * Cure2 against Aqualung, never Water at her. What is pinned: the registration of the card and the page (the registries pair them); that every rule, hint and phase is cited in the corpus form; that each
 * teaching is in the card and the page; that the page prints the data's HP, MP and drop; that the card invents no number; that the hint labels are rows the party's Magic window really has; and the tripwire: no move
 * advisor line is registered for Jenova LIFE (the advisor is off for FF7), so the day one is registered this test fails and says to point it at the guide.
 */
import { describe, expect, it } from 'vitest';

import { buildCommands } from '../../../src/battle/ff7/index.ts';
import { jenovaLife } from '../../../src/data/ff7/index.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { FF7_JENOVA_LIFE_GUIDE, FF7_JENOVA_LIFE_GUIDE_IDS } from '../../../src/data/guides/ff7-jenova-life.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { CHAPTER_GAME } from '../../../src/engine/tactics/lookup.ts';
import { TACTICS } from '../../../src/engine/tactics/index.ts';
import { docStrings } from '../helpers/guideDocStrings.ts';
import { jlEnv } from '../helpers/jenova.ts';

const cite = /^ff7-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and its one body, and cites every sentence it prints', () => {
  it('is in GUIDES and CHAPTER_GAME (FF7), names the formation\'s enemy, and keeps three to five rules with short lines that fit the rail', () => {
    expect(GUIDES.find((g) => g.id === 'ff7-jenova-life')).toBe(FF7_JENOVA_LIFE_GUIDE);
    expect(CHAPTER_GAME['ff7-jenova-life']).toBe('ff7');
    expect([...FF7_JENOVA_LIFE_GUIDE_IDS]).toEqual([jenovaLife.id]);
    expect(FF7_JENOVA_LIFE_GUIDE.bossIds).toEqual([jenovaLife.id]);
    expect(FF7_JENOVA_LIFE_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(FF7_JENOVA_LIFE_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of FF7_JENOVA_LIFE_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form and names the chapter\'s own note somewhere in each rule', () => {
    for (const x of [...FF7_JENOVA_LIFE_GUIDE.rules, ...FF7_JENOVA_LIFE_GUIDE.hints, ...FF7_JENOVA_LIFE_GUIDE.phases]) {
      expect(x.cite, 'a cite in the corpus form').toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s note or the battle core').toMatch(/ff7-jenova-life §|ff7-battle-core §/);
    }
    for (const r of FF7_JENOVA_LIFE_GUIDE.rules) expect(r.cite, r.short).toMatch(/ff7-jenova-life §/);
  });

  it('every label a hint speaks to is a row the party\'s command window really has (the labels cannot drift from the data)', () => {
    const { env, u } = jlEnv(2);
    const labels = new Set<string>();
    for (const id of ['cloud', 'tifa', 'barret']) for (const row of buildCommands(env, u(id))) labels.add(row.label.replace(/ x\d+$/, ''));
    for (const h of FF7_JENOVA_LIFE_GUIDE.hints) for (const label of h.when.labels ?? []) expect(labels, label).toContain(label);
  });

  it('invents no number: every figure the card prints is the note\'s (a thousand is the Aqualung, three quarters and the dial\'s steps are the phases)', () => {
    const text = [...FF7_JENOVA_LIFE_GUIDE.rules.map((r) => r.text), ...FF7_JENOVA_LIFE_GUIDE.hints.map((h) => h.text), ...FF7_JENOVA_LIFE_GUIDE.phases.map((p) => p.note)].join(' ');
    const allowed = ['300']; // her MP
    const numbers = text.replace(/\b[A-Z][a-z]+[23]\b/g, '').match(/\d[\d,]*/g) ?? []; // the spell names Quake2, Cure2, Bolt3... carry a tier, not a figure
    for (const n of numbers) expect(allowed, n).toContain(n);
  });

  it('the phases are the dial\'s three steps, in order', () => {
    expect(FF7_JENOVA_LIFE_GUIDE.phases.map((p) => p.belowHpFraction)).toEqual([0.75, 0.5, 0.25]);
  });
});

describe('the teachings are in the card and the page', () => {
  const doc = docForChapter('ff7-jenova-life')!;
  const page = docStrings(doc).join('\n');
  const rules = FF7_JENOVA_LIFE_GUIDE.rules.map((r) => r.text).join('\n');

  it('blows and Limit breaks, not spells; Quake2 as one free hit; MBarrier and Cure2 for Aqualung; never Water at her', () => {
    expect(rules).toMatch(/Strike her; do not cast at her/);
    expect(rules).toMatch(/Limit breaks are not spells/);
    expect(rules).toMatch(/Quake2 is a free opener/);
    expect(rules).toMatch(/MBarrier halves it and Cure2/);
    expect(rules).toMatch(/Never aim a Water spell at her/);
    expect(page).toMatch(/A blow is not a spell, and nor is a Limit break/);
    expect(page).toMatch(/Quake2 before the Reflect is a free extra hit/);
    expect(page).toMatch(/Put MBarrier on all three of you early/);
    expect(page).toMatch(/never aim Water at her/);
  });

  it('the page is the FF7 chapter\'s, opens on her header, and prints the data\'s HP, MP and drop', () => {
    expect(doc.game).toBe('ff7');
    expect(doc.bossIds).toEqual([jenovaLife.id]);
    expect(doc.blocks[0]).toMatchObject({ t: 'head', title: 'Jenova LIFE' });
    const fields = Object.fromEntries(doc.blocks.filter((b) => b.t === 'field').map((b) => [(b as { label: string }).label, (b as { value: string }).value]));
    expect(fields['HP']).toBe(jenovaLife.ff7!.stats.maxHp.toLocaleString('en-US'));
    expect(fields['MP']).toBe(String(jenovaLife.ff7!.stats.maxMp));
    expect(page).toMatch(/Wizard Bracelet/);
    for (const [ability, mp] of [['Blue Light', 8], ['Blue Flame', 12], ['Aqualung', 34], ['Reflect', 30]] as const) expect(page, ability).toMatch(new RegExp(`${mp} MP`));
  });
});

describe('the tripwire', () => {
  it('no move advisor line is registered for Jenova LIFE; the day one is, point it at this guide line and update this test', () => {
    expect(TACTICS.filter((t) => t.chapterId === 'ff7-jenova-life')).toEqual([]);
  });
});
