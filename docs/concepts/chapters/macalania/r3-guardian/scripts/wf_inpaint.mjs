// build an upscale+masked-inpaint workflow: node wf_inpaint.mjs <init> <mask> <pos> <neg> <seeds,> <denoises,> <out.json> [ref weight]
import { writeFileSync } from 'node:fs';
const [init, mask, pos, neg, seeds, dens, out, refW, ref] = process.argv.slice(2);
const g = {
  1: { class_type: 'CheckpointLoaderSimple', inputs: { ckpt_name: 'animagine-xl-4.0-opt.safetensors' } },
  2: { class_type: 'CLIPTextEncode', inputs: { text: pos, clip: ['1', 1] } },
  3: { class_type: 'CLIPTextEncode', inputs: { text: neg, clip: ['1', 1] } },
  4: { class_type: 'LoadImage', inputs: { image: init, upload: 'image' } },
  5: { class_type: 'UpscaleModelLoader', inputs: { model_name: 'RealESRGAN_x4plus.pth' } },
  6: { class_type: 'ImageUpscaleWithModel', inputs: { upscale_model: ['5', 0], image: ['4', 0] } },
  7: { class_type: 'ImageScale', inputs: { image: ['6', 0], upscale_method: 'lanczos', width: 1024, height: 1024, crop: 'disabled' } },
  8: { class_type: 'VAEEncode', inputs: { pixels: ['7', 0], vae: ['1', 2] } },
  9: { class_type: 'LoadImage', inputs: { image: mask, upload: 'image' } },
  10: { class_type: 'ImageToMask', inputs: { image: ['9', 0], channel: 'red' } },
  11: { class_type: 'SetLatentNoiseMask', inputs: { samples: ['8', 0], mask: ['10', 0] } },
  12: { class_type: 'SaveImage', inputs: { filename_prefix: 'pyrefly/r3-guardian-up', images: ['7', 0] } },
};
let model = ['1', 0];
if (refW && Number(refW) > 0) {
  g[20] = { class_type: 'LoadImage', inputs: { image: ref, upload: 'image' } };
  g[21] = { class_type: 'IPAdapterModelLoader', inputs: { ipadapter_file: 'ip-adapter-plus_sdxl_vit-h.safetensors' } };
  g[22] = { class_type: 'CLIPVisionLoader', inputs: { clip_name: 'CLIP-ViT-H-14-laion2B-s32B-b79K.safetensors' } };
  g[23] = { class_type: 'IPAdapterAdvanced', inputs: { model, ipadapter: ['21', 0], image: ['20', 0], weight: Number(refW), weight_type: 'ease in', combine_embeds: 'concat', start_at: 0.2, end_at: 0.6, embeds_scaling: 'K+V', clip_vision: ['22', 0] } };
  model = ['23', 0];
}
const S = seeds.split(',').map(Number), D = dens.split(',').map(Number);
S.forEach((seed, i) => {
  const k = 100 + i * 3;
  g[k] = { class_type: 'KSampler', inputs: { seed, steps: 30, cfg: 6, sampler_name: 'euler_ancestral', scheduler: 'normal', denoise: D[i % D.length], model, positive: ['2', 0], negative: ['3', 0], latent_image: ['11', 0] } };
  g[k + 1] = { class_type: 'VAEDecode', inputs: { samples: [String(k), 0], vae: ['1', 2] } };
  g[k + 2] = { class_type: 'SaveImage', inputs: { filename_prefix: `pyrefly/r3-guardian-s${seed}`, images: [String(k + 1), 0] } };
});
writeFileSync(out, JSON.stringify(g, null, 1));
