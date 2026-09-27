"""Phone-readable sheet for the Ixion-at-Djose scene options (FFX-2 only; options, nothing installed).

    python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/scenes_sheet.py

Writes scenes/sheet/part-1-overview.jpg and part-2..5 (one per option), each 1080 px wide, under
2000 px tall and under 1 MB. Reads the plates from the candidates folder and the frames from
scenes/frames. Deletes nothing.
"""
from __future__ import annotations

import os
import sys

from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SCENES = os.path.join(HERE, "..")
sys.path.insert(0, os.path.join(HERE, "..", "..", "look", "scripts"))
import look_sheet as ls  # noqa: E402  (Page, fonts, colours)
import scenes_frames as sf  # noqa: E402  (PICKS, CAND)

INK, GOLD, PAPER, PINK = ls.INK, ls.GOLD, ls.PAPER, ls.PINK
GREY = (200, 192, 176)

NOTES = {
    "c1": [
        "What: a stone nave at eye level, the statue gone, a torn hole in the floor where it stood, broken slabs round the lip, a thread of Djose's lightning falling into it. Cold slate and violet.",
        "Sources: research 6.1: 'a deep hole in the middle of the Chamber of the Fayth where the fayth statue used to be' (wiki), tunnels to the Farplane (wiki), the fayth 'ripped out' (FFExodus) [verified: 3 sources]. Lightning is Djose's element and its temple's shell (wiki); inside the Chamber it is our choice.",
        "How: txt2img seed 9101 (the house backdrop graph and settings), the hole laid in by hand (hole_init.py), repainted by img2img at 0.60, seed 9114.",
        "Strong: eye-level and symmetric like the shipped FFX-2 plates (Via Infinito, Bevelle Underground); dark stone makes the party and the violet Ixion pop; the lightning points at the hole, so the fall has its stage from the first frame. Weak: the hole is modest and the floor is the bottom quarter, so the party stands near its lip.",
    ],
    "c2": [
        "What: a round chamber seen from a little above, the floor torn open in the middle over a dark shaft with a pale glow far down, amber lamp boxes left on the stone.",
        "Sources: the hole as in C1 [verified: 3 sources]; Machine Faction gear in a trashed temple (FFExodus, bremen, Blackestmage) [verified: 3 sources], read here only as the lamps. The round room is our choice (no source gives its shape).",
        "How: txt2img seed 9223 (real prompt weights, high angle), the hole and three lamps laid in by hand, img2img at 0.55, seed 9241.",
        "Strong: the hole is unmistakable and huge, the clearest stage for the fall. Weak: flatter light and a plainer finish than the shipped plates; the high angle differs from every other FFX-2 battle plate; the lamps read as lanterns more than machina.",
    ],
    "a1": [
        "What: a pale grey-white void, a floor of pale floating slabs, great shards drifting overhead, a few motes.",
        "Sources: 'falls through a white void' (step 1: Blackestmage, Paradisio, FFExodus); the 'Farplane Abyss' (bremen, KG21, wiki) [verified: 4 sources]. It does not read as the Chapter 5 Farplane (the lavender flower field), which the research warns against.",
        "How: txt2img seed 9411, no hand work.",
        "Strong: the sources' own words, and the shards say 'she fell into something broken'. Weak: the shards are icy and could echo Macalania; the Songstress sits on a mid-grey, which reads, but less vividly than on A2.",
    ],
    "a2": [
        "What: the same place read as depth: deep blue, pale light rising from below, one slab of stone to stand (and kneel) on, crystal shards drifting.",
        "Sources: the fog and the depth (steps 1, 3 and 8, 'deeper into the Farplane'); the blue is our choice, so it departs from 'white void'.",
        "How: seed 9413 regraded to blue by hand, img2img at 0.50, seed 9422.",
        "Strong: the figures read strongest here, and the whistle's yellow light (step 11) would glow on it. Weak: less literal than A1; the slab in the middle has to be kept clear when Yuna kneels on it.",
    ],
}

RECOMMEND = ("Recommendation: C1 (Storm-lit stone) with A1 (White void). C1 matches the house finish of the shipped FFX-2 plates, "
             "keeps the party and the violet Ixion readable, and puts the hole and the lightning at the centre of the frame; "
             "A1 is the sources' own 'white void' and cannot be mistaken for the Chapter 5 Farplane. Second choices: C2 if the hole "
             "must be unmistakable at phone size; A2 if the whistle beat needs a darker stage. [estimate: an agent's judgement]")


