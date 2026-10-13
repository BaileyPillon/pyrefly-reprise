# FFX Rikku's Mix, the item bag and gil: the game's rules (re-parity RC7, lane FFX-H)

**Game case: FFX only.** FFX-2 has its own Alchemist Mix, resolved through hidden Priority and Type fields on its items in its own exe; none of this applies to it.
Source: the Steam HD build 25501027 of FFX.exe (SHA-256 0537B2A1...686D) and the install's own kernel tables, read for the private working note FFX-G05 (sections cited
below); every function named here was run as the real machine code in an x86-32 emulator on the vector volumes given and agreed with an independent model on all of them.
Numbers and our own words only: no decompiled code and no game text (a result's name is the name the data layer already uses). The wiring is in
[`docs/handoff/re-parity-rc7-mix.md`](../docs/handoff/re-parity-rc7-mix.md); the kernels are `src/battle/ffx/kernel/{mix-table,mix,bag,deduct,gil}.ts`.

## 1. The chart (FFX-G05 section 3.1, appendix A; emulated 12,544 ordered pairs, 0 mismatches)

- The install's combination table is a **complete** lookup of 112 x 112 cells, one per pair of the 112 items, order irrelevant: all 6,328 cells are filled, none says
  "no recipe". They produce exactly **64 results**, the 64 Mix result commands 0x308b to 0x30ca, each reachable. The data layer carried 43 of them; the other 21 are
  added in this lane (`src/data/ffx/mixes/abilities-ordnance-2.ts`, every number from the game's own command records).
- The 112 items fall into **82 groups** that behave identically as ingredients (items whose whole row of the table is the same: Antidote, Soft, Eye Drops and Echo
  Screen are one group, the four Distillers another, the nine plain stat spheres another). `kernel/mix-table.ts` keeps the 82 x 82 chart and the item to group map, in our
  ids; every one of the 6,328 cells is recovered from them.
- The result of two ingredients is the cell in the row of the larger item index and the column of the smaller (the index is the low 12 bits of the item id, item id 0x2000 + n).
  An id with no row falls to row 0 and runs on through the table's words; no real item can reach that.
- The most produced results are Super Elixir (648 pairs), Cluster Bomb (376), Chaos Grenade (363), Megalixir (357), Final Elixir (288); the rarest are Vitality and Freedom (3
  each), Grenade (6), Black Hole (9). One item twice makes a result too (Potion twice is Ultra Potion, Hi-Potion twice is Vitality, a Map twice is a Potato Masher).

## 2. The 64 results (FFX-G05 section 4.1; rank 6 and Overdrive cost 100 for every one, the Mix command itself is rank 5)

| Command | Result | Pairs | Aimed at | Formula, power x hits | Element |
|---|---|---:|---|---|---|
| 0x308b | Grenade | 6 | the opposing side, one group | fixed, 7 x 1 |  |
| 0x308c | Frag Grenade | 10 | the opposing side, one group | fixed, 16 x 1 |  |
| 0x308d | Pineapple | 64 | the opposing side, one group | fixed, 27 x 1 |  |
| 0x308e | Potato Masher | 110 | the opposing side, one group | fixed, 54 x 1 |  |
| 0x308f | Cluster Bomb | 376 | the opposing side, one group | fixed, 100 x 1 |  |
| 0x3090 | Tallboy | 242 | the opposing side, one group | fixed, 180 x 1 |  |
| 0x3091 | Blaster Mine | 102 | the opposing side, one group | fixed, 22 x 1 |  |
| 0x3092 | Hazardous Shell | 225 | the opposing side, one group | fixed, 45 x 1 |  |
| 0x3093 | Calamity Bomb | 200 | the opposing side, one group | fixed, 72 x 1 |  |
| 0x3094 | Chaos Grenade | 363 | the opposing side, one group | fixed, 146 x 1 |  |
| 0x3095 | Heat Blaster | 48 | the opposing side, one group | fixed, 8 x 5 | fire |
| 0x3096 | Firestorm | 43 | the opposing side, one group | fixed, 14 x 6 | fire |
| 0x3097 | Burning Soul | 62 | the opposing side, one group | fixed, 18 x 9 | fire |
| 0x3098 | Brimstone | 35 | the opposing side, one group | fixed, 8 x 3 | fire |
| 0x3099 | Abaddon Flame | 28 | the opposing side, one group | fixed, 18 x 3 | fire |
| 0x309a | Snow Flurry | 49 | the opposing side, one group | fixed, 8 x 5 | ice |
| 0x309b | Icefall | 42 | the opposing side, one group | fixed, 14 x 6 | ice |
| 0x309c | Winter Storm | 62 | the opposing side, one group | fixed, 18 x 9 | ice |
| 0x309d | Black Ice | 39 | the opposing side, one group | fixed, 8 x 3 | ice |
| 0x309e | Krysta | 24 | the opposing side, one group | fixed, 18 x 3 | ice |
| 0x309f | Thunderbolt | 48 | the opposing side, one group | fixed, 8 x 5 | thunder |
| 0x30a0 | Rolling Thunder | 43 | the opposing side, one group | fixed, 14 x 6 | thunder |
| 0x30a1 | Lightning Bolt | 62 | the opposing side, one group | fixed, 18 x 9 | thunder |
| 0x30a2 | Electroshock | 39 | the opposing side, one group | fixed, 8 x 3 | thunder |
| 0x30a3 | Thunderblast | 24 | the opposing side, one group | fixed, 18 x 3 | thunder |
| 0x30a4 | Waterfall | 48 | the opposing side, one group | fixed, 8 x 5 | water |
| 0x30a5 | Flash Flood | 46 | the opposing side, one group | fixed, 14 x 6 | water |
| 0x30a6 | Tidal Wave | 62 | the opposing side, one group | fixed, 18 x 9 | water |
| 0x30a7 | Aqua Toxin | 39 | the opposing side, one group | fixed, 8 x 3 | water |
| 0x30a8 | Dark Rain | 24 | the opposing side, one group | fixed, 18 x 3 | water |
| 0x30a9 | Nega Burst | 69 | the opposing side, one group | percent of current, 12 x 1 |  |
| 0x30aa | Black Hole | 9 | the opposing side, one group | percent of current, 15 x 1 |  |
| 0x30ab | Sunburst | 73 | the opposing side, one group | deal 9999, 2 x 1 |  |
| 0x30ac | Ultra Potion | 60 | the own side, one group | percent of total, 16 x 1 |  |
| 0x30ad | Panacea | 104 | the own side, one group | strength |  |
| 0x30ae | Ultra Cure | 97 | the own side, one group | percent of total, 8 x 1 |  |
| 0x30af | Mega Phoenix | 41 | the own side, one group, may be KO'd | percent of total, 16 x 1 |  |
| 0x30b0 | Final Phoenix | 87 | the own side, one group, may be KO'd | percent of total, 16 x 1 |  |
| 0x30b1 | Elixir | 16 | the own side, one random member | percent of total, 16 x 1 |  |
| 0x30b2 | Megalixir | 357 | the own side, one group | percent of total, 16 x 1 |  |
| 0x30b3 | Super Elixir | 648 | the own side, one group | percent of total, 16 x 1 |  |
| 0x30b4 | Final Elixir | 288 | the own side, one group, may be KO'd | percent of total, 16 x 1 |  |
| 0x30b5 | NulAll | 24 | the own side, one random member | magic |  |
| 0x30b6 | Mega NulAll | 82 | the own side, one group | magic |  |
| 0x30b7 | Hyper NulAll | 41 | the own side, one group | magic |  |
| 0x30b8 | Ultra NulAll | 15 | the own side, one group | magic |  |
| 0x30b9 | Mighty Wall | 62 | the own side, one group | magic |  |
| 0x30ba | Mighty G | 43 | the own side, one group | magic |  |
| 0x30bb | Super Mighty G | 200 | the own side, one group | magic |  |
| 0x30bc | Hyper Mighty G | 35 | the own side, one group | magic |  |
| 0x30bd | Vitality | 3 | the own side, one random member | magic |  |
| 0x30be | Mega Vitality | 100 | the own side, one group | magic |  |
| 0x30bf | Hyper Vitality | 99 | the own side, one group | magic |  |
| 0x30c0 | Mana | 25 | the own side, one random member | magic |  |
| 0x30c1 | Mega Mana | 148 | the own side, one group | magic |  |
| 0x30c2 | Hyper Mana | 197 | the own side, one group | magic |  |
| 0x30c3 | Freedom | 3 | the own side, one random member | magic |  |
| 0x30c4 | Freedom X | 155 | the own side, one group | magic |  |
| 0x30c5 | Quartet of 9 | 170 | the own side, one random member | magic |  |
| 0x30c6 | Trio of 9999 | 53 | the own side, one group | magic |  |
| 0x30c7 | Hero Drink | 93 | the own side, one random member | magic |  |
| 0x30c8 | Miracle Drink | 232 | the own side, one group | magic |  |
| 0x30c9 | Hot Spurs | 48 | the own side, one group | magic |  |
| 0x30ca | Eccentrick | 86 | the own side, one group | magic |  |

Totals: 33 results aim at the opposing side (all pick one group), 31 at the own side (24 pick one group, 7 one random ally). Only Mega Phoenix, Final Phoenix and Final Elixir may
target the KO'd.

## 3. The resolver, step by step (FFX-G05 section 3.2; emulated 52,544 vectors with the target picker replaced)

1. While the table is loading it waits; once resolved it returns at once.
2. It goes through the record's slots and takes the first two ingredients: a field counts unless it is 0xff, the Mix command (0x311e) or the Item command (0x3001).
3. Two ingredients: one of each is **deducted now** (the return values are ignored, so a missing copy is not noticed and a doubled item with one copy still resolves), then the
   chart gives the result. One ingredient: that item becomes a plain use. None: 0xff.
4. The record is rewritten to one slot holding the result.
5. The result's target is picked by the game's auto-target from the result's own record (section 4). A mask of 0 is a Mix with no target.
6. With a target found **and** two ingredients, the result is recorded as discovered in a party-shared 16-word array (bit (id - 0x60) and 15 of word (id - 0x60) >> 4; Mix
   results fill words 2 to 6). What reads the array is unread (open question 3 below).
7. **"Mix failed!"** is a Mix whose pick found nobody (the message is battle text row 0x17): the ingredients are already gone, the gauge is **not** spent (the cost fields are cleared),
   the refund the executor then makes finds only the result command in the record and returns nothing, and a delay of **unestablished size** follows (open question 1).

## 4. The auto-target of a Mix (FFX-G04 via `research/re-ffx-targeting.md` 4.4 to 4.6; FFX-G05 section 5)

The side comes from the result's record (the opposing side when `Cmd+0x1a` bit 1 is set); candidates are the legal set of that side (in battle, Targetable, not dead unless bit 6).
A result that picks **one** takes one candidate with the single picker on **stream 4** (no draw with one candidate); one that picks a **group** draws once on **stream 5** (also with
one group, none with nobody) and takes every candidate of the (draw mod groups)-th occupied group (the group is `Chr+0x504` and 7). The engine puts every combatant of a side in
group 0 (the monsters' groups of our chapters are unread), so a group result takes the whole side, with its one stream-5 draw. A multi-hit result with the random-spread bit (the 20
records 0x3095 to 0x30a8) then deals each hit to a member of the group through the target builder: one stream-5 draw per hit with two or more members.

## 5. The bag (FFX-G05 section 3.3; emulated 60,000 vectors) and the deduct and refund routine (section 3.4; 60,016)

- 112 stacks of 0 to 99. An id is accepted when its top 20 bits are 0x00002; a change of 0 is refused. A gain is cut at 99 and the excess is lost (it never opens a second
  stack); a removal larger than the stack is refused whole; a new stack takes the first free slot (id 0 or count 0), the delta cut to 99; a full bag refuses a new item. An emptied
  stack's id becomes 0xff. A changed count sets bit (id and 0xfff) of the "obtained" (gain) or "lost" (loss) array.
- Thirteen callers use it (the Mix resolver, the deduct routine, steals, the Atel `giveItem`, the menu, shop and reward code), so the cap binds a steal and a reward as much as an item use.
- **Ordinary items are deducted when the action is queued and refunded when the executor does not carry it out.** A **monster never touches the bag** (chr index 0x14 to 0x1b).
  With stock 0 a deduction fails and a refund still creates a stack of one. A **Mix** in a slot stops the walk, so a Mix deducts nothing at queue time (its ingredients go in the resolver).
  Records are lost, not refunded, when their user dies before they run.

## 6. Gil (FFX-G05 section 3.8; emulated 30,000)

The pay at an action's start (Spare Change, Bribe): if gil minus the amount is not negative the gil is reduced by it; otherwise nothing is paid, the return value is ignored and the
action runs unpaid with the full amount. The gil is then clamped to 0 to 999,999,999. The add caps at 999,999,899 (an unsigned compare); the 100-gil gap between the two is in the
exe, its source unknown. The amount is cut to the gil held only when Copycat repeats an action (section 3.7), which the engine has no use for.

## 7. What the engine does with it, and what it leaves

Wired: the chart and the resolver (`mix.ts`, `overdriveShape.ts`, `registry.ts#mixResult`), the auto-target of the result (the targeting lane's kernel), the 21 new results, the failure
path, the learn array (`FFXRuntime.mixShared`), every bag change (`adapt/bag.ts`: steal, refund, item use, starting bag), the monster exemption, the Spare Change pay (`item-use.ts`).
**Not wired (decompiled, labelled):** Copycat's saver and copier (0x799B40; 88 repeatable commands; no authored build offers Copycat); the queue (two 62-slot lists) and its
priority insertion, whose reaction half RC4 lane F models; the loss of queued items when their user dies (the engine has no queue between a choice and its use); the refund of an
action dropped at the range check (the engine's players cannot aim an item out of reach).

## 8. Open questions that stay open (nothing here was built from them)

1. The delay of a Mix with no target: which rank `Chr+0xde8` holds on that path (the damage routine that writes it is skipped). The engine charges `MIX_FAILED_RANK` = 6, the result's rank, as a stand-in.
2. What the menu puts into a Mix record and which of the 112 items it lets the player pick (the resolver does not depend on it).
3. What reads the discovered-Mix array (a menu list of known results, or nothing visible).
4. The monsters' group numbers of our chapters.
5. Whether the gil add cap (999,999,899) is intended.
