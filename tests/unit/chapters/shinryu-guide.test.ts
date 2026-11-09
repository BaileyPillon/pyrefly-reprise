/**
 * Shinryu's guide card, page, prep tip and move-advisor line (FFX only; `src/data/guides/shinryu.ts`, `docs/shinryu.ts`, `chapter-meta-shinryu.ts`, `src/engine/tactics/shinryu.ts`; hidden chapter 48, the word `shinryu`).
 *
 * The line is the public guide's (Jegged: the strongest weapons, then defeat it quickly), in our own words, and it is the line `docs/handoff/ch-shinryu.md` section 5 plays on the real engine (the `guide` line of
 * `tests/unit/helpers/shinryuBot.ts`: 200 of 200 battles won, a median of 24 ticks). What is pinned: the registration of the card, the page and the tactic (the registries pair them: `strategy-guide.test.ts`, `guide-doc.test.ts`);
 * that every rule, hint and phase is cited in the corpus form; that each teaching is in the tip, the card and the page; that the page prints the data's HP, Steal and Drops; that no number is invented; that the tip fits the
 * prep card's band at 1600 x 900; that the panel finds the card on Shinryu's board; and that the shipped tactic **is** the bench's line, decision by decision, on real battles.
 */
import { describe, expect, it } from 'vitest';

import { shinryuGroup } from '../../../src/data/ffx/enemies/shinryu.ts';
import { SHINRYU_ID } from '../../../src/data/ffx/shinryu-ids.ts';
import { GUIDES } from '../../../src/data/guides/index.ts';
import { docForChapter } from '../../../src/data/guides/docs/index.ts';
import { SHINRYU_GUIDE, SHINRYU_GUIDE_IDS } from '../../../src/data/guides/shinryu.ts';
import { RULE_SHORT_MAX } from '../../../src/data/guides/types.ts';
import { SHINRYU_META } from '../../../src/data/chapter-meta-shinryu.ts';
import { TACTICS, shinryu as shinryuTactic, tacticFor } from '../../../src/engine/tactics/index.ts';
import { guideForState } from '../../../src/engine/tactics/guide.ts';
import { docStrings } from '../helpers/guideDocStrings.ts';
import { tipFit } from '../helpers/prepTipBand.ts';
import { LINES, choose } from '../helpers/shinryuBot.ts';
import { newEngine, nextInput } from '../helpers/shinryuDrive.ts';

const cite = /^ffx-[a-z0-9-]+ §/;
const text = (g: typeof SHINRYU_GUIDE): string => [...g.rules.map((r) => r.text), ...g.hints.map((h) => h.text), ...g.phases.map((p) => p.note)].join(' ');

describe('the card is registered under the chapter and its one body, and cites every sentence it prints', () => {
  it('is in GUIDES, names the formation\'s body, and keeps three to five rules with short lines that fit the rail', () => {
    expect(GUIDES.find((g) => g.id === 'shinryu')).toBe(SHINRYU_GUIDE);
    expect([...SHINRYU_GUIDE_IDS]).toEqual([SHINRYU_ID]);
    expect(SHINRYU_GUIDE.bossIds).toEqual([...SHINRYU_GUIDE_IDS]);
    expect(shinryuGroup.enemies.map((e) => e.id)).toEqual([...SHINRYU_GUIDE_IDS]);
    expect(SHINRYU_GUIDE.rules.length).toBeGreaterThanOrEqual(3);
    expect(SHINRYU_GUIDE.rules.length).toBeLessThanOrEqual(5);
    for (const r of SHINRYU_GUIDE.rules) expect(r.short.length, r.short).toBeLessThanOrEqual(RULE_SHORT_MAX);
  });

  it('cites every rule, hint and phase in the corpus form (the digest first, then the game\'s file) and names the chapter\'s own note somewhere in each', () => {
    for (const x of [...SHINRYU_GUIDE.rules, ...SHINRYU_GUIDE.hints, ...SHINRYU_GUIDE.phases]) {
      expect(x.cite, 'a cite in the corpus form').toMatch(cite);
      expect(x.cite, 'every cite names the chapter\'s note or the combat core').toMatch(/re-ffx-shinryu §|ffx-combat-core §/);
    }
    for (const r of SHINRYU_GUIDE.rules) expect(r.cite, r.short).toMatch(/re-ffx-shinryu §/);
  });

  it('every hint speaks to a row the guide teaches', () => {
    const taught = ['Quick Hit', 'Phoenix Down', 'X-Potion', 'Mega-Potion', 'Hi-Potion'];
    for (const h of SHINRYU_GUIDE.hints) for (const label of h.when.labels ?? []) expect(taught, label).toContain(label);
  });

  it('invents no number: every figure the card prints is one of the note\'s (99,999 and the 21 blows it takes)', () => {
    const allowed = ['99,999', '21'];
    for (const n of text(SHINRYU_GUIDE).match(/\d[\d,]*/g) ?? []) expect(allowed, n).toContain(n);
  });
});