def frame_pair(key: str):
    slug = sf.PICKS[key][1].lower().replace(" ", "-").replace("'", "")
    fr = Image.open(os.path.join(SCENES, "frames", f"{key}-{slug}-1600.jpg")).convert("RGB")
    ph = Image.open(os.path.join(SCENES, "frames", f"{key}-{slug}-phone-390.jpg")).convert("RGBA")
    return fr, ph


def thumb(key: str, w: int, h: int) -> Image.Image:
    im = Image.open(os.path.join(sf.CAND, sf.PICKS[key][0])).convert("RGBA")
    t = ls.Image.new("RGBA", (w, h), INK + (255,))
    t.alpha_composite(im.resize((w, int(im.height * w / im.width)), Image.LANCZOS).crop((0, 0, w, h)))
    d = ImageDraw.Draw(t)
    d.rectangle((0, 0, w - 1, h - 1), outline=GOLD, width=2)
    d.rectangle((0, 0, 70, 44), fill=GOLD)
    d.text((10, 2), key.upper(), font=ls.F_H2, fill=INK)
    d.rectangle((70, 0, w - 1, 44), fill=INK + (200,))
    d.text((82, 6), sf.PICKS[key][1], font=ls.F_B, fill=PAPER)
    return t


def main() -> None:
    out = os.path.join(SCENES, "sheet")
    os.makedirs(out, exist_ok=True)
    p = ls.Page()
    p.text("Ixion at Djose: the Chamber and the Abyss, two options each", ls.F_H1, GOLD)
    p.text("FFX-2 only (Chapter 3). Options, not installed; nothing is on the board. From the written descriptions in research/ffx2-ixion-djose.md 6.1 and 7.2. All paintings are ours (local ComfyUI, the house backdrop settings); no retail images.", ls.F_S, GREY, 14)
    grid = Image.new("RGBA", (1020, 600), INK + (255,))
    for i, k in enumerate(["c1", "c2", "a1", "a2"]):
        grid.alpha_composite(thumb(k, 500, 286), ((i % 2) * 520, (i // 2) * 310))
    p.img(grid)
    p.text(RECOMMEND, ls.F_S, PAPER, 14)
    p.text("What Bailey is asked: one Chamber (C1 or C2) and one Abyss (A1 or A2), or a mix (name the parts you want).", ls.F_B, GOLD, 8)
    p.text("Until then the build may install the recommended pair provisionally under clearly named keys, swappable in one line (README). Parts 2 to 5: each option as a battle or cutscene frame, desktop and phone.", ls.F_S, GREY)
    p.render(os.path.join(out, "part-1-overview.jpg"))
    for n, k in enumerate(["c1", "c2", "a1", "a2"], start=2):
        p = ls.Page()
        kind = "Chamber of the Fayth" if k.startswith("c") else "The Farplane Abyss"
        p.text(f"{kind}, option {k.upper()}: {sf.PICKS[k][1]}", ls.F_H1, GOLD)
        fr, ph = frame_pair(k)
        p.img(fr.resize((1020, int(fr.height * 1020 / fr.width)), Image.LANCZOS))
        row = Image.new("RGBA", (1020, 675), INK + (255,))
        row.alpha_composite(ph.resize((312, 675), Image.LANCZOS), (0, 0))
        d = ImageDraw.Draw(row)
        y = 10
        for ln in ls.wrap(d, "Left: the 390x844 phone frame at 80 %.", ls.F_S, 680):
            d.text((336, y), ln, font=ls.F_S, fill=GREY)
            y += 33
        y += 10
        for para in NOTES[k][:3]:
            for ln in ls.wrap(d, para, ls.F_S, 680):
                if y > 640:
                    break
                d.text((336, y), ln, font=ls.F_S, fill=PAPER)
                y += 31
            y += 10
        p.img(row)
        for para in NOTES[k][3:]:
            p.text(para, ls.F_S, PAPER, 6)
        p.render(os.path.join(out, f"part-{n}-{k}.jpg"))



if __name__ == "__main__":
    main()
