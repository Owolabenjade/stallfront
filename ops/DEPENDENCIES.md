# DEPENDENCIES

Fail closed: nothing goes on the critical path until its row here is `verified` with evidence.
Covers libraries, SDKs, APIs, models, chains and testnets, faucets, hosting, data sources, agent skills and MCP servers.
Status: verified | unverified | failed | dropped
Role: critical (the demo path breaks without it) | optional

| Dependency | Pinned version | Role | Verified (UTC) | Evidence | Status | Limits, keys, gotchas |
|---|---|---|---|---|---|---|
| Node.js | 22.20.0 | critical | 2026-11-11 | E-001 | verified | Local machine; Render must run 22 too (`engines`) |
| PayPal sandbox REST: OAuth, Orders v2 create and capture | v2 | critical | | | unverified | Needs a developer account (I-002). Buyer approval needs the sandbox personal account login |
| PayPal sandbox REST: Catalog Products | v1 | critical | | | unverified | Product IDs only; prices live on our side and in order items |
| PayPal sandbox webhooks | v1 | optional | | | unverified | Needs the public Render URL and a webhook ID for signature verification |
| Anthropic Messages API (vision, tool use) | SDK @anthropic-ai/sdk 1.8.0 (npm, 2026-11-11) | critical | | | unverified | Human's key; set a spending cap before the demo goes public. Model chosen when the claude-api reference is read |
| @mcp-b/global (WebMCP polyfill) | 6.2.0 (npm, 2026-11-11) | critical | | | unverified | Exposes `document.modelContext`/`navigator.modelContext`; check the registration API before building on it |
| @modelcontextprotocol/sdk | 1.32.2 (npm, 2026-11-11) | critical | | | unverified | Streamable HTTP transport, stateless mode |
| Render web service | free tier | critical | | | unverified | Cold starts after idle; ephemeral disk. Human needs an account |
| GitHub | n/a | critical | | | unverified | `gh` CLI not installed; repo created in the web UI |

## How to verify a dependency
1. Read the current official docs; note the URL and the date you read them.
2. Install the exact version you will use and pin it (lockfile, foundry.toml, requirements file).
3. Run the smallest real call against the real service, not a mock: one request, one transaction, one completion.
4. Record the command and its output as an EVIDENCE entry, then fill the row.
5. Write down what could stop you during the event: key approval time, quotas and rate limits, cost, faucet limits, region limits, breaking changes, missing features.
