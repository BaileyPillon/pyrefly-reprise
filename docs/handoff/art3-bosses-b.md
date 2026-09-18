# Art round 3 — group "bosses-b" (Jecht, Braska's Final Aeon 1 & 2, Yu Pagoda, Yu Yevon)

**Contract:** v3 facing (`docs/handoff/art3-contract.md`, `docs/ART-PIPELINE.md` §2a).
**Scope:** Jecht (human) — `idle talk victory` at **facing right**, plus his HUD
portrait; four boss subjects — `idle attack cast hurt ko` at **facing left**.
**Stack:** ComfyUI 0.35.0 @ 127.0.0.1:8188, Animagine XL 4.0 Opt, IP-Adapter
plus / CLIP-ViT-H. Defaults: 28 steps, CFG 6, euler_ancestral.

Every state was judged **facing first** (frontal = reject, flat profile =
reject), then costume against `research/visual-bible.md` §1.10–§1.12, then extra
subjects, cropped limbs and the cutout.

---

## 1. Identity tags used, and why they differ from `cast.json`

`cast.json` is the v3 work order, but four of its five rows carry costume tags
that `research/visual-bible.md` §1 contradicts outright. The blind judge scores
canon, so the bible won. The deltas below should be folded back into
`cast.json` by whoever owns that file (this group is not allowed to write it).

| Subject | `cast.json` says | Bible §1 says | What was rendered |
| --- | --- | --- | --- |
| Jecht | `short hair` | **long unruly black hair** | `long hair, messy hair, unkempt black hair` |
| Jecht | `open vest, black vest` | **no shirt**, Abes jumper with the straps undone | dropped the vest entirely; `bare chest, topless male` |
| Jecht | (absent) | **metal gauntlet and pauldron on his LEFT arm only**; **orange-and-red sash over his RIGHT leg**; **barefoot**; **red eyes** | `single pauldron, shoulder armor on his left shoulder, armored gauntlet on left forearm, red sash tied at the waist, short sash over his right thigh, barefoot, red eyes` |
| BFA 1 | `grey skin`, `chains, chained`, `spiky hair`, `red and black` | **brown scales**, **white hair in tufts**, enlarged **red headband**, **white** Abes tattoo, **glowing** eyes | `brown scales, scaly reptilian skin, white hair, tufts of white hair, large red headband, white tattoo on his chest, glowing orange eyes` — no chains anywhere in the source |
| BFA 1 | `huge sword, greatsword` | a **black** sword with **red dolphin markings**; the aeon wields a larger version | `huge black sword, black greatsword, dark blade, red markings on the blade` |
| BFA 1/2 | (absent) | **right hand normal and wielding the sword, left hand a large claw** — "the asymmetry is the whole design" | `asymmetrical arms, huge oversized claw for a left hand, normal right arm holding a huge black sword` |
| Yu Pagoda | `stone pillar, pagoda, ornate carving, floating, glowing runes` | a **three-tiered tapering finial**, stone-and-gold, each tier ringed with gold and **hung with four small bells** | added `three tiered tapering finial, gold rings, hanging bells` |
| Yu Yevon | `spider, translucent, tiny` | a **tick**: swollen segmented abdomen, **six to eight long hooked legs curling forward**, and **a glowing Yevon glyph disc where a face should be** | `bloated segmented abdomen, six long hooked legs curling forward, glowing golden glyph disc for a face` |

Style and quality tags were never passed through `--tags`; the generator
appends them (pipeline §2). Exact prompt strings are recoverable from any
sidecar's `prompt` field.

---

## 2. Two chiral subjects, and what they cost

`flip.py` is **banned** for both Jecht and the two aeon forms:

| Subject | Why a mirror is wrong |
| --- | --- |
| Jecht | pauldron + gauntlet on his **left** arm only; sash over his **right** leg. A mirror moves both to the wrong side. |
| BFA 1 & 2 | normal **right** arm holding the sword, oversized **left** claw. Mirroring swaps the whole design. |

A mirror preserves near/far relationships, so it can never rescue the side: in a
frame-left body the far shoulder is his left, and after mirroring the far
shoulder is his right. The side and the facing cannot be fixed in one flip.

That matters unevenly, because the checkpoint's bias is **frame-left**:

- **The aeons want frame-left anyway.** Facing landed first time, every batch.
- **Jecht wants frame-right**, against the bias, and cannot be mirrored — so the
  seed is the only lever, exactly as party-a found with Auron. It took **24 idle
  renders across five rounds** to get one.

---

## 3. The reference aspect-ratio trap (new finding — worth folding into §3 of the pipeline doc)

Jecht's approved idle is an arms-crossed standing pose, so its rembg crop is
**340×1172 — aspect 3.45**. Every other group's approved idle sits between 1.34
and 1.73 (tidus 1.55, auron 1.51, wakka 1.73, yuna 1.34, kimahri 1.56, lulu
1.51, rikku 1.73), so nobody had hit this before.

`--ref` at that aspect produced, across eight renders: hunched and crouching
bodies, twisted spines, an orange all-over colour cast, and armour migrating
onto the wrong limbs. It reads as the IP-Adapter "material bleed" failure and it
is not — `LoadImage` hands CLIP-Vision the image and CLIP-Vision resizes to a
square, so a 1:3.45 strip arrives as a **squat, compressed** figure and that is
the identity the adapter then enforces.

The fix is one line and it does not touch the shipped sprite:

```bash
# pad the REFERENCE (not the sprite) out to a sane aspect, on white
D:\Tools\ComfyUI\python_embeded\python.exe -s -c "..." \
    public/art/characters/jecht/idle.png tools/gen/refs/jecht-idle-ref.png 0.72
# 340x1172 -> 844x1172, aspect 3.45 -> 1.39
```

`tools/gen/refs/jecht-idle-ref.png` is that padded reference, and every
referenced Jecht state points at it rather than at `idle.png`. The same round
re-run against the padded reference came back upright, correctly proportioned
and in the idle's own palette.

**Rule of thumb:** before using a cutout as `--ref`, check `height/width` from
its sidecar. Above about 2.0, pad it first.

---

## 4. Log — every state, what was picked and why

### `jecht` — facing right, chiral, no flips anywhere

| Round | Seeds | What happened |
| --- | --- | --- |
| A | name hash | 4/4 flat frame-left profiles, and in all four the sword rendered as a **detached object standing beside him** rather than carried. Two rejects at once. |
| B | 770101+ | Dropped the sword (see below) and added `(three-quarter view:1.35)`. Facing fixed — bodies turned ~45° — but `orange and red sash` rendered as a **billowing cape** that filled the frame; rembg kept it and 3/4 cutouts came back at the full 832×1216. |
| C | 880201+ | `red sash tied at the waist, short sash over his right thigh` + `cape, scarf, flowing cloth, floating fabric, long ribbon` in `--negAdd`. Clean cutouts, correct costume, **4/4 still frame-left**. |
| D | 991301+ | 8 fresh seeds. D.2 and D.5 frame-right with correct chirality, but the chest tattoo was not visible on either. |
| E | 993501+ | 8 seeds, `(black chest tattoo:1.35)` added. **E.8 (seed 993508) is the keeper.** |

