"""SFX v2 (D-302): check a proof capture (tools/audio/sfx-v2-proof.mjs) and measure the effects against the music.

  python tools/audio/sfx-v2-levels.py <capture.json> --dist <dist dir> [--json out.json]

1. Attribution. Every sound the game started is tied to the battle event on screen when it started
   (the presenter trace is pushed as each event finishes, so the event playing is the first traced
   after the start), and to the action that event belongs to.
2. The hookup, checked against an expectation written here from the brief, independently of the code:
   each party member's swing and hit by weapon (FFX: Tidus sword, Auron katana, Kimahri spear, Wakka
   blitzball, Lulu doll, Yuna staff, Rikku claws; FFX-2: Yuna gun, Rikku daggers, Paine greatsword, or
   a gun in the Gunner / Gun Mage spheres), elements, crits, misses, KOs, revives, the gauge, summons,
   the item-use sound; every v2 key that played is in the sprite; no cue of the other game (rule 14,
   dissolve-pyreflies excepted: fiends disperse pyreflies in both games).
3. Levels. The fight is re-mixed offline the way AudioManager mixes it (music bus and SFX bus at the
   captured volumes, per-call volume, dry + a 0.22 send into the game's hall impulse), from the very
   files the build served, and measured the way D-293 measured (sfx peak vs music peak, the SFX's
   loudest 43 ms vs the music's average), plus how often the -2 dBFS master limiter would act.
Agents cannot hear (AGENTS.md rule 13): numbers, not a verdict.
"""
import argparse
import json
import os
import subprocess
import sys

import numpy as np
from scipy.signal import fftconvolve

FFMPEG = os.environ.get('FFMPEG_PATH', 'D:/Tools/FFmpeg/ffmpeg-9.0.1-full_build-shared/bin/ffmpeg.exe')
HALL_IR = 'D:/Tools/pyrefly-scratch/audio-0930/sfx/work/hall-ir.f32'  # dsp/hall.ts with AudioManager's settings
SR = 44100
SEND = 0.22

FFX_WEAPON = {'tidus': 'sword', 'auron': 'katana', 'kimahri': 'spear', 'wakka': 'blitzball', 'lulu': 'doll', 'yuna': 'staff', 'rikku': 'claw'}
FFX2_WEAPON = {'yuna': {'gun'}, 'rikku': {'dagger', 'gun'}, 'paine': {'greatsword', 'gun'}}
SWING = {'sword': 'swing-sword', 'katana': 'swing-katana', 'spear': 'swing-spear', 'blitzball': 'swing-blitzball', 'staff': 'swing-staff',
         'doll': 'swing-doll', 'claw': 'swing-claw', 'gun': 'shot-gun', 'dagger': 'swing-dagger', 'greatsword': 'swing-greatsword'}
HIT = {k: v.replace('swing-', 'hit-').replace('shot-gun', 'hit-gun') for k, v in SWING.items()}
ELEMENT = {'fire': 'fire', 'ice': 'ice', 'lightning': 'thunder', 'water': 'water', 'holy': 'holy'}


