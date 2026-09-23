# Evrae r3: independent 1:1 judge pass (2026-09-23)

FFX only (Chapter 8, Evrae on the deck of the Fahrenheit; Evrae is an FFX boss, and no FFX-2
chapter, shared tool or game file is touched, AGENTS.md hard rule 14). This pass was run by a
different agent from the painter (`r3.md`, commit `21fcc551`). **I made no renders and
installed, edited or approved nothing.** `docs/target/approved-hashes.json` sha256
`3c5af02f...c15c` before and after this pass. The only file this pass commits is this report.

Judged (sha256 as found):

| File | sha256 | Reference |
|---|---|---|
| `public/art/backdrops/evrae-airship-deck.png` | `2679b8ef...3ea7` | `renders/backdrop-b.png` (Bailey's "Evrae backdrop B", 2026-09-21) |
| `public/art/characters/evrae/breath-charge.png` | `53538100...c9c7` | `idle-near.png` `4140ba74...3af` (judged 8), look B |
| `public/art/characters/evrae/hurt.png` | `f6699012...7529` | `idle-near.png`, and "none" (the idle under the engine flinch) |
| `docs/concepts/chapters/evrae/r3/cast-candidate.png` (not installed) | `03c1937a...8f3e` | `idle-near.png` |
| In-game captures `D:/Tools/pyrefly-lora/evrae/r3/cap-final/*.png` (1600x900, GPU) | | the above, at NEAR and FAR, HUD off and on |

Method: each file whole on flat grey, then native 1:1 and 2x Lanczos crops of the head, throat,
neck arch and neck-to-body join, then 3x to 4x nearest-neighbour on the sprite edges over a dark
ground; an alpha count against the idle; and the painter's in-game captures cropped at 1:1
and 2x (head, deck line, HUD cards). No score comes from the painter's sheet. Crops were made
with PIL in my scratchpad and are not committed.

## Criteria

Against the reference at 1:1 and 2x, each 0 to 10: **identity** (the reference's own picture
or creature, not a re-imagining), **colour** (look B: teal body, orange fins and crest, pink
belly plates), **seams** (any join, band, smear, edge fringe or extended margin), **anatomy**,
and **reads as its state** (hurt as a hit, breath-charge as a charge, cast as an action). The
in-game item is scored on scale consistency, the backdrop reading as B, and nothing important
hidden (HUD or scene). **The score is the worst criterion; the bar is 7.**

## Scores

| Item | Identity | Colour | Seams | Anatomy | Reads as state | **Score** | Verdict |
|---|---|---|---|---|---|---|---|
| Backdrop plate vs concept B | 10 | 10 | 10 | n/a | n/a | **10** | PASS |
| breath-charge | 8 | 6 | **5** | 6 | 8 | **5** | **FAIL** |
| hurt | 9 | 9 | 7 | 7 | **7** | **7** | PASS (at the bar) |
| cast candidate (not installed) | 9 | 9 | 7 | 7 | **6** | **6** | **FAIL** |

| In-game (NEAR / FAR, 1600x900) | Scale consistency | Backdrop reads as B | Nothing hidden | **Score** | Verdict |
|---|---|---|---|---|---|
| captures | 9 | **7** | **7** | **7** | PASS (at the bar, with two notes for other owners) |

**Two items pass clean (backdrop 10, in-game 7), hurt passes at the bar, breath-charge fails
at 5 and the cast candidate fails at 6.**

## Findings

### Backdrop (10; PASS)

- The production plate is **byte-identical** to the approved concept: both files hash
  `2679b8ef3cd92422...3ea7` (I hashed both). 2688x1536, so there is no upscale, outpaint or
  extended margin to inspect: identity, colour and seams are the approved picture by
  construction. This is the r3 method working as intended.

### breath-charge (5; FAIL: seams 5, colour 6, anatomy 6)

At game size it reads strongly as a charge (8): the throat is swollen and lit, and the lit
mouth adds to it. The head and the body below the neck are idle's pixels (identity 8). What
fails is the join between the warp and the glow:

- **Seams 5.** (1) The teal-to-orange transition is a **straight horizontal cut** across the
  neck: red passes 200 at image rows 161, 163, 164 and 158 in columns 400, 420, 450 and 480,
  so the cut is level within 6 px over 80 px of throat. It crosses the scales
  instead of following the sac or the plate seams, and it still shows at NEAR game scale as
  a level line across the throat (in-game crop `near-breath.png`). This is the "soft
  horizontal band" `r3.md` lists as remaining; at 1:1 it is a hard line, not a soft band.
  (2) Above the cut the dorsal scales are **stretched vertically and smeared** by the warp: at
  2x they are about twice the height of the neighbouring scales and lose their dark outlines.
  (3) The sac's rim has **554 soft-alpha pixels** in the throat region where idle-near has
  **0** (idle's alpha is binary). On a dark ground the rim is a fuzzy feathered fringe with a
  pale fleck at the bottom left, unlike every other edge of the sprite.
- **Anatomy 6.** The sac hangs below the neck as a **pendant bulb** (a dewlap or goitre), not
  a throat inflated in place: the neck's pink belly line runs to the sac and stops, and the
  sac's lower edge (idle's edge stretched 1.8x) is a smooth teardrop with faint plate seams.
- **Colour 6.** The palette is on model (teal and orange are both look-B colours), but the
  hard cut makes the orange read as a colour block pasted over the teal, not light coming
  through the scales. The glow colour itself is unsourced (research section 12.2 names none);
  this is not scored against it, but it is Bailey's call.

### hurt (7; PASS at the bar: reads 7, anatomy 7, seams 7)

- **Identity 9, colour 9.** The head is idle's pixels rotated 22 degrees; the head length is
  69.7 px against 69.5 (I checked the sidecar numbers against the 1:1 crops: the head is the
  same size). The body below the neck is idle's.
- **Seams 7.** The neck bend is clean at 2x: the scales run continuously through the ramp,
  with no doubled or folded plates (the sidecar's `foldPx` is 0). The rotated head is a little
  softer than the untouched body at 2x (resampling), and the rotation adds 2,232 soft-alpha
  edge pixels where idle has binary alpha. On a dark ground this is ordinary anti-aliasing,
  not a halo. The pale flecks by the jaw are idle's own.
- **Anatomy 7.** The neck straightens into a longer rising line than idle's S. It is
  plausible, if stiff.
- **Reads as a hit 7.** The head moves up and back away from the party (about 60 screen px at
  NEAR), which is recoil geometry, and it is clearly more than "none" (idle under flash and
  shake). But the expression is idle's open snarl, unchanged, and the snout turns level to
  slightly up, so the still frame can also read as rearing or roaring. With the engine's flash
  and shake it reads as a hit. **This is not a tie with "none": keep it.** See the risk under
  the cast candidate.

### cast candidate (6; FAIL: reads as an action 6; not installed)

- Identity 9, colour 9: idle's own head (69.8 px) and jaws. **Seams 7**: the neck ramp is clean
  at 2x, with a slight vertical stretch of the upper neck scales (2,717 soft-alpha edge pixels,
  from resampling). **Anatomy 7**: the neck is about 60 px taller and the arch is steeper; it
  is plausible.
- **Reads as an action 6.** The change from idle is a 60 px rise and an 8 degree pitch, about
  32 screen px at NEAR. Idle already points open jaws at the party, so at game size the frame
  reads as "the idle, a little taller", not as a wind-up or a strike.
- **Confusability with hurt.** Hurt and cast both answer by **raising the head**. They differ
  only in the snout angle (level or up for hurt, 8 degrees down for cast). If Bailey picks the
  cast pose (Decision 1), the two frames will be hard to tell apart in play. A cast that
  lunges down and forward at the party (the head lower and nearer than idle), or a hurt that
  flinches down and in, would separate them.

### In-game captures (7; PASS at the bar)

- **Scale consistency 9.** In `near-evrae`, `near-hurt` and `near-breath` (1:1 crops, same
  camera) the head is the same size in all three, which matches the sidecars (69.5 / 69.7 /
  69.5 px at 0.532 screen px per image px). FAR draws the separate idle-far painting at the
  director's head-ratio scale. idle-far's colour note (red-heavy) is its own, unchanged.
- **Backdrop reads as B 7.** The composition is B's: the contrails and cream cumulus at the
  upper left, the long dark hull rising to the right, B's own rail below the deck sightline.
  At both ranges no plate edge or corner is exposed by the -11.6 degree roll. But **the scene's
  lighting and cloud layers push B's daylight blue and cream to a dusk salmon and navy**, with
  a bloomed sun at the upper left that B does not have. Bailey picked a daylight picture and
  sees a sunset version of it. The plate is B's pixels, so this is a `src/scenes` question
  (the lights and scroll layers in `evrae-airship-painted.ts` and `evrae-airship-sky.ts`),
  not an art defect. It should be disclosed with the pick.
- **Nothing hidden 7.** NEAR with the HUD: the advisor and guide cards and the turn order
  clear Evrae completely. FAR with the HUD: the "Next best move" card ends about 10 screen px
  from Evrae's snout (2x crop `far-hud.png` at 780..1100 x 330..430). It clears, but only
  just, and a longer move name would cover the head. Separately, at NEAR **the painting's
  lowest coils and tail fin (about 65 screen px, roughly 16 % of the painted height) are cut
  off by the deck plane**. The FFX fight has Evrae flying alongside, below the deck, so this
  can be intended framing, but it predates r3 and belongs to the placement owner
  (`src/engine` or `src/scenes`), not to this art.

## mustFix (what blocks a pass)

1. **breath-charge seams (5):** replace the straight horizontal teal-to-orange cut with a
   transition that follows the sac's own curve and plate seams; remove the vertical smear of
   the dorsal scales above the sac (limit the warp to the belly side, or keep idle's dorsal
   pixels); give the sac rim the same hard binary alpha as the rest of the sprite and remove
   the pale fleck.
2. **breath-charge anatomy (6):** inflate the throat in place (a swelling of the neck's own
   underside, with the pink belly line continuing round it) instead of hanging a pendant bulb
   below the neck.
3. **cast candidate reads (6), before it is offered for Decision 1 as the pick:** a pose that
   reads as an action at game size and cannot be mistaken for hurt (for example the head
   driven down and forward at the party, jaws wider), still derived from idle's pixels.

Not art, disclosed for their owners: the in-game warm grade over B (`src/scenes`), the FAR
move card sitting about 10 px from the snout (`src/ui` / `src/engine/tactics`), and the NEAR
deck line cutting the lower coils (placement).

## For Bailey

Backdrop B is installed exactly as picked. Breath-charge is not ready. Hurt passes at the
bar and beats "none". The cast candidate is too close to idle, and to hurt, to be a useful
pick yet. Nothing here is approved until Bailey says so.
