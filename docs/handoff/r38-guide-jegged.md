# r38: the strategy guide follows Jegged, and is its own thing

**Branch** `r38-guide-jegged` (the four commits on top of `origin/main` 4b7adea6, then a merge of the newer origin/main). **Game case: both** (AGENTS.md rule 14), decided per chapter in section 4: the FFX
chapters (I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII) follow Jegged's FFX guide, the FFX-2 chapters (IV, V, VI, XI, XIII,
XV, XVI) follow its FFX-2 guide. Nothing is merged to `main` and nothing is deployed. Decision record: D-350, with the two
corrections of the same afternoon, in `docs/target/decisions.json`. The sources are paraphrased and pointed at only in
`research/jegged-encounter-guides-ffx-a.md`, `-ffx-b.md` and `-ffx2.md`.

Bailey, 2026-10-03, in order: "from now on the guide follows the ffx/ffx-2 encounter guides from jegged" (~13:50 EDT);
"The guide and next move advisor are completely separate entities" (~14:30); "Do not say adapted from Jegged or cite worded
that just sounds stupid" (~14:40).

## 1. What changed, in one screen

| | Before | Now |
|---|---|---|
| RULES, WATCH, phase notes | the project's own wording, each rule printed with a research citation | rewritten in the plan's order as a plain guide: no source, no citation, no "adapted" anywhere the player can see |
| NEXT | the chapter's shipped tactic (`intendedStrategy`) run read-only, with one cited sentence | the guide's **own line** for the chapter (`src/data/guides/lines/<chapter>.ts`), read by `src/engine/tactics/guide-line.ts`; one plain sentence of reason |
| The move advisor | borrowed the guide's sentences and its pick | untouched: it still reads `buildGuideView().next` and `recommendedCommand` exactly as before |
| Panel fit | three-rung ladder, citations under every line | two rungs (rule paragraphs to one-liners, then the WATCH sentences), then MORE pages; the upright phone sheet scrolls everything instead of being fitted |
| What the panel prints when nothing fits | the command with no reason | "Waiting for your turn." between turns; "Nothing in the plan for this turn." when a turn is open and no step can be played |

## 2. The separation, and the proof

The panel (`src/ui/common/StrategyGuide.ts`) asks `buildGuideRail` (`guide-line.ts`) for what it shows. WATCH, the phase note and
RULES still come from the written content (`guide.ts#buildGuideView(state, null, clock)`, which runs no tactic when no decision
is passed); NEXT comes from the line. The line is plain data (`line-types.ts`): a list of steps, each a menu row to press, a
condition, an aim and one sentence of reason. The evaluator shows the **first step that can be played right now** (it applies, the
deciding character is offered a matching enabled row, someone legal can be aimed at), so "where the plan's next step cannot be
played, show the nearest step that can" is simply the next one down. FFX-2's in-flight filter (a move another girl already has
charging or held is skipped) works the same way. When no step plays, the evaluator's own last resort steps in: a swing at the
boss, else an Overdrive or a spell, else a Change for an Itchy girl, else a quiet turn. Steps marked `support` are the ones no
encounter guide spells out (the revive, the heal, the idle turn, a research-backed addition); everything else is the plan's own.

**No tactic, advisor or bench file changed.** `git diff origin/main --stat` lists nothing under `src/engine/tactics/` but the two
new guide-only modules, `guide-line.ts` and `guide-line-board.ts`, and none of `advisor*.ts`, `BattlePresenterStrategies.ts`,
`src/battle/**`, `src/data/ffx/**`, `src/data/ffx2/**` or any chapter bench. 735 tracked files under the tactics, the battle engines, the data and every bench are blob-identical to `origin/main` (`hash-compare.mjs`, scratch); `git diff origin/main --stat -- src/engine/tactics` lists only `guide-line.ts` (350 lines) and `guide-line-board.ts` (252 lines); the one test under the advisor's name that changed, `advisor-v3-final.test.ts`, tests the rail (section 9).

**The advisor's outputs are byte-identical.** `advisor-digest.mjs` (scratch, `D:/Tools/pyrefly-scratch/2026-10-03/jegged/work/`)
plays every chapter with the shipped `intendedStrategy` on seeds 1 to 5 (90 runs, 8,256 decisions) and hashes, at every decision,
the whole advisor view (`buildAdvisorView`), the tactic's command (`recommendedCommand`) and the legacy guide NEXT the advisor
borrows (`buildGuideView().next`). Overall digest on `origin/main`: `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d`. On the branch: `cc10c48f8757f72d07c44a7986c06e4b69b3d9d42e53cef6757dd8cb77ae425d`. All 90
per-run digests match and none errored. The advisor and golden test files (the vitest filters `advisor` and `golden`: 48 files, 413 tests (411 pass, 2 skipped), test for test; the one test whose name differs is the rail's held-command board in `advisor-v3-final.test.ts`, renamed because its board is now found with the guide's line instead of the tactic)
give the same results before and after.

