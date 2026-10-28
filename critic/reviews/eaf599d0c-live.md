Build / artifact / target version: main eaf599d0c, bundle 8rsIfOcP, artifact b3afdb47240a7078c0c678c7da9cdd702aa57455638981f968e6a7d0499d8035 (deployed 2026-10-28T01:00:54Z, release 65)
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE (the focused review critic/reviews/eaf599d0c-focused.json settled it: SHIP)
Ship: not decided here (a live review carries no ship verdict)
Milestone: not assessed
Quality: not scored here (live review)
Targets: not assessed
Top issues: none found in this pass; 0 console errors, 0 4xx/5xx
Coverage: tested: exact artifact (full mode, 7168 files checked, 0 mismatched/missing/wrong type), FFX Seymour Flux attack/cancel/KO/revive/pause/H/P, FFX-2 Fallen Aeons and Ixion (menu, cancel, attack), hidden word 'limit', music, reload smoke. Not tested: the camera shake / impact frame and the fight-opening card hold judged by eye (no frame timing measured), the ?timing=frames, ?cardhold=full, ?opencover=off, ?motion=classic switches, the FFX-2 ready hold timing, the full upgrade matrix
Next required review and why: the deep review this build carries (the marker lists it as owed); this live pass does not settle it
Elapsed review time / repeated work avoided: about 15 minutes; the byte-for-byte fetch was done 16 files at a time as in the fcecfa74 pass

## Step 1: exact artifact (CHK-017) PASS
`verifyLive` from tools/artifact-manifest.mjs in full mode (the marker plans a deep review), changed set from critic/artifacts/e9907cad8.json. Live manifest matches hash above; 7168 files checked, none mismatched, none missing, none with a wrong content type. index.html and press/index.html are identical once Cloudflare's Web Analytics beacon is removed; `_headers` is host-read and not downloaded. Script critic/reviews/eaf599d0c-live-verify.mjs, result critic/reviews/eaf599d0c-live-verify.json.

## Step 2: real-input smoke (CHK-016) PASS
Headless Playwright, PYREFLY_BROWSER=gpu (no black canvas), 1600x900, fresh contexts, cache-busting query. Script critic/reviews/eaf599d0c-live-smoke.mjs, results critic/reviews/eaf599d0c-live-smoke.json, frames in critic/reviews/eaf599d0c-live/shots. __pyrefly.build() returned eaf599d0 / index-8rsIfOcP.js.
- FFX Seymour Flux: title, chapter select, party prep, battle, each asserted. Real Enter attack advanced the log (16 to 21). Cancel path: Enter then Escape stays on the battle; Escape from the command menu opens pause.
- KO and revive: Yuna KO'd by real play, phoenix-down revive events seen (hp 750, alive).
- Pause: Escape opens/closes, P opens/closes, H hides (text 881 to 526) and restores (881).
- FFX-2 Fallen Aeons (Shiva) and Ixion reached with real keys, music boss-ffx2-fallen-aeons; Fallen Aeons: Enter opened the menu, Escape went to pause (cancel path), then Enter, Enter attacked and the log advanced 12 to 14.
- Hidden word 'limit' reached the FF7 fight, boss-ff7-guard fetched.
- Music: prerendered mp3 cues fetched from /audio/music/ and playing (audioDebug: prerendered manifest true, decoded true), not the procedural fallback.
- Console errors 0; 4xx/5xx 0.

## Step 3: reload smoke (CHK-024) PASS, lightweight
masterVolume set to 0.42, page reloaded, 0.42 and all save keys survived. The full upgrade matrix is NOT part of this pass.

## Step 3b: static checks
pose-census (tools/pose-gate.mjs --report): 146 subjects, 1106 paintings, pass 829, waived 79, rigged 0, fail 0, exempt 198. Data, not a verdict. File critic/reviews/eaf599d0c-live/static/pose-census.json.
