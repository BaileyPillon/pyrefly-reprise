# art-install-2026-10-03: the art installed for release 37 (D-320, D-322, D-325, D-332)

Done in the main tree `D:/Final Fantasy` from main `8d1e1605` (release 37 integration). Not deployed. Follows the
pattern of the 2026-10-02 install (`ad0b8973`, [r36-art.md](r36-art.md)). Driver brief: the order was (1) the living-portrait
parts, (2) the held adopted art in the 2026-10-02 morning page's order, (3) the Wakka face pass only if its tile shows
Bailey's yes, stopping at the 800 MB line (D-332: "All your recommendations").

Game case (rule 14): per painting, from the sidecar's `game`. The twirl keys, Vegnagun, FFX-2 Bahamut, LeBlanc, Logos,
Ormi, Trema, the Den of Woe shades, the Leblanc goons, Cindy / Mindy / Sandy and the other FFX-2 keys are FFX-2 only;
Sin's fins and Genais, Guado Guardian, Evrae and Mortibody are FFX only. The living-portrait parts are both (FFX plates:
Tidus, Yuna, Wakka, Lulu, Kimahri, Auron, Rikku; FFX-2 plates: Yuna X-2, Rikku X-2, Paine).

## What went in

| Step | What | Files | Bytes (build delta) |
|---|---|---|---|
| 1. D-320 / D-321 | the ten plates' living-portrait parts and `manifest.json`, copied from the `portraits-live` worktree (`D:/pyrefly-fb-camera/public/portrait-parts/`, see [portraits-live.md](portraits-live.md)) into `public/art/portrait-parts/`. A copy is kept in `D:/Tools/pyrefly-art-backup/portrait-parts-2026-10-03/` | 193 | 3,079,042 (build: 779,831,790 with them, 776,753,213 without by the integrator) |
| 2a. D-322 | the 8 held dressphere twirl keys: the forming and manifest of Rikku's Dark Knight, Thief and Alchemist and of Paine's Dark Knight. All 77 keys are now in | 8 new | +3.65 MB |
| 2b. D-325 | 35 of the 40 boss keys, in the page's order: Vegnagun tail hurt and KO (replace), FFX-2 Bahamut hurt and KO (replace) and cast, LeBlanc / Logos / Ormi / Trema attacks, the shades' hurts and KOs (Baralai, Gippal, Nooj), the goons' keys, Sin's left and right fin and Genais attacks, Guado Guardian hurt, Evrae attack, Mortibody hurt and cast, Cindy / Mindy / Sandy | 35 images (4 replace, backed up first) | +14.8 MB |

Install: the 2026-10-02 package (`D:/Tools/pyrefly-art-backup/approved/2026-10-02-art/`, README section "Second install")
rebuilt with `python work/make_package.py --install=a,b,c --also=D-327,D-328 --cut=165 --base=779831790` (the cut keeps
everything already installed and the first 35 held boss keys; the earlier staging was moved to
`F:/pyrefly-parked/2026-10-03/install/`, nothing deleted), then `node install.mjs --apply` (a dry run first). The 4 replaced
paintings (`vegnagun-tail/hurt`, `vegnagun-tail/ko`, `ffx2-bahamut/hurt`, `ffx2-bahamut/ko`) are backed up in the
package's `backup/replaced/` and again in `backup/at-apply-<time>/`; their entries in the older locked sets moved to the
new hash with a `supersedes` record. `public/art/manifest.json` regenerated; every installed state is listed.
`docs/target/approved-hashes.json`: set `bailey:2026-10-02-art` extended by 43 images, its note says what went in and what waits.

Checks: `node D:/Tools/pyrefly-lora/tools/verify-approved.mjs` 634 ok, 0 mismatched, 0 missing; `node tools/fx-assets.mjs
verify` PASS (16 files restored first from the backup); vitest `critic-policy-adoptions`, the art / manifest / hash /
pose-install / living-portrait tests and `tests/unit/engine` all pass. The keys were NOT looked at in battle (the 8
twirl keys play through `src/engine/fx/mix/twirl.ts` as checked on 2026-10-02; the boss keys need their in-battle look at
the focused review).

## The line (D-332)

Scratch production build of main into `D:/Tools/pyrefly-scratch/2026-10-03/rel37-bytes/` (`npx vite build --outDir ...
--emptyOutDir`, fx assets restored, never `dist/`; `.map` files 0; count script `size37.mjs` next to it):

| | Bytes |
|---|---|
| main 8d1e1605 plus the parts (step 1) | 779,831,790 |
| plus the held art (steps 2a, 2b) | **798,328,606** (1,715 files) |
| plus about 300,000 for `artifact-manifest.json` | 798,628,606 |
| room under 800,000,000 | 1,371,394 (the brief wants at least 1,000,000) |

The next key in the page's order (Vegnagun tail light-state cast, +0.74 MB) would have left 0.63 MB, so the cut is there.

## What waits (package `held/`, 24 images, about +14.6 MB by the package's accounting)

- D-325 c, 5 keys: the light-state casts of Vegnagun's tail, leg, head and body and Shuyin (FFX-2 only).
- D-325 d, 19 aeon extras: Ifrit attack / KO / cast, Ixion attack / cast, Bahamut attack / KO / cast, Shiva and Anima casts,
  Isaaru's Grothia and Spathi attack / KO / cast, x2-Shiva and x2-Anima casts and x2-Anima's attack twin (the attacks
  replace paintings; FFX aeons FFX only, Isaaru and the x2-aeons FFX-2 only).
- D-329 (Vegnagun tail 3x masters, held by Bailey's answer) and D-332's 2x masters of the new keys (about 150 MB): not packaged.
- Not installed: the Wakka face pass (see below), and everything under tonight's `candidates/2026-10-03-overnight/`
  (they await Bailey's picks).
- Room: install of what waits needs about 14.6 MB more; the next line to move is D-332's reading (MB against MiB, on the
  morning page) or room found elsewhere.

## The Wakka face pass: NOT installed

The tile "A face pass on the weak close-ups" (`docs/concepts/polish/closeup-likeness/`) is `approved` ("Bailey, 19 Sep 2026")
but has no `reaction.named`; D-250 (2026-09-27, "I'll go with all of your recommendations") accepted Q16 C-2 as "yes, shown
1:1 before it ships", and `public/art/pause/wakka.png` is hash-locked, so installing it needs his word on the exact file after
he has seen the 1:1 before / after. Nothing in the registry records that sight. Skipped by the brief's own condition.
The after-image waits at `docs/concepts/polish/closeup-likeness/_src/wakka-plate-after.png`.

## Registry changes (only what was installed)

- `docs/target/decisions.json`: D-320 `delivery` implemented (parts installed; driver on main), D-322 text (all 77 keys),
  D-325 text (49 of 73 installed, 24 wait; still `in-progress`), D-332 text (the 2026-10-03 measurement).
- `docs/target/targets.json`: tile "Living portrait feel (both)" `delivery` implemented.
- `docs/target/approved-hashes.json`: the set extended as above.
