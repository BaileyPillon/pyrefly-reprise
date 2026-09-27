"""Phone-readable sheet (1080 px wide, each part under 1 MB) for the Ixion at Djose concepts.

Run after frames.py, from the repo root:
    python docs/concepts/chapters/ixion-djose-2026-09-27/scripts/sheet.py
"""
from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.getcwd()
OUT = os.path.join(ROOT, "docs", "concepts", "chapters", "ixion-djose-2026-09-27")
FONTS = "C:/Windows/Fonts"
INK = (20, 18, 26)
GOLD = (217, 180, 90)
PAPER = (240, 232, 214)
DIM = (190, 182, 166)
RED = (214, 72, 60)
WIDTH = 1080
PAD = 44


def font(name, size):
    return ImageFont.truetype(os.path.join(FONTS, name), size)


F_H1 = font("georgiab.ttf", 44)
F_H2 = font("georgiab.ttf", 34)
F_LAB = font("seguisb.ttf", 27)
F_BODY = font("segoeui.ttf", 27)
F_SMALL = font("segoeui.ttf", 22)

_probe = ImageDraw.Draw(Image.new("RGB", (10, 10)))


def wrap(text, f, width):
    out = []
    for para in text.split("\n"):
        cur = ""
        for w in para.split(" "):
            t = (cur + " " + w).strip()
            if _probe.textlength(t, font=f) <= width:
                cur = t
            else:
                out.append(cur)
                cur = w
        out.append(cur)
    return out


class Page:
    """Collects draw ops, then renders at the exact height needed."""

    def __init__(self):
        self.ops = []
        self.y = PAD

    def h1(self, text):
        for line in wrap(text, F_H1, WIDTH - 2 * PAD):
            self.ops.append(("t", PAD, self.y, line, F_H1, GOLD))
            self.y += 54
        self.y += 8

    def h2(self, text, color=GOLD):
        self.y += 10
        for line in wrap(text, F_H2, WIDTH - 2 * PAD):
            self.ops.append(("t", PAD, self.y, line, F_H2, color))
            self.y += 44
        self.y += 4

    def para(self, text, f=F_BODY, color=PAPER, indent=0):
        for line in wrap(text, f, WIDTH - 2 * PAD - indent):
            self.ops.append(("t", PAD + indent, self.y, line, f, color))
            self.y += f.size + 9
        self.y += 8

    def item(self, label, text):
        lw = _probe.textlength(label + " ", font=F_LAB)
        lines = wrap(text, F_BODY, WIDTH - 2 * PAD - 20)
        first_room = WIDTH - 2 * PAD - 20 - lw
        first = wrap(text, F_BODY, int(first_room))
        self.ops.append(("t", PAD + 20, self.y, label, F_LAB, GOLD))
        head = first[0] if first else ""
        self.ops.append(("t", PAD + 20 + lw, self.y, head, F_BODY, PAPER))
        rest = text[len(head):].strip()
        self.y += F_BODY.size + 9
        for line in wrap(rest, F_BODY, WIDTH - 2 * PAD - 20) if rest else []:
            self.ops.append(("t", PAD + 20, self.y, line, F_BODY, PAPER))
            self.y += F_BODY.size + 9
        self.y += 6
        del lines

    def image(self, path):
        im = Image.open(path).convert("RGB")
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
        self.ops.append(("i", 0, self.y, im))
        self.y += im.height + 16

    def rule(self):
        self.ops.append(("r", PAD, self.y + 6))
        self.y += 20

    def render(self, path):
        h = self.y + PAD
        assert h <= 2000, (path, h)
        im = Image.new("RGB", (WIDTH, h), INK)
        d = ImageDraw.Draw(im)
        for op in self.ops:
            if op[0] == "t":
                _, x, y, s, f, c = op
                d.text((x, y), s, font=f, fill=c)
            elif op[0] == "i":
                im.paste(op[3], (op[1], op[2]))
            else:
                d.line((op[1], op[2], WIDTH - PAD, op[2]), fill=GOLD, width=2)
        im.save(path, quality=84, optimize=True)
        size = os.path.getsize(path)
        assert size < 1_000_000, (path, size)
        print(path, im.size, size)


def stamp(p: Page):
    p.para("ROUGH CONCEPTS. Nothing is built; each needs your pick (rules 9 and 10). FFX-2 only (rule 14).",
           F_SMALL, RED)


