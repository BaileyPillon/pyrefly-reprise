# fix3 — advisor track

Owner files: `src/engine/tactics/advisor.ts`, `src/ui/common/MoveAdvisor.ts`
(text and logic only), `tests/unit/advisor*`. New this round:
`src/engine/tactics/advisor-revive.ts`, `tests/unit/advisor-ownership.test.ts`.

Commit: `bab0b29` — *Advisor: own the move, price the revive, drop the research voice*.
`src/engine/tactics/guide.ts` was **not** touched; the citation plumbing did not
need it (the card simply stops printing what it was already carrying).

---

## The report

Bailey, on the live build (`88e5b64`), Chapter 1, Tidus acting, Yuna KO at
0/1500, Kimahri on the field. The NEXT BEST MOVE card said:

> **Tidus** — Poison Fang → Seymour Flux · `CHAPTER LINE` · *ffx-seymour-flux §6 rows 5-6*

> "im controlling tidus but the advisor is telling me to use poison fang? how
> does that make sense? and what about reviving yuna?"

## What was actually happening

Reproduced against the real Chapter 1 engine (Tidus's own decision, Yuna forced
to 0 HP). **Poison Fang is not Kimahri's Ronso Rage in this game — it is a
thrown item**, `poison-fang` in `src/data/ffx/items/offensive-1a.ts`, and
`gagazetBuild.inventory` stocks five of them. It was row 33 of 42 on Tidus's own
menu, inside Items. `seymour-flux.ts` step 2 picks it up with
`row(commands, ['Poison Fang'], boss.id)` — always from the acting character's
own rows — so the suggestion was legal the whole time.

The defect was therefore **not** that the card named somebody else's move. It
was that the card gave the player no way to tell:

* it printed a bare label with no hint of which submenu the row lived in, so a
  thrown item read exactly like another character's ability;
* nothing in the code actually *enforced* the promise, so "the card only ever
  names rows this actor can press" was a convention, not a guarantee;
* and it said nothing at all about the summoner lying on the floor, which is
  the part of the report that was a real ranking bug.

## (a) Ownership — closed

New `ownedRow(commands, command)` in `advisor.ts` is the hard gate. A row counts
as this actor's only when it is in **this** decision's list, is `enabled`,
matches on ability/item id (and, for a switch, on the incoming member), and can
reach every target the command aims at. `guide.ts`'s `rowFor` is deliberately
looser — it matches kind+id so the *panel* can label a greyed-out row — and that
looseness is no longer used by the card.

* `tacticSuggestion()` validates the chapter line through `ownedRow` before it
  does anything else.
* When the line names a move this actor does not own, `handOff()` looks for the
  living member who knows it (from their own `learnedAbilityIds` /
  `unlockedOverdriveIds`) and offers **the switch to that character** — but only
  when a switch row is enabled and `switchValue()` clears `SWITCH_PENALTY`, the
  same bar every other switch is held to. Otherwise it returns `null` and the
  card falls back to the simulated ranking for whoever is actually standing
  there.
* `buildAdvisorView` filters the final list through `ownedRow` as well, so a
  stale candidate or a re-aimed tactic cannot slip past.
* Every suggestion now carries `menu` (the submenu, from the row's own
  `category`) and the card prints it: **"Poison Fang · in Items"**.

## (b) Revive value — now read off the board

`REVIVE_VALUE`'s flat `3_000` is gone. `src/engine/tactics/advisor-revive.ts`
prices a revive from four readings:

| reading | how |
|---|---|
| what the party loses while they are down | `capabilityLoss()` — the fallen member's own `learnedAbilityIds` against every living member's, over five families (revival, healing, cleansing, warding, hasting). Deliberately *learned* abilities only: Kimahri's White Wind and Mighty Guard are Ronso Rages off a one-shot gauge, not something he can press on the turn the healer goes down. |
| their role | `PARTY_ROLES` (`src/ui/common/party-roles.ts`, read-only). Summoner is worth the most — the summon rows are gated on Yuna's id inside `battle/ffx/commands.ts`, so no ability list can see it. |
| how far the party has collapsed | per additional downed active, plus a bonus when only one is still standing. |
| whether the raise survives | `reviveRisk()` — see below. |

Chapter 1 with Yuna down: 2,500 base + four lost families (4,800) + Summoner
(2,500) = **9,800**, against ~2,600 for the best thing Tidus can throw and
20,000 for finishing the boss. So a revive outranks every plain attack and never
out-argues a kill. `reviveValue()` is pure and unit-tested at both ends.

**Whether *this* actor can revive** needs no extra code: the advisor only ever
prices rows the acting character was offered, so a Phoenix Down with none in
stock, or a Life she has not learned or cannot pay for, never reaches the
scorer. What *was* needed is `orderedRows()` — `MAX_SIMULATIONS` caps a menu at
sixty previews and Tidus is offered forty-two rows, so the revive is now
simulated first while anyone is down rather than risking the cap.

**Safety.** `reviveRisk()` refuses to recommend a raise into a guaranteed
re-kill, from three signals, none of which needs the live engine:

1. the body is still a **Zombie** (Zombie survives KO here on purpose), so
   raising it hands the Mortiorchis's Full-Life its guaranteed kill —
   `seymour-flux.ts` step 4 leaves that body down for the same reason;
2. a **charge counter at 0 or 1** in the log — the Total Annihilation case;
3. the **enemy-intent forecast**, when the HUD supplies one, says the next
   action is aimed lethally at the revive target or is a named re-kill move
   (Lance of Atrophy, Full-Life, Total Annihilation, Death).

