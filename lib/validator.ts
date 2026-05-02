export type ConformanceLevel = "L0" | "L1" | "L2" | "L3";
export type ValidationStatus = "pass" | "warn" | "fail";

export interface ValidationCheck {
  id: string;
  status: ValidationStatus;
  message: string;
  detail?: string;
  guidance?: ValidationGuidance;
}

export interface ValidationGuidance {
  problem: string;
  fix: string[];
  resources: {
    label: string;
    href: string;
  }[];
}

export interface ValidationReport {
  ok: boolean;
  level: ConformanceLevel | null;
  source?: string;
  checks: ValidationCheck[];
  sections: string[];
}

interface AgentViewSections {
  meta?: string;
  intent?: string;
  state?: string;
  actions?: string;
  context?: string;
  nav?: string;
  [section: string]: string | undefined;
}

const KNOWN_SECTIONS = new Set([
  "meta",
  "intent",
  "state",
  "actions",
  "context",
  "nav",
]);

export function validateAgentViewText(
  text: string,
  options: { source?: string; contentType?: string | null } = {}
): ValidationReport {
  const parsed = parseAgentViewSections(text);
  const checks: ValidationCheck[] = [];

  if (options.contentType) {
    checks.push({
      id: "document.content_type",
      status: options.contentType.toLowerCase().includes("text/agent-view")
        ? "pass"
        : "warn",
      message: "Content-Type advertises text/agent-view",
      detail: options.contentType,
    });
  }

  for (const duplicate of parsed.duplicates) {
    checks.push({
      id: "document.duplicate_section",
      status: "fail",
      message: `Duplicate @${duplicate} section`,
    });
  }

  for (const unknown of parsed.unknownSections) {
    checks.push({
      id: "document.unknown_section",
      status: "warn",
      message: `Unknown @${unknown} section`,
    });
  }

  addSectionChecks(checks, parsed.sections);
  addToonChecks(checks, parsed.sections.state);
  addActionsChecks(checks, parsed.sections.actions);

  const level = inferConformanceLevel(parsed.sections, checks);
  return {
    ok: checks.every(check => check.status !== "fail"),
    level,
    source: options.source,
    checks: checks.map(withGuidance),
    sections: Object.keys(parsed.sections),
  };
}

function parseAgentViewSections(text: string): {
  sections: AgentViewSections;
  duplicates: string[];
  unknownSections: string[];
} {
  const sections: AgentViewSections = {};
  const duplicates: string[] = [];
  const unknownSections: string[] = [];
  let current: string | null = null;
  let buffer: string[] = [];

  const flush = () => {
    if (!current) return;
    if (sections[current] !== undefined) duplicates.push(current);
    sections[current] = buffer.join("\n").trimEnd();
    buffer = [];
  };

  for (const line of text.replace(/\r\n/g, "\n").split("\n")) {
    const match = /^@([A-Za-z][A-Za-z0-9_-]*)\s*$/.exec(line);
    if (match) {
      flush();
      current = match[1];
      if (!KNOWN_SECTIONS.has(current)) unknownSections.push(current);
      continue;
    }
    if (current) buffer.push(line);
  }

  flush();
  return { sections, duplicates, unknownSections };
}

function addSectionChecks(checks: ValidationCheck[], sections: AgentViewSections) {
  const meta = parseKeyValueBlock(sections.meta ?? "");
  const intent = parseKeyValueBlock(sections.intent ?? "");

  checks.push(requiredSection("document.meta", sections.meta, "@meta is present"));
  checks.push(requiredField("document.meta.v", meta.v, "@meta.v is present"));
  checks.push(requiredField("document.meta.route", meta.route, "@meta.route is present"));
  checks.push(
    requiredField(
      "document.meta.generated",
      meta.generated,
      "@meta.generated is present"
    )
  );
  checks.push(requiredSection("document.intent", sections.intent, "@intent is present"));
  checks.push(
    requiredField(
      "document.intent.purpose",
      intent.purpose,
      "@intent.purpose is present"
    )
  );
  checks.push(
    requiredField(
      "document.intent.audience",
      intent.audience,
      "@intent.audience is present"
    )
  );
  checks.push(
    requiredField(
      "document.intent.capability",
      intent.capability,
      "@intent.capability is present"
    )
  );
  checks.push(optionalSection("document.state", sections.state, "@state is present"));
  checks.push(optionalSection("document.actions", sections.actions, "@actions is present"));
  checks.push(optionalSection("document.context", sections.context, "@context is present"));
  checks.push(optionalSection("document.nav", sections.nav, "@nav is present"));
}

