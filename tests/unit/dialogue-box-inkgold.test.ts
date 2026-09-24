// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { resetArtManifest, setArtManifest } from '../../src/engine/ArtManifest.ts';
import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { dialogueObjectPosition, portraitCrop } from '../../src/ui/common/portrait.ts';
import { SPEAKER_ROLES, speakerRole } from '../../src/ui/common/speaker-roles.ts';
import { narrate, say } from '../../src/story/dsl.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/dialogue-box.css'),
  'utf8',
);
const HINT_CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/controls-hint.css'),
  'utf8',
);

function mount(opts: Partial<ConstructorParameters<typeof DialogueBox>[0]> = {}): {
  box: DialogueBox;
  root: HTMLElement;
} {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const box = new DialogueBox({ root, ...opts });
  box.mount();
  return { box, root };
}

// ------------------------------------------------------------- role chip

describe('dialogue role chip', () => {
  it('shows the speaker name and their tracked role tag', () => {
    const { box } = mount();
    void box.say(say('tidus', 'So... Auron, you seeing this?'));

    expect(box.el.querySelector('.dbox__speaker')?.textContent).toBe('Tidus');
    const role = box.el.querySelector('.dbox__role') as HTMLElement;
    expect(role.textContent).toBe('Guardian');
    expect(role.hidden).toBe(false);
  });

  it('hides the chip for a speaker with no role, keeping the bare name', () => {
    const { box } = mount();
    void box.say(say('wantz', 'Everything must go!'));

    expect(box.el.querySelector('.dbox__speaker')?.textContent).toBe('Wantz');
    expect((box.el.querySelector('.dbox__role') as HTMLElement).hidden).toBe(true);
  });

  it('names FFX-2 Yuna and Rikku by name, not by their internal -x2 ids', () => {
    const { box } = mount();
    void box.say(say('yuna-x2', "Um. That's a lot of creepy."));
    expect(box.el.querySelector('.dbox__speaker')?.textContent).toBe('Yuna');
    expect(box.el.querySelector('.dbox__role')?.textContent).toBe('Sphere Hunter');

    void box.say(say('rikku-x2', 'Creepy hole, creepy ladder.'));
    expect(box.el.querySelector('.dbox__speaker')?.textContent).toBe('Rikku');
  });

  it("names FFX-2 Brother 'Brother' (his X-2 portrait id is brother-x2), with no role chip", () => {
    const { box } = mount();
    void box.say(say('brother-x2', 'I CANNOT HEAR YOU! SPEAK UP!'));
    expect(box.el.querySelector('.dbox__speaker')?.textContent).toBe('Brother');
    expect((box.el.querySelector('.dbox__role') as HTMLElement).hidden).toBe(true);
  });

  it('lets a screen override the role for its own context', () => {
    const { box } = mount({ roleFor: () => 'Lady of Bevelle' });
    void box.say(say('yuna', 'I will do it.'));

    expect(box.el.querySelector('.dbox__role')?.textContent).toBe('Lady of Bevelle');
  });

  it('drops the whole name row when narrating', () => {
    const { box } = mount();
    void box.narrate(narrate('The Prominence, near the summit.'));

    expect((box.el.querySelector('.dbox__name') as HTMLElement).hidden).toBe(true);
    expect(box.el.classList.contains('dbox--narrate')).toBe(true);
  });

  it('drops the name row and chip for a choice step', () => {
    const { box } = mount();
    void box.say(say('tidus', 'Well?'));
    void box.choice({
      type: 'choice',
      resultKey: 'answered',
      options: [
        { label: 'Go on', value: 'go' },
        { label: 'Wait', value: 'wait' },
      ],
    });

    expect((box.el.querySelector('.dbox__name') as HTMLElement).hidden).toBe(true);
    expect((box.el.querySelector('.dbox__role') as HTMLElement).hidden).toBe(true);
    expect(box.el.querySelectorAll('.dbox__choice-row')).toHaveLength(2);
  });

  it('tags both Yunas differently — a summoner then a sphere hunter', () => {
    expect(speakerRole('yuna')).toBe('Summoner');
    expect(speakerRole('yuna-x2')).toBe('Sphere Hunter');
  });

  it('gives no role to the airship crew, who need no introduction', () => {
    for (const who of ['brother', 'brother-x2', 'buddy', 'shinra'] as const) {
      expect(SPEAKER_ROLES[who]).toBeUndefined();
    }
  });
});

// ------------------------------------------------- Ink & Gold slab values

