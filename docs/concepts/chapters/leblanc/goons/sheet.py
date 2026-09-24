"""Goons options sheet (FFX-2 only, chapter 6 Act I).

    D:/Tools/ComfyUI/python_embeded/python.exe -s docs/concepts/chapters/leblanc/goons/sheet.py spec.json out.jpg

spec.json: {
  "trio": [["Leblanc", "<idle.png>"], ...],             # the approved-quality bar, same scale
  "research": ["line", ...],                             # quoted source lines
  "installed": "<in-game crop of the shipped placeholder>",
  "rows": [ { "title": "Dr. Goon", "options": [ { "label": "A", "png": "...", "line": "...",
              "crops": { "face": [x,y,w,h], "hands": [...], "detail": [...] },
              "ingame": "<in-game enemies crop>" } ] } ]
}
Whole figures are drawn at SCALE of their native pixels (trio and options alike, so heights compare);
every crop is 1:1 native pixels (no resampling).
"""
import json
import sys

from PIL import Image, ImageDraw, ImageFont

SCALE = 0.42
BG = (24, 20, 30)
INK = (236, 228, 214)
GOLD = (214, 176, 96)
DIM = (150, 140, 150)
F = 'C:/Windows/Fonts/'


def font(size, bold=False):
    return ImageFont.truetype(F + ('arialbd.ttf' if bold else 'arial.ttf'), size)


def checker(w, h, a=(44, 40, 52), b=(36, 32, 44), s=16):
    im = Image.new('RGB', (w, h), a)
    d = ImageDraw.Draw(im)
    for y in range(0, h, s):
        for x in range(0, w, s):
            if (x // s + y // s) % 2:
                d.rectangle([x, y, x + s - 1, y + s - 1], fill=b)
    return im


def on_bg(rgba):
    base = checker(*rgba.size)
    base.paste(rgba, (0, 0), rgba)
    return base


def whole(path):
    im = Image.open(path).convert('RGBA')
    return on_bg(im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS))


def crop(path, box):
    im = Image.open(path).convert('RGBA')
    x, y, w, h = box
    return on_bg(im.crop((x, y, x + w, y + h)))


def wrap(text, fnt, width, d):
    words, lines, cur = text.split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=fnt) <= width:
            cur = t
        else:
            lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def main(spec_path, out):
    spec = json.load(open(spec_path, encoding='utf-8'))
    W = 2200
    blocks = []  # list of (height, draw_fn)
    tmp = Image.new('RGB', (10, 10))
    td = ImageDraw.Draw(tmp)

    # header
    def header(im, y):
        d = ImageDraw.Draw(im)
        d.text((24, y + 12), spec.get('title', 'Goons options'), font=font(34, True), fill=GOLD)
        d.text((24, y + 56), spec.get('subtitle', ''), font=font(18), fill=DIM)
        return 90
    blocks.append((90, header))

    # research + installed + trio
    trio = [(n, whole(p)) for n, p in spec['trio']]
    inst = Image.open(spec['installed']).convert('RGB') if spec.get('installed') else None
    rlines = []
    for line in spec['research']:
        rlines += wrap(line, font(17), 560, td) + ['']
    top_h = max(max(t.height for _, t in trio) + 40, 30 + 22 * len(rlines), (inst.height + 40) if inst else 0) + 20

    def top(im, y):
        d = ImageDraw.Draw(im)
        d.text((24, y), 'RESEARCH (quoted, research/ffx2-leblanc-syndicate.md)', font=font(16, True), fill=GOLD)
        yy = y + 26
        for ln in rlines:
            d.text((24, yy), ln, font=font(17), fill=INK)
            yy += 22
        x = 620
        if inst:
            d.text((x, y), 'INSTALLED today (in battle, 1:1): procedural placeholder', font=font(16, True), fill=GOLD)
            im.paste(inst, (x, y + 26))
            x += max(inst.width, 420) + 30
        d.text((x, y), f'THE BAR: Leblanc trio idles, whole at {SCALE:.2f}x', font=font(16, True), fill=GOLD)
        for n, t in trio:
            im.paste(t, (x, y + 26))
            d.text((x, y + 30 + t.height), n, font=font(16), fill=INK)
            x += t.width + 18
        return top_h
    blocks.append((top_h, top))

    for row in spec['rows']:
        cols = []
        for o in row['options']:
            wh = whole(o['png'])
            cr = {k: crop(o['png'], v) for k, v in o['crops'].items()}
            ig = Image.open(o['ingame']).convert('RGB') if o.get('ingame') else None
            cols.append((o, wh, cr, ig))
        colw = (W - 48) // len(cols)
        heights = []
        for o, wh, cr, ig in cols:
            h = 40 + wh.height + 10
            lines = wrap(o['line'], font(17), colw - 30, td)
            h += 22 * len(lines) + 16
            cw = sum(c.width for c in cr.values()) + 10 * len(cr)
            h += max(c.height for c in cr.values()) + 30 if cw <= colw else sum(c.height + 30 for c in cr.values())
            if ig:
                h += ig.height + 40
            heights.append(h)
        rh = max(heights) + 70

        def draw_row(im, y, row=row, cols=cols, colw=colw):
            d = ImageDraw.Draw(im)
            d.line([(24, y + 8), (W - 24, y + 8)], fill=(80, 70, 90), width=2)
            d.text((24, y + 18), row['title'], font=font(28, True), fill=GOLD)
            d.text((24 + d.textlength(row['title'], font=font(28, True)) + 20, y + 26), row.get('note', ''), font=font(16), fill=DIM)
            for i, (o, wh, cr, ig) in enumerate(cols):
                x = 24 + i * colw
                yy = y + 64
                d.text((x, yy), o['label'], font=font(30, True), fill=INK)
                d.text((x + 40, yy + 8), o.get('name', ''), font=font(18, True), fill=INK)
                yy += 42
                im.paste(wh, (x, yy))
                # crops beside the whole figure when they fit, else below
                cx, cy = x + wh.width + 12, yy
                for k, c in cr.items():
                    if cx + c.width > x + colw - 10:
                        break
                    d.text((cx, cy), f'{k} 1:1', font=font(14), fill=DIM)
                    im.paste(c, (cx, cy + 18))
                    cy += c.height + 30
                yy += wh.height + 10
                for ln in wrap(o['line'], font(17), colw - 30, td):
                    d.text((x, yy), ln, font=font(17), fill=INK)
                    yy += 22
                yy += 12
                if ig:
                    d.text((x, yy), 'in battle, 1:1 (Ormi + both goons)', font=font(14), fill=DIM)
                    im.paste(ig, (x, yy + 18))
            return rh
        blocks.append((rh, draw_row))

    H = sum(h for h, _ in blocks) + 30
    im = Image.new('RGB', (W, H), BG)
    y = 10
    for h, fn in blocks:
        fn(im, y)
        y += h
    im.save(out, quality=90)
    print(out, im.size)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
