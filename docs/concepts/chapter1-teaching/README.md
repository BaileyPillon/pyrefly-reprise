# Chapter 1 (Seymour Flux) — teaching fixes, wording options for Bailey

**FFX only.** Built from the two 2026-09-23 method-check reviews
([`docs/plans/pr-0007-method-check.md`](../../plans/pr-0007-method-check.md),
[`docs/plans/pr-0008-method-check.md`](../../plans/pr-0008-method-check.md), each
with an appended adversarial "Review" section, `main` 55050554) after reading the
current guide (`src/data/guides/seymour-flux.ts`), the enemy-intent panel
(`src/ui/common/EnemyIntent.ts` + `enemy-intent-brief-status.ts`, committed
333bc2c7 / 73d98c59), and the approved Ink & Gold spec
(`docs/handoff/presentation-ink-and-gold.md`, kit at
`docs/concepts/polish/_kit/`).

**Nothing here is built.** This is the end-state-first options round AGENTS.md
rule 9 and rule 10 require before PR-0007 and PR-0008 touch any file. No boss
stat, script, or damage number changes in either proposal — both reviews were
explicit that the tactic is at a measured local maximum and the fight's data
matches the research; what's wrong is what the player is told, not the fight.

- **`options.jpg`** — one 1600×900 sheet: the three intent-panel visual
  options for (c), plus the wordings for (a), (b) and the acceptance-bar
  question for (d).
- **`chapter1-lance-capture.jpg`** — the real background: an in-battle capture
  of Chapter 1, seed 1, `intendedStrategy`, at the moment Lance of Atrophy's
  first hit lands (own `npx vite --port 5601 --strictPort` server,
  `window.__pyrefly.gotoChapter('seymour-flux', {seed:1, auto:'intended'})`,
  polled `battleLog()` for the first `Lance of Atrophy` event, captured the
  live canvas). It shows Yuna zombified and downed and the Mortiorchis still
  holding the Lance — the exact pairing PR-0007 is about.
- **`panel-a.png` / `panel-b.png` / `panel-c.png`** — the three intent-panel
  options at higher resolution, each composited from that capture (cropped)
  plus the shipped panel's own CSS classes and values
  (`src/ui/common/enemy-intent.css`), hand-copied and scaled 3.6× into
  `eint-mock.css` so the mockup is legible without the live
  `--eint-scale` transform. Everything but the three new "pairing" rules
  (clearly marked `NEW` in that file) is the real panel's existing look.
- **`kit-copy.css`** — the Ink & Gold token/slab kit, copied from
  `docs/concepts/polish/_kit/kit.css`, used for the sheet's own chrome (the
  header and the four paper cards), not the game's own build.

## (a) Guide rule 4 — corrected

**What's wrong today** (`src/data/guides/seymour-flux.ts` rule 4): *"Stand the
party up before the hit, not after it. Dispel into Cross Cleave arrives with
nothing in between, so the only defence is Protect, five Cheer stacks and full
HP already being true."* PR-0008 §3 point 4: of 80 Cross Cleave deaths in the
160-seed sample, 39 had Protect up before the Dispel. Protect does not survive
it — the guide says it does.

- **Wording 1:** *"Cross Cleave follows the Dispel with nothing in between —
  what stands through it is HP, Cheer and Auron's 3,410 HP, not Protect."*
- **Wording 2:** *"Protect does not survive the Dispel. What does: full HP,
  five Cheer stacks, and Auron's own 3,410."*

Cite: `ffx-seymour-flux §4.2, §5.2, §5.5` (kept from the existing rule).

## (a) Holy Water line — corrected

**What's wrong today** (guide rule 3 and the matching hint): *"Holy Water a
Zombie before the mount acts."* PR-0007 §1–2: over seeds 1–40, 47 of 82
Zombies are killed by Full-Life with **zero** party turns in between — the
line promises a turn the CTB gives in only 34 of 82 cases (about 41% at this
sample, ~69% of fights overall have Seymour equal-or-first on the clock, per
the sourced ICV formula in §2).

- **Wording 1:** *"Holy Water a Zombie when you get the turn for it — about 3
  fights in 8, the mount answers before anyone can."*
- **Wording 2:** *"Cure a Zombie the moment you have a turn. Often you won't:
  the mount's Full-Life can land first."*

Cite: `ffx-seymour-flux §6 row 4, §3.3` (kept), plus the new odds citation
below.

## (b) New honest-odds rule

Not a correction — a new rule PR-0008 §1 point 3 asks for, in the guide's
own voice and length:

- **Wording 1:** *"Even played well, this fight is lost about 3 times in 8 —
  most often when Seymour moves first and a Zombie lands right before the
  mount acts. That is the fight, not a mistake: retry."*
