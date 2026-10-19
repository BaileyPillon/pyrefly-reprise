# Paper preflight — RE parity RC10, FFX formation-script flags (gap scan S8)

> `critic/RUBRIC.md` §4, AGENTS.md rule 15: paper only. `node tools/critic-plan.mjs --paths src/battle/ffx/formation-flags.ts,src/battle/ffx/commands.ts,src/battle/ffx/execute.ts,src/battle/ffx/setup.ts,src/battle/common/types.ts,src/data/ffx/enemies/isaaru.ts`
> classes this as **DEEP** (FFX CTB engine and the shared combat core are shared systems; FFX game data).
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-16 "keep going please all of this reverse engineering needs to be incorporated into our game"; 2026-10-17 "keep going full speed".
> The lane is the gap scan's row S8 (`gap-scan-2026-10-17.md` section 3: "data read first: which of our chapters really hit each flag; then S to M").
>
> **Verdict: PROCEED, narrowly.** The data read (section 2) leaves one flag that a note proves and a chapter reaches. Everything else is listed, not built. Branch `re-parity-rc10-ffx-formation-flags`, cut from `origin/r52-rc` (`3c92b60cc`). Nothing deploys without the release driver.

Written 2026-10-17 by the lane (a Sonnet sub-agent of the RE parity session).

## 1. Game case (AGENTS.md rule 14)

**FFX only.** The flags are calls of FFX's formation scripts (`FFX-G06` is read from `FFX.exe`); FFX-2 has its own exe and its own script machine and this lane reads none of it. `src/battle/ffx2`, `src/data/ffx2` and `src/audio` are not touched, so `ffx2-atb-golden` and `ff7-golden` stay byte for byte.

## 2. What the data read found

The set-up routine (VA 0x00781020) writes each flag's default before the formation script runs; the scan lists every formation file that calls each flag and with which constant (the fixture `tests/fixtures/parity/ffx/formation_flags.json`).

| Flag | Default at set-up | Written by the formations of our chapters | Effect in the game | Reached by a chapter? |
|---|---|---|---|---|
| `setDefendingEnabled(0)` | 1 | `bvyt09_10`, `_11`, `_12` | the party's Defend control (the original's Triangle) returns no command | **yes: Chapter XIV (Isaaru), three links** |
| `btlSetCounterFlag(0)` | 1 | none | counters off for the formation; the counter kernel already takes the byte (`switchOn`, constant 1) | no (11 other files) |
| `btlSetAnimaChainOff(1)` | 0 | 16 formations (Macalania, Omnis, Sin x4, Braska's chain) | applied to the player's Anima model only; no script reads the getter; no arithmetic | yes, but the effect is a model look; our art has no chained variant |
| `btlSetRandPosFlag(0)` | 0 | every one of the 38 | the written value is the default | no effect possible |
| `btlSetEscape(2)` | 0 | none | "escape always works" | no (8 other files) |
| `SetAmbushState` in m065, m304, m340 | n/a | the monsters are not in a shipped formation, except m340 in `nagi05_70` (the Mirror Aeons chapter fights `nagi05_71`) | unsettled order | no |

## 3. What changes

1. `EnemyGroupDef.defendOff?: boolean` (a contract file, additive; `docs/CONTRACT-CHANGES.md`). Set on `isaaru-grothia`, `isaaru-pterya`, `isaaru-spathi`.
2. `battle/ffx/formation-flags.ts` (new): the one switch `FORMATION_DEFEND_OFF`, a `state.flags` key written at set-up (like the aeon duel's, so a fork and the advisor's dry runs see it), and two pure predicates.
3. `commands.ts`: no `defend` row for a party member or an aeon while the key is set. `execute.ts`: a submitted `defend` is refused with the turn kept open and no message. `setup.ts`: one call.
4. The Isaaru tests that used Defend as their "pass" (six cases in `isaaru-duel` and `isaaru-engine`) pass with Cura for Yuna and Attack for an aeon through a new helper `pass`. The duel test's "Defend stays open" becomes "there is no Defend row".

Visible: the Defend tab ("Q / Triangle  Defend") under the command window is drawn only for an enabled `defend` row (`ui/ffx/defendControl.ts`), so in Isaaru's three fights it is not drawn. No new word, no new asset, no UI file changed. The original plays an error cue on the press; that cue is the release driver's.

## 4. Acceptance cases

1. The model of the game (defaults, setters, the one reader) replayed on the 38 chapter formations says exactly three end with Defend off; the data carries the field on exactly those three groups and on no other group of the game.
2. Engine: in each of the three links Yuna's first menu and an aeon's menu have no Defend row, a submitted Defend returns no event and the same actor is asked again; with the field taken off the group Defend is back and works; the other 14 FFX chapters' first menus all offer Defend.
3. A mutation pass of about ten faults (the switch, the copy, the omission, the refusal, the side test, the data) all caught.
4. Measurement: 12 seeds of every FFX chapter before and after, expected byte for byte (the shipped tactic and the app's strategy never choose Defend in the contest); 500 seeds of the Isaaru chain at the benches' pace.
5. `ffx-engine-golden` unchanged (nothing re-pinned); `ffx2-atb-golden` and `ff7-golden` unchanged; `tsc` clean; files under 400 lines; `node tools/orphans.mjs` shows no new orphan.

## 5. Risks

- A bench or test whose fallback is `defend()` loops, because the engine keeps asking. The Isaaru ones were found and fixed; the 200-seed benches are measured after the change.
- Aeons: the engine lists Defend for an aeon in every other battle; the game's field for an aeon was not decoded (the record byte at +0x590 bit 2 decides), so nothing is said about other battles.
- The flag is the formation's, so a chain link that sets it again is the same; a link that does not (none of ours) would restore Defend.
