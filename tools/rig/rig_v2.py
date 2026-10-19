"""Format v2 in the rig pipeline (2026-10-18; both games): parts a key can show or hide, and parts whose image a key can swap for a named variant.

The file format is `src/data/art/rigTypes.ts` (`RigPart.hidden`, `RigPart.variants`, `RigKey.parts`); the gate is `tools/rig/rig-pose.mjs` / `rig-variants.mjs`. This module is what the Python steps need:

  config (every field optional; a subject with none of them writes a version 1 file, byte for byte what it wrote before)
    build.hidden:   [part, ...]                          parts hidden at rest (a front-view upper body, a drawn-on scar); the idle must still reproduce the painting without them
    build.variants: { part: { name: { png, rim?, ... } } }   other images of a part, files in <work>/build (the hook or `from_painting` wrote them). A record with no `box`/`verts`/`bone`/`weights` uses the part's mesh.
    fit.keys.<pose>.show:  [part, ...]                   the key brings these parts in (a hidden part, or a part another key hides)
    fit.keys.<pose>.hide:  [part, ...]                   the key hides these
    fit.keys.<pose>.image: { part: variant }             the key swaps these parts' image for a variant (and shows them)
    keys_extra.<pose>.parts: { part: { show?, image? } } the same, written as the file has it (an authored key)

  The fitter draws the key's state while it scores (`rig_skin.RigModel.set_state`), so a pose that hides the side arms is fitted with the side arms hidden. The exporter writes `RigKey.parts`.

  `from_painting` (build.variants.<part>.<name>.from_painting) cuts a variant out of ANOTHER painting of the same figure, no model and no repaint: `placement` and `soft_cut` are the pure core of what
  `tools/rig/subjects/lulu_hooks.py#_front_part` did by hand (cut the upper body of the defend painting, fade the waist edge, place it at the idle's stance and scale).
"""
from __future__ import annotations

import numpy as np

#: the fields of a variant that give it a mesh or a skin of its own (a variant with none of them uses the part's), as in the reader
OWN_MESH = ("box", "verts", "uvs", "uv", "triangles", "tris", "bone", "bones", "weights")


def key_parts(pcfg: dict | None) -> dict | None:
    """`RigKey.parts` from a fit-key config entry (`show`, `hide`, `image`) and/or an authored key's own `parts`; None when the key says nothing about parts."""
    if not pcfg:
        return None
    out = {k: dict(v) for k, v in (pcfg.get("parts") or {}).items()}
    for name in pcfg.get("show") or []:
        out.setdefault(name, {})
    for name, variant in (pcfg.get("image") or {}).items():
        out[name] = {"image": variant}
    for name in pcfg.get("hide") or []:
        out[name] = {"show": False}
    return out or None


def rest_state(parts: list[dict]) -> dict:
    """`{part: {shown, image}}` at rest: every part shown with its own image, except the ones marked hidden."""
    return {p["name"]: {"shown": not p.get("hidden", False), "image": None} for p in parts}


def state_of(parts: list[dict], kp: dict | None) -> dict:
    """The state a key's `parts` describe (naming a part shows it unless `show` is false): the same function as the gate's `keyState` and the runtime's `keyState`."""
    s = rest_state(parts)
    for name, e in (kp or {}).items():
        if name not in s:
            raise SystemExit(f"rig: a key names the part {name!r}, which is not in the rig")
        if e.get("show") is False:
            s[name] = {"shown": False, "image": None}
        else:
            variant = e.get("image")
            if variant is not None and variant not in (next(p for p in parts if p["name"] == name).get("variants") or {}):
                raise SystemExit(f"rig: a key swaps {name!r} to the variant {variant!r}, which the part does not have")
            s[name] = {"shown": True, "image": variant}
    return s


