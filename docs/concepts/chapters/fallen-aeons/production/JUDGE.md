# Chapter XI (Fallen Aeons): independent 1:1 judge of the production candidates

**Game case (rule 14): FFX-2 only.** Judge: a sub-agent that made none of this art, 2026-09-24.
Picks judged against: Bailey, 2026-09-24, verbatim "I'll go with your recommendations for all"
(O-1 A armoured Sisters with the clean pass, FA13 one idle and one cast per Sister, O-2 B Chapter IV
violet, O-3 A plus B as the shot between links, FA11 the Anima painting approved on his word). Bar 7 per
subject; a Sister passes only if both her idle and her cast pass. These verdicts are a judge's opinion,
not Bailey's approval, and every file stays CANDIDATE.

## Method

- Each installed PNG composited over a mid grey and looked at at 1:1 and 2x (faces, hands, the scythe
  join, the belly and the forearm repaints, hips and stinger), next to the picked options
  (`o1-sisters/a-armoured-trio.jpg`, `o2-possessed/shiva-b-chapter4-violet-card.jpg`, the anima B card,
  `o3-road/a-one-platform-plate.jpg`, `b-three-platforms-plate.jpg`).
- Measured the possessed aeons against the approved `shiva/*` and `anima/*` inside the 70 px pad: alpha
  inside the figure, luma correlation, aura alpha outside the figure and at the canvas border. Measured the
  Road plates against the approved `farplane.png` and the picked option plates. Counted alpha islands and
  near-white pockets on the Sisters.
- Game size: the builder's 1600x900 flat composites `production/frames/*.jpg`, cropped at 2x.
- Research: `research/visual-bible.md` §1.22.6 and the size table (Sandy tall and slim, red mantis;
  Cindy rotund, blue with red spots, a ladybug; Mindy smallest, orange bee, hovers, a stinger), plus the
  README's clean-pass list with the Review correction (red spots on BLUE).

## Scores (0 to 10; bar 7)

| Subject | State | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall |
|---|---|---|---|---|---|---|---|---|---|---|
| `sandy` | idle | 9 | 7.5 | 7.5 | 8 | 6.5 | 8 | 7.5 | 7.5 | **7.6** |
| `sandy` | cast | 9 | 6.5 | 7 | 8 | 6.5 | 7.5 | 7 | 7.5 | **7.1** |
| `cindy` | idle | 9 | 7.5 | 7 | 8 | 7.5 | 8 | 7.5 | 7 | **7.6** |
| `cindy` | cast | 7 | 4.5 | 4 | 6 | 4 | 6 | 5.5 | 6 | **5.4** |
| `mindy` | idle | 8.5 | 7 | 7 | 8 | 6.5 | 7.5 | 7 | 7.5 | **7.4** |
| `mindy` | cast | 7.5 | 5 | 4 | 7 | 4.5 | 5.5 | 5.5 | 6 | **5.6** |
| `x2-shiva` | idle / attack / overdrive | 9 | 8 (approved) | 8 | 8 | 8 | 7.5 | 7.5 | 8 | **8.0** |
| `x2-anima` | idle / attack / overdrive | 9 | 8 (approved) | n/a | 8 | 8 | 7.5 | 8 | 8 | **8.1** |
| `road-to-the-farplane` | plate | 9.5 | n/a | n/a | n/a | 7.5 | n/a | 7.5 | 8 | **8.1** |
| `road-to-the-farplane-links` | plate | 9.5 | n/a | n/a | n/a | 6.5 | n/a | 6.5 | 7 | **7.2** |

## Per subject, worst named first

**`sandy`, PASS (idle 7.6, cast 7.1).** Same face, armour, skirt and boots as the pick. The scythe now sits
on her forearm, which clears the clean pass.
- **Worst:** the mount. At 2x the scythe hub is a dark iron bracket clamped over the gauntlet, not grown from
  it, and the blade's rear stub crosses her hip. The builder disclosed this, and it reads as intended at
  game size.
