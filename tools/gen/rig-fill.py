"""Hidden-region planning and merging for the living-portrait v3 frontal rig.

Every layer that moves relative to another can uncover what lies under it.
`plan` measures that region per layer pair from the runtime's own
displacement envelope (art/v3/range-sym.json, written by
tools/gen/rig-range.mjs from the prototype's state machine), decides which
lower layer must be complete there, pre-fills it (pyramid push-pull from
that layer's own visible pixels, so the diffusion refine starts from the
right colours), and writes one full-canvas source + mask per inpaint job:

  backdrop  body under the jaw (the neck column, which every yaw key's head
            also needs), hairBack under the body's moving outline, hairBack /
            body under the earring, hairBack under the loose strands
  face      forehead, brows, lashes and lids under the fringe's lower edge
            (the fringe lifts with a raised brow)

`merge` takes the picked inpaint result of each job, keeps only the masked
pixels, removes the diffusion pass's low-frequency tone drift against the
plate (measured in a ring just outside the mask and pulled into it), and
writes one RGBA fill per layer (art/v3/fills/<layer>.png). Sclera under the
iris and the iris's own hidden rim are filled geometrically in
rig-assemble.py (no diffusion needed for a flat sclera).

    python -s tools/gen/rig-fill.py plan
    node tools/gen/inpaint.mjs --latent --image art/v3/jobs/backdrop.src.png --mask art/v3/jobs/backdrop.mask.png ...
    python -s tools/gen/rig-fill.py merge --job backdrop --pick art/v3/jobs/out/backdrop.2.full.png
"""
from __future__ import annotations

import argparse
import importlib.util
import pathlib

import numpy as np
from PIL import Image
from scipy import ndimage as ndi

_spec = importlib.util.spec_from_file_location("riglib", pathlib.Path(__file__).with_name("rig-lib.py"))
L = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(L)

MASKS = L.V3 / "masks"
JOBS = L.V3 / "jobs"
FILLS = L.V3 / "fills"
GREY = 118.0


def envelope(name, rng, fringe_lift):
    e = rng["envelopePx"]
    zero = {"dxMin": 0, "dxMax": 0, "dyMin": 0, "dyMax": 0}
    if name == "body":
        return e["chest"]
    if name in ("strand1", "strand2", "earring"):
        return e[name]
    if name.startswith("iris"):
        return e["iris"]
    if name == "hairFront":
        return {"dxMin": 0, "dxMax": 0, "dyMin": -fringe_lift, "dyMax": 0}
    return zero


def relative(u, l):
    return {"dxMin": u["dxMin"] - l["dxMax"], "dxMax": u["dxMax"] - l["dxMin"],
            "dyMin": u["dyMin"] - l["dyMax"], "dyMax": u["dyMax"] - l["dyMin"]}


def nearest_label(own, targets, region):
    """For every pixel in region: the nearest pixel (Euclidean) whose owner is in targets."""
    src = np.isin(own, targets)
    _, (iy, ix) = ndi.distance_transform_edt(~src, return_indices=True)
    out = np.full(own.shape, -1, np.int64)
    out[region] = own[iy[region], ix[region]]
    return out


def neck_extension(rgb, body_neck, depth):
    h, w = body_neck.shape
    out = np.zeros_like(rgb)
    have = np.zeros(w, bool)
    for x in range(w):
        ys = np.nonzero(body_neck[:, x])[0]
        if ys.size:
            y = min(ys[0] + depth, ys[-1])
            out[:, x] = rgb[y - 2:y + 3, x].mean(0)
            have[x] = True
    if have.any():
        xs = np.arange(w)
        for c in range(3):
            row = np.interp(xs, xs[have], out[0, have, c])
            out[:, :, c] = ndi.gaussian_filter1d(row, 3)[None, :]
    return out


def row_clone(rgb, region, source_ok, pad=4, fade=8):
    """Fill each row's run of `region` with the hair texture beside it: a copy
    of the pixels one run-width to the left, cross-fading into the copy from
    the right over the last `fade` px (strands run vertically, so a
    horizontal clone keeps real strand texture; the diffusion pass then only
    has to heal the seams)."""
    out = rgb.copy()
    h, w = region.shape
    for y in range(h):
        xs = np.nonzero(region[y])[0]
        if not xs.size:
            continue
        runs = np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1)
        for r in runs:
            a, b = r[0], r[-1]
            d = b - a + 1 + pad
            for x in r:
                lx, rx = x - d, x + d
                left = rgb[y, lx] if lx >= 0 and source_ok[y, lx] else None
                right = rgb[y, rx] if rx < w and source_ok[y, rx] else None
                t = np.clip((x - (b - fade)) / max(1, fade), 0, 1)
                if left is not None and right is not None:
                    out[y, x] = left * (1 - t) + right * t
                elif left is not None or right is not None:
                    out[y, x] = left if left is not None else right
    return out


