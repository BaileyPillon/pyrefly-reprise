# Thresholds program, 2026-09-26

Bailey, 2026-09-26 about 15:00 EDT, verbatim: "Focus on meeting all score thresholds iteratively. Godspeed. I have plenty of usage."

The goal is the finished milestone of `critic/RUBRIC.md` (policy v2, `critic/policy.json`):

- every one of the ten categories at 9.0 or more;
- the single weighted score at 9.60 unrounded or more;
- every gate: evidence complete, no critical or major defect, every encounter through its real flow, every required target in `docs/target/targets.json` matched, and the exact artifact verified live.

**Inputs.** Deep round 13 of release 18 (`critic/rounds/round-13.json`, 145 open issues, 17 stalled). The focused review of release 19 (`critic/reviews/43dca986-focused.json`). The live review of release 20 (`ce05b02c-live.json`). The release-20 focused review is only captures so far: `critic/reviews/ce05b02c-focused/` holds no JSON. Decisions are D-001 to D-199. Also used: ten per-category analyses by the program planner, and the state of `main` at 1d429c00.

**Obligations right now** (`npm run critic:status`). Live is ce05b02c (bundle i8Mr-QwD), deployed under Bailey's override "Just push the live build please". Its live review PASSED. Its focused review is PENDING, and so is a deep review carried from 18 builds (fd0ae96 through 43dca986). While that deep review is owed, every deploy needs Bailey's own words. **So the first job of iteration 1 is to settle the deep review (round 14).**

Classes used below:
- **A** is a clear fix that restores an approved target, a check contract or a sourced rule. Build it now.
- **B** is new and perceivable. It needs an options round first (rule 9).
- **C** needs Bailey's decision or his ear (rules 10 and 13).
- **D** is stalled. It needs a written method check first (rule 15).
- **X** is already fixed or decided, and only needs evidence.

---

## 1. Scoreboard

Weights come from `critic/policy.json`. The total is Σ(score × weight) / 100, tested unrounded against 9.60.

| Category | Weight | Round 13 | Likely on main today (unscored) | Gap to 9.0 | Shortest path to 9.0 |
|---|---|---|---|---|---|
| Combat | 20 | 8.7 | about 8.9 | +0.3 | Round 14 verifies the three FFX-2 engine corrections live: IC-2 per-target hits (PR-0199), Acta on the Redoubts only (PR-0200) and menu cancel (D-198). Also needed: PR-0179 decided or built (the last combat major; stalled; invented data), and batch 1 polish (PR-0145, 0108, 0107, 0106, 0054, 0069). |
| Encounter | 10 | 8.8 | about 9.0 | +0.2 | Round 14 re-wins Chapter III by real keys on a pinned seed and on a drawn seed (PR-0208 is live), and records FOC18-01 as decided by D-197. Also needed: PR-0197 (the Omnis advisor turns discs), PR-0215 (a stalemate goes to results with RETRY), and a Chapter IV lone-White-Mage engine probe (D-193). |
| Visual | 15 | 8.3 | 8.3 | +0.7 | PR-0201 (release 21). The five stalled majors built after their method checks: PR-0181 summon staging, PR-0031 FFX target cues, PR-0095 and PR-0094 Vegnagun parts, PR-0157 HUD during action cameras. Re-capture the four stale majors (PR-0057, 0063, 0014, 0128). Record PR-0035 as settled by D-167. |
| Feel | 10 | 7.8 (category stalled) | 7.8 | +1.2 | Close or recalibrate both majors: PR-0061, where Bailey rules on D-138 and the non-approved waits are cut, and PR-0180, the FFX action-name banner once it is sourced. Then the batch 2 polish (PR-0205, 0191, 0146, 0104, 0190), and latency and Chapter XV evidence. |
| Narrative | 10 | 8.1 | 8.1 to 8.2 | +0.9 | PR-0021 re-tested against D-173 across attempt counts. Bailey's story read of seven chapters (a human judgment gate). Batch 4 script fixes. A full dialogue-timeline scene walk of every chapter (coverage is the biggest single cap). |
| Audio | 10 | UNVERIFIED | UNVERIFIED | no number | Bailey's listening verdict (PR-0148) **blocks the category and the total**. Then a re-render in the direction he picks, and his score of 9 or more on the re-rendered live mix. The technical fixes (PR-0214, 0216, 0100, 0099 rows) clear CHK-023 and CHK-001 but do not move the number. |
| Interface | 10 | 7.2 (provisional) | about 7.9 to 8.1 | +1.0 to +1.2 | Close the seven remaining majors: FOC-06 (method check), PR-0001 (release 21), PR-0126 phone half, PR-0206 (repro), and PR-0018, PR-0127 and PR-0144 (re-measure). Then the four polish clusters (pause, advisor copy, target labels, panel lifecycle), plus every missing screen shape, touch and gamepad coverage. |
| Onboarding | 5 | 7.1 | 7.1 | +1.9 | **Blocked by D-005.** Accessibility settings (PR-0032) are needed for 9.0 and need Bailey's yes. Without them the category plateaus at about 8.0 to 8.3. Then PR-0073, 0119, 0112, the Defeat cause line (PR-0033), and touch, gamepad and reduce-motion coverage. |
| Prep | 5 | 8.5 | 8.5 | +0.5 | PR-0109 (board cursor; stalled at its 5th review; the cause is traced), PR-0138 (FFX-2 chain spoils on V, XI and XV), PR-0174 (Rikku S.LV 53), PR-0215. Prep agency, touch and gamepad re-exercised. |
| Delivery | 5 | 8.2 | 8.2 | +0.8 | Real-key outcomes for III, VI, VIII, IX and XIII. The CHK-024 upgrade matrix (PR-0195). Stripping 126 MB of variants and 34 MB of candidates from dist (PR-0173, PR-0100). The seed record (PR-0202). Cold-cache load, frame time, Firefox and Edge. R15-02, PR-0149, PR-0158. |

### Weighted-score arithmetic

- **Round 13, audio excluded:** 8.7×20 + 8.8×10 + 8.3×15 + 7.8×10 + 8.1×10 + 7.2×10 + 7.1×5 + 8.5×5 + 8.2×5 = 736.5. So the total = 7.365 + audio/10. With a hypothetical audio of 8.5 that is **8.215**. Without an audio number the score stays PROVISIONAL.
- **What each +0.1 is worth on the total:** combat +0.020, visual +0.015, the 10-weight categories +0.010 each, and the 5-weight categories +0.005 each.
- **Every category at exactly 9.0 (audio included)** gives a total of **9.00**. Clearing the floors is not enough; the 9.60 total is the harder threshold.
- **The floors scenario, where this plan's first two iterations aim:** combat 9.2, encounter 9.1, visual 9.1, feel 9.1, narrative 9.1, interface 9.1, onboarding 9.0, prep 9.2, delivery 9.1. Those nine sum to 821.0.
  - Audio needed for 9.60 = (960 − 821) / 10 = **13.9, which is impossible**.
  - With audio at 9.0 the total is **9.11**.
  - So the floors can be passed at about 9.1 overall, and 9.60 needs almost every category near 9.6.
- **A feasible 9.60 profile:** combat 9.7, visual 9.6, encounter 9.6, feel 9.5, narrative 9.6, audio 9.6, interface 9.6, onboarding 9.4, prep 9.6, delivery 9.6. That is 194 + 144 + 96 + 95 + 96 + 96 + 96 + 47 + 48 + 48 = **960.0, exactly 9.60**. Any 0.1 shortfall has to be bought back elsewhere, and combat is the cheapest place because of its weight.
- **What audio must be:** audio_needed = (960 − Σ other nine) / 10.
  - With the other nine all at 9.6, audio must be **9.6**.
  - With the other nine at the profile above minus audio (864), audio must be **9.6**.
  - With audio at 10, the other nine must average **9.556**.
  - **Audio can never carry the total.** It needs Bailey's ear score of about 9.6 on the shipped mix, and his last words on it were "too reminiscent of snes music".

---

## 2. Fix batches (class A, plus X verifications and D items once their method check is written)

Five batches, each in its own git worktree (the two junctions: node_modules and public/art, see memory `pyrefly-worktree-tooling`). **Each file belongs to exactly one batch.** Two branches are already in flight for release 21 and keep their files:

- `r21-results-phone` (D:/pyrefly-r21-results) owns `src/app/screens/ResultsScreen*.ts` and the results CSS. PR-0001 option B lives there. **Add PR-0172** (the Defeat title overlaps CHAPTER SELECT) **and PR-0120** (the results painting stops short of the right edge at 2000x1012) to that branch, because they are in the same files.
- `r21-road-phone` (D:/pyrefly-r21-road) owns `src/scenes/farplane.ts` and `src/ui/common/phoneFraming.ts`. PR-0201 option A lives there. PR-0072 (the Vegnagun contact shadow in farplane.ts) waits until that branch merges.

**Priority order when the machine is loaded** (at most 4 to 5 heavy agents at once, memory `feedback-parallel-load-limit`): batch 5 first (small, and every later review depends on it), then 3, 4, 2 and 1.

