# Living portraits for the pause screen

**Status:** proposal. Nothing here is built beyond the throwaway prototype at
`docs/concepts/pause-until-dawn/prototype/`. **Needs Bailey's yes** (AGENTS.md
rules 9, 10 and 11).

**Game-aware classification (rule 14): BOTH.** The rig is shared presentation
plumbing (`critic/CHECKS.md` CHK-020) — one shader, one data table, used by FFX
chapters 1–3 and the new Evrae and Macalania chapters, and by FFX-2 chapters 4–5
and the new Leblanc chapter. Three details are *not* shared and are marked
**[FFX-2 only]** where they appear: the pyre-pink accent in place of gold, the
three-member party against FFX's seven, and any dressphere-dependent portrait
swap.

Bailey's request, 2026-09-21: *"The characters should be expressive and should be
controllable by keyboard (in until dawn you can control the characters gaze) …
The characters need to be animated. In motion."*

---

## 1. What Until Dawn actually does

The reference Bailey sent is **"(4K) Until Dawn Remaster Character Screens
Scenepack (Before and After)"** ([youtu.be/AbBwCES6lqw](https://youtu.be/AbBwCES6lqw)) —
so the target is the game's **character / status screen**, not a pause overlay.

What the sources support:

- The character screen is one of the game's menu screens, alongside the Totem,
  Clue and Butterfly Effect pages, and it carries each character's **Traits and
  Relationships**, updated by the player's choices through "Status Updates"
  ([Until Dawn Wiki](https://until-dawn.fandom.com/wiki/Traits_and_Relationships),
  [Game UI Database](https://gameuidatabase.com/gameData.php?id=149)).
- The characters' **visible state carries into how they are shown**: the 2024
  remake made injuries a focus, with more detailed bruises, cuts and tears
  accumulating over the night
  ([Game Rant](https://gamerant.com/until-dawn-remake-all-changes/)).
- The remake was rebuilt in Unreal Engine 5 with **new character animations and
  updated existing ones**, and relaxed the 2015 fixed camera into full camera
  control ([80.lv](https://80.lv/articles/ue5-powered-until-dawn-remaster-is-coming-this-year),
  [Wccftech](https://wccftech.com/until-dawn-remake-pc-ps5-unreal-engine-5-full-camera-control/)).
- In gameplay the **right stick turns the camera and aims the light source**
  ([StrategyWiki](https://strategywiki.org/wiki/Until_Dawn/Controls)); the
  remaster lets both stick functions be swapped
  ([Access-Ability](https://access-ability.uk/2024/10/11/until-dawn-ps5-accessibility-review/)).

**What I could not confirm, and will not invent (rule 6).** No text source I
could reach documents the character screen's *own* interaction: whether the
stick turns the character's head, moves only the eyes, or orbits the camera; how
far it travels; or how it eases back. Bailey's memory of controlling the gaze is
the best evidence we have and it is probably the right stick, since that is the
stick that aims the look everywhere else in the game.

**This is why the prototype exists, and it is the cheaper way to settle it.**
It implements all three readings at once — head, eyes and a slow camera push —
on keyboard, mouse and right stick, so Bailey can answer by feel in thirty
seconds instead of us arguing from citations. **Open question 1** below.

---

## 2. The options

Costs are agent-hours. "Drift" is the risk of the character stopping looking
like Bailey's approved painting — the thing rule 9's approved-hashes rule exists
to prevent.

| # | Route | What Bailey sees | Drift | Runtime | Build | Downloads |
|---|---|---|---|---|---|---|
| **A** | **Procedural head depth + shader warp** (built) | Head turns a few degrees, eyes lead it, breathing, sway, blink, micro-drift. Reads as a living bust. | **None.** Pixels are only moved; the painting is never repainted. | 0.06 ms/frame measured | **done** (~6 h) | **none** |
| B | Depth-model parallax (Depth Anything V2) | Same as A, but hair, earring and shoulders separate correctly instead of following an ellipsoid | None (depth is a mask, not a repaint) | same | +3 h, +1 pass per painting | **99.2 MB**, Apache-2.0 |
| C | LivePortrait, pre-rendered pose grid | Genuinely re-posed head: real yaw/pitch, real lids, real expression | **High.** It re-synthesises the face; anime/painted faces are off-distribution | Big: a pose grid per character is many MB of texture | ~20 h + render time | ~1 GB, **InsightFace is non-commercial** |
| D | Live2D-style cut-out rig | Best-in-class motion (hair, cloth, full head turn) | Low, but the separation is a repaint of what is behind each layer | Low | **~8 h per character** of manual layer separation, x10 | none, but a tool licence question |
| E | **Inpainted variants from our own pipeline** (closed eyes, pained, determined) | A real blink and a real change of expression, in the same hand as the painting | **Low** if patched by region — everything outside the patch is byte-identical | One extra small texture | ~5 h rig + ~20 min per variant | **none** — `animagine-xl-4.0-opt.safetensors` is already installed |
| F | Small life: breathing, sway, motes, shimmer, push | The difference between "a JPEG" and "a scene" | None | Nil | included in A | none |

Notes that decide it:

- **LivePortrait's weights are MIT, but it depends on InsightFace's `buffalo_l`
  pack, which is licensed for non-commercial research only**
  ([LivePortrait #548](https://github.com/KlingAIResearch/LivePortrait/issues/548),
  [ComfyUI-LivePortraitKJ](https://github.com/kijai/ComfyUI-LivePortraitKJ)). Pyrefly
  is a non-commercial fan tribute, so it is arguably inside that line — but it
  is a licence we would be relying on, in a public repo, for a cosmetic gain,
  and the model is built for photographic faces. Two of the three reasons to
  say no are enough.
- **Depth Anything V2 Small is Apache-2.0 at 99.2 MB. Base/Large/Giant are
  CC-BY-NC-4.0** ([DepthAnything #162](https://github.com/DepthAnything/Depth-Anything-V2/issues/162),
  [model card](https://huggingface.co/depth-anything/Depth-Anything-V2-Small)).
  If we take a depth model, take the Small one; the licence is clean and it is
  the only one of the four that is.
- **The local ComfyUI has none of this installed.** `D:\Tools\ComfyUI\ComfyUI\models`
  has empty `controlnet`, `geometry_estimation` and `detection` folders and the
  only custom node is `ComfyUI_IPAdapter_plus`. Every route except A, E and F
  starts with a download.
- **Route E needs no download**: `animagine-xl-4.0-opt.safetensors` — the model
  that painted these portraits — is already there, and masked inpainting at
  moderate denoise is the same pipeline that produced them.

---

## 3. Recommendation

**Ship A + E + F. Ask for the Depth Anything V2 Small download only if Bailey
wants the hair and shoulders to separate properly after seeing A. Do not take
LivePortrait. Do not hand-rig cut-outs.**

Reasoning:

1. **A already works and cost nothing.** The measured GPU cost is 0.36% of a
   60 fps frame, there is no new dependency, no download, and — the point that
   matters most under rule 9 — **it cannot take the character off-model,
   because it never repaints a pixel.** Every approved painting stays exactly
   the painting Bailey approved, hash and all.
2. **E is where the remaining life is, and it is our own pipeline.** The two
   things A visibly fakes are the blink and the expression, and both are the
   same job: inpaint a region of a painting we already have, with the model that
   made it. **Patch by region, not whole frames** — a 512x256 eye patch is
   0.5 MB against 4.0 MB for a repainted portrait, and everything outside the
   patch is byte-identical to the approved art, which makes drift a bounded,
   reviewable question instead of an open one.
3. **A pre-rendered pose grid is not worth its download.** It buys a real head
   turn that A already approximates well enough at ±11°, and it costs a
   non-commercial licence dependency, ~1 GB, a per-character render pass, a
   large runtime texture budget, and the identity-drift risk that rule 9 exists
   to avoid. If Bailey looks at the prototype and says the turn is not enough,
   that is the moment to reconsider — not before.
4. **A depth model is worth its download only on Bailey's say-so.** The
   ellipsoid is convincing on a frontal close-up like Yuna's; it will be weaker
   on Lulu (face behind hair), Kimahri (muzzle) and Auron (near profile).
   99.2 MB under Apache-2.0 is a cheap, clean fix, offline, one pass per
   painting, with the depth map stored as a small greyscale PNG. But it is a
   download, so it is **Open question 3**.

---

## 4. The per-character asset list this implies

Party members, read from the builds, not from memory: FFX chapters 1–3 field
**Tidus, Yuna, Auron, Wakka, Lulu, Rikku, Kimahri**
(`src/data/ffx/builds/gagazet.ts`, `zanarkand.ts`, `dreams-end.ts`); FFX-2
chapters 4–5 field **Yuna, Rikku, Paine**
(`src/data/ffx2/builds/bevelle.ts`, `farplane.ts`). The three new chapters add no
new party member: Evrae and Macalania are FFX, Leblanc is FFX-2. **Ten distinct
portraits**, counting FFX-2 Yuna and Rikku as their own paintings.

Per character:

| Asset | Have | Need |
|---|---|---|
| Close-up painting, 832x1216 RGBA cut-out | **all 10** (`public/art/portraits/`) | — |
| `fx`/`fy`/`ipd` + pupils | **all 10** (`src/ui/common/face-crops.json`) | — |
| Silhouette mask | **all 10** — the cut-out's own alpha | — |
| `eyeBox` row: lash top, lash bottom, cheek-sample, box radii | 0 | 10, ~10 min each, semi-automatable the way `tools/portraits/measure-face-crops.mjs` already probes faces |
| Closed-eye patch (inpainted) | 0 | 10 |
| "Pained" patch | 0 | 10 |
| "Determined" patch | 0 | 10 |

Three characters need rig work before they can use it at all, and this is the
part a stills-only review would have missed:

- **Wakka's eyes are 22° off level** (eyes at (355, 367) and (200, 430)) and
  Tidus's, Yuna's, Rikku's and Lulu's are rolled too. The lid sweep and the
  breathing axis must follow the **eye line**, not the screen horizontal. Yuna
  X-2's 3.4° is why the prototype gets away with a horizontal lid.
- **Auron and Kimahri show one eye** (near profile; `face-crops.json` says so in
  as many words). They need a one-eye variant of the rig, and their `ipd` is a
  framing value, not a real separation — so it cannot size their eye boxes.
- **Lulu's face is behind the near half of her hair.** Her sway mask must
  exclude the hair that crosses her face, or her face will ripple.

**[FFX-2 only]** If a dressphere change should change the pause portrait, that
multiplies Yuna's, Rikku's and Paine's sets by the number of spheres. The
`bodies` table in `face-crops.json` already carries per-sphere rows, so the data
exists — but this is a separate decision and is **out of scope** until asked.

---

## 5. How expression should follow the fight

Driven off battle state, one level of indirection so the engine keeps its
layering (rule 1 — `src/battle/**` never learns about portraits):

| Condition | Reads as | How |
|---|---|---|
| default | calm | resting lids, ~14 breaths/min, blink every 2.6–5.4 s |
| HP below ~25% | **pained** | pained patch; lids ~34% closed; ~22 breaths/min and shallower; desaturated, cooler grade; blink every 1.4–2.8 s |
| Overdrive ready or executing | **determined** | determined patch; lids ~16% closed; slower, deeper breathing; warmer grade; blinks less. Both engines carry an `overdrive` command kind (`src/battle/ffx2/execute.ts`, `triggers.ts`), so this is shared — but check `research/` before any label says "Overdrive" for FFX-2 |
| KO | **out** | closed-eye patch held, head tilted down, gaze control off, heavy desaturation |
| Sleep / Petrify / Silence etc. | later | leave the hook; do not guess the mapping — it comes from `research/` |

Transitions cross-fade over ~250 ms. The prototype's `E` key shows the body half
of this working today; the patches are what make it a change of *face*.

---

## 6. Performance budget

Measured, not estimated: `EXT_disjoint_timer_query_webgl2`, real GPU, 1440x810,
gaze held off-centre, 240 samples — **p50 0.036 ms, p95 0.058 ms, max
0.068 ms**. That is 0.35% of a 16.7 ms frame.

- Fragment cost scales with pixels: ~0.26 ms p50 at 3840x2160.
- Budget **1 ms** for the pause screen at 4K including four portraits at once,
  should a party row ever want them live.
- **Texture memory is the real constraint, not ALU.** One 832x1216 RGBA portrait
  is 4.0 MB uncompressed; ten are 40 MB; ten with three full-frame variants each
  would be 160 MB. This is the second reason to patch by region: the resident
  set becomes one portrait (4.0 MB) plus three patches (~1.5 MB).
- The pause screen is not the battle. It can afford this; the battle HUD should
  not adopt it without its own measurement.

## 7. Accessibility

- `prefers-reduced-motion` gives a **static** portrait: gaze snaps, no drift, no
  breathing, no sway, no blink, no motes. Verified in both modes.
- **Gaze control is decorative and must never gate progress.** Nothing in the
  pause screen may require moving it.
- Keyboard, mouse and gamepad parity from the start — verified with real key
  events, not scripted values.
- No flashing; the shimmer and motes are low-amplitude and slow.
- The on-screen legend is dismissible.

## 8. Downloads that need Bailey's yes (rule 11)

Recommended route needs **none**. If Bailey asks for route B:

```
Depth Anything V2 Small | https://huggingface.co/depth-anything/Depth-Anything-V2-Small/resolve/main/depth_anything_v2_vits.pth | 99.2 MB | Apache-2.0
```

Asked for and **recommended against**:

```
Depth Anything V2 Base/Large     | huggingface.co/depth-anything/Depth-Anything-V2-{Base,Large} | ~190 MB / ~640 MB | CC-BY-NC-4.0 — non-commercial, decline
LivePortrait weights             | huggingface.co/KwaiVGI/LivePortrait                          | ~500 MB (approx; motion_extractor alone is 107.3 MB) | MIT
InsightFace buffalo_l            | required by LivePortrait                                      | ~330 MB (approx) | NON-COMMERCIAL research only — this is the blocker
ComfyUI-LivePortraitKJ (node)    | github.com/kijai/ComfyUI-LivePortraitKJ                       | small | MIT
```

Sizes marked approx were not verified file-by-file; only the two exact figures
above were.

## 9. Open questions for Bailey

1. **Does the gaze feel right?** Open the prototype and hold an arrow key. Is
   ±11° of head turn with the eyes leading the amount you remember from Until
   Dawn — or should the head move less and the eyes more, or the camera drift
   instead?
2. **Is the faked blink good enough to ship while the inpainted variants are
   made**, or should blinking stay off until they exist?
3. **Do you want the 99.2 MB Apache-2.0 depth model** so hair and shoulders
   separate properly on the harder portraits (Lulu, Auron, Kimahri)?
4. **How big should the face be?** The prototype fills the frame. The Until Dawn
   screens are looser, but our paintings are close-ups.

## 10. If it is approved

1. Measure the ten `eyeBox` rows; extend `face-crops.json` and its guard test.
2. Port the shader into `src/ui/` behind the existing portrait helper; keep
   `src/battle/**` and `BattlePresenter*` clear of it (rule 1).
3. Rotate the lid and breathing axes to the measured eye line; add the one-eye
   path for Auron and Kimahri.
4. Inpaint the 30 patches with the installed Animagine model; review each
   against the approved hashes.
5. Wire the state table; `node tools/orphans.mjs` (rule 4).
6. `node tools/critic-plan.mjs` will call this deep — global layout and a new
   presentation system. Paper preflight first (rule 15).
