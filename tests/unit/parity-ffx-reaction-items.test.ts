/**
 * Parity tests for the FFX item reactions (`src/battle/ffx/kernel/reaction-items.ts`; re-parity RC4 lane F).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: Can-act (VA 0x007b24a0), Auto-Potion
 * (0x007b2850), Auto-Med (0x007b2510) and Auto-Phoenix (0x007b27b0); the private note `FFX-G02` sections 3.8 and 3.9 and `FFX-G05`
 * section 4.2. The hand-worked blocks give the arithmetic in the comment next to each number; the last block replays
 * `tests/fixtures/parity/ffx/reaction_items.json`: runs of the game's own machine code in an x86-32 emulator with every character structure
 * filled with random bytes first, and the stock, queue-class and Can-act inputs read from the real functions on the same memory.
 * Mutants (a deliberately wrong kernel) must disagree with the vectors, so the replay is shown to be able to fail.
 */

import { describe, expect, it } from 'vitest';
import {
  type AutoMedInput,
  type AutoPotionInput,
  type CanActFacts,
  type ItemRequest,
  type PhoenixCandidate,
  MED_LIST,
  POTION_LIST,
  autoMed,
  autoPhoenix,
  autoPotion,
  reactionCanAct,
} from '../../src/battle/ffx/kernel/reaction-items.ts';
import { loadFfxParityFixture } from './helpers/ffxParityFixture.ts';

const facts = (over: Partial<CanActFacts> = {}): CanActFacts => ({ stoned: false, perm: 0, asleep: false, ejected: false, inBattleByte: true, ...over });

const potion = (over: Partial<AutoPotionInput> = {}): AutoPotionInput => ({ hp: 100, maxHp: 1000, classBlocked: false, canAct: true, stock: [1, 1, 1], ...over });

const med = (over: Partial<AutoMedInput> = {}): AutoMedInput => ({
  poison: false, zombie: false, darkness: 0, silence: 0,
  oldPoison: 0, oldZombie: 0, oldDarkness: 0, oldSilence: 0,
  eqPoison: false, eqZombie: false, eqDarkness: false, eqSilence: false,
  classBlocked: false, canAct: true, stock: [1, 1, 1, 1, 1],
  ...over,
});

describe('Can-act (0x007b24a0)', () => {
  it('passes a plain character and refuses each of the five blockers; the Death bit is not one of them', () => {
    expect(reactionCanAct(facts())).toBe(true);
    expect(reactionCanAct(facts({ stoned: true }))).toBe(false);
    expect(reactionCanAct(facts({ perm: 0x100 }))).toBe(false); // Confuse
    expect(reactionCanAct(facts({ perm: 0x200 }))).toBe(false); // Berserk
    expect(reactionCanAct(facts({ asleep: true }))).toBe(false);
    expect(reactionCanAct(facts({ ejected: true }))).toBe(false);
    // the Death bit (0x1) and Zombie (0x2) are not tested: a character at 0 HP that the death check has not reached still passes
    expect(reactionCanAct(facts({ perm: 0x1 | 0x2 }))).toBe(true);
  });
  it('asks for "in battle", "not Provoked" and "not Threatened" only when told to', () => {
    expect(reactionCanAct(facts({ inBattleByte: false }))).toBe(false);
    expect(reactionCanAct(facts({ inBattleByte: false }), false)).toBe(true);
    expect(reactionCanAct(facts({ perm: 0x400 }))).toBe(false);
    expect(reactionCanAct(facts({ perm: 0x400 }), true, false)).toBe(true);
    expect(reactionCanAct(facts({ perm: 0x800 }))).toBe(false);
    expect(reactionCanAct(facts({ perm: 0x800 }), true, true, false)).toBe(true);
  });
});

