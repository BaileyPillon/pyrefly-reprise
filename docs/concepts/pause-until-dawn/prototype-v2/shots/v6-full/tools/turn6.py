"""Living portrait v6 full (both): feel A2 through the whole turn, and the per-frame faces for the runtime.

Feel A2 (Bailey, 2026-09-25: "keep the eye lead and the smile, no worried brow") is the pilot's preset A, part 2
(drivers.py: band noise on smooth floors, swells 400 ms in and 2.8 s out, the 0.058-a-frame rate limit, the lid
tone, blinks 50 / 33 / 66 ms). What the turn adds, and the one change A2 asks for:

  gaze    the eyes lead the input on their 0.05 s spring; the head is the RUNTIME's yaw (its 0.14 s spring and its
          idle wander, read from pass 1). Eye-in-head x = C_LEAD (eye - head) + C_HOLD head + drift: the lead
          while the head catches up, the eyes held a little into the turn (v4's iris travel, 11 px at 85 deg), and
          the wander compensated (the eyes stay on target while the head drifts). y = C_Y x the eyes' pitch target
          (the runtime has no pitch geometry, so the eyes carry all of it). Clamped to +-16 x +-8 px (the pilot's
          window test)
  brows   no worried brow: browDraw is never driven (the pilot's idle draw channel is off and no event draws);
          browRaise keeps its idle band and its events, so raise and draw are never on together
  events  the clip's script (EVENTS): smiles, brow lifts, blinks (one with the big gaze shift), a half lid

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY turn6.py clip|half        # needs CAP/log-<script>.json (shots6.mjs --phase log); writes CAP/faces-<script>/
    $PY turn6.py sweep|sweep-rest # frozen weights on all nine keys -> CAP/faces-<tag>/
"""
import json
import os
import pathlib
import sys
from concurrent.futures import ProcessPoolExecutor

import cv2
import numpy as np
from PIL import Image

import face6 as F
import common as C
import drivers as D

CAP = pathlib.Path(os.environ.get("LP6_CAP", "D:/Tools/pyrefly-scratch/picks0925/portrait-a2/cap"))
C_LEAD, C_HOLD, C_Y = 1.0, 11.0 / 85.0, 0.6   # px per degree (see the docstring)
PITCH_PER_Y = 24.0                           # state.ts: pitch target = y x maxYaw (40) x 0.6
EVENTS = {
    "clip": {"events": [(0.5, "smile", 0.6), (5.0, "brow", 0.55), (9.3, "smile", 0.75), (11.7, "brow", 0.4), (12.4, "smile", 0.6)],
             "blinks": [(1.2, 1.0), (4.6, 1.0), (7.9, 1.0), (10.93, 1.0), (13.2, 1.0)], "lidEvents": [(14.1, 0.4, 0.25)]},
    # v5.1's compare turn: a blink at each end (shots.mjs `half`), nothing else scripted
    "half": {"events": [], "blinks": [(3.35, 1.0), (7.45, 1.0)], "lidEvents": []},
}
SWEEP = {"gazeX": 6.0, "gazeY": 2.0, "lid": 0.55, "open": 0.6, "smile": 0.7, "press": 0.3, "browRaise": 0.5, "browDraw": 0.0}


