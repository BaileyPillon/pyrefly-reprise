# Macalania production — independent judge (2026-09-22)

**Game: FFX only** (art for an FFX chapter; AGENTS.md rule 14). Judge only: nothing
was rendered, installed, moved or approved. Every item stays a **CANDIDATE**.

**Evidence:** `judge-sheet.jpg` (this folder). It shows each set whole beside its
picked concept, faces at 1:1, and each cut-out defect at 1:1 or at 4x nearest-neighbour.
I scored each item on the worst criterion; the bar is 7. The criteria were identity
across states, costume, colours, style, how the pose reads, and a clean cut-out (no
holes, specks or white edges), judged against the picked concept (`../renders/seymour-b.png`,
`guardian-a.png`, `backdrop-a.png`), the picked idle and `research/ffx-seymour-anima-macalania.md`
§9. The cut-out checks were also measured: alpha touching the canvas edge, islands,
enclosed holes, and opaque near-white regions next to transparency.

**Integrity:** `docs/target/approved-hashes.json` has 26 sets and 115 files. All 115
match on disk and none are missing. Anima's approved idle, attack and overdrive
still carry their 2026-09-18/19 mtimes. `node tools/gen/manifest.mjs --check`
reports the manifest unchanged.

## Verdict: FAIL (2 of 14 items at 7; 12 below)

Most of the misses are cheap to fix. Two are a facing flag in a sidecar and three
are cut-out masks, so none of those five needs a new render. Four items are real
repaints.

| Item | Score | Worst criterion | What I saw at 1:1 |
|---|---:|---|---|
| Seymour idle | **6** | facing | Concept B carried over well: navy robe, red trim, green sash and underskirt, hem lattice, tattooed chest, human ear, a courteous smile. **The painting faces frame-RIGHT** (head and gaze turned right, as concept B was), but the sidecar says `facing: "left"`. The engine mirrors only when the declared facing differs from the enemy's world facing (`PaintedActor`), so in battle he looks **away from the party**. Fix the flag to `right`, or run `flip.py --set-facing right`. Research gives no fringe side, so mirroring is allowed. It reaches 7 once the facing is fixed. |
| Seymour attack | **4** | identity | A different man: an older, grim face with **red war-paint streaks and scars** that the idle does not have, near-white hair (not light blue), a teal underskirt (not green) and no hem lattice. The cut-out is clean and the full body is in frame. **Low priority:** research §4.1 gives Seymour no physical action (every row is magic), so this pose is rarely or never shown. |
| Seymour cast | **6** | colours | The same face as the idle and a clear spell pose (arm raised, hand on chest). The robe is a brighter blue, there is a yellow tassel the idle lacks, and the chest tattoo is drawn as red vein lines. **This is his most-seen pose** (all his actions are spells), so it is worth one more attempt. |
| Seymour hurt | **5** | cut-out | **Opaque white background is left between the sash and the sleeve** (about x410-466, y442-612, roughly 2,000 opaque white px). It also **faces right** with a `left` sidecar, like the idle. The orange/teal sleeve emblem is not on the idle. The head-back, eyes-shut pose reads closer to a swoon than a hit. |
| Seymour ko | **5** | cut-out | **The hair is cut straight at the left canvas edge** (247 rows of alpha at x=0): a hard vertical edge. The chest tattoo reads as a red diamond, and the robe has fallen off both shoulders. The head points left, which is correct. |
| Guardian idle | **6** | facing / identity | Concept A's grey-blue skin, ochre robe, green trim, and a **full, readable belt pouch** (§9.3). The head is almost a **flat 90° profile** (the facing contract calls that a reject, although concept A was drawn that way too). The spear is held blade-down, the feet are bare, and he has a ponytail where the concept has tendrils. The painting is softer and paler than the other four states. |
| Guardian attack | **5** | costume | The spear has **two heads**, one near the face and one at the hand. The skin is saturated cyan (the idle is grey-blue) and the robe is orange. The crouch reads as sneaking more than striking. **Low priority:** §4.2 gives the Guardian no physical action. |
| Guardian cast | **6** | identity across states | This is the best read in the set: a raised green potion, the pouch, a three-quarter face. It would be a 7 on every criterion except **skin tone: bright cyan against the idle's grey-blue**. It is the Guardian's most-shown pose (potions, Remedy, Protect and spells all use it). |
| Guardian hurt | **6** | facing | The head is thrown back in a **flat profile** with a hand on the stomach, and the pouch is kept. The spear is slung on the back. Skin is cyan, as in cast. |
| Guardian ko | **5** | cut-out | **A white slab is left under the head**, between the hair and the arm (about x98-209, y269-367), plus a white strip along the spear under the robe. The spear tip touches the right edge (17 rows). A stray red ribbon trails from the top left. |
| Anima hurt | **7** | pose read (mild) | **The same creature as the approved idle at 1:1**: the one red eye, the stitched horns, the pauldron, the bandaged arms, the fur skirt. The cut-out is as clean as the approved idle's. The recoil is small but it reads. |
| Anima ko | **5** | pose read | Her identity holds (8), but the pose is the idle **leaning forward about 14°**. It reads as a bow or a lean, not a collapse. Mitigation: she leaves the field as a `part` on death, so the pose is shown only briefly. |
| Backdrop | **7** | palette | It keeps A's composition: the circular hall, the glowing ice arches carrying light, the braziers, the reflective floor. The metalwork is crisper. At 1:1 it is slightly soft from the 2x route, and one brazier has a thin stick-like line above its flame. The warm end of §9.1 (temple red, Guado ochre) is nearly absent, just as it was in A. |
| Pause plate | **6** | scene | A strong face at the approved plates' quality: purple eye, human ear, courteous smile. **The background is a village of lantern-lit rooftops with ice spires, not the temple antechamber** (§9.1). The facial veins read as a cheek scar, and the hair shades from pale to royal blue at the crown. The 2x master decodes at 2688x1536. |

