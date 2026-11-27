/**
 * In-page WCAG text-contrast scan shared by scripts/contrast-sweep.mjs and scripts/sweep.mjs. Pass it to
 * page.evaluate(scan): it returns { low: [...under 4.5:1], small: [...under 14 px] } for visible, non-SVG text.
 */
export function scan() {
  // Any CSS colour (rgb, oklab/color-mix output, color(srgb …)) is normalised through a 1×1 canvas.
  const cv = document.createElement("canvas");
  cv.width = cv.height = 1;
  const cx = cv.getContext("2d", { willReadFrequently: true });
  const cache = new Map();
  const parse = (c) => {
    if (!c || c === "transparent") return null;
    if (cache.has(c)) return cache.get(c);
    let v = null;
    const m = c.match(/^rgba?\(([^)]+)\)$/);
    if (m) {
      const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
      v = { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
    } else {
      const alpha = c.match(/\/\s*([\d.]+%?)\s*\)$/);
      let a = 1;
      if (alpha) a = alpha[1].endsWith("%") ? parseFloat(alpha[1]) / 100 : parseFloat(alpha[1]);
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = "#000";
      cx.fillStyle = c.replace(/\/\s*[\d.]+%?\s*\)$/, ")");
      cx.fillRect(0, 0, 1, 1);
      const d = cx.getImageData(0, 0, 1, 1).data;
      v = { r: d[0], g: d[1], b: d[2], a };
    }
    cache.set(c, v);
    return v;
  };
  const over = (top, under) => {
    const a = top.a + under.a * (1 - top.a);
    if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
    const mix = (x, y) => (x * top.a + y * under.a * (1 - top.a)) / a;
    return { r: mix(top.r, under.r), g: mix(top.g, under.g), b: mix(top.b, under.b), a };
  };
  const lum = ({ r, g, b }) => {
    const f = (v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
    return (x + 0.05) / (y + 0.05);
  };
  const gradientStops = (img) => [...img.matchAll(/(?:rgba?|oklab|oklch|lab|lch|color)\([^)]*\)/g)].map((m) => parse(m[0]));
  const page = getComputedStyle(document.documentElement).backgroundColor;

  /** Background layers from el upward; returns candidate opaque backgrounds (several if a gradient is involved). */
  const backgrounds = (el) => {
    const layers = [];
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const img = cs.backgroundImage;
      if (img && img !== "none" && /gradient/.test(img) && !n.classList.contains("plate")) {
        const stops = gradientStops(img).filter((s) => s && s.a > 0);
        const base = parse(cs.backgroundColor);
        if (stops.length) {
          layers.push({ stops, base });
          if (stops.every((s) => s.a >= 1)) return { layers, grad: true };
          continue;
        }
      }
      const bg = parse(cs.backgroundColor);
      if (bg && bg.a > 0) {
        layers.push({ stops: [bg] });
        if (bg.a >= 1) return { layers, grad: layers.some((l) => l.stops.length > 1) };
      }
    }
    layers.push({ stops: [parse(page) ?? { r: 255, g: 255, b: 255, a: 1 }] });
    return { layers, grad: layers.some((l) => l.stops.length > 1) };
  };
  const resolve = (layers) => {
    // Composite bottom-up for every combination of gradient stops (worst case is what we report).
    let acc = [{ r: 255, g: 255, b: 255, a: 1 }];
    for (let i = layers.length - 1; i >= 0; i--) {
      const next = [];
      for (const s of layers[i].stops) for (const a of acc) next.push(over(s, a));
      acc = next.slice(0, 64);
    }
    return acc;
  };
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
      if (n.classList.contains("sr-only")) return false;
    }
    return true;
  };
  const describe = (el) => {
    const t = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 60);
    const cls = (el.getAttribute("class") || "").split(/\s+/).slice(0, 6).join(" ");
    return { text: t, tag: el.tagName.toLowerCase(), cls };
  };

  const out = { low: [], small: [] };
  const seen = new Set();
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let tn = walker.nextNode(); tn; tn = walker.nextNode()) {
    if (!tn.nodeValue.trim()) continue;
    const el = tn.parentElement;
    if (!el || seen.has(el) || el.closest("svg, script, style, noscript")) continue;
    seen.add(el);
    if (!visible(el)) continue;
    const cs = getComputedStyle(el);
    let fg = parse(cs.color);
    if (!fg) continue;
    let op = 1;
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) op *= Number(getComputedStyle(n).opacity);
    fg = { ...fg, a: fg.a * op };
    const { layers, grad } = backgrounds(el);
    const bgs = resolve(layers);
    let worst = Infinity;
    for (const bg of bgs) worst = Math.min(worst, ratio(over(fg, bg), bg));
    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const large = size >= 24 || (size >= 18.66 && weight >= 700);
    const d = describe(el);
    if (worst < 4.5) out.low.push({ ...d, ratio: Math.round(worst * 100) / 100, size, weight, large, grad });
    if (size < 14) out.small.push({ ...d, size });
  }
  return out;
}