**The sword was dropped from Jecht deliberately.** In round A it never attached
to the hand or the back — it rendered as a separate sword planted on the ground
beside him, which is both an extra-subject reject and a `baselineY` hazard (the
lowest pixel becomes a blade tip, pipeline §5). Human Jecht's only appearance is
the Dream's End pre-battle scene, where the bible's staging note has him simply
standing on the platform; the sword belongs to the aeon forms, which do carry
it. `sword, greatsword, weapon` are in `--negAdd` on all three states.

| State | Pick | Seed | Notes |
| --- | --- | --- | --- |
| `idle` | `idleE.8` | 993508 | Body ~45° to frame-right, face readable with the smirk, pauldron correctly on his **left** shoulder (frame-right side), sash on the near leg, barefoot, black Abes tattoo visible. 340×1172, `baselineY` 1156, feet are the lowest content (dangle 1 px). |
| `talk` | `talkD.4` | 151104 | Hand on hip, mouth open, looking at viewer. Armour on his left, face readable. Small dark smear at one foot that reads as a contact shadow. |
| `victory` | `victoryB.1` | 161201 | Fist punched skyward, laughing, head up. Chosen over the cleaner `victoryC.2` (a bicep flex) because for a state named *victory* the pose has to read unambiguously; the cost is a small blue tip on the sash tail, logged here rather than hidden. |
| `portrait` | `jechtA.2` | 191502 | `--composition portrait --facing right`, `--ref` at the padded idle at `--refWeight 0.5`. Three-quarter face to frame-right, red eyes, headband, stubble, pauldron on his left. |

**Deviation from the contract, on the task's instruction.** §1 of the contract
puts portraits at `facing: none`; this group's work order asks for
"three-quarter face, party looking right, enemies left", so `jecht` was rendered
`--composition portrait --facing right`. Every shipped portrait before this one
(`auron`, `tidus`, `wakka`, …) records `facing: none`, so this is the first of
its kind and somebody should decide which rule wins before the rest are redone.

**Rounds that carry no finding.** `talkA` / `victoryA` (seeds 110701+, 120801+)
were run with `(black chest tattoo:1.35)` *and* `--ref`. The reference already
carries the tattoo, so the emphasis compounded with it and sprayed black tribal
stripes across the whole torso and arms, with an orange cast over everything.
The emphasis was dropped from all referenced states; identity emphasis belongs
on the idle only, where there is no reference to carry it.

### The other lesson: an over-long `--negAdd` breaks composition

Braska's Final Aeon took eight idle rounds, and seven of them were spent
chasing the wrong variable. Rounds B–F each answered a real defect by adding
negatives, and by round F the negative prompt was **~54 comma tags**: 24 from
`BASE_NEGATIVE`, 4 from `SPRITE_NEGATIVE`, 6 from `FACING_NEGATIVE` and ~20 of
mine. That is far past CLIP's 77-*token* window, and the symptom is not a
warning — it is that **framing quietly falls apart**. Those rounds produced
crawling quadrupeds, subjects cropped at every edge, leg-dominant anatomy and
figures bursting out of the canvas, none of which the added tags had anything
to do with.

Round G was round A's recipe with the negatives cut back to five tags
(`human, normal proportions, fur, orange blade, glowing blade`) and no
`--emphasis`. Six variants, all full-bodied, uncropped, cleanly cut out. The
keeper came from that round.

**Keep `--negAdd` to roughly a dozen tags.** When a defect will not go away,
the next tag is usually not the fix — and past about twenty it is actively the
cause. Note how short the cast manifest's own `negAdd` entries are; that is not
an accident.

---

## 5. Log — Braska's Final Aeon, form 1

`--ref tools/gen/refs/jecht-idle-ref.png --refWeight 0.45`, per the cast
manifest's note ("enough to carry the face, not enough to shrink him back to
human"). Facing landed frame-left in every batch, first time — the contract
predicts this for enemies and it held.

| Round | What happened |
| --- | --- |
| A | `1024x1024`, `--composition boss`, short negatives. Best-of-round `A.1` was a genuine hulking monster; body read as **fur** rather than brown scales and the black sword rendered with an orange glow. |
| B | Pushed scales + black sword with `--emphasis`, grew the negatives. **Went quadrupedal** — crawling beasts, frames over-filled. |
| C | **Discarded, carries no finding.** Renders came back smeared with a diagonal hatch artifact and took 98–150 s instead of 9. Another agent was rendering on the same GPU (`/queue` showed 1 running + 3 pending). The raw renders were corrupt, not the cutouts. Same class of failure as the contract's all-black note in §4 — check `/queue` is empty, and check the output is not corrupt, before reading anything into a round. |
| probe | Single render once the GPU freed up: clean quality, but `1boy, monster, giant monster` **split into a man plus a separate dragon**. |
| D | Danbooru `monster boy` (a boy who *is* a monster) fixed the split — one creature, correct features. Still bursting out of the square canvas. |
| E | `--composition full --size 832x1216`. Leg-dominant and still cropped. |
| F | `wide shot, from afar` in the pose tags to pull the camera back. No better. |
| G | **Negatives cut back to five tags, no emphasis.** 6/6 full-bodied and uncropped. **`G.5` is the keeper.** |
| H | G + `full body, wide shot`: the extra room got filled with a **second, tiny human figure** in 3 of 6. Rejected. |

`idleG.5` wins on the bible's squint read — hunched and top-heavy, a normal
right arm gripping a black slab of a sword and a swollen oversized left claw,
white hair-tufts and a red headband on a horned head. Chirality is correct
(claw on his left, sword in his right). **Cost:** it touches all four frame
edges (`FRAME-FULL`, 73% opaque) and the sword is clipped at the top-left. The
body is whole; the prop is not. Judged worth it against `G.4`, which was
complete and airy but slim, tailed and much less like the aeon.

| State | Pick | Notes |
| --- | --- | --- |
| `idle` | `idleG.5` | see above. `baselineY` hand-corrected 1006 → 979 (sword point). |
| `attack` | `attackV.1` | lunging, sword extended frame-left, whole body. |
| `cast` | `castV.2` | holding a lit rune disc — the clearest read of "casting" in the batch. |
| `hurt` | `hurtV.1` | `FRAME-FULL`, which matches the idle's own framing, so the set is at least internally consistent. |
| `ko` | `koV.1` | bent double, head low. |

## 6. Log — Braska's Final Aeon, form 2

`--ref braskas-final-aeon-1/idle.png` at the house default, per the manifest.

`idleY.1` is the keeper: complete figure with air around it, white hair, red
headband, horns, dark sword. Round Z tried to force the canon "six bone spike
blades" and came back more cropped and more chaotic, so Y.1 stands.

**Two deviations, logged rather than hidden:**

