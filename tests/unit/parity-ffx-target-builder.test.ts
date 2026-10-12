/**
 * Parity tests for the FFX target builder (`src/battle/ffx/kernel/target-builder.ts`; re-parity RC4 lane FFX-G, **FFX only**).
 *
 * Source: FFX.exe, Steam build 25501027, `pp_BtlBuildTargetHits` (VA 0x0078ba70); spec `research/re-ffx-targeting.md` section 4.1. The
 * hand-worked cases are the note's worked examples E3 to E8; the last block replays `tests/fixtures/parity/ffx/target_builder.json`, runs
 * of the game's own machine code (68,000 vectors, 0 mismatches against an independent model, every draw's stream and order compared;
 * this file holds a stratified subset across the ten generator classes).
 */

import { describe, expect, it } from 'vitest';
import { newBond } from '../../src/battle/ffx/kernel/cover.ts';
import { buildTargetHits } from '../../src/battle/ffx/kernel/target-builder.ts';
import { CMD_RANDOM_SPREAD, CMD_REFLECTABLE, type TargetCommand, type TargetSlot, type TargetWorld, slotsOf } from '../../src/battle/ffx/kernel/target-world.ts';
import { ExtraBit } from '../../src/battle/ffx/kernel/status-types.ts';
import { commandOfVector, denseOf, inputOf, scriptedPick, targetFixture, worldOfVector } from './helpers/ffxTargetFixtures.ts';

function world(slots: Record<number, TargetSlot>): TargetWorld {
  const out: Array<TargetSlot | undefined> = new Array<TargetSlot | undefined>(31).fill(undefined);
  for (const [k, v] of Object.entries(slots)) out[Number(k)] = v;
  return out;
}
const here = (over: TargetSlot = {}): TargetSlot => ({ inBattle: 1, targetable: 1, only: 0xff, hp: 1000, ...over });
const bit = (...slots: number[]): number => slots.reduce((m, s) => m | (1 << s), 0) >>> 0;

/** A single-target magic spell that can be reflected, Fire's shape. */
const SPELL: TargetCommand = { b1a: 0x02, b1b: 0x04, misc: CMD_REFLECTABLE, b20: 2, hits: 1 };
/** A single-target physical blow (Cover applies). */
const BLOW: TargetCommand = { b1a: 0x02, b1b: 0x04, misc: 0, b20: 1, hits: 1 };

/** A pick that takes the stream-values of a list in order and records every call. */
function recorder(values: number[]): { pick: (s: number, slots: readonly number[]) => number; calls: Array<[number, number[]]> } {
  const calls: Array<[number, number[]]> = [];
  let n = 0;
  return {
    calls,
    pick: (stream, slots) => {
      calls.push([stream, [...slots]]);
      const v = values[n] ?? 0;
      n += 1;
      return slots[v % slots.length] as number;
    },
  };
}

