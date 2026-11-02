> **Status 2026-11-02:** built on branch `ch-keeper` (`docs/handoff/ch-keeper.md`). The driver took the recommended pick for every perceivable decision (SK1 to SK14) under Bailey's blanket yes; each pick, its alternative and what is still owed is in the handoff. The text below is the 2026-10-19 paper preflight unchanged.

# Paper preflight: Chapter XXIX (provisional) — The Spectral Keeper, Zanarkand Dome (FFX)

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of
`docs/plans/chapter-gippal-review.md` and `chapter-natus-review.md`: a number is read the way
the source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game
number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.**
Written 2026-10-19 by a Sonnet sub-agent of the release driver, after Bailey's words (verbatim):
*"Spectral Keeper + Fallen Maesters (Recommended)"* (2026-10-18 16:50 EDT, D-1039, which also
settles the route: sourced research plus RE data and AI, a paper preflight per chapter,
end-state options for his pick, then a build behind a hidden word).

**Read:** `research/re-ffx-spectral-keeper.md` at `origin/re-parity-new-chapters-1018` (5f7b6ffbc;
"RE §n" below), the candidates note (`D:/Tools/pyrefly-scratch/2026-10-18/new-chapters/candidates.md`),
`docs/PRODUCT-BRIEF.md` (the Pilgrimage runs are the core loop since 2026-10-18), AGENTS.md hard
rules at `origin/main` (rule 8 is now the lifted retail-asset rule), the pilgrim handoff
(`docs/handoff/pilgrim-proto.md`). **Engine claims were re-checked by reading `origin/main`
f86e8f3e9** (the RE note's engine table was written against 1fd983b5a, older; §3 shows where that
matters). Nothing was run, so rule 3 ("prove it by running the engine") is owed by T0 and T10.

**Verdict: PROCEED on data, AI and the small seams now; HOLD the mine timer until the fuse live
check (§8 Q2) and HOLD everything Bailey will see or hear until SK1 to SK4 (§11) are picked
(hard rule 9).**

## 1. Game case and sources

**Game case: FFX only.** The fight is the story gate before Lady Yunalesca (RE §0). CTB,
aeons, Trigger-style commands and the FFX status set. FFX-2's Bevelle Underground guardians are
separate fights in the ATB engine and nothing here applies to them (RE header). AI, data and build
live under `src/battle/ffx`, `src/data/ffx`. The chapter registration in `src/data/encounters.ts`
and the two small switches in §3 rows 11 and 12 are shared plumbing, case "both" for CHK-020, but
each is inert for every other chapter (an absence test pins it).

| Source | What it gives | Tag |
|---|---|---|
| RE note, files `m129` Keeper, `m146` Circle, `dome02_00`, `dome0200`, `command.bin`, `monster1.bin` | the records, the formation, the whole AI of both monsters | [R] (FFX_Data.vbf, Steam build 25501027) |
| RE §7 engine table | needs vs the engine | [note], re-checked here |
| `research/ffx-yunalesca.md:59` | the Keeper, 52,000 HP, "bottom of the Cloister lift" | [single source], now agreed by [R] |
| `src/data/ffx/builds/zanarkand.ts` | the party snapshot "immediately following the Spectral Keeper" | [estimate] build, sourced build point |
| Candidates note | story weight medium, Jegged snippet agrees with the wiki | [W], [J] snippet only |

## 2. What the player experiences, turn by turn (plain words)

Everything below is the game's own rule set (RE §2 to §5) unless tagged `[derived]`.

**The set-up.** The Dome fight opens on a ring of six glowing platforms around a beast, the
Spectral Keeper (52,000 HP, no elemental weakness, DEF 100 and MDEF 100, immune to Death, Zombie,
Petrify, Poison, the Breaks, Confuse, Berserk, Sleep, Darkness and Slow). Three of your people each
stand on one platform (which three platforms is open, §8 Q1). A seventh platform, a rock off to the
side, matters only when an aeon is out. You cannot flee. **Guard and Sentinel are greyed out for
everybody**, aeons included. Summon and Switch are not touched [R: RE §2.1], and Defend is not on
the formation's list of four (Escape, Flee, Guard, Sentinel), so it stays. Every member (the bench
too) has a new command, **Move**. All three of your people act before the Keeper's first turn
(First Strike) [R: RE §2.2].

**Your turn.**
1. You attack, cast, use an item or Summon as usual. Any action aimed at the Keeper that can change
   its HP (a hit, a spell, even a miss) makes it answer at once with a **sweep: Attack All on
   everyone standing on three neighbouring platforms**, the platform "in front" and the two beside
   it. A Scan, a buff or any command that cannot change HP draws no sweep and counts for nothing.
   A six-hit Overdrive is one hit event, so it draws one sweep, not six [R: RE §4.5].
2. The Keeper's "front" is wherever its last tail attack landed (it starts on platform 2). It turns
   to face its tail's target, so the sweep zone can be read off its facing [R: RE §3 item 7; the
   turning is a presentation row, RE §7 row 14].
3. **Move** costs your whole turn (rank 3) and sends the character to a free platform; the
   platform lands at the end of the hop, not when you pick it, and your old platform opens up
   [R + `derived`: RE §3 items 3 and 5]. A KO'd character still holds its platform and an Ejected one
   frees it [script reading; the KO half is live check Q4].

