/**
 * **Golden: nothing that already plays moved.** FFX-2 only.
 *
 * `docs/plans/ffx2-active-menu-review.md` §5 I5 and §6. The hashes below were
 * recorded on the engine **before** the `ffx2-active-menu` track touched it
 * (main 8e1192a, 2026-09-22): sha256 of every link's full event log, first 16
 * hex, for chapter 4 (`ffx2-bahamut`) and the whole chapter 5 chain, seeds 1-20,
 * driven through the shipped `intendedStrategy` with zero decision time — the
 * auto-battler's own behaviour, which is what every replay, e2e run and critic
 * capture uses.
 *
 * Two changes must leave them exact:
 * - the chain-lock hold and the menu-owner rule (a `D = 0` run never has an
 *   owner chained under an open menu, so neither path is reachable);
 * - the Config ATB speed lever at **Normal**, explicit or omitted (every new
 *   multiply and divide is by exactly 1).
 *
 * The `D = 1500` arm was recorded after the two fixes and before the lever, so
 * it proves the lever's Normal is byte-identical on the Active path too.
 *
 * **Re-pinned once, deliberately, for PR-0075** (release-09 repair, 2026-09-22,
 * `docs/plans/ffx2-item-accuracy-review.md`): a heal or item on the party's own
 * side no longer rolls the §2.6 hit check, so it no longer draws from the seeded
 * stream and every seed that cast one moved. Measured before re-pinning: under the
 * old engine chapter 4 D=0 had friendly misses on 9 of 20 seeds, chapter
 * 5 D=0 on 18 of 20; with the roll still drawn (a throwaway probe, not shipped)
 * the 11 chapter 4 seeds that had none were byte-identical to the old hashes, so the
 * only behaviour that moved is the friendly miss. After: zero friendly "evaded"
 * misses on every seed, and D=0 is still 20/20 in both chapters.
 *
 * **Re-pinned a second time, for the Leg's drop id** (commit 697c0380,
 * 2026-09-23, `docs/handoff/fix-ffx2-vegnagun-facts.md`): the Vegnagun Leg's
 * `rewards.drops` id changed from the unresolved `x2-mythril-bangle` to the
 * accessory registry's own key `mythril-bangle`; `buildResult()` copies
 * `rewards.drops` verbatim into the link's `victory` event
 * (`src/battle/ffx2/results.ts`), so the id string is part of the logged event
 * and the hash. Measured before re-pinning, full event-by-event diff of chapter
 * 5 seeds 1 (D=0) and 2 (D=1500) against the pre-change engine: of 8,189 and
 * 14,832 events respectively, **exactly one event differs**, and only the
 * `drops[0].itemId` field inside it — same turn count, same tick and ms
 * totals, same ap/exp/gil, every other event byte-identical. Chapter 4 never
 * touches the Leg, so `CH4_D0` and `CH4_D1500` are unchanged (verified:
 * recomputed and diffed equal to the arrays below). The steal tables added to
 * the Head and Tail in the same commit are inert here — nothing under
 * `src/battle/ffx2` reads `rewards.steal` (only the FFX-1 engine and two
 * unrelated FFX-2 tactics files for Leblanc/Seymour do).
 *
 * **Re-pinned a third time, for combat-fixes-0924 (a)** (branch
 * `combat-fixes-0924`, 2026-09-24, `docs/plans/combat-fixes-0924-review.md`): a
 * magical action no longer rolls the §2.6 hit check (hard rule 5), so it no longer
 * draws from the seeded stream, and chapter 5's Nodes, Vegnagun, Shuyin and the
 * party's Black Sky used to. Measured before re-pinning:
 * under the old engine chapter 5 D=0 had evaded magic on 17 of 20 seeds and
 * D=1500 on 9 of 10; with the roll still drawn and only the miss ignored (a
 * throwaway probe, not shipped) exactly the seeds with **no** evaded magic
 * (D=0 seeds 3, 15, 18; D=1500 seed 4) were byte-identical to the old hashes,
 * so the only behaviour that moved is the magic miss. Chapter 4 casts no rolling
 * magic, so `CH4_D0` and `CH4_D1500` are unchanged (recomputed, equal). After:
 * zero evaded magic on every seed, D=0 still 20/20. The Active D=1500 arm moved
 * from 2/10 to 0/10 wins (it pins hashes, not outcomes; disclosed in the plan).
 *
 * **Re-pinned a fourth time, one hash, for the spherechange accessories fix**
 * (branch `chapter-trema-0925`, 2026-09-25, `docs/plans/trema-winnability-method-check.md`
 * E2, `src/battle/ffx2/spherechange.ts#refreshDerivedStats`): a girl keeps her accessories
 * through a spherechange (ffx2-combat-core §4.2, §5.4). Only `CH5_D1500` seed 3 moves: Yuna
 * changes White Mage to Gunner under Itchy and her next Poison tick is 102, not 51, because her
 * Crystal Bangle's max HP survives the change. Measured event by event against the pre-fix
 * engine: every event before that tick is identical, the outcome (a loss) is unchanged, and
 * every D=0 hash and every chapter 4 hash is unchanged (recomputed, equal).
 *
 * **Re-pinned a fifth time, the Active D = 1500 arm only, for "an enemy hit closes an open menu"**
 * (decision sheet 2026-09-25 item 4, A1; `research/ffx2-combat-core.md` §1.1, §1.5;
 * `docs/plans/ffx2-hit-closes-menu-review.md`). At 1.5 s under Active every seed has an enemy hit
 * land on an open menu, so all twenty `CH4_D1500` / `CH5_D1500` hashes move: 109 and 289 menus
 * closed over the ten seeds; chapter 4 still wins 10/10, chapter 5 0/10 as before. Every D = 0
 * hash is unchanged (no menu is ever open while the clock runs at zero decision time), and so is
 * the Wait arm below (the whole-menu hold lets no enemy act). FFX-2 only.
 *
 * **Re-pinned a sixth time, the chapter 5 arrays only, for IC-2 and Acta Est Fabula's target**
 * (branch `ffx2-engine-fixes-0926`, 2026-09-26, `docs/plans/ffx2-engine-fixes-2026-09-26.md`).
 * (1) An all-target action now hits each target taken at its start, and a target KO'd partway is
 * skipped rather than its hits wrapped onto someone already hit (`research/ffx2-combat-core.md`
 * §9.1). Measured against the old engine with a throwaway probe: every moved seed's first
 * differing event follows a KO inside an all-target action (a Bulwark dying to Black Sky, or a girl
 * dying to the Tail, a Node or the Leg); `CH5_D1500` seed 6 has none and did not move. (2) Acta Est
 * Fabula hits the two Redoubts it names, not the Head as well (§3.4 "both Redoubts";
 * `constants.ts` NAMED_TARGETS_ONLY): every D = 0 seed casts it 5-6 times, so all twenty move.
 * Outcomes: D = 0 still 20/20; the Active D = 1500 arm 0/10 -> 1/10 (seed 7). Chapter 4 never meets
 * either case: `CH4_D0` and `CH4_D1500` are unchanged (recomputed, equal).
 *
 * **Re-pinned a seventh time, the Active D = 1500 arrays only, for the menu-cancel correction**
 * (Bailey, 2026-09-26: "I'll take all your recommendations", answering "menu correction on (my
 * recommendation), or keep it as is"; `research/ffx2-combat-core.md` §9.2, Split_Infinity G1041 /
 * G1042; `constants.ts` MENU_CANCEL_ONLY_DELAY_ABILITIES now true). An open menu is closed only by
 * an enemy ability with a Delay effect or Action-cancel, not by every hit, which replaces the fifth
 * re-pin's rule (item 4 A1). At 1.5 s under Active every seed had a plain hit close a menu, so all
 * twenty `CH4_D1500` / `CH5_D1500` hashes move: menus the clock closed over the ten seeds fall from
 * 109 to 4 in chapter 4 (Bahamut carries no Delay ability, so what is left is a status or a KO, each
 * closing a menu on its own rule) and from 300 to 56 in chapter 5 (the same, plus the Leg's Vita
 * Brevis, a strong Delay). Outcomes: chapter 4 still
 * 10/10; chapter 5 1/10 -> 4/10. The engine option `menuCancelOnlyDelayAbilities: false` still
 * replays the fifth/sixth pins byte for byte (recomputed, equal; `ffx2-menu-cancel-delay.test.ts`
 * pins that). Every D = 0 hash and the Wait arm are unchanged (no clock runs under a menu there).
 * The old hashes are in git at 63767b5b. FFX-2 only.
 *
 * **Re-pinned an eighth time, every array, for re-parity W3** (branch `re-parity`, 2026-10-09, FFX-2 only, reason "game-code parity";
 * `docs/handoff/re-parity-w3.md`). The engine now rolls every hit, critical hit, damage number, status and theft through the kernels
 * proven against FFX-2.exe, on the game's own command rows and monster rows, in the game's draw order (every target's hit roll first,
 * then per strike the variance, the critical roll, the status rolls, the theft rolls), so every seeded replay is a different replay and
 * all sixty hashes moved. Outcomes: chapter 4 D = 0 is still 20/20 and the Active D = 1500 arm still 10/10; chapter 5 D = 0 is still
 * 20/20 and its Active D = 1500 arm is 2/10 (seeds 4 and 7; it was 4/10). The Wait arm still equals the D = 0 arrays and the Wait
 * engine switched to Active still equals the Active arrays (both asserted below). The old hashes are in git at 029d49c7.
 *
 * **Re-pinned a ninth time, the Chapter 4 arrays only, for Mega Flare at the game's power 14** (release candidate 1, 2026-10-09, FFX-2
 * only, reason "game-code parity"; Bailey: "Use 14 from the files", `research/re-ffx2-commands.md` section 5). The ability, the engine
 * table's record and the data record carried the authored 24 over the game's row (0x409c) and now carry the row's 14. All twenty
 * `CH4_D0` and all ten `CH4_D1500` hashes move; **every `CH5_D0` and `CH5_D1500` hash is unchanged** (recomputed, equal), and so is
 * every Chapter 6 hash. Cause, found by diffing the full event logs of the twenty D = 0 seeds with the 24 and the 14 (the 24 put back
 * for the run): in every seed the first event that differs is Bahamut's first Mega Flare damage event, and only its `amount` differs
 * (42 to 47 on a girl under Shell before, 14 to 16 after); every event before it, and the random stream up to it, is identical. (Event
 * payloads hold the engine's live status instances, so an early `status-add` of a Shell shows a different `ticksRemaining` at the end of
 * the run: that is the later divergence showing through, not an earlier one.) Outcomes: D = 0 still 20/20 and the Active D = 1500 arm
 * still 10/10. The old hashes are in git at 3663cd3a. The same Chapter 4 rows moved in `ffx2-hit-closes-menu.test.ts` and
 * `ffx2-menu-cancel-delay.test.ts`.
 *
 * **Re-pinned once for the merged state of release candidate 3** (branch re-parity-rc3, 2026-10-11, FFX-2 only; reasons "game-code parity" and "game-script parity"; docs/handoff/re-parity-rc3.md): re-parity W4's logic-step engine, gauges and status clocks and the three boss-AI lanes (a: Bahamut, the Vegnagun chain, Shuyin; b: the Fallen Aeons, the Magus Sisters, Paragon, the Oversoul, Trema; c: the Leblanc Syndicate, the Den of Woe, Ixion) are in one tree, with the AI lanes' timer rows put on the logic-step clock (Bahamut's countdown is 750 steps, a voice poll recovers by the speak command's 60 instead of 70, the Vegnagun Head's Agility 110 is rolled into its first gauge, the Oversoul idles 1,201 steps, the Redoubts and the Head wait for the fall they are waiting for and are polled on the next step). Each branch had re-pinned these for itself; this is the one pin of the merged tree. Every one of the sixty hashes moved, against the live build (39.4.4, the first differing event of every seed is the opening: W4's gauge rolls
 * the first waits on the game's draws, see the tenth re-pin below) and against W4 alone. Against W4 alone the first differing event is: Chapter 4, Bahamut's
 * very first action, the Curse's girl (lane a, rows B1 and B5: the near-weighted search draws one 31-bit value where the engine drew a float), on 14 of the 20
 * D = 0 seeds and 8 of the 10 Active seeds, and on the others a later chain break or miss that follows from the same draw (seeds 5, 12, 14, 15, 19 and 6 at D = 0);
 * Chapter 5, the Tail's first turn comes 9 steps earlier on 13 of 20 seeds (RC3: its opening voice poll is the speak command, ATB cost 60, not the standard 70) and
 * the other seven differ a few events on, in who acts first after it; later in the chain the Redoubts of link 4 are polled on the step after their twin falls (row R4),
 * which moves the Chapter 5 chain's tail on every D = 0 seed and on five of the ten Active seeds (the pins before that edit, 382108ec, differ only there). Outcomes: Chapter 4 D = 0 20/20 and the Active arm 10/10, as under W4 and on the live build;
 * Chapter 5 D = 0 20/20 (it was 14/20 under lane a alone on the old clock, 20/20 under W4 and on the live build), and its Active arm is **5/10** (6/10 under W4
 * alone, 1/10 under lane a alone on the old clock, 2/10 on the live build): the Head's Agility, the Nodes' starting colours and the Core's answers are the game's
 * (lane a), and the menus now cost the girls the game's real waiting times (W4); measured, not tuned (docs/handoff/re-parity-rc3.md, 500 seeds of the shipped line).
 * The Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays (both asserted below).
 * **Re-pinned a tenth time, every array, for re-parity W4** (branch `re-parity`, 2026-10-10, FFX-2 only, reason "game-code parity";
 * `docs/handoff/re-parity-w4.md`). The engine clock is now the game's logic step (29.97 a second, measured on Bailey's running game
 * on 2026-10-09) and every gauge is the game's own counter: a command leaves `cost_atb x 10000 / (AGI + 1)` (a spell 0), a cast counts
 * down `cost_cast x 10000 / (AGI + 1)` at the full tick, the opening is `((draw & 63) + 32) x full / 128` with the two-thirds trim,
 * monsters think, a hit of the ATB class pushes a gauge back, and the status clocks are the game's counters of 1,500 and timers of
 * 150,000 units. Every seeded replay is a different replay, so all sixty hashes moved. Outcomes: chapter 4 D = 0 still 20/20 and the
 * Active D = 1500 arm still 10/10; chapter 5 D = 0 still 20/20 and its Active D = 1500 arm is **6/10** (it was 2/10 after W3, 4/10
 * before it): the same menus now cost the girls the game's real waiting times, so a human who takes 1.5 s a menu is no longer behind
 * a boss whose casts were far too fast; measured, not tuned (seeds 1 to 10, `docs/handoff/re-parity-w4.md`). The turns are handed out in
 * the game's ready-list order too (lowest recovery counter first), which is why this is 6 and not the 8 an earlier build of the same
 * gauges gave. The Wait arm still equals
 * the D = 0 arrays (20/20 in both chapters, no menu invalidated, held or refused) and the Wait engine switched to Active still equals
 * the Active arrays (both asserted below). The old hashes are in git at 931613a8. The same rows moved in
 * `ffx2-hit-closes-menu.test.ts`, `ffx2-menu-cancel-delay.test.ts` and `chapters/den-of-woe-carry.test.ts`.
 * **Re-pinned a tenth time, every array, for the boss AI of Chapters IV and V** (re-parity AI lane FFX-2 a, branch `re-parity-ai-ffx2-a`, 2026-10-10,
 * FFX-2 only, reason "game-script parity"; `docs/handoff/re-parity-ai-ffx2-a.md`). Bahamut, the Vegnagun chain and Shuyin now follow the game's own scripts
 * (`research/re-ffx2-ai-bahamut-vegnagun.md` section 10), so every one of the sixty digests moved. Cause, found by fingerprinting the full event log of every
 * seed before (the base commit's sources put back for the run) and after and comparing the logs event by event (the table is in the handoff). Chapter 4: on 22 of
 * the 30 seeds (D = 0 seeds 1-4, 7-11, 13, 16-18 and 20; Active seeds 1-4 and 7-10) the first difference is Bahamut's very first action, the Curse's girl (now picked by the
 * near-weighted search, one 31-bit draw, where the engine's pick was one float draw); on the other 8 the Curse lands on the same girl by chance and the first difference
 * is the aim of a later Bahamut Attack (D = 0 seeds 5, 6, 12, 14, 15 and 19; Active seeds 5 and 6). (On those a status event's payload, a live status object,
 * already differs earlier in the hash: that is the later divergence showing through, as in the ninth re-pin.) Chapter 5: every seed differs inside the Tail's link
 * and nowhere earlier, either at the first Tail Beam's aim (near-weighted now; D = 0 seeds 1, 4, 8, 11-14, 17, 19; Active seeds 1, 2, 4-9) or at the next damage
 * roll after the Tail's opening sweep, because that sweep runs a target search the script throws away, which draws once and moves every later roll one draw (D = 0 seeds
 * 2, 3, 5-7, 9, 10, 15, 16, 18, 20; Active seeds 3 and 10). Outcomes: Chapter 4 is
 * still 20/20 at D = 0 and 10/10 on the Active arm; Chapter 5 at D = 0 is 14/20 (it was 20/20; the losses are seeds 2, 3, 4, 5, 14 and 20) and its Active arm is
 * 1/10 (seed 5; it was 2/10), which is the chain getting harder, measured and disclosed in the handoff (500 seeds of the shipped line: 430 to 323), not tuned. The
 * Wait arm still equals the D = 0 arrays and the Wait engine switched to Active still equals the Active arrays (both asserted below). The old hashes are in git at 931613a8.
 * **Re-pinned an eleventh time, every array, for the game's own random streams** (re-parity RNG lane, branch re-parity-rng, 2026-10-11, FFX-2 only; reason "game RNG streams (Bailey 2026-10-09)": FFX-2 draws from its own 68 streams, every seed is another deal of the same odds, and nothing else moved (docs/handoff/re-parity-rng.md). The old hashes are in git at 0c729fa5. Every hit, critical, variance, status, theft, opening-gauge and target-search draw moves to the stream the game gives it (a girl's own stream is slot + 20, a monster's slot + 13, plus 16 for the hit roll and 32 for status rolls; 5 for a random-target pick, 10 and 11 for theft, 2 and 4 for the scripts), so every one of the sixty digests moved. The outcomes did not: Chapter 4 is still 20/20 at D = 0 and Chapter 5 still 20/20 (CH5_D0_OUTCOMES is unchanged). Nothing on the bosses or the party was tuned.
 *
 * **Re-pinned a twelfth time, one hash (`CH5_D0` seed 4), for the command menu's data and rules** (re-parity RC7 lane X2-B, branch re-parity-rc7-x2cmd, 2026-10-13, FFX-2 only;
 * reason "game-code parity", the checked note FFX2-G02 section 2.5 and row E2; `docs/handoff/re-parity-rc7-x2cmd.md`). Silence now stops the 88 rows that carry the silenceable bit
 * (Arcana, every Dance and Song, the White Magic spells, the Moogle, Cait and Eraser moves ...) and not the two spell menus' labels, and spares Pray, Vigor, Focus and MP Absorb.
 * Cause, found by ablation (the old Silence rule put back through a module mock for the run reproduces the old digest; putting back the old offered-abilities rule alone, which
 * also moved the menus, does not): in Chapter V's link 4 Rikku is Silenced and used to cast Black Sky (an Arcana spell the old rule let through); she now uses Darkness, and
 * Yuna, also Silenced, can use Pray and Vigor and takes a Remedy instead. Every other seed of the four arrays is unchanged (recomputed, equal): the 19 other `CH5_D0`
 * digests, all twenty `CH4_D0`, all ten `CH4_D1500` and all ten `CH5_D1500`; D = 0 is still 20/20 in both chapters and the Wait arm still equals the D = 0 arrays. The
 * old hash is in git at ab57f082. The menus' other changes (free pairs, passive markers no longer rows, greyed Itch rows, the Special family without Item and Escape) move no
 * digest here: no seed of these two chapters meets them.
 *
 * **RC7 assembly, 2026-10-14** (re-parity-rc7: lane X2-D, the automatic statuses and counters, and lane X2-B, the command menu, merged onto re-parity-rc6-ch2; FFX-2 only;
 * `docs/handoff/re-parity-rc7.md`). Nothing is re-pinned by the merge: the one hash lane X2-B moved (`CH5_D0` seed 4, above) is the only difference from the base in the
 * merged tree, and lane X2-D moves none (a girl who holds no automatic ability has no layer, so no draw, no event and no state changes). The shipped line of all eight
 * FFX-2 chapters over seeds 1 to 500 equals the base in every sum and every seed's outcome except Chapter V's Silence-scope movement (+35 party turns, +3 KOs, wins 490).
 *
 * **Re-pinned a thirteenth time, every array, for the item ledger and the battle-end commit window** (re-parity RC8, lane X2-F row XF1 and lane X2-K row XK2, branch `re-parity-rc8-x2-end-ledger`,
 * 2026-10-15, FFX-2 only; reason "game-code parity", the checked notes FFX2-G06 and FFX2-G10; `docs/handoff/re-parity-rc8-x2-end-ledger.md`). All sixty digests moved. Cause, found by
 * fingerprinting the full event log of every seed before (the base commit's sources) and after and comparing them event by event: **in all sixty the logs are identical up to the base's
 * own last events** (the live status payloads of earlier `status-add` events aside, which keep counting down after the event and so differ at the end of the run) **and differ at the
 * end of the first link**: the end of a fight is now committed only after the casts already on the purple bar have fired (the game's phase-2 drain, exe 0x0061e7a0), so a Cure, a
 * Protect or a Phoenix Down in flight when the last blow lands resolves before the victory (extra `atb`, `status-add`, `action-end`, `damage` and `status-tick` events between the
 * last blow and the `victory`: 1 to 51 events on a Chapter IV D = 0 seed, 3 to 10 on a Chapter V one; the one seed with none, `CH4_D1500` seed 6, differs only in its last `atb` snapshot, where the window had closed a girl's open menu). On the chain arms the later links then start from the state the window left, so
 * they differ from there on. The item ledger alone (the item leaves the stock at the pick) moves exactly one of the sixty, `CH5_D1500` seed 3, whose link 4 differs because
 * Paine can no longer pick the Mega Phoenix another girl's cast has reserved (she picks a Phoenix Down); the other fifty-nine are byte-identical with the ledger alone (measured by
 * dumping the arms with the ledger wired and the window not). Outcomes: Chapter IV is still 20/20 at D = 0 and 10/10 on the Active arm; Chapter V is still 20/20 at D = 0; **the
 * Chapter V Active D = 1500 arm goes from 4/10 to 9/10** (seeds 1, 5, 6 and 7 lose no more; seed 10 is still lost): the heals in flight when a link ends now land before the next link
 * starts. An ablation that stops the window from waiting for a command held back for a chain lock gives the same 9/10, so the cause is the casts in flight, not that rule. The
 * Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays (both asserted below). The old hashes are in git at ea431aa0.
 *
 * **Re-pinned a fourteenth time, every array, for the game's kill rewards** (re-parity RC9 lane X2-C, branch re-parity-rc9-x2-rewards, 2026-10-15, FFX-2 only; reason "game-code parity",
 * the checked note FFX2-G03; `docs/handoff/re-parity-rc9-x2-rewards.md`). The `victory` event carries the result record, and the result is now what the game's reward routine paid
 * at each knock-out (EXP, AP, gil and the item roll; each girl's share in the new `rewardsByMember`), not the sum of every monster's authored rewards, so the payload of that one
 * event differs in every log: Chapter 4's Bahamut pays the same numbers with the new field (and its Gris-Gris Bag from a roll), Chapter 5's Leg link no longer pays the three Nodes it
 * never kills, the Bulwarks stop paying both items and the Head's Redoubts pay only when they fall. Cause, found by ablation: replaying all sixty logs and putting each `victory`
 * result back to what the old `buildResult` made from the same board (the sum of the authored rewards, the Bulwarks' old two entries, no `rewardsByMember`) gives the old digest again for
 * 60 of 60 (CH4_D0 20/20, CH5_D0 20/20, CH4_D1500 10/10, CH5_D1500 10/10): no battle changed, not one event before the victory moved. A knock-out now takes one draw on stream 10
 * (a girl's too) and a drop a draw on stream 11; neither moves any roll in these two chapters, whose intended line steals nothing. Outcomes are unchanged (CH5_D0_OUTCOMES stays).
 * The old hashes (the item-ledger and commit-window pins above) are in git at 6b638df95. The lane built these on r49 (before RC8); r51-rc re-recorded them on the merged tree (RC8 plus this lane), and the ablation was re-run there: every one of the 119 logs equals RC8's pin again with the result put back.
 *
 * **Re-pinned a fifteenth time, one hash (`CH5_D1500` seed 8), for the Vegnagun Core's death entry** (re-parity RC9, lane X2-E, branch `re-parity-rc9-x2-stat-setter`, 2026-10-16, FFX-2 only; reason
 * "game-code parity", the checked note FFX2-G05 section 3.6 and row XE4; `docs/handoff/re-parity-rc9-x2-stat-setter.md`). The Core's script, when the Core is knocked out, sets the hit points of both
 * Bulwarks to 0 through the stat setter (the setter stores the number and runs no knock-out routine), after the action that killed the Core has applied every result. A Bulwark that is down already
 * is unchanged; one that stands is left alive at 0 hit points, where the game's status process skips it (`kernel/status-timers.ts`: no clock, no Regen payout) until the next hit knocks it out.
 * Cause, found by ablation (the entry's two calls removed reproduce the old digest): in Chapter V's link 3, seed 8, Paine's two-hit move kills the Core with its first hit and its second hit
 * lands on the Right Bulwark as before (896 left of 3,000); the old engine let it Regen 93 and Rikku's later hit (2,241) knocked it out at event 910 of 916; it now stands at 0, gets no Regen,
 * and the same hit knocks it out ten events sooner (906 events). Every other seed of the four arrays is unchanged (recomputed, equal): all twenty `CH5_D0` digests, all twenty `CH4_D0`, all
 * ten `CH4_D1500` and the nine other `CH5_D1500`; D = 0 is still 20/20 in both chapters, the Wait arm still equals the D = 0 arrays, and the outcome of seed 8 is still a win. The line this
 * reaches is the Active arm only: at D = 0 both Bulwarks are down when the Core falls on every seed (490 of 490 in the 500-seed measurement), so the entry stores 0 over 0. Over 300 Active
 * seeds of Chapter V nine differ (8, 16, 28, 80, 83, 100, 130, 264 and 273), all still won (244 of 300 in both trees); Chapters IV and VI over 200 Active seeds each: none. The old hash is in git at 748038a0a; on the r51 merge it was re-recorded on the merged tree (RC8 plus the kill rewards plus this lane), where seed 8's digest differs from the lane's own because the kill rewards moved every `victory` payload; the other nineteen arrays keep the kill rewards lane's values, and the ablation (the entry's two calls removed) returns the kill rewards lane's digest for seed 8.
 *
 * **Re-pinned a sixteenth time, every array, for the hit reaction** (re-parity lane X2-A, slice 1, branch `re-parity-rc9-x2-hit-reaction`, 2026-10-16, stacked as `re-parity-rc9-x2-hit-reaction-r52` on r52-rc and the Chapter VI link opening, 2026-10-17, FFX-2 only; reason "game-code parity", the
 * checked note FFX2-G01 section 7 and the live game of 2026-10-13, question Q1; `docs/handoff/re-parity-rc9-x2-hit-reaction.md`). All sixty digests moved: the chain window, the span of the halved tick
 * and the forced hit are each body's own damage clip plus one step (a girl 24 to 51 steps, 0.8 to 1.7 s; Bahamut 52 and 82; Vegnagun's parts 11 to 17) where they were 60 and 90 steps for the window and
 * the forced hit and 15 for the span. Cause: X2-A per-body windows, on top of the link opening; found by ablation (`reaction.ts` knobs, the four arrays recomputed with one part of the slice on): the girls' windows alone, the monsters' windows alone and the
 * halved-tick span with the forced hit alone each move all sixty; the Haste halving alone moves none (no Hasted target is chained in these two chapters). **With the switch off
 * (`CHAIN_WINDOW_PER_BODY`, or `withReactionKnobs(OLD_REACTION)`) the four arrays are the old ones exactly** (recomputed, equal), so the switch restores the base engine byte for byte (release 50 on the branch's own base, r51-rc on the r51 merge, the base 35aa31e77 here). Outcomes:
 * Chapter IV is still 20/20 at D = 0 and 10/10 on the Active arm; Chapter V is still 20/20 at D = 0 (the chain takes 126,455 steps over the 20 seeds where it took 120,045, +5.3 %; Chapter IV 44,791
 * where it took 43,127, +3.9 %); **the Chapter V Active D = 1500 arm goes from 9/10 to 8/10** (seeds 1 and 9 are lost, seed 10 is no longer), ten seeds, disclosed and measured at 500 seeds in the handoff, not tuned.
 * The Wait arm still equals the D = 0 arrays and a Wait engine switched to Active still equals the Active arrays (both asserted below). The old hashes are the base 35aa31e77 (r52-rc 3c92b60cc plus the Chapter VI link opening); they equal r51-rc d6dc0bdd7's, because the link opening moves only Chapter VI's Acts II and III and r52 moved neither chapter. Proof on the merged tree (branch `re-parity-rc9-x2-hit-reaction-r52`, 2026-10-17): with `CHAIN_WINDOW_PER_BODY` forced off for the whole run through a module mock (a vitest setup file; `withReactionKnobs(OLD_REACTION)` is the same switch inside the process), the four arrays: 60 of 60 of the base's hashes come back exactly, and with it on all 60 move. The four new arrays also equal, digit for digit, the ones the lane recomputed on the r51-rc merge (d6dc0bdd7), so the stacking on r52 and the link opening moved none of the sixty.
 */

