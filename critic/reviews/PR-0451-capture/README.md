# PR-0451 live capture: "FFX bosses now obey Silence" (Chapter I, Seymour Flux)

Game case: FFX only (Chapter I, `seymour-flux`). Captured 2026-10-14 on the LIVE site, headless Chromium from node (Playwright imported by
absolute path from `D:\Final Fantasy\node_modules`), real key presses through the battle menus. No commits, no installs, no downloads;
the browser was closed by the script (`browser.close()` in a `finally`), no process was killed.

## Build seen

- URL `https://echoesofspira.com/?coach=off`
- The page's script: `/assets/index-DA6NOD0r.js` (the only first-party script tag).
- `window.__pyrefly.build()` returned `{ sha: "b8aa6f96", bundle: "index-DA6NOD0r.js" }`, `version` `0.1.0`. This is the expected r47 build.
- Chromium headless on the real GPU (ANGLE Direct3D11, RTX 5070 Ti), viewport 1600x900, battle speed `fast` (presentation speed only).

## What the debug API was used for (and not)

Used to choose the chapter and seed and to READ state: `setSeed(4)`, `setBattleSpeed('fast')`, `markCoachSeen()` (so no coaching overlay covers
the frame), `gotoChapter('seymour-flux', { skipCutscenes: true, skipPrep: true })` with **no `auto`**; reads: `battleLog()`, `battleState()`,
`snapshotState()`, `frame()`, `build()`. It was never used to inflict a status, submit a command or change state. Every command was a key press.

## Seed and key sequence (seed 4, the run behind the frames and `battle-log.json`)

Wakka, the party's Silence source, is on the bench in the Chapter I preset (active trio: Tidus, Yuna, Kimahri; Wakka knows Dark/Silence/Sleep Attack and
Buster and Aim). The party swap is L1, which on the keyboard is `F`; the swapped-in member takes the turn at once.

| Keys | What they did |
|---|---|
| `Q` x5 | Defend on five menus (Tidus, Yuna, Tidus, Tidus, Yuna) while Seymour's script cycle (`battleState().flags['seymour.cycle']`, read only) climbed 3 to 5 |
| `F`, `ArrowDown`, `Enter` | at Tidus's menu with the cycle at 5: L1 opens the reserve list, down to Wakka, confirm: Wakka takes Tidus's turn |
| `ArrowDown`, `Enter` | Wakka's menu: down to "Special", open it (frame 1 is the next step) |
| `ArrowDown` x4, `Enter` | down to **Silence Buster** (list: Dark Attack, Silence Attack, Sleep Attack, Dark Buster, Silence Buster, Sleep Buster, Aim), confirm |
| `ArrowRight`, `Enter` | the bracket opens on the Mortiorchis; right moves it to **Seymour Flux** (frame 2), confirm |
| `Q` | Yuna's menu: Defend; Seymour's turn follows |