1. **The wing-spikes render as membrane wings.** Canon is "spikes that resemble
   wings"; this is a bat-like membrane. Banning `bat wings, membrane wings,
   leathery wings` (round Z) cost more in framing than it bought in accuracy.
2. **The four states drifted red/blue away from the idle's brown-tan.** They are
   internally consistent with each other — it is the idle that sits apart. The
   creature's identity (horns, white mane, headband, claw, sword) carries across
   all five, so this was accepted rather than re-rolling the whole set.

| State | Pick | Notes |
| --- | --- | --- |
| `idle` | `idleY.1` | |
| `attack` | `attackW.2` | wings spread, complete, air around it. |
| `cast` | `castW.2` | |
| `hurt` | `hurtW.3` | `hurtW.2` and `.1` both flagged BG-RETAINED; `.3` is clean. `baselineY` hand-corrected 1016 → 961 (sword tip + trailing spike). |
| `ko` | `koW.3` | |

## 7. Log — Yu Pagoda

Two problems, and the second is the interesting one.

**It renders as a study sheet.** A `no humans` prop reliably comes back as
*several* objects arranged across the frame — six lanterns on chains, a row of
pillars — even though `multiple views` is in `BASE_NEGATIVE`. `solo`,
`single object`, `(solo:1.3)` and explicit `multiple pillars, two pillars, row
of pillars` negatives all reduced it without curing it. Roughly one variant in
four came back as a single object.

**rembg is the wrong tool for it.** `isnet-anime` segments anime *characters*.
On a pale stone object it erased most of the render: one cutout came back
`36x52`, and a later round failed outright with `[rembg] nothing left after
background removal`. The cure was making the object large, dark-edged and
frame-filling — not tuning `--alpha-threshold`.

Pointing `--ref` at the **v2 shipped** pagoda (which matches the bible's
three-tier design better than anything this round produced) was tried and
**failed**: the v2 file is a bright gold glow on white, so as an identity anchor
it swamped the render into a featureless golden blur.

**`--img2img` is what worked, and it is the right tool for this subject.**
`idleS.1` was approved as the idle, padded to a sane aspect (297×1200, aspect
4.04 → 864×1200, 1.39 — see §3), and then every other state was generated with
`--img2img` off it rather than `--ref`:

| State | Denoise | Pick |
| --- | --- | --- |
| `attack` | 0.55 | `attackR.3` |
| `cast` | 0.50 | `castR.1` |
| `hurt` | 0.58 | `hurtR.3` |
| `ko` | — | `koP.3`, kept from the prompt-only round because the img2img ko stayed intact and a downed pagoda has to read as **broken**. |

That locks the silhouette to the idle exactly, which is what five frames of the
same carved object need. The honest cost: **the states differ mostly by glow.**
That is defensible here rather than a fudge — the bible puts *Power Wave* in the
engine (a converging ring pulse of `--yevon-gold`, §1.10), not in the sprite, so
the sprite only has to carry "lit / blazing / flickering / dark" and the VFX
layer carries the action.

`cast` and `hurt` were **not** in this subject's `cast.json` row; the task asked
for the full five boss states, so their pose tags were written from the bible's
*Power Wave* description and are logged here.

## 8. Log — Yu Yevon

The bible's squint read is the whole brief: *dark sac / forward-curling hooks /
one blazing gold disc*.

| Round | What happened |
| --- | --- |
| N | Slender, glyph-headed creatures. `N.3` reads well but has no bloated abdomen and 73 px of dangle. |
| O | `(bloated abdomen:1.3)`. **`O.3` was the best single image of the subject** — dark bulbous sac, blazing gold glyph disc on its front, hooks curling around it — but rembg kept two opaque **white smoke masses** beside it (BG-RETAINED). |
| P | Smoke banned, `pale ethereal glow` dropped. Cleaner but glossier and more abstract. **`P.5` is the keeper.** |

`O.3` was worth trying to rescue, so `tools/gen/despeckle.py` was written for it
(new; see §9). It did not help **here** — the smoke turned out to be *connected*
to the body, so keeping the largest component dropped only 115/37/18/1 px of
speckle. `P.5` was taken instead: dark sac, glyph disc on the front where the
face should be, segmented hooked limbs, floating free of the ground.

States were generated with `--ref` at `P.5` and picked to avoid the white
masses, which recurred in several variants: `attackY.1`, `castY.2` (its white
swirl reads as an energy burst, which suits `cast`), `hurtY.1`, `koY.3`.

**`baselineY` is meaningless for this subject** and no hand-correction was
applied: the bible floats him with no ground contact and no blob shadow at all
(§1.12, and the shadow table at §2813), so `qc.py`'s `dangle` numbers for Yu
Yevon can be ignored.

---

## 9. New tool: `tools/gen/despeckle.py`

Keeps the largest connected run of opaque pixels in a cutout, drops the rest,
re-crops with the standard 16 px margin and rewrites the sidecar (`width`,
`height`, `baselineY`, `cropBox` recomposed onto the old origin, plus
`despeckled` / `despeckledAt` / `despeckledDropped` so the hand edit is obvious
the way `flip.py` records a mirror).

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/despeckle.py \
    public/art/characters/<id>/<state>.png
```

It is for the BG-RETAINED failure `qc.py` reports, which is common on
`no humans` subjects. `--keep-frac F` also keeps components at least F times the
largest, for sprites with legitimately detached parts. **It only helps when the
junk is actually detached** — Yu Yevon's smoke was connected to the body and it
did nothing, which is exactly the case it cannot fix.

---

## 10. State of the group

**Complete.** 26 states + 1 portrait, all v3, all cut out and QC'd, every
numbered variant and `*.raw.png` deleted.