**The Keeper's turn, about every 21 ticks.**
4. Normally it uses **Berserk Tail** on one random living character (the Provoker if someone
   Provoked it): a plain hit with a 50 chance of Berserk, and that character's platform becomes the
   new front [R: RE §4.3].
5. Every damaging hit you land adds 1 to a hidden count. **On its next turn after the count reaches
   4, and only if no mine is live, it lays two Glyph Mines instead of using its tail**: two random
   unarmed platforms light up whether or not anyone stands there. The count resets [R: RE §4.3].
6. **A mine is a platform that has been given turns. Its own turn on the CTB bar is the blast.**
   When it comes up it kills whoever is standing on that platform at that moment (Death at chance
   255, so Deathproof does not help; the blast is "a fraction of maximum HP" at full power) or
   fizzles if the platform is empty. The mine shows on the CTB bar with its platform number.
   Arming is counted in hits, the fuse in CTB time, and **walking away is the defence**; you can
   also walk onto a ticking mine by mistake [R: RE §5].
7. At most two mines are live at once. The Keeper cannot lay more until both have gone off.

**With an aeon out.** The aeon is the whole front line. The Keeper stops using the tail and the
sweep and uses a plain Attack (power 24) on a random aeon. Every Keeper turn adds 1 to the count
and every damaging hit adds 2, so a mine comes quickly (2 hits, or 1 hit and 2 Keeper turns), and
the mine is the seventh platform, which kills a random living aeon [R: RE §4.4].

**The win.** HP 0 ends it; the body stays (death animation "Boss"). Spoils: 7,000 gil, 12,000 AP
(18,000 on overkill, threshold 8,000), a Lv. 4 Key Sphere (two on overkill), a steal of Ether or
Turbo Ether, always one piece of gear [R: RE §1.3]. The Keeper has no HP phases: the script reads
two thirds and one third of its HP and never uses them [R].

**The design fact `[derived]`.** The fight is about *where people stand*, not about phases. The
three rules (tail, sweep, mines) give a loop: hit, get swept, count to four, mines, move off, hit.
The hit count is also the player's clock: a slow, safe fight that lands few hits gets few mines,
and a burst of Overdrives gets one sweep. The thesis the guide should teach, in Jegged's words once
read (§8 Q10): *stand outside the front trio, step off a lit platform before its turn on the bar*.

## 3. Engine work

RE §7 lists 14 needs. Below, each is mapped to the files on `origin/main` f86e8f3e9, marked
**existing**, **partly** or **new**, and sized `[estimate]`: S under 1 agent-hour, M 1 to 3, L over
3. **Hard constraint (house rule 7, 400 lines): several host files are already at the cap**
(`src/battle/ffx/setup.ts` 399, `src/data/encounters.ts` 399, `src/battle/ffx/engine.ts` 395,
`src/data/chapter-meta.ts` 396), so all new logic goes in new files and an edit to a host file is
net-zero or a one-line hook. `src/battle/common/types.ts` and `src/data/encounters.ts` are contract
files (docs/CONTRACTS.md): additive only, one `CONTRACT-CHANGES.md` entry each.

