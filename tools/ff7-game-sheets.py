"""Target-vs-build sheets for the FF7 Guard Scorpion integration (FF7 only).

Left: the approved target (the A+ HUD frames in docs/concepts/ff7-hud-2026-09-27/a-plus/frames,
Bailey's pick D-237 made more faithful; the art composite for the field, D-240). Right: the
running game, captured by tests/e2e/ff7-guard-scorpion.spec.ts with real keys and taps
(docs/screenshots/ff7/game-*.jpg). Each sheet stays under 2000 px tall so it reads on a phone.

    python tools/ff7-game-sheets.py [<dir of the frames before the purist-review repair>]

With a before-dir it also writes the repair sheets (before vs after, and the new moments).
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / 'docs/concepts/ff7-hud-2026-09-27/a-plus/frames'
ART = ROOT / 'docs/concepts/ff7-art-2026-09-27/round2'
BUILD = ROOT / 'docs/screenshots/ff7'
BG = (12, 12, 20)
INK = (226, 228, 240)
DIM = (150, 156, 180)


def font(size: int) -> ImageFont.ImageFont:
    for name in ('segoeui.ttf', 'arial.ttf', 'DejaVuSans.ttf'):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def fit(path: Path, w: int) -> Image.Image:
    im = Image.open(path).convert('RGB')
    return im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)


def sheet(out: str, title: str, note: str, pairs: list[tuple[str, Path, Path]], cell_w: int, per_row: int,
          words: tuple[str, str] = ('target', 'build')) -> None:
    pad, head = 16, 92
    cells = [(label, fit(t, cell_w), fit(b, cell_w)) for label, t, b in pairs if t.exists() and b.exists()]
    missing = [label for label, t, b in pairs if not (t.exists() and b.exists())]
    cell_h = max(max(t.height, b.height) for _, t, b in cells) + 30
    rows = (len(cells) + per_row - 1) // per_row
    W = pad + per_row * (2 * cell_w + 3 * pad)
    H = head + rows * (cell_h + pad) + pad
    im = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(im)
    d.text((pad, 12), title, fill=INK, font=font(26))
    d.text((pad, 50), note + (f'  (no frame: {", ".join(missing)})' if missing else ''), fill=DIM, font=font(16))
    for i, (label, t, b) in enumerate(cells):
        x = pad + (i % per_row) * (2 * cell_w + 3 * pad)
        y = head + (i // per_row) * (cell_h + pad)
        d.text((x, y), f'{label}: {words[0]}', fill=DIM, font=font(15))
        d.text((x + cell_w + pad, y), f'{label}: {words[1]}', fill=INK, font=font(15))
        im.paste(t, (x, y + 26))
        im.paste(b, (x + cell_w + pad, y + 26))
    assert H <= 2000, (out, H)
    im.save(BUILD / out, quality=84)
    print(out, im.size)


def main() -> None:
    desk = [
        ('1 Cloud\'s turn', TARGET / '1-cloud-turn-attack-1600.jpg', BUILD / 'game-1600x900-turn.jpg'),
        ('2 Magic, MP', TARGET / '2-magic-mp-cost-1600.jpg', BUILD / 'game-1600x900-magic.jpg'),
        ('3 targeting', TARGET / '3-targeting-1600.jpg', BUILD / 'game-1600x900-target.jpg'),
        ('4 Tail Laser', TARGET / '4-tail-laser-damage-1600.jpg', BUILD / 'game-1600x900-tail-laser.jpg'),
        ('5 Limit full', TARGET / '5-limit-full-1600.jpg', BUILD / 'game-1600x900-limit-full.jpg'),
        ('5b Limit window', TARGET / '5b-limit-window-1600.jpg', BUILD / 'game-1600x900-limit-window.jpg'),
    ]
    note = 'FF7 only. Target = A+ (D-237, refined); build = the running game by real keys. Target scene and figures are placeholders.'
    sheet('sheet-game-1600-a.jpg', 'FF7 Guard Scorpion, 1600x900: target vs build (1 of 2)', note, desk[:3], 780, 1)
    sheet('sheet-game-1600-b.jpg', 'FF7 Guard Scorpion, 1600x900: target vs build (2 of 2)', note, desk[3:], 780, 1)
    phone = [
        ('1 turn', TARGET / 'phoneB-1-cloud-turn-attack-390.jpg', BUILD / 'game-390x844-turn.jpg'),
        ('2 Magic', TARGET / 'phoneB-2-magic-mp-cost-390.jpg', BUILD / 'game-390x844-magic.jpg'),
        ('3 target', TARGET / 'phoneB-3-targeting-390.jpg', BUILD / 'game-390x844-target.jpg'),
        ('4 Tail Laser', TARGET / 'phoneB-4-tail-laser-damage-390.jpg', BUILD / 'game-390x844-tail-laser.jpg'),
        ('5 Limit full', TARGET / 'phoneB-5-limit-full-390.jpg', BUILD / 'game-390x844-limit-full.jpg'),
        ('5b Limit window', TARGET / '5b-limit-window-390.jpg', BUILD / 'game-390x844-limit-window.jpg'),
    ]
    sheet('sheet-game-390.jpg', 'FF7 at 390x844 (phone B, the pick): target vs build, by real taps',
          'Phone B: names on the status rows, 1.64 px/u. The target\'s 5b frame is phone A\'s (B has none).', phone, 190, 3)
    ab = [
        ('turn', BUILD / 'phoneA-390x844-turn.jpg', BUILD / 'game-390x844-turn.jpg'),
        ('Magic', BUILD / 'phoneA-390x844-magic.jpg', BUILD / 'game-390x844-magic.jpg'),
    ]
    sheet('sheet-phone-a-vs-b.jpg', 'Phone layout check: A (left) vs B (right), same fight, real taps',
          'B chosen: its rows read across (name, HP, MP) as FF7\'s do; A\'s names sit in another window at other heights.', ab, 300, 2,
          ('phone A', 'phone B (chosen)'))
    art = [
        ('field, tail down', ART / '13-composite-1600-clean.jpg', BUILD / 'game-1600x900-opening.jpg'),
        ('field, tail raised', ART / '13-composite-1600-clean-tail-raised.jpg', BUILD / 'game-1600x900-tail-laser.jpg'),
    ]
    sheet('sheet-game-vs-composite.jpg', 'The field: the art composite Bailey accepted (D-240) vs the running game',
          'Left: round 2 composite. Right: the running game at 1600x900 (opening; the Tail Laser with the raised tail).', art, 780, 1)

    if len(sys.argv) > 1:
        repair(Path(sys.argv[1]))


def repair(before: Path) -> None:
    """The FF7 purist review's repair pass (2026-09-27): the same moments before and after, and the new ones."""
    pairs = [
        ('framing (items 1, 3, 11, 14)', before / 'game-1600x900-turn.jpg', BUILD / 'game-1600x900-turn.jpg'),
        ('Tail Laser numerals (item 2)', before / 'game-1600x900-tail-laser.jpg', BUILD / 'game-1600x900-tail-laser.jpg'),
        ('results rows (item 7)', before / 'game-1600x900-victory.jpg', BUILD / 'game-1600x900-victory.jpg'),
    ]
    sheet('sheet-repair-1600.jpg', 'FF7 purist review repairs, 1600x900: before vs after',
          'Same fight, real keys. Raised fixed camera: every fighter whole above the band; the party a diagonal in depth.', pairs, 780, 1,
          ('before', 'after'))
    moments = [
        ('warnings (item 6)', BUILD / 'game-1600x900-hint-2.jpg', BUILD / 'game-1600x900-hint-3.jpg'),
        ('run and edge (items 4, 12)', BUILD / 'game-1600x900-melee-strike.jpg', BUILD / 'game-1600x900-defend.jpg'),
    ]
    sheet('sheet-repair-moments.jpg', 'New moments: the warnings as one block, the melee run, Defend over whole fields',
          'Left pair: line 2 then line 3, nothing between. Right pair: Cloud at the strike point; Defend covering the whole HP field.',
          moments, 780, 1, ('first', 'then'))
    phone = [
        ('turn', before / 'game-390x844-turn.jpg', BUILD / 'game-390x844-turn.jpg'),
        ('Tail Laser', before / 'game-390x844-tail-laser.jpg', BUILD / 'game-390x844-tail-laser.jpg'),
    ]
    sheet('sheet-repair-390.jpg', 'FF7 at 390x844 (phone B): before vs after the repair',
          'No ground rings, no PAUSE chip, each name once; the upright framing is still an options question.', phone, 300, 2,
          ('before', 'after'))


if __name__ == '__main__':
    main()
