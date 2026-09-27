"""The contact sheet: 4 cases x options A-D, the face box outlined in magenta, the
measurement under every frame; the phone frame in its own column."""
import json
from PIL import Image, ImageDraw, ImageFont

OUT = 'D:/Final Fantasy/docs/concepts/pause-dossier-2026-09-27'
PHONE_SRC = 'D:/Final Fantasy/docs/screenshots/yojimbo-ship/list-390x844-05-pause-chapter.jpg'
M = json.load(open(f'{OUT}/measure.json', encoding='utf8'))
CHECK = 'D:/pyrefly-t1-b3b/docs/screenshots/t1-b3b-recheck/base'

F = 'C:/Windows/Fonts/segoeui.ttf'
FB = 'C:/Windows/Fonts/segoeuib.ttf'
f_title = ImageFont.truetype(FB, 30)
f_head = ImageFont.truetype(FB, 20)
f_txt = ImageFont.truetype(F, 16)

BG = (14, 12, 18)
INK = (236, 232, 222)
DIM = (160, 154, 146)
GOLD = (227, 185, 74)
GOOD = (120, 205, 140)
BAD = (240, 110, 110)
MAG = (255, 60, 220)

TW = 470
PAD = 18
CASES = [('ch2', 1600, 900), ('ch2', 2000, 1012), ('ch9', 1600, 900), ('ch9', 2000, 1012)]
OPTS = [('a-mirror', 'A  Mirror'), ('b-stack', 'B  Stack'), ('c-slide', 'C  Slide'), ('d-leave', 'D  Leave it (live)')]
NAME = {'ch2': 'Ch II, Yuna', 'ch9': 'Ch IX, Yojimbo'}


def live_overlaps(ch, w):
    js = f'{CHECK}/pausechapter-{w}x{900 if w == 1600 else 1012}-yunalesca_yojimbo-cavern.json'
    cid = 'yunalesca' if ch == 'ch2' else 'yojimbo-cavern'
    for e in json.load(open(js, encoding='utf8')):
        if e['id'] == cid:
            for s in e['states']:
                if s.get('tag') == 'battle':
                    return len(s['overlaps'])
    return None


def verdict(ch, w, key, r):
    if key == 'd-leave':
        return f'{live_overlaps(ch, w)} text boxes on the face', BAD
    extra = ''
    if key in ('a-mirror', 'c-slide'):
        extra = f", {r['note'].split(',')[0]}; snapshots dropped"
    if key == 'b-stack':
        extra = '; dossier (quote + snapshots) dropped'
    return f"clear, {r['clearance_px']} px air{extra}", GOOD


def main():
    th = {w: round(TW * h / w) for _, w, h in CASES}
    phone_w = 300
    phone_h = round(phone_w * 844 / 390)
    rows_h = sum(th[w] + 58 for _, w, _ in CASES)
    W = PAD + 4 * (TW + PAD) + phone_w + PAD
    H = 96 + 34 + rows_h + PAD
    sheet = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((PAD, 16), 'PR-0171  Pause CHAPTER tab over a painted face: where the columns go', font=f_title, fill=INK)
    d.text((PAD, 56), 'Battle state (THE PARTY shown). Composited from the live-build captures of 2026-09-26 (re-check base) '
           'and the shipped plates. Magenta = the face box. FFX only (Ch II, Ch IX); the rule is shared pause chrome.',
           font=f_txt, fill=DIM)
    x = PAD
    for key, label in OPTS:
        d.text((x, 96), label, font=f_head, fill=GOLD)
        x += TW + PAD
    y = 96 + 34
    for ch, w, h in CASES:
        for i, (key, _) in enumerate(OPTS):
            r = M[f'{ch}-{w}'][key]
            im = Image.open(f'{OUT}/{r["file"]}').convert('RGB')
            sc = TW / w
            t = im.resize((TW, th[w]), Image.LANCZOS)
            td = ImageDraw.Draw(t)
            fl, ft, fr, fb = r['face']
            td.rectangle([fl * sc, ft * sc, min(fr * sc, TW - 1), fb * sc], outline=MAG, width=2)
            x = PAD + i * (TW + PAD)
            sheet.paste(t, (x, y))
            txt, col = verdict(ch, w, key, r)
            d.text((x, y + th[w] + 4), f'{NAME[ch]}  {w}x{h}', font=f_txt, fill=DIM)
            d.text((x, y + th[w] + 24), txt, font=f_txt, fill=col)
        y += th[w] + 58
    # the phone
    px = PAD + 4 * (TW + PAD)
    d.text((px, 96), 'Phone 390x844', font=f_head, fill=GOLD)
    ph = Image.open(PHONE_SRC).convert('RGB').resize((phone_w, phone_h), Image.LANCZOS)
    sheet.paste(ph, (px, 130))
    lines = ['Ch IX, live (yojimbo-ship', 'capture). The same under', 'A, B, C and D: a portrait', 'frame never mirrors or',
             'slides; it already stacks', 'the columns under the face.']
    for k, ln in enumerate(lines):
        d.text((px, 140 + phone_h + k * 20), ln, font=f_txt, fill=DIM)
    sheet.save(f'{OUT}/sheet.jpg', quality=82, optimize=True)
    # the phone frame at real size, for the README
    Image.open(PHONE_SRC).convert('RGB').resize((390, 844), Image.LANCZOS).save(f'{OUT}/ch9-390x844-all-options.jpg', quality=88)
    print(sheet.size)


if __name__ == '__main__':
    main()
