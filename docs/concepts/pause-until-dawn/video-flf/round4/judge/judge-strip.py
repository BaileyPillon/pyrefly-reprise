#!/usr/bin/env python
"""Build the round-4 judge strip (1:1 crops, labelled) from both arms.

Row 1: head box (420,20)-(760,400) at 1:1: plate | A f1 | A f41 | A f81 (=T) | B f1 | B f67 (=T) | B raw f77 | B raw f81
Row 2: chest / collar box (560,400)-(900,690) at 1:1, same columns
Row 3: evidence of motion: A |f81-f1| x8, A |f41-f1| x8 on the chest, the temporal-std maps (x12) of
       both arms' used frames (half size), and the encoded ping-pong's own loop cut (last frame /
       first frame of the next loop, face) with |diff| x8
Usage: python judge-strip.py <out.jpg> <decodedDirA>
"""
import sys, os
import numpy as np
from PIL import Image, ImageDraw

FLF = "D:/Tools/pyrefly-video/flf"
PLATE = "D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png"
HERE = os.path.dirname(os.path.abspath(__file__))
HEAD = (420, 20, 760, 400)
CHEST = (560, 400, 900, 690)


def ld(p):
    return Image.open(p).convert("RGB")


def cm(arm, f):
    return ld(f"{FLF}/round4-judge/arm-{arm}/frames-cm/frame_{f:05d}.png")


def raw(arm, f):
    return ld(f"{FLF}/ab-end-anchor-{arm}/7/frame_{f:05d}.png")


def diff(a, b, box, gain=8):
    x = np.abs(np.asarray(a.crop(box), np.float32) - np.asarray(b.crop(box), np.float32)).mean(-1)
    return Image.fromarray(np.clip(x * gain, 0, 255).astype(np.uint8)).convert("RGB")


def label(im, text):
    im = im.copy(); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, im.width, 16], fill=(0, 0, 0)); d.text((4, 2), text, fill=(255, 255, 255))
    return im


def row(items, gap=4):
    h = max(i.height for i in items); w = sum(i.width for i in items) + gap * (len(items) - 1)
    out = Image.new("RGB", (w, h), (40, 40, 40)); x = 0
    for i in items:
        out.paste(i, (x, 0)); x += i.width + gap
    return out


def main():
    out, dec_a = sys.argv[1], sys.argv[2]
    plate = ld(PLATE)
    cols = [("plate", plate), ("A cm f1", cm("a", 1)), ("A cm f41", cm("a", 41)), ("A cm f81=T", cm("a", 81)),
            ("B cm f1", cm("b", 1)), ("B cm f67=T", cm("b", 67)), ("B raw f77", raw("b", 77)), ("B raw f81", raw("b", 81))]
    r1 = row([label(im.crop(HEAD), t) for t, im in cols])
    r2 = row([label(im.crop(CHEST), t + " chest") for t, im in cols])
    sd_a = ld(os.path.join(HERE, "arm-a-judge-motion-std.png")); sd_b = ld(os.path.join(HERE, "arm-b-judge-motion-std.png"))
    sd_a = sd_a.resize((sd_a.width // 2, sd_a.height // 2)); sd_b = sd_b.resize((sd_b.width // 2, sd_b.height // 2))
    last = ld(os.path.join(dec_a, "f_00160.png")); first = ld(os.path.join(dec_a, "f_00161.png"))
    r3 = row([label(diff(cm("a", 81), cm("a", 1), CHEST), "A chest |f81-f1| x8"),
              label(diff(cm("a", 41), cm("a", 1), CHEST), "A chest |f41-f1| x8"),
              label(sd_a, "A temporal std x12 (half size)"), label(sd_b, "B f1-67 temporal std x12"),
              label(last.crop(HEAD), "A webm loop: last (f2)"), label(first.crop(HEAD), "A webm loop: next f1"),
              label(diff(first, last, HEAD), "A webm cut |diff| x8")])
    W = max(r.width for r in (r1, r2, r3)); H = r1.height + r2.height + r3.height + 8
    sheet = Image.new("RGB", (W, H), (40, 40, 40)); y = 0
    for r in (r1, r2, r3):
        sheet.paste(r, (0, y)); y += r.height + 4
    sheet.save(out, quality=88)
    print(out, sheet.size, os.path.getsize(out))


if __name__ == "__main__":
    main()
