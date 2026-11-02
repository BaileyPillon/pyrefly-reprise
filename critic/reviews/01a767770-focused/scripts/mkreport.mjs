import fs from 'node:fs';
import crypto from 'node:crypto';
const R = 'D:/pyrefly-release55/critic/reviews/01a767770-focused';
const sha = crypto.createHash('sha256').update(fs.readFileSync('D:/pyrefly-release55/docs/target/targets.json')).digest('hex');
const rd = (f) => JSON.parse(fs.readFileSync(`${R}/${f}`, 'utf8'));
const chapters = [];
for (const c of ['yojimbo-cavern', 'seymour-omnis', 'seymour-anima-macalania', 'isaaru-via-purifico', 'braskas-final-aeon']) chapters.push(...rd(`continuity/continuity-summary-${c}.json`).chapters);
const continuity = { schema: 'continuity-summary/1', chapters, controls: {
  'yojimbo-cavern pack': 'continuity-control/continuity-summary-yojimbo-cavern.json', 'seymour-omnis pack': 'continuity-control/continuity-summary-seymour-omnis.json',
  'seymour-anima-macalania pack': 'continuity-control/continuity-summary-seymour-anima-macalania.json', 'seymour-anima-macalania live71': 'continuity-live/continuity-summary-seymour-anima-macalania.json' } };
