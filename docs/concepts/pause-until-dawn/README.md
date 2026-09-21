# Pause, rebuilt on the Until Dawn character screen

**Mockups only. Nothing is built, nothing in `src/` is touched** (AGENTS.md hard
rule 9). Start with **[`sheet.png`](sheet.png)** — every frame, labelled, with
three 1:1 crops so you can judge the type size — and
**[`grades.png`](grades.png)** for the two grades side by side.

You said: *"We need to remake the pause menus and please see here and carefully
replicate it but with our art style and direction (ignore text on the
screen)."* This is that layout, in Ink & Gold, on our own painted close-ups.

No frame of the video is in this folder or anywhere in the repo — the reference
was written down and worked from in words. Every picture here is one of your
approved `public/art/pause/` masters, framed with CSS and graded. Nothing was
generated, re-rolled or edited.

---

## What it is

One full-bleed painted close-up of the character, graded dark. No panels, no
boxes, no cards — every line floats on the picture:

| where | what |
| --- | --- |
| top | one thin tab strip: the active character first and brighter, then the other two on the field, then CHAPTER, GUIDE, OPTIONS, CONTROLS, MUSIC. `Q` / `E` or `L1` / `R1` cycle. A 2px HP hairline under each member's name; a tiny gold dot on a tab with something new. |
| left, 33–65% down | two columns of hairline meters. **BATTLE STATS** — HP, MP, Strength, Magic, Defence, Magic Def, Agility. **IN THIS FIGHT** — FFX: Overdrive, mode, each status with how long it has left, CTB turn position. FFX-2: ATB, Active/Wait, Chain, dressphere, Garment Grid, gates passed. |
| bottom left | the chapter's current objective, in one thin tracked serif line. |
| bottom right | `Esc  RESUME`, with `H  hide panels` under it. |

`H` still hides everything but the painting **(e)**. OPTIONS and CONTROLS keep
the same picture and float their rows exactly where the meters were **(d)**.
`options.json` lists **every function of the current pause screen and where it
now lives** — nothing is dropped.

A meter bar means: fill = that member against the best of the three on the
field; the tick = the three-member average. In FFX-2 the dimmer segment past
the fill is what the Garment Grid and accessories add (FFX gear grants no stats
at all, so there is no such segment in an FFX chapter).

Every number is real: FFX stats from `gagazet.ts`, FFX-2 stats from the
dressphere-by-level tables each girl is actually wearing, objectives verbatim
from `chapter-meta.ts`. Only the live battle state (current HP, which statuses
are up, the turn position) is invented, because a paused screen has to be
showing *some* moment.

---

## The questions, in the order they matter

### 1. Grade A or grade B? — [`grades.png`](grades.png)

Same frame, same layout, two grades.

- **A "faithful"** — cool, desaturated, near-black, exactly the reference's
  look. Gold is the only colour left in the picture. Very moody; you lose most
  of what the painting is.
- **B "ours"** — the same composition on a warm ink-and-gold grade. The paint
  keeps its skin tones and the gold sits in the light rather than on top of it.

Both are one CSS filter plus one tint layer, so this is a switch, not a rebuild
— and it could even be a setting. **My recommendation is B**: the paintings are
the thing you approved and A throws away three quarters of them. Every other
frame in the sheet is grade B.

### 2. Should the chrome move to whichever side of the picture is empty?

The reference puts its text on the left every time, because its faces are
always framed right of centre. Ours are not: **Yuna's close-up puts her face at
30% of its width and Paine's at 25%** — fixed left-hand chrome would sit
directly on their faces, and no amount of zoom fixes it without cropping their
heads off the top of the frame.

So frame **(b)** shows the answer I built: the chrome anchors to the empty side.
Tidus keeps it left; Yuna gets it right. This already exists in our language —
Ink & Gold mirrors the whole skin for FFX-2 chapters.

The cost: cycling from Tidus to Yuna makes the text jump sides mid-cross-fade.
Three ways to go, your call:

