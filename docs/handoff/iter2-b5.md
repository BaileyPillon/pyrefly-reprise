# iter2-b5: FFX HUD, summons, targets and the flow tail (iteration 2, batch 5)

Branch `iter2-b5`, lighter worktree `D:/pyrefly-iter2-b5` (sparse: no `docs/screenshots/` checkout;
frames added with `git add --sparse`), from main `5d604e9a`. Not merged, not deployed. Dev server on
port 6720 (a scratch vite config, `.b5-vite-tmp.config.mjs`), stopped by PID at the end.

**Words behind it.** Bailey, 2026-09-26 ~15:00 EDT: "Focus on meeting all score thresholds
iteratively. Godspeed. I have plenty of usage."; later "full speed ahead please. godspeed." and
"i'll go with all of your recommends" (D-232..D-234). On 2026-09-27 ~11:00 EDT: "I'll go with all of
your recommendations" (recorded as D-249 and D-250: plan section 8 Q5 to Q12 and Q16 accepted as
recommended). The batch is `docs/plans/iteration-2-batches.md` §4 B5, plus FOC23-01 from
`critic/reviews/ff3884fb-focused.json`.

The branch ran in two sessions. The first built the first ten commits and was cut off before its
handoff; the second (this file) verified them, built the rest, and wrote this.

**Review class.** Presenter, HUD and the results screen: focused before deploy, deep after (plan §4).
No save-data file. No contract file (`docs/CONTRACTS.md`) changed.

## Per item

Frames: `docs/screenshots/iter2-b5/` (real keys unless the name says otherwise). Scratch drivers:
`tools/zz-b5-*.tmp.mjs` (untracked). Raw runs: `D:/Tools/pyrefly-scratch/iter2-b5/`.

