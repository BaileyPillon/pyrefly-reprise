# Leblanc battle-pose art: method check before a third attempt

FFX-2 only (Chapter 6, the Leblanc Syndicate; AGENTS.md hard rule 14: this is
per-subject art recipe, not shared plumbing, and nothing here changes
`tools/gen/comfy.mjs`). Written 2026-09-22 **before** any pilot render, as hard
rule 15 requires after two failed attempts at the same thing. The pilot this
plans is `docs/concepts/chapters/leblanc/pilot2/` (results in `pilot2.md` there).

## 1. The two attempts

| | Attempt 1 (`9621f0e`, 2026-09-21) | Attempt 2 (`1b33971`, 2026-09-22) |
|---|---|---|
| Recipe | Method A from `pilot/judge.md`: txt2img, `--forceRef` idle at 0.35, ease in, 0.2 to 0.6 | Same, `refWeight` 0.4 |
| Identity text | the research prose block (`pilot/identity.txt`), incl. "blue and white triangles", "thigh-high stockings", "red-and-silver fan", "confident smirk, half-lidded eyes" | pattern words removed, `(plain solid purple robe, no pattern:1.4)`, `pale skin`; hurt's expression overridden to "pained grimace, eyes shut tight" |
| Pose text | `fighting stance, holding fan, outstretched arm, leaning forward, open mouth` (attack); `wince, one eye closed, leaning back, arm across chest` (hurt) | attack unchanged; hurt rewritten as prose ("recoiling from a heavy blow, doubled over at the waist ...") |
| Independent judge | FAIL, every state 3/10 (four different invented robe patterns; hurt reads coy) | self-judged only: attack 6, cast 6, hurt 6, ko 7 |
| What still fails | | **attack** reads as a fan flourish (a dance), not a strike; **hurt** wears a different, longer, closed robe and still reads as a coy smile or "upset standing"; skin tone and fan colour drift |

The siblings failed the same way: Logos's helmet changes between states, Ormi's
shield shape and heart emblem change between states (`sets/logos/judge.md`,
`sets/ormi/judge.md`). Three subjects, one recipe, one failure family.

## 2. Why each criterion failed (mechanisms, checked against code and pixels)

Anchor, per the brief: `public/art/characters/leblanc/idle.png` (591x1118
cutout, cropBox 88,51 to 679,1169 of an 832x1216 frame) and its sidecar.

### 2.1 The identity text does not describe the anchor

Looked at idle 1:1 (head/torso crop and whole figure). What idle actually wears,
against what every attempt told the checkpoint:

| Idle's pixels | Identity text used in attempts 1 and 2 |
|---|---|
| **white halter-neck plunging dress**, high-cut, the main mass of the figure | not mentioned at all |
| **crimson obi sash** with a gold knot ornament and a lavender-and-white **tassel** hanging at the front | not mentioned |
| purple outer kimono robe **slipped off both shoulders**, worn at the elbows, wide sleeves with striped maroon/orange cuff bands; faint tonal lavender triangles on the lower robe | "a pinkish-purple furisode-style robe left open at the chest" (attempt 2: "plain, solid purple robe, no pattern") |
| **bare legs** | "thigh-high stockings the same pinkish-purple as the robe" |
| **lavender lace-up open-toe heeled ankle boots** | "purple ankle boots with a low heel" |
| **dark navy/black closed folding fan** held at the mouth | "(red and silver fan:1.15)" |
| purple studded **choker** | "a high curved tasselled collar" |
| platinum-blonde chin bob, bangs swept over her right eye, purple eyes, pale skin, red heart on the sternum | matches |

So the checkpoint was asked, in words, for a different costume from the one in
the reference, and at `refWeight` 0.35 to 0.4 the words win. Attempt 2's
installed `attack.png` draws black thigh-highs and a pink-and-white fan; its
`hurt.png` draws a closed ankle-length robe with no white dress, no obi tassel
and a stick for a fan. Each of those is the text, not a random drift.

**Hard rule 6 note.** The research (`research/ffx2-leblanc-syndicate.md` §10.1)
says thigh-high stockings, a red-and-silver fan and a triangle-and-swirl
pattern; the idle Bailey saw has bare legs, a dark fan and a plain robe. The
brief makes the idle the anchor, so the pilot describes the idle's pixels.
Whether the idle should later be brought to the canon (stockings, fan colour)
is **Bailey's call and is not decided here**.

### 2.2 The adapter never saw her face

`IPAdapterAdvanced` encodes the reference with `clip_preprocess(img, size=224)`
(`ComfyUI_IPAdapter_plus/utils.py:293`, `comfy/clip_model.py:6-23`): scale the
short side to 224 and **centre-crop a square**. `stageImage` flattens the
591x1118 idle onto white without padding it square, so the adapter sees the
middle 591x591 band, **y 263 to 854 of the cutout: the obi down to the knees**.
The face, hair, choker, fan and boots are outside the crop. In both attempts,
"identity by reference" meant "a white dress, a red sash and two legs"; face,
skin, hair and fan came from the tags alone, which is exactly where the drift
is (skin tone, fan colour, hair length). Ormi's shield sits on his back, above
the crop band; Logos's helmet is above it too.

### 2.3 The framing block and the character prior fight the pose

