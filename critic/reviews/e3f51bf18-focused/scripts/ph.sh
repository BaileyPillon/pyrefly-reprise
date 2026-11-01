#!/bin/bash
cd /d/Tools/pyrefly-scratch/2026-10-31/r70-focused/scripts
for c in yunalesca ffx2-trema seymour-anima-macalania; do PYREFLY_BROWSER=gpu node play.mjs --chapter=$c --base=http://127.0.0.1:5871/ --w=390 --h=844 --phone --tag=ph-$c 2>&1 | tail -3; done
for c in seymour-anima-macalania seymour-natus ffx2-den-of-woe braskas-final-aeon; do PYREFLY_BROWSER=gpu node play.mjs --chapter=$c --base=http://127.0.0.1:5871/ --w=2000 --h=1012 --tag=w2-$c 2>&1 | tail -3; done
