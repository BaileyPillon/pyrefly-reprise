/**
 * FFX-2 battle-end kernel, part 2: the post-battle machine that COMMITS the end (re-parity RC8, lane X2-K; **FFX-2 only**).
 *
 * **Game case: FFX-2 only.** Source: FFX-2.exe, Steam build 25501027 (SHA-256 6EA7F142...CD69), the machine at 0x0061e7a0; spec: the checked note
 * FFX2-G10 sections 10.2 and 10.3 (20,000 harness vectors, 0 mismatches, every callee a scripted input: what is proved is the machine's own decisions,
 * the order and arguments of its calls and the bytes it writes, not what its callees do inside). Pure, deterministic, **no random draw**.
 *
 * One call is one logic step's pass of the machine. The phase byte (0xDF68A0) runs:
 * - **1 (running):** nothing while the step's evaluation (`stepEval`, 0xDF68A3) is 0. Otherwise phase 2, and every character's open command menu is closed.
 * - **2 (draining):** while any character has queued commands (the queue counts of characters that are not asleep, petrified or Stopped, plus the action
 *   manager's count), a magic execution is running, or one more pending-work test is non-zero, the phase stays 2. When all are clear the evaluation is made
 *   again: **0 sends the battle back to phase 1 (a revive or Auto-Life before the commit cancels the end)**; anything else sets phase 0x1A.
 * - **0x1A (commit):** with the clock gate clear and no script job, the result byte (0xDF84B5) is set to the evaluation, phase 0x1B, the queued commands
 *   that never started are dropped (refunds) and script event 4 is requested. The same call goes on into 0x1B.
 * - **0x1B:** reads the result: 1 with the request word's bit 9 clear and 2 with bit 8 clear take a fade branch (hold 30 or 10 steps, fade 20 or 12, a sound
 *   id saved, a loss or win flag set, phase 0x1C); everything else goes to 0x21 (a hold of 30 steps for 3 and 4).
 * - **0x1C to 0x25:** the fades, the end jingle, the victory motions and the game-over overlay (presentation: the engine does not play them; the kernel
 *   is complete so the whole machine is proved).
 * - **0x26:** the machine does nothing; the logic step ends the battle (`./battle-end.ts` {@link stepTail}).
 *
 * The engine drives phases 1, 2, 0x1A and 0x1B through `../adapt/battle-end.ts`. Vectors: `tests/fixtures/parity/ffx2/battle_end_commit.json`.
 */

import type { EndHost } from './battle-end.ts';

/** The callees of the machine, by exe address. The engine answers for the ones it models; the rest are presentation. */
export const EndCallee = {
  /** `(chr, 3)`: close the open command menu of a character and reset a waiting state. */
  closeMenu: 0x634010,
  /** `(a3)`: the queued-command count of the characters that are not asleep, petrified or Stopped, plus the action manager's. */
  queueCount: 0x62c390,
  /** `(manager, 0)`: a magic execution is running. */
  magicRunning: 0x644cc0,
  /** `()`: one more pending-work test of phase 2. */
  pendingWork: 0x62e4b0,
  /** `(0)`: the battle-end evaluation (`./battle-end.ts` {@link evaluateBattleEnd}). */
  evaluate: 0x61ef70,
  /** `()`: a script job is running. */
  scriptJob: 0x6238e0,
  /** `()`: clears a selection byte at the commit. */
  clearSelection: 0x62bc60,
  /** `()`: drops the queued commands that never started (every queue, refunds). */
  dropQueued: 0x62c5c0,
  /** `(event, 1, 0, 0)`: request a script event (4 at the commit). */
  scriptEvent: 0x6203a0,
} as const;

