# Paper preflight: Chapter 45 (hidden) — Belgemine's Challenge, the Remiem Temple (FFX) — branch `ch-belgemine`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `docs/plans/ch-keeper-review.md`, `ch-tourist-trap-review.md` and the wave-3 drafts (`ch-youth-review.md`): a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-07 by a Sonnet sub-agent of the release driver, as the paper preflight of plan row 45 (wave 4) from its research note (`re-ffx-belgemine-aeon-duels.md`, "RE §n" below). It is a **draft**: the driver reads it, takes or overturns each pick in section 10, and a build lane starts from it. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables of section 3.4).

**Authority (relayed words, verbatim):** 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too" (every researched boss he never picked); 2026-11-07 "ok keep going we have full usage here"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick below is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note (written first, in this lane), `origin/main` 63813367c by `git show` (`src/battle/ffx/aeon-duel.ts`, `ai/isaaru.ts`, `ai/possessed-sisters.ts`, `ai/yojimbo.ts`, `data/chapter-isaaru.ts`, `data/chapter-mirror-aeons.ts`, `data/ffx/builds/via-purifico.ts`, `mirror-aeons.ts`, `late-aeon-rows.ts`, `endgame-aeons.ts`, `data/ffx/aeons/index.ts`), `PLAN.md` rows 34, 36, 45 and section 8, the art mirror (the local copy of the approved art, kept outside the repo: characters and backdrops). Nothing was run in the engine, so rule 3 is owed by T0 and T7.

