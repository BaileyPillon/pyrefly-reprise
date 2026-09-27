# Ixion at Djose Temple (FFX-2): three chapter concepts, rough (2026-09-27)

**Nothing here is built or wired.** Nothing under `src/`, `tests/`, `public/art/`, `critic/` or
`docs/target/` was touched. This is the first rung of Progressive Target Resolution (written
concepts plus one rough layout frame each) for the chapter Bailey accepted on 2026-09-27
(item 24 of the driver's list, decision D-252; recommendation sheet
`docs/plans/next-content-2026-09-27.md`, Chapter B). Each concept needs Bailey's pick before
anything more is made (AGENTS.md rules 9 and 10). A pick approves only the parts Bailey names (rule 15).

**Game case (rule 14): FFX-2 only.** Everything here is the FFX-2 Ixion (ATB, dresspheres, the
fallen-aeon action counter). The FFX Ixion shares a name and two move names, and nothing else
(research §0 and §10 IX-2). Nothing here applies to any FFX chapter.

**Research:** `research/ffx2-ixion-djose.md` (commit `cd88a3f9`). Every number below is quoted
from it with its tag; nothing new was sourced for this page.

## Phone sheet (read in order; each part under 1 MB, 1080 px wide, under 2000 px tall)

1. `sheet/part-1-overview.jpg`: the three concepts in one screen, the recommendation, what is asked
2. `sheet/part-2-concept-a.jpg`: A, frame plus the six lines
3. `sheet/part-3-concept-b.jpg`: B
4. `sheet/part-4-concept-c.jpg`: C
5. `sheet/part-5-paintings.jpg`: the paintings each concept needs

The 1600x900 frames are in `frames/`. Scripts (`scripts/frames.py`, `scripts/sheet.py`) rebuild
everything from the repo root; they read the local `public/art` paintings.

**What the frames are.** Rough greybox layouts, stamped ROUGH LAYOUT. They are made from our own
paintings, used as stand-ins: the Macalania Temple plate recoloured to stand for the Djose Chamber;
the FFX Ixion painting (shipped by D-089) for the FFX-2 Ixion; the Chapter 5 Farplane washed white
for the Abyss; approved portraits of Baralai, Nooj and Gippal; grey blocks for machina scrap and the
Al Bhed. None of these is Djose art, and none is a proposal for how Djose should look. The HUD is a
greybox of the FFX-2 ATB layout the shipped FFX-2 chapters use (positions only; the party bars carry
no numbers). There are no retail images, and nothing was downloaded.

## The facts all three share

- Ixion, Lv 28, **HP 12,380** `[verified: 8 sources]`; absorbs Lightning, weak to Water, immune to Gravity; Breaks and Slow land `[verified: 4 sources]`.
- The loop: two turns of Normal Attack or Thundara on the whole party (3/4 : 1/4, **our estimate**, F-8), then Aerospark, **5/8 of current HP** `[verified: 3 sources]`.
- The action counter: +5 per action, +10 for Aerospark, +5 each time he is hit; at 100 he casts **Recharge (+200 HP, +200 MP)**, and **Thor's Hammer is his next action** `[verified: 3 sources]`. The game shows no counter; the "Recharge" name is the only warning.
- After the win he rises and charges, and Yuna goes into the hole where the fayth stood `[verified: 4 sources, 1 dissent]`. The Abyss beats (research §7.2) are each sourced 3 or more times; the dialogue is not (IX-13), so ours is written separately.

## Concept A: The Horn and the Hole (one link, then a short scripted close) — recommended

Frame: `frames/a-horn-and-hole-1600.jpg`

