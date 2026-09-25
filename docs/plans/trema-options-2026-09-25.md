# Chapter XIII (Trema): options for Bailey's word, 2026-09-25

**Game case: FFX-2 only.** Evidence on branch `chapter-trema-0925` (`D:/pyrefly-ch-trema`): research
§12 (ea2664d2), `docs/plans/trema-bench.md` (d7403ad2), the method check. No boss number changes.

## What happened tonight

1. Trema did not ship. With your picks (TR7 Normal Paragon, TR10, TR11 a) the chapter wins 0/200.
2. Normal Paragon is the wall: 0/200 with every sourced kit, even with 3 s of animation time.
3. The sources say the one TR10 clear on record was against **Oversoul** Paragon, not the normal one.

## How to read the numbers

- "Bench" = perfect instant play, 200 seeds. "Human" = live default Wait split, 1.5 s a menu
  (0.5 s on the top list with the clock running), 40 seeds.
- "Trema" = Trema with the party at full strength. In the chapter the party arrives hurt from
  Paragon, so the chapter rate can only be lower than the Trema rate.
- Kits: **your kit** = TR11 a. **Split's kit** = Split_Infinity's clear (Defense Bracers and
  Adamantite, Rabite's Feet, Valiant Lustre on all three, 99 Megalixirs and Mega-Potions,
  Stamina Tonic, Soul Spring, Three Stars). It is built on the branch and switched OFF.

| Kit | Paragon bench / human | Trema bench / human | Chapter bench / human |
|---|---|---|---|
| Your kit (TR11 a) | 0/200 · 0/40 | 0/200 · 0/40 | 0/200 · 0/40 |
| Split's kit | 0/200 · 0/40 | 30/200 · 1/40 | 0/200 · 0/40 |
| Split's kit + the one Ribbon | 0/200 · 0/40 | 49/200 · 4/40 | 0/200 · 0/40 |

## The options

### 1. Oversoul Paragon, with Split's kit (TR7 changes to Oversoul, TR11 to Split's kit)

- **What changes:** link 1 becomes Oversoul Paragon, the form you get after ten Omega Weapon
  kills. It waits until it is hit, copies spells back, has no Big Bang counter, and its
  physicals often miss. The party wears the kit from the clear that TR10 was picked from.
- **Sources:** the trigger, the "easier" verdict and the misses have 3 sources. The full stats
  and AI script come from one source (SinirothX). Three gaps need a labelled estimate or your
  pick: how often its physicals miss (no source gives a number), the idle timer (20 s or 2.5 min),
  and Final Impact's hit count (14 or 10).
- **Measured:** nothing yet. It cannot be measured until it is built. The chapter can win no
  more often than Trema does: 30/200 on the bench and 1/40 for a human, with Split's kit.
- **To build:** the Oversoul block and AI on the branch, OFF, then a bench: roughly 3 to 4 hours.
- **You would be approving:** the easier, sourced form of Paragon. The one TR10 clear on record
  fought this form. The fight stays short of human-winnable unless option 3 also lands.

### 2. Trema alone (TR1 b)

- **What changes:** no Paragon. Trema is fought at full HP using his Fiend Arena block
  (International/HD). That block is slower (Agility 95 against 129) and luckier (Luck 128
  against 26), so Darkness lands only on a chained Trema. The story beat of Trema killing
  Paragon is lost.
- **Sources:** the block and the full-HP start have 2 sources. His AI weights have one, and
  that text breaks off partway through.
- **Measured:** the Fiend Arena block has not been benched. The nearest measurement is the story
  Trema with a full-strength party: 30/200 on the bench and 1/40 human (Split's kit), and 49/200
  and 4/40 with the Ribbon.
- **To build:** one enemy block and a bench run, 1 to 2 hours, then the ship steps.
- **You would be approving:** a one-fight chapter that leaves out the game's staging.

### 3. Action time as a labelled estimate (E4), together with Split's kit

- **What changes:** every action takes N seconds before the actor's gauge refills. Today the
  engine takes no time for an action. This applies to all FFX-2 chapters (4, 5, 6, XI and XIII),
  not only Trema.
- **Sources:** that the action takes time is sourced (2 sources: the wiki and Split_Infinity).
  **The length is unsourced.** No guide publishes animation lengths, so N would be an estimate
  in your name.
- **Measured (bench, 100 seeds; human speed not run yet):**
  - N = 1.5 s: Trema 71 with Split's kit, 63 to 64 with the Ribbon. Paragon 0. Chapter 0.
  - N = 3 s: Trema 87 with Split's kit, 73 to 74 with the Ribbon. Paragon 0 to 7. Chapter 4 to 5.
- **To build:** 2 to 3 hours, re-benching Chapters 4, 5, 6 and XI, and a deep review because it
  touches shared combat.
- **You would be approving:** a number we chose ourselves, labelled as an estimate. It fixes
  Trema, but it does not fix normal Paragon on its own.

### 4. NightMare185's line-up against normal Paragon (TR10 changes, TR7 stays Normal)

- **What changes:** Dark Knights on Valiant Lustre, each wearing only an Oath Veil and a Crystal
  Bangle, with 99 Megalixirs. One girl throws a Megalixir every turn. The others use plain
  Attacks, never Darkness. It has no Alchemist. For Trema he switches to Three Stars and Soul
  Spring.
- **Sources:** one source ("tested in 10 battles"). The wiki paraphrases it, so it counts once.
  This is the only recorded clear of normal Paragon that does not use Cat Nip.
- **Measured:** not benched. **Our guess, not a measurement:** low (Paragon acts about 4 times a Dark Knight turn).
- **To build:** a bench line from modelled items, 1 to 2 hours (a Dark Knight Rikku needs art).
- **You would be approving:** a different line-up from TR10, backed by a single source.

### 5. Keep Chapter XIII unlisted and ship Omnis, Isaaru and Gippal first

- **What changes:** nothing new. Trema's art (on main) and its engine (on the branch) wait.
- **Sources and measurements:** their own. Their engines are on branches, each with open questions.
- **To build:** each follows the same ship path as Yojimbo, once you answer its questions.
- **You would be approving:** Trema comes later, and three other chapters go ahead now.

## Recommendation: option 1, with option 3 measured in the same run

Split_Infinity's TR10 clear was against Oversoul Paragon. No sourced kit beats normal Paragon here
even with 3 s of action time, so option 1 is the only faithful route past link 1. Trema is only
human-winnable with some action time, so the same run should measure option 3 at 1.5 s and 3 s,
both on the bench and at human speed. Everything stays OFF, and you get the numbers before
anything ships. Chapter XIII stays unlisted until then, so option 5's chapters are not held up.

**Also found (single source, not proposed):** the wiki's figure for Paragon's Normal Attack
suggests every defence-ignoring hit in the engine, the party's Darkness included, is about 5.9 %
low.

## Replies you can send

- "Trema: 1 and 3" (the recommendation: build and measure, ship nothing yet)
- "Trema: 1" / "Trema: 2" / "Trema: 3 at 3 s" / "Trema: 4" / "Trema: 5" (park it; Omnis, Isaaru, Gippal next)
