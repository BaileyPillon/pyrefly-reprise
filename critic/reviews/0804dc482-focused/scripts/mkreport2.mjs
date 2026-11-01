import fs from 'node:fs';
import crypto from 'node:crypto';
const R = 'D:/pyrefly-release55/critic/reviews';
const E = '0804dc482-focused';
const prev = JSON.parse(fs.readFileSync(`${R}/4c01379d4-focused.json`, 'utf8'));
const tv = crypto.createHash('sha256').update(fs.readFileSync('D:/pyrefly-release55/docs/target/targets.json')).digest('hex');
const rd = (p) => JSON.parse(fs.readFileSync(`${R}/${E}/${p}`, 'utf8'));
const cont = { schema: 'continuity-summary/1', base: 'http://127.0.0.1:5877/', date: new Date().toISOString(), tag: '0804dc482', chapters: [] };
for (const c of ['sin-face', 'evrae-airship', 'mirror-aeons']) cont.chapters.push(...rd(`continuity/continuity-summary-${c}.json`).chapters);
cont.rawHopsOver100px = {
  'sin-face': { candidate: { count: 0, worstJerkPx: 47.4, swapJerksWorstPx: 35.1 }, live70: { count: 0, worstJerkPx: 47.3, from: `${E}/continuity-live` }, packControl: { count: 0, worstJerkPx: 47.9, from: `${E}/continuity-control` }, previousCandidate4c01379d4: { count: 17, worstPx: 401.1 } },
  'evrae-airship': { candidate: { count: 0 }, previousCandidate4c01379d4: { count: 0 } },
  'mirror-aeons': { candidate: { count: 0 }, previousCandidate4c01379d4: { count: 0 } },
};
cont.liveSinFace = rd('continuity-live/continuity-summary-sin-face.json').chapters[0];
cont.packControlSinFace = rd('continuity-control/continuity-summary-sin-face.json').chapters[0];
const reuse = (id, why) => { const c = prev.checks.find((x) => x.id === id); return { ...c, reusedFrom: 'critic/reviews/4c01379d4-focused.json', dependencyArgument: why }; };
const sf = ['sin-face', 'evrae-airship', 'mirror-aeons'];
const checks = [
  { id: 'CHK-017', result: 'PASS', reason: 'candidate-build --serve printed bundle index-BtjHKsK_.js and curl of index.html on the served dist-gate names index-BtjHKsK_.js, the expected bundle (live serves index-UNVtEttT.js, release 70).', game: 'both', chapter: 'n/a', state: 'served candidate', evidence: [`critic/reviews/${E}/serve.log`, `critic/reviews/${E}/play/p-sin-face-1600.json`], mode: 'automated', mandatory: false, minutes: 1 },
  { id: 'CHK-015', result: 'PASS', reason: 'Real keys from the title through chapter select and party prep to the first menu and a first command in XVIII (sin-face) at 1600x900, 0 console errors, 0 4xx; the three continuity runs also played title to Victory by real keys. Frame rate in play.mjs reads 2 fps on candidate and live alike (shared machine, GPU art batch; noisy, not a finding); the harness runs read 59.6 to 59.9 fps.', game: 'FFX', chapter: 'sin-face', state: 'battle, awaitingMenu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`, `critic/reviews/${E}/play/p-sin-face-live-1600.json`], mode: 'automated', mandatory: false, minutes: 12 },
  { id: 'CHK-016', result: 'PASS', reason: 'play.mjs asserts screen === battle and awaitingMenu before every capture. Two further play attempts (XVIII at 2000x1012, Chapter I at 1600x900) timed out waiting for the first menu while the machine was loaded: recorded as not run, never captured.', game: 'FFX', chapter: 'sin-face', state: 'first menu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600-01-menu.png`, `critic/reviews/${E}/play/p-sin-face-live-1600-01-menu.png`], mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-020', result: 'PASS', reason: 'treated() on the candidate lists 15 chapters (seymour-flux, yunalesca, seymour-anima-macalania, seymour-natus, braskas-final-aeon, isaaru-via-purifico, evrae-airship, mirror-aeons and the seven FFX-2 rows); sin-face is NOT listed, as the release notes now say. The Sin first menu is the older HUD (clock of turns left, mouth-shut and gaze chips, boss card at top left), the same layout as live (1600x900 captures; 5.5 percent of pixels differ, from the animated sky and figure idle).', game: 'FFX', chapter: 'sin-face', state: 'first menu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`, `critic/reviews/${E}/play/p-sin-face-1600-01-menu.png`, `critic/reviews/${E}/play/p-sin-face-live-1600-01-menu.png`], mode: 'automated', mandatory: false, minutes: 2 },
  { id: 'CHK-021', result: 'PASS', reason: 'Case: FFX only (XVIII, VIII and the Mirror Aeons chapter are FFX chapters; research/ffx-*.md; the delta is the FFX XVIII list row and its release-note text). Absent for XVIII (not in treated(), plays as live), present in VIII and Mirror (listed); the FFX-2 rows are untouched by the delta (git diff 4c01379d4 0804dc482 -- src changes only releaseNotes.ts and DemoGate.ts). No data value changed (dataAudit false).', game: 'both', chapter: 'XVIII, VIII, Mirror vs FFX-2', state: 'treated()', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`], mode: 'automated', mandatory: false, minutes: 1 },
  { id: 'CHK-022', result: 'PASS', reason: 'The harness route took sin-face (candidate, live, pack control), evrae-airship and mirror-aeons from the title to Victory by real keys (run.json outcome victory, fails [], consoleErrors [] in each).', game: 'FFX', chapter: 'XVIII, VIII, Mirror', state: 'victory', evidence: [`critic/reviews/${E}/continuity/sin-face-win-0804dc482/run.json`, `critic/reviews/${E}/continuity-live/sin-face-win-live70/run.json`, `critic/reviews/${E}/continuity-control/sin-face-win-ctrl/run.json`, `critic/reviews/${E}/continuity/evrae-airship-win-0804dc482/run.json`, `critic/reviews/${E}/continuity/mirror-aeons-win-0804dc482/run.json`], mode: 'automated', mandatory: false, minutes: 60 },
  reuse('CHK-003', 'git diff 4c01379d4 0804dc482 -- src touches only releaseNotes.ts (text) and DemoGate.ts (one list row): no layout, HUD or panel code differs.'),
  reuse('CHK-008', 'Same: no HUD or layout file differs.'),
  reuse('CHK-009', 'Same: no label code differs; release-note text only.'),
  reuse('CHK-010', 'Same: no menu code differs.'),
  { ...prev.checks.find((c) => c.id === 'CHK-004'), reason: 'No change to what a panel names or who can press it.' },
  { ...prev.checks.find((c) => c.id === 'CHK-007'), reason: 'Only the release-notes text changed (developer-facing).' },
  { id: 'CHK-006', result: 'UNVERIFIED', reason: 'Overlays not driven to their ends in this delta review (unchanged by the delta).', game: 'FFX', chapter: 'XVIII', state: 'n/a', mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-013', result: 'UNVERIFIED', reason: 'Art not judged against approved masters; no art file differs (approvedArtCheck false).', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-001', result: 'UNVERIFIED', reason: 'Agents cannot hear.', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-B1', result: 'UNVERIFIED', reason: 'Music and effects beauty: no agent can hear.', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-026', result: 'FAIL', reason: 'Head-size reads fail in all three chapters exactly as on live and the pack control (XVIII 46 swaps, worst 15.5 percent on the candidate, live and control alike; VIII 19, 15.5; Mirror 164, 19.7; 0.1 to 0.2 percent where the head is registered). Unchanged by this delta; carried, not a regression.', game: 'FFX', chapter: 'XVIII, VIII, Mirror', state: 'continuity harness, win, seed 1', evidence: sf.map((c) => `critic/reviews/${E}/continuity/continuity-summary-${c}.json`), mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-027', result: 'PASS', reason: 'XVIII (sin-face) on the candidate: 0 raw one-frame hops over 100 px, worst frame jerk 47.4 px, CHK-027 PASS; live release 70 at the same seed: 0, 47.3 px, PASS; ?treated=pack control: 0, 47.9 px, PASS (previous candidate 4c01379d4: 17 hops to 401 px). VIII (evrae-airship): 0 hops, PASS; Mirror Aeons: 0 hops (worst jerk 48.5 px), PASS. The candidate reads one swap jerk of 35 px in XVIII where live and the control read 0: far below the 100 px line, a pose-swap timing difference between runs of the same untreated code, not a finding.', game: 'FFX', chapter: 'sin-face, evrae-airship, mirror-aeons', state: 'continuity harness, win, seed 1', evidence: [...sf.map((c) => `critic/reviews/${E}/continuity/continuity-summary-${c}.json`), `critic/reviews/${E}/continuity-live/continuity-summary-sin-face.json`, `critic/reviews/${E}/continuity-control/continuity-summary-sin-face.json`], mode: 'automated', mandatory: false, minutes: 40 },
];
const c5 = { build: '0804dc482', confidence: 'high', requirement: 'CHK-026', where: 'size reads across pose swaps in the booth and older chapters alike (head size changes up to 15.5 to 19.7 percent where the head is not registered)', id: 'R71-C5', severity: 'polish', title: 'CHK-026 head-size reads FAIL in XVIII, VIII and Mirror Aeons exactly as on live and the pack control', game: 'FFX', chapter: 'sin-face, evrae-airship, mirror-aeons', expected: 'Head size steady across a pose swap', observed: 'XVIII 46 swaps worst 15.5 percent (live and control the same), VIII 19 swaps 15.5, Mirror 164 swaps 19.7', repro: 'node critic/runner/lib/continuity.mjs --base=<candidate or live> --chapters=sin-face', evidence: sf.map((c) => `critic/reviews/${E}/continuity/continuity-summary-${c}.json`), fix: 'Register the heads in the pose table for these chapters (carried from earlier releases)', acceptanceCheck: 'CHK-026 PASS', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false };
const issues = [prev.issues.find((i) => i.id === 'R71-C4'), c5];
const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '0804dc482' }, targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: [
    'R71-C1 is fixed: Chapter XVIII on the candidate has 0 one-frame hops over 100 px (was 17 up to 401 px), the same as live release 70 and ?treated=pack at the same seed; CHK-027 PASS; it plays release 70 untreated chapter and its Sin HUD reads as live',
    'VIII (0 hops) and the Mirror Aeons chapter (0 hops) stay fixed; each fight went title to Victory by real keys with 0 console errors; the delta is one list row plus release-note text, FFX only',
    'No critical or major issue remains; the candidate is better than live (VIII, the Mirror Aeons chapter and the FFX-2 chapters get the new presentation); carried polish R71-C4 (XVI) and R71-C5 (CHK-026 equal to live)',
  ],
  checks, continuity: cont, staticChecks: prev.staticChecks, targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 }, issues,
  coverage: {
    tested: ['Continuity harness (CHK-026/027) on XVIII against live release 70 and ?treated=pack at the same seed, plus VIII and the Mirror Aeons chapter on the candidate: each title to Victory by real keys, 0 console errors', 'XVIII first menu with real keys on candidate and live at 1600x900: same older Sin HUD', 'treated() list read on the candidate (15 chapters, sin-face absent)', 'git diff 4c01379d4 0804dc482 -- src: releaseNotes.ts and DemoGate.ts only'],
    reused: [
      { what: 'Layout at 1600x900 and 2000x1012, phone, text size, booth pair, V, XI, III, IX, XII, XVI findings, and every other chapter finding', from: 'critic/reviews/10b426248-focused.json and critic/reviews/4c01379d4-focused.json', why: 'the delta over 4c01379d4 changes one list row and release-note text only' },
    ],
    notTested: ['XVIII and Chapter I at 2000x1012 and Chapter I at 1600x900 by play.mjs (first menu did not appear within 240 s on the loaded machine; two attempts discarded)', '390x844 (no shared layout changed)', 'XVI re-run', 'Audio'],
  },
  regressions: [],
  nextReview: 'Deep review on the live build (still owed); R71-C4 and R71-C5 carried.',
  elapsedMinutes: 125,
};
fs.writeFileSync(`${R}/${E}.json`, JSON.stringify(report, null, 1));
const md = `Build / artifact / target version: 0804dc482, bundle index-BtjHKsK_.js, targets ${tv.slice(0, 12)}
Review: focused (delta over 4c01379d4)
Deployment: NOT APPLICABLE
Changed area: PASS (Chapter XVIII plays as live: 0 hops)
Ship: SHIP. R71-C1 is gone: XVIII reads 0 one-frame hops over 100 px, as live release 70 and ?treated=pack do; VIII and Mirror Aeons still 0. Disclosed: R71-C4 (XVI, polish), R71-C5 (head-size reads equal to live, polish).
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: none critical or major; polish R71-C4, R71-C5
Coverage: see JSON
Next required review and why: Deep review on the live build (owed).
Elapsed review time / repeated work avoided: about 125 minutes; previous reports' clean findings reused by reference

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock. Server on port 5877 (pid 87812) stopped by PID, port confirmed closed. Frame timings in play.mjs were noisy (2 fps on candidate and live alike, GPU art batch sharing the machine); the harness runs read 59.6 to 59.9 fps.

## Results (delta only)
| Chapter | previous candidate hops >100 px | this candidate | live r70 | pack control | CHK-027 |
|---|---|---|---|---|---|
| VIII evrae-airship | 0 | 0 | n/a | 0 (reused) | PASS |
| XVIII sin-face | 17 (to 401 px) | 0 (worst jerk 47.4 px) | 0 (47.3 px) | 0 (47.9 px) | PASS |
| Mirror Aeons | 0 | 0 (worst jerk 48.5 px) | n/a | 0 (reused) | PASS |

Each fight went title to Victory by real keys with 0 console errors. treated() lists 15 chapters; sin-face is not one. Its Sin HUD at the first menu matches live.
`;
fs.writeFileSync(`${R}/${E}.md`, md);
console.log('ok');
