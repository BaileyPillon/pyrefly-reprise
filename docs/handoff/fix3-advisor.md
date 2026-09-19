# fix3 — advisor track

Owner files: `src/engine/tactics/advisor.ts`, `src/ui/common/MoveAdvisor.ts`
(text and logic only), `tests/unit/advisor*`, `tests/unit/ui-move-advisor.ts`.
New across the three passes: `src/engine/tactics/advisor-revive.ts`,
`src/engine/tactics/advisor-forecast.ts`, **`src/engine/tactics/advisor-menu.ts`**,
`tests/unit/advisor-ownership.test.ts`, `tests/unit/advisor-forecast.test.ts`,
**`tests/unit/advisor-menu.test.ts`**. `guide.ts` was never touched: the
citation plumbing did not need it — the card simply stops printing what it
already had.

Commits, pass 1: `bab0b29`. Pass 2: `a6e344a`, `703b422`, `01d4f6c`, `3aa5440`.
Pass 3 (this document): `c97cde8`, `2ee49a9`.

---

## The report

Bailey, on the live build, Chapter 1, Tidus acting, Yuna KO at 0/1500, Kimahri
on the field:

> "im controlling tidus but the advisor is telling me to use poison fang? how
> does that make sense? and what about reviving yuna?"

Pass 1 answered the ownership half (Poison Fang turned out to be a thrown item
on Tidus's own Items list) and priced the revive off the board. Pass 2 got the
answer onto the screen and gave the advisor its own enemy forecast. Pass 3 is
about the mechanism pass 2 introduced to answer *"how does that make sense?"* —
the **"in &lt;submenu&gt;" chip** — which turned out to be FFX's words painted
over FFX-2's menu.

---

## F1 / F2 — one menu table for two different games

`advisor.ts`'s `MENU_WORDS` was a single FFX-worded table consulted for both
engines. The critic measured it: **49 of 67 FFX-2 suggestions named a submenu
that is not on the FFX-2 menu** (bahamut 27 wrong / 17 right, vegnagun-shuyin
22 wrong / 1 right; all three FFX chapters 0 wrong / 215 right). The card said
`Magic Break → Bahamut · GUIDE'S PICK · IN SPECIAL` while the stack painted
three inches to its right read `ATTACK / SKILL / GUNNER / BLACK-MAGE / ITEM`.
There is no `SPECIAL` row in X-2; Magic Break is under `SKILL`.

And the words were only half of it. FFX-2's command window **collapses a
category holding exactly one row into a top-level leaf** with no submenu at all
(`ui/ffx2/CommandMenu.ts:169`) — which is why `GUNNER` and `BLACK-MAGE` are
their own rows up there — and its spherechange row is titled **Change**, not
`Dressphere` and not the outfit's name, because in X-2 you open the Garment
Grid and pick the destination inside it [visual-bible §4.5.2].

**The fix is `src/engine/tactics/advisor-menu.ts`**, which models each game's
real grouping rule separately, keyed off `state.game`, per Bailey's standing
rule that a change true to one game is not applied to the other unless it is
true there as well:

| | FFX (`ui/ffx/CommandMenuLogic.ts#buildTopRows`) | FFX-2 (`ui/ffx2/CommandMenu.ts#groupRows`) |
|---|---|---|
| a lone row in its category | **still a submenu** — `WHITE MAGIC` whether Yuna knows one spell or twelve | **collapses to a top-level leaf**, no chip |
| the character command | `Special` / `Skill`, as the build files it | `Skill` |
| items | `Items` | `Item` |
| the bench | every reserve collapses into one `Switch` group, which opens even for one member | no bench in X-2 |
| the outfit | — | always `Change`, even at a single destination |
| Attack / Escape / Trigger / Dismiss | top-level rows, **no chip** | Attack is usually alone in its category, so also no chip |

## F3 — "Attack · in Attack"

2,727 of the sampled suggestions told the player to open a menu that *is* the
row they were standing on. Attack is a direct top-level row in both games, so
its chip is now the empty string — and the empty string is as load-bearing as
the word, which is why `advisor-menu.ts` returns it deliberately rather than by
falling off the end of a lookup table.

## What the chip exposed on the way past — FFX has no Defend row

Checking the chip against the painted stack turned up a worse version of the
same defect, in FFX, which the round-2 verifier's matcher could not see because
it checked `decision.commands` rather than the stack: **`buildTopRows` drops
`defend` outright** (`CommandMenuLogic.ts:98` — it is a base action reached by
an affordance, not an entry in the list) **and no affordance is wired**. There
is no key in the shipped game that presses Defend in FFX. The engine still
offers the row, so the card could recommend it.

Chapter 2's line uses Defend deliberately and with numbers behind it
(`tactics/yunalesca.ts:213`: *"150 wins with Defend against 131"* while the
party is Zombie and waiting for Hellbiter). So this is a **menu gap, not a
tactic to argue with** — but the card may not answer "what do I press" with
something that cannot be pressed. `onTheMenu()` drops it, the hard gate in
`buildAdvisorView` enforces it, and on those decisions the card gives the best
row that *is* on the stack. See the request below.

## The judgement call from round 2 — left to Bailey, deliberately

The verifier flagged, correctly, that on Bailey's exact board the advisor's own
arithmetic prices the Mega Phoenix at **11,300** and the chapter's line
(Hastega) at **555**, yet the card still leads with Hastega, because
`tacticSuggestion` pins the chapter line to row 1 and the revive is row 2. The
revive *is* on the card, with its reason and its warning, and the card says
which one is the guide's pick — so the player is not misled. Changing it means
deciding that a 20x score gap may outrank the chapter's own line, which is a
design decision about what the advisor is *for*, not a defect, and it would
make the advisor and the auto-battler teach different fights. **Not changed
this pass. It is a question for Bailey**, and the one-line change if the answer
is yes is in `buildAdvisorView`: let the ranking win when
`legal[0].score > tactic.score * N`.

---

## How it was verified

* `npx tsc --noEmit` — clean. (One pre-existing break inside this track's own
  `advisor-forecast.ts` was repaired on the way: `FFXRuntime` gained a
  `progress` field for the engine's new stalemate watchdog and the rebuilt
  runtime did not set it.)
* `tests/unit/advisor-menu.test.ts` — **new, and it does not check the chip
  against a table.** It renders FFX's stack through `buildTopRows` (the logic
  `ui/ffx/CommandMenu.ts:244` draws from) and **FFX-2's through
  `openCommandMenu` itself, in jsdom, reading the labels back out of the DOM it
  produced**, then replays all five chapters at three seeds under both the
  shipped tactics and seeded random play and asserts, on every suggestion:
  a chip names a row that is on the stack and is never the row itself, and an
  empty chip means the row is on the stack already. Plus six unit tests pinning
  each rule one at a time.
  **Counter-check:** putting the old shared table back turns **8 of its 11
  tests red**, including "in Special" on both FFX-2 chapters and
  "in Attack (its own row)" on Yunalesca and Braska's Final Aeon.