- **(i)** mirror per character, as mocked — works with the art we have today;
- **(ii)** chrome always left, and re-paint Yuna's and Paine's close-ups with
  the subject right of centre (that is an art job and needs your yes);
- **(iii)** chrome always left and accept the text over their faces — I do not
  think this is acceptable, so I did not mock it.

### 3. Are these the right meters?

Seven stat rows and one "in this fight" column per game. Three rows the current
PARTY tab shows have **no home** in this layout, because the reference has room
for about seven rows a column:

- **WEAPON and ARMOR** (FFX only — their names, e.g. *Baroque Sword*, *Glorious
  Shield*)
- **S.LV** (FFX) / **LV** (FFX-2)

Options: a third short column under the first two; put them on the CHAPTER tab;
or let them go. What would you actually look at mid-fight?

### 4. Is MUSIC allowed to be a tab?

Your list was the party, then CHAPTER, GUIDE, OPTIONS, CONTROLS. The jukebox
has 21 tracks and its own cursor, so it cannot be a row inside OPTIONS the way
REPLAY BRIEFING can. I gave it a sixth tab. Fine, or should it move?

### 5. `H` and `F` now look the same. Merge them?

`H` (hide panels) and `F` (photo mode) both end up as "the painting, alone". In
the current screen they differ; here they nearly do not. Merge into one key, or
keep `F` as the one that also hides the `CONCEPT`-style furniture for a clean
capture?

### 6. Anything missing?

`options.json` → `preservedFunctions` is the full list of what the pause screen
can do today and where each one went. If something you use is not on it, say so
and it goes back before a line of this is built.

---

## Known departures from the reference (deliberate)

- **Row pitch and type size.** The reference's rows are about 14px apart at
  720p, which would put our labels near 12px. Everything here is at least
  **14 effective CSS px at 1600x900** (the crops on the sheet are 1:1 so you can
  check), and the rows are opened to 27px to suit. Your first complaint about
  the last pause screen was that the chrome was unreadable.
- **The big line wraps.** Our objectives are sentences ("Holy Water a Zombie
  before Full-Life lands"), not one-word labels, so the line is allowed a second
  row at 39px instead of shrinking.
- **Status durations.** Most FFX statuses in our data last the rest of the
  battle rather than N turns (Zombie, Haste, Shell, Protect, Slow, Reflect...).
  Only Silence, Sleep, Darkness and Regen count turns; Doom counts down. The row
  prints whichever it really is, so the screen never invents a number.
- **A brand line** above the tab strip, at 24% opacity. The reference has none;
  the current pause screen does, so it was kept rather than quietly dropped.
- **The phone runs at a 12px floor, not 14.** Measured at 390x844: 34 text runs,
  minimum 12px (labels) / 13px (values). At 1600x900 all six frames measure a
  14px minimum with zero runs under it. The phone crop is also necessarily the
  tightest in the set — the paintings are landscape and the screen is portrait,
  so cover leaves only about a quarter of the source visible and the frame lands
  eyes-forward with the mouth in shadow.
- **Yuna (Gunner)'s plate** is the weakest fit in the set: the smallest head of
  the ten, so the crop that reaches the reference's head size is the only one
  that magnifies its master (1.13x) and it loses her braid tip and the raised
  pistol. Every other party member's close-up frames comfortably.

---

## How to rebuild these frames

```bash
node docs/concepts/pause-until-dawn/build.mjs          # writes every .html
PYREFLY_BROWSER=gpu node docs/concepts/polish/_kit/shoot.mjs \
  docs/concepts/pause-until-dawn/a-ffx-tidus.html \
  docs/concepts/pause-until-dawn/a-ffx-tidus.png --w=1600 --h=900
D:/Tools/ComfyUI/python_embeded/python.exe docs/concepts/pause-until-dawn/compose.py
```

`build.mjs` prints each plate's head size and how much its master is scaled, and
shouts if a framing would magnify one past 1.25x.
