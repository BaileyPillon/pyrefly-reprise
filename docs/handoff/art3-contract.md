# Art contract v3 — characters face their enemy

**Status:** adopted 2026-09-17. Supersedes the v2 `straight-on` framing for
everything that appears on a battlefield.
**Owner of this round:** facing A/B + generator support.
**Read with:** `docs/ART-PIPELINE.md` §2a, `tools/gen/comfy.mjs`
(`FACING_PHRASES`), `tools/gen/cast.json` (`facing` per subject),
`tools/gen/flip.py`.

---

## 1. The contract

The party stands on the **left** of the battlefield, the enemy on the **right**.
So:

| Subject | `facing` | What the art shows |
| --- | --- | --- |
| Party, dresspheres, allies (Lenne) | `right` | body angled ~45° toward the RIGHT edge of the frame |
| Bosses, enemies, aeons | `left` | body angled ~45° toward the LEFT edge |
| Portraits | `none` | v2 `straight-on` — a HUD head-shot meets the player's eye |

A frontal face turned slightly toward the viewer is fine and wanted — the head
should stay readable. A flat 90° profile is **not** acceptable: it loses the
face, and the blind judge has to name the character unaided.

In practice:

```bash
node tools/gen/comfy.mjs character --name tidus --facing right ...   # default for `character`
node tools/gen/comfy.mjs boss      --name yunalesca-1 --facing left ...  # default for `boss`
```

`--facing` is a default of the preset, so a cast row that says nothing gets the
right one. `cast.json` now states it explicitly for all 70 battlefield subjects
anyway, because "the default happened to be right" is not something the next
person should have to rediscover.

---

## 2. What was tried

Every run below is Tidus `idle`, fixed seeds **424242 / 424243 / 424244**,
identity tags straight from `cast.json`, everything else at the house defaults.
Only the composition phrasing (and, from round 3, the negatives) changed.
Renders are in `docs/screenshots/art/v3ab/` as `tidus-<key>.<1..3>.png`.

"Turned" below means a body angle somewhere near 45°, which is the thing we are
buying. "Frontal" means the v2 problem, unchanged.

### Round 1 — the four phrasings in the brief, as written

Pose tags as they stand in `cast.json`, which include `looking at viewer`.

| Key | Phrasing | Result |
| --- | --- | --- |
| A | `three-quarter view, body facing right, looking to the side` | **3/3 frontal** |
| B | `facing right, from side, three-quarter view` | **3/3 frontal** (B.2 a few degrees, no more) |
| C | `turned to the right, dynamic angle` | **3/3 frontal**; C.3 also grew a colour swirl behind him, the `painterly` failure |
| D | `from side, looking at viewer, three-quarter` | **3/3 frontal** (D.3 marginal) |

Twelve renders, zero turned bodies. This is the important negative result: a
bare camera tag does not move a *named* character, because the checkpoint's
prior for "tidus" **is** his straight-on official art. Everything after this
round is about beating that prior rather than about finding nicer words.

### Round 2 — same idea, with the pose tags' own `looking at viewer` removed

Suspicion: the pose tags were fighting the phrasing. They were, a little, but
not enough to matter.

| Key | Phrasing | Result |
| --- | --- | --- |
| E | `from side, turning head, looking at viewer` | 3/3 frontal |
| F | `facing right, profile, head turned toward viewer, three-quarter view` | 2/3 frontal, 1 marginal |
| G | `three-quarter view, body turned to the right, looking at viewer` | 3/3 frontal |

### Round 3 — negatives, and emphasis weights

Added `--negAdd "facing viewer, front view, straight-on, symmetrical"`.

| Key | Phrasing | Result |
| --- | --- | --- |
| H | `from side, turning head, looking at viewer` (no weights) | 2/3 frontal — **the negatives alone are not the fix** |
| I | `(from side:1.4), (profile:1.1), three-quarter view, body facing right, head turned toward viewer` | **3/3 turned** — but 2 of 3 turned past profile into a back view, and I.3 summoned an ornate archway into the background |
| J | `(facing right:1.3), (from side:1.2), three-quarter view, looking at viewer` | **3/3 turned**, 1 back view |

So the emphasis weight is the lever. `(from side:1.3)` is what outvotes the
character prior; `three-quarter view` alone does nothing, but it keeps the
weighted `from side` from overshooting into a flat profile; `(profile:1.1)`
pushes the wrong way and is why row I gave back views.

### Round 4 — is the direction word doing anything at all?

Two runs, same three seeds, differing in **one word**, with
`from behind, facing away` added to the negatives:

