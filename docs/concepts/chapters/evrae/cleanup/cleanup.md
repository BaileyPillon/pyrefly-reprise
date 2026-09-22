# Evrae chapter art cleanup — 2026-09-22

Deterministic, pixel-level fix only (hard rule 15: no re-render). Subject:
Evrae ko. Nothing here is approved (`docs/target/approved-hashes.json` has no
Evrae entry); its 115 files hashed identical before and after this pass. The
changed file is backed up (with its pre-fix original) under
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/`.

## Pin-sized alpha holes between the dorsal spines

`ko.png` had 9 fully-interior alpha holes (found by flood-filling transparency
inward from the canvas border, the same method `tools/gen/fillholes.py` uses —
anything still transparent afterward is enclosed, not background). Two were
large, graceful negative-space gaps that are part of the coiled-serpent
silhouette (16,400 px and 25,330 px) and were left alone; a mid-sized one
(3,393 px) sits in a coil opening next to a spine and was also left alone —
none of these read as a defect at 1:1. Four were small holes right at the base
or tip of the dorsal spines, which do read as a hole punched through solid
scale — sizes 1, 159, 164 and 770 px, all clustered in x265-465, y119-432.

No `*.raw.png` pre-cutout render exists for this file (only the cutout PNG and
sidecar are on disk), so `fillholes.py --raw` was not usable as-is; the same
algorithm was reimplemented with the fallback it already documents for that
case — each hole pixel is filled from the median colour of the surrounding
opaque ring (radius grown from 2px until at least 8 samples are found), not a
flat colour. 1,227 px filled across the 4 holes.

- Before/after (spine tip, ~1px hole): `evrae-ko-hole1-before.png` / `evrae-ko-hole1-after.png`
- Before/after (fold gap, 159px): `evrae-ko-hole2-before.png` / `evrae-ko-hole2-after.png`
- Before/after (spine base, 770px): `evrae-ko-hole3-before.png` / `evrae-ko-hole3-after.png`
- File: `public/art/characters/evrae/ko.json`

## Manifest + backup

`node tools/gen/manifest.mjs` regenerated. The pre-fix original is at
`D:/Tools/pyrefly-art-backup/candidates/2026-09-22-cleanup/evrae/ko.png` /
`ko.json`. `docs/target/approved-hashes.json`'s 115 files hashed identical
before and after (checked both times).
