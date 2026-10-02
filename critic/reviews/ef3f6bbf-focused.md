Build / artifact / target version: ef3f6bbf (release 35 candidate, D:/pyrefly-rel26c/dist-gate, bundle index-DiuZMSBm.js) / targets.json sha256 88d11541 (candidate tree)
Review: focused
Deployment: NOT APPLICABLE (production candidate, not yet deployed)
Changed area: FAIL (item (3), the living pause portrait, is not in the build; the other tested items pass)
Ship: SHIP — no critical defect, no regression against live 25faec70; majors disclosed: FR-35-01 (the living pause portrait is not in this release; do not announce it)
Milestone: not assessed
Quality: no new full score; the last full score belongs to its own build (see critic:status)
Targets: required 3 / matched 1 (Until Dawn pause) / failing 1 (Living portrait feel, D-143) / unverified 1 (new key art in game) / waiting 0
Top issues: FR-35-01 major (the release claims living portraits; the candidate has none: PortraitDriver is never attached, branch r35-portraits not merged); FR-35-02 polish (FFX Ch I: the KO lie-down figure runs under the party panel)
Coverage: FFX Ch I by keys at 1600x900 and FFX-2 Ch IV by keys at 2000x1012, each from the title to the board and won; pause probes at FFX 1600 (mouse), FFX-2 2000 (mouse), both games at 390x844 (touch) and FFX 1600 with reduced motion; 2x tier on desktop and phone; tsc; 26 changed test files; approved-art hashes. Not tested: Sin XVII and XVIII (F3, F4), F6, U1 to U6 one by one, the vis-fix chapters V, XI and Den of Woe, the other 16 chapters.
Next required review and why: the live review of the deployed artifact, then the deep review on the live build (plan depth deep, deepAfterDeploy true: presenter, asset loader, global layout, both HUDs)
Elapsed review time / repeated work avoided: ~60 min, including two playthroughs of about 13 min / reused the route harness and the 25faec70 audio evidence (audio unchanged)

# Focused review, release 35 candidate ef3f6bbf

Browser: headless Playwright from node with PYREFLY_BROWSER=gpu (ANGLE D3D11, RTX 5070 Ti). No fallback was needed.
Server: `vite preview` of dist-gate on 127.0.0.1:5641. I stopped it by its listening PID (29336) and confirmed the port closed.

## Plan
I ran `node tools/critic-plan.mjs --json` in the candidate:
- depth: deep
- `deepBeforeDeploy`: false
- `focusedBeforeDeploy`: true
- `deepAfterDeploy`: true
- games: both
- `dataAudit` and `approvedArtCheck`: not set

I checked the approved-art hashes anyway.

## The headline: the living pause portrait did not ship (FR-35-01)
The change description lists item (3), "Living portraits in the Until Dawn pause (D-021, D-143 feel A2) under the LIVING PAINTINGS switch, REDUCE MOTION static". That item is **not in ef3f6bbf**:
- `PortraitStage.attachDriver` and `setGaze` have no caller anywhere in `src/`. No `PortraitDriver` exists, and the pause art has no canvas.
- The lane `r35-portraits` (commit cbe8d0bd, docs only) is **not an ancestor** of ef3f6bbf. It found the following:
  - The A2 rig was built on the CTB close-up `portraits/yuna-x2.png`, not on the pause plate `pause/yuna-ffx2.png`.
  - No pause plate has the painted face parts A2 needs: closed eyes, iris and socket, the open smile and the press.
  - The pause has no gaze input.
  - So all ten plates stay static. The port waits on face paintings and on Bailey's answers.
- In game, the pause shows the same plate as live, with the existing slow push-in and drift of the whole plate (CSS `pause-push`, `pause-drift`, unchanged since release 34). The face does not move.
- Toggling LIVING PAINTINGS with the mouse switches only the battle's option B. The pause plate drifts in both states.
- REDUCE MOTION ON makes the plate fully still (1 distinct frame out of 5).
- `targets.json` lists the "Living portrait feel (both)" tile as delivery `not-scheduled`.

