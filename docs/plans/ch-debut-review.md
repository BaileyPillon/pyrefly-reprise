# Paper preflight (draft): Chapter 52 (hidden) — The Luca Opener: Logos and Ormi, then Leblanc as the Songstress (FFX-2) — branch `ch-luca-opener`

Paper preflight under `critic/RUBRIC.md` §4 (AGENTS.md rule 15), in the format of `ch-ifrit-review.md` and the wave-3 and wave-4 drafts: a number is read the way its source words it, "sourced" and "our estimate" stay apart, and nothing here invents a game number (rule 6). **Docs only: no code, no build, no render, no ComfyUI, no engine run.** Written 2026-11-09 by a Sonnet sub-agent of the Echoes of Spira driver as the paper preflight of plan row 52 (wave 5, a filler; number 52, word `debut`) from its research note (`re-ffx2-luca-opener.md`, "RE §n" below). It is a **draft**: the driver takes or overturns each pick in section 9. `node tools/critic-plan.mjs` is expected to class the change **DEEP** (the shared registry tables).

**Authority (relayed words, verbatim):** 2026-11-09 ~12:35 EST "Keep going please with everything you were doing finish the wendigo chapter also"; 2026-11-06 "implement all unimplemented chapters please" and "yes on all these too"; 2026-10-31 "you make the executive decisions for the next few days. i'll go with all of your recommendations." Every pick is the planner's recommendation, **"driver's call, his to overturn"**, with the alternative named. Nothing deploys from this document.

**Read:** the research note; `origin/main` bc93b1fdd by `git show` (`src/data/chapter-ffx2-bevelle-guardians.ts`, `chapter-exp-leblanc.ts`, `src/battle/ffx2/ai/syndicate-ormi.ts`, `leblanc-syndicate.ts`, `script-rolls.ts`, `encounters.ts`); Jegged FFX-2 Chapter 1 page 1; the painted art mirror. Nothing was run, so rule 3 is owed by T0.

**Verdict: PROCEED.** The smallest chapter of the program: three tiny scripts, a two-link chain, all art on disk. One open engine question (a two-girl party) gates only the optional concert act.

## 1. Game case and sources

**Game case: FFX-2 only.** Monster rows 130 (Logos), 129 (Ormi) and 131 (Leblanc) of the FFX-2 kernel and their plain-text AI, equal to the compiled workers (RE §1). The Chateau Leblanc fights use other rows and the repo's existing scripts for them; **none is reused and none is touched** (the new ids carry a `luca` prefix). Shared plumbing is "both" (CHK-020) and additive.

**Sources:** the kernel rows and the AI sources (RE §0, §3); Jegged for places and order (RE §2) — one guide, since Gamer Guides has no page for the prologue. **The plan's row 52 corrected by the files:** the opener has a third scene (the concert fight, rows 280, 133, 301, 281) that precedes the two the plan names; Ormi's HP is 45 only when he stands alone; no script has a time-out block; research is done.

## 2. What the player experiences (plain words)

On the docks of Luca, the girls are chased by the Leblanc Syndicate's two lieutenants and then by Leblanc herself, singing in Yuna's gown. The chapter is the three-minute teaching fight of the game, kept as it is.

| Act | Enemies (game rows) | What they do (RE §3) | What it asks of the player |
|---:|---|---|---|
| (0, optional) | the Yuna look-alike (280) and two Goons (133) | she hastes and regenerates the Goons, then casts Thunder | Rikku and Paine only; kill the singer first or the Goons first |
| 1 | **Logos** (130, 86 HP) and **Ormi** (129, 97 HP) | Ormi strikes twice, then throws his shield at the farthest girl; Logos shoots, and throws one Potion at Ormi when Ormi is low | three against two; steal from both |
| 2 | **Leblanc** (131, 130 HP) | three blows, then Thunder on the healthiest girl, for ever | Yuna held to the Songstress and her one command; Darkness (she is not immune) |

**Seams.** One seam between act 1 and act 2 (the party is mended); a story beat in the middle where Yuna gets the Songstress back. **Intent-board lines (our own words, numbers from the files):** Ormi "Two blows, then the shield, at whoever stands farthest." Logos "Two shots. Once, when Ormi is nearly gone, a Potion." Leblanc "Three blows, then Thunder at whoever has most life."

