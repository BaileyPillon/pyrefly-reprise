import fs from 'node:fs';
import crypto from 'node:crypto';
const R = 'D:/pyrefly-release55/critic/reviews/d5049f686-focused';
const sha = crypto.createHash('sha256').update(fs.readFileSync('D:/pyrefly-release55/docs/target/targets.json')).digest('hex');
const rdj = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const chapters = []; const controls = {};
for (const id of fs.readdirSync(`${R}/evidence`)) {
  const f = `${R}/evidence/${id}/continuity-summary.json`; if (!fs.existsSync(f)) continue;
  const s = rdj(f); const rel = `critic/reviews/d5049f686-focused/evidence/${id}/continuity-summary.json`;
  if (/-cand$/.test(id)) { for (const c of s.chapters) chapters.push({ ...c, run: id }); }
  else controls[id] = rel;
}
const continuity = { schema: 'continuity-summary/1', chapters, controls };
const E = (...a) => a.map((x) => `critic/reviews/d5049f686-focused/${x}`);
const ck = (id, result, reason, game, chapter, state, evidence, mode = 'automated', minutes = 5, mandatory = false) => ({ id, result, reason, game, chapter, state, evidence, mode, mandatory, minutes });
const tbl = E('summary-table.json');
const checks = [
  ck('CHK-017', 'PASS', 'dist-gate serves bundle index-DY38b3Cj.js (the expected one; live serves Cz_6EQVK); node tools/dist-local-paths.mjs: no local path, no claude.ai link in 1367 text files; 0 console errors and 0 4xx in every play run (phone I and IV, desktop I and IV).', 'both', 'n/a', 'served candidate', E('play/d-ch1-1600.json', 'play/p-ch4-cand.json'), 'automated', 3),
  ck('CHK-015', 'PASS', 'Real touch (390x844, touch and mobile emulation) on I: Attack tapped, battle stayed on the command flow; on IV: White Magic tapped, the spell list opened; identical on live release 72. Desktop: real Enter keys through 3 turns in I at 1600x900 and IV at 2000x1012. First command by real input only; the debug API set the seed only. Phone time to the first menu is NOT compared here (local server vs live over the internet, no throttle); the candidate IV phone entry read 26.5 s in one run and 172 s in another while the PC was loaded (noise, see R73-5).', 'both', 'I seymour-flux, IV ffx2-bahamut', 'first command, phone and desktop', E('play/p-ch1-cand.json', 'play/p-ch1-live.json', 'play/p-ch4-cand.json', 'play/p-ch4-live.json', 'play/d-ch1-1600.json', 'play/d-ch4-2000.json'), 'automated', 25),
  ck('CHK-016', 'PASS', 'Every capture asserted screen battle (and awaitingMenu) before the shot; a failed wait throws. One continuity run (sin-F-pack) failed its page-ready wait and was repeated; it produced no capture of a wrong screen.', 'both', 'all', 'capture', E('scripts/lib.mjs', 'scripts/play.mjs', 'scripts/phone4.mjs'), 'automated', 0),
  ck('CHK-020', 'PASS', 'The strike floor is shared plumbing (both games, house strike only). Presence: FFX I, VIII, XVIII, 27 and FFX-2 IV all show fewer or equal one-frame hops over 100 px at fast than release 72 (VIII 14 on live vs 2; 27 27 vs 0; I 8 vs 7; IV 26 vs 25, the last two being real rows the floor does not touch); at normal speed the candidate matches the pack control (VIII 0 and 0 hops; XVIII 0 and 0; IV 0). Absence in the other game: Sin face (FFX only) is a separate chapter id not played in FFX-2; Ixion stays FFX-2 only.', 'both', 'XVIII, VIII, 27, I (FFX); IV (FFX-2)', 'full fights at normal and fast', tbl, 'automated', 10),
  ck('CHK-021', 'PASS', 'Case: strike floor both games; Sin face FFX only (Chapter XVIII, research/ffx-vs-ffx2-presentation.md); phone entry both (shared load order). Presence: XVIII plays on the candidate with the booth treatment (0 hops, CHK-027 PASS at normal and fast); absence: IV plays the FFX-2 ATB HUD with no F1 ribbon (phone and 2000x1012 captures).', 'both', 'XVIII; I; IV', 'first menu, full fight', E('play/d-ch4-2000-03-act.png', 'play/p-ch4-cand-02-tap1.png', 'evidence/sin-F-cand/analysis.json'), 'automated', 3),
  ck('CHK-022', 'PASS', 'Each continuity run is one continuous real-key route from the title to the results (XVIII, VIII, 27, I, IV; the harness drives keys; the debug API forces fast only).', 'both', 'XVIII, VIII, 27, I, IV', 'title to results', E('evidence/index.json', 'summary-table.json'), 'automated', 150),
  ck('CHK-026', 'FAIL', 'Head-size swaps over tolerance, candidate against its control: XVIII 46 / 48 (fast / normal) against pack 46 / 49; VIII 19 / 19 against pack 19 / 19; 27 168 / 164 against pack 165 / 164; I 2 and 2; IV PASS and PASS (0). Every FAIL equals its control; none is introduced by this release (it changes no pose painting). Issue R73-4.', 'both', 'XVIII, VIII, 27, I, IV', 'full fight', E('summary-table.json'), 'automated', 150),
  ck('CHK-027', 'FAIL', 'Candidate, fast / normal: XVIII PASS / PASS (0 hops over 100 px both; the pack control 0 and 0); IV PASS / PASS (25 real-row hops at fast on candidate and on the fastfloor=today arm alike); I FAIL / PASS (7 hops: boss Seymour Flux 413 px at a swap, Auron 6 x 114 px real rows; the today arm 8, Kimahri 417); VIII FAIL / PASS (2 swap jerks, Evrae 411 px and Wakka 196 px real row; live release 72 at fast 14 hops incl. a teleport, same two swaps); 27 FAIL / FAIL (1 swap jerk of 56 px at fast and 55 px at normal; the pack control PASS at fast, live at fast FAIL with 27 hops up to 284 px). The floor removed the hops it was built for (VIII 14 to 2, 27 27 to 0, XVIII to 0). Issues R73-1, R73-2, R73-3.', 'both', 'XVIII, VIII, 27, I, IV', 'full fight, normal and fast (fast re-asserted every frame)', E('summary-table.json', 'evidence/evrae-F-live/analysis.json', 'evidence/mirror-F-live/analysis.json', 'evidence/ch1-F-today/analysis.json', 'evidence/ch4-F-today/analysis.json'), 'automated', 150),
  ck('CHK-001', 'UNVERIFIED', 'The audio change (phone victory and defeat music order, AudioManager, WarmGate, BattlePresenterSfx) is not heard by this review (agents cannot hear, hard rule 13); a sound-to-hit mismatch named by the lane is unheard.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-002', 'UNVERIFIED', 'Not run by this review.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-003', 'UNVERIFIED', 'No HUD overlap walk was run (the diff touches no HUD layout; first-menu captures of I phone, IV phone and IV 2000x1012 show no overlap by eye).', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-006', 'UNVERIFIED', 'Not run (no pause, results or options screen change reached by this review).', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-008', 'UNVERIFIED', 'Not run; lane evidence only.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-009', 'UNVERIFIED', 'Not run; no HUD placement change in the diff.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-013', 'NOT APPLICABLE', 'No approved art choice changed (approvedArtCheck false).', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-019', 'UNVERIFIED', 'No blank or silence scan run; the art is unchanged (approvedArtCheck false) and no capture was blank.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-023', 'UNVERIFIED', 'Not run by this review.', 'both', 'n/a', 'n/a', [], 'manual', 0),
  ck('CHK-B1', 'UNVERIFIED', 'Audio cue verdicts need the owner ear (hard rule 13); nothing was heard.', 'both', 'n/a', 'n/a', [], 'manual', 0),
];
const base = { game: 'FFX', inNewFeature: false };
const issues = [
  { ...base, id: 'R73-1', severity: 'major', title: 'Chapter VIII (Evrae) at fast: two swap jerks (Evrae 411 px, Wakka 196 px) fail CHK-027', chapter: 'evrae-airship',
    expected: 'No swap jerk over 40 px at fast', observed: 'Candidate at fast: 2 swap jerks, Evrae (feet, 410.7 px) and Wakka (real row, 195.5 px); 2 one-frame hops over 100 px against 14 on live (and a 324 px teleport there). The same two swaps are on live (Evrae 385.6 px, Wakka 155 px). Normal speed PASS.',
    repro: 'continuity harness evrae-airship ?coach=off, fast forced', evidence: E('evidence/evrae-F-cand/analysis.json', 'evidence/evrae-F-live/analysis.json'), confidence: 'high', requirement: 'CHK-027', where: 'Evrae swap and the held real Wakka rows', fix: 'Fit the Evrae feet swap and the Wakka attack-to-follow swap (the changelog names it)', acceptanceCheck: 'CHK-027 PASS at fast in VIII',
    introducedByCandidate: false, regressionVsLive: false },
  { ...base, id: 'R73-2', severity: 'major', title: 'Mirror Aeons (Chapter 27): one 55 px swap jerk fails CHK-027 at normal and at fast', chapter: 'mirror-aeons',
    expected: 'No swap jerk over 40 px', observed: 'Candidate: 1 swap jerk of 56.5 px at fast and 54.7 px at normal (CHK-027 FAIL both); ?treated=pack PASS at fast (swap jerks 28.4 px) and the lane run of the same candidate PASSED, so the read is borderline and run-dependent. Live at fast: FAIL with 27 hops up to 284 px (the candidate is far better at fast). The normal-speed live arm was not run; the strike floor does nothing at normal speed, so the normal read is expected to match release 72.',
    repro: 'continuity harness mirror-aeons ?coach=off', evidence: E('evidence/mirror-F-cand/analysis.json', 'evidence/mirror-N-cand/analysis.json', 'evidence/mirror-F-pack/analysis.json', 'evidence/mirror-F-live/analysis.json'), confidence: 'medium', requirement: 'CHK-027', where: 'pose swap at a Mirror Aeons row (not located)', fix: 'Read the swap strips of mirror-N-cand and fit the swap', acceptanceCheck: 'CHK-027 PASS at normal and fast in 27 over two seeds',
    introducedByCandidate: false, regressionVsLive: false },
  { ...base, id: 'R73-3', severity: 'major', game: 'both', title: 'Chapters I and IV at fast: real-row hops over 100 px remain (I 7, IV 25); the floor does not reach real rows', chapter: 'seymour-flux, ffx2-bahamut',
    expected: 'No one-frame hop over 100 px', observed: 'I at fast: 7 hops (boss Seymour Flux 413 px at a swap; Auron 6 x 114 px), CHK-027 FAIL; the fastfloor=today arm: 8 (Kimahri 417). IV at fast: 25 hops (Rikku 290, Paine 212, Bahamut 147), CHK-027 PASS by the harness; today arm 26. Normal speed: I 1 hop (Kimahri 242), CHK-027 PASS; IV 0. This is the changelog open question A (a floor for the real rows needs the owner yes).',
    repro: 'continuity harness seymour-flux and ffx2-bahamut ?coach=off, fast forced', evidence: E('evidence/ch1-F-cand/analysis.json', 'evidence/ch1-F-today/analysis.json', 'evidence/ch4-F-cand/analysis.json', 'evidence/ch4-F-today/analysis.json'), confidence: 'high', requirement: 'CHK-027', where: 'real rows (Auron, Rikku, Paine) at fast speed', fix: 'Floor the real rows at fast after the owner yes (open question A)', acceptanceCheck: '0 hops over 100 px at fast in I and IV',
    introducedByCandidate: false, regressionVsLive: false },
  { ...base, id: 'R73-4', severity: 'major', game: 'both', title: 'Head-size swaps over tolerance (CHK-026) in XVIII, VIII, 27 and I, equal to their controls', chapter: 'sin-face, evrae-airship, mirror-aeons, seymour-flux',
    expected: 'Heads within 3 percent at every swap', observed: 'XVIII 46 swaps (worst 15.5 percent), VIII 19 (15.5), 27 168 (19.6), I 2; each equals the pack control within 3 swaps. The release does not change pose paintings.',
    repro: 'continuity harness', evidence: E('summary-table.json'), confidence: 'high', requirement: 'CHK-026', where: 'pose registration of the listed chapters (carried class)', fix: 'The written method check of docs/plans/pose-swap-method-check-2026-11.md', acceptanceCheck: 'CHK-026 PASS per chapter',
    introducedByCandidate: false, regressionVsLive: false },
  { ...base, id: 'R73-5', severity: 'polish', game: 'FFX-2', title: 'One candidate phone run of Chapter IV reached the first menu in 172 s (26.5 s in another run)', chapter: 'ffx2-bahamut',
    expected: 'First menu in about 26 to 28 s on the same PC', observed: 'p-ch4-cand read 26.5 s, the repeat run 172 s while the shared PC ran other work; live read 27.7 and 28.1 s. A single noisy run: no regression is called; the lane measured the 10 Mbit/s line properly.',
    repro: 'node scripts/phone4.mjs --base=<candidate> --tag=x', evidence: E('play/p-ch4-cand.json', 'play/p-ch4-live.json', 'scripts/queue5.log'), confidence: 'low', requirement: 'CHK-015', where: 'n/a (machine load suspected)', fix: 'Repeat under the throttled harness in the deep review', acceptanceCheck: 'three runs within 20 percent',
    introducedByCandidate: 'unknown', regressionVsLive: 'unknown' },
];
const report = { rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: 'd5049f686', bundle: 'index-DY38b3Cj.js' }, targetVersion: sha,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: ['No critical defect: XVIII, VIII, 27, I and IV played title to results by real keys at normal and fast, 0 console errors, 0 teleports.',
    'No regression against live: at fast the floor removed hops (VIII 14 to 2, 27 27 to 0, XVIII 0, I 8 to 7, IV 26 to 25); every CHK-026 and CHK-027 FAIL equals its control or live read; the Sin face passes CHK-027 at both speeds with 0 hops.',
    'Desktop and normal-speed play answers as release 72 (normal runs: 0 hops in XVIII, VIII, 27 (against pack), IV; I 1 Kimahri hop); the phone first command works on I and IV exactly as on live.',
    'Majors R73-1 to R73-4 are carried, disclosed and not introduced by this release.'],
  checks, continuity,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 }, issues,
  coverage: { tested: ['dist-gate bundle DY38b3Cj and privacy gate', 'continuity harness, candidate: XVIII, VIII, 27, I, IV at normal and fast (fast re-asserted every frame)', 'controls: ?treated=pack for XVIII, VIII, 27 (both speeds); ?fastfloor=today for I and IV (fast); live release 72 for VIII and 27 (fast)', 'phone 390x844 first command on I (Attack tap) and IV (White Magic tap), candidate and live', 'desktop first menu and 3 real-key turns: I 1600x900, IV 2000x1012, I live 1600x900', 'static pose census (1106 paintings, 0 fail)', 'PYREFLY_BROWSER=gpu headless Chromium'],
    reused: [{ what: 'strike frames, phone byte and load-wait numbers (10 Mbit/s), Sin seeds 1 and 2', from: 'D:/Tools/pyrefly-scratch/2026-11-02/r73/{motion,bytes}', why: 'the lanes measured them with the throttled harness; this review confirmed the motion rows on the candidate build' }],
    notTested: ['no approved-tile composites (the change touches no approved target picture; plan targetGroups audio, fight, pause, phone, presentation not compared)', 'audio (unheard)', 'pause, results and options screens', 'phone load time on a throttled line', 'normal-speed live arms for 27 and I', 'Wakka and Lulu return pace in II, III, VII, IX, X, XII, XIV (J73-9 and J73-10)', 'other FFX-2 chapters', 'timing regressions (GPU art batch noise)'] },
  regressions: [], nextReview: 'Deep review on the live build (owed): the real-row hops, the Mirror swap jerk, the return pace, the phone entry on a throttled line.', elapsedMinutes: 270 };
