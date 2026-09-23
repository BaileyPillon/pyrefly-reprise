# e2e type check — the Playwright specs now have a tsc program

**Status (2026-09-23):** GREEN. `npm run typecheck:e2e` reports 0 errors (was 66). `npx tsc
--noEmit` (the main program) is still clean.
**Case (rule 14):** shared test plumbing, both games.
**Branch:** `main`, committed directly (no branch created for this pass; see the commit for
the exact paths).

## What exists now

- `tsconfig.e2e.json` extends `tsconfig.json` and includes `tests/e2e/**/*.ts` plus
  `playwright.config.ts`. The main tsconfig never included `tests/e2e`, and Playwright
  strips types at run time, so the specs were never type-checked before this file existed.
- `npm run typecheck:e2e` runs it (`tsc -p tsconfig.e2e.json`). It is **not** part of
  `npm run build` or of `tools/deploy-pages.mjs`. It is also not wired into `npm test`
  (`vitest run`, no type check chained) or any pre-push hook — this repo has no
  `.husky`/`simple-git-hooks` and no `prepush` script, so there is nothing that already
  chains type checks for it to join. If Bailey wants it enforced automatically, the
  candidates are a new `pretest` script or a git hook, both of which are new standing
  config and need a yes first.
- Fixed earlier: `pause.spec.ts` and `intent-pause.spec.ts` typed the vite handle as
  `ChildProcessWithoutNullStreams`, but `spawn(..., { stdio: ['ignore', 'pipe', 'pipe'] })`
  returns `ChildProcessByStdio<null, Readable, Readable>`. Both use `ChildProcess | null`.

## What was fixed this pass (66 -> 0)

**Root cause recap.** Every spec hand-rolled its own shape for `window.__pyrefly`, because
the e2e program never saw the real one (`PyreflyDebugApi`, `src/debug/api.ts:53`, declared
on `Window` as optional at the bottom of that file). `boot.spec.ts` declared a narrow
`declare global` shape; once all seven specs compiled as one program that declaration won
the interface merge, and `pause.spec.ts` / `intent-pause.spec.ts`'s own richer (and
different) `declare global` blocks collided with it (TS2717, then every extra member
TS2339). `chapters.spec.ts`, `party-prep-pointer.spec.ts` and `portraits.spec.ts` avoided
the collision with a local `type Win = Window & { ... }` cast, which then failed the
overlap check against boot's narrow type (TS2352). `advisor-zone.spec.ts` cast through
`unknown` and was untouched by the collision, but carried two unrelated bugs of its own.

**The fix (recommendation A from the last pass, approved).** One real type, no hand-rolled
shapes:

- New file `tests/e2e/support/pyrefly-window.ts`. It imports `PyreflyDebugApi` (a type-only
  import) from `src/debug/api.ts` and declares the single ambient augmentation every spec
  now shares:
  ```ts
  declare global {
    interface Window {
      __pyrefly?: PyreflyDebugApi;
      __pyreflyReady?: boolean;
    }
  }
  export {};
  ```
  Every spec that touches the debug API imports this file once, for the side effect only
  (`import './support/pyrefly-window.ts';`).
- Deleted all seven local shapes: the three `declare global` blocks (`boot.spec.ts`,
  `pause.spec.ts`, `intent-pause.spec.ts`) and the four `interface PyreflyApi` / `type Win`
  pairs (`chapters.spec.ts`, `party-prep-pointer.spec.ts`, `portraits.spec.ts`, and the
  `Win` cast sites). `chapters.spec.ts` also had its own local `interface BattleOutcome`
  used only to type the hand-rolled API's return values — deleted with it, and its local
  `ChapterId` union replaced with the real one imported from `src/data/encounters.ts`
  (same eight literals, so nothing else in the file needed to change).
- Every `(window as Win).__pyrefly.foo()` / bare `window.__pyrefly.foo()` call site now
  reads `window.__pyrefly!.foo()`. The `!` is a compile-time-only non-null assertion (it
  erases to nothing, so `window.__pyrefly!.foo()` and the old `(window as Win).__pyrefly`
  compile to the exact same JS) — not `any`, not `ts-ignore`. It is safe here because every
  spec already waits on `window.__pyreflyReady === true` (or `waitReady()`) before touching
  the API, which is exactly what made the old hand-rolled shapes non-optional in the first
  place.
  - A Node-side helper function (e.g. `const api = () => window.__pyrefly!`) cannot replace
    the `!` here: Playwright serialises a `page.evaluate` callback by taking its own source
    text and running that string inside the browser, so a call to a function defined
    outside the callback — even one imported into the same test file — is a `ReferenceError`
    at run time. Every existing call site already only ever referenced `window` and
    literals inside the callback for exactly this reason, so the mechanical `!` keeps that
    property instead of introducing a helper that would look right and fail at run time.
  - `src/debug/api.ts` needed no change: `PyreflyDebugApi` was already `export interface`.