describe('Auto-Potion (0x007b2850)', () => {
  it('fires at or below half of the maximum, by integer halving, and at 0 HP', () => {
    // floor(1000 / 2) = 500: 500 fires, 501 does not
    expect(autoPotion(potion({ hp: 500 }))).not.toBeNull();
    expect(autoPotion(potion({ hp: 501 }))).toBeNull();
    // floor(999 / 2) = 499: 499 fires, 500 does not (strictly "below half" would have fired at 499 too; the line is 499, not 499.5)
    expect(autoPotion(potion({ hp: 499, maxHp: 999 }))).not.toBeNull();
    expect(autoPotion(potion({ hp: 500, maxHp: 999 }))).toBeNull();
    // 0 HP qualifies; the HP word compares unsigned, so a negative HP (a huge unsigned) does not
    expect(autoPotion(potion({ hp: 0 }))).not.toBeNull();
    expect(autoPotion(potion({ hp: -1 }))).toBeNull();
  });
  it('is refused by a waiting Auto-Potion record, by Can-act, and by an empty bag', () => {
    expect(autoPotion(potion({ classBlocked: true }))).toBeNull();
    expect(autoPotion(potion({ canAct: false }))).toBeNull();
    expect(autoPotion(potion({ stock: [0, 0, 0] }))).toBeNull();
  });
  it('takes the first of Potion, Hi-Potion, X-Potion in stock, at priority 0x21, 0x22, 0x23', () => {
    expect(autoPotion(potion({ stock: [3, 3, 3] }))).toEqual({ index: 0, priority: 0x21 });
    expect(autoPotion(potion({ stock: [0, 3, 3] }))).toEqual({ index: 1, priority: 0x22 });
    expect(autoPotion(potion({ stock: [0, 0, 3] }))).toEqual({ index: 2, priority: 0x23 });
    expect(POTION_LIST).toEqual(['potion', 'hi-potion', 'x-potion']);
  });
});

describe('Auto-Med (0x007b2510)', () => {
  it('answers a status NEWLY inflicted by this hit, not one the character already had, and not one equipment gives', () => {
    expect(autoMed(med({ poison: true }))).toEqual({ index: 0, priority: 0x11 });
    expect(autoMed(med({ poison: true, oldPoison: 1 }))).toBeNull();
    expect(autoMed(med({ poison: true, eqPoison: true }))).toBeNull();
    expect(autoMed(med({ darkness: 3, oldDarkness: 255 }))).toBeNull();
    // a status that is not one of the four (Sleep, Slow, Petrify...) is not even an input: nothing to answer
    expect(autoMed(med())).toBeNull();
  });
  it('orders Antidote, Holy Water, Eye Drops, Echo Screens, and uses Remedy first when two or more are new', () => {
    expect(MED_LIST).toEqual(['antidote', 'holy-water', 'eye-drops', 'echo-screen', 'remedy']);
    expect(autoMed(med({ poison: true, zombie: true, darkness: 2, silence: 2, stock: [1, 1, 1, 1, 0] }))).toEqual({ index: 0, priority: 0x11 });
    expect(autoMed(med({ zombie: true, darkness: 2 }))).toEqual({ index: 4, priority: 0x15 }); // two new and a Remedy in stock
    expect(autoMed(med({ zombie: true, darkness: 2, stock: [1, 1, 1, 1, 0] }))).toEqual({ index: 1, priority: 0x12 }); // no Remedy: Holy Water first
    expect(autoMed(med({ darkness: 2, silence: 2, stock: [0, 0, 0, 1, 0] }))).toEqual({ index: 3, priority: 0x14 }); // Eye Drops out: Echo Screens
    expect(autoMed(med({ silence: 5 }))).toEqual({ index: 3, priority: 0x14 });
  });
  it('falls back to Remedy for a single new status whose own cure is out of stock', () => {
    expect(autoMed(med({ poison: true, stock: [0, 1, 1, 1, 1] }))).toEqual({ index: 4, priority: 0x15 });
    expect(autoMed(med({ poison: true, stock: [0, 1, 1, 1, 0] }))).toBeNull();
  });
  it('is refused by a waiting Auto-Med record and by Can-act', () => {
    expect(autoMed(med({ poison: true, classBlocked: true }))).toBeNull();
    expect(autoMed(med({ poison: true, canAct: false }))).toBeNull();
  });
});

describe('Auto-Phoenix (0x007b27b0)', () => {
  const able = (over: Partial<PhoenixCandidate> = {}): PhoenixCandidate => ({ dead: false, holds: true, canAct: true, ...over });
  it('picks the first able holder in slot order, and no later one', () => {
    expect(autoPhoenix(false, 1, [able({ holds: false }), able(), able()])).toBe(1);
    expect(autoPhoenix(false, 1, [able({ dead: true }), able({ canAct: false }), able()])).toBe(2);
    expect(autoPhoenix(false, 1, [able({ dead: true }), able({ holds: false })])).toBeNull();
  });
  it('needs a Phoenix Down for a party or aeon victim, and nothing for a monster victim', () => {
    expect(autoPhoenix(false, 0, [able()])).toBeNull();
    expect(autoPhoenix(true, 0, [able()])).toBe(0);
  });
});

