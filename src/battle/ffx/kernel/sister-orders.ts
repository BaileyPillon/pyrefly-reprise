/**
 * The Magus Sisters' order handlers (re-parity lane FFX-K, the Sisters' orders of 2026-10-15; **FFX only**): the interpreter that walks the chains of
 * `./sister-chains.ts` the way the three sister workers of the battle-system script do.
 *
 * **Game case: FFX only.** Source: `research/re-ffx-zanmato-and-orders.md` Part 2 sections 11 to 14 (branch `re-ffx-zanmato-and-orders`, final decode `f59c4592`),
 * **proved** on the game's own script VM: each of the sixteen handlers (Cindy events 13 to 18, Sandy 13, 14, 15, 18, 19, Mindy 13, 14, 15, 18, 20) ran 1,500 times
 * against an independent model, 0 mismatches (`tests/unit/parity-ffx-sister-orders.test.ts` replays a stratified subset of the VM's own logs from
 * `tests/fixtures/parity/ffx/sister_orders.json`). The natives a handler calls are the {@link OrderHost}: the chance roll, the search, the gain calls, the standing-order
 * store and load, the perform call and the Delta Attack call. This module decides nothing about the world; it only walks the chain, in the VM's order.
 *
 * The rules, in the order the handler takes them:
 *
 * - **Clear, class, walk.** Every handler but "One more time" stores the standing order 0, clears the repeat flag and stores its class (Mindy's handlers other than Combine
 *   also reset her stored-spell count) before it searches anything. The first candidate whose search returns a slot is performed after its two-argument gain call;
 *   with none, the loss (5, Mindy's "Are you all right?" 1) and the rest command on herself.
 * - **"One more time"** (event 14) rolls a plain `M + 150` (Cindy) or `M + 120`: a pass writes the four-argument pair, stores the sister's **last performed command**
 *   (the rest command included) as the standing order, sets the repeat flag and re-enters the chain of her stored class (a class with no chain, 0 and the Combine's
 *   none, re-enters her free choice); a failure stores 0, clears Mindy's list count, stores class 1 and runs the class 1 chain.
 * - **Combine powers** (event 18) clears the standing order and searches the Delta Attack at `200 + M` on the monsters: a pass calls the joint action and writes
 *   (0, +10), a failure (0, -10) and the rest command. It sets no last command on a pass; the rest command on a failure does.
 * - **Mindy's free choice** (section 14) has a second mode: with Cindy alive it replays her stored list (search each on Cindy alone, threshold -1, perform, no gain call,
 *   no last command) or, with Cindy holding Reflect and no order standing, casts one or two spells **at Cindy** so they bounce onto the enemies.
 *
 * Pure and deterministic (AGENTS.md rule 1): every effect is a callback; nothing here imports the DOM, `three` or the engine.
 */

import { NO_TARGET } from './sister-search.ts';
import {
  CHAINS,
  C,
  EVENT_CLASS,
  MINDY_COMBO,
  P_ANY,
  REPEAT,
  T_CINDY,
  T_MONSTERS,
  type Chain,
  type Chance,
  type SisterName,
  type Step,
  type Try,
} from './sister-chains.ts';

/** The perform target that means "the stored group" (`performCommand(-16, ...)`) and "herself" (`performCommand(-13, ...)`). */
export const TARGET_GROUP = -16;
export const TARGET_SELF = -13;

/** The sister's facts a handler reads, and her private variables (all of which a handler may write). */
export interface OrderState {
  /** Her motivation, 0 to 100 (`readBtlChrProperty2(279)`). */
  m: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  /** Mindy's reads: Cindy is alive, Cindy holds Reflect (property 4 and property 50 of slot 15). */
  cindyAlive: boolean;
  cindyReflect: boolean;
  /** Private variables: the last command she performed (0 at the start), the repeat flag, the class, and Mindy's stored list (two entries) and its count. */
  last: number;
  flag: number;
  cls: number;
  list: [number, number];
  count: number;
}

