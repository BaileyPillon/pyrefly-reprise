# Decisions for Bailey, 2026-09-25 (round 12 judgments, pose candidates, judge-locked art)

**Reply with:** "all recommendations", or item numbers with a letter (for example "3 C, 5 A, 12 B").
Items 1, 2 and 8 need your own ears, hands or eyes. "All recommendations" books them, but only you can settle them.

The live build is release 15 (main 5be4babe). The round-12 deep review (critic/rounds/round-12.md) lists nine
judgments only you can make (items 1-9). Items 10-12 cover the new FFX-2 pose paintings and the art sets an
agent locked. Nothing here changes a boss. Nothing is built until you answer.
This sheet was checked adversarially before it went to you; what changed is listed under "Check notes" at the end.

## 1. Audio: your listening verdict (CHK-B1), and the music direction. Both games
What: audio has no score because nobody has listened to the shipped mix. This is the fifth deep round without one (PR-0148, stalled).
Your 2026-09-21 words, recorded in docs/handoff/NOW.md (Build C scope) and quoted in round-12 PR-0148: "music is too reminsicent of snes music instead of the more modern final fantasy titles and clair obscur".
Since then no shipped cue was re-rendered (title, boss-seymour and boss-shuyin are unchanged in git); only new cues were added.
Also still open: the modern-sound direction. The four FFX battle-theme clips (control, A sampled orchestra + hall, B AI restyle, C mix) were sent on 2026-09-22 and never answered. They are in `public/audio/candidates/` (`control-battle-ffx-excerpt.ogg`, `A-battle-ffx-excerpt.ogg`, and so on).
Where: open `docs/audio/audition.html` on this PC in Chrome or Edge (it plays the shipped files, boss-yojimbo included), or play the live game with sound on.
What to listen for: (a) does the SNES verdict still hold? No shipped cue changed, so the same answer is likely. (b) boss-yojimbo, new in release 15. (c) anything too loud or too quiet, or a loop that clicks. (d) which of control / A / B / C sounds like the direction you want.
- A: a number now, for the mix as it ships, plus the direction pick. B: wait for the re-rendered score (it cannot start until the direction is picked).
- **Recommend A: fifteen minutes in one sitting. Four cues (title, boss-seymour, boss-shuyin, boss-yojimbo), one number out of 10 and one sentence, then the four clips and one letter.** A low number is fine. It settles CHK-B1 honestly, gives the re-render a baseline and tells it which way to go. I make no pick for you on the direction: agents cannot hear.
- A yes builds nothing. I record your words in `docs/audio/OWNER-VERDICT.md` and the pick as a decision record.

