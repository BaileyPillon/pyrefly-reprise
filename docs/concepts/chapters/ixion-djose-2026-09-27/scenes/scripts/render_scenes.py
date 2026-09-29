"""Paint the Ixion-at-Djose scene options on the shared ComfyUI (FFX-2 only; options, nothing installed).

Two subjects, two options each, from the written descriptions in research/ffx2-ixion-djose.md:
  chamber  (6.1: the Chamber of the Fayth, statue ripped out, a deep hole in the middle of the floor
            leading to the Farplane; Machine Faction equipment in a trashed temple; Djose's lightning)
  abyss    (7.2 steps 1, 3, 10, 11: a white void, a beautiful strange place, fog, Yuna alone,
            the spirit light that leads her out)
Same graph and settings as the house backdrops (tools/gen/comfy.mjs `backdrop`: Animagine XL 4.0 Opt,
1344x768, 30 steps, cfg 6, euler_ancestral, RealESRGAN 4x then 0.5 = 2688x1536), same prompt shape
("no humans, scenery, ..., detailed background, painterly, cinematic lighting, wide shot, quality").
Its own client instead of comfy.mjs on purpose: comfy.mjs may restart ComfyUI after a black frame,
and this run must never restart the shared server. An all-black render stops the run.

Politeness: submits only while the shared queue is empty (nothing running, nothing pending).
Never deletes anything. Writes raws + a JSON sidecar each to the candidates folder.

    python docs/concepts/chapters/ixion-djose-2026-09-27/scenes/scripts/render_scenes.py <option> <seed> [<seed>...]
option: c1 c2 (chamber) or a1 a2 (abyss)
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.request

from PIL import Image

HOST = "http://127.0.0.1:8188"
OUT = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion-scenes"
COMFY_INPUT = r"D:\Tools\ComfyUI\ComfyUI\input"
QUALITY = "masterpiece, high score, great score, absurdres"
TAIL = "detailed background, painterly, cinematic lighting, wide shot"
BASE_NEG = ("lowres, bad anatomy, bad hands, text, error, missing finger, extra digits, fewer digits, cropped, "
            "worst quality, low quality, low score, bad score, average score, jpeg artifacts, signature, watermark, "
            "username, blurry, artist name, multiple views, multiple girls, multiple boys, 2girls, 2boys, "
            "1girl, 1boy, character, people, person, human")

OPTIONS = {
    # C1 "Storm-lit stone": the Chamber as the sources describe it, lit by Djose's own lightning.
    "c1": dict(subject="chamber", prompt=(
        "final fantasy x-2, djose temple, chamber of the fayth, \\(round chamber inside an ancient grey stone temple:1.2\\), "
        "\\(eye level view:1.1\\), \\(a wide flat floor of cracked grey flagstones filling the lower half of the picture:1.3\\), "
        "\\(a large dark ragged hole torn open in the middle of the floor:1.4\\), the broken stump of a round stone pedestal at the hole's edge, "
        "rubble and fallen stone blocks, \\(pale white mist rising out of the hole:1.2\\), massive carved stone walls and arches, "
        "\\(thin blue white lightning crackling over the stone walls:1.2\\), overcast storm light, cold slate blue and grey, "
        "faint violet shadows, abandoned, ominous, empty"),
        neg_add="statue, sculpture, sky, sun, trees, grass, water, river, fire, flames, orange light, red, snow, ice, window"),
    # C2 "The Faction's lamps": the round chamber after the Machine Faction moved in (research 6.1: Faction gear in a
    # trashed temple). v1 (seeds 9201-9204, escaped weights like the house plates) came back as bare warehouses, so
    # this one uses real prompt weights to keep the temple and the round room.
    "c2": dict(subject="chamber", prompt=(
        "final fantasy x-2, djose temple, chamber of the fayth, (round domed chamber of ancient carved grey stone:1.35), "
        "(temple interior:1.2), curved stone walls with carved pillars and arches, a round opening in the dome letting in grey storm light, "
        "eye level view, (a wide empty circular stone floor filling the lower half of the picture:1.3), cracked flagstones, rubble, "
        "(a few machina work lamps on metal tripods glowing amber:1.2), (thick black cables snaking across the floor:1.1), "
        "a couple of metal crates by the walls, faint blue electric sparks on the stone, dust in the air, "
        "cold blue grey stone lit by warm amber lamps, trashed, abandoned, ominous"),
        neg_add="statue, sculpture, pillar in the center, column in the middle, sky, sun, trees, grass, water, fire, flames, "
                "snow, ice, robot, vehicle, warehouse, shelves, factory, corridor"),
    # A1 "White void": step 1 read literally (a white void, fog, a beautiful strange place). v1 (9301-9304, escaped
    # weights) came back dark; this one uses real weights to hold the high key.
    "a1": dict(subject="abyss", prompt=(
        "final fantasy x-2, farplane abyss, (endless white void:1.4), (white fog everywhere:1.35), (high key, bright, overexposed:1.2), "
        "(white theme:1.2), (a flat ledge of pale stone in the foreground floating in the fog:1.2), "
        "faint grey silhouettes of broken floating stone fragments far away, soft pearl white and pale gold light, "
        "a few tiny drifting soft orbs of light, dreamlike, silent, lonely, ethereal, empty, no horizon, minimalist"),
        neg_add="dark, black, night, shadows, flowers, flower field, grass, pink, purple, lavender, mountains, trees, water, "
                "sunset, stars, building, pillars, stairs, statue, bird, wings, feather"),
    # A2 "Deep abyss": the same place read as depth (fog glowing from below, a floating path into the fog). v1
    # (9401-9404, escaped weights) came back as open sky with big bubbles and nothing to stand on; real weights here.
    "a2": dict(subject="abyss", prompt=(
        "final fantasy x-2, farplane abyss, (bottomless misty abyss:1.3), eye level view, "
        "(a wide flat floating slab of pale stone in the foreground to stand on:1.35), "
        "(a narrow path of flat floating stepping stones leading away into the fog:1.3), deep dusk blue and teal fog, "
        "(pale white light glowing up from far below:1.2), dark floating rocks at the edges, "
        "(many tiny drifting glowing motes of light:1.1), ghostly, lonely, dreamlike, vast, empty"),
        neg_add="flowers, flower field, grass, pink, lavender, mountains, trees, water, ocean, waves, sunset, clouds, "
                "planet, bubbles, large spheres, moon, building, stairs, statue, fish, bird"),
    # C2 v3: v2 (9211-9214) drifted into a gothic cathedral with stained glass (not Djose); v3 lifts the camera so the
    # floor fills the lower half (the den-of-woe plate's trick) and bans the cathedral words.
    "c2v3": dict(subject="chamber", prompt=(
        "final fantasy x-2, djose temple, chamber of the fayth, (round chamber of ancient carved grey stone blocks:1.3), "
        "temple interior, curved stone walls with carved arches, (slightly high angle view:1.2), "
        "(a wide round stone floor filling the lower half of the picture:1.4), (a large dark hole in the middle of the floor:1.3), "
        "cracked flagstones, rubble, (machina work lamps on metal tripods:1.2), (black cables across the floor:1.1), "
        "metal crates by the walls, cold blue grey stone, warm amber lamp light, faint blue electric sparks, dust, trashed, abandoned"),
        neg_add="statue, sculpture, stained glass, window, gothic, chandelier, lantern, cathedral, church, sky, sun, trees, grass, "
                "water, fire, flames, snow, ice, robot, vehicle, warehouse, shelves, factory, corridor"),
    # A1 v3: v2 (9311-9314) overshot into abstract white strokes with no ledge; v3 softens the high key and restores the ground.
    "a1v3": dict(subject="abyss", prompt=(
        "final fantasy x-2, farplane abyss, (white void:1.2), (pale white fog:1.2), soft pale grey and pearl white, "
        "(a wide flat ledge of pale stone in the foreground to stand on:1.35), eye level view, "
        "(silhouettes of broken floating stone fragments drifting in the fog:1.1), faint pale gold light from above, "
        "a few tiny drifting soft motes of light, dreamlike, silent, lonely, ethereal, empty, no horizon"),
        neg_add="dark, black, night, flowers, flower field, grass, pink, purple, lavender, mountains, trees, water, "
                "sunset, stars, building, pillars, stairs, statue, bird, wings, feather, abstract"),
}


def get(path: str):
    with urllib.request.urlopen(HOST + path, timeout=30) as r:
        return json.loads(r.read())


def post(path: str, body: dict):
    req = urllib.request.Request(HOST + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def graph(positive: str, negative: str, seed: int, prefix: str, init: str | None = None, denoise: float = 1.0) -> dict:
    g = {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "animagine-xl-4.0-opt.safetensors"}},
        "5": {"class_type": "EmptyLatentImage", "inputs": {"width": 1344, "height": 768, "batch_size": 1}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": positive, "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": negative, "clip": ["4", 1]}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": 30, "cfg": 6, "sampler_name": "euler_ancestral", "scheduler": "normal",
            "denoise": 1, "model": ["4", 0], "positive": ["6", 0], "negative": ["7", 0], "latent_image": ["5", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "10": {"class_type": "UpscaleModelLoader", "inputs": {"model_name": "RealESRGAN_x4plus.pth"}},
        "11": {"class_type": "ImageUpscaleWithModel", "inputs": {"upscale_model": ["10", 0], "image": ["8", 0]}},
        "12": {"class_type": "ImageScaleBy", "inputs": {"image": ["11", 0], "upscale_method": "lanczos", "scale_by": 0.5}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["12", 0]}},
    }
    if init:
        # img2img from a laid-out init (a base render with the hole painted in), as comfy.mjs --img2img does
        g["30"] = {"class_type": "LoadImage", "inputs": {"image": init, "upload": "image"}}
        g["31"] = {"class_type": "ImageScale", "inputs": {"image": ["30", 0], "upscale_method": "lanczos", "width": 1344, "height": 768, "crop": "center"}}
        g["32"] = {"class_type": "VAEEncode", "inputs": {"pixels": ["31", 0], "vae": ["4", 2]}}
        g["3"]["inputs"]["latent_image"] = ["32", 0]
        g["3"]["inputs"]["denoise"] = denoise
    return g


def wait_for_idle() -> None:
    while True:
        q = get("/queue")
        if not q.get("queue_pending") and not q.get("queue_running"):
            return
        time.sleep(8)


def main() -> None:
    args = sys.argv[1:]
    init_path, denoise, tag = None, 1.0, ""
    if "--init" in args:
        i = args.index("--init"); init_path = args[i + 1]; del args[i:i + 2]
    if "--denoise" in args:
        i = args.index("--denoise"); denoise = float(args[i + 1]); del args[i:i + 2]
    if "--tag" in args:
        i = args.index("--tag"); tag = args[i + 1]; del args[i:i + 2]
    key = args[0]
    seeds = [int(s) for s in args[1:]]
    init_name = None
    if init_path:
        init_name = f"ixion-scene-init-{key}{tag}.png"
        Image.open(init_path).convert("RGB").save(os.path.join(COMFY_INPUT, init_name))
    opt = OPTIONS[key]
    positive = f"no humans, scenery, {opt['prompt']}, {TAIL}, {QUALITY}"
    negative = f"{BASE_NEG}, {opt['neg_add']}"
    os.makedirs(OUT, exist_ok=True)
    for seed in seeds:
        wait_for_idle()
        prefix = f"pyrefly/ixion-scene-{key}{tag}-{seed}"
        pid = post("/prompt", {"prompt": graph(positive, negative, seed, prefix, init_name, denoise)})["prompt_id"]
        while True:
            h = get(f"/history/{pid}")
            if pid in h and h[pid].get("status", {}).get("status_str") == "error":
                raise SystemExit(f"render error {prefix}: {h[pid]['status']}")
            if pid in h and h[pid].get("outputs"):
                break
            time.sleep(4)
        img = h[pid]["outputs"]["9"]["images"][0]
        url = f"/view?filename={img['filename']}&subfolder={img['subfolder']}&type={img['type']}"
        with urllib.request.urlopen(HOST + url, timeout=120) as r:
            data = r.read()
        dst = os.path.join(OUT, f"raw-{key}{tag}-{seed}.png")
        with open(dst, "wb") as f:
            f.write(data)
        im = Image.open(dst).convert("RGB")
        mx = max(e[1] for e in im.getextrema())
        if mx < 8:
            raise SystemExit(f"ALL-BLACK render {dst}: stopping (GPU state; do not restart ComfyUI, report)")
        im.resize((672, 384), Image.LANCZOS).save(dst[:-4] + "-peek.jpg", quality=82)
        meta = dict(option=key, subject=opt["subject"], seed=seed, prompt=positive, negative=negative,
                    model="animagine-xl-4.0-opt.safetensors", upscaler="RealESRGAN_x4plus.pth", steps=30, cfg=6,
                    sampler="euler_ancestral", scheduler="normal", canvas=dict(width=1344, height=768),
                    output=dict(width=im.width, height=im.height), status="CANDIDATE (options only, not installed)",
                    game="FFX-2 only", source="research/ffx2-ixion-djose.md 6.1 (chamber), 7.2 (abyss); written descriptions only",
                    init=init_path, denoise=denoise,
                    generatedAt=time.strftime("%Y-%m-%dT%H:%M:%S"))
        with open(dst[:-4] + ".json", "w") as f:
            json.dump(meta, f, indent=2)
        print("ok", dst, "max", mx, flush=True)


if __name__ == "__main__":
    main()
