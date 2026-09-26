# B3 · Vegnagun as a colossus: options (2026-09-26)

**Game case: FFX-2 only.** Chapter V's four Vegnagun links have no FFX counterpart. Sources:
`research/visual-bible.md` §1.18 ("an insect the size of a cathedral… no single camera frame ever
contains it; the player fights a leg that fills the screen, then a tail, then a chest, then a
cannon-headed skull"; our art-direction note, the boss-size table is `[estimate]`) and
`research/ffx2-vegnagun-shuyin.md` (link order tail → leg + Nodes → body + Bulwarks → head +
Redoubts; "Nodes hang far overhead"). Plan: `docs/plans/presentation-program-2026-09-26.md`, B3
(top-ten item 7). **Nothing is built. Bailey picks; the pick then fixes the anchors for PR-0095,
PR-0094 and PR-0072.**

## What is on the sheets

Real-engine frames. The worktree `D:/pyrefly-mock-b3` was checked out from main at c0edc5c1, and
nothing under `src/` changed. Chapter V autoplays with seed 1 to each link's first menu. Then the
presenter pauses, and a console script moves and rescales the part actor, sets the per-link camera
rig, scales the backdrop, scales the D-044 C\* part rings with the part, and applies the grade. The
only art used is the paintings already installed: Tail A as picked, plus the shipped leg, body and
head. Nothing was rendered.

| File | What |
|---|---|
| `01-compare-1600.jpg` | Start here. 4 links × TODAY / C / A / B at 1600x900 |
| `02-option-A-1600.jpg`, `03-option-B-1600.jpg`, `04-option-C-1600.jpg` | One option per sheet, links 1-4 at 800 px wide |
| `05-rings-plates-targeted-1600.jpg` | Target cursor on the Left Bulwark (link 3) and the Left Redoubt (link 4): the rings and name plate in place in each option |
| `06-phone-compare-390.jpg` | Phone 390x844, the stage region, 4 links × 4 columns |
| `07-option-A-phone-390.jpg` | Option A on a phone, full frames |
| `clip-{A,B,C}-1600.mp4`, `clip-{A,B,C}-390.mp4` | 6 s per option: links 1-4, 1.5 s each, with the idle-to-push camera move at each link |

**Measured part size against a girl, 1600x900** (projected quads, from the capture reports):

| Link | Today and C | A and B |
|---|---|---|
| 1 Tail | 1.6× a girl's height | 5.8× (runs off the top and right edges) |
| 2 Leg | 1.5× | 6.3× (off the top edge) |
| 3 Body | 1.0× | 4.3× (fills the left two thirds) |
| 4 Head | 1.7× | 5.8× (the barrel runs off the top left) |

The girls are about 290 px tall today and about 155 px tall in A and B. On the phone, the part is
mostly or entirely off the right edge in TODAY and C at all four links. That is the A-1 framing
defect, a plain fix already in the plan. A keeps the part on screen at every link.

## The options

**A · Part-scale staging (existing paintings).** Each link gets its own part transform and a low
master camera looking up (fov 40, in place of today's level fov-32 master). The part fills the frame
and runs off an edge. The girls stand small at lower left. The Farplane backdrop is scaled 1.8× so
the horizon stays behind the part. *Plays:* every link opens on a new, huge piece of one machine,
and the 1.5 s push goes up the part instead of into the girls' backs. *Cost:* per-link transforms
in `src/scenes/farplane-parts.ts` and per-link camera rigs, plus the backdrop scale. The Node
anchors (moved to hang overhead, which fits §4.3) and the Bulwark ring anchors were re-pointed in
the mock. That file waits for `r21-road-phone`, and the anchors for PR-0095, PR-0094 and PR-0072
are measured once, on this staging. *Phone:* works. The part shows above the HUD at every link, and
the girls stay readable at about 90 px.

**B · A plus a unified repaint (placeholder).** Same staging as A. Head, body and leg are
repainted as one dark locust/moth machine; Tail A stays. §1.18's design directive asks for one
material set, and today's body in brass and copper is the odd one out. **The dark grade on the
sheets is a stand-in, labelled PLACEHOLDER on every frame. It is not the repaint.** *Cost:* A's
cost plus render job **ART-6**: three paintings (head, body, leg) under one recipe, 3 to 5
candidates each, one composed sheet for Bailey, and the new hashes pinned. Pilot it only after a
pick for B, with art generation on. *Phone:* as A.

**C · Today's scale plus a unifying grade.** Today's staging and camera. Each part gets a cool
desaturating tint and a violet rim, and the rings draw over the paintings. *Plays:* as today. The
parts read slightly more alike, but each is still about one girl tall, so the machine reads as four
props. *Cost:* smallest (a grade table per part). *Phone:* inherits today's defect: the part is off
the right edge until A-1 lands.

## Recommendation

**A now; decide B separately once A is live.** A is the only option that delivers what the source
asks for (a leg or head that fills the frame) with art that is already approved, and it is where the
stalled ring, plate and shadow anchors (PR-0095, PR-0094, PR-0072) should be measured. B's gain, a
unified material, is real, but it needs ART-6 and a new approval round, and it can land later on
A's staging without moving any anchor. C changes too little to close top-ten item 7.

## Limits and open points

- **Link order.** The brief listed "leg, tail/bulwarks, redoubts, head". The sheets follow the
  sourced order: 1 Tail, 2 Leg + Nodes, 3 Body + Bulwarks, 4 Head + Redoubts.
- **Link 1 frames and clips** come from the first capture run of this task, in which the whole party
  is standing. In the second run Yuna was KO at link 1. The first run's C grade was weaker, but on
  the tail, which is already steel, it is close to zero either way.
- **The mock ignores the HUD.** In A, the top-left boss bars and the command window sit over the
  painting at links 1 and 3. The intent slab solver (PR-0094) and the ring clearance against the
  command window (D-142) must be measured again on the built staging.
- **Not shown:** the plan's A also puts a Vegnagun silhouette on the horizon for the Shuyin link.
  That link is outside this round's links 1-4, and the silhouette needs art we do not have (a
  render job, if A is picked).
- **Mock values** for whoever builds A, in world units at 1600x900. Part `[x, y, z]` and scale:
  tail `[-5.0, -1.4, -17]` ×5.6; leg `[3.2, 0, -12]` ×5.5; body `[-4.6, 0, -16]` ×4.3; head
  `[13.5, 1.6, -15]` ×4.8, mirrored. Idle rig `{position [1.2, 1.15, 14.5], lookAt [1.8, 3.4, -4],
  fov 40}`, push rig `{[1.35, 1.0, 12.0] → [1.9, 3.9, -4]}`. The phone uses its own table. These values are eyeballed for the mock, not
  tuned. `mock-scripts/` holds the console staging library, the driver (it has the full tables), the
  headless REPL and the sheet builder, as `.txt` files for reference. They are not wired into the
  game.
