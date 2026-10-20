"""gen_handoff.py : writes D:/Tools/pyrefly-scratch/2026-10-19/rig-expressive-2/<name>/<name>-handoff.md from the saved gate/verify/head/ko outputs plus the hand-written prose in PROSE (one entry per subject).
Run after the final recordings: it re-reads whatever is in the folders (gate outputs are re-taken from the rig folders)."""
import json
import pathlib
import subprocess
import sys

X = pathlib.Path('D:/Tools/pyrefly-scratch/2026-10-19/rig-expressive-2')
REPO = 'D:/pyrefly-rig-rikkudk'
PROSE = json.load(open(''+str(__import__("pathlib").Path(__file__).resolve().parent / "prose.json")+'', encoding='utf8'))


def sh(cmd):
    r = subprocess.run(cmd, cwd=REPO, capture_output=True, text=True, shell=False)
    return (r.stdout + r.stderr).strip()


def ko_rows(sub, rec):
    f = X / sub / f'ko-summary-{rec}.json'
    if not f.exists():
        return None
    return json.load(open(f))


def fmt_ko(sub):
    x = ko_rows(sub, 'x')
    t = ko_rows(sub, 'today')
    out = []
    if not x or not t:
        return 'ko-summary: not recorded.'
    def row(name, d):
        w = d['worstStep']
        b0, b1 = d['boxBefore'], d['boxAfter']
        return (f"| {name} | {d['swapFrame']} (HP 0 at {d['engineKoFrame']}) | {b0['w']} x {b0['h']} to {b1['w']} x {b1['h']} (x{d['boxHeightRatio']}, {d['boxShiftPx']} px) | "
                f"{d['headArea']['hurt']} / {d['headArea']['ko']} (ratio {d['headArea']['ratio']}) | {d['figureMeshArea']['ratio']} | {w['head']['px']} / {w['centroid']['px']} / {w['feet']['px']} px |")
    out.append('| rig | pose swap frame | projected box (w x h) before to after, height ratio, centre move | head mesh area hurt / KO | whole-figure mesh ratio | worst one-frame step head / centroid / feet |')
    out.append('|---|---|---|---|---|---|')
    off = x.get('off')
    if off and off.get('boxBefore'):
        b0, b1 = off['boxBefore'], off['boxAfter']
        w = off['worstStep']
        out.append(f"| painting set (rig off) | {off['swapFrame']} | {b0['w']} x {b0['h']} to {b1['w']} x {b1['h']} (x{off['boxHeightRatio']}, {off['boxShiftPx']} px) | the probe's own row: {json.dumps(off.get('probeKoSwap', {}).get('head', {}))} | - | {w['head']['px']} / {w['centroid']['px']} / {w['feet']['px']} px |")
    out.append(row("today's rig", t['on']))
    out.append(row('expressive rig', x['on']))
    return '\n'.join(out)


for sub, p in PROSE.items():
    n = f'{sub}-x'
    d = X / sub
    gate = sh(['node', 'tools/rig-gate.mjs', '--rig', f'D:/pyrefly-art-rigs/{n}', '--art', 'D:/pyrefly-art-r59'])
    verify = sh(['node', 'tools/rig-gate.mjs', '--rig', f'D:/pyrefly-art-rigs-work/{n}/verify-copy/{p["id"]}', '--verify', '--art', 'D:/pyrefly-art-r59'])
    (d / f'{n}-gate-output.txt').write_text(gate + '\n', encoding='utf8')
    (d / f'{n}-verify-output.txt').write_text(verify + '\n', encoding='utf8')
    head = (d / f'{n}-head-area.txt').read_text(encoding='utf8') if (d / f'{n}-head-area.txt').exists() else ''
    fb = d / 'for-bailey'
    rec_status = ('RECORDING STATUS: the stills, clips and KO numbers below come from ' + ('`rec-x2`, the recording of the FINAL build.' if (d / 'rec-x2').exists() else ('`rec-x`, the recording BEFORE the head pieces were scaled to the opaque-area rule' if sub in ('grothia', 'spathi', 'shiva') else ('`rec-x`.' if (d / 'rec-x').exists() else 'NO RECORDING YET (the browser was held by REVIEW-BROWSER)'))) + (' A re-record into `rec-x2` is queued (`recq.sh`); the head areas differ by 2 to 7 percent from this build.' if (sub in ('grothia', 'spathi', 'shiva') and not (d / 'rec-x2').exists()) else ''))
    files = sorted(f.name for f in fb.glob('*')) if fb.exists() else []
    md = f"""# The {sub.capitalize()} expressive rig ({n}; branch `rig-expressive-2`, 2026-10-19)

{p['case']}

Method: the Bahamut pilot's expressive keys (`tools/rig/rig_vcut.py`, `rig.py variants`): pieces cut from the attack and hurt PAINTINGS, registered through the keys' bones, shown only in those keys (format v2 variants); built into the NEW folder
`D:/pyrefly-art-rigs/{n}` (the shipped `{sub}` folder is untouched). Config `tools/rig/subjects/{n}.json`, keys `{n}.keys.json`.
**State: gated `ok`, `--verify` passes, the rig stays OFF.** Nothing installed, merged, deployed or reviewed.

## What was cut

{p['cut']}

## The gate, verbatim (`node tools/rig-gate.mjs --rig D:/pyrefly-art-rigs/{n} --art D:/pyrefly-art-r59`, then `--verify` on a copy named `{p['id']}`)

```
{gate}
{verify}
```

## Head area per key (`ha.py`: the head part alone, rendered in each key's pose; the opaque pixels are the size rule)

```
{head.strip()}
```
{p['head_note']}

## The real chapter: the KO swap (`ko-summary.mjs`; {p['chapter']})

{fmt_ko(sub)}

{p['ko_note']}

## Sheets and motion clips (`{fb}`)

{rec_status}

{chr(10).join('- ' + f for f in files)}

Stills: `*-attack-hurt-threeway.png` and `*-hurt-ko-threeway.png` (A the painting set the game draws today, B today's rig, C the expressive rig; same camera, each panel centred on its own figure). Motion: `<name>-attack-motion.mp4`, `-hurt-motion.mp4`,
`-hurt-to-ko-motion.mp4` (each recording aligned on its own pose swap) and `-ko-motion.mp4` (idle easing into the KO key), 60 fps, the three panels side by side.

## Honest verdict

{p['verdict']}

## What the driver must decide

{p['decide']}
"""
    (d / f'{sub}-handoff.md').write_text(md, encoding='utf8')
    print('wrote', d / f'{sub}-handoff.md', len(md))