## 2. A play session on Chapter IX, Yojimbo (CHK-B2). FFX only
What: the critic can measure Chapter IX, but only a person can judge how it feels.
Where: the live site, Chapter IX, keyboard, sound on. One attempt takes about 15 minutes.
What to look at: does the Zanmato gauge build dread? Can you read it? The first menu takes 11.9 s after the scene (PR-0061). Actions are never named on screen (PR-0180). Attack fires without a target step (item 9).
- A: play once and reply in one line. B: skip it for now.
- **Recommend A, in the same sitting as item 1 (Yojimbo's music plays during the fight).** Reply with "IX feels right" or "IX feels wrong because ...".
- A yes builds nothing. Your words are recorded, and anything you name becomes a fix item.

## 3. Chapters V and VI on the default Wait split (PR-0076). FFX-2 only
What: under your Wait default (D-029 follow-up 2) the clock runs while the top command list is open and stops once a list below it is open (research/ffx2-combat-core.md §1.5, single source). Aiming at a target holds it too (follow-up 2 part B, our reading).
Measured on 5be4babe (round 12 §3, 40 seeds, time spent on the top list): Chapter V wins 39 of 40 at 0.25 s, 31 at 0.5 s (about the 32/40 you accepted when you turned the split on), 7 at 1 s. Chapter VI loses the same way: 40, 37, 29, 11 and 4 of 40 from 0 to 2.5 s. Chapter IV wins 40/40 at every speed. On live, all three real-key Chapter V runs were lost at the Head link.
- A: accept the cost as it is.
- B: add the old whole-menu hold as a visible third setting. Rejected: brief rule 1 "Mechanics never bend"; the brief's "a better explanation, never a simpler rule"; and your own words on 2026-09-22 22:05, "It's fine if it's faithful".
- C: a guide line that teaches the faithful habit, in the Chapter V and Chapter VI guides. Draft, in D-121's words: "Open a list at once. On the top list, the clock still runs." Chapter XI reuses Chapter V's party and has no guide yet; it gets the same line when its guide is written.
- D: first run the advisor bench (40 seeds, at 0, 1 and 1.5 s, Chapters V and VI) to find out whether the advisor adds to the losses.
- **Recommend C with D.** It keeps the faithful rule and teaches the habit that wins: a list opened within a quarter second wins 39 of 40, within half a second about 31. Past a second the fight is mostly lost, and the line says so plainly. The bench shows whether the advisor needs a separate fix.
- A yes builds: the bench (about 1 hour, no code change), then the line in two guides (about 1.5 hours), then a live win captured on the default.

## 4. An enemy hit while a girl's menu is open (PR-0105, D-010). FFX-2 only
What the sources say: ffx2-combat-core §1.1 says being hit while the command menu is open "cancels the menu and delays the turn". §1.5 says the same for Active: it "closes the menu and applies Delay effect" (single source, Split Infinity G0913).
How much the turn is delayed by an ordinary hit is **not sourced**. §2.8 says a Delay effect empties a "predetermined percentage" set per ability, and no source gives one for a plain hit.
Today, under the Wait split, a hit leaves her menu open (reproduced in 20 of 20 seeds and on live). Inside a list below the top one the clock is stopped, so a hit can only land while the top list is open.
- A1: close the menu on a hit, in Active and in the Wait split's top list (sourced). With no delay she is back at a full bar, so she loses her open list, not time.
- A2: A1 plus a delay of a labelled [estimate] size. Needs your yes on that number, and a research pass looks for a sourced one first.
- B: A1 in Active only. C: leave it as it is (not faithful).
- **Recommend A1.** It is the sourced part of the rule, and "mechanics never bend". A2 waits until a source gives the size or you accept an estimate. Honest risk: Chapters IV, V, VI, XI and XIII get harder for a player who waits at the top list. Item 3's habit avoids it.
- A yes builds: a paper preflight first (combat core, deep class, rule 15), then the engine change in `src/battle/ffx2/active.ts` with tests, and a bench of all five chapters (IV, V, VI, XI, XIII) before and after, shown to you before release (about 4 hours). A deep review follows the deploy.
- **Real-game check, 2026-09-25 (FFX-2 Steam HD Remaster):** blocked before play, no FFX-2 save on the machine, so what the game does on a hit to an open menu was **not observed**. Any FFX-2 save that can start a battle would answer it. Record: `research/observed-trema-steam-2026-09-25.md`.
- **2026-09-26: A1 superseded by D-198 (menu-cancel correction ON).** `research/ffx2-combat-core.md` §9.2 (ea05f877) corrected §1.1: Split_Infinity ties the menu cancel to Delay-effect and Action-cancel abilities (G1041, G1042), not to every hit (raised as PR-0210). Asked "Menu-cancel correction: 'menu correction on' (my recommendation), or keep it as is.", Bailey answered ~11:30 EDT "I’ll take all your recommendations". Now only a Delay or Action-cancel enemy ability closes an open FFX-2 command menu; a plain hit leaves it open. Built on branch `r20-menu-cancel` (3cd0a1d1), merged to main 39afccf9; A1 stays reachable with the engine option `menuCancelOnlyDelayAbilities: false`. Measured 200 seeds, off -> on, Wait split V 175 -> 181, VI 159 -> 157, XI 157 -> 164, XIII 16 -> 13, XV 34 -> 36; Active V 29 -> 90, VI 13 -> 31, XI 95 -> 116, XIII 7 -> 13, XV 6 -> 13. D-171 is kept, marked superseded. FFX-2 only.

## 5. Chapter I re-baseline and the first-attempt seed (PR-0008). FFX only, plus shared plumbing
What: two sourced fixes (Poison phase, aeons lose Items) dropped the intended line from 26 to 17 wins in 40, and the advisor to 20. The 40-seed test floor was already lowered to 15 on 2026-09-25.
Seymour is unchanged and must stay so. Every first attempt uses seed 1 (`src/app/screens/BattleScreenFlow.ts:346`; a retry adds 1000), and seed 1 loses both lines.
The seed is our plumbing, not game data. PR-0008 is stalled (third review open), so a fresh method check comes first: `docs/plans/pr-0008-method-check.md` dates from the 26/40 era (its "about 3 fights in 8" is stale).
- A: refresh the method check on today's main over its four standard windows (160 seeds), then set the 160-seed floor 5 wins below that measure (the 40-seed floor stays at 15). The guide is fixed in one pass and you see one set of wordings: it says plainly that a good run still loses often, and why; rule 4 stops calling Protect a defence against the Dispel and Cross Cleave (research §4.2 says Protect is stripped first); and PR-0007's Holy Water wording goes in the same pass.
- B: A, and the first attempt also draws a fresh seed, so no new player gets the same loss every time. Tests and critic captures keep fixed seeds.
- C: re-source the Gagazet preset (tagged [estimate]). This is a research job with no sure gain.
- D: leave it open.
- **Recommend B.** It is the smallest step that is honest about a hard fight. It stops every newcomer's first Chapter I from being the same loss, and the odds per attempt do not change.
- A yes builds: the method-check refresh and floor (about 1.5 hours); the seed change (both games; about 1 hour plus a focused review). The seed also feeds `preloadBattle(chapter, opts.seed ?? 1)` (`BattleScreenFlow.ts:304`), and there is no URL seed switch, so the live critic route gets a `__pyrefly.setSeed(1)` step to stay fixed. Then the guide wordings, shown to you first.

## 6. The FFX-2 field is mirrored against the approved tile (PR-0035). FFX-2 only
What: the approved "Battle HUD, FFX-2" mockup has Bahamut on the left and the party on the right. The game has the party on the left, as in FFX.
Sources: FFX-2 has free battle positions (research/ffx-vs-ffx2-presentation.md, single source). No source fixes a side.
Nothing records your words on this tile. Its note ("Pink replaces gold ...") is an agent's caption from 2026-09-20, and under your rule a pick approves only what you name. So the side was never something you picked.
- A: record it as an accepted adaptation on the tile. B: swap sides in every FFX-2 chapter.
- **Recommend A.** The staging of every FFX-2 chapter is built on the party-left layout, and the new pose candidates all face screen-right. A swap would re-stage Chapters IV, V, VI, XI and XIII for no gain in fidelity.
- A yes builds: a record on the tile in `docs/target/targets.json` (about 10 minutes).

## 7. Victory lines: every chapter shows the same speaker's first line (PR-0021). Both games (shared results screen)
What: the lines already exist in code, 2 to 3 per character per chapter (`src/story/scripts/<chapter>.ts`, `victoryQuips`). The bug is in the shared results screen (`src/app/screens/ResultsScreen.ts:133-135`): the speaker is always the first row, and the line is always that speaker's first. So Chapters I, II and III all end on Tidus's "...Okay. Next one.", Chapter VIII on his "Okay. Next one.", and Chapter VI always on Yuna's "We got it back."
The grim first lines (research/writing-bible.md §5.4, all our own) are: Tidus "...Okay. Next one.", Yuna "May they rest.", Auron "It isn't over.", Wakka "...Ya. Okay. Ya.", Lulu "Don't celebrate yet.", Kimahri "Kimahri remembers.", Rikku "...Can we not do that again?"
Because the screen is shared, a fix also changes who speaks in Chapters V, VI and VIII (and VII when it opens). Their first lines, which would start to show:
V: Yuna "...Let's go home.", Rikku "That one wasn't fun.", Paine "...Yeah." VI: Yuna "We got it back.", Rikku "Gullwings one, Syndicate nothing!", Paine "Predictable."
VIII: Tidus "Okay. Next one.", Wakka "Ya! That is how you do it!", Lulu "Stone Ward. Now that it is over.", Rikku "Ha! Bad dog!", Auron "A guard. Nothing more.", Kimahri "It fell. Good."
- A: in, small. The speaker rotates among the party on the field; each speaker says the first line of their bank (the lines above, nothing else). Chapter III shows none: our reading of §5.4, whose no-quip rule names "E4's aeon kills" while its table lists E4 as grim. That is our call, not the source's (PR-0187 says "partly interpretive").
- A+: A, and the second and third lines rotate too. You would see every pooled line first (they include lines that are not in §5.4, such as "That didn't feel like winning." and "Ronso do not forget.").
- B: the full bank, with the formation-screen exchanges too. C: out of this milestone.
- **Recommend A.** A yes approves exactly the lines on this page. FFX-2's silent chapters (IV, XIII) and Chapter IX stay silent.
- A yes builds: a short method check first (PR-0021 is stalled, rule 15), then the rotation in the shared results screen with tests in both games (about 2.5 hours).

## 8. Chapter IX mid-battle callouts (D-068). FFX only. Needs your read
What: you adopted the four callouts on the condition that you read the story draft first. This sheet narrows that condition: reading these four lines counts, instead of the whole draft (docs/plans/yojimbo-story-draft.md lines 86-99):
Lulu at 50 % "He draws the long blade now. Be quick." / Auron at full gauge "Next turn, he kills us all. Move." / Kimahri on Doom "Five breaths. Then gone." / Yuna when an aeon takes Zanmato "Thank you. Rest now."
One read for you: Lulu's "long blade" is the Wakizashi (research/ffx-yojimbo.md: the stronger strike, 28 against Kozuka's 16). A real wakizashi is the short sword; it is only longer next to the Kozuka. Keep it, or change the word.
- A: all four as written (C-1). B: only the Zanmato warning (C-3). C: none (C-2).
- **Recommend A, once you have read the lines above.** The whole draft is 153 lines if you want it.
- A yes builds the four lines on the existing story path with tests (about 2 hours). Nothing is built until you say you have read them.

