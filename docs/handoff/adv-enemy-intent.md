# Handoff — the enemy-intent slab

**Key:** `enemy-intent`. Port 5353.

The player asked for a read-out, near the enemies, of *the enemy's next move* —
what it is called, what it does, how much damage it does, "etc etc everything
about it" — hideable the same way the strategy guide is. This is that.

Screenshots: `docs/screenshots/adv/intent-*.png` (1600x900).

---

## 1. What it is

A slab hung over the boss's head, projected from the actor exactly like a damage
numeral, saying what the next enemy to act is about to do:

* **Who and when** — the enemy `predictTurnOrder` / `gaugeSnapshot` puts first,
  and its place in the queue ("acts next" / "4th in queue").
* **The move** — its name, and whether the rotation is deterministic
  (`SCRIPTED`) or a weighted branch (`LIKELY 70%`, with the odds listed).
* **What it does** — one sentence composed from the `AbilityDef` itself:
  damage type, element, target scope, hit count, drains, Defense-piercing, the
  99 999 cap, what it strips, whether it can miss.
* **How much** — a per-character damage row with the variance band, the share of
  that character's current HP, hit chance when it is not 100, and a red **KO**
  where the hit is lethal.
* **Statuses** — each one with its real odds against each target, including
  `Death 0% (blocked)` on a Zombie, which is the whole of Chapter 2.
* **Charge countdowns** — Total Annihilation, Mega Flare and the rest, with the
  turns left *and* a full damage estimate for the move the countdown lands on.
* **"If you attack"** — the counters that never appear in the turn forecast
  because they fire from the hit hook: Yunalesca's Blind/Silence/Sleep (with the
  gate bug that switches them off), Seymour's threshold Protect/Reflect, the
  Delay punish, his Banish while an aeon is out, Yu Yevon's Curaga, Vegnagun's
  Bulwark answers.
* **Form changes** — once the current form is nearly done, the next form's name
  and the opener it arrives with.
* **Standing resources** — Braska's Final Aeon's Overdrive gauge and remaining
  Talk charges; the Vegnagun head's fail clock; a Confused or Berserk actor.

`E`, standard-gamepad button 3 (Triangle / Y) or the slab's own chip hides all of
it and leaves a two-word chip still over the boss. The answer is remembered in
`Settings.intentVisible` and applies to every later battle. It defaults **on**.

Works in both HUDs.

## 2. Files

| File | What |
|---|---|
| `src/battle/ffx/intent.ts` | FFX prediction: clone, dry-run, sample, describe |
| `src/battle/ffx2/intent.ts` | the X-2 twin, plus its own simulate adapter |
| `src/battle/ffx/estimate.ts` | the damage figures, adapted from `simulate.ts` |
| `src/ui/common/EnemyIntent.ts` | the slab: DOM, projection, dodging, input, the preference |
| `src/ui/common/enemy-intent.css` | its chrome |
| `tests/unit/enemy-intent.test.ts` | 29 tests, engine side, headless |
| `tests/unit/ui-enemy-intent.test.ts` | 32 tests, panel side, jsdom |
| `critic/scratch/adv-intent-shot.mjs` | the capture script |

Additive edits elsewhere, all small and all listed:

| File | Edit |
|---|---|
| `src/app/SaveData.ts` | `Settings.intentVisible`, default `true` |
| `src/ui/common/ControlsHint.ts` | `INTENT_HINT_ITEM` (the `E` / Triangle wording) |
| `src/ui/ffx/FFXBattleHud.ts` | mounts the slab on its overlay; `setIntentSource`; `intentAvoidRects()`; `hudScale()` |
| `src/ui/ffx2/FFX2BattleHud.ts` | the same |
| `src/battle/ffx/engine.ts` | `intent()` — three lines beside `predictTurnOrder` |
| `src/battle/ffx2/engine.ts` | `intent()` — the same, plus the registries the predictor needs |
| `src/app/screens/BattleScreen.ts` | two lines: `attachEnemyIntent(hud, engine)`, and `consumeIntentKeyPress()` (see §6) |

