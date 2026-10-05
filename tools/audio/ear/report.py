#!/usr/bin/env python3
"""Tables from an ear.py JSON: per-group means, per-file ranking, and which measures
separate the reference recordings (groups starting "ref-") from a comparison group.

  python tools/audio/ear/report.py scores.json [--files] [--versus shipped]
"""
import argparse
import json
import statistics as st


def val(r, k):
    if k in ("PQ", "CE", "PC", "CU"):
        return r["aes"][k]
    if k == "clap":
        return r["clap"]["contrast"]
    if k == "air":
        return r["dsp"]["band_share"]["air_6k_12k"]
    if k == "mid":
        return r["dsp"]["band_share"]["mid_250_2k5"]
    if k == "flags":
        return len(r.get("screen", []))
    return r["dsp"][k]


KEYS = ["PQ", "CE", "PC", "CU", "clap", "lr_corr", "mono_sum_loss_db", "mid", "air",
        "rolloff99_hz", "quiet_hiss_4k_10k_db", "lra_lu", "flags"]


def fmt(m):
    return f"{m:.3f}" if abs(m) < 10 else f"{m:.0f}"


def feats(r):
    f = {k: r["aes"][k] for k in ("PQ", "CE", "PC", "CU")}
    f["clap.contrast"] = r["clap"]["contrast"]
    for k, v in r["dsp"].items():
        if k == "band_share":
            f.update({"band." + b: x for b, x in v.items()})
        elif v is not None and k != "peak_dbfs":
            f[k] = v
    for p, s in r["clap"]["sims"].items():
        f["clap: " + p] = s
    return f


def auc(a, b):
    t = sum(1 if x > y else 0.5 if x == y else 0 for x in a for y in b)
    return t / (len(a) * len(b))


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("json")
    ap.add_argument("--files", action="store_true")
    ap.add_argument("--versus", default="shipped")
    a = ap.parse_args()
    rows = [r for r in json.load(open(a.json, encoding="utf-8"))["results"] if "aes" in r and "clap" in r]
    groups = {}
    for r in rows:
        groups.setdefault(r["group"] or "-", []).append(r)
    print("| group | n | " + " | ".join(KEYS) + " |")
    print("|" + "---|" * (len(KEYS) + 2))
    for g in sorted(groups, key=lambda k: -st.mean(val(r, "PQ") for r in groups[k])):
        rs = groups[g]
        cells = []
        for k in KEYS:
            v = [val(r, k) for r in rs if val(r, k) is not None]
            cells.append(fmt(st.mean(v)) if v else "-")
        print(f"| {g} | {len(rs)} | " + " | ".join(cells) + " |")
    if a.files:
        print("\n| file | group | PQ | CE | PC | CU | clap | lr_corr | air | screen flags |")
        print("|---|---|---|---|---|---|---|---|---|---|")
        for r in sorted(rows, key=lambda r: -r["aes"]["PQ"]):
            print(f"| {r['file'].split('/')[-1]} | {r['group']} | {r['aes']['PQ']:.2f} | {r['aes']['CE']:.2f} | "
                  f"{r['aes']['PC']:.2f} | {r['aes']['CU']:.2f} | {r['clap']['contrast']:.3f} | "
                  f"{r['dsp']['lr_corr']:.2f} | {val(r, 'air'):.4f} | {len(r.get('screen', []))} |")
    ref = [feats(r) for r in rows if r["group"].startswith("ref-")]
    other = [feats(r) for r in rows if r["group"] == a.versus]
    if ref and other:
        print(f"\n| measure | AUC (reference > {a.versus}) | reference mean | {a.versus} mean |")
        print("|---|---|---|---|")
        res = []
        for k in ref[0]:
            x = [f[k] for f in ref if k in f]
            y = [f[k] for f in other if k in f]
            if x and y:
                res.append((auc(x, y), k, st.mean(x), st.mean(y)))
        for u, k, mx, my in sorted(res, key=lambda t: -abs(t[0] - 0.5)):
            print(f"| {k} | {u:.2f} | {mx:.4f} | {my:.4f} |")


if __name__ == "__main__":
    main()