**Verdict: PROCEED on the eight Remiem duels.** The duel machinery, the mirror lock, the Isaaru aeons, the Sisters and Yojimbo exist; the eight scripts and eleven records are new data on it. Everything Bailey will see or hear waits for the picks of section 10 (hard rule 9), which the driver takes under the delegation above. The three field duels (Mi'ihen, Moonflow, Calm Lands) stay out of the first build for one reason (BD1).

## 1. Game case and sources

**Game case: FFX only.** Yuna's aeons, Summon, Shield, Boost and CTB are FFX's; the FFX-2 aeons (rows 164 to 180) are different fights and are not touched. The shared plumbing (registry rows, door row, scene row) is "both" (`critic/CHECKS.md` CHK-020) and additive.

**Sources** (the note's tags): the ten monster scripts run on the real bytecode [H], the records and move rows [R], the event packages that launch each battle [R], Gamer Guides HD and Jegged for the guide view [G]. The repo's `research/ffx-isaaru-aeon-contest.md` is marked superseded and covers Isaaru, not Belgemine; **the repo has no earlier Belgemine note**.

**The plan's row 45 corrected by the files (RE §0, §2):** `m258` and `m259` are unused prototypes; the real files are `m284`, `m254`, `m285`, `m286`, `m287`, `m288` (+ dog `m266`), `m265`, `m289` to `m291`, shared with Isaaru's three aeons; there are eleven duels (3 field + 8 Remiem), not "four places"; `kino04_40` is dead; the "aeon-contest engine" is Chapter XIV's `aeon-duel.ts`, which the new chapter reuses; the party question (one build per chapter) is the real design point.

## 2. What the player experiences, act by act (plain words)

Yuna stands in the Remiem Temple's court and Belgemine, the old summoner who has teased her since Mi'ihen, calls her aeons one by one. Yuna fights alone; she summons, orders, shields; she cannot call the aeon Belgemine holds. A duel ends when one side's aeon falls. No duel is a game over.

| Act | Belgemine's aeon (RE §3) | HP | What it does | What it asks of the player |
|---:|---|---:|---|---|
| 1 | **Valefor** | 20,000 | Attack, Sonic Wings (delay) one turn in three; **after a magical hit and a gauge of 30, Energy Ray**; Energy Blast at 100 | Any aeon but Valefor; physical hits avoid the Ray |
| 2 | **Ifrit** | 28,000 | Attack; **a physical hit brings Meteor Strike next**; Hellfire at 100; absorbs Fire | Shiva or Ixion; magic, not physical |
| 3 | **Ixion** | 30,000 | Aerospark (strips buffs), Attack; **braces (Defense and Magic Defense 255) or evades (Evasion 255) half the turns, charging 25 from the matching hit**; Thor's Hammer at 100; absorbs Thunder | Hit with the type he is not guarding against |
| 4 | **Shiva** | 20,000 | Attack, Blizzara, Heavenly Strike (delay); under half HP she heals with Blizzaga; Diamond Dust at 100; Evasion 50; absorbs Ice | Magic, not physical; finish quickly |
| 5 | **Bahamut** | 35,000 | **Five idle turns, then Mega Flare**; counters hits, a fifth counter is Impulse | Shield the sixth turn; Anima or Ixion hit hardest |
| 6 | **Yojimbo** and Daigoro | 32,000 | by gauge band Daigoro, Kozuka, Wakizashi; Zanmato at 100 | Keep the gauge low: do not feed it hits |
| 7 | **Anima** | 54,000 | Attack, Pain (Death), Demi, Dispel; **her gauge fills only from hits she takes**; Oblivion at 100 | Fewer, heavier hits; Shell |
| 8 | **The Magus Sisters** (Mindy 20,000, Sandy 35,000, Cindy 48,000) | 103,000 in three bodies | Mindy's spells, Sandy's Razzia, Cindy's Mighty Guard / Delta Attack | Kill Mindy first, or use a group Overdrive |

**Seams.** Between duels the game lets the player talk to Belgemine again (a menu, a heal, a save); the chain here restores HP and MP and starts each act with the preset's gauges (BD3). The Flower Scepter (after Bahamut) and the Blossom Crown gate the Sisters in the game; the preset owns everything, so all eight acts are available in the game's order. **The "send Belgemine" ending is a scene, not a mechanic; the chapter shows it as a closing card (BD10).**

**Corrections to keep:** (a) Mi'ihen's Ifrit has 3,000 HP in the file (guides print 3,500) and no Overdrive move; (b) Remiem Anima never fills her own gauge; (c) Remiem Ixion's brace/evade bonus (25) is not in any guide; the intent board says so in plain words (T5).

## 3. Engine work

Checked by reading `origin/main` 63813367c.

### 3.1 What is new (small)

| # | Item | Why | Size |
|---|---|---|---|
| E1 | **Eight AI scripts** (`ai/belgemine.ts`, `belgemine-b.ts` under 400 lines each): Valefor, Ifrit, Ixion, Shiva, Bahamut, Anima, Yojimbo (the Cavern Yojimbo's gauge bands with Remiem's +2/+3), and the three Sisters | RE §3.5 to §3.12; each follows its harness output draw for draw | 8 h |
| E2 | **Eleven enemy records** (the block of section 0, `[R]`) as `data/ffx/enemies/belgemine*.ts`, attached by the Isaaru records' pattern | the stats are written by the script, so the record holds them | 3 h |
| E3 | **Hit-type gauge bonuses** (Valefor +15 and the Ray flag on magic; Ifrit's physical flag; Ixion's +25 while braced or evading; Anima +5 per hit; Shiva +5 on HP damage) via the `onHit` hook | the hook receives the damage type in the Isaaru/Evrae scripts already; T0 proves it | 1 h |
| E4 | **A Remiem group with Daigoro as a second body** and **the Sisters as three bodies** | the Cavern Yojimbo group and `possessed-sisters.ts` are the precedents | 1 h |
| E5 | **The ladder HUD chip** (section 7, option A) | a chip row over the existing chain HUD | 1.5 h |

### 3.2 What exists and is enough

The duel flags (`aeonsOnly`, `lockedAeons`, `victoryBonusAp`, the greyed "Only an aeon can fight an aeon" and "Mirror of ..." rows) [`aeon-duel.ts`]; the chain machinery (`nextGroupId`, `carriesFullPartyState`, `canEscape: false`, `checkpointOnEntry`, heal-between-acts as in the Mirror Aeons chapter); Yuna's ten aeons with abilities and the formula-derived stats [`data/ffx/aeons`, `endgame-aeons.ts`]; the enemy aeons' abilities for the Dark Aeons and the possessed aeons [`dark-aeons-six-abilities.ts`, `possessed-aeons.ts`], reused by id for Hellfire, Meteor Strike, Mega Flare, Impulse, Zanmato, Pain, Oblivion, Delta Attack and the spells; the Isaaru art keys (`grothia`, `pterya`, `spathi`) stay Isaaru's.

### 3.3 The loss and the win

The repo's duel loses when no aeon is left (`engine.ts#checkEnd`, B11 = a) as an ordinary chain loss; the game ends Belgemine's duels "player escaped". Same effect for the player (retry); the card says "a lost duel costs nothing". The win is the enemy aeon's (or the last Sister's) fall.

### 3.4 Shared hot spots (not this lane's)

The 12 to 15 shared tables every new chapter forces (`PLAN.md` §7): the unions in `encounters.ts`, `chapter-meta.ts`, `data/ffx/index.ts`, `BattlePresenterDepartures.ts`, `battle/ffx/setup.ts`, the door table and its test (the sixteenth word), `chapter-numbers.test.ts`, `critic/runner/lib/route-pure.mjs`, `artNamespace.ts`, `CONTRACT-CHANGES.md`, `CHANGELOG.md`, `THEMES.md`: the wave's **integrator** commit.

## 4. The party

**One preset: Yuna alone with the aeons she would have at the Zanarkand Dome**: the repo's sourced Zanarkand-tier rows for the five story aeons (`late-aeon-rows.ts`, `ZANARKAND_SOURCED_ROWS`, N = 300, `[verified: 3 sources]` formula on an `[estimate]` Yuna) and **Anima, Yojimbo, Cindy, Sandy, Mindy from the same formula on the same declared Yuna profile** (`aeonStatsFromYuna`; `[estimate]`), Yojimbo's compatibility 128 and hire answer 2 and the Sisters' motivation 50 as the Mirror Aeons preset has them; full HP and MP; the Mirror preset's bag less its Doom-kill route. Yuna's Grand Summon gauge full at every act.

**Why:** (1) Belgemine's numbers are tuned for a Yuna in the middle of her Grid: against Zanarkand-tier aeons the enemy moves hit for 15 to 340 percent of an aeon's HP, against endgame-tier (the Mirror Aeons Yuna at the caps) for under 250 points, a walkover (RE §6); (2) the Zanarkand rows are the repo's one sourced late block for these aeons; (3) the guides say "how easy or hard depends solely on how well you built Yuna". **The bench measures the endgame preset too and reports it** as a what-if; no row moves for either. `[estimate]` in Bailey's name, as the Mirror Aeons preset.

**Alternatives:** the endgame preset (Mirror Aeons Yuna plus Anima: a victory lap); the Gagazet-tier rows (`gagazet-aeon-arms.ts`: weaker, harder).

## 5. The arena

The game's Remiem court (`lmyt01`, stage id not read) is a ruined temple court at the cliff's edge. **No plate exists** for it in the repo or the mirror. **Recommended: derive `remiem-temple` from `cavern-stolen-fayth`** (an inner temple chamber with a fayth door; the Dark Yojimbo recipe: prompt and seed saved, replaces no approved painting) with open sky at the top. **Alternatives:** the Isaaru chapter's `via-purifico` plate as stand-in (the plan's pick; red hall, wrong place, free); `macalania-temple` (cold). Only the one plate; the three field places are out of scope (BD1).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| **Plate** `remiem-temple` | derive from `cavern-stolen-fayth` | 1 plate (+ @2x) |
| **Belgemine** | none exists | 1 body x 4 poses (idle, cast, hurt, ko) + portrait; direction from the game's look only if the art lane reads her model |
| **Her aeons** | **the player's own paintings, unchanged**: `valefor`, `ifrit`, `ixion`, `shiva`, `bahamut`, `anima`, `yojimbo-cavern`, `daigoro`, `cindy`, `sandy`, `mindy`; the mirror lock guarantees no aeon faces itself | 0 |
| Mirror tint (optional) | the Isaaru precedent (`grothia` = Ifrit with a sea-green mark) for a "Belgemine mark" | 0 recommended; 11 recolours if Bailey wants the enemy side marked |
| Party | Yuna exists | 0 |

