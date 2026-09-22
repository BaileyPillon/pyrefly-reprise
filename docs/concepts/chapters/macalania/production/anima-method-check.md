# Anima (Macalania) — method check before a third attempt (AGENTS.md hard rule 15)

FFX only. Written 2026-09-22 after two failed attempts at Anima's missing enemy
poses (`cast`, `hurt`, `ko`), before any third render. Anima's `idle`, `attack`
and `overdrive` are the board-approved paintings and are never written.

## What failed, twice

| Attempt | Recipe | Result (24 renders, judged at 1:1 against the approved idle) |
|---|---|---|
| 1 | Method F (the brief's recipe): square idle + head refs, concat, 0.4, ease in, 0.2-0.6; the idle sidecar's identity words; boss framing, `--nonBiped` | 12 of 12 off-model. The checkpoint drew worms, beetles and armoured serpents: the adapter at 0.4 on an ease-in window cannot hold a form this far from anything the checkpoint knows. |
| 2 | The recipe behind her approved `attack` and `overdrive` (their sidecars): the tall idle as the only ref, 0.8, linear, 0.35-0.85, "standing upright" pose phrasing, the attack's negatives | 12 of 12 off-model, differently: legs with claws, two eyes, a salmon/pink colour burn over everything (the 0.8/linear colour bleed §3 of ART-PIPELINE describes). Her approved attack came out of the same recipe only after a long cherry-pick (`promotedFrom: _f14atk.1`). |

## Why it fails

Both attempts ask txt2img to invent a new pose for a subject whose identity lives
almost entirely in the reference, not in words the checkpoint can draw: a bound
figure with no legs, a single eye in a round helmet, horns with stitched crosses,
a ragged fur skirt. The words describe it; the checkpoint has no prior for it.
Whatever composes the image first (the words) wins the silhouette, and the
silhouette is exactly what the idle must keep.

## What changes for attempt 3

Take the pose from the approved idle's own pixels and let the model only repaint:
pilot 2's method E (puppet img2img), which kept costume best of every method tried.
Anima floats and is bound, so her "pose" in these three states is almost entirely
a whole-body attitude, which a puppet can carry without cutting her apart:

- `hurt`: the idle rotated back about 10 degrees around her lower body (recoil
  away from the party), on its own 832x1216 white frame.
- `ko`: the idle rotated forward about 14 degrees and lowered (a limp droop).
- `cast`: not attempted. The engine's fallback shows her approved `attack` for a
  cast (`POSE_FALLBACKS.cast = ['cast', 'attack', 'idle']`), which is her Pain /
  Boost pose already.

img2img at denoise 0.3 and 0.4 (two seeds each), the idle sidecar's own words
plus the state phrase, method F's references (square idle + head, 0.4, ease in).
Bar: the same creature as the idle at 1:1 (one eye, helmet, stitched horns,
bandaged torso, fur skirt, palette). If attempt 3 fails too, nothing is installed
and the engine's fallbacks (hurt -> idle, ko -> hurt -> idle) show approved art.
