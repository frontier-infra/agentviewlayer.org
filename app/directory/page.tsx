export default function DirectoryPage() {
  return (
    <main className="site-shell">
      <header className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Agent View Layer</span>
        </a>
        <nav className="nav-links" aria-label="Directory navigation">
          <a href="/docs">Docs</a>
          <a href="/spec">Spec</a>
          <a href="/badges">Badges</a>
        </nav>
      </header>
      <section className="section">
        <h1>Adoption Directory</h1>
        <p className="section-lede">
          Verified AVL sites will appear here as adoption grows. The directory
          will start with sites that expose `/.agent`, `/agent.txt`, and
          validated L0-L3 conformance signals.
        </p>
        <div className="resource-grid">
          <a className="resource" href="https://ainode.dev/.agent">
            <strong>AINode.dev</strong>
            <p>Early production AVL implementation.</p>
          </a>
          <a className="resource" href="/.agent">
            <strong>AgentViewLayer.org</strong>
            <p>This standards site dogfoods AVL.</p>
          </a>
        </div>
      </section>
    </main>
  );
}
