# Chapter IX (Yojimbo): independent 1:1 judge of the production art

**Game case: FFX only.** This covers Lady Ginnem's Yojimbo in the Cavern of the Stolen Fayth (B1). No FFX-2 chapter uses these files.

- **Judge:** an independent sub-agent, 2026-09-24. I made none of this art and changed none of it. The only file I wrote is this report.
- **Judged:** the installed candidates `public/art/characters/{yojimbo-cavern,daigoro,ginnem}/idle.png` and `public/art/backdrops/cavern-stolen-fayth.png`. Their sha256 values match the sidecars and `INSTALLED.md`: `bc8f5c1e…6c1f`, `b9d952d3…49c8`, `061d0021…1bee` and `cfdfe552…93a3`.
- **Compared with:** each subject's pick. That is O-1 A `boss/a-repaint-card.jpg`, O-2 B `daigoro/b-card.jpg`, O-3 B `ginnem/b-pyrefly-edged-card.jpg` and O-4 A `chamber/a-cold-plate.jpg`. For Yojimbo I also used the uncleaned cut-out in the backup (`concept-a2.png`), and for the chamber the picked render `backdrop-a3.png`.
- **Also checked against:** `research/ffx-yojimbo.md` §2.5, §6.1 and §6.3.
- **How I looked:**
  - Each idle at 1:1 on mid-grey and on the dark card colour.
  - 2x nearest-neighbour crops of the head, hands, hip and swords, feet or paws, the Yojimbo scabbard repair (before and after), Ginnem's face, hand and hem, and the chamber's pad (3x) and rock repair.
  - A 2x crop of the builders' real-engine `battle-frame-clean.jpg` at 1600x900. In that frame Yojimbo is about 232 px tall, Ginnem about 161 px and Daigoro about 67 px.
  - The chamber at half size and under the HUD (`chamber-hud-1600.jpg`, `chamber-hud-390.jpg`).
  - Pixel checks: alpha histograms, matte-border near-white counts, disconnected islands, and the chamber's diff against the picked render (1.25 % of pixels changed by more than 12, all inside x 346-1788, y 437-1479).

Scale: 10 = nothing to fix. **The bar is 7 on the overall score.** A sub-score under 7 is named as a defect, and I say whether it shows at game size.

## Yojimbo (`yojimbo-cavern`): 7.9, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 9 | These are the picked pixels. The only change is the erased scabbard: same gold *jingasa*, gold menpo, gold cuirass, orange sash, purple robe and train, and *geta*. |
| Anatomy | 7 | A believable profile stance. Only one *geta* shows; the far foot's thong peeks out above the near foot, so the far *geta* is read as hidden behind the near one. He is slender, not broad. |
| Hands | 7 | One hand shows: a purple gauntlet on the sash. Its fingers are readable at 2x. |
| Costume | 7 | The sourced palette is right: gold, orange and purple. See the research notes below. The lower sword's red cord wrap runs its whole visible length, so it reads as a very long hilt rather than a scabbard. |
| Seams | 8.5 | The scabbard erase is clean. The robe edge stays straight, and the tassel's tip closes with its own outline. There is one light 1-px fleck on the robe edge at about (428, 617). |
| Edges | 8 | The matte is binary with an ink outline. Only 17 near-white pixels remain on the matte border, and there are 3 islands of 2 to 3 px. |
| Finish | 8 | Crisp cel paint, consistent with the pick. |
| Read at game size | 8.5 | The strongest read in the frame. Hat, gold and purple separate cleanly from the backdrop, and the silhouette reads as a samurai at 232 px. |

**Worst: build and armour against the research (§6.3).**

- The research asks for "a colossal samurai" with "top-heavy pauldrons with gold spirals" and a *jinbaori*. The painting is a slim figure with small segmented shoulder plates, no visible spirals, and no clear sleeveless surcoat: the purple train reads as a long robe.
- The mask is gold and spotted, but its fangs cannot be read at game size.
- This was already in the pick, which Bailey approved for its look. Size can come from world height (2.55 is the estimate).
- **Disclose this. Do not repaint on this judge's say-so.**

**Other research notes:**

- Two swords at the hip, where §6.3 names one katana. His attack list includes Wakizashi (§3), so this does not contradict the research.
- The painting contradicts nothing else in the research.

## Daigoro (`daigoro`): 7.3, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 9 | The picked pixels: cream koma-inu with a curled mane, a dark ear and a plumed tail, sitting and facing left. Only the baked blue shadow was removed. |
| Anatomy | 7 | A plausible sitting dog. One flaw comes from the pick: a stray white spike between the front legs, at about (345, 765), reads as a horn or claw that belongs to nothing. |
| Paws (hands) | 6.5 | **Defect.** The shadow erase left the undersides of the paws ragged. The dark far forepaw and the hind paw end in broken dark flecks and notches (about x 150-400, y 815-850), not a closed pad line. The white near forepaw is fine. |
| Markings and mane | 8 | Swirl curls, a brow mark and a clean face with a readable eye and nose. |
| Seams | 6.5 | The same ragged paw bottoms. Nothing else was touched. |
| Edges | 7 | Binary matte with 3 islands of 1 to 3 px. There are a few pure-white matte flecks on the underside of the mane (about x 110-200, y 560-620) and one at the chin edge (about 38, 370). |
| Finish | 7.5 | Soft cel paint. The palette is a little pink-violet in the shadows, as in the pick. |
| Read at game size | 8 | At 67 px he reads as a pale lion-dog beside Yojimbo's feet. The paws are about 5 px there, so the ragged bottoms do not show. |

