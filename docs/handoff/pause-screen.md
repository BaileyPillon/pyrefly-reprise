# Handoff — the pause screen, its data, and the prep CHAPTER tab

Three slices, written at different times, all about the same screen. **Part 1**
is the data layer (`src/data/chapter-meta.ts`), which shipped first and on its
own. **Part 2** is the screen that consumes it, the objective evaluator the
first handoff said was missing, and the prep-menu tab that shares its copy.
**Part 3** is an independent verification pass over both — what was re-run,
what was driven in a browser, the one regression it fixed (photo mode was
showing the battle HUD) and the defects it left open.

Screenshots: `docs/screenshots/pause/*.png` (1600x900) — `pause-ch1..5`, the
three panels (`pause-party`, `pause-music`, `pause-photo`), the two prep tabs,
and `pause-objectives`, which is Chapter 1 caught 15 seconds in with two of its
three objectives genuinely ticked and Kimahri down.

---

# Part 2 — the pause screen

## What exists

| File | What it is |
|---|---|
| `src/app/screens/PauseScreen.ts` | The overlay screen: hero art, command column, dossier, party cards, polaroids |
| `src/app/screens/PauseScreenPanels.ts` | Pure `data -> HTML` for the bottom party cards, the PARTY tab and the OPTIONS rows |
| `src/ui/common/pause-screen.css` | Its chrome, on the 640x360 grid |
| `src/ui/common/chapterObjectives.ts` | The `ObjectiveRule` -> `BattleState` evaluator, plus ENCOUNTER PROGRESS and `formatPlayTime` |
| `src/ui/common/chapterPanel.ts` + `chapter-panel.css` | The chapter dossier, shared by the pause screen and the prep tab |
| `src/ui/common/PhotoMode.ts` | Chrome off, camera on a short leash |
| `src/ui/common/MusicPlayer.ts` | The sound test |
| `src/ui/ffx/party-prep/ChapterPanel.ts` + `chapter-panel-tab.css` | The prep menu's CHAPTER tab, registered for both games |
| `src/ui/ffx2/party-prep/index.ts` | The FFX-2 prep registration point, which did not exist before |

Additive edits: `App.ts` (overlay push/pop, `screens`), `BattleScreen.ts`
(pause gate, the three ways in, play time, exit intents), `CutsceneScreen.ts`
(Esc opens the pause with SKIP SCENE on it), `SaveData.ts` (play time,
`ffx2Atb`), `ControlsHint.ts` (two hint sets), `debug/api.ts` (`battleScreen()`
now searches the stack).

Tests: `tests/unit/pause-objectives.test.ts` (48), `tests/unit/pause-play-time.test.ts` (20).

## The three things worth knowing before you change anything

### 1. "Frozen" is two mechanisms, not one

`App.pushOverlay` gets most of it for free. `App.step` only updates the top
screen, and `render()` falls back to `lastRendered` when the top screen returns
null — so a pause screen that draws no scene leaves the battle diorama drawn
every frame and ticked on none. Nothing in `BattleScreen.update` runs, which is
also why play time stops accruing the moment the menu opens.

What that does **not** freeze is `BattlePresenter`, which paces itself with its
own awaits and would happily play three more damage numerals behind the menu.
It is frozen at the other end: `BattleScreen` hands the presenter a `sleep`
(`pauseGate`) that parks after the real delay while the pause is up. Same
shape in `CutsceneScreen.waitGate` for the story runner's `wait` port.

If you add another self-timed system to a battle, it needs its own gate; the
App loop will not save you.

### 2. The pause will not open over a command menu — on purpose

`BattleScreen.canPause` returns false while `presenter.snapshot().awaitingMenu`
is true, or while a minigame is up. Both FFX and FFX-2 command menus take the
keyboard **directly off `window`** (`ui/ffx/rawInput.ts`'s `RawInputWatcher`,
`ui/ffx2/CommandMenu.ts`) for as long as they are open. A pause menu stacked on
one would give two screens the same arrow keys, and Esc would mean "back out of
targeting" and "close the pause" simultaneously.

