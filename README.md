# Helix 5Ps MCP

An open, no-login [Model Context Protocol](https://modelcontextprotocol.io) server for the **5Ps of Loop Design**: Perceive → Perform → Portfolio → Pause/Promote → Progress. From Suhit Anantula / The Helix Lab.

**Status: v0.1** — public layer only. Advanced forms (multi-agent, rhizomatic, population) are teasers. This listing covers **5Ps only** (not pstack or other Helix IP).

## Tools (6, read-only, deterministic)

| Tool | Purpose |
|---|---|
| `explain_5ps` | Overview of the loop and each P |
| `diagnose_5ps` | Which P do I need? Routes a problem to a P, with reasons |
| `apply_5ps` | Question set + output template for one P (or the whole loop) |
| `list_5ps_variants` | Loop, multi-agent, rhizomatic, population: names and one-liners |
| `get_5ps_variant` | Teaser for a form: when to use it, its shape, first steps |
| `compare_5ps_variants` | Side-by-side fit of 2–4 forms for a situation |

No accounts. No stored inputs. No LLM calls inside the server. Problem text ≤ 4,000 chars; context ≤ 8,000; request body ≤ 32 KB. Soft in-memory rate limit ≈ 60 req/min per IP (burst 20; **per serverless instance**). Prefer a [Vercel Firewall](docs/rate-limit.md) rule on `/mcp` for durable limiting.

## Endpoint

Streamable HTTP MCP: **`/mcp`**

- `GET /mcp` — server info
- `POST /mcp` — JSON-RPC (`initialize`, `tools/list`, `tools/call`, `ping`)
- Auth: none

Target production host (not configured in this repo): `https://mcp.suhitanantula.com/mcp`

## Connect

**Cursor** — [`.cursor-plugin/plugin.json`](.cursor-plugin/plugin.json) points at root [`mcp.json`](mcp.json). Or add that file’s `mcpServers` block to your Cursor MCP config.

**Claude** — [`.claude-plugin/plugin.json`](.claude-plugin/plugin.json) + [`.mcp.json`](.mcp.json) (`type: http`).

## Develop

```bash
npm install
npm test
npm run dev
# then POST http://localhost:3000/mcp
```

Content the tools read lives in [`content/`](content/). Source URLs are in each file’s frontmatter. Do not rewrite approved wording. Full Helix Moment chapters are not vendored here — link to the live pages below.

## Learn more

- 5Ps: https://www.suhitanantula.com/5ps
- *The Helix Moment*: https://www.suhitanantula.com/books/helix-moment
  - Chapter 18 — The 5Ps of Loop Design: https://www.suhitanantula.com/books/helix-moment/chapter-18-the-5ps-of-loop-design
  - Chapter 24 — The 5Ps in Action: https://www.suhitanantula.com/books/helix-moment/chapter-24-the-5ps-in-action-where-design-becomes-strategy
  - Chapter 25 — The 5Ps as a Rhythmic Meta-Framework: https://www.suhitanantula.com/books/helix-moment/chapter-25-the-5ps-as-a-rhythmic-meta-framework
- *The Co-Intelligent Organisation*: https://www.suhitanantula.com/books/co-intelligent
- https://www.suhitanantula.com · https://thehelixlab.ai

## TODOs

- Support email ([SUPPORT.md](SUPPORT.md), [PRIVACY.md](PRIVACY.md))
- Domain attach for `mcp.suhitanantula.com` (out of scope for this PR)

Logo: [`assets/logo.png`](assets/logo.png) (plugin manifests).

## Licence

- Code: MIT ([LICENSE](LICENSE))
- Content (5Ps text): CC BY 4.0 ([content/LICENSE](content/LICENSE), [CONTENT-LICENSE](CONTENT-LICENSE))