/** The bytes of the machine (names are the roles; the exe addresses are in the comments). */
export interface EndMachine {
  /** 0xDF84AE: a hold counter, decremented once per call, the whole machine waits while it is non-zero. */
  holdoff: number;
  /** 0xDF84AF: a countdown, decremented once per call while non-zero. */
  countdown: number;
  /** 0xDF68A0: the phase byte (read signed). */
  phase: number;
  /** 0xDF68A2: the outcome byte set at phase 0x21. */
  outcome: number;
  /** 0xDF68A3: the evaluation of this step, set by the step's tail before the machine runs. */
  stepEval: number;
  /** 0xDF68A4: the clock gate; the machine waits while it is non-zero. */
  clockGate: number;
  /** 0xDF84B0: the step counter of the victory/overlay phase. */
  steps: number;
  /** 0xDF84B1: the fade step (256 / length + 1). */
  fadeStep: number;
  /** 0xDF84B2: the fade length. */
  fadeLength: number;
  /** 0xDF84B3: the game-over wait. */
  overWait: number;
  /** 0xDF84B4: the end delay. */
  endDelay: number;
  /** 0xDF84B5: the result byte, the committed end. */
  result: number;
  /** 0xDF84B6: the win flag. */
  winFlag: number;
  /** 0xDF84B7: the loss flag. */
  lossFlag: number;
  /** 0xDF84CA: the fade flag chosen at phase 0x21. */
  fadeFlag: number;
  /** 0xDF84CB, 0xDF84CC, 0xDF84CD: the win, lose and escape fade flags (set by script calls). */
  fadeWin: number;
  fadeLose: number;
  fadeEscape: number;
  /** 0xDF68C4, 0xDF68C6. */
  gameOverSkip: number;
  c6: number;
  /** 0xDF7E67, 0xDF7E68. */
  x67: number;
  x68: number;
  /** 0xDF8474: this step's pad word. */
  pad: number;
  /** 0xDF8480: the sound id (16 bits). */
  sound: number;
  /** 0xDF8482: the overlay id (16 bits). */
  overlay: number;
  /** 0xDF8478: the pad history (32 bits). */
  padHistory: number;
}

/** The phase values the engine reads. */
export const EndPhase = {
  Running: 1,
  Draining: 2,
  Commit: 0x1a,
  Result: 0x1b,
  Done: 0x26,
} as const;

/** A machine at rest: phase 1, everything else 0 (a battle that has just started). */
export function newEndMachine(): EndMachine {
  return {
    holdoff: 0, countdown: 0, phase: EndPhase.Running, outcome: 0, stepEval: 0, clockGate: 0, steps: 0, fadeStep: 0, fadeLength: 0, overWait: 0,
    endDelay: 0, result: 0, winFlag: 0, lossFlag: 0, fadeFlag: 0, fadeWin: 0, fadeLose: 0, fadeEscape: 0, gameOverSkip: 0, c6: 0, x67: 0, x68: 0,
    pad: 0, sound: 0, overlay: 0, padHistory: 0,
  };
}

const s8 = (v: number): number => ((v & 0xff) << 24) >> 24;
const b = (v: number): number => v & 0xff;

type Label = 'run' | 'drain' | 'drainPending' | 'commit' | 'result' | 'fadeStart' | 'fadeWait' | 'fadeClean' | 'jingle' | 'jingleWait' | 'outcome' | 'victory' | 'tail' | 'overlayEnd' | 'overlayWait';

/** The label the machine enters for a phase byte, or `undefined` when it does nothing for it. */
function labelOf(ph: number): Label | undefined {
  switch (ph) {
    case 1: return 'run';
    case 2: return 'drain';
    case 0x1a: return 'commit';
    case 0x1b: return 'result';
    case 0x1c: return 'fadeStart';
    case 0x1d: return 'fadeWait';
    case 0x1e: return 'fadeClean';
    case 0x1f: return 'jingle';
    case 0x20: return 'jingleWait';
    case 0x21: case 0x22: return 'outcome';
    case 0x23: return 'victory';
    case 0x24: return 'overlayEnd';
    case 0x25: return 'overlayWait';
    default: return undefined;
  }
}

/**
 * One call of the post-battle machine (exe 0x0061e7a0): the hold counter and the countdown first, then the phase's work, which may run on into the
 * next phase's work in the same call (0x1A goes on into 0x1B, 0x20 into 0x21, 0x21 into 0x23, 0x23 into 0x24). `host` answers the callees in the order
 * they are made.
 */
