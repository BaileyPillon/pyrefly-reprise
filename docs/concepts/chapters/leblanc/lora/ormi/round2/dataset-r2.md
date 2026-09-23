# Ormi identity LoRA round 2 (`ormiX2`, r2): the grown dataset

FFX-2 only (Chapter 6, Chateau Leblanc art; AGENTS.md hard rule 14: per-subject
art tooling, no game file and no shared tool changed). Nothing here is approved:
`docs/target/approved-hashes.json` is untouched (sha256 `3c5af02f...` before and
after; its 115 files verify the same with `D:/Tools/pyrefly-lora/tools/verify-approved.mjs`).

Built by `dataset-r2.py` (`crops`, then `node tools/gen/lora-ormi.mjs upscale --src
.../r2/stage/crops --dst .../r2/stage/up`, then `finish`). The images live outside the
repo in `D:/Tools/pyrefly-lora/ormi/r2/dataset/{idle,poses}/` with `manifest.json`
(every file's sha256 and caption) and `r2/dataset.toml` (two kohya subsets).

## The rule and how it was applied

The brief: round 1's dataset plus every round-1 output that the independent judge or
the painter scored 6 or above, captioned by view and pose only, at repeats 1; the idle
views stay at repeats 2; nothing with a wrong costume detail a judge named.

| Round-1 output | Score | In? | Why |
|---|---|---|---|
| installed idle (round 1's 14 crops, `../dataset.md`) | anchor | **yes, repeats 2** | the identity |
| `cast.960106` (installed cast) | judge 7, painter 7 | **yes, edited** | the judge named "an invented red heart clasp with magenta tassels at the collar". That clasp was painted out of the training copy with `../poses/repaint.mjs cast cast.960106 clasp` (ellipse 522,388 r62x58, denoise 0.8, LoRA r1 0.8, 3 seeds; **975003** picked at 1:1: a small gold collar knot, no heart, no tassel). The judge's own upstream advice was to add this frame |
| attack redo `attack.p3.960022...brooch972045.eye` (installed attack) | painter 6 (judge 5 before the redo) | **yes** | the judge's costume fault (the white translucent hem and the heart brooch) was fixed by the redo; left: no tassel, shield edge-on (absences, not wrong details) |
| hurt redo `hurt.p5.960242.heart971005` (installed hurt) | painter 6 | **cropped** | the painter named its repainted shield face pink-violet with no red band; only a cowboy crop from x 292 (right of the shield rim) goes in, so the wince, the belly clutch and the costume train and that shield does not. The crop cuts the back of the topknot |
| `ko.p4.960336...blend974016` (installed ko) | judge 4, painter 5 | no | below 6; glossy finish, orange sleeves |
| `attack.p3.960022` before the redo | painter 6, judge 5 | no | the judge named its white hem band and heart brooch (wrong costume) |
| `hurt.p8.960262` (the first hurt pick) | judge 4 | no | below 6; sash sack, neon style |
| candidate pools (`../poses/candidates.jpg`, `redo-candidates.jpg`) | unscored except the above | no | no other frame has a score of 6 or above; `cast.960101` was called "good" in poses.md with no score |

## Sources

| Source | sha256 of the frame read | Installed cut-out sha256 |
|---|---|---|
| `public/art/characters/ormi/idle.png` | `f7fcdfc358c25fa8172028a9ddce9139d0c7e7623ce17239381b89cc6f0ba701` | same file |
| `D:/Tools/pyrefly-lora/ormi/poses/attack/attack.p3.960022.erase.back970023.hemfix.blend972035.brooch972045.eye.raw.png` | `7f4f6204ad9c76e613bedae8faef28195db4c6aac433b0710b5db23394a0a806` | `d90aa2ed475f6ee4ee0c6677e2aa2d2c1c8fbc8fb993b14fb2bdcf49e8ba4ec5` (= installed attack.png) |
| `D:/Tools/pyrefly-lora/ormi/poses/cast/cast.960106.raw.png` (before the clasp edit) | `0ffe7366e1fa8b673f84d0c79cd126537740a387cc8218753f60c61c7b37bf50` | `f0a88fc5dee3d100cb9626cf826ff254ed65d88f7ba3619d2327cc37e3212ee3` (= installed cast.png) |
| `D:/Tools/pyrefly-lora/ormi/poses/cast/cast.960106.clasp975003.raw.png` (what trains) | `84baee6344f5f81b7248fd8db6bb2eae95d9c9c1ac5092d180d6e76fe89df796` | `2c78755445d8867349ee4d1d639b6a95f7ee370a79438ecc8709cf9e0865cb70` |
| `D:/Tools/pyrefly-lora/ormi/poses/hurt/hurt.p5.960242.heart971005.raw.png` | `9833629829dc50fc923f584de28a4344c1ef8a9de6db3161a259cf3051595547` | `d780831758b2df0bef6e505864b29874259da5159c1e94995d8f3ee9ccae4a3d` (= installed hurt.png) |

Each pose image is the pipeline cut-out flattened on white (never the raw background).
Full-body frames sit on a white 832x1216 (cast) or 1024x1024 (attack) canvas at 1:1 or
below; crops go through RealESRGAN x4plus in ComfyUI and are brought to about 1 MP with
Lanczos, like round 1. Every pose image is also mirrored with the facing caption swapped
(round 1: Ormi has no one-sided feature).

## The 24 training images

Per epoch: 14 idle x 2 + 10 poses x 1 = 38 samples; the idle is 74 percent of what the
LoRA sees.

| Subset | File | Repeats | Box on the raw frame | Mirrored | Size | sha256 | Caption (between `ormiX2, 1boy, solo,` and `, white background, simple background`) |
|---|---|---|---|---|---|---|---|
| idle | `full-right.png` | 2 | whole | no | 832x1216 | `c2a320f7d6d2d9ed1ca3a2c9cd93c474e1cbd1146c5be5961c2fef1ecfcd7141` | full body, from side, three-quarter view, standing, arms crossed, looking to the side, body facing right |
| idle | `full-left.png` | 2 | whole | yes | 832x1216 | `daacc945d5e953264cd74522a9c332549a95528f24f796a9daeb6bb0d565a6e3` | same, body facing left |
| idle | `full-small-right.png` | 2 | whole | no | 1024x1024 | `fa2567e0773953781aa29c705c7f028a33f63f46ea23d058c2ab5c6e878b5b61` | full body, ..., wide shot, body facing right |
| idle | `full-small-left.png` | 2 | whole | yes | 1024x1024 | `64cf09dfc46bec3e4401e7f7fc9a965352e3d165c5e69c58b377fa31a4bba2da` | same, body facing left |
| idle | `cowboy-right.png` | 2 | 0,0,489,800 | no | 800x1312 | `65783ec10ccefa4d86f50e00b5e435c82ff066a9ec8c69dd0b5a614eecb13b0e` | cowboy shot, from side, three-quarter view, standing, arms crossed, looking to the side, body facing right |
| idle | `cowboy-left.png` | 2 | 0,0,489,800 | yes | 800x1312 | `517f5f3ac04bb8b0f1742ed607118463bbe0e82d59f8ccfbb273f1cbec55e5c9` | same, body facing left |
| idle | `upper-right.png` | 2 | 0,0,489,540 | no | 976x1080 | `8b1a79ebaa7e26dde6362f53950465e4d535e19a729ac19b9187553e9eaab74d` | upper body, from side, three-quarter view, arms crossed, looking to the side, body facing right |
| idle | `upper-left.png` | 2 | 0,0,489,540 | yes | 976x1080 | `78951d6962c2986924f6a131c480cbd0d162a83aacb9f7ecbf2b6a611d7b4ad6` | same, body facing left |
| idle | `bust-right.png` | 2 | 120,0,480,360 | no | 1024x1024 | `6eb84aabbf502e902c86f32cc65ae2278a951fd63e842e93bae538e3208863a0` | portrait, head and shoulders, from side, three-quarter view, arms crossed, looking to the side, body facing right |
| idle | `bust-left.png` | 2 | 120,0,480,360 | yes | 1024x1024 | `aa034e3719182c69b7271c8a125c475e52b8af21f377c331fb17506303c73d6f` | same, body facing left |
| idle | `face-right.png` | 2 | 170,0,430,260 | no | 1024x1024 | `3cb574587e5c2b4ca084f115dee30fd24a7644b522717e26c7afb9b45207033d` | close-up, face, from side, three-quarter view, looking to the side, body facing right |
| idle | `face-left.png` | 2 | 170,0,430,260 | yes | 1024x1024 | `1018f3ddf3f025526f5a8b22441175401904ae3c1a222a67bbe249ceb96868ac` | same, body facing left |
| idle | `lower-right.png` | 2 | 0,480,489,1189 | no | 848x1232 | `4ed848a6ef6cdf24d2f97c396dab21ac06b8ea473a1747d72ba1fd1ce3e09391` | lower body, from side, standing, body facing right |
| idle | `lower-left.png` | 2 | 0,480,489,1189 | yes | 848x1232 | `59001e5cb9635e2661605942f229e38078c7f58ae2b6aece1c070e47d2a98a2d` | same, body facing left |
| poses | `attack-full-right.png` | 1 | whole cut-out | no | 1024x1024 | `4948fd012862afb922770a30f61e1fd665a3b94268cd2fd3d1fc8c341e0c2744` | full body, from side, three-quarter view, shield bash, lunging, leaning forward, one leg forward, holding shield, shield in front, clenched teeth, angry, body facing right |
| poses | `attack-full-left.png` | 1 | whole cut-out | yes | 1024x1024 | `50902f6f8a9ce4bc4b8c5ca516d978b46f078eb7018a81a35eb196768c88905e` | same, body facing left |
| poses | `attack-upper-right.png` | 1 | 300,190,780,650 | no | 1048x1000 | `64e9be9cf95ed2b5af09ac4e671021335b07e2b73afaefe9d57599ad4203817c` | upper body, from side, three-quarter view, shield bash, leaning forward, holding shield, shield in front, clenched teeth, angry, body facing right |
| poses | `attack-upper-left.png` | 1 | 300,190,780,650 | yes | 1048x1000 | `2686a2b958ff0d181e7818ce22d6bc5f9cf6c65dc85b5c09830b73744fe9e393` | same, body facing left |
| poses | `cast-full-right.png` | 1 | whole cut-out | no | 832x1216 | `9a025483a25ecdb8ca771c8e906caf51656166fa8cb8e72659add235c1a5178e` | full body, from side, three-quarter view, standing, legs apart, arm up, raised fist, shield at side, clenched teeth, angry, body facing right |
| poses | `cast-full-left.png` | 1 | whole cut-out | yes | 832x1216 | `6a864580d3ee29e08b57db54a1196441a7c7e2714364cf957ca92773650fa015` | same, body facing left |
| poses | `cast-upper-right.png` | 1 | 250,0,710,560 | no | 928x1128 | `9becd83700c3b2efc3a61b165f803ca5cbbb2d0f25ec399eb37db4523364066b` | upper body, from side, three-quarter view, arm up, raised fist, shield at side, clenched teeth, angry, body facing right |
| poses | `cast-upper-left.png` | 1 | 250,0,710,560 | yes | 928x1128 | `0324057392f88e04e9ab881e428fbc6e9150adf443e7409a5a876e5ecddb75e7` | same, body facing left |
| poses | `hurt-cowboy-right.png` | 1 | 292,250,640,1000 | no | 696x1504 | `b2dbd72bf30fd401d6cddb0230de2276742934f14c774f62d29e816af47d9e83` | cowboy shot, from side, three-quarter view, leaning back, arm up, hand on own stomach, closed eyes, wince, pained expression, body facing right |
| poses | `hurt-cowboy-left.png` | 1 | 292,250,640,1000 | yes | 696x1504 | `f28eaa8a426104afdcb7ebe67dea2357fd399089fd0c7bcf794e08e035089506` | same, body facing left |

Captions carry no costume words, so the crimson sleeves, purple kimono, sash, teal
curtain, hem, sandals, topknot and shield keep binding to the trigger. `shield at side`,
`shield in front` and `holding shield` are pose words: the point of the new images is
to teach the trigger that the shield is not always on his back (round 1's LoRA drew a
second, back-mounted shield in about half of the attack, hurt and ko renders).

## Risks stated up front

- The pose images are generated frames, two of them pixel-edited (attack's hemfix and
  eye, cast's clasp). At 1:1 they carry the Animagine finish, which is the idle's; the
  hemfix diamonds are drawn and a little flatter than painted ones.
- Hurt is a crop, so the topknot is cut at the frame edge in both hurt images.
- The idle stays 74 percent of each epoch, so the identity anchor still dominates.
