# Next content: two chapters and one FF7 encounter (2026-09-27)

Bailey asked this on 2026-09-27, around 00:00 EDT: "if I were to add 2 chapters what would they be? also i want to do something ambitious like add an experimental ff7 encounter, if i were to choose 1 ff7 encounter what would it be? it needs to be faithful to ff7 and canon"

This sheet only recommends. Nothing below gets built without Bailey's yes (AGENTS.md rule 10), and nothing gets built before an options round (rule 9). Every number has a source (rule 6), and each pick names its game (rule 14). The scores are the research agents' own judgement, marked [estimate].

---

## 1. For Bailey (one screen)

### Chapter A (FFX only): Sin, the assault from the Fahrenheit
- **Why.** It is the set piece of FFX: straight after Yunalesca, the party flies the airship at Sin itself. Nothing in our lineup covers it. It is also the cheapest big chapter, because Evrae already built the airship deck, Cid's range command and the Zanarkand-era party.
- **What you do.** There are four links. First the Left Fin and the Right Fin: you tell Cid to close in or back off. Up close the Fin delays your turns. Far away it hits harder but acts less often, and it lets you dodge Gravija when the core charges. Negation strips everyone's buffs. Next comes Sinspawn Genais, which shields the Core and soaks your magic, so it has to go first. Last is Overdrive Sin, a 12-turn race to deal 140,000 damage before Giga-Graviton ends the game. No aeon and no Auto-Life can save you from it.
- **Cost.** The engine work is small to medium: a range system that already exists, plus a Negation counter, a turn clock and Gaze. The art is the big cost: Sin is four colossal new subjects. Before we commit, Overdrive Sin needs a bench played at human speed.

### Chapter B (FFX-2 only): Ixion at Djose Temple, the Chapter 3 finale
- **Why.** Ixion's last charge knocks Yuna into the Farplane, where Shuyin takes her for Lenne. We have nothing from FFX-2's Chapter 3, and this is its best beat. Adding it also takes the roster from 9 FFX : 6 FFX-2 to 10 : 7.
- **What you do.** You watch Ixion's pattern: attack or Thundara twice, then Aerospark, which takes 5/8 of the target's current HP. Watch its counter too. At 100 it Recharges (200 HP and 200 MP), and Thor's Hammer, which cannot be absorbed, follows at once. You spend that warning turn getting ready.
- **Cost.** The engine work is small: Chapter XI already has the action counter. The art needs a machina-fused Ixion painting and a Djose chamber. The Lenne and Shuyin paintings already exist. The research needs one pass for the scene.

### The FF7 encounter (FF7 only, experimental, unlisted): Jenova·LIFE at the Forgotten Capital
- **Why.** It is the fight right after Aerith's death, the most famous moment in FF7. Its enemy script is small, exact and fully sourced (Fergusson's Enemy Mechanics on GameFAQs). About half the research already exists in `D:\FF7`.
- **What you do.** It is a Materia puzzle. Magic that hits her is countered with Reflect, as long as she has 30 MP. Water heals her, Earth does double damage, and Gravity does nothing. The lower her HP, the more often she uses Blue Light and Aqualung. If you spam spells you lose; if you build your Materia right you win.
- **Cost.** This is the big one. FF7 is a third battle system, not a variant of ours. It needs a new `src/battle/ff7` module of about 20-30 files and 4-7k lines [estimate], plus a new HUD (with mockups first) and an original score in place of Aerith's Theme (THEMES.md forbids quoting it). It is also outside the season-1 scope in PRODUCT-BRIEF.md, so it would ship behind a switch, the way Trema does.

### Alternates, if you prefer something else
- **Instead of Sin:** *Sinspawn Gui, Operation Mi'ihen* (FFX). It fills FFX's empty first half, and it is the only time you control Seymour and see his Requiem Overdrive. Or take *Biran and Yenke Ronso*, Kimahri alone. It is small and cheap, and it is where Kimahri learns the Mighty Guard that answers Flux.
- **Instead of Ixion:** *YSLS-Zero at Kilika* (FFX-2 Chapter 1 finale). It fills FFX-2's other empty chapter, but its story is thinner.
- **Instead of Jenova·LIFE:** *Safer·Sephiroth* is the most ambitious. It is the most iconic fight, but it needs close to the whole FF7 system and has the weakest preset party. Build it second, on the Jenova engine. *Guard Scorpion* is the cheapest proof: its party is forced by the story and it needs only the minimal kernel. It is short, though (800 HP).

