P="/d/Final Fantasy/public/art/characters"
party=("$P/yuna-white-mage/idle.png@237,780,335" "$P/rikku-dark-knight/idle.png@485,708,288" "$P/paine-dark-knight/idle.png@682,653,252")
GIP="@1075,671,382,nocrop"   # figure 340 px tall (canvas 382 incl. the 70 px pad), ground at y 650
for t in c-pyrefly b-translucent c-anger b-violet; do python frame.py renders/plate-a.png shots/Gippal-hud.png frames/o1-$t.jpg "${party[@]}" "renders/gip-$t.png$GIP"; done
for k in a b c; do python frame.py renders/plate-$k.png shots/Gippal-hud.png frames/o3-$k.jpg "${party[@]}" "renders/gip-${O3T:-c-pyrefly}.png$GIP"; python frame.py renders/plate-$k.png - frames/o3-$k-clean.jpg; done