CONCEPTS = {
    "A": ("The Horn and the Hole", "one link, then a short scripted close", "a-horn-and-hole", [
        ("Plays:", "One fight, Ixion in the Chamber of the Fayth, the hole where the fayth stood in view. "
                   "His loop is fixed: Attack or Thundara on everyone, twice, then Aerospark (5/8 of current HP). "
                   "The only warning is the game's own 'Recharge' banner (+200 HP, +200 MP); Thor's Hammer is his next action."),
        ("Close:", "He rises after the win and charges; Yuna goes into the hole. A short cutscene over one Abyss plate: "
                   "Shuyin calls her Lenne, the embrace, he is Baralai, Nooj and Gippal hand over Crimson Spheres 2 and 3. "
                   "'I'm all alone.' Then you press to whistle, four times, and a light leads her out. She wakes in the Bevelle Underground."),
        ("Teaches:", "Read a fixed cycle and its tell. Shell and heal on the Recharge turn. Water hurts him; Lightning heals him."),
        ("Faithful:", "Every fight fact and all 12 scene beats have 3 or more sources. The counter stays hidden, as in the game. "
                      "The dialogue is ours (none was found)."),
        ("Cost:", "Engine small: the Chapter XI action counter plus a three-step cycle; the whistle is a story step. "
                  "Art medium: about 6 new subjects (part 5)."),
        ("Risks:", "The Lv 30 to 36 party is our estimate, so the fight may be too easy until benched. The Abyss plate must not "
                   "look like the Chapter 5 Farplane. The whistle must feel like a moment, not a quick-time test."),
    ]),
    "B": ("The Storm Gauge", "the fight made readable; the chapter ends on the fall", "b-storm-gauge", [
        ("Plays:", "The same fight, but the hidden action counter shows: sparks climb Ixion's horn and 20 pips fill under "
                   "his name (+5 per action, +10 for Aerospark, +5 each time you hit him). At 100: Recharge, then Thor's Hammer."),
        ("Close:", "None past the fall. The last frame is Yuna going over the edge, then the chapter card. "
                   "The Abyss scene is held for a later chapter's prologue."),
        ("Teaches:", "The counter itself, and a real trade-off: every hit brings the Hammer sooner, so burst when ready, not before."),
        ("Faithful:", "The numbers are unchanged, but the game never shows the counter. The gauge is ours, like the move "
                      "advisor, and would ship as a switch. It cuts the scene the research calls the reason to make the chapter."),
        ("Cost:", "Lowest art: Ixion and the Chamber only, plus horn VFX. A new HUD element, which needs its own mockup round."),
        ("Risks:", "An invented readout on the 'faithful core'. A cliffhanger with no payoff until some later chapter. "
                   "It teaches our HUD instead of the game's tell."),
    ]),
    "C": ("Two Rooms and the Abyss", "antechamber fight, walkable Abyss", "c-two-rooms", [
        ("Plays:", "Blackestmage's reading of the room (IX-4): at the top of the stairs Ixion is attacking two Al Bhed, and the "
                   "fight is in the antechamber. After the win the girls walk into the Chamber; the charge and fall happen at the hole."),
        ("Close:", "The Abyss is a small walkable diorama, because the game hands back control there: Yuna walks a floating path, "
                   "Shuyin comes out of the fog, the embrace locks her input (she cannot move, per the Ultimania), Baralai is revealed, "
                   "she kneels alone, and each whistle lights a quarter of a yellow bridge. After four she runs across."),
        ("Teaches:", "The same fight lesson as A; the whistle becomes an ending you perform."),
        ("Faithful:", "Closest to the scene's shape. But the room is the minority reading (1 source against 3), "
                      "and a Steam session would be needed to settle it."),
        ("Cost:", "Highest. Walking is a new system (today the game is battles and cutscenes), two temple plates, "
                  "an Abyss diorama, bridge VFX, Al Bhed figures, full-figure Baralai, Nooj and Gippal: about 12 subjects."),
        ("Risks:", "A new movement system means a deep review and scope creep, for one scene."),
    ]),
}

SUMMARY = {
    "A": "Fight Ixion in the Chamber with the hole in view; the game's own 'Recharge' banner is the tell. After the win "
         "he charges, Yuna falls, a short Abyss cutscene (Shuyin, Baralai, the spheres), and you whistle four times.",
    "B": "The same fight with the hidden counter shown as horn sparks and 20 pips, so you can pace your hits. "
         "The chapter ends on the fall; the Abyss waits for a later chapter.",
    "C": "Fight in the antechamber, walk into the Chamber for the fall, then walk the Abyss yourself: the embrace "
         "locks your input and each whistle lights a quarter of a bridge.",
}

