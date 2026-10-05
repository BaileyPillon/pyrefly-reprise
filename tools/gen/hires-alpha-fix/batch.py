"""Batch: rebuild the alpha and the rim of every hi-res master of the library into hires-alpha-fixed/ (release 39 repair, 2026-10-04).

  python batch.py [--workers 4] [--only characters/tidus] [--limit N] [--dry]

The library (hires/) is read only. Every output path of its manifest ends up in hires-alpha-fixed/: a rebuilt file (written through a
temporary name), or a hard link to the library's own file where nothing is rebuilt (backdrops, pause and title art, assets whose 1x
painting changed since the master was rendered, and anything the guard below refuses). Resumes: an asset whose result file exists is skipped.
Game case: both games (the library holds FFX and FFX-2 figures; every asset keeps its own game field in the manifest).
"""
import os, sys, json, time, hashlib, shutil, traceback, argparse, datetime
import numpy as np
from multiprocessing import Pool
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import alphafix as af

OLD = 'D:/Tools/pyrefly-art-backup/hires'
NEW = os.environ.get('R39_FIXED_OUT', 'D:/Tools/pyrefly-art-backup/hires-alpha-fixed')
ART = 'D:/pyrefly-r39-int/public/art'
PARAMS = dict(ka=0.4, d0=2.0, d1=3.5, feather=1.0, ring=6)
VERSION = 1
PNG_LEVEL = 9
PATCH = 'D:/Tools/pyrefly-art-backup/candidates/2026-10-04/trapped-white/approved-hashes-patch.json'
CLEANED_SHAS = {e['newSha256'] for e in json.load(open(PATCH, encoding='utf8'))['entries']}


def sha256_file(p):
    h = hashlib.sha256()
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 22), b''):
            h.update(chunk)
    return h.hexdigest()


def link_or_copy(src, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst):
        return 'exists'
    try:
        os.link(src, dst)
        return 'link'
    except OSError:
        shutil.copyfile(src, dst)
        return 'copy'


def write_png(arr, dst):
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    tmp = dst + '.tmp'
    Image.fromarray(arr, 'RGBA').save(tmp, format='PNG', compress_level=PNG_LEVEL)
    os.replace(tmp, dst)
    return os.path.getsize(dst)


def accept(before, after):
    """The guard: take the rebuilt master only when it is no worse than the library's on the rim and the picture."""
    if after['alpha_iou'] < 0.985 and after['alpha_iou'] < before['alpha_iou'] - 0.004:
        return False, f"alpha IoU {before['alpha_iou']:.4f} -> {after['alpha_iou']:.4f}"
    if after.get('ssim_gray') is not None and before.get('ssim_gray') is not None and after['ssim_gray'] < before['ssim_gray'] - 0.003:
        return False, f"SSIM {before['ssim_gray']:.4f} -> {after['ssim_gray']:.4f}"
    if 'rim_bias' in before and 'rim_bias' in after:
        if abs(after['rim_bias']) > abs(before['rim_bias']) + 0.5:
            return False, f"rim bias {before['rim_bias']:.2f} -> {after['rim_bias']:.2f}"
        if after['rim_mad'] > before['rim_mad'] + 0.5:
            return False, f"rim MAD {before['rim_mad']:.2f} -> {after['rim_mad']:.2f}"
    return True, ''


def _init_worker():
    try:
        import ctypes
        ctypes.windll.kernel32.SetPriorityClass(ctypes.windll.kernel32.GetCurrentProcess(), 0x4000)  # BELOW_NORMAL
    except Exception:
        pass


