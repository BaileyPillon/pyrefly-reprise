# Art handoff — group `aeons`

Subjects: `valefor`, `ifrit`, `ixion`, `shiva`, `bahamut`, `anima`, `yojimbo`.
States per subject: `idle`, `attack`, `overdrive`, plus a menu portrait
(`public/art/portraits/<id>.png`, `--composition portrait`).

Pipeline: `tools/gen/comfy.mjs` `boss` preset (portraits use `character` with
`--composition portrait`), Animagine XL 4.0 Opt, 28 steps / CFG 6 /
euler_ancestral / normal. The shared STYLE/QUALITY blocks in `comfy.mjs` were
**not** touched. Every non-idle state is pinned to its own subject's approved
`idle` with `--ref … --refStart 0.25 --refEnd 0.85`.

Contact sheets: `docs/screenshots/art/<id>.png`.

---

## Deviations from `tools/gen/cast.json` (and why)

`cast.json`'s aeon rows carry a boilerplate state block (`"wings folded"` on a
horse and a samurai) and, in four cases, colours that contradict
`research/visual-bible.md` §1.13 — which is the canon authority the quality bar
names. Identity tags were corrected to the bible; `cast.json` itself was not
edited (it is not mine to own).

| Subject | `cast.json` says | Visual bible §1.13 says | Used |
| --- | --- | --- | --- |
| valefor | `blue feathers` | "Some of her body is covered in **red feathers**"; feathers `#8E2A22`/`#C94A38`, underwing membrane `#E0B06A`, beak/talons `#E8DCC0`, eyes `#F2D24A` | crimson red feathers, cream underbelly, golden-tan underwing |
| ifrit | `quadruped stance` | "a **humanoid**, demonic-looking beast… **hunchback**", reddish-brown complexion, light red hair | humanoid, hunched, reddish-brown hide, light red mane |
| ixion | `purple mane` | "**dark blue** skin", "**grey** mane and tail", "long **golden** horn", "**gold bracers** on his front legs" | dark blue hide, grey mane, golden spiral horn, gold bracers |
| shiva | `white hair` | hair "tied up in long, **bright blue** dreadlocks", pale blue skin | long bright blue dreadlocks, pale blue skin |
| bahamut | `mechanical wings` (only) | "large, **black dragon** with **enormous red wings**", wings `#7E1414`/`#BE2A2A`/`#E85A4A` | huge crimson red wings **plus** mechanical wing struts (keeps the FFX armature, fixes the colour) |
| yojimbo | `helmet` | palette lists a **hat brim** (`#2A2418`/`#4E4432`), coat `#1A1E2E`/`#2E3650`, mask `#B8A882` | wide-brimmed hat, navy coat, pale oni mask |

**Overdrive pose tags were rewritten for every subject.** `cast.json`'s
`"energy gathering, glowing, dramatic lighting, aura, looking up, power
building"` renders a large opaque white glow behind the figure; `isnet-anime`
keeps it, so the cutout comes back with a white blob welded to the silhouette
(verified on Valefor: three of three at seed 553311, and again after adding
`glowing background, light burst, backlight, white glow` to `--negAdd`). This
is the same class of failure that got `painterly` struck from the style block.

Fix: the overdrive frame is staged as **pose only** — the roar/rear/draw at the
top of the attack — with the VFX left to the engine, plus the anti-glow
negatives. Cutouts come back clean and the frame still reads as a power beat.

**Anti-background negative block** used on every shot in this group:

```
pedestal, rock, floor, ground, shadow, glowing background, light burst,
backlight, sunburst, halo, lens flare, explosion, white glow, glowing aura,
magic circle, sparkle, smoke
```

---

## Final choices

### valefor — `public/art/characters/valefor/`

Canvas 1216×832 (`--composition boss`). Wings touch the frame edges on purpose
(`cast.json`: "let the wings touch the edges"), so `cropBox` is the full frame.

| State | Seed | Size | baselineY | Notes |
| --- | --- | --- | --- | --- |
| idle | 774222 | 1216×832 | 829 | Chosen from 11 candidates over three tag passes. Red feathers, cream throat and belly, golden-tan underwing, long neck, beaked head with the red crest, long lizard tail, talons planted. Cutout clean. |
| attack | 2143189027 | 1216×832 | 816 | `--ref idle.png`. Lunging forward, talons extended, beak open. The two rejected variants both kept an opaque white background wedge. |
| overdrive | 218846 | 1171×801 | 785 | `--ref idle.png`, pose-only staging (see above). Wings thrown wide, head up, talons spread. |

Rejected passes worth not repeating: `two large dragon wings` without
`feathered` drifts to a membranous wyvern and loses the plumage; the first pass
(`dark red feathers` alone) produced a four-winged phoenix with no tail, and one
variant came back in full rainbow plumage.
