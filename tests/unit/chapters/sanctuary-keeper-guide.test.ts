/**
 * The Sanctuary Keeper's guide card and page (FFX only; `src/data/guides/sanctuary-keeper.ts`, `docs/sanctuary-keeper.ts`), added with the chapter's line (`src/engine/tactics/sanctuary-keeper.ts`): the project's
 * registries pair a tactic with a card and a page (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form, that the page's HP, Steal and Drops are the data's, that every label a hint speaks to is a row the line asks
 * for, that the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { sanctuaryKeeperGroup } from '../../../src/data/ffx/enemies/sanctuary-keeper.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { SANCTUARY_KEEPER_GUIDE, SANCTUARY_KEEPER_GUIDE_IDS } from '../../../src/data/guides/sanctuary-keeper.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { SANCTUARY_KEEPER_BOSS_IDS } from '../../../src/engine/tactics/sanctuary-keeper.ts';
import { KEEPER, newEngine } from '../helpers/sanctuaryDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and the Keeper, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same boss as the tactic and the formation, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'sanctuary-keeper')).toBe(SANCTUARY_KEEPER_GUIDE);
    expect(SANCTUARY_KEEPER_GUIDE.bossIds).toEqual([...SANCTUARY_KEEPER_BOSS_IDS]);
    expect(SANCTUARY_KEEPER_GUIDE_IDS).toEqual(['sanctuary-keeper']);
    expect(sanctuaryKeeperGroup.enemies.map((e) => e.id)).toEqual([...SANCTUARY_KEEPER_GUIDE_IDS]);
    expect(SANCTUARY_KEEPER_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(SANCTUARY_KEEPER_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of SANCTUARY_KEEPER_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file)', () => {
    for (const r of SANCTUARY_KEEPER_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of SANCTUARY_KEEPER_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of SANCTUARY_KEEPER_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    for (const x of [...SANCTUARY_KEEPER_GUIDE.rules, ...SANCTUARY_KEEPER_GUIDE.hints, ...SANCTUARY_KEEPER_GUIDE.phases]) expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-sanctuary-keeper §/);
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Hastega', 'Bio', 'Poison Fang', 'Reflect', 'Dispel', 'Shell', 'Protect', 'Armor Break', 'Esuna', 'Remedy', 'Eye Drops', 'Echo Screen', 'Curaga', 'Hi-Potion', 'X-Potion', 'Mega-Potion', 'Phoenix Down'];
    for (const h of SANCTUARY_KEEPER_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('says what the game does: Poison before Reflect, Shell before the breath, the tail after three to seven blows, the Reflect answer under half; and invents no number', () => {
    const rules = SANCTUARY_KEEPER_GUIDE.rules.map((r) => r.text).join(' ');
    expect(rules).toMatch(/Poison it first, then Reflect it/);
    expect(rules).toMatch(/bounces your own Bio back at you/);
    expect(rules).toMatch(/Mana Breath takes roughly 2,500 to 3,600/);
    expect(rules).toMatch(/after three to seven it lashes/);
    expect(rules).toMatch(/Under half, it aims its healing at anyone of yours who holds Reflect/);
    // every number the card prints is one of the note's: nearly 10,000, 2,000, 2,500 to 3,600, three to seven
    const all = [...SANCTUARY_KEEPER_GUIDE.rules.map((r) => r.text), ...SANCTUARY_KEEPER_GUIDE.hints.map((h) => h.text), ...SANCTUARY_KEEPER_GUIDE.phases.map((p) => p.note)].join(' ');
    for (const n of all.match(/\d[\d,]*/g) ?? []) expect(['10,000', '2,000', '2,500', '3,600'], n).toContain(n);
  });
});

describe('the page: the header, the stat lines the data holds, and the strategy', () => {
  it('is registered with the card\'s boss, prints the record\'s HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('sanctuary-keeper')!;
    expect(doc).toMatchObject({ id: 'sanctuary-keeper', game: 'ffx', bossIds: ['sanctuary-keeper'] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('sanctuary-keeper'))).toBe(true);
    const keeper = sanctuaryKeeperGroup.enemies[0]!;
    const hp = doc.blocks.find((b) => b.t === 'field' && b.label === 'HP');
    expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null).toBe(keeper.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Turbo Ether (common)', 'Turbo Ether x2 (rare)']);
    expect(keeper.rewards.steal?.common).toEqual({ itemId: 'turbo-ether', count: 1 });
    expect(keeper.rewards.steal?.rare).toEqual({ itemId: 'turbo-ether', count: 2 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Return Sphere']);
    expect(keeper.rewards.drops).toEqual([{ itemId: 'return-sphere', count: 1 }]);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on the Keeper\'s board and on no other FFX board without the Keeper', () => {
    const engine = newEngine(1);
    expect(guideForState(engine.state())?.id).toBe('sanctuary-keeper');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, [KEEPER]: { id: KEEPER, side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('sanctuary-keeper');
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
        expect(view?.chapterId).toBe('sanctuary-keeper');
        expect(JSON.stringify(view?.next?.command ?? null), `seed ${seed}`).toBe(JSON.stringify(pick));
        if (pick) {
          rows += 1;
          if (view?.next?.reason) reasoned += 1;
          else unexplained.push(`${d.actorId}: ${view?.next?.label}`);
        }
        engine.submit(pick ?? { kind: 'defend', targets: [] });
      }
    }
    expect(rows).toBeGreaterThan(60);
    expect(reasoned / rows, `unexplained rows: ${[...new Set(unexplained)].join('; ')}`).toBeGreaterThanOrEqual(0.9);
  }, 120_000);
});
