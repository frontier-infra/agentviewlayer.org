# AgentViewLayer.org

Public standards home and validator for Agent View Layer.

## Development

```bash
npm install
npm run dev
```

The Next development server runs on port `49321`. To preview the Cloudflare
Pages build with the native validator Function:

```bash
npm run build
npm run preview
```

## Cloudflare

This project is designed for Cloudflare Pages:

- Static Next export in `out/`.
- Native Cloudflare Pages Function at `functions/api/validate.ts`.
- AVL dogfood files in `public/.agent`, `public/agent.txt`, and `public/llms.txt`.

Cloudflare Pages settings:

```text
Build command: npm run build
Build output directory: out
Project name: agentviewlayer-org
Production domain: agentviewlayer.org
```

Manual deploy:

```bash
npm run build
npm run deploy
```

## Goals

- Explain AVL as a public, producer-owned web standard for AI agents.
- Provide a live URL validator for `.agent`, `/agent.txt`, and `/llms.txt` readiness.
- Publish implementation docs, badges, examples, and an adoption directory.
- Dogfood AVL with this site's own `/.agent`, `/agent.txt`, and `/llms.txt`.
