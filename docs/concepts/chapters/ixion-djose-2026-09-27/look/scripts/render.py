"""Paint the FFX-2 Ixion look candidates on the shared ComfyUI (FFX-2 only; options, nothing installed).

Identity base: our own FFX Ixion painting (public/art/characters/ixion/idle.png, shipped by D-089),
used as the img2img init and the IP-Adapter reference. Written descriptions only; no retail images.
Facing: the stored idle already faces screen-left (FFX-2 bosses stand on the right).

Politeness rules for the shared GPU: submit only while fewer than 3 prompts are pending; never
restart ComfyUI; an all-black render stops the run. Never deletes anything.

    python docs/concepts/chapters/ixion-djose-2026-09-27/look/scripts/render.py <option> <seed> [<seed>...]
option: c (machina-fused) or d (storm fiend). Raw renders go to the candidates folder.
"""
from __future__ import annotations

import json
import os
import shutil
import sys
import time
import urllib.request

from PIL import Image, ImageEnhance

ROOT = os.getcwd()
HOST = "http://127.0.0.1:8188"
COMFY_INPUT = r"D:\Tools\ComfyUI\ComfyUI\input"
OUT = r"D:\Tools\pyrefly-art-backup\candidates\2026-09-27-ixion"
SRC = os.path.join(ROOT, "public", "art", "characters", "ixion", "idle.png")
W, H = 1216, 832

BASE_NEG = ("lowres, bad anatomy, text, error, cropped, worst quality, low quality, low score, bad score, "
            "average score, jpeg artifacts, signature, watermark, username, blurry, artist name, multiple views, "
            "paint splatter, ink splash, colorful background, abstract background, facing viewer, front view, "
            "straight-on, symmetrical, from behind, facing away, rider, 1girl, 1boy, saddle, wings, human, "
            "purple mane, pink mane, unicorn girl, pedestal, rock, floor, ground, magic circle, extra legs, "
            "two horns, extra horns")
TAIL = ("aeon, standing, all four legs on the ground, head raised, looking at viewer, (from side:1.15), "
        "three-quarter view, (looking at viewer:1.2), full body, centered, imposing, simple background, "
        "white background, official art, cel shading, soft shading, vibrant colors, rim lighting, detailed, "
        "masterpiece, high score, great score, absurdres")

OPTIONS = {
    # FFExodus alone says the Djose Ixion "had melded with machina" (research 6.2, IX-8, single source).
    "c": dict(
        prompt=("1other, solo, no humans, monster, single unicorn, horse, quadruped, long golden horn, "
                "dark blue hide, grey mane, grey tail, (cyborg:1.3), (machine parts fused into the flesh:1.3), "
                "(gunmetal grey riveted steel plates:1.3), exposed black cables and wires, hydraulic pistons on the legs, "
                "bolts, scrap metal, rusted iron, exhaust pipes, gears, industrial machinery, glowing amber lamps, "
                "gold bracers on front legs, "
                "final fantasy x-2, " + TAIL),
        negative=BASE_NEG + ", robot girl, humanoid, mecha pilot, cockpit, wheels, clean chrome, ornate gold armor, fire, flames, burning",
        denoise=0.76, ref_weight=0.30),
    # House style, not canon: the aeon as an unsent fiend of Shuyin's pyreflies, storm-dark.
    "d": dict(
        prompt=("1other, solo, no humans, monster, single unicorn, horse, quadruped, long golden horn, "
                "(black hide:1.2), very dark navy skin, ragged grey mane, torn tattered mane, grey tail, "
                "tarnished dark gold armor, cracked armor, glowing white eyes, (crackling lightning:1.2), "
                "electricity arcing over the body, pale blue sparks, dark smoke, ghostly wisps, "
                "floating glowing orbs, pyreflies, menacing, fiend, undead, final fantasy x-2, " + TAIL),
        negative=BASE_NEG + ", bright blue skin, clean armor, cute, pastel, fire, flames, burning",
        denoise=0.58, ref_weight=0.40),
}


def get(path: str):
    with urllib.request.urlopen(HOST + path, timeout=30) as r:
        return json.loads(r.read())


def post(path: str, body: dict):
    req = urllib.request.Request(HOST + path, data=json.dumps(body).encode(), headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())


