# Playability round 1 — the optional in-battle strategy guide

**Key:** `strategy-guide`. Port 5304.

Owns `src/ui/common/StrategyGuide.ts`, `src/ui/common/strategy-guide.css`,
`src/engine/tactics/guide.ts`, `src/data/guides/**`,
`tests/unit/strategy-guide.test.ts`, `tests/unit/ui-strategy-guide.test.ts`,
plus small additive edits in `src/ui/ffx/FFXBattleHud.ts`,
`src/ui/ffx2/FFX2BattleHud.ts`, `src/app/SaveData.ts` and
`src/ui/common/ControlsHint.ts`.

Nothing else was touched. `public/art/**`, `src/ui/common/DamageNumbers.ts`,
`damageLadder.ts`, `damage-numbers.css`, `src/ui/ffx2/DamageLayer.ts`,
`src/scenes/*`, `ffx-hud.css`, `src/ui/ffx2/*.css` and
`src/engine/tactics/braskas-final-aeon.ts` were read only — the last of those
is run, read-only, every time the panel draws a NEXT line.

---

## 1. What it is

A side slab on the **left** edge of the battle HUD, inside the same 640x360
letterboxed stage as the rest of the chrome, with three parts:

* **NEXT** — the command the chapter's shipped tactic would pick for the
  character who is deciding right now, the target it would aim at, and one
  cited sentence on why: *"Holy Water → Auron — Auron is a Zombie and the
  Mortiorchis answers with Full-Life; cured first it whiffs outright, left alone
  it is 100% of max HP plus a Death. [ffx-seymour-flux §6 row 4, §3.3]"*
* **WATCH** — whatever the boss is winding up while a `charge` event is live
  (*"Total Annihilation — in 2 turns — Get Shell up, or Defend"*), plus the
  chapter's phase/form note for the board that is on screen.
* **RULES** — the three-to-five standing truths of the encounter, each carrying
  the `research/*.md` section it comes from.

`G`, the pad's spare face button, or the panel's own chip hides all of it and
leaves a chip two words wide. The answer is remembered in
`Settings.guideVisible` and applies to every later battle. It defaults **on**,
so a player who has never met Yunalesca is told that curing every Zombie is the
losing move before it wipes them.

Works in both HUDs. The FFX-2 copy inherits `--ig-accent: pyre pink` from its
`.ig--ffx2` root and needs no colour of its own.

## 2. The split, and why it is where the cut is

Three layers, and the boundaries are the whole design:

| Layer | File(s) | Owns |
|---|---|---|
| Drawing | `src/ui/common/StrategyGuide.ts` + `.css` | DOM, layout, input, the preference |
| Reasoning | `src/engine/tactics/guide.ts` | *which* command, *which* telegraph, *which* phase |
| Words | `src/data/guides/*.ts` | every sentence the player reads, and its citation |

### 2.1 NEXT is not a second strategy

The panel makes one strong claim: *this is the command the chapter was designed
to be beaten with.* That is only honest if the line it prints is the shipped
one, so `guide.ts` runs **`intendedStrategy` itself** — the same function
`__pyrefly.autoBattle('intended')` and the chapter e2e specs drive the game
with, which asks `src/engine/tactics/*.ts` first and falls through to the
generic ladder.

A guide that reasoned separately would drift the moment a chapter agent tuned
their tactic, and would then be teaching a line the encounter no longer rewards
— the one failure mode a strategy guide cannot survive. Running the real one
means the panel cannot be *wrong* about what to do; at worst it is silent about
why (no matching hint → it prints the command and target with no reason line,
which is strictly better than inventing one).

`tests/unit/strategy-guide.test.ts` is that claim as an assertion: it drives
real FFX engines through real Chapter 1 and Chapter 2 battles and compares the
panel's recommendation against `intendedStrategy` at **every** decision, across
several seeds. A one-row disagreement fails on the turn it happens.

### 2.2 Previewing a decision must not take one

