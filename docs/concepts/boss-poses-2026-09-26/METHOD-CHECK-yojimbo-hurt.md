# Yojimbo hurt: method check before a third try (FFX only, Chapter IX, 2026-09-26)

AGENTS.md rule 15: two failed attempts on the same failure mean a written method check before a
third try. Yojimbo's hurt has now failed three ways. Agent look only; nothing here is Bailey's
pick and nothing was installed.

## The failures

| Try | Skeleton and tags | Renders | What went wrong |
|---|---|---|---|
| stopped run | `hurt.png`: knocked back, head thrown back, "(head tilted back:1.2), looking up" | 16 (4 guard rejects) | With the head back, the jingasa turns edge-on: a thin gold sliver or a flat disc behind the head. The hat is the whole silhouette read of Yojimbo, so identity collapses. Several frames sprout gold sheets, ribbons and hat-shaped walls. |
| v2a | `hurt2.png`: a flinch, head bowed | 4 (cand 17-20, 1 reject) | The hats read as cones again, but every frame is a bow or folded arms: nothing says "hit". |
| v2b | `hurt3.png`: recoil, forearm raised in front of the face | 4 (cand 21-24, 4 rejects) | The raised arm meets the brim and the model paints hat, sleeve and sash into one explosion of gold sheets filling the canvas. |

## Why more prompt tweaks cannot fix it

The same cause as the Paine Warrior sword (`../art5/round2/METHOD-CHECK.md` A): **the model has to
invent the hat from words in every frame**, and the hat is Yojimbo's largest shape (in the idle the
brim is 475 px wide on a 1060 px figure, 45% of his height). OpenPose pins only the head point; the
brim's angle, size and depth are left to the text and to the IP-Adapter square, which carries the
idle's upright profile brim. Any pose that tilts the head or brings a hand near it asks for a brim
the reference does not show, and the model fills the gap with sheets. The attack renders show the
same drift in a milder form: tall cones, round crowns, a purple crown (see the README).

## Options

| # | Method | Cost | Risk |
|---|---|---|---|
| 1 | **Composite the idle's own hat.** Render the body with no hat (a hat-free, sword-free reference square, "hat" in the negative), then paste the approved idle's own jingasa and gold menpo mask onto the head, rotated to the pose (the hurt tilt), and the idle's own sheathed katana at the hip. The same method 1 as the sword. | Same GPU per render (~20 s); the composite is CPU. One look per candidate to set the head point, angle and scale. | A flat 2D rotation: the brim cannot foreshorten. The body's own head must sit under the mask; a stray tuft of hair may show and needs a pixel erase. |
| 2 | Derive the hurt from the idle's pixels only (tilt the whole figure back a few degrees, no GPU). | Free. | Reads as the idle leaning, not a new pose; close to the "cutout-animation" concept Bailey declined on 19 Sep. Not offered. |
| 3 | A fourth prompt/skeleton variant. | 4-8 renders. | Attacks none of the causes above. Not tried. |

**Picked: 1.** It takes the hat away from the model, which removes the cause, and the hat and mask
become the approved idle's own pixels, so they cannot drift. Pilot: 4 hatless bodies on the stopped
run's knocked-back skeleton (the clearest "hit" read of the three), looked at before any more.
