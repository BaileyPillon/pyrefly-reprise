# Logos round 2: independent judge pass (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc art; Logos exists only in FFX-2; no shared tool, game
file or FFX chapter changed, AGENTS.md hard rule 14). This pass was run by a different agent
from the painter (`round2.md`, commits `81bc5e5`, `c3fbcfe`, `84a5cd5`). **I made no renders
and installed, edited or approved nothing.** `docs/target/approved-hashes.json` sha256
`3c5af02f...c15c` (no Logos entry) before and after this pass;
`D:/Tools/pyrefly-lora/tools/verify-approved.mjs`: 115 ok, 0 mismatched.

Judged: the installed `public/art/characters/logos/{attack,cast,hurt,ko}.png` (sha256
`1eafca2f...`, `47974fc7...`, `055803df...`, `cd2187b2...`, the hashes `round2.md` names)
against the repaired idle (`7aa37e8b...45e3`). I read each whole on flat grey, then at
native 1:1 and at 2x to 4x nearest-neighbour on the helmet, face, emblem, strap, both hands and
guns, sash and feet. **Sheet: `judge-sheet.jpg`** (`python judge-sheet-r2.py`). The top row is
the idle. Each state row has the whole cutout (scaled), native 1:1 crops of every region scored
below 7 (and of the fixes this round claims), and the painter's in-game screenshot of that
state. No score comes from a thumbnail or from the painter's sheets.

## Criteria

The round-3 criteria (hair, face, skin, helmet, outfit, marks, weapon, style and framing,
pose reads as its state) plus **anatomy**, each 0 to 10 against the idle at 1:1. **The score is
the worst criterion; pass is 7.** The pose readings come from research
`ffx2-leblanc-syndicate.md` 10.1: Double Shot is two aimed shots, and Russian Roulette is one
deliberate shot.

## Scores

| State | Pick | Hair | Face | Skin | Helmet | Outfit | Marks | Weapon | Style | Pose | Anatomy | **Score** | Painter | R1 judge |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| attack | `99121.r2c` + 2 fixes | 8 | 7 | 8 | 7 | **6** | **6** | **6** | 7 | 8 | 7 | **6** | 7 | 6 |
| cast | `99204.r2` | 8 | 8 | 7 | 8 | 7 | 7 | 7 | 7 | 8 | 7 | **7** | 7 | 6 |
| hurt | `99303.r2` + 1 fix | 8 | 7 | 7 | **6** | **6** | 7 | 7 | 7 | **6** | **6** | **6** | 6 | 5 |
| ko | `99423.r2c` + grip | 7 | 7 | 7 | **5** | 6 | 7 | 6 | 6 | 8 | **5** | **5** | 6 | 5 |

**cast passes (7). attack, hurt and ko fail.** I agree with the painter on cast and hurt. I
score attack and ko one point lower, which is the same direction as every earlier independent
pass.

## What changed since round 1 (independent 6 / 6 / 5 / 5, now 6 / 7 / 6 / 5)

- **The idle repair worked at the source.** At 1:1 the idle's near fist now closes on a black
  grip, with the index finger in the trigger guard (idle weapon 5 -> 7; the diff shows the edit
  confined to the hand). The LoRA stopped learning the hanging gun: **cast weapon 6 -> 7**,
  because the low revolver is gripped, and no r2 state hangs a gun off a finger.
- **hurt face 5 -> 7.** Round 1's blank white profile is gone. The eye is closed and the teeth
  are clenched: a wince. Both feet are on the floor. Round 1's wing engraving on the helmet is
  gone.
- **attack emblem: the mesh grille is gone, but the disc is still not the idle's** (marks 6 in
  both rounds). The lunge is deeper and both revolvers lead (pose 8).
- **ko: the head size is fixed in battle (143 % -> 99 %); nothing else improved.** The crown
  still carries an invented surface: in round 1 an engraved band, now a slatted panel. The
  second revolver is gone (round 1 had two), and the hard black shadow remains.

## Per-state findings (1:1)

**attack (6; outfit, marks, weapon).** At a glance it reads as Double Shot: a deep lunge, two
revolvers aimed, and a serious profile with an eye under the fringe. Helmet 7: it is the idle's
dome and visor, but the slotted side plate is larger and the ribbing is a single deep groove.
- **Marks 6.** The repaired disc is a small grey rounded plate with a white starburst glint. It
  reads as a glass lens, not as the idle's large white radial rosette with its scalloped edge.
  The strap carries a brass-edged buckle, and the idle's brass-rimmed round lens on the strap
  is missing.
- **Weapon 6.** The lower revolver is a cylinder with a stub barrel, a snub-nose; the idle's
  guns have long barrels. A pink-lilac glint sits inside the upper gun's trigger guard. Both
  guns are blued, where the idle has one blued and one silver.
