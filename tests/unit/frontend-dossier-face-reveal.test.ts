// @vitest-environment jsdom
/**
 * `src/app/screens/frontend/dossierFaceReveal.ts` — PR-0065's fix for the
 * chapter-select dossier painting its letter fallback before the real
 * portrait has decoded.
 *
 * jsdom never fires a real decode, so these dispatch the same `load`/`error`
 * events a browser would once a network image resolves, and check the one
 * contract this module promises: the tile stays invisible until every `img`
 * inside it has settled, one way or the other.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { installDossierFaceReveal } from '../../src/app/screens/frontend/dossierFaceReveal.ts';

function makeTile(srcs: string[]): HTMLElement {
  const tile = document.createElement('div');
  tile.className = 'fe-party__face';
  for (const src of srcs) {
    const img = document.createElement('img');
    img.src = src;
    tile.appendChild(img);
  }
  const span = document.createElement('span');
  span.textContent = 'Y';
  tile.appendChild(span);
  return tile;
}

function opacityOf(el: HTMLElement): string {
  return el.style.opacity;
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

describe('installDossierFaceReveal', () => {
  let root: HTMLElement;

  beforeEach(() => {
    root = document.createElement('div');
    document.body.appendChild(root);
    installDossierFaceReveal();
  });

  afterEach(() => {
    root.remove();
  });

  it('hides a newly-added .fe-party__face tile immediately', async () => {
    const tile = makeTile(['/art/portraits/yuna.png']);
    root.appendChild(tile);
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('0');
  });

  it('reveals the tile once its image loads', async () => {
    const tile = makeTile(['/art/portraits/yuna.png']);
    root.appendChild(tile);
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('0');

    tile.querySelector('img')!.dispatchEvent(new Event('load'));
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('1');
  });

  it('reveals the tile on an image error too, rather than hiding it forever', async () => {
    const tile = makeTile(['/art/portraits/missing.png']);
    root.appendChild(tile);
    await flushMicrotasks();

    tile.querySelector('img')!.dispatchEvent(new Event('error'));
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('1');
  });

  it('waits for every layered image, not just the first', async () => {
    const tile = makeTile(['/art/characters/paine-warrior/idle.png', '/art/portraits/paine.png']);
    root.appendChild(tile);
    await flushMicrotasks();

    const [body, portrait] = Array.from(tile.querySelectorAll('img'));
    body!.dispatchEvent(new Event('load'));
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('0');

    portrait!.dispatchEvent(new Event('load'));
    await flushMicrotasks();
    expect(opacityOf(tile)).toBe('1');
  });

  it('reveals immediately when the tile has no image at all', async () => {
    const tile = document.createElement('div');
    tile.className = 'fe-party__face';
    root.appendChild(tile);
    await flushMicrotasks();
    expect(tile.getAttribute('style')).toBeNull();
  });

  it('only touches its own class, never a sibling element', async () => {
    const other = document.createElement('div');
    other.className = 'fe-party__name';
    root.appendChild(other);
    await flushMicrotasks();
    expect(other.style.opacity).toBe('');
  });
});
