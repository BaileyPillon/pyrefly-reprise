#!/usr/bin/env python
"""Join tests: (a) reversal seam vs clip median step, (b) cross-clip frame1 vs
frame1 (blinks vs breathing), for both raw and colour-matched (cm) frames."""
import json
import numpy as np
from PIL import Image

ROOT = "C:/Users/ADMINI~1/AppData/Local/Temp/claude/D--Final-Fantasy/174911c6-80de-460f-ac03-e4631f17478b/scratchpad/pingpong"
PLATE_PATH = "D:/Tools/ComfyUI/ComfyUI/input/pyrefly-video-plate-f1efe21f6c75-1280x704.png"
FLOOR_PATH = "D:/Tools/pyrefly-video/flf/vae-floor/pyrefly-video-plate-f1efe21f6c75-1280x704-floor.png"

RAW_DIRS = {
    "idle-blinks": "D:/Tools/pyrefly-video/flf/idle-blinks/1",
    "idle-breathing": "D:/Tools/pyrefly-video/flf/idle-breathing/1",
}
CM_DIRS = {
    "idle-blinks": f"{ROOT}/cm-frames/idle-blinks",
    "idle-breathing": f"{ROOT}/cm-frames/idle-breathing",
}
N = {"idle-blinks": 97, "idle-breathing": 81}
T = {"idle-blinks": 81, "idle-breathing": 81}

BOXES = {
    "face": (420, 20, 760, 400),
    "eyes": (460, 140, 635, 285),
    "greenEye": (468, 203, 546, 278),
    "blueEye": (548, 145, 626, 220),
    "mouth": (548, 252, 642, 308),
    "braid": (468, 278, 542, 402),
    "hairline": (436, 18, 724, 122),
    "full": (0, 0, 1280, 704),
}


def load(path):
    return np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)


def crop(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def mad(a, b, box):
    return float(np.mean(np.abs(crop(a, box) - crop(b, box))))


def load_clip(dirpath, n):
    return [load(f"{dirpath}/frame_{i:05d}.png") for i in range(1, n + 1)]


if __name__ == "__main__":
    plate = load(PLATE_PATH)
    floor = load(FLOOR_PATH)

    clips = {}
    for variant, dirs in [("raw", RAW_DIRS), ("cm", CM_DIRS)]:
        clips[variant] = {}
        for name in ["idle-blinks", "idle-breathing"]:
            clips[variant][name] = load_clip(dirs[name], N[name])

    result = {"reversalSeam": {}, "clipMedianStep": {}, "crossClipFrame1": {}, "floorVsPlate": {}}

    for boxname, box in BOXES.items():
        result["floorVsPlate"][boxname] = mad(floor, plate, box)

    for variant in ["raw", "cm"]:
        result["reversalSeam"][variant] = {}
        result["clipMedianStep"][variant] = {}
        for name in ["idle-blinks", "idle-breathing"]:
            frames = clips[variant][name]
            t = T[name]
            n = N[name]
            # steps across the whole clip, all boxes
            steps = {b: [mad(frames[i], frames[i - 1], box) for i in range(1, n)] for b, box in BOXES.items()}
            # reversal seam: MAD(T-1,T) == MAD(T,T-1) -- 1-indexed frame T and T-1
            seam = {b: mad(frames[t - 1], frames[t - 2], box) for b, box in BOXES.items()}  # frames[t-1]=frame T, frames[t-2]=frame T-1
            median_step = {b: float(np.median(vals)) for b, vals in steps.items()}
            max_step = {b: float(np.max(vals)) for b, vals in steps.items()}
            result["reversalSeam"][variant][name] = seam
            result["clipMedianStep"][variant][name] = {"median": median_step, "max": max_step}

    # cross-clip frame1 vs frame1
    for variant in ["raw", "cm"]:
        f1_blinks = clips[variant]["idle-blinks"][0]
        f1_breathing = clips[variant]["idle-breathing"][0]
        cross = {b: mad(f1_blinks, f1_breathing, box) for b, box in BOXES.items()}
        blinks_vs_plate = {b: mad(f1_blinks, plate, box) for b, box in BOXES.items()}
        breathing_vs_plate = {b: mad(f1_breathing, plate, box) for b, box in BOXES.items()}
        result["crossClipFrame1"][variant] = {
            "blinksF1_vs_breathingF1": cross,
            "blinksF1_vs_plate": blinks_vs_plate,
            "breathingF1_vs_plate": breathing_vs_plate,
        }

    with open(f"{ROOT}/join-tests.json", "w") as fh:
        json.dump(result, fh, indent=2)

    # Print readable summary
    print("=== VAE floor vs plate (reference) ===")
    for b in BOXES:
        print(f"  {b:10s} {result['floorVsPlate'][b]:6.2f}")

    for variant in ["raw", "cm"]:
        print(f"\n=== [{variant}] Reversal seam (T-1,T) vs clip median step ===")
        for name in ["idle-blinks", "idle-breathing"]:
            print(f" {name} (T={T[name]}):")
            for b in ["face", "eyes", "mouth", "hairline", "full"]:
                seam = result["reversalSeam"][variant][name][b]
                med = result["clipMedianStep"][variant][name]["median"][b]
                mx = result["clipMedianStep"][variant][name]["max"][b]
                mult = seam / med if med else float("nan")
                print(f"   {b:10s} seam={seam:6.2f}  clipMedianStep={med:6.2f}  clipMaxStep={mx:6.2f}  seam/median={mult:5.2f}x")

    for variant in ["raw", "cm"]:
        print(f"\n=== [{variant}] Cross-clip: idle-blinks f1 vs idle-breathing f1 ===")
        c = result["crossClipFrame1"][variant]
        for b in ["face", "eyes", "mouth", "hairline", "full"]:
            cross = c["blinksF1_vs_breathingF1"][b]
            bvp = c["blinksF1_vs_plate"][b]
            rvp = c["breathingF1_vs_plate"][b]
            floor_v = result["floorVsPlate"][b]
            print(f"   {b:10s} cross={cross:6.2f} ({cross/floor_v:.2f}x floor)  blinksF1vsPlate={bvp:6.2f} ({bvp/floor_v:.2f}x floor)  breathingF1vsPlate={rvp:6.2f} ({rvp/floor_v:.2f}x floor)")
