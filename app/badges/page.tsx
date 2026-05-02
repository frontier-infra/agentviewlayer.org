export default function BadgesPage() {
  return (
    <main className="site-shell">
      <header className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Agent View Layer</span>
        </a>
        <nav className="nav-links" aria-label="Badges navigation">
          <a href="/docs">Docs</a>
          <a href="/spec">Spec</a>
          <a href="/directory">Directory</a>
        </nav>
      </header>
      <section className="section">
        <h1>Badges</h1>
        <p className="section-lede">
          The badge program will let sites show verified AVL readiness. The
          first version will use the validator result and graduate sites across
          L0, L1, L2, and L3.
        </p>
        <div className="level-grid">
          {["L0", "L1", "L2", "L3"].map(level => (
            <article className="level" key={level}>
              <strong>AVL {level} Ready</strong>
              <p>Verified by AgentViewLayer.org validator checks.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
