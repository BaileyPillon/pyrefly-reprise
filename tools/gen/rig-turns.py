"""Living-portrait v3.1: the yaw keys re-slotted so a turn never reverses.

Found by the runtime pass (2026-09-22) at 1:1 on the key composites: the
painting wired as `q34-right` (+40) faces the viewer's LEFT (far green eye
compressed at the left silhouette, near blue eye large), the same way as
`q34-left` (-40, a mild turn) and `profile-left` (-85), while the mirrored
`profile-right` (+85) faces right. Holding ArrowRight turned her left, then
snapped her right. Eye colours, from the plate (her right eye green on the
viewer's left, her left eye blue): a head turned to the viewer's LEFT shows her
LEFT side, so a left profile's visible eye is BLUE and a right profile's is
GREEN. `profile-left` was painted green and `profile-right` was recoloured to
blue: both backwards.

Re-slotting (every source painting kept byte-identical; outputs under
art/v3/layers/turns/):

  turn-l85  mirror of the current profile-right  (= profile-left, blue eye)
  turn-l45  the q34-right painting as painted    (a real three-quarter left)
  turn-r45  mirror of the q34-right painting, both irises swapped
  turn-r85  mirror of the ORIGINAL profile-left  (green eye, as painted)

The mild q34-left painting (about 15 degrees) is left out of the rig: it would
put a second hair repaint within the idle sway's reach of the rest pose.

    python -s tools/gen/rig-turns.py mirror   # write the mirrored keys
    python -s tools/gen/rig-turns.py wire     # keys + landmarks into art/rig.json
"""
from __future__ import annotations

import importlib.util
import pathlib
import sys

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

AXIS = 495.0  # the pinned body's neck axis (rig-keys.py mirror uses the same)
OUT = L.V3 / "layers/turns"
LAYERS = L.V3 / "layers"

# v3.2: every turn is cut from the heads rig-heads.py finished (the backs of
# the heads painted past the sources' canvas border), not from the cut keys;
# `iris` recolours the visible profile iris WHOLE (the painting's own iris is
# half blue, half green: the check counted 610 blue and 651 green pixels in
# turn-r85's): "blue" / "green" = every iris pixel to the plate's colour.
HEADS = L.V3 / "layers/heads"
JOBS = {
    "turn-l85": {"from": "profile-left", "heads": True, "mirror": False, "swapIris": False, "iris": "blue"},
    # the painting's own collar shows as a pink/white fringe under its hair ends (x > 520, y > 720)
    "turn-l45": {"from": "q34-right", "heads": True, "mirror": False, "swapIris": False, "collar": [520, 720]},
    "turn-r45": {"from": "q34-right", "heads": True, "mirror": True, "swapIris": True, "collar": [520, 720]},
    "turn-r85": {"from": "profile-left", "heads": True, "mirror": True, "swapIris": False, "iris": "green"},
}
YAW = {"turn-l85": -85, "turn-l45": -45, "turn-r45": 45, "turn-r85": 85}
FADE_PX = 48  # a mirrored key's hair, cut by the source canvas's right border, fades out over this many px


