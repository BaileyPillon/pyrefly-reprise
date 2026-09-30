"""Codec floor of ACE-Step 1.5 (music-model-test, 2026-09-30). Game case: BOTH (shared audio plumbing).

The fb-0929 diagnosis (docs/handoff/fb-0929-music.md) measured that ACE-Step v1's own audio codec
(mel DCAE + vocoder) already smears the top, slows attacks and destroys the L/R phase relation on a
pure encode/decode round trip. This runs the SAME round trip on ACE-Step 1.5's autoencoder (a 48 kHz
stereo waveform VAE, diffusers AutoencoderOobleck, downloaded from the official ACE-Step/Ace-Step1.5
repo, MIT) so tools/audio/quality-measure.py can compare the two on the same inputs.

  <python with torch + diffusers> tools/audio/quality-vae15-roundtrip.py --vae DIR --in WAV --out WAV
      [--mode mean|sample] [--device cuda|cpu] [--null]

  --vae   folder holding config.json + diffusion_pytorch_model.safetensors
  --mode  mean: decode the posterior mean (the deterministic floor, default); sample: one draw
  --null  skip the VAE and only resample 44.1 -> 48 -> 44.1 kHz (proves the resampling is not the cause)

Input is decoded by ffmpeg to 48 kHz float stereo (soxr), the output is written as 48 kHz float WAV
(quality-measure.py resamples everything to 44.1 kHz itself). No sampling, no text, no generation:
nothing here can add content, it only shows what the codec keeps.
"""

import argparse
import json
import subprocess
import sys
import time

import numpy as np

SR = 48000


def read_48k(path):
    raw = subprocess.run(
        ['ffmpeg', '-v', 'error', '-i', path, '-af', 'aresample=resampler=soxr:precision=28',
         '-ar', str(SR), '-ac', '2', '-f', 'f32le', '-'],
        check=True, capture_output=True).stdout
    return np.frombuffer(raw, dtype='<f4').reshape(-1, 2).T.copy()


def write_f32_wav(path, x):
    # 32-bit float WAV via ffmpeg (the wave module writes PCM only)
    inter = np.ascontiguousarray(x.T.astype('<f4'))
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-c:a', 'pcm_f32le', path], input=inter.tobytes(), check=True)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vae', required=True)
    ap.add_argument('--in', dest='inp', required=True)
    ap.add_argument('--out', required=True)
    ap.add_argument('--mode', default='mean', choices=['mean', 'sample'])
    ap.add_argument('--device', default='cuda')
    ap.add_argument('--seed', type=int, default=0)
    ap.add_argument('--null', action='store_true')
    a = ap.parse_args()

    x = read_48k(a.inp)
    t0 = time.time()
    info = {'in': a.inp, 'out': a.out, 'samples': int(x.shape[1]), 'sr': SR}
    if a.null:
        y = x
        info['mode'] = 'null (resample only)'
    else:
        import torch
        from diffusers import AutoencoderOobleck
        dev = a.device if (a.device != 'cuda' or torch.cuda.is_available()) else 'cpu'
        vae = AutoencoderOobleck.from_pretrained(a.vae, torch_dtype=torch.float32).to(dev).eval()
        hop = int(np.prod(vae.config.downsampling_ratios))
        n = x.shape[1]
        pad = (-n) % hop
        xt = torch.from_numpy(np.pad(x, ((0, 0), (0, pad)), mode='edge'))[None].to(dev)
        g = torch.Generator(device=dev).manual_seed(a.seed)
        with torch.no_grad():
            post = vae.encode(xt).latent_dist
            z = post.mean if a.mode == 'mean' else post.sample(generator=g)
            y = vae.decode(z).sample[0, :, :n].float().cpu().numpy()
        info.update({'mode': a.mode, 'device': dev, 'hop': hop, 'latentShape': list(z.shape),
                     'latentHz': SR / hop})
    info['seconds'] = round(time.time() - t0, 2)
    info['inPeak'] = float(np.abs(x).max())
    info['outPeak'] = float(np.abs(y).max())
    err = y - x
    info['waveSnrDb'] = round(float(10 * np.log10((x ** 2).sum() / max((err ** 2).sum(), 1e-30))), 2)
    write_f32_wav(a.out, y)
    sys.stdout.write(json.dumps(info) + '\n')


if __name__ == '__main__':
    main()
