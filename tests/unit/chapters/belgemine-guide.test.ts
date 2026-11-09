/**
 * Belgemine's Challenge's guide card and page (FFX only; `src/data/guides/belgemine.ts`, `docs/belgemine.ts`), added with the chapter's line (`src/engine/tactics/belgemine.ts`): the project's registries pair a tactic with a card
 * and a page (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form and names the chapter's note, that the card prints no number (the HUD's are the numbers), that the page's HP lines are the
 * data's, that every label a hint speaks to is a row the line asks for, that the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { BELGEMINE_GROUPS } from '../../../src/data/ffx/enemies/belgemine.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { BELGEMINE_GUIDE, BELGEMINE_GUIDE_IDS } from '../../../src/data/guides/belgemine.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { BELGEMINE_CHAPTER_BOSS_IDS } from '../../../src/engine/tactics/belgemine.ts';
import { ACT_KEYS, defendOrAttack, newEngine } from '../helpers/belgemineDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and the eight foes, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same bosses as the tactic and the formations, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'belgemine')).toBe(BELGEMINE_GUIDE);
    expect(BELGEMINE_GUIDE.bossIds).toEqual([...BELGEMINE_CHAPTER_BOSS_IDS]);
    expect([...BELGEMINE_GUIDE_IDS]).toEqual([...BELGEMINE_CHAPTER_BOSS_IDS]);
    const foes = BELGEMINE_GROUPS.flatMap((g) => g.enemies.map((e) => e.id)).filter((id) => id.startsWith('belg-') && id !== 'belg-daigoro');
    expect([...new Set(foes)].sort()).toEqual([...BELGEMINE_GUIDE_IDS].sort());
    expect(BELGEMINE_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(BELGEMINE_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of BELGEMINE_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('gives every link a headline of its own', () => {
    expect(Object.keys(BELGEMINE_GUIDE.linkTitles ?? {}).sort()).toEqual([...BELGEMINE_GUIDE_IDS].sort());
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file), each naming the chapter\'s note', () => {
    for (const x of [...BELGEMINE_GUIDE.rules, ...BELGEMINE_GUIDE.hints, ...BELGEMINE_GUIDE.phases]) {
      expect(x.cite).toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-belgemine-aeon-duels §/);
    }
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Grand Summon', 'Shield'];
    for (const h of BELGEMINE_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('prints no number: the card teaches each aeon\'s habit and the numbers are the HUD\'s', () => {
    const all = [...BELGEMINE_GUIDE.rules.map((r) => `${r.text} ${r.short}`), ...BELGEMINE_GUIDE.hints.map((h) => h.text), ...BELGEMINE_GUIDE.phases.map((p) => p.note)].join(' ');
    expect(all.match(/\d/g) ?? []).toEqual([]);
  });

  it('says what the game does: the habits (the Ray, Meteor Strike, the guard, five quiet turns, Pain) and the Sisters\' order', () => {
    const phases = BELGEMINE_GUIDE.phases.map((p) => p.note).join(' ');
    expect(phases).toMatch(/magical hit wakes her Energy Ray/);
    expect(phases).toMatch(/answers a physical hit with Meteor Strike/);
    expect(phases).toMatch(/braces/);
    expect(phases).toMatch(/Five quiet turns, then Mega Flare/);
    expect(phases).toMatch(/Pain kills outright/);
    expect(BELGEMINE_GUIDE.rules.map((r) => r.text).join(' ')).toMatch(/strike Cindy first/);
  });
});

describe('the page: the header and the HP line of each duel, and the strategy', () => {
  it('is registered with the card\'s bosses and has one header per duel in play order, each HP line the data\'s', () => {
    const doc = docForChapter('belgemine')!;
    expect(doc).toMatchObject({ id: 'belgemine', game: 'ffx' });
    expect([...doc.bossIds].sort()).toEqual([...BELGEMINE_GUIDE_IDS].sort());
    const heads = doc.blocks.filter((b) => b.t === 'head') as Array<{ t: 'head'; title: string; at?: readonly string[] }>;
    expect(heads.map((h) => h.title)).toEqual(['Valefor', 'Ifrit', 'Ixion', 'Shiva', 'Bahamut', 'Yojimbo', 'Anima', 'The Magus Sisters']);
    const hp = doc.blocks.filter((b) => b.t === 'field' && /HP$/.test(b.label)) as Array<{ t: 'field'; label: string; value: string }>;
    expect(hp).toHaveLength(10); // seven single duels, and the Sisters' three bodies one line each (the guide-doc audit reads one number a line)
    const num = (i: number): number => Number(hp[i]!.value.replace(/,/g, ''));
    BELGEMINE_GROUPS.slice(0, 7).forEach((g, i) => expect(num(i), g.id).toBe(g.enemies.find((e) => e.id.startsWith('belg-') && e.id !== 'belg-daigoro')!.stats.maxHp));
    const sisters = BELGEMINE_GROUPS[7]!.enemies.filter((e) => e.id.startsWith('belg-'));
    expect(hp.slice(7).map((h) => h.label)).toEqual(['Cindy HP', 'Sandy HP', 'Mindy HP']);
    expect(hp.slice(7).map((_, i) => num(7 + i))).toEqual(['belg-cindy', 'belg-sandy', 'belg-mindy'].map((id) => sisters.find((e) => e.id === id)!.stats.maxHp));
    for (const h of heads) expect(h.at?.length, h.title).toBeGreaterThan(0);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on every act\'s board and on no FFX-2 board that holds one of the foes', () => {
    for (const key of ACT_KEYS) expect(guideForState(newEngine(key, 1).state())?.id, key).toBe('belgemine');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, 'belg-valefor': { id: 'belg-valefor', side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('belgemine');
  });

  it('seeds 1 to 3 of the Valefor, Ixion and Sisters duels, played by the line: every NEXT line equals intendedStrategy\'s pick, and the card gives a reason for at least nine rows in ten', () => {
    let rows = 0;
    let reasoned = 0;
    const unexplained: string[] = [];
    for (const key of ['valefor', 'ixion', 'sisters'] as const) {
      for (const seed of [1, 2, 3]) {
        const engine = newEngine(key, seed);
        for (let i = 0; i < 3000; i++) {
          const d = engine.nextDecision();
          if (d.kind === 'battle-over') break;
          if (d.kind !== 'player-input') continue;
          const pick = intendedStrategy(d.actorId, d.commands, engine) as Command | null;
          const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
          expect(view?.chapterId).toBe('belgemine');
          expect(JSON.stringify(view?.next?.command ?? null), `${key} seed ${seed}`).toBe(JSON.stringify(pick));
          if (pick) {
            rows += 1;
            if (view?.next?.reason) reasoned += 1;
            else unexplained.push(`${d.actorId}: ${view?.next?.label}`);
          }
          engine.submit(pick ?? defendOrAttack(d, engine));
        }
      }
    }
    expect(rows).toBeGreaterThan(30);
    expect(reasoned / rows, `unexplained rows: ${[...new Set(unexplained)].join('; ')}`).toBeGreaterThanOrEqual(0.9);
  }, 120_000);
});