/** The natives a handler calls (each is one effectful step of the VM's log). */
export interface OrderHost {
  /** `RollMagusRandom(a, b)`: a plain roll has `a` 0. */
  roll(a: number, b: number): boolean;
  /** `btlGetCommandTargetSearch(cmd, T, P, F, C)`: the picked slot, {@link NO_TARGET} for none. */
  search(cmd: number, T: number, P: number, F: number, C: number): number;
  /** The standing order (a command id, 0 for none). */
  stand(): number;
  setStanding(value: number): void;
  /** `increaseMagusMotivationAndOverdrive(gauge, motivation)` (suppressed by the native while an order stands). */
  gain2(gauge: number, motivation: number): void;
  /** `setMagusMotivationAndOverdriveChange...(gaugePos, motivationPos, gaugeNeg, motivationNeg)`. */
  gain4(gaugePos: number, motivationPos: number, gaugeNeg: number, motivationNeg: number): void;
  /** `performCommand(target, command)`: a slot, {@link TARGET_GROUP} or {@link TARGET_SELF}. */
  perform(target: number, cmd: number): void;
  /** The Delta Attack call (the joint action starts). */
  delta(): void;
}

const tdiv = (a: number, b: number): number => Math.trunc(a / b);

/** A chance expression, evaluated for the state. */
export function chanceOf(c: Chance, st: OrderState): number {
  switch (c.k) {
    case 'm':
      return tdiv((c.mul ?? 1) * st.m + (c.add ?? 0), c.div ?? 1);
    case 'n':
      return c.v;
    case 'hp':
      return tdiv((st.maxHp - st.hp) * 256, st.maxHp * c.div);
    case 'mp':
      return tdiv((st.maxMp - st.mp) * 256, st.maxMp * c.div);
  }
}

/** The interpreter of one handler run. */
class Run {
  readonly st: OrderState;
  readonly host: OrderHost;

  constructor(st: OrderState, host: OrderHost) {
    this.st = st;
    this.host = host;
  }

  /** `performCommand`, setting the sister's last command (the rest command included). */
  perform(target: number, cmd: number): void {
    this.st.last = cmd;
    this.host.perform(target, cmd);
  }

  /** Nothing in the list was taken: the loss and the rest command on herself. */
  fail(loss: number): void {
    this.host.gain2(0, -loss);
    this.perform(TARGET_SELF, C.rest);
  }

  /** One candidate; true when it was taken and performed. */
  tryOne(t: Try): boolean {
    const slot = this.host.search(t.cmd, t.t, t.p, t.neg ? 128 : 0, chanceOf(t.chance, this.st));
    if (slot === NO_TARGET) return false;
    this.host.gain2(t.gain[0], t.gain[1]);
    this.perform(t.group ? TARGET_GROUP : slot, t.cmd);
    return true;
  }

  /** The candidates in order; true when one was taken. */
  tryAll(list: readonly Try[]): boolean {
    for (const t of list) if (this.tryOne(t)) return true;
    return false;
  }

  /** One step of a chain; true when a candidate was taken. */
  step(s: Step): boolean {
    if ('cmd' in s) return this.tryOne(s);
    if ('when' in s) {
      const below = s.when === 'hp' ? this.st.hp < this.st.maxHp : this.st.mp < this.st.maxMp;
      return (below || this.host.stand() !== 0) && this.tryAll(s.then);
    }
    // A plain roll is drawn first and always; the standing order is read after it.
    const passed = this.host.roll(0, chanceOf(s.gate, this.st));
    return (passed || this.host.stand() !== 0) && this.tryAll(s.then);
  }

  chain(c: Chain): void {
    for (const s of c.steps) if (this.step(s)) return;
    this.fail(c.loss);
  }
}

/** The search Mindy's combo makes: Cindy alone, property 92. */
const onCindy = (r: Run, cmd: number, chance: Chance): number => r.host.search(cmd, T_CINDY, P_ANY, 0, chanceOf(chance, r.st));

/**
 * Mindy's free choice (section 14): the replay of her stored list, the Reflect combo, or the last mode (Passado, Attack, the rest command). Performs the combo's and the
 * replay's spells directly (they set no last command); the last mode goes through the chain.
 */
