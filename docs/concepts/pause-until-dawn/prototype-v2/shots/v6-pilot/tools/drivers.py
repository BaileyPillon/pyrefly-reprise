"""Living portrait v6 pilot (both): the drivers, weight = base + band noise + events + coupling.

Three feels for the options round (plan: A measured, B livelier, C quiet). All three share the
same input path (the player looks her left at 2.0 s and back at 5.2 s) so the eye lead can be
compared; everything else follows the motion spec (docs/plans/pause-living-portraits-motion-spec.md):
band noise 0.13-0.34 Hz, swells 400 ms in and ~2.8 s out with no flat hold, full blinks
close 50 ms / hold 17-50 ms / open 66 ms, half-lid events, fixation drift, no idle saccades (A).

Weights are in the rig's units: gaze in plate px (iris offset), lids as the VISIBLE openness
(rig6.vis_to_port maps them), droop in px, the rest 0..1.
"""
import numpy as np

FPS = 60
EYE_TAU, HEAD_TAU = 0.05, 0.14   # plan: the eyes lead on a fast spring, the head follows on its own


class BandNoise:
    """Unit-RMS band-limited noise (the prototype's dynamics.ts BandNoise, 7 components)."""

    def __init__(self, seed, lo=0.13, hi=0.34, n=7):
        rnd = np.random.default_rng(seed)
        self.f = np.array([lo * (hi / lo) ** ((i + rnd.random() * 0.6) / n) for i in range(n)])
        self.ph = rnd.random(n) * 2 * np.pi
        w = 0.6 + rnd.random(n) * 0.8
        self.w = w / np.sqrt((w * w).sum() / 2)

    def __call__(self, t):
        return float((self.w * np.sin(2 * np.pi * self.f * t + self.ph)).sum())


def swell(t, t0, amp, onset=0.4, release=2.8):
    """Fast in (eased over `onset`), slow out (zero slope at the peak), ~gone by t0 + onset + release."""
    d = t - t0
    if d <= 0:
        return 0.0
    if d < onset:
        x = d / onset
        return amp * x * x * (3 - 2 * x)
    x = (d - onset) / (release / 2.2)
    return amp * float(np.exp(-x ** 1.6))


def blink(t, t0, depth=1.0, close=0.05, hold=0.033, open_=0.066):
    """Visible-openness drop for a blink (depth 1 = fully shut)."""
    d = t - t0
    if d < 0 or d > close + hold + open_:
        return 0.0
    if d < close:
        return depth * d / close
    if d < close + hold:
        return depth
    return depth * (1 - (d - close - hold) / open_)


def lid_event(t, t0, depth, dur):
    """A half-lid or a slow narrowing: eased down and up over `dur`."""
    d = (t - t0) / dur
    if d <= 0 or d >= 1:
        return 0.0
    return depth * np.sin(np.pi * d) ** 2


INPUT = [(0.0, (0.0, 0.0)), (2.0, (-13.0, 1.5)), (5.2, (0.0, 0.0))]

PRESETS = {
    "A": {  # measured: Until Dawn's numbers
        "drift": (3.0, 1.6), "glances": [], "sway": (2.4, 1.6, 0.45), "eventScale": 1.0, "onset": 0.4, "release": 2.8,
        "events": [(0.6, "smile", 0.6), (3.3, "brow", 0.55), (6.1, "concern", 0.5)],
        "blinks": [(1.45, 1.0), (6.05, 1.0)], "lidEvents": [(3.85, 0.45, 0.22), (7.0, 0.16, 0.85)],
        "noise": 1.0},
    "B": {  # livelier: glances every 3-6 s with a small blink on a big one, more frequent smiles
        "drift": (3.0, 1.6), "glances": [(0.75, (11.0, -3.0), 0.9), (6.25, (-9.0, 4.5), 1.0)],
        "sway": (2.8, 1.9, 0.6), "eventScale": 1.0, "onset": 0.4, "release": 2.4,
        "events": [(0.35, "smile", 0.8), (2.9, "smile", 0.7), (4.4, "brow", 0.8), (6.3, "smile", 0.95)],
        "blinks": [(0.75, 0.55), (2.35, 1.0), (4.75, 1.0), (6.25, 0.5)], "lidEvents": [(3.7, 0.4, 0.2)],
        "noise": 1.2},
    "C": {  # quiet: smaller and slower
        "drift": (1.6, 0.9), "glances": [], "sway": (1.5, 1.0, 0.25), "eventScale": 0.6, "onset": 0.6, "release": 3.6,
        "events": [(1.0, "smile", 0.55), (5.4, "brow", 0.5)],
        "blinks": [(3.1, 1.0)], "lidEvents": [(6.3, 0.35, 0.3)],
        "noise": 0.6},
}