// ------------------------------------------------------------------------------------------------ the game's own vectors
const fx = loadFfxParityFixture('reaction_items');
const POTION_IDS = [0x2000, 0x2001, 0x2002];
const MED_IDS = [0x200a, 0x200e, 0x200c, 0x200d, 0x200f];

type Num = number;
const n = (v: unknown): Num => v as Num;
const flag = (v: unknown): boolean => (v as Num) !== 0;
const use = (req: ItemRequest | null, ids: readonly number[]): { item: number; priority: number } | null =>
  req === null ? null : { item: ids[req.index] as number, priority: req.priority };
const outUse = (out: Record<string, unknown>): { item: number; priority: number } | null => {
  const u = out['use'] as { item: number; priority: number } | null;
  return u === null ? null : { item: u.item, priority: u.priority };
};

function runPotion(i: Record<string, unknown>, impl: (x: AutoPotionInput) => ItemRequest | null = autoPotion) {
  return use(impl({ hp: n(i['hp']), maxHp: n(i['maxHp']), classBlocked: flag(i['classBlocked']), canAct: flag(i['canAct']), stock: i['stock'] as [Num, Num, Num] }), POTION_IDS);
}
function medInput(i: Record<string, unknown>): AutoMedInput {
  return {
    poison: flag(i['poison']), zombie: flag(i['zombie']), darkness: n(i['darkness']), silence: n(i['silence']),
    oldPoison: n(i['oldPoison']), oldZombie: n(i['oldZombie']), oldDarkness: n(i['oldDarkness']), oldSilence: n(i['oldSilence']),
    eqPoison: flag(i['eqPoison']), eqZombie: flag(i['eqZombie']), eqDarkness: flag(i['eqDarkness']), eqSilence: flag(i['eqSilence']),
    classBlocked: flag(i['classBlocked']), canAct: flag(i['canAct']), stock: i['stock'] as [Num, Num, Num, Num, Num],
  };
}
function candidatesOf(i: Record<string, unknown>): PhoenixCandidate[] {
  return (i['candidates'] as Num[]).map((b) => ({ dead: (b & 1) !== 0, holds: (b & 2) !== 0, canAct: (b & 4) !== 0 }));
}
function runPhoenix(i: Record<string, unknown>, impl: typeof autoPhoenix = autoPhoenix): { item: number; priority: number; user: number } | null {
  const monster = flag(i['victimMonster']);
  const k = impl(monster, n(i['stock']), candidatesOf(i));
  return k === null ? null : { item: 0x2006, priority: 0x30, user: (monster ? 0x14 : 0) + k };
}

