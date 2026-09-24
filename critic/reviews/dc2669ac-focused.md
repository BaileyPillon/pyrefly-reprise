Build / artifact / target version: dc2669ac (hotfix 12.2 on live bcbdb483), D:/pyrefly-hotfix2/dist-gate index-CzzK-khs.js, targets.json dd884b4c (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate; live verification owed after the deploy)
Changed area: PASS
Ship: SHIP. It fixes Bailey's "attacks target my party" report in both games, the FFX-2 Wait default is unchanged from live, the switched-off ?wait=split works, and there is no regression. Disclosed major: DC2-01. Bailey's second report (Wait holds every action until all three girls have chosen) is still the default, because the split ships switched off until he rules.
Milestone: not assessed
Quality: no full score for this build; the last full score is round 03 (rubric v1, 7191674, 2026-09-19), history only
Targets: required 3 / matched 1 (s2) / failing 1 (s3, pre-existing, identical on live) / unverified 1 (s1) / waiting 0
Top issues: DC2-01 major (Wait default still holds everything, owner decision D-029 follow-up 2); DC2-02 polish (the cursor-side rule is convention, not sourced; Reflect opens on the party where the Evrae tactic C-14 aims it at Evrae); DC2-03 polish (FFX-2 flower on Vegnagun covers HUD panels, same on live); DC2-04 suggestion (no RUNNING chip at the top list under the split)
Coverage: tested: every enabled command row, 4 decisions per chapter, in chapters 1, 2, 3, 8, 4, 5, 6 on both the candidate and live, driven with real keys and mouse. Also Wait default, hold, split and Active in chapters 4 to 6, and outcomes plus results for chapters 1, 4 and 6. Reused: pause legs from bcbdb483-focused. Not tested: phone, ?wait=split on an FFX chapter in the browser, outcomes of chapters 2, 3, 5 and 8, gamepad.
Next required review and why: live verification of the exact artifact after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepBeforeDeploy false)
Elapsed review time / repeated work avoided: about 105 min, mostly building and running the all-rows sweep on both builds; the pause layout was reused from bcbdb483-focused

## What changed (bcbdb483..dc2669ac)

1. 167cd89d (both games): the target cursor opens on the side the command acts on. It opens on an enemy for attacks, debuffs, drains, Dispel and Cheap Shot, on a party member for cures, buffs and Esuna, and on a KO'd ally first for revives. The left-to-right arrow walk is kept. Game case "both". The research files do not say where the retail cursor opens, so the commit calls it FF convention (see DC2-02).
2. cde4b88f and dc2669ac (FFX-2 only): Wait's faithful split is built. The clock runs at the top-level command list and holds in a submenu or at the target cursor (research/ffx2-combat-core.md 1.5). It ships switched off: ?wait=split turns it on and ?wait=hold forces the old behaviour.

## Evidence summary

Renderer: PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti), no fallback. The candidate was served by vite preview on 127.0.0.1:5917 (PID 72600, stopped, port confirmed closed). Live is https://baileypillon.github.io/pyrefly-reprise/.

**Target defaults, live vs candidate (data/sweep-*-summary.txt).** Every enabled row was opened with real keys. The only differences between the two builds:

| Row (chapter) | Live opened on | Candidate opens on |
|---|---|---|
| Power/Armor/Magic/Mental Break (4, 6) | Yuna | the leftmost enemy |
| Drain, Confuse, Break, Doom, Death (4, 5) | Yuna | the enemy |
| Dispel (4, 5) | Yuna | the enemy |
| Cheap Shot (6) | Yuna | the enemy |
| Phoenix Down with a KO'd ally (1: Kimahri, 8: Tidus, 4: Rikku set up) | leftmost party member | the KO'd ally |

