set -e
export INPAINT_WAIT_MIN=240
cd "/d/Final Fantasy"
for k in profile-left:pl:4301 q34-right:qr:4401; do
  IFS=: read key tag seed <<< "$k"
  node tools/gen/inpaint.mjs --image docs/concepts/pause-until-dawn/prototype-v2/art/v3/layers/heads/jobs/$key.src.png --mask docs/concepts/pause-until-dawn/prototype-v2/art/v3/layers/heads/jobs/$key.mask.png --latent --box 600,0,552,1000 --pad 0 --growMask 0 --feather 8 --tags "hair strands, back of head" --denoise 0.8 --count 4 --seed $seed     --identity "1girl, solo, brown hair, short hair, bob cut, back of head, hair strands, from side"     --style "anime coloring, cel shading, clean lineart, detailed hair, simple background, black background"     --negAdd "rainbow, multicolored hair, blue hair, pink hair, grey hair, braid, hair ornament, face, eyes, text, frame, border, rim light, glowing edges, helmet, hat"     --out docs/concepts/pause-until-dawn/prototype-v2/art/v3/layers/heads/jobs/out3/$tag
done