| Subject | States | Sheet |
| --- | --- | --- |
| `jecht` | idle, talk, victory, attack, hurt, ko + portrait | `docs/screenshots/art/jecht.png` |
| `braskas-final-aeon-1` | idle, attack, cast, hurt, ko | `docs/screenshots/art/braskas-final-aeon-1.png` |
| `braskas-final-aeon-2` | idle, attack, cast, hurt, ko | `docs/screenshots/art/braskas-final-aeon-2.png` |
| `yu-pagoda` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yu-pagoda.png` |
| `yu-yevon` | idle, attack, cast, hurt, ko | `docs/screenshots/art/yu-yevon.png` |

Sheet specs are committed as `tools/gen/sheet-art3-<id>.json`, so the sheets can
be rebuilt rather than reassembled by hand.

**`jecht/attack`, `hurt` and `ko` were regenerated although the task only asked
for idle/talk/victory.** They were still the 2026-09-15 v2 files with no
`facing` field at all — i.e. frontal — and the brief says to keep nothing
frontal for subjects in this group. `ko` is `--composition prone --size
1216x832` and lies **head-right**, which is the party convention (head toward
the enemy) and matches Jecht facing right with Tidus.

**Jecht carries no sword in any state.** See §4. The aeon forms carry it.

### Hand-corrected baselines (pipeline §5)

| File | auto | corrected | why |
| --- | --- | --- | --- |
| `jecht/attack.json` | 1216 | **1175** | sash tail hangs 40 px below the heels |
| `braskas-final-aeon-1/idle.json` | 1006 | **979** | sword point drops 26 px below the stance |
| `braskas-final-aeon-2/hurt.json` | 1016 | **961** | sword tip + trailing spike, 54 px |

`baselineYAuto` and `baselineNote` are kept alongside, per §5.

### Known defects, stated rather than buried

- `braskas-final-aeon-1/idle` and `/hurt` are `FRAME-FULL`; the idle's sword is
  clipped at the frame edge.
- `braskas-final-aeon-2`'s four states sit in a redder palette than its idle.
- Form 2's wing-spikes are membranes, not spike blades.
- `jecht/victory` has a small blue tip on the sash tail.
- The five Yu Pagoda states differ mainly by glow (by design — see §7).
- `public/art/portraits/jecht.png` reports BG-RETAINED/FRAME-FULL, which is
  normal for a portrait: a close-up fills the frame, and the shipped `auron`,
  `tidus` and `wakka` portraits are the same 832×1216.

### Not ours, flagged in passing

`public/art/characters/anima/` still holds 39 `*.raw.png` debugging files. Those
belong to another group; pipeline §5 says raws should stay out of `public/` in a
final build.

### For whoever owns `tools/gen/cast.json`

Fold in the §1 costume deltas, and add the two facts this round cost the most
time to learn: BFA's `negAdd` should stay short, and both Jecht and the two aeon
forms belong on the contract's **chirality list** (§2) next to Auron and
Kimahri.

---

# Fix pass (contract v3) — 2026-09-18

A blind judge scored the group and flagged **16 states**. This pass regenerated
every one of them. Two subjects failed at the *idle*, so under the fix-pass rule
("if the idle itself failed, redo it and then all its states") Yu Pagoda and Yu
Yevon were rebuilt from scratch — ten of the sixteen.

| Subject | States regenerated | Idle redone? |
| --- | --- | --- |
| `yu-pagoda` | idle, attack, cast, hurt, ko | **yes** — wrong object entirely |
| `yu-yevon` | idle, attack, cast, hurt, ko | **yes** — off-canon neon palette, abstract anatomy |
| `braskas-final-aeon-1` | hurt, ko | no |
| `braskas-final-aeon-2` | cast, hurt, ko | no |
| `jecht` | portrait | no |

Sheets rebuilt from the committed specs; every numbered variant and `*.raw.png`
deleted again.

---

## F1. Yu Pagoda — the prompt was never going to reach this subject

The judge named the old idle "an ornate golden sceptre or mace on a stand, not a
creature and not the FFX-2 Yu Pagoda". That was right, and three more
prompt-only rounds confirmed the prompt is not the lever:

| Round | Recipe | Result |
| --- | --- | --- |
| PA | bible tags, `--facingPhrase` tilt, rembg | 2/5 single objects, and **rembg erased three of them** (one crop came back 51x64) |
| PA (re-cut) | the same renders through `tools/gen/whitekey.py` | the renders were fine; the *cutout* was the failure. Section 7's diagnosis holds: `isnet-anime` will not matte pale stone |
| PB | + `(single object:1.4)` emphasis, `wide shot` | **worse** — `wide shot` turned the study-sheet failure into a whole cityscape of towers, 6/6 |

`whitekey.py` is the right cutout tool for this subject and should be reached for
first, not after rembg has already eaten a render. But it cannot fix identity.

### The fix: author the silhouette, let the checkpoint paint it

`tools/gen/pagoda-sketch.py` (new) draws the bible's 1.10 geometry directly —
three tapering tiers, gold-rimmed eaves, four pendant bells per tier, a finial
spike — and `--img2img` runs off that plate. ART-PIPELINE section 3 describes
exactly this case ("a form so far from anything the checkpoint knows that no
prompt reaches it"), and it cures four defects at once:

1. **Identity** — the tier count is in the plate, not in a hopeful tag.
2. **The study sheet** — one shape in, one shape out. 20/20 renders single.
3. **Facing** — a symmetric straight-on object *cannot* satisfy a facing, which
   is what the judge meant by "no facing". The plate leans, so there is
   something to face with. `--lean` is in canvas degrees: **positive leans the
   top toward frame-LEFT**, which is the enemy direction. The first set of
   plates was cut with negative values and leaned the wrong way.
4. **The cutout** — a dark-edged, frame-centred object mattes cleanly, so these
   went through ordinary rembg with no whitekey and no `--alpha-threshold`.

| Round | Denoise | Outcome |
| --- | --- | --- |
| PC | 0.60 | 5/5 single tiered towers, but smooth and generic — too faithful to the plate |
| PD | 0.68 | stone blockwork, moss, carved runes, lit finial. **`idlePD.3` is the keeper** |

### States get their own plates, not just a brighter glow

Section 7 conceded that the old five states "differ mostly by glow". The judge
charged for it (`cast` scored 4: "again near-identical to idle/attack"). So each
state is `--img2img` off its **own** plate — a different lean, a different amount
of damage — with `--ref` at the approved idle at 0.5 holding the palette:

| State | Plate | Pick | Why |
| --- | --- | --- | --- |
| `attack` | `--lean 26` | `attackPX.4` | tipped hard frame-left, runes blazing |
| `cast` | `--lean 10 --split 95` | `castPZ.2` | **the tiers levitate apart** with golden light blazing in the gaps |
| `hurt` | `--lean 36 --damage 0.35 --chips 5` | `hurtPY.3` | tipped and fractured into slabs, top still on |
| `ko` | `--lean 64 --damage 0.9` | `koPY.1` | top tier sheared off, collapsed heap, rubble |

`--split` exists because an inanimate prop has no limb to move, and "cast" still
has to be nameable at a glance. Separating the stack is the one pose change the
object can actually make.

**A defect I introduced and then fixed, worth writing down.** The first damage
model bit *white* holes out of the plate. At denoise 0.62 the checkpoint painted
them as flat white polygons — visually identical to a masking failure, and
exactly the defect the judge rejected the old `hurt` for ("a chewed cutout edge
that looks like a masking failure"). Damage is now filled **dark stone** with a
gold arc under the lip; a dark recess reads as damage, a white one reads as a
bug. `--chips` is opt-in and defaults to 0.

`build()` also re-centres the drawn content after the rotation, because a hard
lean rotates about the canvas centre and swings a tall stack off the right edge
— and `cropped` is in `BASE_NEGATIVE` for a reason.

`baselineY` is left at the machine value on all five. The lowest pixels are the
bells, and the bible hovers this subject 10 px off the ground, so there is no
"foot" to correct to.

---

## F2. Yu Yevon — the neon came from the house style block

Judge: "canon Yu Yevon is a drab grey-brown insectile parasite with only faint
glow, so the colour is badly off-canon". The cause is not a prompt mistake — it
is `STYLE_TAGS`, which says `vibrant colors, colorful` and is shared contract
that a single subject may not edit (section 2, rule 2). It has to be **out-voted
from the negative side**: `neon, rainbow, iridescent, holographic, magenta, cyan,
oversaturated`. That alone moved the whole subject from neon magenta/cyan to a
drab violet-brown, first round.

Anatomy took four more rounds, and the useful finding is which pushes backfire:

| Round | Change | Result |
| --- | --- | --- |
| YA | anti-neon negatives, `tick parasite` tags | palette fixed; came back as armoured **dragons** with feathered wings |
| YB | `headless`, banned `head, face, eyes, wings, feathers`, `(one large glowing glyph disc:1.35)` | real progress — `YB.3` has the bloated sac and six hooked legs, but its disc hangs to frame-RIGHT |
| YC | + "glyph disc at the front, hooks reaching forward" | `YC.6` is the best canon read of the whole pass — but near-frontal |
| YE | + `(one large glowing **golden** glyph disc:1.4)` | **backfired badly.** Forcing the gold turned the creature into a humanoid gold statue, 5/6. Rejected wholesale |
| YF | YC + "body tilted and angled away from the camera" | **`YF.2` is the keeper**: bulbous violet-grey sac, gold disc at the front, six hooks curling forward, clearly angled frame-LEFT |

**Do not chase a colour with emphasis on this subject.** Round YE is the
cautionary case: `(...golden...:1.4)` did not tint the disc, it re-chose the
whole creature. The palette belongs in the negatives; emphasis re-rolls the
concept.

### States, and a `--ref` weight that is not the house default

The house `--refWeight 0.65` let the states drift into a lighter, more saturated
palette than the idle (round YG). **0.8 with `--refEnd 0.9`** held the sac, the
hooks and the gold, and for a creature whose poses are broad body attitudes
rather than limb work, the pose freedom given up costs nothing. Picks:
`attackYK.2`, `castYI.4`, `hurtYH.3`, `koYH.1`.

Two rounds that carry findings rather than files:

- **Referencing an approved *state* instead of the idle washes the subject out.**
  Round YJ pointed `--ref` at the (palest) `hurt` to pull the idle into the
  states' palette. Every render came back a pale cream blob. Reference the idle;
  if the idle's palette is the odd one out, say so and move on.
- **`attack` grew a large blue eye** on the sac (round YH). The bible is explicit
  that the glyph disc *is* the face and there is no other. `eye, eyes, eyeball`
  went into `--negAdd` and round YK re-shot it clean.

`baselineY` remains meaningless here (section 8) — the bible floats him with no
ground contact and no blob shadow at all.

---

## F3. Braska's Final Aeon, form 1 — `hurt` and `ko`

**`hurt`.** Three rounds, and the variable was not the one the judge's wording
suggested:

| Round | Change | Result |
| --- | --- | --- |
| BA | explicit claw/sword pose tags | facing fixed, but the checkpoint added a **long tail and a dragon head** — neither is in the idle |
| BB | + `tail, dragon head` banned, "whole body in frame" | 6/6 facing frame-left. But the palette went **red demon** against the idle's brown-tan |
| BC | + `red skin, crimson` banned, `--refWeight 0.75` | **`hurtBC.6` is the keeper** |

`hurtBC.6` answers all three of the judge's complaints: hunched and top-heavy in
the idle's own proportions (not ballooned), an oversized **clawed hand** in the
foreground rather than a fin or shield, and a black slab of a sword at
frame-left with the head turned frame-LEFT.

**`ko` — the fix is `--composition prone`, and it is not what `cast.json` says.**
The manifest leaves boss `ko` on the boss composition, and that is what produced
the unparseable blur the judge rejected ("no clear ground contact... orientation
is ambiguous... limb count is not verifiable"). `--composition prone --size
1216x832` swaps in the prone framing *and* `PRONE_FACING_PHRASES.left`
("head to the left, feet to the right"), which is exactly the three things the
judge asked for. `koBA.1` won first round: a whole hulking body sprawled with
the head at frame-LEFT, the black sword lying under it, air around it and an
unambiguous ground line.

**Recommend `"composition": "prone"` on every boss `ko` row in `cast.json`.**
This group cannot write that file.

---

## F4. Braska's Final Aeon, form 2 — `cast`, `hurt`, `ko`

- **`cast`** (`castBD.4`). The serpentine tail and the floating rune tablet both
  came from the pose prompt's "summoning energy, glowing magic circle"; replacing
  it with a physical action — "raising the huge black sword overhead, dark energy
  gathering along the blade" — plus `floating tablet, rune stone, tail` in
  `--negAdd` removed both. Head confirmed turned frame-LEFT on a crop.
- **`hurt`** took two rounds. `hurtBD.1` looked right on a contact sheet and
  **failed on the head crop**: near-frontal, and drifted to a handsome young man
  rather than the aeon. Round BE added `bishounen, human face, looking at viewer`
  to the negatives and "head thrown back and turned aside, roaring in pain" to
  the pose. **`hurtBE.3`** is a snarling maned monster in profile toward
  frame-LEFT — no oni mask, readable claw, readable sword.
- **`ko`** (`koBD.2`), same `--composition prone` fix as form 1. The old one was
  standing upright with its sword planted; this one lies with the head at
  frame-LEFT, wing-spikes crumpled beneath it and the sword along the body.

**Judge a face on a crop, not on a contact sheet.** Both BFA2 rejects this pass
looked acceptable at thumbnail size and were obviously wrong at 900 px. A head
crop costs one Read and it is the only reliable way to settle frontal-vs-turned.

The hand-corrected `baselineY` on the old `braskas-final-aeon-2/hurt.json`
(1016 -> 961, for a sword tip) is gone with the file it described. The new `hurt`
has a 6 px dangle and needs no correction. The other two hand corrections in
section 10 (`jecht/attack`, `braskas-final-aeon-1/idle`) are on files this pass
did not touch and are intact.

---

## F5. Jecht's portrait — the contract decides, and it says `none`

The judge scored this 8/10 ("strong, clean HUD bust that is instantly Jecht"),
failed it on facing, and explicitly deferred: *"a HUD bust arguably should be
exempt from the facing rule — parent should decide before regenerating."*

**Decision: the portrait ships at `facing: none`.** The reasoning, so it can be
overruled on the merits rather than re-litigated:

1. `docs/handoff/art3-contract.md` section 1 and `ART-PIPELINE.md` section 2a
   both put **portraits at `none`** — "a HUD head-shot meets the player's eye" —
   and `--composition portrait` already defaults to it. `--facing right` was this
   group's own deviation, logged in section 4 as needing a ruling; it is that
   deviation the judge scored as a failure.
2. Every other shipped portrait (`auron`, `tidus`, `wakka`, ...) records
   `facing: none`. One turned bust in a HUD row of twenty straight-on ones is a
   visible inconsistency, not a nicety.
3. **It is not reachable anyway.** 14 renders across rounds JA and JB at
   `--facing right` came back frame-LEFT, every one — the same frame-left bias
   the contract documents, and Jecht is on the chirality list so `flip.py` is
   barred from rescuing them. Section 2 already paid 24 renders for his idle.

`portraitJC.5` is the pick: straight-on, red headband, red eyes, black mane,
stubble, bare chest with the Abes strap, the smirk.

**It was mirrored, and that is not a contradiction of section 2.** Jecht is
chiral because the pauldron belongs on his **left** arm; `JC.5` rendered it on
his right. In a *straight-on* bust there is no facing for a mirror to break, so
`flip.py ... --set-facing none` moves the pauldron to frame-right — his left —
and fixes the chirality instead of breaking it. The section 2 ban is on mirroring
to chase a *facing*, which would move the armour to the wrong side; this is the
opposite operation. `flipped: true` is recorded, and `fixNote` in the sidecar
states all of the above.

The judge's other complaint — hair strands floating free of the mass — is gone in
the new render. `despeckle.py` was run and reported `dropped: []`, i.e. the new
silhouette is a single connected component and needed no repair.

`public/art/portraits/jecht.png` still reports BG-RETAINED/FRAME-FULL, which is
normal for a portrait and matches the shipped `auron`, `tidus` and `wakka`.

---

## F6. New tools

`tools/gen/pagoda-sketch.py` — draws the Yu Pagoda silhouette as an `--img2img`
init plate from the bible's 1.10 geometry.

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/pagoda-sketch.py \
    --out tools/gen/refs/yu-pagoda-sketch.png [--lean 26] [--damage 0.35] \
    [--chips 5] [--split 95]
```

