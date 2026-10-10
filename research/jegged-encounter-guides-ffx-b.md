# Jegged's FFX encounter guides, second half of the FFX chapters (part B)

Read 2026-10-03 for Bailey's standing rule of the same day: "from now on the guide follows the ffx/ffx-2
encounter guides from jegged." The in-game strategy guide (NEXT / WATCH / RULES, `src/data/guides/*.ts`
and `src/engine/tactics/*.ts`) should follow Jegged's boss advice for the same boss.

**Game case: FFX only** (AGENTS.md rule 14). Every chapter below is an FFX chapter and every page below is
Jegged's *FFX (HD)* walkthrough. Nothing here is FFX-2 advice, and nothing here applies to chapters 4 to 6.
The FFX-2 chapters are in a separate note.

**Copyright.** Everything below is our own paraphrase of what the pages recommend. No sentence of Jegged's is
copied; the only quoted words are a few short phrases, attributed. Numbers are the numbers Jegged prints, each
checked against `research/*.md`, which holds the sourced values (rule 6). Where they differ, the research wins
and the conflict is listed in section 8. No boss number is changed by anything in this file (rule 6; "never tune
a boss").

**Method.** The pages were fetched with `curl` (HTTP 200 on every page, no bot wall, nothing downloaded to the repo)
and read as text on 2026-10-03. The scratch copies live outside the repo under
`D:/Tools/pyrefly-scratch/2026-10-03/jegged/`.

## 0. Which chapters this note covers

`CHAPTERS` in `src/data/encounters.ts` holds eleven FFX chapters in play order: Seymour Flux, Yunalesca,
Braska's Final Aeon, Seymour Anima (Macalania), Evrae (airship), Yojimbo, Seymour Natus, Seymour Omnis, Isaaru,
Sin (fins and core), Sin (face). The brief says "second half"; eleven does not split evenly. **This note takes
the last six, starting at Yojimbo** (Yojimbo, Natus, Omnis, Isaaru, Sin fins and core, Sin face), so that no
chapter falls between part A and part B. If part A also took Yojimbo, the overlap is one section.

## 1. The pages, and what each holds

All on `https://jegged.com/Games/Final-Fantasy-X/`; all read 2026-10-03.

| Our chapter | Jegged page and section |
|---|---|
| Yojimbo (IX) | `Side-Quests/Cavern-of-the-Stolen-Fayth.html`, section "Cavern of the Stolen Fayth" (the paragraph on the unsent summoner, Lady Ginnem, and the Yojimbo battle). Context only: `Walkthrough/25-The-Calm-Lands.html`, "Calm Lands - Near Bridge"; `Aeons/Yojimbo.html` |
| Seymour Natus (X) | `Walkthrough/23-Via-Purifico.html`, heading "Highbridge", boss block "Seymour Natus" |
| Seymour Omnis (XII) | `Walkthrough/31-Sin.html`, headings "Sin - Sea of Sorrow" (gear advice) and "Sin - Garden of Pain", boss block "Seymour Omnis" |
| Isaaru (XIV) | `Walkthrough/23-Via-Purifico.html`, heading "Via Purifico (Bevelle)", boss block "Isaaru's Aeons" (Grothia, Pterya, Spathi) |
| Sin: the Fins and the Core (XVII) | `Walkthrough/31-Sin.html`, heading "Sin", boss blocks "Left Fin", "Right Fin", "Sinspawn Genais", and "Sin (Core)" |
| Sin: the Face (XVIII) | `Walkthrough/31-Sin.html`, boss block "Overdrive Sin (the Head)" |

Two bosses on those pages have no chapter of ours: Evrae Altana (`23-Via-Purifico.html`, "Bevelle - Via Purifico
(Underwater)"; our Chapter VIII is the other Evrae, over the airship) and Braska's Final Aeon / Yu Yevon
(`32-Inside-Sin.html`; Chapter III, part A's). Jegged has no section for a fight we recreated differently in
any of the six; all six bosses have one.

## 2. Yojimbo (Chapter IX), Lady Ginnem's aeon

**Jegged's source.** Cavern of the Stolen Fayth, "Cavern of the Stolen Fayth" section.

**What Jegged says, in our words.**
- The Calm Lands walkthrough recommends doing the cavern late, at a higher level; Yojimbo is not a strong
  aeon and costs about 190,000 gil (190,350 after haggling).
- Ginnem, the summoner Lulu once guarded, attacks and calls Yojimbo. Jegged calls him "not too difficult",
  gives roughly 30,000 HP, and says to bring Yuna's aeons if it goes badly. That is the whole fight advice.
- A helpful hint elsewhere in the cavern: Kimahri can learn the Doom Ronso Rage by using Lancet on a Ghost here.
  Jegged does not tie Doom to the Yojimbo fight.
- Everything after the fight (the three answers Yojimbo offers, the haggling steps, the side-room chests) is
  the contract, not a boss fight.

**Preparation Jegged implies.** Come back strong; learn Doom from a Ghost; bring aeons.
**Phase plan.** None. **Watch for.** None named (Jegged does not mention Zanmato or his gauge).

**Fit to our chapter.**
- Party: Lulu, Kimahri, Yuna, with the other four on the bench; every stat cell is the Gagazet preset's
  (`src/data/ffx/builds/yojimbo-cavern.ts`, an upper bound, all `[estimate]`). Items: the Gagazet preset's bag less the two mountain Mega-Potions and the mountain's 20,000 gil. Doom is the switch `CAVERN_DOOM_PREP`, shipped `'not-learned'` (Bailey 2026-09-26).
- **Applies as written:** bring Yuna's aeons. Our NEXT line already summons one at a gauge of 80 so Zanmato hits
  the aeon, which is the same advice with the reason Jegged leaves out.
- **Adaptation (our adaptation of Jegged):** Jegged's one concrete tip, Doom learned from the cavern's Ghost, is
  a preparation tip, not a battle tip. It matches `research/ffx-yojimbo.md` §5.3 row 1 (4 sources), but our
  shipped party did not learn it, so the guide's opening rule is the race (see `OPENING` in
  `src/data/guides/yojimbo-cavern.ts`). If Bailey wants the guide to follow Jegged's implied route, that is a
  party-prep decision (`CAVERN_DOOM_PREP = 'preloaded'`, 200/200 per `docs/handoff/yojimbo-pick.md`), not a
  guide edit. It re-opens his 2026-09-26 pick, so it is his call.
- **Does not apply:** the gil, the haggling, the Chamber of the Fayth and the side rooms (not built).
  Jegged's "about 30,000 HP" is a rounded figure; the research has 33,000 (decompile, wiki, GameFAQs).
- **Our line vs Jegged's:** Jegged: strong party, brute force, aeons if needed. Ours: Lulu casts the -ra spells
  into Magic Defense 0, a quiet party never names him (each action aimed at him adds 3 to his gauge), aeon at
  gauge 80. Ours is more specific and cites `ffx-yojimbo` §4.1 and §5.3.
- **Measured (existing):** the intended line wins 161/200 on the shipped (no-Doom) party, 200/200 with Doom
  (`docs/handoff/yojimbo-pick.md`). Not re-run for this note.

## 3. Seymour Natus (Chapter X), the Highbridge

**Jegged's source.** `Walkthrough/23-Via-Purifico.html`, "Highbridge", boss block "Seymour Natus".

**Preparation (Jegged).** Level Yuna on the bridge until she knows Reflect; wear Stone Ward or Stoneproof
armour; make sure Lulu has Bio. Buy anything you are short of from O'aka on the bridge.

**Plan (Jegged), our words.**
1. Natus has 36,000 HP and two targets: Natus and the arm called Mortibody. Mortibody's Desperado strips good
   statuses. It fires when all three members share one status, so spread Haste across only two.
2. Phase 1 (above 24,000): Mortibody casts one element at the party, Natus doublecasts the same element a
   moment later. Nul spells can blunt it but are hard to time and Desperado removes them.
3. Phase 2 (below 24,000): Natus Protects himself (Dispel removes it) and casts Break to petrify one member.
   Mortibody's Shattering Claw then destroys a petrified member for good, so Soft or Esuna at once.
4. Phase 3 (below 12,000): Natus casts Flare (about 2,500 to one member) and Mortibody Cures him. Reflect on
   Natus bounces the Cura onto the party. Reflect on the party is advised for the last phase, but cast Haste first
   or it reflects onto Natus.
5. Extras: Bio early, since the fight is long; Auron's Magic Break; killing Mortibody drains Natus for 4,000, then
   3,000, 2,000, 1,000 and reverts; casting an aeon is mostly useless because Natus Banishes it, except for a
   Grand Summon Overdrive; Talk raises Yuna's Magic Defense and Tidus's and Auron's Strength; give every member
   one attack for AP.

**Key numbers Jegged prints:** 36,000 HP; 24,000 and 12,000 thresholds; Flare about 2,500; drain 4,000 / 3,000 /
2,000 / 1,000. All match `research/ffx-seymour-natus-highbridge.md` §1.1, §4.1, §4.4.

**Fit to our chapter.** Opening line-up Tidus, Yuna, Kimahri; Auron on the bench; all seven have the Gagazet
preset's cells (`src/data/ffx/builds/highbridge.ts`). Yuna does not know Reflect (B4); Rikku does. Lulu knows
Bio and sits on the bench. Softs and Phoenix Downs carried from Chapter VIII.
- **Applies as written:** two-only Haste (our line Hastes Tidus and Auron, never a third); Soft at once on
  petrify; Talk for Tidus, Auron and Yuna; one aeon turn before Banish, spent as an Overdrive; Mortibody's
  drain; the 24,000 / 12,000 phases; Flare and Cura in phase 3. Our guide RULES and hints already say each.
- **Applies, but our line does not use it yet:** Reflect on Natus against Mortibody's Cura (Rikku's Reflect,
  `research` §6.3 row 5, 2 sources) and Bio opened early by Lulu (Poison lands at a reduced chance, per the status table). The
  guide could carry them as optional rules; the shipped tactic wins 169/200 without them.
- **Adaptation (our adaptation of Jegged):** "level Yuna to Reflect" has no analogue: chapters are standalone
  presets, so Yuna's list is fixed. Use Rikku's Reflect or skip it.
- **Does not apply, and the guide must not teach it:** Magic Break (Natus and Mortibody are Magic-Break
  immune, §6.3); Jegged's claim that a direct attack draws a counter-spell (single source; the decompile shows
  only a Protect counter; N-6, not built); Jegged's claim that Nul spells call Desperado (contradicts the wiki
  ladder; not built). Stone Ward is already on Rikku only; no one else carries it. Auron joins from the bench
  rather than at the start.