**Structurally** (`tests/unit/guide-line-separation.test.ts`, 7 tests): the evaluator and its board import no tactic, no advisor and
no auto-battle strategy; the chapter lines import no engine; the panel reads the rail and never `buildGuideView`; no advisor module
imports the line; on a real Flux board the guide's NEXT is not always the tactic's pick, while `buildGuideView` and
`recommendedCommand` still mirror `intendedStrategy` decision for decision.

Left alone on purpose: `src/engine/tactics/guide.ts` (the advisor's source) and every `hints` list in `src/data/guides/*.ts` (the
advisor's borrowed sentences; the panel no longer reads them). `guide.ts` reads a boss's form from a field that is always empty on
a real board, so its own phase pick never shows a Form II or III note; the rail picks its phase in `guide-line.ts` and reads
`enemy.formIndex`, as every other reader does (Yunalesca's Form II and III notes now show). The legacy bug stays, because nothing
player-facing reads that pick any more.

## 3. The wording proof

`tests/unit/guide-line-words.test.ts` (23 tests) fails on `/jegged|adapt|source|cite|citation|§|research\//i` in 934 strings of
written content (titles, link titles, every rule long and short under all three clocks, WATCH payloads and advice, phase labels
and notes, and 228 NEXT reasons) in all 18 chapters, in the words the panel and the evaluator add themselves, and in the real text
and attributes of the mounted panel on boards from the opening to the late game in every chapter. Result: no match. The citation
markup (`.sgd__cite`) is gone; the data keeps `cite` on every rule and `from` on every line step for maintainers, and a test pins
that they exist. Headless Chromium on the built game agrees (section 6): 0 citation nodes, 0 forbidden words in the visible text.

## 4. Chapter by chapter

Each entry: where the plan is read (the research file and heading; the research file holds the page and our paraphrase and its
own fit notes), what the panel's RULES and WATCH now say, what the NEXT line presses, and **where our chapter differs from
what the plan assumes and what the guide says instead**. Differences are in plain words here and in the research notes only,
never on screen. Win rates are in section 5.

### FFX only (chapters I, II, III, VII, VIII, IX, X, XII, XIV, XVII, XVIII)

**I. Seymour Flux** (`jegged-encounter-guides-ffx-a.md`, Chapter 1). RULES in the plan's order: cure the Zombie before the
mount acts; Poison early and keep Hastega up; Dispel his Reflect and Protect; Shell (Kimahri's Mighty Guard in one turn) or an
aeon summoned right after Seymour acts for Total Annihilation; kill Seymour, not the mount. WATCH: both Total Annihilation
warnings are now instructions. NEXT: Holy Water or Remedy on a Zombie, then Mighty Guard or Shell or an aeon on the warning,
Dispel, Hastega or Haste, Poison Fang, an aeon only when two of the party are down, a revive, Kimahri's and Yuna's Talk, a heal
under 70%, then a swing at Seymour himself. *Differs:* the plan has Lulu cast Bio, and Lulu is benched, so the guide uses
Kimahri's Poison Fang (the same 1,400 a turn). Zombie Ward is already on the armour. FFX's command window has no Defend row,
so the plan's "Defend as the blast lands" is not a step. **The plan treats aeons as a last resort (Seymour banishes them);
the shipped tactic summons them early in both phases. That is the gap in the numbers.**

**II. Yunalesca** (`-ffx-a.md`, Chapter 2). RULES: Reflect on the party, Yuna first, for Form I and cure Blind and Silence;
keep one Zombie in Forms II and III; Holy Water a worn Zombie, then heal it; Dispel her Regen; hold every aeon for Form III.
Her Form I note keeps the Sleep counter. NEXT: Reflect (Yuna first), Eye Drops or Echo Screen or Esuna, Dispel Regen off a
Zombie, Holy Water when two are Zombies and one is worn, Yuna's Reflect again when her Dispelling Slap has stripped it from
all three, Hastega, then (support) the Form III aeon and its Overdrive, a revive, a heal, a swing. *Differs:* Yuna has not learned Holy, which the plan recommends, so no step
names it. Dark and Silence Wards have no slot in the build, so the cures answer. The aeon rule is our own research's and the plan
is silent on it. **The rail now shows her Form II and III notes (they never showed before: see section 2).**

**III. Braska's Final Aeon** (`-ffx-a.md`, Chapter 3). RULES: cure Petrify at once; Hastega, Protect and Regen; Talk twice, both
in form 2; the two Pagodas down together in form 2 or left alone; Yu Yevon cannot win, Doom him. NEXT: Soft, Remedy or Esuna
on Petrify, Reflect and Candle of Life on Yu Yevon, Talk in form 2, Hastega, Haste, Protect, Regen, Mental Break, Armor Break,
then (support) a revive and a heal, the fuller Pagoda in form 2 so they fall together, an Overdrive, a swing. *Differs:* the
shipped tactic Slows both Pagodas and leaves them standing (four kill-both versions lost on the bench); the guide follows the
plan. Power Wave strips Poison and every Break, so they last a turn or two. The possessed-aeon gauntlet is not in the plan: its
rules stay on research alone.

**VII. Seymour and Anima** (`-ffx-a.md`, Chapter 7). RULES: Steal from each Guardian, then drop them before Seymour; his spells
come ice, lightning, water, fire, so pre-cast the matching Nul; summon Shiva for Anima and Talk to Seymour first; Overdrive on a
Boost turn; Auron's Magic Break and the matching Nul in the last act. NEXT: Shiva on act 2, Overdrive while Anima is Boosted,
Shield on a countdown, Talk (act 1), Steal from each Guardian, the Nul for the cycle, Auron's Magic Break, then (support) a
revive and a heal, then swings at the Guardians. *Differs:* Blizzara healing Shiva needs Lulu (no step); Threaten is the alternative to Steal and needs Auron, so it is
a swap; the third act is past what the plan covers, and Magic Break plus the matching Nul stand.

**VIII. Evrae** (`-ffx-a.md`, Chapter 8). RULES: pull the ship back first and whenever the party must recover; Cheer to five at
range while Wakka swings; the Al Bhed Potion is the heal and the cure; Slow it before a third of its bar; refuse the bait when it
inhales at range. NEXT: Al Bhed Potion for Petrify and under 55%, Pull back, Cheer to five, Slow, a swing. *Differs:* the bag
has no Mix ingredients for Mighty G, so the guide does not tell the player to Mix; the build ships one Stone Ward and no
Poison Ward, so it does not tell the player to craft them.

**IX. Yojimbo** (`jegged-encounter-guides-ffx-b.md`, section 2). RULES: bring Yuna's aeons when it turns against you and always
at a high gauge. NEXT: (support) a revive and Yuna's Cura, an aeon at a gauge of 80 so Zanmato hits the aeon, an aeon when
someone is down, Lulu's -ra spell, Kimahri's quiet item, a swing. *Differs:* the plan is one sentence ("bring aeons if it goes
badly"); the reason for the gauge-80 aeon is the chapter research's. The shipped party has not learned Doom (the line names it
only when `CAVERN_DOOM_PREP` says it is learned).

**X. Seymour Natus** (`-ffx-b.md`, section 3). RULES: Haste only two; Soften the stone below 24,000; Reflect on Natus (not the
party) below 12,000; aeons only as a Grand Summon Overdrive; Mortibody drains Natus. NEXT: Soft or Esuna on Petrify, Dispel his
Protect, Rikku for Reflect on Natus, Talk, Haste two, Lulu for an early Bio, a Grand Summon, an Overdrive, then (support) a
revive and a heal. *Differs:* Yuna has not learned Reflect, so Rikku does it (a swap); Magic Break does nothing to either
target, so no step names it; two of the plan's claims (a counter-spell on a direct attack, Nul calling Desperado) are single
source and contradict the research, so they are not taught.

**XII. Seymour Omnis** (`-ffx-b.md`, section 4). RULES: Hastega, Armor Break, Mental Break and the Nul of the colour he shows
most; hit a disc to turn it (Wakka, or a spell); heal above 4,000 before Ultima; aeons are safe. NEXT: a heal while he glows,
Hastega, Armor Break, Mental Break, the Nul for three discs of one colour, Wakka for the discs, then support steps. *Differs:*
"wear elemental armour" is the one Phantom Ring on Yuna. The plan says Shell helps against Ultima; the research says it does
not, so the guide says it does not. Only Wakka turns a disc with a blow.

**XIV. Isaaru** (`-ffx-b.md`, section 5). RULES: Yuna alone, so a Grand Summon opens every link; Grothia: Bahamut and Mega Flare,
Shield before his Hellfire; Pterya: Bahamut again or Ixion; Spathi: Shiva, Shield before the count ends; no healing between
links. NEXT: the same, step by step, with Shield on the gauge. *Differs:* the shipped aeons do not know Blizzara or Thundara,
so no self-heal line; Ice is not Grothia's weakness; Spathi's count is five here (the plan says four), so the number on screen
can differ by one turn.

**XVII. Sin: the Fins and the Core** (`-ffx-b.md`, section 6). RULES: close in, Armor Break, pull back; Hastega and Cheer at
range; pull away when the core glows if Cid acts first; Genais first (plain attacks, Slow, then Fire); the Core is the same
fight with no ship to move; nothing heals between links. NEXT: Pull back on the glow, Close in, Armor Break, Pull back again,
Wakka or Lulu in for Auron, Yuna and (once he has stacked) Tidus, Hastega, Cheer to five, Slow and plain attacks on Genais,
Armor Break on the Core. The Armor Break step waits until Genais is gone, because Genais is immune to every Break (a line that
kept casting it at Genais won 3 of 100 seeds; with the wait, 69 of 100). *Differs:* Rikku (Luck) starts on the bench, so
stacking is Cheer alone; the Silence Grenade answer to Genais is not in the bag; the Negation chance is a single-source formula,
so no step says how many buffs are safe.

**XVIII. Sin: the Face** (`-ffx-b.md`, section 7). RULES: Sin's turns are the clock; out of reach, Hastega and Cheer while Wakka
and Lulu deal the damage; Armor Break at once, then everything; Gaze answers hits, so carry cures. NEXT: cures for Petrify,
Confuse and a worn Zombie, Hastega, Haste, Armor Break, (support) Mental Break, Auron for it, Cheer, Lulu's Firaga, Wakka and
Lulu in at range, then an Overdrive. *Differs:* the clock. The plan says about sixteen turns; the research has the 12th or 13th
(our estimate the 13th) and the guide keeps that. The plan names Armor Break only; the chapter research's own plan has both
Breaks (three sources) and puts about half again on Lulu's Firaga, so Mental Break is a support step and a rule (without it the
line won 0 of 100 seeds, with it 50 of 200). Rikku's Luck and Mix are on the bench.

### FFX-2 only (chapters IV, V, VI, XI, XIII, XV, XVI)

**IV. Bahamut** (`jegged-encounter-guides-ffx2.md`, section 2). RULES: the fixed loop; the first Impulse is the warning, so be
fully healed before Mega Flare; Darkness is the damage; Shell halves Impulse and Mega Flare. NEXT: (support) a revive, a party
heal once the countdown is live, (support) Shell, Darkness, a heal under half, (support) Pray, a swing. *Differs:* no Thief
Steal for the Mute Shock; Shell and Magic Break are our research's and the plan is silent on them; the bag has no Mega-Potion.

**V. Vegnagun and Shuyin** (`-ffx2.md`, section 3). RULES, link by link: the Tail (max HP is the defence), the Leg (ignore the
Nodes, Dispel what they add), the Body (Bulwarks first, no buffs up front, Shell as the third Charge Core lands), the Head (keep
a Redoubt down, heal above about 1,500 before each Nemo), Shuyin (a race, one healer free). NEXT: heal floors (1,500 for the
Head, 1,323 for the Tail), Protect and Shell on the Leg, Dispel its Protect and Shell, Shell on Charge Core, Darkness, then
(support) heals and Pray. *Differs:* the bag has no Dispel Tonic, so the White Mage's own Dispel; no Warrior, so no Armor Break
on the Core; Ribbons and the elemental guards are not modelled. Protect against Noli Me Tangere (the plan says it halves it) is
left out because the research disagrees.

**VI. The Leblanc Syndicate** (`-ffx2.md`, section 4). The plan has nothing to follow for the fight (it calls each fight easy),
so the guide stays on the chapter research and its NEXT line is the research read as a line: Logos, Ormi, Leblanc; Armor Break on
Ormi; Dispel for the guard. Every step but the final swing is a support step.

**XI. Fallen Aeons** (`-ffx2.md`, section 5). RULES: Shiva (Remedy for Stop, no Ice), Cindy first and never spread the damage,
Pain stacks, Darkness from both Dark Knights in all three fights, the Save Sphere. NEXT: Change out of Itchy (Anima's Pain),
Remedy for Stop, Silence and Darkness (Anima), a heal under half, Darkness, then the single-target swing at Cindy, Dispel, Shell,
Pray. *Differs:* Darkness hits all
three sisters at once, so the girls who cast it spread damage while the White Mage and any girl without Darkness make the swings
at Cindy; the line casts Darkness first (a trial the other way round, the swing first, won 0 of 60 seeds, Darkness first 49 of
60). No Fire (Shiva's weakness), no Ribbon, no Samurai shortcut, no Lady Luck dice, no Holy for Anima.

**XIII. Trema** (`-ffx2.md`, section 6). RULES: use Paragon's quiet opening for a Stamina Tonic and buffs (nothing heals between
Paragon and Trema); plain attacks on Paragon; against Trema one girl heals constantly, Protect and Shell stay up. NEXT: Change
out of Itchy, a revive, the Tonic, Three Stars, Lunar and Light Curtain, a Megalixir or party heal, Remedy for Stop, Target MP,
plain attacks on Paragon, Darkness on Trema, Pray, a swing. *Differs:* the Higher Power grid is not in the engine, so The End on
Paine stands in for Break Damage Limit; the chapter is Oversoul Paragon by construction (the plan's strongest recommendation, with
no player work); Mascots and the best accessories are not in the kit. The line follows the chapter's shape, so a Trema-alone
chapter never names Paragon.

**XV. The Den of Woe** (`-ffx2.md`, section 7). RULES: Dark Knights do the damage (Baralai drains MP, so Darkness); heal after
every Bullseye of Gippal's and before the killing blow; Lightfall needs an answer for each girl it would kill. NEXT: Remedy for
Baralai's Stop and Silence, Hero Drink before Lightfall, heals, Protect, Shell for Nooj, Darkness, Pray, a swing. *Differs:* the
preset has no Alchemist and no Salvation Promised grid, so Invincible comes from a Hero Drink, one girl at a time, instead of a
Dark Matter mix or Auto-Life; the steady-HP route against Lightfall was dropped on purpose (Bailey, 2026-09-26); Drill Shot is
not counted because the sources split on how many changes it takes.

**XVI. Ixion at Djose** (`-ffx2.md`, section 8). RULES: after Recharge, heal everyone and put Shell up, because the Hammer is next
and it is magic. NEXT: (support) a revive, a heal on the Recharge tell, Shell, Darkness, heals, Protect, Pray. *Differs:* the
plan's damage is water magic or Water gems, and the preset has neither (Darkness ignores his Defense); no Warrior for a Break; the
plan says four Aerospark in a row, the research a counter model, so the guide does not print "four".

## 5. Does the guide's line win?

Information only, never a gate and never a reason to change a chapter. `tests/unit/guide-line-bench.test.ts` (`PYREFLY_MEASURE=1`,
200 seeds a row; `GLINE_CHAPTERS` and `GLINE_DRIVERS` narrow a run; by default it is a one-seed smoke) plays every chapter from its
first link through the app's own chapter setup and carry, FFX on the CTB engine and FFX-2 in Wait mode with no decision time (the
bench speed of every FFX-2 bench), one try, no retries, three drivers on the same seeds 1 to 200:

- **today** is the shipped `intendedStrategy`, the line the tactic and the advisor use;
- **line** is the guide's line as the panel shows it (plan steps, support steps, last resort);
- **plan** is the plan steps only. It leaves out the revive, the heal and the idle turn, so it is not a whole strategy (it can
  stall); it is printed for completeness and is not a result.

| Ch. | Game | Chapter | today | **line** | plan (not a strategy) | line against today | line loses at | idle turns a run |
|---|---|---|---|---|---|---|---|---|
| I | FFX | Seymour Flux | 112/200 (56.0%) | **0/200 (0.0%)** | 0/200 (0.0%) | clearly less | link 1: 200 | 0 |
| II | FFX | Yunalesca | 199/200 (99.5%) | **0/200 (0.0%)** | 0/200 (0.0%) | clearly less | link 1: 200 | 0 |
| III | FFX | Braska's Final Aeon | 194/200 (97.0%) | **0/200 (0.0%)** | 0/200 (0.0%) | clearly less | link 1: 200 | 0 |
| IV | FFX-2 | Bahamut | 200/200 (100.0%) | **200/200 (100.0%)** | 163/200 (81.5%), 8 stalled | about equal | - | 0 |
| V | FFX-2 | Vegnagun and Shuyin | 188/200 (94.0%) | **0/200 (0.0%)** | 0/200 (0.0%) | clearly less | link 1: 173, link 4: 5, link 3: 8, link 2: 8, link 5: 6 | 0 |
| VI | FFX-2 | The Leblanc Syndicate | 198/200 (99.0%) | **199/200 (99.5%)** | 17/200 (8.5%) | about equal | link 3: 1 | 0 |
| VII | FFX | Seymour and Anima | 189/200 (94.5%) | **103/200 (51.5%)** | 34/200 (17.0%) | clearly less | link 1: 97 | 0 |
| VIII | FFX | Evrae | 193/200 (96.5%) | **185/200 (92.5%)** | 0/200 (0.0%) | a little less | link 1: 15 | 0 |
| IX | FFX | Yojimbo | 171/200 (85.5%) | **121/200 (60.5%)** | 0/200 (0.0%) | clearly less | link 1: 79 | 0 |
| X | FFX | Seymour Natus | 159/200 (79.5%) | **110/200 (55.0%)** | 0/200 (0.0%) | clearly less | link 1: 90 | 0 |
| XI | FFX-2 | Fallen Aeons | 174/200 (87.0%) | **144/200 (72.0%)** | 48/200 (24.0%) | clearly less | link 2: 56 | 0.12 |
| XII | FFX | Seymour Omnis | 127/200 (63.5%) | **89/200 (44.5%)** | 0/200 (0.0%) | clearly less | link 1: 111 | 0 |
| XIII | FFX-2 | Trema | 14/200 (7.0%) | **8/200 (4.0%)** | 0/200 (0.0%) | both low | link 2: 23, link 1: 169 | 0.38 |
| XIV | FFX | Isaaru | 173/200 (86.5%) | **200/200 (100.0%)** | 0/200 (0.0%) | more | - | 0 |
| XV | FFX-2 | The Den of Woe | 111/200 (55.5%) | **16/200 (8.0%)** | 1/200 (0.5%) | clearly less | link 3: 127, link 2: 56, link 1: 1 | 0 |
| XVI | FFX-2 | Ixion at Djose | 197/200 (98.5%) | **200/200 (100.0%)** | 187/200 (93.5%) | about equal | - | 0 |
| XVII | FFX | Sin: Fins and Core | 113/200 (56.5%) | **152/200 (76.0%)** | 0/200 (0.0%) | more | link 3: 44, link 2: 4 | 30.57 |
| XVIII | FFX | Sin: the Face | 67/200 (33.5%) | **50/200 (25.0%)** | 2/200 (1.0%) | a little less | link 1: 150 | 0 |

**Reading it.** The guide's line wins as often as today's line (within two points) on 3 chapters (IV Bahamut, VI The Leblanc Syndicate, XVI Ixion at Djose) and more often on 2 (XIV Isaaru, XVII Sin: Fins and Core). It wins **clearly less** (more than ten points) on 10: I Seymour Flux, II Yunalesca, III Braska's Final Aeon, V Vegnagun and Shuyin, VII Seymour and Anima, IX Yojimbo, X Seymour Natus, XI Fallen Aeons, XII Seymour Omnis, XV The Den of Woe; a little less on VIII Evrae and XVIII Sin: the Face; and both lines are low on XIII Trema. Five chapters sit at zero or within a few percent of it: Flux, Yunalesca, Braska's Final Aeon, Vegnagun and the Den of Woe.

**Why, from the research notes** (not from a tuning pass): in each near-zero chapter the shipped tactic does something the plan does not, and the chapter research says so.

- **I Flux.** The plan treats aeons as a last resort, because Seymour banishes them; the tactic summons them early in both phases (a summon freezes the party's counters) and stacks Cheer.
- **II Yunalesca.** The plan is silent on aeons; the tactic holds all five for Form III and fires their Overdrives on arrival (about 40,000 of Form III's 60,000), and will not kill Form II while anyone is unarmed (not a Zombie) when the next form's opening Mega Death lands.
- **III Braska's Final Aeon.** The plan kills both Pagodas together; the tactic Slows them and leaves them standing (four kill-both versions lost on the bench), and the Breaks the plan recommends are stripped by every Power Wave.
- **V Vegnagun.** The plan names Darkness and plain attacks; the tactic opens with Black Sky while MP lasts and keeps one dedicated healer.
- **XV the Den.** Lightfall needs every girl above 5,000 HP or Invincible. The plan's three answers need gear the preset does not have, so the Hero Drink stands in for them, one girl at a time, and the line loses to Nooj (127 of 200) or Gippal (56).

No single missing step explains a gap. Scratch trials (not committed) that added early aeons, or Cheer and Protect, to Flux, or a Black Sky opener to Vegnagun, left both at 0 of 100 seeds: the shipped tactics are tuned sequences, which is what "the guide and the advisor are separate" costs.

**What the measurement caught in the lines themselves.** Four encoding errors surfaced while comparing each line's move list with the tactic's, and a scan for repeated no-progress turns, and each was fixed in the line (never in a tactic): the Fins' Armor Break was cast at Genais, which is immune to every Break (3 of 100 seeds won, 69 after the fix); the Fallen Aeons line swung at Cindy before it cast Darkness (0 of 60, then 49 of 60); revive and heal sat behind a swing that is always playable in Braska's second form and Macalania's first act, so nobody got up (Macalania 74 of 200 seeds, then 103); and Sin's face never cast Mental Break, which the chapter research's plan has and the encounter guide omits (0 of 100, then 25%). Anyone editing a line should run `GLINE_CHAPTERS=<id> PYREFLY_MEASURE=1` before and after.

**What this is not.** Bench speed (no decision time in FFX-2), one try, no retries and no checkpoints, so the Road, the Den and Trema read higher or lower than their human-speed benches; a bot that presses the card's first suggestion at every decision, which no player does; seeds 1 to 200 of one harness. The "today" column is this harness's own reading and differs from some chapters' own benches, which wire their parties their own way: it reproduces Omnis (127 of 200) exactly, sits within ten of Natus (159 against 169) and Yojimbo (171 against 161), and reads higher than the Isaaru bench (173 against 125). It says how the card's advice performs when followed to the letter, nothing more.

## 6. Proof in a browser

Headless Chromium in GPU mode (`PYREFLY_BROWSER=gpu`), one browser, driven from node with real input (a tap on the GUIDE chip, real clicks on MORE, the G key), against the built game served from the scratch folder on port 6401 (stopped by PID afterwards); battle help is off in the seed save so the coach does not cover the rail. All four scenarios: 0 citation nodes, 0 console errors, 0 forbidden words in the visible text, nothing clipped.

| Scenario | Rail box | Smallest effective type | Fit |
|---|---|---|---|
| Ch. I Flux, 1600x900 | 330x168 at (53,110) | 14.25 px | inside the viewport, no overflow; MORE by real click reaches title and NEXT, the reason and WATCH, and every rule |
| Ch. I Flux, 390x844 (tap the GUIDE chip) | scrolling sheet 370x410 at (10,66) | 15 px | every block present at full length; the sheet scrolls (390 px of content past its edge), no element overflows |
| Ch. IV Bahamut, 1600x900 | 330x211 at (53,220) | 14.25 px | same as Ch. I |
| Ch. IV Bahamut, 390x844 | scrolling sheet 370x410 at (10,66) | 15 px | same as Ch. I |

Screenshots, in `docs/screenshots/r38-guide-jegged/` (`ch1-flux` and `ch4-bahamut`, then `1600x900` or `390x844`): `-guide-on` for all four; on the phone `-guide-scrolled` (the same sheet scrolled to the rules); on the desktop `-guide-page2` to `-page5` (the MORE pages, reached by real clicks) and `-next-turn` (a later decision), cropped to the rail so the folder stays small. The off frames (the G key and the chip), the phone chip and next-turn frames and the full frames of the cropped ones are parked in `F:/pyrefly-parked/2026-10-03/`. The Ch. IV desktop frame also shows the move advisor's card beside the guide, which is the point of the separation: two panels with their own picks (section 7, item 2).

## 7. For Bailey to decide

1. **Ship the line as it is, or fit it where it loses?** This is the one that matters. With the line as written, ten chapters win clearly less than today's line and five are at or near zero (section 5). Options: **(A)** ship as is: the guide is Jegged's, the advisor is the optimiser, and the gap is the price of "completely separate". **(B)** keep RULES and WATCH on Jegged and add the steps the chapter research documents to the five near-zero lines (Flux's early aeons, Yunalesca's Form III aeons and the unarmed wait, Braska's Slow on the Pagodas, Vegnagun's Black Sky, the Den's Hero Drink for every girl) as plain guide steps: each is one data edit in `lines/<chapter>.ts`, no tactic is touched, and I would measure every one before and after. **(C)** hide the NEXT card in those five chapters until (B). My recommendation is (B) for those five and (A) for the rest, because a card that loses every time is not one a player can follow; but it is where "follows Jegged" and "works" part ways, so it is yours.
2. **The "GUIDE'S PICK" tag (D-359, adopted, not scheduled).** I did not touch it (it is advisor UI). Until it is removed it compares the advisor's pick with the tactic's NEXT (`buildGuideView`), which is no longer what the guide panel shows; the Ch. IV screenshot has the tag on the advisor card beside a guide that reads its own line.
3. **FFX has no Defend row on its HUD** (`CommandMenuLogic.ts`), and the plan for Flux says Defend as Total Annihilation lands. The line leaves Defend out of every FFX chapter. If you want it, that is a HUD decision (the engine already offers it).
4. **Two party-prep picks of yours decide whether the plan's own route is playable:** the Den's Lightfall prep (dropped 2026-09-26; the plan's three answers all need it) and Yojimbo's Doom (`CAVERN_DOOM_PREP`, shipped `'not-learned'`; `'preloaded'` is the plan's implied route and wins 200 of 200 on the research bench). Neither is changed here.
5. **Idle turns.** In the Fins and Core the line has nothing to say on about 12% of decisions (Tidus and Auron at range with the Break already on); the card then reads "Nothing in the plan for this turn." rather than inventing a move.
6. **Screenshot weight.** A full 1600x900 frame is about 2 MB (the repo's other screenshots average about 20 KB), so only the two desktop `-guide-on` frames are full; the other desktop frames are cropped to the rail and the folder is 7.9 MB. The full frames are parked outside the repo.
7. **Left for a later pass, none of it needed now:** the `hints` lists in `src/data/guides/*.ts` are advisor-only text and could move next to the advisor; `guide.ts`'s form read is wrong and harmless (section 2).

## 8. Gates

- `npx tsc --noEmit`: clean. `node tools/orphans.mjs`: 24 orphaned modules, the same 24 as on `origin/main` (none of them new).
- Full suite once on the final code, `--maxWorkers=3`: 778 files, 11,403 tests, 11,361 passed, 41 skipped, 0 failed. An earlier run
  of the same suite had two failures: `advisor-v3-final.test.ts` (it pinned the rail to the tactic's pick; updated, see section 9) and `strategy-ffx2-bahamut.test.ts` (a 15-second timeout while another agent's suite shared the machine; it passes
  alone in 13 seconds).
- The new tests: `guide-line` 37, `guide-line-words` 23, `guide-line-separation` 7, `strategy-guide-phone-sheet` 3, and the
  measurement `guide-line-bench` (18 chapters, a one-seed smoke by default).
- Advisor digest and the advisor and golden test files before and after: section 2. Protected files by blob hash: section 2.
- Servers started for the browser proof: one `vite preview` on port 6401, stopped by PID; nothing else left listening.

## 9. Files

**New:** `src/data/guides/line-types.ts`; `src/data/guides/lines/` (the eighteen chapter lines and `kit.ts`); `src/engine/tactics/guide-line.ts` and `guide-line-board.ts`; `tests/unit/guide-line.test.ts`, `guide-line-words.test.ts`, `guide-line-separation.test.ts`, `guide-line-bench.test.ts`, `strategy-guide-phone-sheet.test.ts`, `helpers/guideLineDrive.ts`; `docs/screenshots/r38-guide-jegged/`.

**Changed:** the eighteen `src/data/guides/<chapter>.ts` (rules, watch, phases, the `line` field; hints untouched) and `types.ts` (an optional `line`); `src/ui/common/StrategyGuide.ts` and `strategy-guide.css` (the rail view, no citations, two fit rungs, the phone sheet); `tests/unit/strategy-guide-fold.test.ts`, `strategy-guide-scale.test.ts`, `strategy-guide.test.ts`, `ui-strategy-guide.test.ts` (expectations that pinned the citations and the old ladder) and `advisor-v3-final.test.ts` (its held-command boards are now found with the guide's line, not the tactic); `docs/handoff/bp1-strategy-guide.md` (the superseded parts marked).

**Not touched (hash-identical to `origin/main`):** `src/engine/tactics/guide.ts`, every `advisor*.ts`, every chapter tactic including `braskas-final-aeon.ts`, `ffx-isaaru.ts`, `ffx2-fallen-aeons.ts`, `ffx2-vegnagun-shuyin.ts`, `seymour-flux.ts` and `sin-fins-core.ts`, `tests/unit/chapters/isaaru-tactic-bench.test.ts`, `tests/unit/helpers/fallenAeonsDrive.ts`, every bench, `src/battle/**`, the data. (The first run's tactic edits are parked in `F:/pyrefly-parked/2026-10-03/jegged-first-run-tactics.patch`.)

**Scratch, outside the repo** (`D:/Tools/pyrefly-scratch/2026-10-03/jegged/work/`): `advisor-digest.mjs`, `line-bench.mjs`, `loops.mjs` (repeated no-progress turns), `usage.mjs` (which step presses how often), `labels.mjs` (the line's moves against the tactic's), `variant.mjs` (try an edited line without touching the repo), `trace.mjs`, `compact.mjs`, `held-board.mjs`, `guide-shots.mjs` (the browser proof), and the measurement logs.
