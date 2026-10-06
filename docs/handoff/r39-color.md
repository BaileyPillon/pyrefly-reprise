# r39-color: the figures look washed out and too vibrant (release 39, 2026-10-04)

Branch `r39-color` (worktree `D:/pyrefly-r39-color`, cut from `origin/r39-int` 0e2a27f4), one Sonnet 5.5 sub-agent of the driver session. Nothing here is on `main`.
The driver cleared 4436541a into release 39 with the switch OFF; whether it is turned on is Bailey's pick from the stills.
Game case (AGENTS.md rule 14): **both games**. The cause is shared rendering (`GradeShader`, `Renderer`, `BloomMask`); the amounts differ by scene and are given per figure.
FFX was measured in Chapters I and III, FFX-2 in Chapters IV and VI. FF7 and the unlisted chapters were not run.

Bailey, 2026-10-04 (EDT, the driver's corrected times):

- 23:14: "For some reason colors look washed out like it's masking better character model detail"
- 23:21: "It's like the colors are vibrant but too vibrant? See here", with two phone photos of his monitor showing live release 38: FFX-2 Chapter VI (Chateau Leblanc),
  Yuna Gunner, Rikku and Paine on a blue-violet floor with a lavender or white outline round the figures, a strong blue-violet cast, and white clothes and hair gone flat lavender.

## Verdict

1. **Both sentences are true at once, and live 38 and r39-int are alike.** Measured on the party and the bosses (15 figures, 2560x1440, headless GPU, each painting warped into the figure's own
   on-screen quad): median CIEDE2000 7.8 to 20 off the painting, chroma 0.9 to 2.4 times the painting's, mean lightness 5 to 19 L* low, white clothes and hair tinted
   (Chapter VI: the share of Yuna's pixels with any channel at 250 or more goes from 25 to 70 percent), and at the same time the darkest tones are lifted a little and the whites dimmed. Live 38 and r39-int agree
   within the run noise. F plus, CAS and the hi-res art tiers are not causes (switching them off moves nothing).
2. **Root cause, a technical defect: the colour chain never applies the sRGB encode.** `GradeShader` is the composer's last pass, a raw `ShaderMaterial` with no `<colorspace_fragment>`, and the composer's
   targets are linear, so `outputColorSpace = SRGBColorSpace` is never applied. Every painting is decoded to linear on the way in and shown as if it were sRGB on the way out: its gamma is applied twice
   (darker, more saturated). Proof by running: with every pass neutral and the encode added, 11 of 11 figures (Chapter VI: 6, Chapter I: 5) reproduce their painting to median dE00 0.8 to 2.4; the same neutral chain without it is 8.5 to 23 off.
   The repo knew parts of this (Zanarkand's gamma 2.3, the Evrae plate, `BloomMask.ts` "the renderer's display transform", `evrae-airship-daylight.ts`) but not that it is every figure in every chapter.
3. **Everything else was tuned against that error, and each piece adds a cast or a halo.** These are deliberate looks, so they are not changed here. The scene grade (Chapter VI: gain 1.08/0.94/1.05,
   lift 0.02/0.006/0.018, saturation 1.1) is the largest source of the cast, of the lavender whites and of the clipping; the A look LUT, the A bloom (threshold 0.45) and the A key rim (strength 1.35, lavender)
   add the rest. The rim is one-sided (edges facing right gain +45 to +59 L* inside a 3 px band, edges facing left nothing) and its spill, plus the bloom, makes the pale ring just outside the silhouette.
4. **Not causes (measured):** trapped white under the alpha (the paintings' own edge pixels are 0 to 5 L* darker than a clean edge, never lighter), F plus and CAS, the MAX mix's smooth edges, fog and
   depth of field (within the run noise on figures), the B and C looks, PhaseLighting (not active at a first menu), the figure shader's alpha handling (a neutral chain's fringe is within 2 L*).
5. **What changed in the repo:** a default-OFF switch, `?figtrue=0..1` or `__pyrefly.fx.figureTrue(v)` (4436541a, with its follow-up ef0868b5). Off, the frame is byte-identical to the committed grade shader (0 of 3,686,400 pixels differ on
   the same frozen frame). On, figures show their painting's colour; backdrops are untouched. It is paler and calmer than today (Bahamut's wings go from deep red to dusty salmon), so it is Bailey's pick.

## The three states, on the same frozen frames

Stills: `docs/screenshots/r39-color/`, three scenes (FFX-2 Chapter VI, Bailey's photographed trio; FFX Chapter I; FFX-2 Chapter IV with Bahamut). `<scene>-sheet.jpg` has the three states side by side with each state's dE00, chroma and halo burned in;
`<scene>-1-today.jpg`, `-2-figures-true.jpg`, `-3-whole-frame-true.jpg` are the full 2560x1440 frames; `<scene>-live38.jpg` is live release 38; `<scene>-<figure>-strip.jpg` is the figure at 100 percent: live 38, today (r39-int), figures true, whole frame true, the painting.
The three r39 frames of a scene come from ONE session and ONE frozen frame (the camera drift, haze and lamps cannot differ between the states); live 38 is its own session. The first round of stills (the prototype options, including the dialled-down one) is parked in `F:/pyrefly-parked/2026-10-05/r39-color/stills-round1/`.

1. **Today** (live 38 and r39-int look the same).
2. **Figures true** (the switch on, `figureTrue` 1): a painted figure shows its painting's own colour through the sRGB encode and skips the scene grade, shadow tint, saturation and look; it is no bloom source, the grade takes the bloom's light back off it, and its rim is cut to 0.45.
3. **The whole frame true**: the sRGB encode added at the end of the chain for everything (backdrop, floor, in-scene effects), with every look at its current setting. The spell-effect overlay is drawn after the chain
   and is not in this (it would need the same encode).

| scene | figure | state | dE00 | chroma (painting) | mean L* (painting) | clip % (painting) | halo | ring | p2 |
|---|---|---|---|---|---|---|---|---|---|
| FFX-2 Ch VI | yuna | 1 today | 16.9 | 53 (27.9) | 55.5 (65.7) | 69.5 (25.5) | 17.6 | 5.3 | 0.6 |
| FFX-2 Ch VI | yuna | 2 figures true | 2 | 27.2 (27.9) | 67.5 (65.7) | 34.9 (25.5) | 8.4 | 2 | 2.9 |
| FFX-2 Ch VI | yuna | 3 whole frame true | 8.4 | 40.5 (27.9) | 67.2 (65.7) | 71.6 (25.5) | 16.3 | 6.2 | 7.4 |
| FFX-2 Ch VI | rikku | 1 today | 17.9 | 70.3 (45.9) | 48.6 (59.8) | 58.4 (24.6) | 16.2 | 8 | 0.5 |
| FFX-2 Ch VI | rikku | 2 figures true | 2.4 | 43.9 (45.9) | 60.7 (59.8) | 32.3 (24.6) | 5.8 | 3.6 | 8.1 |
| FFX-2 Ch VI | rikku | 3 whole frame true | 9.5 | 59.5 (45.9) | 60 (59.8) | 60.2 (24.6) | 13.8 | 9.3 | 6.6 |
| FFX-2 Ch VI | paine | 1 today | 13.1 | 28.7 (12.2) | 29.3 (35.2) | 22.6 (9.1) | 24.8 | 4.1 | 0.1 |
| FFX-2 Ch VI | paine | 2 figures true | 3.2 | 12.3 (12.2) | 39.4 (35.2) | 13.4 (9.1) | 17.1 | 1.2 | 0 |
| FFX-2 Ch VI | paine | 3 whole frame true | 14.4 | 31.4 (12.2) | 41 (35.2) | 24 (9.1) | 26.6 | 4.8 | 1.5 |
| FFX Ch I | tidus | 1 today | 11.5 | 40.5 (28) | 31.4 (41.2) | 17.7 (19.2) | 11.8 | 0.9 | 0.1 |
| FFX Ch I | tidus | 2 figures true | 4.1 | 27.3 (28) | 44.6 (41.2) | 24.2 (19.2) | 1.7 | 0.9 | 5 |
| FFX Ch I | tidus | 3 whole frame true | 10.7 | 43.3 (28) | 43 (41.2) | 25.2 (19.2) | 12.4 | 0.3 | 1.3 |
| FFX Ch I | yuna | 1 today | 15.8 | 53.8 (34.7) | 41.3 (51.8) | 32.6 (22.6) | 22.3 | 2.8 | 0.1 |
| FFX Ch I | yuna | 2 figures true | 2.4 | 33.7 (34.7) | 53.7 (51.8) | 28.3 (22.6) | 10.2 | 0.7 | 2.7 |
| FFX Ch I | yuna | 3 whole frame true | 8.2 | 48.8 (34.7) | 52.9 (51.8) | 43.1 (22.6) | 22.7 | 1.2 | 1.4 |
| FFX Ch I | seymour-flux | 1 today | 16.9 | 44.8 (27.9) | 24.8 (43.3) | 14.3 (1.6) | 20.5 | 4.3 | 0.3 |
| FFX Ch I | seymour-flux | 2 figures true | 1.3 | 27.1 (27.9) | 44.4 (43.3) | 2.3 (1.6) | 6.4 | 2.8 | 6.6 |
| FFX Ch I | seymour-flux | 3 whole frame true | 9.2 | 46.9 (27.9) | 41.1 (43.3) | 19.4 (1.6) | 18 | 2.6 | 4 |
| FFX-2 Ch IV | yuna | 1 today | 15.3 | 38.5 (22.2) | 60.4 (71) | 40.1 (26.1) | 11.4 | 10.5 | 1.3 |
| FFX-2 Ch IV | yuna | 2 figures true | 1.7 | 21.3 (22.2) | 71.6 (71) | 30.7 (26.1) | 2.3 | 6 | 13.3 |
| FFX-2 Ch IV | yuna | 3 whole frame true | 7.1 | 30.7 (22.2) | 72.5 (71) | 42 (26.1) | 12.1 | 8.5 | 14.3 |
| FFX-2 Ch IV | bahamut | 1 today | 15.5 | 32.2 (22.3) | 15.1 (26.7) | 3.8 (0.1) | 27 | -1.6 | 0.6 |
| FFX-2 Ch IV | bahamut | 2 figures true | 4.9 | 19.7 (22.3) | 32.7 (26.7) | 0.3 (0.1) | 11.3 | -5.4 | 7.7 |
| FFX-2 Ch IV | bahamut | 3 whole frame true | 11.9 | 38.7 (22.3) | 33 (26.7) | 4.2 (0.1) | 21.9 | -1 | 7.5 |
| FFX-2 Ch IV | rikku | 1 today | 12.9 | 33 (26.1) | 20.8 (32) | 17.2 (4) | 20.2 | 11.9 | 0.4 |
| FFX-2 Ch IV | rikku | 2 figures true | 3.5 | 24.1 (26.1) | 35.4 (32) | 4.4 (4) | 7.5 | 7.4 | 4.1 |
| FFX-2 Ch IV | rikku | 3 whole frame true | 11 | 40.3 (26.1) | 35.4 (32) | 18.7 (4) | 21.2 | 10.1 | 5.7 |
| FFX-2 Ch IV | paine | 1 today | 7.9 | 21.2 (12.3) | 29.3 (34.8) | 16.8 (8.8) | 25 | 1.9 | 0.3 |
| FFX-2 Ch IV | paine | 2 figures true | 4.8 | 11.3 (12.3) | 41.8 (34.8) | 9.7 (8.8) | 13.6 | -0.2 | 5.8 |
| FFX-2 Ch IV | paine | 3 whole frame true | 11.9 | 24.2 (12.3) | 43.1 (34.8) | 19.1 (8.8) | 26.1 | 1.9 | 4.8 |

(dE00 median over the figure's opaque interior; chroma is mean C*ab, the painting's in brackets; clip is the share of interior pixels with any channel at 250 or more; halo is the outline measure below; ring is the mean lightness a figure adds in the 3 px just outside its silhouette; p2 is the black point.)

**Outline halo metric:** mean L* of the band 0.5 to 3 px just inside the silhouette minus the band 6 to 10 px inside, minus the same difference on the painting (so a painted dark outline does not count). A rim light or a matte shows as a large positive number.
**Highlight clipping metric:** the share of interior pixels with any channel at 250 or more, against the painting's own share.

### In plain words, per scene

```
ffx2-leblanc / yuna
  strongest colour painting magenta (L*43 C*40) | today magenta (L*40 C*60) | figures true magenta (L*47 C*37) | whole frame true magenta (L*49 C*55)
  highlights       painting near white (L*96 C*3) | today pale magenta (L*94 C*13) | figures true near white (L*97 C*3) | whole frame true near white (L*97 C*5)
  shadows          painting dark magenta (L*8 C*26) | today dark magenta (L*11 C*27) | figures true dark magenta (L*19 C*23) | whole frame true dark magenta (L*23 C*43)

ffx2-leblanc / rikku
  strongest colour painting orange (L*59 C*55) | today orange (L*57 C*63) | figures true orange (L*62 C*49) | whole frame true orange (L*63 C*57)
  highlights       painting pale yellow (L*90 C*32) | today pale yellow (L*86 C*39) | figures true pale yellow (L*92 C*29) | whole frame true pale yellow (L*93 C*30)
  shadows          painting dark red (L*19 C*10) | today dark magenta (L*8 C*20) | figures true dark red (L*21 C*10) | whole frame true dark magenta (L*20 C*33)

ffx2-leblanc / paine
  strongest colour painting red-orange (L*42 C*52) | today red (L*41 C*53) | figures true red-orange (L*49 C*42) | whole frame true red (L*54 C*50)
  highlights       painting near white (L*92 C*5) | today pale magenta (L*90 C*19) | figures true near white (L*94 C*5) | whole frame true pale magenta (L*95 C*9)
  shadows          painting near black (L*0 C*0) | today dark magenta (L*10 C*12) | figures true near black (L*11 C*3) | whole frame true dark magenta (L*18 C*24)
seymour-flux / tidus
  strongest colour painting red-orange (L*57 C*38) | today red-orange (L*47 C*44) | figures true red-orange (L*57 C*33) | whole frame true red-orange (L*57 C*38)
  highlights       painting pale green (L*92 C*20) | today pale yellow (L*83 C*25) | figures true pale yellow (L*89 C*18) | whole frame true pale green (L*90 C*21)
  shadows          painting near black (L*0 C*0) | today near black (L*4 C*5) | figures true near black (L*11 C*4) | whole frame true dark violet (L*11 C*20)

seymour-flux / yuna
  strongest colour painting red (L*51 C*25) | today magenta (L*43 C*40) | figures true red (L*53 C*22) | whole frame true magenta (L*53 C*32)
  highlights       painting pale yellow (L*95 C*12) | today pale yellow (L*90 C*18) | figures true pale yellow (L*94 C*12) | whole frame true pale yellow (L*95 C*15)
  shadows          painting dark violet (L*1 C*10) | today near black (L*8 C*6) | figures true dark violet (L*11 C*9) | whole frame true dark violet (L*14 C*23)

seymour-flux / seymour-flux
  strongest colour painting magenta (L*44 C*39) | today dark magenta (L*27 C*69) | figures true magenta (L*45 C*37) | whole frame true magenta (L*42 C*68)
  highlights       painting pale violet (L*85 C*11) | today pale violet (L*74 C*33) | figures true pale violet (L*84 C*11) | whole frame true pale violet (L*86 C*17)
  shadows          painting dark violet (L*8 C*19) | today near black (L*2 C*5) | figures true dark violet (L*13 C*16) | whole frame true dark violet (L*11 C*30)
ffx2-bahamut / bahamut
  strongest colour painting red (L*48 C*36) | today red (L*35 C*53) | figures true red (L*50 C*33) | whole frame true red (L*51 C*49)
  highlights       painting pink (L*58 C*30) | today red (L*43 C*52) | figures true pink (L*59 C*29) | whole frame true pink (L*59 C*44)
  shadows          painting near black (L*2 C*2) | today near black (L*5 C*8) | figures true near black (L*16 C*1) | whole frame true dark violet (L*19 C*22)

ffx2-bahamut / yuna
  strongest colour painting red-orange (L*47 C*58) | today red-orange (L*38 C*65) | figures true red-orange (L*49 C*56) | whole frame true red-orange (L*48 C*65)
  highlights       painting near white (L*100 C*0) | today near white (L*97 C*6) | figures true near white (L*100 C*0) | whole frame true near white (L*99 C*3)
  shadows          painting dark red (L*26 C*30) | today dark red (L*17 C*22) | figures true red (L*32 C*28) | whole frame true red (L*33 C*34)
```

(Each line is the figure's 15 percent most saturated pixels, its 15 percent lightest and its 15 percent darkest, chosen on the painting and read at the same pixels in every state.)

- **FFX-2 Chapter VI, Bailey's photographed trio.** Today: Yuna's skin is hot orange-pink and her white top and Paine's white hair turn pale magenta-lavender (the highlights go from white, L* 96, C* 3 to pale magenta, L* 94, C* 13); Paine's black clothes lose their depth to dark magenta;
  every right-facing edge carries a lavender outline. Figures true: Yuna's skin is peach again, her top white, her hair brown, Paine's hair silver-white, Rikku's orange as painted, the outline mostly gone, and all three are about 10 L* lighter. The floor, the heart door and the glow are identical.
  Whole frame true: the figures are still tinted (Yuna's chroma 40 against 28, 72 percent of her pixels clipped, because the scene grade and the look still tint them) and the whole room goes milky (see the backdrop numbers below).
- **FFX Chapter I.** Today: Seymour Flux's robe is a dark, hard magenta (L* 27, C* 69) where the painting is a softer magenta (L* 44, C* 39), his pale-violet highlights go from L* 85, C* 11 to L* 74, C* 33; Tidus's red-orange shirt is darker and stronger (L* 47, C* 44 against 57 and 38); Yuna's red goes to magenta.
  Figures true: all three match their paintings (dE00 1.3 to 4.1).
- **FFX-2 Chapter IV, Bahamut.** Today: the wings are a deep, saturated red (L* 35, C* 53) with red highlights (L* 43, C* 52) and a near-black body. Figures true: the wings go from deep red to dusty salmon-pink (red L* 50, C* 33, pink highlights L* 59, C* 29), which is what the painting is; the dark body goes from near-black to charcoal grey (L* 5 to 16: see "the veil on a boss" below);
  Yuna's white robe goes from near-white with a lavender cast (L* 97, C* 6) to plain white.

**What the backdrop does** (the frame without the figures; figures true leaves it unchanged to the pixel, the whole-frame state does not):

```
ffx2-leblanc         today             backdrop L* p2   0.1 p50   9.5 p98  76.8 | mean chroma  41.4 | below L* 8: 45.1 %
ffx2-leblanc         figures true      backdrop L* p2   0.1 p50   9.5 p98  76.8 | mean chroma  41.4 | below L* 8: 45.1 %
ffx2-leblanc         whole frame true  backdrop L* p2   2.6 p50  30.3 p98  87.7 | mean chroma  53.0 | below L* 8: 13.6 %
seymour-flux         today             backdrop L* p2   3.6 p50  25.1 p98  77.8 | mean chroma  68.0 | below L* 8: 7.4 %
seymour-flux         figures true      backdrop L* p2   3.6 p50  25.1 p98  77.8 | mean chroma  68.0 | below L* 8: 7.4 %
seymour-flux         whole frame true  backdrop L* p2  22.6 p50  49.0 p98  88.0 | mean chroma  54.0 | below L* 8: 0.0 %
ffx2-bahamut         today             backdrop L* p2   1.1 p50  10.7 p98  89.7 | mean chroma  26.4 | below L* 8: 41.0 %
ffx2-bahamut         figures true      backdrop L* p2   1.1 p50  10.7 p98  89.7 | mean chroma  26.4 | below L* 8: 41.0 %
ffx2-bahamut         whole frame true  backdrop L* p2  12.9 p50  38.2 p98  95.3 | mean chroma  28.9 | below L* 8: 0.2 %
```

## Numbers per figure: live 38, r39-int, switch on

Each cell: median dE00 / chroma as a multiple of the painting's / halo. Scenes were captured in one frozen frame each (breathing and KO collapse off so a figure does not drift a few pixels between sessions; with them on every edge number moves by 2 to 5).
"Switch on" is the real switch (`?figtrue=1`, 4436541a) for Chapters I, IV and VI (`ab3`), the prototype for Chapter III.

| scene | figure | painting: L*, C*, clip % | live 38: dE00 / chroma x / halo | r39-int: dE00 / chroma x / halo | switch on (r39-color): dE00 / chroma x / halo |
|---|---|---|---|---|---|
| FFX Ch I | tidus | 41.4, 28.1, 18.5 | 10.2 / 1.47x / 15.4 | 11.8 / 1.47x / 10.2 | 4.1 / 0.97x / 1.7 |
| FFX Ch I | yuna | 51.9, 34.9, 22.3 | 15.8 / 1.52x / 23.7 | 15.5 / 1.55x / 20.6 | 2.4 / 0.97x / 10.2 |
| FFX Ch I | seymour-flux | 43.3, 27.8, 1.6 | 17.4 / 1.58x / 21.2 | 17 / 1.62x / 19.3 | 1.3 / 0.97x / 6.4 |
| FFX Ch I | kimahri | 45.8, 28.3, 3.9 | 20 / 1.8x / 21.2 | 20 / 1.8x / 20.2 | 2.1 / 0.95x / 5.8 |
| FFX Ch III | auron | 40.3, 27.5, 0.3 | 18 / 1.06x / 16.3 | 18.2 / 1.08x / 19.5 | 1.6 / 0.99x / 2.8 (proto) |
| FFX Ch III | tidus | 41.3, 27.8, 18.5 | 14.6 / 1.13x / 10.9 | 14.8 / 1.12x / 12.6 | 1.9 / 0.99x / 1.2 (proto) |
| FFX Ch III | yuna | 45.6, 33.4, 11.4 | 18.3 / 0.9x / 12.9 | 18.3 / 0.92x / 15.9 | 2 / 1.02x / 4 (proto) |
| FFX Ch III | braskas-final-aeon | 30.2, 19.9, 0.7 | 16.2 / 1.09x / 15.1 | 16.8 / 1.09x / 18.6 | 1.4 / 1x / 5.3 (proto) |
| FFX-2 Ch IV | yuna | 71, 22.2, 26.1 | 14.8 / 1.72x / 13 | 15.1 / 1.73x / 15.5 | 1.7 / 0.96x / 2.3 |
| FFX-2 Ch IV | bahamut | 26.7, 22.3, 0.1 | 15.6 / 1.44x / 26.9 | 15.6 / 1.45x / 28.5 | 4.9 / 0.88x / 11.3 |
| FFX-2 Ch IV | rikku | 32, 26.1, 3.9 | 12.3 / 1.28x / 27.7 | 12.8 / 1.27x / 20.7 | 3.5 / 0.92x / 7.5 |
| FFX-2 Ch IV | paine | 34.8, 12.2, 9.2 | 8.2 / 1.79x / 24.4 | 7.8 / 1.72x / 26.9 | 4.8 / 0.92x / 13.6 |
| FFX-2 Ch VI | yuna | 65.7, 27.9, 25.5 | 16.5 / 1.89x / 15.8 | 16.9 / 1.89x / 17.1 | 2 / 0.97x / 8.4 |
| FFX-2 Ch VI | rikku | 59.8, 45.9, 24.6 | 17.9 / 1.55x / 13.8 | 17.8 / 1.53x / 16.1 | 2.4 / 0.96x / 5.8 |
| FFX-2 Ch VI | paine | 35.2, 12.4, 9.1 | 13.6 / 2.38x / 22 | 13 / 2.31x / 24.6 | 3.2 / 1x / 17.1 |

## Attribution (what moves the numbers)

Method: every pass, look and part toggled one at a time, in a fresh session (still figures), and again in one session on one frozen frame (`abtog`); numbers agree to about 1.5 dE00.

### Today minus one thing (FFX-2 Chapter VI, Yuna; r39-int)

**ffx2-leblanc / yuna**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| today | 16.9 | 55.4 | 52.8 | 22.9 | -7.7 | 70 | 0.4 | 96.3 | 30.3 | 17.2 | 5.8 | 2.6 (2.9) | 87.7 (93.1) |
| no rim | 17.3 | 53.4 | 53.5 | 23.4 | -6 | 69.4 | 0.2 | 96.1 | 30.4 | -5.4 | 0.5 | 0.6 (2.9) | 86.7 (93.2) |
| no bloom | 17.3 | 54.6 | 53.1 | 23.1 | -7 | 69.8 | 0.2 | 96.3 | 30.3 | 17.2 | 2.5 | 2.1 (2.9) | 87.1 (93.1) |
| no look LUT | 16 | 55.1 | 46.5 | 18.5 | -5 | 63.1 | 1.5 | 97.8 | 29.4 | 17.5 | 5.2 | 4.5 (2.9) | 86 (93.1) |
| neutral grade (also no LUT) | 13.6 | 55.1 | 36.8 | 8.4 | 0.6 | 31.3 | 1.2 | 100 | 30.8 | 18.1 | 5.7 | 4 (2.8) | 88.5 (93.1) |
| looks A+B+C off | 11.7 | 60.7 | 38.8 | 11.8 | -5.6 | 65.1 | 2.4 | 100 | 30.4 | 10.4 | 10 | 8.3 (2.9) | 93 (93.1) |
| no F plus | 16.5 | 55.3 | 52.5 | 22.7 | -9.3 | 67.3 | 0.4 | 96.1 | 30.1 | 16.1 | 4.4 | 2.4 (2.8) | 87.6 (93.1) |
| no smooth edges | 16.4 | 55.4 | 51.8 | 22 | -9 | 68.8 | 0.4 | 96.3 | 30.7 | 19 | 6.5 | 2.3 (2.9) | 88.1 (93.1) |
| everything neutral | 14.5 | 51.6 | 35.9 | 7.2 | 1.2 | 12.9 | 0 | 99.3 | 31.4 | -3.9 | -0.6 | 0.2 (2.9) | 86.5 (93.1) |
| everything neutral + the encode | 0.8 | 65.1 | 27.9 | 0 | 0 | 27.4 | 0.3 | 99.7 | 30.4 | -0.3 | -0.7 | 4.2 (2.9) | 93.2 (93.1) |
| (painting) | 0 | 65.7 | 27.9 | 0 | 0 | 25.4 | 0.1 | 99.4 | 29.8 | 0 | - | | |

Reading it: the **neutral chain** (every pass off) is dE00 14.5 and the **same chain with the encode** is 0.8, so the missing encode is the baseline error. On top of today's frame the **scene grade** carries the cast and the clipping
(chroma 52.8 to 36.8 and clip 70 to 31 percent when neutral), the **LUT** a further 6 of chroma, the **rim** the whole outline (halo 17 to -5, ring 5.8 to 0.5), the **bloom** about half of the ring outside (5.8 to 2.5).
F plus, smooth edges: nothing. Removing the additive lights alone (no bloom, no rim, A off) does not improve the colour error because they were brightening a figure the missing encode had darkened: that is why the two were never separated.

### Today minus one thing (FFX Chapter I, Tidus; r39-int)

**seymour-flux / tidus**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| today | 11.5 | 31 | 41.1 | 8.8 | -7.5 | 17.2 | 0.1 | 96.1 | 32.8 | 14.8 | 3.9 | 2.2 (1.1) | 81.3 (90.6) |
| no rim | 11.5 | 29.9 | 40.2 | 9 | -6.4 | 16.7 | 0.1 | 96 | 32.8 | -6.1 | -0.5 | 1 (1.1) | 81.2 (90.5) |
| no bloom | 12.8 | 22.7 | 43.5 | 12.5 | -18.7 | 11.9 | 1.1 | 84.3 | 26.2 | 7.9 | 0 | 2.6 (1) | 74.1 (89.5) |
| no look LUT | 13.1 | 32.4 | 37.1 | 8.3 | -6.7 | 27.6 | 1 | 98.5 | 30.7 | 11.7 | 0.6 | 4.2 (1.1) | 81.4 (90.6) |
| neutral grade (also no LUT) | 13.9 | 31.1 | 29.1 | 2.7 | 0.5 | 21.1 | 0.5 | 99.6 | 32.2 | 6.3 | 1.6 | 4 (1.1) | 79.1 (90.6) |
| everything neutral | 14 | 28.8 | 29.2 | 3.9 | 1.5 | 21.1 | 0 | 99.7 | 32.1 | -5.4 | -0.1 | 0.2 (1.1) | 82.8 (90.6) |
| everything neutral + the encode | 2.1 | 41.7 | 27.7 | 0.4 | 0.7 | 23.2 | 0 | 99.7 | 33.8 | -3 | -0.2 | 3.6 (1.1) | 90.4 (90.5) |
| (painting) | 0 | 41.4 | 28.2 | 0 | 0 | 18.5 | 0 | 98.4 | 34.3 | 0 | - | | |

(The bloom here brightens Tidus by 8 L* and takes away the blue cast of the shadows: in FFX it compensates the darkening, so removing it alone makes the figure darker.)

### One thing added to a correct chain (the marginal harm of each look once the encode is right)

FFX-2 Chapter VI, Yuna (r39-int, a fresh session each, breathing on so the edge columns are noisy):

**ffx2-leblanc / yuna**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a correct chain (neutral + the encode) | 0.8 | 65 | 27.8 | -0.1 | 0.1 | 27.4 | 0.3 | 99.7 | 30.5 | -0.4 | -0.7 | 4.1 (2.9) | 93.2 (93.1) |
| + the scene grade | 6.1 | 66.4 | 34 | 7.2 | -4.7 | 61.6 | 11.6 | 98 | 27.3 | -0.4 | -0.6 | 13.5 (2.8) | 92.2 (93.1) |
| + the A bloom | 4.3 | 72.8 | 21.9 | -3.3 | 0.5 | 52.8 | 14.8 | 100 | 25 | -0.1 | 6 | 26.6 (2.9) | 96.1 (93.1) |
| + the rim | 2 | 66.6 | 28 | 0 | 0.6 | 33.3 | 1.3 | 100 | 29.3 | 12.1 | 0.5 | 8.5 (2.9) | 93.5 (93.1) |
| + the whole A look | 2.4 | 71.7 | 24 | -1.3 | -0.2 | 40.6 | 22.3 | 100 | 23.8 | 15.9 | 7.7 | 31.7 (2.9) | 94.5 (93.1) |
| (painting) | 0 | 65.7 | 27.9 | 0 | 0 | 25.4 | 0.1 | 99.4 | 29.8 | 0 | - | | |

FFX Chapter I, Tidus:

**seymour-flux / tidus**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| a correct chain (neutral + the encode) | 2.1 | 41.6 | 27.8 | 0.5 | 0.6 | 23.3 | 0 | 99.7 | 33.8 | -3.2 | -0.1 | 3.4 (1.1) | 90.4 (90.5) |
| + the scene grade | 6.3 | 47.2 | 34.5 | 4.4 | -8.5 | 29 | 13.3 | 99.3 | 28.8 | -4.7 | -0.1 | 16.7 (1.1) | 90.3 (90.5) |
| + the A bloom | 6.2 | 50.5 | 22.9 | -1.5 | 0.7 | 27.6 | 7.5 | 100 | 29.5 | -5.1 | 5 | 19.9 (1.1) | 93.1 (90.6) |
| + the rim | 2.2 | 43.2 | 27.4 | 0.1 | 0.4 | 23.7 | 0 | 99.7 | 33.5 | 11 | 0.5 | 6.2 (1.1) | 90.6 (90.6) |
| + the whole A look | 4.7 | 47.3 | 25.9 | -1.5 | -0.1 | 24.7 | 10.9 | 100 | 29.8 | 14.3 | 1 | 16.1 (1.1) | 90.8 (90.5) |
| (painting) | 0 | 41.4 | 28.1 | 0 | 0 | 18.6 | 0 | 98.4 | 34.3 | 0 | - | | |

This is the "washed out" signature: in a correct chain the scene grade lifts the black point (p2 0.1 to 11.6: its lift of 0.02 is no longer hidden), the A bloom lifts the shadows (shadow bin 2.9 to 26.6) and the whole A look takes p2 to 22 while the standard deviation of lightness falls from 30 to 24.

### The suspects of the second report, toggled on live 38 and on r39-int (FFX-2 Chapter VI, one frozen frame each)

Live 38:

**ffx2-leblanc / yuna**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| live 38 today | 16.4 | 55.8 | 52.9 | 23 | -9.6 | 68.1 | 0.7 | 96.1 | 29.8 | 16.4 | 4.1 | 3.6 (2.9) | 87.8 (93.1) |
| no rim | 16.7 | 53.8 | 53.4 | 23.3 | -8 | 66.9 | 0.4 | 95.8 | 30 | -5 | 0.1 | 1.5 (2.9) | 86.9 (93.1) |
| no bloom | 16.8 | 54.8 | 52.8 | 22.8 | -8.7 | 67.4 | 0.2 | 96.1 | 30.1 | 15.8 | 1.9 | 2.2 (2.9) | 87.3 (93.1) |
| no look LUT | 15.5 | 55.3 | 45.9 | 18.1 | -6.3 | 59.6 | 2.3 | 97.1 | 28.7 | 16.5 | 3.9 | 6 (2.9) | 85.6 (93.1) |
| no palette grade (lift gain saturation shadow tint) | 13 | 56.1 | 44 | 13.4 | -2.2 | 62 | 0.4 | 97 | 31.6 | 15.9 | 4 | 2.9 (2.9) | 89.8 (93.1) |
| neutral grade (also no LUT or vignette or grain) | 13 | 55.1 | 35.4 | 7.2 | -0.1 | 23.5 | 1.8 | 100 | 30.1 | 17 | 4.1 | 5.3 (2.9) | 87.8 (93.1) |
| no smooth edges | 16.4 | 55.6 | 52.8 | 22.9 | -9.6 | 68.3 | 0.7 | 96.1 | 30 | 17.6 | 4.3 | 3.6 (2.9) | 87.8 (93.1) |
| no fog | 16.4 | 55.8 | 52.9 | 23 | -9.6 | 68.1 | 0.7 | 96.1 | 29.8 | 16.4 | 4.1 | 3.6 (2.9) | 87.8 (93.1) |
| no depth of field | 16.4 | 55.8 | 52.9 | 23 | -9.6 | 68 | 0.7 | 96.1 | 29.8 | 16.4 | 4.2 | 3.6 (2.9) | 87.8 (93.1) |
| (painting) | 0 | 65.7 | 27.9 | 0 | 0 | 25.3 | 0.1 | 99.4 | 29.8 | 0 | - | | |

**ffx2-leblanc / paine**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| live 38 today | 13.5 | 29.1 | 29.2 | 14 | -11.4 | 21.4 | 0.1 | 94.6 | 33.6 | 21.4 | 2.6 | 1.9 (1.2) | 89.3 (92.8) |
| no rim | 11.7 | 25.5 | 25.4 | 10.9 | -7.1 | 18.4 | 0 | 92.8 | 32.7 | -2.9 | 0 | 0.3 (1.2) | 88.3 (92.8) |
| no bloom | 13.6 | 28 | 28.2 | 13.3 | -10.5 | 20.6 | 0 | 94.2 | 33.2 | 21 | 0.8 | 1.6 (1.2) | 88.3 (92.8) |
| no look LUT | 13.6 | 29.7 | 22.1 | 9.4 | -7.2 | 17.2 | 0.7 | 93 | 31.4 | 21 | 2.5 | 3.5 (1.2) | 85.7 (92.8) |
| no palette grade (lift gain saturation shadow tint) | 8.3 | 28.3 | 20 | 6.3 | -5.6 | 17.4 | 0 | 96 | 34.3 | 21.7 | 2.5 | 1.5 (1.2) | 91.5 (92.8) |
| neutral grade (also no LUT or vignette or grain) | 8.2 | 29.3 | 14.2 | 2.1 | -1.9 | 12.7 | 0.4 | 96 | 32.3 | 21.2 | 2.6 | 2.8 (1.2) | 88 (92.8) |
| no smooth edges | 13.4 | 29.2 | 29.4 | 14.1 | -11.6 | 21.7 | 0.1 | 94.8 | 33.6 | 23.5 | 3.8 | 2 (1.2) | 89.5 (92.8) |
| no fog | 13.4 | 29.3 | 29.3 | 14 | -11.6 | 21.5 | 0.1 | 94.9 | 33.6 | 21.4 | 2.5 | 1.9 (1.2) | 89.6 (92.8) |
| no depth of field | 13.5 | 29.1 | 29.2 | 14 | -11.4 | 21.4 | 0.1 | 94.6 | 33.6 | 21.4 | 2.6 | 1.9 (1.2) | 89.3 (92.8) |
| (painting) | 0 | 35.2 | 12.2 | 0 | 0 | 8.9 | 0 | 94.2 | 34.7 | 0 | - | | |

r39-int:

**ffx2-leblanc / yuna**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r39-int today | 16.9 | 55.2 | 52.7 | 22.8 | -7.6 | 69.5 | 0.2 | 96.3 | 30.3 | 17.4 | 5.8 | 2.3 (2.8) | 87.5 (93.1) |
| no rim | 17.3 | 53.3 | 53.3 | 23.2 | -5.9 | 68.5 | 0.1 | 96.1 | 30.4 | -5.5 | 0.7 | 0.6 (2.8) | 86.5 (93.1) |
| no bloom | 17.3 | 54.5 | 52.9 | 23 | -6.9 | 69 | 0.1 | 96.1 | 30.4 | 17.4 | 2.5 | 1.9 (2.8) | 86.9 (93.1) |
| no look LUT | 16 | 54.9 | 46.4 | 18.5 | -4.8 | 63.1 | 1.3 | 97.8 | 29.5 | 17.5 | 5.2 | 4.2 (2.8) | 85.9 (93.1) |
| no palette grade (lift gain saturation shadow tint) | 13.8 | 55.7 | 44.7 | 14 | -0.7 | 65 | 0.1 | 97.3 | 32 | 17 | 5.5 | 1.9 (2.8) | 89.5 (93.1) |
| neutral grade (also no LUT or vignette or grain) | 13.8 | 54.8 | 36.8 | 8.4 | 0.7 | 30.8 | 0.7 | 100 | 31 | 18.2 | 5.5 | 3.5 (2.8) | 88.3 (93.1) |
| no smooth edges | 16.9 | 55.2 | 52.7 | 22.8 | -7.6 | 69.5 | 0.2 | 96.3 | 30.3 | 18.2 | 6.5 | 2.3 (2.8) | 87.5 (93.1) |
| no fog | 16.9 | 55.2 | 52.7 | 22.8 | -7.6 | 69.5 | 0.2 | 96.3 | 30.3 | 17.4 | 5.7 | 2.3 (2.8) | 87.5 (93.1) |
| no depth of field | 16.9 | 55.2 | 52.7 | 22.9 | -7.6 | 69.4 | 0.3 | 96.3 | 30.3 | 17.3 | 5.9 | 2.3 (2.8) | 87.5 (93.1) |
| (painting) | 0 | 65.7 | 27.9 | 0 | 0 | 25.6 | 0.1 | 99.4 | 30 | 0 | - | | |

**ffx2-leblanc / paine**

| variant | dE00 | mean L* | C* | da* | db* | clip % | p2 | p98 | std | halo | ring | shadow bin L* (src) | white bin L* (src) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| r39-int today | 13 | 29.1 | 28.5 | 13.3 | -11.1 | 22.5 | 0.1 | 95.7 | 34.1 | 24.6 | 3.8 | 1.9 (1.2) | 90.3 (92.9) |
| no rim | 11.4 | 25.5 | 24.7 | 10.2 | -6.9 | 19.4 | 0 | 93.9 | 33.3 | -2.5 | 0 | 0.3 (1.2) | 89.3 (92.9) |
| no bloom | 13.3 | 27.8 | 27.3 | 12.4 | -10 | 21.4 | 0 | 95.1 | 33.7 | 23.9 | 0.9 | 1.4 (1.2) | 89.1 (92.9) |
| no look LUT | 13 | 29.7 | 21.9 | 9.1 | -7.2 | 18.4 | 1 | 95.6 | 32 | 23.8 | 3.5 | 3.5 (1.2) | 87 (92.9) |
| no palette grade (lift gain saturation shadow tint) | 7.8 | 28.4 | 19.7 | 6 | -5.5 | 18.6 | 0 | 96.7 | 34.9 | 25.2 | 3.6 | 1.5 (1.2) | 92.5 (92.9) |
| neutral grade (also no LUT or vignette or grain) | 7.8 | 29.3 | 14.2 | 2.1 | -1.9 | 14.6 | 0.4 | 99.2 | 33 | 24.3 | 3.5 | 2.9 (1.2) | 89.6 (92.9) |
| no smooth edges | 13 | 29.1 | 28.5 | 13.3 | -11.1 | 22.5 | 0.1 | 95.6 | 34.1 | 25.3 | 4.2 | 1.9 (1.2) | 90.3 (92.9) |
| no fog | 12.9 | 29.3 | 28.6 | 13.4 | -11.3 | 22.6 | 0.1 | 95.8 | 34.2 | 24.5 | 3.7 | 1.9 (1.2) | 90.6 (92.9) |
| no depth of field | 13 | 29.1 | 28.5 | 13.3 | -11.1 | 22.5 | 0.1 | 95.7 | 34.1 | 24.6 | 3.8 | 1.9 (1.2) | 90.3 (92.9) |
| (painting) | 0 | 35.1 | 12.3 | 0 | 0 | 9.2 | 0 | 94.3 | 34.7 | 0 | - | | |

(The all-neutral rows are left out of the live 38 table: on that build a look switched off in mid-session leaves its glow pass running, so they are not clean. The fresh-session rows above are.)

**Which way the outline faces** (r39-int, Chapter VI, Yuna; 8 sectors, 0 = an edge facing right, 2 = up, 4 = left, 6 = down; mean L* added in the 3 px band inside the silhouette / the 3 px ring outside):

| | inside the silhouette | just outside |
|---|---|---|
| today | 51, 24, -1, -7, -6, -7, 29, 45 | 9.1, 5.1, 3.7, 3.1, 2.0, 1.9, 10.2, 10.5 |
| no rim | -2, -6, -6, -8, -6, -9, -2, -4 | 0.2, 0.2, -0.1, 0.5, 0.2, -0.1, 2.4, 0.5 |
| no bloom | 51, 25, -1, -7, -6, -8, 30, 46 | 3.8, 1.9, 1.3, 1.2, 0.6, 0.9, 5.8, 4.4 |

So the lavender outline is the rim light (one side, +45 to +59 L*) and its spill; the bloom adds a smaller ring all round (+1 to +6) that is strongest on the same side because the rim pixels are what blooms.

## Classification

| cause | class | what to do |
|---|---|---|
| No sRGB encode at the end of the chain (every painting's gamma applied twice) | (a) technical defect, but every look was tuned against it | Fixed for the figures behind a switch (off). A whole-frame fix needs the retuning below: it is Bailey's decision. |
| Scene grade (lift, gain, saturation, shadow tint): the cast, the lavender whites, the clipping | (b) deliberate look | Not changed. Figures true exempts the figures from it. |
| A look LUT (`lookAmount` 1) | (b) deliberate (Bailey 2026-09-29, "maximum eye candy") | Not changed. |
| A bloom (threshold 0.45, strength 1.5 x 0.6) | (b) deliberate; the ring and the veil are side effects | Not changed. Figures true takes no bloom on a figure and the figure mask in full. |
| A key rim (1.35, lavender, one side) | (b) deliberate (A7) | Not changed. Figures true cuts it to 0.45. |
| Trapped white under alpha 0; F plus; CAS; smooth edges; fog; depth of field; B and C looks | not causes | nothing |

## Whole frame true: what would need retuning, one line per look

Measured: with the encode added at the end and every look as it is, the backdrops go milky (table above) and the figures are still tinted (dE00 8 to 14). One line per look:

- **Scene grade** (`ScenePalettes.ts`): the linear lift (Chapter VI 0.02/0.006/0.018) becomes a visible grey-violet black point (L* 11 on a figure, 22 on Chapter I's floor); lifts go to about 0, the gains (1.08/0.94/1.05) that tint whites need to come back toward 1, and saturation 1.1 to about 1.0. Zanarkand (gamma 2.3) and Sector 1 (gamma 2.0) already carry their own encode and go back to 1.
- **A look LUT** (`LookLut.ts`, amount 1): it runs before the encode, so its tint stays and every mid is lighter; darken its mids by about a stop or lower the amount.
- **A bloom** (threshold 0.45, strength 1.5 x 0.6): its soft tails become a visible veil on the floor and on figures (shadow bin 2.9 to 26.6 in the add-one table); raise the threshold and cut the strength to about a half.
- **A shafts, haze and streaks**: the faint tails become fog; cut the haze and shaft gain to about 0.4.
- **A key rim** (1.35): brighter and wider after the encode; cut to 0.45 as the switch does, or limit it to the headroom the painting leaves.
- **A depth of field / tilt-shift**: blur only, no retune.
- **B lamps, haze plane, plates, floor reflection**: additive and alpha layers brighten at the low end; halve the lamp and haze strengths and check the floor reflection.
- **C spectacle** (in-scene bursts, shake, splash): the bursts brighten at the low end; the spell overlay is drawn after the chain and needs the same encode or it will look darker than its surroundings.
- **MAX mix fog bands** (0.14 and 0.3 sky-coloured planes): they become visible veils over bosses (see below); about a third of the strength.
- **Vignette and grain**: the vignette darkens in linear light and is much weaker after the encode (raise it by about a third); grain amplitude is applied before the encode and becomes stronger in the darks (lower it).

## The veil on a boss (figures true, Chapter IV), and what else was seen

In the stills' session Bahamut's darkest 15 percent (painting L* 2) read L* 5 today and L* 16 with figures true, and Bahamut's and Paine's mean lightness is 6 to 7 L* above their paintings (dE00 4.8 and 4.9, where Chapters I and VI reach 1.3 to 4.1).
A faint additive light, about 0.03 linear, is already on the figures today (+8 L* in the darks); today's raw display hides it and the encode lifts it. With the switch on (measured on 4436541a, before the follow-up), in one session on one frozen frame (Bahamut's darkest 15 percent, L*): figures true 26;
shafts, streaks and haze off 20; look A off 21; the MAX mix fog off, depth of field off, the A halo off, the lamps dial 0, F plus off, the tilt-shift blur off: no change; bloom: the switch already gives it back at figure pixels, so the bloom toggle only moves the backdrop's glow.
B's layers (plates, sway) cannot be switched off without moving the figure a few pixels, so their share is not isolated.
Where it matters the follow-up is to scale `uFigureKeep` (the share of shaft and haze light a figure takes, 0.25 in `GlowPass.ts`) by `1 - amount` and to let the remaining additive layers take the frame alpha the way the bloom now does. It is in neither commit.

Also seen, not chased:

- The Chapter IV scene changes in the first seconds of a battle (a blue cast comes in): today's Bahamut is dE00 13.6 to 15.4 from early sessions and 23.5 to 23.8 from sessions captured about three minutes after the first menu (the machine was saturated by other lanes). The stills come from one early session (all three states on one frame), so they are consistent; sessions are not comparable.
- In those late Chapter IV sessions, switching BATTLE SPECTACLE (look C) off at run time darkened the figures a great deal (Yuna's white robe L* 97 to about 22), with or without the switch; the same toggle in Chapter VI is harmless. If a player can reach that through the OPTIONS row it is worth a look; the harness toggles the state at run time, so it may not be reachable.
- On live 38 a look switched off in mid-session leaves its glow pass running, so the all-neutral rows of the live 38 toggle table are unclean and left out.


## What changed in the repo

Two code commits on `r39-color` (both games, shared rendering, default off) and this note with its stills and harness:

- `4436541a` (cleared into release 39 by the driver): the switch. `src/engine/shaders/GradeShader.ts`: uniform `figureTrue` (0), and where it is above 0 the pixels whose frame alpha is 0 (the bloom mask: every painted figure writes it, `BloomMask.ts`)
  skip the grade, shadow tint, saturation and look and go through the sRGB encode. `src/engine/figureTrue.ts` (new): the default (0), `?figtrue=` parsing, the sRGB maths, `applyFigureTrue`, `rimQuiet`.
  `Renderer.ts` (2 lines), `fx/a/GoldenHour.ts` (the rim strength times `rimQuiet`), `debug/fxApi.ts` (`__pyrefly.fx.figureTrue(v)`), `tests/unit/engine/figure-true.test.ts`.
- `ef0868b5` (follow-up, **take this one with it**): 4436541a took the bloom off a figure by blending the bloom into the frame scaled by the frame alpha (`src * dstAlpha + dst`). Additive effects raise that alpha above 1, and there the blend
  MULTIPLIES the bloom: with the switch on, Chapter IV's backdrop changed by up to 57 levels (70,458 pixels by more than 4) and Chapter I's by up to 21. The follow-up removes that blend (`maskBloomReceiver` is gone) and has the grade
  subtract the bloom pass's own last target (`tBloom`, `bloomRemove`) at figure pixels only. With the switch off, 4436541a and the follow-up draw the same frame as r39-int.
  Nothing outside a figure changes any more except the glow a figure casts (the figure bloom mask, which is the point); see the numbers below.

Gates: `npx tsc --noEmit` clean; the figure-true (8 tests: defaults, parsing, the sRGB maths and its round trip over all 256 values, the measured error in numbers, where the shader reads the mask and the bloom, and what the switch moves),
bloom-mask, bloom-mask-subjects, phase-lighting and crisp-rig test files pass; `node tools/orphans.mjs` 24 orphaned, none of them mine (`figureTrue.ts` is reachable from `Renderer.ts`).
The full `npm test` was not run (the machine was saturated by other lanes); it is the driver's gate before `main`.
Proof that off is off: `harness/identity.mjs` draws the same frozen frame with the shader from `origin/r39-int` and with the patched one: 0 of 3,686,400 pixels differ (two grabs of the same shader also differ in 0). With `figureTrue` 1 on the same frame, 444,084 pixels change inside the figure boxes and 476,319 outside them, by 1.1 levels on average and 18 at most: the glow the figures no longer cast.
The switch ON through the real code (`?figtrue=1`, and `__pyrefly.fx.figureTrue(1)` for the stills) gives the numbers of the prototype to within a few tenths of dE00.

**What the switch changes outside the figures** (with the follow-up; switch on against switch off, the same frozen frame of one session, outside the figure boxes plus 4 px; the backdrop lightness percentiles above are identical):

| scene | pixels that differ | by more than 4 levels | mean | max |
|---|---|---|---|---|
| FFX-2 Ch VI | 491,938 of 3,175,516 (15.5 %) | 898 | 1.06 | 11 |
| FFX Ch I | 445,730 of 2,592,674 (17.2 %) | 8 | 1.01 | 7 |
| FFX-2 Ch IV | 1,014,728 of 2,368,199 (42.9 %) | 31,876 | 1.36 | 19 |

What differs there is the glow a figure no longer casts onto the floor and walls round it (it is no bloom source with the switch on): a soft change of a level or two over a wide area, and up to 19 levels beside a large boss. With 4436541a alone (the bloom's receiving blend) the same measure was 70,458 pixels by more than 4 and a maximum of 57 in Chapter IV, 4,427 and 21 in Chapter I, 542 and 11 in Chapter VI: that is what the follow-up removes.
Spell effects are drawn after the chain (`Renderer.addOverlay`) and cannot change; no spell frame was captured.

## Limits, and what is not decided

- **It is a look change, so it is Bailey's pick** (AGENTS.md rules 9 and 10): nothing wires the switch to a setting; the default is `FIGURE_TRUE_DEFAULT` in `figureTrue.ts`.
- **Mask limits.** The exemption follows the frame alpha. A figure that is dissolving (a KO) is drawn with normal blending and no mask, so it would go back to today's colour at the start of the dissolve; additive spell light over a figure raises the alpha and is graded as today (that is the intent); PhaseLighting's grade tints no longer reach an exempt figure (its rim and bounce tints still do), so the arena "turns" less on the figures.
- **Spell effects** are drawn after the chain (`Renderer.addOverlay`), so the switch cannot touch them; not captured.
- **Which figures write the mask.** With the default looks every whole figure does (CINEMA LIGHT turns on `maskEveryFigure`); with CINEMA LIGHT off a scene still masks every figure except Macalania (Chapter VII), which names only the Guado Guardian (`figureBloomMaskArt`), so there the switch would exempt only the Guardian. From the code, not run.
- **The veil on a boss.** Figures true leaves a grey lift on a boss in front of a bright light (Bahamut's darkest 15 percent: painting L* 2, today 5, figures true 16): a faint additive light that today's raw display hides and the encode lifts. A's shafts and haze are part of it; the rest is not isolated (below). Neither commit touches it.
- Not measured: phone and low tiers, a real-input pass, the pause and results screens, FF7, the unlisted chapters, Chapter III's boss (the Braska aeon panels).
- The run-to-run noise is about 1.5 dE00 and 2 to 5 L* on the edge metrics when breathing is on; every number above is from still figures.

## How to run it again

The harness is a snapshot in `docs/handoff/r39-color-harness/` (scratch originals in `D:/Tools/pyrefly-scratch/2026-10-05/r39-color/harness/`; paths inside point at `D:/pyrefly-r39-color` and that scratch folder, edit `ROOT` and the two import lines for another worktree).
Headless GPU Chromium from node, never the in-app browser; at most two sessions.

```
cd D:\pyrefly-r39-color
node node_modules/vite/bin/vite.js --config .r39color-vite-tmp.config.mjs --port 6931        (dev; stop it by its PID after)
node harness/ab3.mjs --url "http://127.0.0.1:6931/?coach=off" --chapter ffx2-leblanc --seed 1 --tag ab3 --disk D:/pyrefly-r39-color/public     today / figures true / whole frame true, one frozen frame
node harness/abtog.mjs --url <url> --chapter ffx2-leblanc --seed 1 --tag abtog39 --disk <public>          each suspect toggled on one frozen frame (live 38: https://echoesofspira.com/?coach=off, no --disk)
node harness/identity.mjs ffx2-leblanc 1                                                                 off is byte-identical; what on changes
node harness/mkstills3.mjs <outDir> <chapter> <lead,figs> <fig,fig,...>                                    the stills (three states, the sheet, the strips)
```

Chapters: `seymour-flux` (I, seed 4), `braskas-final-aeon` (III, 4), `ffx2-bahamut` (IV, 4), `ffx2-leblanc` (VI, 1).
