# r29-input: paper preflight (AGENTS.md rule 15)

`node tools/critic-plan.mjs --paths src/ui/ffx2/CommandMenu.ts,src/ui/ffx/rawInput.ts`
classes every path this batch touches as **deep**, and the reason it gives is the
build's own counter ("27 substantial checkpoints since the last deep review"),
not these files. Honest note on timing: this page was written after the first two
fixes (PR-0219, PR-0232) were built and measured, and before the other five; the
risks below were checked for all seven before commit.

| Issue | Game case | Files | What could go wrong | Guard |
|---|---|---|---|---|
| PR-0219 pad drives the FFX-2 menu | FFX-2 only | `ui/ffx2/CommandMenu.ts`, `ui/ffx/rawInput.ts` | Keyboard map drifting (WASD would start moving the X-2 cursor); a pad press during the pause taking a turn; a held A at menu open | `RawInputWatcher` gets an additive `keyboard: false` option, so the X-2 keys stay exactly as they were; the watcher honours `setRawInputSuspended` like FFX's; the held-at-open behaviour is the same as FFX's watcher (unchanged, not new). Test: `ffx2-command-menu-gamepad.test.ts` |
| PR-0232 taps on overlapping reticles | both (shared cursor) | `ui/ffx/TargetCursor.ts`, new `ui/ffx/targetHitPick.ts`, `ui/coach/coach-taps.css` | A click on a lone target changing meaning; the bracket z-order rule (`ui-target-css.test.ts` forbids child z-index) | Resolution only among brackets containing the point, falling back to the clicked element; order by DOM position, no z-index. Tests: `target-hit-pick.test.ts`, the four existing target suites |
| PR-0236 Orders with nothing to choose | FFX only (Ch VIII) | `ui/ffx/AirshipOrders.ts`, `ffx-hud.css` | Disabling Orders when one order is still legal; the advisor card's "in Orders" chip | One rule, `engine/tactics/airship-orders.ts`, shared with the widget; `advisor-menu.test.ts` still green |
| PR-0233 plate over the turn list | FFX only | new `ui/ffx/sensorCtbClear.ts`, one line in `FFXBattleHud.ts`, `ffx-hud.css` | Fighting the target-cursor steer (`--ffx-sensor-dx`); phones | Its own custom property; measured with its own shift removed so it cannot creep; no-op on phones |
| PR-0237 coach over faces | both | new `ui/coach/coachActorAvoid.ts`, `CoachLayer.ts` (398 lines) | Hopping every frame; landing on a panel to get off a fighter; phone layout | Moves only when strictly better; panels are hard; desktop only |
| PR-0238 PAUSE chip | both (FF7 hides it) | new `ui/common/pause-chip.css`, one import in `PauseScreen.ts` | A new design (rule 9) | The rule the pause remake dropped (8cf17246f), restored; only 14 px and full paper ink changed |
| FOC28-P02 Grand Summon subtitle | FFX only | `overdrive-minigames.css` | Desktop head changing | Phone selector only; the x2 ink colour on the selected row is both layouts but FFX-only markup |

No new screen, setting row or gameplay; no boss number or game datum touched.
