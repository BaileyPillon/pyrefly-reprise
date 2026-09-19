# fix3 — ffx2-hud-prep

Track: FFX-2 HUD and prep screens, plus the shared portrait crop logic.
Owns `src/ui/ffx2/**`, `src/ui/ffx/party-prep/**`, `src/ui/common/party-prep.css`,
`src/ui/common/portrait.ts`.

This round is the **fix pass** on the critic's pass 1 (`fba91ae`), which drove
the previous round live and refuted four things its own DOM matrix could not
see. Three of the four carried-over defects from the original brief were
confirmed closed by that critic pass and are not re-litigated here.

---

## What changed

### 1. The chain counter's pop is inside the placement solver now

`ChainCounter.show()` measured `el.offsetWidth/offsetHeight` — the **layout**
box — handed that to `placeSlab`, and *then* added `.ffx2chain--pop`, whose
keyframe scales the painted chip to 1.45 about its centre on every increment.
The solver had therefore never seen the box the player sees.

Measured by the critic at the 50% keyframe, 1280x720, chapter 4:

| | layout box | painted box |
|---|---|---|
| size | 167x95 | 242.4x137 |
| position | (665.9, 12) | (628.3, **-9.3**) |

9.3 px above the overlay, clipped away by `.ffx2hud`'s `overflow: hidden`;
166.8x5.2 onto Bahamut; 33.8x102.8 onto the enemy-intent slab — *larger* than
the 99x81 the previous handoff recorded as the **pre**-fix state. It reproduced
at counts 3/7/12/22, at all four viewports, in both FFX-2 chapters.

The fix is structural, not a fudge factor. `.ffx2-chain-chip` is now an **empty
reservation box** sized by `show()` to the pop's peak (`CHAIN_POP_SCALE`, 1.45),
and the ink slab is an inner `.ffx2chain__body` centred in it. The body is what
scales. So the box `placeSlab` places, the box
`FFX2BattleHud.intentObstacles()` measures as `.ffx2-chain-chip`, and the box
the player sees are the same rectangle at every point in the animation.

A second bug fell out with it: a transform makes an element the containing
block for `position: fixed` descendants, so while the pop was running
`.ffx2chain--flash::after`'s **full-screen** §4.6 flash had been collapsing to
the chip's own bounds and snapping back 0.18 s later. The chip is never
transformed now, so the flash is viewport-fixed throughout.

### 2. Cancelling out of target selection no longer commits the wrong command

`CommandMenu.ts` sent *every* cancel in the `target` view to
`renderSub(subCategory)`, whether or not the pending command had been reached
through a submenu. From a top-level leaf, `subItems`/`subCategory` still held
whatever submenu was opened last. The line predates this work, but the previous
round is what made the stale submenu able to be **Change** — the one submenu
whose rows cost the entire turn.

Driven live in chapter 4: open Change, Esc, arrow to Attack, Enter (reticle on
Bahamut), Esc — the window redrew the **Change** submenu *with the reticle
still up*, and the next Enter logged
`{"type":"spherechange","who":"paine","from":"warrior","to":"gunner"}`. The
player pressed Attack and spent Paine's whole turn on a spherechange. With no
submenu ever opened it was quieter and just as broken: an empty command window
that swallowed ArrowDown/ArrowUp/Enter until a second Esc.

The menu now records `pendingFrom` — the view the row was picked in — and goes
back *there*, clearing `targetLayer` and the pending command on the way. The
reticle-plus-menu state is gone because clearing the reticles was half the fix.

### 3. The Change submenu shows the outfit names it exists to show

`.ffx2cmd__grants` was `flex: none` inside `.ig-cmd`'s fixed 129.78x23.11 box,
so the **label** was the flex item that shrank: "Black Mage" got 27 of the 72 px
it needs and rendered "BL…", "Gunner" rendered "GUN…". `textContent` is
untouched by a CSS ellipsis, which is exactly why the previous round's evidence
(`["Gunner GRANTS: Red", "Black Mage GRANTS: Yellow"]`) said the names were
fine.

