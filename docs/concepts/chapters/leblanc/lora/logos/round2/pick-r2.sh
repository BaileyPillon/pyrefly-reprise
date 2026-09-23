#!/usr/bin/env bash
# Logos round 2 step pick (FFX-2 only): for each saved step of logos-x2-r2, copy it to ComfyUI's
# loras/pyrefly-lora-steps/ and render the idle's own pose (the idle skeleton) and one UNSEEN pose
# (hurt: the recoil skeleton; no hurt frame is in the r2 dataset), 2 seeds each, same seeds at
# every step, with render-r2.mjs (LoRA 0.85, IP-Adapter on the repaired idle 0.3, OpenPose).
# Out: D:/Tools/pyrefly-lora/logos/pick-r2/<state>.<seed>.s<step>.{raw.png,png,json}
set -e
cd "$(dirname "$0")"
L=D:/Tools/ComfyUI/ComfyUI/models/loras/pyrefly-lora-steps
for s in ${STEPS:-500 1000 1500 2000}; do
  f=D:/Tools/pyrefly-lora/logos/out-r2/logos-x2-r2-step$(printf %08d $s).safetensors
  until [ -f "$f" ]; do sleep 20; done
  sleep 10
  cp -n "$f" "$L/logos-x2-r2-step$s.safetensors"
  for st in idle hurt; do
    node render-r2.mjs $st --seeds 2 --lorafile "pyrefly-lora-steps\logos-x2-r2-step$s.safetensors" --step $s --tag s$s --out D:/Tools/pyrefly-lora/logos/pick-r2
  done
done
