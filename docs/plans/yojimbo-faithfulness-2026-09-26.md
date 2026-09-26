# Chapter IX (Yojimbo) faithfulness audit, 2026-09-26

**Game case: FFX only** (AGENTS.md rule 14). This is Lady Ginnem's Yojimbo in the Cavern of the
Stolen Fayth: CTB, Yuna's aeons, an enemy Overdrive gauge and Ronso Rage Doom. None of it applies
to the FFX-2 Yojimbo ("Tourist Trap", `research/ffx-yojimbo.md` §8.2).

Audited build: live release 20 (`ce05b02c`). `git diff ce05b02c HEAD -- src` is empty, so the
engine I ran is the live one. Paper and measurement only: nothing in `src/` was changed and no
boss number was touched.

---

## For Bailey: is it faithful, and why did it feel easy?

**Yes, it is faithful, and the real fight is easy too.** Every number and rule Yojimbo uses in
our fight matches the game's own data (HP 33,000, Defense 80, Magic Defense 0, the Doom count of
5, the gauge bands, Zanmato for 9,999). Three guides describe the real fight as easy:

- GameFAQs (bover_87) says the fight is more about mood than challenge, and calls this aeon weak.
- Jegged says he is not too difficult.
- EIP calls the fight fairly straightforward.

It is also a full-party fight in the real game, not a summoner duel. GameFAQs says this outright,
and our format matches it.

**Why it felt *very* easy:** we hand every player the game's own shortcut, ready to use.

- In the real game, Kimahri can learn **Doom** by using Lancet on a Ghost in this cave. Doomed,
  Yojimbo dies five of his turns later. Every source names this as the way to win.
- Learning a new Ronso Rage fills Kimahri's Overdrive gauge (a sourced rule). So our chapter starts
  Kimahri with Doom, with a **full** gauge, and **in the opening three**. You picked all three
  (D-056, D-066, under "All your recommendations").
- The chapter card's first objective is "Doom Yojimbo", and the advisor's top suggestion is Doom
  too.

So Kimahri's first turn wins the fight. Yojimbo acts exactly 5 times, his gauge never passes 22 %,
and Zanmato never fires, in 200 of 200 seeds. A real first-time player has to find a Ghost, think
to Lancet it, keep Kimahri's gauge, and know that Doom works on a boss. Nothing in the real game
tells you to.

**Without that shortcut it is still a fair, sourced fight.** If you race him with Lulu's magic and
let an aeon take Zanmato, you win about 8 fights in 10 on the first try and every time within
five tries. If you just swing swords with no aeon, you lose every time. Zanmato's 9,999 to
everyone is fatal at this story point.

**Nothing on Yojimbo's side is wrong, so there is nothing to fix on his side.** If you want the
fight to feel less like a gift, the levers are on **our** side: the Kimahri set-up and the hint
on the card. Section 5 lists them as options to measure, not to build. One sourced correction
elsewhere, the aeon HP rows of PR-0179, would make the fight **easier** for players who use aeons.

---

## 1. The fight's format, real game against ours

