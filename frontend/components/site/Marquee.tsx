/** Lavender marquee band. Words come from the published service names + the tagline. */
export function Marquee({ words }: { words: string[] }) {
  const run = (k: string) => (
    <div key={k} className="marquee__run">
      {[0, 1].flatMap((r) =>
        words.map((w, i) => (
          <span key={`${r}-${i}`} style={{ display: 'contents' }}>
            <span className={i % 2 ? 'marquee__b' : 'marquee__a'}>{w}</span>
            <span className="marquee__d" />
          </span>
        )),
      )}
    </div>
  );
  return (
    <div aria-hidden="true" className="marquee">
      <div className="marquee__track">
        {run('a')}
        {run('b')}
      </div>
    </div>
  );
}