def clean_collar(c, xmin, ymin):
    """Pink/white collar pixels of the key's own painting under its hair ends:
    made transparent, then the hair's new lower edge eased over 10 px."""
    rgb = c[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    zone = np.zeros(c.shape[:2], bool)
    zone[ymin:, xmin + 200:] = True
    collar = zone & (c[..., 3] > 0) & (((r > 190) & (b > 150) & (r - g > 15)) | ((r > 215) & (g > 205) & (b > 205)))
    collar = L.dilate(collar, 1) & zone
    c[collar, 3] = 0
    solid = c[..., 3] > 128
    d = ndi.distance_transform_edt(solid)
    ease = np.clip(d / 10.0, 0, 1)
    c[zone, 3] *= (ease * ease * (3 - 2 * ease))[zone]
    return int(collar.sum())


def fade_cut(c, left):
    """Alpha ramp from a straight cut at x = left (canvas px) inward."""
    xs = np.arange(c.shape[1]) - 200 - left
    ramp = np.clip(xs / FADE_PX, 0, 1)
    c[..., 3] *= (ramp * ramp * (3 - 2 * ramp))[None, :]


def rig():
    return L.read_json(L.ART / "rig.json")


def mirror_box(box):
    x, y, w, h = box
    return [int(round(2 * AXIS - x - w)), y, w, h]


def iris_masks(rgba_canvas):
    """Green and blue iris regions on a placed layer: the biggest saturated
    blob of each colour in the eye band, holes filled, grown 2 px."""
    rgb = rgba_canvas[..., :3]
    a = rgba_canvas[..., 3] > 32
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    band = np.zeros(a.shape, bool); band[300:540] = True
    green = a & band & (g > r + 25) & (g > b - 5) & (sat > 0.3)
    blue = a & band & (b > r + 50) & (b > g + 15) & (sat > 0.35)
    out = {}
    for name, m in (("green", green), ("blue", blue)):
        lab, n = ndi.label(ndi.binary_closing(m, iterations=2))
        if n == 0:
            raise SystemExit(f"no {name} iris found")
        sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
        blob = lab == (1 + int(np.argmax(sizes)))
        blob = ndi.binary_fill_holes(ndi.binary_closing(blob, iterations=4))
        out[name] = L.dilate(blob, 2)
    return out


def recolour(rgba, region, src_colour, ref_pixels):
    """Pixels of `src_colour` inside `region` take the reference iris's hue and
    chroma at their own lightness (lines, pupil, highlights keep theirs)."""
    rgb = rgba[..., :3]
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    if src_colour == "green":
        pick = (g > r + 12) & (g >= b - 25) & (sat > 0.18)
    else:
        pick = (b > r + 25) & (b > g + 5) & (sat > 0.2)
    pick &= region
    ref_mean = ref_pixels.mean(0)
    ref_l = L.luminance(ref_pixels[None])[0].mean()
    lum = L.luminance(rgb)[..., None]
    target = np.clip(ref_mean[None, None] * (lum / max(ref_l, 1e-3)), 0, 255)
    soft = ndi.gaussian_filter(pick.astype(np.float32), 0.7)[..., None] * region[..., None]
    rgba[..., :3] = rgb * (1 - soft) + target * soft
    return int(pick.sum())


def iris_whole(rgba_canvas):
    """The one visible iris of a profile, whatever its colours: the biggest
    saturated blue-or-green blob in the eye band, holes filled, grown 2 px."""
    rgb = rgba_canvas[..., :3]
    a = rgba_canvas[..., 3] > 32
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1)
    sat = (mx - mn) / np.maximum(mx, 1)
    band = np.zeros(a.shape, bool); band[300:540] = True
    m = a & band & (sat > 0.3) & (((g > r + 25) & (g > b - 5)) | ((b > r + 40) & (b > g + 5)))
    lab, n = ndi.label(ndi.binary_closing(m, iterations=3))
    if n == 0:
        raise SystemExit("no iris found")
    sizes = ndi.sum(np.ones_like(lab), lab, range(1, n + 1))
    blob = ndi.binary_fill_holes(ndi.binary_closing(lab == (1 + int(np.argmax(sizes))), iterations=4))
    return L.dilate(blob, 2)


# v3.2 hair: the keys' plain brown hair (Lab ab ~ 17-21, 17) moved to the
# plate's orange-brown (hairFront + hairBack mean ab 23.2, 25.8), chroma x1.25;
# lightness kept. Mask: the key's alpha minus the face (skin components
# holding the nose/cheek/lip/jaw landmarks), the eyes and vivid accessories.
PLATE_HAIR_AB = np.array([23.2, 25.8])
HAIR_CHROMA_GAIN = 1.25


