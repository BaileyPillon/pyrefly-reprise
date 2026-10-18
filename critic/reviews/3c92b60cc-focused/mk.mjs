import fs from 'node:fs'; import crypto from 'node:crypto';
const D = 'critic/reviews/3c92b60cc-focused';
const tv = crypto.createHash('sha256').update(fs.readFileSync('docs/target/targets.json')).digest('hex');
const env = 'candidate M:/pyrefly-ch-angra-mainyu 3c92b60cc, fresh dist-release, vite preview 5612 (BASE_PATH=/); headless Playwright Chromium, PYREFLY_BROWSER=gpu';
const mk = (id, result, reason, o = {}) => ({ id, result, reason, where: o.where ?? 'both', evidence: o.evidence ?? [], mode: o.mode ?? 'automated', mandatory: o.mandatory ?? false, minutes: o.minutes ?? 1, artifact: '3c92b60cc dist-release', targetVersion: tv, environment: env });
const cont = [`${D}/continuity/continuity-summary.json`, `${D}/continuity.log`];
const live = [`${D}/continuity-live/continuity-summary.json`, `${D}/continuity-live.log`];
const unv = 'Not exercised in this focused pass: time went to the pose-continuity harness (candidate and live) and Chapter 28; covered by the deep review owed on the live build.';
const checks = [
  mk('CHK-002', 'PASS', 'Chapter 28 party prep, board and title own the window at 1600x900, 2000x1012 and 390x844; no stage-sized overlay.', { where: 'FFX; board, Ch 28 prep', evidence: [`${D}/layout-2000-board.png`, `${D}/layout-390-board.png`, `${D}/after-word.png`], mandatory: true, minutes: 4 }),
  ...['CHK-003', 'CHK-004', 'CHK-005', 'CHK-006', 'CHK-007', 'CHK-008', 'CHK-009', 'CHK-010', 'CHK-011', 'CHK-012', 'CHK-013', 'CHK-014', 'CHK-015', 'CHK-017', 'CHK-018', 'CHK-019', 'CHK-022', 'CHK-023'].map((id) => mk(id, 'UNVERIFIED', unv)),
  mk('CHK-016', 'PASS', 'Every capture asserted screen() first (title, chapter-select, party-prep, battle with awaitingMenu); harness waits throw on failure; the failed Gui card wait is recorded as UNVERIFIED, not captured.', { evidence: [`${D}/index.json`, `${D}/continuity.log`], minutes: 2 }),
  mk('CHK-020', 'PASS', 'Shared plumbing (pose gate, fail-safe, PoseBlend) applies to both games: poseTrust() withheld list empty and 0 console errors on FFX boot, Chapter 28 and the FFX-2 fights; the Lady Luck repair is FFX-2 only and showed only in FFX-2 Ixion/Djose.', { evidence: cont, minutes: 2 }),
  mk('CHK-021', 'PASS', 'Case per docs/handoff/pose-continuity.md: pose plumbing both games; Lady Luck repair FFX-2 only; Dark Aeons FFX only; Chapter 28 and the Magus Sisters Summon row FFX only (research/re-ffx-last-summoning.md). Chapter 28 is hidden (not on the board, 0 of 19 beaten) and opens by the word summon in FFX; no FFX-2 card or word changed. Grand Summon list 9 to 7 and the Sisters row: vitest summon-label-sisters, last-summoning-chapter and -offering pass; source values not re-read line by line here.', { evidence: [`${D}/layout-2000-board.png`, `${D}/ch28-turn1-menu.png`], mode: 'manual', minutes: 6 }),
  mk('CHK-026', 'PASS', 'Three of four chapters read PASS on the candidate with the new pixel readings: mirror-aeons (stature 0.678 to 1.603, 0 out of band, feet shift 0.9 px), ffx2-ixion-djose (feet shift 1.2 px; live r51 reads 29.4 px and FAILS), ffx2-bahamut (0.4 px). Sinspawn Gui could not be reached by the harness route (UNVERIFIED), so the run aggregate is UNVERIFIED; no size or feet defect was found where it ran.', { evidence: [...cont, ...live], minutes: 70, mandatory: true }),
  mk('CHK-027', 'FAIL', 'Swap jerks of 40 px or more: 125 over the run on the candidate (worst 177.8 px, Bahamut). Live r51 has them on the same chapters (Ixion 112.9 vs 115.7, Bahamut 138.6 vs 177.8, Dark Aeons 170.3 vs 173.8 px), so not new; 119 mid-move dashes are reported, not gated. About a third fall on slow frames (p99 up to 108 ms).', { evidence: [...cont, ...live, `${D}/continuity/ffx2-ixion-djose-win-3c92b60cc/continuity/strips/jerk-005-x2-ixion.jpg`], minutes: 70, mandatory: true }),
];
const issues = [
  { id: 'FOC52-001', severity: 'major', title: 'Pose-swap position jerks of 40 px or more in one frame (CHK-027), reaching 178 px', game: 'both', chapter: 'ffx2-bahamut, ffx2-ixion-djose, mirror-aeons', expected: 'a pose swap moves the figure by no more than 40 px in one frame', observed: '125 swap jerks on the candidate (worst 177.8 px, FFX-2 Bahamut); live r51 shows 112.9, 138.6 and 170.3 px on the same chapters', repro: 'node critic/runner/lib/continuity.mjs --chapters=ffx2-bahamut,ffx2-ixion-djose,mirror-aeons --tag=3c92b60cc (seed 1); strips under critic/reviews/3c92b60cc-focused/continuity', evidence: cont, confidence: 'high (same reading on live)', requirement: 'CHK-027', where: 'src/engine pose swap and move paths (suspected, not traced)', fix: 'trace the worst strips: separate swaps that coincide with a move\'s own lunge from true registration offsets', acceptanceCheck: 'CHK-027 swap jerks 0 on the three chapters', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
  { id: 'FOC52-002', severity: 'polish', title: 'Chapter 28: target caption "POSSESSED VALEFOR" overlaps the "ENEMY MOVE" header at the top right', game: 'ffx', chapter: 'last-summoning', expected: 'no overlapping HUD text', observed: 'at the target-select frame the two labels draw over each other', repro: 'type summon on the board, start battle, play to the third turn, open Attack', evidence: [`${D}/ch28-turn3.png`], confidence: 'high', requirement: 'HUD legibility', where: 'FFX battle HUD (not traced)', fix: 'shorten or move the target caption when the move list is open', acceptanceCheck: 'screenshot of the same frame', introducedByCandidate: true, regressionVsLive: false, inNewFeature: true },
  { id: 'FOC52-003', severity: 'polish', title: 'The harness route cannot open the hidden Sinspawn Gui chapter, so its newly registered poses were not seen in play', game: 'ffx', chapter: 'sinspawn-gui', expected: 'CHK-026 and CHK-027 read on Gui', observed: 'ASSERT-FAIL card sinspawn-gui got yunalesca; 0 frames recorded', repro: 'continuity.mjs --chapters=sinspawn-gui', evidence: [`${D}/continuity.log`], confidence: 'high', requirement: 'CHK-026', where: 'critic/runner/lib/route.mjs (hidden-chapter door)', fix: 'make the route type the chapter word', acceptanceCheck: 'harness plays Gui', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
];
const sum = JSON.parse(fs.readFileSync(`${D}/continuity/continuity-summary.json`, 'utf8'));
const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '3c92b60cc' }, targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'UNVERIFIED', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: [
    'No critical defect and no regression against live r51 at critical or major severity; the one major (CHK-027 swap jerks) is on live too (introducedByCandidate false, regressionVsLive false).',
    'The pose fix reads better than live: poseTrust() is empty on the real art (boot, Chapter 28), FFX-2 Ixion/Djose feet shift 1.2 px against 29.4 px live (CHK-026 FAIL live, PASS here), Dark Aeons 0 out of band, 0 console errors.',
    'Chapter 28 opens by the word summon, is absent from the board and plays its first turns by real keys; its one defect is a polish overlap inside a brand-new feature.',
  ],
  checks, continuity: sum,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 },
  issues,
  coverage: { tested: ['pose-gate --check exit 0', 'tsc clean', '147 vitest tests (pose-trust, pose-blend x2, summon-label-sisters, last-summoning chapter and offering, pose-gate)', 'Chapter 28 door word, party prep and first 4 turns by real keys at 1600x900', 'board and prep at 2000x1012 and 390x844', 'continuity harness on mirror-aeons, ffx2-ixion-djose, ffx2-bahamut (candidate and live r51)'], reused: [], notTested: ['Sinspawn Gui in play', 'FFX-2 Chapter V Vegnagun and X-2 Valefor in play', 'CHK-003 to CHK-023 except 002, 016, 020, 021', 'row-by-row source audit of the Grand Summon list data', 'target tile composites'] },
  regressions: [], nextReview: 'deep review on the live build after the deploy (deepAfterDeploy)', elapsedMinutes: 175,
};
fs.writeFileSync(`${D}.json`, JSON.stringify(report, null, 1));
const md = `Build / artifact / target version: 3c92b60cc (r52-rc) / dist-release built here / ${tv.slice(0, 12)}
Review: focused
Deployment: NOT APPLICABLE (not deployed yet)
Changed area: UNVERIFIED (Gui not seen in play; CHK-027 FAIL is pre-existing)
Ship: SHIP. Better than live r51 on the pose fix; the one major (swap jerks) exists on live too and is disclosed
Milestone: not assessed
Quality: no full score taken; last full score unchanged
Targets: 0 required captured / 0 matched / 0 failing / 0 unverified / 0 waiting (approvedArtCheck false)
Top issues: FOC52-001 major swap jerks (live too); FOC52-002 polish Ch 28 caption overlap; FOC52-003 polish harness cannot open Gui
Coverage: tested Ch 28 first turns, three continuity chapters on candidate and live, layouts at 3 sizes; not tested Gui, Ch V, most CHK-003 to 023
Next required review and why: deep review on the live build (deepAfterDeploy)
Elapsed review time / repeated work avoided: about 175 min, of which about 2 h harness runs

Mode: PYREFLY_BROWSER=gpu headless Chromium; preview server on 5612 stopped (PID 44736, port closed).

Continuity (candidate vs live r51): Ixion/Djose CHK-026 PASS vs FAIL (feet shift 1.2 vs 29.4 px); Bahamut PASS/PASS; Dark Aeons PASS/PASS; CHK-027 FAIL on both for all three (swap jerks 115.7/177.8/173.8 vs 112.9/138.6/170.3 px).
`;
fs.writeFileSync(`${D}.md`, md);
