# Evrae — the order widget and the range read (FFX) — end-state options

**Nothing here is built.** No file under `src/` was touched. These are hard-rule-9
option frames for rounds **O-3** (the order widget) and **O-4** (the range read
without the HUD) in `docs/plans/chapter-evrae-review.md` §6.2, answered in one set
because the same frame has to answer both.

**Game case (rule 14): FFX only.** Trigger Commands, the CTB queue and Cid's own
CTB row are FFX conventions, and the airship chapter is an FFX chapter. *Absence
test:* no stage here carries `ig--ffx2`, no ATB bar, no dressphere row, no pink
accent — a pick applies to the FFX airship chapter and to no FFX-2 chapter.

## The question Bailey answers

> **Which of these three ways should the chapter be built around: how you tell Cid
> to pull back or close in, and how you know at a glance whether you are NEAR or
> FAR without opening a panel?**
>
> A pick may be a mix — the order widget and the range read are separable, and the
> recommendation below is a mix.

`sheet.png` puts all six frames side by side; the six 1600x900 frames are
`a-near.png` / `a-far.png`, `b-*`, `c-*`. The `.html` beside each PNG is what
rendered it (kit: `docs/concepts/polish/_kit/`, plates: the approved backdrop B
and Evrae look B in `../renders/`).

## A — the Trigger pair lives in the cascade, with a cost preview

1. On Tidus's or Rikku's turn the cascade grows two rows, **Pull Back** and
   **Close In**, tagged `Trigger`; on anyone else's turn they are not there.
2. The row matching the current range is greyed — "Already near" / "Already far" —
   so the range is stated in words at the one moment you can change it.
3. Highlighting a row raises the ivory cost slab: *Tidus's turn now · Cid's next
   turn · 1 missile volley*, with three volley pips and the forfeited one hatched red.
4. Confirming clamps a gold **ORDER** chip onto Cid's CTB tile until his turn
   consumes it, so the queue shows what he will do **instead of** firing.
5. Doing nothing needs no widget: you never open the rows, the slab never appears.

*Range read with the HUD muted:* weak — you are back to reading the creature.

## B — a deck-side gauge the airship slides along

1. A gauge stands at the left edge all fight: FAR top, NEAR bottom, a gold ship
   glyph at the state you are in.
2. The red hatched band at the NEAR end is the stretch where Poison Breath reaches
   you — drawn once, never explained, and it is why pulling back mid-Inhale works.
3. An order drops a dashed ghost ship at the other notch and draws the pull between
   them, captioned "On Cid's turn": the gauge is what says the order is pending.
4. Cid's CTB row repeats it as a small chevron label, so the queue agrees with the gauge.
5. Doing nothing is legible because the gauge holds still — no ghost, no pull.

*Range read with the HUD muted:* nothing at all. This is the HUD answer to O-4.

## C — no persistent widget: the field is re-staged, the order is a shout

1. No gauge, no permanent read: the camera is the read. NEAR is tight, warm and low,
   Evrae's head over the rail, deck in the bottom third.
2. FAR pulls back — more deck underfoot, cold haze, wind streaks, Evrae a diagonal
   streak against open sky. You see *less* of it, not a smaller copy.
3. Orders are still chosen in the cascade, but the confirmation is a one-shot shout
   across the frame: *"Pull back, Cid!" — order stands until Cid answers.*
4. Cid's tile stays clean; the only trace is the shout and the cloud drift, whose
   speed changes the instant the ship answers.
5. Doing nothing is the screen's default state — the fight looks calm when you are
   playing it correctly (§4.5).

*Range read with the HUD muted:* the only option that passes §12.3's bar alone.

## Recommendation

**A for the order, C for the read.** They are not exclusive: A answers "what does
this cost me" where the decision is made; C answers "which state am I in" without
the HUD. **B** is the one to drop if only two survive — its gauge duplicates what
C's staging gives for free. (A recommendation, not a decision; rule 10.)

## What these frames are honest about

- The FAR frames **shrink and rotate the approved look-B painting**. The real FAR
  pose is an unpainted NEW asset (plan §6.1), so how strongly C reads will change
  once it exists.
- The deck plating and guard rail are CSS over the approved backdrop B plate; the
  deck the party stands on is not painted yet.
- The party figures are the approved FFX character paintings used as foreground
  silhouettes, because no back-facing pose exists.
- HP/MP and the three volley pips are illustrative staging, not sourced data. The
  only mechanic claims made are the cited ones (§2.5, §2.6, §4.2, §4.3, §4.5).
- Plan §9 **R1** stands: a still can look right and feel wrong to click. If Bailey
  cannot separate A from B from a still, the next step on the ladder is a minimal
  interactive prototype of the chosen one — not another mockup round.

## Sources

`docs/plans/chapter-evrae-review.md` §2.5, §2.6, §6.2 (O-3, O-4), §9;
`research/ffx-evrae-airship.md` §4.2, §4.3, §4.5, §12.3;
`docs/handoff/presentation-ink-and-gold.md`.
