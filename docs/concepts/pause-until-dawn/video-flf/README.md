# Living-portrait video, round 2 (Wan 2.1 FLF2V) — RESULT: no demo built

**Status: FAIL. `pass=false`. Zero clips picked. Nothing with a visible join is shown
to Bailey — no `preview-seamless.webm`/`.mp4`, no `joins.png`, no `index.html` demo
exist in this folder, and none were built by this pass.** This file replaces the
pre-render design note that used to live here (still in git history at commit
`0966cfd`); the pipeline and graph it documented are unchanged and still work — see
`tools/gen/video-flf.mjs` / the object-info schemas in `object-info/*.json` for that.

This is the exact reason, restated as a build log rather than a plan, so the next pass
does not have to re-derive it from `judge.md`.

## Why this exists

Bailey on round 1's stitched preview (2026-09-21): *"there is absolutely no continuity
whatsoever... it needs to be better implemented."* The rule that follows
(`docs/concepts/pause-until-dawn/video-flf/judge.md` §0): **a join is visible if frame 1
or the last frame of a clip differs from the plate by more than noise at 1:1, and
nothing with a visible join is ever shown to Bailey.** Round 2 tried the fix Bailey
approved — `WanFirstLastFrameToVideo`, which conditions on the plate as both the first
and last frame instead of hoping the model drifts back to it. It did not pass.

## The brief's bar, and where round 2 landed

The seamless demo needs at least 3 passing clips (including one idle) to build a
clip-graph player and a hard-cut preview from. Round 2 delivered:

| Clip | Seed | Queued? | Rendered? | Judged? | Result |
|---|---|---|---|---|---|
| `idle-breathing` | 1 | yes | yes (81 frames, 16 fps, ~5.06 s) | yes | **REJECTED** — JOIN-LAST |
| `idle-blinks` | — | no | — | — | never queued |
| `smile-and-relax` | — | no | — | — | never queued |
| `determined-and-relax` | — | no | — | — | never queued |
| `hurt-and-relax` | — | no | — | — | never queued |
| `turn-left-and-back` | — | no | — | — | never queued |
| `turn-right-and-back` | — | no | — | — | never queued |
| `look-up-and-back` | — | no | — | — | never queued |
| `hair-breeze` | — | no | — | — | never queued |

