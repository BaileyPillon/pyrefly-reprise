# Fix: Logos identity drift (FFX-2, Leblanc Syndicate chapter)

2026-09-21/22. FFX-2 only (AGENTS.md hard rule 14 — a per-character art recipe
fix for the Chateau Leblanc chapter, not shared plumbing). Owner of this
change: `public/art/characters/logos/**`, `docs/concepts/chapters/leblanc/sets/logos/**`,
`docs/concepts/_candidates/logos/**`, the `logos` row in `tools/gen/cast.json`.
Sibling fixes for `leblanc` and `ormi` were done by parallel agents the same
night — see their own notes in `tools/gen/cast.json` and NOW.md's running
line for `wf_6e496bfa-c24`.

## What was wrong

`production.md` (the original chapter art pass) had already flagged that
`logos/idle.png` measures 62% one colour, tripping `comfy.mjs`'s
near-monochrome reference guard, so `attack`/`cast`/`hurt`/`ko` were all
rendered **without** `--ref` — the same failure mode the Leblanc pilot
(`docs/concepts/chapters/leblanc/pilot/pilot.md`, `judge.md`) diagnosed and
fixed for the sibling `leblanc` row. Checking the installed `idle.png` itself
against the research (`research/ffx2-leblanc-syndicate.md` §10.1: "he wields
two revolvers") and the picked concept (`docs/target/targets.json`, "Logos
C") found it was **also off-model on its own terms**: one hand held a small
red cup/box, the other held nothing — not two revolvers at all. That is worse
than an identity-drift problem; it is wrong game data for the character.

Likely contributor: the old `tags` string carried its emphasis as inline
`(word:1.2)` parens. `comfy.mjs` backslash-escapes every paren in `--tags`
(only the separate `--emphasis` flag reaches real CLIP-weight syntax), so
that emphasis was inert literal text, not a weighted prompt.

## What was done

1. Re-rendered `idle` first (it was the broken anchor, not a fixable
   identity target) from the picked concept `docs/concepts/chapters/leblanc/renders/logos-c.png`
   as a `--forceRef` anchor, at the pilot's proven parameters (`refWeight
   0.35`, `refStart 0.2`, `refEnd 0.6`, ease-in). Best of 4 (seed 91103
   installed).
2. Re-rendered `attack`/`cast`/`hurt`/`ko` off the new `idle.png`, same
   `--forceRef` recipe. Moved the emphasis tokens to a real `--emphasis`
   flag and added explicit anti-cup/box/mask/crest tokens to `--negAdd`.
   Best-of-N per state (seeds and per-candidate judging notes in each
   state's own row under `tools/gen/cast.json`'s `logos` entry).
3. Viewed every candidate at native pixel size before picking — no install
   from a thumbnail (per D-027 in `docs/target/decisions.json`).
4. Built `docs/concepts/chapters/leblanc/sets/logos/sheet.png` (one row per
   state: picked concept where one exists, installed whole, 1:1 face crop,
   1:1 torso crop) and looked at it before calling this done.
5. Backed up candidates to
   `D:/Tools/pyrefly-art-backup/candidates/2026-09-21-leblanc/logos/`.
6. Ran `node tools/gen/manifest.mjs` once (57 subjects, unchanged — not
   committed, it is gitignored).

## Remaining gaps (not re-rolled further — pace rule, AGENTS.md hard rule 15)

- `idle`: a faint dark helmet-crest remnant survives despite `no helmet
  crest` in the tags and `negAdd`; the coat is open baring his chest (not
  described either way by the research).
- `attack`: only one revolver is clearly visible in the winning candidate —
  the other hand is tucked back out of frame in the lunge.
- `cast`: identity is good (both revolvers held, one raised near the face
  per the Russian Roulette cylinder-spin beat) but hair reads lighter/more
  silver than idle and a small unrequested gold shoulder accent appears.
- `hurt`: neither candidate strongly reads as "recoiling, staggering" — the
  installed one keeps closer to idle's own stance, plus unrequested rainbow
  ribbon streamers on the hakama hem. Worth a follow-up pass aimed
  specifically at the pose.
- `ko`: none of the three candidates render the two dropped revolvers beside
  him, called for by the pose tag.

## Status

**Candidate, not approved.** Not added to `docs/target/approved-hashes.json`
— `production.md` had already withdrawn the whole `chapter:leblanc:2026-09-21`
hash set for this exact identity-drift reason, and this fix answers that,
but Bailey still needs to look at the sheet and say yes.

`public/art/characters/logos/*.png` are gitignored (AGENTS.md hard rule 8,
"public/art/ never goes to main") — installed locally only, backed up as
above. Everything else (the sheet, the build script, the candidate renders
under `docs/concepts/_candidates/logos/`, and the `cast.json` row) is
committed — commit `920dac8`.
