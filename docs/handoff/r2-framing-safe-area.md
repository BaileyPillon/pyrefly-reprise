# Round 2 — the HUD safe area, and five scenes re-solved against it

**Key:** `framing-safe-area`. Fixes the framing half of **issue 3** in
`docs/handoff/playability-round-1.md` §4: *"enemy sprites render under the
right-hand CTB list / boss column and the bottom windows"*.

**Owns and changed:**

| File | What changed |
|---|---|
| `docs/ENGINE-API.md` | new **§ HUD safe area** — the rails, how they were measured, and the rule a scene must satisfy |
| `src/ui/ffx/ffx-hud.css` | `.ig-ctb__name { max-width }`, `.ig-stat-list { bottom }` |
| `src/ui/ffx2/ffx2-hud.css` | `.ig-stat { width }` + `--ig-stat-step`, `.ffx2hud__command { right }` |
| `src/scenes/gagazet.ts` | `ENEMY_SLOTS` |
| `src/scenes/zanarkand-dome.ts` | `ENEMY_SLOTS` |
| `src/scenes/dreams-end.ts` | `ENEMY_SLOTS` |
| `src/scenes/bevelle-underground.ts` | `ENEMY_SLOTS`, one `PARTY_SLOTS` entry |
| `src/scenes/farplane.ts` | `ENEMY_SLOTS` (three slots → four) |

**No camera rig moved.** Not one `position`, `lookAt`, `fov` or `sway` value in
any of the five scenes changed. That was a deliberate constraint: the rigs are
the art fleet's framing language, and the drama in the composition — low
three-quarter angles, the Bahamut wing shot, the Farplane reveal — lives in
them. Everything below is a change to where a figure *stands*, plus four HUD
column numbers. The bosses are the same size, at the same height, lit the same
way, and still sit centre-right.

The damage-numbers half of issue 3 (numerals drawn across the CTB column) is
`r2-damage-numbers-fan`'s, not this one's.

---

## 1. What was actually wrong

The report's evidence, re-measured live rather than read off a screenshot. Every
number in this document is a **fraction of the canvas**, `0` at the left/top
edge and `1` at the right/bottom, taken by projecting the eight corners of every
visible mesh in a staged actor through `camera.matrixWorldInverse` and
`camera.projectionMatrix` and comparing against `getBoundingClientRect()` on the
HUD's own panels.

| Chapter | Figure | Measured before | Verdict |
|---|---|---|---|
| 1 `seymour-flux` | Seymour Flux | right edge **0.862** | behind the CTB column |
| 1 `seymour-flux` | Mortiorchis | **0.815..1.128** | ~70% behind the column or off-screen |
| 2 `yunalesca` | Yunalesca | 0.581..**0.803**, y 0.194..**0.746** | over the column *and* into the party panel |
| 3 `braskas-final-aeon` | Braska's Final Aeon | right edge **0.878** | behind the column |
| 3 `braskas-final-aeon` | `yu-pagoda-left` | **0.887..1.009** | a whole targetable part off-screen |
| 4 `ffx2-bahamut` | Bahamut | 0.575..**0.930** | right wing behind the command window, wingtip off-screen |
| 5 `ffx2-vegnagun-shuyin` | Vegnagun tail | 0.436..**0.926** | the tip — the targetable end — under the menu |

Two of these are worse than "a sprite is partly covered":

* **Mortiorchis is the encounter's second enemy.** A player who cannot see it
  cannot read that Seymour is riding it.
* **`yu-pagoda-left` is a destructible part in the one fight whose whole tactic
  is "take the pillars"** (`research/ffx-bfa-yu-yevon.md` §5). It was rendered
  behind the queue and past the right edge of the screen.

### Why it happened

The five scenes were built in parallel against `src/scenes/types.ts`, which says
*"enemies right and further back"* and nothing about the HUD. Each scene solved
its own composition honestly and put its boss where an FFX battle puts one —
and then the HUD was laid over the top of all five. There was no shared number
for "how far right an enemy may go", so there was nothing for a scene to be
wrong about. That is the actual defect, and it is why the first thing this pass
produced was the number, not the slot edits.

---

