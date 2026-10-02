# r35-art: Bailey's 2026-10-01 art picks installed, the wind-up / follow-through slots, the 2x tier

Branch `r35-art` from `c675f29b` (rel35 = main e1a46221 + vis-fix), worktree `D:/pyrefly-fb-onboard`. Not pushed,
not deployed. Decisions: D-313 (party pose keys), D-314 (boss pose keys), D-315 (fidelity 2x), all answered by
Bailey 2026-10-01 ~14:10 EDT, verbatim "all your recommendations" (page https://claude.ai/artifact/MYND2UKD9WsToA3K3rwFir).

## What

**Art (installed into main's `public/art`, locked as `bailey:2026-10-01-art`).** Package, README, backups, exclusions
and the builder: `D:/Tools/pyrefly-art-backup/approved/2026-10-01-art/`. `install.mjs --dry-run` then `--apply`:
208 files (104 PNGs + 104 sidecars), 6 of them the listed replacements; `verify-approved.mjs`: 469 ok, 0 mismatched,
0 missing. The `approved-hashes.json` change is committed in the main tree on its own.

| Set | Installed | Game |
|---|---|---|
| D-313 party keys | 49: wind-up as `ready`, impact / follow-through as `follow`, cast, item, victory | FFX: Tidus, Yuna, Auron, Wakka, Lulu, Rikku (10). FFX-2: 15 dresspheres (39) |
| D-314 boss keys | 31: Natus hurt + KO, Omnis hurt, Shiva / x2-Shiva hurt + KO, Ixion / x2-Ixion hurt + KO, x2-Anima hurt + KO, Ifrit / Valefor / Bahamut and Grothia / Pterya / Spathi hurt, Paragon attack + hurt, FFX-2 Bahamut attack, Mortibody attack, Vegnagun leg / head / body hurt + KO, Shuyin attack + hurt | per boss (sidecar `game`): 13 FFX, 18 FFX-2 |
| D-315 2x masters | 24 `<state>@2x.png` beside the 1x painting (never over it); 28 more held in the package's `held-2x/` | per figure |

Replaced (backed up in the package `backup/replaced/`): Yuna White Mage's unhooded cast, item and victory, by the
hooded keys (cand-13, cand-2, cand-4) that match her hooded idle (FFX-2 only). None was in a locked set.

Not installed (README table; for Bailey): Kimahri wind-up and follow-through (two horns), Yuna FFX follow-through
cand-17 (blue staff ring), Lulu wind-up cand-24 (doll not clear), Yuna Dark Knight cast / item / victory (no helm;
her wind-up wears it and is in), the seven FFX victory alternates, and **Paine Warrior victory cand-2**: it would
replace `paine-warrior/victory.png`, which is locked in Bailey's own set `bailey:2026-09-25-poses`, so it waits for
an explicit word like the FFX victory alternates.

**The 2x size rule.** All 52 masters would ship about 850 MB (public/ shipped 572.5 MB before this, keys +44 MB,
masters +233 MB), over the brief's 800 MB, so only the figures under 1.5 texels per device pixel at a 2x ratio ship
(capture2 table, min `contentTexelsPerPxV` / 2 at 1600x900): Vegnagun tail 0.45, Sin left fin 0.61 (far, near),
Overdrive Sin 0.62 (idle, stages 0-4), Evrae 0.89 (idle, far), x2-Ixion 1.17, FFX-2 Bahamut 1.20, Paragon 1.24,
Yunalesca 1.25, Braska's Final Aeon 1.30, Grothia 1.43; plus, my reading, the unmeasured paintings that stand in the
same fight at the same distance (Yunalesca 2 and 3, Sin's right fin and core, Pterya, Spathi). Shipped public/ is
now **730.3 MB** (`D:/Tools/pyrefly-scratch/2026-10-02-rel35/size.mjs`, after the dist filter).

**Code (presentation only, both games: shared plumbing; no engine state, no RNG, no SaveData, no settings).**

- `src/engine/ArtTier.ts` (new): the tier, decided once per session from the device: never on the phone tier (the
  phone battle query, or a coarse pointer on a screen whose short side is under 600 px), else 2x at a viewport of
  1280 CSS px or more or a pixel ratio above 1. `PaintedArt.preparePainting` draws the master's pixels with the 1x
  sidecar, name and cache key (`pixelUrlFor`); a master that fails to load falls back to the 1x file. Every URL,
  pose test (`paintedPoses`, `lacksKoPainting`) and plane size stays the 1x painting's.
- `ArtManifest.ts` / `tools/gen/manifest.mjs` (+ `.d.mts`): per-subject `states2x` (a master only beside its 1x state);
  the asset gate knows `<state>@2x.png`. NOTE: main's generator (before the merge) drops `states2x` when it rewrites
  `public/art/manifest.json`; the game then simply uses 1x until this branch's generator runs (every build does).
- `PaintedActor.loadPoses`: one texture per file; a pose that falls back to idle shares idle's texture instead of a
  second upload of the same pixels.
- `src/engine/KeyPoses.ts` (new) + `BattlePresenterBeats.actionStart` + `ContactBeat.meetContact`: an attack by a
  figure with its own `ready` opens on the wind-up and puts up `attack` at the lunge apex (only while the action is
  still on); a figure with its own `follow` shows it when the hit (or miss) lands and holds 180 ms at full reach
  before the strike goes home; `actionEnd` returns to idle. REDUCE MOTION keeps the old beat. `follow` joins
  `PARTY_POSES` with the fallback follow -> attack -> ready -> idle. The wind-up also shows, as before, while the
  member's command menu is open (`BattlePresenter.ts` `setPose('ready')`), confirmed in the captures below.

## Evidence (dev server on 5610, headless Playwright, PYREFLY_BROWSER=gpu, seed 1)

All under `D:/Tools/pyrefly-scratch/2026-10-02-rel35/art-verify/<plan>-<device>/`: every frame (JPEG), `record.json`
(per shot: pose, the painting's URL, the texture size actually drawn, the sidecar, the world height, the screen rect)
and `sheet-*.jpg` contact sheets (idle then each key, one crop per figure, the idle's ground line drawn).
Scripts: `verify.mjs`, `sheets.py`. 17 runs: Ch I and Ch IV at 1600x900 and 390x844; every FFX-2 dressphere in
Ch IV; Natus, Omnis, Fallen Aeons, Djose, Isaaru, Trema, Vegnagun, Yunalesca, Braska, Evrae, Sin fins, Sin face.

- REAL: an Attack by keys (Enter, Enter). Pose trail from a setPose hook: Ch I Tidus `ready` -> (309 ms) `attack` ->
  (150 ms) `follow` -> (298 ms) `idle`; Ch IV phone Rikku Dark Knight `ready` -> `attack` (apex) -> `follow` -> `idle`.
  Frames: `attack-0-menu-ready` (the wind-up at the open menu), `attack-1-ready`, `attack-2-follow`.
- STAGED (labelled in every record): each key forced with `setPose(pose, {force, immediate})` at an open menu, the
  battle parked with `__pyrefly.fx.freeze`; a figure the chapter does not field put on a staged member with
  `stage.setArt` (e.g. the dresspheres on Ch IV's three, Shiva / Ixion / Ifrit / Valefor / Bahamut / Spathi on
  Isaaru's chapter, Vegnagun's leg / head / body and Shuyin on the tail's actor, so their absolute size there is the
  host's; idle and key are compared on the same actor).
- Every key read right at game scale (baseline on the ground line, size against the idle, facing): no sidecar fix
  and no withdrawal was needed. Seymour Natus's KO lies at his hover height inside the ring (he floats).
- 2x: the drawn texture is the master on desktop (x2-Ixion 2662x1884, FFX-2 Bahamut 2048x2048, Yunalesca 1646x2368,
  Grothia 2190x2276, Overdrive Sin 2820x1490, the fins 3308x1180) and the 1x file on the phone (Ch IV 390x844:
  Bahamut 1024x1024, no `@2x` request).
- Memory, decoded and mipmapped, of the textures the staged figures hold (record `memoryAtEnd`): Ch IV desktop
  117.5 MB (one master) vs phone 100.8 MB; the base would hold 162.2 MB there (one texture per pose entry, 1x).
  Downloads of character PNGs: Ch IV desktop 27.1 MB (6.1 MB of it the master) vs phone 22.0 MB.
- Screenshots: `docs/screenshots/r35-art-ch1-tidus-windup-follow.png`, `r35-art-ch4-white-mage-hooded.png`,
  `r35-art-boss-keys-and-2x.png` (Natus and Mortibody keys; x2-Ixion 2x idle, hurt, KO), `r35-art-ch4-phone.png`.

Found and fixed on the way: under the ATB a lunge's apex can come after `actionEnd` (Ch IV desktop, Rikku hit by
Bahamut just before her turn: the whole action played in ~40 ms); the apex then put up `attack` and she stayed on
it. `impactAtApex` now acts only while `ctx.actingId` is the attacker (test added); in that compressed case no key
plays (the old code showed nothing either).

## Gates (run here)

- `npx tsc --noEmit`: clean.
- `npx vitest run --testTimeout=60000`: 728 files passed, 1 failed, 5 skipped (10809 tests passed). The failure,
  `ff7-phase3`, expected the house pose set to have no `follow`; updated (the house set now has it, windup / spin /
  back stay FF7-only) and it passes (14/14).
- `node tools/orphans.mjs`: 24 orphans, all pre-existing; `ArtTier.ts` and `KeyPoses.ts` are reached.
- Rule 7: PaintedArt 860 -> 854, PaintedActor 2017 -> 2012, ArtManifest 388 -> 388; BattlePresenterBeats 321 -> 324,
  BattlePresenterArt 284 -> 287, ContactBeat 68 -> 75 (all under 400); new files 91 and 55 lines.
- Dev server on 5610 stopped (taskkill by PID).

## Game case (rule 14)

Code: both (shared presentation plumbing, CHK-020). Art: per figure; FFX party and FFX bosses / aeons FFX only;
dresspheres, x2 aeons, Paragon, FFX-2 Bahamut, Vegnagun, Shuyin FFX-2 only.

## Open / ask Bailey

1. Paine Warrior victory cand-2 (matches her idle) would replace the victory Bailey approved on 2026-09-25: replace it?
2. The FFX victory alternates (Tidus 15, Yuna 3, Auron 2, Wakka 2, Lulu 4, Rikku 6; Kimahri 3 has two horns): keep the
   approved victories, or replace any?
3. The 28 held 2x masters (party, dresspheres, Seymour's forms, x2-Shiva, x2-Anima ...): ship them later at about
   +113 MB (the build would pass 800 MB), or keep the 1.5-texel rule?
4. In battle, two installed keys drift from their idle's look more than the sheets suggested: Yuna Gunner's wind-up
   (darker skin, shorter hair) and Yuna Warrior's follow-through (red hair). They are Bailey's picks; re-roll?
5. The wind-up shows from the moment the member's menu opens, so a player who then picks Cure or an item sees her
   wind up first (it was the idle before). Keep, or show `ready` only at an attack's start?

## Check (independent, 2026-10-02, branch r35-art at 412831ab)

Not built by the checker. Dev server on 5620 (this tree) and, for before/after, 5621: the same tree and art served
with the six changed `src/engine` files at their base content (`c675f29b`, a load-hook vite config in scratch).
Headless Playwright, PYREFLY_BROWSER=gpu, seed 1, real keys. Scripts and records:
`D:/Tools/pyrefly-scratch/2026-10-02-rel35/check/`. Both servers stopped by PID.

**Gates.** `tsc --noEmit` clean. Full vitest `--testTimeout=60000`: 729 files passed, 5 skipped (10810 tests).
`orphans`: 24, all pre-existing. Rule 7 holds (PaintedActor 2017 -> 2012, PaintedArt 860 -> 854, ArtManifest
388 -> 388; the rest under 400). `git diff c675f29b..412831ab -- src/battle` is empty; `SaveData.ts` and the settings
schema untouched. `verify-approved.mjs`: 469 ok, 0 mismatched, 0 missing; `approved-hashes.json` in 400e97ff only adds
lines; the package's `hashes.json` matches all 104 installed PNGs; the three replaced White Mage files were in no
locked list. Every commit names its game case. `critic-plan --paths`: DEEP class (asset loader, presenter), not
save-data: focused before deploy, deep after.

**Confirmed by running.**
- Attack keys, FFX: Ch I Tidus by Enter x2 at 1600x900 and 390x844: `ready -> attack (+305 ms) -> follow (+133 ms)
  -> idle (+317 ms)`; Kimahri (no own keys) plays `attack -> idle` as before. Yunalesca: Tidus and Auron get the
  follow-through, Yuna (no `follow`) does not. FFX-2: Ch IV Paine and Rikku `ready -> attack -> follow -> idle` at
  1600x900, 1024x768 and 390x844.
- REDUCE MOTION (prefers-reduced-motion): no wind-up lead, no follow-through, `attack -> idle` (Ch I and Ch IV).
- FF7 (Guard Scorpion): Cloud and Barret's pose sequences are the same as base, step for step.
- 2x tier: 1600x900 and 1280x720 at DPR 1, and 1024x768 at DPR 2, draw the 2048 px Bahamut master; 390x844 and
  844x390 (touch, DPR 3) and 1024x768 at DPR 1 draw the 1024 px file and request no `@2x`. Blocking every `@2x`
  request falls back to 1x with the same sidecar, baseline, content box, world position and screen rect (Bahamut,
  Evrae); side by side the 2x master is the same figure, only sharper. Sin face, Sin fins, Yunalesca, Evrae: masters
  load, no page errors, no 4xx.
- Shipped `public/` after the dist filter: 730.3 MB (decimal), 2x masters 109.8 MiB; the filter ships `@2x.png`
  (and the unused `@2x.json` sidecars).
- Neighbouring flows: Ch I on `auto: 'intended'` ends the same on base and candidate (defeat in 38 turns: the engine
  is untouched). Chapter IX (Ixion, FFX-2) on auto at 390x844: victory, hooded White Mage victory painting shown.
  Auto (cast-only) pose timings in Ch IV match base to the millisecond range.

**Found.**
1. (major, pre-existing; exposure changed) Under the FFX-2 ATB two bursts can play at once (the enemy turn under an
   open menu, and a submitted command); `actionEnd` returns `ctx.actingId` to idle, which the other burst's
   `action-start` has already overwritten, so the wrong figure goes idle and the attacker stays on its key painting
   until its next pose. Base shows it too (mashing Enter in Ch IV for 90 s: base Rikku held `attack` 11.7 s;
   candidate Paine held `follow` 3.5 s; Ch IV turn 5 under steady input left Paine on `follow`). New in this
   candidate: the stranded painting is now the follow-through for figures with one, and FFX-2 Bahamut (and the other
   new D-314 attack keys under the ATB: Paragon, Shuyin) visibly hold their attack painting where live, with no
   attack painting, showed the idle (forced back-to-back gauges: Bahamut on `attack` for over 5 s with the presenter
   at `command:yuna`). The `action-end` event carries `actorId`; returning that actor (and clearing `actingId` only
   when it matches) would fix both. Not fixed here (check only).
2. (disclosure) D-315 named 52 masters; 24 ship and 28 wait in `held-2x/` under the size rule. Bailey's call
   (question 3 above).
3. (minor) Main's generator (before this branch is merged) rewrites the shared `public/art/manifest.json` without
   `states2x`; until this branch's generator runs again the game silently draws 1x. The ArtTier header says
   `setHiTier` serves "the debug API"; nothing exposes it there.

**Verdict.** No regression in engine behaviour, the save class, approved paintings or the FF7 path; the claims in this
note reproduce. Finding 1 is a pre-existing defect that the new keys make more visible (worst on FFX-2 Bahamut);
whether that counts as a regression against live is the focused review's call.