PAINTINGS = [
    ("Ixion, FFX-2 version", "A B C", "idle, charge, cast (Thundara, the Recharge glow), Thor's Hammer. The look is Q6: "
     "the FFX Ixion as it is (on disk: idle, attack, overdrive), the house violet 'possessed' look, or machina-fused "
     "(FFExodus only). 'As it is' costs almost nothing."),
    ("Djose, Chamber of the Fayth", "A B C", "temple stone held by lightning, the statue torn out, the hole in the floor, "
     "Machine Faction gear. New."),
    ("Djose antechamber", "C", "the top of the stairs and the door to the Chamber. New."),
    ("The Farplane Abyss", "A C", "a white, foggy void. A needs one plate (or your yes to reuse the approved Chapter 5 "
     "Farplane). C needs layers: a floating path and the bridge."),
    ("Yuna, Songstress", "A C", "a falling pose and a kneeling pose (C adds a walk and a run). Six poses (attack, cast, "
     "dance, item, KO, victory) are approved; the idle is on disk."),
    ("Shuyin with Yuna, the embrace", "A C", "one still. Shuyin's idle and portrait are approved."),
    ("Baralai, possessed", "A C", "A uses the approved portrait. C needs a full figure (only the translucent shade exists)."),
    ("Nooj and Gippal", "A C", "A uses portraits (Gippal's approved; Nooj's on disk, not in the approved list). "
     "C needs full figures (only shade art exists)."),
    ("The spirit light", "A C", "the yellow ghost-like figure that leads her out. A glow effect or a small painting."),
    ("Two Al Bhed", "C", "Machine Faction members, intro only."),
    ("Bevelle Underground", "A C", "where she wakes. The approved Chapter 4 plate, reused."),
    ("Party", "A B C", "Dark Knight and White Mage exist for all three girls, as the guides' parties use. Samurai only "
     "for Paine (idle)."),
]


def part1():
    p = Page()
    p.h1("Ixion at Djose Temple: three chapter concepts")
    stamp(p)
    p.para("The Chapter 3 finale of FFX-2. Research: research/ffx2-ixion-djose.md (commit cd88a3f9). "
           "Ixion Lv 28, HP 12,380 [verified: 8 sources]; absorbs Lightning, weak to Water; "
           "Recharge at 100 on the action counter, then Thor's Hammer [verified: 3 sources].", F_SMALL, DIM)
    p.rule()
    for k, (name, sub, _, lines) in CONCEPTS.items():
        p.h2(f"{k}. {name}")
        p.para(sub, F_SMALL, DIM)
        p.para(SUMMARY[k], F_BODY)
    p.rule()
    p.h2("Recommendation: A", RED)
    p.para("It keeps the one clean lesson (the Recharge warning) and the scene that is the reason to make this chapter, "
           "at a small engine cost and about 6 new paintings. B trades the payoff for an invented gauge; C buys a "
           "walking system for one scene. If you like B's gauge, it could sit on A as a switch, off by default: "
           "that would be its own question.")
    p.h2("What I need from you")
    p.para("1. A, B, C, or a mix (say which parts).")
    p.para("2. Ixion's look (Q6): the FFX painting as it is, violet 'possessed', or machina-fused.")
    p.para("Four smaller questions (Thor's Hammer's element, the fight's room, what counts as a hit, the whistle) "
           "are in the README and research §9, each with a lean.", F_SMALL, DIM)
    p.render(os.path.join(OUT, "sheet", "part-1-overview.jpg"))


def concept_part(n, key):
    name, sub, frame, lines = CONCEPTS[key]
    p = Page()
    p.h1(f"{key}. {name}")
    p.para(sub + ("   (recommended)" if key == "A" else ""), F_SMALL, RED if key == "A" else DIM)
    p.image(os.path.join(OUT, "frames", f"{frame}-1600.jpg"))
    for label, text in lines:
        p.item(label, text)
    p.render(os.path.join(OUT, "sheet", f"part-{n}-concept-{key.lower()}.jpg"))


def part5():
    p = Page()
    p.h1("Paintings the chapter would need")
    p.para("Letters say which concept needs it. Original art only (rule 8); each new subject gets a pilot at 1:1 "
           "before any batch, and your pick before it is installed.", F_SMALL, DIM)
    for name, which, text in PAINTINGS:
        p.item(f"{name}  [{which}]", text)
    p.rule()
    p.para("Counts: A about 6 new subjects, B 2 plus horn effects, C about 12. Music is by ear (rule 13): the "
           "game plays 'Aeons' in this fight [single source]; our original FFX-2 aeon cue could serve, and the Abyss "
           "needs a cue of its own.", F_SMALL, DIM)
    p.render(os.path.join(OUT, "sheet", "part-5-paintings.jpg"))


def main():
    os.makedirs(os.path.join(OUT, "sheet"), exist_ok=True)
    part1()
    for n, key in [(2, "A"), (3, "B"), (4, "C")]:
        concept_part(n, key)
    part5()


if __name__ == "__main__":
    main()
