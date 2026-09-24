# Independent 1:1 judge: Nooj/Brother portraits and Vegnagun parts (FFX-2 only)

Judge: an independent sub-agent that made none of these options. Date: 2026-09-24.
What was judged:

- Portraits: commit 9af30a2, `options.jpg`, the six `card-*.jpg`, and the candidate PNGs in
  `D:/Tools/pyrefly-lora/portraits/out/`.
- Vegnagun parts: commit cda5db16, `docs/concepts/chapters/vegnagun/parts/`.

**Game case: FFX-2 only.** Nooj and Brother are X-2 cast, and Vegnagun appears only in chapter 5.
Nothing under `src/`, `public/art` or `docs/target/` was touched by this review.

**Method.**

- Each candidate was viewed at 1:1, with its head and hand regions also viewed at 2x.
- The approved references were `paine`, `shuyin`, `rikku-x2` and `yuna-x2` at 1:1.
- Game-size read was taken from the real 1600x900 dialogue cards and battle captures, cropped at
  1:1.
- Scores are 0 to 10 on five axes: style match, anatomy, faithfulness to the quoted research,
  edges, and read at game size. The overall score is the judge's weighted read of the five, not
  a mean.
- The bar is 7. Bailey picks; nothing here is a pick.

## 1. Speaker portraits

The reference style is the approved FFX-2 set: heavy black ink, saturated hot rim colour,
white-hot specular and hard cel shadow.

- The three **Brother** options sit inside that style.
- All three **Nooj** options are visibly softer. They have lower contrast, thinner line and
  muted flats, and read more like TV-anime cel than the house's inked poster look. That gap is
  the main thing holding Nooj back. It is a style finding, and it is not caused by the crop.

| Option | Style | Anatomy | Faithful | Edges | Game read | **1:1** | **2x** | At bar? |
|---|---|---|---|---|---|---|---|---|
| Nooj A | 6 | 8 | 6 | 8 | 8 | **6.6** | 6.5 | no |
| Nooj B | 6 | 5 | 5 | 5 | 6 | **5.3** | 5.0 | no |
| Nooj C | 6.5 | 7.5 | 7 | 8 | 8 | **7.1** | 7.0 | **yes (just)** |
| Brother A | 8.5 | 8 | 7 | 7.5 | 8.5 | **7.9** | 7.7 | **yes** |
| Brother B | 8.5 | 6.5 | 7 | 7 | 5.5 | **6.8** | 6.8 | no |
| Brother C | 8.5 | 8 | 6 | 8 | 8 | **7.4** | 7.3 | **yes** |

### Nooj

**Nooj A.** A clean, stern face, and the glasses are solid at 2x: the eyes read through the
lens.

- It misses the sourced purple fur-topped sleeve on his right shoulder; grey armour plates sit
  there instead.
- There is no prosthetic in frame.
- The two hair loops are only implied.
- On the chapter-5 card it reads as a generic brown-haired swordsman, not Nooj.

**Nooj B.** This one has an anatomy failure.

- An unreadable machina lump (a green cap over a dark hub) floats behind his right shoulder. At
  2x it is not attached to anything.
- The glasses are faceted shards, not the blue lenses the source describes.
- The hair tie is teal (the source says red), and the fur covers both shoulders.
- Do not pick it.

**Nooj C.** This is the only option with the sourced silhouette: both hair loops with red
bands, blue glasses, and the machina hand on his **left**, which is the correct side.

- At 2x the metal hand is coherent: jointed fingers and no fused digits.
- It reads best of the three at card size, because the hand survives the crop.
- It has two misses:
  - The suit reads purple rather than red.
  - The wry smile contradicts his chapter-5 beat, "flat, resolved, suicidal" (research
    `ffx2-vegnagun-shuyin.md` beat 1).
- It reaches the bar only as a base for one repair pass: red suit, neutral or closed mouth, and
  a little more ink weight toward the house style.

### Brother

**Brother A.** This is the best style match on the sheet; it is the same ink and heat as
Rikku-x2.

