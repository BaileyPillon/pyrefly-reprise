/**
 * FFX-2 battle-end kernel, part 1: the evaluation that says whether the fight is over and how, and the decisions at the tail of a logic step
 * (re-parity RC8, lane X2-K; **FFX-2 only**).
 *
 * **Game case: FFX-2 only** (FFX has its own end-of-battle machine, FFX-G10; nothing here applies to it). Source: FFX-2.exe, Steam build
 * 25501027 (SHA-256 6EA7F142...CD69); spec: the checked note FFX2-G10 sections 1 (items 4 and 5), 10.1, 10.2, 10.4 and 16. Pure and
 * deterministic: **no random draw** in any function here (20,000 harness vectors each, none drew).
 *
 * Exe addresses (live build):
 * - 0x0061ef70  the battle-end evaluation (this file, {@link evaluateBattleEnd})
 * - 0x0061e7a0  the post-battle machine (`./battle-end-commit.ts`)
 * - 0x0061e440  the battle logic step, whose tail decides what ends the battle ({@link stepTail})
 *
 * The result code the evaluation returns (the game's "outcome", global 0xDF84B5 once committed):
 * - 0: the fight goes on;
 * - 1: the party is gone (no girl alive: dead, Death or Petrify), a game over;
 * - 2: the enemies are gone and a monster was knocked out for rewards;
 * - 3: nobody of the party is left in the battle but at least one girl is alive: an escape, and also an ejection;
 * - 4: the enemies are gone with no rewarded knock-out.
 * Codes 2 and 4 are both wins; 5 and 6 exist only as script- or debug-written values and are never returned here.
 *
 * The engine reads the evaluation through `../adapt/battle-end.ts`, which says who is a party slot, which enemy is "present" (a part is not: the
 * note does not say how the game's scripts take the Leg's Nodes and the Experiment's parts out of the evaluation, G10 open question 9) and how the
 * codes map onto the engine's two outcomes. Vectors: `tests/fixtures/parity/ffx2/battle_end_eval.json` and `battle_end_tail.json`.
 */

/** The codes {@link evaluateBattleEnd} returns. */
export const BattleEndCode = {
  Running: 0,
  PartyGone: 1,
  WonRewarded: 2,
  NobodyInBattle: 3,
  Won: 4,
} as const;

/** One character as the evaluation reads it (`Chr+0x1788` exists, `+0x1793` party flag, `+0x1787` dead byte, `+0x1784` in battle, `+0x434` status word, `+0x3b4` HP). */
export interface EndChar {
  /** The existence flag: a character that is not there is skipped. */
  exists: boolean;
  /** The party flag (a slot of the active party that is not flagged party is skipped). Read for the party's slots only. */
  party: boolean;
  /** The dead byte (`Chr+0x1787`): set when the character has been knocked out. */
  dead: boolean;
  /** In the battle (`Chr+0x1784`): cleared by an escape and by the Eject status. */
  inBattle: boolean;
  /** The status word: bit 0 is Death, bit 1 is Petrify. Nothing else is read. */
  status: number;
  /** The HP (signed 32-bit). Read only when the dead byte is set. */
  hp: number;
}

/** The globals the evaluation reads besides the characters. */
export interface EndGlobals {
  /** The result byte (0xDF84B5): returned unchanged when it is not 0. */
  preset: number;
  /** The frozen byte (0xDF8491): returned `preset` unchanged when it is not 0. */
  frozen: number;
  /** The rewarded-knock-out byte (0xDF84AD): 2 instead of 4 when the enemies are gone. */
  killed: number;
  /** Any of the three clock-gate bytes (0xDF7814, 0xDF7816, 0xDF68A4) is set: `preset` is returned unchanged. */
  clockGate: boolean;
}

/**
 * The battle-end evaluation (exe 0x0061ef70). `party` holds the three active party slots in order (`null` for a slot byte of 0xFF, none); `monsters`
 * holds the 16 monster characters (slots 15 to 30) in order. Returns the result code, or `preset` unchanged when it is set, frozen or gated.
 *
 * - A party slot counts only when it exists and is flagged party. With the dead byte clear it is alive when neither Death nor Petrify is on, and in
 *   the battle too when its in-battle byte is set; with the dead byte set it is alive when its HP is above 0 (and never in the battle).
 * - No live slot: 1. Live slots but none in the battle: 3.
 * - Every monster that is in the battle, exists, has the dead byte clear and is not Death must be Petrified for the battle to be won, so **monsters that
 *   are all petrified count as defeated**: 2 when the rewarded-knock-out byte is set, else 4. Otherwise 0.
 */
