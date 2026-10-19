# Pyrefly Reprise — product brief

> **Changed 2026-10-18 (Bailey): the Pilgrimage runs are the core loop; see “The feeling and the core loop” below.** Everything else stands as adopted.
>
> **Status: ADOPTED 2026-10-17**, as drafted (his blanket yes of that day, decision D-932 part P7, answering D-012: “for all other decisions i'll go with all your recommendations even for sound effects and music.”). Built on 2026-09-18 from five picks
> Bailey made between concrete options (not from a questionnaire). A pick approves only
> what Bailey named, so every line below is marked **picked** (Bailey chose it),
> **follows** (my reading of what a pick implies; confirm or strike) or **proposed**
> (mine; nothing Bailey has said yet; adopting the brief approves it as drafted and strikes none of them). Now that it is adopted it outranks everything
> except `AGENTS.md`'s hard rules and the approved targets in `docs/target/targets.json`.

## North star (picked: "Faithful recreation" + "2026 showpiece")

Pyrefly Reprise is for people who loved these fights, and it shows what a browser game
can look and sound like in 2026. Someone who knows FFX and X-2 by heart plays every
chapter and never once thinks "that's not how it worked": every number, status,
Overdrive and boss pattern is right. On top of that core sit painted scenes with depth
and light, Ink & Gold chrome, cinematic Overdrives and a sampled orchestral score. Any
frame could be the poster.

Not picked, and therefore not a goal on its own: "the link you send a friend who never
played" and "a boss-rush challenge game".

## The feeling and the core loop (CHANGED 2026-10-18: the Pilgrimage runs are the core loop)

> **Bailey, 2026-10-18 about 15:28 EDT** (D-1024): “I feel like the game still kind of bare bones. It’s a greatest hits anthology of encounters which is great but it needs a really addictive aspect and tighter core gameplay loop.” He picked “Pilgrimage runs + party growth” to be shown as mockups, then “Option 2 + B: branching, boons” (D-1030), and after the prototype shipped hidden in release 55 he wrote (about 18:59 EDT, D-1041): “The new gameplay idea you recommended is awesome. I absolute love the pilgrimage idea.”
> **This replaces the 2026-09-18 pick that the “one more try” feeling comes only from the fight itself, with no medals or modifiers (E-023, partly replaced).** The Pilgrimage runs are the game’s core loop from here on.

- **picked** The loop is a *run*: a road of the game’s own fights, with forks (elite fights such as the Mirror Aeons and Sin’s Fins or Core pay double), where after each win the player picks one of three **boons** for the next fight (real FFX items and auto-abilities; “Overdrive charged” is labelled new). Every fight keeps its faithful party and bosses are never tuned. A run ends in a run-over page with Again in two presses and a best run. The “carry the party” growth model (A) is parked until the stat gap is measured. FFX first (the prototype is hidden behind the word `pilgrim`, release 55); FFX-2 gets a Gullwings sphere hunt later.
- **follows** The fights themselves are still the pull: they stay hard, fair and faithful, and a loss still tells you why. The run is the reason to go back; it is not a reason to bend a rule. Boons are one-fight and sourced from the game, not a power curve.
- **follows** What is next, after he plays the prototype: measure boon difficulty on the engine, the FFX-2 Gullwings hunt, longer roads, and the new chapters (Spectral Keeper, the Fallen Maesters) as stops. Cutting friction in the loop (time from a loss to the next attempt, time to the first command, a loss screen that says why) is adopted as a driver recommendation (D-1027).
- **Superseded 2026-10-18** (kept for the history): “The pull to play again comes from hard, fair fights, not from systems around them”, and “no medals, modifiers, rankings or unlocks in season 1; they stay proposals that need Bailey’s yes”. Boons are the one system he has now said yes to; medals, rankings and unlocks are still proposals.
- **follows (unchanged)** Every chapter is losable if you ignore what the fight is asking for, and winnable with the tactics that worked in the original. The defeat screen shown in the picker was an illustration, not an approved design: it is a gap on the end-state board and gets its own options round.

## When two goals collide (picked: "Faithful core, showpiece surface")

1. **Mechanics never bend.** Not for looks, not for clarity, not for a new idea.
2. **Most of the effort now goes to what the eye and ear touch.** The rules are treated
   as nearly done: fix what is wrong, then stop polishing them.
3. **Help for newcomers is an optional layer** (advisor, guide, enemy intent, tutorials).
   It may explain a rule; it may never soften or change one, and a player who declines
   it gets the faithful game.
4. **New ideas come last** and are never built without a yes.

**Bailey's rule, 19 Sep 2026 (in force now, not part of the draft):** every change is
specific and game-aware. True to FFX but not FFX-2: it does not apply to FFX-2. True to
FFX-2 but not FFX: it does not apply to FFX. True to both: it applies to both.

How that settles real arguments (**follows**):

- A cinematic Overdrive camera may hide the HUD for a moment. It may not change a
  timing window, a damage number or the turn order.
- If a faithful rule confuses a first-time player, the answer is a better explanation,
  never a simpler rule.
- When time or usage is short, a visible or audible improvement beats a third pass over
  a mechanic that is already correct.

## Finished (picked: "Seasons")

- **Season 1 is the five chapters** and nothing else: Seymour Flux, Yunalesca, Braska's
  Final Aeon, Bahamut (X-2), Vegnagun and Shuyin.
- **follows** Season 1 closes when the milestone is accepted under `critic/RUBRIC.md` (policy v2: one weighted score at 9.60 with every category at least 9.0, plus the gates) and
  no tile on the end-state board is still waiting for a verdict or a target.
- **picked later (19 Sep 2026)** Bailey approved three new chapters: the Leblanc
  Syndicate (FFX-2), Seymour and Anima at Macalania, and Evrae (FFX), built in that
  order after the fixes and the 12 approved presentation changes. Whether they belong
  to season 1 or open season 2 is undecided. Every new encounter gets its own approved
  targets before it is built.

## Out of scope for season 1 (proposed: strike anything that is wrong)

Exploration, towns or an overworld. New encounters beyond the three chapters Bailey
approved on 19 Sep 2026; new playable characters, aeons or dresspheres.
Medals, challenge modifiers, leaderboards, daily seeds. Accounts, a backend, multiplayer.
Retail assets of any kind. Anything sold.

## Who judges what (proposed)

| What | Judge |
|---|---|
| Numbers and rules | tests against `research/*.md`, then the critic's `combat` and `encounter` categories |
| Feel, story, interface, onboarding, prep, delivery | the critic's other categories (`critic/RUBRIC.md` §6) |
| Distance from what Bailey approved | the approved-target gate (`critic/RUBRIC.md` §7), from side-by-side pictures |
| Every target before it is built | Bailey's eyes, choosing between options |
| Music and sound | Bailey's ears only |

## What the picks did not settle (still undecided)

- How much effort newcomers get. "The friend link" was not picked, yet the critic still
  scores onboarding, accessibility and options (weight 5 of 100, and at least 9.0 for
  final acceptance like every category). Under this brief that means optional
  layers, done once and done well, not a redesign around first-timers. Bailey has since
  approved one proposal in this area (19 Sep 2026): a cold open and a taught first
  chapter, mocked up as two or three options first.
- Which encounters season 2 holds, and when it starts.
- A date. "A date, not a score" was not picked, so the gate decides when season 1 ends.
