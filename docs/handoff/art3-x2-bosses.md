# Art round 3 — group `x2-bosses`

**Contract:** v3 (`docs/handoff/art3-contract.md`). Every battlefield subject is
turned toward its enemy; nothing in this group is left frontal.
**Subjects:** `ffx2-bahamut`, `vegnagun-tail`, `vegnagun-leg`, `vegnagun-body`,
`vegnagun-head`, `shuyin`, `lenne`, plus the `shuyin`, `lenne` and
`bahamut-fayth` portraits.
**Stack:** Animagine XL 4.0 Opt, 28 steps, CFG 6, euler_ancestral, rembg
`isnet-anime`, IP-Adapter for every non-idle state.

---

## 1. Facing

| Subject | `--facing` | Landed as asked? |
| --- | --- | --- |
| `ffx2-bahamut`, `vegnagun-*` | `left` | yes, every batch |
| `shuyin` | `left` | yes |
| `lenne` | `right` | **yes, first batch, unmirrored** |

The frame-left bias in the contract held: five enemy subjects wanted frame-left
and got it without a single `flip.py` call. The one subject in this group that
wanted frame-**right** is Lenne, and the contract's expectation ("party art
mostly has to be mirrored") did **not** hold for her — `idle.4` came back
angled to the right on its own. Worth knowing that the bias is a bias and not a
law; check before reaching for `flip.py`.

**No sprite in this group was mirrored.** Every `facing` in every sidecar is
what the image actually shows.

---

## 2. Idle picks

Idle first, four variants each, then every other state `--ref`'d at the pick.

| Subject | Pick | Seed | Canvas | Cutout | `baselineY` | Why |
| --- | --- | --- | --- | --- | --- | --- |
| `ffx2-bahamut` | `idle.4` | 1419433787 | 1024×1024 | 1024×1024 | 1008 | The only one of four with a clean cutout **and** the red wings intact under the violet tint |
| `vegnagun-tail` | `idleB.1` | 173578713 | 1216×832 | 1138×809 | 793 | Round B. Reads as a segmented tail, not a whole insect |
| `vegnagun-leg` | `idleC.3` | 106761230 | 832×1216 | 832×1216 | 1216 | Round C. One jointed limb with the three Nodes beside it |
| `vegnagun-body` | `idleC.1` | 842912481 | 1216×832 | 1216×832 | 819 | Round C. The organ-pipe cannon bank plus the violet core |
| `vegnagun-head` | `idle.3` | 60284559 | 1216×832 | 1126×809 | 793 | A horned machina skull with the cannon in its jaw — the clearest read in the whole group |
| `shuyin` | `idle.1` | 1120057307 | 832×1216 | 694×1136 | 1120 | The only variant that is both turned and closed-postured; the other three lost the costume |
| `lenne` | `idle.4` | 876137111 | 832×1216 | 724×1170 | 1154 | Facing right unaided, clean cutout, microphone and the asymmetric cascade both present |

`ffx2-bahamut` was referenced at the FFX `bahamut/idle.png` at **0.45**, as its
cast row asks — high enough to inherit the dragon, low enough that the black
palette does not arrive with it. `shuyin` was referenced at
`tidus/idle.png` at **0.45** for the same reason (the hood does not leak in at
that weight; the `hood, hooded vest, yellow vest` negatives carry the rest).

### The three Vegnagun rerolls, and what the shared tag block costs

`cast.json` gives all four Vegnagun parts the same trailing identity block —
`moth-like wings on a locust body, scalloped translucent moth wings, segmented
plating, brass hydraulics, …`. It is there so the four parts read as one
creature, and it works: they do. What it also does is render **the whole
creature every time**. Round A gave four near-identical winged brass moths for
the tail, the leg and the body; only the head, whose own tags are strong enough
to out-shout the block (`machina skull, huge cannon barrel in the mouth`),
came back as a part.

The fix is the `--emphasis` channel, which is the only place CLIP weights
survive escaping, plus trimming the shared block down to one folded wing:

```bash
# tail, round B — the pick
--tags "no humans, giant machine, mechanical tail only, segmented tail, segmented insect abdomen, armor plating, dull blue grey steel plating, glowing green energy conduit, glowing green seam, brass hydraulics, rivets, rust, cables, machina, colossal, ominous, one scalloped translucent moth wing folded flat against the plating"
--emphasis "(segmented mechanical tail:1.4), (glowing green conduit:1.2)"
--negAdd "…, insect head, mandibles, face, eyes, legs, whole insect, butterfly, moth, wings spread, ground, rocks, grass"
```

```bash
# leg, round C — the pick
--tags "no humans, giant machine, single colossal insect leg, locust leg, one leg, chitinous plating, dull blue grey plating, hard angular jointed knee, brass hydraulic piston, orange joint glow, clawed foot, three floating glass orbs, red orb, yellow orb, green orb, rivets, rust, cables, machina, colossal, ominous, isolated object"
--emphasis "(single giant insect leg:1.4), (white background:1.3)"
```

