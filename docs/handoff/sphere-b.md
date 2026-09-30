# sphere-b: Sphere Grid B (bigger grid, node preview and path, legend in words, a phone page)

**Branch** `sphere-b` (from `sphere-ac` 7f01fb3a), worktree `D:/pyrefly-r29-options`.
Not pushed, not merged, not deployed. **Game case: FFX only.** The Sphere Grid is FFX's
levelling board [research/visual-bible.md §5.4, research/ffx-combat-core.md §10]; FFX-2 has
the Garment Grid, and `src/ui/ffx2/` was not touched. Every new CSS rule is keyed on
`data-tab='sphere-grid'`, a tab only FFX registers.

**Decision:** D-295, Bailey 2026-09-29 evening (option B), on top of A + C (D-290).
Targets: `docs/concepts/fb-0929/sphere/option-b-layout.jpg` (1600x900) and
`option-b-phone.jpg` (390x844). Preflight (rule 15, critic-plan said DEEP):
`docs/plans/sphere-b-review.md`.

## Target vs build

- `docs/concepts/fb-0929/sphere/final-b/b-desktop-target-vs-build.jpg` (1600x900)
- `docs/concepts/fb-0929/sphere/final-b/b-phone-target-vs-build.jpg` (390x844: target, first
  screen, scrolled)
- `docs/concepts/fb-0929/sphere/final-b/b-desktop-actions.jpg` (after WALK AND ACTIVATE, and
  C's result on the new layout)
- Screenshots: `docs/screenshots/picks-0929/sphere-b/`.

The build opens on the target's own figures (Tidus, Chapter I): Strength +2 selected,
STR 31 → 33, Power 12 → 11, 2 steps · 2 S.Lv, S.Lv 30 → 28, route labels
`1 · 1 S.LV (PAYS 4)` and `2 · 1 S.LV (NEW)`, the `+2 STR` tag, grid box 180,214 1040x569.
Differences, all deliberate: AUTO-LEARN (C) sits in the header before WALK; the shell's
hint line (ENTER / ESC BACK, the only pointer way back) sits where the target has its
caption; the location line is the chapter's full one; on the phone the pouch keeps Fortune
(so it wraps to two rows), and AUTO-LEARN and the legend sit under the first screen.

## What was built

- **Desktop layout** (`sphere-grid-b.css`, `sphere-grid-b-card.css`): the shell's roster
  becomes the panel's own rail of portraits with each S.Lv (`.sgb-rail`, using the shell's
  `data-action="prep:member-N"`), the field party strip and the roster are hidden on this
  tab only, the ivory sheet becomes a transparent full-board layer, and the grid, header,
  card, legend, pouch and START are placed at the target's 1600x900 coordinates / 2.5.
  The opening zoom is 0.58 (the target's readout; was 0.45 for the old 835x225 strip).
- **Card** (`sphereGridSide.ts` markup): the node's name, what it gives (`STR 31 → 33`,
  `MAX HP 2420 → 2620`, `Learns …`, `Opens the path for everyone`), the sphere
  (`Power · 12 → 11`), the path (`2 steps · 2 S.Lv`), `Tidus after S.Lv 28`, and one button:
  WALK AND ACTIVATE / ACTIVATE / WALK AND OPEN / WALK THERE, off with a reason when the
  S.Lv cannot pay or no open path exists. The header shows `S.LV 30 → 28` while the
  selected walk would spend any.
- **Route** (`sphereGridRoute.ts`): one Dijkstra with the model's prices (1 S.Lv onto new
  ground, 1 per four travelled steps, tracked as paid steps), through open ground only.
  AUTO-LEARN's `nextTarget` now calls the same search, so the two can never price a walk
  differently (its tests still pass unchanged). Drawn on the grid by `sphereGridPaint.ts`:
  dashed walk, a ring per step, a double ring on the target, a cost label per step (first
  six), the gain tag.
- **Walk and activate** (`sphereGridPreview.ts`): `moveTo` per step, then `activate` on the
  node it stands on (or the closed lock beside the walk, as a click does today). No new
  rule; the next-door activation question stays as the tab answers it. All or nothing: a
  refused call restores the snapshot. The **preview is the same run, dry** (snapshot, run,
  read, `restoreGrid`), so the card's numbers are by construction what the button does.
  The button, a second click or tap on the selected node, and Enter all do it.
- **Opening selection:** a member's view opens with the cursor on the cheapest node worth
  taking (AUTO-LEARN's own choice), which is exactly the target's opening picture. Our
  choice, not the picture's instruction (question below).
- **Keyboard / pad:** walk mode's directions now step along links from the cursor (fb-0929
  had kept it beside the character, because Enter could only act there); Enter walks and
  activates wherever it lands, after the card has priced it. Triangle / Shift / Q, L1/R1
  zoom, Esc as before. The fb-0929 test 5 was rewritten to this (each step follows a link;
  a node two links out is walked to, never "Not linked").
