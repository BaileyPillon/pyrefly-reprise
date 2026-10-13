/**
 * Parity tests for the FFX death check and the KO status reset (`src/battle/ffx/kernel/death-check.ts`).
 *
 * **Game case: FFX only.** Source: FFX.exe, Steam build 25501027, SHA-256 0537B2A1...686D: the KO reset (VA 0x0079a190) and the death check (VA 0x0078c740).
 * Spec: FFX-G02 sections 3.1, 3.2, 3.7 and 3.12. Every hand-worked number has its arithmetic beside it. The last block replays
 * `tests/fixtures/parity/ffx/ko_reset.json`: each vector is a run of the game's own machine code in an x86-32 emulator (the presentation, statistics,
 * queue, loot, capture and Overdrive-death helpers the check calls are hooked and recorded). With `PYREFLY_KO_BIG=<file>` the same replay runs over a
 * larger set of the same layout.
 */

import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  deathCheck,
  isMonsterSlot,
  koReset,
  overkillReached,
  overkillStart,
  overkillStep,
  type DeathCheckIn,
  type KoChr,
} from '../../src/battle/ffx/kernel/death-check.ts';
import { loadFfxParityFixture, type ParityFixture } from './helpers/ffxParityFixture.ts';

const ZERO13 = new Array<number>(13).fill(0);
const ZERO6 = new Array<number>(6).fill(0);

function chr(over: Partial<KoChr> = {}): KoChr {
  return { perm: 0, counters: ZERO13, extra: 0, stacks: ZERO6, buff: 0, hp: 100, mp: 10, maxHp: 1000, maxMp: 50, baseHp: 1000, baseMp: 50, autoB: 0, ...over };
}

function check(over: Partial<DeathCheckIn> = {}, c: Partial<KoChr> = {}): DeathCheckIn {
  return { chr: chr(c), victim: 0, exists: 1, dead: 0, eject: 0, noRewards: 0, overkillCounter: 100, debugNoOverkill: 0, ...over };
}

describe('the KO status reset', () => {
  it('clears Zombie and Scan with everything else (the answer to PR-0217 / D-214)', () => {
    // perm 0b1010 = Zombie (2) + Poison (8); extra 0b1 = Scan
    const out = koReset(chr({ perm: 0b1010, extra: 0b1 }), 0);
    expect(out.perm).toBe(0);
    expect(out.extra).toBe(0);
  });

  it('clears the counters, the stage stacks and the whole extra word (Eject, Auto-Life, Defend, Doom included)', () => {
    const out = koReset(chr({ counters: [0, 3, 255, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13], stacks: [1, 2, 3, 4, 5, 1], extra: 0xffff, perm: 0xfff }), 0);
    expect(out.counters).toEqual(ZERO13);
    expect(out.stacks).toEqual(ZERO6);
    expect(out.extra).toBe(0);
    expect(out.perm).toBe(0);
  });

  it('keeps only the permanent-word bit 0 that the caller passes', () => {
    expect(koReset(chr({ perm: 0xfff }), 1).perm).toBe(1);
    expect(koReset(chr({ perm: 0xfff }), 0).perm).toBe(0);
    expect(koReset(chr({ perm: 0 }), 0xfffe).perm).toBe(0); // only bit 0 of the argument counts
    expect(koReset(chr({ perm: 0 }), 3).perm).toBe(1);
  });

  it('undoes Double HP and Double MP: the maxima go back to the stored base and the current values are clamped under them', () => {
    // base 3000 doubled to 6000 with 5000 HP; base 100 doubled to 200 with 150 MP: after the reset 3000 / 3000 and 100 / 100
    const out = koReset(chr({ buff: 3, baseHp: 3000, maxHp: 6000, hp: 5000, baseMp: 100, maxMp: 200, mp: 150 }), 0);
    expect(out).toMatchObject({ buff: 0, maxHp: 3000, hp: 3000, maxMp: 100, mp: 100 });
  });

  it('leaves HP alone when the pools were never doubled', () => {
    const out = koReset(chr({ buff: 0, hp: 0, maxHp: 1000, baseHp: 1000 }), 0);
    expect(out).toMatchObject({ hp: 0, maxHp: 1000 });
  });
});

