# Leblanc LoRA poses: the redo after the independent judge (2026-09-23)

FFX-2 only (Chapter 6 boss art; no game file, no shared tool, no FFX art
touched; AGENTS.md hard rule 14). This is the redo the independent judge
(`../judge.md`: attack 6, cast 6, hurt 5, ko 6, bar 7) asked for, run as the
last attempt on this method. **Every installed image is a CANDIDATE marked
"best available, below bar".** Nothing was added to
`docs/target/approved-hashes.json`; its 115 files hash the same before and
after (`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: ok 115, mismatched
0, missing 0). No training ran; renders went one prompt at a time behind the
shared ComfyUI queue, which was never restarted; nothing was downloaded.

**Sheet:** `sheet.jpg`. One row per state: idle (x0.5), the v3 pick this redo
replaced (x0.5), the redo pick (x0.5), idle's face and costume against the
pick's at 1:1, then 1:1 crops of each region the judge named, idle's
matching region first. Cast's row shows both open-fan colours.

## What the judge asked for, and what was done

| State | Judge asked | Done | Installed |
|---|---|---|---|
| hurt (5) | switch to `hurt.v3.5` after a 1:1 check, or re-render with the far foot visibly in front of the robe hem | Checked `hurt.v3.5` at 1:1 and rejected it: a faint smile, not a wince; closed-toe boots; no fan visible. Re-rendered 6 on a new skeleton (`skeletons/v4/hurt.png`: the far leg comes down screen-left of the hip, in front of the robe, which the fan arm carries off to screen-right), OpenPose 0.75 to 0.9 (it was 0.6), `one leg, missing leg, amputee` in the negative. All 6 have both legs. | `hurt.v4.5` |
| attack (6) | keep the fan-led strike; a skeleton that plants the rear foot and shows the front shin; `wings, cape` in the negative; open-toe boots | Four sets of 6 (v4 to v7, below). Both feet planted and no robe lobes from v4 on; the fan direction was the hard part. v7 put the fan thrust at the party with both feet planted and open-toe boots, so no feet repaint was needed. | `attack.v7.2` (painted ground shadow under the rear boot cleared from the alpha) |
| cast (6) | Bailey picks the open leaf's colour; then a masked repaint of the leaf, the jaw patch and the heart; the pose stays | The pose stays (`cast.v3.6`). Heart, choker studs and the near eye were repainted with masks. The black jaw patch came back black in 9 masked repaints, including a from-scratch inpaint, so it was recoloured as the neck in shadow and then lightly repainted. **The leaf is recoloured two ways, pixel by pixel inside the fan's sector with no diffusion**: red and silver (research §10.1) and black (idle's ribs). | `cast.r2red` (the black alternative is `cast.r2black`) |
| ko (6) | a masked repaint of the fan guard to black and the boots to open-toe; clean the cheek smear and mouth nick; remove the painted ground shadow from the cutout alpha (no re-render) | The face was repainted with a mask. The boots were repainted open-toe, then a second small pass on the toes. The fan guard came back tan in 3 repaints, so it was recoloured to charcoal inside a polygon that stops at the hand, then smoothed. The ground shadow was cleared from the alpha (`shadow.py`) and the cut-out re-cropped. | `ko.r2` (`ko.r2.noshadow.png`) |

## The attack sets (why four)

- **v4** (`skeletons/v4/attack.png`): the hip moved left so the rear foot lands
  inside the frame (v3's was at x 824 of 832), with the front shin near
  vertical. OpenPose 0.75 to 0.9, `wings, cape, flying, jumping, midair` in
  the negative. The feet were planted in all 6 and the robe lobes were gone. But at
  that strength the model read the full-width shoulders as a body facing
  the viewer. It put the fan in the far hand and swung it to **screen-right**,
  away from the party.
- **v5** (`skeletons/v5/attack.png`): one extended arm only, with the far hand on the
  hip. The fan still went to screen-right, or overhead.
- **v6** (`skeletons/v6/attack.png`): the body drawn near profile (shoulders
  and hips a third of the idle's width), OpenPose back to 0.6 to 0.75. v6.3
  was a planted, fan-led lunge, but the fan left the 832 px canvas and the
  rear boot met the bottom edge. Two outpaint tries (`outpaint.mjs`) either
  left the fan in pieces or left a seam in the robe.
- **v7** (`skeletons/v7/attack.png`): v6's skeleton on a 1024x1216 canvas,
  shifted 150 px right and 40 px up. `v7.1` and `v7.2` both lead with the fan
  at the party with both feet planted and open-toe boots. `cutout-guard`
  rejected v7.1 to v7.3 as "the crop box covers over 96.5% of the canvas". Its
  rule is aimed at painted backdrops. Here the lunge fills the frame. Every
  border pixel of the v7.2 cut-out is transparent and the black backdrop
  is gone at 1:1, so the sidecar records the override and why.

## The picks (self-judged at 1:1 against idle; the worst criterion is the score)

These are my scores, not an independent pass. By the round-3 rule nothing
counts as passing until an independent judge says so, so every sidecar and
`tools/gen/cast.json` row says **best available, below bar**.

| State | Pick | Seed, LoRA / OpenPose | Worst (self) | Named |
|---|---|---|---|---|
| attack | `attack.v7.2` | 61182, 0.75 / 0.65, set v7 | 7 | Profile to screen-left, the closed black fan thrust out at arm's length, the far hand on the hip, the front shin down to a planted boot, the rear leg straight to a planted boot, v-brows. Open-toe lace-ups on both feet, no wing lobes, a studded choker, the heart, obi, tassel and robe as idle. Off: a solid dark patch where the hair meets the face on the near side (idle has a thin shade); the boots are a deeper purple than idle's lavender. |
| cast | `cast.r2red` | 61206, 0.75 / 0.7, v3.6 + repairs | 7 | The pose is unchanged. The jaw patch now reads as neck, the heart is whole, the choker has studs and the near eye has its iris. Off: the studs are white strokes rather than idle's neat row; a thin dark line and a pale fleck stay under the jaw; the leaf colour waits on Bailey. |
| hurt | `hurt.v4.5` | 61325, 0.8 / 0.75, set v4 | 7 | Leaning back off balance, head tipped back, the near eye shut in a wince, mouth turned down, the hand on the stomach, the closed black fan held out; **both legs** to two planted open-toe boots. Off: a purple tassel on the fan's end (idle's fan has none); drawn a little smaller than idle (head about 170 px against 210) because of the low, leaning view. |
| ko | `ko.r2` | 61402, 0.8 / 0.7, v3.2 + repairs | 7 | Eyes closed, no smile, face clean; the fan black; open-toe boots; no painted shadow. Off: the repainted toes are rough at 2x (they read at 1:1); a few small gaps where the shadow met the robe's underside. |

## Open for Bailey

1. **The open fan's leaf colour (hard rule 6).** Idle only shows the fan
   closed, and its guards and ribs are black. Research §10.1 says "a
   red-and-silver fan". The installed `cast.png` has the research's red and
   silver leaf with black ribs and guards, which is consistent with both. The
   same frame with a black leaf is `cast.r2black.png` in the backup. The sheet
   shows both side by side. One word swaps them (`install-redo.mjs`, the cast
   `tag`/`png`).
2. **Size in the scene.** The attack lunge is 1020x1190 and the hurt recoil is
   drawn smaller than idle. `PaintedActor` sizes each pose by world height
   from `baselineY` to the top of the content. That has **not** been checked in the
   running game. Nothing in the game was run for this art pass.
3. **An independent judge** at 1:1, the same way `../judge.md` did it, before
   anyone calls these a pass.

## Files

- Recipes: `render.mjs` (sets v4 to v7; `--set v7` adds the size, the
  skeleton and the words), `skeletons.py` (writes `skeletons/v4..v7`; v3's
  attack and hurt are kept in `skeletons/v3/`), `repaint.mjs` (masked repaint,
  from the Ormi one), `outpaint.mjs` (tried, not used), `merge.py` (combines
  region repaints through their masks), and the pixel repairs `leaf.py`,
  `jaw.py`, `guard.py` and `shadow.py` (alpha clean-up and re-crop).
  `install-redo.mjs` installs the picks and `sheet.py` builds `sheet.jpg`.
- Raw frames, cut-outs, masks and sidecars: `D:/Tools/pyrefly-lora/leblanc/poses/`
  (not committed), backed up to
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc/all-candidates/`.
  The v3 picks this replaced are in that folder's `replaced-redo-2026-09-23/`,
  and the installed four are in its root.
- Installed: `public/art/characters/leblanc/{attack,cast,hurt,ko}.{png,json}`
  (gitignored; `status: CANDIDATE`, `quality: best available, below bar`,
  with `repairs` and `redoFixes` where they apply). `idle.png` is untouched.
  `tools/gen/cast.json`'s Leblanc rows have the redo recipe, with the v3 entry
  first under `history`. The manifest was regenerated (unchanged: leblanc
  `attack, cast, hurt, idle, ko`).
