# DEPENDENCIES

Fail closed: nothing goes on the critical path until its row here is `verified` with evidence.
Covers libraries, SDKs, APIs, models, chains and testnets, faucets, hosting, data sources, agent skills and MCP servers.
Status: verified | unverified | failed | dropped
Role: critical (the demo path breaks without it) | optional

| Dependency | Pinned version | Role | Verified (UTC) | Evidence | Status | Limits, keys, gotchas |
|---|---|---|---|---|---|---|
| Node.js | 22.20.0 | critical | 2026-11-11 | E-001 | verified | Local machine; Render must run 22 too (`engines`) |
| PayPal sandbox REST: OAuth, Orders v2 create and capture | v2 | critical | 2026-11-11 | E-006, E-008 | verified | Needs a developer account (I-002). Buyer approval needs the sandbox personal account login |
| PayPal sandbox REST: Catalog Products | v1 | critical | 2026-11-11 | E-011 | verified | Product IDs only; prices live on our side and in order items |
| PayPal sandbox webhooks | v1 | optional | | | unverified | Needs the public Render URL and a webhook ID for signature verification |
| Anthropic Messages API (vision, tool use) | @anthropic-ai/sdk 1.8.0 | optional | | | dropped | D-005: no API credit; code removed after abc0f8e |
| Groq chat completions: openai/gpt-oss-120b (agent, tool use), openai/gpt-oss-20b (fallback) | API v1 (OpenAI-compatible) | critical | 2026-11-11 | E-009, E-010 | verified | Free plan; docs disagree on limits (8K vs 250K TPM). Needs GROQ_API_KEY |
| Groq vision: qwen/qwen3.8-27b (json_schema strict) | API v1 | critical | 2026-11-11 | E-009 | verified | No enum in the schema (fails). Preview model; max 3 images per request; each image counts 2048 input tokens |
| @mcp-b/global (WebMCP polyfill) | 6.2.0 | critical | 2026-11-11 | E-003 | verified | Exposes `document.modelContext`/`navigator.modelContext`; check the registration API before building on it |
| @modelcontextprotocol/sdk | 1.32.2 | critical | 2026-11-11 | E-005 | verified | Streamable HTTP, stateful sessions held in memory (lost on restart; clients reconnect) |
| Render web service | free tier, Blueprint `render.yaml` | critical | 2026-11-11 | E-013 | verified | https://stallfront.onrender.com. Cold starts after idle (about 50 s, per Render's banner); ephemeral disk wipes orders on every deploy, so record the video after the last push. Auto-deploys on push to main |
| GitHub | n/a | critical | 2026-11-11 | E-013 | verified | github.com/Owolabenjade/stallfront, public, MIT detected. `gh` CLI not installed |

## How to verify a dependency
1. Read the current official docs; note the URL and the date you read them.
2. Install the exact version you will use and pin it (lockfile, foundry.toml, requirements file).
3. Run the smallest real call against the real service, not a mock: one request, one transaction, one completion.
4. Record the command and its output as an EVIDENCE entry, then fill the row.
5. Write down what could stop you during the event: key approval time, quotas and rate limits, cost, faucet limits, region limits, breaking changes, missing features.
