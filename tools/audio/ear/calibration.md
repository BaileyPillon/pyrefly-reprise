# Automated ear: calibration, 2026-09-30

**A screen, not a verdict.** Agents cannot hear (AGENTS.md rule 13). Nothing below says how
anything sounds; it says what three instruments measured and whether their rankings line up
with what Bailey has said by ear. Game: both (shared tooling; no FFX or FFX-2 sound changed).

## What was run

- `tools/audio/ear/ear.py` (branch `audio-ear`), venv `D:/Tools/venvs/audio-ear` (Python 3.11,
  torch 2.14.1 CPU, transformers 4.49), models under `D:/Tools/audio-libs`:
  - Meta **audiobox-aesthetics** (CC-BY-4.0): PQ production quality, PC production
    complexity, CE content enjoyment, CU content usefulness (1-10), averaged over 10 s windows.
  - LAION **CLAP clap-htsat-unfused** (Apache-2.0): cosine similarity to 4 "professional"
    and 5 "cheap / tinny / hissy / 16-bit / AI artefact" prompts; `clap` = mean(pos) - mean(neg).
    `laion/larger_clap_music` was downloaded first and rejected: in this stack every clip and
    every prompt embed to one point (audio-audio cosine 0.95-0.995, white noise included).
  - DSP: loudness, loudness range, stereo correlation, mono-sum loss, band shares, 99 % roll-off,
    hiss in the quietest frames.
- Every file: the loudest 60 s window (whole file if shorter; the 26 Sep pack clips are 12 s),
  loudness-matched to -16 LUFS before the models; repeat runs give identical numbers.
- 80 files: 26 shipped cues (`public/audio/music` on main 9299b319), the 26 Sep direction pack
  (today x4, control, A, B, C, Macalania B-sketches x3), fb-0929 control/O1/O2/O3, N1 (ACE-Step
  1.5), remaster R1/R2/R3 (x5 each), **9 reference recordings** (5 orchestral/band: Musopen
  Egmont, Tchaikovsky 6 III, Mountain King; USAF bands Holst First Suite March, Spirits of Fire;
  4 game-style: Kevin MacLeod Five Armies, Volatile Reaction, Crossing the Chasm, Big Rock; PD or
  CC-BY, calibration only, never shipped) and **9 deliberately damaged copies** of three
  references (tinny = 300 Hz-3 kHz band-pass, hiss = 4-10 kHz noise, lofi = 11 kHz 8-bit).
- Raw scores: `calibration-2026-09-30.json`; list: `calib-list.tsv`; tables: `report.py`.

## Answers

1. **Does the ear rank the references above our shipped cues? No, not on the model scores.**
   audiobox PQ: shipped mean 7.43, orchestral references 7.14, game references 7.40 (AUC
   reference > shipped 0.34). CE 6.59 vs 6.85-7.00 (AUC 0.64), CLAP contrast 0.206 vs 0.216
   (AUC 0.56): no separation. PQ is not an absolute quality gate across different pieces.
2. **What does separate them** (AUC over 9 references vs 26 shipped cues):
   6-12 kHz energy share **0.99** (references 0.0010-0.0123, 24 of 26 cues below 0.001);
   above 12 kHz 0.88; predicted Production Complexity **0.86** (references 5.93-6.61, 19 of 26
   cues below 5.9); stereo: shipped cues are more correlated (L/R 0.77 vs 0.46, AUC 0.15) and
   carry more energy at 250 Hz-2.5 kHz (0.53 vs 0.42). The CLAP prompt "tinny, thin and hollow"
   also scores the shipped cues higher (AUC 0.09), **but** the same prompt scores LOWER on the
   deliberately band-passed copies than on their sources, so it is not measuring tinniness;
   read it as a style association only.
3. **Does it catch damage within one piece? Yes, PQ does.** Tinny copies: PQ -0.84, -1.74,
   -2.11; lofi -0.18, -0.86, -0.91; hiss -0.19, -0.13, -0.29 (Egmont, Five Armies, Big Rock).
   So PQ is usable as a **paired** A/B screen (same composition, two renders), not across pieces.
