# Pose continuity: the method check before a third try

Written 2026-10-26 (overnight), branch `plans-pose-continuity`, from `origin/main` 2481843fe (records through release 64). Rule 15 and `critic/RUBRIC.md` sections 8 and 9: two reviews that leave the same issue open at the same severity mean a written method check before a third similar batch. `npm run critic:status` prints PR-0379, PR-0380, PR-0459 and PR-0481 as STALLED (open in rounds 28 and 29), with PR-0512 beside them. This is that check. **No product code changed. Nothing was run in a browser: every number below is read from files already on disk** (the release-64 focused run `critic/reviews/e9907cad8-focused/continuity/`, the deep review round 29, the R63-M1 trace), with small scripts that only read JSON.

> **Bailey, 2026-10-04:** "As poses change for the characters their size changes too sometimes and that looks really bad."
> **Bailey, 2026-10-22:** "Pose continuity needs to be tight. It needs to be impressive. That's one thing that easily dimishes from the whole experience."
> **Bailey, 2026-10-25 ~23:45 EDT (decision 205):** "im aboiut to go to sleep i'll go with all your recommendations and i delegate all decision making to you for now. just keep going please!"

**Game case (rule 14).** The swap plumbing, the harness and the smear are shared: **both games**. The numbers come from FFX Chapter I (Seymour Flux; Tidus, Yuna, Auron, Kimahri, Mortiorchis) and FFX-2 Chapter IV (Bahamut; Yuna, Rikku Dark Knight, Paine Warrior), the two chapters that carry the conference pack. Per item below: the ready-idle-ready flicker is **FFX-2 only** (Chapter I has none); Auron's close-up is **FFX only**; the Rikku Dark Knight and Paine Warrior ready paintings are **FFX-2 only**; the 120/144 Hz shake and the rig program are **both**. The sources do not say which pose a character shows while waiting for a turn (nothing in `research/` names it), so nothing here changes which painting shows; it only stops a repeat.

## 1. The short version

