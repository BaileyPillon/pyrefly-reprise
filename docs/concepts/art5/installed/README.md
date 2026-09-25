# The 22 installed FFX-2 battle poses: proof frames (2026-09-25)

**Game case: FFX-2 only.** These are FFX-2 dressphere paintings, seen in Chapters IV, V/XI, VI and XIII.

**Bailey, 2026-09-25 ~12:45 EDT, verbatim:** "I'll go with your recommendations for everything".
He was answering the driver's recommendation to install all 22 judge-passed poses and leave the
failed slots empty (D-179 in `docs/target/decisions.json`).

- **What was installed:** 7 poses from `docs/concepts/chapters/trema/poses/judge/JUDGE.md` and 15
  from `../JUDGE.md`. Each PNG is byte for byte the judge's pick, taken from
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-judge-poses/`, and each sidecar carries the
  head-matched `scale`.
- **What was replaced:** nothing. Every slot was empty; the 2026-09-24 release manifest lists none
  of the 22.
- **Where they are locked:** `docs/target/approved-hashes.json`, set `bailey:2026-09-25-poses`.

## Frames

Each frame is named `<chapter>-<viewport>-<dressphere>-<slot>.jpg`. The matching
`<chapter>-<viewport>.json` records, for every frame:
- the action on screen;
- the painting's URL;
- `ratio`, the pose's units-per-pixel over the idle's, measured in the game;
- `sidecarScale`, the scale the sidecar asks for. `ratio` equal to `sidecarScale` means the engine
  sizes the pose so the head matches the idle.

**How the frames were taken:**
- Real keys drive each run, from the title through chapter select and party prep to the battle.
  The runs also use real-key commands: Change, Attack, Skill or Black Magic, and Item.
- A requestAnimationFrame gate holds the frame still while the screenshot is taken. The gate does
  not change the fight.
- The tool is the scratch script `tools/zz-poses-verify.tmp.mjs`.
- The runs were headless, with the gpu browser mode, at 1600x900 and at 390x844.

**Labelled debug steps (listed in each json's `debugNotes`):**
- Enemy HP is set to 1 for the victory moment.
- One girl's HP is set to 1 for the ko moment.
- Party HP is topped up so the girls live to the moments.
- Some frames are **staged** with `actor.setPose` on the live fight:
  - `rikku-black-mage/attack` and `paine-black-mage/attack`. Black Mage has no Attack command,
    so no moment in the game asks for these paintings.
  - `paine-black-mage/victory`. Paine's Change is disabled in Chapter IV (Curse, "cannot
    spherechange"). Every Chapter V run was lost at about turn 21 to the Vegnagun clocks, before
    any victory.

**Which chapter proves which pose:**
- **XIII:** the seven line-up poses.
- **IV:**
  - Yuna Black Mage item;
  - Yuna Warrior victory;
  - Rikku Black Mage cast (her attack is staged);
  - Rikku Gunner victory.
- **V:**
  - Rikku Gunner cast;
  - Paine Black Mage cast and item (her attack and victory are staged);
  - Paine Dark Knight attack and item. She wears Dark Knight at V's start, so these two are
    proved in a live chapter as well as in XIII (`V-<viewport>-paine-dk.json`).
- **VI:**
  - Yuna Gunner item and Yuna Songstress item;
  - Rikku White Mage attack and Rikku Thief ko;
  - Paine Warrior victory.

## Borrowed slots

`resolved-pose-maps.json` comes from running the game's own `resolvePoseMap` against the
regenerated manifest. The existing `POSE_FALLBACKS` chain in `src/engine/BattlePresenterArt.ts`
now fills six failed slots with a neighbouring installed painting instead of the idle:
- Yuna Dark Knight cast shows her attack painting.
- Paine Dark Knight cast shows her attack painting.
- Rikku White Mage cast shows her attack painting.
- Rikku Alchemist ko shows her hurt painting.
- Rikku Black Mage item shows her cast painting.
- Rikku Gunner item shows her cast painting.

No code was changed. Whether these slots should fall back to the idle instead is the driver's
call, and possibly Bailey's.

**Fixed in repair cycle 1 (2026-09-25), see `rescale/README.md`.** A dressphere's failed cast, item and
ko slots now show the standing painting, as D-179 says. The head scales were re-measured: 14 of the 22
sidecars changed. The `ratio`/`sidecarScale` pairs above are the installed values, before the repair.