4. **Agreement with Bailey's verdicts:**
   - 27 Sep pack, "7 is the only one that sounds good": PQ B 7.81, control 7.79, A 7.52,
     C 7.51; CLAP contrast B 0.184, control 0.114, C 0.114, A 0.091. **Partial agreement**
     (B top on both; PQ does not separate B from control).
   - Direction A "arcade-y": A has the lowest CLAP contrast of the four and PQ 0.29 under B;
     its 99 % roll-off is 1.45 kHz, second lowest of all 80 files (boss-vegnagun 1.40 kHz). Consistent, weakly.
   - 29 Sep "tinny and hollow" (the B sketches): **agreement on DSP only.** The three
     Macalania B-sketches have L/R correlation 0.06-0.13 and lose 2.5-2.8 dB in a mono sum
     (shipped cues 0.4-0.9 dB), 250 Hz-2.5 kHz share 0.82 and 6-12 kHz share 0.0005-0.0008;
     all three get all three screen flags. The models do not: macalania-a has PQ 7.89, one of
     the highest scores measured.
   - Remaster R1/R2/R3: corrected the stereo (correlation 0.74-0.80) but PQ moved -0.6 to
     +0.1 against the source sketch; R3 alone lifts the 6-12 kHz share (0.003) and clears
     the top-end flag on 2 of 5.
   - fb-0929 O1 (the V0 encode) vs the q5 control: identical on every model score (PQ 7.37 vs
     7.37); the encode change is invisible to the ear, consistent with Bailey still hearing
     the problem after it shipped.
   - "AWFUL" today: **the model scores disagree** (shipped PQ above the references). The DSP
     screen agrees there is a measurable gap: 25 of 26 shipped cues carry at least one flag
     (dark top end below every reference, thinner predicted arrangement), against 3 of 9
     references with any flag (stereo width only).
5. The lowest-scoring shipped cues (PQ, loudest 60 s): boss-shuyin 6.47, scene-gagazet 6.76,
   scene-farplane 6.91, boss-jecht 6.93, boss-vegnagun 6.96, boss-yu-yevon 6.99. Highest:
   victory-ffx 8.06, battle-ffx 7.95, victory-ffx2 7.94.

## How to use it (recommendation)

- Screen, in order: (1) the three **screen flags** (top end, arrangement complexity, mono-sum
  loss); (2) **paired PQ delta** against the render it replaces (same cue, same window): a drop
  of 0.3 or more is the size the damage tests produced; (3) CLAP only as a style probe. Never
  use absolute PQ to rank different pieces, and never report any of it as how a cue sounds.
- Reference ranges should grow: 9 references is small; FFX-2 pop/rock has only one reference
  (Big Rock). Adding more CC0/CC-BY band and electronic recordings would tighten the thresholds.

## Group means