The tactics take a `BattleEngine`, and the panel has to ask them what they would
do *without* the turn being taken. Every shipped tactic reads only
`engine.state()`, so `stateOnlyEngine(state)` satisfies the interface and
**throws** `GuideEngineMisuseError` from `init`, `submit`, `nextDecision` and
`setSeed`.

If a future tactic ever reaches for one of those, it fails loudly in a test
rather than quietly resolving a command mid-render and corrupting a battle the
player is in the middle of. `buildGuideView` catches it, logs, and degrades to a
panel with no NEXT line — the battle is untouched either way.

The HUD holds a `BattleState` (from `sync`), never the engine, so there is no
live engine on this side of the wall to hand over by accident.

### 2.3 Every sentence cites

`src/data/guides/types.ts` makes `cite` mandatory on every rule, hint, watch
entry and phase note, in the corpus's own form (`ffx-seymour-flux §6 row 4`).
This is the one surface in the game that makes explicit claims about canon
mechanics *to the player*, so an uncited sentence here is a bug, and a line that
drifts from the research is findable by grep. A unit test asserts the shape of
every citation in all five files.

## 3. Layout: why the rail is measured, not a box

The panel's height is computed every frame from two anchors the HUD owner names
(`StrategyGuideAnchors`), not from a constant:

| | `below` (start under) | `above` (stop over) |
|---|---|---|
| FFX | `.ig-banner` (action banner) | `.ffx-cmd-area` |
| FFX-2 | `.ffx2hud__enemies` (boss gauges) | `.ffx2hud__party` |

FFX's command stack is `column-reverse` and bottom-anchored, so its **top** edge
— the edge the rail has to clear — moves every time a submenu fills or closes. A
fixed box either wastes two thirds of the rail or lands on the Items submenu,
and which one it does depends on the chapter. Measuring is what makes "never
over the command menu" true rather than true-on-the-screenshot-I-took.

Left in both games, which is not a mirror and is deliberate: FFX puts its
command stack bottom-left and its **CTB queue top-right**; FFX-2 mirrors —
command stack bottom-**right**, telegraph banner top-right. The right edge is
the one edge that is busy in both. The left holds chrome at the top and at the
bottom with the whole middle free, which is exactly the shape a measured rail
fits.

One bug worth naming, because it is silent: `.ffx2hud__command` is `hidden`
whenever no menu is open, and a hidden element reports `offsetTop: 0`. Treated
as a real edge, that put the rail's floor five pixels above the top of the stage
and pinned it to `MIN_PANEL_HEIGHT` for the whole battle. `layout()` now gates
on `offsetHeight > 0` — an anchor that is not laid out has no edge to clear —
and a test pins it.

### 3.1 Why this slab is not skewed

Every other Ink & Gold slab is `skewX(var(--ig-skew))` with counter-skewed
contents. Those are short: `.ig-cmd` is 23px tall, the banner 20, `.ffx-sensor`
78 — at 12deg a 78px box leans about 8px, which reads as a deliberate angle.
This rail is a variable 56-200px tall, and at 200px the same skew leans 21px:
its top and bottom edges would sit in different columns, it would overhang the
FFX-2 party rows beneath it, and the counter-skew on multi-line paragraphs makes
running text visibly lozenge-shaped.

So the accent moves instead of the box. The rail is a plain ink panel with the
accent on its **start** edge, using the same `--ig-edge` calc `.ig-stat` uses to
border left in FFX and right in FFX-2 with no `.ig--ffx2` override rule at all;
the short elements — the toggle chip, each section head — carry the house skew.
"One accent per context" is unchanged; only the geometry that does not survive
being made tall was dropped.

## 4. Input, without touching `Input.ts`

`src/app/Input.ts` maps a small set of abstract buttons and the battle screen
forwards none of them to the HUD, so the guide listens for itself:

* `keydown` on `KeyG` — the one key no existing binding claims. Edge-only, and
  ignored with ctrl/meta/alt or `repeat`, so typing elsewhere cannot flip it.
* Standard-gamepad **button 2** (Square on a DualShock, X on an Xbox pad), which
  `PAD_MAP` also leaves free. Polled from `update(dt)`, edge-detected.