```bash
# body, round C — the pick
--tags "no humans, giant machine, colossal insect thorax, ribbed chest, two huge mechanical arms, row of organ pipe cannons, pipe organ, grated chest, glowing violet core behind the grating, purple light, dull blue grey plating, scalloped translucent moth wings folded, brass hydraulics, rivets, rust, cables, machina, colossal, ominous, isolated object"
--emphasis "(two mechanical arms:1.3), (organ pipe cannons:1.3), (violet core:1.2)"
```

Two findings worth carrying to whoever renders the rest of the machina:

1. **`from below` is incompatible with a cutout.** The leg's cast row asks for
   `from below, low angle` to sell the scale. Round B used it and all four
   variants came back as a full-bleed 832×1216 with the sky, a gantry and a
   floor baked in — `baselineY=1216` on every one, which is rembg telling you it
   found no edges. The low angle summons an environment, and the environment
   beats `white background` every time. Round C dropped the angle words, put
   `(white background:1.3)` in the emphasis channel instead, and the scale came
   from `colossal` plus the limb bleeding off the top of the frame. Same read,
   cuttable.
2. **The body's two arms never landed.** `(two mechanical arms:1.3)` got the
   organ pipes and the violet core but not the arms, across eight variants. The
   bible calls the arms the read that separates the body from the head; here the
   cannon bank is doing that work instead. Flagged rather than fixed — an
   `--img2img` pass off a rough two-armed sketch is the next lever, and it is
   exactly the case §3 added `--img2img` for.

---

## 3. Cutout QA

Every shipped PNG was checked for a white or dark alpha fringe, for opaque
background surviving the cutout, and for `baselineY` agreeing with the lowest
opaque row.

- **No halos anywhere.** Zero semi-transparent white-fringe or dark-fringe
  pixels on any file in the group.
- **`baselineY` matches the lowest opaque row** on every sprite (the sidecar
  value is the crop's bottom row; the checker reads one less because it is
  0-indexed).
- **No hanging-prop correction was needed.** Shuyin's sword is held low and
  behind, and his boots are still the lowest content — this is the case §5
  warns about and it happened not to bite. Worth re-checking if his idle is ever
  re-shot with the blade pointing down.
- Two files tripped a flat-white-region check and were cleared by hand:
  `shuyin/idle.png` (3.7% of opaque pixels near-white, 244 disconnected
  components — the blond hair highlights and the glowing blade) and
  `ffx2-bahamut/idle.png` (2.0%, 109 components — the pale wing membrane). Both
  are interior highlights, not leftover background. A single large flat
  component is the thing to reject on; scattered small ones are paint.

---

## 4. Portraits

`--composition portrait`, three-quarter face, **enemies angled left and allies
angled right** — `portrait-shuyin` `left`, `portrait-lenne` and
`portrait-bahamut-fayth` `right`.

> **This diverges from the contract on purpose and someone should rule on it.**
> `art3-contract.md` §1 and `cast.json` both put portraits at `facing: none`,
> on the reasoning that a HUD head-shot should meet the player's eye. This
> round's work order asked for three-quarter portraits turned the same way as
> the sprites. I followed the work order, and the old straight-on portraits for
> these three are gone. If the `none` rule is the one that stands, these three
> need re-shooting and nothing else in this group is affected.

Two `cast.json` portrait rows are **stale** and were overridden here rather
than used as written:

| Row | What it says | What was used |
| --- | --- | --- |
| `portrait-lenne` | `pink dress, feather trim` | The blue top, white ruffles, black arm ribbons and beaded earrings from the `lenne` sprite row. The `lenne` notes explicitly retract the pink dress; the portrait row was never updated to match |
| `portrait-shuyin` | `black and blue clothes, dark palette` | The sprite row's green jacket, yellow trim, blue armlet and red-and-black sleeves, so the menu face and the battle sprite are the same person |

`portrait-bahamut-fayth` has no `bahamut-fayth` sprite to reference, so it was
generated unreferenced, as its cast row's `ref` implies but cannot satisfy.

---

## 5. Notes for the next round

- **The GPU is shared.** Partway through this round another session started
  queueing on the same ComfyUI and per-image time went from **8 s to 105 s**,
  and three `ffx2-bahamut` states came back with no output at all before
  succeeding on a retry. This is the failure `art3-contract.md` §4 records as
  "pure black" renders. The runner used here waits for `/queue` to drain before
  each state and retries a state that produces no file; anything long enough to
  leave unattended wants that guard.
- **`--batch 1` writes straight to `<state>.png`**, not `<state>.1.png`. Handy
  for a one-off retry, surprising if you were expecting to pick from a batch.
- `cast.json`'s Vegnagun rows still carry the round-A tags. The winning prompts
  are in §2 above; the rows themselves were left alone so that another group's
  in-flight work does not shift under it.
