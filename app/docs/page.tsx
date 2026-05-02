export default function DocsPage() {
  return (
    <main className="site-shell">
      <header className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Agent View Layer</span>
        </a>
        <nav className="nav-links" aria-label="Docs navigation">
          <a href="/spec">Spec</a>
          <a href="/badges">Badges</a>
          <a href="https://github.com/frontier-infra/avl">GitHub</a>
        </nav>
      </header>
      <section className="section">
        <h1>Implement AVL</h1>
        <p className="section-lede">
          Add a `text/agent-view` companion beside each important human page.
          Start with L0, validate, then deepen the document over time.
        </p>
        <div className="resource-grid">
          <a
            className="resource"
            href="https://github.com/frontier-infra/avl/blob/main/AI-IMPLEMENTATION.md"
          >
            <strong>AI implementation brief</strong>
            <p>Point a coding agent here when adding AVL to an existing project.</p>
          </a>
          <a
            className="resource"
            href="https://github.com/frontier-infra/avl/blob/main/CONFORMANCE.md"
          >
            <strong>Conformance</strong>
            <p>Review the L0-L3 requirements and validator check groups.</p>
          </a>
          <a
            className="resource"
            href="https://github.com/frontier-infra/avl/tree/main/plugins"
          >
            <strong>CMS adapters</strong>
            <p>WordPress, Ghost, Drupal, Joomla, Strapi, Directus, and Payload.</p>
          </a>
        </div>
      </section>
    </main>
  );
}
