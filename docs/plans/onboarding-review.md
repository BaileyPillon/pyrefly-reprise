# Paper critique: onboarding (cold open + taught first chapter)

Critic design review, 2026-09-19. Verdict: **revise**. Required changes first.

## 1. REQUIRED 1 — Bind both taught chapters to the chapters Bailey just commissioned, and key coach marks by mechanic, not by chapter

**Why:** Verified: src/data/encounters.ts has exactly five chapter ids (seymour-flux, yunalesca, braskas-final-aeon, ffx2-bahamut, ffx2-vegnagun-shuyin). The plan's FFX lesson list — Steal on the Guado Guardians, elemental cycling, Shiva against Anima — is Macalania content and none of it exists at Gagazet (src/data/ffx/builds/gagazet.ts). Its FFX-2 list (charge, recovery, chains, Garment Grid gates) is taught on Bahamut, whose build (src/data/ffx2/builds/bevelle.ts) is ~level 25 with mature dresspheres and stonehewn gates — a board a first-timer cannot read. In the same request Bailey commissioned Seymour + Anima at Macalania Temple and the Leblanc Syndicate 'which doubles as the X-2 tutorial chapter', so the two correct hosts are now funded work, not speculation. Built against Gagazet and Bahamut, every FFX and FFX-2 coach mark is authored twice. Canon story order also moves 'the first chapter' twice: Macalania < Evrae < Gagazet.

**Change:** Bind the FFX taught chapter to Macalania and the FFX-2 taught chapter to Leblanc, and ship each chapter's coaching inside that chapter's own handoff. Meanwhile make the mark set keyed by MECHANIC (turn order changed, first Overdrive ready, first Steal offered, first spherechange, first chain) so it fires wherever the situation first arises; the taught chapter is only where the situation is guaranteed early. Nothing about Steal, Shiva or elemental cycling is authored before Macalania data lands.

## 2. REQUIRED 2 — Item (D) is the largest piece of work in the plan, not one sentence, and it has no data to read