---

## 2. Scored tables

The axes run from 1 to 5, and 5 is always the better outcome. The FFX / FFX-2 axes are canon, mechanics, sources, fit, art (5 = least new painting) and engine (5 = already supported). The FF7 axes are canon, mechanic, sources, party (how well the preset party can be defended from sources), art, scope (5 = smallest) and risk (5 = lowest). All scores are [estimate].

### FFX and FFX-2 chapters (out of 30)

| Candidate | Game | Where | Canon | Mech | Src | Fit | Art | Eng | Total |
|---|---|---|---|---|---|---|---|---|---|
| **Ixion at Djose (Ch. 3 finale)** | FFX-2 only | Djose Temple, Chamber of the Fayth | 5 | 3 | 4 | 5 | 3 | 5 | **25** |
| **Sin from the Fahrenheit** | FFX only | Fahrenheit deck, after Zanarkand | 5 | 5 | 4 | 4 | 2 | 4 | **24** |
| Sinspawn Gui, Operation Mi'ihen | FFX only | Mushroom Rock Road | 5 | 4 | 3 | 5 | 3 | 3 | 23 |
| Biran and Yenke Ronso | FFX only | Mt. Gagazet gate | 4 | 4 | 4 | 3 | 4 | 4 | 23 |
| Luca opener (Leblanc as Yuna, Ormi and Logos) | FFX-2 only | Luca | 5 | 1 | 4 | 3 | 4 | 5 | 22 |
| YSLS-Zero | FFX-2 only | Kilika Temple steps | 3 | 3 | 4 | 5 | 2 | 4 | 21 |
| Spherimorph | FFX only | Macalania Woods | 2 | 4 | 4 | 3 | 3 | 4 | 20 |
| Dream Zanarkand prologue (Ammes, Tanker) | FFX only | Dream Zanarkand | 5 | 1 | 4 | 3 | 2 | 5 | 20 |
| Garik Ronso and the Youths | FFX-2 only | Mt. Gagazet, Ch. 3 | 3 | 3 | 3 | 4 | 3 | 4 | 20 |
| Rikku and Paine shades (extends XV) | FFX-2 only | Den of Woe | 3 | 3 | 4 | 2 | 3 | 5 | 20 |
| Oblitzerator | FFX only | Luca docks | 3 | 3 | 3 | 5 | 2 | 3 | 19 |
| Angra Mainyu | FFX-2 only | Bikanel, Ch. 5 | 2 | 4 | 4 | 3 | 2 | 4 | 19 |
| Via Infinito unsent (Aranea, Black Elemental, Concherer, Chac) | FFX-2 only | Via Infinito 20/40/60/80 | 3 | 3 | 3 | 3 | 2 | 4 | 18 |
| Spectral Keeper | FFX only | Zanarkand Dome | 2 | 4 | 4 | 3 | 3 | 1 | 17 |
| Dark Aeons and Penance | FFX only (Int/HD) | Across Spira; Penance over the Calm Lands | 2 | 3 | 3 | 1 | 4 | 3 | 16 |

The numbers behind the two picks:
- **Sin.**
  - HP: Left Fin 65,000, Right Fin 65,000, Genais 20,000 plus the Core 36,000, and Overdrive Sin 140,000.
  - Gravija takes 75% of current HP.
  - Overdrive Sin's clock is 3 turns of approach, then 9 turns with its mouth open, then Giga-Graviton.
  - Gaze comes every 6th attack and inflicts Petrify, Confuse or Zombie.
  - Sources: GameFAQs bover_87 79145 and the wiki agree.
- **Ixion.**
  - HP 12,380 (five sources agree).
  - Recharge restores 200 HP and 200 MP when the counter reaches 100, and Thor's Hammer follows.
  - Aerospark takes 5/8 of the target's current HP.
  - Open conflict F-8: the basic attack split is 3/4 : 1/4 per SinirothX but 2/3 : 1/3 per the wiki. We use SinirothX and tag it.

Not recommended: the Dark Aeons and Penance (faithful HP means a post-game grind with no story beats), Spectral Keeper (it needs a platform-position engine), and the Monster Arena and Fiend Arena originals, including Major Numerus (not story content).

### FF7 encounters (out of 35)