describe('the target builder (0x78ba70): Reflect', () => {
  it('E3: a spell at a Reflecting monster goes back to the caster, always, with no draw and no check of who is alive', () => {
    const w = world({ 1: here(), 2: here(), 0x14: here({ reflect: 1 }), 0x15: here(), 0x16: here() });
    const r = buildTargetHits(w, newBond(), 1, 0x3041, bit(0x14), 0, SPELL, () => {
      throw new Error('no draw');
    });
    expect(r.mask).toBe(bit(1));
    expect(r.hits[1]).toBe(1);
    expect(r.hits[0x14]).toBe(0);
    expect(r.reflected).toBe(bit(0x14));
    expect(r.reflectFlag).toBe(true);
  });

  it('E4: a spell at a Reflecting ally of the caster goes to a random opposite-side member: stream 6, value mod the candidate count, ascending slot', () => {
    const w = world({ 0: here({ reflect: 1 }), 1: here(), 0x14: here(), 0x15: here(), 0x16: here() });
    for (const [draw, expected] of [[0, 0x14], [1, 0x15], [2, 0x16], [3, 0x14], [100, 0x15]] as const) {
      const rec = recorder([draw]);
      const r = buildTargetHits(w, newBond(), 1, 0x3041, bit(0), 0, SPELL, rec.pick);
      expect(r.mask, `draw ${draw}`).toBe(bit(expected));
      expect(rec.calls).toEqual([[6, [0x14, 0x15, 0x16]]]);
    }
  });

  it('the caster\'s own Reflect counts as the caster\'s side: the spell goes to the other side', () => {
    const w = world({ 1: here({ reflect: 1 }), 0x14: here(), 0x15: here() });
    const rec = recorder([1]);
    const r = buildTargetHits(w, newBond(), 1, 0x3041, bit(1), 0, SPELL, rec.pick);
    expect(r.mask).toBe(bit(0x15));
  });

  it('E5, E7: one legal opposite member left takes the spell with no draw; none left and the hits are lost', () => {
    const lone = world({ 0: here({ reflect: 1 }), 1: here(), 0x14: here(), 0x15: here({ dead: 1 }) });
    const r = buildTargetHits(lone, newBond(), 1, 0x3041, bit(0), 0, SPELL, () => {
      throw new Error('no draw');
    });
    expect(r.mask).toBe(bit(0x14));
    const none = world({ 0: here({ reflect: 1 }), 1: here(), 0x14: here({ targetable: 0 }), 0x15: here({ dead: 1 }) });
    const lost = buildTargetHits(none, newBond(), 1, 0x3041, bit(0), 0, SPELL, () => {
      throw new Error('no draw');
    });
    expect(lost.mask).toBe(0);
    expect(lost.hits.every((h) => h === 0)).toBe(true);
    expect(lost.lost).toEqual([{ holder: 0, hits: 1 }]);
    expect(lost.reflectFlag).toBe(true);
  });

  it('E6: a bounce never bounces again: every monster Reflecting too, and the drawn monster is not looked at', () => {
    const w = world({ 0: here({ reflect: 1 }), 1: here(), 0x14: here({ reflect: 1 }), 0x15: here({ reflect: 1 }), 0x16: here({ reflect: 1 }) });
    const rec = recorder([1]);
    const r = buildTargetHits(w, newBond(), 1, 0x3041, bit(0), 0, SPELL, rec.pick);
    expect(r.mask).toBe(bit(0x15));
    expect(r.hits[0x15]).toBe(1);
    expect(r.reflected).toBe(bit(0));
  });

  it('the equipment Reflect bit counts, and a command without the record bit never bounces', () => {
    const w = world({ 1: here(), 0x14: here({ autoTemp: 0x20 }) });
    expect(buildTargetHits(w, newBond(), 1, 0x3041, bit(0x14), 0, SPELL, () => 0).mask).toBe(bit(1));
    const plain = buildTargetHits(w, newBond(), 1, 0x3041, bit(0x14), 0, { ...SPELL, misc: 0 }, () => 0);
    expect(plain.mask).toBe(bit(0x14));
    expect(plain.reflected).toBe(0);
  });

  it('a multi-target reflectable command bounces per target, in ascending slot order, one stream-6 draw each for the caster-side holders', () => {
    const w = world({ 0: here({ reflect: 1 }), 1: here(), 2: here({ reflect: 1 }), 0x14: here(), 0x15: here() });
    const rec = recorder([0, 1]);
    const group = { ...SPELL, b1a: 0x02 | 0x8 };
    const r = buildTargetHits(w, newBond(), 1, 0x3041, bit(0, 1, 2), 0, group, rec.pick);
    expect(rec.calls).toEqual([[6, [0x14, 0x15]], [6, [0x14, 0x15]]]);
    expect(r.hits[0x14]).toBe(1);
    expect(r.hits[0x15]).toBe(1);
    expect(r.hits[1]).toBe(1); // the caster, not reflecting, keeps her own hit
    expect(r.mask).toBe(bit(1, 0x14, 0x15));
    expect(r.reflected).toBe(bit(0, 2));
  });
});

