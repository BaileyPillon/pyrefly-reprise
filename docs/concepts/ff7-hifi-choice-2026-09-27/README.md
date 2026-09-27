# FF7 hi-fi choice — one sheet for Bailey (2026-09-27)

Assembles the two option rounds already committed on `main` (art direction
`2040708e`, effects `13fd592a`) plus the crisp-menu measurement on branch
`ff7-fidelity` (`0ae11d2e`, not yet merged) into one phone-readable set. No new
art, effects or code — text and image assembly only. **FF7 only**; nothing in
FFX or FFX-2 changes.

Party stands on the left facing screen-right, Guard Scorpion on the right
facing screen-left; nothing is mirrored (Cloud's pauldron stays on his far/left
shoulder, Barret's gun-arm stays his near/right arm).

## What Bailey is choosing

1. **Art direction** — house, key art, or film (`part-1-art-direction.jpg`).
2. **Effects treatment** — A3 plus, Spectacle, or Cel light, each shown at Tail
   Laser (`part-2-effects.jpg`; full sheets at all four moves — Tail Laser,
   Bolt, Braver, Search Scope — are in `docs/concepts/ff7-effects-hifi-2026-09-27/`).
3. **Menus**: nothing to choose here — `part-3-menus-crisp.jpg` reports what was
   measured. Read it before deciding whether "crisp" still needs a build task.

## Recommended

- **Art: direction 3, Film** — the only one clearly above the installed art and
  at least equal to the FFX finish, after removing a baked green/cyan rim light
  from Cloud's and Barret's back edges. Directions 1 (House) and 2 (Key art)
  both fail on non-canon details (wrong sword, mohawk, a literal scorpion
  instead of the security mech) — see the judge's verdict on the sheet.
- **Effects: option 2, Spectacle, built on option 1 (A3 plus)** — particles,
  light spilling onto the fighters, and a flash frame on impact (with a calm,
  reduced-motion version already sheeted).
- **Menus: no fix pending a decision.** Every FF7 HUD reading measured 0.98–0.99
  against a native-sharpness reference at 8 window sizes, pixel ratios and zoom
  levels — no resampling blur exists in the build. The softness in Bailey's
  screenshot matches a bitmap-scaled window (DPI virtualisation, a
  remote-desktop/viewer session, or an upscaled screenshot), which page code
  cannot fix. If "crisp" instead meant richer/higher-fidelity rather than
  blur-free, that request is covered by the art and effects choices above.

## What happens after Bailey picks

1. Repaint every FF7 pose in the picked art direction, facing screen-right
   (never mirrored), with the rim-light fault fixed if Film is picked.
2. Build the picked effects treatment (and any mix Bailey names) for real,
   replacing the placeholder figures.
3. If the menus turn out to need a display/remote-desktop fix on Bailey's end,
   or if he wants a richer HUD treatment, that becomes its own small options
   round per rule 9.
4. Release once built and reviewed, per the standing release process.

## Sheets (read in order)

1. `part-1-art-direction.jpg`
2. `part-2-effects.jpg`
3. `part-3-menus-crisp.jpg`

Each is under 1 MB and at most 2000 px tall.

## Sources

- Art directions: `docs/concepts/ff7-art-2026-09-27/hifi/` (commit `2040708e`).
- Effects treatments: `docs/concepts/ff7-effects-hifi-2026-09-27/` (commit
  `13fd592a`).
- Crisp-menu measurement: `docs/handoff/ff7-crisp.md` and
  `docs/screenshots/ff7-crisp/` on branch `ff7-fidelity` (commit `0ae11d2e`,
  not merged to `main` — its pictures were copied into this folder's assembly
  only, not committed a second time).
