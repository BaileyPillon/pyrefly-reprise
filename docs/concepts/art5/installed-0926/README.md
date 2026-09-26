# The 20 installed pose-round-2 poses (D-194, 2026-09-26)

**Game case: FFX-2 only.** These are FFX-2 dressphere paintings, seen in Chapters IV, V, VI and XIII.

**Bailey, 2026-09-26 ~07:00 EDT, verbatim:** "I’ll go with all your recommendations" (D-194 in
`docs/target/decisions.json`: install the judge-PASS picks shown to him in
`../round2/round2-ready.jpg`). A pick approves only the pose as shown.

## What was installed

- **20 of the 21 tiles in `round2-ready.jpg`**, the D-194 install list in `../round2/README.md`.
- **Not installed: `rikku-thief/item` try b cand-8.** It was withdrawn under Bailey's own D-195 (the
  Thief is judged by body height). There it scores 6.94, and at body scale its head is 0.94 of the
  idle's (the gate is 0.45 to 0.85). The slot stays on the standing painting. The three body-gate
  Thief picks (item, hurt, victory) were never shown to Bailey and are not installed.
- **The files.** Each PNG is the judge's pick byte for byte:
  - 18 round-2 candidates from `D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/pose-round2/<slot>/`;
  - the two Paine Warrior method composites' cut-outs, `cand-7-comp.cut.png` (attack) and
    `cand-8-comp.cut.png` (cast), from `.../2026-09-26-method/paine-warrior/`.
- **The sidecars.** Each `.json` sidecar has the same shape as the 2026-09-25 install:
  - size and `baselineY` from the cut-out;
  - the head-matched `scale` and its `scaleNote`;
  - the generation record, `status`, `judge`, `candidateOf`, `sha256` and `installedFrom`;
  - `decision: "D-194"`.
- **Nothing was replaced:** every slot was empty. `public/art/manifest.json` was regenerated.
- **Backups:** `D:/Tools/pyrefly-art-backup/approved/2026-09-26-poses/installed/`, plus `replaced/`,
  which holds only a note saying nothing was replaced.
- **Lock:** `docs/target/approved-hashes.json`, set `bailey:2026-09-26-poses`.
  `verify-approved.mjs` gives 252 ok, 0 mismatched, 0 missing.

## The scales (`head-measure.json`, `heads-1.jpg`, `heads-2.jpg`)

The method is the one from the 2026-09-25 repair (`../installed/rescale/README.md`):

1. **Eye spacing.** Each iris is found by colour.
2. **Eye line to chin.** The chin point is checked on a gridded crop.
3. **Ratio.** Each reading is idle over pose.
4. **Disagreement.** When the two readings disagree, the head's turn or tilt decides.
5. **Visual check.** Each pose is checked by eye beside the idle head at the chosen scale.

The judge's own `headMatch` in `judge2.json` was read by eye from eye line to chin. Measured this
way, several picks came out differently. The largest differences:

| Pose | Judge | Installed | Why |
|---|---|---|---|
| rikku-gunner/attack | 1.23 | 1.00 | the chin is tucked into the scarf |
| yuna-warrior/hurt | 1.41 | 1.06 | her head is thrown back |
| paine-gunner/item | 1.54 | 1.21 | a three-quarter turn |
| rikku-white-mage/victory | 1.51 | 1.10 | at 1.22 her face drew visibly wider than the idle's |
| rikku-black-mage/ko | 1.17 | 0.75 | read with the face rotated upright |

**The Paine White Mage idle.** The judge's chin point sat on her mouth, so it was re-marked at the
jaw.

**The five ko poses.** The judge did not gate them. Each was read with the face rotated upright
against the idle:

| Pose | Scale |
|---|---|
| paine-black-mage/ko | 0.82 |
| paine-dark-knight/ko | 0.80 |
| rikku-black-mage/ko | 0.75 |
| rikku-gunner/ko | 0.83 (its bandana matches the idle's at the judge's 0.83) |
| yuna-songstress/ko | 0.85 |

Round 2 painted these heads large, so at head match the body lying down is about 0.8 of her
standing height.

**Confidence.** Standing poses are good to about 5 to 8 percent. The ko poses are good to about
10 percent.

## In game (`docs/screenshots/poses-0926/`)

**The build.** This was a production build (`vite build` into a scratch folder, served with
`vite preview` on port 5890). The runs were headless in gpu mode, with real keys from the title
through chapter select and party prep, and real-key commands in battle (Change, Attack, Skill,
Item). The script is scratch, `D:/Tools/pyrefly-scratch/pose-install-0926/run.mjs`, adapted from the
2026-09-25 verifier.

**`contact-1600x900.jpg`** shows all 20 poses at 1600x900 in their moments:
- **XIII:** Paine Dark Knight cast, Paine Dark Knight ko, Paine Gunner attack, Rikku Alchemist
  attack, Yuna Warrior hurt.
- **VI:** Yuna Songstress cast, ko and victory; Rikku White Mage cast and victory; Rikku Gunner
  attack, item and ko; Paine Warrior attack and cast; Paine White Mage cast; Paine Gunner item and
  victory.
- **IV:** Rikku Black Mage ko.
- **V:** Paine Black Mage ko.

**Checks on every capture:**
- The painting's URL is the installed file.
- It is never a placeholder.
- The in-game units-per-pixel over the idle's equals the sidecar scale. Two captures have no
  reading because the idle had not been drawn yet: Paine Gunner item and Rikku White Mage cast at
  1600x900. Rikku White Mage cast reads 1.26 on the phone.
- 0 console errors and 0 HTTP 4xx in any run.

**`contact-390x844.jpg`** is the phone check: the eight Chapter VI poses at 390x844, each ratio
equal to its sidecar.

**Labelled debug steps** (listed in each run's json under `debugNotes`):
- For each ko moment, one girl's HP was set to 1, then a real enemy hit knocked her out.
- For the victory, enemy HP was set to 1. In VI the victory is the clear of the first wave.
- Party HP was topped up so the fights last.
- No pose was staged with `setPose`.

**Chapter V.** A knocked-out girl lies behind the party HUD and past the right edge of the screen.
This is Chapter V's existing staging, with the party close to the camera. Paine Black Mage's ko can
only be reached in V, so its frame is also saved with the HUD hidden (screenshot only). It is still
cut by the edge. Rikku Black Mage's ko is shown in IV, where it is fully visible.

**Phone, Chapter VI.** Yuna stands at the left edge and is mostly out of frame at 390x844. This is
the existing phone framing, not the poses.