Why the cycle had to be 5: Seymour's script (`src/battle/ffx/ai/seymour-flux.ts`) runs a cycle on `seymour.cycle`; at 1 and 3 he casts Lance of Atrophy
(a plain enemy command, not Silence-gated: its record's flag word has no 0x20000), at 5 he casts **Dispel** (a White Magic command, Silence-gated). Silence
Buster's Silence lasts **1 turn** (`turnsRemaining: 1`), so it must be on him when his next own turn is the Dispel. An earlier run (below) put the Silence
on at cycle 3 and it was spent on a Lance of Atrophy, which still resolved: correct, because Lance is not gated.

## What happened (seed 4; `battle-log.json`, seq numbers)

| seq | Event |
|---|---|
| 40-41 | Seymour's earlier turn at another cycle value: `message "Seymour waits"` (a script wait, for contrast: it prints a message) |
| 46-48 | Tidus's turn, `switch`: Wakka in |
| 50-54 | Wakka uses **Silence Buster** on Seymour Flux: 588 damage (70000 to 69412 HP), `status-add silence` on `seymour-flux` with `turnsRemaining: 1` (seq 53), Wakka pays 10 MP |
| 55-59 | Yuna Defends |
| **60** | **`turn-start seymour-flux`** (turn 13). Seymour's cycle flag moves 5 to 6, which only the Dispel branch of his script does |
| 61-62 | `status-tick silence`, `status-remove silence (expired)` on Seymour, straight after the turn-start |
| 63 | `turn-start wakka` (turn 14) |

Between 60 and 63 there is **no `action-start`, no `damage`, no `miss`, no `message`**: no spell resolved, nothing was announced, no banner, no animation (frame
4a shows the Silence chip beside Seymour's slot in the turn list and no action banner). That is the refusal at the start of the command (`costGate` then `fizzle`
in `src/battle/ffx/command-start.ts`: no cost paid, silent, the turn spent).

**Seymour's MP: 512 before the Silence (cycle 5), 512 at his refused turn, 512 after.** Caveat: this does not discriminate. The gate treats every monster as paying
no MP (`monster: actor.side === 'enemy'` in `costGate`), so Seymour's MP is 512 in every state, including after a Dispel that DID resolve (see the control). The
evidence of the refusal is the missing `action-start` and the AI cycle moving 5 to 6.

## Control (no Silence): `control-no-silence/`

Same seed, everyone Defends, nobody Silences. At the same cycle value Seymour's turn is `turn-start` (seq 56), **`action-start Dispel`** (seq 57), `action-end` (seq 58), with
the "Dispel" banner and the cast animation (`4c-seymour-turn-dispel.png`); MP 512 before and after, and Dispel changes nothing on this party (no HP or status events), so
the discriminator between "cast" and "refused" is the `action-start` and the banner, not damage. Notes in that folder's `run-summary.json` say "while Silenced" for
every Seymour turn: that wording is the script's fixed label and is wrong for the control (nobody was Silenced). Its `4a` is Lance of Atrophy, `4b` is the "Seymour waits" turn.

## Verdict

**The rule holds on the live build (r47, b8aa6f96): a Silenced Seymour Flux whose next command is a Silence-gated spell (Dispel) has it refused at the start.** Silence
Buster landed on the first try on seed 4 (his Silence resist is 50, so a miss is possible; none occurred in the four runs below), the next Seymour turn went
Dispel (cycle 5 to 6), and nothing resolved: no action, no banner, no damage, no MP change, Silence consumed by the turn. A command that is not gated (Lance of Atrophy,
at cycle 3) still resolves under Silence, as the rule says.

## Frames (1600x900, lossless PNG; about 2.2 to 2.4 MB each, a little over the 2 MB target: lossless captures of the painted scene, re-compression gains 2.5 percent)

| File | Moment |
|---|---|
| `1-silence-command-chosen.png` | Wakka's Special list, **Silence Buster** highlighted ("Physical damage - inflicts Silence"), Seymour's cycle 5 |
| `2-silence-target-seymour.png` | target step, bracket on Seymour Flux |
| `3-silence-landed-on-seymour.png` | "Seymour Flux was silenced." banner, Silence chip beside Seymour in the turn list |
| `4a-seymour-turn-refused.png` | Seymour's turn (seq 60): his slot is on top of the list with the Silence chip, no action banner, no animation |
| `5-after.png` | the next command menu (Wakka's), Seymour MP 512, cycle 6 |

## Files

- `capture.mjs` the script (final version, with the `--control` switch). `capture-v2-as-run.mjs` is the version that produced the main frames (identical apart from `--control` and a null-state guard added afterwards).
- `battle-log.json` the full `battleLog()` of the seed 4 fight (64 events). `run-summary.json` the run's steps, keys, frames and Seymour's turns. `run2.log` the console of the four attempts.
- `control-no-silence/` the control run (frames, log, summary, console).
- `earlier-run-seed1-silence-at-cycle3/` the first run (seed 1, Silence at cycle 3): Silence landed, Seymour's next turn was Lance of Atrophy (resolved, not gated), Silence expired after it.

## Other attempts and things to know

- Run order: seeds 1, 2, 3, 4 in one script run (`run2.log`). On seeds 1, 2 and 3 the same thing showed on the console (Silence Buster landed at cycle 5; Seymour's next turn had no `action-start`,
  cycle 5 to 6), but their logs and frames were discarded: my script then crashed reading `battleState()` (null) after the fight ended (I did not check how it ended; the party only Defends),
  so only seed 4 has a saved log. Count those three as console observations, not as saved evidence.
- On seeds 1 and 3 the harness also logged a second Seymour turn as "no action-start" right after the refusal (cycle 6, likely the script's "Seymour waits" turn, which does carry a `message`
  event; their logs were not saved, so unchecked).
- The refusal is entirely silent to the player: no message, no "Silenced" notice, no banner; the only cue is the Silence chip in the turn list. That is what the engine does by design
  (`fizzle` is silent for a script's command) but a reviewer may want to judge how that reads in play.
- Silence Buster's Silence is 1 turn, so timing matters: use it when Seymour's next turn is the Dispel (cycle 5), or in the second cycle, Flare (cycle 1) and Reflect (cycle 3), also gated.
