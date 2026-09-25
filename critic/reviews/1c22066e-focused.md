Build / artifact / target version: 1c22066e (release 14 candidate against live a999d133), D:/pyrefly-rel14/dist-gate, bundle l_HXObKO; reviewed manifest 9690a661bd596865 (941 files, all decode-checked, 0 problems); targets.json 7dd7bad4 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate; live verification owed after the deploy)
Changed area: PASS (every change is present and works, and nothing regressed against live; one new-feature polish item, R14-04)
Ship: SHIP. There is no critical defect and no regression against live, and every adopted change works with real input. Disclosed major: R13-04 (Evrae, Chapter VIII: the FFX command stack covers Tidus; the same on live).
Milestone: not assessed
Quality: no full score for this build; the last full score is round 03 (rubric v1, 7191674, 2026-09-19), history only
Targets: required 3 / matched 2 / failing 0 / unverified 0 / waiting on decision 1 (the Vegnagun part ring on the command window, which waits on the link-3 staging pick)
Top issues: R13-04 major (Evrae: the stack covers Tidus, same on live, disclosed). Polish: R14-01 (the Left Bulwark ring sits on the menu, same on live), R14-02 (ch. I target name tag on Yuna's head, same on live), R14-03 (the ch. I advisor still reads phase 2 from HP), R14-04 (Node marker text 13.9 px at 1600x900, new), R14-05 (phone pause truncates values, same on live)
Coverage: tested: the real-key flow into all seven listed chapters at 1600x900 and 2000x1012 on both builds; a targeting step on each; Vegnagun links 2 and 3 with a real-key aim at a Node and at Left Bulwark; every phone pause tab in I, IV and V on both builds; pause faces at five sizes; engine outcomes on 16 seeds per build; RESTART ENCOUNTER by real keys in I and IV; the artifact decode check; tsc; the 19 changed vitest files. Reused: none. Not tested: the Evrae targeting bracket, the results screen after a real-key win, the full suite, gamepad, touch, Safari, Firefox, a real phone, the unlisted IX to XI, and listening.
Next required review and why: live verification of the exact artifact after npm run deploy. The deep review this shared-system change owes then runs on the live build (plan depth deep, deepBeforeDeploy false, deepAfterDeploy).
Elapsed review time / repeated work avoided: about 90 min, of which about 55 min was unattended GPU capture. The harness from the release 13 review was reused, so no scripts were rebuilt.

## Plan and case

`node tools/critic-plan.mjs --json` in D:/pyrefly-rel14 returns:

- depth deep, with **deepBeforeDeploy false**
- games both
- chapters I, II, III, IV and V
- dataAudit true, approvedArtCheck false
- obligations: live, focused, deep

Under the 2026-09-21 release rule ("A, B, and C together please.") the focused pass decides the deploy. The deep review follows on the live build.

Game cases (CHK-021), with sources:

**FFX only**
- The Poison crossing (6debabd9). research/ffx-seymour-flux.md §4.3, table line 313: "HP loss came from Poison: no threshold reaction, no pattern change". Also §2.2 line 200 [verified: 2 sources].
- The ch. I bracket and staging (R13-02).
- Evrae holdParty (R13-03).

**FFX-2 only**
- The D-044 Node C markers and the lit first aim.

**Both**
- Plate docking (shared targetCursorParts).
- The phone pause lift (R13-05). Its rule is shared; the case it names is FFX-2.
- The guide and tactic lookup keyed by game (4be5a95f).
- Formation repair 2 as plumbing (ch. II and III FFX, ch. V FFX-2).

Presence and absence:
- The Node markers mount only from `FFX2BattleHud.ts`. They appear only on V link 2, and not on live or in IV, VI or the FFX chapters.
- FFX-2 engine outcomes are identical on both builds (IV 3 seeds, V 2, VI 1).
- The guide lookup is proved by tactics-lookup.test.ts and strategy-guide.test.ts, which pass.

Data audit:
- The only changed data values are the Natus preset (unlisted Chapter X): Gagazet cells copied, and Rikku's MP pinned at 130.
- Rikku's MP matches `fahrenheit.ts` lines 179 and 192.
- Both are owner-chosen `[estimate]` rules, which the research names as bounds. No sourced number changed.

## Evidence

Renderer: PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti) throughout, with no fallback.

The candidate was served by `vite preview` on 127.0.0.1:5914. It ran twice, as PIDs 70776 and 70612, and was stopped each time by its own PID. Port 5914 was confirmed closed.

Live: https://baileypillon.github.io/pyrefly-reprise/ (a999d133). All runs: 0 console errors, 0 HTTP errors.

**Staging, every listed chapter, real keys.** Frame visibility from `visibilityInFrame()` at the first menu, live to candidate (data/sweep-*.json):

| Chapter | 1600x900 | 2000x1012 |
|---|---|---|
| I Seymour Flux | Mortiorchis 0.68 to 0.96, Seymour 0.81 to 0.87, Kimahri 0.41 to 0.42 | Mortiorchis 0.88 to 0.95 |
| II Yunalesca | no material change | no material change |
| III BFA | Yu Pagoda left 1.00 to 0.89, right 0.90 to 1.00, Auron 0.38 to 0.42 | Auron 0.38 to 0.46 |
| VIII Evrae | Rikku 0.61 to 0.86 (R13-03 fixed); Tidus 0.24 to 0.25 (R13-04) | Rikku 0.85 to 0.85; Tidus 0.21 to 0.25 |
| IV Bahamut | Paine 0.96 to 0.83 (relax spread; the scene is unchanged and the capture pair looks identical) | Paine 0.95 to 0.90 |
| V Vegnagun | Tail 0.86 to 0.86, Yuna 1.00 to 0.92 | Rikku 0.94 to 0.89 |
| VI Leblanc | unchanged | unchanged |

