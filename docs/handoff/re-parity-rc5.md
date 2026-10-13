# Re-parity RC5 (lean): the Bahamut note, one Chapter II guide line, and the KO rules from the exe (lane FFX-D)

Status: **built, tested and pushed on branch `re-parity-rc5`; not merged, not deployed** (2026-10-12). Cut from `origin/r42-rc` (`a061e9dc` = the build live since 2026-10-12 06:19Z: everything through RC4 plus the release driver's r41).
Three parts, each its own commit. Owner: Bailey. His words, as the brief quoted them: 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 23:08 EDT "ok keep going ill go with all your recommendations please", which accepted
"Close D-214 / PR-0217: a KO clears Zombie and Scan, per the exe; report Chapter II's 500-seed change", "Add one guide line: don't Haste a Reflecting character" and "Rewrite the false Bahamut hint: Slow does not slow the Mega Flare
countdown (a fixed 750 logic steps)". Deploys need the release path (the planner classes this DEEP: focused review before the deploy, deep review after).

| Part | Game case (AGENTS.md rule 14) | Why |
|---|---|---|
| 1. Bahamut enemy-intent note | **FFX-2 only** | the Mega Flare countdown is FFX-2's Bahamut script (`re-ffx2-ai-bahamut-vegnagun` B3, `re-parity-rc3.md`) |
| 2. Chapter II guide line | **FFX only** | Hastega and the Reflect bounce are FFX's (`re-ffx-targeting`, `re-parity-rc4-react.md` G2) |
| 3. KO rules (lane FFX-D) | **FFX only** | `FFX-G02` says so: FFX-2 has its own status model and none of these addresses exist there; `git diff origin/r42-rc -- src/battle/ffx2 src/data/ffx2 src/battle/ff7 src/data/ff7` is empty apart from `src/battle/ffx2/intent.ts` (part 1, a text line) |

## 0. In one paragraph

A KO now clears Zombie and Scan, as the game's status reset does (Bailey's open decision PR-0217 / D-214, closed by his yes): the reset clears everything but Death, the engine's old list kept both. With it come the three
neighbouring rules of lane FFX-D that the same note proved: the death check runs **after the target's last hit** of an action (a hit only clamps HP at 0 until then, so a multi-hit attack no longer lets a dead character be
raised by Auto-Life in the middle of it), **Auto-Life is removed at the moment of death** and the revive is a quarter of the maximum the reset gives back (a Double HP pool is undone first, Critical is judged after), and
**overkill is the damage of the whole action**, not of one hit. `ffx-engine-golden` is re-baselined once (12 of 18 digests move; one outcome, Chapter II seed 7, goes from victory to defeat). Over 500 seeds **Chapter II (Yunalesca) falls from
476 to 398 wins** (95.2 to 79.6 percent; z -7.4) and the cause is the Zombie rule alone; Chapter III stays at 479 of 500, and the other nine chapters keep their wins and numbers except Chapter I's party turns (48 to 53.3). Nothing
on a boss or a party was tuned. The other two parts are text: Bahamut's note stops promising that Slow slows the Mega Flare countdown (it is a fixed wait of about 25 seconds), and Chapter II's guide gains one line,
"don't Haste a Reflecting character".

## 1. Commits (oldest first, on `re-parity-rc5`)

| Commit | What | Game |
|---|---|---|
| `f06c9294` | Part 1: the Bahamut note in `src/battle/ffx2/intent.ts` and the test that pinned the old wording (`enemy-intent.test.ts`) | FFX-2 only |
| `f7565e00` | Part 2: the guide line on `src/data/guides/docs/yunalesca.ts` (the page the player sees) and on the Hastega hint in `src/data/guides/yunalesca.ts` | FFX only |
| `2045264c` | Part 3, the rules: `kernel/death-check.ts` and its fixture, `statuses.ts`, `hp.ts`, `hit-apply.ts`, `abilities.ts`, `adapt/status.ts`, the oracle test and its rig, the three helper updates, the dated research notes, the stale comments | FFX only |
| `ca96fa36` | Part 3, the one re-baseline: `ffx-engine-golden` (12 digests, explained in its header) and the three tests that read the old Zombie-survives-KO board (`advisor-note`, `advisor-v4-card`, `strategy-chapter2`) | FFX only |
| (this note) | `docs/handoff/re-parity-rc5.md` | docs only |

