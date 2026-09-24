"""Living portrait v6 pilot (both): sheet.jpg - the parts at 1:1 and the three clips' moments.

    PY=D:/Tools/sd-scripts/.venv/Scripts/python.exe
    $PY make_sheet.py     # needs WORK/log-*.json (make_clips.py) and the pilot JSONs
"""
import json

import cv2
import numpy as np

import common as C
import drivers
import make_clips as MC
import rig6

WIDTH = 2400
FONT = cv2.FONT_HERSHEY_SIMPLEX


def label(img, text, scale=0.6, col=(255, 230, 120)):
    img = np.ascontiguousarray(img)
    cv2.rectangle(img, (0, 0), (min(img.shape[1], 12 + int(len(text) * 11 * scale / 0.6)), int(26 * scale / 0.6)), (0, 0, 0), -1)
    cv2.putText(img, text, (5, int(19 * scale / 0.6)), FONT, scale, col, 1, cv2.LINE_AA)
    return img


def row(tiles, gap=6):
    h = max(t.shape[0] for t in tiles)
    tiles = [np.pad(t, ((0, h - t.shape[0]), (0, gap), (0, 0))) for t in tiles]
    r = np.concatenate(tiles, 1)
    return r


def fit(r):
    if r.shape[1] > WIDTH:
        r = cv2.resize(r, (WIDTH, int(r.shape[0] * WIDTH / r.shape[1])), interpolation=cv2.INTER_AREA)
    return np.pad(r, ((0, 8), (0, WIDTH - r.shape[1]), (0, 0)))


def text_block(lines, h=None):
    h = h or 28 * len(lines) + 16
    img = np.zeros((h, WIDTH, 3), np.uint8)
    for i, ln in enumerate(lines):
        cv2.putText(img, ln, (12, 30 + 28 * i), FONT, 0.72, (235, 235, 235) if i else (255, 210, 90), 1, cv2.LINE_AA)
    return img


def main():
    R = rig6.Rig()
    lg = json.loads((C.WORK / "pilot-lids-gaze.json").read_text())
    mo = json.loads((C.WORK / "pilot-mouth.json").read_text())
    cl = json.loads((C.WORK / "pilot-clips.json").read_text())
    worst = max(v["eyeBoxMAD"] for v in lg["lidsVsBaked"].values())
    lines = [
        "Living portrait v6 pilot - approach A on the plate (frontal), CPU only, one painting per pixel, nothing cross-faded",
        f"Lids: 8/8 baked frames matched, eye-box MAD <= {worst:.3f} levels. Ramp in visible openness: max step {lg['lidRampVisible']['maxOverMedian']}x the median.",
        f"      In the baked labels' own aperture {lg['lidRamp']['maxOverMedian']}x (lid-08 is still {int(round(100 * lg['visibleAtBaked']['0.08']))}% open). v5.1's nearest frame: jumps of {lg['lidRampV51Nearest']['max']:.1f} levels.",
        f"Gaze: +-16 x +-8 px, 0 escaped iris px over 9x5x4; revealed socket darker than sclera p5: v3 fill {lg['gazeGrid']['v3']['revealedDarkFrac']:.0%}, re-fill {lg['gazeGrid']['row']['revealedDarkFrac']:.0%}.",
        f"Mouth: smile (open + lattice) box MAD {mo['smile']['boxMAD_w1']} (plate {mo['smile']['boxMAD_neutral']}), det(J) {mo['smile']['detJ']}, step {mo['smile']['step']['maxOverMedian']}x median; "
        f"warp-only lattice {mo['literalWarpOnly']['smile']['boxMAD_w1']}. Press {mo['press']['boxMAD_w1']} (plate {mo['press']['boxMAD_neutral']}).",
        "Clips (never still, mouth/nose frame change | brow/mouth): " + "   ".join(
            f"{k} {v['neverStill']['mouthOverNose']} | {v['neverStill']['browOverMouth']}" for k, v in cl.items()),
    ]
    blocks = [text_block(lines)]
    # lids at 1:1
    eye = (255, 350, 700, 470)
    tiles = []
    for v in (1.0, 0.97, 0.93, 0.85, 0.6, 0.35, 0.12, 0.0):
        a = R.vis_to_port(v)
        img = R.render({"lidR": a, "lidL": a})
        tiles.append(label(C.to_u8(img[eye[1]:eye[3], eye[0]:eye[2], :3]), f"lids open {v:.2f}"))
    blocks.append(fit(row(tiles[:4])))
    blocks.append(fit(row(tiles[4:])))
    # gaze at 1:1 (row re-fill), one v3-fill extreme for comparison
    tiles = []
    for gx, gy in ((-16, 0), (16, 0), (0, -8), (0, 8)):
        img = R.render({"gazeX": gx, "gazeY": gy, "droop": 0.8 * max(0, gy)})
        tiles.append(label(C.to_u8(img[eye[1]:eye[3], eye[0]:eye[2], :3]), f"gaze {gx:+d},{gy:+d}"))
    R.socket = "v3"
    img = R.render({"gazeX": 16, "gazeY": 0})
    tiles.append(label(C.to_u8(img[eye[1]:eye[3], eye[0]:eye[2], :3]), "gaze +16,0 on the v3 fill (smear)"))
    R.socket = "row"
    blocks.append(fit(row(tiles[:3])))
    blocks.append(fit(row(tiles[3:])))
    # mouth at 2x
    mb = (400, 592, 590, 672)
    tiles = []
    for w in (0.0, 0.3, 0.6, 1.0):
        img = R.render({"open": w, "smile": w})
        tiles.append(label(C.up(C.to_u8(img[mb[1]:mb[3], mb[0]:mb[2], :3]), 2), f"smile {w:.1f}"))
    P = C.rig()["artMeta"]["v3"]["patches"]["mouth"]
    tgt = C.over(R.top, C.over(C.placed(C.load_rgba(P["smile"]["file"]), P["smile"]["box"]), C.over(R.iris, C.over(R.hc, R.below))))
    tiles.append(label(C.up(C.to_u8(tgt[mb[1]:mb[3], mb[0]:mb[2], :3]), 2), "painted smile (target)"))
    blocks.append(fit(row(tiles)))
    # the clips: 6 moments each, the face at 1:1
    face = (250, 300, 710, 700)
    names = {"A": "A measured", "B": "B livelier", "C": "C quiet"}
    for name in ("A", "B", "C"):
        tl = json.loads((C.WORK / f"log-{name}.json").read_text())
        tiles = []
        for t in (0.5, 1.2, 2.4, 3.9, 5.5, 7.2):
            fr = tl[int(t * drivers.FPS)]
            _, rgb = MC.page(R, fr)
            tiles.append(label(C.to_u8(rgb[face[1]:face[3], face[0]:face[2]]), f"{names[name]}  t={t:.1f}s"))
        blocks.append(fit(row(tiles)))
    C.save_jpg(np.concatenate(blocks, 0), C.OUTDIR / "sheet.jpg", q=86)


if __name__ == "__main__":
    main()
