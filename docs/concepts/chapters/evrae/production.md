# Production — the Evrae chapter (2026-09-21)

**Status: CANDIDATE, not approved (2026-09-21):** identity drift between states —
the driver found the evrae pose set drifts identity state to state. Removed from
`docs/target/approved-hashes.json` (`chapter:evrae:2026-09-21` withdrawn);
re-render in progress.

Veto sheet: `production.png` (one row per installed item: picked concept where one
exists, the installed painting whole, a 1:1 native-pixel face/detail crop, and a
1:1 native-pixel torso/hands crop).

Game: FFX. Sources: `research/ffx-evrae-airship.md` §12, `docs/ART-PIPELINE.md`,
`docs/concepts/chapters/evrae/options.json` (the picked looks: backdrop B, Evrae B —
teal body, orange fins).

## Recipe used

R2 from `docs/concepts/art-quality-pilot/README.md` (commit `0550cc8`), the
generator's own default: `--refWeight 0.30`, `--refStart 0.2`, `--refEnd 0.6`,
`--refWeightType "ease in"`, `--refScaling K+V`. `--composition boss --nonBiped`
for Evrae (it coils and fills the frame, per research §12.2 — this is the one
correct use of `boss` framing on this project's roster so far). Identity blocks
are long hand-written canon descriptions in the style of
`public/art/characters/{lulu,tidus,yuna}/idle.json`. Facing left throughout
(enemy). Pre-flight: ComfyUI answered (queue empty), all four model files
re-hashed and matched `docs/ART-PIPELINE.md` §9 exactly, and the first backdrop
render served as the black-frame test (no black frames, no GPU restart) before
any character rendering.

## Housekeeping

No pre-existing candidate/raw files were found under `public/art/characters/evrae`,
`public/art/backdrops/evrae*`, `public/art/portraits/cid*` or
`public/art/pause/evrae*` at the start of this session — nothing to withdraw.
Every rejected in-session candidate (backdrop rounds, all five Evrae states, the
Cid portrait and the hero painting) was moved, not deleted, to
`docs/concepts/chapters/evrae/withdrawn-2026-09-21/`.

## What shipped

| Item | File | Notes |
| --- | --- | --- |
| Backdrop | `public/art/backdrops/evrae-airship-deck.png` | Picked look B (looking up at the hull from the rail). Best of 3: one candidate came back as an abstract circular/wormhole shape rather than a ship hull (rejected outright — reads as a portal, not the requested composition); another lacked the foreground rail. Installed candidate has the rail, the hull above, and open sky, but does not legibly show the "Salvage Dream CID" deck lettering the research calls for. |
| Evrae — idle (near) | `public/art/characters/evrae/idle-near.png` (also copied to `idle.png` so the manifest has a plain default to fall back to) | Best of 3 on colour and facing: teal-dominant scales, orange fin-frills, correct facing-left, reads clearly as eel/dragon (never bat, no wings). This is the identity anchor every other state is `--ref`'d against. |
| Evrae — idle (far) | `public/art/characters/evrae/idle-far.png` | **Did not achieve the brief's "tiny distant streak against open sky."** Two rounds (6 candidates: one referenced off idle-near, one text-only) both returned a nearer, coiled full-body composition instead of a genuinely small/distant figure — composition capture wins over the pose prompt here even at `--refStart 0.2`, and dropping the reference entirely did not change the outcome. Per the pace rule (two failed attempts on the same failure), stopped rather than trying a third recipe. Installed candidate (round 2, text-only) is the best on facing and cutout cleanliness, but its colour balance skews orange/gold-dominant rather than the picked teal-dominant reading. **Flagged for a follow-up pass**, possibly by having the engine scale/position the existing near-identical sprite for the FAR state rather than asking the generator for a literally tiny figure. |
| Evrae — breath-charge | `public/art/characters/evrae/breath-charge.png` | **Did not achieve the research's "paintable charging throat" requirement** (§12.2) after two rounds (6 candidates): the checkpoint never renders a throat sac that reads as visibly swollen/lit apart from the identity's own orange fin colouring, and `glow`/`glowing` are banned pose-prompt tokens (`docs/ART-PIPELINE.md` §6), which narrowed the available phrasing. Installed candidate is the best on facing, colour and cutout cleanliness. The Inhale telegraph (one of only two enemy telegraphs in the anthology, per research) will need to read through animation/UI timing rather than a visibly different throat in the art itself — **flagged for Bailey/a follow-up pass**, not re-rolled a third time (pace rule). |
| Evrae — hurt | `public/art/characters/evrae/hurt.png` | Best of 3, and the strongest state in the set: the only candidate to show the scythe-like forelimbs as distinct clawed limbs (every other state's forelimbs read as coiled body, the same gap the original concept round already flagged), good facing, and the closest colour match to the picked teal-dominant/orange-fin reading. |
| Evrae — ko | `public/art/characters/evrae/ko.png` | Best of 3 on the "slack, streaking downward" body language research §12.5 beat 8 asks for (no legs, no tension in the coils, reads as falling rather than standing or fighting). The eyes read as open rather than closed at this size — a minor miss, not re-rolled further. |
| Speaker portrait — Cid | `public/art/portraits/cid.png` | No visual-bible entry exists for Cid, and `research/ffx-evrae-airship.md` §2 covers only his combat stats, not his appearance — **the bald head, forehead goggles, grey mustache and heavy build are general FFX canon knowledge, not sourced from either project doc**, flagged per AGENTS.md hard rule 6. `--keepBad` was required for every candidate (the known portrait-composition cut-out-guard gap, see the Leblanc production notes below). Installed candidate (best of 3, after one non-`--keepBad` batch was entirely rejected) shows the goggles doubled — a separate forehead pair and a second amber-tinted lens over the eyes — an off-canon render quirk, not re-rolled further. |
| Pause-plate / chapter-card | `public/art/pause/evrae-chapter-card.png` | **Did not achieve the brief's wide "deck with the wyrm coiling alongside" establishing shot.** Nine candidates across three rounds (a first round that only produced extreme head close-ups, a second that lost the creature into either a wingless miss or the ship alone with no creature, a third that returned to close-ups) never combined a legible ship-deck view with a legible, correctly-distant creature. Per the pace rule, stopped after round 3 rather than a fourth. Installed candidate (round 3) is the closest compromise: Evrae's head and neck fill the frame in canon teal/orange colouring, roaring, with the airship's bow/deck edge visible beneath it — closer to research §12.3 money-shot #1 ("over-the-shoulder from the deck, Evrae's head filling the upper right") than to money-shot #2 (the FAR chapter-card silhouette this asset was actually meant to depict). **Flagged for Bailey/a follow-up pass**, the same open item Leblanc's pause-plate left (its two-henchman group shot was also not achieved — see `docs/concepts/chapters/leblanc/production.md`). |

## Portrait face-crop row

Added a `cid` row to `src/ui/common/face-crops.json` (append only), measured by
hand with `tools/portraits/measure-face-crops.mjs probe cid` — pupils read at
approximately (308, 393) and (572, 390) of the 832×1216 file. Marked `tight: true`
(ipd 0.317, close to the 0.34 tight threshold, same case as `logos`).
`tests/unit/ui-portrait-face-crop.test.ts` passes (108/108) with this row in place.

## Follow-ups this pass leaves open

Three of the eight installed items did not meet their brief and are flagged
above rather than fixed by further re-rolling (pace rule, AGENTS.md hard rule 15):
Evrae's FAR silhouette, Evrae's breath-charge throat tell, and the chapter-card's
wide establishing shot. All three failed for the same underlying reason — the
checkpoint strongly prefers a close, coiled, frame-filling read of this
creature and resists being pushed to a smaller or more distant framing even
with the reference dropped entirely. A dedicated follow-up might try `--img2img`
off a rough compositional sketch (the documented fallback for "a form so far
from anything the checkpoint knows that no prompt reaches it," `docs/ART-PIPELINE.md`
§3) rather than another round of `--tags`/`--poseTags` wording.

Also open: none of the five Evrae states show the scythe-like forelimbs as
clearly reaching, bladed weapons except `hurt` — they mostly read as coiled
body, the same gap the original concept-art round already flagged in
`options.json`. Worth a dedicated pass with a forelimb-only pose emphasis.
