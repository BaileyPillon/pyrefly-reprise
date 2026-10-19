"""Paths, process helpers and the fit slots shared by the lane kit's commands (tools/rig/lane/lane.py; the rig program, 2026-10-18; both games, shared plumbing).

A lane is one agent cutting, fitting and recording one subject. The machine has 8 cores: a fit phase takes all of them, so at most TWO lanes may be in a fit phase at once (`FitSlots`, two lock
slots under D:/Tools/pyrefly-scratch/RIG-FIT-SLOTS, 8 processes each), and fits run at below-normal priority so the rest of the machine stays usable.
"""
from __future__ import annotations

import json
import os
import pathlib
import subprocess
import sys
import time

TOOLS = pathlib.Path(__file__).resolve().parents[1]
REPO = TOOLS.parents[1]
RIG_PY = TOOLS / "rig.py"
NODE = os.environ.get("RIG_NODE", "node")
SLOTS_ROOT = pathlib.Path(os.environ.get("RIG_FIT_SLOTS", "D:/Tools/pyrefly-scratch/RIG-FIT-SLOTS"))
SLOT_COUNT = 2
BELOW_NORMAL = 0x00004000  # Windows CREATE flag; ignored elsewhere


def say(*a) -> None:
    print(*a, flush=True)


def pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if os.name == "nt":
        r = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/NH"], capture_output=True, text=True)
        return str(pid) in r.stdout
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


class FitSlots:
    """Two lock slots. `acquire` takes the first free one (a slot whose owner pid is gone is taken over), `release` gives it back. A slot is a directory made atomically (`mkdir`) holding `owner.json`."""

    def __init__(self, root: pathlib.Path = SLOTS_ROOT, count: int = SLOT_COUNT, alive=pid_alive):
        self.root, self.count, self.alive = pathlib.Path(root), count, alive
        self.held: pathlib.Path | None = None

    def _slot(self, i: int) -> pathlib.Path:
        return self.root / f"slot{i}"

    def owner(self, i: int):
        f = self._slot(i) / "owner.json"
        try:
            return json.loads(f.read_text())
        except (OSError, ValueError):
            return None

    def acquire(self, who: str, pid: int | None = None) -> pathlib.Path | None:
        self.root.mkdir(parents=True, exist_ok=True)
        pid = pid or os.getpid()
        for i in range(1, self.count + 1):
            d = self._slot(i)
            try:
                d.mkdir()
            except FileExistsError:
                o = self.owner(i)
                if o and self.alive(int(o.get("pid", 0))):
                    continue
                for f in d.glob("*"):  # a dead owner's slot
                    f.unlink()
                d.rmdir()
                try:
                    d.mkdir()
                except FileExistsError:
                    continue
            (d / "owner.json").write_text(json.dumps({"pid": pid, "who": who, "at": time.strftime("%Y-%m-%dT%H:%M:%S")}))
            self.held = d
            return d
        return None

    def release(self) -> None:
        if self.held is not None:
            for f in self.held.glob("*"):
                f.unlink()
            self.held.rmdir()
            self.held = None

    def free(self) -> int:
        return sum(1 for i in range(1, self.count + 1) if not (self._slot(i).exists() and (o := self.owner(i)) and self.alive(int(o.get("pid", 0)))))


def popen_low(cmd: list[str], env: dict | None = None, cwd=REPO, stdout=None) -> subprocess.Popen:
    """Start a command at below-normal CPU priority (a fit is a thread of its own for minutes)."""
    flags = BELOW_NORMAL if os.name == "nt" else 0
    return subprocess.Popen(cmd, cwd=str(cwd), env={**os.environ, **(env or {})}, stdout=stdout, stderr=subprocess.STDOUT, creationflags=flags)


def rig_cmd(*args: str) -> list[str]:
    """The pipeline's own CLI under this interpreter (`python -I tools/rig/rig.py ...`)."""
    return [sys.executable, "-I", str(RIG_PY), *args]


def gate_cmd(rig_dir, art, *extra: str) -> list[str]:
    return [NODE, "tools/rig-gate.mjs", "--rig", str(rig_dir), "--art", str(art), *extra]


def read_gate(path) -> dict:
    """A gate report written with `--json` (a list of one)."""
    g = json.loads(pathlib.Path(path).read_text(encoding="utf8"))
    return g[0] if isinstance(g, list) else g


def write_json(path, obj, indent=1) -> None:
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=indent), encoding="utf8")
