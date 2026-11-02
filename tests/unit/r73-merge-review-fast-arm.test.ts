// @vitest-environment jsdom
/**
 * FINDING 2 of the review of the release 73 merge (`origin/r73` 843f07f62; 2026-11-02; minor, job specs; BOTH games' plumbing, nothing in the product changes).
 *
 * Jobs J73-3 (and the lane's F-2) force the fast arm with `window.__pyrefly.setBattleSpeed('fast')` before the first action. The REAL `Input` and the REAL `FastForwardHold` show what that does in Chapter XVIII:
 * Auron's Dragon Fang has an R1 chip, the harness taps R with `page.keyboard.press` (keydown and keyup between two frames), and `FastForwardHold` now ends every press it saw at `normal`, whatever the
 * speed was before (release 72 left `skip`: `fastForward()` turns `fast` into `skip`). So a forced `fast` lasts only to the first R press; a real hold of R1 ends at `normal` too. The hold is right (R1 is held,
 * not toggled; the player never has `fast` as a standing mode, only the debug API forces it), so the spec is what changes: the fast arm re-asserts `fast` on every frame (an in-page requestAnimationFrame loop), or
 * keeps the R-chip actions out of the arm, and the report says how many times it had to.
 *
 * The first three tests are the review's own repro, kept as the characterisation the specs rely on; the last two pin the corrected specs.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Input, type InputSnapshot } from '../../src/app/Input.ts';
import { FastForwardHold } from '../../src/app/screens/FastForwardHold.ts';
import type { PlaybackSpeed } from '../../src/engine/BattlePresenterPorts.ts';

/** `BattlePresenterBase`'s two rules for the speed (`fastForward`: normal to fast, anything else to skip; `setSpeed`). */
class PresenterStandIn {
  speed: PlaybackSpeed = 'normal';
  fastForward(): void {
    this.speed = this.speed === 'normal' ? 'fast' : 'skip';
  }
  setSpeed(speed: PlaybackSpeed): void {
    this.speed = speed;
  }
}

let input: Input;
let now = 0;
const key = (type: 'keydown' | 'keyup', code = 'KeyR'): void => void window.dispatchEvent(new KeyboardEvent(type, { code, bubbles: true }));
beforeEach(() => {
  now = 0;
  input = new Input({ pointerRoot: document.body });
  input.attach();
});
afterEach(() => input.detach());
function frame(handle: (i: InputSnapshot) => void): void {
  now += 16.7;
  handle(input.update(now));
  input.endFrame();
}

/** What the corrected spec asks of the harness: after every frame, if the arm is the fast one and the speed is not `fast`, set it again (and count it). */
function runArm(p: PresenterStandIn, hold: FastForwardHold, frames: number, tapAtFrame: number | null, reassert: boolean): { speeds: PlaybackSpeed[]; reasserted: number } {
  const speeds: PlaybackSpeed[] = [];
  let reasserted = 0;
  for (let n = 0; n < frames; n++) {
    if (n === tapAtFrame) {
      key('keydown');
      key('keyup'); // page.keyboard.press: both events before the next frame
    }
    frame((i) => hold.update(i, p));
    if (reassert && p.speed !== 'fast') {
      p.setSpeed('fast'); // window.__pyrefly.setBattleSpeed('fast')
      reasserted++;
    }
    speeds.push(p.speed);
  }
  return { speeds, reasserted };
}

describe('finding 2: a forced fast arm does not survive an R press (the real Input and the real FastForwardHold)', () => {
  it('forced fast, then a sub-frame tap of R (Auron\'s Dragon Fang chip): the speed ends at normal, where release 72 ended at skip', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    p.setSpeed('fast'); // the harness's forcing, before the first action
    const run = runArm(p, hold, 6, 2, false);
    expect(run.speeds).toEqual(['fast', 'fast', 'normal', 'normal', 'normal', 'normal']);

    const q = new PresenterStandIn(); // release 72's two lines, for the comparison the review made
    q.setSpeed('fast');
    const old: PlaybackSpeed[] = [];
    for (let n = 0; n < 6; n++) {
      if (n === 2) {
        key('keydown');
        key('keyup');
      }
      frame((i) => {
        if (i.justPressed('r1')) q.fastForward();
        if (i.justReleased('r1')) q.setSpeed('normal');
      });
      old.push(q.speed);
    }
    expect(old).toEqual(['fast', 'fast', 'skip', 'skip', 'skip', 'skip']);
  });

  it('forced fast, then a real hold of R1 (down for three frames): it ends at normal too, so "fast all fight" holds only until the first R press', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    p.setSpeed('fast');
    key('keydown');
    const seen: PlaybackSpeed[] = [];
    for (let n = 0; n < 3; n++) {
      frame((i) => hold.update(i, p));
      seen.push(p.speed);
    }
    key('keyup');
    for (let n = 0; n < 2; n++) {
      frame((i) => hold.update(i, p));
      seen.push(p.speed);
    }
    expect(seen).toEqual(['skip', 'skip', 'skip', 'normal', 'normal']);
  });

  it('the corrected spec works: with the speed set again after every frame, the arm reads fast on EVERY frame after the tap but the one the press ran at normal, and the count of re-assertions is the report\'s number', () => {
    const p = new PresenterStandIn();
    const hold = new FastForwardHold();
    p.setSpeed('fast');
    const run = runArm(p, hold, 8, 3, true);
    expect(run.speeds.every((s) => s === 'fast')).toBe(true); // the harness reads the speed after it has set it again, so no read shows anything else...
    expect(run.reasserted).toBe(1); // ...and the one press cost one re-assertion: that count is what tells the report that a frame may have run at normal (a read cannot)
    const quiet = runArm(new PresenterStandIn(), new FastForwardHold(), 8, null, true);
    expect(quiet.reasserted).toBe(1); // no press: the forcing itself, once, and nothing after
  });
});

describe('finding 2: the specs say it', () => {
  const text = (rel: string): string => readFileSync(resolve(process.cwd(), rel), 'utf8').replace(/\r\n/g, '\n');
  const rows: Array<[string, RegExp]> = [
    ['docs/handoff/r73.md', /^\| \*\*J73-3\*\*.*$/m],
    ['docs/handoff/r73-fast.md', /^\| \*\*F-2\*\*.*$/m],
  ];
  it.each(rows)('%s: the fast arm\'s row says R presses end it at normal, that the arm sets fast again every frame (or keeps the R chips out), and that the report counts the re-assertions', (file, re) => {
    const row = text(file).match(re)?.[0];
    expect(row).toBeTruthy();
    expect(row).toMatch(/R press|press of R/);
    expect(row).toMatch(/every frame/);
    expect(row).toMatch(/re-assert/);
    expect(row).toMatch(/Dragon Fang/);
    expect(row).toMatch(/count/);
  });

  it('the instrument paragraph of r73.md section 6 and the setup line of r73-fast.md section 6 repeat it where the forcing is first described', () => {
    for (const file of ['docs/handoff/r73.md', 'docs/handoff/r73-fast.md']) {
      const body = text(file);
      const at = body.indexOf("setBattleSpeed('fast')");
      expect(at, file).toBeGreaterThan(0);
      const near = body.slice(at, at + 1100);
      expect(near, file).toMatch(/re-assert/);
      expect(near, file).toMatch(/FastForwardHold/);
    }
  });
});
