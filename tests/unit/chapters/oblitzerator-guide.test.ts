/**
 * The Oblitzerator guide card and page (FFX only; `src/data/guides/oblitzerator.ts`, `docs/oblitzerator.ts`), added with the chapter's line (`src/engine/tactics/oblitzerator.ts`): the project's registries pair a tactic with a
 * card and a page (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form, that the page's HP, Steal and Drops are the data's, that every label a hint speaks to is a row the line asks for,
 * that the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { oblitzeratorGroup } from '../../../src/data/ffx/enemies/oblitzerator.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { OBLITZERATOR_GUIDE, OBLITZERATOR_GUIDE_IDS } from '../../../src/data/guides/oblitzerator.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { OBLITZERATOR_BOSS_IDS } from '../../../src/engine/tactics/oblitzerator.ts';
import { OBLITZERATOR, newEngine } from '../helpers/oblitzeratorDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and the machine, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same boss as the tactic and the formation, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'oblitzerator')).toBe(OBLITZERATOR_GUIDE);
    expect(OBLITZERATOR_GUIDE.bossIds).toEqual([...OBLITZERATOR_BOSS_IDS]);
    expect(OBLITZERATOR_GUIDE_IDS).toEqual(['oblitzerator']);
    expect(oblitzeratorGroup.enemies.some((e) => e.id === OBLITZERATOR_GUIDE_IDS[0])).toBe(true);
    expect(OBLITZERATOR_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(OBLITZERATOR_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of OBLITZERATOR_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file), and the chapter\'s own note', () => {
    for (const r of OBLITZERATOR_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of OBLITZERATOR_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of OBLITZERATOR_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    for (const x of [...OBLITZERATOR_GUIDE.rules, ...OBLITZERATOR_GUIDE.hints, ...OBLITZERATOR_GUIDE.phases]) expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-oblitzerator-crane §/);
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Thunder', 'Haste', 'Use crane', 'Potion', 'Phoenix Down'];
    for (const h of OBLITZERATOR_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('says what the game does: the crane first, nobody swings at the machine, the balls one time in three, the speed-up; and invents no number', () => {
    const rules = OBLITZERATOR_GUIDE.rules.map((r) => r.text).join(' ');
    expect(rules).toMatch(/Lulu casts Thunder at it three times and it wakes/);
    expect(rules).toMatch(/fifteen sixteenths/);
    expect(rules).toMatch(/one time in three/);
    expect(rules).toMatch(/nobody swings/);
    expect(rules).toMatch(/twice as fast/);
    // every digit string the card prints is one of the note's: 32 to 39 a ball (RE 4.1), 400 (a member the Rush could fell: 330 to 390 on one, RE 4.1)
    const all = [...OBLITZERATOR_GUIDE.rules.map((r) => r.text), ...OBLITZERATOR_GUIDE.hints.map((h) => h.text), ...OBLITZERATOR_GUIDE.phases.map((p) => p.note)].join(' ');
    for (const n of all.match(/\d[\d,]*/g) ?? []) expect(['32', '39', '400'], n).toContain(n);
  });
});

describe('the page: the header, the stat lines the data holds, and the strategy', () => {
  it('is registered with the card\'s boss, prints the record\'s HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('oblitzerator')!;
    expect(doc).toMatchObject({ id: 'oblitzerator', game: 'ffx', bossIds: ['oblitzerator'] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('oblitzerator'))).toBe(true);
    const boss = oblitzeratorGroup.enemies.find((e) => e.id === OBLITZERATOR)!;
    const hp = doc.blocks.find((b) => b.t === 'field' && b.label === 'HP');
    expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null).toBe(boss.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Potion (common)', 'Potion (rare)']);
    expect(boss.rewards.steal?.common).toEqual({ itemId: 'potion', count: 1 });
    expect(boss.rewards.steal?.rare).toEqual({ itemId: 'potion', count: 1 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Elixir']);
    expect(boss.rewards.drops).toEqual([{ itemId: 'elixir', count: 1 }]);
  });

  it('the page\'s numbers are the note\'s: 32 to 39 a ball, 5,625 from full, 375 left, twelve to fourteen Thunders, thirty to forty blows', () => {
    const doc = docForChapter('oblitzerator')!;
    const text = JSON.stringify(doc.blocks);
    for (const phrase of ['32 to 39', '5,625', '375', 'twelve to fourteen', 'thirty to forty', 'fifteen sixteenths']) expect(text, phrase).toContain(phrase);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on the machine\'s board and on no board without it', () => {
    const engine = newEngine(1);
    expect(guideForState(engine.state())?.id).toBe('oblitzerator');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, [OBLITZERATOR]: { id: OBLITZERATOR, side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('oblitzerator');
  });

  it('seeds 1 to 3, played by the line: every NEXT line equals intendedStrategy\'s pick, and the card gives a reason for at least nine rows in ten', () => {
    let rows = 0;
    let reasoned = 0;
    const unexplained: string[] = [];
    for (const seed of [1, 2, 3]) {
      const engine = newEngine(seed);
      for (let i = 0; i < 6000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const pick = intendedStrategy(d.actorId, d.commands, engine) as Command | null;
        const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
        expect(view?.chapterId).toBe('oblitzerator');
        expect(JSON.stringify(view?.next?.command ?? null), `seed ${seed}`).toBe(JSON.stringify(pick));
        if (pick) {
          rows += 1;
          if (view?.next?.reason) reasoned += 1;
          else unexplained.push(`${d.actorId}: ${view?.next?.label}`);
        }
        engine.submit(pick ?? { kind: 'defend', targets: [] });
      }
    }
    expect(rows).toBeGreaterThan(20);
    expect(reasoned / rows, `unexplained rows: ${[...new Set(unexplained)].join('; ')}`).toBeGreaterThanOrEqual(0.9);
  }, 120_000);
});
