"""mp4peek.py <clip.mp4> <out.png> <t1,t2,..> [--w 1400] : frames of a clip (seconds) stacked, to look at a motion clip without a player."""
import pathlib
import subprocess
import sys
import tempfile

from PIL import Image

FF = 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg'
clip, out, ts = sys.argv[1], sys.argv[2], sys.argv[3].split(',')
w = int(sys.argv[sys.argv.index('--w') + 1]) if '--w' in sys.argv else 1400
tmp = pathlib.Path(tempfile.mkdtemp(prefix='peek-'))
ims = []
for i, t in enumerate(ts):
    f = tmp / f'p{i}.png'
    subprocess.run([FF, '-y', '-loglevel', 'error', '-ss', t, '-i', clip, '-frames:v', '1', str(f)], check=True)
    im = Image.open(f).convert('RGB')
    ims.append(im.resize((w, int(im.height * w / im.width)), Image.LANCZOS))
sheet = Image.new('RGB', (w, sum(i.height for i in ims)), (0, 0, 0))
y = 0
for im in ims:
    sheet.paste(im, (0, y))
    y += im.height
sheet.save(out)
print(out, sheet.size)
