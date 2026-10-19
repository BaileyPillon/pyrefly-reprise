/**
 * **A boon, put into the fight's real setup** (Pilgrimage prototype, FFX only; Bailey, 2026-10-18, decision 122): `src/app/pilgrim/applyBoons.ts`, then the real engine.
 *
 * Hard rule 3: prove it by running the engine. Each boon is applied to the shipped chapter, the setup is made the way the battle screen makes it (`setupForChapter`), and the real FFX engine is
 * started from it: Auto-Haste and Auto-Regen are statuses on the wearer, "Overdrive charged" is a full gauge, an item boon is a stack the engine spends. The shipped records are never changed, a boon
 * is gone with its fight (the next fight is made from a fresh clone), and no boss number is touched.
 *
 * Game case: FFX only. An FFX-2 build is returned as it is.
 */
import { describe, expect, it } from 'vitest';

import type { Command, Decision, FFXCombatant } from '../../src/battle/common/types.ts';
import { FFXContentRegistry, createFFXEngine } from '../../src/battle/ffx/index.ts';
import { ALL_ABILITIES, ITEMS } from '../../src/data/ffx/index.ts';
import { CHAPTERS, getChapter } from '../../src/data/encounters.ts';
import { setupForChapter } from '../../src/app/screens/BattleScreenSetup.ts';
import { boonedChapter, boonedParty } from '../../src/app/pilgrim/applyBoons.ts';
import { BOON_POOL, type BoonId } from '../../src/app/pilgrim/boons.ts';
import { STOPS } from '../../src/app/pilgrim/route.ts';

const content = new FFXContentRegistry();
content.addAbilities([...ALL_ABILITIES]);
content.addItems(Object.values(ITEMS));

const chapterOf = (id: string) => getChapter(id as never)!;
const MACALANIA = 'seymour-anima-macalania';

function engineFor(chapterId: string, boons: readonly BoonId[], seed = 1) {
  const { chapter } = boonedChapter(chapterOf(chapterId), boons);
  const engine = createFFXEngine({ content, autoResolveMinigames: true });
  engine.init(setupForChapter(chapter, seed));
  return engine;
}
const combatant = (engine: ReturnType<typeof engineFor>, id: string): FFXCombatant => engine.state().combatants[id] as FFXCombatant;

/** Advance to the next player decision (enemy turns resolve on the way). */
function nextInput(engine: ReturnType<typeof engineFor>): Extract<Decision, { kind: 'player-input' }> {
  for (let i = 0; i < 400; i++) {
    const d = engine.nextDecision();
    if (d.kind === 'player-input') return d;
    if (d.kind === 'battle-over') throw new Error('the battle ended before a player turn');
  }
  throw new Error('no player turn');
}