**Worst: the ragged paw undersides left by the shadow erase.** They are invisible at the estimated 0.73 world units. They would show in any close-up or at a larger scale.

- **Suggested repair (pixel-only, no GPU):** close the bottom 3 to 4 px of each paw with the paw's own edge colour, and erase the white spike.

**Research (§2.5, §6.3):** they give only "Koma Inu" in the data, and nothing in the painting contradicts that. His look is ours, as the README says.

## Lady Ginnem (`ginnem`): 7.5, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 10 | The O-3 B pixels exactly, including the soft rim glow and motes, with the body at 0.88 alpha. There are no partial-alpha surprises: 0 pixels at full alpha is the pick's design. |
| Anatomy | 7.5 | Head, neck and shoulders are sound, and the long train is in proportion. The far arm is hidden. |
| Hands | 6.5 | **Defect.** The one visible hand has a fingerless glove, and its fingertips are a lumpy pink strip: four fingers cannot be counted at 2x. At game size the hand is about 6 px. |
| Costume | 7.5 | It matches the Belgemine design words (§6.3 via the README): forehead mark, side hair ornaments, bands above the elbow, fingerless glove and orange at the obi. The "lattice bell cuffs" came out as a dark bracer, and the red tassel at the obi is missing. |
| Seams | 8 | There are no repairs, so there are no seams. |
| Edges | 7.5 | Soft alpha by design. The glow is even, and the motes sit on the outline. Because the body is at 0.88 alpha, 12 % of the backdrop shows through her. |
| Finish | 7.5 | A brown smudge on the lavender train, left of centre above the hem (about x 200-260, y 1040-1060), reads as a stain. |
| Read at game size | 7 | At 161 px under the scene's blue light, the navy and lavender robe goes dark. The glow carries her as a pale unsent outline, and the face and hair still read. That is the look Bailey picked, so it holds. |

**Worst: the sourced white face make-up (§6.3, "a palette swap of Belgemine with white face make-up") does not read as make-up.** The face is ordinary pale anime skin. It does not contradict the source, but the source is barely met. The builder's pixel lift made no visible change, and I agree with dropping it.

**Other research notes:**

- The hand is the worst painting defect.
- Her fair hair is not sourced either way. §6.3 gives no colours, so the painting contradicts nothing.
- She forms out of pyreflies (§6.2 beat 3). The baked glow is a stand-in until a live effect exists.

## The chamber (`cavern-stolen-fayth`): 8.0, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 9 | The picked cold plate: grey-blue walls, a stalactite ceiling, the daylight shaft and a lit floor patch. The diff is confined to the two repairs. |
| Seams | 7.5 | The pad's grain and light match the floor, and I found no hard inpaint edge at 3x. At 2x, a very faint darker ghost of the removed diamond rock remains at about (345-400, 440-500). It does not show at game size. |
| Finish | 8 | Painterly, consistent and free of artefacts. The pad is slightly softer than its surroundings. |
| Read at game size | 8 | The cold plate gives gold-and-purple Yojimbo the most contrast in the HUD frame. The 390x844 composite's small HUD is a layout issue, not a painting issue, as the builder noted. |
| Research | 8.5 | "a large open cave room with a teleport pad in the middle (dormant until after the battle)" (§6.1): it is a large cave, the pad is in the middle of the floor, and it is unlit. A daylight crack fits "in a gorge". There is no contradiction. |

**Worst: the pad reads as raised machinery rather than a stone floor pad.**

- It has spoke struts, a thin vertical pin at its centre, and a front wall that makes it look like a raised disc.
- The sources place the pad but do not describe it, so this is our design and does not contradict them.
- If Bailey wants it quieter, erase the centre pin (pixel-only).

**Framing (not a painting issue):** where the pad lands relative to the party belongs to the scene owner. The whole-plate composite puts it under the bottom HUD band.

## Summary for the driver

- All four are faithful to Bailey's picks. None of them invents a colour, costume piece or prop that the pick did not have, apart from the pad, which the research requires.
- All four read at game size in the real 1600x900 frame.
- **The two sub-7 defects** are Daigoro's ragged paw undersides and Ginnem's unreadable glove fingers. Neither shows at game size, and Daigoro's is a cheap pixel fix.
- **The one research gap to disclose to Bailey** is Yojimbo's slim build and plain pauldrons against the research's "colossal" and "top-heavy pauldrons with gold spirals". It came with the pick. Approve or re-option it; do not silently repaint it.
- All four remain CANDIDATES. Nothing here goes into `approved-hashes.json` without Bailey.

YOJIMBO: PASS
DAIGORO: PASS
GINNEM: PASS
CHAMBER: PASS
