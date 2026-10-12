/**
 * The design's animated network diagram (buildTopo). Deterministic for a given
 * seed, so it renders identically on the server and the client.
 */
const C = { line: '#3D3275', hub: '#B9A6FF', flow: '#FF8FC7', node: '#0D0A1C', ns: '#9B82FF', glow: '#FF8FC7', label: '#C9BAFF' };

function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type P = { x: number; y: number; l?: string };
const r1 = (n: number) => Math.round(n * 10) / 10;

export function Topology({ seed, labels = ['APPLICATIONS', 'CLOUD', 'INTEGRATION', 'DATA'] }: { seed: number; labels?: string[] }) {
  const R = rng(seed);
  const core = { x: 450, y: 400 };
  const hubs: P[] = [
    { x: 230, y: 210, l: labels[0] },
    { x: 680, y: 190, l: labels[1] },
    { x: 690, y: 620, l: labels[2] },
    { x: 220, y: 600, l: labels[3] },
  ];
  const nodes: P[] = [];
  const edges: [P, P, number][] = [];
  hubs.forEach((hb) => {
    for (let i = 0; i < 8; i++) {
      const g = R() * Math.PI * 2;
      const r = 50 + R() * 100;
      const nd = { x: r1(hb.x + Math.cos(g) * r), y: r1(hb.y + Math.sin(g) * r) };
      nodes.push(nd);
      edges.push([hb, nd, 0]);
    }
    edges.push([hb, core, 1]);
  });
  for (let i = 0; i < nodes.length; i++)
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[i].x - nodes[j].x;
      const dy = nodes[i].y - nodes[j].y;
      if (dx * dx + dy * dy < 80 * 80 && R() < 0.5) edges.push([nodes[i], nodes[j], 0]);
    }
  hubs.forEach((p, i) => edges.push([p, hubs[(i + 1) % 4], 2]));

  const base: React.ReactNode[] = [];
  const flows: React.ReactNode[] = [];
  edges.forEach(([p, q, t], i) => {
    if (t === 2) base.push(<line key={`e${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#5A4A9E" strokeWidth={1} strokeDasharray="2 8" style={{ animation: `mts-fade 1s ease ${1 + i * 0.02}s both` }} />);
    else
      base.push(
        <line key={`e${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} pathLength={1} stroke={t ? C.hub : C.line} strokeWidth={t ? 1.4 : 1} strokeDasharray={1} strokeDashoffset={1} style={{ animation: `mts-draw 1.4s cubic-bezier(.6,0,.2,1) ${(0.2 + i * 0.016).toFixed(3)}s forwards` }} />,
      );
    if (t === 1) flows.push(<line key={`f${i}`} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={C.flow} strokeWidth={2.4} strokeLinecap="round" strokeDasharray="3 37" style={{ animation: `mts-flow ${(2 + R() * 1.5).toFixed(2)}s linear infinite` }} />);
  });
  const dots: React.ReactNode[] = [];
  nodes.forEach((n, i) => {
    if (R() < 0.35) dots.push(<circle key={`g${i}`} cx={n.x} cy={n.y} r={8} fill={C.glow} style={{ opacity: 0.2, filter: 'blur(3px)', animation: `mts-glow ${(3 + R() * 3).toFixed(2)}s ease-in-out ${(R() * 4).toFixed(2)}s infinite` }} />);
    dots.push(<circle key={`n${i}`} cx={n.x} cy={n.y} r={r1(2.5 + R() * 2)} fill={C.node} stroke={C.ns} strokeWidth={1.2} />);
  });

  return (
    <svg viewBox="0 0 900 800" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" style={{ display: 'block' }} aria-hidden="true" focusable="false">
      <g>{base}</g>
      <g style={{ filter: 'drop-shadow(0 0 4px #FF8FC7)' }}>{flows}</g>
      {dots}
      {hubs.map((hb, i) => (
        <g key={`h${i}`}>
          <rect x={hb.x - 10} y={hb.y - 10} width={20} height={20} rx={4} fill={C.node} stroke={C.hub} strokeWidth={1.4} transform={`rotate(45 ${hb.x} ${hb.y})`} />
          <rect x={hb.x - 3} y={hb.y - 3} width={6} height={6} rx={1} fill={C.flow} style={{ filter: 'drop-shadow(0 0 4px #FF8FC7)' }} />
          <text x={hb.x + 20} y={hb.y - 18} fill={C.label} style={{ font: "500 12px 'JetBrains Mono', monospace", letterSpacing: '2px' }}>
            {hb.l}
          </text>
        </g>
      ))}
      <circle cx={core.x} cy={core.y} r={64} fill="none" stroke="#3D3275" strokeWidth={1} />
      <circle cx={core.x} cy={core.y} r={44} fill="none" stroke={C.flow} strokeWidth={1.2} strokeDasharray="4 8" style={{ transformOrigin: `${core.x}px ${core.y}px`, animation: 'mts-spin 24s linear infinite' }} />
      <circle cx={core.x} cy={core.y} r={20} fill={C.hub} style={{ filter: 'drop-shadow(0 0 16px #B9A6FF)' }} />
      <circle cx={core.x} cy={core.y} r={6} fill={C.glow} />
    </svg>
  );
}
