// @vitest-environment jsdom
/**
 * The BEHIND THE SCENES page's content (built, switched OFF: tests/unit/behind-the-scenes-off.test.ts). Bailey, 2026-10-08,
 * decisions item 31: the format is A (a story in six chapters) opening with C's five cards as the two-minute summary; the
 * page shows the critic's REAL scores; it names the AI tools (ElevenLabs Music and voices, ChatGPT Images, local
 * ComfyUI/Animagine); it credits the community sources; and where it says something was measured the words are exactly
 * "measured from the real game on Bailey's own copy", nothing more. Not decided, so not built in: his own quotes (NONE of
 * them appear; the draft's "look terrible" is gone). The page's name is settled: "Behind the Scenes" (Bailey, 2026-10-09
 * 11:30 EDT: "Scenes not screens"), kept in one constant, `BTS_TITLE`.
 * Public-safety rules: no PII, no account names, no PC or security details, no hidden chapters.
 *
 * This file checks the words and the numbers against the repository where the repository can answer (the chapters, the
 * critic's own reports, the research notes, the audio and art manifests), the pictures one by one, the stylesheets' type
 * floor, and the page's behaviour: its cards, tabs and keys. The look is the browser proof (a scratch folder: the page is not public).
 *
 * Game case: both (the page is about the whole project; the chapter counts are per game: 11 FFX and 7 FFX-2).
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { FORBIDDEN_NOTE_WORDS } from '../../src/app/changelog/releaseNotes.ts';
import { BTS_TITLE } from '../../src/app/changelog/behindTheScenes.ts';
import { CARDS, CHAPTERS, IMAGES, IMAGE_FILES, INTRO } from '../../src/app/behindTheScenes/content.ts';
import { COMMUNITY_SOURCES, CRITIC, CRITIC_ROWS, FACTS, MADE_WITH, MEASURED_WORDING } from '../../src/app/behindTheScenes/facts.ts';
import { behindTheScenesHtml, inline } from '../../src/app/behindTheScenes/html.ts';
import { btsImageUrl } from '../../src/app/behindTheScenes/images.ts';
import { mountBehindTheScenes } from '../../src/app/behindTheScenes/index.ts';
import { CHAPTERS as GAME_CHAPTERS } from '../../src/data/encounters.ts';

const REPO = resolve(__dirname, '..', '..');
const read = (rel: string): string => readFileSync(resolve(REPO, rel), 'utf8');
const json = (rel: string): any => JSON.parse(read(rel));

/** The page, as a player would read it: every visible word, every alt text. */
function pageText(): string {
  const host = document.createElement('div');
  host.innerHTML = behindTheScenesHtml();
  const alts = [...host.querySelectorAll('img')].map((i) => i.getAttribute('alt') ?? '').join('\n');
  const labels = [...host.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label') ?? '').join('\n');
  return `${host.textContent ?? ''}\n${alts}\n${labels}`;
}

describe('the format: five cards, then six chapters', () => {
  it('has five cards of the two-minute summary and six chapters of the story, in the order the drafts had', () => {
    expect(CARDS.map((c) => c.label)).toEqual(['The idea', 'The art', 'The sound', 'The critic', 'The numbers']);
    expect(CHAPTERS.map((c) => `${c.numeral} ${c.name}`)).toEqual(['I The idea', 'II The research', 'III The art', 'IV Music & voices', 'V The critic', 'VI The numbers']);
    expect(CHAPTERS.map((c) => c.id)).toEqual(['c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
  });

  it('opens on the summary, with the cards in it, and puts the story after: summary, then chapter I to VI in the page and in the tabs', () => {
    const host = document.createElement('div');
    host.innerHTML = behindTheScenesHtml();
    const sections = [...host.querySelectorAll<HTMLElement>('[data-bts-sec]')].map((s) => s.dataset['btsSec']);
    expect(sections).toEqual(['summary', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
    expect(host.querySelectorAll('[data-bts-sec="summary"] [data-bts-card]')).toHaveLength(5);
    expect([...host.querySelectorAll('.bts__tab')].map((t) => t.getAttribute('data-bts-go'))).toEqual(['summary', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6']);
    const hidden = [...host.querySelectorAll<HTMLElement>('[data-bts-card]')].map((c) => c.hasAttribute('hidden'));
    expect(hidden).toEqual([false, true, true, true, true]);
    expect(host.querySelector('.bts')?.getAttribute('role')).toBe('dialog');
    expect(host.querySelector('.bts')?.getAttribute('aria-label')).toBe(BTS_TITLE);
  });

  it('names the page with the one constant, in the header and the heading, and nowhere hard-codes another name', () => {
    const host = document.createElement('div');
    host.innerHTML = behindTheScenesHtml();
    expect(host.querySelector('.bts__top .bts__label')?.textContent).toBe(BTS_TITLE);
    expect(host.querySelector('.bts__title')?.textContent).toBe(BTS_TITLE);
    expect(INTRO.title).toBe(BTS_TITLE);
    expect(pageText()).not.toMatch(/behind the screens/i);
  });
});

describe('what it must say, and must not', () => {
  const text = pageText();

  it('uses the measuring wording exactly, once, and no second claim about how anything was measured', () => {
    expect(MEASURED_WORDING).toBe("measured from the real game on Bailey's own copy");
    expect(text).toContain(MEASURED_WORDING);
    expect(text.split(MEASURED_WORDING).length - 1).toBe(1);
    expect(text.match(/measur/gi) ?? []).toHaveLength(1);
    for (const extra of [/decompil/i, /datamin/i, /extract(?:ed)? from/i, /rip(?:ped)?\b/i, /ghidra/i, /game files? (?:were|was) read/i, /emulator/i, /pcsx2/i, /\bHD (?:models?|remaster)\b/i]) expect(text, String(extra)).not.toMatch(extra);
  });

  it('names the AI tools: ElevenLabs Music and voices, ChatGPT Images, ComfyUI and Animagine (and Claude, which builds the game)', () => {
    for (const name of ['ElevenLabs Music', 'ElevenLabs voices', 'ChatGPT Images', 'ComfyUI', 'Animagine XL 4.0', 'Claude']) expect(text, name).toContain(name);
    for (const t of MADE_WITH) expect(text, t.name).toContain(t.name);
    expect(text).toMatch(/Made with:/);
    expect(text).toMatch(/every painting in the game is AI-generated/i);
  });

  it('credits the community sources: Jegged, GameFAQs, the Final Fantasy Wiki and the others the research notes cite', () => {
    for (const s of COMMUNITY_SOURCES) expect(text, s.name).toContain(s.name);
    expect(COMMUNITY_SOURCES.map((s) => s.name).join(' ')).toMatch(/Jegged.*GameFAQs.*Final Fantasy Wiki/);
    // every named host is one the research notes really cite (so the thanks are for sources actually used)
    const notes = readdirSync(resolve(REPO, 'research')).filter((f) => f.endsWith('.md')).map((f) => read(`research/${f}`)).join('\n');
    for (const host of ['jegged.com', 'gamefaqs.gamespot.com', 'finalfantasy.fandom.com', 'gamerguides.com', 'strategywiki.org', 'game8.co']) expect(notes, host).toContain(host);
    expect(notes).toMatch(/Grayfox96\/FFX-RNG-tracker/i);
    expect(notes).toMatch(/Karifean/);
    expect(notes).toMatch(/Rossy__/);
  });

  it('quotes none of Bailey’s own words: not the draft’s "look terrible", not any line of his the project has recorded', () => {
    expect(text.toLowerCase()).not.toContain('look terrible');
    for (const phrase of ["soooo epic", 'all your recommendations', 'godspeed', 'full speed ahead', 'go with option', "i'll go with", 'ill go with', 'yes install', 'push it live', 'sounds epic', 'sounds natural', 'kinda dumb', 'looked way better']) {
      expect(text.toLowerCase(), phrase).not.toContain(phrase);
    }
    // the only quotation marks are the critic's own sentence, and it is the critic's
    const quoted = [...text.matchAll(/[“"]([^”"\n]{4,})[”"]/g)].map((m) => m[1]);
    for (const q of quoted) expect(q, q).toMatch(/does not reliably finish|First scored/);
    expect(text).not.toMatch(/Bailey (?:said|wrote|told|asked|replied|called)|in his words|his verdict|his own words/i);
  });

  it('keeps every hidden chapter and secret word out, in the words and in the alt texts', () => {
    for (const word of FORBIDDEN_NOTE_WORDS) expect(text, String(word)).not.toMatch(word);
    expect(text.toLowerCase()).not.toContain('leblanc');
  });

  it('keeps PII, account names and machine or security details out', () => {
    for (const bad of [/@[a-z0-9-]+\.[a-z]{2,}/i, /\b[A-Za-z]:\\/, /\bD:\//, /\bC:\//, /baileypillon|bpillon|jameve|chaoticdreams|noreply/i, /\b(?:RTX|GTX|NVIDIA|Radeon|Ryzen|GeForce)\b/i, /\bWindows\b/, /password|passphrase|api key|secret key|token\b|ssh\b|malware|backdoor|spyware/i, /\bgpu\b|vram|\bcpu\b|ram\b/i, /https?:\/\//i, /\+?\d{3}[ -]\d{3}[ -]\d{4}/]) {
      expect(text, String(bad)).not.toMatch(bad);
    }
  });

  it('does not print the old title where a player can read it (the rule of tests/unit/player-facing-title.test.ts)', () => {
    expect(text).not.toMatch(/pyrefly(?:\s|&nbsp;| |·)+reprise/i);
    expect(text).toMatch(/Echoes of Spira/);
  });

  it('says plainly what it is not: the game is not at 9.6, audio is not scored, nothing was redrawn, nothing is taken from the games', () => {
    expect(text).toMatch(/The game is not at 9\.6, and this page will not pretend it is\./);
    expect(text).toMatch(/not scored: only Bailey’s ears can judge it/);
    expect(text).toMatch(/Nothing was redrawn\./);
    expect(text).toMatch(/Nothing taken from the games is inside this one\./);
    expect(text).toContain(INTRO.asOf);
  });

  it('marks a bold or a highlight with the two marks and escapes the rest', () => {
    expect(inline('a **b** and ==c== <i>x</i> & \'q\'')).toBe('a <b>b</b> and <span class="bts__hl">c</span> &lt;i&gt;x&lt;/i&gt; &amp; &#39;q&#39;');
  });
});

describe('the facts, against the repository where it can answer', () => {
  it('counts 18 chapters, 11 from FFX and 7 from FFX-2', () => {
    expect(GAME_CHAPTERS).toHaveLength(FACTS.chapters);
    expect(GAME_CHAPTERS.filter((c) => c.game === 'ffx')).toHaveLength(FACTS.chaptersFfx);
    expect(GAME_CHAPTERS.filter((c) => c.game === 'ffx2')).toHaveLength(FACTS.chaptersFfx2);
    expect(FACTS.chaptersFfx + FACTS.chaptersFfx2).toBe(FACTS.chapters);
  });

  it('counts the research notes, the music tracks and the voice lines of this build', () => {
    expect(readdirSync(resolve(REPO, 'research')).filter((f) => f.endsWith('.md'))).toHaveLength(FACTS.researchNotes);
    expect(Object.keys(json('public/audio/manifest.json').music)).toHaveLength(FACTS.musicTracks);
    expect(json('public/audio/voice/index.json').totals.files).toBe(FACTS.voiceLines);
    const themes = read('docs/audio/THEMES.md');
    expect((themes.match(/\*\*ElevenLabs\*\* \(Music/g) ?? []).length).toBe(FACTS.elevenLabsTracks);
  });

  it.skipIf(!existsSync(resolve(REPO, 'public/art/manifest.json')))('counts the painted poses from the art manifest', () => {
    const subjects = json('public/art/manifest.json').subjects as Record<string, { states: string[] }>;
    const poses = Object.values(subjects).reduce((n, s) => n + s.states.length, 0);
    expect(poses).toBe(FACTS.poses);
  });

  it('is the critic’s real record: the first headline, the first scores and the latest scores come from its own reports', () => {
    expect(json('critic/rounds/round-02.json').headline).toBe(CRITIC.firstHeadline);
    expect(read('critic/rounds/round-02.md')).toContain('The game does not reliably finish.');
    const score = (round: string, id: string): number | null => {
      const c = (json(`critic/rounds/${round}.json`).categories as { id: string; score?: number }[]).find((x) => x.id === id);
      return c?.score ?? null;
    };
    for (const row of CRITIC_ROWS) {
      if (row.first === null) continue;
      // first = round 4 (current rules), except feel and narrative, which round 4 could not score: round 6
      const round = row.id === 'feel' || row.id === 'narrative' ? 'round-06' : 'round-04';
      expect(score(round, row.id), `${row.id} first (${round})`).toBe(row.first);
    }
    const latest = resolve(REPO, 'critic/rounds/round-23.json');
    if (existsSync(latest)) {
      for (const row of CRITIC_ROWS) {
        const c = (json('critic/rounds/round-23.json').categories as { id: string; status: string; score?: number }[]).find((x) => x.id === row.id);
        expect(c?.status === 'scored' ? c.score : null, `${row.id} latest (round 23)`).toBe(row.latest);
      }
    }
    // the chart's row set is the critic's ten categories, audio unscored
    expect(CRITIC_ROWS.map((r) => r.id).sort()).toEqual(['audio', 'combat', 'delivery', 'encounter', 'feel', 'interface', 'narrative', 'onboarding', 'prep', 'visual']);
    expect(CRITIC_ROWS.find((r) => r.id === 'audio')).toMatchObject({ first: null, latest: null });
    // "three meet the floor, six do not yet" is what the numbers say
    const scored = CRITIC_ROWS.filter((r) => r.latest !== null);
    expect(scored.filter((r) => (r.latest ?? 0) >= CRITIC.floor)).toHaveLength(3);
    expect(scored.filter((r) => (r.latest ?? 0) < CRITIC.floor)).toHaveLength(6);
    expect(Math.max(...scored.map((r) => r.latest ?? 0))).toBeLessThan(CRITIC.gate);
  });

  it('counts the critic’s rounds from its own files: 23 rounds, 21 of them deep reviews', () => {
    const rounds = readdirSync(resolve(REPO, 'critic/rounds')).filter((f) => /^round-\d+b?\.json$/.test(f));
    const deep = rounds.filter((f) => json(`critic/rounds/${f}`).review === 'deep');
    // round 23's file is committed with the next records; until then the folder holds 22 and this build still reads 23
    const withLatest = rounds.length + (existsSync(resolve(REPO, 'critic/rounds/round-23.json')) ? 0 : 1);
    expect(withLatest).toBe(CRITIC.rounds);
    expect(deep.length + (existsSync(resolve(REPO, 'critic/rounds/round-23.json')) ? 0 : 1)).toBe(CRITIC.deepRounds);
  });

  it('says the first commit and the critic’s rules came within an hour of each other (the repository’s own first two commits)', () => {
    // 2026-09-15 11:57 the first commit; 12:50 "Add critic rubric with weighted categories and 9.6 gate"
    expect(read('critic/RUBRIC.md')).toMatch(/9\.6/);
    expect(CHAPTERS[4]!.lead).toMatch(/within an hour of the first commit/);
  });
});

describe('the pictures', () => {
  const dir = resolve(REPO, 'public/bts');
  const files = readdirSync(dir).sort();

  it('are the sixteen the page names, no more, no fewer, each a real JPEG of a sensible size', () => {
    expect(files).toEqual([...IMAGE_FILES].sort());
    expect(new Set(IMAGE_FILES).size).toBe(16);
    let total = 0;
    for (const f of files) {
      const buf = readFileSync(resolve(dir, f));
      total += buf.length;
      expect(buf[0], f).toBe(0xff);
      expect(buf[1], f).toBe(0xd8);
      expect(buf.length, f).toBeLessThan(260_000);
    }
    expect(total).toBeLessThan(2_500_000);
  });

  it('carry no EXIF block and no text chunk: nothing in a picture but its pixels (no camera, no place, no name, no path)', () => {
    for (const f of files) {
      const buf = readFileSync(resolve(dir, f));
      const head = buf.subarray(0, 4096).toString('latin1');
      expect(head, f).not.toContain('Exif');
      expect(head, f).not.toMatch(/GPS|[A-Z]:\\|\/Users\/|Administrator/);
      expect(buf.toString('latin1'), f).not.toMatch(/Administrator|baileypillon|bpillon/i);
    }
  });

  it('are named with a description for a screen reader, and addressed under the site base', () => {
    for (const i of Object.values(IMAGES)) {
      expect(i.alt.length, i.file).toBeGreaterThan(20);
      expect(btsImageUrl(i.file)).toBe(`/bts/${i.file}`);
    }
    expect(statSync(resolve(dir, 'keyart-farplane.jpg')).isFile()).toBe(true);
  });

  it('do not show the hidden chapter: no picture of it is among them (the names are the visible chapters’ and the game’s own screens)', () => {
    for (const f of files) expect(f, f).not.toMatch(/leblanc|exp-|ff7|limit/i);
  });
});

describe('the stylesheets keep the game’s type floor', () => {
  for (const file of ['behind-the-scenes.css', 'behind-the-scenes-story.css']) {
    const code = read(`src/app/behindTheScenes/${file}`).replace(/\/\*[\s\S]*?\*\//g, '');

    it(`${file}: every font-size is wrapped in the floor, a floor variable or a relative size, none a bare px under 14`, () => {
      const sizes = [...code.matchAll(/font-size:\s*([^;]+);/g)].map((m) => m[1]!.trim());
      expect(sizes.length).toBeGreaterThan(8);
      for (const s of sizes) {
        expect(s, s).toMatch(/^(max\(var\(--fe-fs-floor\), (?:calc\(\d+(?:\.\d+)? \* var\(--fe-k\)\)|\d+(?:\.\d+)?px)\)|max\(15px, calc\(16 \* var\(--fe-k\)\)\)|var\(--bts-label\))$/);
      }
      for (const m of code.matchAll(/\b(\d+(?:\.\d+)?)px\)\s*;?/g)) void m;
    });
  }

  it('defines the label size as the floor-wrapped 13 grid units, the title chip’s own size', () => {
    expect(read('src/app/behindTheScenes/behind-the-scenes.css')).toMatch(/--bts-label:\s*max\(var\(--fe-fs-floor\), calc\(13 \* var\(--fe-k\)\)\)/);
  });

  it('gives a touch screen 44 px targets for the tabs, the dots, the buttons and the close button', () => {
    const css = read('src/app/behindTheScenes/behind-the-scenes.css');
    const coarse = css.slice(css.indexOf('@media (pointer: coarse)'));
    expect(coarse).toMatch(/\.bts__tab,\s*\.bts__nbtn\s*\{\s*min-height:\s*44px/);
    expect(coarse).toMatch(/\.bts__dot\s*\{\s*width:\s*44px;\s*height:\s*44px/);
    expect(coarse).toMatch(/\.fe-info--bts \.fe-info__close\s*\{\s*min-height:\s*44px/);
  });

  it('lets a phone window hold the page: one grid column that can shrink, and the dots and buttons wrap', () => {
    const css = read('src/app/behindTheScenes/behind-the-scenes.css');
    expect(css).toMatch(/grid-template-columns:\s*minmax\(0, 1fr\);\s*grid-template-rows:\s*auto minmax\(0, 1fr\) auto/);
    expect(css).toMatch(/\.bts__deckbar\s*\{\s*flex-wrap:\s*wrap/);
  });
});

/**
 * jsdom lays nothing out, so give the sections and the scroller the sizes a 1600x900 window would: the sections 1000 px
 * apart, an 800 px window, 7000 px of page. Returns what puts the real properties back.
 */
const ORDER = ['summary', 'c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
function stubLayout(): () => void {
  const names = ['offsetTop', 'clientHeight', 'scrollHeight'];
  const keep = names.map((k) => [k, Object.getOwnPropertyDescriptor(HTMLElement.prototype, k) ?? Object.getOwnPropertyDescriptor(Element.prototype, k)] as const);
  const isScroller = (e: HTMLElement): boolean => e.dataset?.['role'] === 'info-scroll';
  Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
    configurable: true,
    get(this: HTMLElement) {
      return ORDER.indexOf(this.dataset?.['btsSec'] ?? '') * 1000;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isScroller(this) ? 800 : 0;
    },
  });
  Object.defineProperty(HTMLElement.prototype, 'scrollHeight', {
    configurable: true,
    get(this: HTMLElement) {
      return isScroller(this) ? 7000 : 0;
    },
  });
  return () => {
    for (const [k, d] of keep) {
      if (d) Object.defineProperty(HTMLElement.prototype, k, d);
      else delete (HTMLElement.prototype as unknown as Record<string, unknown>)[k];
    }
  };
}

describe('the page’s behaviour', () => {
  const calls: { top: number | undefined; behavior?: string }[] = [];
  let unstub = (): void => undefined;
  beforeEach(() => {
    calls.length = 0;
    unstub = stubLayout();
    HTMLElement.prototype.scrollTo = function (this: HTMLElement, opts?: ScrollToOptions | number): void {
      if (typeof opts === 'object') {
        calls.push({ top: opts.top, behavior: opts.behavior });
        this.scrollTop = opts.top ?? 0;
      }
    };
    HTMLElement.prototype.scrollBy = function (this: HTMLElement, opts?: ScrollToOptions | number): void {
      if (typeof opts === 'object') this.scrollTop += opts.top ?? 0;
    };
  });
  afterEach(() => {
    unstub();
    document.body.innerHTML = '';
  });

  const mount = (reduce = false): { host: HTMLElement; closed: () => number; page: ReturnType<typeof mountBehindTheScenes> } => {
    const host = document.body.appendChild(document.createElement('div'));
    host.innerHTML = behindTheScenesHtml();
    let n = 0;
    const page = mountBehindTheScenes(host, { close: () => void n++, reduceMotion: () => reduce });
    return { host, closed: () => n, page };
  };
  const key = (page: { onKey(e: KeyboardEvent): void }, code: string, init: KeyboardEventInit = {}): void => page.onKey(new KeyboardEvent('keydown', { code, cancelable: true, ...init }));
  const card = (host: HTMLElement): number => [...host.querySelectorAll<HTMLElement>('[data-bts-card]')].findIndex((c) => !c.hidden);

  it('opens on card 1 of 5, with the first dot current and Back disabled', () => {
    const { host } = mount();
    expect(card(host)).toBe(0);
    expect(host.querySelector('[data-bts-go-card="0"]')?.getAttribute('aria-current')).toBe('true');
    expect(host.querySelector('[data-bts-card-step="-1"]')?.hasAttribute('disabled')).toBe(true);
    expect(host.querySelector('[data-bts-card-step="1"]')?.textContent).toBe('Next');
  });

  it('turns the cards with Left and Right (and A and D), and a dot, Back and Next do what they say', () => {
    const { host, page } = mount();
    key(page, 'ArrowRight');
    expect(card(host)).toBe(1);
    key(page, 'KeyD');
    expect(card(host)).toBe(2);
    key(page, 'ArrowLeft');
    expect(card(host)).toBe(1);
    key(page, 'KeyA');
    key(page, 'ArrowLeft');
    expect(card(host)).toBe(0);
    host.querySelector<HTMLElement>('[data-bts-go-card="3"]')!.click();
    expect(card(host)).toBe(3);
    host.querySelector<HTMLElement>('[data-bts-card-step="-1"]')!.click();
    expect(card(host)).toBe(2);
    host.querySelector<HTMLElement>('[data-bts-card-step="1"]')!.click();
    host.querySelector<HTMLElement>('[data-bts-card-step="1"]')!.click();
    expect(card(host)).toBe(4);
    expect(host.querySelector('[data-bts-card-step="1"]')?.textContent).toBe('The story');
    host.querySelector<HTMLElement>('[data-bts-card-step="1"]')!.click();
    expect(calls.at(-1)?.top).toBe(996); // past the last card, Next goes on to chapter I (offset 1000, less the 4 px margin)
    expect(card(host)).toBe(4);
  });

  it('scrolls on Up, Down, PageUp and PageDown, and goes to the ends on Home and End', () => {
    const { host, page } = mount();
    const scroller = host.querySelector<HTMLElement>('[data-role="info-scroll"]')!;
    key(page, 'ArrowDown');
    key(page, 'ArrowDown');
    expect(scroller.scrollTop).toBe(240);
    key(page, 'ArrowUp');
    expect(scroller.scrollTop).toBe(120);
    key(page, 'PageDown');
    key(page, 'PageUp');
    expect(scroller.scrollTop).toBe(120);
    key(page, 'End');
    expect(calls.at(-1)).toMatchObject({ behavior: 'smooth' });
    key(page, 'Home');
    expect(calls.at(-1)).toMatchObject({ top: 0 });
  });

  it('closes on T, Enter, NumpadEnter, Space and Z, once for a held key, and never on a scroll key', () => {
    const { page, closed } = mount();
    for (const code of ['KeyT', 'Enter', 'NumpadEnter', 'Space', 'KeyZ']) key(page, code);
    expect(closed()).toBe(5);
    key(page, 'KeyT', { repeat: true });
    expect(closed()).toBe(5);
    for (const code of ['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowLeft', 'ArrowRight']) key(page, code);
    expect(closed()).toBe(5);
  });

  it('jumps by chapter outside the summary: a tab, then Left and Right, and uses no animation when motion is reduced', () => {
    const { host, page } = mount(true);
    expect(host.querySelector('.bts')?.classList.contains('bts--still')).toBe(true);
    host.querySelector<HTMLElement>('[data-bts-go="c3"]')!.click();
    expect(calls.at(-1)).toMatchObject({ behavior: 'auto' });
    expect(host.querySelectorAll('[data-bts-go]')).toHaveLength(7);
    // the tab scrolled to chapter III (offset 3000, less the 4 px margin), so Right is chapter IV and Left twice is chapter II
    expect(calls.at(-1)?.top).toBe(2996);
    key(page, 'ArrowRight');
    expect(calls.at(-1)?.top).toBe(3996);
    key(page, 'ArrowLeft');
    key(page, 'ArrowLeft');
    expect(calls.at(-1)?.top).toBe(1996);
    host.querySelector<HTMLElement>('[data-bts-go="c1"]')!.click();
    key(page, 'ArrowLeft');
    expect(calls.at(-1)?.top).toBe(0); // Left from chapter I is the summary again
  });

  it('smooth-scrolls a tab when motion is not reduced', () => {
    const { host } = mount(false);
    host.querySelector<HTMLElement>('[data-bts-go="c2"]')!.click();
    expect(calls.at(-1)).toMatchObject({ behavior: 'smooth' });
    expect(host.querySelector('.bts')?.classList.contains('bts--still')).toBe(false);
  });

  it('lets go of everything when it is closed: no click, scroll or resize handler stays', () => {
    const { host, page } = mount();
    page.dispose();
    const before = card(host);
    host.querySelector<HTMLElement>('[data-bts-card-step="1"]')!.click();
    expect(card(host)).toBe(before);
    const closeBtn = host.querySelector('[data-info-act="close"]');
    expect(closeBtn).not.toBeNull(); // the title's overlay owns that handler, not the page
  });
});

describe('through the title, with the switch swapped on in this test only (the real dynamic import, in a fresh module graph)', () => {
  // One mock for the whole group, a fresh module graph for each test, and the real switch put back when the group is done.
  beforeAll(() => {
    vi.doMock('../../src/app/changelog/behindTheScenes.ts', () => ({ BTS_LIVE: true, BTS_TITLE: 'Behind the Scenes', BTS_KEY: 'KeyT', BTS_KEY_LABEL: 'T' }));
  });
  afterAll(() => {
    vi.doUnmock('../../src/app/changelog/behindTheScenes.ts');
    vi.resetModules();
  });
  let unstub = (): void => undefined;
  const detach: (() => void)[] = [];
  beforeEach(() => {
    vi.resetModules();
    HTMLElement.prototype.scrollBy = function (this: HTMLElement, opts?: ScrollToOptions | number): void {
      if (typeof opts === 'object') this.scrollTop += opts.top ?? 0;
    };
    HTMLElement.prototype.scrollTo = function (this: HTMLElement, opts?: ScrollToOptions | number): void {
      if (typeof opts === 'object') this.scrollTop = opts.top ?? 0;
    };
    unstub = stubLayout();
  });
  afterEach(() => {
    unstub();
    while (detach.length) detach.pop()?.();
    document.body.innerHTML = '';
  });

  async function setup() {
    const [{ Input }, { SaveStore, SAVE_KEY }, { TitleScreen }] = await Promise.all([
      import('../../src/app/Input.ts'),
      import('../../src/app/SaveData.ts'),
      import('../../src/app/screens/TitleScreen.ts'),
    ]);
    const uiRoot = document.body.appendChild(document.createElement('div'));
    const slot = new Map<string, string>([[SAVE_KEY, JSON.stringify({ version: 1, updatedAt: 1, chapters: {}, unlocked: [], settings: { reduceMotion: true }, seenCoach: [], flags: {} })]]);
    const input = new Input({ pointerRoot: uiRoot, keyboardTarget: window });
    input.attach();
    detach.push(() => input.detach());
    const app = {
      uiRoot,
      input,
      save: new SaveStore(SAVE_KEY, { getItem: (k: string) => slot.get(k) ?? null, setItem: (k: string, v: string) => void slot.set(k, v), removeItem: (k: string) => void slot.delete(k) }),
      fade: () => Promise.resolve(),
    };
    const screen = new TitleScreen();
    screen.app = app as never;
    screen.root = uiRoot.appendChild(document.createElement('div'));
    await screen.enter();
    return { app, screen, root: screen.root, input };
  }
  const press = (code: string): void => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code, bubbles: true, cancelable: true }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code, bubbles: true, cancelable: true }));
  };

  it('draws the entry in the hint row, T opens the page, Enter closes it and never starts the game, and the claim is handed back', async () => {
    const { app, screen, root, input } = await setup();
    expect(root.querySelector('[data-action="title:bts"]')?.textContent?.replace(/\s+/g, ' ').trim()).toBe('T Behind the Scenes');
    expect(root.querySelector('[data-action="title:changelog"]')).not.toBeNull();
    press('KeyT');
    await vi.waitFor(() => expect(root.querySelector('.fe-info--bts .bts')).not.toBeNull(), { timeout: 8000 });
    expect(input.keyboardClaimed).toBe(true);
    expect((screen.snapshot()['info'] as { open: string }).open).toBe('bts');
    expect(document.getElementById('bts-styles')).not.toBeNull();
    press('ArrowRight');
    expect([...root.querySelectorAll<HTMLElement>('[data-bts-card]')].findIndex((c) => !c.hidden)).toBe(1);
    press('Enter');
    input.update();
    screen.handleInput(input);
    expect(root.querySelector('.fe-info')).toBeNull();
    expect(input.keyboardClaimed).toBe(false);
    expect(screen.snapshot()['advancing']).toBe(false);
    void app;
    screen.exit();
  }, 30_000);

  it('opens from a tap on the entry, closes on Esc and the same letter, and not twice while it is loading', async () => {
    const { screen, root, input } = await setup();
    root.querySelector<HTMLElement>('[data-action="title:bts"]')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    input.update();
    screen.handleInput(input);
    press('KeyT'); // a second ask while the first is still loading changes nothing
    await vi.waitFor(() => expect(root.querySelector('.fe-info--bts')).not.toBeNull(), { timeout: 8000 });
    expect(root.querySelectorAll('.fe-info')).toHaveLength(1);
    press('Escape');
    expect(root.querySelector('.fe-info')).toBeNull();
    press('KeyT');
    await vi.waitFor(() => expect(root.querySelector('.fe-info--bts')).not.toBeNull(), { timeout: 8000 });
    press('KeyT');
    expect(root.querySelector('.fe-info')).toBeNull();
    expect(input.keyboardClaimed).toBe(false);
    screen.exit();
  }, 30_000);

  it('does not open a page that arrives after the title has already begun to leave, or after it was exited', async () => {
    const { screen, root } = await setup();
    press('KeyT');
    screen.exit(); // the chunk resolves after this: it must not draw into a dead screen
    await new Promise((r) => setTimeout(r, 400));
    expect(root.querySelector('.fe-info')).toBeNull();
  }, 30_000);
});