import { describe, expect, it } from 'vitest';
import { driveChapter4, driveChapter5, logHash } from './helpers/ffx2ChapterDrive.ts';

const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

/** Re-pinned for PR-0075; the pre-change hashes are in git at 1b33971..17b9af2. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for Mega Flare at the game's power 14 (2026-10-09, see the ninth re-pin above); the old hashes are in git at 3663cd3a. Re-pinned a fourth time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH4_D0 = [
  '911ada24be11c668', '88653e45b18896cd', 'cc1d746de1a57bd1', '4100b491f0b3a687', '0e1226e139a6574b',
  '2679f7e9f92f0470', '0a0e4ed5fef47b90', '64274fc47cb9608f', 'f62df706ff0ce1d9', '1f872277ef3155b1',
  'b620811b0e92fd6f', '74bbe96fc33b5086', '77a69c05d95d6d91', '67a2d731381147c9', 'c9258ceb988465c2',
  '48c4d7d43ce00a18', 'ee4d1d5d422f980e', 'ff30eef053b72ada', '78dd0fd9c8170a81', 'bfc8431dafecfb0c',
];

/** Re-pinned for IC-2 + Acta Est Fabula's target (2026-09-26); the old hashes are in git at ea05f877. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH5_D0 = [
  'f088d67c48d6cc10', '3a74b5193adc4161', 'aeca4110de447dc4', '9d515113ea9a9092', '1dd5bc74fe420ad8',
  'e563354e0f016d58', '701eb9b3d45999b7', '95d2d4057334651c', '493c3f8811a9ae86', '96120300b4653b8a',
  '0cc2281806680f27', '9deac322a8b5f735', 'fd64046b73e04c91', '481ac10578d06aac', '00721cd403a9fb6e',
  'a7bc4127664fe3a8', 'dd21bd09c48fe576', '22e687f78936576b', '3b5c33ac11689efe', '4a3a57989f0bb061',
];

/** Re-pinned for the menu-cancel correction (only a Delay / Action-cancel hit closes a menu, 2026-09-26); the old hashes are in git at 63767b5b. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for Mega Flare at the game's power 14 (2026-10-09, see the ninth re-pin above); the old hashes are in git at 3663cd3a. Re-pinned a fourth time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. */
const CH4_D1500 = [
  '5385f128d0bbe00a', '878b4ca5279f18f1', 'ba024bdd4db15f3f', 'bbe8992e5e0a8c83', 'd2be188b084106ca',
  '4a8f56069d683671', 'a0059342190063e5', '27a0eb4946ed27d7', 'b7504fb3289da37e', 'e674ca1bd816d5db',
];
/** Re-pinned for the menu-cancel correction (2026-09-26); the old hashes are in git at 63767b5b. Re-pinned again for re-parity W3 (2026-10-09); the old hashes are in git at 029d49c7. Re-pinned a third time for re-parity W4 (2026-10-10, see the tenth re-pin above); the old hashes are in git at 931613a8. Seed 8 re-pinned a fourth time for the Core's death entry (RC9 X2-E, see the fourteenth re-pin above); its old hash is in git at 748038a0a. */
const CH5_D1500 = [
  'c568c06af2d32d4a', '70c9b63427a29c45', '08d0977e0d1536cb', '0aa149db07fed35b', 'c5aa8074c9904ac5',
  '2dfcb54f91efbb42', '2befeca3f6206c28', '53886a21b2085bed', '2e1fa19a8241c83a', 'ec84435db84ffac6',
];
const SEEDS_10 = SEEDS.slice(0, 10);
/** One letter a seed, W a won chain and d a defeat (every seed wins at D = 0 on the live build, under W4 and in the merged RC3 tree; lane a alone, on the old clock, lost six). */
const CH5_D0_OUTCOMES = 'WWWWWWWWWWWWWWWWWWWW';

