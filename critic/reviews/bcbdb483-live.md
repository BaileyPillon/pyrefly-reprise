```text
Build / artifact / target version: main bcbdb483, bundle D_Y69PMP, artifact 7265cb2b2db5a458cb8a9461f41d7e81f6aaef6ef02901bd81493291aadb8e1a
Review: live
Deployment: PASS
Changed area: NOT APPLICABLE
Ship: NOT APPLICABLE (already deployed under Bailey's owner override "ship the hotfixes"; this review verifies the live artifact, not a ship decision)
Milestone: not assessed
Quality: not assessed by this review (see the deep review still owed on this build per critic/pending/bcbdb483.json)
Targets: not assessed by this review
Top issues: a pre-existing, out-of-scope crash on real Escape mid-battle (see "New finding" below); NOT introduced by this candidate
Coverage: see below
Next required review and why: the deep review already owed and carried forward per critic/pending/bcbdb483.json's obligations, plus the focused review already settled (critic/reviews/bcbdb483-focused.json), neither of which is this review's job
Elapsed review time / repeated work avoided: ~100 minutes (a full manifest diff, five browser contexts, and a control-chapter isolation to separate a real bug from a harness artifact); the previous build's manifest (76f587c3) was reused as the --changed-from baseline rather than re-derived
```

## Deployment verification — Hotfix 12.1 (main bcbdb483, bundle D_Y69PMP)

### CHK-017: exact artifact — PASS

Ran twice: a `--changed-from critic/artifacts/76f587c3.json` diff (65 files touched by
the diff, 0 mismatches) and then a `--full` pass of every shipped file:

```json
{"result":"PASS","artifactHash":"7265cb2b2db5a458cb8a9461f41d7e81f6aaef6ef02901bd81493291aadb8e1a","liveManifest":"match","checked":894,"mismatched":[],"missing":[],"wrongType":[],"errors":[],"notes":[]}
```

The first `--full` attempt reported one `missing` file at 503
(`art/characters/vegnagun-body/idle.json`); three direct `curl` re-fetches all
returned 200, confirming a transient GitHub Pages hiccup rather than a real gap, and
the immediate re-run above came back clean at **894/894** files matched, byte-for-byte,
with the artifact hash `7265cb2b2db5a458cb8a9461f41d7e81f6aaef6ef02901bd81493291aadb8e1a`
recorded in both `critic/artifacts/bcbdb483.json` and `critic/pending/bcbdb483.json`.
Nothing here is a matching bundle name standing in for identity — every file's bytes
were diffed.

### Real-input smoke — PASS, with one pre-existing finding filed separately

Ran against `https://baileypillon.github.io/pyrefly-reprise/?livecheck=bcbdb483-<ts>`,
1600x900 (and 2000x897 for the CHAPTER tab), fresh browser context per section,
`PYREFLY_BROWSER=gpu` confirmed via `UNMASKED_RENDERER_WEBGL` as
`ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)`
for the whole run (no swiftshader fallback needed this pass).

1. **Title → chapter select (real keys):** two real `Enter` presses from title
   landed on `screen() === 'chapter-select'`.
2. **Chapter VII (Seymour and Anima at Macalania) still a locked COMING card:**
   confirmed both visually (`docs`-equivalent evidence:
   `D:/Tools/pyrefly-scratch/live121/chapter-select.png` shows a "Coming" badge on
   the "Seymour and Anima" tile) and via the debug API
   (`snapshotState().screenState.coming` → `["seymour-anima-macalania"]`). The DOM
   text check for the literal string `COMING` (all caps) was a harness miss on my
   part — the badge reads "Coming" in title case — corrected to use the API's own
   `coming` list, which is authoritative.
