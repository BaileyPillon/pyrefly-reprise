# iter2-b2: camera, framing, transitions and scenes (iteration 2, batch 2)

Branch `iter2-b2`, lighter worktree `D:/pyrefly-iter2-b2` (sparse: no `docs/screenshots/` checkout;
frames added with `git add --sparse`), from main `1a43fd7b`. Not merged, not deployed. Dev server on
port 6500 (stopped by PID at the end).

**Words behind it.** Bailey, 2026-09-26 ~15:00 EDT: "Focus on meeting all score thresholds
iteratively. Godspeed. I have plenty of usage."; later "full speed ahead please. godspeed." The batch is
`docs/plans/iteration-2-batches.md` §3 B2, with A-1 to A-13 from
`docs/plans/presentation-program-2026-09-26.md`.

**Review class.** Presenter, camera and entry transitions: focused before deploy, deep after (plan §3).
No save-data file is touched. None of the five contract files (`docs/CONTRACTS.md`) changed.

## Per item

| Item | Game | State | Evidence (`docs/screenshots/iter2-b2/`) |
|---|---|---|---|
| Part 1: acting-state signal | both | **built** (d23ed82a). `HudPort.setActing?(ActingSignal)`: `action-start` (actor, targets), `action-end`, `cancel` (burst stopped inside the action, battle ended inside it, abort, a new turn or action under it). No HUD implements it yet: no visible change. B5 (PR-0157 FFX fade) and B6 (A-15 FFX-2 fade) plug in. | `tests/unit/presenter-acting-signal.test.ts` |
| Part 1: D-224 phase port | both | **not added, on purpose.** B3 built the port and its canon triggers already (iter2-b3 9a5db52d: `LightingPort`, optional `BattleStage.lighting`, `phaseCanon.ts`, one `cuePhase` line in `playEvent`); an absent port is the no-op default. A second port would only conflict. `git merge-tree` iter2-b2 x iter2-b3: clean at every commit. | |
| Part 1: `victoryPose` port | both | **built** (5fb92365). `PresenterDeps.victoryPose?: 'pose' \| 'hold'`, `victoryPoseOf()` defaults to `'pose'`. | `presenter-victory-pose-port.test.ts` |
| Part 1: `BackdropPalette.ground` | both | **built** (99a2fcb2). `paletteGround(scene.backdrop.palette)` gives hex and Rec. 709 luma, for B3's `ContactShadow` (`groundLuma`). | `backdrop-palette-ground.test.ts` |
| A-4 presenter side | FFX II; FFX-2 IV, V, XIII | **built** (32358721): on `'hold'` no victory pose, no fanfare cue, the camera still settles on the victory rig. **Open for B5:** the per-chapter values (chapter-meta) and the one `BattleScreen` line that passes `victoryPose`; the real-key last-blow captures in II, IV, V wait for that line. | `presenter-victory-hold.test.ts` |
| A-13 camera roll | both | **built** (0dd74983, evidence 5cf3c24c). The -4 degree roll moved from the swing to the attack's first hit, scaled by speed, none at skip or under reduce-motion (`MomentsPort.reduceMotion()`, answered by the overlay from Settings or the OS), never awaited. Ch I real keys: roll 0 at the swing, peak -4.00 at the hit, level by the end; the action took 807 ms with the roll, 838 ms without (0 s added). | `a13-ch1-attack-roll-on-first-hit-1600-real-keys.jpg`, `a13-roll-report.json` |
| A-11 party inside the frame | both | **built** (8ee27128). Every action, Overdrive, telegraph, reveal and form-change push is measured against its rig (`FrameFit.ts`, the painted quads) and stops short of taking a standing party figure below 85% (with a 3% sway margin). Macalania's `party` rig re-aimed onto layout B (it framed the pre-B arc: Rikku wholly out). Sweep over idle, action, party and victory, at rest and under the fitted 0.06 and 0.14 pushes, 1280x720, 1600x900, 2000x1012: worst party figure 0.861 across 15 chapters. **Not judged, reported:** FFX's hard cut to the target (the `enemy` rig, canon grammar, leaves the party partly out in most FFX chapters) and the two authored boss-angle rigs (`yunalesca`, `bahamut`) that crowd the party on purpose. The Ch I idle rig needed no re-aim (0.92+ at all sizes). | `a11-party-in-frame-report.json` |
| A-1 FFX-2 wait camera | FFX-2 | **built** (8ee27128). For an engine with an ATB clock, a shot keeps the enemy in play at 75% and every standing girl at 90%, else falls back through `action` to `idle`; its push is fitted with the enemy included. Real keys, seed 1, ten wait frames per chapter (IV, V, VI, XI, XIII, XV): 2000x1012 59 of 59 pass; 1600x900 56 of 58, the two misses Ch V's colossus tail at 0.68 to 0.74 as it recoils on the master (the D-228 staging fills the frame with the part). New spec `tests/e2e/ffx2-wait-framing.spec.ts` (report mode; not run here: it wants a production build). | `a1-ffx2-wait-frames-{1600x900,2000x1012}.jpg`, `a1-ffx2-wait-report.json` |
| A-10 Dream's End framing | FFX (III) | **no change needed, checked.** At the first menu (real keys and the debug entry, HUD off) the sun sits at about 13-14% of the frame height and the mound's crest at about 29-30%, both in the upper third, crest behind BFA's left pagoda, at 1600x900 and 2000x1012. The pres-audit frame that cut the sun was the `party` rig (a push on the party), not the master. Approved hashes untouched (no file changed). | `a10-dreams-end-tile-vs-first-menu.jpg` |
| A-12 phone framing + Ch I and IV impact defects | both | **built** (e31a7e34). On an upright phone the master is refitted at each battle start until the party and every enemy fit one phone slice (option A of PR-0201, applied to every chapter; a part wider than the slice, Vegnagun's tail, is left out rather than shrinking everyone), and action/impact/telegraph/Overdrive shots stay on it with no push. First menu at 390x844, all 15 chapters: every party quad whole, the boss 0.96+ in the field (Ch V tail 0.74, colossus part). Fira on Bahamut (Ch IV; Yuna changed to Black Mage and cast by keys): Bahamut 1.0 through the impact. Ch I: Attack on Seymour Flux 1.0 (Fire needs Lulu fielded, which the chapter does not start with). **Disclosed:** during play the edge girl dips to 0.8-0.9 while she recoils or the phone slide glides; Ch IX Lulu to 0.51 during a slide (counts per chapter in the report). Mindy (XI) waits for §8 Q12. | `a12-phone-390x844-first-menu-and-mid-fight.jpg`, `a12-phone-ch4-fira-on-bahamut-real-keys-impact.jpg`, `a12-phone-ch1-attack-on-seymour-real-keys-impact.jpg`, `a12-phone-report.json` |
| PR-0185 remainder | FFX (IX) | **built** (5be4038c). Between square and 16:9 the `enemy` rig keeps its bottom edge on the 16:9 ray (`holdBottom`: the fov opens upward only). With t1-b2b's enemy rig forced in (it is not on main yet): Kimahri 21% and Yuna 5% in frame before, 0% after, at 1280x960. **Disclosed:** tween frames into and out of the shot are not held. | `pr0185-ch9-enemy-rig-1280x960-before-after.jpg` |
| PR-0061(a) opening waits | both | **built** (9cab60da). Before the first menu a callout of lines runs under the fight (`OpeningCallouts.ts`) and a sensor read stays up on its banner without holding; beats with camera/move/fx/wait are still held; two beats never overlap; the end waits for a callout on screen. CAL-005 form, seed 1, 1600x900: with Enter presses 1.7 to 4.5 s (VI 4.5, IX 4.2, XIII 4.1); passive 6.7 to 7.4 s in I, II, III, V, VII, VIII, X, XII. IV, VI, IX, XI, XIII, XIV, XV are 7.7 to 9.8 s passive because an enemy acts first (the fight, kind 1 in the method check): reported, not built. Approved card and sweep untouched (D-206). | `pr0061a-first-menu-timings.json` |
| A-3 no cold black | both | **built** (56fbbed5). The swirl gains `whileCovered`; after 400 ms on the ink the approved battle-start card goes up with a gold hairline and hands over to the battle's own card. The preload opens the fight first (card info), then the backdrop, the boss's idle, other enemies, the party's idles and faces, then every other pose. Fresh profile, CDP-throttled to 16 Mbps, real keys: Ch IV card at 405 ms, 12.3 s of load under it, longest dark run 224 ms; Ch I card at 401 ms, darkest 198 ms. Time to card logged (`[entry] ...`, `performance.mark('pyrefly:entry-card')`). **For the driver (rule 9):** the hairline is a token of the card's own stripe; a crop is saved in case it is judged new. Unthrottled local loads still take about 1.1 s, so the card shows about 0.7 s earlier than before there: earlier, not longer. Board-focus preloading is B4's. | `a3-cold-entry-ch4-throttled-16mbps-1600.jpg`, `a3-loading-card-hairline-crop-1600.jpg`, `a3-loading-card-over-ink-ch4-1600.jpg`, `a3-cold-entry-*-report.json` |
| A-2 battle entry | FFX blur/shatter; FFX-2 shatter; Vegnagun implosion | **built, not wired** (01d31396), as the plan says: the call site is B5's one line (below). `entry.ts` picks per game and situation; `entryOverlay.ts` holds the outgoing frame (game canvas plus the scene's painted backdrop and pictures, never the dialogue box or HUD), swaps under it at once, runs A-3's card, and a fresh Confirm ends the leaving; FFX's shatter leaves right to left with a white flash and a black field fading up, FFX-2's bursts from the strike in pink and hard-cuts; reduced motion cuts; low effects keeps the swirl; skip spends 0 s. **The implosion is OFF** (`IMPLOSION_ENABLED = false`) until Bailey sees its first frames beside the tile. Until B5's line these five modules are orphans on purpose (`tools/orphans.mjs` 29 = main's 24 + these). Frames are FORCED stills (each player drawn at fixed times over the real frame on screen). | `a2-ffx-scene-entry-blur-ch1-1600-FORCED.jpg`, `a2-ffx-retry-or-skip-shatter-ch1-1600-FORCED.jpg`, `a2-ffx2-entry-shatter-ch4-1600-FORCED.jpg`, `a2-vegnagun-implosion-OFF-first-frames-beside-tile-FORCED.jpg`, `a2-before-swirl-ch1-1600-FORCED-slowed.jpg` (the concept's `before.png` re-shoot: copy it into the local concept folder) |
| PR-0104 FFX-2 cut-in hold | FFX-2 | **built** (5c3de74c). The next girl's first-turn cut-in waits while another girl's command charges or an action is on screen, then 300 ms for the effect, then plays; dropped if her menu was answered, shown anyway after 5 s. Never awaited: the menu is not later. Real keys, Wait, Shell: XI tag 4.02 s then cut-in 4.40 s; IV tag 3.25 s then cut-in 3.55 s; next menu 1.55 and 1.65 s (as before). | `pr0104-ch4-shell-then-cutin-1600-real-keys.jpg`, `pr0104-shell-then-cutin-report.jsonl` |
| PR-0072 Vegnagun contact shadow | FFX-2 (V) | **built** (4eb9d1df). A scene-owned pool on the plain along the camera's ray through the staged part's feet (`farplane-colossus-shadow.ts`), sized for the distance; the part's own blob hidden; none under the floating head. The retired `BlobShadow.ts` is untouched. First menu and target selection (real keys) at 1600x900: the pool shows under the tail's base; the girls stand 15.7+ units in front of the tail, so no billboard intersects it in depth. Links 2 to 4 not captured. | `pr0072-ch5-contact-shadow-1600.jpg`, `pr0072-ch5-report.json` |
| D-225 pyreflies | | skipped: built in B3 (043012a7). | |
| A-7 floor and sky | both | **not built** (droppable, last in the plan; out of time). | |

