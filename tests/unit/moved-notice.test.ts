// @vitest-environment jsdom
/**
 * The "we've moved" note on the title screen of the OLD address (`src/app/screens/frontend/movedNotice.ts`),
 * added with the Cloudflare switch of 2026-10-04. Both games: the title is the front door to FFX and FFX-2.
 *
 * What is pinned: the note shows only for exactly `baileypillon.github.io` and never for the new address, its
 * `www`, the workers.dev backup and preview addresses, localhost or a lookalike; it is a plain link to the new
 * address with the words the driver gave; it sits outside the plate's `data-action="confirm"` element, so a click on
 * it cannot also start the game; and its stylesheet keeps to the title card's tokens and the readability floor.
 */

import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import {
  MOVED_NOTICE_TEXT,
  NEW_ADDRESS,
  OLD_ADDRESS_HOST,
  movedNoticeHtml,
  onOldAddress,
} from '../../src/app/screens/frontend/movedNotice.ts';
import { titleMarkup } from '../../src/app/screens/frontend/titleMarkup.ts';
import { LIVE_URL } from '../../tools/deploy-host.mjs';

const REPO = resolve(__dirname, '..', '..');

function parse(html: string): HTMLElement {
  const root = document.createElement('div');
  root.innerHTML = html;
  return root;
}

describe('onOldAddress: only the old GitHub Pages host', () => {
  it('is true for baileypillon.github.io, in any case and with a trailing dot', () => {
    expect(OLD_ADDRESS_HOST).toBe('baileypillon.github.io');
    expect(onOldAddress('baileypillon.github.io')).toBe(true);
    expect(onOldAddress('BaileyPillon.GitHub.io')).toBe(true);
    expect(onOldAddress(' baileypillon.github.io ')).toBe(true);
    expect(onOldAddress('baileypillon.github.io.')).toBe(true);
  });

  it('is false for the new address, its www, the Cloudflare backup and preview addresses, and localhost', () => {
    for (const host of [
      'echoesofspira.com', 'www.echoesofspira.com', 'echoes-of-spira.baileypillon.workers.dev', 'echoes-of-spira-preview.baileypillon.workers.dev',
      'echoes-of-spira.pages.dev', 'localhost', '127.0.0.1', '[::1]', '::1', 'app.localhost', 'dev.test',
    ]) {
      expect(onOldAddress(host), host).toBe(false);
    }
  });

  it('is false for lookalikes, other github.io sites, and nothing at all', () => {
    for (const host of [
      'baileypillon.github.io.evil.example', 'evil-baileypillon.github.io', 'xbaileypillon.github.io', 'sub.baileypillon.github.io',
      'someoneelse.github.io', 'github.io', 'baileypillon.github.com', 'baileypillon', 'baileypillon.github.io:8080', '',
    ]) {
      expect(onOldAddress(host), host).toBe(false);
    }
    expect(onOldAddress(undefined)).toBe(false);
    expect(onOldAddress(null)).toBe(false);
  });
});

