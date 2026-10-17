"""Paths, the subject config and small helpers shared by every step of the rig pipeline (tools/rig/rig.py).

A subject is one figure of either game (kimahri, rikku-alchemist, ...). Its config is tools/rig/subjects/<name>.json (the schema is in rig.py's header); the steps read it,
work in the work folder (never in public/art), and `export` writes the rig into RIGS_ROOT/<subject>/ (D:/pyrefly-art-rigs, the folder the dev server serves at /art/rigs/).
"""
from __future__ import annotations

import hashlib
import importlib.util
import json
import os
import pathlib
import subprocess

import numpy as np
from PIL import Image

REPO = pathlib.Path(__file__).resolve().parents[2]
TOOLS = pathlib.Path(__file__).resolve().parent
SUBJECTS = TOOLS / "subjects"
NODE = os.environ.get("RIG_NODE", "node")
RIGS_ROOT = pathlib.Path(os.environ.get("PYREFLY_RIGS_DIR", "D:/pyrefly-art-rigs"))
WORK_ROOT = pathlib.Path(os.environ.get("RIG_WORK", "D:/pyrefly-art-rigs-work"))
#: the driver's marker for "the GPU must be idle now" (a live game measurement): while it exists, nothing here touches the GPU.
GPU_QUIET = pathlib.Path("D:/Tools/pyrefly-scratch/GPU-QUIET")
BG = (112, 124, 146)


def gpu_quiet() -> bool:
    return GPU_QUIET.exists()


class Subject:
    """One subject's config and folders."""

    def __init__(self, name: str, config_path: pathlib.Path | None = None):
        self.name = name
        self.path = pathlib.Path(config_path) if config_path else (SUBJECTS / f"{name}.json")
        if not self.path.exists():
            raise SystemExit(f"rig: no config {self.path} (a subject config is tools/rig/subjects/<name>.json)")
        self.cfg = json.loads(self.path.read_text(encoding="utf8"))
        self.id = self.cfg.get("subject", name)
        self.scale = int(self.cfg.get("scale", 2))
        self.costume_pose = self.cfg.get("costume", {}).get("pose", "idle")
        self.art = self.rel(self.cfg.get("art") or os.environ.get("PYREFLY_ART_DIR") or (REPO / "public" / "art"))
        self.dir_chars = self.art / "characters" / self.id
        self.work = WORK_ROOT / name
        self.out = RIGS_ROOT / self.id

    @staticmethod
    def rel(p) -> pathlib.Path:
        """A path from the config: absolute as given, else relative to the repository."""
        p = pathlib.Path(p)
        return p if p.is_absolute() else REPO / p

    # the costume painting: the 1x file the pose model reads, and the master the parts are cut from
    @property
    def costume_1x(self) -> pathlib.Path:
        return self.dir_chars / f"{self.costume_pose}.png"

    @property
    def costume_master(self) -> pathlib.Path:
        if self.scale > 1:
            m = self.dir_chars / f"{self.costume_pose}@{self.scale}x.png"
            if m.exists():
                return m
            raise SystemExit(f"rig: {m} is missing (the parts are cut from the @{self.scale}x master; set \"scale\" in the config to a tier that exists)")
        return self.costume_1x

    def sub(self, *names: str) -> pathlib.Path:
        p = self.work.joinpath(*names)
        p.mkdir(parents=True, exist_ok=True)
        return p

    def hooks(self):
        """The subject's hook module (tools/rig/subjects/<hooks>.py), or None. Hooks adjust what the declarative config cannot say."""
        h = self.cfg.get("hooks")
        if not h:
            return None
        path = self.rel(h) if pathlib.Path(h).is_absolute() else SUBJECTS / h
        spec = importlib.util.spec_from_file_location(f"rig_hooks_{self.name}", path)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)
        return mod


def load_rgba(path) -> np.ndarray:
    return np.array(Image.open(path).convert("RGBA"))


def sha256_file(path) -> str:
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def run_node(args: list[str], cwd=REPO) -> None:
    r = subprocess.run([NODE, *args], cwd=str(cwd))
    if r.returncode != 0:
        raise SystemExit(f"rig: node {' '.join(args)} failed with {r.returncode}")


def costume_anchor(sub: "Subject") -> float:
    """The costume painting's registered ground row in 1x painting px, as the pose model reads it (what the rig must plant its soles on)."""
    out = sub.sub("targets_costume")
    args = ["tools/rig/rig-targets.mjs", "--subject", sub.id, "--out", str(out), "--art", str(sub.art), "--costume", sub.costume_pose, "--scale", str(sub.scale), "--poses", sub.costume_pose, "--root", str(REPO)]
    if sub.cfg.get("table"):
        args += ["--table", str(sub.rel(sub.cfg["table"]))]
    run_node(args)
    return float(json.loads((out / "targets.json").read_text())["costume"]["anchor1"])


def read_json(path):
    return json.loads(pathlib.Path(path).read_text(encoding="utf8"))


def write_json(path, obj, indent=None) -> None:
    p = pathlib.Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(obj, indent=indent, separators=None if indent else (",", ":")), encoding="utf8")


def say(*a) -> None:
    print(*a, flush=True)
