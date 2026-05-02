"use client";

import { FormEvent, useMemo, useState } from "react";

type CheckStatus = "pass" | "warn" | "fail";

interface ValidationCheck {
  id: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

interface ValidationResult {
  ok: boolean;
  level: "L0" | "L1" | "L2" | "L3" | null;
  url: string;
  agentUrl: string;
  checks: ValidationCheck[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

const sampleChecks: ValidationCheck[] = [
  {
    id: "discovery.page_agent",
    status: "pass",
    message: "Page-specific .agent document is reachable",
  },
  {
    id: "document.intent",
    status: "pass",
    message: "@intent is present",
  },
  {
    id: "companion.llms_txt",
    status: "warn",
    message: "/llms.txt companion is reachable",
  },
];

export default function Home() {
  const [url, setUrl] = useState("https://agentviewlayer.org");
  const [result, setResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const checks = result?.checks ?? sampleChecks;
  const summaryText = useMemo(() => {
    if (!result) return "Run a URL to see conformance, discovery, and companion checks.";
    return `${result.summary.passed} passed, ${result.summary.warnings} warnings, ${result.summary.failed} failed`;
  }, [result]);

  async function validate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const body = await response.json();
      if (!response.ok) {
        throw new Error(body.error ?? "Validation failed.");
      }
      setResult(body as ValidationResult);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Validation failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="site-shell">
      <header className="nav">
        <a className="brand" href="/">
          <span className="brand-mark">A</span>
          <span>Agent View Layer</span>
        </a>
        <nav className="nav-links" aria-label="Primary navigation">
          <a href="#validator">Validator</a>
          <a href="#explainer">What is AVL?</a>
          <a href="#examples">Examples</a>
          <a href="#levels">Conformance</a>
          <a href="https://github.com/frontier-infra/avl">GitHub</a>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>Agent View Layer</h1>
          <p className="lede">
            A producer-owned web view for AI agents. Publish clean
            `text/agent-view` companions so agents can understand pages without
            scraping pixels.
          </p>
          <p className="hero-note">
            Put in a URL and see whether agents can discover, read, and cite the
            site from its own structured companion view.
          </p>
          <div className="hero-actions">
            <a className="button primary" href="#validator">
              Validate your site
            </a>
            <a
              className="button secondary"
              href="https://github.com/frontier-infra/avl/blob/main/AI-IMPLEMENTATION.md"
            >
              Implementation guide
            </a>
          </div>
        </div>

        <section className="validator-panel" id="validator" aria-label="AVL validator">
          <div className="panel-header">
            <div>
              <h2 className="panel-title">AVL Validator</h2>
              <p className="panel-subtitle">
                Check discovery, document structure, TOON state, actions, and
                `llms.txt` readiness.
              </p>
            </div>
            <span className="status-chip">LIVE</span>
          </div>

          <form className="validator-form" onSubmit={validate}>
            <input
              className="url-input"
              aria-label="URL to validate"
              inputMode="url"
              onChange={event => setUrl(event.target.value)}
              placeholder="https://example.com"
              value={url}
            />
            <button className="submit-button" disabled={loading} type="submit">
              {loading ? "Checking" : "Validate"}
            </button>
          </form>

          {error ? <div className="error">{error}</div> : null}

          <div className="result">
            <div className="result-top">
              <div className={`grade ${result?.level ? "" : "invalid"}`}>
                {result?.level ?? "AVL"}
              </div>
              <div className="summary">
                <strong>{result?.ok ? "Ready to cite" : "Conformance check"}</strong>
                <br />
                {summaryText}
              </div>
            </div>

            <div className="checks">
              {checks.map((check, index) => (
                <div className="check" key={`${check.id}-${index}`}>
                  <span className={`check-status ${check.status}`}>
                    {check.status.toUpperCase()}
                  </span>
                  <div>
                    <p className="check-id">{check.id}</p>
                    <p className="check-message">
                      {check.message}
                      {check.detail ? ` (${check.detail})` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </section>

      <section className="section explainer" id="explainer">
        <div>
          <h2>What is AVL?</h2>
          <p className="section-lede">
            AVL gives every human page a parallel agent view. The site owner
            publishes the facts, intent, actions, context, and navigation
            directly, so agents do not have to guess from layout.
          </p>
        </div>
        <div className="flow-diagram" aria-label="AVL flow diagram">
          <div className="flow-node human">
            <span>Human page</span>
            <strong>/pricing</strong>
          </div>
          <div className="flow-path" />
          <div className="flow-node agent">
            <span>Agent view</span>
            <strong>/pricing.agent</strong>
          </div>
          <div className="flow-path" />
          <div className="flow-node result-node">
            <span>Agent result</span>
            <strong>Less scraping. Better citations.</strong>
          </div>
        </div>
      </section>

      <section className="section" id="levels">
        <h2>Conformance that starts useful and grows up.</h2>
        <p className="section-lede">
          AVL adoption should not require a rewrite. Start with intent and
          discovery, then add structured state, actions, context, and navigation.
        </p>
        <div className="level-grid">
          <article className="level">
            <strong>L0</strong>
            <p>`@meta`, `@intent`, and discovery so agents know what a page is for.</p>
          </article>
          <article className="level">
            <strong>L1</strong>
            <p>Add `@state` so agents can read page data without DOM scraping.</p>
          </article>
          <article className="level">
            <strong>L2</strong>
            <p>Add `@actions` so agents can understand the affordances available.</p>
          </article>
          <article className="level">
            <strong>L3</strong>
            <p>Add `@context` and `@nav` for meaning, traversal, and citations.</p>
          </article>
        </div>
      </section>

      <section className="section examples" id="examples">
        <h2>Real `.agent` outputs.</h2>
        <p className="section-lede">
          AVL is intentionally readable. These are the kinds of companion views
          an agent can fetch before deciding what to do next.
        </p>
        <div className="example-grid">
          <article className="agent-example">
            <div className="example-header">
              <strong>AgentViewLayer.org</strong>
              <a href="/.agent">Open .agent</a>
            </div>
            <pre>{`@intent
  purpose: Public standards home and validator
  audience: developer, maintainer, ai-agent
  capability: validate, learn, implement, cite

@actions
  - id: validate_url
    method: POST
    href: /api/validate`}</pre>
          </article>
          <article className="agent-example">
            <div className="example-header">
              <strong>AINode.dev</strong>
              <a href="https://ainode.dev/.agent">Open .agent</a>
            </div>
            <pre>{`@meta
  route: /

@state
  product: AINode
  category: local AI infrastructure

@nav
  self: /.agent
  parents: [/]`}</pre>
          </article>
        </div>
      </section>

      <section className="section" id="resources">
        <h2>Built for adoption.</h2>
        <p className="section-lede">
          The public site is the front door. The GitHub repo remains the source
          of truth for the package, spec, CMS adapters, fixtures, and validator.
        </p>
        <div className="resource-grid">
          <a className="resource" href="https://github.com/frontier-infra/avl">
            <strong>GitHub</strong>
            <p>Reference implementation, specs, fixtures, and CMS integrations.</p>
          </a>
          <a
            className="resource"
            href="https://github.com/frontier-infra/avl/blob/main/AI-IMPLEMENTATION.md"
          >
            <strong>AI implementation brief</strong>
            <p>Give this to a coding agent and let it add AVL to a project.</p>
          </a>
          <a className="resource" href="/.agent">
            <strong>This site's agent view</strong>
            <p>AgentViewLayer.org ships its own AVL routes and manifest.</p>
          </a>
        </div>
      </section>

      <section className="code-band" aria-label="Command example">
        <pre>{`npx @frontier-infra/avl validate https://example.com
curl https://agentviewlayer.org/.agent
curl https://agentviewlayer.org/agent.txt`}</pre>
      </section>

      <footer className="footer">
        <div className="footer-grid">
          <div>
            <strong>Agent View Layer</strong>
            <p>
              Offered to the agentic web by{" "}
              <a href="https://github.com/webdevtodayjason">Jason Brashear</a>,
              built in public so the next generation of sites can be understood
              instead of scraped.
            </p>
          </div>
          <div className="footer-links">
            <a href="/spec">Spec</a>
            <a href="https://github.com/frontier-infra/avl">GitHub</a>
            <a href="/docs">Docs</a>
            <a href="/directory">Directory</a>
            <a href="https://github.com/frontier-infra/avl/issues">Community</a>
          </div>
        </div>
        <div className="badge-row" aria-label="Project badges">
          <a href="https://github.com/frontier-infra/agentviewlayer.org">GitHub</a>
          <a href="https://coderabbit.ai">Reviewed with CodeRabbit</a>
          <a href="https://blacksmith.sh">CI ready for Blacksmith</a>
          <a href="https://pages.cloudflare.com">Powered by Cloudflare Pages</a>
          <a href="https://jasonbrashear.com">Created by Jason Brashear</a>
        </div>
      </footer>
    </main>
  );
}