## B5's one line for A-2 (`src/app/screens/BattleScreenFlow.ts`, in `runChapter`)

Replace `await playBattleSwirl(this.app.uiRoot, { instant: ..., whileCovered: ..., onCover: ... })` with:

```ts
await playBattleEntry(this.app.uiRoot, {
  game: chapter.game,
  situation: attempt > 0 ? 'retry' : opts.skipCutscenes ? 'skipped' : 'scene',
  instant: opts.speed === 'skip',
  whileCovered: entryCardWait(this.app.uiRoot, chapter),
  onCover: () => { swapped = this.show(battle); return swapped.then(() => undefined); },
});
```

(`import { playBattleEntry } from '../../ui/common/transitions/entry.ts'`). A scene the player skipped
with Enter reads as `'scene'` today (the flow does not know); if B5 can tell, pass `'skipped'` there.
The Vegnagun part seams (`implosion: true`) wait for Bailey's yes.

## Shared-file notes (for the driver at merge)

No contract file changed. Additive optional members: `HudPort.setActing?` and `ActingSignal`
(`HudPort.ts`); `CameraPort.frame?`, `CameraPort.fitSlice?`, `MomentsPort.reduceMotion?`,
`MomentsPort.phoneSlice?`, `PresenterDeps.victoryPose?` (`BattlePresenterPorts.ts`); `SwirlOptions.whileCovered`.
Files already over 400 lines that grew by call sites only (the logic is in new modules):
`BattlePresenter.ts` 653 to 687, `BattleMoments.ts` 512 to 552, `Backdrop.ts` 479 to 495,
`BattlePresenterEvents.ts` 426 to 432, `BattlePresenterPorts.ts` 429 to 449. `BattleCamera.ts` stays at
396 (two getters compressed). New modules: `ActingState`, `VictoryPose`, `FrameFit`, `ShotFit`,
`ShotRules`, `OpeningCallouts` (engine); `reduceMotion`, `loadingCard`, `entry`, `entryOverlay`,
`shatter`, `blur`, `implosion` (transitions); `phoneSlice` (ui/common); `entryCard` (screens);
`farplane-colossus-shadow` (scenes). `farplane-colossus.ts`, `macalania-temple.ts` and
`cavern-stolen-fayth-rigs.ts` changed away from t1-b2b's and B3's lines; merge-tree against both is clean
(t1-b2b's own CONTRACT-CHANGES conflict with main predates this branch).

## Checks

`tsc --noEmit` clean; full vitest (`--testTimeout=60000`) at 5cf3c24c: 504 files passed, 4 skipped,
8,655 tests passed, 1 failed: `audio-manifest-io.test.ts` with an EPERM on a Windows temp lock file
under the parallel load; it passes alone (9/9) and touches nothing here. `node tools/orphans.mjs` 29
(main 24, plus the five unwired A-2 modules). Approved paintings: none touched (no file under
`public/art` or an approved concept changed); the approved-hash tests
(`target-approved-hashes-judge-locked`, the pose-install and art tests) pass in the full run. Browser checks: dev server on 6500, one headless browser at a time, `PYREFLY_BROWSER=gpu`;
scratch scripts `tools/zz-b2-*.tmp.mjs`, `.b2-vite-tmp.config.mjs`; raw captures in
`D:/Tools/pyrefly-scratch/iter2-b2/`.

## Open

1. A-2's call site (B5's line above) and Bailey's look at the implosion frames.
2. A-4's per-chapter values and the `BattleScreen` line (B5), then the II, IV, V captures.
3. A-1: Ch V's tail at 0.68-0.74 on the master (colossus staging, farplane's slots).
4. A-11: whether FFX's hard cut to the target (party partly out of frame) should also be fitted; it is canon grammar, so it was left alone.
5. A-12: transient edge dips during recoils and slides (IX Lulu 0.51).
6. PR-0061(a): seven chapters open with an enemy turn (the fight itself), 7.7-9.8 s passive.
7. A-3: the hairline, if the driver judges it new (rule 9).
8. A-7 not built.

