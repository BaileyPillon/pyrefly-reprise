# Round 10 repair: group command menus (fix10b)

Repair pass on top of the fix agents' round-10 command-menu fixes (`1f40b9a4`,
`036c5a21`, `b001e96b`, `100abe95`), against the adversarial verifier's
findings on those commits. Scope owned this pass: `src/ui/ffx/**`
(command menu, help slab, FFX HUD css), `src/ui/ffx2/CommandMenu*.ts`, the
FFX-2 command menu css, `src/ui/ffx2/FFX2BattleHud.ts` (mounting only), and
`src/ui/ffx2/commandHelp.ts`.

## PR-0002 — the FFX top-level stack over Yuna (left for Bailey)

**Reverted** the round-10 `MAX_VISIBLE_TOP_ROWS = 2` cap back to
`MAX_VISIBLE_ROWS` (shared with submenus). The verifier found two problems
with the 2-row cap:

1. It cut the FFX command stack from the approved 5-row Ink & Gold mock
   (`docs/screenshots/mockups/A-ink-and-gold-battle.jpg`) to 2 rows, with no
   options round and no yes from Bailey (AGENTS.md rule 9).
2. It did not even close CHK-008's gap: live-measured in Chapter 3, Yuna's
   coverage still ran 34–44% (over the one-third bar) as the cursor moved
   through the list, because the window's vertical anchor moves with
   `topIndex`.

Shipping an unapproved layout change that also fails its own acceptance
check is worse than the known, already-carried bug, so this reverts rather
than repairs. The round's own regression test
(`tests/unit/ui-ffx-hud-safe-zones.test.ts`, "PR-0002" describe block)
compared two hard-coded rectangles and could not fail regardless of the
code; it is now `it.todo` with a comment pointing here.

**Needs a decision from Bailey**, one of:
- Accept fewer visible top-level rows in an options round (a real design
  pick, not a silent cap), or
