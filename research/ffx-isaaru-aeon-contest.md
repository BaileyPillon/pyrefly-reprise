# FINAL FANTASY X — Isaaru's contest of aeons, Via Purifico (Bevelle)

**Target project:** Pyrefly Reprise
**Request:** Bailey, 2026-09-24 ~21:50 EDT: "I'll also add Isaaru's contest of aeons at Beville [Bevelle] and Gippal, in the Den of Woe as two additional chapters in addition to the ones I selected already" (the other two being Seymour Omnis and Trema, researched separately). This file is the Isaaru half.
**Research date:** 2026-09-24
**Game case (AGENTS.md rule 14):** **FFX only.** This fight happens during Yuna's original pilgrimage, inside the Via Purifico beneath Bevelle, well before Sin's death. It uses FFX's CTB battle system, FFX Aeons and FFX Overdrives — none of it is FFX-2 data (ATB, dresspheres, Garment Grids). Nothing here transfers to an FFX-2 chapter.
**Status:** Research only. No chapter is scheduled or built (AGENTS.md rule 9: options before anything perceivable is built). See §4 for the options this needs from Bailey before any preflight or build begins.

---

## 0. Sources

Read through the Final Fantasy Wiki via `https://finalfantasy.fandom.com/api.php?action=parse&page=<Title>&prop=wikitext&format=json` (browser, 2026-09-24). Page title and revision id recorded for each:

| Page | Revision id |
|---|---|
| Isaaru | 4026440 |
| Isaaru (Final Fantasy X boss) | 3963146 |
| Grothia | 3979432 |
| Pterya | 3979322 |
| Spathi | 4005169 |
| Via Purifico | 4034460 |

No other source was consulted for this pass (single-source wiki data only — see confidence tags below). Before any build, cross-check the stat blocks against a second source (GameFAQs enemy dump, e.g. the ranked FFX sources already used in `research/ffx-seymour-omnis.md` or `research/ffx-yunalesca.md`) the way every other research file in this repo does; that did not happen yet, so every number below is `[single source: wiki]` until it does.

## 1. What the encounter actually is

This is **not a fight against Isaaru** in the normal sense. Isaaru has HP 10 / MP 1 and is flagged "can only be fought by aeons" and immune to Sensor/Scan — he is a script trigger, not the target. The real battle is **Yuna's aeons against Isaaru's three aeons, one after another, with no fight against Isaaru himself.**

