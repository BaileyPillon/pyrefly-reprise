Build / artifact / target version: ce05b02c (release 20 candidate, D:/pyrefly-rel20, dist-gate bundle index-i8Mr-QwD.js) / previous live 43dca986 (release 19, bundle D56B92vC) / targets.json sha256 c8039b2a...d32bd (candidate tree)
Review: focused
Deployment: NOT APPLICABLE. Live verification is a separate obligation. Note that this build was deployed at 18:20Z, while this review was running (docs/deploys.log, override=owner).
Changed area: PASS. Five FFX-2 chapters (IV, V, VI, XI, XV) were won by real keys at 1600x900 under the default Wait split, and XIII lost and reached its retry. The menu-cancel correction, Acta, Lightfall, the 23 poses and the FFX Sensor change each meet their acceptance check, and there is no regression.
Ship: SHIP. No critical defect and no regression against release 19. This release discloses one major, not introduced by it: FOC20-04, which is FOC19-01 carried (IC-1, the FFX-2 sole-survivor chain lock; its switch stays OFF under D-193 option B).
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 2 / matched 1 / failing 0 / unverified 1 / waiting 0 (Battle HUD FFX-2 matched; the Vegnagun-part targeting moment was not captured)
Top issues: FOC20-04 major, carried and disclosed (IC-1). FOC20-01 polish: the D-196 record says game ffx2 and delivery not-scheduled, but the shipped change is FFX-only and implemented. FOC20-02 polish: stale notes (the Mach Fan comment says "no reader"; research 1.1 / 1.5 rows still say any hit closes the menu). FOC20-03 suggestion for Bailey: Chapter VI under ACTIVE is harsh for a player who browses lists.
Coverage: Tested: six FFX-2 chapters end to end by keys; Chapter VI ACTIVE menu-cancel by keys; Acta (6 casts) and Lightfall event logs; 20 of the 23 poses in battle at 1600x900, plus 390x844 and 2000x1012 samples; hashes; FFX I and IX regressions; the Sensor plate in IX (absent) and I (present); tsc and 10 changed-area test files. Reused: 200-seed win rates, the builder's three KO-pose frames, the cutter's full suite. Not tested: audio, performance, devices, the Vegnagun-part targeting moment, the CHK-008 projection.
Next required review and why: live verification of ce05b02c (already deployed), then the deep review it owes on the live build (plan depth deep, deepAfterDeploy true; 43dca986's deep review is carried).
Elapsed review time / repeated work avoided: about 110 minutes. About 70 of those were the six uninterrupted real-key chapter runs the brief requires (Chapter V alone took 19.5 minutes); the rest was review overhead, about 40 minutes over the 15-minute budget because of the named shared-engine risk. Repeated work avoided: the 200-seed benches and the full suite were not re-run.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel20 gave these values:
- depth **deep**, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, carriedDeep [43dca986];
- systems: FFX HUD and FFX-2 ATB engine; games: both;
- checks: CHK-003, 004, 006 to 010, 015 to 017, 020 to 023; targetGroups: fight and presentation;
- `dataAudit: false`, `approvedArtCheck: false`.

There is no save-data class and no milestone claim, so the focused pass runs.

## Candidate and environment

- The candidate is D:/pyrefly-rel20 at ce05b02cb36d. Its `dist-gate` was already built (13:34, after the 13:31 commit, with no build process running).
- It was served with `vite preview --outDir dist-gate` on 127.0.0.1:5412 (PID 39704). **The server was stopped by that PID, and port 5412 was confirmed closed (0 listeners).**
- Browser: headless Playwright Chromium, `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX 5070 Ti). No black canvas, no fallback.
- One browser at a time: every lane ran serially. From about 15:18, another agent's Playwright run (D:/pyrefly-t1-b5 hud-collision) shared the machine during my last probes. The outcomes of those probes match the release-19 baseline.
- The drivers are in `tools/zz-foc20.tmp/`:
  - `route.mjs`: the release-19 advisor route, plus a read-only event collector across links;
  - `mc.mjs`: menu-cancel under ACTIVE;
  - `pose.mjs`: the builder's pose probe, redirected here;
  - `yoj.mjs`: Sensor;
  - `col.mjs`: engine sample;
  - `play.mjs`: FFX regression.
- Evidence is under `critic/reviews/ce05b02c-focused/`.

## Game case of each change (CHK-021)

- **FFX-2 only: all-target hits once each, and Acta on the Redoubts only** (D-193). Sources: research/ffx2-combat-core.md 9.1 [verified: 3 sources] and research/ffx2-vegnagun-shuyin.md 3.4 ("both Redoubts").
- **FFX-2 only: menu-cancel only by Delay or Action-cancel** (D-198, supersedes D-171). Source: research/ffx2-combat-core.md 9.2, the correction to 1.1.
- **FFX only: no Sensor plate on a Sensor-immune target** (D-196). Source: research/ffx-yojimbo.md 2, "Scan and Sensor show nothing". The D-196 record itself is still filed as ffx2 (FOC20-01).
- **FFX-2 only: the 23 poses** (D-194, D-199), which are dressphere paintings.

What the review showed for each game:
- **Present in FFX-2**: VI, V and XV (below).
- **Absent from FFX**: the FFX engine is untouched, and chapters I and IX reproduce release 19's seeded outcomes.
- **FFX Sensor**: no plate on Yojimbo, and still a plate on Seymour Flux and Mortiorchis.

## Results

### 1. Every FFX-2 chapter by real keys

The runs used 1600x900, the default Wait split (OPTIONS read "X-2 BATTLE WAIT", with no `?wait` switch) and seed 1. The advisor was followed by keys.

| Chapter | Outcome | Minutes | Destination |
|---|---|---|---|
| IV Bahamut | victory, 47 turns | 6.7 | results, then chapter select |
| V Vegnagun / Shuyin | victory, 124 turns, 4 seams | 19.5 | results, then chapter select |
| VI Leblanc | victory, 99 turns, 2 seams | 13.8 | results, then chapter select |
| XI Fallen Aeons | victory, 74 turns | 11.1 | results, then chapter select |
| XIII Trema | defeat, 71 turns | 7.1 | defeat results; RETRY opened party prep, then a new battle (`33-retry-battle.png`) |
| XV Den of Woe | defeat on the first attempt; RETRY; then victory, 33 turns | 10.4 | results, then chapter select |

All six runs had 0 console errors, 0 HTTP 4xx and 0 steer misses. Pause by Esc and by P, the tabs, H, target cancel and prep Esc all worked in every run.

### 2. Chapter VI under ACTIVE

ACTIVE was set by keys in the pause OPTIONS (`00-options-active.png`; settings.ffx2Atb read "active"). The probe then opened each girl's Skill list with arrow keys and Enter, and read the battle log to name the ability behind each hit.

- **Plain hits:** 10 plain hits on the list owner (Fem-Goon Blizzard, Thunder, Water, Fira and Thundara) **left the list open** (`plain-*-open-*.png`).
- **Delay hit on the owner:** Ormi's **Supercollider** hit Yuna for 128 while her Skill list was open. **The list closed**, and a fresh top-level menu for Yuna came up (`delay-x2-ormi-supercollider-closed.png`).
- **Delay hit on another girl:** Supercollider on Paine left Yuna's open list alone. That is correct, because only the victim's menu closes.
- **Shield Bash on Rikku:** it closed her list, but she was KO'd (the defeat frame), which is not a menu-cancel.
- **Mach Fan and Huggles** did not occur in these runs. They are covered by `tests/unit/ffx2-menu-cancel-delay.test.ts` (passing).

### 3. Chapter V: Acta Est Fabula

The real-key run had 6 casts. Each healed exactly redoubt-r and redoubt-l once (for example -2568 and -2617), and none touched vegnagun-head (`all-events.json`). Missile (single target, 2 hits) and Dies Irae (random target, 9 hits) behave per their targeting.

### 4. Chapter XV: Lightfall

This was an auto sample on the production bundle, seed 2. Nooj's Lightfall hit yuna, rikku and paine **once each for 5000**, which KO'd all three (`col-ffx2-den-of-woe-s2/01-x2-den-nooj-lightfall.png`). The seed-1 real-key run never triggered Lightfall, because Nooj died before his HP gate.

### 5. Poses

Each installed pose was frozen in its own moment.

- **Captured:** 20 of 23 at 1600x900. Every one used its locked painting (`placeholder: false`). The rendered units-per-pixel equals idle times the sidecar scale, 0.83 to 1.26, and none was clamped.
  - The Rikku Thief item, hurt and victory poses read 1.25, 1.15 and 1.21 at both 1600x900 and 390x844.
  - VI-Y (8 poses) was also captured at 390x844 and 2000x1012.
- **Not captured:** the three KO poses from chapters IV, V and XIII. They were reused from the builder's frames, and their hashes match.
- **Phone frame:** in the 390 Thief item frame, Paine's turn cut-in covers most of Rikku. That is harness timing, not a pose defect.
- **Hashes:** `verify-approved` with ROOT=D:/pyrefly-rel20 found 255 ok, 0 mismatched and 0 missing. All 23 poses are in approved-hashes.json and byte-identical in dist-gate.

### 6. Chapter IX: Sensor (FFX)

- **Chapter IX:** all three enemies carry `immune-to-sensor`. At the command menu the Sensor plate exists but is **not shown**, at both 1600x900 and 2000x1012.
- **Chapter I (control):** the plate still shows "Mortiorchis HP 4000 / 4000 ..." and folds with I.
- **Harness limit:** Attack on Yojimbo auto-targets the only valid enemy, so no target cursor opened and "Sensor on the cursor" could not be exercised. The old build rendered "SENSOR FAILED", as the removed code in the diff shows.

### 7. FFX regression

- **Chapter IX, seed 7:** victory in 11 turns, with the same per-character turn counts and the same screens as the release-19 regression log.
- **Chapter I, seed 1, 2000x1012:** defeat, then RETRY to party prep, the same as the release-19 run.
- **Errors:** 0 errors and 0 bad responses in both runs.

### 8. Tests

- `npx tsc --noEmit` is clean (2060 files).
- The 10 changed-area vitest files pass, 120 tests in all:
  - ffx2-menu-cancel-delay, ffx2-hit-closes-menu, ffx2-all-target-hits, ffx2-atb-golden;
  - ui-ffx-enemy-plate;
  - pose-install-0926, pose-install-thief-0926;
  - den-of-woe-carry, strategy-ffx2-bahamut, menu-cancel.

## Targets (composites)

- **Battle HUD, FFX-2:** matched (`battle-hud-ffx2.jpg`). The Chapter IV menu is open with the approved composition: menu stack right, party rows bottom right, boss plate top left.
- **Targeting in FFX-2, a Vegnagun part:** unverified (`targeting-ffx2-vegnagun-part.jpg`). The capture is a White Magic list, not the part-targeting moment. Targeting code did not change.

## Issues

- **FOC20-04 (major, carried; introducedByCandidate false, regressionVsLive false).** This is FOC19-01, IC-1: a sole-survivor girl can be chain-locked by a lone enemy. Its switch IMMUNE_HITS_SKIP_CHAIN stays OFF by Bailey's option B. It was not re-run here. Disclose it.
- **FOC20-01 (polish).** docs/target/decisions.json D-196 has `game: "ffx2"` and `delivery: "not-scheduled"`, although its correction note and commit 05ae06e5 make it FFX-only and implemented. Fix both fields.
- **FOC20-02 (polish).** Three notes contradict the correction. `src/data/ffx2/enemies/leblanc-syndicate-leblanc-abilities.ts:128` says Mach Fan's `weak-delay` "has no reader", but `menu-cancel.ts` reads it now. research/ffx2-combat-core.md lines 50 and 213 still say any hit closes the menu, although 9.2 corrects that. Update the comment and mark the two rows as corrected.
- **FOC20-03 (suggestion; a question for Bailey, not a defect).** Under ACTIVE, the probe kept a list open for 12 to 30 seconds per turn, and the party wiped twice within about 2 minutes of Chapter VI Act I. This is consistent with the measured Active win rate (VI 31/200). No change is proposed.

Proposals: none.