def decode(path):
    raw = subprocess.run([FFMPEG, '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype=np.float32).reshape(-1, 2)


def hall_ir():
    raw = np.fromfile(HALL_IR, dtype=np.float32).reshape(-1, 2)
    power = np.sqrt(np.sum(raw.astype(np.float64) ** 2) / (2 * len(raw)))  # ConvolverNode normalize=true
    return raw * np.float32(0.00125 / max(power, 0.000125))


def attribute(cap):
    """sfxLog record -> (event, action) by the start hooks and the presenter trace."""
    log = {e['seq']: e for e in cap['log']}
    starts = [s for s in cap['cap']['starts'] if not s['loop']]
    trace = cap['cap']['trace']
    out = []
    for rec in cap['sfxLog']:
        st = min(starts, key=lambda s: abs(max(s['when'] or 0, s['ctxNow']) - rec['t'])) if starts else None
        perf = st['perf'] if st and abs(max(st['when'] or 0, st['ctxNow']) - rec['t']) < 0.02 else None
        ev = act = None
        if perf is not None and trace and trace[0]['perf'] - 3000 <= perf:  # before the fight: no event
            nxt = next((t for t in trace if t['perf'] >= perf), None)
            if nxt:
                ev = log.get(nxt['seq'])
                s = nxt['seq']
                src = (ev or {}).get('sourceId') or (ev or {}).get('actorId')
                while s >= 0:
                    e = log.get(s)
                    if e and e['type'] == 'action-start' and (not src or e['actorId'] == src or ev is e):
                        act = e
                        break
                    if e and e['type'] == 'action-end' and s != nxt['seq'] and not src:
                        break
                    s -= 1
        out.append({**rec, 'event': ev, 'action': act})
    return out


def expect(game, r):
    """What the brief says this play should be (a set of acceptable v2 names), or None: not checked."""
    ev, act, played = r['event'], r['action'], r['played']
    if not ev:
        return None
    et = ev['type']
    actor = (act or {}).get('actorId')
    kind = ((act or {}).get('command') or {}).get('kind')
    party = FFX_WEAPON if game == 'ffx' else FFX2_WEAPON
    def weapons(who):
        w = party.get(who)
        return {w} if isinstance(w, str) else (w or set())
    x2 = (lambda k: k + '-x2') if game == 'ffx2' else (lambda k: k)
    if et == 'action-start' and r['asked'] == 'v2:' + played.split(':')[-1]:
        if kind == 'item':
            return {x2('item-use')}
        # FFX-2's ATB overlaps actions, so another action's cue can start inside this one: check the swings only.
        if kind in ('attack',) and actor in party and (game == 'ffx' or played.startswith(('v2:swing-', 'v2:shot-', 'v2:gun-'))):
            return {SWING[w] for w in weapons(actor)} | ({'gun-burst'} if game == 'ffx2' else set())
        return None
    if et == 'damage' and ev['amount'] > 0 and ev.get('affinity') != 'immune':
        if ev.get('crit'):
            return {'critical'}
        if ev.get('element') in ELEMENT:
            return {x2(ELEMENT[ev['element']])}
        if kind == 'attack' and ev.get('sourceId') in party:
            return {HIT[w] for w in weapons(ev['sourceId'])}
        return None
    if et == 'miss':
        return {'whiff'}
    if et == 'ko':
        return {'ko-fall', 'dissolve-pyreflies', 'machina-destroy'}
    if et == 'revive':
        return {'phoenix-down', x2('life')}
    if et == 'overdrive-gauge':
        return {x2('overdrive-full')}
    if et == 'summon':
        return {'summon'}
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('capture')
    ap.add_argument('--dist', required=True)
    ap.add_argument('--json')
    ap.add_argument('--as-first-bank', action='store_true', help='mix every v2 play as its first-bank stand-in: the same fight with the old sounds, for comparison')
    a = ap.parse_args()
    cap = json.load(open(a.capture, encoding='utf-8'))
    game = 'ffx2' if cap['chapter'].startswith('ffx2') else 'ffx'
    man = json.load(open(os.path.join(a.dist, 'audio', 'manifest.json'), encoding='utf-8'))
    v2cues = man['sfxV2']['cues']
    recs = attribute(cap)
    battle_t0 = min((r['t'] for r in recs if r['event']), default=0)

    # ---- the hookup
    problems, checked, by_event = [], 0, {}
    for r in recs:
        name = r['played'][3:] if r['played'].startswith('v2:') else None
        if r['via'] == 'v2' and name not in v2cues:
            problems.append(f"missing sprite key {r['played']}")
        if name and v2cues.get(name, {}).get('game') not in ('both', game, None) and name != 'dissolve-pyreflies':
            problems.append(f"rule 14: {game} chapter played {name} ({v2cues[name]['game']})")
        if r['played'].startswith('v2:') and r['via'] != 'v2':
            problems.append(f"{r['played']} fell back to {r['via']} at {r['t']:.2f}s")
        ev = r['event']
        key = (ev['type'] if ev else 'no event') + (':' + (((r['action'] or {}).get('command') or {}).get('kind') or '') if ev and ev['type'] == 'action-start' else '')
        by_event.setdefault(key, {}).setdefault(r['played'], 0)
        by_event[key][r['played']] += 1
        want = expect(game, r)
        if want is not None:
            checked += 1
            if (name or r['played']) not in want:
                problems.append(f"{key} at {r['t']:.2f}s by {(r['action'] or {}).get('actorId')}: played {r['played']}, expected one of {sorted(want)}")
    v1_in_battle = sorted({r['played'] for r in recs if r['event'] and not r['played'].startswith('v2:')})

    # ---- levels
    ir = hall_ir()
    t_end = max(r['t'] for r in recs) + 5
    n = int((t_end + 1) * SR)
    sfx = np.zeros((n, 2), np.float32)
    sprites = {'v2': decode(os.path.join(a.dist, 'audio', man['sfxV2']['file'])), 'sprite': decode(os.path.join(a.dist, 'audio', man['sfx']['file']))}
    skipped = 0
    if a.as_first_bank:  # the stand-ins, read from the table the game uses (src/audio/sfxV2/cues.ts)
        import re
        src = open(os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'audio', 'sfxV2', 'cues.ts'), encoding='utf-8').read()
        stand = {m.group(1): m.group(2) for m in re.finditer(r"^\s*'?([a-z0-9-]+)'?: c\('(?:ffx|ffx2|both)', '([a-z0-9-]+)'\)", src, re.M)}
        recs = [{**r, 'played': stand[r['played'][3:]], 'via': 'sprite'} if r['via'] == 'v2' else r for r in recs]
    for r in recs:
        if r['via'] == 'synth':
            skipped += 1
            continue
        cue = v2cues[r['played'][3:]] if r['via'] == 'v2' else man['sfx']['cues'][r['played']]
        x = sprites[r['via']][int(cue['offset'] * SR): int((cue['offset'] + cue['duration']) * SR)]
        at = int(r['t'] * SR)
        m = min(len(x), n - at)
        if m > 0:
            sfx[at:at + m] += x[:m] * np.float32(r['volume'])
    wet = np.stack([fftconvolve(sfx[:, c], ir[:, c])[:n] for c in (0, 1)], axis=1).astype(np.float32)
    sfx_bus = (sfx + wet * SEND) * np.float32(cap['sfxMix']['busGain'])
    music = np.zeros((n, 2), np.float32)
    loops = sorted([s for s in cap['cap']['starts'] if s['loop']], key=lambda s: s['ctxNow'])
    for i, s in enumerate(loops):
        key = min(man['music'], key=lambda k: abs(man['music'][k]['duration'] - s['bufDur']))
        e = man['music'][key]
        x = decode(os.path.join(a.dist, 'audio', e['file']))
        start = int(max(s['when'] or 0, s['ctxNow']) * SR)
        stop = int(max(loops[i + 1]['when'] or 0, loops[i + 1]['ctxNow']) * SR) if i + 1 < len(loops) else n
        ls, le, pos, j = int(e['loopStart'] * SR), int(e['loopEnd'] * SR), 0, start
        while j < min(stop, n):
            take = min(le - pos, min(stop, n) - j)
            music[j:j + take] = x[pos:pos + take]
            j += take
            pos = ls if pos + take >= le else pos + take
    music *= np.float32(cap['volumes']['music'])
    lo = int(battle_t0 * SR)
    mb, sb = music[lo:], sfx_bus[lo:]
    k = int(0.043 * SR)
    e = (sb ** 2).sum(axis=1)
    c = np.concatenate([[0], np.cumsum(e)])
    loud43 = 10 * np.log10(((c[k:] - c[:-k]) / k).max() + 1e-12)
    mrms = 10 * np.log10(np.mean((mb ** 2).sum(axis=1)) + 1e-12)
    mix = (mb + sb) * np.float32(cap['volumes']['master'])
    over = np.abs(mix).max(axis=1) > 10 ** (-2 / 20)
    levels = {
        'music_cues': [min(man['music'], key=lambda kk: abs(man['music'][kk]['duration'] - s['bufDur'])) for s in loops],
        'sfx_peak_minus_music_peak_db': round(20 * np.log10(np.abs(sb).max() / (np.abs(mb).max() + 1e-9)), 2),
        'sfx_loudest43ms_minus_music_avg_db': round(loud43 - mrms, 2),
        'mix_peak_dbfs_before_limiter': round(20 * np.log10(np.abs(mix).max() + 1e-9), 2),
        'limiter_active_share': round(float(over.mean()), 5),
        'limiter_active_seconds': round(float(over.sum()) / SR, 2),
        'synth_plays_not_mixed': skipped,
        'seconds_measured': round(len(mb) / SR, 1),
    }
    # the loudest moments, named
    top = []
    for r in recs:
        at = int(r['t'] * SR) - lo
        if at < 0 or not r['event']:
            continue
        seg = mix[at: at + int(0.6 * SR)]
        if len(seg):
            top.append((float(np.abs(seg).max()), r['played'], (r['event'] or {}).get('type'), round(r['t'], 2)))
    top.sort(reverse=True)
    levels['loudest_moments'] = [{'peak_dbfs': round(20 * np.log10(p + 1e-9), 2), 'cue': cu, 'event': et, 't': t} for p, cu, et, t in top[:8]]

    out = {'chapter': cap['chapter'], 'game': game, 'outcome': cap.get('outcome'), 'plays': len(recs), 'checked': checked,
           'problems': problems, 'first_bank_cues_in_battle': v1_in_battle, 'by_event': by_event, 'levels': levels,
           'steps': cap['steps'], 'consoleErrors': cap['consoleErrors'], 'notFound': cap['notFound']}
    print(json.dumps({k: v for k, v in out.items() if k != 'by_event'}, indent=1, default=float))
    if a.json:
        json.dump(out, open(a.json, 'w', encoding='utf-8'), indent=1, default=float)
    return 0 if not problems else 1


if __name__ == '__main__':
    sys.exit(main())
