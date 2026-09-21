# Interactive learning site: three end-state options

> ## BAILEY'S VERDICT (2026-09-21): ALL THREE APPROVED, BUILD ALL THREE AS SEPARATE SITES
>
> Bailey's own words, in order, all on 2026-09-21:
> 1. On seeing the three directions described: **"A, B, C all separately please but please be
>    mindful of delegation here so we dont waste so many tokens and usage"**
> 2. On seeing the nine frames below: **"yes commit it, all three looks are good  where can i
>    actually view these websites?"**
> 3. Later the same day: **"Links to all 3 websites please?"** (Bailey wants the sites to exist
>    and be openable; the only way to satisfy this is to build them.)
>
> So the nine frames in this folder are the **approved targets** (recorded as nine approved tiles
> in `docs/target/targets.json`, group `learning-sites`). What Bailey named: the look of each
> site as shown on its frames, and that the three are separate sites. The build plan is
> `docs/plans/learning-sites.md`; the pages live under `learn/atlas/`, `learn/studio/`,
> `learn/exploded/`. Everything below this box is the options round as it was presented,
> kept for the record: where it says "nothing is built" or "pick one", the box above wins.

**For Bailey. Pick one, or name the parts you want from each. Nothing is built.**

Start with **[`sheet.png`](sheet.png)**: all nine frames on one page, a row per option,
the same three moments left to right (slider at 0%, at 55% with one piece selected, at
100%). Then open the full-size 1600×900 frames of whichever row interests you. The
written notes are in [`options.json`](options.json), five lines per frame.

Two things to know before you read on:

- `docs/plans/learning-sites.md` records that, shown these three as written directions,
  you answered *"A, B, C all separately please"*. If that still holds, read this round as
  three separate approvals: does each frame show the site you want, and what must change.
  If seeing them at this fidelity changes your mind, pick one or mix.
- "Nothing is built" means nothing you can see. Another track has started the non-visual
  plumbing that plan describes (`learn/shared/`: five pure modules with tests). There is
  no page, no look and no layout yet, and none should exist until you have answered here.

## The reference

You asked for the "interactive learning websites" in Riley Brown's video adapted to this
project: **Human Atlas** and **Model X Studio**, both by Ashe Magalhaes. Both were opened
and used first-hand; what they do is written up in [`REFERENCE.md`](REFERENCE.md). The
short version: one object on a lit stage, a parts list on the left, and one big slider
that pulls the object apart, first into floating pieces, then into a flat grid of every
piece. Click any piece and a card says what it is, in plain words, with its source.
**We take that interaction pattern only.** No code, model, icon, text or layout is copied
from either site. Our pieces are paintings, cards and layers, not 3D meshes.

## The three

| | Option | What it takes apart | What you learn | Look |
|---|---|---|---|---|
| **A** | [Pyrefly Atlas: the bosses, taken apart](a-boss-atlas/) | A boss. Here Vegnagun with Shuyin, chapter V: 12 parts, their moves, statuses, immunities, turn patterns and rewards (119 pieces). | What the boss is made of, which pieces are dangerous, and how to answer each one, with a "Fight this chapter" button on the card. | Light and clinical, as Human Atlas |
| **B** | [Pyrefly Studio: one turn, taken apart](b-battle-studio/) | One turn of battle. Here Tidus attacks Seymour Flux, chapter I, in eight rule steps played by the game's own engine (137 rules). | Why a fight behaves as it does: why a fast character gets more turns, what a command costs in time, how the number is worked out. | Dark studio, as Model X |
| **C** | [Pyrefly Reprise, exploded: the game, taken apart](c-scene-exploded/) | One finished frame of the game. Here Lady Yunalesca, chapter II: painted layers, the HUD, the engine, the presenter, the sound (377 pieces). | How a painted 2.5D browser game is put together: a stack of paintings and a CSS interface, not 3D models. | Dark ink, the game's own Ink & Gold |

## What every option already obeys

- **The nine pattern elements** from the reference, all on every option: one specimen on
  a lit stage; a title block top left with one quiet line of facts; a systems or
  components panel on the left with counts; **the pull-it-apart slider** bottom centre
  with a percentage and Reset; a detail card on the right with plain words, the kind of
  claim it is and the source; **Isolate**; search top right ("/" to focus); a slim view
  rail on the right edge; and provenance ("sources & credits", bottom right).
- **Sourced facts only** (hard rule 6). Every number, move, status and rule on a frame
  was copied from `src/data/**` or `research/*.md`, and the counts were recounted by a
  second agent. The two damage numbers, 803 in B and 954 in C, came from running the real
  engine at seed 1, not from arithmetic. Where data and research disagree the frame says
  so instead of choosing (the four `?/12` chips on A3).
