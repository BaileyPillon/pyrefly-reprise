/**
 * The player's Yojimbo: the free attack, Pay, the command roll, the hire answer and the compatibility (re-parity lane FFX-K, row K2;
 * **FFX only**).
 *
 * **Game case: FFX only** (FFX-2's Yojimbo is a mission boss with its own rules). Source: FFX.exe, Steam build 25501027, SHA-256
 * 0537B2A1...686D; note `FFX-G08` sections 2, 3 and 4 (our words here). The player's Yojimbo is run by a battle script (worker 59 of the
 * system script); the exe supplies small pieces. Every function below is the game's: the native pieces were run as the game's machine code
 * in an x86-32 emulator (144,839 vectors, 0 mismatches), the script on the game's own script VM (39,998 runs, 0 mismatches); the
 * replay is `tests/unit/parity-ffx-yojimbo.test.ts` on `tests/fixtures/parity/ffx/yojimbo_natives.json` and `yojimbo_script.json`
 * (stratified subsets of those runs). No code of the game is reproduced; addresses are in the comments only.
 *
 * | Function here | VA / script | What the game calls it |
 * |---|---|---|
 * | {@link rollYojimboCommand} | 0x007a7b90 | RollYojimboCommand (script call 0x70EE) |
 * | {@link turnStartRoll} | 0x00792120 | `pp_BtlYojimboCompatRoll`, called by the turn-start function |
 * | {@link compatAdd} | 0x007b2950 | the compatibility add (clamp 0..255) |
 * | {@link payEvent} | worker 59, function 2 (event 9) | the Pay command |
 * | {@link freeAttackEvent} | worker 59, function 3 (event 0) | a free attack at turn start |
 * | {@link dismissEvent} | worker 59, function 4 (event 10) | the player's Dismiss |
 * | {@link wipeEvent} | worker 59, function 5 (event 11) | Yojimbo knocked out or Petrified while he is out |
 *
 * **The two numbers the game's image does not hold.** The compatibility global is 0 in the image and no initialiser was found (note,
 * open question 1). The community says 128, and the owner's own save files read 128 in every slot from 1 to 84 (RE main session; the save
 * offset is inferred and live confirmation is pending), so 128 is strongly indicated; nothing in this file holds a starting value, so a
 * caller must give one. The hire answer (0, 1 or 2) is written only by the recruitment event; the game's default is 0.
 *
 * Pure and deterministic (AGENTS.md rule 1): the draws and the target picks are callbacks of a {@link YojimboHost}; nothing here holds a
 * generator, imports the DOM, `three` or the engine.
 */

/** The random stream every Yojimbo draw uses (`research` stream map; the turn-start roll, the script's raw draw). */
export const YOJIMBO_STREAM = 17;

/** The five commands the roll chooses between. */
export const YojimboCommand = {
  Daigoro: 0x30de,
  Kozuka: 0x30df,
  /** Wakizashi on one target. */
  WakizashiOne: 0x30e0,
  /** Wakizashi on all (the group). */
  WakizashiAll: 0x30e1,
  Zanmato: 0x30e2,
} as const;

/** The command-record byte `Cmd+0x1a` of each of the five (single target: 0x33 and 0xb3; group: 0xb7), `FFX-G08` section 2 (0x007a8680). */
export const YOJIMBO_COMMAND_B1A: Readonly<Record<number, number>> = {
  [YojimboCommand.Daigoro]: 0x33,
  [YojimboCommand.Kozuka]: 0xb3,
  [YojimboCommand.WakizashiOne]: 0xb3,
  [YojimboCommand.WakizashiAll]: 0xb7,
  [YojimboCommand.Zanmato]: 0xb7,
};

/** The properties the script reads and writes (the numbers of the game's property calls). */
export const YojimboProperty = {
  /** The Overdrive gauge and its maximum. */
  Gauge: 19,
  GaugeMax: 20,
  /** Curse (bit 0x400 of the status word). */
  Curse: 153,
  Compatibility: 273,
  /** The amount of the action in progress: the payment. */
  Amount: 274,
  /** The highest Zanmato byte among the monsters of a selector. */
  ZanmatoByte: 275,
  /** Turns (parsed actions) taken. */
  Turns: 276,
  /** The presentation reaction: 1 regular, 2 nod, 3 headshake. */
  Reaction: 277,
  /** The flag the full-gauge bonus sets; the next parsed action pays for it with the whole gauge. */
  FullGaugeFlag: 312,
} as const;

/** The reaction values (a presentation byte the executor holds the action for while it is non-zero). */
export const Reaction = { None: 0, Regular: 1, Nod: 2, Headshake: 3 } as const;