Every batch finishes with:
- `npx tsc --noEmit`;
- the vitest files it touched;
- `node tools/orphans.mjs`;
- real-key captures in `docs/screenshots/` for anything visible;
- the game case (FFX only, FFX-2 only, or both, with the reason) written in each commit (rule 14);
- a handoff note.

### Batch 5: harness and critic tooling (both; no product code except the debug API)

**Owns:** `critic/runner/**` (route driver, lib), `src/debug/api.ts`, `tools/critic-plan.mjs`, `tests/unit/critic-release-rules.test.ts`, the new `tests/e2e/hud-collision.spec.ts`, `enemy-visibility.spec.ts` and `save-upgrade.spec.ts`, and `docs/target/targets.json` (the records fix only).

| Item | Work | Acceptance (round 13) |
|---|---|---|
| PR-0202 | Record `battleState().seed` at each battle start, not `window.__pyrefly.seed()`. Pin it before the first key in feel and interface runs. | Two routes with setSeed(1) produce the same first enemy action. run.json seed equals N. The BFA live-versus-bench comparison is repeated on a pinned seed. |
| PR-0213 | Captures assert the named state ("mid-fight", "16b target"), not just "in battle". | No index item whose staleRoots.screen differs from its asserted screen. |
| Orders widget | The route driver learns Chapter VIII's PULL BACK / CLOSE IN widget, so VIII can be played to an outcome by real keys. | A VIII win and a VIII loss with RETRY by real keys. |
| NEW-C3 (PR-0141 family) | A change classed as the FFX-2 ATB engine owes every listed FFX-2 chapter (IV, V, VI, XI, XIII, XV). | Unit test: plan output for a resolve.ts change lists all six. The plan output includes ffx2-leblanc. |
| PR-0195 | Write the CHK-024 upgrade matrix as an e2e spec: a release-20 fixture save plus a truncated JSON. | Clears, ribbons, best times, volumes and the ATB mode survive boot. Truncated JSON boots to a fresh save without an error. |
| CHK-008 / CHK-011 sweeps | Promote the scratch collision harness to specs: actor quads against HUD boxes at 1280, 1600, 2000 and 2560 over the nine HUD states; enemy occlusion at most 25%. | The specs run and report. They do not have to be green yet; they are the measuring stick for batches 2 and 3. |
| Evidence contexts | Route options for touch (`hasTouch`, `isMobile`, `page.tap`), a gamepad shim (a `getGamepads` init script), reduce-motion (`emulateMedia`), a per-run `audioDebug` file (no 4,000-character cut), and a `dboxTimeline` in run.json for scene walks. | Each option produces a run.json that shows it was used. |
| PR-0196 | Point the "Yojimbo's look" tile at `a-repaint-frame.jpg`. | All 69 required tiles resolve their src. |

### Batch 3: advisor, intent, FFX-2 HUD, pause (interface-led, both games)

**Owns:**
- `src/ui/common/MoveAdvisor.ts`, `move-advisor.css`, `phone-battle-parts.css`;
- `src/ui/common/EnemyIntent*.ts` and `enemy-intent*.css`;
- `src/ui/common/portrait.ts` and `face-crops.json`;
- `src/ui/ffx2/**`;
- `src/engine/tactics/**`;
- `src/data/guides/**`;
- `src/battle/ffx/intent.ts`;
- `src/app/screens/pause/**` (everything except `keys.ts`);
- `src/app/screens/frontend/frontend.css` and `chapter-select-c.css`.

`MoveAdvisor.ts` (648 lines) and `EnemyIntent.ts` (863 lines) are already over the 400-line limit. New logic goes into new modules.

In order of lift per effort:

| Item | Class | Game | Work | Acceptance |
|---|---|---|---|---|
| PR-0126 phone half (major) | A | both | On the bare/phone rung, put the menu as a span inside `p.mad__line` after the target, and drop the reason first. | Every run.json pick for a submenu row at 390x844, 1600x900 and 2000x1012 carries a non-null want.menu, and the phone tip screenshot shows the menu word. |
| Advisor and guide copy: PR-0026, 0027, 0162, 0163, 0192, 0169, 0074 | A | 0026/0027/0162/0163 FFX only; 0192 and 0169 FFX-2; 0074 both | The Haste line in player terms. Drop the `*she*` asterisks. "Cid pulls the ship out of reach". No arrow on self-only trigger rows. Gate "call an aeon" on FFX. Guide's pick only when it equals the guide's NEXT row. Sentence templates per effect kind. | Guide text has no "ctb x". No `*` in intent text. The VIII guide is grammatical for every actor (unit test). The ch8 card reads "Pull back" with no arrow. The ch6 revive reason has no "aeon" while FFX still says it. No badge that disagrees with NEXT over a ch5 route. A 300-card sweep finds no "and N damage" and no duplicated status sentence. |
| PR-0197 | A | FFX only | Rank disc-turning actions on Omnis by the affinity change they simulate. | Over a 40-seed advisor-top-row bench, a disc turns in most runs and the win rate is at least 27/40. |
| Pause cluster: PR-0112, 0151, 0117, 0171, 0168, 0189, 0121 | A | both (the X-2 rows and 0117 are FFX-2) | On phone and at 4:3, stack each label over its control and add a scroll cue. Reserve the eyebrow's height. Put the CHAPTER-tab text away from the face. SCENE reads chapter.location. Widen the party column. The plate is never smaller than cover size. | At 390x844 every row is reachable by touch scroll with no ellipsis, and X-2 BATTLE flips by tap. No ellipsis at 1280x960 and 1024x768. No eyebrow or stat overlap in ch4 and ch6 phone. No text box on a ch2 or ch9 plate face. SCENE equals LOCATION. scrollWidth ≤ clientWidth + 1 at 1280, 1600, 2000 and 3840. The 3840x2160 plate covers the viewport. |
| PR-0066 | A | both | Phone floor in `frontend.css:794` goes from 12 px to 14 px, keeping the D-183 C layout. | Zero leaves under 14 effective px on the title and chapter select at 390x844. No horizontal scroll. 1600 and 2000 unchanged. |
| Panel lifecycle: PR-0139, 0110, 0130, 0010 | A | both | Recompute intent on KO. Hide the N chip under the coach mark and when E folds the card. Re-verify the MORE chip. | Within one frame of Ormi's KO the panel names Leblanc or Logos. No chip text inside the coach rect. No lone .mad chip after E. Counter rules are either complete or behind MORE, with no cut glyph. |
| FFX-2 target labels: PR-0193, FOC19-05, 0175 | A | 0193 and FOC19-05 both; 0175 FFX-2 | The multi-target label scales, has a 14 px floor, and avoids the intent card and panel. No reticle for combatants outside the current link. | At least 14 px and no intersection at 1280x720 and 2560x1440. No corner reticle and no raw-id plate at the V link 4-to-5 seam. |
| PR-0131 | A | FFX only | Weigh a revive against the next predicted enemy multi-hit. | The degenerate-boards test covers the telegraphed re-kill in Chapter I. The advisor top row stays at 20/40 or better. |
| PR-0135 | A | FFX-2 only | Size the stage and help band to the viewport, not a 16:9 box. | No flat strip in the Ch IV first menu at 2000x1012 and 2560x1080. |
| PR-0014 | A | both | Adjust per-subject fy or zoom for the chips that fail. Extend `portraits.spec.ts` to every roster. | Every chip's head box is inside the visible rect, with no 4xx on /art/. |
| PR-0094 (major, stalled) | D then A | FFX-2 only | After its method check: add a link-4 rule to `intentPlacement.ts` that mirrors links 2 and 3, and unit-test it with the head box as an obstacle. | The link-4 intent card does not intersect the head quad at 1600 or 2000. |
| FOC-06 plus the intent-chip floor at 4:3 (major, stalled) | D then A | both | After `docs/plans/foc-06-method-check.md`: one rendered 14 px floor for the advisor and the intent chips, with the density ladder shedding rows. If the lead move, target and menu cannot survive at 1280x720, it becomes a Bailey question (queue item 24). | advisorMinEffPx ≥ 14 at 1600x900 and 2000x1012 in every chapter of both games. A rotation sweep of the HUD and pause finds no leaf under 14 px. |
| PR-0146 | A | both | Hide the intent panel until the presenter leaves `moment:battle-start`. If this needs a new HudPort or BattlePresenter hook, it waits for batch 2 to merge and then takes a one-line hook. | No HUD panel in any transition frame before the boss caption (IV and one FFX chapter). |
| PR-0206 (major) | D then A | FFX | Needs PR-0202 from batch 5 first. Replay the round-13 Chapter I first decision, or sweep seeds 1 to 200 at 2000x1012, and log the card DOM. Fix what that shows. | The first-menu card is visible with a non-zero rect and on no party face. N toggles it and the chip text matches. The safe-zones test gains a 2000x1012 case. |

### Batch 4: story, flow, onboarding, audio and delivery plumbing (both games)

