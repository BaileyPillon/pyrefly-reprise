cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5871/
D=critic/reviews/eaf599d0c-focused
node $D/phone-menu.mjs $B $D/phone
node $D/switch-probe.mjs $B $D/switch
node critic/runner/lib/continuity.mjs --base=$B --evidence="D:/pyrefly-release55/critic/reviews/eaf599d0c-focused/continuity" --chapters=ffx2-bahamut --tag=eaf599d0c
