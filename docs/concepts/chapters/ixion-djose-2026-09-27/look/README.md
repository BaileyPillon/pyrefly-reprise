# Ixion's FFX-2 look: four painted options (2026-09-27)

**Options only. Nothing is installed or wired.** No file under `src/`, `tests/`, `public/art/`,
`critic/` or `docs/target/` was touched, and nothing is listed on the board (AGENTS.md rule 9).
This is the painting round research Q6 asks for, after Bailey's "all your recommendations"
(2026-09-27, ~13:40 EDT) picked concept A for the chapter and left the look as Bailey's pick.
A pick approves only the parts Bailey names (rule 15).

**Game case (rule 14): FFX-2 only.** This is the Chapter 3 Djose Ixion. The FFX Ixion painting
(`public/art/characters/ixion`, shipped in the FFX chapters by D-089) is not changed; it is used
only as the identity base.

## Phone sheet (read in order; each part 1080 px wide, under 2000 px tall, under 1 MB)

1. `sheet/part-1-overview.jpg`: the four options side by side, the recommendation, the question
2. `sheet/part-2-option-a.jpg`: A, desktop frame, phone frame, 1:1 head crop, notes
3. `sheet/part-3-option-b.jpg`: B
4. `sheet/part-4-option-c.jpg`: C
5. `sheet/part-5-option-d.jpg`: D

Frames: `frames/<option>-1600.jpg` (1600x900) and `frames/<option>-phone-390.jpg` (390x844).
Paintings and raw renders (with a JSON sidecar each: seed, prompt, settings):
`D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ixion/` (`opt-a.png` .. `opt-d.png` are the
four finished cutouts; `raw-c-*`, `raw-d-*` are every render, picked and unpicked).

## What the sources say (research/ffx2-ixion-djose.md 6.2, Q6, IX-8)

- The FFX-2 Ixion is the same aeon: a unicorn with a long golden horn, dark blue hide, grey mane
  and tail, gold bracers on the forelegs (`visual-bible.md` 1, wiki) `[single source]`.
- FFExodus alone says the Djose Ixion "had melded with machina" `[single source]`. The wiki says the
  temple's fiends merged with the machina and says nothing of Ixion's own look.
- The violet "possessed" treatment is a house choice, not canon (`ffx2-fallen-aeons.md` 8, F-12).
  Shuyin possessing the fayth and sending their aeons at the temples is sourced
  (`ffx2-fallen-aeons.md`, `[verified: 2 sources]`).
- **Not done:** the research asks for a read-only look at the wiki's battle picture
  ("Ixion fought.jpg") before this round. This round's rules allowed neither the browser pane nor
  the Chrome extension (and the wiki needs a browser), so the picture is still unviewed. It, or a
  Steam HD look at the fight, would settle C against the rest.

## The options

| | Look | Source basis | How it was made | Cost to finish the chapter's poses |
|---|---|---|---|---|
| **A** | As in FFX: the shipped painting, untouched | the only look every source describes | nothing new | none: idle, attack, overdrive exist |
| **B** | Possessed violet: violet shadows, inner rim, glowing eyes, a dark aura | none for a recolour (F-12); the house look for FFX-2's possessed aeons (Bahamut; Chapter XI's Shiva and Anima, Bailey's O-2 B pick of 2026-09-24) | `possess_b.py` on the FFX idle's own pixels (no GPU; line work identical) | very low: attack and overdrive derive the same way |
| **C** | Machina-fused: steel plates, cables, round ports, pistons grown into the body; horn and mane kept | FFExodus only (IX-8) | ComfyUI, Animagine XL 4.0: img2img 0.76 from the FFX idle on white, IP-Adapter 0.30 on the same image; seed 7110 of 10 renders; rembg cutout | high: every pose is a new painting, and the identity drifts between renders |
| **D** | Storm fiend: hide gone black, dulled gold, torn mane, glowing eyes, pale arcs and pyrefly motes | none: a house idea for an aeon without its fayth (thunder is his element) | ComfyUI img2img 0.58 from a darkened FFX idle, IP-Adapter 0.40; seed 7205 of 6; rembg cutout; arcs (#B8E4FF family, `visual-bible.md` 1) and motes laid over by `finish.py` | high: as C, plus the arcs per pose |

All four face screen-left, like every FFX-2 boss (the shipped `ffx2-bahamut/idle.json` and
`x2-shiva/idle.json` say `facing: left`); the FFX idle is already stored mirrored to face left.

## Recommendation: B, possessed violet

B shows Ixion the way this game already shows every aeon Shuyin has taken, so Chapter 3's Djose
fight and Chapter XI's road read as one story. It keeps the FFX Ixion Bailey has already seen, costs
no GPU time, and the charge, cast and Thor's Hammer poses can be derived from the shipped attack and
overdrive paintings the same way. If the wiki's battle picture or a Steam look shows machina on him,
C becomes the faithful pick; a mix (C's machina under B's violet grade) is possible, at C's cost.
`[estimate]`: this is an agent's judgement, not a sourced fact.

## Known defects (rough options, not finals)

- C: a small white pocket of background survives the cutout on the chest plates (visible in the 1:1
  crop); the tail tip touches the render edge. A pilot for real would fix both.
- D: the dark hide sinks into a dark chamber (see its frame); it would need a lighter plate or a
  stronger rim light.
- The Djose Chamber is a stand-in (the Macalania Temple plate recoloured, with a greybox hole and
  machina scrap); the HUD is a greybox of the shipped FFX-2 layouts (desktop Chapter IV; phone
  "compact rail"), bars without numbers. None of it is a proposal for how Djose looks.

## What Bailey is asked

**A, B, C, D, or a mix** (name the parts you want). Then the next rung: the picked look's pilot for
the chapter's poses (idle, charge, cast with the Recharge glow, Thor's Hammer) at 1:1, before any batch.

## Rebuild (from the repo root)

1. `python docs/concepts/chapters/ixion-djose-2026-09-27/look/scripts/render.py c 7110` (and `d 7205`):
   the two repaints on the shared ComfyUI (waits while 3 or more prompts are pending; stops on an
   all-black render; never restarts ComfyUI).
2. `D:/Tools/ComfyUI/python_embeded/python.exe -s tools/gen/rembg.py --in <raw> --out <cut> --margin 16`
3. `python docs/concepts/chapters/fallen-aeons/production/scripts/possess_b.py public/art/characters/ixion/idle.png <candidates>/ixion-b "262,292" 5`
4. `python .../look/scripts/finish.py`, then `look_frames.py`, then `look_sheet.py`.
