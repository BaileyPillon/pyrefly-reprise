// @vitest-environment jsdom
/**
 * THE QR CODE (release 61, the conference demo; Bailey, 2026-10-21, decision 169o; both games, demo mode only; `src/ui/demo/qr.ts`, `qrSvg.ts`, the reader in `tests/unit/helpers/qrRead.ts`, `src/app/demo/demoQr.ts`).
 *
 * The claim that matters is "a phone reads it", and it is proved two ways that do not share code with the encoder:
 *  1. The finished matrix equals an independent encoder's (reportlab's, committed as fixtures) for nine texts across versions 2 to 7 and all four levels, given the same mask. That covers the data words, the
 *     error correction, the interleaving, the zigzag placement, the format and version words.
 *  2. A reader written from the standard's reading rules (`qrRead.ts`) decodes the encoder's own pick (its penalty-chosen mask) back to the text, for every version it supports at every level.
 * The mask the encoder chooses by penalty may differ from another encoder's (the standard allows any of the eight); both are valid, which is why (1) forces the fixture's mask and (2) takes the encoder's own.
 */
import { describe, expect, it } from 'vitest';
import fixtures from './fixtures/demo-qr-reportlab.json';
import { MAX_VERSION, byteCapacity, encodeQr, penalty, qrRows, type EcLevel } from '../../src/ui/demo/qr.ts';
import { decodeQr } from './helpers/qrRead.ts';
import { qrSvg } from '../../src/ui/demo/qrSvg.ts';
import { BOOTH_URL } from '../../src/app/demo/demoFlow.ts';
import { boothHost, boothQr, boothQrSvg, mountQrPlate } from '../../src/app/demo/demoQr.ts';

const LEVELS: EcLevel[] = ['L', 'M', 'Q', 'H'];

describe('the QR encoder equals an independent implementation', () => {
  for (const c of fixtures.cases) {
    it(`${c.ec} ${JSON.stringify(c.text.slice(0, 24))} (${c.size} modules, mask ${c.mask})`, () => {
      const mine = encodeQr(c.text, { ec: c.ec as EcLevel, mask: c.mask });
      expect(mine.size).toBe(c.size);
      expect(qrRows(mine)).toEqual(c.rows);
    });
  }
});

describe('the QR reader decodes what the encoder draws', () => {
  it('every version at every level', () => {
    let checked = 0;
    for (const ec of LEVELS) {
      for (let v = 1; v <= MAX_VERSION; v++) {
        const text = 'Echoes of Spira '.repeat(20).slice(0, byteCapacity(v, ec)); // a full symbol of the version
        const code = encodeQr(text, { ec, minVersion: v });
        expect(code.version).toBe(v);
        expect(decodeQr(code.modules)).toBe(text);
        checked++;
      }
    }
    expect(checked).toBe(40);
  });

  it('every mask', () => {
    for (let mask = 0; mask < 8; mask++) expect(decodeQr(encodeQr(BOOTH_URL, { mask }).modules)).toBe(BOOTH_URL);
  });

  it('text that is not ASCII (UTF-8 bytes)', () => {
    const text = 'Spira — « fan tribute » ✓';
    expect(decodeQr(encodeQr(text, { ec: 'Q' }).modules)).toBe(text);
  });

  it('refuses a matrix that is not a code', () => {
    expect(decodeQr(Array.from({ length: 21 }, () => new Array<boolean>(21).fill(false)))).toBeNull();
    expect(decodeQr([[true]])).toBeNull();
  });
});

describe('the encoder', () => {
  it('is deterministic and picks the lowest-penalty mask', () => {
    const a = encodeQr(BOOTH_URL);
    const b = encodeQr(BOOTH_URL);
    expect(qrRows(a)).toEqual(qrRows(b));
    for (let mask = 0; mask < 8; mask++) expect(penalty(a.modules)).toBeLessThanOrEqual(penalty(encodeQr(BOOTH_URL, { mask }).modules));
  });

  it('picks the smallest version that holds the text', () => {
    expect(encodeQr('a', { ec: 'L' }).version).toBe(1);
    expect(encodeQr('a'.repeat(byteCapacity(1, 'M')), { ec: 'M' }).version).toBe(1);
    expect(encodeQr('a'.repeat(byteCapacity(1, 'M') + 1), { ec: 'M' }).version).toBe(2);
  });

  it('refuses text that does not fit, rather than draw a wrong code', () => {
    expect(() => encodeQr('a'.repeat(byteCapacity(MAX_VERSION, 'H') + 1), { ec: 'H' })).toThrow(/do not fit/);
    expect(() => encodeQr('a', { mask: 9 })).toThrow(/mask/);
  });

  it('draws the three finder patterns, the timing lines and the always-dark module', () => {
    const { modules: m, size } = encodeQr(BOOTH_URL);
    for (const [x, y] of [[0, 0], [size - 7, 0], [0, size - 7]] as const) {
      expect(m[y]![x]).toBe(true);
      expect(m[y + 3]![x + 3]).toBe(true); // the centre of the finder
      expect(m[y + 1]![x + 1]).toBe(false); // its light ring
    }
    for (let i = 8; i < size - 8; i++) expect(m[6]![i]).toBe(i % 2 === 0);
    expect(m[size - 8]![8]).toBe(true);
  });
});

describe('the booth code', () => {
  it('is echoesofspira.com, version 2, level M, and decodes to the address', () => {
    expect(BOOTH_URL).toBe('https://echoesofspira.com');
    const code = boothQr();
    expect(code.version).toBe(2);
    expect(code.ec).toBe('M');
    expect(code.size).toBe(25);
    expect(decodeQr(code.modules)).toBe(BOOTH_URL);
    expect(boothHost()).toBe('echoesofspira.com');
  });

  it('draws as one crisp SVG, square, with the standard quiet zone and ink on paper', () => {
    const svg = boothQrSvg();
    expect(svg).toMatch(/viewBox="0 0 33 33"/); // 25 modules + 2 x 4 quiet
    expect(svg).toContain('shape-rendering="crispEdges"');
    expect(svg).toContain('fill="#0b0a12"');
    expect(svg).toContain('fill="#f4f1e8"');
    expect(svg.length).toBeLessThan(4000);
    expect(qrSvg(boothQr(), { light: null })).not.toContain('<rect');
  });

  it('mounts as a plate that takes no input and names the address', () => {
    document.body.innerHTML = '<div id="root"></div>';
    const root = document.getElementById('root')!;
    const plate = mountQrPlate(root, 'title');
    expect(plate.classList.contains('demo-qr--title')).toBe(true);
    expect(plate.dataset['url']).toBe(BOOTH_URL);
    expect(plate.querySelector('svg')).not.toBeNull();
    expect(plate.textContent).toContain('echoesofspira.com');
    expect(plate.getAttribute('aria-label')).toContain('echoesofspira.com');
    expect(mountQrPlate(root, 'picker').classList.contains('demo-qr--picker')).toBe(true);
  });
});
