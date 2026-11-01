import fs from 'node:fs';
const c = JSON.parse(fs.readFileSync('critic/reviews/e3f51bf18-live/static/pose-census.json','utf8'));
const totals = c.totals ?? c;
const r = {
 rubricVersion: 2, review: 'live', date: new Date().toISOString(),
 build: { mainSha: 'e3f51bf18', bundle: 'UNVtEttT', artifactHash: '5720fa8287425ebb9f9b1575590436bf66d7a245d686bca9c6471beab55d1fe4' },
 verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
 checks: [
  { id: 'CHK-017', result: 'PASS', mandatory: true, evidence: 'node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/e3f51bf18.json --url https://echoesofspira.com/ --changed-from critic/artifacts/6321b2578.json --full -> result PASS, artifactHash 5720fa82...1d4, liveManifest match, checked 7169, mismatched [], missing [], wrongType [], errors []', reason: 'Every listed file byte-identical with the right content type; index.html and press/index.html differ only by the Cloudflare Web Analytics beacon.' },
  { id: 'CHK-016', result: 'PASS', mandatory: true, evidence: 'Headless Playwright (PYREFLY_BROWSER=gpu), 1600x900, fresh contexts, cache-busted URL, real keys. Bundle UNVtEttT confirmed in page scripts. Screen and selectedId asserted before each step. FFX seymour-flux, yunalesca and FFX-2 ffx2-trema, ffx2-den-of-woe each reached a player turn on the battle screen; sub-list opened, Escape cancelled to the command menu, action confirmed (action-start in log); on Ch I Attack cursor on seymour-flux, cancel, confirm; P and Escape pause/resume, H hide/restore; prerendered music fetched (36 audio requests, title.mp3 etc). 0 console errors, 0 404s, 0 responses >= 400 in every run.', reason: 'One reused assertion failed on Ch I ("0 coach cards at first menu"): 1 coach card (G GUIDE / NEXT BEST MOVE) shows, same stale expectation noted in the r69 review (LV-1); not a build defect. Booth visuals and F1 ribbon name were seen only as present (ribbon count 1 on Ch I and Yunalesca), no screenshot judgement of the treatment.' },
  { id: 'CHK-024', result: 'PASS', mandatory: false, evidence: 'Master volume lowered 80 to 60 through pause options with real ArrowLeft, page reloaded, boot ready, save:v1 masterVolume read back 0.6 (progress via battle actions on Ch I).', reason: 'Lightweight only; full upgrade matrix not run.' }
 ],
 staticChecks: { 'pose-census': totals },
 coverage: {
  tested: ['full exact artifact, 7169 files (--full)', 'title to chapter select to player turn: FFX Ch I seymour-flux, FFX Ch II yunalesca, FFX-2 ffx2-trema, FFX-2 ffx2-den-of-woe', 'sub-list, cancel and confirmed action on Yunalesca, Trema, Den of Woe; Attack cursor/cancel/confirm on Ch I', 'P and Escape pause/resume, H hide/restore', 'prerendered music fetch', 'settings reload persistence', 'pose census'],
  reused: ['release 69 smoke script, adapted (bundle name, chapter list)'],
  notTested: ['full CHK-024 upgrade matrix', 'booth treatment visuals and per-chapter holds judged by eye', 'chapters III, VII, X, XIV and FFX-2 XIII/XV beyond Trema and Den of Woe (Braska, Seymour/Anima, Natus, Isaaru not entered)', 'stageFreeze form-change guard', 'win/loss/retry paths', 'phone viewport']
 },
 consoleErrors: 0, notFound: 0, elapsedMinutes: 30,
 notes: 'LV-1 informational: Ch I coach-card count assertion is stale. Deep review remains owed.'
};
fs.writeFileSync('critic/reviews/e3f51bf18-live.json', JSON.stringify(r,null,2));
fs.writeFileSync('critic/reviews/e3f51bf18-live.md', `Build / artifact / target version: e3f51bf18 / bundle UNVtEttT / artifactHash ${r.build.artifactHash}
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: not assessed here (the focused report e3f51bf18-focused.json carries SHIP)
Milestone: not assessed
Quality: not rescored; last full score stands from its original build
Targets: not assessed in this live pass
Top issues: LV-1 informational, stale Ch I coach-card assertion in the reused script (1 coach card visible); no build defect found
Coverage: tested - exact artifact 7169 files, Ch I, Yunalesca, Trema, Den of Woe real-input smoke, pause/H, music, reload; reused - r69 script; not tested - full CHK-024 matrix, treatment visuals by eye, Braska/Seymour-Anima/Natus/Isaaru, stageFreeze guard, phone
Next required review and why: deep review on the live build (still owed from e3f51bf18)
Elapsed review time / repeated work avoided: about 30 minutes (17 of them the --full byte comparison); smoke script reused from r69

## CHK-017 PASS
verify-live --full: PASS, 7169 files checked, none mismatched, missing, wrong type. Manifest hash matches.
## CHK-016 PASS
Real keys, 1600x900, GPU mode headless Chromium. Four chapters reached a player turn; cancel and confirm paths and pause/H exercised; 0 console errors, 0 404s.
## CHK-024 PASS (lightweight)
Master volume 80 to 60 survived reload.
## Static: pose census
Written to critic/reviews/e3f51bf18-live/static/pose-census.json (data, not a verdict).
`);
