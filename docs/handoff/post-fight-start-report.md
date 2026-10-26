# Fight-start timeline report

Runs in D:/Tools/pyrefly-scratch/2026-10-26/batch1/post-fight-start/runs/m. Medians with [least-greatest] over the n runs of the build; times in ms.

### demo ffx2-bahamut fast cold

| | before (n=16) | after (n=16) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 13471 [11618-13679] | 12528 [10640-13669] | -943 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 186 [155-212] | 179 [157-225] | -7 |
| load (entry-load + first-draw) | 3988 [2125-4177] | 4054 [2128-5151] | +66 |
| authored (scene, card, sweep, sweep-to-menu) | 9294 [9265-9325] | 8297 [8255-8337] | -997 |
| longest task under the entry (frozen frame) | 782 [255-809] | 791 [242-980] | +9 |
| frames over 100 ms | 12 [10-14] | 13 [11-17] | +1 |
| ms lost to long frames | 3708 [2316-4049] | 3783 [2282-4949] | +75 |
| ms lost in the first 9 s | 3591 [2183-3932] | 3658 [2149-4815] | +67 |
| worst frame gap | 767 [333-800] | 783 [333-967] | +16 |
| machine CPU busy % | 22 [20.1-26.3] | 22 [21-54.9] | 0 |
| part: press-wait | 157 [145-165] | 150 [143-197] | -7 |
| part: entry-load | 2889 [1151-2957] | 2938 [1162-3834] | +49 |
| part: first-draw | 1138 [864-1269] | 1123 [836-1317] | -15 |
| part: card | 2174 [2164-2183] | 1177 [1162-1188] | -997 |
| part: card-to-sweep | 25 [10-48] | 28 [8-41] | +3 |
| part: sweep | 6100 [6082-6143] | 6100 [6083-6144] | 0 |
| part: sweep-to-menu | 1019 [992-1043] | 1020 [991-1054] | +1 |

### demo ffx2-bahamut fast warm

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 11591 [11554-13028] | 11952 [10601-11987] | +361 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 178 [170-190] | 187 [159-196] | +9 |
| load (entry-load + first-draw) | 2148 [2138-3601] | 3539 [2196-3556] | +1391 |
| authored (scene, card, sweep, sweep-to-menu) | 9249 [9247-9253] | 8226 [8209-8273] | -1023 |
| longest task under the entry (frozen frame) | 213 [202-867] | 859 [225-863] | +646 |
| frames over 100 ms | 9 [9-10] | 10 [9-11] | +1 |
| ms lost to long frames | 1916 [1799-3166] | 3082 [1799-3133] | +1166 |
| ms lost in the first 9 s | 1899 [1783-3116] | 3066 [1783-3116] | +1167 |
| worst frame gap | 383 [250-867] | 833 [283-850] | +450 |
| machine CPU busy % | 20 [18.8-60.3] | 21 [20.1-22.5] | +1 |
| part: press-wait | 157 [149-171] | 149 [149-150] | -8 |
| part: entry-load | 1443 [1399-2620] | 2619 [1435-2621] | +1176 |
| part: first-draw | 739 [705-981] | 918 [761-937] | +179 |
| part: card | 2171 [2164-2177] | 1170 [1166-1175] | -1001 |
| part: card-to-sweep | 19 [13-29] | 37 [10-47] | +18 |
| part: sweep | 6084 [6084-6100] | 6100 [6084-6103] | +16 |
| part: sweep-to-menu | 992 [985-992] | 959 [953-998] | -33 |

### demo ffx2-bahamut human cold