def row_lerp(rgb, region, source_ok):
    """Fill each row's run of `region` by blending linearly between the known
    pixels just left and right of it (bands that cross the hidden strip
    horizontally, like the hood's rim, continue straight through)."""
    out = rgb.copy()
    h, w = region.shape
    for y in range(h):
        xs = np.nonzero(region[y])[0]
        if not xs.size:
            continue
        for r in np.split(xs, np.nonzero(np.diff(xs) > 1)[0] + 1):
            a, b = r[0] - 1, r[-1] + 1
            while a >= 0 and not source_ok[y, a]:
                a -= 1
            while b < w and not source_ok[y, b]:
                b += 1
            if a < 0 and b >= w:
                continue
            ca = rgb[y, max(a - 1, 0):a + 1].mean(0) if a >= 0 else None
            cb = rgb[y, b:min(b + 2, w)].mean(0) if b < w else None
            for x in r:
                if ca is None or cb is None:
                    out[y, x] = ca if cb is None else cb
                else:
                    t = (x - a) / max(1, b - a)
                    out[y, x] = ca * (1 - t) + cb * t
    return out


def cmd_plan(args):
    plate = L.load_rgba(L.PLATE)
    own = np.load(MASKS / "owner.npy")
    info = L.read_json(MASKS / "owners.json")
    Z = info["z"]; zi = {n: i for i, n in enumerate(Z)}
    spec = L.read_json(MASKS / "frontal.hidden.json")
    rng = L.read_json(L.V3 / spec["range"])
    fig = plate[..., 3] > 0
    shape = fig.shape
    lift = spec["fringeLiftPx"]
    margin = spec["marginPx"]

    def owned(n):
        return own == zi[n]

    def above(n):
        return own > zi[n]

    hidden = {n: np.zeros(shape, bool) for n in Z}
    why = {}

    # 1. body under the head: the neck column, up under the jaw (also what a
    #    turned yaw key's head uncovers), only where a head layer owns it.
    neck = L.ellipses_mask(shape, spec["neckColumn"])
    hidden["body"] |= neck & above("body") & fig
    why["body/neck"] = int((neck & above("body")).sum())

    # 2. body over hairBack: the body's outline moves by the chest envelope,
    #    so hairBack must be complete under that band wherever hair can be
    #    behind it (near the hair: behind the neck, behind the collar tips).
    body = owned("body")
    band = L.uncoverable(body, relative(envelope("body", rng, lift), envelope("hairBack", rng, lift)), margin)
    near_hair = L.dilate(owned("hairBack") | owned("strand1") | owned("strand2"), spec["hairBehindReachPx"])
    own_bg = np.where(fig, own, -2)
    nb = nearest_label(own_bg, [zi["hairBack"], zi["strand1"], zi["strand2"], -2], band)
    hb = band & near_hair & (nb != -2)
    hidden["hairBack"] |= hb
    why["hairBack/underBody"] = int(hb.sum())

    # 3. earring: everything under it is uncoverable (its swing exceeds its width)
    ear = owned("earring")
    rel_ear = relative(envelope("earring", rng, lift), envelope("body", rng, lift))
    ear_unc = L.uncoverable(ear, rel_ear, margin)
    # background (-2) competes too: where the earring hangs over the
    # background, what it uncovers is background, left transparent.
    own_bg = np.where(fig, own, -2)
    lab = nearest_label(own_bg, [zi["hairBack"], zi["body"], zi["headCore"], -2], ear_unc)
    for n in ("hairBack", "body", "headCore"):
        hidden[n] |= ear_unc & (lab == zi[n])
        why[f"{n}/underEarring"] = int((ear_unc & (lab == zi[n])).sum())

    # 4. strands: hairBack continues under the root side; the tips over the
    #    background uncover background (left transparent).
    for s in ("strand1", "strand2"):
        m = owned(s)
        unc = L.uncoverable(m, envelope(s, rng, lift), margin)
        root = L.dilate(owned("hairBack"), spec["strandRootReachPx"])
        hidden["hairBack"] |= unc & root
        why[f"hairBack/under{s}"] = int((unc & root).sum())

    # 5. fringe lift: whatever the fringe's lower edge band covers
    fr = owned("hairFront")
    unc = L.uncoverable(fr, envelope("hairFront", rng, lift), margin)
    brows = L.ellipses_mask(shape, spec["browsUnderFringe"])
    unc |= brows & fr
    lab = nearest_label(own, [zi[n] for n in ("hairBack", "headCore")], unc)
    # above an eye window the fringe hides the upper lid, not the iris: that
    # band belongs to the lid ring (eyeAperture), whatever pixel is nearest.
    for side in ("R", "L"):
        win = np.load(MASKS / f"window{side}.npy")
        lids = L.dilate(win, spec["lidRingPx"]) & ~win & unc
        lab[lids] = zi["eyeAperture" + side]
        lab[win & unc] = zi["iris" + side]
    for n in ("hairBack", "headCore", "eyeApertureR", "eyeApertureL", "irisR", "irisL"):
        hidden[n] |= unc & (lab == zi[n])
        why[f"{n}/underFringe"] = int((unc & (lab == zi[n])).sum())

    # a fill is only ever allowed where a layer ABOVE owns the pixel at rest
    for n in Z:
        hidden[n] &= above(n) & fig if n != "hairBack" else above(n)
    np.savez_compressed(MASKS / "hidden.npz", **hidden)

    # jobs, one per kind of hidden content (each gets its own prompt and
    # denoise). The fringe's hair-over-hair band keeps the plate's own hair
    # (rig-assemble.py uses the plate there), so it is in no job.
    hair_under_fringe = hidden["hairBack"] & L.dilate(fr, margin + lift) & ~hb & ~ear_unc
    face_layers = ["headCore", "eyeApertureR", "eyeApertureL", "irisR", "irisL"]
    face = np.zeros(shape, bool)
    for n in face_layers:
        face |= hidden[n]
    face &= ~ear_unc
    jobs = {
        "neck": (hidden["body"] & neck, ["body"]),
        "earCollar": (hidden["body"] & ear_unc & ~neck, ["body"]),
        "earHair": ((hidden["hairBack"] | hidden["headCore"]) & ear_unc, ["hairBack", "headCore"]),
        "behind": (hidden["hairBack"] & ~ear_unc & ~hair_under_fringe, ["hairBack"]),
        "face": (face, face_layers),
    }
    JOBS.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(JOBS / "jobs.npz", **{k: v[0] for k, v in jobs.items()})
    JOBS.mkdir(parents=True, exist_ok=True)
    rgb = plate[..., :3].copy()
    a = plate[..., 3:4] / 255.0
    rgb = rgb * a + GREY * (1 - a)
    manifest = {}
    for name, (mask, layers) in jobs.items():
        src = rgb.copy()
        for n in layers:
            reg = hidden[n] & mask
            if not reg.any():
                continue
            known = owned(n) & ~mask
            if n == "hairBack":
                known |= owned("strand1") | owned("strand2")
            if spec["jobs"][name].get("knownPale"):
                # fabric only: not ink, not the tassel's blue shadow
                known &= (L.luminance(rgb) > 0.45) & ~(rgb[..., 2] > rgb[..., 0] + 10)
                known &= L.dilate(reg, 14)
            if n == "headCore":
                # skin only: not the sclera inside the eye windows, not ink
                for side in ("R", "L"):
                    known &= ~L.dilate(np.load(MASKS / f"window{side}.npy"), 3)
                known &= L.luminance(rgb) > 0.45
            src[reg] = L.push_pull_fill(rgb, known)[reg]
            if spec["jobs"][name].get("prefill") == "nearest":
                # each hidden pixel takes its nearest visible pixel: edges that
                # enter the strip continue into it as clean, flat colour areas
                _, (iy, ix) = ndi.distance_transform_edt(~known, return_indices=True)
                near = rgb[iy, ix]
                src[reg] = ndi.median_filter(near, size=(5, 5, 1))[reg]
            if spec["jobs"][name].get("prefill") == "rowLerp":
                src[reg] = ndi.gaussian_filter(row_lerp(rgb, reg, known), (1.2, 0.4, 0))[reg]
            if spec["jobs"][name].get("prefill") == "rowClone":
                cl = row_clone(rgb, reg, known)
                src[reg] = cl[reg]
            if n == "body":
                # the neck continues up under the jaw: extend each column's
                # lit neck colour (sampled below the chin's cast shadow)
                # upward instead of smearing the shadow into it.
                col = neck_extension(rgb, owned("body") & neck, spec["neckSampleDepthPx"])
                nreg = reg & neck
                src[nreg] = col[nreg]
        Image.fromarray(np.clip(src, 0, 255).astype(np.uint8)).save(JOBS / f"{name}.src.png")
        soft = ndi.gaussian_filter(L.dilate(mask, 2).astype(np.float32), 1.5)
        L.save_l(np.clip(soft, 0, 1), JOBS / f"{name}.mask.png")
        vis = np.clip(src * 0.55 + np.array([255, 0, 255]) * 0.45 * mask[..., None] + src * 0.45 * (~mask[..., None]), 0, 255)
        Image.fromarray(vis.astype(np.uint8)).save(JOBS / f"{name}.mask-overlay.png")
        manifest[name] = {"layers": layers, "pixels": int(mask.sum()), "src": L.rel(JOBS / f"{name}.src.png"),
                          "mask": L.rel(JOBS / f"{name}.mask.png"), "tags": spec["jobs"][name]["tags"],
                          "denoise": spec["jobs"][name]["denoise"],
                          "negAdd": spec["jobs"][name].get("negAdd", "")}
    L.write_json({"regions": why, "jobs": manifest, "range": spec["range"], "fringeLiftPx": lift, "marginPx": margin},
                 JOBS / "plan.json")
    print(why)
    print({k: v["pixels"] for k, v in manifest.items()})


