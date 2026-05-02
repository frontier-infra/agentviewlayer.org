import { validateAgentViewText, withGuidance, type ValidationCheck } from "./validator";

export interface SiteValidationResult {
  ok: boolean;
  level: "L0" | "L1" | "L2" | "L3" | null;
  url: string;
  agentUrl: string;
  checks: ValidationCheck[];
  sections: string[];
  summary: {
    passed: number;
    warnings: number;
    failed: number;
  };
}

const MAX_BYTES = 512_000;
const TIMEOUT_MS = 8_000;

export async function validateSiteUrl(input: string): Promise<SiteValidationResult> {
  const url = normalizePublicUrl(input);
  const agentUrl = companionUrlFor(url);
  const manifestUrl = new URL("/agent.txt", url.origin);
  const llmsUrl = new URL("/llms.txt", url.origin);
  const checks: ValidationCheck[] = [];

  const html = await fetchOptionalText(url, "text/html");
  checks.push({
    id: "discovery.html",
    status: html.ok ? "pass" : "warn",
    message: "Human page is reachable",
    detail: html.detail,
  });
  if (html.ok) {
    checks.push({
      id: "discovery.html_alternate",
      status: hasHtmlAlternate(html.text) ? "pass" : "warn",
      message: "HTML exposes an alternate text/agent-view link",
    });
    checks.push({
      id: "discovery.body_link",
      status: hasBodyAgentLink(html.text) ? "pass" : "warn",
      message: "HTML exposes a crawlable body link or AVL badge",
    });
  }

  const manifest = await fetchOptionalText(manifestUrl, "text/plain");
  checks.push({
    id: "discovery.manifest",
    status: manifest.ok ? "pass" : "warn",
    message: "/agent.txt discovery manifest is reachable",
    detail: manifest.detail,
  });
  if (manifest.ok) {
    checks.push({
      id: "manifest.content_type",
      status: /text\/agent-view/i.test(manifest.text) ? "pass" : "warn",
      message: "/agent.txt declares text/agent-view support",
    });
  }

  const llms = await fetchOptionalText(llmsUrl, "text/plain");
  checks.push({
    id: "companion.llms_txt",
    status: llms.ok ? "pass" : "warn",
    message: "/llms.txt companion is reachable",
    detail: llms.detail,
  });

  const agent = await fetchOptionalText(agentUrl, "text/agent-view");
  if (!agent.ok) {
    checks.push({
      id: "discovery.page_agent",
      status: "fail",
      message: "Page-specific .agent document is reachable",
      detail: agent.detail,
    });
    return finish(url, agentUrl, checks, null, []);
  }

  checks.push({
    id: "discovery.page_agent",
    status: "pass",
    message: "Page-specific .agent document is reachable",
  });

  const report = validateAgentViewText(agent.text, {
    source: agentUrl.toString(),
    contentType: agent.contentType,
  });

  return finish(url, agentUrl, [...checks, ...report.checks], report.level, report.sections);
}

function finish(
  url: URL,
  agentUrl: URL,
  checks: ValidationCheck[],
  level: SiteValidationResult["level"],
  sections: string[]
): SiteValidationResult {
  return {
    ok: checks.every(check => check.status !== "fail"),
    level,
    url: url.toString(),
    agentUrl: agentUrl.toString(),
    checks: checks.map(withGuidance),
    sections,
    summary: {
      passed: checks.filter(check => check.status === "pass").length,
      warnings: checks.filter(check => check.status === "warn").length,
      failed: checks.filter(check => check.status === "fail").length,
    },
  };
}

function normalizePublicUrl(input: string): URL {
  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const url = new URL(withProtocol);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Only HTTP and HTTPS URLs can be validated.");
  }
  if (url.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("Only HTTPS URLs can be validated in production.");
  }
  if (isBlockedHostname(url.hostname)) {
    throw new Error("Private, local, and internal hostnames cannot be validated.");
  }
  url.hash = "";
  return url;
}

function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "0.0.0.0" ||
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
    host === "::1" ||
    host.startsWith("[::1]")
  );
}

function companionUrlFor(url: URL): URL {
  if (url.pathname === "/" || url.pathname === "") return new URL("/.agent", url.origin);
  return new URL(`${url.pathname.replace(/\/+$/, "")}.agent`, url.origin);
}

async function fetchOptionalText(
  url: URL,
  accept: string
): Promise<
  | { ok: true; text: string; contentType: string | null; detail: string }
  | { ok: false; text: ""; contentType: null; detail: string }
> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: { accept },
      redirect: "follow",
      signal: controller.signal,
    });
    const contentLength = response.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      return {
        ok: false,
        text: "",
        contentType: null,
        detail: "response too large",
      };
    }

    const text = (await response.text()).slice(0, MAX_BYTES);
    if (!response.ok) {
      return {
        ok: false,
        text: "",
        contentType: null,
        detail: `${response.status} ${response.statusText}`,
      };
    }

    return {
      ok: true,
      text,
      contentType: response.headers.get("content-type"),
      detail: `${response.status} ${response.statusText}`,
    };
  } catch (error) {
    return {
      ok: false,
      text: "",
      contentType: null,
      detail: error instanceof Error ? error.message : "request failed",
    };
  } finally {
    clearTimeout(timeout);
  }
}

function hasHtmlAlternate(html: string): boolean {
  return /<link\b[^>]*rel=["'][^"']*alternate[^"']*["'][^>]*type=["']text\/agent-view/i.test(
    html
  );
}

function hasBodyAgentLink(html: string): boolean {
  return /<body[\s\S]*?(rel=["'][^"']*agent-view[^"']*["']|data-avl|avl-badge|\.agent)/i.test(
    html
  );
}
