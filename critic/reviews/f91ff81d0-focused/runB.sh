#!/bin/bash
cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
D=critic/reviews/f91ff81d0-focused
# wait until the continuity chain has finished, then take the lock for job B
until grep -q ALLDONE $D/runC.log; do sleep 20; done
sleep 100
bash $D/lock.sh take 10 || exit 1
node $D/job-layout.mjs 2>&1 | cut -c1-900
bash $D/lock.sh drop
echo BDONE