- **Outfit 6.** The sash has a knot at the front, with a lilac panel running down the front;
  the idle's sash has no front knot, and its tail hangs at the back. The far-side hakama reads
  as solid black, not slate. Both sandals are thongs; the idle wears wide-strap slides.
- Style 7: there is a black floor pad under the front sole.

**cast (7; passes).** A revolver is raised barrel-up beside the helmet, he smirks, and the
other revolver is gripped low: it reads as Russian Roulette. Helmet 8, the closest to the idle.
The radial disc is half behind the lens ring. The front clasp, sash, hakama, wraps and slides
are the idle's. Two small faults do not bring any criterion down to 6: the raised fist is
shaded red-brown, and the raised gun's grip is dark maroon.

**hurt (6; helmet, outfit, pose, anatomy).**
- **Helmet 6.** The back half of the dome is shaded near-black, where the idle's is bright
  silver. It also reads as a dark helmet in the battle screenshot.
- **Outfit 6.** A lilac sash tail streams forward at the front of the figure.
- **Pose 6.** The far arm still holds the revolver level at the party while he leans back, so
  it reads as firing while stepping back more than as taking a hit.
- **Anatomy 6.** With the head matched, the body is small (see "Scale in a running battle").
  Standing on both legs with a 25-degree lean, he should stand about 95 % of the idle's height;
  he stands at 80 %.
- The disc paste is correct at 1:1 (marks 7), and both hands grip their guns (weapon 7).

**ko (5; helmet, anatomy).** It reads as KO: on his back, eyes shut, helmet on, a gun dropped.
- **Helmet 5.** Seen from above, the crown has a triangular panel of blue slats, which is the
  slotted or grille drift that `NEG_R2` names. A black round lens sits on the side of the helmet
  where the jaw strap should be.
- **Anatomy 5.** Only one leg and one foot are drawn. The legs are short: crown to sash matches
  the idle (about 420 px), but sash to sole is about 540 px against the idle's 720. In battle,
  with the head matched, the figure is 77 % of the idle's standing height, so KO Logos visibly
  shrinks.
- Weapon 6: there is one revolver. Its grip recolour is right but flat. Style 6: the hard black
  shadow runs along the whole back and reads as a black outline in battle. Outfit 6 follows
  from the missing leg.

## Scale in a running battle

I looked at `ingame-compare.jpg` and at every `ingame-after-*.png`. They were taken at
13:28:32 UTC, 14 s after the last sidecar was written (09:28:18 EDT), so they show the installed
files. **Head size is within 5 % in every state:** attack 101 %, cast 100 %, hurt 97 %, ko 99 %,
and the idle measured again 100 %. By eye, the helmets in the after row match. That part of the
brief is met.

**Body size is not.** With the heads matched, here is each figure's longest side at the same
depth (`ingame-after.json`, size x depth) as a share of the idle's: cast 102 %, attack 77 %,
**hurt 80 %, ko 77 %**. Attack's crouched lunge explains most of its drop. Hurt, with both feet
down and only a lean, does not; neither does ko, whose lying length should equal the standing
height. The r2 renders paint the head about 15 to 25 % larger relative to the body than the idle
does, so no single sidecar scale can match both head and body. The painter measured only the
helmet chord, which hides this; the compare sheet shows it.

## Redo

1. **attack (local).** Paste the idle's own disc and brass-rimmed strap lens. Use a straight
   paste warped to the shoulder: the repaint at 0.55 is what turned the disc into a lens.
   Repaint the lower revolver with a full barrel and clear the pink glint. Repaint the front
   sash knot and lilac panel to the idle's plain wrap. Optional: repaint the sandal straps as
   slides.
2. **hurt (local, then scale).** Lift the dome's value to the idle's silver inside the helmet
   mask, and remove the front sash tail. The body proportion is a whole-figure fault: either
   re-roll with a skeleton whose head is smaller relative to the legs, or accept a compromise
   scale near 0.95 (head about 8 % large, body about 87 %) and write that down.
3. **ko (re-roll).** The single leg, the short legs and the missing revolver are whole-figure
   faults that a local repaint cannot fix. Re-render with a prone skeleton whose leg bones match
   the idle's and with both feet drawn. Then fix the crown locally (the idle's ribbed dome) and
   the shadow. Measure body length as well as head size in battle before installing.
4. **Every scale check from now on** reports body height or length next to the head chord.

## Hard rule 6, still open

The Syndicate logo's shape is unsourced (research 10.1: "the Syndicate logo on both shoulders");
the radial disc is the idle's invention. The chin protector and the purple helmet tie strip that
the research names appear in no state, including the idle. Nothing here is approved; Bailey has
not seen it.