`public/art/**` was not touched. `src/ui/common/StrategyGuide.ts`,
`strategy-guide.css` and `src/engine/tactics/**` were read only.

**One collision worth knowing about.** The advisor agent and I both edit the
avoid-selector list in `FFXBattleHud.intentAvoidRects()`; a concurrent edit there
dropped `.ffx-sensor` from mine and it took three captures to notice, because
the only symptom is a slab printed across the Mortiorchis's scan card. If you
touch that array, add to it — do not retype it.

## 3. Predicting a turn without taking it

This is the whole design and everything else follows from it.

Every FFX rotation is stateful: Seymour's six-step cycle lives in `state.flags`,
Yunalesca's `priv0004` in her actor's AI memory, the Mortiorchis's charge ladder
in both, and `braskas-final-aeon.ts` *writes* to the Overdrive gauge and to
`bfa.logSeen` on the way past. So asking a script "what would you do" by calling
it is an action with consequences — at once per render the Mortiorchis charges
to Total Annihilation in about a second and Yunalesca's ring spins.

`cloneCtx` makes a private copy and the script runs against that:

| Field | Treatment | Why |
|---|---|---|
| `state.combatants` | deep copy | HP, statuses and `enemy.formIndex` all get written |
| `state.flags` | copy | Seymour's whole cycle is here |
| `state.log` | **shared reference** | read-only for a script, and the biggest object in a late state — copying it per sample would cost more than the frame it draws |
| `rt.actors` | deep copy per entry | `ai` memory and `charge` both get written |
| `rng` | forked at the live stream position | a script that rolls must not consume the battle's stream |
| `content` | shared | a read-only registry |
| `emit` | collector | a telegraph fired while being *asked* a question must not reach the log |

X-2 is easier: its AI memory lives on the unit (`Ffx2Unit.aiMemory`), so a copy
of `state.combatants` plus `state.flags` is a complete, isolated board. It is
harder in one place — the ability registry is not in the state, so the engine
hands it over in `Ffx2IntentEnv`.

`tests/unit/enemy-intent.test.ts`'s first block is this claim as an assertion:
it fingerprints the public state, every actor runtime, the AI memory, the CTB
counters and the RNG stream position, runs ten predictions, and compares.

## 4. Confidence is measured, not declared

