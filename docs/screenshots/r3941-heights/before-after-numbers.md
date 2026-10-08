# The FFX heights fix, before and after: the numbers (r3941-heights, FFX only)

Every FFX chapter, 1600x900 and 390x844 (touch), one build, seed 1, the first command menu with the framing's plan settled and the clocks frozen.
**Before** is the build with `?stature=off` (the old equal heights), **after** is the default. Headless Chromium on the GPU from node; the figures' rectangles are
`__pyrefly.targeting()` (the stage's own projection, the median over 40 frames), the panels are read from the DOM (the CHK-008 list plus the solid children the HUD itself dodges),
the camera plan and the boss size are the MAX mix's framing report (`__pyrefly.fx.snapshot().mix.framing`). The pictures are `chNN-<chapter>-<size>-before-after.jpg` and the two contact sheets in this folder.

How to read the tables:

- **World before to after** is the actor's `worldHeight` in the scene's units: the table's ratio times the scene's party height (Tidus unchanged). Chapter XIV's Yuna is named by her scene and does not change.
- **Screen ratio** is the figure's rectangle height after over before. It carries any move of the framing's camera; **Against Tidus's own change** divides that out (the table's ratio is what it should read: 36 comparisons, the largest deviation 0.94 percent).
- **Tallest head to the viewport top** is the top of the highest party rectangle, before to after. **Nearest panel above a head** is the vertical gap between a party head and the HUD panel above it that shares some of its width (a figure under a panel is an overlap, not a gap).
- **Camera (planned master) moved** is the distance in world units between the framing's planned camera before and after (a repeat of the same run moves it by at most 0.02). **Boss rect height** is the tallest enemy's rectangle.
- **Faces and weapons under a panel (CHK-008)** counts the stage's key-feature boxes covered by any panel. **New panel overlaps** counts figure and panel pairs that overlap after and did not before. **CHK-011 newly failing / passing** is a party member crossing the 75 percent clear-and-in-frame line.

`before-after-numbers.txt` has everything per figure (the overlaps, the head room, the framing's report, the pairwise overlap of the party's boxes); the same data as JSON is `before-after-numbers.json`.


### Each figure's height on screen, before to after (1600x900; the table ratio in brackets)

| Chapter | Hero (table) | World before to after | Screen px before to after | Screen ratio | Against Tidus's own change |
|---|---|---|---|---|---|
| I | Tidus (1.000) | 1.82 to 1.82 | 280.6 to 293.9 | x1.048 | reference |
| I | Yuna (0.911) | 1.82 to 1.658 | 297 to 282.1 | x0.95 | x0.906 |
| I | Kimahri (1.211) | 1.82 to 2.204 | 245.5 to 310.2 | x1.264 | x1.206 |
| II | Tidus (1.000) | 1.82 to 1.82 | 292 to 292.3 | x1.001 | reference |
| II | Yuna (0.911) | 1.82 to 1.658 | 293.1 to 266.7 | x0.91 | x0.909 |
| II | Auron (1.062) | 1.82 to 1.933 | 252 to 267.8 | x1.063 | x1.062 |
| III | Tidus (1.000) | 1.82 to 1.82 | 281.6 to 281.7 | x1 | reference |
| III | Yuna (0.911) | 1.82 to 1.658 | 316.6 to 287.9 | x0.909 | x0.909 |
| III | Auron (1.062) | 1.82 to 1.933 | 245.9 to 261.3 | x1.063 | x1.063 |
| VII | Tidus (1.000) | 1.82 to 1.82 | 297.9 to 298 | x1 | reference |
| VII | Yuna (0.911) | 1.82 to 1.658 | 256.3 to 233.5 | x0.911 | x0.911 |
| VII | Rikku (0.911) | 1.82 to 1.658 | 309.7 to 282.1 | x0.911 | x0.911 |
| VIII | Tidus (1.000) | 1.82 to 1.82 | 264 to 263.4 | x0.998 | reference |
| VIII | Rikku (0.911) | 1.82 to 1.658 | 213.9 to 194.9 | x0.911 | x0.913 |
| VIII | Wakka (1.201) | 1.82 to 2.186 | 216.8 to 260.4 | x1.201 | x1.203 |
| IX | Lulu (0.990) | 1.75 to 1.733 | 216.9 to 214.7 | x0.99 | - |
| IX | Kimahri (1.211) | 1.75 to 2.119 | 207.3 to 252.2 | x1.217 | - |
| IX | Yuna (0.911) | 1.75 to 1.594 | 216.5 to 196.9 | x0.91 | - |
| X | Tidus (1.000) | 1.75 to 1.75 | 200.3 to 200.5 | x1.001 | reference |
| X | Yuna (0.911) | 1.75 to 1.594 | 221.1 to 201.5 | x0.911 | x0.910 |
| X | Kimahri (1.211) | 1.75 to 2.119 | 230.8 to 280.6 | x1.216 | x1.215 |
| XII | Yuna (0.911) | 1.8 to 1.64 | 264.5 to 230.9 | x0.873 | x0.910 |
| XII | Tidus (1.000) | 1.8 to 1.8 | 237.8 to 228.2 | x0.959 | reference |
| XII | Auron (1.062) | 1.8 to 1.912 | 205.9 to 211.8 | x1.028 | x1.072 |
| XIV | Yuna (0.911) | 1.68 to 1.68 | 289.7 to 289.7 | x1 | - |
| XVII | Tidus (1.000) | 1.82 to 1.82 | 179.3 to 179.3 | x1 | reference |
| XVII | Yuna (0.911) | 1.82 to 1.658 | 158.3 to 144.2 | x0.911 | x0.911 |
| XVII | Auron (1.062) | 1.82 to 1.933 | 159.8 to 169.8 | x1.062 | x1.062 |
| XVIII | Tidus (1.000) | 1.82 to 1.82 | 178.9 to 178.9 | x1 | reference |
| XVIII | Yuna (0.911) | 1.82 to 1.658 | 158.8 to 144.6 | x0.91 | x0.910 |
| XVIII | Auron (1.062) | 1.82 to 1.933 | 160 to 170 | x1.062 | x1.062 |