Rows that carry a gate line now get `.ffx2cmd--gate`, which wraps the row and
drops `GRANTS:` onto its own line beneath the name, right-aligned under the
right-anchored stack. **The row is deliberately not widened**: the command
window's left edge is the wall the scene has to stand its boss clear of
(`.ffx2hud__command`'s `right: 12px` note, `docs/ENGINE-API.md#hud-safe-area`),
and moving it outboard costs the stage more than the gate line is worth.

### 4. The FFX Equipment tab names its auto-abilities

It printed `def.autoAbilities` raw — `strength-10`, `hp-10`, `zombie-ward` —
three lines from the Items tab the same round had routed through `itemLabel()`.
New `src/ui/ffx/party-prep/autoAbilityLabels.ts` transcribes FFX's own names for
the whole `AutoAbilityId` union.

Transcribed, not derived, and the module comment says why: a `kebab -> Title
Case` helper gets a handful right and the rest wrong. FFX writes the percentage
families as `Strength +10%`, the counter as `Evade & Counter`, the auto-status
family hyphenated (`Auto-Haste`) but the SOS family not (`SOS Haste`), the
elemental nulls in medial caps (`SOS NulBlaze`), strike/touch/proof as one
closed word (`Zombiestrike`, `Stoneproof`) but wards as two (`Zombie Ward`).
The map is typed `Record<AutoAbilityId, string>`, so a new id in the union fails
`tsc` rather than leaking onto the screen.

### Also: `yuna-white-mage`'s face-crop row was stale

Not one of the four, and not caused by this track: the art fleet re-rolled and
**horizontally mirrored** `public/art/characters/yuna-white-mage/idle.png` at
14:41 today (758x1172 -> 581x1183; `idle.json` carries `flipped: true` and a
`flipNote`). The measured row in `face-crops.json` still described the old
painting, so her eye line landed at 0.766 against the house 0.42 — on her
collarbone — and `ui-portrait-face-crop.test.ts` was red before this round
touched anything.

Re-measured off the pixels with the project's own rig
(`tools/portraits/measure-face-crops.mjs sheet yuna-white-mage`), not from
memory: `fx 0.6333, fy 0.1079, ipd 0.0861, px [581, 1183]`. Note the rig's
`detectHead` reports `headCentreX` 0.702 for this file — that is the raised
**hood**, not her face, which is why the row is measured by hand off the
contact sheet.

---

## FFX vs FFX-2

Bailey's standing rule for this round: a change true to one game does not get
applied to the other. This track kept them apart by construction.

- 1, 2 and 3 are `src/ui/ffx2/` only. FFX has no chain mechanic and emits no
  `chain` event; it has no spherechange; and it has its own
  `src/ui/ffx/CommandMenu.ts`, which is untouched.
- 4 is `src/ui/ffx/` only. FFX-2 has **no auto-abilities** — its equivalent is
  the accessory table plus dressphere skillsets, which
  `src/ui/ffx2/party-prep/panels.ts` already names through `abilityName()` and
  `accessoryEffect()`. Giving X-2 an auto-ability list would be inventing a
  mechanic it does not have.

---

## How it was verified

`npx tsc --noEmit` clean. Targeted vitest 145/145 green across
`ui-ffx2-chain-flourish`, `ui-ffx2-command-menu`, `ui-ffx-party-prep`,
`ui-ffx2-prep-stats`, `ui-portrait-face-crop`.

The full suite was run once: **3928 of 3929 green**. The one failure is
`tests/unit/menu-cancel.test.ts:195` and it is **not from this round** — it
reproduces identically with `CommandMenu.ts` checked out at `b8e3889^`. See
"What is left".

Live on a vite dev server (port 5732) with real `page.keyboard` presses,
chapters 4 and 5, at 1280x720 / 1600x900 / 2000x1000 / 2560x1440 — the full
2 x 4 matrix green on all three FFX-2 defects, plus the FFX Equipment tab.
Rig: `critic/scratch/fix3-ffx2-hud-prep-fix/verify.mjs`; output
`docs/screenshots/fix3/ffx2-hud-prep/verify.json`, screenshots
`pop-*`, `change-submenu-*`, `cancel-*`, `ffx-equipment-tab-*` in the same
directory.

The rig deliberately measures what the critic measured, not what the fix makes
easy. In particular it freezes **`.ffx2chain__body`** at the 50% keyframe and
measures the body — freezing `.ffx2-chain-chip` the way the critic's
`pop-overflow.mjs` did would now freeze nothing and report "inside" trivially.

Representative numbers, chapter 4 at 1280x720, all four tiers:

```
count  3: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count  7: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count 12: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
count 22: reserved 243x138@(376.5,101.5)  painted 242.4x137@(376.8,102)  inside
```

The painted size is byte-identical to the critic's 242.4x137 — the same box,
now placed instead of clipped, with zero fighter and zero panel overlaps.

Submenu labels, measured as `scrollWidth`/`clientWidth` (what `textContent`
could not see):

```
"Gunner"     gate=true  label 96/96  not clipped  grants "GRANTS: Red"    107/107 not clipped
"Black Mage" gate=true  label 107/107 not clipped grants "GRANTS: Yellow" 107/107 not clipped
"White Mage" gate=false label 71/71  not clipped   (no gate crossed -> no marker, no second line)
```

Cancel path, real key presses. Both branches of `pendingFrom` are driven,
one per chapter, because **`Attack` is a top-level leaf in chapter 4 but a
group row in chapter 5** (its category carries two commands there, so
`groupRows` opens a submenu). Chapter 4 therefore exercises
target -> top and chapter 5 exercises target -> the submenu it came from:

```
ch4  cancel (picked from a top-level leaf): reticles 1 -> 0; title ""; rows ["Attack","Skill","Change","Item"]
     committed after cancel: ["turn-start","action-start","chain","damage","action-end",...]
```

An attack, and no `spherechange` anywhere in the log.

The first version of this rig reported chapter 5 as a failure at every
viewport. It was the rig, not the build: it assumed `Attack` was a leaf, so
its Enter opened the Attack submenu, no reticle appeared and it concluded the
cancel path was broken. The diagnostic that settled it is
`critic/scratch/fix3-ffx2-hud-prep-fix/ch5diag.mjs`:

```
2 after Enter  {"screen":"battle","title":"Attack","rows":[{"t":"Attack"},{"t":"Attack"}],"reticles":0}
3 after Esc    {"screen":"battle","title":"","rows":["Attack","Skill","Change","Item"],"reticles":0}
```

Worth recording for whoever owns FFX-2 targeting: that submenu has **two rows
both reading "Attack"**. The HUD groups by `category` and labels each row with
the command's own `label`, so two `attack`-category commands with the same
label render as two identical rows. Whether chapter 5 should be offering two
attack commands at all is an engine/data question, not a HUD one —
`window.__pyrefly` exposes no accessor for the raw `AvailableCommand[]`, so
this is reported from the DOM rather than guessed at.

---

The FFX Equipment tab, chapter 1, Tidus (`ffx-equipment-tab-1600x900.png`):

```
FFX prep tabs: ["CHAPTER","STATS","SPHERE GRID","EQUIPMENT","ITEMS","OVERDRIVE"]
equipment chips: ["Strength +10%","HP +10%","Zombie Ward"]
```

Those are the same three the critic reported as `strength-10`, `hp-10`,
`zombie-ward`.

Two notes for anyone re-running the rig, both of which cost a run each here:

- `gotoChapter`'s `skipPrep` **defaults to true**, so reaching the prep screen
  needs `{ skipPrep: false }` explicitly.
- the prep screen's name is `party-prep`, not `prep`.

The rig drives at `setBattleSpeed('normal')`, not the critic rig's `'fast'`.
The cancel sequence is a dozen real key presses inside one actor's turn, and
at `'fast'` the turn can lapse mid-sequence — which surfaces as "never reached
target selection", a rig artefact that says nothing about the build. The rig
reports that case as an explicit failure rather than a pass, and retries up to
six times before doing so.

---

## What is left

**For the art track.** `public/art` is gitignored, so a re-roll silently
invalidates a `face-crops.json` row and the guard test is the only thing that
notices. When a character's `idle.png` or portrait is re-rolled, please
re-measure that row in the same change:

```
node tools/portraits/measure-face-crops.mjs sheet <id> out.png   # read the eye line off the grid
node tools/portraits/measure-face-crops.mjs detect               # head-top / head-centre cross-check
```

`yuna-white-mage` is current as of 2026-09-19 14:41. If the sweep that produced
`idle-c.*` picks a different candidate, the row needs re-measuring again — the
guard test will say so.

**For the FFX-HUD / cancel-claim track — one red test, not ours.**
`tests/unit/menu-cancel.test.ts:195` ("takes Esc in a submenu and gives it back
on the way out", FFX-2 block) expects `menuOwnsCancel()` to be `false`
synchronously after the `Escape` that leaves a submenu. It is `true`.

It is not this round's: checking `src/ui/ffx2/CommandMenu.ts` out at
`b8e3889^` and re-running gives the identical failure. The cause looks like a
timing contract rather than a logic bug — `releaseCancelAfterPress()`
(`src/ui/ffx/cancelClaim.ts:93`) defers `setMenuOwnsCancel(false)` to
`nextFrame()` **by design**, because the claim has to outlive the press that
caused it, and the test asserts on the same tick. Both files belong to that
track, so this round did not touch either.

While you are in there: that module's header still describes FFX-2's cancel as
stepping "`target -> sub -> top`". As of this round it steps
`target -> wherever the command was picked from -> top`, which is the point of
defect 2 above.

**Standing request, unchanged from the previous round.** `EnemyIntent.layout`
(another track's file) still resolves its obstacle list in a single greedy pass,
which is why `src/ui/ffx2/intentPlacement.ts` exists to steer it from the
outside. A real placement pass in `layout()` would make that whole module
unnecessary.

**Standing request, new.** `Ffx2Engine.gridNodes` is private, so the Change
submenu can only list *reachable* destinations, not open the full Garment Grid
the way `SpherechangeWheel.ts` is built to. If that data is ever handed to a
HUD, the Change row should open the grid proper (§4.5.2).

**Not done, and out of this track's lane.** The `.ig-cmd` row box
(129.78x23.11, `src/ui/inkgold/slabs.css`) is tight enough that any row wanting
a label plus a trailing chip has this same collision waiting. Fixed here only
for gate rows, from `ffx2-hud.css`. If the Ink & Gold track ever revisits that
slab, a variant with room for a secondary line would let `.ffx2cmd--gate` go
away.
