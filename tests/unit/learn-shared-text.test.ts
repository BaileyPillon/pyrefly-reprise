import { describe, expect, it } from 'vitest';
import { escapeHtml, highlightNumbers } from '../../learn/shared/text.ts';

describe('escapeHtml', () => {
  it('escapes the five HTML-significant characters', () => {
    expect(escapeHtml(`<a href="x">Tom & Jerry's</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;Tom &amp; Jerry&#39;s&lt;/a&gt;',
    );
  });

  it('leaves plain text unchanged', () => {
    expect(escapeHtml('Vegnagun, chapter 5')).toBe('Vegnagun, chapter 5');
  });
});

describe('highlightNumbers', () => {
  it('wraps a lone number in <b>', () => {
    expect(highlightNumbers('119 pieces')).toBe('<b>119</b> pieces');
  });

  it('wraps every number, including a comma-grouped one', () => {
    expect(highlightNumbers('119 pieces · 5 battles · 33,040 HP')).toBe(
      '<b>119</b> pieces · <b>5</b> battles · <b>33,040</b> HP',
    );
  });

  it('escapes surrounding text so it stays HTML-injection safe', () => {
    expect(highlightNumbers('<script>1</script>')).toBe('&lt;script&gt;<b>1</b>&lt;/script&gt;');
  });

  it('returns the plain string unchanged when there are no digits', () => {
    expect(highlightNumbers('no numbers here')).toBe('no numbers here');
  });
});
