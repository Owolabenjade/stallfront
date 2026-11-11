# DECISIONS

Append only. To change a decision, add a new entry that supersedes it and mark the old one `superseded by D-00N`.

## D-001: Adopt the Foundation operating files
Date (UTC): 2026-11-11T05:14Z
Status: accepted
Context: The build is timeboxed and agents lose context between sessions.
Decision: The repository carries current truth in ops/, and every session follows the protocol in AGENTS.md.
Alternatives: Rely on chat history, or keep one notes file.
Consequences: Each session spends about 15 minutes on boot and handoff. Any agent can continue from the files.

## D-002: Gate A, build the agent-ready shop
Date (UTC): 2026-11-11T05:15Z
Status: accepted (human picked it at Gate A)
Context: About 38 hours left, solo builder. PayPal's blog (2026-09-16) launched WebMCP "Agent Ready" checkout but limits it to Store Sync merchants. Scores and reasoning in ops/RESEARCH.md and ops/private/.
Decision: Build a shop for small sellers that turns product photos into PayPal catalog products and exposes WebMCP and MCP tools for AI agents, with PayPal Orders v2 checkout approved by the buyer.
Alternatives: Voice point of sale with PayPal invoice QR codes (runner-up); AG Grid ops copilot for batch refunds and tracking (third).
Kill list: dispute defense copilot (sandbox dispute creation needs buyer consent and an auth assertion, unverified; commercial incumbents exist); agent-to-agent negotiation, freelancer invoicing and receipt bill splitting (all on PayPal's own idea list); consumer subscription canceller (PayPal APIs are merchant-side).
Consequences: WebMCP has few native browser agents, so the demo carries its own in-page buyer agent and an MCP endpoint as the fallback.

## D-003: Gate B, name Stallfront
Date (UTC): 2026-11-11T05:15Z
Status: accepted (human locked it)
Context: Name shortlist checked on npm and web search (2026-11-11): no collisions for Stallfront or Agent Aisle.
Decision: Stallfront. Tagline: "Turn product photos into a PayPal shop AI agents can buy from."
Alternatives: Agent Aisle (reads as big retail), Open Counter (an existing company recalled with that name, so dropped), Shelfcast, AgentStall, Countertop.
Consequences: The tagline must carry "AI agents", since the name does not.

## D-004: Stack
Date (UTC): 2026-11-11T05:15Z
Status: accepted
Context: Solo, about 30 working hours, judges need a public URL with no setup.
Decision: One Node 22 service (Express) serving plain HTML, CSS and browser modules, with no frontend build step. PayPal REST is called directly with fetch (OAuth client credentials, Orders v2, Catalog Products, webhooks). Claude through the Anthropic SDK. WebMCP through the @mcp-b/global polyfill; MCP through @modelcontextprotocol/sdk over Streamable HTTP. Data in a JSON file store with a seed script. Hosted on Render.
Alternatives: Next.js or React with Vite (adds a build step); @paypal/paypal-server-sdk or @paypal/agent-toolkit for the PayPal calls (an extra layer over a handful of endpoints); SQLite (Render's free disk is ephemeral either way).
Consequences: Shop data resets on redeploy; the seed script restores the demo shop. The README says so.

## D-005: Use Groq instead of Claude for the AI features
Date (UTC): 2026-11-11T08:54Z
Status: accepted (human: no funds for the Claude API)
Context: The human has no Anthropic API credit; Groq offers a free plan with an OpenAI-compatible API. Groq docs read 2026-11-11 (console.groq.com/docs models, vision, tool-use, structured-outputs, rate-limits, deprecations).
Decision: Photo-to-listing uses qwen/qwen3.8-27b (vision, json_schema strict; preview model, max 3 images per request, so one request per photo). The buyer agent uses openai/gpt-oss-120b (production, tool use) with openai/gpt-oss-20b as the fallback on rate limits. Calls go through fetch to https://api.groq.com/openai/v1; the browser loop switches to the OpenAI chat format. The Claude implementation (server/claude.js at commit abc0f8e) is removed from the code path.
Alternatives: Keep Claude (no credit); Gemini free tier (not requested).
Consequences: Free-plan limits are tight (docs disagree: 30 RPM and 8K TPM on one page, higher on another), so photos are processed one at a time with retry on 429 and the agent keeps its prompt small. The vision model is a preview model and could change; verify on the live key before relying on it.
