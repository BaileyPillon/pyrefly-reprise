```text
Build / artifact / target version: main 2ae1a9e4 / bundle Dh42HgH0 / artifactHash 55e101798e96ce068f24cd388dc716c088e96fba499491b8f577282f124343ea
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship)
Milestone: not assessed
Quality: not assessed
Targets: not assessed
Top issues: none
Coverage: tested = full artifact identity (5162 files), title and chapter select by real Enter, Chapter VIII (evrae-airship) real-input Orders menu: one-order Pull back widget, Esc cancel path, positive path (order queued), next actor's menu offers Cancel, P pause / H hide+restore / Esc resume, prerendered music, settings and progress reload; reused = none; not tested = full upgrade matrix, Chapter XVIII re-parity, strategy guide cards, W5 Overdrive gauge/aeons/Steal, Chapter IX aeon at gauge 96, Chapter X reflect line, Braska's Talk greyed while a Cid order is pending
Next required review and why: the build's deep obligation (critic/pending/2ae1a9e4.json, review deep) still stands; this pass does not settle it
Elapsed review time / repeated work avoided: ~75 minutes (37 of them the full byte compare); no prior evidence reused
```

## Step 1 - Exact artifact (CHK-017)
`node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/2ae1a9e4.json --url https://echoesofspira.com/ --changed-from critic/artifacts/72973096.json --full`, run in D:/pyrefly-r3945 because the manifest for 2ae1a9e4 exists only there (D:/pyrefly-r39-int has none). Result PASS, liveManifest match, checked 5162, mismatched/missing/wrongType/errors all empty. index.html identical once Cloudflare's analytics beacon is removed. A quick non-full run first also PASSed (46 changed files).

## Step 2 - Real-input smoke (CHK-016)
Headless Playwright, PYREFLY_BROWSER=gpu, 1600x900, fresh contexts, cache-busted URL. Screenshots in D:/Tools/pyrefly-scratch/live2ae.
- Title asserted, real Enter reached chapter-select (Auron guide overlay shown).
- Chapter VIII (evrae-airship) was entered with the debug API gotoChapter (not by card navigation), then asserted screen=battle, phase command:tidus, awaitingMenu true before each input.
- Orders opens a one-order widget (Pull back, cost slab "Turn now, Cid's next turn, 1 volley"). Esc returns to the command stack (cancel path). Enter queues Pull back (positive path); Cid shows the ORDER tag in turn order; on Rikku's next menu Orders shows only Cancel ("Cid keeps his turn").
- P opens pause, H hides panels and restores, P/Esc resume, all asserted by screen stack.
- Music: boss-evrae.mp3 and pause.mp3 fetched, audioDebug playing boss-evrae (prerendered, not synth).
- Autobattle through to results: chapter cleared.
- Console errors 0, 404s 0 across all runs.

## Step 3 - Reload smoke (CHK-024, lightweight)
Master volume raised 80 to 100 with real arrow keys in Options; Chapter VIII fight completed (cleared:true, attempts 1). After reload the save chapters were identical and masterVolume 1 read back. Full upgrade matrix not tested.