export function evaluateBattleEnd(globals: EndGlobals, party: ReadonlyArray<EndChar | null>, monsters: readonly EndChar[]): number {
  if (globals.frozen !== 0 || globals.clockGate || globals.preset !== 0) return globals.preset;
  let alive = 0;
  let inBattle = 0;
  for (const c of party) {
    if (c === null || !c.exists || !c.party) continue;
    if (!c.dead) {
      if ((c.status & 3) === 0) {
        alive += 1;
        if (c.inBattle) inBattle += 1;
      }
    } else if (c.hp > 0) {
      alive += 1;
    }
  }
  if (alive === 0) return BattleEndCode.PartyGone;
  if (inBattle === 0) return BattleEndCode.NobodyInBattle;
  let allStone = true;
  for (const c of monsters) {
    if (c.inBattle && c.exists && !c.dead && (c.status & 1) === 0) allStone = allStone && (c.status & 2) !== 0;
  }
  if (allStone) return globals.killed !== 0 ? BattleEndCode.WonRewarded : BattleEndCode.Won;
  return BattleEndCode.Running;
}

// ---------------------------------------------------------------------------------------------------------------------------------------
// The tail of one battle logic step (exe 0x0061e440)

/** The callee `call(address, ...arguments)` of a machine: what the game's own function would answer. The harness scripted these; the engine answers for what it models. */
export type EndHost = (address: number, ...args: number[]) => number;

/** The step's own bytes the tail reads and writes (names are the roles; addresses in the comments). */
export interface StepTailState {
  /** 0xDF68A0: the phase byte. */
  phase: number;
  /** 0xDF68A1: a battle start is queued (starts the next battle when none runs). */
  queued: number;
  /** 0xDF68A2: the outcome byte (5 ends the battle, 6 aborts it). */
  outcome: number;
  /** 0xDF68A3: the evaluation of this step. */
  stepEval: number;
  /** 0xDF7E67. */
  x67: number;
  /** 0xDF84AB. */
  ab: number;
  /** 0xDF7898: the mode byte reported to the event system. */
  mode: number;
  /** 0xDF84BB. */
  bb: number;
  /** 0xDF8214, 0xDF8215: the queued battle's variant bytes. */
  variantA: number;
  variantB: number;
  /** 0xDF8212: the queued battle's group word. */
  startGroup: number;
  /** 0xDF8210: the map word, the report's third argument. */
  map: number;
  /** 0xDF8474: this step's pad word; 0xDF8478 the previous one. */
  pad: number;
  padPrev: number;
  /** 0xDF8470: the step counter. */
  steps: number;
  /** 0xDF7E6C, 0xDF7E70. */
  x6c: number;
  x70: number;
  /** 0xE10500: the quit word; non-zero tears the battle down before anything else. */
  quit: number;
  /** 0xDF6450. */
  p64: number;
}

/** What the tail reads through two pointers: the group short and the scene's third byte, from which it builds the report's scene id. */
export interface StepTailWorld {
  groupShort: number;
  sub2: number;
}

const s8 = (v: number): number => ((v & 0xff) << 24) >> 24;
const s16 = (v: number): number => ((v & 0xffff) << 16) >> 16;
const u32 = (v: number): number => v >>> 0;

/**
 * The tail of the battle logic step (exe 0x0061e440): the calls it makes in order, how the abort path, the pause request, the quit by outcome 5 or 6
 * and the normal end at phase 0x26 are decided, and what is reported to the event system on the way out. `host` answers the callees; the function
 * edits `s`. **The battle ends** (script event 7, the clean-ups, the teardown 0x607c70 and the report 0x71b640 with the mode byte, the scene id, the
 * map and the outcome) when the phase is 0x26 or the outcome is 5; outcome 6 reports 6 and returns without that teardown; the abort request (0x72d490)
 * returns 0 in this build, so the abort path never runs. While no battle runs the same function can start the queued one.
 */
