# Ormi pose renders with the ormiX2 LoRA (2026-09-23)

FFX-2 only (Chapter 6, Chateau Leblanc; AGENTS.md hard rule 14: per-subject art,
no game file and no shared tool changed). **Nothing here is approved.** The four
installed files are CANDIDATES; `docs/target/approved-hashes.json` is untouched
(sha256 `3c5af02f...` before and after; its 115 files verified the same before and
after with `D:/Tools/pyrefly-lora/tools/verify-approved.mjs`). The idle
(`f7fcdfc3...`) is unchanged and is still the anchor.

**Sheet:** `sheet.jpg` (built by `sheet.py`): one row per state with the idle first;
the whole figure at idle's pixel scale (how the engine sizes it), then the face and
the costume at 1:1 native pixels. **Every candidate:** `candidates.jpg`, one row per
state and batch, guard rejects marked.

## Recipe

`render.mjs <state>`: Animagine XL 4.0 Opt, `LoraLoader ormi-x2` (step 1500,
`../dataset.md`), IP-Adapter plus with the installed idle square-padded on white plus
a head crop as a batch (method F, `pilot2/judge.md`; 0.3, concat, ease in, 0.2 to
0.6, K+V), `ControlNetApplyAdvanced` with the xinsir OpenPose SDXL model on a
full-body COCO-18 skeleton drawn in PIL (`skeletons.py`, end 0.8), the idle-truth
Danbooru words of `sets/ormi/round3/identity-idle.txt` with the character tags
swapped for the trigger, no effect words, `(white background:1.3), (simple
background:1.2)` (the LoRA's backdrop drift, `../dataset.md`), 28 steps, cfg 6,
euler_ancestral. Cut-out: the pipeline's rembg (`comfy.mjs cutout`, isnet-anime)
and the cut-out guard (`cutout-guard.mjs`). Every render queued alone behind an
empty shared ComfyUI queue; no training ran, so the kohya GPU gate did not apply.

Facing: every skeleton faces **screen-right like the idle** (`idle.json` facing
"right"), so the four sidecars say `facing: "right"` and the engine mirrors the whole
set the same way. KO lies head-right (toward the party once mirrored).

## Batches (raw frames, cut-outs and sidecars in `D:/Tools/pyrefly-lora/ormi/poses/`)

| Batch | States | What changed | Result |
|---|---|---|---|
| p1 | all, 1 seed, then cast and ko x6 | skel-<state>, LoRA 0.8, CN 0.6 | cast 960101 and 960106 good (one shield, a heart); attack and hurt: two shields, the lunge and recoil ignored; ko 1 of 6 clean, the rest 2 to 4 shields |
| p2 | attack, hurt x2 | CN 0.7, "shield in front", `(shield on back)` negated | attack a lunge with a punch; hurt upright, a wall prop |
| p3 | attack, hurt, ko x3 | deeper skeletons attack2 / hurt2, LoRA 0.75 | **attack 960022: a real shield bash with a heart on the leading shield, plus a second shield on his back**; ko without shield words drew a second man in every seed |
| p4 | attack, hurt, ko x6 | LoRA 0.7 | looser LoRA = more shields and frame-filling figures; **ko 960336 clean** |
| p5 | all x6 | skeletons at 85 percent (`-s85`), shield words cut back (`--lightShield`) | fewer guard rejects; cast and hurt readable but hurt reads as reaching up; flatter finish |
| p6 | attack x6 | IP-Adapter on the head crop only | worse: floating shields in every seed |
| p7 | hurt x6 | skel hurt3 ("knocked back") | a second man in half the seeds |
| p8 | hurt x6 | skel hurt2, LoRA 0.75, "head back, looking up" | **hurt 960262: arched back, arm flung, hand to the belly** |

Hard rule 15, the method check the batches forced: the extra shield is not a
prompt problem. The LoRA was trained on one painting in which the shield is always
on his back, so the trigger carries a back shield; negatives and a head-only
reference did not remove it, and a looser LoRA only multiplied it. What worked was
editing the one good frame (below), the round-3 judge's own advice ("masked
repaints, the tool that already worked here").

## Picks (self-judged at 1:1; an independent judge is still owed)

Scoring as `sets/ormi/round3/judge.md`: each criterion 0 to 10, the score is the
worst, the bar is 7.

| State | Pick | Head | Face | Costume | Shield | Build | Style | Pose | Score |
|---|---|---|---|---|---|---|---|---|---|
| attack | `attack.p3.960022` + erase + back repaint 970023 | 7 | 7 | **6** | 7 | 8 | 7 | 8 | **6** |
| cast | `cast.960106` | 8 | 8 | 7 | 8 | 8 | 7 | 7 | **7** |
| hurt | `hurt.p8.960262` | 7 | 6 | 5 | **4** | 8 | 5 | 7 | **4** |
| ko | `ko.p4.960336` + heart repaint 970103 | 7 | 7 | 6 | **5** | 8 | **5** | 8 | **5** |

- **attack** (shield bash): lunging to the right, both hands driving one round
  gold-rimmed shield with a red heart; maroon topknot and red tie, green eye, bared
  teeth; crimson sleeves, purple kimono, yellow sash, teal curtain with its ornament.
  Two edits, both recorded in the sidecar `edits`: `erase.py` removed the second,
  back-mounted shield (it lay in front of the collar), then `repaint.mjs` regrew the
  upper back and collar in a 72 px circle (denoise 0.85). Worst: the hakama hem
  fades to a translucent white band, not idle's gold diamonds; a small heart brooch.
- **cast** (Supercollider wind-up): fist raised high, teeth bared, idle's cheek mark
  and green eyes; the only pick with idle's gold diamond hem; one shield with a
  clear red heart. The shield hangs at his side, not on his back; a heart clasp at
  the collar is invented. The one state at the bar.
- **hurt** (recoil): back arched, far arm flung out, near hand clutching the belly,
  eyes screwed shut. The shield is on his back and seen edge-on, so **no heart
  shows**; the sash rides up over the belly, the hem is gold stripes, purple ribbons
  on the wrist; a flatter, more outlined finish than idle. Kept for the pose, the
  only recoil that read in 30 hurt renders.
- **ko** (lying on his back, head right, eyes shut): one round shield standing behind
  him; its face was concentric red and blue with a gold cross, so the heart was
  repainted in with the round-3 recipe (`repaint.mjs --lora 0`, denoise 0.8). The
  finish is glossy and saturated, unlike idle, and the shield is not idle's sunburst.

Scale: at idle's pixel scale the heads look about idle's size by eye on `sheet.jpg`
(not measured; the round-3 judge measured that set's heads at about 1.5 times), because
the skeletons were drawn over the idle (`skel-overlay.jpg`, first tile).

## Against the files replaced (round 3, backed up)

The round-3 files are in
`D:/Tools/pyrefly-art-backup/candidates/2026-09-23-leblanc-lora/ormi/replaced/`, the
picks (raw, cut-out, render sidecar) in `.../ormi/picks/`. Round 3 scored attack 5,
cast 4, hurt 5, ko 4 and turned round between states; this set faces one way, keeps
the idle's topknot, sleeves, sash and curtain (the LoRA's work: round 3 had lilac
hakamas, rainbow scarves and no teal curtain), and brings cast to 7 and attack to 6.
Hurt (4) is not better than round 3's 5 on the number: it trades the shield heart for
a readable recoil. Bailey's call which to keep.

## Open

1. An independent judge pass on this set (hard rule: the painter's scores are not the
   review).
2. Hurt: a heart repaint is impossible while the shield is edge-on; a hurt with the
   shield face visible needs a skeleton that turns his back a little toward the
   camera, or the p5 upright flinch (960242, shield face visible) plus a heart repaint.
3. KO and hurt finish: a low-denoise img2img pass (0.15 to 0.2) with idle as the style
   reference, the round-3 judge's item 4.
4. Hard rule 6: the topknot colour, sleeves, sash, curtain and shield colours come
   from the installed idle, not from a source; §10.1 of
   `research/ffx2-leblanc-syndicate.md` supports only the stout build, the shield on
   his back with the Syndicate heart and the purple samurai attire.

## Files

- `skeletons.py` -> `skel-*.png`, `skel-overlay.jpg` (idle with its skeleton, then each pose)
- `render.mjs` (the renders; flags per batch in each sidecar), `repaint.mjs`, `erase.py`
- `picks.json`, `install.mjs` (backs up, installs, writes the engine sidecars)
- `sheet.py` -> `sheet.jpg`; `candidates.jpg`