* `tests/unit/advisor.test.ts` gained `declines a chapter line the FFX command
  window does not paint`, and its walk now asserts on every decision of every
  seed that no suggestion is ever a `defend`.
* `tests/unit/advisor-note.test.ts` — three of its reproductions were pinned to
  `seen.cards[3]` / `[4]` of one RNG stream and had gone red **on main**, with
  no rule having changed: `712f6e7` gave Kimahri his Talk row back and the
  board shifted by exactly one decision. They are keyed off what the card says
  now. A test that describes a seed rather than a rule trains everyone to
  ignore red.
* Targeted suites green: `advisor-menu`, `advisor`, `advisor-ownership`,
  `advisor-forecast`, `advisor-simulate`, `advisor-note`,
  `ui-move-advisor`, `guide-advisor-target-agreement`.

### Real input, real browser

`npx vite build` into a scratch dir, `vite preview` on **port 5647**, Playwright
chromium with swiftshader, real `Enter` / `ArrowDown` presses; the card's own
`view()` read out of the live HUD and compared against the `innerText` of the
command stack element that was actually visible. Server stopped afterwards;
nothing on :8188 or :8890 touched.

**The two boards the round-2 verifier refuted the fix on, re-run unchanged:**

| shot / probe | what it shows |
|---|---|
| `docs/screenshots/fix3/advisor/pass3/ffx2-paine-1280x720-full.png` | the critic's first reproduction, `--chapter=ffx2-bahamut --actor=paine`. Card: **Magic Break → Bahamut · GUIDE'S PICK · IN SKILL**. Stack painted beside it: `ATTACK / SKILL ◂ / CHANGE (CURSED) ◂ / ITEM ◂`. It said `IN SPECIAL` before. `ATTACK` is a leaf with no arrow — the collapse rule, live — and it carries no chip. |
| `…/ffx2-rikku-ko-1280x720-*.png` | the second reproduction, `--chapter=ffx2-vegnagun-shuyin --actor=rikku --ko=yuna`. Card: **Mega Phoenix → the party · GUIDE'S PICK · IN ITEM**, reason *"Only Yuna can call an aeon — stand Yuna up."*, warning *"Vegnagun uses Tail Beam before Yuna can act."* Stack: `ATTACK / SKILL / CHANGE / ITEM`. It said `IN ITEMS` before. |
| `…/ffx-tidus-yuna-ko-1280x720-full.png` | Bailey's own board, unfrozen: Tidus acting, Yuna **0/1500**, Kimahri up, the intent slab reading *Lance of Atrophy*. Card: **Hastega → the party · GUIDE'S PICK · IN WHITE MAGIC · 30 MP**, then **2 · Mega Phoenix → the party · IN ITEMS · +1,500**, *"Only Yuna can call an aeon, revive or heal — stand Yuna up."*, *"Seymour Flux uses Lance of Atrophy before Yuna can act."* Stack: `TALK / ATTACK / SPECIAL ×4 / WHITE MAGIC ×3 / ITEMS ×27 / FLEE`, and `SWITCH ×4` after the arrows. FFX's words on FFX's menu — **and no Defend row anywhere on it**, which is defect 1 below, photographed. |