describe('movedNoticeHtml: one line and a link, on the old address only', () => {
  it('is empty everywhere else', () => {
    for (const host of ['echoesofspira.com', 'www.echoesofspira.com', 'echoes-of-spira-preview.baileypillon.workers.dev', 'localhost', '127.0.0.1', '', undefined, null]) {
      expect(movedNoticeHtml(host)).toBe('');
    }
  });

  it('is empty on this page too, which jsdom serves from localhost', () => {
    expect(window.location.hostname).toBe('localhost');
    expect(movedNoticeHtml()).toBe('');
  });

  it('links to the new address, in the driver\'s words', () => {
    expect(NEW_ADDRESS).toBe(LIVE_URL);
    expect(MOVED_NOTICE_TEXT).toEqual({ lead: 'Echoes of Spira has moved to', domain: 'echoesofspira.com', saves: 'Saves made here stay here' });
    const link = parse(movedNoticeHtml('baileypillon.github.io')).querySelector('a');
    expect(link?.getAttribute('href')).toBe('https://echoesofspira.com/');
    expect(link?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Echoes of Spira has moved to echoesofspira.com Saves made here stay here');
    expect(link?.querySelector('b')?.textContent).toBe('echoesofspira.com');
    expect(link?.hasAttribute('data-moved-notice')).toBe(true);
  });

  it('is a plain, pointer-and-touch link: no new tab, out of the tab order, no script beyond dropping focus', () => {
    const link = parse(movedNoticeHtml('baileypillon.github.io')).querySelector('a') as HTMLAnchorElement;
    expect(link.getAttribute('target')).toBeNull();
    expect(link.getAttribute('tabindex')).toBe('-1');
    expect(link.classList.contains('ui-interactive')).toBe(true);
    expect(link.getAttribute('onclick')).toBe('this.blur()');
    expect(link.getAttributeNames().filter((n) => n.startsWith('on'))).toEqual(['onclick']);
    expect(movedNoticeHtml('baileypillon.github.io')).not.toMatch(/<script|javascript:/i);
  });

  it('has no player-facing text from before the rename', () => {
    const html = movedNoticeHtml('baileypillon.github.io');
    expect(html.replace(/<[^>]*>/g, ' ')).not.toMatch(/pyrefly|reprise/i);
  });
});

describe('the note on the title card', () => {
  const OLD = { briefingChip: false, host: 'baileypillon.github.io' } as const;

  it('is drawn on the old address and absent on every other host, the rest of the card unchanged', () => {
    const withNote = titleMarkup(OLD);
    expect(withNote).toContain('data-moved-notice');
    for (const host of ['echoesofspira.com', 'www.echoesofspira.com', 'echoes-of-spira.baileypillon.workers.dev', 'localhost', '127.0.0.1']) {
      expect(titleMarkup({ briefingChip: false, host })).not.toContain('data-moved-notice');
    }
    // Take the note out and what is left is the card every other host gets.
    const note = movedNoticeHtml('baileypillon.github.io');
    expect(withNote.replace(note, '')).toBe(titleMarkup({ briefingChip: false, host: 'localhost' }));
    // And on a page that names no host it is this page's own (jsdom: localhost): none.
    expect(titleMarkup({ briefingChip: false })).not.toContain('data-moved-notice');
  });

  it('sits OUTSIDE the plate\'s confirm element, so a click on it cannot also start the game', () => {
    const root = parse(titleMarkup(OLD));
    const note = root.querySelector('[data-moved-notice]') as HTMLElement;
    const plate = root.querySelector('.fe-title__tap') as HTMLElement;
    expect(note).not.toBeNull();
    expect(plate.contains(note)).toBe(false);
    // `Input.onClick` resolves a click through `closest('[data-action]')`; for the note that finds nothing.
    expect(note.closest('[data-action]')).toBeNull();
    expect(note.querySelector('[data-action]')).toBeNull();
    // while the rest of the card still starts the game from anywhere on the plate, as before
    expect(plate.getAttribute('data-action')).toBe('confirm');
  });

  it('keeps the title\'s own words and its single link', () => {
    const root = parse(titleMarkup(OLD));
    expect(root.querySelectorAll('a')).toHaveLength(1);
    expect(root.querySelector('.fe-title__name')?.textContent).toBe('Echoes');
    expect(root.querySelector('.fe-title__eyebrow')?.textContent).toBe('An unofficial fan tribute');
  });
});

describe('the note\'s stylesheet', () => {
  const css = readFileSync(join(REPO, 'src', 'app', 'screens', 'frontend', 'moved-notice.css'), 'utf8');

  it('uses the Ink & Gold tokens and the title card\'s own scale, and invents no colour', () => {
    expect(css).toContain('var(--ig-gold)');
    expect(css).toContain('var(--ig-ink-chip');
    expect(css).toContain('var(--ig-font-display)');
    expect(css).toContain('var(--fe-k)');
    expect(css.replace(/\/\*[\s\S]*?\*\//g, '')).not.toMatch(/#[0-9a-f]{3,8}\b/i);
  });

  it('keeps every font size at the readability floor (CHK-003), desktop and phone', () => {
    const sizes = [...css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]);
    expect(sizes.length).toBeGreaterThan(0);
    for (const size of sizes) expect(size).toContain('var(--fe-fs-floor)');
  });

  it('is laid out for the phone as well, in the same query frontend.css uses to re-lay the title', () => {
    const query = '@media (max-width: 760px), (max-aspect-ratio: 3 / 4)';
    expect(css).toContain(query);
    expect(readFileSync(join(REPO, 'src', 'app', 'screens', 'frontend', 'frontend.css'), 'utf8')).toContain(query);
  });

  it('is imported by the module that draws the note, which the title markup imports', () => {
    const module = readFileSync(join(REPO, 'src', 'app', 'screens', 'frontend', 'movedNotice.ts'), 'utf8');
    expect(module).toContain("import './moved-notice.css';");
    expect(readFileSync(join(REPO, 'src', 'app', 'screens', 'frontend', 'titleMarkup.ts'), 'utf8')).toContain("from './movedNotice.ts'");
  });
});
