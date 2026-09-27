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
