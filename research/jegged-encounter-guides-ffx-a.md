# Jegged's FFX encounter guides, first half of the FFX chapters (part A: Chapters 1, 2, 3, 7, 8, plus Yojimbo as a short overlap)

**Why this file exists.** Bailey, 2026-10-03: "from now on the guide follows the ffx/ffx-2 encounter
guides from jegged" (memory `feedback-guide-follows-jegged`). The in-game strategy guide (RULES in
`src/data/guides/*.ts`, WATCH, and NEXT = the chapter's `intendedStrategy`) is to take its content from
Jegged's guide for the same boss, game-aware (AGENTS.md rule 14). This file is the research half: what
Jegged says for each boss, in our own words, and how it fits our chapter. It changes no code and no
data. The other half (Yojimbo, Natus, Omnis, Isaaru, both Sin chapters) is in
`jegged-encounter-guides-ffx-b.md`, written in parallel. **File name:** the brief asked for `-b`, but `-b`
already held that other half (commit 43e0708d), so this part is `-a`. Yojimbo appears in both files; the
`-b` section is the fuller one. FFX-2 chapters read Jegged's FFX-2 guide and are not in either file.

**Game case (rule 14): FFX only, for every chapter below.** CTB, Sphere Grid, Overdrive gauges, FFX
aeons. Nothing here is borrowed from FFX-2 and nothing here applies to the ATB chapters.

## How the pages were read, and the copyright line

- Read on **2026-10-03**. The pages show no author and no revision date; "date read" is the only date
  we can give. Jegged's FFX guide has a game-version toggle (PS / Xbox / Switch); none of the boss
  advice below depends on it (it changes only a Celestial crest item on the Gagazet page).
- Primary text was read in a headless Playwright browser started from node (no Claude-in-Chrome, no
  browser pane, nothing downloaded or saved, no bot wall or CAPTCHA met). A first pass through
  WebFetch's summariser was **not** trusted: it invented a "Berserk Ward" line on the Yunalesca page and
  turned the Flux page's Aeon advice into something shorter than the page says. Every statement
  attributed to Jegged below comes from the page text.
- **Nothing is copied.** The advice is restated in our own words; the only quoted words are marked and
  attributed. Numbers Jegged gives are marked "(Jegged)"; numbers we give come from `research/*.md`
  with the section named (rule 6). Where Jegged is silent, this file says so rather than filling in.
- "Our adaptation of Jegged" labels a place where Jegged's advice assumes something our chapter does not
  have (party, ability, item, a fight Jegged covers differently), and says what we do instead.
- Win rates were **not** measured: this is research only. No `intendedStrategy` was run or changed.

## At a glance

