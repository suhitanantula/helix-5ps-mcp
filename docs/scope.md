# Helix 5Ps MCP: scope (public summary)

15 Oct 2026. This is the public version of the internal scope. Internal file paths, client work and private method detail have been left out.

## Decisions (approved by Suhit, 15 Oct 2026)
- **Licence:** code MIT, content CC BY 4.0, public layer only.
- **Login:** none. Anonymous and stateless, with nothing stored. Per-IP rate limit (around 60 req/min, burst 20) and a 32 KB body cap.
- **Variants:** the core loop and the five single Ps in full public form. Teasers for all three advanced forms (multi-agent, rhizomatic, population): when to use, shape, 3 first steps, and "full method via Helix".
- **Scope of listing:** 5Ps only. pstack is not included.
- **Public text:** taken from the already-approved 5Ps text on suhitanantula.com (below), not from private skill files.
- **Name:** "Helix 5Ps" (default).
- **Hosting:** Vercel (suhitanantula.com) vs Cloudflare Worker. Decision pending.
- **Launch:** connect to both books and suhitanantula.com. Possibly launch together with a 5Ps landing page on suhitanantula.com.

## Source text (approved, public)
- https://www.suhitanantula.com/5ps
- https://www.suhitanantula.com/books/helix-moment/5ps-loop-designer
- https://www.suhitanantula.com/books/helix-moment/chapter-18-the-5ps-of-loop-design
- https://www.suhitanantula.com/books/helix-moment/chapter-24-the-5ps-in-action-where-design-becomes-strategy
- https://www.suhitanantula.com/books/helix-moment/chapter-25-the-5ps-as-a-rhythmic-meta-framework

## Books and site
- The Helix Moment: https://www.suhitanantula.com/books/helix-moment
- The Co-Intelligent Organisation: https://www.suhitanantula.com/books/co-intelligent
- https://www.suhitanantula.com · https://thehelixlab.ai

## Tools
All tools are read-only, idempotent and closed-world, with `additionalProperties: false`. Problem text is capped at 4,000 chars and context at 8,000. There are no LLM calls and no outbound calls.
- `explain_5ps { p?, depth? }`
- `diagnose_5ps { problem }`
- `apply_5ps { problem, p?, context? }`
- `list_5ps_variants {}`
- `get_5ps_variant { variant: loop|multi_agent|rhizomatic|population }`
- `compare_5ps_variants { variants[2..4], situation? }`

## Public vs private
- **Public:** P names and definitions, short descriptions, the "which P" diagnostic, generic question sets and templates, and variant one-liners and teasers.
- **Private:** full method texts, book chapters beyond what the site publishes, full advanced-form protocols, workbooks and all client work.

## Packaging
- `.cursor-plugin/plugin.json` and `mcp.json` (remote URL, streamable HTTP, no auth).
- README, LICENSE, CONTENT-LICENSE, PRIVACY.md, SUPPORT.md, logo and CHANGELOG.

## Test plan (12 checks)
1. Endpoint info
2. No-auth initialize
3. Protocol negotiation
4. tools/list schemas and annotations
5. Synthetic calls
6. Bad input
7. Oversized input
8. Prompt injection
9. Leak scan
10. Rate limit (429 + Retry-After)
11. Packaging validation
12. Install in Cursor, Grok Bot and Claude

## Open
- Hosting choice
- Support address
- Logo
- Landing page timing
