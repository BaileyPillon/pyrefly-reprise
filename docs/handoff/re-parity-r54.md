# Release 54 assembly (re-parity, FFX only): boss data ON, Doublecast as two picks, Isaaru's duels (Defend off, Yuna's command lock, disabled rows greyed)

Status: **built, tested and pushed on branch `re-parity-r54`** (2026-10-18); not merged to `main`, not deployed, not live. **Game case: FFX only** (AGENTS.md rule 14): `src/battle/ffx2`, `src/data/ffx2`, `src/battle/ff7` and `src/audio` are untouched by the assembly; `ffx2-atb-golden` (6 tests) and `ff7-golden` (3) pass unchanged.
Bailey's words behind it: boss data "All six (Recommended)", Isaaru's duels "Match the game (Recommended)", and the standing order "It needs to be a 1:1 parity."

## 1. The three parts and their shas

| # | Part | Branch / sha | Base it was built on | Touches `ffx-engine-golden`? |
|---|---|---|---|---|
| 1 | **Base: boss data, all six switches ON** (D1 stat floors, D3 Zanmato level, D7 Flux's Slow, D8 Evrae's Doom, D9 the Life flag, D10 the record's remaining immunity bits) | `origin/re-parity-rc10-ffx-boss-data-on` `c30f65291` (= r53-rc `aef7e0e73` + the boss-data lane `cd962ee25` merged in `8c0dd80d2` + the commit that turns the switches on `a66426afe`) | r53-rc | re-pinned there for D1 (12 digests; Chapter III's 11 seed rows in `last-summoning-iii-pin`) |
| 2 | **Doublecast as two picks**, each cast paid at its own cost check | `origin/re-parity-rc10-ffx-doublecast` `c030970a4` | r52-rc | unchanged |
| 3 | **Isaaru's duels**: formation flags (Defend off, `842b27c8b`) and the Isaaru command lock (Yuna: Summon and Grand Summon only) | `origin/re-parity-rc10-ffx-isaaru-commands` `fc74d1240` | r52-rc | unchanged |

Commits on `re-parity-r54` (merges only, no rebase, no amend, no reset):

1. `bc33e1fbd` `(FFX only; r54 assembly)` merge of part 2 into part 1.
2. `d3a96f430` `(FFX only; r54 assembly)` merge of part 3.
3. `8cd7296c3` `(FFX only; Isaaru duels: disabled rows greyed, not hidden, as the game's draw loop does)` the follow-up (section 3).
4. The commit that adds this note (the tip; `git rev-parse origin/re-parity-r54`).

## 2. The merge conflicts and how each was resolved

Only `docs/CONTRACT-CHANGES.md` conflicted, in both merges (both lanes wrote an entry at the top of the file). Everything else merged without a conflict and was then proved by `tsc` (exit 0) and the tests of section 5:

- `src/battle/common/types.ts` (a contract file): auto-merged; the additive fields sit side by side (`DoublecastCast` and `AbilityCommand.casts` from part 2; `FormationCommandOff`, `EnemyGroupDef.commandDisables` and `defendOff` from part 3). The file is 3,240 lines and was far over 400 before this (the contract file is the standing exception).
- `src/battle/ffx/setup.ts` (399 lines, **at the limit**: nothing was moved out, none was needed), `execute.ts` (378), `commands.ts` (308), `engine.ts` (379), `aeon-duel.ts`, `doublecast.ts` (223): auto-merged, both sides' logic present. The two lanes touch different lines of `execute.ts` (Doublecast's one call line; Isaaru's refusal and flag reads).
- **`docs/CONTRACT-CHANGES.md`, merge 1 (part 2):** kept both sides, newest first: part 1's two 2026-10-17 entries (Yojimbo comment, pose sizing W3) first, then the Doublecast entry (`AbilityCommand.casts`), then the older entries.
- **`docs/CONTRACT-CHANGES.md`, merge 2 (part 3):** kept all entries, newest first: `commandDisables` / `FormationCommandOff` (2026-10-18) on top, then the Yojimbo and pose-sizing entries, then the Doublecast entry, then `defendOff` (2026-10-17), then the older ones. Checked by a sorted-line diff that no line of either side was lost (the same lines, only the three markers gone).
- `setup.ts` is now 399 lines: **the next change to it must move a helper out first.**
- The follow-up adds one more entry on top (a comment-only change to `types.ts`, section 3).
- Both lanes' handoff notes, plans and fixtures (`docs/handoff/re-parity-rc10-ffx-*.md`, `docs/plans/*-review.md`, `tests/fixtures/parity/ffx/formation_*.json`) came across as added files with no overlap.

