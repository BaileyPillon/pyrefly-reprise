cd D:/Tools/pyrefly-scratch/gpu2/den
POS="1boy, nooj, final fantasy x-2, arm, elbow, black long glove, dark sleeve, anime coloring, cel shading, clean lineart, official art, masterpiece"
NEG="lowres, bad anatomy, blurry, jpeg artifacts, text, extra arms, extra hands, glow, sparkles, white background"
for s in 971203 971204; do
 "D:/Tools/ComfyUI/python_embeded/python.exe" repaint_ref.py work/n3-cast-pre.png work/n3-cast-mask.png work/n3-cast-rep-$s.png 490,205,790,505 $s 0.45 "$POS" "$NEG" --alpha keep
done