- **Measured (existing):** 169/200 on the shipped bench (`tests/unit/chapters/natus-shipped-bench.test.ts`,
  header of `src/engine/tactics/seymour-natus.ts`). Not re-run.

## 4. Seymour Omnis (Chapter XII), the Garden of Pain

**Jegged's source.** `Walkthrough/31-Sin.html`, "Sin - Sea of Sorrow" and "Sin - Garden of Pain", boss block
"Seymour Omnis".

**Preparation (Jegged).** The fight is all magic. Put on elemental armour: any Ward, -proof, SOS Nul or Magic
Defense piece. Take off weapons with an elemental strike ability, because they can heal him.

**Plan (Jegged), our words.**
1. Omnis has 80,000 HP. Four discs (the Mortiphasms) float behind him; the colours nearest him set the element
   and strength of his four spells each turn (red/orange Fire, yellow Thunder, blue Water, purple Ice). Four of
   one colour: top-tier spells; three: he absorbs that element; two: immune; one: resistant.
2. Turn a disc by hitting it. A physical hit turns it one way, a spell the other. Some discs are in the back
   row; Wakka or Lulu reach them.
3. After six attacks on him he glows, Dispels, then casts Ultima (about 4,000 to each member). Heal beforehand;
   Shield, Focus or Shell help, Jegged says.