| RE row | Need | State checked on f86e8f3e9 | Files | Size |
|---:|---|---|---|---|
| 1 | A platform (Position, 1 to 6, 7 for the aeon rock) on every actor, kept on a Switch, freed on an Eject | **New.** The contract `slot` is the sprite slot only (`types.ts:624`). Put it on the runtime, not the contract | new `src/battle/ffx/platforms.ts` (pure: position map, front trio, adjacency, free/occupy); a field beside `ordersOnly` in `runtime.ts:120`; the Switch copy in the swap routine's twin | M |
| 2 | **Move**, a party command on all seven, rank 3, aimed at a Circle, with a Warp reaction and a Position write after a delay | **Partly.** A trigger command with a target list is already a legal `Command` (`TriggerCommand.targets`, `types.ts:2064`) and Evrae's orders cost rank 3 (`evrae-rules.ts`, `ORDER_RANK`); the menu builds trigger rows with `targets: []` (`commands.ts:45-47`), so the aim at a map object is new | `commands.ts` (342), `engine.ts#submit` (395: net-zero), new `ai/spectral-keeper-move.ts` | M |
| 3 | The eight Circle actors: never part of the victory, **only targetable by Move**, hidden unless armed | **Partly.** Non-turn-taking hidden actors exist (`ordersOnly`: Dark Aeons, Gui, Isaaru, Omnis), the Omnis discs are the precedent for "figure-less combatants on floor anchors that the cursor still finds" (`scenes/garden-of-pain-discs.ts`, `engine/OmnisDiscTap.ts`). An "only targetable by one command" rule does **not** exist (grep: none) | new `src/data/ffx/enemies/spectral-keeper.ts`; a per-def filter in `targeting.ts:149,209,246` (321 lines) | M |
| 4 | Script hooks: onTargeted (Circle), onHit with the damage and the HP-class bit (Keeper), preTurn, the reaction queue | **Existing.** `ai/hooks.ts` (`HitReport.lastDamage`, `.affectsHp`, reactions queued with a target list, `forced`) | `ai/hooks.ts:58,127,192,239` | none |
| 5 | The hit counter (+1 per damaging hit; +2 and +1 per turn with an aeon out) | **Existing pattern.** | `ai/dark-aeons-rules.ts:29,31`; new `ai/spectral-keeper-rules.ts` | S |
| 6 | The sweep: Attack All on whoever stands on three platforms chosen by a variable | **Partly.** The queue takes a target list; the platform grouping is new | `ai/hooks.ts:192`; `platforms.ts` | S |
| 7 | **Mines**: a Circle given turns by a script, shown on the CTB bar with a platform icon, blasts on its own turn, then disarms | **Partly, and the riskiest row.** A script can flip a hidden actor's `ordersOnly` (`macalania-acts.ts:50,102`), but `ordersOnly` actors are not counted by the clock at all (`adapt/ctb.ts:71 takesPart`), and the adapter passes `getsTurns: true` for everyone (`adapt/ctb.ts:92`), so an *unarmed* Circle's counter never cycles. The game keeps an unarmed Circle in the scheduler with its counter cycling to a stored base (`kernel/ctb-scheduler.ts:149`), which is what makes the fuse "between 1 tick and one full base" (RE §5.4). A faithful port needs a per-actor "keep cycling while idle" flag in `schedulerView`, guarded so every other FFX battle's event log stays byte-identical (CHK-021). CTB-bar icon 1 to 6 is UI (`ui/ffx/CtbList.ts`) | `adapt/ctb.ts` (202), `kernel/ctb-scheduler.ts` (153), `ui/ffx/CtbList.ts`, new rules file | M to L |
| 8 | The blast: Death 255 plus the fraction-of-maximum formula on the occupant | **Existing rules**, new data rows: chance-255 rule `kernel/status-inflict.ts:257`, formula 8 `kernel/damage.ts:217` | data rows (RE §1.4: 0x6048 formula 8, power 16, cap 99,999) | S |
| 9 | Berserk Tail (physical, power 16, Berserk 50, Provoker or random living target) | **Existing.** `game-rolls.ts:72 randomLiving`, Provoke redirect `targeting.ts:219` | data row | S |
| 10 | Escape and Flee off | **Existing** (`rt.canEscape` defaults false, `setup.ts:298`) | formation data | none |
| 11 | **Guard and Sentinel off for the whole battle** | **Mostly there. The RE note is stale on this row.** Re-parity RC10 landed `src/battle/ffx/formation-commands.ts` (205 lines, 2026-10-18, commit 468319f2d, after the commit the note read) with `EnemyGroupDef.commandDisables` and the switch `FORMATION_COMMAND_DISABLES = true`; "who: everyone" covers aeons. **What is missing is only the two ids**: `GAME_COMMAND` has no 0x3022 or 0x3023, and `menuCommandOf` maps an ability row by category, where Guard and Sentinel are both `category: 'special'` (`abilities/special-utility.ts:93,119`), the same category as the other Special-menu rows, so a category entry would grey those too. Add an ability-id override (guard to 0x3022, sentinel to 0x3023; the ids are already in `command-records/player.ts:63-64`) | `formation-commands.ts` (+about 15 lines), the group's `commandDisables` data, one test | S |
| 12 | **First Strike for the front line** (all three act before the Keeper) | **Partly.** `adapt/ctb.ts:177` grants it only to a combatant wearing the auto-ability; the kernel already zeroes the counter for it (`kernel/ctb-init.ts:108-109`). A battle-level switch is one optional `EnemyGroupDef` field read in `openingCtb` | `types.ts` (+1 optional field, contract note), `adapt/ctb.ts` (+2 lines) | S |
| 13 | **Aeon mode**: the seventh platform, plain Attack (power 24), a turn-counted hit counter, a one-mine lay on the rock that kills a random aeon | **New.** The summon exists; a platform for it does not | `aeons.ts` (154), `platforms.ts`, rules file | M |
| 14 | Presentation: six glyph platforms and a rock, a lit mine and its blast, the Warp hop, the Keeper turning to its tail target, CTB icons, a Move picker | **New.** The Dome painting exists; see §7 | `scenes`, `ui/ffx`, `engine` | M to L |

**Extra rows found in the mapping (not in the RE table):**