**Why:** Verified: AbilityDef (src/battle/common/types.ts:1309) has id, name, game, category, mpCost, rank, chargeTicks, recoveryTicks, power, formula, damageType, element, targeting, hits, statusEffects — and no description or effect string. Only ItemDef carries a description. grep -c description over src/data/ffx/abilities/*.ts returns 0 on every file, across ~141 ability records plus the whole FFX-2 dressphere ability set. 'The info slab says what the highlighted command does' is therefore several hundred new canon-checked strings, each of which is a panel naming an action and so falls under CHK-004 and CHK-007.

**Change:** Add an optional help field to AbilityDef (additive contract change → docs/CONTRACT-CHANGES.md per hard rule 2). Generate a default line from the def's own fields (element, power band, status applied, targeting, rank/charge) so no leaf row is ever blank, hand-write only the rows the generator cannot say honestly, and run CHK-007's citation grep over the generated copy. Give targeting its own surface so it stops hijacking the slab (issue #27). Budget this as its own track, ahead of the cold open.

## 3. REQUIRED 3 — 'The queue answers before you commit' is FFX-only; do not give FFX-2 a turn queue

**Why:** Bailey's approved list and item (D) are being read as the same thing. They are not. FFX's CTB list already previews the recalculated order — src/ui/ffx/CommandMenu.ts:134 previewRank, src/ui/ffx/CtbList.ts:68 'the queue re-renders on every previewRank' — and that preview is canon FFX. FFX-2 has no queue at all; the same signature returns AtbSnapshot (FFXBattleHud.ts:281). Applying a turn-order preview to FFX-2 would be exactly the cross-contamination Bailey forbade in this request.

**Change:** In FFX: make the existing previewRank visible and legible (that is the approved 'queue answers' item) and add (D)'s effect line beside it. In FFX-2 the true equivalent is the cost on the gauge — show the highlighted command's charge and recovery against the character's own ATB bar, plus the chain window, and never a queue. State this split in the plan so the builder cannot blur it.

## 4. REQUIRED 4 — Fix the three open text defects before adding a sixth text surface to the HUD

**Why:** The FFX battle HUD already runs the strategy guide, the move advisor, the enemy-intent slab, the telegraph banner and the message bar. Round-02 leaves #26 (research citations '[ffx-seymour-flux §4.6]' printing in the intent slab — triggers the Part B 8.0 cap), #27 (info slab absent on every leaf row) and #29 (guide hard-clips mid-sentence, no scrollbar) open, plus Bailey's own 2026-09-18 stale Ronso Rage banner. The plan reuses that plumbing and stacks a sixth surface on it, at 1280×720 and on a phone, where CHK-003's 14px floor still has no live measurement on any screen.

**Change:** Land #26, #27 and #29 first — they are the cheapest teaching in the game and carry no new Part C exposure. Then give coaching a hard text budget: at most ONE teaching surface on screen at a time; a coach mark suppresses the advisor card and any mid-battle bark for its beat; every mark is measured against src/ui/ffx/hudSafeZones.ts at 1280×720, 1600×900 and 390×844 before it ships (CHK-008).

## 5. REQUIRED 5 — The plan's own verification cannot run on today's build: Chapter 4 never reaches results and post-battle scenes play zero lines

**Why:** Round-02 blocker #1: ffx2-bahamut is won and then frozen — turn 75, boss at 0/8400, screen still 'battle' at t+303s (critic/rounds/round-02/live-timing.out). That is the plan's current FFX-2 taught chapter. Blocker #4: post-battle scenes in Chapters 1, 2 and 3 play zero lines (CutsceneRunner.ts:320 returns and the run ends). The Onboarding rubric row explicitly requires the player 'understand why they won or lost', and a first-time-player pass that cannot reach a results screen or a post-scene cannot grade it. Round-02 also records that the first-time-player pass was not run at all (#45).

**Change:** Declare #1 and #4 as hard blockers on this feature's verification, not as parallel work. The verification pass is scheduled only after a cold run reaches results in all five chapters on the production bundle.

## 6. REQUIRED 6 — Coaching behaviour must differ per game, and the plan's open question already has a canon answer

**Why:** Bailey's rule in this request is that an FFX-true change must not land in FFX-2 and vice versa. FFX's CTB waits for input by definition and FFX's own in-battle teaching halts the fight, so a mark that holds the turn is true to FFX. FFX-2 is real-time and its teaching lives OUT of battle — Shinra's tutorials on the Celsius, already cited in the shipped data (src/data/ffx2/garment-grids/early.ts:30, obtained: "Any chapter, view Shinra's Garment Grid tutorial on the Celsius"). Freezing an Active-mode X-2 fight to teach is the one thing X-2 never does.

**Change:** FFX: a coach mark holds the turn until a confirm press. FFX-2: never freezes gauges — non-blocking, rendered beside the party rows, and the Active/Wait setting that already exists (Settings.ffx2Atb, src/app/SaveData.ts, default 'active') is offered ONCE at the taught chapter's start in X-2's own voice, with whatever the player picks respected thereafter. Write both behaviours into the plan; do not leave it as an open question for the builder.

## 7. REQUIRED 7 — No off switch and no seen-set exist, and an existing save would coach the owner on his own game

**Why:** Verified: Settings in src/app/SaveData.ts carries masterVolume, musicVolume, sfxVolume, textSpeed, skipSeenCutscenes, lowEffects, reduceMotion, guideVisible, advisorVisible, intentVisible, ffx2Atb, pausePanelsHidden — and nothing for coaching. migrate() has no seen-set. Bailey's save has cleared chapters; the first time he replays the taught chapter he gets the whole course. The constraint 'everything skippable and never shown again' needs storage the plan does not add, and 'first launch only' has no defined behaviour when localStorage is blocked — a private window would replay the cold open on every visit.

**Change:** Bump SAVE_VERSION; add coachMarks: 'on' | 'off' (default 'on') and seenCoachMarks: string[]; in migrate(), any save with a cleared chapter is a veteran — mark every id seen and coachMarks off. The first mark of a run carries exactly one other affordance: turn coaching off. When storage is unavailable, show the cold open once per SESSION, never per navigation.

## 8. REQUIRED 8 — A first-launch overlay intercepts every automated boot, including the critic's own captures

**Why:** Playwright specs, tools/screenshot.mjs, the art-watch gallery and every Part C composite run on fresh browser profiles, which is exactly the first-launch condition. A 20–30 s cold open in front of the title would front every capture and every e2e run. Part C scores the build beside its approved target 'with nothing added', so the suppression is not a convenience — without it the feature poisons its own evidence (CHK-016: a screenshot is evidence only when the harness asserted what is in it).

**Change:** Ship suppression WITH the feature, not after: a ?coach=off URL parameter plus __pyrefly.setCoaching(false) and __pyrefly.markCoachSeen() added to src/debug/api.ts (installDebugApi at :187), set in playwright.config.ts and in the critic harness. Plus one spec that boots cold twice on a real profile and asserts the cold open plays on boot one, never on boot two, and that with coaching off nothing appears anywhere in either game.

## 9. REQUIRED 9 — Every surface here is player-facing with no approved target; only two of seven are being mocked

**Why:** Verified against docs/target/targets.json: the presentation group holds 11 approved and 2 rejected tiles, and there is no tile for a cold open, a coach mark, a controls reference, a glossary, a recommended-chapter card or the command info slab. The 'fight' group is four gap tiles; 'phone' is gap + verdict. A cold open over the approved title painting and a persistent mark on the approved battle HUD are both 'something added that the target does not show' (Part C, Presentation, weight 30) and trip the Part C 8.0 cap for a player-facing feature started after 2026-09-18 with no approved target. AGENTS.md hard rule 9 covers all of them; the plan mocks only the cold open and 'a coach mark'.

**Change:** Before any code, produce 2–3 options each and get Bailey's yes for: the cold open, a coach mark in FFX gold AND one in FFX-2 pink (different chrome, so both), the controls reference page, the glossary page, the taught-chapter recommended card, and (D)'s info slab in both games — each with a 390×844 variant. Record every pick in targets.json in Bailey's own words with the date.

## 10. REQUIRED 10 — Nothing gates chapter order, so the first-timer this plan exists for can start at Yu Yevon and be taught nothing

**Why:** Verified: no lock/unlock logic anywhere in src/app/screens/ChapterSelectScreen.ts or src/ui/common/chapterPanel.ts. A friend opening the link can pick Chapter 3 (Braska's Final Aeon → Yu Pagodas → Yu Yevon) or Chapter 5 first — the most cinematic cards on the board — and those chapters carry Zombie/Full-Life and Mega Death semantics that punish a player nobody told. Teaching bound to one chapter per game delivers zero coaching in exactly the case the plan was written for.

**Change:** Answer the third open question YES: flag the taught chapter as RECOMMENDED / START HERE on its chapter-select card with one line saying why, and do not hard-lock anything (locking is not canon here and Bailey has not approved it). Combined with REQUIRED 1's mechanic keying, a player who jumps to Chapter 3 still gets the turn-order and Overdrive marks.

## 11. REQUIRED 11 — The cold open promises 'the real key glyphs' from a table that only knows PlayStation faces, and tells a phone player to press a key

**Why:** Verified: src/ui/common/ControlsHint.ts hardcodes Cross, Circle, L1 with no device detection, so a first-timer on an Xbox pad (the common case on a Windows desktop) is told to press Cross on the screen whose whole job is approachability. Verified: src/app/Input.ts registers keydown, keyup, blur, click, gamepadconnected/disconnected — no touch or pointerdown path — and src/ui/ffx/ffx-hud.css has no media query. The premise is a link sent to friends, a large share of whom open it on a phone, where 'press a key any time for the reference' and a mark that 'points at the control' are both dead copy.

**Change:** One shared controls table read by the cold open, the coach marks, ControlsHint and the reference page, so they can never disagree (CHK-004 puts controls hints in scope). Detect pad layout from Gamepad.id and swap faces, or print both ('confirm — A / ✕'). And decide the phone case explicitly in the plan: either detect no-keyboard and show one honest line ('best on a desktop browser with a keyboard or a gamepad'), or write every mark device-neutral and give the reference a tap target. Do not ship key-only copy as the game's first sentence.

## 12. REQUIRED 12 — 'Time to first deliberate action under 60 seconds' is unreachable today, and this plan adds 20–30 s to the front of it

**Why:** Round-02 #30: Chapter 1's pre-scene is 24 beat/wait steps totalling 38.6 s plus 12 camera moves, Enter cannot fast-forward (DialogueBox.handleInput returns early when typingState === 'idle'), SKIP SCENE is the 8th pause row and skipSeenCutscenes is declared in Settings but dead. A cold open in front of that puts first input past two minutes, and the plan's own verification then fails on a defect the plan does not own.

**Change:** Name #30 as a dependency that lands first (Enter advances holds, SKIP printed on the hint bar, skipSeenCutscenes wired). Measure the 60 s from the chapter card, not from page load, and give the taught chapter's card two entries: 'Play the scene' and 'Straight to the fight'.

## 13. REQUIRED 13 — Nothing teaches a loss, which is half the Onboarding rubric row

**Why:** The Onboarding and teachability row (weight 10) requires the player 'understand why they won or lost'. The plan has no defeat-screen line at all — no explanation of Zombie blocking a Phoenix Down, an ignored Countdown, or a Lance of Atrophy into Full-Life — and the defeat screen is still a gap tile on the end-state board. A first-timer sent this link will lose before they win.

**Change:** Add a defeat line to the plan: the defeat screen names, in the game's own words, the one thing that killed the party and what to try instead, per game (FFX: status semantics and turn order; FFX-2: the countdown and chain loop). Mock it with the other surfaces in REQUIRED 9.

## 14. REQUIRED 14 — Name what is on screen, not the wiki's acronym

**Why:** Verified: neither 'CTB' nor 'ATB' appears in any player-facing string — the only hits in src/ui and src/app are code comments (damageLadder.ts, DamageNumbers.ts, chapterPanel.ts). Those are developer and community names; research/ffx-combat-core.md uses 'CTB' as a research heading, not as player copy. A veteran who opens a coach mark headed CTB is reading a wiki, which is the exact patronising register the plan says it wants to avoid, and CHK-007 forbids developer vocabulary in player copy.

**Change:** Coach marks and the info slab say 'turn order', 'the gauge', 'Overdrive', 'aeon', 'dressphere', 'Garment Grid' (the last four are in-game words and stay). 'Conditional Turn-Based (CTB)' and the ATB naming live in the glossary entry, where a term belongs.

## 15. OPTIONAL — Hang the reference and glossary off Bailey's already-approved presentation work rather than inventing chrome

**Why:** The presentation group already has 11 approved Ink & Gold tiles. A reference page that reuses the approved pause-panel and chapter-dossier chrome is cheaper to mock, cheaper to approve and carries less Part C risk than a new page style.

**Change:** Draw the reference and glossary options as pause panels first; only propose a bespoke page if Bailey rejects that.

## 16. OPTIONAL — Let the cold open carry the two-games answer, and reuse it as the link preview

**Why:** Round-02 #33: index.html has no og:*, no twitter:*, no favicon, and its description still says 'HD-2D', the direction Bailey rejected. The cold open's first beat and the link preview are answering the same question to the same person.

**Change:** Write the cold open's 'what this is' beat once and reuse the still and the sentence as the OG card, favicon frame and meta description. One fix, two surfaces.

## 17. OPTIONAL — Have the taught chapter teach the new presentation work Bailey just approved

**Why:** Bailey's list in this request includes the spherechange getting its moment, the chain counter, the arena turning with the boss and the pane breaks. Those are the mechanics a first-timer most needs named, and they are being built in the same period.

**Change:** When the spherechange moment and the chain counter land, the FFX-2 marks point at them rather than at a static HUD element; when the FFX pane break lands, the FFX mark for turn order uses it. Coordinate the two handoffs rather than authoring coaching against the pre-change HUD.

## 18. OPTIONAL — Record the coach-mark copy as a deck reviewed once, not as strings scattered through UI files

**Why:** Roughly 25–35 mark lines plus two glossaries plus several hundred generated ability lines all have to pass research/writing-bible.md's register and CHK-007's grep. Scattered through components they will be reviewed never.

**Change:** One copy file per game, reviewed against the writing bible in a single pass, with CHK-007's grep run over the whole file in CI.

## Missing

- docs/CONTROLS.md does not exist even though docs/ARCHITECTURE.md lists it — item (C) has no source of truth. Decide that the reference page and src/ui/common/ControlsHint.ts read one shared data file so the strip and the reference can never drift.
- No copy owner and no review step named for ~25–35 coach-mark lines, two glossaries and several hundred generated ability help strings, all of which must pass research/writing-bible.md's register and CHK-007's citation/id grep. Issue #26 is what happens without one.
- 'One picture from the game' per glossary entry is unspecified: which capture, at what size, from which build. Part C requires approved paintings ship unaltered, so a cropped or regraded glossary still is itself a Part C difference.
- No behaviour defined for a coach mark whose situation arises inside a cutscene, an Overdrive minigame (src/ui/ffx/minigames) or the spherechange wheel — all of which own the screen when open.
- No millisecond budget behind 'never blocks input for more than a confirm press', so the verification pass has nothing to fail on.
- No legibility spec for glossary and coach-mark prose against CHK-003's 14px floor at 1280×720, 1600×900 and 390×844 — CHK-003 records that the live measurement does not exist for any screen.
- No audio direction for the cold open: which cue, whether the title theme ducks, what happens when autoplay is blocked. Note round-02 #2 shows the music routing is currently wrong in every chapter and 'pause' never plays at all.
- No mockup planned for the reference/glossary page, the info slab, the recommended-chapter card or the defeat line, though all four are player-facing under hard rule 9.
- No statement of what the cold open says about the two games' relationship — a friend who has played neither needs to know FFX and FFX-2 are different games before a chapter list mixing both makes sense.
- CLARIFYING QUESTIONS FOR BAILEY (the plan should not be built until these are answered): (1) Onboarding is currently bound to chapters you have just commissioned — do you want onboarding to WAIT for Macalania and Leblanc, or do you want item (D) plus the reference to ship now and the coach marks to ride with the new chapters? (2) Do you want the taught chapter flagged START HERE on chapter select, or the board left as five equal cards? (3) Is the link meant to work on a phone, or is 'best on a desktop browser' an acceptable first sentence for now? (4) For 'the queue answers before you commit': in FFX that is the CTB turn-order preview that already exists and needs to be made visible — do you want the FFX-2 equivalent to be the charge/recovery cost shown on the character's own ATB bar, since X-2 has no queue to preview?

## Acceptance checks

VERDICT: revise. The shape is right and it is the one proposal Bailey picked. I confirmed nothing was smuggled in from the unapproved list — no HUD density presets, no medals, no accessibility pack, no challenge ribbons appear anywhere in the plan, which is worth saying plainly. What makes it a revise is sequencing: two thirds of the plan is bound to chapters that do not exist yet and would be authored twice, and the cheapest, highest-value third (D) is scoped as one sentence when the repo shows it is the largest piece of work in the plan.

RECOMMENDED ORDER OF WORK: (1) fix #26, #27 and #29, and land (D) with a generated help line on every leaf row in both games plus the FFX queue preview made visible and the FFX-2 charge/recovery cost shown — this alone moves Onboarding and Clarity and needs no new approved target beyond the already-approved HUD tiles; (2) mockups, 2–3 options each, for all seven new surfaces plus their 390×844 variants, recorded as tiles in docs/target/targets.json in Bailey's own words; (3) the cold open and the reference, with the suppression hooks and the shared controls table shipped alongside; (4) coach marks authored ONCE, with the Macalania and Leblanc chapters, keyed by mechanic.

ANSWERS TO THE THREE OPEN QUESTIONS. How much teaching is too much for a veteran: any teaching he did not ask for on a second run — the seen-set and the off switch are not polish, they are the feature, and the migration must assume an existing save belongs to a veteran. Should coach marks pause FFX-2's ATB: no, never in Active — hold the turn in FFX where the engine holds it anyway, and in FFX-2 render non-blocking and offer Wait once through the Settings.ffx2Atb toggle that already exists. Should the taught chapter be flagged: yes, RECOMMENDED / START HERE with one line of why, and no hard lock.

ACCEPTANCE CHECKS THE FINISHED FEATURE MUST PASS, ON REAL INPUT, ON THE PRODUCTION BUNDLE (CHECKS.md rules 1–3: real key/mouse events, judged from a screenshot at 100 percent, with the harness asserting what is in the shot):
A1. Cold boot on a fresh browser profile: the cold open plays, is skippable from the first frame with a real Escape and a real Enter, and total time from page load to the title menu with a skip is under 3 s. Second cold boot on the same profile: it never appears. Boot with coaching off: nothing appears anywhere in either game.
A2. Private-window boot twice in one session: the cold open plays once, not on every navigation.
A3. Migration: load a save with a cleared chapter, replay the taught chapter — zero coach marks fire. Load a fresh save, play it — every mark fires exactly once; replay it — zero fire.
A4. Every coach mark, in both games, measured against src/ui/ffx/hudSafeZones.ts at 1280×720, 1600×900 and 390×844: no intersection with a painted face or weapon (CHK-008), zero text under 14 css px (CHK-003), nothing clipped (scrollWidth <= clientWidth + 1, CHK-009).
A5. Text budget: at every frame in which a coach mark is up, the advisor card and any mid-battle bark are suppressed — asserted, not eyeballed, across a full run of each taught chapter.
A6. FFX blocking behaviour: a mark holds the turn and releases on one confirm press, measured; the hold never exceeds the stated millisecond budget. FFX-2: with ffx2Atb 'active', every gauge keeps advancing while a mark is up, asserted from battleState() samples on both sides of the mark.
A7. CHK-007 grep over the captured visible text of every surface in every chapter with coaching on: no §, no ffx-/ffx2- stems, no row/step numbering, no camelCase or hyphenated ids, and no bare 'CTB'/'ATB' outside the glossary entry.
A8. CHK-004 cross-read for item (D): open the command menu for every party member in every chapter, and for every leaf row the slab describes, confirm the row is enabled, belongs to that actor, and the description matches the AbilityDef's own fields. Zero blank slabs on any leaf row in either game.
A9. Controls: with an Xbox pad connected, the cold open, every coach mark, ControlsHint and the reference page all print the same glyph for confirm; with a keyboard only, the same string appears in all four. Any disagreement is a fail.
A10. Suppression: playwright.config.ts and the critic harness boot with coaching off, and a Part C composite of the title and both battle HUDs shows nothing added versus the approved tiles.
A11. First-time-player pass (rubric rule 6, not run in round 02): a critic who has never played FFX plays each taught chapter cold with real input only and narrates what they understood — time to first deliberate action under 60 s measured FROM THE CHAPTER CARD, and at the end they can say in their own words what the turn order is, what an Overdrive is and what a dressphere is, and why they won or lost.
A12. Dependencies green first: round-02 #1 (Chapter 4 reaches results), #4 (post-battle scenes play in full), #26, #27, #29 and #30. Until those land the verification above cannot be run honestly.

PART C WARNING FOR THE RELEASE AFTER THIS ONE: the end-state board is currently 12 approved / 23 awaiting a verdict / 7 with no target / 2 rejected, with the whole 'fight' group at gap. The gate requires no tile left at verdict or gap, so this feature adding seven more unapproved player-facing surfaces without tiles would make coverage worse, not better, regardless of how well it is built.