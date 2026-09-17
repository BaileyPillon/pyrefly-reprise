# Polish pass — `ffx-hud-polish`

FFX battle HUD: command window fidelity and text legibility at 1600x900.
Owned files only: `src/ui/ffx/CommandMenu.ts`, `CommandMenuLogic.ts`,
`CtbList.ts`, `FFXBattleHud.ts`, `PartyStatusWindow.ts`, `ffx-hud.css`
(+ `tests/unit/ui-ffx-hud.test.ts`, and a one-word label in `testFixtures.ts`).
`TargetCursor.ts`, `TelegraphBanner.ts`, `TriggerPrompt.ts` and `SensorPanel.ts`
needed no change.

Before: `docs/screenshots/44-battle-open.png`, `45-battle-skills.png`, `47-boss-attack.png`.
After: `docs/screenshots/polish/hud-open.png`, `hud-skills.png`, `hud-enemy-turn.png`, `hud-switch.png`.

> **Re-verified 2026-09-17** against the current working tree on a fresh dev
> server (`npx vite --port 5207`): `npx tsc --noEmit` clean, and all three
> "after" shots recaptured. Measured in the running page at 1600x900 —
> `.ffxhud__stage` transform is `matrix(2.5, …)`, so every stage px below is
> exactly ×2.5 device px. See "Verification log" at the end.

## (a) The command set

**Defend is gone from the menu.** The research does document Defend as a real
FFX action — `ffx-combat-core.md` §1.3 ranks it 2 in the decompiled command
table and §4.2 defines its "halves physical damage until next turn" status —
but it is a *base action*, not a row: it appears nowhere in §7's character
skill lists, and `visual-bible.md` §3.3's command window is Attack / the
character command / White Magic / Black Magic / Item / Overdrive / Summon.
`buildTopRows` now drops every `kind: 'defend'` command. The engine still emits
it and `BattlePresenterStrategies`'s `'defend'` auto-battle strategy still
picks it straight off `AvailableCommand[]`, so nothing engine-side changed.
*Open question for the orchestrator:* the player now has no way to Defend at
all. Restoring it as a button affordance (the free `r1` in `rawInput.ts`) plus
a hint line is a small follow-up, but it touches `rawInput.ts`, which this pass
does not own.

