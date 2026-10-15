# Rate limiting (Helix 5Ps MCP)

## In-process (best effort)

The `/mcp` handler applies a soft per-IP token bucket (~60 requests/min, burst 20) in memory. On Vercel Fluid/serverless, **each instance has its own bucket**, so this is best-effort abuse damping only.

Client IP is taken from **`x-vercel-forwarded-for`** (preferred) or **`x-real-ip`**. The first entry of client-supplied `X-Forwarded-For` is **not** used (spoofable).

Oversized bodies (>32 KB) are rejected with HTTP 413. Rate-limit responses are HTTP 429 with `Retry-After`.

## Vercel Firewall (recommended, no paid add-on required on Pro+)

Documented dashboard step — no secrets and no third-party WAF:

1. Open the project in Vercel → **Firewall** (or **Security → Firewall**).
2. Add a **Custom rule** targeting path `/mcp` (and optionally `/`).
3. Condition: rate limit by IP (or JA4 / client IP), e.g. **60 requests per 60 seconds** with a short burst if the UI offers it.
4. Action: **Deny** or **Challenge** when over limit; leave a clear log label such as `helix-5ps-mcp-rate`.
5. Publish the rule to **Preview** and **Production** when you promote (this repo does not attach domains or promote production from the agent).

This Firewall rule is the durable control; the in-memory limiter remains a defence-in-depth fallback.
