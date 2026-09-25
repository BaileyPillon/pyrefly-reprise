"""Matte a hero render with the pipeline's installed isnet-anime (never a download).
Run with ComfyUI's embedded python:
  D:/Tools/ComfyUI/python_embeded/python.exe -s matte.py in.png out.png
Writes an RGBA PNG: the render's pixels, alpha = the isnet-anime matte."""
import os, sys
os.environ['U2NET_HOME'] = r'D:\Tools\ComfyUI\rembg-models'
from rembg.sessions.dis_anime import DisSession  # noqa: E402
from rembg import new_session, remove  # noqa: E402
from PIL import Image  # noqa: E402
if DisSession.resolve_existing('isnet-anime.onnx') is None:
    raise SystemExit('isnet-anime.onnx is not on disk; refusing to let rembg download it')
sess = new_session('isnet-anime')
for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
    im = Image.open(src).convert('RGB')
    m = remove(im, session=sess, only_mask=True)
    out = im.convert('RGBA'); out.putalpha(m)
    out.save(dst)
    print('matte', dst)
