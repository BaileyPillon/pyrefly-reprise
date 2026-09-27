Build / artifact / target version: main bc4e70ee (release 24 candidate, D:/pyrefly-rel24/dist-gate, bundle index-C-3hBxzq.js) / targets.json sha256 9d08559d...5e17
Review: focused
Deployment: NOT APPLICABLE (focused review of the production candidate; the live pass is owed after the deploy)
Changed area: FAIL (the fix meets its canon target on desktop with no regression; two majors inside the newly working picker and the new aeon row)
Ship: SHIP. No critical, no regression against live (ff3884fb). Discloses FOC24-01 (phone, Ch IX: the boss gauge panel covers the Grand Summon list, rows 3 to 5 picked blind) and FOC24-02 (the aeon's status row shows a letter instead of its portrait)
Milestone: not assessed
Quality: last full score is round 03 on 7191674 (2026-09-19, rubric v1, history only); no v2 score for this build
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (Shiva tile, extra comparison; no tile in the plan groups is touched, canon is the target)
Top issues: FOC24-01 major (phone picker hidden, ch09-phone-2-picker-row5.jpg, raise the overlay above the boss panels); FOC24-02 major (letter fallback on the aeon row, ch09-ixion-4-aeon-menu.jpg, feed the aeon portrait); FOC24-03 polish (subtitle past the panel edge); FOC24-04 polish (rows return before the KO dismiss beat); FOC24-05 question for Bailey (who poses at victory when an aeon wins)
Coverage: tested below; reused the independent hotfix-24 check (every row in IX, X, I; Banish exits; nine first menus vs live; FF7) for the same source; not tested: Mix/Rage on the phone, gamepad/touch on the picker, Mix pair execution on this build
Next required review and why: live verification of the exact artifact after the deploy, then the deep review owed by this build (and carried from ff3884fb) on the live build, because the FFX CTB engine, presenter and HUD changed
Elapsed review time / repeated work avoided: about 50 minutes (over the 15-minute budget: named risk = victory and KO exits with the party held off the field, and the phone layout of a picker players never saw before); avoided re-running the 15 per-row summons and the nine-chapter first-menu comparison

# Focused review, release 24 candidate (bc4e70ee)

## What changed and the game case

FFX only (research/ffx-combat-core.md §5.4: the player chooses the aeon; §6.1, verified by two
sources: the aeon replaces the whole party, dismissal or its KO returns it). The engine now sends
Grand Summon's picker named entries, the overlay no longer throws, a thrown or cancelled picker
hands the turn back to the menu, Mix gets named ingredients and recipe names, pickers scroll to
the cursor, and the party fades off the field while an aeon is out (PR-0181) with the aeon's row
alone in the status panel. Also on main: docs, concepts, critic tooling and an FF7 audition
candidate mp3 that the build prunes (verified absent in dist-gate; the source decodes, 52.87 s).

Plan (`node tools/critic-plan.mjs --json` in D:/pyrefly-rel24): depth deep, focusedBeforeDeploy
true, deepBeforeDeploy false, deepAfterDeploy true; dataAudit false; approvedArtCheck false.

## Environment

Candidate dist-gate built 13:43 after the 13:24 commit, served by vite preview on 127.0.0.1:5400,
stopped by its listening PID (56604) and the port confirmed closed. Headless Playwright Chromium,
PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti), no black canvas, no fallback. One browser at a
time. Setup through the debug API only (seed 1, chapter with cutscenes skipped, Yuna's or Rikku's
gauge to 100, and enemy HP to 1 for the win route); every command after that was a real key.

## Evidence (critic/reviews/bc4e70ee-focused/)

| Run | Result |
|---|---|
| Owner's case on live (live-ch09) | Reproduced: picker 0 rows, Valefor out, party at alpha 1 with three rows |
| IX Ixion, row 3, 1600x900 (ch09-ixion) | Listed Valefor, Ifrit, Ixion, Shiva, Bahamut; Ixion out; party alpha 0; one row "Ixion"; Dismiss by keys: party alpha 1, three rows; no console error |
| IX Shiva, row 4, KO exit (ch09-shiva-ko) | Shiva out; Yojimbo KOs her (dismiss reason ko); party back at alpha 1 with three rows and the next menu |
| X Bahamut, row 5, 2000x1012, win (ch10-bahamut) | 5th row scrolled into view; Bahamut out alone; targeting keeps the party at 0; the win reaches the Victory results screen |
| IX Bahamut, 390x844 (ch09-phone) | The pick works, but the Yojimbo panel covers the list (FOC24-01) |
| VII Mix (ch07-mix) | 15 named items with counts; row 12 (Grenade) in view; Escape returns to Rikku's menu, gauge 100, no pause screen |
| FFX-2 IV absence (ch04-ffx2) | 45 s real keys: 25 actions, 26 damage events, no summon events, three figures at alpha 1, three rows, no page error |
| Unit | ffx-overdrive-pickers, ffx-overdrive-picker-presenter, summon-staging: 20 tests pass |
| Target | shiva.jpg: Shiva's identity matches the approved tile in game |

## Checks

CHK-015, 016, 021, 022, 023 PASS (mandatory); CHK-004, 006, 007, 008, 009, 013, 020 PASS;
CHK-010 FAIL (phone, FOC24-01); CHK-003 UNVERIFIED (effective text size not measured);
CHK-001, 019, B1 NOT APPLICABLE (no shipped audio or generated asset changed); CHK-017 NOT
APPLICABLE (live pass after the deploy). Details in the JSON.

## Issues

- **FOC24-01, major.** Phone, Chapter IX: the Grand Summon panel sits under the Yojimbo gauge
  panel; only Ifrit and Ixion show, and Shiva and Bahamut are chosen out of sight. The pick
  still summons the right aeon. Not a regression (live had no working picker). Other chapters and
  Mix/Rage on the phone were not checked.
- **FOC24-02, major.** The aeon's new status row shows a letter (I, S, B) where a portrait
  belongs; the turn list already shows the approved aeon portraits (CHK-012).
- **FOC24-03, polish.** The subtitle "GRAND SUMMON · AEON ARRIVES WITH A FULL OVERDRIVE" ends 28 to 31 px
  past the panel's slanted edge at all three sizes.
- **FOC24-04, polish.** On an aeon KO the party rows come back as soon as the state changes,
  while the KO'd aeon is still on the field and the party is still invisible, until the dismiss
  beat plays.
- **FOC24-05, question for Bailey.** When an aeon wins, it takes the victory pose alone and the
  party stays off into the results screen. research/ does not say what the game does here.

Known and not in this release (from the handoff, not new findings): the aeon's scale beside the
party (plan B.2) and the Valefor painting's colour await Bailey's pick. On live and on the
candidate alike, a single Enter on Attack confirms at once in these fights. This matches live,
so it is not a regression.