**Clips rendered: 1 of 9. Clips passing: 0. Required to build anything: 3 (including an
idle).** The other 8 never reached the GPU queue this pass — at ~72 minutes/clip on this
14B fp8 model (see below), the 9-clip brief with re-seeds is 12+ hours on a GPU three
other workflows share (`judge.md` §5.4), and the one clip that did render failed before
a second was worth queuing (`judge.md` §5.4: "re-render this one clip and re-judge it
before queueing the other eight").

## The one clip that rendered: `idle-breathing` seed 1, and exactly which test it failed

Full detail in `judge.md`; the load-bearing numbers:

| Test | Score | Bar | Pass? |
|---|---|---|---|
| JOIN-FIRST (frame 1 vs. plate) | **8** | visible-at-1:1 defects score ≤5 | pass |
| **JOIN-LAST (last frame vs. plate)** | **5** | visible-at-1:1 defects score ≤5 | **FAIL** |
| IDENTITY | 9 | — | pass |
| MOTION | 6 | — | pass |

- **JOIN-FIRST passed:** face MAD 5.23 against a measured VAE-encode/decode noise floor
  of 3.85 (i.e. 1.36x floor, 79% of the deviation being the unavoidable floor pattern
  itself), zero translation (a ±8px shift search returns `dx=0, dy=0`), mouth settled
  and flat. Not distinguishable from the plate at 1:1 (`judge-face-ab.jpg`).
- **JOIN-LAST failed:** mouth MAD **4.24** at the last frame vs. a **1.92** floor for
  that box (2.2x floor, and still falling — the region was mid-swell at frame 73-77 and
  ran out of frames before returning). The hard-cut test (`idle-breathing` concatenated
  to itself, true `-c copy` cut, no cross-fade) measures the per-frame head-box step
  across the boundary: **0.45, 1.49, then 4.28 at the cut itself, then 1.07, 1.08** —
  the cut step is **4.2x its neighbours** and is visible at 1:1 as an expression snap
  (the mouth pops from a wider mid-smile back to the plate's closed-lip smile).
  `judge-hard-cut.jpg` is the six-frame strip across that cut.
- **Root cause (not this generator's bug, upstream ComfyUI):**
  `WanFirstLastFrameToVideo` only conditions the KSampler on the plate via
  `concat_latent_image`/`concat_mask` — the plate's pixels are never written back into
  the output. With `length=81` the mask only unmasks a single **phantom** slot (83, past
  the 81 real pixel frames) for the end anchor, versus four real, aligned slots (0-3) for
  the start — so the end anchor is structurally 4x weaker and points at nothing. Frame 81
  is a prediction "encouraged" toward the plate, not pinned to it. Full derivation in
  `judge.md` §1 (cites `comfy_extras/nodes_wan.py` directly).
- **Compared to round 1 for the record (not a pass, just showing the fix partially
  worked):** round 1's clips drifted bodily off the plate (a shift+scale search only
  brought face MAD down from ~88 to ~74 — a real camera push-in) and lost identity
  outright (`turn-left-and-back` scored 2 on IDENTITY, heterochromia lost). Round 2 has
  **zero drift** (face MAD floor-to-observed ratio 1.36x vs. round 1's ~2.3x, translation
  search returns exactly `dx=0,dy=0`) and IDENTITY 9. The fix is real; it is not
  sufficient by itself, because the end-frame anchor is still too weak to land the final
  expression.

## What this means for this pass

Per the brief: **pass is false, so no demo, no preview, and no player are built.** No
files exist under `clips/`, no `index.html`/`player.mjs`, no
`preview-seamless.webm`/`.mp4`, no `joins.png`, no browser screenshots. Building any of
those would mean showing Bailey a clip whose own judge measured a 4.2x visible join at
its only usable cut point — exactly what this whole round exists to prevent.

## What a round 3 needs before a demo is buildable (from `judge.md` §5, not invented here)

1. Feed `end_image` a 4-frame batch of the plate (`RepeatImageBatch`, a **core**
   ComfyUI node, already confirmed present on this instance) so the mask zeroes slots
   80-83 instead of only the phantom slot 83 — this covers the real last pixel frame and
   makes the end anchor symmetric with the (working) start anchor.
2. Move the requested expression event earlier in the 81-frame window so it has settled
   by ~frame 77, not still peaking at 73-77.
3. Re-time to 24 fps (round 1's rate) so a 150-170 ms blink is 3.6-4 frames instead of
   16 fps's 2.4-2.7 — the motion-spec bar in
   `docs/plans/pause-living-portraits-motion-spec.md` §11.
4. Re-render and re-judge that one clip alone before queuing the other eight — at
   ~72 min/clip this GPU cannot afford nine blind renders per round.
5. A demo still needs a *library*, not one clip: `docs/plans/pause-living-portraits-motion-spec.md`
   finding 8 is that a real idle is not a loop (autocorrelation 0.06-0.42; a clip that
   starts and ends on its own single frame *is* a loop). Several distinct passing clips
   joined at the shared plate frame, in varying order, is what round 3 needs to clear
   the 3-clip bar this round did not reach.

## Evidence this round left behind (all pre-existing, none added by this pass)

- `judge.md` — the full verdict, method, and the upstream ComfyUI code citation.
- `status.json` — the generator's own machine-readable log (what was queued, GPU state,
  the 8 never-rendered clip names).
- `judge-face-ab.jpg`, `judge-landmarks.jpg`, `judge-hard-cut.jpg` — the judge's images,
  looked at directly, not just trusted from the numbers.
- `object-info/*.json` — the live ComfyUI node schemas the graph was built against.

Nothing under `D:/Tools/pyrefly-video/flf/` is committed (scratch renders only, per the
brief).