**Owns:**
- `src/story/**`, including `dsl.ts` for the story lint;
- `src/app/screens/BattleScreen.ts`, `BattleScreenFlow.ts`, `BattleScreenCutscenes.ts`, `CutsceneScreen.ts`, `registerFlowScreens.ts`, `ChapterSelectScreen.ts`, `PartyPrep*.ts` and their CSS;
- `src/app/screens/pause/keys.ts`;
- `src/app/screens/frontend/chapterCards.ts` and `src/data/chapter-meta-*.ts`;
- `src/ui/coach/**`, `src/ui/common/ControlsHint.ts`, `DialogueBox.ts` and `cutscene.css`;
- `src/ui/common/pauseMusic.ts` and `src/audio/AudioManager.ts` (only for unlock logging);
- `vite.config.ts`, `tools/deploy-pages.mjs` (the dist filter and preflight), `docs/audio/THEMES.md`, `tools/audio/themes-audit.mjs`.

| Item | Class | Game | Work | Acceptance |
|---|---|---|---|---|
| PR-0109 (stalled, 5th review) | D then A | both | Short method check: the cause is traced (`registerFlowScreens.ts:42`, `ChapterSelectScreen.ts:110`). Keep the last chosen chapter id in the flow and pass it as initialIndex on prep cancel and on the results return. | With real keys at 1600x900, 2000x1012 and 390x844, after Esc from prep and after CONFIRM on results, for all 13 playable chapters, selectedId equals that chapter. |
| PR-0215 | A | FFX engine rule; routing is both | Route the FFX 'escape' stalemate outcome through the Defeat or "withdrew" results with RETRY. The engine is unchanged. Results display reuses the existing defeat path; ResultsScreen belongs to r21-results. | Trip the stalemate: a results card explains it and RETRY re-enters. |
| PR-0214 | A | both | `pauseMusic.ts`: use `has()`, and stop music when the remembered value is null. | music.current = null 1.5 s after resuming the Ch I pre-scene. Battle and Ch V resumes still restore their cue. |
| PR-0100 plus PR-0173 (0100 stalled) | D (one paragraph) then A | both | Drop `dist/audio/candidates`, `*.raw.png` and numbered variants from the build or deploy copy, and add `qa.mjs --strict` to the deploy preflight. audition.html keeps playing locally. | Fresh dist: 0 candidates and 0 variant files. qa --strict exits 0. A full route has 0 404s. audition.html plays every candidate locally. |
| PR-0099 docs half (stalled) | A | both | Cue-map rows for VI, the VII scene, X, XI, XII, XIII, XIV and XV (the stand-in and the owed cue, with decision ids). themes-audit fails a chapter with no row. | Rows exist, the audit checks the mapping, and a grep for each chapter name hits. |
| PR-0216 | A (reproduce first) | both | Run 20 idle-host fresh-profile title and board probes. If it recurs, add unlock logging and fix the dropped request. | All 20 report "title" by +3 s and "chapter-select" on the board. |
| Script batch: PR-0102, 0147, 0103, 0194, 0133 (V half), 0134 plus FOC19-06, 0159 | A | 0159 FFX; 0134 both; the rest FFX-2 | Drop the asterisks. "...Okay. Round two." An ifFlag kill-order guard. A two-showing cap on a named midScript. `showActor('shuyin')` before setPose. A per-chapter `bossLine` (VI: Leblanc, Logos and Ormi; XV: Baralai, Gippal and Nooj). A voice pass on VIII's non-Al-Bhed speakers, where Brother keeps §1.17 and Cid is untouched. | The line has no asterisks. The seam line and the stage agree. Ormi-first then Logos: no KO'd speaker talks. At most 2 showings on link 2. The V post capture shows Shuyin on stage. The VI card names Leblanc. VIII passes a names-hidden re-read. Story tests pass. |
| Story-text lint (CHK-007) | A | both | lintScript or a unit test rejects `*`, `_`, `§`, `[`, file stems and raw ids in every say, narrate and callout. Add an FFX-2 speaker allow-list test (CHK-021). | The test passes on main after the fixes above. |
| PR-0073 | A | both | Take the initial device from a coarse pointer. Pointer and touch wording on the briefing and cutscene hints. Desktop C1 unchanged. | At 390x844 in a touch context no hint names a key and each named tap works. |
| PR-0119 | A | observed FFX-2; plumbing both | The coach mark waits while a seam dialogue card is up. | No coach rect intersects the dialogue card in the Ch VI seam sequence. |
| PR-0115 | A | both | P toggles the pause, and opens it over a pre-battle scene. | A real-key e2e test: P opens and closes from the menu and from a scene. |
| PR-0057 | X, then A only if the capture fails | both | Capture Ch I and V at 390x844. If it fails, add a bottom reserve under 768 px. | .chint does not intersect .dbox__body or the speaker plate, and sits within 0..390. |
| PR-0211 | A | both | Anchor mid-battle line cards in a top band clear of the party. | No intersection with a party face or torso in III and V at 1600 and 2000. |
| PR-0127 | X, then A | FFX-2 only | Capture the Ch VI prep. If it clips, allow two caption lines. | scrollHeight ≤ clientHeight + 1 at 1280x720, 1600x900 and 2000x1012. |
| PR-0158 | A | both | Guard the pause-open path until the presenter is bound. | Real Escape at 0.5, 1, 2, 3 and 4 s after mount in ch1 and ch6: no console error, and the battle continues. |
| PR-0028 | C (queue item 23), then A | both | After Bailey answers: rename the legend (cheap), or make H hide every optional panel. | H leaves the painted field clear, or the legend matches the behaviour exactly. |

### Batch 2: FFX presenter, FFX HUD, scenes (visual and feel; mostly FFX only)

**Owns:**
- `src/engine/**` except `tactics/`: BattlePresenter*.ts, BattleMoments.ts, BattleCamera.ts, TargetHighlight.ts, PaintedActor.ts, PaintedArt.ts, PartAnchors.ts, TurnCutIn.ts, OpeningSkip.ts, battlePreload;
- `src/ui/ffx/**`: FFXBattleHud.ts (1,544 lines, so new logic goes in new modules), CtbList.ts, SensorPanel.ts, ZanmatoGauge*, CommandMenu*;
- `src/ui/common/transitions/**`;
- `src/scenes/**` except farplane.ts;
- `src/data/chapter-ffx2-fallen-aeons.ts`.

Presenter changes get a focused review before deploy and a deep review after.

| Item | Class | Game | Work | Acceptance |
|---|---|---|---|---|
| PR-0176 | A | FFX only | CtbList falls back to `resolvePortraitKey(spriteKey)` for aeons. Opaque Mortibody crop. | No turn tile in I, III, IX, X or XIV shows the monogram. |
| PR-0164, PR-0212 | A | FFX only | edgeFade of 0.12 to 0.2 on the Yunalesca and aeon actors. The approved files stay byte-identical. | No straight edge in the ch2 attack frame at 2000 or in the ch14 summon frame. `verify-approved` passes. |
| PR-0186, PR-0183 | A | FFX only | Move the Sensor card to the free column. Clamp the target name plate to the target's quad. | The card misses both Pagodas and BFA at 1600 and 2000. The plate misses party faces in I and III. |
| PR-0191 | A | FFX only | The gauge view holds full or "Zanmato" until Zanmato's action-end, and the banner finishes its 2.6 s. | In a replay, the banner holds at least 2.6 s and the panel reads Zanmato until the 9999 lands. |
| PR-0190, PR-0182 | A | FFX only | Enter during a cut-in confirms the highlighted row. The Overdrive list opens on the first Enter. | Arrow then Enter at 100, 300 and 600 ms: no lost press. Mighty Guard fires with Enter, arrows, Enter. |
| PR-0205 | A | FFX-2 only | An optional `headline` on a chain link; openOn prefers it. XI link 2 reads "Magus Sisters". | The seam-2 caption reads "Magus Sisters" (unit test). |
| PR-0104 | A (or B, see §3) | FFX-2 only | Hold only the decorative cut-in until the queued action's first effect event, capped at about 0.8 s. The menu is never delayed. | In XI and IV the SHL tag or effect shows before the next cut-in, and time to the next menu is not longer. |
| PR-0184, PR-0185, R15-02 | A | FFX only | Ch IX: anchor the sakura overlay to the floor, fix the camera head-cut, and stop the aborted sakura request. | No straight canopy edge. No cut heads at 1600 and 2000. No aborted sakura.png request. |
| PR-0034, PR-0177, PR-0136 | A (restores approved tiles) | 0034 and 0177 FFX; 0136 FFX-2 | Ch I grade toward the moon and lit snow. Evrae FAR scale toward A-FAR. Syndicate spacing. | Composites against the tiles. No enemy within 150 px of a girl at 1600. |
| PR-0128 | A | FFX only | Hide the guide card while an Overdrive overlay is open. Restore the HIT tick labels. | The frame 0.5 s after Enter on Slice & Dice shows the name plate clear and four tick labels. |
| PR-0149 | A | both | `PaintedArt.ts`: retry once after about 500 ms on a 5xx or a thrown fetch. | Unit test: a 503 then 200 stub still gets the sidecar. |
| PR-0180 (major, stalled) | D, then A once sourced | FFX only | New `src/ui/ffx/actionBanner.ts`: on an enemy action-start with an abilityName (not plain Attack), show the approved `.ig-banner`. Build it behind an OFF switch now. Turn it on when the Steam check or a GameFAQs citation sources where FFX prints enemy ability names (queue item 7). | In X and XII the ability name is in the DOM and on screen within 200 ms of action-start. |
| PR-0181 (major, stalled) | D then A | FFX only | After its method check: on summon, fade the party out and stage the aeon centre-front at its own scale; on dismiss or KO, bring the party back. Sourced: ffx-combat-core §6.1, "a summon replaces the party". | In I, X and XIV, on the aeon's first menu: at least 75% unoccluded, no party overlap, and party rows replaced by the aeon's. |
| PR-0031 plus PR-0178 (major, stalled) | D then A | the FFX plate is FFX only; ring and dim plumbing is both | After its probe of TargetHighlight state: an FFX TARGET plate, a legible ring and dim per approved look B (D-004), and brackets behind the menu. | Composites of s1 and s2 in III and X at 1600 and 2560 show the plate, the rings and the dim. |
| PR-0095 (major, stalled) | D then A | FFX-2 only | After the `partRingSnapshot()` probe at links 3 and 4: ring opacity, blend and depthTest, plus per-part name plates to the C* look (D-044). Ships together with PR-0094 from batch 3 in one Ch V capture. | Link 3 and link 4 first menus at 1600 and 2000 show a ring and a plate on each part, unoccluded. |
| PR-0157 (major, stalled) | D then A (or B) | FFX only | After its method check: fade the intent card and turn column to about 20% during FFX action cameras. | In I and XII action sequences, no HUD box intersects a party quad's upper two thirds or the acting boss. |
| PR-0061 non-approved waits (major, stalled) | D, then A | both | After the round-13 addendum to `pr-0061-method-check.md` (seed pinned) and Bailey's D-138 ruling: the opening enemy callout auto-advances under the action, and the sensor line runs under the push. Approved beats are untouched. | Recalibrated to round 11's form: first menu within about 4 s with Confirm presses, and passive time ≤ 6.0 + 1.5 s. |
| PR-0137 | A (art alpha repair, no render) | FFX-2 | Only if the ffx2-bahamut file is not approved-hashed or judge-locked. | Judged in-game against its tile (CHK-013). |

