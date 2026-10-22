/**
 * `window.__pyrefly.fxNew(mode?)`, `.fxNewOn()`, `.fxNewChapter(id?)` and `.fxNewGuard(dtMs, busy?)`: the new spell effects' switch for captures and checks (motion pass, lane "fx").
 *
 * `fxNew()` returns `'new'` or `'today'` (from `?fx=` / `?pack=demo`, default today); `fxNew('new' | 'today')` sets it for what starts from now on (a running copy keeps the look it
 * started with). The new effects play only in the demo chapters (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `fxNewOn()` is the answer for the running chapter.
 * `fxNewChapter(id)` names a chapter by hand (a capture on a page that did not start a battle). `fxNewGuard(dtMs, busy)` feeds the frame-time guard a fake frame and returns its stats,
 * for a capture that wants to see the particles thin out without a slow machine. The running layer's guard is in the screen snapshot: `spellFx.fx.guard`.
 */
import { fxChapter, fxMode, fxNewOn, setFxChapter, setFxMode, type FxMode } from '../engine/spellfx/FxSwitch.ts';
import { FxPerfGuard } from '../engine/spellfx/FxPerfGuard.ts';

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
  api['fxNewGuard'] = (dtMs?: number, busy = true): ReturnType<FxPerfGuard['stats']> => {
    if (typeof dtMs === 'number') probe.frame(dtMs, busy);
    return probe.stats();
  };
}
