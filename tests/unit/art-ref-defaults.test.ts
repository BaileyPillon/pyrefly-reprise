/**
 * `tools/gen/comfy.mjs` — the 2026-09-21 art-quality-pilot recipe made the
 * generator's own default (`docs/concepts/art-quality-pilot/README.md`,
 * commit 0550cc8): the IP-Adapter reference at weight 0.65 was the main cause
 * of the quality drop Bailey flagged ("some of the art work still looks
 * significantly lower quality than before ... it's a huge downgrade in
 * quality"), and a near-monochrome reference made it worse. These tests pin
 * the new defaults, the monochrome-reference decision function (calibrated
 * against real approved/picked art), the refStart refusal, and the
 * candidate-staging rule that keeps unjudged renders and `.raw.png` files out
 * of `public/art/`.
 */
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MONOCHROME_MIN_OPAQUE_PIXELS,
  MONOCHROME_TOP2_SHARE_MIN,
  REF_END_DEFAULT,
  REF_START_DEFAULT,
  REF_WEIGHT_DEFAULT,
  REF_WEIGHT_TYPE_DEFAULT,
  colorBucketCounts,
  evaluateReferenceMonochrome,
  isUnderPublicArt,
  rawPathFor,
  referenceOptions,
  resolveCandidateOutPath,
} from '../../tools/gen/comfy.mjs';
import { decodeRgba } from '../../tools/gen/cutout-guard.mjs';

// --------------------------------------------------------------------------
// Synthetic pixel builders (same shape as art-cutout-guard.test.ts)
// --------------------------------------------------------------------------

/** A canvas of `width`x`height` opaque pixels, all the same RGB colour. */
function solidCanvas(width: number, height: number, [r, g, b]: [number, number, number]) {
  const n = width * height;
  const alpha = new Uint8Array(n).fill(255);
  const rgb = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    rgb[i * 3] = r;
    rgb[i * 3 + 1] = g;
    rgb[i * 3 + 2] = b;
  }
  return { width, height, alpha, rgb };
}

/** A canvas split into `colors.length` equal horizontal bands, each solid. */
function bandedCanvas(width: number, height: number, colors: [number, number, number][]) {
  const n = width * height;
  const alpha = new Uint8Array(n).fill(255);
  const rgb = new Uint8Array(n * 3);
  const bandHeight = Math.ceil(height / colors.length);
  for (let y = 0; y < height; y++) {
    const color = colors[Math.min(colors.length - 1, Math.floor(y / bandHeight))]!;
    for (let x = 0; x < width; x++) {
      const i = y * width + x;
      rgb[i * 3] = color[0];
      rgb[i * 3 + 1] = color[1];
      rgb[i * 3 + 2] = color[2];
    }
  }
  return { width, height, alpha, rgb };
}

describe('REF_* defaults — the production recipe from the 2026-09-21 pilot', () => {
  it('matches recipe "R2": weight 0.30, start 0.2, end 0.6, ease in', () => {
    expect(REF_WEIGHT_DEFAULT).toBe(0.3);
    expect(REF_START_DEFAULT).toBe(0.2);
    expect(REF_END_DEFAULT).toBe(0.6);
    expect(REF_WEIGHT_TYPE_DEFAULT).toBe('ease in');
  });
});

