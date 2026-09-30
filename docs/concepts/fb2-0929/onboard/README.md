# First-run clarity: three options (fb2-0929, onboarding track)

**Why this exists.** Bailey's friend, 2026-09-29, and Bailey concurs: *"It didn't
really explain what was going on so that initial UI after you get past the dialogue
was confusing on how to start a game and what to do next."* The friend loves Persona 3
and 5 and thinks this would be an awesome mobile game.

**Nothing here is built.** These are end-state options (AGENTS.md rules 9 and 10).
Two small defects in the approved onboarding were fixed on the branch
(`docs/handoff/fb2-0929-onboard.md`); everything below changes look, feel or flow and
waits for Bailey's pick.

Every frame is a real 1600x900 or 390x844 page: one of **our own captures of the live
build** (release 31a, fresh profile, `frames/`) under overlays drawn with the game's
own Ink & Gold tokens (`src/ui/inkgold/tokens.css`) and its own fonts. One page draws
them all: `option.html?o=before|o1|o2|o3&step=1..3&w=390`.

## What a newcomer meets today (measured on the live site)

Walked by mouse at 1600x900 and by taps at 390x844, fresh profile each time
(`docs/handoff/fb2-0929-onboard.md` has the full table and times).

| step | seconds in | what it says | where a newcomer stalls |
|---|---|---|---|
| Title | 0-3 | PRESS ENTER / TAP TO BEGIN | fine |
| Auron's briefing | 3-6 (or 23 if watched) | four lines about the two clocks | says what the fights are, not how to start one |
| **Chapter select** | 6 | 18 cards of equal weight; the foot reads CLICK THE PLATE BEGIN | **the stall the friend named.** Nothing says start with I; the "plate" is the big picture, and nothing on it says it is a button |
| Party prep | 9 | START BATTLE, big and gold | fine |
| Story scene | 11-75 | 33 lines, one click or tap each (36 presses) | long; AUTO exists but nothing points at it |
| First command | 75 | Auron: "He moves after you. Not before. Use it." ENTER CONTINUE | two advisors name two different moves (the guide says Holy Water → Yuna, the move chip says Slow → Seymour Flux); on a phone the line said ENTER (fixed) and covered the enemy being aimed at after a tap on ATTACK (fixed) |

`before-board-*.jpg` and `before-battle-*.jpg` mark those stalls on the real frames.
`sheet.jpg` puts every frame of the round on one page.

**What comes after.** A mouse player who only presses ATTACK on the first target lost
Chapter I in 26 seconds of battle (9 turns, 3 of them the player's), and landed on
Defeat with RETRY and CHAPTER SELECT and no word on what went wrong (the defeat line is
still a gap tile, R13). Chapter I is the fight every option below points a newcomer at.

## The options

Each option is shown at 1600x900 and 390x844.

### O1 · One clear next step: `o1-start-card-*.jpg`

After the briefing, the board opens with Chapter I's picture lit, everything else
dimmed, and one paper card under it: START HERE · CHAPTER I, the plan in one line
(*Choose a fight → pick your party → win*) and a large gold **START CHAPTER I**. The
dim lifts after the first battle ends.

- **Changes:** one card on one screen. The first click is impossible to miss, and the
  plan line names the whole loop.
- **Costs:** the least of the three (one component, one seen-flag). It does nothing
  for the battle itself, and it changes the approved board tile's first look (the
  paper story card is covered for the first visit).

### O2 · Guided first run: `o2-step1-board-*`, `o2-step2-prep-*`, `o2-step3-battle-*`

Auron's briefing ends by turning into a three-step pointer in his voice: a gold ring
on the exact thing to press and one line beside it. 1 of 3 on the board ("Start with
the first one." ring on the picture), 2 of 3 on party prep (ring on START BATTLE,
"the tabs are for later"), 3 of 3 on the first command (ring on ATTACK, with Bailey's
approved line kept word for word and "Pick ATTACK, then pick who it hits" under it).
Then it gets out of the way. Esc / "tap here" skips the guide at any step.

- **Changes:** answers both halves of the complaint (how to start, and what to do
  next) in the voice Bailey already picked, and extends option C instead of replacing it.
- **Costs:** the most work: a pointer that finds live elements on three screens at two
  layouts, a skip path, and a seen-flag per step. Step 3 shares the first-command
  moment with Auron's approved C2 line, so the two must become one surface (as drawn).