/** One effectful step of a script run, in the order the game takes them (the same shape the VM logs hold). */
export type YojimboStep =
  | readonly ['set', property: number, value: number]
  | readonly ['perform', selector: number, command: number]
  | readonly ['target', command: number]
  | readonly ['draw']
  | readonly ['roll', a: number, b: number, command: number];

/** What the script asks of the world. */
export interface YojimboHost {
  /** `btlGetYoujinboRandom` (0x007a7d10): one draw on stream 17, returned unmasked. */
  draw(): number;
  /** `btlSetRandomTarget(command)` (0x007a8680): picks a target set for the command; true when it found one. */
  target(command: number): boolean;
  /** `performCommand(self, command)`: queues the command against the stored target set; true when it was queued. */
  perform(command: number): boolean;
}

/** What a script run reads (the property reads and the two globals). */
export interface YojimboInputs {
  /** Property 273. */
  compat: number;
  /** Property 274: the payment (a Pay event only). */
  given: number;
  /** The party's total gil, read before the payment is taken. */
  gil: number;
  /** The hire answer: 0, 1 or 2 (3 and above are not reachable and read as 1). */
  hire: number;
  /** The highest Zanmato byte among all monsters (selector "all monsters"). */
  zanAll: number;
  /**
   * The highest Zanmato byte of the "matching group" (the free attack's check). A function is read when the check is made, after the target
   * pick (the script reads it there; the group depends on what the pick stored).
   */
  zanGroup: number | (() => number);
  /** Properties 19 and 20: his gauge and its maximum, in the game's units. */
  odCur: number;
  odMax: number;
  /** Property 153: Curse (0 or 1). */
  curse: number;
  /** Property 276: parsed actions taken in this battle. */
  turns: number;
  /** Property 277 as the run starts. */
  reaction: number;
}

/** What a script run decided. */
export interface YojimboRun {
  /** Every effectful step, in order. */
  trace: YojimboStep[];
  /** The compatibility after the run (clamped 0..255). */
  compat: number;
  /** Property 277 after the run. */
  reaction: number;
  /** The command that was queued, or 0 when none (a Dismiss, a command nobody could queue, or a command outside the five). */
  command: number;
  /** The queueing returned true, so the compatibility delta was added. */
  queued: boolean;
  /** Property 312 was set: the full-gauge bonus was taken, and the next parsed action pays the gauge. */
  gaugeBonus: boolean;
  /** Draws taken on stream 17 by the script. */
  draws: number;
}

// ---------------------------------------------------------------------------
// The native pieces
// ---------------------------------------------------------------------------

/** A signed 32-bit integer. */
const s32 = (v: number): number => v | 0;
/** C integer division (truncates toward zero). */
const tdiv = (a: number, b: number): number => Math.trunc(a / b);

/**
 * The game's float-to-integer conversion (the argument popper): truncates toward zero, and gives the most negative integer when the value
 * is not a number or out of range.
 */
export function truncToInt32(x: number): number {
  if (x !== x || x >= 2147483648 || x < -2147483648) return -2147483648;
  return Math.trunc(x);
}

/**
 * RollYojimboCommand (0x007a7b90): the sum of its two integer arguments chooses the command. Below 32 Daigoro, 32 to 47 Kozuka, 48 to 62
 * Wakizashi on one, 63 to 79 Wakizashi on all, 80 and above Zanmato. (The audit text "32/48/63/79" names the last Wakizashi value, not the
 * Zanmato threshold.)
 */
export function rollYojimboCommand(a: number, b: number): number {
  const sum = s32(a + b);
  if (sum < 0x20) return YojimboCommand.Daigoro;
  if (sum < 0x30) return YojimboCommand.Kozuka;
  if (sum < 0x3f) return YojimboCommand.WakizashiOne;
  if (sum <= 0x4f) return YojimboCommand.WakizashiAll;
  return YojimboCommand.Zanmato;
}

/** The compatibility add (0x007b2950): the sum, clamped to 0..255. */
export function compatAdd(compat: number, delta: number): number {
  return Math.min(Math.max(compat + delta, 0), 255);
}

/** Does the free-attack test win? `(draw & 0xFF) < compat div 4` (C division: a negative compatibility truncates toward zero). */
export function freeAttackWins(compat: number, draw: number): boolean {
  return (draw & 0xff) < tdiv(s32(compat), 4);
}

/** The signed byte `Chr+0xdf3` reads as. */
const s8 = (v: number): number => ((v & 0xff) ^ 0x80) - 0x80;

