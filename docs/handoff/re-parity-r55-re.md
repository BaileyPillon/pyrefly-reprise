# Re-parity r55 RE: the FFX parity switches ship ON (menu draw a to e, Chapter III roster removal, Grand Summon refuses a fallen aeon, the target steps except t3b and t5)

Status: **built, tested and committed on branch `re-parity-r55-re`** (from `origin/re-parity-rc11-rule8-cleanup`, `e3cae5aa8`, with `origin/re-parity-rc11-ffx-target-parity`, `b843823d2`, merged in `7c46292d2`); pushed to `origin/re-parity-r55-re` (the tip: `git rev-parse origin/re-parity-r55-re`); **not merged to main, not deployed, not live** (2026-10-18). Nothing was added that the lanes had not already built: this lane sets the shipped values, updates the guide text and the tests that pinned the old defaults, and measures. **No rule, roll, turn count or event log changes** (section 4). Follow-ups after the independent check (`D:/Tools/ffx-parity/rc11/r55-re-check.md`, PASS) are section 11.
**Game case: FFX only** (AGENTS.md rule 14). `src/battle/ffx2`, `src/ui/ffx2` and FF7 are untouched; `ffx2-atb-golden` and `ff7-golden` are unchanged and byte-identical. No boss number and no party number was changed or added.

Bailey's words: the decision page, 2026-10-18 about 08:55 EDT, relayed verbatim by the release driver: "I'll go with all of your recommendations"; and for t6b, relayed later by the RE main session: "For t6b my answer is on". The switch list below is the driver's reading of those answers, row by row.

## 1. The parts and their shas

| Commit | What |
|---|---|
| `7c46292d2` | merge of `origin/re-parity-rc11-ffx-target-parity` (`b843823d2`; its base `354706148` was already in `e3cae5aa8`); one conflict, `docs/CONTRACT-CHANGES.md`, both entries kept, newest first |
| `6d288f97f` | the four shipped defaults (`menu-draw-parity.ts`, `target-step-parity.ts`, `roster-removal.ts`, `grand-summon-ko.ts`) |
| `d8e034e2f` | the two Last Summoning guide lines reworded |
| `9741925d0` | the pin helper, ten files started from an explicit OFF, two new shipped-state test files |
| `079419a7e` | the chapter tests that pinned old defaults, the guide's short line under 52 characters, the label-based ring walk |
| `f5df16f27` | the contract note that the switches ship ON, `ffx-engine` and `ffx-overdrive-menu-rows` |
| `d38ca0576` | `ui-ffx-hud` |
| the commit that adds this note | the tip |

## 2. The switch table (what ships)

`MENU_DRAW_PARITY` = `{ on: true, skip: ['cursor', 'help'] }`. `TARGET_STEP_PARITY` = `{ on: true, skip: ['cursorStartFoe', 'sideSwitch'] }`. `CH3_ROSTER_REMOVAL.on` = true. `GRAND_SUMMON_KO_REFUSED.on` = true. `SCRIPT_COMMAND_DISABLES.on` = false. The submit guard has no flag and was already on. Every row is also pinned by `parity-ffx-shipped-switches.test.ts`, which sets nothing and reads the module defaults (ten mutants, each flipping one shipped or left-off item or switch back, were all caught by it and the HUD file).