describe('FFX-2 golden event logs on the Active path (D = 1500 ms)', () => {
  it('chapter 4 and the chapter 5 chain, seeds 1-10, are byte-identical', () => {
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500)))).toEqual(CH5_D1500);
  }, 120_000);
});

describe('FFX-2 golden event logs at zero decision time (D = 0)', () => {
  it('chapter 4, seeds 1-20, is byte-identical to the pre-change engine and still 20/20', () => {
    const runs = SEEDS.map((s) => driveChapter4(s, 0));
    expect(runs.map(logHash)).toEqual(CH4_D0);
    expect(runs.every((r) => r.outcome === 'victory')).toBe(true);
  }, 120_000);

  it('the whole chapter 5 chain, seeds 1-20, is byte-identical and wins 20/20', () => {
    const runs = SEEDS.map((s) => driveChapter5(s, 0));
    expect(runs.map(logHash)).toEqual(CH5_D0);
    expect(runs.map((r) => (r.outcome === 'victory' ? 'W' : 'd')).join('')).toBe(CH5_D0_OUTCOMES);
  }, 120_000);
});

describe('the Config ATB speed lever at Normal changes nothing (§1.2)', () => {
  it('explicit atbSpeed: "normal" reproduces every golden, D = 0 and D = 1500', () => {
    const normal = { atbSpeed: 'normal' as const };
    expect(SEEDS.map((s) => logHash(driveChapter4(s, 0, normal)))).toEqual(CH4_D0);
    expect(SEEDS.map((s) => logHash(driveChapter5(s, 0, normal)))).toEqual(CH5_D0);
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500, normal)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500, normal)))).toEqual(CH5_D1500);
  }, 180_000);
});

