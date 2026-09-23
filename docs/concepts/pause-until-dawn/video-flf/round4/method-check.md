# Living portrait FLF, round 4: method check (hard rule 15)

Two FLF renders in a row have failed the join (round 2 JOIN-LAST 2/8, round 3 JOIN-LAST
2/8 with a new blown-out-end failure on top). Rule 15: two failed attempts on the same
failure means a written method check before a third try. This is that check. No render
was queued by writing it.

## 1. What rounds 2 and 3 tried, and what was actually measured

**Round 2** (`length=81`, 16 fps, `end_image` wired straight into
`WanFirstLastFrameToVideo` as a single frame): `docs/concepts/pause-until-dawn/video-flf/judge.md`
read `comfy_extras/nodes_wan.py` and found the real cause precisely —
**`WanFirstLastFrameToVideo` only sets `concat_latent_image` / `concat_mask` (a
conditioning signal), it never writes the plate's pixels back.** Frame 1 and the last
frame are *predictions conditioned on* the plate, not a pin. With `length=81` the node
builds an 84-slot mask and zeros `mask[:4]` (four real start slots) but only
`mask[-1:]` = slot 83, which is **past the 81 real frames** — the true last real frame
(slot 80) stays unmasked, four times weaker an anchor than the start. Measured: mouth
MAD against the plate was flat at 1.5–1.6x the VAE floor through the middle of the clip
and **still falling at frame 81 (2.2x floor)** — the clip ran out of frames before it
finished returning to the plate. Geometry itself was not the problem (0 drift).

**Round 3** (`length=97`, 24 fps, `end_image` fed through
`RepeatImageBatch(amount=4)` so all four mask slots of the last latent get zeroed,
matching the start anchor's strength): the paper check
(`docs/concepts/pause-until-dawn/video-flf/round3/judge.md`) confirmed the fix closes
the exact asymmetry round 2 found. The render
(`docs/concepts/pause-until-dawn/video-flf/round3/judge-clip.md`, commit `d8770f0`)
confirmed geometry is now perfect — phase correlation `(0,0)` on every frame, no drift,
push-in or sway anywhere, on either the head or body box. But it surfaced a **different,
independent failure**: tone. Frame 1 sits near the plate (face 1.75x floor), then **frame
2 snaps to a washed, desaturated grade** (saturation 0.61 → 0.53, face MAD 6x floor)
that holds through the middle, **frames 78–93 brighten further**, and **frames 94–97 —
exactly the 4-frame anchored last latent — decode to an over-exposed, over-saturated,
blown-out grade** (face 5.8x floor, mouth 13.1x floor, head step f93→f94 = 27.95 =
17x the clip's own median step). The anchored latent *is* locked in place (its four
frames move as a rigid block, unlike round 2's loose ending) but it is anchored to the
**wrong exposure**, not anchored-yet-approximate the way frame 1 is. The blink motion
itself was also wrong versus the spec (a slow double blink 4–8x slower than a real
blink, which the spec forbids), but that is a separate, already-understood prompt/motion
defect, not part of this method check.

**The two measured, independent causes, stated precisely:**

1. **End anchor is conditioning, not a pixel pin** (round 2's finding, still true in
   round 3): the last latent decodes to *whatever the model predicts under that
   conditioning*, and round 3 measured that prediction landing ~5x the VAE floor away
   from the plate on exposure/saturation, not near it. Anchoring the latent's *identity*
   (all four slots agree with each other) is not the same as anchoring its *decode* to
   match the plate.
2. **Tone wanders independently of geometry across the whole clip**, not only at the
   ends: frame 2 onward sits in a different grade from frame 1, and drifts further before
   the end-anchor forces a new (worse) grade at 93–97. This is a property of the model's
   colour/exposure behaviour over a long generation, not of the end-anchor mechanism
   specifically — round 2's shorter, 1-frame-anchored clip did not show it (round 2 f81
   face was 5.75; round 3 f81-equivalent region is already in the washed grade at 14–24).

**What is proven already, not hypothesis:** the ping-pong pass
(`docs/concepts/pause-until-dawn/video-flf/round3/pingpong.md`, commit `5ed1f92`) showed
two things by measurement, no render, no ComfyUI touched:

- A **per-frame per-channel affine colour match** (`a·frame + b` per channel, least
  squares, fit only on regions already proven pinned — the body box and the two
  background boxes — then applied to the whole frame) pulls `idle-blinks` from a 6–13x
  floor tonal drift down to a 3.9–5.5x range, and cuts the worst internal pop (f93→f94)
  from a 27.95 head step to 17.04. It does nothing for `idle-breathing`, which never had
  a tone problem — confirming the fit is not just regressing everything toward a
  constant.
- **Ping-pong** (play forward to a calm still frame T, then back to frame 2, never
  re-showing frame 1) puts every reversal seam within 1.0–1.5x the clip's own ordinary
  frame-to-frame motion — nowhere near the 6–20x multiples a forward-only loop's hard
  cut measured. Combined with the colour match, two different clips' frame-1s (already
  independent decodes of the same plate) land **below the VAE noise floor** relative to
  each other (0.70–0.93x). This is the controlled joining method going forward: it does
  not require solving the generator's exposure drift to stop showing a visible join, and
  round 3's own numbers prove it works on exactly this clip's defect.

