export default function Loading() {
  return (
    <div className="wrap" aria-busy="true" aria-live="polite" style={{ padding: 'clamp(130px,14vw,180px) var(--gutter) 96px' }}>
      <span className="sr-only">Loading…</span>
      <div className="skel" style={{ height: 14, width: 160, marginBottom: 28 }} />
      <div className="skel" style={{ height: 'clamp(42px,6vw,96px)', width: 'min(100%,720px)', marginBottom: 16 }} />
      <div className="skel" style={{ height: 'clamp(42px,6vw,96px)', width: 'min(80%,520px)', marginBottom: 48 }} />
      <div className="grid-auto" style={{ ['--min' as string]: '300px' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="skel" style={{ height: 260 }} />
        ))}
      </div>
    </div>
  );
}
