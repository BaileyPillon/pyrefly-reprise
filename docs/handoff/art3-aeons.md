# Art handoff — group `aeons` (contract v3)

Subjects: `valefor`, `ifrit`, `ixion`, `shiva`, `bahamut`, `anima`, `yojimbo`.
States per subject: `idle`, `attack`, `overdrive`, plus a menu portrait
(`public/art/portraits/<id>.png`).

Pipeline: `tools/gen/comfy.mjs` `boss` preset, Animagine XL 4.0 Opt, 28 steps /
CFG 6 / euler_ancestral / normal. The shared STYLE/QUALITY blocks in
`comfy.mjs` were **not** touched. Every non-idle state is pinned to its own
subject's approved `idle` with `--ref`.

Contact sheets: `docs/screenshots/art/<id>.png`.

Supersedes `docs/handoff/art-aeons.md` (the v1/v2 round), whose identity tags
are reused verbatim — they were already reconciled against
`research/visual-bible.md` §1.13, and §2 below repeats that reconciliation
because it is still the reason these prompts do not match `cast.json`.

---

## 1. Two contract-level findings the next group needs

### 1.1 Aeons face RIGHT, not left. `cast.json` and both contract docs are wrong.

`docs/ART-PIPELINE.md` §2a, `docs/handoff/art3-contract.md` §1 and all seven
aeon rows in `tools/gen/cast.json` put aeons in the same bucket as bosses and
enemies: `facing: left`. **The engine disagrees, and the engine is right.**

An aeon does not fight *against* the party, it *replaces* it. From
`src/battle/common/types.ts`:

> `aeon` is its own side because an aeon *replaces* the party on the field

and the renderer places it accordingly — `src/engine/BattlePresenterStage.ts`
buckets any non-enemy side into the party's slots (`const kind: 'party' |
'enemy' = c.side === 'enemy' ? 'enemy' : 'party'`), i.e. on the **left** of the
battlefield. `src/engine/BattlePresenterActors.ts` is explicit:

```ts
/** Party and aeons face +x; enemies face -x. */
export function facingForSide(side) { return side === 'enemy' ? -1 : 1; }
```

So a summoned aeon stands on the left and fights rightward, exactly like a party
member. **This group is therefore rendered `--facing right`,** which is what the
task brief asked for.

What the old `facing: left` would actually have cost: it is not merely
cosmetic. `mirrorFor('left', +1)` returns `-1`, so the engine would have
**mirrored every aeon painting at runtime** to point it the right way. That
silently defeats the chirality rule in `flip.py` — Yojimbo's katana would swap
hands on screen, and nothing in the art pipeline would show it.

**Not fixed here.** `cast.json` and the two contract docs are shared property
and three other groups are rendering against them right now; changing `facing`
under them mid-round is worse than the inconsistency. Flagged for the
orchestrator instead — the aeon rows in `cast.json` (`facing`) plus the "Bosses,
enemies, aeons" row in both contract tables need to be split so aeons sit with
the party.

### 1.2 `(from side:1.3)` destroys the render on non-humanoid subjects — use 1.15

The house facing phrase weights the load-bearing token at 1.3:

```js
FACING_PHRASES.right = '(from side:1.3), three-quarter view, body facing right, (looking at viewer:1.2)';
```

That weight was tuned on Tidus (`art3-contract.md` §2, rounds 3–4), a *named
humanoid* whose straight-on official art is a very strong prior. A
no-humans creature prompt has no such prior, and there the weight does not just
turn the subject — it takes the style with it. On `valefor` **every one of 11
renders at 1.3 came back muddy, speckled and desaturated**, with the
cel-shading contract gone: flat washes, a dotted sandpaper texture over the
body, and colours a third of the way to grey. Shortening the negative block
(the `art3-party-b.md` §6.5 fix) changed nothing, so it is the weight and not
the negatives.

**The effect is subject-dependent, not universal.** `shiva` — the one humanoid
in this group, and a *named* one (`shiva (final fantasy)`) — rendered cleanly at
1.3 in the same round. So the rule is not "1.3 is broken", it is "1.3 costs a
creature prompt its style, and a named-humanoid prompt survives it". The whole
group was moved to 1.15 anyway for internal consistency: six of the seven are
creatures, and a roster half in one style and half in another is worse than
either (`ART-PIPELINE.md` §2 rule 2).

A/B, `valefor` idle, fixed seed **774222**, everything else identical:

| Key | Facing phrase | Style | Body |
| --- | --- | --- | --- |
| A | `--facing none` (v1 baseline, `straight-on`) | clean, saturated, cel-shaded | frontal — the v2 problem |
| B | `(from side:1.15), three-quarter view, (looking at viewer:1.2)` | **clean, saturated, cel-shaded** | **turned ~45°**, face readable |
| C | house phrase, `(from side:1.3)` | muddy, speckled, desaturated | turned |

(A and B are the same seed; C is the same prompt across the 11 renders of the
first round.)

B keeps everything A has and still buys the turn, so **this group renders with
`--facingPhrase "(from side:1.15), three-quarter view, (looking at viewer:1.2)"`**.
`body facing right` is dropped from the phrase as well — `art3-contract.md` §2
round 4 already established that the direction word is inert, and it is two
fewer tokens competing with the creature description.

The facing negatives (`FACING_NEGATIVE`) still apply, because `--facing` is
`right` and only the *phrase* is overridden.

This is worth an A/B on the remaining non-humanoid groups (the FFX and X-2
bosses) before they re-render at 1.3.

---

## 2. Deviations from `tools/gen/cast.json` (and why)

Unchanged from the v1 round and repeated here because it is still live.
`cast.json`'s aeon rows carry a boilerplate state block (`"wings folded"` on a
horse and on a samurai) and, in five cases, colours that contradict
`research/visual-bible.md` §1.13 — the canon authority the blind-judge bar
names. Identity tags follow the bible; `cast.json` itself was not edited.

| Subject | `cast.json` says | Visual bible §1.13 says | Used |
| --- | --- | --- | --- |
| valefor | `blue feathers` | "covered in **red feathers**", underwing membrane `#E0B06A` | crimson red feathers, cream underbelly, golden-tan underwing |
| ifrit | `quadruped stance` | "a **humanoid**, demonic-looking beast… **hunchback**" | humanoid, hunched, reddish-brown hide, light red mane |
| ixion | `purple mane` | "**dark blue** skin", "**grey** mane and tail", "long **golden** horn", "**gold bracers**" | dark blue hide, grey mane, golden horn, gold bracers |
| shiva | `white hair` | "long, **bright blue** dreadlocks" | long bright blue dreadlocks, pale blue skin |
| bahamut | `mechanical wings` (only) | "black dragon with **enormous red wings**" | huge crimson red wings **plus** mechanical wing struts |
| yojimbo | `helmet` | palette lists a **hat brim**, coat `#1A1E2E`, mask `#B8A882` | wide-brimmed hat, navy coat, pale bone mask |

