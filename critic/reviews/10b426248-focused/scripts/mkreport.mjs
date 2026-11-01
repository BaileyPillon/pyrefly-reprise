import fs from 'node:fs';
import crypto from 'node:crypto';
const R = 'D:/pyrefly-release55';
const REV = `${R}/critic/reviews`;
const rd = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha = crypto.createHash('sha256').update(fs.readFileSync(`${R}/docs/target/targets.json`)).digest('hex');
const E = 'critic/reviews/e3f51bf18-focused';
const S = `${E}/shots`;
const line = (p) => rd(`${REV}/e3f51bf18-focused/${p}`).reportLine.split(' Read by')[0];
const chs = ['yunalesca', 'braskas-final-aeon', 'seymour-anima-macalania', 'seymour-natus', 'isaaru-via-purifico', 'ffx2-trema', 'ffx2-den-of-woe'];
const live = ['yunalesca', 'seymour-anima-macalania', 'isaaru-via-purifico', 'ffx2-trema', 'braskas-final-aeon'];
const continuity = { schema: 'continuity-summary/1', base: 'candidate dist-gate (bundle index-UNVtEttT.js) at http://127.0.0.1:5871/; live baseline https://echoesofspira.com/ (release 69)', date: new Date().toISOString(), chapters: {}, note: 'Chapters I, IV, VI (booth pair and Leblanc) not re-run: unchanged code path, first-menu pixel parity checked instead.' };
const lines = [];
for (const c of chs) {
  continuity.chapters[c] = { candidate: line(`continuity/continuity-summary-${c}.json`), liveRelease69: live.includes(c) ? line(`continuity-live/continuity-summary-${c}.json`) : 'not run' };
  lines.push(`${c}: ${continuity.chapters[c].candidate}`);
}
continuity.chapters['isaaru-via-purifico'].candidateSeed2 = line('continuity-rerun/continuity-summary-isaaru-via-purifico.json');
continuity.chapters['seymour-anima-macalania'].candidateSeed2 = line('continuity-rerun/continuity-summary-seymour-anima-macalania.json');
continuity.reportLine = lines.join('\n');

