Build / artifact / target version: main d89541b6, candidate D:/pyrefly-rel26c/dist-gate (bundle index-eoq6aKmL.js) / targets.json sha256 695d60d1...
Review: focused
Deployment: NOT APPLICABLE (pre-deploy review of the candidate; the live check is its own obligation)
Changed area: PASS
Ship: SHIP. No critical defect and no regression against live release 25 (79adc4ff). Discloses one major: M-01, on a phone Ixion stands on a dark painted slab of the provisional C2 plate (new chapter, not a regression).
Milestone: not assessed
Quality: no current full score; the last full score is round 03 (rubric v1, build 7191674, 2026-09-19), kept as history
Targets: required 2 / matched 2 / failing 0 / unverified 0 / waiting on decision 1 (Ixion scenes C2 vs A1)
Top issues: M-01 major (phone Ixion slab, ixion/390x844-07-recharge-banner.jpg, resolve with the scene pick); P-01 polish (Recharge intent omits the 200 MP); P-02..P-05 polish (phone results label cut, phone board names under the footer, XVI pip at the frame edge, Ixion pause dossier over the mane); S-01 suggestion (FFX two-down card)
Coverage: tested XVI end to end by keys and taps, Bailey's Mega-Potion case by keys (XI, V), revive priority (I, IV), pause (I, II, XVI; 1600, 2000, 390), release-25 save upgrade, data audit; reused the unit gate, the chapter-ixion loss/retry check, verify-approved; not tested VI Fan Slap, X / XIV Bahamut HP in the browser, held-command case by keys, gamepad / Safari / real phone
Next required review and why: live check of the exact artifact after the deploy, then the deep review of d89541b6 on the live build (shared combat core, advisor, chapter registry; also carries 79adc4ff's owed deep review)
Elapsed review time / repeated work avoided: about 80 min (the two XVI runs were 6 and 7 min of play); did not rebuild dist-gate, reused the release gate's unit, tsc and approved-hash outputs

## Environment

- Candidate `D:/pyrefly-rel26c` at d89541b6b14422fff26f31bde9fe27e2f7b3de37. `dist-gate` already existed (built by the release gate, bundle `index-eoq6aKmL.js`); I did not rebuild it. Served with `vite preview --outDir dist-gate` on 127.0.0.1:5466 (PID 72424); stopped by that PID with `taskkill /PID 72424 /T /F`, and port 5466 is confirmed closed.
- Browser: headless Playwright Chromium from node, `PYREFLY_BROWSER=gpu`. No black canvas, so no fallback was needed. One browser at a time.
- Gate outputs on the candidate: vitest 607 files passed / 5 skipped (9,554 tests); verify-approved 271 ok, 0 mismatched, 0 missing.
- `critic-plan --json`: depth deep, **deepBeforeDeploy false**, focusedBeforeDeploy true, deepAfterDeploy true, games both, dataAudit true, approvedArtCheck false.
- Harness: copies of `tests/e2e/ffx2-ixion.spec.ts` and `save-upgrade.spec.ts` (release-25 fixture), with screenshots redirected into this folder, in `tools/zz-foc26-e2e/`; scratch scripts `tools/zz-foc26-{mega,revive,pause,report}.tmp.mjs`. Nothing in the candidate or the main tree's product files was touched.

## Game case (CHK-021)

- Ixion at Djose: **FFX-2 only** (`research/ffx2-ixion-djose.md` §0). It sits in the X-2 group with the ATB tag and the FFX-2 HUD. The FFX aeon Ixion keeps its FFX row (arm a, 2,055 HP).
- Advisor v3 reading commands in flight or held: **FFX-2 only** (CTB has no charging). Revive priority: **both**, and it was seen in both games.
- D-243 aeon arm a: **FFX only** (aeons exist only in FFX). D-242 IC-1 and the Leblanc switches: **FFX-2 only**, unit-tested.
- The pause dossier (D-234) and the board are shared chrome.

## Owner's three asks

1. **The Mega-Potion case, by real keys.** Test setup: the party was set to 30% HP. Pressed Item > Mega-Potion with arrows and Enter. Once in Chapter XI at 1600x900 (seed 1), the next menu opened twice while the potion was still charging. Paine's card said Darkness and Yuna's said Turbo Ether; neither the card nor the rail named Mega-Potion. The same happened once in Chapter V at 2000x1012 (seed 4): the card said Black Sky and the rail said X-Potion -> Paine, a different girl's single heal. Evidence is in `mega/`.
2. **Ixion from the board to a win.** At 1600x900 by keys: 38 decisions, 2 Recharges, 2 Thor's Hammers, the banner showed. Results, the fall, the Abyss, four whistles and the Bevelle wake all appeared, and the board then read "1 of 15" with XVI cleared. At 390x844 by taps: 47 decisions, the same path, "1/15". No page errors. Evidence is in `ixion/`, `ixion-desktop.log` and `ixion-phone.log`.
3. **A save from the live build.** I used `release-25-main.json`, which the live release-25 build wrote itself. On it the board reads "2 of 15 beaten", with both clears, their ribbons and best times, and XI still not cleared. The FFX-2 pause OPTIONS show 45 / 30 / 90, 1.25x and ACTIVE. A reload keeps all of it, and a truncated save boots fresh with no error. 2 of 2 pass. Evidence: `save-r25-*.jpg`.

## Data audit

- Aeon arm a matches `research/ffx-combat-core.md` §6.4.3 row for row (Bahamut 2,935 / 74 / 53 / 60 / 33 / 56 / 18 / 26 / 32 / 17).
- Ixion's stats, rewards and steal match `research/ffx2-ixion-djose.md` §3: 12,380 HP, 9,999 MP, Lv 28, 62/21/106/82, 138/35/4/0, 2,600 / 15 / 1,800, Soul of Thamasa, Sprint Shoes. So does Recharge (+200 HP and +200 MP). Thor's Hammer is non-elemental, labelled our estimate on conflict IX-2.
- Delta Attack's "1 HP and 0 MP" matches `ffx2-fallen-aeons.md`. The MP half has a single source (F-9).

## Issues

- **M-01 (major, disclosed).** On a phone, Ixion stands on a dark painted slab of the provisional C2 plate. introducedByCandidate true, regressionVsLive false, inNewFeature true. Fix it together with Bailey's scene pick.
- **P-01.** Recharge's intent reads "Restores HP to itself." under a DAMAGE heading. The source is +200 HP and +200 MP.
- **P-02.** On the phone results screen the vertical location label is cut.
- **P-03.** On the phone board, the party names sit under the footer prompt.
- **P-04.** On the board at 1600, the XVI pip touches the frame edge.
- **P-05.** In Ixion's pause CHAPTER tab, the dossier sits over the mane (the D-234 slide covers only II and IX).
- **S-01 (low confidence).** With Tidus down as a Zombie and Kimahri down, the FFX card talks only about Tidus. Kimahri's KO came from a debug fixture, so re-test it with a natural KO.

## Checks

Every check is recorded in the JSON. Results: CHK-002 to 011, 013, 015, 016 and 020 to 024 PASS; CHK-017 NOT APPLICABLE (live obligation).

Two harness runs ended on the results screen because the HP fixture made the party lose: V at 2000x1012, and the FFX revive run. I checked the state at each timeout. Neither is a product lock, and neither was captured as evidence.