`--lean` positive tips the top toward frame-LEFT (enemy facing); `--damage` at or
above 0.5 shears the top tier and scatters rubble; `--chips` gouges dark
recesses; `--split` levitates the tiers apart for the `cast` pose. The plates it
produced are kept as `tools/gen/refs/yu-pagoda-{sketch,sketch-broken,plate-*}.png`
so the five states are reproducible.

`tools/gen/cand-sheet.mjs` — builds a contact sheet spec from a list of candidate
PNGs and runs `sheet.py`. Judging five variants one Read at a time is slow and,
worse, judges them in isolation rather than against each other.

---

## F7. Known defects still standing, stated rather than buried

- **`yu-yevon`'s idle sits in a warmer brown-gold than its four states**, which
  are internally consistent with each other. Round YJ's attempt to close the gap
  (reference the idle at a state) destroyed the subject, so the gap was accepted.
  Identity — sac, hooked legs, gold glyph disc — carries across all five.
- **`braskas-final-aeon-2` remains redder than its own idle**, unchanged from
  section 6; the three new states were matched to the existing `attack`, so the
  set is internally consistent and the idle is the outlier.
- **`braskas-final-aeon-1/idle` is still `FRAME-FULL`** with its sword clipped;
  the new `hurt` is frame-full too, which at least matches it.