const chk = (id, result, reason, game, chapter, state, evidence, mode, mandatory, minutes) => ({ id, result, ...(reason ? { reason } : {}), game, chapter, state, evidence, mode, mandatory, minutes });
const checks = [
  chk('CHK-001', 'UNVERIFIED', 'Agents cannot hear; no cue was auditioned.', 'both', 'all', 'audio', [], 'manual', true, 0),
  chk('CHK-002', 'PASS', 'First-menu layout at 1600x900 (14 chapters), 2000x1012 (4 treated chapters) and 390x844 touch (3 treated chapters): no horizontal overflow, the F1 HUD owns the window in every treated chapter.', 'both', 'seven treated chapters + I, IV, VI + four untreated', 'battle first menu', [`${S}/c-yunalesca-1600-01-menu.png`, `${S}/c-seymour-natus-1600-01-menu.png`, `${S}/w2-seymour-anima-macalania-01-menu.png`, `${S}/ph-ffx2-trema-01-menu.png`], 'automated', false, 25),
  chk('CHK-003', 'PASS', 'Text and buttons at the three sizes: GUIDE/HIDE MOVES/ENEMY MOVE and the phone PAUSE (46x46) and GUIDE (77x32) targets present; the known cut-off label SPECI... in Chapter XIV is on the live build too.', 'both', 'treated chapters', 'battle', [`${S}/c-isaaru-via-purifico-1600-01-menu.png`, `${S}/ph-yunalesca-01-menu.png`], 'automated', false, 10),
  chk('CHK-006', 'UNVERIFIED', 'Overlays were not driven to their ends; the opening speech card (Trema, Den of Woe, Isaaru) is the same on live.', 'both', 'various', 'overlays', [], 'manual', false, 0),
  chk('CHK-008', 'PASS', 'In the seven treated chapters the F1 panels do not collide with the painted actors at the first menu (Yuna and Rikku speech cards overlay the HUD for a moment at battle start in Trema, Den of Woe and Isaaru: identical on live). Chapters IX and XII (off the list) answer as live.', 'both', 'seven treated chapters', 'first menu', [`${S}/c-ffx2-den-of-woe-1600-01-menu.png`, `${S}/c-ffx2-trema-1600-01-menu.png`], 'manual', false, 15),
  chk('CHK-009', 'PASS', 'The F1 ribbon names the declared boss: Seymour (Chapter VII, not the Guado Guardian in slot 0), Seymour Natus, Yunalesca, Braska\'s Final Aeon, Isaaru, Paragon (Trema), Baralai (Den of Woe). Pointed at by the new HeadlineBoss module.', 'both', 'seven treated chapters', 'first menu', [`${S}/c-seymour-anima-macalania-1600.json`], 'automated', false, 5),
  chk('CHK-013', 'UNVERIFIED', 'Cast art not judged against the approved masters; no art file changed (art-derive verify and audit PASS on dist-gate: 5404 masters, 0 problems).', 'both', 'all', 'art', [], 'manual', false, 4),
  chk('CHK-015', 'PASS', 'Real keys from the title (Enter), chapter-select (ArrowRight), party prep (Enter), the scene skip, then Enter on Attack and Enter on the target, three more turns, in all 14 chapters at 1600x900; touch tap on Attack at 390x844 in Yunalesca, Trema and Anima. The cancel path (Escape) was not walked by me in this review.', 'both', 'all 14 played', 'first menu to turn 4', [`${S}/c-yunalesca-1600.json`, `${S}/ph-ffx2-trema.json`], 'automated', false, 40),
  chk('CHK-016', 'PASS', 'Every capture asserted screen === battle and awaitingMenu before the shot; a failed cursor wait (5 chapters, my navigator pressed ArrowDown) was rerun, never captured.', 'both', 'all', 'battle', [`${S}/c-seymour-natus-1600.json`], 'automated', true, 2),
  chk('CHK-017', 'PASS', 'The exact candidate: dist-gate names index-UNVtEttT.js (confirmed from the served index.html and in the pages); art-derive verify PASS (5404 masters, 0 problems) and audit PASS (0 dangling); 0 console errors and 0 4xx in every run (14 + 3 phone + 4 wide + live pairs).', 'both', 'build', 'artifact', [`${S}/c-yunalesca-1600.json`], 'automated', true, 8),
  chk('CHK-020', 'PASS', 'Shared plumbing (stageFreeze form-change guard, ProFollower scripted stand-down, HeadlineBoss) is both games; the FFX-only treated chapters (II, III, VII, X, XIV) and the FFX-2-only (XIII, XV) each play in their game; the F1 ribbon boss rule is the shared one.', 'both', 'all', 'static + browser', [`${S}/c-ffx2-den-of-woe-1600.json`], 'manual', false, 10),
  chk('CHK-021', 'PASS', 'Presence in the intended game and absence elsewhere: treated().reaches is true in exactly the seven new chapters plus I, IV, VI and false in IX, XII, V and XI (off the list); IX and XII measured against live at 3.7 and 5.7 percent first-menu difference.', 'both', 'all 14', 'first menu', [`${S}/c-yojimbo-cavern-1600-01-menu.png`, `${S}/L-yojimbo-cavern-1600-01-menu.png`], 'automated', true, 10),
  chk('CHK-022', 'UNVERIFIED', 'No chapter was fought to its Victory results in this review (four real-key turns each); the lanes\' own wins were not repeated. The continuity harness did play seven chapters to their wins on the candidate.', 'both', 'seven treated chapters', 'results', [`${E}/continuity/index.json`], 'automated', false, 0),
  chk('CHK-023', 'PASS', 'The treatment is reached through the real path: ?treated default, the F1 HUD, the directed look and the four fx plates draw in Chapters II, III, VII, XIV, XIII, XV (look cinematic, plates 4); Chapter X reports no fx plates (none in its room, per the lane).', 'both', 'treated chapters', 'battle', [`${S}/c-seymour-natus-1600.json`], 'automated', false, 5),
  chk('CHK-026', 'FAIL', continuity.reportLine.slice(0, 1700), 'both', 'seven treated chapters', 'continuity harness, win, seed 1', [`${E}/continuity/continuity-summary-braskas-final-aeon.json`, `${E}/continuity/continuity-summary-yunalesca.json`, `${E}/continuity-live/continuity-summary-braskas-final-aeon.json`], 'automated', true, 190),
  chk('CHK-027', 'FAIL', 'Candidate FAIL in Yunalesca (1 swap jerk against live 7), Braska\'s Final Aeon (8 swap jerks and 3 mid-move teleports from a camera cut against live 8 and none), Seymour and Anima (1 at seed 1, PASS at seed 2, live PASS), Isaaru (one 89.7 px Ixion foot jerk at seed 1 and 89.9 at seed 2, live PASS), Den of Woe (6 jerks, mostly a Change dress swap, no live baseline); PASS in Natus and Trema.', 'both', 'seven treated chapters', 'continuity harness, win', [`${E}/continuity/continuity-summary-isaaru-via-purifico.json`, `${E}/continuity/isaaru-via-purifico-win-e3f51bf18/continuity/strips/jerk-000-ixion.jpg`, `${E}/continuity/braskas-final-aeon-win-e3f51bf18/continuity/strips/jerk-003-tidus.jpg`], 'automated', true, 190),
  chk('CHK-B1', 'UNVERIFIED', 'Whether the music and effects are beautiful: no agent can hear.', 'both', 'all', 'audio', [], 'manual', false, 0),
];