def timeline(log, script, seed=7):
    cfg = dict(D.PRESETS["A"])
    cfg.update(EVENTS[script])
    fps = log["fps"]
    names = ("gx", "gy", "open", "smile", "press", "raise", "draw", "lid", "hx", "hy", "roll", "breath")
    N = {k: D.BandNoise(seed * 31 + i) for i, k in enumerate(names)}
    eye = None
    last = None
    out = []
    for fr in log["frames"]:
        t = fr["i"] / fps
        target = np.array([fr["gx"] * 40.0, fr["gy"] * PITCH_PER_Y])
        eye = target.copy() if eye is None else D.spring(eye, target, D.EYE_TAU, 1.0 / fps)
        w = {"open": 0.0, "smile": 0.0, "press": 0.0, "browRaise": 0.0, "browDraw": 0.0, "squint": 0.0}
        for t0, kind, amp in cfg["events"]:
            e = D.swell(t, t0, amp * cfg["eventScale"], cfg["onset"], cfg["release"])
            for p, s in D.BUNDLES[kind].items():
                w[p] += e * s
        k = cfg["noise"]
        for p, nk in (("open", "open"), ("smile", "smile"), ("press", "press"), ("browRaise", "raise")):
            b, a, e = D.IDLE[p]
            kk = np.sqrt(k) if p in ("open", "smile", "press") else k
            n_ = N[nk](t) if p != "open" else (N["open"](t) + N["breath"](t)) / np.sqrt(2)
            w[p] = D.soft_clip(w[p] + D.soft_pos(b + a * kk * n_, e), D.LIMITS[p])
        w["browDraw"] = 0.0  # A2: no worried brow (never raise and draw together; nothing draws at all)
        if last is not None:
            for p in D.LIMITS:
                w[p] = last[p] + float(np.clip(w[p] - last[p], -D.MAX_STEP, D.MAX_STEP))
        last = dict(w)
        dx, dy = cfg["drift"]
        head = fr["yaw"]
        gx = C_LEAD * (eye[0] - head) + C_HOLD * head + dx * N["gx"](t) / 1.48
        gy = C_Y * eye[1] + dy * N["gy"](t) / 1.48
        gx, gy = float(np.clip(gx, -16, 16)), float(np.clip(gy, -8, 8))
        b, a, e = D.IDLE["lid"]
        v = 1.0 - D.soft_pos(b + a * np.sqrt(k) * N["lid"](t), e) - w.pop("squint")
        for t0, depth in cfg["blinks"]:
            v -= D.blink(t, t0, depth)
        for t0, depth, dur in cfg["lidEvents"]:
            v -= D.lid_event(t, t0, depth, dur)
        out.append({"i": fr["i"], "t": t, "key": fr["paint"]["to"], "yaw": head, "gazeX": gx, "gazeY": gy, "lid": float(np.clip(v, 0, 1)),
                    "droop": 0.8 * max(0.0, gy), **{p: float(w[p]) for p in ("open", "smile", "press", "browRaise", "browDraw")}})
    return out


def params(R, fr):
    port = R.vis_to_port(fr["lid"])
    return {"gazeX": fr["gazeX"], "gazeY": fr["gazeY"], "lidR": port, "lidL": port, "droop": fr["droop"], "open": fr["open"],
            "smile": fr["smile"], "press": fr["press"], "browRaise": fr["browRaise"], "browDraw": fr["browDraw"]}