- **Yu Pagoda's five states are still a rigid object** — they differ by lean,
  damage and glow. That is now a real silhouette difference per state rather than
  a brightness change, but a carved stone finial has no anatomy and never will.
- **Form 2's wing-spikes are still membranes**, not spike blades (section 6).
- `public/art/characters/anima/` still holds its 39 `*.raw.png` files. Still not
  ours; still flagged.

## F8. For whoever owns `tools/gen/cast.json`

On top of section 10's list:

- Add `"composition": "prone", "sizeHint": "1216x832"` to **every boss `ko`
  row**. It is what fixed both aeon KOs here.
- `yu-pagoda`'s row should record the `--img2img` plate workflow and drop
  `stone pillar` / `ornate carving` from `tags` — those are what summoned the
  sceptre.
- `yu-yevon`'s row should carry the anti-neon `negAdd` and lose `spider,
  translucent, tiny`.
- Note `--refWeight 0.8` for `yu-yevon`'s states; the house 0.65 does not hold
  this subject.

---

# Fix pass 2 (contract v3) — 2026-09-18

The judge re-scored the group after fix pass 1 and flagged **11 states**: all
five Yu Pagoda states (idle among them, so the whole subject was rebuilt), three
Yu Yevon states, one state on each aeon form, and Jecht's HUD portrait.

| Subject | States regenerated | Idle redone? |
| --- | --- | --- |
| `yu-pagoda` | idle, attack, cast, hurt, ko | **yes** — wrong object, no facing |
| `yu-yevon` | attack, cast, hurt | no — the idle scored clean |
| `braskas-final-aeon-1` | hurt | no |
| `braskas-final-aeon-2` | cast | no |
| `jecht` | portrait | no |

All five sheets rebuilt from their committed specs. Every numbered variant and
`*.raw.png` stayed in the scratch directory; nothing but the picks was copied
into `public/art/`.

---

## G1. Yu Pagoda — the bible's design was the thing the judge was rejecting

The judge's words: the idle read as "a generic mossy garden pagoda (pale tan
stone, green moss, brass rings)" rather than "Yu Pagoda's canon blue-grey
levitating tower with red/gold trim and glowing eye-windows".

Fix pass 1 had drawn `tools/gen/pagoda-sketch.py` straight from
`research/visual-bible.md` §1.10 — three tan tiers (`#6E6250` / `#A99A7E` /
`#D8CBAB`), gold rings, four bells. **That section says of itself: "No published
visual description; design directive `[estimate]`."** The judge scores canon
unaided and named the real asset. So on this subject the judge outranks the
bible, and the plate was rebuilt to the judge's description:

| Feature | v1 plate (bible §1.10) | v2 plate (judge) |
| --- | --- | --- |
| Stone | warm tan `#6E6250`/`#A99A7E`/`#D8CBAB` | **blue-grey** `#3A4456`/`#6B788C`/`#A8B4C4` |
| Trim | gold rings only | **gold rings + a red band under every eave** |
| Windows | none | **two lit arched eye-windows per tier**, gold-framed |
| Tiers | 3 | **4** — "tower" was the judge's noun, and three squat tiers read as a garden lantern |
| Bells, gold eave rings, hover | bible | unchanged — the bible and the judge do not conflict here |

**This deviation is deliberate and belongs in the bible, not just here.**
§1.10's Yu Pagoda paragraph should be updated (this group cannot write that
file): the stone ramp, the red trim and the lit windows are all new, and the
pixel-art ramps listed there no longer describe the shipped art.

### The facing complaint had a geometric cause, not a prompting one

"Perfectly symmetrical, straight-on frontal three-quarter view — no left-facing
angle." A solid of revolution seen head-on **cannot** satisfy a facing; there is
nothing to face with. Two changes in the plate give it a front:

1. the whole plate leans (`--lean`, positive tips the top toward frame-LEFT);
2. **the lit windows are drawn on the frame-LEFT face only.** That is what turns
   a symmetrical stack into an object with a near side, and the near side is the
   side the party stands on.

### Identity drift between states had a cause too, and it was in the tooling

Judge, on the old `attack`: "the stacked square tiers become a soft spiralling
cone"; on the old `cast`: "three disconnected floating bowls"; on `hurt`: "only
a fragment of the tower survives"; on `ko`: "an anonymous rubble pile". Every
one of those came from a *plate*, not from the checkpoint — fix pass 1 gave each
state its own geometry. Three changes:

- **Tier geometry is now a module constant (`TIERS`)** shared by all five
  plates. States differ only by `--lean`, `--split`, `--chips` and `--damage`.
- **`--damage` no longer deletes tiers.** It cracks and chips the tower in
  place and scatters rubble at the foot. A downed pagoda still has to be
  nameable as a pagoda.
