"""Compare two recordings (the lane kit; the rig program, 2026-10-18): the proof that a change to the rig engine or the rig format leaves a rig that does not use the change drawing the same.

    lane.py framediff --a <recording A>/poses --b <recording B>/poses [--floor <a second recording of A>/poses] [--poses a,b] [--every N] [--from FRAME] [--out report.json]

Both recordings come from `record.mjs` (same subject, same poses, the game's own seed, the virtual 60 Hz clock, the real GPU, headless): one against the engine before the change, one after it. Two readings:

  rig signature (EXACT)   `rig-signature.json`: a hash a frame of everything the rig hands the GPU (every part mesh's skinned positions, visibility and depth, the parts' texture and rim uniforms).
                          Equal hashes, frame for frame, mean the same draw. A browser run is NOT frame-exact against itself (the page's frame callbacks land a frame earlier or later from run to run, so a
                          pose that is still settling hashes differently), so this reads IDENTICAL only when every frame matches; the exact proof for an engine change is the node test
                          (`tests/unit/rig/rig-v1-unchanged.test.ts`), which has no clock. Here the verdict falls back to the floor.
  pixels (a measure)      the mean absolute channel difference inside the figure's own rectangle, a pose. The scene has ambient grain that changes from run to run, so identical engines do NOT read
                          zero: `--floor` is a second recording of A, and B is "the same as A" when its difference is no bigger than the floor's.
"""
from __future__ import annotations

import json
import pathlib

import numpy as np
from PIL import Image


def diff_frames(a: np.ndarray, b: np.ndarray) -> dict:
    """`{pixels, maxChannel, mean}` of two decoded frames (same shape, 8-bit): pixels that differ in any channel, the largest channel difference, the mean absolute channel difference."""
    if a.shape != b.shape:
        return {"pixels": int(max(a.shape[0] * a.shape[1], b.shape[0] * b.shape[1])), "maxChannel": 255, "mean": 255.0}
    d = np.abs(a.astype(np.int16) - b.astype(np.int16))
    return {"pixels": int((d.max(axis=-1) > 0).sum()), "maxChannel": int(d.max()), "mean": float(d.mean())}


def compare_signatures(a: pathlib.Path, b: pathlib.Path, poses: list[str] | None = None) -> dict:
    """`{pose: {frames, mismatched, firstMismatch, none}}` over the poses both recordings have a signature for. A frame whose signature could not be read counts as a mismatch."""
    fa, fb = a / "rig-signature.json", b / "rig-signature.json"
    if not (fa.exists() and fb.exists()):
        return {}
    sa, sb = json.loads(fa.read_text()), json.loads(fb.read_text())
    out = {}
    for pose in poses or sorted(set(sa) & set(sb)):
        x, y = sa.get(pose), sb.get(pose)
        if x is None or y is None:
            continue
        bad = [i for i in range(max(len(x), len(y))) if i >= len(x) or i >= len(y) or x[i] != y[i] or x[i] is None]
        out[pose] = {"frames": min(len(x), len(y)), "mismatched": len(bad), "firstMismatch": bad[0] if bad else None, "none": sum(1 for v in x if v is None)}
    return out


def figure_rect(info: dict, pose: str, margin: int = 10) -> tuple[int, int, int, int]:
    r, r0 = info["poses"][pose]["rectPose"], info["poses"][pose]["rectIdle"]
    return (int(min(r["x"], r0["x"])) - margin, int(min(r["y"], r0["y"])) - margin, int(max(r["x"] + r["w"], r0["x"] + r0["w"])) + margin, int(max(r["y"] + r["h"], r0["y"] + r0["h"])) + margin)


def compare_pixels(a: pathlib.Path, b: pathlib.Path, poses: list[str] | None = None, every: int = 1, start: int = 0) -> dict:
    """`{pose: {frames, meanDiff, worstFrameMean, worstChannel}}`: the difference inside the figure's rectangle, over the frames both recordings have."""
    fa, fb = a / "frames", b / "frames"
    info = json.loads((a / "poses-info.json").read_text())
    out = {}
    for pose in poses or sorted(p.name for p in fa.iterdir() if (fb / p.name).is_dir()):
        x0, y0, x1, y1 = figure_rect(info, pose)
        means, worst_ch = [], 0
        for f in sorted((fa / pose).glob("f*.jpg"))[start::every]:
            g = fb / pose / f.name
            if not g.exists():
                continue
            d = diff_frames(np.array(Image.open(f).convert("RGB"))[y0:y1, x0:x1], np.array(Image.open(g).convert("RGB"))[y0:y1, x0:x1])
            means.append(d["mean"])
            worst_ch = max(worst_ch, d["maxChannel"])
        out[pose] = {"frames": len(means), "meanDiff": round(float(np.mean(means)), 3) if means else None, "worstFrameMean": round(float(max(means)), 3) if means else None, "worstChannel": worst_ch}
    return out


def run(a: str, b: str, poses: str | None, every: int, out: str | None, floor: str | None = None, start: int = 0) -> int:
    pa, pb = pathlib.Path(a), pathlib.Path(b)
    want = [p for p in (poses or "").split(",") if p] or None
    sig = compare_signatures(pa, pb, want)
    pix = compare_pixels(pa, pb, want, every, start)
    fl = compare_pixels(pa, pathlib.Path(floor), [k for k in pix if (pathlib.Path(floor) / "frames" / k).is_dir()], every, start) if floor else {}
    for pose in sorted(set(sig) | set(pix)):
        s, p = sig.get(pose), pix.get(pose)
        parts = []
        if s:
            parts.append(f"rig signature {s['frames']} frames, {s['mismatched']} mismatched" + ("" if not s["none"] else f" ({s['none']} unreadable)"))
        if p and p["meanDiff"] is not None:
            parts.append(f"pixels: mean diff {p['meanDiff']} in the figure's rectangle (worst frame {p['worstFrameMean']})")
        if pose in fl and fl[pose]["meanDiff"] is not None:
            parts.append(f"run-to-run floor {fl[pose]['meanDiff']} (worst frame {fl[pose]['worstFrameMean']})")
        print(f"  {pose:9s} " + "; ".join(parts))
    exact = bool(sig) and all(s["mismatched"] == 0 and s["none"] == 0 and s["frames"] > 0 for s in sig.values())
    within = bool(fl) and all(pix[k]["meanDiff"] is not None and fl[k]["meanDiff"] is not None and pix[k]["meanDiff"] <= fl[k]["meanDiff"] * 1.25 + 0.05 for k in pix if k in fl)
    verdict = "IDENTICAL (every frame's rig signature matches)" if exact else ("SAME WITHIN THE RUN-TO-RUN FLOOR" if within else "DIFFERENT")
    print(f"lane framediff: {sum(s['frames'] for s in sig.values()) or sum(p['frames'] for p in pix.values())} frame(s) over {len(sig) or len(pix)} pose(s): {verdict}")
    if out:
        pathlib.Path(out).write_text(json.dumps({"signature": sig, "pixels": pix, "floor": fl, "verdict": verdict}, indent=1), encoding="utf8")
    return 0 if exact or within else 1
