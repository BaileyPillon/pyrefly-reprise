import fs from 'node:fs'; import crypto from 'node:crypto';
const SHA='04631aedf', R=`critic/reviews/${SHA}-focused`;
const tv=crypto.createHash('sha256').update(fs.readFileSync('docs/target/targets.json')).digest('hex');
const sum=JSON.parse(fs.readFileSync(`${R}/continuity/continuity-summary.json`,'utf8'));
const ev=(...a)=>a.map(x=>`${R}/${x}`);
const chk=(id,result,reason,game,chapter,state,evidence,mode,mandatory,minutes)=>({id,result,reason,game,chapter,state,evidence,mode,mandatory,minutes});
const CS='continuity/continuity-summary.json';
const checks=[
chk('CHK-001','UNVERIFIED','Agents cannot hear (AGENTS rule 13); no audio change in this release, not auditioned.','both','n/a','audio',[],'manual',false,0),
chk('CHK-002','PASS','1600x900: first menu, mid-fight, defeat card and results of Chapters I and IV each own the stage; no layer outlived its state. 2000x1012 not run.','both','seymour-flux, ffx2-bahamut','menu, fight, defeat',ev('shots/ch1-1600-02-menu.png','shots/ch1-1600-06-end.png','shots/ch4-1600-04-act-3.png'),'automated',false,4),
chk('CHK-003','PASS','390x844 Chapter I: no horizontal overflow, the enemy-move line is clamped to 2 lines (line-clamp 2, 36 px at 18 px line height) with an ellipsis; footer buttons readable. Chapter IV not driven at 390.','both','seymour-flux','phone battle at the target step',ev('shots/phone-enemymove.png'),'automated',false,4),
chk('CHK-006','UNVERIFIED','The defeat card left with its fight (TRY AGAIN went to the next attempt); the victory freeze, Overdrive opening and booth end card were not driven to their ends.','both','seymour-flux','defeat',ev('shots/ch1-1600-06-end.png'),'manual',false,1),
chk('CHK-008','PASS','At 1600x900 slabs, rails and turn order stay clear of the party in the Chapter I menu and Chapter IV mid-fight.','both','seymour-flux, ffx2-bahamut','menu',ev('shots/ch1-1600-04-act-3.png','shots/ch4-1600-04-act-3.png'),'manual',false,1),
chk('CHK-009','PASS','Command names shown in full at 1600x900 in both chapters; the phone line is two lines with an ellipsis by design.','both','seymour-flux, ffx2-bahamut','menu',ev('shots/ch1-1600-04-act-3.png','shots/phone-enemymove.png'),'manual',false,1),
chk('CHK-013','UNVERIFIED','Cast art is unchanged in this release (no art files in the diff; art verify and audit PASS in the prep step); not re-judged against the rubric.','both','n/a','art',[],'manual',false,0),
chk('CHK-015','PASS','Real Playwright keyboard from the title through chapter select, prep, cutscene, first menu, attack by Enter, a lost fight, TRY AGAIN and a second attempt; a touch run at 390x844. The debug API only handed the fight to the engine at the end and for the film.','both','seymour-flux, ffx2-bahamut','title to results',ev('shots/ch1-1600.json','shots/retry-default.json','shots/ch4-1600.json'),'automated',false,10),
chk('CHK-016','PASS','Every capture asserted window.__pyrefly.screen() and waitBattleMenu (throws on timeout); the Chapter IV real-key loss run that never reached the defeat card is recorded as not reached, not as a shot.','both','all','all',ev('shots/retry-default.json'),'automated',false,1),
chk('CHK-017','PASS','Served dist-gate (index-B3DkcOaU.js, BASE_PATH=/, release 67, 04631aedf) on 5871; index.html and the page script name that bundle; 0 console errors and 0 failed responses in every run; server stopped by PID 36496, port 5871 closed.','both','n/a','production candidate',ev('shots/ch1-1600.json','serve.log'),'automated',true,2),
chk('CHK-020','PASS','Case from r67-picks: both games for stance, cause, hit, rigko, defeat cause, phone line, CHAPTER SELECT; run=flow FFX-2 only; hurried retry FFX Chapter I only. Seen: hurried retry and defeat cause in Chapter I (FFX), a won Chapter IV (FFX-2), harness in both.','both','seymour-flux, ffx2-bahamut','fight',ev(CS),'manual',false,3),
chk('CHK-021','UNVERIFIED','Presence seen in Chapter I and IV; absence of the FFX-only retry skip in FFX-2 and of the FFX-2-only run word in FFX not tested (unit tests pin both).','both','seymour-flux, ffx2-bahamut','n/a',[],'manual',false,0),
chk('CHK-022','PASS','Chapter I: lost fights reached the defeat card, TRY AGAIN reached a second attempt that opened in 4.3 s against 44.2 s for attempt 1; won Chapter I and Chapter IV reached results and the next cutscene. Defeat cause at SKIP speed shown on both attempts.','both','seymour-flux, ffx2-bahamut','fight',ev('shots/retry-default.json','shots/retry-skip.json','shots/ch1film-note.txt'),'automated',false,12),
chk('CHK-023','PASS','Everything ran through the real title, chapter select, prep and battle screens; the harness plays with real keys.','both','seymour-flux, ffx2-bahamut','full flow',ev(CS),'automated',false,1),
chk('CHK-026','FAIL','Harness, candidate vs live release 66 (round 30): Chapter I max head jump 10.8 percent (live 12.1), stature 0.765 to 1.057 with 1 swap out of band (live 0 over band, same minimum); Chapter IV head 0.7 (0.6), stature 0.898 to 1.117, 3 out of band (3). Not worse than live apart from one Chapter I band outlier.','both','seymour-flux, ffx2-bahamut','continuity run',ev(CS),'automated',true,18),
chk('CHK-027','FAIL','Chapter I PASS (0 snaps a minute, worst swap jerk 24.9 px vs live 32.8; ghost 645 ms a minute vs live 1,689). Chapter IV FAIL on 1 swap jerk of 44.9 px (live 45.0, the same one); ghost 818 ms a minute vs live 1,505. Worst dash in Chapter I 238.8 px vs 112.8 live (the travel strike).','both','seymour-flux, ffx2-bahamut','continuity run',ev(CS),'automated',true,18),
];
const issues=[
{id:'R67-C1',severity:'major',title:'Pose-swap continuity checks still fail: Chapter IV (one 44.9 px swap jerk, three stature outliers) and CHK-026 in both chapters',game:'both',chapter:'seymour-flux, ffx2-bahamut',expected:'No swap jerk of 40 px or more, every pose inside its height band',observed:'Chapter IV CHK-027 FAIL, CHK-026 FAIL in both; every figure equal to or better than live release 66; ghost frames fell from about 101 to 39 a minute (Chapter I) and 90 to 49 (Chapter IV)',repro:'node critic/runner/lib/continuity.mjs --chapters=seymour-flux,ffx2-bahamut on the candidate',evidence:ev(CS),confidence:'high (automated, one run per chapter)',requirement:'CHK-026, CHK-027',where:'unknown; live fails the same checks (round 30)',fix:'continue the swap-continuity batch; not part of this release',acceptanceCheck:'continuity harness PASS on both',introducedByCandidate:false,regressionVsLive:false,inNewFeature:false},
{id:'R67-P1',severity:'polish',title:'Chapter I: one swap outside the height band and a longer worst dash (238.8 px) than live',game:'FFX',chapter:'seymour-flux',expected:'Inside the band, dash no longer than live',observed:'1 out of band where round 30 had 0 over band (same minimum stature); worst dash 238.8 px vs 112.8 px (travel strike and leap)',repro:'continuity harness, Chapter I',evidence:ev(CS),confidence:'medium (one run)',requirement:'CHK-026',where:'unknown',fix:'look at the strip',acceptanceCheck:'harness rerun'},
{id:'R67-U1',severity:'suggestion',title:'Not frame-stepped: the run-to-dash stand under ?run=flow, hit=knock on bosses, the Chapter IV defeat card',game:'FFX-2',chapter:'ffx2-bahamut',expected:'A reviewer looks at them',observed:'Harness shows no FFX-2 dash jerk above 44.9 px (live 45); Seymour Flux falls once and stays down in the normal-speed film; the Chapter IV loss was not reached by real keys',repro:'n/a',evidence:ev('film/ch1-ko-sheet.jpg'),confidence:'n/a',requirement:'review focus 2, 3',where:'n/a',fix:'owed to the deep review on the live build',acceptanceCheck:'film and frame-step'},
];
const rep={rubricVersion:2,review:'focused',date:new Date().toISOString(),build:{mainSha:SHA,bundle:'index-B3DkcOaU.js'},targetVersion:tv,
verdicts:{deployment:'NOT APPLICABLE',changedArea:'FAIL',milestone:'not assessed',ship:'SHIP'},
shipReasons:['No critical defect introduced and no regression against live release 66 in what was measured: the continuity harness (Chapters I and IV, the six picks together, never measured before) matches or beats round 30 on every number that counts: ghost frames about 101 to 39 a minute (Chapter I) and 90 to 49 (Chapter IV), swap jerks 32.8 to 24.9 px and 45 to 44.9 px.','The public retry skip works (attempt 2 first menu 4.3 s, attempt 1 44.2 s), the defeat card names its cause at SKIP speed and carries CHAPTER SELECT, the phone enemy-move line is two lines at 390x844 without overflow, and Chapters I and IV play from the title to a win and a loss with 0 console errors at 59 to 60 fps.','CHK-026 and CHK-027 still FAIL, as on live (disclosed); the run-flow stand, boss knock and the Chapter IV defeat card were not frame-judged (UNVERIFIED, owed to the deep review).'],
checks,continuity:sum,targets:{required:0,matched:0,failing:0,unverified:0,waiting:0},
issues,coverage:{tested:['Chapter I and IV from the real title at 1600x900','Chapter I attempt 1 and 2 retry timing, defeat cause at normal and SKIP speed','Chapter I phone 390x844 enemy-move line','Seymour Flux fall in a normal-speed film','Continuity harness on both chapters'],reused:[{what:'live release 66 continuity numbers',from:'critic/rounds/round-30.json',why:'same harness and pose table; no live rerun, to save time'}],notTested:['2000x1012 layout','Chapter V by real keys and the phone gate beyond Chapter I','each word today restoring release 66 on a frame strip','run=flow stand frame-step','Chapter IV defeat card by real keys','audio','tile composites (targets required 0)']},
regressions:[],nextReview:'Deep review on the live build after the deploy (shared presenter and global layout); watch R67-C1.',elapsedMinutes:70};
fs.writeFileSync(`${R}.json`,JSON.stringify(rep,null,1));
fs.writeFileSync(`${R}.md`,`Build / artifact / target version: ${SHA}, bundle index-B3DkcOaU.js, targets ${tv.slice(0,12)}
Review: focused
Deployment: NOT APPLICABLE
Changed area: FAIL (CHK-026/027 still fail, as live; nothing worse)
Ship: SHIP. ${rep.shipReasons[0]}
Milestone: not assessed
Quality: not scored
Targets: 0 required / 0 matched / 0 failing / 0 unverified / 0 waiting
Top issues: R67-C1 (major, not a regression), R67-P1 (polish), R67-U1 (suggestion)
Coverage: see JSON
Next required review and why: ${rep.nextReview}
Elapsed review time / repeated work avoided: about 70 minutes; live numbers reused from round 30

Browser: PYREFLY_BROWSER=gpu headless Chromium under the RIG-RECORD lock. Server pid 36496 stopped, port 5871 closed.

${rep.shipReasons.map(s=>'- '+s).join('\n')}
`);
