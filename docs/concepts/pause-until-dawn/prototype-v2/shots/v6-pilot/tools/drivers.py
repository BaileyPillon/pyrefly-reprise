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




# part 2, 'never still' (shared by the three feels): nothing that idles may rest on a clamp. In part 1 the
# mouth stood still in 19 % of clip A's frames (runs of up to 1 s): `open` was max(0, noise), and the smile and
# press noise (+-0.7) ran into their hard clips during the events; the lid tone was 1 - |noise|, which touches
# the rest at every zero crossing. Every idle channel is now (base + amplitude x band noise) on a smooth
# positive floor, and the event sums are limited softly, so each weight moves every frame and never kinks.
# The floors also keep the lattices off negative weights (part 1's noise drove the smile to -0.6: a corner-down
# shape, which is INFERRED and not built without a yes). Amplitudes are x the preset's `noise`.
IDLE = {                          # (base, amplitude, softness)
    "open": (0.08, 0.14, 0.03),   # the lips part 0-3 px, on their own band and the breath's (below)
    "smile": (0.45, 0.30, 0.06),  # the corners (the lattice moves 1.3 px at 1): the base sits 1.6 amplitudes off the floor
    "press": (0.35, 0.28, 0.06),  # the lip line (2.9 px at 1): so the floor, where a channel slows, is rarely reached
    "browRaise": (0.10, 0.06, 0.03),
    "browDraw": (0.06, 0.04, 0.03),
    "lid": (0.022, 0.010, 0.01),  # the lid tone: 0.5-5 % of the opening, never 0, and inside the sliding rim (v > 0.95)
}
LIMITS = {"open": 1.0, "smile": 1.2, "press": 1.0, "browRaise": 1.0, "browDraw": 1.0}
MAX_STEP = 0.058  # a weight moves at most this much a frame (plan: 0.06); only B's fastest onset ever reaches it
# the chest (breath) follows the head's band, lagging it by ~1/3 of a cycle (spec section 6: 1.45 s), at 0.6
# of the head's sway (spec: chest over head 0.54-0.80); the head rides half of it (it sits on the neck)
CHEST = {"lag": 1.45, "scale": 0.6, "headRides": 0.5}
# part 2: the stand-in head no longer rolls. The runtime has no roll (prototype-v2 constants.ts: the head sway
# is a translation, "a wander, not a pendulum", plus a 1.2 degree yaw wander this frontal pilot cannot show)
# and the spec never measured one (section 12); part 1's roll was a guess, and it was most of the brow's
# motion (A: 10.4 of 11.0 levels, head-tracked), so the brow read busier than the mouth. The presets keep
# their roll numbers; this scales them.
ROLL = 0.0


def soft_pos(x, e):
    """A smooth max(0, x): always above 0, slope 1 far above it."""
    return 0.5 * (x + np.sqrt(x * x + e * e))


def soft_clip(x, hi, e=0.04):
    """x softly kept in [0, hi]: it slows near either end and never stops on it."""
    return hi - soft_pos(hi - soft_pos(x, e), e)


def spring(prev, target, tau, dt):
    return prev + (target - prev) * (1 - np.exp(-dt / tau))


def timeline(name, seconds=8.0, seed=7):
    cfg = PRESETS[name]
    n = int(round(seconds * FPS))
    N = {k: BandNoise(seed * 31 + i) for i, k in enumerate(("gx", "gy", "open", "smile", "press", "raise", "draw", "lid", "hx", "hy", "roll", "breath"))}
    eye = np.zeros(2)
    head = np.zeros(2)
    frames = []
    last = None
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
        # never still: every weight runs its own band noise on a smooth floor (see IDLE)
        # the mouth's idle layer scales with the square root of the feel's noise, so the quiet feel is smaller
        # and still never still (C at 0.6x froze the mouth in 31 % of its frames); the brows keep the full scale
        for p, nk in (("open", "open"), ("smile", "smile"), ("press", "press"), ("browRaise", "raise"), ("browDraw", "draw")):
            b, a, e = IDLE[p]
            kk = np.sqrt(k) if p in ("open", "smile", "press") else k
            n_ = N[nk](t) if p != "open" else (N["open"](t) + N["breath"](t)) / np.sqrt(2)  # the lips ride the breath
            w[p] = soft_clip(w[p] + soft_pos(b + a * kk * n_, e), LIMITS[p])
        if last is not None:
            for p in LIMITS:
                w[p] = last[p] + float(np.clip(w[p] - last[p], -MAX_STEP, MAX_STEP))
        last = dict(w)
        # the eyes: the input (eyes lead, the head follows and they re-centre by its share) + drift
        dx, dy = cfg["drift"]
        gaze = eye - 0.3 * head + np.array([dx * N["gx"](t) / 1.48, dy * N["gy"](t) / 1.48])
        gaze = np.clip(gaze, [-16, -8], [16, 8])
        # lids: visible openness; blinks, half-lids, a smile's squint, a small wander
        b, a, e = IDLE["lid"]
        v = 1.0 - soft_pos(b + a * np.sqrt(k) * N["lid"](t), e) - w.pop("squint")  # the tone, like the mouth's idle
        for t0, depth in cfg["blinks"]:
            v -= blink(t, t0, depth)
        for t0, depth, dur in cfg["lidEvents"]:
            v -= lid_event(t, t0, depth, dur)
        v = float(np.clip(v, 0, 1))
        droop = 0.8 * max(0.0, gaze[1])  # the lid follows the eye down (plate px)
        sx, sy, sr = cfg["sway"]
        tc = t - CHEST["lag"]
        chest = (CHEST["scale"] * sx * N["hx"](tc) / 1.48, CHEST["scale"] * sy * N["breath"](t) / 1.48)
        hr = CHEST["headRides"]
        head_px = (0.3 * head[0] + sx * N["hx"](t) / 1.48 + hr * chest[0], 0.3 * head[1] + sy * N["hy"](t) / 1.48 + hr * chest[1])
        frames.append({"t": t, "gazeX": float(gaze[0]), "gazeY": float(gaze[1]), "lid": v, "droop": float(droop),
                       "open": float(w["open"]), "smile": float(w["smile"]), "press": float(w["press"]),
                       "browRaise": float(w["browRaise"]), "browDraw": float(w["browDraw"]), "headX": float(head_px[0]), "headY": float(head_px[1]),
                       "chestX": float(chest[0]), "chestY": float(chest[1]),
                       "roll": float(ROLL * sr * N["roll"](t) / 1.48)})
    return frames
