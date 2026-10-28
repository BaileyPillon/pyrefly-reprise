// Continuity harness: the head as the CARD carries it, beside the head as the camera draws it (CHK-026; PR-0459; method check 2026-10-26 section 3.4; pc-residues lane, 2026-10-28).
//
// CHK-026 item 1 reads both paintings "through their own planes in the same frame, so the camera cannot be the cause". Under a close lens with yawed planes that is not true: a head
// on the far side of a card seen from the side is drawn smaller than one on the near side, and the engine's head lock (`HeadLock.ts`) makes up for it by scaling the card, within a band
// of 0.9 to 1.1. Chapter I's killing-blow close-up read Auron's head x0.92 and x1.09 at two swaps (the same pose pair reads x1.001 everywhere else).
//
// Probe version 3 records, per plane, its size in WORLD units and the lock's factor (`pl`). The head box (fractions of the painting) times the plane's world size is the head as the card
// carries it, with no camera in it: `head.card.ratio`. Beside the projected ratio it says WHICH of four things a head change is (`head.class`):
//   ok            both readings inside the tolerance;
//   lock          the card's head changed and the camera's did not: the head lock doing its job (a card scaled to make up for the lens); reported, not a fault;
//   camera        the projected head changed and the card's did not: only the lens (the lock was off, or could not reach the head); the registration is right;
//   lock-band     both changed and a plane's lock sits at the edge of its band: the registration is right and the lens asked for more than the lock may give (the close-up's case);
//   registration  both changed and no lock is at the band: the table's head box or scale is off for this pair.
// Which reading gates is the policy's `headGate` (`projected`, today; `card`): the card's number is a CONTROL for a registered pose (it holds by construction away from the band),
// so the gate stays on what the player sees until a decision says otherwise; the class names the owner of the defect.
//
// Pure: plain numbers in, plain numbers out. Game case: both (shared critic plumbing).

/** The head lock's band (`HeadLock.ts` `HEAD_BAND`) and how near its edge a factor counts as the band's. */
export const LOCK_BAND = [0.9, 1.1];
export const LOCK_EDGE = 0.005;

const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };

/** The plane record's probe-3 extension, `{ wx, wy, lock }`, for painting key `k` in a frame's figure record; null for a recording without it (probe 1 and 2) or a plane not recorded. */
export function planeExt(fig, k) {
  if (!fig || !Array.isArray(fig.pl)) return null;
  for (let i = 0; i < fig.s.length; i++) {
    const raw = fig.s[i];
    if (Array.isArray(raw) && raw[0] === k) {
      const e = fig.pl[i];
      return Array.isArray(e) && e[0] > 0 && e[1] > 0 ? { wx: e[0], wy: e[1], lock: Number.isFinite(e[2]) ? e[2] : 1 } : null;
    }
  }
  return null;
}

/** The head's size as the card carries it, in world units: the square root of the head box's area (fractions of the painting times the plane's world width and height). */
export function cardHeadSize(ext, head) {
  return Math.sqrt(Math.max(0, (head.u1 - head.u0) * (head.t1 - head.t0)) * ext.wx * ext.wy);
}

const atEdge = (lock) => lock <= LOCK_BAND[0] + LOCK_EDGE || lock >= LOCK_BAND[1] - LOCK_EDGE;

/** Which of the four a head change is (see the header), from the projected ratio, the card ratio and the two planes' locks. */
export function headClassOf({ projected, card, tolerancePct, lockFrom, lockTo }) {
  const tol = tolerancePct / 100;
  const projOff = Math.abs(projected - 1) > tol, cardOff = Math.abs(card - 1) > tol;
  if (!projOff && !cardOff) return 'ok';
  if (!projOff) return 'lock';
  if (!cardOff) return 'camera';
  return atEdge(lockFrom) || atEdge(lockTo) ? 'lock-band' : 'registration';
}

/**
 * The card-space reading of one swap, or null when the recording has no probe-3 extension or a plane has no head box. `fig` is the figure record of the frame the swap's readings were taken in.
 * @param {{fig: object, kFrom: number, kTo: number, aFrom: {head?: object}, aTo: {head?: object}, projected: number, tolerancePct: number}} o
 * @returns {null | { fromWorld: number, toWorld: number, ratio: number, lockFrom: number, lockTo: number, class: string }}
 */
export function readCardHead({ fig, kFrom, kTo, aFrom, aTo, projected, tolerancePct }) {
  if (!aFrom?.head || !aTo?.head) return null;
  const ef = planeExt(fig, kFrom), et = planeExt(fig, kTo);
  if (!ef || !et) return null;
  const hf = cardHeadSize(ef, aFrom.head), ht = cardHeadSize(et, aTo.head);
  if (!(hf > 0) || !(ht > 0)) return null;
  const ratio = ht / hf;
  return { fromWorld: round(hf, 4), toWorld: round(ht, 4), ratio: round(ratio, 4), lockFrom: ef.lock, lockTo: et.lock, class: headClassOf({ projected, card: ratio, tolerancePct, lockFrom: ef.lock, lockTo: et.lock }) };
}
