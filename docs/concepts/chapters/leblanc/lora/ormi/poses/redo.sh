#!/usr/bin/env bash
# Ormi redo after the independent judge (judge.md, 2026-09-23), FFX-2 only.
# Frame edits, not prompt words (hard rule 15): each step is repaint.mjs on the frame the
# judge named, 6 candidates, behind an empty shared ComfyUI queue (repaint.mjs waits).
#   bash redo.sh <step>      steps: hurt-heart attack-hem attack-hem2 attack-hem3 attack-blend attack-brooch ko-style ko-shield ko-blend (see redo.md)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
R() { node "$HERE/repaint.mjs" "$@"; }
REF=D:/Tools/pyrefly-lora/ormi/poses/redo/refs
IDLESQ=D:/Tools/pyrefly-lora/ormi/poses/refs/idle-square.png
case "$1" in
  hurt-heart)
    # judge redo 1: hurt p5 960242 (a real wince, idle's hem and finish, shield face visible) + the heart
    R hurt hurt.p5.960242 heart --ellipse 210,625,60,225 --seeds 971001,971002,971003,971004,971005,971006 \
      --denoise 0.8 --lora 0 --ref $REF/cast-shield.png --refWeight 0.5 \
      --positive "round shield seen from the side, purple shield face, sunburst lines, gold rim, studded rim, (large red heart emblem:1.35), (heart symbol:1.2), heart, emblem painted on shield" \
      --negative "face, head, eyes, hand, person, text, letters, star, cross, skull, flower" ;;
  attack-hem)
    # judge redo 2: both hakama hem bands (washed-out white with beige flames) -> purple with a gold diamond hem, cast's hem as reference
    R attack attack.p3.960022.erase.back970023 hem \
      --poly 48,955,50,915,140,868,250,875,330,930,352,1050,250,1068,135,1072,80,1000 \
      --poly 472,982,470,915,540,870,578,875,668,940,674,1004,600,1010,520,1004 \
      --seeds 972001,972002,972003,972004,972005,972006 --denoise 0.75 --lora 0.8 \
      --ref $REF/cast-hem.png --refWeight 0.6 \
      --positive "ormiX2, purple hakama, long hakama, pleated hakama, dark purple cloth, (gold diamond pattern hem:1.3), argyle hem, gold trim, sandals" \
      --negative "white cloth, flame pattern, fire, transparent, translucent, fade, gradient, lace, frills, skirt" ;;
  attack-hem2)
    # the 0.75 pass kept the white band's pale value; repaint the purple-prefilled bands (…fill, see redo.md) instead
    R attack attack.p3.960022.erase.back970023.fill hem       --poly 48,955,50,915,140,868,250,875,330,930,352,1050,250,1068,135,1072,80,1000       --poly 472,982,470,915,540,870,578,875,668,940,674,1004,600,1010,520,1004       --seeds 972011,972012,972013,972014,972015,972016 --denoise 0.7 --lora 0.8       --ref $REF/cast-hem.png --refWeight 0.6       --positive "ormiX2, purple hakama, long hakama, pleated hakama, dark purple cloth, (gold diamond pattern hem:1.3), argyle hem, gold trim, sandals"       --negative "white cloth, flame pattern, fire, transparent, translucent, fade, gradient, lace, frills, skirt, blue cloth" ;;
  ko-style)
    # judge redo 3: floor shape erased (ko.p4.960336.heart970103.floor), then whole-frame img2img with idle + cast as the style reference
    POS="$(node -e "const j=require('D:/Tools/pyrefly-lora/ormi/poses/ko/ko.p4.960336.json');console.log(j.positive.split(', official art')[0])")"
    for d in "0.2 973001,973002,973003" "0.25 973004,973005,973006"; do
      set -- $d
      R ko ko.p4.960336.heart970103.floor style --whole 1 --feather 0 --seeds "$2" --denoise "$1" --lora 0.8 \
        --ref "$IDLESQ,$REF/cast-square.png" --refWeight 0.8 --refType "style transfer" \
        --positive "$POS, flat color, matte" \
        --negative "glossy, shiny, shiny skin, shiny clothes, airbrush, neon, glowing edges, rim light, 3d, realistic, gradient, orange sleeves, blue shield, floor, shadow on floor, reflection"
    done ;;
  attack-hem3)
    # hem2 turned the purple fill grey-mauve; inpaint mode (VAEEncodeForInpaint, denoise 1) paints the bands from scratch
    R attack attack.p3.960022.erase.back970023 hem3 --inpaint 1       --poly 48,955,50,915,140,868,250,875,330,930,352,1050,250,1068,135,1072,80,1000       --poly 472,982,470,915,540,870,578,875,668,940,674,1004,600,1010,520,1004       --seeds 972021,972022,972023,972024,972025,972026 --lora 0.8       --ref $REF/cast-hem.png --refWeight 0.6       --positive "ormiX2, purple hakama, long hakama, pleated hakama, (dark purple cloth:1.2), (gold diamond pattern hem:1.3), argyle hem, gold trim"       --negative "white cloth, grey cloth, pink cloth, flame pattern, fire, transparent, translucent, fade, gradient, lace, frills, skirt, blue cloth, skin, feet" ;;
  attack-blend)
    # after hemfix.py (pixel re-colour + cast's diamond row): a light pass over the bands to blend the edit in
    for d in "0.3 972031,972032,972033" "0.4 972034,972035,972036"; do
      set -- $d
      R attack attack.p3.960022.erase.back970023.hemfix blend         --poly 36,962,40,912,130,855,262,866,336,928,336,1054,252,1086,132,1084,70,1012         --poly 466,988,466,912,530,855,582,855,672,932,676,1014,600,1020,518,1014         --seeds "$2" --denoise "$1" --lora 0.8 --ref $REF/cast-hem.png --refWeight 0.4         --positive "ormiX2, purple hakama, long hakama, pleated hakama, dark purple cloth, (gold diamond pattern hem:1.3), argyle hem, gold trim, black outline"         --negative "white cloth, grey cloth, flame pattern, fire, transparent, translucent, fade, gradient, lace, frills, skin"
    done ;;
  attack-brooch)
    # on the blend pick (972035): paint out the invented red heart brooch on the shoulder
    R attack attack.p3.960022.erase.back970023.hemfix.blend972035 brooch --ellipse 510,420,36,28       --seeds 972041,972042,972043,972044,972045,972046 --denoise 0.75 --lora 0.8       --positive "ormiX2, purple armor, purple kimono, shoulder, plain cloth, gold trim"       --negative "heart, brooch, emblem, jewel, badge, red, pin, face, eye" ;;
  ko-shield)
    # after the style pass (pick style973004): the shield face (blue centre, red band) -> idle's purple sunburst with the heart,
    # cast's shield as reference; the disc is clipped at y 442 above his belly
    R ko ko.p4.960336.heart970103.floor.style973004 shield --poly 689,322,686,359,676,395,661,428,639,442,613,442,583,442,550,442,514,442,477,442,440,442,404,442,371,442,341,442,315,442,293,428,278,395,268,359,265,322,268,285,278,249,293,216,315,186,341,160,371,138,404,123,440,113,477,110,514,113,550,123,583,138,613,160,639,186,661,216,676,249,686,285,689,322       --seeds 974001,974002,974003,974004,974005,974006 --denoise 0.85 --lora 0       --ref $REF/cast-shield.png --refWeight 0.6       --positive "round shield, purple shield face, (purple sunburst:1.2), radiating lines, (large red heart emblem:1.35), heart symbol, emblem painted on shield"       --negative "face, head, eyes, hand, person, text, letters, star, cross, skull, flower, blue, concentric circles, red ring" ;;
  ko-blend)
    # after shieldfix.py (idle's red band + purple sunburst face, heart kept): a light pass over the disc to blend it
    for d in "0.3 974011,974012,974013" "0.38 974014,974015,974016"; do
      set -- $d
      R ko ko.p4.960336.heart970103.floor.style973004.shieldfix blend --poly 689,322,686,359,676,395,661,428,639,442,613,442,583,442,550,442,514,442,477,442,440,442,404,442,371,442,341,442,315,442,293,428,278,395,268,359,265,322,268,285,278,249,293,216,315,186,341,160,371,138,404,123,440,113,477,110,514,113,550,123,583,138,613,160,639,186,661,216,676,249,686,285,689,322         --seeds "$2" --denoise "$1" --lora 0 --ref "$IDLESQ,$REF/cast-shield.png" --refWeight 0.5         --positive "round shield, gold rim, studded rim, red band, purple shield face, (purple sunburst:1.2), radiating lines, (red heart emblem:1.3), emblem painted on shield"         --negative "face, head, eyes, hand, person, text, letters, star, cross, skull, flower, blue, glossy, neon"
    done ;;
  *) echo "step?"; exit 1 ;;
esac