describe('the death check', () => {
  it('does nothing while HP is 1 or more, and nothing for a slot that does not exist or is already dead', () => {
    expect(deathCheck(check({}, { hp: 1 })).ran).toBe(false);
    expect(deathCheck(check({ exists: 0 }, { hp: 0 })).ran).toBe(false);
    expect(deathCheck(check({ dead: 1 }, { hp: 0 })).ran).toBe(false);
  });

  it('is kind 1 when HP is below 1 and kind 2 for the Eject bit (whatever the HP)', () => {
    expect(deathCheck(check({}, { hp: 0 })).kind).toBe(1);
    expect(deathCheck(check({}, { hp: -50 })).kind).toBe(1);
    expect(deathCheck(check({ eject: 1 }, { hp: 500 })).kind).toBe(2);
    expect(deathCheck(check({ eject: 1 }, { hp: 0 })).kind).toBe(2);
  });

  it('wipes the statuses of the dead and leaves Death alone: Zombie, Scan and Auto-Life go', () => {
    const out = deathCheck(check({}, { hp: 0, perm: 0b1010, extra: 0x201 }));
    expect(out.chr.perm).toBe(1);
    expect(out.chr.extra).toBe(0);
  });

  it('queues the Auto-Life revive from the extra word saved BEFORE the reset, for kind 1 only; otherwise tries Auto-Phoenix', () => {
    const al = deathCheck(check({}, { hp: 0, extra: 0x200 }));
    expect(al).toMatchObject({ autoLifeQueued: true, phoenixTried: false });
    const none = deathCheck(check({}, { hp: 0, extra: 0x1 }));
    expect(none).toMatchObject({ autoLifeQueued: false, phoenixTried: true });
    const ejected = deathCheck(check({ eject: 1 }, { hp: 0, extra: 0x300 }));
    expect(ejected).toMatchObject({ autoLifeQueued: false, phoenixTried: false });
  });

  it('flags Overkill for a monster only, with rewards on and the counter below 1', () => {
    const monster = { victim: 0x14, overkillCounter: 0 };
    expect(deathCheck(check(monster, { hp: 0 })).overkill).toBe(true);
    expect(deathCheck(check({ ...monster, overkillCounter: 1 }, { hp: 0 })).overkill).toBe(false); // 1 is not below 1
    expect(deathCheck(check({ ...monster, overkillCounter: -7 }, { hp: 0 })).overkill).toBe(true);
    expect(deathCheck(check({ ...monster, victim: 0x1b }, { hp: 0 })).overkill).toBe(true); // the last monster slot
    expect(deathCheck(check({ ...monster, victim: 0x1c }, { hp: 0 })).overkill).toBe(false); // one past it
    expect(deathCheck(check({ ...monster, victim: 3 }, { hp: 0 })).overkill).toBe(false); // a party member
    expect(deathCheck(check({ ...monster, noRewards: 1 }, { hp: 0 })).overkill).toBe(false); // a self-destruct
    expect(deathCheck(check({ ...monster, debugNoOverkill: 1 }, { hp: 0 })).overkill).toBe(false);
  });

  it('counts monster slots 0x14 to 0x1b', () => {
    expect([0x13, 0x14, 0x1b, 0x1c].map(isMonsterSlot)).toEqual([false, true, true, false]);
  });
});

describe('the overkill counter is the damage of the whole action', () => {
  it('two hits that are each under the threshold but together reach it are an overkill', () => {
    // threshold 100: hit 60 -> 40 (not yet), hit 50 -> -10 (below 1)
    let c = overkillStart(100);
    c = overkillStep(c, 60);
    expect(overkillReached(c)).toBe(false);
    c = overkillStep(c, 50);
    expect(c).toBe(-10);
    expect(overkillReached(c)).toBe(true);
  });

  it('a heal counts negative, so it puts the counter back up', () => {
    // threshold 100: hit 90 -> 10, heal 30 (value -30) -> 40, hit 50 -> -10
    let c = overkillStart(100);
    c = overkillStep(c, 90);
    c = overkillStep(c, -30);
    expect(c).toBe(40);
    expect(overkillReached(overkillStep(c, 50))).toBe(true);
    expect(overkillReached(overkillStep(c, 39))).toBe(false); // 40 - 39 = 1
    expect(overkillReached(overkillStep(c, 40))).toBe(true); // 40 - 40 = 0
  });

  it('is 32-bit arithmetic', () => {
    expect(overkillStep(-0x80000000, 1)).toBe(0x7fffffff); // wraps, as the game's counter does
  });
});

