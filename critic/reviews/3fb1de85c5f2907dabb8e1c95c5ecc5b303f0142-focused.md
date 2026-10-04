Build / artifact / target version: 3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142 (release 37 candidate, D:/pyrefly-rel37, dist-gate bundle index-BGBDEn_P.js, 798,329,071 bytes, 0 source maps) / live c69de96a (release 36, bundle GO0eMOto) / targets.json sha256 99480bc2168b62e85209e8d6e1ee9761077a60b593f1a251fa37accc8c7fad5c
Review: focused
Deployment: NOT APPLICABLE. Live verification of this exact artifact is a separate obligation after the deploy.
Changed area: FAIL. Nothing critical or major regressed, but one polish regression was found (FOC37-03) and several named changes could not be shown in a browser by this review (UNVERIFIED, listed in coverage).
Ship: SHIP. No critical defect and no major regression against release 36. The release discloses one major in a new feature (FOC37-01, the Lady Luck reel overlay is covered by the guide card) plus the Trigger Happy press-count change (FOC37-02, the sourced rule, balance effect for human Gunner play) and the carried lane disclosures in docs/handoff/release-37.md.
Milestone: not assessed
Quality: not scored (focused pass). The last full score is round 03 on 7191674, 2026-09-19 (rubric v1 history).
Targets: required 4 / matched 2 / failing 0 / unverified 2 / waiting 0
Top issues: FOC37-01 (major, new feature, not a regression): reel overlay hidden behind the guide card (lane finding, not re-seen). FOC37-03 (polish, regression): Ch IV first-run coach clipped 46 px at 2000x1012 for some first actors. FOC37-02 (polish): Trigger Happy honours a human press count. FOC37-05 (polish, new feature): iris edge on Yuna X-2.
Coverage: Tested: tsc, orphans, approved-art verifier, data audit of the Lady Luck pay table and Bulwark immunities, real-key routes in Ch I, III, IV, XII (Ch I and IV at 1600, 2000 and 390), the same on live for comparison, 12 coach-placement probes, pause composites against the approved target. Reused: the integrator's full suite and per-lane proofs (only art and docs changed after e5999700). Not tested: the Ch XII disc line, D-247 0.6 s card, title cue, Lady Luck in a browser, Ginnem, plate wings, new backdrop rooms, win/loss/results, the EYE CANDY page.
Next required review and why: live verification of 3fb1de85 after the deploy (CHK-017), then the deep review this build owes (plan depth deep, deepAfterDeploy true).
Elapsed review time / repeated work avoided: about 75 minutes. The full suite and the lane browser proofs were not repeated.

## Plan

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel37: depth deep, deepBeforeDeploy false, focusedBeforeDeploy true, deepAfterDeploy true; games both; 18 chapters; checks CHK-001 to 013, 015 to 023, B1; targetGroups audio, cast, chapters, fight, pause, phone, presentation, scenes; dataAudit true; approvedArtCheck false (run anyway). Not the save-data class, no milestone claim, so the focused pass runs.

## Candidate and environment

- D:/pyrefly-rel37 at 3fb1de85; dist-gate was built at 10:29 after the 10:24 commit and reused. Served by `vite preview` on 127.0.0.1:5471 (PID 23256). **Stopped with taskkill /PID 23256 /T /F; port 5471 confirmed closed (0 listeners).**
- Browser: headless Playwright Chromium, PYREFLY_BROWSER=gpu, no black canvas, no fallback. One browser at a time. The harness is saved beside this report (harness-h.mjs, harness-probe-coach.mjs).
- Live comparisons ran on https://baileypillon.github.io/pyrefly-reprise/ (release 36).

## Game case (CHK-021)