| Candidate | Where | Canon | Mech | Src | Party | Art | Scope | Risk | Total |
|---|---|---|---|---|---|---|---|---|---|
| Guard Scorpion | Mako Reactor 1 | 4 | 5 | 5 | 5 | 4 | 5 | 4 | 32 (cheapest, least ambitious) |
| Air Buster | Sector 5 Reactor | 3 | 5 | 5 | 5 | 4 | 4 | 3 | 29 |
| **Jenova·LIFE** | Forgotten Capital, end of Disc 1 | 4 | 5 | 5 | 3 | 4 | 3 | 3 | **27** |
| Sephiroth, the final 1-on-1 | Northern Crater | 5 | 1 | 5 | 5 | 3 | 5 | 3 | 27 (scripted; not really a fight) |
| Carry Armor | Junon Underwater Reactor | 3 | 4 | 5 | 3 | 3 | 3 | 3 | 24 |
| Aps | Sector 6 sewer | 2 | 4 | 4 | 4 | 3 | 4 | 3 | 24 |
| Diamond Weapon | Coast outside Midgar | 4 | 5 | 5 | 3 | 2 | 2 | 2 | 23 |
| Safer·Sephiroth | Northern Crater | 5 | 5 | 5 | 2 | 2 | 1 | 2 | 22 (most ambitious) |
| Demons Gate | Temple of the Ancients | 3 | 3 | 4 | 3 | 3 | 3 | 3 | 22 |
| Schizo | Gaea's Cliff | 2 | 4 | 4 | 3 | 3 | 3 | 3 | 22 |
| Jenova·SYNTHESIS | Northern Crater | 3 | 4 | 5 | 2 | 2 | 2 | 2 | 20 |
| Hell House (as a boss) | Remake only | 1 | 3 | 2 | 3 | 3 | 3 | 1 | 16 (fails "canon") |
| Bizarro·Sephiroth | Northern Crater | 3 | 3 | 4 | 1 | 1 | 1 | 1 | 14 |

**Why Jenova·LIFE and not the top score.** Guard Scorpion scores highest on paper because it is cheap. But it is an 800-HP opener lasting about two minutes, and it would undersell "ambitious". Jenova·LIFE is the best balance of story weight, a clear FF7-only lesson (think about your Materia) and a mid-size slice of the system. Guard Scorpion can still serve as an unlisted engine test bed on the way to Jenova·LIFE.

Jenova·LIFE's data, from Fergusson v1.11 (GameFAQs 31903):
- Level and stats:
  - Lv50, HP 10,000, MP 300
  - Att 128, MAt 40, Def 110, MDf 290, Df% 10, Dex 140
- Elements: absorbs Water, weak to Earth (x2), void Gravity.
- Rewards: drops the Wizard Bracelet (100%); 4,000 EXP, 350 AP, 1,500 Gil.
- Abilities:
  - Blue Light: 7/8x Base, 8 MP, Water/Shout.
  - Blue Flame: 1x Base, 12 MP.
  - Aqualung: 3 1/4x Base, hits the whole party, 34 MP, Reflectable.
  - Reflect: 30 MP. She casts it as a counter to magic, only when she has no Reflect and at least 30 MP.
- Pressure dial: SpclChance drops 5, 4, 3, 2 at 75%, 50% and 25% HP.

Canon limits on "faithful":
- The party is Cloud plus any two: the game lets you pick. Tifa and Barret are defensible choices.
- The Water Ring is left out of the preset. It is canonically available, but it makes the fight unloseable.
- No victory pose.
- An original score replaces Aerith's Theme.

Not recommended for FF7:
- Hell House as a boss: that version comes from Remake only.
- Reno and Rude together at the pillar: Rude is not in that OG fight.
- Bizarro·Sephiroth: the largest scope of all.
- The `D:\FF7` "Encore mode" Scorpion (1,600 HP, 3 phases): it is invented.

---

## 3. What happens next if Bailey says yes

**Step 0: Bailey's yes, per item.** He can say yes to both chapters, to either one, to the FF7 encounter, or swap in an alternate. The FF7 encounter also needs a yes to widening the season-1 scope (PRODUCT-BRIEF.md), for example as an unlisted "experimental" chapter behind a switch.

**Step 1: research files** (sourced, before any options):
- `research/ffx-sin-fahrenheit.md`
  - Stat blocks from the decompile (FFX RNG Tracker, pinned in research/ffx-combat-core.md), checked against bover_87 and the wiki.
  - When the Hymn beat plays relative to the Fins.
  - The Negation chance formula.
  - The scripted Game Over from Giga-Graviton.
