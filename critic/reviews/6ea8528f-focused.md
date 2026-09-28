```text
Build / artifact / target version: main 6ea8528f (release 28 candidate) / D:/pyrefly-rel28/dist-gate index-DecUADzw.js / targets.json sha256 695d60d1...2859a55
Review: focused
Deployment: NOT APPLICABLE (pre-deploy review of the candidate; live verification follows the deploy)
Changed area: PASS
Ship: SHIP. No critical defect and no regression against live release 27 (be1e964a); every measured value is equal or better. Majors disclosed: none.
Milestone: not assessed
Quality: not scored here (a focused pass never makes a score current)
Targets: 3 required / 3 matched / 0 failing / 0 unverified / 0 waiting on decision
Top issues: FOC28-P01 (polish, party on the Chapter XVI pit rim on a phone, comment overclaims Paine), FOC28-P02 (polish, Grand Summon subtitle clipped and sub-legible on the phone, carried FOC24-03), FOC28-S01 (suggestion, desktop Grand Summon list shows 4 of 5 rows)
Coverage: tested the five items on the candidate and on live, four real-key chapter paths, FFX-2 absence; reused the fixes-r28 CHECK probes (re-measured here); not tested win/loss, Ronso Rage on the phone, real devices, audio
Next required review and why: the live verification of this artifact after the deploy, then the deep review (shared systems: phone framing, scene runner, chapter registry), which runs on the live build and carries be1e964a's owed deep review
Elapsed review time / repeated work avoided: about 42 minutes / reused the independent CHECK's probe scripts instead of writing new ones
```

# Focused review: release 28 candidate 6ea8528f

**Plan** (`node tools/critic-plan.mjs --json` in D:/pyrefly-rel28): depth deep, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, games both, dataAudit true, approvedArtCheck false. Under "A, B, and C together please" this focused pass is what goes before the deploy.

**Environment.** D:/pyrefly-rel28 at 6ea8528f. Clean apart from `dist-gate/` and `docs/deploys.log`. `dist-gate` was built at 05:51, after the 05:44 commit, and contains the FOC24-01 CSS rule. It was served by `vite preview` on 127.0.0.1:5480 (PID 67548). That server was stopped by its PID, and the port was confirmed closed. Browser: headless Playwright Chromium from node with `PYREFLY_BROWSER=gpu`. No black canvas, so no fallback was needed. One browser ran at a time. Live baseline: https://baileypillon.github.io/pyrefly-reprise/ (release 27).

**Gates:** `tsc --noEmit` is clean. The touched unit tests (6 files, 66 tests) pass. **Data audit:** the three changed files under `src/data` (the chapter, `held.ts`, `action-time.ts`) change comments only. No game value changed, so there is nothing to compare with `research/`.

## The five items, candidate vs live

| Item | Case | Candidate | Live (release 27) | Result |
|---|---|---|---|---|
| IXS-1 | FFX-2 only | Floor under Ixion at 390x844: luma 148, 0 % dark (menu and both of his actions) | 28, 100 % dark | PASS. Desktop 1600x900 is unchanged (145/0 %). |
| IXS-4 | comments | comments only | n/a | PASS |
| FOC24-01 | FFX only | At 390x844 the picker draws over the Zanmato gauge and shows all five rows (91-201). Four Downs and Enter summon Bahamut. | The gauge covers the list below Ixion, and Bahamut is cut off | PASS. Desktop 1600x900 is unchanged (4 rows). |
| FOC24-02 | FFX only | The aeon's status row loads `portraits/bahamut.png` (390) and `portraits/shiva.png` (1600) over the idle crop. These match its turn-list tile. | The row shows only the letter "B" | PASS |
| P-01 | FFX only, Ch. III | Chip gap with the Final Aeon aimed: 72 px to its bracket and 30 px to its plate (1600x900); 76 and 34 px (2000x1012). With a Pagoda aimed, 30-34 px. | 5 px to the bracket, 9 px to the plate | PASS. Escape returns to Attack. |
| P-02 | FFX only | Chapter I at 390x844 spans 32-375 (360x780: 28-344) | 38-384 | PASS |

**No-regression sweep on the phone** (390x844, every staged figure's span at the menu and while aiming):

| Chapter | Candidate | Live |
|---|---|---|
| II | 25-383 | 24-384 |
| III | 24-387 | 10-420 |
| VIII | 21-381 | 26-383 |
| FFX-2 IV | 31-379 | 30-379 (FFX-2 passes 0) |

Rikku's Mix picker (Chapter II, phone) opens above the field with five rows before it scrolls.

**Real-key path** (title → board → party prep → scenes → battle → action → next menu → pause): run in XVI at 390x844, I at 390x844, III at 2000x1012 and IX at 1600x900, with 0 page errors and 0 console errors. The one harness miss was in XVI, and it is the same one the release 27 review hit on FFX-2. The first FFX-2 menu has no Attack, so the arrows landed on Change. The fight itself advances by Enter: Ixion acted twice in the IXS-1 probe.

**Targets.** Composites are in `6ea8528f-focused/`:

- `targeting-one-pagoda.jpg` (fight): every enemy is visible, and the chip is clear of the aimed Pagoda.
- `battle-hud-phone.jpg` (presentation): the build follows option B, the compact rail.
- `zanmato-gauge.jpg` (chapters): the open picker now draws over the gauge on the phone.

All three match on the properties this change touches.

## Issues (none critical or major)

- **FOC28-P01 (polish, FFX-2 XVI, carried).** On a phone, Yuna, Rikku and Paine stand on the pit rim.
  - The floor under Paine measures luma 53-56 with 76-79 % dark. Live measures 23-26 with 96-97 % dark, so it is lighter but still the rim wall.
  - The new comment in `djose-chamber.ts` and the handoff both say "Paine stands on lit stone". The measurement does not support that.
  - Fix: correct the comment. The party's placement belongs to Bailey's plate pick.
  - Tags: introducedByCandidate false, regressionVsLive false.
- **FOC28-P02 (polish, FFX IX, carried FOC24-03).** On the phone, the Grand Summon subtitle runs past the panel edge and is below the legibility floor. The "x2" count on the selected row is gold on gold, so it nearly vanishes. Both are the same on live.
- **FOC28-S01 (suggestion, FFX IX).** On desktop the Grand Summon list still shows four rows, and Bahamut scrolls. This is unchanged from live.

## Checks

| Check | Result |
|---|---|
| CHK-002 | PASS |
| CHK-003 | FAIL: FOC28-P02, carried and not introduced |
| CHK-004 | PASS |
| CHK-006 | PASS |
| CHK-007 | PASS |
| CHK-008 | PASS |
| CHK-009 | PASS |
| CHK-010 | PASS |
| CHK-011 | PASS |
| CHK-013 | PASS |
| CHK-015 | PASS |
| CHK-016 | PASS |
| CHK-017 | NOT APPLICABLE: this review is pre-deploy |
| CHK-020 | PASS |
| CHK-021 | PASS |
| CHK-022 | PASS |
| CHK-023 | PASS |

The reasons and evidence for each are in the JSON.

**Not tested:**

- Kimahri's Ronso Rage list on the phone
- Win and loss outcomes (this change does not touch them)
- The other FFX-2 chapters
- A real phone, real touch, Safari or Firefox, and audio
- The full vitest suite
- Approved-hash verification (the plan set it false, and no art file changed)

Scripts are in `6ea8528f-focused/s/`. The captures are in `cand/`, `live/` and `supp-cand/`.