### Batch 1: FFX-2 engine, combat data, chain spoils (combat, encounter, prep; deep-class paper preflight first)

**Owns:**
- `src/battle/ffx2/**`, including the split of `resolve.ts` (485 lines) and `engine.ts` (643 lines);
- `src/data/ffx2/**`;
- `src/battle/ffx/setup.ts`;
- `src/data/ffx/builds/**`;
- `src/data/encounters.ts` (a CONTRACT file, additive; entry in `docs/CONTRACT-CHANGES.md`);
- `src/app/screens/BattleScreenCarry.ts`, `BattleScreenSetup.ts`, `BattleEncounterChain.ts`, `BattleChainCheckpoint.ts`.

**Shared-file flag:** if PR-0138's ledger turns out to need `BattleScreenFlow.ts`, which batch 4 owns, batch 1 lands last and makes that edit after batch 4 merges.

Before building, write the paper preflight in `docs/plans/combat-polish-0926-review.md`.

| Item | Class | Game | Work | Acceptance |
|---|---|---|---|---|
| PR-0138 | A | FFX-2 only (FFX chains grant once at the end, per the sources) | Accumulate each link's EXP, gil and drops for FFX-2 chains, and label the Sisters' AP conflict. FOC19-04 (whether the Den adds up per-shade rewards) waits on queue item 19. | A real-key Chapter V win shows the sum of the sourced rows. XI includes Shiva's 8,000 EXP and 2,000 gil. A ledger unit test. FFX II and III results unchanged. |
| PR-0145 | A | FFX-2 only | partyAlive also requires "not petrified" (§2.8, 2 sources). | The probe reports defeat with 0 enemy actions after all three are petrified. Re-bench V and VI. |
| PR-0108 | A | FFX-2 only | At ATB SPEED = FAST, Sleep has no timed expiry (§1.5, single source, labelled). | A unit test at Fast shows Sleep persisting past its Normal duration. |
| PR-0107 | A | FFX-2 only (Ch VI) | A per-link `separateBattle` flag gives Leblanc's Acts II and III randomised opening gauges, while HP and MP still carry. | A Ch VI first-try and within-five bench before and after, staying inside the accepted band (otherwise ask). |
| PR-0106, PR-0054, PR-0069 | A | 0106 and 0054 FFX-2; 0069 FFX only | Source labels: the Leblanc failsafe reading as AUTHORED; the Vegnagun Break branch as an inference; the possessed-aeon affinities comment made to match research/ffx-bfa-yu-yevon §2 (if §2 is silent it becomes C). | Comments, test names and code agree, and each cites its research line. |
| Acta F4 guard | A | FFX-2 only | Give `x2-vegnagun-acta-est-fabula` (shuyin-abilities.ts:99) `namedTargetsOnly`, or add a test proving it is never routed to the engine. | Unit test. |
| PR-0174 | A | FFX only | `src/data/ffx/builds/fahrenheit.ts:212`: re-derive Rikku's sLv from the §9.2 offset, or label the 53 as an estimate with its reasoning. | The VIII and X rosters show a consistent S.LV with its source tag. |
| PR-0083 / F3 split | A | FFX-2 only | Split resolve.ts (targets and chain into `resolve-targets.ts`) and engine.ts (outcome and stalemate) to under 400 lines, with no behaviour change. | Byte-identical seeded battle logs on IV, V, VI, XI, XIII and XV before and after, plus the full suite. |
| PR-0179 arms (major, stalled) | D, then build as OFF switches | FFX only | After `docs/plans/pr-0179-method-check.md`: build arms (a) §6.4.3 rows at Gagazet with X and XIV inheriting them, (b) §6.4.3 at Gagazet with X and XIV kept at D-186, and (c) the Isaaru P3 floor. Each is OFF. Bench each at human pace on I, IX, X and XIV, then put one question to Bailey (queue item 6). Never tune boss numbers. | Aeon rows equal a sourced preset, and every chapter that inherits them is re-benched. |
| NEW-C1 probe | read-only engine run | FFX-2 only (Ch IV) | Prove by running the engine (rule 3) whether a lone White Mage can still win or lose by Attack or a spherechange. If she can, record it as faithful information. If she cannot, it becomes queue item 7 (Steam) and possibly an options round. | Written result in the preflight. |

---

## 3. Options rounds (class B), one line each

These can all be mocked in parallel except where noted. Each one is real-engine frames or recorded clips, at 1600x900 and 390x844 where it applies.

1. **PR-0033 plus PR-0007, the Defeat cause line** (both; the Ch II text is FFX only). Three Defeat cards for the Ch IX Zanmato wipe and the Ch II Zombie/Full-Life loss: (a) the finishing move only, (b) the move plus the status that set it up, (c) the move plus a one-line sourced tip. Mock after r21-results merges, because it is the same screen.
2. **PR-0161, the Farplane voice card** (FFX-2 Ch V). (a) An italic line with a "FROM THE FARPLANE" plate and no face, (b) a pyrefly veil over the approved portrait, (c) a floating centred line with no card.
3. **PR-0058, comm and off-stage speakers** (FFX-2 Shinra; FFX Brother in VIII). The existing Shinra pilots next to a text-only "COMM" plate, and for the FFX Brother, D-043's Brother A re-used versus a text card. No new renders unless a portrait is picked. New content, so it needs his yes (rule 10).
4. **PR-0036, FFX-2 party spacing** (Ch IV). Three real-engine frames: today, wider, and wider plus larger.
5. **PR-0032, accessibility settings** (both). **Only after a yes on queue item 2.** OPTIONS with TEXT SIZE 100/115/130, REDUCE MOTION, REDUCE FLASHES and CONTROLS remap: (A) rows in SETTINGS, (B) an ACCESSIBILITY sub-tab, (C) the rows plus a first-launch comfort prompt. Include a 130% text frame beside them.
6. **Audio direction** (both). Control, A, B and C are already built in `docs/audio/audition.html`. Send them as a standalone phone pack (queue item 1). After the pick, one refinement pack: the four D-168 cues plus the three PR-0039 cues, re-rendered.
7. **Owed chapter cues** (Natus, Omnis, Isaaru, Trema, Den of Woe, Leblanc). Two or three sketches each, in the chosen palette. **Only after item 6's pick.** The Macalania A, B and C sketches already exist (D-190).
8. **PR-0061, a shorter opening** (both). Only if Bailey asks for it after queue item 8: (A) as approved, (B) a full opening on the first attempt and card-only on RETRY, (C) a compressed 4 s sweep. Each shows its measured time to the first menu.
9. **NEW-C1, a Ch IV stalemate** (FFX-2). Only if the Steam check confirms the stall is faithful: a coach or guide line teaching the spherechange, versus a long-stalemate defeat with results and RETRY.
10. **Only if the driver judges them new rather than restored** (optional, one before/after frame each): PR-0181 summon staging (party gone versus party dimmed), PR-0157 (fade versus shift), PR-0104 (cut-in as now versus held), PR-0029 (Yu Pagoda letter chip versus letter on the plate only).
11. **Critic proposals** (rule 10), mocked only on a yes: a Chapter XII disc-turning coach line (FFX), and a visible whole-menu hold under Wait (FFX-2).
12. **PR-0160, Al Bhed** (FFX VIII). Only if Bailey wants a cipher: Brother's line as cipher with Rikku translating, versus the reworded English.