The golden table is stale in `2045264c` on purpose (the re-baseline is its own commit, as in RC4).

## 2. What changed

### Part 1: Bahamut's enemy-intent note (FFX-2 only)

`src/battle/ffx2/intent.ts` said "The Mega Flare countdown is an action counter, not a clock - Slowing him slows it too". Under the game's script the countdown is a fixed 750 AI polls = 750 logic steps (about 25 seconds), the same at
Normal, Slow and Fast, with Bahamut Hasted and with a girl down (`re-parity-rc3.md`, row B3). The note now says "a fixed wait of about 25 seconds on the game's own clock - Slow, Haste and a fallen girl do not change it"
and cites `re-ffx2-ai-bahamut-vegnagun B3`; the comment above it says why it still prints no step count (the slab's charge row already prints one). `tests/unit/enemy-intent.test.ts` now pins the new wording and that neither old
phrase comes back. Not touched: `research/ffx2-bahamut.md` (the pre-decompile research, which still says the old thing), the captured JSONs under `docs/concepts/` (old screenshots' text) and `docs/handoff/adv-enemy-intent.md` (history).

### Part 2: one Chapter II guide line (FFX only)

The player sees the guide page (`src/data/guides/docs/yunalesca.ts`; since r38 the RULES, phase and WATCH fields of `src/data/guides/yunalesca.ts` are read only by tests and the advisor reads only the hints). New paragraph beside the
Reflect notes: "One catch: don't Haste a Reflecting character. Hastega, Slowga and the Nul spells bounce off Reflect, so a Hastega cast through it lands on Yunalesca. Haste the party first, then raise Reflect." The Hastega hint
gains "Cast it before Reflect goes up, never through it: do not Haste a Reflecting character" (cite `ffx-yunalesca §10.2, §6; re-ffx-targeting`). The rule list was already at its cap of five (`strategy-guide.test.ts` allows three to five), so
the line is a hint and a page paragraph, not a rule. The shipped line already does this (RC4 lane FFX-G put Tidus's Hastega before Yuna's Reflect). Guide tests: 136 of 136 pass.

### Part 3: the KO rules (lane FFX-D of the wiring plan; rows D1 to D4)

| Plan row | The game (proof) | The engine before | The engine now |
|---|---|---|---|
| D1 (E1, E2) | the KO reset (VA 0x0079a190) clears the permanent word but Death (so Zombie), the thirteen counters, the whole extra word (so Scan and Eject), the stacks and the buff byte [emulated, 4,000 vectors]; the Hellbiter weighting reads the Zombie bit with no liveness test, so a corpse reads 0 [emulated, 3,000] | `SURVIVES_KO = ko, scan, zombie, eject`; `recordOf` hid a dead member's Zombie from the infliction kernel by hand | `SURVIVES_KO = ko, eject` (the two engine markers: `ko` is the Death bit the check sets again, `eject` stands for the separate ejected flag); the bridge in `adapt/status.ts#recordOf` is gone; stale comments and the three research claims dated |
| D4 (E17) | the death check runs once, after the target's last hit; a hit only clamps HP at 0 and copies the statuses back [emulated scenarios I1 to I4 on the real hit applier] | the KO fired at the first hit that reached 0 (only script-held bosses waited) | every hit of an action passes `holdKo: true` (`hit-apply.ts`); `abilities.ts#finishTouched` settles it after the target's hits and its script's `onHit` (the mechanism already existed for the bosses) |
| D2 (E7, timing half) | the check saves the extra word, the reset wipes it (Auto-Life included), then the revive (a quarter of the maximum, command 0x311f) is queued [emulated, 9,000 check vectors] | Auto-Life consumed, quarter taken from the doubled pool, Critical judged before the reset deleted it | Auto-Life stays on the body until the check; the reset runs first, then the quarter of the base maximum and Critical (`hp.ts#koActor`) |
| D3 (E12) | the overkill counter starts at the monster's threshold for each target when the action is calculated and every HP hit subtracts its value (a heal counts negative); the check flags it below 1 [emulated check; hit applier read] | per hit: `applied >= threshold` | the action's running total per target (`Touched.lastDamage`, already the scripts' `LastDamageTakenHP`) decides, at the check (`hp.ts#overkillAtDeath`, `settleDeferredDeath`); the damage event carries the flag on the first hit after which the target is at 0 with the total at the threshold |

Not done (the plan's wording, kept): the Auto-Life revive as a queued action of the dead character, and Magic Booster's x3/2 on it (open item 1). The note's other rows for this area (E3 SOS statuses, E6 equipment statuses at revive, E9 to E11
the item reactions) landed in RC4.

## 3. How it is built

- `src/battle/ffx/kernel/death-check.ts` (148 lines, pure, no draws): `koReset` (the words, and the pools by the existing `applyDoubleHpMp` kernel at flags 0), `deathCheck` (the kind: Eject bit, else HP below 1; the once-per-life gate; the Overkill flag for a monster
  slot with rewards on; the saved extra word's Auto-Life bit; Auto-Phoenix tried only when there is none), `overkillStart/Step/Reached` (32-bit). The loot roll, the bestiary and kill statistics, the KO pose and the queue cancels are other lanes' or the presenter's and are not here.
- Engine: `hp.ts` (387 lines), `hit-apply.ts`, `abilities.ts`, `statuses.ts`, `adapt/status.ts` as in the table. `DamageEventInfo` gains two optional fields (`scriptHeld`, `actionDamage`); callers outside an action (Poison and Regen ticks, script HP writes) keep the immediate KO, as the game's single-hit check does.
- Private tooling: `D:\Tools\ffx-parity\rc5\gen_ko.py` makes the vectors by running the real functions in the emulator (the FFX-G02 setup and hooks).

## 4. Proofs and mutants

| File | What it proves |
|---|---|
| `tests/unit/parity-ffx-death-check.test.ts` (19 tests) | the kernel: hand-worked cases with their arithmetic, then a replay of `tests/fixtures/parity/ffx/ko_reset.json`: **500 KO resets and 700 death checks** of the game's own code (the check's kind, the Overkill flag, the Auto-Life queue, the wiped words, the cancel). The replay has to reach each branch (checks that ran, overkills, Auto-Life queues, Eject kinds). With `PYREFLY_KO_BIG=D:\Tools\ffx-parity\rc5\ko_vectors_big.json` the same replay runs over **3,000 and 4,000 more**: 7,000 more vectors, 0 mismatches. |
| `tests/unit/parity-ffx-engine-death.test.ts` (8 tests) | the engine against an **independent oracle** (`helpers/ffxEngineDeath.ts`, which imports nothing from the kernels, the adapters or `hp.ts`): **1,200 generated multi-hit actions** (6,000 with `PYREFLY_DEATH_SCENARIOS=6000`, 0 problems) against party members and monsters with Zombie, Scan, Poison, Regen, Haste, a cast or a fayth Auto-Life, Double HP and a zombifying blow, each target's HP aimed at the first, a middle or the last hit, at exactly zero or a margin short, a monster's threshold at 0.5 to 6 times its first hit. For every target: where the KO falls (after the last damage event, never between), the final HP, the statuses (a corpse carries only `ko`/`eject`), the revive (cause, the quarter from the base, Critical, a cast Auto-Life "consumed"), the Overkill mark and which damage event carries the flag. The sample must reach each branch (150+ survivors, 100+ deaths, 50+ revives, 50+ deaths before the last hit, 50+ corpses that had Zombie or Scan, Double HP revivals, 30+ overkills of which 5+ by the sum only). Also: for every status the engine can hold (48 words and counters), the kernel's reset and `SURVIVES_KO` agree; hand-worked cases for the first-of-four-hits kill, Double HP plus Auto-Life (500, not 1,000), the fayth against a cast Auto-Life, overkill by the sum, and a single-hit kill. |
| the rest | `parity-ffx-engine-status` (its rig no longer keeps Zombie and Scan on the dead), `parity-ffx-engine-reactions` (its two mirrors of the KO reset), `ffx-chapter2` (a raised member comes back clean), the three goldens, the guide and intent files |

**Mutation check: 17 of 17 caught** (a script puts one wrong line into the source, runs the two files, restores it byte for byte; `D:\Tools\ffx-parity\rc5\mutants.cjs`, result `mutants-final.json`): Zombie, Scan or Eject surviving a KO (3); the KO at the first lethal hit (1); no
overkill mark at the check (1); overkill from one hit's value (1); the Overkill flag on every hit after the first (1); the quarter taken before the reset (1); Auto-Life not spent (1, which only the event's reason shows, so the oracle checks it); the kernel keeping Zombie or Scan (2),
the overkill boundary (below 1), Eject before HP, the Auto-Life bit read after the reset, the monster slot range, a self-destruct still flagging Overkill, the pools not undone (6 more, 8 in the kernel in all).

## 5. The goldens, explained (once, in `ca96fa36`)

`ffx-engine-golden`: **12 of 18 digests move, 6 do not** (seymour-flux#7, evrae-airship#1 and #7, seymour-natus#7, seymour-omnis#1 and #7). **One outcome moves: yunalesca#7 victory to defeat.** `ffx2-atb-golden` and `ff7-golden` pass unchanged.
Each rule was put back **alone** on the new tree and all 18 run (`D:\Tools\ffx-parity\rc5\abl-golden.json`); with all four put back the file is 18/18 on the old values.

| Digest | Moved by | Evidence |
|---|---|---|
| seymour-flux#1 | rule 1 (Zombie and Scan cleared) alone | with it put back, `33074c0e` returns |
| yunalesca#1 and #7 | rules 1 and 2 together | neither alone returns them; the seed-7 flip is rule 1: with it put back the digest is a victory (`828c9ccf`), with only rule 2 put back it is still the defeat |
| seymour-anima-macalania#1 and #7, yojimbo-cavern#1 and #7, seymour-natus#1, isaaru-via-purifico#1 and #7 | rule 2 (the death check after the last hit) alone | with it put back all seven return; outcomes and numbers are unchanged, the logs differ in where a party member's `ko` event falls in a multi-hit action |
| braskas-final-aeon#1 (links 1, 2, 4 to 7) and #7 (links 1, 4 to 6) | link 1 rule 1; links 2 and 4 to 7 the Auto-Life order (rule 3), link 7 of #1 also rule 2; later links inherit the chain's end state | link 3 of #1 and links 2, 3, 7 of #7 are what they were |
| rule 4 (overkill per action) | none | put back, every digest is the same |

## 6. Measurement (shipped line, every FFX chapter; before = `origin/r42-rc`, after = this branch)

`tests/unit/ffx-parity-measure.test.ts`, `PYREFLY_MEASURE=1`; raw files in `D:\Tools\ffx-parity\rc5\` (`before-500.json`, `after-500.json`, `before-12.json`, `after-12.json`, `cmp-500.md`, `cmp-12.md`; compare script `..\rc4-assembly\cmp.cjs`).
A mover is a win count outside two standard errors of the difference at 500 seeds (or 2 of 12). Chapter numbers: II Yunalesca, III Braska's Final Aeon, I Seymour Flux, VII Macalania, VIII Evrae, IX Yojimbo, X Natus, XII Omnis, XIV Isaaru, XVII Sin: Fins and Core, XVIII Sin: Face.

### 500 seeds (Chapters II and III)

| Chapter | Wins | Party turns | Engine turns | Party KOs | z | W to L / L to W | Seeds identical |
|---|---|---|---|---|---|---|---|
| II yunalesca | **476 to 398** | 145.0 to 159.1 | 209.4 to 226.5 | 13.7 to 14.6 | **-7.43** | 95 / 17 | 7 of 500 |
| III braskas-final-aeon | 479 to 479 | 231.7 to 232.1 | 373.0 to 373.0 | 5.4 to 5.4 | 0.00 | 0 / 0 | 297 of 500 |

### 12 seeds (every other chapter; Chapters II and III's first 12 seeds from the same runs)

| Chapter | Wins | Party turns | Engine turns | Party KOs | Seeds identical |
|---|---|---|---|---|---|
| I seymour-flux | 12 to 12 | 48.0 to 53.3 | 67.8 to 73.2 | 1.3 to 1.1 | 4 of 12 |
| VII seymour-anima-macalania | 12 to 12 | 54.2 to 54.2 | 87.9 to 87.9 | 4.8 to 4.8 | 12 of 12 |
| VIII evrae-airship | 12 to 12 | 70.9 to 70.9 | 88.6 to 88.6 | 0.7 to 0.7 | 12 of 12 |
| IX yojimbo-cavern | 11 to 11 | 65.3 to 65.3 | 92.5 to 92.5 | 3.6 to 3.6 | 12 of 12 |
| X seymour-natus | 11 to 11 | 35.0 to 35.0 | 51.5 to 51.5 | 2.4 to 2.4 | 12 of 12 |
| XII seymour-omnis | 11 to 11 | 91.5 to 91.5 | 124.3 to 124.3 | 0.8 to 0.8 | 12 of 12 |
| XIV isaaru-via-purifico | 11 to 11 | 37.6 to 37.6 | 83.3 to 83.3 | 3.0 to 3.0 | 12 of 12 |
| XVII sin-fins-core | 11 to 11 | 310.0 to 310.0 | 395.7 to 395.7 | 1.7 to 1.7 | 12 of 12 |
| XVIII sin-face | 12 to 12 | 45.5 to 45.5 | 50.5 to 50.5 | 0.0 to 0.0 | 12 of 12 |
| II yunalesca (first 12 of the 500) | 12 to 9 | 149.3 to 149.8 | 214.0 to 212.7 | 13.7 to 13.9 | (sampling: 12 seeds) |
| III braskas-final-aeon (first 12) | 11 to 11 | 239.6 to 240.1 | 386.2 to 386.2 | 5.5 to 5.5 | |

The logs of VII, IX, X, XIV move (the digests above) and none of their numbers do: the rule that moves them (the KO after the last hit) changes where an event falls, not what happens.

### Causes, by ablation (the new tree with one rule put back; `abl-m-*.json`)

| Measurement | After | Zombie/Scan survive (rule 1 back) | KO at the first lethal hit (rule 2 back) | Overkill per hit (rule 4 back) | Auto-Life old order (rule 3 back) |
|---|---|---|---|---|---|
| II wins / party turns / KOs (500) | 398 / 159.1 / 14.6 | **476 / 145.0 / 13.7 (= before, to the digit)** | 398 / 159.1 / 14.6 | 398 / 159.1 / 14.6 | 398 / 159.1 / 14.6 |
| III wins / party turns (500) | 479 / 232.1 | 479 / 232.1 | **479 / 231.7 (= before)** | 479 / 232.1 | 479 / 232.1 |
| I party turns / KOs (12) | 53.3 / 1.1 | **48.0 / 1.3 (= before)** | 53.3 / 1.1 | 53.3 / 1.1 | 53.3 / 1.1 |

Inside rule 1 it is **the Zombie half alone**: with only Zombie kept on the dead Chapter II is 476 / 145.0 / 13.7 again; with only Scan kept it stays 398.

**Why Chapter II falls (the mechanism, measured on 150 seeds of the new engine).** A zombified party member dies about **7 times a fight** (7.0 in won fights, 8.0 in lost ones; the fight has about 14 party KOs, so half of them are Zombies dying). Until now each of those bodies kept its Zombie: it still
counted toward Hellbiter's weight (the 90, 60, 30, 0 percent ramp) and came back zombified when raised, which is what the line's "keep one Zombie" for Form III's Mega Death relies on. In the game a KO takes the Zombie away at that moment, so Hellbiter fires more often, every raised member is a plain
target for Mega Death, and the line spends about 14 more party turns a fight (145.0 to 159.1) repairing it. The line itself was not touched (it still plays Hastega, then Reflect, one Zombie kept; `src/engine/tactics/yunalesca.ts`).

## 7. Open items and disclosures (none touches a boss or party number)

1. **The Auto-Life revive is not a queued action** (plan E7's second half). The game queues command 0x311f for the dead character at priority 0x40, so other queue entries, a counter or a later action can see the corpse first and the revive can be lost if it fails; Magic Booster's x3/2 applies to it. The engine revives in the check, right after the target's last hit. This needs the
   general reaction queue (`FFX-G05`, waiting for Bailey).
2. **A Death that lands through a status** (a Death spell, a Phoenix Down on a living Zombie) still kills at the hit through `status-apply.ts` rather than at the target's last hit; those actions have one hit in practice.
3. **Event order for a status that lands on a dying target.** The game copies the statuses back and then the check wipes them; the engine used to drop such a status silently (`quiet`) and now emits `status-add` followed by `status-remove` (reason `ko`) because the target is still standing until its last hit. The final state is the same. A presenter that animates every `status-add` will flash the icon of a character who dies in the same action: for the focused review to look at.
4. **Dead branches of the advisor.** `advisor-revive.ts#reviveRisk` kind `zombie`, `zombieCureReason`'s `alive === false` branch and `advisor-floor.ts`'s Zombie-corpse refusal can no longer fire on an engine board (a body on the floor is never a Zombie). They are pure readings of whatever board they are handed and the unit boards that build one by hand still pass; the comments say so. A later cleanup could remove them.
5. **Tests re-pinned because their premise was the old rule** (`ca96fa36`, `2045264c`): `advisor-note` (the gate's board needed a Zombie corpse; now seed 98 supplies the surviving conditions, found over 300 seeds; no seed shows a refusal for a Zombie body; the hand-built timing board skips a seed that already has someone down), `advisor-v4-card` (seeds 1 and 3 open with the Mortiorchis's Full-Life killing a zombified member, so the first pick is Mega Phoenix on the party, not Hastega and Mighty Guard; ablation: rule 1 alone), `strategy-chapter2` (the four seeds that win are 1, 2, 4 and 42; the 40-seed bar 36 becomes 27, two standard errors under the 500-seed rate), `ffx-chapter2` (a raised member comes back clean), and the mirrors in `ffxEngineStatus.ts`, `ffxEngineReactions.ts` and `ffxEngineReactionsRun.ts`.
6. **Whole suite, once** (run before the final re-pins of `advisor-v4-card` and `strategy-chapter2`, which were then re-run alone): 16,947 tests, 16,644 passed, 187 failed, 115 skipped. The failures are 22 files that need `public/art` (missing in a worktree; `ENOENT` or "exists under public/art": the same 22-file count as the RC4 assembly's note, none touches this lane) and the two real ones, `advisor-v4-card` and `strategy-chapter2`, which are re-pinned and pass.
7. **Not examined**: whether the game's Chapter II reaches Hellbiter more often than ours now (the weighting and the ramp are the lane's AI notes; the engine now feeds it the game's inputs); the Yunalesca tactic's behaviour under the new rule was only measured, not studied.

## 8. Decisions for Bailey

1. **Chapter II is now 79.6 percent (398 of 500), was 95.2 percent (476).** It is the game's rule and the line is untouched (his yes to "report Chapter II's 500-seed change"). Options if he wants it back nearer 95: (a) leave it, the fight is harder because Zombies die; (b) ask a lane to study the lost fights and rework the line (the line only knows "keep one Zombie", and a Zombie is now lost every time one dies); (c) show the player a hint about it (a new screen: mockup first, rule 9). The recommendation is (a) for the release and (b) as a later batch.
2. **The disclosed majors for the release note** (the deep review will want them): Chapter II's 16-point fall; Chapter I's 5 more party turns; the event order of item 3 above.
3. D-214 / PR-0217 can be recorded as closed by this branch (ledger rows are the main session's).

## 9. Re-run commands (repo root `D:\Final Fantasy\.claude\worktrees\re-parity-ai-ffx-b`; Node 24; TEMP and TMP on D:)

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
TEMP=D:/Tools/ffx-parity/tmp TMP=D:/Tools/ffx-parity/tmp node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --maxWorkers=4 tests/unit/parity-ffx-death-check.test.ts tests/unit/parity-ffx-engine-death.test.ts tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts tests/unit/enemy-intent.test.ts tests/unit/strategy-chapter2.test.ts tests/unit/advisor-v4-card.test.ts tests/unit/advisor-note.test.ts tests/unit/ffx-chapter2.test.ts tests/unit/parity-ffx-engine-status.test.ts tests/unit/parity-ffx-engine-reactions.test.ts
PYREFLY_KO_BIG=D:/Tools/ffx-parity/rc5/ko_vectors_big.json PYREFLY_DEATH_SCENARIOS=6000 ... (same vitest, the two death files)
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_CHAPTERS=yunalesca,braskas-final-aeon PYREFLY_MEASURE_OUT=<file> ... --maxWorkers=1 --testTimeout=3000000 tests/unit/ffx-parity-measure.test.ts
node D:/Tools/ffx-parity/rc5/mutants.cjs <out.json>      (from the repo root; restores every file)
node D:/Tools/ffx-parity/rc5/ablate.cjs <out.json> S1,S2,S3,S4 [yunalesca:1-500]   (rules put back alone; golden by default)
D:\Tools\ffx-parity\venv\Scripts\python.exe -I D:\Tools\ffx-parity\rc5\gen_ko.py 20261012 500 700 <out.json>    (the vectors)
```

## 10. Final checks

`tsc --noEmit` clean. Targeted: the files above all pass (death-check 19, engine-death 8 at 1,200 and at 6,000 actions, the three goldens 27, enemy-intent 32, strategy-chapter2 13, advisor-v4-card 3, advisor-note and advisor-ownership 54, the nine guide files 136). Whole suite: item 6 above.
`git diff origin/r42-rc --stat -- src/battle/ffx2 src/battle/ff7 src/data/ffx2 src/data/ff7` shows only `src/battle/ffx2/intent.ts`. No dev or preview server was started, and every background run this lane started has ended.

## 11. CHANGELOG paragraphs (plain words; for the main session to paste, not edited into `CHANGELOG.md` here)

**FFX.** Knocked-out characters now lose Zombie and Scan, the way the game's own status reset does: a zombified party member who dies is no longer a Zombie on the floor, no longer holds Yunalesca's Hellbiter back, and comes back as an ordinary character when you raise him. A multi-hit
attack now finishes all its hits before the knock-out is decided, so Auto-Life no longer revives a character in the middle of an attack that is about to hit him again; Auto-Life goes at the moment of death, and its revive is a quarter of the character's real maximum (a Double HP pool is undone first). Overkill now counts the damage of the whole action on a monster, not
one hit. Chapter II (Yunalesca) is harder because of the Zombie rule: the shipped line wins about 80 of 100 fights, it was 95; Chapter I's opening is a few turns longer, and the other chapters play the same. The Chapter II guide gains one line: don't Haste a Reflecting character, because Hastega bounces off Reflect.

**FFX-2.** Bahamut's enemy note no longer says that Slow slows the Mega Flare countdown: the wait is a fixed 25 seconds that Slow, Haste and a fallen girl do not change. Nothing else in FFX-2 changed.