Also unchanged from v1: **the `overdrive` pose tags are rewritten for every
subject.** `cast.json`'s `"energy gathering, glowing, dramatic lighting, aura,
looking up, power building"` renders a large opaque glow that `isnet-anime`
keeps, welding a white blob to the silhouette. The overdrive frame is staged as
**pose only** — the roar/rear/draw at the top of the attack — with the VFX left
to the engine, plus anti-glow negatives.

`anima` opts out of one shared anti-background negative: `halo` is banned for
everyone else, but her fayth portrait canonically wears one (bible §1.13).

Anti-background block used on every shot in this group:

```
pedestal, rock, floor, ground, glowing background, light burst, backlight,
white glow, glowing aura, magic circle
```

---

## 3. How this round was run

1. `idle` first, `--batch 4`, judged from a candidate contact sheet
   (`docs/screenshots/art/_aeon-cand-idle.png`) rather than one Read per
   variant; the winner is promoted to `idle.png`.
2. Facing judged first (§6 of `ART-PIPELINE.md`). The checkpoint's frame-left
   bias held here as everywhere: **every** keeper came back facing frame-left
   and was mirrored with `flip.py --set-facing right`. Mirroring is safe for
   this group — see the chirality note below.
3. `attack` and `overdrive` with `--ref <that idle>`, `--batch 3`.
4. Portraits with `--composition portrait --ref <idle> --refWeight 0.70
   --refStart 0.30`, matching what `art3-party-b.md` §2.5 settled on.

**Chirality.** `flip.py`'s header bans mirroring a chiral subject. Six of these
seven are safely symmetric: Valefor (feathers, both wings), Ifrit (both horns,
both arms), Ixion (a single central horn, gold bracers on *both* front legs),
Shiva, Bahamut and Anima (the fayth portrait hangs centrally). **Yojimbo is the
exception** — he holds the katana in one hand, so a mirror swaps his sword
hand. He is rerolled for a right-facing render rather than flipped; see his row.

---

## 4. Final choices

| Subject | State | Seed | Size | baselineY | Mirrored | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| valefor | idle | 447607691 | 1195×832 | 829 | yes | Red crest, cream/gold underside, feathered dragon wings, long lizard tail, talons planted and lowest. |
| valefor | attack | 556677 | 1216×832 | — | yes | Reroll (`attackB`) — see §5. Lunging, talons extended, beak open, tail streaming straight so the silhouette stays open. |
| valefor | overdrive | — | 1098×832 | — | yes | Wings thrown wide, head raised, beak open. Pose-only staging, no VFX (see §2). |
| valefor | portrait | — | 832×1216 | — | yes | Head-and-shoulders bust, crest and beak clear. `BG-RETAINED,FRAME-FULL` is the normal verdict for the portrait preset (`art3-party-b.md` §2.5), not a defect. |
| ifrit | idle | 1336752270 | 1000×1024 | — | yes | Hunched, bone-white curved horns, red mane, reddish-brown hide, claws, fangs. |
| ifrit | attack | — | 1007×1022 | — | yes | Forward lunge, fangs bared, claws out. `dangle 0`. |
| ifrit | overdrive | — | 1011×1024 | — | yes | Roaring, arms drawn back, head up. Pose-only staging. |
| ifrit | portrait | — | 832×1216 | — | no | Three-quarter bust, mane and horns fill the frame. |
| ixion | idle | — | 1191×802 | 786 | yes | Single long golden horn, dark blue hide, grey mane and tail, gold bracers, four hooves down, head raised. |
| ixion | attack | — | 1215×778 | — | yes | Charging, head lowered, horn leading. |
| ixion | overdrive | — | 1216×824 | — | yes | **Reads close to the attack** — the pose tags asked for a rear onto the hind legs and the checkpoint gave another head-down charge in both slots, 5/5. Usable (the engine holds this frame during the cut-in) but the two frames are not as distinct as the other subjects'. A rear is probably only reachable with an explicit `--img2img` pose sketch. |
| shiva | idle | — | 734×1147 | 1131 | **no** | Pale blue skin, long blue ice-tipped dreadlocks, slim, minimal blue outfit. Landed facing frame-right unmirrored, so its seed reproduces the shipped file exactly. Two small detached ice shards sit beside her in the cutout — invisible at battle scale, worth a reroll if anyone is polishing. |
| shiva | attack | — | 829×1188 | — | no | Sweeping one arm across the body, ice bursting at the hand. |
| shiva | overdrive | — | 832×1216 | **1147** | no | Arms opening, ice gathering, hair flaring. **`baselineY` hand-corrected** 1205 → 1147: her ice-dreadlocks hang 58 px past her boots, so the machine value would have planted her hair on the floor and floated her (§5 of `ART-PIPELINE.md`). `baselineYAuto` keeps the original. |
| shiva | portrait | — | 832×1216 | — | no | Three-quarter bust, face clear, dreadlocks framing. |
| bahamut | idle | 880012 | 994×1024 | — | **no** | Reroll pass (`idleB`). Black armoured scales, huge red wings half-folded, horns, spinal spikes, long tail, glowing eyes, bipedal, turned and facing frame-right unmirrored. |
| bahamut | attack | — | 996×1024 | — | no | Rearing into a lunge, jaws open, wings spread. Landed facing right unmirrored. |
| bahamut | overdrive | — | 1024×1024 | — | yes | Wings spread wide, head forward. Cleanest of the three (the other two were `FRAME-FULL`). |
| bahamut | portrait | — | 832×1216 | — | no | Head and neck, horns and jaw clear. |
| anima | idle | — | 772×1166 | — | yes | **Approximate — see §5.** Tall dark chained horned demon, single glowing eye, grey wrappings. Not the canon two-part body. |
| anima | attack | 334456 | 815×1170 | — | yes | Reroll at `--refWeight 0.45` (see §5). Lunging, one arm reaching, chains taut. |
| anima | overdrive | 556644 | 832×1201 | — | yes | Reroll at `--refWeight 0.45`. Body arched, chains straining, eye blazing. |
| anima | portrait | — | 832×1216 | — | no | Masked face, chains, single eye — the closest any render came to her canon read. |
| yojimbo | idle | 773311 | 823×1180 | — | **yes, and it should not have been** | Navy coat, wide conical hat, bone mask, sheathed katana. **The one canon violation in the group** — see the `chiralityWarning` in the sidecar and §5. |
| yojimbo | attack | — | 822×1191 | — | no | Mid-stride, katana swept out, coat flaring. **Landed facing right unmirrored, so the sword hand is correct here.** |
| yojimbo | overdrive | — | 832×1183 | **1107** | no | Blade raised, coat flaring. Also unmirrored. **`baselineY` hand-corrected** 1168 → 1107 — the coat tail trails 61 px past his sandals. |

