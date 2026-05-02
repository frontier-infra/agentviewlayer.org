# AgentViewLayer.org

[![Cloudflare Pages](https://img.shields.io/badge/Cloudflare-Pages-f38020?style=flat-square&logo=cloudflare&logoColor=white)](https://pages.cloudflare.com)
[![CodeRabbit](https://img.shields.io/badge/reviewed%20with-CodeRabbit-ff570a?style=flat-square)](https://coderabbit.ai)
[![Blacksmith](https://img.shields.io/badge/CI%20ready-Blacksmith-111827?style=flat-square)](https://blacksmith.sh)
[![GitHub](https://img.shields.io/badge/source-frontier--infra%2Fagentviewlayer.org-24292f?style=flat-square&logo=github&logoColor=white)](https://github.com/frontier-infra/agentviewlayer.org)

Public standards home and validator for Agent View Layer.

Offered to the agentic web by [Jason Brashear](https://github.com/webdevtodayjason),
built in public so the next generation of sites can be understood instead of scraped.

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
