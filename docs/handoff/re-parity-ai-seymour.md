# Re-parity, boss AI: Seymour (Chapters I, VII, X and XII) follows the game's own scripts

Status: **built and committed on branch `re-parity-ai-ffx`, not merged, not pushed, not deployed** (2026-10-09). Lane AI-SEYMOUR of
[the re-parity plan](../plans/re-parity.md) ([boss-AI preflight](../plans/re-parity-ai-review.md)); the source is the research note
[`research/re-ffx-ai-seymour.md`](../../research/re-ffx-ai-seymour.md), section 6, rows D-01 to D-33. Owner: Bailey.
**Game case: FFX only** (AGENTS.md rule 14). `ffx2-atb-golden` and `ff7-golden` do not import anything this lane touched and are unchanged.

Bailey, 2026-10-08: "It needs to be a 1:1 parity." and "Full speed ahead you don't need to conserve".

This note is the table of what changed, the proofs, the measurement and the ablation, and the list of everything that is now stale
and waits on Bailey. Nothing on a boss or a party was tuned (hard rule 6 and the lane brief); every number below is measured, not chosen.

Commits (all on `re-parity-ai-ffx`; nothing pushed; the first sits on `a563e1d8`):

| Commit | What |
|---|---|
| `053a9a50` | The engine's boss-script hooks, the reaction queue, the script's rolls, aimed rows, cover, slot pairs, the mount revive |
| `52556d96` | Chapter I: Seymour Flux and the Mortiorchis (D-01 to D-08) |
| `4c90cfc4` | Chapter VII: Seymour, the Guado Guardians and Anima (D-09 to D-18) |
| `52f627e1` | Chapter X: Seymour Natus and Mortibody (D-19 to D-23) |
| `70e1d88e` | Chapter XII: Seymour Omnis and the Mortiphasm discs (D-24 to D-33) |
| `1a8e0e1d` | The eight re-baselined goldens and the measurement harness |
| `9e0eac98` | Eight tests re-pinned with the game-script reason (found by the whole-suite run; no rule changed) |
| `1c4f5d5c` | The `onHit` report carries `lastDamage` and `affectsHp` (the AI lane B hit event's definitions) and the hit-event contract is pinned, so the two lanes' hooks are interchangeable at the merge |
| (the last commit) | This note (`docs/handoff/re-parity-ai-seymour.md`), `parity-ffx-ai-intent.test.ts` (asking the intent panel does not move a fight) and the golden comment's count of moved outcomes (five, not four) |

## What the engine does now

The four fights follow their compiled scripts (`m142`/`m143` Flux and the Mortiorchis, `m124`/`m141`/`m125` Seymour, the Guado Guardians
and Anima, `m126`/`m127` Natus and Mortibody, `m131`/`m106` Omnis and the Mortiphasm discs, with each formation's start and turn-start
hooks) as the note reads them. The pieces they share are new engine plumbing, **FFX only**, inert for every combatant whose script
registers nothing:

| Piece | Where | What it is |
|---|---|---|
| Boss-script hooks | `src/battle/ffx/ai/hooks.ts` | `registerScriptHooks(scriptId, { onTargeted, onHit, postPoison, preTurn, holdsDeath })`, `registerFormationPreTurn` (the formation's handlers for every actor). `onTargeted` runs for each target of a command before any damage (`abilities.ts#resolveAbility`); `onHit` **once per action per target, after the last of that action's hit records on the target and before the death check**, for a hit, a miss, a heal and a status-only move alike (`hit-apply.ts` keeps the touched map, `abilities.ts#finishTouched` runs it); `postPoison` right after the monster's own poison tick (`ticks.ts#onTurnEnd`); `preTurn` at every actor's turn start (`ticks.ts#onTurnStart`) |
| A script that decides whether it dies | `hp.ts#dealDamage`, `settleDeferredDeath` | `holdsDeath: true` leaves a lethal hit's KO pending until the script's `onHit` has run; a hook that puts HP back (the Mortiorchis, Mortibody, Macalania's Seymour) stops the death, and a body still at 0 afterwards dies then. The old per-hit damage cap and HP floor (`damageCapPerHit`, `hpFloor`) are gone with the one fight that used them |
| Reactions | `ai/hooks.ts`, `ai/reaction-drain.ts` | A command a hook queues (`queueReaction`, `forced` = `forcePerformCommand`, else the owner must be able to act: `canQueueCommand`) runs after the triggering action, first in first out, costs its owner no CTB and runs the hooks of whoever it hits. Kinds: `command`, `drain` (Mortibsorption), `emit` (a story line that must land after the action's events) |
| Script rolls | `ai/script-random.ts` | `GetRandomValue()` is one engine draw `int(0, 0xFFFF)` then the script's own `mod`/compare (`scriptMod`, `scriptCoin`: `mod 100 > 50` is true for 32,095 of 65,536 values, 48.97 %); the picker (`findMatchingChr`) is one 31-bit draw `mod` the number of alive, targetable candidates in ascending actor number (party 0 to 6, aeons from 8, monsters from 20 in formation order), **no draw below two candidates**, and a call whose result is thrown away still draws (`drawPicker`) |
| Aimed rows | `abilities.ts`, `targeting.ts#aimedTargetForHit`, `AbilityDef.extra.scriptAims` | A row the script aims (Seymour's, Natus's and the Guardians' spells, Anima's Pain) goes where the command names, hit `h` to the `h`-th target; a fallen or hidden target is refused the way the exe's queue refuses it, so that hit is lost |
| Cover | `targeting.ts#coverOf`, `ActorRuntime.guardMark` | Single-target physical blows aimed at an enemy go to an ally holding the Guard status that can act, the one with most HP; Seymour's script is what puts the Guard on a Guardian. No other enemy sets the mark |
| Pairs of party slots | `ai/slot-pair.ts` | The two commands of a double cast: Macalania's Seymour in act three and Natus's Multi-ra (below, including a slip in Natus's branch) |
| Mount revive | `ai/mount-revive.ts` | One rule for the Mortiorchis and Mortibody (D-06) |
| Omnis | `ai/omnis-affinity.ts`, `ai/seymour-omnis*.ts` | The affinity routine and the 35-row cast order (checked against the interpreter's table for all 256 layouts), the disc ring, the sequence, the counter |

## Rows D-01 to D-33

Each row is built as the note's section 6 says unless the last column says otherwise. "Test" names the describe in the parity tests
(`tests/unit/parity-ffx-ai-{hooks,flux,macalania,macalania-acts,natus,natus-hooks,omnis,omnis-discs,intent}.test.ts`).

| Row | Fight | Now | Where | Test |
|---|---|---|---|---|
| D-01 | Flux | One shared cycle state `s` (1 to 6); an actor whose turn comes on the other parity wastes it and leaves `s` alone; nothing remembers who acted last | `ai/seymour-flux.ts`, `seymour-flux-rules.ts` | flux: turn tables, "the cycle is driven by the shared state" |
| D-02 | Flux | Flux Banishes on his next turn whenever an aeon is out, whatever it has done, and the mount passes in both phases | `ai/seymour-flux.ts` | flux: "an aeon in the battle" |
| D-03 | Flux | Phase 2 is a four-step cycle (Flare, the mount's "ready" notice, Flux's Reflect or nothing, Total Annihilation); the first notice belongs to the phase change | `seymour-flux-rules.ts#fluxOnCommand150`, `seymour-flux-hooks.ts` | flux: "the second cycle", "the telegraph clears" |
| D-04 | Flux | The Protect and Reflect lines (52,500 and 35,000, strictly below) are one shot each: the line is zeroed when it fires | `seymour-flux-hooks.ts` | flux: "Flux's onHit" |
| D-05 | Flux | The Slowga answer only for Delay Attack or Delay Buster on the Mortiorchis | `seymour-flux-hooks.ts` | flux: "Delay Attack ..." |
| D-06 | Flux, Natus | The mount is restored to the revive value before it decays: 4,000, 3,000, 2,000, 1,000, 1,000, and the drain equals that value | `ai/mount-revive.ts` | flux and natus-hooks: the revive tests |
| D-07 | Flux | An enemy-side attacker (his own Flare, a reflected spell, the drain) runs his `onHit` | `seymour-flux-hooks.ts` | flux: "an enemy-side attacker" |
| D-08 | Flux | After its turn the mount copies Flux's CTB counter (not while an aeon is out) | `ai/seymour-flux.ts` | flux: "copies Flux's CTB counter" |
| D-09 | Macalania | The start hook: every monster's counter 0, Seymour's 1, each party member +2; the Guardians' Protect and his Shell are real first turns, no status is applied at setup | `ai/macalania-rules.ts#applyMacalaniaSetup`, `macalania-guardian.ts`, `macalania-seymour.ts` | macalania: "the opening" |
| D-10 | Macalania | The Guardian's rows: Remedy for Poison or Silence, the two ally rows (the second goes to Seymour), the 48.97 % do-nothing turn, the spell chosen in that half never cast | `ai/macalania-guardian.ts` | macalania: "the Guardian's turn" |
| D-11 | Macalania | Cover by the Guard mark (coin, a sleeper skipped, cleared when that Guardian is hit); only single-target physical commands | `ai/macalania-seymour.ts`, `targeting.ts#coverOf` | macalania-acts: "the Guard and the cover" |
| D-12 | Macalania | Auto-Potion not if the Guardian was asleep when targeted, not for a heal or a zero change, never after a steal; a stolen-from Guardian's steal chance is 0 | `ai/macalania-guardian.ts` | macalania: "Auto-Potion" |
| D-13 | Macalania | Act three: two commands at two different party slots (the same member twice only with one left) | `ai/slot-pair.ts`, `macalania-seymour.ts` | macalania: "act three" |
| D-14 | Macalania | Anima's gauge: +5 on each Pain and +5 per action that reaches her; nothing for her turns or a Boost; Oblivion at 100 takes its place in the cycle | `ai/macalania-anima.ts` | macalania-acts: "Anima" |
| D-15 | Macalania | Anima arrives with counter 0 and each active party counter +1; her first turn carries the Summon Anima marker | `ai/macalania-acts.ts`, `forms.ts#revealEnemy` | macalania-acts: "Anima arrives" |
| D-16 | Macalania | No turns for Seymour during act two (the zero-hit "Wait" ability is deleted) | `ai/macalania-seymour.ts` | macalania: "he does nothing while Anima is out" |
| D-17 | Macalania | No cap and no floor: a lethal blow before the summon lands whole, HP 0 summons Anima, and he is put back on 6,000 in the same hook | `ai/macalania-seymour.ts`, `macalania-acts.ts`, `hp.ts` | macalania-acts: "the summon" |
| D-18 | Macalania | Talk switched by "present without Death, Petrify, Sleep, Silence" for Tidus and Yuna; Wakka's is not gated by himself | `ai/macalania-talk.ts` | macalania-acts: "Talk" |
| D-19 | Natus | **Natus** advances the element index after each of his casts; Mortibody only reads it | `ai/seymour-natus.ts` | natus: "The element index belongs to Natus" |
| D-20 | Natus | The phase is recomputed from his HP at every hit and can go back; the third-phase line moves from 12,000 to 18,000 once reached | `ai/seymour-natus.ts#onNatusHit` | natus-hooks: "recomputed from his HP" |
| D-21 | Natus | The Desperado ladder: each active slot scores one for Shell, Haste, Reflect and the four Nuls against `mod 4 + 4` (one less in his last phase, 0 with Haste on all three); the draw is spent every turn | `ai/seymour-natus.ts`, `seymour-natus-rules.ts#desperadoScore` | natus: "the Desperado test" |
| D-22 | Natus | Banish at once for any aeon; Mortibody does nothing (and spends no draw) while one is out | `ai/seymour-natus.ts` | natus: "an aeon in the battle" |
| D-23 | Natus | His one Protect only when he holds none at that moment, and the flag is set only then | `ai/seymour-natus.ts#onNatusHit` | natus-hooks: "Protect" |
| D-24 | Omnis | The reset order is Ice, Water, Thunder, Fire (the counter starts at 0 and moves first) | `ai/seymour-omnis-rules.ts#resetDiscs` | omnis-discs: "the colours of the reset" |
| D-25 | Omnis | The ring is Fire -> Ice -> Water -> Thunder -> Fire, a spell is +1 and a blow -1 | `ai/seymour-omnis-rules.ts#turnDisc` | omnis-discs: "what turns a disc" |
| D-26 | Omnis | Always four spells in the order the layout fixes (35 rows); three or four of a kind aim the first three at Character 1, 2, 3 (a slot at 0 HP gets a random living member) and the fourth at a random living member, every other layout all four at random living members | `ai/omnis-affinity.ts`, `seymour-omnis.ts#planOmnisVolley` | omnis: "his four spells" |
| D-27 | Omnis | The reset turn is only the reset: no spell | `ai/seymour-omnis.ts` | omnis-discs: "his three-turn sequence" |
| D-28 | Omnis | Hits during the glow, Dispel, Ultima and reset turn are ignored; the low threshold (2) latches | `ai/seymour-omnis-rules.ts#recordOmnisHit` | omnis-discs: "his onHit" |
| D-29 | Omnis | One event per action that reaches him, a miss, a heal and a status-only move included | `ai/hooks.ts` (the `onHit` contract) | omnis-discs: "one event per action" |
| D-30 | Omnis | His affinity is refreshed at every actor's turn start (his own copy only in the normal state), not the instant a disc turns | `ai/seymour-omnis.ts` (formation pre-turn), `hooks.ts#runPreTurn` | omnis-discs: "when his affinity changes" |
| D-31 | Omnis | The Water-pair slip only when the Water pair is the first pair the chain meets (TTWW, FIWW, FTWW, ITWW) | `ai/omnis-affinity.ts#omnisAffinities` | omnis: the 256 layouts |
| D-32 | Omnis | The damage type alone decides what turns a disc (magical +1, physical -1; an all-target spell, a typed item and a multi-hit blow all turn it). **Kept (C):** which commands the engine lets reach a disc is the existing melee-reach rule (`targeting.ts#reachesTarget`, ffx-seymour-omnis section 2, verified: 4 sources): only Wakka, Valefor, Anima and Mindy reach a disc with a blow | `ai/seymour-omnis.ts#onDiscHit` | omnis-discs: "what turns a disc" |
| D-33 | Omnis | With an aeon out all four spells land on it, in every layout | `seymour-omnis.ts#planOmnisVolley` | omnis: "an aeon on the field" |

Not built, as the note says (rows C or not decoded): the purpose of Natus's fractional-damage flag (`m126` onTargeted/onHit); the caption
scenes beyond the state they write; the reset turn's CTB (W2, the shared CTB lane).

### A finding of this lane: Natus loses half a Multi-ra when the third slot is down

The note's table says Natus's pair goes "to the two living slots" with two standing. Read in his compiled branch (`m126` @0x29c to 0x510), with
the third slot down the **false** coin pairs slot 1 with slot 3, the fallen member, where Macalania's Seymour correctly pairs 2 with 1. The exe's
queue (`FUN_007ac9c0`, "TARGET ERROR") refuses a command at a fallen member, so that half of the cast is lost: **33,441 of 65,536 values, 51.03 %**,
of Natus's double casts with Kimahri (or whoever stands third) down hit one member, not two. It is built (`slot-pair.ts`, script `'natus'`), pinned
(`parity-ffx-ai-natus-hooks.test.ts`) and listed in "Open items" so the research note can be corrected.

## What is stale and waits on Bailey

**Owner decisions the scripts now answer differently.** Each was an estimate adopted because no source settled it; the decision's own words
anticipated a sourced answer (D-145/B9: "one constant"; D-184 makes GameFAQs' reading the tie-break only "when sources conflict and nothing in the game settles it", and D-214 says the Steam session
(D-205) may settle items first). They are built as the scripts say and listed here so he can overrule any of them (each reverts in one place).

| Decision | What it said | What the engine does now | Revert |
|---|---|---|---|
| D-019/c2 (Macalania) | Seymour untargetable while Anima is out (our assumption) | Same, now the script's own switch | n/a |
| D-019/c11 | Auto-Potion fires on any damage (named constant) | Fires on any action that takes HP, with the script's exceptions (D-12) | `ai/macalania-guardian.ts` |
| D-019/c14 | Act three continues the same element order | Same, now the script's own index | n/a |
| D-019/g1 | Anima's gauge +10 a turn and +5 per targeting | +5 per Pain and +5 per action that reaches her (D-14) | `ai/macalania-anima.ts` |
| D-082 (Natus B6) | Desperado only for Haste on all three; the ladder "not built" | The buff-count ladder is built (D-21) | `ai/seymour-natus.ts` |
| D-083 / D-084 (Natus B7, B8) | Element order and rotation keyed to the current element; his own reflected spells move his phase | The order is confirmed; Natus owns the index (D-19); any action that reaches him moves the phase (D-20) | `ai/seymour-natus.ts` |
| D-094 (Natus O-2) | The KO-and-revive strip reads "back weaker, max 3,000" | The engine returns Mortibody at 4,000 first (D-06); the strip follows the engine | `ai/mount-revive.ts` |
| D-184 (Omnis B8) | GameFAQs' ring and reset order Fire, Water, Ice, Thunder, labelled "our estimate" | The script's ring Fire, Ice, Water, Thunder and reset order Ice, Water, Thunder, Fire (D-24, D-25). **The painted discs still run Fire, Water, Ice, Thunder** (approved art, not touched): the colour that faces him is right, a one-step turn can read as a half turn on screen. The strip still prints Bailey's "Colour order: our estimate" | `DISC_RING`, `OMNIS_RESET_CYCLE`; the art is a repaint question |
| D-185 (Natus) | The shipped line "Haste only Tidus and Auron" because it "never calls Desperado" | **That is no longer true.** Haste on two plus Shell on all three is a total of 5 against a threshold of 4 to 7: Desperado half the time Mortibody checks. The line still wins (the 500-seed table), but its premise broke; see the options below | `src/engine/tactics/seymour-natus.ts`, the guide |
| D-145/B9 (Omnis) | The two-Water quirk "faithful" for every layout with exactly two Water discs | Only the four layouts where the Water pair is the first pair the chain meets (D-31) | `ai/omnis-affinity.ts` |

**Stale strategy-guide text and comments** (listed, not rewritten: the guides are player-facing wording that is Bailey's to approve; the hints that
quote a number are the ones that matter):

* `src/data/guides/seymour-flux.ts`: rule 1 ("every kill is a diminishing tap ... never a way to remove the adds") is true of the adds, but the route now **wins** (see the table); the Dispel hint
  ("then he burns two more turns recasting") and the phase-2 note ("charge ladder"; the telegraph names move) describe D-04 and D-03 as they were; rule 5 says "a delay counters with party-wide Slowga": only on the Mortiorchis.
* The advisor's look-ahead card (v4) on Chapter I's first menu: Hastega on the party on seeds 1, 2, 5 and 6 (was Slow on Seymour Flux), Holy Water on Kimahri on seed 3 (was on Yuna);
  `docs/handoff/advisor-v4.md` and the "Slow" census quoted in the test header describe the old fight. The guide's own NEXT line is `intendedStrategy`, which this lane did not touch
  (nothing was retuned), so the guide and the card may name different first moves now; reconciling them is a separate batch that needs Bailey's yes.
* `src/data/guides/seymour-anima-macalania.ts`: the header comments on Anima's gauge ("an [estimate] (C-4)") and the element order ("[single source] (C-14)") are answered by the script; the WATCH line says her gauge fills "whether she acts or is targeted": acting fills nothing, a Pain and being reached do; the Aerospark hint says he "opened the fight Shelled": he casts Shell on his first turn; the Poison and Magic Break hints: both are cleared at the summon and again when he returns.
* `src/data/guides/seymour-natus.ts` and `src/engine/tactics/seymour-natus.ts`: "Haste on all three calls Desperado" and "never calls Desperado" (D-185 above); "He Banishes an aeon after its first turn": at once; the phase note "His pattern moves only when an action hits him": and back down when he is healed above 24,000.
* `src/data/guides/seymour-omnis.ts`: rule 1 ("one spell each ... one per disc") and the hint "His spells land one to a member and the last on anyone": always four spells ordered by element group, aimed by slot only for three or four of a kind; rule 5's two-Water quirk (four layouts); the header's "127 of 200" (169 now).
* `src/story/scripts/seymour-natus.ts` ("a warning when the third Haste lands", D-085): the warning stays true and is now incomplete.
* The picked Omnis frame III (`scripts/gen_mock.py` STATES, the O-4 C mockup): drawn for the old ring ("One disc turned to Thunder" for Lulu's Blizzara); on the script's ring the same play reads "to Ice". The test carries the new sentence.
* `docs/plans/natus-bench.md`, `docs/plans/omnis-bench.md`, `docs/plans/chapter-macalania-review.md`: the old tables and assumptions.

## Measurement (the shipped `intendedStrategy`, whole chain, seeds 1 to 500)

`tests/unit/ffx-parity-measure.test.ts` (`PYREFLY_MEASURE=1 PYREFLY_MEASURE_SEEDS=1-500 PYREFLY_MEASURE_CHAPTERS=...`), the base commit
`a563e1d8` (a scratch copy: `git archive a563e1d8 src package.json tsconfig.json vite.config.ts vitest.config.ts` into a folder with the harness file and a `node_modules`
junction to the shared one; the 500-seed result is kept at `D:\Tools\ffx-parity\scratch\ai-seymour-baseline-500.json`) against this branch. The 12-seed column is seeds 1 to 12 of the same run. **Measured, never tuned:** nothing on a boss or a party changed.
The measurement was run again on the final tree (`1c4f5d5c`, 2026-10-09, `D:\Tools\ffx-parity\scratch\ai-seymour-final-500.json`): the per-seed result of every one of the 2,000 seeds is identical to the run the table was made from.

| Chapter | 12 seeds, old -> new | 500 seeds, old -> new | party turns | engine turns | party KOs |
|---|---|---|---|---|---|
| I Flux | 2/12 -> 12/12 | 131 (26.2 %) -> **500 (100 %)** | 27.2 -> 46.7 | 47.8 -> 66.2 | 4.4 -> 0.6 |
| VII Macalania | 12/12 -> 11/12 | 494 (98.8 %) -> **443 (88.6 %)** | 50.5 -> 58.3 | 100.9 -> 93.6 | 4.8 -> 5.4 |
| X Natus | 9/12 -> 8/12 | 389 (77.8 %) -> 386 (77.2 %) | 49.1 -> 54.4 | 77.8 -> 87.0 | 1.3 -> 2.1 |
| XII Omnis | 7/12 -> 11/12 | 290 (58.0 %) -> **427 (85.4 %)** | 109.2 -> 102.3 | 152.5 -> 138.8 | 11.6 -> 1.3 |

Paired by seed, old -> new (win/loss): Flux 369 losses became wins and none went the other way; Macalania 6 losses became wins and 57 wins became losses;
Natus 80 and 83 (a flat total made of two equal flows: the draws moved, not the odds); Omnis 188 and 51. The movers (two or more of 12 seeds, or ten percentage
points over 500) are Chapters I, VII and XII; the rest of this section says why.

The chapters' own benches, on their own builds (same code, no tuning): the Natus tactic bench (200 seeds) reads 152 for the shipped line (was 169), 131 for
Haste on all three and 112 for nobody Hasting (was 116), with 0.81, 2.23 and 0.54 Desperados a battle (it was 0 for the first and the last); the Omnis
tactic reads 169 of 200 (was 127); the Chapter I forty-seed window 40 of 40 (was 10) and the 160-seed windows 160 of 160 (was 45).

### Ablation: what moved each mover

A scratch copy of the final tree (`D:\Tools\ffx-parity\scratch\ai-seymour-abl`, never committed; patches `abl-patch*.cjs` beside it) takes one environment variable,
`PYREFLY_ABL=<rows>`, and puts each named row back to what the old AI did, in the new engine. Every table below is the same shipped line on the same seeds.
The control row reproduces the measurement above to the digit, and the all-rows-reverted variant lands near the old engine (Omnis 57.6 % against 58.0 %,
Chapter I with D-08 alone 29.4 % against 26.2 %, Natus 80.2 % against 77.8 %); the rows not ablated (Macalania D-10, D-12, D-16, D-18; Flux D-05) are why the
Macalania total stops at 95.2 %.

**Chapter I: one row, D-08, is the whole move.** 500 seeds each.

| Variant | Wins | Party KOs |
|---|---|---|
| this branch | 500 | 0.6 |
| D-08 reverted (the mount no longer copies Flux's CTB counter) | **147 (29.4 %)** | 3.7 |
| any one of D-01, D-02, D-03, D-04, D-06, D-07 reverted | 495 to 500 | 0.6 to 1.1 |
| D-01, D-02, D-03, D-04, D-06 reverted together (D-08 kept) | 433 | 2.7 |
| D-01 to D-04 and D-06, D-07, D-08 reverted together | 92 (18.4 %) | 4.5 |
| D-08 kept, every other row reverted | 457 | 2.4 |
| D-08 reverted, one other row kept at a time (D-01 / D-02 / D-03 / D-04 / D-06) | 104 / 41 / 107 / 121 / 89 | 3.7 to 4.8 |

(The "one kept" rows were run before the D-07 switch was narrowed to leave the Mortibsorption drain's own hook alone; D-07 reverted alone does nothing either way, 500 both times.)

The mechanism, counted on seeds 1 to 100: the Lance of Atrophy zombifies and the Mortiorchis's next Full-Life kills the Zombie, so what matters is whether the
party gets a turn between them (Holy Water). With the counter copy the Full-Life comes **straight after** the Lance on 58 of 257 Lances (23 %) and 40 party KOs
are Full-Life's; without it, 295 of 453 (65 %) and 154. The old engine let the two actors drift apart (its Agility tie only kept them together while nothing delayed
one of them); the game's script keeps them in step after every mount turn. `ai/seymour-flux.ts` is the only place that changed for it.
**The difficulty this implies is Bailey's call.** The chapter used to be the project's hardest (26 %, "short of the 90 % this project asks of a chapter") and is now
trivially won; the guide's "kill Seymour, not the mount" is also no longer the only winning line (the mount route wins 4 of 4 named seeds, ~30 Mortibsorptions each).

**Chapter VII: the opening (D-09) is the whole move, through a cycle position.** 500 seeds each (this branch 443).

| Variant | Wins |
|---|---|
| D-09 reverted (statuses at setup, default CTB) | 487 |
| the statuses only reverted (free Shell and Protects, the start CTB kept) | 489 |
| the start CTB only reverted (real first turns) | 441 |
| Seymour's Shell turn also moves his spell cycle on one step (nothing else reverted) | 485 |
| D-14 reverted (Anima's gauge +10 a turn and +5 a hit) | 458 |
| D-11 (cover), D-13 (random double cast), D-15, D-17 (cap and floor) reverted, one at a time | 443, 444, 444, 443 |
| D-09, D-11, D-13, D-14, D-15, D-17 reverted together | 476 (95.2 %) |

Every loss in the 150 seeds traced is in act three. In the script Seymour's first turn is Shell, not a spell, and the intended line reaches the summon after his third
spell in 289 of 300 seeds, so **act three opens on Multi-Fira** (win rate 87.5 %); with the free statuses the summon finds the cycle on step 0 (Ice) or 1 (Thunder) in 291 of 300 and
wins 98 %. The Shell turn that moves the cycle on one step (the row before last above) recovers 485 of 500, so the cause is the cycle position and not the buffs or
the CTB. Why act three that opens on Fire is harder for this party was not traced. D-14 (the gauge) is worth +15 on its own: Oblivion comes 39 times in 40 seeds
instead of 80.

**Chapter XII: the spell-free reset turn (D-27) and the always-four volley (D-26), pushed back by the reset order (D-24).** 250 seeds each (this branch 211 = 84.4 %).

| Variant | Wins |
|---|---|
| D-27 reverted (the reset turn also casts the four spells, on discs that are all one colour) | **44** |
| D-26 reverted (the old planner: one cast per living member plus one, disc order) | 168 |
| D-24 reverted (the old reset order, Water first) | **247** |
| D-28 reverted (the old counter) | 223 |
| D-29, D-25, D-30, D-31, D-32, D-33 reverted, one at a time | 214, 212, 211, 211, 211, 211 |
| all ten reverted | 144 (57.6 %) |

The reset turn gives the party one spell-free turn right after the discs all turn one colour, which is the most dangerous layout (four -ga). Without it the party
meets four -ga with no turn to answer (44 of 250). The true reset order starts with Ice, which this party handles worse than the old Water first (211 against 247).
The ring direction (D-25), the Water-pair slip (D-31), the affinity timing (D-30), what turns a disc (D-32) and the aeon rows (D-33) do not move the shipped line at all.

**Chapter X: flat, no mover.** 500 seeds each (this branch 386, base 389). D-22 reverted +12 (398), D-21 +2 (388, KOs 2.1 -> 1.3), D-19, D-20, D-23, D-06 and the slot-3 slip
reverted 386 (identical: the line never reaches them), all six reverted 401. The 80 and 83 flows of the pairing above are draws, not odds.

## Proofs and tests

* `tests/unit/parity-ffx-ai-hooks.test.ts`: the two random shapes enumerated over all 65,536 values (32,095 for `mod 100 > 50`; `mod 3` residues 21,846 / 21,845 / 21,845;
  `mod 4` uniform), the picker's ascending actor order and its no-draw rule, the queue, and (nine tests, `1c4f5d5c`) the hit-event contract on a probe script: three hits are one event with
  the records already applied, overkill counts and a hook that puts HP back stops the death, a hold nothing saves ends in the death, a heal is negative, a status-only move still raises it,
  an all-target action tells each target right after its own last record, a follow-up row announces nothing. Three mutants (a clamped result, the hooks after all targets, no follow-up
  guard) were applied one at a time and each was caught.
* `parity-ffx-ai-flux`, `-macalania`, `-macalania-acts`, `-natus`, `-natus-hooks`, `-omnis`, `-omnis-discs`: a decision table per fight, on the shipped data and the real engine
  (rolls fed through a scripted RNG that counts the draws of each kind). The two interpreter tallies reproduced: Mortibody's Desperado at `(total - 3) / 4` for totals 4 to 7
  (by residue, exact because 65,536 is a multiple of four) and all 256 Omnis layouts against the note's 35-row table (also compared once against the interpreter's own
  256-row dump: affinity and cast order identical for every layout).
* Old tests moved to the script (each with its reason in a comment): the command-record counts (453 and 2, the idle "Wait" is gone), the Macalania opening / cap / summon cases,
  the story wiring (the summon beat is emitted by the AI), the Natus phase and Desperado cases, the Omnis counter / volley / disc / reset / readout cases, the Chapter I strategy floors
  (8/40 -> 36/40, 40/160 -> 144/160) and the mount-farm describe (it no longer asserts a loss), the Omnis tactic band (110 to 145 -> 145 to 190), the scene's ring pin.
* Eight more files moved with the Chapter I and VII fights and were found only by the whole-suite run (`9e0eac98`; each is a board, a seed's outcome or a count, never a rule; the reason is in a comment
  at each pin): `advisor-floor` (boards with somebody down on seeds 1 to 12: 45, was 86; floor 60 -> 30), `advisor-note` (the gate's board is the first sixteen decisions of seed 7 now, was seeds 18 and 2; the
  "take it first, then raise them" sentence is rare on the shipped line, seeds 218, 494 and 500 of the first 520, so its existence check reads seed 218), `advisor-v4-card` (the search opens Chapter I
  with Hastega on the party on seeds 1 and 2, Holy Water on Kimahri on seed 3; was Slow, Slow, Holy Water on Yuna), `advisor-revive-foe` (the swing no longer KOs a Guardian by itself, its Auto-Potion
  answers it: the sweep puts Guardian A down at the first decision and the assertions are unchanged), `fb0929-zombie-warning` (the living ally is read off the board; Yuna is the one on the floor in the
  first board found), `ffx-overdrive-menu-rows` (the Chapter 1 probe runs on seed 1; on seed 3 Kimahri falls before his first turn when everyone else Defends), `ffx-results-ap` (the real wipe is a party
  that only Defends, because the shipped line wins seeds 1 to 500), `guide-advisor-target-agreement` (the single-target label on seed 9 is Kimahri's; no opening in seeds 1 to 40 puts the first Holy Water on Tidus).
* `ffx-engine-golden.test.ts`: eight digests re-baselined, reason "game-script parity" (seeds 1 and 7 of Chapters I, VII, X, XII); the other ten are unchanged, so nothing outside the four fights moved.
  Five outcomes moved on seeds nobody tuned (Flux #1 and #7 defeat -> victory, Omnis #1 defeat -> victory, Natus #7 and Omnis #7 victory -> defeat).
* `tests/unit/parity-ffx-ai-intent.test.ts` (4 tests, new): the enemy-intent panel dry-runs these scripts on a clone every time a menu opens, and the scripts move shared state and spend draws at decision time, so each fight
  is played twice on seeds 1 to 3, asking at every player decision the first time and never the second: the event log and the final flags are identical byte for byte (the panel was asked 20+ times and answered more
  than half of them). Mutant: a clone that shares the live flags is caught.
* **Mutation check of the decision tables** (scratch driver, outside the repo; one line changed at a time, the file restored from memory each time): 21 mutants, all caught by the parity tests of their fight, and an
  equivalent mutant as a control that correctly survived. The mutants: Flux (Dispel on the wrong step, Cross Cleave on the wrong step, the mount no longer copying Flux's counter D-08, the Protect line not spent D-04),
  the mount's revive value decaying by 2,000 (D-06), Macalania (the Guardian coin inverted, the summon at 3,500, Anima's gauge step 10, the cover coin's branches swapped), Natus (Desperado threshold `mod 4 + 3`, the third-phase line
  back at 12,000, the Protect flag ignored, the slot-3 slip removed), Omnis (glow on the 5th hit, the reset order and the ring each with Ice and Water swapped, a spell on the reset turn, the Water-pair slip removed,
  the affinity refreshed only on his own turn), the script coin `>= 50` and the intent clone sharing flags.
* `tsc --noEmit` clean (by path: `node "D:/Final Fantasy/node_modules/typescript/bin/tsc" --noEmit`); `node tools/orphans.mjs` lists none of the new modules; the two source files over 400 lines (`ffx/intent.ts`, 730, and
  `data/ffx/enemies/seymour-anima-macalania.ts`, 406) were over it before this lane and are no longer than they were.
* **The whole unit suite, once, on `1c4f5d5c`** (2026-10-09, `--maxWorkers=4`, 658 s; the intent test above and the golden comment fix came after it and were run alone): **932 files: 905 passed, 21 failed, 6 skipped; 13,937 tests: 13,696 passed, 161 failed, 79 skipped, 1 todo.**
  **All 21 failing files are the art-only failures this worktree has without `public/art`** (the same 21 files and 161 tests as AI lane B's list and W1's): `ui-portrait-face-crop` 125, `chapters/trema-ship-content` 4,
  `art-ref-defaults` 4, `pause-remake` 3, `chapters/isaaru-ship` 3, `chapters/den-of-woe-ship-content` 3, `chapter-meta-seymour-anima-macalania` 3, `chapter-meta-evrae` 3, `chapters/natus-ship-scene` 2,
  `chapters/natus-ship-content` 2, `chapters/leblanc-art` 2, `chapters/fallen-aeons-ship-content` 2, `chapter-meta-ffx2-leblanc` 2, `cutscene-story-poses` 1, `chapters/fallen-aeons-ship-scene` 1,
  `chapters/den-of-woe-ship-scene` 1, and five files that fail on import because `public/art/manifest.json` is missing (`party-face-manifest`, `chapters/yojimbo-content`, `chapters/leblanc-party-sprites`,
  `chapters/chapters-6-7-8-enemy-sprite-manifest`, `chapter-meta`). `ffx2-atb-golden` and `ff7-golden` passed unchanged. The first whole-suite run, before the eight re-pins above, had 31 failing files; the two
  extra timeouts it showed (`ffx2-ability-flags`, `live-url-follows-host`) were the host's load (every lane runs its own whole suite) and pass alone and in this run.

## Merging with AI-YUNALESCA-BFA (`re-parity-ai-ffx-b`, commits up to `494c4cce`)

Both lanes built the game's `onHit` hook, and it is the same hook: once per action per target, after the last of the action's hit records on that target and before the
death check (`pp_BtlApplyHitRecords`, 0x78f060: each call applies one record and the call that applies the target's last one requests the hook). **Kept equivalent**
(checked against the other lane's final code and its handoff, not only at the time of its first commit):

| Both lanes | |
|---|---|
| When | after the last record of the action on the target; a miss, a heal and a status-only move count; a Doublecast is two actions, so two events; inert for a script with no hook; FFX only |
| Death | a script that decides whether it dies opts in (`holdsDeath` here, `managesHp` there); a lethal hit's KO waits for the hook; a body still at 0 afterwards dies |
| `lastDamage` | `LastDamageTakenHP`: the action's HP-class results on the target after the cap and before the clamp (overkill counts, a heal is negative), summed where `resolveOneHit` calls `dealDamage`. **Now in this lane's report too** (`1c4f5d5c`), with `affectsHp`, so a script written for one runs on the other |
| Attacker and command | `HitEvent.attacker` / `.def` there, `used.user` / `used.def` here |

| `re-parity-ai-ffx-b` | this branch |
|---|---|
| `hit-hooks.ts#registerHitScript(id, hook, { managesHp })`, `HitEvent { ctx, target, attacker, def, lastDamage, affectsHp }` | `ai/hooks.ts#registerScriptHooks(id, { onHit, holdsDeath, ... })`, `onHit(ctx, self, used: { def, user }, report: { hpBefore, lostHp, lastDamage, affectsHp })` |
| `hit-event.ts#runHitEvents` over the `touched` map | `abilities.ts#finishTouched` over the same kind of map, kept in `hit-apply.ts` |
| `hp.ts` `deferKo` (plus a `survives` rule for the overkill mark) | `hp.ts` `holdKo` and `settleDeferredDeath` (the overkill mark is decided when the body really dies) |
| `queueReaction(ctx, { actorId, targetId, command, cause })`, `drainReactions` in `afterAction` | `queueReaction(ctx, ownerId, command, { forced, keepsControl, byId })`, `ai/reaction-drain.ts` (kinds command, drain, emit) |
| `extra.groupTarget` (exactly the combatants the script named, whatever the row's own targeting) | `extra.scriptAims` (a per-hit random row: hit `h` goes to the `h`-th named target, a fallen one is lost); the two are different mechanisms and both stay |
| `ai/game-rolls.ts` (`gameRandom`, `gameMod`, `pickActor`) | `ai/script-random.ts` (`scriptValue`, `scriptMod`, `scriptCoin`, `pickMatching`, `drawPicker`): the same two shapes, one draw of 16 bits and the picker over the living and targetable in ascending actor order with no draw below two candidates |

**Differences left for the merge** (none changes a result in either lane's own fights; each says which to keep and why):

1. *Order against the other targets.* Here an ordinary (target-by-target) action tells each target right after its own hits and before the next target is touched, and a per-hit random
   action tells all of them at the end, in the order of each target's **last** record; there every hook runs after all the targets' hits, in the order of the **first** touch. Same for a single-target
   action and whenever no hook reads another target; they differ for an all-target action (pinned here: "the second target is untouched when the first one's hook runs"). Keep this branch's:
   one record is applied per call and the hook is requested by the call that applies a target's last record. The other lane's tests do not distinguish the two.
2. *A follow-up row* (Blitz Ace's Last Hit) is the same action as its main row: no second event here; the other lane's runner is called by every `resolveAbility`, so Yunalesca's counters would
   answer a Blitz Ace twice. Keep this branch's.
3. *Reactions.* One first-in-first-out queue per battle here: a reaction's hits run the hooks of whoever they hit, which may append more (the game does not forbid it; a script that does not want
   a counter of a counter asks `isCounterattackAllowed`, "the attacker is not itself in a counter", and Mortibsorption on Flux is followed by the Protect and Reflect his thresholds answer it with).
   There a flat list drained in `afterAction` with `rt.inReaction` set, which drops every reaction queued by a hit that lands during a reaction (the engine's old "a counter never triggers another
   counter" rule), and the owner's ability to act is tested at queue time by the script (here at drain time, by `canQueueCommand`). Keep this queue and give the other lane's scripts the predicate:
   `drainScriptReactions` would set one flag while a reaction runs (nothing in this lane reads it; the other lane's two reaction sites do not chain in practice: Yunalesca's counters land on party members
   and Yu Yevon's own Curaga is filtered by his hook's `attacker.id === boss.id`).
4. *Where the state lives.* The other lane puts `reactions`, `inReaction` and `formDiedAtSeq` on `FFXRuntime` (`HitRuntime`); this branch's queue is a `WeakMap` beside the runtime because
   `FFXRuntime` is cloned for the advisor's dry runs and a queue is empty between actions. `formDiedAtSeq` (Yunalesca's Doublecast cancel) is not part of the hook and stays.

**A textual merge is wrong without a conflict.** `git merge-tree` of the two branches reports conflicts in `ai/reactions.ts`, `engine-end.ts`, `hit-apply.ts`, `hp.ts` and
`tests/unit/ffx-engine-golden.test.ts` only, but `abilities.ts` merges cleanly into a file that calls this branch's `finishTouched(scope)` (which empties `scope.touched`) and then the other lane's
`runHitEvents(ctx, user, def, scope.touched)` over the empty map: **the five scripts of the other lane (`yunalesca.ts`, `braskas-final-aeon.ts`, `yu-pagoda.ts`, `possessed-aeons.ts`,
`yu-yevon.ts`) would silently never run.** The recipe, in order:

1. Take `ai/hooks.ts`, `ai/reaction-drain.ts`, `abilities.ts#finishTouched` and the `touched` tally in `hit-apply.ts` as the one runner; delete `hit-hooks.ts`, `hit-event.ts`, the other lane's
   `runHitEvents` call, its `touch`/`TouchedMap` use, `deferKo` and `survives` in `hp.ts`, and its `drainReactions` block and `inReaction` in `engine-end.ts` (and `HitRuntime` in `state.ts`, keeping `formDiedAtSeq`).
2. Port the five scripts: `registerHitScript(id, hook, { managesHp })` becomes `registerScriptHooks(id, { holdsDeath: managesHp, onHit: (ctx, self, used, report) => hook({ ctx, target: self, attacker: used.user, def: used.def, lastDamage: report.lastDamage, affectsHp: report.affectsHp }) })`;
   `queueReaction(ctx, { actorId, targetId, command, cause })` becomes `queueReaction(ctx, actorId, command, { byId: targetId })` (both emit the `counter` event with cause `script`).
3. Keep the other lane's own pieces that are not the hook: `scheduleRevivalAt` and the Pagoda return delay (`hp.ts`), the fayth-revival CTB 0 in `koActor`, `groupTarget` in `targeting.ts`, the Doublecast cancel.
4. `ai/reactions.ts`: the lanes removed different blocks (Flux, Macalania, Natus, Omnis here; Yunalesca and Yu Yevon there): take both removals.
5. Goldens: this lane re-baselined eight digests (seeds 1 and 7 of Chapters I, VII, X, XII), the other two (Chapter III seeds 1 and 7): disjoint chapters. Re-run `ffx-engine-golden`, every `parity-ffx-ai-*` and `re-parity-ai-*` file, the strategy tests of Chapters I, II, III, VII, X, XII and the measurement after the merge,
   and re-baseline once ("game-script parity"); every digest outside the two lanes' chapters should not move.

**The seed pins will move again at the merge.** W2 (`re-parity-w2`) also re-pinned seven of the files this lane re-pinned (`advisor-note`, `advisor-v4-card`, `ffx-engine-golden`, `ffx-overdrive-menu-rows`,
`ffx-results-ap`, `guide-advisor-target-agreement`, `strategy-seymour-flux`), and its opening CTB, status and tick wiring changes the draws every seeded board rests on, so expect textual conflicts there and, once they
are resolved, re-derive each seed from the rule it stands for and not from the numbers in this note: `advisor-note`'s screenshot board (in the first sixteen decisions a Poison Fang card whose note says "Leave Yuna down",
the raise refused because she is a Zombie, Holy Water cards, the Phoenix Down with its Zombie warning) and its "take it first, then raise them" board (a body on the floor that is not a Zombie while a party-wide payload is
next; rare on the shipped line, 3 seeds of the first 520 here), `advisor-v4-card`'s three first menus, `ffx-overdrive-menu-rows` (a seed on which Kimahri, Wakka and Lulu all get a turn while everyone else Defends),
`guide-advisor-target-agreement` (a seed whose first Holy Water names one character) and the goldens. `fb0929-zombie-warning` searches seeds for its board and `ffx-results-ap` only needs a party that Defends to lose, so neither pins a seed's outcome.

## Open items and decisions for Bailey

1. **Chapter I's difficulty (26 % -> 100 %)** is one sourced row (D-08, the CTB counter copy); accepting it, asking for measured options, or holding D-08 back is his call (the lane never tunes).
   The guide's "kill Seymour, not the mount" and the 17 / 40 floors the old tests pinned are stale either way.
2. **Chapter XII's difficulty (58 % -> 85 %)** is the game's spell-free reset turn; the painted discs still run the old ring (a repaint, or a rotation mapping, makes a one-step turn read as a quarter turn),
   the strip still prints "Colour order: our estimate" (D-184's wording), and the O-4 C frame III shows the old ring.
3. **Chapter VII (-10 points)** follows from Shell being a real first turn (D-09); nothing to fix, worth knowing that the party now meets Fire first in act three.
4. **Chapter X's tactic and guide (D-185)** teach a premise the script falsifies. The line still wins most; the options he can ask to have measured: keep as is with new wording; Haste two without the Shell stack
   in phase 1; or the Shell stack without Haste (the bench's no-Haste line reads 56 %).
5. The research note's table should be corrected for the slot-3 slip (Natus loses half a Multi-ra, 51.03 % of the time with the third slot down).
6. Not built (the note's C rows, or not read): the purpose of Natus's fractional-damage flag, the reset turn's CTB (W2), the statuses `btlResetParam` clears at Seymour's re-initialisation beyond "all of them" (B).
7. **One reading of the lane brief to confirm.** "A row contradicting an owner decision stays and is listed": this lane read it as: a decision that rests on an estimate or an assumption, and says so in its own words
   (D-019/g1, D-082, D-083, D-084, D-145/B9, and D-184, whose own words make GameFAQs' reading the tie-break only "when sources conflict and nothing in the game settles it"), yields to the game's script, and each such row is listed with its one-place revert
   in "What is stale" above. A decision that is a choice about the fight (for example D-128 and D-130 for Chapter I, D-203 for Natus's Talk lines, D-216 and D-248 for the Omnis hints) is respected unchanged.
   If the strict reading is meant (the row stays unbuilt and only the conflict is listed), revert rows D-14 (D-019/g1), D-19 and D-20 (D-083, D-084), D-21 (D-082), D-24 and D-25 (D-184) and D-31 (D-145/B9) in the files
   the revert column names, and rewrite the parity tests of those rows with them.
8. **Chapter I's difficulty depends on one piece of arithmetic that W2 must keep.** In the game the mount's turn is the dummy Command 150 (0x608C): the mount pays that record's recovery (rank 3, the same as Full-Life,
   Cross Cleave and Total Annihilation, read from the W2 fixture `command_status.json`) after it has copied Flux's counter (D-08: the script copies while the turn is requested, the recovery is charged when the action is done; that order is read in the exe, not run), and Flux's answers are free reactions. This engine charges the rank of the ability the mount
   performs, which is also 3, so the two agree today; when W2 routes recovery through the command records, the mount's turn must still be charged Command 150's rank and not the performed move's.
9. **The merge with AI lane B needs more than a textual merge**: see "Merging with AI-YUNALESCA-BFA" above (the hit report now matches that lane's `HitEvent`; `abilities.ts` merges without a conflict into a file whose
   second runner would never fire).
10. **No browser check was run** (AGENTS.md "Done means" asks for one on a UI change): this worktree has no `public/art`. What this lane changed that a player sees or hears: the Omnis readout strip and its model
    (`src/ui/ffx/OmnisReadout.ts`, `omnisReadoutModel.ts`: the volley line is always four spells now), the disc scene's ring comment (`src/scenes/garden-of-pain-discs.ts`, no behaviour) and the moment Chapter VII's
    Anima-summon line plays (it is a `script-trigger` the engine emits from Seymour's summon, `macalania-acts.ts`, instead of an `hp-below` trigger that could never see him under half). The readout's DOM and the
    story wiring are covered by `omnis-readout.test.ts` and `macalania-story.test.ts`; the main session's validation should look at the Chapter XII strip and the Chapter VII summon on a build that has the art.
11. This lane never ran the game, installed or downloaded anything, pushed, merged or deployed, and started no dev or preview server.

