/**
 * A small CSS reader and length evaluator for the tests that must say what the stylesheets COMPUTE without a layout engine (lane a11y-text, 2026-10-29; no jsdom: custom-property arithmetic is not
 * something jsdom resolves). It reads the leaf rules of a sheet, finds the last declaration of a property for an exact selector, evaluates `calc()`, `min()`, `max()`, `clamp()` and `var()` with a viewport
 * and a variable table (lengths in px, `vw` / `vh`, unitless numbers), and measures the specificity of a selector the way the cascade does.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(__dirname, '..', '..', '..');

/** A source file's text, comments kept out only when asked, CRLF squeezed to LF. */
export function readSource(rel: string, stripComments = true): string {
  const t = readFileSync(join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
  return stripComments ? t.replace(/\/\*[\s\S]*?\*\//g, '') : t;
}

export interface CssRule {
  /** One selector of the rule's list, whitespace squeezed. */
  sel: string;
  /** The at-rules it sits in, outermost first, joined with " | " ("" at the top level). */
  at: string;
  body: string;
}

/** The leaf rule blocks of a sheet (comments already stripped by {@link readSource}), one entry per selector of a list. */
export function leafRules(css: string): CssRule[] {
  const out: CssRule[] = [];
  const stack: { open: number; head: string; hasChild: boolean }[] = [];
  let headStart = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i]!;
    if (c === '"' || c === "'") {
      i++;
      while (i < css.length && css[i] !== c) i += css[i] === '\\' ? 2 : 1;
      continue;
    }
    if (c === '{') {
      const head = css.slice(headStart, i).trim().replace(/\s+/g, ' ');
      if (stack.length > 0) stack[stack.length - 1]!.hasChild = true;
      stack.push({ open: i, head, hasChild: false });
      headStart = i + 1;
    } else if (c === '}') {
      const top = stack.pop();
      if (top && !top.hasChild) {
        const at = stack.map((s) => s.head).join(' | ');
        for (const sel of splitTop(top.head)) out.push({ sel, at, body: css.slice(top.open + 1, i) });
      }
      headStart = i + 1;
    } else if (c === ';' && stack.length === 0) {
      headStart = i + 1;
    }
  }
  return out;
}

/** Split a selector list (or an argument list) on top-level commas. */
export function splitTop(list: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of list) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The declarations of one rule body, in order (`!important` kept in the value). */
export function declsOf(body: string): Array<[string, string]> {
  const out: Array<[string, string]> = [];
  let depth = 0;
  let cur = '';
  const flush = (): void => {
    const i = cur.indexOf(':');
    if (i > 0) out.push([cur.slice(0, i).trim(), cur.slice(i + 1).trim()]);
    cur = '';
  };
  for (const ch of body) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) flush();
    else cur += ch;
  }
  flush();
  return out;
}

/** The value of the last `prop` declared for exactly `selector` (any at-rule), or undefined. */
export function lastDecl(rules: readonly CssRule[], selector: string, prop: string): string | undefined {
  let found: string | undefined;
  for (const r of rules) {
    if (r.sel !== selector) continue;
    for (const [p, v] of declsOf(r.body)) if (p === prop) found = v.replace(/\s*!important\s*$/, '');
  }
  return found;
}

// ----------------------------------------------------------------------------------------------- lengths

export interface CssCtx {
  vw: number;
  vh: number;
  /** Custom properties by name, each a value text (evaluated on use, so one may name another). */
  vars?: Record<string, string>;
}

type Tok = { k: 'num'; v: number; unit: string } | { k: 'id'; v: string } | { k: 'op'; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  const re = /\s*(?:(\d*\.?\d+)(px|vw|vh|em|rem|%)?|(--[\w-]+|[a-zA-Z][\w-]*)|([()+\-*/,]))/gy;
  let m: RegExpExecArray | null;
  let last = 0;
  while ((m = re.exec(src)) !== null) {
    last = re.lastIndex;
    if (m[1] !== undefined) out.push({ k: 'num', v: parseFloat(m[1]), unit: m[2] ?? '' });
    else if (m[3] !== undefined) out.push({ k: 'id', v: m[3] });
    else out.push({ k: 'op', v: m[4]! });
  }
  if (src.slice(last).trim() !== '') throw new Error(`cannot read "${src.slice(last).trim()}" in "${src}"`);
  return out;
}