## CHECK (independent, 2026-09-27; checker did not build B2)

Checked `iter2-b2` at 6d6d3449 in `D:/pyrefly-iter2-b2`. The baseline is the branch point `1a43fd7b`, exported
and built on its own, so every difference is B2's. Both production builds were served by `vite preview`
(6510 is B2, 6511 is the base) and stopped by PID. One headless browser at a time, `PYREFLY_BROWSER=gpu`.
Scratch probes are `tools/zz-b2chk-*.tmp.mjs`; raw frames and JSON are in `D:/Tools/pyrefly-scratch/iter2-b2-check/`.
Nothing in `src` changed.

**Gates.**
- `tsc --noEmit`: clean.
- Full vitest (`--testTimeout=60000`): 505 files and 8,656 tests passed, 0 failed.
- `tools/orphans.mjs`: 29. That is main's 24 plus the five unwired A-2 modules, as disclosed.
- `verify-approved`: 0 mismatched, 0 missing. The branch touches nothing under `public/`,
  `docs/target/` or `docs/concepts/`.
- Merge with today's main (a44297ca, which includes B1, B3 and B4): `git merge-tree` is clean. The merged tree is
  also clean under `tsc`, and full vitest passes 8,826 tests with 0 failures.

**Regression sweep: every chapter's first command menu, B2 against the base, seed 1.**
- 1600x900: no framing change in any of the 15 chapters.
  - Same rig everywhere.
  - The camera moves at most 0.12 units, which is idle sway.
  - Same fov, and every quad has the same share inside the frame.
