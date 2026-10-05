"""ro_run.py: the painterly roll-out (r39-art lane, 2026-10-05). Method D for every figure the E library treated, one seed each, a second seed only where the first fails the gates.

  python ro_run.py [--lib DIR] [--only id,id] [--group party|bosses|rest|all] [--workers 2]

The main process is the GPU driver (one Klein job in flight, PAUSE-GPU honoured); the CPU stage (matte, gates, the approved-alpha cut, palette lock, library files) runs in worker processes at BelowNormal.
State is the library's manifest.json (resumable: finished figures are skipped); RW/STOP stops it after the current figure; RW/group-<group>.json is written when a group is complete; RW/progress.json is the live count.
Never writes in place: every library file is new (a figure that already has a file is an error, not an overwrite).
"""
import argparse
import collections
import ctypes
import shutil
import sys
import traceback
from concurrent.futures import ProcessPoolExecutor, wait, FIRST_COMPLETED

sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from ro_common import *
import ro_cpu
from ro_gpu import gpu_stage
from lock_lib import say

STOP = f'{RW}/STOP'
SHEETS = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-05-painterly-cast/sheets'


def free_gb():
    class MS(ctypes.Structure):
        _fields_ = [('dwLength', ctypes.c_ulong), ('dwMemoryLoad', ctypes.c_ulong), ('ullTotalPhys', ctypes.c_ulonglong), ('ullAvailPhys', ctypes.c_ulonglong),
                    ('ullTotalPageFile', ctypes.c_ulonglong), ('ullAvailPageFile', ctypes.c_ulonglong), ('ullTotalVirtual', ctypes.c_ulonglong),
                    ('ullAvailVirtual', ctypes.c_ulonglong), ('ullAvailExtendedVirtual', ctypes.c_ulonglong)]
    m = MS()
    m.dwLength = ctypes.sizeof(MS)
    ctypes.windll.kernel32.GlobalMemoryStatusEx(ctypes.byref(m))
    return m.ullAvailPhys / 1e9