---

## 5. Per-subject notes worth not rediscovering

### valefor — `feathered` is load-bearing, and so is `final fantasy x`

The first pass of this round dropped both, on the theory that a plainer
description would be easier for the checkpoint. Both were mistakes:

- **`two large feathered dragon wings`** — drop `feathered` and you get a
  membranous wyvern (4/4). Drop `dragon` instead and you get a *real bird*:
  scarlet ibises, herons, one render of an entire flock. The phrase only works
  with both words in it, which is why the v1 round settled on it.
- **`final fantasy x` in the identity tags.** The aeon rows in `cast.json` omit
  the series tag that every party row carries. Adding it back is most of the
  difference between "a red bird" and "Valefor" — it is the token that reaches
  the character prior at all.

### bahamut — spread wings do not fit the square bucket

First pass, 3 usable candidates: one clean but effectively **frontal** (a
facing reject, §6.0), one cleanly turned but **cropped on all four edges**, one
`BG-RETAINED`. `wings spread` plus `1024x1024` cannot hold a dragon with a
wingspan. Rerolled with **`wings half folded against the back`** and the turn
stated in the pose tags rather than left to the facing phrase; that landed the
whole figure, turned, facing frame-right, first try.

### `--ref` at 0.65 pulls a head close-up on a subject the checkpoint is unsure of

Anima's `attack` and `overdrive`, run at the house `--refWeight 0.65` against
her approved (full-figure) idle, came back **6/6 as cropped close-ups of a
horned head filling the frame**, all `FRAME-FULL` or `BG-RETAINED`. The idle
being referenced is a full figure, so the adapter was not copying its framing —
it was leaning on the checkpoint's own weak, head-dominated prior for the
description.

**Dropping to `--refWeight 0.45` fixed it in one pass**, both states, full
figures. That is the same number `ART-PIPELINE.md` §3 already recommends for a
*variant* subject, and the reasoning turns out to generalise: when the
checkpoint is unsure of the subject, a strong reference amplifies whatever it is
unsure about. Worth trying before rerolling tags on any subject whose referenced
states come back worse framed than its idle.

### anima — the checkpoint does not know her; this is a `--img2img` subject

Three tag passes (11 renders) and she never arrived. What came back, in order:
a cropped close-up of a horned head; a slim bandaged humanoid in a **flat 90°
profile with the face hidden** (a facing reject); a three-figure "multiple
views" sheet; a hunched long-haired figure with chains. The individual tokens
land — bandages, chains, shackles, horns, a single glowing eye — but the thing
that makes Anima *Anima*, the **two-part body** (a restrained mummy-like torso
suspended above a separate horned demon lower half), never assembles, because
Animagine has no prior for it.

This is the same failure the pipeline already documents for **Seymour Flux**
(`ART-PIPELINE.md` §7, "Still open"), and it has the same documented answer:
`--img2img` off a rough sketch, which is the case that flag was added for.
Recommended as a follow-up rather than bodged here.

### yojimbo — the one chiral subject, and the style block fights his palette

Two separate problems:

1. **Chirality.** He holds the katana in one hand, so `flip.py` is not
   available (its own header says so). He has to be *rerolled* until a
   right-facing render lands rather than mirrored — the only subject in this
   group under that constraint.
2. **The house style block turns him into a rainbow.** `STYLE_TAGS` ends
   `vibrant colors, colorful`, and on a subject whose canon palette is a single
   dark navy (bible §1.13: coat `#1A1E2E`/`#2E3650`), that wins: the first pass
   produced a rainbow-striped conical hat and a multicoloured robe, twice out of
   two. The style block is contract and must not be edited per subject
   (`ART-PIPELINE.md` §2 rule 2), so the counterweight goes in the two channels
   that *are* per-subject: `--emphasis "(dark navy blue coat:1.4), (muted dark
   colours:1.25)"` and a `--negAdd` banning `rainbow, multicolored, colorful
   clothing, striped robe, bright colours, pastel`.

   Worth knowing for any other dark-palette subject in the roster.

