"""clipsim.py: CLIP ViT-H/14 image embeddings on the CPU through ComfyUI's own loader (nothing downloaded; the weights are in models/clip_vision).

  from clipsim import embed, cos
  e = embed(pil_rgb_image)      # a unit-length numpy vector (1024)
  cos(e1, e2)

Used for the face-likeness number of the painterly lock round: the same face window cut from the approved painting and from a candidate, composited on white.
"""
import os
import sys

os.environ.setdefault('CUDA_VISIBLE_DEVICES', '')
ROOT = 'D:/Tools/ComfyUI/ComfyUI'
sys.path.insert(0, ROOT)
_argv = sys.argv
sys.argv = [sys.argv[0], '--cpu']
import numpy as np  # noqa: E402
import torch  # noqa: E402
import comfy.clip_vision as cv  # noqa: E402
sys.argv = _argv      # ComfyUI's argument parser has read its flags; give the caller its own command line back

_m = [None]
WEIGHTS = f'{ROOT}/models/clip_vision/CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors'


def model():
    if _m[0] is None:
        _m[0] = cv.load(WEIGHTS)
    return _m[0]


def embed(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255.0
    t = torch.from_numpy(a)[None]
    with torch.no_grad():
        out = model().encode_image(t, crop=False)   # the window is already square; no centre crop
    e = out['image_embeds'][0].float().cpu().numpy()
    return e / (np.linalg.norm(e) + 1e-9)


def cos(a, b):
    return float(np.dot(a, b))
