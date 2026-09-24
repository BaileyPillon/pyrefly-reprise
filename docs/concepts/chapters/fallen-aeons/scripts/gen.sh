#!/usr/bin/env bash
# One comfy.mjs job, submitted only when the shared queue has fewer than 3 pending and nothing of
# ours is running (this script is called sequentially). The restart sentinel is written "now" into a
# private log dir so the black-frame guard can never restart the shared ComfyUI from this run.
set -u
LOG=/d/Tools/pyrefly-scratch/fallen-aeons-options/comfy-logs
mkdir -p "$LOG"
while true; do
  n=$(curl -s --max-time 10 http://127.0.0.1:8188/queue | "D:/Tools/ComfyUI/python_embeded/python.exe" -c "import sys,json; d=json.load(sys.stdin); print(len(d['queue_pending']))" 2>/dev/null)
  if [ -n "$n" ] && [ "$n" -lt 3 ]; then break; fi
  echo "[wait] pending=$n $(date +%T)"; sleep 15
done
date +%s > "$LOG/last-black-restart.txt"
echo "[gen] start $(date +%T) $*" | cut -c1-200
cd "/d/Final Fantasy"
export TMP=D:/Tools/pyrefly-scratch/fallen-aeons-options/tmp TEMP=D:/Tools/pyrefly-scratch/fallen-aeons-options/tmp
COMFY_LOG_DIR="D:/Tools/pyrefly-scratch/fallen-aeons-options/comfy-logs" node tools/gen/comfy.mjs "$@"
rc=$?
echo "[gen] end $(date +%T) rc=$rc"
exit $rc
