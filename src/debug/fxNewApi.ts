/**
 * `window.__pyrefly.fxNew(mode?)`, `.fxNewOn()`, `.fxNewChapter(id?)` and `.fxNewGuard(dtMs, busy?)`: the new spell effects' switch for captures and checks (motion pass, lane "fx").
 *
 * `fxNew()` returns `'new'` or `'today'` (from `?fx=` / `?pack=demo`, default today); `fxNew('new' | 'today')` sets it for what starts from now on (a running copy keeps the look it
 * started with). The new effects play only in the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `fxNewOn()` is the answer for the running chapter.
 * `fxNewChapter(id)` names a chapter by hand (a capture on a page that did not start a battle). `fxNewGuard(dtMs, busy)` feeds the frame-time guard a fake frame and returns its stats,
 * for a capture that wants to see the particles thin out without a slow machine. The running layer's guard is in the screen snapshot: `spellFx.fx.guard`.
 *
 * Step 3: `fxHooksProbe(true)` registers recording hooks with the adapter to the other lanes' motion hooks (`engine/spellfx/FxMotionAdapter.ts`) and returns the log array it fills (`[time ms, hook,
 * arguments]`); `fxHooksProbe(false)` clears them. A capture uses it to show that an Overdrive's opening and a boss's charge reach the hooks the integrator will register. `fxPlay(events)` plays a list of
 * battle events through the running battle's real presenter (the sequence numbers are filled in) and resolves when they have played: the capture's way to show a boss move or an Overdrive in the
 * real presentation without waiting for the AI to choose it. Neither changes a battle's state or the engine.
 */
import { fxChapter, fxMode, fxNewOn, setFxChapter, setFxMode, type FxMode } from '../engine/spellfx/FxSwitch.ts';
import { FxPerfGuard } from '../engine/spellfx/FxPerfGuard.ts';
import { setFxMotionHooks } from '../engine/spellfx/FxMotionAdapter.ts';

const probe = new FxPerfGuard();

export function installFxNewDebug(api: Record<string, unknown>): void {
  api['fxNew'] = (mode?: FxMode): FxMode => {
    if (mode === 'new' || mode === 'today') setFxMode(mode);
    return fxMode();
  };
  api['fxNewOn'] = (): boolean => fxNewOn();
  api['fxNewChapter'] = (id?: string): string | undefined => {
    if (typeof id === 'string') setFxChapter(id);
    return fxChapter();
  };
  api['fxHooksProbe'] = (on = true): unknown[] => {
    const log: unknown[] = [];
    const note = (hook: string) => (...a: unknown[]): void => void log.push([Math.round(performance.now()), hook, ...a]);
    setFxMotionHooks(on ? { anticipate: note('anticipate'), smear: note('smear'), hitStop: note('hitStop'), punch: note('punch'), rumble: note('rumble') } : {});
    return log;
  };
  api['fxPlay'] = (events: unknown[]): Promise<unknown> | null => {
    const battle = (api['battle'] as (() => { presenter?: { play(e: unknown[]): Promise<unknown> } } | null) | undefined)?.();
    const presenter = battle?.presenter;
    if (!presenter) return null;
    return presenter.play(events.map((e, i) => ({ ...(e as object), seq: 1_000_000 + i })));
  };
  api['fxNewGuard'] = (dtMs?: number, busy = true): ReturnType<FxPerfGuard['stats']> => {
    if (typeof dtMs === 'number') probe.frame(dtMs, busy);
    return probe.stats();
  };
}
