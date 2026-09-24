Build / artifact / target version: e3b8c2a3 (hotfix 12.3 on live dc2669ac), D:/pyrefly-hotfix3/dist-gate index-CXcGU7y1.js, targets.json dd884b4c (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (pre-deploy candidate; live verification owed after the deploy)
Changed area: PASS
Ship: SHIP. The Wait split is now the default and works as Bailey chose it in chapters 4, 5 and 6. The three D-121 lines are exact and true. The teardown fix holds, and target defaults are unchanged. Nothing regresses against live. Disclosed majors: none. This candidate closes DC2-01, the major disclosed with dc2669ac.
Milestone: not assessed
Quality: no full score for this build; the last full score is round 03 (rubric v1, 7191674, 2026-09-19), history only
Targets: required 2 / matched 2 (C1 briefing, C3 first-use line) / failing 0 / unverified 0 / waiting 0
Top issues: HF3-01 polish (first key on the first X-2 top list only clears the bubble, same on live); HF3-02 polish (no pause during the Trigger Happy minigame, same on live); HF3-03 polish (clock chip only while aiming, carries DC2-04); HF3-04 suggestion (C1/C3 tile records predate D-121)
Coverage: tested: Wait split with real keys in ch. 4, 5 and 6 at 1600x900 and 390x844, plus 2000x1012 in ch. 4; ?wait=hold; Active; the win-rate bench; one real flow through all seven unlocked chapters, pausing at every battle state; 123 target defaults against dc2669ac; outcomes of ch. 1 and 4. Reused: ch. 4 mode and briefing measurements from an interrupted earlier run of this review on the same artifact. Not tested: gamepad, touch, phone pause, Evrae enemy-action pause, outcomes of ch. 2, 3, 5, 6 and 8.
Next required review and why: live verification of the exact artifact after the deploy, then the deep review this shared-system change owes on the live build (plan depth deep, deepBeforeDeploy false, carried deep from d9decadb)
Elapsed review time / repeated work avoided: about 50 min. The ch. 4 briefing, hold and Active legs were reused from the interrupted run (same dist-gate). The target baseline was reused from dc2669ac-focused.

## What changed (dc2669ac..e3b8c2a3)

1. **2b32ffe7 and 9938c266 (FFX-2 only).** The faithful Wait split is now the default. The clock runs at the top-level list and holds in a submenu and while aiming. It comes with Bailey's D-121 lines 1a, 2a and 3a. `?wait=hold` restores the old whole-menu hold and its lines. Active is unchanged.
2. **e11fcdf1 and b0dd23cd (both games).** A battle screen torn down before its fight starts stays down. The debug triggers moved to BattleScreenDebug.ts.
3. **e3b8c2a3 (both games).** The aim lookup is built once per menu. No behaviour change was intended.

Game case (CHK-021): research/ffx2-combat-core.md 1.5 says that under Wait, "time runs while the top-level Main Command Window is open, but freezes the moment any submenu is entered". Holding while aiming is Bailey's adopted reading (D-029 follow-up 2). FFX is CTB, and none of the Wait work reaches it. In chapter 1, Auron's CTB line "He moves after you. Not before. Use it." shows with no clock chip, and the CTB turn flow is the same as live.

## Evidence summary

Renderer: PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti), with no fallback. The candidate was served by vite preview on 127.0.0.1:5921. PIDs 12720 and then 72148 were each stopped by their own PID, and port 5921 was confirmed closed. Live is https://baileypillon.github.io/pyrefly-reprise/ (dc2669ac).

**Wait split with real keys (data/split-default.json, data/split5-default.json).** Chapters 4 (seed 5), 5 (seed 4) and 6 (seed 3), each at 1600x900 and 390x844, 38 turns in all:

| | Top list | Submenu | Aiming | Skill plays under the next girl's open top list |
|---|---|---|---|---|
| Ch. 4 | runs (+790 to +4666 ticks per 1.5 s) | held 0, 12 of 12 | held 0 + "WAIT — ATB HELD", 12 of 12 | Yuna's Cure under Rikku's list (both sizes) |
| Ch. 5 | runs | held 0, 13 of 13 | held 0 + chip, 13 of 13 | Rikku's Darkness under Paine's list (5 s watch) |
| Ch. 6 | runs | held 0, 8 of 8 | held 0 + chip, 8 of 8 | Paine's skill under Rikku's list (1600) and Yuna's list (390) |

The same holds at 2000x1012 in ch. 4 (data/wide-2000.json, wide-2000-ch4-*.jpg).

