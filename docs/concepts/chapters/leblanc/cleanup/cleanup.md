# Leblanc chapter art cleanup — 2026-09-22

Deterministic, pixel-level fixes only (hard rule 15: no re-render, no pose/costume
change, per the orchestration brief). Subjects: Ormi, Logos. Nothing here is
approved (`docs/target/approved-hashes.json` has no Leblanc/Ormi/Logos entry);
its 115 files hashed identical before and after this pass. Every changed file
is backed up (with its pre-fix original) under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/`.

## 1. Facing — Ormi idle + attack

Round-3 judge (`docs/concepts/chapters/leblanc/sets/ormi/round3/judge.md`)
measured idle and attack facing screen-right at 1:1 while every sidecar says
`facing: "left"`, so `mirrorFor` never flips them and Ormi turns to face away
from the party at idle and mid-attack. Fixed by correcting the sidecar's
`facing` field to `"right"` on both — no pixel touched. Verified live in a
running battle (see §6 below).

Files: `public/art/characters/ormi/idle.json`, `attack.json`.

## 2. Ormi ko — topknot colour

Idle's topknot is maroon (hue ~345°); ko's is beige (hue ~16-24°, low
saturation) — the judge's item 4 (`ormi/round3/judge.md`, "colour drift nobody
has named"). Flood-filled from seed pixels inside the beige puff (hue 0-50°,
sat 8-65%, value ≥35%), which the black outline stops before it reaches the
head or the red/gold tie band, then remapped hue→345°, saturation×2.2,
value×0.62. 4,534 px recoloured.

- Before/after: `ormi-ko-topknot-before.png` / `ormi-ko-topknot-after.png`
- Mask: `ormi-ko-topknot-mask.png`
- File: `public/art/characters/ormi/ko.json` (`cleanup` + `judgeNotes`)

## 3. Logos attack — edge cutoff

The coat tail was cut hard at the right canvas edge (376 opaque rows at
`x = w-1`). Padded 24px transparent on the right and feathered the last 8px of
alpha at the old edge so it fades instead of ending in a slab. New size
1024×1095 → 1048×1095 (`baselineY` unchanged — the pad was horizontal only).

- Before/after: `logos-attack-edge-before.png` / `logos-attack-edge-after.png`
- Checkerboard proof (shows the fade, not just white-on-white):
  `logos-attack-edge-checker-after.png`
- File: `public/art/characters/logos/attack.json`

## 4. Logos idle — skin tone unification

Far hand/forearm and both shins/feet (above the ankle wraps) were tan
(hue ~15-20°, sat ~50%) against the near hand's pale skin (hue ~30°, sat
~11%) — round-3 judge (`logos/round3/judge.md`): "the skin tones do not
belong to one person." Masked hue/luminance match: within the far
hand/forearm and both leg/foot regions, every pixel matching a tan-skin mask
(hue 5-45°, sat ≥30%, value ≥35%) had its hue set to 30°, saturation scaled to
22% of original, value boosted ×1.32 (matching the near hand's stats). Face
and the near hand's own shading were left alone (out of scope). 7,650 px
recoloured.

- Before/after (hands): `logos-idle-hands-before.png` / `logos-idle-hands-after.png`
- Before/after (shins): `logos-idle-shins-before.png` / `logos-idle-shins-after.png`
- Mask: `logos-idle-skin-mask.png`
- File: `public/art/characters/logos/idle.json`

## 5. Logos hurt — emblem + strap colours

The round-3 judge (`logos/round3/judge.md`) named the emblem gold instead of
idle's white radial disc, and the strap/armband purple instead of idle's
black. Connected-component flood fill isolated the gold disc (hue 20-55°,
sat ≥35%, v ≥50%) and every purple component (hue 250-290°, sat ≥50%) inside
the torso; the single largest purple component is the waist obi (canonical
purple per idle/research) and was left alone, the rest (shoulder strap +
studded ribcage armband, 3,028 px) were recoloured to black and the emblem
(402 px) to white.

- Before/after: `logos-hurt-strap-before.png` / `logos-hurt-strap-after.png`
- Mask: `logos-hurt-strap-emblem-mask.png`
- File: `public/art/characters/logos/hurt.json`

## 6. Logos ko — strap + ankle wrap colours

Same strap defect as hurt (purple harness → black, 26,148 px via the same
flood-fill method, obi excluded). The ankle wrap was black-base/white-bands;
idle's is a pale wrap with black bands, so the two tones were swapped within
the wrap's bounding box: near-white pixels (v ≥75%, sat ≤25%) → dark
bluish-black band colour, near-black pixels in the base's hue family
(180-260°, v 8-42%) → pale grey-white (5,924 px).

- Before/after (strap): `logos-ko-strap-before.png` / `logos-ko-strap-after.png`
- Before/after (wrap): `logos-ko-wrap-before.png` / `logos-ko-wrap-after.png`
- Mask: `logos-ko-wrap-mask.png`
- File: `public/art/characters/logos/ko.json`

## 7. Manifest + backup

`node tools/gen/manifest.mjs` regenerated after every fix above (57 subjects,
206 poses — unchanged counts, only pixels/metadata changed). Every touched
file's pre-fix original is under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/{ormi,logos}/`.
`docs/target/approved-hashes.json`'s 115 files hashed identical before and
after (checked both times).

## 8. Facing — live verification

See the project-level note: the fix is a sidecar-only edit (Ormi idle/attack
`facing` field), reasoned from `mirrorFor(art, want)` in
`src/engine/BattlePresenterActors.ts` — an enemy's world facing is `-1`, so
`facing: "right"` makes `mirrorFor` return `-1` (mirror the plane), which
turns the already-right-facing pixels to correctly face the party. Live proof
(own dev server, `window.__pyrefly`, chapter 6) is recorded in
`docs/concepts/chapters/macalania/cleanup/cleanup.md` §6, which covers both
chapters' facing screenshots in one session.
