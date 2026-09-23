# Ormi LoRA poses: independent judge (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc). Art review only. No game file, shared
tool or render changed (AGENTS.md hard rule 14). This pass was done by a
different agent from the one that painted the set. The painter's write-up and
self-scores are in `poses/poses.md`. **I rendered nothing.**

**Verdict: FAIL for the set. Only cast reaches the bar (7).** The installed
scores are attack 5, cast 7, hurt 4 and ko 4. All four files stay CANDIDATES.
Nothing was added to `docs/target/approved-hashes.json`. Its sha256 is
`3c5af02f...` before and after this pass, and its 115 files verify identical
before and after (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115,
mismatched 0, missing 0). The idle `f7fcdfc3...` is unchanged.

**Sheet:** `judge-sheet.jpg`, built by `judge-sheet.py`.
- Row 1: idle and the four picks, whole, at one pixel scale. This is how the
  engine sizes them.
- Row 2: the round-3 files they replaced, taken from the backup, at the same
  scale.
- Rows 3 to 5: heads, shields and costume at native 1:1.
- Row 6: the hurt render I recommend as the next base. It is not installed.

**Provenance check:**
- The four installed PNGs hash the same as the pick cut-outs in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi/picks/`,
  and the same as the `sha256` in each sidecar: attack `7c56361f`, cast
  `f0a88fc5`, hurt `8771fa3c`, ko `ba5e61b2`.
- Every alpha channel is binary, with 0 semi-transparent pixels. So the
  "translucent" attack hem is painted in, not a cut-out fringe.
- I also looked at every candidate on `poses/candidates.jpg`, and at the
  alternatives hurt p5 960242, hurt p8 960261 and ko p5 960341 at full size.

## Method

- **Anchor:** `public/art/characters/ormi/idle.png`.
- **Criteria:** the same seven as `sets/ormi/round3/judge.md`: head and
  topknot, face, costume, shield, build, line and shading style, and whether
  the pose reads as its state.
- **Scoring:** each criterion is 0 to 10. The score is the worst criterion.
  The bar is 7.
- **The heart:** as in round 3, the idle's shield has no heart. It has a purple
  sunburst face inside a red, gold-studded band. So the heart is judged against
  research §10.1, and the shield's other features are judged against idle.
- **What each state must show:** from `research/ffx2-leblanc-syndicate.md`,
  attack is Shield Bash (the normal attack). Cast is a special wind-up
  (Supercollider or Huggles).

## Scores

| State | Pick | Head | Face | Costume | Shield | Build | Style | Pose | **Score** | Worst |
|---|---|---|---|---|---|---|---|---|---|---|
| attack | p3 960022 + erase + back 970023 | 6: small purple ball topknot and red tie; no tassel | 6: angry, bared teeth. At 3x the iris is grey, not idle's green; no cheek or temple mark | **5**: purple armour, crimson sleeves, yellow sash and teal curtain are right. But the hakama hem of both legs is painted as a washed-out white band with beige flame shapes (about the bottom 150 px of each leg). An invented red heart brooch on the shoulder | 6: one shield with a red heart on a purple face. It is seen almost edge-on, so it reads oval. Gold rim only: no red studded band, no sunburst | 8 | 7: idle's cel and painterly finish | 7: a forward lean with the shield pushed at arm's length. It reads as a shove or bash, the right way round | **5** | costume |
| cast | 960106 | 7: maroon topknot, red tie; no tassel | 7: green eye, bared teeth, scowl; a faint temple mark, no cheek circle | 7: idle's gold diamond hem (the only pick with it), crimson sleeves, gold-and-green collar, teal scaled curtain. Invented: a red heart clasp with magenta tassels at the collar, and a red scaled panel above the curtain | 8: one round shield with a gold studded rim. Its face is a purple sunburst (idle's) with a clear red heart (research). It is carried at his side, not strapped on his back | 8 | 7: matches idle | 7: raised fist, planted legs, teeth bared. It reads as a wind-up or war cry, which fits a Supercollider or Huggles cast | **7** | head, face, costume, style, pose |
| hurt | p8 960262 | 7: the tassel is red, green and white, the closest of the four to idle | **4**: eyes shut and blushing, the mouth a small round "o" with no teeth. It reads as singing or content, not as a wince | **4**: the yellow sash balloons over the whole belly like a sack he is holding. The hem is flat yellow stripes, not diamonds. Purple ribbons on the wrist | **4**: edge-on on his back, only the studded gold rim shows. No heart, no face | 8 | **4**: flat neon fills and hard yellow highlights; it looks like a different illustrator from idle | 5: head back, open palm flung high, hand on the belly. With the serene face it reads as a proclamation more than a hit | **4** | face, costume, shield, style |
| ko | p4 960336 + heart 970103 | 7: purple ball topknot, red tie, red and black tassel | 7: eyes shut, slack; no cheek mark | 5: sleeves orange-red, not crimson; glossy purple wrist guard; the curtain and hem are hidden. A dark red, pointed floor-reflection shape under the arm at about (870 to 1060, 640 to 700) that will read as a puddle or flap | 5: one huge round shield standing on edge behind him like a halo. Gold rim, blue band, red band with olive studs, blue centre. The repainted heart is small, set in gold filigree. Not idle's sunburst | 8 | **4**: glossy, airbrushed, with neon green edge lines, the "jelly" finish again; unlike idle and unlike attack and cast | 8: flat on his back, eyes shut, unmistakable | **4** | style |

**My scores against the painter's (`poses/poses.md`):**
- **Attack 6 → 5.** The painted hem fade is a render defect on the lower
  third of the figure, not a small drift. It is plain at engine scale (sheet
  row 1). The eye is not green.
- **Cast 7 → 7.** I agree, but 7 is the lowest of five tied criteria. I found
  no cheek circle. The painter credited "idle's cheek mark"; I see only a faint
  temple mark.
- **Hurt 4 → 4.** I agree on the number but not the reasons. The worst problem
  is the expression: no wince, it reads as singing. The sash sack and the neon
  finish tie with it. The painter scored face 6 and style 5.
- **Ko 5 → 4.** The glossy neon finish is further from idle than round 3's
  flat ko, which that judge scored 5 on style. The floor-reflection shape is
  new.

## What the LoRA changed, against round 3

| State | Round 3 (judge) | LoRA (this judge) | Change |
|---|---|---|---|
| attack | 5 (costume, pose) | 5 (costume) | Pose fixed: the shield now leads the bash. Hakama and curtain fixed. A new painted hem fade takes costume back to 5 |
| cast | 4 (shield: no heart) | **7** | The heart moved from the chest clasp onto the shield, and idle's sunburst and diamond hem appeared. **The one state the LoRA carried over the bar** |
| hurt | 5 | 4 | Worse. Round 3's shield showed a flat heart; this one is edge-on. Round 3's shout-to-the-sky face is now a singing face. Still the flat, outlined style |
| ko | 4 (head, costume) | 4 (style) | Head and torso colour fixed: a purple torso and a correct topknot. But the finish went from flat-outlined to glossy neon |

**Set-level, measured on the installed files:**
1. **Head scale is fixed.** Round 3's heads were about 1.5 times idle's.
   - I measured the skin area of the bald head from a scalp seed, then took the
     square root to get a linear size: idle 116, attack 120 (1.03x), cast 126
     (1.09x), hurt 100 (0.86x), ko 105 (0.90x).
   - Hurt's head is thrown back and partly blushed, which lowers its number.
   - Figure areas: idle 334,758; attack 381,316; cast 441,798; hurt 365,800;
     ko 450,435. Round 3's hurt was 562,545, so Ormi no longer swells when he
     is hit.
   - Credit the OpenPose skeletons drawn over the idle (`skel-overlay.jpg`).
2. **Facing is fixed.** All four face screen-right like the idle, and every
   sidecar says `facing: "right"`, so the engine mirrors the whole set the same
   way. Round 3 turned him round between states. I read this from the pixels
   and the sidecars. I did not see it in a running battle.
3. **Identity drift is mostly fixed.**
   - A purple kimono and hakama in all four.
   - A yellow sash in all four.
   - The teal curtain in attack, cast and hurt (hidden in ko).
   - A maroon or purple topknot with a red tie in all four.
   - Crimson sleeves in attack and cast; hurt and ko are still orange-red.
   - No rainbow scarves, lilac hakamas or beige topknots.
   - This is the LoRA's real gain.
4. **The two-finish problem remains, and is sharper.** Attack and cast match
   idle's painterly cel. Hurt and ko are flat or glossy neon. Round-3 judge
   item 4 (style unification) is still open and is now the main blocker.
5. **The heart:** clear in cast, present in attack (edge-on), repainted in ko,
   absent in hurt.
6. **The LoRA's back shield.**
   - The painter found that the one-painting LoRA always adds a back-mounted
     second shield.
   - The candidates confirm it: about half the attack, hurt and ko renders have
     two to four shields.
   - The erase-and-repaint on attack is clean at 1:1. The back contour and the
     collar continue with no seam I can see.

## Redo, in order

This is the fourth pass on the Ormi set, so hard rule 15 applies: fix these by
editing frames, not with another batch of prompt words. **Show Bailey this
sheet, and ask whether the cast at 7 may stand as the target for the others.**

1. **Hurt: change base.**
   - Use **hurt p5 960242** (sheet row 6). Its eyes are squeezed shut, it
     frowns: a real wince. It keeps idle's diamond hem, the
     teal curtain and idle's painterly finish.
   - Its shield shows the sunburst face, so it can take the round-3 heart
     repaint (`repaint.mjs`, the ko recipe).
   - Its weak point: the flung arm also reads a little as reaching up. A
     masked repaint that brings that hand toward his face, or bends the arm,
     would sharpen it.
   - I expect it to score about 6 before the heart repaint and 7 after. That
     is a guess until it is rendered and judged.
2. **Attack: repaint the hakama hem.**
   - A masked repaint of both hem bands (about y 700 to 880 in the cut-out)
     with `purple hakama, gold diamond pattern hem`, using cast's hem as the
     reference.
   - Also erase or repaint the shoulder heart brooch.
   - Attack's other criteria are 6 to 8, so the costume fix plus a tassel and
     green-eye repaint should reach 7.
3. **Ko: a style pass.**
   - img2img at 0.15 to 0.25 denoise over the whole frame, with idle (or cast)
     as the IP-Adapter style reference and the LoRA at 0.8, to take off the
     gloss and neon edges.
   - Remove the red floor-reflection shape under the arm (`erase.py`).
   - Or re-pick. No other ko render is clean, though: ko p5 960341 has the
     same gloss.
4. **Cast: small repaints (optional).** Remove the collar heart clasp and add
   idle's tassel to the topknot. These would lift cast off the edge of the bar;
   they are not needed to pass.
5. **Upstream.** Adding cast.960106 to the LoRA's training set, with a caption
   like "shield at side", would give the trigger a second view that does not
   carry the back shield. That is a new training run, so it waits on the GPU
   gate and on the owner's plan.

## Hard rule 6

§10.1 of the research supports only these: a stout build, a large shield on
his back with the Syndicate heart logo, and purple samurai-style attire. The
topknot colour, sleeve colour, sash, curtain, hem pattern and shield colours
are judged against the installed idle, not against a source. The idle's
heartless shield still contradicts §10.1.