| # | Need | State | Size |
|---:|---|---|---|
| 15 | A `platform` battle event (who moved, from, to) so the presenter can animate the Warp, plus VFX keys for lit glyph and blast; the rest rides on `status-add`, `damage`, `ko`, `vfx` and `camera` events | **New, additive** `BattleEvent` member in the contract (`types.ts:2190`) | S |
| 16 | Loot record for `m129` (Circle has none) | **New data**, `src/data/ffx/loot/records.ts` pattern | S |
| 17 | Chapter plumbing: new `ChapterId`, `Chapter.number` widened to 29 (the union stops at 28), meta, story, door word, guide, tactic. The nearest precedents: Last Summoning (14 files) and Angra Mainyu (43 files) | **New**, via side tables and new files (encounters.ts is at 399 lines) | M |
| 18 | The Keeper's `onHit` branch for Kimahri's Self-Destruct (frees character 3's platform, RE §4.5 item 4) | **Unreachable with the sourced party**: Kimahri's list in `zanarkandBuild` is Lancet, Scan, Jump, Mighty Guard, White Wind. Port it (a few lines) so the rule is whole, or leave it and say so | S |

**Order of dependence (RE §7 closing line, confirmed):** 1 (Position) before 2 (Move); 3 (Circles)
before 2 and 7; rows 11 and 12 are tiny, independent and can ship first; 6 before the Keeper's AI;
7 waits on the fuse check (Q2). The Keeper's turn and hit rules (RE §4.3 to 4.6) and the Circle's
(RE §5.2, §5.3) are short enough to port line for line once 1 to 3 exist.

## 4. The party

- **The sourced line is already in the repo.** `zanarkandBuild` (`src/data/ffx/builds/zanarkand.ts`)
  is documented as the party "after the Chamber of the Fayth, immediately following the Spectral
  Keeper". Front line **Tidus, Yuna, Auron** (`activeSlots`), reserve Wakka, Lulu, Kimahri, Rikku.
  S.Lv Tidus 46, Yuna 44, Auron 48, Kimahri 42. The build is an `[estimate]`, as its own header
  says; the build *point* is sourced.
- **Move belongs to all seven** characters, bench included (RE §2.2 item 3), so a bench member who
  is Switched in can Move at once. Auron has Guard and Sentinel in his list; they are what row 11
  greys out, so the usual way to blunt the sweep is gone by design.
- **In the game the player picks any three.** A fixed trio is the repo's convention (Yunalesca uses
  the same one); the only sourced alternative is "free choice", which a fixed-party chapter cannot
  offer. Picked as SK5 (delegatable, §11).
- **Gaps, none of which this note fills (rule 6):** the loadout at the Keeper (the build wears the
  Yunalesca Ward and Proof set: Confuse, Zombie and Death Ward; the Keeper tests Berserk 50 instead);
  the aeon gauges at the Keeper's start (the build's are the post-Keeper, lower ones: its own comment
  says the party "has just spent aeons on the Spectral Keeper"); the bag. All three are `[estimate]`
  carried over, to be measured (T10), never tuned toward a result.
- **Boss numbers are never tuned** (PRODUCT-BRIEF "mechanics never bend"). If the measured line
  is unwinnable or trivial, Bailey gets options with numbers.

## 5. The arena

- **The Zanarkand Dome scene exists.** `src/scenes/zanarkand-dome.ts` (with `-giants.ts` and
  `-debug.ts`), registered in `src/scenes/index.ts` (key `zanarkand-dome`, slots `ZANARKAND_DOME_SLOTS`),
  plate `public/art/backdrops/zanarkand-dome.png` plus sidecar (local, gitignored, backed up). Seven
  camera rigs (`intro`, `idle`, `action`, `party`, `enemy`, `yunalesca`, `victory`) solved against a flat
  matte that cannot be panned; party arc in the lower left, boss spot about (2.5 to 2.8, 0, -4.0)
  inside the FFX HUD's safe area (CTB queue right of 0.843; party status below 0.717).
- **A reuse is a stand-in, not the game's room.** In the game this fight is the area `dome02`; the
  Yunalesca fight is launched later from `dome0600` (RE §2.1), and `research/ffx-yunalesca.md:59` puts the Keeper "at
  the bottom of the Cloister lift" `[single source]`. Our painting is Yunalesca's great hall. The RE note
  describes no room geometry beyond the hexagon (radius about 70 game units) and the rock (204 units to
  the side), so nothing sourced says the hall's floor is wrong, and nothing says it is right.
- **No phone rigs.** The Dome scene has none (the Cloister has `CLOISTER_PHONE_RIGS`). A platform layout
  that must read at 390 x 844 is therefore new camera work, which is part of SK1.
- **Options for Bailey (SK2):** (a) reuse the plate as is, platforms as props on its floor (0 new
  plates; the Omnis discs did this), (b) a floor variant of the same hall with a glyph-ring floor
  painted in (1 new plate; the approved plate stays untouched), (c) a new interior (1 new plate plus
  rigs). **Recommendation: (a), then (b) only if SK1's frames show the props fighting the painting.**

## 6. New art needed

Counts are images. Poses follow the repo's boss sets: Paragon and Trema have idle, attack, cast and
hurt; Natus adds ko; some have an idle@2x.