**Direction:** painted 2.5D from the approved pipeline (no 3D, no Meshy). The art lane pilots Belgemine and the plate and Bailey looks before anything else (the pose-recipe lesson). ComfyUI wall time serialises through `RIG-RECORD`; the plan's A8 holds loosely (A6 to A7 here).

## 7. Presentation needs, and three layouts for the mockup lane (end state first, hard rule 9)

* **A. The ladder (recommended).** Eight pips along the top, each a crest of the aeon (Valefor to the Sisters); the current pip pulses, won pips go gold; a two-second banner per act ("Belgemine calls Ixion"); a one-line bark from Belgemine between acts. Built on the chain HUD chip row; reads at phone width. Cheapest, clearest.
* **B. The court.** Belgemine stays on the plate across all eight acts with her cue animations (raising her staff per summon); a small "mirror" panel shows which aeon is locked. More art (+3 h), most atmosphere.
* **C. The card.** Title card per act, results card only; the intent board carries the story. Lowest cost.

**Pick: A.** **Intent-board lines (our words, numbers from the files):** Valefor: "A magical hit wakes her Energy Ray." Ixion: "Half his turns he guards or dodges; hit with what he is not guarding against, or he charges." Bahamut: "Five quiet turns, then Mega Flare." Anima: "She only grows angry when hit." Sisters: "Cindy guards them all every seventh turn; when all three burn, Delta Attack."