def hair_mask(c, lm, order):
    from skimage import color
    rgb = c[..., :3] / 255.0
    a = c[..., 3] > 128
    hsv = color.rgb2hsv(rgb)
    h, s_, v = hsv[..., 0] * 360, hsv[..., 1], hsv[..., 2]
    skin = ndi.binary_opening((v > 0.62) & (s_ > 0.1) & (s_ < 0.6) & ((h < 45) | (h > 340)) & a, iterations=2)
    lab, _ = ndi.label(skin)
    keep = set()
    for name in ("noseTip", "philtrum", "cheek_R", "cheek_L", "lipLower", "jawMid_R", "jawMid_L"):
        x, y = lm[order.index(name)]
        for dx in range(-6, 7, 3):
            for dy in range(-6, 7, 3):
                xx, yy = int(x + dx) + 200, int(y + dy)
                if 0 <= yy < lab.shape[0] and 0 <= xx < lab.shape[1] and lab[yy, xx] > 0:
                    keep.add(lab[yy, xx])
    face = ndi.binary_fill_holes(ndi.binary_closing(np.isin(lab, list(keep)), iterations=5))
    yy, xx = np.mgrid[: a.shape[0], : a.shape[1]]
    eyes = np.zeros_like(a)
    for name in ("pupil_R", "pupil_L"):
        x, y = lm[order.index(name)]
        eyes |= ((xx - x - 200) / 55.0) ** 2 + ((yy - y) / 45.0) ** 2 < 1
    vivid = (s_ > 0.72) & (v > 0.35)
    return a & ~face & ~eyes & ~vivid


def hair_to_plate(c, lm, order):
    from skimage import color
    m = hair_mask(c, lm, order)
    if m.sum() < 1000:
        return 0
    ys, xs = np.nonzero(c[..., 3] > 0)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    sub = c[y0:y1, x0:x1]
    mm = m[y0:y1, x0:x1]
    lab = color.rgb2lab(np.clip(sub[..., :3] / 255.0, 0, 1))
    mu = lab[..., 1:][mm].mean(0)
    w = np.clip(ndi.gaussian_filter(mm.astype(np.float32), 1.2), 0, 1)[..., None]
    cool_b = lab[..., 2].copy()
    lab[..., 1:] = lab[..., 1:] * (1 - w) + ((lab[..., 1:] - mu) * HAIR_CHROMA_GAIN + PLATE_HAIR_AB) * w
    # v3.3: the keys' sky-blue/grey sheen (L > 55, b < 8: ab ~ -4.6, -0.8 on turn-l85's crown)
    # read as "camouflage blotches"; the plate's own hair highlights are warm (ab 10-14, 35-37 at
    # L 75-90; 0, 23 above 90), so a cool sheen takes the plate's highlight colour for its lightness
    Lc = lab[..., 0]
    tgt_a = np.interp(Lc, [55, 75, 90, 100], [24, 12, 1, 0])
    tgt_b = np.interp(Lc, [55, 75, 90, 100], [30, 36, 23, 18])
    wc = w[..., 0] * np.clip((8 - cool_b) / 10, 0, 1) * np.clip((Lc - 50) / 10, 0, 1)
    lab[..., 1] = lab[..., 1] * (1 - wc) + tgt_a * wc
    lab[..., 2] = lab[..., 2] * (1 - wc) + tgt_b * wc
    sub[..., :3] = np.clip(color.lab2rgb(lab), 0, 1) * 255
    return int(mm.sum())


def place(rgba, box):
    canvas = np.zeros((1216, 1400, 4), np.float32)  # wide enough for any mirrored box
    x, y = box[0] + 200, box[1]
    h, w = rgba.shape[:2]
    canvas[y:y + h, x:x + w] = rgba
    return canvas


