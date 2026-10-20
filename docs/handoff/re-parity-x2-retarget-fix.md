# Re-parity lane x2-retarget: a skill aimed at a foe that falls no longer lands on a girl (FFX-2 only; bug fix)

Branch `re-parity-x2-retarget-fix`, built on `origin/r59-rc` (`6db09ac86`, the live release 59). Not merged, not deployed: the release driver decides whether it ships.
Origin: the demo audit of Chapter IV (`D:/Tools/ffx-parity/demo-audit/ch4-bahamut.md`, FIX NOW 1). Bailey's standing order: "It needs to be a 1:1 parity."
Game case (AGENTS.md rule 14): **FFX-2 only.** The change is in `src/battle/ffx2/targeting.ts`; the FFX engine has its own targeting file and is not touched, and `ffx-engine-golden` and `ff7-golden` are unchanged.

## The defect, in player words

In Chapter IV, a girl's skill that was already on its way to Bahamut when he fell could land on one of the girls instead. Paine's Armor Break is the usual one: she picks it, Bahamut goes down to someone else's blow
while it is still charging, and when it lands it hits Yuna or Rikku (or Paine herself) for about 90 to 350 damage and puts Defense Down on her, in the shot the closing scene starts from. Over 200 seeds of the shipped line it happened in 48 Wait fights (24 percent),
23 Active fights (11.5 percent) and 77 fights at zero decision time (38.5 percent); a girl was knocked out in 2 of the Wait fights and 3 of the Active ones. The fight was always still won. The skill still running after the boss is down is right (the game finishes every queued
command before it ends a battle, FFX2-G10); hitting a girl with it is not.

Cause: `resolveTargets`, case `single-any` (most FFX-2 skills are `single-any`: the Breaks, Drain, Doom, Cheap Shot, ...), fell back to every living unit of both sides when its named target was gone. With the boss dead the only living units are the girls.
`single-enemy` and `single-ally` already kept to their own side.

## The game rule and its evidence

Labels: [R] research or coverage note (the note's own grade in brackets), [E] our engine run, [I] inferred.

- [R, grade H: the routine was run on the live exe] `research/re-ffx2-ai-leblanc-den-ixion.md` section 1.12, "When a target is gone before a command starts". A queued command's mask is re-validated when it starts and on each step before it executes; a member is invalid
  when dead, ejected, not in the battle or not targetable. When **every** member is invalid (an empty mask counts) the mask is rebuilt "from the command's target pool (the living targetable members of the **opposing side**)"; for a single-target row (even with the 0x80
  "can target all" bit set, which is what our `single-any` rows are) it becomes the one nearest, no random draw. "With none alive the mask is left alone."
- [R] `FFX2-G06` ("Target gone"): the re-validation picks a new target from the command's valid set and writes it **only if the new mask is non-empty**; if nothing valid exists the old mask stays and the action goes on (the hits do nothing).
  `FFX2-H05` 3.6 says the same from the re-validation's code ("if nothing valid exists the function returns 0"). `FFX2-H01` 3.3: the release stage recomputes the mask and a cast fizzles only when no hit is left.
- [R] `research/re-ffx2-experiment.md` 5.5: the same routine, run on the live exe, re-aims a single-target row at the nearest living girl, and "with all three dead nothing is left".

So the game never re-aims a skill at the other side. For the audit's case (a girl's skill, a fallen foe) the pool is the caster's opposing side, which is the fallen target's side. With Bahamut the only foe, the pool is empty and the skill does nothing to anyone.

What the notes do not say: **an ally-aimed `single-any` whose ally falls.** Every run of the routine used a monster caster aiming at girls, so "the opposing side" was always the target's side. For a girl's skill aimed at a girl who falls, the notes are silent [I]. The fix follows
`single-ally`'s existing same-side rule (re-aim among the living allies, or do nothing), the conservative reading and the same rule seen from the other side. Nothing in a Chapter IV or V line meets that case.

