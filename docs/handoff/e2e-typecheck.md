# e2e type check — the Playwright specs now have a tsc program

**Status (2026-09-23):** wired and reporting; 66 pre-existing errors left for a decision.
**Case (rule 14):** shared test plumbing, both games.
**Branch:** `claude/suspicious-bardeen-b38956` (two commits: the spec fixes, tests only; then the wiring).

## What exists now

- `tsconfig.e2e.json` extends `tsconfig.json` and includes `tests/e2e/**/*.ts` plus `playwright.config.ts`.
  The main tsconfig never included `tests/e2e`, and Playwright strips types at run time, so the specs
  were never type-checked.
- `npm run typecheck:e2e` runs it (`tsc -p tsconfig.e2e.json`). It is **not** part of `npm run build`
  or of `tools/deploy-pages.mjs`, on purpose: it is red today (below).
- Fixed: `pause.spec.ts` and `intent-pause.spec.ts` typed the vite handle as
  `ChildProcessWithoutNullStreams`, but `spawn(..., { stdio: ['ignore', 'pipe', 'pipe'] })` returns
  `ChildProcessByStdio<null, Readable, Readable>`. Both now use `ChildProcess | null`.
- `pause.spec.ts` also carries the two hardening items from `intent-pause.spec.ts`: the `beforeAll`
  that spawns vite budgets itself at 300 s and waits up to 240 s; each readiness fetch is bounded by
  `AbortSignal.timeout(5_000)`.

## What is still red: 66 errors, none trivial

| File | Errors | Class |
|---|---|---|
| `chapters.spec.ts` | 24 | TS2352, the `window as Win` cast no longer overlaps |
| `pause.spec.ts` | 12 | TS2717 + TS2339 + TS7006, its `declare global` conflicts with boot's |
| `intent-pause.spec.ts` | 12 | same as pause |
| `party-prep-pointer.spec.ts` | 11 | TS2352, cast |
| `portraits.spec.ts` | 5 | TS2352, cast |
| `advisor-zone.spec.ts` | 2 | unrelated, see below |

**Root cause (64 of the 66).** Every spec hand-rolls its own shape for `window.__pyrefly`, because the
e2e program never sees the real one (`PyreflyDebugApi`, `src/debug/api.ts:53`, declared on `Window` as
optional at lines 311 to 315). `boot.spec.ts` declares a narrow shape with `declare global`; once all
seven specs compile as one program that declaration wins the interface merge. `pause` and
`intent-pause` declare richer shapes and collide with it (TS2717, then every extra member is TS2339).
`chapters`, `party-prep-pointer` and `portraits` avoid `declare global` with a local
`type Win = Window & { __pyrefly: ... }` cast, which now fails the overlap check against boot's narrow
type (TS2352). `advisor-zone` casts through `unknown` and is untouched by the collision.

**The two in `advisor-zone.spec.ts`.** Line 171: a `Probe` union branch has `silent: 'until-found' | boolean`
but the interface says `boolean`; either the interface or the probe is wrong, and the spec's owner
knows which. Line 465: `expect.any(Number) as number`; cast through `unknown` if the intent is a matcher.

## Recommendation (needs a yes before it is built)

**A, recommended: one real type, no hand-rolled shapes.** Have every spec see `PyreflyDebugApi` (add
`src/debug/api.ts` to the e2e `include`, or one `tests/e2e/pyrefly-window.d.ts` that imports it and
re-exports the augmentation), delete the seven local shapes, and read the API through one small helper
that asserts `window.__pyrefly` is present. Any call a spec makes that the real API does not offer
becomes a real error, which is the point of the exercise. Cost: one Sonnet pass over seven files,
roughly 70 call sites, then `typecheck:e2e` green and one Playwright run per touched spec to prove
nothing changed at run time (the edits are type-only).

**B, cheap: cast through `unknown` everywhere,** the way `advisor-zone` already does. Makes the check
green in an hour and proves nothing about the calls.

Either way the `advisor-zone` pair is a separate two-line decision for that spec's owner.

## Playwright run of `pause.spec.ts` after the change (worktree, dev server spawned by the spec)

2 of 4 pass (the tab strip order and Q/E cycling; H hides and shows the panels and Esc still resumes).
The two failures are a 45 s `__pyreflyReady` timeout on the first cold page load, and a `stack`
read 300 ms after Esc that saw `battle` instead of `pause` while the neighbouring tests with the same
pattern passed. Both sit in code this change does not touch and both fit a heavily loaded box
(85 percent CPU, 70+ node and chrome processes at the time). NOW.md's note that this spec "still drives
the old DOM" is at least partly stale: two of its four tests pass against the remade pause.

## Running any of this from a `.claude/worktrees/*` checkout

The worktree has no `node_modules` and no `public/art`: add both as junctions
(`cmd /c mklink /J <worktree>\node_modules "D:\Final Fantasy\node_modules"`, same for `public\art`;
both are gitignored). `playwright.config.ts` expects a built `dist/` for its `webServer`, which a
worktree does not have; a scratch config in the scratchpad with `testDir` set to the worktree's
`tests/e2e`, no `webServer`, and `NODE_PATH` pointing at the worktree's `node_modules` runs the specs
that spawn their own dev server.