**Switch is one row, not four.** The engine emits one `switch` command per
benched member, which surfaced as bare name rows ("AURON") sitting among the
verbs. They now collapse into a single `Switch ▸` group whose submenu is the
reserve list — one row per benched member, portrait chip + name, per
`visual-bible.md` §3.3's roster-strip swap flow. Unlike any other one-entry
group it always opens its list (a swap must show who is coming in).
`L1` (`F` / `PageUp`), `R1` and triangle (`Q` / `Shift`) jump straight into it
from the top level, which is the verified FFX affordance ("L1 / LB swaps active
party members mid-battle"). All group rows now carry a `▸` chevron.

**Canonical order.** `buildTopRows` sorts the top level Attack → Skill/Special
→ White Magic → Black Magic → Item → Overdrive → Summon → Aeon → Escape/Dismiss
→ Switch, instead of taking whatever order the engine emitted. Trigger rows sort
first. Unlisted categories keep engine order in the middle (the sort is stable).

## (b) MP-cost badges

`.ig-cmd__ready` is ivory at 4.89px — invisible on an ivory row face and barely
there on the selected gold one. Every right-hand tag is now an ink chip
(`.ffx-cmd__badge`) at 6.4px (16 device px at 1600x900), coloured by kind:
MP in `--ig-spira-sky` with the unit spelled out ("8 MP", so a cost can't be
read as an item count), item/charge counts as `×N` in ivory, `READY` in gold.
An Overdrive row keeps its tag on the row face (it is already ink-on-gold).

Row width went 129.78px → 152px: the Ink & Gold mockups' longest row was
"OVERDRIVE", and real names ("Delay Buster", "Heavenly Strike") clipped once an
MP chip shared the row. Anything still too long ellipsises rather than
overflowing the slab.

## (c) Menu on screen during enemy actions

Two independent causes, both fixed:

1. `.ig-cmd-stack` declares `display: flex` in `slabs.css`, and an author rule
   beats the UA's `[hidden] { display: none }` — so `stackEl.hidden = true`
   never actually hid the stack. `.ffxhud [hidden] { display: none !important }`
   restores the attribute's meaning inside this HUD without touching the shared
   layer.
2. `BattlePresenter.chooseCommand` races the HUD's promise against
   `setAutoPlay`'s pick and **abandons the loser**, so `CommandMenu.finish()`
   never ran for an interrupted menu. `FFXBattleHud` now calls
   `CommandMenu.suspend()` on every `action-start`: an action resolving means
   the decision is made. Suspension is deliberately reversible (the watcher
   stays attached, any button press brings the menu straight back) so it can
   never deadlock a fight that really was still waiting on the player, and
   `open()` drops an abandoned menu's input hooks before the next one attaches.
   `finish()` also clears the help line now, which is what left "Open the White
   Magic menu." sitting over the boss's attack in `47-boss-attack.png`.

## (d) Text sizes at 1600x900

The stage is the 640x360 authoring grid letterboxed by `FFXBattleHud.layout()`,
so at 1600x900 every stage length is multiplied by exactly 2.5. Sizes were
chosen in device px and divided back:

| Element | Was | Now | Device px |
|---|---|---|---|
| CTB name plate `.ig-ctb__name` | 4.89px | 5.6px | 12 → 14 |
| Command row tag `.ig-cmd__ready` | 4.89px | 6.4px | 12 → 16 |
| HP/MP denominator `.ig-stat__value small` | 5.78px, `#9fb0c4` | 6.6px, `#b8c8da` | 14 → 16.5 |

`.ig-stat__od` is pinned `flex: none` so the Overdrive gauge does not absorb the
extra glyph width.

The `-20 MP` popups are no longer in this file: the damage-number pass replaced
`.ffx-numeral-chip` with the shared `src/ui/common/DamageNumbers.ts` (`.dnum`),
which sizes numerals by `fontSizeFor(kind) * stageScale`. They read clearly in
`hud-enemy-turn.png`, so nothing was needed here — and nothing in the
damage-number rules was touched.

## Not fixed — engine bug, outside this pass

**Party switching is unreachable in the whole game.**
`src/battle/ffx/commands.ts:132` builds each switch row with
`enabled: isAlive(bench)`, and `isAlive` (`src/battle/ffx/state.ts:193`) is
`c.alive && !has(c, 'ko') && onField(c)` — a benched member is by definition
*not* on the field, so every switch row arrives `enabled: false` for ever. That
is why `hud-open.png` shows `SWITCH ▸ ×4` greyed out, and why the reserve list
had to be captured on the fixture-driven `ffx-hud-demo` screen
(`hud-switch.png`). The check probably wants `bench.alive && !has(bench, 'ko')`.
Not this pass's file to change. Still present as of 2026-09-17.

## Verification log — 2026-09-17

`npx tsc --noEmit`: clean (no errors anywhere in the tree, owned or not).

**(a)** `hud-open.png`: rows are `ATTACK / SPECIAL ▸ ×6 / WHITE MAGIC ▸ ×3 /
ITEMS ▸ ×27 / SWITCH ▸ ×4`. No Defend row. The research check the task asked
for: `ffx-combat-core.md` §7 "Character skill lists" (lines 1402-1616) contains
no Defend entry — its only occurrence in that range is line 1448, describing
Auron's **Sentinel** as "Guard + Defend (halved physical)", i.e. Defend as an
*effect*, not a listed command. §1.3 line 106 ranks it among the rank-2 base
actions. Removing the row is correct on the task's own criterion.

**(b)** `hud-skills.png` was recaptured with the cursor parked on a row that
*has* an MP cost (`PROVOKE`, selected, gold face) — the exact state the defect
named. The ink chip reads cleanly on gold and on ivory (`DELAY ATTACK 8 MP`,
`DELAY BUSTER 18 MP`).

**(c)** Measured in the DOM around the handover, in the real race (submenu
open, then `autoBattle` answers for the player):

| | `.ig-cmd-stack` | visible rows | breadcrumb | help line |
|---|---|---|---|---|
| Menu up | `hidden=false` | 6 | `hidden=false` ("Special") | — |
| Enemy action landing | `hidden=true` | 0 | `hidden=true` | `hidden=true` |

`hud-enemy-turn.png` is the frame of that HP drop: stack, breadcrumb and help
line are all off screen while the boss's hit resolves.

**(d)** Computed styles read off the live page (stage scale ×2.5):

| Element | Stage px | Device px |
|---|---|---|
| `.ig-ctb__name` | 5.6 | 14 |
| `.ig-stat__value` | 11.56 | 28.9 |
| `.ig-stat__value small` (denominator) | 6.6 | 16.5 |
| `.ffx-cmd__badge` | 6.4 | 16 |
| `.ig-cmd` label | 9.78 | 24.4 |
| `.dnum` (damage numerals, unscaled layer) | 40 | 40 |

### Note for the orchestrator: the gallery shots are stale

`docs/screenshots/44-battle-open.png` and `45-battle-skills.png` still show the
**old** menu (DEFEND row, bare AURON row, 11 px tags) even though their mtimes
are later than this pass's. Whatever ran `tools/gallery.mjs` served a build
from before these changes (a `vite preview` of a stale `dist/`, most likely).
The source is correct — `docs/screenshots/polish/hud-*.png` were captured from
a dev server on the current tree minutes apart and show the fixed menu. The
gallery needs re-running from a current build before anyone reads 44-47 as the
state of the game.