- Cast: the forearm is rotated up with the hand open and five clear fingers. The upper arm is hidden behind
  a red cuff, and the elbow shows as a dark sleeve patch. The gesture is modest but reads as a raise at
  1600x900. There is only one scythe (the bible's estimate has two raised); that matches the pick.

**`cindy`, FAIL (idle 7.6, cast 5.4).** The idle clears the review's correction: large red spots on the blue
shell, no pale dots, and no ghost dot visible at 1:1. The face, hair, sash and ladybug toe caps are the
pick's own pixels.
- **Worst (cast):** at her belly the far hand is a fingerless blue gauntlet block, and above the belt a red
  sash slab floats diagonally across her stomach, detached from the sash. The front of her bust is cut
  off in a straight line behind the raised forearm. All three are visible at 2x, and the blue block
  still reads at 1600x900.
- Repair: repaint the belly inside a mask from the idle's own sash and belt pixels (the belt is intact in
  the idle), hide the far hand behind the belly or give it fingers, and restore the bust line from the
  idle. Then look at 1:1 again.
- Silhouette (not a fail, it is the pick): she reads plump, not a squat dome that is wider than tall.
  Staging sets her size.

**`mindy`, FAIL (idle 7.4, cast 5.6).** The idle clears the clean pass: the striped abdomen sits behind her
with a stinger, and the hips are black leggings. The face, antennae, wings and boots are the pick's.
Idle nits: a faint light horizontal streak at the waistband, and a slightly straight front edge on the
repainted hips.
- **Worst (cast):** the forward hand is a black glove pressed flat on a dark rectangular slab with jagged,
  hard-cut edges. At game size it reads as her holding a book or a phone. The orange sleeve behind it
  balloons into a shapeless blob, and there is a grey scratch mark at the elbow join.
- Repair: repaint the hand and forearm inside a mask from her own idle glove and sleeve (a thrust or open
  palm), with no slab. Then look at 1:1 again.

**`x2-shiva`, PASS (8.0).** An exact derive: inside the figure the alpha equals the approved painting's
(mean difference 0.0), the line work is kept (luma correlation 0.91 to 0.93), and the grade is violet.
It matches the O-2 B card.
- **Worst:** the aura is weaker than the picked card, because it is capped at 0.33 for the feet measure. It
  still reads on the Road's bright void. The eye glow is a soft violet band across the eyes, and on the
  idle and attack about 300 px of it spill past the profile edge at alpha above 0.35. Check that this glow
  does not enter the engine's content-box or feet measure. The aura alpha reaches the canvas edge at 6 to
  12 of 255, so under additive bloom a faint rectangle is possible. Fade the pad to 0 over its last few px.
- The three approved states differ from each other in hair and face (idle braided, overdrive loose). That
  is the approved set, not this derive.

**`x2-anima`, PASS (8.1).** The same exact derive (alpha difference 0.0, luma correlation 0.89 to 0.91).
It matches the anima B card. The violet reads, and the chest eye glow is right for a possessed aeon.
Same aura-edge note as Shiva (border alpha 6 to 9 of 255).

**`road-to-the-farplane`, PASS (8.1).** It matches the O-3 A plate (MAD 1.2 against the option JPEG). The
approved sky, spire and pyreflies are kept pixel for pixel down to row 794. The platform is a flat grey
rock with violet veins and reads as ground.
- **Worst / record fix:** `INSTALLED.md` says every row above 827 is exact, which is 65 percent of the
  plate. Measured, the first changed row is **795**, and 60.2 percent of the pixels are identical. Correct
  the note. The fog band at the horizon is soft and a little smeared at 1:1.

**`road-to-the-farplane-links`, PASS (7.2).** It matches the O-3 B plate (MAD 1.2). It differs from A only
inside x 1163-1739, y 1014-1147 (0.9 percent of the pixels). The two receding islands read as the next
links in the establishing shot.
- **Worst:** at 1:1 the two copies are flat, fogged discs. The far one has a hard, nearly straight top
  edge, and the near one has a small arch-shaped hole at its left end. It holds up at game size as a no-HUD
  shot between links, and only just.

## Verdicts

sandy: PASS
cindy: FAIL
mindy: FAIL
x2-shiva: PASS
x2-anima: PASS
road-to-the-farplane: PASS
road-to-the-farplane-links: PASS

## Re-judge: Cindy and Mindy cast r1 (commit 82df5a8f)

