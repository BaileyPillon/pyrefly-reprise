"""Pose round 2 review sheets (FFX-2 only, 2026-09-25). One sheet per dressphere, one row per slot:
the shipped idle, then every round-2 candidate, all at ONE pixel scale (a head that came out too big
shows as too big), with the guard's word and my own look (looks.json; NOT a judge) under each frame.
A strip under each row repeats the idle and every candidate at game size (the idle 240 px tall, the
candidates at the same factor, so a candidate that is short at 1:1 is short in the game too until a
judge sets its head-match `scale`).

    python make-sheets2.py [id,id,...]     # writes sheet-<id>.jpg beside this file
Reads D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/pose-round2/<id>/<pose>/.
"""
from __future__ import annotations

import json
import pathlib
import sys

from PIL import Image, ImageDraw, ImageFont

HERE = pathlib.Path(__file__).resolve().parent
CAND = pathlib.Path('D:/Tools/pyrefly-art-backup/candidates/2026-09-25-day1/pose-round2')
ART = pathlib.Path('D:/Final Fantasy/public/art/characters')
SCALE = 0.3
GAME_H = 240
BG = (178, 180, 188)
GROUND = (34, 40, 64)


def font(n):
    try:
        return ImageFont.truetype('arial.ttf', n)
    except OSError:
        return ImageFont.load_default()


def flat(path, s, bg=BG):
    im = Image.open(path).convert('RGBA')
    im = im.resize((max(1, int(im.width * s)), max(1, int(im.height * s))), Image.LANCZOS)
    out = Image.new('RGB', im.size, bg)
    out.paste(im, mask=im.split()[-1])
    return out


def wrap(text, width):
    words, lines, cur = text.split(), [], ''
    for w in words:
        if len(cur) + len(w) + 1 > width:
            lines.append(cur); cur = w
        else:
            cur = f'{cur} {w}'.strip()
    if cur:
        lines.append(cur)
    return lines