function addToonChecks(checks: ValidationCheck[], state: string | undefined) {
  if (!state) return;
  const lines = state.replace(/\r\n/g, "\n").split("\n");
  let tableCount = 0;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() === "") continue;

    if (leadingSpaces(line) % 2 !== 0) {
      checks.push({
        id: "toon.indentation",
        status: "fail",
        message: "TOON indentation uses two-space levels",
        detail: `line ${i + 1}: ${line}`,
      });
    }

    const scalarList = /^(\s*)[A-Za-z_][A-Za-z0-9_-]*\[(\d+)]\s*:\s*(.+)$/.exec(line);
    if (scalarList) {
      const expected = Number(scalarList[2]);
      const values = splitCsv(scalarList[3]);
      checks.push({
        id: "toon.list_count",
        status: values.length === expected ? "pass" : "fail",
        message: "TOON inline list count matches values",
        detail:
          values.length === expected
            ? undefined
            : `line ${i + 1}: expected ${expected}, found ${values.length}`,
      });
      continue;
    }

    const tableHeader =
      /^(\s*)[A-Za-z_][A-Za-z0-9_-]*\[(\d+)]\{([^}]*)}\s*:\s*$/.exec(line);
    if (!tableHeader) continue;

    tableCount += 1;
    const baseIndent = tableHeader[1].length;
    const expectedRows = Number(tableHeader[2]);
    const fields = tableHeader[3].split(",").map(field => field.trim());
    let rows = 0;

    for (let rowIndex = i + 1; rowIndex < lines.length; rowIndex += 1) {
      const row = lines[rowIndex];
      if (row.trim() === "") continue;
      if (leadingSpaces(row) <= baseIndent) break;
      rows += 1;
      const values = splitCsv(row.trim());
      checks.push({
        id: "toon.table_columns",
        status: values.length === fields.length ? "pass" : "fail",
        message: "TOON table row column count matches header",
        detail:
          values.length === fields.length
            ? undefined
            : `line ${rowIndex + 1}: expected ${fields.length}, found ${values.length}`,
      });
      i = rowIndex;
    }

    checks.push({
      id: "toon.table_rows",
      status: rows === expectedRows ? "pass" : "fail",
      message: "TOON table row count matches declaration",
      detail:
        rows === expectedRows
          ? undefined
          : `line ${i + 1}: expected ${expectedRows}, found ${rows}`,
    });
  }

  checks.push({
    id: "toon.profile",
    status: "pass",
    message:
      tableCount > 0
        ? "TOON state profile checked"
        : "TOON state profile checked with no tabular collections",
  });
}

function addActionsChecks(checks: ValidationCheck[], actions: string | undefined) {
  if (!actions) return;
  checks.push({
    id: "document.actions.ids",
    status: /^\s*-\s+id\s*:/m.test(actions) ? "pass" : "warn",
    message: "@actions includes at least one action id",
  });
}

function inferConformanceLevel(
  sections: AgentViewSections,
  checks: ValidationCheck[]
): ConformanceLevel | null {
  const required = [
    "document.meta",
    "document.meta.v",
    "document.meta.route",
    "document.meta.generated",
    "document.intent",
    "document.intent.purpose",
    "document.intent.audience",
    "document.intent.capability",
  ].every(id => checks.find(check => check.id === id)?.status === "pass");

  if (!required) return null;
  if (sections.state && sections.actions && sections.context && sections.nav) return "L3";
  if (sections.state && sections.actions) return "L2";
  if (sections.state) return "L1";
  return "L0";
}

function requiredSection(
  id: string,
  body: string | undefined,
  message: string
): ValidationCheck {
  return { id, status: body !== undefined ? "pass" : "fail", message };
}

function optionalSection(
  id: string,
  body: string | undefined,
  message: string
): ValidationCheck {
  return { id, status: body !== undefined ? "pass" : "warn", message };
}

function requiredField(
  id: string,
  value: string | undefined,
  message: string
): ValidationCheck {
  return { id, status: value && value.trim() ? "pass" : "fail", message };
}

function parseKeyValueBlock(block: string): Record<string, string> {
  const values: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_-]*)\s*:\s*(.*?)\s*$/.exec(line);
    if (match) values[match[1]] = match[2];
  }
  return values;
}

function leadingSpaces(line: string): number {
  return line.length - line.trimStart().length;
}