---

## 4. Bailey queue (class C), ordered by score impact

★ marks an item that **blocks a category from 9.0**, or blocks a milestone gate, until he answers.

Send item 1 on its own, as a standalone phone listening pack. Nothing else goes in that message; this is the method change the PR-0148 method check calls for. Items 2 to 12 go as one plain decision sheet.

1. ★ **Audio verdict** (PR-0148; audio has no number without it). "Give today's music (title, Seymour, Shuyin, Yojimbo) a number out of 10. Which of control, A, B and C sounds most like modern FF and Clair Obscur? May the AI-restyle layers ship?" Optional extras, only if the pack stays under 15 minutes: SFX loudness A/B (PR-0203), and the Macalania scene pick A, B or C (D-190). *We cannot recommend by ear. If B or C wins, we need a clear yes on whether the AI layers may ship.*
2. ★ **Accessibility settings** (reopens D-005; onboarding stays at about 8.0 to 8.3 without them). "May I show options for a small, all-off-by-default set: text size, reduce motion, reduce flashes, key remap?" *Recommend yes.* It is a save-data change, so it gets a deep review before deploy.
3. ★ **Story read** (the narrative human-judgment gate; D-068, D-085, D-113 and D-145 to D-148). One sheet with every as-built line for IX, XI, XII, XIII, XIV and XV, plus the unbuilt Chapter X Natus Talk lines and callouts, first. Mark keep, edit or cut. *Recommend keeping as built, and putting the Natus lines in.* That also closes PR-0204.
4. ★ **Chapter VII scope** (the "every encounter through its real flow" gate). "Pick Macalania's scene cue by ear, or leave VII out of this milestone." *Recommend picking it in the item 1 pack*, so VII can be listed.
5. ★ **PR-0021 banter bank** (the narrative major). "Is your D-173 pick (the speaker rotates, first line of each bank) the finished form?" *Recommend yes.* The stalled major then closes on a rotation re-test.
6. ★ **PR-0179 aeon HP** (the last combat major), sent with the measured sheet. "Gagazet aeons at the sourced §6.4.3 rows. Should X and XIV inherit them, or keep your D-186 presets labelled as estimates?" *Recommend arm (a).*
7. ★ **One Steam HD session, about 30 minutes, at a time he picks** (feel major PR-0180, plus PR-0170, 0209, 0124, NEW-C1, 0106, GP-G2 and 0217). Where FFX prints enemy action names; the one-target cursor; immune hits and chains; dressphere carry at a seam; a lone White Mage against Bahamut; the Leblanc failsafe; Alchemist variance; Zombie through KO. *Recommend yes.* No retail frames are saved.
8. ★ **PR-0061 and D-138** (the feel major). "May the critic count your approved 2.2 s card and 3.8 s sweep as authored beats, and judge only what is left over (about 1.5 s at most, and a Confirm press reaches the menu in about 4 s)?" *Recommend yes.*
9. **Chapter 4 pause plate** (a failing required target since round 04). Show the smiling tile next to the shipped sorrowful painting. Both were hash-locked. "Which is Chapter 4's plate?"
10. **PR-0167.** "Does the Until Dawn pause supersede the old v5 and v6 pause tiles?" *Recommend yes.* That moves three tiles off "waiting".
11. **PR-0060.** "Yu Yevon's speaker portrait: keep it with a line, drop it, or none?" *Recommend none.*
12. **PR-0099.** "May chapters that borrow music as stand-ins count as finished, or does each need its own cue?" *Recommend own cues for 9.6*, composed after the item 1 pick.
13. **PR-0203.** "Lower the effects, for new players only or for existing saves too?" *Recommend lower, new profiles only*, unless he says otherwise.
14. **PR-0133, the XI epilogue.** "Stand Leblanc, Ormi and Logos for their lines, as XII and XIV do?" *Recommend yes.*
15. **PR-0037.** "May bench characters speak mid-battle lines?" *Recommend "fielded only, with an authored fallback".* It is the more faithful answer; closing it as intended is the cheaper one.
16. **PR-0160.** "Chapter VIII: reword Rikku so she does not repeat Brother, or show Al Bhed cipher?" *Recommend the reword.*
17. **GP-G2.** "Alchemist fixed damage exact, per GameFAQs, labelled as our estimate?" *Recommend yes.*
18. **PR-0217 and PR-0054.** "Use the GameFAQs reading, labelled, where research is silent?" *Recommend yes*, if the Steam session does not settle them first.
19. **FOC19-04.** "Do the Den of Woe's per-shade rewards add up?" Settle it in the Steam session or from GameFAQs.
20. **Play sessions for 9.6** (CHK-B2 and B3, difficulty, a real newcomer, a real phone). After release 22: ten minutes on Chapter IX or I, one hard chapter (XIII or XV), one FFX-2 aftermath, and a friend's cold run on a phone. *Required for 9.6, not for 9.0.*
21. **PR-0058 and PR-0161** options sheets (§3). *Recommend* a COMM plate for Shinra, D-043's Brother A for FFX VIII, and option (a) for the Farplane voice.
22. **PR-0206**, only if the repro lands there: "A one-line 'no move to suggest yet' card at the first decision?" *Recommend yes.*
23. **PR-0028.** "H: hide every panel, or rename the legend?" *Recommend renaming.*
24. **FOC-06**, only if the method check lands there: "At 1280x720, all rows at 12 px, or fewer rows at 14 px?" *Recommend fewer rows at 14 px.*
25. **Critic proposals:** the Chapter XII disc coach line (*recommend yes*) and a visible whole-menu hold under Wait (*recommend no*, to keep D-029 and D-121).
26. **Critic policy:** coach copy fixes classed as focused rather than deep. *Recommend yes.* It is a change to review depth, so it is his call.

---

## 5. Method checks (class D, stalled; rule 15)

Each is one page, written before the third try. Each gives the current route, why it stalled, the alternatives, and the smallest test that tells them apart. They are paper-only and can be written in parallel today.

| File | Issue | Crux |
|---|---|---|
| `docs/plans/pr-0179-method-check.md` | PR-0179 | Stalled because Bailey was asked an abstract question. Switch to the boss-side rule: three sourced arms built as OFF switches and measured, then one question. |
| `docs/plans/pr-0181-method-check.md` | PR-0181 | Cause traced: `summon()` adds the aeon beside the party, at 0.7x the enemy scale. Canon §6.1. The only open point is whether it is restored canon (default) or a new look (§3 item 10). |
| `docs/plans/pr-0031-method-check.md` | PR-0031 and PR-0178 | Probe TargetHighlight `dimOf` and the rings at the Ch III target step. Either they are live but illegible (raise them toward the s2 frame), or they are absent (find the missed call). The FFX plate does not exist and must be built. |
| `docs/plans/pr-0095-0094-method-check.md` | PR-0095 and PR-0094 | `partRingSnapshot()` at links 3 and 4 separates invisible, unstaged and off-screen. Record the link-4 card box against the head-quad box. |
| `docs/plans/pr-0157-method-check.md` | PR-0157 | Fade (cheap, deterministic) versus projected shift. |
| `docs/plans/pr-0061-method-check.md` (a round-13 addendum) | PR-0061 | A seed-pinned split into approved beats, Confirm-skippable time and dead time. The D-138 calibration case goes into `critic/calibration/cases.json` once Bailey answers queue item 8. |
| `docs/plans/feel-review.md` | the feel category (7.8 twice) | Two batches did not touch either major. This batch does. |
| `docs/plans/foc-06-method-check.md` | FOC-06 | Render at 14 px on every row at 1280x720, 1600x900 and 2000x1012, and count what is shed. |
| `docs/plans/pr-0148-method-check.md` | PR-0148 | Six rounds were lost to bundled asks and "all your recommendations". Send one standalone two-question pack, and never read a recommendation as an ear verdict. |
| `docs/plans/pr-0180-method-check.md` | PR-0180 | Blocked on a source, not on code. Build the banner behind an OFF switch and source it via Steam or GameFAQs. |
| `docs/plans/pr-0109-method-check.md` | PR-0109 | Five reviews with the cause traced. Why no batch picked it up (no owner), and the fix. |
| `docs/plans/pr-0206-method-check.md` | PR-0206 | Repro attempts used the wrong seed. Replay the recorded board after PR-0202. |
| Short paragraphs inside the batch handoffs | PR-0100, PR-0099, PR-0039, PR-0021, PR-0126, PR-0001 | 0100: filter dist and keep audition local. 0099: rows now, cues after the direction pick. 0039: fold into the re-render. 0021: re-test against D-173 and move the bank to Proposals. 0126 and 0001 already have picked fixes. |

