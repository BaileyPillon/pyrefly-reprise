import fs from 'node:fs';
import crypto from 'node:crypto';
const R = 'D:/pyrefly-release55/critic/reviews';
const prev = JSON.parse(fs.readFileSync(`${R}/10b426248-focused.json`, 'utf8'));
const E = '4c01379d4-focused';
const tv = crypto.createHash('sha256').update(fs.readFileSync('D:/pyrefly-release55/docs/target/targets.json')).digest('hex');
const sum = (c) => JSON.parse(fs.readFileSync(`${R}/${E}/continuity/continuity-summary-${c}.json`, 'utf8'));
const cont = { schema: 'continuity-summary/1', base: 'http://127.0.0.1:5877/', date: new Date().toISOString(), tag: '4c01379d4', chapters: [] };
for (const c of ['evrae-airship', 'sin-face', 'mirror-aeons']) { const s = sum(c); cont.chapters.push(...(s.chapters ?? [])); }
cont.rawHopsOver100px = {
  'evrae-airship': { candidate: { count: 0 }, previousCandidate10b426248: { count: 16, worstPx: 493.9 }, control: { count: 0, from: '10b426248-focused/continuity-control' } },
  'sin-face': { candidate: { count: 17, worstPx: 401.1 }, previousCandidate10b426248: { count: 28, worstPx: 530.5 }, control: { count: 0, from: '10b426248-focused/continuity-control' } },
  'mirror-aeons': { candidate: { count: 0 }, previousCandidate10b426248: { count: 32, worstPx: 206.6 }, control: { count: 0, from: '10b426248-focused/continuity-control' } },
};
const reuse = (id, why) => { const c = prev.checks.find((x) => x.id === id); return { ...c, reusedFrom: 'critic/reviews/10b426248-focused.json', dependencyArgument: why }; };
const checks = [
  { id: 'CHK-017', result: 'PASS', reason: 'The served dist-gate names index-BZBJ5-uz.js, the expected bundle (play json bundle field and curl of index.html).', game: 'both', chapter: 'n/a', state: 'served candidate', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`, `critic/reviews/${E}/serve.log`], mode: 'automated', mandatory: false, minutes: 1 },
  { id: 'CHK-015', result: 'PASS', reason: 'Real keys (Enter, ArrowRight) from the title through chapter select, party prep and four turns to the first menu and three further command turns in XVIII (sin-face) and Chapter I (seymour-flux), 59.8 fps, 0 console errors, 0 4xx.', game: 'FFX', chapter: 'sin-face, seymour-flux', state: 'battle, awaitingMenu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`, `critic/reviews/${E}/play/p-seymour-flux-1600.json`], mode: 'automated', mandatory: false, minutes: 6 },
  { id: 'CHK-016', result: 'PASS', reason: 'play.mjs asserts screen === battle and awaitingMenu before every capture (a failed wait throws).', game: 'FFX', chapter: 'sin-face, seymour-flux', state: 'first menu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600-01-menu.png`, `critic/reviews/${E}/play/p-seymour-flux-1600-01-menu.png`], mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-020', result: 'PASS', reason: 'treated().holds on the candidate: evrae-airship, sin-face and mirror-aeons each list "real"; seymour-flux (Chapter I) holds nothing so its real clips play; braskas-final-aeon keeps "real"; FFX-2 rows (ixion, vegnagun, fallen aeons) carry no "real". Matches the release notes.', game: 'both', chapter: 'VIII, XVIII, Mirror, I, III', state: 'first menu', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`, `critic/reviews/${E}/play/p-seymour-flux-1600.json`], mode: 'automated', mandatory: false, minutes: 1 },
  { id: 'CHK-021', result: 'PASS', reason: 'Case: FFX only (VIII, XVIII and 27 are FFX chapters; research/ffx-*.md). Present in the three FFX chapters (holds read), absent from FFX-2 rows (no "real" in ixion, vegnagun, fallen aeons) and from Chapter I. No data value changed (dataAudit false).', game: 'both', chapter: 'VIII, XVIII, Mirror vs FFX-2', state: 'treated().holds', evidence: [`critic/reviews/${E}/play/p-sin-face-1600.json`], mode: 'automated', mandatory: false, minutes: 1 },
  { id: 'CHK-022', result: 'PASS', reason: 'The harness route took evrae-airship, sin-face and mirror-aeons from the title to Victory by real keys (run.json outcome victory, fails [], consoleErrors [] in each).', game: 'FFX', chapter: 'VIII, XVIII, Mirror', state: 'victory', evidence: ['evrae-airship', 'sin-face', 'mirror-aeons'].map((c) => `critic/reviews/${E}/continuity/${c}-win-4c01379d4/run.json`), mode: 'automated', mandatory: false, minutes: 35 },
  reuse('CHK-003', 'This delta changes only which motion curves play (PieceHoldsLast.ts rows plus release-notes text); no layout, HUD or panel code differs between 10b426248 and 4c01379d4 (git diff --stat).'),
  reuse('CHK-008', 'Same: no HUD or layout file differs between the two commits.'),
  reuse('CHK-009', 'Same: no text or label code differs.'),
  reuse('CHK-010', 'Same: no menu code differs.'),
  { ...prev.checks.find((c) => c.id === 'CHK-004'), reason: 'No change to what a panel names or who can press it.' },
  { ...prev.checks.find((c) => c.id === 'CHK-007'), reason: 'Only the release-notes holds text changed (developer-facing).' },
  { id: 'CHK-006', result: 'UNVERIFIED', reason: 'Overlays not driven to their ends in this delta review (unchanged by the delta).', game: 'FFX', chapter: 'XVIII', state: 'n/a', mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-013', result: 'UNVERIFIED', reason: 'Art not judged against approved masters; no art file differs (approvedArtCheck false).', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-001', result: 'UNVERIFIED', reason: 'Agents cannot hear.', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-B1', result: 'UNVERIFIED', reason: 'Music and effects beauty: no agent can hear.', game: 'both', chapter: 'n/a', state: 'n/a', mode: 'manual', mandatory: false, minutes: 0 },
  { id: 'CHK-026', result: 'FAIL', reason: 'Head-size reads fail as on the control and on live (VIII 19 swaps, worst 15.5 percent; XVIII 46, 15.5; Mirror 164, 19.7; 0.1 percent where the head is registered). Unchanged by this delta; not a regression (the previous report recorded the same on the control).', game: 'FFX', chapter: 'VIII, XVIII, Mirror', state: 'continuity harness, win, seed 1', evidence: ['evrae-airship', 'sin-face', 'mirror-aeons'].map((c) => `critic/reviews/${E}/continuity/continuity-summary-${c}.json`), mode: 'automated', mandatory: false, minutes: 0 },
  { id: 'CHK-027', result: 'FAIL', reason: 'Two of three PASS: Chapter VIII 0 raw one-frame hops over 100 px (was 16, up to 494; control 0), Mirror Aeons 0 (was 32; control 0), CHK-027 PASS in both. Chapter XVIII (sin-face) still reads 17 raw hops over 100 px (Auron teleport 401.1 px, Auron dashes 278 to 113 px, Wakka dashes 116 to 113 px; all on damage or knock-out swaps) against 0 on the control (?treated=pack, 10b426248-focused/continuity-control, reused: the delta touches only PieceHoldsLast, which the pack control does not read); previous candidate 28 up to 530.5 px. The hold is in place (treated().holds sin-face includes real) so the remaining hops do not come from the real clips alone. CHK-027 FAIL.', game: 'FFX', chapter: 'evrae-airship, sin-face, mirror-aeons', state: 'continuity harness, win, seed 1', evidence: [...['evrae-airship', 'sin-face', 'mirror-aeons'].map((c) => `critic/reviews/${E}/continuity/continuity-summary-${c}.json`), `critic/reviews/${E}/continuity/sin-face-win-4c01379d4/continuity/strips/jerk-000-auron.jpg`, 'critic/reviews/10b426248-focused/continuity-control/continuity-summary-sin-face.json'], mode: 'automated', mandatory: false, minutes: 35 },
];
const issues = [
  { build: '4c01379d4', confidence: 'high', requirement: 'CHK-027', where: 'suspected: another piece of the XVIII treatment (Auron and Wakka damage and knock-out swap dashes); not the real clips, which are held (treated().holds sin-face includes real). Not traced.', id: 'R71-C1', severity: 'major', title: 'Chapter XVIII Sin\'s face: 17 one-frame hops of 113 to 401 px (Auron and Wakka, on damage or knock-out) remain after the real hold; the pack control has 0', game: 'FFX', chapter: 'sin-face', expected: 'No one-frame hop over 100 px that ?treated=pack does not have (the release 71 hold condition)', observed: 'Candidate: 17 raw hops over 100 px (Auron teleport 401.1 px feet, Auron dashes 278.3, 277.2, 256.4, 232.2, 230.6, then 149 to 113 px, Wakka dashes 113 to 116 px); CHK-027 FAIL. Previous candidate: 28 up to 530.5 px. Control: 0.', repro: 'PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<candidate>/ --chapters=sin-face --tag=x against --base="<candidate>/?treated=pack&x=/"; strip jerk-000-auron.jpg', evidence: [`critic/reviews/${E}/continuity/sin-face-win-4c01379d4/continuity/continuity.json`, `critic/reviews/${E}/continuity/sin-face-win-4c01379d4/continuity/strips/jerk-000-auron.jpg`, 'critic/reviews/10b426248-focused/continuity-control/continuity-summary-sin-face.json'], fix: 'Find which treatment piece produces the damage-swap dashes in XVIII (run with each hold of the chapter in turn, or ?curves=new) and hold it; or take XVIII off the list as release 70 had it', acceptanceCheck: 'CHK-027 run of XVIII reads no raw hop over 100 px', attempts: 1, introducedByCandidate: true, regressionVsLive: true, inNewFeature: false },
  ...prev.issues.filter((i) => ['R71-C4', 'R71-P1'].includes(i.id)),
];
const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '4c01379d4' }, targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'HOLD' },
  shipReasons: [
    'R71-C1 (Chapter XVIII) still has 17 one-frame hops over 100 px (up to 401 px) that ?treated=pack does not have: introduced by the candidate and a regression against live, major: HOLD',
    'R71-C2 (Chapter VIII, 16 hops to 0) and R71-C3 (Mirror Aeons, 32 to 0) are fixed; CHK-027 PASS in both; Chapter I still plays its real clips',
  ],
  checks, continuity: cont, staticChecks: prev.staticChecks, targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 }, issues,
  coverage: {
    tested: ['Continuity harness on VIII, XVIII, Mirror Aeons to Victory by real keys (0 console errors each)', 'Real-key first menu plus three turns in XVIII and Chapter I at 1600x900', 'treated().holds read on the candidate', 'tsc not run; vitest booth-b4 real-hold files 39 passed'],
    reused: [
      { what: '?treated=pack control runs of VIII, XVIII, Mirror (0 raw hops)', from: 'critic/reviews/10b426248-focused/continuity-control', why: 'the pack control bypasses the treatment pieces; the delta changes only PieceHoldsLast rows and tests/notes' },
      { what: 'Layout, HUD, phone touch, text size, booth pair, V, XI, III, IX/XII, XVI findings', from: 'critic/reviews/10b426248-focused.json', why: 'git diff 10b426248 4c01379d4 touches only PieceHoldsLast.ts, releaseNotes.ts, docs and tests' },
    ],
    notTested: ['2000x1012 and 390x844 layouts (unchanged by the delta)', 'XVI re-run (FFX-2 not held; R71-C4 polish carried)', 'Audio'],
  },
  regressions: ['R71-C1 Chapter XVIII: 17 one-frame hops over 100 px (up to 401) against 0 on the pack control and on live'],
  nextReview: 'Focused review of a repaired candidate (CHK-027 on XVIII against ?treated=pack); the deep review on the live build stays owed.',
  elapsedMinutes: 100,
};
fs.writeFileSync(`${R}/${E}.json`, JSON.stringify(report, null, 1));
const md = `Build / artifact / target version: 4c01379d4, bundle index-BZBJ5-uz.js, targets ${tv.slice(0, 12)}
Review: focused (delta over 10b426248)
Deployment: NOT APPLICABLE
Changed area: FAIL (Chapter XVIII still hops)
Ship: HOLD. R71-C1 Chapter XVIII: 17 one-frame hops over 100 px (up to 401 px) that the pack control does not have; introduced by the candidate, regression vs live, major. Fixed: R71-C2 (VIII, 0 hops) and R71-C3 (Mirror, 0 hops). Disclosed if shipped anyway: R71-C4 (XVI, polish).
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R71-C1 (CHK-027), see JSON
Coverage: see JSON
Next required review and why: ${report.nextReview}
Elapsed review time / repeated work avoided: about 100 minutes; previous report's clean findings and the pack controls reused by reference

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock. Server on port 5877 (pid 35208) stopped by PID, port confirmed closed.

## Results (delta only)
| Chapter | previous candidate raw hops >100 px | this candidate | pack control | CHK-027 |
|---|---|---|---|---|
| VIII evrae-airship | 16 (to 494 px) | 0 | 0 | PASS |
| XVIII sin-face | 28 (to 530 px) | 17 (to 401 px) | 0 | FAIL |
| Mirror Aeons | 32 (to 207 px) | 0 | 0 | PASS |

Each fight went title to Victory by real keys with 0 console errors. Chapter I (seymour-flux) holds nothing, so its real clips play; treated().holds shows "real" in VIII, XVIII, Mirror and III only among FFX, and in no FFX-2 row.

R71-C1: the hold is present in XVIII yet 17 hops remain (Auron teleport 401 px, Auron dashes 113 to 278 px, Wakka dashes about 115 px, all on damage or knock-out swaps). The remaining source is not the real clips; suspected another treatment piece, not traced.
`;
fs.writeFileSync(`${R}/${E}.md`, md);
console.log('ok');
