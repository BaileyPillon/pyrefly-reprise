# Chapter XIII (Trema): independent 1:1 judge of the production art

**Game case: FFX-2 only.** Trema, Paragon and Cloister 100 of the Via Infinito exist only in FFX-2
(`research/ffx2-trema.md` §0). No FFX chapter uses these files.

- **Judge:** an independent sub-agent, 2026-09-25. I made none of this art and changed none of it.
  I wrote this report and, for the paintings that pass, the lock in `docs/target/approved-hashes.json`.
- **What I judged:** the five installed candidates from commit `6896b272`. Their sha256 values match
  the sidecars and `INSTALLED.md`:
  - `characters/trema/idle.png`: `77b4cba2…0f0903`
  - `characters/trema/cast.png`: `744cc150…93e506`
  - `characters/paragon/idle.png`: `0e3972b5…e569b9`
  - `characters/paragon/cast.png`: `f2f2300b…12a7d`
  - `backdrops/via-infinito.png`: `82eedcd3…b47fa`
- **Compared with:** each subject's pick. That is O-1 A `trema/a-priest-card.jpg`, O-2 A
  `paragon/a-gold-card.jpg` and O-3 B `cloister/b-repaint-plate.jpg`. For the plate I also used the
  picked render itself (`D:/Tools/pyrefly-scratch/trema-options/renders/cloister-b2.png`).
- **Also checked against:** `research/ffx2-trema.md` §6.1 and §6.2, and the plan's Review
  (`docs/plans/chapter-trema-review.md`, "O-1 A lacks the torn robe").
- **How I looked:**
  - Each figure at 1:1 on mid grey and on a dark card colour.
  - 2x to 4x nearest-neighbour crops of these areas:
    - Trema: the face, both hands, the stole crest, the torn hem and the rip, and the cast's shoulder seam next to the idle's.
    - Paragon: the head, the erased blade's path, the opened claw pockets, and the cast's mane, tail and feet edges.
  - The plate at half size and at 1:1 (the centre emblem and the hanging banners).
  - The builder's real engine frames at 1600x900 (`production/frames/*-clean.jpg`), with a 2x crop of Paragon's feet in idle and cast. In those frames Trema is about 302 px tall and Paragon about 419 px.
  - Pixel checks:
    - alpha histograms and connected parts;
    - near-white pixels on the matte border (opaque pixels at alpha > 16 that touch transparency, all three channels > 225);
    - cut-out margins;
    - the plate's difference from the picked render.

Scale: 10 = nothing to fix. **The bar is 7 on the overall score.** A sub-score under 7 is named as a
defect, and I say whether it shows at game size.

## Pixel checks

| File | Parts | Near-white on the border | Soft alpha | Margins L/R/T/B |
|---|---|---|---|---|
| Trema idle | 1 | 234 (the white robe itself) | 3,611 px | 16 / 27 / 16 / 22 |
| Trema cast | 1 | 258 (the white robe itself) | 3,829 px | 16 / 27 / 16 / 22 |
| Paragon idle | 9: the body plus 8 specks of 1 to 9 px | 20 | 0 (binary) | 16 / **12** / 16 / 16 |
| Paragon cast | 1 | **2,030** (median alpha 53) | 32,776 px | 16 / 16 / 16 / 16 |
| Plate | n/a | n/a | n/a | MAD **0.0** against `cloister-b2.png` |

## Trema idle (`trema/idle.png`): 7.7, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 9 | These are O-1 A's pixels: the tall black hat with its red band, the white beard, the ivory coat, the black and red stole, the raised hand and the trailing sash. The changes are the torn robe, the grey-green face and the red disc in the crest. |
| Anatomy | 7.5 | A believable old man standing upright in three-quarter view. The robe hides the feet, which is right for a floor-length robe. |
| Hands | 7.5 | Both hands have fingers that can be counted at 2x. The raised hand is open with the thumb out, and the lower hand hangs relaxed. |
| Costume and research | 8.5 | The sourced detail is now there. §6.2 describes "an old man in a torn Yevon priest's robe", and the review found the pick lacked it. The rest matches the README's look notes. The crest is now a round red disc in a gold ring. |
| Face grade | 8 | The face now matches the hands' grey-green, with no seam at the beard or the hairline. |
| Tears (the repair) | 7 | They read as torn cloth: a ragged black hem, a jagged white train, and a notched red lining tip. The one lens-shaped rip in the coat panel reads as a rip. The edges are cut rather than painted: scalloped bites with no fray threads. The 2 px darkened rim shows as a thin pale-grey outline on a dark ground, not as ink. Along the red lining tip there are a few light specks. |
| Edges | 7.5 | One connected part. The soft edge is narrow. The near-white border pixels are the white cloth itself, not a matte. |
| Read at game size | 8 | At 302 px on the teal plate, the white robe, red stole and black hat read at once. The torn hem reads as a ragged hem. |

