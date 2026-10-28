// The touch-target walk (ChatGPT's point 6, release 68, lane ui-input): every control a finger can press, as the page really lays it out.
//
// `page.evaluate(touchTargetProbe, { min: 44 })` lists each visible interactive element (a native button or link, a `role` that
// says it presses, anything that carries a `data-action`) with its box in CSS px and whether either side is under `min`
// (44, the project's bar; WCAG 2.2 "enhanced" 2.5.5). It has no closure: Playwright serialises it, so it must stay self-contained
// (the same rule as tools/text-floor-probe.mjs).
//
// What it can and cannot see. It measures the element's border box. A hit area grown with a pseudo-element (::before/::after
// positioned over the control) is not a box the page can measure, so such a control is listed with `pseudo: true` and judged by
// hand. A `data-action` element that is only a pointer alias for a larger control (the title's whole-plate tap) is listed too:
// read `nested` and `bigAlias` before calling it a defect. An element outside the viewport (the chapter list scrolls on a phone)
// is measured all the same, with `inView: false`, because the target's size does not depend on where the page is scrolled.

export function touchTargetProbe(arg) {
  const min = (arg && arg.min) || 44;
  const root = arg && arg.rootSel ? document.querySelector(arg.rootSel) : document.body;
  if (!root) return { error: 'no root' };
  const SEL = [
    'button', 'a[href]', 'summary', 'input:not([type=hidden])', 'select', 'textarea',
    '[role=button]', '[role=tab]', '[role=switch]', '[role=checkbox]', '[role=radio]', '[role=menuitem]', '[role=option]', '[role=link]',
    '[data-action]',
  ].join(',');
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const round = (v, d = 1) => Math.round(v * 10 ** d) / 10 ** d;
  const label = (el) => {
    const raw = typeof el.className === 'string' ? el.className : el.getAttribute('class') || '';
    const cls = raw.trim().split(/\s+/).filter(Boolean).slice(0, 2).join('.');
    const name = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 28);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${name ? ` "${name}"` : ''}`;
  };
  const hidden = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === 'none' || cs.visibility === 'hidden' || n.hasAttribute('hidden') || n.getAttribute('aria-hidden') === 'true') return true;
      if (parseFloat(cs.opacity) === 0) return true;
    }
    return false;
  };
  const area = (el) => {
    const b = el.getBoundingClientRect();
    return b.width * b.height;
  };
  const all = [];
  for (const el of root.querySelectorAll(SEL)) {
    if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') continue;
    if (hidden(el)) continue;
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === 'none') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const grows = (p) => p.content !== 'none' && p.content !== 'normal' && p.position === 'absolute' && (p.pointerEvents || 'auto') !== 'none';
    const inner = el.querySelector(SEL);
    const outer = el.parentElement ? el.parentElement.closest(SEL) : null;
    all.push({
      el: label(el),
      x: round(r.x), y: round(r.y), w: round(r.width), h: round(r.height),
      under: r.width < min - 0.5 || r.height < min - 0.5,
      inView: r.bottom > 0 && r.right > 0 && r.top < vh && r.left < vw,
      pseudo: grows(getComputedStyle(el, '::before')) || grows(getComputedStyle(el, '::after')),
      nested: inner !== null || outer !== null,
      // a pointer alias: a data-action element that contains the real control and is much bigger than it
      bigAlias: inner !== null && el.hasAttribute('data-action') && !el.hasAttribute('role') && r.width * r.height > 4 * area(inner),
    });
  }
  const under = all.filter((a) => a.under && !a.bigAlias);
  return { min, viewport: [vw, vh], n: all.length, underCount: under.length, under, all };
}
