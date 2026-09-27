#!/bin/bash
# FF7 art cleanup round (2026-09-27): masked latent inpaints on our own round-2 picks, one pass per
# fault, each on its own paintover (paint.py) and mask. Nothing is mirrored; no retail input; no
# IP-Adapter. Submits only while fewer than 2 prompts are pending on the shared ComfyUI.
# Usage: bash run-cleanup.sh <barret|barret-b|barret-c|barret-d|barret-arm|cloud|cloud-b|gs-idle|gs-raised>, in the order the README gives
cd "D:/Final Fantasy"
C=D:/Tools/pyrefly-art-backup/candidates/2026-09-27-ff7
S=$C/cleanup-scratch
waitq() { while [ "$(curl -s http://127.0.0.1:8188/queue | D:/Tools/ComfyUI/python_embeded/python.exe -s -c 'import json,sys;d=json.load(sys.stdin);print(len(d["queue_pending"]))')" -ge 2 ]; do sleep 15; done; }
STYLE="official art, cel shading, soft shading, muted colors, detailed"
# inp <paint> <mask> <box> <identity> <tags> <negAdd> <denoise> <count> <seed> <out>
inp() { waitq; node tools/gen/inpaint.mjs --image "$S/$1" --mask "$S/$2" --box "$3" --pad 16 --latent \
  --identity "$4" --tags "$5" --negAdd "$6" --style "$STYLE" --denoise $7 --count $8 --seed $9 --out "${10}" 2>&1 | grep -E "\->|BLACK|rror|failed"; }

case "$1" in
barret)
  O=$C/barret/cleanup; mkdir -p "$O"
  B="1boy, barret wallace, final fantasy vii, dark-skinned male, muscular, simple background, white background"
  inp b-hair-paint.png b-hair-mask.png 350,95,140,100 "$B, (hi-top fade:1.3), tall flat-top black hair, (coarse textured hair:1.2), kinky hair texture, soft hair edges, short faded sides" \
    "hair" "hat, cap, fez, helmet, flat black block, mohawk, spiked hair, afro, dreadlocks, smooth hair" 0.55 2 9101 "$O/hair-055"
  inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$B, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
    "leather vest" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool" 0.55 2 9201 "$O/vest-055"
  inp b-waist-paint.png b-waist-mask.png 325,505,250,285 "$B, (several metal bands around his waist:1.3), stacked steel rings around the waist, bare stomach, dark green pants" \
    "metal bands, waist" "belt buckle, leather belt, diagonal strap, sash, canister, pouch, holster, bandolier" 0.58 3 9301 "$O/waist-058"
  inp b-finish-paint.png b-finish-mask.png 120,355,545,840 "$B, matte brown leather boots, brown skin, dark green pants" \
    "matte, soft shading" "glossy, shiny, specular highlights, patent leather, latex, wet, red skin, sunburn" 0.35 2 9401 "$O/finish-035"
  ;;
barret-b)
  # second pass after LOOKING at the first: 0.55 turned the hair into straight spikes and brought
  # the fleece back (the character tag pulls it in), so lower denoise and no character tag on the vest
  O=$C/barret/cleanup; mkdir -p "$O"
  B="1boy, barret wallace, final fantasy vii, dark-skinned male, muscular, simple background, white background"
  M="1boy, dark-skinned male, muscular, simple background, white background"
  H="(high-top fade:1.3), tall flat-top black hair, (dense coarse tightly coiled hair:1.2), soft fuzzy hair edges, short faded sides"
  inp b-hair-paint.png b-hair-mask.png 350,95,140,100 "$B, $H" \
    "hair" "hat, cap, fez, helmet, flat black block, mohawk, spiked hair, straight hair, afro, dreadlocks, smooth hair" 0.42 2 9111 "$O/hair-042"
  inp b-hair-paint.png b-hair-mask.png 350,95,140,100 "$B, $H" \
    "hair" "hat, cap, fez, helmet, flat black block, mohawk, spiked hair, straight hair, afro, dreadlocks, smooth hair" 0.48 2 9121 "$O/hair-048"
  inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$M, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
    "leather vest" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool, fur lining" 0.38 2 9211 "$O/vest-038"
  inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$M, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
    "leather vest" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool, fur lining" 0.45 2 9221 "$O/vest-045"
  inp b-arm-paint.png b-arm-mask.png 270,355,70,110 "$B, brown skin, muscular upper arm" \
    "skin, matte" "red skin, sunburn, glossy, shiny, specular highlights, rim light" 0.4 2 9411 "$O/arm-040"
  ;;
