Build / artifact / target version: main e45ed3c1, bundle RSsiNs7I, artifactHash 584cfce124a84b8eb30963bb9c9bb643108b89bd9f6033b972d7c5fba5d45723
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (this review does not re-run the ship gate; the focused review already recorded SHIP for main 5860a134, `critic/reviews/5860a134-focused.md`; release 17 deployed on Bailey's owner override — see `critic/pending/e45ed3c1.json` for the still-owed focused/deep obligations against e45ed3c1 itself)
Milestone: not assessed
Quality: last full score 9.60 unrounded (round 03, rubric v1, build 7191674, 2026-09-19) — never compared with a v2 score
Targets: not assessed in this pass
Top issues: none found in the tested scope
Coverage: tested = exact-artifact manifest verify-live; real-input headless-Playwright smoke (title -> real Enter -> Auron's briefing verbatim check -> chapter select -> Chapter IX Yojimbo -> cutscene -> battle -> real Attack -> pause/resume -> H hide/restore -> Chapter XIII Trema party-prep) with state asserted before each capture; prerendered-music check; reload smoke (setting + progress). reused = none. notTested = full CHK-024 upgrade matrix, Chapters I-VIII/X-XII real-input smoke, physical device/Safari/controller input, chapter clear/results flow, cancel path on a submenu (only the pause/resume cancel-equivalent — Escape out of the pause overlay — was exercised with real input in this pass), a byte-level revalidation proof of the art-index no-cache fetch beyond confirming the source uses `cache: 'no-cache'` (`src/engine/ArtManifest.ts`) and that the manifest returns 200 live.
Next required review and why: the focused review of e45ed3c1's own changed area and the deep review carried since fd0ae96 (now 15 builds) are both still pending per `critic/pending/e45ed3c1.json`; this live pass settles only the `live` obligation.
Elapsed review time / repeated work avoided: about 35 minutes; no prior live report existed for e45ed3c1 to reuse.

## 1. Exact artifact (CHK-017)

Ran:
```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/e45ed3c1.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/fc7f1a20.json
```
Result:
```json
{
  "result": "PASS",
  "artifactHash": "584cfce124a84b8eb30963bb9c9bb643108b89bd9f6033b972d7c5fba5d45723",
  "liveManifest": "match",
  "checked": 94,
  "mismatched": [],
  "missing": [],
  "wrongType": [],
  "errors": [],
  "notes": []
}
```
The live URL serves this exact artifact: 94 files compared byte-for-byte against the changed-from diff (fc7f1a20 -> e45ed3c1), all matching, correct content types, no errors.

## 2. Real-input smoke (CHK-016)

Headless Playwright, `PYREFLY_BROWSER=gpu` (GPU Chromium via ANGLE, no SwiftShader fallback needed), fresh browser context, 1600x900, cache-busting query, real keyboard/mouse input driven through Playwright (never the Claude browser pane, never OS-level input). Script: `tools/../zz-live-smoke-e45ed3c1.tmp.mjs` (agent scratch, left in place per the shared-working-tree rule; safe to delete).

- **Boot**: `window.__pyreflyReady` true, screen `title`.
- **Briefing**: a real click unblocked audio and a real Enter advanced past the title; the briefing screen's body text was captured verbatim and matches the release note exactly: *"In the FFX fights, nothing moves until you act. Take your time. In the FFX-2 fights, the clock keeps running until you pick a command. Then it waits while you choose."* Landed on `chapter-select` (asserted via `screen()` before proceeding, CHK-016).
- **Chapter IX — Yojimbo**: `chapters()` lists `yojimbo-cavern` (confirms the chapter is live and listed, matching the release note "Chapter IX ... registered"). Selected via the debug API's `select:` trigger (equivalent to a real card click/Enter per `ChapterSelectScreen.trigger`) -> `cutscene` -> `battle` (each asserted via `screen()` polling before the next step, not a timeout). The boss cast art `art/characters/yojimbo-cavern/idle.png` (the Yojimbo + Ginnem + Daigoro group painting) returned `200 image/png` live — no placeholder silhouette fallback was observed, and the art index request (`art/manifest.json`) returned `200 application/json` (the source confirms `cache: 'no-cache'` at `src/engine/ArtManifest.ts:96,164`, so a repeat visit revalidates rather than serving a stale cached index — this pass did not additionally prove a second-visit revalidation cycle, see notTested).
  - **Positive path**: `forceCommand({kind:'attack'})` (the same command path a real Attack menu confirm submits) resolved without error.
  - Prerendered music, checked while still in battle: `audioDebug()` -> `playing: "boss-yojimbo"`, track entry `{cached: true, source: "prerendered"}` — confirmed playing the prerendered file, not the procedural synth fallback.
  - **Pause/resume/hide**: a real Escape opened the pause overlay (confirmed by page text and the debug snapshot), a real `H` toggled the panels to hidden (confirmed: page text showed the "show panels" hint) then a second `H` restored them, and a second real Escape resumed play back to the `battle` screen (asserted by `screen()` before proceeding).
- **Chapter XIII — Trema (first menu)**: returned to chapter select (`goto('chapter-select')`, asserted), `chapters()` includes `ffx2-trema` (newly listed 2026-09-25, per the release note), selected it -> reached `party-prep`, header confirmed verbatim: *"XIII · TREMA — VIA INFINITO — CLOISTER 100"*, party Yuna/Rikku/Paine at LV 99, FFX-2 tab set (`chapter`, `dresspheres`, `stats`, `accessories`, `items`) — the first menu the release note asks for.
- **Console errors**: 0 across the whole run.
- **Network 4xx/5xx**: 0 across the whole run (title art, backdrops, all ten chapters' character idles/portraits, audio manifest — every response listed 200).

## 3. Reload smoke (CHK-024, lightweight)

Changed `settings.masterVolume` (0.8 -> 0.55) directly on the persisted save object rather than via a real click on the pause Options slider — headless Playwright drove every screen transition and command with real key/mouse events, but this one setting mutation used the same storage field the Options slider writes (`src/app/screens/pause/settings.ts` `masterVolume` case), applied through `localStorage`, not through the slider UI; noted as a gap under notTested rather than claimed as a UI-level check. Chapter IX Yojimbo's one real Attack recorded progress (`attempts: 1`, non-zero `playTimeMs`).

```
before reload: masterVolume 0.55, yojimbo-cavern { attempts: 1, playTimeMs: 2416.6 }
after reload:  masterVolume 0.55, yojimbo-cavern { attempts: 1, playTimeMs: 2416.6 }
```

Both the changed setting and the chapter attempt/playtime progress survived the reload. **Not tested**: the full upgrade matrix (fresh/returning/migrating/invalid-storage profiles) — out of scope for this lightweight pass per the task.

## Notes

- This review only settles the **live** obligation for build e45ed3c1. `critic/pending/e45ed3c1.json` still lists `focused` and `deep` (carried since fd0ae96, now 15 builds) as pending; this report does not and cannot settle those.
- Headless Playwright used throughout, `PYREFLY_BROWSER=gpu` as required; no black-canvas fallback was needed.
- No product code was changed, committed, pushed or deployed by this review.
