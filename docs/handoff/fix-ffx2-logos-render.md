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

## REDO 2026-09-22 (last attempt, answering the independent judge's second pass)

FFX-2 only, same ownership as above. A second, independent judge pass
(`docs/concepts/chapters/leblanc/sets/logos/judge.md`, commit `42311e2`)
scored all five installed states above under the 7 bar — idle 5 (marks: a
clear crest remnant, not merely faint), attack 3 (weapon: one hand out of
frame), cast 2 (marks: the helmet is completely absent, the pass's most
severe finding), hurt 3 (pose/hair/weapon tied: reads closer to idle's own
stance, hair had drifted dark brown), ko 1 (weapon: no revolvers anywhere in
frame, the second-most severe finding). This section records the last
authorised re-roll.

### Two infrastructure findings, not GPU faults — read before blaming the GPU

**1. Raising `--refWeight` on a `--forceRef` anchor that trips the
near-monochrome guard burns the render to a blank frame.** This round's brief
suggested "reference weight one step higher... per the judge's note." Bumping
`idle`'s `refWeight` from `0.35` to `0.42` against the near-monochrome
`logos-c.png` anchor produced a uniform pale near-white frame with zero
content, every time, at every seed tried (6 candidates, then a further batch
at the *original* `0.35` to rule out a fluke — same result). Dropping
`--ref` entirely and rendering plain txt2img with the same tags reproduced
the identical blank frame, which at first read as a GPU-wide fault: the
shared ComfyUI queue was empty, and another agent's `leblanc_attack`/`cast`/
`hurt`/`ko` renders were landing with real content in the same output folder
at the same wall-clock minute, which ruled out a GPU-wide NaN state (the
literal "black frame" hard rule 12 describes, `maxRgb == 0`) — these frames
are near-uniform pale (~RGB 222,222,205), not literal zero, so `comfy.mjs`'s
own black-frame guard never caught them and never auto-restarted anything.
Root cause, found by bisecting flags one at a time down to a single `--name
logos --tags "..." --seed N` call: it was **not** the GPU, the queue, or
`--refWeight` — see finding 2.

**2. A comma inside one weighted `--emphasis` group corrupts the whole
positive prompt.** `--emphasis` groups are comma-separated
(`(a:1.2), (b:1.3)`); a phrase written as `(plain unadorned helmet, no
crest:1.5)` has an comma *inside* one group, and combined with two other
emphasis groups this reproducibly collapsed the render to the same blank
frame described above — with `--refWeight` back at `0.35`, with no `--ref`
at all, and with the *original*, already-shipped `negAdd`. Confirmed by
bisection: the same three-phrase emphasis with a short, comma-free third
phrase (`(plain helmet:1.4)`) rendered normally every time; the exact same
tags/negAdd/ref with the comma restored failed every time. This is
consistent with `docs/ART-PIPELINE.md`'s own instruction that `--emphasis`
is "two or three tokens, no more" — a short standalone phrase per token, not
a full descriptive clause — and this round's fix was simply to follow that
rule literally (see the new `emphasis` string in `tools/gen/cast.json`'s
`logos` row). Neither finding is a code change proposed here (that would be
shared plumbing, out of this row's ownership); they are recorded so the next
agent hitting a blank frame checks emphasis syntax and forceRef weight
before restarting ComfyUI or suspecting the GPU.

### What was re-rendered

All five states, 6 candidates each (idle, attack, ko), except: `cast` (6
requested, 2 rejected by the cut-out coverage guard, 4 judged) and `hurt`
(a first batch of 6 nailed the pained/recoiling pose but dropped the helmet
entirely — a new drift, not in the judge's notes — so a second batch of 4
added an explicit "still wearing his helmet" trigger). Every state kept
`refWeight`/`refStart`/`refEnd` at the pilot's proven `0.35`/`0.2`/`0.6`
(not raised, per finding 1 above) and rewrote `poseTags`/`negAdd`/`emphasis`
with an explicit trigger for that state's own worst-judged criterion, per
`judge.md`'s own recommendation section. The shared `tags` string also
dropped "syndicate **heart** logo" → "syndicate logo" (research §10.1 never
gives Logos a heart shape; that is Leblanc's chest mark), the smaller
sourcing note `judge.md` flagged under hard rule 6.

New seeds and full per-state reasoning are in each state's own `notes` field
under `tools/gen/cast.json`'s `logos` row (idle `93103`, attack `93201`,
cast `93301`, hurt `93503`, ko `93601`). Every candidate was viewed at
native pixel size, including targeted head/hand crops, before picking — no
install from a thumbnail (D-027). The veto sheet was rebuilt:
`docs/concepts/chapters/leblanc/sets/logos/sheet.png`.

### Results (self-scored, not an independent pass)

The renderer re-scored each installed candidate against the same 7-criteria
worst-criterion rubric `judge.md` used, honestly, including for the states
still below bar (this round's brief explicitly allows installing the best
candidate under 7 and saying so):

| State | Previous (judge, commit `42311e2`) | This round (self-scored) | Worst criterion now |
| --- | --- | --- | --- |
| idle | 5 (marks: crest) | ~7 | outfit/marks (crest gone; headwear reads as a wide-brimmed hat rather than a strict fitted helmet) |
| attack | 3 (weapon: one hand) | ~6-7 | outfit/marks (both revolvers now visible; a new unsourced silver shoulder pauldron appears) |
| cast | 2 (marks: no helmet) | ~5 — **best available, below bar** | weapon (helmet is now clearly worn and visible, the state's named defect; only one revolver is clearly visible) |
| hurt | 3 (pose/hair/weapon tied) | ~7 | hair/outfit (pose now reads as a strong pained recoil, both revolvers visible, hair colour close to idle's) |
| ko | 1 (weapon: none visible) | ~6 — **best available, below bar** | marks (two revolvers now clearly dropped on the ground, the state's named defect; the helmet is not visible at all in this candidate — plausibly knocked off in the fall, but not something the pose tags asked for, and a new, disclosed trade) |

**Not self-certified.** These are the renderer's own honest re-read, not an
independent second pass — `judge.md`'s own scores above were from a
different agent than the one who rendered, which is why the project treats
that as the real verdict. An independent judge pass is still wanted on this
redo before any of it is proposed for `docs/target/approved-hashes.json`.

### Status

Still **candidate, not approved.** `cast` and `ko` are installed as best
available under the 7 bar per this round's explicit brief; `idle`, `attack`
and `hurt` read as clearing it on the renderer's own re-score but want
independent confirmation. Candidates and the full rejected batch backed up
to `D:/Tools/pyrefly-art-backup/candidates/2026-09-21-leblanc/logos-redo2/`
(the pre-redo installed set) — the candidate renders themselves are
committed under `docs/concepts/_candidates/logos/`.
