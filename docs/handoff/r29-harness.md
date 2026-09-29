# r29 harness: the capture harness fixes (PR-0225, critic round 15)

Branch `r29-harness` (worktree `D:/pyrefly-r29-harness`), from `origin/main` c9c1c295. Not pushed, not deployed.
**Game case: both.** This is critic tooling under `critic/runner/lib/`; no shipped file changed
(`node tools/critic-plan.mjs --paths ...` says "no shipped file changed", "4 with no product effect", so
no paper preflight was owed). The letter rule in issue 3 is **FFX only** (its source, `src/battle/ffx/letterTags.ts`,
says so; FFX-2's ATB HUD names its own rows). The picker (issue 1) was seen in FFX Chapter II; the dead-menu
escape (issue 2) is FFX Chapter VIII's Orders widget; the recorder (issue 4) is shared.

## What PR-0225 was, the cause I proved, the fix

| # | Symptom in round 15 | Cause (proved) | Fix |
|---|---|---|---|
| 1 | Chapter II `yunalesca win`: 14 of 14 Grand Summons thrown away (18 misses; the `-p` re-run had 1) | A menu row that opens an Overdrive or Grand Summon list leaves no `.ig-cmd` rows. The harness read that as "the pick failed", pressed Escape (cancelling the picker) and fell back to Attack | The round-15 patch, promoted as it was into `route-fight.mjs`: detect `.ffx-mg-list` / minigame-request with no command rows, arrow to the row the advisor card names, Enter; each play is listed in `run.json.pickerPlays` |
| 2 | Chapter VIII lose route: 393 empty picks, engine frozen at turn 15, never reaches Defeat or RETRY | Orders' list had both rows disabled ("Already far" / "Ordered"). The lose route's last fallback ("first enabled row") is the selected row, Orders, so it re-opened the dead overlay every turn and left it open. **Reproduced before the fix**: a local run stalled with the widget up and had to be killed at 6+ minutes (its log ends at the first enemy action) | An all-disabled overlay is escaped and recorded (`run.json.escapes`, one `27-dead-menu-escaped` capture); the lose route remembers which row's list was dead this turn (`deadRows`) and takes the next enabled row; the round-15 empty-pick counter is kept as a backstop (capture at 3, stop at 25, `stuckRows`, `stuckState`) |
| 3 | Chapters III and XII real-key losses: `Slow -> Yu Pagoda A` landed on `yu-pagoda-right` (43/39/43 times), `Attack -> Mortiphasm A/B` on `mortiphasm-3` | `slugOf('Yu Pagoda A')` matches no `data-target-id` (`yu-pagoda-left/right`, `mortiphasm-1..4`), so `confirmTarget` pressed ArrowRight 8 times and confirmed the highlight | `route-pure.mjs#resolveTargetId`: display name, then trailing letter through `letterTagMap` (a copy of `letterTagsOf`; `tests/unit/critic-route-harness.test.ts` runs both on the same roster and requires equal output), then the old id-slug match. `confirmTarget` steers right then left until that id is highlighted, reads the highlighted `data-target-id` back before Enter, and returns `{ wanted, target, mismatch }`. A mismatch, or a name that cannot be resolved, is kept in `run.json.targetMismatches`. A lettered enemy that is not on screen resolves to null, never to a neighbour |
| 4 | The dialogue timeline could not measure repeats or on-screen time | The recorder fell back to the hidden `.dbox`, and merged consecutive lines by one speaker that share a 24-character prefix | Only `.dbox.dbox--visible` counts. `route-pure.mjs#dboxStep` (injected into the page by source, so the test holds the same code) makes one entry per show: the typewriter growing extends the entry; a repeat, a shorter line or a line that opens with the previous line's words is a new entry (`show` number); `endMs` is when the box went away. A MutationObserver reads the box on every change besides the 100 ms poll, so the empty frame between two lines is not missed |

Files: `critic/runner/lib/route-fight.mjs`, `route-ui.mjs`, `route-evidence.mjs`, new `route-pure.mjs` (+ `.d.mts`),
`critic/runner/lib/README.md`, new `tests/unit/critic-route-harness.test.ts` (12 cases; they fail before the fix
because the functions do not exist, and the first lettered case also shows that no id starts with
`yu-pagoda-a`). Commits: 575f3b74 (issues 1, 3, 4, 2 first half), 2cc7e916 (issue 2, the lose route).

## Proof: a local production build, real keys, pinned seeds

`npx vite build --outDir .dist-r29-harness-tmp` from this worktree (origin/main c9c1c295), `vite preview` on port 7970,
`PYREFLY_BROWSER=gpu`, headless Playwright from node, one browser at a time, `node critic/runner/lib/route.mjs <id> <goal> --base=http://127.0.0.1:7970/pyrefly-reprise/ --seed=1 --jpeg`.
Each run's `run.json` (all 0 console errors) is in `docs/handoff/r29-harness-evidence/`; screenshots in `docs/screenshots/r29-harness/`.

| Route | Seed | Outcome | What it shows |
|---|---|---|---|
| `yunalesca win` (II) | 1 | **victory**, 147 turns, 12.0 min | 1 Grand Summon advised and played through the picker (list Valefor / Ifrit / Ixion / Shiva / Bahamut, chose Valefor); 5 summon events in the battle log (Valefor, Shiva, Ixion, Ifrit and a fifth); 1 miss (Summon > Bahamut, subRows empty, the same 1 as round 15's `yunalesca-win-p`), not 18 |
| `braskas-final-aeon win` (III) | 1 | **victory**, 214 turns, 19.9 min, with the FFX ending aftermath (`30-post-scene` = "Chapter III, Dream's End, Inside Sin", results, board after, reload) | every one of the 8 `Slow -> Yu Pagoda A/B` picks landed on the id it named (5 on `yu-pagoda-left`, 3 on `yu-pagoda-right`), 0 mismatches; the timeline holds 78 shows ending with Tidus and Yuna's farewell and the narrated last lines; 0 repeated entries |
| `seymour-omnis win` (XII) | 1 | **victory**, 130 turns, 12.6 min, aftermath reached (`30-post-scene`, board after) | 12 of 12 `Attack -> Mortiphasm A/B` picks on `mortiphasm-1`/`-2` as named, 0 mismatches, 0 misses. The one repeated entry ("Rest now. All of you, together." x6) is six real shows of the same line |
| `ffx2-trema win` (XIII) | 1, then 1001 (retry) | **defeat, defeat** (82 and 107 turns, 14.5 min) | not won. The harness played every advised pick (0 misses, 0 mismatches, 0 empty picks); a first 15-minute run on seed 1 was still undecided at 205 turns. This is the known difficulty Bailey chose from the measured options (D-151; best about 6.5 %), not a harness fault |
| `evrae-airship lose` (VIII) | 1 | **defeat, RETRY reached** (retry seed 1001, `33-retry-battle`) in 2.7 min, 9 engine-level picks | 2 dead Orders lists escaped and recorded; results screen "Defeat" with RETRY / CHAPTER SELECT (`viii-defeat-results.jpg`). Before the fix, the same route on the same seed stalled at turn 15 |

Before evidence: `critic/rounds/round-15/evidence/yunalesca-win/run.json` misses versus `yunalesca-win-p`,
`evrae-airship-lose-r2/27-no-choosable-row.png` and the patch `critic/rounds/round-15/cap/lib/route-fight.mjs`
(all in the main tree's untracked `critic/rounds/round-15/`, not in this branch).

The chief critic's dissent (the confirmer's Chapter XII re-run read the advisor's target as honoured) is settled by the
above: with the resolver, XII wins by real keys on seed 1 with every lettered pick on its named id, and III wins with the
ending aftermath. CHK-022 III and XII can be re-read from these runs' evidence shape (a real-key win each); a critic
round must still capture its own on the build it reviews.

## Not fixed, and why

- **Chapter XIII (Trema) by real keys** is still not won (2 defeats on seeds 1 and 1001). Not a harness defect: the
  advisor line loses at the measured rate; tuning a boss is out of scope (rule 6, D-151).
- **Chapter V "each Farplane line once per show"** (PR-0225's acceptance line) was **not run** here: it needs a full
  FFX-2 Chapter V win (about 15 minutes) and the brief named five routes. The recorder change is held by the unit
  cases and by the III/XII timelines (no repeated entry except genuine repeats). A critic capture owner should run
  `ffx2-vegnagun-shuyin win --seed=1` and read `dboxTimeline`.
- `run.json.outcome` reads `undecided` at `closeFight` when the fight was won a moment after the budget, and is corrected
  from the results screen text (`outcomeFrom`); the first Chapter III run (budget 15 min) ended on the battle screen for
  that reason, so use `--budget=1800000` for III (the winning run took 19.9 min).
- The unit tests hold the pure decisions only; the browser paths (picker arrows, the dead-menu Escape, the reticle
  steering) are proved by the runs above, not by a vitest.

## Notes for the next agent

- D: filled to 0 bytes free during these runs (other agents' worktrees), so the later runs wrote their evidence to
  the session scratch on C:; only the summaries above were copied into the repo.
- Chapter VIII's lose route relies on `readRows` seeing the overlay stack first; do not read the main stack while the
  Orders widget is up.
- `route-pure.mjs#dboxStep` is injected with `Function#toString`; keep it free of imports and module-scope closures.
