cd D:/Tools/pyrefly-scratch/gpu2/den
POS="1boy, nooj, final fantasy x-2, brown hair, hair rings, hair loop, red hair tie, blue-tinted glasses, anime coloring, cel shading, clean lineart, official art, masterpiece"
NEG="lowres, bad anatomy, blurry, jpeg artifacts, text, extra ears, extra face, earring, horn, snail, ammonite, spiral, glow, sparkles, white background"
for s in 971101 971102 971103; do
 "D:/Tools/ComfyUI/python_embeded/python.exe" repaint_ref.py work/n94-pre.png work/n94-mask.png work/n94-rep-$s.png 170,0,370,200 $s 0.6 "$POS" "$NEG" --alpha keep --ref "D:/Final Fantasy/public/art/portraits/nooj.png" --ref-weight 0.55
done