| | before (n=4) | after (n=4) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 11637 [11581-11714] | 10673 [10528-12367] | -964 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 201 [171-219] | 184 [167-195] | -17 |
| load (entry-load + first-draw) | 2146 [2123-2247] | 2205 [2080-3901] | +59 |
| authored (scene, card, sweep, sweep-to-menu) | 9276 [9250-9315] | 8276 [8270-8297] | -1000 |
| longest task under the entry (frozen frame) | 276 [253-301] | 282 [255-805] | +6 |
| frames over 100 ms | 10 [9-10] | 10 [10-13] | 0 |
| ms lost to long frames | 2191 [2132-2266] | 2216 [2082-3632] | +25 |
| ms lost in the first 9 s | 2075 [1999-2149] | 2099 [1949-3516] | +24 |
| worst frame gap | 367 [317-400] | 375 [350-783] | +8 |
| machine CPU busy % | 21 [19.8-22.6] | 21 [20.1-23.2] | 0 |
| part: press-wait | 169 [162-173] | 151 [147-169] | -18 |
| part: entry-load | 1269 [1219-1311] | 1282 [1198-2830] | +13 |
| part: first-draw | 906 [847-936] | 971 [786-1071] | +65 |
| part: card | 2169 [2167-2181] | 1174 [1169-1179] | -995 |
| part: card-to-sweep | 31 [9-47] | 30 [9-43] | -1 |
| part: sweep | 6093 [6083-6145] | 6092 [6065-6101] | -1 |
| part: sweep-to-menu | 1001 [995-1021] | 1013 [997-1053] | +12 |

### demo ffx2-bahamut long cold

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 10223 [10216-10272] | 9897 [9875-9941] | -326 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 190 [176-201] | 185 [161-208] | -5 |
| load (entry-load + first-draw) | 755 [732-766] | 691 [673-715] | -64 |
| authored (scene, card, sweep, sweep-to-menu) | 9308 [9267-9316] | 9041 [8975-9065] | -267 |
| longest task under the entry (frozen frame) | 211 [210-213] | 217 [199-224] | +6 |
| frames over 100 ms | 5 [5-6] | 5 [4-5] | 0 |
| ms lost to long frames | 1000 [966-1016] | 983 [966-983] | -17 |
| ms lost in the first 9 s | 883 [850-900] | 867 [866-883] | -16 |
| worst frame gap | 250 [233-250] | 250 [233-250] | 0 |
| machine CPU busy % | 18 [17-19.4] | 17 [16.7-17.3] | -1 |
| part: press-wait | 161 [157-169] | 166 [153-167] | +5 |
| part: entry-load | 104 [101-109] | 99 [94-104] | -5 |
| part: first-draw | 651 [623-665] | 592 [579-611] | -59 |
| part: card | 2167 [2167-2177] | 1905 [1868-1948] | -262 |
| part: card-to-sweep | 32 [15-33] | 18 [8-42] | -14 |
| part: sweep | 6083 [6082-6133] | 6084 [6083-6130] | +1 |
| part: sweep-to-menu | 1017 [1008-1057] | 1023 [1006-1034] | +6 |

### demo seymour-flux fast cold

| | before (n=7) | after (n=7) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 22108 [21360-22359] | 21193 [20351-22036] | -915 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 58 [32-62] | 63 [35-89] | +5 |
| load (entry-load + first-draw) | 2983 [2366-3199] | 3060 [2389-3658] | +77 |
| authored (scene, card, sweep, sweep-to-menu) | 19047 [18931-19103] | 18080 [17904-18290] | -967 |
| longest task under the entry (frozen frame) | 516 [389-990] | 520 [503-840] | +4 |
| frames over 100 ms | 9 [7-9] | 9 [6-9] | 0 |
| ms lost to long frames | 3383 [2416-3683] | 3483 [2433-4282] | +100 |
| ms lost in the first 9 s | 267 [50-317] | 266 [33-317] | -1 |
| worst frame gap | 1167 [817-1267] | 1167 [817-1517] | 0 |
| machine CPU busy % | 17 [16.1-39.1] | 17 [16.3-50.9] | 0 |
| part: press-wait | 20 [6-25] | 16 [6-23] | -4 |
| part: scene | 10148 [10031-10199] | 10147 [10014-10299] | -1 |
| part: entry-load | 1707 [1476-2106] | 1972 [1493-2027] | +265 |
| part: first-draw | 1075 [890-1369] | 1069 [896-1686] | -6 |
| part: card | 2165 [2164-2176] | 1168 [1165-1175] | -997 |
| part: card-to-sweep | 39 [24-49] | 47 [29-68] | +8 |
| part: sweep | 6628 [6597-6635] | 6665 [6592-6695] | +37 |
| part: sweep-to-menu | 119 [105-129] | 108 [57-139] | -11 |