describe('evaluateReferenceMonochrome — calibrated against real art', () => {
  it('flags the approved Lulu idle (near-black) as monochrome', async () => {
    const pixels = await decodeRgba(resolve('public/art/characters/lulu/idle.png'));
    const result = evaluateReferenceMonochrome(pixels);
    expect(result.monochrome).toBe(true);
    expect(result.top2Share).toBeGreaterThanOrEqual(MONOCHROME_TOP2_SHARE_MIN);
  });

  it('flags the picked Guado Guardian idle (near-ochre) as monochrome', async () => {
    const pixels = await decodeRgba(resolve('public/art/characters/guado-guardian/idle.png'));
    const result = evaluateReferenceMonochrome(pixels);
    expect(result.monochrome).toBe(true);
    expect(result.top2Share).toBeGreaterThanOrEqual(MONOCHROME_TOP2_SHARE_MIN);
  });

  it('does NOT flag the picked Leblanc concept (balanced palette)', async () => {
    const pixels = await decodeRgba(
      resolve('docs/concepts/chapters/leblanc/renders/leblanc-b.png'),
    );
    const result = evaluateReferenceMonochrome(pixels);
    expect(result.monochrome).toBe(false);
    expect(result.top2Share).toBeLessThan(MONOCHROME_TOP2_SHARE_MIN);
  });

  it('flags a synthetic solid-colour canvas', () => {
    const canvas = solidCanvas(64, 64, [20, 20, 20]);
    const result = evaluateReferenceMonochrome(canvas);
    expect(result.top2Share).toBe(1);
    expect(result.monochrome).toBe(true);
  });

  it('does not flag a synthetic canvas evenly split across many distinct hues', () => {
    const canvas = bandedCanvas(64, 300, [
      [230, 30, 30], // red
      [230, 150, 20], // orange
      [220, 220, 30], // yellow
      [30, 200, 60], // green
      [30, 90, 220], // blue
      [160, 40, 200], // purple
    ]);
    const result = evaluateReferenceMonochrome(canvas);
    expect(result.top2Share).toBeLessThan(MONOCHROME_TOP2_SHARE_MIN);
    expect(result.monochrome).toBe(false);
  });

  it('does not guess off too few opaque pixels', () => {
    const canvas = solidCanvas(4, 4, [0, 0, 0]);
    const result = evaluateReferenceMonochrome(canvas);
    expect(result.opaque).toBeLessThan(MONOCHROME_MIN_OPAQUE_PIXELS);
    expect(result.monochrome).toBe(false);
  });

  it('colorBucketCounts ignores non-opaque pixels', () => {
    const n = 100;
    const alpha = new Uint8Array(n); // fully transparent
    const rgb = new Uint8Array(n * 3).fill(200);
    const { counts, opaque } = colorBucketCounts({ width: 10, height: 10, alpha, rgb });
    expect(opaque).toBe(0);
    expect(counts.size).toBe(0);
  });
});

describe('referenceOptions — refStart refusal and the monochrome guard end to end', () => {
  it('refuses --refStart 0 when a reference is given', async () => {
    await expect(
      referenceOptions(
        { ref: 'public/art/characters/lulu/idle.png', refStart: 0 },
        { defaultWidth: 832, defaultHeight: 1216 },
      ),
    ).rejects.toThrow(/--refStart 0/);
  });

  it('allows --refStart 0 when no reference is given (no --ref, nothing to refuse)', async () => {
    const ref = await referenceOptions({ refStart: 0 }, { defaultWidth: 832, defaultHeight: 1216 });
    expect(ref.refStart).toBe(0);
    expect(ref.refImage).toBeUndefined();
  });

  it('drops a near-monochrome reference and records why, without --forceRef', async () => {
    const ref = await referenceOptions(
      { ref: 'public/art/characters/lulu/idle.png' },
      { defaultWidth: 832, defaultHeight: 1216 },
    );
    expect(ref.refImage).toBeUndefined();
    expect(ref.provenance.ref).toBeUndefined();
    expect(ref.provenance.refSkippedMonochrome).toBeDefined();
    const skipped = ref.provenance.refSkippedMonochrome as { top2Share: number };
    expect(skipped.top2Share).toBeGreaterThanOrEqual(MONOCHROME_TOP2_SHARE_MIN);
  });

  it('keeps a near-monochrome reference when --forceRef is set', async () => {
    const ref = await referenceOptions(
      { ref: 'public/art/characters/lulu/idle.png', forceRef: true },
      { defaultWidth: 832, defaultHeight: 1216 },
    );
    expect(ref.refImage).toBeDefined();
    expect(ref.provenance.ref).toBe('public/art/characters/lulu/idle.png');
    expect(ref.provenance.refSkippedMonochrome).toBeUndefined();
  });

  it('keeps a balanced reference (Leblanc) without needing --forceRef', async () => {
    const ref = await referenceOptions(
      { ref: 'docs/concepts/chapters/leblanc/renders/leblanc-b.png' },
      { defaultWidth: 832, defaultHeight: 1216 },
    );
    expect(ref.refImage).toBeDefined();
    expect(ref.provenance.ref).toBe('docs/concepts/chapters/leblanc/renders/leblanc-b.png');
  });

  it('resolves refWeight/refStart/refEnd/refWeightType to the new defaults when unset', async () => {
    const ref = await referenceOptions({}, { defaultWidth: 832, defaultHeight: 1216 });
    expect(ref.refWeight).toBe(REF_WEIGHT_DEFAULT);
    expect(ref.refStart).toBe(REF_START_DEFAULT);
    expect(ref.refEnd).toBe(REF_END_DEFAULT);
    expect(ref.refWeightType).toBe(REF_WEIGHT_TYPE_DEFAULT);
  });
});