def cmd_mirror():
    v3 = rig()["artMeta"]["v3"]
    plate = L.load_rgba(L.PLATE)[..., :3]
    own = np.load(L.V3 / "masks/owner.npy")
    Z = L.read_json(L.V3 / "masks/owners.json")["z"]
    green_ref = plate[own == Z.index("irisR")]
    blue_ref = plate[own == Z.index("irisL")]
    report = {}
    r0 = rig()
    order = r0["artMeta"]["commonLandmarkOrder"]
    old_lm = {k["id"]: k.get("landmarks") for k in r0["keys"]}
    for jid, job in JOBS.items():
        src = L.read_json(HEADS / job["from"] / "provenance.json")["layers"] if job.get("heads") else v3["keys"][job["from"]]
        rec = {"from": ("heads/" if job.get("heads") else "") + job["from"], "axis": AXIS, "layers": {}}
        for part in ("back", "front"):
            placed = src[part]
            raw = L.load_rgba(L.ART / placed["file"])
            img = raw[:, ::-1].copy() if job["mirror"] else raw.copy()
            fbox = [placed["box"][0], placed["box"][1], raw.shape[1], raw.shape[0]]  # the file's own size wins
            box = mirror_box(fbox) if job["mirror"] else fbox
            note = {}
            c = place(img, box)
            if "collar" in job:
                note["collarPxRemoved"] = clean_collar(c, *job["collar"]) if not job["mirror"] else clean_collar(c[:, ::-1][:, :], *job["collar"])
            if job["mirror"] and not job.get("heads") and placed["box"][0] + placed["box"][2] >= 832:
                fade_cut(c, box[0])
                note["fadedCutAtX"] = box[0]
            if job.get("iris") and part == "front":
                region = iris_whole(c)
                ref = blue_ref if job["iris"] == "blue" else green_ref
                n = recolour(c, region, "green", ref) + recolour(c, region, "blue", ref)
                note.update({"irisTo": job["iris"], "irisRecolouredPx": n})
            if old_lm.get(jid):
                note["hairRecolouredPx"] = hair_to_plate(c, old_lm[jid], order)
            if job["swapIris"] and part == "front":
                masks = iris_masks(c)
                # after the mirror the eye on the viewer's left is blue: her right eye must be green, and vice versa
                n1 = recolour(c, masks["blue"], "blue", green_ref)
                n2 = recolour(c, masks["green"], "green", blue_ref)
                note.update({"blueToGreenPx": n1, "greenToBluePx": n2})
                chk = c[300:520, 200 + 180:200 + 700]
                before = place(raw[:, ::-1].copy(), box)[300:520, 200 + 180:200 + 700]
                both = np.concatenate([L.on_magenta(before), L.on_magenta(chk)], 1)
                Image.fromarray(np.clip(both, 0, 255).astype(np.uint8)).resize((both.shape[1] * 2, both.shape[0] * 2), Image.NEAREST).save(L.V3 / f"overlays/{jid}-iris-check.png")
            img = c[box[1]:box[1] + img.shape[0], box[0] + 200:box[0] + 200 + img.shape[1]]
            dst = OUT / jid / f"{part}.png"
            dst.parent.mkdir(parents=True, exist_ok=True)
            L.save_rgba(img, dst)
            rec["layers"][part] = {"file": L.rel(dst).split("prototype-v2/art/")[1], "box": box, **note}
        L.write_json(rec, OUT / jid / "provenance.json")
        report[jid] = rec
        print(jid, {k: v["box"] for k, v in rec["layers"].items()})
    # register the keys: frontal plus the four turns, by yaw
    r = rig()
    v3 = r["artMeta"]["v3"]
    for jid, rec in report.items():
        v3["keys"][jid] = {k: {"file": v["file"], "box": v["box"]} for k, v in rec["layers"].items()}
    old = {k["id"]: k for k in r["keys"]}
    r["keys"] = [old["frontal"]] + [
        {"id": jid, "yawDeg": YAW[jid], "file": v3["keys"][jid]["front"]["file"], **({"landmarks": old[jid]["landmarks"]} if jid in old and "landmarks" in old[jid] else {})}
        for jid in ("turn-l45", "turn-r45", "turn-l85", "turn-r85")]
    L.write_json(r, L.ART / "rig.json")
    return report


# ---- wire: landmarks + keys into art/rig.json -------------------------------

