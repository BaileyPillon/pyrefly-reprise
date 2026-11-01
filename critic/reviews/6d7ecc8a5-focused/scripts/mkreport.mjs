import fs from 'node:fs';
import crypto from 'node:crypto';
const R='D:/pyrefly-release55/critic/reviews/';
const prev=JSON.parse(fs.readFileSync(R+'0804dc482-focused.json','utf8'));
const ev=(n)=>`critic/reviews/6d7ecc8a5-focused/${n}`;
const chk=(id,result,reason,game,chapter,state,evidence,mode='automated',minutes=2)=>({id,result,reason,game,chapter,state,evidence,mode,mandatory:false,minutes});
const checks=[
 chk('CHK-017','PASS','node tools/dist-local-paths.mjs --dir dist-gate reports 0 hits (no local path, no claude.ai link, no sidecar key outside the list in 1367 text files); index.html of the served candidate names index-BqgCyT8R.js, the expected bundle; the bundle loads with 0 console errors, 0 4xx, 0 failed requests. (Process note: an early mis-typed --help call re-ran the candidate build and was cut off, leaving dist-gate part-built; it was rebuilt with the same pinned tool, the same bundle name came out, the privacy gate read 0 hits, and the smoke below was run on that clean build.)','both','n/a','served candidate',[ev('serve.log')]),
 chk('CHK-015','PASS','Chapter I (seymour-flux) from the real title by real keys to the first menu, one Attack by Enter, three more turns, 0 console errors, 59.8 fps.','FFX only','seymour-flux','first menu + 4 turns',[ev('play/c1-1600.json'),ev('play/c1-1600-01-menu.png')],'automated',3),
 chk('CHK-016','PASS','Screen asserted battle with awaitingMenu true before each capture; Chapter III (braskas-final-aeon) first menu read in the screenshot (Auron menu, party panel, Braska\'s Final Aeon), 0 console errors, 59.7 fps.','FFX only','braskas-final-aeon','first menu + 4 turns',[ev('play/c3-1600.json'),ev('play/c3-1600-01-menu.png')],'automated',3),
 chk('CHK-020','PASS','Game case: FFX only for the reason text (Chapter III hold, research: FFX Braska fight), both games for the guard test (tests/unit/hold-reasons-no-local-paths.test.ts, 4 tests pass). The hold reason is never displayed. FFX-2 absence: no FFX-2 file changed.','both','n/a','diff 0804dc482..6d7ecc8a5: PieceHolds.ts (1 line) + the guard test',[ev('scripts/mkreport.mjs')],'automated',1),
 chk('CHK-022','PASS','__pyrefly.treated() on the candidate lists the same 15 chapters and the same held pieces as 0804dc482 (compared as JSON; Chapter III holds breath, moments, real); running chapter reached in both smokes.','both','seymour-flux, braskas-final-aeon','first menu',[ev('play/c1-1600.json'),ev('play/c3-1600.json'),'critic/reviews/0804dc482-focused/play/p-sin-face-1600.json'],'automated',1),
 chk('CHK-026','NOT APPLICABLE','Delta is one hold-reason string that is never displayed and a test: no pose, stage, scene, figure or painting code changed; the continuity runs of 0804dc482 apply by reference.','both','n/a','n/a',[]),
 chk('CHK-027','NOT APPLICABLE','Same: no motion code changed (the string is only text in a hold row); 0804dc482 CHK-027 results carried by reference.','both','n/a','n/a',[]),
];
const r={...prev,review:'focused',date:new Date().toISOString(),build:{mainSha:'6d7ecc8a5',bundle:'index-BqgCyT8R.js'},
 targetVersion:crypto.createHash('sha256').update(fs.readFileSync('D:/pyrefly-release55/docs/target/targets.json')).digest('hex'),
 verdicts:{deployment:'NOT APPLICABLE',changedArea:'PASS',milestone:'not assessed',ship:'SHIP'},
 shipReasons:['The delta over the reviewed 0804dc482 (SHIP) is one hold-reason string with no local path plus a guard test; the build privacy gate now reads 0 hits and the bundle loads.','Chapters I and III reach the first menu by real keys with 0 console errors; treated() lists the same 15 chapters and holds as 0804dc482.','No new critical or major issue; the findings of the 0804dc482, 4c01379d4 and 10b426248 reports are carried by reference (R71-C4 and R71-C5 polish, disclosed).'],
 checks,staticChecks:prev.staticChecks,issues:prev.issues,regressions:[],
 coverage:{tested:['dist-gate privacy gate (0 hits) and bundle name','Chapter I and Chapter III by real keys to the first menu plus 4 turns at 1600x900, PYREFLY_BROWSER=gpu headless Chromium','treated() list and holds compared with 0804dc482','guard test hold-reasons-no-local-paths (4 pass)'],reused:[{what:'continuity CHK-026/027 results, targets, 2000x1012 layout, XVIII, VIII and Mirror Aeons runs',from:'critic/reviews/0804dc482-focused.json (and 4c01379d4, 10b426248 reports)',why:'the delta changes no code that runs: a text string and a test'}],notTested:['2000x1012 and 390x844 layouts (no layout change in the delta)','continuity harness (no motion or presenter change)']},
 nextReview:'Deep review on the live build (owed).',elapsedMinutes:25};
delete r.continuityExtra; r.continuity=prev.continuity;
fs.writeFileSync(R+'6d7ecc8a5-focused.json',JSON.stringify(r,null,1));
const md=`Build / artifact / target version: 6d7ecc8a5, bundle index-BqgCyT8R.js, targets ${r.targetVersion.slice(0,12)}
Review: focused (delta over 0804dc482)
Deployment: NOT APPLICABLE
Changed area: PASS (privacy gate 0 hits, bundle loads, Chapters I and III play to the first menu, same 15 treated chapters and holds)
Ship: SHIP. The only change is a hold-reason string and a guard test; no new critical or major. Disclosed: R71-C4 (XVI, polish), R71-C5 (head-size reads equal to live, polish), carried by reference.
Milestone: not assessed
Quality: not scored (focused review)
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: none critical or major
Coverage: see JSON
Next required review and why: Deep review on the live build (owed).
Elapsed review time / repeated work avoided: about 25 minutes; the 0804dc482, 4c01379d4 and 10b426248 reports reused by reference

Browser: PYREFLY_BROWSER=gpu headless Chromium from node scripts under the RIG-RECORD lock. Server on port 5881 (pid 21792) stopped by PID, port confirmed closed. fps 59.8 and 59.7.
Process note: a mis-typed \`candidate-build.mjs --help\` re-ran the candidate build and was cut short by a pipe, leaving dist-gate part-built (unredacted art sidecars). It was rebuilt with the same pinned tool (tools/candidate-build.mjs --out dist-gate): bundle index-BqgCyT8R.js again, privacy gate 0 hits in 1367 files. All evidence is from the rebuilt folder.
`;
fs.writeFileSync(R+'6d7ecc8a5-focused.md',md);