1. **The size half is solved; the swap half is not.** Release 38 (the harness baseline, Chapters I, IV and VIII, not like for like): 297 swaps over the head tolerance, 868 of 1,025 standing swaps over 2 px of feet, 230 jerks of 40 px or more, 94 percent of swaps with a double image. Release 64 (focused run, Chapters I and IV): head over 3 percent on 3 swaps (two are Auron's in the pro camera's close-up; the third is Yuna's idle to hurt at 1.0316 while she is off the view) and 0; feet over tolerance on 0; gated swap jerks of 40 px or more on 2 and 1; double image on 51 and 63 percent of counted swaps (worst severity 0.33 and 0.34 against 0.47).
2. **The deep review measured the tool, not a new break.** Round 29's 4.67 and 7.51 snaps a minute (and the tag "regression") came from a harness tree of 2026-10-10 that has no planned-smear support. The same build, read by the release tree's harness, has **0 snaps** and 32 and 39 planned hard cuts (about 5 and 6 a minute). The cuts are real; they are Bailey's 2026-10-22 pick from a description, and no record shows him judging them in motion.
3. **The biggest class was never aimed at.** Idle to ready and back is 36 percent of Chapter I's see-through frames and 55 percent of Chapter IV's. In Chapter IV, 22 times in 6.3 minutes a girl about to run in shows **ready, idle for about 100 ms, ready again**, then lunges: 295 of the chapter's 931 ghost frames (32 percent). The smear skips a figure at rest, the aligned dissolve and the held cut were tried on swaps in general, and the gate's severity line (0.40) sits above anything measured (0.34), so none of it could turn the gate or the eye.
4. **One number held still across both tools: ghost frames per minute** (Chapter I 99.6 deep / 101.7 focused; Chapter IV 152.5 / 147.4: two different runs of one build and seed, 2.1 and 3.5 percent apart). Swaps counted (213 against 334, 308 against 408), the share of swaps with a ghost (80 against 51 percent) and the snap count (4.67 against 0) did not. Ghost frames per minute is the target; the other numbers are reported, not chased.
5. **Choice (RUBRIC section 8): change method.** Pin the measuring tool; take the swaps by class, flicker first; judge each class with one motion clip; split the two composite tickets (PR-0380, PR-0459) so each can close; leave the rigs for last and only on motion clips. Section 7 is the order.

## 2. What each stalled issue has been through

| When | What | Result on release 64 |
|---|---|---|
| 2026-10-04 | CHK-026 and CHK-027, the caps (D-420 to D-426) | The measuring tool. Baseline release 38 above. |
| 2026-10-05 to 10 | Head lock and registration of the poses (`r39-posescale`, `r391`) | Heads on registered poses match: 0.2 percent where a head is registered, Chapter IV. |
| 2026-10-16 and 17 | The permanent fix W0 to W4: census, `pose-gate`, waiver ledger, one installer, fail-safe runtime (`PoseTrust`), height and feet readings from the pixels, jerks split into swap jerks and dashes, the ruler (`docs/handoff/pose-continuity.md`, `docs/plans/pose-continuity-review.md`) | Feet over tolerance 868 to 0. Closed what it aimed at: art that was never registered or measured. |
| 2026-10-17, release 53 | Lunge first frame on `reachOffset` and the 1/40 s animation clock: ON. **Aligned dissolve** (`?swap=aligned`): measured better on double images and jerks, worse on feet (bodies slide for 120 ms): OFF. **Held-frame cut**: removed (37 swap jerks of 40 px or more in Sinspawn Gui against 19, and snaps) | Two of the three remedies for the at-rest blend ended unused (`src/engine/PoseSwap.ts` header). |
| 2026-10-19 | Kimahri's rig on: "looks like crap" in motion; rigs OFF; AI 3D models rejected (four times) | No figure rigged in the party. Boss rigs (Seymour Flux, Bahamut) cross-fade 40 ms: PR-0478, then cuts under the smear. |
| 2026-10-22 | The motion pack: **paint smear** on a moving figure's big swaps ("Cut on the motion peak with a smear"), rig key changes as cuts, the KO cut, the settle | 32 and 39 painted-figure hard cuts, 111 and 106 boss-rig flips; the dominant class (swaps at rest) is untouched, because the smear skips a figure at rest. |
| 2026-10-22 to 24 | 20 poses repainted "canon A, locked to the idle" (Yuna 5, Kimahri 5, Rikku Dark Knight 5, Paine Warrior 5), installed in release 64 | Rikku DK's ready was not in the batch; Paine's ready was, and still reads as another costume (PR-0517). |
| 2026-10-24 and 25 | R63-M1: four harness words (unseen figures skipped, elastic smear window, planned cut excused up to half the drawn height, common-mode dashes reported not gated), commit fa56fd4e3 | Release tree: 0 snaps. The review tree never got them (section 3.1). |

Issues: **PR-0379** (see-through blends) open in rounds 26 to 29. **PR-0380** (jerks and snaps) carried from round 27. **PR-0459** (size) carried from round 27. **PR-0478** (boss rig double body) rounds 26 to 28, not raised in round 29. **PR-0517** (ready poses) new ID in round 29, same mismatch carried for Paine since release 63. **PR-0512 / PR-0522** (the tool) open in rounds 28 and 29. **PR-0481** (fight start) rounds 28 and 29.

## 3. The wrong assumptions

### 3.1 "The tool that judges a build is the build's own tool"
Round 29 ran the continuity harness from `D:/pyrefly-r39-int` (HEAD 72973096c, 2026-10-10, branch rel-3944; the release driver's log of 2026-10-25 13:25 says the deep-review workflow script `deep-release-tree.js` hard-codes that tree as its main tree; the script itself was not re-read tonight). That tree has no `smear` block in `critic/policy.json`, no `continuity-unseen.mjs`, and its output has no `smear`, `staleTable` or `poseWaivers` fields. The pose table it read was right (114 subjects; hash e648ba9e is the CRLF file as it sits on disk, 9f168c0f is the same file with CRLF read as LF, which is the R63-T1 fix). Same build, same seed, same chapters:

| | focused run (release tree harness, smear-aware) | deep review round 29 (review tree harness) |
|---|---|---|
| Chapter I snaps a minute (hard cuts) | 0 (32, all planned, 31 excused) | 4.67 (31) |
| Chapter IV snaps a minute (hard cuts) | 0 (39, all planned) | 7.51 (47) |
| swaps counted, Chapter I / IV | 334 / 408 | 213 / 308 |
| ghost frames a minute, Chapter I / IV | 101.7 / 147.4 | 99.6 / 152.5 |
| jerks of 40 px or more counted as failures, Chapter I / IV | 3 / 2 (of 28 and 22 that reach 40 px: 25 and 20 are planned cuts and excused; the rest are 2 and 1 gated swap jerks and one dash each) | 58 / 20 (every one counted; worst 1,275 px, which the round itself calls a camera cut or a teleport) |

This is the third time the tool, not the game, moved a number: round 28 (PR-0512) a stale pose table, release 63 a CRLF hash and unseen figures read as 40,092 px teleports (R63-M1), round 29 a stale tree. PR-0380's tag "regressionVsLive true" and the SHIP reasoning built on it rest on the pack-on against pack-off A/B read by a tool that could not excuse a planned cut; the title's other number, 58 and 20 swap jerks of 40 px or more, is the same difference (the last row of the table). What stays true: the cuts exist, at 5 to 6 a minute, and pack-off trades them for the dissolves of PR-0379.
**Do differently:** stamp every report with the harness commit, the policy hash, the LF-normalised table hash and the probe version; run the deep review's harness from the tree under review (or refuse when that tree's `critic/` is older than the build's); and keep the recording (`CONT_RAW_DIR=<dir>` has the harness save the probe's frames gzipped, as the R63-M1 trace did), so any later tool can re-read the same run: neither the release-64 focused run nor round 29 kept one.

### 3.2 "A see-through blend is the safe default swap"
It passes the gate and fails the eye. The fail line for a double image is severity 0.40, chosen from release 38 to flag the top 1.6 percent; nothing on release 64 reaches it (worst 0.34), so the gate is silent on a thing the fan lens lists as breakers every round (75 instances in round 28; in round 29 the same pattern on Kimahri, Yuna, Paine, Rikku and Mortiorchis, plus eleven snapping breakers). A line that no build is near can neither pass nor fail a repair.
**Do differently:** the target is ghost frames per minute (baseline 101.7 and 147.4), with the severity ceiling set where the eye is (0.30), and one clip per class.

### 3.3 "Each remedy fixes the swap"
Every remedy was aimed at swaps in general, and none at the class that holds the frames. Release-64 focused run, counted swaps by class (script output kept with the plan):

| class | Chapter I swaps / ghost frames | Chapter IV swaps / ghost frames |
|---|---|---|
| planned cut, boss rig flip | 111 / 0 | 106 / 0 |
| planned cut, party figure (a hard cut) | 32 / 0 | 39 / 0 |
| blended, party figure, overlap under 0.5 | 130 / 480 | 252 / 918 |
| blended, party figure, overlap 0.5 or more | 7 / 27 | 4 / 13 |
| blended, painted foe (Mortiorchis) | 44 / 150 | 0 / 0 |
| blended, boss rig key | 10 / 0 | 7 / 0 |
| idle to ready and ready to idle (inside the blended party rows) | 61 / 236 (36 percent) | 118 / 514 (55 percent; Paine and Rikku 427) |
| ready, idle, ready within 300 ms | 0 | 22 / 295 (32 percent) |

The smear covers the first two rows. The aligned dissolve and the held cut were tried on all of the blended rows and left off or removed. The flicker is a presenter repeat (21 of the 22 are followed by ready to attack; the log's nearest event is a damage event, so the exact call is still to be traced), not a design of how to change pose. Backlog M-07 ("every attack shows ready, idle, ready", "NOT re-verified on 64") is verified here.
**Do differently:** the unit is the swap class (section 6, point 1), and each remedy is aimed at one row of this table and measured on that row's ghost frames; a remedy tried on "swaps in general" is not tried again.

### 3.4 "The camera cannot be the cause of a size or jerk reading"
CHK-026 item 1 reads both paintings "through their own planes in the same frame, so the camera cannot be the cause". Under a close lens with yawed planes that is not true. Chapter I, same route and seed (R63-M1 trace, eleven runs): Auron's head across attack to follow to idle reads 0.9228 and 1.0942 (also 0.9295 and 1.0948 in the deep run); with `?camera=off` 0.2 percent; with `?curves=today` 4.8; with `?smear=off` or `?moments=today` still 9.5 and 9.3. A planned cut of 0.41 of Tidus's height reads 133 px with the camera off and 237 px in the push-in. Both tools agree on Auron, so this is not tool drift: the reading itself is projected.
**Do differently:** read a card-space head size (the registered head box times the plane scale, no projection) beside the projected one, gate CHK-026 on the card-space number and report the projected number as a named camera class (PR-0459, step 3); stop writing that the camera cannot be the cause.

### 3.5 "A repaint locked to the idle keeps the costume"
The install gates measure overlap, head and feet; CHK-026 passes a different costume "by construction" (RUBRIC 6a). Nothing measures identity. Paine Warrior's ready was in the release-64 batch and still shows a sleeveless white top, red sash and silver heels against the idle's black jacket and boots, feet about 20 px above the floor line; Rikku Dark Knight's ready was never repainted. Overlap between ready and attack, from the planner's log: Rikku 0.08, Paine 0.12. The GPU repaint keeps identity in about 1 seed of 3 and redesigns weapons (backlog V-06; the 2026-09-21 art lesson: pilot three to five and look before any batch).
**Do differently:** an identity measure (colour distance per body region against the idle, with idle against attack as the ceiling) written before any render, pilots first, and the repaint shown beside "no ready painting" for these two girls.

### 3.6 "One ticket per symptom"
RUBRIC section 8: one root defect is one ticket. **PR-0380** merges at least five roots: the tool (3.1); the design question of the hard cut (CHK-B2, Bailey's); swap jerks of 40 px or more outside the cuts (Kimahri follow to idle 69 px and Tidus hurt to critical 43, both blended swaps with no smear in the log, and 45 px of Rikku's feet at a step of her turn-start twirl, a staged change the harness does not count as a swap); Auron's mid-move head drops (the deep run counted four of 141 to 158 px; the release tool reports Auron's swing as a 113 px dash); the older rig and swap jerks in 11 of 14 other chapters (measured by the stale tool, so an upper bound); and the KO with no fall (PR-0473). It cannot close. **PR-0459** has changed residue each round (round 27 rigs and painted classes, 310 swaps; round 28 unmeasured chapters; round 29 two swaps in a close-up): the registered-figure part is done. A ticket whose body changes every round never reaches "two reviews, same issue".
**Do differently:** split both; close what is closed.

### 3.7 "The smear is what Bailey wants, so it only needs excusing"
He picked it from a description (2026-10-22; both styles "behind a switch, he picks Thursday"). His playtest answer on 2026-10-23 was "Not yet, tonight" (193b), on 2026-10-24 "i still cant play it unfortunately" (200); the driver shipped it (200a). Round 29 lists the judgment as not recorded (CHK-B2). Excusing a cut in the metric is not the same as the look being his.
**Do differently:** judge the cut and a two-frame blend in paired motion clips, per class and per game, before anyone calls the cut his look (PR-0380, step 7); until then the reports call it the driver's shipped default, not an approved one, and the critic's rule for a designed swap is written before the clips are made.

## 4. The baseline (release 64, focused run, release-tree harness, seed 1, 1600x900, pack on)

| | Chapter I (FFX) | Chapter IV (FFX-2) |
|---|---|---|
| battle time, swaps counted, per minute | 387.7 s, 334, 51.7 | 379.1 s, 408, 64.6 |
| snaps / planned hard cuts a minute | 0 / 4.95 | 0 / 6.17 |
| swaps with a see-through frame | 169 | 256 |
| **ghost frames a minute** (worst severity) | **101.7** (0.334) | **147.4** (0.342) |
| swap jerks, of which 40 px or more (worst) / dashes reported (worst) | 4, of which 2 (69 px) / 3 (113 px) | 4, of which 1 (45 px) / 4 (120 px) |
| head over 3 percent / height out of band / feet over | 3 / 0 / 0 | 0 / 1 (Yuna's cast pose reads 1.1164 of her idle's height against the 1.10 ceiling, seen on cast to idle) / 0 |
| frames over 34 ms (longest) | 0.5 percent (346 ms) | 1.8 percent (1,154 ms) |

## 5. The method check, issue by issue

### PR-0379: see-through blends (both games; carried since round 26)
- **Route and why it stalled:** swaps in general were treated (3.3); the class that holds the frames, the party at rest, got nothing; the gate line is above any build (3.2); the share of swaps moved with the tool (3.1).
- **Alternatives:** (A) by class, cheapest first: stop the Chapter IV flicker; lock the two off-costume ready paintings; then judge the at-rest swaps in clips (aligned morph, two-frame blend, cut, hold ready). (B) Rig the three most-swapped figures of each chapter (Tidus 9.9 swaps a minute, Yuna 8.1, Auron 6.4; Paine 17.7, Rikku 15.7, Yuna 13.3) and show them in motion. B is the permanent fix and has no yes yet.
- **Smallest test that tells them apart:** fix the flicker (FFX-2 only, no change of look), re-run Chapter IV with the same seed and tool. Prediction: 931 minus 295 frames, 100.7 ghost frames a minute, no new jerk. If it lands, the class table is right and A proceeds; if not, stop before any art.
- **Choice: change method** (A, flicker first; B stays on the list as its last step).

### PR-0380: jerks and snaps (both games; carried since round 27)
- **Route and why it stalled:** 3.1 and 3.6: a tool disagreement plus a composite ticket plus a look nobody judged.
- **Alternatives:** (A) keep the planned cuts, record them as designed in CHK-027 (the release harness already does), and fix only the swap jerks that are outside a cut; (B) replace the cut by a two-frame blend where the paintings overlap and keep it below. Expectation to test, not assume: a 50/50 two-frame blend would reach severity 0.40 or more on 4 of the 32 party cuts in Chapter I and on 25 of the 39 in Chapter IV (median overlap 0.32 and 0.12, the harness's outline overlap of the two paintings; the planner's own `smear.overlap` reads medians 0.375 and 0.125 and counts 1 and 25 such cuts, so step 7 says which of the two its line is set on), so B is plausible in Chapter I and not in Chapter IV until the ready paintings are fixed.
- **Smallest test:** paired clips of the same fight, cut against blend, at 60 and 120 Hz, per class (decision 205b), after the critic's rule for a designed blend is written down so the winner is not chosen by what the gate can score.
- **Choice: small probe** (the clips), with the ticket split first.

### PR-0459: size across poses (FFX Chapter I; carried since round 27)
- **Route and why it stalled:** registration and the ruler closed the registered figures (3 swaps, from 297); what is left is a reading taken in perspective (3.4).
- **Alternatives:** (A) a camera-independent reading (the registered head box times the plane scale, no projection); if it reads about 1.00 where the projected reading says 0.92 and 1.09, the harness is measuring the lunge coming toward the lens, and CHK-026 should say so and gate on the card-space number. (B) If the card-space number is also off: compensate the head scale inside the lens, hold `follow` across the close-up, or register a pose for that lens.
- **Smallest test:** one Chapter I run with the pack on, the two swaps read both ways, plus the same route with the planes facing the lens; about seven minutes of GPU after the conference.
- **Choice: small probe.** Close the registered-figure ticket; open a narrow one for the close-up.

### PR-0517: Rikku Dark Knight and Paine Warrior ready poses (FFX-2 only)
- **Route and why it stalled:** repaint "locked to the idle" (3.5); the gates cannot see a costume.
- **Alternatives:** (A) pilot three renders per girl with an identity measure, show them; (B) no ready painting for these two (the runtime already falls a pose with no trusted painting down its chain to the idle; no GPU).
- **Smallest test:** the identity measure on the current paintings (idle against attack as the ceiling): ready should fail it today. Then three pilot renders per girl.
- **Choice: ask Bailey**, with both options as a three-up sheet and a ready-to-attack clip each, before install (decision 205c). He decides the look.

### PR-0512 and PR-0522: the tool (critic plumbing, both games)
- **Route and why it stalled:** each time the symptom was patched (the table, the hash, the words), never the cause: the harness tree is not the build's.
- **Alternatives:** (A) stamp and refuse (the harness commit, policy hash, table hash and probe version in every report; refuse a deep review whose harness is older than the build's `critic/`). (B) Run the deep review from the release tree (`deep-release-tree.js` takes the tree as an argument).
- **Smallest test:** the two tool versions re-read one kept recording and give ghost frames per minute within 3 percent of each other and the same snap count once the smear log is read. The two runs compared above are different recordings (2.1 and 3.5 percent apart, so "within 3 percent" is not shown by them), and neither kept its recording. The R63-M1 trace did: `D:/Tools/pyrefly-scratch/2026-10-24/r63-hold/m1/raw/m1a` (Chapter I) and `m1b` (Chapter IV, both release-63 candidate runs), read offline by `m1/reana.mjs --root=<tree>`, which only needs the paintings served by a static file server.
- **Choice: change method** (A and B together; small).

### PR-0481: fight start (both games; carried since round 28)
- **Route and why it stalled:** warm earlier (700/1600 ms, a quarter less lost frame time), a prebuild behind the picker, a light retry warm. Judged by one number, press to first command, which is mostly not loading: Chapter I's now holds the roughly 10 s voiced intro, Chapter IV keeps its real ATB start (decision 180b). 18.5 s and 26.2 s have never been split.
- **Alternatives:** (A) split it, then slice the long tasks (backlog M-04); (B) change what a visitor sees in those seconds (shorten or skip the Chapter I intro in demo mode), which is a look and is Bailey's.
- **Smallest test:** a timeline from the logs that exist (picker press, battle screen, intro end, entry swirl end, first gauge full, first menu), then one measurement on the booth PC with the GPU free, three cold and three warm presses per chapter.
- **Choice: small probe**; ask Bailey only if the authored part is most of the time.

### PR-0473: a knock-out has no fall and a revive has no rise (both games; STALLED, open in rounds 28 and 29)
- **Route and why it stalled:** the motion pack added a KO cut and a settle, not a fall (motion-core step 3); the ticket was folded into PR-0380 as one of its roots and nobody owned it. Round 29's evidence is a seated figure that does not change for 12 frames and a Kimahri KO to idle that is a see-through double.
- **Alternatives:** (A) a hold frame plus a translate fall for painted figures, a mirrored rise on revive and a smear on a boss KO (backlog M-09); (B) leave it for the rigs (step 9), where a collapse is a rig move.
- **Smallest test:** record one real in-fight KO and one revive of a party member in each of Chapters I and IV as clips (none exists: M-09 says an in-fight Chapter IV KO was never recorded), then show A as a short prototype beside today's. Measure: the strip shows a fall over several frames, and no swap jerk of 40 px or more at the KO outside a named cut.
- **Choice: ask Bailey** (new motion; decision 176o asked for "rig collapse + settle"; hard rule 10), as its own ticket split off PR-0380.

### PR-0480: run-wide longest frame (both games; STALLED, open in rounds 28 and 29)
- **Route and why it stalled:** measured on a shared GPU in headless Chromium, and the start of the battle was never separated from steady play; the long frames sit at the first display of a painting and in the warm's long tasks (R63-M1: 9 of 37 long frames at a first display; Chapter I's 321 to 381 ms spike is present with the pro look off), so no engine change was aimed at them.
- **Alternatives:** (A) fold it into step 4: the timeline separates the first seconds, and the M-04 slices (long tasks under 100 ms, the backdrop staged in bands) are the fix; (B) a new ticket and a separate spike hunt, which would repeat step 4's measurement.
- **Smallest test and measure:** step 4's booth-PC run with the GPU free, three cold and three warm presses per chapter with a frame log: frames over 250 ms after the first 2 s are 0, and the lost milliseconds in the first 9 s are at least halved.
- **Choice: small probe** (A; no new ticket).

### PR-0529: Paragon's feet move about 10 px at 16 pose swaps (FFX-2 Chapter VII, Trema; new in round 29, no pack)
- **Route:** one chief run with the review tree's harness, in a chapter with no pack, the strips unread; it belongs with the other chapters' older readings (step 8), which the same tool measured.
- **Alternatives:** (A) register Paragon's cast and hurt poses to the idle's feet line (the round's own fix); (B) record the 10 px as a designed cast hop and list it in the check.
- **Smallest test and measure:** re-read `ffx2-trema` once with the release harness (step 8) and read its strips first: feet over tolerance 0, or the hop named. Which of A and B is right is not in `research/`; if it is the cast hop, that is Bailey's.
- **Choice: small probe**, inside step 8.

### PR-0478: boss rig double body (carried rounds 26 to 28, not raised in round 29)
Release 64 focused run: the boss rigs' 17 blended key changes show 0 ghost frames and their flips are planned cuts (111 and 106). **Choice: defer;** it closes or reopens when step 7 judges the cuts.

## 6. What changes in how the next batch is run

1. The unit is the swap class, with ghost frames per minute as the target, severity 0.30 as the ceiling, and one motion clip per class that Bailey or the driver watches. Counts of swaps, shares and snap totals are reported, not targeted.
2. Every harness report names its tool (3.1). A number from an unnamed or older tool is not compared with one from a newer.
3. The order inside a class is invisible fix, then measurement, then art, then look: the flicker (no look) before the ready paintings (art) before the cut-or-blend clips (look) before any rig.
4. A prediction is written before the run (the flicker: 100.7 frames a minute). A run that misses it stops the batch (rule 15).
5. A repaint is judged by an identity measure and by eye before it is installed; the originals are archived first.
6. A designed swap (a planned cut or a planned two-frame blend) is logged by the engine and reported apart from an undesigned dissolve; the policy word that excuses it names the owner's words and can be switched off.

## 7. The order of work

Full steps, measures and clip lists are in the driver's scratch copy of the plan (`D:/Tools/pyrefly-scratch/2026-10-26/motion-plan/MOTION-PLAN.md`, not in the repo); this is the order. The last column says whether Bailey must look before the step counts as done; "no" steps still keep their clips and strips for the review. Nothing deploys before the conference ends (decision 205a); every browser step needs the GPU free.

| Step | What | Game | Size | Proves it | Bailey sees | Must he see it |
|---|---|---|---|---|---|---|
| 0 | Pin the tool (3.1) | both | S | the same kept recording gives ghost frames per minute within 3 percent from both tool versions (re-read the M1 recordings; record every later run with `CONT_RAW_DIR`) | a line naming the tool in the next report | no |
| 1 | Stop the ready-idle-ready flicker (PR-0379, backlog M-07) | FFX-2 | S | flicker triples 22 to 0; Chapter IV ghost frames a minute 147.4 to about 100; no new jerk | one before/after clip of Rikku and Paine attacking; no new look | no (optional: nothing new appears) |
| 2 | Make the cheap gate residues true: Yuna's cast pose at 1.1164 of her idle's height against the 1.10 ceiling (FFX-2 only); the three gated swap jerks: Kimahri follow to idle 69 px and Tidus hurt to critical 43 px (FFX only; blended swaps, no smear in the log) and 45 px of Rikku's feet inside her turn-start twirl (FFX-2 only; a staged step, so read its between-keys step 4 of 5 first, not a pose pair) (M-02) | both (per figure) | S | height out of band 0; no gated swap jerk of 40 px or more outside a named cut | the strips that already exist (`jerk-014`, `jerk-025`, `jerk-019`) | no |
| 3 | Auron's head in the killing-blow close-up (PR-0459; C-01 beside it) | FFX (the other chapters' reads: both) | S to test, M to fix | CHK-026 PASS in Chapter I with 0 swaps over; the 17 other chapters each read once | a two-up of the blow, planes as drawn against planes facing the lens | yes if the answer is "it is only perspective" (a look he should agree to); no if it is a registration fix |
| 4 | Fight start: timeline, booth-PC measure, then the M-04 slices (PR-0481) | both | M | press to first command at or under 12 s, or the authored part documented; frames over 250 ms after 2 s: 0 | a 30 s screen recording with a frame-time strip; one question if the intro dominates | only if the authored intro is most of the time |
| 5 | Make the time-based shake the default in the other 17 chapters (M-08; one line in `FeelSwitch.ts`; `BattleCamera.ts` stays at 399 lines) | both | S | shake rate equal at 60, 120 and 144 Hz; impact frame 33 ms at all three | one big hit at 144 Hz beside 60 Hz | yes (his monitor rule, decision 176e); at 60 Hz nothing changes |
| 6 | Lock the Rikku Dark Knight and Paine Warrior ready poses (PR-0517, decision 205c) | FFX-2 | M, GPU | ready/attack overlap 0.3 or more; ready-class worst severity 0.25 or less; Paine's feet on the line within 2 px; the identity measure passes | three-up sheets and a clip for repaint against no ready painting, before install | yes, before install (decision 205c) |
| 7 | Smear cut against two-frame blend, per class (PR-0380, decision 205b) | both | M | ghost frames a minute at least halved against section 4 with no new jerk or feet slide; Bailey's pick in motion per game | paired clips at 60 and 120 Hz | yes (it is the look) |
| 8 | Re-read the 11 other chapters' swap jerks with the release tool (Trema's Paragon feet, PR-0529, first); split what remains | both | M | gated swap jerks of 40 px or more outside a named cut: 0 per chapter | nothing until a class changes look | no |
| 9 | Rigs, one figure at a time, only on motion clips (M-10, decision 179a); the existing Tidus (FFX) and Rikku Dark Knight (FFX-2) pilots are shown first | both | L | ghost frames a minute for that figure 0 with its rig on; CHK-026 rig head reading; no new jerk | the pilot clips, move by move, rig beside painting | yes, every figure, in motion |

