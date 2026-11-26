import type { ReactNode } from "react";

/** One sandbox section: eyebrow number, heading, optional note, content. */
export function Section({ id, n, title, note, children }: { id: string; n: number; title: string; note?: string; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-20">
      <div className="t-eyebrow">Section {n}</div>
      <h2 id={`${id}-h`} className="t-title mt-2">
        {title}
      </h2>
      {note && <p className="t-secondary mt-2">{note}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}
