# Option sheet: where Vegnagun's Body stands at link 3 (Chapter 5)

**Game case: FFX-2 only.** Chapter 5, the Farplane, link 3 (Vegnagun's Body with its
Right and Left Bulwark). Since D-044 (Bulwark option C*) the Bulwarks are figure-less
rings on the Body painting's own feet, so the Body's spot decides where the Left
Bulwark's ring, target bracket and name plate land. FFX has no counterpart.

**Status:** options only. The build ships option A, the live build's frame (76f587c3),
because the brief was to put the Body back where live had it. Nothing else here is built.

## The question

With the Body drawn where live drew it, the Left Bulwark's ring sits on the far claw,
which is under the FFX-2 command window. No decision in `docs/target/decisions.json`
settles where the Body (or the ring) should stand, so: **which spot should the Body take
at link 3?**

## What live actually looked like

On live each Bulwark was a hooded-cone figure of its own (the placeholder D-044 removed),
standing in front of the Body; the Left one's ring was at x ~985 at 1600x900, clear of the
window, and the Body was faded behind the cones. Live stood the Body at x 5.28..5.82, z -10,
and `ProneLay` slid its wide painting +1.38 along the floor (it counts as prone by its
shape), so the painting was drawn centred on x ~6.7..7.2: box x 998..1054 to 1471..1528 at
1600x900 depending on the run. The top row of `sheet.jpg` is a live capture.

The build now stands a pinned figure exactly on its spot (a pin is never slid), so the
spots below are where the painting is drawn.

## Evidence

Real 1600x900 captures (GPU, RTX 5070 Ti D3D11, seed 1, `?coach=off`). Links 1-2 ran on
auto ("intended") at skip speed; link 3 was played with real keys (ATTACK, then
ArrowRight to Left Bulwark). B, C and D were set at runtime on the same run as A, so the
rows differ only in the Body's spot.

- `sheet.jpg`: live, then A-D, at 0.5 scale; first menu on the left, Left Bulwark targeted
  on the right. Look at this first.
- `live.jpg`, `a.jpg` to `d.jpg`: the Left Bulwark targeted frame of each, full size.

The command window runs x 1246-1570, y 351-609.

| Option | Body spot (x, y, z) | Left Bulwark ring | Left Bulwark name plate | Body on screen |
|---|---|---|---|---|
| live 76f587c3 | its own figure | x 918-1055 (figure), clear | x 939-1034, clear | x 1019-1493, faded behind the cones |
| A (built) | 7.15, 0, -10 | x 1440-1529, under the window | x 1436-1531, under the CHANGE row | x 1054-1527, as live |
| B | 3.6, 0, -11 | x 1150-1234, 12 px left of it | x 1144-1239, 7 px left of it | x 777-1230, ~4% smaller |
| C | 2.8, 0, -12 | x 1073-1153, 93 px clear | x 1065-1161, 85 px clear | x 717-1151, ~8% smaller |
| D | 3.2, 0, -10 | x 1138-1226, 20 px clear | x 1134-1229, 17 px clear | x 747-1222, live's size |

In every option the Right Bulwark's ring is on the near claw, clear of the party, and no
party painting overlaps the Body. The intent card ("Charge Core") moves with the target
and covers part of the Body's lower half in B, C and D when Left Bulwark is targeted; that
is the HUD's own placement, not staging.

## Recommendation

**C**, then D. C clears both the ring and the plate with a margin at the cost of a
slightly smaller Body standing deeper; D keeps live's size and depth but clears the window
by less than 20 px and stands the Body's box against Paine's. B sits on the window's edge.
A is live's frame; its defect is new with D-044, because live's Left Bulwark was a separate
figure.