export function stepTail(s: StepTailState, world: StepTailWorld, host: EndHost): void {
  const report = (outcome: number): void => {
    const scene = u32((s16(world.groupShort) << 16) + world.sub2);
    host(0x71b640, s.mode, scene, s16(s.map), outcome);
  };
  const finish = (): void => {
    s.padPrev = s.pad;
    host(0x6215f0);
  };
  host(0x796170);
  host(0x6099c0);
  host(0x621060);
  if (host(0x607e40) === 0) host(0x4538d0);
  if (host(0x607e40) === 0) {
    // No battle runs: the idle path can start the queued one.
    if (host(0x747110) === 1 && host(0x747100) !== 0) {
      const bx = host(0x745d00, 0, 0, 0) & 0xffff;
      if ((bx & 8) !== 0 && (bx & 2) !== 0 && (bx & 0x40) !== 0) {
        const x = host(0x65af90);
        host(0x49ae50, 0xc3e430, bx, x);
        host(0x790950);
        const y = host(0x65af90);
        host(0x6082e0, y);
      }
    }
    if (s.queued !== 0) host(0x6076c0, 0, s16(s.startGroup), s8(s.variantA), s8(s.variantB));
    host(0x6215f0);
    return;
  }
  host(0x791750);
  const pad = host(0x745d00, 0, 0, 0) & 0xffff;
  s.pad = pad;
  host(0x643850);
  s.x67 = host(0x62b8b0) & 0xff;
  s.steps = u32(s.steps + 1);
  s.ab = 0;
  s.x6c = 0;
  s.x70 = 0;
  host(0x62b3a0);
  host(0x631200);
  s.stepEval = host(0x61ef70, 0) & 0xff; // the evaluation of this step, which the machine below reads
  host(0x6343a0);
  if (s.p64 === 1) host(0x60b5f0);
  if (s8(s.outcome) !== 6) host(0x75e110);
  host(0x62cb50);
  host(0x644ed0, 0xdf6f90);
  host(0x631620, 0xdf6f90);
  host(0x636e80);
  host(0x62bf00);
  host(0x63e650);
  host(0x62dee0);
  host(0x62e540);
  host(0x61e7a0); // the post-battle machine (`./battle-end-commit.ts`)
  if (s.quit !== 0) {
    host(0x607c70);
    report(s8(s.outcome));
    s.quit = 0;
  }
  let teardown = false;
  let next: 'press' | 'phase' | 'outcome';
  if (host(0x72d490) !== 0 && host(0x61f0c0) !== 0) {
    // The abort request: the request itself returns 0 in this build, so this never runs.
    if (host(0x452470) === 0) s.outcome = 6;
    next = 'phase';
  } else {
    next = 'press';
  }
  if (next === 'press') {
    if (s8(s.phase) !== 1) next = 'phase';
    else if (s.outcome !== 0) next = 'outcome';
    else {
      // Phase 1 with no outcome: a fresh press of the pad bit 0x800 with none of 0x10f, and bit 0x800 clear last step, asks for the pause.
      if ((pad & 0x800) === 0) return finish();
      if ((pad & 0x10f) !== 0) return finish();
      if ((s.padPrev & 0x800) !== 0) return finish();
      host(0x6060d0, 0x4000000);
      next = 'phase';
    }
  }
  if (next === 'phase') {
    if (s8(s.phase) === 0x26) teardown = true;
    else next = 'outcome';
  }
  if (!teardown) {
    const outcome = s.outcome;
    if (outcome === 5) {
      teardown = true;
    } else if (outcome !== 6) {
      return finish();
    } else {
      report(6); // outcome 6 reports without the teardown (the quit-to-title branch of the report)
      s.padPrev = s.pad;
      host(0x6215f0);
      return;
    }
  }
  host(0x6203a0, 7, 1, 0, 0);
  host(0x64d8b0, 2);
  host(0x744b70, 0);
  host(0x606570, s8(s.bb));
  host(0x790950);
  host(0x7268b0);
  host(0x624450);
  host(0x60e060);
  host(0x607c70);
  report(s8(s.outcome));
  s.mode = 0;
  finish();
}