Two differences from the game that this change does **not** touch, both pre-existing and shared with `single-enemy`: (1) the game picks the nearest by the weighted-pick cost with no draw, ours draws one engine-side stand-in (`rng.aux`); (2) with nothing left the game plays the
command and pays its cost at the start gate, ours returns before taking MP (`resolve.ts:44`). Neither is visible in Chapter IV at the end of the fight.

## The fix

`src/battle/ffx2/targeting.ts`, case `single-any`: when no requested target is targetable, look up the first requested id (`units.find`, targetable or not) and restrict the fallback pool to units on that unit's side (`isFriendly`); an empty pool returns `[]`, which
`resolveAbility` already turns into a no-op (`resolve.ts:44`). Unchanged: a living named target, an **empty** target list (a script's placeholder keeps its stand-in over everyone) and an id that names no unit (no side to keep to). A few added lines, one of them the comment.
`docs/CONTRACTS.md` does not list `targeting.ts` (its five shared files are the types, the RNG, the story DSL, the encounters and the id unions), so there is no `CONTRACT-CHANGES` entry.

## The golden proof (`tests/unit/ffx2-atb-golden.test.ts`)

Re-pinned, nine hashes: `CH4_D0` seeds 2, 3, 4, 6, 7, 14, 16 and 19 (8 of 20) and `CH4_D1500` seed 7 (1 of 10). Every other `CH4_D0` and `CH4_D1500` hash, and every `CH5_D0` and `CH5_D1500` hash, is unchanged: Chapter V has no case of this.
(The audit expected about 15 percent of Chapter IV to move; at zero decision time it is 40 percent, because the bench pace meets the defect in 38.5 percent of fights.) Cause, proved two ways, the cause also written in the golden's header (the eighteenth re-pin):

1. **Only the targeting reverted gives the old digests back.** `git show 6db09ac86:src/battle/ffx2/targeting.ts` as an in-process overlay (a vitest config that maps the worktree's file to the old text with absolute imports; no worktree, copy or checkout;
   `D:/Tools/ffx-parity/rc10/xa6-rerun-evidence/` method): the tree with the new code but the old targeting **passes the previous pins, all six tests**. Put back against the new pins it fails five of the six tests (every one that holds a Chapter IV pin) and passes the Chapter V D = 0 test.
2. **The logs differ by exactly four events.** Full event logs of all 30 Chapter IV runs, old against new, aligned event by event (instance payloads stripped): in each of the nine moved seeds the new log is the old log minus the chain open, the damage, the Defense Down
   status-add and the chain close of Paine's Armor Break on a girl (seeds 3, 7, 16 and the D1500 seed 7: on Paine herself), every one after Bahamut's knock-out; nothing is added and no earlier event differs. (The removed engine draw is on the engine-side stream, which no game stream follows.)

Outcomes do not change: D = 0 is 20/20 in both chapters, the Chapter IV Active D = 1500 arm 10/10, the Chapter V Active arm 8/10, as before.

## The measurements (Chapter IV, 200 seeds, the shipped `intendedStrategy`, action time ON as shipped)

Before = the old targeting as the overlay (its 200 digests at each pace equal the unedited tree's, checked); after = this branch. Same seeds, same paces as the audit (Wait = the default split, 1.5 s a menu of which 0.5 s on the top list; Active = 1.5 s a menu with the clock
running; bench = zero decision time).

| Pace | Wins before / after | Fights where a girl was hit by a girl's own skill, before / after | of them onto another girl / onto herself | Fights a girl was knocked out after Bahamut fell, before / after | Digests that moved |
|---|---|---|---|---|---|
| Wait | 200 / 200 | **48 / 0** | 31 / 17 | 2 / 0 | 51 |
| Active | 200 / 200 | **23 / 0** | 17 / 6 | 3 / 0 | 24 |
| Bench | 200 / 200 | **77 / 0** | 57 / 20 | 0 / 0 | 77 |

- No outcome changed in any of the 600 fights. The audit's 31 and 17 are exactly the "onto another girl" column; Paine's hits on herself come on top.
- Digests moved = fights where a girl's skill was aimed at a girl after the boss fell: Wait 48 with a hit plus 3 where Armor Break was evaded (51), Active 23 plus 1 (24), bench 77. One more Wait fight (seed 166) has a girl-on-girl "wrong-state" miss, but it comes long before the boss falls and is identical in both trees (a menu pick, not this defect).
  After the fix there is no girl-sourced damage or miss on a girl after the boss falls in any fight.
- The audit counted 4 Active fights with a girl knocked out; this count finds 3 (any girl KO after Bahamut's, any cause). After the fix it is 0 on both counts. The difference was not chased.
- Fight length changes by 5 to 18 steps (under 0.6 s) in 2 Wait, 1 Active and 2 bench fights; total steps over 200 fights: Wait 685,500 to 685,473, Active 846,504 to 846,499, bench 641,137 to 641,101. Cause not traced.

## Tests

- New: `tests/unit/ffx2-single-any-retarget.test.ts` (19 tests): a foe target that falls re-aims among the foes, or does nothing with none left (30 seeds each, no engine draw spent when nothing is left); a removed or hidden foe counts as gone; Armor Break itself through `resolveAbility`
  (a no-op, no event, no HP or status change on any girl; with a second foe standing it lands on that foe and on no girl); the ally mirror (Yuna down re-aims to Rikku or Paine, never a foe; all girls down gives nothing; a `can-target-dead` row keeps the fallen girl it names);
  what stays (empty list, unknown id, `single-enemy` and `single-ally`); and Chapter IV through the real engine on six seeds that hit a girl before the fix (bench 2, 3, 4, 7; Wait 1, 5), asserting no girl-on-girl damage or miss, no girl KO after Bahamut's, and a win.
  **13 of the 19 fail on the old targeting** (the overlay), the 6 that pass are the controls.
- `ffx2-atb-golden`: re-pinned, 6/6.
- Sweep counts: see "Sweep" below.

## Sweep

Method: every test file under `tests/unit` that imports `src/battle/ffx2` directly, or a helper that does, or names Bahamut (358 files, 2 vitest workers; the full suite was not run; the list is `D:/Tools/ffx-parity/tmp/x2-retarget/sweep-list.txt` while the lane folder exists), run on this branch; then every failing file re-run on the old targeting as the overlay (the baseline at 6db09ac86, no worktree or copy).

| Run | Files | Tests | Passed | Failed | Skipped |
|---|---|---|---|---|---|
| First sweep, this branch (golden and the new test already updated) | 358 (12 failed) | 5,536 | 5,432 | 19 | 85 |
| After re-pinning the five pinned files below | 358 (7 failed) | 5,536 | 5,437 | 14 | 85 |

- **The 14 failures left are art-only** (`public/art` is not in a worktree): `chapter-meta`, `leblanc-party-sprites` (the manifest file is missing), `pause-remake` (3), `den-of-woe-ship-content` (3), `fallen-aeons-ship-content` (2), `leblanc-art` (2), `trema-ship-content` (4). Re-run on the old
  targeting they fail in exactly the same 14 tests plus the same two file-level errors: art-only failures equal those at 6db09ac86.
- **The 5 other failures were this change's, and are re-pinned** (below). On the old targeting those five files pass 39 of 40 tests (one skipped), so the failures were digest moves, not breakage.
- `ffx-engine-golden`, `ff7-golden` and `tools/ffx-chapter-hashes`: 21 passed, 0 failed, 1 skipped (unchanged; rule 14).
- `npx tsc --noEmit` (the project's own tsc by path): clean. `node tools/orphans.mjs`: the same four pre-existing orphans as before (`placeholder-sprites.ts`, `tidus.ts`, `MessageBar.ts`, `PartyPrep.ts`); nothing new.
- The 38 test files that import `ffx2/targeting` or `ffx2/resolve` directly, and the Chapter IV tests, are inside the 358.

### The wider reach: Chapter VI (Leblanc) and one Sisters seed moved too

The same defect also fires in Chapter VI, mid-fight, where several foes stand and a foe falls before a queued skill lands: Paine's Armor Break or Mental Break landed on Yuna or on herself. Every pinned digest the fix moves comes back exactly under the old targeting
(127 pinned values checked on the old targeting: 0 differ; on the fix 39 differ). Re-pinned, each with the same note in the file ("Re-pinned 2026-10-20 for the retarget of a skill whose foe has fallen"):

| File | Moved | Detail |
|---|---|---|
| `ffx2-atb-golden` | 9 of 60 | `CH4_D0` 8, `CH4_D1500` 1 (above) |
| `ffx2-hit-closes-menu` | 6 of 9 rows | Chapter IV and Chapter VI seeds 1 to 3; Chapter V unchanged |
| `ffx2-menu-cancel-delay` | 8 of 18 | Chapter IV 3, Chapter VI 5; Chapter V unchanged |
| `chapters/den-of-woe-carry` | 9 of 32 | all 8 Chapter 6 (Leblanc) hashes, and the Road Sisters seed 4 (hash only; not event-diffed, it returns exactly under the old targeting); Chapters 5 and XI unchanged |
| `ffx2-hit-reaction-wiring` | 4 of 8 | Chapter IV seeds 2 to 5 |
| `fixtures/parity/ffx2/action_span_off.json` | 12 of 60 keys | `ffx2-bahamut` bench 1 to 3 and human 1; `ffx2-leblanc` bench 1 to 3 and human 2; the same four for `exp-leblanc` (the experimental chapter plays the same Leblanc chain) |

Event-level cause, for every moved log that was kept (the drive-based ones: Chapter IV and Chapter VI in `hit-closes-menu`, `menu-cancel-delay`, `hit-reaction-wiring`): the first differing event is a chain open, a damage and a status-add (Defense Down, or Magic Defense Down) by Paine on a
girl, played by the old engine and not by the new. In Chapter IV nothing else differs (3 or 4 events). In Chapter VI the removed hit changes the rest of the fight (one run ends with a girl knocked out by it), so those logs diverge from there on; outcomes of the Chapter VI runs were not
measured over 200 seeds in this lane (only the Chapter IV measurement above).

## CHANGELOG paragraph (FFX-2 only; a bug fix)

FFX-2 only: a skill aimed at a foe that falls before it lands no longer turns on your own party. In Chapter IV, if Paine's Armor Break was still on its way to Bahamut when he went down, it could land on Yuna, Rikku or Paine herself instead, for 90 to 350 damage and a Defense Down, and now and then knocked
a girl out in the closing seconds of the fight. A skill whose target is gone now looks for another target on that same side, and with none left it simply does nothing, as the game's own re-targeting does. The same thing could happen mid-fight in Chapter VI against Leblanc's gang when a foe fell before Paine's skill landed; it no longer does. Who wins is unchanged (Chapter IV: 200 of 200 before and after, at Wait, Active and instant menus).

## Open items

- Release driver: decide whether this ships. Pinned digests move in Chapter IV and Chapter VI (Leblanc) and one Road Sisters seed, in six files (table under "Sweep"), all re-pinned here and each shown to return exactly under the old targeting. Chapter IV outcomes do not change (200/200 before and after at three paces); Chapter VI outcomes and the Road Sisters were not re-measured at 200 seeds.
- Chapter VI (Leblanc) deserves its own 200-seed before/after (wins, girl-on-girl hits) if the driver wants the same table as Chapter IV; the pins show it moves on all eight chain seeds.
- The Road Sisters seed 4 (`den-of-woe-carry` `sisters`) was re-pinned from the old-targeting round trip only, not event-diffed.
- The ally-aimed `single-any` (a girl's skill aimed at a girl who falls) follows `single-ally`'s same-side rule as a conservative reading; the notes were only run with monster casters. No Chapter IV or V line meets it.
- Pre-existing differences kept: the game re-aims to the nearest by the weighted-pick cost with no draw (ours draws on `rng.aux`); the game still plays the command and pays its cost when nothing is left (ours returns before taking MP).
- The audit's Active girl-KO count (4) against this count (3): not chased; zero after the fix either way.