## 3. The follow-up: disabled command rows are drawn greyed, not left out

The Isaaru lane's independent check read the original's menu draw loop: it calls the command resolver (`0x0089ACA0`) for **every** row and skips a row only for the result -4; a disabled command answers -1, so the row is drawn with a flag, **read as the grey flag** (not watched on screen; this repo has never run the game), and a pick of it plays cue 3. The original prints no reason text.

What changed (FFX only, inside the same switch `FORMATION_COMMAND_DISABLES`; Chapter XIV's three formations are the only ones that carry the list):

- `src/battle/ffx/formation-commands.ts`: `withoutDisabledRows` is now **`greyDisabledRows`** (renamed, because the old name would now be a lie; the Isaaru lane's own handoff note still says `withoutDisabledRows`). It keeps every row that belongs to a switched-off command for that actor and returns it as a copy with `enabled: false` and **no `disabledReason`** (the field is deleted from the copy, so even the duel's older "Only an aeon can fight an aeon" is gone from those rows). The rows of another member, a monster, and every battle with no list are returned untouched (same array when nothing is switched off).
- `submit()` still refuses a switched-off command, the turn kept open, no event: nothing about the engine's rule moved.
- **Which reason I chose: none, not even a short word.** Evidence from the FFX HUD in `src/ui/ffx`: `AvailableCommand.disabledReason` is optional; `commandHelpText` (`commandHelp.ts:116`) prints the effect alone when there is no reason (`if (cmd.enabled || !cmd.disabledReason) return effect`), so no "undefined" and no dash; a greyed row gets the `ig-cmd--disabled` class; the menu opens on the first enabled row (`CommandMenu.ts:270`, `firstEnabledIndex`) and the cursor skips greyed rows (`:499`, `:568`); a pick of one calls `shake()` (`:528`, `:558`, `:579`, `:637`), the HUD's existing refusal gesture; a group whose items are all greyed is itself greyed (`rowEnabled`). Nothing in `src/ui` was edited and no word was added. **No sound is played**: cue 3 has no counterpart in our audio; the shake stands in for it. A reason needs a word only if the driver wants one.
- Yuna's first menu is now: Attack, Item (and its rows), Skill / Special (Pray, Scan) and the White Magic lists **drawn greyed**; Summon (five rows; the mirror-locked one is greyed with its own reason) and Grand Summon open; Talk greyed with its own older reason (no script touches Talk, 0x3105). The cursor opens on the **Overdrive (Grand Summon) row**, not on Summon: the first enabled row of the top list is Overdrive, which sits above Summon (corrected in release 54 stage 1, 2026-10-18, by a probe of the real engine's menu; this section first said Summon; pinned in `parity-ffx-isaaru-commands-engine.test.ts`). The Defend tab stays absent (it is a separate control, not a command row; section 8).
- `src/battle/common/types.ts` (contract file): **comment only** on `EnemyGroupDef.commandDisables` ("drops the rows" became "keeps them, greyed"); `docs/CONTRACT-CHANGES.md` has the entry (2026-10-18, newest). `AvailableCommand` is unchanged: `enabled` and an optional `disabledReason` were already its greyed row.
- Comments that said "hidden" were updated: `formation-commands.ts` header and table, `commands.ts`, `engine.ts`, `aeon-duel.ts` header, `via-purifico.ts` B7 line.
- Tests (the ones that asserted "no row" now assert "greyed row, refused"): `tests/unit/parity-ffx-isaaru-commands-engine.test.ts` (three links: every row of a switched-off command is present, `enabled: false`, no `disabledReason` field; the pickable rows are Summon and Grand Summon only; submitting each is refused with no event; the fork sees the same; the pure rule: kept as a copy, input never changed, a row's own older reason is dropped, another member's row keeps it, a monster's menu is the same array) and `tests/unit/chapters/isaaru-duel.test.ts` (Yuna's Attack, Cura, NulBlaze, Pray, Scan and three items are each `enabled: false` with no reason and no enabled row; the pickable kinds are Summon and Overdrive). One new test reads the FFX HUD's pure view-model on the real engine's menu: Attack and the Item, Special and White Magic groups are greyed rows, the cursor lands on a Summon or Overdrive group (stage 1 of release 54 tightened this to the Overdrive group, the real answer), and the help slab text of a greyed Cura equals the enabled one (effect alone).
- **A finding in the Isaaru lane's own test, fixed here:** the bigger-party test ("a bigger party in the same battle") never reached Yuna's menu (its driver summoned with the first member, which ended the loop), so its Yuna assertions (`not.toContain`) ran on an empty list. It now drives each member with a move that member can make (`pass`) until Yuna's menu is read, and asserts the greyed rows by presence.
- **The corrected CHANGELOG sentence** for the Isaaru paragraph (replace "the rows are not shown" in `re-parity-rc10-ffx-isaaru-commands.md` section 7): "...so she can no longer attack, heal, cast Nul spells, use Pray or Scan, or use items between aeons; those rows stay on her menu, greyed, and only Summon and Grand Summon can be picked." Section 6 of that note ("the rows are not shown") and its section 10 item 1 are superseded by this section.