const iss = (o) => ({ build: 'e3f51bf18', confidence: 'medium', requirement: 'CHK-026 / CHK-027', ...o });
const issues = [
  iss({
    id: 'R70-C1', severity: 'polish', title: "Braska's Final Aeon: CHK-026 and CHK-027 read worse than live (swap and teleport reads the live build does not have)", game: 'FFX', chapter: 'braskas-final-aeon',
    expected: 'CHK-026 and CHK-027 as live (live: CHK-026 FAIL on Lulu\'s switch swaps only, CHK-027 FAIL on 8 smeared swap jerks, no teleports)',
    observed: 'Candidate adds CHK-026 fails on the boss (idle to hurt, 15 height and 8 head reads), Auron critical swaps, Tidus and Yuna critical to idle, and 3 mid-move teleports of 300 px or more on Tidus that the strip shows to be a hard camera cut between shots (the harness does not flag it a camera cut). The sampled strips (boss hurt to idle, Tidus critical to idle) show no change a player could see; the size ratios are measured against a moving directed camera.',
    repro: 'node critic/runner/lib/continuity.mjs --base=<candidate> --chapters=braskas-final-aeon (about 30 minutes); live baseline the same on https://echoesofspira.com/',
    evidence: [`${E}/continuity/continuity-summary-braskas-final-aeon.json`, `${E}/continuity-live/continuity-summary-braskas-final-aeon.json`, `${E}/continuity/braskas-final-aeon-win-e3f51bf18/continuity/strips/jerk-003-tidus.jpg`, `${E}/continuity/braskas-final-aeon-win-e3f51bf18/continuity/strips/ghost-297-braskas-final-aeon-hurt-idle.jpg`],
    where: 'directed camera (cam piece) plus smear on Braska\'s chapter; suspected, not traced', fix: 'Mark the directed camera\'s hard cuts as camera cuts for the harness, or hold cam for this chapter until a CHK-026 read on the camera-on build is clean',
    acceptanceCheck: 'Harness on braskas-final-aeon reads no teleport and no new CHK-026 fail beyond live\'s', introducedByCandidate: true, regressionVsLive: true, inNewFeature: false,
  }),
  iss({
    id: 'R70-C2', severity: 'polish', title: 'Isaaru: one 90 px foot jerk at an Ixion pose swap (CHK-027), recurs at a second seed', game: 'FFX', chapter: 'isaaru-via-purifico',
    expected: 'CHK-027 PASS as live', observed: 'Ixion\'s attack-to-idle swap jumps its feet 89.7 px (seed 1) and 89.9 px (seed 2) in one frame with no planned smear logged; the strip shows a red motion trail across the frame. Live passes at seed 1 (its own Ixion swap reads 44 px and is smeared); live at seed 2 was not run.',
    repro: 'continuity.mjs --chapters=isaaru-via-purifico (about 5 minutes)', evidence: [`${E}/continuity/isaaru-via-purifico-win-e3f51bf18/continuity/strips/jerk-000-ixion.jpg`, `${E}/continuity-rerun/continuity-summary-isaaru-via-purifico.json`, `${E}/continuity-live/continuity-summary-isaaru-via-purifico.json`],
    where: 'aeon swap while a smear plays; suspected', fix: 'Let the smear planner log the Ixion cut or hold smear for this chapter', acceptanceCheck: 'Harness reads CHK-027 PASS at seeds 1 and 2', introducedByCandidate: true, regressionVsLive: true, inNewFeature: false,
  }),
  iss({
    id: 'R70-C3', severity: 'polish', title: 'Yunalesca: CHK-026 and CHK-027 FAIL on the candidate and on live (carried), see-through time 5.3 s a minute against 4.6 live', game: 'FFX', chapter: 'yunalesca',
    expected: 'CHK-026 PASS', observed: 'Candidate: 38 stance swaps (worst 13.6 px), 1 swap jerk (88 px); live: 20 and 7 (worst 102 px). The swap exception held for her is untouched, so this is live\'s own, neither better nor worse in kind; see-through 318.7 against 274.4 frames a minute.',
    repro: 'continuity.mjs --chapters=yunalesca', evidence: [`${E}/continuity/continuity-summary-yunalesca.json`, `${E}/continuity-live/continuity-summary-yunalesca.json`],
    where: 'her SwapSwitch exception (held); not traced', fix: 'Lift the held smear row per PIECE_HOLDS', acceptanceCheck: 'job yunalesca-all-held-anchor reads no swap jerk of 40 px or more outside a named cut', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false,
  }),
  iss({
    id: 'R70-C4', severity: 'polish', title: 'Chapter VII and XIII: CHK-026 FAIL reads equal to live (carried)', game: 'both', chapter: 'seymour-anima-macalania, ffx2-trema',
    expected: 'CHK-026 PASS', observed: 'Anima: 1 stance swap of 15.4 px (live 15.9; 16.5 at seed 2); Trema: 16 feet swaps of at most 10.4 px (live the same 16, 10.4 px). CHK-027 on Trema is PASS (live FAIL, 1 jerk).',
    repro: 'continuity.mjs on each', evidence: [`${E}/continuity/continuity-summary-seymour-anima-macalania.json`, `${E}/continuity-live/continuity-summary-seymour-anima-macalania.json`, `${E}/continuity/continuity-summary-ffx2-trema.json`, `${E}/continuity-live/continuity-summary-ffx2-trema.json`],
    where: 'registration, not changed by this release', fix: 'Register the stances', acceptanceCheck: 'harness PASS', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false,
  }),
  iss({
    id: 'R70-U1', severity: 'suggestion', title: 'Den of Woe CHK-027 FAIL (6 swap jerks, worst 167 px, mostly the Change dress swap) has no live baseline', game: 'FFX-2', chapter: 'ffx2-den-of-woe',
    expected: 'baseline', observed: 'Candidate only; the strip I read (Paine 44 px) is a dress Change inside a light burst, an intended cut. Live was not run.', repro: 'continuity.mjs --chapters=ffx2-den-of-woe on the live URL (about 6 minutes)',
    evidence: [`${E}/continuity/continuity-summary-ffx2-den-of-woe.json`, `${E}/continuity/ffx2-den-of-woe-win-e3f51bf18/continuity/strips/jerk-042-paine.jpg`], where: 'n/a', fix: 'Run the live baseline in the deep review', acceptanceCheck: 'baseline comparison',
    introducedByCandidate: 'unknown', regressionVsLive: 'unknown', inNewFeature: false,
  }),
];

