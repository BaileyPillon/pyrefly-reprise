# FINAL FANTASY X-2 — Gippal at the Den of Woe

**Target project:** Pyrefly Reprise
**Request:** Bailey, 2026-09-24 ~21:50 EDT: "I'll also add Isaaru's contest of aeons at Beville [Bevelle] and Gippal, in the Den of Woe as two additional chapters in addition to the ones I selected already" (the other two being Seymour Omnis and Trema, researched separately). This file is the Gippal/Den of Woe half.
**Research date:** 2026-09-24
**Game case (AGENTS.md rule 14):** **FFX-2 only.** ATB, dresspheres, Garment Grids, Creature Creator capture — none of this is FFX data. The Den of Woe does not exist in FFX. Nothing here transfers to an FFX chapter.
**Status:** Research only. No chapter is scheduled or built (AGENTS.md rule 9). See §4 for the options this needs from Bailey before any preflight or build begins.

---

## 0. Sources

Read through the Final Fantasy Wiki via `https://finalfantasy.fandom.com/api.php?action=parse&page=<Title>&prop=wikitext&format=json` (browser, 2026-09-24):

| Page | Revision id |
|---|---|
| Den of Woe | 3797694 |
| Gippal (boss) | 3956604 |

Not yet read: the individual Rikku (boss), Paine (boss), Baralai (boss) and Nooj (boss) pages, or a second (GameFAQs/GamerGuides-class) source for Gippal's stat block — needed before a preflight, per this repo's usual two-source standard (see `research/ffx2-trema.md` §0.1). Everything below is `[single source: wiki]` until cross-checked.

## 1. What "Gippal in the Den of Woe" actually is

Bailey's framing names one boss, but **Gippal is one duel inside a five-fight gauntlet**, not a standalone encounter — this needs stating plainly before scoping, the same way the Trema research corrected "one boss" to "two bosses in a row" (§1.1 of that file).

- **Where:** the Den of Woe, a sealed cave in the Mushroom Rock Ravine (Mushroom Rock Road). It is where Shuyin's spirit has lingered for 1,000 years; the pyreflies there carry his hatred and act on their own. **Optional dungeon**, required for 100% completion, not for the main story.
- **The frame story:** during Operation Mi'ihen (the FFX-era battle against Sin, told in flashback via Crimson Spheres), Maester Wen Kinoc sent Crimson Squad candidates into the den under cover of a final entrance test, actually to investigate rumored visions of a giant machina. Shuyin's spirit possessed the candidates and made them slaughter each other; only **Nooj, Baralai and Gippal**, with their sphere recorder **Paine**, escaped. Kinoc, covering up the failure, ordered them executed; they fled instead, and Kinoc had the den sealed.
- **How the Gullwings get in (two years later, Chapter 5):** they find Leblanc's henchmen Ormi and Logos trying to force the sealed door and pick up a dropped Crimson Sphere — part of the set Paine recorded. Collecting all ten Crimson Spheres (scattered around Spira, some permanently missable) unlocks the door.
- **Inside:** random encounters against Crimson Shadow (singly, then x2, then x3) on the way to the center, then, **without a break between fights**, a five-boss chain: **Rikku → Paine → Baralai → Gippal → Nooj**. These are not the real Rikku/Paine, but illusions Shuyin's possession of the pyreflies conjures — the first two fights are literally against a possessed Rikku and Paine (Shuyin shows Yuna his and Lenne's deaths mid-sequence), then Shuyin summons illusions of Nooj, Baralai and Gippal for Yuna to fight through. In the original release the first two duels are Yuna alone; International/HD Remaster let captured Creature Creator fiends stand in. Clearing the gauntlet frees Rikku and Paine from possession and the trio escapes.
- **Gippal's place in the chain:** fourth of five, immediately after Baralai and immediately before Nooj — "recover the party as best as possible" before him is the wiki's own strategy note, because Nooj follows with no break.

## 2. Gippal (boss) — Den of Woe stat block `[single source: wiki]`