When it fires, the revive's value is cut to 15% and the card prints **one plain
sentence** in `AdvisorView.note` saying when to spend the turn instead —
e.g. *"Seymour Flux uses Lance of Atrophy next and Yuna would go straight back
down — raise Yuna once it has landed."* The revive is not offered on that board.

**Where the revive shows up.** The chapter's own line still tops the card
(rule 1 of the module header: the advisor and the auto-battler must never teach
different fights). When an ally is down and the top row is not the revive, the
revive is the **runner-up** with a plain reason. "Suggest switching rarely" and
"top two when the best is a switch" are unchanged.

## (c) Plain words — done

* `chapter line` → **`Guide's pick`**.
* The research citation (`ffx-seymour-flux §6 rows 5-6`) is **no longer printed
  on the card**. `MoveSuggestion.cite` is still populated for the debug
  snapshot; the citations are still shown in the strategy guide panel, which is
  the place a player opens to ask *why*.
* `move-advisor.css` was **not** edited (not this track's file). The new chips
  reuse `.mad__stat`, and the wait sentence reuses `.mad__warn`.

## (d) Tests

`tests/unit/advisor-ownership.test.ts`, 13 tests:

* **Property test, one per chapter.** Replays all five chapters with the shipped
  tactics *and* with seeded random legal play, both FFX and FFX-2 engines,
  ≥300 decisions per chapter (seeds are added until the budget is met), and
  asserts that every suggestion on every card passes `ownedRow` against that
  decision's own command list — and that the card's actor id and name match the
  decision's. **Zero illegal suggestions.**
* **Bailey's exact board** (Chapter 1, Tidus acting, Yuna forced to 0/1500,
  Phoenix Downs in stock): a revive is first or second, its reason names Yuna
  and contains no `§`/`ffx-` citation, its `menu` is `Items`, and `note` is
  empty.
* **The same board with Lance of Atrophy telegraphed on Yuna**: the card
  explains the wait, the revive is not offered, and `reviveValue` drops below a
  third.
* Plus the Zombie-body wait, the capability-loss reading (four families lost for
  Yuna, none for Wakka), and `ownedRow`'s four refusals.

## How it was verified

* `npx tsc --noEmit` — clean.
* `npx vitest run tests/unit/advisor.test.ts tests/unit/advisor-simulate.test.ts
  tests/unit/ui-move-advisor.test.ts tests/unit/strategy-guide.test.ts` — 67
  passed. The pre-existing "tops the card with the chapter line" guarantees
  still hold.
* `npx vitest run tests/unit/advisor-ownership.test.ts` — 13 passed.
* **Real input, real browser.** `vite build` snapshot served by `vite preview`
  on port 5612 (the dev server was unusable: other agents are editing this tree
  and HMR kept reloading the page mid-run). Playwright drove Chapter 1 through
  the debug API with Yuna held at 0/1500, to a Tidus turn with the command menu
  open — the board on Bailey's screenshot, down to `ITEMS x27`. Both servers
  stopped afterwards.

| shot | what it shows |
|---|---|
| `docs/screenshots/fix3/advisor/01-tidus-turn-yuna-down-full.png` | Bailey's board reproduced: Tidus acting, Yuna 0/1500, Kimahri up. Card: **Hastega → the party · `GUIDE'S PICK` · in White Magic**, and **2 · Mega Phoenix → the party · in Items** — *"Yuna is the only one left who can call an aeon, revive or heal — stand Yuna up."* No citation anywhere on the card. |
| `.../02-card-closeup.png` | the same card, close up. |
| `.../03-holy-water-board-full.png`, `.../04-holy-water-board-card.png` | a second Tidus turn, Zombie on him: **Holy Water → Tidus · `GUIDE'S PICK` · in Items**, with **2 · Phoenix Down → Yuna · in Items** underneath. The chapter's cure still leads; the revive is no longer invisible. |

## What is left / requests for other tracks

1. **Wire the intent forecast into the advisor.** `AdvisorOptions.intent` is a
   new optional `() => AdvisorIntent | null`, a *structural subset* of
   `ui/common/EnemyIntent.ts`'s `IntentView`, so the HUD owners can pass their
   existing source with no adapter:
   ```ts
   // FFXBattleHud / FFX2BattleHud, where `advisor:` options are built
   advisor: () => ({ ...registries, intent: () => this.enemyIntent.current() }),
   ```
   Without it the advisor still refuses a revive into a Zombie body or a charge
   landing this turn (both read from `BattleState`), but it cannot see a
   telegraphed Lance of Atrophy. **Owner: the HUD / enemy-intent track.**
2. **`move-advisor.css` — the card is taller now and it shows.** On
   `01-tidus-turn-yuna-down-full.png` the second suggestion's last line
   ("stand Yuna up.") is clipped at the bottom of the stage: two suggestions no
   longer fit in the band `MoveAdvisor.layout` puts the card in. The card
   scrolls, so nothing is lost, but the runner-up should not need scrolling to
   be read. Three options, all in the stylesheet: a tighter `.mad__move--alt`
   (smaller type, less padding), a `max-height` with the anchor moved up, or
   `flex-direction: column-reverse` so the card grows upward from
   `anchors.bottom`. The same file could give the new "in Items" chip a quieter
   weight than the damage chips and the card-level `.mad__warn` note a little
   top margin. Not this track's file. **Owner: the presentation track.**
3. **A judgement call worth Bailey's eye.** The chapter's own line still sits at
   #1 and the revive at #2, because `seymour-flux.ts` puts the turn-one openers
   *above* the revive on purpose and with measurements behind it (its step 2 vs
   step 4 comments). If Bailey wants the revive to lead on that board, that is a
   change to the tactic's ordering, not to the advisor — and the advisor will
   follow it automatically. **Owner: the Chapter 1 tactic.**
