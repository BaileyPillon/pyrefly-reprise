# Art handoff — group `ffx-bosses`

The FFX endgame boss run: Seymour Flux (split body + mount), Yunalesca's three
forms, Braska's Final Aeon's two forms with its Yu Pagodas, Yu Yevon, and human
Jecht. Everything was rendered through `tools/gen/comfy.mjs` on Animagine XL 4.0
Opt against the shared style contract — `STYLE_TAGS`, `QUALITY_TAGS` and the
composition blocks in `comfy.mjs` were **not** touched — cut out with
`isnet-anime`, and judged per `docs/ART-PIPELINE.md` §6.

## How this group was chained

1. **`jecht` first.** He is human, so he anchors the whole group: `cast.json`
   makes his `idle` the `--ref` for `braskas-final-aeon-1`, which in turn is the
   `--ref` for `braskas-final-aeon-2`. His idle was rendered `--batch 4` with no
   reference and judged hardest.
2. **`yunalesca-1/idle`** is the palette and face anchor for forms 2 and 3.
   Form 2 takes it at the default `--refWeight 0.65` (she is still recognisably
   the same woman); form 3 at `0.45`, because at 0.65 the human silhouette
   fights the gorgon body — `cast.json`'s own note, confirmed in the rolls.
3. **`seymour-flux-body`** is `--ref`'d at the already-approved
   `public/art/characters/seymour-flux/idle.png` so the face and hair match the
   concept the proof-of-concept round kept.
4. **Every other state** is `--ref`'d at its own subject's approved `idle` at
   `--refStart 0.25`, `--batch 3`.

## Calibration: `--refEnd 0.70`, not the 0.85 default

`docs/ART-PIPELINE.md` §3 predicts "material bleed" at the end of the denoise
and offers `--refEnd` as the cure. On this group it was not a subtlety — it was
the difference between usable and not. Jecht's first `--ref` pass at the default
`--refEnd 0.85` came back with every state in a glossy, oversaturated,
rainbow-on-the-blade finish that no longer matched its own idle: consistent in
*identity* and inconsistent in *material*, which is the failure the flag exists
for.

A/B on a fixed seed (473552066), Jecht `victory`, reference = his approved idle:

| Setting | Result |
| --- | --- |
| `--refEnd 0.85` (default) | Neon skin, iridescent blade, chrome-blue shorts, rim light blown out |
| `--refEnd 0.70` + anti-gloss `--negAdd` | Natural skin ramp, flat blade, grey shorts, identity and costume unchanged |

**Every `--ref` render in this group therefore uses `--refEnd 0.70`** plus this
shared `--negAdd` fragment:

```
glossy, oversaturated, neon, chromatic aberration, lens flare, metallic sheen, rainbow gradient
```

This is a per-invocation flag and a per-shot negative — the shared style and
quality blocks are untouched, so nothing here obliges a roster re-render.

## Deviations from `tools/gen/cast.json`

`cast.json`'s identity tags for this group predate a close read of
`research/visual-bible.md` §1.8–§1.12 and contradict it in several places. The
bible won, per the task's quality bar.

| Subject | `cast.json` said | Rendered instead (bible §) |
| --- | --- | --- |
| `yunalesca-1/-2/-3` | "blonde hair, white dress, gold trim" | **silver hair**, **blue-and-black bikini top**, **black thong**, **green Yevon sashes**, gold bracelets, blue armbands, barefoot — she is nearly nude, not gowned (§1.9) |
| `braskas-final-aeon-1` | "grey skin, spiky hair, red and black" | **brown scales**, **white hair tufts**, enlarged **red headband**, **white** Abes tattoo, normal right arm + **oversized left claw**, black sword with **red dolphin markings** (§1.10) |
| `jecht` | "short hair, open vest, black vest" | **long unruly black hair**, **no shirt**, **red eyes**, **orange-and-red sash over the right leg only**, **pauldron and gauntlet on the left arm only**, barefoot (§1.11) |
| `yu-yevon` | "insect, spider, translucent" | **floating tick/parasite**, **curling hooks**, and a flat **gold Yevon glyph disc where the face should be** (§1.12) |
| `yu-pagoda` | "stone pillar, pagoda, guardian statue" | **three tapering tiers**, stone-and-gold with **ringed tiers and hanging bells**, floating (§1.10) |
| `mortiorchis` | "floating skull, insect, mandibles" | **wide brass-and-bone ribcage reliquary** with a **hollow green-lit centre** and **two curved scythe arms** (§1.8) |

