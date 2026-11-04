import { writeFileSync, readFileSync } from 'node:fs';
const R = 'D:/pyrefly-release55/critic/reviews/';
const census = JSON.parse(readFileSync(R + '2342fe666-live/static/pose-census.json', 'utf8')).totals;
const j = {
  rubricVersion: 2, review: 'live', date: new Date().toISOString(),
  build: { mainSha: '2342fe666', bundle: 'eSs6-WR_', artifactHash: 'e0cb661928f6598d94db8930e4d6832a5c4c15bf83d37dcec6b57165d4ec8fdd' },
  verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
  checks: [
    { id: 'CHK-017', result: 'PASS', mandatory: true, evidence: 'verify-live --full against critic/artifacts/2342fe666.json (changed-from d5049f686): PASS, liveManifest match, 7265 files checked, 0 mismatched, 0 missing, 0 wrongType, 0 errors; artifactHash e0cb6619...8fdd; index.html and press/index.html identical once the Cloudflare analytics beacon is removed.', reason: 'full compare because the marker owes a deep review' },
    { id: 'CHK-016', result: 'PASS', mandatory: true, evidence: 'Headless Playwright (PYREFLY_BROWSER=gpu), fresh context, 1600x900, cache-busted live URL, real key presses; __pyrefly.build() read sha 2342fe66, index-eSs6-WR_.js. Each capture asserted the screen name first. Words keeper, infinito, yrp, waker each typed on chapter select opened party-prep and it held 1.5 s after the last letter; Escape (cancel) returned to chapter-select each time. keeper (FFX), yrp (FFX-2, 3D models: Bahamut and the three girls drawn as models, screenshot battle-yrp.png) and waker (FFX-2) each reached a player command menu. Phone tier (812x375 touch, coarse pointer): yrp and waker typed opened nothing and stayed on chapter-select; keeper opened party-prep. Keeper battle: the first press takes the start banner down, P opened pause, H hid the panels (save setting pausePanelsHidden true, bare class set) and restored them (false), P resumed to battle, P then Escape closed the pause to battle; at the command menu Escape is the menu back button by design (canPauseOnCancel), so Escape opening pause was not reachable there and is not claimed. A real Attack ran (turn 1). Music: prerendered mp3 fetched (title, chapter-select, scene, boss-challenge for keeper, boss-bahamut for yrp, boss-ffx2-fallen-aeons for waker; 20 to 39 audio requests) and audioDebug().playing named those tracks, not the procedural fallback. Not exercised on live: Lulu head hold, revive cross, XII Sensor steer, XVII fins HUD (focused review carried them as R74-4 unread).', reason: 'intended screens asserted before each capture; positive and cancel paths run' },
    { id: 'CHK-024', result: 'PASS', mandatory: true, evidence: 'Set the pause-panels-hidden setting (H) in the keeper battle, played the chapter to its results screen (advisor line, defeat, turn 25), reloaded: settings.pausePanelsHidden stayed true, SaveData.chapters unchanged and equal. Hidden chapters never write to SaveData.chapters by design, so no chapter progress exists to carry; lightweight pass only.', reason: 'one setting survived a reload; chapter progress not creatable through a hidden chapter' },
  ],
  staticChecks: { 'pose-census': census },
  coverage: {
    tested: ['exact artifact, full compare', 'four hidden words open their chapters on live', 'keeper, yrp (3D), waker reach a command menu on live', 'phone tier refuses yrp and waker, opens keeper', 'P, H, resume, P then Escape', 'prerendered music', 'setting survives reload', 'pose census'],
    reused: ['focused review 2342fe666-focused (Lulu head, revive, XII, XVII, continuity)'],
    notTested: ['full CHK-024 upgrade matrix', 'Escape opening pause from a command menu (back button by design)', 'Lulu head hold, revive cross, XII Sensor steer, XVII fins HUD on live', 'infinito, a battle on live (word and party-prep only)', 'Maesters and phone-tier battle play'],
  },
  issues: [
    { id: 'L74-1', severity: 'minor', summary: 'The live game requests art/characters/spectral-keeper/idle.png twice and gets 404 (2 console errors, 2 not-found). The file is in neither public/art nor the manifest; the Keeper chapter handoff names the boss as a silhouette placeholder, so the stage falls back and the battle plays. Same bytes as the candidate, not a deployment mismatch; the painted Keeper is owed.', introducedByCandidate: true, regressionVsLive: false },
    { id: 'L74-2', severity: 'observation', summary: 'The advisor line (autoBattle intended, fast speed, started after pausing and a menu back) lost the Spectral Keeper at turn 25 on one seed. Data only, not a verdict.' },
  ],
  consoleErrors: 2, notFound: 2, elapsedMinutes: 55,
};
writeFileSync(R + '2342fe666-live.json', JSON.stringify(j, null, 1));
const md = `Build / artifact / target version: 2342fe666, bundle index-eSs6-WR_.js, artifactHash e0cb6619...8fdd
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (live verification)
Milestone: not assessed
Quality: not scored (live verification)
Targets: not assessed
Top issues: L74-1 minor (404 for the Spectral Keeper's idle painting, a known placeholder), L74-2 observation
Coverage: see JSON
Next required review and why: deep review on the live build (owed)
Elapsed review time / repeated work avoided: about 55 minutes (the full byte compare of 7265 files took most of it); focused report reused

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts (smoke.mjs, smoke2.mjs, smoke3.mjs in 2342fe666-live/); no Claude-in-Chrome or built-in pane.
Case: Lulu head (FFX), revive cross (both), XII, XVII (FFX), keeper (FFX), infinito, yrp, waker (FFX-2).

## Step 1 Exact artifact
verify-live --full: PASS, 7265 files, no mismatch, no missing, no wrong type. Pages identical to the artifact minus the Cloudflare analytics beacon.

## Step 2 Smoke
See CHK-016 in the JSON. All four words open on live; yrp's 3D models load on live (desktop); the phone tier refuses yrp and waker. Pause, H, resume and cancel work; prerendered music plays. Console errors 2 and 404s 2, both the same missing keeper painting (L74-1).

## Step 3 Reload
A setting survived a reload; hidden chapters write no progress. Full upgrade matrix not tested.

## Step 3b Pose census (data)
${JSON.stringify(census)}

## Not tested
Lulu head, revive cross, XII Sensor steer and XVII HUD on live (the focused review carried them as unread); Escape opening pause from a command menu; battle play on infinito.
`;
writeFileSync(R + '2342fe666-live.md', md);
