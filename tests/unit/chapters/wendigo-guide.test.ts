/**
 * The Wendigo guide card and page (FFX only; `src/data/guides/wendigo.ts`, `docs/wendigo.ts`), added with the chapter's line (`src/engine/tactics/wendigo.ts`): the project's registries pair a tactic with a card and a page
 * (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form, that the page's HP, Steal and Drops are the data's, that every label a hint speaks to is a row the line asks for, that
 * the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { wendigoGroup } from '../../../src/data/ffx/enemies/wendigo.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { WENDIGO_GUIDE, WENDIGO_GUIDE_IDS } from '../../../src/data/guides/wendigo.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { WENDIGO_BOSS_IDS } from '../../../src/engine/tactics/wendigo.ts';
import { WENDIGO, newEngine } from '../helpers/wendigoDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and Wendigo, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same boss as the tactic and the formation, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'wendigo')).toBe(WENDIGO_GUIDE);
    expect(WENDIGO_GUIDE.bossIds).toEqual([...WENDIGO_BOSS_IDS]);
    expect(WENDIGO_GUIDE_IDS).toEqual(['wendigo']);
    expect(wendigoGroup.enemies.some((e) => e.id === WENDIGO_GUIDE_IDS[0])).toBe(true);
    expect(WENDIGO_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(WENDIGO_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of WENDIGO_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file), and the chapter\'s own note', () => {
    for (const r of WENDIGO_GUIDE.rules) expect(r.cite, r.short).toMatch(cite);
    for (const h of WENDIGO_GUIDE.hints) expect(h.cite, h.text).toMatch(cite);
    for (const p of WENDIGO_GUIDE.phases) expect(p.cite, p.label).toMatch(cite);
    for (const x of [...WENDIGO_GUIDE.rules, ...WENDIGO_GUIDE.hints, ...WENDIGO_GUIDE.phases]) expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-wendigo-lake-macalania §/);
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Petrify Grenade', 'Steal', 'Power Break', 'Dark Attack', 'Protect', 'Esuna', 'Remedy', 'Eye Drops', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion', 'Phoenix Down'];
    for (const h of WENDIGO_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('says what the game does: Power Break and Protect first, the Guardians petrified or robbed, Darkness not the whole answer, no swings while the arms are up; and invents no number', () => {
    const rules = WENDIGO_GUIDE.rules.map((r) => r.text).join(' ');
    expect(rules).toMatch(/Power Break halves everything it throws/);
    expect(rules).toMatch(/Petrify Grenade reaches both/);
    expect(rules).toMatch(/Double Punch and its Counter Punch never miss/);
    expect(rules).toMatch(/Do not swing then, or send an aeon/);
    // every number the card prints is one of the note's: 400 to 500 (a punch under Power Break and Protect: 408 to 503, RE 6)
    const all = [...WENDIGO_GUIDE.rules.map((r) => r.text), ...WENDIGO_GUIDE.hints.map((h) => h.text), ...WENDIGO_GUIDE.phases.map((p) => p.note)].join(' ');
    for (const n of all.match(/\d[\d,]*/g) ?? []) expect(['400', '500'], n).toContain(n);
  });
});

describe('the page: the header, the stat lines the data holds, and the strategy', () => {
  it('is registered with the card\'s boss, prints the record\'s HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('wendigo')!;
    expect(doc).toMatchObject({ id: 'wendigo', game: 'ffx', bossIds: ['wendigo'] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('wendigo'))).toBe(true);
    const boss = wendigoGroup.enemies.find((e) => e.id === WENDIGO)!;
    const hp = doc.blocks.find((b) => b.t === 'field' && b.label === 'HP');
    expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null).toBe(boss.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(['Hi-Potion (common)', 'X-Potion (rare)']);
    expect(boss.rewards.steal?.common).toEqual({ itemId: 'hi-potion', count: 1 });
    expect(boss.rewards.steal?.rare).toEqual({ itemId: 'x-potion', count: 1 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Power Sphere']);
    expect(boss.rewards.drops).toEqual([{ itemId: 'power-sphere', count: 1 }]);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on Wendigo\'s board and on no board without it', () => {
    const engine = newEngine(1);
    expect(guideForState(engine.state())?.id).toBe('wendigo');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, [WENDIGO]: { id: WENDIGO, side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('wendigo');
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
        expect(view?.chapterId).toBe('wendigo');
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
