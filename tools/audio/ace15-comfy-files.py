"""Load ACE-Step 1.5's OFFICIAL files (ACE-Step/Ace-Step1.5 on Hugging Face, MIT) into ComfyUI.

  vae: re-key the official VAE (diffusers AutoencoderOobleck, from the ACE-Step/Ace-Step1.5
repo, MIT) into the stable-audio-tools layout that ComfyUI's AudioOobleckVAE loads. Tensor values
are copied unchanged; only names change, and the Snake alpha/beta lose their [1, C, 1] padding.
Written for music-model-test (2026-09-30); game case BOTH (shared audio plumbing).

  <comfy python> tools/audio/ace15-comfy-files.py vae --in <diffusers vae .safetensors> --out <file> [--check]
  <comfy python> tools/audio/ace15-comfy-files.py te --in <Qwen3 model.safetensors> --out <file>

  te:  the official Qwen3-Embedding-0.6B and acestep-5Hz-lm-1.7B text encoders store "layers.0..."
       where ComfyUI's ACE 1.5 loader looks for "model.layers.0..." (sd.py detect_te_model); this adds
       the "model." prefix to every tensor (lm_head too, as ComfyUI's Qwen3 wrapper expects) and
       changes nothing else. The DiT needs no conversion: ComfyUI loads the official
       acestep-v15-turbo/model.safetensors as is (its sha256 equals Comfy-Org's repackaged file).

--check loads the result into ComfyUI's AudioOobleckVAE (strides 2,4,4,6,10) with strict=True, so a
missing or extra key fails loudly. Run it with ComfyUI's embedded python from D:/Tools/ComfyUI/ComfyUI.

Layout (diffusers -> stable-audio-tools):
  encoder.conv1                           -> encoder.layers.0
  encoder.block.i.res_unitK.{snake1,conv1,snake2,conv2} -> encoder.layers.(i+1).layers.(K-1).layers.{0,1,2,3}
  encoder.block.i.{snake1,conv1}          -> encoder.layers.(i+1).layers.{3,4}
  encoder.{snake1,conv2}                  -> encoder.layers.{6,7}
  decoder.conv1                           -> decoder.layers.0
  decoder.block.i.{snake1,conv_t1}        -> decoder.layers.(i+1).layers.{0,1}
  decoder.block.i.res_unitK.*             -> decoder.layers.(i+1).layers.(K+1).layers.{0,1,2,3}
  decoder.{snake1,conv2}                  -> decoder.layers.{6,7}
  weight_g / weight_v                     -> parametrizations.weight.original0 / original1
"""

import argparse
import re
import sys

from safetensors.torch import load_file, save_file

RES = {'snake1': 0, 'conv1': 1, 'snake2': 2, 'conv2': 3}
PARAM = {'weight_g': 'parametrizations.weight.original0', 'weight_v': 'parametrizations.weight.original1'}


def leaf(name):
    return PARAM.get(name, name)


def rename(k):
    side, rest = k.split('.', 1)
    m = re.fullmatch(r'block\.(\d+)\.res_unit(\d)\.(snake1|conv1|snake2|conv2)\.(\w+)', rest)
    if m:
        i, u, mod, p = int(m[1]), int(m[2]), m[3], m[4]
        slot = (u - 1) if side == 'encoder' else (u + 1)
        return f'{side}.layers.{i + 1}.layers.{slot}.layers.{RES[mod]}.{leaf(p)}'
    m = re.fullmatch(r'block\.(\d+)\.(snake1|conv1|conv_t1)\.(\w+)', rest)
    if m:
        i, mod, p = int(m[1]), m[2], m[3]
        if side == 'encoder':
            slot = {'snake1': 3, 'conv1': 4}[mod]
        else:
            slot = {'snake1': 0, 'conv_t1': 1}[mod]
        return f'{side}.layers.{i + 1}.layers.{slot}.{leaf(p)}'
    m = re.fullmatch(r'(conv1|snake1|conv2)\.(\w+)', rest)
    if m:
        slot = {'conv1': 0, 'snake1': 6, 'conv2': 7}[m[1]]
        return f'{side}.layers.{slot}.{leaf(m[2])}'
    raise KeyError(k)


def te(a):
    src = load_file(a.inp)
    out = {k if k.startswith('model.') else f'model.{k}': v for k, v in src.items()}
    if len(out) != len(src):
        raise KeyError('prefix collision')
    save_file(out, a.out, metadata={'source': f'{a.inp} (ACE-Step/Ace-Step1.5, MIT), "model." prefix added'})
    print(f'{len(out)} tensors -> {a.out}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('kind', choices=['vae', 'te'])
    ap.add_argument('--in', dest='inp', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--check', action='store_true')
    a = ap.parse_args()
    if a.kind == 'te':
        te(a)
        return
    src = load_file(a.inp)
    out = {}
    for k, v in src.items():
        nk = rename(k)
        if nk.endswith('.alpha') or nk.endswith('.beta'):
            v = v.reshape(-1)
        if nk in out:
            raise KeyError(f'duplicate target {nk}')
        out[nk] = v.contiguous()
    save_file(out, a.out, metadata={'source': 'ACE-Step/Ace-Step1.5 vae/diffusion_pytorch_model.safetensors (MIT), re-keyed'})
    print(f'{len(out)} tensors -> {a.out}')
    if a.check:
        sys.path.insert(0, '.')
        from comfy.ldm.audio.autoencoder import AudioOobleckVAE
        m = AudioOobleckVAE(strides=[2, 4, 4, 6, 10])
        want = m.state_dict()
        bad = [k for k in out if k not in want or tuple(want[k].shape) != tuple(out[k].shape)]
        miss = [k for k in want if k not in out]
        print(f'check: {len(bad)} unknown or wrong-shape, {len(miss)} missing')
        if bad or miss:
            print(bad[:10], miss[:10])
            sys.exit(1)
        m.load_state_dict(out, strict=True)
        print('check: strict load OK')


if __name__ == '__main__':
    main()