## 2. The safe area

The full note, which is the durable artefact here, is
**`docs/ENGINE-API.md#hud-safe-area`**. Summary:

```
FFX     x <= 0.79   y <= 0.717
FFX-2   x <= 0.72   y <= 0.722
```

Both HUDs are a 640x360 authoring stage scaled by `min(w/640, h/360)` and pinned
to the canvas's top-left, so every panel lands on the same *fraction* of any 16:9
frame. Measured at 1600x900 and 1920x1080 the rails agree to ±0.001, which is
what makes a fraction the right unit for a scene to solve against.

The rails themselves:

| HUD | Panel | Rect (x0..x1, y0..y1) |
|---|---|---|
| FFX | CTB queue `.ig-ctb` | **0.843**..0.970, 0.138..0.557 |
| FFX | party status `.ig-stat-list` | 0.629..0.964, **0.717**..0.967 |
| FFX | command stack `.ig-cmd-stack` | 0.047..0.329, 0.568..0.928 |
| FFX | Sensor panel `.ffx-sensor` | 0.300..0.482, 0.067..0.283 |
| FFX-2 | party status `.ig-stat-list` | **0.725**..0.984, **0.722**..0.972 |
| FFX-2 | command window `.ffx2hud__command` | 0.745..0.981, 0.390..0.677 |
| FFX-2 | boss strip `.ffx2hud__enemies` | 0.033..0.407, 0.049..0.102 |
| both | strategy guide `.sgd__panel` | 0.033..0.240, 0.108..0.700 (soft) |

### 2.1 Why the right rail sits inboard of the panel

`0.79` is not `0.843`. The gap is deliberate and it is the single most important
thing to carry forward:

* every `idle` and `action` rig has `sway`, so the frame moves a little every
  frame and a slot solved to a static projection crosses the rail on some phase;
* a painted actor's **quad is wider than the figure on it** — the aura, the
  glow and the transparent margin all run to the plane's edge, and the quad is
  what the projection measures;
* a boss's own animation (a wing beat, a tail sweep) moves its silhouette
  inside the quad.

Chapter 1 is the worked example. Seymour was first re-solved from his nominal
width to x = 2.2, which projected to 0.783 — inside the rail *on paper*.
Measured live at both resolutions he came out at **0.793**, over the rail at
every sway phase sampled. He now stands at 1.95, 0.25 further left, which buys
0.021 of frame and lands him at 0.763. Solving to the panel rather than to the
rail is the mistake this margin exists to absorb.

### 2.2 Why the bottom rail is soft, and only for feet

A ground-planted boss's quad may descend a little past `y = 0.717`: there is
transparent margin under the painted feet, and the party column is anchored to
the bottom of the *right* half of the frame. What may not cross it is the
figure's readable mass — **no enemy's centroid and no targetable part's
centroid may fall below the rail**.

The alternative was rejected on sight. Lifting a boss's feet 3% of the frame
means pushing him far enough back that he stops being the largest thing in the
shot, which trades a partially-occluded boss for a small one. That is a worse
bug than the one it fixes, and it is exactly the "without shrinking the
composition's drama" constraint.

### 2.3 The CTB column's left edge is a stylesheet decision

This is the one rail that is not a constant of the HUD on its own. The queue's
rows are right-anchored and each carries a name plate, so without a cap the
column's left edge moves with whatever the longest combatant name in the
encounter happens to be. Measured in the live Chapter 2 queue, identical at
1600x900 and 1920x1080:

| `.ig-ctb` left edge | value |
|---|---|
| as it ships, current cast | 0.866 ("Yunalesca"), 0.856 ("Braska's F…") |
| **worst case under the cap**, any name | **0.843** |
| cap removed, one long name | 0.629 |

`.ffxhud .ig-ctb__name { max-width: 48px }` is what bounds it, and **0.843 is
the number the scenes solve against** — the leftmost the column can travel for
any name a later encounter brings, not the 0.866 today's cast happens to
produce. Uncapped, one name plate takes a third of the frame away from every
scene at once.