function mindyFree(r: Run): void {
  const { st, host } = r;
  if (st.cindyAlive) {
    if (st.count > 0) {
      for (let i = 0; i < st.count; i++) {
        const cmd = st.list[i] as number;
        const slot = host.search(cmd, T_CINDY, P_ANY, 0, -1);
        if (slot !== NO_TARGET) host.perform(slot, cmd);
      }
      return;
    }
    if (st.cindyReflect && host.stand() === 0) {
      const rounds = host.roll(0, st.m) ? 2 : 1;
      let found = 0;
      for (let round = 0; round < rounds; round++) {
        let spell: { slot: number; cmd: number } | null = null;
        const take = (cmd: number, chance: Chance, gain: readonly [number, number]): boolean => {
          const slot = onCindy(r, cmd, chance);
          if (slot === NO_TARGET) return false;
          host.gain2(gain[0], gain[1]);
          spell = { slot, cmd };
          return true;
        };
        const flare = MINDY_COMBO.flare;
        if (!take(flare.cmd, flare.chance, flare.gain)) {
          if (!MINDY_COMBO.curses.cmds.some((c) => take(c, MINDY_COMBO.curses.chance, MINDY_COMBO.curses.gain))) {
            if (!MINDY_COMBO.elements.cmds.some((c) => take(c, MINDY_COMBO.elements.chance, MINDY_COMBO.elements.gain))) {
              take(MINDY_COMBO.drain.cmd, MINDY_COMBO.drain.chance, MINDY_COMBO.drain.gain);
            }
          }
        }
        const got = spell as { slot: number; cmd: number } | null;
        if (got !== null) {
          if (found < 2) st.list[found] = got.cmd;
          found++;
          host.perform(got.slot, got.cmd);
        }
      }
      if (found > 0) {
        st.count = found;
        return;
      }
    }
  }
  r.chain(CHAINS.mindy[0] as Chain);
}

/** Re-enter the chain of a stored class (the repeat): a class with no chain re-enters the free choice. */
function enter(r: Run, sister: SisterName, cls: number): void {
  if (sister === 'mindy' && CHAINS.mindy[cls] !== undefined && cls !== 0) return r.chain(CHAINS.mindy[cls] as Chain);
  if (sister === 'mindy') return mindyFree(r);
  const chain = CHAINS[sister][cls] ?? (CHAINS[sister][0] as Chain);
  r.chain(chain);
}

/**
 * Run the handler of script event `event` (13 free choice, 14 One more time, 15 Fight!, 16 Go, go!, 17 Help each other!, 18 Combine powers, 19 Defense!, 20 Are you
 * all right?) for `sister`. Writes her private variables into `st`; every other effect goes through `host`, in the order the VM takes them.
 */
export function runOrder(sister: SisterName, event: number, st: OrderState, host: OrderHost): void {
  const r = new Run(st, host);
  if (event === 18) {
    host.setStanding(0);
    if (host.search(C.delta, T_MONSTERS, P_ANY, 0, 200 + st.m) !== NO_TARGET) {
      host.delta();
      host.gain2(0, 10);
      return;
    }
    r.fail(10);
    return;
  }
  if (event === 14) {
    const repeat = REPEAT[sister];
    if (host.roll(0, st.m + repeat.add)) {
      host.gain4(repeat.pair[0], repeat.pair[1], repeat.pair[2], repeat.pair[3]);
      host.setStanding(st.last);
      st.flag = 1;
      enter(r, sister, st.cls);
    } else {
      if (sister === 'mindy') st.count = 0;
      host.setStanding(0);
      st.flag = 0;
      st.cls = 1;
      enter(r, sister, 1);
    }
    return;
  }
  const cls = EVENT_CLASS[event];
  if (cls === undefined) throw new Error(`FFX engine: the Sisters have no order handler for event ${event}`);
  if (sister === 'mindy') st.count = 0;
  host.setStanding(0);
  st.flag = 0;
  st.cls = cls;
  enter(r, sister, cls);
}
