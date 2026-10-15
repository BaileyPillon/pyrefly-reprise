/**
 * A simulation of colour blindness and a colour-difference score, for `colour-vision.test.ts` (PR-0032).
 *
 * The same arithmetic the round's page used (`critic/scratch/options-additions-2026-10-12/cvd.mjs`): Machado, Oliveira and Fernandes 2009,
 * full severity, applied in linear RGB; the score is CIEDE2000 (Sharma, Wu and Dalal 2005) between two colours. Pure arithmetic, no dependencies.
 * As a rule of thumb, under 12 is easy to confuse and 12 to 20 is worth watching; those limits are the round's, not a standard.
 */

export type Kind = 'normal' | 'protan' | 'deutan' | 'tritan';

const M: Record<Exclude<Kind, 'normal'>, number[][]> = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

const hex = (h: string): number[] => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const toLin = (c: number): number => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const fromLin = (c: number): number => {
  const v = Math.min(1, Math.max(0, c));
  return Math.round(255 * (v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055));
};
const toHex = (rgb: number[]): string => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

/** `h` as a person with `kind` of colour blindness sees it. */
export function simulate(h: string, kind: Kind): string {
  if (kind === 'normal') return h;
  const lin = hex(h).map(toLin);
  const m = M[kind];
  return toHex(m.map((row) => fromLin(row[0]! * lin[0]! + row[1]! * lin[1]! + row[2]! * lin[2]!)));
}

function lab(h: string): [number, number, number] {
  const [r, g, b] = hex(h).map(toLin) as [number, number, number];
  const X = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const Y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const Z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  return [116 * f(Y) - 16, 500 * (f(X) - f(Y)), 200 * (f(Y) - f(Z))];
}

/** CIEDE2000 between two `#rrggbb` colours. */
export function de2000(h1: string, h2: string): number {
  const [L1, a1, b1] = lab(h1);
  const [L2, a2, b2] = lab(h2);
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) * deg + 360) % 360;
  const h2p = (Math.atan2(b2, a2p) * deg + 360) % 360;
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * rad);
  const Lbp = (L1 + L2) / 2;
  const Cbp = (C1p + C2p) / 2;
  let hbp = h1p + h2p;
  if (C1p * C2p === 0) hbp = h1p + h2p;
  else if (Math.abs(h1p - h2p) <= 180) hbp /= 2;
  else hbp = (hbp + (hbp < 360 ? 360 : -360)) / 2;
  const T = 1 - 0.17 * Math.cos((hbp - 30) * rad) + 0.24 * Math.cos(2 * hbp * rad) + 0.32 * Math.cos((3 * hbp + 6) * rad) - 0.2 * Math.cos((4 * hbp - 63) * rad);
  const dTh = 30 * Math.exp(-(((hbp - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cbp ** 7 / (Cbp ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lbp - 50) ** 2) / Math.sqrt(20 + (Lbp - 50) ** 2);
  const Sc = 1 + 0.045 * Cbp;
  const Sh = 1 + 0.015 * Cbp * T;
  const Rt = -Math.sin(2 * dTh * rad) * Rc;
  return Math.sqrt((dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh));
}

/** The closest pair in a group, as `kind` sees it. */
export function minPair(items: Readonly<Record<string, string>>, kind: Kind): { de: number; a: string; b: string } {
  const names = Object.keys(items);
  let best = { de: Infinity, a: '', b: '' };
  for (let i = 0; i < names.length; i++) {
    for (let j = i + 1; j < names.length; j++) {
      const de = de2000(simulate(items[names[i]!]!, kind), simulate(items[names[j]!]!, kind));
      if (de < best.de) best = { de, a: names[i]!, b: names[j]! };
    }
  }
  return best;
}