`cast.json` is a work order, not a config file, and nothing reads it at runtime,
so it was left unmodified — these corrections live in the commands logged below.

---

## Run 2 (2026-09-16) — resumed after the first run was cut off

The first run left numbered variants and no promoted `<state>.png` for several
subjects. This run judged what was there, re-rolled what failed, and finished
the group. Settings unchanged from Run 1 except where noted: `--refStart 0.25`,
`--refEnd 0.70`, and the shared anti-gloss `--negAdd` fragment
`glossy, oversaturated, neon, chromatic aberration, lens flare, metallic sheen, rainbow gradient`.
`STYLE_TAGS` / `QUALITY_TAGS` / the composition blocks were **not** touched.

One addition to the shared per-shot negative this run, `NOBG`:

```
magic circle, mandala, halo, stained glass, ornate background, glowing background,
sunburst, motion lines, speed lines, aura, fog, mist, smoke
```

Reason: `cast.json`'s stock `cast` pose tags say "glowing magic circle", and on
this checkpoint that paints an opaque disc behind the figure which `isnet-anime`
keeps — the exact failure §6.4 of the pipeline doc describes. The `cast` pose
was reworded to "raising both arms, summoning dark energy, energy gathering in
the hands" for every subject in this group.

### `seymour-flux-body` — idle, attack, cast, hurt, ko

Run 1's four `idle` variants were all rejected: 86–98 % of every frame came back
opaque because the prompt carried `dark aura` and the IP-Adapter reference
(`seymour-flux/idle.png`) is itself a winged figure on an opaque painted
backplate. The reference propagated its backplate, not just its face — the
caveat at the end of §3 of the pipeline doc, in its most expensive form.

Two levers fixed it, and the second is the one that mattered:

| Attempt | `--refWeight` | `--refEnd` | Result |
| --- | --- | --- | --- |
| Run 1 | 0.65 | 0.85 | 86–98 % opaque, no bone frame, robed winged demon |
| Run 2a | 0.55 | 0.70 | 84–85 % opaque — still the reference's backplate |
| Run 2b | **0.35** | **0.60** | **38–47 % opaque, clean cutout, identity intact** |

`dark aura` was also dropped from `--tags` and this went into `--negAdd`:
`cape, cloak, huge collar, wings, feathers, banner, dark background, black background`.

- **idle** — variant 1 of 3 at seed 1759074900, `--ref seymour-flux/idle.png
  --refWeight 0.35 --refEnd 0.60`. Pale slender torso, light blue hair with the
  two horn-like locks and the forward bang, purple eyes, bare chest with the
  leonine tattoo, dark blue robe with red trim, bright green sash, arms flung
  wide, robe tapering into a ragged fringe — which is what composites into
  Mortiorchis's cradle. 818×1203, baselineY 1187.
- **attack** variant 2, **cast** variant 2, **hurt** variant 1, **ko** variant 1
  — all `--ref` at his own approved idle, `--refWeight 0.65`, batch 2. Identity
  holds across all five: same hair, same green sash, same red-trimmed robe.

### `mortiorchis` — idle kept, attack, cast, hurt, ko

- **idle** — Run 1's render was kept unmodified (seed 343237022). Wide
  brass-and-bone ribcage, hollow green-lit centre, two curved scythe arms,
  41 % opaque and a clean matte. It is the §1.8 design directive almost line for
  line.
- **cast** variant 2, **ko** variant 2 — kept as cut by `isnet-anime`.
- **hurt** variant 1 — `isnet-anime` left 59 % of the frame opaque (white
  cyclorama retained beside the scythe). Re-cut with
  `tools/gen/whitekey.py --raw hurt.1.raw.png`, which took it to 34 %. This is
  the second subject that has needed the luminance key; the tool's docstring
  says "inanimate prop", and a brass machine on white is the same case.
- **attack** — **re-rolled.** Variant 1 came back with a painted decorative
  border around the whole frame (whitekey keys it in as content, isnet keeps it
  as background); variant 2 was a close-up with the machine cropped at every
  edge. See the re-roll note below.
