// @vitest-environment jsdom
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { DialogueBox } from '../../src/ui/common/DialogueBox.ts';
import { SPEAKER_ROLES, speakerRole } from '../../src/ui/common/speaker-roles.ts';
import { narrate, say } from '../../src/story/dsl.ts';

const CSS = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../src/ui/common/dialogue-box.css'),
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
    for (const who of ['brother', 'buddy', 'shinra'] as const) {
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
