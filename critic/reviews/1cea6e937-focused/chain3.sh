#!/bin/bash
cd "D:/pyrefly-release55/critic/reviews/1cea6e937-focused"
export PYREFLY_BROWSER=gpu
C=http://127.0.0.1:5420/pyrefly-reprise/; L=https://echoesofspira.com/
p() { timeout 200 node probe.mjs "$@" 2>&1 | cut -c1-1200 >> probe.out; echo "--- $5" >> probe.out; }
p $C - seymour-flux 1600x900 c-ch1-default - attack
p $C "?look=off" seymour-flux 1600x900 c-ch1-lookoff - attack
p $C "?motion=off" seymour-flux 1600x900 c-ch1-motionoff - attack
p $C - seymour-flux 1600x900 c-ch1-flashes flashes attack
p $C - ffx2-bahamut 1600x900 c-ch4-default - attack
p $C "?look=off" ffx2-bahamut 1600x900 c-ch4-lookoff - attack
p $C - yunalesca 1600x900 c-yuna - -
p $L - yunalesca 1600x900 l-yuna - -
p $C - ffx2-leblanc 1600x900 c-leblanc - -
p $L - ffx2-leblanc 1600x900 l-leblanc - -
p $L - seymour-flux 1600x900 l-ch1 - attack
p $L - ffx2-bahamut 1600x900 l-ch4 - attack
echo ALLDONE >> probe.out
