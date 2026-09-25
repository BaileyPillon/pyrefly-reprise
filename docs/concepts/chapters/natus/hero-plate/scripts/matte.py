"""Full-frame isnet-anime matte of a hero render (no crop), for compositing a figure behind it.

Runs in ComfyUI's embedded python, which has rembg, with the pipeline's installed weights:

    D:/Tools/ComfyUI/python_embeded/python.exe -s matte.py <in.png> <out-rgba.png>

Refuses to run (rather than download) if isnet-anime.onnx is not already on disk.
"""
import os
import sys

os.environ.setdefault('U2NET_HOME', r'D:\Tools\ComfyUI\rembg-models')
from PIL import Image  # noqa: E402
from rembg import new_session, remove  # noqa: E402
from rembg.sessions.dis_anime import DisSession  # noqa: E402

if DisSession.resolve_existing('isnet-anime.onnx') is None:
    sys.exit('isnet-anime.onnx is not on disk; refusing to download it')
session = new_session('isnet-anime')
for src, dst in zip(sys.argv[1::2], sys.argv[2::2]):
    im = Image.open(src).convert('RGB')
    out = remove(im, session=session)
    out.save(dst)
    print('matte', dst)