No new work: PR-0153 and PR-0123 are fixed in release 19, and PR-0035 is settled by D-167. Round 14 records all three.

---

## 6. Coverage work for round 14 (so that no category is capped by missing evidence)

Round 14 is the deep review owed by ce05b02c, run on the live build (or on release 21 if that deploys first). It uses batch 5's harness. Its brief cites D-197 (FOC18-01 decided), D-167 (PR-0035 settled), D-193 and D-198.

**Combat**
- Re-run the round-13 ic-scan on new live Chapter V logs, extended to count immune "miss" events. Expect 0 wraps.
- Seeded acceptance case: Darkness KOs redoubt-r on hit 1, then redoubt-l and the Head each take one hit.
- Count Acta heals on the Head in live V logs. Expect 0.
- Bench menu-cancel "menus invalidated" at 1 s on IV, V, VI, XI, XIII and XV, and prove by real keys that a plain hit leaves the menu open and a Delay ability closes it.
- Audit Chapter XV's combat data against research/ffx2-gippal-den-of-woe.md (including D-191's estimates and 268311cf's timed statuses).
- Record a formula coverage matrix per game.

**Encounter and delivery**
- Real-key wins with the seed recorded for III (a pinned seed and a drawn seed), VI, VIII (now possible with the Orders widget), IX and XIII.
- Losses with RETRY for VI, VIII, XV (1600x900) and the XIII Trema checkpoint.
- A three-line bench table (intended line, advisor top row, one credible mistake) for every listed chapter in both games.
- VII as Bailey rules (queue item 4).
- Fold in the ce05b02c Leblanc, Den and Trema captures with a dependency argument.

**Visual**
- CHK-013 in-game pass on XV and on the 23 new FFX-2 poses (D-195 listed as accepted).
- The CHK-008 and CHK-011 specs, portraits.spec over every roster (CHK-012).
- At least one non-16:9 shape per chapter.
- Target-versus-build composites for every unverified tile: Swordplay, Shiva after her arrival, the Shuyin portrait (walk the V post line by line), Yojimbo's look, and the Yojimbo hero plate.
- An FFX-2 target capture (CHK-010 FFX-2 half) with a Gunner or Warrior.

**Feel**
- Latency probe (keydown to highlight, Confirm to action-start) on an idle host for I, IV, IX and XI.
- XV timed sequences.
- Menu-cancel timed sequences, together with the PR-0104 check.
- The Isaaru party action and the XII sending motion.
- One FAST Chapter V measurement to close PR-0081.

**Narrative**
- A full dialogue-timeline walk of every listed chapter: pre, every mid trigger, post, results line and epilogue. It must name the V coda, the XIV seams, XI links 2 and 3, the IX callouts, the III aftermath, and all of XIII and XV.
- The PR-0021 rotation re-test at attempts 0, 1 and 2 on one profile.
- PR-0187 closed by reuse of the 43dca986 run.

**Audio**
- CHK-023 probes: the Ch I pause resume ×3, and title and board ×20 on an idle host.
- Per-chapter live routing samples (pre, first menu, each seam, aftermath, results) in both games.
- Seam fades and stinger timing.

**Interface and onboarding**
- Shapes 1280x720, 1280x960, 2560x1080, 2560x1440 and 3840x2160 in at least one chapter per game, with the text-size and truncation sweeps.
- Touch at 390x844 (prep, target step, pause, results).
- One gamepad route per game.
- Reduce-motion emulation.
- The CHK-006 four-exit walk for every overlay.
- The CHK-004 advisor-follow at 390x844.
- Composites for the advisor, pause, results and C1, C2, C3 and PR-0012 tiles.

**Prep and delivery**
- Prep agency (tabs, party, equipment) re-exercised.
- The CHK-024 matrix spec run.
- Cold-cache time to the painted title, and frame time with spikes.
- One Firefox and one Edge run.
- Run alone on the host, with no parallel captures.

**Capture-only closures** (issues probably already fixed): PR-0057, 0063, 0014, 0128, 0018 (a 4.5:1 contrast sweep in both games), 0144, 0188, 0127, 0113, 0114 and 0081.

**Calibration**: add one should-fail combat case (the IC-2 wrap on b975397b) and one should-pass case (PR-0007) to `critic/calibration/cases.json`.

---

## 7. The iteration loop

**Each iteration:** batches in worktrees → merge to `main` one at a time (tsc, the touched vitest files, orphans; the full `npm test` before any push) → `node tools/critic-plan.mjs` → a focused review of the candidate → `npm run deploy` from `D:/pyrefly-release` → live verification → the deep review when one is owed → re-triage: update this file's scoreboard and queue from the new round's JSON, and move closed items out.

Two limits apply throughout:
- At most two deploys while a deep review is owed; the third refuses.
- Usage mode per NOW.md, and at most 4 to 5 heavy agents at once.

### Iteration 1 (start now)

1. **Hours 0 to 2, in parallel:**
   - batch 5 (harness);
   - every §5 method check (paper);
   - the audio pack to Bailey, on its own;
   - the one decision sheet to Bailey (queue items 2 to 12, plus the PR-0179 question once its numbers exist).
   - Finish release 21's two branches (PR-0001 with PR-0172 and PR-0120; PR-0201).
2. **Round 14 deep review on live ce05b02c**, with batch 5's harness and the §6 coverage list. This settles the deep obligation carried from 18 builds, so deploys no longer need Bailey's words. It verifies release 19 and 20 fixes, and gives the honest baseline.
3. **Meanwhile, batches 3, 4 and 2 build** (the class-A items first, then the D items whose method check is done). Batch 1 writes its preflight, then builds, with the PR-0179 arms left OFF.
4. **Release 21 = r21 branches + batch 3 + batch 4 (+ the class-A part of batch 2).** A focused review, then deploy.
   - Expected result: interface about 8.7, prep about 9.0, narrative about 8.6, onboarding about 7.8, and audio technical gates green (CHK-023, CHK-001 steps 1 to 3).

### Iteration 2

1. Merge batch 1 (combat engine; focused before deploy, deep after) and batch 2's D items: PR-0181, 0031, 0095 with 0094, 0157, PR-0061 waits, and PR-0180 if it is sourced.
2. Build Bailey's picks: the PR-0179 arm; accessibility settings if he said yes (save-data class, so a deep review before deploy plus the CHK-024 matrix); the options-round winners; the story-read edits and the Natus lines; the audio re-render in his chosen direction.
3. **Release 22** → **round 15 deep review on live** → re-triage.
   - Target: every category at 9.0 or more, with a total of about 9.1 once audio has his number.

### Iterations 3 and later (toward 9.60)

- Close every remaining polish item.
- Get CHK-008, 011, 012 and 014 automated and green.
- Reach 69 of 69 targets matched.
- Record Bailey's Steam-session answers as sourced research lines, each followed by a class-A fix.
- The owed chapter cues, and the per-cue ear sign-off tour.
- The play sessions of queue item 20.
- Each deep round samples unchanged mechanics in both games against the coverage matrix.
- **Stop rule:** two iterations with no category movement means a written method check for that category before a third (rule 15).

---

## 8. Iteration 2 additions (Bailey's yes, 2026-09-26 ~16:00 EDT)

