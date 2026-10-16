/**
 * The independent oracle of `parity-ffx-engine-k-orders.test.ts` (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): the Magus Sisters' target search and
 * the sixteen order handlers written out again from the note (`research/re-ffx-zanmato-and-orders.md` Part 2 sections 9 to 14) as straight-line code, with NO import of
 * `kernel/sister-search.ts`, `sister-chains.ts`, `sister-orders.ts` or the adapters. A mistake in how the engine builds the search's world, in the order of the draws, in the
 * chains' data or in the gains shows as a difference from this file. (The kernels themselves are replayed against the game's own code and script VM in
 * `parity-ffx-sister-orders.test.ts`; this oracle is for the engine's wiring.)
 *
 * Each function takes the raw draws the engine took (the test taps the generator) and answers what the game would have chosen.
 */

import { Draws, FACTS, type OMonster, type OSister, type OWorld, SLOT, type Who, candidates, holds, tdiv, usable } from './ffxSisterSearchOracle.ts';

export { Draws, SLOT };
export type { OMonster, OSister, OWorld, Who };

const REST = 0x312c;
const DELTA = 0x30ea;

/** What a handler did, in order. */
export type Effect =
  | { kind: 'perform'; target: number; cmd: number }
  | { kind: 'gain2'; g: number; m: number }
  | { kind: 'gain4'; g: [number, number, number, number] }
  | { kind: 'stand'; value: number }
  | { kind: 'delta' };

/** One sister's state a handler reads and writes. */
export interface OState {
  who: Who;
  m: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  cindyAlive: boolean;
  cindyReflect: boolean;
  last: number;
  flag: number;
  cls: number;
  lst: [number, number];
  cnt: number;
  /** The standing order. */
  stand: number;
}

export class Oracle {
  readonly fx: Effect[] = [];
  constructor(readonly w: OWorld, readonly st: OState, readonly draws: Draws) {}
  /** The last search's stored group (for -16). */
  stored: number[] = [];

  /** `RollMagusRandom(a, b)`. */
  roll(a: number, b: number): boolean {
    if (b < 0) return true;
    if (a !== 0 && this.st.stand !== 0) return a === this.st.stand;
    return (this.draws.take18() & 0xff) < b;
  }

  /** `btlGetCommandTargetSearch`: the picked slot, 255 for none. */
  search(cmd: number, T: number, P: number, F: number, C: number): number {
    const f = FACTS[cmd]!;
    const actor = SLOT[this.st.who];
    const cands = candidates(this.w, actor, cmd, T);
    if (cands.length === 0 || !usable(this.w, this.st.who, cmd)) {
      this.stored = cands;
      return 255;
    }
    if (!this.roll(cmd, C)) {
      this.stored = cands;
      return 255;
    }
    const acc = cands.filter((s) => holds(this.w, P, s) !== ((F & 0x80) !== 0));
    let picked = 255;
    if (acc.length === 1) picked = acc[0]!;
    else if (acc.length > 1) picked = acc[this.draws.take4() % acc.length]!;
    this.stored = f.type === 'group' ? [...new Set([...acc, ...cands])] : f.type === 'self' ? [actor] : acc;
    return picked;
  }

  private perform(target: number, cmd: number, setLast = true): void {
    if (setLast) this.st.last = cmd;
    this.fx.push({ kind: 'perform', target, cmd });
  }
  private g2(g: number, m: number): void {
    this.fx.push({ kind: 'gain2', g, m });
  }
  private setStand(v: number): void {
    this.st.stand = v & 0xffff;
    this.fx.push({ kind: 'stand', value: v });
  }
  private rest(): void {
    this.perform(-13, REST);
  }
  private fail(m = -5): void {
    this.g2(0, m);
    this.rest();
  }
  /** One candidate; true when taken. */
  private t(cmd: number, T: number, P: number, F: number, C: number, gain: [number, number], target?: number): boolean {
    const s = this.search(cmd, T, P, F, C);
    if (s === 255) return false;
    this.g2(gain[0], gain[1]);
    this.perform(target ?? s, cmd);
    return true;
  }