The cap is deliberately *shorter* than the cast's longest name, so
"Braska's Final Aeon" reads "Braska's F…" in the queue
(`docs/screenshots/r2/framing-braskas-final-aeon.png`). Everything else in the
five chapters fits whole. The full name is still rendered untruncated on the
target reticle and in the Sensor panel, so the abbreviation costs nothing the
player needs — and it buys every FFX scene ~5% of its usable width, permanently.

---

## 3. The four HUD numbers

Each one moves a panel's *inboard* edge, which is the edge a scene has to stand
clear of. None of them shrinks a row, a portrait or a glyph: every change is a
margin or a column width, and the type and the tiles are untouched.

| File | Rule | Before | After | Effect on the rail |
|---|---|---|---|---|
| `ffx/ffx-hud.css` | `.ig-ctb__name` `max-width` | *(none)* | `48px` | pins the CTB column's left edge at a worst case of 0.843 instead of "whatever the longest name is" |
| `ffx/ffx-hud.css` | `.ig-stat-list` `bottom` | `24px` (shared layer) | `12px` | party panel's top edge 0.684 → **0.717** |
| `ffx2/ffx2-hud.css` | `.ig-stat` `width`, `.ig-stat-list` `--ig-stat-step` / `right` | `170px`, `5px` / `12px` | `158px`, `4px` / `10px` | party column's left edge 0.700 → **0.725** |
| `ffx2/ffx2-hud.css` | `.ffx2hud__command` `right` | `17.78px` | `12px` | command window's left edge outboard to 0.745, *behind* the party column |

The second and fourth are the same move made twice, in opposite directions.

* **FFX's party column** was the binding *bottom* rail. At `bottom: 24px` its
  top edge is 0.684, and the two tallest FFX bosses stood through it — Braska's
  Final Aeon's quad reached 0.715 and Yunalesca's 0.725, both inside the panel's
  x span. `12px` drops the rail to 0.717, which clears Braska's Final Aeon
  outright and leaves Yunalesca 0.008 of quad inside — less than the transparent
  margin under her painted feet. 12 is also not a number invented to fit: the
  FFX-2 party column already shipped at `bottom: 10px`, so this brings the two
  halves of the game onto one rail rather than inventing a third. The panel's
  bottom edge lands at 0.967, still inside the letterbox.
* **FFX-2 had two competing right rails** — the party column at 0.700 and the
  command window at 0.745 — so the safe area was set by the party column, 0.045
  of frame inboard of the menu. Trimming the column to 158px, stepping the
  cascade by 4 rather than 5 and taking its own right margin from 12 to 10 pulls
  it back to 0.725 (12px + 2px + 2px on the 640-wide stage = 0.025 of frame);
  trimming the command window's right margin moves its *left* edge outboard to
  0.745. Now one rail binds instead of two, and Vegnagun gets that 0.025 back.

  None of that is a row getting smaller in any way a player sees: the rows are
  the same 28px tall with the same 17px sphere chip and the same type, and what
  came out is slack between the HP/MP block and the panel's right edge.

---

## 4. The five scenes

`ENEMY_SLOTS` is `[x, y, z]` in world units; the camera looks down -z, so **more
negative z is further from the camera**, which on these rigs is simultaneously
*further left* and *further up* the frame. That is the lever that does most of
the work below: depth buys horizontal room and lifts feet out of the bottom
panel at the same time, at a cost of a few percent of on-screen height, where
moving a boss sideways alone would have broken the centre-right composition.