- **Phone page** (`sphere-grid-b-phone.css`, `sphere-grid-b-phone-card.css`): under 600 px
  the stage becomes one scrolling column (the CHAPTER tab's PR-0127 recipe): tabs, a row of
  faces, name and S.Lv, the grid (358x330; a drag pans it, `touch-action: none`; the page
  scrolls everywhere else), the five controls, the card with `TAP AGAIN: WALK AND
  ACTIVATE`, the pouch, AUTO-LEARN, the legend, START pinned. Every control is 44 px or
  more both ways (tabs included), no text under 14 px in the page, no sideways scroll. The
  canvas draws in units of `--sg-unit` (1.8) CSS px on the phone so its type is not 5 px;
  the canvas's own legend strip is off there (`--sg-strip: 0`), the page carries the legend.
  A's card and C's result keep their phone layers (now `position: fixed` so they stay put
  while the page scrolls); sphere-ac's dock is hidden on this page (AUTO-LEARN and `?` are
  in it).
- **Files:** new `sphereGridRoute.ts` (177), `sphereGridPreview.ts` (177), `sphereGridSide.ts`
  (189), `sphereGridPaint.ts` (259), four CSS files (272 / 240 / 293 / 227). Shrunk:
  `SphereGridView.ts` 753 → 653 (ground, token, tooltip painting moved out),
  `SphereGridPanel.ts` 367 → 316, `sphereGridAutoLearn.ts` 335 → 233, `party-prep.css`
  462 → 242 (the old strip layout's rules, now dead, removed; the three still used moved
  into `sphere-grid-b.css`). `sphereGridCaption.actionLine` is no longer used by the panel
  (the card replaced the caption line); its tests still cover it.

## Evidence (run, not grepped)

Dev server on 8510 (no watcher; stopped by PID), headless Chromium on the GPU while ComfyUI
was rendering (timings are under that load). Probes: `D:/Tools/pyrefly-scratch/picks-0929/sphere-b/`
(`desk.mjs`, `phone.mjs`, `look.mjs`, logs `desk-log.txt`, `phone-log.txt`).

- Desktop 1600x900, mouse and keys: A's card on first open, GOT IT; the card read the
  target's figures; WALK AND ACTIVATE: position 121 → 123, S.Lv 30 → 28, STR 31 → 33, Power
  12 → 11 (exactly the preview), note "Tidus walks 2 steps to Strength +2 (2 S.Lv).
  Strength +2 activated"; one click on node 124 selected it (WALK THERE, 1 step 1 S.Lv),
  a second click walked there; Shift, arrows along links, Enter walked and activated
  (124 → 125, STR 35); one Esc left walk mode and stayed on party prep; AUTO-LEARN then UNDO
  restored the whole chapter `buildRef` byte for byte; a rail portrait switched to Yuna
  (card: Evasion +4, EVA 33 → 37, 3 steps); STATS shows the roster and party strip again.
- Phone 390x844, taps (touch events): the page, 21 controls all >= 44x44, no text under
  14 px, document and page 390 wide; a second tap on the selected node walked and activated
  (S.Lv 30 → 28, STR 31 → 33, Power 12 → 11); a touch drag on the grid panned it (-80, -64)
  and did not scroll the page; a drag on the card scrolled the page (141 px); AUTO-LEARN by
  tap and UNDO exact; `?` reopened A; a face switched to Kimahri.
- `tests/e2e/sphere-grid-b.spec.ts` (new): desktop grid box 1040x569 at x 180, card right
  of it, roster/strip hidden only here; phone controls >= 44 px, no text under 14 px, no
  sideways scroll, the card's button by tap. Run against the dev server with a scratch
  config: 2/2 passed.

## Checks

- `npx tsc --noEmit` clean; `npx tsc -p tsconfig.e2e.json` clean.
- New `tests/unit/sphere-grid-b.test.ts` (10): the target's figures; a preview leaves the
  build and model exactly as they were; the card's numbers equal what WALK AND ACTIVATE
  does, node by node for all seven characters; the route's S.Lv is what `moveTo` takes step
  by step; WALK AND ACTIVATE equals the same steps by hand; all or nothing when the S.Lv is
  short; no sphere → walk only, said; a closed lock is reached beside it and opened with its
  key; the route never passes a closed lock; the pouch in words.
- Sphere and prep tests: 8 files, 98 tests pass (after test 5 of fb-0929 was rewritten).
- Full suite once: 676 passed, 1 failed = `strategy-ffx2-bahamut` timed out at 15 s under
  load (FFX-2 engine bench, untouched here; the same failure sphere-ac saw); alone 19/19.
- `node tools/orphans.mjs`: 24 orphaned, the same as main.

## Open

- The explainer card (A) still says "click it again, or press Enter, to move there or
  activate it"; with B one press walks and activates. Its copy is the approved target's.
- On the phone the canvas labels are about 7 to 10 CSS px (the target's are about the same);
  they are canvas art, not page text, but they sit under the 14 px floor.
- The desktop `.prep` is 1648 px wide inside its hidden overflow because of the shell's
  blurred wash (`scale(1.06)`), on every tab; not new, not visible.
- The Tidus field card HP after an HP node (pre-existing, see sphere-ac).
- `docs/target/targets.json` does not yet record B's delivery (the driver's to update).
