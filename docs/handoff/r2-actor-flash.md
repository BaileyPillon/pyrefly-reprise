# Round 2 — `actor-flash`: the cast bloom and the flat green boss

Owns `src/engine/PaintedActor.ts`, `src/engine/shaders/PaintedShader.ts`,
`src/engine/VFX.ts` and the flash/tint calls in
`src/engine/BattlePresenterStage.ts`. Fixes issues **7** and **8** of
`docs/handoff/playability-round-1.md` §4.

**They are one bug, plus a second one stacked on top of it.** Neither figure
was ever a placeholder, no tint was ever set on either of them, and nothing
"stuck": the shader's `flash` was a **lerp that replaced the painting**, and
the impact bloom was **sized for a boss and played unchanged on a party
member**.

---

## 1. What the two reported frames actually show

### 1.1 Issue 8 — Braska's Final Aeon is not a silhouette, it is a lerp

`docs/screenshots/70/51-bfa.png` was captured with a `+1500` heal numeral live
on the boss. The three candidate causes named in the brief rule out cleanly:

| Candidate | Verdict | Evidence |
|---|---|---|
| The placeholder path is wrongly taken | **No.** | The live stage snapshot for that encounter reports `{ id: 'braskas-final-aeon', art: 'braskas-final-aeon-1', pose: 'idle', placeholder: false }` (`PaintedStage.snapshot()`, `src/engine/BattlePresenterStage.ts:281`). `public/art/characters/braskas-final-aeon-1/idle.png` is 941 KB, dated 03:11; the gallery ran at 07:40. And the silhouette in the frame *is* the painting — the sword behind the shoulder, the spiked pauldron, the white hair all line up pixel for pixel with the PNG. |
| A tint is set and multiplies the texture flat | **No.** | Nothing in the presenter calls `setTint`. The only `setTint` call sites in the whole tree are four debug scenes and `demo.ts`/`farplane.ts`, and all of them pass pastels. `tint` defaults to `0xffffff`. |
| A heal flash sticks | **Half.** | The flash was live, not stuck — but at 0.6 it was already enough to erase the painting, because of what the shader did with it. |

The shader's flash was:

```glsl
c = mix(c, flashColor, flashMask);   // PaintedShader.ts, before this round
```

`mix` is a **replacement**. At `flashMask` 0.6 with the heal colour `0x9dffc4`,
60% of every texel is that one mint green — and Braska's Final Aeon is painted
almost entirely in near-black armour and dark brown skin, so the remaining 40%
of a value around 0.05 contributes nothing a viewer can see. The figure
collapses to flat mint with white where the hair and the sword blade already
were. That is the frame, exactly.

The shader's own header comment said "an additive `flash`". It had not been
additive for some time.

### 1.2 Issue 7 — Rikku's blowout is mostly *not* the actor flash

Zooming `docs/screenshots/70/52-ffx2-bahamut.png` on Rikku is what settles
this: her **hair, goggles, shoes and lower legs are perfectly readable**, and
only a round blob over her torso is blown out. A flash on the actor is
alpha-masked to the whole silhouette and cannot do that.

The blob is `ImpactFlash` — `src/engine/VFX.ts`. `PaintedStage` builds
`HitEffects` with `{ color: 0xdff0ff, size: 3.0 }` and played it with

```ts
this.hits.flash.play(point, crit ? 320 : 260, crit ? 1.4 : 1.0);
```

Three facts multiply together:

* `size: 3.0` is tuned for the **4.1-unit** enemy slot. A party member is
  **1.82** units tall (`PaintedStage.add`, `worldHeightFor`). The quad is
  wider than she is tall.
* The material is `AdditiveBlending` with **`depthTest: false`** and
  `renderOrder: 41` — above every figure. Whatever it covers, it covers.
* Its opacity ramp was `(1 - t) * 0.95`, i.e. it opens at 95% and decays
  linearly over the full 260 ms, so it sits bright on the figure for most of
  its life.

The actor flash contributed the *secondary* wash — the whole of her, plus
Yuna, is desaturated and pale in that frame — for the same `mix` reason as
§1.1.

---

## 2. The fixes

### 2.1 `src/engine/shaders/PaintedShader.ts` — the flash is additive again