- 390x844: the change is A-12's and intended.
  - Eleven chapters stand the master back by 1.6 to 3.6 units; IV, VIII, X and XII are unchanged.
  - Every party quad is whole, and the enemies are now whole too.
  - Before and after: Seymour Flux 0.44 to 1.0, Isaaru 0.11 to 1.0, the Guado guardian 0.36 to 1.0,
    the Fem-Goon 0 to 1.0, Bahamut 0.72 to 1.0.
  - Vegnagun's tail stays at 0.74 on both builds.
- Time to the first menu is equal or shorter in every chapter at both sizes.

**Per item, rechecked with real keys on the production build.**

| Item | Result |
|---|---|
| A-13 roll | **pass.** Ch I, Attack by keys. The roll starts on the `damage` phase and peaks at -4.00 there; it is level by the end. The base rolls on the swing. The action takes 837 ms on B2 and 825 ms on the base, so no time is added. With the OS `prefers-reduced-motion` emulated (no stub): no roll at all. |
| A-11 party in frame | **pass, as disclosed.** The same rig-sweep method ran at 1600x900 and 1280x720; the `enemy` and `intro` rigs are excluded. The only party quads under 0.85 are in the authored `yunalesca` and `bahamut` rigs. On the base, 12 chapters cut the party under a push. |
| A-1 FFX-2 wait camera | **much better, not clean.** I sampled every 200 ms instead of taking ten frames. Samples under the 75% enemy / 90% party rule, B2 against the base, 40 s per chapter at 1600x900: IV 1/137 vs 49; V 22/141 vs 139 (the tail at 0.68-0.74, disclosed); VI 0 vs 0; XI 6/134 vs 107; XIII 0 vs 62; XV 21/70 vs 50. New misses the ten-frame method did not catch are listed below. |
| A-12 phone | **pass.** Ch IV: Yuna changes to Black Mage by keys and casts Fira on Bahamut; Bahamut stays at 0.99 or more through the impact (base 0.63). Ch I: Lulu swapped in by keys (Q), Black Magic, Fire, target Seymour Flux; the Fire lands on him (790). Seymour Flux stays at 1.0 through the action and impact on the master (base 0: the side cuts lose him). |
| PR-0185 remainder | **not met on this branch alone.** At 1280x960 in IX (real keys, 14 s of turns), the held `enemy`-rig frames still show slices of the party's heads along the bottom edge: Kimahri 0.08-0.15 and Yuna 0.06-0.29 of their quads, over about 90 samples. The base shows 0.4 for both. The zero the handoff reports needs t1-b2b's enemy rig, which is not in main. |
| PR-0061(a) opening waits | **no regression; the thresholds are not all met.** From the battle screen to the first menu. With Confirm: 1.8 to 4.7 s. VI 4.66 and IX 4.36 are over the "about 4 s". The XII Confirm reading (11.2 s) is a probe artefact: key spam answered the first menu. Passive: B2 is at or below the base in all 15 chapters (I 8.8 to 7.2, V 10.1 to 7.8, IX 12.1 to 9.4, XV 12.6 to 8.3). Eight chapters are still over 7.5 s: IV 8.35, V 7.85, VI 9.60, IX 9.43, XI 8.54, XIII 8.95, XIV 7.67, XV 8.31. V was reported at 7.4 or less. |
| A-3 cold black | **pass.** Fresh profile, 16 Mbps. Ch I: card at 403 ms, longest dark run 424 ms (base 7,501 ms). Ch IV: card at 404 ms, longest dark run 244 ms (base 15,024 ms). Warm re-entries in I and IV raise no loading card, as on the base. |
| PR-0104 cut-in hold | **built as described; the hold is too long (finding 1).** Shell by keys, Wait mode. XI: menu 1.63 s, SHL 4.04 s, cut-in 4.39 s. IV: menu 1.55 s, SHL 3.23 s, cut-in 3.52 s. Base: cut-in 0.93 s, before the menu. |
| PR-0072 contact shadow | **present, faint.** With the HUD off, a darker pool shows on the plain under the tail's barrel; the base has none. With the HUD on at 1600x900 it sits under the command menu and party rows, at the first menu and at target selection. Party billboards stand 15.7 or more units in front of it. |
| A-2 entry | **checked on paper only (unwired by design).** The unit tests pass. The FORCED stills were viewed against the tile. |
| A-4, A-10, Part 1 | A-4 and Part 1 are covered by unit tests only; the values and wiring are B5's. A-10: Dream's End's first menu is identical to the base at 1600x900. |