## 3. Engine work

Checked by reading `origin/main` bc93b1fdd.

| # | Item | Why | Size |
|---|---|---|---|
| E1 | `ai/luca-opener.ts` (three scripts: Ormi's Attack-Attack-Pitch cycle with the farthest pick; Logos's pistol and the once-only Potion on Ormi under a fifth of his HP; Leblanc's Attack-Attack-Attack-Thunder with the MP gate and the max-HP pick) | RE §3.1 to §3.3; modeled on `ai/syndicate-ormi.ts` | 1.5 h with a script test |
| E2 | enemy defs `x2-luca-ormi`, `x2-luca-logos`, `x2-luca-leblanc` (+ the shield and fan props), ability rows (Attack, Pirouette Pitch, 1H Pistol, the weak Potion, Thunder, the "speak and fall" death row), monster records and fixture `luca_opener_rows.json` | RE §0, §4 | 1.5 h |
| E3 | `SCENES.lucaDock` (the girls at (21,0,0), (24,0,12), (24,0,-12); Ormi at (-27,0,-12), Logos at (-27,0,9), Leblanc at (-27,0,0)) | RE §0 | 0.3 h |
| E4 | Ormi's "alone: 45 HP" rule | RE §3.1: **not ported** (it only applies to a test formation); a test pins the real value 97 | 0 |
| E5 | **optional act 0:** the look-alike's script (Absorb under 80 MP; Ecstasy on the Goons; two Thunders; upkeep) and the Goon rows; **a two-girl party** | RE §3.4 | 1.5 h + check |

**Exists and is enough:** the chain loop, the hidden-chapter door and results scaffolding, two-hit rows, item use by a monster ally (the Syndicate's goons), the Songstress dressphere with Darkness Dance (`yuna-songstress`). **To check (T0):** that the chain can hold a **two-girl party** for act 0; that a Songstress can be held to one command by the prep (the game does it in an event). Shared hot spots are the wave's integrator commit.

## 4. The party

**Recommended (LO2):** a new `lucaOpenerBuild` (`src/data/ffx2/builds/luca-opener.ts`): Yuna a Gunner for act 1 and held to the Songstress for act 2, Rikku a Thief, Paine a Warrior; owned: Gunner, Warrior, Thief, Songstress; no Black or White Mage (they arrive after Boris and the Flame Dragon: row 51). **Levels `[estimate]` (no source below the Chapter 2 preset's 23/24/25 and the engine's Lv 20 anchor): a starting guess of Lv 2/2/3**, measured. Bag: a few Potions and Phoenix Downs, `[estimate]`. **Why:** the Chapter 1 builds are new for this program (row 51's `chapter1Build` is its sibling); the Luca build is that build before any levelling. **Alternative (LO3):** reuse row 51's build (a stronger party, a measured what-if, and then the fight is trivial).

## 5. The arena

No Luca plate exists. **Recommended (LO4):** `leblanc-last-room` (the Leblanc chapters' stage; Leblanc stands there already) as a flagged stand-in for the docks; **alternative:** `ffx2-djose-chamber-standin` (the Valefor and Ifrit chapters' stand-in), or a new painted plate "luca-docks" (one plate, about 3 h of art, and Bailey looks first).

## 6. New art needed

| Piece | Reuse | Count |
|---|---|---|
| Logos, Ormi, Leblanc | `logos`, `ormi`, `leblanc` (and `exp-leblanc-*`) exist | 0 |
| Props: Ormi's shield, Leblanc's fan | optional; the paintings carry them | 0 |
| Party | the Chapter 1 dress paintings exist | 0 |
| **Act 0 only:** the Yuna look-alike | `leblanc` in the Songstress gown (derive from `yuna-songstress`'s costume by the shade method) | 4 poses, optional |
| Goons (act 0) | `ffx2-dr-goon`, `ffx2-fem-goon` | 0 |
| Plate | `leblanc-last-room` | 0 (one optional) |

**Direction:** painted 2.5D from the approved pipeline (no 3D). The plan's "art all exists" stands for acts 1 and 2.

## 7. Presentation and music

The Valefor chapter's HUD; nothing new. **Music** (rule 13): stand-ins `boss-leblanc` (the Syndicate chapters' brass-and-funk cue), `victory-ffx2`, field bed `scene-chateau-leblanc`; no new cue. **Story:** our own words, three short beats (pre, the Songstress hand-back between the acts, post), `research/writing-bible.md`, the game's tone for its own first fights.

## 8. The winnability method, open questions, review class

**Method (measure, never tune):** a vitest bench, advisor and naive lines, Wait and Active clocks, 200 seeds at bench speed and 40 at human speed, party levels Lv 1 to 6. Report win rate, KOs, Potions thrown, engine seconds. The sourced difficulty is "very easy" (Jegged, both acts); if a row is far out, the lever is the party, never a boss number.

**Open items (RE §7):** the girls' levels (U1, estimate); the two-girl party (U2); how the game holds Yuna to one command (U3).

**Review class: DEEP** (shared registry tables). The save-data class is not touched (hidden chapter, the experiments' own store). One release per wave: focused review before, deep after on the live build.

## 9. Build order, tracks, and the decisions (recommended picks; the alternative named)

| Track | Work | Hours |
|---|---|---:|
| T0 | engine checks by running it: the two-girl party, the Songstress hold, a monster ally's Potion | 0.5 |
| T1 | data: three defs, props, six ability rows, records, fixture, group chain | 1.5 |
| T2 | `ai/luca-opener.ts` and its script test | 1.5 |
| T3 | chapter record (id `ffx2-luca-opener`, game `ffx2`, number 52, title "The Luca Opener"), meta, results, `lucaOpenerBuild` | 1.5 |
| T4 | prep tip, guide page, tactic, sensor texts, door row (typed word `debut`, number 52) | 1 |
| T5 | story beats (our words) | 0.5 |
| T6 | art | A0 (act 0: A3) |
| T7 | the bench and tests, handoff note, `CHANGELOG`; the integrator's tables are not this lane's | 2.5 |

**Total: R0.5 B6.5 A0 I2.5 = 9.5 h `[estimate]`** (the plan priced 14; the research is spent in the note and the art is on disk). With act 0: +1.5 h data/AI and +3 h art = 14 h. Counted the way the Ifrit and Cup chapters counted.

| # | Decision | Recommended | Alternative |
|---|---|---|---|
| LO1 | Scope | **the plan's two acts** (Logos and Ormi, then Leblanc) with the party mended between | **three acts with the concert fight as act 0** (+4.5 h, one painting, needs a two-girl party) |
| LO2 | Party | new `lucaOpenerBuild`, Lv 2/2/3 `[estimate]`, measured | row 51's `chapter1Build` (a what-if) |
| LO3 | Songstress hold | the prep sets Yuna to the Songstress with Darkness Dance for act 2 | leave her free (a different fight) |
| LO4 | Arena | `leblanc-last-room`, flagged | `ffx2-djose-chamber-standin`; a painted docks plate |
| LO5 | Ormi's lone-45 rule | not ported (test formations only) | port it (no scene uses it) |
| LO6 | Music | `boss-leblanc`, `victory-ffx2` | none needed |
| LO7 | Id, number, word | `ffx2-luca-opener`, **52**, **`debut`** (re-checked 2026-11-09 against the 29 words on `origin/main` bc93b1fdd and the words the program plan reserves: ok) | `luca` (its last letter `a` starts `angra`: fails the rule) |
| LO8 | Rows | 129 to 131 (the opener's own) | rows 241 to 253 (the Chateau set; a different chapter) |

## 10. Size and risks

1. **Nothing here is hard;** the risk is over-building a three-minute teaching fight. Keep the intent board to one line each.
2. **A two-girl party** may not exist in the chain loop: act 0 depends on it.
3. **Overlap with the Leblanc chapters:** the card text may point at this chapter (the plan's note); no code is shared.
4. **Shared tables** conflict with the other wave lanes: the integrator's job.

## Corrections and findings

1. The "opener" has a third, earlier fight (the concert); recommended as an optional act 0.
2. Ormi stands at 97 HP in the real scene; the 45 is a lone-test value.
3. The scripts carry no "battle too long" block.
4. Rows 129 to 131 (Lv 2, 2, 5) and rows 241 to 253 (the Chateau and Floating Ruins Syndicate) are different records of the same people.