| Asset | Images | Note |
|---|---:|---|
| The Spectral Keeper (a Spirit Beast, `[W]`) | 5 to 6 | idle, attack (the tail), cast (laying mines), hurt, ko (the body stays: "Boss" death), idle@2x. Look = SK3 |
| Platform glyph (the hexagon platform) | 3 | unlit, occupied, mined (lit). One painting serves all six, numbered by an overlay |
| The aeon rock (platform 7) | 1 | only seen with an aeon out |
| The "front trio" floor tell | 1 | only if SK1 picks a floor tell (A) rather than a HUD tell (B or C) |
| Mine blast and the Warp hop | 2 | may be drawn in code (the engine's VFX) instead of painted |
| Backdrop | 0 | reuse `zanarkand-dome.png` (SK2 a), or 1 if SK2 b or c |
| Chapter card, thumbnail, pause plate | 3 | from the SK3 pick |
| **Total** | **about 13 to 15** | plus 1 plate if SK2 is not (a) |

- **No stature row exists** for the Keeper (`src/data/ffx/fiend-stature.ts` has none), so its on-screen
  size is `[estimate]` until an RE stature read of `m129` (the same method as the other rows). Ask
  the RE session for it with the live checks.
- Art route is the driver's (Codex Art Room per the standing art rules); nobody queues ComfyUI here
  (rule 12). Retail references are allowed since 2026-10-18 (hard rule 8) but the painting that ships
  must match the approved painted look (rule 9; "new art matches the game's art"). Bailey alone
  approves a painting.

## 7. Presentation needs, and three layouts for the mockup lane

**What is new on screen** (all of it perceivable, so all of it needs a pick first, rule 9):
(1) six platforms and a rock as places people stand, (2) which platform each person stands on,
(3) the sweep zone (three adjacent platforms), (4) a mine's lit state and its place on the CTB bar,
(5) a Move command that picks a platform instead of a character, (6) the hop. The nearest precedent
is the Omnis discs (Chapter XII): figure-less combatants on floor anchors that the target cursor
still finds, a scene prop module (242 lines), a HUD readout strip with a landscape and a phone variant
(`ui/ffx/OmnisReadout.ts`, 338 lines), and the pick of the O-2 and O-4 options before building.

**Every layout must respect:** the FFX HUD rails at 1600 x 900 (CTB queue x 0.843 to 0.970, y 0.138 to
0.557; party status x 0.629 to 0.964, y 0.717 to 0.967; command stack x 0.047 to 0.329, y 0.568 to
0.928; Sensor x 0.300 to 0.482, y 0.067 to 0.283, per `docs/ENGINE-API.md#hud-safe-area`); the flat
matte that cannot be panned; labels at least 12 px on a 390-wide phone; no Flee row. **Picking a
layout approves no phone battle HUD for other chapters** (that question is cross-chapter, game case
both, and already asked in `docs/concepts/layout/phone-battle-hud/`).

**Frames to draw (one moment, all options):** the Keeper's tail has just landed on platform 3 (front
trio 3, 4, 2); two mines lit on 1 and 5 with their CTB rows showing; Tidus on a lit platform with the
Move picker open on the free ones; Auron and Yuna in the safe trio. Do not draw the opening frame as
fact: the starting platforms are unsettled (Q1), so an opening frame is labelled "illustrative".