Some rotations are deterministic (Bahamut's 12-action loop, Shuyin's 8-step
cycle, Yunalesca Form III's five-step ring) and some are weighted branches (her
`P(heal) = 20 * zombieSlots + 10`, BFA's 75/25 table). A hand-maintained "this
one is random" table rots the first time a data agent retunes a weight — and the
failure mode is the bad one: the panel stating a coin toss as fact.

So the same dry run is repeated `SAMPLE_COUNT` (24) times from different RNG
positions and the answers are tallied. All agree → `'scripted'`, and the panel
says it flatly. They disagree → `'likely'`, and the panel prints the odds it just
measured. Sample 0 uses the **live** stream position, so for a deterministic
rotation the printed move is not merely likely, it is the move.

24 is a compromise: a 10%-weight branch is missed about 8% of the time, and one
sample deep-clones the board, so the UI caches the whole report behind a
signature and refreshes it on `sync` (once per playback step) rather than per
frame. A test pins the relationship rather than the number — one sample reports
Yunalesca's weighted step as `scripted`, the default reports it as `likely`.

## 5. The damage figure comes from `simulate.ts`

`src/battle/ffx/simulate.ts` did not exist when this task started (the spec
anticipated that and named `estimate.ts` as the fallback), and it landed
mid-flight. It is the better answer — it clones the state and runs the **real**
`executeCommand` with a roll-policy RNG — so `estimate.ts` was rewritten as a
thin **adapter** over it rather than as a second estimator. It runs
`simulateFFXCommand` at `min`/`mid`/`max` (which is exactly the variance band)
and reshapes the three `SimOutcome`s into one per-target list. X-2 does the same
over `simulateFFX2Command`, inline in its `intent.ts`.

Two panels on one screen deriving the same number independently is the worst
available outcome: the player reads "1 204" under their own cursor and "about
1 400" over the boss's head and trusts neither. If `simulate.ts` moves or
renames, `estimate.ts` is the one file that changes.

The only thing `estimate.ts` adds is `statusOdds`, because a simulation resolves
each status roll at its median and therefore reports a status as landed or not
landed. The percentage is a pure function of the chance byte and the target's
resistance [ffx-combat-core §4.1], and the Zombie branch — a living Zombie's
resistance to instant death is raised to 255, so chance-100 Mega Death simply
fails — is the single most important number this panel can print.

`content` is threaded through to the simulation deliberately. Without it the
simulation falls back to the process-wide registry, which is empty in a unit
test and stale in any host that injected its own — and an unregistered ability
estimates as "does nothing".

### 5.1 A countdown prices its payload

A charge turn spends the action on a number, so there is no command to estimate,
and "this turn does nothing" is the least useful thing the panel could say with
Total Annihilation two turns out. So the **payload** is described and costed
instead, against the board the player is standing on: the Chapter 1 capture
prints Total Annihilation's five hits as 2 420 / 1 500 KO / 3 410 KO before it
lands.

The charge *name* is the state the enemy entered ("Ready To Annihilate"), not
the move, and no field on the event carries the payload, so a two-entry table
maps one to the other. It is keyed on the string the player is already reading
on the telegraph banner, so a rename breaks it visibly.

### 5.2 One countdown, one number

The slab prefers the count the player can **already see** — FFX's `rt.charge`,
X-2's newest logged `charge` event — over the one its own dry run produced,
which is what the *next* turn will announce and is one lower. The strategy
guide's WATCH row reads the visible one, and two different countdowns for the
same move on one screen is worse than either. Caught on the Chapter 4 capture:
the guide said "in 5 turns" and the slab said "in 4". Both now say 5.

The same reasoning removed the Bahamut note's own figure. It printed
`bahamutCountdown`, which is the last value actually emitted — a third number for
one clock. The note keeps the rule ("an action counter, not a clock, so Slowing
him slows it too") and drops the figure.

## 6. `E`, and the pause it collides with

`E` is the letter a player will guess for "enemy", and it is the one binding here
that was **not** free: `src/app/Input.ts` maps `E` (with `C` and the pad's Start)
to the abstract `start` button, and `BattleScreen.handleInput` opens the pause
menu on `start`. Both are reasonable and they collide.

Two non-options. Rebinding in `Input.ts` puts a battle-only special case in a
contract file thirty agents compile against. Stealing the event in a
capture-phase listener cannot work — `Input.ts` binds `keydown` in the capture
phase at boot, so it is always first in the queue.

So the collision is resolved where it belongs. The slab's own listener records
the press; `consumeIntentKeyPress()` lets `BattleScreen` take the `start` edge
for it, once per press, destructively. One tap of `E` hides the slab and does not
also open the pause; `P`, `C`, `Esc`, the pad's Start button and the PAUSE chip
all still open it, so the pause keeps four ways in and loses one alias.
`docs/screenshots/adv/intent-ch1-hidden.png` is that press, made with
`page.keyboard.press('e')` on a live board: `panelHidden: true`,
`pauseScreen: false`.

The pad takes standard button 3 (Triangle / Y). `PAD_MAP` binds it to the
abstract `triangle`, which no battle screen reads — the demo scene is its only
consumer — and button 2 is already the strategy guide's, so the two optional
panels sit on the two face buttons a fight leaves idle.

## 7. Layout: pinned to the boss, never on the queue

The slab lives on the HUD's **unscaled overlay**, the layer the damage numerals
use, because it is positioned from the presenter's projector and the projector
answers in viewport pixels. It scales by the letterbox factor so its type lands
in the same size register as the rest of the chrome.

`transform: scale()` off the top-left corner, not `zoom`, which was tried first
and is wrong: `zoom` scales the used values of `left` and `top` as well, so a
panel told to sit at x=400 on a 2.5x stage lands at x=1000.

Three steps per frame, each depending on the last: **project** (viewport pixels
into layer-local ones), **clamp** to the layer (a boss at the edge of frame would
hang the slab half off-screen), then **dodge** every rectangle the owner names —
`.ig-ctb`, the command stack and its help card, the party list and the sensor
card in FFX; the boss-gauge strip, the party column and the command menu in X-2.
It slides to whichever side has more room and drops *below* the rectangle when
neither side has enough. The CTB queue matters most: the slab's whole claim is
"this is what the actor at the top of that queue is about to do".

`.ig-banner` is deliberately **not** dodged, for the reason
`ffx/DamageNumbers.ts` gives about the telegraph: it is a transient band across
the top of the field and dodging it would move the slab at exactly the moment the
boss is winding up and the player is reading it.

A projection that comes back `null` for a frame holds the **last good point**
rather than falling to the centre of the screen. The centre of a 1600px stage is
613px, which is where the scan card is — that fallback is what put the slab
across it in an early capture.

The tail notch slides along the panel's bottom edge to keep pointing at the head,
and is dropped when the panel had to be clamped away from it: a notch on the
wrong edge claims a relationship that is not there.

Not skewed, for the reason `strategy-guide.css` records at length — at 12deg a
150px-tall box leans 32px and every paragraph reads as a lozenge. The accent
moves instead: a **blood** bar on the top edge, plus the house skew on the short
elements. Blood rather than each game's own accent is deliberate: Direction A
reserves `--ig-blood` for the enemy side, the CTB list already outlines enemy
rows in it, and an enemy read-out reading the same in both games is worth more
than matching the local accent.

## 8. Wiring, without a contract change

`HudPort` and `BattleEngine` are two of the five files `docs/CONTRACTS.md` names,
and one optional panel does not earn a shape change there. So both sides are
**duck-typed**: `attachEnemyIntent(hud, engine)` probes for
`hud.setIntentSource` and `engine.intent`, and a HUD or engine without them
simply gets no panel. `CONTRACT-CHANGES.md` needs no entry.

The HUD needs the live *engine*, not the `BattleState` it is synced with, because
the AI memory a prediction reads is engine runtime that `BattleState` does not
carry. That is the one line in `BattleScreen`.

A prediction that throws is caught and the panel goes quiet. A prediction is
never worth a frame.

## 9. Verification

```
npx tsc --noEmit          # clean, whole tree
npx vitest run            # 93 files, 3020 tests, all green
```

61 new tests.

* `tests/unit/enemy-intent.test.ts` (29) — the non-mutation fingerprint across
  ten predictions, for Seymour (flags) and Yunalesca (actor memory); a clone that
  can be scribbled on; the shipped openers (Seymour's Lance of Atrophy, the
  mount's Full-Life on its own parity, Dispel at step 4, Cross Cleave at step 5,
  Yunalesca Form III's Mega Death at step 4 and its forced Mind Blast at step 2);
  the weighted step reported as `likely` with odds summing to 100; a one-sample
  run reported as `scripted` and the default not; the two-then-one charge ladder
  with its exact `turnsLeft` and stage; an aeon holding the ladder; the payload
  priced during a charge; Mega Death lethal on a living character and blocked on
  a Zombie; the composed description; the counters; the next form's opener; the
  BFA gauge; and the FFX-2 half — Bahamut's opener, the five dead turns counted
  5 → 1, the loop not advancing, the visible count preferred over the predicted
  one, and Impulse and Mega Flare priced.
* `tests/unit/ui-enemy-intent.test.ts` (32) — the default; the damage rows and
  the single lethal marker; healing printed as a restore; scripted vs likely; the
  countdown row and "this turn"; `E`, the pad button and the chip; the chord and
  repeat guards; the preference surviving into a second battle; listeners dying
  with the panel; the `consumeIntentKeyPress` seam answering once; the projection
  and the four dodge cases (including the exact geometry from the Chapter 1
  capture); the letterbox scale; `attachEnemyIntent` including a throwing engine;
  and both HUDs mounting it.

### 9.1 Captures

Driven through `window.__pyrefly` on a dev server at port 5353, with real
`page.keyboard.press`:

| File | What |
|---|---|
| `docs/screenshots/adv/intent-ch1-on.png` | Chapter 1, Seymour's Lance of Atrophy at an open decision |
| `docs/screenshots/adv/intent-ch1-hidden.png` | the same board, `E` pressed — chip only, and no pause menu |
| `docs/screenshots/adv/intent-ch1-countdown.png` | Total Annihilation **this turn**, priced at 2 420 / 1 500 KO / 3 410 KO |
| `docs/screenshots/adv/intent-ch2-yunalesca.png` | Chapter 2, Dispelling Slap and her three counters |
| `docs/screenshots/adv/intent-ch4-bahamut.png` | Chapter 4, the FFX-2 HUD |
| `docs/screenshots/adv/intent-ch4-countdown.png` | Mega Flare in 5 turns, priced per girl |

```
node critic/scratch/adv-intent-shot.mjs --chapter=seymour-flux --frames=160 --out=...intent-ch1-on.png
node critic/scratch/adv-intent-shot.mjs --chapter=seymour-flux --frames=160 --keys=e --out=...intent-ch1-hidden.png
node critic/scratch/adv-intent-shot.mjs --chapter=seymour-flux --frames=120 --seed=7 --charge --out=...intent-ch1-countdown.png
node critic/scratch/adv-intent-shot.mjs --chapter=yunalesca --frames=160 --seed=3 --out=...intent-ch2-yunalesca.png
node critic/scratch/adv-intent-shot.mjs --chapter=ffx2-bahamut --frames=180 --seed=5 --out=...intent-ch4-bahamut.png
node critic/scratch/adv-intent-shot.mjs --chapter=ffx2-bahamut --frames=120 --seed=5 --charge --out=...intent-ch4-countdown.png
```

Three things about the capture script are worth writing down, because the obvious
version produces a screenshot that disagrees with the read-out printed beside it.

* **The frame pump must be driven, in chunks** — the strategy guide's capture
  script says this too and it is still true.
* **Freeze the app before the shutter.** The presenter paces itself on
  wall-clock awaits, not on `frames()`, so unless the board is parked on a player
  decision it keeps playing straight through a ~20 s swiftshader screenshot.
  Three attempts at the countdown capture showed a different turn from the
  snapshot beside them before `App.stop()` went in, after the key presses so
  input still reaches a running game.
* **`.ig-cmd` is the "a decision is open" test.** `.ig-cmd-stack` is in the DOM
  for the whole battle (`CommandMenu` appends it at construction), and the
  guide's `.sgd__cmd`/`.sgd__idle` pair survives `commandMenu.suspend()` — the
  guide's decision is only cleared when the command promise settles.

The script also dumps every avoided rectangle beside the panel's own box, so a
capture that looks wrong says why instead of needing a second run to find out.

## 10. Open

* The slab's height is content-driven and a boss with a full counter list plus a
  damage table runs ~420px at a 2.5x letterbox, which clamps it to the top of
  the frame and drops the tail. It is legible and it is hideable, but a
  compact mode keyed on available height (the way the guide rail has one) would
  be better than clamping.
* `CHARGE_PAYLOAD` has two FFX entries and one X-2 entry. Any new telegraphed
  move needs a row, or its countdown prints the charge's own name and no
  estimate.
* The FFX-2 counter copy covers the Vegnagun bodies; Shuyin and the Redoubts
  have none written, so their slabs show no "if you attack" section.
* `predictEnemyIntents` (every enemy, in forecast order) is written and tested
  but nothing draws it. A second slab over the Mortiorchis while Seymour's is up
  would need an overlap solver between the two, which is why it is one for now.
