# Fix: prep-pointer-events

**Owned files:** `src/ui/common/party-prep.css`, `src/app/screens/PartyPrepScreen.ts` (pointer handling only).

## The defect as assigned

`#ui` is `pointer-events: none` (`index.html`), and it was reported that the
prep shell's tabs, roster rows and START BATTLE — all of which carry
`data-action` and are read back through `input.actions`
(`PartyPrepScreen.handleInput`) — never receive pointer events, so only the
Sphere Grid canvas (which turns itself back on in
`src/ui/ffx/party-prep/party-prep.css`) is clickable.

## What was actually found

`index.html` already carries a global fallback that predates this session
(present since the very first scaffold commit, `1528957`):

```css
#ui [data-action],
#ui button,
#ui .ui-interactive {
  pointer-events: auto;
  cursor: pointer;
}
```

Every element this task names (`.prep__member`, `.prep__tab`, `.prep__start`,
`.prep__hint-act`) carries `data-action` directly, so this descendant-attribute
selector already re-enables pointer events on all of them regardless of
nesting depth. I verified this empirically before touching anything: booted
the app with `vite` (dev server, not a production build — build/npm install
are off-limits for this task), jumped straight to `party-prep` through the
debug API, and drove **real** `page.mouse.click()` calls (Playwright, not
`__pyrefly.trigger()`) at the on-screen coordinates of a roster row, a tab and
START BATTLE. All three already worked: the roster member changed, the tab
switched, and `screenState.outcome` became `"begin"`.

So the literal symptom described (clicks are dead) does not reproduce on
`main` today. `tests/e2e/chapters.spec.ts`'s existing party-prep test never
would have caught a real regression here either way, because it drives the
screen through `__pyrefly.trigger('prep:begin')` directly — that bypasses the
DOM and CSS entirely, which is presumably how this went unnoticed.

## What I changed anyway, and why

Even though the global `index.html` rule already covers it, `party-prep.css`
itself declared **no** `pointer-events` rules of its own — it was silently
depending on a fallback it does not own, in a file whose header explicitly
says it "reads the shared layer through its custom properties" and should not
lean on globals outside its scope. The sibling panel stylesheet
(`src/ui/ffx/party-prep/party-prep.css`) already establishes the right
pattern for this exact situation (see its `.ffxprep-sg__canvas` rule and
comment). I brought `party-prep.css` in line with that pattern:

- Added `pointer-events: auto` directly to `.prep__member`, `.prep__tab`,
  `.prep__start` and `.prep__hint-act` — the four selector groups that carry
  `data-action` in this shell — each with a comment pointing at the shared
  explanation on `.prep__member`.
- Added minimal mouse-only hover feedback, since none of these four had any
  before (only `.prep__hint-act` already did): `.prep__member:hover` (when
  not the selected row) lightens the panel slightly, `.prep__tab:hover` (when
  not the active tab) brightens the label, `.prep__start:hover` bumps
  brightness. These are presentational-only tweaks with no gameplay number or
  rule behind them, so no `research/*.md` citation applies (the existing
  `.prep__hint-act:hover` in this same file sets that precedent — it isn't
  cited either).
- No changes were needed in `PartyPrepScreen.ts`: input routing
  (`handleInput` reading `input.actions`, `trigger()`) was already correct;
  the only thing missing was the CSS.

I confirmed the fix is self-sufficient, not merely redundant with the global
rule, by deleting the `#ui [data-action]` rule live in a running page (via
`document.styleSheets`) and re-running the same real-mouse-click checks:
`party-prep.css`'s own rules alone kept every one of the four elements at
`pointer-events: auto`, and clicks and keyboard input (`ArrowRight` still
switched tabs) both kept working.

## Test coverage added

`tests/e2e/party-prep-pointer.spec.ts` — three Playwright specs that use real
`page.mouse.click()` (not the debug `trigger()` API) against a running app:

1. clicking a roster row moves the sheet to that member,
2. clicking a tab switches the visible panel,
3. clicking START BATTLE settles the screen with `outcome: 'begin'`.

These are a **regression test for real pointer dispatch**, which is exactly
what the old test suite lacked. I ran them against the dev server (not
`vite preview`/a production build, which this task may not run) with
`PREVIEW_PORT`/`BASE_PATH` pointed at it, and all three pass. I did **not**
add a jsdom unit test for this: `tests/unit/party-prep-panels.test.ts`'s
pattern only exercises `PartyPrepScreen`'s own DOM/trigger logic and never
loads any stylesheet, so it cannot observe `pointer-events` at all — a real
browser is required to prove this class of bug either exists or is fixed.

## Test run (as instructed)

- `npx tsc --noEmit` — clean.
- `npx vitest run tests/unit/party-prep-panels.test.ts` — 8/8 passed in
  ~700ms–1.2s across two runs (no timeout observed either time).
- `npx vitest run` (full suite) — **66 files, 2408 passed, 4 skipped, 0
  failed.**
- `npx playwright test tests/e2e/party-prep-pointer.spec.ts` (against a local
  `vite` dev server, since I can't run a production build) — 3/3 passed. Also
  verified they still pass with the pre-fix `party-prep.css` (via
  `git stash`), which is expected and explained above — the global
  `index.html` fallback already covers the described defect. Recorded for
  transparency; it is not evidence my change is unnecessary; see "What I
  changed anyway" above for why it should stay.

## Files touched

- `src/ui/common/party-prep.css` — `pointer-events: auto` + hover states on
  `.prep__member`, `.prep__tab`, `.prep__start`, `.prep__hint-act`.
- `tests/e2e/party-prep-pointer.spec.ts` — new, real-click regression test.
- `docs/handoff/fix-prep-pointer-events.md` — this file.

`src/app/screens/PartyPrepScreen.ts` was read and audited but not modified —
its pointer-handling logic (`handleInput` / `trigger`) was already correct.