- **Layout A — "The ring on the dais" (the game's own geometry).** The six platforms are glyph
  discs on the hall floor in a foreshortened hexagon around the Keeper; the three near ones sit in the
  lower half of the frame between the party's present arc and the CTB rail, the three far ones
  behind and beside the Keeper. The front trio is a gold wedge on the floor and the Keeper turns toward
  it. A mined disc glows and pulses; the Move picker numbers the free discs. No new HUD panel.
  Strengths: reads exactly like the game, the sweep is *seen* on the floor. Risks: the far platforms
  are small and half-hidden behind a boss that stands in the middle; the right-hand platforms crowd the
  CTB rail; at 390 px the ring is a few pixels per disc. Cost: a floor-prop module, a new rig or two.
- **Layout B — "Ring plus dial".** The scene keeps the party in its usual arc but standing on three of
  six glyph discs drawn big in the foreground; the full geometry lives in a compact **platform dial**
  HUD (a hexagon of six nodes and a seventh off to one side): who stands where, the front trio shaded,
  armed mines pulsing with a fuse bar, and the Move picker is the dial itself (click a node). It is the
  Omnis disc strip transposed. Strengths: always legible, a phone variant is natural (the Omnis strip
  has one), cheapest to build. Risks: the figures hop between discs that sit close together, so the
  scene shows less of the ring than the game did; one more panel in a busy HUD.
- **Layout C — "Lanes" (the ring unrolled).** The six platforms become a left-to-right row of slots in
  the foreground, the Keeper large above them, the seventh slot detached at the right end. The front
  trio is a bracket spanning three adjacent slots and wraps from 6 to 1 with an arrow; mines are lit
  slots with a fuse tick on the CTB rail; Move is "step left or right or pick a slot". Strengths:
  simplest to read on any screen, all six always visible, plays like a fighting-game lane. Risks: it is
  not the game's geometry (the Keeper is not in the middle), the wrap-around adjacency must be
  taught, and the sweep may read as unfair at the ends.
- **My lean, for Bailey to overrule:** draw A as the target, C as the contrast, and show B as the
  optional dial that can be added to either (so the mockup lane draws A, B-on-A and C). If A is
  illegible once the HUD rails are laid over it at 1600 x 900, C is the fallback.

## 8. Open questions, and the live checks that settle them

Live checks need the Steam FFX at the Dome. The RE session runs them (Bailey, 2026-10-19 00:41,
verbatim: *"You can launch the games if you need to do any research"*), scheduled so they do not skew
a review's frame timing. **Known risk: FFX.exe has drawn a white window intermittently since
2026-10-01** (it did not on 2026-10-19 01:01), which would delay Q1 to Q6; FFX-2.exe is unaffected.
A save standing before the Keeper is needed (the 107-save pack is not catalogued in the notes I read).

| # | Question (RE §8) | Why it matters | How settled | Blocks |
|---:|---|---|---|---|
| Q1 | Where do the three characters start: platforms 1, 2, 3 or 0, 1, 2 with a step? | The engine writes 0, 1, 2 but every script rule reads like 1, 2, 3 (Circles 21 to 23 untargetable, front starts at 2, facings -90 and -120) | Read actor + 0x4fe for the three characters, or see which platforms Move can pick (RE: the Timing lane's read-only reads are enough) | the opening frame, the first Move list |
| Q2 | How long does a mine really burn? | The fuse is the idle counter's phase and a stored base of 84 or 45 (RE §5.4: 84 likelier); no source gives a number, so it is not ours to choose | Time the Glyph Mine to the blast against the CTB bar over several fights; read the Circle's counter (+0x65c) and base (+0x65d) at arming | **row 7 (mines) cannot be tuned before this** |
| Q3 | Do the two armed Circles come uniformly from the unarmed six? | Fixes the RNG use of the mine picker | Tally 30 or more lays | row 7 test |
| Q4 | Does a KO'd character keep its platform? | The script says yes (only Eject frees one) | KO a character, try to Move onto the platform | row 1 (build to the script; verify) |
| Q5 | Can Move target the Keeper, and does it cost rank 3 on the bar? | The target list and the turn price | Look at the list and the bar after a Move | row 2 (our menu will not offer the Keeper; harmless) |
| Q6 | Does a miss draw a sweep, and does a party counter-attack still add to the count? | The scripts say yes to both; the engine's reaction filter drops a counter-attacker's queued sweep (RE) | A miss, then an Auto-Potion or counter turn | row 5, 6 test |
| Q7 | Does a results panel follow? | The flag word asks for none; the next room (320) was not read | Watch the end of the fight | delegatable (§11 SK13) |
| Q8 | What does BattleDistance 1 do for the front line (reach input or animation)? | Only if it changes who can be hit | Not needed to build | none |
| Q9 | Is the unreachable Absorb block a removed design? | None on play | Not needed | none |
| Q10 | What does Jegged teach for this fight? | The guide follows Jegged's encounter guides, in our words (standing rule 2026-10-03); the candidates note saw only a search snippet | Read the Zanarkand Cloister of Trials page properly (headless, not WebFetch's summariser, which once invented lines) | the guide and the tactic |
| Q11 | The Keeper's on-screen size | No stature row | An RE stature read of `m129` | scene scale |
| Q12 | Aeon gauges and the loadout at the Keeper's start | The build is the post-Keeper snapshot | Measure, never tune | bench |

## 9. How it fits the Pilgrimage runs

The core loop is a *run*: a road of existing chapters, a pick of one of three one-fight boons after each
win, elites that pay two, the faithful party and the faithful boss at every stop (PRODUCT-BRIEF, D-1024,
D-1030, D-1041). The prototype (`pilgrim`, hidden, FFX only) walks four tiers: Seymour and Anima; Evrae or
Yojimbo; Natus or the Mirror Aeons (elite); Braska's Final Aeon. A stop is a `ChapterId` in
`src/app/pilgrim/route.ts` (93 lines); a boon is a clone of the stop's shipped party build, so a chapter
needs no special code to be a stop. The brief names "the new chapters (Spectral Keeper, the Fallen
Maesters) as stops" as a next step after he plays the prototype.

- **As a stop (recommended).** Directly before Yunalesca on a longer road (the 7-stop mock road had
  Flux, then Yunalesca): Keeper, then Yunalesca, both on `zanarkandBuild`, so the party is the
  same and the boon taken after the Keeper arms the Yunalesca fight. Story order is respected (the
  build point is "immediately following the Spectral Keeper"). Needs the longer road, which does not
  exist yet (the prototype has no Yunalesca stop).
- **As an elite.** Not recommended: it is a mandatory story gate and has no HP phases, so "harder and
  optional" is not what it is. An elite pays two boons and has a fixed party; the Keeper's party is
  already fixed, so the mechanical fit exists if Bailey wants a pairing "Yunalesca or Keeper-then-Yunalesca".
- **Boon interactions `[derived]`:** the ten-row pool has no way to stop a mine (Death at 255 lands
  through every resist); Mega Phoenix and Auto-Phoenix answer one after the fact. The sweep is a
  physical hit (power 32), so a Light Curtain (Protect) softens it, and Lunar Curtain does not. Stepping
  off a lit platform is the only real answer to a mine, so a boon-rich run is not trivial by
  construction. Not measured.
- **Dependencies:** `getChapter` must resolve a hidden chapter inside a run (one line for the
  integrator to check); the Keeper's mines and Move sit on the engine, not on the run layer.

## 10. Review class

`node tools/critic-plan.mjs --paths src/data/encounters.ts,src/data/chapter-ffx-spectral-keeper.ts,src/data/chapter-meta-ffx-spectral-keeper.ts,src/battle/common/types.ts,src/battle/ffx/platforms.ts,src/battle/ffx/formation-commands.ts,src/battle/ffx/adapt/ctb.ts,src/battle/ffx/commands.ts,src/battle/ffx/engine.ts,src/battle/ffx/ai/spectral-keeper.ts,src/battle/ffx/ai/spectral-keeper-rules.ts,src/data/ffx/enemies/spectral-keeper.ts,src/scenes/zanarkand-dome.ts,src/scenes/zanarkand-dome-platforms.ts,src/ui/ffx/platform-markers.ts,src/app/pilgrim/route.ts`
(run 2026-10-19, read-only, in `D:\Final Fantasy`) returned:

```
review:       DEEP
before deploy: FOCUSED review of the production candidate
after deploy:  live verification, then the DEEP review on the live build
obligations:  live + focused + deep
systems:      FFX CTB engine; FFX HUD; FFX game data; Zanarkand Dome scene; chapter registry or a new chapter; shared combat core; unclassified product path
checks:       CHK-003 004 006 007 008 009 010 011 013 015 016 017 020 021 022 023 026 027
```

**DEEP.** Reasons: the chapter registry (`encounters.ts`), the shared combat core (`battle/common/types.ts`)
and the FFX engine (`battle/ffx/**`) are each a deep row of `critic/policy.json`; a presenter edit
(`engine/BattlePresenter*.ts`) would add a fourth. **Not save-data class** (`SaveData.ts` is untouched;
`SaveData.chapters` is a free-keyed record that `sanitizeChapters` accepts, and a hidden chapter does not
write to it). Two notes on reading the output: the working tree's `policy.json` is behind `origin/main`
(it lacks the r55 row that classes `src/app/pilgrim/**` as FOCUSED), which only changes the
`route.ts` line, not the class; and the rule "at most two deploys may go out while a deep review is owed"
applies, so **ship the two chapters in one release** so they share one deep review.

## 11. Build order, tracks, and the decisions Bailey must make

### 11.1 Recommended order (small vertical slices that can ship; findings go live as they land)

```
NOW   (paper)   Bailey answers SK1 to SK4 (layout mockups + Keeper concepts go out together)
                RE session books the live checks Q1 to Q3 (+ Q11 stature) with Bailey's go
                T1 small seams: row 11 (Guard/Sentinel ids) and row 12 (battle First Strike)
                  + contract notes; byte-identical logs for all 18 chapters (CHK-021)
THEN  (rules)   T2 data rows + loot -> T1 platforms.ts + Move + Circles (rows 1 to 3) -> T3 AI
                  (Keeper turn, hit counter, sweep; Circle onTargeted/Move) -> aeon mode (row 13)
                  -> mines (row 7) only after Q2; engine-level tests against the RE rules
                On the picks: art finals -> scene props -> HUD (Move picker, CTB mine icons, dial)
                  -> story draft (Bailey reads) -> guide + tactic (after Q10) -> audio stand-in
LAST            integrator (id, number 29, door word, meta, CONTRACT-CHANGES, CHANGELOG, pilgrim stop
                  if SK8 says yes) -> node tools/orphans.mjs -> real-input win and loss in a browser
                  -> screenshots -> focused review -> deploy (with the Maesters) -> live check -> deep review
```

| Track | Files (single owner each) | Depends on | Hours `[estimate]` |
|---|---|---|---:|
| T0 checks | scratch only; RE live checks Q1 to Q3, Q11 | Bailey's go, FFX.exe not white | 0.5 + RE time |
| T1a small seams | `formation-commands.ts`, `adapt/ctb.ts`, `types.ts` | none | 1.0 |
| T1b platforms, Move, Circles, sweep | `platforms.ts`, `commands.ts`, `engine.ts` (net-zero), `targeting.ts`, `runtime.ts`, `types.ts` (event) | T1a | 4.0 |
| T1c mines | `adapt/ctb.ts`, scheduler flag, `ui/ffx/CtbList.ts` icon | Q2, T1b | 3.0 |
| T1d aeon mode | `aeons.ts`, rules | T1b | 1.5 |
| T2 data | `data/ffx/enemies/spectral-keeper.ts`, loot record | none | 1.0 |
| T3 AI | `ai/spectral-keeper.ts`, `-rules.ts`, `-move.ts` | T1b, T2 | 2.5 |
| T5 scene | `scenes/zanarkand-dome-platforms.ts`, rigs | SK1, SK2 | 2.0 |
| T6 HUD | `ui/ffx/` Move picker, dial (if B), mine icons | SK1 | 3.0 |
| T7 story, guide, tactic | `story/scripts`, `data/guides`, `engine/tactics` | Q10, SK11 | 2.5 |
| T8 art install | boss and glyph sets, card | SK3, SK4 | 1.0 |
| T9 audio stand-in | cue reuse | SK10 | 0.25 |
| T10 integrator | encounters, ids, meta, door, notes | all | 1.5 |
| T11 tests and measure | units per RE rule; absence for all 18 chapters; a bench of scripted lines | T1 to T3 | 2.5 |
| **Total** | | | **about 25 agent hours** plus judging and review; all agents run on Sonnet, the main session plans, reviews architecture and validates |

**Acceptance cases (T11), each from a RE row:** First Strike gives all three characters a turn before
the Keeper's first; Guard and Sentinel are greyed and refused for the party and the aeons, Defend is
not; Move costs rank 3, hops after the delay, frees the old platform, and is refused onto an occupied
one; an Eject frees a platform and a KO does not; the sweep picks exactly the front trio for each of
the six fronts; the counter reaches 4 only on damaging hits (miss, heal, Scan add nothing; an Overdrive
adds one), and the next Keeper turn lays two distinct unarmed Circles and resets the count; no new lay
while a mine is live; a blast kills its occupant through Deathproof and fizzles on an empty platform;
with an aeon out the tail and sweep are replaced by Attack, the count rises by 2 per hit and 1 per
Keeper turn, and the rock's mine kills one aeon; **absence (rule 14, CHK-021): all 18 listed chapters'
event logs byte-identical at fixed seeds, FFX-2 untouched.**