| Field | Value |
|---|---|
| Level | 56 |
| HP | 14,800 |
| MP | 235 |
| Strength / Magic | 73 / 55 |
| Defense / Mag. Defense | 68 / 33 |
| Agility | 118 |
| Evasion / Luck | 23 / 6 |
| EXP / AP / Gil | 1,200 / 5 / 5,000 (steal gil 15,000) |
| Abilities | Bullseye, Flash Bomb, Grinder, Hush Grenade, Mortar (his unique Blue Bullet), Potion Plus |
| Common/rare drop | Kaiser Knuckles x1 (both) |
| Common/rare steal | White Lore x1 (both) |
| Immunities | Gravity, Death, Petrify, Sleep, Silence, Darkness, Poison, Confuse, Berserk, Curse, Eject, Slow, Stop, Doom, Delay, Interrupt, Multi-attack, Bribe |

**Attacks, per the wiki's battle notes:**
- **Grinder** — physical, ignores Defense, 509–574 HP.
- **Mortar** — 140-degree fan hitting all characters in it, ignores Defense, 800–904 HP. This is his signature Blue Bullet ability (Gippal is the only enemy in the game to use it).
- **Bullseye** — same fan-hit pattern as Mortar but deletes 9/16 (56.25%) of affected characters' remaining HP instead of a flat number.
- **Flash Bomb** / **Hush Grenade** — 46–52 HP plus Darkness / Silence respectively.
- **Potion Plus** — self-heal, 600 HP.

**Suggested approach (wiki, not this repo's own tactics — flag as flavor, not a balance target):** open with a Light Curtain for party-wide Protect; carry Mega-Potions/Mega Phoenixes/Remedies; lean on heavy physical damage (Dark Knight's Black Sky specifically named) and, since his Magic Defense is comparatively low, strong magic (Flare/Ultima, Meteor only via a captured creature); heal to full before he falls since Nooj follows immediately.

There is also a **Fiend Arena** version of Gippal (Level 72, HP 134,700, a completely different, much larger stat block, fighting with machina instead of magic per its scan text) — the wiki is explicit these are separate fights with separate data, the same caution `ffx2-trema.md` gives for its own Fiend Arena rematch. **Do not mix the two.** The Den of Woe fight is the one Bailey named.

## 3. Never-invent-data check (AGENTS.md rule 6)

Every number above is sourced to the wiki citation in §0 and unverified by a second source — mark it `[single source]` in any preflight until cross-checked, the way this repo's convention requires. Nothing here was estimated. Rikku/Paine/Baralai/Nooj stat blocks were not pulled this pass; they are needed before scoping the full five-fight chain and should come from the same wiki API method plus a second source.

## 4. Options for Bailey (nothing built — AGENTS.md rules 9 and 10)

The corrected scope (a five-boss chain, of which Gippal is one link) raises the real design question: is the chapter Gippal alone, or the whole gauntlet? Three framings, nothing built yet:

- **A — Gippal only:** treat this as a single boss chapter like the others (Trema, Seymour Omnis), starting the player at full HP/MP against just the Gippal illusion, skipping Rikku/Paine/Baralai/Nooj and the frame story. Smallest scope, but breaks from the source (in-game he's never fought in isolation) and loses the "no breather" tension that's the encounter's real character.
- **B — The full five-link chain:** Rikku → Paine → Baralai → Gippal → Nooj as one continuous chapter with carried-over HP/MP/status, the way the approved Trema plan chains Paragon into Trema. Truest to the source and to this project's own precedent for chained bosses; needs all five stat blocks researched and sourced first, and is the biggest of the two options.
- **C — Gippal-centered but bookended:** open on Baralai's defeat (a short recap or a skipped-to state) and close right after Gippal falls, framing it as "the gauntlet's hardest middle stretch" without committing to animating Rikku/Paine's possession or the Shuyin/Lenne vision scene, which carries story weight (Shuyin, Lenne, the Vegnagun material already researched in `research/ffx2-vegnagun-shuyin.md`) that may deserve its own treatment rather than being folded in here.

None of these should be built, storyboarded, or sent to ComfyUI until Bailey names a pick (or a mix) and what must remain/must change (AGENTS.md rule 9; Progressive Target Resolution in `~/.claude/CLAUDE.md`). Option B is the only one that needs the other four bosses' data before it can even be scoped — that research has not been done yet and should wait for Bailey's pick.
