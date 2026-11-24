/* Browser-side measurement for scripts/audit-svg.tsx (plain JS so it is injected verbatim). */
window.measureSvgs = function (meta) {
  const res = [];
  const inter = (a, b) => Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  document.querySelectorAll("svg.case").forEach((svg) => {
    const m = meta[Number(svg.dataset.k)];
    const box = svg.getBoundingClientRect();
    const toUser = (r, t) => ({ x: r.left - box.left - 24, y: r.top - box.top - 24, w: r.width, h: r.height, t });
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
      if (a.x < -1 || a.y < -1 || a.x + a.w > 401 || a.y + a.h > 241) res.push(`clip     ${where}: "${a.t}" at ${a.x.toFixed(0)},${a.y.toFixed(0)} w${a.w.toFixed(0)}`);
    for (let i = 0; i < texts.length; i++)
      for (let j = i + 1; j < texts.length; j++) {
        const a = texts[i];
        const b = texts[j];
        const ov = inter(a, b);
        if (ov > 6 && ov > 0.12 * Math.min(a.w * a.h, b.w * b.h)) res.push(`overlap  ${where}: "${a.t}" × "${b.t}"`);
      }
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
      if (p.x < 10 || p.y < 10 || p.x > 390 || p.y > 230) res.push(`pin      ${where}: pin ${p.i} at the edge`);
    }
  });
  return res;
};
