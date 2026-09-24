# Independent 1:1 art judge 2: Seymour r3 idle, Seymour hurt facing, Guardian r3 idle, goon options

Date 2026-09-24. Judge: an independent sub-agent that made none of this art. **Everything judged here is a CANDIDATE or an OPTION**
for Bailey (AGENTS.md rule 9). Nothing was installed, repainted or rendered; ComfyUI was not used.

Game case: **Macalania (sections 1 to 3) is FFX only** (chapter 7; human-form Seymour and the Guado Guardians of
this fight exist only in FFX). **The goons (section 4) are FFX-2 only** (chapter 6, Chateau Leblanc, Act I).

**Method.** PIL crops at 1:1, 2x, 3x and 4x on grey, dark navy and green grounds, set against the concept pick or the
research lines. I also ran my own battle captures at 1600x900: seed 1, `PYREFLY_BROWSER=gpu`, renderer
`ANGLE (NVIDIA, NVIDIA GeForce RTX 5070 Ti (0x00002C05) Direct3D11 vs_5_0 ps_5_0, D3D11)`, my own Vite on port 5620
with `--strictPort`, stopped by PID (Macalania used the repo config; the goons used `leblanc/goons/vite.goons.config.mjs`
with its scratch variants A/B/C, and `ACTIVE` was reset to empty afterwards). The evidence crops and frames are not
committed; they are in `D:/Tools/tmp/judge2/` (`ingame/mac-idle.png`, `ingame/mac-hurt.png`, `ingame/goons-{A,B,C}-idle.png`,
plus the crops named below). **The bar is 7 on every criterion. The worst criterion decides.**

## Verdict table

| Subject | Worst criterion | Worst score | At bar? |
|---|---|---|---|
| Seymour Macalania idle r3 (935674f) | cut-out edges / ear seam / hands | 7 | **Yes** |
| Seymour `hurt.json` facing "left" (f5b50472) | facing | 9 | **Yes (correct)** |
| Guado Guardian idle r3 (f5b50472) | in-game read (bloom) | **6** | **No**, on the in-game read only; the pixels are at bar |
| Dr. Goon A | seams (necklace paint-out) / costume | 5 | No |
| Dr. Goon B | cut-out (trapped white slab) / costume | 5 | No |
| **Dr. Goon C** | hands, cut-out (boot shadow) | 7 | **Yes** |
| Fem-Goon A | facing in the battle proof (faces away) / in-game read | 5 | No as shown; the pixels alone would be 6 (anatomy) |
| Fem-Goon B | repair finish (face mask recolour) | 5 | No |
| **Fem-Goon C** | anatomy (flat black far leg), in-game size | 7 | **Yes** |

## 1. Seymour Macalania idle r3 against concept "Seymour B"

The source is `public/art/characters/seymour-macalania/idle.png` (804x1191, sha edb8a444..., binary alpha, 430,371 opaque px).

| Criterion | Score | Evidence |
|---|---|---|
| Identity to the concept | 9 | Side by side with `renders/seymour-b.png`, every region outside the three repairs matches the concept: face, fringe, crossed arms, chest tattoo, green sash, chain, hem lattice, hair locks. |
| Identity to research §9.2 | 7 | Ears are now "rounded, human ears, not the Guado's elf ears" ✓. Dark blue with red trim and a green sash ✓. Open chest with tattoo ✓. Sleeves swallow the hands ✓. He has no staff ✓. **Missing: "pronounced facial veins"** (the face has none). The concept did not have them either, and adding them would repaint the face Bailey picked, so it is his call. |
| Anatomy | 8 | The tall, narrow figure and the stance read cleanly. |
| Hands | 7 | The one visible hand (3x crop `sarm.png`) lies over the sleeve with four long, pale-nailed fingers. They read as pointed, as §9.2 asks, but the finger separation is soft. |
| Costume | 8 | These are the concept's pixels. |
| Cut-out edges | 7 | At 4x (`sedge.png`), the halo peel left **several detached pale strand fragments** beside the fringe, to the left of the cheek, at about x 290-320 and y 60-130. A faint pale diagonal line also sits on the top edge of the fringe. On a dark ground (`shair.png`) the hair tips keep a 1-px pale rim. None of this is visible at game size. |
| Seams: ear repair | 7 | At 2x (`sface.png`) the new rounded ear sits naturally and the hair flows past it. At 4x (`sear.png`) there is a grey-teal oval in the concha that reads like a small eye. It is inherited from the concept's ear base. It is invisible in battle. |
| Seams: hem repair | 7 | At 1:1 (`shem.png`) the closed corner is plain dark cloth. It is flatter than the folds around it and ends in a small sharp point. It does not read as a crop anymore. |
| Finish | 8 | The render quality is uniform. |
| In-game read at 1600x900 | 8 | In `mac-idle.png` he is the dominant figure. The silhouette is clear against the ice windows, the hem lattice reads, and the new ear reads as human at this size. The dark lower robe against the dark floor is the one soft area. |
| Facing | 9 | The pixels face screen-left. The sidecar says "left". In battle `planeScaleX` is +2.81, not mirrored, and he faces the party. |

