/**
 * The one real shape of `window.__pyrefly`, shared by every e2e spec.
 *
 * Before this file, each spec hand-rolled its own idea of the debug API:
 * `boot.spec.ts` used a narrow `declare global`, `pause.spec.ts` and
 * `intent-pause.spec.ts` each declared their own richer (and different)
 * `declare global`, and `chapters.spec.ts` / `party-prep-pointer.spec.ts` /
 * `portraits.spec.ts` avoided the collision with a local `type Win = Window &
 * {...}` cast. That was invisible as long as every spec was its own `tsc`
 * program (Playwright strips types at run time and never checked them), but
 * `tsconfig.e2e.json` compiles all seven as one program: the competing
 * `declare global` blocks collide (TS2717) and the hand-rolled `Win` casts
 * stop overlapping the real shape (TS2352) the moment any one of them wins
 * the interface merge. See `docs/handoff/e2e-typecheck.md` for the count.
 *
 * The fix is to stop guessing. `PyreflyDebugApi` (`src/debug/api.ts`) is the
 * real contract `installDebugApi` puts on `window.__pyrefly`, and this file
 * augments `Window` with it exactly once. Any spec that needs the debug API
 * imports this file for its side effect only:
 *
 * ```ts
 * import '../support/pyrefly-window.ts'; // or './support/...' from tests/e2e/*.spec.ts
 * ```
 *
 * and then reads `window.__pyrefly` straight inside a `page.evaluate`
 * callback. The field is optional (`installDebugApi` runs after the app
 * boots), so a call site asserts it is present with `window.__pyrefly!` —
 * safe everywhere in this suite because every spec waits on
 * `window.__pyreflyReady === true` (or the equivalent `waitReady()`) before
 * touching it. A Node-side helper function cannot do this assertion instead:
 * Playwright serialises a `page.evaluate` callback by its own source text, so
 * a call to an outside helper would be a `ReferenceError` inside the browser.
 */
import type { PyreflyDebugApi } from '../../../src/debug/api.ts';

declare global {
  interface Window {
    __pyrefly?: PyreflyDebugApi;
    __pyreflyReady?: boolean;
  }
}

export {};