def sha(p):
    return ro_cpu.sha256(p)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lib', default=OUTLIB)
    ap.add_argument('--only', default='')
    ap.add_argument('--group', default='all')
    ap.add_argument('--workers', type=int, default=2)
    ap.add_argument('--inflight', type=int, default=3)
    a = ap.parse_args()
    os.makedirs(RW, exist_ok=True)
    lib = a.lib
    mp = f'{lib}/manifest.json'
    man = load_json(mp) or {'version': 1, 'what': 'the painterly finish (method D, with C as its fallback) over the figure masters of the E library, r39-art lane, 2026-10-05; new files only',
                            'created': now(), 'params': {'method': 'FLUX.2 Klein 9B, no KV cache; references = painting + head close-up + upper/lower close-ups; init lock sigma 0.99; face pass sigma 0.97; palette lock 0.85',
                                                         'gates': ro_cpu.GATE, 'seeds': list(SEEDS), 'tiers': 'characters/<id>/<state>@4x, @2x (wide-only: @2x) and @1x, all from the painterly master; @3x is derived by the installer'},
                            'assets': {}}
    heads = load_json(f'{RW}/heads.json', {})
    only = [x for x in a.only.split(',') if x]
    assets = plan(only or None)
    if a.group != 'all':
        assets = [x for x in assets if x['group'] == a.group]
    todo = [x for x in assets if man['assets'].get(x['id'], {}).get('status') not in ('ok', 'by-eye')]
    say(f'{len(assets)} figures in scope, {len(todo)} to do; free RAM {free_gb():.1f} GB; library {lib}')
    pool = ProcessPoolExecutor(max_workers=a.workers, initializer=ro_cpu.worker_init, max_tasks_per_child=20)
    pending = collections.deque((x, SEEDS[0]) for x in todo)
    inflight = {}
    attempts = collections.defaultdict(list)
    t_start = time.time()
    done_n = 0
    errors = []

    def gpu_seconds(x):
        g = load_json(f'{RW}/{x["id"]}/gpu.json', {})
        return round(sum(v.get('gpu_s') or 0 for v in g.values() if isinstance(v, dict)), 1)

    def progress():
        c = collections.Counter()
        for x in assets:
            r = man['assets'].get(x['id'])
            c[(x['group'], r['status'] if r else 'todo')] += 1
        el = time.time() - t_start
        save_json(f'{RW}/progress.json', {'updated': now(), 'elapsed_h': round(el / 3600, 2), 'done_this_run': done_n,
                                          'figures_per_hour': round(done_n / max(el / 3600, 1e-6), 1), 'counts': {f'{g}/{s}': n for (g, s), n in sorted(c.items())},
                                          'pending': len(pending), 'inflight': len(inflight), 'errors': errors[-10:]})

    def group_check(g):
        mem = [x for x in assets if x['group'] == g]
        if all(man['assets'].get(x['id'], {}).get('status') in ('ok', 'by-eye') for x in mem) and not os.path.exists(f'{RW}/group-{g}.json'):
            recs = [man['assets'][x['id']] for x in mem]
            c = collections.Counter(r['status'] for r in recs)
            m = collections.Counter(r.get('method') for r in recs if r['status'] == 'ok')
            s2 = sum(1 for r in recs if len(r.get('seeds_tried', [])) > 1)
            save_json(f'{RW}/group-{g}.json', {'group': g, 'figures': len(mem), 'status': dict(c), 'method': dict(m), 'second_seed': s2, 'by_eye': [r['id'] for r in recs if r['status'] == 'by-eye'],
                                              'gpu_hours': round(sum(r.get('gpu_s', 0) for r in recs) / 3600, 2), 'finished': now()})
            say(f'GROUP {g} COMPLETE: {dict(c)} methods {dict(m)}')

    def face_only(r):
        c = r.get('candidates') or {}
        return bool(c) and all(g.get('pass_iou') and g.get('pass_cells') and not g.get('pass_face') for g in c.values()) and 'D' in c

    def char_check(cid):
        mem = [x for x in assets if x['cid'] == cid]
        mf = f'{RW}/chars/{cid}.json'
        if all(man['assets'].get(x['id'], {}).get('status') in ('ok', 'by-eye') for x in mem) and not os.path.exists(mf):
            import ro_sheets
            recs = [man['assets'][x['id']] for x in mem]
            sheet, n_ok, n_eye = ro_sheets.char_sheet(cid, man['assets'], {x['id']: x for x in plan()}, lib, SHEETS)
            m = collections.Counter(r.get('method') for r in recs if r['status'] == 'ok')
            save_json(mf, {'cid': cid, 'poses': len(mem), 'ok': n_ok, 'by_eye': n_eye, 'D': m.get('D', 0), 'C': m.get('C', 0), 'second_seed': sum(1 for r in recs if len(r.get('seeds_tried', [])) > 1),
                           'by_eye_poses': [r['id'].split('/')[-1] for r in recs if r['status'] == 'by-eye'], 'sheet': sheet, 'finished': now(), 'announced': False})
            for x2 in mem:     # the work files of a finished character (kept until now so that a change in the CPU stage can be redone without the GPU)
                w2 = f'{RW}/{x2["id"]}'
                for f in os.listdir(w2) if os.path.isdir(w2) else []:
                    if f.endswith('.png') and not (man['assets'][x2['id']]['status'] == 'by-eye' and f.startswith('cand-')):
                        os.remove(f'{w2}/{f}')
            say(f'CHARACTER {cid} COMPLETE: {len(mem)} poses, ok {n_ok} (D {m.get("D", 0)}, C {m.get("C", 0)}), by eye {n_eye}')

    def handle(fut):
        nonlocal done_n
        x, seed = inflight.pop(fut)
        try:
            r = fut.result()
        except Exception as e:  # noqa
            r = {'id': x['id'], 'seed': seed, 'status': 'error', 'error': repr(e), 'trace': traceback.format_exc()[-1200:]}
        attempts[x['id']].append(r)
        wd = f'{RW}/{x["id"]}'
        if r['status'] == 'ok':
            P1 = f'{ART}/{x["id"]}.png'
            man['assets'][x['id']] = {'id': x['id'], 'status': 'ok', 'method': r['method'], 'seed': seed, 'seeds_tried': [q['seed'] for q in attempts[x['id']]], 'gates': r['gates'],
                                      'candidates': {q['seed']: q.get('candidates') for q in attempts[x['id']]}, 'face_pre': r.get('face_pre'), 'outputs': r['outputs'],
                                      'source_sha256': sha(P1), 'today_sha256': sha(f'{EDIR}/{x["id"]}@{x["S"]}x.png'), 'group': x['group'], 'game': x['game'],
                                      'head': heads.get(x['id']), 'gpu_s': gpu_seconds(x), 'cpu_s': round(sum(q.get('seconds', 0) for q in attempts[x['id']]), 1),
                                      'approved_2x_replaced': bool(x['approved2x']), 'flags': ['approved 2x master replaced'] if x['approved2x'] else []}
            done_n += 1
        elif r['status'] == 'fail' and seed == SEEDS[0] and not face_only(r):
            pending.appendleft((x, SEEDS[1]))
        elif r['status'] == 'fail':
            man['assets'][x['id']] = {'id': x['id'], 'status': 'by-eye', 'seeds_tried': [q['seed'] for q in attempts[x['id']]], 'attempts': [{k: q.get(k) for k in ('seed', 'iou', 'reason', 'candidates', 'face_pre')} for q in attempts[x['id']]],
                                      'group': x['group'], 'game': x['game'], 'head': heads.get(x['id']), 'gpu_s': gpu_seconds(x), 'candidates_dir': wd}
            os.makedirs(f'{lib}/by-eye/{x["id"]}', exist_ok=True)
            for f in os.listdir(wd) if os.path.isdir(wd) else []:
                if f.startswith('cand-') and not os.path.exists(f'{lib}/by-eye/{x["id"]}/{f}'):
                    shutil.copy2(f'{wd}/{f}', f'{lib}/by-eye/{x["id"]}/{f}')
            done_n += 1
        else:
            errors.append(f'{x["id"]}: {r.get("error")}')
            man['assets'][x['id']] = {'id': x['id'], 'status': 'error', 'error': r.get('error'), 'trace': r.get('trace'), 'group': x['group']}
        man['updated'] = now()
        save_json(mp, man)
        cs = ', '.join(f"{k}:{'pass' if v.get('pass') else 'fail'} struct {v.get('head_struct')} cells {v.get('cells_over20')}" for k, v in (r.get('candidates') or {}).items())
        say(f"{x['id']} seed {seed}: {r['status']} {r.get('method', '')} iou {r.get('iou')} [{cs}] {r.get('seconds')} s")
        progress()
        group_check(x['group'])
        char_check(x['cid'])

    while pending or inflight:
        for f in [f for f in inflight if f.done()]:
            handle(f)
        if os.path.exists(STOP):
            say('STOP file present: finishing the CPU work in flight and stopping')
            pending.clear()
        if not pending or len(inflight) >= a.inflight:
            if inflight:
                wait(list(inflight), timeout=5, return_when=FIRST_COMPLETED)
            elif pending:
                time.sleep(20)
            continue
        x, seed = pending.popleft()
        head = (heads.get(x['id']) or {}).get('box')
        try:
            gpu_stage(x, seed, head)
        except Exception as e:  # noqa
            say(f'{x["id"]} seed {seed}: GPU stage failed: {e!r}')
            errors.append(f'{x["id"]}: {e!r}')
            man['assets'][x['id']] = {'id': x['id'], 'status': 'error', 'error': repr(e), 'trace': traceback.format_exc()[-1200:], 'group': x['group']}
            save_json(mp, man)
            continue
        while free_gb() < 3.0 and inflight:       # the CPU stage needs a few GB; wait for one in flight to finish rather than push the machine over
            wait(list(inflight), timeout=10, return_when=FIRST_COMPLETED)
            for f in [f for f in inflight if f.done()]:
                handle(f)
        fut = pool.submit(ro_cpu.cpu_task, x, seed, lib, head, seed == SEEDS[-1])
        inflight[fut] = (x, seed)
        progress()
    pool.shutdown()
    say(f'finished: {dict(collections.Counter(r["status"] for r in man["assets"].values()))}')
    for g in GROUPS:
        group_check(g)
    progress()
    if not pending and all(man['assets'].get(x['id'], {}).get('status') in ('ok', 'by-eye') for x in assets):
        open(f'{RW}/ALLDONE', 'w').write(now())


if __name__ == '__main__':
    main()