4. Aeons are safe here: he does not Banish them. Nul spells help. Open with Hastega (recast after Dispel), Armor
   Break and Mental Break.

**Fit to our chapter.** Tidus, Yuna, Auron to start; five aeons; Chapter III's cells and gear plus the Phantom
Ring on Yuna (B6; Fire, Thunder, Water Eater) (`src/data/ffx/builds/garden-of-pain.ts`). No Talk.
- **Applies as written:** Armor Break first (the NEXT line does it; Defense 180 down to 0), Hastega again after
  Dispel, Nul the colour that shows most, the disc rules, six attacks then glow, Dispel then Ultima, heal above
  4,000 beforehand (the tactic uses 4,200), aeons are safe, the four colour names.
- **Our adaptation:** "put on elemental armour" becomes the one Phantom Ring on Yuna, because no other member has
  elemental gear in the preset; Jegged's "take off strike weapons" needs no action (no member carries one).
  Wakka is the only member who turns discs with a blow: the tactic has Tidus hand his turn to Wakka. Jegged's
  "Wakka or Lulu" is right, with Lulu turning a disc the other way by spell.
- **Does not apply:** Jegged says Shell helps against Ultima. `research/ffx-seymour-omnis.md` §5 (decompile,
  wiki, two others, 4 sources to 1) says it does not; our guide says Shell does nothing against it, and must
  keep saying so. Jegged's "yellow/green" for Thunder is a colour name; our research uses orange, purple, blue and yellow.