### Composition (1600x900)

| Chapter | Tallest head to the viewport top (px) | Nearest panel above a head, before to after (px) | Camera (planned master) moved | Tidus on screen | Boss rect height before to after | Faces and weapons under a panel (CHK-008) | New panel overlaps | CHK-011 newly failing / passing |
|---|---|---|---|---|---|---|---|---|
| I | Kimahri 355.2 to 297.6 | Kimahri: 68 to 43 | 0.436 | +4.8% | 362.6 to 370.5 (+2.2%) | 0 to 0 | 0 | none / none |
| II | Auron 432.1 to 416.2 | Auron: 37 to 31 | 0 | +0.1% | 427.8 to 427.7 (-0.0%) | 0 to 0 | 0 | none / none |
| III | Auron 432.8 to 417.5 | Auron: 38 to 32 | 0 | +0.0% | 333.6 to 333.1 (-0.1%) | 0 to 0 | 0 | none / none |
| VII | Rikku 406.7 to 433.9 | Tidus: 170 to 170 | 0 | +0.0% | 371.9 to 371.9 (+0.0%) | 0 to 0 | 0 | none / yuna |
| VIII | Wakka 406.1 to 362.6 | Wakka: 171 to 75 | 0 | -0.2% | 403.1 to 403.1 (+0.0%) | 0 to 0 | 0 | none / none |
| IX | Kimahri 567.3 to 523.3 | Kimahri: 409 to 366 | 0 | n/a (no Tidus) | 250.8 to 260.2 (+3.7%) | 0 to 0 | 0 | none / kimahri |
| X | Kimahri 518.2 to 471.2 | Kimahri: 113 to 66 | 0.03 | +0.1% | 349.7 to 359.8 (+2.9%) | 0 to 0 | 0 | none / none |
| XII | Auron 451.1 to 438.6 | Auron: 363 to 34 | 0.452 | -4.1% | 375.1 to 363.8 (-3.0%) | 0 to 0 | 0 | none / none |
| XIV | Yuna 491.8 to 491.8 | Yuna: 237 to 237 | 0 | n/a (no Tidus) | 326.5 to 326.5 (+0.0%) | 0 to 0 | 0 | none / none |
| XVII | Auron 475.3 to 465.3 | Auron: 342 to 332 | 0 | +0.0% | 444.7 to 444.7 (+0.0%) | 0 to 0 | 0 | none / none |
| XVIII | Auron 475.3 to 465.4 | Yuna: 95 to 109 | 0 | +0.0% | 527.2 to 527.2 (+0.0%) | 0 to 0 | 0 | none / none |

### Each figure's height on screen, before to after (390x844; the table ratio in brackets)