  // ----------------------------------------------------------------------------------------------------------------- Cindy
  private cindyTail(): void {
    if (!this.t(0x30e5, 0, 92, 0, this.st.m, [3, 5])) this.fail();
  }
  private cindy(cls: number): void {
    const { m, hp, maxHp, mp, maxMp } = this.st;
    if (cls === 1) {
      if (this.t(0x30e5, 0, 92, 0, m, [1, 2])) return;
      if (this.t(0x3000, 0, 92, 0, -1, [1, 2])) return;
      return this.fail();
    }
    if (cls === 2) {
      if (this.t(0x30e5, 0, 92, 0, 20 + m, [2, 4])) return;
      if (this.t(0x3000, 0, 92, 0, 150 + m, [1, 3])) return;
      return this.fail();
    }
    if (cls === 3) {
      if ((hp < maxHp || this.st.stand !== 0) && this.t(0x3019, 1, 92, 0, tdiv((maxHp - hp) * 256, maxHp), [1, 1], -16)) return;
      if ((mp < maxMp || this.st.stand !== 0) && this.t(0x3051, 0, 92, 0, tdiv((maxMp - mp) * 256, maxMp), [1, 1])) return;
      if (this.t(0x3000, 0, 92, 0, m * 2, [1, 2])) return;
      const gate = this.roll(0, tdiv(m, 2));
      if (gate || this.st.stand !== 0) {
        if (this.t(0x3053, 0, 92, 0, m - 80, [5, 10], -16)) return;
        if (this.t(0x3052, 0, 92, 0, tdiv(m, 8), [2, 6])) return;
        if (this.t(0x3050, 0, 92, 0, tdiv(m, 2), [2, 6])) return;
        for (const c of [0x304a, 0x304c, 0x304b, 0x3049]) if (this.t(c, 0, 92, 0, m, [1, 2])) return;
        if (this.t(0x3000, 0, 92, 0, -1, [1, 2])) return;
      }
      return this.cindyTail();
    }
    if (cls === 4) {
      if (this.t(0x3035, 1, 242, 0, m, [1, 2])) return;
      if (this.t(0x3034, 1, 242, 0, 150 + m, [1, 1])) return;
      if (this.t(0x3040, 1, 152, 128, 50 + m, [3, 10])) return;
      for (const c of [0x302b, 0x302c, 0x302d]) if (this.t(c, 0x101, 283, 128, tdiv(m, 2), [1, 2])) return;
      return this.cindyTail();
    }
    // class 0: the free choice
    if (this.t(0x3040, 1, 152, 128, m + 50, [3, 10])) return;
    if (this.t(0x3035, 1, 242, 0, tdiv(50 + m, 2), [2, 6])) return;
    if (this.t(0x3034, 1, 242, 0, tdiv(200 + m, 2), [1, 5])) return;
    if (this.t(0x3000, 0, 92, 0, m, [1, 2])) return;
    if (this.t(0x3052, 0, 92, 0, tdiv(m, 8), [2, 6])) return;
    const gate = this.roll(0, 128);
    if (gate || this.st.stand !== 0) for (const c of [0x3049, 0x304b, 0x304a, 0x304c]) if (this.t(c, 0, 92, 0, tdiv(m, 2), [1, 2])) return;
    this.fail();
  }

  // ----------------------------------------------------------------------------------------------------------------- Sandy
  private sandyTail(): void {
    if (this.t(0x30e7, 0, 92, 0, 128, [1, 2])) return;
    if (this.t(0x3000, 0, 92, 0, -1, [1, 2])) return;
    this.fail();
  }
  private sandy(cls: number): void {
    const m = this.st.m;
    if (cls === 1) return this.sandyTail();
    if (cls === 2) {
      if (this.t(0x30e7, 0, 92, 0, m + 50, [2, 4])) return;
      if (this.t(0x3000, 0, 92, 0, m + 180, [1, 3])) return;
      return this.fail();
    }
    if (cls === 5) {
      const rows: Array<[number, number, number, number, number, number | undefined]> = [
        [0x303a, 1, 286, 128, m + 50, undefined], [0x303b, 1, 287, 128, m + 50, undefined], [0x3036, 1, 288, 128, m, undefined], [0x312d, 1, 285, 128, m + 50, -16],
        [0x302b, 0x101, 283, 128, tdiv(m, 4), undefined], [0x302c, 0x101, 283, 128, tdiv(m, 6), undefined], [0x302d, 0x101, 283, 128, tdiv(m, 8), undefined],
      ];
      for (const [c, T, P, F, C, tg] of rows) if (this.t(c, T, P, F, C, [1, 2], tg)) return;
      if (this.t(0x30e7, 0, 92, 0, m, [2, 2])) return;
      if (this.t(0x3000, 0, 92, 0, m, [1, 2])) return;
      return this.fail();
    }
    if (this.t(0x303c, 0x20f, 50, 128, m + 200, [2, 2])) return;
    this.sandyTail();
  }

