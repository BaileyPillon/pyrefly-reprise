"""Ormi round 2 (FFX-2 only, Chapter 6): head size per pose, in texture pixels and on screen.

  python measure.py heads <png> '<x,y>[;<x,y>...]' [<box x0,y0,x1,y1>] [<check.png>]    # one head, prints px and a check crop
  python measure.py table <ingame-label.json> <heads.json>                 # joins with ingame.mjs rects

Head size is the round-1 judge's measure (../judge.md "Set-level"): the skin area of the
bald head, face and ear, flood-filled from a seed on the scalp, square-rooted to a
length. Skin = hue 3 to 42 degrees, saturation 0.08 to 0.62, value above 0.38, or hue 12 to 32 with saturation up to 0.78 (so the shaded back of the skull counts), alpha
above 128, 4-connected from one or more seeds (the ear's ink line can cut the shaded back of the skull off, so it gets a seed of its own), clipped to an optional box (so a hand touching the head is not
counted). A check image with the filled region tinted is written beside the report so
the fill can be LOOKED at.

On screen: ingame.mjs records each state's projected silhouette rect, paired with an
idle rect a few frames before and after under the same camera (the battle camera moves
between rigs); screen pixels per texture pixel k = rect.h / content height, so the head
on screen is head px x k, compared with idle's head px x k_idle from the paired rects.
"""
import colorsys, json, math, sys
from collections import deque

from PIL import Image


def skin(p):
    r, g, b, a = p
    if a < 128:
        return False
    h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
    if v < 0.38:
        return False
    # lit skin; or the shaded, more saturated orange-brown of the back of the skull
    return (3 / 360 <= h <= 42 / 360 and 0.08 <= s <= 0.62) or (12 / 360 <= h <= 32 / 360 and s <= 0.78)


def head(png, seeds, box=None, check=None):
    im = Image.open(png).convert('RGBA')
    px = im.load()
    W, H = im.size
    x0, y0, x1, y1 = box or (0, 0, W, H)
    seen = set()
    for sx, sy in seeds:
        if not skin(px[sx, sy]):
            raise SystemExit(f'seed {(sx, sy)} is not skin: {px[sx, sy]}')
        seen.add((sx, sy))
        q = deque([(sx, sy)])
        while q:
            x, y = q.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if x0 <= nx < x1 and y0 <= ny < y1 and (nx, ny) not in seen and skin(px[nx, ny]):
                    seen.add((nx, ny))
                    q.append((nx, ny))
    if check:
        c = im.copy()
        cp = c.load()
        for x, y in seen:
            r, g, b, a = cp[x, y]
            cp[x, y] = (r // 2, min(255, g // 2 + 128), b // 2, 255)
        xs = [p[0] for p in seen]
        ys = [p[1] for p in seen]
        pad = 40
        c.crop((max(0, min(xs) - pad), max(0, min(ys) - pad), min(W, max(xs) + pad), min(H, max(ys) + pad))).save(check)
    return len(seen), math.sqrt(len(seen))


def table(ingame, heads):
    """Heads on screen, each state paired with idle under the same camera (ingame.mjs)."""
    g = json.load(open(ingame))
    hd = json.load(open(heads))
    ci = g['states']['idle']['meta']['content']
    idle_h = ci['y1'] - ci['y0']
    out = []
    for state, v in g['states'].items():
        c = v['meta']['content']
        rp = v.get('rectPaired', v['rect'])
        ib = v.get('idleBefore', g['states']['idle']['rect'])
        ia = v.get('idleAfter', ib)
        k = rp['h'] / (c['y1'] - c['y0'])            # screen px per texture px, this state
        ki = ((ib['h'] + ia['h']) / 2) / idle_h      # the same for idle, same camera
        head, head_i = hd[state]['px'] * k, hd['idle']['px'] * ki
        out.append({'state': state, 'figureScreenH': round(rp['h'], 1), 'idleScreenH': round((ib['h'] + ia['h']) / 2, 1),
                    'figureVsIdle': round(rp['h'] / ((ib['h'] + ia['h']) / 2), 3), 'cameraDrift': round(abs(ib['h'] - ia['h']) / ib['h'], 4),
                    'headTexPx': hd[state]['px'], 'scale': v['meta'].get('scale'), 'headScreenPx': round(head, 2), 'idleHeadScreenPx': round(head_i, 2),
                    'headVsIdle': round(head / head_i, 3)})
    print(json.dumps(out, indent=1))
    return out


if __name__ == '__main__':
    cmd = sys.argv[1]
    if cmd == 'heads':
        png = sys.argv[2]
        seed = [tuple(map(int, p.split(','))) for p in sys.argv[3].split(';')]
        box = tuple(map(int, sys.argv[4].split(','))) if len(sys.argv) > 4 else None
        check = sys.argv[5] if len(sys.argv) > 5 else None
        n, s = head(png, seed, box, check)
        print(json.dumps({'png': png, 'seed': seed, 'box': box, 'area': n, 'px': round(s, 1)}))
    elif cmd == 'table':
        table(sys.argv[2], sys.argv[3])
