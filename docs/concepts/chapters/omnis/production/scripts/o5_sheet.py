"""O-5 pair sheet (FFX only): the repaired B17 c portrait (A) and the round-2 alternative b1 (B), each in Chapter VII's
dialogue card over the Garden plate (real 1600x900 engine frames, request interception) and whole on the night tone."""
from PIL import Image, ImageDraw, ImageFont
F = lambda s: ImageFont.truetype('C:/Windows/Fonts/arial.ttf', s)
FB = lambda s: ImageFont.truetype('C:/Windows/Fonts/arialbd.ttf', s)
W = 1000
rows = []
def panel(tag, title, lines, frame, png):
    fr = Image.open(frame).convert('RGB').crop((40, 470, 1140, 860))  # the card, 1:1
    p = Image.open(png).convert('RGBA'); bg = Image.new('RGBA', p.size, (28, 26, 40, 255)); bg.alpha_composite(p)
    whole = bg.convert('RGB').resize((416, 608))
    h = 70 + 34 * len(lines) + fr.height * W // fr.width + 20 + 608 + 30
    c = Image.new('RGB', (W, h), (246, 242, 232)); d = ImageDraw.Draw(c)
    d.text((24, 18), f'{tag}  {title}', font=FB(34), fill=(30, 26, 40))
    y = 70
    for ln in lines: d.text((24, y), ln, font=F(26), fill=(50, 46, 60)); y += 34
    c.paste(fr.resize((W, fr.height * W // fr.width)), (0, y)); y += fr.height * W // fr.width + 20
    c.paste(whole, (24, y))
    return c
a = panel('O-5 A', 'the B17 c pick, repaired', ['Forehead oval painted down to the skin, hair-crown', 'pocket closed from the render, edge fringe peeled.', 'Still off the O-1 A costume (red trim, cone spikes).'], 'dialogue-a-1600.png', 'seymour-omnis.repaired.png')
b = panel('O-5 B', 'the round-2 alternative (seed 925211)', ['Same round, not repainted: dark indigo collar, dark', 'lines under the eye (the veins the prompt asked for),', 'a harder smile. Orange cape lining, off O-1 A too.'], 'dialogue-b-1600.png', 'o5-b1.png')
head = Image.new('RGB', (W, 150), (30, 26, 40)); d = ImageDraw.Draw(head)
d.text((24, 16), 'Chapter XII  Omnis speaker portrait  (FFX only)', font=FB(36), fill=(240, 214, 140))
d.text((24, 66), 'CANDIDATES, not approved. Pick A, B, or neither', font=F(28), fill=(236, 232, 240))
d.text((24, 104), '(neither = B17 b, the approved Macalania portrait).', font=F(28), fill=(236, 232, 240))
out = Image.new('RGB', (W, head.height + a.height + b.height + 20), (200, 196, 190))
out.paste(head, (0, 0)); out.paste(a, (0, head.height)); out.paste(b, (0, head.height + a.height + 20))
out.save('o5-sheet.jpg', quality=86)
print(out.size)
