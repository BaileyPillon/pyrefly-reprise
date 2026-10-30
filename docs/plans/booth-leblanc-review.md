# Paper preflight: the booth treatment reaches Chapter VI (Leblanc), FFX-2

> The paper preflight AGENTS.md rule 15 asks for before a change `tools/critic-plan.mjs` classes as deep. **Written after the first build, not before it** (the review of `2b314637b` found it missing, minor m2): the list in section 2 is the one that should have come first, and it would have caught both the critical (C1) and the major (M2) the review found. Docs only. Written 2026-10-30.

```
node tools/critic-plan.mjs --paths src/engine/motion/DemoGate.ts,src/engine/motion/RealMotion.ts,src/engine/procam/ProAutoStage.ts,src/engine/BattlePresenterStaging.ts,src/engine/BattlePresenter.ts
  review:       DEEP (focused before deploy; the deep review on the live build)
  because:      battle presenter and lifecycle is a shared system
  games:        both (shared plumbing); Leblanc itself is FFX-2 only
  checks:       CHK-006 008 013 016 017 020 021 022 023 026 027
```

## 1. What the change is

`DemoGate.TREATED_CHAPTERS` (the booth pair plus `ffx2-leblanc`) and `isTreatedChapter(id, piece)` replace `isDemoChapter(id)` in 14 switch modules; the booth pair answers true first, so Chapters I and IV are unchanged (the unit matrix proves the gates; browser job J9 proves the pixels). `?treated=pack` is release 68's reach. See [booth-leblanc](../handoff/booth-leblanc.md).

## 2. What is NEW in Chapter VI that the booth pair never had (each one is a place the treatment can break)

| # | Leblanc differs from Chapters I and IV by | the piece it can break | where it is pinned |
|---|---|---|---|
| 1 | **three chained links on one presenter and one staging layer** (`BattleEncounterChain`, `moreLinks`), so every `victory()` beat runs at a seam | the ending piece: a title, a HUD-out or a freeze left standing for the next act (review C1) | `stageVictory` returns 0 on a link that chains on, `stageLinkBegins` clears the layer from the second link on; `booth-leblanc-chain.test.ts` runs the real chain |
| 2 | **an FFX-2 chapter on the `'pose'` victory path** (Chapter IV is `'hold'`); the cheer's length is read from a real-clip table | rule 14: the table must be the chapter's own game's (review M2) | `cheerFloorMs` reads `stagingGame()`; the test pins Paine Warrior 3,066.7 ms and FFX Yuna's 3,200 in Chapter I |
| 3 | **three dresses without a decoded row** (Yuna Gunner, Rikku Thief) and one with (Paine Warrior) | the real clips matched by girl, not by dress (B7) | `REAL_DRESS_ROWS`, `booth-leblanc-dress.test.ts` |
| 4 | **foes that yield** (a living trio walks off, nothing dissolves) | the freeze fires on the killing blow before they leave (job J7) | browser job; one-row fallback in `PIECE_HOLDS` |
| 5 | **no maps** (one lit girl of six; no depth map for the room) | mixed lighting, no depth fog (review m3) | disclosed in the handoff, job J1 |
| 6 | **no booth-style big move** (her showpiece No Love Lost is a three-stage comedy combo, not a solemn blow) | the held breath and the sound pass's headline blow (review M1) | the breath is held with the written reason; the candidate is on the driver's list |
| 7 | **a source that says "no particles"** (`research/ffx-vs-ffx2-presentation.md` 8.1) | the HD-2D bold look's embers (review m1) | `ROOM_BOLD['leblanc-last-room'].embers = []` |
| 8 | **a plate with a different shape** (the follower camera was scored on Bevelle's group) | the retargeted candidates (B5) | `retargetAutoCamera`, job J6 |
| 9 | **a hidden twin** (`exp-leblanc`, same combatants, own paintings) | the treatment reaching a chapter the player cannot select | never listed; `booth-treated-chapters.test.ts`, `booth-leblanc-wiring.test.ts` |

## 3. What would make this wrong, and what answers it

- A mark of one act outliving its beat into the next: answered by 1 above, and the browser job J2 reads the first menu of Act II.
- A booth-pair frame that moves: the matrix test, then job J9 (Chapter I and IV against release 68).
- A table of the wrong game: the test in 2 above; any later FFX-2 chapter that joins reaches the same path.
- A default that reaches a phone: the pack's own gate (`packScreen()`) is untouched; job J3.

## 4. Order of work (for the next chapter that joins)

Read this list first and answer each row for the new chapter before building: does it chain, which victory kind, which dresses have rows, do its foes yield, which maps exist, what is its showpiece and who decides it, what does the research say about its air, what is its plate's shape, and does it have a hidden twin.
