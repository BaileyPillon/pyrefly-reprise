# Independent 1:1 art judge 3: Macalania r3 cast/hurt poses and Seymour speaker portraits

Date 2026-09-24. Judge: an independent sub-agent that made none of this art. **Everything judged here is a CANDIDATE or an
OPTION** for Bailey (AGENTS.md rule 9). Nothing was installed, rendered or repainted; ComfyUI was not used.

**Game case: FFX only.** Chapter VII (`seymour-anima-macalania`): human-form Seymour and the Guado Guardians of this fight
exist only in FFX.

**What was judged.**
- Poses (commit 1b97cb55): `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-mac-r3-poses/{seymour-macalania,guado-guardian}/{cast,hurt}.png`,
  against the anchors `public/art/characters/seymour-macalania/idle.png` (r3, judge 2: at bar, 7) and
  `public/art/characters/guado-guardian/idle.png` (r3, pixels at bar).
- Portraits (commit 38e5b539): `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-seymour-macalania-portrait/final-{A,B,C}-*.png`,
  against the r3 idle (identity) and the approved Auron and Yunalesca speaker portraits (finish), plus the four 1600x900
  dialogue cards in `docs/concepts/portraits/seymour-macalania/`.

**Method.** My own PIL crops, idle beside candidate, at 1:1, 2x, 3x and 4x on grey and dark navy grounds (nearest-neighbour
enlargement). For the read at game size I used the builder's in-battle 1600x900 frames and 1:1 actor crops on
`r3-poses/sheet.jpg` (GPU renderer, same seed and flinch frame for hurt and none); I did not re-run the battle. I also
re-read the builder's `*.gates.json`: canvas equal to the idle, 0 invented colours, 0 soft alpha, no change outside the
changed regions. **Bar 7 on every criterion; the worst criterion decides.**

## Verdict table