**Findings, most severe first.**

1. **Major, introduced by the candidate: PR-0104's hold runs into the next girl's menu.**
   - The cut-in waits up to 5 s (`CUT_IN_WAIT_CAP_MS`). It now lands 2.8 s (XI) and 2.0 s (IV) after Paine's menu has
     opened: the frame dims and her portrait covers the left third while she chooses.
   - A player who answers in that window never sees the approved slab (`menuFor() !== actorId`).
   - The plan's item says "at most 0.8 s". Either cap the wait at 800 ms, or drop the cut-in once her menu is up.
   - Frame: `shell/b2/ffx2-fallen-aeons-shell-19-4509ms.jpg`. Regression against the live build: yes (live shows the
     cut-in before the menu).
2. **Moderate: PR-0185's acceptance holds only with t1-b2b's enemy rig.** With main's rig, the IX 4:3 held shots still
   slice Kimahri's and Yuna's heads (better than the base, not zero). Close it at t1-b2b's merge, or say so in the
   release note.
3. **Moderate: A-1 misses found by continuous sampling.**
   - Ch XI: in the `party` rig during Shiva's attack, Shiva stays at 0.60-0.70. Seen in 5 or 6 of about 133 samples,
     in both runs.
   - Ch XV: in the `action` rig, Yuna is at 0.50-0.78 for about 2 s. Seen in one run and not reproduced. Her pose was
     not recorded, so it may be a KO'd girl, which is excluded by design.
   - Ch IV: Yuna at 0.73 once.