**The three lines.** Each was checked word for word against D-121 in the browser:
- Bubble: "Bar's full, she's up! Open a list and take your time, nobody moves." It is 2 lines at 21 px at every size.
- Briefing line 4: "In hers, the clock does not wait. A list stops it." It is 1 line at 54 px, with the gold half in rgb(227,185,74).
- Badge: "Gauges running · a list holds them". It is 1 line with no overflow: 403 px at 1600 and 2000 wide, and inside the viewport at 390.

Each line is true of the default: at the top list the clock runs, and opening a list stops it.

Under `?wait=hold`, the old lines return ("the clock holds while you choose", "Menu's up · gauges holding"), and the top list and submenu both hold at 0 ticks. Under Active, set with real keys on the pause OPTIONS row, ticks run at the top list and in a submenu, and the Active lines are unchanged.

**Win rates (data/measure.log).** tests/unit/ffx2-wait-split-measure.test.ts was run with PYREFLY_MEASURE=1 on the candidate. Every row matches the table in 2b32ffe7's body exactly. For example:
- Ch. 5 default at T 500: 32/40 wins, median 555.3 s.
- Ch. 5 default at T 1500: 5/40.
- Ch. 6 default at T 500: 29/40.
- Hold and T 0: 40/40 in all three chapters.

**Pause in one real flow (data/pauseflow-1600.json).** The run went title, then briefing (skipped with Escape), then chapter select. From there it entered chapters 1, 2, 3, 8, 4, 5 and 6 in turn, each through its cutscene and party prep with real keys. Keys pressed at each state:
- The battle-start card: Escape. The first press takes the card down, by design.
- Top list: Escape.
- Submenu: P.
- Target cursor: C (Start).
- Party action: Escape.
- Enemy action: Escape.
- Next menu: P.

Results:
- 40 of 41 pause attempts opened the pause. The log and ticks stayed frozen for 1.5 s, and Escape resumed with the menu, submenu or cursor intact.
- The one exception was ch. 6 during Trigger Happy (HF3-02), which is the same on live.
- Ch. 8 never reached an enemy action inside the harness window.
- Each chapter was left by the pause menu (OPTIONS, then Chapter select) and reached chapter select.
- No debug call was mixed with a title confirm in this flow, and there were 0 page errors.

**Target defaults (data/sweep-cand-summary.txt against data/sweep-dc2669ac-summary.txt).** Chapters 2, 4, 5 and 6 were driven with real keys, 2 decisions each, under `?wait=hold` to match the old timing. All 123 cursor openings are identical to dc2669ac, the build now live.

**Outcomes (data/outcome-*.json).**
- Ch. 4 victory: cutscene, then results, then Enter, then chapter select.
- Ch. 1 with autoBattle 'intended' through real prep: defeat, then results, then Continue, then party prep. Live does the same with the same harness, so this is not a regression.

**Tests.** 8 targeted vitest files (69 tests) pass on the candidate, including battle-screen-teardown.

**Targets.**
- c1-briefing.jpg: matched. Auron's painting and four lines, with line 4 set to his 2a pick.
- c3-ffx2-replay.jpg: matched. Rikku's line beside the party rows, fading on its own, first time only. The badge and body use the D-121 words.

## Issues

- **HF3-01 polish.** The first Enter on the first X-2 top list only dismisses the coach bubble, and the list stays closed. Live does the same (firstenter-*.jpg). Under the new default, the gauges run while that key is spent. Not introduced by the candidate, and not a regression.
- **HF3-02 polish.** Escape and P do nothing during the Trigger Happy minigame (ch. 6). Live does the same (minigame-*.jpg). Not introduced, and not a regression.
- **HF3-03 polish.** The clock chip appears only while aiming. Nothing marks RUNNING at the top list or HELD in a submenu. This carries DC2-04, which is now seen by every player. Options belong to Bailey (hard rule 9).
- **HF3-04 suggestion.** The candidate tree's records for tiles C1 and C3 still list the superseded Wait drafts as inferred. Record D-121 there on main.

Carried, not re-tested: DC2-02 (the cursor-side calls are unsourced) and DC2-03 (the FFX-2 flower on Vegnagun covers HUD panels, the same as live). DC2-01 is closed by this candidate.

## Not tested

- Gamepad Start (C stood in for Start) and touch.
- Pause at 390x844.
- The Evrae enemy-action pause.
- Outcomes of ch. 2, 3, 5, 6 and 8.
- A real-input exit while enter() is still loading. The keyboard cannot reach that window, because the first press dismisses the card. The unit test covers it.
