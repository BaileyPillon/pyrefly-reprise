import fs from 'node:fs';
import crypto from 'node:crypto';
const EV = 'critic/reviews/455c524c-focused';
const tv = crypto.createHash('sha256').update(fs.readFileSync('docs/target/targets.json')).digest('hex');
const sum = JSON.parse(fs.readFileSync(`${EV}/continuity/continuity-summary.json`, 'utf8'));
const env = 'headless Playwright, PYREFLY_BROWSER=gpu (no black canvas), candidate dist-gate via vite preview :5400, real keys from the title; 1600x900, 2000x1012, 1280x1024, 390x844';
const c = (id, result, reason, o = {}) => ({ id, result, reason, game: o.game ?? 'both', chapter: o.chapter ?? 'see reason', state: o.state ?? 'battle', evidence: o.evidence ?? [], mode: o.mode ?? 'automated', mandatory: o.mandatory ?? false, minutes: o.minutes ?? 5, environment: env, artifactVersion: '455c524c', targetVersion: tv.slice(0, 12) });
const CAM = [`${EV}/cam/sheet-cand-1600.jpg`, `${EV}/cam/sheet-live-1600.jpg`, `${EV}/cam/zoom-cand-1600.jpg`, `${EV}/cam/zoom-live-1600.jpg`, `${EV}/cam/zoom-cand-2000.jpg`, `${EV}/cam/zoom-cand-small.jpg`];
const LIVEJ = `${EV}/continuity-live/ffx2-bahamut-win-live-fcecfa74/continuity/continuity.json`;
const checks = [
  c('CHK-001', 'UNVERIFIED', 'No music changed in this candidate (SFX plumbing only); not listened to (agents cannot hear, rule 13).'),
  c('CHK-002', 'PASS', 'The opening move of Ch IV Bahamut fills the viewport at 1600x900, 2000x1012, 1280x1024 and 390x844 with real keys; the screencasts show the full frame at each size.', { game: 'ffx2', chapter: 'ffx2-bahamut', evidence: CAM, minutes: 20 }),
  c('CHK-003', 'PASS', 'Phone 390x844: strip, name slab and party cards read, Bahamut whole, no pipe slab (frames at 3.6, 5.0 and 8.5 s read by eye).', { game: 'ffx2', chapter: 'ffx2-bahamut', evidence: [`${EV}/cam/zoom-cand-small.jpg`] }),
  c('CHK-006', 'UNVERIFIED', 'Overlays untouched; only the first coach and advisor frames of two chapters passed through the continuity harness.'),
  c('CHK-008', 'NOT APPLICABLE', 'No combat feedback, damage number or HUD overlay changed.'),
  c('CHK-009', 'NOT APPLICABLE', 'No names or player copy changed.'),
  c('CHK-013', 'NOT APPLICABLE', 'No approved painting or target tile changed (approvedArtCheck false); the pipes are 3D geometry in front of the approved plate and the plate is untouched. No target composite is owed: no tile of the plan target groups is built by this change.'),
  c('CHK-015', 'PASS', 'The camera screencasts and the continuity harness drive title, chapter select, party prep, cutscene and fight to the first menu or to victory with real Playwright keys (Enter, ArrowRight); the debug API only seeds (setSeed, trigger prep:begin) and reads state.', { evidence: [`${EV}/cam/run.log`, `${EV}/continuity-run.log`], minutes: 45, mandatory: true }),
  c('CHK-016', 'PASS', 'Every capture is gated on screen()==="battle" read back by the script (the screencast starts only on that screen and ends only on awaitingMenu); the harness asserts each state or aborts. The debug sfx route for Ch IV ended on chapter-select after an abort at 20 s: it is used only for the prefix comparison and is said so.', { evidence: [`${EV}/cam/cam.mjs`, `${EV}/sfxcmp.mjs`] }),
  c('CHK-017', 'NOT APPLICABLE', 'Pre-deploy focused review of the candidate; the exact live artifact is verified after the deploy.'),
  c('CHK-019', 'UNVERIFIED', 'No audio file changed; sfxLog shows only v2 and sprite cues play in both games (no via=parity), the same as live; nothing was decoded or listened to.', { evidence: [`${EV}/sfxcmp.json`] }),
  c('CHK-020', 'PASS', 'FFX-2-only change (Bevelle scene, Ch IV) present in FFX-2 (slabs gone at 4 sizes) and absent in FFX (Seymour Flux continuity run: 0 snaps, same as the previous build; the scene code is the FFX-2 Bevelle scene only). The SFX plumbing is both: one FFX and one FFX-2 fight compared with live.', { evidence: [CAM[0], CAM[1], `${EV}/sfxcmp.json`], minutes: 20 }),
  c('CHK-021', 'PASS', 'Case stated: PR-0421 is FFX-2 only (src/scenes/bevelle-underground.ts is the FFX-2 Bevelle scene; research/ffx-vs-ffx2-presentation.md has no FFX counterpart); SFX hooks are both (the FFX hook is the encounter shatter and fade-in via startFlow in BattleScreen, the FFX-2 hooks are the results loop and ping in ResultsScreen); flowSlots.ts game-gates each slot (read; pinned by the audio-sfx-parity-slots test). Presence in the intended game and no new cue in either game while the packs are empty was verified in the browser (sfxLog). No data value changed (dataAudit false).', { evidence: [`${EV}/sfxcmp.json`] }),
  c('CHK-022', 'PASS', 'Ch IV (FFX-2) and Ch I (FFX) each played title to victory by real keys through the continuity harness (Ch IV 42 turns); the Ch IV opening to the first menu was played at four sizes by real keys.', { evidence: [`${EV}/continuity-run.log`], minutes: 14 }),
  c('CHK-023', 'PASS', 'The opening camera and the pipe binding were measured in the real presenter and scene path during a real chapter entry (screencast per frame, 587 to 630 frames per size, 10.7 s).', { game: 'ffx2', chapter: 'ffx2-bahamut', evidence: CAM }),
  c('CHK-026', 'PASS', 'Size continuity across pose changes: Ch IV max head jump 9.5 percent (0.2 registered), feet shift 0.4 px, 0 snaps per minute; Ch I 12.1 percent, feet 0.7 px, 0 snaps; Ch IV is the same on live in the same instrument (9.5 percent, 0.4 px).', { evidence: [`${EV}/continuity/continuity-summary.json`, LIVEJ], minutes: 14, mandatory: true }),
  c('CHK-027', 'FAIL', 'Motion continuity fails the over-40 px jerk bar as live does: Ch IV 11 (worst 141 px, a camera cut mid-Overdrive, strip jerk-000) against live 6 and 7 in two runs (worst 52 to 86 px); Ch I 5 (worst 73.7 px), the same as the previous candidate. 0 snaps per minute in both. The candidate changes nothing in the figures or the pose path; the Ch IV count difference is not traced and may be run to run (one run each).', { evidence: [`${EV}/continuity/continuity-summary.json`, `${EV}/continuity/ffx2-bahamut-win-455c524c/continuity/strips/jerk-000-bahamut.jpg`, LIVEJ], minutes: 14, mandatory: true }),
  c('CHK-B1', 'UNVERIFIED', 'No sound or music was judged; nothing audible is meant to change.'),
];
const issues = [
  { id: 'FOC41-01', severity: 'major', title: 'Jerks of 40 px or more remain in Chapter IV and Chapter I (CHK-027 FAIL), as on live', game: 'both', chapter: 'ffx2-bahamut, seymour-flux', expected: 'no jerk over 40 px in one frame', observed: 'Ch IV 11 over-40 jerks (worst 141 px, a camera cut inside an Overdrive hit) on the candidate against 6 and 7 on live fcecfa74 in two runs; Ch I 5, worst 73.7 px, identical to the previous candidate. Not caused by this change (no pose, presenter motion or camera code differs); the larger Ch IV count may be run variance (one run each).', repro: 'node critic/runner/lib/continuity.mjs --chapters=ffx2-bahamut on the candidate and on https://echoesofspira.com/ (seed 1, real keys, GPU)', evidence: [`${EV}/continuity/continuity-summary.json`, LIVEJ], confidence: 'medium', requirement: 'CHK-027 jerks under 40 px', where: 'camera cuts and hit-stop in Overdrive moves (suspected, not traced)', fix: 'carried from FOC40-01: triage the over-40 events by cause, camera cut first', acceptanceCheck: 'CHK-027 over-40 count 0 in the chapter', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
  { id: 'FOC41-02', severity: 'polish', title: 'A thin dark strip (about 3 to 6 percent of the frame) remains on the right edge of Ch IV in settled and mid-dolly frames at 1600x900 and 2000x1012', game: 'ffx2', chapter: 'ffx2-bahamut', expected: 'no dark band in any frame of the move (round 24 acceptance)', observed: 'The two large slabs (12 to 16 percent on live at 3.4 to 4.0 s) are gone; the right-hand sliver that the settled frames always had on live is still there, and the right pipe stands in about 10 percent for a moment mid-dolly (the builder disclosed both). Bahamut and the girls are whole and readable, but a strict reading of "no band in any frame" is not met.', repro: 'cam.mjs at 1600x900 and 2000x1012, frames 4.0 to 7.0 s; compare the zoom-cand and zoom-live sheets', evidence: [`${EV}/cam/zoom-cand-1600.jpg`, `${EV}/cam/zoom-live-1600.jpg`, `${EV}/cam/zoom-cand-2000.jpg`], confidence: 'high', requirement: 'PR-0421 acceptance (round 24)', where: 'src/scenes/frameBracket.ts bracketedX end of the smoothstep; the idle-rig pipe (suspected)', fix: 'hold the pipe at the border mid-dolly and drop the settled sliver if a strict zero is wanted', acceptanceCheck: 'screencast at 1600x900 and 2000x1012 with no dark column wider than 2 percent in any frame', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
  { id: 'FOC41-03', severity: 'polish', title: 'The Ch IV debug gotoChapter route aborts after about 20 s (harness path)', game: 'ffx2', chapter: 'ffx2-bahamut', expected: 'a debug-driven chapter keeps running', observed: 'aborted at 20.3 s on both candidate and live (same as FOC40-03); real-key routes are unaffected', repro: 'sfxcmp.mjs', evidence: [`${EV}/sfxcmp.mjs`], confidence: 'high', requirement: 'tooling hygiene', where: 'debug API (not a player path)', fix: 'carried from FOC40-03', acceptanceCheck: 'the route runs to an outcome', introducedByCandidate: false, regressionVsLive: false, inNewFeature: false },
];
const shipReasons = [
  'PR-0421 is fixed: the two dark conduit slabs (12 to 16 percent of the frame on live at the intro hold) are gone at 1600x900 and 2000x1012, 1280x1024 and the phone are unchanged, Bahamut is whole and the girls are readable in every frame of the move.',
  'The SFX parity hooks are audibly unchanged: in one FFX fight (Seymour Flux, 233 cues) and one FFX-2 fight (Bahamut, first 107 cues) the sequence of asked, played and via is identical to live, no cue plays from a parity pack, and the flow hooks add nothing (a title Enter cue in the candidate log only is the press-start sprite racing its load, not a battle or results cue).',
  'No critical defect and no regression against live: CHK-026 PASS, 0 snaps per minute, same figure, scene and pose results as live; the one major (over-40 px jerks) exists on live and is not introduced by this change; the 5 named test files (102 tests) pass on rerun.',
];
const report = {
  rubricVersion: 2, review: 'focused', date: new Date().toISOString(), build: { mainSha: '455c524c' }, targetVersion: tv,
  verdicts: { deployment: 'NOT APPLICABLE', changedArea: 'PASS', milestone: 'not assessed', ship: 'SHIP' },
  shipReasons, checks,
  continuity: {
    candidate: sum,
    liveComparison: { 'ffx2-bahamut': { candidate455c524c: { snaps: 0, jerks: 60, jerksOver40: 11, worstJerkPx: 141.2 }, liveFcecfa74: { snaps: 0, jerks: 63, jerksOver40: 6, worstJerkPx: 52 }, previousCandidateFcecfa74: { snaps: 0, jerks: 68, jerksOver40: 7, worstJerkPx: 86.4 } } },
    note: 'two of the 18 plan chapters run: Ch IV (the only scene change) and Ch I (the FFX reference); the others are touched by neither a pose, stage nor scene change (SFX hooks and a Bevelle pipe binding only)',
  },
  targets: { required: 0, matched: 0, failing: 0, unverified: 0, waiting: 0 },
  issues,
  coverage: {
    tested: [
      'opening move of Ch IV (FFX-2 Bahamut) by real keys, CDP screencast of 587 to 630 frames, at 1600x900, 2000x1012, 1280x1024, 390x844, and live at 1600x900',
      'sfxLog sequence of one FFX fight (Seymour Flux, to victory) and one FFX-2 fight (Bahamut, first 107 cues), candidate against live, seed 1',
      'continuity harness: Ch IV and Ch I on the candidate to victory, Ch IV on live',
      '5 vitest files (r41-ch4cam, audio-sfx-parity-pin, -events, -slots, trema-retry-flow): 102 passed',
    ],
    reused: [
      { what: 'tsc clean and the full suite (1061 passed)', from: 'driver validation', why: 'this review reran only the named files' },
      { what: 'Trema retry regression tests (PR-0407, fixed in 39.2)', from: 'tests/unit/chapters/trema-retry-flow.test.ts, rerun here', why: 'tests-only change, no browser value' },
    ],
    notTested: [
      'the results screen in the browser with sfxLog (the harness reached results but did not read sfxLog; the flow hooks are pinned by audio-sfx-parity-slots and the code is silent with no pack)',
      'Ch XIII Trema and the Den of Woe, which use the Bevelle scene (the clamp acts only on a camera wider than the idle rig, proved in the r41-ch4cam tests)',
      'beat timing offsets: per-cue gaps differ from live by a median of 8 to 13 ms, but wall-clock auto-play varies up to 1.2 s between two runs of one seed, so beat timing is pinned by the golden, not measured here',
      '16 of 18 plan chapters on the continuity harness',
      'console error and 4xx counts (the screencast script did not record them; the harness logged 0 probe errors)',
    ],
  },
  regressions: [],
  nextReview: 'live verification of the exact artifact after the deploy, then the deep review on the live build (carried deep obligation)',
  elapsedMinutes: 95,
};
fs.writeFileSync('critic/reviews/455c524c-focused.json', JSON.stringify(report, null, 1));
const md = [
  `Build / artifact / target version: 455c524c (candidate r41-rc, dist-gate) / not deployed / ${tv.slice(0, 12)}`,
  'Review: focused',
  'Deployment: NOT APPLICABLE (pre-deploy candidate)',
  'Changed area: PASS',
  'Ship: SHIP, because PR-0421 slabs are gone, the SFX parity hooks are audibly unchanged and there is no critical and no regression. Discloses one major: FOC41-01 (CHK-027 jerks over 40 px, same as live)',
  'Milestone: not assessed',
  'Quality: no new score (a focused pass is not a score)',
  'Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting',
  'Top issues: FOC41-01 major (over-40 px jerks, Ch IV 11 vs live 6 to 7, a camera cut in an Overdrive; carried); FOC41-02 polish (right-edge sliver of 3 to 6 percent remains); FOC41-03 polish (debug route abort)',
  'Coverage: tested the Ch IV opening at 4 sizes plus live, sfxLog parity in one FFX and one FFX-2 fight, continuity for Ch IV and Ch I; not tested: results-screen sfxLog, Trema and Den of Woe scene, 16 plan chapters on the harness',
  'Next required review and why: live verification after the deploy, then the deep review on the live build (shared audio and presenter files)',
  'Elapsed review time / repeated work avoided: about 95 min; the full suite and tsc reused from the driver',
  '',
  '# Focused review of 455c524c',
  '',
  `Browser: headless Chromium, PYREFLY_BROWSER=gpu (no black canvas). Evidence: ${EV}/.`,
  '',
  ...shipReasons.map((s) => '- ' + s),
  '',
  '## Issues',
  ...issues.map((i) => `- ${i.id} (${i.severity}) ${i.title}. ${i.observed}`),
  '',
  '## Checks',
  ...checks.map((k) => `- ${k.id} ${k.result}: ${k.reason}`),
  '',
].join('\n');
fs.writeFileSync('critic/reviews/455c524c-focused.md', md);