| Ch | Boss | Jegged page and section (date read 2026-10-03) | Jegged's plan vs ours, one line |
|---:|---|---|---|
| 1 | Seymour Flux | `.../Walkthrough/26-Mt-Gagazet.html`, "Seymour Flux / Boss Battle" | Same skeleton (Holy Water the Zombie, Bio early, Hastega, Dispel his buffs, Shell/Mighty Guard + Defend before Total Annihilation); **differs on Aeons**: Jegged says last resort, we summon early in both phases |
| 2 | Lady Yunalesca | `.../Walkthrough/28-Zanarkand-Ruins.html`, "Yunalesca / Boss Battle" | Same core (keep one Zombie, Reflect the counters, Dispel Regen); Jegged cures Blind/Silence and leans on Holy, we Reflect first and the build has **no Holy and no Dark/Silence Ward** |
| 3 | Braska's Final Aeon, possessed aeons, Yu Yevon | `.../Walkthrough/32-Inside-Sin.html`, "Braska's Final Aeon / Final Boss Battle" | Jegged covers only the first fight and a one-line Yu Yevon tip; **Pagodas: Jegged kills both together in form 2, we Slow them and leave them up**; the aeon gauntlet is not covered at all |
| 7 | Seymour + Anima (Macalania Temple) | `.../Walkthrough/18-Lake-Macalania.html`, "Seymour / Boss Battle" and "Anima / Boss Battle" | Same Steal-the-Guardians, Nul-the-element-cycle, Shiva-for-Anima line; Jegged has no Shield/Oblivion timing and nothing for our act 3; its Blizzara-heals-Shiva trick needs Lulu |
| 8 | Evrae (airship) | `.../Walkthrough/21-Airship.html`, "Evrae, Guardian Wyrm of Bevelle / Boss Battle" | Near match (pull back, Cheer to 5, Wakka always swings, Rikku's Al Bhed Potions, Slow before the 1/3 self-Haste); ours adds Reflect and the FAR-inhale rule; Jegged's Mix buffs have no ingredients in our kit |
| 9 | Yojimbo (Cavern of the Stolen Fayth) | `.../Side-Quests/Cavern-of-the-Stolen-Fayth.html`, no boss heading; the paragraph on Lady Ginnem and the Ronso Rage hint | Jegged has almost nothing (about 30,000 HP, use aeons if stuck, Doom from a Ghost); our whole line (gauge, Zanmato, Fira, aeon shield) stays on research |

Base URL for the table: `https://jegged.com/Games/Final-Fantasy-X/`.

---

## Chapter 1: Seymour Flux (Mt. Gagazet)

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/26-Mt-Gagazet.html`, page title
"Final Fantasy X Walkthrough: Mt. Gagazet"; section "Seymour Flux / Boss Battle"; the preparation
advice is in two earlier paragraphs of the same page (the Wantz shop note and the save-sphere note just
before the fight). Date read 2026-10-03.

**Jegged's preparation (own words).**
- Buy plenty of Holy Water at Wantz's shop; about 30 of them pay for Zombie Ward on armour through
  customisation (Jegged). Carry about 30 Phoenix Downs (Jegged).
- Yuna must already know Dispel.
- If earlier bosses were a struggle, enter with the Overdrive gauges already charged; Jegged calls this
  boss the hardest in the game for many players.

**Jegged's plan.**
1. The fight is Seymour (70,000 HP, Jegged) plus the Mortiorchis he summons. His Lance of Atrophy can
   Zombie someone; the follow-up Full-Life then kills a Zombie outright, so cure Zombie at once with
   Holy Water, Remedy or Esuna. Zombie Ward on armour reduces the chance it lands.
2. Aeons are a last resort because Seymour banishes them.
3. Lulu casts Bio early (it adds up to a large share of the damage); keep Hastega on the party.
4. When Seymour casts Reflect or Protect on himself, Yuna Dispels it. If the Dispel comes quickly
   enough, his next Flare can bounce back and hit him.
5. Total Annihilation is the killer and it is telegraphed. After he is down to roughly half HP the
   Mortiorchis enters Auto-Attack Mode and then announces it is Ready to Annihilate; the blast comes
   on its next turn, and the charge gets faster after the first one.
6. On the warning: Shell on the party, or Kimahri's Mighty Guard (learned from Biran minutes earlier), or
   one of Rikku's Mighty G Mixes; then Defend as the hit lands.
7. Or summon an aeon on the warning: it soaks the whole blast. Summon **after Seymour's turn**, so he
   cannot banish it before the blast arrives.
8. Kimahri's trigger line is +10 Strength and Yuna's is +10 Magic Defense (Jegged). Steal gives an
   Elixir; the drop is a Lv. 4 Key Sphere (Jegged).

**Not in Jegged:** party levels, the Mortiorchis HP drain, Cheer stacking, Provoke/Break/Delay
immunities, Cross Cleave, any damage numbers.

**Our chapter.** Active party Tidus, Yuna, Kimahri; bench Auron, Wakka, Lulu, Rikku
(`src/data/ffx/builds/gagazet.ts`, `activeSlots`, `reserve`). Zombie Ward is already on Tidus's, Yuna's
and Auron's armour; Yuna knows Shell, Protect, Reflect and Dispel; Kimahri has Mighty Guard and the
Talk line; Holy Water x7, Remedy x3, Phoenix Down x30, Poison Fang x5 (`gagazet-kit.ts`, research
`ffx-seymour-flux.md` §7.8). Our NEXT is `src/engine/tactics/seymour-flux.ts`: Poison Fang on turn one,
Haste, Protect, Cheer to five, everyone near full, aeons early in both phases, Holy Water the Zombie
(research §6 rows 4, 5, 10, 12, 13, 15).

**Applies as written.** Holy Water or Remedy on the Zombie before the Full-Life (ours: §6 row 4);
Hastega on the party (row 10); Dispel his Reflect so Flare bounces (row 8, about 1,734 on himself, §5.3);
Shell or Mighty Guard then Defend before Total Annihilation (row 13); the summon-after-his-turn trick (row
15 and §4.4.2); the Kimahri and Yuna trigger bonuses (§4.7); Zombie Ward (row 2).

**Our adaptation of Jegged.**
- *Bio.* Jegged has Lulu cast it; she is on our bench. Our NEXT uses Poison Fang instead (§6 rows 5-6,
  the same 2% of 70,000 = 1,400 a turn). A player who benches Kimahri for Lulu gets Jegged's line exactly.
- *Zombie Ward and the Holy Water count.* Jegged tells the player to craft it with 30 Holy Water; our
  build arrives with the Ward already on three armours (§7.7.2), so the prep step is done for the
  player and the 7 Holy Water left are for curing, not crafting.
- *Who casts Full-Life.* Jegged's prose says Seymour; its in-game description line says the
  Mortiorchis. Our research (§3.1, decompile) has the Mortiorchis; the advice is identical.

**Where we disagree with Jegged (flag for Bailey).**
- **Aeons.** Jegged: last resort, except as the one-blast shield on the Ready to Annihilate warning. Ours:
  summon as soon as an aeon is available in both phases, because a summon freezes the party's counters
  and Seymour answers with a zero-damage Banish (research §4.4.2, §6 row 15, "wiki + Steam guide +
  Game8"). The guide's current hint for summons says "a shield before it is a burst". Following Jegged
  here would mean moving the aeon rule in `seymour-flux.ts` later in the fight, which moves the move
  advisor's top pick and the chapter bench: measure before and after, do not tune the boss
  (`boss-side-fix-needs-measured-options`).

**Does not apply / not in our guide yet.** Jegged's "charge Overdrives first" is not modelled as a
pre-fight step (gauges are set by the build, §7.9.2). Our extra rules (kill Seymour not the mount;
Provoke, Breaks and Delay are dead rows; Cross Cleave into Dispel) have no Jegged counterpart; they stay
because they are decompiled facts (§2.2, §6 rows 17, 19-21), not because Jegged omits them.

**Suggested guide edits (not made here).** WATCH: add Jegged's wording of the two on-screen messages
(already present as "Auto-Attack Mode" and "Ready To Annihilate"). RULES: add a Dispel-the-Protect line and
the "summon after his turn" timing; reword the Aeon rule to say it differs from Jegged and why.

---

## Chapter 2: Lady Yunalesca (Zanarkand Dome)

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/28-Zanarkand-Ruins.html`, page title
"Final Fantasy X Walkthrough: Zanarkand Ruins"; section "Yunalesca / Boss Battle". Date read 2026-10-03.

**Jegged's plan (own words).**
- Three phases, three forms. HP 24,000, then 48,000, then 60,000 (Jegged).
- *Phase 1.* A physical hit is answered with Blind on the attacker, a spell with Silence. Clear them with
  Esuna, Eye Drops (Blind), Echo Screens (Silence) or Remedy (either); Rikku's Al Bhed Potion cures
  Silence and heals together.
- *Phase 2.* Hellbiter Zombies the whole party, then her cure spells damage them (so do your own heals).
  If the Zombie is removed from everyone she simply casts Hellbiter again, so keep at least one Zombie at all
  times. Heal a Zombie with Holy Water. Dispel her Regen off your people.
- *Phase 3.* Mega Death kills anyone who is not Zombie, so the same rule: always keep a Zombie.
- Holy is described as very strong against her; Yuna is wanted in the party for Dispel and healing. Yuna or
  Rikku can learn Holy now with a Teleport or Return Sphere plus a Lv. 3 Key Sphere.
- Reflect on the party bounces the Phase 1 status counters and, in Phase 2, bounces her Regen back at her.
  Her Punch strips every positive status except Reflect, which makes Reflect the durable shield; put it on
  Yuna first so she cannot be Silenced. Dispel her own Regen so she does not out-heal you.
- Armour: wards or proofs against Silence, Darkness and Confuse, but do **not** block Zombie.
- Steal: Stamina Tablet (common), Farplane Wind (rare); drop Lv. 3 Key Sphere (Jegged).
- Jegged's in-game blurb also says her counters strip support magic and that Mind Blast Curses aeons.

**Not in Jegged:** the Sleep counter, Absorb/Osmose, Mind Blast's Confuse, party and level advice,
timing of aeons, damage numbers.

**Our chapter.** Active party Tidus, Yuna, Auron; bench Wakka, Lulu, Kimahri, Rikku
(`src/data/ffx/builds/zanarkand.ts`). Zombie Ward and Confuse Ward on most armours, Death Ward on
Auron, Wakka, Rikku, Kimahri; Holy Water x4, Remedy x4, Eye Drops x10, Echo Screen x10, Soft x5, Al Bhed
Potion x15. Yuna knows Esuna, Reflect, Dispel, Regen, Shell, Protect, **not Holy** (research
`ffx-yunalesca.md` §11.3 withholds it; §2.3 notes the in-game Sensor line about Holy is flavour: no
elemental weakness exists). Our NEXT is `src/engine/tactics/yunalesca.ts`.

**Applies as written.** Keep one Zombie (§10.1); never cure the last Zombie with Mega Death due (§10.2);
Holy Water to heal a Zombie in a controlled way (§10.2); Dispel her Regen (§10.5); Reflect on the
party for the Form I counters (§10.4, "the canonical Form-I answer"); Yuna is the right third member.

**Our adaptation of Jegged.**
- *Holy.* Jegged: learn it and use it. Ours: the build withholds it by research (§11.3 "a normal player
  reaches it after Zanarkand"), so the guide should not tell the player to cast it; it can say
  Jegged recommends it and that the party does not have it yet.
- *Dark/Silence Ward.* Jegged suggests them; our armour slots went to Confuse Ward and Death Ward under
  `ffx-yunalesca.md` §10.10, and Reflect plus cures cover Form I. Flag: Jegged's Dark Ward line has no
  slot in our build.
- *Sleep.* Our Form I counter set includes Sleep for non-physical, non-magic actions (§5.1); Jegged names
  only Blind and Silence. Keep ours (decompiled); Eye Drops/Echo Screen/Remedy rows still cover Jegged's two.
- *Name of the buff-strip.* Jegged calls it Punch; our research and engine use the decompiled name
  Dispelling Slap (§3, §4.2). Not verified which name the HD game shows; use "Dispelling Slap
  (Jegged calls it Punch)" if the guide mentions it.

**Where we disagree.** Nowhere on Zombie, Hellbiter or Mega Death. Jegged does not mention aeons;
ours holds every aeon for Form III and Overdrives on arrival (§10.6, tactic header), an addition not a
conflict.

**Suggested guide edits.** RULES: add "Reflect Yuna first so she cannot be Silenced" and a "Holy is
strong but your party has not learned it" line; keep the five existing rules, all of which Jegged
corroborates except the aeon rule (ours alone).

---

## Chapter 3: Braska's Final Aeon, the possessed aeons, Yu Yevon (Dream's End)

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/32-Inside-Sin.html`, page title
"Final Fantasy X Walkthrough: Inside Sin"; the preparation paragraphs under the "Sin - Dream's End" and
"Sin - The Nucleus" headings, then "Braska's Final Aeon / Final Boss Battle", then one closing paragraph
on Yu Yevon. Date read 2026-10-03.

**Jegged's plan (own words).**
- Before the fight: heal up with potions and ethers; wear Stone Ward or Stoneproof; spend the stockpile,
  since nothing follows (X-Potions, Mega-Potions, Turbo Ethers, Elixirs, Megalixirs, Mega Phoenix).
- Two forms; the second form appears when the aeon draws a sword from its chest and grows wings.
- Two Yu Pagodas float beside it. Their Power Wave heals it and charges its Overdrive gauge. Each has
  5,000 HP (Jegged) and returns after a few turns with extra HP equal to the overkill on the killing
  blow. Kill them **together** or the survivor starts casting nasty spells, Curse among them; Jegged also
  advises holding off killing them until form 2.
- Keep Hastega, Protect and Regen up. Cure Petrify at once with a Soft or Remedy, because Shatter then
  removes that character for good; fighting on with two people is described as very hard.
- Tidus's Talk command empties its Overdrive gauge. It can be used **twice** in the fight (Jegged); save both
  for form 2 where the Overdrives are far stronger.
- It is vulnerable to Bio (may take several casts) and to the Breaks (Armor, Power, Mental, or Full Break).
- Yu Yevon: a fight you cannot lose; if it drags, Yuna casts Reflect on him.

**Not in Jegged:** HP of either form, the Overdrive names, the possessed-aeon gauntlet (the aeons appear
only as names in screenshots), party and level advice, Auto-Life.

**Our chapter.** Forced party Tidus, Yuna, Auron at the start, bench swapping free (`dreams-end.ts`);
Stoneproof on two pieces, Death and Confuse Ward; Soft x4, Remedy x6, Holy Water x4, Mega Phoenix x2,
Turbo Ether x2. Form 1 is 60,000 HP and form 2 is 120,000 (research `ffx-bfa-yu-yevon.md` §1.1);
chain of seven battles with two Pagodas in each; Yu Yevon 99,999 HP (§3). NEXT is
`src/engine/tactics/braskas-final-aeon.ts`.

**Applies as written.** Stoneproof/Soft/Remedy and the permanent Shatter (§1.6); Talk twice, saved for
form 2 (§1.6); Pagoda HP 5,000 and the overkill revive (§1.4, "verified: 2 sources", with Jegged named as
corroboration at line 788); Hastega kept up; Mental Break; Yuna's Reflect on Yu Yevon is already known to
the research (Reflect gets stripped by Power Wave #210, §1.4, so it is a weak lever).

**Our adaptation of Jegged.**
- *Pagodas.* Jegged: destroy both at once, ideally in form 2. Ours: Slow both and leave them standing,
  measured against four kill-both implementations that lost (tactic header, "Slow both pillars"). For
  Yu Yevon the tactic does kill them (§3.5). This is the clearest disagreement in the chapter.
- *Breaks and Bio.* Jegged recommends both. In our data the BFA Power Wave strips Poison and all four
  Breaks (§1.4), so they last only until the next Power Wave; Jegged does not say this. The tactic uses
  Mental Break while the boss stands (§1.6) and no Bio.
- *Yu Yevon.* Jegged's tip is Reflect; ours is Doom (Candle of Life) and never damaging him because every
  damaging action is answered by a 9,999 Curaga (§3.4.1). Jegged's advice does not contradict ours (it
  says nothing about damage), but ours is the safer instruction.
- *The aeon gauntlet.* Not covered by Jegged; our guide rules for it stay on research alone, and should
  say so.

**Suggested guide edits.** RULES: add "cure Petrify first" already present; add Jegged's "kill the
Pagodas together or not at all" next to our Slow line and say which the party gets; add a Stone Ward /
Stoneproof prep line to WATCH if there is a prep surface.

---

## Chapter 7: Seymour and Anima (Macalania Temple)

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/18-Lake-Macalania.html`, page title
"Final Fantasy X Walkthrough: Lake Macalania" (Jegged files the temple fight on this page); sections
"Seymour / Boss Battle" and "Anima / Boss Battle". Date read 2026-10-03.

**Jegged's plan (own words).**
- *Seymour.* 6,000 HP (Jegged), with two Guado Guardians. They shield themselves with Protect, Seymour
  with Shell. Tidus's Talk raises Seymour's Strength; Yuna's and Wakka's Talk lines raise Magic Defense.
- Guardians step in front of physical attacks and drink a potion on themselves each time they are hit
  (Auto-Potion). Answers: Rikku Steals each one's Hi-Potions, or Auron's Threaten stuns them. Kill both
  Guardians before Seymour.
- Seymour's spells come in a fixed order: ice, lightning, water, fire; Yuna pre-casts the matching Nul
  spell each turn.
- *Anima.* 18,000 HP (Jegged); the fight starts the instant Seymour falls. Tidus tells Yuna to summon
  the new aeon, Shiva. Ice heals Shiva, so a Blizzara on her restores her HP. Heal her until her
  Overdrive (Diamond Dust) is ready and fire it, ideally while Anima is boosting. Shiva will probably fall
  anyway; keep the party's HP high because Anima's Overdrive is close to a guaranteed wipe and Pain
  kills a party member outright.
- After Anima, Auron's Magic Break and Lulu's Bio (if she has it) go on Seymour. Steal: Silence Grenade
  (common), Farplane Shadow (rare); drop Ability Sphere (Jegged).

**Not in Jegged:** the Seymour HP clamp, the three-act structure (our third act, Seymour alone with
doubled spells), Shield, the Oblivion gauge timing, what the aeons cost, levels.

**Our chapter.** Active party Tidus, Yuna, Rikku; bench Wakka, Auron, Lulu, Kimahri
(`macalania.ts`). Yuna has the four Nul spells, Shell, Protect, Esuna, Talk, no Dispel; Shiva's gauge
starts at 0 by rule (research `ffx-seymour-anima-macalania.md` §8.6); Petrify Grenade x4, Poison Fang x2,
Remedy x3. Act one Seymour (6,000, clamped at 5,999 a hit until he summons) with two Guardians of 2,000
HP; act two Anima 18,000; act three Seymour again at full HP with the -ga spells twice a turn (§5.4).
NEXT is `src/engine/tactics/seymour-anima-macalania.ts`.

**Applies as written.** Steal from both Guardians (§7 row 1); the ice, lightning, water, fire order and
pre-cast Nuls (row 5); Tidus's, Yuna's and Wakka's trigger lines (§5.5); Shiva summoned for Anima and
her Overdrive held for the boosting turn (row 14); Pain kills party members (§4.3).

**Our adaptation of Jegged.**
- *Blizzara on Shiva.* Yuna has no Blizzara here; the heal needs Lulu from the bench, and our NEXT never
  picks it (the tactic only mentions Blizzara as a Guardian-damage row it avoids). Research §5.2 adds
  that Seymour's own Blizzaga turn already heals a summoned Shiva. If the guide mentions Jegged's
  trick, it must say "needs Lulu".
- *Threaten.* Jegged offers it as an alternative to Steal; Auron is on our bench, so it is a swap, and
  research §2.3 says Steal does not stop the Guardians' Remedy use anyway.
- *Act three.* Jegged ends at "Magic Break and Bio after Anima"; our third act (the repeated spell,
  Shell) has no Jegged counterpart beyond that. Adapt: Magic Break from Auron and the matching Nul
  stay valid; the rest is research-only.
- *Aeon count and gauges.* Jegged assumes the player's aeon stable; ours has Valefor, Ifrit, Ixion and
  Shiva, and Ixion's Aerospark is the answer to Shell because Yuna lacks Dispel (`macalania.ts`).

**Where we disagree.** None. Jegged simply stops earlier than our chapter does.

**Suggested guide edits.** RULES: add "Threaten stuns the Guardians if Auron is in" as a named
alternative; WATCH: nothing to change. Add a line on Blizzara-heals-Shiva with the "needs Lulu" caveat.

---

## Chapter 8: Evrae (airship)

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Walkthrough/21-Airship.html`, page title
"Final Fantasy X Walkthrough: Airship"; section "Evrae, Guardian Wyrm of Bevelle / Boss Battle" plus the
preparation paragraphs just above it. Date read 2026-10-03.

**Jegged's plan (own words).**
- Preparation: Stoneproof or Stone Ward and Poisonproof or Poison Ward armour; craft Stone Ward with
  about 30 Softs and Poison Ward with about 30 Antidotes from Rin (Jegged); pick up four Al Bhed
  Potions from the Al Bhed in the last room. Proof removes the chance entirely, Ward only reduces it.
- 32,000 HP, high Magic Defense, no elemental weakness (Jegged). Poison Breath comes if it is hit
  repeatedly by melee; Stone Gaze when it is near the ship.
- Cid's turn either moves the ship nearer or farther. From far away Cid fires guided missiles by
  himself, at most three volleys (Jegged); Evrae's attacks are weak at range, so pull away whenever the
  party needs to recover.
- Opening: move away first; Tidus Cheers up to five times (plenty of time at range); Wakka keeps
  attacking because his shots reach at any distance. Rikku heals and cures Poison and Petrify with Al
  Bhed Potions via Use and fires her Mix for Mighty G (Protect and Shell) or Super Mighty G (adds Haste
  and Regen). Party: Wakka, Rikku, Tidus, with Lulu replacing Tidus only if she is high-level.
- Tidus's Slow or Slowga speeds the party's share of turns, but at roughly one third HP Evrae casts Haste on
  itself and re-casts it whenever you re-Slow, undoing it.
- Steal: Water Gem; drop: Blk Magic Sphere (Jegged).

**Not in Jegged:** Reflect, the FAR-inhale behaviour, Cid's volley size, Delay, Dark Buster, levels, Swooping
Scythe.

**Our chapter.** Party Tidus, Wakka, Rikku, bench Lulu, Auron, Kimahri, no Yuna and no aeons
(`fahrenheit.ts`); Rikku carries the only Stone Ward; Al Bhed Potion x22, Soft x12, Antidote x12, Remedy x2.
Research `ffx-evrae-airship.md`: 32,000 HP (§1, "decompiled + wiki + Jegged"), three volleys about
7,200 total (§7.4), Cid either orders or fires. NEXT is `src/engine/tactics/evrae.ts`.

**Applies as written.** Pull away at once and let Cid work (§4.2, §7.4); Cheer then Haste at range; Wakka
swings at any range; the Al Bhed Potion is the heal and the Petrify/Poison cure (§6.4); Slow before it Hastes
itself (§6.3); party of Tidus, Wakka and Rikku.

**Our adaptation of Jegged.**
- *Mighty G Mixes.* Our inventory lists no Mix ingredients for them, so the Mix advice is a research
  question (C-2 in the research asks whether Mix reaches at FAR) rather than something the kit can
  do today. The guide should not tell the player to Mix for Mighty G unless the kit gets the items.
- *Ward crafting.* Jegged's 30 Softs and 30 Antidotes assumes the player customises armour before the
  fight; our build ships one Stone Ward on Rikku and no Poison Ward (preset note 1: Stoneproof needs
  Petrify Grenades Rin does not sell). Adaptation: the guide says so rather than telling the player to craft.
- *Lulu.* Jegged swaps her for Tidus if high level; ours rotates her in for reach early and out again
  (tactic rule 5).

**Where we go beyond Jegged (not a conflict).** Reflect at one third HP to deny and redirect the Haste
(§6.5, C-14); do nothing visible when the ship is FAR and Evrae inhales (§4.5); Dark Buster then Power Break.

**Suggested guide edits.** RULES: add "Poison Ward and Stone Ward only reduce the chance; Proof removes
it" as a prep note; keep the five existing rules.

---

## Chapter 9: Yojimbo in the Cavern of the Stolen Fayth

**Source.** `https://jegged.com/Games/Final-Fantasy-X/Side-Quests/Cavern-of-the-Stolen-Fayth.html`, page
title "Final Fantasy X Side Quests: Cavern of the Stolen Fayth". Jegged has **no boss heading** for this
fight: the text is a short paragraph that introduces Lady Ginnem, the unsent summoner Lulu once guarded,
who calls Yojimbo, followed by the contract haggling. A "Kimahri's Overdrive - Ronso Rage" hint box earlier
on the page names Doom. Date read 2026-10-03. Jegged's separate Yojimbo aeon page was not used (it covers
owning him, not fighting him).

**Jegged's content (own words).**
- Yojimbo is not very hard and has about 30,000 HP (Jegged); use Yuna's aeons if stuck.
- Kimahri can learn Doom by Lancet on a Ghost in the cavern (hint box).
- After the fight, the contract: pick the "defeat the most powerful of enemies" answer; the price starts at
  250,000 gil and three haggles bring it to 190,350 (Jegged). Not relevant to our chapter, which ends at
  the battle.

**Not in Jegged:** the Zanmato gauge, that he has Defense 80 and Magic Defense 0, that Ginnem and Daigoro are
not targetable, any attack pattern, any party advice.

**Our chapter.** Party Lulu, Kimahri, Yuna; bench Tidus, Auron, Wakka, Rikku (`yojimbo-cavern.ts` build,
a Gagazet preset minus Mighty Guard, White Wind and mountain gil; Kimahri arrives without Doom by Bailey's
2026-09-26 choice, `CAVERN_DOOM_PREP = 'not-learned'`). HP 33,000 (research `ffx-yojimbo.md` §2.1,
"decompiled + wiki + GameFAQs"; Jegged says "approximately 30,000", a rounding, not a conflict). NEXT is
`src/engine/tactics/yojimbo-cavern.ts`: revive, Yuna heals, Kimahri Dooms if he has it, Lulu Fira, summon an
aeon once the gauge reaches 80, everyone else defends.

**Applies as written.** Doom from a Ghost (research §5.3 strategy 1, where Jegged is one of the four
sources already cited); Yuna's aeons as a fallback (§5.3 strategy 3).

**Our adaptation of Jegged.** Jegged's advice is a single sentence; everything in our guide's rules
(each action aimed at him adds 3 to his gauge, 2 for his own attacks, Zanmato at 100, Lulu hits hardest,
the aeon stands in front of Zanmato) is research-only (§4.1, §3.3, §5.3), and that should be said, not
disguised as Jegged. Label them "our estimate where the source is thin" only where research does.

**Does not apply.** The contract haggling; Jegged's "not too difficult" tone (our party arrives without
Doom and the 161-of-200 seed result in the tactic header says it is a race).

**Suggested guide edits.** RULES: add "Kimahri can learn Doom from a Ghost in this cavern (optional)" so
the player knows the route Jegged names; keep the rest and cite research.

---

## Open questions for Bailey

1. **Flux aeons.** Jegged says last resort, we say early (measured and sourced to the wiki, a Steam guide and
   Game8). Which does the guide follow? Following Jegged changes the Flux tactic and needs a measured
   before/after.
2. **Braska Pagodas.** Jegged kills them together in form 2; our measured line Slows them and leaves them
   up. Same question, same measuring.
3. **Yunalesca Holy.** Our party does not have it; should the guide mention Jegged's Holy advice as
   "not available yet" or stay silent?
4. **Evrae Mix.** If Rikku is to be told to Mix for Mighty G, the kit needs those items first, which is a
   data change (never invent game data, rule 6).

## What this file does not do

No guide file, tactic, build or number was changed. FFX-2 chapters are out of scope here. Chapters 10, 12,
14, 17 and 18 are in `jegged-encounter-guides-ffx-b.md`. Jegged's pages carry no
revision date, so this file should be re-read if Jegged's walkthrough is rewritten.