4. **Minor: PR-0061(a) thresholds.** Listed above: two Confirm times over about 4 s, and eight passive times over 7.5 s,
   including V at 7.85 s. None is slower than the base.
5. **Minor, disclosed by the builder: A-2 fidelity.** The approved "pane breaks" tile carries the dialogue box and the
   chapter line into the shards. The build's held frame leaves the dialogue box and HUD out by design
   (`entryOverlay.ts`). Worth a look when B5 wires the line and Bailey sees the implosion frames.
6. **Minor: PR-0072.** The pool reads only with the HUD off; in play at 1600x900 the command menu covers it.
7. **Minor, for the HUD batches: the phone queue banner covers Seymour Flux's head.** With A-12, Seymour Flux is now
   in the phone frame at Ch I's first menu, and his head sits under the enemy-queue banner. HUD placement is not
   B2's file.
8. **Low, merge note: A-1's engine detection.** `ShotRules.ffx2Framing` is set by duck typing,
   `typeof engine.tick === 'function'`. An FF7 ATB engine from `ff7-integration` would inherit the FFX-2 wait rules
   when merged. Worth an explicit game check there.

**Game case:** check only, no code change (both games).

## REPAIR (one cycle, rule 15), 2026-09-27

**Blocker fixed: CHK-B2-1, PR-0104's hold ran into the next girl's menu (FFX-2 only).**

