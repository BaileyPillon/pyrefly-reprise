/**
 * The Gauntlet's guide card, page, prep tip and move-advisor line (FFX only; `src/data/guides/gauntlet.ts`, `docs/gauntlet.ts`, `chapter-meta-gauntlet.ts`, `src/engine/tactics/gauntlet.ts`; hidden chapter 54, the word
 * `gauntlet`).
 *
 * The line is the bench's advisor (`tests/unit/helpers/gauntletBench.ts`: the nine-act chain 200 of 200); the card follows Jegged's Monster Arena pages in our own words and cites the research note. What is pinned: the
 * registration of the card, the page and the tactic (the registries pair them: `strategy-guide.test.ts`, `guide-doc.test.ts`); that every rule, hint, watch and phase is cited in the corpus form; that no number is
 * invented; that the page prints the data's HP, Steal and Drops for each of the nine; that the panel finds the card on every act's board; and that the hints speak for the rows the shipped line really asks for.
 */
import { describe, expect, it } from 'vitest';

import { GAUNTLET_ACTS, GAUNTLET_CREATURES } from '../../../src/data/ffx/gauntlet-ids.ts';
import { gauntletBody } from '../../../src/data/ffx/enemies/gauntlet.ts';
import { GAUNTLET_GROUPS } from '../../../src/data/ffx/enemies/gauntlet-groups.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { GAUNTLET_GUIDE, GAUNTLET_GUIDE_IDS } from '../../../src/data/guides/gauntlet.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { GAUNTLET_META } from '../../../src/data/chapter-meta-gauntlet.ts';
import { TACTICS, gauntlet as gauntletTactic, tacticFor, GAUNTLET_BOSS_IDS } from '../../../src/engine/tactics/index.ts';
import { buildGuideView, guideForState } from '../../../src/engine/tactics/guide.ts';
import { docStrings } from '../helpers/guideDocStrings.ts';
import { newEngine, nextInput } from '../helpers/gauntletDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;
const text = (g: typeof GAUNTLET_GUIDE): string => [...g.rules.map((r) => r.text), ...g.hints.map((h) => h.text), ...g.phases.map((p) => p.note), ...g.watch.map((w) => `${w.payload} ${w.advice}`)].join(' ');
const NAMES: Record<string, string> = {
  'blessed-gem': 'Blessed Gem', 'dark-matter': 'Dark Matter', 'chocobo-wing': 'Chocobo Wing', 'designer-wallet': 'Designer Wallet', 'farplane-wind': 'Farplane Wind', 'candle-of-life': 'Candle of Life',
  'supreme-gem': 'Supreme Gem', 'petrify-grenade': 'Petrify Grenade', 'three-stars': 'Three Stars', 'fortune-sphere': 'Fortune Sphere', 'gamblers-spirit': "Gambler's Spirit", 'lv-1-key-sphere': 'Lv. 1 Key Sphere',
  'luck-sphere': 'Luck Sphere', 'return-sphere': 'Return Sphere', 'lv-2-key-sphere': 'Lv. 2 Key Sphere', 'underdogs-secret': "Underdog's Secret", 'teleport-sphere': 'Teleport Sphere', pendulum: 'Pendulum',
  'friend-sphere': 'Friend Sphere', 'winning-formula': 'Winning Formula', 'lv-3-key-sphere': 'Lv. 3 Key Sphere',
};
const line = (id: string, count: number, kind: 'common' | 'rare'): string => `${NAMES[id]}${count > 1 ? ` x${count}` : ''} (${kind})`;

