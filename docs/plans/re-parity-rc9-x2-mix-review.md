# Paper preflight: RC9, FFX-2 Mix, step one: the recipe resolver and the 53 result rows (lane X2-G, branch `re-parity-rc9-x2-mix`)

> AGENTS.md rule 15, `critic/RUBRIC.md` §4: paper only, written before the build. The change set is under `src/battle/ffx2`, which the 2026-10-11
> wiring plan classes **DEEP**; nothing here deploys without Bailey's own words.
>
> **Owner's words.** 2026-10-08 "It needs to be a 1:1 parity."; 2026-10-11 "ok keep going ill go with all your recommendations please" (the blanket yes
> that D-769 and addendum Q16 rest on); 2026-10-13/15 "so it can go in live builds asap", "keep going full speed ahead", "all of this reverse
> engineering needs to be incorporated into our game". **Q16 (recorded by the release driver): FFX-2 Mix is built in two steps. The rules and the data
> come first (this lane); the two-item picker and the effects come after the driver's mockup.**

Written 2026-10-16 for branch `re-parity-rc9-x2-mix`, cut from `origin/r50-release` (`748038a0`); see section 5 for why that base.

## 1. Game case (AGENTS.md rule 14)

**FFX-2 only.** FFX's Mix is Rikku's Overdrive with its own chart (lane FFX-H, `src/battle/ffx/kernel/mix*.ts`, 112 x 112 items); FFX-2's is the Alchemist's
command, resolved by a two-field lookup on hidden class and level bytes of its 68 items, in `FFX-2.exe` at `0x0075A470`. Nothing under `src/battle/ffx`,
`src/data/ffx` or `src/audio` is touched. Sources: the checked note `D:\Tools\ffx-parity\coverage\ffx2\FFX2-G06.md` sections 1 (item 6), 3.8, 4.2 to 4.4, 8
(checked under the method check, 2026-10-11; 5,009 harness vectors, 0 mismatches, 0 draws), the wiring-plan addendum lane X2-G
(`wiring-plan-addendum-2026-10-13.md`), and the Steam copy's `command.bin` rows read again here for the 53 result rows.

## 2. What changes, in the order built