def head_alpha(r, key_id):
    v3 = r["artMeta"]["v3"]
    a = np.zeros((1216 + 128, 1400), np.float32)  # rows offset 64: rig-margins.py layers start at y -48
    if key_id == "frontal":
        parts = [l for l in v3["frontal"]["layers"] if l["name"] in ("hairBack", "headCore", "hairFront")]
    else:
        parts = [v3["keys"][key_id]["back"], v3["keys"][key_id]["front"]]
    for p in parts:
        im = L.load_rgba(L.ART / p["file"])[..., 3]
        x, y = p["box"][0] + 200, p["box"][1] + 64
        h, w = im.shape
        xa, xb = max(0, x), min(a.shape[1], x + w)
        a[y:y + h, xa:xb] = np.maximum(a[y:y + h, xa:xb], im[:, xa - x:xb - x])
    return a[64:64 + 1216]


def silhouette_pair(r, key_id, row):
    a = head_alpha(r, key_id)[row - 3:row + 4] > 128
    a[:, :200] = False  # the silhouette inside the canvas only: a reflected margin (rig-margins.py) is not the painting's edge
    a[:, 200 + 832:] = False
    cols = np.where(a.any(0))[0]
    return [int(cols.min()) - 200, row], [int(cols.max()) - 200, row]


def cmd_wire():
    spec = L.read_json(L.V3 / "warp/landmarks.json")
    order = spec["order"]
    swap = {i: order.index(n.replace("_R", "_X").replace("_L", "_R").replace("_X", "_L")) for i, n in enumerate(order)}
    r = rig()
    row = spec["silhouetteRow"]
    lms = {}
    for kid, pts in spec["keys"].items():
        lr, ll = silhouette_pair(r, kid, row)
        lms[kid] = [list(p) for p in pts] + [lr, ll]
    ax = spec["axis"]
    for mid, src in spec["mirrors"].items():
        s = lms[src]
        lms[mid] = [[2 * ax - s[swap[i]][0], s[swap[i]][1]] for i in range(len(order))]
        # silhouettes are re-measured on the mirrored art (the outpainted back of head is not symmetric)
        lr, ll = silhouette_pair(r, mid, row)
        lms[mid][order.index("hairSide_R")] = lr
        lms[mid][order.index("hairSide_L")] = ll
    for kid, (lr, ll) in {k: v for k, v in spec.get("hairSideFixed", {}).items() if not k.startswith("_")}.items():
        if kid in lms:
            lms[kid][order.index("hairSide_R")] = list(lr)
            lms[kid][order.index("hairSide_L")] = list(ll)
    for k in r["keys"]:
        k["landmarks"] = lms[k["id"]]
    r["artMeta"]["commonLandmarkOrder"] = order
    r["artMeta"]["v3"]["warp"] = {"frame": spec["frame"], "pins": spec["pins"], "source": "v3/warp/landmarks.json",
                                 "_readme": "src/warp.ts: frame + pins are fixed points shared by every key; with the key landmarks they are Delaunay-triangulated per bracket (on the pair's midpoint set) and both keys are warped to the interpolated landmarks."}
    r["artMeta"]["v3"]["retiredKeys"] = {
        "_readme": "rig-turns.py: out of keys[] since v3.1. q34-right's painting faces LEFT (it is turn-l45 now); q34-left barely turns (about 15 degrees) and would put a second hair repaint inside the idle sway; profile-left/right had their visible iris colours backwards (turn-l85 / turn-r85 replace them).",
        "ids": ["q34-left", "q34-right", "profile-left", "profile-right"]}
    L.write_json(r, L.ART / "rig.json")
    for k in r["keys"]:
        print(k["id"], k["yawDeg"], k["landmarks"][-2:])


if __name__ == "__main__":
    cmds = {"mirror": cmd_mirror, "wire": cmd_wire}
    if len(sys.argv) < 2 or sys.argv[1] not in cmds:
        raise SystemExit(__doc__)
    cmds[sys.argv[1]]()