This is the brief's "Esc when no submenu is open", and it applies equally to
`P` and the pad's Start button — the conflict is about who owns the keys, not
about which key opened the menu.

**The cost is real**: mid-fight, a player sitting at a command menu cannot
pause until they pick something. The honest fix is for the HUDs to route input
through `app/Input.ts` instead of their own `window` listeners, or to expose a
`suspend()` on `HudPort`. Both are HUD-agent files and were out of scope here.
Until then, the debug beat `pause:open` bypasses the check (a capture tool has
no keyboard to lose), which is what the screenshots use.

### 3. Hint strips mount on the screen root, not in the stage

`controls-hint.css` is authored in **device pixels** because it normally sits
outside a 640x360 stage. Mounting it inside one scales it by the letterbox
factor on top of its own sizes and prints a footer two and a half times too
big. Both hint lines (`ControlsHint` and photo mode's) therefore mount on
`this.root`. If you add chrome to this screen, pick a side and stay on it.

## The objective evaluator

`evaluateObjective(rule, ctx)` where `ctx` is `{ state, log, links }`. Pure —
same context in, same answer out, which is what the tests lean on.

Four of the eight rule shapes ask about something that **happened**, not
something that is true now (a cured Zombie is gone, a survived Mega Flare is
over, a downed Yu Pagoda may have been restored). Those are answered from
`BattleState.log`, so a ticked row stays ticked. Only `boss-hp-below` reads
live state, and only `link-reached` reads `ctx.links` (the chain position is
the *screen's* count — the engine never advances groups itself).

Two decisions you will trip over:

- **`form-reached` subtracts one.** `EnemyFields.formIndex` is 0-based;
  the objective copy counts forms the way a player does. Yunalesca's "Form III"
  is `formIndex` 2.
- **Ability names match on a hyphenated suffix.** `chapter-meta.ts` writes
  `'mega-flare'`; FFX-2's tables emit `'x2-bahamut-mega-flare'`. A rule matches
  the whole id or `'-' + name`, so the bare name finds the namespaced move and
  a rule cannot latch onto an accidental substring (`'flare'` does not match
  `'megaflare'`). It *would* match `'mega-flare'` — the guard is against
  substrings, not against a loosely worded objective. None of the five shipped
  objectives is loosely worded; if yours has to be, spell the full engine id.

`encounterProgress` reports whichever kind of progress the chapter actually
has, in descending order of usefulness: links for a chained chapter ("LINK 2 OF
4"), then forms ("FORM 3"), then the boss's remaining HP percentage.

## Art

The hero close-ups **exist now** — `public/art/pause/ch{1..5}-*.png`, painted
after the data slice landed. `ChapterMeta.heroArt` still has no extension, so
`heroArtCandidates()` tries `.png`, then `.webp`, then `heroArtFallback` (a
shipped portrait that the chapter-meta test asserts is on disk). The pause
screen walks that list on `<img>` error; the prep tab stacks all three as
`background-image` layers, where CSS draws the first that loads and silently
skips the ones that 404.

The PARTY tab wants `public/art/pause/<combatant-id>.png` per member. Some
exist (`auron`, `jecht`, `kimahri`, `shuyin`); the rest fall back to
`portraits/<id>.png` through `wireImageFallbacks`. Adding a close-up is a
drop-in — no code change.

## Play time

`ChapterRecord.playTimeMs`, fed from `BattleScreen.update` once per frame via
`SaveStore.addPlayTime`. That cannot write to `localStorage` sixty times a
second, so the total accumulates in memory and flushes at `PLAY_TIME_FLUSH_MS`
(5 s) or on an explicit `flushPlayTime()` — which `openPause` and
`BattleScreen.exit` both call, so the number the player is shown is the number
on disk. Deltas are rejected if non-finite or negative and clamped at
`MAX_PLAY_TIME_STEP_MS`, so a backgrounded tab cannot book a minute of "play".

A save written before this existed migrates to `0`, not to `bestTimeMs`: one
clear is not a play history.

## Leaving the encounter

RESTART / CHAPTER SELECT / QUIT TO TITLE go through
`BattleScreen.requestExit`. The flow (`BattleScreenFlow.runChapter`) is parked
on `battle.finished` and *its* caller navigates after it resolves, so the
screen cannot simply `goto()` — its navigation would land first and be
overwritten a tick later. Instead it aborts (which makes the flow unwind),
waits for this screen to leave the stack, and only then takes over. CHAPTER
SELECT needs nothing afterwards: the flow's own follow-up is already exactly
that.

This is the part most likely to need revisiting if the flow changes. A cleaner
design would be an `exit` field on `BattleScreenResult` that `runChapter`
honours — that is a `BattleScreenFlow.ts` change, which was another agent's
file.

## What was verified in the running game

Beyond the unit tests, the built screen was driven through the debug API on a
dev server and the results read back out of `snapshotState()`. Chapter 1,
played by the `intended` strategy at `fast` until Seymour cast Total
Annihilation (570 real events):

```
objectives at pause: [
  {"id":"cure-zombie-before-full-life", "done":true},   // from a real zombie:cured
  {"id":"survive-total-annihilation",   "done":true},   // cast, resolved, party alive
  {"id":"defeat-seymour-flux",          "done":false}   // boss still at 11%
]
progress: {"label":"BOSS HP 11%", "value":7424, "total":70000}

playTimeMs before pause: 17349.8  ->  at pause: 17349.8
playTimeMs after 90 paused frames: 17349.8     (frozen)
battle log length while paused:    570 -> 570  (presenter frozen)
after resume: playTimeMs 21816.5, log 646      (both moving again)
```

That is the whole contract in one run: the evaluator ticks off ids the engine
actually emits, the progress row is live, and *both* clocks — the App-loop one
and the presenter's own — stop dead and restart.

## A bug this work found, in someone else's lane

**`public/art/portraits/*.1.raw.png` are entirely black.** All three FFX-2
portraits from that batch — `paine.1.raw.png`, `yuna-ffx2.1.raw.png`,
`rikku-ffx2.1.raw.png` — have an RGB mean of exactly 0. They are failed renders,
not dark paintings.

This matters here because `chapter-meta.ts` points at two of them:
`yuna-ffx2.1.raw.png` is Chapter 4's `heroArtFallback`, and `paine.1.raw.png`
is one of its three snapshots — the black tile in `pause-ch4.png` is that file,
not a layout bug. `tests/unit/chapter-meta.test.ts` asserts those paths *exist*,
which they do, so nothing goes red.

Not fixed here: it is an art-pipeline artefact and `chapter-meta.ts` is another
agent's deliverable. Two things would close it — re-render the batch, and give
the chapter-meta test a "not a blank image" assertion so a black render cannot
pass as a shipped asset again.

## Known gaps

- **Gamepad leak.** While paused, a d-pad or face-button press still reaches an
  open command menu's own `rAF` gamepad poll. In practice the pause cannot open
  over a command menu (see §2), so the window is small — but it is not zero,
  and it closes properly only when the HUDs stop polling input themselves.
- **No transition.** The menu appears and disappears instantly. The Ink & Gold
  spec's diagonal ivory wipe (`playWipe`) would suit it; it was left out
  because a wipe over a frozen frame needs its own think about what the
  underlying render is doing.
- **Photo mode is a turntable, not a free camera** — yaw +/-22 degrees, pitch
  +/-14, dolly 0.55x-1.25x around what the camera was already looking at. The
  dioramas are painted billboards with nothing on their far side; the limits
  are the point, not a TODO.

---

# Part 1 — chapter meta data (written with the data slice)

Everything below describes `src/data/chapter-meta.ts` and was written before
the screen existed. It is still accurate except where Part 2 says otherwise —
specifically, the evaluator now exists (`ui/common/chapterObjectives.ts`) and
the hero art now exists.

## What exists

`src/data/chapter-meta.ts` exports `CHAPTER_META: readonly ChapterMeta[]` (five
entries, in play order) and `getChapterMeta(id)`. It is pure data — no rendering,
no evaluation logic, no dependency on `BattleState`. Its test is
`tests/unit/chapter-meta.test.ts` (54 assertions: presence, word-count limits on
the copy, and that every referenced art file that's supposed to exist today
actually does).

This does **not** replace anything in `src/data/encounters.ts`. `Chapter.subtitle`,
`Chapter.blurb` and `Chapter.sensorTexts` stay exactly as they are and keep
serving the chapter-select card and the in-battle Sensor panel. `ChapterMeta` is
new copy, written for a different reader (a full-screen pause/tab view with room
for a close-up portrait and a paragraph), not a re-export of the card text.

### Shape

```ts
interface ChapterMeta {
  id: ChapterId;                 // same ids as encounters.ts
  gameLabel: 'FFX' | 'FFX-2';
  numeral: 'I' | 'II' | 'III' | 'IV' | 'V';
  title: string;
  subtitle: string;              // 2-4 word tagline, e.g. "The Prominence"
  location: string;
  blurb: string;                 // 2 original sentences
  heroArt: string;                // pause-screen art, NO extension — see "Art status"
  heroArtFallback: string;        // existing art, WITH extension, always present today
  quote: { text: string; speaker: string }; // original line, < 18 words
  handwritten: string;            // 4-6 word handwritten-style aside
  objectives: readonly [ChapterObjective, ChapterObjective, ChapterObjective];
  tip: string;                    // one canon strategy sentence
  snapshots: readonly [ChapterSnapshot, ChapterSnapshot, ChapterSnapshot];
  focalCharacterId: string;
  musicKeys: readonly string[];   // this chapter's scene + battle MusicKeys
}
```

`ChapterObjective` is `{ id, label, rule: ObjectiveRule }`. `ObjectiveRule` is a
small tagged union — a **pure descriptor**, not a function. This module never
imports `BattleState`; the pause screen (or whatever owns the objectives UI) is
what evaluates a rule against the live battle and flips the checklist row. The
shapes in play today:

```ts
type ObjectiveRule =
  | { kind: 'status-cured'; status: string }        // a status was removed from the party (or, once, from the boss — see Ch.2)
  | { kind: 'survived-ability'; ability: string }    // the party was still standing after a named enemy ability resolved
  | { kind: 'form-reached'; form: number }           // Yunalesca-style in-place transformation reached
  | { kind: 'boss-hp-below'; fraction: number }      // unused by the five shipped objectives, kept for future chapters
  | { kind: 'link-reached'; link: number }           // reached link N of a chained EnemyGroupDef (BattleSetup.chained)
  | { kind: 'parts-downed'; targetIds: readonly string[] } // a named group of enemy ids all reached 0 HP at once
  | { kind: 'chain-landed'; count: number }          // FFX-2 Chain Attack counter (FFXCombatant.chainCount) reached N
  | { kind: 'victory' };
```

`link-reached` and `chain-landed` look similar and are not interchangeable:
`link-reached` counts **which battle of a chained chapter** is live (Vegnagun's
four-part chain; `EnemyGroupDef.nextGroupId`/`BattleSetup.chained`). `chain-landed`
counts the FFX-2 **Chain Attack** damage multiplier on a single target
(`FFXCombatant.chainCount`, `BattleEvent` type `'chain'`) — a within-battle combo
counter, unrelated to which link of the chapter you're on. Chapter 5 uses
`link-reached`; Chapter 4 uses `chain-landed`. Don't reuse one for the other.

`parts-downed` and `chain-landed` are not in the brief's six example shapes;
they were added because two of the five chapters' real objectives ("down both
Yu Pagodas at once", "land a 5-hit Chain Attack") don't fit any of the six.
If you add a chapter or an objective that needs a new rule shape, extend this
union the same way: flat, serialisable, named after the observable game fact,
never a closure.

### Per-chapter objectives, and why

| Chapter | Objectives | Source |
|---|---|---|
| Seymour Flux | cure Zombie before Full-Life lands · survive Total Annihilation · defeat Seymour Flux | `research/ffx-seymour-flux.md` §6 rows 4–5, 13 |
| Yunalesca | reach Form III with a Zombie still standing · dispel her Regen · defeat all three forms | `research/ffx-yunalesca.md` §10.1, §10.5 |
| Braska's Final Aeon | down both Yu Pagodas at once · survive Ultimate Jecht Shot · send Yu Yevon | `research/ffx-bfa-yu-yevon.md` §1.4 (targeting rule: "kill both or neither") |
| FFX-2 Bahamut | survive a Mega Flare · land a 5-hit Chain Attack · defeat Bahamut | `research/ffx2-bahamut.md` §3 (Chain Attack as the ignores-Defense damage route) |
| Vegnagun / Shuyin | destroy all four of Vegnagun's parts (`link-reached`, link 4) · survive Terror of Zanarkand · free Shuyin | `research/ffx2-vegnagun-shuyin.md` §7.2 |

Chapter 4's objectives are tracked normally even though its Results screen is
silent — [writing-bible §5.4] suppresses the victory pose/fanfare/quip, not the
pause-screen checklist. `Chapter.music.victory` stays absent for that chapter in
`encounters.ts`; `chapter-meta.ts` doesn't touch it.

### Art status (as of the data slice — now superseded, see Part 2)

At the time this was written, no pause-screen art existed. `heroArt` on every
chapter (e.g. `'pause/ch1-seymour-flux'`) was the *intended* commission and has
**no file extension**, because the art pipeline hadn't rendered it and the
eventual format (png vs. webp) wasn't decided.

Every chapter also has `heroArtFallback`: a path relative to `public/art/`,
extension included, pointing at an **existing, shipped** portrait or character
sheet. The test suite checks that every fallback file exists today. The pause
screen tries `heroArt` first (with whatever extension the art pipeline lands
on) and falls back to `heroArtFallback` — `heroArtCandidates()` in
`ui/common/chapterPanel.ts` is that list.
`snapshots[].image` always points at existing, already-rendered backdrop/character
art — never a new commission — so those three tiles per chapter render
immediately with no fallback needed.

---

# Part 3 — verification pass (2026-09-18)

An independent pass over Parts 1 and 2: no source files were changed, the two
suites were re-run, and the screen was driven in a browser on a dev server at
`http://localhost:5322/`. What follows is what actually happened, including
two things that Part 2 does not mention and that matter to whoever touches
`BattleScreen.requestExit` next.

## Green

- `npx tsc --noEmit -p tsconfig.json` — clean, whole project, with every
  concurrent agent's in-flight file included.
- `npx vitest run` — **85 files, 2858 tests, all passing**, which is exactly
  the count Part 2 reports. Nothing needed fixing.

## In the running game

Driven through `window.__pyrefly` on a real page, with real key events for
anything a player would press. Numbers are from one Chapter 1 run at `fast`
with the `intended` strategy, seed 7.

| Claim | Result |
|---|---|
| `Esc` during battle opens the pause | yes, on the first press (`app/Input.ts` maps Escape to `cancel`) |
| The battle freezes | log 41 -> 41 and `turn 4 / ticks 6` unchanged across 4 s of wall clock; `playTimeMs` 2316.6 -> 2316.6 |
| The objectives are live | `cure-zombie-before-full-life` / `survive-total-annihilation` / `defeat-seymour-flux` all evaluated, `BOSS HP 100%` progress row correct |
| Resume returns without a lost turn | Enter on RESUME puts the battle screen back; the first events appended after the resume are `turn-start, action-start, damage, status-add` and the pre-pause log is byte-identical as a prefix, i.e. turn 4 was not re-run and turn 5 was not skipped |
| Play time restarts | 2216.7 before the pause, 2416.7 after the resume |
| No console errors | none, and no page errors, across every step |

## The thing Part 2 does not say: these exits need `GameFlow.start()`

RESTART / CHAPTER SELECT / QUIT do **not** navigate themselves. As Part 2
explains, `requestExit` aborts and waits for the flow to unwind. What it does
not say is *which* flow: `GameFlow.start()`'s `for(;;)` loop in
`BattleScreenFlow.ts` is the thing that reacts to an `aborted` outcome by
going back to chapter select.

`__pyrefly.gotoChapter()` calls `app.runChapter()` **directly**, outside that
loop. So in a test or capture script that entered the chapter that way, an
aborted chapter returns to nobody: the app sits on a dead battle screen with
`exitIntent: 'restart'`, a frozen log and no way out (observed for 60 s+).
This is not a player-visible bug — but it is a trap for the next person who
tries to verify these three rows the way this pass first did.

Driven the way a player does (title -> ENTER -> chapter select -> prep ->
battle, which is the flow `main.ts` already started), all three work:

- **RESTART ENCOUNTER** — a new `BattleScreen` instance comes up on the same
  chapter, with a fresh log.
- **CHAPTER SELECT** — lands on `chapter-select`, `flowStep: 'chapter-select'`,
  flow healthy.
- **QUIT TO TITLE** — lands on `title`, and ENTER there starts a new run
  normally, so nothing is soft-locked.

## Two defects found, neither fixed here

1. **QUIT leaves a duplicate TitleScreen on the stack.** After QUIT the stack
   is `["TitleScreen", "TitleScreen"]`, and the orphan is still underneath on
   the next screen (`["TitleScreen", "ChapterSelectScreen"]`). Two `goto('title')`
   calls race: `GameFlow.start()` runs one when `chapterSelect()` resolves null,
   and `BattleScreen.requestExit('title')` runs the other. `App.goto` is
   `stack.length === 0 ? push : replace`, and `replace` awaits `popInternal()`
   before pushing, so two interleaved calls each pop once and push once and the
   stack grows by one. Cosmetic today (the orphan is never updated, only the
   top screen is), but it leaks a screen and its DOM root per QUIT. The fix
   belongs in `App.goto` — serialise navigation, or have `requestExit('title')`
   not fire when the flow is already going there.
2. **The black FFX-2 portraits are still black.** Re-measured:
   `public/art/portraits/paine.1.raw.png`, `yuna-ffx2.1.raw.png` and
   `rikku-ffx2.1.raw.png` are all 832x1216 with an RGB mean of exactly
   0.0/0.0/0.0. Part 2 called this out; it is unchanged, and it is what the
   black third snapshot tile in `pause-ch4.png` and the `P` initial on Paine's
   card in `prep-chapter-tab-ffx2.png` are showing.

## One thing this pass did change: photo mode was showing the battle HUD

`pause-photo.png` had regressed since Part 2 captured it. Photo mode came up
with the frozen battle HUD on top of the turntable — the strategy-guide panel,
the sensor card, the CTB portrait column, the party rows and a mid-swing `775`
damage numeral, all in the shot.

`PhotoMode` only hides the chrome it is handed, and what it is handed is the
pause screen's own stage. The HUD is not in it: `BattleScreen` mounts the HUD,
`DamageNumbers`, the message bar and the guide into **its** screen root, a
sibling `div` under `App.uiRoot`, and the pause root only covers that because
Part 2 gave it `z-index: 60`. Take the pause chrome away and what was
underneath comes back.

`PauseScreen.enterPhotoMode` now hides the screen roots below it
(`hideScreensBelow` / `restoreScreensBelow`, restored on exit **and** in
`exit()` so closing the menu straight out of photo mode cannot leave the HUD
invisible). Nothing visual is lost: the diorama is drawn by the renderer's own
canvas, which is not inside any screen root.

This is the only source change made in this pass. `tsc` stays clean and the
suite stays green (85 files, 2871 tests at the time of writing — the count
moves as other agents land their own tests).

## Still open, seen in the re-captured screenshots

- **The PARTY tab clips its third member.** With battle buffs up, each card
  grows a status-chip row (HASTE / PROTECT / SHELL / NUL*), and the panel has
  no overflow handling — in `pause-party.png` Kimahri's card is cut off
  mid-row at the panel's bottom edge. It fit before only because nobody had
  buffs yet. `pause-screen.css` needs the panel to scroll, or the cards to
  shrink, once a third card plus chips exceeds the height.
- **Chapter 3's party starts at half HP** in `pause-ch3.png` (6492/12984,
  5130/10260, 9419/12984 at `PLAY TIME 0:01`). That is the tactics/builds
  agent's in-flight `dreams-end` work showing through the pause screen, not a
  pause-screen bug — but if it is not deliberate, the Chapter 3 build is
  doubling `maxHp` without healing to full.
