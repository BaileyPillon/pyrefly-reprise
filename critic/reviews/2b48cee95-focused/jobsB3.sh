cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
C=http://127.0.0.1:5901/
P=critic/reviews/2b48cee95-focused/bprobe.mjs; O=critic/reviews/2b48cee95-focused/bsw
for w in "stance=v1a" "stance=v3" "swapcause=cut" "swapcause=pick" "hit=ramp" "hit=knock" "run=smooth" "run=flow" "run=pace" "rigko=whole" "fluidui=on"; do
  node $P $C $O "c4-${w//[^a-z0-9]/_}" ffx2-bahamut 1600 900 "?$w"
done
node $P $C $O c4-all-on ffx2-bahamut 1600 900 "?stance=v3&swapcause=pick&hit=knock&run=flow&rigko=whole&fluidui=on&govern=fixed&swapscope=all"
node $P $C $O c1-all-on seymour-flux 1600 900 "?stance=v3&swapcause=pick&hit=knock&run=flow&rigko=whole&fluidui=on&govern=fixed&swapscope=all"
