# Sphere Grid: making it understandable (options, fb-0929)

Bailey's friend, 2026-09-29, quoted by Bailey: "i don't get the sphere grid, feels buggy".
The defects are fixed on branch `fb-0929-sphere` (see `docs/handoff/fb-0929-sphere.md`).
What is left is **confusion**, and these are the end-state options for it. Nothing here
is built into the game. **FFX only**: the Sphere Grid is FFX's levelling board; FFX-2
chapters have dresspheres and the Garment Grid instead.

Each picture is at real resolution, rendered headless from static HTML that loads the
game's own Ink & Gold tokens and fonts; the grid itself is a real render of the game's
canvas (`assets/`, captured with injected CSS only). Rebuild: start the dev server on
port 8130 from the repo root, then `node docs/concepts/fb-0929/sphere/capture.mjs`.

| Option | Picture | What it is | What it costs to build |
|---|---|---|---|
| **A. First-time explainer card** | `option-a-explainer.jpg` | An ivory Ink & Gold card over the grid the first time the tab opens: Move, Activate, Click twice, and "not saved on reload". A `?` button in the grid header reopens it. | Small: one card module and CSS, one "seen" flag in the existing save `seenCoach` list, a phone layout for the card. No rule changes. About half a day. |
| **B. Bigger grid, legend in words, node preview and path** | `option-b-layout.jpg`, `option-b-phone.jpg` | The grid takes most of the screen (the roster shrinks to portraits, the party strip leaves this tab); a card names the selected node, what it gives ("STR 31 → 33"), the sphere it takes and the whole path's S.Lv; the route is drawn on the grid; the legend is in words; one "walk and activate" does the steps. The phone gets its own stacked page with 44 px buttons. | Largest: a new desktop layout for this tab, a phone stacked page (today the phone shows this tab as a letterboxed desktop board with 7 px buttons), path-finding and a multi-step move with one confirm. About two days, and it changes an approved screen, so it needs Bailey's pick. |
| **C. Auto-learn with undo** | `option-c-autolearn.jpg` | An AUTO-LEARN button walks the character to the nearest nodes along their own path and activates what the pouch can pay for, then shows what changed with UNDO and KEEP. The figures in the picture are a real run of the grid's rules on Chapter I (Tidus: 4 nodes, S.Lv 30 → 23, STR 31 → 35, AGI 30 → 34, max HP 2420 → 2640). | Small to medium: a greedy planner on the existing model, a snapshot of the build for undo, one toast. About a day. It does not teach the grid, it lets a player skip it. |

A and C combine well (explain it once, and offer a one-press answer); B is the one that
fixes the phone.

## Confusion points found (not bugs)

1. Nothing says what the grid is for, that it is optional, or that spending here only
   changes this chapter's fight and is gone after a reload.
2. A first click only selects; the second click acts. Nothing on screen said a second
   click works until this fix (the caption said only "Enter").
3. Every node next to the character is already lit (the chapter's preset route took
   them), so the nearest thing to buy is 2 or more steps away, and each step costs S.Lv.
4. The pouch strip uses three-letter tags (PWR, SPD, MNA, ABL, FTN, K1-K4) and the
   starter pouch is our estimate; nothing says which sphere fits which node.
5. The legend is 3.7 authoring-px type on the canvas edge (about 9 px at 1600x900).
6. The grid window is 835 x 225 px at 1600x900: a short strip of a large map, no
   overview.
7. The AP bar reads "AP 0 / 695" and nothing earns AP in party prep; the number also
   drops as S.Lv is spent (see the open question in the handoff).
8. Other characters' portrait chips sit on the map without names.
9. A node two links away says "Move onto the node first", though it cannot be reached
   in one move.
10. On the phone (390x844) the tab is the desktop board letterboxed to 390 px: the grid
    is 204 x 55 CSS px and WALK is 16 x 7 px. Tapping still works, but it is not usable.
