# Macalania chapter art cleanup — 2026-09-22

Deterministic, pixel-level fixes only (hard rule 15: no re-render, no pose/costume
change). Subjects: Seymour (`seymour-macalania`), Guado Guardian
(`guado-guardian`). Nothing here is approved
(`docs/target/approved-hashes.json` has no Macalania entry); its 115 files
hashed identical before and after this pass. Every changed file is backed up
(with its pre-fix original) under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/`.

## 1. Facing — Seymour idle + hurt

idle and hurt are painted facing screen-right, while cast/attack/ko and the
sidecars all say `facing: "left"`. Fixed by correcting the sidecar's `facing`
field to `"right"` on both — no pixel touched. Enemies have world facing -1,
so `mirrorFor('right', -1)` now returns -1 (mirror), turning the
already-right-facing art to correctly face the party.

Files: `public/art/characters/seymour-macalania/idle.json`, `hurt.json`.

### Live verification

Chapter 6 (`ffx2-leblanc`) is real and playable, but Macalania has no
registered `ChapterId` yet (`src/app/screens/frontend/comingChapters.ts` lists
it as coming, not live). Per the brief's fallback ("or the scene harness if
the chapter is locked"), verification used a real `PaintedActor` — the exact
class the battle presenter uses — added to the live battle-6 scene via
`PaintedActor.fromSubject('seymour-macalania', { side: 'enemy', ... })`,
so it goes through the same `mirrorFor` / world-facing code path as any
scripted enemy (`facingDir` read back as `-1`, confirming enemy orientation).
Screenshots for all 5 states are in `facing-live/seymour-*.png`; idle and hurt
(the two fixed states) both show him turned toward the party on the left, not
away from it.

- `facing-live/seymour-idle.png`
- `facing-live/seymour-hurt.png`
- `facing-live/seymour-attack.png`, `seymour-cast.png`, `seymour-ko.png`
  (unfixed states, included for the full-set check the brief asked for)

## 2. White slab — Seymour hurt

An opaque white slab (alpha 255, RGB ~255/254/255) filled the gap between his
hair and robe at x410-466, y442-612 — rembg keeping a background patch as
foreground. Fixed with a local white-key inside that box only (distance from
white ≤ 28, feathered 1.2px) so it becomes transparent; colored content in the
box (hair, robe, sash) was untouched. 2,519 px keyed; the box now checks at
4,297 transparent / 5,222 other / 1 stray near-white px (was ~3,255 opaque
white before).

- Before/after: `seymour-hurt-slab-before.png` / `seymour-hurt-slab-after.png`
- File: `public/art/characters/seymour-macalania/hurt.json`

## 3. White slabs — Guado Guardian ko

Two opaque white slabs, same cause: under the topknot (x98-209, y269-367,
3,313 px keyed) and a strip along the spear shaft (x817-1063, y384-510,
5,179 px keyed). Same local white-key method as above, boxed so the red hair,
spear metal and green sash were untouched.

- Before/after (slab 1): `guardian-ko-slab1-before.png` / `guardian-ko-slab1-after.png`
- Before/after (slab 2): `guardian-ko-slab2-before.png` / `guardian-ko-slab2-after.png`
- File: `public/art/characters/guado-guardian/ko.json`

## 4. Edge cutoffs — Seymour ko (left) and Guado Guardian ko (right)

Seymour ko's hair was cut hard at x=0 (247 opaque rows); Guado Guardian ko's
spear tip was cut at the right edge (17 opaque rows). Both padded 24px
transparent on the cut side and feathered the last 8px of alpha at the old
edge, so it fades instead of ending in a slab. Sizes: Seymour ko 1206×747 →
1230×747; Guardian ko (already 1216×597 after the slab fix) → 1240×597.
`baselineY` unchanged in both (horizontal pad only). Re-verified after the
pad: 0 opaque pixels remain at either canvas edge.

- Seymour ko: `seymour-ko-edge-before.png` / `seymour-ko-edge-checker-after.png`
  (checkerboard background so the transparent fade is visible, not just
  white-on-white)
- Guardian ko: `guardian-ko-edge-before.png` / `guardian-ko-edge-checker-after.png`
- Files: `public/art/characters/seymour-macalania/ko.json`,
  `public/art/characters/guado-guardian/ko.json`

## 5. Skin tone unification — Guado Guardian, all 5 states

idle's skin is a muted grey-blue (hue ~190-196°, sat ~7-31%) — concept A.
attack, cast, hurt and ko had drifted to a saturated cyan (hue ~186-217°,
sat ~50-72%). Same hue family, very different saturation — this is a
saturation/value correction, not a hue shift.

Method: within each of the 4 non-idle states, built a hue mask (178-232°,
sat≥35%, v≥25%) over the *whole image*, verified by rendering it as a red
overlay first (caught the spear/weapon sharing the hue range in `hurt` and
`ko` — both have a blue-white steel highlight — and excluded those bounding
boxes, plus two small ambiguous hood/hair slivers in `cast`/`hurt`, by hand
after inspecting crops). Matched pixels: hue → idle's ~193°, saturation ×0.35,
value ×0.87.

- attack: 58,302 px recoloured (no exclusions needed — the spear head in this
  pose is silver, outside the mask)
- cast: 25,985 px (1 hood sliver excluded)
- hurt: 34,531 px (the spear shaft + 2 ambiguous hair/hood slivers excluded)
- ko: 26,495 px (the spear shaft excluded)

- Reference: `guardian-idle-skin-reference.png`
- Before/after: `guardian-{attack,cast,hurt,ko}-skin-before.png` /
  `guardian-{attack,cast,hurt,ko}-skin-after.png`
- Masks: `docs/concepts/chapters/macalania/cleanup/guardian-{attack,cast,hurt,ko}-skin-mask.png`
- Files: `public/art/characters/guado-guardian/{attack,cast,hurt,ko}.json`

## 6. Manifest + backup

`node tools/gen/manifest.mjs` regenerated after every fix above. Every touched
file's pre-fix original is under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/{seymour-macalania,guado-guardian}/`
— including `guado-guardian/ko.original.png`, recovered from
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-macalania/picks/guardian/ko.520402.png`
(the installed pick, byte-verified against the pre-fix pixels at (900,420)
and (950,450) before use) after the slab fix had already run once without a
prior snapshot — noted here rather than hidden. `docs/target/approved-hashes.json`'s
115 files hashed identical before and after (checked both times).
