cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
C=http://127.0.0.1:5901/; L=http://127.0.0.1:5902/
P=critic/reviews/2b48cee95-focused/bprobe.mjs; O=critic/reviews/2b48cee95-focused/bsw
node $P $L $O r65-ch1 seymour-flux 1600 900 ""
node $P $C $O cand-ch1-default seymour-flux 1600 900 ""
node $P $C $O cand-ch1-garbage seymour-flux 1600 900 "?stance=zzz&swapcause=zzz&hit=zzz&rigko=zzz&run=zzz"
node $P $L $O r65-ch4 ffx2-bahamut 1600 900 ""
node $P $C $O cand-ch4-default ffx2-bahamut 1600 900 ""
node $P $C $O cand-ch4-garbage ffx2-bahamut 1600 900 "?stance=zzz&swapcause=zzz&hit=zzz&rigko=zzz&run=zzz"