describe('the target builder: the random spread', () => {
  const spread: TargetCommand = { b1a: 0x02 | 0x4, b1b: 0x04, misc: CMD_RANDOM_SPREAD, b20: 0, hits: 4 };
  const w = world({ 0: here(), 0x14: here(), 0x15: here(), 0x16: here() });

  it('E8: four hits over three enemies deal every pick first (stream 5, one draw per hit); every member is a target, even with zero hits', () => {
    const rec = recorder([0, 1, 2, 3]);
    const r = buildTargetHits(w, newBond(), 0, 0x3061, bit(0x14, 0x15, 0x16), 0, spread, rec.pick);
    expect(rec.calls.length).toBe(4);
    expect(rec.calls.every(([s, c]) => s === 5 && c.join() === '20,21,22')).toBe(true);
    expect([r.hits[0x14], r.hits[0x15], r.hits[0x16]]).toEqual([2, 1, 1]);
    const same = buildTargetHits(w, newBond(), 0, 0x3061, bit(0x14, 0x15, 0x16), 0, spread, recorder([4, 4, 4, 4]).pick);
    expect([same.hits[0x14], same.hits[0x15], same.hits[0x16]]).toEqual([0, 4, 0]);
    expect(same.mask).toBe(bit(0x14, 0x15, 0x16)); // the other two are still targets, with zero hits
    expect(slotsOf(same.mask).map((s) => same.targeted[s])).toEqual([1, 1, 1]);
    expect(same.total).toBe(4);
  });

  it('one candidate: all hits to it and no draw', () => {
    const r = buildTargetHits(w, newBond(), 0, 0x3061, bit(0x15), 7, spread, () => {
      throw new Error('no draw');
    });
    expect(r.hits[0x15]).toBe(4);
    expect(r.total).toBe(11);
  });

  it('the draw order inside one call is every spread pick (stream 5), then every Reflect pick (stream 6)', () => {
    const reflecting = world({ 0: here(), 0x14: here({ reflect: 1 }), 0x15: here() });
    const cmd = { ...spread, misc: CMD_RANDOM_SPREAD | CMD_REFLECTABLE, hits: 2 };
    const rec = recorder([0, 1, 0]);
    // A spread over two enemies; the Reflecting one is on the other side from the caster, so it bounces back with no draw.
    const r = buildTargetHits(reflecting, newBond(), 0, 0x3061, bit(0x14, 0x15), 0, cmd, rec.pick);
    expect(rec.calls.map(([s]) => s)).toEqual([5, 5]);
    expect(r.hits[0]).toBe(1);
    expect(r.hits[0x15]).toBe(1);
  });
});

describe('the target builder: Cover, once per target', () => {
  it('a blow at a covered target goes to the cover with the target\'s hits; the target keeps none; the other targets are untouched', () => {
    const w = world({ 0: here(), 1: here(), 2: here({ extra: ExtraBit.Guard, hp: 500 }), 0x14: here() });
    const multi = { ...BLOW, hits: 2 };
    const r = buildTargetHits(w, newBond(), 0x14, 0x3000, bit(1), 0, multi, () => 0);
    expect(r.hits[2]).toBe(2);
    expect(r.hits[1]).toBe(0);
    expect(r.mask).toBe(bit(2));
    expect(r.coverFlag).toBe(true);
    expect(r.covers).toEqual([{ holder: 2, covered: 1 }]);
  });

  it('Tidus covering a monster\'s blow on a party slot adds one to that slot\'s counter', () => {
    const w = world({ 0: here({ extra: ExtraBit.Guard }), 1: here(), 0x14: here() });
    const bond = newBond();
    buildTargetHits(w, bond, 0x14, 0x3000, bit(1), 0, BLOW, () => 0);
    expect(bond[1]).toBe(1);
    // A party member's blow on a covered monster does not feed it.
    const w2 = world({ 0: here(), 1: here(), 0x14: here(), 0x15: here({ extra: ExtraBit.Guard }) });
    const b2 = newBond();
    buildTargetHits(w2, b2, 1, 0x3000, bit(0x14), 0, BLOW, () => 0);
    expect(b2).toEqual(newBond());
  });

  it('magic is never covered, a user is never covered, and a command with more than one target type is not covered', () => {
    const w = world({ 0: here(), 1: here(), 2: here({ extra: ExtraBit.Guard }), 0x14: here() });
    expect(buildTargetHits(w, newBond(), 0x14, 0x3041, bit(1), 0, { ...BLOW, b20: 2 }, () => 0).mask).toBe(bit(1));
    expect(buildTargetHits(w, newBond(), 1, 0x3000, bit(1), 0, BLOW, () => 0).mask).toBe(bit(1));
    expect(buildTargetHits(w, newBond(), 0x14, 0x3000, bit(1), 0, { ...BLOW, b1a: 0x02 | 0x8 }, () => 0).mask).toBe(bit(1));
  });
});

