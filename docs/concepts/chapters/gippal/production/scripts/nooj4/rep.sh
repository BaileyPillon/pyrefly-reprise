# The two masked shoulder repaints (fur-shoulder fix), IP-Adapter forced on the picked portrait. Run from the scratch dir.
REF="D:/Final Fantasy/public/art/portraits/nooj.png"
POSR="1boy, nooj, final fantasy x-2, shoulder, upper arm, purple sleeve, grey fur trim at the top of the shoulder, fur-trimmed sleeve, black glove, anime coloring, cel shading, clean lineart, official art, masterpiece"
NEGR="lowres, bad anatomy, blurry, jpeg artifacts, text, extra arms, extra hands, glow, sparkles, white fur, face, eyes, glasses, mechanical arm, metal"
POSL="1boy, nooj, final fantasy x-2, shoulder, mechanical shoulder joint, machina prosthetic arm, blue metal pauldron, red bodysuit, anime coloring, cel shading, clean lineart, official art, masterpiece"
NEGL="lowres, bad anatomy, blurry, jpeg artifacts, text, extra arms, glow, sparkles, fur, fur trim, feathers, face, eyes, glasses"
for s in 972101 972102 972103; do python repaint_ref.py work/fx-pre.png work/fx-maskR.png work/fxR-$s.png 140,120,340,320 $s 0.6 "$POSR" "$NEGR" --alpha keep --ref "$REF" --ref-weight 0.45; done
for s in 972201 972202 972203; do python repaint_ref.py work/fx-pre.png work/fx-maskL.png work/fxL-$s.png 340,110,540,310 $s 0.6 "$POSL" "$NEGL" --alpha keep --ref "$REF" --ref-weight 0.45; done
# then: python fxfin.py; python castfx.py; python shade_b.py work/fx-idle-opaque.png work/fx-idle; python shade_b.py work/fx-cast-opaque.png work/fx-cast
# crop idle-b at (13,14,739,1288) and cast-b at (30,34,1179,1308); python install_fx.py "D:/Final Fantasy/public/art"