# an event is a bundle of weights (plan: a smile drives the corners, a slight squint and a brow lift)
BUNDLES = {
    "smile": {"open": 1.0, "smile": 1.0, "browRaise": 0.3, "squint": 0.06},
    "brow": {"browRaise": 1.0, "open": 0.15, "smile": 0.3},
    "concern": {"browDraw": 0.9, "press": 0.8},
}


# unit-RMS noise amplitudes (x the preset's `noise`): the mouth is the busiest part of the idle face
MOUTH_NOISE = {"smile": 0.7, "press": 0.7, "open": 0.2}  # sized so no weight moves more than 0.06 a frame
BROW_NOISE = {"raise": 0.06, "draw": 0.04, "base": 0.1}  # the painted brow is high contrast: 1 px reads as much as 3 px of lip


def spring(prev, target, tau, dt):
    return prev + (target - prev) * (1 - np.exp(-dt / tau))


def timeline(name, seconds=8.0, seed=7):
    cfg = PRESETS[name]
    n = int(round(seconds * FPS))
    N = {k: BandNoise(seed * 31 + i) for i, k in enumerate(("gx", "gy", "open", "smile", "press", "raise", "draw", "lid", "hx", "hy", "roll"))}
    eye = np.zeros(2)
    head = np.zeros(2)
    frames = []
    for f in range(n):
        t = f / FPS
        target = np.array(INPUT[0][1])
        for t0, v in INPUT:
            if t >= t0:
                target = np.array(v)
        for t0, v, dur in cfg["glances"]:
            if t0 <= t < t0 + dur:
                target = target + np.array(v)
        dt = 1 / FPS
        eye = spring(eye, target, EYE_TAU, dt) if f else eye
        head = spring(head, target, HEAD_TAU, dt) if f else head
        k = cfg["noise"]
        es = cfg["eventScale"]
        w = {"open": 0.0, "smile": 0.0, "press": 0.0, "browRaise": 0.0, "browDraw": 0.0, "squint": 0.0}
        for t0, kind, amp in cfg["events"]:
            e = swell(t, t0, amp * es, cfg["onset"], cfg["release"])
            for p, s in BUNDLES[kind].items():
                w[p] += e * s
        # never still: every weight runs its own band noise (the mouth busiest, the brow at ~0.4 of it)
        mn, bn = MOUTH_NOISE, BROW_NOISE
        w["smile"] += mn["smile"] * k * N["smile"](t)
        w["press"] += mn["press"] * k * N["press"](t)
        w["open"] += max(0.0, mn["open"] * k * N["open"](t))
        w["browRaise"] += bn["base"] + bn["raise"] * k * N["raise"](t)
        w["browDraw"] += bn["base"] * 0.6 + bn["draw"] * k * N["draw"](t)
        # the eyes: the input (eyes lead, the head follows and they re-centre by its share) + drift
        dx, dy = cfg["drift"]
        gaze = eye - 0.3 * head + np.array([dx * N["gx"](t) / 1.48, dy * N["gy"](t) / 1.48])
        gaze = np.clip(gaze, [-16, -8], [16, 8])
        # lids: visible openness; blinks, half-lids, a smile's squint, a small wander
        v = 1.0 - 0.02 * abs(N["lid"](t)) * k - w.pop("squint")
        for t0, depth in cfg["blinks"]:
            v -= blink(t, t0, depth)
        for t0, depth, dur in cfg["lidEvents"]:
            v -= lid_event(t, t0, depth, dur)
        v = float(np.clip(v, 0, 1))
        droop = 0.8 * max(0.0, gaze[1])  # the lid follows the eye down (plate px)
        sx, sy, sr = cfg["sway"]
        head_px = (0.3 * head[0] + sx * N["hx"](t) / 1.48, 0.3 * head[1] + sy * N["hy"](t) / 1.48)
        frames.append({"t": t, "gazeX": float(gaze[0]), "gazeY": float(gaze[1]), "lid": v, "droop": float(droop),
                       "open": float(np.clip(w["open"], 0, 1)), "smile": float(np.clip(w["smile"], -0.6, 1.2)),
                       "press": float(np.clip(w["press"], -0.6, 1.0)), "browRaise": float(np.clip(w["browRaise"], 0.0, 1.0)),
                       "browDraw": float(np.clip(w["browDraw"], 0.0, 1.0)), "headX": float(head_px[0]), "headY": float(head_px[1]),
                       "roll": float(sr * N["roll"](t) / 1.48)})
    return frames