fs.writeFileSync(`${R}.json`, JSON.stringify(report, null, 1));
fs.writeFileSync(`${R}.md`, [
  `Build / artifact / target version: d5049f686, bundle index-DY38b3Cj.js, targets ${sha.slice(0, 12)}`,
  'Review: focused',
  'Deployment: NOT APPLICABLE',
  'Changed area: FAIL (the floor removes the hops it was built for and the Sin face passes at both speeds; CHK-027 and CHK-026 still FAIL in VIII, 27 and I, all carried from release 72 and equal to or better than live)',
  'Ship: SHIP. No critical, no regression against live. Discloses R73-1 (VIII fast swap jerks), R73-2 (27 swap jerk 55 px), R73-3 (I and IV real-row hops at fast), R73-4 (head swaps, carried).',
  'Milestone: not assessed',
  'Quality: not scored (focused review)',
  'Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting',
  'Top issues: R73-1 major, R73-2 major, R73-3 major, R73-4 major, R73-5 polish',
  'Coverage: see JSON',
  'Next required review and why: deep review on the live build (owed)',
  'Elapsed review time / repeated work avoided: about 270 minutes, almost all continuity runs and lock waits; lane evidence reused for byte and load numbers',
  '',
  'Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock; candidate served on port 5733 (listening pid 25040) and stopped by PID, port confirmed closed. One run (sin-F-pack) timed out waiting for the page and was repeated. Frame timings were taken beside other lanes and are not used for a verdict.',
  'Case: strike floor both games (house strike only); Sin face FFX only; phone entry both.',
  ''].join('\n'));
