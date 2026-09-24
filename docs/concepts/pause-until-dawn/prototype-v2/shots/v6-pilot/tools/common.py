"""Living portrait v6 pilot (both): shared paths and small image helpers.

Everything here reads the v5.1 scratch prototype's art (never the committed prototype,
never public/art) and writes only under the scratch work folder.
"""
import json
import os
import pathlib

import cv2
import numpy as np
from PIL import Image

W, H = 832, 1216
PROTO_ART = pathlib.Path("D:/Tools/pyrefly-lora/yuna-x2/rig-v51/proto/art")
WORK = pathlib.Path(os.environ.get("LP6_WORK", "D:/Tools/pyrefly-scratch/lp-v6/work"))
HERE = pathlib.Path(__file__).resolve().parent
OUTDIR = HERE.parent  # shots/v6-pilot


def rig():
    return json.loads((PROTO_ART / "rig.json").read_text(encoding="utf-8"))


def load_rgba(rel):
    """Straight RGBA in 0..1 from the proto art folder."""
    return np.asarray(Image.open(PROTO_ART / rel).convert("RGBA")).astype(np.float32) / 255.0


def premul(im):
    out = im.copy()
    out[..., :3] *= out[..., 3:4]
    return out


def placed(im, box):
    """A layer (straight RGBA) placed on the full canvas, premultiplied."""
    c = np.zeros((H, W, 4), np.float32)
    x, y = int(box[0]), int(box[1])
    h, w = im.shape[:2]
    xa, xb, ya, yb = max(0, x), min(W, x + w), max(0, y), min(H, y + h)
    c[ya:yb, xa:xb] = premul(im[ya - y:yb - y, xa - x:xb - x])
    return c


def over(top, bottom):
    """Premultiplied source-over."""
    return top + bottom * (1.0 - top[..., 3:4])


def remap(img, mx, my):
    """Bilinear sampling at (mx, my) (float32 maps), transparent outside: the fragment shader's texture()."""
    return cv2.remap(img, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_LINEAR,
                     borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def lum(rgb):
    return rgb[..., 0] * 0.299 + rgb[..., 1] * 0.587 + rgb[..., 2] * 0.114


def to_u8(rgb):
    return np.clip(rgb * 255.0 + 0.5, 0, 255).astype(np.uint8)


def unpremul_on(img, bg=(8 / 255, 8 / 255, 8 / 255)):
    """A premultiplied canvas flattened on the page background."""
    return img[..., :3] + np.asarray(bg, np.float32) * (1.0 - img[..., 3:4])


def save_jpg(rgb_u8, path, q=90):
    Image.fromarray(rgb_u8).save(path, quality=q)


def up(img_u8, s):
    return cv2.resize(img_u8, None, fx=s, fy=s, interpolation=cv2.INTER_NEAREST)