- Real types caught nothing extra once wired in — every call site's method name, argument
  shape and the two chained `gotoChapter(...)` calls all matched the real
  `PyreflyDebugApi` (`chapters()`, `chapterSelect()`, `battleLog()`, `autoBattle()`,
  `setBattleSpeed()`, `waitBattleEnd()`, `wiring()`, `scenes()`, `app.screens[].name`, all
  line up). That is itself useful evidence: the specs were exercising the real contract,
  they just weren't compiled against it.

**The two in `advisor-zone.spec.ts`, fixed honestly (no `any`/`ts-ignore`):**

- Line ~85 (`Probe.silent` / `Probe.off`): both fields are computed straight from
  `HTMLElement.hidden`, which the DOM lib types as `boolean | 'until-found'` (the
  find-in-page hidden state), not plain `boolean`. The interface was the one that was
  wrong — widened `silent` and `off` to `boolean | 'until-found'` with a comment
  explaining why. Every read of either field is a truthiness check (`if (p.silent)`) or an
  equality assert against `false` (`expect(p.off, ...).toBe(false)`), both of which already
  treat `'until-found'` correctly, so this is a pure type fix with no runtime change.
- Line ~475 (`expect.any(Number) as number`): `expect.any(...)` returns an
  `AsymmetricMatcher`, which doesn't overlap `number` for a direct `as` cast (TS2352). Cast
  through `unknown` first, the same pattern the file already uses one screen up
  (`expect.not.stringMatching(...) as unknown as string`): `expect.any(Number) as unknown as
  number`.

**Verification for this pass:** `npm run typecheck:e2e` (0 errors), `npx tsc --noEmit` (0
errors — the extra `src/**` files `src/debug/api.ts` transitively pulls into the e2e
program compile clean there too, unsurprising since they already compiled clean under the
main program), `node tools/orphans.mjs` (24 orphans, same as before — this change touched
no `src/` file, so the count could not move). No Playwright suite was run for this pass
(the change is type-only, and the machine was heavily loaded — `AGENTS.md` says a
type-level change needs no browser). `npx tsc --noEmit` and one bare `npx tsc -p
tsconfig.e2e.json` each intermittently crashed with a Go-runtime "out of memory" /
"Could not determine Node.js install directory" on the first or second try during this
session — an environment symptom of the shared box's memory pressure (confirmed
`Get-CimInstance Win32_OperatingSystem`: ~7 GB free of ~64 GB total at the time), not a
tsc or code problem; both commands came back clean on retry.

## Playwright run of `pause.spec.ts` after the earlier change (worktree, dev server spawned by the spec)

2 of 4 pass (the tab strip order and Q/E cycling; H hides and shows the panels and Esc still
resumes). The two failures are a 45 s `__pyreflyReady` timeout on the first cold page load,
and a `stack` read 300 ms after Esc that saw `battle` instead of `pause` while the
neighbouring tests with the same pattern passed. Both sit in code this change does not
touch and both fit a heavily loaded box (85 percent CPU, 70+ node and chrome processes at
the time). NOW.md's note that this spec "still drives the old DOM" is at least partly
stale: two of its four tests pass against the remade pause. This pass made no code change
that would affect that result and did not re-run it (see "Verification" above).

## Running any of this from a `.claude/worktrees/*` checkout

The worktree has no `node_modules` and no `public/art`: add both as junctions
(`cmd /c mklink /J <worktree>\node_modules "D:\Final Fantasy\node_modules"`, same for
`public\art`; both are gitignored). `playwright.config.ts` expects a built `dist/` for its
`webServer`, which a worktree does not have; a scratch config in the scratchpad with
`testDir` set to the worktree's `tests/e2e`, no `webServer`, and `NODE_PATH` pointing at the
worktree's `node_modules` runs the specs that spawn their own dev server.