| Question | Real FFX (sources) | Ours (`src/data/chapter-yojimbo-cavern.ts`, `src/data/ffx/enemies/yojimbo.ts`) | Verdict |
|---|---|---|---|
| Who fights | The whole party, and Yuna may summon. GameFAQs says it is **not a summoner duel**, so any party member or aeon can fight. Jegged says to use Yuna's aeons if it gets hard. The wiki says an aeon's Shield softens Zanmato. The decompiled formation is `[mira, yojimbo, koma_inu]` with no forced party. (research §2.5, §4.3 [verified: 3 sources]; GameFAQs re-read 2026-09-26) | Party of seven with the five aeons; opening three Lulu, Kimahri, Yuna (D-066) | **MATCHES.** The brief's premise that this is Yuna and her aeons only describes Belgemine's Remiem duel (research §8.3), not this fight. |
| Can the party act | Yes, every character | Yes | MATCHES |
| Escape | Cannot flee (wiki infobox; research Y-11 [single source]) | `canEscape: false` | MATCHES |
| Loss | Game Over; you reload the last save. The Save Sphere is just before the chamber (GameFAQs) | Defeat card, then RETRY on a new seed (`BattleScreenFlow.ts:346`, seed + attempt × 1000) | **DIFFERS, more forgiving.** This is house plumbing that every chapter shares. It does not change the fight itself. |
| Lady Ginnem, Daigoro | Both are on the field. No source says whether either can be targeted (Y-5, Y-10) | Both untargetable (B3, D-051) | UNSOURCED (Bailey's pick). This keeps a shortcut out, so it does not make the fight easier. |
| Reward | 0 AP, 0 gil, no drop, no steal. The prize is hiring Yojimbo afterwards, plus the side-room chests (research §2.4 [verified: 2 sources]; GameFAQs table re-read) | 0 / 0 / no drops; no hiring (D-052) | MATCHES for the battle. The hiring beat is left out by D-052. |

## 2. Every number and rule, ours against the sources

"Easier" and "harder" mean the direction the difference moves the fight.

### 2.1 Yojimbo, Daigoro, the action rows

| Item | Source | Ours | Verdict |
|---|---|---|---|
| Yojimbo HP / Overkill | 33,000 / 4,060 [decompiled + wiki + GameFAQs] | 33,000 / 4,060 | MATCHES |
| Str / Def / Mag / MDef / Agi / Luck / Eva | 34 / **80** / 35 / **0** / 32 / 15 / 0 [decompiled + wiki] | same | MATCHES |
| Immunities, Gravity immune, Doom landable, count **5** | research §2.3 [verified: 2-4 sources]; GameFAQs lists Doom as his only vulnerability, count 5 | same; `doomTurns: 5` | MATCHES |
| Doom timing | Wiki: he is defeated within five turns | Counts down at the start of his turn and KOs him at 0 (`ticks.ts:84-91`). Measured: 5 Yojimbo actions per Doom win | MATCHES |
| Threaten | The byte says it lands; the wiki says immune (Y-3) | Immune (B9, D-057) | UNSOURCED (conflict); harder if anything |
| Daigoro bite | Str 25, DC 20, one random target, crit +20, shatter 10 % [decompiled + wiki] | same (`daigoro-attack`) | MATCHES |
| Kozuka | Str 34, DC 16, one random target [decompiled + wiki] | same | MATCHES |
| Wakizashi | DC 28. The decompile and the wiki say **one random target**; GameFAQs says the whole party (Y-2) | One target | MATCHES the game's own data. GameFAQs' version would be harder, but the decompile is the game itself, so it settles the conflict. The Steam copy could confirm it (see §5, P-5). |
| Zanmato | Fixed 200 × 50 = 10,000, capped at 9,999, whole party, type special [4 sources] | `fixed-no-variance`, power 200, all targets, `damageType: 'other'` | MATCHES |
| Gauge +3 when targeted / +2 when attacking | Wiki boss page revid 3980332, re-read 2026-09-26 [single source] | +3 once per action that names him; +2 on each of his turns except Zanmato, including the Daigoro order | The rates MATCH. Per action or per hit is **UNSOURCED** (Y-1). This matters for the Gems (see §3.3). |
| Bands: <25 Daigoro only, 25 adds Kozuka, 50 adds Wakizashi, 80 "slightly" likelier K/W, 100 Zanmato | wiki + GameFAQs + EIP [verified: 3 sources] | Bands built. Odds inside a band are an even split; the 80 % nudge is left out (B2, D-050) | Bands MATCH. Odds UNSOURCED. Leaving out the nudge is **slightly easier** above 80 %, and never matters on the Doom route (his gauge peaks at 22 to 37 %). |
| Starting gauge, gauge after Zanmato | not stated by any source | 0 and 0 (B2) | UNSOURCED |
| CTB action rank of his rows | not in the research | rank 3 [estimate] (combat-core §1 puts "Yojimbo's four attacks" at rank 3) | MATCHES combat-core |

### 2.2 The party at this point of the story

| Item | Source | Ours (`src/data/ffx/builds/yojimbo-cavern.ts` = `gagazet.ts` minus what Gagazet teaches) | Verdict |
|---|---|---|---|
| Story position | First Calm Lands visit, after Bevelle, before Gagazet [3 sources] | same | MATCHES |
| Party stats and levels | No source gives a Cavern-time preset. Research §5.2 names the Gagazet preset as the **upper bound** | Gagazet preset (e.g. Yuna 1,500 HP / Mag 37, Lulu Mag 43, Auron Str 40), each labelled `[estimate]` | UNSOURCED. It is **slightly easier** by design: the next boss's numbers, minus nothing. It cannot be corrected without inventing lower numbers. |
| Kimahri's Doom | Learnable here by Lancet on a Ghost [4 sources]. Learning a Rage fills his gauge (wiki *Overdrive*, a rule, [single source]) | Doom learned, gauge **100**, in the opening three (B8 = D-056, D-066) | The rule MATCHES. Assuming every player did the optional prep, and fielding Kimahri first, **DIFFERS: easier. This is the main cause.** |
| Yuna | Cura, Curaga, Life, Nul-spells; Grand Summon always available (seymour-flux §7.4-7.5); gauge [estimate] | same; Grand Summon unlocked; gauge 40 | MATCHES (estimates labelled) |
| Aeons owned | Valefor, Ifrit, Ixion, Shiva, Bahamut; not Anima, the Magus Sisters or Yojimbo [2 sources] | same five | MATCHES |
| Aeon stats | combat-core §6.4.3 Gagazet block: 1,530 / 2,075 / 2,055 / 1,830 / 2,935 HP | 738 / 988 / 983 / 878 / 1,398 HP, the invented ~0.55x (**PR-0179**, known issue) | **DIFFERS: harder.** Aeons die before they can take Zanmato or Overdrive. |
| Items | seymour-flux §7.8 ranges [estimate]: Gems 5-15 each, Phoenix Down 20-40 | Gagazet midpoints minus the 2 Mega-Potions and 20,000 gil found on the mountain; 10 of each Gem | UNSOURCED (estimate within the range). The Gems are a strong no-Doom route (§3.3). |
| Candle of Life | Sourced as a Doom source; no source puts one in this party | Not given (D-067) | UNSOURCED; harder if anything |
| Hint to the player | The real game gives none | Objectives "Doom Yojimbo / Survive Zanmato / Defeat Yojimbo" (`chapter-meta-yojimbo.ts`); the tip explains the gauge; the advisor's top row is Doom | **DIFFERS: easier.** This is presentation, not data. |

## 3. Measurements (rule 3: the real engine, run)

**Method.** A scratch bench in `tools/zz-yoj-faith.tmp/bench.test.ts` (agent scratch, not
committed) drives the live engine with the registry wiring the running game builds (as
`BattleScreenContent` does) and the advisor options the FFX HUD passes (`{}`), the same as round
13's "livelike" bench.

- **Seeds.** First try is seed *s*. "Within five" is seeds *s*, *s*+1000, ... *s*+4000, exactly
  as RETRY does. There are 200 base seeds (1-200), plus 100 seeds drawn from the live range
  (1..0x7fff0000) for the headline lines.
- **Human pace equals bench speed.** FFX is CTB. The engine's clock moves only on turns (the
  `wait` events are animation only), so a slow player and the bench face the same fight. The other
  FFX benches treat it the same way.