- **Plays:** one fight in the Chamber of the Fayth, the hole in view the whole time. His loop is fixed, and the only warning is the game's own "Recharge" banner; the player spends the turns before Thor's Hammer on Shell and healing.
- **Close:** he rises and charges, Yuna falls. A short cutscene over one Abyss plate: Shuyin calls her Lenne, the embrace, he is Baralai, Nooj and Gippal hand over Crimson Spheres 2 and 3 and go after him. "I'm all alone." Then a playable beat: press to whistle four times, a light leads her out. A card: she wakes in the Bevelle Underground (the approved Chapter 4 plate).
- **Teaches:** read a fixed cycle and its tell; Water hurts him, Lightning heals him.
- **Faithful:** the research's own recommended shape (§1.3). The counter stays hidden, as in the game. The whistle as a playable beat is research Q5 (a).
- **Cost:** engine small (Chapter XI's counter in `src/battle/ffx2/ai/fallen-aeons.ts`, a three-step cycle, Recharge as a flat 200 / 200; the whistle as a story step). Art medium, about 6 new subjects.
- **Risks:** the Lv 30–36 party is our estimate (IX-14), so the fight may be too easy until the bench says otherwise. The Abyss plate must not read as the Chapter 5 Farplane. The whistle must feel like a moment, not a quick-time test.

## Concept B: The Storm Gauge (the fight made readable; the chapter ends on the fall)

Frame: `frames/b-storm-gauge-1600.jpg`

- **Plays:** the same fight, but the hidden counter is shown: sparks climb Ixion's horn, and 20 pips (5 points each) fill under his name bar. At 100, Recharge, then Thor's Hammer.
- **Close:** none past the fall. The last frame is Yuna going over the edge, then the chapter card. The Abyss is held for a later chapter's prologue.
- **Teaches:** the counter itself, and a real trade-off it creates: every hit adds 5, so hitting harder brings the Hammer sooner. Ixion alone adds 20 per three-turn cycle `[derived]`.
- **Faithful:** the numbers do not change, but the readout is ours. It would ship as a switch, like the move advisor. It drops the scene the research calls the reason to make the chapter.
- **Cost:** the lowest art (Ixion and the Chamber, plus horn effects); a new HUD element, which needs its own mockup round.
- **Risks:** an invented readout on the "faithful core"; a cliffhanger with no payoff until some later chapter; it teaches our HUD rather than the game's tell.

## Concept C: Two Rooms and the Abyss (antechamber fight, walkable Abyss)

Frame: `frames/c-two-rooms-1600.jpg`

- **Plays:** Blackestmage's reading of the room (IX-4): at the top of the stairs Ixion is attacking two Al Bhed `[single source]`, and the fight happens in the antechamber. After the win the girls walk into the Chamber, and the charge and the fall happen at the hole.
- **Close:** the Abyss as a small walkable 2.5D diorama, because the game hands back control there (research §7.2 step 10): Yuna walks a floating path, Shuyin comes out of the fog, the embrace locks her input (she cannot move: the Ultimania, via Ryu_Kaze `[single source]`), Baralai is revealed, she kneels alone, and each whistle lights a quarter of a yellow bridge (bremen `[single source]` for the bridge). After four she runs across.
- **Teaches:** the same fight lesson; the whistle becomes an ending the player performs.
- **Faithful:** closest to the scene's shape, but the room is the minority reading (1 source against 3). A Steam HD session with a Chapter 3 save would settle it.
- **Cost:** the highest. Walking is a new system (today the game is battles and cutscenes), plus two temple plates, a layered Abyss, bridge effects, two Al Bhed, full-figure Baralai, Nooj and Gippal: about 12 subjects.
- **Risks:** a movement system means a deep review and scope creep, for one scene.

## Recommendation

**A.** It keeps the fight's one clean lesson (the Recharge warning, as the game shows it) and the
scene that is the reason to make the chapter, at a small engine cost and about 6 new paintings.
B trades the payoff for an invented gauge; C buys a walking system for one scene. If Bailey likes
B's gauge, it could sit on A as a switch, off by default, but that is a separate question and nothing
is built on it without a yes. `[estimate]`: this is an agent's judgement, not a sourced fact.

## Paintings the chapter would need

| Subject | Concepts | What exists, what is new |
|---|---|---|
| Ixion, FFX-2 version: idle, charge, cast (Thundara, the Recharge glow), Thor's Hammer | A B C | Look is research Q6: the FFX painting as it is (idle, attack, overdrive on disk, shipped by D-089), the house violet "possessed" look (not canon, F-12), or machina-fused (FFExodus only, IX-8). "As it is" costs almost nothing. |
| Djose, Chamber of the Fayth: lightning-held stone, statue torn out, the hole, Machine Faction gear | A B C | New. |
| Djose antechamber: top of the stairs, the door to the Chamber | C | New. |
| The Farplane Abyss: a white, foggy void | A C | A: one plate, or Bailey's yes to reuse the approved Chapter 5 Farplane. C: layers for a path and the bridge. |
| Yuna, Songstress: falling and kneeling (C adds walk and run) | A C | New poses. Attack, cast, dance, item, KO and victory are approved; the idle is on disk. |
| Shuyin with Yuna, the embrace (one still) | A C | New. Shuyin's idle and portrait are approved. |
| Baralai, possessed | A C | A: the approved portrait. C: a full figure (only the translucent shade exists). |
| Nooj and Gippal | A C | A: portraits (Gippal's approved; Nooj's on disk, not in the approved list). C: full figures (only shade art exists). |
| The spirit light that leads her out | A C | New: a glow effect or a small painting. |
| Two Al Bhed of the Machine Faction | C | New. |
| Bevelle Underground (where she wakes) | A C | The approved Chapter 4 plate, reused. |
| The party (Dark Knight, White Mage) | A B C | On disk for all three girls; Samurai only for Paine (idle). |

Counts: A about 6 new subjects, B 2 plus horn effects, C about 12. Each new subject gets a pilot at
1:1 before any batch (rule 8: original art only). Music is Bailey's call by ear (rule 13): the game
plays "Aeons" in this fight `[single source]`; our original FFX-2 aeon cue ("Static Coronation")
could serve, and the Abyss would need a cue of its own.

## What Bailey is asked

1. **A, B, C, or a mix** (name the parts you want).
2. **Ixion's look (research Q6):** the FFX painting as it is, violet "possessed", or machina-fused.
   The research advises looking at the wiki's battle picture first (read only) before a painting round.

The four smaller open questions stay in research §9, each with a lean: Thor's Hammer's element
(Q1, lean non-elemental, our estimate), the fight's room (Q3, lean the Chamber, which A and B use),
what counts as a hit (Q4, lean Chapter XI's FA8 a), and the whistle (Q5, lean a playable beat, which A and C use).

## Next rung, after the pick

Per Progressive Target Resolution: drop the rejected concepts, then 2 to 4 purpose-built mockups
for the picked one only (the research names three moments: the Recharge warning, the Thor's Hammer
frame, Yuna's fall), a painting pilot for the FFX-2 Ixion and the Chamber, and a music sketch in
`docs/audio/audition.html`. Record liked / disliked / must remain / must change / undecided in the
tile's `reaction`.