- **Measured (existing):** 127/200 (`tests/unit/chapters/omnis-bench.test.ts`, `docs/handoff/chapter-omnis-ship.md`).

## 5. Isaaru (Chapter XIV), the contest of aeons in the Via Purifico

**Jegged's source.** `Walkthrough/23-Via-Purifico.html`, "Via Purifico (Bevelle)", boss block "Isaaru's Aeons".

**Preparation (Jegged).** Yuna fights alone; charge her Overdrive fully before the red-lit hallway. Use and
abuse aeons until the party is rejoined (the maze, not the duel).

**Plan (Jegged), our words.** Three of Isaaru's aeons in a row, each a copy of one of Yuna's:
1. Grothia (his Ifrit, 8,000 HP): Grand Summon Bahamut and fire Mega Flare. It may not kill him, and he
   answers with Hellfire. Jegged says Ice-type spells are most effective.
2. Pterya (his Valefor, 12,000): Bahamut again if he still has an Overdrive; otherwise Ixion, who heals himself
   with Thundara because aeons absorb their own element.
3. Spathi (his Bahamut, 20,000): Bahamut cannot be summoned. Use Shiva (fast, second strongest). Spathi counts
   down from 4 to 1, then Mega Flare. Shield right before it. Shiva heals herself with Blizzara. Heavenly
   Strike's slow does not work on Spathi, so use plain attacks to save MP.

**Key numbers Jegged prints:** 8,000 / 12,000 / 20,000 HP (all match `research/ffx-isaaru-bevelle.md` §2.1, 4 sources).

