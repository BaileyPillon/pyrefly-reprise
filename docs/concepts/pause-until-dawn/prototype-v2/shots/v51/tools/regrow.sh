#!/bin/sh
# Living portrait v5.1 (game case: both): regrow the chain -40..+40 from the plate with the picks (CPU only).
# The +-10 / +-20 picks are the v5 pilot's own LoRA candidates (D:/Tools/pyrefly-lora/yuna-x2/rig-v5/s64); +-30 / +-40
# are v5.1's (chain-repaint.mjs). Run from this folder with PY set to the sd-scripts venv python.
set -e
P5=D:/Tools/pyrefly-lora/yuna-x2/rig-v5/s64/keys
K=D:/Tools/pyrefly-lora/yuna-x2/rig-v51/keys
$PY chain_grow.py propagate --side r --to 10; $PY chain_grow.py pick --key v5-r10 --cand $P5/v5-r10/cand/c.d45.s1.png
$PY chain_grow.py propagate --side l --to 10; $PY chain_grow.py pick --key v5-l10 --cand $P5/v5-l10/cand/c.d45.s2.png
$PY chain_grow.py propagate --side r --to 20; $PY chain_grow.py pick --mag-only --protect --key v5-r20 --cand $P5/v5-r20/cand/c.d45.s1.png
$PY chain_grow.py propagate --side l --to 20; $PY chain_grow.py pick --mag-only --protect --key v5-l20 --cand $P5/v5-l20/cand/c.d45.s2.png
$PY chain_grow.py propagate --side r --to 30; $PY chain_grow.py pick --mag-only --protect --key v5-r30 --cand $K/v5-r30/cand/c.d45.s2.png
$PY chain_grow.py propagate --side l --to 30; $PY chain_grow.py pick --mag-only --protect --key v5-l30 --cand $K/v5-l30/cand/c.d45.s1.png
if [ -n "$UPTO40" ]; then
  $PY chain_grow.py propagate --side r --to 40; $PY chain_grow.py pick --mag-only --protect --key v5-r40 --cand $K/v5-r40/cand/$R40
  $PY chain_grow.py propagate --side l --to 40; $PY chain_grow.py pick --mag-only --protect --key v5-l40 --cand $K/v5-l40/cand/$L40
fi
