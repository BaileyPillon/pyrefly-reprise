# r35-fix-flow: the flow lane of release 35 (defect fixes F1 to F6)

Branch `r35-fix-flow` in the worktree `D:/pyrefly-advisor-v4`, cut from `c675f29b` (rel35 = main e1a46221 +
vis-fix). One commit per item, none touching `src/app/SaveData.ts`, the settings schema, the engine, the RNG
or any painting, so release 35 stays out of the save-data class. Not pushed, not deployed.

Every measurement is a headless Chromium on the real GPU (`PYREFLY_BROWSER=gpu`) driven from node: "before" is
the base `c675f29b` plus F1 only (a production build served on its own port); "after" is this branch. Scratch
(scripts, JPEG frames, builds) is under `D:/Tools/pyrefly-scratch/2026-10-02-rel35/flow/`.

## What changed, by item

| Item | Game case | Cause (traced) | Fix | Before to after |
|---|---|---|---|---|
| **F1** FR-34-01: the first Esc at Chapter I's first command menu did not open the pause | FFX only (the guide's battle step is FFX-only; FFX-2 Ch IV already opened on the first press and still does) | Not the coach line's own cancel: `firstRunGuide.skipFirstRun` calls `host.absorbInput()` (an exclusive `claimKeyboard` released at once, `Input.absorbEdges`), which drops the Esc edge so BattleScreen never saw it. The guide's slab says "Esc skip the guide", so Esc skips it, and the press was swallowed on purpose "so it does not open the pause in battle" | In battle the Esc that skips is no longer absorbed (`skipFirstRun(false)` from the turn guide's `ended`); steps 1 and 2 (board, prep) still absorb it so Esc does not also go BACK | Real keys, 1600x900, fresh profile, coach up: Esc#1 opened nothing (needed Esc#2) -> Esc#1 opens the pause, Esc#2 closes it. With the line dismissed by a click: opens on Esc#1 (before, the same). FFX-2 Ch IV: first press opens, unchanged. `ui-coach-first-run.test.ts` updated (absorbed 1 -> 0) |
| **F2** LIVE-R34-01: a stray request to `/pyrefly-reprise/%23n` | both (shared transition) | Not the CSS noise data URIs (they are fine and are left alone). CDP initiator log: an `<img>` created by `entryOverlay.paintDomPictures` on every battle entry (RESTART ENCOUNTER included). Its pattern `url\(["']?([^"')]+)` stops at the first quote of a computed `url("data:image/svg+xml;utf8,<svg ... filter='url(%23n)'...")`, fails on the outer `url(`, then matches the INNER `url(%23n)` and draws that as a picture | `firstCssUrl()` reads a url() as CSS does (a quoted URL runs to its closing quote); `data:` textures are skipped as before | Pause -> Options -> RESTART ENCOUNTER, Ch I: one `%23n` request at 1600x900 and at 390x844 -> none. 0 responses at or above 400 and 0 console errors in both runs, both builds (vite preview answers an unknown path with the page, so the 404 itself only shows on Pages; the request is the evidence). `entry-overlay-css-url.test.ts` |
| **F3** PR-0274: no advisor card at the first menu of XVII and XVIII | FFX only (the FFX HUD's safe-zone solver, Sin fights only) | Not a display bug: `advisorZone` declines (the boss frame, the guide and the Sin clock or Fin plate leave no 132x72 box) and `advisorChipFollow` takes the chip down with the card | New `advisorStrip.ts`, a third pass that runs only after both designed passes decline: the tersest density rung in the 184x48 grid px band of deck under the party, between the command stack and the party column (min card height 34). `FFXBattleHud` calls it in place of `advisorZone` (net 0 lines) | XVII 2000x1012 and XVIII 1600x900: card hidden (`data-zone` free) -> shown (`data-zone` compact), clear of the intent line, the clock, the plate and every fighter (measured by the solver and by `tests/unit/ui-ffx-advisor-strip.test.ts` on the two real inputs). The strip runs only when the state carries `sin.*` flags, so no other chapter moves (an ungated version broke four `ui-ffx-hud-intent-toggle` tests, which pin the E read-out taking the band). Screens `r35-fix-flow-sin-xvii-card.png`, `-xviii-card.png` |
| **F4** PR-0273: dead PULL BACK / CLOSE IN rows at XVII link 3 | FFX only (research/ffx-sin.md section 1: on Sin's back, no Trigger Command) | With no `airship.range` there is no widget to fold the engine's greyed order triggers into, so they were listed | `AirshipOrders.withoutDeadOrders`: greyed order rows are dropped when the widget does not apply (the cascade and the advisor's "in Orders" list use the same function). Engine untouched, no RNG | Seed 1, link 3, first menu, rows: `Pull back [disabled], Close in [disabled], Attack, ...` -> `Attack, Special, White Magic, Items, ...` at 1600x900 and at 390x844. Links 1 and 2 keep Orders (`sin-orders-folded.test.ts`, `evrae-orders-none-choosable.test.ts` pass). `airship-orders-no-range.test.ts` |
| **F5** vis-fix check: banner and advisor card through the Ch I seed 3 victory | FFX only (FFX HUD) | The engine's `result` runs ahead of the presenter, so the state sweep in `FFXBattleHud.sync` had already run when the presented `message` event ("Mortiorchis uses Mortibsorption", the death trigger) showed the banner again; the HUD's advisor decision was also still open (an auto-played decision never resolves the HUD's own menu promise) | `onEvent` sweeps on `victory` / `defeat` (`clearTransientOverlays` + `advisor.clearDecision`), idempotent | Ch I, seed 3, intended line, 50 ms sampler from the presented `play:victory` phase: 71 of 74 frames carried the banner and the card -> 0 of 75. `ffx-hud-battle-end-sweep.test.ts`. FFXBattleHud stays 1667 lines |
| **F6** PR-0292: Sphere Grid AUTO-LEARN and ? had no key or pad route; phone explainer | FFX only | `Input.ts` has one abstract button free in prep, `select` (M, V, pad Select); Tab, Shift, Q are WALK, E and C start the battle | AUTO-LEARN = `select`; ? = H or the `?` key or pad X / Square (read off the pad: no abstract button is left); labels on the desktop buttons (`M`, `H`, or `SELECT`, `X` once a pad is connected); explainer swaps CLICK / Enter / wheel for TAP / pinch under `(pointer: coarse)`; its buttons stick to the bottom of the card on the phone | Desktop real keys: M opens the AUTO-LEARN result, H opens the explainer, Tab still toggles WALK, a fake pad's Select and X do the same. 390x844 explainer buttons: y 883-983 (below the fold) -> 700-800 (inside 844). Desktop wording unchanged. `sphere-grid-help-keys.test.ts` |

## F5, the engine question (read only, nothing changed)

Does Mortiorchis acting after Seymour Flux's KO match `research/ffx-seymour-flux.md`? Yes. Run headless for Ch I
seed 3 (the intended line): Tidus's Fire Gem KOs Mortiorchis (`ko mortiorchis`); the death trigger then fires as
a `message` ("Mortiorchis uses Mortibsorption"), `damage seymour-flux 3000`, `ko seymour-flux`, and only then
`heal mortiorchis 3000`, then `victory`. So the heal after Flux's KO is the second half of the same ability, and
the log has no separate Mortiorchis turn. Section 2.2 says Mortibsorption "deals damage equal to its own current
max HP to Seymour Flux, heals itself for that same amount" when its HP reaches 0 (`drains = true`), and the
Mortibody note (line 201) says it "fires even if the drain kills Seymour". No engine change is needed.

## Gates

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: 733 files passed, 5 skipped; 10816 tests passed. (The first full run
  found four failures in `ui-ffx-hud-intent-toggle`: the F3 strip gave a card back where the E read-out is meant to
  take the band. Fixed by gating the strip on the Sin fights, commit "F3 follow-up".)
- `node tools/orphans.mjs`: 24 orphaned modules, none of them mine (advisorStrip is imported by FFXBattleHud).
- Rule 7: no file over 400 lines grew (FFXBattleHud 1668 -> 1667, hudSafeZones 543 -> 543, the new files are 59 and
  under 140 lines); the F6 CSS and TS files are under 400.
- Servers on 5670, 5671 and 5672 stopped by PID. Screens: `docs/screenshots/r35-fix-flow-*.png` (Sin XVII and XVIII
  cards, the phone explainer, desktop AUTO-LEARN with its key labels).

## Not obtained

- F5 with a full fight by real keys: two attempts to play Ch I seed 3 to victory by Enter presses (attack, first
  target) did not reach the victory within 15 minutes (and the first lost its page to dev-server reloads). The
  evidence is the intended auto line booted by real keys; the fix is event-driven (the presented `victory`), so the
  path a player's keys take ends at the same event.

## Open items

- F1 behaviour: a player who presses Esc at the very first menu to pause now also skips the first-run guide for
  good (the slab says "Esc skip the guide", so the label is still true). The alternative, keeping the guide and
  letting Esc only pause, would change the approved label.
- F3: the strip card is short (the tersest rung: name, move and the board's note). A taller card would need the
  deck band freed, which is a layout decision for the Sin chapters.
- F2 leaves the three unencoded noise data URIs as they are (they render, and `url(%23n)` inside a data URI is
  correct). The aborted `art/pause/tidus.png` request on RESTART (net::ERR_ABORTED, not a 404) is in both builds.
- F6: the grid's own hint line ("WHEEL ZOOM · DRAG PAN · CLICK A NODE · SHIFT WALKS") and the side card's "Enter or
  click again" still use pointer wording on a phone; the brief named the explainer only.
- FFX-2: its HUD was not checked for the F5 stale banner (the brief scoped F5 to FFX).

## askBailey

1. F1: is "Esc at the first menu pauses and also skips the first-run guide" the behaviour you want, or should Esc
   pause and leave the guide up (which means reworking the label "Esc skip the guide" at that step)?
2. F3: is a short strip card under the party acceptable at the Sin first menus, or would you rather give the card
   a real box there (moving the strategy guide)?

## Check (independent, 2026-10-02, branch at 564c8c8d)

Checked by a session that did not build the lane. A production build of 564c8c8d (served on 5680, stopped
by PID afterwards); "before" is the live build (release 34) on Pages. Headless Chromium on the GPU, driven
from node, with real keys, clicks or taps for every checked input (the debug API only navigates to the
fight). Scripts and JPEG frames: `D:/Tools/pyrefly-scratch/2026-10-02-rel35/check-flow/`.

| Item | Result |
|---|---|
| F1 | Confirmed. Live: Esc#1 at Ch I's first menu (guide line up) opens nothing, Esc#2 opens the pause. Branch: Esc#1 opens the pause, Esc#2 closes it, Esc#3 opens it again. Same when the line is ended by clicking its skip words (no command fires, the menu stays). FFX-2 Ch IV (`ffx2-bahamut`): first Esc opens the pause, unchanged. |
| F2 | Confirmed. Live: RESTART ENCOUNTER requests `/pyrefly-reprise/%23n` and gets a 404. Branch: no `%23n` request on the first entry or on RESTART ENCOUNTER at 1600x900, 390x844 (pause by tap) and FFX-2 Ch IV; no 4xx and no console errors. The aborted `art/pause/*.png` request on RESTART is in live too. |
| F3 | Confirmed. Live XVIII 1600x900: card declined (`data-zone` free). Branch: card shown (compact) at XVII 2000x1012 and 1600x900 and XVIII 1600x900, with the guide line up, after it is dismissed and after E; it overlaps no visible panel (command stack, party, guide, clock, plate, intent, coach line). Phone 390x844 keeps its own TIP strip (zone open), unchanged. Minor: at 1600x900 the strip card's last line ("IN WHITE MAGIC") sits flush on the card's bottom edge. |
| F4 | Confirmed at 1600x900 and 390x844: XVII link 3 rows are Attack, Special, White Magic, Items, Overdrive, (Switch), Flee [disabled]; no PULL BACK / CLOSE IN. Arrow keys walk every row and skip only the greyed Flee. Link 1 and Evrae still open on Orders. |
| F5 | Confirmed, and the missing acceptance step is now met: Ch I seed 3 played to a **victory by real keys** (65 turns, 394 s; the player follows the advisor card's top move with arrows and Enter, Attack when a switch is advised). From the presented victory on: 0 frames with the banner or the card. An earlier real-key run ended in a defeat: 0 frames with either after the presented defeat as well. |
| F6 | Confirmed: M opens the AUTO-LEARN result, H and `?` open the explainer, pad Select and pad X do the same, labels read M / H and SELECT / X with a pad, Tab still toggles WALK, H and M on another prep tab do nothing there and leave nothing queued, E still starts the battle. Phone: TAP / pinch wording, buttons at y 700-800 inside 844. **Defect (new in this lane, not a regression vs live):** H pressed while the explainer is already open is remembered, so closing the card (Esc) re-opens it on the next frame (`onHelpKey` sets `helpKey` while the card is open, and `takeHelpKey` only runs once it is closed). Measured: H, H, Esc gives the card open for the next 1.2 s; H, Esc closes it. Fix: clear `helpKey` while a card is open (or ignore the keydown then). |

Gates re-run: `tsc --noEmit` clean; full `vitest run --testTimeout=60000` 733 files passed, 5 skipped, 10816
tests passed; `tools/orphans.mjs` 24, the same set, none from this lane; `verify-approved.mjs` 469 ok, 0
mismatched, 0 missing; `git diff c675f29b..564c8c8d -- src/battle` empty; SaveData and the settings
schema untouched; rule 7 holds (FFXBattleHud 1668 -> 1667, hudSafeZones 543 -> 543, every grown file under
400). Rule 14: every fix commit names its game case; the handoff commit (docs only) does not.

Notes: in `sphereGridHelp.ts` the new `labelKeys` / `takeHelpKey` were inserted between `handleInput`'s doc
comment and `handleInput`, so that comment now sits on `labelKeys`.
