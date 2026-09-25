# Chapter XII (Seymour Omnis): installed production candidates

**Which game (rule 14): FFX only.** Omnis, the Mortiphasm discs and the Garden of Pain exist only in FFX
(research §0.3).

Bailey, 2026-09-25 ~01:40 EDT, verbatim: *"I'll go with all your recommendations"*. For this chapter
that picks O-1 A (new paint), O-2 B (painted discs plus a HUD disc strip), O-3 C (deep violet), O-4 C
(the intent line), B17 c (a new Omnis portrait, falling back to the approved Macalania portrait), the
look-only reference pass (question 5), no disc turns (B22 a) and the reset on his next turn (B23 a)
(`README.md`, `docs/plans/chapter-omnis-review.md`). The HUD strip and the intent line are T8 (HUD), not
art.

Every file below is a **CANDIDATE**. I judged each one myself at 1:1 and in a real 1600x900 frame. None
has had an independent judge, none is in `approved-hashes.json`, and nothing in `src/` loads them yet.
All six use **new** ids, so no existing file was replaced. `public/art` is gitignored, so the files are
only on this disk, with a copy in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-omnis/`.
`public/art/manifest.json` was regenerated with `node tools/gen/manifest.mjs`. It now lists
`seymour-omnis` (cast, idle, portrait, facing left), `mortiphasm` (idle) and `mortiphasm-facing` (idle).
`verify-approved.mjs`: 153 ok, 0 mismatched, 0 missing. `art-manifest-build`, `art-manifest-loader`
and `ui-portrait-face-crop` pass (143 tests).

| Path (under `public/art/`) | Pick | Size | sha256 (first 12) | What was done |
|---|---|---|---|---|
| `characters/seymour-omnis/idle.png` + `.json` | O-1 A | 864x1229, baselineY 1212 (the hem), `facing: left` | `91f67b3a2749` | The render's own pixels (seed 912102). Only the alpha was rebuilt, from the raw render against its flat white ground. This opens the white pocket between the raised left arm, the hair and the shoulder strip (it bloomed in the options frame) and the white sliver beside the bead string. It also makes the pale light-blue strips whole again (the options matte had broken them): 22,145 px gained and 18,180 px dropped compared with the options cut-out. Binary alpha, 16 px margin. **Correction (judge, 2026-09-25):** not one component: one main body plus 20 alpha specks of 5 px or less (the cast carries 21). Nothing shows at game size; the locked hash is kept, not re-cut. |
| `characters/seymour-omnis/cast.png` + `.json` | the Chapter VI to XI rule (idle plus one hero cast per enemy that acts) | 964x1319, baselineY 1302, `facing: left`, idle at offset (50, 90), same pixel scale | `98749aa066a4` | Every Omnis action (the four spells, Dispel, Ultima) plays this. Both clawed arms lift 20 degrees about the shoulders. It is one smooth warp field on the idle's own pixels. The rotation is full on the arms and fades to zero down the hanging strips, so there are no cut lines and no seams to repaint. Where the field is zero, the idle's pixels are copied exactly. Gates: 68.8 % of pixels unchanged from the idle, 31.2 % idle pixels moved, 0 % painted, 0 % invented colour, opaque area 1.03 x the idle, no soft alpha, 0 GPU. The face and chest are unchanged; the hair edge moves under 1 px. |
| `characters/mortiphasm/idle.png` + `.json` | O-2 B (painted discs) | 668x668, disc centre (333.5, 333.5), radius 318, `facing: front` | `962416288387` | The picked disc render (seed 912301) at its own pixel scale. Each quarter is tinted with its sourced colour, using the options' own recipe. Repairs cover only PIL artefacts: the rim's four red diamonds keep their own paint, the edge and the dividers are anti-aliased, and the disc is un-lit. **Ring order = our estimate (B8): clockwise on screen from the quarter at 0 degrees (screen right), Fire, Water, Ice, Thunder.** A different order means re-running `disc_build.py <order>` (no GPU). **Never mirror** it, because a mirror reverses the ring order. A turn is a rotation. |
| `characters/mortiphasm-facing/idle.png` + `.json` | O-2 B (the facing quarter lit, gold rim, the others dimmed) | 668x668, `layerOf: mortiphasm`, pivot at the centre | `0f5445a99dc8` | A layer drawn on top of a disc that does **not** turn with it. It lights the quarter that faces Omnis (12 % white wash), dims the other three (40 % black) and draws a gold rim arc (plus or minus 44 degrees). It is painted facing screen right; rotate it 180 degrees for a disc on his right. Drawn in numpy, with no render. |
| `backdrops/garden-of-pain.png` + `.json` | O-3 C (deep violet) | 2688x1536, one opaque plate | `d18315b73059` | The picked plate's own pixels plus one repair: **the steps**. The steps up to a platform are the one sourced Garden fact (research §7), and README question 3 said a final would add them. There are five broad stone steps rising from the terrace's far edge to a dais under Omnis. They were drafted in PIL blocks in the terrace's own colours, then given a masked img2img inside a feathered box only (seed 925301, 1 of 4, denoise 0.5, IP-Adapter on the plate crop at 0.3). Changed: x1341-1981, y774-998 (3.2 % of the plate). MAD 0 everywhere else. |
| `portraits/seymour-omnis.png` + `.json` | B17 c | 832x1216 | `ce32e75a6031` (was `55968b5d9a49`, judged FAIL 5.9; see "Portrait repair" below) | A new render (seed 925213, round 2 of 2, pick 3 of 4) drawn from the O-1 A idle's head-and-shoulders crop through IP-Adapter at 0.3. It uses a white-ground matte; the RGB equals the raw render exactly inside the alpha. Round 1 (ref 0.4 on the head plus the idle) came out neon and invented head horns and forehead marks. Pupils (read off a 2x gridded crop): (270, 437) and (439, 357), so fx 0.4261, fy 0.3265, ipd 0.2247. That is ready for a `src/ui/common/face-crops.json` row once a speaker id uses it. The row is not added because this track commits docs only. |

## Portrait repair and the O-5 pair (2026-09-25 repair pass; still CANDIDATE)

The independent judge failed the portrait at 5.9 (`production/JUDGE.md`) and noted that plan §6.2 asked for
two O-5 options, which were never shown. One masked repair, no GPU (`production/scripts/portrait_repair.py`):

- **The forehead oval** and its orange rim (an 8,972 px mask) are painted down to the surrounding skin by a
  harmonic fill that ignores dark neighbours (brow, lashes, hairline), flat like the cel-shaded skin around
  it. Near-white pixels in the judge's box (x308-367, y212-299): 4,047 before, 0 after.
- **The hair-crown pocket** (229 px at x246-270, y159-175) is closed from the raw render's own pixels
  (`portrait.b3`). It reads as a pale hair highlight.
- **The edge fringe** is peeled (3,107 px), and 320 more edge pixels are recoloured to the interior mean.
  The judge's edge-halo measure goes from 50.6 % to 0.1 % (the approved `seymour-macalania` is 7.3 %).
  One alpha island, binary alpha. RGB is unchanged outside the forehead box, except those 320 edge pixels.
- **Not fixed:** the costume is still off the O-1 A body (red and orange trim, cone spikes, no horned
  shoulders or red eye), and the veins are still missing. Both would need a repaint, not a masked repair.

**The O-5 pair** ([`o5-portrait/sheet.jpg`](o5-portrait/sheet.jpg), one column, CANDIDATE): **A** is the
repaired pick. **B** is the round-2 render b1 (seed 925211), not repainted, cut with the same matte and fringe
peel (`o5_b_matte.py`, `o5_b_fringe.py`). It has a dark indigo collar and dark lines under the eye, but an
orange cape lining. Each is shown in Chapter VII's dialogue card over the Garden plate, in real 1600x900
engine frames with the portrait swapped in by request interception (`o5-portrait/dialogue-{a,b}-1600.jpg`,
`talk_o5.mjs`, a private Vite server on port 5741 with HMR off and GPU, stopped by its PID). The superseded
file and B's PNG are in `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-omnis/portraits/`. Neither is
approved. Until Bailey picks A or B, B17 falls back to b, the approved Macalania portrait.

## The look-only reference pass (question 5; nothing saved, nothing downloaded)

These images were viewed in the built-in browser on 2026-09-25 and none was saved: the wiki's *Seymour
Omnis* page, its concept art of Omnis, its concept art of the reels, and one HD battle screenshot
("Seymour Omnis and the four Mortiphasms"). What they show, and what that means for these files:

- **Omnis** in the game is a lean, blue-violet armoured figure. Large crescent blade shapes sit above
  and below him, and legs dangle under a long hanging robe. O-1 A (spread clawed arms, a skirt of
  strips, no legs) is our own design, and Bailey picked it for its silhouette. It is kept and disclosed
  in `idle.json` `offCanon`.
- **The discs** in the game are purple mandala wheels. Each has four round coloured jewels at the
  quarter points. They sit in a cross around him: above, below, and one each side. Ours are bronze
  wheels with tinted quarters, two each side, as picked. This is disclosed.
- **The ring order (B8)**: the screenshot shows the opening state (orange toward him on all four
  discs). Reading the jewels on the left, top and right discs gives the same order on each, clockwise
  as seen by the camera: **Fire, Thunder, Water, Ice**. That is not the estimate the brief says to paint
  (Fire, Water, Ice, Thunder). Counter-clockwise it reads Fire, Ice, Water, Thunder, which is the order
  the wiki's prose lists. This is one frame, read by us. It is evidence for B8, not a confirmation. The
  installed disc keeps the estimate, as briefed. The observed order exists only as a scratch render
  (sheet panel 6) and costs one script run to install if Bailey confirms it.
- **The staves** are tall, slender, ornamented poles with a jewel on top, standing along the platform
  edges. The installed plate has none (the options drew none). If Bailey wants them, they can be added
  as scene props rather than paint.

## What was not painted, and why

- **No hurt and no KO painting for Omnis.** Hurt uses the engine's hurt-to-idle fallback with its
  flinch, flash and shake (the METHOD-CHECK state map). His end is the sending, a story beat.
- **No red-glow painting.** The glow before Dispel and Ultima is a live effect (tint, halo, pulse,
  particles), as the options follow-up said.
- **No disc states beyond idle.** The discs take no turns (B22 a, an estimate) and never die. Turning is
  a rotation of the disc under the fixed facing layer (O-G8, presentation).

## Flags (disclosed, not fixed)

- The idle's outermost strips are cut by the render's own canvas edge: 355 px of straight edge on the
  left, 129 + 159 px on the right. The pipeline's cut-out guard therefore rejects the file on coverage
  (103.8 % x 101.1 %; one main component plus 20 specks of 5 px or less, near-white fine), for the same reason the options run quarantined
  it. At battle size the discs cover most of it. No outpaint was tried: at Natus, every outpaint
  invented something.
- The portrait has red and orange trim and cone spikes on the shoulders that the idle does not have,
  and no red eye on the shoulder. The forehead highlight bloomed (judge FAIL); it is now painted out. The
  O-5 pair above is the options round that was skipped.
- At 1:1 the dais top of the steps reads a little like a bench back. In the frame it reads as steps.
- The cast lift is modest at battle size (the arms and claws rise). A stronger read would need a
  repainted pose.

## Frames and sheet

- [`production/sheet.jpg`](production/sheet.jpg): one column, phone-readable (smallest text 12.5 px at
  390 px wide), stamped CANDIDATE.
- `production/battle-1600.jpg`, `clean-1600.jpg`: real 1600x900 engine frames with Chapter III's
  `braskas-final-aeon` at its first command menu. Playwright request interception served the installed
  plate in place of `dreams-end.png`, and one staged image in place of `braskas-final-aeon-1`: the
  installed idle plus four installed discs with the facing layer, on the O-2 geometry
  (`scripts/compose.py`). Dream's End props and the Yu Pagodas were hidden and the names swapped, as in
  the options round. The HUD is Chapter III's (queue, numbers, the enemy-move line).
- `production/cast-1600.jpg`: the same frame with the cast. `turned-1600.jpg`: one disc turned 90
  degrees under its facing layer.
- `production/dialogue-1600.jpg`: Chapter VII's dialogue card with Seymour's portrait served as the
  Omnis portrait over the Garden plate. The line and the chapter label are Chapter VII's.
- `production/battle-390.jpg`: the game as it runs today at 390x844 (no Garden phone layout yet).
- Private Vite server on port 5740 (HMR off, GPU browser), stopped by its PID. ComfyUI was never
  restarted and every job was submitted with fewer than 3 pending. There were no black frames and
  nothing was downloaded. **GPU: 12 renders, 2.3 minutes** (8 portrait, 4 steps), out of a 60-minute
  cap. Scripts: [`production/scripts/`](production/scripts/). Scratch:
  `D:/Tools/pyrefly-scratch/ch1215/omnis/`.

## Hero plate installed, 2026-09-25 (FFX only, Chapter XII)

Bailey, 2026-09-25 ~10:20 EDT, verbatim: "I'll go with all your recommendations". Option A of `hero-plate/README.md` installed as `public/art/pause/ch12-seymour-omnis.png` (sha `906175aeff12`) with its RealESRGAN `.2x.webp` master and `.json` sidecar; locked in set `bailey:2026-09-25-recommendations`. The chapter lives on branch `chapter-omnis-0925` with no `ChapterMeta`. **Ship step:** its `ChapterMeta` names `heroArt: 'pause/ch12-seymour-omnis'`.

## Speaker portrait installed, 2026-09-25 (FFX only, Chapter XII)

Bailey, 2026-09-25 ~10:20 EDT: "I'll go with all your recommendations". `portraits/seymour-omnis.png` is now option A of `portrait-options/README.md` with the judge's fixes 1 and 2 (sha `6d4fe6583771`; fix 3, the vein move, not done), replacing the FAIL-judged `ce32e75a6031`; locked in set `bailey:2026-09-25-recommendations`, with a `face-crops.json` dialogue row. B17 no longer needs the Macalania fallback once the branch uses it.
