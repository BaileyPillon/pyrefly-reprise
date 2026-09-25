# Paper preflight: an enemy hit closes an open FFX-2 command menu (item 4, A1)

Track `ffx2-menu`, decision sheet 2026-09-25 item 4 (`docs/plans/decisions-2026-09-25.md`, PR-0105,
D-010). Bailey, 2026-09-25 ~11:00 EDT, verbatim: *"I'll go with all your recommendations"*, so
**A1**: the hit closes the menu, and **no** delay. A2 (a delay of an `[estimate]` size) has no
source and is **not** built. Deep class (rule 15): `node tools/critic-plan.mjs --paths
src/battle/ffx2/active.ts,src/battle/ffx2/engine.ts` says **DEEP** (FFX-2 ATB engine, a shared
system): focused review before deploy, deep review on the live build. No save-data change.
Paper first; the numbers in section 7 were measured before and after the code.

## 1. Sources (quoted, single source)

- `research/ffx2-combat-core.md` §1.1, the ATB-fill row of the turn-pipeline table, "Can be
  interrupted?": *"being hit while the command menu is open cancels the menu and delays the
  turn."*
- Same file, §1.5, **Active** `[single source: Split Infinity G0913]`: *"An enemy hit landing
  while a menu is open **closes the menu and applies Delay effect** to that character's ATB."*
- §1.5, **Wait**: *"Time runs while the top-level Main Command Window is open, but **freezes the
  moment any submenu is entered**."* So under Wait's split an enemy can only act, and so only
  hit her, while the top-level list is open; in a submenu or the target cursor the clock is held.
- §2.8 (for A2 only): a Delay effect empties a *"predetermined percentage"* set per ability. No
  source gives one for a plain hit. **Not built.**

## 2. Game case (rule 14): FFX-2 only

FFX is CTB: nothing acts while a menu is open (`research/ffx-vs-ffx2-presentation.md` §4.3), so
there is nothing to close. The change lives in `src/battle/ffx2/` and is reachable only when the
X-2 clock runs under an open menu: **Active**, and **Wait's split at the top-level list**. The
old whole-menu hold (`?wait=hold`) and the split's `'deep'` level hold the clock, so no enemy
acts there and nothing changes.

## 3. What "a hit" is (our reading, written down)

A `'damage'` event with `amount > 0`, `targetId` = the girl whose menu is open, and `sourceId` =
an **enemy** unit. That covers an enemy's own turn, an enemy's charged command landing, and an
enemy counter. It excludes: a miss (no damage event), an immune or absorbed blow (`amount <= 0`),
poison and other status ticks (no `sourceId`), her own HP costs (no `sourceId`), and a hit from a
Confused ally (`sourceId` is party). A status-only enemy ability (no damage) does not close the
menu under this reading; Sleep, Stop, Petrify and Berserk already close it through the existing
menu-invalidation rule (`active.ts` `inputStillValid`). The source says only "hit"; this reading
is the narrowest one that is certainly a hit.

## 4. Design (minimal, engine-internal, no contract change)

- **State:** one engine-private field, `hitClosed: CombatantId | null`, the girl whose open menu
  an enemy hit closed. Engine-internal like `inputOwner` and `held`: no `BattleState` field, no
  event shape, no save shape, so `docs/CONTRACTS.md` is untouched.
- **Where it is set:** in `emit`. A drafted event is tested by a pure helper in `active.ts`,
  `closesOpenMenu(draft, owner, units)`, only while `inputOwner` is set. An enemy can only act
  with a menu open inside `tick` when the clock is not held, so this is exactly §1.5's window.
- **What it does:** `inputStillValid` gains one argument: a menu an enemy hit closed is no longer
  answerable. Everything downstream already exists and is tested: the presenter's pump
  (`BattlePresenterActive.runActivePump`) polls `inputValid` after every step and returns
  `'invalidated'`, the presenter closes the DOM menu (`abandon`), and `FFX2Engine.submit` refuses
  a command confirmed in the same step. No presenter or HUD change.
- **Re-offer:** the next `nextDecision()` clears `hitClosed`, and a re-offered menu starts at
  level `'deep'` (held) until the HUD reports its top list, the same rule a new owner gets. With
  no delay her bar is still full, so she is offered a fresh menu at once, unless a lower slot is
  also ready (then the ATB row order decides, as it does for every fresh menu).
- **No delay (A2 not built), no "any damage perturbs the bar" rule** (§1.1, same single source,
  never asked). `applyDelayEffect` stays reserved for abilities that carry one.
- **House rule:** `engine.ts` is over 400 lines and must not grow. The field, the `emit` test and
  the re-offer clear are paid for by folding two comment lines, so its line count stays 634.

## 5. What cannot change (the regression argument)

- **Zero decision time** (every golden, every bench at D = 0): no menu is ever open while the
  clock runs, `inputOwner` is set only between `nextDecision` and `submit`, and no enemy acts in
  that gap. `hitClosed` is never set: event logs are byte-identical. Proven by log hashes before
  and after (section 7).
- **Whole-menu Wait** (`?wait=hold`) and the split's held level: `tick` returns before anything
  resolves (`clockHeldByMenu`), so no enemy acts. Unchanged.
- **Chain lock (PR-0080):** a chained girl keeps her menu; that rule is untouched. If the chaining
  blow also dealt damage, the blow closes the menu under A1, which is the source's rule.
- **FFX:** no code path shared. `tests/unit/ffx-no-active-clock.test.ts` stays green.

## 6. Tests

