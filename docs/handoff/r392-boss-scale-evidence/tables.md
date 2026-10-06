# r392-boss-scale: the tables behind the numbers

Generated from the real-keys runs of `bs-measure.mjs` (headless GPU Chromium, `vite preview` of a `BASE_PATH=/` build, 1600x900 unless a size is named, 7 menus = the first two rounds). "before" is the branch tip before this lane (origin/main 9c690231, the live 39.1 code); "after" is this lane. Boss px = the boss's painted content box through the live camera (CSS px); k = its group scale; x party = boss px over the mean of the party's painted heights at that menu.

**Yojimbo at 1600x900, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 285 | 1.311 | 1.34 | 252 | 1.163 | 1.19 |
| 2 | yuna | 222 | 1.000 | 0.97 | 260 | 1.163 | 1.13 |
| 3 | yuna | 222 | 1.000 | 0.96 | 260 | 1.163 | 1.13 |
| 4 | lulu | 214 | 1.000 | 1.04 | 259 | 1.163 | 1.20 |
| 5 | kimahri | 280 | 1.289 | 1.31 | 261 | 1.163 | 1.17 |
| 6 | yuna | 280 | 1.289 | 1.28 | 261 | 1.163 | 1.13 |
| 7 | lulu | 279 | 1.289 | 1.35 | 260 | 1.163 | 1.19 |
| | **before** | boss 214 to 285 px (x1.33) | k 1.000 to 1.311 | 0.96 to 1.35 | | | |
| | **after** | boss 252 to 261 px (x1.04) | k 1.163 to 1.163 | 1.13 to 1.20 | | | |

**Yojimbo at 2560x1440, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 458 | 1.311 | 1.35 | 401 | 1.163 | 1.17 |
| 2 | yuna | 359 | 1.000 | 0.98 | 415 | 1.163 | 1.12 |
| 3 | yuna | 358 | 1.000 | 0.98 | 415 | 1.163 | 1.12 |
| 4 | lulu | 346 | 1.000 | 1.05 | 415 | 1.163 | 1.19 |
| 5 | kimahri | 446 | 1.289 | 1.30 | 418 | 1.163 | 1.16 |
| 6 | yuna | 446 | 1.289 | 1.27 | 417 | 1.163 | 1.13 |
| 7 | lulu | 448 | 1.289 | 1.36 | 417 | 1.163 | 1.20 |
| | **before** | boss 346 to 458 px (x1.32) | k 1.000 to 1.311 | 0.98 to 1.36 | | | |
| | **after** | boss 401 to 418 px (x1.04) | k 1.163 to 1.163 | 1.12 to 1.20 | | | |

**Yojimbo at 1280x720, seed 1, real keys.** boss px / group scale k / boss over the party mean (the three members, live).

| menu | member | before: px | k | x party | after: px | k | x party |
|---|---|---|---|---|---|---|---|
| 1 | kimahri | 227 | 1.311 | 1.34 | 200 | 1.163 | 1.17 |
| 2 | yuna | 171 | 1.000 | 0.98 | 207 | 1.163 | 1.12 |
| 3 | yuna | 172 | 1.000 | 0.98 | 208 | 1.163 | 1.13 |
| 4 | lulu | 173 | 1.000 | 1.04 | 209 | 1.163 | 1.20 |
| 5 | kimahri | 223 | 1.289 | 1.31 | 208 | 1.163 | 1.15 |
| 6 | yuna | 223 | 1.289 | 1.27 | 207 | 1.163 | 1.12 |
| 7 | lulu | 223 | 1.289 | 1.35 | 209 | 1.163 | 1.20 |
| | **before** | boss 171 to 227 px (x1.32) | k 1.000 to 1.311 | 0.98 to 1.35 | | | |
| | **after** | boss 200 to 209 px (x1.04) | k 1.163 to 1.163 | 1.12 to 1.20 | | | |

| boss | before (the 39.1 code): boss px over 7 menus | k seen | after: boss px | k seen |
|---|---|---|---|---|
| Yojimbo (FFX IX) | 214 to 285 (x1.33) | 1, 1.289, 1.311 | 252 to 261 (x1.04) | 1.163 |
| Bahamut (FFX-2 IV) | 416 to 581 (x1.40) | 1, 1.387, 1.408 | 550 to 572 (x1.04) | 1.387 |
| Seymour Natus (FFX X) | 348 to 350 (x1.00) | 1.638 | 348 to 350 (x1.00) | 1.638 |
| Braska's Final Aeon (FFX III) | 328 to 335 (x1.02) | 1 | 329 to 333 (x1.01) | 1 |
| Evrae (FFX VIII) | 184 to 403 (x2.19) | 0.764, 1 | 184 to 404 (x2.19) | 0.764, 1 |
| Vegnagun (FFX-2 V) | 858 to 881 (x1.03) | 1 | 857 to 882 (x1.03) | 1 |
| Sin, face (FFX XVIII) | 529 to 549 (x1.04) | 3.471 | 527 to 544 (x1.03) | 3.471 |
| Sin, fins (FFX XVII) | 445 to 724 (x1.63) | 1.656, 3.85 | 445 to 726 (x1.63) | 1.656, 3.85 |

| boss, seed | before: boss px over 7 menus (k seen) | after: boss px (k seen) |
|---|---|---|
| Yojimbo (FFX IX), seed 2 | 214 to 336 (x1.57); k 1, 1.311, 1.313, 1.535; first menu plans 1 | 250 to 261 (x1.04); k 1.163; first menu plans 1 |
| Yojimbo (FFX IX), seed 3 | 215 to 283 (x1.32); k 1, 1.289, 1.311; first menu plans 1 | 250 to 262 (x1.05); k 1.163; first menu plans 1 |
| Bahamut (FFX-2 IV), seed 2 | 413 to 566 (x1.37); k 1, 1.387, 1.388, 1.408; first menu plans 1 | 517 to 569 (x1.10); k 1.387; first menu plans 1 |
| Bahamut (FFX-2 IV), seed 3 | 415 to 581 (x1.40); k 1, 1.387, 1.408; first menu plans 1 | 554 to 572 (x1.03); k 1.387; first menu plans 1 |
| Seymour Natus (FFX X), seed 2 | 348 to 349 (x1.00); k 1.638; first menu plans 1 | 349 to 350 (x1.00); k 1.638; first menu plans 1 |
| Seymour Natus (FFX X), seed 3 | 349 to 349 (x1.00); k 1.638; first menu plans 1 | 348 to 349 (x1.00); k 1.638; first menu plans 1 |
| Braska's Final Aeon (FFX III), seed 2 | 330 to 343 (x1.04); k 1; first menu plans 1 | 329 to 335 (x1.02); k 1; first menu plans 1 |
| Braska's Final Aeon (FFX III), seed 3 | 329 to 334 (x1.01); k 1; first menu plans 1 | 330 to 334 (x1.01); k 1; first menu plans 1 |
| Evrae (FFX VIII), seed 2 | 184 to 418 (x2.27); k 0.764, 1; first menu plans 1 | 184 to 404 (x2.19); k 0.764, 1; first menu plans 1 |
| Evrae (FFX VIII), seed 3 | 184 to 404 (x2.19); k 0.764, 1; first menu plans 1 | 184 to 403 (x2.19); k 0.764, 1; first menu plans 1 |
