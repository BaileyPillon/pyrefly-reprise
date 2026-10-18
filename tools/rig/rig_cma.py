"""A small CMA-ES (covariance matrix adaptation evolution strategy, Hansen) for the rig fitter: derivative-free, handles the 30-odd correlated joint angles of a rig without a gradient.

    best_x, best_f, evals = cma_es(f, x0, sigma0, lo, hi, max_evals, rng)

`f` takes a vector inside [lo, hi] (the sampler clips and charges a small penalty for leaving the box, so a bound is soft at the edge and exact in what f sees). Standard
(mu/mu_w, lambda) recombination, rank-one and rank-mu covariance updates, cumulative step-size adaptation, restarts are the caller's.
"""
from __future__ import annotations

import math

import numpy as np


def cma_es(f, x0, sigma0, lo, hi, max_evals, rng, popsize=None, ftol=1e-6, stall=150, verbose=False):
    n = len(x0)
    lam = popsize or (4 + int(3 * math.log(n)))
    mu = lam // 2
    w = np.log(mu + 0.5) - np.log(np.arange(1, mu + 1))
    w /= w.sum()
    mueff = 1.0 / np.sum(w ** 2)
    cc = (4 + mueff / n) / (n + 4 + 2 * mueff / n)
    cs = (mueff + 2) / (n + mueff + 5)
    c1 = 2 / ((n + 1.3) ** 2 + mueff)
    cmu = min(1 - c1, 2 * (mueff - 2 + 1 / mueff) / ((n + 2) ** 2 + mueff))
    damps = 1 + 2 * max(0.0, math.sqrt((mueff - 1) / (n + 1)) - 1) + cs
    chi_n = math.sqrt(n) * (1 - 1 / (4 * n) + 1 / (21 * n * n))
    span = np.maximum(hi - lo, 1e-9)
    m = np.clip(np.asarray(x0, float).copy(), lo, hi)
    sigma = float(sigma0)
    pc = np.zeros(n)
    ps = np.zeros(n)
    B = np.eye(n)
    D = np.ones(n)
    C = np.eye(n)
    invsqrtC = np.eye(n)
    best_x, best_f = m.copy(), f(m)
    evals = 1
    gen = 0
    last_improve = 0
    free = (hi > lo)
    while evals < max_evals:
        z = rng.standard_normal((lam, n)) * free
        y = (z * D) @ B.T
        X = m + sigma * y
        Xc = np.clip(X, lo, hi)
        pen = 5.0 * np.sum(((X - Xc) / span) ** 2, axis=1)
        fit = np.array([f(Xc[k]) for k in range(lam)]) + pen
        evals += lam
        order = np.argsort(fit)
        if fit[order[0]] < best_f - 1e-9:
            best_f = float(fit[order[0]])
            best_x = Xc[order[0]].copy()
            last_improve = gen
        sel = order[:mu]
        ysel = y[sel]
        yw = w @ ysel
        m = np.clip(m + sigma * yw, lo, hi)
        ps = (1 - cs) * ps + math.sqrt(cs * (2 - cs) * mueff) * (invsqrtC @ yw)
        hsig = float(np.linalg.norm(ps) / math.sqrt(1 - (1 - cs) ** (2 * (gen + 1))) / chi_n < 1.4 + 2 / (n + 1))
        pc = (1 - cc) * pc + hsig * math.sqrt(cc * (2 - cc) * mueff) * yw
        rank_mu = (ysel.T * w) @ ysel
        C = (1 - c1 - cmu) * C + c1 * (np.outer(pc, pc) + (1 - hsig) * cc * (2 - cc) * C) + cmu * rank_mu
        sigma *= math.exp((cs / damps) * (np.linalg.norm(ps) / chi_n - 1))
        sigma = min(sigma, 2.0 * float(np.max(span)))
        gen += 1
        C = (C + C.T) / 2
        eig, B = np.linalg.eigh(C)
        D = np.sqrt(np.maximum(eig, 1e-20))
        invsqrtC = (B / D) @ B.T
        if verbose and gen % 10 == 0:
            print(f'    gen {gen} evals {evals} best {best_f:.4f} sigma {sigma:.4f} spread {abs(fit[order[0]] - fit[order[-1]]):.5f}', flush=True)
        if gen - last_improve > stall or sigma * float(np.max(D)) < 1e-5 or (gen > 5 and abs(fit[order[0]] - fit[order[-1]]) < ftol):
            break
    return best_x, best_f, evals