barret-c)
  # third pass: the vest paint now also covers the pure-white inside of the trim (it was skipped
  # as "background" before, so the fleece survived every vest render above)
  O=$C/barret/cleanup
  M="1boy, dark-skinned male, muscular, simple background, white background"
  inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$M, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
    "leather vest" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool, fur lining" 0.4 2 9231 "$O/vest-c040"
  inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$M, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
    "leather vest" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool, fur lining" 0.48 2 9241 "$O/vest-c048"
  ;;
cloud-b)
  O=$C/cloud/cleanup; mkdir -p "$O"
  K="1boy, cloud strife, final fantasy vii, spiky blonde hair, fair skin, brown gloves, simple background, white background"
  inp c-far-paint.png c-far-mask.png 290,525,80,65 "$K, (white cloth wristband on the wrist:1.2), white fabric wrist band" \
    "wristband" "metal cuff, bracelet, armor, chain, silver, metallic" 0.4 2 9511 "$O/far-040"
  inp c-near-paint.png c-near-mask.png 440,500,80,72 "$K, bare forearm, gear-shaped metal armlet" \
    "bare forearm, skin" "wristband, bandage, wrap, white cloth, sleeve, sweatband" 0.42 2 9611 "$O/near-042"
  ;;
cloud)
  O=$C/cloud/cleanup; mkdir -p "$O"
  K="1boy, cloud strife, final fantasy vii, spiky blonde hair, fair skin, brown gloves, simple background, white background"
  inp c-far-paint.png c-far-mask.png 290,525,80,65 "$K, (white wristband on the wrist:1.2), white cloth wrist band" \
    "wristband" "metal cuff, bracelet, armor, chain" 0.5 2 9501 "$O/far-050"
  inp c-near-paint.png c-near-mask.png 440,500,80,72 "$K, bare forearm, gear-shaped metal armlet" \
    "bare forearm, skin" "wristband, bandage, wrap, white cloth, sleeve, sweatband" 0.5 2 9601 "$O/near-050"
  ;;
gs-idle)
  O=$C/guard-scorpion/cleanup; mkdir -p "$O"
  G="no humans, robot, mecha, mechanical scorpion, giant red security robot, final fantasy vii, simple background, white background"
  inp gs-idle-paint.png gs-idle-mask.png 660,245,380,360 "$G, plain dark armor panel, blank metal plate" \
    "plain panel" "text, letters, symbols, writing, logo, numbers, glyph, sign, label, kanji, characters, display screen, digits" 0.45 2 9701 "$O/idle-body-045"
  ;;
gs-raised)
  O=$C/guard-scorpion/cleanup; mkdir -p "$O"
  G="no humans, robot, mecha, mechanical scorpion, giant red security robot, final fantasy vii, segmented scorpion tail raised, red armor blocks, simple background, white background"
  inp gs-raised-paint.png gs-raised-mask.png 150,100,280,345 "$G, plain red armor plates" \
    "plain armor" "text, letters, symbols, writing, logo, numbers, glyph, sign, label, kanji, characters, decal, digits" 0.45 2 9801 "$O/raised-tail-045"
  ;;
esac
# barret-arm: the far arm again, on the darker shadow-side paint (see paint.py step 5)
if [ "$1" = "barret-arm" ]; then
  O=$C/barret/cleanup
  B="1boy, barret wallace, final fantasy vii, dark-skinned male, muscular, simple background, white background"
  inp b-arm-paint.png b-arm-mask.png 270,355,70,110 "$B, brown skin, muscular upper arm in shadow" \
    "skin, matte" "red skin, sunburn, glossy, shiny, specular highlights, rim light" 0.36 2 9421 "$O/arm-036"
fi
# barret-d: the vest on the smoothed paint (clean silhouette, a clean arc on the near shoulder)
if [ "$1" = "barret-d" ]; then
  O=$C/barret/cleanup
  M="1boy, dark-skinned male, muscular, simple background, white background"
  for DN in 0.42 0.5; do
    inp b-vest-paint.png b-vest-mask.png 270,285,380,155 "$M, brown leather vest, sleeveless vest, plain stitched leather armhole edge, skull tattoo on shoulder" \
      "leather vest, clean edges" "fur trim, fleece, sheepskin, shearling, fur collar, fluffy, white trim, wool, fur lining, frayed, torn" $DN 2 9251 "$O/vest-d${DN#0.}"
  done
fi
