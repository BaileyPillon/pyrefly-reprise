import fs from 'node:fs';
const census = JSON.parse(fs.readFileSync('critic/reviews/2a9340249-live/static/pose-census.json','utf8')).totals;
const j = {
 rubricVersion: 2, review: 'live', date: new Date().toISOString(),
 build: { mainSha: '2a9340249', bundle: 'CahDxk82', artifactHash: '865efda30b6915c0ee3794b7ed1126a531a7a51f48086f303927047aedb3c17d' },
 verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
 checks: [
  { id: 'CHK-017', result: 'PASS', mandatory: true, evidence: 'verify-live --manifest critic/artifacts/2a9340249.json --full (deep review owed): live manifest matches, 7169 files checked, 0 mismatched, 0 missing, 0 wrong type, 0 errors; index.html and press/index.html identical once the Cloudflare analytics beacon is removed; _headers is host-read and not downloaded.', reason: '' },
  { id: 'CHK-016', result: 'PASS', mandatory: true, evidence: 'Headless Playwright (PYREFLY_BROWSER=gpu), fresh contexts 1600x900, cache-busting query, real key presses, no black canvas. Title -> chapter-select -> seymour-flux party-prep -> battle -> player turn (F1 HUD, no PAUSE button); Attack opened target cursor on seymour-flux, Escape returned to command menu, Enter confirmed. ffx2-bahamut -> battle -> player turn; Down/Enter opened a sub-list, Escape returned to command menu, confirmed action gave action-start in log. P opens pause, H hides and restores panels, Escape and P resume. Prerendered music fetched (38 audio requests, first /audio/music/title.mp3). Page bundle index-CahDxk82.js. Screenshots in critic/reviews/2a9340249-live/static/. Script .r68-live-smoke-tmp.mjs (from the release 67 smoke). One scripted assertion failed: "0 coach cards at first menu" (found 1) - the stale assertion already noted in the release 67 review; the G GUIDE / NEXT BEST MOVE card is shown by design, not a game defect.', reason: '' },
  { id: 'CHK-024', result: 'PASS', mandatory: false, evidence: 'Lightweight: MASTER VOLUME lowered 80 -> 60 with real ArrowLeft in the pause options, page.reload(), app re-booted ready, masterVolume 0.6 survived.', reason: '' }
 ],
 staticChecks: { 'pose-census': census },
 coverage: {
  tested: ['exact artifact vs live (full, 7169 files)', 'title to chapter select', 'FFX Chapter I turn with Attack, cancel and confirm', 'FFX-2 Chapter IV sub-list, cancel and a confirmed action', 'pause/resume/H', 'music fetch', 'reload smoke with a changed setting', 'pose census'],
  reused: [],
  notTested: ['the FFX-2 ready hold, run-in lead, ATB bars, Trigger Happy and the 13-chapter pose continuity (?swapscope=wide) judged visually', 'the other chapters changed by pose continuity', 'phone layout / enemy-move line', 'Tab and Enter menu behaviour beyond Enter/Escape on two chapters', 'defeat card and retry', 'full CHK-024 upgrade matrix', 'audio heard (agents cannot hear)']
 },
 consoleErrors: 0, notFound: 0, elapsedMinutes: 30
};
fs.writeFileSync('critic/reviews/2a9340249-live.json', JSON.stringify(j, null, 2));
fs.writeFileSync('critic/reviews/2a9340249-live.md', `Build / artifact / target version: main 2a9340249, bundle CahDxk82, artifact ${j.build.artifactHash} (release 68)
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (focused report critic/reviews/2a9340249-focused.json is SHIP; the deep review is owed)
Ship: not applicable to a live review
Milestone: not assessed
Quality: not rescored (last full score unchanged)
Targets: not assessed
Top issues: none found by this pass (the scripted assertion "0 coach cards at first menu" is stale: the G GUIDE / NEXT BEST MOVE card is shown by design)
Coverage: tested full exact artifact (7169 files), title to chapter select, FFX Chapter I (seymour-flux) player turn with Attack, cancel and confirm, FFX-2 Chapter IV (ffx2-bahamut) sub-list, cancel and confirmed action, P/Escape pause and resume, H hide/restore, music fetch, reload smoke, pose census; not tested visual judgement of the pose continuity, ready hold and run-in, phone layout, defeat card, full upgrade matrix
Next required review and why: deep review on this live build (owed, carried from 2a9340249)
Elapsed review time / repeated work avoided: about 30 minutes (the full file comparison took most of it); reused the release 67 smoke script

Details are in the JSON beside this file. Browser mode: headless Playwright, PYREFLY_BROWSER=gpu, no black canvas. Console errors 0, 404s 0, other 4xx 0.
Pose census (data, not a verdict): ${JSON.stringify(census)}
`);
