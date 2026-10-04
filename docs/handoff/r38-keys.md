# r38-keys: the telegraph hold for Seymour Flux and Braska's Final Aeon, and the Overdrive key family alias (Lulu's Fury)

**Branch:** `r38-keys` (from `origin/main` `a6b79313`), pushed to `origin/r38-keys`; **not merged, not deployed**. Nothing is written under
`public/art`, `dist/`, `docs/target/*` or `NOW.md`. With no painting installed the game is today's game, exactly (proved below); the
three paintings are in the installer list at the end.

**Bailey's words** (2026-10-03 ~14:42 EDT, "I'll go with all your recommendations thank you <3", answering the Visual Options page):
ask 6 = **D-355** (wire the 950 ms telegraph hold for Seymour Flux and Braska's Final Aeon; Omnis acceptable, not now; Evrae's
painting rejected) and ask 8 = **D-357** (keep Lulu's Fury key; drop Wakka's Slots and Kimahri's Stone Breath).

**Game case (rule 14): FFX only.** Both bosses and both moves are FFX (`research/ffx-seymour-flux.md`, `research/ffx-bfa-yu-yevon.md`;
FFX-2 has neither). The alias families (`<spell>-fury`, 19 ids; `mix-*`, 43 ids) match no FFX-2 or FF7 ability id (the new test walks
all three registries). The one line in `BattlePresenterBeats.actionStart` is shared plumbing (so `critic-plan` says "games: both"),
but no FFX-2 or FF7 id reaches it: the table is keyed by combatant id and the module also refuses an FFX-2 framing and FF7's runner.

**critic-plan class** (`node tools/critic-plan.mjs --paths src/engine/TelegraphHold.ts,src/engine/KeySlots.ts,src/engine/BattlePresenterBeats.ts,tests/unit/engine/r38-telegraph-hold.test.ts,docs/handoff/r38-keys.md`):
**DEEP** (focused review of the production candidate before the deploy; live verification, then the deep review on the live build;
reason given: `BattlePresenterBeats.ts` "battle presenter and lifecycle is a shared system", plus 37 substantial checkpoints since
the last deep review). Not the save-data class. Paper preflight (rule 15): [docs/plans/r38-keys-review.md](../plans/r38-keys-review.md).

## What is built

| File | What |
|---|---|
| `src/engine/TelegraphHold.ts` (new) | The hold. A table of two rows (`seymour-flux`: `lance-of-atrophy`; `braskas-final-aeon`: `ultimate-jecht-shot`); `telegraphHold(ctx, event)` |
| `src/engine/BattlePresenterBeats.ts` (+2 lines) | `await telegraphHold(ctx, event)` in `actionStart`, right after `beginSpellAction`, before the move's own pose and shot |
| `src/engine/KeySlots.ts` (+23, -4 lines) | `odFamilyOf(abilityId)` and its use in `armOdKey` (the move's own `od-<id>` first, then `od-<family>`) |
| `tests/unit/engine/r38-telegraph-hold.test.ts` (new, 27 tests) | the table, no-change cases, the painted hold as a pure prefix, REDUCE MOTION, the game guards, the alias over all three ability registries, Lulu's key |
| `docs/plans/r38-keys-review.md`, this note, `docs/screenshots/r38-keys/` | preflight, handoff, eight contact sheets (today against this branch) |

**The hold.** At the `action-start` of Seymour Flux's Lance of Atrophy (Chapter I) or Braska's Final Aeon's Ultimate Jecht Shot
(Chapter III, form 2's Overdrive), and only with BATTLE SPECTACLE on and the boss's **own** `telegraph` painting installed, the boss
puts that painting up through the r37 slot (`KeySlots.telegraphUp`, a 140 ms crossfade), the amber glow and the slow zoom with the red
heartbeat vignette of the `charge` beat play under it, and the presenter waits `ctx.sleep(950)`; then the zoom and heartbeat close
(`telegraphEnd`) and the move goes on exactly as before (its own pose, shot, strike). The painting is replaced by the move's own pose
at the strike and the boss returns to idle at `action-end`. Flux and Braska never emit a `charge` event, which is why the r37 slot could
not show their paintings. Nothing else holds: no other move of those bosses, no other boss (Omnis is not in the table, Evrae's painting
is rejected). It reads ports only (`ctx.stage.paints`, `fx.enabled`, `sideOf`, `moments`): no `three`, no DOM, no engine state, no RNG,
no new setting key.

**The wait scales like every beat** (`ctx.sleep` = authored ms x playback speed x the pacing option, `pace.ts`): **950 ms at `?pace=current`,
1.14 s at the default FFX pacing `steady` (x1.2, what a player gets), 1.33 s at `relaxed`, 0.37 s at `fast`, none at `skip`.**

**The family alias.** `odFamilyOf` returns the family names a move's key painting may also be filed under; `armOdKey` tries `od-<abilityId>`
first, then `od-<family>`, on the acting figure only.
- `fury` (**Lulu's Fury**, `od-fury.png`): `bio-fury, blizzaga-fury, blizzara-fury, blizzard-fury, death-fury, demi-fury, drain-fury, fira-fury,
  firaga-fury, fire-fury, flare-fury, osmose-fury, thundaga-fury, thundara-fury, thunder-fury, ultima-fury, water-fury, watera-fury, waterga-fury` (19).
- `mix` (**Rikku's Mix**, `od-mix.png`, undecided by D-357 and not touched by it): the 43 `mix-*` ids (`mix-abaddon-flame` ... `mix-vitality`,
  `src/data/ffx/mixes/abilities-*.ts`).
- **Left out on purpose:** the prototype's `element-reels` (Wakka's four shot ids; D-357 drops Wakka's key) and `x2-black-mage-cast` (FFX-2:
  not this branch's game case). **Already resolve by their own id since r37, no alias needed:** Tidus's `spiral-cut`, `slice-and-dice`,
  `energy-rain`, `blitz-ace`; Auron's `dragon-fang`, `shooting-star`, `banishing-blade`, `tornado`; Yuna's `grand-summon`; each of
  Kimahri's twelve Ronso Rage ids (`jump`, `fire-breath`, `stone-breath`, ..., `nova`) by its own name. A single `od-ronso-rage` painting for
  all twelve would need an explicit id set (not a pattern): not built, nothing asks for it.

## Decisions the brief left to me

1. **REDUCE MOTION: the same pause, shown as a single cut, with none of the motion layers.** The painting goes up with the slot's `immediate`
   swap (no crossfade), the boss's glow, the zoom and the heartbeat vignette are not played, and the wait is the same 950 ms. Why the pause
   stays: the project's own rule (`ComfortCamera.ts`: "no moment waits a different time and no FFX-2 Active fight changes pace"; `pace.ts`:
   "REDUCE MOTION never shortens these", Bailey's D-220 Q2 option (a), 2026-09-26) is that the setting removes movement, never time; a
   shorter wait would make the same fight run to a different rhythm for a player with the setting on, and would take away the one beat
   that tells that player the blow is coming (the painting does not move, so the pause is the warning, not a motion). Proof below: the
   REDUCE MOTION runs hold 1,146 to 1,150 ms against 1,132 to 1,165 ms without it, the played `action-start` is the same (1,415 to 1,416 ms
   against 1,408 to 1,422 ms), so is the `action-end` (241 to 252 ms against 241 to 251), the first frame of the painting has crossfade 1
   (a cut) and the vignette is never on.
2. **The glow, zoom and heartbeat are the preview's look, but they close with the hold, not with the move** (a fix found by measuring; it
   changes what the preview showed in one respect). The preview left the `charge` beat's zoom and vignette open until the move ended, and
   `BattleMoments.actionClose` then **awaits their camera release** (620 ms x the pacing = 0.74 s at the default). So in the real game the
   hold cost about **1.9 s per headline move, not 1.14 s**: the move's `action-end` played 991 ms against today's 249 ms; whole Chapter I
   fights ran +3.5, +4.2, +5.6 and +7.6 s longer (seeds 10, 20, 18, 15; 2, 2, 3, 4 holds) where the hold alone is +2.3, +2.3, +3.4, +4.6 s;
   and REDUCE MOTION, which never opens the zoom, ran 0.74 s faster per move than normal, so the rhythm differed between the settings (old
   runs kept in `runs/prefix-old-code/`). The hold now ends the zoom and heartbeat when it ends (`void ctx.moments.telegraphEnd()`), so the
   added time is the hold alone and the same in both motion modes. What the player sees differs only after the hold: the red
   heartbeat no longer tints the strike and its numerals (it closes as the strike begins). Restoring the preview's look is deleting that
   one line, and costs the 0.74 s.
3. **No sound** is added (rule 13, agents cannot hear): the `charge` beat's `charge` cue is not played in the hold. Bailey's ear decides.
4. **`skip` playback holds nothing**; `fast` scales it (0.37 s).

## Proof

All real, headless GPU Chromium (`PYREFLY_BROWSER=gpu`), one browser at a time, Playwright from node; never Claude-in-Chrome or the built-in
pane. Rig (scratch, `D:/Tools/pyrefly-scratch/2026-10-03/r38-keys/`): this worktree on a Vite dev server (port 6820) and a `git archive` copy
of `origin/main` `a6b79313` (`main-copy/`, port 6821) side by side, each behind a dev-only art overlay (`tools/preview-art-plugin.mjs`, not
in the repo) that serves the three candidate paintings from `art-root/` (sha256 equal to the install-ready manifest) over `public/art`; overlay
off = today's installed art. `public/art` was never written. Clips (8 s WebM, 1600x900, 2 s before the move, a magenta calibration marker
before and after locates video time): `runs/<name>/<name>.webm`; stills and every number: `runs/<name>/result.json`.

### 1. The holds, in the real game (Chapter I seed 1; Chapter III seed 1, form 2 reached through the debug state)

Played length of the move's `action-start` and `action-end` (presenter trace) and the pose list read per frame, in ms. Both builds have
the paintings installed through the overlay, so "today" is a game that has the art and never shows it for these two bosses:

| Run | main + paintings installed (today) | r38-keys + paintings (the hold) |
|---|---|---|
| **Flux, Lance of Atrophy**, default pacing | `attack@0 > idle`; action-start **271**; action-end 249; move 1,335 | `telegraph@0 > attack@1,132 > idle`; hold **1,132**; action-start **1,418**; action-end **241**; move 2,371; crossfade 0.02 (fading in); vignette on 0 to 1,000, off by 1,250 |
| Flux, `?pace=current` | action-start 224; action-end 206 | hold **949**; action-start 1,183 (+959); action-end 203 |
| Flux, `fast` playback | | hold 365; action-start 454; action-end 78 |
| Flux, REDUCE MOTION | | `telegraph@0 (cut) > attack@1,150`; crossfade **1**; vignette **never on**; action-start 1,416; action-end 242 |
| Flux, 390x844 phone (touch) | action-start 266; action-end 245 | hold 1,135; action-start 1,409; action-end 249 |
| Flux, **real keys** (Enter, Enter at each open menu, 2 menus) | | hold 1,151; action-start 1,409; action-end 244; with REDUCE MOTION 1,147 / 1,415 / 252, a cut, no vignette |
| **BFA, Ultimate Jecht Shot**, default pacing | `attack@0 > idle`; action-start **273**; action-end 249; move 1,639 | `telegraph@0 > attack@1,165 > idle`; hold **1,165**; action-start **1,422**; action-end **242**; move 2,792; vignette on 0 to 1,000 |
| BFA, `?pace=current` | | hold **944**; action-start 1,177; action-end 204 |
| BFA, REDUCE MOTION | | `telegraph@0 (cut)`; hold 1,146; crossfade 1; no vignette; action-start 1,416; action-end 241 |
| BFA, 390x844 phone | action-start 268; action-end 251 | hold 1,146; action-start 1,408; action-end 251 |

The hold adds **about 1.14 s at the default pacing** (+1,147 ms to the played `action-start` on Flux, +1,149 ms on Braska's; 950 x 1.2 = 1,140)
and 0.95 s at `?pace=current` (+959 ms), and **nothing after the strike** (`action-end` is today's 241 to 252 ms in every variant; before the
fix in decision 2 it was 991). 0 errors in the console and 0 missing resources in every run. The Lance's mid-battle callout ("Let it in.")
still plays after the strike. Stills: `docs/screenshots/r38-keys/flux-hold-vs-today.jpg`, `bfa-hold-vs-today.jpg` (top row today, bottom row the
hold, the same offsets from the move's start), `flux-phone-vs-today.jpg`, `bfa-phone-vs-today.jpg`, `flux-reduce-motion-vs-normal.jpg`,
`bfa-reduce-motion-vs-normal.jpg`. BFA's form 2 was reached the way the preview did it: the live debug state sets form 1 to 1 HP, then form 2 to
45 percent HP and `bfa.gauge` to 100, so the engine's own next turn is the Ultimate Jecht Shot; the `action-start` the presenter plays is the
engine's.

### 2. Fight length

**Exact, virtual time, seeds 1 to 20, both chapters.** The real FFX engine under the shipped `intended` autopilot, played through the real
`BattlePresenter` against fake ports with every presenter wait added to a virtual clock instead of slept; the same file run in the
`origin/main` copy and in this worktree, four configurations each (paintings or none, default pacing or `?pace=current`). The clock holds the
presenter's own waits, not actor tweens or the HUD's waits, so real fights are longer; what is exact is the difference between the builds on
the same seed (`harness/zz-tmp-r38-fightlen.test.ts`, `harness/analyze-fightlen.mjs`, `out/fightlen-*.json`):

| | Chapter I, Seymour Flux (20 fights, 10 won) | Chapter III, Braska's Final Aeon through Yu Yevon, 7 links (20 fights, all won) |
|---|---|---|
| Headline moves held | 86 (4.30 a fight, 2 to 7) | 47 (2.35 a fight, 0 to 5; seeds 11 and 20 have none and change by 0.0 s) |
| Added per hold | 1,140 ms at the default pacing, 950 ms at `?pace=current` (every hold, every seed) | the same |
| Median fight, today to with the hold | 293.1 s to 298.2 s (244.3 s to 248.5 s at `?pace=current`) | 1,069.0 s to 1,070.7 s (890.8 s to 892.2 s); Braska's link alone 528.3 s to 530.6 s |
| Mean added per fight | +4.9 s (+4.1 s) | +2.7 s (+2.2 s) |

So the hold is **+1.7 percent on a Chapter I fight and +0.2 percent on the whole Chapter III chain** at the default pacing. With no painting,
or with the paintings on main (which never shows them), the clock and the log are identical to today's in all 40 fights.

**Real game, whole fights** (headless GPU, the shipped autopilot, no debug-state edits, both builds with the paintings installed through the
overlay; wall time from the first autopilot command to the presenter finishing the last event; the same build and seed run twice differs by
0.1 to 0.4 s: seeds 10, 20, 18 gave 40.3 / 40.4, 34.0 / 34.4, 46.9 / 47.0 s):

| Run | main | r38-keys | added | the hold alone predicts | played `action-start`, per hold |
|---|---|---|---|---|---|
| Chapter I seed 10 (defeat, 11 turns, 2 Lances), normal | 40.3 s | 42.6 s | +2.3 s | +2.3 s | +1,154 ms |
| seed 20 (defeat, 8 turns, 2 Lances) | 34.0 s | 36.7 s | +2.7 s | +2.3 s | +1,150 ms |
| seed 18 (defeat, 14 turns, 3 Lances) | 46.9 s | 50.3 s | +3.4 s | +3.4 s | +1,147 ms |
| seed 15 (defeat, 15 turns, 4 Lances) | 48.4 s | 53.0 s | +4.6 s | +4.6 s | +1,150 ms |
| seed 4 (victory, 72 turns, 2 Lances), `fast` | 124.0 s | 125.5 s | +1.5 s | +0.7 s | +376 ms |
| seed 5 (victory, 76 turns, 2 Lances), `fast` | 127.2 s | 128.0 s | +0.8 s | +0.7 s | +382 ms |
| Chapter III link 1 (Braska's Final Aeon) seed 7 (victory, 270 turns, 5 Ultimate Jecht Shots), `fast` | 268.6 s | 268.4 s | -0.2 s | +1.8 s | +376 ms (91 to 102 on main, 468 to 475 here) |
| seed 11 (victory, 217 turns, no Ultimate Jecht Shot, the control), `fast` | 222.8 s | 222.4 s | -0.3 s | 0 | none |

At `fast` playback a 220 to 270 s fight's wall time moves by a second or two from run to run, more than the 0.7 to 1.8 s that two to five
holds add, so the played length of each headline `action-start` is the clean number; the normal-speed Chapter I rows (the same build twice
differs by 0.1 to 0.4 s) match the prediction to 0.1 s on three of four.

Before the fix in decision 2 the same four normal-speed fights ran +3.5, +4.2, +5.6 and +7.6 s longer (1.9 s a hold; `runs/prefix-old-code/`).

### 3. Autopilot battle-log digests: identical

SHA-256 of the whole engine event log of each fight, compared across builds: **identical in all 40 virtual-time fights in all four
configurations (both paces), and in every real-game pair above** (the digest is also what two runs of the same build give). The hold
reads ports only, so this is by construction; the runs show nothing in the presenter feeds back into the engine.


### 4. No painting installed: no change (pixel and timing against origin/main)

- **Code:** with no `telegraph` painting, with BATTLE SPECTACLE off, at `skip` speed, in FFX-2 framing or FF7's runner, `telegraphHold`
  returns before anything is set. The new tests compare the full ordered list of pose swaps, glows, moments and waits with and without the
  painting and require the painted run to be exactly that list with the hold in front of it (for Flux and Braska, normal motion and REDUCE
  MOTION); an off-table move of the same boss, and the same move by another boss, play identically with the painting present.
- **Timing and poses (browser, overlay off = today's art, seed 1, default pacing; main 2 to 4 runs, r38-keys 2 to 3 runs per move):** the pose
  lists are identical (`attack@0 > idle` for Flux's Lance; `attack@0 > idle > hurt > idle` for Braska's Ultimate Jecht Shot; `ready > attack >
  follow > idle` for Lulu's Fire Fury, today's keys) and so are the played lengths:

  | Move | played `action-start` main / r38-keys | played `action-end` main / r38-keys | whole move main / r38-keys |
  |---|---|---|---|
  | Flux, Lance | 267, 276, 271, 267 / 266, 277, 276 | 252, 260, 244, 241 / 249, 242, 250 | 1,236 to 1,269 / 1,237 to 1,277 |
  | Braska's, Ultimate Jecht Shot | 268, 268 / 267, 267 | 244, 249 / 244, 247 | 1,623, 1,622 / 1,623, 1,641 |
  | Lulu, Fire Fury | 3,425, 3,409 / 3,425, 3,426 | 1,509, 1,510 / 1,521, 1,507 | 4,512, 4,494 / 4,512, 4,501 |

- **Pixels:** the page animates in real time (grain, particles, idle breathing), so two runs of the **same** build already differ (the r37
  check measured the same). At 11 offsets from the Lance's start (+0 to +4,200 ms), the mean absolute difference of grey pixels (of 255)
  between two main runs (6 pairs) is 4.5 to 9.7, between a main run and an r38-keys run (12 pairs) 4.9 to 9.6, between two r38-keys runs
  (3 pairs) 4.0 to 7.7; **10 of 11 offsets are inside the main-against-main band**, and at the one that is not (+4,200 ms, where the
  mid-battle callout's dialogue box is sliding in on a different frame each run) the mean is 5.6 against the band's top of 5.2. Averaged over
  the 11 offsets: 6.7 (main-main), 6.4 (main-r38), 5.5 (r38-r38) (`out/pixcmp-flux.json`). A frame-exact comparison is not available on a page
  with free-running clocks; the unit tests and the pose and timing lists are the exact part.

### 5. Lulu's Fury key and the alias (Chapter IX, `yojimbo-cavern`, seed 1; the party's HP and gauges kept topped up and Lulu handed Fire Fury with a stated minigame result, the preview's `scen-ffx` method)

| | main + `od-fury` painting in the overlay | r38-keys + the same painting |
|---|---|---|
| Lulu's poses | `ready@0 > attack@3,441 > follow@4,114 > idle@4,476`: **the key never shows** (the engine's id is `fire-fury`, no file of that name) | **`od-fury@0 > idle@4,495`**: the key painting from the action's opening, through the held shot and the strike |
| played `action-start` (letterbox, slab, push-in) | 3,404 ms | 3,417 ms (no wait added) |
| REDUCE MOTION | `attack@0 > idle@3,074`; 2,572 ms | `od-fury@0 (cut) > idle@3,078`; 2,565 ms |
| 390x844 phone | | `od-fury@0 > idle@4,479`; 3,404 ms |

Stills: `lulu-fury-vs-today.jpg`, `lulu-reduce-motion-vs-normal.jpg`. The unit tests give the same for four Furies
(Fire, Firaga, Ultima, Demi), the precedence of a move's own file over the family's, and that another figure never borrows Lulu's file.

## What the installer must install

All six files are NEW (nothing at those paths today; the three folders exist). Source: the install-ready package
`D:/Tools/pyrefly-art-backup/candidates/2026-10-03-overnight/install-ready/{4b-telegraph-needs-wiring,2-apex-ffx}/art/` (its `manifest.json`),
also staged byte-identically in `D:/Tools/pyrefly-scratch/2026-10-03/r38-keys/art-root/`. Targets under `D:/Final Fantasy/public/art/`:

| Target | bytes | sha256 | What |
|---|---|---|---|
| `characters/seymour-flux-body/telegraph.png` | 770,866 | `348136a4e0944b2b5f0fd2c00ed7e0f464a701db4eb27ff44ae53aef2d05a964` | Flux's Lance of Atrophy telegraph (cand-8, `tele-seymour-flux-body`) |
| `characters/seymour-flux-body/telegraph.json` | 289 | `a671ed2cbb1ff167358a5ad9791ddbe896852cc300f8a54ef59c33107887eee4` | sidecar (992 x 1066, baselineY 1050, facing left) |
| `characters/braskas-final-aeon-2/telegraph.png` | 743,314 | `f22e274945056bb7e3e20cc66ff79650b8ee56005f05d72986a702a354679246` | Braska's Final Aeon form 2, Ultimate Jecht Shot telegraph (cand-5, `tele-bfa-2`) |
| `characters/braskas-final-aeon-2/telegraph.json` | 276 | `e11ac741070e3be10f69c8ef4160b5570ff547cd7554eca699dee85fc3f44a2e` | sidecar (1123 x 799, baselineY 783, facing left) |
| `characters/lulu/od-fury.png` | 390,906 | `e13caa64aaa5060894691382f1ff02e63e098a7151cfcb8fbf4cc35e8f743e7a` | Lulu's Fury key, one file for all 19 Furies (cand-8, `lulu-fury/fury`) |
| `characters/lulu/od-fury.json` | 315 | `31cfcff20b8e74a93a177658b1be09bf7c6c0cce6b4deebaf49aac540261879c` | sidecar (580 x 933, baselineY 917, **scale 1.3**, facing right) |

Total **1,905,966 bytes**. Then, as `D:/Tools/pyrefly-art-backup/approved/2026-10-02-art/install.mjs` does: copy, `node tools/gen/manifest.mjs` (lists `telegraph` for both
bosses and `od-fury` for Lulu; the game asks for nothing the manifest does not list), lock the six hashes in `docs/target/approved-hashes.json`.

- **The paintings do nothing without this branch, and this branch does nothing without the paintings:** install them with (or after) the
  merge, not before. Without the merge a telegraph painting never shows for Flux or Braska; without the alias `od-fury` never matches.
- **Size.** Release 37.1's build is 798,330,509 bytes, so 1,905,966 more is **236,475 bytes over the strict 800,000,000 line** on main
  today. They fit after `r38-bytes` lands (137.7 MB of headroom there), or at once if the line is read as 800 MiB (D-332).
- **The sidecars say** `"status": "PREVIEW CANDIDATE (preview-picks, not approved, not installed)"` and name their `candidateOf` path (and Lulu's
  `abilityIds`). The engine reads only `width`, `height`, `baselineY`, `scale` and `facing`, so they are inert, but the status text is wrong
  once Bailey has approved (D-355, D-357): rewrite it before hashing, not after.

## Disclosures and questions for Bailey

- **1.14 s, not 0.95 s, at the default pacing.** The brief and the page say 950 ms; that is the authored time. Every presenter wait is scaled
  by the pacing option, FFX's default `steady` is x1.2, so a player waits about 1.14 s (0.95 s only with `?pace=current`). One constant
  (`TELEGRAPH_HOLD_MS`) sets it if he wants 0.95 s as played (792 authored).
- **Every Lance and every Ultimate Jecht Shot holds**, 4.3 and 2.35 times a fight on the autopilot (2 to 7 and 0 to 5): fine as a warning,
  but a fifth Lance is the same pause. "First use only" is possible and is not built (it needs a per-fight counter).
- **The red heartbeat ends when the hold ends** (decision 2): the preview's look through the strike is one deleted line and costs 0.74 s a move.
  **No cue** (decision 3).
- **Rig note:** the preview dev server runs with file watching off, so Vite serves a module as it first loaded it; after editing a source
  file restart the server (one of my first re-recordings ran on stale code that way; those runs are kept in `runs/prefix-old-code/` as the
  before of decision 2).
- The title screen's canned demo reel (`BattleScreenDemoReel.ts`, used only when no engine is wired) also plays a Lance through the same
  presenter; it is not a path a player reaches today.
- Not touched: Omnis (Bailey: maybe after), Evrae (rejected), Yunalesca, Natus, the FFX-2 bosses, the FFX-2 menu rule, `KoPoseScale.ts`
  (the preview's FFX-2 re-roll entry is not part of this branch), and every other held key (Wakka, Kimahri, Spiral Cut, Auron).
- `docs/target/decisions.json`: D-355 and D-357 stay `in-progress` / `not-scheduled` until the merge and the install; I did not touch the
  registry (the integrator's).

## Files

`src/engine/TelegraphHold.ts` (new), `src/engine/KeySlots.ts`, `src/engine/BattlePresenterBeats.ts`, `tests/unit/engine/r38-telegraph-hold.test.ts`
(new), `docs/plans/r38-keys-review.md`, `docs/handoff/r38-keys.md`, `docs/screenshots/r38-keys/*.jpg`. No shared contract in `docs/CONTRACTS.md` is
touched, so no `CONTRACT-CHANGES` entry. Scratch (not in the repo): `D:/Tools/pyrefly-scratch/2026-10-03/r38-keys/` (`tools/` the rig and
scripts, `harness/` the virtual-time harness and its analysis, `runs/` every run, `out/` the numbers, `main-copy/` the origin/main copy with
five junctions: `node_modules` and `public/art|audio|fonts|fx` (`cmd /c rmdir` each before any removal)); the two temporary vitest files are
parked in `F:/pyrefly-parked/2026-10-03/r38-keys/`.