  // ----------------------------------------------------------------------------------------------------------------- Mindy
  private mindy(cls: number): void {
    const { m, hp, maxHp, mp, maxMp } = this.st;
    if (cls === 1) {
      if (this.t(0x30e9, 0, 92, 0, 128, [1, 2])) return;
      if (this.t(0x3000, 0, 92, 0, m + 100, [1, 3])) return;
      return this.fail();
    }
    if (cls === 2) {
      if (this.t(0x30e9, 0, 92, 0, m + 30, [2, 4])) return;
      if (this.t(0x3000, 0, 92, 0, m + 180, [1, 3])) return;
      return this.fail();
    }
    if (cls === 6) {
      if (this.t(0x3020, 0, 92, 0, tdiv(m, 2), [2, 3])) return;
      if (this.t(0x3050, 0, 92, 0, tdiv((maxHp - hp) * 256, maxHp * 2), [2, 3])) return;
      if (this.t(0x3051, 0, 92, 0, tdiv((maxMp - mp) * 256, maxMp * 2), [2, 3])) return;
      return this.fail(-1);
    }
    // class 0: the free choice (section 14)
    if (this.st.cindyAlive) {
      if (this.st.cnt > 0) {
        for (let i = 0; i < this.st.cnt; i++) {
          const cmd = this.st.lst[i]!;
          const s = this.search(cmd, 0x20f, 92, 0, -1);
          if (s !== 255) this.perform(s, cmd, false);
        }
        return;
      }
      if (this.st.cindyReflect && this.st.stand === 0) {
        const rounds = this.roll(0, m) ? 2 : 1;
        let found = 0;
        for (let round = 0; round < rounds; round++) {
          let got: [number, number] | null = null;
          const on = (c: number, C: number, g: [number, number]): boolean => {
            const s = this.search(c, 0x20f, 92, 0, C);
            if (s === 255) return false;
            this.g2(g[0], g[1]);
            got = [s, c];
            return true;
          };
          if (!on(0x3052, tdiv(m, 2), [2, 3])) {
            const curse = [0x304d, 0x304f].some((c) => on(c, tdiv(m, 2), [2, 2]));
            if (!curse) {
              const elem = [0x3049, 0x304b, 0x304c, 0x304a, 0x3045, 0x3047, 0x3048, 0x3046].some((c) => on(c, m, [1, 2]));
              if (!elem) on(0x3050, m, [0, 1]);
            }
          }
          const g = got as [number, number] | null;
          if (g !== null) {
            if (found < 2) this.st.lst[found] = g[1];
            found++;
            this.perform(g[0], g[1], false);
          }
        }
        if (found > 0) {
          this.st.cnt = found;
          return;
        }
      }
    }
    if (this.t(0x30e9, 0, 92, 0, m + 100, [1, 3])) return;
    if (this.t(0x3000, 0, 92, 0, m + 100, [1, 3])) return;
    this.fail();
  }

  // ----------------------------------------------------------------------------------------------------------------- events
  private enter(cls: number): void {
    const w = this.st.who;
    if (w === 'cindy') this.cindy([1, 2, 3, 4].includes(cls) ? cls : 0);
    else if (w === 'sandy') this.sandy([1, 2, 5].includes(cls) ? cls : 0);
    else this.mindy([1, 2, 6].includes(cls) ? cls : 0);
  }

  /** Run script event `event` (13 free choice, 14 One more time, 15 Fight!, 16 Go go, 17 Help, 18 Combine, 19 Defense!, 20 Are you all right?). */
  run(event: number): void {
    const st = this.st;
    if (event === 18) {
      this.setStand(0);
      if (this.search(DELTA, 0, 92, 0, 200 + st.m) !== 255) {
        this.fx.push({ kind: 'delta' });
        this.g2(0, 10);
        return;
      }
      this.g2(0, -10);
      return this.rest();
    }
    if (event === 14) {
      if (this.roll(0, st.m + (st.who === 'cindy' ? 150 : 120))) {
        this.fx.push({ kind: 'gain4', g: [2, 4, 0, st.who === 'mindy' ? -15 : -6] });
        this.setStand(st.last);
        st.flag = 1;
        return this.enter(st.cls);
      }
      if (st.who === 'mindy') st.cnt = 0;
      this.setStand(0);
      st.flag = 0;
      st.cls = 1;
      return this.enter(1);
    }
    const cls = ({ 13: 0, 15: 2, 16: 3, 17: 4, 19: 5, 20: 6 } as Record<number, number>)[event]!;
    if (st.who === 'mindy') st.cnt = 0;
    this.setStand(0);
    st.flag = 0;
    st.cls = cls;
    this.enter(cls);
  }
}