**Music:** stand-ins, not Bailey's ears (rule 13): battle `boss-isaaru` (the repo's aeon-contest cue, Chapter XIV's), victory `victory-ffx`; alternative `boss-challenge`. No new cue is asked for; the audition page lists the choice.

**Story:** our own words, short beats: Belgemine's challenge, one bark per aeon, the closing on the Sisters and the "send her" card (no mechanic).

## 8. Open questions, the winnability method, and the live checks

**Method (measure, never tune; the Mirror Aeons bench's, `tools/mirror-aeons-bench.mjs`, copied):** 200 seeds at bench speed and 40 at human Wait-split speed per row. Rows: each act fresh; the eight-act chain with heal between; the Zanarkand-tier preset (recommended), the endgame preset (what-if), the Gagazet-tier rows (what-if). For each: win rate, aeon KOs, Shield use, Overdrive moves fired by the enemy (Hellfire, Mega Flare, Zanmato, Oblivion, Delta Attack), engine seconds. **Reading the result:** the sourced difficulty is "depends on how you built Yuna", so the band is the driver's: the Mirror Aeons precedent is Bailey's "not too easy not too hard", measured at **60 to 80 percent for the chain at human speed on the shipping preset**; if a row is far outside, the lever is the preset (BD2), never a duel row.

**Open items (RE §8), each with its fix:**
1. Mi'ihen Ifrit's HP (3,000 file, 3,500 guides): irrelevant while the field duels are out (BD1); settle by a Scan on the owner's Steam copy if BD1 is overturned.
2. Remiem Ixion's second-turn double queue (RE §3.7): T0 plays both orders; the build does one command that turn and the note says so.
3. The first-win reward items: not modelled (the results screen pays the chapter's own spoils).
4. The formation flag words (game over vs escaped): the chain's ordinary loss is used and the card says it.
5. The party preset (BD2): measured three ways.

## 9. Review class

**DEEP**, by the shared registry tables, as the wave-3 drafts. The save-data class is **not** touched (a hidden chapter with no save schema change: confirm at T8). One release per wave: the focused review before, the deep review after on the live build, within the cap of two deploys while one is owed. This lane does not deploy.

## 10. Build order, tracks, and the decisions (recommended picks; the alternative named)

### 10.1 Order (small vertical slices that can ship behind the word `sidequest`)

| Track | Work | Hours |
|---|---|---:|
| **T0** | engine checks by running it: `onHit` damage-type reads (E3), the Sisters' three scripts in one battle, the double queue (RE §3.7) | 1.5 |
| **T1** | data: eleven records, the eight enemy defs and groups (`nextGroupId`, `canEscape: false`, `carriesFullPartyState`, `checkpointOnEntry`, `lockedAeons`) | 3.5 |
| **T2** | the eight AI scripts and a registry line each; a unit test per script on the real harness splits (`t-belgemine.out.txt`) | 7 |
| **T3** | the party preset `belgemineBuild` (section 4), the chapter record (`chapter-belgemine.ts`: id `belgemine`, game `ffx`, number 45, title "Belgemine's Challenge", location "Remiem Temple"), meta, closing card | 3 |
| **T4** | prep tip, guide page, tactic, scan/sensor texts, door row (typed word `sidequest`, number 45) | 2 |
| **T5** | ladder chips and the intent-board lines | 2 |
| **T6** | story beats (our words) | 1 |
| **T7** | the bench and its tests (section 8) | 3 |
| **T8** | art (plate, Belgemine; the art lane, wall time on `RIG-RECORD`), tests, handoff note, `CHANGELOG` entry, the integrator's shared tables (not this lane's) | A7 + 2 |

**Total: R0.5 B16 A7 I6 = about 30 h** `[estimate]` in Sonnet agent-hours (the plan priced 30; the 6 h of research are spent in the note; no new mechanic). Counted the way the Keeper preflight counts. **Wave:** the plan's wave 4 stands.

### 10.2 Decisions (BD1 to BD10)

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| BD1 | Scope | **The eight Remiem duels only.** The three field duels need three different parties (Valefor alone at Mi'ihen, Valefor and Ifrit at Moonflow, five aeons at the Calm Lands) and the engine has one `buildRef` per chapter | the 3 + 8 version with a per-act party seam (`EnemyGroupDef.buildOverride`-style, about 4 h + 3 small presets) |
| BD2 | Party | Zanarkand-tier Yuna and aeons (section 4) | the endgame preset (a walkover) or Gagazet-tier (harder); both measured |
| BD3 | Seams | HP and MP restored between acts, each act starts at the preset's gauges (Yuna's full), the order of the game | carry gauges (the player can bank a charged Overdrive), or no heal |
| BD4 | Aeon availability | all ten owned from the start (the preset), mirror lock per act | gate Anima, Yojimbo and the Sisters behind the game's items (not modelled; the chapter has no inventory arc) |
| BD5 | Loss | the chain's ordinary loss and retry from the act's start (`checkpointOnEntry`) | restart the whole gauntlet |
| BD6 | Script text | **follow each script exactly**, including the odd ones (Anima's gauge, Ixion's bonus); the intent board says so | none (a boss-side change needs a measured option and Bailey's yes) |
| BD7 | Art | the player's aeon paintings unchanged on both sides, Belgemine and one plate new | the Isaaru-style tint for the enemy side (11 recolours) |
| BD8 | Music | stand-in `boss-isaaru`, `victory-ffx` (rule 13) | `boss-challenge` |
| BD9 | Id, number, word | `belgemine`, **45**, **`sidequest`** (checked in the plan's pool; the word fits the door rule and tightens none; re-run `door-check.mjs` at the integrator) | `contest` |
| BD10 | "Send her" | a closing card only | a yes/no choice with a mock reward |

## 11. Size and risks

**Size:** section 10.1. **Top risks:**
1. **The per-act party** (BD1): if Bailey wants the field duels, the seam is new engine surface (small, additive).
2. **A duel too easy or too hard for the preset** (RE §6 shows both ends): the lever is BD2 and the bench decides; no row moves.
3. **Art cost**: one humanoid and one plate; the pose-recipe lesson says pilot first.
4. **The Sisters as three scripts** and Cindy's shared gauge checks: T0 and the script tests pin the order.
5. **Double queue** on Ixion's second call (RE §3.7): T0.

## Corrections and findings (what the mapping turned up)

1. `m258`/`m259` and `kino04_40` are unused; the launched files are shared with Isaaru's aeons (RE §2).
2. The Remiem enemy stat blocks come from the scripts, not the records (HP 20,000 Valefor against the record's 12,000).
3. A lost duel is "player escaped" in the game, never a game over (RE §3.1).
4. The Mi'ihen Ifrit has 3,000 HP and no Overdrive move in the file; the guides print 3,500 and "Hell Fire" (RE §8).
5. The plan's "Belgemine new, aeons and Sisters exist" is right; the plan's "four places have no plates" is moot for the eight-act build (one plate).
6. `sidequest` stays a valid door word (the table of `origin/main` 63813367c adds none the plan did not check).
