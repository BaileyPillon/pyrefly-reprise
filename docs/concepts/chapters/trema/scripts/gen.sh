#!/usr/bin/env bash
# One comfy.mjs job, submitted only when the shared queue has fewer than 3 pending.
# The restart sentinel is written "now" in a private log dir so the black-frame guard
# never restarts the shared ComfyUI from this run (rule 12: the driver restarts it).
set -u
LOG=D:/Tools/pyrefly-scratch/trema-options/comfy-logs
export TEMP=D:/Tools/pyrefly-scratch/trema-options/tmp TMP=D:/Tools/pyrefly-scratch/trema-options/tmp
while true; do
  p=$(curl -s --max-time 10 http://127.0.0.1:8188/queue | python -c "import json,sys;d=json.load(sys.stdin);print(len(d['queue_pending']))" 2>/dev/null)
  if [ -n "$p" ] && [ "$p" -lt 3 ]; then break; fi
  echo "[wait] pending=$p $(date +%T)"; sleep 20
done
date +%s > "$LOG/last-black-restart.txt"
echo "[gen] start $(date +%T) $*" | cut -c1-200
cd "/d/Final Fantasy"
COMFY_LOG_DIR="$LOG" node tools/gen/comfy.mjs "$@"
rc=$?
echo "[gen] end $(date +%T) rc=$rc"
exit $rc