def effective(part: dict, variant: str | None) -> dict:
    """The record a look draws with: the part, or the part with the variant's file names and (if it has one) its own mesh and skin laid over it."""
    if variant is None:
        return part
    v = part["variants"][variant]
    rec = {k: val for k, val in part.items() if k not in ("variants", "hidden")}
    if any(k in v for k in OWN_MESH):
        for k in ("verts", "uvs", "uv", "triangles", "tris", "bone", "bones", "weights"):
            rec.pop(k, None)
        if "box" not in v:
            rec["box"] = part["box"]
        if "bone" not in v and "bones" not in v and "weights" not in v and "bone" in part:
            rec["bone"] = part["bone"]  # rigid on the part's bone unless the variant skins itself
    rec.pop("rim", None)
    rec.update({k: val for k, val in v.items()})
    if "verts" not in rec:  # the reader's default: a quad of the box
        x, y, w, h = rec["box"]
        rec["verts"] = [x, y, x + w, y, x + w, y + h, x, y + h]
        rec.setdefault("triangles", [0, 1, 2, 0, 2, 3])
    return rec


def slots(parts: list[dict]) -> list[tuple[str, str | None, dict]]:
    """Every look of every part in draw order: `(part name, variant or None, effective record)`; a part's own look first, then its variants in the file's order."""
    out = []
    for p in sorted(parts, key=lambda r: r["order"]):
        out.append((p["name"], None, effective(p, None)))
        for vn in p.get("variants") or {}:
            out.append((p["name"], vn, effective(p, vn)))
    return out


def active(slot_list, state: dict) -> np.ndarray:
    """Which slots are drawn in `state`."""
    return np.array([state[name]["shown"] and state[name]["image"] == variant for name, variant, _ in slot_list], bool)


def apply_build_cfg(parts: list[dict], build_cfg: dict | None) -> bool:
    """Mark `build.hidden` parts and attach `build.variants` to their parts (in place). Returns True when anything v2 was applied."""
    cfg = build_cfg or {}
    by = {p["name"]: p for p in parts}
    used = False
    for name in cfg.get("hidden") or []:
        if name not in by:
            raise SystemExit(f"rig build: build.hidden names {name!r}, which is not a part")
        by[name]["hidden"] = True
        used = True
    for name, variants in (cfg.get("variants") or {}).items():
        if name not in by:
            raise SystemExit(f"rig build: build.variants names {name!r}, which is not a part")
        plain = {vn: {k: v for k, v in rec.items() if k != "from_painting"} for vn, rec in variants.items()}
        plain = {vn: rec for vn, rec in plain.items() if rec}  # a variant that says only `from_painting` is cut by the `variants` step (rig_vcut.py), after the fit; one that also names its files keeps them as before
        if plain:
            by[name].setdefault("variants", {}).update(plain)
        used = used or bool(plain)
    return used


def uses_v2(rig: dict) -> bool:
    return any("hidden" in p or "variants" in p for p in rig.get("parts", [])) or any("parts" in k for k in rig.get("keys", {}).values())


def image_files(parts: list[dict]) -> list[str]:
    """Every PNG and rim mask the parts name, variants included, once, in order."""
    out: list[str] = []
    for p in parts:
        for rec in [p, *(p.get("variants") or {}).values()]:
            for f in (rec.get("png"), rec.get("rim")):
                if f and f not in out:
                    out.append(f)
    return out


# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
# from_painting: cut a variant out of another painting of the same figure
# ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------


def soft_cut(alpha: np.ndarray, cut_row: float, feather: float) -> np.ndarray:
    """Fade `alpha` to nothing below `cut_row` over `feather` rows (all in the array's own pixels): the waist edge of a front-view upper body, which the idle's skirt top takes over under."""
    ys = np.arange(alpha.shape[0], dtype=np.float32)[:, None]
    return alpha.astype(np.float32) * np.clip((cut_row - ys) / max(feather, 1e-6), 0.0, 1.0)


def placement(crop_xy: tuple[float, float], painting_feet: tuple[float, float], idle_feet: tuple[float, float], m: float, S: float) -> tuple[float, float]:
    """Where the top-left of a crop of another painting lands in the figure's master px: the painting's own stance column and soles row (`painting_feet`) are put on the idle's (`idle_feet`, 1x px), the
    painting drawn `m` times the idle's size, everything times the master's tier `S`. `crop_xy` is the crop's top-left in that painting's 1x px."""
    return (S * (idle_feet[0] + (crop_xy[0] - painting_feet[0]) * m), S * (idle_feet[1] + (crop_xy[1] - painting_feet[1]) * m))