### demo seymour-flux fast warm

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 21173 [20708-21829] | 20823 [20738-21314] | -350 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 43 [38-44] | 46 [44-62] | +3 |
| load (entry-load + first-draw) | 2238 [1745-2627] | 2682 [2564-3003] | +444 |
| authored (scene, card, sweep, sweep-to-menu) | 18925 [18893-19156] | 18129 [18096-18248] | -796 |
| longest task under the entry (frozen frame) | 705 [403-930] | 399 [377-439] | -306 |
| frames over 100 ms | 6 [3-7] | 8 [7-8] | +2 |
| ms lost to long frames | 2199 [1633-2999] | 3049 [2883-3715] | +850 |
| ms lost in the first 9 s | 116 [100-300] | 333 [317-550] | +217 |
| worst frame gap | 917 [700-1100] | 1100 [1050-1333] | +183 |
| machine CPU busy % | 17 [16.9-33.5] | 22 [18.2-61.7] | +5 |
| part: press-wait | 13 [4-18] | 14 [5-16] | +1 |
| part: scene | 10030 [10001-10236] | 10234 [10220-10302] | +204 |
| part: entry-load | 1206 [942-1218] | 1221 [1182-1482] | +15 |
| part: first-draw | 1020 [803-1421] | 1461 [1382-1521] | +441 |
| part: card | 2169 [2163-2170] | 1171 [1171-1177] | -998 |
| part: card-to-sweep | 31 [20-39] | 39 [32-46] | +8 |
| part: sweep | 6633 [6630-6641] | 6639 [6609-6649] | +6 |
| part: sweep-to-menu | 96 [88-117] | 96 [85-120] | 0 |

### demo seymour-flux human cold

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 19936 [19925-19951] | 19462 [19431-19510] | -474 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 39 [34-42] | 56 [34-57] | +17 |
| load (entry-load + first-draw) | 905 [884-931] | 1395 [890-1437] | +490 |
| authored (scene, card, sweep, sweep-to-menu) | 18987 [18982-19012] | 18017 [18011-18507] | -970 |
| longest task under the entry (frozen frame) | 307 [305-319] | 294 [282-310] | -13 |
| frames over 100 ms | 4 [4-5] | 9 [5-9] | +5 |
| ms lost to long frames | 983 [966-1066] | 1816 [933-1849] | +833 |
| ms lost in the first 9 s | 33 [0-67] | 417 [0-467] | +384 |
| worst frame gap | 300 [300-317] | 283 [283-300] | -17 |
| machine CPU busy % | 15 [15.2-15.7] | 17 [16.1-17.9] | +2 |
| part: press-wait | 10 [5-14] | 10 [8-12] | 0 |
| part: scene | 10079 [10064-10097] | 10099 [10079-10100] | +20 |
| part: entry-load | 96 [90-99] | 352 [91-354] | +256 |
| part: first-draw | 809 [785-841] | 1043 [799-1083] | +234 |
| part: card | 2171 [2170-2177] | 1188 [1176-1692] | -983 |
| part: card-to-sweep | 29 [25-32] | 46 [22-49] | +17 |
| part: sweep | 6675 [6640-6680] | 6629 [6617-6634] | -46 |
| part: sweep-to-menu | 65 [56-107] | 107 [107-107] | +42 |

