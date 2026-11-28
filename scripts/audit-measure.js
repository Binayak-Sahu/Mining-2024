/* Browser-side measurement for scripts/audit-svg.tsx (plain JS so it is injected verbatim). */
window.measureSvgs = function (meta) {
  const res = [];
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  document.querySelectorAll("svg.case").forEach((svg) => {
    const m = meta[Number(svg.dataset.k)];
    const box = svg.getBoundingClientRect();
    const ox = m.ox ?? 24, W = m.w ?? 400, H = m.h ?? 240;
    const toUser = (r, t) => ({ x: r.left - box.left - ox, y: r.top - box.top - ox, w: r.width, h: r.height, t });
    const texts = [];
    svg.querySelectorAll("text").forEach((el) => {
      if (el.closest("defs, pattern")) return;
      const t = (el.textContent || "").trim();
      if (!t) return;
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      const u = toUser(r, t);
      const trim = u.h * 0.18; // glyph boxes include line gap; keep the ink band
      texts.push({ x: u.x, y: u.y + trim, w: u.w, h: u.h - 2 * trim, t });
    });
    const where = `${m.sim} [${m.ctx}]`;
    for (const a of texts)
      if (a.x < -1 || a.y < -1 || a.x + a.w > W + 1 || a.y + a.h > H + 1) res.push(`clip     ${where}: "${a.t}" at ${a.x.toFixed(0)},${a.y.toFixed(0)} w${a.w.toFixed(0)}`);
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i];
        const b = texts[j];
        const ov = inter(a, b);
        if (ov > 6 && ov > 0.12 * Math.min(a.w * a.h, b.w * b.h)) res.push(`overlap  ${where}: "${a.t}" × "${b.t}"`);
      }
    // occlusion: a small opaque shape painted after a label that covers a good part of it
    const all = [...svg.querySelectorAll("text, circle, rect, ellipse, path, polygon")].filter((el) => !el.closest("defs, pattern") && !el.hasAttribute("data-pin"));
    all.forEach((el, idx) => {
      if (el.tagName !== "text" || !(el.textContent || "").trim()) return;
      const tr = el.getBoundingClientRect();
      if (tr.width === 0) return;
      const t = toUser(tr, (el.textContent || "").trim());
      const area = t.w * t.h * 0.64;
      for (const sh of all.slice(idx + 1)) {
        if (sh.tagName === "text" || sh.contains(el)) continue;
        const fill = sh.getAttribute("fill") || (sh.style && sh.style.fill) || null;
        if (!fill || fill === "none" || fill === "transparent" || fill.startsWith("url(#grad-glass") || fill.startsWith("url(#pat-hatch") || fill.startsWith("url(#grad-rock-shade") || fill.startsWith("url(#grad-lamp")) continue;
        const op = Number(sh.getAttribute("opacity") ?? 1);
        if (op < 0.5) continue;
        const r = toUser(sh.getBoundingClientRect(), "");
        if (r.w * r.h > 6000 || r.w * r.h < 4) continue;
        const ov = inter({ x: t.x, y: t.y + t.h * 0.18, w: t.w, h: t.h * 0.64 }, r);
        if (ov > 0.3 * area) { res.push(`occlude  ${where}: "${t.t}" under a ${sh.tagName}`); break; }
      }
    });
    const pins = [...svg.querySelectorAll("circle[data-pin]")].map((c) => ({ x: Number(c.getAttribute("cx")), y: Number(c.getAttribute("cy")), i: Number(c.dataset.pin) + 1 }));
    const heads = [];
    svg.querySelectorAll("polygon, line").forEach((el) => {
      if (el.closest("pattern, defs")) return;
      const sw = Number(el.getAttribute("stroke-width") || 0);
      const p = el.parentElement;
      const isHead = el.tagName === "polygon" && p && p.children.length === 2 && p.firstElementChild && p.firstElementChild.tagName === "line";
      if (!isHead && !(sw >= 2.5 && el.tagName === "line")) return;
      const r = el.getBoundingClientRect();
      if (isHead) heads.push(toUser(r, "an arrowhead"));
      else {
        // thick line: sample points along it
        const x1 = +el.getAttribute("x1"), y1 = +el.getAttribute("y1"), x2 = +el.getAttribute("x2"), y2 = +el.getAttribute("y2");
        heads.push({ seg: [x1, y1, x2, y2], sw, t: "a thick line" });
      }
    });
    const segDist = (px, py, [x1, y1, x2, y2]) => {
      const dx = x2 - x1, dy = y2 - y1;
      const L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L));
      return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
    };
    for (const p of pins) {
      const pr = { x: p.x - 9, y: p.y - 9, w: 18, h: 18 };
      for (const t of texts) if (inter(pr, t) > 10) res.push(`pin      ${where}: pin ${p.i} covers "${t.t}"`);
      for (const h of heads) {
        if (h.seg) {
          if (segDist(p.x, p.y, h.seg) < 8 + h.sw / 2) res.push(`pin      ${where}: pin ${p.i} covers ${h.t}`);
        } else if (inter(pr, h) > 10) res.push(`pin      ${where}: pin ${p.i} covers ${h.t}`);
      }
      for (const q of pins) if (q.i > p.i && Math.hypot(q.x - p.x, q.y - p.y) < 20) res.push(`pin      ${where}: pins ${p.i} and ${q.i} touch`);
      // §5.6d(a) (2026-11-28): the 24 px inset is for TEXT only; a pin may reach the stage edge, but its centre must lie inside the stage.
      if (p.x < 0 || p.y < 0 || p.x > W || p.y > H) res.push(`pin      ${where}: pin ${p.i} outside the stage`);
    }
  });
  return res;
};

