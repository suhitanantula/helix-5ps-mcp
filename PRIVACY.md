# Privacy — Helix 5Ps MCP

**No accounts.** This server does not offer login, signup, or identity linking.

**No personal data stored.** Tool inputs (problem text, context, situation) are processed in memory for the duration of the request and are not written to a database, file store, or analytics warehouse.

**Basic request logs.** Infrastructure may record standard request metadata needed to operate and protect the service, for example:

- timestamp
- approximate client IP (for rate limiting)
- HTTP status and response size
- MCP method name (e.g. `tools/list`, `tools/call`) and tool name
- request body size (not the body contents)

Logs are used for reliability, abuse prevention (≈60 requests/min per IP, burst 20), and debugging. They are not used to build user profiles.

**No AI calls from this server.** The six tools are deterministic and closed-world: they return approved public 5Ps text from `content/*.md`. Any model that *calls* these tools is outside this server’s control.

**Third parties.** Hosting is intended on Vercel. Their infrastructure logs and DDoS protections may apply under Vercel’s privacy policy.

**Contact.** Support email: **TODO**

**Changes.** Material privacy changes will be noted in [CHANGELOG.md](CHANGELOG.md).