- `CUT_IN_WAIT_CAP_MS` is now 800 (was 5000), the plan's "at most 0.8 s", with the 300 ms effect beat counted inside it.
  The menu opens about 0.6 s after an unheld cut-in would, so the slab can now land at most about 0.2 s into her menu.
- A charge still running at the cap, or her menu answered while it waited, **moves her cut-in to her next turn**
  instead of dropping it or landing late. "Next turn" means after she submits a command: the presenter calls
  `TurnCutInBeat.acted()` on every submission, so an FFX-2 menu re-asked within the same turn (an abandoned Wait
  menu) does not count. Moved once, the second time it plays at the cap regardless, so the approved slab is not lost.
- FFX is unchanged: no charge, no wait (a test pins it).
- Files: `src/engine/TurnCutIn.ts`, one line in `src/engine/BattlePresenter.ts` (the `acted` call before `submit`),
  `tests/unit/turn-cut-in-hold.test.ts` (written first, failed 4 of 6 before the fix).

**Real keys** (dev server on 6500, PYREFLY_BROWSER=gpu, 1600x900, seed 1, Wait, Yuna White Magic > Shell > party,
then every open menu answered Attack after 1.2 s). Probe `tools/zz-b2rep-shell.tmp.mjs`; evidence
`docs/screenshots/iter2-b2/pr0104-repair-cap-800ms-real-keys.jpg` and `pr0104-repair-report.jsonl`.

| | Next menu | SHL tag | Cut-ins |
|---|---|---|---|
| XI | 1.65 s (Paine) | 4.11 s | Paine's moved off (no slab over her open menu, 1.65 to 5.3 s). Rikku's at 5.68 s, as her first menu opens, 0.4 s after Paine answered. Paine's at 21.5 s, on her next turn, phase `command:paine`, menu just open. |
| IV | 1.56 s | 3.27 s | Rikku's at 7.03 s, Paine's at 12.59 s, each as that girl's menu opens. |

The SHL tag shows before every cut-in, and the next menu is not later (base 1.55 to 1.63 s). No slab covers a menu
that has been open more than about 0.2 s. A first run showed Rikku's slab "4 s into the menu": the DOM menu stays on
screen between girls, and the pair frame (Paine's advisor card at 4.5 s, Rikku's at 5.68 s) shows it was Rikku's
fresh menu.

**Gates:** tsc clean; full vitest --testTimeout=60000: 505 files, 8,659 passed, 0 failed; orphans 29 (unchanged, the
five unwired A-2 modules). No file under `public/`, `docs/target/` or `docs/concepts/` touched, so the approved
hashes cannot change. Dev server on 6500 stopped by PID.

**Left open (not blockers; no fix in this cycle):**
- CHK-B2-2 (moderate, FFX only): PR-0185's zero needs t1-b2b's enemy rig; close it at t1-b2b's merge or say so in
  the release note.
- CHK-B2-3 (moderate, FFX-2 only): A-1 misses found by 200 ms sampling (XI Shiva 0.60-0.70 in the `party` rig in
  5-6 of 133 samples; XV Yuna in the `action` rig, not reproduced; IV once). Needs a shot-rule pass with continuous
  sampling as the acceptance method.
- CHK-B2-4 (minor, both): PR-0061(a) thresholds: VI 4.66 and IX 4.36 s with Confirm; eight chapters over 7.5 s
  passive. Nothing slower than the base.
- CHK-B2-5 (minor, per game): A-2's held frame leaves out the dialogue box the approved tile shatters; judge when
  B5 wires the line and Bailey sees the implosion frames (A-2 stays OFF until then).
- CHK-B2-6 and later (minor): PR-0072 pool hidden under the command menu at 1600x900; the phone queue banner over
  Seymour Flux's head (HUD batches); `ShotRules.ffx2Framing` duck typing to check at the FF7 merge (closed at the merge, 2026-09-27: the presenter now also requires `engine.state().game !== 'ff7'`; FF7's fixed camera and null moment overlay already kept A-1, A-12 and the roll off its fight).

**Game case:** FFX-2 only (a confirmed FFX-2 command charges on the ATB while the next girl's menu opens; FFX's CTB
has no charge and its cut-in is unchanged).