- Move party slot 0 in `src/scenes/gagazet.ts` / `src/scenes/dreams-end.ts`
  (round 09's other suggested fix) — this is a hand-tuned, six-rig scene
  composition (`intro`/`idle`/`action`/`party`/`enemy`/`victory`), already
  solved against several other constraints (HUD safe area, enemy rail), so
  it is its own rule-9 case and its own options round, not a quick nudge.

## PR-0018 — the selected/disabled command label contrast

**Fixed**, FFX only (FFX-2's own tracked label already passed, per the
verifier).

- `--ffx-trigger-ink` (the TALK/trigger label's own mark) is darkened from
  `#5c3f0a` to `#3d2806`. The round-09 value cleared 4.5:1 on the *declared*
  colours (8.57:1 cream, 5.21:1 gold) but the verifier measured it at 3.76:1
  live, under `.ig-surface__vignette`'s corner darkening — not enough
  margin. The new value computes to 12.36:1 / 7.51:1, a bigger cushion
  against the same worst-case pixels.
- Disabled FFX command rows (`.ig-cmd--disabled`) no longer rely on the
  shared `slabs.css` opacity-blend (0.42, which fades toward whatever is
  painted behind the row and measured 1.98–2.44:1 live). FFX's own disabled
  rows now render as a flat, fully opaque face (`#2a2a30` / `#d8d8de`,
  10.05:1), independent of the backdrop — the "inverted slab" option round
  09's own fix note suggested. `slabs.css` itself is untouched (shared,
  out of this track's files).
- `tests/unit/ffx-cmd-trigger-contrast.test.ts` now reads the trigger ink
  and the disabled face/text pair from `ffx-hud.css` itself (the verifier's
  complaint: the old test hard-coded a copy of the value, so a revert of the
  CSS would still pass it).

**Left open, out of scope for this track's owned files:** the verifier also
found `.ig-surface__vignette` (shared `src/ui/inkgold/slabs.css`) sits above
the *entire* FFX command stack in paint order (`FFXBattleHud.ts` appends
`stage`, then `overlay`, then the vignette `surface`, in that order), so
every selected row's real contrast — not only the trigger's — can be pulled
down by the vignette's corner darkening, not just the rows this pass
touched. Whether the command stack should render above the atmospheric
vignette (and what that does to the approved look's corner shading) is a
rule-9 pick for whoever owns `src/ui/inkgold/`.

## PR-0019 — the ALL ALLIES chip over the help slab (partial, chip fixed)

**Fixed** the part in scope: `.ffx-cmd-info` (FFX's help slab) gets an
explicit `z-index: 2`. It is `position: absolute` already, so this creates
its own stacking context; neither `.ffxhud__stage` (the slab's ancestor) nor
`.ffxhud__overlay` (the chip's ancestor, `TargetCursor.ts`'s
`.ffx-target__all`) creates its own stacking context, so this is enough to
lift the whole sentence — including its own transparent-background text
glyphs — above the chip within their shared context, without moving either
element's own tuned position. Verified in a real GPU Chromium (ANGLE NVIDIA
GeForce RTX 5070 Ti, headless) against a from-source CSS fixture built from
`ffx-hud.css` + `inkgold/tokens.css`/`slabs.css`/`screens.css`:
`document.elementFromPoint` at the overlap's centre returns the slab's own
`.ig-cutin__info-desc` with the fix, and the chip's `SPAN` without it — see
`docs/screenshots/fix10b/PR-0019-zindex-fixed.png`.

**Not independently re-verified against the live, running game this pass**:
this session's own dev server did not finish booting the full app (Vite
transforming ~600 modules, real GPU renderer confirmed at
`ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti)`, but `window.__pyreflyReady`
never went true inside this session's time budget) — an environment issue
on this run, not a code issue, but it means the previous round's own live
capture (real key presses through Special > Cheer > confirm) was not
repeated here. The CSS mechanism is proven from source; a full live re-run
(1280x720 and 3840x2160, both games, the acceptance check's own
scrollWidth/clientWidth sweep) is still owed before this is called done.

**Also found, not attempted:** the round-09 fix suggestion's other half —
"or right-pad the slab by the chip's width" — was not needed once the
z-index fix landed, so it was not pursued.

## PR-0012 — the FFX-2 command menu's highlighted-row description

**Fixed**, FFX-2 only, three separate bugs the verifier found under one id:

1. **"Passes red" printing as a row's description.** `commandHelp.ts`'s
   `commandEffectText` called `describeAbility` first for every command
   kind, which reads `AvailableCommand.help` when present —
   `spherechange` rows carry `help: "Passes <gates>"` (the Garment Grid
   gate-preview string `CommandMenu.ts`'s own row already prints), not a
   description. `escape` and `spherechange` are now handled before
   `describeAbility` is ever asked, matching the doc comment's own stated
   intent ("the highlighted-row slab says what Change fundamentally is, not
   that fact again").
2. **Esuna's (and any long status-cure line's) description clipped to 2
   lines with an ellipsis** (`-webkit-line-clamp: 2`, CHK-009 regression).
   Raised to 3 lines / `max-height: 46px`.
3. **The false code comment.** `ffx2-hud.css`'s comment on `.ffx2-cmd-info`
   claimed "none was found for chapters 4-6 at 1600x900" for a
   party-column collision; the verifier measured ~21,920 CSS px² of real
   overlap in all three chapters, printing across a party row's HP/MP and
   ATB gauge. Replaced with an accurate comment tracing the actual
   geometry (both elements anchor to `bottom-right` for FFX-2; the slab's
   `bottom: 30px..63px` sits *inside* the party column's own
   `bottom: 10px..100px`, not below it).

**Left for Bailey**, unchanged from round 09/10: no placement for
`.ffx2-cmd-info` was found that clears the party column without moving one
of the two (a rule-9 pick, not a redesign to make unasked). Per the "feature
may ship switched off" release rule, `FFX2BattleHud.ts`'s `setCommandHelp`
now gates the whole slab off with
`FFX2_COMMAND_HELP_PLACEMENT_RESOLVED = false` regardless of `battleHelpOn()`
— the underlying plumbing (description text, per-row gating) is correct and
game-aware and ready to flip on once a placement is picked.

## Files touched

- `src/ui/ffx/CommandMenu.ts` — revert `MAX_VISIBLE_TOP_ROWS`, fix comments
- `src/ui/ffx/ffx-hud.css` — PR-0018 tokens, PR-0019 z-index
- `src/ui/ffx2/commandHelp.ts` — PR-0012 spherechange/escape ordering
- `src/ui/ffx2/FFX2BattleHud.ts` — PR-0012 mount gate
- `src/ui/ffx2/ffx2-hud.css` — PR-0012 comment fix + Esuna clip fix
- `tests/unit/ui-ffx-hud-safe-zones.test.ts` — PR-0002 test → `it.todo`
- `tests/unit/ffx-cmd-trigger-contrast.test.ts` — read real CSS, add
  disabled-row coverage

## Verification run this pass

- `npx tsc --noEmit`: clean.
- Vitest by name: `ffx-cmd-trigger-contrast`, `ui-ffx-hud-safe-zones`,
  `ui-ffx2-command-menu`, `ffx2-command-fold-attached`, `ui-ffx2-hud`,
  `css-comments` — all pass (135 tests + 1 todo).
- `node tools/orphans.mjs`: 24 orphans, same pre-existing set as before this
  pass (no new orphan).
- Real GPU Chromium (`ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti)`), headless,
  `PYREFLY_BROWSER=gpu` launch args: confirmed for the PR-0019 stacking
  mechanism (see above). The full running game was not reached this pass
  (dev-server boot did not finish inside the session's time budget) — a
  live re-run through the actual command menus with real key presses,
  matching each acceptance check's exact repro, is still owed.
- Full `npm test` (110 files) was **not** run this pass — only the files
  above (touched or covering the touched modules). Still owed before any
  push per AGENTS.md "Done means".

## Not done

- Live, in-game re-verification of PR-0019 and PR-0012's fixes with real key
  presses (environment: dev server did not finish booting this session).
- PR-0018's vignette-vs-command-stack interaction (shared `inkgold/slabs.css`,
  out of this track's owned files).
- PR-0002's and PR-0012's placement decisions (left for Bailey, above).
- Full `npm test` suite.
