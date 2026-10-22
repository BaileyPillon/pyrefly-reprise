/**
 * `window.__pyrefly.moments(mode?)`, `.momentsOn()`, `.cheer(id?)`, `.standDown(id?)` and `.koSettle(id?)`: the per-game moments' switch and triggers for captures and checks (motion pass, lane "core", step 3).
 *
 * `moments()` returns `'new'` or `'today'` (from `?moments=` / `?pack=demo`, default today); `moments('new' | 'today')` sets it for what starts from now on. The moments play only in the demo chapters
 * (Chapter I `seymour-flux`, Chapter IV `ffx2-bahamut`): `momentsOn()` is the answer for the running chapter. `cheer(id)` asks a party figure for its victory pose (the cheer) at once, `standDown(id)`
 * for the quiet stand-down; with no id every party figure (so a recorder can see the victory moment without winning the fight). Nothing here writes game state.
 */
import { momentsMode, momentsOn, setMomentsMode, type MomentsMode } from '../engine/motion/MomentsSwitch.ts';

interface Staged {
  battle?: () => { stage: { staged(): string[]; sideOf(id: string): string; actor(id: string): { setPose(n: string): void; standDown?(): void } | undefined } } | null;
}

export function installMomentsDebug(api: Record<string, unknown>): void {
  api['moments'] = (mode?: MomentsMode): MomentsMode => {
    if (mode === 'new' || mode === 'today') setMomentsMode(mode);
    return momentsMode();
  };
  api['momentsOn'] = (): boolean => momentsOn();
  const each = (id: string | undefined, fn: (a: { setPose(n: string): void; standDown?(): void }) => void): number => {
    const b = (api as Staged).battle?.();
    if (!b) return 0;
    let n = 0;
    for (const who of b.stage.staged()) {
      if (id !== undefined ? who !== id : b.stage.sideOf(who) !== 'party') continue;
      const a = b.stage.actor(who);
      if (a) {
        fn(a);
        n++;
      }
    }
    return n;
  };
  api['cheer'] = (id?: string): number => each(id, (a) => a.setPose('victory'));
  api['standDown'] = (id?: string): number => each(id, (a) => a.standDown?.());
  api['koSettle'] = (id?: string): number => each(id, (a) => a.setPose('ko'));
}