Bailey answered the driver's 16-item sheet (2026-09-26 ~15:45 EDT) with "I'll go with
all of your recommendations." Each accepted item below is also recorded as its own
decision in `docs/target/decisions.json` (D-202 to D-219; D-200 and D-201 stay
reserved for the phone picks the release 21 merge will record). Batch ownership is
from §2; an item waits for the batch (or in-flight branch) that owns its files to
merge to `main` before it can be built there, per the shared-working-tree rule
(never touch another batch's files).

| Item | Game (rule 14) | Files it touches | Waits on | Acceptance check |
|---|---|---|---|---|
| Natus Talk lines (PR-0204, D-203) | FFX only | `src/story/**` (Chapter X script), `src/data/` guide/callout rows for Chapter X | Batch 4 merge | The three drafted lines and their callouts appear in a real-key Chapter X run; the dialogue-timeline scene walk (round 14, §6 Narrative) lists them; a unit test in the story suite. |
| Banter rotation re-test (PR-0021, D-204) | both | `src/app/screens/ResultsScreen.ts` and the results CSS | The `r21-results-phone` branch (owns these files; PR-0001 option B lives there) | At attempts 0, 1 and 2 on one profile, the results screen serves each bank's first line with the speaker rotating per chapter, Chapter III's card staying quiet, matching D-173 exactly (docs/plans §6 Narrative coverage item). |
| SFX lower for new profiles only (PR-0203, D-210) | both | `src/audio/AudioManager.ts` (batch 4 owns it only for unlock logging — the volume/profile change is new scope there) and the save schema/profile fields in `src/app/SaveData.ts`, which **no batch in §2 currently owns** | Batch 4 merge for `AudioManager.ts`; flag `SaveData.ts` to whichever batch or a dedicated small change picks it up, since it is unclaimed in §2's ownership table | **Save-data class** (AGENTS.md "Release": anything that can lose or change save behavior) — gets a deep review before the deploy that ships it, plus the CHK-024 upgrade matrix (PR-0195, batch 5) re-run so old saves keep their existing (louder) effects level and only new profiles default lower. |
| XI epilogue staging (PR-0133, D-211) | FFX-2 only | `src/story/**` (Chapter XI epilogue script) | Batch 4 merge | A real-key Chapter XI epilogue run stands Leblanc, Ormi and Logos for their lines, matching how XII and XIV already stage their casts; story-text lint (CHK-007) still passes. |
| Fielded-only speakers with fallback (PR-0037, D-212) | both | `src/story/**` (mid-battle line dispatch, `dsl.ts`) | Batch 4 merge | Within one frame of a bench-vs-fielded check, a benched character never delivers a mid-battle line; the authored fallback line fires instead. Unit test per game. |
| Chapter VIII Rikku reword (PR-0160, D-213) | FFX only | `src/story/**` (Chapter VIII script) | Batch 4 merge | Rikku's Chapter VIII lines no longer repeat Brother's cipher lines verbatim; the story-text lint and a names-hidden re-read (per the VIII acceptance check in §2 batch 4) both pass. |
| GameFAQs-labelled data (GP-G2, PR-0217, PR-0054, D-214) | GP-G2 and PR-0054 are FFX-2 only; PR-0217's game is unconfirmed in the sources reviewed here (flag for the Steam session, D-205, or research before coding) | `src/data/ffx2/**`, `src/battle/ffx2/**` | Batch 1 (paper preflight, then merge) | Each fixed value cites its GameFAQs source and is labelled "our estimate" in a code comment and in `research/*.md` if a row is added there (rule 6); a unit test asserts the labelled value. |
| H legend rename (PR-0028, D-215) | both | `src/app/screens/pause/**` (the legend/HUD hint copy) | Batch 3 merge | The H hint text names exactly what H does (hide every optional panel, per the Until Dawn pause's existing behaviour); no copy still says something H does not do. |
| Chapter XII disc-turning coach line (PR-0197 family, D-216) | FFX only | `src/engine/tactics/**` (PR-0197's disc-ranking logic, batch 3) and `src/ui/coach/**` (the coach line itself, batch 4) | Both batch 3 and batch 4 merge, in that order (the coach line reads the tactics ranking) | Over the same 40-seed advisor-top-row bench PR-0197 uses, the coach line appears when a disc turn is the top-ranked move, and never contradicts the advisor's own top row. |
| Chapter V checkpoint at Shuyin (D-217) | FFX-2 only | Via Trema's checkpoint seam: `src/app/screens/BattleEncounterChain.ts`, `BattleChainCheckpoint.ts` (batch 1) | Batch 1 (paper preflight, then merge) | A real-key Chapter V run reaches a checkpoint at the Shuyin seam; the checkpoint and its handoff note are explicitly labelled as an adaptation, not a sourced rule (rule 6). |
| Critic policy for coach copy (tools/critic-plan.mjs, D-219) | both (process rule, not game-specific) | `tools/critic-plan.mjs` (owned by `t1-b5`) | `t1-b5` merge | `tools/critic-plan.mjs` classifies a coach-copy-only change as `focusedBeforeDeploy`, never `deepBeforeDeploy`; covered by `tests/unit/critic-release-rules.test.ts`. |
| Accessibility build (PR-0032, D-202) | both | Cross-cutting: the options-round UI (batch 3/4 CSS and screens) plus `src/app/SaveData.ts` for the stored settings (unclaimed in §2, same gap as the SFX item above) | The options round (§3 item 5) must run and Bailey must pick first; then whichever batch's files the picked layout falls in, plus SaveData.ts | Save-data class: a deep review before the deploy that ships it (AGENTS.md "Release"), all-off-by-default, and the CHK-024 upgrade matrix confirms an old save boots with every setting off. |
| Each chapter's own cue (PR-0099, D-209) | each cue keeps its own chapter's game tag (VI, XI, XIII, XV are FFX-2; VII, X, XII, XIV are FFX) | `public/audio/**` (new renders) and `docs/audio/THEMES.md` (batch 5's docs-half rows land first) | The audio direction pick (§3 item 6, "Only after item 6's pick") | `tools/audio/themes-audit.mjs` finds a THEMES.md row and a matching audio file for every listed chapter; no chapter still plays a stand-in cue. |

### Iteration 2, 2026-09-26 ~17:30 EDT: the accessibility pick and the Sensor line

Bailey answered the driver's two follow-up questions with "Yes I'll go with your
recommendations for all," picking option C for the accessibility options round and
approving the FFX Sensor-immune help-bar line. Each is its own decision in
`docs/target/decisions.json` (D-220, D-221) and D-220 also has a target tile
(`docs/target/targets.json`, group `pause`). Neither is built; both wait on the
batches that own their files, per the shared-working-tree rule.

| Item | Game (rule 14) | Files it touches | Waits on | Acceptance check |
|---|---|---|---|---|
| FFX Sensor-immune help-bar line (D-221, supersedes D-196) | FFX only | `src/ui/ffx/SensorPanel.ts` and its help-bar text; the same file PR-0170 and PR-0180 (§9, `t1-b2a`) already touch | Batch 2's `t1-b2a` merge (no other batch touches `src/ui/ffx/**` meanwhile) | On a Sensor-immune target (e.g. Isaaru, Yojimbo, Daigoro, Mortiphasm, Yu Yevon, Spherimorph per `research/ffx-yojimbo.md` and `research/observed-ffx-steam-2026-09-26.md` §2.3), the panel shows the enemy's name with the caption "Immune to sensors." instead of hiding; a unit test covers at least one such enemy; FFX-2's Trema Sensor immunity is untouched. |
| Accessibility build, option C (PR-0032, D-220) | both | `src/app/SaveData.ts` (new Settings fields; **unclaimed** in §2, same gap as the SFX item above) for the schema; `src/app/screens/pause/**` (`t1-b3b`) for the SETTINGS column rows and the first-launch comfort card; `pause/keys.ts` (`t1-b4a`) so a remapped key stays out of the pause's raw-key collisions; the title/frontend screen that shows the comfort card (`t1-b3b` / `t1-b4a`); the presenter ports (`BattlePresenterPorts.ts`, batch 2) for REDUCE FLASHES, never the pure presenter (hard rule 1); both games' battle HUDs for TEXT SIZE, including FFX-2's own 130% layout pass (not yet measured, per the README) | `SaveData.ts` needs an owner assigned before it is touched (flag per the SFX row above); then `t1-b3b`, `t1-b4a` and batch 2 merges, in whichever order their files land | Save-data class: a deep review before the deploy that ships it (AGENTS.md "Release") and the CHK-024 upgrade matrix confirm an old save boots with every setting off; all four settings default off; the comfort card shows once at first launch and never again; the FFX-2 HUD holds at 130% without clipping (see `docs/concepts/accessibility-2026-09-26/README.md` "What 130% does"). |

**Note on unclaimed files:** `src/app/SaveData.ts` is not listed under any of the five
batches in §2. Both the accessibility build and the SFX-per-profile change need it.
Whoever picks either item up should add it to their batch's ownership list in §2 (or
take it as a small, separately-reviewed change) before editing it, so it is not
touched by two batches at once.

### Iteration 2, 2026-09-26 ~18:45 EDT: the Yojimbo faithfulness pick and four presentation questions

Bailey answered the driver's questions (2026-09-26 ~18:40 EDT) with "I'll go with
all of your recommendations": `docs/plans/yojimbo-faithfulness-2026-09-26.md`
(c728ac8a) P-1 and P-2, and `docs/plans/presentation-program-2026-09-26.md`
(c0edc5c1) C-1, C-4 and C-7. Each is its own decision in
`docs/target/decisions.json` (D-222 to D-226); D-222 partly supersedes the Doom
half of D-056 and D-066 (both marked `partly superseded`, text kept, not deleted,
per the shared-working-tree rule). None is built yet; each waits on the batch (or
branch) that owns its files, per §2's shared-working-tree rule.

| Item | Game (rule 14) | Files it touches | Waits on | Acceptance check |
|---|---|---|---|---|
| Yojimbo P-1: `cavernDoomPrep` = `not-learned` (D-222, re-opens D-056/D-066) | FFX only (Ch IX, Lady Ginnem's Cavern of the Stolen Fayth) | `src/data/ffx/builds/yojimbo-cavern.ts` (the named switch) | Branch `yojimbo-pick-0926`, not yet merged to `main` | Yojimbo-faithfulness §3.2's bench (200 seeds, real engine) reproduces first-try win rates in the same ballpark as the intended line's 161/200 (≈80%) and 200/200 within five with no pre-loaded Doom; the advisor's separate Gem-based route is unaffected; no Yojimbo-side number (HP, Defense, gauge rates, bands, Zanmato) changes (rule 6). |
| Yojimbo P-2, option (b): the Doom objective shows as a hidden "???" line (D-223) | FFX only (Ch IX) | `src/data/chapter-meta-yojimbo.ts` and the chapter-card UI that reads its objectives | Batch 4 merge (owns `src/data/chapter-meta-*.ts`) | In a real-key Ch IX run, the "Doom Yojimbo" objective reads "???" until either Doom lands on Yojimbo or the player has lost the fight once on that save/profile, then reveals its real text; the other two objectives (Survive Zanmato, Defeat Yojimbo) are unchanged; a unit test covers the reveal transition. |
| C-1 phase lighting, option (A), the reduced version (D-224) | Both, canon triggers only (FFX: Flux's Reflect at 50%, the Mortiorchis charge ladder, Yunalesca's forms, Anima, Cid moving the ship; FFX-2: the Mega Flare countdown and the Vegnagun part links) | `src/engine/Renderer.ts`, `src/engine/ScenePalettes.ts`, a phase hook through the Ports | Batch 2 merge | On each listed canon trigger, a real-key capture shows a hand-tuned hue/exposure grade, fog, floor glow and a rim/bounce tint on the cast, tweened over about 1.5s, with no more than 3 flashes per second; the reduce-flashes accessibility tier skips the tween entirely; the approved phase-lighting tile's `after.png` is re-shot to match option (A) before it is called delivered (rule 9). |
| C-4 pyreflies follow the sources (D-225) | Macalania and Gagazet FFX (Ch III/VIII); Leblanc FFX-2 (Ch VI) | `src/engine/Particles.ts`, `src/scenes/*.ts` (except `farplane.ts`, which waits for `r21-road-phone`) | Batch 2 merge, after A-5's emitter | Macalania's motes by the Chamber door hold until Seymour's death rather than appearing early; Leblanc's room shows no pyreflies (its magenta motes are removed); Gagazet keeps today's snow-and-glitter treatment with no pyreflies added; a per-scene canon-row unit test (A-6) covers all three. |
| C-7 Trema's victory pose: settle from GameFAQs per D-214 (D-226) | FFX-2 only (Ch XIII, Via Infinito) | The GameFAQs reading itself (research, not code); once recorded it feeds A-4's `victoryPose` port default for Trema in the relevant `src/data/chapter-meta-*.ts` row | The GameFAQs research read (not yet done); then batch 4 merge for the data row | `research/*.md` gains a line, cited to GameFAQs and labelled "our estimate" (rule 6), on whether Trema is a "Via Infinito special boss on first defeat"; until then Trema's `victoryPose` stays at A-4's default, `'pose'`, per the plan's "keep the pose until then." |

### FFX-2 sourced answers (research ca5bdde3, 2026-09-26)

Commit `ca5bdde3` sourced four FFX-2 questions the Steam session could not reach
(immune-hit chains, dressphere carry at a seam, Leblanc's failsafe line, a lone
White Mage vs Bahamut). All four are **FFX-2 only** (rule 14) and their files sit
inside Batch 1's ownership (`src/battle/ffx2/**`, `src/data/ffx2/**`,
`src/app/screens/BattleScreenSetup.ts` / `BattleScreenCarry.ts`), so none of them
build until Batch 1 merges to `main` (shared-working-tree rule). Where the cited
research is silent, the reading is GameFAQs', labelled "our estimate" per Bailey's
2026-09-26 rule (D-2xx item 13). Per `boss-side-fix-needs-measured-options`, each
item that changes difficulty is built as a named, defaultable switch and measured
on every FFX-2 chapter (VI, XI, XIII, XV, plus any others with the affected
system live) at both human pace (Wait split and Active) and bench speed, then put
to Bailey once, together, with the numbers and a recommendation, before any of
them ships.

| Item | Game (rule 14) | Files | How to build | Measurement owed |
|---|---|---|---|---|
| PR-0209 / IC-1: immune-hit chain skip (`IMMUNE_HITS_SKIP_CHAIN`) | FFX-2 only | `src/battle/ffx2/**` (the chain-hit resolver) | Add `IMMUNE_HITS_SKIP_CHAIN` as a named, defaultable switch (default off, current main behaviour) per Split_Infinity FAQ G1032, our estimate, `research/ffx2-combat-core.md` section 10; keep the existing menu correction on when the switch is on. | Measure switch on vs off on every FFX-2 chapter (VI, XI, XIII, XV) at Wait-split human pace, Active human pace, and bench speed; report chain length and turn-count deltas with a recommendation before it ships. |
| PR-0124: dressphere carry across a linked battle | FFX-2 only | `src/app/screens/BattleScreenSetup.ts` (`carryFfx2`), `src/app/screens/BattleScreenCarry.ts` | Add a named, defaultable switch so a dressphere changed mid-battle carries into the next linked battle in `BattleScreenSetup.carryFfx2`, per KADFC FAQ 38278 + one board post, our estimate; gate effects and special-dressphere unlocks do **not** carry (2 sources agree on that half). Scope to the chained encounters: Chapters V, VI, XI, XIII, XV. | Measure with the switch on vs off across every chained encounter in Chapters V, VI, XI, XIII, XV, at Wait-split human pace, Active human pace, and bench speed; confirm gate/unlock state never carries in either mode; report deltas and a recommendation before it ships. |
| PR-0106: Leblanc failsafe timing + turn-5 correction | FFX-2 only | `src/battle/ffx2/**` (Leblanc's pattern/failsafe logic), `src/data/ffx2/**` (her data row) | Add a named, defaultable switch so Not-So-Mighty Guard's failsafe fires once on turn 25 plus on a No Love Lost use, not every turn after, per SinirothX's extracted data (single source, our estimate), `research/ffx2-leblanc-syndicate.md` section 19; correct pattern turn 5 to Fan Slap per the same source, flagging the conflict against research section 5.3 and the wiki rather than silently overriding them. | Measure switch on vs off on Chapter VI (Leblanc's chapter) at Wait-split human pace, Active human pace, and bench speed; report fight-length and damage-taken deltas plus the turn-5 conflict, with a recommendation before it ships. |
| NEW-C1: lone White Mage vs Bahamut tactic/advisor | FFX-2 only | `src/battle/ffx2/**` (tactics/advisor rules), tests only elsewhere | No rule change. Update the tactic/advisor so a lone fielded White Mage uses Esuna, then falls back to spherechange, items, or a Garment Grid spell, per `research/ffx2-combat-core.md` section 10; keep the existing decision cap in tests. | Not difficulty-changing (advisor behaviour only) — no chapter measurement owed; cover with unit tests asserting the Esuna-first, capped-decision ordering. |

Each switch above defaults to current main behaviour until Bailey's single combined
go-ahead; ship a switch turned on only after that conversation, and record the
outcome as its own decision in `docs/target/decisions.json` alongside the D-2xx
range already in use.

---

## 9. Steam session 2026-09-26: answers

The driver ran the FFX leg of the Steam HD Remaster session (queue item 7)
this afternoon: the community save pack, save 52 "Macalania Woods - Lake
Road", the Spherimorph battle, party Tidus/Auron/Lulu, default config. Full
write-up: `research/observed-ffx-steam-2026-09-26.md`. Pointers also added to
`research/ffx-combat-core.md` (new dated addendum) and `research/ffx-yojimbo.md`
§2.3 (dated correction note). The FFX-2 legs of that session's plan
(PR-0209, PR-0124, PR-0106, NEW-C1, GP-G2, PR-0217/0054) were **not** run this
pass — see `docs/plans/steam-session-2026-09-26.md` for what is still open,
including a blocking observation (no random encounter reached in 30 s in the
Via Infinito on the FFX-2 community saves).

| # | Item | Answer |
|---|---|---|
| 1 | **PR-0170** (one-target cursor, FFX half) | Retail FFX still shows a target cursor and waits for a confirm press even with exactly one valid target. Our engine's auto-fire on a lone target is a sourced faithfulness bug. |
| 2 | **PR-0180** (enemy action names) | Retail FFX names a non-attack enemy ability, centred, in the top HELP bar for the span of the action (about 1.5 to 2 s observed on Fire), and names nothing for a plain attack. `actionBanner.ts`'s OFF switch is now sourced. |
| 3 | **D-196** (Sensor-immune text) | Retail FFX prints "Immune to sensors." in the HELP bar when a Sensor-immune enemy is targeted. `research/ffx-yojimbo.md`'s older "Scan and Sensor show nothing" note was incomplete for Sensor; Scan itself was not observed and stays open. Flagged for whoever owns D-196, not rebuilt here. |

**Reclassification for iteration 2:** both **PR-0170** and **PR-0180** move
from class **D** (stalled, blocked on a source) to class **A** (sourced;
build now), per §2's class definitions. Both live under `src/ui/ffx/**`
(`CommandMenu.ts` / `CommandMenuLogic.ts` / `TargetCursor.ts` for PR-0170;
the new `actionBanner.ts` for PR-0180), which **Batch 2** owns in §2's
ownership table. That batch is currently running as `t1-b2a`, so neither fix
lands until `t1-b2a` merges to `main` (shared-working-tree rule — no other
batch touches `src/ui/ffx/**` in the meantime). Iteration 2's merge list in
§4 should pick up PR-0180 as sourced-and-buildable rather than "if it is
sourced," and add PR-0170 to Batch 2's table in §2 alongside it.
