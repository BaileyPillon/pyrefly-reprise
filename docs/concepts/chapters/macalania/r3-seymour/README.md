# Seymour, Macalania idle, r3 (FFX only)

**Game case: FFX only.** Chapter 7 (Macalania Temple) is an FFX encounter; human-form Seymour
exists only in FFX. Method: `docs/plans/art-method-r3/METHOD-CHECK.md` (derive from the approved
pixels, repair only what must change, no blind re-render rounds).

**Status: CANDIDATE, installed with a backup. Not approved:** there is no entry in
`approved-hashes.json`, and nothing here needs Bailey's yes to be undone.

## What was done
The production idle is the approved concept pick **Seymour B** (`../renders/seymour-b.png`, seed
501012). Every pixel is the concept's except for three repairs:

1. **Cut-out halo.** The concept's isnet-anime matte kept a white background fringe around the
   hair and four enclosed white gaps between the right-hand strands. These were peeled off
   (802 + 105 px, binary alpha kept as the house convention). Script: `scripts/matte.py`.
2. **Ear, repaired because of hard rule 6.** Research §9.2 (`research/ffx-seymour-anima-macalania.md`)
   gives **"rounded, human ears, not the Guado's elf ears"**. `options.json` had already flagged
   this for the painter pass. Only the pointed extension was masked (2,309 px). The crop was
   upscaled with RealESRGAN x4 to 1024, then inpainted with Animagine XL 4.0 Opt and
   SetLatentNoiseMask (seed 7304, denoise 0.75, 4 seeds tried) and pasted back inside the mask.
   Hair keeps flowing where the tip used to be.
3. **Robe hem.** The render's right edge cut a 64-row straight edge through the hem. The canvas
   was extended by 48 px and the corner closed with the same graph (seed 7404, denoise 0.9).
   The result is a plain rounded corner of dark cloth.

The face, hands (pointed fingers, as in research §9.2), chest tattoo, sash, chain, hem lattice
and the hair locks Bailey asked to push are all **the concept's own pixels**.

**Framing:** 804x1191, 16 px margins, `baselineY` 1175, `facing: "left"`. The last value was
checked in the running battle: the actor is not mirrored and faces the party.

**GPU:** 2 prompts, 70 s of ComfyUI execution time in total (36.3 + 33.7 s, from the history API).
The cap was 75 min.

## Findings for the driver / Bailey
- **The idle installed before r3 faced away from the party in battle.** The 2026-09-22 cleanup
  set its sidecar to `facing: "right"`, but its pixels face screen-left. The engine therefore
  mirrored it (plane scale x -1.95), and Seymour looked away from Yuna, Tidus and Rikku
  (`ingame-installed-*.jpg`). `hurt.json` got the same "right" edit in that pass. It is worth
  re-checking, but it is not changed here.
- The other Seymour states (attack, cast, hurt, ko) were derived from the old idle, so their
  identity does not match r3: the ears, the sash and the hem lattice all differ. Under METHOD-CHECK
  §2 state map A, only a hero cast (and optionally a rig-baked hurt) would be derived from this idle.
- r3 still differs from research in one way that was **not** repaired: §9.2 says "pronounced
  facial veins", and the concept face has none. Painting them would repaint the face Bailey
  picked, so it needs his call.
- Self-judged only. An independent 1:1 judge has not scored this yet.

## Files
- `sheet.jpg`: concept, the idle installed before r3, and r3, side by side. Rows: the whole
  figure, then 1:1 crops of the face, ear, hands, sash and chain, hem lattice and hem edge, then
  the running battle at the near (enemy-rig) camera and the opening camera.
- `ingame-*.jpg`, `ingame-*.json`: the battle captures (RTX 5070 Ti, ANGLE D3D11,
  PYREFLY_BROWSER=gpu, 1600x900, seed 1). Both variants are served by request interception.
- `ingame.mjs`: the capture script. `scripts/`: every step, and `idle-r3.json` is the installed
  sidecar.
- Backup of the replaced idle:
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch7-goons/seymour-macalania/replaced/`.
  r3 intermediates: the same folder's `r3/` and `D:/Tools/pyrefly-lora/seymour/r3/`.
- To roll back, copy `replaced/idle.png` and `replaced/idle.json` back over
  `public/art/characters/seymour-macalania/`.
