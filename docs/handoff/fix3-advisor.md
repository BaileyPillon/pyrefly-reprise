# fix3 — advisor track

Owner files: `src/engine/tactics/advisor.ts`, `src/ui/common/MoveAdvisor.ts`
(text and logic only), `tests/unit/advisor*`, `tests/unit/ui-move-advisor.ts`.
New across the two passes: `src/engine/tactics/advisor-revive.ts`,
`src/engine/tactics/advisor-forecast.ts`, `tests/unit/advisor-ownership.test.ts`,
`tests/unit/advisor-forecast.test.ts`. `guide.ts` was never touched: the citation
plumbing did not need it — the card simply stops printing what it already had.

Commits, pass 1: `bab0b29`. Pass 2 (this document): `a6e344a`, `703b422`,
`01d4f6c`, `3aa5440`.

---

## The report

Bailey, on the live build, Chapter 1, Tidus acting, Yuna KO at 0/1500, Kimahri
on the field:

> "im controlling tidus but the advisor is telling me to use poison fang? how
> does that make sense? and what about reviving yuna?"

Pass 1 answered the ownership half (Poison Fang turned out to be a thrown item
on Tidus's own Items list; the card never said *where* a row lived, so a legal
suggestion was indistinguishable from an illegal one) and priced the revive off
the board instead of at a flat 3,000. The adversarial verifier then refuted it
on three counts, all of them about **advice the player never actually got**.
This pass is those three.

---

## F1 — the answer was on the card and off the screen

`move-advisor.css` caps the card at 104px, `ffx/hudSafeZones.ts` hands the FFX
HUD its own `maxHeight`, and the card scrolls with no scrollbar and a mask fade.
With a second suggestion it wanted 162px, so "stand Yuna up" faded out below the
frame. Neither file is this track's, so the card does the fitting itself.

**What it does now.** `MoveAdvisor.fitCard` measures the content against the cap
— read off the *computed* `max-height`, which is where both owners' values land
— and walks a seven-rung density ladder, printing less until it fits. The order
is decoration first: the one-line effect descriptions, then the runner-up's
numbers, then the lead's, then the lead's reason, and at the last rung two named
moves and the board's note. A move's name, the submenu it lives in, the
runner-up's *reason* and any warning survive every rung but the last.

Three things about that fit were wrong on the first attempt at it, and each was
found by measuring the built preview rather than by reasoning:

| what | why it was wrong |
|---|---|
| keyed off `clientHeight` | that is the *content's* height whenever the cap is not biting, so the key changed every time the fit did |
| ran after `layout()` | `layout()` writes one width and the HUD's `placeAdvisor` overwrites it a moment later; the card was fitted 180px wide and painted 112px wide |
| re-fitted per frame, both directions | the safe zone is solvable on some frames and not on others, so the card is painted at ~200px, ~180px and ~112px several times a second, and the fit dropped and restored a whole sentence while the player read it |

So the fit now runs **before** `layout()` (measuring the box that was actually on
screen), keys off `(advice, cap, width)`, and is **monotone within a decision** —
it gives things up and never takes them back until the next decision opens.

The note — the "raise her after it lands" sentence — also **moved above the
moves**. Whatever cuts this card cuts its bottom, and that sentence is the whole
answer to "what about reviving Yuna?".

## F2 / F3 — the forecast the game never had

`AdvisorOptions.intent` existed and nothing passed it. `FFXBattleHud` builds its
card with `new MoveAdvisor({ game, anchors })` and no options at all;
`FFX2BattleHud` passes registries and no `intent`. So the telegraphed-re-kill
rule was green in unit tests that injected a forecast by hand and **dead in the
game** — the intent slab announced "Lance of Atrophy · Zombie 50%" over
Seymour's head while the card underneath offered a Mega Phoenix and said nothing.

Wiring it is one line in each HUD and both are other tracks' files this round —
but the advisor does not need the HUD. `src/engine/tactics/advisor-forecast.ts`
derives the forecast from the `BattleState` the advisor already holds:

* **FFX** rebuilds a `Ctx` the way `simulate.ts` does and runs the engine's own
  `predictEnemyIntent` against it. Every input the AI scripts read is in the
  public state — Seymour's whole six-step cycle is `state.flags['seymour.p1Step']`.
* **FFX-2** needs no rebuild: `Ffx2IntentEnv` is a state, an RNG and the two
  registries `FFX2BattleHud` already passes.
* CTB counters are not in `BattleState`, and for this question they do not have
  to be: a revived character re-enters at **three times their base counter**
  (`turnQueue.ts:156`), so every living enemy acts before they do and what
  decides whether the raise survives is the *worst* of them. That is what the
  module returns.
* It runs only when somebody is actually on the floor, at 3 samples an enemy.
* `AdvisorOptions.intent` still wins when a HUD passes one — that source reads
  the live CTB counters and AI memory, which a state-only rebuild cannot.

**And the rule had to be tightened to survive contact with the real script.**
Two of Seymour's three phase-1 turns are Lance of Atrophy and it picks **one
random living target**; the old rule refused a revive whenever the forecast
*named* a re-kill move, which would have left the summoner on the floor two
turns out of three. A refusal now needs a guaranteed re-kill — something aimed
at the body on the floor and lethal there, or a sweep reaching two or more
living allies for at least what the raise gives back (measured from the
simulation's own `hpDelta`, so a Phoenix Down's sliver and a Mega Phoenix's full
bar are told apart). A `'likely'` branch never refuses. Anything short of that
is a **caution** printed beside the revive — the revive is still recommended,
and the card says what is coming:

> Mega Phoenix → the party · in Items
> *Only Yuna can call an aeon, revive or heal — stand Yuna up.*
> **Seymour Flux uses Lance of Atrophy before Yuna can act.**