## Winner and recipe

- **Best identity hold:** Anima hurt, from the **puppet method** (`puppet.py`: rotate the
  approved idle as a whole, then img2img at denoise 0.3-0.4 with method F refs). It is the only
  state that is unmistakably the same painting as its anchor. For a non-human
  subject with an approved idle, it is the recipe to reuse. Its limit is pose range,
  as the ko shows.
- **Method F** (square + head refs, concat, 0.4, ease in, 0.2-0.6; Animagine XL 4.0,
  28 steps, cfg 6) held Seymour's **face** in cast, hurt and ko and the Guardian's
  pouch in every state. It did not hold **colour** (Guardian skin, Seymour's
  underskirt) or small costume marks (the tattoo, the sleeve emblems), and it lost the
  whole identity in Seymour's attack. The same drift appeared in the Leblanc sets.
- **Backdrop:** img2img from the picked frame at 0.45 kept the composition. Keep it.

## Redo list (cheapest first)

1. **Seymour idle and hurt, facing:** set the sidecar `facing` to `"right"` (the engine then
   mirrors them to face the party), or run `flip.py --set-facing right`. This needs no
   render. Both must change, or the attack/cast/idle set will flip-flop on screen.
2. **Seymour hurt cut-out:** remove the white slab between the sash and the sleeve
   (alpha out x410-466, y442-612 where the pixel is near-white, or re-cut with a lower alpha threshold).
3. **Guardian ko cut-out:** remove the white slab under the head (x98-209, y269-367) and the
   strip along the spear (x817-1063, y384-510). Pad the canvas so the spear tip clears the edge.
4. **Seymour ko:** pad or outpaint the left edge so the hair ends naturally instead of at x=0.
5. **Guardian skin match:** colour-grade so all five states share one skin hue. Concept A
   and the idle are grey-blue, so grade the other four toward the idle, or repaint the idle
   if Bailey prefers the cyan. The same pass can fix the Guardian's orange robe in attack.
6. **Seymour cast (his most-seen pose):** one more method F batch with negatives for
   `yellow ribbon`, a brighter robe and red vein tattoos, keeping the idle as the only ref.
7. **Pause plate:** repaint the background as the ice antechamber (the backdrop as a ref or
   img2img base), keep the face, and tone down the cheek "scar".
8. **Anima ko:** a larger puppet move (a drop plus 30-45° of rotation) if a collapse is wanted.
   Otherwise accept it, since she exits as a part.
9. **Low priority (poses the research says are never used):** Seymour attack (repaint from
   the idle with negatives for `facial paint, scar, white hair`) and Guardian attack (one spear head).

## Wiring note for the integrator (not verified by running; hard rule 3)

`src/data/ffx/enemies/seymour-anima-macalania.ts:121` and `:166` set
`spriteKey: 'seymour'`, but the paintings live under `characters/seymour-macalania/`.
There is no `characters/seymour/` folder. The initial stage resolve falls back to the
enemy id (`BattlePresenterStage.ts:175` tries `[artIdFor, spriteKey, id]`). The
form-change path, `BattlePresenterBeats.ts:176` `setArt(enemyId, spriteKey)`, may
not fall back. Act 3's full-HP restore could lose the painting if it runs through a
form change. Run the chapter to check before relying on it.
