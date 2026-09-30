# O2 "Guided first run": target vs build

Bailey's pick, 2026-09-29 (D-289). Built on branch `firstrun-o2`. Handoff: `docs/handoff/firstrun-o2.md`.

- `sheet-1600x900.jpg`: the approved mockup (left) and the build (right) for each of the three steps at 1600x900.
- `sheet-390x844.jpg`: the same at 390x844 (target | build per step).
- `build-o2-step*-*.jpg`: the build frames alone. Headless Chromium on the GPU, fresh profile, seed 1,
  real input: mouse at 1600x900 (the keyboard run gives the same frames), touch at 390x844.

What matches the target: the anchors (picture 64,133 778x407; START BATTLE 1233,642 307x61; ATTACK
87,511 392x58 at 1600x900, and 12,34 / 7,782 / 199,610 at 390x844 are the same boxes the mockup was
drawn on), the slab places, the chevrons, the words, the pips and the skip line.

Known differences:
- The mockup's corner slate ("02 · GUIDED FIRST RUN · STEP n OF 3") is the concept's own label and is not built.
- The board's foot hint reads LEFT/RIGHT CHOOSE · ENTER BEGIN in today's build (the mockup was drawn on the
  release-31a frame). That is the board, not the guide.
- On a phone, Auron's step-3 quote wraps before "it." (the mockup's fits on one line). The slab keeps the
  whole width inside 390 px; the mockup's ran to the edge.
- What the advisor chip and the HP rows show depends on the fight's seed and timing.

Proved by running (all in `D:/Tools/pyrefly-scratch/picks-0929/firstrun/`, `guide-walk.mjs`):
each ringed control acts on the first click, tap or Enter; Esc on the board and the tap-here skip leave
the player on the board with the guide gone for good; Esc at step 3 does not open the pause; a reload
at step 2 resumes the guide at step 2; `?coach=off` shows neither the briefing nor the guide.