- On canon: a tall blond mohawk on shaved sides, green eyes, the ears full of hardware, a bare
  chest, and the suspenders.
- Three misses:
  - The suspenders are blue only (the source says "blue-and-red").
  - The chest and arm tattoos read as faint marks.
  - The pupils are not the Al Bhed spiral; the approved Rikku shows one.
- At 2x the cleaned left ear shows no leftover from the erased braid.
- The shout fits every chapter-6 line.

**Brother B.** The strongest tattoo read, and red-and-blue suspenders.

- Both arms are raised and cropped at the frame top.
- On the real card, the fallback crop pushes his head **above** the frame, with a sliver of arm
  at the top edge. At game size it therefore fails until a `face-crops.json` dialogue row
  exists.
- The mohawk reads as a swept undercut.

**Brother C.** Well drawn, and the worried look fits his chapter-5 lines, "...Yuna?" and
"Buddy, why is nobody yelling back at me?".

- The suspenders are **orange** (source: blue and red).
- The tattoos are nearly absent.

**Recommendation to Bailey** (the pick is Bailey's):

- **Brother A** is the strongest option overall. Its one repair pass would add red to the
  suspenders, strengthen the tattoos and give the eyes the spiral.
- **Nooj C** is the only Nooj worth carrying forward. It needs the repair listed above, because
  Nooj A and B miss too much of the source.

## 2. The speaker-id question (ruling)

**Recommend a new speaker id, `brother-x2`, for every FFX-2 line, and leave the FFX Evrae lines
on `brother` with no portrait.**

- **`brother` is not used only in chapter 6.** Its FFX-2 uses are:
  - `ffx2-bahamut.ts:137-138` (chapter 4)
  - `ffx2-vegnagun-shuyin.ts:159-161` and `:358` (chapter 5)
  - `ffx2-leblanc.ts:221-225` (chapter 6)

  The FFX use is `evrae-airship.ts:107-115`, the FFX Evrae chapter.
- **Installing the file as `brother.png` would put the X-2 face on FFX lines.** That breaks rule
  14. The research sources only his X-2 look, so his FFX look is unsourced (rule 6).
- **`brother-x2` follows the existing pattern.** It matches `yuna-x2` and `rikku-x2`.
  `DialogueBox.defaultName` already strips `-x2`, so the name plate still reads "Brother" with
  no UI change.
- **The cost is small.**
  - One additive `SpeakerId` member in `src/story/dsl.ts`. That file is a shared contract, so
    the change needs a `docs/CONTRACT-CHANGES.md` entry.
  - About 9 `say()` id swaps across the three FFX-2 scripts.
  - The portrait installs as `public/art/portraits/brother-x2.png`, with a measured dialogue row
    in `face-crops.json`.
- **The per-line `portrait:` override is not recommended.** It would work, but it leaves the id
  ambiguous for voice, role and future lookups.

## 3. Vegnagun parts (commit cda5db16)

### The reference

**No approved Vegnagun painting exists.**

- The only pinned Vegnagun hash is the chapter-5 pause plate, and it shows Yuna.
- Style match was therefore judged against the **shipped art3 part paintings**
  (tail, leg, body, head), which the README correctly flags as unconfirmed by Bailey.
- Any A or B score inherits that caveat. Question 2 in the README should be answered before any
  install.

| Part / option | Style | Anatomy | Faithful | Edges | Game read | **1:1** | **2x** | At bar? |
|---|---|---|---|---|---|---|---|---|
| Bulwark A | 8 | 5.5 | 6 | 6 | 7 | **6.4** | 6.0 | no |
| Bulwark B | 7 | 4.5 | 5.5 | 6.5 | 6 | **5.8** | 5.6 | no |
| Bulwark C* | 9 | 9 | 8 | 8 | 7 | **8.0** | 8.0 | **yes** |
| Redoubt A | 7.5 | 4.5 | 6 | 7 | 6 | **6.1** | 6.0 | no |
| Redoubt B | 7 | 4.5 | 6 | 6 | 6 | **5.9** | 5.6 | no |
| Redoubt C* | 9 | 9 | 7 | 8 | 6.5 | **7.6** | 7.6 | **yes** (fix the label) |
| Node A | 5 | 6 | 6 | 7 | 6.5 | **5.9** | 5.6 | no |
| Node B | 5.5 | 6 | 6 | 7 | 6.5 | **6.1** | 5.8 | no |
| Node C | 8.5 | n/a | 9 | 8 | 7.5 | **8.1** | 8.0 | **yes** |
| Tail tip A | 9 | 9 | 8.5 | 8.5 | 8.5 | **8.6** | 8.5 | **yes** |

### Bulwark

**Bulwark A.** The pixels are on-style, but the result is two disembodied forelegs hovering in
mid-air while the body painting **still has its own forelegs**, so the machine reads as having
four front limbs.

- At 2x the left leg has a hard, flat, horizontal cut across its top.
- The right leg's claw is paler and flatter than the rest, as if lit by a different light.

**Bulwark B.** One render is pasted twice. It reads as two identical clones side by side, with
the same doubled-limb problem.

**Bulwark C\*.** Rings on the body's own painted forelegs.

- It matches the scan ("Vegnagun's foreleg", §3.3) better than any separate figure.
- It adds no new pixels, so there is no style risk.
- The 5 m counter stays centred where the leg is.
- The Left ring sits partly behind the body, and the part is legible only through its label.
  The 5 m ground decal (§4.3) would carry the read in the build.

### Redoubt

**Redoubts A and B.** Two copies of the same tusk float in the air beside a head that keeps its
own tusk, which reads as floating horns.

- B's "red sensor housing" is only a dark red socket at the root; it does not show the §10.1
  "glowing" red.
- At 2x B has a light fringe along its matte edge.

**Redoubt C\*.** Rings on the head's tusk and jaw.

- It is faithful to "the tusks are the Redoubts".
- The **Left ring is a guess**: the painting shows one tusk, and §10.1 says two pairs.
- The "LEFT REDOUBT" label is **clipped to "LEFT REDOUB"** by the command menu at 1600x900. The
  label placement must be fixed before this option is at the bar in practice.

### Node

**Nodes A and B.** Glossy spheres that read as candy or traffic-light buttons, not as painted
machinery. That is a style mismatch against the painted parts.

- They hang at mid-height, not "far overhead" (§2).
- The yellow Node is half hidden under the intent card.
- The green Node overlaps the leg painting.

**Node C.** Research-backed: "Nodes hang far overhead", and "only long-range attacks can touch
them".

- The HUD bars and the intent card already carry each Node's state.
- The top-edge colour arrows read at game size.
- One small defect: the Node C arrow sits about 90 px right of its "NODE C" plate.

### Tail tip

**Tail tip A.** The green blade is recoloured from its own luminance to the §10.1 steel. At 2x
there is no seam or halo. It fixes PR-0015 cleanly.

### Recommendation to Bailey (per row, Bailey picks)

| Row | Recommendation |
|---|---|
| Bulwark | **C\*** |
| Redoubt | **C\***, with the label moved clear of the command menu, and the Left Redoubt position confirmed or sourced |
| Node | **C** |
| Tail | **A** |

- No A or B figure option reaches the bar. The doubled-limb and clone problems are structural
  and cannot be fixed by a repaint.
- **The Nodes' ground-row placement (`farplane.ts` `ENEMY_SLOTS`) contradicts §4.3 whichever
  option is picked.** Node C resolves it by taking them off the ground, and that change is
  presentation only.

## Summary: options at the bar (7 or above)

| Group | At the bar |
|---|---|
| Nooj | C (7.1, needs repair) |
| Brother | A (7.9) and C (7.4) |
| Vegnagun parts | Bulwark C\* (8.0), Redoubt C\* (7.6, label fix), Node C (8.1), Tail A (8.6) |

**Speaker id:** `brother-x2`.