- **Wording 2:** *"A loss here usually means Seymour opened and Lance of
  Atrophy caught someone with no turn to answer it. Not a misplay — about 3
  in 8 play out that way. Retry."*

Numbers behind both: the line wins 100 of 160 across the four standard seed
windows (62.5%), so **86% within two tries and 95% within three**. The
adversarial review re-ran this independently and confirmed 26/21/24/29 = 100
of 160, one loss before battle turn 10 (seed 20, turn 8), and that Seymour
takes the first enemy turn in 114 of 160 fights, losing 51 of those (45%),
against 9 of 46 (20%) when the mount opens. Cite: `ffx-seymour-flux §1.9`
(the ICV formula), `§4.1`, `§4.2`.

## (c) Intent-panel line — "does the party get there first?"

When Lance of Atrophy is queued, the panel should say whether any party
member acts before the Mortiorchis, so the player knows in advance whether a
Holy Water window exists at all (research: `ffx-seymour-flux §6 row 4` names
the "CTB turn prediction UI" itself as the mechanic the sourced strategy
needs — PR-0007's adversarial review flagged that this makes the change
fidelity, not just a hint). Read from `predictTurnOrder(ctx, 8)`, already in
`src/battle/ffx/intent.ts` — a derived read, no new source of truth. Three
layout options, all built from the real panel's own classes:

- **Option A — inline strip.** One new line directly under the move
  description, in its own blood-bordered strip (mirrors the shipped
  `.eint__form`'s gold-left-border treatment, in the panel's threat color
  since this is bad news): *"No party turn before the Mortiorchis — Holy
  Water can't beat this one."* In the mount-first case the strip would read,
  e.g., *"Kimahri acts first — Holy Water can reach her before Full-Life."*
  in gold instead of blood (see `.eint-mock__pairing--open` in
  `eint-mock.css`).
- **Option B — second badge.** A small tracked chip riding beside the
  `SCRIPTED` badge on the move-name row: `NO WINDOW` in blood, or
  `WINDOW: KIMAHRI` in gold. Cheapest in vertical space, competes with
  PR-0011's own status chip for that slot (round 09), so it can only show one
  or the other at brief density — a real trade-off to flag to Bailey.
  Rendered here replacing the Zombie chip; wording for the open case:
  `WINDOW OPEN`.
- **Option C — extra bullet.** Folded into the existing "If you attack" list
  as its own first line, no new section header: *"No party member acts before
  the Mortiorchis this time."* Cheapest to build (reuses `listHtml` as-is);
  reads slightly buried since "If you attack" is about a different decision
  (attacking into a counter, not curing a status).

All three keep the panel's brief density (FFX mounts at `'brief'`, per
`enemy-intent-brief-status.ts`) and PR-0010's height cap. Recommendation for
the builder once Bailey picks: **Option A** — it is the one line a player
glancing at the panel for two seconds before the hit lands will actually
read, and it does not fight PR-0011's status chip for space the way B does.

## (d) The acceptance-bar question

Bailey's yes/no, in one sentence: **re-baseline PR-0008's acceptance to at
least 95 of 160 wins across the four standard seed windows (measured 100, a
5-win guard band) with at most 2 losses before battle turn 10 (measured 1),
in place of the critic's current 36 of 40 (from `PR-0008`'s own `expected`
and `acceptanceCheck`, corrected by the adversarial review to note it counts
**battle** turns, not player turns) — yes or no?**

The tactic has had at least fifteen tuning variants tried since 2026-09-17
plus six more measured for this document, all of which tie or lose to the
shipped line (PR-0008 §4a); the losses are the fight's clock, not a bad
tactic (0 of 236 curable Zombies were ever missed).

**Parked, not part of this ask** (both reviews agree it needs a second
source and Bailey's yes before anything is built, and the two probes
disagree with each other): Haste-on-Seymour's win-rate effect is unsettled —
PR-0007's probe measured 26→21 of 40 seeds, PR-0008's probe measured 99 vs
100 of 160. The two probes are built differently and need reconciling before
either number goes to Bailey as a decision input.

## Open questions for Bailey

1. Guide rule 4 — wording 1 or 2 (or a mix)?
2. Holy Water line — wording 1 or 2 (or a mix)?
3. Honest-odds rule — wording 1 or 2 (or a mix), and does it belong as a
   guide rule at all, or somewhere else (e.g. a one-time toast on the first
   loss)?
4. Intent-panel line — Option A, B, or C (see `options.jpg`)?
5. The acceptance-bar re-baseline (95 of 160, ≤2 early losses) — yes or no?