describe.skipIf(fx === null)('the game\'s machine code, replayed (tests/fixtures/parity/ffx/reaction_items.json)', () => {
  const of = (cls: string) => (fx?.vectors ?? []).filter((v) => v.class === cls);

  it('Can-act: every vector', () => {
    const vs = of('canAct');
    expect(vs.length).toBeGreaterThan(300);
    let ok = 0;
    for (const v of vs) {
      const i = v.in;
      const got = reactionCanAct(
        { stoned: flag(i['stoned']), perm: n(i['perm']), asleep: flag(i['asleep']), ejected: flag(i['ejected']), inBattleByte: flag(i['inBattleByte']) },
        flag(i['inBattle']), flag(i['notProvoked']), flag(i['notThreatened']),
      );
      expect(got ? 1 : 0, `vector ${v.id}`).toBe(n(v.out['ok']));
      if (got) ok++;
    }
    expect(ok).toBeGreaterThan(20);
    expect(vs.length - ok).toBeGreaterThan(20);
  });

  it('Auto-Potion: every vector, the queued item and its priority', () => {
    const vs = of('autoPotion');
    expect(vs.length).toBeGreaterThan(300);
    const seen = { fired: 0, none: 0, hi: 0, x: 0, zero: 0 };
    for (const v of vs) {
      const got = runPotion(v.in);
      expect(got, `vector ${v.id}`).toEqual(outUse(v.out));
      if (got) seen.fired++; else seen.none++;
      if (got?.item === 0x2001) seen.hi++;
      if (got?.item === 0x2002) seen.x++;
      if (n(v.in['hp']) === 0 && got) seen.zero++;
    }
    expect(seen.fired).toBeGreaterThan(100);
    expect(seen.none).toBeGreaterThan(100);
    expect(seen.hi).toBeGreaterThan(20);
    expect(seen.x).toBeGreaterThan(20);
  });

  it('Auto-Med: every vector, the queued item and its priority', () => {
    const vs = of('autoMed');
    expect(vs.length).toBeGreaterThan(400);
    const seen = new Map<number, number>();
    for (const v of vs) {
      const got = use(autoMed(medInput(v.in)), MED_IDS);
      expect(got, `vector ${v.id}`).toEqual(outUse(v.out));
      if (got) seen.set(got.item, (seen.get(got.item) ?? 0) + 1);
    }
    for (const id of MED_IDS) expect(seen.get(id) ?? 0, `item ${id.toString(16)} chosen`).toBeGreaterThan(15);
  });

  it('Auto-Phoenix: every vector, the rescuer', () => {
    const vs = of('autoPhoenix');
    expect(vs.length).toBeGreaterThan(300);
    let found = 0;
    let monster = 0;
    for (const v of vs) {
      const got = runPhoenix(v.in);
      const want = v.out['use'] as { user: number; item: number; priority: number } | null;
      expect(got, `vector ${v.id}`).toEqual(want === null ? null : { item: want.item, priority: want.priority, user: want.user });
      if (got) found++;
      if (flag(v.in['victimMonster'])) monster++;
    }
    expect(found).toBeGreaterThan(100);
    expect(monster).toBeGreaterThan(50);
  });

  // A deliberately wrong kernel must disagree with the game: these show the replay can fail.
  it('mutants are caught', () => {
    const strictPotion = (x: AutoPotionInput): ItemRequest | null => (((x.maxHp >>> 1) >>> 0) <= x.hp >>> 0 ? null : autoPotion({ ...x, hp: 0 }));
    const caught = (impl: (x: AutoPotionInput) => ItemRequest | null): number => of('autoPotion').filter((v) => JSON.stringify(runPotion(v.in, impl)) !== JSON.stringify(outUse(v.out))).length;
    expect(caught(strictPotion)).toBeGreaterThan(10); // "strictly below half"
    expect(caught((x) => autoPotion({ ...x, stock: [x.stock[2], x.stock[1], x.stock[0]] }))).toBeGreaterThan(10); // X-Potion first
    expect(caught((x) => autoPotion({ ...x, canAct: true }))).toBeGreaterThan(10); // no Can-act test
    expect(caught((x) => autoPotion({ ...x, classBlocked: false }))).toBeGreaterThan(10); // no class limit

    const medCaught = (impl: (x: AutoMedInput) => ItemRequest | null): number =>
      of('autoMed').filter((v) => JSON.stringify(use(impl(medInput(v.in)), MED_IDS)) !== JSON.stringify(outUse(v.out))).length;
    expect(medCaught((x) => autoMed({ ...x, stock: [x.stock[2], x.stock[3], x.stock[0], x.stock[1], x.stock[4]] }))).toBeGreaterThan(5); // the engine's old order
    expect(medCaught((x) => autoMed({ ...x, oldPoison: 0, oldZombie: 0, oldDarkness: 0, oldSilence: 0 }))).toBeGreaterThan(10); // not "newly"
    expect(medCaught((x) => autoMed({ ...x, eqPoison: false, eqZombie: false, eqDarkness: false, eqSilence: false }))).toBeGreaterThan(5); // equipment counted

    const phoenixWant = (v: { out: Record<string, unknown> }): object | null => {
      const u = v.out['use'] as { user: number; item: number; priority: number } | null;
      return u === null ? null : { item: u.item, priority: u.priority, user: u.user };
    };
    const phoenixCaught = (impl: typeof autoPhoenix): number =>
      of('autoPhoenix').filter((v) => JSON.stringify(runPhoenix(v.in, impl)) !== JSON.stringify(phoenixWant(v))).length;
    expect(phoenixCaught((m, s, c) => {
      const k = autoPhoenix(m, s, [...c].reverse());
      return k === null ? null : c.length - 1 - k;
    })).toBeGreaterThan(10); // searches downwards
    expect(phoenixCaught((m, s, c) => autoPhoenix(m, Math.max(s, 1), c))).toBeGreaterThan(5); // no stock needed
  });
});
