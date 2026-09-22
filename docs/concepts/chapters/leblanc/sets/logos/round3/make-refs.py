# Logos round 3 reference images (FFX-2 only, Chateau Leblanc chapter art; method F).
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/sets/logos/round3/make-refs.py concept
#   D:\Tools\ComfyUI\python_embeded\python.exe -s docs/concepts/chapters/leblanc/sets/logos/round3/make-refs.py idle
# concept: refs/concept-square.png + refs/concept-head.png from Bailey's picked concept
#          (docs/concepts/chapters/leblanc/renders/logos-c.png), with the feather plume and the
#          crest spike painted out on white (Bailey's note on the pick: "re-rendered with a plainer,
#          canon helmet"), so the adapter is not shown the crest the words forbid.
# idle:    refs/idle-square.png + refs/idle-head.png from the installed round-3 idle
#          (public/art/characters/logos/idle.png), the anchor for attack, cast, hurt and ko.
# Squares because the adapter's CLIP-Vision centre-crops to a square (pilot 2 method check §2.2).
import json, pathlib, sys
from PIL import Image, ImageDraw

HERE = pathlib.Path(__file__).resolve().parent
ROOT = HERE.parents[6]


def flat(p):
    im = Image.open(p).convert("RGBA")
    bg = Image.new("RGB", im.size, (255, 255, 255))
    bg.paste(im, mask=im.split()[-1])
    return bg


def square(img, out):
    s = max(img.size)
    sq = Image.new("RGB", (s, s), (255, 255, 255))
    sq.paste(img, ((s - img.width) // 2, (s - img.height) // 2))
    sq.resize((1024, 1024), Image.LANCZOS).save(out)


mode = sys.argv[1]
if mode == "concept":
    im = flat(ROOT / "docs/concepts/chapters/leblanc/renders/logos-c.png")
    d = ImageDraw.Draw(im)
    # plume (feathers trailing up and back from the helmet) and the crest spike, cutout pixels
    d.polygon([(395, 60), (539, 60), (539, 190), (430, 190), (410, 120)], fill=(255, 255, 255))
    d.polygon([(312, 0), (352, 0), (352, 50), (335, 64), (318, 64)], fill=(255, 255, 255))
    d.rectangle([355, 0, 539, 44], fill=(255, 255, 255))
    d.rectangle([440, 0, 539, 200], fill=(255, 255, 255))
    d.rectangle([398, 36, 440, 62], fill=(255, 255, 255))
    d.polygon([(280, 150), (310, 150), (310, 200), (285, 200)], fill=(255, 255, 255))
    square(im, HERE / "refs/concept-square.png")
    im.crop((230, 0, 490, 260)).resize((1024, 1024), Image.LANCZOS).save(HERE / "refs/concept-head.png")
elif mode == "idle":
    src = ROOT / "public/art/characters/logos/idle.png"
    box = json.loads((HERE / "refs/idle-headbox.json").read_text())["box"]
    im = flat(src)
    square(im, HERE / "refs/idle-square.png")
    im.crop(tuple(box)).resize((1024, 1024), Image.LANCZOS).save(HERE / "refs/idle-head.png")
else:
    raise SystemExit("mode: concept | idle")
print("refs written", mode)