- **Original art only** (hard rule 8). Every picture is one of the project's own
  paintings from `public/art/**`; the glyphs in B are drawn, not game icons. Every frame
  carries "Unofficial fan tribute · sources & credits" and a CONCEPT tag.
- **Game-aware accents.** One accent per context: pyre pink on the FFX-2 specimen, Yevon
  gold on the FFX specimens. No turn list anywhere near FFX-2.
- **Plain words first.** Each panel row has a plain line under its label ("what stands on
  the field, battle by battle", "who goes next, and why", "a flat cut-out that faces the
  camera").

## Game-aware (hard rule 14)

Decided from `research/ffx-vs-ffx2-presentation.md`, not from memory: §4.1 (the Act List
is FFX's), §4.2 ("There is no Act List and no turn-order queue in FFX-2"), §4.3 ("True to
FFX. Not true to FFX-2.") and §9 row 3.

- **A: FFX-2 only**, as drawn. Chapter V, pink throughout, no gold, no turn list. "Turn
  pattern (AI)" is how each part picks its move, not a queue. For chapters I to III the
  same site takes gold.
- **B: FFX only**, as drawn. Chapter I, gold. Turn order, command ranks and Overdrive
  modes are FFX rules, and the "drag Agility, watch the turn list re-order" control must
  never appear in FFX-2. FFX-2 needs its own eight-row list (the gauge, charge time,
  Chain, Spherechange), shown only as a small pink preview card on B1. That card is the
  one place in the set where a second accent appears on a page.
- **C: FFX only** for the specimen on C1 and C2 (chapter II, gold, turn list in the HUD).
  C3 lists both games' assets, because it is the whole game's kit, under the open
  chapter's gold. An FFX-2 frame (pink, mirrored chrome, gauges, a chain) is described
  but not drawn.
- **Both:** the shell. Stage, slider, panel, detail card, search, view rail, chapter
  switcher and inventory grid carry no game rule; they take the accent of the open
  specimen. The switcher marks chapters I to III "FFX" and IV, V "FFX-2" in words.

## Honest comparison

Written after looking at all nine frames at full size.

| | A · Boss atlas | B · Battle studio | C · The game, exploded |
|---|---|---|---|
| **Teaches** | How to beat a boss | How the rules work | How the game is made |
| **Who it is for** | Someone about to play the chapter | Someone who wants to understand the system | Someone curious about the craft |
| **Strongest frame** | A1. Vegnagun on the plinth is the clearest "one specimen on a stage" in the set. | B2's detail card. A slider that re-runs the real engine is the one thing here the reference sites cannot do. | C2. The best pull-apart of the three, because the subject really is a stack of flat sheets. |
| **Weakest frame** | A2 is crowded: sixteen small cards and a detail card, no single path for the eye. A3 is a wall of chips with only 12 pictures. | B3 has no pictures at all; it is a glossary wall. In B2 the "object" is an idea, so it reads as a diagram around a stage, not a thing coming apart. | C1 is a picture of the game inside a frame, the least surprising start. HUD text inside the tilted frame on C2 is too small to read. |
| **100% inventory** | 12 tiles + 107 chips | 137 text tiles | 102 thumbnails + 35 labels. Closest to the references' grid of objects. |
| **Build cost** (builder's estimate) | Medium: about a week for one chapter, days per further chapter | Large: 2 to 3 weeks for FFX, 1 to 2 more for FFX-2 | Medium to large: about a week for one chapter, about two for all five |
| **Main risk** | Art. Only Vegnagun has separate part paintings, and 7 of its 12 parts are zooms into a parent painting. The other four bosses do not come apart into body parts. | Copy. About 140 plain-words rule blurbs per game, none of which may be invented, plus a per-chapter layer. | The specimen is a hand-assembled composite, cleaner than the live screen. And it says "AI-painted" and names your PC on a public page. |

Three more things the frames show:

- **Depth is modest everywhere.** These are painted cutouts and cards in CSS 3D. A2 reads
  as paper cutouts on a light table, B2 as angled glass cards. Only C2 looks like a real
  explode. Whether a tilt feels good in the hand only shows up in a prototype, which is
  the next rung of the ladder for whatever you pick.
- **Each builder priced their option alone.** `docs/plans/learning-sites.md` plans one
  shared shell under all three, so the costs overlap: the second and third sites are
  mostly data and a stage arrangement.
- **A is the one that sends people into the game.** Its cards (A1, A2) carry a "Fight this
  chapter" button. B and C explain; A explains and then hands over the controller.

## They mix, and a pick approves only what you name

The three differ on two separate axes, **subject** (boss / turn / frame) and **look**
(light clinical / dark studio / dark ink), and the frames were built so either can move:

- A's subject in B's dark studio look, or in C's Ink & Gold.
- A as the core, with C's sheet-explode as each boss's stage, which would also answer
  "what does pulling apart mean for a boss with no separate parts".
- B's live control inside A's detail card: "what if Yuna had Shell up when this lands".
- C's thumbnail wall as the inventory style for A, in place of the chip wall.

Saying "A" approves the things you name about A, not everything on its frames. After you
react, the main session writes down: liked, disliked, must remain, must change, still
undecided.

## Open questions

1. Which option, or which parts of which? If all three separately still holds: which one
   first, and does each frame's look stand as the target for its site?
2. Where does it live: a folder of the existing GitHub Pages site (the plan's default is
   `/pyrefly-reprise/learn/`) or a site of its own?
3. The name. The frames use "Pyrefly Atlas", "Pyrefly Studio" and "Pyrefly Reprise,
   exploded". On B, is "One Turn" the big line with the site name small, or the reverse?
4. Is a phone layout in scope for the first build? The references work on a phone. No
   390×844 frame exists for any option yet.
5. One look for everything, or one look per subject as drawn?
6. "Drag to tilt", not orbit. Painted cutouts cannot turn all the way round, and 3D
   models are ruled out (hard rule 9). Is a parallax tilt enough of a toy? For C only
   there is a second route: explode the game's real Three.js scene instead of exported
   layers (truer, harder, because the HUD is HTML).
7. A: seven of Vegnagun's twelve parts (3 Nodes, 2 Bulwarks, 2 Redoubts) have no painting
   and are shown as labelled zooms; which crop stands for which is a guess. Acceptable,
   or new paintings first (your yes and GPU time)? And for the four bosses that do not
   come apart into body parts, may "pull apart" mean forms, phases and moves?
8. What counts as a piece? A: "Attacks and abilities 50" includes heals and buffs. B: 137
   covers one turn's core rules; items, skills, aeons and equipment would make it several
   hundred. C: 377 counts 8 HUD parts as pieces (369 without) and folds poses into ×5
   badges.
9. B: should the default turn be a plain Attack (as drawn) or chapter I's signature turn
   (Lance of Atrophy, Zombie, then Full-Life kills)? Keep row 08 "The boss's next move" as
   a per-chapter layer? Fixed seed by default with Re-roll optional, as drawn?
10. FFX-2 for B and C is not drawn. Should B's FFX-2 version keep the turntable and the
    eight-row list or take a different shape for real-time gauges? Which FFX-2 moment
    should C use?
11. Game labels in the switcher are words only, to keep one accent per page. Would you
    rather have a small gold or pink dot per game? Related: keep or drop B1's pink FFX-2
    preview card on a gold page?
12. C: an exact capture of the live build as the specimen, or a cleaned-up hero frame as
    drawn? And the honesty wording, "AI-painted" and "Painted on Bailey's PC by a local
    ComfyUI pipeline, not by hand": do you want it said that plainly in public?

## Found along the way (not fixed: `src/`, `research/` and `docs/` were out of scope)

- **Data bug.** The Bulwark record in `src/data/ffx2/enemies/vegnagun-body.ts` blocks the
  Strength and Magic breaks; `research/ffx2-vegnagun-shuyin.md` §3.3 and the file's own
  comment say they land. A3 prints `?/12` on the four affected chips. The builder flagged
  it as a separate task.
- **Research lists steals the data lacks** (Tail X-Potion, Head Megalixir, Redoubt
  Phoenix Down, the Node's rare Hero Drink). By research A's rewards would be 10 and the
  total 120; the frames print what the data holds today, 9 and 119.
- **The research contradicts itself on Reflect:** §7.2 says cast Reflect on the Leg, §3.2
  and the data make the Leg immune to it. A3 follows the stat table.
- **`docs/ARCHITECTURE.md` lags the code** in two places C would quote: it lists about 22
  battle events (the code has 36) and says music is synthesised (it is prerendered
  samples). C cites the code and leaves the synthesis claim off.

## How these were made

1600×900, plain HTML and CSS 3D transforms, no WebGL, no behaviour: faked screenshots of
the finished moment. Real paintings from `public/art/**`, fonts from `public/fonts/`,
tokens from the Ink & Gold spec. Each folder keeps the script that makes its numbers
traceable (`a-boss-atlas/build-a.mjs`, `b-battle-studio/engine-probe.mjs` and
`inventory.mjs`, `c-scene-exploded/build.mjs`) and its capture script, which fails on a
broken image, text under 13 px or overlapping chrome. The frames load art by relative
path, and the art is gitignored, so they open only on this machine.

```
node docs/concepts/polish/_kit/shoot.mjs docs/concepts/atlas/sheet.html docs/concepts/atlas/sheet.png --w=2400 --h=2061
```

---

*Concept only. Unofficial fan tribute. Nothing under `src/`, `public/` or `tools/` was
touched by this round.*
