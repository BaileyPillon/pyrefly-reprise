# Production — the Leblanc Syndicate chapter (2026-09-21)

**Status: CANDIDATE, not approved (2026-09-22, updated):** identity drift between states —
the driver found the leblanc/ormi/logos pose sets drift identity state to state.
Removed from `docs/target/approved-hashes.json` (`chapter:leblanc:2026-09-21`
withdrawn). **2026-09-22 redo pass 2:** attack/cast/hurt/ko re-rendered again
after an independent judge pass failed all four (3/10, tied on outfit
colour/pattern) — see `docs/concepts/chapters/leblanc/sets/leblanc/judge.md`
for the root cause (the identity block's own canon pattern text was driving
the drift), the fix, and the self-judged score table. Outcome: outfit pattern
is fixed on all four states; `ko` now clears the 7 bar; `attack`, `cast` and
`hurt` improved from 3 to 6 and are installed as best-available-below-bar, not
approved. Still needs an independent judge pass to confirm, and (per the
judge's own notes) a third attempt on hurt's expression should get a written
method check first (AGENTS.md hard rule 15) rather than another plain re-roll.

Veto sheet: `production.png` (one row per installed item: picked concept where one
exists, the installed painting whole, a 1:1 native-pixel face/detail crop, and a
1:1 native-pixel torso/hands crop).

Game: FFX-2. Sources: `research/ffx2-leblanc-syndicate.md` §10, `docs/ART-PIPELINE.md`,
`docs/concepts/chapters/leblanc/options.json` (the picked looks).

## Recipe used

R2 from `docs/concepts/art-quality-pilot/README.md` (commit `0550cc8`), now the
generator's own default: `--refWeight 0.30`, `--refStart 0.2`, `--refEnd 0.6`,
`--refWeightType "ease in"`, `--refScaling K+V`. `--composition full` for every
biped (Leblanc, Ormi, Logos are all ordinary standing humanoids — `boss` framing
is reserved for forms that float/coil/fill the frame). Identity blocks are long
hand-written canon descriptions in the style of `public/art/characters/{lulu,tidus,yuna}/idle.json`,
not short tag lists. Facing left throughout (enemies). Pre-flight: ComfyUI
answered, all four model files re-hashed and matched `docs/ART-PIPELINE.md` §9
exactly, before any rendering.

## What shipped

| Item | File | Notes |
| --- | --- | --- |
| Backdrop | `public/art/backdrops/leblanc-last-room.png` | Re-rendered from the picked "C" concept with a stronger magenta/rose Leblanc-overlay and an explicit glowing heart-shaped door inlay (round 1 lacked the overlay canon calls for; one re-render, per pace rule). |
| Leblanc | `public/art/characters/leblanc/{idle,attack,cast,hurt,ko}.png`, `public/art/portraits/leblanc.png` | idle.png measures 43% one colour, so every other state rendered **without** `--ref` (monochrome-reference guard) — judged independently per state, not identity-pinned. Colour drifts state to state (pink-purple vs blue-purple). The canon blue-and-white triangle/swirl robe pattern renders inconsistently despite `(1.3)` emphasis. idle's fan is closed near her chin rather than canon's "half-open screen" — best of 3 on quality/costume. |
| Ormi | `public/art/characters/ormi/{idle,attack,cast,hurt,ko}.png`, `public/art/portraits/ormi.png` | Re-rendered **heavier** than the picked concept (`renders/ormi-a.png`) per Bailey's note that canon Ormi is big and round, not athletic. Shield emblem reads as an ornate sunburst rather than an explicit heart in most renders. |
| Logos | `public/art/characters/logos/{idle,attack,cast,hurt,ko}.png`, `public/art/portraits/logos.png` | idle.png measures 62% one colour, same no-ref-for-other-states situation as Leblanc. Two of three attack candidates drifted badly off-model (fairy wings; a laser rifle in place of the revolvers) despite `negAdd`; installed candidate is the third. Decorative helmet crest persists (research calls for a plain helmet) — same finding as the concept round. |
| Pause-plate | `public/art/pause/leblanc.png` | **Could not get the two henchmen into the shot.** The `hero` preset's close-up/face-focus framing plus the shared multi-person negative (`multiple girls, multiple boys, 2girls, 2boys`) fought a 3-person composition on two different attempts (explicit "henchmen behind her" and "blurred silhouettes behind her") — both came back as Leblanc alone, once with an unwanted crown/headdress. Shipped is her solo close-up (fan and heart mark visible, best of 6 across both attempts); the "two goons behind her" brief is **not met** and would need a different approach (e.g. a wider hero composition override, or compositing a separately-rendered duo in post) — flagging for Bailey/a follow-up pass rather than shipping a fabricated group shot. |

## Housekeeping

No pre-existing candidate/raw files were found under `public/art/characters/{leblanc,ormi,logos}`
or `public/art/backdrops/leblanc-last-room*` at the start of this session — nothing to
withdraw for this chapter. Rejected in-session candidates (backdrop round 1, the
two rejected pause-plate attempts) were moved, not deleted, to
`docs/concepts/chapters/leblanc/withdrawn-2026-09-21/`.

## Portrait face-crop rows

Added `leblanc`, `ormi`, `logos` rows to `src/ui/common/face-crops.json` (append
only), measured by hand with `tools/portraits/measure-face-crops.mjs probe`.
Logos is marked `tight: true` — his close, symmetric helmet crop cannot reach the
house eye line without the cover clamp pinning it, exactly the case the flag
exists for. `tests/unit/ui-portrait-face-crop.test.ts` passes (106/106) with
these rows in place.

## A tool gap noticed, not fixed here

The cut-out sanity guard's coverage check (`docs/ART-PIPELINE.md` §6) fires on
every `--composition portrait` render at "100% coverage in both dimensions" —
which is simply what a close head-and-shoulders crop against a full canvas looks
like (confirmed against the existing `public/art/portraits/tidus.json`, itself
832x1216 with no crop at all). `--keepBad` was used for every portrait render in
this chapter to work around it. Worth a real fix (exempt `portrait` composition
from the coverage check, the way `boss` composition already drops the
`touchesEdge` check) rather than a per-call flag every future portrait needs.

## Chapter numbering not decided here

The pause-plate was installed at `public/art/pause/leblanc.png` rather than a
`pause/chN-leblanc` name, because chapter numbering for the new FFX-2 content is
owned by the engine/data track (`docs/handoff/chapter-leblanc-engine.md`), not
this art pass. Whoever wires `ChapterMeta.heroArt` for Leblanc should point it at
this file (or rename it to match the chosen chapter slug).