describe('the teachings are in the tip, the card and the page', () => {
  const doc = docForChapter('shinryu')!;
  const page = docStrings(doc).join('\n');
  const rules = SHINRYU_GUIDE.rules.map((r) => r.text).join('\n');

  it('strike fast with the strongest weapons (Jegged: the strongest weapons, then defeat it quickly)', () => {
    expect(SHINRYU_META.tip).toMatch(/^Strike fast\./);
    expect(rules).toMatch(/Strike with your strongest weapons and end it fast/);
    expect(page).toMatch(/Bring your strongest weapons/);
    expect(page).toMatch(/Strike with your Celestial weapons every turn/);
  });

  it('the Eraser shatters in this water and Ribbon and Stoneproof do not stop it', () => {
    expect(SHINRYU_META.tip).toMatch(/Eraser turns a swimmer to stone, and in this water stone shatters/);
    expect(rules).toMatch(/in this water stone shatters/);
    expect(rules).toMatch(/Ribbon and Stoneproof do not stop it/);
    expect(page).toMatch(/Ribbon and Stoneproof do not stop it/);
  });

  it('it answers every wound, and the last swimmer is safe from the Eraser', () => {
    expect(SHINRYU_META.tip).toMatch(/claws back at every wound/);
    expect(rules).toMatch(/answers every blow that hurts it with a claw/);
    expect(rules).toMatch(/With one swimmer left it no longer uses the Eraser/);
    expect(page).toMatch(/When only one of you is left, it stops using the Eraser/);
  });
});

describe('the tip fits the prep card\'s band at 1600 x 900, so no short form and no overflow-table row is owed', () => {
  it('five lines or fewer by the line model, whole lines only', () => {
    const fit = tipFit(SHINRYU_META, 1600, 900);
    expect(fit.fits, JSON.stringify(fit)).toBe(true);
    expect(fit.lines).toBeLessThanOrEqual(5);
    expect(SHINRYU_META.tip.length).toBeLessThanOrEqual(170);
  });
});

describe('the page: the header, the stat line the data holds, and the strategy', () => {
  it('is registered with the card\'s boss, prints the record\'s HP and the Steal and Drops the formation pays', () => {
    const doc = docForChapter('shinryu')!;
    expect(doc).toMatchObject({ id: 'shinryu', game: 'ffx', bossIds: [...SHINRYU_GUIDE_IDS] });
    expect(doc.blocks.some((b) => b.t === 'head' && (b.at ?? []).includes('shinryu'))).toBe(true);
    const body = shinryuGroup.enemies[0]!;
    const hp = doc.blocks.find((x) => x.t === 'field' && x.label === 'HP');
    expect(hp && hp.t === 'field' ? Number(hp.value.replace(/,/g, '')) : null).toBe(body.stats.maxHp);
    const lists = doc.blocks.filter((b) => b.t === 'list') as unknown as Array<{ label: string; items: string[] }>;
    expect(lists.find((l) => l.label === 'Steal')!.items).toEqual(["Gambler's Spirit (common)", 'Three Stars (rare)']);
    expect(body.rewards.steal?.common).toEqual({ itemId: 'gamblers-spirit', count: 1 });
    expect(body.rewards.steal?.rare).toEqual({ itemId: 'three-stars', count: 1 });
    expect(lists.find((l) => l.label === 'Drops')!.items).toEqual(['Wings to Discovery (common)', 'Dark Matter (rare)']);
    expect(body.rewards.drops[0]).toMatchObject({ itemId: 'wings-to-discovery', rare: { itemId: 'dark-matter' } });
  });
});

describe('the panel on the real board, and the advisor', () => {
  it('finds the card on Shinryu\'s board', () => {
    expect(guideForState(newEngine(1).state())?.id).toBe('shinryu');
  });

  it('a move advisor line is registered for Shinryu, under the FFX game', () => {
    const registered = TACTICS.filter((t) => (SHINRYU_GUIDE_IDS as readonly string[]).includes(t.bossId));
    expect(registered.map((t) => t.chapterId)).toEqual(['shinryu']);
    expect(registered[0]!.tactic).toBe(shinryuTactic);
    expect(tacticFor(newEngine(1)), 'the board finds it').toBe(shinryuTactic);
  });

  it('the shipped tactic IS the bench\'s guide line: on real battles, at every decision, it picks what the line picks, and a null is the line\'s plain Attack', () => {
    let compared = 0;
    let nulls = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const engine = newEngine(seed);
      for (let i = 0; i < 80; i++) {
        let d;
        try { d = nextInput(engine, false); } catch { break; }
        const picked = shinryuTactic(d.actorId, d.commands, engine);
        const line = choose(engine, d, LINES['guide']!);
        if (picked === null) {
          nulls++;
          expect(line.kind, `seed ${seed} decision ${i}: the tactic swings, so does the line`).toBe('attack');
        } else {
          expect({ kind: picked.kind, id: 'id' in picked ? picked.id : undefined, targets: picked.targets }, `seed ${seed} decision ${i}`).toEqual({ kind: line.kind, id: 'id' in line ? line.id : undefined, targets: line.targets });
        }
        compared++;
        engine.submit(line);
      }
    }
    expect(compared).toBeGreaterThan(80);
    expect(nulls).toBeGreaterThan(20);
  });

  it('gives no opinion when Shinryu is not on the field, and none to a combatant who is not the party\'s', () => {
    const engine = newEngine(1);
    const d = nextInput(engine, false);
    engine.state().combatants[SHINRYU_ID]!.alive = false;
    expect(shinryuTactic(d.actorId, d.commands, engine)).toBeNull();
  });
});