/**
 * `pp_BtlYojimboCompatRoll` (0x00792120): the turn-start test. For Yojimbo (character 0xE) it draws once and returns 1 when the free-attack
 * test wins; otherwise (and for every other character) it returns the signed byte `Chr+0xdf3`. Non-zero means the turn is script-run (no
 * menu opens). `df3` is 1 for monster slots, 0 for party and aeons.
 */
export function turnStartRoll(chrId: number, df3: number, compat: number, draw: () => number): number {
  let result = s8(df3);
  if (chrId === 0xe && freeAttackWins(compat, draw())) result = 1;
  return result;
}

/**
 * The gil part of the motivation: 4 for every `k` in 0..29 for which `amount div (4 x 2^k)` is at least 2, so `4 x (floor(log2 amount) - 2)`
 * from 8 gil and 0 below it (the divisor of the last test wraps negative and never counts). `amount` is positive here.
 */
export function gilMotivation(amount: number): number {
  let v = 0;
  let d = 4;
  for (let k = 0; k < 30; k++) {
    const q = d !== 0 ? tdiv(amount, d) : 0;
    if (q > 1) v += 4;
    d = s32(d * 2);
  }
  return v;
}

// ---------------------------------------------------------------------------
// The script (worker 59)
// ---------------------------------------------------------------------------

const f32 = Math.fround;

/** The step the script takes once the command is rolled, shared by Pay and the free attack (`free`: the free attack). */
function perform(inputs: YojimboInputs, state: { compat: number; reaction: number }, command: number, free: boolean, host: YojimboHost, trace: YojimboStep[]): { queued: boolean; command: number } {
  let cmd = command;
  let delta = 0;
  let found = true;
  const pick = (c: number): boolean => {
    trace.push(['target', c]);
    return host.target(c);
  };
  switch (cmd) {
    case YojimboCommand.Daigoro:
      found = pick(cmd);
      delta = -1;
      if (!found) {
        // No target: Kozuka instead, picked again, no change to compatibility.
        cmd = YojimboCommand.Kozuka;
        found = pick(cmd);
        delta = 0;
      } else if (state.reaction === Reaction.Regular) {
        trace.push(['set', YojimboProperty.Reaction, Reaction.Headshake]);
        state.reaction = Reaction.Headshake;
      }
      break;
    case YojimboCommand.Kozuka:
      pick(cmd);
      delta = 0;
      break;
    case YojimboCommand.WakizashiOne:
      pick(cmd);
      delta = 1;
      break;
    case YojimboCommand.WakizashiAll:
      pick(cmd);
      delta = 3;
      break;
    case YojimboCommand.Zanmato:
      found = pick(cmd);
      delta = 4;
      if (!found || (free && (typeof inputs.zanGroup === 'function' ? inputs.zanGroup() : inputs.zanGroup) > 0)) {
        // No group to hit, or (a free attack) a Zanmato byte above 0 in the group: Wakizashi on all instead.
        cmd = YojimboCommand.WakizashiAll;
        pick(cmd);
        delta = 3;
      } else if (state.reaction === Reaction.Regular) {
        trace.push(['set', YojimboProperty.Reaction, Reaction.Nod]);
        state.reaction = Reaction.Nod;
      }
      break;
    default:
      // Not one of the five: nothing is done after the switch.
      return { queued: false, command: 0 };
  }
  trace.push(['perform', -16, cmd]);
  const queued = host.perform(cmd);
  if (queued) {
    trace.push(['set', YojimboProperty.Compatibility, delta]);
    state.compat = compatAdd(state.compat, delta);
  }
  return { queued, command: cmd };
}

/**
 * The Pay event (event 9, worker 59 function 2; the game's script on its VM, 20,000 runs). The payment becomes a motivation number:
 * `4 x n + compat div 10` (n from {@link gilMotivation}), scaled by the hire answer and by the highest Zanmato byte among the monsters,
 * plus 20 when his gauge is full and he is not Cursed; one draw (stream 17, the low six bits) is added and the roll decides. When a monster
 * has a Zanmato byte above 0 and the first roll is not Zanmato, the script rolls a second time with the monster penalty removed (the full
 * gauge bonus is taken again) and turns a Zanmato result of that second roll into Wakizashi on all.
 *
 * A payment of 0 or less is the "pay nothing" branch: reaction 3, compatibility -20, and Yojimbo's own Dismiss is requested.
 *
 * `hire` 0 with a positive payment and no gil is a state the game cannot reach (a payment cannot exceed the gil) and in which its script
 * never ends; it throws here instead.
 */