**Worst: the tear edges are cut, not painted.** A pale-grey rim on the bites stands where an ink line would be, and there are no fray threads. This shows on a dark ground at 1:1, and not at game size.

## Trema cast (`trema/cast.png`): 7.1, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity | 9 | The idle's pixels (88.2 % equal), with the same tears, face and crest. |
| Gesture | 6.5 | **Defect (read).** The hand rises about 95 px to beard height. That is a modest change. At game size it reads as "raises his hand", not as a new casting pose. |
| Anatomy | 7 | The stretched sleeve is taller and plain, and it hangs plausibly from a raised forearm. The cuff and wrist were repainted cleanly. |
| Hands | 7.5 | The raised hand is the idle's hand, and its fingers are readable. |
| Seams | 6 | **Defect.** The repaint at the top of the lifted sleeve left artefacts, visible at 2x to 4x: (1) a green and teal fringe of dots on the sleeve's inner edge, at about x 312-322, y 300-345; (2) a short column of white dots, like a broken bead string, at about x 305-311, y 395-425; (3) a flat, stepped top edge on the sleeve, at about x 255-315, y 271-280. At game size they are 1 to 3 px and do not show. |
| Edges | 7.5 | One connected part. Same margins as the idle. |
| Read at game size | 7.5 | In `trema-cast-clean.jpg` the raised hand beside the face reads clearly against the plate. |

**Worst: the shoulder-seam artefacts, then the modest gesture.** A pixel-only fix is enough, with no GPU: close the sleeve's top edge with its own outline colour, and replace the dot column and the green fringe with the neighbouring sleeve white and stole red. Neither shows at game size.

## Paragon idle (`paragon/idle.png`): 7.7, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 9 | O-2 A's pixels: the gold and black armoured quadruped, the curled horns, the crown of spikes, the brown mane, the dark tail and the red eyes. The only differences are the removals. |
| The blade erase | 8.5 | The loose curved blade is gone, and it leaves no ghost on the mane or the far foreleg. |
| Anatomy | 7 | A plausible crouching beast. The far foreleg is painted paler and bluer than the rest of the body, as it was in the pick. It reads as distance, but it is a little ghostly. |
| Claws | 7.5 | The gold claws on the near foreleg and the hind foot are crisp. |
| Pocket openings | 7 | The opened white pockets between the near foreleg and the hind leg leave a scalloped, chewed dark outline, at about x 665-740, y 570-760. It reads as fur shadow at game size. |
| Edges | 7.5 | Binary matte with only 20 near-white border pixels. There are 8 detached specks of 1 to 9 px. The right margin is 12 px; the other three are 16. |
| Research | 8 | §6.2 sources only that Paragon uses FFX's Nemesis model. An armoured beast with curled horns does not contradict that. The look is ours, as the README says. |
| Read at game size | 8.5 | At 419 px the gold stands clearly apart from Trema's ivory and from the teal room. This is the strongest read in the chapter. |

**Worst: the paler, ghostly far foreleg (from the pick), then the chewed pocket outline.** Both are small. If anyone touches the file again, they could remove the 8 specks.

