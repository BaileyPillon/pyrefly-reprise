# Guado Guardian r3 (FFX only): SAM 2.1 small (CPU) mask of the figure in the raw concept render guado-guardian-a2 (seed 501031).
import os, sys, pathlib, numpy as np
from PIL import Image
import torch
torch.jit.script = lambda f, *a, **k: f
SAM_REPO = pathlib.Path("D:/Tools/sam2/repo"); CKPT = "D:/Tools/sam2/checkpoints/sam2.1_hiera_small.pt"
cwd = os.getcwd(); os.chdir(SAM_REPO)
from sam2.build_sam import build_sam2
from sam2.sam2_image_predictor import SAM2ImagePredictor
model = build_sam2("configs/sam2.1/sam2.1_hiera_s.yaml", CKPT, device="cpu"); os.chdir(cwd)
P = SAM2ImagePredictor(model)
rgb = np.array(Image.open("raw.png").convert("RGB"))
# concept crop offset: cropBox [2,23] -> concept pixel (x,y) = raw (x+2, y+23)
box = np.array([10, 30, 820, 1165], np.float32)
pos = [[260, 150], [330, 250], [300, 480], [450, 700], [600, 1000], [330, 900], [120, 1130], [60, 455], [590, 600], [420, 560], [760, 770]]
neg = [[80, 200], [700, 300], [700, 1190], [60, 800], [500, 150]]
pts = np.array(pos + neg, np.float32); lab = np.array([1]*len(pos) + [0]*len(neg))
with torch.inference_mode():
    P.set_image(rgb)
    lg, sc, _ = P.predict(point_coords=pts, point_labels=lab, box=box, multimask_output=True, return_logits=True)
prob = 1/(1+np.exp(-np.clip(lg, -30, 30)))
for i in range(3):
    m = prob[i] > 0.5
    Image.fromarray((m*255).astype(np.uint8)).save(f"sam.m{i}.png")
    np.save(f"sam.p{i}.npy", prob[i].astype(np.float32))
    print(i, float(sc[i]), int(m.sum()))