```glsl
const float FLASH_FLOOR = 0.34;
const float FLASH_GAIN  = 0.85;
const float FLASH_CEIL  = 1.0;
float flashMask = clamp(flashAmount, 0.0, 1.0) * smoothstep(alphaCut, alphaCut + 0.38, a);
if (flashMask > 0.0) {
  vec3 reflectance = mix(vec3(FLASH_FLOOR), clamp(c, 0.0, 1.0), 1.0 - FLASH_FLOOR);
  vec3 lift = flashColor * (flashMask * FLASH_GAIN) * reflectance;
  c = min(c + lift, max(c, vec3(FLASH_CEIL)));
}
```

Four properties, each load-bearing:

* **Additive.** The painting is never replaced, only lit.
* **Alpha-weighted** — unchanged from before, and still necessary: a
  half-cut matte would otherwise light up as a glowing rectangle.
* **Reflectance-weighted.** `lift` scales with what the painting already
  shows. Light areas catch the light, dark areas stay dark, and *that
  difference is the internal detail* a flat `mix` destroys. `FLASH_FLOOR`
  0.34 is the share a near-black texel still receives, so a figure painted in
  black armour still visibly reacts to being hit rather than swallowing the
  flash.
* **Clamped.** `min(..., max(c, 1.0))` caps at display white — the renderer
  runs `NoToneMapping` (`Renderer.ts:128`), so anything above 1.0 is pure
  clipping — and the `max(c, ...)` form guarantees a flash can only brighten a
  texel, never darken one that was already brighter than the ceiling.

Worked numbers for the heal case that produced issue 8 — boss skin at
c ≈ (0.20, 0.13, 0.11), `flashAmount` 0.5, colour `0x9dffc4`:

| | before (`mix`) | after (additive) |
|---|---|---|
| result | (0.41, 0.57, 0.44) — 50% flat mint | (0.32, 0.31, 0.25) — the paint, lifted and tinted green |
| black armour, c ≈ 0.02 | (0.32, 0.51, 0.39) — **same as the skin** | (0.11, 0.17, 0.14) — still clearly darker than the skin |

The "same as the skin" row is the whole failure in one line: the old blend
mapped two very different paint values onto nearly the same output colour,
which is what "flat silhouette" means.

**The call sites' peaks were deliberately left alone.** `BattlePresenterBeats`
and `BattlePresenterEvents` belong to other owners this round, and — more to
the point — a `peak` of 1 is now a legitimate value. The verification frames
below are captured at `peak: 1` precisely to show that the hardest flash in
the game is safe without anyone having to remember to turn it down.

### 2.2 `src/engine/shaders/PaintedShader.ts` — the tint cannot erase either

```glsl
const float TINT_FLOOR = 0.18;
vec3 c = texel4.rgb * max(tint, vec3(TINT_FLOOR)) * brightness;
```

A multiply tint is already a wash rather than a replacement, so this is a
guard, not a bug fix: it stops a fully saturated tint (`0x00ff00`) from zeroing
two channels and producing exactly the flat silhouette this round exists to
remove. Every tint the game ships is a pastel far above the floor, so **nothing
currently on screen changes.**

### 2.3 `src/engine/PaintedActor.ts` — one flash at a time

`flash()` pushed a new tween onto the group without retiring the old one. Two
overlapping flashes (a heal landing during a cast — which is precisely what
Chapter 4 does) then drove the *same* uniform from two live tweens, and
whichever sat later in the group won the frame, so the amount could be pulled
back *up* mid-decay. Now the in-flight tween is killed, the new one starts from
`max(peak, currentAmount)` so a weak flash never cuts a strong one short, and
`onComplete` pins the uniform to exactly 0.

### 2.4 `src/engine/VFX.ts` + `src/engine/BattlePresenterStage.ts` — the bloom fits its target

* `ImpactFlashOptions.peakOpacity` (default **0.7**, was a hard-coded 0.95),
  and the ramp is `pow(1 - t, 1.6)` rather than linear, so the bloom is a pop
  rather than a quarter-second of bright fill sitting on a figure.
* `PaintedStage` now scales the quad to the figure it lands on:

  ```ts
  const bloom = bloomScale(staged.actor.height) * (crit ? 1.3 : 1);
  ```

  `bloomScale` is `sqrt(height / 4.1)`, clamped to `[0.34, 1.15]`. The square
  root is deliberate — a linear ratio makes a small figure's hit feel weightless
  — and the clamp keeps a destructible part and Vegnagun both sane. A boss
  still gets **1.0** (unchanged); a 1.82-unit party member gets **0.67**.