/**
 * **Wait mode** (D-029, 2026-09-22; `docs/plans/ffx2-wait-mode-review.md` §5 I3/I4).
 *
 * Under Wait the clock does not move while a menu is open, so a human who reads
 * every menu for 1.5 s plays **exactly** the auto-battler's fight: the `D = 1500`
 * Wait arm must reproduce the `D = 0` golden byte for byte, and win 20/20.
 * And the mode is a runtime switch: an engine built in Wait and told Active
 * before its first decision must reproduce the Active `D = 1500` golden.
 */
describe('FFX-2 golden event logs under Wait mode (D-029)', () => {
  it('D = 1500 under Wait is byte-identical to D = 0, chapters 4 and 5, seeds 1-20, 20/20 and 20/20', () => {
    const wait = { atbMode: 'wait' as const };
    const ch4 = SEEDS.map((s) => driveChapter4(s, 1500, wait));
    const ch5 = SEEDS.map((s) => driveChapter5(s, 1500, wait));
    expect(ch4.map(logHash)).toEqual(CH4_D0);
    expect(ch5.map(logHash)).toEqual(CH5_D0);
    expect(ch4.every((r) => r.outcome === 'victory')).toBe(true);
    expect(ch5.map((r) => (r.outcome === 'victory' ? 'W' : 'd')).join('')).toBe(CH5_D0_OUTCOMES);
    expect([...ch4, ...ch5].every((r) => r.invalidated === 0 && r.held === 0 && r.refused === 0)).toBe(true);
  }, 180_000);

  it('a Wait engine switched to Active at runtime reproduces the Active D = 1500 golden', () => {
    const wait = { atbMode: 'wait' as const };
    const toActive = (e: { setAtbMode(m: 'active'): void }) => e.setAtbMode('active');
    expect(SEEDS_10.map((s) => logHash(driveChapter4(s, 1500, wait, toActive)))).toEqual(CH4_D1500);
    expect(SEEDS_10.map((s) => logHash(driveChapter5(s, 1500, wait, toActive)))).toEqual(CH5_D1500);
  }, 120_000);
});
