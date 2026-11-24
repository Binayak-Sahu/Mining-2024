/**
 * Safe arithmetic expression evaluator for the Numeric Workbench scratch calculator.
 * Supports + - * / ^, parentheses, unary minus, constants (pi, e, g), named variables,
 * and functions: sqrt, cbrt, ln, log (base 10), exp, sin, cos, tan, asin, acos, atan
 * (trig in DEGREES, as used on site), abs, min, max, pow.
 */

type Tok = { t: "num"; v: number } | { t: "id"; v: string } | { t: "op"; v: string };

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/π/g, "pi");
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t") {
      i++;
      continue;
    }
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      if (s[j] === "e" || s[j] === "E") {
        let k = j + 1;
        if (s[k] === "+" || s[k] === "-") k++;
        if (/[0-9]/.test(s[k] ?? "")) {
          while (k < s.length && /[0-9]/.test(s[k])) k++;
          j = k;
        }
      }
      const v = Number(s.slice(i, j));
      if (Number.isNaN(v)) throw new Error(`Bad number "${s.slice(i, j)}"`);
      out.push({ t: "num", v });
      i = j;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      let j = i;
      while (j < s.length && /[A-Za-z0-9_]/.test(s[j])) j++;
      out.push({ t: "id", v: s.slice(i, j) });
      i = j;
      continue;
    }
    if ("+-*/^(),".includes(c)) {
      out.push({ t: "op", v: c });
      i++;
      continue;
    }
    throw new Error(`Unexpected "${c}"`);
  }
  return out;
}

const D2R = Math.PI / 180;
const FUNCS: Record<string, (...a: number[]) => number> = {
  sqrt: Math.sqrt,
  cbrt: Math.cbrt,
  ln: Math.log,
  log: Math.log10,
  exp: Math.exp,
  sin: (x) => Math.sin(x * D2R),
  cos: (x) => Math.cos(x * D2R),
  tan: (x) => Math.tan(x * D2R),
  asin: (x) => Math.asin(x) / D2R,
  acos: (x) => Math.acos(x) / D2R,
  atan: (x) => Math.atan(x) / D2R,
  abs: Math.abs,
  min: Math.min,
  max: Math.max,
  pow: Math.pow,
};

const CONSTS: Record<string, number> = { pi: Math.PI, e: Math.E, g: 9.81 };

export function evaluate(src: string, vars: Record<string, number> = {}): number {
  const toks = tokenize(src);
  let p = 0;
  const peek = () => toks[p];
  const eat = (v?: string) => {
    const t = toks[p];
    if (!t || (v !== undefined && !(t.t === "op" && t.v === v))) throw new Error(`Expected "${v ?? "token"}"`);
    p++;
    return t;
  };

  function expr(): number {
    let v = term();
    while (peek()?.t === "op" && (peek().v === "+" || peek().v === "-")) {
      const op = eat().v;
      const r = term();
      v = op === "+" ? v + r : v - r;
    }
    return v;
  }
  function term(): number {
    let v = unary();
    for (;;) {
      const t = peek();
      if (t?.t === "op" && (t.v === "*" || t.v === "/")) {
        eat();
        const r = unary();
        v = t.v === "*" ? v * r : v / r;
      } else if (t && (t.t === "num" || t.t === "id" || (t.t === "op" && t.v === "("))) {
        // implicit multiplication: 2pi, 3(4), 2x
        v = v * unary();
      } else break;
    }
    return v;
  }
  function unary(): number {
    const t = peek();
    if (t?.t === "op" && t.v === "-") {
      eat();
      return -unary();
    }
    if (t?.t === "op" && t.v === "+") {
      eat();
      return unary();
    }
    return power();
  }
  function power(): number {
    const base = atom();
    const t = peek();
    if (t?.t === "op" && t.v === "^") {
      eat();
      return Math.pow(base, unary());
    }
    return base;
  }
  function atom(): number {
    const t = peek();
    if (!t) throw new Error("Incomplete expression");
    if (t.t === "num") {
      eat();
      return t.v;
    }
    if (t.t === "op" && t.v === "(") {
      eat();
      const v = expr();
      eat(")");
      return v;
    }
    if (t.t === "id") {
      eat();
      const name = t.v;
      const nx = peek();
      if (nx?.t === "op" && nx.v === "(") {
        const fn = FUNCS[name];
        if (!fn) throw new Error(`Unknown function ${name}`);
        eat("(");
        const args: number[] = [expr()];
        while (peek()?.t === "op" && peek().v === ",") {
          eat();
          args.push(expr());
        }
        eat(")");
        return fn(...args);
      }
      if (name in vars) return vars[name];
      if (name in CONSTS) return CONSTS[name];
      throw new Error(`Unknown symbol ${name}`);
    }
    throw new Error(`Unexpected "${t.v}"`);
  }

  const v = expr();
  if (p < toks.length) throw new Error("Unexpected trailing input");
  return v;
}

/** Relative-tolerance comparison used for grading numeric answers. */
export function closeEnough(got: number, want: number, tol = 0.02): boolean {
  if (!Number.isFinite(got)) return false;
  if (want === 0) return Math.abs(got) <= tol;
  return Math.abs(got - want) / Math.abs(want) <= tol;
}

export function fmt(v: number, digits = 2): string {
  if (!Number.isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) return v.toExponential(Math.max(1, digits));
  return v.toFixed(digits);
}