- **What the columns mean.** "Turns" is the battle's turn counter, which counts every actor's turn.
  "Y acts" is Yojimbo's own actions. "Zan" is the share of battles in which Zanmato fired.

### 3.1 The shipped chapter

| Line | First try | Within 5 | Turns | Y acts | Zanmato fired | Doom kills |
|---|---:|---:|---:|---:|---:|---:|
| **Intended** (the shipped tactic: Kimahri Dooms, Lulu casts Fira, Yuna heals and summons at ≥80) | **200/200** | 200/200 | 18.7 | 5.0 | 0 % | 200 |
| **Advisor top row** | **200/200** | 200/200 | 18.8 | 5.0 | 0 % | 200 |
| Doom, then everyone swings Attack | 200/200 | 200/200 | 16.7 | 5.0 | 0 % | 200 |
| Live-range seeds (100): intended / advisor | 100/100 / 100/100 | 100 / 100 | 18.7 | 5.0 | 0 % | 100 |
| "Attack with whatever aeon is out" (Yuna summons the strongest aeon left; the aeon uses Attack) | 0/200 | 0/200 | 51.4 | 19.9 | 97 % | 0 |
| The same, but the aeon uses its Overdrive when it is ready | 0/200 | 0/200 | 51.9 | 20.6 | 96 % | 0 |
| Opening three swing Attack, Yuna heals, no aeon | 0/200 | 0/200 | 52.8 | 19.2 | 99 % | 0 |