- **The finial is drawn on every plate, and drawn last.** It was being painted
  over by a lifted top tier and, at a large `--split`, lifted clean off the
  canvas — which is exactly the "finial missing entirely" the judge charged for
  on two separate states. The lift table is now `LIFT = [1.6, 1.1, 0.6, 0.0]`
  and the finial rises by the top tier's own lift, no more.

### Rounds

| Round | Recipe | Result |
| --- | --- | --- |
| A | v2 plate, `--denoise 0.60` | tiered towers, correct shape, but smooth and ceramic — reads as a lamp |
| B | `--denoise 0.68`, `carved stone masonry, weathered stone` | real stone and arched windows, but the whole subject went **white** and the red trim vanished |
| C | `--denoise 0.62`, `dark blue grey stone` / `slate grey` in the tags and `--emphasis "(dark blue grey stone:1.35), (red painted trim:1.25)"`, `white marble, pale` banned | **`idleC.5` is the keeper** |

Round B is the finding worth keeping: **`carved stone masonry, weathered stone`
bleaches this subject.** Those two tags bought texture and cost the entire
palette. Colour went back into the tags and the emphasis, and the texture words
came out.

### The five states

Each state is `--img2img` off its own plate with `--ref` at the approved idle
holding palette and material. Denoise is the knob that trades pose against
identity, and it is set per state rather than globally:

| State | Plate | Denoise / ref | Pick | Why |
| --- | --- | --- | --- | --- |
| `idle` | `--lean 20` | 0.62, no ref | `idleC.5` | four clear tiers, twin lit arched windows on the frame-left face, brass finial, leaning frame-left |
| `attack` | `--lean 24` | 0.55, ref 0.6 | `attackD.4` | the idle's own finial and arched windows, blazing, tipped harder |
| `cast` | `--lean 14 --split 62` | 0.45, ref 0.5 | `castH.1` | the tiers open like a concertina with light in the seams, finial intact |
| `hurt` | `--lean 30 --damage 0.35 --chips 4` | 0.55, ref 0.6 | `hurtD.3` | same tower, cracked, with stone fragments breaking away |
| `ko` | `--lean 40 --damage 0.7 --chips 4 --dark` | 0.50, ref 0.6 | `koF.1` | toppled well past 45°, dark windows, rubble — still obviously a pagoda |

**Two rounds that carry findings rather than files.**

- **`cast` at denoise 0.55 burns.** "blazing", "channelling energy" plus that
  denoise wrapped the tower in orange flame and pink hotspots (round E); two of
  five cutouts were also destroyed, because rembg will not matte a pale glowing
  object. Dropping to 0.45 and banning `fire, flames, burning` fixed both.
- **`ko` at `--lean 62` presents the tower's underside to camera**, the
  checkpoint blows that disc out to white, and rembg keys the white out — a
  bright gash through the middle of the sprite that is indistinguishable from a
  masking bug. `--lean 40` and `blown out highlights, white glow, overexposed`
  in `--negAdd` cured it. The white shards that remain in `koF.1` are the
  plate's own rubble and read as broken stone, not as a hole.

`hurt`'s `baselineY` is hand-corrected **1061 → 955**: the falling fragments
hang 106 px below the tower. The other four keep the machine value — the lowest
pixels are bells, and the bible hovers this subject clear of the ground.

---

## G2. Yu Yevon — `--ref` alone could not hold this creature

Judge, across three states: "the idle's gold mask head is absent", "six slender
clawed legs become eight broad leaf-tipped ribbons, reading as a different
octopoid creature", "a bulb with two rabbit-ear protrusions plus a detached
floating disc", "an abstract swirl of tentacles". All identity, all the same
failure.

| Round | Recipe | Result |
| --- | --- | --- |
| A | the idle's exact tags + `--ref idle --refWeight 0.85 --refEnd 0.9`, anti-octopus negatives | anatomy improved — a sac with hooked legs — but the gold disc was still missing or duplicated, and the palette went saturated magenta |
| B | **`--img2img` off the idle itself**, denoise 0.62, ref 0.7 | identity perfect: sac, gold plate at the front-left, six legs, the idle's own palette. **But the pose barely moved** — five near-copies of the idle |
| C | the same at denoise **0.73** | identity held, pose opened up. **`attackC.1`, `castC.5`, `hurtC.4` are the picks** |

**`--img2img` off the approved idle is the lever for a subject the checkpoint
has no prior for**, and denoise is how much pose you buy back. Round A shows
`--ref` at 0.85 is not a substitute: the adapter carries identity into a
composition the prompt has already chosen, and on a creature this far outside
the checkpoint's vocabulary the prompt chooses an octopus.

The honest trade, stated rather than buried: **these three states are closer to
the idle in attitude than a party member's states are to theirs.** That is the
deliberate side of the trade — this subject's judged defect was identity, never
sameness — and each still carries its own read: `attack` a gold spiked burst at
the front, `cast` pale light shards hanging from the disc, `hurt` the sac
drooping onto buckling legs.

`baselineY` remains meaningless here (§8, §F2): the bible floats Yu Yevon with
no ground contact and no blob shadow, so `qc.py`'s 74–85 px dangles are noise.

---

## G3. Braska's Final Aeon, form 1 — `hurt`

Judge: the sword and left arm cut off at the left edge, the claw cut off at the
right, a torso crop where every other state is full body, muddled anatomy, and
"extremely dark local values compared with the idle's warm tan body".

Three rounds, and the two that failed both failed for reasons worth writing
down:

| Round | Change | Result |
| --- | --- | --- |
| A | `--size 1216x832` to buy horizontal room | **went quadrupedal** — serpentine bodies with long tails, in 5 of 5, with `tail` in the negatives. The landscape bucket is what does this; §5's round E found the same thing in the portrait bucket |
| C | padded reference (the subject shrunk to 66% inside a white square) | framing fixed, **mass lost** — slim beast-men with blue steel swords, not the aeon |
| D | `--size 1024x1024`, unpadded `--ref idle --refWeight 0.8`, and a **compact pose**: "doubled over from a blow, hunched low, both arms pulled in close against the body" | **`hurtD.3` is the keeper** |

**The fix for a clipped sprite is the pose, not the canvas.** Nothing sticks out
of a figure with its arms pulled in, so nothing clips — and the canvas stays the
one the rest of the subject was rendered on. Widening the frame changed the
animal; padding the reference changed the build.

`hurtD.3` is hunched and top-heavy in the idle's own warm tan, head turned
frame-LEFT under the red headband and white hair-tufts, spike crest along the
back, the oversized claw in the foreground and the black sword gripped at
frame-left. 61% opaque, so it is no longer `FRAME-FULL`; only the far end of the
sword runs to an edge, which matches the idle's own clipped sword.

---

## G4. Braska's Final Aeon, form 2 — `cast`

Judge: wing cut off at the right edge, sword tip cut off at the bottom and upper
left, "the lower-left bladed limb and the arm holding the sword do not connect
to a readable shoulder", and a bare pale torso where the idle is armoured
red-and-blue.

