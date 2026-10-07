# FFX party heights: the real relative stature of the seven heroes

Prepared 2026-10-07 by the `r3941-heights` lane for the driver. **Game case: FFX only.** The numbers below are
the FFX HD Remaster's own character models; the FFX-2 girls are not covered (section 7).

Authority: Bailey, 2026-10-07, "reverse engineer all the problems that are plaguing us for this project like
animations, heights of characters, bosses, certain boss mechanics etc.", then "fix the heights once you have the
numbers" and "show me the heights fix once it's ready".

**Confidence tag introduced here**

| Tag | Meaning |
|---|---|
| `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]` | Read from the retail Steam game's own character models by the REA lane's own mesh reader, as a ratio of two model heights. One reader, one pose (the model's bind pose), not yet checked against a live battle frame. |

The repo holds **ratios and the model-unit tops that make them, nothing else**: no game file, no mesh or vertex
data, no extracted text (AGENTS.md rule 8; the REA lane's own rule, "facts only").

---

## 1. What this settles

Our build drew all seven FFX heroes the same height. The engine sizes a figure as `worldHeight` over the idle
painting's feet row (`src/engine/PaintedScale.ts`), the stage gives the whole party one `partyHeight`
(`src/engine/BattlePresenterStage.ts`), and every approved idle is cropped the same way, so the painted top sits
the same 98.5 percent of the way up for all seven (measured on the approved idles, 0.9849 to 0.9865; the
2026-10-07 inventory, `re-questions.md` H1). The painting came from a diffusion model with no height control.
Bailey named "heights of characters". These ratios are the correction.

## 2. Method

- **Source files.** The live Steam FINAL FANTASY X/X-2 HD Remaster, **build 25501027** (the E: install), the
  character models `c001` to `c008` under the game's `chr/pc/<id>/mdl/d3d11/<id>.dae.phyre`. In the order of the
  lane's table: `c001` Tidus, `c002` Yuna, `c003` Auron, `c004` Kimahri, `c005` Wakka, `c006` Lulu, `c007` Rikku,
  `c008` Seymour. (`c004` to `c006` are confirmed for Kimahri, Wakka and Lulu by the FFX-2 copies `c204` to
  `c206`, whose bounds are the same.)
- **Reader.** The lane's own `.dae.phyre` mesh reader (`D:/Tools/rea/tools/phyre.mjs`, an independent
  implementation of the PhyreEngine cluster format; Phyre Lab's documentation and source were read as format
  documentation only, never built or run). The lane's saved report is `D:/Tools/rea/FINDINGS.md`, section H
  (outside the repo).
- **Measure.** The model's **silhouette top**, hair and horn included, in the engine's model units, in the
  **bind pose** (the rig's rest pose in the file). Each is then divided by Tidus's top, 18.15 units. Only the
  ratio is used; the unit is the engine's and means nothing here.
- **Why the top, hair and horn included.** Our painted figures are cropped to their silhouette top, hair, horn and
  all (the approved idles measure from the first painted row to the feet row), so the model's silhouette top is the
  quantity the paintings stand for.

## 3. The numbers `[datamined: FFX HD Remaster build 25501027, bind pose, one reader]`

| Character | Model | Top (model units) | Ratio to Tidus | Applied in the build |
|---|---|---|---|---|
| Tidus | `c001` | 18.15 | 1.000 | 1.000 |
| Yuna | `c002` | 16.53 | 0.911 | 0.911 |
| Auron | `c003` | 19.28 | 1.062 | 1.062 |
| Kimahri | `c004` | 21.98 | 1.211 | 1.211 |
| Wakka | `c005` | 21.80 | 1.201 | 1.201 |
| Lulu | `c006` | 17.97 | 0.990 | 0.990 |
| Rikku | `c007` | 16.54 | 0.911 | 0.911 |
| Seymour | `c008` | 20.32 | 1.119 | not applied (a boss; section 7) |

The ratios are `top / 18.15`, rounded to three places (checked by `tests/unit/ffx-party-stature.test.ts`). The
table the build reads is `src/data/ffx/party-stature.ts`; **it is the only place these numbers live**, so a better
measurement is a change to that table and nothing else.

## 4. Comparison with the wiki's published heights `[single source]`

The FF Wiki's heights are in `research/visual-bible.md` section 0.4 (single source). As ratios to Tidus's 175 cm,
kept for comparison only; the build does not use them.

| Character | Wiki height | Wiki ratio | Datamined ratio | Datamined minus wiki |
|---|---|---|---|---|
| Tidus | 175 cm | 1.000 | 1.000 | 0.000 |
| Yuna | 161 cm | 0.920 | 0.911 | -0.009 |
| Auron | 183 cm | 1.046 | 1.062 | +0.016 |
| Kimahri | 204 cm | 1.166 | 1.211 | +0.045 |
| Wakka | 188 cm | 1.074 | 1.201 | +0.127 |
| Lulu | 167 cm (173 cm in heels) | 0.954 (0.989 in heels) | 0.990 | +0.036 (+0.001 in heels) |
| Rikku | 157 cm | 0.897 | 0.911 | +0.014 |

Five of the six sit within 0.05 of the wiki. **Wakka is the outlier** (+0.127): the wiki's 188 cm is a body
height, and the model's top is the highest vertex of the silhouette, hair included, so Wakka's standing-up hair may
account for much of the gap. Lulu agrees with the wiki's height in heels (0.989 against 0.990), and her hair is a
tall stack as well, so the heels and the hair may be doing the same work. Those are readings, not findings: the
lane did not separate hair from body.

## 5. Caveats

1. **Bind pose is not battle stance.** The model file's rest pose is a standing pose; in a fight each hero holds a
   battle stance (weight forward, knees bent, a weapon up), and a stance can lower or raise the silhouette top by
   a few percent, differently for each hero. Another agent is checking these bind-pose ratios against the heroes'
   live in-battle idle heights in PCSX2 (the PS2 build). **If the two disagree, the battle-stance ratio is the one
   the player sees, and it replaces the table's number** (the table is built to be refined that way).
2. **One reader, one pose.** The numbers were read once, by one tool, with no second implementation.
3. **Our paintings are not the models.** The approved paintings show each hero in the painter's own stance, with
   the same painted-top margin (section 1); the ratio sets the painted silhouette's height, not its pose.
4. **Heights are not widths.** The build scales a figure uniformly about its feet, so a 21 percent taller Kimahri
   is also 21 percent wider than he was. The models' widths were not measured.

## 6. What the build does with them (FFX only)

`src/engine/BattlePresenterStage.ts` multiplies a party member's world height by its ratio before the figure is
built, and its contact shadow and turn ring by the same factor, so Tidus (1.000) is exactly as before and everyone
else is taller or shorter than he is by the table. The figure is sized about its feet, so the feet stay on the
ground line, and every pose of a hero uses the same factor, so the per-pose registration and the head lock
(CHK-026) are unchanged. The lookup applies only when the battle's game is FFX and the combatant is on the party's
side: FFX-2's Yuna and Rikku share the ids but not the game, and are untouched. A height a scene names for a
combatant itself (`SceneStaging.figureHeights`) is taken as given. Enemies, aeons and bosses are not touched.
`?stature=off` plays the old, equal heights for same-build before and after captures.

## 7. Not covered, and why

- **The FFX-2 girls.** The lane found three girl models, `c056` to `c070`, 16.3 to 17.7 units tall (0.90 to 0.975
  of Tidus), "not yet mapped to a girl or dressphere". In FFX-2, Tidus and Yuna use models identical to FFX's, and
  Kimahri, Wakka and Lulu appear as `c204` to `c206` with FFX's bounds. Nothing is applied to FFX-2 until the girls
  are mapped (AGENTS.md rule 14: a change true to FFX is not a change to FFX-2).
- **Seymour (1.119)** is a boss in our game and is recorded here only. Boss, aeon and fiend sizes are open: raw
  bounds are not comparable for summons and several monsters, "because the engine applies a scale that was not
  found" (the lane's section H). Boss sizes are not touched by this change.
