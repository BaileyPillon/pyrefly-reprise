Build / artifact / target version: 5be4babe (release 15, D:/pyrefly-rel15, bundle index-Dat8v42m.js) / dist-gate built from that tree / targets.json sha256 d5f76c2b...466a
Review: focused (after the fact: the build went live first under Bailey's owner override)
Deployment: NOT APPLICABLE (live verification is a separate obligation)
Changed area: PASS
Ship: SHIP. No critical defect, no regression against 1c22066e. The release discloses two majors: R15-01 (phone battle HUD text below the floor, same on 1c22066e) and R13-04 (Evrae stack covers Tidus, carried because its fix was reverted out of this release)
Milestone: not assessed
Quality: not scored (focused pass); the last full score is round 03 on 7191674, 2026-09-19, rubric v1 history
Targets: required 1 / matched 1 / failing 0 / unverified 0 / waiting 0 (Zanmato gauge option A matched; boss, painting and chamber tiles are approved but not scheduled)
Top issues: R15-01 major (phone HUD legibility, pre-existing), R13-04 major (carried), R15-02 polish (sakura.png request aborted on every Chapter IX entry), R15-03 polish (Ronso Rage asks for Doom twice)
Coverage: tested Chapter IX real flow at 3 sizes (win) plus defeat and RETRY, Chapters I and IV controls against 1c22066e, data audit, 43 changed test files; reused R13-04 from 1c22066e-focused; not tested: Zanmato firing, Chapter VII, audio, loading times, Chapters II, III, V, VI, VIII
Next required review and why: live verification of 5be4babe, then the deep review this shared-system change owes on the live build (plan depth deep, deepAfterDeploy)
Elapsed review time / repeated work avoided: about 42 minutes (over the 15-minute budget: three script repairs on the Ronso Rage list and one rebuild of 1c22066e for the comparison) / the Evrae measurement was reused, not re-run

## Plan

In D:/pyrefly-rel15, `node tools/critic-plan.mjs --json` with no arguments compares 5be4babe with itself, because deploys.log already names 5be4babe. The empty plan was not used. Instead the review used `--since 1c22066e`, which gives: depth deep, `deepBeforeDeploy` false, `focusedBeforeDeploy` true, `deepAfterDeploy` true. It covers 17 systems, both games and all five core chapters, checks CHK-002 to CHK-023 (no CHK-014), dataAudit true and approvedArtCheck false. This is not the save-data class, so the focused pass applies.

## What was run

- **Candidate:** `npx vite build --outDir dist-gate` in D:/pyrefly-rel15, served with vite preview on 127.0.0.1:5431.
- **Comparison:** 1c22066e was rebuilt the same way in D:/pyrefly-rel14 and served on 127.0.0.1:5432. The live URL already serves this candidate: its bundle name is Dat8v42m, the same as the candidate.
- **Browser and input:** Playwright Chromium with `PYREFLY_BROWSER=gpu` (ANGLE D3D11, RTX 5070 Ti), with no fallback. Every step used real keys. The page state was read only to choose the next key, and every capture checked `screen()` first.
- **Script:** `tools/zz-crit15-flow.tmp.mjs` (agent scratch).

### Chapter IX, FFX only (research/ffx-yojimbo.md section 0.3)

- **Route:** title, then the briefing ("Eight fights", which matches the 8 playable tiles; Seymour and Anima is still COMING), chapter select with IX in the FFX row, party prep (Lulu, Kimahri, Yuna), the arrival scene of about 30 lines, the coach card and the first menu about 12 s later.
- **Win at each size:** Kimahri used Overdrive, Doom, then Doom again in the Ronso Rage list. Doom landed with count 5 and ticked down to 0. The run then went Victory, the aftermath scene, results ("Victory, NEW BEST") and back to chapter select with yojimbo-cavern cleared. It played the same way at 1600x900, 2000x1012 and 390x844.
- **Defeat at 1600x900:** with plain attacks only, the gauge reached 57 percent. The party fell to Daigoro, Kozuka and Wakizashi before Zanmato came. Results showed "Defeat" with RETRY / CHAPTER SELECT, and pressing Enter on RETRY returned to party prep.
- **Gauge in play:** it moved +3 for each targeting and +2 for each of Yojimbo's actions (research section 4.1). The labels Daigoro, Kozuka and Wakizashi appeared at 25 and 50. The gauge matches approved option A (`5be4babe-focused/yojimbo-gauge.jpg`).
- **Data audit:** every value below matches research sections 2 and 3.
  - Yojimbo: HP 33,000, MP 2,000, STR 34, DEF 80, MAG 35, MDEF 0, AGI 32, Luck 15, Overkill 4,060, Doom 5.
  - Ginnem: HP 10, Doom 3.
  - Daigoro: HP 1, STR 25.
  - Abilities: Kozuka DC 16, Wakizashi DC 28, Daigoro DC 20 with crit and 10 percent shatter, Zanmato DC 200 fixed with `canMiss: false`.
- **Errors:** none in the console and no HTTP 4xx in any run. The only network failures are the aborted requests logged as R15-02.

### Controls against 1c22066e

- **Chapter IV (FFX-2) at 1600x900:** the first menus and advisor text are identical on both builds.
- **Chapter I at 390x844:** the first-menu frame is identical on both builds (`phone-ch1-prev-vs-cand.jpg`).

### Game-aware placement (CHK-021)

| Change | Case | Where it lives |
|---|---|---|
| Chapter IX | FFX only | only in the FFX row |
| Zanmato gauge | FFX only | `src/ui/ffx` |
| FFX-2 battle message lines | FFX-2 only | `src/ui/ffx2/battleMessage.ts` |
| No Items command for aeons | FFX only | combat-core 6.2 / 6.3, `tests/unit/ffx-aeon-no-items.test.ts` |
| Steal names | FFX-2 only | `src/battle/ffx2`, `src/data/ffx2` |

### Tests

The 43 changed unit test files (703 tests) pass in D:/pyrefly-rel15.

## Issues

- **R15-01, major.** Not introduced by this candidate, not a regression, not in a new feature.
  - At 390x844 the FFX battle HUD (command stack, party panel, CTB list and guide) draws at roughly 5 to 7 px of effective text. Chapter I on 1c22066e is identical, and Chapter IX inherits the same layout.
  - Evidence: `cand-ix-win-390x844-08-first-menu.jpg`, `phone-ch1-prev-vs-cand.jpg`.
  - Fix: show Bailey options for a phone battle HUD before building one.
- **R13-04, major, carried.** Not introduced, not a regression.
  - In Evrae the command stack covers Tidus. Release 15 reverted the re-lay (a2a1b1f5), so this build has the staging that 1c22066e-focused measured. It was not re-measured here.
- **R15-02, polish.** Every Chapter IX entry aborts `art/backdrops/cavern-stolen-fayth/sakura.png` (net::ERR_ABORTED). There is no 4xx and no console error. Whether the sakura layer then shows was not checked. The suspected cause is the new battle preload cancelling a duplicate request.
- **R15-03, polish.** Ronso Rage asks for Doom twice. Overdrive lists Doom, and choosing it opens a second list, "Choose a Rage: Jump / Doom". This was not compared with Chapter I on 1c22066e. It is a question for the deep review.

Observation, not an issue: at 2000x1012 one mid-battle frame taken during Yojimbo's action shows Lulu and Kimahri almost out of frame at the bottom. That is probably the action camera. It is a single frame, so the deep review should look at it again.

## Not tested (owed to the deep review)

- Zanmato firing, and an aeon taking it.
- The Chapter VII fixes (the chapter is locked).
- The FFX-2 message lines, the aeon Items change and the steal names in play. They are covered by unit tests only.
- Audio and cue routing.
- Loading-time measurement.
- Anima's paintings and stone look (Chapter III).
- The Leblanc fan (Chapter VI).
- Pause inside Chapter IX.
- Chapters II, III, V, VI and VIII.

## Servers

- 5431 (candidate preview) was stopped by its PID 44040.
- 5432 (1c22066e preview) was stopped by its PID 26504.
- Both ports were confirmed closed.