## 9. A command with one valid target skips the target step (PR-0170). FFX first
What: when a command has exactly one legal target, the game fires it at once, with no cursor and no way back (`src/ui/ffx/CommandMenuLogic.ts:176`). The FFX-2 menu uses the same function.
In Chapter IX, Attack goes straight to Yojimbo, and being targeted fills his gauge by 3 % (research/ffx-yojimbo.md, single source).
Sources: no research file says what either game does. Neither does the FF Wiki's "Final Fantasy X battle system" page (revid 4032396). Memory is not a source, so this is our call.
In FFX-2 it is not a pure menu change: under the Wait split aiming holds the clock, so a new target step adds a clock hold to every single-target command; under Active it opens a window where item 4's rule can fire.
- A: show the target step whenever the one target is not the actor herself, in both games (Defend and other self-only moves stay instant). B: keep the auto-fire. C: A in FFX only; FFX-2 decided later, with item 3's and item 4's benches run with the change in.
- **Recommend C.** FFX gets the same flow for every command, a way back and the approved target ring, with no timing effect (FFX is turn-based). FFX-2 waits for numbers.
- A yes builds: the change in shared menu logic behind a per-game switch, FFX tests and a real-key check (about 1 hour, focused review).
- **Real-game check, 2026-09-25 (FFX-2 Steam HD Remaster):** blocked before play, no FFX-2 save on the machine, so whether FFX-2 shows a target cursor for one valid target was **not observed**; C's "FFX-2 decided later" still stands. Record: `research/observed-trema-steam-2026-09-25.md`.