### 11.2 Decisions

| # | Decision | Options and my recommendation | Whose |
|---|---|---|---|
| SK1 | The platform layout (§7) | A ring on the dais / B ring plus dial / C lanes. Draw A as the target, C as contrast, B as an add-on. One round of mockups at 1600 x 900 and 390 x 844, then one refinement | **Bailey** (rule 9; perceivable) |
| SK2 | The arena (§5) | (a) the Dome plate as is, platforms as props / (b) a glyph-floor variant of the same hall / (c) a new interior. Recommend (a) | **Bailey** (D-1039: "his arena and art pick") |
| SK3 | The Keeper's look | 3 concepts at battle scale beside the Chapter II party (rule 9, one options round) | **Bailey** |
| SK4 | The platform glyph, the mine's lit state and blast | 2 or 3 concepts, in the same round as SK3 | **Bailey** |
| SK5 | The party | Tidus, Yuna, Auron on `zanarkandBuild`, Move on all seven; loadout and gauges `[estimate]`, measured | **Delegatable** (sourced build point) |
| SK6 | Aeon mode in the first build | Build it: the formation disables no Summon and the brief says mechanics never bend. The alternative (Summon off) is a deviation to disclose | **Delegatable** (the brief decides) |
| SK7 | The mine fuse | Wait for Q2. If the live check cannot be made, either hold the chapter or ship the likelier base (84) labelled `[estimate]` | **Bailey, only if Q2 fails** |
| SK8 | The Pilgrimage placement (§9) | A stop before Yunalesca on a longer road (recommended) / an elite / not in the first road | **Bailey** (new gameplay idea, rule 10) |
| SK9 | Hidden first, then listed | Hidden behind a typed word per D-1039 (number 29). The word is a house detail; listing later is his | word **delegatable**; listing **Bailey** |
| SK10 | The battle music | Reuse Yunalesca's `boss-challenge` as a flagged stand-in; a new cue only on his ear (rule 13) | **Delegatable** to ship a stand-in; **Bailey's ears** for the final |
| SK11 | Story: pre and post scene, mid-fight callouts | A draft in our words (the writing bible), Bailey reads it first (Gippal GP15 precedent) | drafting **delegatable**, shipping needs **Bailey's read** |
| SK12 | The live checks | Q1 to Q3 and Q11 by the RE session; covered by his 2026-10-19 00:41 words, scheduled around reviews | **already given**; no new ask unless FFX.exe stays white |
| SK13 | Results panel after the fight | Show the normal results page (the game's flag word asks for none, Q7) | **Delegatable** |
| SK14 | Ship together with the Maesters | One release, one deep review (deploy cap) | **Delegatable** (driver) |

## 12. Top risks

| # | Risk | Mitigation |
|---:|---|---|
| R1 | Mines change the shared CTB adapter that every FFX fight runs through | a per-actor flag, byte-identical event logs for the 18 chapters (CHK-021), deep review class; built last, after Q2 |
| R2 | The fuse is unknown (45 or 84 base, unknown phase) and rule 6 forbids choosing | the live check; hold the mine timer until it lands |
| R3 | The new layout may not read at 1600 x 900 with the HUD rails, or on a phone (the Dome scene has no phone rigs) | mockups first at both sizes; C is the fallback |
| R4 | The start platforms are unsettled (Q1) | do not draw the opening as fact; settle before the first Move list |
| R5 | Host files at the 400-line cap (`setup.ts` 399, `encounters.ts` 399, `engine.ts` 395) | new files for logic; net-zero host edits; a split if a host cannot stay under |
| R6 | The RE engine table is stale on row 11 | corrected here: use the existing RC10 module |
| R7 | FFX.exe's white window can block the live checks | the RE session reports; ask Bailey only if it persists |
| R8 | A stand-in arena (Yunalesca's hall for the Keeper's room) | said in the chapter blurb file and the handoff; SK2 is his |
| R9 | Aeon mode doubles the AI surface | built as its own slice with its own tests |

## Corrections and findings (what the mapping turned up)

1. **RE §7 row 11 is stale.** `formation-commands.ts` (RC10, 2026-10-18) already gives a whole-battle
   command-disable switch; only the Guard and Sentinel ids are missing, and they must be mapped by
   ability id because both are `category: 'special'`.
2. **RE §7 row 2** can lean harder on existing code: a trigger command may already carry targets; the
   new part is offering Circles in the menu and the hop.
3. **Row 3** has a good precedent the note did not cite: the Omnis discs (figure-less combatants on
   floor anchors).
4. **The hall is a stand-in** for the Keeper's room (area `dome02`, not Yunalesca's `dome06`).
5. **The 400-line cap** binds four host files; the plan puts logic in new files.
6. **Not run:** no engine run, no live check, no fetch of Jegged. Usage mode was not read by this
   agent (the driver sets it, AGENTS.md rule 15).