| Slice | Game rule (note, label) | Engine today | After |
|---|---|---|---|
| **Resolver kernel** `kernel/mix-recipe.ts` | The HUD turns the two picked items into a result row before anything is queued: each item's class (`+0x86`, 0 to 17) and level (`+0x87`, 1 to 4) index an 18 x 18 signed blend matrix (`0xD61978`; 99 = no blend) and a 24 x 4 word table of result ids (`0xD61ABE`, index = level + 4 x row). No blend: the higher level supplies the result, the first item winning a tie. Blend: the matrix byte is the row and the higher level is the level. **Order matters in 496 of 2,278 unordered pairs. No failure outcome: every pair makes one of 53 rows.** An id outside the table reads row 0; the low 12 bits of the id are used [E 5,009 over all 68 x 68 ordered pairs plus 385 out-of-range ids] | nothing resolves a recipe for FFX-2; `MixResult` says "Order never matters" | a pure port, replayed against the note's vectors and the whole 4,624-pair table |
| **The 53 result rows** | The queued command is the result row (`0x3183` to `0x31B8` except `0x31AD`, misc flag `0x100000`); all 53 are cast class `0x24`, cast cost 80, ATB cost 0, and the 28 damaging ones match the research note's powers and hit counts [D] | none of the 53 rows exists in `data/ffx2/command-records/` | the 53 rows as numbers (our ids `x2-mix-*`, each cited), as `FFX2CommandRecord`s and as abilities of ours that borrow the nearest existing effect family; **no new art** (D-767 for FFX, Q16 for FFX-2) |
| **Engine wiring** `adapt/mix.ts`, `adapt/item-ledger.ts`, `execute.ts` | Both ingredients are reserved like any item (RC8's ledger: reserve at the pick, commit at the start gate, refund on every way out of the queue, cap 99); the cast is the result row's (80), not the Mix stub's | a Mix that carries two items does nothing; the ledger reserves one item per pick | a Mix command that carries `extra: { kind: 'rikku-mix', mix: { ingredients } }` resolves to its result, holds both ingredients, charges the result's cast and fires its effect; a Mix without two known items is unchanged (nothing happens, nothing is spent) |

## 3. Decisions made on paper (each one is a boundary or a stand-in, not a game number)

1. **The picker is not built.** Q16: the screen waits for the driver's mockup. A human Alchemist's Mix row still opens the `rikku-mix` overlay, which the FFX-2 HUD
   cannot open (it rejects, and the presenter's bare re-submit runs the Mix with no items, as it does today). The engine takes the items the way the Minigame
   protocol already carries any outcome: `extra` on the command. The picker, when it exists, returns exactly that.
2. **The ids.** The result rows are `x2-mix-<name>`; the 68 ingredient items are `x2-<name>`, the catalog's own convention (the ones the catalog already has keep
   their ids). Names come from the research table (`research/ffx2-combat-core.md` 3.11) by position, the note's own label [I]; inside a group of rows that share a class and a
   level (the four first-aid items, the two smaller bombs, the four status grenades, the four Greens) the order of names cannot move any result.
3. **No failure.** The note finds none. A Mix whose items the engine cannot name (a test rig's id outside the 68) is not a Mix: it resolves as the bare Mix does today.
4. **What stock means.** A tracked ingredient is reserved; an untracked one (no `inventory:<id>` flag) is free, as an untracked item is; the same item twice needs two
   in stock; a pick the reserved stock cannot make is refused with the turn unspent (as `submit` refuses an item), and the net below it (a script, a held command) aborts the
   action, refunds what it took and says so.
5. **No new draws.** The resolver and the reservation draw nothing (0 draws in 357,509 vectors); a single-target result with no named target picks on the engine-side stream,
   exactly as every other ability does.
6. **Contracts.** `MixResult`'s doc comment (`battle/common/types.ts`) says order never matters and a null result is a missing recipe; both are FFX-only truths. The
   comment is corrected for FFX-2 and the change is recorded in `docs/CONTRACT-CHANGES.md` (no field changes shape).
7. **Not touched, and why.** The Alchemist passives (Chemist, Elementalist, Physicist) are read by nothing in the engine today; whether they double a Mix result is unread
   in the note. The result rows' `casterAnim` charge and the ATB cost are the rows' own.

## 4. Acceptance cases

1. Kernel: the note's 400 vectors, the whole 68 x 68 table (4,624 answers of the real function), the 385 out-of-range ids (the note's oracle), the table counts the note
   states (1,060 through the matrix, 992 ties, 2,572 by level, 496 order-dependent unordered pairs, 53 distinct results), the worked cases (Hero Drink and Potion in both orders;
   Fire Gem and Arctic Wind in both orders; Holy absorbing), and an **independent oracle**: the wiki's Priority and Type algorithm restated from the research table, equal on
   4,622 of 4,624 ordered pairs, the two it differs on being exactly the note's section 8 item 3.
2. Data: the 53 records equal the Steam rows field for field (a numbers-only fixture read from the three copies of `command.bin`, which agree); one ability per row, ids unique, the
   targeting and flags agree with the row's bits, every row draws an existing spell effect, no new art; `data-ffx2-citations` passes.
3. Engine: independent oracle (the fixture's table and the rows' numbers, not the kernel): generated pairs, every one of the 53 results reached; both ingredients leave the stock at the
   pick, stay spent when the cast fires, come back (cap 99) on a KO, Stop, Petrify, ejection and magic cancel; the same item twice needs two; a pick the stock cannot make is refused;
   order changes the result; a claimed `resultAbilityId` is ignored; a bare Mix and an unknown item do nothing and spend nothing; the heal, damage and status effects land on the right side;
   no draw.
4. Mutation pass of about 20 one-line faults, each killed by a named test.
5. `tsc --noEmit` clean; the goldens and the RC8 measurement identical (a shipped line never mixes: measured on the base, 12 seeds on every FFX-2 chapter, no `x2-alchemist-mix`
   use in any); `node tools/orphans.mjs` shows the kernel reached; every file under 400 lines.

## 5. Base, order and size

**Base: `origin/r50-release` (`748038a0`), not the worktree's checked-out `re-parity-rc9-ffx-rewards`.** The brief's condition: use the RC8 item ledger if it is on the base, else
base on r50. `git merge-base --is-ancestor origin/re-parity-rc8-x2-end-ledger HEAD` is false for the worktree's branch (it is 89 commits behind r50), and true for `origin/r50-release`,
so the ledger (`kernel/item-ledger.ts`, `adapt/item-ledger.ts`, `execute.ts` reserve and commit) is only there on r50. Order: preflight, kernel and fixtures, the 53 rows, the wiring, the
engine test, the mutation pass, the measurement, the handoff. Size L for the rules and data, as the addendum says (the effects and the picker are step two).
Files near the limit: `engine-core.ts` 396 and `engine.ts` 368 take only a one-for-one swap of an existing check; `execute.ts` 328 and `adapt/item-ledger.ts` 140 take the rest.

## 6. Risks

- The ledger's hold is one item; a Mix holds two. The hold grows an optional second id and every path that gives an item back loops over both; the existing item tests pin that a
  one-item hold keeps its exact shape.
- A result row's cast (80) is longer than an item's (40) and its ATB cost is 0: a Mix is a spell-class command. That is the row's own numbers, not a tuning.
- Step two will find that the human path needs the items a build does not carry (most of the 68 are not in any chapter's bag); that is content (rule 10) and goes to the driver.
