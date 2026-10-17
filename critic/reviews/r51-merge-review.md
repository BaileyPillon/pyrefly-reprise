# r51-rc merge review (adversarial)

**Reviewed:** branch `r51-rc` tip `e23f82f22` (equal to `origin/r51-rc`), in `M:/pyrefly-ch-angra-mainyu`, on 2026-10-17. Base: the live r50.1 `6b638df95`.
**Reviewer:** a Sonnet sub-agent of the release driver; it did not assemble the release. Nothing was deployed, no source file was edited, no ledger or record was touched.
**Game case of this document:** both games (it reviews an FFX and an FFX-2 merge); records only.

## Verdict

**No defect was found in the eight merges themselves.** Every conflict resolution was compared with both lanes' versions and nothing is lost, dropped, doubled or wrongly united. Every golden the assembler re-recorded was proved to have moved only for the cause its title names (119 of 119 FFX-2 pinned logs give their old digests back with three causes switched off). The full unit suite on the merged tree has no assertion failure (21 timeouts under load, all 11 files pass alone).

Two **low-severity polish defects** are open (none is a regression and none blocks a ship):

1. Dark Yojimbo's guide card still quotes an "In Game Description" that is ours, the very thing the polish commit removed from the Sisters' card (rule 6).
2. The greyed Mix row's reason, "needs the item picker", is cut by the row's ellipsis on both desktop and phone (the full text is in the help line; the house treatment of any long reason, the Itchy one included).

And **one owed item the CHANGELOG leaves open is now measured**: the merged tree wins 432 of 500 Chapter XVII fights (r50.1: 437; Overdrive lane alone 433; reach lane alone 428).

## 1. Method

- **Line-level merge check** (`M:/pyrefly-tmp/r51review/mergecheck.mjs`, scratch, not committed). For every file both sides of a merge touched (`git diff base p1` and `git diff base p2`, 49 file-merges over the eight merges, conflict files and auto-merged files alike) it lists: lines the lane added that are absent from the merge; lines our side added that are absent; lines only the merge has; lines more frequent in the merge than in either parent; lines a side deleted that came back. I then read every non-trivial hit and the diff of each source file against r50.1 by hand.
- **Golden ablation.** A scratch copy of the merged tree (`git archive`, no `public/art`) with the three causes the assembler named switched off, run against the four pinned-log test files as they stood at `47bce8c84` (the tree before the first FFX-2 re-record). The harness is the kill-rewards lane's own scratch test (`D:/Tools/ffx-parity/rc9/x2-rewards/zz-x2c-golden-cause.tmp.test.ts`) pointed at those old pins.
- **Whole suite**, `tsc`, `orphans`, `pose-scale-check`, a re-measurement of the four Dark paintings, a 500-seed Chapter XVII measurement and a 40-seed measurement of every FFX chapter on both trees, and headless Chromium on a Vite dev server (port 5771, stopped by PID) for the Mix row.

## 2. The eight merges, one by one

Lane tips merged equal the `origin/re-parity-rc9-*` tips (checked). Three RC9 branches (`x2-hit-reaction`, `x2-link-open`, `x2-link-open-on`) are not in the release; that is the assembler's stated scope.