3. **How the chirality call actually landed.** His `attack` and `overdrive`
   both came back facing frame-right on their own, so they ship **unmirrored**
   and his sword hand is correct in both. Only the `idle` had to be mirrored,
   after 11 renders across three passes failed to produce a usable right-facing
   three-quarter (1.15 gave frontal-or-left, 1.3 overshot into a flat profile —
   the same weight Shiva tolerated, so the humanoid/creature split in §1.2 is
   not the whole story either). The trade was: a sprite facing away from the
   enemy, which is the exact defect this contract exists to remove, versus an
   inverted sword hand. The inverted hand won, and it is recorded in
   `yojimbo/idle.json` under `chiralityWarning` so it can be undone.

---

## 6. Open items for whoever picks this up

1. **`cast.json` and both contract docs still say aeons face `left`.** §1.1.
   Not fixed here because three other groups are rendering against those files
   right now. This is the highest-value follow-up: left as-is, the next person
   to re-render an aeon will re-introduce the bug, and the engine will silently
   runtime-mirror their work.
2. **Anima wants `--img2img` off a sketch.** §5. What ships is a credible dark
   chained demon, not her canon two-part body.
3. **Yojimbo's `idle` should be replaced by a right-facing reroll** so the
   mirror can be dropped. §5.
4. **Ixion's `overdrive` reads too much like his `attack`.** §4.
5. **Shiva's idle carries two detached ice shards** in the cutout. §4.
6. **Try `(from side:1.15)` on the remaining non-humanoid groups** (FFX and X-2
   bosses) before they re-render at the house 1.3. §1.2.

---

# 7. FIX PASS (2026-09-18) — re-judge of all 28 states

A blind judge scored every state of this group and failed all 28 on facing,
plus a list of canon and anatomy defects. This section is what changed. The
sections above are the original round and are left intact; where this pass
contradicts them, **this pass wins**.

## 7.1 Facing: the group is now rendered and shipped facing frame-LEFT

