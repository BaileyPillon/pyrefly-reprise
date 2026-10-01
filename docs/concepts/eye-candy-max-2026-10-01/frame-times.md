# Frame times, re-measured 2026-10-01 (RTX 5070 Ti, headless D3D11, autoBattle intended, 14 s per row)

On runs come first in the fight and include shader warm-up, off runs are later in the same fight, so on-vs-off differences under 1 ms are noise. No real phone GPU was measured; the phone rows are a 4x CPU throttle only. D falls back to flat paintings on the phone tier (its spec), so its phone row is nearly today.

| Option | Chapter | Size / mode | On p50/p95/p99 ms | Off p50/p95/p99 ms | Option update ms/frame | Tier |
|---|---|---|---|---|---|---|
| A | ffx2-bahamut | uncapped, 1600x900 | 2.4/3.2/5.5 | 2.4/3/5.2 | 0.049 | full |
| A | seymour-flux | uncapped, 1600x900 | 1.8/2.5/3.1 | 1.7/2.5/3.3 | 0.082 | full |
| A | seymour-flux | vsync-capped, 390x844, CPU 4x throttle | 16.7/16.8/50 | 16.7/16.8/66.7 | 0.241 | phone |
| B | ffx2-bahamut | uncapped, 1600x900 | 2.5/3.3/5.9 | 2.4/3.1/5.4 | 0.0041 | full |
| B | seymour-flux | uncapped, 1600x900 | 1.6/2.2/2.9 | 1.7/2.5/3.3 | 0.0082 | full |
| B | seymour-flux | vsync-capped, 390x844, CPU 4x throttle | 16.7/16.8/50 | 16.7/16.8/66.6 | 0.0688 | phone |
| C | ffx2-bahamut | uncapped, 1600x900 | 2.5/3.3/5.3 | 2.4/3.1/5.2 | 0.099 | full |
| C | seymour-flux | uncapped, 1600x900 | 1.7/2.5/3.3 | 1.7/2.6/3.5 | 0.1599 | full |
| C | seymour-flux | vsync-capped, 390x844, CPU 4x throttle | 16.7/16.8/50 | 16.7/33.3/83.4 | 0.8129 | phone |
| D | ffx2-bahamut | uncapped, 1600x900 | 2.5/3.4/5.4 | 2.5/3.1/5.1 | 0.2285 | full |
| D | seymour-flux | uncapped, 1600x900 | 2/2.6/3.9 | 1.8/2.6/3.5 | 0.2558 | full |
| D | seymour-flux | vsync-capped, 390x844, CPU 4x throttle | 16.7/16.8/50 | 16.7/33.3/66.7 | 0.0643 | phone |