`tests/unit/ffx2-hit-closes-menu.test.ts`, run on the real engine (rule 3): (1) Active: an enemy
hit on the owner makes `inputValid` false and `submit` refuse; the next `nextDecision` re-offers
her, level `'deep'`; (2) Wait split at the top list: the same; (3) Wait split, level `'deep'`:
the clock is held, no enemy acts, the menu stays; (4) `?wait=hold`: the same; (5) a hit on a
different girl leaves the owner's menu open; (6) the pure helper: a miss, an immune blow, a poison
tick, a self HP cost and an ally's blow do not close it; (7) D = 0 replay identical to the
pre-change hash for Chapters IV, V and VI.

## 7. Bench: Chapters IV, V, VI, XI and XIII, before and after

`tests/unit/ffx2-hit-closes-menu-bench.test.ts` (`PYREFLY_MEASURE=1`), each chapter's intended
line: IV, V, VI `intendedStrategy`; XI `shivaIntended`, `sistersDarknessDispel`, `animaIntended`
(the chain); XIII `LINES.kitIntended` on the shipped record. Arms: **bench speed** (D = 0, the
default Wait split) and **human Wait split** (the Chapter XIII bench's model: 1.5 s a menu, 0.5 s
on the top list with the clock running, 1.0 s held), plus an **Active 1.5 s** control. 40 seeds
(IV, V, VI, XI, and XIII's Active arm), 200 seeds for XIII's bench and Wait-split arms (its own
bench's count). "Menus closed" counts every `inputValid` that came back false after a menu's
clock ran (KO, Stop, Sleep, and now a hit).

Measured on d19e5715 (before) and with the change (after), same seeds, same lines.

| Chapter | Arm | Wins before | Wins after | Avg min before / after | Menus closed before / after | Logs |
|---|---|---:|---:|---:|---:|---|
| IV Bahamut | bench, D = 0 (Wait split default) | 40/40 | **40/40** | 1.68 / 1.68 | 0 / 0 | identical |
| IV Bahamut | human, Wait split 0.5 s top / 1.0 s held | 40/40 | **40/40** | 1.91 / 1.92 | 2 / 166 | moved |
| IV Bahamut | control, Active 1.5 s | 40/40 | **40/40** | 2.41 / 2.51 | 13 / 462 | moved |
| V Vegnagun | bench, D = 0 (Wait split default) | 39/40 | **39/40** | 6.08 / 6.08 | 0 / 0 | identical |
| V Vegnagun | human, Wait split 0.5 s top / 1.0 s held | 32/40 | **28/40** | 8.71 / 8.51 | 89 / 699 | moved |
| V Vegnagun | control, Active 1.5 s | 5/40 | **2/40** | 10.48 / 5.59 | 169 / 1232 | moved |
| VI Leblanc | bench, D = 0 (Wait split default) | 40/40 | **40/40** | 2.18 / 2.18 | 0 / 0 | identical |
| VI Leblanc | human, Wait split 0.5 s top / 1.0 s held | 29/40 | **33/40** | 4.01 / 3.52 | 18 / 295 | moved |
| VI Leblanc | control, Active 1.5 s | 5/40 | **2/40** | 4.19 / 3.85 | 79 / 823 | moved |
| XI Fallen Aeons | bench, D = 0 (Wait split default) | 14/40 | **14/40** | 2.30 / 2.30 | 0 / 0 | identical |
| XI Fallen Aeons | human, Wait split 0.5 s top / 1.0 s held | 8/40 | **5/40** | 2.04 / 1.85 | 15 / 230 | moved |
| XI Fallen Aeons | control, Active 1.5 s | 2/40 | **1/40** | 1.94 / 1.70 | 24 / 554 | moved |
| XIII Trema | bench, D = 0 (Wait split default) | 15/200 | **15/200** | 5.27 / 5.27 | 0 / 0 | identical |
| XIII Trema | human, Wait split 0.5 s top / 1.0 s held | 13/200 | **16/200** | 5.94 / 5.91 | 9 / 115 | moved |
| XIII Trema | control, Active 1.5 s | 0/40 | **1/40** | 5.53 / 5.55 | 4 / 38 | moved |

Reading the table:

- **Bench speed is untouched**: every D = 0 arm replays byte for byte (the aggregate log hash of
  all its seeds is the same before and after), as section 5 argued.
- **Under the human Wait-split model** the rule fires often (Chapter V: 699 menus closed in 40
  fights, against 89 closures by KO, Stop or Sleep before) but costs little: IV 40 to 40, V 32 to
  28, XI 8 to 5; VI 29 to 33 and XIII 13 to 16 go the other way. At 40 seeds a swing of 3 or 4
  wins is inside the noise (one standard deviation is about 3 wins at 75 %). A closed menu is
  re-offered at once with a full bar, and the line then chooses on the new board, which
  sometimes helps. The model spends another 0.5 s on the top list after each close, as a person
  reopening the menu would.
- **Active 1.5 s** was already mostly lost in V, VI, XI and XIII and stays so (V 5 to 2, VI 5
  to 2, XI 2 to 1, XIII 0 to 1); IV still wins 40/40.
- Unit goldens: the Active D = 1500 arm of `tests/unit/ffx2-atb-golden.test.ts` is re-pinned
  (every seed moves; outcomes as before: chapter 4 10/10, chapter 5 0/10). Every D = 0 and Wait
  golden is unchanged.

## 8. Risks and open points for Bailey

- As the sheet said: a player who waits on the top list loses more menus; item 3's guide line
  teaches the habit that avoids it (open a list at once, and the clock holds).
- The reading of "hit" in section 3 is ours (status-only enemy abilities do not close the menu).
- A2 waits for a sourced delay size or Bailey's yes on an `[estimate]`.
