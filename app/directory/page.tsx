const adopters = [
  {
    rank: 1,
    name: "AINode.dev",
    href: "https://ainode.dev/.agent",
    site: "https://ainode.dev",
    level: "L3",
    status: "Early production",
    added: "2026-04-16",
  },
  {
    rank: 2,
    name: "AgentViewLayer.org",
    href: "/.agent",
    site: "https://agentviewlayer.org",
    level: "L3",
    status: "Self dogfood",
    added: "2026-05-02",
  },
];

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
          validated L0-L3 conformance signals. Passing validation does not add a
          site automatically yet; listings are reviewed before publication so the
          directory stays useful and spam-free. Early adopters keep their
          position number and date added as a public badge of honor.
        </p>
        <div className="directory-list">
          {adopters.map(adopter => (
            <article className="directory-entry" key={adopter.rank}>
              <div className="directory-rank">#{adopter.rank}</div>
              <div>
                <h2>{adopter.name}</h2>
                <p>{adopter.status}</p>
                <div className="directory-meta">
                  <span>AVL {adopter.level}</span>
                  <span>Added {adopter.added}</span>
                  <a href={adopter.href}>Open .agent</a>
                  <a href={adopter.site}>Visit site</a>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
