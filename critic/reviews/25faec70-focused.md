Build / artifact / target version: 25faec70 (release 34 candidate, D:/pyrefly-rel26c/dist-gate, bundle index-cJFxGdIo.js) / targets.json sha256 88d11541 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (production candidate, not yet deployed)
Changed area: PASS (every owner-reported pause/flow defect fixed with real input, no regression vs live f302f163; parts evidenced by tests only are listed under "not tested")
Ship: SHIP — no critical defect, no regression against live; majors disclosed: none
Milestone: not assessed
Quality: no new full score; last full score belongs to its own build (see critic:status)
Targets: required 1 / matched 1 / failing 0 / unverified 1 (Swordplay overlay tile, not captured) / waiting 0
Top issues: FR-34-01 polish (FFX: first Escape at the first menu is swallowed; same on live); FR-34-02 polish (harness: phone route cannot page Items to Poison Fang)
Coverage: Chapter I title to board by keys (win) and by touch (loss + retry); pause flow probe in FFX I 1600x900 mouse, FFX-2 IV 2000x1012 mouse, FFX I 390x844 touch, plus the same probe on live; tsc, changed tests, full suite, audio QA, approved-art hashes. Not tested in game: Overdrive overlays, FFX-2 seam arc, Sin link-3 retry, new poses.
Next required review and why: live review of the deployed artifact, then the deep review on the live build (plan depth deep: combat core, presenter, audio routing, asset loader, layout; carried deep owed from f302f163)
Elapsed review time / repeated work avoided: ~58 min (two 8-min Chapter I playthroughs and a full unit run included) / reused the route harness and the 52a431d0 audio-overlap baseline (routing re-read only)

# Focused review, release 34 candidate 25faec70

Browser: headless Playwright from node, PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti); no fallback needed.
Server: `vite preview` of dist-gate on 127.0.0.1:5617, stopped by its listening PID (19864) at the end; port confirmed closed.

## Plan
`node tools/critic-plan.mjs --json` in the candidate: depth deep, `deepBeforeDeploy: false`, `focusedBeforeDeploy: true`, `deepAfterDeploy: true`, games both, dataAudit true, approvedArtCheck false (hashes checked anyway).

## Candidate against live (the same probe, real input)

| Owner defect | Live f302f163 | Candidate 25faec70 |
|---|---|---|
| PR-0265 pointer ESC RESUME | click leaves the pause up | closes the pause (FFX 1600, FFX-2 2000, FFX phone tap) |
| PR-0266 TEXT SIZE 130 % while a menu is open (FFX) | 6 rows, stack top 327 px over the help slab | re-capped to 4 rows, stack 501-836 px; FFX-2 unchanged at 3 rows |
| PR-0284 REPLAY BRIEFING | under the pause (top element = pause tab) | on top (top element = briefing) in all three runs |
| PR-0283 RESTART ENCOUNTER | roots title + battle in 28 of 30 samples | battle only, 0 title roots over 9 s; a new battle screen |
| QUIT TO TITLE | two title roots | one title root; Enter then reaches the board |
| D-305 CREDITS | no row | OPTIONS > ABOUT > CREDITS opens 26 entries in 4 groups, scrolls by keys, Esc back to the pause |

PR-0264 aim-first: in the 390x844 touch route every single-target pick took aim then commit (2 taps) on the wanted figure, 0 mismatches.

Composites (target vs build): `25faec70-focused/credits-o1-options.jpg`, `credits-o1-panel.jpg`, `credits-o1-panel-390.jpg`. Matched: O1's row, panel, Esc BACK and scroll hint. The column sits on the side away from the portrait, which is a responsive placement and not a defect.

## Game case (CHK-021)
Pause, flow, credits, audio routing and aim-first apply to both games (shared plumbing). The PR-0266 re-cap is FFX only: it is present in FFX and the FFX-2 list is unchanged. Swordplay and Bushido Fail and Immune rows, Tornado 3 s, the Blitz Ace finisher and SIN_LINK3_CHECKPOINT are FFX only (`src/battle/ffx`; research/ffx-combat-core.md §5.3 and §5.5). PR-0300 is FFX-2 only.

## Data audit
Only two data values changed:
- `SIN_LINK3_CHECKPOINT = true`: D-284 adopted. It is an adaptation and claims no source.
- Tornado timer 3000 ms: D-312, labelled as an estimate (GameFAQs KeyBlade999 and two other guides).

The Fail, Immune and finisher numbers were already in the data and match the rows in §5.3 and §5.5. The engine now uses them. The tests ffx-overdrive-fail-rows, ffx-bushido-* and ffx-blitz-ace-finisher pass.

## Automated
- `npx tsc --noEmit` is clean.
- 41 changed test files: 427 tests pass.
- Full `npm test`: 10,756 pass and 1 fails. The failure is a 15 s timeout under load in strategy-ffx2-bahamut "heal-only route"; all 19 tests in that file pass when run alone, in 8.7 s.
- `qa.mjs --strict` passes, and the shipped audio totals 88.49 MB against the 90 MB budget.
- verify-approved: 365 ok, 0 mismatched, 0 missing.
- `dist-gate/third-party-licenses.md` is present, and the three.js notice is in the bundle.

## Issues
- **FR-34-01 (polish, FFX, live too):** at the first command menu of Chapter I, the first Escape does not open the pause and a second press does. FFX-2 opens it on the first press. Suspected cause: the coach or advisor focus takes the first Escape (not traced).
- **FR-34-02 (polish, harness):** on the phone the Items list opens (same on live), but `route.mjs --touch` never pages to Poison Fang and takes Attack instead, so the touch run lost in 9 turns. This is a limitation of the review tool and is not shown to be a product defect.

## Not tested (goes to the deep review on the live build)
- Overdrives played through their real overlays: Swordplay restart, Bushido reset, Fail and Immune rows, overlay titles.
- The FFX-2 seam arc release (PR-0300).
- The Sin link-3 retry.
- Rest poses, kneel slots, the Seymour KO, the Bahamut splash and Paine Songstress in game.
- The Ch VII CONFIRM staging.
- Cure-hint card placement in the browser.
- Hi-Potion on a Zombie ally by touch.
- That a single mouse click still confirms on desktop.
- The other 16 chapters.
- The listening score (CHK-B1).
