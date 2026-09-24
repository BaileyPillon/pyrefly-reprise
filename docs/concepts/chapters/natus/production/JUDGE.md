# Chapter X (Seymour Natus): independent 1:1 judge of the production candidates

**Game case (rule 14): FFX only.** Judge: a sub-agent that made none of this art, 2026-09-24.
Picks judged against: Bailey, 2026-09-24, verbatim "I'll go with your recommendations for all"
(O-1 A, O-2 A with the KO-and-revive strip, O-3 C night with the city lit, O-5 A). Bar 7 per subject.
These verdicts are a judge's opinion for the orchestrator, not Bailey's approval; every file stays CANDIDATE.

## Method

- Each installed PNG composited over a night tone (28,26,40) and a mid grey, looked at at 1:1 and 2x
  (face, hands, blade joins, skirt, ring edge, portrait edge), next to the option card Bailey picked
  (`natus/a-card.jpg`, `mortibody/a-card.jpg`, `portrait/a-card.jpg`, `highbridge/c-plate.jpg`).
- Measured: alpha islands, near-white opaque pockets (min channel > 235, alpha > 200), portrait alpha
  levels, backdrop mean absolute difference against the picked plate.
- Game size: the builder's real engine frames `production/clean-1600.jpg`, `battle-1600.jpg`,
  `dialogue-1600.jpg`, `battle-390.jpg`, cropped at 1.5x.
- Research read: `docs/concepts/chapters/natus/README.md` (sourced looks, off-canon flags),
  `docs/plans/chapter-natus-review.md` (targets, Review corrections).

## Scores (0 to 10; bar 7)

| Subject | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| `seymour-natus` (idle) | 9 | 7 | 6.5 | 8 | 7 | 7 | 7.5 | 7.5 | **7.3** | PASS |
| `seymour-natus-ring` | 9 | n/a | n/a | 8 | 8 | 7 | 7 | 8 | **7.8** | PASS |
| `mortibody` (idle) | 9 | 7.5 | n/a | 8 | 8 | 8 | 8 | 8 | **8.0** | PASS |
| `seymour-natus` portrait | 9 | 8 | n/a | 7 | 8 | 8 | 8.5 | 8 | **8.1** | PASS |
| `bevelle-highbridge` backdrop | 9 | n/a | n/a | 6 | 7 | n/a | 6.5 | 7.5 | **7.1** | PASS |

## Per subject, worst named first

**`seymour-natus` idle, 7.3 PASS.** Same pixels, crop and pose as O-1 A: white upswept hair, ashen ribbed
chest, violet armour, bladed skirt, the two latticed blade "wings". The skirt repair works: the flat white
pockets on the right-hand skirt are open, and the strips now read as tatters on the night plate.
- **Worst:** a near-white opaque pocket of about 140 px is still there at his right gauntlet, where the
  blade meets the wrist (image x 545-575, y 520-550; values about (246,248,249)). The same kind of white
  matte leak was peeled everywhere else. It is too small to see at 1600x900, but it will catch bloom.
  Fix it before approval: open it or paint it with the gauntlet's colour.
- The right hand is fused into the blade wing, and no fingers read. The left hand is a claw gauntlet on
  the grip and reads. Both come from the pick unchanged.
- One detached alpha island of 818 px (a loose skirt strip) plus a few specks under 10 px. They read as
  tatter, so it is acceptable.
- At game size, the face and chest blow out to white under the Chapter VII grade and bloom. That is
  staging (the scene track), not paint.

**`seymour-natus-ring`, 7.8 PASS.** The pick's ring, carved band and red diamonds, scaled 1.228x. It is a
little soft at 1:1 from the upscale, and the inner edge is feathered on purpose so the ring can turn.
It reads well behind him in the engine frame. Turning it is presentation, our idea, labelled as such.

**`mortibody` idle, 8.0 PASS.** Matches O-2 A: a bronze horned skull on a bony spine, blade legs hanging
down, a curled segmented tail ending in a steel blade. One alpha component, no white pockets over 70 px.
The 70 px one is the tail blade's own steel highlight.
- **Worst:** the "blade legs" read as splintered bronze wood more than blades at 1:1. At game size they
  read as legs. The research word "mechanical" is not met, but Bailey picked A knowing that (README O-2).

**`seymour-natus` portrait, 8.1 PASS.** Matches O-5 A exactly: clean face, violet eyes, facial marks.
The matte is binary (0/255) like every approved portrait (seymour, yuna, seymour-macalania), and the
edges at 2x are clean with no halo. Dropping the outpaints that invented a crown was right.
- **Worst:** the Review flag still stands. The portrait's gold-tipped spike crown, black-and-gold armour
  and facial marks do not appear on the O-1 A battle body, which has violet armour, no crown and no
  marks. Bailey took the recommendation, so this is disclosed, not a fail.

**`bevelle-highbridge`, 7.1 PASS.** The picked C plate, unchanged (MAD 4.2 against `c-plate.jpg` at
1600 px, which is JPEG noise). The night, the lit lanterns and the blue-lit gate read at game size.
Natus's violet and Mortibody's bronze separate from it.
- **Worst:** the finish at 1:1. Detail is soft and smeared, the top corners carry diagonal rain-like streak
  artifacts, and the water reflection band has horizontal smear. The sourced bridge features are absent:
  the crimson canopies, the zigzag border, the green diamond runner, and the walkway itself (only a red
  carpet shows). "The city lit" is a lit gate facade, not a city. The options round already flagged all
  of this, and Bailey picked C knowing it, so it is disclosed.

## Not judged (nothing was painted, by the plan)

No Natus hero cast (the plan names none; D-045 precedent: a question for Bailey), and no Mortibody
hurt or KO painting (the picked strip is the engine dissolve plus the idle).

## Verdicts

seymour-natus: PASS
seymour-natus-ring: PASS
mortibody: PASS
seymour-natus-portrait: PASS
bevelle-highbridge: PASS