- `research/ffx2-ixion-djose.md`
  - The Machine Faction set-up.
  - The Farplane vision scene.
  - The Chapter 3 party build (dresspheres available at that point).
  - The F-8 split conflict, recorded with both sources.
- FF7:
  - Correct the two errors in `D:\FF7` research: Blue Light costs 8 MP, not 0; Safer's beat-3 physical is 1.5x Base, Cut, always hits, Paralysed + Darkness.
  - Confirm Jenova·LIFE's low-MP behaviour.
  - Interpret Super Nova's "[ 32]" chance class through Fergusson's Battle Mechanics guide (GameFAQs 22395).
  - Re-check `formulas.md` line by line against that guide.

**Step 2: end-state-first options round** (rule 9; `docs/target/targets.json`):
- 2 to 4 concept frames per chapter before any build. Each is a faked screenshot of the finished moment plus a few lines on how it plays.
  - Sin: the Fins seen from the deck at "close" against "far"; Overdrive Sin's mouth with the turn clock; the Genais shell moment.
  - Ixion: the Recharge warning, the Thor's Hammer frame, and Yuna's fall into the Farplane.
  - Jenova·LIFE: the water altar framing, plus about 3 HUD mockups (Ink & Gold with a third accent, the classic FF7 blue window, and a blend). `D:\FF7\concept\stylish-ui.html` is a starting point.
- The art judges look at a painting pilot before any batch: Sin at colossal scale, and the machina-fused Ixion.
- Music: original score sketches go to `docs/audio/audition.html` for Bailey's ear (rule 13).
- After each pick, write liked / disliked / must remain / must change / undecided into the tile's `reaction` (rule 15).

**Step 3: the FF7 engine decision, its own architecture step, before any FF7 code:**
- A new pure `src/battle/ff7` module on the common layer. It reuses the common rng, aim and clone, and has its own internal unit type, as `src/battle/ffx2/internal.ts` does.
- It covers:
  - The ATB timers with the Active / Recommended / Wait modes.
  - FF7's integer truncation.
  - Reflect bounce, Barrier and MBarrier.
  - Rows.
  - Limits Lv2-3 with Fury and Sadness.
  - Only the materia the preset carries. There is no materia menu and no summons.
- `GameId` gains `'ff7'`. That is an additive contract change with a `docs/CONTRACT-CHANGES.md` entry (rule 2).
- Rule 14 and CHK-020/021 gain an "FF7 only" case.
- Paper preflight at `docs/plans/ff7-engine-review.md` (rule 15), and a deep review per `critic-plan`.

**Step 4: build** only after the target is locked. Then:
- Bench each boss at human speed with its sourced party. Only player-side fixes are allowed; never weaken a boss.
- Ship behind a switch until it passes.

---

## 4. Sources

GameFAQs, read in the built-in browser on 2026-09-27 (WebFetch was refused with 403):
- Gestahl, FFX boss FAQ 16895: the boss order.
- bover_87, FFX FAQ 79145, the "sin" and "mt-gagazet" pages.
- Split_Infinity, FFX-2 boss FAQ 26832, G0601 to G0660.
- SinirothX, FFX-2 AI FAQ 31807, via research/ffx2-fallen-aeons.md.
- Terence Fergusson, FF7 Enemy Mechanics v1.11 (faqs/31903) and Party Mechanics v1.10 (faqs/36775).
- Fergusson, FF7 Battle Mechanics (faqs/22395): still to read for the two open FF7 points.

Final Fantasy wiki (API revids):
- Overdrive Sin 4004207
- Left Fin 3981190
- Sinspawn Genais 4016986
- Sinspawn Gui 4029189
- Spherimorph 4043571
- Spectral Keeper 3981209
- Biran Ronso 3999601
- Yenke Ronso 3999602
- Penance 4025361
- Chac 3998718
- Angra Mainyu (X-2) 4041096
- YSLS-Zero 3975388
- Garik Ronso 3957156
- Ixion (X-2) 3979438

Other sources:
- Gamer Corner FF7 monster pages: a cross-check for the FF7 candidates.
- Repo research: research/ffx2-fallen-aeons.md, research/ffx-seymour-flux.md §18, research/ffx-evrae-airship.md, research/ffx-yojimbo.md, research/ffx2-bahamut.md, research/ffx-combat-core.md.
- Earlier FF7 work (a separate repo): D:\FF7\docs\research\formulas.md, enemies.md §1/§4/§5, party.md §4/§7/§8, scenes.md §6/§7, and D:\FF7\concept\.
