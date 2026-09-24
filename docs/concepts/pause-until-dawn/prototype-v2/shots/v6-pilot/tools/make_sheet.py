"""Living portrait v6 pilot (both): sheet-2.jpg - the parts at 1:1, the part-2 fixes and the three clips' moments.

Part 1's sheet.jpg is at 9927c4b5; this one adds the never-still numbers (pilot_still.py), the brow fold
before and after, and the measurement boxes, and shows clips A2 / B2 / C2.

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
    st = json.loads((C.WORK / "pilot-still.json").read_text())
    ref = st["reference"]
    bf = st["browFolds"]
    worst = max(v["eyeBoxMAD"] for v in lg["lidsVsBaked"].values())
    lines = [
        "Living portrait v6 pilot - approach A on the plate (frontal), CPU only, one painting per pixel, nothing cross-faded",
        f"Lids: 8/8 baked frames matched, eye-box MAD <= {worst:.3f} levels. Ramp in visible openness: max step {lg['lidRampVisible']['maxOverMedian']}x the median.",
        f"      In the baked labels' own aperture {lg['lidRamp']['maxOverMedian']}x (lid-08 is still {int(round(100 * lg['visibleAtBaked']['0.08']))}% open). v5.1's nearest frame: jumps of {lg['lidRampV51Nearest']['max']:.1f} levels.",
        f"Gaze: +-16 x +-8 px, 0 escaped iris px over 9x5x4; revealed socket darker than sclera p5: v3 fill {lg['gazeGrid']['v3']['revealedDarkFrac']:.0%}, re-fill {lg['gazeGrid']['row']['revealedDarkFrac']:.0%}.",
        f"Mouth: smile (open + lattice) box MAD {mo['smile']['boxMAD_w1']} (plate {mo['smile']['boxMAD_neutral']}), det(J) {mo['smile']['detJ']}, step {mo['smile']['step']['maxOverMedian']}x median; "
        f"warp-only lattice {mo['literalWarpOnly']['smile']['boxMAD_w1']}. Press {mo['press']['boxMAD_w1']} (plate {mo['press']['boxMAD_neutral']}).",
        "Part 2, never still (the spec's method: head-tracked, against frame 0; spec-shaped boxes), mouth/nose | brow/mouth:",
        "   levels  " + "   ".join(f"{k}2 {st[k]['trackedSpec']['mouthOverNose']} | {st[k]['trackedSpec']['browOverMouth']}" for k in "ABC")
        + "   (Until Dawn, same code: " + ", ".join(f"{w} {v['tracked']['mouthOverNose']} | {v['tracked']['browOverMouth']}" for w, v in ref.items()) + ")",
        "   over contrast  " + "   ".join(f"{k}2 {st[k]['trackedSpec']['px']['mouthOverNose']} | {st[k]['trackedSpec']['px']['browOverMouth']}" for k in "ABC")
        + "   (Until Dawn: " + ", ".join(f"{w} {v['tracked']['px']['mouthOverNose']} | {v['tracked']['px']['browOverMouth']}" for w, v in ref.items()) + ")",
        f"Brow fold: raise + draw at 1 det(J) {bf['corners']['raise1_draw1']} (part 1: 0.386-2.184); whole 11x11 grid {bf['grid']}; raise lifts {bf['raiseMaxLiftPx']} px (part 1: 5.0)",
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
    # the brow fold, raise and draw both at 1, part 1's fields against part 2's, at 2x
    bb = (250, 290, 710, 400)
    tiles = []
    for sig, lab in ((0.0, "part 1: raise 1 + draw 1 (fold)"), (rig6.BROW_SMOOTH, "part 2: raise 1 + draw 1"), (rig6.BROW_SMOOTH, "part 2: raise 1")):
        keep = rig6.BROW_SMOOTH
        rig6.BROW_SMOOTH = sig
        Rb = rig6.Rig()
        rig6.BROW_SMOOTH = keep
        img = Rb.render({"browRaise": 1.0, "browDraw": 0.0 if lab.endswith("raise 1") else 1.0})
        tiles.append(label(C.up(C.to_u8(img[bb[1]:bb[3], bb[0]:bb[2], :3]), 2), lab))
    blocks.append(fit(row(tiles[:2])))
    blocks.append(fit(row(tiles[2:])))
    # the measurement boxes: part 1's (thin) and the spec-shaped ones (thick)
    import pilot_still as PS
    img = np.ascontiguousarray(C.to_u8(C.unpremul_on(R.render({})))[260:740, 220:740])
    for bx, th in (((PS.MOUTH, PS.NOSE, PS.BROW), 1), ((PS.SPEC["mouth"], PS.SPEC["nose"], PS.SPEC["brow"]), 2)):
        for b, col in zip(bx, ((255, 80, 80), (80, 255, 80), (80, 160, 255))):
            cv2.rectangle(img, (b[0] - 220, b[1] - 260), (b[2] - 220, b[3] - 260), col, th)
    blocks.append(fit(row([label(img, "boxes: part 1 (thin), spec-shaped (thick)")])))
    # the clips: 6 moments each, the face at 1:1
    face = (250, 300, 710, 700)
    names = {"A": "A2 measured", "B": "B2 livelier", "C": "C2 quiet"}
    for name in ("A", "B", "C"):
        tl = json.loads((C.WORK / f"log-{name}.json").read_text())
        tiles = []
        for t in (0.5, 1.2, 2.4, 3.9, 5.5, 7.2):
            fr = tl[int(t * drivers.FPS)]
            _, rgb = MC.page(R, fr)
            tiles.append(label(C.to_u8(rgb[face[1]:face[3], face[0]:face[2]]), f"{names[name]}  t={t:.1f}s"))
        blocks.append(fit(row(tiles)))
    C.save_jpg(np.concatenate(blocks, 0), C.OUTDIR / "sheet-2.jpg", q=86)


if __name__ == "__main__":
    main()