class Faces:
    """Every key's sampler, plus the faceOver sub-rect a key needs re-sent when the face reaches under it."""

    def __init__(self):
        self.R = F.FrontRig()
        M = np.load(C.WORK / "support.npy")
        self.kf = {k: F.KeyFace(k, M) for k in F.KEY_IDS}
        self.fo = {}
        rest_front = self.R.render({})
        for k, e in C.rig()["artMeta"]["v4"]["tassel"]["faceOver"].items():
            im = np.asarray(Image.open(C.PROTO_ART / e["file"]).convert("RGBA")).astype(np.float32) / 255.0
            x, y = e["box"][:2]
            kb = self.kf[k].box
            x0, y0 = max(x, kb[0]), max(y, kb[1])
            x1, y1 = min(x + im.shape[1], kb[2]), min(y + im.shape[0], kb[3])
            if x1 > x0 and y1 > y0:
                # the faceOver carries body pixels too (the jaw beside the tassel, outside the front): only where the
                # face mask reaches does its colour come from the new face
                # face mask reaches does its colour come from the new face, and only where the faceOver was the key's
                # own front at rest (under the tassel it was repainted: the plate's jaw stroke there must stay hidden)
                sub = (slice(y0 - kb[1], y1 - kb[1]), slice(x0 - kb[0], x1 - kb[0]))
                fo = im[y0 - y:y1 - y, x0 - x:x1 - x]
                rest = self.kf[k].crop(rest_front)[sub]
                rest = rest[..., :3] / np.maximum(rest[..., 3:4], 1e-6)
                same = (np.abs(rest - fo[..., :3]).max(-1) < 4 / 255.0) & (fo[..., 3] > 0)
                same = cv2.erode(same.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)
                m = self.kf[k].m[sub] * cv2.GaussianBlur(same, (5, 5), 1.0)[..., None]
                self.fo[k] = ((x0, y0, x1, y1), fo, m)

    def write(self, k, p, dst):
        """The key's face crop (and its faceOver crop) at weights p -> PNGs; the uploads for shots6.mjs."""
        kf = self.kf[k]
        crop = kf.crop(self.R.render(p))
        u8 = F.KeyFace.straight_u8(crop)
        Image.fromarray(u8).save(dst.with_suffix(".png"), compress_level=1)
        ups = [{"key": k, "x": kf.box[0], "y": kf.box[1], "file": dst.with_suffix(".png").name}]
        if k in self.fo:
            (x0, y0, x1, y1), fo, m = self.fo[k]
            new = u8[y0 - kf.box[1]:y1 - kf.box[1], x0 - kf.box[0]:x1 - kf.box[0], :3].astype(np.float32) / 255.0
            rgb = fo[..., :3] * (1 - m) + new * m
            sub = np.clip(np.dstack([rgb, fo[..., 3:4]]) * 255 + 0.5, 0, 255).astype(np.uint8)
            Image.fromarray(sub).save(dst.with_suffix(".fo.png"), compress_level=1)
            ups.append({"key": k, "x": x0, "y": y0, "file": dst.with_suffix(".fo.png").name, "over": True})
        return ups


_FACES = None


def _init():
    global _FACES
    _FACES = Faces()


def _chunk(args):
    frames, out = args
    res = {}
    for fr in frames:
        res[fr["i"]] = _FACES.write(fr["key"], params(_FACES.R, fr), out / f"{fr['i']:05d}")
    return res


def url_of(script, up):
    return {**{k: v for k, v in up.items() if k != "file"}, "url": f"./art/v6/frames/{script}/{up['file']}"}


def build(script, workers=8):
    log = json.loads((CAP / f"log-{script}.json").read_text())
    tl = timeline(log, script)
    out = F.PROTO / "art" / "v6" / "frames" / script
    out.mkdir(parents=True, exist_ok=True)
    chunks = [(tl[i::workers], out) for i in range(workers)]
    ups = {}
    with ProcessPoolExecutor(workers, initializer=_init) as ex:
        for r in ex.map(_chunk, chunks):
            ups.update(r)
    d = CAP / f"faces-{script}"
    d.mkdir(parents=True, exist_ok=True)
    frames = [{"i": fr["i"], "key": fr["key"], "uploads": [url_of(script, u) for u in ups[fr["i"]]]} for fr in tl]
    (d / "faces.json").write_text(json.dumps({"script": script, "frames": frames}))
    (d / "weights.json").write_text(json.dumps(tl))
    print(script, len(frames), "frames ->", out)


def sweep(tag="sweep"):
    """Frozen weights on all nine keys: `sweep` (an expression held through the turn) or `sweep-rest` (all at rest)."""
    fc = Faces()
    out = F.PROTO / "art" / "v6" / "frames" / tag
    out.mkdir(parents=True, exist_ok=True)
    w = SWEEP if tag == "sweep" else {k: (1.0 if k == "lid" else 0.0) for k in SWEEP}
    fr = dict(w, droop=0.8 * max(0.0, w["gazeY"]))
    ups = []
    for k in F.KEY_IDS:
        ups += [url_of(tag, u) for u in fc.write(k, params(fc.R, fr), out / k)]
    d = CAP / f"faces-{tag}"
    d.mkdir(parents=True, exist_ok=True)
    (d / "faces.json").write_text(json.dumps({"weights": fr, "uploads": ups}))
    print("sweep", len(ups), "uploads")


if __name__ == "__main__":
    a = sys.argv[1]
    sweep(a) if a.startswith("sweep") else build(a)
