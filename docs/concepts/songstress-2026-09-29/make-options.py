"""Build options.html (self-contained, JPEG data URIs) for the Songstress options round (FFX-2 only).

    python docs/concepts/songstress-2026-09-29/make-options.py
Reads the candidates in D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress/options/ and the
battle frames in D:/Tools/pyrefly-scratch/overnight-0929/songstress/battle/. Writes options.html here.
"""
import base64
import io
import json
import pathlib

from PIL import Image

HERE = pathlib.Path(__file__).resolve().parent
CAND = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-29-songstress/options')
BATTLE = pathlib.Path('D:/Tools/pyrefly-scratch/overnight-0929/songstress/battle')
PICKS = {'rikku-A': 4, 'rikku-B': 7, 'rikku-C': 2, 'paine-A': 2, 'paine-B': 4, 'paine-C': 2}
PILOTS = {'rikku-A': [1, 2, 3, 4], 'rikku-B': [2, 3, 4, 5, 6, 7], 'rikku-C': [2, 3, 4],
          'paine-A': [1, 2, 3, 4], 'paine-B': [2, 3, 4], 'paine-C': [2, 3, 4]}
TEXT = json.loads((HERE / 'options-text.json').read_text(encoding='utf8'))


def uri(im, q=78):
    buf = io.BytesIO()
    im.convert('RGB').save(buf, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()


def cut(path, h, bg=(226, 224, 232)):
    im = Image.open(path).convert('RGBA')
    b = Image.new('RGB', im.size, bg)
    b.paste(im, mask=im.split()[-1])
    return b.resize((max(1, int(im.width * h / im.height)), h), Image.LANCZOS)


def card(key):
    t = TEXT['options'][key]
    battle = Image.open(BATTLE / f'{key}.jpg')
    battle = battle.resize((1280, 720), Image.LANCZOS)
    main = cut(CAND / key / f'cand-{PICKS[key]}.png', 520)
    pilots = ''.join(
        f'<figure class="pilot{" on" if n == PICKS[key] else ""}"><img src="{uri(cut(CAND / key / f"cand-{n}.png", 200), 70)}" alt="pilot {n}"><figcaption>cand-{n}</figcaption></figure>'
        for n in PILOTS[key])
    rec = ' rec' if t.get('recommended') else ''
    badge = '<span class="badge">Recommended</span>' if t.get('recommended') else ''
    return f'''<section class="opt{rec}" id="{key}">
<h3>{t["label"]} <small>{key}</small> {badge}</h3>
<p class="l1">{t["line1"]}</p><p class="l2">{t["line2"]}</p>
<div class="pair"><img class="battle" src="{uri(battle, 74)}" alt="{key} in Chapter VI at 1600x900">
<img class="cut" src="{uri(main, 82)}" alt="{key} cut-out"></div>
<div class="pilots">{pilots}</div></section>'''


def main():
    girls = []
    for girl, keys in (('rikku', ['rikku-A', 'rikku-B', 'rikku-C']), ('paine', ['paine-A', 'paine-B', 'paine-C'])):
        g = TEXT['girls'][girl]
        girls.append(f'<h2>{g["title"]}</h2><p class="src">{g["source"]}</p><div class="why"><b>Recommended: {g["pick"]}.</b> {g["why"]}</div>' + ''.join(card(k) for k in keys))
    html = f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Songstress Options</title><style>
:root{{--bg:#f6f4f8;--fg:#1d1a22;--mut:#5d5866;--card:#fff;--line:#ddd6e4;--acc:#b0489e;--ok:#2a7d4f}}
@media (prefers-color-scheme:dark){{:root:not([data-theme="light"]){{--bg:#16131b;--fg:#ece8f2;--mut:#a9a2b4;--card:#221e29;--line:#39323f;--acc:#f7a6de;--ok:#7fd1a0}}}}
:root[data-theme="dark"]{{--bg:#16131b;--fg:#ece8f2;--mut:#a9a2b4;--card:#221e29;--line:#39323f;--acc:#f7a6de;--ok:#7fd1a0}}
body{{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}}
main{{max-width:1320px;margin:0 auto;padding:16px}}h1{{font-size:26px;margin:8px 0}}h2{{margin-top:36px;border-bottom:2px solid var(--acc);padding-bottom:4px}}
.src,.l2,figcaption,small{{color:var(--mut)}}.why{{background:var(--card);border-left:4px solid var(--ok);padding:10px 14px;margin:10px 0 18px}}
.opt{{background:var(--card);border:1px solid var(--line);border-radius:8px;padding:12px 14px;margin:14px 0}}.opt.rec{{border:2px solid var(--ok)}}
.badge{{background:var(--ok);color:#fff;font-size:12px;border-radius:10px;padding:2px 8px;vertical-align:middle}}
.pair{{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap}}.battle{{max-width:100%;width:960px;height:auto;border-radius:4px}}.cut{{height:520px;max-width:100%;object-fit:contain}}
.pilots{{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}}.pilot{{margin:0;text-align:center;font-size:12px}}.pilot img{{height:200px;border:2px solid transparent}}.pilot.on img{{border-color:var(--ok)}}
.l1{{margin:4px 0 0}}.l2{{margin:2px 0 8px}}@media (max-width:700px){{.cut{{height:320px}}.pilot img{{height:120px}}}}
</style></head><body><main>
<h1>Songstress for Rikku and Paine: options</h1>
<p>{TEXT["intro"]}</p>
{''.join(girls)}
<p class="src">{TEXT["footer"]}</p>
</main></body></html>'''
    (HERE / 'options.html').write_text(html, encoding='utf8')
    print('options.html', round(len(html) / 1e6, 2), 'MB')


if __name__ == '__main__':
    main()