def main():
    work = json.loads((HERE / 'worklist.json').read_text(encoding='utf8'))['order']
    looks = json.loads((HERE / 'looks.json').read_text(encoding='utf8')) if (HERE / 'looks.json').exists() else {}
    only = set(sys.argv[1].split(',')) if len(sys.argv) > 1 else None
    f13, f16, f22 = font(13), font(16), font(24)
    ids = [x for x in dict.fromkeys(i['id'] for i in work) if not only or x in only]
    for gid in ids:
        idle_p = ART / gid / 'idle.png'
        idle = flat(idle_p, SCALE)
        idle_h = Image.open(idle_p).height
        g = GROUND_F = GAME_H / idle_h
        blocks = []
        for item in [i for i in work if i['id'] == gid]:
            d = CAND / gid / item['pose']
            sides = sorted(d.glob('cand-*.json'), key=lambda q: int(q.stem.split('-')[1])) if d.exists() else []
            if not sides:
                continue
            look = looks.get(f"{gid}/{item['pose']}", {})
            tiles = [('shipped idle', '', idle, None)]
            game = [flat(idle_p, g, GROUND)]
            for sp in sides:
                n = int(sp.stem.split('-')[1])
                meta = json.loads(sp.read_text(encoding='utf8'))
                png = d / f'cand-{n}.png'
                if not png.exists():
                    continue
                ok = meta['guard']['ok']
                word = f"cand-{n} (try {meta.get('try', 'a')}, cn {meta['controlnet']['strength']}) guard {'ok' if ok else 'REJECT'}"
                note = look.get('cands', {}).get(str(n), '' if ok else '; '.join(meta['guard']['reasons'])[:120])
                tiles.append((word, note, flat(png, SCALE), ok))
                game.append(flat(png, g, GROUND))
            head = f"{gid} / {item['pose']}   my look (not a judge): {look.get('verdict', 'not looked at yet')}"
            ans = 'round 2 answer: ' + item['answer']
            tw = sum(t[2].width + 14 for t in tiles) + 14
            th = max(t[2].height for t in tiles)
            gw = sum(x.width + 10 for x in game) + 14
            gh = max(x.height for x in game)
            width = max(tw, gw, 900)
            ans_lines = wrap(ans, max(60, width // 8))
            H = 34 + 18 * len(ans_lines) + th + 60 + gh + 24
            blk = Image.new('RGB', (width, H), (236, 236, 240))
            dr = ImageDraw.Draw(blk)
            dr.text((12, 6), head, fill=(20, 20, 30), font=f22)
            y = 36
            for ln in ans_lines:
                dr.text((12, y), ln, fill=(60, 60, 90), font=f13); y += 18
            x = 14
            for word, note, im, ok in tiles:
                blk.paste(im, (x, y + th - im.height))
                col = (20, 120, 40) if ok else ((170, 30, 30) if ok is False else (30, 30, 30))
                dr.text((x, y + th + 4), word, fill=col, font=f13)
                for k, ln in enumerate(wrap(note, max(20, im.width // 7))[:3]):
                    dr.text((x, y + th + 20 + 14 * k), ln, fill=(40, 40, 40), font=f13)
                x += im.width + 14
            y += th + 64
            dr.text((12, y - 16), 'game size (idle 240 px; candidates at the same factor, before any head-match scale)', fill=(60, 60, 60), font=f13)
            x = 14
            for im in game:
                blk.paste(im, (x, y + gh - im.height)); x += im.width + 10
            blocks.append(blk)
        if not blocks:
            continue
        W = max(b.width for b in blocks)
        sheet = Image.new('RGB', (W, sum(b.height + 8 for b in blocks) + 40), (200, 200, 205))
        ImageDraw.Draw(sheet).text((12, 8), f'{gid}: pose round 2 candidates (FFX-2 only). CANDIDATES, nothing installed.', fill=(10, 10, 10), font=f22)
        y = 40
        for b in blocks:
            sheet.paste(b, (0, y)); y += b.height + 8
        sheet.save(HERE / f'sheet-{gid}.jpg', quality=82)
        print('wrote', f'sheet-{gid}.jpg', sheet.size)


def results():
    """Round 2 RESULTS sheets: sheet2-<id>.jpg, one row per pose slot showing the
    installed idle beside the judged pick (or the looker's pick if no judge score
    yet), labelled slot / pick / judge score, or 'no pick' for a failed/stopped/
    not-yet-looked-at slot. Reads looks.json and judge2.json; nothing installed.
        python make-sheets2.py results [id,id,...]
    """
    work = json.loads((HERE / 'worklist.json').read_text(encoding='utf8'))['order']
    looks = json.loads((HERE / 'looks.json').read_text(encoding='utf8')) if (HERE / 'looks.json').exists() else {}
    judge2 = json.loads((HERE / 'judge2.json').read_text(encoding='utf8')) if (HERE / 'judge2.json').exists() else {'slots': {}}
    only = set(sys.argv[2].split(',')) if len(sys.argv) > 2 else None
    f13, f16, f22 = font(13), font(16), font(24)
    ids = [x for x in dict.fromkeys(i['id'] for i in work) if not only or x in only]
    for gid in ids:
        idle_p = ART / gid / 'idle.png'
        if not idle_p.exists():
            continue
        poses = [i['pose'] for i in work if i['id'] == gid]
        rows = []
        any_pick = False
        for pose in poses:
            key = f'{gid}/{pose}'
            look = looks.get(key, {})
            jslot = judge2.get('slots', {}).get(key)

            def look_pick(lk):
                if lk.get('pick'):
                    return lk['pick']
                for n, txt in lk.get('cands', {}).items():
                    if 'PICK' in txt:
                        return f'cand-{n}'
                return None

            pick_name = None
            score_txt = 'not looked at yet'
            residual = ''
            if jslot and jslot.get('candidate'):
                pick_name = pathlib.Path(jslot['candidate']).name
                score_txt = jslot.get('verdict', '')
                residual = jslot.get('why', '')
            else:
                p = look_pick(look)
                bp = look_pick(look.get('b', {})) if look.get('b') else None
                p = bp or p
                if p and str(look.get('verdict', '')).upper().startswith('PASS'):
                    pick_name = p + '.png'
                    score_txt = 'agent look only, not judged: ' + look.get('verdict', '')[:80]
                    residual = look.get('verdict', '')
                else:
                    score_txt = 'NO PICK: ' + (look.get('verdict', 'not looked at yet'))[:100]
            idle_t = flat(idle_p, SCALE)
            if pick_name:
                any_pick = True
                cand_dir = CAND / gid / pose
                cand_p = cand_dir / pick_name
                pick_t = flat(cand_p, SCALE) if cand_p.exists() else None
            else:
                pick_t = None
            rows.append((pose, idle_t, pick_t, score_txt, residual))
        if not rows:
            continue
        th = max(r[1].height for r in rows)
        width = max(1400, th * 2 + 40)
        row_h = th + 90
        sheet = Image.new('RGB', (width, 40 + row_h * len(rows)), (200, 200, 205))
        dr = ImageDraw.Draw(sheet)
        dr.text((12, 8), f'{gid}: round 2 RESULTS (agent looks + agent judge, NOT Bailey; nothing installed)', fill=(10, 10, 10), font=f22)
        y = 40
        for pose, idle_t, pick_t, score_txt, residual in rows:
            dr.rectangle([0, y, width, y + row_h], outline=(160, 160, 165))
            dr.text((12, y + 4), f'{gid}/{pose}', fill=(20, 20, 30), font=f16)
            sheet.paste(idle_t, (12, y + 26))
            dr.text((12, y + 26 + idle_t.height + 2), 'idle', fill=(60, 60, 60), font=f13)
            x2 = 12 + idle_t.width + 24
            if pick_t is not None:
                sheet.paste(pick_t, (x2, y + 26))
                dr.text((x2, y + 26 + pick_t.height + 2), 'pick', fill=(60, 60, 60), font=f13)
            else:
                dr.text((x2, y + 26 + idle_t.height // 2), 'NO PICK', fill=(170, 30, 30), font=f16)
            tx = x2 + max((pick_t.width if pick_t else 0), 120) + 24
            dr.text((tx, y + 8), score_txt[:110], fill=(20, 20, 30), font=f13)
            for k, ln in enumerate(wrap(residual, max(30, (width - tx) // 7))[:3]):
                dr.text((tx, y + 26 + 16 * k), ln, fill=(60, 60, 90), font=f13)
            y += row_h
        sheet.save(HERE / f'sheet2-{gid}.jpg', quality=82)
        print('wrote', f'sheet2-{gid}.jpg', sheet.size, 'any_pick=', any_pick)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'results':
        results()
    else:
        main()