describe('replays the game\'s own answers (emulator vectors)', () => {
  const fixture = loadFfxParityFixture('ko_reset');
  const big = process.env['PYREFLY_KO_BIG'];
  const bigFixture: ParityFixture | null = big !== undefined && existsSync(big) ? (JSON.parse(readFileSync(big, 'utf8')) as ParityFixture) : null;
  const sets = [fixture, bigFixture].filter((f): f is ParityFixture => f !== null);

  type Words = { perm: number; counters: number[]; extra: number; stacks: number[]; buff: number; hp: number; mp: number; maxHp: number; maxMp: number; baseHp: number; baseMp: number; autoB: number };
  const wordsOf = (o: Record<string, unknown>): KoChr => {
    const w = o as unknown as Words;
    return { perm: w.perm, counters: w.counters, extra: w.extra, stacks: w.stacks, buff: w.buff, hp: w.hp, mp: w.mp, maxHp: w.maxHp, maxMp: w.maxMp, baseHp: w.baseHp, baseMp: w.baseMp, autoB: w.autoB };
  };

  it('has the vectors', () => {
    expect(fixture, 'tests/fixtures/parity/ffx/ko_reset.json').not.toBeNull();
    expect(fixture!.vectors.filter((v) => v.class === 'ko_reset').length).toBeGreaterThanOrEqual(400);
    expect(fixture!.vectors.filter((v) => v.class === 'death_check').length).toBeGreaterThanOrEqual(500);
  });

  for (const set of sets) {
    it(`KO reset: every vector equals the game's (${set.vectors.filter((v) => v.class === 'ko_reset').length})`, () => {
      for (const v of set.vectors.filter((x) => x.class === 'ko_reset')) {
        const got = koReset(wordsOf(v.in), v.in['arg'] as number);
        expect(got, `vector ${v.id}`).toEqual(wordsOf(v.out));
      }
    });

    it(`death check: kind, Overkill, the Auto-Life queue and the wiped words equal the game's (${set.vectors.filter((v) => v.class === 'death_check').length})`, () => {
      let ran = 0;
      let overkill = 0;
      let autoLife = 0;
      let kind2 = 0;
      for (const v of set.vectors.filter((x) => x.class === 'death_check')) {
        const i = v.in as Record<string, unknown>;
        const out = v.out as Record<string, unknown>;
        const got = deathCheck({
          chr: wordsOf(i),
          victim: i['victim'] as number,
          exists: i['exists'] as number,
          dead: i['dead'] as number,
          eject: i['eject'] as number,
          noRewards: i['noRewards'] as number,
          overkillCounter: i['overkillCounter'] as number,
          debugNoOverkill: i['debugNoOverkill'] as number,
        });
        const label = `vector ${v.id}`;
        expect(out['dead'], label).toBe(got.ran ? 1 : i['dead']); // the dead flag is set when the check ran and left alone otherwise
        expect(got.kind, label).toBe(out['kind']);
        expect(got.overkill ? 1 : 0, label).toBe(out['overkillFlag']);
        expect(got.autoLifeQueued ? 1 : 0, label).toBe(out['autoLifeQueued']);
        expect(got.ran ? 1 : 0, label).toBe(out['cancelled']);
        expect(got.chr, label).toEqual(wordsOf(out));
        if (got.ran) ran += 1;
        if (got.overkill) overkill += 1;
        if (got.autoLifeQueued) autoLife += 1;
        if (got.kind === 2) kind2 += 1;
      }
      // the sample has to reach each branch, or the replay proves less than it says
      expect(ran).toBeGreaterThan(100);
      expect(overkill).toBeGreaterThan(5);
      expect(autoLife).toBeGreaterThan(10);
      expect(kind2).toBeGreaterThan(5);
    });
  }
});