## 4. The golden and pin proof

The pins are the committed files. `git diff c30f65291 HEAD -- tests/unit/ffx-engine-golden.test.ts tests/unit/chapters/last-summoning-iii-pin.test.ts tests/unit/ffx2-atb-golden.test.ts tests/unit/ff7-golden.test.ts tests/fixtures/ff7-golden.json` is **empty**: the pinned digest tables are byte for byte the ones part 1 pinned (D1 re-pin at `c30f65291`). On the merged tip:

| Test | Result | What it proves |
|---|---|---|
| `ffx-engine-golden` | 18 of 18 pass | every one of the 18 digests (every listed chapter, seeds 1 and 7, the whole chain's event logs) equals part 1's boss-data-on table: Doublecast and Isaaru move nothing there, as the lanes said |
| `chapters/last-summoning-iii-pin` | 17 of 17 pass | Chapter III's twelve seeds equal part 1's NOW table; the off-state proof (all six switches false = release 53) still holds |
| `ffx2-atb-golden` | 6 of 6 pass | unchanged |
| `ff7-golden` | 3 of 3 pass | unchanged |

Because the tables are unchanged and pass, nothing was re-pinned and no ablation (switching each lane off in a scratch copy) was needed: no digest differs. The identity run of section 6 is the stronger form of the same fact (whole logs of 192 plays, not 18).

## 5. Tests and checks

Run from this worktree with `TEMP` and `TMP` on the per-lane folder, two workers at most, no full suite, no game run:

- `tsc --noEmit -p .`: **exit 0** (before and after the follow-up). `node tools/orphans.mjs`: 26 orphans, the same 26 as before; `formation-commands.ts`, `formation-flags.ts` and `doublecast.ts` are all reached.
- **The lanes' own tests, 16 files, 243 tests, all pass:** `parity-ffx-boss-data`, `parity-ffx-boss-data-engine`, `parity-ffx-doublecast`, `parity-ffx-doublecast-order`, `parity-ffx-formation-flags`, `parity-ffx-isaaru-commands`, `parity-ffx-isaaru-commands-engine` (28 tests now), `chapters/isaaru-duel`, `chapters/isaaru-engine`, `trigger-commands`, `ui-ffx-doublecast-menu`, `ffx-doublecast-aim`, `chapters/last-summoning-iii-pin`, `ffx-engine-golden`, `ffx2-atb-golden`, `ff7-golden`.
- **The FFX advisor, chapter and parity files that touch Doublecast, Isaaru or the boss rows, 50 files, 778 tests: 775 pass, 3 fail, all three art-only** (`chapters/isaaru-ship.test.ts`: "art that exists", "installed plate", "installed painting"; `public/art` does not exist in a worktree, the standing expectation). The files: `advisor-ownership`, `advisor-plan`, `advisor-v4-purity`, `parity-ffx-ai-omnis-discs`, `parity-ffx-command-gate`, `parity-ffx-engine-command`, `parity-ffx-recoil-rank`, the `re-parity-ai-*` files (yu-yevon, yunalesca, isaaru, evrae, sin-core, sin-face, sin-fins, yojimbo), `re-parity-ch18`, `re-parity-menus`, `re-parity-w2-rc1-merge`, `strategy-braskas-final-aeon`, `status-silence-card-words`, `ffx-engine-fork`, `ffx-lone-target-step`, `parity-ffx-default-attack`, `parity-ffx-engine-aeons`, `-entry`, `-loot-battles`, `parity-ffx-loot-data`, `data-ffx-command-records`, `iter2-b1-aeons`, `tactics-lookup`, `strategy-guide`, `guide-doc`, `guide-doc-start`, `r29-text`, and the chapter files `isaaru-bench`, `isaaru-ship`, `isaaru-tactic-bench`, `mirror-aeons-party`, `mirror-aeons-dog`, `omnis-bench`, `den-of-woe-engine`, `sin-core-engine`, `sin-fins-engine`, `sin-carry`, `yojimbo-engine`, `evrae-engine`, `evrae-advisor`, `natus-engine`, `seymour-flux-mortibsorption`, `seymour-flux-poison-crossing`. **The full suite was not run** (by the brief; the release driver runs it once before a push to main).

## 6. Identity: the merged tree against `c30f65291`

Method (the same lab the last two lanes used, with one column added): every FFX chapter's shipped line (`setupForChapter`, the app's chain loop, `intendedStrategy`, `autoResolveMinigames` on), seeds 1 to 12, played on `c30f65291` (exported by `git archive` into the lane folder) and on the merged tree. One row per seed: outcome and links won, party turns, engine turns, party KOs, a digest of every link's whole event log, and a **digest of every menu the line was offered** (`commands` of each player-input decision).