Every full-body sprite prompt ends with the facing phrase
`(from side:1.3), three-quarter view, body facing left, (looking at viewer:1.2)`
and `full body, standing, feet visible, ...` (`comfy.mjs` `FACING_PHRASES`,
`CHARACTER_COMPOSITION`). For hurt that is a weighted *look at the camera* and
a flat *standing* against "eyes screwed shut, doubled over", on a character
tag (`leblanc (ff10-2)`) whose trained prior is the coy fan-at-the-mouth
performer pose (the canon pose research §10.1 describes, and idle's own). The
sampler splits the difference: an upright woman looking at the viewer with one
eye shut, which is a wink. The prose pose phrases of attempt 2 are also the
wrong register for Animagine (see `docs/ART-PIPELINE.md` §2 and the art-4 pose
lessons: Danbooru tags land, sentences do not).

### 2.4 Attack is described as a stance, not a blow

The effect words that usually signal an attack (`attacking`, `slash`,
`dynamic pose`, `action pose`) are banned, correctly (swirl cut-outs). What was
left, `fighting stance, outstretched arm, open fan`, is on this checkpoint the
fan-dancer silhouette: arm out to the side, fan open and displayed, face to the
camera, smiling. Nothing asked for the weight to go forward, for the arm to
swing across the body or for a hostile face. A strike needs the body to say it:
a lunge, a leaning torso, the fan arm driven forward, a serious face.

### 2.5 What does not help (so we stop doing it)

- Another re-roll of method A with the same inputs (the pattern of attempt 2).
- Hunting `refWeight`: 0.35 to 0.45 made no difference inside noise
  (`pilot/pilot.md`), and above ~0.5 the adapter burns colour and dissolves
  lines (`docs/ART-PIPELINE.md` §3, R2 findings).
- Method B (img2img straight off idle): copies idle's pose (`pilot/judge.md`).
- Method C (one reference sheet): costume changes seed to seed.

## 3. Shared fixes every new method gets

1. **Idle-truth identity block**: the table in §2.1, written as Danbooru-style
   costume tags plus short phrases, describing idle's pixels only
   (`pilot2/identity-idle.txt`). No expression words in the identity block;
   expression lives with the pose.
2. **Per-state framing** instead of the shared block: keep `(from side:1.3),
   three-quarter view, body facing left, full body, feet visible, simple
   background, white background`; drop `standing` and `(looking at
   viewer:1.2)` for hurt and attack (attack looks at its target, hurt has its
   eyes shut). Negative adds `smile, smirk, wink, grin, seductive smile,
   dancing` for both states, and `stockings, thighhighs, closed robe, long
   dress` for the costume.
3. **Danbooru pose tags, no effect words**, per the lint:
   - hurt: `leaning back, off balance, wince, closed eyes, pained expression,
     clenched teeth, v-shaped eyebrows, hand on own stomach, head tilt, arm at
     side, holding closed fan`
   - attack: `lunging, leaning forward, one leg forward, arm extended forward,
     swinging, holding folding fan, serious, v-shaped eyebrows, looking
     ahead, closed mouth`

## 4. The new methods to pilot

**Method D, pose then re-identify (two stages).** Stage 1 is method A (the tall
flattened idle as `--ref`, forced past the monochrome guard, weight 0.35, ease
in, 0.2 to 0.6) but with the shared fixes of §3, so the pose is drawn by a
prompt that no longer fights it. Stage 2 re-identifies the figure without
moving it: a masked repaint (VAEEncode + `SetLatentNoiseMask`, then
`ImageCompositeMasked` so nothing outside the mask is touched) over (a) the
figure's own silhouette at denoise 0.4 and then (b) a head box at 0.5, both
with the idle as IP-Adapter reference at 0.55 to 0.6, **square-padded** so the
adapter sees the face (§2.2), and with the adapter window at 0.0 to 1.0: at
denoise 0.4 the sampler only runs the last ~40 % of the schedule, so the usual
`end_at 0.6` would switch the adapter off after a step or two.
`tools/gen/inpaint.mjs` itself cannot do this unmodified (it hard-codes Yuna's
identity block from `yaw-keys.mjs` and uses `VAEEncodeForInpaint`, which greys
the masked pixels and is meant for denoise 1.0 on an inpainting checkpoint),
so the pilot builds the same native-node graph in its own script and leaves the
shared tool alone.

**Method E, pose-first puppet.** Paste idle's cutout on its original 832x1216
canvas, re-pose it crudely in PIL (cut at the waist and rotate the upper body
forward for the lunge or back for the recoil; move the fan hand from the mouth
to the strike position or to the stomach; paint the eyes shut for hurt), then
img2img at denoise 0.6 and 0.7 with the idle-truth block and the pose tags. The
paste carries colours and costume; the denoise redraws the joints. No
reference adapter, so that E answers one question: does a pose-bearing init
image keep the costume on its own?

**Method F, a reference the adapter can see.** The cheapest change of the
three, justified by §2.2: method A with the shared fixes of §3, but the
reference is a **batch of two squares**, idle padded to a square on white
(whole figure, face included) and a square head-and-fan crop of idle, combined
by the adapter's `concat`, weight 0.4, ease in, 0.2 to 0.6. Same seeds as D's
stage 1, so D1 against F isolates the reference framing on its own.

## 5. How the pilot is judged

Worst criterion, bar 7, against idle 1:1 (the rubric of `sets/leblanc/judge.md`):
hair, face (skin tone folded in), outfit colours and pattern (must be the
idle's robe: off the shoulders, white halter dress, red obi with tassel, bare
legs), marks (red heart on the sternum), weapon (the fan), style, and the pose
reads as its state (hurt: hit, recoil, wince, closed eye, hand to the wound;
attack: a strike, weight forward). Four candidates per method per state, all
shown whole on `pilot2/sheet.jpg` with a 1:1 face row and a 1:1 costume row.
Nothing is installed and nothing is approved by this pilot; a winning method
goes to Bailey as a recommendation with its sheet.

Budget: about 60 renders on the shared ComfyUI queue (D: 8 stage-1 + 16
repaint passes; E: 8; F: 8; plus re-runs), one batch at a time, polling
`/queue` between batches.
