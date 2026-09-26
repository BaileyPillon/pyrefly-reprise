# t1-b2a: FFX HUD half of batch 2 (thresholds program, 2026-09-26)

Branch `t1-b2a` (worktree `D:/pyrefly-t1-b2a`, from main 3665f1eb). Plan:
`docs/plans/thresholds-program-2026-09-26.md` §2 "Batch 2". Issue texts:
`critic/rounds/round-13.json`. Evidence: `docs/screenshots/t1-b2a/`.

No item here was stalled under rule 15 (none had two failed attempts or two
reviews leaving the same issue open after a repair), so no method check was
owed.

## Fixed (class A)

| Item | Game | What changed | Check |
|---|---|---|---|
| PR-0149 | both (shared loader) | New `src/engine/fetchRetry.ts`. `tryLoadMeta` retries once after 500 ms on a 5xx or a thrown fetch, never on a 4xx. `tryLoadImage` and `tryLoadTexture` retry once only when the art manifest says the file ships, because the image loaders cannot tell a 503 from a 404. | `painted-art-retry.test.ts`: a 503 then 200 stub still gets the sidecar, and a 404 still makes one request. |
| PR-0176, FOC18-02 | FFX only | Aeon rows in `CtbList` take `resolvePortraitKey(spriteKey)` plus the idle crop. Both are skipped for Yojimbo: his navy painting is not approved (D-054). `wirePortraitFallbacks` hides the ink monogram once any painting layer has loaded, which fixes Mortibody's M showing through. A chip whose layers all fail keeps its letter. | `ui-ffx-ctb-aeon-portraits.test.ts`. Production build at 1600x900, first menu of Ch I, III and IX, plus Ch X after summoning Bahamut and Ch XIV after summoning Valefor (real keys): every tile has a painting and no monogram is visible. Frames: `ctb-*.jpg`. |
| PR-0191 | FFX only | When the gauge drops from full, `ZanmatoGauge` holds the full view until Yojimbo's `action-end`. A gauge drop no longer clears the banner, which now ends on its own 2.6 s timer. Running the engine showed why this matters: the 100 -> 0 `overdrive-gauge` event plays before the strike's `action-start`. | `ui-ffx-zanmato-hold.test.ts` replays a real engine route to the first Zanmato. The old widget test that pinned the early banner cut was updated. Browser: `zanmato-replay.json` (see the note on injection below). The banner showed for 2.86 s. The panel read full "Next: Zanmato" at all three 9999s and changed to 0 only at Yojimbo's action-end. |
| PR-0190, PR-0182 | coach rule: both; Ronso Rage: FFX only | **Root cause, measured with real keys:** the cut-in never swallowed Enter. Auron's held coach line on Kimahri's first turn took the confirm in the capture phase. `CoachMark` now remembers a cursor move made under the line and lets the next confirm through, while still taking the line down. A bare confirm still dies with the line in both games, which is all PR-0051 and FOC-01 asked for. `openKimahriRage` now resolves straight to `params.abilityId`, so there is one chooser, not two; the list remains only as a fallback. | `ui-coach-layer.test.ts` (FOC-01 contract updated; bare-confirm cases added for FFX and FFX-2) and `ui-ffx-yojimbo-minors.test.ts`. Production build, Ch I at 1600x900: Arrow then Enter at 100, 300 and 600 ms after the cut-in starts, with and without the coach line, opens the highlighted row every time. Enter on OVERDRIVE opens the list on the first press. Enter, arrows, Enter plus one party-target confirm fires Mighty Guard (checked in the battle log). |
| PR-0183 | FFX only | New `src/ui/ffx/plateFaces.ts`. The top third of each party figure, and of the aeon when one is out, now counts as an obstacle for the plate's dock (plate docking only; the field's visibility sums are unchanged). | `ui-ffx-plate-faces.test.ts`. Real keys, Ch I and Ch III single-target frames at 1600x900 and 2000x1012: no plate touches a party face, and each plate sits against its own figure. Frames: `seymour-flux-*.jpg`, `braskas-final-aeon-*.jpg`. |
| PR-0128 (guide half) | FFX only | New `src/ui/ffx/overdriveFocus.ts` marks the HUD root while an Overdrive overlay is open. `ffx-hud.css` hides `.sgd` under that mark. The mark comes off on a result, a throw or a rejection. | `ui-ffx-overdrive-focus.test.ts`. Frames `overlay-open-1600.jpg` and `overlay-open-2000.jpg`, 0.5 s after the overlay opens: the "Tidus · USES SLICE & DICE" plate is clear, and a real Enter closes the overlay and brings the guide back. |

## Stopped

- **PR-0186 (the Sensor card in Ch III): stopped because it needs a design choice.** Measured on the production build in grid px (1600x900 and 2000x1012 give the same numbers). The card is 116x74 and rests at 428..544 x 166..240. The only free space in its column is the band above Braska's Final Aeon, which is 69 px tall with the grown obstacle box (BFA top at 77) and 78 px with the tight box. Below BFA (bottom 230), the party-status panel starts at 258. The column has no height that clears both Pagodas, BFA and the fixed panels, and the band left of the turn list is 12 px wide. A column solver was built and measured, then removed (it found no slot). Meeting "misses both Pagodas and BFA" needs one of these, which is Bailey's or the driver's call: (a) fold the card while an enemy is aimed at (it has a folded state already); (b) a smaller card; (c) allow a tight fit against the top edge using the tight silhouette box, with no slack. Nothing about the Sensor card was changed.
- **PR-0128 (the HIT ×2 / ×4 / ×6 tick labels): stopped under rule 6.** The approved tile prints MISS / HIT ×2 / HIT ×4 / HIT ×6 across the bar. Our Swordplay has one centred success zone (`resolveTidusTiming`), and the sources give no hit count that depends on bar position (research/assets-and-tech.md §2A, ffx-combat-core §5.3: success versus the fail row; the bonus comes from time remaining). Restoring the labels would tell the player that the right edge gives six hits, which is unsourced game data. What the ticks should say needs a decision: keep MISS / HIT, or pick words that match the real mechanic.

## Checks

- `npx tsc --noEmit`: clean.
- Full `npx vitest run --testTimeout=60000`: exit 0, 454 files passed, 4 skipped, 8,333 tests.
- `node tools/orphans.mjs`: 24 orphaned, the same as main. The three new modules are all reachable.
- No art was touched. `target-approved-hashes-judge-locked` is in the full suite and green.
- Browser: production build (`vite build`) served by `vite preview` on port 5980, headless Chromium with GPU args. Keys were real Playwright keypresses. The server was stopped by its PID.
- **Injected, and labelled as such.** PR-0128's overlay was opened through the HUD port (`openMinigame`), because Tidus's gauge does not fill on a real-key route; a real Enter resolved it. PR-0191's replay started Yojimbo's gauge at 95; everything after that is the live engine, presenter and HUD.

## Notes for the merge

- `src/ui/coach/CoachMark.ts` is in batch 4's folder. Batch 4 (t1-b4a) changed `CoachLayer.ts`, `coachHold.ts`, `coach.css` and `Briefing.ts`, not this file, so there is no textual overlap.
- `FFXBattleHud.ts` gained wiring lines only (about 1,560 lines now). The logic lives in the new modules.
- Nothing under `src/scenes/**`, `BattlePresenter*.ts`, `PaintedActor.ts` or `TargetHighlight.ts` was touched.
