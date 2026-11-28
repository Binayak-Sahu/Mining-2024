/** §5.3 6 px progress bar: track --surface-2, fill success. */
export function ProgressBar({ f, label }: { f: number; label: string }) {
  const pct = Math.round(f * 100);
  return (
    <div className="h-[6px] rounded-full overflow-hidden bg-surface-2" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label={label}>
      <div className="h-full rounded-full bg-progress" style={{ width: `${pct}%` }} />
    </div>
  );
}
