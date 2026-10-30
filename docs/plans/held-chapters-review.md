# Paper preflight and method check: held-chapters (pose continuity in the four chapters release 68 keeps out of the wide swap scope)

Written 2026-10-30 by the held-chapters lane's fix agent (a sub-agent of the release driver), **after the first build and its adversarial review (finding F3), not before it**: AGENTS.md rule 15 asked for this page before the code, and the lane did not write one. It is written now so the driver can see what the branch's DEEP class costs and what the browser jobs must prove. Authority: Bailey, 2026-10-28, "please work on the pose continuity fix and and crtiques for chatgpt i mentioned awhile ago as well as motion fluidity and animation. work on all those. i'll go with all your recommendations and decision-making for the next couple days." Every call is the sub-agent's under that delegation, the driver's to adopt, Bailey's to overturn.

`node tools/critic-plan.mjs --paths <the branch's source files>` (2026-10-30, tip `6422342cb` plus the r2 edits) says **review DEEP**, obligations **live + focused + deep**, because `src/data/art/poseRegistrationFfx.ts` is a pose registration table (a shared system); the checks it names are CHK-008, 013, 014, 016, 017, 020, 021, 026 and 027. **A release that carries this branch owes the deep review on the live build**, and counts against the "at most two deploys while a deep review is owed" rule. The save-data class does not apply (`SaveData.ts`, the save schema and migrations are untouched), so the deep review is after the deploy, not before it.

## 1. Game case (rule 14), with its source