This is a missing new feature, not a broken shipped one. It does not exist on live either, so it does not hold the build. **The release announcement must not claim living portraits.**

## Candidate against live (real input)
| Item | Result |
|---|---|
| F1: the first Esc at Chapter I's first menu (FFX) | Opens the pause on the first press at 1600x900, at 390x844 by touch, and with reduced motion. FFX-2 Ch IV also opens on the first press. Live needed two presses (FR-34-01). |
| Pause, OPTIONS rows, Esc RESUME | Same rows as live, plus CINEMA LIGHT / LIVING PAINTINGS / BATTLE SPECTACLE. Rows toggle by mouse and by tap. Esc returns to the battle in all 5 probes. X-2 BATTLE and ATB SPEED appear only in FFX-2. |
| Party wind-up and follow-through keys (D-313) | FFX: tidus and auron `ready`/`follow` load and play in Ch I. FFX-2: rikku-dark-knight, paine-warrior and rikku-black-mage `ready`/`follow` load in Ch IV. The hooded White Mage Yuna raises her staff in the hooded key. |
| Boss keys (D-314) | Ch IV: ffx2-bahamut `attack`/`hurt`/`ko`. Ch I: the seymour-flux and mortiorchis keys. All return 200. |
| 2x tier (D-315) | `ffx2-bahamut/idle@2x.png` loads at 2000x1012. At 390x844 touch only the 1x idle loads. The shipped manifest carries `states2x` for 16 subjects, with 24 masters. |
| Full chapter flow | Ch I: victory in 73 turns (same seed and turn count as the release 34 run). Ch IV: victory in 25 turns. Both reach results, the board, and the board again after a reload. 0 console errors and 0 missing files. |

Composites (target vs build): `ef3f6bbf-focused/pause-until-dawn-ffx-1600.jpg` and `pause-until-dawn-ffx2-2000.jpg`. Both match the approved Until Dawn sheet, frames (a) and (c). The A2 clip has no in-game counterpart to pair with (FR-35-01).

## Game case (CHK-021)
- Pause, the look rows and the 2x tier apply to both games (shared plumbing), and both behave the same.
- The FFX party keys appear only in Ch I, and the FFX-2 dressphere keys only in Ch IV.
- Hooded White Mage is FFX-2 only, as the art handoff states.
- F1 applies to FFX only, and FFX-2 is unchanged.
- I did not test the Sin-only fixes, F3 and F4 (FFX only).

## Automated
- `npx tsc --noEmit` is clean.
- The 26 changed test files pass: 221 tests.
- verify-approved (ROOT = candidate): 469 ok, 0 mismatched, 0 missing.
- The same 469 files hashed inside dist-gate: 0 mismatch, 0 missing.
- route-index over the 72 asserted captures: 0 unverified, 0 mismatches.

## Issues
- **FR-35-01 (major; new feature, not shipped; introducedByCandidate false, regressionVsLive false, inNewFeature true):** living portraits in the pause are missing; see above. Fix: do not announce them, and take the r35-portraits questions to Bailey (paint face parts per plate, and choose a gaze input).
- **FR-35-02 (polish, FFX Ch I):** the new lie-down KO figure of Yuna runs under the left edge of the party status panel at 1600x900 (`route/seymour-flux-win-keys1600/23-midfight.jpg`). The suspected cause is the KO size and lie-down change; I did not trace it.

## Not tested (goes to the deep review on the live build)
- Sin XVII and XVIII: the F3 advisor strip and the F4 Orders rows.
- F6: the Sphere Grid keys, the pad, and the phone explainer.
- F2: the `%23n` request, which only 404s on Pages.
- The U1 to U6 items one by one.
- The vis-fix items in Ch V, Ch XI, Den of Woe and the Mortiorchis dissolve.
- The other 16 chapters and their new boss keys.
- Frame time and memory with the 2x masters.
- The full `npm test`.
- CHK-B1 (listening).