function splitCsv(input: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;
  let escaped = false;

  for (const char of input) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (char === "\\" && quoted) {
      escaped = true;
      current += char;
      continue;
    }
    if (char === '"') {
      quoted = !quoted;
      current += char;
      continue;
    }
    if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  values.push(current.trim());
  return values.filter(value => value.length > 0);
}

export function withGuidance(check: ValidationCheck): ValidationCheck {
  const guidance = guidanceById[check.id] ?? fallbackGuidance(check);
  return { ...check, guidance };
}

const implementationGuide =
  "https://github.com/frontier-infra/avl/blob/main/AI-IMPLEMENTATION.md";
const conformanceGuide =
  "https://github.com/frontier-infra/avl/blob/main/CONFORMANCE.md";
const toonGuide =
  "https://github.com/frontier-infra/avl/blob/main/specs/toon-grammar.md";
const discoveryGuide =
  "https://github.com/frontier-infra/avl/blob/main/specs/discovery.md";

const guidanceById: Record<string, ValidationGuidance> = {
  "document.content_type": {
    problem:
      "The agent document should be served as text/agent-view so agents can identify it without sniffing content.",
    fix: [
      "Set the response Content-Type header to text/agent-view; version=1; charset=utf-8.",
      "If the file is static, add a hosting header rule for .agent files.",
    ],
    resources: [
      { label: "Implementation guide", href: implementationGuide },
      { label: "Conformance checks", href: conformanceGuide },
    ],
  },
  "document.meta": {
    problem: "The document is missing the @meta section.",
    fix: [
      "Add @meta at the top of the .agent document.",
      "Include v, route, generated, and optionally ttl.",
    ],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.meta.v": {
    problem: "@meta.v tells consumers which AVL version this document uses.",
    fix: ["Add `v: 1` inside @meta."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.meta.route": {
    problem: "@meta.route tells agents which human route this companion describes.",
    fix: ["Add `route: /your-page` inside @meta."],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.meta.generated": {
    problem: "@meta.generated tells agents how fresh the companion view is.",
    fix: ["Add an ISO timestamp, for example `generated: 2026-05-02T12:00:00Z`."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.intent": {
    problem: "The document is missing @intent, the core section that explains why the page exists.",
    fix: [
      "Add @intent after @meta.",
      "Include purpose, audience, and capability fields.",
    ],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.intent.purpose": {
    problem: "@intent.purpose lets agents decide whether this page is relevant.",
    fix: ["Add a concise purpose, such as `purpose: Pricing page for product plans`."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.intent.audience": {
    problem: "@intent.audience tells agents who the page is intended for.",
    fix: ["Add audiences, for example `audience: visitor, buyer, ai-agent`."],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.intent.capability": {
    problem: "@intent.capability tells agents what this page supports.",
    fix: ["Add capabilities, for example `capability: read, compare, buy`."],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.state": {
    problem: "Without @state, agents still need to infer page data from prose or HTML.",
    fix: [
      "Add @state with the structured data behind the page.",
      "Use TOON for lists and tables when the data is repetitive.",
    ],
    resources: [
      { label: "TOON grammar", href: toonGuide },
      { label: "Implementation guide", href: implementationGuide },
    ],
  },
  "document.actions": {
    problem: "Without @actions, agents cannot tell what useful operations are available from this page.",
    fix: [
      "Add @actions for safe, available affordances.",
      "Include id, method, and href for each action.",
    ],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.actions.ids": {
    problem: "Actions need stable IDs so agents can refer to them predictably.",
    fix: ["Add `- id: action_name` to each action block."],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.context": {
    problem: "Without @context, agents miss the short human meaning of the current page state.",
    fix: ["Add @context with one or two concise quoted summary lines."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.nav": {
    problem: "Without @nav, agents have fewer signals for traversal and related pages.",
    fix: ["Add @nav with self, parents, peers, or drilldown links where relevant."],
    resources: [{ label: "Implementation guide", href: implementationGuide }],
  },
  "document.duplicate_section": {
    problem: "Duplicate sections make the document ambiguous for parsers.",
    fix: ["Keep only one section for each @meta, @intent, @state, @actions, @context, and @nav block."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  },
  "document.unknown_section": {
    problem: "Unknown sections may be ignored by current validators and agents.",
    fix: ["Move experimental data into a known section or document it as an extension."],
    resources: [{ label: "Spec", href: "https://github.com/frontier-infra/avl/blob/main/specs/avl-agent-view-layer.md" }],
  },
  "toon.indentation": {
    problem: "TOON uses two-space indentation. Odd indentation can break parsing.",
    fix: ["Normalize nested TOON lines to two spaces per level."],
    resources: [{ label: "TOON grammar", href: toonGuide }],
  },
  "toon.list_count": {
    problem: "A TOON inline list declares a count that does not match the number of values.",
    fix: ["Update the count in brackets or add/remove list values so they match."],
    resources: [{ label: "TOON grammar", href: toonGuide }],
  },
  "toon.table_columns": {
    problem: "A TOON table row has a different number of values than the header fields.",
    fix: [
      "Compare the row to the table header.",
      "Add missing values, remove extras, or quote comma-containing strings.",
    ],
    resources: [{ label: "TOON grammar", href: toonGuide }],
  },
  "toon.table_rows": {
    problem: "A TOON table declares a row count that does not match the rows provided.",
    fix: ["Update the declared count or add/remove rows so the table is consistent."],
    resources: [{ label: "TOON grammar", href: toonGuide }],
  },
  "toon.profile": {
    problem: "TOON profile checks describe whether the @state shape is parser-friendly.",
    fix: ["No action needed when this passes. If related TOON checks fail, fix those first."],
    resources: [{ label: "TOON grammar", href: toonGuide }],
  },
  "discovery.html": {
    problem: "The human page needs to be reachable so validators and agents can discover companion signals.",
    fix: ["Confirm the URL is public, returns HTTP 200, and is not blocked by redirects or bot protection."],
    resources: [{ label: "Discovery guidance", href: discoveryGuide }],
  },
  "discovery.html_alternate": {
    problem: "The HTML page does not advertise its agent companion in the head.",
    fix: [
      "Add `<link rel=\"alternate\" type=\"text/agent-view\" href=\"/page.agent\">` to the page head.",
      "For the homepage, point the href to `/.agent`.",
    ],
    resources: [
      { label: "Discovery guidance", href: discoveryGuide },
      { label: "Implementation guide", href: implementationGuide },
    ],
  },
  "discovery.body_link": {
    problem: "The page does not expose a crawlable body link or AVL badge.",
    fix: [
      "Add a visible or visually-hidden anchor to the .agent companion.",
      "If you show an AVL badge, make the badge link to the page's .agent file.",
    ],
    resources: [
      { label: "Badge program", href: "https://agentviewlayer.org/badges" },
      { label: "Discovery guidance", href: discoveryGuide },
    ],
  },
  "discovery.manifest": {
    problem: "The site-level /agent.txt manifest is missing or unreachable.",
    fix: [
      "Create `/agent.txt` at the site root.",
      "List supported discovery routes, content type, and companion resources.",
    ],
    resources: [{ label: "Discovery guidance", href: discoveryGuide }],
  },
  "manifest.content_type": {
    problem: "/agent.txt does not clearly declare text/agent-view support.",
    fix: ["Add a line such as `content-type: text/agent-view; version=1` to /agent.txt."],
    resources: [{ label: "Discovery guidance", href: discoveryGuide }],
  },
  "companion.llms_txt": {
    problem: "The site does not expose /llms.txt, the companion summary file for LLMs.",
    fix: [
      "Create `/llms.txt` with a concise project summary and important links.",
      "Link to the AVL agent view and implementation docs where useful.",
    ],
    resources: [
      { label: "llms.txt proposal", href: "https://llmstxt.org/" },
      { label: "Implementation guide", href: implementationGuide },
    ],
  },
  "discovery.page_agent": {
    problem: "The page-specific .agent companion could not be reached.",
    fix: [
      "For the homepage, publish `/.agent`.",
      "For nested pages, publish `/path.agent` beside the human route.",
      "Serve the document with Content-Type `text/agent-view; version=1`.",
    ],
    resources: [
      { label: "Implementation guide", href: implementationGuide },
      { label: "Discovery guidance", href: discoveryGuide },
    ],
  },
};

function fallbackGuidance(check: ValidationCheck): ValidationGuidance {
  return {
    problem:
      check.status === "pass"
        ? "This check is currently satisfied."
        : "This check needs attention before the page reaches stronger AVL readiness.",
    fix:
      check.status === "pass"
        ? ["Keep this signal in place as the page evolves."]
        : ["Review the check detail and compare the page against AVL conformance guidance."],
    resources: [{ label: "Conformance checks", href: conformanceGuide }],
  };
}
