"""mkmerged.py --out <dir> --set <id>=<art folder with characters/<id>/> [--set ...] [--base D:/pyrefly-art-r61] : an art folder for a RECORDING of re-cut party rigs: the base art with the named characters' folders replaced by the art lane's
approved paintings (what `mkart.py` made), so the painting set beside a rig in the clips is the approved one, not the old one.

Nothing is copied that does not have to be: every top-level entry of the base but `characters` is a directory junction (or a hard link for a file), every character but the named ones is a junction, and a named character's folder is
a new directory in which each file is the new art's (the paintings, the 2x masters, the placement json) or, when the new art has none (the normal maps, the 3x and 4x tiers), a hard link to the base's file. The base is only read.
Point a tree's `public/art` junction at <dir> (`cmd /c rmdir public\\art` removes the LINK only, then `cmd /c mklink /J public\\art <dir>`). Never writes into the base or into public/art.
"""
import os
import pathlib
import subprocess
import sys

a = sys.argv[1:]
opt = lambda n, d=None: a[a.index(n) + 1] if n in a else d  # noqa: E731
out = pathlib.Path(opt("--out"))
base = pathlib.Path(opt("--base", "D:/pyrefly-art-r61"))
sets = {}
for i, v in enumerate(a):
    if v == "--set":
        k, p = a[i + 1].split("=", 1)
        sets[k] = pathlib.Path(p)


def junction(link: pathlib.Path, target: pathlib.Path) -> None:
    subprocess.run(["cmd", "/c", "mklink", "/J", str(link), str(target)], check=True, stdout=subprocess.DEVNULL)


def hardlink(src: pathlib.Path, dst: pathlib.Path) -> None:
    try:
        os.link(src, dst)
    except OSError:
        import shutil
        shutil.copyfile(src, dst)


out.mkdir(parents=True, exist_ok=True)
for e in sorted(base.iterdir()):
    if e.name == "characters":
        continue
    d = out / e.name
    if d.exists() or d.is_symlink():
        continue
    if e.is_dir():
        junction(d, e)
    else:
        hardlink(e, d)
ch = out / "characters"
ch.mkdir(exist_ok=True)
for e in sorted((base / "characters").iterdir()):
    d = ch / e.name
    if e.name in sets:
        d.mkdir(exist_ok=True)
        new = sets[e.name] / "characters" / e.name
        have = {p.name for p in new.iterdir()}
        for p in e.iterdir():
            t = d / p.name
            if t.exists():
                continue
            hardlink((new / p.name) if p.name in have else p, t)
        for p in new.iterdir():  # a file only the new art has
            t = d / p.name
            if not t.exists():
                hardlink(p, t)
        print(f"merged {e.name}: {len(list(d.iterdir()))} files ({len(have)} from the new art)")
    elif not (d.exists() or d.is_symlink()):
        junction(d, e)
print("art folder:", out)