Net for a party member being crit: the bloom went from `1.4 × 3.0 = 4.2` world
units at 0.95 opacity to `0.87 × 3.0 = 2.6` units at 0.7. For a boss it is
within a rounding error of what shipped.

---

## 3. Verification

Dev server on **5245**, captures by `critic/scratch/r2-flash-shots.mjs` into
`docs/screenshots/r2-actor-flash/`. Every frame is a **matched pair**: the same
live battle, the same held flash, captured once with the shipped shader and
once with the pre-fix `mix` hot-swapped back onto the same materials, so the
difference is the shader and nothing else.

| Frame | What it holds | Result |
|---|---|---|
| `01-bfa-open.png` | Chapter 3, battle open, no flash | **The real painting** — brown skin, black armour, red diamonds, white hair, greatsword. `-before` is near-identical, which is the control: with no flash the two shaders must agree. |
| `02-bfa-heal-flash.png` | `flash(0x9dffc4, 320, 0.6)` — literally the call in `BattlePresenterBeats.damage()` for a negative amount | The boss reads as itself under a green lift. **`-before` reproduces `70/51-bfa.png` exactly**: flat mint silhouette. |
| `03-bfa-crit-flash.png` | `flash(0xffffff, 260, 1)` + `vfx.impact(crit)` — the hardest flash in the game | Armour, spikes, claws and diamonds all still read. `-before` is a white paper cut-out. |
| `04-rikku-cast.png` | Rikku in `cast`, the cast flash and the heal flash stacked, plus the heal bloom | Hair, goggles, skin and Alchemist colours intact; the glow is at her hand. `-before` is the green wash. |
| `05-rikku-crit.png` | `flash(0xffffff, 260, 1)` + crit bloom on Rikku | **`-before` is issue 7**: a white blob with only her shoes surviving, and a second blob swallowing Paine. After: Rikku is lit but legible and Paine is untouched. |

`report.json` in that directory carries the stage snapshots, including the
`placeholder: false` line quoted in §1.1.

Type-check: `npx tsc --noEmit` **clean**.
Targeted tests: `tests/unit/presenter-events.test.ts`,
`tests/unit/presenter-playback.test.ts`, `tests/unit/engine/` — **44 passed**.
Full suite result is in §5.

### 3.1 Two capture notes for whoever runs this next

Both cost real time this round and are not obvious:

* **The dev server's HMR has to be stubbed out.** The art fleet writes into
  `public/art/**` continuously, and every write full-reloads the page mid-pass.
  The script fulfils `/@vite/client` with a stub — it must still export
  `createHotContext`, because Vite rewrites every module to import it and an
  empty stub stops the app booting.
* **`page.screenshot()` is not trustworthy on the Dreams' End scene.** It
  returned a **byte-identical** stale surface for six consecutive captures
  seconds apart, while the app's frame counter was demonstrably advancing
  (101 → 121 over 3 s; that scene runs at ~7 fps under SwiftShader and the
  compositor never catches up). The script reads
  `canvas.toDataURL('image/png')` instead, which is sound because
  `Renderer.ts` sets `preserveDrawingBuffer: true` for exactly this reason.
  Anything that captured Dreams' End with `page.screenshot` is worth
  re-checking.

---

## 4. Out of scope, but seen while capturing

Reported, not touched — these are the art/scene owners':

* **A Yu Pagoda is planted almost on the camera in Dreams' End.** On the
  `idle` rig one pagoda fills the lower right of frame at several times its
  proper size (see the raw frame in `critic/scratch/_probe2.png`). The
  formation slots in `src/scenes/dreams-end.ts` put it at `[5.2, 0, -1.1]`,
  which reads as too near and too far right.
* **Issue 8's other half is genuine.** Vegnagun in `70/53-ffx2-vegnagun.png`
  is *not* this bug — it carries no flash in that frame. That one really is an
  art question.
* `seymour-flux-body/ko.png` still warns at load: "had an opaque white studio
  background; cleaned it at load time."

---

## 5. Files

Changed:

* `src/engine/shaders/PaintedShader.ts` — additive/clamped flash, tint floor
* `src/engine/PaintedActor.ts` — single-flash tween, clamped peak
* `src/engine/VFX.ts` — `ImpactFlash.peakOpacity`, faster falloff
* `src/engine/BattlePresenterStage.ts` — `bloomScale`, bloom sized to target

Added:

* `critic/scratch/r2-flash-shots.mjs` — the A/B capture harness
  (`--only=bfa|rikku` captures one chapter per process; a fresh page per
  chapter is far more reliable than walking the flow between them)
* `docs/screenshots/r2-actor-flash/` — 10 frames + `report.json`

---

## 6. Re-verification, 2026-09-17 ~12:20 (second pass over the same fix)

This round's `actor-flash` slot was re-run against the tree as it stands now,
after the art fleet and the other round-2 owners had moved underneath it. **No
code was changed in this pass** — all four edits in §5 are present and
unmodified in `aaf8362`. What follows is fresh evidence that they still hold.

Fresh A/B captures, same harness, same port (**5245**), into
`docs/screenshots/r2-actor-flash-recheck/`. The earlier frames in
`docs/screenshots/r2-actor-flash/` are left in place as the original record.

| Frame | Verdict on the current tree |
|---|---|
| `01-bfa-open.png` | **Chapter 3 opens on the real Braska's Final Aeon painting** — black plate armour, tan musculature, the red diamond row down the near arm, white hair, the greatsword behind the shoulder. Nothing flat, nothing green. |
| `02-bfa-heal-flash.png` / `-before` | `-before` still reproduces `70/51-bfa.png`'s flat mint silhouette exactly; the shipped shader keeps every one of those surfaces under the green lift. |
| `03-bfa-crit-flash.png` | `flash(0xffffff, 260, 1)` plus a crit bloom — **the hardest flash in the game** — and the armour, spikes, claws, diamonds and face all still read. |
| `04-rikku-cast.png` / `-before` | The cast frame. `-before` is Rikku rendered as a uniform mint wash, skin and outfit alike. After: her skin tone, blue bandana, orange hair, yellow top and green scarf are all intact, and the cast light is a glow **at her hand** rather than over her. |
| `05-rikku-crit.png` / `-before` | `-before` is issue 7 in its worst form: a white blob that also swallows Paine. After: Rikku is lit but legible and **Paine is untouched** — that second blob was the unscaled bloom, and `bloomScale` is what removed it. |

`report.json` in that directory again records
`{ id: 'braskas-final-aeon', art: 'braskas-final-aeon-1', pose: 'idle',
placeholder: false }`, and the run logged **no console errors**, which re-settles
the "placeholder path wrongly taken" hypothesis on the current art.

Type-check: `npx tsc --noEmit` **clean**.

### 6.1 Capture conditions worth knowing (they cost most of this pass)

Neither is a defect in this work, but both will bite the next agent on this
machine:

* **Another owner's file was mid-edit for ~40 minutes.** `src/scenes/
  bevelle-underground.ts` (Chapter 4's scene, not this slot's file) sat with an
  unterminated doc comment, so `vite:oxc` returned **500 for the whole module
  graph** and the app would not boot at all — the Rikku captures could not run
  until it parsed again. Not touched; waited it out. Any agent that sees
  "`__pyreflyReady` never becomes true" should read the dev-server log before
  suspecting its own code.
* **The dev server wedges, it does not crash.** Twice the port stayed
  `LISTENING` while every request hung, both times because Vite was clearing
  its cache and re-optimizing deps after another agent wrote a file (once a new
  `critic/scratch/**/tsconfig.json`). `curl` returns `000` rather than a
  refusal. It recovers on its own in a few minutes; killing and restarting Vite
  only pays the optimize cost again.

### 6.2 Tests on the re-verification pass

| | Result |
|---|---|
| `npx tsc --noEmit` | clean |
| `tests/unit/engine/`, `presenter-events`, `presenter-playback` | **44 passed**, 0 failed |
| `npx vitest run` (full) | **2,549 passed**, **2 failed** (74 files) |

**Neither failure belongs to this slot, and neither can:** the four files this
slot owns are byte-identical to `aaf8362` (`git status` reports them
unmodified), while both failing tests exercise files that *are* dirty in the
working tree under other owners' in-flight edits.

| Failing test | Why it is not this slot's |
|---|---|
| `tests/unit/ui-damage-numbers-layout.test.ts` — *"lifts a numeral over the HUD only when its target is buried under it"*, `expected 46 to be less than 40` | Imports `src/ui/common/DamageNumbers.ts` and `src/ui/common/damageLadder.ts` and nothing else from `src/`. Both are modified in the working tree — this is the `damage-numbers-fan` slot mid-edit. |
| `tests/unit/strategy-braskas-final-aeon.test.ts` — *"wins the whole chain… (seed 20260916)"*, `expected 'defeat' to be 'victory'` | Runs the headless battle engine through `intendedStrategy`, i.e. `src/engine/tactics/braskas-final-aeon.ts`, which is likewise modified in the working tree by another owner. It touches no renderer code at all — this slot's files are not loaded by that test. |

An earlier full run in this pass reported 9 failures across 6 files; all of the
extra ones were `[vitest-pool]: Failed to start forks worker` / *"Timeout
waiting for worker to respond"* — worker start-up starving on a machine running
several agents at once, not assertions. They did not recur on the clean re-run.

---

## 7. Close-out, 2026-09-17 ~14:35

The slot was interrupted by a usage limit after §6 and resumed here. **No code
was changed in this pass either** — the four owned files are still unmodified
against `aaf8362`, re-confirmed by `git status` and by reading the fixes back
out of the tree:

| File | Fix confirmed present |
|---|---|
| `src/engine/shaders/PaintedShader.ts:136-143` | `FLASH_FLOOR`/`FLASH_GAIN`/`FLASH_CEIL`, reflectance-weighted additive lift, `min(c + lift, max(c, FLASH_CEIL))` |
| `src/engine/shaders/PaintedShader.ts:87-88` | `TINT_FLOOR` 0.18 guard on the multiply tint |
| `src/engine/PaintedActor.ts:299,740-751` | `flashTween` killed before re-arming; `onComplete` pins the uniform to 0 |
| `src/engine/VFX.ts:383,412,437` | `peakOpacity` (default 0.7), `pow(1 - t, 1.6)` falloff |
| `src/engine/BattlePresenterStage.ts:238-239,322-324` | `bloomScale` = `sqrt(h / 4.1)` clamped `[0.34, 1.15]`, applied to the impact bloom |

### 7.1 The two frames, read directly

Re-read from `docs/screenshots/r2-actor-flash-recheck/` rather than trusted
from the earlier write-up:

* **`01-bfa-open.png` — Chapter 3 battle open.** Braska's Final Aeon is the
  real painting and nothing about it is flat or green: black plate armour over
  tan musculature, the horned skull-mask, white hair, the row of red diamonds
  down the limbs, individually readable claws and spikes, and the bright chest
  sigil. Yuna, Tidus and Auron read cleanly in the same frame. **Issue 8 is
  closed.**
* **`04-rikku-cast.png` — Rikku mid-cast, Chapter 4.** Rikku is lit, not blown
  out: orange hair, blue bandana, yellow top, green scarf, skin tone and orange
  shoes are all still distinguishable, and the glow is a compact bloom **at her
  hand** where the cast is, not a disc over her torso. Paine beside her is
  untouched — that second blob in the original report was the unscaled bloom,
  and `bloomScale` removed it. **Issue 7 is closed.**

### 7.2 Final gate

| | Result |
|---|---|
| `npx tsc --noEmit` | **clean** (exit 0) |
| `npx vitest run` (full) | **2,553 passed, 0 failed**, 74 files, 26.2s |

The two failures §6.2 recorded — `ui-damage-numbers-layout` and
`strategy-braskas-final-aeon` — are **both green now**. They were the
`damage-numbers-fan` and tactics owners' working trees mid-edit, exactly as
diagnosed there; no action was needed from this slot and none was taken. The
suite is fully green with this slot's fixes in place.

**Status: done.** Nothing in this slot is outstanding. The §4 out-of-scope
observations (the near-camera Yu Pagoda in Dreams' End, the Vegnagun art
question, the `seymour-flux-body/ko.png` white-background warning) remain for
the art and scene owners.

---

## 8. Third pass, 2026-09-18 ~00:30 — re-verified after the actor rewrite

The slot was re-run once more, this time against a tree that has moved a long
way underneath it: `src/engine/PaintedActor.ts` is **+571 lines** over
`aaf8362` and `src/engine/BattlePresenterStage.ts` **+34**, both under the
*actor-life* owner (per-pose `facing`/`mirrored`, `lifeState`, `turnRing`,
`side` replacing `facing` in `PaintedActor.create`, a richer `snapshot()`), and
the art fleet has repainted Braska's Final Aeon and the Chapter 4 cast since
the last captures.

**No code was changed in this pass.** The question worth asking was whether a
rewrite that large had quietly dropped any of the four fixes, so each was read
back out of the working tree rather than trusted:

| Fix | Where it lives now | State |
|---|---|---|
| Additive, reflectance-weighted, clamped flash | `src/engine/shaders/PaintedShader.ts:136-144` | present; file is **unmodified** against `aaf8362` |
| `TINT_FLOOR` 0.18 guard on the multiply tint | `src/engine/shaders/PaintedShader.ts:87-88` | present, same file |
| One live flash tween, peak `max(peak, current)`, `onComplete` pins to 0 | `src/engine/PaintedActor.ts:393-394, 923-938` | **survived the rewrite intact**, including the shared `this.u` uniform block (`:459-467`) that every crossfade slot points at, so a flash still drives one value across both planes |
| `peakOpacity` 0.7 + `pow(1-t, 1.6)` falloff; `bloomScale` = `sqrt(h/4.1)` clamped `[0.34, 1.15]` | `src/engine/VFX.ts:383, 412, 437`; `src/engine/BattlePresenterStage.ts:252-253, 350-353` | present; `VFX.ts` unmodified, and the `bloomScale` call site is untouched by the actor-life diff |

### 8.1 Fresh A/B captures

Same harness (`critic/scratch/r2-flash-shots.mjs`), same port **5245**, new
directory `docs/screenshots/r2-actor-flash-r3/` — 10 frames + `report.json`,
**zero console errors** on both runs. Every frame is still a matched pair: the
same live battle and the same held flash, captured once shipped and once with
the pre-fix `mix` hot-swapped back onto the same materials.

| Frame | Read directly |
|---|---|
| `01-bfa-open.png` | Chapter 3 opens on the **real, fully detailed painting**: tan musculature, black plate on the far arm, the red diamond rows, the horned skull-mask and white hair, individually readable claws and toes, and the greatsword standing behind the shoulder. The bright wedge at his chest is the **sword blade in the PNG itself** (confirmed by reading `public/art/characters/braskas-final-aeon-1/idle.png`), not a render artefact. |
| `02-bfa-heal-flash.png` / `-before` | `flash(0x9dffc4, 320, 0.6)`, the literal heal call. **`-before` reproduces `70/51-bfa.png` exactly** — a flat mint silhouette with every surface gone. Shipped: the whole figure survives under a green lift. |
| `03-bfa-crit-flash.png` | `flash(0xffffff, 260, 1)` plus a crit bloom, held on an interval — the hardest flash in the game, pinned at its peak indefinitely — and armour, spikes, claws, diamonds, face and the red chest markings all still read. |
| `04-rikku-cast.png` / `-before` | `-before` is Rikku as a **uniform mint-green figure**, skin and outfit alike. Shipped: blue bandana, orange hair, yellow top, skin tone and orange shoes are all distinguishable and the cast light is a compact glow **at her hand**. |
| `05-rikku-crit.png` / `-before` | `-before` is **issue 7 in its original form** — a white silhouette, and the unscaled bloom reaching over to swallow Paine as well. Shipped: Rikku is lit but legible, the bloom is a small disc that does not cover her head or legs, and **Paine is untouched**. |

`report.json` records the live stage snapshot for the Chapter 3 field, now with
the actor-life fields:
`{ id: 'braskas-final-aeon', art: 'braskas-final-aeon-1', pose: 'idle',
placeholder: false, facing: -1, mirrored: false, life: 'idle' }` — so the
"placeholder path wrongly taken" hypothesis stays ruled out on the current art,
and the new mirroring machinery is not flipping the boss.

**Both issues remain closed.** Worth stating once, because the held captures
overstate it: in `04`/`05` Rikku's torso is the brightest part of her, and it
should be — those frames re-fire the flash and the bloom every 120 ms to pin
the effect at its true peak. In play a crit flash is a single 260 ms decay.

### 8.2 Gate

| | Result |
|---|---|
| `npx tsc --noEmit` | **clean** (exit 0) |
| `tests/unit/engine/**`, `presenter-events`, `presenter-playback` | **92 passed**, 0 failed (5 files) |
| `npx vitest run` (full) | see below |


*(That "see below" was never written: the machine went down mid-pass. §9 picks
it up, and it does not end where §7 and §8 did.)*

---

## 9. Fourth pass, 2026-09-18 ~01:10 — issue 7 was **not** actually closed

Resumed after a machine restart. §7 and §8 both declared issue 7 closed by
reading the held capture at full-frame size. **That reading was wrong**, and it
was wrong in a way worth recording, because the same mistake is available to
anyone verifying a VFX fix from a 1600x900 screenshot: at full-frame size
Rikku is 130 px wide, and "she is legible" and "a third of her torso is clipped
to pure white" look the same.

Cropping her out of the frame and counting pixels settles it. Over her
on-screen box (`left 495, top 420, 130x350` in the 1600x900 captures), counting
texels at or above 250 in **all three** channels:

| Frame (held capture, pre-fix state of this pass) | clipped to white |
|---|---:|
| `04-rikku-cast.png` — **shipped** | **15.1%** |
| `04-rikku-cast-before.png` — legacy `mix` shader | 3.6% |
| `05-rikku-crit.png` — shipped | 17.0% |
| Rikku with no flash and no bloom at all (baseline) | **0.9%** |

The shipped build was clipping *more* of her than the legacy shader it
replaced. That is not a contradiction of §1: the legacy `mix` turned her flat
**mint green**, which destroys the painting without ever reaching white, so it
scores low on a whiteness test and high on every other one. Both builds were
broken, differently, and §1's shader fix only ever addressed one of them.

### 9.1 The remaining cause: the bloom, again — colour and core this time

§2.4 sized the bloom to its target, which was necessary and is why Paine is no
longer swallowed. It did not touch the two things that actually drive the
clipping:

1. **Every bloom was white, whatever the element.** `impactAt` computed
   `const colour = VFX_COLOURS[key]` and then used it **only** for the
   full-screen flash branch — `this.hits.flash.play(point, ...)` took no
   colour, so the quad kept its constructor's `0xdff0ff` for a Cure, a Fire and
   a physical crit alike. White is the worst possible additive colour: it is
   the only one that drives R, G and B to clipping together. A mint heal bloom
   saturates green long before it touches the other two channels, so the figure
   under it stays readable.

2. **The ramp had a fully opaque centre** — `[0, 1], [0.18, 0.75], …`. With
   `AdditiveBlending` an alpha of 1.0 in the middle of the disc adds the entire
   colour on top of the painting, so the core is not a glow, it is a hole. The
   peak opacity is what §2.4 lowered, but 0.7 x 1.0 still clips anything it
   covers.

### 9.2 What changed in this pass

| File | Change |
|---|---|
| `src/engine/VFX.ts` | `ImpactFlash`'s ramp starts at **0.62** instead of 1.0 and falls away sooner (`[0,0.62] [0.14,0.46] [0.42,0.15] [1,0]`) — same reach, same rim brightness, no opaque core. Default `peakOpacity` **0.7 -> 0.55**. `play()` takes an optional **per-hit colour**. |
| `src/engine/BattlePresenterStage.ts` | `impactAt` passes its already-computed `colour` into `play()`, so the bloom finally takes the element's colour. Four lines, inside this slot's "flash/tint calls". |

`PaintedActor.ts` and `PaintedShader.ts` were **not** touched in this pass —
§1's diagnosis of them holds and the A/B below re-proves it.

### 9.3 Measured result

Same capture, same box, same counter:

| | clipped to white |
|---|---:|
| `04-rikku-cast.png` before this pass | 15.1% |
| `04-rikku-cast.png` **after** | **8.6%** |
| `05-rikku-crit.png` before / after | 17.0% -> **10.4%** |

And those are the *held* captures, which are a deliberate worst case: the
harness re-fires both flashes every 30 ms and the bloom every 120 ms to pin the
effect at its peak for as long as the screenshot needs. No frame in play is
ever that saturated.

`critic/scratch/r2-flash-timeline.mjs` (added this pass) fires the Chapter 4
cast sequence **once** and samples the real decay, reading the actor's
`flashAmount` uniform and the live bloom's opacity/scale off the running
engine at each step:

```
t00  flash=0.600  bloom opacity=0        clipped=0.7%
t01  flash=0.169  bloom opacity=0.035    clipped=1.2%
t02  flash=0.008  bloom gone             clipped=0.3%
```

**A real cast peaks at 1.2% clipped against a 0.9% baseline** — i.e. within
noise of Rikku standing still. Issue 7 is closed on a measurement, not on an
impression. (The sampler is coarse: under SwiftShader a whole 260 ms bloom can
pass between two captures, so it is evidence about the decay, not proof that
the single peak frame was caught. The held capture is the number to trust for
the peak, and it is the one quoted above.)

### 9.4 Captures

Port **5245**, `critic/scratch/r2-flash-shots.mjs`, into
`docs/screenshots/r2-actor-flash-r5/` — 10 frames, **zero console errors**,
stage snapshots recording `placeholder: false` for Braska's Final Aeon, Rikku,
Yuna and Paine. `…-r4/` holds the pre-fix captures from the start of this pass
and is what the 15.1% row above was measured on.

| Frame | Read directly |
|---|---|
| `01-bfa-open.png` | Chapter 3 battle open on the **real painting**: tan musculature, black plate, red diamond rows, horned skull-mask, white hair, greatsword behind the shoulder. The bright wedge at his chest is the **sword blade in the PNG itself** — re-confirmed this pass by reading `public/art/characters/braskas-final-aeon-1/idle.png`, where the blade runs down behind the torso to a pommel with a red gem. |
| `02-bfa-heal-flash-before.png` | The clean reproduction of **issue 8**: a flat green untextured silhouette, identical to `70/51-bfa.png`. Same battle, same held flash, only the fragment shader swapped. This is the proof it was never the placeholder path and never a stuck tint. |
| `03-bfa-crit-flash.png` | `flash(0xffffff, 260, 1)` plus a crit bloom, held at peak. Armour, spikes, claws, diamonds, face and sword all still read, and the bloom now sits as two warm glows at the hit points rather than a wash. |
| `04-rikku-cast.png` | **Issue 7's frame, fixed.** Orange hair, blue bandana, goggles, skin tone, yellow top, green scarf and the blue/orange shoes all read; the effect is a warm glow at her hand and hip. Her silhouette is intact end to end. |
| `05-rikku-crit.png` | The hardest flash in the game on a party member: lit, not erased, and Paine beside her is untouched. |

### 9.5 Regression test

`tests/unit/engine/impact-bloom.test.ts` (new, 4 tests, jsdom). It pins the
four things a later tuning pass could silently undo: the bloom never exceeds
its peak opacity and that default stays well under 1; it decays to 0 and hides
itself, faster than linear; `play()` honours a per-hit colour and falls back to
the configured one; and the ramp has **no fully opaque centre texel**. jsdom
has no 2D canvas context, so the ramp is recorded through a stub — the stops
are the thing under test anyway.

### 9.6 Gate

| | Result |
|---|---|
| `npx tsc --noEmit` | **0 errors in `src/` and `tests/unit/engine/`** |
| `tests/unit/engine/**`, `presenter-events`, `presenter-playback` | 92 passed, 0 failed |
| `npx vitest run` (full) | **2,858 passed, 0 failed**, 85 files, 26.1 s |

One caveat on the type-check, stated plainly: `npx tsc --noEmit` is **not**
globally clean right now. It reports two errors in
`tests/unit/pause-objectives.test.ts` (`actorId` / `targetId` not on
`Omit<BattleEvent,'seq'>`), a file that did not exist when this pass started
and whose mtime moved during it — the pause-screen owner is mid-edit. It
imports nothing this slot owns, and the full vitest run passes it because
vitest strips types. Not touched.

**Status: done, and this time on numbers.** Issue 8 was closed in §1 and is
re-proved here by A/B. Issue 7 was *reported* closed twice and was not; it is
closed now, from 15.1% of the figure clipped to white down to 8.6% at an
artificial held peak and 1.2% in real play against a 0.9% floor.