| # | Merge | Conflicts (assembler) | What I compared | Result |
|---|---|---|---|---|
| 1 | `59fb35e16` overdrives + overdrive results (FFX) | `CONTRACT-CHANGES.md` | merge vs both parents for the 3 overlapping files (`CONTRACT-CHANGES.md`, `types.ts`, `ffx/execute.ts`); `1c21857e` is an ancestor of `fbb70321e` | clean: both entries present, nothing lost |
| 2 | `47bce8c84` Confusion (FFX-2) | `CONTRACT-CHANGES.md` | the 4 overlapping files incl. `engine-core.ts`, `engine.ts` | clean |
| 3 | `224e6c6ea` FFX-2 kill rewards | `CONTRACT-CHANGES.md`, `results.ts`, 4 pinned-log tests | 10 overlapping files; `results.ts` keeps both imports and the lane's `rewardsOfBattle`; goldens by ablation (section 3) | clean; goldens proved |
| 4 | `d969ef95f` Garment Grids (FFX-2) | `constants.ts`, `den-of-woe-carry.test.ts` | `constants.ts` keeps both switches (`CONFUSION_PICK`, `GRID_LAYOUTS`); den-of-woe goldens by ablation | clean; goldens proved |
| 5 | `100554411` FFX kill rewards | `CONTRACT-CHANGES.md`, `runtime.ts`, `data-ffx-command-records.test.ts`, `ffx-engine-golden.test.ts` | 11 overlapping files. Counts 494/492 (lane) and 506/504 (ours) become 510/508 = ours + the lane's four item rows; both re-baseline notes present and the two sides' digests are on disjoint keys (the lane's five Seymour keys, ours Braska link 4) | clean |
| 6 | `6142cd438` counters and reach (FFX) | `CONTRACT-CHANGES.md`, `runtime.ts`, `engine-end.ts`, `intent.ts` | 9 overlapping files. `runtime.ts` imports are the union (`RewardLedger`, `PendingCounter`, both Yojimbo/Sisters runtimes); `engine-end.ts` keeps `ATTACK_ABILITY_ID`, `aeonsDown`, `takeCounters` and drops the unused `collectReactions`; `intent.ts#cloneCtx` copies both `rewards` (`cloneLedger`) and `counters`; `index.ts` loses only `collectReactions` (as the lane's note says). `outOfMeleeReach` is gone from data (`seymour-omnis.ts` carries `battleDistance: 2` and the loot record together) | clean |
| 7 | `8e18e50e3` Mix rules (FFX-2) | `CONTRACT-CHANGES.md` | 4 overlapping files; `engine-core.ts` 396 lines; `stockShort` replaces `itemAvailable` in the held-command check and still tests plain items | clean |
| 8 | `0867d9645` stat setter (FFX-2) | `engine-core.ts`, `internal.ts`, `resolve-hp.ts`, `ffx2-atb-golden.test.ts` | the import line of `engine-core.ts` is the union minus `berserkTurnCommand` (as the lane's merge note says; no caller of it or of `runBerserkTurn` is left); `internal.ts` holds `bestChain`, `deathPattern`, `deathPending` (398 lines); `resolve-hp.ts` holds `payKill` and `leavesOnDeath` and calls `onKo` after the kill | clean; the one re-recorded hash proved by ablation |

Every conflict the lanes' own "merge notes" predicted is resolved the way the notes say (kill-rewards and stat-setter handoffs, the counters handoff item 8, the FFX rewards handoff item 5).

**Source files over 400 lines.** None is new: the eight over-limit files (`BattleScreen.ts` 991, `CutsceneScreen.ts` 452, `PartyPrepScreen.ts` 400, `PauseView.ts` 404, `common/types.ts` 3,179, `ffx/intent.ts` 745, `ffx/simulate.ts` 533, `braskas-final-aeon.ts` 506) were all over 400 in r50.1 (`types.ts` +108, `intent.ts` +5, `simulate.ts` +1, the rest unchanged). The files the merges stacked up stay under: `ffx2/engine-core.ts` 399, `ffx2/internal.ts` 398, `ffx/hp.ts` 396.

**`engine-core.ts`.** No helper was moved in the merges (the stat-setter merge message says so and the file is 399 lines). Against r50.1 its whole diff is: the import line, `itemAvailable` to `stockShort` in the held-command check, one `runDeathEntries` call at the end of the logic step and one at the end of an action, `onKo: markDeathEntry` in the resolve context, and `runBerserkTurn` to `runAutopilotTurn` (Berserk's Attack, or Confusion's pick for a Confused girl who is not Berserk). Behaviour: the autopilot path is byte-identical for Berserk; Confusion is the lane's; the death entry only answers for a script that defines `onDeath` (the Vegnagun Core's). The ablation below is the proof that nothing else moved.

## 3. Goldens: nothing re-recorded to hide a change

The FFX-2 pinned logs (`ffx2-atb-golden` 60 logs, `ffx2-menu-cancel-delay` 18, `ffx2-hit-closes-menu` 9, `chapters/den-of-woe-carry` 32; 119 in all) were re-recorded on the merged tree for three causes. On a copy of the merged tree with all three switched off:

- the victory payload put back to what the old `buildResult` made from the same board (kill rewards, the lane's own ablation);
- `GRID_LAYOUTS = false` (Garment Grids);
- both `runDeathEntries` calls removed (the Vegnagun Core's death entry);

and compared with the pins as they stood before the first re-record (`47bce8c84`), **all 119 give their old digest again**: CH4_D0 20/20, CH5_D0 20/20, CH4_D1500 10/10, CH5_D1500 10/10, hit-closes 3/3 x3, menu-cancel 3/3 x6, den-of-woe ch5/ch6/ch11/Sisters 8/8 each (82 s). So the Mix lane, the Confusion lane, the greyed Mix row and the merge repairs moved no log; the Chapter XI seeds 1, 3, 4, the Sisters' seeds 2, 4, 5 and `CH5_D1500` seed 8 are the grids and the death entry, as written. The FFX golden (`ffx-engine-golden`): the two lanes re-baselined disjoint keys (five Seymour keys by the rewards lane, Braska's link 4 by the Overdrive lane) and all 18 digests hold on the merged tree (the file passes in the full run).

Also checked: the **XE6 pin** the stat-setter merge changed (it asserted "the engine has no Mix"; it now asserts the two Mix rows exist with 15 counts and the item row keeps 20). That is a stricter statement, not a loosened one, and its own title said it would move.
The loot tests that now name the Dark Aeons (`parity-ffx-loot-data`, `parity-ffx-engine-loot-battles`) exempt exactly the five ids `dark-cindy`, `dark-sandy`, `dark-mindy`, `dark-yojimbo`, `dark-daigoro`, and `parity-ffx-loot-data` pins that none of the five carries a `loot` record and every other enemy does. The Evrae gaze-class fixture rows (0x2046, 0x2047, 0x2048, 0x2052, class 0) equal the game's command table in `tests/fixtures/parity/ffx/command_records.json` (formula byte 0 for ids 8262 to 8264 and 8274).

## 4. The Dark Aeon registration (FFX, Chapter XXVII)

- **Forced-action rows.** The five rows added to `ffx/kernel/forced-action-table.ts` (word 0, none) match `research/re-ffx-dark-aeons.md` section 1.2 ("Forced action (+0x70) none" for m340 to m343 and the dog m116), the ids match `data/ffx/mirror-aeons-ids.ts`, and the four Dark rows are immune to Confuse, Berserk and Provoke (255), so the row is inert there; the dog is untargetable. No other consumer of the table exists (`target-world.ts#defaultAttackOf`, `counter-chain.ts`).
- **Pose registration.** `node tools/pose-scale-check.mjs` PASS (the four subjects listed, "4 of 5 stances registered", the KO painting has none like every foe's). I re-measured the four with `measure.py measure <subject>` (ComfyUI's embedded Python, output to scratch, nothing written): every stance x equals the table to within a pixel (dark-yojimbo idle 538 / 537.5, attack 402 / 401.5, cast 242, hurt 539; dark-cindy 163, 408, 216, 116; dark-sandy 168, 222, 154, 92; dark-mindy 95, 230, 95, 168). `tests/unit/engine/pose-scale-art.test.ts` passes.
- **No art changed.** `public/art` is a junction to `D:/pyrefly-art-r50` (5,402 files): none has a write or creation time after the r50.1 commit (2026-10-16 18:53). The 40 files of the four `dark-*` folders were last written on 2026-10-15 (23:34, the idles at 14:03) and each has a link count of 1 by `fsutil hardlink list`; the five I sampled have a change time equal to their write time, which a hard link added or removed since would have moved. Git cannot show it (`public/art` is ignored); this is the evidence.
- **Their loot.** The Dark Aeons ship without a loot record, so they take the lane's legacy path (`adapt/loot.ts#lootOfLegacy`): slot 1 always drops (chance byte 255), Dark Matter, with the Master Sphere as the rare entry, one time in eight (0x20 of 256), the overkill list at double quantity, gil 0. That equals the record the research note's section 1.3 lists byte for byte, and the roll draws the same streams in the same order, so a record (the lane's saved patch) would change nothing but the data's provenance. Not a defect; a record is a later data task.

## 5. The polish texts (FFX, Chapter XXVII)

- **Location** "Mushroom Rock Road and the Cavern" is the old string shortened (33 letters, the strip holds about 37); the pause tab keeps the full name through `chapter-meta-mirror-aeons.ts`, and `chapterPanel.ts` uses `sceneKey` only as a backdrop path (so `backdropFileOf` there cannot change a plate lookup).
- **BOSS row** "Dark Sandy and Dark Mindy, then Dark Yojimbo" matches the chapter (`chapter-mirror-aeons.ts` header: Act I the pair `kino01_72`, Act II Dark Yojimbo `nagi05_71`).
- **Backdrop fix** (`artNamespace.ts#SCENE_BACKDROP_FILE`): every screen that built `art/backdrops/<sceneKey>.png` now goes through `backdropFileOf`; any scene key not in the record is returned unchanged, so no other chapter's path moves.
- **Sisters' "In Game Description" removed:** right, and the rest of the Sisters' card is text I could match to `re-ffx-dark-aeons.md` (HP, "no element favoured", Sensor immunity, steals, drops).
- **Open:** see defect 1 below (the Dark Yojimbo card).

## 6. The greyed Mix row (FFX-2, Chapter XIII Rikku)

Headless Chromium, `PYREFLY_BROWSER=gpu`, dev server on 5771 (PID 25104, stopped), Chapter XIII, Rikku (Alchemist) menu, frames in `critic/reviews/r51-merge-review/proof/`:

- Desktop 1600x900: the row is dimmed and reads "MIX  NEEDS THE ITE…" (the reason is cut by the ellipsis: reason box 71 px for 118 px of text); selecting it, the help line at the top reads in full "MIX needs the item picker — Timed input". Enter and a mouse click on the row submit nothing (the menu stays open, the log gains no command).
- Phone 390x844 (touch): the row is dimmed, the name on one line and the reason under it, "NEEDS THE ITEM …" (153 px box for 198 px of text); the help line at the bottom reads in full "RIKKU · needs the item picker — Timed input". A tap submits nothing.
- The other rows (Attack, Item, Change) are unchanged. A Confused Alchemist never picks Mix (4,000 Confusion picks for Rikku in Chapter XIII: Attack and eight items only), so the Confusion lane's pick and the greyed row do not meet.

It reads right in the sense that matters (a greyed row, no way to pick it, the whole reason one glance away), but the truncated cut is open as defect 2.

## 7. Checks run

| Check | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| Full `npx vitest run` (1,343 files, TEMP and TMP on `M:/pyrefly-tmp`, run while I also ran browsers and measurements) | **21,293 passed, 21 failed, 86 skipped, 1 todo.** All 21 are timeouts (19 at 15 s, 2 at 60 s) in 11 files: `advisor-floor`, `advisor-menu`, `advisor-noop-guard`, `advisor-note`, `art-sidecar-fields`, `audio-manifest-io`, `strategy-chapter2`, `ui-ffx2-atbmode`, `chapters/biran-yenke-bench`, `chapters/sin-fins-core-bench`, `engine/pose-scale-art`. Re-run alone with a 600 s timeout: **11 of 11 files pass (167 tests, 2 skipped)**. No assertion failure anywhere. |
| `node tools/orphans.mjs` | 26 orphans (r50.1: 28). The two gone, `ffx/kernel/drops.ts` and `gear-drop.ts`, are wired now (the rewards lane); the other 26 are the same files as in r50.1. 34 new modules, all reachable. |
| `node tools/pose-scale-check.mjs` | PASS |
| Chapter XVII, 500 seeds, `ffx-parity-measure.test.ts`, the shipped intended line | r50.1: **437** wins (63 losses, 296.4 party turns); merged tree: **432** wins (68 losses, 295.5 turns, 3 KOs). The lanes alone were 433 (Overdrives) and 428 (reach). Inside the noise of 500 fights; no collapse from the two lanes meeting. |
| All FFX chapters, 40 seeds, both trees | wins, party turns and party KOs are identical on all twelve chapters except Chapter XVII (36 to 35 of 40, five seeds flip). Mirror Aeons 24 of 40 on both. |
| Not run | the production build (a plain Vite build would copy the 5,402-file art junction into `dist`), the focused review (the continuity harness on Chapter XXVII's paintings, a picture of the greyed Mix row from the real flow), the live verification. |

## 8. Open defects, most severe first

Neither blocks a ship; both are polish.

1. **Dark Yojimbo's "In Game Description" is ours, not the game's.** `src/data/guides/docs/mirror-aeons.ts:68-72` still carries `label: 'In Game Description'` with "Yojimbo in the wrong colours, called up by a Yevon soldier in the cavern where Yuna found him." No file or guide in hand gives it (`research/ffx-mirror-aeons.md` has only the Sisters' "called up by disguised Yevon acolytes", and the Dark Yojimbo page of the guides is not quoted there). The polish commit `0069cd648` removed the Sisters' line for exactly this reason (rule 6, "a sentence of ours that the game never printed"); the same reason holds here, so the card is now inconsistent with its own commit and with the CHANGELOG's "no quote". Fix: remove the field (and the comment at line 20 can say "neither card"), or cite a source.
2. **The greyed Mix row's reason is cut off.** `src/battle/ffx2/constants.ts:277` (`MIX_PICKER_REASON = 'needs the item picker'`, used at `src/battle/ffx2/menu.ts:56`): 21 letters do not fit the row's reason box on desktop ("NEEDS THE ITE…", 71 of 118 px) or on the phone ("NEEDS THE ITEM …", 153 of 198 px). This is the house behaviour for a long reason (the Itchy one is cut the same way and `CommandMenuReason.ts` only moves a reason under the name when under a fifth of it shows), and the whole text is in the help line on both layouts, so it is polish; but a player who reads only the row sees "needs the item", which reads as a missing item. A shorter reason that fits (about 14 letters) would keep the row honest; the Mix chapter test pins the current words (`tests/unit/parity-ffx2-mix-chapter.test.ts`), so it moves with them.

## 9. Notes for the release driver (not defects)

- The CHANGELOG's r51 counters bullet says the merged Chapter XVII figure "is measured in this release's check and reported with it": the figure is **432 of 500** (r50.1 437), section 7.
- The CHANGELOG's "27 failures were 15-second timeouts" matches in kind; this run had 21 in 11 files, all passing alone.
- A saved patch for the Dark Aeons' five loot records exists in the rewards lane's handoff (item 5); adding them would change data provenance only (section 4).
- The Mix row's help line appends the effect text ("— Timed input") after the reason; harmless, and the same join every greyed row makes.