| change | case | source |
|---|---|---|
| Evrae's near-range head boxes (idle, idle-near, breath-charge, hurt) | **FFX only** | the chapter `evrae-airship` is an FFX encounter (`src/data/chapter-evrae-airship.ts`, registered in `src/data/encounters.ts`; the NOW.md banner lists it among the FFX chapters r68 holds back); the paintings are `characters/evrae/*.png` |
| The vertical head guard (`BLEND_HEAD_CHAPTERS`: `evrae-airship`, `sin-face`) | **FFX only** (it names two FFX chapters; the code in `PoseAlign`, `SmearFacts`, `SmearDirector` is shared and reads the table) | the table's keys |
| The chapter's own cut-anchor word (`CUT_ANCHOR_CHAPTERS`: `yunalesca`, `sin-face`) | **FFX only** | the table's keys; FFX-2's sources are silent on a slide of a returning figure, so Ixion XVI (FFX-2) gets no chapter word and an arm job (`ixion-all-held-anchor`) for the driver's look call |
| `SCOPE_EXCEPTIONS` reasons (Yunalesca, Evrae, Sin's face FFX; Ixion XVI FFX-2) | per chapter, as written | the chapters' games |
| The harness reads a gap (`continuity-gaps.mjs`) | **both** (shared critic plumbing, CHK-020) | it fires only where a recording has a hole in a figure's frames |
| `--gated` and `--cuts` on `tools/continuity-reread.mjs` | **both** (critic tooling) | |

No game data is invented (rule 6): the head boxes are a reading of the paintings (the original ones were, too), the thresholds are presentation numbers of the critic policy and the planner, and no sourced stat, move or timing is touched.

## 2. What could go wrong, and what the build does about it

1. **The registration table reaches the default build** (the only change that does: Evrae's head lock sizes his cast and hurt planes up to 0.9 percent differently, depending on the stage camera). Mitigation: the invariant "one painting, one head box" is a test over the whole record (`held-chapters-evrae-heads.test.ts`), the pose gate, the scale check and the ruler check pass, and the size change is measured on the real actor (not guessed). It is disclosed in the handoff and the CHANGELOG line.
2. **The guard moves a measured number** (ghost time a minute in the two chapters goes up: it sends the 50 ms blend back to today's longer blend). Mitigation: the line is the ENGINE's own share (0.11, between Wakka's 0.101 and 0.102 and Evrae's 0.120 and 0.132; the review found the first build's 0.08 spent about 140 ms a minute in Evrae and 180 in Sin's face on blends that never jerked), pinned on the real actors; `?blendguard=off` gives the chapter without it for a like-for-like run. Inert outside the two chapters and while they are `SCOPE_EXCEPTIONS` (smear is off outside the two pack chapters and the exceptions).
3. **The anchor word is a model reading** (no browser has run MF-18). Mitigation: it is inert until an exception is lifted; one edit empties the table; the Yunalesca and Sin's face anchor jobs read it first and the clips are the look call; Sin's face's job names no `?cutanchor`, so it is also the live proof that the chapter word is read.
4. **The harness change could hide a real hitch.** Mitigation: it excuses only a swap whose incoming painting was already showing, above the blend floor, in the last recorded frame before the gap; `meta.stats.maxDtMs` for the Ixion recording is 159.9 ms (no game hitch); over all 24 kept recordings it changes exactly one reading; `gaps.excuse: false` gives the old one back.
5. **A false MISS stops the browser queue** (the review's F1). Mitigation: the checker's `plannedCuts` is the count of excused swap jerks (92 and 102 in release 68's Evrae runs), not `hardCuts` (150 and 161); the band is 70 to 130; the repeat job compares the 24 px count.

## 3. Acceptance cases (named before the browser runs)

The jobs of `D:/Tools/pyrefly-scratch/2026-10-29/held-chapters/jobs/queue-held.json` (8 jobs, predictions written first, a miss stops the lane and is written up; no band is widened):

- `evrae-airship-all-held` and `-r2`: snaps 0; swap jerks of 40 px or more 0; swap jerks of 24 px or more at most 2 (round 30's count, the written lift); worst under 39 px; ghost time a minute 1,300 to 1,950 and at most 0.7 of round 30's 3,224; excused planned-cut swap jerks 70 to 130; the repeat within 2 swap jerks of the first.
- `evrae-airship-all-held-noguard` (conditional, `?blendguard=off`): the diagnostic that separates the registration from the guard.
- `sin-face-all-held-today` (anchor off) and `sin-face-all-held-anchor` (the chapter's word alone): gated jerks 0; the anchored arm's planned cuts of 120 px or more 0 to 1, whole-step worst 70 to 135.
- `yunalesca-all-held-anchor`: gated jerks 0; planned cuts of 120 px or more 0 to 2 (76 today); median 40 to 58.
- `ixion-all-held` and `ixion-all-held-anchor`: snaps 0; the kneel cuts inside their caps with the anchor.

Nothing was run in a browser (release 68's live checks held it); each of these is a job spec for the driver. A deep review of the live build that carries this branch measures the same chapters through their real flow (CHK-026, CHK-027).

## 4. Before and after, named

| measurement | before (release 68's kept recordings) | after (offline re-read; the browser jobs measure it) |
|---|---|---|
| Evrae swap jerks of 24 px or more (harness) | 11 and 12 (11 of 40 px or more, worst 55.2) | the data alone: 23 and 26 (1 and 2 of 40 px or more, worst 40.2); with the guard: 0 to 2 predicted |
| Evrae ghost time a minute | 1,088 | about 1,600 (band 1,300 to 1,950; round 30 was 3,224) |
| Sin's face gated jerks | 2 | 0 to 2 with the anchor off, 0 with it on |
| Yunalesca planned-cut jerks of 120 px or more | 76 (11.1 a minute; 13 gated) | 0 with the anchor (model) |
| Ixion XVI snaps | 1 (run 1) and 0 | 0 (a hole in the recording, now read as one) |

## 5. Evidence that stays reusable

Release 68's 24 kept recordings (`D:/Tools/pyrefly-scratch/2026-10-28/r68/measure-pose/evidence/raw/`) are the control for every job above; the offline reads are in the lane's scratch folder (`dumps/`, `predict-anchor2.out.txt`, `review/`). The deep review of the live build owes its own measurement; this page does not replace it.

## 6. Result

**PROCEED**, with the repairs already made (the review's F1 to F10): the guard line moved from 0.08 to 0.11, the off word added, the job band corrected, the exception texts corrected and renamed to the queue's tags, the stamp aligned. What the page asks of the driver: run the Evrae job first (it decides the Evrae exception), carry the deep-review obligation if this branch ships, and keep `SCOPE_EXCEPTIONS` as they are until the browser numbers say a lift condition is met.
