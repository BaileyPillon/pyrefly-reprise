# Art handoff — group `ffx2-cast`

The eighteen FFX-2 dressphere subjects (six Yuna, six Rikku, six Paine) plus
the three X-2 portraits. Everything here was rendered through
`tools/gen/comfy.mjs` against the shared style contract (`STYLE_TAGS` /
`QUALITY_TAGS` untouched) on Animagine XL 4.0 Opt, cut out with `isnet-anime`,
and judged per `docs/ART-PIPELINE.md` §6.

## How this group was chained

1. **Default dressphere idle first, judged hardest.** `yuna-gunner`,
   `rikku-thief` and `paine-warrior` were each rendered `--batch 4` with no
   reference. These three are the identity anchors for their girl.
2. **The other five dressphere idles** for that girl were rendered with
   `--ref <default>/idle.png --refWeight 0.45`. The lower weight is the
   documented variant setting (`docs/ART-PIPELINE.md` §3): at 0.65 the
   reference's *palette* arrives with the face and the new dressphere comes
   back tinted like the old one. At 0.45 the face, hair and eyes carry and the
   tags still get to repaint the costume.
3. **Every other state** was rendered with `--ref <that dressphere's own
   idle.png>` at the default `--refWeight 0.65 --refStart 0.25 --refEnd 0.85`,
   `--batch 3`.
4. `ko` uses `--composition prone --size 1216x832`; portraits use
   `--composition portrait`.

## Deviations from `tools/gen/cast.json`

`cast.json`'s identity tags for this group predate a read of
`research/visual-bible.md` §1.14–§1.16 and contradict it in several places.
The bible won, per the task's quality bar. Changes made:

| Subject | `cast.json` said | Rendered instead (bible §) |
| --- | --- | --- |
| `yuna-gunner` | "pink shorts" | **blue denim shorts**, orange obi, white/pink sash on the left hip (§1.14) |
| `yuna-white-mage` | "red trim" | **purple trim, pink lining, yellow crescents/circles** (§1.14 table) |
| `yuna-black-mage` | "striped, patchwork, blue and black" | **purple dress, brown trim/belt, pink straps, pink legwarmers, large purple hat** (§1.14 table) |
| `yuna-warrior` | "blue armor, headband" | **dark grey top, red x-collar, teal accents, big shoulder pads, brown knee boots** (§1.14 table) |
| `yuna-dark-knight` | "black and purple" | **indigo armour with pink and teal accents, crescent helm** (§1.14 table) |
| `rikku-thief` | FFX look: "orange bikini, goggles, claw" | X-2 Thief: **yellow bikini top, olive-green miniskirt, red/yellow scarf, blue bandana, twin daggers** (§1.15) |
| `paine-warrior` | "pauldron, greatsword" | **black fold-over top, red suspenders, thigh-highs, elbow gloves, skull buckle, long sword** (§1.16) |
| every mage livery | per-subject strings | one shared livery string per job, so the three girls' White Mages read as the same dressphere |

The mage liveries are deliberately identical strings across Yuna, Rikku and
Paine — a dressphere is one garment, and `cast.json`'s own notes say so.

## States

`cast.json` gives each dressphere a partial state list (and some signature
states: `dance`, `steal`, `item`). The engine asks for a uniform seven —
`idle, attack, cast, item, hurt, ko, victory` — so every subject got all seven.
Where a dressphere has no spell, `cast` was given its signature flourish
instead of a generic magic circle:

- `yuna-songstress/cast` is the **dance** (mid-spin, skirt flaring, music notes).
- `*-gunner/cast` is a gun raised overhead with the magic circle.
- `yuna-dark-knight/cast` and `paine-dark-knight/cast` are the sword planted in
  the ground with the dark aura (Darkness).
- `rikku-alchemist/item` is the Mix frame, per `cast.json`.

Victory poses follow the bible's verified per-character poses where it has
them: Yuna's Gunner "blow the smoke off the barrel", the White Mage's double
hop into a jump, the Black Mage's jump, the Dark Knight resting on the hilt,
the Warrior's Tidus-mimicking catch; Rikku punches the air; **Paine flicks her
hair with her arms folded in every dressphere** (§1.16, documented as her
universal victory).

## Final choices

| Subject | State | Seed | Notes |
| --- | --- | --- | --- |