describe('dialogue-box.css follows the approved mockup', () => {
  it('skews the slab -12deg and counter-skews its content', () => {
    expect(CSS).toContain('transform: skewX(-12deg)');
    expect(CSS).toContain('transform: skewX(12deg)');
  });

  it('sizes the slab from the 1440 grid: 900 wide, left 90, bottom 70', () => {
    expect(CSS).toContain('width: 62.5vw'); // 900 / 1440
    expect(CSS).toContain('left: 6.25vw'); // 90 / 1440
    expect(CSS).toContain('bottom: 4.86vw'); // 70 / 1440
  });

  it('stands the 8px gold edge beside the slab as its own plate, not a border', () => {
    // The mockup draws two plates at the same origin, so the gold never eats
    // into the slab's 900px width the way a border-left would.
    expect(CSS).toMatch(/\.dbox__edge \{[^}]*width: 0\.56vw;[^}]*background: var\(--ig-accent/); // 8 / 1440
    expect(CSS).toMatch(/\.dbox__edge \{[^}]*transform: skewX\(-12deg\)/);
  });

  it('draws the advance triangle in the same accent', () => {
    expect(CSS).toContain('border-top: 0.83vw solid var(--ig-accent, #e3b94a)'); // 12 / 1440
  });

  it('keeps every piece a sibling of the untransformed window, never nested in the slab', () => {
    // A portrait nested inside the skewed slab composes to -24deg; the body
    // text would be sheared and un-sheared. Both are siblings instead.
    expect(CSS).toMatch(/\.dbox__win \{(?:(?!\}).)*\}/s);
    expect(CSS).not.toMatch(/\.dbox__win \{[^}]*transform:/);
    expect(CSS).not.toContain('.dbox__win > *');
  });

  it('stops the advance triangle animating under prefers-reduced-motion', () => {
    expect(CSS).toMatch(/prefers-reduced-motion: reduce[\s\S]*animation: none/);
  });
});

// --------------------------------------------------- PR-0020 / PR-0056 crop

describe('the portrait always fits its slot (critic PR-0020, PR-0056)', () => {
  it('crops with the browser\'s own object-fit: cover, not a fixed px width', () => {
    // The old rule forced every portrait to a fixed 20.83vw regardless of this
    // frame's own size, which is exactly how every speaker overhung the slot
    // and Jecht (the widest source file relative to his face) overhung it most.
    expect(CSS).toMatch(/\.dbox__portrait img \{[^}]*object-fit: cover;[^}]*\}/s);
    expect(CSS).not.toMatch(/\.dbox__portrait img \{[^}]*max-width: none/s);
  });

  it('sizes the <img> to the bounding box of the frame it leans inside, not to the frame', () => {
    // A frame-sized <img> (`inset: 0` + 100%/100%, which is what this used to
    // ask for) is an upright rectangle inside a parallelogram clip and leaves
    // two wedges of the frame's own gradient bare. The numbers are measured in
    // tests/unit/dialogue-portrait-geometry.test.ts; this is the shape of them.
    expect(CSS).toMatch(/\.dbox__portrait img \{[^}]*width: calc\(100% \+ var\(--dbox-shear\)\);[^}]*\}/s);
    expect(CSS).toMatch(/\.dbox__portrait img \{[^}]*left: calc\(-0\.5 \* var\(--dbox-shear\)\);[^}]*\}/s);
    expect(CSS).toMatch(/\.dbox__portrait img \{[^}]*height: 100%;[^}]*\}/s);
    expect(CSS).not.toMatch(/\.dbox__portrait img \{[^}]*inset: 0/s);
  });

  it('gives every speaker line an object-position from the measured face crop', () => {
    const { box } = mount();
    void box.say(say('tidus', 'So... Auron, you seeing this?'));

    const img = box.el.querySelector('.dbox__portrait img') as HTMLImageElement;
    expect(img).not.toBeNull();
    const crop = portraitCrop('tidus');
    expect(img.style.objectPosition).toBe(`${(crop.fx * 100).toFixed(2)}% ${(crop.fy * 100).toFixed(2)}%`);
  });

  it("frames Jecht from his own dialogue-card row, not the shared roster row his eyes were mismeasured on", () => {
    const { box } = mount();
    void box.say(say('jecht', "Don't get soft on me now, Braska."));

    const img = box.el.querySelector('.dbox__portrait img') as HTMLImageElement;
    const [, fyStr] = img.style.objectPosition.split(' ');
    const fy = Number(fyStr!.replace('%', '')) / 100;
    // His eyes sit right under the headband near the top of the file — nowhere
    // near the shared 'portraits' table's 0.2673, which is his nose bridge.
    expect(fy).toBeLessThan(0.15);
    expect(dialogueObjectPosition('jecht')).not.toBe(dialogueObjectPosition(undefined));
  });

  it('changes no other speaker: everyone without a dialogue-table row keeps the roster fx/fy', () => {
    for (const id of ['tidus', 'auron', 'yuna', 'wakka', 'kimahri']) {
      const crop = portraitCrop(id);
      expect(dialogueObjectPosition(id)).toBe(`${(crop.fx * 100).toFixed(2)}% ${(crop.fy * 100).toFixed(2)}%`);
    }
  });
});

