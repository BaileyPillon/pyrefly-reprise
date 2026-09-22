# Ormi round 3: method F, Ormi's own words (2026-09-22) — the producer's report

> Moved here from `judge.md` by the independent judge pass; the scores below are
> the producer's own. The independent verdict is in `judge.md`.

FFX-2 only (Chateau Leblanc, Act III; `research/ffx2-leblanc-syndicate.md`
§10.1: "short and stout. A large shield worn on his back, bearing the
Syndicate heart logo. Predominantly purple samurai-style attire"). Art only;
no shared tool and no game file changed (AGENTS.md hard rule 14).

**Everything installed here is a CANDIDATE.** Nothing was added to
`docs/target/approved-hashes.json`; its 115 files hash the same before and
after this run. The four round-2 files that were replaced are backed up in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/ormi/replaced-round2/`,
and every round-3 render (raw frames, masks, cutouts, sidecars) is backed up in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/ormi/round3/`.

**Sheet:** `sheet.jpg` (per state: idle, the installed file whole, a 1:1 face
crop, a 1:1 costume and shield crop). Built by `build-sheet.py`. Every pick
below was judged from native-pixel crops and the full-size cutouts, not from
thumbnails.

## Method (the Leblanc pilot 2 winner, only the words changed)

`run-round3.mjs`: Animagine XL 4.0, 28 steps, cfg 6, euler_ancestral /
normal, the shared `STYLE_TAGS`, `QUALITY_TAGS`, `SPRITE_NEGATIVE`,
`FACING_NEGATIVE`; IP-Adapter plus (ViT-H) with a batch of two references,
`refs/idle-square.png` (Ormi's installed idle padded to a square) and
`refs/idle-head.png` (a square crop of his head, topknot and collar), concat,
0.4, ease in, 0.2 to 0.6 (`make-refs.py`). Framing is pilot 2's (no
`standing`, no `looking at viewer`); KO uses the prone block. Attack renders
at 1024x1216 because the shove overflows 832 px.

The words are an **idle-truth Danbooru block** (`identity-idle.txt`,
`emphasis.txt`) instead of the old prose sentence: `fat man, short, stocky,
bald, shaved head, topknot, hair tie, tassel, thick eyebrows, green eyes,
scowl, purple armor, japanese armor, purple kimono, gold trim, gold collar,
long sleeves, red sleeves, yellow sash, obi, teal pelvic curtain, purple
hakama, long hakama, gold hem, sandals, zouri, round shield, huge shield, red
shield, gold rim, studded rim, heart emblem`, emphasis `(bald:1.3), (fat
man:1.3), (purple armor:1.25), (purple kimono:1.15), (huge round shield:1.2),
(red heart emblem on shield:1.25)`. Negatives name every drift rounds 1 and 2
logged (face paint and forehead marks, a second shield, kite / heater /
pointed shields, a muscular build, a red chest) plus the ones the word pilot
found. Pose tags are Danbooru tags; the sprite lint stripped nothing.

- attack (Shield Bash, "a straight shove"): `lunging, leaning forward, one
  leg forward, holding shield, pushing, clenched teeth, v-shaped eyebrows,
  angry, looking ahead`
- cast (Supercollider's charge, "a charged body-check"; Ormi has no magic):
  `fighting stance, crouching, knees bent, legs apart, leaning forward,
  clenched hands, clenched teeth, v-shaped eyebrows, angry, shield on back`
- hurt: `stumbling, leaning back, off balance, wince, closed eyes, pained
  expression, open mouth, clenched teeth, v-shaped eyebrows, hand on own
  stomach, head tilt, arm at side, shield on back`
- ko: `lying, on side, unconscious, defeated, closed eyes, arms at sides,
  shield on back`

### Word pilot (one seed per state, looked at before any batch)

| Pilot | What it showed | Change |
| --- | --- | --- |
| A (`renders/pilot-a/`) | `dark red hair` drew a full head of red hair; `fat, big belly, round belly` bared the belly; `red sleeves` became detached sleeves; KO lay **on** a giant wooden disc | drop the hair colour, `bald, shaved head`; negatives for a bare belly, detached sleeves, shorts |
| B (`pilot-b/`) | bald and clothed, hearts on the shields, but the weight went away; attack drew two shields; KO still on a disc | weight up |
| C (`pilot-c/`) | heavy again but the belly bared through plain negatives; face-down KO cropped and flipped | weighted negatives `(navel:1.3), (midriff:1.3), (bare stomach:1.3)`; KO on his side, shield on back |
| D (`pilot-d/`) | heavy, belly covered, purple armour, red sleeves, yellow sash, hakama: on model; attack still two shields; KO drew the shield as a ring round the body | attack: fewer shield words; KO: `huge shield` out, `round shield on back` in |
| E (the batch) | one shield in attack; KO a normal size | batch |

### Heart repaint (a masked pass on the shield face only)

`repaint-heart.mjs`: an ellipse on the shield face (no face, hand or costume
in it), `SetLatentNoiseMask`, denoise 0.6 to 0.85, the text `round shield,
studded rim, gold rim, (large red heart emblem:1.35), (heart symbol:1.2)`,
everything outside the mask composited back pixel for pixel. This is the
follow-up pilot 2's judge named for a drift the words do not fix.

- **ko 940302**: 0.6 and 0.7 drew a muddled double heart; 0.8 seed 950304
  drew one clean red heart. Used.
- **attack 940001**: its shield had a gold line-art motif that read as a leaf;
  0.8 seed 950002 drew a gold-rimmed red heart. Used. At 1:1 a faint trace of
  the old gold line survives outside the heart.
- **cast 940105**: the visible shield face is a narrow crescent beside his
  fist. 0.6 and 0.7 drew nothing; 0.85 turned the shield black and put a grey
  object at the fist. **Two failed attempts, so no third (hard rule 15).**

## Scores (worst criterion wins, bar 7, against idle at 1:1)

Criteria: topknot and head; face (marks, eyes, expression); costume colours
(purple armour, red sleeves, gold collar and trim, yellow sash, teal pelvic
curtain, purple hakama); shield (one, round, a clear heart); build (heavier and
rounder than idle, per Bailey); style; pose reads as the state.

| State | Pick | Head | Face | Costume | Shield | Build | Pose | **Score** | Worst |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| attack | 940001 + heart 950002 | 7 (dark topknot, red tie, no tassel) | 7 (clean, green eye, gritted teeth) | **6** (lilac hakama; an invented heart-bow on the chest; no teal curtain) | 7 (one round red shield, gold studded rim, clear heart) | 8 | 8 (a real shove, weight forward) | **6** | costume |
| cast | 940105 | 7 (maroon topknot, gold band) | 7 (clean, green eye, gritted teeth) | 6 (an invented pink collar scarf) | **4** (one round shield, purple with a red boss, **no heart**; the heart is on the chest clasp) | 8 | 7 (a low charge stance, fists clenched) | **4** | shield |
| hurt | 940204 | 6 (plum topknot, no tassel) | 6 (clean, eyes shut, mouth open; the linework is simpler than idle's at 1:1) | **6** (orange-red sleeves, a lavender collar, a green-fading sash fringe in place of the teal curtain) | 8 (one round red shield, a clear red heart; worn at his front, not on his back) | 8 | 7 (head thrown back, hand at the stomach) | **6** | costume, face |
| ko | 940302 + heart 950304 | 5 (the topknot is pale beige) | 7 (clean, eyes shut, a pained frown) | **4** (the top sleeve and the robe's back read **red**, not purple armour; purple only in the hakama) | 7 (one round shield, a clear heart, glossy) | 8 | 8 (collapsed on his side) | **4** | costume |

**Nothing reaches 7.** Against round 2 (`../judge.md`): attack 6 to 6 (now
heavy, one shield and a clear heart instead of a purple-and-gold wheel);
cast about 4 to 5, now 4 for a different reason (no heart instead of an
edge-on shield); **hurt 4 to 6** (a real recoil, a round shield with a heart,
no face paint: 0 of 6 hurt candidates carried a facial mark, round 2 had 4 of
5); ko 5 to 4 (the heart and the weight gained, the purple lost). What round 3
fixed across the set: every state is **bald with a topknot, heavy and round,
in purple armour with red sleeves, one round shield**, no face paint anywhere,
and the heart is on the shield in three of four states.

What every contender rejected at 1:1 showed: attack 940004 a second head,
940005 two shields, 940002 a thin build; cast 940103 faces right, 940106 a
ring-shaped shield behind the whole body, 940102 a skin-coloured topknot;
hurt 940203 and 940206 no heart on the shield; ko 940301 a small shield and
red torso, 940303 / 940304 cropped, 940306 no shield at all, ko3 940311 head
to the right and slim, 940312 cropped, 940313 fused anatomy, 940314 a crawl.

## What this round leaves open

1. **Idle is now the odd one out, and the scale will show it.** The engine
   sizes every pose at idle's pixel scale (`PaintedActor` `computePoseScale`).
   Round 3's figures are heavier with bigger heads: attack's head is about
   1.2x idle's, hurt's about 1.5x. In game, Ormi will look like he grows
   when he is hit. The fix the round-1 judge already asked for, and which is
   now the cheapest one, is to **re-render idle with this same recipe**
   (arms crossed, shield on back, heart), after which the set shares one
   build and one shield. That changes the identity anchor Bailey saw, so it
   is his call. Not done here.
2. **Cast's heart.** Six seeds never put the heart on the shield. It moved to
   the chest clasp instead. A cast pose that shows the shield's face (say, the
   shield held in front at chest height as he braces) is a pose change, not a
   word change.
3. **KO's colour.** Lying on his side, the red sleeve and the robe's back
   fill the frame. Four more seeds with purple weighted up and `red sleeves`
   dropped fixed the colour but lost the pose or the frame. A masked recolour
   of the torso (the same tool as the heart, denoise about 0.5, `purple
   armor`) is the next thing to try.
4. **Hard rule 6.** The research gives Ormi "a large shield worn on his back,
   bearing the Syndicate heart logo" and "purple samurai-style attire"; it does
   not describe the shield's colours, the topknot, the red sleeves or the
   sash. Those come from the installed idle, not from a source.

## Files

- `identity-idle.txt`, `emphasis.txt`: the words; `make-refs.py`, `refs/`
- `run-round3.mjs`: the renders (`node .../run-round3.mjs <state> [seeds]`;
  `prompt <state>` prints the exact prompt)
- `repaint-heart.mjs`: the shield-face repaint
- `install.mjs`: installs the picks as CANDIDATE with sidecars (`status`,
  `candidateOf`, `candidateSource`, `method`, `seed`, the repaint's own seed
  and mask) and backs up what it replaces
- `build-sheet.py`, `sheet.jpg`
- `renders/`: every cutout and sidecar (raw frames and masks stay local,
  `.gitignore`), `renders/pilot-a` to `pilot-d` for the word pilot