**16 chapters x 12 seeds = 192 plays: 192 of 192 identical in outcome, links won, party turns, engine turns and party KOs, and 192 of 192 identical in the whole event log of every link.** Menus: **180 of 180 identical in the fifteen other chapters, and 0 of 12 identical in Chapter XIV** (`isaaru-via-purifico`), the only chapter whose menus may differ and the only one that does (Yuna's greyed rows; no Defend tab). Wins and mean party turns, base / merged, are equal in every row:

| Chapter | wins | party turns |
|---|---|---|
| seymour-flux | 12 / 12 | 53.3 / 53.3 |
| yunalesca | 12 / 12 | 148.3 / 148.3 |
| braskas-final-aeon | 11 / 11 | 240.3 / 240.3 |
| seymour-anima-macalania | 12 / 12 | 53.9 / 53.9 |
| evrae-airship | 12 / 12 | 69.7 / 69.7 |
| yojimbo-cavern | 11 / 11 | 66.8 / 66.8 |
| seymour-natus | 11 / 11 | 35 / 35 |
| seymour-omnis | 12 / 12 | 90.7 / 90.7 |
| isaaru-via-purifico | 11 / 11 | 37.8 / 37.8 |
| sin-fins-core | 12 / 12 | 300.2 / 300.2 |
| sin-face | 12 / 12 | 45.1 / 45.1 |
| mirror-aeons | 8 / 8 | 187 / 187 |
| sinspawn-gui | 12 / 12 | 83.7 / 83.7 |
| exp-fayth (hidden) | 12 / 12 | 69.7 / 69.7 |
| biran-yenke | 12 / 12 | 16.5 / 16.5 |
| last-summoning (hidden, Chapter 28) | 12 / 12 | 9 / 9 |

Chapter III and Chapter XVIII use the old Doublecast shape and play event for event as before, as the Doublecast lane found on 500 seeds. The lab's scratch files (`zz-r54-identity.tmp.test.ts`, the base export, the junction) live only in the lane folder `D:/Tools/ffx-parity/tmp/r54/`, which is deleted at the end of the lane; the script is not committed.

## 7. CHANGELOG paragraphs (for the release driver to paste into the Release 54 entry; each is already written, FFX only, plain words)

- **Boss data, all six ON:** `docs/handoff/re-parity-rc10-ffx-boss-data.md` section 9 (one paragraph per switch: D1, D3, D7, D8, D9, D10) and section 11 (what turning them on re-pinned). D10's two visible changes are the ones a player meets.
- **Doublecast as two picks:** `docs/handoff/re-parity-rc10-ffx-doublecast.md` section 8. It says "the menu is unchanged for now": true in this release, the two-pick picker is not built.
- **Defend off in Isaaru's duels:** `docs/handoff/re-parity-rc10-ffx-formation-flags.md` section 7. Its sentence "the Defend tab is not shown" is still true; "ours stays silent for now" stays true.
- **Isaaru's command lock:** `docs/handoff/re-parity-rc10-ffx-isaaru-commands.md` section 7, **with the one corrected sentence of section 3 above** (greyed, only Summon and Grand Summon can be picked; not "not shown").
- Disclosures in player words: those four notes' "Disclosures" sections. Supersessions for `DECISIONS.md` (the release driver records them): D-147 B6 and B7 as in the Isaaru note section 8.

## 8. Visible text, the real-input checks owed, open items

**Visible text (found by grep, NOT edited):**

1. `src/data/guides/ffx-isaaru.ts:37`, the first rule's `text`: "...Yuna can summon, heal herself and use items, nothing else." **Now false**: she can summon (Summon and Grand Summon) and nothing else. Its `cite` (line 39), "B6 (our estimate for the greyed rows)", no longer describes the menu either.
2. Boss-data text reach (`re-parity-rc10-ffx-boss-data.md` section 11.4): the Yu Pagodas' `scanText` at `src/data/ffx/enemies/braskas-final-aeon.ts:129-130` is never shown now (Scan on a Pagoda fails); Yu Yevon's `sensorText` at `:508` is now reachable by Sensor (HP 99,999, MP 1) where the plate said "Immune to sensors." (`src/ui/ffx/sensorImmune.ts:17`, D-221); Chapter III's last link and Chapter 28. No guide line claims Slow lands on Flux, Shell/Protect/Reflect on a Pagoda, or that Scan works on one.
3. The Doublecast banners (below) are new text the player sees once the picker exists; today only the wrapper's one-spell shape is submitted.

**Real-input checks owed (a browser, headed, a real keyboard or pad; none was run: this lane runs no game and no dev server):**

1. **Scan on a Yu Pagoda** (Chapter III, and Chapter 28's Pagodas): nothing revealed, the Scan status refused (an immune miss). Screenshot.
2. **Sensor on Yu Yevon** (Chapter III's last link, Chapter 28): the Sensor panel reads HP 99,999, MP 1 and the sensor line, not "Immune to sensors." Screenshot.
3. **Isaaru's greyed rows** (Chapter XIV, all three links): Yuna's window shows Attack, Item, Skill/Special and White Magic **greyed**, the cursor opens on Overdrive (Grand Summon), the first row she can pick, with Summon just below it (the section 3 correction); pressing a greyed row shakes it and does nothing; Summon and Grand Summon work; Talk stays greyed with its own reason; no Defend tab; her aeons' menus are unchanged (Attack, abilities, Dismiss). Check the help slab on a greyed row reads as the effect alone, with no stray dash. Screenshot at 1600x900 and 390x844.
4. **The two Doublecast banners:** the lines "Doublecast: Fire" then "Doublecast: Firaga" for a Doublecast of two different spells (Lulu; Chapter III or XVIII) appear as two banners in a row. This needs the engine's two-pick command, which only the not-yet-built picker submits, so today it can be reached only by a scripted submit to the engine; the one-spell-twice case plays as before.

**Open items:**

- **The Defend tab** (formation-flags handoff section 8): still absent, not greyed. It is a separate control, not a command row, so the greyed-row change does not touch it; whether the original greys it is the driver's call.
- **The refusal cue** (cue 3) has no counterpart in our audio; the HUD's shake stands in. The grey flag is a reading of the decompile, not a watched screen.
- **The two-pick Doublecast picker** (a mockup and Bailey's yes first, AGENTS.md rules 9 and 10): the engine side is merged and the seam for `doublecastPicks` is the driver's call (Doublecast handoff section 6).
- **Isaaru, still unresolved:** the Talk row (left greyed with its older reason); monster scripts that call `setCommandDisabled` mid-fight (m101, m109, m123, m163 to m169, ... in the Isaaru handoff section 11) are a row for the gap scan.
- **Merge order for the goldens:** other RC10 lanes that re-pin `ffx-engine-golden` must re-derive on this tree; the table to match is part 1's, unchanged by this assembly.
- **`setup.ts` is 399 lines** (section 2).
- Part 1's open items (data-file comments that describe the old rows; the real-input check) still stand.
- The three `isaaru-ship` failures are art-only and expected in a worktree without `public/art`.

## 9. Release 54, stage 1 (the release driver's assembly on `r54-rc`, 2026-10-18)

Branch `r54-rc`, cut from `origin/re-parity-r54` (`94012a68d`). **Game case: FFX only** for everything section 1 to 8 describe; the r53-rc merge is both games and already shipped-candidate work.

- **The merge:** `origin/r53-rc` (`9c91a8c3a`, the Release 53 candidate) merged with `--no-ff` (`dd5dcbfa7`). One conflict, `docs/CONTRACT-CHANGES.md`: every entry of both sides kept, newest first (this branch's two 2026-10-18 entries, then r53's ch4-camera and pose-motion entries, then the older ones; a sorted-line comparison shows no line of either side lost). `CHANGELOG.md` merged without a conflict. No golden and no pin overlapped, so none was re-derived: `ffx-engine-golden` 18 of 18, `chapters/last-summoning-iii-pin` 17 of 17, `chapters/den-of-woe-carry` 7 of 7 (r53's FFX-2 Garment Grid pins), `ffx2-atb-golden` 6 of 6 and `ff7-golden` 3 of 3 pass as committed on the merged tree.
- **The guide line (section 8, item 1) is fixed:** `src/data/guides/ffx-isaaru.ts` no longer says Yuna can heal herself and use items; it says Summon and Grand Summon are the only rows she can pick, every other row stays greyed and refuses a pick, and Defend is off for everyone. Its `cite` now names the formation scripts and the notes that read them in place of "B6 (our estimate for the greyed rows)".
- **The cursor correction (section 3, section 8):** the duel's command window opens on the **Overdrive (Grand Summon) row**, not on Summon. Probed on the real engine's menu through the HUD's pure view-model (`buildTopRows`, `firstEnabledIndex`) in all three links: the top rows are Talk, Attack, Special, White Magic, Items (all greyed), then Overdrive, then Summon; the first enabled row is Overdrive. The earlier test asserted "Summon or Overdrive", which hid it; it now asserts Overdrive and its one row, Grand Summon.
- **The CHANGELOG:** the Release 54 entry is written (every paragraph tagged FFX only; the two-pick Doublecast menu is not in the entry yet).
- **Stage 2 merges (the driver's extra steps):** `origin/dcast-hud` (`4c1bf5461`, the two-pick Doublecast menu, option A "Second round"; FFX only; branches from `c030970a4`, so it merged without a conflict, commit `869c03518`, whose message reads "wip": a merge commit made by a bare `git merge -m` before the message was fixed; history is not rewritten here) and `origin/re-parity-r54-docs-c` (`4697bb72a`, docs only: raw game-byte listings in `research/re-ffx-dark-aeons.md` and `research/re-ffx2-angra-mainyu.md` replaced by values with their sources; both files taken whole, byte-identical to that branch). The two behaviours coexist: the Isaaru and formation rows are greyed with no `disabledReason` (so the new phone reason line, which prints only an engine-given reason, shows nothing on them), and the second Doublecast list's rows the MP cannot pay are greyed with "Not enough MP". The one reason left in the duels is the game's own mirror lock on the locked aeon's Summon tile ("Mirror of Grothia"), which now also prints on a phone tile.
