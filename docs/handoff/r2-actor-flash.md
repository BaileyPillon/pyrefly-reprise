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
