#!/bin/bash
# Round 2 main batch, after the pilots were looked at (pilot-086 put the gun on the tattooed arm: 0.86 dropped for Barret).
. "$(dirname "$0")/common.sh"
br 0.82 idle-a 3
br 0.80 idle-b 2
cl 0.82 idle-a 3
cl 0.85 idle-b 2
gs gs2-low.png 0.80 idle-a "" 2
gs gs2-low.png 0.84 idle-b "" 2
gs gs2-raised.png 0.82 raised-a ", (scorpion tail raised high over its body:1.2), tail tip aimed forward" 3
echo DONE
