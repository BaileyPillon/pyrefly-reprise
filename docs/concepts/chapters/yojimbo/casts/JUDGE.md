# Chapter IX Yojimbo action paintings: independent 1:1 judge (FFX only)

**Game case: FFX only.** These are Lady Ginnem's Yojimbo and Daigoro in the Cavern of the Stolen Fayth. No FFX-2 chapter uses them.

I made none of these candidates. Each one was judged at 1:1 and at 2x (and at 4x to 5x on the seams) against its locked idle, on flat grey. I also judged the builder's 1600x900 GPU in-battle frames at 1:1. The bar is 7. Nothing was rendered, installed or changed.

- **Anchors checked:** `public/art/characters/yojimbo-cavern/idle.png` has sha256 `bc8f5c1e...`, and `public/art/characters/daigoro/idle.png` has sha256 `b9d952d3...`. Both match the sidecars. All four candidate hashes also match their sidecars.
- **Where the pixels changed** (my own diff against the idle):

  | Candidate | Pixels changed | Box of the changes |
  |---|---|---|
  | Yojimbo cast | 13,806 | x 34-303, y 88-502 (blade, fist, hip) |
  | Yojimbo hurt | 113,943 | the whole upper body, as a warp |
  | Daigoro cast | 7,981 | the muzzle only |
  | Daigoro alt | 6,908 | the muzzle only |

  All four have a binary alpha, like the idles.
- **My crops** are look-only JPEGs in `D:/Tools/pyrefly-scratch/yoj-judge/`.

## Scores

| Candidate | Identity | Anatomy | Hands / teeth | Blade | Seams | Edges | Finish | Reads at game size | **Overall** | Verdict |
|---|---|---|---|---|---|---|---|---|---|---|
| Yojimbo `cast.png` (drawn blade) | 9 | 7 | 6.5 | 6 | 6 | 7 | 6.5 | 6.5 | **6.5** | Below the bar. A pixel repair is needed first. |
| Yojimbo `hurt.png` (lean-back bake) | 8.5 | 7.5 | n/a | n/a (rigid) | 7.5 | 7.5 | 7 | 5 | **6** | Below the bar. I agree: use **none**. |
| Daigoro `cast.png` (30 degrees) | 9 | 7.5 | 6.5 | n/a | 6.5 | 7 | 7 | 8 | **7.0** | At the bar. Pass, with small touch-ups recommended. |
| Daigoro `cast-alt-narrow.png` (20 degrees) | 9 | 7.5 | 7.5 | n/a | 7.5 | 7.5 | 7.5 | 5.5 | **6.5** | Below the bar as a bite. It reads as a grin. |

**The worst: Yojimbo `cast.png`, the blade and its root.** At 1:1 the drawn blade does not yet look like the rest of the painting.

## Yojimbo cast: the drawn blade (6.5)

**What holds:**
- **Identity.** Everything outside the arm, blade and hip is the idle, pixel for pixel.
- **The pose.** The far forearm comes out from behind the breastplate. That is plausible for a far arm whose elbow is hidden by the torso. It reads as a relaxed one-handed draw while the near hand stays on the hip.
- **The hip erase is clean** at 2x. A small dark notch stays at the sash's left edge where the tsuba used to cross it. It is acceptable.

**What fails at 1:1 and 2x, worst first:**
1. **Blade root (habaki / tsuba join).** Where the blade meets the tsuba there is a ragged black blob, about 15 px, with red specks and a thin dark-red fringe along its left edge. It reads as a smudge, not as a collar. This is the single worst defect.
2. **The blade is a tube, not a katana.**
   - The tip is blunt and rounded, with no kissaki point.
   - The whole length is one smooth grey-blue gradient with no edge/spine distinction.
   - The spine side has a hard, stair-stepped white edge and no ink line. The idle's heavy black linework is missing all along the upper side, so the blade looks like a light tube pasted on.
3. **The blade looks short.** From tsuba to tip it measures about 243 px, which is shorter than the red scabbard beside it (about 263 px without its hidden hilt). Against a figure about 1,060 px tall it is closer to wakizashi length than to Yojimbo's long katana. This is a visual observation only. I did not look up a sourced blade length, and none should be invented. The builder or Bailey should decide whether to lengthen it.
4. **The fist is a mitten.** The purple glove wraps the hilt with no finger breaks and no ink contour on its leading (left) edge. A few pale lavender fringe pixels sit on that edge. The cuff and gauntlet are the idle's own and are fine.

**At game size (1600x900 frame, 1:1):**
- The blade is a thin pale line that sinks into the cave blue, and the fist is barely readable.
- In the builder's frames the advisor card covers most of the blade and the hand, not only the tip. But that frame held the cast pose during Kimahri's decision.
- `src/ui/common/MoveAdvisor.ts` says the card "clears itself the moment the command is taken", so during Yojimbo's real enemy-turn action the card is probably not there. I read this from the code and did not capture it.
- Even with the card gone, the action reads only modestly.

**Suggested repair** (pixel work first, METHOD-CHECK step 2, pilot and look at 1:1):
- Repaint the root as a clean small gold or steel collar.
- Ink the spine and the edge with the idle's line weight and add a proper kissaki.
- Ink the glove's leading edge and peel the lavender fringe.
- Optionally, lengthen the blade and give it a stronger light and dark value split (idle colours only) so it holds against the blue. Lengthening needs a yes.

## Yojimbo hurt: the bake (6), and I agree with **none**

- **The craft is clean.** The 6 plus 4 degree warp tears nothing at the sash, the near hand stays on the hip, and the hat cord still hangs true. There is slight Lanczos softening on the arm highlights and hat ribs at 2x.
- **The read is wrong for a hurt.** Tilting the torso and hat back makes him look chin-up and aloof, not struck.
- **At game size** it is nearly the same as the engine's flinch of the idle. The builder's call stands: a tie goes to none.

## Daigoro cast, 30 degrees (7.0, pass) and 20 degrees (6.5)

**30 degrees, what holds:**
- The jaw drop about the hinge is plausible.
- The upper face, eyes and mane are the idle.
- In the in-battle frame the open red mouth and fangs read clearly as a bite even though the head is small. This is the best game-size read of the set.

**30 degrees, what holds it at 7 and not higher:**
- **A pink/magenta speckle fringe** under the lower jaw, just outside the mouth. It is the worst seam.
- **The lower lip line** is a hard, angular black polygon with a sharp kink at the back corner. It is geometric next to the idle's brushy lines.
- **Too many teeth.** A picket of four or five white fangs runs along the upper lip at the front corner, more than the idle's anatomy suggests.
- **The eyes stay calm**, so the snarl is in the mouth only. That is acceptable for a bite.

**20 degrees:** the finish is cleaner, with fewer fringe pixels and a softer lip line, but with the tongue out it reads as a panting grin, not a bite. **I recommend 30 degrees**, ideally after a small pixel touch-up (peel the pink fringe, soften the lower-lip kink, thin the front fang row).

## Lady Ginnem

Nothing is needed. I did not re-run the builder's census. Their finding is that she has 0 actions and 0 hits across 80 battles, which matches the brief.

## Also noted (not scored)

The wiring gap stands: the chapter data still names the aeon `yojimbo` painting, and the Cavern idle is not wired. Neither `src/` nor `public/art` was touched by this judge.
