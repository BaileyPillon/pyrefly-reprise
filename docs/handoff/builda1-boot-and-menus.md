# Build A.1 — boot-and-menus

**Items:** critic round 03 #5 (BLOCKER, audio settings never applied at boot), round 03 #36
(MAJOR, strategy guide slices its last line + the MORE chip), and the pre-deploy gate's two FFX-2
command-menu majors (the Attack submenu's duplicate row; the fold chevron parked off the list).
**Status:** all four fixed, tested, verified (three live in a real GPU-mode browser). Nothing open
that blocks a deploy from this track.
**Game case:** #5 is **both** (shared boot plumbing — `AudioManager`/`SaveStore` are not
game-specific, AGENTS.md rule 14 / CHK-020). The strategy-guide fix is **both** (the panel and its
CSS carry no game branch other than the accent colour). The two command-menu fixes are
**FFX-2 only** — FFX's own `src/ui/ffx/CommandMenu.ts` is a separate component with no dressphere
concept and is untouched.

---

## 1. Saved audio settings never reached the mixer at boot (round 03 #5)

### What was wrong

`critic/rounds/round-03.md:377-388`: a player who lowered or muted a volume in OPTIONS got the
default 0.9/0.7/0.9 back on every reload until they opened pause again. `AudioManager.ts` defaulted
its three volumes in its constructor; the only callers of `setMasterVolume`/`setMusicVolume`/
`setSfxVolume` anywhere in `src/` were `PauseScreen.ts`'s three OPTIONS rows. Nothing on the boot
path ever pushed a loaded save's settings into the mixer.

### Fix

- `AudioManager.applySettings({masterVolume, musicVolume, sfxVolume})` (`src/audio/AudioManager.ts`)
  — thin wrapper over the three existing setters, which already update the internal fields
  `unlock()` reads *and* push straight to a live gain node when one exists. Calling it once, before
  `unlock()` ever runs, is enough to cover both "at boot" and "after the context unlocks": `unlock()`
  never resets these fields, it only reads them.
