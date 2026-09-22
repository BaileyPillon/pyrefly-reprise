# Leblanc round 3: method F with corrected words (2026-09-22)

FFX-2 only (Chapter 6 boss art; no shared tool, no game file; AGENTS.md hard
rule 14). Painter and judge are the same agent here, so every score below is a
**self-judged** score, not an independent pass. Nothing is approved: the three
new files are installed as **CANDIDATES** (sidecar `status: "CANDIDATE"`,
`candidateOf`, `method`, `seed`); `docs/target/approved-hashes.json` lists 115
files and all 115 hashed the same before and after this round (it has no
Leblanc set).

**Sheet:** `sheet.jpg` (idle, then the installed attack / hurt / cast; whole
figure scaled, then the face, obi and feet at native pixels). Built by
`build-sheet.py`, crops by `crops.py`.

## What was run

Recipe: `docs/concepts/chapters/leblanc/pilot2/judge.md` "Recipe for the next
attempt" (winner F). `run-round3.mjs` uses pilot 2's graph unchanged
(Animagine XL 4.0, 28 steps, cfg 6, euler_ancestral/normal, pilot 2 FRAMING,
STYLE, QUALITY, SPRITE_NEGATIVE, FACING_NEGATIVE; IP-Adapter plus on the batch
`pilot2/refs/idle-square.png` + `idle-head.png`, concat, 0.4, ease in,
0.2 to 0.6). Only the words changed, as the recipe lists (identity, emphasis,
the shared negatives, hurt's mouth negatives and new seed, attack's fan-leads
tags at 1024x1216). Cast was included because its last score in
`sets/leblanc/judge.md` is 6; ko (7 there) was left alone.

| Pass | Words | Candidates |
|---|---|---|
| a | `identity.txt` exactly as the recipe says (includes `argyle` and `heart tattoo, chest tattoo`) | attack, hurt, cast: 6 each, seeds 22101-06, 22302-07, 22501-06 |
| b | `identity-b.txt`: pass a minus `argyle` and `chest tattoo`; negatives add `tribal tattoo, kanji, shoulder tattoo, argyle, quilted, plaid, belt, buckle` | the same 18 seeds |
| repair | `repaint-r3.mjs`: masked repaint, the pilot 2 judge's named next tool (box mask, no face in it, both idle refs at 0.4) | hurt.b.22303 feet (3 seeds, denoise 0.6); cast.b.22503 fan (3 seeds, denoise 0.6) |

Pass b was not a new attempt. The recipe said to check `argyle` at 1:1 and drop
it if it printed a sweater. At 1:1 in pass a it printed a quilted knit over the
whole hurt robe and the boots, and it pulled the whole hurt set into a looser,
lower-quality paint style. `chest tattoo` drew tribal and kanji marks on the
chest in three of the six cast frames. Pass b drops exactly those two words.

## What the word fix did (1:1, against idle)

- **Obi: fixed.** Crimson in all 36 frames; no gold obi anywhere, compared
  with every contender in pilot 2. Several frames also carry idle's purple
  cord knot and tassel.
- **Boots: better, but not fixed.** Open-toe lace-up boots in about half the
  frames (pilot 2: none). The rest are closed-toe patent boots.
- **Hair:** both eyes show in every frame; `hair over one eye` is gone. The
  colour is now an ash or silver platinum, a little cooler than idle's warm
  pale blonde.
- **New or remaining drift:** a red (sometimes pink) robe collar and lining
  where idle is white-edged, in almost every frame, even with `red lining,
  pink lining` in the negatives. Idle's lavender diamond pattern toward the
  hem never appears without `argyle`, and appears as a quilted knit with it.
  `heart tattoo` draws an outlined heart, not idle's flat red one, and without
  `chest tattoo` the heart often disappears. The fan comes out pale wood,
  white, grey or gold far more often than black.
