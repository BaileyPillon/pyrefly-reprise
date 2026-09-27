```text
Build / artifact / target version: main ff3884fb / bundle BfW8CHQs / artifactHash eee16687d4cf7a5f62bec7920edaf2fb250cf566fda3915ccbf10bce6fa91356
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: N/A (live review does not gate ship; see the focused report critic/reviews/ff3884fb-focused.json for that verdict — recorded there as ship SHIP, changedArea FAIL on polish FOC23-01)
Milestone: not assessed
Quality: not assessed (live review does not recompute the milestone score)
Targets: not assessed
Top issues: LV-1 (informational — see below), LV-2 (informational — see below)
Coverage: tested = artifact identity (49 files against critic/artifacts/ff3884fb.json, diffed from a44297ca), title/chapter-select/party-prep/battle real-input flow for one FFX chapter (Seymour Flux) and one FFX-2 chapter (ffx2-bahamut, confirmed by selectedId), the hidden FF7 door (L-I-M-I-T on chapter select) through a real turn, pause (P)/hide (H)/restore (H)/resume (Esc) on the FFX chapter, prerendered-music check on two chapters, settings-reload persistence, console/network error sweep across four browser contexts; reused = none; not tested = full upgrade matrix (CHK-024 full), Vegnagun's four-part targeting UI, win/loss/retry path, the other named systems in this release (camera roll, phone refit, opening callouts, battle-start card, FFX-2 cut-in wait cap) beyond what a generic real-input pass exercises
Next required review and why: none newly triggered by this pass; the build's existing deep obligation (carried from many prior builds, see critic/pending/ff3884fb.json) still stands
Elapsed review time / repeated work avoided: ~50 minutes (long tail was a real methodological bug in the first smoke script's chapter-select navigation, see LV-2); the exact-artifact step reused no prior evidence (first live check of this sha)
```

## Step 1 — Exact artifact (CHK-017)

Ran, in `D:/Final Fantasy`:

```
node tools/artifact-manifest.mjs verify-live --manifest critic/artifacts/ff3884fb.json --url https://baileypillon.github.io/pyrefly-reprise/ --changed-from critic/artifacts/a44297ca.json
```

```json
{
 "result": "PASS",
 "artifactHash": "eee16687d4cf7a5f62bec7920edaf2fb250cf566fda3915ccbf10bce6fa91356",
 "liveManifest": "match",
 "checked": 49,
 "mismatched": [],
 "missing": [],
 "wrongType": [],
 "errors": [],
 "notes": []
}
```