**Verdict: AT BAR (worst 7). Installing it as the candidate is justified.** Optional polish, which needs no re-render:
delete the detached strand fragments beside the face (about 30 px), and paint out the grey-teal spot in the ear bowl.

## 2. Seymour `hurt.json` facing

`hurt.png` at 2x (`hurthead.png`): the nose and lips are on the **left** of the head and the ear on the right. The hair falls down his back on the right. The emblem sleeve is on the right. **The pixels face screen-left.** The sidecar now says `"left"`. In my battle capture (`mac-hurt.png`) `planeScaleX` is **+2.71**, not mirrored, and he recoils toward the party. **The fix is correct.** Note the history: this field has been flipped twice (left, then right on 09-22, then left on 09-23). The 09-22 note ("hurt pixels face screen-right") was wrong.

Outside the facing question, I found two things that are not in the brief's scope. Both are recorded for the driver:
- **The hurt pose does not share r3's identity.** It has straight, un-voluminous hair, a lime sash, a red emblem on the sleeve and no hem lattice. I would score its identity against the r3 idle at 5. METHOD-CHECK §2 map A would derive hurt from the new idle.
- **In battle the hurt face is burnt white by the bloom** (`ing_hurt.png`): the head is a glowing blob. This is the PR-0097 family, a presenter issue. 9.4% of the hurt's opaque pixels have luma above 0.85, against 2.8% for the idle.

## 3. Guado Guardian idle r3 against concept "Guado Guardian A"

The source is `public/art/characters/guado-guardian/idle.png` (826x1153, sha 963b58ee..., binary alpha, 310,283 opaque px).