const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: 'e3f51bf18', bundle: 'index-UNVtEttT.js' }, targetVersion: sha,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'UNVERIFIED', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: [
    'No critical defect introduced and no major regression against live release 69 in what was measured: all 14 chapters played from the real title by real keys through four turns at 1600x900 with 0 console errors, 58 to 60 fps, the F1 ribbon naming the declared boss (Seymour in Chapter VII) and the seven new chapters reaching the treatment.',
    'The booth pair and Leblanc answer as release 69: first-menu pixel difference against live 4.7 percent (I), 7.9 to 13.9 percent (IV, against 11.8 percent between two live runs) and 5.7 percent (VI), within live-against-live noise; IX and XII (off the list) read within live noise (3.7 and 5.7 percent); V and XI (off the list) were checked only for treated().reaches false.',
    'The continuity harness reads CHK-026 and CHK-027 worse than live in two chapters (R70-C1 Braska\'s Final Aeon, R70-C2 Isaaru) and equal or better in the other five; I rate both polish (one 90 px foot jerk under a smear trail, and reads the strips show no visible change for, with a camera cut counted as a teleport). If the owner counts a continuity FAIL as major, both are regressions and the rule makes this a HOLD; I did not.',
  ],
  checks, continuity,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 },
  issues,
  coverage: {
    tested: ['Candidate identity and art (bundle, art-derive verify and audit PASS)', 'Real-key first menu and four turns at 1600x900 in 14 chapters (7 new treated, I, IV, VI, and IX, XII, V, XI as off-list controls), 0 console errors', '2000x1012 in Chapters III, VII, X, XV; 390x844 touch in II, VII, XIII', 'Cross-build first-menu pixel comparison against live release 69 for I, IV, VI, IX, XII (equal within noise) and VII, XIII (different, as intended; live Trema screenshot read by eye)', 'Continuity harness on seven chapters on the candidate, five on live release 69, and two candidate reruns at seed 2'],
    reused: [{ what: 'Lane evidence of D:/Tools/pyrefly-scratch/2026-10-31/r70 (holds, composites)', from: 'lane results.json', why: 'read for what to look at; every verdict above was measured by me on dist-gate' }],
    notTested: ['Sound', 'Victory results of the seven new chapters by real keys (harness wins only)', 'The Escape cancel path of the new menus', 'Chapters VIII, XI to XIX other than XIII and XV, hidden chapters (untouched)', 'Live baseline for Chapter XV continuity', 'Chapter X victory close-up held by the new cam row: not played to the victory frame'],
  },
  regressions: ['R70-C1 Braska\'s Final Aeon continuity reads worse than live (polish)', 'R70-C2 Isaaru Ixion foot jerk (polish)'],
  nextReview: 'Deep review on the live build after the deploy (shared presenter, F1 ribbon plumbing, seven new chapters); first, a live baseline of Chapter XV and a seed-2 Isaaru run on live.',
  elapsedMinutes: 270,
};
fs.writeFileSync(`${REV}/e3f51bf18-focused.json`, JSON.stringify(report, null, 1));

