# Leblanc pilot 2: independent judge pass (2026-09-22)

FFX-2 only (Chapter 6 art pilot; no shared tool, no game file, AGENTS.md hard
rule 14). This pass was run by a different agent from the one that painted
the candidates and wrote `pilot2.md`. **No new renders were made.** Nothing
was installed and nothing was approved: `docs/target/approved-hashes.json`
lists 115 files and all 115 hashed the same before and after this pass.

**Sheet built for this pass:** `judge-sheet.jpg` (per state: idle, then the
best candidate of each method, whole; under each, native-pixel crops of the
head, the waist and the feet). Built by `judge-sheet.py`. Every one of the 40
final candidates (plus D's stage-1 frames) was viewed as a per-method strip,
and every contender was then opened as native 1:1 crops (head and chest, obi,
boots) against idle's own 1:1 crops. No score below comes from a thumbnail.

## Criteria

Anchor: `public/art/characters/leblanc/idle.png` (the installed idle). Each
candidate is scored 0 to 10 on hair colour; cut (short blonde bob); face
proportions; eye colour; skin tone; robe colour and pattern versus idle
(including the obi and the white halter dress under it); the heart mark; the
fan; the boots; line and shading style; and whether the pose reads as the
state (hurt = visibly hit; attack = a strike). **The score is the worst
criterion.** Pass is 7.

What idle shows at 1:1 (the target): pale platinum-blonde bob with the bangs
swept to one side and **both eyes visible**; purple eyes; pale skin; purple
studded choker; a small red heart on the chest; a plain white halter dress;
a **crimson obi** with a bronze knot ornament and a purple tassel ending in a
round medallion; a purple kimono worn off the shoulders, white-edged, with a
lighter lavender diamond pattern toward the hem; bare legs; purple lace-up
**open-toe** ankle boots; a black folding fan with pale ribs.

## Scores (every candidate)

`D stage 1` is method A with pilot 2's new text (the tall idle reference);
`D` is the finished two-stage result. D's stage-2a intermediates are not
scored separately.

| Candidate | Hurt | Worst criterion (hurt) | Attack | Worst criterion (attack) |
|---|---|---|---|---|
| F1 | 0 | pose/composition: two figures and a floating plank (seed 22301) | 2 | fan: orange fan; also gold obi, a cyan pendant, white lace shorts |
| F2 | **4** | robe/obi: gold obi, magenta robe lining, no pattern; the fan is white with purple ribs; closed-toe boots | 2 | fan: a gold baton-like fan |
| F3 | 3 | robe/obi: gold and magenta obi, red robe collar, striped shorts | 2 | heart mark: a second heart on the shoulder |
| F4 | 3 | pose: fan pressed to the mouth reads as a swoon, not a hit | **4** | robe/obi: gold obi, a white lace bra top instead of the halter dress, plain robe; also closed-toe boots (5), honey-gold hair over one eye (5), pose a backswing with the fan trailing (6) |
| D stage 1, 1 | 0 | pose/composition (same seed as F1) | 2 | fan: orange |
| D stage 1, 2 | **4** | robe/obi (near-identical to F2) | 2 | fan: gold baton |
| D stage 1, 3 | 3 | robe/obi (as F3) | 2 | heart mark: second heart on the shoulder |
| D stage 1, 4 | 3 | pose: swoon (as F4) | **4** | robe/obi: gold obi; hair a browner gold than F4; halter top closer to idle than F4's lace |
| D 1 | 0 | pose/composition | 2 | fan: orange; also a purple glow across the eye |
| D 2 | 2 | face: pink smears on the shut eyelid and cheek | 2 | fan: gold baton (hair did lighten toward idle) |
| D 3 | **3** | face: pink smear under the eye; gold obi | 2 | heart mark: second heart on the shoulder |
| D 4 | 2 | face: purple smear over the eyelid and into the hair | **3** | face: purple streak through the hair over the eye |
| E1 | 3 | pose: head bowed while holding the robe out like idle, reads as sulking; a large white fan | 2 | pose: standing, fan held out at the side |
| E2 | 3 | pose: as E1; floral robe print instead of idle's diamonds | 2 | pose: standing |
| E3 | 3 | pose and fan: as E1, a dark red fan floating at the left | 2 | pose: standing, fan held out (costume the closest of any attack) |
| E4 | **4** | robe/obi and fan: gold obi, red lining with gold coins, fan barely readable at the hip; navy closed-toe boots; pose (hand on stomach, wince) is 5 | 2 | pose: standing |

**Nothing reaches 7. Nothing should be installed.** The painter's own read
was a point higher on the best candidates (F4 attack 6, F2 and E4 hurt 5).
This pass scores them 4 because, at 1:1, the costume misses are not small:
the obi is gold, not crimson, in every contender; F4 wears a lace bra top in
place of the halter dress; the robe lining turns magenta or red; and the
boots are closed-toe in every D and F frame. Where E and F keep the costume,
E loses the pose; where F and D find the pose, they lose the costume.

## Method ranking (best worst-case: the lower of the best hurt and the best attack)

| Rank | Method | Best hurt | Best attack | Best worst-case |
|---|---|---|---|---|
| 1 | **F** (square idle + head/fan crop as a batched reference, 0.4, ease in, 0.2 to 0.6) | 4 (F2) | 4 (F4) | **4** |
| 1 (tie) | D stage 1 (method A + the new text, tall idle reference, 0.35) | 4 | 4 | 4 |
| 3 | D (stage 1 + masked re-identify of the figure and the head) | 3 | 3 | 3 |
| 4 | E (PIL puppet of idle, img2img 0.6 to 0.7) | 4 | 2 | 2 |

F and D stage 1 tie and are almost the same pictures seed for seed, which
confirms the painter's finding: at 0.35 to 0.4 on an ease-in window the
reference only nudges and **the words decide**. F wins the tie because its
reference is the one the adapter can actually see (idle padded to a square
plus the head-and-fan crop, method check §2.2) and it costs one pass; D's
second stage made every face worse (pink or purple smears) while lightening
the hair, so it goes. E is not a method for attack; it holds the costume only
because it holds idle's pose.

## Recipe for the next attempt (winner: F, with the words corrected)

Pose tags stay Danbooru-style, no effect words. Everything not listed here
is exactly as in `run-pilot2.mjs` (Animagine XL 4.0, 28 steps, cfg 6,
euler_ancestral / normal, `FRAMING`, `STYLE_TAGS`, `QUALITY_TAGS`,
`SPRITE_NEGATIVE`, `FACING_NEGATIVE`; reference = batch of
`refs/idle-square.png` + `refs/idle-head.png`, concat, weight 0.4, ease in,
start 0.2, end 0.6).

1. **Identity block** (`identity-idle.txt`), each change aimed at a drift
   seen at 1:1:
   - hair: `blonde hair` becomes `platinum blonde hair`; **remove
     `hair over one eye`** (idle shows both eyes; every D and F frame hides
     one eye); keep `short hair, bob cut, swept bangs`.
   - obi: `red obi, sash, gold sash ornament, tassel` becomes
     `crimson obi, red sash, obijime, purple tassel` (no word "gold" anywhere
     in the block).
   - heart: `red heart mark on chest` becomes `heart tattoo, chest tattoo`
     (F3 and D3 drew a second heart on the shoulder).
   - boots: `purple boots, ankle boots, lace-up boots, open-toe footwear,
     high heels` becomes `purple boots, lace-up boots, ankle boots,
     open-toe boots, toes, high heels`.
   - robe: add `argyle` after `purple kimono` for idle's diamond pattern
     (untested: check it at 1:1 and drop it if it prints a sweater).
2. **Emphasis** (`emphasis.txt`): `(white halterneck dress:1.2),
   (purple kimono robe off shoulders:1.2), (crimson obi:1.25),
   (open-toe boots:1.25), (platinum blonde hair:1.15), (pale skin:1.1),
   (black folding fan:1.15), (bare legs:1.1)`. Drop the heart from the
   emphasis (it is never missing; weighting it made it a flat sticker).
3. **Negatives, both states**, added to each `negAdd`: `gold obi, yellow sash,
   gold sash, lace, lace bra, bra, crop top, shorts, red lining, pink lining,
   magenta, floral print, shoulder armor, hair over eyes, tan, orange fan,
   gold fan, white fan, multiple views, 2girls`.
4. **Hurt** pose tags unchanged; add `hand to own mouth, covering mouth,
   fan to mouth` to its negatives (F4 and D4 read as a swoon). Replace seed
   22301 (it draws two figures under both references); keep 22302 to 22304
   and add one new seed.
5. **Attack** pose tags: keep `lunging, leaning forward, one leg forward,
   serious, v-shaped eyebrows, closed mouth` and make the fan lead:
   `outstretched arm, reaching, holding folding fan, arm extended forward`
   (drop `swinging`); add `arm behind back, fan behind back` to its negatives.
   F4's fan trails behind her, so it reads as a wind-up. Render attack at
   **1024x1216** (the lunge overflowed 832 px in every D and F frame) and
   check that the head is about idle's 190 px once scaled to the sprite
   height before install.
6. Four candidates per state, one batch at a time on the shared queue. Judge
   the same way: 1:1 head, obi and boot crops against idle, worst criterion,
   bar 7.

**If the obi or the boots still drift after the text fix**, the next tool is
not more words and not D's whole-figure repaint: it is a small masked repaint
of only the obi (or only the feet) at denoise about 0.45 with
`crimson obi` / `open-toe boots` in the text and no face in the mask. D
showed that a masked pass moves colour, and its damage was all on the face.

**Hard rule 15:** Leblanc attack and hurt have now failed two production
passes and two pilots. The method check is written
(`docs/plans/leblanc-art-method-check.md`) and this recipe follows from it.
If the next run also fails the bar, stop and show Bailey the current best
(F4 attack; F2 and E4 hurt) next to idle rather than trying a fifth time.

## Open for Bailey (hard rule 6, not decided here)

`research/ffx2-leblanc-syndicate.md` §10.1 gives Leblanc thigh-high stockings,
a red-and-silver fan and a blue-and-white triangle pattern; the idle he saw
has bare legs, a black fan and a purple robe with lavender diamonds. This
pass judged against the idle, as the brief says. Whether the idle should move
toward the research description is his call.
