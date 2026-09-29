"""Sin art options, 2026-09-29 (FFX only): build the morning sheet options.html from sheet.json and the frames.

One self-contained page (every picture a JPEG data: URI, under 8 MB): an overview with every recommendation, one
section per subject with its options at battle-frame size, two lines of strengths and faults each and the recommended
pick marked, then the method and every render with its verdict. The head section is the head agent's own fragment
(../head/section.html), embedded as it is when it exists, and linked otherwise.

The same page renders the phone sheets: options.html?part=N shows part N alone in a 1080-px column (#sheet), which
render.mjs `sheets` screenshots into part-N.jpg.

  python build_sheet.py            (from this folder)
"""
import base64, html, io, json, os
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)


def uri(path, width=1600, q=66):
    p = path if os.path.isabs(path) else os.path.join(ROOT, path)
    im = Image.open(p).convert('RGB')
    if im.width > width:
        im = im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)
    b = io.BytesIO(); im.save(b, 'JPEG', quality=q, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(b.getvalue()).decode()


def esc(s):
    return html.escape(s, quote=False).replace('**', '')


def option(o):
    pics = ''.join(f'<figure><img src="{uri(f)}" alt="{esc(c)}"><figcaption>{esc(c)}</figcaption></figure>'
                   for f, c in zip(o['frames'], o['captions']))
    tag = '<span class="pick">RECOMMENDED (an agent\'s look)</span>' if o.get('pick') else ''
    return (f'<div class="opt{" picked" if o.get("pick") else ""}"><h3>Option {esc(o["label"])}: {esc(o["name"])} {tag}</h3>'
            f'{pics}<p class="good"><b>Strengths.</b> {esc(o["good"])}</p><p class="bad"><b>Faults.</b> {esc(o["bad"])}</p></div>')


def section(s, n):
    if s.get('embed'):
        frag = os.path.join(ROOT, s['embed'])
        if os.path.exists(frag):
            body = open(frag, encoding='utf-8').read()
        else:
            body = f'<p class="note">The head section is not ready yet. It will be at <code>{esc(s["embed"])}</code>.</p>'
        return f'<section class="part" data-part="{n}" id="{s["id"]}"><h2>{esc(s["title"])}</h2>{body}</section>'
    opts = ''.join(option(o) for o in s['options'])
    extra = ''.join(f'<figure class="wide"><img src="{uri(f, q=70)}" alt="{esc(c)}"><figcaption>{esc(c)}</figcaption></figure>'
                    for f, c in s.get('extra', []))
    return (f'<section class="part" data-part="{n}" id="{s["id"]}"><h2>{esc(s["title"])}</h2>'
            f'<p class="lede">{esc(s["lede"])}</p><p class="why"><b>Recommendation:</b> {esc(s["why"])}</p>{opts}{extra}'
            f'<p class="src">{esc(s["sources"])}</p></section>')


def main():
    J = json.load(open(os.path.join(HERE, 'sheet.json'), encoding='utf-8'))
    parts = [J['overview']] + J['sections'] + [J['method']]
    body = []
    ov = J['overview']
    rows = ''.join(f'<tr><td>{esc(a)}</td><td>{esc(b)}</td><td>{esc(c)}</td></tr>' for a, b, c in ov['table'])
    body.append(f'<section class="part" data-part="1" id="overview"><h1>{esc(J["title"])}</h1>'
                + ''.join(f'<p>{esc(p)}</p>' for p in ov['intro'])
                + f'<table><tr><th>Subject</th><th>Options</th><th>Recommended pick (an agent\'s look)</th></tr>{rows}</table>'
                + ''.join(f'<p class="note">{esc(p)}</p>' for p in ov['notes']) + '</section>')
    for i, s in enumerate(J['sections']):
        body.append(section(s, i + 2))
    m = J['method']
    renders = ''.join(f'<figure class="thumb"><img src="{uri(f, width=480, q=58)}" alt="{esc(v)}"><figcaption>{esc(v)}</figcaption></figure>'
                      for f, v in m['renders'])
    body.append(f'<section class="part" data-part="{len(parts)}" id="method"><h2>{esc(m["title"])}</h2>'
                + ''.join(f'<p>{esc(p)}</p>' for p in m['text']) + f'<div class="grid">{renders}</div></section>')
    page = TEMPLATE.replace('%TITLE%', esc(J['short'])).replace('%BODY%', '\n'.join(body)).replace('%PARTS%', str(len(parts)))
    out = os.path.join(ROOT, 'options.html')
    open(out, 'w', encoding='utf-8').write(page)
    print('wrote', out, round(os.path.getsize(out) / 1e6, 2), 'MB')


TEMPLATE = '''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>%TITLE%</title>
<style>
:root { --ink: #16141c; --paper: #f5f1e6; --gold: #b8871f; --blood: #a3262a; --muted: #5b5666; --card: #ffffff; --line: #d9d2c0; }
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) { --ink: #ece7da; --paper: #121017; --gold: #e3b94a; --blood: #ff7474; --muted: #a39db0; --card: #1c1a23; --line: #34303f; } }
:root[data-theme="dark"] { --ink: #ece7da; --paper: #121017; --gold: #e3b94a; --blood: #ff7474; --muted: #a39db0; --card: #1c1a23; --line: #34303f; }
* { box-sizing: border-box; }
body { margin: 0; background: var(--paper); color: var(--ink); font: 16px/1.5 system-ui, "Segoe UI", sans-serif; }
main { max-width: 1680px; margin: 0 auto; padding: 24px 16px 64px; }
h1 { font-size: 30px; margin: 0 0 12px; } h2 { font-size: 24px; margin: 40px 0 8px; border-top: 3px solid var(--gold); padding-top: 14px; }
h3 { font-size: 18px; margin: 16px 0 8px; }
figure { margin: 0 0 10px; } figure img { display: block; width: 100%; max-width: 1600px; height: auto; border-radius: 6px; }
figcaption { font-size: 13px; color: var(--muted); margin-top: 3px; }
.opt { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 12px 14px; margin: 14px 0; }
.opt.picked { border: 3px solid var(--gold); }
.pick { background: var(--gold); color: #16141c; font-size: 12px; font-weight: 700; letter-spacing: .06em; padding: 3px 8px; border-radius: 4px; vertical-align: middle; }
.good b { color: var(--gold); } .bad b { color: var(--blood); }
.why { background: var(--card); border-left: 4px solid var(--gold); padding: 8px 12px; }
.src, .note { font-size: 13px; color: var(--muted); }
table { border-collapse: collapse; width: 100%; font-size: 15px; } td, th { border: 1px solid var(--line); padding: 6px 8px; text-align: left; vertical-align: top; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; }
.thumb figcaption { font-size: 12px; }
body.sheet main { max-width: none; padding: 0; }
body.sheet #sheet { width: 1080px; padding: 20px 24px 28px; background: var(--paper); }
body.sheet h2 { margin-top: 0; }
</style>
</head>
<body>
<main id="sheet">
%BODY%
</main>
<script>
window.partCount = %PARTS%;
const part = new URLSearchParams(location.search).get('part');
if (part) {
  document.body.classList.add('sheet');
  document.documentElement.setAttribute('data-theme', 'light');
  document.querySelectorAll('section.part').forEach((s) => { if (s.dataset.part !== part) s.remove(); });
}
</script>
</body>
</html>
'''

if __name__ == '__main__':
    main()
