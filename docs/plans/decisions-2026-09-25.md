# Decisions for Bailey, 2026-09-25 (round 12 judgments, pose candidates, judge-locked art)

**Reply with:** "all recommendations", or item numbers with a letter (for example "3 C, 5 A, 12 B").
Items 1, 2 and 8 need your own ears, hands or eyes. "All recommendations" books them, but only you can settle them.

The live build is release 15 (main 5be4babe). The round-12 deep review (critic/rounds/round-12.md) lists nine
judgments only you can make (items 1-9). Items 10-12 cover the new FFX-2 pose paintings and the art sets an
agent locked. Nothing here changes a boss. Nothing is built until you answer.

## 1. Audio: your listening verdict (CHK-B1). Both games
What: audio has no score because nobody has listened to the shipped mix. This is the fifth deep round without one (PR-0148, stalled).
Where: open `docs/audio/audition.html` on this PC in Chrome or Edge (it plays the shipped files, boss-yojimbo included), or play the live game with sound on.
What to listen for: (a) does your 2026-09-21 verdict still hold, that the score sounds like SNES music rather than modern Final Fantasy and Clair Obscur? No cue was re-rendered since then, so the same answer is likely. (b) boss-yojimbo, new in release 15. (c) anything too loud or too quiet, or a loop that clicks.
- A: a number now, for the mix as it ships. B: wait for the re-rendered score.
- **Recommend A: ten minutes, four cues (title, boss-seymour, boss-shuyin, boss-yojimbo), one number out of 10 and one sentence.** A low number is fine. It settles CHK-B1 honestly and gives the re-render work a baseline.
- A yes builds nothing. I record your words in `docs/audio/OWNER-VERDICT.md`.