**R13-02, the ch. I bracket.**
- Targeting step, both sizes: on live the bracket's left edge and the pointer hand sit on the NEXT BEST MOVE card.
- On the candidate, both clear it (cand/live-seymour-flux-*-target2.jpg).

**Vegnagun, links 2 and 3.**
- The debug autopilot carried seed 1 to each link. After that, real keys did the rest: Yuna's WHITE MAGIC menu answered, then ATTACK, then the arrows.
- Link 2: three markers (NODE A, C, B) sit at the top edge in red. They slide off the TARGET plate and the Wait chip: 0 px2 on the command window, and 0 px2 for the plate.
- Aiming at Node A lights its marker pink, lights the NODE A row, and shows TARGET Node A PART.
- The first aim lights the boss row.
- Link 3: the Left Bulwark plate is on the command window at 1800 px2 on live and 0 on the candidate, at both sizes. It now docks above ATTACK.
- The ring still draws on ATTACK/SKILL on both builds. That is the open staging pick (R14-01).
- Composites:
  - vegnagun-parts.jpg and vegnagun-node-c.jpg: match Node C, "an arrow and a name mark each at the top edge".
  - targeting-ffx2-vegnagun-part.jpg: the plate and PART tag match; the ring is waiting.

**R13-05, the phone pause at 390x844.** Every tab in I, IV and V (phonepause/*.json): the columns' lowest text is compared with the caption's top (692 px).
- Live clashes on 12 of 24 tabs:
  - the FFX-2 member tabs (bottom at 712);
  - CHAPTER (up to 829);
  - MUSIC (985) in both games.
- The candidate clashes on none: bottoms at 532 to 676.
- Composite pause-phone.jpg: the Until Dawn layout, unchanged in composition.

**Chapter I outcomes** (data/outcomes.json, intended autopilot, seeds 1 to 8):
- Candidate: 5 wins and 3 losses. Live: 6 and 2.
- Only seed 8 flips, from a win in 69 turns to a loss in 61. The live win had one Poison-era self-Flare.
- This matches the builder's 400-seed measurement: 227 to 214 wins, with every changed run among the Poison crossings.
- The remaining self-Flares (seeds 2, 4 and 5, the same on live) were traced in data/selfhit.json:
  - two follow the party's own Dispel of his Reflect, which is canon (§2.2 line 252);
  - the third is identical on live.

**Restart (BattleScreenFlow and restartCarry changed).** RESTART ENCOUNTER was reached by real keys: Esc, arrows to OPTIONS, then down to "Restart encounter", then Enter.
- It returns a fresh first menu with full HP in I and IV. The log goes from 21 to 3 and from 16 to 9 (restart/).
- pause-restart-checkpoint.test.ts covers all 10 chapters.

**Tests.** In D:/pyrefly-rel14: `tsc --noEmit` is clean, and the 19 changed test files (209 tests) pass, including seymour-flux-poison-crossing, ui-ffx2-vegnagun-part-labels, pause-phone-fit and tactics-lookup.

## Ship decision (tags, then the rule)

| ID | Severity | introducedByCandidate | regressionVsLive | inNewFeature |
|---|---|---|---|---|
| R13-04 | major | false | false | false |
| R14-01 | polish | false | false | false |
| R14-02 | polish | false | false | false |
| R14-03 | polish | false | false | false |
| R14-04 | polish | true | false | true |
| R14-05 | polish | false | false | false |

`shipVerdict` gives SHIP. R13-04 is disclosed and carried. `validateReport` returns no errors.

## Issues

- **R13-04 (major, disclosed, same on live).** In Evrae, the FFX command stack covers Tidus: 0.25 on the candidate, 0.24 on live. The options sheet from 4f924040 awaits Bailey.
- **R14-01 (polish).** At V link 3, the Left Bulwark ring and petals draw on ATTACK/SKILL on both builds. The plate is fixed. Build Bailey's link-3 staging pick once it is made.
- **R14-02 (polish).** In the ch. I targeting step, the Mortiorchis name tag sits at Yuna's head, on both builds.
- **R14-03 (polish, from the plan, not reproduced).** The ch. I advisor still reads phase 2 from HP after a Poison crossing, while intent.ts reads the stored phase.
- **R14-04 (polish, new feature).** The Node marker text is 13.9 px effective at 1600x900, 0.1 px under the 14 px floor.
- **R14-05 (polish, same on live).** The phone pause truncates "PRIDE OF TH..." and "BOSS HP 100...".

## Not tested

- The Evrae targeting bracket: the targeting class was set, but no plate appeared within 1 s.
- The results screen after a real-key win.
- The full `npm test`.
- Gamepad, touch (keys were used at 390x844), Safari, Firefox and a real phone.
- The unlisted chapters IX to XI.
- Listening (no audio changed).