### demo seymour-flux long cold

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 19791 [19760-19836] | 19477 [19441-19488] | -314 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 42 [37-69] | 53 [48-56] | +11 |
| load (entry-load + first-draw) | 754 [752-804] | 790 [760-820] | +36 |
| authored (scene, card, sweep, sweep-to-menu) | 18969 [18963-18998] | 18609 [18599-18673] | -360 |
| longest task under the entry (frozen frame) | 243 [236-249] | 249 [246-265] | +6 |
| frames over 100 ms | 3 [3-5] | 4 [4-5] | +1 |
| ms lost to long frames | 800 [783-899] | 850 [783-900] | +50 |
| ms lost in the first 9 s | 0 [0-0] | 0 [0-0] | 0 |
| worst frame gap | 233 [233-233] | 233 [233-250] | 0 |
| machine CPU busy % | 14 [14-14.9] | 15 [13.8-16.1] | +1 |
| part: press-wait | 18 [7-18] | 6 [4-16] | -12 |
| part: scene | 10071 [10064-10082] | 10087 [10056-10088] | +16 |
| part: entry-load | 92 [88-97] | 96 [93-104] | +4 |
| part: first-draw | 664 [662-707] | 686 [667-724] | +22 |
| part: card | 2170 [2169-2185] | 1814 [1788-1868] | -356 |
| part: card-to-sweep | 30 [24-51] | 42 [40-49] | +12 |
| part: sweep | 6616 [6593-6640] | 6614 [6593-6615] | -2 |
| part: sweep-to-menu | 109 [106-125] | 125 [108-125] | +16 |

### select ffx2-bahamut fast cold

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 28422 [28356-28467] | 26105 [26100-27490] | -2317 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 36 [30-53] | 30 [19-52] | -6 |
| load (entry-load + first-draw) | 2733 [2728-2873] | 1876 [1796-2783] | -857 |
| authored (scene, card, sweep, sweep-to-menu) | 25197 [25005-25244] | 23905 [23820-24043] | -1292 |
| longest task under the entry (frozen frame) | 491 [403-567] | 458 [336-546] | -33 |
| frames over 100 ms | 12 [11-13] | 8 [7-11] | -4 |
| ms lost to long frames | 3133 [3016-3182] | 1966 [1949-3066] | -1167 |
| ms lost in the first 9 s | 300 [300-317] | 67 [50-283] | -233 |
| worst frame gap | 617 [617-633] | 467 [350-633] | -150 |
| machine CPU busy % | 15 [14.9-15.1] | 16 [16-16.6] | +1 |
| part: press-wait | 19 [8-22] | 13 [10-15] | -6 |
| part: party-prep | 344 [343-659] | 375 [352-645] | +31 |
| part: scene | 15913 [15746-15929] | 15620 [15592-15761] | -293 |
| part: entry-load | 1073 [1065-1092] | 870 [605-1045] | -203 |
| part: first-draw | 1663 [1641-1800] | 1191 [1006-1738] | -472 |
| part: card | 2173 [2170-2177] | 1169 [1168-1169] | -1004 |
| part: card-to-sweep | 22 [14-34] | 17 [9-37] | -5 |
| part: sweep | 6083 [6083-6142] | 6082 [6067-6131] | -1 |
| part: sweep-to-menu | 1006 [1000-1024] | 993 [982-1034] | -13 |

### select ffx2-bahamut fast warm

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 28187 [27734-28312] | 26126 [26079-27116] | -2061 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 23 [21-27] | 58 [26-69] | +35 |
| load (entry-load + first-draw) | 2543 [2316-2579] | 1202 [1185-2394] | -1341 |
| authored (scene, card, sweep, sweep-to-menu) | 25243 [24996-25386] | 24512 [24320-24522] | -731 |
| longest task under the entry (frozen frame) | 391 [384-426] | 256 [255-390] | -135 |
| frames over 100 ms | 6 [6-6] | 3 [2-7] | -3 |
| ms lost to long frames | 2799 [2333-2882] | 1116 [1116-2682] | -1683 |
| ms lost in the first 9 s | 300 [67-367] | 83 [83-366] | -217 |
| worst frame gap | 767 [750-817] | 433 [417-667] | -334 |
| machine CPU busy % | 16 [14.4-15.9] | 14 [13.7-14.1] | -2 |
| part: press-wait | 16 [10-17] | 20 [19-22] | +4 |
| part: party-prep | 361 [344-395] | 344 [343-345] | -17 |
| part: scene | 15977 [15739-16112] | 15652 [15633-16078] | -325 |
| part: entry-load | 811 [569-883] | 274 [273-812] | -537 |
| part: first-draw | 1747 [1660-1768] | 928 [912-1582] | -819 |
| part: card | 2174 [2172-2176] | 1782 [1171-1791] | -392 |
| part: card-to-sweep | 6 [5-17] | 39 [6-47] | +33 |
| part: sweep | 6129 [6084-6133] | 6091 [6084-6132] | -38 |
| part: sweep-to-menu | 969 [963-997] | 987 [966-987] | +18 |