## 2. A play session on Chapter IX, Yojimbo (CHK-B2). FFX only
What: the critic can measure Chapter IX, but only a person can judge how it feels.
Where: the live site, Chapter IX, keyboard, sound on. One attempt takes about 15 minutes.
What to look at: does the Zanmato gauge build dread? Can you read it? The first menu takes 11.9 s after the scene (PR-0061). Actions are never named on screen (PR-0180). Attack fires without a target step (item 9).
- A: play once and reply in one line. B: skip it for now.
- **Recommend A, in the same sitting as item 1 (Yojimbo's music plays during the fight).** Reply with "IX feels right" or "IX feels wrong because ...".
- A yes builds nothing. Your words are recorded, and anything you name becomes a fix item.

## 3. Chapter V on the default Wait split (PR-0076). FFX-2 only
What: under your Wait default (D-029 follow-up 2) the clock runs while the top command list is open and stops once a list below it is open (research/ffx2-combat-core.md §1.5, single source).
Measured: 39 wins out of 40 when the player opens a list within 0.25 s, 31 at 0.5 s, 7 at 1 s. On live, all three real-key runs were lost at the Head link.
- A: accept the cost as it is.
- B: add the old whole-menu hold as a visible third setting. Not faithful. The brief says help "may never soften" a rule.
- C: a Chapter V guide line that teaches the faithful habit. Draft: "Open a list at once. The clock stops only inside it."
- D: first run the advisor bench (40 seeds, at 0, 1 and 1.5 s) to find out whether the advisor adds to the losses.
- **Recommend C with D.** It keeps the faithful rule and teaches the habit that wins nearly every time. The bench shows whether the advisor needs a separate fix.
- A yes builds: the bench (about 1 hour, no code change), then the one guide line with the wording above (about 1 hour), then a live win captured on the default.

## 4. An enemy hit while a girl's menu is open (PR-0105, D-010). FFX-2 only
What the sources say: ffx2-combat-core §1.1 says being hit while the command menu is open "cancels the menu and delays the turn". §1.5 says the same for Active (single source, Split Infinity G0913).
Today, under the Wait split, a hit leaves her menu open (reproduced in 20 of 20 seeds and on live). Inside a list below the top one the clock is stopped, so a hit can only land while the top list is open.
- A: build the sourced rule in Active and in the Wait split's top list. B: build it in Active only. C: leave it as it is (not faithful).
- **Recommend A.** It is the sourced rule, and "mechanics never bend". Honest risk: Chapters IV, V, VI, XI and XIII get harder for a player who waits at the top list. Item 3's habit avoids both costs.
- A yes builds: the engine change in `src/battle/ffx2/active.ts` with tests, and a Chapters IV-VI bench before and after, shown to you before release (about 3 hours). Combat core, so a deep review follows the deploy.

## 5. Chapter I re-baseline and the first-attempt seed (PR-0008). FFX only, plus shared plumbing
What: two sourced fixes (Poison phase, aeons lose Items) dropped the intended line from 26 to 17 wins in 40, and the advisor to 20.
Seymour is unchanged and must stay so. Every first attempt uses seed 1 (`src/app/screens/BattleScreenFlow.ts:346`; a retry adds 1000), and seed 1 loses both lines.
The seed is our plumbing, not game data.
- A: re-measure the four standard 40-seed sets on today's main and set the test floor 5 wins below that. The guide says plainly that a good run still loses often, and why.
- B: A, and the first attempt also draws a fresh seed, so no new player gets the same loss every time. Tests and critic captures keep fixed seeds.
- C: re-source the Gagazet preset (tagged [estimate]). This is a research job with no sure gain.
- D: leave it open.
- **Recommend B.** It is the smallest step that is honest about a hard fight. It stops every newcomer's first Chapter I from being the same loss, and the odds per attempt do not change.
- A yes builds: bench and test floor (about 1 hour), the seed change (both games; about 1 hour plus a focused review), and two wordings for the guide line, shown to you first.

## 6. The FFX-2 field is mirrored against the approved tile (PR-0035). FFX-2 only
What: the approved "Battle HUD, FFX-2" mockup has Bahamut on the left and the party on the right. The game has the party on the left, as in FFX.
Sources: FFX-2 has free battle positions (research/ffx-vs-ffx2-presentation.md, single source). No source fixes a side. Your note on the tile named only the pink accent.
- A: record it as an accepted adaptation on the tile. B: swap sides in every FFX-2 chapter.
- **Recommend A.** The staging of every FFX-2 chapter is built on the party-left layout, and the new pose candidates all face screen-right. A swap would re-stage Chapters IV, V, VI, XI, XIII and XV for no gain in fidelity.
- A yes builds: a record on the tile in `docs/target/targets.json` (about 10 minutes).

## 7. Victory lines: the banter bank (PR-0021). FFX only
What: Chapters I, II, III and VIII all end on Tidus's "...Okay. Next one." The writing bible already has the lines (research/writing-bible.md §5.4, all our own).
The bible's grim lines are: Tidus "...Okay. Next one.", Yuna "May they rest.", Auron "It isn't over.", Wakka "...Ya. Okay. Ya.", Lulu "Don't celebrate yet.", Kimahri "Kimahri remembers.", Rikku "...Can we not do that again?"
- A: in, small. Chapters I and II rotate these lines among the party on the field. Chapter III shows none, per §5.4's rule for the aeon kills (this also fixes PR-0187). Chapter VIII keeps its line until it is given a tier.
- B: the full bank, with the formation-screen exchanges too. C: out of this milestone.
- **Recommend A.** The lines are already written for these fights. FFX-2 already follows its own rules (Chapter IV stays silent).
- A yes approves those seven lines as written and builds the rotation with tests (about 2 hours).

## 8. Chapter IX mid-battle callouts (D-068). FFX only. Needs your read
What: you adopted the four callouts on the condition that you read the story draft first. This is the part they belong to (docs/plans/yojimbo-story-draft.md lines 86-99):
Lulu at 50 % "He draws the long blade now. Be quick." / Auron at full gauge "Next turn, he kills us all. Move." / Kimahri on Doom "Five breaths. Then gone." / Yuna when an aeon takes Zanmato "Thank you. Rest now."
- A: all four as written (C-1). B: only the Zanmato warning (C-3). C: none (C-2).
- **Recommend A, once you have read the lines above.** Having read them here counts. The whole draft is 153 lines if you want it.
- A yes builds the four lines on the existing story path with tests (about 2 hours). Nothing is built until you say you have read them.

## 9. A command with one valid target skips the target step (PR-0170). Both games
What: when a command has exactly one legal target, the game fires it at once, with no cursor and no way back (`src/ui/ffx/CommandMenuLogic.ts:176`). The FFX-2 menu uses the same function.
In Chapter IX, Attack goes straight to Yojimbo, and being targeted fills his gauge by 3 % (research/ffx-yojimbo.md, single source).
Sources: no research file says what either game does. Neither does the FF Wiki's FFX battle system page (revid 4032396, read today). Memory is not a source, so this is our call.
- A: show the target step whenever the one target is not the actor herself (both games; Defend and other self-only moves stay instant). B: keep the auto-fire. C: FFX only.
- **Recommend A.** Every command then works the same way, you can back out, and the approved target ring shows. No rule changes.
- A yes builds: one change in shared menu logic, tests in both games and a real-key check (about 1 hour, focused review).

## 10. Battle poses for Chapter XIII's line-up. FFX-2 only
What: Yuna and Paine as Dark Knights and Rikku as Alchemist had only an idle. 16 candidates passed the maker's own look (docs/concepts/chapters/trema/poses/README.md). Nothing is installed.
Known faults: the figures stand at 0.75-0.85 of the idle's height and need a scale sidecar. Yuna's helm reads as a cap. Paine's cape is too red and her victory blade reads as a poleaxe.
Rikku's leg strips are missing. The empty slots (Yuna item and hurt, Paine hurt) failed twice.
- A: install the maker's picks now. B: independent judge and scale fix first, then one sheet at game size for your picks. C: leave every slot empty (the idle plus the flinch stays).
- **Recommend B.** The 2026-09-21 poses "look very wrong" and 31 were undone, so these get an independent eye first. Any slot where the judge confirms a fault stays empty.
- A yes builds: the judge and scale sidecars (about 2 hours), then a sheet for you. Only the slots you name get installed and locked. Leave ready and defend unpainted: no party member in either game has them today.

## 11. Battle poses for the other empty FFX-2 slots. FFX-2 only
What: 75 empty slots across 15 dresspheres, 316 renders (docs/concepts/art5/README.md). Nothing is installed.
Live-chapter slots: rikku-dark-knight ko, paine-warrior (6), yuna-gunner item, rikku-thief (6). Rikku Dark Knight's victory failed twice and stays empty.
Known faults: standing figures at about 0.75 of the idle's height. Gunners lose the second pistol. Many hurt poses are weak.
Paine Warrior's boots are red (her idle's are black). Yuna Warrior's hood is up (her idle's is down).
- A: install all the picks. B: item 10's path, for the live-chapter slots only. The rest of the roster waits. C: leave them all empty.
- **Recommend B.** It fixes what players see today and spends nothing on dresspheres no chapter uses. Faulted slots stay empty rather than ship off-model.
- A yes builds: the judge and scale fix for 14 live slots (about 2 hours), then a sheet for your picks.

