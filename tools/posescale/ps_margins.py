"""The per-pose margins a pose-measure record carries with their reasons (overrides.json; art tooling only, no numpy: it can be read and tested without the measuring stack).

- `allow` (r392): a camera allowance, a factor the table carries over the reading, with its reason.
- `statureBand` (pc-residues, PR-0531, 2026-10-28; FFX-2's Yuna White Mage cast and Rikku Thief hurt): a floor and/or a ceiling for this pose ONLY, with its reason, for a pose held at a band edge whose
  screen reading leaves the band (the head lock and the lens move a figure 1 to 3 percent). `pose-ruler.mjs` rules the pose against it and `pose-scale-check.mjs` re-derives the scale from it.
"""
from __future__ import annotations


def record_margins(o: dict, scale, key: str) -> dict:
    """The record fields for one pose's overrides `o` (`allow` needs a scale to apply to): `statureBand` first, then `allow`, the order the records have always had."""
    out: dict = {}
    sb = o.get("statureBand")
    if sb:
        if not (isinstance(sb, dict) and sb.get("why") and (sb.get("floor") or sb.get("ceiling"))):
            raise SystemExit(f"{key}: `statureBand` needs a `floor` and/or a `ceiling` and a `why`")
        out["statureBand"] = {k: sb[k] for k in ("floor", "ceiling", "why") if k in sb}
    if o.get("allow") and scale:
        out["allow"] = {"scale": round(float(o["allow"]["scale"]), 4), "why": o["allow"]["why"]}
    return out