### select seymour-flux fast cold

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 47026 [46943-49014] | 46020 [45983-47039] | -1006 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 59 [40-62] | 61 [46-65] | +2 |
| load (entry-load + first-draw) | 2469 [2372-4131] | 2438 [2418-3120] | -31 |
| authored (scene, card, sweep, sweep-to-menu) | 44143 [44132-44144] | 43169 [43105-43177] | -974 |
| longest task under the entry (frozen frame) | 826 [555-858] | 828 [513-830] | +2 |
| frames over 100 ms | 6 [6-11] | 6 [6-9] | 0 |
| ms lost to long frames | 2399 [2399-4833] | 2416 [2383-3699] | +17 |
| ms lost in the first 9 s | 83 [83-317] | 83 [67-333] | 0 |
| worst frame gap | 850 [817-1600] | 817 [817-1167] | -33 |
| machine CPU busy % | 12 [12.4-40.9] | 12 [12.3-13.4] | 0 |
| part: press-wait | 10 [10-12] | 18 [18-24] | +8 |
| part: party-prep | 388 [365-677] | 386 [379-677] | -2 |
| part: scene | 35227 [35214-35237] | 35251 [35229-35272] | +24 |
| part: entry-load | 1494 [1358-2218] | 1494 [1328-2009] | 0 |
| part: first-draw | 1111 [878-1913] | 1110 [924-1111] | -1 |
| part: card | 2172 [2163-2182] | 1167 [1162-1169] | -1005 |
| part: card-to-sweep | 47 [30-52] | 41 [28-43] | -6 |
| part: sweep | 6642 [6600-6708] | 6648 [6599-6708] | +6 |
| part: sweep-to-menu | 123 [27-124] | 109 [27-110] | -14 |

### select seymour-flux fast warm

| | before (n=3) | after (n=3) | difference of the medians (second build less the first: negative is faster) |
|---|---|---|---|
| total (press to first menu), ms | 46414 [46366-47774] | 45431 [45352-46711] | -983 |
| waits (press-wait, after-prep, after-scene, card-to-sweep) | 53 [30-56] | 55 [33-57] | +2 |
| load (entry-load + first-draw) | 1878 [1861-3136] | 1905 [1904-2872] | +27 |
| authored (scene, card, sweep, sweep-to-menu) | 44105 [44103-44225] | 43108 [43041-43423] | -997 |
| longest task under the entry (frozen frame) | 718 [410-728] | 724 [378-746] | +6 |
| frames over 100 ms | 4 [4-9] | 5 [5-8] | +1 |
| ms lost to long frames | 1733 [1716-3733] | 1766 [1733-3199] | +33 |
| ms lost in the first 9 s | 100 [84-517] | 83 [66-316] | -17 |
| worst frame gap | 717 [717-1167] | 733 [717-1067] | +16 |
| machine CPU busy % | 12 [11.2-28.4] | 12 [11.2-12] | 0 |
| part: press-wait | 8 [7-11] | 16 [14-19] | +8 |
| part: party-prep | 372 [359-374] | 361 [360-373] | -11 |
| part: scene | 35237 [35205-35339] | 35232 [35154-35535] | -5 |
| part: entry-load | 964 [952-1297] | 980 [967-1201] | +16 |
| part: first-draw | 926 [897-1839] | 938 [924-1671] | +12 |
| part: card | 2171 [2163-2172] | 1170 [1169-1173] | -1001 |
| part: card-to-sweep | 42 [23-48] | 38 [19-39] | -4 |
| part: sweep | 6634 [6601-6643] | 6601 [6599-6637] | -33 |
| part: sweep-to-menu | 89 [84-95] | 102 [80-120] | +13 |
