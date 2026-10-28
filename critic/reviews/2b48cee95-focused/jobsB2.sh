cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
C=http://127.0.0.1:5901/
P=critic/reviews/2b48cee95-focused/bprobe.mjs; O=critic/reviews/2b48cee95-focused/bsw
for w in "stance=v1a" "stance=v1b" "stance=v3" "swapcause=cut" "swapcause=blend3" "swapcause=pick" "swapcause=cut&swapclass=hit,contact" "swapcause=cut&swapclass=zzz" "swapcause=cut&swapscope=all" "hit=ramp" "hit=knock" "rigko=whole" "fluidui=on" "govern=fixed"; do
  node $P $C $O "c1-${w//[^a-z0-9]/_}" seymour-flux 1600 900 "?$w" 
done