3. **Chapter II (Zanarkand Dome / Yunalesca) pause CHAPTER tab — the changed flow —
   confirmed fixed:** real `E` presses cycled the tab strip to `data-tab="chapter"`
   (`reachedChapterTab: true`); the three snapshot plates now measure and render
   identically: `104x119.375` CSS px at 1600x900 and `130x146.69` at 2000x897, each
   holding a `104x78` / `130x97.5` **4:3** image (no image wider or taller than its
   plate). Auron's "it isn't over" polaroid — the one Bailey's screenshot showed at
   1921x1441, blown out over the whole panel — now sits at the same small 4:3 size
   as "the great hall" and "the third shape" alongside it; see
   `D:/Tools/pyrefly-scratch/live121/ch2-chapter-tab-1600x900.png` and
   `...-2000x897.png`. Reached via the documented debug trigger `pause:open`
   rather than the real `Escape` that opens pause in ordinary play — see the new
   finding below for why, and note that `E`, `H` and the resuming `Escape` from
   that point on are still real keys.
4. **Pause hide/restore (real `H`):** one real `H` hides all panels (only "H SHOW
   PANELS · ESC RESUME" remains, `ch2-pause-hidden.png`); a second real `H`
   restores them (`ch2-pause-restored.png`).
5. **Resume (real `Escape`):** from the pause screen (reached via the trigger
   above), a real `Escape` press correctly resumed play: `screen()` returned to
   `'battle'`.
6. **One FFX and one FFX-2 battle, portraits and dialogue card still framed:**
   Chapter I's (`seymour-flux`) real reload-smoke run and Chapter IV's
   (`ffx2-bahamut`) HUD run both loaded without incident; `ffx2-bahamut` showed
   Auron's onboarding dialogue card cleanly framed (full-body art left, text
   right, no overflow — `ffx2-battle-hud.png`) and 6 `img[src*="portraits/"]`
   elements present in the DOM, consistent with face-cropped HUD portraits still
   being adopted.
7. **Audio — prerendered, not the procedural fallback:** `audioDebug()` on the
   FFX-2 run: `prerendered.manifest: true`, `prerendered.cues: 24`,
   `prerendered.sprite: true`, `prerendered.spriteDecoded: true`, and
   `music.fading` showed a real track (`boss-ffx2-aeon`) crossfading in — the
   sampled-audio path is live and being used, not the synth fallback.
8. **Console errors / network ≥ 400:** **0 and 0** across every section of the
   whole run (five browser contexts).

**New finding (filed separately, not blocking this deployment):** a real `Escape`
press during an idle FFX battle (before any command is submitted) reproducibly threw
`TypeError: Cannot read properties of null (reading 'syncHud')` and tore the
encounter down to chapter-select instead of opening pause. I isolated this with a
standalone control script
(`D:/Final Fantasy/tools/zz-live121-control.tmp.mjs`, left in place as agent scratch
per `AGENTS.md` "Shared working tree") run
against **`seymour-flux`, a chapter this candidate never touches**, and it reproduced
identically (same error text, same ~3s timing, same abort) — proving it is **not**
introduced or regressed by bcbdb483's pause/portrait-crop change (`introducedByCandidate:
false`, `regressionVsLive: unknown — needs the same probe run against 76f587c3 or
earlier to date it precisely`). It only appears when Escape is pressed before the
battle's first real command; a battle left running normally (no keys at all) instead
abandons cleanly after ~20s with no error. This is a real, critical-looking defect in
the pause-open path and is worth Bailey's attention, but it sits outside this hotfix's
changed area and is reported here rather than re-triggered inside this review's own
run.

### Reload smoke (CHK-024, lightweight) — PASS

`seymour-flux` run to one attempt (`attempts: 1`, `playTimeMs: 18966`), full
`localStorage` save blob read, a real `page.reload()`, then read again: the save
blob (chapters, settings, `seenCoach`) came back **byte-identical**
(`survived: true`). As in the prior live review, the one setting I tried to flip at
runtime (`setMuted`) is a runtime-only audio flag that does not live in the save, so
this proves progress/settings persistence but not that specific flag's persistence —
recorded honestly rather than overclaimed.