**Fit to our chapter.** Yuna alone, five aeons (Chapter X's rows), gauges: Bahamut 50, Valefor 90, Ifrit 60,
Ixion 60, Shiva 0; Grand Summon gauge arrives full (B5, taken from Jegged) (`src/data/ffx/builds/via-purifico.ts`).
- **Applies as written:** the Grand Summon opener; Shield before Mega Flare (Shield is the fight's answer in all
  three sources); Spathi cannot be answered with Bahamut; no healing between links.
- **Our adaptation:** the shipped aeons do not know Blizzara (Shiva) or Thundara (Ixion), so Jegged's
  self-heal lines are offered only when a build carries them (`ffx-isaaru.ts` uses them if present; the options
  with them measure 135-153/200 against 125/200 shipped, `docs/plans/isaaru-bench.md`). Jegged gives Shiva
  against Spathi; our line sends Ifrit or Ixion, whichever has the fuller gauge (the wiki's order), Shiva third.
- **Does not apply, and must not be taught:** Ice as Grothia's weakness (it is neutral, `research` §2.3, I-7);
  the 4-to-1 count (the research builds 5, conflict I-5, so the HUD number can differ by one turn from Jegged).
  Jegged's order Grand Summon on Grothia was benched too: 124/200 against 125/200 for the shipped order.
- **Measured (existing):** 125/200 (`tests/unit/chapters/isaaru-tactic-bench.test.ts`, `docs/plans/isaaru-bench.md`).

## 6. Sin: the Fins and the Core (Chapter XVII)

**Jegged's source.** `Walkthrough/31-Sin.html`, "Sin", boss blocks "Left Fin", "Right Fin", "Sinspawn Genais",
"Sin (Core)".

**Preparation (Jegged).** Auron (or someone) must have Armor Break, because Sin is heavily armoured. Level up
at the Zanarkand ruins first.

**Plan (Jegged), our words.**
1. Left and Right Fin are the same fight twice (65,000 HP each; the same range mechanic as the airship Evrae).
   The ship starts far, so you must order it in before you can hit; the Fin attacks less often when Cid keeps it
   away. Use the time between to stack Cheer and Luck (up to five uses each).
2. Hastega early. The Fin's Negation removes good statuses and the Armor Break on Sin; reapply.
3. When "Core gathers energy" appears, pull the ship away at once: Gravija follows and takes about three
   quarters of everyone's HP.
4. Genais (20,000 HP) sits in front of the Core and absorbs magic aimed at Sin. It is weak to Fire and, below half
   HP, retreats into its shell and Cures itself. Slow or Silence Buster limits the Cures. Kill it with plain attacks.
5. The Core (final link) is the same fight with no ship to move, so Gravija cannot be dodged; it counters
   regular attacks with low-tier spells and may Poison.
6. Before the next fight: Stone, Confuse and Zombie Wards, or Auto-Med with a stock of Remedies.

**Key numbers Jegged prints:** 65,000 HP (Fins), 20,000 (Genais), Gravija about three quarters of HP. Match
`research/ffx-sin.md` §2.1 (Core's 36,000 is not given by Jegged).

**Fit to our chapter.** Whole chain on one party state, no rest between links (`src/data/ffx/builds/sin-fahrenheit.ts`:
the Garden of Pain build with Yuna's Tetra Ring back; Auron has Armor Break and Mental Break, Tidus Hastega,
Cheer and Slow, Wakka and Lulu from the bench).
- **Applies as written:** close in, Armor Break, pull back; pull back when the core glows (our rule adds "only if
  Cid acts first"); Hastega early and Negation strips it; the fins open FAR; Genais first, with physicals, then
  Fire; the Core is the same fight without the ship dodge.
- **Our adaptation:** the Negation chance is a single-source formula in the research, so we do not tell the
  player how many buffs are safe; Jegged leaves it at "reapply", which we match. "Stack Cheer and Luck" is limited here by the line-up: Tidus has Cheer, but Rikku (who has Luck and Mix) starts on the bench. Jegged's Slow on Genais: Tidus knows
  Slow; the guide does not teach it yet, so it is a candidate. Silence Buster lasts one turn here (`research` §2.3),
  and the Silence Grenade answer is not in the bag.
- **Does not apply:** the pre-fight Wards and Remedies for the Overdrive Sin fight are advice for the next link;
  Auto-Med and the stock of Remedies belong to Chapter XVIII's guide, not this one (our preset keeps them as is).
- **Our line vs Jegged's:** the same, with the Genais kill order argued (`research` §8 rows 4 and 6).
- **Measured (existing, `docs/handoff/r37-sin-advisor.md`):** whole-chain advisor card 97/200 on seeds 1-200,
  88/200 on 201-400; sensible line 51/200. Not re-run.

## 7. Sin: the Face (Chapter XVIII), Overdrive Sin

**Jegged's source.** `Walkthrough/31-Sin.html`, boss block "Overdrive Sin (the Head)".

**Plan (Jegged), our words.** Sin has 140,000 HP and a clock: after about sixteen turns it casts Giga-Graviton,
an instant loss that aeons do not prevent, and a charge bar over its head shows how close. It starts out of reach
and drifts in. Spend the first turns on Cheer, Luck and Hastega, with Lulu or Wakka dealing damage at range.
Armor Break as soon as it is in reach, or have Rikku Mix two Power or Ability Spheres for a Frag Grenade. Once
close, it attacks with Petrify, Confuse and Zombie, so carry cures.

**Fit to our chapter.** Same party as XVII, rested (`sin-fahrenheit.ts`; Stoneproof on Yuna and Lulu, Confuse
Ward on Tidus and Yuna, none against Zombie).
- **Applies as written:** the clock and its bar; start with Hastega and Cheer; Wakka and Lulu in during the
  three pulls; Armor Break at once; no aeons.
- **Our adaptation:** the clock length. Jegged says about sixteen turns; `research/ffx-sin.md` §5.4 and S-1 have
  12th or 13th (Gestahl, bover_87, SinirothX) and our estimate is the 13th; Jegged is a fourth, outlying
  reading. Keep 13 and label it (Bailey prefers GameFAQs where sources conflict); do not lengthen it to 16 to
  make the fight easier. Rikku's Luck and Mix are on the bench; whether the bag holds the two Power or Ability Spheres for Jegged's Frag Grenade is not checked here.
- **Does not apply:** Jegged's "the fight starts out of reach" is built as the three FAR pulls.
- **Measured (existing):** sensible line 62/200 on the 13th turn, 7/200 on the 12th (`docs/handoff/chapter-sin.md`);
  advisor card 79/200 (39.5 %) at S-1 13 (`docs/handoff/r37-sin-advisor.md`). Not re-run.
- **Update 2026-10-10 (CH-XVIII, re-parity; the sections above stand as written on 2026-10-03):** the clock is **12**, not "our estimate,
  13": the game's own script fires Giga-Graviton on Sin's 12th turn (`research/re-ffx-ai-evrae-yojimbo-isaaru-sin.md` section 7.2), which
  is the GameFAQs reading of the sources too (Gestahl). The guide text, the line and the preset were reworked for it: Lulu Doublecasts
  Firaga (a Lulu ability the preset already grants), and the party starts in armour with the Stone, Confuse and Zombie Wards that this
  section's preparation advice and section 6 item 6 both name. Measured: `docs/handoff/re-parity-ch18.md`.

## 8. Where Jegged disagrees with our sourced numbers

Our sources win (rule 6), the guide must not teach the Jegged version, and none of this changes a boss.

| Chapter | Jegged says | Our sourced value | Where |
|---|---|---|---|
| Yojimbo | about 30,000 HP | 33,000 (decompile, wiki, GameFAQs) | `ffx-yojimbo` §1 |
| Natus | Magic Break works | Natus and Mortibody are immune | `ffx-seymour-natus-highbridge` §6.3 |
| Natus | a direct hit draws Multicast or Flare | decompile shows only a Protect counter; not built | N-6 |
| Natus | Nul spells call Desperado | contradicts the wiki's ladder; not built | §4.3 |
| Omnis | Shell helps against Ultima | no (type Other); 4 sources to 1 | `ffx-seymour-omnis` §5 |
| Isaaru | Ice is best on Grothia | Ice is neutral | `ffx-isaaru-bevelle` I-7 |
| Isaaru | Spathi counts 4 to 1 | 5 (wiki, GameFAQs) | I-5 |
| Sin face | about 16 turns | 12th (the game's script; was "12th or 13th, our estimate 13th" until 2026-10-10) | `ffx-sin` S-1, `re-ffx-ai-evrae-yojimbo-isaaru-sin` 7.2 |

## 9. Summary for Bailey

- Jegged's boss sections for these six are short. Natus, Omnis and Isaaru are real plans; Yojimbo and the Fins/Core
  are a paragraph or a list; Overdrive Sin is mostly about the clock.
- The shipped guide already follows Jegged's lines for Natus, Omnis, Isaaru and both Sin chapters, because our
  research cross-checked them in September. The gaps are small: Reflect on Natus and Bio early (optional rules),
  Slow on Genais (optional), and the Doom route for Yojimbo (a party-prep decision that is Bailey's, not a guide edit).
- No change was made to any guide, tactic or party in this note. Changing `intendedStrategy` for any chapter
  moves the move advisor's top pick and the chapter benches; each such change needs a before and after
  measurement and Bailey's yes (rule 10).

## Sources

- Jegged, FFX Walkthrough 23, "Via Purifico (Bevelle)" / "Highbridge": https://jegged.com/Games/Final-Fantasy-X/Walkthrough/23-Via-Purifico.html (read 2026-10-03)
- Jegged, FFX Walkthrough 31, "Sin": https://jegged.com/Games/Final-Fantasy-X/Walkthrough/31-Sin.html (read 2026-10-03)
- Jegged, FFX Side Quests, "Cavern of the Stolen Fayth": https://jegged.com/Games/Final-Fantasy-X/Side-Quests/Cavern-of-the-Stolen-Fayth.html (read 2026-10-03)
- Jegged, FFX Walkthrough 25, "The Calm Lands" (Calm Lands - Near Bridge): https://jegged.com/Games/Final-Fantasy-X/Walkthrough/25-The-Calm-Lands.html (read 2026-10-03)
- Jegged, FFX Aeons, "Yojimbo": https://jegged.com/Games/Final-Fantasy-X/Aeons/Yojimbo.html (read 2026-10-03)
- Our research: `research/ffx-yojimbo.md`, `ffx-seymour-natus-highbridge.md`, `ffx-seymour-omnis.md`, `ffx-isaaru-bevelle.md`, `ffx-sin.md`