Everything else opened exactly where it did live: Attack, single-enemy rows, cures, Haste, Esuna, Regen, Reflect, self rows, and the ALL ALLIES / ALL ENEMIES group chips. A second FFX-2 check: Potion with a KO'd Rikku opens on Yuna and leaves Rikku out.

**Arrow walk.** Right and Left visit every candidate and wrap. The screen cycle is the same as live in all seven chapters. Examples: Leblanc Power Break goes Dr. Goon > Ormi > Fem-Goon > Yuna > Rikku > Paine, and Vegnagun Drain goes tail > Paine > Yuna > Rikku, the same ring as live. Enter and a mouse click on a bracket both commit, and the log shows action-start and damage on the aimed id.

**FFX-2 Wait (data/wait-cand.json, data/wait-live.json).** Clock tick counts:

| Variant | Top list | Previous girl resolves under next menu | Submenu | Target | After pause |
|---|---|---|---|---|---|
| default (candidate and live) | held | no | held | held (chip WAIT — ATB HELD) | wait, held |
| ?wait=hold | held | no | held | held | wait, held |
| ?wait=split | runs | yes (ch4, ch5, ch6) | held | held | split kept, runs |
| Active (candidate and live) | runs | yes | runs | runs (chip ACTIVE — ATB RUNNING) | back to the saved setting |

**Outcomes.** Chapter 4 under ?wait=split played with real Enter only: 53 turns, defeat, results screen, no lock. Chapters 1 and 6 ran under autoBattle to victory, reached the results screen, and a real Enter resolved the chapter outcome. No page errors in any candidate run.

**Layout.** 1600x900 (every capture) and 2000x1012 (ch3, ch4, ch6 cursors, no horizontal scroll). The phone was not needed because no layout or phone code changed.

**Targets.** targeting-s2.jpg matches: hand, bracket and plate on the leftmost Yu Pagoda with all enemies visible. targeting-s3.jpg: the flower opens on the Vegnagun part as approved but covers the intent panel and the command menu, and live is identical (DC2-03).

**Unit and type checks.** tsc --noEmit is clean. The 9 vitest files for the touched area pass (108 passed, 3 skipped).

## Issues

- **DC2-01 (major, disclosed; introducedByCandidate false, regressionVsLive false).** The FFX-2 Wait default still holds every action until the menus are answered. Bailey's second report is therefore not fixed for players, by design, until he rules on D-029 follow-up 2. The faithful split works behind ?wait=split. Fix: flip DEFAULT_WAIT_SPLIT if Bailey picks the split.
- **DC2-02 (polish).** The cursor-side rule is FF convention, not sourced (AGENTS.md rule 14 asks for Bailey's word). Reflect and Regen open on a party member, but the Evrae tactic C-14 puts Reflect on Evrae. Live behaves the same, and the arrows still reach Evrae.
- **DC2-03 (polish, pre-existing).** The FFX-2 flower reticle on Vegnagun's tail is drawn over the intent panel and the command menu at 1600x900. Identical on live.
- **DC2-04 (suggestion, new feature).** With the split on, the clock runs at the top list with no indicator, because the ATB chip only appears at the target cursor.

## Notes

- One renderer crash happened in a harness-misuse run: autoBattle was called before the first menu, and the page sat idle at a held menu on a busy host. The same state idled 6.5 minutes without a crash in the next run, and the chapter completed. This is treated as host or harness trouble, not a product finding.
- Chapter 3: live aims the leftmost pagoda under the id yu-pagoda-right, and the candidate aims it under yu-pagoda-left. Both builds open on the pagoda drawn leftmost. No staging file changed in this diff.
- Chapters 2 and 8 have a single enemy, so single-enemy rows commit without a cursor, the same as live.
- critic-plan diffed from d9decadb, which pulled in paths already reviewed with 76f587c3 and bcbdb483. This review covers bcbdb483..dc2669ac.

Evidence: critic/reviews/dc2669ac-focused/ (captures, composites, data/*.json, and the harness scripts in data/*.mjs).