* The chip itself, for mouse and touch.

Both listeners stop at `unmount()`, which the HUDs now call. Adding a button to
the shared map for one optional panel would have put a global binding in a
contract file thirty agents import; `GUIDE_HINT_ITEM` in `ControlsHint.ts` is
the shared *wording* instead, so the chip and any future controls strip say the
same thing, worded per device (it prints `G` with no pad attached and `Square`
once one is).

## 5. The preference

`Settings.guideVisible`, default `true`. The battle HUDs are built by
`BattleScreenWiring.createHud(game)`, which takes no arguments and hands the HUD
to the presenter as a bare `HudPort` — so unlike everything in the screen tree,
the HUD has no route to the app's `SaveStore`.

`SaveData.ts` now registers the most recently constructed store in
`activeStore`, with `readSetting`/`writeSetting` reading through it. It has to be
*the* store the app writes: a second `SaveStore` would hold a stale copy of every
other field and clobber it on the next `recordClear`. Registration happens in the
constructor rather than from `App`, so the dependency runs one way (`ui` reads
`app/SaveData`; `App` needs no line about a HUD it does not own), and a test that
builds its own store simply becomes the active one for that test file.

With no store at all (a HUD in a unit test, a mock screen, storage blocked) both
helpers fall back to the shipped default and the write is a no-op.

## 6. Verification

```
npx tsc --noEmit          # clean for these files
npx vitest run            # 80 files, 2715 tests, all green
```

The only `tsc` output in the tree is three pre-existing errors in
`src/ui/common/DamageNumbers.ts`, which the numerals agent owns and was
mid-edit on. Nothing in this change touches it.

New tests, 52 in total:

* `tests/unit/strategy-guide.test.ts` (25) — the reasoning half, headless. The
  agreement-with-`intendedStrategy` walk across two chapters and several seeds;
  `stateOnlyEngine` throwing from all four mutating methods; the WATCH reader
  (newest charge per enemy, a fired telegraph shown as "this turn" and then
  dropped, a dead enemy's charge ignored, Bahamut's bare countdown matched
  through the `'#'` wildcard); phase switching at the half-HP line; and the
  written content — 3-5 rules per chapter, a citation on every sentence, no
  boss id claimed twice, and **every boss id the tactics register covered by a
  guide**, which is the check that catches a chain link added to one registry
  and not the other.
* `tests/unit/ui-strategy-guide.test.ts` (27) — the panel half, jsdom. Default
  on; remembered off; G, pad button and chip; the chord/repeat guards; listeners
  dying with the HUD; escaping; the idle state; no panel at all on a board with
  no written guide; the four layout cases including the hidden-anchor bug; and
  both HUDs mounting it into their own scaled stage.

### 6.1 Captures

On port 5304, driving the real game through `window.__pyrefly`:

| File | What |
|---|---|
| `docs/screenshots/bp1/guide-ffx-on.png` | FFX, Chapter 1, guide up at an open decision |
| `docs/screenshots/bp1/guide-ffx-off.png` | same board, G pressed — chip only |
| `docs/screenshots/bp1/guide-ffx-watch.png` | FFX with a live telegraph in WATCH |
| `docs/screenshots/bp1/guide-ffx2-on.png` | FFX-2, Chapter 4, guide up |
| `docs/screenshots/bp1/guide-ffx2-off.png` | same board, guide off |

## 7. Adding a chapter, or a sentence

* **A new encounter**: add `src/data/guides/<id>.ts` and list it in that
  folder's `index.ts`. The panel appears on its own; a chapter with no file
  simply has no panel (and no chip), which is not an error.
* **A new chain link**: add the boss id to the guide's `bossIds` *and* to the
  tactic's chain ids. The "covers every boss id the tactics register" test fails
  if only one is done.
* **A new hint**: hints are tried in array order and the first match wins, so
  list the situational lines (a status on the target, a phase) above the general
  ones. `labels` must name a row the tactic actually asks for — a hint for a
  label the tactic never picks can never fire.
