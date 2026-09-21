# Art round 4 - withdrawn (21 Sep 2026)

Bailey approved the round from the five contact sheets in this folder (see
`CHOSEN.md`), then saw the installed paintings at full size and said:

> some of the art work still looks significantly lower quality than before.
> it's not black or misrendered per say but it's a huge downgrade in quality.

The orchestrator compared `public/art/characters/lulu/attack.png` (the new
art4 painting: harsh posterised colour, wrong doll, garbled lace) against
`public/art/characters/lulu/idle.png` (an older approved painting: clean
line, canon costume) and agreed.

## What was restored

The 31 poses that art round 4 **replaced** (`CHOSEN.md`'s "Replaced" column
says `yes`) were reverted to the paintings art4 replaced. For each, both the
`.png` and its `.json` sidecar were copied back from
`D:\Tools\pyrefly-art-backup\replaced\2026-09-21-art4\<same relative path>`
over the installed file, and verified equal to that backup by sha256:

- `characters/lulu/attack`, `characters/lulu/hurt`, `characters/lulu/ko`
- `characters/rikku/cast`, `characters/rikku/hurt`, `characters/rikku/ko`
- `characters/kimahri/attack`, `characters/kimahri/victory`
- `characters/yunalesca-2/cast`
- `characters/yunalesca-3/attack`, `characters/yunalesca-3/cast`
- `characters/yu-pagoda/attack`, `characters/yu-pagoda/cast`, `characters/yu-pagoda/hurt`
- `characters/jecht/ko`
- `characters/yuna-white-mage/attack`, `/cast`, `/item`, `/hurt`, `/victory`, `/ko`
- `characters/paine-warrior/idle`, `characters/paine-dark-knight/idle`
- `characters/ffx2-bahamut/idle`, `/hurt`, `/ko`
- `characters/vegnagun-tail/idle`, `/hurt`, `/ko`
- `characters/vegnagun-leg/idle`
- `characters/vegnagun-head/idle`

That is 31 poses, matching every row in `CHOSEN.md` marked `Replaced: yes`.

Before each file was overwritten, the art4 version (the one being withdrawn)
was copied to
`D:\Tools\pyrefly-art-backup\withdrawn\2026-09-21-art4\<same relative path>` —
nothing was deleted, only copied over.

### Paine face crops and the regression pin

Both Paine idles (`paine-warrior/idle`, `paine-dark-knight/idle`) were among
the restored files. Art round 4 had re-measured their rows in
`src/ui/common/face-crops.json` for the new (now-withdrawn) paintings. Both
rows are restored to their pre-art4 values (`git show 189a1ad^:src/ui/common/face-crops.json`),
and the Dark Knight regression test in
`tests/unit/ui-portrait-face-crop.test.ts` is re-pinned to the same
pre-art4 expectations. What the pin checks is unchanged: the greatsword's
pommel is the topmost thing in the (restored) file, so the generic fx 0.5 /
fy 0.15 estimate would frame the blade instead of her face.

## What stays installed

The 11 poses art round 4 shipped where **no painting existed before**
(`CHOSEN.md`'s "Replaced" column says `none (new pose)`) stay installed — a
weak painting beats a letter tile:

- `characters/yuna-gunner/hurt`, `/ko`, `/victory`
- `characters/yuna-black-mage/attack`, `/cast`, `/hurt`, `/ko`, `/victory`
- `characters/yuna-songstress/attack`, `/dance`
- `portraits/lenne`

`docs/target/approved-hashes.json`'s `art4:2026-09-21` set now lists only
these 11 files; the 31 restored paths were removed from that set (nothing
else in the file changed).

## Backup locations

- `D:\Tools\pyrefly-art-backup\replaced\2026-09-21-art4\` — the pre-art4
  paintings (source of the restore above; untouched).
- `D:\Tools\pyrefly-art-backup\approved\2026-09-21-art4\` — the original
  art4 install backup (untouched; still documents what art4 shipped).
- `D:\Tools\pyrefly-art-backup\withdrawn\2026-09-21-art4\` — the art4
  paintings for the 31 restored poses, copied here before being overwritten.

## After this change

- `public/art/manifest.json` was regenerated with `tools/gen/manifest.mjs`.
- `npx tsc --noEmit` is clean.
- Art, manifest, sprite and face-crop unit tests pass, and the full suite
  (`npm test`) is green: 206 files, 5035 tests passed, 2 skipped.
- `docs/target/targets.json`'s art round 4 tile is marked `"state": "rejected"`
  (this file's vocabulary has no `withdrawn` state) with Bailey's reaction
  recorded and a note on which poses remain installed.