Metrics on Bailey's board, unfrozen: `scrollH 99 = clientH 99`, `clipped false`,
bottom 52px inside the viewport. The 1600x900 run of the Rikku board produced
its probe (card text + painted stack, quoted above) but its full-page
screenshot timed out in the WebGL compositor twice; the 1280x720 run is the one
filed. The card's *element* shot and its full-page shot on Bailey's board show
different density rungs of the same card, which is defect 2 below — the card is
re-placed several times a second — not a difference in what it says.

---

## What is left — for other tracks

1. **`ui/ffx/CommandMenuLogic.ts` + `FFXBattleHud`: FFX has no way to Defend.**
   Owner: the FFX HUD track. `buildTopRows` filters `defend` out and nothing
   else offers it, so a base action `ffx-combat-core` §1.3 ranks 2 is
   unreachable, and Chapter 2's researched stall line is something only the
   auto-battler can play. Either paint the row or wire the affordance; the
   advisor follows automatically the moment `onTheMenu` can say yes.
2. **`ffx/hudSafeZones.ts` + `FFXBattleHud.placeAdvisor`: the shelf is a box
   nothing fits in, and the card teleports.** Unchanged from pass 2 —
   `advisorZone` returns a `maxHeight` between 24px and 45px against a tersest
   possible card of 47px, and `placeAdvisor` alternates between finding a zone
   and finding none several times a second.
3. **`move-advisor.css`** (presentation track), optional: `.mad__warn--lead` is
   a hook for the note under the head, and the `in <submenu>` chip could carry a
   quieter weight than the damage chips — it is now genuinely rarer, since every
   top-level row prints none.
4. **Wiring `AdvisorOptions.intent`** — not needed for correctness (the advisor
   derives its own forecast), but a HUD passing its live source gives a better
   one: `advisor: () => ({ ...registries, intent: () => this.enemyIntent.view() })`.
5. **The judgement call above**, for Bailey.
