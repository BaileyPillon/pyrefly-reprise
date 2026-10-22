import fs from 'node:fs';
const R = 'critic/reviews/1cea6e937-focused/';
const cont = JSON.parse(fs.readFileSync(R + 'continuity/continuity-summary.json', 'utf8'));
const env = 'candidate D:/pyrefly-release55 1cea6e937 (r60-release-d), tools/candidate-build.mjs (PYREFLY_RELEASE=60) into dist-gate, bundle index-CXbIrsG6.js, vite preview 127.0.0.1:5420; headless Playwright Chromium PYREFLY_BROWSER=gpu (no black canvas, no fallback); live comparison https://echoesofspira.com/ r59 (C-nLFLJH)';
const tv = 'ba8a7e74a9d66640aff8515eba95a38d056b65fd90b8c4347b20f53f0f1c0b98';
const C = (id, result, reason, where, evidence, mode = 'automated', minutes = 5, mandatory = true) => ({ id, result, reason, where, evidence: evidence.map((e) => R + e), mode, mandatory, minutes, artifact: '1cea6e937 / dist-gate index-CXbIrsG6.js', targetVersion: tv, environment: env });
const checks = [
  C('CHK-002', 'PASS', 'Full-screen layers own the window at 1600x900, 2560x1440 and 390x844 in the Ch I and Ch IV routes; no stage-sized overlay left.', 'both; I, IV', ['ch1-demo-1600/seymour-flux-win/run.json', 'ch4-demo-390/ffx2-bahamut-win-touch/23-midfight.png', 'ch1-demo-2560/seymour-flux-win/23-midfight.png']),
  C('CHK-003', 'PASS', 'HUD text readable beside the HD-2D look at 1600, 2560 and 390 (first menu, guide, advisor, party strip); the look keeps every figure sharp.', 'both; I, IV', ['ch1-demo-1600/seymour-flux-win/16-target-single.png', 'ch4-demo-1600/ffx2-bahamut-win/10-first-menu-coach.png', 'ch1-demo-390/seymour-flux-win-touch/23-midfight.png'], 'manual'),
  C('CHK-004', 'UNVERIFIED', 'Not specifically exercised beyond the routes; no defect seen, no dedicated pass run in this time box.', 'both', [], 'manual', 0, false),
  C('CHK-005', 'UNVERIFIED', 'Not specifically exercised; no defect seen in the routes.', 'both', [], 'manual', 0, false),
  C('CHK-006', 'UNVERIFIED', 'Not specifically exercised; no defect seen.', 'both', [], 'manual', 0, false),
  C('CHK-007', 'PASS', 'No raw ids or debug text in the ordinary HUD in Ch I, IV, II, V, VI at 1600; the advisor card names the aeon (Mega Phoenix card read).', 'both', ['ch1-demo-1600/seymour-flux-win/16-target-single.png', 'ch4-demo-1600/ffx2-bahamut-win/23-midfight.png'], 'manual', 3),
  C('CHK-008', 'UNVERIFIED', 'Not specifically exercised.', 'both', [], 'manual', 0, false),
  C('CHK-009', 'UNVERIFIED', 'Not specifically exercised.', 'both', [], 'manual', 0, false),
  C('CHK-010', 'PASS', 'Ch I first Attack opens its target cursor on Seymour Flux (formation index 0), not Mortiorchis, via real Enter keys; targets listed [mortiorchis, seymour-flux], highlighted Seymour. FFX only; FFX-2 unaffected (Ch IV targeting normal).', 'FFX Ch I', ['ch1-demo-1600/seymour-flux-win/16-target-single.png', 'ch1-demo-1600/seymour-flux-win/run.json']),
  C('CHK-012', 'PASS', 'Rig and map subjects load: rigs() lists seymour-flux-body and ffx2-bahamut (gate ok); 0 missing files (notFound empty) in 11 full routes, so none of the listed light maps 404 in Ch I and IV.', 'both; I, IV', ['probe/c-ch1-default.json', 'probe/c-ch4-default.json', 'ch4-demo-1600/ffx2-bahamut-win/run.json']),
  C('CHK-013', 'PASS', 'Rigged Seymour Flux and Bahamut read as the approved paintings at gameplay scale beside their neighbours; relight lights the party without blow-out.', 'both; I, IV', ['seymour-sheet-cand.jpg', 'ch4-demo-1600/ffx2-bahamut-win/23-midfight.png'], 'manual', 4),
  C('CHK-014', 'NOT APPLICABLE', 'No portrait or menu pose changed.', 'both', [], 'manual', 0, false),
  C('CHK-015', 'PASS', 'Ch I and Ch IV played title to results with real Playwright keys (and touch at 390); the debug API only set up the probe states, never a capability proof.', 'both', ['ch1-demo-1600/seymour-flux-win/run.json', 'ch4-demo-1600/ffx2-bahamut-win/run.json', 'ch4-demo-390/ffx2-bahamut-win-touch/run.json'], 'automated', 40),
  C('CHK-016', 'PASS', 'Every capture asserted its screen/menu in the harness (probe states read via waitBattleMenu). One post-scene shot per FFX run is recorded UNVERIFIED by the harness (screen results, not cutscene), same on every run.', 'both', ['ch1-demo-1600/seymour-flux-win/run.json'], 'automated', 2),
  C('CHK-017', 'PASS', 'The reviewed bundle is built with tools/candidate-build.mjs (release stamp 60); 0 console errors and 0 404s across all full routes; board reload recorded in the routes. The deploy compares the shipped bytes itself.', 'both', ['ch1-demo-1600/seymour-flux-win/run.json', 'ch4-demo-1600/ffx2-bahamut-win/run.json'], 'automated', 3),
  C('CHK-018', 'PASS', 'No missing files or broken generated-id references: notFound empty everywhere.', 'both', ['ch4-demo-1600/ffx2-bahamut-win/run.json'], 'automated', 1),
  C('CHK-019', 'PASS', 'No blank or corrupt image seen; brightness never blew out (share of pixels above 235 at most 2.2 percent, candidate 1.5 to 1.9, live 1.9 to 2.1).', 'both', ['probe/c-ch1-default.json', 'probe/l-ch1.json'], 'automated', 2),
  C('CHK-020', 'PASS', 'The paired flows hold: Ch I (FFX) and Ch IV (FFX-2) both got the look, rigs, motion and demo mode with their own game-specific parts; the foe cursor is FFX only, the retarget fix FFX-2 only.', 'both', ['pair-live-vs-cand-ch4.jpg', 'ch1-demo-1600/seymour-flux-win/16-target-single.png'], 'manual', 5),
  C('CHK-021', 'PASS', 'Case per research/handoff: look Ch I FFX + Ch IV FFX-2 only; rigs one per game; foe cursor FFX only; retarget fix FFX-2 only. Absence elsewhere verified: Yunalesca (FFX) and Leblanc (FFX-2, hidden) show no look and match live r59 side by side; Ch IV retarget: 0 positive girl-to-girl damage and 0 damage to a girl after the boss falls in 4 Ch IV routes; unit tests ffx2-single-any-retarget, ffx2-atb-golden, demo-mode pass (4 files, 47 tests).', 'both', ['pair-live-vs-cand-yuna.jpg', 'pair-live-vs-cand-leblanc.jpg', 'probe/c-yuna.json'], 'automated', 12),
  C('CHK-022', 'PASS', 'Ch I won (1600 and 2560), Ch IV won (three sizes), Ch II, V, VI won; wins reach results and the board (the Ch I 390 touch route was lost on the route, same on live, see FOC60-03).', 'both', ['ch1-demo-2560/seymour-flux-win/run.json', 'ch4-demo-2560/ffx2-bahamut-win/run.json', 'yuna-1600/yunalesca-win/run.json', 'vegnagun-1600/ffx2-vegnagun-shuyin-win/run.json', 'leblanc-1600/ffx2-leblanc-win/run.json'], 'automated', 60),
  C('CHK-023', 'PASS', 'Presenter path: the look, rig variant cross-fade, potion orb (+200 on Tidus) and FFX-2 potion spark played through the real item path with real keys.', 'both', ['potion-ch1.jpg', 'potion-ch4.jpg'], 'automated', 4),
  C('CHK-026', 'FAIL', 'Rigs now counted: Seymour Flux body rig 106 of 124 swaps and Bahamut rig 98 of 114 swaps change the rig head mesh by more than 3 percent (worst 8 and 18 percent); live r59 PASSED both chapters. The independent pixel readings are clean (stature 0.78 to 1.10, 0 out of band; feet at most 2.8 px; rig settles in 10 frames). Suspected: the head metric reads a jointed figure articulating between keys.', 'both; I, IV', ['continuity/continuity-summary.json', 'continuity-live/continuity-summary.json'], 'automated', 35),
  C('CHK-027', 'FAIL', 'Ch I 3 jerks of 40 px or more at a swap (worst 57.8), Ch IV 1 (48.3). Live r59 had 10 jerks (worst 63) and 4 double images; the candidate has 4 jerks and no double image: better than live. 0 snaps per minute, frame p99 23.5 and 45.2 ms (live 24.5 and 45.4).', 'both; I, IV', ['continuity/continuity-summary.json', 'continuity-live/continuity-summary.json'], 'automated', 35),
];
const base = { introducedByCandidate: false, regressionVsLive: false, inNewFeature: false };
const issues = [
  { id: 'FOC60-01', severity: 'major', title: 'CHK-026 head-size gate fails on the two new rigs (Seymour Flux body Ch I, Bahamut Ch IV)', game: 'both (FFX Ch I, FFX-2 Ch IV)', chapter: 'seymour-flux, ffx2-bahamut', expected: 'a figure head changes by at most 3 percent at a pose swap (CHK-026)', observed: 'rig head mesh changes 3 to 8 percent (Seymour, 106 of 124 swaps) and up to 18 percent (Bahamut, 98 of 114 swaps) between keys; the same chapters PASSED on live r59 (painted). Independent readings (stature band, feet from pixels, 10-frame settle) are clean and a contact sheet of a 70 s Ch I fight shows Seymour consistent in size.', repro: 'node critic/runner/lib/continuity.mjs --base=<preview> --chapters=seymour-flux,ffx2-bahamut --tag=x on 1cea6e937 and on live', evidence: [R + 'continuity/continuity-summary.json', R + 'continuity-live/continuity-summary.json', R + 'seymour-sheet-cand.jpg'], confidence: 'high that the gate fails; medium that a player sees it', requirement: 'CHK-026', where: 'suspected: src/engine/rig/RigActor.ts key blend; critic/runner/lib/continuity-rig.mjs head metric', fix: 'Hold the rig head scale across keys, or record the rig head as an articulating metric; ask Bailey which', acceptanceCheck: 'CHK-026 PASS on both chapters with rigs counted', introducedByCandidate: true, regressionVsLive: true, inNewFeature: true },
  { id: 'FOC60-02', severity: 'polish', title: 'Battle start stalls 0.6 to 1.3 s on arrival (every chapter, live too)', game: 'both', chapter: 'all', expected: 'no frame gap above 100 ms at battle start', observed: 'one frame gap of 630 to 830 ms (Ch I and IV, look on) and 1.2 s on Yunalesca without a look; live r59 shows 850 ms; the candidate is no worse than live. Averages 16.7 to 17.2 ms (about 59 fps) everywhere.', repro: 'fps-*.log in the evidence folder', evidence: [R + 'fps-ch1-nodemo-1600.log', R + 'fps-live-ch1-390.log', R + 'fps-yuna-1600.log'], confidence: 'high', requirement: 'smooth start of a battle', where: 'battle entry load / shader warm-up', fix: 'prepare the look and rig programs before the swirl ends', acceptanceCheck: 'no frame gap above 100 ms in the first 5 s', ...base },
  { id: 'FOC60-03', severity: 'polish', title: 'Touch route cannot reach Ch I victory at 390x844 (item list shows 6 rows; the route cannot scroll to Poison Fang)', game: 'FFX', chapter: 'seymour-flux', expected: 'touch run wins like the 1600 route', observed: 'candidate (demo seed 7 and seed 1) and live r59 (seed 1) all end in defeat after the route picks Attack when the advised item is below the 6 visible rows; Ch IV wins at 390', repro: 'route.mjs seymour-flux win --size=390x844 --touch on either build', evidence: [R + 'ch1-demo-390/seymour-flux-win-touch/run.json', R + 'live-ch1-390/seymour-flux-win-touch/run.json'], confidence: 'medium', requirement: 'CHK-015 touch', where: 'harness item picker or phone item list', fix: 'scroll the item list in the route', acceptanceCheck: 'touch Ch I route wins', ...base },
];
const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(),
  build: { mainSha: '1cea6e937', candidate: 'D:/pyrefly-release55/dist-gate', bundle: 'index-CXbIrsG6.js', previousLive: '6db09ac86 (bundle C-nLFLJH)' },
  targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'FAIL', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons: [
    'No critical defect: Ch I and Ch IV (and II, V, VI) won with real keys at 1600x900 and 2560x1440 (Ch IV also 390x844), 0 console errors, 0 missing files, 59 to 60 fps, no stall beyond live\'s own battle-start gap.',
    'No regression against live in shipped behaviour: the other chapters match live r59 side by side (no look); look on only in Ch I and Ch IV; ?look=off and ?motion=off switch exactly their own parts; the REDUCE FLASHES run shows no blow-out.',
    'The one gate FAIL (CHK-026 head metric on the new Seymour and Bahamut rigs) is inside brand-new features (the rigs), so it is disclosed and does not block; CHK-027 motion is better than live (4 jerks and no double image against 10 and 4).',
    'Demonstrated fixes: first Attack in Ch I opens on Seymour; no damage to a girl after Bahamut falls in four Ch IV routes; the Potion orb and spark play.',
  ],
  checks, continuity: cont,
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0, note: 'tools/end-state-board.mjs does not exist in this candidate, so no per-tile composites were made; the look, rigs and layout were compared with live by hand (pair-live-vs-cand-*.jpg).' },
  issues,
  coverage: {
    tested: ['Ch I and Ch IV, demo and no demo, 1600x900, 2560x1440, 390x844 touch (real keys)', 'Ch II, V, VI at 1600x900 against live', '?look=off, ?motion=off, REDUCE FLASHES, potion orb and spark', 'continuity harness on Ch I and IV, candidate and live', 'unit tests retarget, golden, demo-mode'],
    reused: [],
    notTested: ['2000x1012', 'demo seeds 10 and 12 (only seed 7 played in Ch I; Ch IV seed 56 won)', 'a hidden chapter other than Leblanc, the FF7 experiment, the other 14 chapters', 'CHK-004, 005, 006, 008, 009', 'per-tile target composites', 'a human eye on rig motion at conference scale'],
  },
  regressions: [],
  nextReview: 'deep review of the live build after deploy',
  elapsedMinutes: 330,
};
fs.writeFileSync('critic/reviews/1cea6e937-focused.json', JSON.stringify(report, null, 2));
const md = `Build / artifact / target version: 1cea6e937 (release 60 candidate, dist-gate index-CXbIrsG6.js) / ${tv.slice(0, 12)}
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (CHK-026 head gate on the new rigs; everything else met its target)
Ship: SHIP, better than live r59. Discloses FOC60-01 (major, inside the new rigs).
Milestone: not assessed
Quality: not scored in a focused review
Targets: 0 / 0 / 0 / 0 / 0 (no tile composites; hand comparison with live)
Top issues: FOC60-01 rig head size gate (major, new feature); FOC60-02 battle-start gap, same as live (polish); FOC60-03 touch route cannot win Ch I at 390, same on live (polish)
Coverage: Ch I and IV at three sizes, demo and not; II, V, VI vs live; look/motion off; reduce flashes; orb and spark; continuity on both builds. Not tested: 2000x1012, demo seeds 10 and 12, CHK-004/5/6/8/9, tile composites.
Next required review and why: deep review on the live build (shared systems changed)
Elapsed review time / repeated work avoided: about 330 minutes; no earlier evidence reused

${report.shipReasons.map((s) => '- ' + s).join('\n')}
`;
fs.writeFileSync('critic/reviews/1cea6e937-focused.md', md);
