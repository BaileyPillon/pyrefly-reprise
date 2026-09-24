# Macalania r3 poses (FFX only): SAM 2.1 small (CPU) part masks on an r3 idle's own pixels.
# usage: python sam_parts.py <idle.png> <prompts.json> <outdir>
# prompts.json: {"name": {"box":[x0,y0,x1,y1], "pos":[[x,y],...], "neg":[[x,y],...], "pick": 0|1|2|"best"}}
import os, sys, json, pathlib, numpy as np
from PIL import Image
import torch
torch.jit.script = lambda f, *a, **k: f
SAM_REPO = pathlib.Path("D:/Tools/sam2/repo"); CKPT = "D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt"
src, pj, outdir = sys.argv[1:4]
src = os.path.abspath(src); pj = os.path.abspath(pj); outdir = os.path.abspath(outdir)
cwd = os.getcwd(); os.chdir(SAM_REPO)
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", CKPT, device="cpu"); os.chdir(cwd)
P = SAM2ImagePredictor(model)
im = Image.open(src).convert("RGBA"); arr = np.array(im)
a = arr[..., 3:4].astype(np.float32) / 255
rgb = (arr[..., :3] * a + 128 * (1 - a)).astype(np.uint8)
prompts = json.load(open(pj))
with torch.inference_mode():
    P.set_image(rgb)
    for name, p in prompts.items():
        pos = p.get("pos", []); neg = p.get("neg", [])
        pts = np.array(pos + neg, np.float32) if pos or neg else None
        lab = np.array([1] * len(pos) + [0] * len(neg)) if pts is not None else None
        box = np.array(p["box"], np.float32) if "box" in p else None
        m, sc, _ = P.predict(point_coords=pts, point_labels=lab, box=box, multimask_output=True)
        for i in range(3):
            mm = (m[i] > 0) & (arr[..., 3] > 0)
            Image.fromarray((mm * 255).astype(np.uint8)).save(f"{outdir}/{name}.m{i}.png")
            print(name, i, round(float(sc[i]), 3), int(mm.sum()))