## Paragon cast (`paragon/cast.png`): 7.1, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity | 9 | The idle rotated back 12 degrees. No pixel was repainted. |
| Pose | 6.5 | **Defect (the risk the builder named).** It is a rigid pitch of the whole body. The hind legs lean with the body instead of bending, and the tail tilts as one piece. At 1:1 it reads as a tilted card. In the engine frame it reads as the head and chest rising, which is enough for a cast cue. |
| Edges | 6 | **Defect.** There is a dotted light fringe around much of the silhouette: 2,030 near-white border pixels at a median alpha of 53, against 20 in the idle. The cause is the idle's opened pockets and peeled halo: they kept white RGB under alpha 0 (7.9 % of the transparent pixels that touch the body), and the rotation blended that white into the new soft edge. On a dark ground at 1:1 it shows along the mane tips, the tail and the feet. In the engine frame the scene's blue rim light covers it, and I could not see it at 2x. |
| Seams | 8 | There are none. |
| Finish | 7.5 | The 2x bicubic rotation softens the painting very slightly. |
| Anchor | 7.5 | `anchorY 0.9659` keeps the hind foot on the floor in the frame. |
| Read at game size | 7.5 | In `paragon-cast-clean.jpg` the raised head reads as rearing. |

**Worst: the light edge fringe, then the rigid pose.** Here is a pixel-only fix for the fringe. Set the idle's RGB under alpha 0 to black, or to the nearest body colour, in the builder's working copy (not the installed idle), and run `pararear.py` again. Or defringe the cast's partial-alpha edge. Either way the cast's sha256 would change, so it would need to be judged and locked again.

- **Note for the engine:** Paragon's idle has the same white RGB under alpha 0 in those pockets. A straight-alpha texture sampled with filtering can bleed that white at small sizes. I saw none in the frames.

## Cloister 100 (`backdrops/via-infinito.png`): 7.6, PASS

| Criterion | Score | Why |
|---|---|---|
| Identity to the pick | 10 | MAD 0.0 against the picked render `cloister-b2.png`. It is O-3 B unchanged. |
| Composition | 8 | A tall, symmetrical teal hall with a round gold emblem over a central door. The floor is lit and reflective, with lamp panels on both walls and banners hanging from the vault. It reads as one large room, which the research says Cloister 100 is (§6.1). |
| Finish | 7 | This is an img2img at 0.7. At 1:1 the emblem and the vault's lattices are soft and slightly melted, and the banner ends are smudged gold. There are no hard seams or artefacts. |
| Research | 6.5 | **Defect (research gap, came with the pick).** §6.1 sources "upside-down banners bearing Yu Yevon's likeness". The plate's banners are plain white strips with no image, and nothing marks them as upside down. The review already put this to Bailey, and it is still his call. The glowing wall panels are warm gold, not the "cold lamp panels" the README described. |
| Read at game size | 8 | Under Chapter IV's staging the teal hall sets off both bosses. Paragon's gold separates, and Trema's white reads. The staging crops the vault, where the banners hang. |

**Worst: the banners carry no likeness and do not read as upside down.** That was already in the pick. Disclose it; do not repaint the plate on this judge's say-so.

## The link (O-2b): not a painting

`production/frames/link-{1,2,3}.jpg` are staging stills: a dissolve and motes that stand in for
particles, plus the installed poses. There is nothing in them to lock. The staging matches the picked
strip (`paragon/sheet-link.jpg`).

## Summary for the driver

- **All five paintings pass the bar** and match Bailey's picks. The only additions are the ones the plan and the review asked for:
  - the torn robe, which is the sourced detail the review found missing;
  - the grey-green face and the red crest, which were the README's to-fixes;
  - Paragon without the loose blade.
- **Sub-7 defects, none visible at game size:**
  - Trema cast: the shoulder-seam artefacts and the modest gesture.
  - Paragon cast: the light edge fringe and the rigid pitch.
  - Plate: the research gap on the banners.
- **Cheap pixel fixes, if wanted.** Each would change the file's hash and needs a judge and a lock again:
  - Trema cast: close the seam.
  - Paragon cast: clear the white RGB under alpha 0 and rotate again.
- **For Bailey:** an original rendering of Yu Yevon's likeness on the banners is still undecided (review, O-3).
- Locked as set `chapter:trema:2026-09-25` in `docs/target/approved-hashes.json`. The backup is `D:/Tools/pyrefly-art-backup/approved/2026-09-25-trema/`.

TREMA IDLE: PASS
TREMA CAST: PASS
PARAGON IDLE: PASS
PARAGON CAST: PASS
CLOISTER 100: PASS
