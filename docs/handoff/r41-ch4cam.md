# r41-ch4cam: PR-0421, the dark bands in Chapter IV's wide opening (branch `r41-ch4cam`, from `origin/r40-rc` bc373d58)

**Game case: FFX-2 only** (Chapter IV, Bahamut; the Bevelle scene is FFX-2's, and the clamp acts only where a camera is wider than the scene's idle rig, which no FFX scene shares).
Authority: Bailey, 2026-10-11 ~12:15 EDT, "otherwise keep going" (a defect fix in the Bahamut-size feature, D-681; it restores the intended framing and needs no new pick). The phone layout (PR-0333: the strip, the coach card) is not touched.

## What PR-0421 was, and what it was not

Round 24 read the dark vertical bands of the opening's wide hold (1600x900: x 0 to 190 and x 1350 to 1470; 2000x1012 the same) as the **plate's edges** and asked for a plate extension or a clamp on the wide view. They are not the plate:

- the painted plate and its wings fill every frame of the move at every window shape the giants' close views cover, 1.2 to 2.45 (every rig, the giants' idle views, every blend of the opening): `tests/unit/r41-ch4cam.test.ts`, first describe (it also measured the live camera path at 1600x900: the plane x range seen is -35 to 35 of the plate's +-39);
- with the two foreground conduits hidden, the live frame is all painting (toggled in the real game on the live build at the intro rig, 1600x900; that frame is not kept);
- the bands are the **two foreground conduits** (3D pipes, `bevelle-underground.ts` `BEVELLE_CONDUITS`, placed at x -7.9 and 8.9 so the idle rig's border cuts them). The battle opens on the scene's `intro` rig (16.4 back, high; the party walks on there while the name slab dissolves), which is 1.4 times as wide at their depth, and takes them into the picture as slabs 12 and 16 percent of the frame wide. The bottom "lit edge" is the left pipe's foot on the deck.
- It is the same defect PR-0344 fixed for a wide window (`frameBracket.ts` `bracketScale`), now for a camera that pulls back. The `intro` rig and the pipes are older than the giants work; whether 931613a8 showed the same was not measured (round 24 did not capture it either).

No plate extension (that would be art). No camera or giants change: Bahamut's size, the girls' size (95 to 97 percent), the opening's moves and times are as they were.

## The change (presentation only, rule 1)

`src/scenes/frameBracket.ts`: `bracketedX`. Where a camera's frame is more than 12 percent wider (`BRACKET_WIDEN.from`) at a pipe's depth than the scene's idle rig, the pipe's inner edge is held to the share of the frame it already has (12 percent in) and brought to the border at 30 percent wider, along a smoothstep. One-sided and continuous in the camera, read through the camera's own basis (yaw, pitch, roll) at the pipe's foot. `bevelle-underground.ts` binds the battle camera (`bindCamera`, the hook the Road's phone camera uses) and moves the pipes and their lamps per frame; a debug screen (no camera) and the phone (`phoneGiants`) keep them where they were placed.

Untouched, proved in the test: the idle rig, the action, party, enemy, victory shots, the giants' views with the camera's idle drift (half a unit across, 0.4 back), every window narrower than 16:9.

## Proof

- `tests/unit/r41-ch4cam.test.ts` (25 tests): the plate holds at 13 window shapes for every pose; the defect as measured (intro rig: 12 and 16 percent in at 1600x900); the clamp puts the pipes at the border at the intro rig at every shape; no pipe stands further in than it did, or than a close rig has it, through the opening's move; everything else leaves the pipes exactly; the loaded scene moves them with its bound camera, not on the phone.
- Real browser, headless Chromium, `PYREFLY_BROWSER=gpu`, real keys from the title to the first command menu, seed 1, a vite preview of the production bundle (`vite build`; the bundle without the 11 GB of derived art, the masters joined in as `dist/art`, because D: could not hold the full build; the derive step is not part of the camera) against the live site `https://echoesofspira.com` (fcecfa74). Frames in `docs/screenshots/r41-ch4cam/`: `before-<size>.jpg` (live) and `after-<size>.jpg` for 1600x900, 2000x1012, 1280x1024 (pipes are outside the frame there: same) and 390x844 (the phone: same); `move-before|after-<size>.jpg` are 8-frame strips of the opening's hold and dolly at 1600x900 and 2000x1012.

## Still visible

- Mid-dolly (about 0.3 s after the hold, the camera coming in), the right pipe re-enters from the border and stands up to about 10 percent in for a moment, then settles at the 6 percent sliver the settled frames have always had (unchanged). The live frame had it 16 percent in at the hold and 6 at rest.
- The settled right-edge sliver and the close rigs' pipe bars (the enemy rig 12 percent) are the scene's design and are not touched.
- Round 24's acceptance (a screencast of the entry at 1600x900 and 2000x1012, no dark band in any frame of the move) is met by eye in these frames, not by a review; a re-run of that screencast closes the item.

NOW.md and CHANGELOG.md are left to the release driver (shared files).