| Key | Phrasing | Result |
| --- | --- | --- |
| K | `(from side:1.3), three-quarter view, body facing **right**, (looking at viewer:1.2)` | 3/3 turned, faces readable, **all three facing frame-LEFT** |
| L | `(from side:1.3), three-quarter view, body facing **left**, (looking at viewer:1.2)` | the same three images, pair by pair, **also facing frame-LEFT** |

`K.1` and `L.1` are the same picture down to the fold of the hood. **The
direction word is inert.** This is the known left/right blindness of the SDXL
text encoders, not a phrasing that can be tuned, and no amount of rewording
will fix it.

What the checkpoint *does* have is a bias, and the bias is **frame-left**.

### Round 5 — direction as an action instead of a camera word

| Key | Phrasing | Result |
| --- | --- | --- |
| M | K + `walking to the right, stepping to the right, leaning to the right` | turned, still frame-left, and the motion words bought a forward hunch plus one dutch tilt. Rejected. |

### The boss mirror check — Yunalesca form 1

`boss` preset, `--size 832x1216`, seeds 515151–515153, pose tags `looming,
menacing`, same negatives.

| Key | Phrasing | Result |
| --- | --- | --- |
| H | `from side, turning head, looking at viewer` (unweighted) | **2/3 turned**, both facing frame-left |
| I | weighted, `body facing left` | **3/3 turned**, facing frame-left; I.2 over-cropped into a bust, I.3 marginal |

Two things worth keeping:

1. The mirror phrase works for enemies — better than for the party, in fact,
   because the frame-left bias is already the direction enemies want.
2. **An unweighted phrase is enough for a weak prior.** The checkpoint knows
   "tidus" far better than "yunalesca", so there is less official art pulling
   her frontal. Expect obscure subjects to turn easily and headline characters
   to need the weight.

> Unrelated but flagged for whoever renders her: across all six variants her
> costume drifted to a full-length gown with covered shoulders. Canon Yunalesca
> is much more revealing, and the blind judge will feel that. Not fixed here —
> this round only changed the camera.

---

## 3. What was adopted

```js
// tools/gen/comfy.mjs
FACING_PHRASES = {
  right: '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.2)',
  left:  '(from side:1.3), three-quarter view, body facing left, (looking at viewer:1.2)',
  none:  'straight-on',
};
FACING_NEGATIVE = 'facing viewer, front view, straight-on, symmetrical, from behind, facing away';
```

Each piece earns its place:

- `(from side:1.3)` — the only token that turns the body. The weight is the
  whole trick; unweighted it did nothing in 21 renders.
- `three-quarter view` — inert alone, but it stops the weighted `from side`
  flattening into a profile.
- `(looking at viewer:1.2)` — keeps the face. Without it the body keeps
  rotating into a back view (round 3, row I).
- `body facing right` / `left` — **decorative**. Kept because it costs nothing
  and occasionally breaks a tie between two similar seeds, and because the
  prompt should still say what it wants. Do not trust it.
- The negatives are half the recipe and the generator now appends them
  automatically whenever `--facing` is not `none`. They are deliberately **not**
  applied to `--composition prone`: banning `facing viewer` on a figure already
  drawn `from side, eyes closed` rolls it face-down into the floor.

### The direction is fixed in post, not in the prompt

Because the bias is frame-left:

- **Enemies (`--facing left`) mostly land right first time.**
- **Party art (`--facing right`) mostly has to be mirrored.**

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/flip.py \
    public/art/characters/tidus/idle.png --set-facing right
