# Leblanc identity-consistency pilot — independent judge pass (2026-09-21)

FFX-2 only (art pipeline pilot, not shared plumbing — AGENTS.md hard rule 14).
This is a **second, independent** pass over the pilot recorded in
`docs/concepts/chapters/leblanc/pilot/pilot.md`, run by a different agent than
the one that painted the candidates and wrote that verdict. No new renders
were made here. Every candidate PNG under `renders/` was opened and viewed at
its native pixel size (not the painter's shrunk `sheet.png` thumbnails) before
scoring; nothing below was marked without being seen. Sheet built for this
pass: `docs/concepts/chapters/leblanc/pilot/judge-sheet.png` (idle anchor +
the best candidate per method per pose, whole body, plus a 1:1 face-band crop
row). Build script: `judge-sheet.py` (Python/Pillow, one-off for this pilot —
not part of `tools/gen/**`).

## Method

Anchor: `public/art/characters/leblanc/idle.png`. Eleven hard criteria, each
scored 0–10 against the anchor: hair colour; hair length/cut (the short bob);
face proportions; eye colour; robe colours and the blue-and-white triangle
pattern; the heart mark; the fan; the boots; skin tone; line/shading style;
and whether the pose actually reads as attack / cast / hurt (a standing or
leaning idle pose scores 0 on this one). **A candidate's score is its worst
criterion**, not an average — one blown criterion (wrong prop, wrong palette,
no distinguishable pose) sinks the whole candidate regardless of how good the
rest is. Every candidate in every method/pose group was viewed; the table
below reports the best-scoring candidate per method per pose, with the
also-rans noted where they change the picture.

## Scores

| Method | Pose | Best candidate | Score (worst criterion) | Worst criterion | Notes |
| --- | --- | --- | --- | --- | --- |
| A (forceRef) | attack | `a035-attack.1` (tie: `a045-attack.1`) | **4** | skin tone (tan, idle is pale) / robe pattern (busy pastel check vs idle's plain purple diamond), tied | Only method that draws a real lean-forward, fan-out fighting silhouette. `a035/a045-attack.2` are disqualified outright (score 0): she holds a katana, not the fan — the identity block's "(red and silver fan:1.2)" is dropped entirely on that seed. |
| A (forceRef) | cast | `a035-cast.1` (tie: `a045-cast.1`) | **4** | robe colours/pattern (ornate multicolour diamond with gold trim bands, not idle's plainer purple/white) | Both `.1` candidates keep the white underdress and the fan; both `.2` candidates lose the white underdress for black shorts and a yellow obi — worse robe match, scored 3. |
| A (forceRef) | hurt | `a035-hurt.2` (tie: `a045-hurt.2`) | **1** | robe colour/pattern (solid navy/black, the purple-and-white triangle pattern is gone entirely) plus an unrequested circular mandala/halo behind her | `a035/a045-hurt.1` score **0**, not a soft miss: neither candidate is holding a fan at all (hand is at her chin in a "shh" gesture) despite "holding fan" in the pose tags. **This is a stronger finding than pilot.md's**, which read `hurt.1` as the intact-robe winner and only flagged `hurt.2`'s navy/halo drift — on inspection `hurt.1` fails a listed hard criterion (the fan) that `hurt.2` actually passes. |
| B (img2img) | attack | `b055-attack.1` (tied across all 4 attack candidates, both denoise levels) | **0** | pose | Identity retention is the best of any method tested — hair, the purple diamond pattern, the heart mark, the boots and the fan are all close to pixel-faithful to idle. But the pose is idle's own standing/fan-at-chin composition, unchanged; it does not lean, does not extend the fan, does not open the stance. This is not "close to an attack pose", it is the idle pose. |
| B (img2img) | cast | `b055-cast.1` (tied across all 4) | **0** | pose | Same finding: near-identical to idle standing, arm not raised in any of the 4 candidates. |
| B (img2img) | hurt | `b055-hurt.1` / `b065-hurt.1` (tied across all 4) | **0** | pose | The only change from idle's stance across all 4 hurt candidates is a closed/winking eye; body position (upright, weight even, one hand on the robe) is idle's own — no lean-back, no arm-across-chest. Best identity fidelity of the three methods, worst pose fidelity. |
| C (reference sheet) | attack/cast/hurt (combined — one sheet, not separable per-pose) | `c-sheet.1` | **1** | robe colours/pattern | Hair, heart-mark placement and a shared face genuinely hold across the 2–4 figures drawn on one sheet (the multi-pose coherence this method is meant to buy is real). But none of the 4 sheets lands on idle's actual purple/white diamond robe: `c-sheet.1` is a blue/pink/white check, `c-sheet.2` and `c-sheet.4` are red/pink check or navy box-grid, `c-sheet.3` adds a garbled hallucinated logo/watermark. All 4 also add black thigh-high stockings idle does not wear. Eye colour drifts too (`c-sheet.3`'s headshot reads blue-grey, not purple). Costume is seed-unstable exactly as pilot.md found; independently confirmed here on all 4, not just the two it singled out. |

## Verdict

**Method A wins**, confirming pilot.md's call, on a stricter, independently-run
scoring pass: it is the only method whose best candidate clears a score of 4
on two of the three poses (attack, cast), where B is mechanically incapable of
clearing pose-reading at all (0 on all three, every candidate) and C's robe
identity is too seed-unstable to trust as a base (1, on all four sheets, not
only the two pilot.md flagged). A's own weak point is hurt (best score 1,
tied with C, both below A's attack/cast form) — and the reason is worse than
pilot.md recorded: half of A's hurt candidates drop the fan entirely rather
than merely drifting the robe colour. Re-rolling hurt seeds needs to watch for
*both* failure modes (no fan; navy-robe-and-halo), not just the one pilot.md
named.

**Recipe for the real attack/cast/hurt re-renders** (unchanged from
pilot.md's recommendation — this pass confirms rather than revises it):

```
node tools/gen/comfy.mjs character --name leblanc --facing left --composition full \
  --size 832x1216 --batch <N> --pose <attack|cast|hurt> \
  --tags "$(cat docs/concepts/chapters/leblanc/pilot/identity.txt)" \
  --emphasis '(short blonde bob:1.3), (blue and white triangle pattern robe:1.25), (heart mark on chest:1.2)' \
  --poseTags "<pose tags for that state>" \
  --ref public/art/characters/leblanc/idle.png --forceRef \
  --refWeight 0.35 --refStart 0.2 --refEnd 0.6 --refWeightType "ease in" \
  --seed <seed> --out <file>
```

Best-of-N per state as usual, with two explicit re-roll triggers to check for
on every attack/cast/hurt candidate before accepting it (not just skim the
thumbnail): (1) is she holding the red-and-silver fan, not a sword or nothing;
(2) is the outer robe still purple/white patterned, not solid navy/black with
an unrequested halo. Either failure disqualifies the candidate regardless of
how good the rest of it looks — this is exactly the worst-criterion rule this
judge pass used, and exactly where A's hurt seeds broke twice, in two
different ways, across only 4 candidates.

Method B is not recommended for state art (defeats the purpose — see above)
but remains worth the low-denoise (~0.15–0.2) last-mile touch-up pilot.md
proposed, applied after picking an A candidate. Method C is not recommended
as a generator for shippable Leblanc pixels; a shorter, more literal
Danbooru-tag identity block (rather than the current hand-written prose block)
would be the thing to try if it's revisited, per pilot.md.

## Sheet

`docs/concepts/chapters/leblanc/pilot/judge-sheet.png` — row 1–2: idle anchor
plus the best whole-body candidate for each of the 6 method×pose cells above,
plus `c-sheet.1` for method C; row 3: a 1:1 top-of-figure face-band crop for
each of those 8 images. Method C's crop necessarily shows more than one face,
since `c-sheet.1` is a multi-figure sheet, not a single pose — same caveat
pilot.md's own sheet carried.
