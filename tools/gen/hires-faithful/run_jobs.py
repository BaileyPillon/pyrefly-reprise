"""run_jobs.py: run hires-library jobs (the library's own recipe, hires_lib.gpu_plain / gpu_refine / finish_job) for chosen ids and tiers, under the
shared GPU lock and PAUSE-GPU, and merge the records into D:/Tools/pyrefly-art-backup/hires/manifest.json (what the overnight driver does).
usage: run_jobs.py <tiers: base|refined|base,refined> <id> [<id> ...]      ids like characters/evrae/idle
NEVER run it while the hires driver/supervisor is running (two writers of manifest.json).
"""
import sys
sys.path.insert(0, 'D:/Tools/pyrefly-scratch/2026-10-04/r39-art/tools')
from r39lib import *
import hires_lib as H
import hires_driver as D
from concurrent.futures import ProcessPoolExecutor

_orig = cc.run_graph


def _gated(graph, out_nodes, tag='job', timeout=900):
    gpu_gate()
    return _orig(graph, out_nodes, tag=tag, timeout=timeout)


H.run_graph = _gated   # hires_lib imported the name; every graph it runs goes through the PAUSE-GPU gate


def main():
    tiers = sys.argv[1].split(',')
    ids = sys.argv[2:]
    jobs = {j['id']: j for j in H.load_worklist()}
    pool = ProcessPoolExecutor(max_workers=2)
    pending = []
    for jid in ids:
        job = jobs[jid]
        for tier in tiers:
            man = H.load_manifest()
            if D.done_at(man, job, tier):
                say(f'{jid} [{tier}] already done from the current painting: skipped')
                continue
            attempt = 0
            while True:
                attempt += 1
                try:
                    t0 = time.time()
                    g1 = H.gpu_plain(job, tier)
                    g2 = H.gpu_refine(job) if tier == 'refined' else 0.0
                    break
                except BlackFrame as e:
                    say(f'ALL-BLACK FRAME at {jid}: {e}')
                    D.log_black(f'{jid} {e}')
                    if attempt >= 2:
                        raise
                    D.restart_comfy()
            say(f'GPU {jid} [{tier}] x{job["scale"]}: {(g1 or 0) + (g2 or 0):.1f} s of GPU, {time.time() - t0:.0f} s wall')
            pending.append((pool.submit(H.finish_job, job, tier), jid, tier))
            # merge whatever has finished
            for f, j2, t2 in list(pending):
                if f.done():
                    pending.remove((f, j2, t2))
                    merge(f.result())
    for f, j2, t2 in pending:
        merge(f.result())
    pool.shutdown()


def merge(rec):
    man = H.load_manifest()
    old = man['assets'].get(rec['id'])
    if old and old.get('status') in ('ok', 'flagged'):
        rec['previous'] = {k: old.get(k) for k in ('tier', 'status', 'qc', 'flags', 'finished_at')}
    man['assets'][rec['id']] = rec
    H.save_manifest(man)
    q = rec.get('qc', {})
    say(f'  finished {rec["id"]} [{rec["tier"]}] {rec["status"]} {",".join(rec.get("flags", []))} cpu {rec.get("cpu_seconds")}s qc ssim {q.get("ssim")} dE {q.get("dE_mean")} edge {q.get("edge_corr")} refine {q.get("refine_ssim")}')


if __name__ == '__main__':
    main()
