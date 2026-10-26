# r64-art-ledger: the 89 replaced paintings in the protected-art ledger (PR-0513)

Lane: records, 2026-10-26 (item 205d of the driver's list), branch `records-art-r64` from `origin/main` 2481843fe, tree `D:/pyrefly-pilgrim-proto`. **Records only: no art file was changed**, nothing built or deployed. Bailey, 2026-10-25 ~23:45 EDT, verbatim: "im aboiut to go to sleep i'll go with all your recommendations and i delegate all decision making to you for now. just keep going please!"

**Result.** `verify-approved` (`ROOT=<tree> node D:/Tools/pyrefly-lora/tools/verify-approved.mjs`, the public/art of the tree is the junction to `D:/pyrefly-art-r64`, the art of releases 63 and 64) read 828 ok and 89 mismatched in round 29 (deep review PR-0513). After this pass it reads **917 ok, 0 mismatched, 0 missing** (869 in `approved-hashes.json`, 48 judge-locked), the 917 round 28 read. Every mismatch had the same cause: a protected painting was replaced by an install and the ledger was not updated.

## What the 89 are

The ledger pins 83 distinct files in 89 entries (six files are pinned in two sets, e.g. Kimahri's sleep). Three changes made them; they sit in three groups:

| group | entries | whose words | pins now say |
|---|---|---|---|
| **Boss re-cut** of 2026-10-23: Seymour Flux 11, Bahamut 8 | 19 | **Bailey's own yes**, 2026-10-23 10:20 EDT, verbatim "Yes, re-cut both (Recommended)" (D-1285, item 193c) | `approved` 2026-10-23, `replacedBy` his words; the old pin one `supersedes` down, its bytes in the private art repo `archive/2026-10-23-boss-recut` |
| **Art batch of 2026-10-22** (the v1 colour lock, 24 pins; a GPU head retouch, 23; a GPU repaint, 2): Tidus 13, Yuna White Mage 11, Paine Warrior 8, Kimahri 7, Yuna 5, Rikku Dark Knight 5 | 49 | **a driver call under his delegation**, not his approval of the picture: the method was his pick on the question cards (D-1182, D-1189, D-1217, D-1218, D-1219, D-1240, D-1292) and the files shipped under "you can make all the decisions for me, ill go with all your recommendations. i still cant play it unfortunately. time crunch." (2026-10-24 13:40 EDT, D-1321, D-1327, D-1331) | `delegated` 2026-10-24 and no `approved`; the old pin one `supersedes` down, its bytes in `D:/pyrefly-art-r61` (the release 62 art, never written) |
| **r64 repaint** of 2026-10-24, on top of the batch: Yuna 5, Kimahri 6, Rikku Dark Knight 5, Paine Warrior 5 (20 paintings, Kimahri's sleep pinned twice) | 21 | **a driver call under the same words** (D-1327, item 200f; restated 18:00 EDT "I'll go with all of your recommendations. You make the calls please.", D-1333) | `delegated`; the batch's pin sits one `supersedes` down with its bytes in `archive/2026-10-24-2026-10-24-repaint-4-figures` (commit 754a4ca), and the ledger's own old pin one more down |

Three sets in `docs/target/approved-hashes.json` (`bailey:2026-10-23-boss-recut`, `driver:2026-10-22-colour-lock (D-1182 to D-1292, delegated by Bailey)`, `driver:2026-10-24-repaint-4-figures (D-1327, delegated by Bailey)`) hold the words and the facts once and hold no pins of their own (the verifier skips a key without a sha256); the pins stayed in the sets where they were, in the house shape of [art-install-2026-10-04](art-install-2026-10-04.md) (the new pin on top, the old record one `supersedes` down with its `backup`; an entry that already carried an earlier replacement keeps it nested).

| figure | game | boss re-cut | colour lock | + head retouch | + GPU repaint | r64 repaint (on a batch pin) | pins |
|---|---|---|---|---|---|---|---|
| kimahri | FFX | 0 | 3 | 4 | 0 | 6 | 13 |
| seymour-flux-body | FFX | 11 | 0 | 0 | 0 | 0 | 11 |
| tidus | FFX | 0 | 3 | 10 | 0 | 0 | 13 |
| yuna | FFX | 0 | 1 | 3 | 1 | 5 | 10 |
| ffx2-bahamut | FFX-2 | 8 | 0 | 0 | 0 | 0 | 8 |
| paine-warrior | FFX-2 | 0 | 3 | 4 | 1 | 5 | 13 |
| rikku-dark-knight | FFX-2 | 0 | 3 | 2 | 0 | 5 | 10 |
| yuna-white-mage | FFX-2 | 0 | 11 | 0 | 0 | 0 | 11 |

## What is and is not his word (read this before calling the ledger "approved")

- **19 pins rest on his own named yes** (the boss re-cut). Even there he chose option A from the driver's phone cards; that he has looked at the built paintings is not on record.
- **70 pins are driver calls, his to overturn.** The art batch of 2026-10-22 was a candidate set (`APPROVED.json` of the art lane: "approvedBy: release driver ... Bailey approves per character at ~22:00 EDT 2026-10-22"); D-1292 kept that per-character look for Saturday; on Saturday he handed every decision to the driver (D-1321) and the mirror shipped as it stood. **Tidus and Yuna White Mage were not touched by the r64 repaint (D-1327), but their paintings are not the ones the ledger pinned either:** 24 of the 70 are theirs (Tidus 13, Yuna White Mage 11) and they are the batch's colour-locked and retouched files, which shipped from release 63 on (round 29 counted them as Tidus 11 and Yuna White Mage 13; counted by file path they are Tidus 13 and Yuna White Mage 11, and its per-figure split differs elsewhere too, but its group totals of 46, 19 and 24 agree with these). The pins say so and do not say "approved".
- If Bailey says he did not approve any of the 70, that is an unapproved replacement of approved art (`critic/RUBRIC.md` 6 never waives it) and the old bytes are all there: `D:/pyrefly-art-r61` (the release 62 art tree) and the private art repo (`current/` still holds the ledger paintings for the 48 batch files the repaint did not paint again; two of them an older third version).
- **Owed, not done here (the private art repo is read-only in this lane):** its `current/` folder holds the shipped painting of only the 20 repainted files. For the other 63 distinct files (48 of the batch, 15 of the boss re-cut) it still holds the replaced one (two of the batch files hold an older third version, three of the boss files have no copy). The boss originals are archived (`archive/2026-10-23-boss-recut`); the batch's shipped files exist only as hard links in `D:/pyrefly-art-motion`, `-r63` and `-r64` and on the live site. A later step installs them into `current/` (archiving what they replace first).
- **Not pinned by the ledger, so no check ever saw them change:** the @2x, @3x, @4x tiers and normal maps of the 100 repaint files (`r64-art-shas.json`), the boss re-cut's other 143 files (tiers and rig parts, of its 158, `boss-matte-files.md`), `title/echo.2x.webp` (D-1328, a new file, not a replacement), and the batch's other files. Pinning them would be new records, not corrections; not done.

Game case (rule 14): boss re-cut Seymour Flux FFX only, Bahamut FFX-2 only; batch and repaint per figure as the table: Tidus, Yuna, Kimahri FFX only; Yuna White Mage, Rikku Dark Knight, Paine Warrior FFX-2 only. The ledger is shared plumbing (both).

## The list (83 files; hashes are the first 16 hex of the sha256, the full values are in [r64-art-ledger-shas.json](r64-art-ledger-shas.json))

"ledger" is the pin before this pass (the release 62 painting), "batch" the 2026-10-22 file where the r64 repaint painted the file again, "now" the shipped file and the pin after.

| file (under public/art) | game | set(s) | change | ledger | batch | now |
|---|---|---|---|---|---|---|
| `characters/ffx2-bahamut/attack.png` | FFX-2 | bailey:2026-10-01-art | boss re-cut (D-1285) | `f20eeef2235baafa` |  | `7bbb49703f2d9ba4` |
| `characters/ffx2-bahamut/cast.png` | FFX-2 | bailey:2026-10-02-art | boss re-cut (D-1285) | `e2ab446c0c7ff02f` |  | `cfc1419e798dd294` |
| `characters/ffx2-bahamut/hurt.png` | FFX-2 | bailey:2026-10-02-art | boss re-cut (D-1285) | `cd2d46369f577600` |  | `90dfc6da2495b0db` |
| `characters/ffx2-bahamut/idle.png` | FFX-2 | bailey:2026-10-04-trapped-white | boss re-cut (D-1285) | `d5a1c4bcd99f6851` |  | `dc553a716dd9fb6b` |
| `characters/ffx2-bahamut/idle@2x.png` | FFX-2 | bailey:2026-10-01-art | boss re-cut (D-1285) | `816a9babde98e532` |  | `536fb41687ab9301` |
| `characters/ffx2-bahamut/ko.png` | FFX-2 | bailey:2026-10-02-art | boss re-cut (D-1285) | `fc4a212803dbc8db` |  | `7a12b03bbecd7511` |
| `characters/ffx2-bahamut/telegraph.png` | FFX-2 | bailey:2026-10-03-picks | boss re-cut (D-1285) | `3e2da8e74ad0d8ad` |  | `e88a72d9a7c0078e` |
| `characters/ffx2-bahamut/telegraph@2x.png` | FFX-2 | bailey:2026-10-03-picks | boss re-cut (D-1285) | `ca21ed244c1a8d36` |  | `4e719d097fde7c9f` |
| `characters/kimahri/attack.png` | FFX | bailey:2026-10-02-art | colour lock + head retouch (art batch of 10-22) | `da733380c2cc4509` |  | `585ffbb1996994cd` |
| `characters/kimahri/cast.png` | FFX | bailey:2026-10-02-art | colour lock + head retouch (art batch of 10-22) | `76cf4bc83aae47d2` |  | `b21f868fe11c2912` |
| `characters/kimahri/critical.png` | FFX | bailey:2026-09-30-poses; bailey:2026-10-02-art | colour lock + head retouch (art batch of 10-22) | `45fd72d161d48b6a` |  | `7bd3f3bcaeb4f2c3` |
| `characters/kimahri/defend.png` | FFX | bailey:2026-10-09-picks-ffx | colour lock, then r64 repaint (D-1327) | `028a37ad0078362b` | `23d512a0e866d702` | `745304bb18e33812` |
| `characters/kimahri/follow.png` | FFX | bailey:2026-10-02-art | colour lock, then r64 repaint (D-1327) | `0fed7a05a22409d4` | `55504f6788c39a67` | `239ef170ab94ee75` |
| `characters/kimahri/hurt.png` | FFX | bailey:2026-10-02-art | colour lock + head retouch, then r64 repaint (D-1327) | `c2cd2a4e642da8b4` | `ed846ce7461f61d8` | `962cbcb97db7e92d` |
| `characters/kimahri/item.png` | FFX | bailey:2026-10-02-art | colour lock (art batch of 10-22) | `de99b020ee2a3c3a` |  | `7a05ca6283c88689` |
| `characters/kimahri/ko.png` | FFX | bailey:2026-10-02-art | colour lock (art batch of 10-22) | `5938bac969407e34` |  | `ec7b98ea8409ca1f` |
| `characters/kimahri/ready.png` | FFX | bailey:2026-10-02-art | colour lock + head retouch, then r64 repaint (D-1327) | `d5ef2deaefaf1c56` | `a961b7d74864e19e` | `35330f2f4a2fc3a6` |
| `characters/kimahri/sleep.png` | FFX | bailey:2026-09-30-poses; bailey:2026-10-02-art | colour lock + head retouch, then r64 repaint (D-1327) | `ed0a10678e089f8b` | `dd7c1783fc8b6aed` | `ddea23c9961284a7` |
| `characters/kimahri/victory.png` | FFX | bailey:2026-10-02-art | colour lock (art batch of 10-22) | `9d9a7116b658e34b` |  | `8380630115017202` |
| `characters/paine-warrior/attack.png` | FFX-2 | bailey:2026-09-26-poses | colour lock + head retouch (art batch of 10-22) | `682cc7cb7a9f5e35` |  | `b29ac1937a425a3e` |
| `characters/paine-warrior/cast.png` | FFX-2 | bailey:2026-09-26-poses | colour lock (art batch of 10-22) | `c3442ba9930a238b` |  | `defbb3c0dfc1e498` |
| `characters/paine-warrior/critical.png` | FFX-2 | bailey:2026-09-30-poses | colour lock + GPU repaint (art batch of 10-22) | `f23f998b5fd3f242` |  | `50db07c13276f45a` |
| `characters/paine-warrior/defend.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `495e58e64cb6d2ac` |  | `9a72b1c08a352806` |
| `characters/paine-warrior/follow.png` | FFX-2 | bailey:2026-10-01-art | colour lock + GPU repaint, then r64 repaint (D-1327) | `f4cdb5d65bef20ae` | `0c22d20b285bbc2e` | `4bc76d86cd832461` |
| `characters/paine-warrior/hurt.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `e8463888a21030c3` |  | `09b8668d39937bcd` |
| `characters/paine-warrior/item.png` | FFX-2 | bailey:2026-10-01-art | colour lock + GPU repaint, then r64 repaint (D-1327) | `06b68c4a7f615a11` | `ba8ab92acd609977` | `165eceb978404aff` |
| `characters/paine-warrior/ko.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock + head retouch (art batch of 10-22) | `8ef58b208bc5be24` |  | `0c8e18502fd32e7b` |
| `characters/paine-warrior/od-x2-warrior-armor-break.png` | FFX-2 | bailey:2026-10-03-picks | colour lock + head retouch (art batch of 10-22) | `745b015ce9525b6e` |  | `90c19c9a9ea56265` |
| `characters/paine-warrior/od-x2-warrior-power-break.png` | FFX-2 | bailey:2026-10-03-picks | colour lock + head retouch (art batch of 10-22) | `745b015ce9525b6e` |  | `79df734dddf2c0f3` |
| `characters/paine-warrior/ready.png` | FFX-2 | bailey:2026-10-01-art | colour lock + head retouch, then r64 repaint (D-1327) | `b00ac22583e9d75c` | `fbc8afbe5ff2fbd3` | `c23413c4c7df9841` |
| `characters/paine-warrior/sleep.png` | FFX-2 | bailey:2026-09-30-poses | colour lock + GPU repaint, then r64 repaint (D-1327) | `a66a52b9b69e88cf` | `9bd6940b8a71852c` | `39065f23d66d42e5` |
| `characters/paine-warrior/victory.png` | FFX-2 | bailey:2026-09-25-poses | colour lock + GPU repaint, then r64 repaint (D-1327) | `031424726fbebe65` | `65cd93da432b175e` | `54a643a3fee8aef0` |
| `characters/rikku-dark-knight/attack.png` | FFX-2 | bailey:2026-10-03-picks | colour lock + head retouch (art batch of 10-22) | `a8d9cee74a8a8fd5` |  | `5440b14c761e24c3` |
| `characters/rikku-dark-knight/cast.png` | FFX-2 | bailey:2026-10-01-art | colour lock, then r64 repaint (D-1327) | `ce9ecdef063c56e9` | `301b650c5981e0d5` | `ab3797ce058ed7ea` |
| `characters/rikku-dark-knight/critical.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock + GPU repaint, then r64 repaint (D-1327) | `ac8658584649386a` | `1a3484a15efcc691` | `1b8f35ea6a630ebe` |
| `characters/rikku-dark-knight/follow.png` | FFX-2 | bailey:2026-10-01-art | colour lock + GPU repaint, then r64 repaint (D-1327) | `97899f5b1d268611` | `4116db7b316258ba` | `c6269a840890e8df` |
| `characters/rikku-dark-knight/hurt.png` | FFX-2 | bailey:2026-10-03-picks | colour lock + GPU repaint, then r64 repaint (D-1327) | `3dc49367216777e0` | `379721fa21ad518a` | `e3b75225e8f2bc2b` |
| `characters/rikku-dark-knight/item.png` | FFX-2 | bailey:2026-10-01-art | colour lock + head retouch (art batch of 10-22) | `94def74a2fbe4879` |  | `8da87fccb07eddfc` |
| `characters/rikku-dark-knight/ko.png` | FFX-2 | bailey:2026-10-03-picks | colour lock (art batch of 10-22) | `26d12305db94687c` |  | `68401e3b971ffe72` |
| `characters/rikku-dark-knight/ready.png` | FFX-2 | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `cb246aa5fa2e3728` |  | `2b3de8d4a2313793` |
| `characters/rikku-dark-knight/sleep.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `10d136ed84bf637c` |  | `81034b13d52732c4` |
| `characters/rikku-dark-knight/victory.png` | FFX-2 | bailey:2026-10-01-art | colour lock, then r64 repaint (D-1327) | `d4e61c69483aa47b` | `b05feb5528c50b71` | `811440796c2859b6` |
| `characters/seymour-flux-body/attack.png` | FFX | cast:seymour-flux-body; bailey:2026-10-02-art | boss re-cut (D-1285) | `fc3b8ef9f0eb2095` |  | `cd9140bbd257ebb3` |
| `characters/seymour-flux-body/cast.png` | FFX | cast:seymour-flux-body; bailey:2026-10-02-art | boss re-cut (D-1285) | `329bbd2ccedfc468` |  | `8fe70ab0abaf88ff` |
| `characters/seymour-flux-body/hurt.png` | FFX | cast:seymour-flux-body; bailey:2026-10-02-art | boss re-cut (D-1285) | `6a2c8234faf9cd11` |  | `35f1f63522bde77e` |
| `characters/seymour-flux-body/idle.png` | FFX | cast:seymour-flux-body | boss re-cut (D-1285) | `06c416a771d192ce` |  | `3cc3df1a1fea8236` |
| `characters/seymour-flux-body/idle@2x.png` | FFX | bailey:2026-10-01-art | boss re-cut (D-1285) | `ceeca312b90cfc1b` |  | `80af9ff48c4a0224` |
| `characters/seymour-flux-body/ko.png` | FFX | cast:seymour-flux-body; bailey:2026-10-02-art | boss re-cut (D-1285) | `33930c70dd7de5cf` |  | `fad97c5a1a175dba` |
| `characters/seymour-flux-body/telegraph.png` | FFX | bailey:2026-10-03-picks | boss re-cut (D-1285) | `929cb0eec9e680c2` |  | `75aefe19682c238c` |
| `characters/tidus/attack.png` | FFX | cast:tidus | colour lock + head retouch (art batch of 10-22) | `33058a4e6a06af51` |  | `baff1d78816b2c15` |
| `characters/tidus/cast.png` | FFX | cast:tidus | colour lock + head retouch (art batch of 10-22) | `55ac162539ef1b74` |  | `6b8f6930b4e7c7fb` |
| `characters/tidus/critical.png` | FFX | bailey:2026-09-30-poses | colour lock + head retouch (art batch of 10-22) | `514e60d3c83c3e5f` |  | `77721994ed0a4c52` |
| `characters/tidus/defend.png` | FFX | bailey:2026-10-09-picks-ffx | colour lock + head retouch (art batch of 10-22) | `207ba99591ce3768` |  | `6d0889d3ae00ff11` |
| `characters/tidus/follow.png` | FFX | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `a66ec4e9ac2ea214` |  | `e7518c97c028ca9a` |
| `characters/tidus/hurt.png` | FFX | cast:tidus | colour lock + head retouch (art batch of 10-22) | `29864fe381d60251` |  | `734a266f7df2a99d` |
| `characters/tidus/item.png` | FFX | cast:tidus | colour lock + head retouch (art batch of 10-22) | `0aa4b25023ef7259` |  | `fa5d1f3201766ef0` |
| `characters/tidus/ko.png` | FFX | cast:tidus | colour lock + head retouch (art batch of 10-22) | `f14bad6052a9e8d0` |  | `5b34526990512d53` |
| `characters/tidus/od-energy-rain.png` | FFX | bailey:2026-10-03-picks | colour lock + head retouch (art batch of 10-22) | `adc711bbf7ee3af3` |  | `42af097666554bc0` |
| `characters/tidus/od-slice-and-dice.png` | FFX | bailey:2026-10-03-picks | colour lock + head retouch (art batch of 10-22) | `b1bfd5d3f20167fa` |  | `a53cb6ae5585c2fb` |
| `characters/tidus/ready.png` | FFX | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `a4c04da6d9bef52a` |  | `546eb33d1127eaa6` |
| `characters/tidus/sleep.png` | FFX | bailey:2026-09-30-poses | colour lock + head retouch (art batch of 10-22) | `4b7c3a4f6f9f0711` |  | `bf8190c90b8b6687` |
| `characters/tidus/victory.png` | FFX | cast:tidus | colour lock (art batch of 10-22) | `80a96514650b1ef2` |  | `402a3ed6c3eaf64c` |
| `characters/yuna-white-mage/attack.png` | FFX-2 | bailey:2026-10-03-picks | colour lock (art batch of 10-22) | `336af4f0f5c118d9` |  | `78c4ea4439024d06` |
| `characters/yuna-white-mage/cast.png` | FFX-2 | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `9fc54b0a753896a7` |  | `e7c35b3e2dba63cd` |
| `characters/yuna-white-mage/critical.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `b8bc09a9e96f1510` |  | `847d0abf923cb1d9` |
| `characters/yuna-white-mage/defend.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `b4ee085f43454a5f` |  | `27ab21d36c8d0d3d` |
| `characters/yuna-white-mage/follow.png` | FFX-2 | bailey:2026-10-03-picks | colour lock (art batch of 10-22) | `8573590de142f91b` |  | `7534220ace360f90` |
| `characters/yuna-white-mage/hurt.png` | FFX-2 | bailey:2026-10-03-picks | colour lock (art batch of 10-22) | `3001a910ef0a7b64` |  | `76a14bba54771a39` |
| `characters/yuna-white-mage/item.png` | FFX-2 | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `c524046a5cc7d46d` |  | `01a07796c67b4135` |
| `characters/yuna-white-mage/ko.png` | FFX-2 | bailey:2026-10-03-picks | colour lock (art batch of 10-22) | `4f428ed869edd8a3` |  | `59f2488a1b510229` |
| `characters/yuna-white-mage/ready.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `830f0c76860872d0` |  | `9e3f041114ddf17b` |
| `characters/yuna-white-mage/sleep.png` | FFX-2 | bailey:2026-10-09-picks-ffx2 | colour lock (art batch of 10-22) | `ac884b792c4d79a2` |  | `4e0ea945fad3c164` |
| `characters/yuna-white-mage/victory.png` | FFX-2 | bailey:2026-10-01-art | colour lock (art batch of 10-22) | `56d409e2611d9d44` |  | `7ce780a142d4335f` |
| `characters/yuna/attack.png` | FFX | cast:yuna | colour lock + head retouch (art batch of 10-22) | `2a643c14421b6e9f` |  | `5092bba51963c158` |
| `characters/yuna/cast.png` | FFX | cast:yuna | colour lock + GPU repaint, then r64 repaint (D-1327) | `15890fc92ea80414` | `7bed409d753136dc` | `b007285a8c7bd4c6` |
| `characters/yuna/critical.png` | FFX | bailey:2026-09-30-poses | colour lock + head retouch, then r64 repaint (D-1327) | `e1ad0dac5025fc34` | `eba4698167e35c4e` | `e1f61dd582317f9a` |
| `characters/yuna/follow.png` | FFX | bailey:2026-10-02-art | colour lock (art batch of 10-22) | `45aa62ea6d05f07e` |  | `2add01579f3533a4` |
| `characters/yuna/hurt.png` | FFX | cast:yuna | colour lock + GPU repaint, then r64 repaint (D-1327) | `8b1ff43235f8b039` | `da0ad737452c8207` | `fa754438a81151a6` |
| `characters/yuna/item.png` | FFX | cast:yuna | colour lock + GPU repaint, then r64 repaint (D-1327) | `9ba097c27c138f4c` | `806b7a05d004db5b` | `8d923a9c1e8b5526` |
| `characters/yuna/ko.png` | FFX | cast:yuna | colour lock + head retouch (art batch of 10-22) | `4c0092651f1a149b` |  | `1a5f5d6167aa3519` |
| `characters/yuna/ready.png` | FFX | bailey:2026-10-01-art | colour lock + GPU repaint (art batch of 10-22) | `3d2a6e256e65827a` |  | `d1aa869e1eff5f3e` |
| `characters/yuna/sleep.png` | FFX | bailey:2026-09-30-poses | colour lock + head retouch (art batch of 10-22) | `1cf4028e6b7745e1` |  | `6dfd52853372e5d3` |
| `characters/yuna/victory.png` | FFX | cast:yuna | colour lock + GPU repaint, then r64 repaint (D-1327) | `5de64604c11dcfc2` | `603ab2ab4c26fc23` | `e4e753e0bf2923c5` |