## 10. Battle poses for Chapter XIII's line-up. FFX-2 only
What: Yuna and Paine as Dark Knights and Rikku as Alchemist had only an idle. 15 slot picks passed the maker's own look (Yuna 4, Paine 5, Rikku 6; docs/concepts/chapters/trema/poses/README.md). Nothing is installed.
Known faults: the figures stand at 0.75-0.85 of the idle's height and need a scale sidecar. Yuna's helm reads as a cap, and her eye colours are swapped on the attack pick (cand-6). Paine's cape is too red and her victory blade reads as a poleaxe.
Rikku's leg strips are missing. The empty slots (Yuna item and hurt, Paine hurt) failed twice.
- A: install the maker's picks now. B: independent judge and scale fix first, then a sheet for your picks. C: leave every slot empty (the idle plus the flinch stays).
- **Recommend B.** Twice before, pictures that looked fine small did not hold up: the 31 art4 poses you approved from small contact sheets were undone after you saw them at full size ("a huge downgrade in quality"). So the sheet shows each pick at 1:1 beside the idle, and at game size. Any slot where the judge confirms a fault stays empty.
- A yes builds: the judge and scale sidecars (about 2 hours), then the sheet. Only the slots you name get installed and locked. Leave ready and defend unpainted: no party member in either game has them today.