describe('the card is registered under the chapter and its nine bodies, and cites every sentence it prints', () => {
  it('is in GUIDES, names the nine bodies in play order, and keeps three to five rules with short lines that fit the rail', () => {
    expect(GUIDES.find((g) => g.id === 'gauntlet')).toBe(GAUNTLET_GUIDE);
    expect([...GAUNTLET_GUIDE_IDS]).toEqual([...GAUNTLET_CREATURES]);
    expect(GAUNTLET_GUIDE.bossIds).toEqual([...GAUNTLET_GUIDE_IDS]);
    expect(GAUNTLET_GROUPS.map((g) => g.enemies[0]!.id)).toEqual([...GAUNTLET_GUIDE_IDS]);
    expect(GAUNTLET_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(GAUNTLET_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of GAUNTLET_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint, watch and phase in the corpus form (the digest first, then the game\'s file) and names the chapter\'s note or the combat core in each', () => {
    for (const x of [...GAUNTLET_GUIDE.rules, ...GAUNTLET_GUIDE.hints, ...GAUNTLET_GUIDE.watch, ...GAUNTLET_GUIDE.phases]) {
      expect(x.cite, 'a cite in the corpus form').toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s note').toMatch(/re-ffx-monster-arena-creations §/);
    }
  });

  it('every phase and every watch names a boss of the chapter, and the Head\'s telegraph is the one the script emits', () => {
    for (const p of GAUNTLET_GUIDE.phases) expect(GAUNTLET_GUIDE_IDS as readonly string[], p.label).toContain(p.bossId);
    expect(GAUNTLET_GUIDE.watch.map((w) => w.name)).toEqual(['Shaking']);
  });

  it('invents no number: every figure the card prints is one of the note\'s (the King\'s 10,000 Needles, Earth Eater\'s 100,000 line)', () => {
    const allowed = ['10,000', '100,000'];
    for (const n of text(GAUNTLET_GUIDE).match(/\d[\d,]*/g) ?? []) expect(allowed, n).toContain(n);
  });

  it('every hint speaks to a row or a kind the shipped line asks for', () => {
    const labels = ['Lulu', 'Doublecast', 'Quick Hit', 'Phoenix Down', 'Curaga', 'Cura', 'Cure', 'X-Potion', 'Hi-Potion', 'Potion'];
    const kinds = ['switch', 'defend', 'summon', 'attack', 'overdrive'];
    for (const h of GAUNTLET_GUIDE.hints) {
      for (const l of h.when.labels ?? []) expect(labels, l).toContain(l);
      for (const k of h.when.kinds ?? []) expect(kinds, k).toContain(k);
    }
  });
});

describe('the teachings are in the tip, the card and the page', () => {
  const doc = docForChapter('gauntlet')!;
  const page = docStrings(doc).join('\n');
  const rules = GAUNTLET_GUIDE.rules.map((r) => r.text).join('\n');

  it("Neslug's shell is opened by Lulu's magic (the tip, the card, the page)", () => {
    expect(GAUNTLET_META.tip).toMatch(/Bring Lulu in for Neslug and the Ultima Buster/);
    expect(rules).toMatch(/Switch Lulu in: magic does not care about the shell/);
    expect(page).toMatch(/Switch Lulu in at the start and cast Doublecast every turn/);
  });

  it("the Ultima Buster's Arms guard its body against physical blows only (the tip, the card, the page)", () => {
    expect(GAUNTLET_META.tip).toMatch(/strike an Arm before its body/);
    expect(rules).toMatch(/Arms guard its body against physical blows only/);
    expect(page).toMatch(/Spells and Overdrives are not touched/);
  });

  it('no Overdrive on the Greater Sphere (the tip, the card, the page)', () => {
    expect(GAUNTLET_META.tip).toMatch(/spend no Overdrive on the Greater Sphere/);
    expect(rules).toMatch(/Spend no Overdrive on it/);
    expect(page).toMatch(/Spend no Overdrive on it/);
  });

  it('Don Tonberry\'s Karma, Earth Eater\'s punch and the Cactuar King\'s Needles each have their answer on the page', () => {
    expect(page).toMatch(/Guard until the fourth step is done, then strike/);
    expect(page).toMatch(/Let Auron strike alone while it stands/);
    expect(page).toMatch(/Send an aeon in first/);
  });
});

describe('the page: nine boss headers, the stat lines the data holds, and the strategy', () => {
  const doc = docForChapter('gauntlet')!;

  it('is registered with the card\'s nine bosses, in play order, one header each', () => {
    expect(doc).toMatchObject({ id: 'gauntlet', game: 'ffx', bossIds: [...GAUNTLET_GUIDE_IDS] });
    const heads = doc.blocks.filter((b) => b.t === 'head');
    expect(heads.map((b) => (b.at ?? [])[0])).toEqual([...GAUNTLET_GUIDE_IDS]);
  });

  it('prints each record\'s HP and the Steal and Drops the formation pays', () => {
    const blocks = doc.blocks;
    GAUNTLET_ACTS.forEach((act, i) => {
      const at = blocks.findIndex((b) => b.t === 'head' && (b.at ?? []).includes(act.creature));
      const end = i === 8 ? blocks.length : blocks.findIndex((b) => b.t === 'head' && (b.at ?? []).includes(GAUNTLET_GUIDE_IDS[i + 1]!));
      const mine = blocks.slice(at, end);
      const body = gauntletBody(act.creature);
      const hp = mine.find((b) => b.t === 'field' && b.label === 'HP');
      expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null, act.creature).toBe(body.stats.maxHp);
      expect(body.stats.maxHp, act.creature).toBe(act.hp);
      const lists = mine.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
      const steal = body.rewards.steal!;
      expect(lists.find((l) => l.label === 'Steal')!.items, `${act.creature} steal`).toEqual([line(steal.common.itemId, steal.common.count, 'common'), line(steal.rare.itemId, steal.rare.count, 'rare')]);
      const drop = body.rewards.drops[0]!;
      expect(lists.find((l) => l.label === 'Drops')!.items, `${act.creature} drops`).toEqual([line(drop.itemId, drop.count, 'common'), line(drop.rare!.itemId, drop.rare!.count, 'rare')]);
    });
  });

  it('every item the pages name has a name-only row, so the Steal banner and the results page never print a raw id', async () => {
    const { FFX_ITEMS } = await import('../../../src/data/ffx/index.ts');
    for (const id of Object.keys(NAMES)) expect((FFX_ITEMS as Record<string, { name: string }>)[id]?.name, id).toBe(NAMES[id]);
  });
});

describe('the panel on the real board, and the advisor', () => {
  it('finds the card on every act\'s board', () => {
    for (const creature of GAUNTLET_CREATURES) expect(guideForState(newEngine(1, creature).state())?.id, creature).toBe('gauntlet');
  });

  it('a move advisor line is registered for each of the nine, under the FFX game, and the board finds it', () => {
    const registered = TACTICS.filter((t) => (GAUNTLET_GUIDE_IDS as readonly string[]).includes(t.bossId));
    expect(registered.map((t) => t.bossId)).toEqual([...GAUNTLET_GUIDE_IDS]);
    expect(new Set(registered.map((t) => t.chapterId))).toEqual(new Set(['gauntlet']));
    for (const t of registered) expect(t.tactic).toBe(gauntletTactic);
    expect([...GAUNTLET_BOSS_IDS]).toEqual([...GAUNTLET_GUIDE_IDS]);
    for (const creature of GAUNTLET_CREATURES) expect(tacticFor(newEngine(1, creature)), creature).toBe(gauntletTactic);
  });

  it('gives no opinion when no creature of the chapter is on the field', () => {
    const engine = newEngine(1, 'cactuar-king');
    const d = nextInput(engine);
    engine.state().combatants['cactuar-king']!.alive = false;
    expect(gauntletTactic(d.actorId, d.commands, engine)).toBeNull();
  });
});

describe('the hints explain what the shipped line really does (the guide view on real boards)', () => {
  /** The panel's NEXT line for the first decision of whoever acts first in `creature`'s act. */
  function reasonAt(creature: (typeof GAUNTLET_CREATURES)[number], actor?: string): { label: string; reason: string; cite: string } {
    const engine = newEngine(1, creature);
    for (let i = 0; i < 12; i++) {
      const d = nextInput(engine);
      if (actor === undefined || d.actorId === actor) {
        const view = buildGuideView(engine.state(), { actorId: d.actorId, commands: d.commands });
        expect(view?.next, `${creature} / ${d.actorId}`).not.toBeNull();
        return { label: view!.next!.label, reason: view!.next!.reason, cite: view!.next!.cite };
      }
      engine.submit(gauntletTactic(d.actorId, d.commands, engine) ?? { kind: 'defend', targets: [] });
    }
    throw new Error(`no decision for ${actor} in ${creature}`);
  }

  it('act 1: Yuna sends an aeon in as the Cactuar King\'s shield, and the card says why', () => {
    const r = reasonAt('cactuar-king', 'yuna');
    expect(r.reason).toMatch(/Needles fall on whoever stands in the front line/);
  });

  it('act 2: the party guards while Don Tonberry walks in, and the card says Karma', () => {
    expect(reasonAt('don-tonberry', 'tidus').reason).toMatch(/Karma, your kills times a hundred/);
  });

  it('act 4: only Auron strikes the standing Earth Eater, and the card says why the others wait', () => {
    expect(reasonAt('earth-eater', 'tidus').reason).toMatch(/only Auron strikes while Earth Eater stands/);
    expect(reasonAt('earth-eater', 'auron').reason).toMatch(/Piercing blow ignores its armour/);
  });

  it('act 8: Lulu is switched in against Neslug, and the card says the shell stops steel, not magic', () => {
    const r = reasonAt('neslug', 'tidus');
    expect(r.label).toBe('Lulu');
    expect(r.reason).toMatch(/Neslug's shell turns every blow of steel aside/);
  });

  it('act 9: Lulu is switched in against the Ultima Buster, and the card says the Arms guard physical blows only', () => {
    const r = reasonAt('ultima-buster', 'tidus');
    expect(r.label).toBe('Lulu');
    expect(r.reason).toMatch(/Arms guard its body against physical blows/);
  });

  it('act 9: a striker hits an Arm first while one stands, and the card says a blow at the body barely scratches it', () => {
    const engine = newEngine(1, 'ultima-buster');
    const d = nextInput(engine); // the Arms stand: Auron is asked with the same rows (an attack row names an Arm)
    const view = buildGuideView(engine.state(), { actorId: 'auron', commands: d.commands });
    expect(view?.next?.targetId).toMatch(/^ultima-buster-arm-/);
    expect(view?.next?.reason).toMatch(/strikes an Arm first: while one stands, a blow at the body barely scratches it/);
  });

  it("act 9: once Lulu's Doublecast has taken the Arms down, the strikers hit the body and the card says the full weight lands", () => {
    expect(reasonAt('ultima-buster', 'auron').reason).toMatch(/both Arms are down, so a physical blow takes its full weight/);
  });
});
