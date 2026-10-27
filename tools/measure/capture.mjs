// One stepped capture session, start to finish, under the browser lock (motion-fluidity pass, lane L5; both games, tooling).
//
// `captureSession` is what tools/hz-matrix.mjs, tools/jolts.mjs and tools/ab-clip.mjs share: take the RIG-RECORD lock for this one job (at most 10 minutes; released on every way out), launch headless GPU
// Chromium, open the built game at `base` + `query` on a fake clock, walk to the first command menu by real keys (seed 1), install the channel reader, pause the clock into the manual frame queue, warm
// 12 frames, hand the session to `play` (which presses keys and ticks the stepper), and close everything. What `play` records goes through `recordTick` (tools/measure/channels.mjs). The page is closed
// before the lock is released, so the next job starts on a quiet machine.
import { installChannels } from './channels.mjs';
import { takeBrowserLock } from './lock.mjs';
import { launchBrowser, makeStepper, openGame, pauseClock, reachFirstMenu } from './session.mjs';

/**
 * @param {{root: string, base: string, query?: string, chapter: string, hz: number, viewport?: {width: number, height: number}, who: string, what: string, maxMinutes?: number, log?: (...a: unknown[]) => void,
 *   play: (s: {g: any, stepper: any, acc: any, hz: number}) => Promise<any>, afterOpen?: (g: any) => Promise<void>}} o
 */
export async function captureSession({ root, base, query = '', chapter, hz, viewport, who, what, maxMinutes = 10, log = console.log, play, afterOpen }) {
  const release = await takeBrowserLock({ who, what, maxMinutes, log });
  const started = new Date().toISOString();
  let browser = null;
  try {
    browser = await launchBrowser(root);
    const g = await openGame(browser, base, query, viewport);
    await reachFirstMenu(g, chapter);
    await installChannels(g.page);
    if (afterOpen) await afterOpen(g);
    await pauseClock(g.page);
    const stepper = makeStepper(g.page, hz);
    const acc = { frames: [], events: [], logLen: 0, rec: false };
    await stepper.ticks(12); // warm: the first frames after the pause settle the manual queue
    const first = await g.page.evaluate('window.READ_()');
    acc.logLen = first?.nLog ?? 0;
    const result = await play({ g, stepper, acc, hz });
    const diag = await g.page.evaluate(() => ({ ua: navigator.userAgent.slice(0, 90), smear: window.__pyrefly.smearOn?.(), curves: window.__pyrefly.curvesOn?.(), moments: window.__pyrefly.momentsOn?.() }));
    await g.context.close();
    return { started, hz, query, chapter, frames: acc.frames, events: acc.events, result, steps: stepper.steps, virtualMs: stepper.ms, consoleErrors: g.consoleErrors.slice(0, 20), diag };
  } finally {
    try { await browser?.close(); } catch { /* gone */ }
    release();
  }
}
