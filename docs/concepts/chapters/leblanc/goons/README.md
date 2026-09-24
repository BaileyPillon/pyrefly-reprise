# Dr. Goon and Fem-Goon: battle idle options (FFX-2 only, Chapter VI Act I)

**Options for Bailey. Nothing is installed.** The game still shows the procedural
silhouette placeholder (round-09 PR-0092). `options.jpg` is the sheet: each option shown
whole at 0.42x beside the trio's locked idles at the same scale, a 1:1 face crop, and a
1:1 crop of the battle frame (Ormi with both goons, 1600x900, GPU renderer).

Game case: **FFX-2 only**. The goons fight only in the Chateau Leblanc mission (Act I).

## What the sources say (research/ffx2-leblanc-syndicate.md)

- sec 10.1: "masks and skin-tight suits; pink for the women, army green for the men" (verified: 2 sources).
- sec 4.6: Dr. Goon uses Strike. Fem-Goon casts the four Lv.1 and Lv.2 elements and Fan Slap.
- The sources say nothing about the mask's shape, how much of the face shows, hair or
  build. A/B/C vary exactly those. Every option keeps the suit colours and the heart.

## Options

| | Dr. Goon | Fem-Goon |
|---|---|---|
| A | Full olive balaclava, boxer's guard (render seed 72304, pixel-repaired) | Full pink balaclava, heart on the brow (73303) |
| B | Olive hood and cloth face mask, brawler stance (72313) | Pink hood and cloth face mask (73313, pixel-repaired) |
| C | Black domino mask, face shown, cocky grin (72324) | Brown bob, pink domino mask, closed fan (73323) |

Flaws still visible: Dr. B keeps a front cloth tabard, a belt buckle and heeled boots.
Fem-B's chest emblem is a red splash, not a clean heart. Dr. A's mask is a shade darker
than his suit. Fem-A is a hotter magenta than the other two.

In battle, all six stand 95 to 104 px tall against Ormi's 123 px. The goons' engine
scale sets that, not the art. Look at it after the pick.

## How they were made

The same recipe as the trio's idles: `tools/gen/comfy.mjs character`, Animagine XL 4.0,
28 steps, cfg 6, full body, `prompts.json`. Each render was checked at 1:1 before the next.
Repairs changed pixels only, with no re-render: `repair_drA.py` (loincloth recoloured,
necklace painted out) and `repair_femB.py` (white and blue parts recoloured to the suit
pink). `ingame.mjs picks.json` puts the candidates into battle from a scratch copy that
`vite.goons.config.mjs` serves, so nothing is written under `public/art`. `sheet.py
spec.json` builds the sheet. Candidates, sidecars and battle frames:
`D:/Tools/pyrefly-lora/goons/r3/`. GPU time for the whole round: 3.0 minutes, 23 prompts.

After Bailey picks: install the chosen idle as `public/art/characters/ffx2-{dr,fem}-goon/idle.png`
with a sidecar `facing` that matches the pixels (picks.json has the observed facing), then one
cast each or none (METHOD-CHECK row 3).