| group | n | PQ | CE | PC | CU | clap | lr_corr | mono_sum_loss_db | mid | air | rolloff99_hz | quiet_hiss_4k_10k_db | lra_lu | flags |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| N1 | 2 | 8.049 | 7.508 | 5.620 | 7.835 | 0.025 | 0.702 | 0.835 | 0.403 | 0.001 | 3434 | -20 | 2.690 | 1.000 |
| pack-B | 1 | 7.810 | 7.142 | 6.478 | 8.149 | 0.184 | 0.063 | 2.750 | 0.525 | 0.001 | 2625 | -23 | 0.670 | 2.000 |
| pack-control | 1 | 7.786 | 7.273 | 5.596 | 7.972 | 0.114 | 0.616 | 0.960 | 0.345 | 0.000 | 1869 | -24 | 0.280 | 2.000 |
| pack-macalania | 3 | 7.721 | 6.558 | 5.096 | 7.659 | 0.076 | 0.092 | 2.637 | 0.817 | 0.001 | 3478 | -23 | 3.990 | 3.000 |
| pack0926-today | 4 | 7.686 | 7.045 | 4.847 | 7.665 | 0.099 | 0.192 | 2.353 | 0.639 | 0.001 | 2884 | -29 | 5.502 | 2.500 |
| fb0929-O3 | 2 | 7.544 | 7.232 | 5.816 | 7.681 | 0.175 | 0.579 | 1.035 | 0.371 | 0.000 | 2564 | -25 | 2.950 | 1.500 |
| pack-A | 1 | 7.523 | 7.165 | 5.700 | 7.859 | 0.091 | 0.689 | 0.740 | 0.329 | 0.000 | 1447 | -29 | 0.460 | 2.000 |
| pack-C | 1 | 7.515 | 7.287 | 5.769 | 7.904 | 0.114 | 0.622 | 0.910 | 0.369 | 0.000 | 1471 | -30 | 0.540 | 2.000 |
| remaster-R3 | 5 | 7.466 | 6.505 | 5.633 | 7.618 | 0.185 | 0.764 | 0.610 | 0.577 | 0.003 | 3490 | -23 | 6.318 | 0.800 |
| shipped | 26 | 7.428 | 6.586 | 5.589 | 7.628 | 0.206 | 0.774 | 0.604 | 0.532 | 0.000 | 2936 | -27 | 6.025 | 1.654 |
| remaster-R2 | 5 | 7.401 | 6.463 | 5.578 | 7.621 | 0.214 | 0.765 | 0.610 | 0.579 | 0.000 | 3186 | -25 | 6.294 | 1.600 |
| ref-game | 4 | 7.397 | 6.999 | 6.159 | 7.835 | 0.206 | 0.562 | 1.123 | 0.322 | 0.003 | 3256 | -24 | 3.683 | 0.250 |
| fb0929-0-control | 2 | 7.372 | 6.896 | 6.115 | 7.891 | 0.175 | 0.744 | 0.710 | 0.444 | 0.001 | 2766 | -25 | 2.220 | 1.500 |
| fb0929-O1 | 2 | 7.372 | 6.893 | 6.114 | 7.902 | 0.234 | 0.745 | 0.710 | 0.443 | 0.000 | 2760 | -25 | 2.220 | 1.500 |
| remaster-R1 | 5 | 7.364 | 6.433 | 5.579 | 7.566 | 0.208 | 0.763 | 0.614 | 0.574 | 0.000 | 3189 | -25 | 6.352 | 1.600 |
| fb0929-O2 | 2 | 7.341 | 6.794 | 6.133 | 7.604 | 0.202 | 0.668 | 0.790 | 0.449 | 0.000 | 2678 | -25 | 2.120 | 1.000 |
| ref-orch | 5 | 7.137 | 6.845 | 6.259 | 7.483 | 0.225 | 0.370 | 1.764 | 0.500 | 0.004 | 4760 | -23 | 7.142 | 0.400 |
| deg-hiss | 3 | 7.107 | 7.023 | 6.083 | 7.671 | 0.196 | 0.617 | 0.993 | 0.429 | 0.005 | 4553 | -18 | 8.660 | 0.667 |
| deg-lofi | 3 | 6.659 | 6.711 | 5.852 | 7.515 | 0.174 | 0.619 | 0.987 | 0.431 | 0.000 | 3197 | -25 | 8.723 | 1.667 |
| deg-tinny | 3 | 5.749 | 5.885 | 5.179 | 6.541 | 0.178 | 0.538 | 1.270 | 0.959 | 0.000 | 2672 | -34 | 9.210 | 2.333 |

## Which measures separate references from shipped cues

