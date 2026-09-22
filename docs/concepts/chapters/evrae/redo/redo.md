# Evrae redo (2026-09-22) — FFX only

**Status: every file below is a CANDIDATE.** Nothing here is approved, nothing was added to
`docs/target/approved-hashes.json`, and the approved set was hashed before and after this work
(115 files, 0 mismatches both times, no `evrae` set).

Game case (AGENTS.md rule 14): **FFX only**. Evrae is the chapter 3.5 airship boss of FFX
(`research/ffx-evrae-airship.md` §12). Nothing here touches FFX-2 art or shared code.

Veto sheet: [`sheet.jpg`](sheet.jpg). One row per item: the picked concept B (the identity
anchor), the 2026-09-21 install it replaces, the new candidate whole, and two 1:1 native-pixel
crops of the new file. Cutouts sit on mid-grey so white holes and fringes show.

## What was wrong (from `../production.md` and the driver's 1:1 look)

1. **Colour drift in every state.** The picked look is B: teal body, tan belly, red-orange
   spines, orange flame tail fins. The installs had drifted to green-and-orange (idle-near),
   almost all orange (idle-far, ko) and pale cyan (breath-charge). Cause: the 2026-09-21
   monochrome guard skipped `--ref`, and the identity text ("teal-blue-green", "vivid orange
   fin-frills", "warm sky") let orange win.
2. **idle-near** was cropped at the frame edges and kept opaque white background between coils.
3. **idle-far** never became a distant streak.
4. **breath-charge** had no throat that reads as charging.
5. **The chapter card** never got the wide shot of the deck with the wyrm alongside.

## Method

- **Anchor:** `docs/concepts/chapters/evrae/renders/evrae-b.png`. The concept itself has a
  stray **second head** floating inside the first coil (a detached island). `make-ref.py`
  removes it, then writes `refs/evrae-b-square.png`: the concept square-padded on white, so
  IP-Adapter's 224 px centre crop sees the whole creature (the Leblanc method check §2.2
  found the adapter only ever saw the middle band). Every render used this reference with
  `--forceRef --refWeight 0.45 --refStart 0.2 --refEnd 0.6 --refWeightType "ease in"`.
- **Identity block** (`identity.txt`): Danbooru-style tags that name the concept's colours
  (`dark teal scales, deep blue-green scales, navy shadows, pale tan underbelly, crimson red
  dorsal spines, orange-tipped spines, red swept-back head crest, orange eyes, orange
  flame-shaped tail fin, one head, wingless`), with `--emphasis "(dark teal scales:1.3),
  (pale tan underbelly:1.15), (crimson red dorsal spines:1.15)"`. `negadd.txt` bans orange,
  yellow, gold, green or red *bodies*, extra heads, wings, sky backgrounds. No effect words.
- **Composition sketches** (`paint.py`, PIL), used with `--img2img` at denoise 0.6 to 0.65 and
  `--nonBiped`: a thin diagonal streak on white (FAR); the concept coil with the throat
  swelling painted into the neck (breath-charge); sky, clouds, the prow at frame-left, a steel
  deck, a guard rail and the picked FAR cutout pasted in as the wyrm (chapter card). Hurt and
  KO use puppets of the picked idle-near cutout (method E from the Leblanc method check):
  tipped 18 degrees with the head turned up for hurt, and turned 105 degrees head-down for KO.
- **Clean-up**, all scripts in this folder: `unhole.py` clears large, flat, near-pure-white
  regions that the rembg cut left opaque. Painted cream belly scales are shaded, so they fail
  the flatness test and stay. It ran at a minimum area of 100 px on the installs, and nothing
  near a head or teeth was cleared. `tools/gen/whitekey.py` cut out the FAR streak, because
  rembg dropped most of the thin body, and `dematte.py` then removed the white halo the
  luminance key left.
- **Batches:** 4 candidates per round, judged on a grey look sheet and then at 1:1. The
  2026-09-21 hero-preset rounds on the chapter card kept returning face close-ups because
  `HERO_COMPOSITION` hard-codes `close-up, face focus, portrait` and `HERO_NEGATIVE` bans
  `wide shot, from afar`. The redo therefore rendered the card with the **backdrop** preset:
  wide framing, a 2x master, 1344x768 after downscale.

Colour check (median hue, saturation and value of the body's cool pixels, plus the share of
warm pixels; `huestat.py`):

| File | cool hue | sat | val | warm share | 2026-09-21 install: hue / warm |
|---|---|---|---|---|---|
| concept B (anchor) | 201 | 0.69 | 0.34 | 0.21 | — |
| idle-near | 202 | 0.75 | 0.31 | 0.22 | 169 / 0.46 |
| idle-far | 194 | 0.91 | 0.33 | 0.37 | 176 / 0.77 |
| breath-charge | 204 | 0.67 | 0.31 | 0.22 | 188 / 0.27 |
| hurt | 207 | 0.78 | 0.35 | 0.17 | 191 / 0.42 |
| ko | 200 | 0.73 | 0.34 | 0.22 | 178 / 0.59 |

idle-far's higher warm share is the spines, which are large next to a thin body. Its body is
teal.

## Picks (all installed as CANDIDATE, backed up)