- `SaveStore`'s constructor (`src/app/SaveData.ts`) calls `audio.applySettings(this.data.settings)`
  right after `load()` — this *is* the boot path (`App`'s constructor builds `SaveStore`).
  `SaveStore.setSettings()` calls it too, so any later settings write (not only `PauseScreen`'s)
  reaches the mixer without every future caller having to remember the three setters itself.
- CHK-024: `SaveData.migrate()` already merges onto `defaultSettings()`, so an old save missing these
  fields gets 0.8/0.7/0.9, never `NaN` — pinned by a new test, not a new behaviour.

### Test — `tests/unit/audio-boot-settings.test.ts` (4 cases, real `AudioManager` singleton + real
`SaveStore`, a fake in-memory `localStorage`, never `PauseScreen`)

Fails on the pre-fix code with `TypeError: audio.applySettings is not a function`, then (once the
method exists but isn't wired) with the mixer staying at defaults after a seeded save loads —
exactly the critic's own repro shape (`audioDebug().volumes` disagreeing with `save.settings`).
Cases: a muted/lowered save reaches the mixer before any pause screen exists; `setSettings` keeps
pushing; an old save with no volume fields at all gets defaults, never NaN; a fresh profile with no
storage backing does too.

---

## 2. Strategy guide slices its last line + the MORE chip (round 03 #36)

### What was wrong

`critic/rounds/round-03.md:780-788`. Two separate defects in `src/ui/common/StrategyGuide.ts` /
`strategy-guide.css`:

- The panel's `max-height` (`StrategyGuide.layout()`) was a raw pixel cap with no relation to where
  a rendered line actually ends, so `overflow-y` cut whatever paragraph sat at the boundary through
  the middle of a word.
- `.sgd__more`'s own background was opaque for its first 64% and only faded across the last third —
  not a real fade — and its `font-size: 5px` measured **10 effective CSS px** at 1280x720 (letterbox
  scale 2x), under the project's 14px legibility floor.

### Fix

- `StrategyGuide.measureLineBottoms()` (new, private): one `Range` over `.sgd__body`'s whole
  contents, `getClientRects()` gives one rect per rendered line even across several elements. The
  new exported pure function `lastWholeLineBelow(lineBottoms, limit)` finds the largest line-bottom
  at or below a height cap. `layout()` calls it after `fit()`'s existing whole-element rung system,
  clamping the box to the bottom of the last complete line instead of the raw available height.
  jsdom has no layout (documented on the class already), so this is a no-op there, same as the rest
  of `layout()`'s pixel math — real browsers only.
  - **First pass regressed into a worse bug, caught before committing**: clamping to the bare text
    height left no room for the MORE chip, which then painted directly over the last word of a fully
    legible sentence (screenshot taken, not kept). Fix: when the chip is going to show, the line
    search budgets `MORE_HEIGHT` less than the available height, and the box is given that strip
    back on top of the clamped text — MORE occupies blank ink below a complete line, never printed
    over one.
- `strategy-guide.css`: `.sgd__more`'s background is now a plain two-stop gradient (opaque to
  transparent, no plateau) and its `font-size` is 7px (14 / 17.5 / ~19.7 effective CSS px at
  1280x720 / 1600x900 / 2000x1012 — the floor is cleared at all three).

### Tests — `tests/unit/strategy-guide-fold.test.ts` (7 cases)

`lastWholeLineBelow` as pure arithmetic; a DOM case that stubs `Range.prototype.getClientRects` and
mounts a real `StrategyGuide`, asserting `layout()` clamps to the last whole line rather than the
raw available height; two CSS-source checks (font-size floor across the three viewports; no
repeated-colour gradient stop). All fail against the pre-fix source (confirmed one at a time before
combining the fixes). `tests/unit/ui-strategy-guide.test.ts`'s 27 existing cases still pass
unchanged.

### Live verification (GPU-mode Playwright, `PYREFLY_BROWSER=gpu`, Chapter 2/Yunalesca, seed 1)

1280x720, 1600x900, 2000x1012 — `docs/screenshots/builda1/boot-and-menus/strategy-guide-fold-*.png`.
No sliced line, no MORE-over-text overlap, chip legible at all three.

---

## 3. FFX-2 Attack submenu lists two rows both labelled ATTACK

### What was wrong

Every standard dressphere's data file (`src/data/ffx2/dresspheres/*.ts`) ships its own researched
`x2-<name>-attack` ability id (`research/ffx2-combat-core.md` §3.1-3.13) *and* is flagged
`hasAttack: true`. `src/battle/ffx2/targeting.ts`'s `buildCommands()` pushed the shared generic
`attack` command (category `'attack'`) whenever `hasAttack`, then separately looped the dressphere's
own ability list unfiltered — which pushed that same category a second time. `CommandMenu.
groupRows()` saw two `category: 'attack'` commands and rendered an "Attack" submenu with two rows,
both labelled ATTACK, and the two were not even equivalent (different targeting/flags/message).

Reproduced live (GPU-mode browser, real `window.__pyrefly`), confirming the engine's own
`decision.commands` — not just the rendered menu — actually carried both entries.

### Fix — `src/battle/ffx2/targeting.ts`

`buildCommands()`'s offered-abilities loop now skips any ability whose `category` is `'attack'`; the
top-level generic row (`command.kind: 'attack'`) is untouched. **A different fix was tried first and
reverted**: retargeting the top-level row onto the dressphere's own ability id (making it the
canonical Attack) also removes the duplicate, but changes `command.kind` from `'attack'` to
`'ability'` — which broke `tests/unit/strategy-ffx2-vegnagun-shuyin.test.ts`'s node-targeting
harness and would silently change what every `command.kind === 'attack'` reader in
`src/engine/tactics/**` (a different agent's files) sees. That is a wider retarget than "the ability
list", which is what this track's brief authorized; the reverted version is not in this commit.

### Test — `tests/unit/ffx2-command-menu-attack-duplicate.test.ts` (7 cases)

Real `FFX2Engine` + the real production data registries (`registerBattleContent()` /
`ffx2EngineOptions()` — the engine's own built-in scaffold registry has empty `abilityIds` by design
and would never show the bug). Drives the shipped default trio (Yuna/Gunner, Rikku/Thief,
Paine/Warrior) to their first decision and asserts exactly one `category: 'attack'` command, with
`command.kind: 'attack'` unchanged. Further cases: a berserked/itchy Gunner (whose ability-list loop
is skipped, per §2.8) still gets exactly one/zero Attack; Yuna in White Mage (§3.5, no Attack at
all) still gets none; a non-attack offered ability is unaffected. All fail against the pre-fix code
(2 rows, or the reverted alternative's `kind: 'ability'`) before combining.

Also reran the whole FFX-2 suite (20 files, 254 tests, including the vegnagun-shuyin file that the
reverted fix broke) — green.

---

## 4. FFX-2 command menu's fold chevron parked off the list

### What was wrong

Measured live (GPU-mode Playwright, 1280x720, Chapter 5/Yuna's White Magic — 16 rows): every row's
own right edge sat at real-viewport x=1047.6, while `.ffx2cmd__fold--down` (the "more below" mark
`CommandMenu.markFold()` inserts) sat at x=1228-1256 — floating ~180 real px to the right of the
list in empty space (`docs/screenshots/builda1/boot-and-menus/white-magic-1280x720.png`). The
column itself never ran past the visible frame (`.ffx2hud__command`'s own bottom, y=487, was well
inside the 720px-tall stage) — the fold's *detachment* was the real defect, not an overrun.

Root cause: `.ig-cmd-stack` (`src/ui/inkgold/slabs.css`, shared with FFX's own command menu) sets no
`align-items`, so every fixed-width `.ig-cmd` row renders left-aligned regardless of its own
`margin-right` cascade step — the margin only reserves unused trailing space, it never shifts a row.
`.ffx2hud__command` had no explicit `width`, so its shrink-to-fit box counted that unused margin (up
to 15 × 7.11 grid px on a 16-row list) toward its own width — ~106 grid px wider than any row
actually renders. `.ffx2cmd__fold` right-aligns to *that* box (`margin-left: auto`), so it drifted
into the resulting dead space.

### Fix — `src/ui/ffx2/ffx2-hud.css`, scoped to `.ffx2hud__command`

Pinned its `width` to one `.ig-cmd` row's own width (129.78px, `slabs.css`) instead of shrink-to-fit.
Deliberately does **not** touch `.ig-cmd-stack`'s missing `align-items` in the shared `slabs.css` —
giving the cascade an effect it has never visibly had before is a new look, not a bugfix, and would
need its own end-state pick (AGENTS.md rule 9); it would also affect FFX's own command menu, which
this track does not own. `.ffx2hud__command` is the only selector touched, and FFX's menu uses a
different container class entirely.

### Test — `tests/unit/ffx2-command-fold-attached.test.ts` (3 cases, CSS-source arithmetic —
jsdom lays nothing out, same limit `ui-ffx2-command-menu.test.ts` already documents for
`scrollAffordance`)

Asserts `.ffx2hud__command`'s declared width equals `.ig-cmd`'s; asserts the fold still right-aligns
to it; a guard case that fails (deliberately, with an explanatory message) the day `.ig-cmd-stack`
gains an `align-items` of its own, so this fix's assumption cannot go silently stale.

### Live verification (GPU-mode Playwright, 1280x720, Chapter 5/Yuna, seed 1)

`docs/screenshots/builda1/boot-and-menus/white-magic-1280x720.png` (before — chevron floating
alone) vs `white-magic-1280x720-after.png` (after — chevron flush against the ESUNA row's corner).

---

## Files touched

| File | Item |
|---|---|
| `src/audio/AudioManager.ts` | 1 — `applySettings` |
| `src/app/SaveData.ts` | 1 — wires it into `SaveStore` |
| `src/ui/common/StrategyGuide.ts` | 2 — whole-line clamp |
| `src/ui/common/strategy-guide.css` | 2 — MORE gradient + font-size |
| `src/battle/ffx2/targeting.ts` | 3 — drop the duplicate attack-category entry |
| `src/ui/ffx2/ffx2-hud.css` | 4 — `.ffx2hud__command` width |
| `tests/unit/audio-boot-settings.test.ts` | new, item 1 |
| `tests/unit/strategy-guide-fold.test.ts` | new, item 2 |
| `tests/unit/ffx2-command-menu-attack-duplicate.test.ts` | new, item 3 |
| `tests/unit/ffx2-command-fold-attached.test.ts` | new, item 4 |

None of the six touched source files are listed in `docs/CONTRACTS.md`; no `CONTRACT-CHANGES.md`
entry needed.

## Verification

- `npx tsc --noEmit` — clean.
- `npx vitest run` — **153 files, 4191 tests, all green** (one full run, per the brief's economy
  budget). Ran the full FFX-2 suite and the strategy-guide/audio suites individually first while
  iterating.
- `node tools/orphans.mjs` — unchanged orphan list (24, all pre-existing — `fixtures.ts` etc.); no
  new module went unimported.
- Live: GPU-mode Playwright (`PYREFLY_BROWSER=gpu`) against this track's own `vite --port 5567`
  (stopped after). Items 2 and 4 got the one browser pass the brief asked for, at 1280x720, 1600x900
  and 2000x1012 for item 2 and 1280x720 for item 4 (item 4's defect and fix are both about horizontal
  alignment, which does not change with viewport height the way the guide's line-count does; item 3
  was verified live via the debug API's real decision/commands, not a screenshot, since the defect
  was in engine data, not layout).

## Environment note for whoever runs the next browser pass here

The MCP `Claude_Browser` tool's `frame()`/`app.step()`-via-`requestAnimationFrame` path did not fire
for a stretch of this session even though `document.visibilityState` read `"visible"` — the pane
itself was not actually on screen. Real GPU-mode Playwright (`node <script>.mjs` with
`PYREFLY_BROWSER=gpu`, `tools/browser-mode.mjs`) was used instead once this was diagnosed, per
`docs/DEV.md` "Fast browser". No fallback to the default SwiftShader mode was needed.

## Still open (not this track's scope)

- Mascot (`research/ffx2-combat-core.md` §3.14) has no ability table in `src/data/ffx2/abilities/
  mascot.ts` yet — a data gap, not touched here. Item 3's fix does not depend on it and does not
  regress it (Mascot still falls back to the generic Attack row exactly as before).
- `.ig-cmd-stack`'s missing `align-items` (item 4's root cause) is left as documented, shared,
  currently-inert scaffolding. Whether FFX-2's command rows should visibly cascade at all is a
  first-time design question, not a bugfix — flagging it for whoever owns the next end-state round on
  FFX-2 HUD polish.
- Round 03 #6 (the OPTIONS panel's own displayed master-volume default, 0.8 in `SaveData.ts` vs 0.9
  in `AudioManager.ts`'s pre-fix default) is adjacent to item 1 but was not in this track's brief and
  touches `PauseScreenPanels.ts`, which another track owns; not fixed here.
