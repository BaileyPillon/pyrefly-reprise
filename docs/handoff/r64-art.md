# r64-art: the repaint install (four figures) and the Echo 2x master

Lane: art (Sonnet sub-agent of the release driver), 2026-10-24, branch `r64-art` from `origin/r63-play`, tree `D:/pyrefly-pilgrim-proto`. Nothing here deploys. Bailey, 2026-10-24 ~13:40 EDT, verbatim: "you can make all the decisions for me, ill go with all your recommendations. i still cant play it unfortunately. time crunch." The driver's decisions under it are items 200f (the repaint) and 200g (the Echo 2x) of `D:/Tools/pyrefly-scratch/2026-10-07/decisions-to-record.md`.

**Game case.** Yuna and Kimahri: FFX only (the figures that carry them are the FFX chapters; the paintings show in every FFX chapter that fields them, not only Chapter I). Rikku Dark Knight and Paine Warrior: FFX-2 only (Paine Warrior's five also reach the experimental Chapter VI, which pins them in a test). The Echo master: both games (the title and the booth cards are the front door of FFX and FFX-2).

## The art mirror

`D:/pyrefly-art-r64` is a hard-link copy of `D:/pyrefly-art-r63` (6,993 files, `tools/mirror-link.mjs` of the repaint-prep lane: one `fs.linkSync` per file, folders created fresh). Against r63 it differs in exactly: the 100 replaced files (below), the other 303 files of the four figures' folders (real copies, same bytes as r63: the installer needs real files), `manifest.json` (a fresh file; `title2x` now lists `echo`) and the new `title/echo.2x.webp`. `D:/pyrefly-art-r63` was never written (its files only gained link counts). `D:/pyrefly-art-r63-rp` (the staged end state of all 25 proposed poses) was the rehearsal; all 100 installed files are byte-identical (sha256) to the staged ones.

The old 1x paintings and sidecars the installer moved aside are in `D:/pyrefly-art-r64-replaced`. The originals are also in the private art repo: `archive/2026-10-24-2026-10-24-repaint-4-figures` (100 files, 258.88 MB, commit `754a4ca`; the folder name carries the date twice because the label did); `current/` got the 20 new 1x masters and `title/echo.2x.webp` (commit `8e2cde8`) and the README a section (`2d1be8a`). Roll back: point `public/art` at `D:/pyrefly-art-r63`.

## What changed, per figure (only the poses the proposal marked "goes in", canon A, locked to the idle)

Each pose = 5 files: the 1x painting, `@2x`, `@3x`, `@4x` (the CPU carrier's Lanczos tiers, exactly 2x/3x/4x the 1x, softer than a library tier) and `<pose>.normal.png` (the old map carried to the new silhouette; **provisional** where the silhouette IoU is under 0.95, marked "map owed"). Sidecars (`<pose>.json`) did not change. Full old/new sha256 of every file: `docs/handoff/r64-art-shas.json`; the table shows the first 16 hex.

### Yuna (FFX only): 5 poses, 25 files

| pose | file | old sha256 (r63) | new sha256 (r64) | map |
|---|---|---|---|---|
| cast | cast.png | `7bed409d753136dc` | `b007285a8c7bd4c6` |  |
| cast | cast@2x.png | `88e67e75189ac3bf` | `6e80881e2e2339f2` |  |
| cast | cast@3x.png | `3767705002dddd60` | `c9b18ef3f46b893f` |  |
| cast | cast@4x.png | `dbe771c728871985` | `fd7e8999d1a3eaa0` |  |
| cast | cast.normal.png | `ce629874cd943e4b` | `ed57db8969a42057` | provisional, MoGe-2 owed |
| hurt | hurt.png | `da0ad737452c8207` | `fa754438a81151a6` |  |
| hurt | hurt@2x.png | `be23d3223f29a876` | `42132ff8758f1b31` |  |
| hurt | hurt@3x.png | `64df049bd3ae9cd0` | `37fa380902f0d827` |  |
| hurt | hurt@4x.png | `b7f3945ff8b54d23` | `59237589256bb865` |  |
| hurt | hurt.normal.png | `bdcb28b4d804a3b4` | `1dff20ad8ed5d495` | adapted (IoU >= 0.95) |
| critical | critical.png | `eba4698167e35c4e` | `e1f61dd582317f9a` |  |
| critical | critical@2x.png | `87cadc47b61cbc7c` | `e5bdd405064ed9d0` |  |
| critical | critical@3x.png | `b01d4d4159edfcc5` | `ad79da69a217d64c` |  |
| critical | critical@4x.png | `bac5e41e9bd031ca` | `b4998744ae4a9bb4` |  |
| critical | critical.normal.png | `74ea84e6a023cc59` | `e7cd3b743bc295d2` | adapted (IoU >= 0.95) |
| victory | victory.png | `603ab2ab4c26fc23` | `e4e753e0bf2923c5` |  |
| victory | victory@2x.png | `ad087b9d59418316` | `bfdfcfd02f65609d` |  |
| victory | victory@3x.png | `ea7872d66688abac` | `02875777c95a8396` |  |
| victory | victory@4x.png | `6ce2e301caa686a0` | `f762558292d00747` |  |
| victory | victory.normal.png | `7be993522c8f6dbf` | `29c7034ef2f6edd1` | provisional, MoGe-2 owed |
| item | item.png | `806b7a05d004db5b` | `8d923a9c1e8b5526` |  |
| item | item@2x.png | `288b245e0367e38b` | `eb0f2a43ee33a249` |  |
| item | item@3x.png | `434c8cbd2f535008` | `4adc3e6e4a94c775` |  |
| item | item@4x.png | `8fdecf8285a02d5f` | `489b85c19eaeac0a` |  |
| item | item.normal.png | `3098b5c2fb03c68e` | `8fd0edac402b3267` | adapted (IoU >= 0.95) |

### Kimahri (FFX only): 5 poses, 25 files

| pose | file | old sha256 (r63) | new sha256 (r64) | map |
|---|---|---|---|---|
| ready | ready.png | `a961b7d74864e19e` | `35330f2f4a2fc3a6` |  |
| ready | ready@2x.png | `6d5f5e5938d9df57` | `9cc1fd81d7ff4a83` |  |
| ready | ready@3x.png | `270c7689176cdf88` | `aa602d83dc404121` |  |
| ready | ready@4x.png | `60809252adcf4c54` | `afe12cd94d56b7e8` |  |
| ready | ready.normal.png | `c62672467a3f1062` | `67aa526745a7817a` | adapted (IoU >= 0.95) |
| follow | follow.png | `55504f6788c39a67` | `239ef170ab94ee75` |  |
| follow | follow@2x.png | `e783c586420490eb` | `662f296189cb6716` |  |
| follow | follow@3x.png | `47853444caf0c266` | `6c45dad61c503130` |  |
| follow | follow@4x.png | `5d413c9a83a404e0` | `8223716de1387dfa` |  |
| follow | follow.normal.png | `d2bfd1da8d1a68d4` | `848cf2cb7742598f` | adapted (IoU >= 0.95) |
| hurt | hurt.png | `ed846ce7461f61d8` | `962cbcb97db7e92d` |  |
| hurt | hurt@2x.png | `d7edeadba9b1aa2f` | `7d4fa3ff09faa5ed` |  |
| hurt | hurt@3x.png | `eab98df9e01a45ed` | `687958f7b3c30b02` |  |
| hurt | hurt@4x.png | `3c898a2ee9c92ca2` | `a39e8708b81846b5` |  |
| hurt | hurt.normal.png | `c225f107add70523` | `89701a94a15dcf31` | adapted (IoU >= 0.95) |
| defend | defend.png | `23d512a0e866d702` | `745304bb18e33812` |  |
| defend | defend@2x.png | `f811377b85f9ab82` | `084f2d48c34ce3f4` |  |
| defend | defend@3x.png | `91357184c4c04f37` | `4bd09f85f36f84d1` |  |
| defend | defend@4x.png | `c691d269dffeb513` | `1ab191d4705243b5` |  |
| defend | defend.normal.png | `90cb1efedfe69a9a` | `713da025c0143683` | adapted (IoU >= 0.95) |
| sleep | sleep.png | `dd7c1783fc8b6aed` | `ddea23c9961284a7` |  |
| sleep | sleep@2x.png | `6f6e027f933312b8` | `81f95321da61752a` |  |
| sleep | sleep@3x.png | `7104f894c68231a6` | `fb39718921c238f8` |  |
| sleep | sleep@4x.png | `d422727113b5ede9` | `8c6e72baf3c208bd` |  |
| sleep | sleep.normal.png | `efdc59e9182e8d95` | `770385f5b84d0dd5` | adapted (IoU >= 0.95) |

### Rikku Dark Knight (FFX-2 only): 5 poses, 25 files

| pose | file | old sha256 (r63) | new sha256 (r64) | map |
|---|---|---|---|---|
| follow | follow.png | `4116db7b316258ba` | `c6269a840890e8df` |  |
| follow | follow@2x.png | `47cdaca77782f1e8` | `862b8afe39f656e4` |  |
| follow | follow@3x.png | `1eeb2aa53409c8af` | `5fd95aa1d4254681` |  |
| follow | follow@4x.png | `bb7f824a725271ca` | `32df202acb486ea9` |  |
| follow | follow.normal.png | `68d15c3abefc34e3` | `7bf794f6f0abfe22` | provisional, MoGe-2 owed |
| cast | cast.png | `301b650c5981e0d5` | `ab3797ce058ed7ea` |  |
| cast | cast@2x.png | `c475265800b6c912` | `2d630309b8e0f623` |  |
| cast | cast@3x.png | `f0be8feb573106b5` | `6739b6b200c0a940` |  |
| cast | cast@4x.png | `8755f75fe2a10738` | `8c6b124b7dfb772a` |  |
| cast | cast.normal.png | `0dbbfe1e2c766671` | `b24feefdd3dd354b` | adapted (IoU >= 0.95) |
| hurt | hurt.png | `379721fa21ad518a` | `e3b75225e8f2bc2b` |  |
| hurt | hurt@2x.png | `5eb051fca0ec54c7` | `78b186cb833955a1` |  |
| hurt | hurt@3x.png | `967692152ddf92c4` | `7651d21185dee117` |  |
| hurt | hurt@4x.png | `2e78ab8b4d803cc1` | `99d53ee10e15c07a` |  |
| hurt | hurt.normal.png | `f16e61741127edc9` | `71e59b0c0c679481` | provisional, MoGe-2 owed |
| critical | critical.png | `1a3484a15efcc691` | `1b8f35ea6a630ebe` |  |
| critical | critical@2x.png | `934068489e24616d` | `d3e0ce7a16c82cde` |  |
| critical | critical@3x.png | `c4459dbb1494fbd1` | `0c8087214762dd51` |  |
| critical | critical@4x.png | `5834c6819782ae2c` | `c03937bf82af17ac` |  |
| critical | critical.normal.png | `29a83729f42b83de` | `cc7c80555d278515` | provisional, MoGe-2 owed |
| victory | victory.png | `b05feb5528c50b71` | `811440796c2859b6` |  |
| victory | victory@2x.png | `a8900cbd2d2d8c9d` | `915ec6a8697c2096` |  |
| victory | victory@3x.png | `5ab0e9ea04358733` | `cb8722bfae9639a1` |  |
| victory | victory@4x.png | `f4f12ea4d3478c5a` | `7efdd1a1236eb8a2` |  |
| victory | victory.normal.png | `ecb3a1cb34fc2ccf` | `c2dff225833693f2` | adapted (IoU >= 0.95) |

### Paine Warrior (FFX-2 only): 5 poses, 25 files

| pose | file | old sha256 (r63) | new sha256 (r64) | map |
|---|---|---|---|---|
| ready | ready.png | `fbc8afbe5ff2fbd3` | `c23413c4c7df9841` |  |
| ready | ready@2x.png | `f3d904711c73a6ab` | `4d2267121dbd09df` |  |
| ready | ready@3x.png | `21c22169f7f47d73` | `7600446f44666e3f` |  |
| ready | ready@4x.png | `74b5d4114faf3e3b` | `9c972687b300621e` |  |
| ready | ready.normal.png | `9bc9128dafe26b91` | `cd4f68a7f3f124ca` | adapted (IoU >= 0.95) |
| follow | follow.png | `0c22d20b285bbc2e` | `4bc76d86cd832461` |  |
| follow | follow@2x.png | `c2707692709ac069` | `255d922426687a33` |  |
| follow | follow@3x.png | `8a6b35f9eafd02d1` | `7c6faebc6cc28faf` |  |
| follow | follow@4x.png | `d51a05dabf42fafe` | `31f6caa7271be0ac` |  |
| follow | follow.normal.png | `40ac1beb2cf94ab5` | `56f9abfd39ac095a` | adapted (IoU >= 0.95) |
| victory | victory.png | `65cd93da432b175e` | `54a643a3fee8aef0` |  |
| victory | victory@2x.png | `93d009a25a06fba3` | `39c8793e64ad71cf` |  |
| victory | victory@3x.png | `b8a79ba66f96317c` | `3d1bd8e7cd35138c` |  |
| victory | victory@4x.png | `798fdfb0e62940d1` | `49137b5430f4e87c` |  |
| victory | victory.normal.png | `ce3d71f5def16579` | `84e0209ae37a660d` | provisional, MoGe-2 owed |
| item | item.png | `ba8ab92acd609977` | `165eceb978404aff` |  |
| item | item@2x.png | `fbf727c94114669e` | `8af44e5ad29fe49b` |  |
| item | item@3x.png | `a4fda30a866a0674` | `ba6e55c4658df93e` |  |
| item | item@4x.png | `92d40b1c8de24696` | `2e828192780d2ad1` |  |
| item | item.normal.png | `52465c74a42d0885` | `4f7d675267fce22a` | provisional, MoGe-2 owed |
| sleep | sleep.png | `9bd6940b8a71852c` | `39065f23d66d42e5` |  |
| sleep | sleep@2x.png | `5a535a2af8926b47` | `b2f3201bac581522` |  |
| sleep | sleep@3x.png | `0389f6d16b288d6a` | `5cedbe8b46e8a020` |  |
| sleep | sleep@4x.png | `8d7495a3254daafb` | `a01f3d159d556d71` |  |
| sleep | sleep.normal.png | `0a79dbe2d1241caa` | `71028eb68161fa40` | provisional, MoGe-2 owed |

Not installed (the driver's decision 200f): Tidus (attack and hurt carry detached-piece and edge flags) and Yuna White Mage (only 2 poses gain). Every KO pose and every same-or-worse pose stays on the v2 painting.

## The registration and the gates

`node tools/art-install.mjs --target D:/pyrefly-art-r64 ...` through `install_rp.py --step all` (realize, install, post, register): `registered and the pose gate passes` twice. Then, against r64: `pose-gate --check --subjects yuna,kimahri,rikku-dark-knight,paine-warrior` PASS (58 paintings, 50 pass, 8 exempt, 0 fail); `pose-scale-check` PASS; `tools/gen/manifest.mjs --check` unchanged before the Echo master and regenerated after; `rig-gate --verify` PASS for `rikku-dark-knight` (11 keys, 4 exempt). Commits: `f0eaa3edf` (the 20 poses' records and tables, FFX and FFX-2, plus the pins below) and `fd76dfb48` (the 12 re-cut boss paintings measured again: Bahamut FFX-2, Seymour Flux FFX; this is the stale-pin finding of `r63-play.md`, kept in its own commit).

Pins moved (all re-measured values, not guesses): `critic-continuity-pose-motion` and `pose-stature-hold` (Yuna hurt now scale 0.935, head ratio 1.163; Kimahri hurt 1.065; the Tidus hurt pin 0.96 to 0.932: the record already read 0.932 before this install); `tests/fixtures/exp-leblanc/ch6-art.json` regenerated with `tools/exp-art.mjs snapshot` against r64 (as r47 did), which is a **visible change to Chapter VI (FFX-2): the five Paine Warrior repaints**, plus 43 lines for Paine Warrior and Yuna White Mage files that the v2 set of r63 had already changed; their previous hashes are kept in `ch6-art-pre-repair.json` so the hidden chapter's placeholders stay frozen.

**Still red, and red before this install** (the same five failures with `public/art` on r63): `held-defend-ffx`, `held-defend-ffx2` (their `defend` records are not in the table), `pose-install-0926` (2) and `pose-install-0930` (pins on the 2026-09-26 and 09-30 paintings, which the v2 set replaced: Paine attack, Yuna sleep). They pin retired paintings and need a decision by whoever owns the old installs; none touches a painting of this install.

## The Echo 2x master

`title/echo.png` is 1682 x 932; on a 2560 x 1440 screen the browser stretched it 1.5x. New `title/echo.2x.webp`, 3364 x 1864, 811,574 bytes, sha256 `9fde35d70615fdbe4d7f0069bff71465095c80265c378474277b41c7e0cb4867`: the 1x painting 4x through RealESRGAN on the local ComfyUI (8188; both installed models were tried in one GPU hold, 8 s and 11 s; nothing downloaded), Lanczos to exactly 3364 x 1864, then lossy WebP at quality 95, effort 6, smart subsampling, as `keyart.2x.webp` was made (PSNR 44.3 dB against the PNG). The `.2x.webp` name and the `title2x` manifest list are how the pipeline names and finds a title plate's 2x master (`tools/gen/manifest.mjs`, `ArtManifest.title2xUrlFor`); the derive step ships such a master as it is.

**Model: RealESRGAN_x4plus** (not `x4plus_anime_6B`). 1:1 crops at `D:/Tools/pyrefly-scratch/2026-10-24/art/echo/compare-{face,hands,lettering,water,city}.jpg`, left to right (or top to bottom): the plain 2x stretch, anime 6B, x4plus. Anime 6B gives the cleanest lines but turns the painting into cel work: the lettering's metallic marbling goes to flat white, the painted clouds of the far city lose their texture, the water gains invented sparkle, and the picture is 12 percent darker (mean 26.8 against 30.4; x4plus 30.8). x4plus keeps the texture and the colour, is visibly sharper than the stretch, and brought back to 1x differs from the original by 2.7 of 255 (anime 6B 5.0).

Code (`fca765f43` and `8ef82c9e4`): `src/app/screens/frontend/echoPlate.ts` (new; the widths 1682 and 3364, the `sizes` hints, the shared `srcset`), `titleMarkup.ts` (the Echo plane is offered the master, blind before the manifest has loaded as the Farplane plate is, only when the manifest lists it afterwards, so an art tree without the file never 404s the one image the screen is), `TitleScreen.ts` (`upgradeTitlePlanes(root, art)`), `index.html` (the preload names the same candidates and sizes, so one file is fetched for both), `boothCards.ts` (end card and attract card; the standalone `?card=` pages draw before the manifest may be in hand and get the list a moment later through `offerEchoMaster`). Tests: `title-art-choice`, `title-reveal`, `art-url-base`, `booth-cards`. **The rule the browser applies** is `srcset` with `sizes = max(100vw, 1.805 * 100vh)`: anything that needs more than 1682 device pixels of picture takes the master. 2560 x 1440 does, and so does 1920 x 1080 at a pixel ratio of 1 (the same rule as the Farplane plate); 1280 x 720 keeps the plate.

## Evidence

Scratch folder `D:/Tools/pyrefly-scratch/2026-10-24/art/evidence/` (all frames; the JSON of what each page picked; `card-<figure>.jpg`: before r63 | after r64, 1080 px wide, each under 1 MB, built from the real files of both mirrors, so the phone cards the repaint-prep lane made, which still say "nothing is installed", are superseded). In the repo: `docs/screenshots/r64-art-*` (the figure cards are not copied there: they show the paintings at size).

Headless Chromium (SwiftShader) against this tree's dev server with `public/art` pointing at `D:/pyrefly-art-r64`; no console errors and every art request answered 200:

- **Chapter I (FFX, `?demo=1&pack=demo`, seed 1) and Chapter IV (FFX-2) first command menus** at 1280 x 720 (`r64-art-ch1-first-menu-1280x720.jpg`, `r64-art-ch4-first-menu-1280x720.jpg`). Chapter I fields Tidus, Yuna and Kimahri; Chapter IV fields Rikku Dark Knight, Yuna White Mage and Paine Warrior, so both repainted FFX-2 figures are in the demo fight. Each installed figure's pose was then forced on its stage actor (`actor.setPose(name, { force: true })`, the fight running) to cast, hurt and victory: all load from r64 and draw (`r64-art-ingame-poses.jpg`; Kimahri's cast and victory are not in the install, so they show the v2 paintings). The Chapter IV frames carry the live fight's damage numerals and effects; a cleaner Chapter IV pass with the HUD off was queued and not run (other lanes held the GPU slot for over 25 minutes).
- **2560 x 1440 first menus were tried and not completed**: SwiftShader had not brought up the Chapter I menu after 5.5 minutes of a 9-minute hold, so the run was stopped. Someone should look at the first menus at 2560 on the booth PC.
- **Title, end card and attract card at 2560 x 1440, pixel ratio 1** (`r64-art-echo-title-2560x1440.jpg`, `r64-art-echo-endcard-2560x1440.jpg`, `r64-art-echo-attract-2560x1440.jpg`): all three pick `title/echo.2x.webp` (`currentSrc`); at 1280 x 720 the title picks the 1x `echo.png`. The end and attract cards first showed no master when opened with `?card=` (the manifest was not in hand when they drew); the follow-up commit fixed that and the rerun picks it.

## Not done

- **Eight real normal maps** (MoGe-2, GPU): yuna cast and victory; rikku-dark-knight critical, follow, hurt; paine-warrior item, sleep, victory. `D:/Tools/pyrefly-scratch/2026-10-24/art/work-r64/maps-jobs.json` lists them; the recipe is INSTALL.md step 4 of the repaint-prep lane (`maps_queue.py`, 3 images per hold). Until then they carry the old shading on the moved edges (worst: Rikku hurt, IoU 0.9155; Paine victory 0.9022).
- The `@2x/@3x/@4x` tiers are the CPU carrier's, not ESRGAN.
- The party rigs stay OFF; `rigs/rikku-dark-knight` still holds pieces cut from the old paintings (INSTALL.md step 6 only matters if the rigs go on).
- No production build, `art-derive verify/audit`, `art-browser-load` or full `npm test` in this lane (no builds here; D: space). The release lane runs them. In particular check the built `index.html` preload: `art-derive-plugin` rewrites its names (`echo.png` to `echo.webp`), and `tests/unit/art-url-base.test.ts` scans a build when `PYREFLY_SCAN_DIST` is set.
- No person has looked at the Echo master or the new poses on a 2560 screen.
- `NOW.md` and the ledgers (`ACTIONS.md`, `DECISIONS.md`) are the driver's and were not touched.

## Review fixes, 2026-10-24 (the r64 defaults and art review, M2; tests only, both games)

The five reds listed above under "Still red" are green against the r64 art and this branch's records (`held-defend-ffx` 6, `held-defend-ffx2` 6, `pose-install-0926` 24, `pose-install-0930` 4; 40 of 40). The driver's call under Bailey's "make all the decisions" of 2026-10-24: the old pins are retired, no painting is touched.

- **`held-defend-ffx`, `held-defend-ffx2`**: the motion test build's install v1 (84c36bede) registered from a mirror that does not hold the held Defend files, so Yuna's and Rikku Dark Knight's `defend` rows are gone from `pose-measure.json` (Rikku FFX's still carries `skip`). Held means the same either way, so the test now says: if a row is there it is skipped, and the registration table has no Defend row. The pin test, the install record test and the on-disk tests are unchanged.
- **`pose-install-0926`**: `paine-warrior/attack` and `paine-warrior/cast` were replaced after the 2026-10-07 repair pins. For those two the disk check is the painting the measured registration names (`docs/target/pose-measure.json`, written by the install that placed it, and checked against the file by pose-scale-art and the pose gate); their sidecars are the new install's, so the D-194 head-match note is not asserted for them; the loader's scale is still the table's. The other 18 keep every assertion.
- **`pose-install-0930`**: eight of the 15 (`yuna`, `tidus`, `kimahri`, `paine-warrior`, each `sleep` and `critical`) were replaced after the pin, some of them again by this install (`kimahri/sleep`, `paine-warrior/sleep`, `yuna/critical`). Same rule: the registered painting. The other seven keep the locked hash.
- A third change to any of those ten files now fails the registration checks as before; what is dropped is only the claim that the 2026-09-26 and 09-30 hashes are still the paintings on disk. `docs/target/approved-hashes.json` is not edited (it keeps the history).
