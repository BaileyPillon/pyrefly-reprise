Build / artifact / target version: main 79adc4ff, candidate D:/pyrefly-rel25/dist-gate (bundle index-ykS1QEe6.js, same as live release 25) / targets.json sha256 695d60d1...
Review: focused
Deployment: NOT APPLICABLE (the live check is its own obligation; release 25 was already deployed on the owner's words before this review)
Changed area: PASS
Ship: SHIP. No critical defect, no regression against release 24 behaviour seen, only two polish issues. Nothing critical or major to disclose.
Milestone: not assessed
Quality: no current full score; the last full score is round 03 (rubric v1, build 7191674, 2026-09-19), kept as history
Targets: required 3 / matched 3 / failing 0 / unverified 1 (s3, FFX-2 targeting, not touched) / waiting 0
Top issues: P-01 polish, the folded Sensor strip touches the Final Aeon's bracket at 1600 (ch3-1600x900-aim-braskas-final-aeon.jpg), nudge it; P-02 polish, Seymour Flux's hair tips reach the right edge at 390x844 (menus/seymour-flux-390x844.jpg), a few px more margin
Coverage: tested I, II, III, IV, V, VI, IX, XI, XII in the changed flows (list below); reused Trema XIII hold from its unit test; not tested PR-0138 Chapter V retry, D-221 in the browser, the XIV Valefor wing edge, IX frame-by-frame judgement
Next required review and why: the deep review of 79adc4ff on the live build (shared combat core, presenter, global layout, chapter registry: 14 chapters)
Elapsed review time / repeated work avoided: 40 min (build 5 s, about 20 min of sequential browser runs); reused the iter2-b5 check's harness scripts (tools/zz-foc25-*.tmp.mjs), pointed at this candidate

## Environment

- Candidate: `D:/pyrefly-rel25` at 79adc4ff, `npx vite build --outDir dist-gate`, served by `vite preview` on 127.0.0.1:5433. I stopped it by its listening PID (77444), started it again for the Yunalesca capture and stopped it again (PID 78764). Port 5433 is closed.
- Browser: headless Playwright Chromium from node, `PYREFLY_BROWSER=gpu`. No black canvas, no fallback. One browser at a time.
- `npx tsc --noEmit` is clean. The 28 test files this change touched pass (165 tests): `r25/tsc.log`, `r25/vitest.log`.
- An older folder of captures sits beside `r25/`. They came from an earlier run against another server (port 5410) whose build identity I did not establish, so this report cites none of them.

## Game case (CHK-021)

- FFX only: PR-0170, PR-0180, PR-0146 and PR-0157 (FFX half), D-221, PR-0186, the FFX TARGET plate, and PR-0164 / PR-0212 (II, XIV).
- FFX-2 only: PR-0205 (XI), PR-0136 (VI), PR-0138 (V/XI).
- Both: A-2 transitions (each game gets its own variant), PR-0215 WITHDREW, and A-4 victoryPose (sourced per game: `research/ffx-vs-ffx2-presentation.md` §2.1 Zanarkand, §2.2 Bahamut / Shuyin / Via Infinito bosses).
- Absence verified in FFX-2 IV: no lone-target step, targeting null, no help-bar enemy ability name while Bahamut acted, entry class `pf-entry--ffx2`.

## Results by item

| Item | Result | Evidence (under critic/reviews/79adc4ff-focused/) |
|---|---|---|
| PR-0146 (I) | Caption at 6.0 s, first panel at 8.9 s, nothing early | r25/flow-seymour-flux-1600.json |
| PR-0180 (I) | The help bar shows Lance of Atrophy, Full-Life, Dispel and Cross Cleave during each enemy action, then clears | r25/flow-seymour-flux-1600-help-1.jpg |
| PR-0157 (I) | 355 of 355 play-phase samples faded | r25/flow-seymour-flux-1600.json |
| PR-0170 (II, XII) | Attack on a lone boss opens the target step with 0 actions fired; Escape goes back to the menu | r25/pr0170-*-step.jpg |
| PR-0031/0178, PR-0186 (III) | The plate names each aimed target and never meets the card or the rows at 1600, 2000 or 390; the Sensor card folds while aiming; Hastega shows ALL ALLIES at 16 px | r25/ch3-*.jpg, fight-targeting-s1/s2.jpg |
| PR-0215 (III) | "WITHDREW" and "The battle cannot be won from here."; RETRY goes back to a battle menu at 1600 and 390 touch | r25/pr0215-*.jpg, phone-pr0001-withdrew.jpg |
| A-2 | I after a scene: blur. I skipped: `shatter--ffx`. IV and V: `shatter--ffx2`. Reduced motion: `cut`. No swirl anywhere | run log |
| A-4 (debug auto-play) | I, seed 2: all three characters pose. II: all three hold in idle | r25/a4-*.jpg |
| PR-0205 (XI) | Seam plate reads "Magus Sisters". Reached by debug auto-play: the real-key run lost at Shiva | r25/pr0205-ch11-magus-plate-1.jpg |
| PR-0136 (VI) | Links 1 and 2: fiends at x 836-1061 and 859-992, 203 px and 226 px from the party | r25/ch6/ |
| PR-0184/0185 (IX) | The sampler logged 145 head-cut samples while figures slid in enemy and idle rigs. Not judged frame by frame; left for the deep review | r25/ch9/ |
| PR-0164 (II, CHK-013) | Yunalesca's hair ends in a soft, wandering fade during Blind, with no hard column. Valefor (XIV) not captured | r25/flow-yunalesca-1600-help-2.jpg |
| PR-0206 (I, 2000) | Card up (0 px² over the rows); N hides it, N shows it | r25/pr0206-2000x1012-menu.jpg |
| FOC23-01 (I, phone) | Whole apart from the hair tips at the right edge (P-02) | r25/menus/seymour-flux-390x844.jpg |
| Data audit | victoryPose II, IV, V and XIII and the Magus Sisters headline match `research/ffx-vs-ffx2-presentation.md` §2.1–2.2, `ffx2-trema.md` §13 and `ffx2-fallen-aeons.md` | n/a |

Also noted: with seed 1, Chapter I auto-play loses on both the candidate and the live site (the same artifact now). Seed 2 wins. This is a debug helper, not a player path, so it is not an issue.

## Not tested

- PR-0138, a real-key Chapter V win after a Shuyin retry. Unit test only.
- D-221 "Immune to sensors." in the browser. No Sensor-immune target is reachable by real keys; unit test only.
- PR-0212, the Valefor wing edge (XIV), in the running game.
- IX frame-by-frame judgement.

All four are carried to the deep review.