PASS: the live manifest names this exact artifact and every compared file is byte-identical with the right content type. (a44297ca was the previous deployed build per `docs/deploys.log`; its own manifest file exists, so `--changed-from` was used rather than omitted. `--full` was not added: the marker's live obligation, not a deep or milestone review, is what this pass settles.)

## Step 2 — Real-input smoke (CHK-016)

Headless Playwright, `PYREFLY_BROWSER=gpu` (real GPU/D3D11, never SwiftShader, never the Claude-in-Chrome extension or the built-in browser pane), 1600×900, fresh browser context per chapter, cache-busting `?cb=<timestamp>` query, `https://baileypillon.github.io/pyrefly-reprise/`.

**FFX chapter — Seymour Flux (chapter-select index 0).** Title → Enter → chapter-select (asserted) → Enter → party-prep (asserted) → Enter → cutscene, held Enter to fast-forward → battle (asserted, `assertScreen` never fell through to a screenshot of the wrong screen — every wait either matched or would have thrown). `waitBattleMenu` confirmed `awaitingMenu: true`. Real input: Enter (Attack), Enter (confirm target) grew `battleLog()` from 12 to 17 entries — a real player turn resolved. Cancel path: Escape after the resolved action opened the pause screen cleanly (see below). Pause: `P` → screen `pause`; `H` hid the panels (visible text length 568) and a second `H` restored them (594, i.e. more text visible restored than the hidden read, consistent with panels coming back); `Escape` returned to `pause`'s own resume). `audioDebug()` showed the `pause` track as `cached: true, source: 'prerendered'` (prerendered sampled music, not the procedural synth fallback), `prerendered.manifest: true`, 25 cues cached and decoded.

**FFX-2 chapter — ffx2-bahamut.** **Method note (LV-2 below):** the board's actual play order is FFX chapters first, then FFX-2 (`seymour-flux, yunalesca, braskas-final-aeon, seymour-anima-macalania [COMING], evrae-airship, yojimbo-cavern, seymour-natus, seymour-omnis, isaaru-via-purifico, ffx2-bahamut, ffx2-vegnagun-shuyin, ffx2-leblanc, ffx2-fallen-aeons, ffx2-trema, ffx2-den-of-woe`), not the four-chapter order the a44297ca-era script assumed. A fixed-count `ArrowRight` navigation is unreliable (a run of 3 presses landed on `yunalesca`, index 1; a run of 9 landed on `ffx2-vegnagun-shuyin`, index 10) — the safe method, used for the numbers below, is to read `snapshotState().screenState.selectedId` after each press and stop on the wanted id. Once correctly on `ffx2-bahamut` (confirmed by `selectedId`): party-prep → Enter → cutscene fast-forward → battle (asserted), `awaitingMenu: true`. FFX-2's own top-level command row is `Orders` (a tactics/formation menu), not `Attack` — a bare Enter,Enter (which works for FFX's CTB menu) lands on `Orders → Pull back`, a non-damaging tactical order, and correctly produced no battle-log growth (confirmed separately: this is not a bug, `commandRows()` showed the real menu, `Orders` selected by default, `Attack` one row below it). With the real command — `ArrowDown` (select `Attack`) → `Enter` → `Enter` (confirm target) — `battleLog()` grew from 1 to 6 entries, `audioDebug().playing` was a chapter-appropriate track, and there were zero console errors and zero 404s in that context. Escape after the resolved action left the screen at `battle` rather than opening `pause` within the immediate check window; not chased further, since `P`/`H`/`Escape` pause behaviour was already positively confirmed once (RUBRIC §5, "match proof to the claim" — this is not a per-chapter requirement) on the FFX chapter above.

**Hidden FF7 experiment (Guard Scorpion) — the secret door.** On `chapter-select`, typed **L-I-M-I-T** with real key presses (~150ms apart, well under the door's 2s gap limit). The door opened immediately (`FF7_EXPERIMENT_READY` is `true` in this build): the screen went straight to `battle` with zero intermediate guard presses, matching `docs/handoff` and `secretDoor.ts`'s documented behaviour ("settles on the hidden chapter without `rememberBoardChapter`, ... no sound or sign"). `waitBattleMenu` confirmed `awaitingMenu: true`; real input (Enter, Enter) grew `battleLog()` from 0 to 4 entries — a real FF7 ATB turn resolved. `tests/unit/ff7-secret-door.test.ts` (15 tests) also re-run clean as a supporting check on the door's own logic.

**Errors.** Across all four browser contexts (FFX, FFX-2, FFX-2 reload, FF7) combined: **0 console errors, 0 responses ≥ 400, 0 image responses served as `text/html`.**

## Step 3 — Reload smoke (CHK-024, lightweight)

On the FFX-2 context, after the battle turn: wrote `masterVolume: 0.42` into `pyrefly-reprise:save:v1` in `localStorage` (was `0.8`), reloaded the page, waited for `window.__pyreflyReady === true`. After reload, `localStorage`'s `settings.masterVolume` read back as `0.42` — the changed setting survived a reload. Progress (a resolved battle turn) is not itself a save-data field this build persists mid-battle, so "one piece of progress" here is the setting change; the full upgrade matrix (fresh player / returning player / previous-build save fixture / invalid storage / reset flow) is explicitly **not tested** in this pass, per RUBRIC §5's distinction between a lightweight live smoke and CHK-024's full check.

## LV-1 (informational, non-blocking)

None of the media 404s or blank-image issues from the a44297ca review reproduced this run (0 across all contexts).

## LV-2 (informational, non-blocking — a review-script defect, not a live defect)

The first smoke script this session wrote assumed the four-chapter board order from the a44297ca-era script and used a fixed `ArrowRight` count to reach "the FFX-2 chapter." Because the live board now has 15 tiles (14 shipped + 1 `COMING`) with FFX chapters grouped before FFX-2, that script actually landed on `evrae-airship` (confirmed after the fact by `audioDebug().playing === 'boss-evrae'` during what the script logged as `ffx2-bahamut`) rather than Bahamut, and separately its `Enter,Enter` input hit FFX-2's `Orders → Pull back` instead of `Attack`, so its first `ffx2-bahamut.ticksAdvanced` read as `FAIL` (`framesAdvanced: false, logGrew: false`). Both causes were found and corrected within this session (selecting by `selectedId` instead of a press count; `ArrowDown` before `Enter,Enter` to reach `Attack`), and the corrected, verified run against the real `ffx2-bahamut` tile is what Step 2 above reports. Recorded here for transparency and so a future reviewer does not repeat the same fixed-index assumption; not a candidate defect, since the exact-artifact byte check (Step 1) is the authoritative test for what shipped, and the corrected direct check found no problem in the live build.

## Settlement

`node tools/critic-clear.mjs --report critic/reviews/ff3884fb-live.json` was run to settle this build's `live` obligation (see the tool's own output in the task result). No files under `critic/pending/` were edited or deleted by this review; the tool alone decides what a report settles.
