/**
 * The Omega Ruins' guide card and page (FFX only; `src/data/guides/omega-ruins.ts`, `docs/omega-ruins.ts`), added with the chapter's line (`src/engine/tactics/omega-ruins.ts`): the project's registries pair a tactic with a card
 * and a page (`strategy-guide.test.ts`: every boss the tactics register is guided; `guide-doc.test.ts`: one page per card).
 *
 * What is pinned: the registration and the rule counts, that every sentence is cited in the corpus form, that the page's HP, Steal and Drops are the data's for each of the three fights, that every label a hint speaks to is
 * a row the line asks for, that the panel's NEXT line is the line's own pick, and that the hints explain nearly every row the line presses on a real Nemesis fight.
 */
import { describe, expect, it } from 'vitest';

import type { BattleState, Command } from '../../../src/battle/common/types.ts';
import { nemesisGroup, omegaWeaponGroup, ultimaWeaponGroup } from '../../../src/data/ffx/enemies/weapons-groups.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { OMEGA_RUINS_GUIDE, OMEGA_RUINS_GUIDE_IDS } from '../../../src/data/guides/omega-ruins.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { intendedStrategy } from '../../../src/engine/BattlePresenterStrategies.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { OMEGA_RUINS_BOSS_IDS } from '../../../src/engine/tactics/omega-ruins.ts';
import { NEMESIS_GROUP_ID, OMEGA_GROUP_ID, ULTIMA_GROUP_ID } from '../../../src/data/ffx/omega-ruins-ids.ts';
import * as H from '../helpers/omegaRuinsDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;