| Ch | Scene | Slot | Before | After |
|---|---|---|---|---|
| 1 | `gagazet` | 0 boss | `[3.1, 0, -2.4]` | `[1.95, 0, -2.45]` |
| 1 | | 1 | `[5.3, 0, -1.0]` | `[1.8, 1.85, -7.0]` |
| 1 | | 2 | `[1.6, 0, -4.4]` | `[3.35, 0, -6.6]` |
| 2 | `zanarkand-dome` | 0 boss | `[2.95, 0, -2.9]` | `[2.5, 0, -4.0]` |
| 2 | | 1 | `[5.1, 0, -1.8]` | `[3.9, 0, -7.4]` |
| 2 | | 2 | `[1.0, 0, -4.4]` | `[0.9, 0, -6.2]` |
| 3 | `dreams-end` | 0 boss | `[2.9, 0, -2.5]` | `[2.05, 0, -4.0]` |
| 3 | | 1 right part | `[5.2, 0, -1.1]` | `[4.0, 0, -7.4]` |
| 3 | | 2 left part | `[1.4, 0, -4.6]` | `[0.6, 0, -6.0]` |
| 4 | `bevelle-underground` | 0 boss | `[3.3, 0, -2.6]` | `[1.05, 0, -5.8]` |
| 4 | | 1 | `[5.6, 0, -1.1]` | `[3.5, 0, -5.4]` |
| 4 | | 2 | `[1.8, 0, -4.6]` | `[-1.1, 0, -6.6]` |
| 5 | `farplane` | 0 boss | `[2.75, 0, -2.3]` | `[0.8, 0, -5.0]` |
| 5 | | 1 | `[5.3, 0, -0.8]` | `[2.3, 0, -8.0]` |
| 5 | | 2 | `[0.5, 0, -4.2]` | `[-0.5, 0, -6.6]` |
| 5 | | **3** | *(did not exist)* | `[1.0, 0, -9.4]` |

Each scene's own `ENEMY_SLOTS` block carries the numbers its boss measured, so
the next person to move one can see what it was solved for. The four cases worth
reading here:

### 4.1 Chapter 1 — slot 1 stops being a flank

There is no room left of the CTB column for a second 0.2-wide figure *beside* a
0.23-wide boss. Rather than shrink either, slot 1 became a **high back-left
float**: 4.6 units behind the boss and 1.85 up, landing Mortiorchis at
0.487..0.700, across Seymour's shoulder instead of off the edge of the screen.

That is also the better reading of the encounter. Mortiorchis is the thing
Seymour is *riding*, not a second soldier stood next to him, and the lift is
what keeps the two silhouettes from merging into one shape.

### 4.2 Chapter 3 — the widest FFX boss needs both levers

Braska's Final Aeon is 0.31 of the frame across, so 0.7 units left *and* 1.5
back — then 0.15 further left on the second pass (§5.1). The depth pays for most
of the first move: it narrows him to 0.29 **and** lifts his feet from 0.754 to
0.717, clear of the party panel. He still opens the fight
0.29 wide by 0.52 tall, centred at 0.64 — which is to say he is still the thing
the shot is about. The two Yu Pagodas then read as what they are, a matched
pair flanking him at 0.482..0.567 and 0.674..0.755, instead of one visible
pillar and one rumour behind the HUD.

### 4.3 Chapter 4 — moving the boss moved a party member

Bahamut came in 2.25 units left, which brought his **left wing across the
back-right party slot's column**. Paine moved 0.45 further left
(`[-0.45, 0, -1.35]` → `[-0.9, 0, -1.5]`) — the only party slot this pass
touched, and a consequence of an enemy slot rather than a framing change of its
own.

Measured at `idle`, she reads 0.361..0.444 x by 0.443..0.743 y, and the wing
above her reaches 0.410 x at 0.120..0.350 y. They **do** share a column; that is
correct, because the boss is behind her. What keeps her readable is the vertical
gap — her head tops out 0.09 of frame below the wing's lower edge — and that is
the margin the nudge bought back.

The two Bahamut part slots also moved *out of the pit*. Both of the old ones
stood inside `HOLE`'s ellipse — a boss part hovering over an open shaft, which
survived only because this chapter's boss has no parts. Substituting the new
slots into `((x - HOLE.x) / HOLE.rx)^2 + ((z - HOLE.z) / HOLE.rz)^2` gives 2.4
and 2.5, so both now stand on plate with room to spare.

### 4.4 Chapter 5 — a fourth slot, because three was a bug

`vegnagun-leg` fields **three** Nodes on slots 1–3
(`src/data/ffx2/enemies/vegnagun-leg.ts`), and `BattlePresenterStage.add` clamps
a slot index to the last published slot. With three slots, Node C was parked
exactly on top of Node B: two separately targetable parts sharing one
silhouette, in the chain's longest link. Publishing a fourth slot is the fix.