/**
 * For every theory diagram, propose the nearest collision-free position for each hotspot pin that
 * covers a label, an arrowhead, a thick stroke, another pin or the edge. Searches rings of growing
 * radius around the authored anchor so pins stay next to what they explain.
 */
window.suggestPins = function (meta) {
  const out = [];
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  document.querySelectorAll("svg.case").forEach((svg) => {
    const m = meta[Number(svg.dataset.k)];
    if (!m.pins || !m.pins.length) return;
    const box = svg.getBoundingClientRect();
    const ox = m.ox ?? 24;
    const toUser = (r) => ({ x: r.left - box.left - ox, y: r.top - box.top - ox, w: r.width, h: r.height });
    const texts = [];
    svg.querySelectorAll("text").forEach((el) => {
      if (el.closest("defs, pattern") || !(el.textContent || "").trim()) return;
      const u = toUser(el.getBoundingClientRect());
      if (u.w === 0) return;
      const trim = u.h * 0.18;
      texts.push({ x: u.x, y: u.y + trim, w: u.w, h: u.h - 2 * trim });
    });
    const heads = [];
    const segs = [];
    svg.querySelectorAll("polygon, line").forEach((el) => {
      if (el.closest("pattern, defs")) return;
      const p = el.parentElement;
      const isHead = el.tagName === "polygon" && p && p.children.length === 2 && p.firstElementChild && p.firstElementChild.tagName === "line";
      const sw = Number(el.getAttribute("stroke-width") || 0);
      if (isHead) heads.push(toUser(el.getBoundingClientRect()));
      else if (el.tagName === "line" && sw >= 2.5) segs.push({ s: [+el.getAttribute("x1"), +el.getAttribute("y1"), +el.getAttribute("x2"), +el.getAttribute("y2")], sw });
    });
    const segDist = (px, py, [x1, y1, x2, y2]) => {
      const dx = x2 - x1, dy = y2 - y1;
      const L = dx * dx + dy * dy || 1;
      const u = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / L));
      return Math.hypot(px - (x1 + u * dx), py - (y1 + u * dy));
    };
    const placed = m.pins.map((p) => ({ x: p.x, y: p.y }));
    const bad = (x, y, self) => {
      if (x < 0 || y < 0 || x > (m.w ?? 400) || y > (m.h ?? 240)) return true;
      const pr = { x: x - 10, y: y - 10, w: 20, h: 20 };
      if (texts.some((t) => inter(pr, t) > 6)) return true;
      if (heads.some((h) => h.w * h.h < 4000 && inter(pr, h) > 6)) return true;
      if (segs.some((g) => segDist(x, y, g.s) < 9 + g.sw / 2)) return true;
      return placed.some((q, j) => j !== self && Math.hypot(q.x - x, q.y - y) < 22);
    };
    m.pins.forEach((p, i) => {
      if (!bad(p.x, p.y, i)) return;
      let best = null;
      for (let r = 4; r <= 48 && !best; r += 3)
        for (let a = 0; a < 24 && !best; a++) {
          const x = Math.round(p.x + r * Math.cos((a / 24) * 2 * Math.PI));
          const y = Math.round(p.y + r * Math.sin((a / 24) * 2 * Math.PI));
          if (!bad(x, y, i)) best = { x, y };
        }
      if (best) {
        placed[i] = best;
        out.push({ ctx: m.ctx, sim: m.sim, title: p.title, from: [p.x, p.y], to: [best.x, best.y] });
      } else out.push({ ctx: m.ctx, sim: m.sim, title: p.title, from: [p.x, p.y], to: null });
    });
  });
  return out;
};
