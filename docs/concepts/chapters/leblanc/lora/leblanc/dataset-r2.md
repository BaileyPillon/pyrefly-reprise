# Leblanc identity LoRA, round 2 (`leblanc-x2-r2`, trigger `leblancX2`): the training set

FFX-2 only (Chapter 6, the Leblanc Syndicate boss art; AGENTS.md hard rule 14:
a per-subject art tool, no shared tool or game file changes). Nothing here is
approved.

Built 2026-09-23 by `build-dataset-r2.py` in this folder
(`D:/Tools/ComfyUI/python_embeded/python.exe -s build-dataset-r2.py build`).
Output (not committed): `D:/Tools/pyrefly-lora/leblanc/dataset-r2/{idle,portrait,poses}/*.png + .txt`
and `manifest.json` (every row below with its source sha256 and output sha256).
Trainer: `node tools/gen/lora-leblanc.mjs train --round r2`.

## Why a round 2

Round 1 (`dataset.md`) was 10 views of the idle plus one portrait face. The
LoRA fixed the costume in every pose, but it also memorised the idle's props:
the closed fan at the mouth came back in a lunge, and opened, the fan painted
an unsourced lavender leaf. Round 2 adds the round-1 pose outputs that a judge
scored 6 or above, so the trigger has seen her in other poses, with the open
fan in research §10.1's red and silver.

## What was kept (round 1, byte for byte)

All 11 round-1 images, copied from `D:/Tools/pyrefly-lora/leblanc/dataset/`
and checked against round 1's manifest (`dataset.md` lists each source, box
and sha256): the 10 idle views at **repeats 2** (anchor
`public/art/characters/leblanc/idle.png`, sha256 `4fea45f9...9094b`) and
`portrait-face` at repeats 1.

## What was added (repeats 1, captions = view + pose only)

The candidates the brief admits: every round-1 output that the independent
judge (`judge.md`) or the painter (`poses/poses.md`, `poses/redo.md`) scored
6 or above. No per-candidate score exists for the other 48 frames in the pool
(`D:/Tools/pyrefly-lora/leblanc/poses/`), so they are not admitted. Each
admitted one was checked at 1:1 against idle before it went in.

| Candidate | Score | Admitted? | Why |
|---|---|---|---|
| `attack.v3.3` | judge 6, painter 6 | **no** | the judge named wrong costume details: closed-toe boots, the robe flared into wing lobes |
| `cast.v3.6` | judge 6, painter 6 | **no** | the judge named the unsourced lavender fan leaf, the black jaw patch, a notched heart, a studless choker; `cast.r2red` is this frame repaired |
| `hurt.v3.1` | judge 5, painter 6 | **upper body only** | the painter's 6 admits it; its one defect is anatomy below the robe hem (the far leg missing), so only the crop above the hem is used |
| `ko.v3.2` | judge 6, painter 6 | **no** | the judge named closed-toe boots and a tan fan guard; `ko.r2` is this frame repaired |
| `attack.v7.2` (installed, `attack.v7.2.noshadow.png`) | painter 7 | **below the chin only** | the painter named a dark hair patch on the near side of the face, so the face stays out of the crop; the boots, which the painter called a deeper purple, were checked at 1:1 against idle: the same open-toe lace-up heels, a shade deeper in shadow, not a different boot, so the legs and feet stay in |
| `cast.r2red` (installed) | painter 7 | **yes, full + upper** | the open fan in red and silver (research §10.1, the brief's colour), heart, studs and jaw repaired |
| `hurt.v4.5` (installed) | painter 7 | **yes, full + upper, tassel erased** | the painter named a purple tassel on the fan's end (idle's fan has none): it is erased to white in the dataset copy (box 22,283 to 64,382 of the source), never in the source |
| `ko.r2` (installed, `ko.r2.noshadow.png`) | painter 7 | **yes, full + upper** | toes and guard repaired, painted shadow cleared |
| `cast.r2black` | painter 7 (alternative) | **no** | a black leaf; the brief sets red and silver for Leblanc's open fan |