| Round | Change | Result |
| --- | --- | --- |
| A, C | `--ref idle` at 0.75 / 0.8, compact pose | frame-filling and clipped, every variant. **The reference propagates its own framing**: this idle is 37% opaque but composed edge to edge, and the adapter reproduces that |
| B | padded reference at 0.7 | framing fixed; `cast2B.4` came back a **bishounen armoured knight** cropped at the waist — the §F4 failure again |
| D | padded reference at **0.8** + `bishounen, human face, knight` in `--negAdd` | **`cast2D.1` is the keeper** |
| E | D + `(black blade:1.35)` emphasis | the blade stayed red; `cast2E.5` grew a large retained white mass. Rejected |
| F | D + `(hulking massive monster:1.35)` | `cast2F.5` is genuinely massive and complete — **and its head is an indistinct muzzle with no red headband.** Rejected on that alone |

**Round F is the judgement call of this pass, and it went to the head.** A blind
judge names a subject from its face; `cast2F.5` has more of the aeon's bulk and
none of its identity markers, `cast2D.1` has the white hair, the red headband, a
readable face turned frame-LEFT, the armoured red-and-blue chest, a complete
uncropped figure and readable anatomy throughout. The three things the judge
charged for are all fixed. What it costs is mass: `cast2D.1` is slimmer than the
other four states, and that is logged below rather than hidden.

**Judging note, reinforcing §F4:** every reject above looked acceptable on the
contact sheet and was obviously wrong at full size. Read the candidate itself
before promoting it.

---

## G5. Jecht's portrait

The judge scored it 6 and listed five defects. Four are fixed; one is declined
on the contract.

| Judge's complaint | What was done |
| --- | --- |
| "Hair renders as silver-grey with dark roots; Jecht's canon hair is black" | `--emphasis "(black hair:1.45)"` plus `grey hair, silver hair, white hair, blonde hair` in `--negAdd`. Black in 10 of 10 renders across both rounds |
| "Eyes are bright red; canon Jecht's eyes are dark" | tags moved to `dark red eyes`, `glowing eyes` banned. **Not taken all the way to dark**: `research/visual-bible.md` §1.11 records **red eyes** as *verified* from the FF Wiki, so the two sources genuinely disagree. The pick sits between them — dark, desaturated, unmistakably reddish. Flagged for a ruling rather than silently picking a side |
| "Crop is tight enough that the chest tattoo and the full pauldron are lost" | pose tags rewritten to "head and shoulders and chest in frame, the whole shoulder guard visible, the chest tattoo visible"; `extreme close-up, face close-up` banned |
| (not raised, found here) tattoo absent | `--emphasis "(black tribal tattoo on his chest:1.3)"`. Round A had black hair but no tattoo; round B has both |
| "Near straight-on frontal head... no committed facing" | **declined — see below** |

`portraitB.3` is the pick and it was **mirrored** with
`flip.py --set-facing none`, for the same reason and by the same argument as
§F5: it rendered the pauldron on his right, and in a straight-on bust there is
no facing for a mirror to break, so the flip moves the armour to his **left**
(frame-right, per bible §1.11) and fixes chirality instead of breaking it.
`flipped: true` and a `fixNote` are recorded in the sidecar.

### The facing complaint is declined, and this is the second time

`docs/handoff/art3-contract.md` §1 and `ART-PIPELINE.md` §2a both put portraits
at **`facing: none`**; `--composition portrait` defaults to it; all twenty
shipped portraits record it. §F5 already ruled on this after the judge's first
pass, and nothing has changed. The portrait ships straight-on.

**This needs a decision above this group.** The judge has now failed the same
state on the same rule twice, which means either the contract should carve
portraits out of the judge's facing check, or the contract should change and all
twenty portraits be re-shot. It is not a per-subject call and it should not be
re-litigated a third time in a handoff document.

---

## G6. New tool: `tools/gen/fillholes.py`

Fills interior alpha holes that rembg punches through a cutout when
`isnet-anime` decides a blown-out white highlight is background. Floods the
transparent region inward from the border, treats anything transparent it cannot
reach as a hole, recolours those pixels from the `*.raw.png`, re-crops with the
house margin and records `holesFilled` / `holesFilledPx` / `holesFilledAt` in
the sidecar the way `flip.py` records a mirror.

```bash
D:\Tools\ComfyUI\python_embeded\python.exe -s tools/gen/fillholes.py \
    public/art/characters/<id>/<state>.png --raw <state>.raw.png [--min-px 40]
```

It is the complement to `despeckle.py`: that one drops detached junk outside the
sprite, this one repairs enclosed gaps inside it.

**It did not fix the case it was written for, and that is the useful part.** Run
against the Yu Pagoda `ko` candidate it reported `holesFilledPx: 0` — the white
gash was *connected to the silhouette edge*, i.e. a bite out of the outline
rather than an enclosed hole, so no fill tool can reach it. That is what sent
the fix back to the plate and the negatives (§G1), where it belonged. Check
whether the damage is enclosed before reaching for a repair tool; if it opens to
the edge, the render is wrong, not the cutout.

---

## G7. Known defects still standing

- **`braskas-final-aeon-2/cast` is slimmer than the subject's other four
  states.** Chosen over a more massive variant that had no readable face; see
  §G4. Its blade is red-and-blue rather than black, and the "dark energy" the
  pose asked for is faint.
- **`braskas-final-aeon-2` remains redder than its own idle** — unchanged from
  §6 and §F7; the new `cast` was matched to the four existing states, so the
  idle is still the outlier.
- **`braskas-final-aeon-1/idle` is still `FRAME-FULL` (72.7%)** with its sword
  clipped. Untouched this pass; the new `hurt` at 61% is the first state of that
  subject with real air around it.
- **`yu-yevon`'s three new states sit close to the idle in attitude.** Deliberate
  (§G2), and the idle's warmer brown-gold still differs from `ko`'s palette.
- **Yu Pagoda's five states are a rigid object.** They now differ by lean, tier
  separation, fracture and glow rather than by brightness alone, but a carved
  stone tower has no anatomy and never will.
- **Form 2's wing-spikes are still membranes**, not spike blades (§6).
- `public/art/characters/anima/` still holds its 39 `*.raw.png` files. Still not
  this group's; still flagged.

---

## G8. For whoever owns `tools/gen/cast.json` and the visual bible

On top of §10 and §F8:

- **`research/visual-bible.md` §1.10's Yu Pagoda paragraph is now wrong.** The
  shipped art is a four-tier **blue-grey** tower with **red and gold trim** and
  **lit arched eye-windows**, not a three-tier tan finial. The section's own
  `[estimate]` marking is why that was allowed to change; the section should be
  rewritten to match what ships, with the ramps in §G1's table.
- `yu-pagoda`'s `cast.json` row should carry the v2 plate workflow, the anti-
  bleach note (`carved stone masonry` and `weathered stone` are banned on this
  subject) and the per-state denoise table from §G1.
- `yu-yevon`'s row should record **`--img2img` off the approved idle at
  denoise 0.73** as the way its states are made, not `--ref`.
- Both aeon forms: note that `--size 1216x832` turns form 1 quadrupedal, and
  that a padded reference costs mass on form 1 while it is the only thing that
  fixes framing on form 2.
- Someone above this group has to rule on portraits and the facing check (§G5).