The tail itself is the widest figure in the game at 0.49 of the frame. It is now
0.303..0.713 — still 0.41 wide, still sweeping corner to corner, but it *ends*
inside the frame, so it reads as a tail rather than as a wall.

---

## 5. Verification

Measured live in the real app against a dev server on port 5243, one fresh page
load per chapter, at both **1600x900** and **1920x1080**. Every chapter's
battle-open frame was captured and read.

### 5.1 Enemy figures against the rail, at the `idle` rig

Projected bounds of every staged enemy actor, as fractions of the canvas. "Head
room" is the gap between the figure's right edge and its HUD's x rail.

| Ch | Figure | x @1600x900 | x @1920x1080 | head room | y (900) | centroid y |
|---|---|---|---|---|---|---|
| 1 | Seymour Flux | 0.531..**0.763** | 0.530..**0.763** | 0.027 | 0.060..0.673 | 0.367 |
| 1 | Mortiorchis | 0.487..**0.700** | 0.489..**0.702** | 0.088 | 0.108..0.358 | 0.233 |
| 2 | Yunalesca | 0.550..**0.744** | 0.549..**0.741** | 0.046 | 0.192..0.721 | 0.457 |
| 3 | Braska's Final Aeon | 0.491..**0.779** | 0.491..**0.779** | 0.011 | 0.190..0.716 | 0.453 |
| 3 | Yu Pagoda (right) | 0.674..**0.755** | 0.674..**0.752** | 0.035 | 0.419..0.647 | 0.533 |
| 3 | Yu Pagoda (left) | 0.482..**0.567** | 0.481..**0.566** | 0.223 | 0.425..0.672 | 0.549 |
| 4 | Bahamut | 0.410..**0.709** | 0.407..**0.706** | 0.011 | 0.107..0.611 | 0.359 |
| 5 | Vegnagun tail | 0.303..**0.713** | 0.302..**0.713** | 0.007 | 0.135..0.633 | 0.384 |

FFX rail `x <= 0.79`, FFX-2 rail `x <= 0.72`; bottom rail `y <= 0.717` / `0.722`
for the **centroid**. Every figure and every targetable part is inside both, and
the two resolutions agree to **±0.003**, which is the claim the fraction-based
safe area rests on.

Two rows are worth reading closely:

* **Braska's Final Aeon needed a second pass too.** The widest FFX boss first
  came to rest at 0.785 (1600x900) and 0.789 (1920x1080) — inside the rail, but
  by 0.001, and that 0.004 spread between two resolutions is a sample of exactly
  the variance the rail exists to absorb. 0.15 more units left put him at 0.779
  at both, with 0.011 of headroom, at no cost in width (0.288 either way),
  height or depth. He is now 0.064 clear of where the CTB column can actually
  reach and 0.077 clear of where it sits for this encounter.
* **Yunalesca's feet at 0.721** are 0.004 past the bottom rail. That is the soft
  rail working as intended — the quad's transparent margin, not her figure — and
  her centroid is 0.260 above it. `framing-yunalesca.png` shows the toe of her
  gown grazing the top edge of the Tidus row and nothing else.

**Bahamut needed one as well.** At `[1.2, 0, -5.4]` he measured 0.421..0.714
on one run and 0.415..**0.722** on another — a 0.008 swing from the wing beat and
the rig's sway, and the higher of the two is over the rail. This is precisely
the §2.1 failure, so it got the §2.1 answer: `[1.05, 0, -5.8]`, which is 0.011
clear at 1600x900 and 0.014 at 1920x1080 and costs under 3% of his on-screen
height. He is *not* in the pit at the new slot —
`((1.05 - 2.4)/2.5)^2 + ((-5.8 + 7.8)/1.6)^2 = 1.85`, outside `HOLE`'s ellipse.

### 5.2 The `action` rig

The rule is not only about the opening frame: *"its head, torso and every
targetable part must stay inside the safe area at `action` too"*. Re-measured at
`action` on all five, 1600x900:

| Ch | Figure | x | head room | centroid y |
|---|---|---|---|---|
| 1 | Seymour Flux | 0.436..0.678 | 0.112 | 0.383 |
| 1 | Mortiorchis | 0.396..0.616 | 0.174 | 0.246 |
| 2 | Yunalesca | 0.498..0.712 | 0.078 | 0.449 |
| 3 | Braska's Final Aeon | 0.429..0.727 | 0.063 | 0.468 |
| 3 | Yu Pagoda (right) | 0.622..0.701 | 0.089 | 0.550 |
| 3 | Yu Pagoda (left) | 0.422..0.511 | 0.279 | 0.563 |
| 4 | Bahamut | 0.327..0.624 | 0.096 | 0.370 |
| 5 | Vegnagun tail | 0.243..0.658 | 0.062 | 0.394 |

Every `action` rig is a push-in along roughly the same view axis, so everything
on the field moves *left* and the right rail gets easier, not harder — the
tightest case at `action` (Vegnagun's tail, 0.062) has nine times the headroom
of the tightest case at `idle`. Feet drop further, to 0.740 for Yunalesca and
0.739 for Braska's Final Aeon, which is the soft bottom rail doing its job:
their centroids are 0.27 and 0.25 of the frame above it.

The pass also confirms Chapter 4's party nudge holds under the push-in: Paine
reads 0.279..0.363 x by 0.444..0.747 y against a wing at 0.327 x, 0.118..0.36 y
— the same ~0.08 of vertical separation the `idle` frame has.

### 5.3 Frames

Read at both resolutions:

| Chapter | 1600x900 | 1920x1080 |
|---|---|---|
| 1 `seymour-flux` | `docs/screenshots/r2/framing-seymour-flux.png` | `…-seymour-flux-1080p.png` |
| 2 `yunalesca` | `…/framing-yunalesca.png` | `…-yunalesca-1080p.png` |
| 3 `braskas-final-aeon` | `…/framing-braskas-final-aeon.png` | `…-braskas-final-aeon-1080p.png` |
| 4 `ffx2-bahamut` | `…/framing-ffx2-bahamut.png` | `…-ffx2-bahamut-1080p.png` |
| 5 `ffx2-vegnagun-shuyin` | `…/framing-ffx2-vegnagun-shuyin.png` | `…-ffx2-vegnagun-shuyin-1080p.png` |

### 5.4 Re-measuring after a change

The rails are **measured, not asserted**, so re-measure after any change to a
slot, a rig, or a HUD column's width or margin. The probe is
`critic/scratch/zz-r2-framing-measure3.tmp.mjs`:

```
npx vite --port 5243 --strictPort &
node critic/scratch/zz-r2-framing-measure3.tmp.mjs \
  --url=http://localhost:5243/ --width=1600 --height=900 \
  --out-dir=docs/screenshots/r2 --prefix=framing-
```

It opens each chapter with `skipCutscenes / skipPrep / seed: 1`, waits for a
populated CTB list rather than a frame count, then reports every staged actor's
projected bounds and every HUD panel's rect as fractions of the canvas. `--rig`
re-shoots at a named rig, `--suffix` names the output, `--only` limits the set.

It stubs `@vite/client` so HMR cannot reload the page mid-probe — with several
agents editing the tree at once, an un-stubbed run measures a half-applied
frame.

---

## 6. Deliberately not done

* **The strategy guide is a soft rail, and it is not this pass's to move.**
  `.sgd__panel` (`src/ui/common/strategy-guide.css`, `left: 21.33px; width:
  132px`) occupies 0.033..0.240 and reaches up to y 0.108 — over the party's
  *heads*, not their boots, which is unlike the command stack beneath it. A
  party slot left of 0.240 is behind it for as long as it is up. It is
  dismissible with `G`, so it does not occlude anything permanently, and its
  geometry belongs to the guide's owner. Recorded here so it is a known
  trade rather than a surprise.
* **No boss was scaled down and no rig was re-aimed.** Both were available and
  both were rejected: shrinking the boss and pulling the camera back are the two
  ways to satisfy the rail while losing the reason the shot exists.
* **`enemyHeight` / `partyHeight` untouched.** Every figure is the same world
  size it was.
* **The damage-numeral collisions** in issue 3 are `r2-damage-numbers-fan`'s.
  This pass only moved what the numerals are drawn *over*.