describe('applying a boon to a party build', () => {
  it('returns the same objects when there is nothing to apply (no boon, or a build that is not FFX)', () => {
    const chapter = chapterOf(MACALANIA);
    expect(boonedParty(chapter.buildRef, [])).toEqual({ party: chapter.buildRef, applied: [] });
    expect(boonedChapter(chapter, []).chapter).toBe(chapter);
    const ffx2 = CHAPTERS.find((c) => c.game === 'ffx2')!;
    expect(boonedChapter(ffx2, ['auto-haste', 'light-curtain']).chapter).toBe(ffx2);
  });

  it('never changes the shipped record: every boon on every stop leaves the chapter\'s own build exactly as it was', () => {
    for (const stop of STOPS) {
      const chapter = chapterOf(stop.chapter);
      const before = JSON.stringify(chapter.buildRef);
      const all = BOON_POOL.map((b) => b.id);
      const out = boonedChapter(chapter, all);
      expect(JSON.stringify(chapter.buildRef), stop.id).toBe(before);
      expect(out.chapter.buildRef, stop.id).not.toBe(chapter.buildRef);
      expect(out.chapter.enemyGroupRef, `${stop.id}: the boss is the chapter's own, untouched`).toBe(chapter.enemyGroupRef);
      expect(out.chapter.id).toBe(chapter.id);
      expect(out.applied).toHaveLength(all.length);
    }
  });

  it('an item boon adds a stack (or adds to the one that is there) and never passes the game\'s 99', () => {
    const chapter = chapterOf('yojimbo-cavern'); // light-curtain x6 already
    const { party, applied } = boonedParty(chapter.buildRef, ['light-curtain', 'stamina-tablet', 'mega-phoenix']);
    const stock = (id: string): number => (party as typeof chapter.buildRef & { inventory: { itemId: string; count: number }[] }).inventory.find((e) => e.itemId === id)?.count ?? 0;
    const was = (id: string): number => (chapter.buildRef as typeof party & { inventory: { itemId: string; count: number }[] }).inventory.find((e) => e.itemId === id)?.count ?? 0;
    expect(stock('light-curtain')).toBe(was('light-curtain') + 2);
    expect(stock('stamina-tablet')).toBe(was('stamina-tablet') + 1);
    expect(stock('mega-phoenix')).toBe(was('mega-phoenix') + 1);
    expect(applied.every((a) => a.applied && a.wearer === null)).toBe(true);
    const big = boonedParty({ ...chapter.buildRef, inventory: [{ itemId: 'light-curtain', count: 98 }] } as typeof chapter.buildRef, ['light-curtain']);
    expect((big.party as unknown as { inventory: { count: number }[] }).inventory[0]!.count).toBe(99);
  });

  it('an auto-ability goes to the first preferred ally on the field, else the first on the field who lacks it; a full armour gives up its last slot', () => {
    const macalania = boonedParty(chapterOf(MACALANIA).buildRef, ['auto-haste', 'auto-regen']);
    // Field: tidus, yuna, rikku. Haste prefers tidus; Regen prefers kimahri (benched), then tidus.
    expect(macalania.applied.map((a) => [a.boon, a.wearer, a.applied])).toEqual([['auto-haste', 'tidus', true], ['auto-regen', 'tidus', true]]);
    const tidus = (macalania.party as { members: { id: string; equipment: { armor: { autoAbilities: string[]; slots: number } } }[] }).members.find((m) => m.id === 'tidus')!;
    expect(tidus.equipment.armor.autoAbilities).toContain('auto-haste');
    expect(tidus.equipment.armor.autoAbilities).toContain('auto-regen');
    expect(tidus.equipment.armor.slots).toBeGreaterThanOrEqual(tidus.equipment.armor.autoAbilities.length);

    // Mirror Aeons: every armour is 4 of 4. The loan replaces the last slot and never makes a fifth.
    const mirror = boonedParty(chapterOf('mirror-aeons').buildRef, ['auto-regen']);
    const wearer = mirror.applied[0]!.wearer!;
    const armour = (mirror.party as { members: { id: string; equipment: { armor: { autoAbilities: string[]; slots: number } } }[] }).members.find((m) => m.id === wearer)!.equipment.armor;
    expect(armour.autoAbilities).toHaveLength(4);
    expect(armour.autoAbilities[3]).toBe('auto-regen');
    expect(armour.slots).toBe(4);
  });

  it('an ally who has the ability already is passed over; with nobody left the boon says so and changes nothing', () => {
    const base = chapterOf(MACALANIA).buildRef;
    const once = boonedParty(base, ['auto-haste']);
    const twice = boonedParty(once.party, ['auto-haste']);
    expect(once.applied[0]!.wearer).toBe('tidus');
    expect(twice.applied[0]!.wearer).not.toBe('tidus'); // the next on the field
    expect(twice.applied[0]!.wearer).not.toBeNull();
    const thrice = boonedParty(boonedParty(twice.party, ['auto-haste']).party, ['auto-haste']);
    expect(thrice.applied[0]).toMatchObject({ wearer: null, applied: false });
    expect(thrice.applied[0]!.line).toMatch(/already/);
    expect(JSON.stringify(thrice.party)).toBe(JSON.stringify(boonedParty(twice.party, ['auto-haste']).party));
  });

  it('"Overdrive charged" fills one ally\'s starting gauge to 100 (the first preferred on the field), and only theirs', () => {
    const base = chapterOf('evrae-airship').buildRef; // field: tidus, wakka, rikku; Wakka is preferred
    const { party, applied } = boonedParty(base, ['overdrive-charged']);
    expect(applied[0]).toMatchObject({ wearer: 'wakka', applied: true });
    const gauges = (party as { members: { id: string; overdrive: { gauge: number } }[] }).members;
    const was = (base as { members: { id: string; overdrive: { gauge: number } }[] }).members;
    for (const [i, m] of gauges.entries()) expect(m.overdrive.gauge, m.id).toBe(m.id === 'wakka' ? 100 : was[i]!.overdrive.gauge);
  });
});