- **Masked repair:** the feet repaint worked (hurt f3: closed-toe black boots
  became purple open-toe lace-up boots with a clean seam; one rear heel is
  only half drawn). The fan repaint did not: cast.b.22503's staff-length
  "fan" stayed a long stick in all three seeds, because the surrounding
  context fixes its shape. So that frame was not picked.

## Picks and scores (worst criterion; bar 7)

Criteria as in pilot 2: hair, cut, face, eyes, skin, robe/obi/dress, heart,
fan, boots, style, pose reads as the state. The score is the lowest one.

| State | Installed | Score | Worst criterion | Next lowest |
|---|---|---|---|---|
| attack | `attack.22101` (pass a) | **5** | robe: a checkerboard panel on the rear sleeve; the heart is an outlined tattoo | fan 6 (black with tan guards and a purple tassel, near idle's, but held back: a wind-up rather than a strike); red collar 6; ash hair 6. Lunge 7, open-toe boots 8, crimson obi 7 |
| hurt | `hurt.b.22303.f3` (pass b + feet repaint) | **5** | robe: hangs closed like a long skirt, with strap buckles on the sleeve; fan pale wood; heart not visible from this angle | open-toe boots after the repaint 6. Wince with closed eyes and a hand on the stomach reads as hit (7, the best hurt expression in five rounds); crimson obi 7 |
| cast | `cast.b.22501` (pass b) | **5** | robe: pink drape over the shoulder and pink lining | closed fan dark grey, the right size (6); leans back looking up (pose 6). Small red heart 7, crimson obi 7, open-toe boots 8 |

**None reaches 7.** They are installed because the brief says to install the
picks as candidates, and because each one scores above the candidate it
replaces on the same criteria. The replaced files wear thigh-high stockings
(attack), a closed full-length robe with no white dress (cast), and a
blue-grey skin cast (hurt). They are backed up in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/leblanc/replaced-2026-09-22/`.

Rejected at 1:1, for the record: attack.22104, .22106, .22102 and all of pass b
except .22104 (closed-toe boots, or the fan held back); attack.22105 (fan
covers the face). hurt pass a, all six (quilted robe and boots, style drop);
hurt.b.22302, .22305, .22306 (closed boots); hurt.b.22304 (fan to the mouth
reads as a swoon); hurt.b.22307 (a strong knocked-back pose, but a white fan
and a yellow object at the waist). cast.22506 and cast.b.22502 (a halo effect;
two fans); cast pass a (tribal chest tattoos); cast.b.22503 (the fan is a
staff); cast.b.22504 (hardly looks up).

## Hard rule 15: stop here and show Bailey

The pilot 2 judge wrote: if the next run also fails the bar, stop and show
Bailey the current best next to idle rather than trying a fifth time. This run
fails the bar (5), so **no further Leblanc re-render should be queued without
Bailey's word.** The sheet is the thing to show him. What is left is small:
the robe's red lining, idle's hem diamonds, the flat red heart and the black
fan. Words and the masked box repaint have not fixed these. What is still
untried is a repaint masked to one colour region: mask exactly the red-lining
pixels and the fan pixels rather than a box, or recolour the robe edge in
image space. That is a method choice for Bailey, together with the hard rule 6
question already open in `pilot2/judge.md`: whether the idle, which has bare
legs, a black fan and a purple robe, should move toward the research
description (stockings, a red-and-silver fan, a blue-and-white triangle
pattern).

## Files

- `identity.txt`, `identity-b.txt`, `emphasis.txt`: the words.
- `run-round3.mjs` (`PASS=b` for pass b), `repaint-r3.mjs`, `install-r3.mjs`.
- `renders/`: every cutout plus its sidecar. The raw frames and masks are
  gitignored and backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-leblanc/leblanc/round3-renders/`.
- `_strip-*.jpg` (survey), `_grid-*.jpg` (gridded, for reading face boxes),
  `_crops-*.jpg` (1:1 head, obi and feet per candidate against idle; the
  judging was done from these), `_look-*.jpg`, `_fans.jpg`, `_rep-*.jpg`
  (native-pixel close looks).
- `sheet.jpg`: the final sheet.