def stage_init(key: str) -> str:
    """The FFX idle on white at the SDXL bucket, copied into ComfyUI's input under a fresh name."""
    name = f"ixion-ffx2-look-init-{key}.png"
    src = Image.open(SRC).convert("RGBA")
    if key == "d":
        # pre-grade the init toward the storm-dark look: hide near black, gold dulled (the sampler keeps the tones)
        a = src.getchannel("A")
        rgb = ImageEnhance.Color(src.convert("RGB")).enhance(0.55)
        rgb = ImageEnhance.Brightness(rgb).enhance(0.42)
        src = rgb.convert("RGBA"); src.putalpha(a)
    s = min((W - 40) / src.width, (H - 30) / src.height)
    sp = src.resize((int(src.width * s), int(src.height * s)), Image.LANCZOS)
    bg = Image.new("RGBA", (W, H), (255, 255, 255, 255))
    bg.alpha_composite(sp, ((W - sp.width) // 2, H - 15 - sp.height))
    os.makedirs(OUT, exist_ok=True)
    local = os.path.join(OUT, name)
    bg.convert("RGB").save(local)
    shutil.copyfile(local, os.path.join(COMFY_INPUT, name))
    return name


def graph(opt: dict, seed: int, init: str, prefix: str) -> dict:
    return {
        "4": {"class_type": "CheckpointLoaderSimple", "inputs": {"ckpt_name": "animagine-xl-4.0-opt.safetensors"}},
        "6": {"class_type": "CLIPTextEncode", "inputs": {"text": opt["prompt"], "clip": ["4", 1]}},
        "7": {"class_type": "CLIPTextEncode", "inputs": {"text": opt["negative"], "clip": ["4", 1]}},
        "20": {"class_type": "LoadImage", "inputs": {"image": init, "upload": "image"}},
        "21": {"class_type": "IPAdapterModelLoader", "inputs": {"ipadapter_file": "ip-adapter-plus_sdxl_vit-h.safetensors"}},
        "22": {"class_type": "CLIPVisionLoader", "inputs": {"clip_name": "CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors"}},
        "23": {"class_type": "IPAdapterAdvanced", "inputs": {
            "model": ["4", 0], "ipadapter": ["21", 0], "image": ["20", 0], "weight": opt["ref_weight"],
            "weight_type": "linear", "combine_embeds": "concat", "start_at": 0.25, "end_at": 0.85,
            "embeds_scaling": "K+V", "clip_vision": ["22", 0]}},
        "31": {"class_type": "ImageScale", "inputs": {"image": ["20", 0], "upscale_method": "lanczos", "width": W, "height": H, "crop": "center"}},
        "32": {"class_type": "VAEEncode", "inputs": {"pixels": ["31", 0], "vae": ["4", 2]}},
        "3": {"class_type": "KSampler", "inputs": {
            "seed": seed, "steps": 28, "cfg": 6, "sampler_name": "euler_ancestral", "scheduler": "normal",
            "denoise": opt["denoise"], "model": ["23", 0], "positive": ["6", 0], "negative": ["7", 0],
            "latent_image": ["32", 0]}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["3", 0], "vae": ["4", 2]}},
        "9": {"class_type": "SaveImage", "inputs": {"filename_prefix": prefix, "images": ["8", 0]}},
    }


def wait_for_room() -> None:
    while True:
        q = get("/queue")
        if len(q.get("queue_pending", [])) < 3:
            return
        time.sleep(10)


def main() -> None:
    key = sys.argv[1]
    seeds = [int(s) for s in sys.argv[2:]]
    opt = OPTIONS[key]
    init = stage_init(key)
    for seed in seeds:
        wait_for_room()
        prefix = f"ixion-ffx2-{key}-{seed}"
        pid = post("/prompt", {"prompt": graph(opt, seed, init, prefix)})["prompt_id"]
        while True:
            h = get(f"/history/{pid}")
            if pid in h and h[pid].get("outputs"):
                break
            if pid in h and h[pid].get("status", {}).get("status_str") == "error":
                raise SystemExit(f"render error {prefix}: {h[pid]['status']}")
            time.sleep(4)
        img = h[pid]["outputs"]["9"]["images"][0]
        url = f"/view?filename={img['filename']}&subfolder={img['subfolder']}&type={img['type']}"
        with urllib.request.urlopen(HOST + url, timeout=60) as r:
            data = r.read()
        dst = os.path.join(OUT, f"raw-{key}-{seed}.png")
        with open(dst, "wb") as f:
            f.write(data)
        mx = max(Image.open(dst).convert("RGB").getextrema(), key=lambda e: e[1])[1]
        if mx < 8:
            raise SystemExit(f"ALL-BLACK render {dst}: stopping (GPU state; do not restart, report)")
        meta = dict(option=key, seed=seed, prompt=opt["prompt"], negative=opt["negative"], denoise=opt["denoise"],
                    refWeight=opt["ref_weight"], ref="public/art/characters/ixion/idle.png",
                    init="public/art/characters/ixion/idle.png on white 1216x832" + (" (darkened 0.42, colour 0.55)" if key == "d" else ""), model="animagine-xl-4.0-opt",
                    steps=28, cfg=6, sampler="euler_ancestral", facing="left", status="CANDIDATE (options only)",
                    game="FFX-2 only")
        with open(dst[:-4] + ".json", "w") as f:
            json.dump(meta, f, indent=2)
        print("ok", dst, "max", mx, flush=True)


if __name__ == "__main__":
    main()