Both games, per change (from the lane handoffs, checked against research/): living pause portraits, defocus, hurried entry, sourcemap removal: both. Lady Luck reels, Bulwark immunities, dressphere shot hold, FFX-2 end-of-fight banner, D-249 Q12: FFX-2 only. D-216/D-248, D-247, PR-0258, PR-0324, Ginnem, PR-0269: FFX only. Observed: Ch I, III, XII show no FFX-2 UI; Ch IV shows no FFX coach line; the pause and living driver work identically in Ch I (Tidus) and Ch IV (Yuna X-2).

## Data audit

- research/ffx2-combat-core.md section 3.12: all 432 reel stops are the lane's claim; the table in src/data/ffx2/reels.ts matches the printed Attack and Magic rows (three of a kind, pairs, Cherry-any-any, Dud 75 percent current HP, `percent-current` power 12 of 16). Item and Random reels are correctly left out (no command ships).
- Samurai: Magicide mp 4 power 8 Str vs MP (section 3.9, 2.9.1); Shin-Zantetsu mp 32, KO chance 80, all enemies (2.9.1); Clean Slate heals 25 percent (line 352). CT tiers are labelled estimates in the code.
- Vegnagun Bulwark: immunities now Acc/Eva/Luck Up-Down only, matching research/ffx2-vegnagun-shuyin.md line 341 ("Str/Mag/Def/MDef Up-Down all land").
- Approved-art verifier: 634 ok, 0 mismatched, 0 missing (approved 586, judge-locked 48).

## Findings

1. FOC37-01 major, new feature, introduced by the candidate, not a regression: the reel overlay is drawn under the guide card (lane finding, not re-seen here). Disclosed.
2. FOC37-02 polish, FFX-2 only: Trigger Happy now follows the human's presses. The source says one hit per press; live gave 14 hits for any count. Disclosed so Bailey can decide whether the prompt should say so.
3. FOC37-03 polish, regression: at 2000x1012 in Ch IV the first-run coach's tag reaches x=2046 on a 2000 px page for the seed-2 first actor, and covers the right of the intent card; live put it bottom-left. At 1600x900 (seeds 1 to 6) and 390x844 it is on screen. See coach-probe-cand/seed2.png against coach-probe-live/seed2.png.
4. FOC37-04 polish, old: the phone coach covers the intent card on live and candidate alike.
5. FOC37-05 polish, new feature: darker iris rim on Yuna X-2 (and Wakka) in the living portrait; Bailey's D-320 picks.
6. FOC37-06 polish, low confidence: two early desktop runs of Ch IV opened White Magic instead of Attack because the active girl differed between the menu read and the Enters; three reruns and a probe could not reproduce it and P, E and Esc do not change the actor. Repeat on the deep review with a seed sweep.

Carried disclosures from the lanes, unchanged and not re-tested: the plate-wing mirror seam in Ch IV (and XV chevron), Ch XIII not covered by the wings, Ginnem's baked halo, the title cue silent on a slow first load, EYE CANDY dim label contrast 3.12:1 on a phone, house-rule-7 file-size growth, the Sin Ch XVII chain not at 90 percent, the FFX-2 dressphere shot adds about a second. Round 19b majors still open (PR-0148, PR-0308, PR-0310, PR-0311, PR-0099, PR-0270, PR-0222; PR-0269 addressed by the lane; PR-0330 polish) were not re-measured here and belong to the deep review.

## Evidence

All under critic/reviews/3fb1de85c5f2907dabb8e1c95c5ecc5b303f0142-focused/: per-run folders (ch1-1600, ch1-2000, ch1-390, ch3-1600, ch4-1600-Escape, ch4-1600-KeyP, ch4-2000, ch4-390, ch12-1600, ch12-hunt, ch12-hunt-seed1, and live-* counterparts) each with run.json and PNGs; composites pause-until-dawn-ch1.jpg, pause-until-dawn-ch4.jpg, ch1/ch3/ch12 first-menu live-vs-cand, ch4-390 first-menu and pause live-vs-cand, ch4-2000 first-menu live-vs-cand (two); coach-probe-cand, coach-probe-live, coach-probe-cand-1600; verify-approved.json.