## 8. What this check did not do

- It ran nothing in a browser, so no new frame, strip or clip exists; every prediction above is a prediction.
- It did not read round 29's evidence strips beyond their listed names; the class table is read from the focused run's `continuity.json`, not from pictures.
- The cause of the flicker is not traced to a line (the log's nearest event is a damage event, 21 of 22); `PaintedActor` / the presenter's turn-start and action-start calls are the suspects named in backlog M-07.
- The 11 chapters with swap jerks of 40 px or more outside the pack were read by the stale tool and are an upper bound.
- That the round-29 harness ran from the 2026-10-10 tree is shown by what the tree and the output lack (no `smear` policy, no `smear`/`staleTable`/`poseWaivers` fields in `continuity.json`, a raw-CRLF table hash), not by a log of the run. The one-off `deep-release-tree.js` is not on disk in either tree; `critic/runner/deep.js` runs the harness from `args.root`, which defaults to `D:/Final Fantasy` (itself an old tree).
- Which pose a waiting character should show in each game is not in `research/`; nothing here decides it.

## 9. Corrections after the completeness check (2026-10-26)

A second reader re-ran the class table, the flicker, the blend expectation and the tool comparison from the same files (all held: classes 111/32/130/7/44/10 and 106/39/252/4/0/7; 22 flickers, 295 of 931 frames; 25 of 39 blends at 0.40 or more in Chapter IV; both tool tables) and found what follows, now fixed above.

- Section 1 and the head count: the third Chapter I swap over 3 percent is Yuna's idle to hurt (1.0316, off the view), not an Auron swing.
- Section 4 and step 2: Yuna's failing height reading is her cast pose at 1.1164 of idle (a ceiling of 1.10, flag `stature-high`); 0.8957 is the size ratio of that one swap, not a stature.
- Section 3.6 and step 2: the three gated swap jerks were named from a join of the jerk's id to the swap's id, which are different counters. By frame number they are Kimahri follow to idle (69 px), Tidus hurt to critical (43 px) and a step of Rikku's turn-start twirl (45 px). None was a logged smear. The fixes in step 2 follow from that: Rikku's is a staged step, not a pose pair.
- Section 3.1: PR-0380's other headline (58 and 20 jerks) is the same tool difference; the check had left it out. The comparison of the two tools used two different runs, 2.1 and 3.5 percent apart, and no recording of either was kept; step 0 now names the kept M1 recordings and `CONT_RAW_DIR`.
- Sections 3.3, 3.4 and 3.7 gained their "Do differently" lines; section 5 gained PR-0473, PR-0480 and PR-0529 (stalled or new in round 29, named nowhere before); section 7 gained the column "Must he see it".
- Not changed: the overlap behind the blend expectation is the harness's, not the planner's (see PR-0380); which pose a waiting character shows stays open (rule 6).
