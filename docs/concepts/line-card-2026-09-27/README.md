# PR-0211 options: where the mid-battle line card goes (2026-09-27)

**For Bailey to pick (AGENTS.md rule 9). Nothing is built.**
**Game case: both.** Chapters III (FFX) and V (FFX-2) both use this card. It is shared presentation plumbing: one dialogue box, `.battle-midbeat` in `src/ui/common/cutscene.css`, and two skins.
The research files do not say where the retail games put a line spoken during a battle. If Bailey wants that settled by the real game, it is a Steam check, and we would ask before taking over the screen.

## The problem

A story line during a fight shows on the ivory dialogue card. Two placements have failed so far:

- **Today, on main:** the card sits at the bottom left and crosses the party. This is PR-0211 in round 13 and CHK-008.
- **Backed out (t1-b4a, a fixed top band at `top: 8vw`):**
  - In Chapter V at 2000x1012, the card ran across Rikku's head: 20,366 px² on 2 of 2 runs.
  - In Chapter III, the card covered Braska's Final Aeon during his own lines.
  - Source: `docs/handoff/t1-b4a.md`, sections CHECK and Blockers.

No single fixed band clears both the party and the boss on every camera.

## Read on a phone

| Part | What it shows |
|---|---|
| `sheet-1-problem.jpg` | Today and the backed-out band, on the checker's real frames, with the recommendation |
| `sheet-2-option-a.jpg` | A: the free side |
| `sheet-3-option-b.jpg` | B: a bottom band |
| `sheet-4-option-c.jpg` | C: a bubble at the speaker |

Each option is shown on five frames:

- Chapter III at 1600x900 and at 2000x1012
- Chapter V at 1600x900 and at 2000x1012 (the camera that failed)
- one phone frame at 390x844

The full-size frames are in `frames/` (`a-`, `b-`, `c-` + `iii-1600`, `iii-2000`, `v-1600`, `v-2000`, `v-390`). Every line shown is a real line from `src/story/scripts/`.

## The options

**A. The free side (recommended)**

- **How it plays:** a compact card, about 45% of the width, takes whichever of four slots is clear of the party's and the speaker's on-screen boxes. The slot is picked once per beat, so the card never jumps in the middle of a line.
  - In all four desktop frames here, the top-left slot wins. It sits over the dimmed guide.
  - On the phone, the card goes under the intent bar, above the party.
  - The first frame outlines the pick in gold and the slots it passed over in dashes.
- **Cost:** medium.
  - The boxes already exist: the checker measured with `stage.screenRects()`.
  - The pick is a pure function of those boxes and a slot list, with a unit test per chapter camera. It belongs in presentation, not in `src/battle`.
  - `cutscene.css` also needs a compact card size.
- **Risk:**
  - A camera that fills all four slots needs a fallback. None has been seen yet, and B's band is the natural fallback.
  - The card lands on dimmed HUD panels, never on actors.
  - A camera move during a beat could bring an actor under the card. Re-check only between lines.

**B. A bottom band**

- **How it plays:** the card becomes a full-width band along the bottom, like the cutscene box. It sits over the party panel and the command menu, which wait during a beat. The scene above stays whole: faces, the boss, the Vegnagun head.
- **Cost:** small. It is CSS for `.battle-midbeat` only: the band position, a slimmer portrait, and a soft dim behind it.
- **Risk:**
  - At close cameras the band covers legs. In Chapter V at 2000, it covers Yuna from the thigh down.
  - It hides the HP numbers for the length of a line.
  - Faces and torsos stay clear in every frame here, which passes PR-0211's acceptance wording.
  - It assumes the fight holds during a beat, as it does today.

**C. A bubble at the speaker**

- **How it plays:** a small card with a pointer sits beside whoever is talking. For Jecht in Chapter III, it is next to the boss. For Rikku's line, it is above Rikku. Speakers with no body on stage dock at the top left with a `VOICE · OFF STAGE` tag. In Chapter V that means Jecht and Braska, and comms voices elsewhere.
- **Cost:** highest.
  - Per-actor anchors from the projected boxes
  - A pointer that follows the camera
  - The off-stage fallback
  - A separate phone layout
- **Risk:**
  - There are two looks, because many Chapter V lines are off-stage voices.
  - Near a large boss or a crowded party there is little room.
  - The small card is the hardest to read on a phone.

## Recommendation

**A, with B's band as the fallback when no slot is clear.**

- A is the only option that keeps both the party and the boss whole on every frame here without giving up the portrait.
- It leaves the HP panel visible.
- Its rule can be pinned by the same `screenRects()` overlap measure that failed the band. The acceptance check becomes 0 px² against the party and the speaker, in III and V, at 1600 and 2000.
- If Bailey prefers the stability of one fixed place, B is the cheap, safe choice, with legs covered at close cameras.

## How these were made, and their limits

No browser ran the game. A deep review was using this machine. The frames were built from frames already on disk. `src/bases.py` makes the base frames, `src/mock.py` writes the HTML, and `src/render.mjs` renders it in one headless browser pass with no dev server. `src/sheet.py` composes the sheet.

The cards are drawn in the Ink & Gold dialogue-box language: an ivory slab skewed -12deg, a gold edge, an ink role tag, and Cormorant and Exo 2 type. The card's size and exact layout are mockup values, not final CSS.

| Frame | Source | Limit |
|---|---|---|
| III 1600 | `D:/Tools/pyrefly-scratch/pres-audit/braskas-final-aeon/09-10-hit-reaction.jpg` | A plain fight moment, so the HUD is at full strength. In a beat it dims to 65%. |
| III 2000 | `D:/Tools/pyrefly-scratch/eng3/raw/h2-braskas-final-aeon-2000x1012.png` | This is the only 2000 Chapter III frame on disk, and the command menu is up. During a CTB beat the menu is not shown. |
| V 1600 | The checker's `midbeat-ffx2-vegnagun-shuyin-1600-01.jpg`, with its top band taken from `revert-pr0211-ch5-1600.jpg` | Same camera; the mean pixel difference is 3.3/255 on the right side of the screen, where neither card sits. Neither card remains. |
| V 2000 | The checker's failing frame, `overlap-ffx2-vegnagun-shuyin-2000-01.jpg` | No frame of this camera exists without the card. That area is filled from its borders and outlined as "filled". The top of Rikku's hair and part of the HUD under it are lost. |
| Phone | `docs/screenshots/vegnagun-a/build-phone-1-tail-menu.jpg` | The ATB menu is up, as it can be in FFX-2. |

In option A, the slots were placed by eye from the actors' boxes on each frame. They were not computed by code. The pick shown is what the proposed rule would choose.
