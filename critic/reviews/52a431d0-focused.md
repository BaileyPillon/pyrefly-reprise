```text
Build / artifact / target version: 52a431d0 (branch release-31a) / D:/pyrefly-rel28/dist-gate, index-C_4T6wOX.js + index-C3o-ua0R.css (built 14:08 2026-09-29 by this critic) / targets.json sha256 3ceb8b55...8c9512
Review: focused
Deployment: NOT APPLICABLE (pre-deploy; the live check of this artifact is a separate obligation)
Changed area: PASS
Ship: SHIP. No critical defect, no regression against live release 30 (1475ff6b, B0cfXTil). Bailey's two-music bug is gone on the candidate. No majors to disclose.
Milestone: not assessed
Quality: no current full score; last full score is rubric v1 round 03 (7191674, 2026-09-19), history only
Targets: required 1 / matched 1 / failing 0 / unverified 1 (audio tile, by ear: CHK-B1) / waiting 0
Top issues: FOC31-P01 (polish, new feature): the phone pager has no "TAP TO PAGE" hint under the counter, which the B1 mockup shows. Evidence: 52a431d0-focused/D-286-B1.jpg. Next: add the line, or record that it was dropped.
Coverage: tested = overlap probe (keys 1600x900 and taps 390x844, running context and a context held suspended until the scene, FFX I and FFX-2 IV, full flow), battle cue of all 18 chapters, audio qa --strict, themes-audit, manifest vs live, phone pager by taps (FFX IX) and its absence in FFX-2 and on desktop, a release-30 save loaded; reused = pad and P,P race routes, Black Magic stacking (builder CHECKs of the same files); not tested = real iOS and Firefox devices, listening quality
Next required review and why: live check of this exact artifact after deploy; the deep review still owed on the live build (carried from 1475ff6b; shared audio routing adds to it); Bailey's CHK-B1 listening score for the R1 score
Elapsed review time / repeated work avoided: 27 min / reused the hotfix CHECK's probe (patched for screenshots and HTTP status) and its pad and pause-race results
```

# Focused review: release 31a candidate 52a431d0

Plan (`node tools/critic-plan.mjs --json` in D:/pyrefly-rel28): depth deep, **deepBeforeDeploy false**,
focusedBeforeDeploy true, deepAfterDeploy true; games both; systems FFX HUD, asset loader and manifests,
audio routing, music and sound files; dataAudit false; approvedArtCheck false. So this focused pass goes
before the deploy, and the deep review runs afterwards on the live build. The plan also carries a deep review from
1475ff6b, so the deploy tool's rule of at most two deploys while a deep review is owed applies.

Browser: headless Playwright Chromium from node with PYREFLY_BROWSER=gpu. No black canvas and no fallback.
One browser at a time. Server: `vite preview` on 127.0.0.1:5731 (PID 66540), stopped by PID; port 5731 confirmed closed.

## Game case (CHK-021)

| Item | Case | Source | Present | Absent |
|---|---|---|---|---|
| Hotfix: one music track | both | one `AudioManager` slot serves every screen (docs/handoff/hotfix-music-overlap.md) | FFX I, FFX-2 IV | n/a |
| R1 soundtrack (D-283) | both | shared audio pipeline (decisions.json D-283) | 26 cues, all 18 chapters | n/a |
| Phone page buttons B1 (D-286) | FFX only | FFX-2's list is `ui/ffx2/CommandMenu.ts`, a different widget | FFX IX at 390x844 | FFX-2 IV at 390x844 (0 pager elements), FFX at 1600x900 and 2000x1012 (display:none) |

## 1. Music: exactly one track

The probe comes from the hotfix's own check (copied to `52a431d0-focused/probe.mjs`). It adds a screenshot at
each step, named by the screen it was on, and the HTTP status of every audio request. It names each
Web Audio music source by its file and measures RMS after each track's gain every 100 ms. A sample counts as an
overlap when two tracks are both above -50 dBFS.

| Run | Input | Context | Flow | Samples | Overlap | Max audible |
|---|---|---|---|---|---|---|
| cand-keys-1600 | keys 1600x900 | running | FFX I + FFX-2 IV, title to board, full | 1705 | 0 | 1 |
| cand-tap-390 (+ ch1 re-run) | taps 390x844 | running | FFX-2 IV full; FFX I full | 1156 + 1071 | 0 | 1 |
| cand-keys-susp-scene | keys 1600x900 | held until the scene | FFX I, FFX-2 IV to battle | 1063 | 0 | 1 |
| cand-tap-susp-scene | taps 390x844 | held until the scene | FFX-2 IV, FFX I to battle | 1059 | 0 | 1 |
| live-keys-susp-scene (r30) | keys | held until the scene | FFX I | n/a | 0 this run (title never started) | 1 |

