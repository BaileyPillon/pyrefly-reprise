# Leblanc production set — independent judge pass (2026-09-22)

FFX-2 only (art pipeline judging, not shared plumbing — AGENTS.md hard rule 14).

This is an **independent** judge pass over the installed
`public/art/characters/leblanc/{idle,attack,cast,hurt,ko}.png`, produced by
the 2026-09-21 re-render (commit `9621f0e`, recipe from
`docs/concepts/chapters/leblanc/pilot/judge.md` — Method A, `--forceRef`,
`refWeight 0.35`, `refStart 0.2`, `refEnd 0.6`, ease-in). No new renders were
made here; nothing was re-rolled. Every installed PNG was opened and viewed
at its own native pixel size, and the existing production sheet
(`docs/concepts/chapters/leblanc/sets/leblanc/sheet.png`, built by the
producing pass) was used for the 1:1 face-crop and 1:1 torso/hands-crop
comparisons — both the full renders and the sheet's crops were viewed before
any score below was written.

## Method

Anchor: `public/art/characters/leblanc/idle.png`. Criteria, each scored 0–10
against the anchor: hair; face; outfit colours and pattern; marks (the
sternum heart); weapon (the fan); style (line/shading treatment); and
whether the pose actually reads as its named state (attack / cast / hurt /
ko). **A state's score is its worst criterion**, not an average — one blown
criterion sinks the whole state regardless of how good the rest is. Pass
bar: 7. Skin-tone drift, where seen, is folded into "face" rather than
scored as its own line (the rubric handed down for this pass does not list
it separately).

Idle itself is the anchor and is not scored; it was checked against the
picked concept (`docs/concepts/chapters/leblanc/renders/leblanc-b.png`,
Bailey's pick B) in the prior pass and found on-model, left unchanged.

## Scores

| State | Hair | Face | Outfit colours/pattern | Marks | Weapon | Style | Pose reads as state | **Score (worst)** | Worst criterion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attack | 7 | 5 | **3** | 8 | 7 | 7 | 9 | **3** | outfit colours/pattern |
| cast | 6 | 7 | **3** | 8 | 6 | 7 | 8 | **3** | outfit colours/pattern |
| hurt | 7 | 5 | **3** | 8 | 7 | 7 | **3** | **3** | outfit colours/pattern (tied with pose) |
| ko | 7 | 6 | **3** | 6 | 6 | 7 | 9 | **3** | outfit colours/pattern |

**Overall: FAIL.** All four re-rendered states score 3, well under the pass
bar of 7, on the same criterion.

## Findings, by criterion

**Outfit colours and pattern — the disqualifying finding, confirmed on all
four states independently.** Idle's robe is a plain, near-solid purple with
only shading-fold variation (no visible repeating pattern at native
resolution or in the sheet's 1:1 crops). None of the four re-rendered states
match that:

- `attack.png`: a crisp blue/white **checkerboard/diamond** pattern covering
  most of the robe.
- `cast.png`: a lighter lavender/pink **diamond** pattern with a pink
  gradient the idle robe does not have at all.
- `hurt.png`: a **chevron/zigzag** stripe pattern, a third distinct
  treatment.
- `ko.png`: a bold white/purple **diamond** pattern, high-contrast, a fourth
  distinct treatment (closer to `attack`'s than the others, but still not
  idle's plain purple).

Four states, four different invented patterns, none matching the anchor.
This is exactly the identity-drift defect the 2026-09-21 re-render was
commissioned to fix (see commit `9621f0e`'s own message: "the canon
blue-and-white *triangle* robe pattern has still never landed"). The
producing pass's own per-state `judgeNotes` in each PNG's `.json` sidecar
report clearing this as a "hard disqualifier" (defined there as: robe not
solid navy/black with a halo) — that narrower check does pass, but the
broader ask (robe matching *idle's own* colours/pattern) does not, and that
broader match is what this rubric's "outfit colours and pattern" criterion
tests. Recorded as disagreement with the producing pass's self-report, not
an accusation of fabrication: the producing pass disclosed the general
problem in its commit message and did not claim outfit match against idle,
only against its own narrower re-roll triggers.

**Marks.** The heart is present, correctly placed on the sternum, and
coloured red on `attack`, `cast` and `hurt`, matching idle. On `ko` it
renders distinctly **pink/rose**, not red — visible plainly in the sheet's
1:1 torso crop next to idle's and the other three states' red hearts. Scored
6, not disqualifying on its own, but a real, confirmed colour miss.

**Pose reads as its state.** attack, cast and ko all read clearly and were
scored well here (lunging fan-out stance; fan raised overhead looking up;
lying on her side eyes closed). `hurt` does not: the face reads as a
half-lidded, smiling wink almost indistinguishable from idle's own smug
expression, and the crossed-arm posture does not read as pain or impact.
This independently confirms the producing pass's own disclosed finding
("every one of the 5 candidates reads as a coy wink/smile rather than a
pained wince or stagger") rather than contradicting it — it is not a soft
call, both this criterion and outfit colour/pattern land at the same worst
score for `hurt`.

**Hair, face, weapon, style.** No disqualifying misses. Hair length and
colour track idle reasonably across all four (cast's reads slightly longer
than idle's tight chin-length bob, a minor deduction). Face proportions and
purple eye colour hold up where the eye is visible; `attack` and `hurt` read
with a visibly warmer/tanner skin tone than idle's pale complexion, folded
into the face score per the note above. The fan is recognizably present and
held correctly in all four, though its own colouring varies state to state
(idle's fan reads dark/striped; `cast`'s is red/blue/white; this is a real
but secondary drift, not disqualifying on its own).

## Redo

All four re-rendered states are under the pass bar and need another pass:

- **attack** — match the robe to idle's plain purple (drop the blue/white
  diamond check); the skin tone should read as pale as idle's, not tanned.
- **cast** — match the robe to idle's plain purple (drop the lavender/pink
  diamond pattern and its pink gradient, which idle does not have at all).
- **hurt** — match the robe to idle's plain purple (drop the chevron/zigzag
  pattern) **and** rework the expression/posture so it reads as being hit —
  the current half-lidded smiling wink reads as coy, not pained, on every
  candidate tried so far (this is now confirmed twice, by two independent
  passes; a plain re-roll of the same prompt is unlikely to fix it — a
  stronger pose-tag emphasis or different phrasing is worth trying instead).
- **ko** — match the robe to idle's plain purple (drop the bold diamond
  pattern) and correct the heart mark's colour back to red (it currently
  renders pink/rose).

None of the four should be treated as a small touch-up: the same root cause
(no working reference lock on robe colour/pattern across states) shows up
differently in all four, which points at the recipe/prompt for "outfit
colours and pattern," not at any one seed.

## Sheet

`docs/concepts/chapters/leblanc/sets/leblanc/sheet.png` (built by the
producing pass) — one row per state: picked concept where one exists,
installed whole figure, 1:1 face crop, 1:1 torso/hands crop. Used as-is for
this judge pass; no new sheet was built.

## Scope note

Per the orchestration brief for this pass: confirmed via
`src/data/encounters.ts` that Leblanc is genuinely unwired into the chapter
list — the engine/data side is done (see `docs/handoff/chapter-leblanc-engine.md`)
and art/registration are deliberately not — so chapter wiring (encounters
registry, chapter select card, tactics lines, music routing, results screen)
is a separate track's job and out of scope for this art-judging pass.