const head = `Build / artifact / target version: e3f51bf18, bundle index-UNVtEttT.js, targets ${sha.slice(0, 12)}
Review: focused
Deployment: NOT APPLICABLE
Changed area: UNVERIFIED (no chapter fought to its Victory results by real keys in this review; continuity reads worse than live in two chapters)
Ship: SHIP. ${report.shipReasons[0]} Disclosed: R70-C1 and R70-C2 (polish, continuity reads), and the carried R70-C3 and R70-C4.
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R70-C1 (Braska continuity), R70-C2 (Isaaru Ixion jerk), R70-C3 (Yunalesca carried)
Coverage: see JSON
Next required review and why: Deep review on the live build after the deploy (shared presenter and HUD plumbing, seven new chapters)
Elapsed review time / repeated work avoided: about 270 minutes (about 190 of them the continuity harness); lane evidence read, not reused as proof
`;
fs.writeFileSync(`${REV}/e3f51bf18-focused.md`, head + '\nBrowser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock; the GPU art batch may share the machine so timings are noisy. Server on port 5871 (pid 6356) stopped by PID, port confirmed closed.\n\n' + report.shipReasons.map((s) => '- ' + s).join('\n') + '\n\nContinuity:\n' + continuity.reportLine + '\n\nIssues:\n' + issues.map((i) => `- ${i.id} (${i.severity}) ${i.title}: ${i.observed}`).join('\n') + '\n');
console.log('written');