- **Where:** Via Purifico (Land) — the underground maze section beneath Bevelle, reached after Yuna, Lulu, Kimahri and Auron are sentenced there for treason (killing Seymour, conspiring with the Al Bhed) and split from Tidus/Wakka/Rikku, who are separately fighting through the sewers to Evrae Altana.
- **Who fights:** Yuna's party reaches the last room of the maze and finds Isaaru blocking the exit, "assigned to deal with the traitors." Yuna and Isaaru have each other's respect (he knelt to her as a senior summoner's daughter at Djose earlier in the game) but he is still bound by his orders. **Only aeons can act in this fight** — this is the one point in the game where the on-screen party leader is someone other than Tidus.
- **The three duels, in order** (each aeon uses the same kit as the matching player Aeon and cannot be answered by summoning that same Aeon — "two aeons of the same type cannot fight each other"):
  1. **Grothia** ("Fist" in the HD PS3 release) — Isaaru's Ifrit. HP 8,000 / MP 600. Absorbs Fire, casts Fira instead of Ifrit's usual Meteor Strike, starts with a full Overdrive gauge and uses Hellfire when it refills (+5% per attack he lands, +3% when he is hit). Does not heal itself.
  2. **Pterya** ("Wing") — Isaaru's Valefor. HP 12,000 / MP 1,000. Uses Sonic Wings and Energy Ray; Overdrive gauge fills faster (+10%/+15%) and empties into nothing named on the wiki beyond her kit — recommended answer is Bahamut's Mega Flare.
  3. **Spathi** ("Sword") — Isaaru's Bahamut, the hardest of the three. HP 20,000 / MP 1,500, flagged "Tough," and the only one worth AP/gil (6,000 AP / 6,000 gil on overkill — the other two give 0). Mostly holds still on a 5-turn Countdown to Mega Flare rather than attacking normally; the wiki's advice is to Shield through the Countdown and answer with Ifrit or Ixion.
  4. Once Spathi falls, Isaaru concedes, reveals the way out, and the party moves on — no fourth fight, no loot from Isaaru himself.
- **Payoff:** the scene is the one time in the story where "your Aeons against mine" plays out literally — a mirror match against a rival summoner's line-up rather than a monster. Isaaru's brothers Maroda and Pacce (his guardians) are not present in this fight; he faces Yuna alone. Two years later, in FFX-2, an older and aeon-less Isaaru resurfaces at Zanarkand working for Cid, which is outside this fight's scope but is useful color for any pre/post-battle text this chapter might carry.

## 2. What would need engine support that the other four chapters may not already have

This is the one genuinely new mechanical shape among Pyrefly's chapters, and it is why it needs options before anything is built, not just art:

- **Aeon-only combat.** The player's human party does not act; Yuna summons and the fight proceeds as Aeon vs. Aeon. Depending how far `src/battle/ffx` already models Aeons as controllable units (check `src/battle/common`, `src/battle/ffx`, `research/ffx-combat-core.md` before scoping), this could be a straightforward reuse of the existing Summon/Overdrive machinery with the human commands hidden, or it could need new engine surface. This needs an engine read before any preflight, separate from this art/story research pass.
- **A same-element mirror match.** Grothia/Pterya/Spathi are stat-and-kit clones of the player's own Ifrit/Valefor/Bahamut with the "can't summon the mirror" rule layered on. That rule (a UI-visible restriction, not just an AI behavior) is new to Pyrefly if nothing like it exists yet.
- **Sequential 1-vs-1-vs-1 boss chain with no healing/party-swap between links**, similar in shape to the Paragon → Trema chain already researched (`research/ffx2-trema.md`), but this one is entirely Aeon-driven rather than human-party-driven.

## 3. Never-invent-data check (AGENTS.md rule 6)

Every stat above is sourced to the wiki citations in §0 and is unverified by a second source — flag it in any preflight as `[single source]` until cross-checked. Nothing was estimated or guessed. If a second source disagrees, record the conflict the way `ffx2-trema.md` §10 does before building.

## 4. Options for Bailey (nothing built — AGENTS.md rules 9 and 10)

This chapter needs a design decision before any mockup, because the source fight has almost no combat drama for the human party (they don't act) and no environment change (same maze room) — the encounter's whole identity is the "whose Aeon wins" premise. Three framings, cheap to describe, nothing built yet (Progressive Target Resolution — start here, then raise fidelity on whichever one or mix Bailey picks):

- **A — Faithful vignette:** exactly what the game does. Aeon-only commands, the maze backdrop, three short duels back to back, no twist. Lowest risk, lowest novelty; safest first FFX "duel" chapter.
- **B — Framed as a rivalry beat:** same three duels, but the pre/post text leans on Isaaru and Yuna's mutual respect (his Djose bow, his "since I was a child I've always looked up to Lord Braska" line) so the chapter reads as two summoners' philosophies colliding, not just a gate to unlock. Same engine ask as A, different writing/VO emphasis.
- **C — Full escape sequence:** bundle in the maze traversal (finding Lulu/Kimahri/Auron) before the three duels, so the chapter is "escape Via Purifico" rather than just the boss room. Bigger scope, more art (maze corridors) and more engine surface (exploration, not just battle), but closer to the source's actual chapter shape and would parallel how the existing five chapters are staged around a location, not just a fight.

None of these should be built, storyboarded, or sent to ComfyUI until Bailey names a pick (or a mix) and what must remain/must change, per AGENTS.md rule 9 and the "raise the fidelity of the choices" ladder in `~/.claude/CLAUDE.md`. The engine question in §2 (how much of Aeon-only combat already exists) should be answered before estimating cost for any of the three.