def process(aid):
    t0 = time.time()
    res_path = f'{NEW}/reports/results/{aid.replace("/", "__")}.json'
    if os.path.exists(res_path):
        try:
            old = json.load(open(res_path, encoding='utf8'))
            if old.get('version') == VERSION and old.get('params') == PARAMS:
                return old
        except Exception:
            pass
    man_rec = MAN['assets'][aid]
    out = {'id': aid, 'version': VERSION, 'params': PARAMS, 'status': 'error', 'outputs': []}
    try:
        group = aid.split('/')[0]
        src_rel = man_rec['src'].replace('public/art/', '')
        p_path = f'{ART}/{src_rel}'
        links = []
        if group not in ('characters', 'portraits'):
            out['status'] = 'linked'
            out['note'] = f'{group}: opaque art, nothing to repair'
        elif not os.path.exists(p_path):
            out['status'] = 'skipped'
            out['note'] = f'no approved 1x painting at {src_rel}'
        else:
            p_sha = sha256_file(p_path)
            want = man_rec.get('source_sha256')
            cleaned = p_sha in CLEANED_SHAS
            if want and p_sha != want and not cleaned:
                out['status'] = 'skipped'
                out['note'] = '1x painting changed since the master was rendered (sha256); re-render owed'
            else:
                if cleaned and p_sha != want:
                    out['cleaned_1x'] = True
                out['source_sha256'] = p_sha
                P = af.load_rgba(p_path)
                h, w = P.shape[:2]
                outs = {o['scale']: o for o in man_rec['outputs']}
                four = outs.get(4)
                two = outs.get(2)
                results = {}
                if four is not None:
                    M4 = af.load_rgba(f'{OLD}/{four["path"]}')
                    if M4.shape[0] != h * 4 or M4.shape[1] != w * 4:
                        out['status'] = 'skipped'
                        out['note'] = f'4x master is {M4.shape[1]}x{M4.shape[0]}, not 4 x {w}x{h}'
                    else:
                        N4, _ = af.repair(P, M4, 4, **PARAMS)
                        before4 = af.metrics(P, M4, 4)
                        after4 = af.metrics(P, N4, 4)
                        ok, why = accept(before4, after4)
                        results[4] = (M4, N4, before4, after4, ok, why)
                        del M4
                        if two is not None:
                            N2 = af.reduce_half(N4)
                            M2 = af.load_rgba(f'{OLD}/{two["path"]}')
                            before2 = af.metrics(P, M2, 2)
                            after2 = af.metrics(P, N2, 2)
                            results[2] = (M2, N2, before2, after2, ok, why)
                            del M2
                elif two is not None:
                    M2 = af.load_rgba(f'{OLD}/{two["path"]}')
                    if M2.shape[0] != h * 2 or M2.shape[1] != w * 2:
                        out['status'] = 'skipped'
                        out['note'] = f'2x master is {M2.shape[1]}x{M2.shape[0]}, not 2 x {w}x{h}'
                    else:
                        N2, _ = af.repair(P, M2, 2, **PARAMS)
                        before2 = af.metrics(P, M2, 2)
                        after2 = af.metrics(P, N2, 2)
                        ok, why = accept(before2, after2)
                        results[2] = (M2, N2, before2, after2, ok, why)
                        del M2
                if results and out['status'] == 'error':
                    anyfixed = False
                    for scale, (Mold, Nnew, b, a, ok, why) in sorted(results.items(), reverse=True):
                        o = outs[scale]
                        rec = {'path': o['path'], 'scale': scale, 'before': b, 'after': a, 'accepted': bool(ok)}
                        if ok:
                            nbytes = write_png(Nnew, f'{NEW}/{o["path"]}')
                            rec.update(bytes_png=nbytes, size=[int(Nnew.shape[1]), int(Nnew.shape[0])], sha256=sha256_file(f'{NEW}/{o["path"]}'))
                            anyfixed = True
                        else:
                            rec['kept_because'] = why
                            links.append(o['path'])
                        out['outputs'].append(rec)
                    out['status'] = 'fixed' if anyfixed else 'kept'
        # everything that is not rebuilt is a hard link to the library's own file
        done = {r['path'] for r in out['outputs'] if r.get('accepted')}
        for o in man_rec['outputs']:
            if o['path'] not in done:
                how = link_or_copy(f'{OLD}/{o["path"]}', f'{NEW}/{o["path"]}')
                if out['status'] in ('linked', 'skipped'):
                    out['outputs'].append({'path': o['path'], 'scale': o['scale'], 'accepted': False, 'linked': how})
    except Exception as e:  # noqa
        out['status'] = 'error'
        out['error'] = repr(e)
        out['trace'] = traceback.format_exc()[-1500:]
    out['seconds'] = round(time.time() - t0, 1)
    os.makedirs(os.path.dirname(res_path), exist_ok=True)
    json.dump(out, open(res_path + '.tmp', 'w', encoding='utf8'))
    os.replace(res_path + '.tmp', res_path)
    return out


MAN = None


def main():
    global MAN
    ap = argparse.ArgumentParser()
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--only', default='')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('--dry', action='store_true')
    a = ap.parse_args()
    MAN = json.load(open(f'{OLD}/manifest.json', encoding='utf8'))
    ids = [k for k in MAN['assets'] if k.startswith(a.only)]
    # largest first (the long jobs start early), assets without a rebuild last
    def px(k):
        return max((o['size'][0] * o['size'][1] for o in MAN['assets'][k]['outputs']), default=0)
    ids.sort(key=lambda k: -px(k))
    if a.limit:
        ids = ids[:a.limit]
    print(f'{len(ids)} assets, workers {a.workers}, params {PARAMS}', flush=True)
    if a.dry:
        return
    os.makedirs(f'{NEW}/reports', exist_ok=True)
    log = open(f'{NEW}/reports/batch.log', 'a', encoding='utf8')
    t0 = time.time()
    n = 0
    stat = {}
    with Pool(a.workers, initializer=_init_worker, maxtasksperchild=6) as pool:
        for r in pool.imap_unordered(_run, ids, chunksize=1):
            n += 1
            stat[r['status']] = stat.get(r['status'], 0) + 1
            line = f'[{n}/{len(ids)} {time.time() - t0:.0f}s] {r["id"]} {r["status"]} {r.get("seconds", "")}s ' + (r.get('note') or r.get('error') or '')
            if r['status'] == 'fixed':
                o4 = [x for x in r['outputs'] if x['scale'] in (4, 2) and x.get('accepted')]
                if o4:
                    b, af_ = o4[0]['before'], o4[0]['after']
                    line += f" bias {b.get('rim_bias', float('nan')):.2f}->{af_.get('rim_bias', float('nan')):.2f} specks {b.get('rim_specks', '-')}->{af_.get('rim_specks', '-')}"
            if r['status'] == 'kept':
                line += ' ' + '; '.join(x.get('kept_because', '') for x in r['outputs'])
            print(line, flush=True)
            log.write(line + '\n')
            log.flush()
    print('done', stat, f'{time.time() - t0:.0f}s', flush=True)
    log.write(f'done {stat} {time.time() - t0:.0f}s\n')


def _run(aid):
    global MAN
    if MAN is None:
        MAN = json.load(open(f'{OLD}/manifest.json', encoding='utf8'))
    return process(aid)


if __name__ == '__main__':
    main()