describe('golden vectors: the game\'s own target builder', () => {
  it('target_builder.json: the hit counts, targeted counts, final mask, total, reflected mask, flags, counters and draws agree on every vector', () => {
    const fx = targetFixture('target_builder');
    expect(fx.vectors.length).toBeGreaterThanOrEqual(600);
    let reflecting = 0;
    let covering = 0;
    let spreading = 0;
    for (const v of fx.vectors) {
      const i = inputOf(fx, v.in) as {
        user: number; cmdId: number; mask: number; totalIn: number; cmd: Record<string, number>;
        bond?: Record<string, number>; chrs: Record<string, Record<string, number>>;
      };
      const bond = denseOf(i.bond, 8);
      const s = scriptedPick(v.rngDraws);
      const cmd = commandOfVector(i.cmd);
      const r = buildTargetHits(worldOfVector(i.chrs), bond, i.user, i.cmdId, i.mask, i.totalIn, cmd, s.pick);
      const label = `vector ${v.id} (${v.class}) user ${i.user}`;
      expect(r.targeted, `${label} targeted`).toEqual(denseOf(v.out['A'] as Record<string, number>, 31));
      expect(r.hits, `${label} hits`).toEqual(denseOf(v.out['H'] as Record<string, number>, 31));
      expect(r.mask >>> 0, `${label} mask`).toBe((v.out['mask'] as number) >>> 0);
      expect(r.total >>> 0, `${label} total`).toBe((v.out['total'] as number) >>> 0);
      expect(r.reflected >>> 0, `${label} reflected`).toBe((v.out['reflected'] as number) >>> 0);
      expect(r.coverFlag, `${label} cover flag`).toBe(v.out['coverFlag'] === 1);
      expect(r.reflectFlag, `${label} reflect flag`).toBe(v.out['reflectFlag'] === 1);
      expect(bond, `${label} counters`).toEqual(denseOf(v.out['bond'] as Record<string, number>, 8));
      expect(s.used(), `${label} draws`).toBe(v.rngDraws?.length ?? 0);
      if (i.user !== 0) {
        const marked = Object.entries(v.out['lastAtk'] as Record<string, number>).filter(([, u]) => u === i.user).map(([k]) => Number(k));
        expect([...new Set(r.lastAttacker)].sort((a, b) => a - b), `${label} last attacker`).toEqual(marked);
      }
      if (r.reflectFlag) reflecting += 1;
      if (r.coverFlag) covering += 1;
      if ((cmd.misc & CMD_RANDOM_SPREAD) !== 0) spreading += 1;
    }
    // The subset really exercises the three mechanisms.
    expect(reflecting).toBeGreaterThan(150);
    expect(covering).toBeGreaterThan(100);
    expect(spreading).toBeGreaterThan(100);
  });
});
