export default function SpecPage() {
  return (
    <main className="site-shell">
      <header className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Agent View Layer</span>
        </a>
        <nav className="nav-links" aria-label="Spec navigation">
          <a href="/docs">Docs</a>
          <a href="/badges">Badges</a>
          <a href="https://github.com/frontier-infra/avl">GitHub</a>
        </nav>
      </header>
      <section className="section">
        <h1>Spec</h1>
        <p className="section-lede">
          AVL documents use six sections: `@meta`, `@intent`, `@state`,
          `@actions`, `@context`, and `@nav`. The canonical spec lives in the
          GitHub repository so implementations can track versioned changes.
        </p>
        <div className="code-band">
          <pre>{`@meta
  v: 1
  route: /pricing
  generated: 2026-05-02T12:00:00Z

@intent
  purpose: Pricing page
  audience: visitor, buyer, agent
  capability: read, compare, buy`}</pre>
        </div>
      </section>
    </main>
  );
}
