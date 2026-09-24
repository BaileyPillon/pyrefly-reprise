# Option sheet: where Vegnagun's Body stands at link 3 (Chapter 5)

**Game case: FFX-2 only.** Chapter 5, the Farplane, link 3 (Vegnagun's Body with its
Right and Left Bulwark). The Bulwarks are figure-less rings on the Body painting's own
feet since D-044 (Bulwark option C*), so the Body's standing spot decides where the
Left Bulwark's ring, target bracket and name plate land. FFX has no counterpart.

**Status:** options only. The build ships option A (the spot the live build, 76f587c3,
settled the Body on), because the brief was to put the Body back where live had it.
Nothing else here is built.

## The question

With the Body on live's spot, the Left Bulwark's ring sits on the far claw, which is
under the FFX-2 command window at 1600x900; its plate is ~70% under the window. No
decision in `docs/target/decisions.json` settles where the Body (or the ring) should
stand, so: **which spot should the Body take at link 3?**

## Evidence

Real 1600x900 captures (GPU, RTX 5070 Ti D3D11, seed 1). Links 1-2 were skipped by
setting enemy HP to 1 (injected, labelled); link 3 was played with real keys (ATTACK,
then ArrowRight to Left Bulwark). The spot of each option was set at runtime on the
same run, so the three rows differ only in the Body's spot.

- `sheet.jpg`: all three at 0.5 scale, first menu on the left, Left Bulwark targeted
  on the right. Look at this first.
- `a.jpg`, `b.jpg`, `c.jpg`: the Left Bulwark targeted frame of each option, full size.

| Option | Body spot (x, y, z) | Left Bulwark ring (claw) | Left Bulwark plate | Body on screen |
|---|---|---|---|---|
| A (built) | 5.75, 0, -10 | x 1270, under the window (x 1246-1570, y 351-609) | x 1206-1337, ~70% under | x 840-1314 |
| B | 5.0, 0, -11 | x 1186, edge ~16 px left of the window | x 1122-1253, 7 px under | x 776-1227, ~5% smaller |
| C | 4.2, 0, -12 | x 1113, 66 px clear | x 1048-1180, clear | x 718-1151, ~9% smaller |

Live's own spot is not fixed: 76f587c3 settled the Body anywhere from x 5.21 to 5.90 at
z -10 from run to run (5.75 and 5.21 measured here, 5.90 by the phase-2 verifier), because
its relax runs while the opening camera is still moving. Option B sits just left of that
range. At 2000x1012 and 1280x720 option A behaves as at 1600x900 (ring under the window,
plate ~70% under): `docs/screenshots/formation-repair/ch5-link3-built-*.jpg`.

In all three the Right Bulwark's ring is on the near claw (x 771-898), clear of the
party, and no painted party figure overlaps the Body. The intent card ("Charge Core")
covers part of the Body in every option; that is HUD placement, not staging.

## Recommendation

**C**, then B. C is the only option that clears both the ring and the plate with a
margin; its cost is a slightly smaller Body standing nearer the party (its box starts
34 px inside Paine's, the paintings do not touch). B keeps the frame closest to live
but leaves the ring and plate on the window's edge. A is live's frame with the defect.