| Item | Game | Commit(s) | What | Acceptance, measured |
|---|---|---|---|---|
| PR-0170 lone-target step | FFX | `3b3a8cff` | The FFX menu maps the resolver's `auto` to a one-candidate target step (`loneTarget.ts`), except self and random rows (research/observed-ffx-steam-2026-09-26.md 2.1). FFX-2 half unsourced, untouched. | II and XII: Enter on Attack shows the bracket on the boss, Escape returns to the menu with no action. VIII: Rikku's one-item Special group opens its step. **Pass.** |
| PR-0180 enemy ability name | FFX | `ede4aa27` | `actionBanner.ts`: a non-attack enemy ability's name centred in the top HELP bar for the action's span; a plain Attack shows nothing. Party half unsourced, not built. | I, VIII, X, XII: shown within 2 to 27 ms of action-start, hidden 4 to 18 ms after its end; Evrae's Attack shows nothing. **Pass.** |
| D-221 "Immune to sensors." | FFX | `d069b053` | `sensorImmune.ts`: name plus the retail line, no HP, bar or chips; FFX-2 Trema untouched. | Unit test. **Pass.** |
| PR-0181 summon staging | FFX | `ddc1649d` | `SummonStaging.ts`: the party fades out with the aeon's arrival, is held off against the target x-ray, comes back on dismiss/KO/Banish; `fieldRows.ts` shows the aeon's row alone. | X (Bahamut): aeon alpha 1, unoccluded 1.0, party alpha 0, row "Bahamut"; Dismiss brings all three back at 1. XIV (Valefor): the same, Yuna back at 1. **Ch I has no Summon row**, so it is not applicable. **Pass on X and XIV.** The procedural floor glyph ring and Bahamut's rim lift are **not built** (see Open). |
| PR-0031 + PR-0178 target cues | ring/dim both; plate FFX | `7a9c0bda`, `80d7fa0d` | Probe first: the marks were live. Party-wide casts wear the ally accent; FFX brackets clipped behind each command row (`bracketClip.ts`). **The TARGET plate is ON** (D-249, Q5), scaled with the letterbox, stepped off any panel in its band (`plateLeft`), off on the phone. A station-lifted Yu Pagoda now wears the upright halo, not a floor pool hidden behind the party (`selectAccentStyle.ts`). | III 1600/2000/2560 Attack on Pagoda A: halo legible, the rest dimmed 0.26, plate "TARGET Yu Pagoda" clear of the advisor card. III Hastega 1600/2560: ally accent, plate "Tidus · Yuna · Auron". X Bahamut Impulse 1600/2560: gold rings under Natus and Mortibody, ALL ENEMIES chip, plate names both. II Attack 1600/2560. **Pass.** |
| PR-0157 FFX half | FFX | `aaff96bb` | `actingFade.ts`: on B2's acting signal the guide, advisor, intent card, turn column, enemy plate and Omnis read-out drop to 0.16; rows, numerals, help bar and banners stay. `CoachLayer.withCoach` never forwarded `setActing` (fixed, both games). | I at 1600 and 2000: no unfaded card over a standing figure's upper two thirds. **XII: partial** — the party status rows, which stay up by design (retail keeps them), meet the party's upper third in about half the acting samples of Omnis's action camera; the faded cards also still intersect at 0.16. Disclosed, not changed (see Open). |
| PR-0146 FFX half | FFX | `c09c2265` | The FFX HUD reuses FFX-2's `IntentOpeningHold`: the intent chip waits until the opening hands the HUD back or the first menu opens. | I at 1600: before, the E ENEMY MOVE chip showed at 5.2 s, before the caption at 8.3 s; after, caption 4.97 s, first panel 7.84 s, nothing early. **Pass.** |
| PR-0193 FFX half | FFX | `aaff96bb` | The ALL label scales with the letterbox (14 px floor) and steps off the panels and the intent card (`groupLabelFit.ts`). | III Hastega: 14 px at 1280x720, 22.4 px at 2560x1440, no overlap. **Pass.** |
| PR-0019 / PR-0018 FFX halves | FFX | none needed | Re-measured first, as the plan asks. | I at 1280x720 and 3840x2160: 72 row states each, every label 4.5:1 or better, help `scrollWidth <= clientWidth + 1` with the chip in every state, the chip never on the slab, fragments joined with "·" and ". ". III at 1280 and 3840: TALK selected 7.51:1 (round 13's 1.74:1 is gone), disabled FLEE 10.05:1. **Pass, no change.** |
| PR-0206 | FFX | `14f51843` (test only) | Probe on the round-13 board route with the PR-0202 pinned seed (`route.mjs seymour-flux lose --size=2000x1012 --seed=1`). | First menu: card up, 320x275 px, 0 px² over the rows, no face under it; N hides it and N shows it. **Does not reproduce**, so no code; a 2000x1012 case pins the solver on the live board (`ui-ffx-hud-safe-zones-2000.test.ts`, its own file because the old one is 1,071 lines). It did not fail first (disclosed). No "no room" line needed. |
| PR-0186 | FFX (III) | `6e73684a`, `c221781f` | Bailey's pick (a), D-249 Q7: in the Yu Pagoda fight the Sensor card opens folded while aiming, and its chip rises above every enemy box it meets (`sensorAimFold.ts`). Other chapters and the phone unchanged. | III, aiming at Pagoda A, the Final Aeon and Pagoda B: the chip meets no enemy box at 1600x900 and 2000x1012 (and none at 2560 on Pagoda A). **Pass.** |
| PR-0128 ticks | FFX | none needed | Bailey's answer, D-249 Q8: keep MISS / HIT. `TidusTiming.ts` already prints MISS and HIT. | **As picked.** The tile's note that its ×2/×4/×6 labels are unsourced goes in `docs/target/targets.json` (the board's owner; not edited here). |
| PR-0215 | FFX rule; shared screen | `fd19557b` | Bailey's pick B, D-249 Q6. Restores db0bd923's routing and its test: an `'escape'` goes through the defeat panel with RETRY. The caption ends **WITHDREW**; the engine's own line "The battle cannot be won from here." sits where a victory card puts its quip, read from the engine's log (`withdrawal.ts`), so a withdrawal without a stalemate gets no line. On the phone the ending takes the next caption column whole. | III, the stalemate watch debug-set as t1-b4b did, then Enter until the watch ends the fight: the card reads "DREAM'S END — INSIDE SIN · WITHDREW", "Defeat", the line; RETRY returns to the battle's command menu. 1600x900 and 390x844 touch. **Pass.** |
| PR-0033 + PR-0007 | both | none | Needs the OR-4 pick (Defeat cause line), which has no decision. | **Open.** |
| A-2 call site | both | `6c0d70c0` | `runChapter` calls `playBattleEntry` with `entrySituationFor(...)`. Vegnagun implosion stays OFF (D-255 open). | Live, per rAF from the chapter start to the first menu: I with scenes → `pf-entry--blur`; I skipped → `pf-entry--shatter pf-entry--ffx`; IV skipped → `pf-entry--shatter pf-entry--ffx2`; no swirl anywhere. Retry is unit-tested. Orphans 24. **Pass.** |
| A-4 + D-226 victoryPose | both | `7a7b7170` | `chapter-meta` `victoryPose`: II, IV, V and XIII (D-226, our estimate) read `hold`; BattleScreen passes it to B2's port. | Debug auto-play (labelled; the intended tactics at fast speed), every figure's pose read for 1.2 s from the victory beat: II, IV, V and XIII hold (idle/cast/ko, never `victory`); I (seed 2; seed 1's auto-play lost) and IX pose. Frames `a4-*-victory-beat-debug-autoplay.jpg`. **Pass.** |
| PR-0138 | FFX-2 | `fef79d78` | A checkpoint keeps the spoils won before it; the retry's ledger starts from them. | Unit test (Chapter XI lose at Anima, retry, win: 23,000 EXP / 7,000 gil / 54 AP). A real-key Chapter V win after a Shuyin retry was **not run** (too long for this session's browser budget); see Open. |
| FOC23-01 | FFX (shared fit plumbing) | `c85cfc22` | Measured: the fit's quad is already the painting's tight alpha box (14..736 of 750 px), 7 px from the figure; what cut Flux was the phone HUD's top band over his head. `fitRigToSlice` gains a top share and raises the rig clear of it. | 390x844 first menu, every FFX chapter: every figure whole; Ch I: Flux's head and body inside the field (`foc23-01-ch1-390x844-first-menu-after.jpg`). **Pass.** |

## Not built, and why

- **PR-0033 + PR-0007** (the Defeat card names the finishing move): OR-4 has no pick.
- **PR-0181's procedural gold floor ring and Bahamut's rim lift**: new looks; OR-10 (per-aeon glyphs,
  with option C the procedural ring) is unpicked, and the valefor-overdrive plan (B.2) asks for
  Bailey's yes on the aeon's scale (Bahamut is drawn at about party height, 230x216 px at 1600 in X).
- **The Valefor-from-Overdrive picker (S1)** in `docs/plans/valefor-overdrive-bug-2026-09-27.md` fix A:
  it touches `src/battle/ffx/overdrive.ts` and `BattlePresenterUtil.ts`, outside this brief; the plan
  names "iter2-b5 or a small FFX fix batch". Not taken here, so it needs an owner. Once it lands, the
  plan asks for a real-keys Grand Summon check in IX on top of this branch's staging.
- **PR-0180's party half**: unsourced (L-4 / Steam part 2).
- **PR-0157 in XII**: the rows stay up by design; if the acceptance must hold for them too, that is a
  question for Bailey (retail keeps the party's rows on screen during enemy actions).
- **PR-0138, the real-key Chapter V check** after a Shuyin retry: owed to the focused review.

## Shared-file notes (for the driver at merge)

- **`src/ui/coach/CoachLayer.ts`** (B7's tail file) gained one forwarding method, `setActing`: the
  presenter talks to the `withCoach` wrapper, which dropped B2's acting signal, so no HUD ever heard it.
  B6's A-15 needs the same line; if B6 also adds it, keep one. 397 lines.
- **`src/engine/PaintedActor.ts`** (not in B5's list; wave 1's B3 owned it and has merged): +5 lines,
  the accent style call (`selectAccentStyle.ts`). One field renderer: both games.
- **`tests/unit/results-fit.test.ts`** shows as modified in this worktree from a line-ending rewrite
  only; nothing to commit.
- Additive optional members: `MomentsPort.phoneTop?()`, a 4th `top?` argument on
  `CameraPort.fitSlice` / `BattleCamera.fitSlice` / `TargetFrameHold.fitSlice` / `FrameFit.fitRigToSlice`,
  `ChainCheckpoint.won?`, `EncounterChainOptions.priorWon?` and `onLink`'s `checkpoint`,
  `ChapterMeta.victoryPose?`, `TargetCursor.setAfterLayout`, `TelegraphBanner.hide`,
  `BattleScreenResult.withdrawLine?`, the flow's and `ResultsScreen`'s `withdrawLine?`,
  `ResultsPageModel.note?`, `SensorPanel.focus(target, folded?)`, `resultsCaptionHtml(..., withdrew?)`.
- Files already over 400 lines that grew by call sites only (logic in new modules):
  `FFXBattleHud.ts` 1,577 to 1,640, `TargetCursor.ts` 502 to 510, `BattleScreen.ts` 935 to 943,
  `BattleScreenFlow.ts` 512 to 519, `BattlePresenterStage.ts` 839 to 843, `BattlePresenterEvents.ts`
  434 to 435, `BattlePresenterPorts.ts` 463 to 465, `CommandMenu.ts` 789 to 790, `PaintedActor.ts`
  1,981 to 1,986. `chapter-meta.ts` is 399.
- New modules: `ui/ffx/` `loneTarget`, `sensorImmune`, `actionBanner`, `actingFade`, `groupLabelFit`,
  `bracketClip`, `targetPlateFfx`, `fieldRows`, `sensorAimFold`; `engine/` `SummonStaging`,
  `selectAccentStyle`; `app/screens/` `entrySituation`, `withdrawal`.
- `80d7fa0d` alone does not type-check (it imports `sensorAimFold.ts`, which landed in the next commit,
  `6e73684a`); every later commit does. Merge the branch whole.

## Checks

- `npx tsc --noEmit`: clean.
- Full `vitest run --testTimeout=60000`: exit 0, 569 files passed and 5 skipped, 9,264 tests passed,
  37 skipped, 1 todo.
- `node tools/orphans.mjs`: 24 (main's number; A-2's five modules are wired).
- `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 0 mismatched, 0 missing (267 ok).
- `git merge-tree` against main `36f506ba`: clean.
- Browser checks: headless Chromium (`PYREFLY_BROWSER=gpu`), one at a time, on the scratch dev server at
  6720 (stopped by PID at the end), real keys unless labelled; the A-4 check is debug auto-play and
  PR-0215 debug-sets the engine's stalemate watch before real keys, both labelled.
