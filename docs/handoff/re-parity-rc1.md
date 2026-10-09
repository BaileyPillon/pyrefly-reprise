# Re-parity release candidate 1: the FFX game-code and game-script parity, merged onto release 39.4.2

Status: **built and committed on branch `re-parity-rc1`, not pushed, not deployed, no critic review run** (2026-10-09). Track `re-parity`
([plan](../plans/re-parity.md)). Owner: Bailey. **Game case: FFX only** (AGENTS.md rule 14): nothing the FFX-2 or FF7 engines can reach changed
(section 3.4). Base: `origin/main` 00fc1bbf (release 39.4.2, code a021787a). Built by a Sonnet sub-agent for the main session.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." and "Full speed ahead you don't need to conserve". 2026-10-09: "Your findings need to be
implemented into live builds as the decompilation work progresses." His answers of 2026-10-09 that this candidate respects: keep Chapter I 1:1
(Cross Cleave never misses); "Keep fixed chain for now" (Braska's chain); adopt each game's own RNG streams in a later batch (not in this candidate).

## 1. What is in the candidate

Three lanes merged with real merge commits (no rebase, no squash), in this order, onto 00fc1bbf:

| Merge | Commit | Lane (branch at commit) | What it brings | FFX chapters it moves |
|---|---|---|---|---|
| (a) | `db288b05` | W1 + the kernels and notes (`re-parity` at `37cd5348`) | The FFX hit roll, critical roll and damage chain come from the kernels proven against FFX.exe, in the game's draw order, on the game's command records (451 abilities) and the monster-side plain Attack; the kernels and research notes of **both** games (FFX and FFX-2 CTB, status, Overdrive, Steal, rewards, aeons, ATB, dresspheres, damage), **not wired**; the plan and the paper preflights; the measurement harness | all eleven |
| (b) | `48f58952` | AI lane B (`re-parity-ai-ffx-b` at `494c4cce`) | Yunalesca, Braska's Final Aeon, the Yu Pagodas, the five possessed aeons and Yu Yevon follow the game's own compiled scripts; the engine's `onHit` once per target per sub-action | II, III |
| (c) | `ddd7948c` | AI-Seymour (`re-parity-ai-ffx` at `c869b1c5`) | Seymour Flux and the Mortiorchis, Seymour with the Guado Guardians and Anima, Natus and Mortibody, Omnis and the discs follow the game's scripts; the boss-script hooks (`onTargeted`, `onHit`, `postPoison`, `preTurn`), the reaction queue, the script rolls | I, VII, X, XII |
| | `4479bbdd` | (this task) | `ffx-engine-golden` header note after merges (a) and (b): the two-lane tree reproduced all 18 digests, nothing re-pinned (comment only) | |

Then this note and the CHANGELOG entry. At `ddd7948c`, 62 commits reach the candidate from `origin/main` (59 non-merge, 3 merges) and the tree differs from
`origin/main` in 319 files (+69,601 / -3,420): `src/battle/ffx` (87 files, of which `kernel/` 29 new, `adapt/` 6 new, `ai/` 32), `src/battle/ffx2/kernel` (36 new, unwired),
`src/data/ffx` (13), a few lines in `src/engine/tactics`, `src/ui/ffx`, `src/scenes`, `src/story` (Chapter VII/XII previews and one story trigger, FFX only), 108 test files
(63 new), 42 fixture files (7.4 MB of emulator vectors, numbers only), 17 research notes, 3 plan files, 3 handoff notes, `docs/CONTRACT-CHANGES.md`.

**Not in the candidate** (still the old rules): `re-parity-w2` (the FFX turn order, status infliction and per-turn ticks; in flight, 09bf0adb at the time of writing), AI lane C (Chapters
VIII, IX, XIV, XVII and XVIII; its research note exists, no code), every FFX-2 wiring (waves W3 and W4 and the FFX-2 boss scripts), the FFX Overdrive gauge, Steal, rewards and aeon
kernels, and the games' own random number generators.

## 2. The merge

### 2.1 What origin/main changed since the parity base (157562f8)

82 commits, 61 files under `src/battle`, `src/data`, `tests`, `docs/CONTRACT-CHANGES.md` (+10,988 / -401). **Nothing in FFX battle code or FFX data**: `src/battle/common/types.ts` (+9,
FFX-2's `EnemyGroupDef.hopelessRetry`), `src/data/art/*` (the namespace, pose registrations), `src/data/chapter-exp-leblanc.ts`, `chapter-meta*.ts`, `encounters.ts` (+22: the hidden
Leblanc preview's registry), `src/data/ffx2/enemies/trema.ts` and `syndicate-stature.ts`, 45 test files for art, audio, Leblanc, the head lock and the intent slab, and 55 lines of
CONTRACT-CHANGES. That is why the two FFX goldens had no reason to move for release 39.2 to 39.4.2.

### 2.2 Conflicts, and how each was resolved (none dropped a change from either side)

| Merge | File | Resolution |
|---|---|---|
| (a) | `docs/CONTRACT-CHANGES.md` | Both sides add entries at the top: all kept, newest first (W1's three entries, written 2026-10-08 21:20 to 22:22, above origin/main's 17:15 intent-roof entry). Proved by line sets: no line of either side is missing from the result |
| (a) | `src/battle/common/types.ts` | Auto-merged (different places): W1's `FFXCommandRecord`, `FFXPlainAttack`, `plainAttack`, `record` and origin/main's `hopelessRetry` are all there |
| (b) | none | `docs/CONTRACT-CHANGES.md` auto-merged, lane B's entry on top |
| (c) | `docs/CONTRACT-CHANGES.md` | Both lanes' entries kept (AI-Seymour's 18:01 above lane B's 16:14), plus **one new entry on top** for the merged runner |
| (c) | `src/battle/ffx/ai/reactions.ts` | The lanes removed different blocks from the per-enemy loop of `collectBossCounters` (Flux, the Guardians, Natus there; Yunalesca, Yu Yevon here), so the loop is gone; Evrae's and Sin's collectors stay |
| (c) | `src/battle/ffx/hit-apply.ts` | AI-Seymour's file as it is: lane B's changes there were only its own hook plumbing |
| (c) | `src/battle/ffx/hp.ts` | One name, `holdKo` (lane B's `deferKo`); lane B's rule that a held KO the script is sure to refill (a form change, a part with a `reviveRule`) is no overkill is kept; lane B's `scheduleRevivalAt`, the Pagoda return delay, the fayth revival's CTB 0 and the part-restore change are kept |
| (c) | `src/battle/ffx/engine-end.ts` | AI-Seymour's drains; lane B's separate drain is gone; `inReaction` is set around the whole reaction phase (see 2.3) |
| (c) | `tests/unit/ffx-engine-golden.test.ts` | Both lanes' header paragraphs; each lane's own digests as the starting table, then the merged tree run against it (2.4) |

Verified file by file against `git`: after merges (a) and (b) the candidate differed from `origin/main` in exactly the 253 files the two parity branches changed (set equality), and after merge (c)
every file equals the lane's own version except the ones above and the files the other lane also changed (15 files against AI-Seymour's tree, 26 against lane B's, all accounted for by the other lane's changes and the resolution).

### 2.3 The silent trap, and the one runner

The Seymour handoff warned that a textual merge is wrong without a conflict: `abilities.ts` merged cleanly into a file that called AI-Seymour's `finishTouched(scope)` (which empties
`scope.touched`) and then lane B's `runHitEvents(ctx, user, def, scope.touched)` over the empty map, so **lane B's five scripts would silently never run** (Yunalesca, Braska's Final Aeon,
the Pagodas, the possessed aeons, Yu Yevon), while every file and test of that lane still compiled and passed on its own branch. The merged `abilities.ts` is AI-Seymour's file exactly.

**There is now exactly one `onHit` runner**: `ai/hooks.ts#runOnHit`, called from `abilities.ts#finishTouched` over the tally `hit-apply.ts` keeps (`lastDamage`, `affectsHp`, `holdKo`;
the two lanes' definitions were the same). Lane B's `hit-hooks.ts` and `hit-event.ts` are deleted. Its five scripts keep their `HitEvent` shape through a small adapter (about 90 lines),
`ai/hit-script.ts` (`registerHitScript` registers on the runner; `managesHp` is `holdsDeath`; `queueCounter` queues on the one reaction queue). The four differences the handoffs list, settled as the
AI-Seymour handoff recommends:

| # | Difference | Kept |
|---|---|---|
| 1 | Order against other targets: each target hears the action right after its own hits (AI-Seymour), or every hook after the last target (lane B) | AI-Seymour's. **Consequence: one golden digest moves** (2.4) |
| 2 | A follow-up row (Blitz Ace's Last Hit) is the same action: no second event | AI-Seymour's (Yunalesca's counters answered a Blitz Ace twice before) |
| 3 | Reactions: one first-in-first-out queue that may chain, or a flat list that drops what a reaction's hit queues | AI-Seymour's queue; lane B's two reaction sites keep "a counter never triggers another counter" through `FFXRuntime.inReaction` (set for the whole reaction phase) read by `queueCounter`; AI-Seymour's scripts chain on purpose and never read it. A reaction may carry `requiresAlive` (lane B's queue refused a counter aimed at a dead attacker) |
| 4 | Where the state lives: `FFXRuntime.reactions` or a `WeakMap` | The `WeakMap`; `inReaction` and `formDiedAtSeq` stay on the runtime |

Two small additive read-only exports in `ai/hooks.ts` (`peekReactions`, `registeredHookScriptIds`) serve the tests. The two helper modules for the games' random rolls stay two (`ai/game-rolls.ts`,
lane B; `ai/script-random.ts`, AI-Seymour): the same two shapes (a 16-bit draw reduced by the script's own `mod`; the picker over the living and targetable in ascending actor order, no draw below two
candidates), mapped to the engine's one stream differently. Unifying them would move one lane's seeded results; it belongs with the generator decision (P3).

**The test that fails if either lane's scripts are not invoked**: `tests/unit/re-parity-ai-merged-hooks.test.ts` (41 tests). (1) The registry holds every script id of both lanes. (2) For **every shipped enemy
whose script registered an `onHit`** (found from the data, 34 rows), one action that reaches it calls the hook exactly once. (3) Two targets of one action, one registered with each lane's API, each hear it once, in order.
(4) Through a whole engine turn (action, queue, drain): Yunalesca answers the first physical blow with her Form I counter; a Guado Guardian drinks its Auto-Potion. **Mutation-checked**: the runner never
calling the hook fails 37 of 41; lane B's `registerHitScript` registering nothing fails 4 (its rows vanish with it); one AI-Seymour script (the Mortiorchis) unregistered fails 2. Each mutant was restored
byte for byte (sha1 checked). `parity-ffx-ai-intent.test.ts` (asking the enemy-intent panel does not move a fight) now also covers Chapters II and III: lane B's scripts keep memory and spend draws at decision
time too, and they pass.

### 2.4 The goldens

| Golden | Result |
|---|---|
| `ffx-engine-golden` (18 digests) | Merged tree against each lane's own table: **17 identical** (all eight of AI-Seymour's, Chapter II's two, Chapter III seed 1, and the six other chapters'). **One moves: `braskas-final-aeon#7`, link 5 only** (Possessed Shiva; links 1 to 4, 6 and 7 identical, every outcome still seven victories). Cause, proved: Tidus's Overdrive there reaches Possessed Shiva and both Pagodas; Shiva's hook spends a `GetRandomValue` draw, which under difference 1 falls between Shiva's hit and the Pagodas' two, so their damage variance comes from the next draws: **two amounts only change, 2230 -> 2358 and 2377 -> 2459**, nothing else in the log. Running the hooks after the last target (lane B's order) on the merged tree puts all 18 digests back, so the order is the whole cause. Re-pinned once, with the reason in the header ("game-code and game-script parity merged onto 39.4.2") |
| `ffx2-atb-golden`, `ff7-golden` | **Pass unchanged** |

The seed pins the lanes made in files they shared or that rest on both lanes' rules (`enemy-intent`, `ffx-ai`, the advisor, strategy and results tests) all hold on the merged tree without a change:
the full suite found no pin to re-derive (section 3.3). The lane handoffs name the rule each stands for; none moved.

## 3. Verification

### 3.1 tsc, orphans

`node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit` (TypeScript 7.0.2): clean at `ddd7948c`. `node tools/orphans.mjs`: 1,414 modules, 1,335 reachable, **79 orphaned = the 24 that `origin/main` already
has (measured on an export of its `src`) plus 55 unwired kernels**: 36 under `src/battle/ffx2/kernel/` (all of them) and 19 under `src/battle/ffx/kernel/` (`aeon-party`, `aeon-stats`, `ap-award`, `battle-save`,
`ctb-init`, `ctb-scheduler`, `ctb-table`, `ctb`, `drops`, `gear-drop`, `overdrive-cost`, `overdrive-hooks`, `overdrive`, `rng`, `rolls`, `status-extra`, `status-inflict`, `status-pool`, `steal-rewards`).
`ap-award`, `drops` and `gear-drop` are the Steal and kill-reward kernels (`029d49c7`, and the Overdrive-to-AP conversion), unwired by their commit's own subject. Every new module of the runner, the reaction drain and the adapter is reachable.

### 3.2 The art environment (read this before trusting any art test)

The recipe in AGENTS.md and the brief (junction `public/art` to `D:\Final Fantasy\public\art`) gives the **wrong art for 39.4.2**. The main tree's art is the 2026-10-04 state: 2,090 files, a manifest of 101 subjects and 651 poses
that `tools/gen/manifest.mjs --check` calls stale, and 565 files whose bytes differ from the release art. The release art is **`D:\pyrefly-r39-int\public\art`** (5,255 files, 128 subjects, 1,056 poses; the directory
`D:\pyrefly-r3941-spacing` junctions to as well), so this worktree's `public\art` junction points there (a link only; the main art was verified intact, 2,090 files, after the link was replaced). On the main art the first full run
(two-lane tree) failed 9 files / 37 tests, all of them art-state tests (`ui-portrait-face-crop` 26, `exp-leblanc` 4, `pose-install-*` and `pose-scale-art` and `macalania-ship` 1 each).

Even on the release art **three tests fail, and fail identically on the untouched 39.4.2 tree** (`D:\pyrefly-r39-int` at a021787a, run in place): `exp-leblanc` "serves Chapter VI's art exactly as the release tree holds it" and "the workspace
has every painting those ids name", and `pose-scale-art` "every measured subject is current". The cause is art installed after 39.4.2 into that shared directory and not registered or measured (`paine-black-mage/critical,
defend, hurt, sleep`; `paine-gunner`, `paine-samurai`, `paine-songstress` and `paine-dark-knight` poses; `kimahri/defend`, `lulu/defend`: 145 lines in the test's message). That is the art lane's to close; it is not the candidate's. Also: the
production build restores the eye-candy depth maps from `D:/Tools/pyrefly-art-backup/fx`, which lacks `exp-leblanc-last-room/depth.png` and `depth.json` (the hidden Leblanc preview's room); the build warns and goes on, and the deploy's
`fx-assets verify` would refuse such a build, so the release tree must have them.

### 3.3 The full suite (the tree of `ddd7948c`, `--testTimeout=60000 --maxWorkers=4`, 405 s)

**970 files: 961 passed, 7 skipped (the `PYREFLY_MEASURE` harnesses and the like), 2 failed; 15,095 tests: 15,031 passed, 3 failed, 60 skipped, 1 todo.** The 3 failures are the art-drift tests above. Every other
test passes, including the 14 decision-table files of both lanes (273 tests), the new combined test (41), `parity-*` (the kernels), the strategy, advisor and chapter benches. The earlier runs were on the two-lane
tree: 960 files, on the main art 9 failed files, on the release art the same 3 failed tests.

### 3.4 FFX-2 and FF7 cannot change

`ffx2-atb-golden` and `ff7-golden` pass unchanged. Stronger, from the import graph (`src` only, static and dynamic imports): the FFX-2 engine (`battle/ffx2/index.ts`, 63 modules), the FF7 engine (23 modules)
and the FFX-2 data (`data/ffx2/index.ts`, 104 modules) each reach exactly **one** changed file, `src/battle/common/types.ts`, whose changes are interfaces and optional members (type-only, erased at runtime). The whole app (`main.ts`,
1,333 modules by that script) reaches 90 changed modules: 81 FFX engine, AI, kernel and data files, `types.ts`, and the 8 FFX-only edits in `engine/tactics` (3), `scenes` (1), `story` (2) and `ui/ffx` (2). Nothing in `src/app`, `src/audio`, the renderer or the save code changed.

### 3.5 The production build

`npm run build` from this worktree (it junctions `node_modules` and the release art): `tsc` clean, vite built in 10 s, bundle `dist/assets/index-BcR9TGJ3.js` (4,016.80 kB, gzip 1,156.98 kB; 39.4.2's was
`index-cUSnFK7q.js`), worker `worker-UXbkKkXQ.js`, CSS `index-38Br6Uas.css` unchanged; the art step wrote 461 lossless WebP, recompressed 2,890 PNG and left 383 unchanged; **dist: 5,058 files, 9.97 GB** (this worktree's own `dist/`, left in
place; it holds the post-39.4.2 poses of the shared art directory, so it is not a release artifact). Not deployed and no preview served.

## 4. Measurement (the shipped `intendedStrategy`, whole chain, seeds 1 to 500)

`tests/unit/ffx-parity-measure.test.ts` (`PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500`; **use the range form: in this harness a bare `500` is the single seed 500**, and `re-parity-w2` has a different variable with a
different meaning, see 7). "Before" = the release 39.4.2 source (`origin/main`), measured by me on an export of its `src` with the same harness; it equals the W1 handoff's "old" column to the seed. Deterministic: the same code and seeds
give the same numbers, so any difference from a lane's own number is a code difference, not noise.

| Chapter | Wins before -> RC1 | Change | Party turns | Party KOs | RC1 against the lane's own number |
|---|---|---|---|---|---|
| I Seymour Flux | 267 (53.4%) -> **500 (100%)** | +233 | 37.9 -> 46.7 | 3.9 -> 0.6 | AI-Seymour: 500, 46.7, 0.6: identical |
| II Yunalesca | 498 -> **483 (96.6%)** | -15 | 132.0 -> 162.9 | 8.2 -> 12.7 | AI lane B: 483, 162.9, 12.7: identical |
| III Braska's Final Aeon (7 links) | 487 -> 486 | -1 | 253.2 -> 244.8 | 5.3 -> 5.2 | AI lane B: 486, 245.3, 5.2: wins identical, turns -0.5 (the hook order, 2.4) |
| VII Anima and Macalania | 482 -> **443 (88.6%)** | -39 | 50.5 -> 58.3 | 4.8 -> 5.4 | AI-Seymour: 443, 58.3, 5.4: identical |
| VIII Evrae | 488 -> 487 | -1 | 69.8 -> 68.8 | 0.9 -> 0.9 | W1: 487: identical |
| IX Yojimbo | 428 -> 427 | -1 | 76.6 -> 76.1 | 8.0 -> 7.0 | W1: 427: identical |
| X Seymour Natus | 393 -> 386 | -7 | 49.1 -> 54.4 | 1.2 -> 2.1 | AI-Seymour: 386, 54.4, 2.1: identical |
| XII Seymour Omnis | 281 -> **427 (85.4%)** | +146 | 108.1 -> 102.3 | 12.0 -> 1.3 | AI-Seymour: 427, 102.3, 1.3: identical |
| XIV Isaaru (3 links) | 434 -> 424 | -10 | 30.2 -> 30.3 | 2.6 -> 2.7 | W1: 424: identical |
| XVII Sin: Fins and Core | 269 -> 280 | +11 | 304.4 -> 307.4 | 8.8 -> 8.1 | W1: 280: identical |
| XVIII Sin: Face | 151 -> 124 | -27 | 63.8 -> 64.0 | 2.1 -> 2.3 | W1: 124: identical |

12 seeds (the committed harness, unmodified; wins/12): I 12, II 10, III 11, VII 11, VIII 11, IX 9, X 8, XII 11, XIV 10, XVII 3, XVIII 4 (party turns 46.2, 159.1, 242.3, 55.8, 66.8, 71.0, 43.7, 95.8, 30.5, 303.3, 64.4). Against the lanes' 12-seed
numbers every chapter is identical except Chapter III's party turns (242.3 against lane B's 238.5, the same cause).

**No chapter differs from its lane's own numbers by more than noise.** The movers against 39.4.2 are the intended parity effects, each with its cause in the lane handoffs: Chapter I (Cross Cleave never misses took it to 26%; the
Mortiorchis copying Flux's CTB counter, row D-08, takes it to 100%), XII (the spell-free reset turn), II (the game's Mind Blast/Osmose on the aeon on the field and counters after a miss; party KOs +55%), VII (Shell as a real first turn puts
act three on Multi-Fira, -10 points), XVIII (spells no longer crit), the rest small. Counts of 10 or fewer are inside the sampling band (about 4 to 11 seeds, one standard deviation).

## 5. What the player sees (plain words; the CHANGELOG entry carries the same)

**FFX, every chapter (W1).** Hit chances, critical hits and damage follow the game's own rules. Spells, items, Overdrives, aeon specials and several boss attacks have no hit roll in the game and never miss: Seymour's Cross Cleave among
them, and the aeon specials (Aerospark, Heavenly Strike, Sonic Wings). Only commands the game lets crit can crit: no spell does (Lulu's Firaga and Thundaga lose their small crit chance), a few physical skills do (Kimahri's Jump), Daigoro's
attack and Braska's Final Aeon's Triumphant Grasp do not. Luck counts one point a stack in the crit sum, not ten. The modifier order is the game's (3 to 4 percent of ordinary hits were one point off), a natural Defense of 0 is not raised to 1, Cheer and Focus
count only in the formulas that have a term for them, Armored follows the pierce flag, the multi-element ladder is the game's (absorb Fire plus resist Ice halves), the party's percent bonuses reach heals, and a petrified target takes no damage (Mortibody's
Shattering Claw deals nothing to a stoned party member). The five possessed aeons' plain Attack uses the monster-side record and misses about half the time against the party's Evasion. Evade & Counter, Darkness and the Luck/Aim/Reflex stacks follow the game's hit table.

**Chapter I, Seymour Flux (AI-Seymour).** One shared cycle (an actor on the other parity wastes its turn), Flux Banishes an aeon at once, Protect and Reflect fire once each at 52,500 and 35,000, the Mortiorchis comes back at 4,000, 3,000, 2,000, 1,000, 1,000 and copies Flux's turn counter after
each of its turns, so Full-Life follows the Lance of Atrophy far less often. Result with Cross Cleave never missing: the shipped line wins every one of 500 seeds (it won 267 before). **Chapter II, Yunalesca (AI lane B).** Her counters follow every action that reaches her, a miss included, a form changes after the
last hit of the action that ended it (the rest of a multi-hit blow is discarded), Mind Blast and Osmose against a summoned aeon land on the aeon on the field, Form II's counter advances on aeon turns. Harder: 96.6% of seeds, 55 percent more party KOs. **Chapter III (AI lane B).** Braska's Final Aeon's
Overdrive follows the script's fixed gauge (+2 or +3 a turn, +5 a hit, +20 a Power Wave, the Overdrive the turn after it reads 100, Talk clearing it when his next turn starts), Jecht Beam a third of the time in his first and third phases; a destroyed Pagoda returns after two or three of its own turns (one if Slowed) with the damage it absorbed; a possessed aeon's
special lands on one actor (Bahamut's Impulse on all, Anima always Pain, an Overdrive forced on the front line); a character the fayth revives acts next; Yu Yevon casts Gravija every turn after his first, on the front line and himself but not his Pagodas, and the seventh damaging action makes his next turn Osmose on each of the three, then Ultima. A party that swings at Yu
Yevon with a Zombie weapon now wins in about 24 turns, not hundreds.

**Chapter VII (AI-Seymour).** Seymour's Shell and the Guardians' Protect are real first turns, a Guardian drinks an Auto-Potion (+1,000 HP) when damaged (not after a steal, not asleep), Guard cover shields a Guardian from single-target blows, Anima's gauge fills +5 a Pain and +5 an action that reaches her, a lethal blow before the summon lands whole, Seymour is put back on 6,000 and Anima
comes; act three casts two spells at two party slots. 88.6% of seeds (was 96.4%). **Chapter X (AI-Seymour).** Natus owns the element order, his phase follows his HP up and down, Mortibody's Desperado ladder scores Shell, Haste, Reflect and the Nuls (so the shipped line's two Hastes and three Shells call Desperado about half the time), an aeon is Banished at once, and
Natus loses half a Multi-ra when the third slot is down. 77.2% (was 78.6%). **Chapter XII (AI-Seymour).** The discs turn Fire, Ice, Water, Thunder and reset Ice, Water, Thunder, Fire; he always casts four spells, in the order the layout fixes; the reset turn casts nothing; hits during the glow are ignored. 85.4% (was 56.2%). The Omnis readout strip shows four spells and Chapter VII's Anima line plays at Seymour's summon.

## 6. Known differences that remain, for later batches

* **FFX turn order, status infliction and duration, Delay, the per-turn ticks, opening CTB:** the old engine (W2, in flight). The Chapter I result rests on the mount copying Flux's counter and being charged the dummy Command 150's rank 3 (AI-Seymour open item 8): W2 must keep it.
* **The Overdrive gauge and its 17 modes, Steal, Pilfer Gil, Bribe, kill rewards, AP, drops, the gear drop, aeon stats, summon, dismissal and the end-of-battle save:** kernels proven and unwired. The aeon plain Attack still runs on the party's record 0x3000 (Valefor's and Shiva's would drop from power 16 to 14): Bailey's call.
* **The game's own random number generators and stream map:** one seeded mulberry32 stream everywhere (Bailey: "adopt each game's own RNG streams", a later batch). Two roll-helper modules stay (2.3).
* **Boss scripts of Chapters VIII, IX, XIV, XVII and XVIII** (Evrae and Cid, Yojimbo, Isaaru's aeons, the Fins, Genais and the Core, Sin's face): the old hand-written AI (AI lane C, research note `re-ffx-ai-evrae-yojimbo-isaaru-sin.md`, no code).
* **FFX-2 entirely:** 36 kernel files (hit, crit, damage, status, steal, ATB, Spherechange, dresspheres) proven and unwired; the FFX-2 boss scripts of Bahamut/Vegnagun, Shiva/Magus Sisters/Trema, Leblanc/Den of Woe/Ixion are research notes only. FFX-2 behaviour is exactly 39.4.2's.
* **Stale text and code that still teaches the old fights** (listed by the lanes, not rewritten, guides are Bailey's wording): the Chapter III auto-battle line and advisor card (`engine/tactics/braskas-final-aeon.ts`), the Yu Yevon guide cards, Yunalesca's Form I Blind wording, the Chapter I guide ("kill Seymour, not the mount"), the Chapter X line's "never calls Desperado" (D-185), Chapter XII's "colour order: our estimate" strip note and **the painted Omnis discs, which still run the old ring** (a one-step script turn can read as a half turn on screen). Details: `re-parity-ai-seymour.md` and `re-parity-ai-yunalesca-bfa.md` sections 6 to 8.
* **Draws the game takes and ours does not, empty sub-actions, a Doublecast's event cadence, Yu Yevon's opening CTB, possessed Yojimbo's two rows:** the lane notes' "not done" lists. And one open question this merge adds for the exe readers: whether the game runs a target's `onHit` right after that target's last record (as built) or after the last target's (lane B's reading); it moves only the draw order of a hook's roll against later targets' damage, once in the 18 goldens.

## 7. Decisions for Bailey, and the gates

Open decisions from the three lanes (none blocks building; each needs his yes before it ships as a visible change, AGENTS.md rules 9 and 10): (1) Chapter I now wins 100% on the shipped line, one sourced row (D-08), keep or ask for measured options; (2) Chapter XII 56% -> 85% and the painted-disc ring (repaint, or a rotation mapping) plus the strip's wording; (3) Chapter VII -10 points; (4) Chapter X's tactic and guide premise (D-185) and three measured options; (5) Chapter II 3.2 points harder (96.6%); (6) a party that swings at Yu Yevon wins in about 24 turns, keep; (7) D-129, Braska's Final Aeon's Provoke (the script is read; ours redirects every target); (8) Talk's menu row stays as it was (the game greys it differently: a visible menu change); (9) the auto-battle line and advisor card for Chapters I, III and X still teach the old fights; (10) the aeon plain Attack record; (11) the AI-Seymour lane brief reading: decisions that rest on an estimate yield to the script (D-019/g1, D-082, D-083, D-084, D-145/B9, D-184), listed with one-place reverts.

**Gates the main session should know before it plans the release.** (a) `node tools/critic-plan.mjs` at `ddd7948c` (previous build a021787a): **review DEEP**; before the deploy a FOCUSED review of the production candidate; after it live verification, then the DEEP review on the live build; obligations live + focused + deep; 145 changed files ship, 219 have no product effect; checks CHK-003 to CHK-027 (18 of them), targets "fight, presentation" plus "audit every changed data value against research/". The planner reads the 36 unwired FFX-2 kernel files as changes to the "FFX-2 ATB engine" (so it says games: both); the import closure in 3.4 shows none of them is reachable from the app, which is the argument for scoping the FFX-2 checks down. (b) 45 earlier builds already owe a deep review: **the deploy gate refuses a third deploy while one is owed, so this ships only on Bailey's own owner-override words** (`--owner-override="..."`) or after a deep review, as 39.4.2 did. (c) **No browser check was run** (AGENTS.md "Done means" asks for one on a UI change; the lanes had no art): the visible parts are the Omnis readout strip and its model (`src/ui/ffx/OmnisReadout.ts`, `omnisReadoutModel.ts`), Chapter VII's Anima-summon line (a `script-trigger` the AI now emits), and the enemy-intent previews for Chapters II, III and X; the focused review should look at them on a build that has the art. (d) The CHANGELOG entry at the top of `CHANGELOG.md` is headed "Release candidate 1 ... (not live)" and its numbers are this candidate's; whoever ships it retitles it with the release number, address, sha, bundle and review results and bumps the entry count in the file's intro (58 -> 59). `docs/target/*`, `ACTIONS.md`, `DECISIONS.md` and `NOW.md` are untouched: the ledger rows (A-nnnn) for the three lanes, this candidate and Bailey's answers of 2026-10-09 are the main session's. (e) The art directory dependency in 3.2: a release is cut from the release worktree, not from here.

**Merging `re-parity-w2` next.** It shares 27 files with what this candidate added since W1: `abilities.ts`, `engine-end.ts`, `forms.ts`, `hit-apply.ts`, `hp.ts`, `index.ts`, `scripted.ts`, `setup.ts`, `state.ts`, `ticks.ts`, `types.ts`, `command-records/index.ts`, `seymour-natus-abilities.ts`, `CONTRACT-CHANGES.md`, and the tests `advisor-note`, `advisor-v4-card`, `macalania-engine`, `data-ffx-command-records`, `enemy-intent`, `ffx-ai`, `ffx-engine-golden`, `ffx-overdrive-menu-rows`, `ffx-parity-measure`, `ffx-results-ap`, `guide-advisor-target-agreement`, `parity-ffx-engine-wiring`, `strategy-seymour-flux`. Its harness variant reads `PYREFLY_MEASURE_SEEDS=N` as a count (this candidate's reads `1-500` and lists): take one, document it. The seven re-pinned seed files (the AI-Seymour handoff's list) should be re-derived from the rule each pin stands for. Use the same recipe: one runner (`ai/hooks.ts`), test the second lane's scripts are invoked (`re-parity-ai-merged-hooks.test.ts`).

## How to re-run

```
node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit
node tools/orphans.mjs
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-engine-golden.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/re-parity-ai-*.test.ts tests/unit/parity-ffx-ai-*.test.ts
node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run --testTimeout=60000 --maxWorkers=4          # about 7 minutes; expect the 3 art-drift failures of 3.2
PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_OUT=out.json node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run tests/unit/ffx-parity-measure.test.ts   # about 80 s
npm run build                                                                                          # needs the junctions of 3.2; about 2 to 8 minutes
```

The worktree's `public\art` is a junction to `D:\pyrefly-r39-int\public\art`; remove a junction only with `cmd /c rmdir <link>` (no /s), never through it.