### O3 · Straight into the fight: `o3-primer-*`, `o3-board-card-*`

The first run skips the board and party prep: PRESS ENTER plays the briefing, then
Chapter I's story scene, then the fight with the default party. At the first command
a two-line paper primer sits over the field (*Pick a command, then pick who it hits.
Nothing moves until you act; the column on the right shows who goes next.*) with GOT
IT. After the first result the board opens with one ink card: *This is the board.
Every boss fight here, FFX and FFX-2, is open. Click a card to look; click the
picture to start it.*

- **Changes:** the shortest path to playing (no board to read, no prep), closest to how
  a mobile game onboards.
- **Costs:** a first-run branch in the flow (title → battle), and the board is taught
  after a fight the player may have lost. The primer is a second teaching surface
  beside Auron's line unless the two merge. A player who wanted to pick a different
  first fight cannot, the first time.

### Recommended pick (the agents' view, not Bailey's)

**O2, Guided first run.** It is the only option that covers both "how to start" and
"what to do next", and it grows out of the onboarding Bailey already picked (Auron's
briefing, option C) rather than adding a new voice. If the cost matters more than the
coverage, **O1** alone fixes the stall the friend actually named, and O2's third step
could follow later.

The onboarding plan already recorded this gap: `docs/handoff/onboarding-c.md` lists
**R10, a RECOMMENDED / START HERE card on chapter select**, as a gap tile that needs
Bailey's pick. All three options are ways of filling it.

**Which fight a first run points at is Bailey's call.** All three options aim at
Chapter I because it is first on the board. It is also a boss a newcomer loses fast
without the guide's plan (above). Nothing here measures which chapter is gentlest, so
no other chapter is proposed.

## Game case (AGENTS.md rule 14)

- The board, party prep, the briefing and the pointer are **both** (shared front end).
- The battle lines drawn (O2 step 3, O3's primer) are **FFX only**: Chapter I is FFX,
  and "nothing moves until you act" is the approved briefing's FFX line. A first run
  that began in an FFX-2 chapter would need Rikku's voice and a line that never holds
  (the C3 rule), which is not drawn here.

## What would make it feel like a good mobile game (observations from the phone walk)

Observations only; nothing here is proposed for building.

- **Portrait works.** The 2x3 command grid, the full-width party chips and the
  targeting bar (BACK and ATTACK → MORTIORCHIS) are all thumb-sized and at the bottom
  of the screen. That part already reads like a mobile RPG.
- **The first screen of a fight is dense.** The top band reads "SEYMOUR FLUX 3RD IN
  QUEUE · Lance of Atrophy SCRIPTED ZOMBIE 50% · random: TIDUS 707-799 / YUNA 746-842"
  above a TIP chip and a GUIDE button. A newcomer meets numbers before they meet the
  fight.
- **The story scene is 36 taps.** There is an AUTO control on the dialogue card, but
  nothing draws the eye to it, and no hold-to-skip.
- **Key words leak onto the phone.** The title's chip reads "B BRIEFING"; the board's
  foot reads "TAP HERE BACK". (The coach line's ENTER CONTINUE was one of these; fixed.)
- **Most board rows showed no boss thumbnail** on the phone capture (rows VIII onward),
  where the desktop board had all of them.
- **An enemy can act before the first command.** On two of the walks a party member was
  hurt or down by the time the first menu opened. That is the sourced fight's own order
  and is not a defect here, but a newcomer reads it as "I was hit before I could do anything".
- **Sessions are long.** Title to first command is about 75 seconds, 50 of them in the
  story scene, and a boss fight is many minutes. Mobile players expect a save-and-resume
  point in a long fight.

## Files

| file | what |
|---|---|
| `before-board-1600x900.jpg`, `before-board-390x844.jpg` | today's board after the briefing, stalls marked |
| `before-battle-1600x900.jpg`, `before-battle-390x844.jpg` | today's first command, stalls marked |
| `o1-start-card-*.jpg` | O1 |
| `o2-step1-board-*.jpg`, `o2-step2-prep-*.jpg`, `o2-step3-battle-*.jpg` | O2's three steps |
| `o3-primer-*.jpg`, `o3-board-card-*.jpg` | O3's primer and its board card |
| `sheet.jpg` (`sheet.html`) | every frame on one page |
| `option.html`, `_mock.css`, `_fonts.css` | the page that draws them (mockup CSS, not product CSS) |
| `frames/` | the live captures under every mockup |