export function payEvent(inputs: YojimboInputs, host: YojimboHost): YojimboRun {
  const trace: YojimboStep[] = [['set', YojimboProperty.Reaction, Reaction.Regular]];
  const state = { compat: inputs.compat, reaction: Reaction.Regular as number };
  const amount = inputs.given;
  if (amount <= 0) {
    trace.push(['set', YojimboProperty.Reaction, Reaction.Headshake], ['set', YojimboProperty.Compatibility, -20], ['perform', -13, 0x3057]);
    state.reaction = Reaction.Headshake;
    state.compat = compatAdd(state.compat, -20);
    return { trace, compat: state.compat, reaction: state.reaction, command: 0, queued: false, gaugeBonus: false, draws: 0 };
  }
  if (inputs.hire === 0 && inputs.gil === 0) throw new RangeError('Yojimbo Pay: a positive payment with no gil never finishes in the game');

  let zan = inputs.zanAll;
  let secondPass = false;
  let v = -1;
  let command = 0;
  let gaugeBonus = false;
  let draws = 0;
  while (v < 0) {
    v = f32(gilMotivation(amount) + tdiv(inputs.compat, 10));
    if (inputs.hire === 0) {
      let t = f32(f32(amount) * 50);
      t = f32(t / f32(inputs.gil));
      t = f32(75 + t);
      t = f32(t * v);
      v = f32(t / 100);
    }
    if (inputs.hire === 2) {
      v = f32(v * f32(0.8));
      v = f32(v / f32(tdiv(zan + 3, 3)));
    } else {
      v = f32(v / f32(zan + 1));
    }
    if (inputs.odCur >= inputs.odMax && inputs.curse === 0) {
      trace.push(['set', YojimboProperty.FullGaugeFlag, 1]);
      gaugeBonus = true;
      v = f32(v + 20);
    }
    const d = host.draw();
    draws++;
    trace.push(['draw']);
    const a = truncToInt32(v);
    const b = d & 63;
    command = rollYojimboCommand(a, b);
    trace.push(['roll', a, b, command]);
    if (!secondPass) {
      if (zan > 0 && command !== YojimboCommand.Zanmato) {
        zan = 0;
        secondPass = true;
        v = -1;
      }
    } else {
      v = 1;
      if (command === YojimboCommand.Zanmato) command = YojimboCommand.WakizashiAll;
    }
  }
  const done = perform(inputs, state, command, false, host, trace);
  return { trace, compat: state.compat, reaction: state.reaction, command: done.command, queued: done.queued, gaugeBonus, draws };
}

/**
 * The free attack (event 0, worker 59 function 3; 6,666 runs): taken when the turn-start roll wins. One draw (stream 17), `a = compat div
 * 4`, `b = draw & 63`, the command roll on `(a, b)`, then the same perform step as Pay with one difference: a Zanmato result is replaced by
 * Wakizashi on all when the pick finds no target or the highest Zanmato byte of the "matching group" is above 0. No gil, no hire answer, no
 * gauge bonus.
 */
export function freeAttackEvent(inputs: YojimboInputs, host: YojimboHost): YojimboRun {
  const trace: YojimboStep[] = [];
  const state = { compat: inputs.compat, reaction: inputs.reaction };
  const d = host.draw();
  trace.push(['draw']);
  const a = tdiv(inputs.compat, 4);
  const b = d & 63;
  const command = rollYojimboCommand(a, b);
  trace.push(['roll', a, b, command]);
  const done = perform(inputs, state, command, true, host, trace);
  return { trace, compat: state.compat, reaction: state.reaction, command: done.command, queued: done.queued, gaugeBonus: false, draws: 1 };
}

/**
 * The player's Dismiss (event 10, function 4): if no action of his has been parsed yet in this battle (`turns` is 0) compatibility drops
 * by 3. The parse that raises the counter comes after the request, so a Dismiss as the very first action is penalised.
 */
export function dismissEvent(compat: number, turns: number): { compat: number; trace: YojimboStep[] } {
  if (turns !== 0) return { compat, trace: [] };
  return { compat: compatAdd(compat, -3), trace: [['set', YojimboProperty.Compatibility, -3]] };
}

/**
 * Yojimbo knocked out or Petrified while he is out (event 11, function 5): compatibility drops by 10. He is the only member of the active
 * list then, so this is the "wipe"; the wipe dismissal itself is the party transition of `./aeon-party.ts`.
 */
export function wipeEvent(compat: number): { compat: number; trace: YojimboStep[] } {
  return { compat: compatAdd(compat, -10), trace: [['set', YojimboProperty.Compatibility, -10]] };
}
