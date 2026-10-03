# Critic plan: the next eye-candy increment (2026-10-03, paper only)

Requested by Bailey, 2026-10-03 ~01:00 EDT: "another pass on visuals and maxing out eye candy with special emphasis on character models, enemy models, animations, visual fidelity, and camera perspective ... The critic needs to be involved as well and I need updated scores."

**What this is.** A paper plan by the critic. Nothing is built, nothing is installed, no score here is a measurement. The baseline is deep round 19b (main c69de96a, release 36); the five sub-scores are provisional, judged with motion, and are not part of the weighted score. A planned gain only becomes a score when the step ships and a later deep round re-measures it. Gains below are the critic's estimate from the 19b anchors, rounded to 0.1, and overlap between steps is discounted in the projection. I read the READMEs and the issue lists; I did not open tonight's contact sheets, so candidate quality is taken from each README's own flaw notes.

Sources read: `critic/rounds/round-19.json`, `round-19b.json` (and `.md`), `critic/reviews/visual-pass-2026-10-01.json`, `docs/concepts/eye-candy-max-2026-10-01/OPTIONS.md` and `JUDGE.md`, `docs/target/decisions.json` D-316 to D-334, `docs/handoff/NOW.md`, tonight's `D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight/README-*.md` (dressphere figures, dressphere gap keys, apex keys, telegraph and KO keys) and the git log of branches `r37-*` (including `r37-slots` d529e06f).

## Where we stand (19b against 19 and the 2026-10-01 pass)

| Area | 2026-10-01 pass (rel 33) | Round 19 | **Round 19b** | What holds it down |
|---|---:|---:|---:|---|
| Character models | 7.6 | 7.9 | **7.9** | Yuna Thief is still a translucent mannequin (PR-0311, major); three dresspheres have no painted idle; party crowding |
| Enemy models | 7.1 | 7.6 | **7.5** | Natus, Braska's Final Aeon, Evrae lost their colossus master to the fail-closed gate (PR-0331); Bahamut's head washed out (PR-0316); few painted attacks per boss |
| Animation | 6.2 | 6.9 | **6.9** | Painted stills with procedural motion; twirl crossfade ghosting (PR-0315); the dressphere shot is a half-second cut (PR-0314, STALLED); no per-move Overdrive key |
| Visual fidelity | 7.9 | 8.0 | **8.1** | 21:9 plate bands (PR-0332), bloom, bosses under 1.5 texels per pixel at 2x, 28 adopted 2x masters held for the 800 MB line |
| Camera | 7.5 | 7.6 | **7.7** | Party and boss interpenetrate at rest in Ch II, III, VIII (PR-0310, major); colossus master delivered in two chapters only; phone Bahamut head under the intent strip |

Weighted categories that these feed: visual 8.9 (floor 9.0), feel 8.2, interface 8.5. **The visual category cannot reach its 9.0 floor while PR-0310 and PR-0311 are both open.** Closing PR-0311 needs only Bailey's idle pick. Closing PR-0310 needs an options round (below). Those two are the shortest path to the visual floor.

## What is already approved, built or waiting (so the plan does not re-ask)

