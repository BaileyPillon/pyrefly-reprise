# FFX-2 boss scenes: where everyone starts (the numbers behind `ai/script-rolls.ts#SCENES`)

**Game case: FFX-2 only.** Part of the `re-parity` track, lane AI-FFX2-a (the boss AI of Chapters IV and V). Written 2026-10-11 while
closing the lane; numbers only, in our own words, nothing else from the scene files is reproduced.

**Source note.** FFX2_Data.vbf Steam build 25501027, the start-position file of each battle scene
(`battle/btl/<scene>/pos_<scene>.psc`, the lines `PlayerPos` for the three girls in party-slot order Yuna, Rikku, Paine and `EnemyPos`
for the monsters in scene order). Read on Bailey's own copy for reference only. Units are the game's ground-plane units, x across and z
into the scene (the height column is 0 for everyone listed here).

| Scene | Fight | Boss `EnemyPos` (x, z) | Yuna (x, z) | Rikku (x, z) | Paine (x, z) |
|---|---|---|---|---|---|
| stbv05_229 | Chapter IV, Bahamut | (0, 30) | (0, -20) | (-17, -25) | (17, -25) |
| wegn01_229 | Chapter V link 1, the Tail | (-33, 73) | (1, -43) | (29, -48) | (38, -16) |
| wegn01_228 | Chapter V link 2, the Leg (first of its scene's four monsters) | (-70.83, 50.85) | (-7, -34) | (13, -29) | (28, -14) |
| wegn01_225 | Chapter V link 5, Shuyin (fourth of its scene's four monsters; the other three are the cannon's inert parts) | (0, 0) | (-30, 27.6) | (-11, 35) | (-40, 10.6) |

What the files do **not** say: every scene gives the monsters' start direction as `0 0 0 0` and the girls' as `0 0 0 0`, so which way the boss faces
at its first poll is the engine's default, and none of this tells where anyone stands at a later poll. The near-weighted target search
(`research/re-ffx2-ai-bahamut-vegnagun.md` section 1.4) weighs a girl by her distance and by the angle between the boss's facing and her, so the odds
in a real fight depend on both ([L] there, "Targets in practice"). `ai/script-rolls.ts` uses these start positions with the boss facing the middle of
the three girls, which is that note's own worked example (Bahamut: 47.6 / 26.2 / 26.2 percent); the switch
`NEAR_WEIGHTED_TARGET_SEARCH` (`src/battle/ffx2/constants.ts`) turns the weights off. The other two scenes of the chain (link 3, the Body and
its Bulwarks, wegn01_227, and link 4, the Head and its Redoubts, wegn01_226) use only the uniform search, so they need no positions.