| Candidate | Worst criterion | Worst | At bar? | Recommendation |
|---|---|---|---|---|
| Seymour `cast` | hands (raised hand is a flat pale paddle with a hard, jagged black outline) | **5** | **No** | Keep the hair and the lean; one masked repair of the hand only |
| Seymour `hurt` | edges (the idle's own), read at game size (mild) | 7 | **Yes** | Beats "none", narrowly |
| Guardian `cast` | anatomy (kinked wrist), seams (stray green fragment and dark specks on the shaft) | **6** | **No** | Keep the rotation; repair the wrist bend and clean the fragments |
| Guardian `hurt` | seams (ragged dark blob under the fist, smudge beside the shaft); read vs none is a tie | **6** | **No** | **None** (engine `hurt -> idle` fallback) |
| Portrait **A** (0.45) | finish (flat paper-white skin, harsher cel than Yunalesca), costume (no veins) | 7 | **Yes** | Best option; at the bar, not above it |
| Portrait B (0.52) | finish (blotchy lavender smears on the robe; brow and cheek furrows read as age lines, not veins) | 6 | No | |
| Portrait C (0.62) | costume (invented studded collar at the throat) | **5** | No | Only with the masked collar repair the builder disclosed |

**Worst of the batch: Seymour `cast`, hands 5.**
Cast vs hurt are clearly distinguishable for both subjects (Seymour: blown hair and raised hand vs a backward lean;
Guardian: near-vertical spear vs a slight lean with the spear low).

## 1. Seymour `cast`

| Criterion | 1:1 | 2x | Evidence |
|---|---|---|---|
| Identity | 9 | 9 | Face, fringe, ear, tattoo, sash and hem are the idle's pixels. |
| Anatomy | 7 | 7 | The 8 degree lean toward the party is a smooth waist bend; there is no seam at the band. |
| Hands | **5** | **5** | The idle's four fingers are turned upright into one flat pale shape before the chest (about x 255..300, y 250..335). There is no thumb, no nail, no knuckle, and the finger separation is only faint lines. Its skin tone equals the pale chest behind it, so it merges into the abs. At 4x it reads as a mitten cut out of card. |
| Costume | 8 | 8 | Unchanged apart from the sleeve. |
| Seams | 6 | 6 | The hand keeps the idle's heavy black outline on its new sides, jagged at 2x and above. The repainted sleeve where the fingers were is clean, apart from one 1 to 2 px dark speck (about 344, 284). |
| Edges | 7 | 6 | The warped back locks carry pale 1 px fringe and stair-stepped edges at 2x, a little worse than the idle's. At 1:1 they pass. |
| Finish | 7 | 7 | The repaint matches the robe; there is no invented colour (gates). |
| Read at game size | 7 | | The hair streaming toward the back reads as casting at once. The hand reads only as a pale blob on the chest. |

**Repair, not re-render:** a masked repaint of the hand alone (thumb, pointed nails as the idle's §9.2 fingers, a
softer outline, a shade that separates it from the chest). Keep the hair and the lean as they are.

## 2. Seymour `hurt`

Identity 9, anatomy 8 (smooth bend, no band seam at 2x), hands 7 (the idle's), costume 9, seams 8 (no painted pixels),
edges 7 (the idle's own), finish 8. **Read at game size 7:** in the in-battle crops the head and shoulders sit visibly
further back than in "none", which looks like the idle. It is mild, but it is not a tie. **At bar; it beats none, narrowly.**
This also replaces the installed non-r3 `hurt.png` that judge 2 scored 5 on identity.

## 3. Guado Guardian `cast`

| Criterion | 1:1 | 2x | Evidence |
|---|---|---|---|
| Identity | 9 | 9 | Head, hair ribbons, ears and eye glow are the idle's pixels. |
| Anatomy | 6 | **6** | The last 45 px of the forearm bend sharply into the rotated fist, so the wrist reads as kinked, almost broken, at 2x. |
| Hands | 7 | 6 | The fist is the idle's, turned rigidly, but a dark notch sits where the knuckles meet the shaft. |
| Costume | 7 | 7 | The spear is intact. The crescent head now rests against the robe at knee height, close to the hem; that is legible, not wrong. |
| Seams | 6 | **6** | There is a stray green hooked fragment touching the shaft just above the fist (about 285, 490), and 2 to 3 dark specks along the shaft's path over the repainted robe. There is a small dark notch where the shaft leaves the robe edge. |
| Edges | 7 | 7 | Clean binary cut, no halo. |
| Finish | 7 | 7 | The robe repaint follows the idle's folds and palette. |
| Read at game size | 7 | | The near-vertical spear is clearly different from the idle and from the hurt. It reads more as "staff raised" than as a spell, and the engine's flash carries the spell. |

**Repair:** smooth the wrist bend over a longer run of the forearm (or rotate the fist less), delete the green
fragment and the specks. Keep the rotation.

## 4. Guado Guardian `hurt`

Identity 9, anatomy 7, costume 8, edges 7, finish 7. **Hands 6 / seams 6:** at 2x a ragged dark blob sits under the
knuckles where the fist meets the robe, a dark smudge lies on the robe beside the shaft (about 405, 600), and the lower
edge of the shaft is ragged. **Read at game size: tie with "none".** In the in-battle crops the hurt and "none" frames
are almost indistinguishable: the 10 degree lean moves the head only a few screen pixels, and the pale-robe bloom
(judge 2, PR-0097 family; present in every frame, not caused by this candidate) swamps the rest. By the builder's own
rule a tie goes to none. **Recommendation: ship no Guardian hurt file.**

## 5. Seymour speaker portraits A / B / C

| Criterion | A | B | C | Evidence |
|---|---|---|---|---|
| Identity to the r3 idle | 8 | 7 | 7 | All three keep the light-blue loose hair, fringe, purple eye, human ear, red collar and dark blue robe. A is the idle's stern profile. B's brow and cheek furrows age him. C's smile and the eye turned toward us drift furthest. |
| Anatomy | 7 | 7 | 7 | The far eye peeks past the nose bridge in A and B, a normal three-quarter convention. B's ear reads a little large. |
| Hands | n/a | n/a | 7 | C's crossed-arm hand has four clean fingers at 1:1. |
| Costume | 7 | 7 | **5** | Veins are missing (A, C) or read as wrinkles (B), as disclosed. C has **an invented dark studded collar at the throat** (visible at 1:1 and 2x). |
| Seams / edges | 8 | 7 | 7 | The rembg cut is clean. B has a black stud-like mark on the ear. |
| Finish vs the approved set | 7 | **6** | 6 | All three use flat, near-white skin and pure black cel shadows. That is close to Auron's cel language, but harder than Yunalesca's. A's robe is clean. B's robe has blotchy lavender smears and an orange-to-red collar gradient. C's robe shows purple streak artifacts. |
| Read on the 1600x900 card | 8 | 7 | 7 | All three read as the Chapter VII Seymour and match the battle sprite far better than the current Flux face. B's crop is tight and ear-heavy. C's collar falls below the plate. |

**A is at the bar (worst 7) and is the one to offer.** B and C fall below it. None of them rises above 7 on finish;
softening the skin shading toward Yunalesca would be the one improvement worth a masked pass. On the speaker id,
`seymour-macalania` is needed if any option is picked, because Chapter I keeps the Flux portrait under `seymour`. That
decision belongs to Bailey and includes a shared-contract change (`src/story/dsl.ts`).

## Evidence

The crops were made in `D:/Tools/pyrefly-scratch/judge3/tmp` and deleted afterwards, as the brief asks. They can be
regenerated with PIL from the candidate paths above. Crop boxes (idle | candidate): Seymour hand `(235,225,335,350)` at 4x,
hair `(380,40,660,300)` at 2x, waist `(180,380,520,640)` at 2x. Guardian fist `(230,420,580,720)` at 2x for cast and
`(250,380,560,720)` at 2x for hurt. Portrait faces `(110,180,540,740)` at 1:1 and eyes `(150,380,370,600)` at 2x.

## Re-judge of the two repaired casts (judge 4, 2026-09-24; FFX only, D-045 option A)

Judge: an independent sub-agent that made none of the repairs and none of the r3 art. **Both files are still CANDIDATES**
for Bailey; nothing was installed, rendered or repainted, and ComfyUI was not used.

**What was judged.** `D:/Tools/pyrefly-art-backup/candidates/2026-09-24-ch7-casts/{seymour-macalania,guado-guardian}/cast.png`
(commit 4b62f5ec, masked repaints on top of the r3 casts above), each beside its r3 idle
(`public/art/characters/<subject>/idle.png`) and the r3 cast judged in section 1 and 3.

**Method.** My own PIL crops, idle | r3 cast | repaired cast, at 1:1, 2x, 3x, 4x and 6x (nearest neighbour) on grey and dark
navy grounds, plus a whole-figure strip scaled to 300 px tall on navy for the read at game size (an approximation: I did not
re-run the battle, and the builder's in-battle frames on `sheet.jpg` predate the repair). **Re-measured myself:** the
repaired file differs from the r3 cast only inside `cast.repair-mask.png` (Seymour 3,477 px changed, Guardian 4,851 px;
**0 px changed outside the mask**); alpha is binary (0/255 only); every opaque pixel inside the mask lies within 12 RGB of
a colour already in the idle (maximum distance 8.7 for Seymour, 11.4 for the Guardian), which agrees with the builder's
"0 invented colours". Canvas equals the idle for both. **Bar 7 on every criterion; the worst criterion decides.**

### Verdict table

| Candidate | Worst criterion | Worst | At bar? | Was (judge 3) |
|---|---|---|---|---|
| Seymour `cast` (repaired) | hands (violet nail caps, glove-like flat white; fingers parted only by lines) | **7** | **Yes** | 5 (hands) |
| Guardian `cast` (repaired) | finish / seams (the forearm veins go soft and smudged in the repainted wrist; a thick dark rim under the wrist) | **7** | **Yes** | 6 (anatomy, seams) |

**Worst of the two: a tie at 7, both at the bar and neither above it.** Seymour's hand is the weaker by a small margin.

### Seymour `cast` (repaired)

| Criterion | 1:1 | 2x | Evidence |
|---|---|---|---|
| Identity | 9 | 9 | Face, fringe, ear, tattoo, sash and hem are the idle's pixels; nothing outside the hand changed since section 1. |
| Anatomy | 7 | 7 | The open palm rises before the chest from the sleeve with a plausible heel; at about 85 px long it is a little large for the head but not wrong. The lean is the smooth waist bend judge 3 scored 7. |
| Hands | **7** | **7** | A raised open hand: four fingers parted by lavender lines, a short thumb on the party side with its own nail, a thin ink outline on the thumb and heel. The jagged black paddle outline is gone. Below the bar-plus: the nails are small violet caps (robe colour), not the idle's pointed ink claws, and at 3x and above they read as blobs; the palm is a flat white, a little glove-like, with no knuckle cues; the fingertips have no outline where they meet the red collar. The idle's own crossed hands are slimmer and more articulated. |
| Costume | 8 | 8 | Unchanged apart from the sleeve. |
| Seams | 7 | 7 | The hand now sits in the chest with a thin, clean outline; no halo, no jag. The 1 to 2 px dark speck on the sleeve at about (344, 284) that judge 3 noted is still there (outside the repair mask); invisible at game size. |
| Edges | 7 | 7 | Hair locks as in section 1: pale 1 px fringe dots and small stair steps on the warped tips at 2x. I score 7 at 2x rather than judge 3's 6 because the idle's own lock tips carry the same pale fringe at 2x; the warp adds a few more dots, not a new defect. Not repaired, not required. |
| Finish | 7 | 7 | The hand matches the idle's skin language (pale lavender, lavender shading lines); the violet nails and the flat white keep it at 7. |
| Read at game size | 8 | | The streaming hair and a clear pale open palm before the chest read as casting at once; the hand is now a hand, not a blob. |

### Guado Guardian `cast` (repaired)

| Criterion | 1:1 | 2x | Evidence |
|---|---|---|---|
| Identity | 9 | 9 | Head, hair ribbons, ears and eye glow are the idle's pixels. |
| Anatomy | 7 | 7 | The forearm now turns into the fist in one smooth curve; the broken-wrist kink is gone. The wrist reads bent under load, which suits the raised spear. |
| Hands | 7 | 7 | The idle's fist, turned rigidly; the dark notch under the knuckles is gone, leaving a darker blue shadow there that reads as shading. |
| Costume | 7 | 7 | Spear intact; crescent head at knee height as before (legible). |
| Seams | 7 | 7 | The green hooked fragment above the fist and the dark specks along the shaft are gone at 1:1 and 2x; the shaft's edge over the robe is cleaner than the r3 cast. At 4x only, a thick dark rim under the wrist (the recoloured sampler line) and a small dark gap at the forearm's left edge just above the shaft. |
| Edges | 7 | 7 | Clean binary cut, no halo. |
| Finish | 7 | **7** | Robe repaint follows the idle's folds and palette. In the repainted wrist the forearm's vein line-work goes soft and smudged over about 40 px, less crisp than the idle's veins above it; visible at 2x, not at 1:1. |
| Read at game size | 7 | | The near-vertical raised spear differs clearly from the idle; "staff raised" more than a spell, as judge 3 said, and the engine's flash carries the spell. |

### Recommendation

Both repaired casts are at the bar (worst 7) and may be offered to Bailey as the cast state for Chapter VII, replacing the
installed non-r3 Seymour `cast.png` and giving the Guardian its cast. Neither is above the bar. If one more masked pass is
ever wanted: Seymour's nails as the idle's ink points and a little knuckle shading on the palm; the Guardian's vein
line-work through the wrist. The Guardian `hurt` stays "none" and the Seymour `hurt` verdict is unchanged (section 2).

**Evidence.** Crops made in `D:/Tools/pyrefly-scratch/ch7-casts/tmp/judge4/` (scripts `info.py`, `crops.py`, `col.py`;
regenerable from the candidate paths). Crop boxes (idle | r3 | repaired): Seymour hand `(215,225,335,350)` at 3x on grey and
navy and `(235,235,315,345)` at 6x, hair `(420,60,720,300)` at 2x, sleeve speck `(320,255,380,315)` at 5x; Guardian wrist
`(180,340,500,620)` at 2x and `(260,440,420,580)` at 4x, shaft `(230,560,500,870)` at 2x on navy; both whole figures at
300 px tall on navy.

SEYMOUR-CAST: PASS
GUARDIAN-CAST: PASS