describe('the real engine, started from a boon\'d setup (Seymour and Anima, seed 1)', () => {
  it('Auto-Haste and Auto-Regen are permanent statuses on the wearer from the first moment; the other two allies have neither', () => {
    const engine = engineFor(MACALANIA, ['auto-haste', 'auto-regen']);
    const tidus = combatant(engine, 'tidus');
    expect(tidus.statuses.haste, 'haste').toBeDefined();
    expect(tidus.statuses.regen, 'regen').toBeDefined();
    for (const id of ['yuna', 'rikku']) {
      expect(combatant(engine, id).statuses.haste, `${id} haste`).toBeUndefined();
      expect(combatant(engine, id).statuses.regen, `${id} regen`).toBeUndefined();
    }
    const plain = engineFor(MACALANIA, []);
    expect(combatant(plain, 'tidus').statuses.haste).toBeUndefined();
    expect(combatant(plain, 'tidus').statuses.regen).toBeUndefined();
  });

  it('"Overdrive charged" starts the wearer\'s gauge full, and a fight without the boon does not', () => {
    const boon = engineFor('evrae-airship', ['overdrive-charged']);
    expect(combatant(boon, 'wakka').overdrive!.gauge).toBe(100);
    const plain = engineFor('evrae-airship', []);
    expect(combatant(plain, 'wakka').overdrive!.gauge).toBeLessThan(100);
  });

  it('an item boon is a stack in the bag that the engine spends: Light Curtain x2 gives Protect twice, then none is left', () => {
    const engine = engineFor(MACALANIA, ['light-curtain']);
    nextInput(engine);
    const use = (): Command => ({ kind: 'item', id: 'light-curtain' as never, targets: ['tidus'] });
    const hadBefore = Object.prototype.hasOwnProperty.call(engine.state().flags, 'inventory:light-curtain');
    expect(hadBefore).toBe(false); // the bag mirrors a count into the flags on a change, not at the start
    engine.submit(use());
    expect(combatant(engine, 'tidus').statuses.protect, 'protect after the first curtain').toBeDefined();
    expect(engine.state().flags['inventory:light-curtain']).toBe(1);
    nextInput(engine);
    engine.submit(use());
    expect(engine.state().flags['inventory:light-curtain']).toBe(0);
    // The chapter without the boon has no Light Curtain at all (the item is not in its pack).
    const plain = engineFor(MACALANIA, []);
    nextInput(plain);
    const before = plain.state().flags['inventory:light-curtain'];
    plain.submit(use());
    expect(plain.state().flags['inventory:light-curtain'] ?? before).not.toBe(1);
  });

  it('the next fight starts clean: a fresh clone each time, so a boon is gone when its fight ends', () => {
    const withBoon = boonedChapter(chapterOf(MACALANIA), ['auto-haste']).chapter;
    const next = boonedChapter(chapterOf(MACALANIA), []).chapter;
    expect(next.buildRef).toBe(chapterOf(MACALANIA).buildRef);
    expect(JSON.stringify(next.buildRef)).not.toBe(JSON.stringify(withBoon.buildRef));
    const engine = createFFXEngine({ content, autoResolveMinigames: true });
    engine.init(setupForChapter(next, 2));
    expect(combatant(engine, 'tidus').statuses.haste).toBeUndefined();
  });
});
