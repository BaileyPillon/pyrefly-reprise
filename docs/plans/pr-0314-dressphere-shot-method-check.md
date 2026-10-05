# PR-0314, the dressphere shot: method check (AGENTS.md rule 15, `critic/RUBRIC.md` section 8)

Written 2026-10-04 on branch `r39-visfix` (from main c3c4daba), before the third attempt. **Game case: FFX-2 only** (only FFX-2 has a
spherechange and the DRESSPHERE SHOT; the sources: `research/ffx-vs-ffx2-presentation.md` section 6, D-316, D-346).

## 1. The route so far, and why it stalled

PR-0314 has been open in rounds 19b, 20 and 21 ("the dressphere shot is absent in 5 of 10 changes", then "6 of 7"; the push-in of D-346
"never seen" in any of the seven). The two attempts each fixed one gate:

- **round 19 (PR-0313, PR-0314):** the shot is held for its 1.6 s (the presenter waits, `shotHold.ts`), it is not cut to while anyone else
  acts, it is handed back at the first action-start of anyone else.
- **round 38 (`r38-pushin`, D-346):** where the full shot finds no clean frame, a small push-in plays instead.

Why neither moved the critic's number:

1. **Nobody could see which gate refused a change.** `HeldShots` counted `skipped` for two of its five refusals; the other three (the shot is
   off, a menu is up, the framing is not ready) dropped the change silently. The critic wrote "gate not traced" on the ticket three times.
2. **The decision was one frame.** It was taken on the single frame in which the girl's painted subject changed, and any gate closed on that
   frame (a leftover tween on an enemy, a panel sliding across her head, the changer's own menu still closing) was final.
3. **That frame is late.** The subject changes when the new outfit's textures have all loaded (`PaintedActor.loadPoses` swaps them at the
   end): on a network 0.45 to 0.77 s after the change began, by which time the HUD and the field have moved on.

## 2. What the gate trace showed (the smallest test; harness `D:/Tools/pyrefly-scratch/2026-10-04/r39-visfix/cap/gate.mjs`)

Real keys, seed 1, 1600x900, a Change forced at every opportunity, per-frame state of every staged figure (facing, lifeState, tweens in
flight, pose) beside the mix's own decision. On the live site (release 38) in Leblanc, Vegnagun, Fallen Aeons and Den of Woe: **14 of 17
changes had a shot, 3 had none**. The three, and what refused them:

| Change | Gate | What it was |
|---|---|---|
| Leblanc, Yuna's first | acting | an **enemy action genuinely in flight**: Fem-Goon's cast began before Yuna's change and its three hits landed during it (engine events 25, 27, 29). The rule works as written (R19-FN-01). |
| Leblanc, Paine | no frame | no grid framing passes (every full frame holds a nearer, taller neighbour: `dwarf`), and the push-in fails `head-under-panel` at its middle frame. |
| Den of Woe, Paine's first | no frame | Yuna 16 % in view at the frame's edge (neither whole nor out), Rikku 13 % under a panel. |

Also: a change whose frame was open but whose menu was up at the decision (Vegnagun) left **no trace at all**. The critic's own run (a loaded
machine with four live-site lanes and a screencast) saw 1 of 7; a 6x CPU throttle and a 300 ms art delay on this machine reproduce
neither number, so the critic's rate is not reproducible here and the gates, not the machine, are what can be repaired.

## 3. Alternatives

- **A. Continue, with the gates made visible and the single-frame decision removed** (chosen): a change waits up to 0.6 s for a clean moment
  and starts at its first frame (not the load's end); every outcome is recorded with its gate; the framing search walks from the best grid
  point when the grid fails. **No rule is loosened.**
- **B. Change the rules** (needs Bailey): hide the guide and advisor cards during the 1.6 s shot as the intent and Sensor cards already are
  (`HELD_CSS`), or let a neighbour's body, not her head, stand under a panel, or accept a neighbour cropped at the frame's edge. That would
  make Paine's shots far more frequent and is a visible HUD and framing change, so it is listed in `docs/handoff/r39-visfix.md`, not built.
- C. Build a different shot system: no source asks for one.

## 4. Choice

**A (continue, change what is traced and when it is decided), B listed for Bailey.** The measured effect is in the handoff
(`docs/handoff/r39-visfix.md`, item 2): presence before and after on the same machine, chapters, seeds and network delay, and the gate that
ended every change that still has none.