- **Live (release 36):** the MAX mix per D-316/D-317/D-319 (EYE CANDY page, colossus masters for Yojimbo and FFX-2 Bahamut, depth of field, fog, smooth edges, breathing, KO collapse, Overdrive shot FFX, dressphere shot FFX-2, splash art), the installed art of D-322 (69 twirl keys), D-323 to D-328.
- **Built on `r37-*` branches, checked by their own check lanes, not merged or deployed:** `r37-mix-polish` (dressphere shot holds its 1.6 s, PR-0313/0314; KO clear of status rows PR-0318; coach line out of the shot PR-0320; PR-0315 to PR-0317, PR-0319, PR-0327), `r37-living-backdrops` (A-7, depth plates, drift and defocus for eight more rooms incl. the Farplane), `r37-scenes` (Ginnem glow A-9; plate wings PR-0300; hurried opening PR-0061), `r37-slots` (od-<ability> key slot and boss telegraph slot, no visible change until art is installed), `r37-ui-floor`, `r37-small`, `r37-sin-advisor`, `r37-lady-luck`.
- **Adopted but held for the 800 MB line (D-332):** 8 twirl keys (Rikku Dark Knight, Thief, Alchemist; Paine Dark Knight), 59 boss and aeon keys (D-325), 28 2x masters. The line is open: MB or MiB, and PR-0328 (hidden source maps, about 22.8 MB). Every art gain below competes for the same budget; tonight's three new figures and the 56 gap keys add to it.
- **Approved but no candidates exist yet** (tonight's lanes did not cover them): D-333 Yuna Gunner wind-up re-roll, D-334 hooded Yuna White Mage hurt and KO.

## Per area: the three highest-payoff steps that need no new options round

"Gain" is the step's marginal gain in that area's sub-score if shipped and re-measured. Status words: BUILT (code done, unreleased), HELD (adopted art, waits on the line), PICK (Bailey picks from tonight's candidates), OWED (approved, needs a build or art).

### 1. Character models, 7.9

| # | Step | Status | Game | Gain |
|---|---|---|---|---:|
| C1 | **Paint the three missing dresspheres**: Yuna Thief, Rikku Warrior, Paine Thief idles plus full key sets (13/21/13 idle options; recommended cand-6 / cand-12 / cand-5). Closes PR-0311, the major that holds visual under 9.0. Pick the idle first: every key was painted against the recommended idle. Yuna Thief is sourced (visual-bible 1.14). **Rikku Warrior and Paine Thief costumes are an estimate** (Yuna's rows applied; the repo has no source for the girls' own variants), so Bailey should either accept them as ours or hold those two until a source check (rule 6). Installer must set scale and baseline by eye against the girl's other dresspheres. | PICK | FFX-2 only | +0.3 |
| C2 | **Overdrive and Special apex keys** (EC-1001-12): 25 sets, FFX Tidus, Auron, Wakka, Lulu, Rikku, Yuna Grand Summon (Kimahri has breath only, no Ronso Rage) and FFX-2 Trigger Happy, Steal, Darkness, Pray, Break, Samurai, Warrior, Berserker, Black Mage. The `r37-slots` slot is built, so a pick is all it needs. Take only the picks whose README flags are mild; Paine Warrior's plant failed, Auron's keys are few, Tidus drifts in boots and trousers. | PICK + BUILT slot | FFX for the Overdrives, FFX-2 for dresspheres | +0.2 |
| C3 | **Gap keys and held twirl keys**: 56 dressphere slots on 21 figures (follow-through, Dark Knight attack/hurt/KO, Songstress wind-up) plus the 8 held twirl keys. Take the clean ones; the README itself lists mage follow-throughs, Berserker and Dark Knight as weak. | PICK + HELD | FFX-2 only | +0.1 |

Sum +0.6; **projected 8.3 to 8.4** after overlap and the weak picks. Owed first: D-333 and D-334 candidates.

### 2. Enemy models, 7.5

| # | Step | Status | Game | Gain |
|---|---|---|---|---:|
| E1 | **Boss telegraph wind-up keys**, 14 bosses (Flux, Yunalesca, Braska's Final Aeon, Natus, Omnis, Evrae, Ixion and the Ch III aeons for FFX; Bahamut, Trema, LeBlanc, Vegnagun tail and head, Shuyin for FFX-2). The `r37-slots` telegraph slot is built and plays on the existing `charge` beat, with no added wait and REDUCE MOTION as a single cut. This is EC-1001-06 and the first time a boss reacts before its blow. | PICK + BUILT slot | per boss, split by game | +0.3 |
| E2 | **Install the held boss art**: 40 boss keys and 19 aeon extras (D-325) and the 28 2x masters (D-332), which lifts BFA (1.29 texels per pixel) and Bahamut (1.20) toward the 1.5 floor. | HELD | both | +0.2 |
| E3 | **Boss-side polish and defeat keys**: PR-0316 Bahamut head bloom, PR-0317 Flux crown, PR-0319 Ginnem (all in `r37-mix-polish`; confirm each in the next deep round), plus the Sin-parts and Omnis-kneel defeat candidates (the per-class defeat language, VP-1001-47). | BUILT + PICK | both | +0.2 |

Sum +0.7; **projected 8.0 to 8.2.** Natus's colossus presence needs an options round (below), so it is not counted.

### 3. Animation, 6.9 (the weakest area and the largest ceiling problem)

| # | Step | Status | Game | Gain |
|---|---|---|---|---:|
| A1 | **Merge and ship `r37-mix-polish`**: the dressphere shot holds its full 1.6 s (PR-0313/0314, STALLED twice, so the method check on record must be respected), the KO lies clear of the rows, the twirl keys are fetched ahead, the PR-0315 crossfade ghost. Confirm PR-0315 specifically; the lane lists it but a "not reproduced" note may apply. | BUILT | FFX-2 for the shot and twirl, both for the KO | +0.2 |
| A2 | **Apex and telegraph slots with picked art** (C2 and E1 seen as motion): every signature move gets a painted release, every boss a painted anticipation. Counted here once, at a larger weight, because it changes the moving picture in every fight. | PICK + BUILT | both, per game | +0.4 |
| A3 | **Painted follow-through and wind-up for the gap figures, the sourced Thief victories** (Yuna's hands-behind-back landing, Paine's arms-folded hair flick) and **the held twirl keys**. | PICK + HELD | FFX-2 only | +0.2 |

Sum +0.8 but the area has a structural ceiling (painted stills, no in-betweens): **projected 7.4 to 7.6**, and not above 7.8 without a motion options round.

### 4. Visual fidelity, 8.1

| # | Step | Status | Game | Gain |
|---|---|---|---|---:|
| F1 | **Install the held 2x masters and adopted art to the line**, once D-332 (MB or MiB) and PR-0328 are answered. | HELD, needs Bailey's budget call | both | +0.2 |
| F2 | **Merge `r37-living-backdrops` (A-7) and `r37-scenes` (Ginnem glow A-9, plate wings PR-0300)**: depth plates, drift and defocus for eight more rooms, no black bands at 2000x1012 and 2560x1080 in XV and IV. The `r37-scenes` check notes a visible mirror seam and IV's doubled lantern, so keep those disclosed. | BUILT | FFX and FFX-2 each their own | +0.2 |
| F3 | **PR-0316, PR-0317 and PR-0330**: Bahamut bloom, Flux crown and the advisor card that loses its detail lines under the colossus layout. PR-0330 is the one regression 19b found and I could not find it fixed on any `r37-*` branch: it goes first in the next batch. | BUILT (0316, 0317) / OWED (0330) | FFX (0317, 0330), FFX-2 (0316) | +0.1 |

Sum +0.5; **projected 8.4 to 8.6.**

### 5. Camera perspective, 7.7

| # | Step | Status | Game | Gain |
|---|---|---|---|---:|
| K1 | **The held shots finish properly**: the dressphere shot holds 1.6 s (`r37-mix-polish`) and the Overdrive shot shows the picked apex painting instead of the idle (`r37-slots`). | BUILT + PICK | FFX-2 and FFX | +0.2 |
| K2 | **Plate wings and the backdrop defocus** from F2, read as framing: the plate fills the frame at wide aspects, the room has depth behind the party. | BUILT | both, per game | +0.1 |
| K3 | **PR-0314's push-in fallback**: when the dressphere shot finds no clean frame (Trema Paine, the phone), a small push-in on the changing girl instead of no shot. This is the 19b proposal; it needs Bailey's yes, not an options round. | PICK (yes) | FFX-2 only | +0.1 |

Sum +0.4; **projected 7.9 to 8.1.** The step that moves camera most is not here.

## What still needs a new options round (rule 9; none of this is built until Bailey picks)

1. **Re-stage Ch II, III and VIII so the party stands clear of the boss (PR-0310, major, FFX only)** and decide whether **Natus, Braska's Final Aeon and Evrae get the colossus master back (PR-0331)**, with Natus's Sensor card steered off the boss. This changes approved compositions. Show 2 to 4 first-menu stills at 1600x900 and 2000x1012 against live: A move the party left, B move the boss right, C both a little, D leave as is (with the colossus master). Estimated gain: camera +0.4, enemy models +0.2, and it is the other half of the visual floor. This is the highest-payoff item in the whole plan.
2. **Authored per-chapter framings (EC-1001-05) and an FFX-2 view of its own (EC-1001-13)**, and the **phone lower third (EC-1001-14)** with the PR-0333 Bahamut head fix. Ask after item 1, so the stills share one staging baseline.
3. **The Clair Obscur and Persona battle-camera grammar** is the camera-lab session's (D-318). I have not planned it, and it holds the largest camera ceiling; nothing in this plan touches it. Its verdict decides which of K1 to K3 and item 2 survive.
4. **Motion beyond keys**: per-move Overdrive choreography (EC-1001-03, a re-offer of an idea declined on 19 Sep, needs its own yes), stepped on-twos action keys, enemy part motion for Vegnagun (EC-1001-06 procedural half), enemy skill travel and impact effects (EC-1001-08). Show 2 to 3 short clips, not code.
5. **Relight from normals (EC-1001-11)**: the judges found the prototype too subtle to see; show a light-compare pair or drop it.
6. **Costume source for Rikku Warrior and Paine Thief** if Bailey wants more than "ours". The Fandom wiki needs the browser pane, headless Playwright only for any capture.

## Art still owed (candidates for the next art lane, if Bailey wants more overnight generation)

D-333 Yuna Gunner wind-up re-roll; D-334 hooded Yuna White Mage hurt and KO; Rikku White Mage manifest (unsolved since 2026-10-02, 18 renders); a Kimahri horn pass so his breath key cand-1 and a Ronso Rage can exist; second-pass picks for Rikku Berserker, Dark Knight and mage follow-throughs; Rikku Warrior going/forming transitional keys (they show a skirt where trousers were); Vegnagun Tail 4x only after the line has room (D-329). Every new painting needs a head-match scale check on the real battle frame.

## Order for Bailey in the morning

1. **D-332**: MB or MiB, and may source maps ship hidden (PR-0328). Every art step waits on it.
2. **Three idle picks** (Yuna Thief, Rikku Warrior, Paine Thief): the cheapest way to close a major.
3. **Apex and telegraph picks** (dozens of small decisions; the READMEs carry the agents' picks, and "take the recommended" is a valid answer).
4. **PR-0310 / PR-0331 stills** (the options round above), then the push-in yes.

## Scores to expect and the honest limits

| | 19b | If steps C, E, A, F, K ship and a deep round re-measures | Without any Bailey pick (merge only: A1, F2, K2, E3 polish) |
|---|---:|---:|---:|
| Character models | 7.9 | 8.3 to 8.4 | 7.9 |
| Enemy models | 7.5 | 8.0 to 8.2 | 7.6 |
| Animation | 6.9 | 7.4 to 7.6 | 7.1 |
| Visual fidelity | 8.1 | 8.4 to 8.6 | 8.3 |
| Camera | 7.7 | 7.9 to 8.1 | 7.8 |

- The ten weighted categories are not moved by this plan alone: **visual 8.9 reaches 9.0 only if PR-0311 and PR-0310 both close**; feel 8.2 gains from A1 and K1 but stays below 9.0; combat, encounter, narrative, interface, onboarding, delivery and the unverified audio are untouched, and the 9.60 milestone stays far away.
- Several `r37-*` lanes had their independent checks run late; they are unreleased until the integrator merges them and the critic plan (`node tools/critic-plan.mjs`) names the review. Art installs touch `public/art` and `approved-hashes.json`, which the driver, not this plan, owns; the save-data class does not change here, so a focused review before the deploy and a deep review on the live build is the expected depth, except that anything that adds settings rows is deep before deploy.
- Game case (rule 14) is written per step. Shared plumbing (the slots, plate wings, backdrops, KO placement) is both; Thief, Warrior, Berserker, twirl and dressphere shot are FFX-2 only; Overdrive apex and the Ch II, III, VIII restaging are FFX only.
