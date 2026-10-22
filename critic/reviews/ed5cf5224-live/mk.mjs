import { readFileSync, writeFileSync } from 'node:fs';
const census = JSON.parse(readFileSync('D:/pyrefly-release55/critic/reviews/ed5cf5224-live/static/pose-census.json', 'utf8')).totals;
const H = '9f4328beca5399efd1921c1ef5c2f782b0dff0b1d5840a318208a975691685a4';
const rep = {
  rubricVersion: 2, review: 'live', date: new Date().toISOString().replace(/\.\d+Z$/, 'Z'),
  build: { mainSha: 'ed5cf5224', bundle: 'IvYB9JEE', artifactHash: H },
  verdicts: { deployment: 'PASS', changedArea: 'NOT APPLICABLE', milestone: 'not assessed' },
  checks: [
    { id: 'CHK-017', result: 'PASS', mandatory: true, evidence: `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/ed5cf5224.json --url https://echoesofspira.com/ --changed-from critic/artifacts/5fae4e2bd.json --full -> {result: PASS, artifactHash: ${H}, liveManifest: match, checked: 5689, mismatched: [], missing: [], wrongType: [], errors: []}; index.html identical once Cloudflare's Web Analytics beacon is removed.` },
    { id: 'CHK-016', result: 'PASS', mandatory: true, evidence: 'Headless Playwright (PYREFLY_BROWSER=gpu), 1600x900, fresh context, cache-busted URL (critic/reviews/ed5cf5224-live/smoke.mjs, smoke-result.json, shots/). Bundle served: index-IvYB9JEE.js. Screen names asserted before each step: title -> chapter-select -> party-prep -> battle for seymour-flux (FFX Chapter VII, FFX command menu present) and for the hidden ffx2-valefor-besaid (word v-a-l-e-f-o-r typed with real key presses on chapter select; snapshot chapter=ffx2-valefor-besaid at party prep; FFX-2 HUD present). Flux: White Magic submenu (Haste, Hastega, Slow) opened; cancel path Escape returned to the top menu; positive path Slow with targeting selection ids=[seymour-flux] -> battle log miss reason=immune on seymour-flux and the HUD drew a dnum--immune numeral IMMUNE, 0 MISS numerals. Valefor chapter: rigs() switch on, valefor rig ON (gate ok, 8 parts, 24 bones, 6 keys) before and at the KO; real-key Attack turns, then (declared injection) autoBattle(intended)+battle:fast reached the Valefor KO event in about 100 s. Pause: P opens and Escape resumes mid-fight on Flux and on Valefor; H hides then restores the pause panels. Music: prerendered mp3 fetched (title, chapter-select, boss-seymour, pause, boss-ffx2-fallen-aeons, victory/defeat) and audioDebug playing=boss-seymour, not the synth fallback. 0 console errors, 0 responses with 404 or any status >=400 for the whole run.' },
    { id: 'CHK-024', result: 'PASS', mandatory: false, evidence: 'Lightweight reload smoke: lowered MASTER VOLUME 80 -> 60 with real ArrowLeft in the pause OPTIONS tab; save pyrefly-reprise:save:v1 held masterVolume 0.6; after reload __pyreflyReady and masterVolume 0.6 read back, save keys unchanged (version, updatedAt, chapters, unlocked, settings, seenCoach, flags).', reason: 'The full upgrade matrix is not part of this pass. No chapter progress was made before the reload (the Flux fight ended in a defeat from passive play), so progress persistence was not separately asserted.' }
  ],
  staticChecks: { 'pose-census': { ...census, note: 'tools/pose-gate.mjs --report from D:/pyrefly-release55 (public/art present); data, not a verdict' } },
  coverage: {
    tested: ['artifact identity, 5689 files, --full, changed-from 5fae4e2bd', 'title -> chapter-select -> party-prep -> battle on FFX Seymour Flux with real keys', 'Slow on Seymour Flux: engine miss/immune and HUD IMMUNE numeral, plus the Escape cancel path out of White Magic', 'hidden FFX-2 Valefor chapter via typed door word, Valefor rig ON before and at KO, Valefor fought through its KO', 'P / Escape pause and resume, H hide and restore', 'prerendered music fetched and playing', 'masterVolume reload persistence', 'console error and 404 sweep (0 / 0)', 'pose census (static)'],
    reused: [],
    notTested: ['full CHK-024 upgrade matrix', 'Kimahri and Lulu rigs (only the Valefor rig entry was asserted)', 'the Valefor KO leg used a declared autoBattle(intended)+battle:fast injection after about 60 s of real-key Attack turns, because the fight is long', 'pause after the KO (the battle had already moved to the results screen; not a defect)', 'visual quality of the rig animation (deep review obligation)', 'FFX-2 IMMUNE numeral (not changed by this release)']
  },
  consoleErrors: 0, notFound: 0, elapsedMinutes: 32
};
writeFileSync('D:/pyrefly-release55/critic/reviews/ed5cf5224-live.json', JSON.stringify(rep, null, 2));
const md = [
  '```text',
  `Build / artifact / target version: main ed5cf5224 / bundle IvYB9JEE / artifactHash ${H}`,
  'Review: live',
  'Deployment: PASS',
  'Changed area: NOT APPLICABLE',
  'Ship: N/A (live review does not gate ship)',
  'Milestone: not assessed',
  'Quality: not assessed (live review does not recompute the milestone score)',
  'Targets: not assessed',
  'Top issues: none found by this pass',
  'Coverage: tested = exact artifact (5689 files, --full), Flux Slow shows IMMUNE not MISS with real keys (positive and cancel path), hidden Valefor chapter by typed word with the rig on through the KO, pause/H/resume, prerendered music, reload persistence, 0 console errors, 0 404s, pose census; reused = none; not tested = full CHK-024 matrix, Kimahri/Lulu rig visuals, the KO leg used a declared autoBattle injection after ~60 s of real-key turns',
  'Next required review and why: the deep review this build still owes (carriedDeep ed5cf5224)',
  'Elapsed review time / repeated work avoided: about 32 minutes (the smoke script needed four selector and id corrections); no earlier evidence reused',
  '```',
  '',
  '## Step 1: exact artifact (CHK-017) - PASS',
  'verify-live --full against critic/artifacts/ed5cf5224.json, changed-from 5fae4e2bd: PASS, liveManifest match, 5689 files checked, none mismatched, missing or wrong type.',
  '',
  '## Step 2: real-input smoke (CHK-016) - PASS',
  'Headless Playwright, PYREFLY_BROWSER=gpu, 1600x900. Files: critic/reviews/ed5cf5224-live/ (smoke.mjs, smoke-result.json, shots/).',
  '- FFX Seymour Flux: Slow on seymour-flux gave a miss with reason immune and an IMMUNE numeral (0 MISS numerals). Escape from the White Magic submenu returned to the top menu.',
  '- FFX-2 hidden Besaid: word valefor typed on chapter select opened ffx2-valefor-besaid; the Valefor rig is ON (8 parts, 24 bones, 6 keys) before and at the KO.',
  '- Pause: P and Escape resume on both chapters; H hides and restores the panels.',
  '- Music: prerendered mp3 requests, boss-seymour playing per audioDebug, no synth fallback.',
  '- Console errors 0, 404s 0.',
  '- Method notes: early runs failed on my own selectors (FFX menu class, the door going straight to party prep, targetId vs target); fixed in the script, no game defect. The Valefor KO used a declared autoBattle injection. After the KO the battle goes to results, so a P/Escape pause there is not valid.',
  '',
  '## Step 3: reload smoke (CHK-024) - PASS (lightweight)',
  'masterVolume 0.6 survived a reload with the save keys intact. Full upgrade matrix not tested.',
  '',
  '## Step 3b: pose census (data)',
  JSON.stringify(census),
  ''
].join('\n');
writeFileSync('D:/pyrefly-release55/critic/reviews/ed5cf5224-live.md', md);
