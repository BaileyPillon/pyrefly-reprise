cd /d/pyrefly-release55
export PYREFLY_BROWSER=gpu
B=http://127.0.0.1:5871/
O="critic/reviews/eaf599d0c-focused/opening"
P=critic/reviews/eaf599d0c-focused/opening-probe.mjs
node $P $B $O ch1-set-1600 seymour-flux 1600 900
node $P $B $O ch4-set-1600 ffx2-bahamut 1600 900
node $P $B $O ch1-demo-1600 demo1 1600 900 "?demo=1&pack=demo"
node $P $B $O ch4-demo-1600 demo4 1600 900 "?demo=1&pack=demo"
node $P $B $O ch1-demo-2560 demo1 2560 1440 "?demo=1&pack=demo"
node $P $B $O ch4-demo-2560 demo4 2560 1440 "?demo=1&pack=demo"