Sources are the files in `D:/Tools/pyrefly-lora/leblanc/poses/` (hash-identical
to the four round-1 files installed in `public/art/characters/leblanc/` before
this round replaced them; also backed up in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/leblanc/`).
Flattened on white; crops under half a megapixel go through RealESRGAN_x4plus
on the CPU and Lanczos to about 1 MP (round 1's method). Captions begin
`leblancX2, 1girl, solo,`; the tail is below.

| id | source | source sha256 | box / canvas | size | resize | erase | caption tail | output sha256 |
|---|---|---|---|---|---|---|---|---|
| pose-attack-body | attack.v7.2.noshadow.png | `193dec9db10812465055093bf72e07e431a4a5b8a15fee499ad056783f220172` | box 0,240,1020,1190 | 1020x950 | native | - | head out of frame, from side, lunging, leaning forward, one leg forward, wide stance, outstretched arm, holding folding fan, closed fan, feet | `0216412a3365b05daca3013823536dbe79cfe5d7275fc95978e987a868e6963b` |
| pose-cast-full | cast.r2red.png | `56b58aa20fe6558af9b191d606add9ba67c73ecc2b64f4b984b1d968a2bfc2a1` | canvas 832x1216, 1.0, at 126,15 | 832x1216 | canvas | - | full body, from side, standing, arm up, raised hand, holding folding fan, open fan, fan above head, looking up, feet | `00e0df6c64b8889451f6d377fed2ca16c2a304d71c4a26b6fae9c328acf4efe4` |
| pose-cast-upper | cast.r2red.png | same | box 0,0,579,640 | 976x1080 | esrgan-x4+lanczos | - | upper body, from side, standing, arm up, raised hand, holding folding fan, open fan, fan above head, looking up | `09da8433b1b4541f887de8873bffc6c7bee056f7f44a57bfd94327aebb55a0b2` |
| pose-hurt-full | hurt.v4.5.png | `c1ce03d52a40ffe32e5412854dc2064c5ae4aea2545d0bf56395ae11973edee9` | canvas 832x1216, 1.0, at 49,200 | 832x1216 | canvas | 22,283,64,382 | full body, from side, leaning back, off balance, head back, wince, one eye closed, clenched teeth, hand on own stomach, holding folding fan, closed fan, feet | `ef039edd4a8e39eaf728b266157e6037a39983343d436690e3eb7188c750f39d` |
| pose-hurt-upper | hurt.v4.5.png | same | box 0,0,734,520 | 1216x864 | esrgan-x4+lanczos | 22,283,64,382 | upper body, (same pose words) | `a5a541dba4fbf5f6c8036cdf3e24c7a89006e1690ebe02bef85f9ffdecc39c66` |
| pose-ko-full | ko.r2.noshadow.png | `63ab4023d67eca6fad6df3346e291e5a00d0f392f52f04f1eaf2721aafdf8304` | canvas 1216x832, 1.0, at 0,200 | 1216x832 | canvas | - | full body, lying, on side, on ground, closed eyes, holding folding fan, closed fan, feet | `c88a3a908b78c5ab4884a428f721581d8074868517d853375a5d0a6ca6a5db4a` |
| pose-ko-upper | ko.r2.noshadow.png | same | box 0,0,720,437 | 1312x800 | esrgan-x4+lanczos | - | upper body, lying, on side, on ground, closed eyes, holding folding fan, closed fan | `d2bc5441ed6eb16966452690673beca53ac5810581d6e6f55cf8efdaf57d1e11` |
| pose-hurt31-upper | hurt.v3.1.png | `3e1f1869cb005bffded57431aa27b0fbd6de49e890e8e74decb167ca9927e366` | box 0,0,715,560 | 1160x904 | esrgan-x4+lanczos | - | upper body, leaning back, head back, wince, one eye closed, clenched teeth, hand on own stomach, holding folding fan, closed fan | `bb4d6524c52e4eb3c4f159c6937fc44f08278de248ade154f5f69240ec52e6c2` |

(Every caption also ends `white background, simple background`.)

**29 samples an epoch** (10 idle views x 2 + 1 portrait + 8 pose images x 1):
the idle still carries two thirds of every epoch, so the costume truth stays
the idle's.