// ------------------------------------------- PR-0020: a speaker with no art

/**
 * FFX **and** FFX-2 (AGENTS.md rule 14): the card is shared plumbing and the
 * rule is the same in both games — no painting, no frame. The evidence came
 * from FFX-2 (Nooj, chapter 5, has no `portraits/nooj.png`), so both cases are
 * asserted below and the FFX one is the absence test.
 */
describe('a speaker the fleet has not painted gets no frame at all (critic PR-0020)', () => {
  const PAINTED = ['tidus', 'auron', 'yuna', 'jecht', 'rikku-x2', 'yuna-x2'];

  function withManifest<T>(run: () => T): T {
    setArtManifest({
      version: 1,
      generatedAt: '2026-09-21T00:00:00.000Z',
      subjects: {},
      portraits: PAINTED,
      backdrops: [],
      pause: [],
      pause2x: [],
      title: [],
      title2x: [],
    });
    try {
      return run();
    } finally {
      resetArtManifest();
    }
  }

  it('folds the frame away for Nooj, instead of leaving an empty grey slot over the slab', () => {
    withManifest(() => {
      const { box } = mount();
      void box.say(say('nooj', 'The Crimson Squad was ten years ago.'));

      // Before the fix the class came from the speaker id, which is truthy for
      // exactly the speakers that have no art, so the frame stayed on screen
      // with nothing in it and the body text stayed indented around it.
      expect(box.el.querySelector('.dbox__portrait img')).toBeNull();
      expect(box.el.classList.contains('dbox--no-portrait')).toBe(true);
    });
  });

  it('keeps the frame for a speaker the fleet has painted, in both games', () => {
    withManifest(() => {
      const { box } = mount();
      void box.say(say('tidus', 'So... Auron, you seeing this?'));
      expect(box.el.classList.contains('dbox--no-portrait')).toBe(false);
      expect(box.el.querySelector('.dbox__portrait img')).not.toBeNull();

      void box.say(say('yuna-x2', "Um. That's a lot of creepy."));
      expect(box.el.classList.contains('dbox--no-portrait')).toBe(false);
    });
  });

  it('puts the frame back on the next line after an unpainted one', () => {
    withManifest(() => {
      const { box } = mount();
      void box.say(say('nooj', 'The Crimson Squad was ten years ago.'));
      expect(box.el.classList.contains('dbox--no-portrait')).toBe(true);
      void box.say(say('rikku-x2', 'Creepy hole, creepy ladder.'));
      expect(box.el.classList.contains('dbox--no-portrait')).toBe(false);
      expect(box.el.querySelector('.dbox__portrait img')).not.toBeNull();
    });
  });

  it('folds the frame when the painting 404s on a cold manifest, too', () => {
    // No manifest loaded: `portraitImgHtml` emits the <img> and lets `onerror`
    // remove it, which used to leave the same empty frame behind.
    resetArtManifest();
    const { box } = mount();
    void box.say(say('nooj', 'The Crimson Squad was ten years ago.'));
    const img = box.el.querySelector('.dbox__portrait img') as HTMLImageElement;
    expect(img).not.toBeNull();
    expect(box.el.classList.contains('dbox--no-portrait')).toBe(false);

    img.dispatchEvent(new Event('error'));
    expect(box.el.classList.contains('dbox--no-portrait')).toBe(true);
  });
});

// ------------------------------------------------------------- PR-0057 phone

describe('phone width keeps the card readable and clear of the hint bar (critic PR-0057)', () => {
  it('gives the dialogue card a fixed-px phone layout instead of the crushed vw one', () => {
    expect(CSS).toMatch(/@media \(max-width: 560px\)[\s\S]*\.dbox__win \{[^}]*min-height: \d+px/);
    // Raised well clear of the hint bar rather than left at the desktop 4.86vw.
    expect(CSS).toMatch(/@media \(max-width: 560px\)[\s\S]*\.dbox__win \{[^}]*bottom: \d+px/);
  });

  it('keeps the portrait cropped the same way (object-fit: cover) at a smaller pixel size', () => {
    expect(CSS).toMatch(/@media \(max-width: 560px\)[\s\S]*\.dbox__portrait \{[^}]*width: \d+px/);
  });

  it('shrinks and wraps the key-hint bar instead of overflowing a phone viewport', () => {
    expect(HINT_CSS).toMatch(/@media \(max-width: 560px\)[\s\S]*\.chint \{[^}]*max-width: calc\(100vw/);
    expect(HINT_CSS).toMatch(/@media \(max-width: 560px\)[\s\S]*\.chint \{[^}]*white-space: normal/);
  });
});
