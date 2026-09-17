# Polish pass: FFX-2 battle screen (`ffx2-battle`)

Scope: `src/ui/ffx2/**`, the FFX-2 party-slot seam in
`src/app/screens/BattleScreenSetup.ts`, and the `partySlots` tables in
`src/scenes/bevelle-underground.ts` / `src/scenes/farplane.ts`.

Reported defects (`docs/screenshots/52-ffx2-bahamut.png`,
`53-ffx2-vegnagun.png`):

1. Yuna and Rikku drawn on top of each other; all three stacked in 53.
2. The ATB party panel covering the actors.
3. Paine's row showing a truncated `CU` label.
4. Boss HP an unstyled pink bar — no name styling, no numerals.
5. **No damage numbers at all** in FFX-2 battles.

All five are fixed. The sixth thing found on the way — the one that was
actually producing defect 4 — is in §4.

---

## 1. The three girls stand in three slots

`PARTY_SLOTS` in both X-2 scenes zig-zagged: front at x -1.5, middle swung
**out** to x -2.9, back in again to -1.0. That is the FFX arc, and it is wrong
for the rigs these two scenes actually fight at — `action` swings right, which
projected the middle slot to screen x 101 of 1600 while the front slot landed at
317, and the two silhouettes (~170 px wide) overlapped at every rig between.

Both tables are now a clean stagger — right and back, one step at a time — so
the row reads front to back the way the FFX scenes do:

| slot | Bevelle | Farplane |
|------|---------|----------|
| 0 Yuna, front-left | `[-2.05, 0, 1.45]` | `[-2.3, 0, 1.45]` |
| 1 Rikku, middle | `[-1.3, 0, 0.1]` | `[-1.45, 0, 0.1]` |
| 2 Paine, back-right | `[-0.45, 0, -1.35]` | `[-0.55, 0, -1.3]` |

Measured at 1600x900 with `stage.project` in the live Bahamut fight, the three
chest points land at **x 209 / 414 / 580** (y 640 / 580 / 534) — ~200 px apart
against silhouettes ~170 px wide, depth falling away left to right.

Slot order is the build's `members` order. That seam is now commented in
`BattleScreenSetup.ts`: `src/battle/ffx2/setup.ts` numbers the girls `0,1,2` in
`members` order and `PaintedStage.add` *clamps* into the scene's table
(`spots[Math.min(c.slot, spots.length - 1)]`), so a fourth member would be
parked silently on top of the third. `setupForChapter` now warns when a chapter
ships more FFX-2 members than the scenes have slots.

## 2. The ATB panel is off the actors

The shared Ink & Gold layer anchors `.ig-stat-list` bottom-**left** for FFX-2,
mirroring FFX. That is right for the approved mock, where the girls stand
centre-right and the bottom-left corner is empty scenery — but our scenes stand
them in the FFX arc, lower-left, so the mirrored panel sat on all three from the
waist down.

The panel moved rather than the formation: bottom-**right**, which is also where
`research/visual-bible.md` §4.1's own FFX-2 screen map puts party status
(`x276 y278 w348 h72`). It also shrank — 170x28 rows instead of 200x27.56 — and
the rows cascade with `margin-right` so the step comes off the anchored edge.

Live boxes at 1600x900: panel `1120,650 → 1570,875`; rightmost actor x 580. No
overlap at any rig, and it clears the command stack (`bottom: 116.44px`) above
it.

Two shape changes inside the row, both to stop it overflowing itself:

- a two-line body — `Name HP MP [chips]` over a **full-width ATB track**, which
  is §4.3's verified layout requirement ("the ATB bar sits under the HP and MP
  data") and the only way 240 px of content fits a 170 px row. Paine's chip used
  to hang off the end, which is how it got cut to two letters in the first place;
- the track is **right-aligned** (`margin-left: auto`). Its width is
  `required`-proportional per §4.3's "higher Agility = shorter bar to fill";
  left-aligned, a set of different widths only reads as ragged.

## 3. `CU` — and `W` for two different jobs

`CU` was `'curse'.slice(0, 2)`. Slicing status ids also collapsed the whole
Up/Down family into five identical pairs (`ST`, `MA`, `DE`, `AC`, `EV`), because
each buff shares its first two letters with its own debuff.

`src/ui/ffx2/statusChips.ts` authors the glyphs instead: <= 3 characters, with
the stack arrow carrying the sign (`STR▲` / `STR▼`) and the stack level as a
superscript. Curse is `CRS`. Anything not in the table falls back to three
letters, which is only reachable by a status the table has not caught up with —
and three letters of a real word still reads as a word. Hidden bookkeeping
statuses (`delay-effect`, `action-cancel`, `shattering`) are dropped entirely.

The same fault was in the dressphere tile: `id.charAt(0)` drew the **same `W`**
for Paine's Warrior and Yuna's White Mage (visible in `52-ffx2-bahamut.png`),
and would collide again on Gunner/Gun Mage, Samurai/Songstress, Thief/Trainer,
Mascot/Machina Maw. `dressphereIcons.dressphereAbbr()` is now an authored
two-letter table — `WM`, `DK`, `WR` — shared by the battle row, the Garment Grid
wheel and Party Prep, so the three surfaces name a job the same way.