| Item | Switch | Ships | Bailey's decision |
|---|---|---|---|
| a opener rows | `MENU_DRAW_PARITY` `openers` | ON | "I'll go with all of your recommendations" (recommendation: match the game, on) |
| b Curse with a full gauge | `overdrive` | ON | same |
| c Summon list keeps a fallen or recovering aeon greyed; also Chapter 28 shows no row for a taken aeon (C28) | `summon` | ON | same |
| d blocked Escape, Flee, Switch greyed with no reason | `blocked` | ON | same (the explaining "Can't escape" goes) |
| e Talk only where a script adds it | `talk` | ON | same |
| f the resting cursor and the stand-in "no" cue | `cursor` | **OFF** | the driver's switch list |
| H help slab prints no reason under a greyed row | `help` | **OFF** | the driver's switch list |
| "Can't escape!" roll of a hand-submitted blocked Escape is a silent refusal | d plus the submit guard | ON (follows from d; `parity-ffx-shipped-switches` and the rewritten `ffx-engine` test pin it) | follows from d |
| R Chapter III's later links lose the aeons the event removed | `CH3_ROSTER_REMOVAL` | ON | "I'll go with all of your recommendations" |
| G Grand Summon refuses a knocked-out or recovering aeon | `GRAND_SUMMON_KO_REFUSED` | ON | same |
| the submit guard | `submit-guard.ts` | ON (unchanged) | already on |
| t1 self and Talk steps | `selfStep` | ON | same |
| t2 lone-foe Overdrive step | `overdriveStep` | ON | same |
| t3a cursor starts on the caster, the first fallen ally for a revive | `cursorStart` | ON | same |
| t3b foe start on formation index 0 | `cursorStartFoe` | **OFF** | the driver's switch list (open item 1 of the target lane: the foe order is unverified for multi-foe formations). It gates **every** foe-first step: since the check's follow-up (section 11) Talk, Pull back and Cancel order also carry no `start` while it is off |
| t4 revive with nobody down | no flag (already the game's) | nothing to switch | |
| t5 side switch (hit an ally, heal a foe) | `sideSwitch` | **OFF** | the driver's switch list |
| t6a one-entry lists open: Skill, Special, Black Magic, White Magic, Summon, Items | `openerOne` | ON | same |
| t6b one-entry Overdrive lists for Tidus, Kimahri, Auron, Wakka and Lulu only | `openerOne` (the same flag; the five-character rule is in `opensList`) | ON | **"For t6b my answer is on"** (the RE main session, relaying Bailey). Aeon Overdrives, Grand Summon and Mix stay as they were; it replaces the Ink & Gold "OVERDRIVE -- READY" flat row for the one-entry case of those five |
| t7 Copycat is self-only | `copycat` | ON | same (no chapter has Copycat) |
| S1 to S5 the possessed copy's script lock | `SCRIPT_COMMAND_DISABLES` | OFF (**moot**) | with R on it changes nothing: 0 differing event logs in four routes over 500 seeds (`re-parity-rc11-ffx-ch3-roster.md` section 9). Left off, no code change |
| `ACTION_TIME_PER_COMMAND` | FFX-2 branch | not on this line | nothing to do |

**Switch shape.** `openerOne` is one flag, so with t6b ON no separation was needed (the earlier plan to split t6a and t6b was dropped when Bailey's t6b answer came: the shipped skip list has only `cursorStartFoe` and `sideSwitch`). Nothing else needed a shape change: f and H are `skip` entries of the menu switch, t3b and t5 of the target switch. t3b's gate is `target-step-parity.ts#recordStep` for the foe-first record steps (Talk, Pull back, Cancel order) and `startFor` / `targetStepFor` for every other foe command; all ask `targetStepParity('cursorStartFoe')`.

**What f and H off mean in play.** The cursor skips greyed rows exactly as before (so the greyed Escape, Flee and the Switch placeholder are drawn but never rested on), an opener row never greyed by Silence or MP opens onto greyed entries, the cursor in an all-grey list has nowhere to move, a confirm there shakes the stack and plays **no** cue, Escape backs out. The help slab still prints "reason - effect" for a row that has a reason. These paths are covered by `ui-ffx-menu-draw-parity.test.ts` ("item a alone (skip cursor)") and the new `ui-ffx-shipped-switches.test.ts`.

## 3. Golden proof

With the shipped switches, run from this worktree (at most two vitest workers, no game run): `ffx-engine-golden` (18), `ffx2-atb-golden` (6), `ff7-golden` (3) and `last-summoning-iii-pin` (17): **4 files, 44 tests, all pass, no file changed**. The baseline run on the merged tree at the old defaults gave the same 44. **Nothing was re-derived**, so no golden header comment changed and `ffx2-atb-golden` and `ff7-golden` are byte-identical. The cause check the driver asked for ("turn the responsible switch off and get the `e3cae5aa8` table back") is moot for the tables and was done for the whole game instead: with every switch set OFF the tip plays **192 of 192 plays identical to `e3cae5aa8` in all ten fields, menus and target decisions included** (section 4).

## 4. The identity result (16 FFX chapters x seeds 1 to 12 = 192 plays, 20,676 party decisions)

Method: the overlay, nothing written into the repo and no worktree add, archive or copy. `mkbase.mjs` rewrites the 11 `src` files this lane's tip differs from `e3cae5aa8` in from `git show e3cae5aa8:<path>` and a node `module.register` resolve hook redirects the tree's imports to them (proved live: the base's `MENU_DRAW_PARITY` is `{on:false,skip:[]}` and its `ffxTargetMode` has no `targetStep`; the tip's are the shipped values); the same lab file plays both (the shipped line: `setupForChapter`, the app's chain loop, the Last Summoning in the offering's own order, `intendedStrategy`, minigames auto-resolved). Per play: outcome per link, links won, party turns (every player-input decision), engine turns (every `turn-start`), party KOs, refusals, a digest of every link's whole event log, of every menu (full rows) and of every HUD target decision. Scripts and results: `D:/Tools/ffx-parity/rc11/r55-re-evidence/`. The runs finished at 11:29, before HOLD_HEAVY (11:32).

| This tip against `e3cae5aa8` | Differing plays of 192 |
|---|---|
| outcomes, links won (416 and 416), party KOs (476 and 476), party turns (20,676 and 20,676), engine turns (29,947 and 29,947), refusals (0 and 0), **whole event logs** | **0 in every one** (184 and 184 final-link victories) |
| menus (full rows), rows without the `targetStep` field, HUD target decisions | 192 (by design: the greyed Escape row, the steps) |
| **the tip with every switch set OFF** against `e3cae5aa8`: all ten fields | **0** (menus and target decisions included) |
| R alone (everything else off) against all-off: event logs and everything but the menu | 0; menus differ in 11 of 12 plays of Chapter III, nowhere else |
| G alone against all-off | 0 in every field |

**Turn counts may differ only where a switch's effect explains it, and here they do not differ at all** (R and G move no shipped-line play, as their handoffs said).

Per-item counts, one engine-side item on at a time (the other items off), against all-off, in the same 192 plays (decisions of 20,676 / plays of 192); the rows the engine builds, so the HUD-only items (a, f, H, t6) are counted separately below:

| Item | Menus moved |
|---|---|
| b `overdrive` | 417 / 18 (Yunalesca 6 plays, Mirror Aeons 12) |
| c `summon` (with C28) | 2,015 / 91 (79 plays before, plus the 12 Last Summoning plays) |
| d `blocked` | 19,855 / 192 |
| e `talk` | 3,132 / 71 |
| t1 `selfStep` | 10,679 / 159 |
| t2 `overdriveStep` | 3,007 / 129 (the Gems of every party that carries them move the menu too) |
| t3a `cursorStart` | 19,855 / 192 |
| t7 `copycat` | 0 (no chapter has Copycat) |
| for reference, OFF: t3b `cursorStartFoe` 20,492 / 192, t5 `sideSwitch` 20,324 / 192 | not shipped |
| the whole shipped state | 20,665 of 20,676 decisions / 192 |

HUD-only items on the shipped line (counted from the same plays): t1 step confirms **298** (Talk 97, Evrae's Pull back 79, self steps 92, lone-foe Overdrive 26, Combine 4); t6 list hops **448** (Special 295, White Magic 110, Overdrive 43, which is t6b: Tidus 13, Auron 6, Wakka 24); **746 extra confirms in 20,676 decisions (3.6 percent, 3.9 a fight)**. The Summon hops of the target lane (39) are gone: with item c the Summon group lists every aeon, so it is no longer a one-entry list. Items a, f and H have no engine rows; a is walked in section 6.

## 5. The tests

`npx tsc --noEmit` is clean. `node tools/orphans.mjs`: 26 orphans, the same 26. Every source file under 400 lines (`setup.ts` untouched at 399, `CommandMenu.ts` is 927 lines: the merged target lane edited it, taking it from 928 in `e3cae5aa8` to 927, so it stays at or under its 928 cap).

**New** (`tests/unit/`): `parity-ffx-shipped-switches.test.ts` (9: the module defaults of every switch and item; Chapter I's greyed Escape and Flee with no reason, Talk for Yuna and Kimahri only, a hand-submitted Escape refused silently with the turn kept open; a cure opens on the caster, Attack has no `switchTo` and no foe start; Chapter II's Guard step and Tidus's missing Talk; Chapter III link 2's list of four, link 6's none, a fallen Valefor greyed with no reason in the list and the picker and a Grand Summon naming it refused with the gauge kept), `ui-ffx-shipped-switches.test.ts` (8, jsdom, real key events on the real `CommandMenu`: a Silenced Lulu's Black Magic opens onto grey spells, the cursor never rests on a greyed top row, a confirm shakes with no cue, Escape backs out and Attack still works; a Cursed Tidus's greyed Overdrive; Tidus's one-entry Overdrive opens a list of one and backs out; `opensList` for the five characters; the label-based ring walk of every party member of Chapters I, II, III and XIV), `helpers/pinPreR55Switches.ts`.

**Updated because they pinned a switch's default OFF** (each now pins the shipped value and, where the old behaviour is still reachable, keeps it under an explicit switch-off):
- started from an explicit OFF by `pinSwitchesToPreR55()` (they were written for off and turn on what they exercise): `ui-ffx-menu-draw-parity`, `parity-ffx-ch3-roster`, `parity-ffx-ch28-no-row`, `parity-ffx-grand-summon-ko`, `parity-ffx-submit-guard`, `parity-ffx-target-step`, `ui-ffx-target-step-parity`, `parity-ffx-script-command-locks-engine` (it compares the script lock with the roster removal off), `parity-ffx-isaaru-commands-engine`, `ffx-lone-target-step`; `parity-ffx-menu-draw` does the same with its own `beforeEach`;
- rewritten to the shipped value: `chapters/biran-yenke-engine` (Escape, Flee, Switch are greyed with no reason), `chapters/isaaru-duel` x3 (greyed Switch/Escape, no Talk for Yuna, a fallen Shiva is a greyed Summon row), `chapters/last-summoning-chain` (a taken aeon has no row), `chapters/last-summoning-taken-row` (the TAKEN badge path stays tested with the `summon` item skipped), `chapters/last-summoning-chapter` (the guide wording), `chapters/sinspawn-gui-rules` x2, `ffx-engine` (the "Can't escape!" roll is now a silent refusal; the roll is kept under a switch-off), `ffx-overdrive-menu-rows` (no Talk row for Tidus in Chapter I), `ui-ffx-hud` x2 (the Switch row is found by label because an opener is no longer skipped; the one-entry Overdrive shortcut is pinned for Yuna and t6b's list of one for Tidus).
- unchanged and passing: `parity-ffx-script-command-locks`, `parity-ffx-isaaru-commands`, `ui-ffx-help-slab-parity`, and all 29 guide test files in `tests/unit/` (`guide-*`, `strategy-guide*`, `advisor-guide-badge`, `ui-*guide*`; 394 tests).

**Wider sweep: every test file that imports FFX battle, data or UI code or the engine tactics (670 files of 1,120; 9,621 tests), run before the final fixes.** Batch 1 (170 files, at most two vitest workers): 2,136 tests, 14 fail, 4 of them art-only (`chapters/mirror-aeons-art`: the four Dark Aeon art-manifest rows, as the earlier lanes listed for this worktree's art copy) and 10 in the files above. Batch 2 (204 files that touch menu rows, Summon, Grand Summon, targets or the HUD, small batches of 26, one worker once HOLD_HEAVY was set): 2,578 tests, 6 fail, all pin-the-old-default tests (`chapters/sinspawn-gui-rules` x2, `ffx-engine`, `ffx-overdrive-menu-rows`, `ui-ffx-hud` x2). Batch 3 (the other 296 files, batches of 30): 4,907 tests, 2 fail, both art-only (`exp-leblanc` hashes a Rikku painting of this worktree's older art copy; `scene-backdrop-file` wants `art/backdrops/exp-fayth-deck.png`, which this copy lacks). Every one of the 16 default-pin failures was then fixed as listed above and its file re-run green; the 6 art-only failures are listed, not fixed. **The full `npm test` is owed to the driver before any push to main** (AGENTS.md "Done means"; this brief ruled it out).

## 6. The HUD with real keys

The target-parity check's explorer (`hud-explore.check.test.ts`: the real `CommandMenu`, real `KeyboardEvent`s, the shipped chain's real decisions; every enabled row walked to its commit, Escape out of every step and list, every commit submitted on an engine fork) was adapted (`D:/Tools/ffx-parity/rc11/r55-re-evidence/hud-walk.check.test.ts`) to run on the shipped defaults and to add a ring walk and a probe of every greyed opener. One run: Chapters I, II, III and XIV, seed 13, 127 decisions probed, 3,295 rows, 1,909 step rows, 110 self steps, 9,035 commits **all accepted by the engine**, 3,171 Escapes out of steps and lists **all clean**, 27 greyed openers opened, refused on a confirm with the shake and left with Escape (**no stuck path**). That run started at 11:30 and ended at 11:32, as HOLD_HEAVY was set. Its 175 other lines were all from my added ring probe, which compared the stack's window index with the full row list (the stack shows a few rows at a time) and so reported "the cursor rested on Escape" and "Switch never reached" falsely. The probe now compares labels; the same check as a unit test on every party member of the four chapters passes (`ui-ffx-shipped-switches.test.ts`). **A re-run of the explorer with the fixed probe is owed after the hold** (one vitest worker, about two minutes: `CH=seymour-flux,yunalesca,braskas-final-aeon,isaaru-via-purifico SEEDS=13 SAMPLE=3 MAXPER=30 node vitest.mjs run --config D:/Tools/ffx-parity/rc11/r55-re-evidence/vitest.walk.config.mjs`, and the same with `HMODE=off` for the comparison). **Correction (the independent check, 2026-10-18):** the explorer in `r55-re-evidence/` reads `process.env.MODE`, which vitest overwrites with `'test'`, so a `MODE=off` run silently ran the shipped state. The check's copy `D:/Tools/ffx-parity/rc11/r55-re-check-evidence/hud3.check.test.ts` reads **`HMODE`** (`shipped` by default, `off` for every switch off), also records which groups open a list, and has a key-quota mode (`KEYQ=1` probes a decision whenever it shows a not-yet-seen actor, group, size, enabled and step combination, so rare rows such as one-entry lists are reached). The working command, from `D:/Final Fantasy/.claude/worktrees/re-parity-rc1` (one vitest worker; `vitest.walk.here.config.mjs` in that folder includes the check's own explorer, the old `vitest.walk.config.mjs` there points at a temp folder that no longer exists):

```
TEMP=D:/Tools/ffx-parity/tmp/<lane> TMP=D:/Tools/ffx-parity/tmp/<lane> \
  CH=seymour-flux,yunalesca,braskas-final-aeon,isaaru-via-purifico SEEDS=13 SAMPLE=3 MAXPER=30 KEYQ=1 \
  node "D:/Final Fantasy/node_modules/vitest/vitest.mjs" run hud3 --config D:/Tools/ffx-parity/rc11/r55-re-check-evidence/vitest.walk.here.config.mjs
```

and the same line with `HMODE=off` in front for the comparison (it must show 0 step rows and 0 greyed openers). The check ran them: the builder's four chapters at seed 13 gave 127 decisions, 3,295 rows, 1,909 step rows, 9,035 commits all accepted, 27 greyed openers refused and left; all 16 chapters at seeds 13 to 15 with `KEYQ=2` gave 127 decisions and 6,821 commits all accepted; `HMODE=off` gave 26 decisions, 0 step rows and 0 failures.

## 7. Visible text (found by grep and by the tests above)

- **Goes:** the reason "Can't escape" on the Flee row (the row is greyed with no reason; `commands.ts:152`, kept for the off path); the greyed Talk row and its "Nothing left to say" for Tidus in Chapters I and II and in the Yu Yevon link and five possessed links of Chapter III, and for Yuna in Isaaru's duels; in the Last Summoning the greyed Summon row "Taken by Yu Yevon" and its TAKEN badge (the aeon has no row; the words stay in the code for the off path and for `engine/tactics/lookup.ts#onLastSummoningBoard`, which reads the flag).
- **New, with no words:** a greyed Escape row, a greyed Switch placeholder (Gui's second fight, Chapter XXV), a greyed Overdrive row under Curse, greyed Summon rows for a fallen or recovering aeon, greyed entries inside an opened opener of a Silenced or empty-MP caster.
- **Changed:** the help line of a one-entry opener group (t6a and t6b) now reads "Open the Special menu." / "Open the White Magic menu." / "Open the Black Magic menu." / "Open the Skill menu." / "Open the Summon menu." / "Open the Items menu." / "Open the Overdrive menu." (the last for the five characters) instead of the single entry's own help line; the entry's help shows once the list is open (`commandMenuRows.ts#groupHelp`). A Chapter III link with no aeon left has no Summon row at all (links 6 and 7).
- **Still there:** the message "Can't escape!" (`escape.ts:28`, `BattlePresenterEvents.ts:363`) now reaches a player only through a command with no row at all, which the HUD never sends. The help slab still prints "reason - effect" under a greyed row that has a reason (item H is off). The target plates reuse "TARGET <name>" and "ALL ALLIES".
- **Guides:** `src/data/guides/last-summoning.ts` lines 59 and 60 now say "the aeons already taken are gone from Yuna’s Summon list and the one in front of you is never offered" and "Taken aeons are gone; nothing heals between links" (the short line stays within the 52 characters a test enforces), and `src/data/guides/docs/last-summoning.ts` line 59 says "The aeons Yu Yevon has taken are gone from Yuna’s Summon list, and so is the one you are about to face." Citations unchanged. No other guide line says Tidus has a Talk in Chapters I or II (the Braska and Natus Talk lines are about fights where Talk stays), that Escape or Flee is available, or that a fallen aeon vanishes. `ffx-isaaru.ts` line 81 ("Its mirror stays greyed") is still true: a mirror-locked aeon keeps its greyed row and its own words.
- **Foe start of Talk, Pull back and Cancel order:** where the cursor first rests among two or three foes follows t3b like every other foe command (no `start`: the HUD opens it where it opens an Attack); with t3b on it is formation index 0 for all of them (section 11). No word changes.
- **Switch in Gui's second fight:** the shipped build draws a greyed Switch row there (a locked placeholder, never rested on, never pickable). The guide line `src/data/guides/sinspawn-gui.ts` (THE GUEST HOUR) used to say "no bench and no Switch"; it now says "no bench, so Switch is greyed out (locked)". Citation unchanged (`ffx-sinspawn-gui §4.7`).
- **Sounds:** none. Item f is off, so the stand-in "no" cue never plays (section 9).

## 8. CHANGELOG paragraph (for the driver; this lane does not edit CHANGELOG.md)

FFX only, the battle command menu and Chapter III. The menu now follows the original more closely. A caster who is Silenced or out of MP still opens Black Magic, White Magic, Skill, Special and Summon; the entries inside are greyed instead of the whole command refusing to open. A Cursed character with a full Overdrive gauge keeps the Overdrive row, greyed, and Yuna's Summon list keeps a knocked-out or recovering aeon as a greyed row. Escape, Flee and Switch are shown greyed, with no reason, in the fights that forbid them, and Talk appears only where the game gives it: Tidus no longer has a greyed Talk in Chapters I and II or in the last Chapter III fights, and Yuna has none in Isaaru's duels. Guard, Sentinel, an aeon's Shield and Boost and the Magus Sisters' orders open a cursor on the user and wait for a confirm, Talk and Evrae's Pull back open a cursor on the foe, an Overdrive that strikes random foes (Slice and Dice, the reels, the Gems, the Furys) opens a cursor even against a single foe, and a list with one entry opens instead of running its entry (Skill, Special, the magic lists, Summon, Items, and the Overdrive of Tidus, Kimahri, Auron, Wakka and Lulu). A cure or a potion starts on the caster, and a revive starts on the first fallen ally. In Chapter III's last battles the aeons you have given up are gone for good: each aeon Yu Yevon takes leaves Yuna's Summon list and Grand Summon's choices, so the possessed aeon you face and every aeon taken before it can no longer be called, and when none is left Summon and Grand Summon are unavailable. Grand Summon no longer lets you pick an aeon that has been knocked out (it used to spend your Overdrive and your turn on nothing). In the Last Summoning, a taken aeon is no longer shown greyed with a "Taken" tag; it is simply not in the list. Nothing about the rolls, the damage or the length of any fight changed: sixteen FFX chapters at twelve seeds play out event for event as before, and a player who answers a possessed aeon by calling another aeon needs about a tenth more turns in Chapter III. Read from the game's code and its files, not run.

## 9. The stand-in "no" cue (item f, OFF in this build)

The FFX menu set's existing `error` cue: `src/ui/ffx/refusalCue.ts` calls `audio.playSfx('error')`; the cue is the entry `error` of `src/audio/sfxV2/cues.ts` (line 126, game `ffx`), manifest `sfxParity/packs/ffx-core/cues/error` in `public/audio/manifest.json` (take `ffx.ui.error.v2`, row `ffx.ui.error`, 0.43 s at offset 0.677 s of `public/audio/sfx/parity-ffx-core.mp3`; credited in `docs/audio/CREDITS.md`, line 428). It is unheard (hard rule 13) and, with item f off, **never plays in this build**; the driver can add it to `docs/audio/audition.html` for the day Bailey wants to hear f.

## 10. Open items

1. **Owed after HOLD_HEAVY lifts:** the HUD explorer re-run with the fixed ring probe (section 6). The 192-play identity runs are done (section 4); nothing is owed there.
2. **The full `npm test`** before any push to main; and the live checks the lanes listed (the greyed palette, the foe-list order behind t3b, "Out of reach" greying, the empty-target behaviour, the refusal cue) are unchanged and still need a live frame or ears.
3. **f off, H off:** a player never sees the cursor rest on a greyed Escape, Flee or Switch row, so those rows are drawn but unreachable (read-only); the stand-in cue and the reason-free help slab wait for Bailey's ears and eyes.
4. **t3b off:** a command that opens on a foe still opens on the leftmost foe on screen, not formation index 0, **Talk, Pull back and Cancel order included** (the follow-up in section 11 gated their start; before it they alone started on formation index 0); the foe start is its own flag when a live frame confirms the order.
5. **t6b is ON for the five characters** (Bailey): one extra confirm for Tidus, Kimahri, Auron, Wakka and Lulu on a one-entry Overdrive (43 hops in 192 plays of the shipped line); the Ink & Gold flat "OVERDRIVE -- READY" row stays for aeons, Yuna and Rikku.
6. **Carried from the lanes, unchanged:** the Summon opener with no aeon left is not drawn greyed in Chapter III's links 6 and 7 (open item 1 of the roster lane), Talk is not removed after use in four chapters, Anima/Yojimbo/Sisters are not in Chapter III's chain, `Chr+0x6D8` is unread.
7. **Not edited by this lane:** `CHANGELOG.md`, `docs/handoff/NOW.md`, the ledgers (the driver records the decisions). The branch's upstream is set to `origin/re-parity-rc11-rule8-cleanup` by `git switch -c`; the push is explicit: `git push origin re-parity-r55-re`.

## 11. Follow-ups after the independent check (2026-10-18; FFX only)

The check (`D:/Tools/ffx-parity/rc11/r55-re-check.md`, evidence in `r55-re-check-evidence/`) passed `f30a8dfcb` with no blocking item. Its non-blocking items 1, 5, 6, 7 and 8 are fixed here; items 2, 3 and 4 are decisions or reruns, not changes.

1. **Foe start gated by t3b (check item 1).** `recordStep` (`target-step-parity.ts`) returned `start` on formation index 0 for a foe-first record step (Talk 0x3105, Pull back 0x3107, Cancel order 0x3108) without asking `cursorStartFoe`, so with t3b OFF these three still started on the first foe in formation order. `start` is now set only while `targetStepParity('cursorStartFoe')` is true; with it off the step carries `candidates` and no `start`, and the HUD falls back to the engine's old aim hint exactly as for Attack, spells, items and the random-foe Overdrives. `parity-ffx-target-step.test.ts` pins both ways (the Natus Talk row, and `recordStep` for all three records: on is `{ candidates, start: 'seymour-natus' }`, off has no `start`, `selfStep` skipped is `undefined`). Legality, `validTargets`, rolls and logs do not move.
2. **Tightened assertions (check item 7).** `chapters/isaaru-duel` (Yuna alone) now requires exactly one Switch row and one Escape row, each `enabled: false` with no reason; `chapters/sinspawn-gui-rules` requires the first fight's Escape row to be present, disabled and reason-free, and the second fight's Switch row to be present and disabled for Yuna, Seymour and Auron.
3. **Guide wording (check item 8).** See section 7.
4. **This note (check items 5 and 6).** The `HMODE` command (section 6) and the `CommandMenu.ts` line count (section 5).
5. **Contract note.** `docs/CONTRACT-CHANGES.md` has a newest-first entry listing the shipped value of every item (ON: a b c d e, R, G, t1 t2 t3a t6a/t6b t7; OFF: f, H, t3b, t5) and the foe-start gating. The older entries that say "defaults OFF" stay as history.
6. **Not changed (check items 2 to 4).** f and H ship OFF as the driver's switch list says (how the decision page's "all of your recommendations" reads for them is the driver's to record); the full `npm test` is still owed before any push to main; the one-entry list walk is shown by the check's key-quota run, and the builder's own command does not reach one.

Proofs for this commit are in the commit's report: tsc clean, orphans 26; the target-step, shipped-switches, Isaaru, Gui and guide test files; the four goldens and the pin; and a 12-seed identity spot check of Chapters VII, VIII, XVII and 22 against `f30a8dfcb` (the overlay method, 48 plays): outcomes, links, turns, KOs, refusals, event counts, whole event logs, legality rows and HUD target modes equal in 48 of 48; the only difference is 5,024 rows in 2,667 of 5,921 decisions whose `targetStep.start` is gone, every one a Talk (310), Pull back (2,357) or Cancel order (2,357) row.