| Item | Installed | From | Rounds seen | Why this one, and what is still wrong |
|---|---|---|---|---|
| idle-near (+ `idle.png`, same pixels) | `public/art/characters/evrae/idle-near.png` | `cand/idle-near/r4/idle-near.2` seed 822302, img2img 0.6 off the one-head concept | 4 rounds, 16 renders. r1 (lost: r2 overwrote the same filenames; the seeds 822001-4 are on record) and r2/r3 by txt2img drew the body off the frame edges or faced right. r4 took img2img off the concept itself | The head at 1:1 is the cleanest of the 16: orange crest, teal head, open jaw, orange eye. The whole creature is in frame and the white holes are cleared. **Still open:** it is the concept's composition, so the head is concept-sized, not the "head and claws filling the upper third" NEAR read of research §12.2. The NEAR/FAR difference now comes from the FAR streak plus engine scale. |
| idle-far | `.../idle-far.png` (1024x477) | `cand/idle-far/r2/idle-far.2` seed 825002, sketch img2img 0.65 | 2 rounds, 8 renders (r1: the cutout guard quarantined 3 of 4; the raws were fine, so r2 re-rendered with `--keepBad` and whitekey) | A long diagonal S-streak, small head at the upper left, body legible, flame tail fin: the research's FAR silhouette. At 1:1 a faint light rim remains along the belly edge after de-matting; it reads as the tan belly line against grey. |
| breath-charge | `.../breath-charge.png` | `cand/breath-charge/r3/breath-charge.4` seed 826204, sketch v2, img2img 0.6 | 3 rounds, 12 renders | Rounds 1 and 2 (a flat bright disc under the jaw, at denoise 0.6 and 0.7) came back as a **flame puff beside the mouth**. **Method check before round 3 (hard rule 15):** on this checkpoint a flat, bright blob next to a mouth is fire breath, so the fix is to make the swelling part of the neck's own silhouette: the underbelly bulges out, plate seams run across it, the hot colour sits inside a dark rim, and fire, flames and smoke are banned. Round 3 worked. At 1:1 the throat is a swollen orange-to-yellow sac under a closed-ish jaw, attached to the body. The rest of the pose is idle-near's coil, so the telegraph reads as one change. The fill is a smooth gradient, flatter than the scales. |
| hurt | `.../hurt.png` (838x651) | `cand/hurt/r3/hurt.3` seed 823203, puppet img2img 0.62 | 3 rounds, 12 renders | Chosen for identity: hue 207, the lowest warm share. The head recoils with an open-mouthed hiss, and a red scythe claw shows. **Still open:** the body stays close to idle; this is the Leblanc pilot's "B copies the idle pose" risk. The txt2img alternative `picks/alt/hurt-r2-4-flipped.png` (seed 823104, mirrored) reads far more clearly as hurt, rearing and screaming, but drifts: a large red frill crosses the snout, it has legs, and the blue is more saturated. **Bailey's or a judge's call between the two.** |
| ko | `.../ko.png` (550x704, tall) | `cand/ko/r2/ko.2` seed 824102, puppet img2img 0.6 | 2 rounds, 8 renders. r1 txt2img drifted to hue 206-216, with one red head and one missing head | Tumbling head-first, head at the lower left, coils trailing up: research §12.5 beat 8, "falls out of the sky". At 1:1 the eye still reads **open**, as it did on 2026-09-21. A few pin-sized white gaps between spines remain (< 100 px each). |
| chapter card | `public/art/pause/evrae-chapter-card.png` (1344x768) + `.2x.webp` master | `cand/chapter-card/r3/card.1` seed 827201, backdrop preset, sketch img2img 0.6 | 3 rounds, 12 renders. r1: the wyrm came back orange with a fish or spaceship head. r2: right composition, but at 1:1 the head was a needle. r3: a larger pasted wyrm | Deck rail in the foreground, the prow at frame-left, a cloud sea, and the teal wyrm alongside on a long diagonal: research §12.3 money shot 2. At 1:1 the head is teal with orange spines and an orange eye. **Still open:** at 1:1 on the master the deck is plain and streaky, not riveted plating; no "Salvage Dream CID" lettering (text is banned in the negatives); no Bevelle on the horizon. |

Not redone: the backdrop `public/art/backdrops/evrae-airship-deck.png` and the Cid portrait
were outside this brief. The concept round's forelimb gap is only partly closed: hurt shows a
clawed limb, but the scythe limbs are still not a feature of every state.

## Hard rule 6

The colours come from the **picked concept B**, not from a source. Research §12.2 marks its
colour direction `[estimate]` ("cold and reptilian ... the only saturated accent on the throat
charge and the eyes"). The red-orange spines of the pick break that suggestion, and the paraphrased
Auron line in §12.2 hints at a red creature. Whether the retail Evrae's palette should override
the pick is **Bailey's call and is not decided here**. The Salvage Dream lettering and Bevelle on
the horizon are sourced (§12.1, §12.3), but neither is painted.

## Files

- `identity.txt`, `negadd.txt`, `run.sh` (the exact recipe), `make-ref.py`, `paint.py`,
  `unhole.py`, `dematte.py`, `look.py`, `crop11.py`, `huestat.py`, `build-sheet.py`
- `refs/`, which holds the one-head concept, the square reference, the img2img init, and the
  picked cutouts that the puppets and the card were built from
- `sketches/`, which holds the composition sketches as rendered
- `picks/*.json`: the installed sidecars. The pick PNGs and every candidate (`cand/`, 116 MB)
  are local only (gitignored here) and backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-22-evrae-redo/` (`before/` holds the
  2026-09-21 installs this replaced, `installed/` the new ones, `cand/` and `picks/` everything
  seen)
- `public/art/manifest.json` was regenerated (`node tools/gen/manifest.mjs`: 57 subjects,
  206 poses)