| measure | AUC (reference > shipped) | reference mean | shipped mean |
|---|---|---|---|
| band.air_6k_12k | 0.99 | 0.0035 | 0.0004 |
| clap: tinny, thin and hollow sounding audio | 0.09 | 0.1916 | 0.2603 |
| band.top_gt12k | 0.88 | 0.0013 | 0.0000 |
| PC | 0.86 | 6.2148 | 5.5888 |
| clap: retro 16-bit video game music | 0.86 | 0.2527 | 0.1340 |
| lr_corr | 0.15 | 0.4553 | 0.7745 |
| quiet_hf_flatness | 0.81 | 0.4641 | 0.2836 |
| mono_sum_loss_db | 0.81 | 1.4789 | 0.6038 |
| side_vs_mid_db | 0.81 | -4.9578 | -8.3469 |
| quiet_hiss_4k_10k_db | 0.76 | -23.2144 | -27.2654 |
| clap: hissy, noisy, low quality recording | 0.25 | -0.0023 | 0.0748 |
| band.mid_250_2k5 | 0.29 | 0.4208 | 0.5319 |
| band.sub_lt120 | 0.69 | 0.3624 | 0.2658 |
| PQ | 0.34 | 7.2523 | 7.4280 |
| lufs | 0.65 | -13.0244 | -15.2246 |
| rolloff99_hz | 0.65 | 4091.7778 | 2935.7692 |
| CE | 0.64 | 6.9132 | 6.5858 |
| CU | 0.60 | 7.6394 | 7.6282 |
| clap: cheap MIDI music with general MIDI instruments | 0.41 | 0.2680 | 0.2780 |
| clap: a live symphony orchestra recorded in a concert hall | 0.43 | 0.4017 | 0.4314 |

## Every file (sorted by PQ)

