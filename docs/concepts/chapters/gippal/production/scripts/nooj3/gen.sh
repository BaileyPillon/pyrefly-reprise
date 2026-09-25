#!/usr/bin/env bash
set -u
S=D:/Tools/pyrefly-scratch/gpu2/den
export TEMP=$S/tmp TMP=$S/tmp
while true; do
  p=$(curl -s --max-time 10 http://127.0.0.1:8188/queue | python -c "import json,sys;d=json.load(sys.stdin);print(len(d['queue_pending']))" 2>/dev/null)
  if [ -n "$p" ] && [ "$p" -lt 3 ]; then break; fi
  echo "[wait] pending=$p $(date +%T)"; sleep 20
done
date +%s > "$S/comfy-logs/last-black-restart.txt"
echo "[gen] start $(date +%T) $*" | cut -c1-200
cd "/d/Final Fantasy"
COMFY_LOG_DIR="$S/comfy-logs" node tools/gen/comfy.mjs "$@"
rc=$?; echo "[gen] end $(date +%T) rc=$rc"; exit $rc