describe('the card is registered under the chapter and the three bodies, and cites every sentence it prints', () => {
  it('is in GUIDES, names the same bosses as the tactic and the formations, and keeps three to five rules', () => {
    expect(GUIDES.find((g) => g.id === 'omega-ruins')).toBe(OMEGA_RUINS_GUIDE);
    expect(OMEGA_RUINS_GUIDE.bossIds).toEqual([...OMEGA_RUINS_BOSS_IDS]);
    expect(OMEGA_RUINS_GUIDE_IDS).toEqual(['ultima-weapon', 'omega-weapon', 'nemesis']);
    expect([ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup].map((g) => g.enemies[0]!.id)).toEqual([...OMEGA_RUINS_GUIDE_IDS]);
    expect(OMEGA_RUINS_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(OMEGA_RUINS_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of OMEGA_RUINS_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file), each naming the chapter\'s own note', () => {
    for (const x of [...OMEGA_RUINS_GUIDE.rules, ...OMEGA_RUINS_GUIDE.hints, ...OMEGA_RUINS_GUIDE.phases]) {
      expect(x.cite).toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s own note').toMatch(/re-ffx-omega-ultima-nemesis §/);
    }
  });

  it('every label a hint speaks to is a row the line asks for', () => {
    const asked = ['Auto-Life', 'Turbo Ether', 'Elixir', 'Ether', 'Quick Hit', 'Soft', 'Esuna', 'Remedy', 'Echo Screen', 'Phoenix Down'];
    for (const h of OMEGA_RUINS_GUIDE.hints) for (const label of h.when.labels ?? []) expect(asked, label).toContain(label);
  });

  it('says what the game does: a second life on the line, no Overdrive at Nemesis, the armour and the elements, the MP clock, the Weapons\' rounds; the counters\' bounds are the scripts\'; and invents no number', () => {
    const rules = OMEGA_RUINS_GUIDE.rules.map((r) => r.text).join(' ');
    expect(rules).toMatch(/Keep Auto-Life on everyone/);
    expect(rules).toMatch(/a Phoenix Down cannot stand a party that is all down together/);
    expect(rules).toMatch(/Never spend an Overdrive, a Mix or an item on Nemesis/);
    expect(rules).toMatch(/answered with an Ultima on all three/);
    expect(rules).toMatch(/divides plain blows by three unless the weapon pierces/);
    expect(rules).toMatch(/Turbo Ether, an Elixir or an Ether/);
    const all = [...OMEGA_RUINS_GUIDE.rules.map((r) => r.text), ...OMEGA_RUINS_GUIDE.hints.map((h) => h.text), ...OMEGA_RUINS_GUIDE.phases.map((p) => p.note)].join(' ');
    // every number the card prints is one of the note's: 99,999 (Armageddon), the counters' bounds
    for (const n of all.match(/\d[\d,]*/g) ?? []) expect(['99,999'], n).toContain(n);
  });
});

describe('the page: a header for each fight, the stat lines the data holds, and the strategy', () => {
  const doc = docForChapter('omega-ruins')!;

  it('is registered with the card\'s bosses and opens on each fight\'s own header', () => {
    expect(doc).toMatchObject({ id: 'omega-ruins', game: 'ffx', bossIds: ['ultima-weapon', 'omega-weapon', 'nemesis'] });
    for (const id of OMEGA_RUINS_GUIDE_IDS) expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes(id)), id).toBe(true);
  });

  it('prints each record\'s HP, and the Steal and the Drops its formation pays', () => {
    const fields = doc.blocks.filter((b) => b.t === 'field' && b.label === 'HP').map((b) => (b.t === 'field' ? Number(b.value.replace(/,/g, '')) : 0));
    expect(fields).toEqual([ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup].map((g) => g.enemies[0]!.stats.maxHp));
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    const steals = lists.filter((l) => l.label === 'Steal').map((l) => l.items);
    expect(steals).toEqual([
      ['Door to Tomorrow x10 (common)', 'Door to Tomorrow x20 (rare)'],
      ["Gambler's Spirit x30 (common)", "Gambler's Spirit x30 (rare)"],
      ['Lv. 4 Key Sphere (common)', 'Warp Sphere (rare)'],
    ]);
    const rewards = [ultimaWeaponGroup, omegaWeaponGroup, nemesisGroup].map((g) => g.enemies[0]!.rewards);
    expect(rewards[0]!.steal).toMatchObject({ common: { itemId: 'door-to-tomorrow', count: 10 }, rare: { itemId: 'door-to-tomorrow', count: 20 } });
    expect(rewards[1]!.steal).toMatchObject({ common: { itemId: 'gamblers-spirit', count: 30 }, rare: { itemId: 'gamblers-spirit', count: 30 } });
    expect(rewards[2]!.steal).toMatchObject({ common: { itemId: 'lv-4-key-sphere', count: 1 }, rare: { itemId: 'warp-sphere', count: 1 } });
    expect(lists.filter((l) => l.label === 'Drops').map((l) => l.items)).toEqual([['Lv. 3 Key Sphere x3'], ['Lv. 4 Key Sphere x3'], ['Warp Sphere', 'Dark Matter (rare)']]);
  });

  it('says the file\'s two surprises plainly: Nemesis\'s answer to a special-class command and both Weapons\' rounds changing while an aeon is out', () => {
    const text = doc.blocks.flatMap((b) => (b.t === 'p' ? [b.text] : b.t === 'ol' ? [...b.items] : [])).join(' ');
    expect(text).toMatch(/answers every special-class command that reaches it with an Ultima on all three of you/);
    expect(text).toMatch(/Put an aeon in front of you and it forgets the curses/);
    expect(text).toMatch(/An aeon out swaps the curses/);
  });
});

describe('the panel on a real fight: the NEXT line is the line\'s own pick, and the hints explain what it presses', () => {
  it('finds the card on each of the three boards and on no FFX board without them', () => {
    for (const group of [ULTIMA_GROUP_ID, OMEGA_GROUP_ID, NEMESIS_GROUP_ID]) expect(guideForState(H.newEngine(1, group).state())?.id, group).toBe('omega-ruins');
    const other = { game: 'ffx2', combatants: { yuna: { id: 'yuna', side: 'party' }, nemesis: { id: 'nemesis', side: 'enemy' } } } as unknown as BattleState;
    expect(guideForState(other)?.id).not.toBe('omega-ruins');
  });

  it('seeds 1 to 3, played by the line: every NEXT line equals intendedStrategy\'s pick, and the card gives a reason for at least nine rows in ten', () => {
    let rows = 0;
    let reasoned = 0;
    const unexplained: string[] = [];
    for (const seed of [1, 2, 3]) {
      const engine = H.newEngine(seed, NEMESIS_GROUP_ID);
      for (let i = 0; i < 6000; i++) {
        const d = engine.nextDecision();
        if (d.kind === 'battle-over') break;
        if (d.kind !== 'player-input') continue;
        const pick = intendedStrategy(d.actorId, d.commands, engine) as Command | null;
        const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
        expect(view?.chapterId).toBe('omega-ruins');
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
