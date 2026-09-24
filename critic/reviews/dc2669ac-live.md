Build / artifact / target version: main dc2669ac, bundle CzzK-khs, artifactHash 867f61412521207ee7ba4499336552c42a365c0a8a75e1dc912bfc79c3dea03e
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (already SHIP on critic/reviews/dc2669ac-focused.json)
Milestone: not assessed
Quality: not assessed (see critic/RUBRIC.md history for the last full score)
Targets: not assessed
Top issues: none blocking; one out-of-scope FFX design note recorded (see below)
Coverage: tested, reused, not tested — see JSON `coverage`
Next required review and why: deep review still owed (carried from fd0ae96 through bcbdb483; `critic/pending/dc2669ac.json`), because this is the third deploy since the deep review debt opened and `release.maxDeploysWithDeepOwed` allows at most two before it refuses (already an owner override on record: "ship the hotfixes")
Elapsed review time / repeated work avoided: ~55 minutes hands-on (most of it diagnosing a pre-existing coach-card/idle-battle interaction on the live URL before the real smoke could run); the exact-artifact check and the focused review's evidence were reused rather than re-derived

## What this pass is

CHK-017 (exact artifact) and a real-input smoke of Hotfix 12.2's changed flow
(the FFX-2 target cursor's default side, and the `?wait=split` flag with the
Wait default unchanged) on the live URL, plus the lightweight CHK-024 reload
smoke. `critic/reviews/dc2669ac-focused.json` already carries the full
live-vs-candidate sweep and the `ship: SHIP` verdict; this pass does not
repeat that matrix, it confirms the same fix reproduces on the actual
deployed artifact with real keys.

## CHK-017 — exact artifact

- `node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/dc2669ac.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/bcbdb483.json` → PASS, 47 changed-file check, 0 mismatched/missing/wrong-type.
- Because the pending marker's planned review is `deep`, re-ran with `--full`: PASS, 894 files checked (every shipped file: bundle, art, audio, fonts, manifests), 0 mismatched/missing/wrong-type, `artifactHash` `867f6141...` matches `critic/artifacts/dc2669ac.json` and the `liveArtifact` record in `critic/pending/dc2669ac.json`.

## CHK-016 — real-input smoke (PYREFLY_BROWSER=gpu, ANGLE D3D11, NVIDIA GeForce RTX 5070 Ti, confirmed via `UNMASKED_RENDERER_WEBGL`; no swiftshader fallback needed)

All in 1600x900, fresh browser context per section, cache-busting `?livecheck=` query, `window.__pyrefly.screen()` polled and asserted before every screenshot and state-dependent action.

1. **Title → chapter select** (real double Enter): `screen()` → `chapter-select`. Chapter VII (`seymour-anima-macalania`) confirmed still in `coming` and locked.
2. **FFX-2 Chapter IV (Bahamut), Wait default, the changed flow**:
   - The Wait clock holds while idle: `battle.turn` / `battle.ticks` identical across a 2s idle window at the top list.
   - Yuna's turn: White Magic → Cure, real Enter through each level. The target cursor lands with `ffx2--targeted-ally` on `data-actor-id="yuna"` (the caster/party, correct for Cure) — screenshotted (`ch4-cure-target.png`). Confirmed with a real Enter; screen returns to `battle`.
   - **The regression this hotfix fixes, reproduced live**: on the next actor's turn (Paine, Warrior dressphere) real ArrowDown + Enter opened Skill → Power Break was selected by default. Enter on it opened the target cursor **on Bahamut** (`data-actor-id="bahamut"`, the boss HP bar shows `ffx2--targeted`) — not on Yuna, which was Bailey's first report against the previously-live build. Screenshotted (see `diag6-target.png`, saved under the scratch dir; the flower reticle and the "Bahamut" nameplate are centred on the boss). This is the one property this deployment exists to fix, and it reproduces correctly on the actual live artifact.
   - Pause / hide / restore / resume, done **only after a command had been submitted** (see "known pre-existing issue" below for why): real Escape → `pause`; real H hides all panels; real H restores them; real Escape resumes → `battle`. Clean, no error.
   - Audio: `audioDebug()` showed `prerendered.manifest/sprite/spriteDecoded` all `true`, 24 cues, and the pause track (`"pause"`, `"Still Water"`) actively playing while paused — the sampled path, not the synth fallback.