## (c) Plain words — unchanged from pass 1

`chapter line` → **Guide's pick**; no `§`/`ffx-` citation on the card (they stay
in the strategy guide panel, which is where a player goes to ask *why*); every
row carries the submenu it lives in.

---

## How it was verified

* `npx tsc --noEmit` — clean.
* `npx vitest run tests/unit/advisor-forecast.test.ts advisor-ownership.test.ts
  advisor.test.ts advisor-simulate.test.ts ui-move-advisor.test.ts
  strategy-guide.test.ts` — **97 passed**, including the property test that
  replays all five chapters under the shipped tactics and seeded random legal
  play (300+ decisions each, both engines) with zero illegal suggestions.
* New tests that pin this round's three failures:
  * `advisor-forecast.test.ts` builds its advisor the way the HUDs build theirs
    — `{ ffxContent }` or `{ ffx2: { abilities, items } }`, **never** an
    `intent` option — and drives Seymour's real cycle: the mount's Cross Cleave
    step holds the revive back and says when, a Lance of Atrophy step still
    offers it with the telegraph beside it, a Dispel step says nothing.
  * `ui-move-advisor.test.ts` adds the density ladder (shorter at every rung,
    and at no rung missing a move's name, its submenu, the revive's reason or
    the note), the fit loop against a cap, the monotone-within-a-decision rule,
    and **the FFX HUD's own card** — `new MoveAdvisor({ game, anchors })`, no
    options — answering on a real Chapter 1 board.
* **Real input, real browser.** `npx vite build` into a scratch dir, `vite
  preview` on port 5716, Playwright chromium with `tools/screenshot.mjs`'s
  `CHROMIUM_ARGS`, real `Enter` presses to walk turns until the open menu is
  Tidus's, with Yuna held at 0/1500 and `seymour.p1Step` pinned so the forecast
  under test is a named step of the real script. Both servers stopped
  afterwards; nothing on :8188 or :8890 was touched.

| shot | what it shows |
|---|---|
| `docs/screenshots/fix3/advisor/05-baileys-board-fixed.png` | Bailey's board, the whole card on screen: **Hastega → the party · GUIDE'S PICK · in White Magic**, then **2 · Mega Phoenix → the party · in Items · +1,500 · cures KO**, *"Only Yuna can call an aeon, revive or heal — stand Yuna up"*, and in red *"Seymour Flux uses Lance of Atrophy before Yuna can act"* — while the intent slab above says Lance of Atrophy. No citation, no "chapter line". |
| `06-wait-note-full.png`, `07-wait-note-card.png` | the mount's Cross Cleave step: no revive offered, and the card leads with *"Cross Cleave hits the whole party next — take it first, then raise Yuna."* |
| `08-hud-shelf-24px.png` | the open defect below: the same card in the HUD's 24px shelf. |
| `09-960x540.png` | the small viewport. |

Measured on the preview at 1280x720, Bailey's board, over 60 frames: content 67px
against a 104px cap, **0 frames overflowing** (round 1 measured 162 against 103,
every frame).

One disclosure about `05-baileys-board-fixed.png`: the HUD's per-frame tick was
silenced in the page for the length of the capture (`hud.update = () => {}`),
because of the open defect below — the card is re-placed several times a second
and a screenshot of a WebGL page never lands where the probe looked. Nothing
about the card's own content or fit was touched, and the measurements above are
from the un-frozen page.

---

## What is left — for other tracks

1. **`ffx/hudSafeZones.ts` + `FFXBattleHud.placeAdvisor`: the shelf is a box
   nothing fits in, and the card teleports.** Owner: the FFX HUD track. Measured
   on the built preview, Chapter 1, Tidus acting, at 1280x720 and 1600x900:
   * `advisorZone` returns `kind: 'shelf'` on many turns (the pocket does not fit
     and the Sensor card's bottom edge becomes the shelf's ceiling), with
     `maxHeight` between **24px and 45px**. The advisor's tersest possible card —
     head, actor, two named moves — is **47px**. `MIN_ADVISOR_HEIGHT` is 28;
     it wants to be about 72, with the shelf declining rather than returning a
     box that small.
   * On the same board `placeAdvisor` alternates between finding a zone and
     finding none **several times a second**, so the card jumps between the
     shelf and its own bottom-right placement, changing size as it goes. Worth
     a hysteresis or a held zone.
   * With a cap of 104 (the pocket, and the stylesheet's own value) everything
     fits and the answer is on screen; this is only about the shelf.
2. **`move-advisor.css`** (presentation track), optional now rather than
   blocking: `.mad__warn--lead` is a new hook for the note that sits under the
   head, and the `in <submenu>` chip could carry a quieter weight than the
   damage chips.
3. **Wiring `AdvisorOptions.intent`** is no longer needed for correctness, but a
   HUD that passes its live source still gives the advisor a better forecast
   (real CTB counters and AI memory):
   ```ts
   advisor: () => ({ ...registries, intent: () => this.enemyIntent.view() }),
   ```
4. **A judgement call for Bailey.** The chapter's own line still tops the card,
   so on turn one the revive is the runner-up rather than the pick. That is
   `seymour-flux.ts`'s ordering, not the advisor's, and the advisor follows it
   automatically if it changes.

## One housekeeping note

`node_modules/jsdom/lib/generated/idl/CSSNestedDeclarations.js` was found
**corrupted with binary garbage** mid-session (every jsdom test in the repo
failed to start with `SyntaxError: Invalid or unexpected token`). Repaired with
`rm -rf node_modules/jsdom && npm install --no-save --ignore-scripts
jsdom@29.1.1`; `package.json` and the lockfile are untouched. Worth knowing
given this machine's week — see the crash-diagnosis notes.
