# Chapter XIV (FFX only): Isaaru's Grothia / Pterya / Spathi, O-4 C "his side" (Bailey's pick, 2026-09-25),
# derived from the D-089 Ifrit / Valefor / Bahamut paintings' OWN pixels (method r3; no GPU, no repaint).
# The source paintings are READ, never written. The treatment is the options round's recipe
# (isaaru-options/derive.py his_side) at production settings:
#   - a colour grade toward his coat (saturation x0.8, multiply by (200,212,232), contrast x1.08);
#   - an inner sea-green rim along the silhouette (screen blend, 11 px erode band, 3 px blur);
#   - a soft sea-green glow behind the figure, alpha capped at 0.33 (under the engine's 0.35 alpha measure,
#     so it never moves the feet or the content box; the options round's glow reached 0.40);
#   - a 60 px transparent pad on every side (the idle sidecar's `scale` restores the source's pixels per world unit).
# Usage: python isaaru_aeons.py <outdir>
import sys, os
from PIL import Image, ImageFilter, ImageEnhance, ImageChops

K = 'D:/Final Fantasy/public/art/characters/'
SEA = (63, 214, 168)   # sea green, from Isaaru's coat trim (ours)
PAD = 60
CAP = 0.33

def his_side(src, out):
    im = Image.open(src).convert('RGBA'); a = im.getchannel('A'); rgb = im.convert('RGB')
    rgb = ImageEnhance.Color(rgb).enhance(0.8)
    rgb = ImageChops.multiply(rgb, Image.new('RGB', rgb.size, (200, 212, 232)))
    rgb = ImageEnhance.Contrast(rgb).enhance(1.08)
    edge = ImageChops.subtract(a, a.filter(ImageFilter.MinFilter(11))).filter(ImageFilter.GaussianBlur(3))
    rim = Image.new('RGB', rgb.size, SEA)
    rgb = Image.composite(ImageChops.screen(rgb, rim), rgb, edge.point(lambda v: min(255, int(v * 0.95))))
    o = rgb.convert('RGBA'); o.putalpha(a)
    W, H = o.width + 2 * PAD, o.height + 2 * PAD
    g = Image.new('L', (W, H), 0); g.paste(a, (PAD, PAD))
    g = g.filter(ImageFilter.GaussianBlur(22)).point(lambda v: min(int(255 * CAP), int(v * 0.4)))
    c = Image.new('RGBA', (W, H), SEA + (0,)); c.putalpha(g); c.alpha_composite(o, (PAD, PAD))
    c.save(out)
    return c.size

if __name__ == '__main__':
    od = sys.argv[1]; os.makedirs(od, exist_ok=True)
    for aeon, name in (('ifrit', 'grothia'), ('valefor', 'pterya'), ('bahamut', 'spathi')):
        for pose in ('idle', 'attack', 'overdrive'):
            print(name, pose, his_side(f'{K}{aeon}/{pose}.png', f'{od}/{name}-{pose}.png'))