def cmd_merge(args):
    plate = L.load_rgba(L.PLATE)
    hidden = dict(np.load(MASKS / "hidden.npz"))
    plan = L.read_json(JOBS / "plan.json")
    job = plan["jobs"][args.job]
    out = L.load_rgba(args.pick)[..., :3]
    src = np.asarray(Image.open(L.REPO / job["src"]).convert("RGB")).astype(np.float32)
    mask = np.load(JOBS / "jobs.npz")[args.job]
    # tone drift of the diffusion pass: out - src measured in a ring outside
    # the mask (where out should equal the source), smoothed, pulled inward.
    ring = L.dilate(mask, 10) & ~L.dilate(mask, 3)
    diff = out - src
    drift = L.push_pull_fill(diff, ring)
    drift = ndi.gaussian_filter(drift, (6, 6, 0))
    fixed = np.clip(out - drift, 0, 255)
    spec = L.read_json(MASKS / "frontal.hidden.json")["jobs"].get(args.job, {})
    if spec.get("rejectEarringColours"):
        # what the earring hid is hair or fabric: any blue/cyan the diffusion
        # pass carried over from the earring is refilled from its neighbours
        r, g, b = fixed[..., 0], fixed[..., 1], fixed[..., 2]
        bad = mask & (((b > r + 30) & (b > g - 10)) | ((b > r + 12) & (L.luminance(fixed) < 0.45)))
        bad = L.dilate(bad, 2) & mask
        fixed[bad] = ndi.gaussian_filter(L.push_pull_fill(fixed, ~bad & L.dilate(mask, 6)), (1.5, 1.5, 0))[bad]
    FILLS.mkdir(parents=True, exist_ok=True)
    rep = {}
    own = np.load(MASKS / "owner.npy")
    Z = L.read_json(MASKS / "owners.json")["z"]
    plate_rgb = plate[..., :3]
    for n in job["layers"]:
        reg = hidden[n] & mask
        # seam membrane: where the fill meets this layer's own visible plate
        # pixels, measure the step and spread its correction smoothly over the
        # fill (seamless-clone style), so a revealed edge has no tone step
        edge = L.dilate(reg, 3) & ~reg & (own == Z.index(n))
        if edge.any() and reg.any():
            step = np.zeros_like(fixed)
            step[edge] = plate_rgb[edge] - fixed[edge]
            corr = L.push_pull_fill(step, edge)
            fixed[reg] = np.clip(fixed[reg] + ndi.gaussian_filter(corr, (1.5, 1.5, 0))[reg], 0, 255)
        path = FILLS / f"{n}.png"
        cur = L.load_rgba(path) if path.exists() else np.zeros(plate.shape, np.float32)
        cur[reg, :3] = fixed[reg]
        cur[reg, 3] = 255
        L.save_rgba(cur, path)
        rep[n] = int(reg.sum())
    prov = FILLS / "provenance.json"
    p = L.read_json(prov) if prov.exists() else {}
    p[args.job] = {"pick": L.rel(args.pick), "layers": rep, "toneDriftRemoved": "ring 3-10 px outside the mask, gaussian sigma 6",
                   "sidecar": L.rel(str(args.pick).replace(".full.png", ".json"))}
    L.write_json(p, prov)
    print(rep)


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    sub.add_parser("plan")
    m = sub.add_parser("merge"); m.add_argument("--job", required=True); m.add_argument("--pick", required=True)
    a = ap.parse_args()
    {"plan": cmd_plan, "merge": cmd_merge}[a.cmd](a)


if __name__ == "__main__":
    main()