/** Evaluate a CSS length expression to px (a unitless result is returned as is, so a multiplier may be evaluated too). */
export function evalLength(src: string, ctx: CssCtx, depth = 0): number {
  if (depth > 12) throw new Error(`var() loop in "${src}"`);
  const toks = tokenize(src);
  let i = 0;
  const peek = (): Tok | undefined => toks[i];
  const eat = (v: string): void => {
    const t = toks[i++];
    if (!t || t.k !== 'op' || t.v !== v) throw new Error(`expected ${v} in "${src}"`);
  };
  const args = (): number[] => {
    eat('(');
    const a: number[] = [expr()];
    while (peek()?.k === 'op' && (peek() as { v: string }).v === ',') {
      i++;
      a.push(expr());
    }
    eat(')');
    return a;
  };
  function factor(): number {
    const t = toks[i++];
    if (!t) throw new Error(`unexpected end of "${src}"`);
    if (t.k === 'num') {
      switch (t.unit) {
        case 'vw':
          return (t.v * ctx.vw) / 100;
        case 'vh':
          return (t.v * ctx.vh) / 100;
        case 'em':
        case 'rem':
          return t.v * 16;
        case '%':
          throw new Error(`a percentage cannot be evaluated here: "${src}"`);
        default:
          return t.v;
      }
    }
    if (t.k === 'op') {
      if (t.v === '-') return -factor();
      if (t.v === '(') {
        const v = expr();
        eat(')');
        return v;
      }
      throw new Error(`unexpected ${t.v} in "${src}"`);
    }
    // an identifier: a function
    const name = t.v;
    if (name === 'calc') {
      eat('(');
      const v = expr();
      eat(')');
      return v;
    }
    if (name === 'var') {
      eat('(');
      const id = toks[i++];
      if (!id || id.k !== 'id') throw new Error(`var() needs a name in "${src}"`);
      let fallback: string | null = null;
      if (peek()?.k === 'op' && (peek() as { v: string }).v === ',') {
        i++;
        // the fallback is the rest of the argument text up to the matching close
        let d = 0;
        const start = i;
        while (i < toks.length && !(d === 0 && toks[i]!.k === 'op' && (toks[i] as { v: string }).v === ')')) {
          const tk = toks[i]!;
          if (tk.k === 'op' && tk.v === '(') d++;
          if (tk.k === 'op' && tk.v === ')') d--;
          i++;
        }
        fallback = toks.slice(start, i).map((tk) => (tk.k === 'num' ? `${tk.v}${tk.unit}` : tk.v)).join(' ');
      }
      eat(')');
      const val = ctx.vars?.[id.v];
      if (val !== undefined) return evalLength(val, ctx, depth + 1);
      if (fallback !== null) return evalLength(fallback, ctx, depth + 1);
      throw new Error(`${id.v} is not defined and has no fallback in "${src}"`);
    }
    if (name === 'min' || name === 'max') {
      const a = args();
      return name === 'min' ? Math.min(...a) : Math.max(...a);
    }
    if (name === 'clamp') {
      const [lo, v, hi] = args();
      return Math.min(Math.max(v!, lo!), hi!);
    }
    throw new Error(`cannot evaluate ${name}() in "${src}"`);
  }
  function term(): number {
    let v = factor();
    for (;;) {
      const t = peek();
      if (t?.k === 'op' && (t.v === '*' || t.v === '/')) {
        i++;
        const r = factor();
        v = t.v === '*' ? v * r : v / r;
      } else return v;
    }
  }
  function expr(): number {
    let v = term();
    for (;;) {
      const t = peek();
      if (t?.k === 'op' && (t.v === '+' || t.v === '-')) {
        i++;
        const r = term();
        v = t.v === '+' ? v + r : v - r;
      } else return v;
    }
  }
  const v = expr();
  if (i < toks.length) throw new Error(`trailing "${src}"`);
  return v;
}

/** A value of two lengths ("0 173.5px", "155px 153.5px", a `translate`'s pair) as two numbers. */
export function evalPair(src: string, ctx: CssCtx): [number, number] {
  // split on whitespace outside parentheses
  const parts: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of src.trim()) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (/\s/.test(ch) && depth === 0) {
      if (cur) parts.push(cur);
      cur = '';
    } else cur += ch;
  }
  if (cur) parts.push(cur);
  if (parts.length === 1) return [evalLength(parts[0]!, ctx), 0];
  return [evalLength(parts[0]!, ctx), evalLength(parts[1]!, ctx)];
}

// ----------------------------------------------------------------------------------------------- specificity

export type Spec = [number, number, number];
export const cmpSpec = (a: Spec, b: Spec): number => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

/** Specificity of one selector: ids, classes / attributes / pseudo-classes, elements. `:not`, `:is` and `:has` count as their largest argument; `:where` counts nothing. */
export function specificity(sel: string): Spec {
  const s: Spec = [0, 0, 0];
  const fn = /:(not|is|has|where)\(((?:[^()]|\([^()]*\))*)\)/g;
  const rest = sel.trim().replace(fn, (_m, name: string, arg: string) => {
    if (name !== 'where') {
      const best = splitTop(arg)
        .map(specificity)
        .reduce<Spec>((a, b) => (cmpSpec(b, a) > 0 ? b : a), [0, 0, 0]);
      s[0] += best[0];
      s[1] += best[1];
      s[2] += best[2];
    }
    return ' ';
  });
  s[0] += (rest.match(/#[\w-]+/g) ?? []).length;
  s[1] += (rest.match(/\.[\w-]+|\[[^\]]*\]|:(?!:)[\w-]+/g) ?? []).length;
  const bare = rest.replace(/\[[^\]]*\]/g, ' ').replace(/[.#:][\w-]+/g, ' ');
  s[2] += (bare.match(/(?:^|[\s>+~])[a-z][\w-]*/gi) ?? []).length;
  return s;
}
