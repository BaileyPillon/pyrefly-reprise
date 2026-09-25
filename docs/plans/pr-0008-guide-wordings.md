# Chapter 1 guide: the wordings for Bailey (PR-0008 and PR-0007, one set)

**FFX only.** This is Chapter 1 (Seymour Flux), the in-battle strategy guide
(`src/data/guides/seymour-flux.ts`). It is the one wording round that decisions-2026-09-25
item 5 promises ("you see one set of wordings"). It replaces the stale numbers in
`docs/concepts/chapter1-teaching/README.md` (sections a and b, written on the 100/160 line).
Every number below is today's engine (`docs/plans/pr-0008-method-check.md`, 2026-09-25 refresh).
Seymour's numbers are not touched.

## Already in the build: the two sourced corrections

These fix sentences that contradicted the research, so they shipped with item 5. If you prefer
the alternative wording, say so and it is a one-line swap.

**Rule 3, Holy Water (PR-0007 option A).** The old line said "Holy Water a Zombie before the
mount acts". That promises a party turn the turn order often never gives: both enemies act at
Agility 38 (§4.1), and Seymour moves first in 114 of 160 fights.

- **Shipped:** "Holy Water a Zombie whenever a party turn comes before the mount’s — often none
  does: both act at Agility 38, so Full-Life can follow Lance of Atrophy at once, 100% of max HP
  as damage plus a guaranteed Death. A fallen Zombie stays one, so leave them down."
  (short: "Holy Water a Zombie when a turn allows")
- Alternative: "Cure a Zombie the moment you have a turn. Often you won't: the mount's
  Full-Life can land first. Raised, a Zombie is still a Zombie."

**Rule 4, before the hit.** The old line said "the only defence is Protect". §4.2 says the Dispel
strips Protect immediately before Cross Cleave.

- **Shipped:** "Stand the party up before the hit, not after it. The Dispel strips Protect right
  before Cross Cleave, with nothing in between, so what stands through ~2,000-2,450 a head is
  full HP and Cheer stacks, which it does not remove." (short: "Full HP and Cheer before the
  Dispel, not Protect")
- Alternative: "Protect does not survive the Dispel. What does: full HP, five Cheer stacks, and
  Auron's own 3,410."

## Not in the build: pick one, or none

**A new rule saying honestly how often a good run loses** (PR-0008 §1, item 3; the product
brief's "a loss tells you why in plain words"). Today the shipped line wins 78 of 160: it loses
about **half** the time. It wins 74% within two tries and 87% within three. Losses are 60% when
Seymour moves first, against 30% when the mount does.

- **1:** "Even played well, this fight is lost about half the time, most often when Seymour moves
  first and a Zombie lands right before the mount acts. That is the fight, not a mistake: retry."
- **2:** "A loss here usually means Seymour opened and Lance of Atrophy caught someone with no
  turn to answer it. That is not a misplay: about half of all runs go that way. Retry."
- **None:** leave the guide without an odds line.

Cite for 1 and 2: `ffx-seymour-flux §4.1, §4.2`. The rate is our own measurement, which the text
says in words rather than as a sourced figure.

**One hint that still leans on Protect** (it fires on Protect or Light Curtain): "... unmitigated
it is a wipe from full health, and Protect halves it". It is true when Protect is up, but in
phase 1 the Dispel always comes first.

- **Keep** as it is.
- **Reword:** "Protect halves physical hits while it is up, but in phase 1 the Dispel strips
  it right before every Cross Cleave. Against the Cleave, full HP is what counts." (§4.2, §5.2)

## What the player sees today

With a command menu open the guide shows each rule's short line. At 1600x900 the rail keeps the
first three and pages with MORE (`docs/screenshots/pr-0008/guide-1600-rules-short.png`). At
390x844 the phone guide lists all five, and they read in full after one scroll
(`guide-390-rules.png`). The long paragraphs appear only on a taller rail.

## How it will be checked

Whatever you pick goes into `seymour-flux.ts` with its citation. It is then re-run through the
guide fold and scale tests (the PR-0010 height cap) and read in full in a real browser at
1600x900 and 390x844.