3. **`?wait=split` behind the flag, Chapter IV, auto-played strategy**: reached battle cleanly, ran under the split behaviour (clock free-running at the top list) for the auto-play window with no console error or page error. (The auto strategy timed out at the harness's own wait window before reaching a result screen — that is this test's own budget, not a game hang; the focused review already carried a 53-turn real-key run of this exact flag to its outcome screen.)
4. **FFX Chapter II (Yunalesca), plain Attack, both games covered**: top list is `Talk / Attack / Special / White Magic / Items / Flee`; Attack selected and opened the target cursor (`attackTargetOpened: true`). A real Escape from the cursor both cancelled the target **and** opened pause in the same keypress — this is the documented `canPauseOnCancel` behaviour for FFX's CTB engine, not a new defect; recorded here because it changed what "cancel" looked like in this run's log, not because it is wrong.
5. **Chapter II pause CHAPTER tab (hotfix 12.1), still small**: reached pause after a real Attack was submitted (avoiding the known idle-battle crash below), real E cycled to the `chapter` tab, and all three snapshot plates measured 104×78 inside a 104×119.375 plate — no image larger than its plate, matching the fix from hotfix 12.1 and the previous live review's numbers exactly.
6. **Console/network**: 0 console errors and 0 responses ≥ 400 across every context in both smoke runs (`consoleErrors: 0`, `notFound: 0` in the results JSON).

### Known pre-existing issue hit again, not re-filed

The documented pre-existing bug (`TypeError: Cannot read properties of null (reading 'syncHud')`, battle aborts straight to `chapter-select`) reproduced twice while developing this pass's script: once from a real Escape and once from a real Enter, **both pressed on an idle battle before any command had been submitted**, while the onboarding "Auron's briefing" coach card was open over the battle. It reproduces on this live build exactly as recorded for `bcbdb483`, is unrelated to this hotfix's changed files, and was avoided in the reported evidence above by (a) using the documented `?coach=off` flag for the debug-jump path (an established technique per `src/debug/api.ts`'s own comment on `?coach=off` for captures) and (b) always submitting a real command before the first pause. Not re-filed as a new ticket; it is the same open issue as before.

## CHK-024 — reload smoke (lightweight; the full upgrade matrix is not part of this pass)

Seed-7 auto-played run of Chapter I (`seymour-flux`) to its idle-abort end (`attempts: 1`, `playTimeMs: 19099.2`(ish) recorded in `localStorage['pyrefly-reprise:save:v1']`); a real `page.reload()` of the live URL produced a byte-identical save blob back (`survived: true`). Same caveat as the previous live review: the flipped runtime flag (`setMuted`) is not itself stored in the save, so only the save's own progress/settings fields were proven to persist.

## Coverage

**Tested**: CHK-017 full-manifest identity (894 files, 0 mismatches); title → chapter select; Chapter VII still locked; FFX-2 Chapter IV Wait-mode clock hold; Cure targeting a party member; **Power Break targeting Bahamut, not Yuna** (the hotfix's regression, reproduced live with real keys); pause/hide/restore/resume after a submitted command; `?wait=split` reaching battle and running clean; FFX Chapter II Attack targeting; Chapter II pause CHAPTER tab snapshot sizes; console/network cleanliness; CHK-024 lightweight reload smoke.

**Reused**: the full live-vs-candidate command sweep across chapters 1, 2, 3, 8, 4, 5 and 6 from `critic/reviews/dc2669ac-focused.json` (same artifact, same targeting fix, produced against a `dist-gate` build of the identical commit) rather than re-run wholesale live.

**Not tested**: Rikku's Drain specifically (Power Break covers the same class of regression — a single-any offensive row defaulting onto an enemy — and is treated as representative rather than re-run per row); Dispel on an enemy and Phoenix Down on the party specifically in FFX (the focused review's sweep already covers every offensive/support row including these; not repeated live); a real-key run of `?wait=split` all the way to its results screen on the live URL (the focused review already has a 53-turn real-key run to outcome; this pass confirmed the flag reaches battle and runs clean but hit its own harness timeout before a result); chapters other than II and IV this pass; the full save/settings upgrade matrix beyond the one lightweight reload; physical controller and Safari/real-device input.