**Game case (rule 14): FFX-2 only.** Judge: a separate sub-agent that made none of the r1 art, 2026-09-24.
This covers only the two repaired casts. The idles, the aeons and the plates keep the verdicts above. These
are a judge's verdicts, not Bailey's approval. Both files stay CANDIDATE.

**Method.** I composited `public/art/characters/{cindy,mindy}/cast.png` (sha256 `d665fffb...` and
`fe220447...`, which match the claims) over mid grey. I looked at each at 1:1 next to its locked idle and the
failed r0 cast (backed up under `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-chapters/`), at 2x on the
torso and arm, and at 4x (nearest neighbour) on the seams: the glove, elbow, belt front and sash tails for
Cindy, and the glove, wrist, sleeve and waist hem for Mindy. For game size I cropped the builder's flat
composite `frames/sisters-cast-r1.jpg` (1600x900) and looked at it at 2x. I also ran my own pixel diff
against each idle at the best alignment:
- Cindy: idle at x+63. 95.5 percent of the pixels are identical. All changes sit inside x 0-161, y 273-500.
- Mindy: idle at x+15. 95.7 percent of the pixels are identical. All changes sit inside x 13-249, y 374-609.

Neither cast changes a pixel above y 250 or below y 700: the face, hair, wings, shell, stinger, legs and boots
are the idle's own pixels. I made no in-engine capture, because the Road has no scene ground yet and
`src/engine` and `src/scenes` belong to another agent.

| Subject | State | Identity to pick | Anatomy | Hands | Costume | Seams | Edges | Finish | Game read | Overall (mean) |
|---|---|---|---|---|---|---|---|---|---|---|
| `cindy` | cast r1 | 8.5 | 7 | 7 | 7.5 | 7 | 7 | 7.5 | 8 | **7.4** |
| `mindy` | cast r1 | 8.5 | 6.5 | 7 | 7 | 6.5 | 7 | 7 | 7 | **7.1** |

**`cindy` cast r1, PASS (7.4; was 5.4).** All three r0 defects are gone at 1:1:
- There is no blue block at the belly.
- There is no floating sash slab.
- The bust line is whole behind the raised forearm.

The belly roll under the arm reads as her own skin. The gauntlet and the elbow cap are the idle's pixels,
with no seam at the lace band at 4x. At game size she clearly reaches forward at chest height.
- **Worst:** the belt front and sash knot, x 70-200, y 390-500 on the cast canvas.
  - At 2x the red belt folds over at its left end into a flap. The knot and the tails below it are a muddy
    dark-blue mass without clear folds.
  - At 4x the belt's outer edge and left edge carry a line of 1 px pale specks (fringe). On the Road's bright
    lavender the fringe cannot be seen. On a dark plate it would show.
- Hands: the glove's gold-striped fingers read as a clustered claw rather than separate fingers. Its
  underside edge is slightly ragged at 4x. It passes at 1:1.
- Record: the left alpha margin measures 14 px, not the 16 px the claim states. It is harmless.

**`mindy` cast r1, PASS, narrowly (7.1; was 5.6).**
- The slab is gone. The black glove is the idle's own glove turned into an open palm. Its thin orange outline
  and the red fleck in the palm are both in the idle.
- The sleeve no longer balloons: the puff keeps its own outline and seam highlights.
- There is no grey scratch at the elbow.
- **Worst:** the arm's anatomy and the waist hem.
  - The elbow puff sits right under the shoulder pad, and the hand comes straight out of it. No forearm
    shows, so the arm reads as sharply foreshortened toward the viewer.
  - At 1600x900 the gesture is closer to "hand held at the chest" than to a thrust. It still reads as a cast,
    but it is modest.
  - The orange hem carried round the hip is a ruler-straight bar of flat colour with no shading. It stops
    bluntly at the stinger join. At 1:1 it passes as a belt line. At 2x it looks pasted on.
  - A glossy sliver of the idle's white wrist band shows between the glove and the puff at 2x.
- Record: the left alpha margin measures 28 px, not the 30 px the claim states.
- If she is repainted again: shade the hem bar and curve it with the hip, and consider a longer reach
  (forearm visible past the puff).

Follow-ups (Shiva's eye-glow spill and the aura edge alpha on the locked aeons): I did not re-judge them. The
builder changed no locked file, and the earlier verdicts stand.

CINDY-CAST: PASS
MINDY-CAST: PASS