| file | group | PQ | CE | PC | CU | clap | lr_corr | air | screen flags |
|---|---|---|---|---|---|---|---|---|---|
| boss-ffx2-aeon-N1-newer-model-v0.mp3 | N1 | 8.13 | 7.51 | 5.55 | 7.81 | 0.028 | 0.68 | 0.0014 | 1 |
| 01-title-today.mp3 | pack0926-today | 8.10 | 7.54 | 3.19 | 7.99 | 0.005 | 0.03 | 0.0043 | 2 |
| victory-ffx.mp3 | shipped | 8.06 | 7.43 | 5.67 | 8.12 | 0.184 | 0.82 | 0.0005 | 2 |
| boss-seymour-N1-newer-model-v0.mp3 | N1 | 7.97 | 7.51 | 5.68 | 7.86 | 0.022 | 0.73 | 0.0010 | 1 |
| battle-ffx.mp3 | shipped | 7.95 | 7.60 | 6.34 | 8.17 | 0.173 | 0.74 | 0.0008 | 1 |
| victory-ffx2.mp3 | shipped | 7.94 | 7.80 | 6.09 | 8.20 | 0.168 | 0.66 | 0.0010 | 0 |
| 09-macalania-a-frozen-temple.mp3 | pack-macalania | 7.89 | 6.91 | 5.07 | 7.83 | 0.000 | 0.06 | 0.0008 | 3 |
| boss-ffx2-aeon-O3-sampled-v0.mp3 | fb0929-O3 | 7.84 | 7.38 | 5.51 | 7.88 | 0.162 | 0.63 | 0.0004 | 2 |
| 03-boss-shuyin-today.mp3 | pack0926-today | 7.82 | 7.36 | 5.14 | 7.89 | 0.097 | 0.06 | 0.0001 | 3 |
| 07-direction-b-acestep.mp3 | pack-B | 7.81 | 7.14 | 6.48 | 8.15 | 0.184 | 0.06 | 0.0007 | 2 |
| chapter-select.mp3 | shipped | 7.80 | 7.30 | 4.89 | 7.87 | 0.206 | 0.76 | 0.0002 | 2 |
| scene-fahrenheit.mp3 | shipped | 7.79 | 7.12 | 5.20 | 7.88 | 0.218 | 0.79 | 0.0006 | 2 |
| 05-direction-control-battle-ffx.mp3 | pack-control | 7.79 | 7.27 | 5.60 | 7.97 | 0.114 | 0.62 | 0.0002 | 2 |
| pause.mp3 | shipped | 7.77 | 6.34 | 4.39 | 7.57 | 0.204 | 0.76 | 0.0007 | 2 |
| title.mp3 | shipped | 7.76 | 7.17 | 5.19 | 7.82 | 0.204 | 0.80 | 0.0002 | 2 |
| 04-boss-yojimbo-today.mp3 | pack0926-today | 7.76 | 7.17 | 5.68 | 7.83 | 0.167 | 0.05 | 0.0001 | 3 |
| macalania-b-R3-air.mp3 | remaster-R3 | 7.76 | 7.43 | 6.05 | 7.91 | 0.183 | 0.79 | 0.0026 | 0 |
| macleod-crossing-the-chasm.mp3 | ref-game | 7.76 | 7.38 | 6.26 | 8.21 | 0.256 | 0.53 | 0.0020 | 0 |
| macalania-b-R2-hall.mp3 | remaster-R2 | 7.73 | 7.44 | 5.99 | 7.94 | 0.195 | 0.79 | 0.0003 | 1 |
| macalania-b-R1-focus.mp3 | remaster-R1 | 7.72 | 7.45 | 5.97 | 7.94 | 0.189 | 0.79 | 0.0003 | 1 |
| 11-macalania-c-crystal-pyreflies.mp3 | pack-macalania | 7.64 | 6.44 | 5.33 | 7.64 | 0.087 | 0.13 | 0.0005 | 3 |
| scene-bevelle-underground.mp3 | shipped | 7.63 | 6.57 | 4.75 | 7.55 | 0.031 | 0.82 | 0.0000 | 2 |
| macalania-c-R3-air.mp3 | remaster-R3 | 7.63 | 6.88 | 5.61 | 7.67 | 0.149 | 0.75 | 0.0040 | 1 |
| 10-macalania-b-wedding-proposal.mp3 | pack-macalania | 7.63 | 6.32 | 4.89 | 7.51 | 0.142 | 0.08 | 0.0002 | 3 |
| ending-ffx2.mp3 | shipped | 7.59 | 6.66 | 5.35 | 7.66 | 0.233 | 0.76 | 0.0005 | 2 |
| boss-evrae.mp3 | shipped | 7.59 | 7.03 | 5.82 | 7.88 | 0.239 | 0.73 | 0.0007 | 2 |
| boss-seymour-macalania-R3-air.mp3 | remaster-R3 | 7.59 | 6.54 | 5.91 | 7.86 | 0.219 | 0.80 | 0.0045 | 0 |
| boss-seymour-macalania-R2-hall.mp3 | remaster-R2 | 7.58 | 6.54 | 5.84 | 7.86 | 0.249 | 0.80 | 0.0011 | 1 |
| boss-seymour-macalania-R1-focus.mp3 | remaster-R1 | 7.57 | 6.52 | 5.77 | 7.84 | 0.240 | 0.79 | 0.0011 | 1 |
| ending-ffx.mp3 | shipped | 7.56 | 6.82 | 5.60 | 7.58 | 0.184 | 0.78 | 0.0004 | 2 |
| boss-seymour-macalania.mp3 | shipped | 7.55 | 6.52 | 5.77 | 7.83 | 0.237 | 0.79 | 0.0011 | 1 |
| boss-dread.mp3 | shipped | 7.54 | 7.16 | 6.47 | 7.98 | 0.241 | 0.79 | 0.0002 | 1 |
| boss-seymour.mp3 | shipped | 7.53 | 6.69 | 5.93 | 7.76 | 0.238 | 0.78 | 0.0003 | 1 |
| 06-direction-a-renderer.mp3 | pack-A | 7.52 | 7.17 | 5.70 | 7.86 | 0.091 | 0.69 | 0.0002 | 2 |
| 08-direction-c-layers.mp3 | pack-C | 7.51 | 7.29 | 5.77 | 7.90 | 0.114 | 0.62 | 0.0001 | 2 |
| macalania-c-R2-hall.mp3 | remaster-R2 | 7.50 | 6.74 | 5.50 | 7.65 | 0.205 | 0.75 | 0.0002 | 2 |
| boss-yunalesca.mp3 | shipped | 7.50 | 7.06 | 6.36 | 7.95 | 0.238 | 0.77 | 0.0002 | 1 |
| boss-ffx2-aeon.mp3 | shipped | 7.49 | 7.32 | 6.04 | 7.95 | 0.252 | 0.67 | 0.0006 | 1 |
| macalania-c-R1-focus.mp3 | remaster-R1 | 7.49 | 6.73 | 5.54 | 7.63 | 0.200 | 0.75 | 0.0002 | 2 |
| boss-seymour-O2-rebuild-v0.mp3 | fb0929-O2 | 7.46 | 6.29 | 6.02 | 7.53 | 0.203 | 0.73 | 0.0002 | 1 |
| scene-dreams-end.mp3 | shipped | 7.45 | 6.78 | 5.86 | 7.66 | 0.220 | 0.80 | 0.0003 | 2 |
| macleod-five-armies.mp3 | ref-game | 7.43 | 7.02 | 6.43 | 7.81 | 0.220 | 0.23 | 0.0018 | 1 |
| spirits-of-fire-usafa.mp3 | ref-orch | 7.42 | 7.24 | 5.93 | 7.75 | 0.177 | 0.04 | 0.0010 | 1 |
| holst-suite1-march-usaf.mp3 | ref-orch | 7.40 | 7.27 | 6.59 | 8.03 | 0.184 | 0.02 | 0.0023 | 1 |
| boss-ffx2-aeon-O1-encode-v0.mp3 | fb0929-O1 | 7.39 | 7.41 | 6.34 | 8.03 | 0.237 | 0.73 | 0.0006 | 1 |
| boss-ffx2-aeon-0-control-shipped-q5.mp3 | fb0929-0-control | 7.39 | 7.41 | 6.33 | 8.01 | 0.180 | 0.73 | 0.0007 | 1 |
| boss-seymour-0-control-shipped-q5.mp3 | fb0929-0-control | 7.35 | 6.38 | 5.90 | 7.77 | 0.170 | 0.76 | 0.0003 | 2 |
| boss-seymour-O1-encode-v0.mp3 | fb0929-O1 | 7.35 | 6.37 | 5.89 | 7.78 | 0.232 | 0.76 | 0.0002 | 2 |
| egmont-musopen.flac | ref-orch | 7.34 | 7.27 | 6.12 | 7.88 | 0.226 | 0.75 | 0.0016 | 0 |
| macalania-a-R3-air.mp3 | remaster-R3 | 7.33 | 6.22 | 4.81 | 7.25 | 0.129 | 0.74 | 0.0034 | 1 |
| macleod-five-armies-deg-hiss.wav | deg-hiss | 7.30 | 7.00 | 6.40 | 7.71 | 0.241 | 0.23 | 0.0020 | 1 |
| scene-macalania-temple.mp3 | shipped | 7.30 | 6.33 | 4.91 | 7.28 | 0.207 | 0.74 | 0.0004 | 2 |
| macalania-a-R2-hall.mp3 | remaster-R2 | 7.27 | 6.18 | 4.83 | 7.24 | 0.198 | 0.74 | 0.0004 | 2 |
| macalania-a-R1-focus.mp3 | remaster-R1 | 7.26 | 6.18 | 4.84 | 7.24 | 0.195 | 0.74 | 0.0004 | 2 |
| boss-seymour-O3-sampled-v0.mp3 | fb0929-O3 | 7.24 | 7.08 | 6.12 | 7.48 | 0.188 | 0.53 | 0.0004 | 1 |
| macleod-volatile-reaction.mp3 | ref-game | 7.23 | 6.68 | 5.96 | 7.72 | 0.202 | 0.62 | 0.0012 | 0 |
| tchaik6-iii-musopen.flac | ref-orch | 7.23 | 6.75 | 6.61 | 7.84 | 0.258 | 0.69 | 0.0027 | 0 |
| boss-ffx2-aeon-O2-rebuild-v0.mp3 | fb0929-O2 | 7.22 | 7.30 | 6.24 | 7.68 | 0.201 | 0.60 | 0.0005 | 1 |
| macleod-big-rock.mp3 | ref-game | 7.16 | 6.92 | 5.98 | 7.60 | 0.146 | 0.88 | 0.0068 | 0 |
| egmont-musopen-deg-lofi.wav | deg-lofi | 7.16 | 7.31 | 5.93 | 7.79 | 0.171 | 0.73 | 0.0000 | 1 |
| egmont-musopen-deg-hiss.wav | deg-hiss | 7.15 | 7.45 | 6.05 | 7.85 | 0.200 | 0.73 | 0.0021 | 0 |
| boss-yojimbo.mp3 | shipped | 7.15 | 6.14 | 5.47 | 7.37 | 0.192 | 0.82 | 0.0003 | 2 |
| scene-zanarkand-dome.mp3 | shipped | 7.14 | 5.99 | 5.76 | 7.27 | 0.222 | 0.76 | 0.0002 | 2 |
| 02-boss-seymour-today.mp3 | pack0926-today | 7.06 | 6.11 | 5.38 | 6.95 | 0.126 | 0.63 | 0.0002 | 2 |
| scene-gagazet-R3-air.mp3 | remaster-R3 | 7.01 | 5.46 | 5.79 | 7.41 | 0.243 | 0.75 | 0.0006 | 2 |
| boss-yu-yevon.mp3 | shipped | 6.99 | 5.33 | 4.96 | 6.88 | 0.224 | 0.84 | 0.0002 | 2 |
| boss-vegnagun.mp3 | shipped | 6.96 | 6.51 | 5.14 | 6.92 | 0.170 | 0.83 | 0.0000 | 2 |
| boss-jecht.mp3 | shipped | 6.93 | 5.91 | 6.29 | 7.70 | 0.224 | 0.82 | 0.0009 | 1 |
| scene-gagazet-R2-hall.mp3 | remaster-R2 | 6.92 | 5.42 | 5.73 | 7.42 | 0.224 | 0.75 | 0.0001 | 2 |
| scene-farplane.mp3 | shipped | 6.91 | 5.30 | 5.43 | 7.34 | 0.220 | 0.82 | 0.0001 | 2 |
| macleod-big-rock-deg-hiss.wav | deg-hiss | 6.87 | 6.62 | 5.80 | 7.45 | 0.147 | 0.89 | 0.0108 | 1 |
| scene-gagazet-R1-focus.mp3 | remaster-R1 | 6.78 | 5.29 | 5.77 | 7.17 | 0.216 | 0.74 | 0.0001 | 2 |
| scene-gagazet.mp3 | shipped | 6.76 | 5.22 | 5.75 | 7.21 | 0.200 | 0.74 | 0.0001 | 2 |
| macleod-five-armies-deg-lofi.wav | deg-lofi | 6.57 | 6.38 | 6.11 | 7.41 | 0.206 | 0.23 | 0.0000 | 2 |
| egmont-musopen-deg-tinny.wav | deg-tinny | 6.50 | 6.91 | 5.34 | 7.10 | 0.159 | 0.72 | 0.0000 | 2 |
| boss-shuyin.mp3 | shipped | 6.47 | 5.13 | 5.89 | 6.94 | 0.236 | 0.75 | 0.0001 | 2 |
| mountain-king-musopen.ogg | ref-orch | 6.30 | 5.69 | 6.05 | 5.91 | 0.279 | 0.35 | 0.0123 | 0 |
| macleod-big-rock-deg-lofi.wav | deg-lofi | 6.25 | 6.44 | 5.52 | 7.35 | 0.145 | 0.89 | 0.0000 | 2 |
| macleod-five-armies-deg-tinny.wav | deg-tinny | 5.69 | 5.49 | 5.17 | 6.16 | 0.160 | 0.05 | 0.0000 | 3 |
| macleod-big-rock-deg-tinny.wav | deg-tinny | 5.05 | 5.26 | 5.04 | 6.36 | 0.215 | 0.84 | 0.0000 | 2 |
