"""Step 1a, SAM: part masks for the costume painting from the config's prompts (SAM 2.1 hiera-small, local; our own approved painting only).

    python rig.py cut --subject kimahri --sam [--only head,torso] [--cpu]

config["sam"]["parts"] = (or config["sam"]["file"]: a prompts JSON in the prototype's format, whose "parts" are read) { name: { "pos": [[x, y], ...], "neg": [[x, y], ...], "box": [x0, y0, x1, y1] | null, "pick": "best" | 0 | 1 | 2, "thr": 0.5 } }, in the 1x painting's pixels.
Writes <work>/sam/<name>.png (8-bit mask in the 1x painting's pixels, ANDed with its alpha), _overlay.png and _scores.json.
The GPU is shared: SAM small needs about 0.6 GB. It runs on the CPU when --cpu is given, when the card has less than 2 GB free, and WHILE D:/Tools/pyrefly-scratch/GPU-QUIET EXISTS
(the driver's live-measurement marker): it never touches the GPU then.
"""
from __future__ import annotations

import json
import os
import pathlib

import numpy as np
from PIL import Image

from rig_common import BG, Subject, gpu_quiet, say

SAM_REPO = pathlib.Path("D:/Tools/sam2/repo")
CKPT = pathlib.Path("D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt")
COLORS = [(255, 80, 80), (80, 200, 255), (255, 220, 60), (200, 120, 255), (90, 255, 120), (255, 150, 60), (255, 100, 220), (255, 255, 255), (120, 255, 255), (255, 170, 170), (170, 255, 170), (170, 170, 255)]


def run(sub: Subject, only=None, cpu=False) -> None:
    spec = sub.cfg.get("sam")
    if spec and spec.get("file"):  # a prompts file in the prototype's format ({ "parts": { name: {pos, neg, box, ...} } }); its image and out fields are ignored
        spec = {**spec, "parts": json.loads(sub.rel(spec["file"]).read_text(encoding="utf8"))["parts"]}
    if not spec or not spec.get("parts"):
        say("rig sam: the config has no sam.parts; nothing to cut by SAM")
        return
    import torch

    torch.jit.script = lambda f, *a, **k: f
    cwd = os.getcwd()
    os.chdir(SAM_REPO)
    from sam2.build_sam import build_sam2
    from sam2.sam2_image_predictor import SAM2ImagePredictor

    quiet = gpu_quiet()
    use_gpu = (not cpu) and (not quiet) and torch.cuda.is_available() and torch.cuda.mem_get_info()[0] > 2 * 1024 ** 3
    dev = "cuda" if use_gpu else "cpu"
    model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", str(CKPT), device=dev)
    os.chdir(cwd)
    pred = SAM2ImagePredictor(model)
    say(f"rig sam: SAM 2.1 small on {dev}" + (" (the GPU-QUIET marker is present)" if quiet else ""))
    im = Image.open(sub.costume_1x).convert("RGBA")
    a = np.array(im)
    alpha = a[..., 3] > 24
    bg = Image.new("RGBA", im.size, BG + (255,))
    bg.alpha_composite(im)
    rgb = np.array(bg.convert("RGB"))
    out = sub.sub("sam")
    overlay = rgb.astype(np.float32).copy()
    scores_all = {}
    with torch.inference_mode():
        pred.set_image(rgb)
        for i, (name, p) in enumerate(spec["parts"].items()):
            if only and name not in only:
                continue
            pos = [tuple(map(float, q)) for q in p.get("pos", [])]
            neg = [tuple(map(float, q)) for q in p.get("neg", [])]
            pts = np.array(pos + neg, np.float32)
            lab = np.array([1] * len(pos) + [0] * len(neg))
            box = np.array(p["box"], np.float32) if p.get("box") else None
            logits, scores, _ = pred.predict(point_coords=pts, point_labels=lab, box=box, multimask_output=True, return_logits=True)
            prob = 1 / (1 + np.exp(-np.clip(logits, -30, 30)))
            pick = p.get("pick", "best")
            k = int(np.argmax(scores)) if pick == "best" else int(pick)
            m = (prob[k] > p.get("thr", 0.5)) & alpha
            Image.fromarray((m * 255).astype(np.uint8)).save(out / f"{name}.png")
            col = np.array(COLORS[i % len(COLORS)], np.float32)
            overlay[m] = overlay[m] * 0.4 + col * 0.6
            scores_all[name] = {"score": round(float(scores[k]), 3), "all": [round(float(s), 3) for s in scores], "area": int(m.sum()), "pick": k}
            say(" ", name, scores_all[name])
    Image.fromarray(overlay.clip(0, 255).astype(np.uint8)).save(out / "_overlay.png")
    prior = {}
    if (out / "_scores.json").exists():
        prior = json.loads((out / "_scores.json").read_text())
    prior.update(scores_all)
    (out / "_scores.json").write_text(json.dumps(prior, indent=1))
