#!/bin/bash
# usage: matrix.sh TAG   -> four parallel streams over the whole proof matrix (HUD 3 chapters x 3 viewports x 3 sizes, pause 2 games x 3 viewports x 3 sizes)
TAG=$1
cd "D:/Tools/pyrefly-scratch/2026-10-04/r39-judg"
mkdir -p logs
(./sweep2.sh $TAG 1600x900 menu,step2,target "ffx2-bahamut ffx2-vegnagun-shuyin ffx2-leblanc" "1 1.15 1.3" > logs/$TAG-A.log 2>&1) &
(./sweep2.sh $TAG 2000x1012 menu,step2,target "ffx2-bahamut ffx2-vegnagun-shuyin ffx2-leblanc" "1 1.15 1.3" > logs/$TAG-B.log 2>&1; ./sweep2.sh $TAG 390x844 menu,step2 "ffx2-bahamut ffx2-vegnagun-shuyin ffx2-leblanc" "1 1.15 1.3" --touch > logs/$TAG-C.log 2>&1) &
(for vp in 1600x900 2000x1012; do ./sweep2.sh $TAG $vp pause "seymour-flux" "1 1.15 1.3"; done > logs/$TAG-D1.log 2>&1; ./sweep2.sh $TAG 390x844 pause "seymour-flux" "1 1.15 1.3" --touch >> logs/$TAG-D1.log 2>&1) &
(for vp in 1600x900 2000x1012; do ./sweep2.sh $TAG $vp pause "ffx2-bahamut" "1 1.15 1.3"; done > logs/$TAG-D2.log 2>&1; ./sweep2.sh $TAG 390x844 pause "ffx2-bahamut" "1 1.15 1.3" --touch >> logs/$TAG-D2.log 2>&1) &
wait
echo done > logs/$TAG-DONE