- With the context held, the candidate stops each superseded cue at the frozen clock (`music-stop-scheduled`
  title and chapter-select with `when: 0`), and both end the moment the context runs, before anything is heard.
  Live release 30 still schedules its fade from the frozen clock (`when: 0.65`, `ctxTime: 0`). That is the
  defect's mechanism. It reached audible overlap in the hotfix check on r29, and r30's `src/audio` is identical to r29's.
- Each step plays the same cue as live: chapter-select on the board and at prep, the scene cue, the boss theme,
  `pause` while paused, the boss theme again 3 s after resume, `victory-ffx` (FFX; Bahamut has no victory cue by
  the cue map, as on live), then chapter-select.
- The pause chip was tapped on the phone and P pressed on the desktop. Autobattle (debug) only ran the fight to its results.
- One harness note: the first taps run could not pick Chapter I. The card was already selected, so the first tap
  began the chapter and the second tap timed out, the same flake the hotfix check reported. The harness was fixed
  (it now taps again only while still on the board) and re-run, and it passed. This was not a game defect.

## 2. Every chapter's battle cue (R1 score)

`chapters.mjs` pressed a real Enter to unlock audio, then entered each of the 18 board chapters' battles through
`gotoChapter` (setup only). Every one returned HTTP 200. `audioDebug` showed one current slot, no fading slots,
and `source: "prerendered"` for every chapter: boss-seymour, boss-yunalesca, boss-jecht, boss-seymour-macalania,
boss-evrae, boss-yojimbo, boss-ffx2-aeon, boss-vegnagun, scene-bevelle-underground (Trema), boss-shuyin. The
board showed 18 cards, with 0 page errors.

Technical gate (CHK-001):
- `qa.mjs --strict` exits 0: 26 cues, 0 failing, manifest problems [].
- `themes-audit`: 0 chapters depart from the cue map.
- The dist MP3s are byte-identical to public/audio, and all 26 have ID3 headers.
- Against the live manifest: the same 26 keys and identical loop points. 23 files were re-rendered;
  boss-vegnagun, scene-bevelle-underground and scene-macalania-temple are identical to live.
- Loudness is -15.9 to -16.0 LUFS (live -15.97 to -16.2). True peak is -1.1 to -1.7 dBTP, a little hotter than
  live on some cues but inside the qa gate.

Listening quality is Bailey's call (CHK-B1, UNVERIFIED).

## 3. Phone page buttons (FFX IX, real taps at 390x844)

- Items opens with the pager: "1–6 OF 27", ▲ dimmed, ▼ live, both 44x44 px.
- Three taps on ▼ go 7–12, 13–18 and 19–24, then one tap on ▲ goes back to 13–18. The battle log did not grow
  (12 entries), so no page tap confirmed a row. The highlight and the help slab follow each page.
- Tapping Fire Gem used it: 5 fire hits on Yojimbo (571, 567, 618, ...).
- On the next turn the last page is "22–27 OF 27" with ▼ dimmed, and a forced tap on it changes nothing.
- The pager is hidden on the top menu. FFX-2 at 390x844 has no pager element. FFX at 1600x900 and 2000x1012
  keeps its desktop list with the inert ▼ mark.
- Target vs build: `52a431d0-focused/D-286-B1.jpg` (B1 mockup phone-B1-a.jpg against this build). The layout,
  sizes and placement match. The mockup's "TAP TO PAGE" line is missing (FOC31-P01, polish).

## 4. Saves and board

A save written by the live release-30 bundle (B0cfXTil) for Chapter I (1 attempt, default settings) was seeded
into the candidate. The candidate reached the board by Enter presses with 18 cards, and kept the chapter record
and all settings unchanged; the only change was seenCoach `briefing`. The bundle has no `textSize` field, so
OPTIONS accessibility A2 is not in the candidate, as intended.

## Issues

| ID | Severity | Title | introducedByCandidate | regressionVsLive | inNewFeature |
|---|---|---|---|---|---|
| FOC31-P01 | polish | Phone pager has no "TAP TO PAGE" hint under the counter, which the B1 mockup shows | true | false | true |

No critical and no major issues. Nothing to disclose.

## Checks

The JSON has every record. CHK-001, 003, 006, 007, 008, 009, 010, 012, 015, 016, 018, 019, 020, 021 and 023
PASS. CHK-004 and CHK-017 are NOT APPLICABLE: the advisor is unchanged, and the live check is a separate
obligation. CHK-B1 is UNVERIFIED because agents cannot hear.

Evidence is in `critic/reviews/52a431d0-focused/`: probe JSON and .out logs, `shots/`, `chapters.json`,
`paging-*.json`, `save.json`, `qa-strict.json`, `themes-audit.out`, `D-286-B1.jpg`, `livecmp/manifest-live.json`.
