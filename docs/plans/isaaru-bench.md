# Chapter XIV (Isaaru) — the ship bench, 2026-09-25

**Game case: FFX only** (AGENTS.md rule 14): Yuna alone with her aeons, CTB, Shield, Grand Summon
and the enemy aeons' Overdrive gauges. Nothing here applies to an FFX-2 chapter.

**Measured, never tuned.** Nothing on Isaaru's side changed: his three aeons' numbers, AI, gauges
and Spathi's count are the engine track's (`research/ffx-isaaru-bevelle.md`,
`docs/plans/chapter-isaaru-review.md`). Every row is 200 seeds of the whole three-link chain on the
real engine, carried link to link (HP, MP, gauges, KOs; no healing between links, research §1.2).

- Test: `tests/unit/chapters/isaaru-tactic-bench.test.ts` (the shipped tactic and its variants).
- The engine track's bench (`tests/unit/chapters/isaaru-bench.test.ts`) is unchanged and still
  prints its own rows. Its "intended" line is **25 %**, because it shields only at count 0 or on a
  full gauge. Its "wrong" line is 0 %.

## The rows (200 seeds, chain wins)

| Line | Chain wins | Lost in link 1 / 2 / 3 |
|---|---:|---|
| **Shipped (intended):** Shield read off the CTB order, the fuller of Ifrit or Ixion first on Spathi | **125/200 (63 %)** | 0 / 0 / 75 |
| The sources' order as written (Ixion first on Spathi), Shield read off the CTB order | 98/200 (49 %) | 0 / 0 / 102 |
| Shield only at count 0 or a full gauge (the engine bench's intended line) | 50/200 (25 %) | 0 / 0 / 150 |
| Jegged: Grand Summon Bahamut on Grothia | 124/200 (62 %) | 0 / 1 / 75 |
| *Option:* Shiva knows Blizzara and NulBlaze | 142/200 (71 %) | 0 / 0 / 58 |
| *Option:* Ixion knows Thundara | 135/200 (68 %) | 0 / 0 / 65 |
| *Option:* both | 153/200 (77 %) | 0 / 0 / 47 |

Every battle ends in a victory or a defeat, never a stalemate. The shipped line beats both
variants it was chosen over. Every loss is in link 3, against Spathi.

## Why the shipped line reads the way it does

- **Shield read off the CTB order.** GameFAQs gives the rules as "Shield if Hellfire is coming
  next" and "Shield when the count reads 1". The tactic reads them off the turn order the player can
  see (`predictTurnOrder`). It Shields when Hellfire (a full Grothia gauge; +3 per targeting, +5 per
  attack, §4.1) or Mega Flare (the turn after count 0, §4.3) lands before the aeon acts again.
  - This alone takes the line from 25 % to 49 %.
  - The count-0-only reading misses the turns where Spathi acts twice before a slow aeon.
- **The fuller of Ifrit or Ixion first on Spathi.** The wiki says "Ifrit or Ixion with a full
  gauge", GameFAQs "any aeon but Valefor", and Jegged "Shiva with Blizzara".
  - The tactic sends in whichever of the two carries more gauge, then the other, then Shiva, with
    Valefor last.
  - This takes the line from 49 % to 63 %.
- **Grand Summon on the first summon.** Yuna arrives with a full gauge (B5). Shiva goes first on
  Grothia (wiki + GameFAQs), and Bahamut first on Pterya, to tank her and fill his gauge.
  - Jegged's Grand Summon Bahamut opening measures the same (62 %).

## For Bailey: sourced player-side options (none built into the chapter)

The shipped build gives the aeons Chapter X's rows: no NulBlaze, no Blizzara, no Thundara. The
sources recommend these rows for this fight:

- **Shiva:** Blizzara to heal herself (she absorbs Ice), and NulBlaze against Hellfire. The wiki and
  GameFAQs agree on this (research §6.3, `[verified: 2 sources]`).
- **Ixion:** Thundara to heal himself. This is Jegged's advice (`[single source]`).

No source says whether this save has taught them yet. Adding them would be a build change (a
player-side option; his side is untouched). The tactic already uses these rows if a build offers
them:

- NulBlaze instead of Shield before Hellfire;
- the spell on itself under half HP;
- otherwise the spell at his aeon (§5.4: Shiva's Blizzara 1,573 against her Attack's 449).

Measured: Shiva's rows give 71 %, Ixion's give 68 %, both give 77 %.

**Not proposed:**
- Bahamut's gauge at the start is B3 = b, `[estimate]` 50, and no source gives another value.
- Yuna's gauge is already full (B5).