describe('candidate staging — candidates never land in public/art', () => {
  const publicArtOut = resolve('public/art/characters/lulu/attack.png');
  const conceptOut = resolve('docs/concepts/art4/lulu/attack/cand-1.png');

  it('redirects a public/art/ target to the default candidateDir without --install', () => {
    const { outPath, redirected } = resolveCandidateOutPath(publicArtOut, {
      name: 'lulu',
      pose: 'attack',
      candidateDirArg: undefined,
      install: false,
    });
    expect(redirected).toBe(true);
    const norm = outPath.split(/[\\/]/).join('/');
    expect(norm).toContain('docs/concepts/_candidates/lulu/attack/');
    expect(norm.endsWith('attack.png')).toBe(true);
    expect(isUnderPublicArt(outPath)).toBe(false);
  });

  it('honours an explicit --candidateDir', () => {
    const { outPath, redirected } = resolveCandidateOutPath(publicArtOut, {
      name: 'lulu',
      pose: 'attack',
      candidateDirArg: 'docs/concepts/_scratch',
      install: false,
    });
    expect(redirected).toBe(true);
    const norm = outPath.split(/[\\/]/).join('/');
    expect(norm).toContain('docs/concepts/_scratch/');
  });

  it('writes straight through with --install', () => {
    const { outPath, redirected } = resolveCandidateOutPath(publicArtOut, {
      name: 'lulu',
      pose: 'attack',
      candidateDirArg: undefined,
      install: true,
    });
    expect(redirected).toBe(false);
    expect(outPath).toBe(publicArtOut);
  });

  it('leaves an --out that is already outside public/art/ alone', () => {
    const { outPath, redirected } = resolveCandidateOutPath(conceptOut, {
      name: 'lulu',
      pose: 'attack',
      candidateDirArg: undefined,
      install: false,
    });
    expect(redirected).toBe(false);
    expect(outPath).toBe(conceptOut);
  });

  it('rawPathFor never lands under public/art/, even for an installed write', () => {
    const raw = rawPathFor(publicArtOut);
    expect(isUnderPublicArt(raw)).toBe(false);
    const norm = raw.split(/[\\/]/).join('/');
    expect(norm).toContain('docs/concepts/_candidates/_raw/');
    expect(norm.endsWith('.raw.png')).toBe(true);
  });

  it('rawPathFor leaves a non-public/art path as a plain sibling .raw.png', () => {
    const raw = rawPathFor(conceptOut);
    expect(raw).toBe(conceptOut.replace(/\.png$/i, '.raw.png'));
  });

  it('isUnderPublicArt recognises public/art/ regardless of separator', () => {
    expect(isUnderPublicArt(resolve('public/art/backdrops/gagazet.png'))).toBe(true);
    expect(isUnderPublicArt(resolve('docs/concepts/art4/whatever.png'))).toBe(false);
  });
});