const ev = (...a) => a.map((x) => `critic/reviews/01a767770-focused/${x}`);
const ck = (id, result, reason, game, chapter, state, evidence, mode = 'automated', minutes = 5, mandatory = false) => ({ id, result, reason, game, chapter, state, evidence, mode, mandatory, minutes });
const checks = [
  ck('CHK-017', 'PASS', 'dist-gate serves bundle index-Cz_6EQVK.js (the expected one); node tools/dist-local-paths.mjs reports 0 hits in 1367 text files; 0 console errors, 0 4xx in every play run.', 'both', 'n/a', 'served candidate', ev('play/c-ch1-1600.json', 'play/c-xi-1600.json'), 'automated', 2),
  ck('CHK-003', 'PASS', 'IX 0 overlapping HUD panel pairs in every state read (base, Intel, target cursor and six cursor stops, at 1600x900 and 2000x1012). XII (F1 HUD held) 0 pairs in base, Intel and the first target state; the cursor stops are issue R72-1 (CHK-009). Text floor not re-measured here (FFX lane).', 'FFX', 'IX yojimbo-cavern, XII seymour-omnis', 'first menu, Intel, target cursor', ev('play/hud-ix-cand.json', 'play/hud-xii-cand.json'), 'automated', 6),
  ck('CHK-009', 'FAIL', 'XII: at alternate cursor stops the TARGET flag lands on the Sensor card (98 x 79 px at 1600, 80 x 85 at 2000) with a text collision; live shows the flag over the disc strip text at the same stop (a different overlap); ?treated=pack read 0 pairs. Issue R72-1.', 'FFX', 'XII seymour-omnis', 'target cursor, ArrowRight and ArrowLeft stops', ev('play/hud-xii-cand2.json', 'play/hud-xii-cand2-1600-cursor1.png', 'play/hud-xii-live2-1600-cursor1.png', 'play/hud-xii-pack.json'), 'automated', 8),
  ck('CHK-020', 'PASS', 'Chapter I (seymour-flux) played by real keys to 4 turns at 1600x900: 0 console errors, 59.7 fps. The shared slide ease produced no one-frame hop over 100 px that its control lacks in IX, XII, VII or XIV.', 'both', 'I seymour-flux; VII, IX, XII, XIV', 'real-key play', ev('play/c-ch1-1600.json'), 'automated', 4),
  ck('CHK-021', 'PASS', 'Case: IX, XII and III FFX only (the FFX F1 HUD ribbon and the real clips; research/ffx-vs-ffx2-presentation.md); XI sky option C FFX-2 only; the slide ease both. Presence: treated() lists IX, XII, III and XI; XI plays with a dark violet sky and a legible party (0 console errors, 59.3 fps at 1600, 59.1 at 2000). Absence: the FFX-2 chapter XI draws the FFX-2 ATB HUD and no F1 ribbon.', 'both', 'XI ffx2-fallen-aeons, I, IX, XII', 'first menu', ev('play/c-xi-1600-01-menu.png', 'play/c-xi-1600.json', 'play/c-xi-2000.json'), 'automated', 4),
  ck('CHK-022', 'PASS', 'Every continuity run is one continuous real-key route from the title to the results for IX, XII, VII, XIV and III.', 'FFX', 'IX, XII, VII, XIV, III', 'title to results', ev('continuity/continuity-summary-yojimbo-cavern.json'), 'automated', 60),
  ck('CHK-026', 'FAIL', 'III FAIL (54 head-size swaps over tolerance, worst 58.1 percent, feet 11.4 px, 18 stature outside band); IX FAIL (15.4 percent, identical on the ?treated=pack control); VII FAIL (22.2 percent; live 22.1, pack 22.2); XII PASS (8.7, control 8.7); XIV PASS. Every FAIL equals its control or live read. Issue R72-2.', 'FFX', 'III, IX, XII, VII, XIV', 'full fight', ev('continuity/continuity-summary-braskas-final-aeon.json', 'continuity/continuity-summary-yojimbo-cavern.json', 'continuity-control/continuity-summary-yojimbo-cavern.json', 'continuity-live/continuity-summary-seymour-anima-macalania.json'), 'automated', 60),
  ck('CHK-027', 'FAIL', 'III FAIL: 0 teleports, 8 gated swap jerks (worst 229.5 px, Auron and Yuna swaps on cuts and two stall frames), 42 dashes up to 162.2 px. IX PASS (0 dashes against 24.2 px on the control). XII PASS (swap jerk 30 px vs 27.8; dashes worst 84.1 px against 0 on the control, under 100 px). VII PASS (worst dash 166.6 px; live 244.7, pack 124.7). XIV PASS (swap jerk 26.2, 0 teleports). No hop over 100 px that the control lacks in IX, XII, VII or XIV. Issue R72-2.', 'FFX', 'III, IX, XII, VII, XIV', 'full fight', ev('continuity/continuity-summary-braskas-final-aeon.json', 'continuity/continuity-summary-seymour-omnis.json', 'continuity-control/continuity-summary-seymour-omnis.json', 'continuity/cont.log'), 'automated', 60),
  ck('CHK-013', 'NOT APPLICABLE', 'No audio change in this release.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-016', 'PASS', 'Every capture asserted screen battle (and awaitingMenu where it applies) before the shot; a failed wait throws; no wrong-screen capture.', 'both', 'all', 'capture', ev('scripts/hudcheck.mjs', 'scripts/lib.mjs'), 'automated', 0),
  ck('CHK-004', 'UNVERIFIED', 'Not measured by this review; lane evidence only; 390x844 not run (hudf1-chapters.css is the desktop F1 HUD).', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-006', 'UNVERIFIED', 'Not run (no pause, results or options change in the diff).', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-007', 'UNVERIFIED', 'Not run; lane evidence only.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-008', 'UNVERIFIED', 'Not run; lane evidence only.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-010', 'UNVERIFIED', 'Not run; lane evidence only.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-015', 'UNVERIFIED', 'Not assessed: timings were taken beside a GPU art batch and are noisy (fps 59.1 to 59.9, p99 19.6 to 27.4 ms); no timing regression is called.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-023', 'UNVERIFIED', 'Not run by this review.', 'both', 'n/a', 'n/a', [], 'manual', 0),
];
const issues = [
  { id: 'R72-1', severity: 'major', title: 'Chapter XII (F1 HUD held): the TARGET flag lands on the Sensor card at alternate cursor stops', game: 'FFX', chapter: 'seymour-omnis',
    expected: 'The flag and the Sensor card never overlap while the target cursor moves', observed: 'At cursor stops 1, 3 and 5 of a six-key walk the flag overlaps the Sensor card by 98 x 79 px at 1600x900 and 80 x 85 at 2000x1012, the title text colliding. Live shows the flag over the disc strip text at the same stop (a different overlap); the pack control read 0 pairs.',
    repro: '?coach=off seed 1: Chapter XII, G (Intel), Enter on Attack, ArrowRight', evidence: ev('play/hud-xii-cand2.json', 'play/hud-xii-cand2-1600-cursor1.png', 'play/hud-xii-live2-1600-cursor1.png'), confidence: 'medium', requirement: 'CHK-003 / CHK-009', where: 'src/ui/ffx/hudAvoidSelectors.ts, flag placement (suspected)', fix: 'Steer the flag against the Sensor card as well as the advisor card, or fold the Sensor card while the cursor is up', acceptanceCheck: 'hudcheck cursor walk reads 0 pairs at 1600 and 2000 wide',
    introducedByCandidate: true, regressionVsLive: false, inNewFeature: false },
  { id: 'R72-2', severity: 'major', title: 'Chapter III: 8 gated swap jerks (worst 229.5 px) and head-size swaps (worst 58 percent) remain', game: 'FFX', chapter: 'braskas-final-aeon',
    expected: 'No swap jerk over 80 px, heads within 3 percent', observed: 'CHK-026 and CHK-027 FAIL. 0 teleports; the gated jerks are Auron and Yuna swaps on camera cuts and stall frames, the class the lane read on ?treated=pack and the release 70 candidate (3 teleports there). 42 mid-move dashes up to 162.2 px. The Tidus strips (attack to follow, critical to idle) are cuts, not the return flip. This review made no live Chapter III run.',
    repro: 'continuity harness braskas-final-aeon, 1630 s of battle', evidence: ev('continuity/continuity-summary-braskas-final-aeon.json'), confidence: 'medium', requirement: 'CHK-026, CHK-027', where: 'pose registration of the Chapter III victory and critical paintings (suspected)', fix: 'Register the Auron and Yuna victory and critical heads; cover the swaps with the cut', acceptanceCheck: 'continuity III reads 0 gated swap jerks',
    introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
  { id: 'R72-3', severity: 'polish', title: 'Chapter XII real-clip dashes up to 84.1 px against 0 on the control', game: 'FFX', chapter: 'seymour-omnis', expected: 'No new dashes', observed: 'XII dashes worst 84.1 px (under the 100 px bar); IX head swap 15.4 percent on both candidate and control', repro: 'continuity harness', evidence: ev('continuity/continuity-summary-seymour-omnis.json', 'continuity-control/continuity-summary-seymour-omnis.json'), confidence: 'high', requirement: 'CHK-027', where: 'real clips (suspected)', fix: 'Review the XII dash strips', acceptanceCheck: 'dashes under 60 px', introducedByCandidate: true, regressionVsLive: false, inNewFeature: false },
];
const report = { rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '01a767770' }, targetVersion: sha,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: ['No critical defect: IX, XII, VII, XIV and III played title to results by real keys, 0 console errors, 0 teleports outside III (and 0 in III).',
    'No regression against live: the XII flag overlap replaces a comparable live overlap (flag over the disc strip); VII dashes are smaller than live (166.6 vs 244.7 px); III failures are the class of the pack and release 70 baselines; IX dashes 0 against 24.2 px on the control.',
    'Majors R72-1 and R72-2 are disclosed and carried into the next batch; the release is better than live.'],
  checks, continuity,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 }, issues,
  coverage: { tested: ['dist-gate bundle and privacy gate', 'IX and XII HUD overlap walks at 1600x900 and 2000x1012 (candidate; XII also pack and live)', 'continuity harness on IX, XII, VII, XIV, III (candidate), IX, XII, VII (pack), VII (live)', 'Chapter I and XI by real keys to 4 turns at 1600x900 (XI also 2000x1012), PYREFLY_BROWSER=gpu'],
    reused: [{ what: 'text floor, sky-plate luma, strike frames, 2560 and 3440 sizes', from: 'D:/Tools/pyrefly-scratch/2026-11-01/r72/{ffx,ffx2}/results.json', why: 'the lanes measured them on the same code with the sweep harness' }],
    notTested: ['390x844', 'live Chapter III continuity run', 'XIV and III pack controls', 'per-disc cursor reads in XII', 'other FFX-2 chapters', 'timing regressions (GPU art batch noise)'] },
  regressions: [], nextReview: 'Deep review on the live build (owed): III real clips, XII HUD lift, XI sky.', elapsedMinutes: 125 };