| Chapter | Hero (table) | World before to after | Screen px before to after | Screen ratio | Against Tidus's own change |
|---|---|---|---|---|---|
| I | Tidus (1.000) | 1.82 to 1.82 | 129.3 to 129.3 | x1 | reference |
| I | Yuna (0.911) | 1.82 to 1.658 | 138.4 to 125.8 | x0.909 | x0.909 |
| I | Kimahri (1.211) | 1.82 to 2.204 | 118.4 to 144.1 | x1.217 | x1.217 |
| II | Tidus (1.000) | 1.82 to 1.82 | 138.1 to 140.3 | x1.016 | reference |
| II | Yuna (0.911) | 1.82 to 1.658 | 141.3 to 130.5 | x0.924 | x0.909 |
| II | Auron (1.062) | 1.82 to 1.933 | 124.3 to 133.8 | x1.077 | x1.060 |
| III | Tidus (1.000) | 1.82 to 1.82 | 113.4 to 115.1 | x1.015 | reference |
| III | Yuna (0.911) | 1.82 to 1.658 | 125.7 to 116 | x0.923 | x0.909 |
| III | Auron (1.062) | 1.82 to 1.933 | 105.3 to 113.3 | x1.076 | x1.060 |
| VII | Tidus (1.000) | 1.82 to 1.82 | 130.5 to 132.2 | x1.013 | reference |
| VII | Yuna (0.911) | 1.82 to 1.658 | 116.1 to 107.1 | x0.922 | x0.910 |
| VII | Rikku (0.911) | 1.82 to 1.658 | 138.6 to 127.8 | x0.922 | x0.910 |
| VIII | Tidus (1.000) | 1.82 to 1.82 | 161.5 to 161.5 | x1 | reference |
| VIII | Rikku (0.911) | 1.82 to 1.658 | 128.8 to 117.3 | x0.911 | x0.911 |
| VIII | Wakka (1.201) | 1.82 to 2.186 | 130.6 to 156.9 | x1.201 | x1.201 |
| IX | Lulu (0.990) | 1.75 to 1.733 | 130.3 to 129 | x0.99 | - |
| IX | Kimahri (1.211) | 1.75 to 2.119 | 124.2 to 151.4 | x1.219 | - |
| IX | Yuna (0.911) | 1.75 to 1.594 | 130.6 to 118.6 | x0.908 | - |
| X | Yuna (0.911) | 1.75 to 1.594 | 126.4 to 114.9 | x0.909 | x0.909 |
| X | Tidus (1.000) | 1.75 to 1.75 | 118 to 118 | x1 | reference |
| X | Kimahri (1.211) | 1.75 to 2.119 | 131.1 to 159.6 | x1.217 | x1.217 |
| XII | Tidus (1.000) | 1.8 to 1.8 | 99.9 to 99.8 | x1 | reference |
| XII | Yuna (0.911) | 1.8 to 1.64 | 111 to 101 | x0.91 | x0.910 |
| XII | Auron (1.062) | 1.8 to 1.912 | 93.7 to 99.6 | x1.063 | x1.063 |
| XIV | Yuna (0.911) | 1.68 to 1.68 | 130.9 to 130.9 | x1 | - |
| XVII | Tidus (1.000) | 1.82 to 1.82 | 103.5 to 103.6 | x1 | reference |
| XVII | Yuna (0.911) | 1.82 to 1.658 | 91.5 to 83.3 | x0.911 | x0.911 |
| XVII | Auron (1.062) | 1.82 to 1.933 | 92.4 to 98.1 | x1.062 | x1.062 |
| XVIII | Tidus (1.000) | 1.82 to 1.82 | 102.9 to 102.9 | x1 | reference |
| XVIII | Yuna (0.911) | 1.82 to 1.658 | 91.5 to 83.3 | x0.91 | x0.910 |
| XVIII | Auron (1.062) | 1.82 to 1.933 | 92.2 to 97.9 | x1.062 | x1.062 |

### Composition (390x844)

| Chapter | Tallest head to the viewport top (px) | Nearest panel above a head, before to after (px) | Camera (planned master) moved | Tidus on screen | Boss rect height before to after | Faces and weapons under a panel (CHK-008) | New panel overlaps | CHK-011 newly failing / passing |
|---|---|---|---|---|---|---|---|---|
| I | Kimahri 302.5 to 276.8 | Kimahri: 167 to 141 | 0 | +0.0% | 185 to 185 (+0.0%) | 0 to 0 | 0 | none / none |
| II | Auron 276.2 to 270.3 | Auron: 141 to 135 | 0.181 | +1.6% | 225.6 to 228.1 (+1.1%) | 0 to 0 | 0 | none / none |
| III | Auron 268 to 261.4 | Auron: 152 to 145 | 0.19 | +1.5% | 164.1 to 165.4 (+0.8%) | 0 to 0 | 0 | none / none |
| VII | Rikku 257.6 to 269.8 | Rikku: 122 to 134 | 0.16 | +1.3% | 182.3 to 183.8 (+0.8%) | 0 to 0 | 0 | none / none |
| VIII | Wakka 255.3 to 229 | Wakka: 120 to 93 | 0 | +0.0% | 241.2 to 241.1 (-0.0%) | 0 to 0 | 0 | none / none |
| IX | Kimahri 267.1 to 240.4 | Yuna: 140 to 0 | 0 | n/a (no Tidus) | 128.9 to 128.9 (+0.0%) | 0 to 0 | 0 | none / kimahri |
| X | Kimahri 340.6 to 312.1 | Kimahri: 224 to 196 | 0 | +0.0% | 124.8 to 124.8 (+0.0%) | 0 to 0 | 0 | none / none |
| XII | Auron 278.7 to 272.8 | Auron: 131 to 125 | 0 | +0.0% | 154.9 to 154.9 (+0.0%) | 0 to 0 | 0 | none / none |
| XIV | Yuna 279.1 to 279.1 | Yuna: 163 to 163 | 0 | n/a (no Tidus) | 160.5 to 160.5 (+0.0%) | 0 to 0 | 0 | none / none |
| XVII | Auron 274.6 to 268.9 | Auron: 86 to 80 | 0 | +0.0% | 257.3 to 257.3 (+0.0%) | 0 to 0 | 0 | none / none |
| XVIII | Auron 253.8 to 248.1 | Auron: 122 to 116 | 0 | +0.0% | 308.2 to 308.2 (+0.0%) | 0 to 0 | 0 | none / none |
