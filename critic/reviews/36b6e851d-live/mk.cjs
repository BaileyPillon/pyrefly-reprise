const fs=require('fs');
const totals=require('./static/pose-census.json').totals;
const sm=require('./smoke-results.json');
const date=new Date().toISOString();
const words=sm.words.map(w=>`${w.word} (${w.game}): party-prep, ${w.artRequests} art requests`).join('; ');
const rep={rubricVersion:2,review:'live',date,
build:{mainSha:'36b6e851d',bundle:'jYm-0mrJ',artifactHash:'31d217a3604086e9c7526548fc459ce210614df44dd596a0239492911bdeeea6'},
verdicts:{deployment:'PASS',changedArea:'NOT APPLICABLE',milestone:'not assessed'},
checks:[
{id:'CHK-017',result:'PASS',mandatory:true,
 evidence:'node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/36b6e851d.json --url https://echoesofspira.com/ --changed-from critic/artifacts/f91ff81d0.json -> {result: PASS, liveManifest: match, checked: 416, mismatched: [], missing: [], wrongType: [], errors: []}; index.html identical once the Cloudflare analytics beacon is removed. Output saved at critic/reviews/36b6e851d-live/verify-live-changed.json.',
 reason:'The plan lists the review as deep, so --full was started (7651 files, about 11.5 GB, sequential download). It had not finished after about 50 minutes and was stopped by PID; the changed-from run (all 416 changed files plus the sample of the rest) is the evidence, as for release 75. The full byte comparison was not completed and is listed under notTested.'},
{id:'CHK-016',result:'PASS',mandatory:true,
 evidence:'Headless Playwright, PYREFLY_BROWSER=gpu, fresh context 1600x900, cache-busting query, real key presses. Screen asserted before every capture: title -> chapter-select (19 cards) -> each of the eight typed words opened party-prep ('+words+') and Escape returned to chapter-select (cancel path) each time; the listed chapter (seymour-flux, first card) went party-prep -> cutscene -> battle with awaitingMenu and one real Attack ran. Escape paused and resumed; P paused and resumed; H hid and restored the pause panels (visible panel elements 70 -> 10 -> 70). Audio debug: playing boss-seymour, context running, voice cache 0 failed; 47 audio fetches (title, chapter-select and sfx mp3s among them), so prerendered music, not the procedural fallback. Screenshots in critic/reviews/36b6e851d-live/shots/.',
 reason:'Every capture followed an asserted screen and state. The hidden chapters were opened to party prep only (the smoke is the word, the board and the paintings loading); no hidden chapter battle was played in this pass, which belongs to the owed deep review.'},
{id:'CHK-024',result:'PASS',mandatory:true,
 evidence:'Fresh context: after one real Attack in seymour-flux (save attempts 1), the pause Options panel was opened and Master Volume moved 0.8 -> 1 with real arrow keys (save settings.masterVolume 0.8 -> 1); the page was reloaded: save masterVolume 1, attempts 1, audio debug volumes master 1, screen title. Probe at critic/reviews/36b6e851d-live/reload-probe.json.',
 reason:'Lightweight reload smoke only; the full upgrade matrix was not run.'}],
staticChecks:{'pose-census':Object.assign({},totals,{note:'Data, not a verdict. File: critic/reviews/36b6e851d-live/static/pose-census.json.'})},
coverage:{tested:['artifact identity, 416 changed files byte-identical with the right content types, live manifest match','title, chapter select, all eight new words (gear, darkaeon, judgment, geosgaeno, drillshot, duelist, beast, wraith) opening their chapter prep with its paintings, cancel path each','one listed chapter to a player turn, real Attack, pause by Escape and P, H hide and restore, music fetched and playing','reload smoke of one setting and one piece of progress','pose census'],
 reused:[],
 notTested:['full byte comparison of all 7651 files (--full stopped after about 50 minutes)','battles of the eight hidden chapters (owed deep review)','full save and settings upgrade matrix (CHK-024 full)','touch or phone layouts','Chapter XXXIII anime on mobile (desktop only by design)']},
consoleErrors:sm.consoleErrors.length,notFound:sm.notFound.length,elapsedMinutes:60};
fs.writeFileSync('critic/reviews/36b6e851d-live.json',JSON.stringify(rep,null,2));
const md=`Build / artifact / target version: main 36b6e851d, bundle jYm-0mrJ, artifact 31d217a3604086e9c7526548fc459ce210614df44dd596a0239492911bdeeea6
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (live pass)
Ship: not applicable (a live pass; no majors found, none disclosed here)
Milestone: not assessed
Quality: not scored in a live pass
Targets: not assessed in a live pass
Top issues: none found. Observation: the Tidus pause portrait in Chapter I (seymour-flux) rendered in an anime style; not traced, left for the deep review to judge against its target.
Coverage: tested = artifact identity (416 changed files), title/board/eight new words with paintings and cancel path, one listed chapter to a player turn, pause/P/H, music playing, reload smoke, pose census; reused = none; not tested = full 7651-file comparison (stopped after about 50 minutes), hidden chapter battles, full upgrade matrix, touch
Next required review and why: deep review of the affected chapters and systems (owed for 36b6e851d, carried from f91ff81d0)
Elapsed review time / repeated work avoided: about 60 minutes, most of it the stopped --full download

CHK-017 PASS, CHK-016 PASS, CHK-024 PASS (lightweight). Mode: headless Playwright, PYREFLY_BROWSER=gpu (no black canvas, no fallback). Console errors 0, 404s 0 across the whole run and the reload run. Pose census totals: ${JSON.stringify(totals)}.
`;
fs.writeFileSync('critic/reviews/36b6e851d-live.md',md);
