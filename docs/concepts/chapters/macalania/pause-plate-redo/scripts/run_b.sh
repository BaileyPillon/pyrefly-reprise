#!/bin/sh
# usage: run_b.sh <seed>...
cd "D:/Final Fantasy"
for s in "$@"; do
node tools/gen/comfy.mjs hero --name ch7-plate-b --subject "Seymour (human form) in the Macalania antechamber" --mood "courteous and wrong: the host at the fayth's door" \
 --tags "1boy, seymour guado, final fantasy x, safe, solo, male focus, adult male, sharp facial features, pale skin, pale light blue hair, very long hair, long hair falling down his back, hair over one eye, purple eyes, human ears, dark navy blue robe, wide red band along the robe's front edge, open robe, bare chest" \
 --poseTags "macalania temple antechamber interior, tall arched doorway of glowing translucent blue ice behind him, carved ice pillars, gold metalwork set into the ice, a warm gold brazier glow on one side of his face, cold blue light on the other side, soft bokeh background, three-quarter view, looking at viewer, courteous serene smile, mouth closed, calm half-lidded eyes, (close-up of the face:1.2), head and shoulders, face fills the frame" \
 --emphasis "(pale light blue hair:1.2), (purple eyes:1.15), (courteous serene smile:1.1), (a glowing arched ice doorway behind him:1.15)" \
 --negAdd "crown, tiara, helmet, horns, staff, weapon, (pointy ears:1.2), elf ears, blonde hair, white hair, grin, open mouth, scar, facial scar, cracks on face, red lines on face, rooftop, roof, village, house, lantern, night sky, city lights, orange bokeh, feminine, androgynous, buttons, brooch, jewel, gem, necklace, coat, popped collar, vampire, heart pupils, star pupils, pink eyes, saturated cyan hair, armor, pauldrons, shoulder armor, gold armor, blue eyes, medium shot, cowboy shot" \
 --ref docs/concepts/chapters/macalania/pause-plate-redo/refs/ref-portrait-head.png --refWeight 0.4 --refWeightType "ease in" --refStart 0.2 --refEnd 0.6 \
 --seed $s --out "D:/Tools/pyrefly-scratch/picks0925/ch7-art/renders/b-$s.png" 2>&1 | grep -i -E "monochrome|->" 
done