§1.1 above argued from the engine source that aeons belong on the party side
and should therefore face **right**, and rendered the whole group that way. The
judge scores against the written contract (`docs/handoff/art3-contract.md` §1
and `ART-PIPELINE.md` §2a, both of which put aeons with "bosses, enemies,
aeons → left") and failed all 28 states with `facingOk: false`, every one of
them for the same reason. The fix-pass brief says "facing per contract", so the
group is now **left**: every shipped sprite is angled toward the LEFT edge with
the face still turned to the viewer.

**What this costs at runtime, and it is not nothing.** `PaintedActor.ts:1437`
reads the sidecar's `facing` (`mirrorFor(meta.facing ?? this.artFacing, this.facing)`)
and `facingForSide()` still wants `+1` for an aeon, so the engine will now
**mirror every aeon sprite at runtime**. On screen that is correct — an aeon
stands on the party side and fights rightward — but it means:

* the painted art and the on-screen image are mirror images of each other, and
* **Yojimbo is mirrored on screen**, which inverts his sword hand there instead
  of in the file. The chirality problem did not go away; it moved from the PNG
  into the renderer, where the art pipeline cannot see it.

This is now a decision for the orchestrator, not for this group. Either
(a) keep the contract as written (art left, engine mirrors, Yojimbo reads
left-handed in game), or (b) split the aeon rows out of the "bosses, enemies,
aeons" bucket in both contract docs *and* `tools/gen/cast.json`, re-judge this
group as `facing: right`, and re-render Yojimbo rather than mirroring him.
Until that is settled the group follows the written contract, because the judge
is the gate and the judge cannot be argued with.

Portraits are shipped facing left too. The contract says portraits are
`facing: none` (a HUD head-shot meets the player's eye), but the judge failed
all seven portraits for facing right, so they now face left. Flag this in the
same decision: the contract and the judge disagree about portraits as well.

## 7.2 Valefor is teal, not red. `cast.json` was right and §2 above was wrong

§2 above overrode `cast.json`'s `blue feathers` with **crimson red feathers**,
on the strength of the visual bible's `[single source]` line "some of her body
is covered in red feathers". The judge rejected all four states for exactly
this ("reads as a red/orange phoenix... canon Valefor is teal/blue-green with a
cream-tan underside and banded tail"), and the judge is right: the wiki line
describes an *accent*, not the body colour, and the bible's palette swatches
took the accent for the whole bird.

Shipped palette: **teal / blue-green plumage, cream-white underbelly,
golden-tan underwing membrane, banded tail, two backswept head fins.**
`--emphasis "(teal blue green plumage:1.3), (cream white underbelly:1.2)"` plus
a `--negAdd` banning `red feathers, orange feathers, crimson, phoenix`. The
`feathered dragon wings` and `final fantasy x` findings in §5 still hold — both
stay in the tags.

`research/visual-bible.md` §1.13 needs correcting for Valefor. Not edited here;
the bible is outside this group's write scope.

## 7.3 What was regenerated, and what was only mirrored

`ART-PIPELINE.md` §6.0 is explicit that a good render pointing the wrong way is
**not** a reject, so states whose only failure was facing were mirrored with
`flip.py --set-facing left` rather than rerolled — rerolling an 8 to buy a coin
flip is the trade that rule exists to prevent. Everything with a canon, anatomy
or cutout defect was regenerated.

| Subject | Mirrored only | Regenerated |
| --- | --- | --- |
| valefor | — | idle, attack, overdrive, portrait (palette) |
| ifrit | — | idle, attack, overdrive, portrait |
| ixion | idle, portrait | attack, overdrive |
| shiva | idle, attack, overdrive, portrait | — (despeckled only) |
| bahamut | — | idle, attack, overdrive, portrait |
| anima | idle | attack, overdrive, portrait |
| yojimbo | idle (un-mirrored), portrait | attack, overdrive (chiral — rerolled, never mirrored) |

**Yojimbo's idle was un-mirrored, and that fixes the one canon violation in the
group.** The `chiralityWarning` in `yojimbo/idle.json` recorded that the file
had been mirrored despite being chiral, to buy a right-facing sprite. Contract
v3's left *is* that render's own as-rendered orientation, so the mirror was
simply undone: `flip.py` flipped `flipped` back to `false`, the seed reproduces
the file again, and his sword hand is as the checkpoint drew it. The warning is
replaced by a `chiralityNote` saying so. His `attack` and `overdrive` had landed
frame-right unmirrored in the first round, so they could not be flipped — both
were rerolled facing left, which the checkpoint's frame-left bias made easy.

**Shiva needed no new renders at all.** Her four states were 7–8s whose only
defects were facing plus loose cutout debris. `despeckle.py` dropped 4 detached
ice islands from the idle, 4 from the attack and 2 from the overdrive, then all
four were mirrored. The overdrive's hand-corrected `baselineY` (1147 — her
ice-dreadlocks hang 58 px past her boots) was **re-applied after despeckling**,
which recomputes it. Worth knowing: despeckle silently reverts a hand
correction, so re-apply it and keep `baselineYAuto` alongside.

## 7.4 Canon fixes per subject

| Subject | Judge's complaint | What the prompt now does |
| --- | --- | --- |
| valefor | red/orange phoenix; no head fins; a second head; three wings | teal palette (§7.2), `two backswept head fins`, `--emphasis "(one head:1.25)"`, `--negAdd "extra heads, two heads, extra wings, four wings"` |
| ifrit | horns reduced to stubs; shaggy mane with neon cyan tips | `--emphasis "(two huge curved horns:1.35)"`, `short orange red mane`, `--negAdd "cyan, neon cyan, blue fur, blue highlights, teal, small horns"` |
| ixion | rear legs tangled, detached mane fragment, horn splitting in two | `--emphasis "(one single spiral horn:1.35)"`, `all four legs clearly visible`, `--negAdd "two horns, split horn, forked horn, extra legs, detached limb"` |
| bahamut | bright crimson body; wings not mechanical; a mouth in the chest | `dark grey armored scales, black armour plating, segmented mechanical wings, dark red wing membranes`, `--emphasis "(black armoured scales:1.3)"`, `--negAdd "bright red, crimson body, second mouth, mouth on the chest, teeth on the body"` |
| anima | magenta demon with two eyes; face collapses into drapery | `--emphasis "(single central glowing eye:1.35), (bandaged face:1.3)"`, `--negAdd "magenta, hot pink, two eyes, three eyes, oni mask"` |
| yojimbo | detached second blade; hat and robe drifting pale/bright | the §5 anti-rainbow `--emphasis`/`--negAdd` block kept verbatim, plus `--negAdd "extra swords, two katana, floating sword, detached sword"` |

## 7.5 Three techniques worth reusing

1. **`(from side:1.15)` held up.** The softened facing phrase from §1.2 was used
   on every render in this pass and cost nothing — with `--facing left` the
   checkpoint's own frame-left bias does most of the work, so almost every batch
   landed the right way first time. Only two regenerated files in the group had
   to be mirrored after the fact (ifrit overdrive, bahamut attack).
2. **Framing has to be said out loud on a creature.** The single most effective
   pose-tag addition in this pass was `zoomed out, the whole creature inside the
   frame, wingtips inside the frame, nothing cropped`. Without it, roughly half
   of every `boss` batch came back `FRAME-FULL` (subject touching all four
   edges). Valefor's first batch was 2/4 cropped; with the phrase added, 0/4.
3. **`BG-RETAINED` is usually a *painted light shape*, not a matting failure.**
   Bahamut's referenced states came back with opaque white blobs enclosed by the
   wings. `unbackdrop.py` could not help — it floods inward from the frame edge,
   and an enclosed blob is not edge-connected. What fixed it was negatives:
   `spotlight, glowing orb, sun, moon, white circle, backlit, light behind the
   subject`, plus the pose tag `plain empty white background, nothing behind the
   dragon`. That took the attack batch from 3/4 `BG-RETAINED` to 0/4.

## 7.6 Anima: still the group's weak subject, and still an `--img2img` case

§5 called her an `--img2img` subject. This pass tried that, and it does not work
the way the pipeline doc implies for a *cutout* init image: feeding her own
transparent idle to `--img2img` flattens the transparency to white, and rembg
keeps that white as subject — 6/6 candidates came back with a large opaque white
mass filling the concave curve of her body, and `unbackdrop.py` could not reach
it because it is enclosed. **If anyone retries img2img here, composite the init
image onto mid-grey or draw a real sketch; do not hand it a cutout.**

What shipped instead: the idle is the previous round's render (the judge's best
Anima at 7/10 — "shrouded gaunt figure, chains, single glowing eye"), un-mirrored
to face left. `attack` and `overdrive` are referenced at `--refWeight 0.55
--refStart 0.35` with the pose language rewritten to `standing upright and tall`
— the earlier `lunging` / `body arched back` wording is what turned her into a
hunched quadruped, 8 candidates out of 8. The portrait is the clear win of her
set: a bandaged face with one central glowing eye, which is the first time in
two rounds that read has landed.

Her three battle states still do not agree with each other as tightly as the
other six subjects', and no reference weight fixed that: the checkpoint has no
prior for her, so a strong reference amplifies its confusion (the §5 finding,
re-confirmed) and a weak one lets the pose prompt invent a new creature. She is
the one subject in this group where a hand-drawn pose sketch would pay for
itself.

## 7.7 Final choices

| Subject | State | Seed | Size | baselineY | Mirrored | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| valefor | idle | 1903670487 | 1057x830 | 814 | no | Teal body, cream underbelly, gold-tan underwing, banded tail, backswept head fins; talons planted and lowest. |
| valefor | attack | 1324865190 | 1186x832 | 824 | no | Lunging, talons forward, wings up, beak open. |
| valefor | overdrive | 1255799355 | 1216x832 | 831 | no | Wings thrown wide, head raised. Pose-only staging, VFX left to the engine. |
| valefor | portrait | 29081116 | 824x1202 | 1202 | no | Head and neck; crest, beak and eye clear. `BG-RETAINED` is the normal verdict for the portrait preset, not a defect. |
| ifrit | idle | 1397797182 | 975x1018 | 1002 | no | Hunched humanoid beast, two huge curved bone horns, orange-red mane, reddish-brown hide, claws, tail. Landed facing left unmirrored. |
| ifrit | attack | 155556757 | 1021x1024 | 1024 | no | Crouched low, fangs bared, claws out. |
| ifrit | overdrive | 2042771381 | 898x1000 | 992 | **yes** | Standing tall, roaring, arms drawn back. Rendered frame-right, mirrored (Ifrit is symmetric). |
| ifrit | portrait | 891045913 | 832x1216 | 1216 | no | Three-quarter head; muzzle and eye readable at HUD size — this is the fix for the judge's "illegible" verdict. |
| ixion | idle | 1276202745 | 1191x802 | 786 | keeper, re-mirrored to left | Unchanged render (judge 8/10), now facing left. |
| ixion | attack | 736138561 | 1166x778 | 762 | no | Charging, horn leading, four legs resolved, gold plating consistent with the idle. |
| ixion | overdrive | 1646029249 | 1179x796 | 786 | no | Front hooves off the ground — the closest to a rear this checkpoint gives. §4 above guessed a rear was unreachable without a sketch; `--emphasis "(rearing up on hind legs:1.45)"` at `--refWeight 0.45` got most of the way, and the frame is now clearly distinct from the attack. |
| ixion | portrait | 1375154890 | 832x1216 | 1216 | keeper, re-mirrored | Unchanged render (judge 8/10). |
| shiva | idle | 732103583 | 574x1147 | 1131 | **yes** | Despeckled (4 islands dropped), then mirrored. |
| shiva | attack | 134878381 | 829x1188 | 1172 | **yes** | Despeckled (4 islands), then mirrored. |
| shiva | overdrive | 417761015 | 832x1216 | **1147** | **yes** | Despeckled (2 islands), `baselineY` hand-correction re-applied (auto 1205), then mirrored. |
| shiva | portrait | 1407256137 | 832x1216 | 1216 | **yes** | Unchanged render, mirrored. Still framed more fan-service than her battle states — noted, not fixed, because a reroll risks an 8. |
| bahamut | idle | 285619841 | 989x966 | 950 | no | Black armour plating, dark red wing membranes, spinal spikes, glowing blue eye, bipedal, whole figure in frame. The canon fix. |
| bahamut | attack | 194298753 | 1020x976 | 960 | **yes** | Crouched lunge, jaws open, wings spread. Rendered frame-right, mirrored (symmetric). |
| bahamut | overdrive | 600471032 | 989x1024 | 1013 | no | Standing tall, wings spread wide, head raised. |
| bahamut | portrait | 1114064281 | 832x1216 | 1216 | no | Whole head and neck in frame with horns. Fourth batch: the first two drifted neon blue/violet and had to be beaten back with `--emphasis "(matte black scales:1.4)"` and a `--negAdd` banning `neon, iridescent, purple, violet`. |
| anima | idle | 991144 | 772x1166 | 1150 | keeper, re-mirrored to left | Unchanged render (judge 7/10). |
| anima | attack | 729491495 | 637x1216 | 1202 | no | Tall gaunt figure, head bowed, chain held taut, shackled ankle. Palette matches the idle. |
| anima | overdrive | 97516393 | 675x1182 | 1166 | no | Upright, chains hanging on both sides, single eye lit. |
| anima | portrait | 1631680111 | 832x1216 | 1216 | no | **Bandaged face with one central glowing eye** — the canon read, landed at last. |
| yojimbo | idle | 773311 | 823x1180 | 1164 | **un-mirrored** | The first round's mirror was undone; sword hand now correct, the seed reproduces the file, `chiralityWarning` replaced by `chiralityNote`. |
| yojimbo | attack | 913898314 | 747x1141 | 1125 | no | Mid-stride, one katana swept out, navy coat, bone mask. Rerolled facing left (chiral — never mirrored). |
| yojimbo | overdrive | 455075997 | 731x1141 | 1125 | no | Wide stance, blade drawn across the body, one katana only. `qc.py` reports `DANGLE-82px`; checked by eye — the lowest pixels are his sandals and the coat is simply wider higher up, so no `baselineY` correction is needed. |
| yojimbo | portrait | 766804432 | 832x1216 | 1216 | **yes** | Unchanged render, mirrored. |

Contact sheets rebuilt: `docs/screenshots/art/<id>.png` for all seven, plus a
whole-group sheet at `docs/screenshots/art/aeons-fix.png` (7 rows x idle /
attack / overdrive / portrait).

## 7.8 Open items after this pass

1. **The facing question is now blocking, not cosmetic.** §7.1. Whoever owns the
   contract has to decide whether aeons sit with the party (`right`; the engine
   does not mirror; Yojimbo stays correct) or with the enemies (`left`, as
   shipped; the engine mirrors every aeon at runtime and Yojimbo reads
   left-handed on screen). Both contract docs, `tools/gen/cast.json` and the
   judge's rubric have to agree before the next re-render, and portraits need
   the same ruling.
2. **`research/visual-bible.md` §1.13 says Valefor is red.** §7.2. It should say
   teal/blue-green with red accents, or the next person renders a phoenix again.
3. **Anima wants a hand-drawn pose sketch for `--img2img`**, composited on an
   opaque background — not her own cutout. §7.6.
4. **Shiva's portrait framing** is still more fan-service than the rest of the
   roster. §7.7.
5. **`despeckle.py` reverts a hand-corrected `baselineY`.** §7.3. Worth a line in
   that script's header, or a `--keep-baseline` flag.

---

# 8. FIX PASS 2 (2026-09-18, later) — the eleven states the judge sent back

The blind judge re-scored all 28 states and returned eleven. This section is
what was done about them. Contract unchanged: `boss` preset, `--facing left`,
`--facingPhrase "(from side:1.15), three-quarter view, (looking at viewer:1.2)"`
(1.1 for anima, 1.2–1.35 for portraits), shared STYLE/QUALITY blocks untouched.

| Subject | State | Score in | Judge's complaint | Action |
| --- | --- | --- | --- | --- |
| valefor | overdrive | 6.5 | two tails; head crest reads as a third wing | regenerated, 4 candidates |
| ifrit | attack | 6.5 | limb count unreadable | regenerated, 8 candidates over 2 rounds |
| ifrit | overdrive | 6 | broken hind leg; horns became gold rings; flat cel | regenerated, 14 candidates over 3 rounds |
| ifrit | portrait | 6.5 | angled frame-right; grid artifact; reads as a fire dragon | regenerated, 4 candidates |
| shiva | portrait | 8 | near-frontal, turned toward frame-right | regenerated, 4 candidates (mirroring was **not** available — see §8.1) |
| bahamut | overdrive | 6.5 | quadrupedal wyvern, not the bipedal armoured dragon | regenerated, 9 candidates over 2 rounds; mirrored |
| anima | idle | 6 | generic horned demon; no bandages, no stitching, beast jaw, long tail | rebuilt from scratch, 19 candidates over 4 rounds |
| anima | attack | 6.5 | floating shackle with no hand; bare feet and a bat wing; off-model | regenerated off the new idle, 8 candidates over 2 rounds |
| anima | overdrive | 3.5 | anatomy collapsed; head frame-right; chains detached | regenerated off the new idle, 8 candidates over 2 rounds |
| anima | portrait | 6.5 | generic one-eyed fiend, no bandages | regenerated off the new idle, 4 candidates |
| yojimbo | overdrive | 7.5 | shoulders squared to camera | regenerated (chiral — never mirrored), 4 candidates |

## 8.1 Shiva's portrait could not be fixed with `flip.py`, and this is a trap

§7.3's rule — "a good render pointing the wrong way is mirrored, not rerolled" —
was the obvious move on an 8/10 whose only defect was facing. It does not apply
here, and the reason is in the sidecar: `portraits/shiva.json` already carried
`flipped: true`. The file **is** a mirror, made in the previous pass to satisfy
the same contract. Mirroring it again just restores the orientation the previous
pass rejected, and the judge would send it straight back.

The general rule: **check `flipped` before reaching for `flip.py`.** A state that
has already been mirrored once and is *still* being failed on facing is not a
direction problem, it is a render too close to frontal for a mirror to decide
anything. That one has to be rerolled.

What worked was a much stronger camera phrase on the portrait —
`--facingPhrase "(from side:1.35), three-quarter view, (looking at viewer:1.1)"`
plus the pose language `shoulders turned well away to one side, only the face
turned back toward the viewer, chin over the shoulder`. Shiva is a *named*
humanoid and survives 1.35 where the creatures do not (§1.2). 4/4 candidates came
back with the shoulders genuinely turned; the keeper has her back three-quarters
to camera and her face angled frame-left.

## 8.2 Emphasis above ~1.35 destroys a creature render — the §1.2 finding, again

Two subjects in this pass came back as washed-out, desaturated mush with the
cel-shading contract gone: bahamut's first overdrive batch (4/4) and anima's
second and third idle batches (one so faint that rembg returned
`nothing left after background removal` and the run aborted).

The variable was **not** the facing phrase this time — both ran at the 1.15/1.1
weights §1.2 already established as safe. It was `--emphasis`. Both prompts
carried three tokens with the load-bearing one at **1.45**:

    --emphasis "(bipedal dragon standing upright on two legs:1.45), (two legs only:1.3), (black armoured scales:1.3)"
    --emphasis "(full body from head to feet:1.45), (head and face visible:1.35), (mouth sewn shut with stitches:1.3)"

Dropping to two tokens at **1.3 / 1.25** and shortening the negative block fixed
both, with no other change:

    --emphasis "(standing upright on two legs:1.3), (black armoured scales:1.25)"

So §1.2 is not a fact about `FACING_PHRASES`, it is a fact about **total prompt
emphasis** on a weak-prior subject. The facing phrase was simply the first place
it was noticed. Working rule for creature prompts: **at most two emphasis tokens,
none above 1.3, and keep the negative block under about thirty tokens.** Ifrit
tolerated 1.4–1.45 (one weighted token, short negative), so the budget is a
total, not a per-token ceiling.

## 8.3 Big white areas on a creature fail in two different ways

Ifrit's first re-rolls came back with large white masses. They are not one defect
but two, and `qc.py` reports `ok` for both:

1. **A hole.** `_c6atk.1` had a white-painted belly that rembg mattes as
   *background*, leaving a transparent hole through the torso. Sampling alpha at
   the centre returns `(0,0,0,0)`.
2. **A slab.** `_c7od.2` had a white smoke plume that rembg mattes as *subject*,
   leaving an opaque near-white shape (`(253,252,251,255)`) that reads as a white
   blob once the sprite is over a battle backdrop.

`tools/gen/magenta.py` distinguishes them at a glance and is the check that
should run on every candidate batch, before the full-size read: transparent holes
show as magenta, retained white shows as white. `despeckle.py` cannot help with
either (the hole is not an island, the slab is attached) and `unbackdrop.py`
cannot reach an enclosed slab (it floods from the frame edge).

The cure is in the prompt. This negative block took ifrit's attack batch from
3/4 defective to 0/4:

    white fur, white mane, white belly, white smoke, smoke, mist, cloud,
    white cloud, white flames, white energy, glowing white, white aura,
    spotlight, glowing orb, white circle, backlit

plus the pose tag `plain empty white background, nothing behind the beast`
(§7.5.3's phrase, which works on beasts as well as on dragons).

## 8.4 Anima was rebuilt, not repaired

The judge failed her idle, so §7.6's approach was abandoned and the subject was
started over. Four rounds, nineteen candidates:

| Round | Prompt idea | Result |
| --- | --- | --- |
| A | canon two-part body spelled out — restrained bandaged torso *above* a horned demon lower half | 5/5 framed as legs and hips only; the head never entered the frame |
| B | `(full body from head to feet:1.45)` to force the framing | style collapse (§8.2); 2 of 5 aborted in rembg |
| C | light emphasis, "tall gaunt humanoid wrapped in bandages" | full figures at last, but 5/5 read as a **human mummy girl** — bandages without mass |
| D | mass put back into the tags: `towering aeon, massive bulky figure, upper body bound in thick grey bandage wrappings and heavy iron chains, two long curved horns, one single glowing eye, mouth sewn shut with black stitches` | the keeper |

Round D's keeper is a hooded, masked head with **one glowing eye**, two long
curved horns, a bandage-wrapped arm, chains hanging on both sides, X-stitched
seams over the whole body, and a ragged lower half that hangs rather than
standing on feet — which is the canon note in `visual-bible.md` §1.13 ("only her
lower demon half touches the ground"). It has no tail, no beast jaw and no second
maw, which were three of the judge's four complaints.

**The one thing it does not have is a mouth**, stitched or otherwise: the face
came back as a smooth mask with a single eye. That is a deliberate trade — a
faceless mask beats the beast jaw it replaces, and every seam on the body is
stitched, so the stitching language landed, just not on a mouth. Flagged for the
next judge rather than pretended fixed.

Her three states were then re-referenced at the new idle, and **`--ref` at 0.55
pulled every one of them into a head close-up** — §5's "at 0.65 it pulls a head
close-up on a subject the checkpoint is unsure of", reproduced 8/8 at 0.55. The
settings that produced a whole figure were **`--refWeight 0.45 --refStart 0.35`**
with §7.5.2's framing phrase in the pose tags. That is the low end of the band
`art3-contract.md` §4 allows, and the cost is visible: her three battle states
differ in palette (idle brown-violet, attack red-orange rim light, overdrive
blue-violet) more than any other subject in the group. Consistency and legibility
genuinely trade off on her, and this pass chose legibility.

## 8.5 Final choices

| Subject | State | Seed | Size | baselineY | Mirrored | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| valefor | overdrive | 377104025 | 1216x831 | 826 | no | Wings raised, beak open, talons planted. Exactly two wings, **one** scaly banded tail, head fins small. `one single scaly tail` plus a negative banning `feathered tail, fan tail, plume` is what killed the second tail. |
| ifrit | attack | 1412386521 | 850x1013 | 997 | no | Bipedal lunge, two arms and two legs all separately readable, cream bone horns, no white mass. |
| ifrit | overdrive | 2008733772 | 1021x1020 | 1007 | no | Standing upright, chest out, both arms spread, head raised. Cream horns (the gold rings are gone), painted shading back, four limbs. |
| ifrit | portrait | 2125517154 | 832x1216 | 1216 | no | Head angled frame-left, both cream ram horns clear, snarling jaw, no grid artifact, reads as the idle's demon rather than a dragon. |
| shiva | portrait | 480760543 | 832x1216 | 1216 | no | Shoulders three-quarters away from camera, face angled frame-left. §8.1. |
| bahamut | overdrive | 1355680813 | 1003x1005 | 989 | **yes** | Bipedal, standing upright on two hind legs, wings spread, tail clear of the legs, one head. Rendered frame-right, mirrored (symmetric). |
| anima | idle | 870317746 | 733x1203 | 1187 | no | The rebuild. §8.4. |
| anima | attack | 1085357571 | 804x1173 | 1157 | no | Looming forward, bandaged arm reaching out, chains, head with the single eye leading. `--ref 0.45 @ 0.35`. |
| anima | overdrive | 1552356756 | 670x1156 | 1140 | no | Rising tall, horns back, chains flung out, single eye lit. `--ref 0.45 @ 0.35`. |
| anima | portrait | 1423425649 | 832x1216 | 1216 | no | **Head entirely wrapped in bandages with one glowing eye showing through** — the canon read the judge asked for. A red highlight near the right edge could be misread as a second eye; watch for it. |
| yojimbo | overdrive | 576370668 | 771x1193 | 1177 | no | Body angled frame-left, blade swept out, coat, hat, bone mask. Chiral — rerolled, never mirrored. |

`qc.py` reports `ok` on all eight battle sprites; the three portraits report
`BG-RETAINED,FRAME-FULL`, which is the normal verdict for the portrait preset
(§7.7), not a defect. Every keeper was checked on magenta (§8.3) before promotion.

Contact sheets rebuilt: `docs/screenshots/art/{valefor,ifrit,shiva,bahamut,anima,yojimbo}.png`
and the whole-group sheet `docs/screenshots/art/aeons-fix.png`.

## 8.6 Open items after this pass

1. **Anima has no mouth, stitched or otherwise.** §8.4. If the next judge still
   wants the sewn mouth, she needs a hand-drawn sketch through `--img2img` on an
   *opaque* background — §7.6's warning about feeding her own cutout still holds.
2. **Anima's three battle states drift in palette.** §8.4. Fixing it means
   raising `--refWeight` back into the band that turns her into a head close-up,
   so it needs the sketch, not another reference tweak.
3. **Everything in §7.8 is still open** — the aeon facing ruling (1), the
   visual-bible Valefor colour (2), Shiva's portrait framing (4; the new portrait
   is framed tighter and sits better with the rest of the roster than the one it
   replaced), and `despeckle.py` reverting a hand-corrected `baselineY` (5).
4. **§8.2's emphasis budget belongs in `ART-PIPELINE.md` §2**, next to the
   `--emphasis` documentation, which currently says "two or three tokens, no
   more" without mentioning that the weights have a ceiling too. Not edited here —
   that file is shared with three other groups mid-round.
