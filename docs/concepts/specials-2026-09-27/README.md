# The special moments: Spiral Cut (FFX) and Mega Flare (FFX-2), options round, 2026-09-27

Spell effects option B shipped for the six elements, the heal and the hit
(`docs/handoff/iter2-spellfx-b.md`). The two specials the mock showed were not built, because the
approved recommendation deferred Overdrives and boss specials to "later"
(`docs/concepts/spell-fx-2026-09-26/README.md`). Today, in the live build:

- **Spiral Cut** (FFX, Tidus's Overdrive, `spiral-cut`) resolves to **the slash**, the same effect as
  every attack.
- **Mega Flare** (FFX-2, Bahamut's special, `x2-bahamut-mega-flare`) resolves to **today's tinted
  bloom**, the effect every spell had before option B.

Nothing here is built. These are options for Bailey (AGENTS.md rule 9). A pick approves only what
Bailey names.

**How this was made:** from frames already on disk, with no browser and no engine run (a deep
review was using the machine). The option A and B frames and clips are cut from the spell-fx mock's
`clip-{ffx,ffx2}-{B,A}-light.mp4` (the special runs from 4.8 s to 7.9 s) and its `stills/`. Today's
FFX slash is the mock's hit still, which the build matches (`docs/screenshots/spellfx-b/target-vs-build-*`).
Today's FFX-2 bloom is the mock's live-build frame of a Darkness cast: Mega Flare draws the same bloom,
on the party. **The letters change between the rounds:** this round's A is the spell-fx round's B
(particles), and this round's B is the spell-fx round's A (painting). The frames on the sheet are
retagged with this round's letters.

## The options

### A · Option B's specials, as mocked (particles)
- **Plays:** FFX: a blue-white helix climbs round the target, then one big gold slash and a white ring
  burst (the gold skin), landing at 1.43 s. FFX-2: violet motes pour into Bahamut's chest, a beam drops
  on the party and a shockwave of pink four-point sparkles rolls out, landing at 1.45 s. Each lasts 3.1 s.
- **Cost:** code only, 0 GPU. Port `B.spiral` and `B.megaflare` from `fx-b.js` into
  `src/engine/spellfx/` and key them by ability id: one small engine batch and its target-vs-build check.
- **Risk:** nothing new, because it uses the same atlas, batch, quality tiers and REDUCE FLASHES rules as
  the elements. One detail needs a rule: the numeral hold is capped at 0.9 s, and these land near 1.45 s.
  Either the cap rises for specials (inside the PR-0061 repeat budget of 1.2 s) or the effect starts under
  the name slab.

### B · Option A's painted flipbook, for the specials only
- **Plays:** FFX: one original painted swirl, scaled and spun by the shader round the target, then a
  painted slash. FFX-2: one painted burst grows on Bahamut's chest, then blooms huge over the party. Both
  play over today's bloom. The elements keep the shipped particles.
- **Cost:** the pilots already exist (two seeds each, sheet 4). Pick one per special and back it up to
  `D:\Tools\pyrefly-art-backup` (the pilots sit only in scratch and ComfyUI's output). The code is one
  billboard layer. A true 6-to-8-frame flipbook needs new renders (an ART-7 subset) and risks flicker.
- **Risk:** two visual languages share the screen: painted specials and particle spells. The painting
  is the brightest thing in the mock, so REDUCE FLASHES needs an opacity ceiling on it.

### C · No special effect beyond the camera moment
- **Plays:** Spiral Cut keeps the plain slash and Mega Flare keeps today's bloom. The weight comes only
  from the camera moment in the presentation plan's item 10 (`docs/plans/presentation-program-2026-09-26.md`,
  B4). That is round OR-2 in `docs/plans/iteration-2-batches.md`: a dolly and a hit-freeze, or three
  quick cuts.
- **Cost:** nothing here. All the cost sits in OR-2, which has no pick yet.
- **Risk:** until OR-2 is built, an Overdrive reads as an attack, and Bahamut's set piece reads as a
  Darkness cast.

## Recommendation: A, plus whichever camera OR-2 picks

- It finishes the language Bailey already approved and that shipped. Both specials take one small
  batch, with no GPU.
- An Overdrive stops looking like an attack now, without waiting for OR-2.
- It does not rule out B. A painting can be layered over A later if Bailey wants the painted look.
- Choose C only if the camera alone should carry the moment.

## FFX vs FFX-2 (rule 14)

- **Spiral Cut is FFX only.** It is an Overdrive (Tidus, `tidus-timing` minigame), drawn in the FFX
  gold skin. FFX-2 has no Overdrives.
- **Mega Flare here is FFX-2 only.** It is Bahamut's boss special in Chapter IV (turn 12 of its loop,
  `src/data/ffx2/enemies/bahamut-abilities.ts`), drawn in the FFX-2 skin (pink ring, four-point
  sparkles). The violet motes on the chest come from visual-bible's Bevelle particles; the core colour
  is marked [estimate] there.
- **FFX has Mega Flares of its own:** `spathi-mega-flare` (Isaaru) and the aeon Bahamut's `mega-flare`.
  A pick for FFX-2's Mega Flare does not carry over to them. They would need a gold-skinned version, so
  ask Bailey first.
- **The skins follow the approved rule:** `research/ffx-vs-ffx2-presentation.md` §9 row 2 says "one
  motion language, two skins".
- **Not sourced:** nothing in `research/` describes the retail animations. Every look here is ours.
- **Other specials are not covered:** other Overdrives, and the FFX-2 specials Acta est Fabula and
  Terror of Zanarkand. A pick covers only these two; the rest would follow in a later round.

## Open

- **REDUCE FLASHES:** D-220 Q7, which decides how soft it is, is still open. The reduced stills on
  sheet 4 use the §5.2 proposal. The mock's full screen wash is 0.5 for Spiral Cut and 0.8 for Mega
  Flare, the brightest moments in either game.
- **The camera moment itself (OR-2)** is a separate round and is not mocked here.

## Files

| What | Files |
|---|---|
| Sheet, in parts (1080 px wide, each under 1 MB) | `sheet-1-overview.jpg` (all three options side by side, recommendation, game case), `sheet-2-ffx-spiral-cut.jpg`, `sheet-3-ffx2-mega-flare.jpg`, `sheet-4-paintings-and-reduce-flashes.jpg` (B's pilot paintings, both options with REDUCE FLASHES on) |
| Clips (3.1 s, the special only, 1280x720 H.264) | `clip-ffx-A.mp4`, `clip-ffx2-A.mp4` (particles), `clip-ffx-B.mp4`, `clip-ffx2-B.mp4` (painting). For C, today's look is in `../spell-fx-2026-09-26/clip-today-live-build.mp4` |
| Tool | `sheet.py` (PIL and ffmpeg; it reads the spell-fx mock's clips, stills, pilots and today frames) |