```

`flip.py` mirrors the PNG and fixes the sidecar: `cropBox` is mirrored inside
the source canvas, `flipped: true` is recorded so it is obvious the seed no
longer reproduces the file, and `width`/`height`/`baselineY` are untouched —
a horizontal mirror moves no row, and `baselineY` is a row.

**Pass `--set-facing`.** The `facing` the generator writes into a sidecar is
what was *requested*; the whole reason this script exists is that the render
often ignores the request. Flipping the recorded value then moves it further
from the truth. Say what the mirrored image actually shows.

**Do not mirror a chiral subject.** Reroll instead:

| Subject | Why a mirror is wrong |
| --- | --- |
| Auron | coat worn off his **left** shoulder, empty sleeve hanging on that side |
| Kimahri | the broken horn is one specific horn |
| Anything with legible text or an asymmetric insignia | reads as nonsense mirrored |

Judging order changes with this round: **facing first, before costume.** A good
render pointing the wrong way is one command away from being right, and no
other defect in the list is.

---

## 4. `--ref` under the new facing

`--ref` is what keeps a character's later states looking like their approved
idle. Two questions: does an IP-Adapter pointed at a facing-right idle drag the
new pose frontal, and does it carry the facing across?

Test: `tidus attack`, seeds 606060/606061, `--facing right`, pose tags
`attacking, swinging sword, dynamic pose`, referenced at a mirrored round-4
keeper (`docs/screenshots/art/v3ab/tidus-idle-v3-right.png`, which is
`tidus-K.1` through `flip.py`). Renders are `tidus-REF2-<run>.<1,2>.png`.

| Run | Settings | Result |
| --- | --- | --- |
| default | `--refWeight 0.65 --refStart 0.25 --refEnd 0.85` | pose obeyed, identity carried (vest, hair, Brotherhood), **both variants came out facing frame-LEFT** |
| later/lighter | `--refWeight 0.5 --refStart 0.35 --refEnd 0.85` | indistinguishable in composition from the default run; facing frame-LEFT |
| early | `--refWeight 0.65 --refStart 0.0` | facing frame-LEFT as well, **and both variants grew a second sword**. The v2 warning about `--refStart 0` stands; do not use it to chase facing |

Two findings, and the second is the one that costs time if you miss it:

1. **The v2 defaults hold for what they were tuned for.** `--refStart 0.25`
   lets the pose prompt lay the figure out and the adapter still lands the face,
   hair and costume on top of it. Nothing about the facing phrase changes that.
   The lighter/later setting is the fallback if a particular subject's reference
   pulls its states frontal: raise `--refStart` to **0.35** first, and only then
   drop `--refWeight` to **0.5**. Do not go below `--refWeight 0.45`, where
   costume drift starts.
2. **`--ref` does not carry facing.** Six referenced renders, three settings,
   every one of them frame-left off a frame-right reference. This is the same
   frame-left bias as round 4, and it is not fixable from the adapter: facing is
   decided in the first steps of the denoise, which is exactly the window
   `--refStart` keeps the adapter out of, and moving the adapter into that
   window buys duplicated props rather than direction. **Judge and mirror every
   referenced state the same way you judge and mirror an idle.** Consistency and
   direction are two separate problems; `--ref` only solves the first.

Still worth doing: **mirror the idle before you reference it.** The reference
image contributes identity, and an idle that is already pointing the right way
means the sidecar, the reference and the intent all agree — you are only left
mirroring the output, not reasoning about two directions at once.

> **Judging note on the reference itself.** `tidus-idle-v3-right.png` is close
> to a flat 90 degree profile rather than the ~45 degrees the contract asks for.
> It was kept because the round-4 comparison needed a fixed anchor, not because
> it passes. When the roster re-render picks a real Tidus idle, prefer a variant
> with more of the chest toward camera; the weighted `(from side:1.3)` overshoots
> often enough that "turned" and "acceptable" have to be judged separately.

> **If a batch comes back pure black,** it is not the prompt. Four renders on
> 2026-09-17 15:19–15:22 (`tidus-REF-default.1.raw.png`,
> `tidus-REF-late.1.raw.png`, `probe-w0.3`, `probe-w0.65`) are all-black 5 KB
> files produced while another agent was rendering on the same GPU. They carry
> no finding and the table above is the re-run. Check `/queue` is empty before
> an A/B, and check the output is not black before you read anything into it.

---

## 5. Prone / KO

A downed figure keeps its orientation: head toward the enemy it lost to.

```js
PRONE_FACING_PHRASES = {
  right: 'head to the right, feet to the left',   // party
  left:  'head to the left, feet to the right',   // enemies
  none:  '',
};
```

The standing phrase is wrong twice over here — `body facing right` on a lying
figure summons someone lying on their back, and `looking at viewer` fights the
`eyes closed` already in the prone block. Same left/right caveat applies:
`flip.py` a prone render that lies the wrong way round.

---

## 6. What this round changed

- `tools/gen/comfy.mjs` — `FACING_PHRASES`, `PRONE_FACING_PHRASES`,
  `FACING_NEGATIVE`, `compositionFor()`, `defaultFacingFor()`, `--facing`,
  `--facingPhrase` (the A/B escape hatch), `facing` recorded in every sidecar.
  The composition constants lost their leading `straight-on`, which now comes
  from the facing table.
- `tools/gen/flip.py` — new. Mirror a sprite and fix its sidecar.
- `tools/gen/cast.json` — v3. `facing` on all 70 battlefield subjects,
  `facing` documented in `fields`, canon notes added for Seymour Flux, Kimahri
  and Auron, and a missing `rikku-dark-knight` subject added.
- `docs/ART-PIPELINE.md` — §2a, the facing contract.

**Not done here, and it is the whole point of the round:** the roster still has
to be re-rendered. Everything in `public/art/characters/` is v2 straight-on.
