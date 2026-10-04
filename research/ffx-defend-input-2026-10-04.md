# FFX Defend: the original game's input (2026-10-04)

**Scope: FFX only** (AGENTS.md rule 14). FFX-2 has no Defend command in its menu logic (`src/ui/ffx2/`)
and is not touched by anything here. **Docs plus one UI change** (release 39, branch `r39-uifix`):
`src/ui/ffx/defendControl.ts` builds the control this note sources.

**Why this note exists.** Bailey asked on 2026-10-04: "How do I use defend? That's not clear to me…".
The FFX command window drops the engine's `defend` row on purpose (`src/ui/ffx/CommandMenuLogic.ts`:
"reached by an affordance, not a row in the list"), and no affordance existed, so a player could not
Defend at all. The brief was to find the **original FFX input** from sources, never from memory.

**Method.** `WebFetch` gets HTTP 403 from GameFAQs (as on 2026-09-30,
`research/ffx-overdrive-input-rules-2026-09-30.md`), and a headless Playwright fetch stayed on the
Cloudflare "Just a moment..." page for 90 seconds this time. The pages were read through the desktop
app's built-in browser pane, which passes the check (text and message-board timestamps only; nothing
was posted, no account was used). All reads on **2026-10-04**. Quotes are kept under 15 words. A search
engine's own summary was used only to find pages and is never a source.

Tags: `[verified: N sources]` = N independent GameFAQs authors agree; `[single source]`; `[not found]`;
`[estimate]` = our choice, not a fact.

## Sources

| Key | Source | Version / date |
|---|---|---|
| GF-SM | GameFAQs, *Final Fantasy X - Stat Mechanics FAQ*, SinirothX, PlayStation 2, <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/31381> | v1.1, updated 2004-10-01 (an authored FAQ) |
| GF-B1 | GameFAQs board (Final Fantasy X, PS2), "Using this here Boss Guide.. Defend button question? (Spoilers.)", <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/43654705> | posts 2008-06-13 |
| GF-B2 | GameFAQs board, "am I missing something? how do you defend?", <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/43963411> | posts 2008-06-29 |
| GF-B3 | GameFAQs board, "Bring out characters and press Triangle to defend just for the experience points", <https://gamefaqs.gamespot.com/boards/197344-final-fantasy-x/79336639> | posts 2021-03-07 |
| GF-AI | GameFAQs, *Final Fantasy X - Guide and Walkthrough*, A_I_e_x, PlayStation 2, <https://gamefaqs.gamespot.com/ps2/197344-final-fantasy-x/faqs/35007> | Final, updated 2007-07-15 (for the Switch button, Q2) |

Independence: four different authors, an authored FAQ and three separate board threads with different
posters, 2004 to 2021.

---

## Q1. What input makes a character Defend in the original FFX?

**Answer: the Triangle button, pressed at the command menu** (instead of choosing a command). It ends the
character's turn and puts them in Defend (physical damage halved until their next turn).
`[verified: 4 GameFAQs sources]` (GF-SM, GF-B1, GF-B2, GF-B3). PlayStation 2 pad, as the threads are on the
PS2 board; the HD Remaster is **not** separately checked `[not found]`.

| Source | What it says (re-read 2026-10-04) |
|---|---|
| GF-SM | a table row, "Defend (Triangle or Sentinel)", with "Cuts physical damage by 1/2" under it |
| GF-B1 #2 | "press triangle instead of attack ... your character defends" |
| GF-B1 #4 | "Pressing Triangle skips your turn and puts the character in Defense" |
| GF-B2 #2 | "Press triangle," (answering "how do you defend?") |
| GF-B2 #5 | "Triangle button for display menu and DEFEND in battle menu", said to be the manual's own wording (the poster's claim; the manual was not seen) |
| GF-B3 title | "press Triangle to defend" |

What the sources do **not** say: where else Triangle works (every reply is "instead of attack" at the
command menu; nothing says it works inside a submenu or while aiming), and what the HD Remaster's
keyboard default is (GF-B2's reply names the PS pad; the PC build rebinds). GF-B3's thread is about using
Defend to earn a bench member's share of the AP, which `research/visual-bible.md` §3.8 already records
for the victory spoils.

## Q2. Related: the party swap is L1, not Triangle

`GF-AI`: "switch by pressing the L1 button" (during a party member's turn, then pick who). `[single source]`,
and the same as `research/visual-bible.md` §3.3 ("L1 / LB opens it", Gamer Guides, `[single source]`).

## Against our docs and code

- `src/ui/ffx/CommandMenu.ts` `onTopButton` (before release 39) opened the party swap on **L1, R1 and
  Triangle**, with the comment "the roster strip's own marker is the triangle". That marker is an authored UI
  sprite in `research/visual-bible.md` §3.3's roster strip (`[estimate]`: a 9x9 down-pointing triangle that
  hovers over the highlighted portrait), not a button. **Contradicted** by Q1: Triangle is Defend. Release 39
  binds Triangle to Defend; L1 and R1 keep the party swap.
- `src/ui/ffx/CommandMenuLogic.ts` header ("Defend is a base action ... reached by an affordance, not a row")
  stands: the row stays off the list, and the affordance now exists.
- `src/engine/tactics/advisor-menu.ts` `onTheMenu` (FFX never offers Defend on the card) is **unchanged on
  purpose** (the advisor's choices stay byte-identical). Its docstring ("a card that says Defend is naming
  something the player cannot press") is now stale: the player can press it, the card still never names it.

## What the build does with it (our mapping; the original has only the pad)

| Device | Control | How it is named on the tab | Status |
|---|---|---|---|
| PlayStation pad (the original) | Triangle | `△ DEFEND` | sourced (Q1) |
| Any pad, standard mapping | standard button 3 (`app/Input.ts` `PAD_MAP` `triangle`, Y on an Xbox pad) | `△ DEFEND` | our estimate (pad layouts differ) |
| Keyboard | `Q` or `Shift`, the two keys `rawInput.KEY_MAP` reads as `triangle` | `Q △ DEFEND` (Q is the one printed) | our estimate |
| Mouse | a click on the tab | `Q △ DEFEND` | our estimate |
| Touch | a tap on the tab (a 40 px target on the upright phone) | `DEFEND` | our estimate |

The tab is on screen while the engine offers Defend and the menu is at its top level. Inside a submenu or a
target step Triangle does nothing (our estimate: the sources only describe it at the command menu, and a
stray press there would spend a turn).

Open for Bailey, not decided here: whether Triangle should also Defend from inside a submenu, and whether the
HD Remaster's own default (Steam copy on `D:/Tools/ffx-hd`) should replace our keyboard key.