On the Doom route Yojimbo's gauge peaks at 22 % (intended) or 37 % (advisor). He only ever uses
Daigoro, and Kozuka in 13 % of his actions under the advisor. In the aeon lines all five aeons die
(PR-0179's rows) before any of them stands in front of Zanmato: Zanmato hit an aeon in 0 of 200
fights.

### 3.2 Without the pre-loaded Doom (what a player who skipped the Ghost faces)

| Party arm | Line | First try | Within 5 | Turns | Y acts | Zanmato fired | Aeon took it |
|---|---|---:|---:|---:|---:|---:|---:|
| No Doom (D-056's option (b)) | Intended (Lulu Fira, Yuna summons at ≥80, others defend) | **161/200 (80 %)** | 200/200 | 111.8 | 34.6 | 90 % | 141 |
| No Doom, live-range seeds | Intended | 82/100 | 100/100 | 113.8 | 35.2 | 91 % | 73 |
| No Doom | **Advisor top row** | **200/200** | 200/200 | 24.6 | 6.8 | 0 % | — |
| No Doom | "Hack and slash, keep healed, an aeon takes Zanmato" (Lulu Fira, others Attack or Overdrive; Yuna heals and summons at ≥80; the aeon Shields, then is dismissed) | 90/100 | 100/100 | 94.2 | 35.7 | 98 % | 92 |
| No Doom, Auron/Tidus/Yuna up front | The same hack-and-sponge line | 77/100 | 100/100 | 109.2 | 38.0 | 100 % | 95 |
| No Doom, Auron/Tidus/Yuna | Swing Attack plus Overdrives, no aeon | 0/200 | 0/200 | 47.5 | 15.2 | 100 % | 0 |
| Doom learned, gauge spent (0) | Intended | 159/200 | 200/200 | 111.1 | 34.3 | 88 % | 135 |
| Doom learned, gauge spent (0) | Advisor | 200/200 | 200/200 | 24.6 | 6.8 | 0 % | — |

### 3.3 Why the advisor still wins without Doom: the Gems

A trace of seeds 1 to 3 shows the advisor's no-Doom route. Kimahri and Yuna throw **Fire Gems**
while Lulu casts Fira. On seed 1, the Gems did 26,864 of the 33,354 damage. A Gem is 5 fixed hits
of DC 12 (about 600 each, `src/data/ffx/items/offensive-2a.ts`). With only Yojimbo targetable,
all 5 land on him, for about 3,000 per throw, and it costs **+3 gauge**, because we count one
targeting per action.

| Inventory arm (no Doom, advisor) | First try | Y acts | Zanmato fired |
|---|---:|---:|---:|
| 10 of each Gem (shipped estimate) | 200/200 | 6.8 | 0 % |
| 5 of each Gem (low end of §7.8) | 100/100 | 6.7 | 0 % |
| No Gems | 100/100 | 16.6 | 16 % (all 16 taken by an aeon) |

If the real game counts **each hit** as a targeting (Y-1, unsourced either way), a Gem would cost
+15 gauge. Six throws would then bring Zanmato after about 18,000 damage, and the Gem route would
become a race that needs an aeon sponge. This is the largest unsourced lever on the no-Doom fight.
Nothing is changed for it: it stays an estimate until a source settles Y-1.

### 3.4 PR-0179 (the aeon rows) in this chapter

The same benches with combat-core §6.4.3's Gagazet aeon rows (PR-0179 arm (a)):

| Line | Shipped aeon rows | Sourced §6.4.3 rows |
|---|---:|---:|
| Intended, with the pre-loaded Doom | 200/200 | 200/200 (no aeon is ever summoned) |
| No Doom, intended | 161/200 | 171/200 |
| No Doom, "aeon uses its Overdrive when it is ready, else Attack" | 0/200 | **200/200** (4.0 summons, Zanmato 0 %) |
| Auron/Tidus/Yuna, hack-and-sponge | 77/100 | 93/100 |
| "Aeon uses plain Attack" | 0/200 | 0/200 |

So the sourced aeon rows make Chapter IX **easier**, not harder, for anyone who summons. The
shipped Doom route does not change. **Add this row to PR-0179's measured sheet (thresholds
program queue item 6).**

### 3.5 Against the real fight's reputation

The sources describe a fight you win by Dooming him, by hitting hard and staying healed, or by
letting an aeon eat Zanmato (research §5.3; GameFAQs, Jegged and EIP re-read 2026-09-26). Ours
supports every one of those routes:

- Doom: 100 %.
- Magic race with an aeon sponge: 80 to 90 % first try, 100 % within five.
- Hack and sponge with Auron/Tidus/Yuna: 77 % first try, 100 % within five.

The one sourced claim ours does **not** reproduce is EIP's: that the strongest attackers can kill
him before Zanmato goes off. With +3 per targeting, three physical hitters into Defense 80 fill
his gauge after about 30 actions and about 25,000 damage. Our party-attack lines lose 0 of 200.
Either the guides are loose, or a real party at that point is stronger than our Gagazet upper
bound, or the gauge counts differently (Y-1). Nothing here says which, so it is recorded, not
acted on. This is a **harder** difference, not an easier one.

## 4. The difficulty verdict in one line

On the shipped set-up the fight is a **certain win in five Yojimbo turns**. That is faithful to
how the game plays *once you have prepared the sourced Doom shortcut*, which is exactly what we
hand every player: the full gauge, Kimahri up front, and the card telling you to Doom him. It is
not faithful to a **first-time** player's fight. That player has not done the optional prep and
faces a sourced race against Zanmato, which is roughly an 80 % fight in our engine.

## 5. Proposals (build nothing in `src/`; each one is a question for Bailey, measured first)

The rule is the boss-side rule (memory `boss-side-fix-needs-measured-options`): never touch
Yojimbo's numbers. Build each answer as a named OFF switch, measure it, and ask once. Every
proposal below is on **our** side. None changes a boss number.

**P-1. Kimahri's Doom set-up (the main cause). Re-opens D-056 / D-066.** A named switch
`cavernDoomPrep` in `src/data/ffx/builds/yojimbo-cavern.ts`, OFF = today:

| Value | What it models | Source status | Measured, intended / advisor first try |
|---|---|---|---|
| `preloaded` (today, D-056) | The player lanced a Ghost and walked in without spending the Rage | The rule is sourced; the prep is our estimate | 200 / 200 of 200 (5 Y acts) |
| `not-learned` (D-056's rejected option (b)) | The player skipped the Ghost | Sourced as the default state: learning Doom is optional | 161 / 200 of 200 (≈35 Y acts, Zanmato in 90 %) |
| `learned-spent` | Learned, then spent in a random battle on the way in | Gauge 0 is our estimate | 159 / 200 of 200 |

Expected effect: `not-learned` turns the fight into the sourced race for the intended line. It
does **not** make it hard for the advisor, which still wins 200/200 with the Gems. The question
for Bailey: "Should the Cavern party arrive already holding Yojimbo's known counter, or should
the player earn it?" Recommend `not-learned` only if Bailey wants the fight to test the player.
Otherwise keep D-056: it is a legitimate, sourced way the real fight goes.

**P-2. The hint on the chapter card and the advisor. Presentation, so options come first (rule
9).** The real game never tells you Doom works. Ours names it as the first objective, and the
advisor puts Doom on top. Two to four options to mock, *not build*:

- (a) Keep the card as it is.
- (b) Keep the three objectives but show "Doom Yojimbo" as a hidden "???" line until Doom lands
  or the player loses once.
- (c) Move the Doom tip to the Defeat card, which PR-0033's cause-line work already mocks for the
  Zanmato wipe.

The advisor is shared plumbing. Changing what it recommends for one boss is a separate question.
It is not proposed here.

**P-3. The Gems (Y-1, unsourced).** Nothing to build. Record in `research/ffx-yojimbo.md` §9 Y-1
that per-action versus per-hit targeting now decides whether the Gem route is free (ours) or a
race. It is the first thing to settle if a source for Y-1 is ever found. No agent value is to
replace our estimate.

**P-4. The Gagazet upper bound.** Nothing to build. No source gives Cavern-time stats, so any
lower number would be invented (rule 6).

**P-5. Optional in-game checks in the Steam copy** (memory `feedback-real-game-steam-version`: ask
Bailey before taking over the screen). Both are observable:

- Does Wakizashi hit one character or the whole party (Y-2)? The decompile says one; GameFAQs says
  all. If it is all, ours is easier than the game and a correction becomes a sourced OFF switch.
- Does a Candle of Life or Kimahri's Doom on Yojimbo show a 5 count? Already 4 sources; low value.

**Not proposed.** Any change to Yojimbo's HP, Defense, gauge rates, bands or odds. They match
their sources, or they are labelled estimates where no source exists.

## Sources

- `research/ffx-yojimbo.md` (decompile at Grayfox96 FFX-RNG-tracker `0acf1ac3`, wiki, GameFAQs,
  Jegged, EIP), §2-§5 and §9.
- Final Fantasy Wiki, *Yojimbo (Final Fantasy X boss)*, revid **3980332**, re-read 2026-09-26
  through `api.php?action=parse&prop=wikitext`: the gauge rates and bands, Doom "within five
  turns" (Cavern only), and Shield mitigating Zanmato. The same revision as the research.
- GameFAQs, bover_87, *Final Fantasy X Remaster Walkthrough (PC)* v1.3, "Cavern of the Stolen
  Fayth", re-read 2026-09-26 (plain HTTP, no browser):
  https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/79145/cavern-of-the-stolen-fayth
  It gives HP 33,000, Overkill 4,060, 0 AP and 0 gil, Doom as his only vulnerability with count 5,
  says it is not a summoner duel, calls the fight easy and names Doom as the quick win, and calls
  Wakizashi party-wide (conflict Y-2).
- Jegged, FFX Side Quests, Cavern of the Stolen Fayth, re-read 2026-09-26: Doom from the Ghost;
  not too difficult; use aeons if needed; "approximately 30,000" HP.
- EIP Gaming, *FFX Cavern of the Stolen Fayth* and *FFX Yojimbo*, re-read 2026-09-26: the gauge
  bands; the strongest attackers may win before Zanmato; Doom kills him in five turns; the fight
  is not too difficult.
- `research/ffx-seymour-flux.md` §7.3-§7.9.2 (the preset, the Lancet fill rule),
  `research/ffx-combat-core.md` §1 (ranks) and §6.4.3 (the aeon rows).
- Known issues cited, not re-reported: **PR-0179** (aeon rows), **Y-1/Y-2/Y-3/Y-5/Y-10**
  (research §9), **D-050, D-051, D-056, D-057, D-066, D-067** (Bailey's picks), **PR-0033** (the
  Defeat cause line).