export function commitStep(s: EndMachine, host: EndHost): void {
  if (s.holdoff !== 0) {
    s.holdoff = b(s.holdoff - 1);
    return;
  }
  let cl = s.countdown;
  if (cl !== 0) {
    cl = b(cl - 1);
    s.countdown = cl;
  }
  const ph = s8(s.phase);
  const idx = ph - 1;
  if (idx < 0 || idx > 0x24) return;
  let lab = labelOf(ph);
  while (lab !== undefined) {
    switch (lab) {
      case 'run': {
        if (s.stepEval === 0) return;
        s.phase = 2;
        for (let i = 0; i < 0x1f; i++) host(EndCallee.closeMenu, i, 3);
        lab = 'drain';
        break;
      }
      case 'drain': {
        if (host(EndCallee.queueCount, s8(s.stepEval)) !== 0 || host(EndCallee.magicRunning, 0xdf6f90, 0) !== 0 || host(EndCallee.pendingWork) !== 0) {
          lab = 'drainPending';
          break;
        }
        if (host(EndCallee.evaluate, 0) === 0) {
          s.phase = EndPhase.Running; // the end lapsed: a revive or Auto-Life landed inside the window
          return;
        }
        s.phase = EndPhase.Commit;
        lab = 'commit';
        break;
      }
      case 'drainPending': {
        if (s8(s.phase) !== EndPhase.Commit) return;
        lab = 'commit';
        break;
      }
      case 'commit': {
        if (s.clockGate !== 0) return;
        if (host(EndCallee.scriptJob) !== 0) return;
        const al = host(EndCallee.evaluate, 0) & 0xff;
        s.phase = EndPhase.Result;
        s.result = al;
        host(EndCallee.clearSelection);
        host(EndCallee.dropQueued);
        host(EndCallee.scriptEvent, 4, 1, 0, 0);
        lab = 'result';
        break;
      }
      case 'result': {
        if (s.clockGate !== 0) return;
        if (host(EndCallee.scriptJob) !== 0) return;
        host(0x790a10);
        host(0x454990, 0);
        const r = s.result;
        let ebx = 0;
        if (r === 2) {
          if (host(0x726970) === 1) {
            s.holdoff = 10;
            s.fadeLength = 0xc;
            s.sound = 0xd;
            s.winFlag = 1;
            s.phase = 0x1c;
            return;
          }
        } else if (r === 1) {
          if (host(0x726980) !== 0) {
            s.holdoff = 0x1e;
            s.fadeLength = 0x14;
            s.sound = 0x15;
            s.lossFlag = 1;
            s.phase = 0x1c;
            return;
          }
        } else if (r === 3 || r === 4) {
          ebx = 0x1e;
        }
        s.holdoff = ebx;
        s.phase = 0x21;
        return;
      }
      case 'fadeStart': {
        const bl = s.fadeLength;
        s.phase = 0x1d;
        s.countdown = bl;
        s.fadeStep = bl !== 0 ? b(Math.floor(256 / bl) + 1) : 0;
        const x = host(0x743a40, bl);
        host(0x7442a0, x);
        return;
      }
      case 'fadeWait': {
        if (cl !== 0) return;
        s.phase = 0x1e;
        host(0x616800);
        return;
      }
      case 'fadeClean': {
        s.phase = 0x1f;
        host(0x62ad00);
        return;
      }
      case 'jingle': {
        s.phase = 0x20;
        s.holdoff = 10;
        host(0x62ac80, s.sound);
        return;
      }
      case 'jingleWait': {
        if (host(0x62acb0, s.sound) === 0) return;
        lab = 'outcome';
        break;
      }
      case 'outcome': {
        const al = s.result;
        let esi = 0xffffffff;
        let ebx = 0;
        let var4 = 10;
        s.phase = 0x23;
        s.outcome = al;
        host(0x616800);
        const a2 = s8(s.outcome);
        let eax: number | undefined;
        if (a2 === 1) {
          s.fadeFlag = s.fadeLose;
          ebx = 0x3c;
          var4 = 0x2d;
          eax = 1;
          esi = 0x36;
        } else if (a2 === 2) {
          s.fadeFlag = s.fadeWin;
          ebx = 0x42 + (s.winFlag !== 0 ? 10 : 0);
          eax = 0;
          esi = 0x35;
        } else if (a2 === 3 || a2 === 5) {
          s.fadeFlag = s.fadeEscape;
          eax = 2;
          esi = 0x37;
        } else if (a2 === 4) {
          s.fadeFlag = s.fadeEscape;
          eax = 3;
          esi = 0x38;
        }
        if (eax !== undefined) host(0x6203a0, eax, 1, 0, 0);
        const e = host(0x726bd0);
        if (e === 0 && s.lossFlag === 0) {
          if (!(s8(s.outcome) === 2 && s.winFlag !== 0)) ebx = 0;
        } else if ((esi | 0) >= 0) {
          host(0x61fc90, 0, 0xff, esi, 0xffff, 1, 1, 0, 0);
        }
        s.holdoff = 0;
        s.countdown = b(ebx);
        s.steps = 0;
        s.endDelay = b(var4);
        host(0x6431f0);
        if (s.lossFlag !== 0 && s.gameOverSkip === 0) {
          s.overWait = 1;
          s.padHistory = 0xffffffff;
        }
        cl = s.countdown;
        lab = 'victory';
        break;
      }
      case 'victory': {
        if (s8(s.outcome) === 2 && s.winFlag !== 0) {
          for (let i = 0; i < 9; i++) {
            if (host(0x61ee90, i) !== 0) {
              host(0x633e30, i, 0x3d, 0, 0x100, 0, 1, 1);
              if (s.steps < 0x14) host(0x62b6b0, i, 0xb, 1, 0, 0);
            }
          }
          cl = s.countdown;
        }
        s.steps = b(s.steps + 1);
        if (cl === 0) {
          s.x68 = 1;
          host(0x62b820, 10);
        }
        if (s.overWait !== 0) {
          const st = host(0x6215c0);
          if (st === 0 || st === 1) {
            if (s.clockGate !== 0) return;
            if (host(EndCallee.scriptJob) === 0 && host(0x62bed0) === 0) {
              const arg = s.c6 !== 0 ? 0 : s.overlay;
              if (host(0x6216b0, arg) === 0) s.overWait = 0;
            }
          } else if (st === 3) {
            host(0x621820, 0);
            s.countdown = 0x3c;
          } else if (st === 6) {
            if (s.countdown === 0 && s.padHistory === 0 && (s.pad & 0xf0) !== 0) s.overWait = 0xff;
          }
        }
        if (s.clockGate !== 0) return;
        if (host(EndCallee.scriptJob) !== 0) return;
        if (s.countdown !== 0) return;
        if (s8(s.overWait) > 0) return;
        if (host(0x62bed0) !== 0) return;
        if (host(0x61e760) !== 0) return;
        const e = host(0x726bd0);
        let cl7 = s.lossFlag;
        if (e === 0 && cl7 === 0) {
          s.phase = 0x24;
        } else {
          const flag = s.fadeFlag;
          let al = s.endDelay;
          s.phase = 0x24;
          s.countdown = al;
          if (flag !== 0) {
            host(0x6d4590, al);
            cl7 = s.lossFlag;
            al = s.endDelay;
          }
          if (cl7 !== 0) {
            host(0x71b4e0, al, 0);
            const x = host(0x743a40, s.endDelay);
            host(0x7442a0, x);
          }
        }
        lab = 'tail';
        break;
      }
      case 'overlayEnd':
      case 'tail': {
        if (s.clockGate !== 0) return;
        if (host(EndCallee.scriptJob) !== 0) return;
        if (host(0x743da0) !== 0) return;
        if (s.countdown !== 0) return;
        if (s.x67 !== 0) return;
        if (s.overWait !== 0) {
          host(0x616490, s.overlay);
          s.phase = 0x25;
          return;
        }
        s.phase = 0x26;
        return;
      }
      case 'overlayWait': {
        if (host(0x6215c0) !== 0) return;
        s.phase = 0x26;
        return;
      }
    }
  }
}
