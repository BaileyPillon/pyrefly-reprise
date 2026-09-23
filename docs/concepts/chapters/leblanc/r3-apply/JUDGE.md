# Independent judge: Ormi's heart candidate and the Option A install (FFX-2 only)

Judged 2026-09-23 by an agent that made none of this work. It covers Bailey's decision
"All recommendations on the three art decisions" (sheets in
`docs/concepts/chapters/art-r3-decisions/`). The work under review is commit 269ce894 and
`README.md` in this folder. Game case: **FFX-2 only** (Chapter VI, Leblanc Syndicate). It
touches no FFX subject and no party member.

## 1. Ormi's Syndicate heart on the idle: 8/10, PASS (bar 7)

Candidate `D:/Tools/pyrefly-lora/ormi/r3/idle.heart.png`, compared with the installed idle
`public/art/characters/ormi/idle.png` (sha256 f7fcdfc3...) and the r1 cast
`D:/Tools/pyrefly-lora/ormi/poses/cast/cast.960106.png` (sha256 f0a88fc5...). I made my own
crops with PIL and looked at them at 1:1, 2x (Lanczos), 4x (nearest) and about 0.45x (near
the size it plays at).

**Numbers, measured by me with numpy:**
- Both images are 489x1189 RGBA.
- 7,170 pixels changed, all inside the bounding box x 37-90, y 372-578. The alpha channel
  is identical (0 pixels differ).
- Outside the heart mask (`target_mask.npy`, 6,823 px) dilated by 2 px (8-connected),
  573,482 pixels are **byte-identical**: MAD 0.0, max difference 0, and 0 changed pixels
  fall outside that region.
- Colour: the median HSV of the heart's red fill is (0.983, 0.937, 0.392). The shield's own
  red rim band is (0.993, 0.918, 0.384). The two match to within a hue step and about 1
  percent value.

**How it looks:**
- **It reads as painted on the shield.** The heart sits on the boss inside the dark ring and
  follows the shield's lean and foreshortening. At game scale it reads at once as the
  Syndicate heart, matching research §10.1 and the r1 cast.
- **Shading and light:** the light falls on the right lobe (the specular fleck is at the top
  right), which matches the idle's rim light from the right. The value matches the red rim.
- **Line weight:** the gold outline and 1 px ink match the ink and gold weights of the boss
  and ring around it.
- **Join:** not visible at 1:1. At 2x and 4x I found no halo, no feather ring, no colour step
  and no ink doubling that I could name.

**Worst, in order:**
1. The heart fully replaces the gold boss instead of sitting on it, so the domed boss is gone.
   It reads as a flat emblem plate. This is acceptable, but it is the largest departure from
   the idle.
2. The 0.50 across-axis squeeze packs the r1 heart's vertical fill streaks tighter. At 2x they
   read as fine ribbing rather than the source's broader sheen, and the heart looks slightly
   tall and narrow.
3. The top of the left lobe runs onto the upper edge of the dark ring instead of staying
   just inside it. You only notice this at 2x.

None of these can be named at 1:1 or at game scale, so it clears the bar. **Verdict: install
it as Ormi's idle.** I did not install it: the driver does.

## 2. The Option A install: verified

**Setup:** my own vite server on 127.0.0.1:5487, stopped by PID afterwards. Headless Chromium
with `PYREFLY_BROWSER=gpu`; the renderer reported ANGLE NVIDIA GeForce RTX 5070 Ti D3D11 at
1600x900. The script is `tools/zz-judge-ch6.tmp.mjs` (agent scratch). The art agent used
seed 6; I used a different one, seed 11. `gotoChapter('ffx2-leblanc', { skipCutscenes, auto:
'intended' })` ended in **victory** in 325 s. Raw results are in
`docs/screenshots/ch6-optionA/judge/judge.json`, with six captures beside it (not committed).

- **Casts show the cast painting:** 40 of 40 trio `cast` requests resolved to
  `<subject>/cast.png`. This covers Ormi (entrance and Logos room), Logos (room and finale)
  and Leblanc.
- **Hits show the idle:** 71 of 71 trio `hurt` requests resolved to `<subject>/idle.png`.
  `ko` resolved to idle 6 times, and `attack` maps to idle on every trio actor. The pose map
  of every trio actor names only cast.png and idle.png.
- **Manifest:** served `/art/manifest.json` lists leblanc, logos and ormi as `states:
  ['cast','idle']`.
- **Network:** 173 `/art/` responses, 0 failed, 0 at status 400 or above. The only trio
  files requested were cast and idle, png and json, all with status 200.
- **Console:** 0 errors and 0 page errors. There was one warning, three.js "PCFSoftShadowMap
  has been removed", which has nothing to do with this change.
- **Ormi's restored cast is r1 cast.960106:** the served `/art/characters/ormi/cast.png` hashes
  to sha256 f0a88fc5dee3d100cb9626cf826ff254ed65d88f7ba3619d2327cc37e3212ee3. That is the
  same hash as `D:/Tools/pyrefly-lora/ormi/poses/cast/cast.960106.png` and the file on disk.
  Its sidecar records the same sha, seed 960106, 611x1214 (the PNG's real size), and the
  backup path of the r2 cast it replaced (which I found present).
- **Backups:** attack, hurt and ko (png and json) for all three subjects are in
  `D:/Tools/pyrefly-art-backup/candidates/2026-09-23-ch6-optionA/<subject>/`.

**Note for the driver:** Leblanc's `cast.png` changed at 13:54 EDT, after the art agent's
check. It is now sha256 772661a5.... A copy of the file it replaced (49d3c55f...) sits in the
Option A backup folder. This matches the driver's separate choker install, so it is not an
Option A finding. My run used the new file, and it loaded and showed correctly.

Decision 2 ("Yields") is not built. That was expected; it belongs to another agent's
`src/engine` work.

HEART: PASS
