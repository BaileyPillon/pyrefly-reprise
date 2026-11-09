/**
 * Spherimorph's guide card and page (FFX only; `src/data/guides/spherimorph.ts`, `docs/spherimorph.ts`), added with the chapter's line (`src/engine/tactics/spherimorph.ts`): the project's registries pair a tactic with a
 * card and a page (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form, that the page's HP, Steal and Drops are the data's, that every label a hint speaks to is a row the line asks for,
 * that the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { spherimorphGroup } from '../../../src/data/ffx/enemies/spherimorph.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { SPHERIMORPH_GUIDE, SPHERIMORPH_GUIDE_IDS } from '../../../src/data/guides/spherimorph.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { SPHERIMORPH_BOSS_IDS } from '../../../src/engine/tactics/spherimorph.ts';
import { SM, newEngine } from '../helpers/spherimorphDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and the guardian, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same boss as the tactic and the formation, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'spherimorph')).toBe(SPHERIMORPH_GUIDE);
    expect(SPHERIMORPH_GUIDE.bossIds).toEqual([...SPHERIMORPH_BOSS_IDS]);
    expect(SPHERIMORPH_GUIDE_IDS).toEqual(['spherimorph']);
    expect(spherimorphGroup.enemies.map((e) => e.id)).toEqual([...SPHERIMORPH_GUIDE_IDS]);
    expect(SPHERIMORPH_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(SPHERIMORPH_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of SPHERIMORPH_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file), and names the chapter\'s own note', () => {
    for (const r of SPHERIMORPH_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of SPHERIMORPH_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of SPHERIMORPH_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    for (const x of [...SPHERIMORPH_GUIDE.rules, ...SPHERIMORPH_GUIDE.hints, ...SPHERIMORPH_GUIDE.phases]) expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-spherimorph §/);
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Firaga', 'Fira', 'Fire', 'Blizzaga', 'Blizzara', 'Blizzard', 'Thundaga', 'Thundara', 'Thunder', 'Waterga', 'Watera', 'Water', 'Focus', 'Haste', 'Protect', 'Armor Break', 'Cure', 'Cura', 'Hi-Potion', 'X-Potion', 'Mega-Potion', 'Phoenix Down'];
    for (const h of SPHERIMORPH_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('says what the game does: the opposite of the answer, a plain probe, the change on a weakness hit, Press under half, Armor Break; and invents no number', () => {
    const rules = SPHERIMORPH_GUIDE.rules.map((r) => r.text).join(' ');
    expect(rules).toMatch(/Cast the element opposite the spell that answered/);
    expect(rules).toMatch(/Probe with a plain blow first/);
    expect(rules).toMatch(/one time in four the same one/);
    expect(rules).toMatch(/half of its turns are Press/);
    expect(rules).toMatch(/Armor Break takes the Armored division away/);
    // the card prints no number at all: the figures are the note's arithmetic against an estimate
    const all = [...SPHERIMORPH_GUIDE.rules.map((r) => r.text), ...SPHERIMORPH_GUIDE.hints.map((h) => h.text), ...SPHERIMORPH_GUIDE.phases.map((p) => p.note)].join(' ');
    expect(all.match(/\d[\d,]*/g) ?? []).toEqual([]);
  });
});

describe('the page: the header, the stat lines the data holds, and the strategy', () => {
  it('is registered with the card\'s boss, prints the record\'s HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('spherimorph')!;
    expect(doc).toMatchObject({ id: 'spherimorph', game: 'ffx', bossIds: ['spherimorph'] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('spherimorph'))).toBe(true);
    const boss = spherimorphGroup.enemies[0]!;
    const hp = doc.blocks.find((b) => b.t === 'field' && b.label === 'HP');
    expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null).toBe(boss.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Ether (common)', 'Turbo Ether (rare)']);
    expect(boss.rewards.steal?.common).toEqual({ itemId: 'ether', count: 1 });
    expect(boss.rewards.steal?.rare).toEqual({ itemId: 'turbo-ether', count: 1 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Lv. 2 Key Sphere']);
    expect(boss.rewards.drops).toEqual([{ itemId: 'lv-2-key-sphere', count: 1 }]);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on the guardian\'s board and on no FFX-2 board that fields the same id', () => {
    const engine = newEngine(1);
    expect(guideForState(engine.state())?.id).toBe('spherimorph');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, [SM]: { id: SM, side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('spherimorph');
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
        expect(view?.chapterId).toBe('spherimorph');
        expect(JSON.stringify(view?.next?.command ?? null), `seed ${seed}`).toBe(JSON.stringify(pick));
        if (pick) {
          rows += 1;
          if (view?.next?.reason) reasoned += 1;
          else unexplained.push(`${d.actorId}: ${view?.next?.label}`);
        }
        engine.submit(pick ?? { kind: 'defend', targets: [] });
      }
    }
    expect(rows).toBeGreaterThan(40);
    expect(reasoned / rows, `unexplained rows: ${[...new Set(unexplained)].join('; ')}`).toBeGreaterThanOrEqual(0.9);
  }, 120_000);
});