| Criterion | Score | Evidence |
|---|---|---|
| Identity to the concept | 9 | The side by side (`gua.png`) shows the hood, hair tendrils, crest, spear, dark shoes and green trim identical to the pick. |
| Identity to research §9.3 | 7 | Elf-like ears ✓. Pronounced veining on the forearm ✓. Tall and narrow ✓. Ochre and green robes ✓. "Long pointed fingers" are not shown, because the hand is a closed fist. **No belt pouch** (§9.3 "Give them a belt pouch that is visibly full and then visibly empty"). That line is a `[derived]` painter's note, not game data. The concept Bailey picked has no pouch, so adding one is his call; the pouch pilot on the r3-guardian sheet is the option for it. |
| Anatomy | 8 | The figure is well proportioned. The bowed head reads as subordinate. |
| Hands | 7 | At 2x (`ghand.png`) the fist around the shaft is readable but mushy: the fingers are not separated and the knuckles are blocky. |
| Costume | 8 | These are the concept's pixels. |
| Cut-out edges | 7 | The regrown hair tails are clean at 2x on navy (`ghead.png`). The crescent blade interior is clean. At 2x on grey, the bright hem keeps a dotted 1-px warm rim (`ghand.png`, right tile). It cannot be seen on the dark stage. |
| Seams | 9 | There are none; the art was not repainted. |
| Finish | 8 | The finish is uniform. |
| **In-game read at 1600x900** | **6** | In `mac-idle.png` / `ing_gua.png` the pale-yellow robe highlights **bloom into glowing cloth**. The lower back of each robe is the brightest thing on stage after the windows, which works against §9.3's "subordinate in silhouette to Seymour … furniture that moves". I measured it: **16.0% of the r3 idle's opaque px have luma above 0.9, against 0.3% for the idle it replaced** (and 1.9% for Seymour's idle). This explains why the old pair (backup, `r3-guardian/ingame-installed-pair.jpg`) did not glow. The blue face is small and dark against the dark hall. |
| Facing | 9 | The pixels face left. The sidecar says "left". `planeScaleX` is +2.08 on both Guardians, so they face the party. |

**Verdict: the pixels are at bar (worst 7), but the in-game read is BELOW BAR (6).** Of everything in this round it is
the most visible flaw. There are two remedies, and neither needs a re-render:
1. **Presenter-side (the driver, src/):** a per-actor bloom exclusion or a higher bloom threshold for enemy planes. It also fixes Seymour's hurt face. This is the better fix, because it keeps Bailey's pixels.
2. **Art-side (Bailey's call, because it departs from his pick):** compress the values of the robe highlights, for example map luma above 0.85 down to about 0.8 while keeping the hue. This changes about 16% of the pixels in a way that stays close to the original.

The r3 idle is still better than the idle it replaced (which had the wrong identity: ponytail, bare feet, halberd). Keeping it installed as the candidate is reasonable while one of the two remedies is chosen.

## 4. Goon options (FFX-2 only)

The sources are `D:/Tools/pyrefly-lora/goons/r3/out/` (the `picks.json` files). The research line is
`research/ffx2-leblanc-syndicate.md` §10.1: "masks and skin-tight suits; pink for the women, army green for the men". The battle check is mine
(`goons-{A,B,C}-idle.png`). All six are small on stage (goons 96-140 px tall against Ormi's 125-156 px, at the same camera).
That is the engine scale, as the options agent noted.

| Option | Identity vs §10.1 | Anatomy | Hands | Costume | Edges / seams | Finish | In-game | Facing in battle | Worst |
|---|---|---|---|---|---|---|---|---|---|
| Dr-A balaclava | 7 | 7 | 7 (the fist pressed to his own eye is awkward) | **5**: baggy knee-bunched trousers, not skin-tight; the recoloured loincloth reads as a glossy scarf over a **bright-green thong patch** at the crotch | **5**: the necklace paint-out left a grey-green smear with white bead specks at the neck, above the heart (2x `misc.png`) | 7 | 7 | faces the party ✓ | **5** |
| Dr-B hood | 6 (hood and jacket rather than a skin-tight suit) | 7 | 7 | **5**: tabard, belt, buckle, **heeled boots** | **5**: a **trapped white background slab**, about 15x45 px, between the tabard panels at about x 315-330, y 650-700 (3x `drBgap.png`) | 7 | 7 | ✓ | **5** |
| **Dr-C domino** | 8 (skin-tight olive, mask, heart) | 8 | 7 | 7 (black harness lines; the crotch line is a little leotard-like) | 7: a pale-blue floor-shadow sliver under the right boot's arch, about x 400-440, y 1115-1125 (3x `drCboot.png`) | 8 | 8: the strongest read of the six; the grin reads at game size | mirrored from "right", faces the party ✓ | **7** |
| Fem-A balaclava | 8 | 6 (very narrow torso and limbs; in battle a 29 px wide pink mannequin) | 7 | 7 (the hot magenta is off the other pinks) | 7 | 7 | 6 | **✗ faces AWAY.** The pixels face screen-left (chin, chest and boot toe point left), but `picks.json` says "right", so the engine mirrors her (`planeScaleX` -0.32) | **5** as shown |
| Fem-B hood | 7 | 7 | 7 | 6 (red splash, not a heart) | **5**: the recolour turns the lower face into a flat pink blob with no mask edge, a lavender band remnant at the neck left of the chin, and green-yellow tint remnants by the eye (3x `femB.png`) | 5 | 7 | ✓ (the pixels face right, mirrored) | **5** |
| **Fem-C domino + fan** | 8 (skin-tight pink, mask, and the fan fits sourced Fan Slap) | 7: the far leg is a flat black silhouette strip behind the near leg (2x `femC.png`) | 7 | 7 (lavender and black back panel) | 7 | 8 | 7 | ✓ | **7** |

**At the bar: Dr. Goon C and Fem-Goon C** (a matched C/C pair). **Below the bar: Dr-A, Dr-B, Fem-A (as shown) and Fem-B.**
Fem-A's facing is only a sidecar value. If Bailey likes her anyway, set `facing: "left"` at install. Her pixels would then
score 6 (anatomy), still below the bar. **Correction to the options report:** it says "All three matched pairs … face the
party". Fem-A does not.

## Findings for the driver and Bailey
1. **The Guardian bloom is the top visible issue in chapter 7's enemy line**, and it has a measured cause (16% of the pixels have luma above 0.9). The fix belongs in the presenter (src/, out of this judge's scope). Otherwise it is Bailey's call on an art-side value compression.
2. The Seymour hurt facing is now correct. The hurt identity and the bloom-washed face remain; derive the hurt from r3 per METHOD-CHECK §2.
3. The Seymour idle meets the bar. Facial veins (§9.2) are still unrepresented and need Bailey's call.
4. Goons: offer **C/C** as the pair at the bar. Fem-A's option sidecar in `picks.json` has the wrong facing.
5. Drive C: now has about 39 GB free, so the 0-byte condition earlier reports mentioned has cleared.
