Build / artifact / target version: bcbdb483 (hotfix on live 76f587c3; D:/pyrefly-hotfix dist-gate, bundle index-D_Y69PMP.js) / targets.json sha256 dd884b4c (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (pre-deploy; live verification is its own obligation)
Changed area: PASS
Ship: SHIP. The Chapter II snapshot is fixed, and 196 portrait records match live on every other surface. No critical issue, no regression. Disclosed major: HF-BCB-01 (phone CHAPTER tab text overlap, the same on live)
Milestone: not assessed
Quality: no score from a focused pass; the last full score stays with its own build and date
Targets: required 2 / matched 2 / failing 0 / unverified 0 / waiting 0
Top issues: HF-BCB-01 (major, not a regression). At 390x844 the objective line is drawn over THE PARTY rows and ENCOUNTER is cut to "BOSS HP 100...". Evidence: bcbdb483-focused/{cand,live}/yunalesca-pause-chapter-390x844.jpg. Next: a phone-block layout fix
Coverage: tested chapters 1-6 and 8 on both builds at five viewports with real input, plus the portrait inventory on six surfaces. Nothing reused. Not tested: chapter 7 (locked), 1440p/4K/4:3, gamepad/touch
Next required review and why: live verification of the deployed artifact, then the deep review owed after the deploy (global layout and screens are a shared system), with the deep carried from d9decadb
Elapsed review time / repeated work avoided: about 28 min / no combat audit (the change touches no engine or presenter)

# Focused review: bcbdb483 (pause snapshot portrait guard)

**Renderer:** `PYREFLY_BROWSER=gpu`, headless Chromium through Playwright, ANGLE D3D11 on an RTX 5070 Ti. No fallback was needed.
**Candidate:** `vite preview` of `D:/pyrefly-hotfix/dist-gate` at 127.0.0.1:5912. It was stopped after the review by its own listening PID (14632), and the port was confirmed closed.
**Baseline:** the live site https://baileypillon.github.io/pyrefly-reprise/, confirmed as 76f587c3 (bundle index-81kxOXnv.js, artifactHash b1924762...). The same script ran against both builds.

## What changed and its game case
- `pause/markup.ts`: snapshot `<img>` elements now carry `data-face-crop-manual`.
- `ui/common/portrait.ts` and the new `portraitHost.ts`: the adopter skips an `<img>` whose parent is `position: static`.
- **Case: both.** This is shared pause and portrait plumbing and a bug fix (CHK-020, CHK-021). Both games were checked.

## The owner's defect: reproduced on live, fixed on the candidate
Chapter II (yunalesca), the CHAPTER tab after a real Escape and then E presses:

| Viewport | Live 76f587c3: auron.png snapshot | Candidate bcbdb483 |
|---|---|---|
| 2000x897 | data-face-crop=auron, absolute, **1921x1441**, escapes its 130x147 figure | manual, static, 130x98 (4:3), inside its figure |
| 1600x900 | **1581x1186**, drawn over the whole tab | 104x78 (4:3), inside |
| 2000x1012 | 1921x1441 | 130x98, inside |
| 1280x720, 390x844 | snapshots hidden by CSS on both builds | the same |

Evidence: `bcbdb483-focused/live/yunalesca-pause-chapter-1600x900.jpg` (Auron fills the screen) and `bcbdb483-focused/cand/yunalesca-pause-chapter-2000x897.jpg` (three snapshots framed at 4:3).

All reachable chapters (1-6 and 8) were checked at five viewports on the candidate. Every snapshot is inside its figure at 4:3, nothing is adopted, and no image is wider than 90% of the window. Chapter 7 is locked on both builds and never reaches party-prep.

## The guard against regressions: every other portrait surface
The script took an inventory of every `img[src*="/art/portraits/"]` on these surfaces in every reachable chapter, on both builds:
- chapter select
- party prep faces
- the cutscene dialogue card
- the battle HUD: FFX CTB tiles and party window, FFX-2 party rows
- the pause
- the results screen

For each image it recorded `data-face-crop`, the manual flag, the host element, the position, the size, and whether the image escapes its host. It compared 196 records. The candidate and live builds differ only in the Auron snapshot. Four other records differed only because their height was 0 on live: those images were still loading over the network, and their crop, host and position were identical. On the candidate, no untagged portrait sits under a static parent, so the guard skips nothing on any other surface. Zero console errors and zero responses at 400 or above. All eight chapters reached their results screen.

## Checks
| Check | Result | Note |
|---|---|---|
| CHK-002 | PASS | Pause owns the window at the five sizes; 2560/4K are left to the deep review |
| CHK-003 | PASS (scoped) | Nothing the change touches shrinks; HF-BCB-01 is the same on live |
| CHK-008 | NOT APPLICABLE | No panel or actor moved; HUD portraits are the same as live |
| CHK-009 | PASS | Snapshot captions show in full |
| CHK-015 | PASS | Real Enter, Escape, E and Escape in every chapter |
| CHK-016 | PASS | screen, pause and tab are asserted before every capture |
| CHK-017 | NOT APPLICABLE | Pre-deploy |
| CHK-020 | PASS | Both games checked |
| CHK-021 | PASS | Case: both |

## Targets
- `pause-until-dawn-sheet.jpg`: pause sheet compared with the chapter 1 CHAPTER tab at 1600x900. Matched on the properties the change can affect.
- `A-dialogue.jpg`: dialogue mockup compared with the chapter 1 cutscene card. The portrait keeps its framed crop. Matched.

## Issues
**HF-BCB-01 (major; introducedByCandidate false, regressionVsLive false, inNewFeature false).** At 390x844 the CHAPTER tab draws the eyebrow and the objective line over THE PARTY rows. The ENCOUNTER value is cut to "BOSS HP 100...". The pixels are identical on live. The cause is suspected to be in the phone block of `pause-screen.css` and was not traced. Suggested fix: give the objective its own row, or let the columns scroll, and let the value wrap. Acceptance check: at 390x844 in chapters 1 and 4, no text box inside `.pause__body` overlaps another and no value is ellipsised.

## Not tested
- chapter 7 (locked)
- 1440p, 4K and 4:3 shapes
- gamepad and touch on the CHAPTER tab
- retry and defeat surfaces

A portrait inserted into a detached host was checked by reading the code only. `getComputedStyle` returns an empty position for it, which the guard treats as positioned, so its behaviour is unchanged.