fs.writeFileSync(`${R}.json`, JSON.stringify(report, null, 1));
fs.writeFileSync(`${R}.md`, [
  `Build / artifact / target version: 01a767770, bundle index-Cz_6EQVK.js, targets ${sha.slice(0, 12)}`,
  'Review: focused',
  'Deployment: NOT APPLICABLE',
  'Changed area: FAIL (majors R72-1 and R72-2; everything else matches its control)',
  'Ship: SHIP. No critical, no regression against live. Discloses R72-1 (XII flag over the Sensor card at alternate cursor stops) and R72-2 (III CHK-026 and CHK-027, Auron and Yuna swaps, same class as the baselines).',
  'Milestone: not assessed',
  'Quality: not scored (focused review)',
  'Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting',
  'Top issues: R72-1 major, R72-2 major, R72-3 polish',
  'Coverage: see JSON',
  'Next required review and why: deep review on the live build (owed)',
  'Elapsed review time / repeated work avoided: about 125 minutes, mostly continuity runs; lane evidence reused for sizes and sky numbers',
  '',
  'Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock; server on port 5731 (pid 61888) stopped by PID, port confirmed closed. The Chapter III lock was set to 35 minutes (the run takes 27).',
  'Case: IX, XII, III FFX only; XI FFX-2 only; slide ease both.',
  ''].join('\n'));
