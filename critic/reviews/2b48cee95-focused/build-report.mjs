import fs from 'node:fs'; import crypto from 'node:crypto';
const R = 'critic/reviews/2b48cee95-focused';
const tv = crypto.createHash('sha256').update(fs.readFileSync('docs/target/targets.json')).digest('hex');
const ch1 = JSON.parse(fs.readFileSync(`${R}/continuity/continuity-summary-ch1.json`));
const ch4 = { chapter: 'ffx2-bahamut', game: 'ffx2', checks: { 'CHK-026': 'FAIL', 'CHK-027': 'FAIL' }, battleSeconds: 370.3, swaps: 337, snapsPerMinute: 0, ghostMsPerMinute: 1445, maxHeadJumpPct: 0.6, maxFeetShiftPx: 0.3, worstJerkPx: 45, minStature: 0.899, heightOverBand: 3, feetSilOver: 0, swapJerksWorstPx: 45, dashesWorstPx: 32.2, frameP99Ms: 36.5, jerksCovered: 0, fps: 59.7, dedicated: true, strips: 19, worstSwapStrips: [], unverified: null };
const c1 = ch1.chapters[0];
const continuity = { ...ch1, chapters: [ch4, c1], note: 'Chapter IV summary recorded from the first harness run (the second run overwrote continuity-summary.json; Chapter I is continuity-summary-ch1.json); per-run data under continuity/<chapter>-win-2b48cee95/' };
const ev = (...a) => a.map((x) => `${R}/${x}`);
const chk = (id, result, reason, o = {}) => ({ id, result, game: o.game ?? 'both', chapter: o.chapter ?? 'seymour-flux, ffx2-bahamut', state: o.state ?? 'not exercised', evidence: o.evidence ?? [], mode: o.mode ?? 'automated', mandatory: false, minutes: o.minutes ?? 0, reason });
const na = (id, why) => chk(id, 'NOT APPLICABLE', why);
const checks = [
  chk('CHK-002', 'PASS', 'Boss card owns the window at 1600x900 and 2000x1012 in both chapters, set-up and demo paths; the card leaves and the HUD returns, 0 console errors.', { state: 'boss card up and leaving', evidence: ev('opening/opening.ndjson', 'opening/ch1-leave1.jpg', 'opening/ch4-leave1.jpg', 'opening/demo1d-leave1.jpg', 'opening/demo4d-leave1.jpg'), minutes: 8 }),
  na('CHK-003', 'No text or type size changed; the HUD copy is untouched by the motion lanes.'),
  na('CHK-004', 'No panel that names an action changed.'),
  chk('CHK-006', 'PASS', 'The boss card and HUD sampled per frame: the HUD goes down in the same sample the card starts to leave (offset 0 ms in all 6 set-up and demo runs) and is back at the first menu; no overlay is left over.', { state: 'card leaving, first menu', evidence: ev('opening/opening.ndjson'), minutes: 3 }),
  na('CHK-007', 'No player-facing copy changed except the release note; the new words are URL switches, not shown.'),
  chk('CHK-008', 'UNVERIFIED', 'Panels against painted actors were not re-measured; the FFX-2 ATB bars and the FFX turn-order slide (A items) were seen only in the first-menu shots, not measured against the actors.', { evidence: ev('phone2/ch4-390-phone.jpg') }),
  na('CHK-009', 'No names or labels changed.'),
  na('CHK-010', 'No selection treatment changed.'),
  na('CHK-011', 'No targeting change in this release.'),
  na('CHK-012', 'No art file changed; the candidate ships only art derived from the existing masters.'),
  na('CHK-013', 'No art changed (approvedArtCheck false); the change is timing and swaps.'),
  na('CHK-014', 'No pose or facing authored; the swap lane changes the timing of pose changes behind switches that default to release 65.'),
  chk('CHK-015', 'PASS', 'Wins in Chapter IV and Chapter I were played to the results by real keys (the continuity harness); the demo picker and card were driven by Enter and ArrowRight; the first menu and first Attack were pressed with real keys in 4 chapters and 46 switch loads.', { state: 'won fight, picker, first action', evidence: ev('continuity/ffx2-bahamut-win-2b48cee95/run.json', 'continuity/seymour-flux-win-2b48cee95/run.json', 'words/words-seymour-flux-a.json'), minutes: 25 }),
  chk('CHK-016', 'PASS', 'Every probe asserted screen=battle and the menu flag (snapshotState().screenState.playback.awaitingMenu, as the brief asks) before capture; a failed wait is recorded as firstMenu false, none in the final runs. The first phone run read awaitingMenu false because its wait (7 s) was shorter than the opening; rerun with 30 s read true on all cases.', { evidence: ev('phone/first-menu-2.json', 'phone2/first-menu-2.json', 'words/words-seymour-flux-a.json') }),
  na('CHK-017', 'Candidate review, not a live check; the live build is checked after the deploy.'),
  na('CHK-018', 'No shipped path written by hand in this change.'),
  na('CHK-019', 'No generated asset added.'),
  chk('CHK-020', 'PASS', 'Shared plumbing (hit, swaps, timebase, first-sight freezes) loads and plays the same in both games: every shared word loaded to the first menu with 0 console errors in Chapter I (FFX) and Chapter IV (FFX-2) and the opening hold matches release 65 in both.', { evidence: ev('words/words-seymour-flux-a.json', 'words/words-ffx2-bahamut-a.json', 'opening/opening.ndjson'), minutes: 10 }),
  chk('CHK-021', 'UNVERIFIED', 'Case per item from the lane notes: ?run= FFX-2 only; ?stance=, ?swap*, ?hit=, ?rigko= both games; A items per release notes. Presence checked by 29 default pins and 46 clean loads in both games; the FFX-2-only run switch was loaded in Chapter I (0 errors) but its absence there was not compared on a frame strip.', { evidence: ev('words/words-seymour-flux-b.json') }),
  chk('CHK-022', 'PASS', 'A won fight in Chapter I and in Chapter IV reached the results and the board by real keys. A lost fight was not played (see coverage).', { state: 'win to results', evidence: ev('continuity/ffx2-bahamut-win-2b48cee95/31-results.png', 'continuity/seymour-flux-win-2b48cee95/31-results.png') }),
  chk('CHK-023', 'PASS', 'The switches were exercised through the real presentation path (the address word, then a real fight to the first menu and first action), not by calling the API.', { evidence: ev('words/words-ffx2-bahamut-b.json') }),
  na('CHK-025', 'No hidden experiment touched; no save write path changed (the plan sets deepBeforeDeploy false).'),
  chk('CHK-026', 'FAIL', 'Chapter IV: 3 swaps outside the height band (stature 0.899 to 1.117; release 65: 4). Chapter I: 2 swaps over the head tolerance (worst 12.1 percent, unchanged from release 65). Same class and size as the live build, not worse.', { state: 'won fight, harness', evidence: ev('continuity/continuity-summary-ch1.json', 'continuity/ffx2-bahamut-win-2b48cee95', 'continuity/seymour-flux-win-2b48cee95'), minutes: 15 }),
  chk('CHK-027', 'FAIL', 'Chapter IV FAIL: one swap jerk 45 px (same as release 65), ghost frames 637 to 534, ghost swaps 210 to 177. Chapter I PASS (release 65 FAIL): swap jerks 4 to 2, worst 46.3 to 32.1 px, 0 steady-frame swap jerks over the line; dashes over the fail line 1 to 2 (worst 113.8 to 111.8 px, one run each, noise-level).', { state: 'won fight, harness', evidence: ev('continuity/continuity-summary-ch1.json', 'continuity/ffx2-bahamut-win-2b48cee95', 'continuity/seymour-flux-win-2b48cee95'), minutes: 15 }),
];
const issues = [{
  id: 'R66-P1', severity: 'polish', title: 'Pose-swap and motion continuity FAIL carried from the live build (Chapter IV swap jerk 45 px and 3 stature swaps, Chapter I head 12.1 percent)',
  game: 'both', chapter: 'seymour-flux, ffx2-bahamut',
  expected: 'Every swap inside the height band and head tolerance, swap jerks under 40 px, dashes under the fail line.',
  observed: 'Chapter IV: 3 stature swaps outside the band (release 65: 4), one swap jerk 45 px (same), ghost frames 637 to 534. Chapter I: head 12.1 percent (same), swap jerks 46 to 32 px (CHK-027 PASS), 2 dashes over the fail line (release 65: 1; one run each).',
  repro: 'PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<dist-gate served> --chapters=ffx2-bahamut,seymour-flux --evidence=<dir> --tag=x',
  evidence: ev('continuity/continuity-summary-ch1.json'), confidence: 'medium (one run per chapter, GPU shared with other lanes)', requirement: 'CHK-026, CHK-027', where: 'pose-change paths in src/engine/PaintedActor.ts (suspected)', fix: 'The new ?swapcause= words are the answer (cut, blend3, pick) once Bailey picks one; no code change for this release.', acceptanceCheck: 'harness reads CHK-026 and CHK-027 PASS in both chapters with the picked swap word on',
  introducedByCandidate: false, regressionVsLive: false, inNewFeature: false,
}, {
  id: 'R66-S1', severity: 'suggestion', title: 'Default-equals-release-65 is proved by tests and loads, not by a frame strip',
  game: 'both', chapter: 'seymour-flux, ffx2-bahamut', expected: 'A frame strip of each B switch default against the live build.', observed: 'Not captured: 29 release66-defaults pins and 100 lane tests pass, 46 switch loads and 4 chapters play clean, the stamped harness on the default build is at or better than release 65; no pixel strip against release 65 was taken.',
  repro: 'Same seed, same moment, candidate default against the live build at the first menu and after the first action', evidence: ev('words/words-seymour-flux-a.json'), confidence: 'high', requirement: 'review focus 1', where: 'critic coverage', fix: 'Take the strip in the deep review of the live build.', acceptanceCheck: 'strip identical within noise',
}];
const json = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '2b48cee95', bundle: 'index-BwPs1UaV.js' }, targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'UNVERIFIED', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: [
    'No critical or major defect found and no regression against release 65: 46 switch loads (every B word, and the all-on combination) and the default reach the first menu and the first action with 0 console errors, plus Chapter V and Yunalesca default and all-on.',
    'The A items read as written in the stamped harness: Chapter IV ghost frames 637 to 534 and ghost swaps 210 to 177, Chapter I swap jerks 46 to 32 px (CHK-027 PASS there), 0 steady-frame swap jerks; the opening card and HUD timing match release 65 in 6 set-up and 2 demo runs.',
    'The only FAILs are CHK-026 and CHK-027 in Chapter IV and CHK-026 in Chapter I, polish, at the live build own class and size. Changed area stays UNVERIFIED because a lost fight, a Chapter V win by real keys, a second FFX win and the default frame strip were not played; the defaults are pinned by 29 plus 100 passing tests.',
  ],
  checks, continuity,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 }, issues,
  coverage: {
    tested: ['46 switch loads (Chapters I and IV, 23 queries each: every B word and the all-on word) plus Chapter V and Yunalesca default and all-on, each to the first menu and the first Attack by real keys, 1600x900, 0 console errors', 'Opening card and HUD timeline per frame, Chapters I and IV, set-up and demo picker paths, 1600x900 and 2000x1012', 'Phone gate 390x844 Chapters I and IV first menu, 0 console errors, no horizontal scroll', 'Stamped continuity harness, a won fight in Chapter IV and Chapter I by real keys', 'Unit pins: release66-defaults (29) and six lane test files (100), tsc clean; integrator suite log exit 0'],
    reused: [{ what: 'release 65 continuity and opening numbers as the live baseline', from: 'critic/reviews/eaf599d0c-focused', why: 'same harness and method; release 65 is the live build' }],
    notTested: ['A lost fight in each demo chapter', 'Chapter V and a second FFX chapter played to the end by real keys (loaded to first menu and first action only)', 'Default-versus-live frame strip for each B switch', 'Shake at 60/144 Hz', 'Frame timings are not called regressions: GPU shared with other lanes (Chapter IV frame p99 36.5 ms against 45.7 ms for release 65)'],
  },
  regressions: [], nextReview: 'Deep review of the live build (shared presenter, global layout and boot), with the default-vs-live frame strip and a lost fight per demo chapter.', elapsedMinutes: 100,
};
fs.writeFileSync(`${R}.json`, JSON.stringify(json, null, 1));
const md = [
  `Build / artifact / target version: 2b48cee95 (release 66 candidate, dist-gate, bundle index-BwPs1UaV.js) / not deployed / targets ${tv.slice(0, 8)}`,
  'Review: focused (GPU Playwright, PYREFLY_BROWSER=gpu; the machine was shared, so no frame timing is called a regression)',
  'Deployment: NOT APPLICABLE (candidate, not deployed)',
  'Changed area: UNVERIFIED (nothing failing beyond carried polish; a lost fight, a Chapter V real-key win, a second FFX win and a default frame strip were not played)',
  'Ship: SHIP. No critical or major, no regression against release 65; the A items read as written. Majors this release discloses: none.',
  'Milestone: not assessed',
  'Quality: no new full score (last full score: round 03, rubric v1, evidence baseline only)',
  'Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting (no approved tile changed; the change is timing)',
  'Top issues: R66-P1 (polish) pose-swap and motion continuity FAIL carried from the live build; R66-S1 (suggestion) default-equals-live proved by tests and loads, not a frame strip',
  'Coverage: 46 switch loads plus Chapter V and Yunalesca, openings of Chapters I and IV (set-up and demo), phone gate 390x844, a won fight in Chapters I and IV with the stamped harness; not tested: lost fights, Chapter V and a second FFX chapter to the end, frame strips, shake at 60/144 Hz',
  'Next required review and why: deep review of the live build (shared presenter, global layout and boot)',
  'Elapsed review time / repeated work avoided: about 100 minutes; release 65 evidence reused as the live baseline',
  '',
  '## Case',
  'Release 66 = release 65 + five motion-fluidity lanes. FFX-2 only: ?run= (and the eased ATB bars). Both: the swaps, ?stance=, ?hit=, ?rigko=, the timebase and the first-sight freezes (shared plumbing; Chapters I and IV are the demo pair). Data audit: no src/data or src/battle change (git diff eaf599d0c..2b48cee95), so no values to compare.',
  '',
  '## Measured',
  '1. Words: 46 loads on the candidate to the first menu and the first Attack, 0 console errors, default and every value of every B word and the all-on combination, in Chapter I and IV; Chapter V and Yunalesca default and all-on also clean (words/*.json). The menu flag was true again after 4.5 s, so this proves "plays on", not an animation comparison.',
  '2. Opening: card up to leaving 2.74 s (Ch I) and 2.89 s (Ch IV) set-up, 2.25 and 2.66 s demo; release 65 read 3.03, 2.82, 2.28, 2.80: unchanged. HUD down at the exact card-leaving sample (0 ms) in all runs, 0 errors.',
  '3. Phone 390x844: Chapters I and IV reach the first menu with the coach card, guide and intent buttons, no horizontal scroll, 0 errors (phone2/ch4-390-phone.jpg).',
  '4. Continuity harness 9cc8f27cd66e, won by real keys: Chapter IV ghost frames 637 to 534, ghost swaps 210 to 177, swap jerk 45 px unchanged, stature outside band 4 to 3, p99 45.7 to 36.5 ms (noisy); Chapter I swap jerks 4 to 2, worst 46.3 to 32.1 px (CHK-027 PASS), head 12.1 percent unchanged (CHK-026 FAIL), ghost frames 655 to 656, dashes over the line 1 to 2 (one run each).',
  '5. Unit: release66-defaults 29 pass, six lane files 100 pass, tsc clean.',
  '6. Probe note: awaitingMenu read from snapshotState().screenState.playback.awaitingMenu as instructed; my first phone run was too short (7 s) and read false, rerun clean.',
  '',
  '## Issues',
  'See the json: R66-P1 polish (carried, not introduced, no regression), R66-S1 suggestion.',
  '',
].join('\n');
fs.writeFileSync(`${R}.md`, md);
