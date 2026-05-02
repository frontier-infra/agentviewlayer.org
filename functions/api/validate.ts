import { validateSiteUrl } from "../../lib/site-validator";

export async function onRequestPost(context: { request: Request }) {
  try {
    const body = (await context.request.json()) as { url?: unknown };
    if (typeof body.url !== "string" || !body.url.trim()) {
      return json({ error: "A URL is required." }, 400);
    }

    const result = await validateSiteUrl(body.url);
    return json(result, 200);
  } catch (error) {
    return json(
      { error: error instanceof Error ? error.message : "Validation failed." },
      400
    );
  }
}

export async function onRequestGet() {
  return json({
    name: "Agent View Layer Validator",
    method: "POST",
    accepts: { url: "https://example.com" },
  });
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
