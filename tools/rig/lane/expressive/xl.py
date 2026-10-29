"""Scratch library of the expressive-keys lane (rig-expressive-2, 2026-10-19): the painting -> idle-master mapping (as rig_vcut does it, incl. the resize of a slightly rescaled pose), a posed rig model, renders, overlays.
Env: XID = the art id (ifrit), XWORK = the work folder name under D:/pyrefly-art-rigs-work (ifrit-x), XART = art dir (D:/pyrefly-art-r59).
Everything here reads; it writes only into the paths it is given."""
from __future__ import annotations

import json
import os
import pathlib
import sys

_HERE = pathlib.Path(__file__).resolve().parent  # tools/rig/lane/expressive: the kit beside this file, whatever tree it is in
sys.path.insert(0, str(_HERE.parents[1]))
sys.path.insert(0, str(_HERE.parent))
import numpy as np
from PIL import Image, ImageDraw

from rig_common import read_json
from rig_skin import RigModel
from rig_v2 import state_of
import rig_vcut

XID = os.environ.get('XID', 'ifrit')
XWORK = os.environ.get('XWORK', 'ifrit-x')
ART = pathlib.Path(os.environ.get('XART', 'D:/pyrefly-art-r59')) / 'characters' / XID
WORKDIR = pathlib.Path('D:/pyrefly-art-rigs-work') / XWORK
BG = (110, 124, 148)
S = 2


def targets():
    return read_json(WORKDIR / 'targets' / 'targets.json')


def maps(T, pose):
    """(ax, bx, ay, by): idle-frame master px = a * (pose painting @2x px) + b."""
    return rig_vcut.painting_map(T, pose, S)


def paint_rgba(pose):
    return Image.open(ART / f'{pose}@{S}x.png').convert('RGBA')


def painting_in_master(pose, pad=0, size=None):
    """The pose's painting drawn into the idle's master frame (+ pad margin all round), RGBA PIL. The frame size defaults to the rig's image."""
    T = targets()
    ax, bx, ay, by = maps(T, pose)
    img = paint_rgba(pose)
    if size is None:
        size = rig_size()
    inv = (1 / ax, 0, -(bx + pad) / ax, 0, 1 / ay, -(by + pad) / ay)
    return img.transform((size[0] + 2 * pad, size[1] + 2 * pad), Image.AFFINE, inv, Image.BICUBIC)


_RIGSIZE = None


def rig_size():
    global _RIGSIZE
    if _RIGSIZE is None:
        b = WORKDIR / 'build' / 'build.json'
        if b.exists():
            j = read_json(b)
            _RIGSIZE = (j['image']['w'], j['image']['h'])
        else:
            im = Image.open(ART / f'idle@{S}x.png')
            _RIGSIZE = im.size
    return _RIGSIZE


def load_model(rigdir):
    rigdir = pathlib.Path(rigdir)
    rig = read_json(rigdir / 'rig.json')
    T = targets()
    model = RigModel({**rig, 'parts': rig['parts']}, rigdir, grid_affine=T['gridFromMaster'], grid=T['grid'])
    return rig, T, model


def pose_key(model, rig, key):
    bones = key.get('bones', {})
    rot = {n: t.get('rot', 0.0) for n, t in bones.items()}
    off = {n: (t['dx'], t['dy']) for n, t in bones.items() if 'dx' in t or 'dy' in t}
    scl = {n: (t.get('sx', 1.0), t.get('sy', t.get('sx', 1.0))) for n, t in bones.items() if 'sx' in t or 'sy' in t}
    r = key.get('root', {})
    model.set_state(state_of(rig['parts'], key.get('parts')))
    model.pose(rot=rot, root=(r.get('dx', 0.0), r.get('dy', 0.0), r.get('rot', 0.0)), off=off, scl=scl)
    return model


def render_pose(model, W, H, pad=0):
    model.P[:, 0] += pad
    model.P[:, 1] += pad
    try:
        arr = model.render_rgba(W + 2 * pad, H + 2 * pad, scale_down=1.0)
    finally:
        model.P[:, 0] -= pad
        model.P[:, 1] -= pad
    return Image.fromarray(arr, 'RGBA')


def over(bg_rgb, rgba):
    b = Image.new('RGBA', rgba.size, bg_rgb + (255,))
    b.alpha_composite(rgba)
    return b.convert('RGB')


def grid(im, x0, y0, zoom, step=50):
    d = ImageDraw.Draw(im)
    w, h = im.size
    for gx in range((x0 // step + 1) * step, int(x0 + w / zoom), step):
        X = (gx - x0) * zoom
        big = gx % (step * 2) == 0
        d.line((X, 0, X, h), fill=(255, 255, 0) if big else (120, 120, 60), width=1)
        if big:
            d.text((X + 2, 2), str(gx), fill=(255, 255, 0))
    for gy in range((y0 // step + 1) * step, int(y0 + h / zoom), step):
        Y = (gy - y0) * zoom
        big = gy % (step * 2) == 0
        d.line((0, Y, w, Y), fill=(255, 255, 0) if big else (120, 120, 60), width=1)
        if big:
            d.text((2, Y + 2), str(gy), fill=(255, 255, 0))
    return im