## 11. Battle poses for the other empty FFX-2 slots. FFX-2 only
What: 75 empty slots across 15 dresspheres, 316 renders (docs/concepts/art5/README.md). Nothing is installed.
Which slots players can reach: a spherechange moves a girl one link along her Garment Grid (`src/battle/ffx2/setup.ts` fills the nodes, the grids are rings), and the art swaps to match. Chapter VI deliberately puts Yuna's Songstress, Rikku's Black Mage and White Mage and Paine's White Mage one link from the start.
Worked through for Chapters IV, V/XI, VI and XIII on today's builds, changing more than once reaches 63 of the 75 slots. Only Rikku's Berserker and Paine's Samurai (12 slots) are out of reach. Rikku Dark Knight's victory failed twice and stays empty.
Known faults: standing figures at about 0.75 of the idle's height. Gunners lose the second pistol. Many hurt poses are weak.
Paine Warrior's boots are red (her idle's are black). Yuna Warrior's hood is up (her idle's is down).
- A: install all the picks. B: item 10's path for every reachable slot, the ones one link from a start first. Berserker and Samurai wait. C: leave them all empty.
- **Recommend B.** It fixes what players can see today. Faulted slots stay empty rather than ship off-model, and each pick is shown at 1:1 beside the idle, as in item 10.
- A yes builds: the judge and scale fix for the reachable slots (about 5 hours; the first sheet, for the one-link slots, after about 2), then sheets for your picks.

## 12. Art sets an agent locked without your word on the exact files. Both games, per set
What: `docs/target/approved-hashes.json` should hold only files you approved (Step 0: only your word moves a hash in).
In these sets you picked the option on the sheet, and an agent judge then passed and locked the finished files. Nothing records that you saw those files.
- `chapter:isaaru:2026-09-25`, commit 31acc55c, 12 files (FFX)
- `chapter:omnis:2026-09-25`, e7457293, 5 files (FFX)
- `chapter:trema:2026-09-25`, 7ca01d04 (installed in 6896b272), 5 files (FFX-2)
- `chapter:gippal:2026-09-25`, f6b2c85b, 3 of its 4 files (FFX-2). Its Den of Woe plate is byte-identical to your pick, so it stays yours.
- `chapter:yojimbo:2026-09-24`, f271b37e, 4 files (FFX)
- `chapter:natus:2026-09-24` and `chapter:fallen-aeons:2026-09-24`, bc188dd5, 5 and 10 files (FFX, FFX-2)
- `chapter:fallen-aeons-casts:2026-09-24`, ebe4b11b, 2 repaired casts (FFX-2)
- `chapter:natus-cast:2026-09-24`, 33d93bd6, 1 file (FFX)
- `chapter:yojimbo-casts:2026-09-24`, 8205e682, 1 file: Daigoro's cast. Yojimbo's longer-blade cast stays yours: you saw its in-battle frame and said "Yes install please" (D-131, D-132, 57352bba).
- These stay yours as they are: sets from sheets that showed the files themselves (Evrae, Macalania, the Leblanc fan, the goons, the Yojimbo plate and sakura, art4).
- One to look at: the Yojimbo plate is an upscale of the option you picked, not the same bytes, and has no judge report. It stays on your list unless you say otherwise.
- A: keep as is. B: relabel. Keep the lock, mark each set "judge-locked" in a separate list the art check still enforces, and show you one contact sheet per chapter when it ships. C: unlock.
- **Recommend B.** The lock still stops files being overwritten, the record becomes true, and your look promotes a set to approved. C loses that protection for no gain.
- A yes builds: the relabel and the check tool reading both lists (about 45 minutes). The sheets come with each chapter's release.

## Check notes
An adversarial check of this sheet (from 335a1bcc) kept items 2 and 8 and asked for changes to the other ten. Every change was re-read against its source and applied: 1, 3, 4, 5, 6, 7, 9, 10, 11, 12, plus 8's two notes. Where I went further or chose between options:
- 5 (b): the guide already has a Holy Water rule (since 38b0723a); the pass carries PR-0007 option A's wording of it, per the method check's review.
- 7 (b): of the two fixes offered (trim the pools, or show every pooled line), A takes first lines only, so a yes approves exactly the lines on this page; A+ is the second. The shared fix also touches Chapters V and VII (added to the check's VI).
- 9: of the two paths offered (bench FFX-2 first, or C first), C is now the recommendation. The FF Wiki claim is verified: api.php parse of oldid 4032396 returns "Final Fantasy X battle system", and nothing in its text covers one-target auto-fire.
- 11: the check re-derived one link from the start. A spherechange moves her node (`spherechange.ts:109`), so repeated changes reach the whole ring. Measured on the data grid registry, that is 63 of 75 slots, and the cost grew to match.
- 4: the added cost includes the rule-15 paper preflight, and the bench covers all five named chapters, so the estimate grew from 3 to 4 hours.
- No change rejected.
