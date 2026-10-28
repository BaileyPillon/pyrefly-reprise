import json, datetime
R = 'critic/reviews/eaf599d0c-focused/'
cont = json.load(open(R + 'continuity/continuity-summary.json', encoding='utf8'))
E = lambda *a: [R + x for x in a]


def chk(id, res, game, chapter, state, ev, mode, mand, mins, reason):
    return dict(id=id, result=res, game=game, chapter=chapter, state=state, evidence=ev, mode=mode, mandatory=mand, minutes=mins, reason=reason)


checks = [
    chk('CHK-002', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'boss card up and leaving', E('ch1-open-montage.jpg', 'ch4-open-montage.jpg'), 'manual', False, 5,
        'The boss card owns the whole window at 1600x900 and 2560x1440 (demo path) and leaves cleanly onto the battle field; no dead strip around it.'),
    chk('CHK-003', 'NOT APPLICABLE', 'both', '-', '-', [], 'manual', False, 0,
        'No text size, colour or layout changed: the card and HUD are the same, only the timing of when they go down changed.'),
    chk('CHK-006', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'card to first menu, set-up and demo paths', E('opening/opening.ndjson'), 'automated', False, 5,
        'In all six opening runs the .bstart overlay went to none 261 to 285 ms after its leaving class and the first menu opened with no card left; 0 console errors.'),
    chk('CHK-008', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'first menu', E('ch1-open-montage.jpg', 'ch4-open-montage.jpg'), 'manual', False, 5,
        'First command menu over the party at 1600x900 in both chapters, one boss ribbon, no panel on the painted actors; the HUD returns after the opening as before.'),
    chk('CHK-009', 'NOT APPLICABLE', 'both', '-', '-', [], 'manual', False, 0, 'No names or labels changed.'),
    chk('CHK-013', 'NOT APPLICABLE', 'both', '-', '-', [], 'manual', False, 0,
        'approvedArtCheck was not requested for this change and no painting, cast art or master changed; the diff touches timing, presenter beats and critic tooling only (the prep step ran art-derive verify and audit and the booth verify: all passed).'),
    chk('CHK-015', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'title to board to card to fight to results',
        E('continuity/ffx2-bahamut-win-eaf599d0c/run.json', 'continuity/seymour-flux-win-eaf599d0c/run.json', 'opening/opening.ndjson'), 'automated', True, 20,
        'The demo picker was driven by real keys (Enter on the title, ArrowRight and Enter on the card) at two sizes; both continuity routes played their chapter from the title to a victory by real keys. The set-up hook (gotoChapter, setSeed) only started the two set-up opening runs and proves nothing about capability.'),
    chk('CHK-016', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'opening, first menu', E('opening/opening.ndjson'), 'automated', True, 5,
        'Every opening run asserted the screen (chapter-select, battle) and the leaving card from the page clock before each screenshot. The three leave shots show the card still whole because a screenshot takes longer than the 250 ms fade: they are NOT evidence of the empty field under the card (see coverage). The probe flag awaitingMenu stayed false in every run; the menu was confirmed by the shot itself.'),
    chk('CHK-017', 'PASS', 'both', '-', 'dist-gate', E('opening/opening.ndjson'), 'automated', True, 5,
        'Served D:/pyrefly-release55/dist-gate with the candidate-build serve mode; index.html names index-8rsIfOcP.js (bundle id 8rsIfOcP) as expected. Prep step: art-derive verify and audit PASS, booth verify OK all 7169 files. The per-file manifest hash and live byte comparison belong to the deploy.'),
    chk('CHK-020', 'PASS', 'both', 'seymour-flux (FFX), ffx2-bahamut (FFX-2)', 'opening', E('timeline/ch1-demo-default.json', 'timeline/ch4-demo-default.json'), 'automated', False, 10,
        'Case: BOTH for shake-time, card hold and the opening cover (shared plumbing; FFX Chapter I and FFX-2 Chapter IV both measured with the shorter card), FFX-2 ONLY for the ready-hold into the attack (ATB turn start; FFX has no ATB). The card hold is shorter in both games (1264 vs 2168 ms in Chapter I, 1283 vs 2162 ms in Chapter IV, against ?cardhold=full).'),
    chk('CHK-021', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'opening, first menu, victory',
        E('timeline/ch1-demo-default.json', 'timeline/ch4-demo-default.json', 'continuity/continuity-summary.json'), 'manual', True, 10,
        'Presence and absence checked from measurements: the card cut and the HUD down under the card occur in Chapter I (FFX) and Chapter IV (FFX-2), as the notes say (both). The ready-hold into the attack is FFX-2 only: Chapter IV ghost frames fell 931 to 637 against release 64 (the harness reads the ready/idle flicker); FFX Chapter I has no ATB ready step, and its ghost count was not compared with live. The FFX-2 attack from the menu in a second FFX-2 chapter was not run. FFX-2-only behaviour in an FFX chapter was not observed; the ATB turn start was not read line by line.'),
    chk('CHK-022', 'PASS', 'both', 'seymour-flux, ffx2-bahamut', 'win', E('continuity/ffx2-bahamut-win-eaf599d0c/run.json', 'continuity/seymour-flux-win-eaf599d0c/run.json'), 'automated', True, 16,
        'One won fight per demo chapter by real keys from the title to the board again (382 s and 387 s of battle). A LOST fight was not run on this candidate (release 64 reached it on both chapters; the change does not touch the loss path).'),
    chk('CHK-023', 'PASS', 'both', '-', 'page start with ?timing= and ?motion=', E('switch/switch-probe.json'), 'automated', False, 2,
        'Through the real boot path: default timing=true (real time, every chapter); ?timing=frames and ?timing=today read false; ?motion=classic leaves timing true; ?timing=frames&motion=classic reads false; 0 console errors. The shake and impact frame at 60 and 144 Hz were NOT measured here: headless cannot change the refresh rate; the feel-120hz, feel-120hz-pins and feel-switch unit tests cover the real-time count.'),
    chk('CHK-026', 'FAIL', 'both', 'seymour-flux, ffx2-bahamut', 'whole fight, win',
        E('continuity/continuity-summary.json', 'continuity/continuity-summary-ch1.json', 'continuity/ffx2-bahamut-win-eaf599d0c/continuity/continuity.json', 'continuity/seymour-flux-win-eaf599d0c/continuity/continuity.json'), 'automated', True, 17,
        'Harness 5f9ecb91b07c: Chapter IV 4 swaps outside the height band (stature 0.898 to 1.116; release 64 read 1 swap, same extremes) and Chapter I 3 swaps over the head tolerance (worst 12.1 percent, 9.5 on the registered control: the same numbers release 64 read). Class and size are the live build own; carried, not introduced.'),
    chk('CHK-027', 'FAIL', 'both', 'seymour-flux, ffx2-bahamut', 'whole fight, win', E('continuity/continuity-summary.json', 'continuity/continuity-summary-ch1.json'), 'automated', True, 17,
        'Chapter IV: 1 swap jerk of 45 px (release 64: the same 45 px), ghost frames 931 to 637 and ghost swaps 256 to 210, worst mid-move dash 120 to 32 px, p99 frame 41 to 45.7 ms. Chapter I: 2 swap jerks (46.3 px worst; release 64: 2, worst 69), no snaps, 4.97 hard cuts a minute. FAIL as on the live build.'),
]
issues = [
    dict(id='R65-P1', severity='polish', title='Pose-swap continuity FAIL carried from the live build in both chapters (stature, head, swap jerks)', game='both', chapter='seymour-flux, ffx2-bahamut',
         expected='Every swap inside the height band and head tolerance, swap jerks under 40 px.',
         observed='Chapter IV: 4 swaps outside the stature band (release 64: 1; same 0.898 to 1.116 extremes), one swap jerk 45 px (same as live). Chapter I: 3 swaps over the head tolerance (worst 12.1 percent, same as live), 2 swap jerks of 40 px or more (worst 46.3 px; live 69 px). Ghost frames in Chapter IV fell from 931 to 637.',
         repro='PYREFLY_BROWSER=gpu node critic/runner/lib/continuity.mjs --base=<dist-gate served> --chapters=ffx2-bahamut --evidence=<dir> --tag=x',
         evidence=E('continuity/continuity-summary.json', 'continuity/continuity-summary-ch1.json'), confidence='medium', requirement='CHK-026, CHK-027',
         where='pose swap and pack camera (this change moves the ATB ready hold only)', fix='Carry into the pose batch with R63-M2 and R64-P1.',
         acceptanceCheck='continuity harness passes both chapters', introducedByCandidate=False, regressionVsLive=False, inNewFeature=False),
    dict(id='R65-S1', severity='suggestion', title='Chapter IV stature-band count read 4 against 1 on the same harness: watch it next run', game='ffx2', chapter='ffx2-bahamut',
         expected='A stable count of out-of-band swaps run to run.',
         observed='4 swaps outside the height band against 1 on the live build (extremes identical; 371 against 408 swaps judged); one run each, so not a measured regression.',
         repro='run continuity on ffx2-bahamut twice on the candidate and on the live build', evidence=E('continuity/continuity-summary.json'), confidence='low', requirement='CHK-026',
         where='suspected run-to-run variance in which poses occur; the ready-hold change alters the pose sequence',
         fix='A second continuity run of Chapter IV before the pose batch.', acceptanceCheck='two runs agree within 1 swap',
         introducedByCandidate='unknown', regressionVsLive='unknown', inNewFeature=False),
]
rep = dict(
    rubricVersion=2, review='focused', date=datetime.datetime.now(datetime.timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.000Z'),
    build=dict(mainSha='eaf599d0c', bundle='index-8rsIfOcP.js'),
    targetVersion='1b09ad4e5a0315f4233b38cdaccc5a6ce2c3854fe9d5a6f21db39145ad6ca5b2',
    verdicts=dict(deployment='NOT APPLICABLE', changedArea='FAIL', milestone='not assessed', ship='SHIP'),
    shipReasons=[
        'The fight opening works as the notes say on the candidate in both games: the boss card holds 1264 ms (Chapter I) and 1283 ms (Chapter IV) against 2168 and 2162 ms with ?cardhold=full, the 1000 ms floor kept, and the HUD goes down at the exact frame the card starts to leave (0 ms offset in all six runs, 1600x900 and 2560x1440, set-up and demo paths).',
        'Real-input wins in Chapter I and Chapter IV reach their results with 0 console errors; the demo picker works by real keys; the ?timing= and ?motion= words read back as written; the stamped continuity harness ran on both chapters.',
        'The only FAILs are the continuity checks (CHK-026, CHK-027), polish, at the same class and size the live build already has (Chapter IV ghost frames 931 to 637, swap jerk 45 px unchanged; Chapter I head 12.1 percent unchanged, swap jerk 69 to 46 px); nothing critical or major, no regression.'],
    checks=checks, continuity=cont, targets=dict(required=0, matched=0, failing=0, unverified=0, waiting=0), issues=issues,
    coverage=dict(
        tested=['Fight opening Chapters I and IV by set-up and by the demo picker (real keys), 1600x900 and 2560x1440, boss card and HUD timeline per frame, first-menu shots',
                'Fight-start timeline against ?cardhold=full on the same build (Chapters I and IV, demo path, cold)',
                '?timing= and ?motion= words at boot',
                'A won fight in each chapter and the stamped continuity harness (CHK-026/027)',
                'Unit tests of this change (card-hold, harness identity, feel-120hz, feel-120hz-pins, feel-switch, ffx2-ready-hold, opening-cover, fight-start-split, harness-identity-review): 143 passed'],
        reused=[dict(what='Release 64 evidence for everything unchanged (declutter HUD, dim plane, lose routes, Intel panels)', **{'from': 'critic/reviews/e9907cad8-focused'},
                     why='The diff touches the opening timing, shake clock and ATB ready hold; the HUD and effects code of release 64 are untouched by this merge'),
                dict(what='Release 64 continuity numbers as the live baseline', **{'from': 'critic/reviews/e9907cad8-focused/continuity'},
                     why='Release 64 is the live build and was read by the same harness code; the live URL was not re-run (the review-browser lock took about 90 minutes per claim tonight)')],
        notTested=['Camera shake and impact frame at 60 and 144 Hz on real hardware (headless cannot set the refresh rate; unit tests only)',
                   'The empty field under the fading card: screenshots are slower than the 250 ms fade, so the leave shots show the card; the HUD-down timing is the evidence, not a picture of the party at alpha 0',
                   'The FFX-2 attack from the menu in another FFX-2 chapter, ?motion=classic behaviour in play, a lost fight, a double press on the demo picker, the 390x844 first menu (phone showed the battle with no HUD, as release 64 did; the menu state was not asserted)',
                   'The deep review owed on the live build (plan depth deep, deepBeforeDeploy false)',
                   'Tile composites: no approved tile of the fight, pause, phone or presentation groups changed its look; the change is timing']),
    regressions=[], nextReview='Deep review of the live build (shared presenter, global layout and boot).', elapsedMinutes=330)
json.dump(rep, open(R[:-1] + '.json', 'w'), indent=1)
