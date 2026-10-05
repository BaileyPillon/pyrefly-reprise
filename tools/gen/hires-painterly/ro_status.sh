#!/bin/bash
tr -d '\0' < /d/Tools/pyrefly-scratch/2026-10-04/r39-art/logs/ro-run.log | grep -E "^20[0-9]{2}-" | tail -n ${1:-6} | cut -c1-250
python - <<'PY'
import json
p=json.load(open('D:/Tools/pyrefly-scratch/2026-10-05/rollout/progress.json'))
print(p['updated'], 'elapsed h', p['elapsed_h'], 'done this run', p['done_this_run'], 'per hour', p['figures_per_hour'], p['counts'], 'pending', p['pending'], 'inflight', p['inflight'], p['errors'][-2:])
PY
