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

## Redo pass 2 (2026-09-22) — self-judged, not independent

This section is the producing pass for the redo this judge.md's own FAIL
called for, run by the same agent that re-rendered the art (per the
orchestration brief for this pass: "same ownership as its renderer"). It is
**not** a third independent judge pass — treat the scores below as the
producer's own honest self-assessment against the rubric above, the same way
the original 2026-09-22 production round self-judged in each state's
`judgeNotes`. A true independent pass over this round is still owed.

**Root cause identified and fixed for all four states:** the shared identity
block (`tools/gen/cast.json`'s `leblanc.tags`, `docs/concepts/chapters/leblanc/
pilot/identity.txt`) itself said "the robe patterned all over in blue and
white triangles and swirls" and carried a `(blue and white triangle pattern
robe:1.35)` emphasis. That text is the *research-sourced canon* description
(`research/ffx2-leblanc-syndicate.md` line 823) — but idle.png itself never
rendered that pattern (it came out a plain solid purple, accepted on-model
against Bailey's picked concept regardless), so every other state was being
pulled toward *some* invented pattern by the prompt while being judged
against idle's patternless reality. Fix: dropped the pattern language from
`--tags` entirely, replaced the `--emphasis` token with `(plain solid purple
robe, no pattern:1.4)` (up from `1.25`), added `pale skin` (the tan-skin drift
the independent pass also flagged on attack/hurt), and raised `--refWeight`
0.35 -> 0.4 (one step, per the judge's note). This is a deliberate, disclosed
departure from the research's own robe description in favour of internal
consistency between idle and the other four states — the research pattern has
still never landed on any rendered state including idle across three rounds
now, and matching idle beats matching a description the checkpoint cannot
reproduce reliably. Flagged per AGENTS.md hard rule 6, not hidden.

Six candidates were rendered per state (per the brief); one attack candidate
and one cast candidate were lost to the cut-out sanity guard (full-canvas
coverage, correctly rejected) and re-rolled once each to keep 6. One ko
candidate rendered a second figure ("multiple girls") and was discarded
without a re-roll (5 remained, still enough to judge). All candidates and a
contact sheet per state are under `sets/leblanc/candidates/<state>/` and
`sets/leblanc/sheet-<state>-fix.png`; `sheet-redo2.png` is a before/after/idle
strip for the four installed states.

| State | Hair | Face | Outfit colours/pattern | Marks | Weapon | Style | Pose reads as state | **Score (worst)** | Worst criterion |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attack | 7 | 7 | 8 | 7 | 7 | 7 | 6 | **6** | pose (reads as a fan flourish, not a hard lunge) |
| cast | 7 | 7 | 8 | 7 | 7 | 7 | 6 | **6** | pose ("looking up" not clearly met; eyes read forward) |
| hurt | 7 | 6 | 8 | 7 | 6 | 7 | 6 | **6** | tied: weapon (fan reads closer to a held stick than an open fan) and pose (posture reads more upset/standing than doubled-over/staggering) |
| ko | 7 | 7 | 8 | 8 | 7 | 7 | 8 | **7** | hair/face/weapon/style tied at 7 |

**Outfit colours/pattern is fixed on all four states** — up from 3 (a blatant
mismatched pattern on every state) to 8 (solid purple, no printed pattern,
close match to idle). That was the disqualifying criterion on all four
originally and no longer is.

**ko clears the bar (7).** Its specific defect — the heart mark rendering
pink/rose instead of red — is fixed (`(vivid red heart-shaped mark:1.35)`);
every other criterion was already sound. Recommend treating ko as resolved,
pending an independent confirmation pass.

**attack, cast and hurt do not clear the bar.** Each improved from a 3
(pattern, and for hurt also pose) to a 6, installed anyway per the brief
("install the best even if it is still under 7") as **best available, below
bar**:

- **attack (6):** pattern and marks are both solid now; the remaining gap is
  the pose reading as a stylish fan flourish rather than a clear attacking
  lunge. A third attempt should hold the pattern/skin fix and push harder on
  `--poseTags` for a forward-committed lunge silhouette specifically (the
  original installed `attack.png`, pre-redo, had a stronger lunge read that
  this round's candidates traded away for pattern/skin gains).
- **cast (6):** same story — pattern and marks hold, "looking up" is the
  weakest link. A follow-up should try `(looking up, eyes upturned:1.3)` as
  its own emphasis token rather than leaving it to unweighted `--poseTags`
  text, which the facing-contract research (`docs/ART-PIPELINE.md` §3) already
  established does little unweighted.
- **hurt (6):** the pose-reads-as-hurt criterion, tied-worst across three
  rounds now (this one included), moved from an unambiguous 3 ("coy wink") to
  a real 6 (reads as pained/tearful, not smiling) — the biggest single-state
  improvement in this pass, but still short. The strongest *expression* of
  the six candidates tried (`hurt-fix.2`, a bared-teeth grimace) was rejected
  here for a worse defect (an off-model blue-grey skin cast and no visible
  heart mark), which is itself worth a note: pushing the pain expression
  harder on this checkpoint may cost skin tone or the heart mark, so a third
  attempt should try to hold expression and skin/marks separately rather than
  one more blended prompt (per AGENTS.md hard rule 15's two-attempts-then-a-
  method-check: this is attempt 2 on hurt's pose-reads-as-state criterion
  across this pass and the original pass combined, so a third plain re-roll
  should not happen without a written method check first).

## Redo pass 2 candidate reject notes

- **attack:** `attack-fix.1` (soft tone-on-tone brocade still visible on the
  skirt, borderline but not as clean as the pick), `attack-fix.3`/`.7` (both
  still show a distinct printed pattern — chevron and diamond respectively),
  `attack-fix.4` (clean robe and clear heart, but no fan visible in frame at
  all — fails the weapon criterion outright).
- **cast:** `cast-fix.2` (a lighter lining panel down the front reads close to
  a two-tone pattern), `cast-fix.6` (very clean robe but the fan is closed,
  held like a wand), `cast-fix.7` (no fan visible in frame).
- **hurt:** `hurt-fix.2` (the best pain expression of the six, a genuine
  bared-teeth grimace, but off-model blue-grey skin and no heart mark visible
  in frame), `hurt-fix.1` (a workable wince in profile, but the robe's diagonal
  faceted pattern is the most visible of the six), `hurt-fix.3` (a decent
  one-eye-shut wince undercut by an unrelated white streak artifact across the
  forehead), `hurt-fix.5`/`.6` (both read as a grin/smirk, the same failure
  mode as before).
- **ko:** `ko-fix.1` (two figures — "multiple girls" — discarded), `ko-fix.2`
  (visible diamond print on the sleeve, eyes not fully closed), `ko-fix.3` (a
  strong red heart but doubled and placed high at the choker rather than the
  sternum, and the fan is held near her mouth rather than "fallen open beside
  her" as the brief asks), `ko-fix.5` (heart renders coral/orange, not red —
  the exact defect this round was fixing), `ko-fix.6` (clean robe and a red
  heart, but eyes read open/lidded rather than closed).