Colour-match + ping-pong does not fix a **wrong mouth shape** (the double blink); it only
recovers grade continuity. That motion defect is out of scope for this method check and
is not being re-litigated here — the next generation attempt still needs a corrected
blink prompt/timing, tracked separately.

## 2. What was NOT tested: 4-frame batch vs. clip length

`judge-clip.md` §5 states plainly this is a **hypothesis, not tested**: "a 4-frame batch
of an identical still in the end slots is out of distribution for Wan's temporal VAE
latent and pulls the sampler into an exposure and contrast overshoot; the long clip lets
the known Wan colour drift build up in the middle." Two candidate causes for the
blown-out end are conflated in round 3's single data point (`length=97` + `endBatch=4`
together, no `length=81` + `endBatch=4` or `length=97` + `endBatch=1` control):

- **The 4-frame `RepeatImageBatch` end anchor itself** — repeating one still frame four
  times may push the sampler's temporal attention into a batch pattern it rarely sees
  in training (real video rarely holds four bit-identical frames), independent of how
  long the clip is.
- **Clip length (97 vs. round 2's 81 frames)** — a longer generation gives the model's
  own colour drift more steps to compound before the end is reached, independent of how
  the end is anchored.

Round 2 (81 frames, 1-frame anchor) did not show the washed grade; round 3 (97 frames,
4-frame anchor) does. That is exactly one comparison with two variables changed at once,
so it cannot say which one, or both, is the cause.

## 3. The method change for round 4

**(a) Post-process, not re-generation, for the join itself.** Colour-match + ping-pong
(proven above) is adopted as the standing join method for every clip that reaches
judge-quality motion: no future round tries to solve exposure drift or end-anchor
softness by re-prompting or re-seeding alone. `tools/gen/video-post.mjs` (new, this
round) packages this as a reusable step — colour-match against the plate's pinned
regions, then build the ping-pong loop — so the next clip that passes a *motion* judge
does not need a bespoke script the way round 3's pass did.

**(b) One controlled experiment, isolating the two variables above**, before spending
any more render time on full 97-frame clips:

| Arm | length | end anchor (`RepeatImageBatch amount`) | seed | prompt | fps |
|---|---|---|---|---|---|
| A | 81 | 1 (round-2 wiring) | same | same | 24 |
| B | 81 | 4 (round-3 wiring) | same | same | 24 |

Both arms hold length fixed at 81 and vary only the end-anchor batch size, so this
experiment isolates cause (1) — the 4-frame batch itself — from cause (2) — clip length —
by removing length as a variable entirely. (Round 3's own 97/4 data point remains
available as a second reference for the length question later, if arm B's 81/4 result
does not already show the blow-out; a length-only arm at 97/1 is not rendered this
round, to keep this pass to one comparison per rule 15's "measure before a third try",
not open every combination at once.) Prompt for both arms:
*"Subtle breathing, hair still, no blink, the character at rest for the whole last
second."* — deliberately inert (no blink, no head motion) so any tone or exposure change
measured cannot be attributed to the motion the prompt asks for.

`tools/gen/video-flf.mjs` gains two CLI overrides so the arms differ by flag only, no
code edit between renders: `--endBatch 1|4` (default stays 4, the round-3 default,
unchanged for every other clip) and `--length N` (default stays 97, unchanged). Both are
recorded in each render's `job.json` for the evidence trail.

**Reading the result:** if arm B (81/4) already shows the washed-then-blown-out pattern
that round 3 (97/4) showed, the 4-frame end anchor is implicated regardless of length. If
arm B looks like round 2 (81/1) — tonally flat, no blow-out — then length is the
dominant cause and the 4-frame anchor is not, by itself, the problem. If neither arm
shows round 3's blow-out, the true cause needs a length-only control next (97/1,
not rendered this round).

**Both arms get the post-process regardless of outcome**: colour-match + ping-pong,
measured against the plate and the VAE floor, on the same head/body/background boxes
every prior judge pass used, so the AB write-up says whether either arm is *usable
today* even before any further generation-side fix.

## 4. Game-aware classification (rule 14)

**Both.** This track is shared plumbing for the pause-menu living portrait, used
identically for FFX-only and FFX-2-only characters; the FLF tool, the post-process
method and this method check touch no combat, chapter or game-specific system.

## 5. What this is not

Not a fix to the blink motion (double blink, timing) — that is a separate, already
measured defect, unchanged by this pass. Not a rendered, judged clip yet — arms A and B
are queued after this file is committed, per the queue-gate rule (10 consecutive idle
minutes on `GET /queue` before each of the two jobs, one job at a time, never restarting
ComfyUI). Not a change to any other clip's defaults (`END_ANCHOR_FRAMES` / `LENGTH`
constants are untouched; the new flags default to the existing round-3 behaviour).
