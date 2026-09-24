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

---

# Addendum 2026-09-24 (evening): independent 1:1 judge of the Natus hero cast (CANDIDATE)

**Game case (rule 14): FFX only** (Chapter X, Highbridge). Judge: a sub-agent that made none of the cast.
Subject: `public/art/characters/seymour-natus/cast.png` + `cast.json` (sha256 975fd8fd..., idle sha256
c53d22c1... confirmed), builder's record [CAST.md](CAST.md), sheet [cast.jpg](cast.jpg), commit 0ad9e766.
Picked by Bailey 2026-09-24 ~19:20 EDT: one hero cast painting (D-034 / D-045 precedent). Bar 7.
This is a judge's opinion for the orchestrator, not Bailey's approval; the file stays CANDIDATE.

## Method

- Idle placed at x 73 in the widened 796 x 1165 canvas; cast and idle composited over the night tone
  (28,26,40) and mid grey; looked at at 1:1 (top 700 rows), 2x (both wrists) and 4x (seams, idle | cast).
- Measured on the PNGs: alpha islands, soft alpha, near-white opaque pockets (min channel > 235, alpha > 200),
  enclosed holes, edge luminance and edge halo (edge pixel > 50 brighter than the 9 px interior mean).
- Game size: the builder's real 1600 x 900 frames (`f-idle.png`, `f-cast.png`, `f-cast-hud.png`, Chapter X
  on the Highbridge plate), side by side at half size and a 1:1 crop of the HUD frame.

## Measurements

- Soft alpha 0; binary matte like the idle. Opaque area 302,282 px against the idle's 302,377.
- Alpha islands: main body, the idle's own 818 px skirt strip, and **one new 2 px speck** at (575,442)
  beside the right forearm spikes. Enclosed holes: the idle's three, unchanged.
- Near-white pockets: the idle's right-hand matte pocket (121 px at 628,533) is **gone**; every remaining
  pocket is the idle's own (hair, chest, one wing highlight moved with the left crescent).
- Edges: mean edge luminance 128.1 (idle 127.1), share of edge pixels > 200 is 9.0 % (idle 8.5 %).
  Edge halo pixels up 7.5 % over the idle, concentrated at the right wrist (600,440 to 640,560).
- Right-wrist box (590-650, 470-520): 1,836 transparent pixels against the idle's 1,389 (the notch below).

## Scores (0 to 10; bar 7)

| Subject | Identity | Anatomy | Hands | Ring | Seams | Edges | Finish | Reads as a cast at game size | Overall | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| `seymour-natus` cast | 9.5 | 7 | 6.5 | 8 | 6.5 | 7.5 | 7.5 | 6.5 | **7.4** | PASS |

## Findings, worst named first

- **Worst: the right-wrist seam (x 590-650, y 440-520).** The cuff's red band now tapers to a thin
  lumpy loop instead of the idle's broad band, and a transparent notch opens between the cuff and the
  wing's base, so the wing hangs off a narrow neck. It is one island (attached), invisible at 1600 x 900,
  but plain at 2x. A 0.3 to 0.4 repaint of that neck, widening the band to the idle's width, would fix it.
- **Game read is modest (6.5).** At battle size the change reads as "the wings open wider": the tips now
  clear the ring's outer band, which helps, but the arms, body and face are the idle's, so nothing says
  "spell" by itself. It reads as a cast only together with the engine's cast effects. The builder's own
  note says the same; a larger turn or a raised arm is the stronger option, for Bailey to ask for.
- **Left wrist: acceptable.** The grip and red strap bend plausibly with the hilt; the claw fingers turn with
  the hand and still read. The newly exposed forearm contour carries a faint 1 px light rim at 4x
  (the idle's own rim light, now bordering the night), not visible at 1:1.
- **Hands (6.5):** the right hand is still fused into the wing with no fingers (inherited from the idle);
  the idle's white matte pocket there is filled with the gauntlet's colour, which the first judge asked for.
- **Identity 9.5:** face, hair, chest, armour, skirt and both crescents are the idle's own pixels; the
  lattice glow and colours match exactly. Framing: same baseline 1148, facing front, and the body sits at
  the same x in the engine frame as the idle (no jump between the two states).
- **Ring 8:** the ring layer is the idle's; the flared tips overlap its outer band cleanly in the engine frame.
- New 2 px speck at (575,442): trivial; clear it on the next touch.

## Verdict

seymour-natus-cast: PASS (7.4; worst: the right-wrist neck and band, then the modest game-size read)