## 4. The boss strip — and why it was "an unstyled pink bar"

**Root cause, and the highest-value find in this pass:**
`src/ui/ffx2/theme.css` defines all twelve `--x2-*` colour tokens on `:root`,
and it was imported by **`PartyPrep.ts` and nothing else**. Every battle entered
with `skipPrep` — which is every automated capture, and the chapter flow's own
fast path — therefore mounted the FFX-2 HUD with all of those tokens undefined.
`background: var(--x2-atb-track)` and
`linear-gradient(90deg, var(--x2-atb-lo), var(--x2-atb-hi))` resolved to nothing
at all, so the enemy track was **transparent** and the only thing still painting
on it was the fill's `inset -1px 0 0 #fff` leading edge: a white tick floating on
a bar that was not there. The status chips lost their pink slab the same way.

`FFX2BattleHud.ts` now imports `./theme.css` before `./ffx2-hud.css`. Verified
in the live fight: `--x2-atb-track` `#2a1a30`, fill
`linear-gradient(90deg, rgb(176,72,158), rgb(247,182,217))`, chip background
`rgb(90,42,78)`.

On top of that, `src/ui/ffx2/BossGauges.ts` replaces the one bare `.ig-bosshp`
per enemy with a real strip:

- **name** in the shared `.ig-bosshp__name` serif italic, on an `--ig-ink-panel`
  slab so it survives a bright painted backdrop (the Farplane frame is pastel
  edge to edge and paper-on-nothing vanished into it);
- **HP numerals** in §4.3's `1240/1980` treatment, gold-critical under 33% —
  but only once the fight has earned them. X-2 hides enemy HP until Scan
  reveals it, so an unrevealed boss prints a `SCAN` hint in the numeral slot;
  the empty slot is deliberate rather than missing. See the blocker below.
- **part bars** for Vegnagun's Bulwarks / Redoubts / Nodes, indented under their
  owner (`flags.partOf`) at two thirds the track width, so "kill the arms before
  you look it in the face" is legible from the bar layout alone. A part with
  `hideHpBar` is omitted; a destroyed one holds its row with a `DOWN` tag so the
  rows below it do not jump. Stacking is normal flow — the previous version
  positioned each row from an inline `top: calc(17.78px + i * 26px)`, which
  could not account for a row that grew a part list under it.

A part row also carries its own ink (78%) rather than the shared 62% chip
token, and a destroyed row dims its *contents* rather than the whole row: over
the Farplane's pastel sky, a `DOWN` row at `opacity: .5` on a 62% slab took the
ink with it and the strip turned to fog.

## 4b. The telegraph banner no longer says the same thing twice