## 12. Art sets an agent locked without your word on the exact files. Both games, per set
What: `docs/target/approved-hashes.json` should hold only files you approved (Step 0: only your word moves a hash in).
In these sets you picked the option on the sheet, and an agent judge then passed and locked the finished files. Nothing records that you saw those files.
- `chapter:isaaru:2026-09-25`, commit 31acc55c, 12 files (FFX)
- `chapter:omnis:2026-09-25`, e7457293, 5 files (FFX)
- `chapter:trema:2026-09-25`, 7ca01d04 (installed in 6896b272), 5 files (FFX-2)
- `chapter:gippal:2026-09-25`, f6b2c85b, 4 files (FFX-2). Its Den of Woe plate is byte-identical to your pick.
- `chapter:yojimbo:2026-09-24`, f271b37e, 4 files (FFX)
- `chapter:natus:2026-09-24` and `chapter:fallen-aeons:2026-09-24`, bc188dd5, 5 and 10 files (FFX, FFX-2)
- `chapter:fallen-aeons-casts:2026-09-24`, ebe4b11b, 2 repaired casts (FFX-2)
- `chapter:natus-cast:2026-09-24`, 33d93bd6, 1 file (FFX)
- `chapter:yojimbo-casts:2026-09-24`, 8205e682, 2 files (FFX; you later said "Yes install please" for the longer blade, 57352bba)
- These stay yours as they are: sets from sheets that showed the files themselves (Evrae, Macalania, the Leblanc fan, the goons, the Yojimbo plate and sakura, art4).
- A: keep as is. B: relabel. Keep the lock, mark each set "judge-locked" in a separate list the art check still enforces, and show you one contact sheet per chapter when it ships. C: unlock.
- **Recommend B.** The lock still stops files being overwritten, the record becomes true, and your look promotes a set to approved. C loses that protection for no gain.
- A yes builds: the relabel and the check tool reading both lists (about 45 minutes). The sheets come with each chapter's release.