Bahamut's Mega Flare countdown emits the number **as** the charge event's state
text (`src/battle/ffx2/ai/bahamut.ts`: "five consecutive actions that do nothing
but display a number"), so the banner read `BAHAMUT · 4 TURNS` in the chip next
to a headline of `4`. When the state text is a bare countdown the chip now drops
the duplicate and the numeral carries it alone; a named state
(`Memento Mori`, `Ready to Annihilate`) is unchanged.

## 5. Damage numerals in FFX-2

FFX-2 battles drew **no numerals whatsoever**. `BattleScreen` only builds a
`DamageNumbersPort` for the presenter when `ui/common` has registered a factory
or when there is no HUD at all (`BattlePresenterFallbacks.uiPortsRegistered()`),
and nothing registers one — so with a HUD mounted the presenter's port was
`null` and the figure was simply never drawn.

`docs/CONTRACT-CHANGES.md` decision 12 settles where it belongs: the HUD mounted
for a battle owns its numerals, and both games share the one implementation in
`src/ui/common/DamageNumbers.ts`. `src/ui/ffx2/DamageLayer.ts` is the FFX-2
adapter (the FFX side has its own in `src/ui/ffx/DamageNumbers.ts`). It supplies
only what is X-2-specific:

- the **letterbox scale**, because §3.6's sizes are quoted on the 640x360 grid
  and the numeral layer is the HUD's *unscaled* overlay — without it a plain hit
  draws at 16 real pixels;
- the **avoid rects**: `.ig-stat-list`, `.ffx2hud__command`, `.ig-cmd-stack`,
  `.ffx2hud__enemies` and `.ffx2hud__telegraph` are opaque ink, queried live
  (the command stack grows a level at a time, the boss strip grows a row when a
  part appears, the banner comes and goes).

Motion is driven from `HudPort.update(dt)`, not a `requestAnimationFrame` of its
own, so numerals freeze with the game loop when `App.stop()` pauses it for a
screenshot — the same reason `FFXBattleHud` does it. Nothing draws twice: the
presenter's port stays `null` on this side.

`damage` / `heal` / `miss` / `mp-damage` / `mp-heal` all route through
`spawnEvent` untranslated, so the two contract details that are easy to get
backwards stay right: a `heals` action arrives as a **`damage` event with a
negative amount**, and `affinity: 'absorb'` outranks the sign. Each hit also
flashes the target's own `.ig-stat` / `.ig-bosshp` row, which is what connects a
figure floating over the field to the bar that just moved.

The `CHAIN ×N` chip stays a separate thing from the numeral, anchored up and to
the right of the target's projected head point so it clears the numeral ladder.

### Shared module, other owner

`src/ui/common/DamageNumbers.ts` is being refactored by another agent
concurrently. Everything this pass touches — `DamageNumbersOptions`
(`root` / `className` / `anchor` / `project` / `scale` / `avoid`), `mount`,
`unmount`, `clear`, `spawnEvent`, `update(dt)`, `count` — is confined to
`DamageLayer.ts`, so if that API moves again **`src/ui/ffx2/DamageLayer.ts` is
the only file to fix on the X-2 side.** As of this pass it had not changed under
me.

---

## Verification

Dev server on port 5204, captures at 1600x900 via
`__pyrefly.gotoChapter(id, { skipCutscenes: true, skipPrep: true, seed: 1,
auto: 'intended', speed: 'normal' })`.

| Shot | What it shows |
|------|---------------|
| `docs/screenshots/polish/ffx2-bahamut-open.png` | three girls in three slots, panel bottom-right, styled boss strip, `WM`/`DK`/`WR` tiles, `CRS` chip |
| `docs/screenshots/polish/ffx2-bahamut-hit-1.png` | live damage/heal numerals over the field, telegraph banner |
| `docs/screenshots/polish/ffx2-bahamut-scanned.png` | the boss strip with HP numerals revealed (`6278/8400`) |
| `docs/screenshots/polish/ffx2-vegnagun-shuyin-open.png` | Farplane formation, boss strip legible over the pastel sky |
| `docs/screenshots/polish/ffx2-vegnagun-shuyin-hit-1.png` | numerals in the Vegnagun chain |
| `docs/screenshots/polish/ffx2-vegnagun-shuyin-hit-2.png` | same, later |
| `docs/screenshots/polish/ffx2-vegnagun-shuyin-scanned.png` | revealed numerals (`29496/34200`) |
| `docs/screenshots/polish/ffx2-vegnagun-shuyin-parts.png` | the part-bar hierarchy — owner, two Bulwarks, a Redoubt, one held as `DOWN` |

Measured with `stage.project` in the live fights at 1600x900:

| | Yuna | Rikku | Paine | party panel |
|---|---|---|---|---|
| Bevelle | x 207 | x 413 | x 579 | `1120,650 → 1570,875` |
| Farplane | x 199 | x 407 | x 568 | `1120,650 → 1570,875` |

**The parts shot is synthetic and labelled as such.** The chain is
tail → leg → body → head → Shuyin and the party is wiped in the *tail* fight, so
no automated run reaches a link that fields parts. That capture renders the
shipping `enemyGaugesHtml` from the live dev module into the live HUD's own
enemy slot, over the real Farplane frame; only the battle state under it is
faked. Once the tail fight is survivable it should be re-taken for real.

`npx tsc --noEmit` is clean.

## Blockers / notes for other owners

1. **Nothing emits the `sensor` event in FFX-2.** `x2-gun-mage-scan` exists in
   `src/data/ffx2/abilities/gun-mage.ts` (and the enemies carry `sensorText`),
   but `src/battle/ffx2/engine.ts` resolves it as an ordinary zero-power action
   and never emits `{ type: 'sensor' }`. The HUD handles the event and reveals
   the numerals correctly — the `-scanned.png` shots above were produced by
   feeding the event straight to the HUD through the debug API — but in real
   play the boss strip can never leave its `SCAN` state. Engine-side fix,
   not mine: emit `sensor` when that ability resolves.
2. **`first-mega-flare-countdown` wedges for 30 s in the Bahamut fight.**
   `runMidBattleScript` hides the entire HUD for the length of a mid-battle
   story beat, and this one hits its 30 000 ms budget every run
   (`[presenter] mid-battle script "first-mega-flare-countdown" did not finish
   within 30000ms`). For half a minute of that fight there is no UI on screen at
   all, which is why the capture script has to gate every shot on
   `.ffx2hud:not([hidden])`. Story/presenter owner.
3. **The party loses the Bahamut fight under `auto: 'intended'` at seed 1** —
   all three KO. Balance/tactics, not presentation.
4. Vite's HMR client full-reloads the page whenever a concurrent agent saves a
   file in `src/`, which destroys a capture mid-run. The capture script stubs
   the `vite-hmr` WebSocket in an init script; worth copying into
   `tools/gallery.mjs` if galleries keep dying while the fleet is working.
5. `src/ui/ffx2/minigames.css` lost its defensive
   `.ig-minigame.ffx2-trigger / .ffx2-reels` opacity override in this working
   tree. **That is correct now** and was checked rather than reverted:
   `src/ui/ffx/minigames/overdrive-minigames.css` scopes its enter-animation to
   `.ig-minigame.ffx-mg`, so the bare `.ig-minigame { opacity: 0 }` that used to
   hide the X-2 overlays is gone. If that file ever un-scopes itself again, the
   X-2 minigames go invisible and the override has to come back.
