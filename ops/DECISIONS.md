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
Decision: Photo-to-listing uses qwen/qwen3.8-27b (vision, json_schema strict; preview model, max 3 images per request, so one request per photo). The buyer agent uses openai/gpt-oss-120b (production, tool use) with openai/gpt-oss-20b as the fallback on rate limits. Calls go through fetch to https://api.groq.com/openai/v1; the browser loop switches to the OpenAI chat format. The Claude implementation (server/claude.js at commit 8db8067) is removed from the code path.
Alternatives: Keep Claude (no credit); Gemini free tier (not requested).
Consequences: Free-plan limits are tight (docs disagree: 30 RPM and 8K TPM on one page, higher on another), so photos are processed one at a time with retry on 429 and the agent keeps its prompt small. The vision model is a preview model and could change; verify on the live key before relying on it.

## D-006: Bold magazine redesign with plain-English copy
Date (UTC): 2026-11-11T12:10Z
Status: accepted (human chose "Bold magazine" from three directions and approved the draft)
Context: The human found the UI basic and full of code words no user understands (tool names, WebMCP, MCP, model names, test statistics). They asked for the web-design-engineer, copywriting and product-marketing skills to be used.
Decision: A Businessweek-style display system (Archivo condensed caps at large sizes, one stall-orange accent, square corners, ruled lines, numbered product index) with Monocle-style text roles (small kicker, italic Newsreader dek, captions). User-facing copy is plain English. Technical names (tool names, WebMCP, MCP, PayPal IDs) stay only as small monospace labels or in "For developers" sections, so judges can still see the mechanism. No test statistics on the site (human: "such information does not serve a user"); proof stays in README and video.
Alternatives: "Market stall" (warm, awning stripes) and "Clean modern store" (white, minimal), both offered and not chosen.
Consequences: Element IDs and selectors were kept, so the scripts still run; the agent-ready check now waits for `#agent-ready[data-ready]`. Positioning notes are in `.agents/product-marketing.md`.

## D-007: Replace the demo shop photos with the human's Unsplash set
Date (UTC): 2026-11-11T12:20Z
Status: accepted (human deleted the old photos and supplied six new ones)
Context: The old demo shop used four of the builder's phone photos (mug, bag, glass, phone stand). The human supplied six Unsplash photos: a briefcase-style handbag, leather totes, slogan mugs, a gold-handle mug, loafers and a denim jacket.
Decision: Rebuild Corner Stall from the six photos through the real pipeline (vision drafts, two logged hand edits, PayPal catalog), keep the `corner-stall` slug, and use four of the photos as the /new samples. New demo prompts fit the new stock: "New job on Monday: get me a leather work bag and a jacket, under $280 for both" (expect $271.00) and "A gift under $20 for a coffee lover" (expect $24.00).
Alternatives: Keep the old shop alongside (the human asked for the old photos to go).
Consequences: Evidence before E-019 refers to the old products. README, video script and submission text were updated, and the photo credits are in the README. Unsplash licence: free use, attribution appreciated.

## D-008: Rewrite git history for authorship
Date (UTC): 2026-11-11T14:10Z
Status: accepted (requested by the human)
Context: The human asked for every commit to be authored by their own GitHub identity, with no co-author lines, and for the history to be force-pushed.
Decision: All 31 commits were rewritten with `git filter-branch`: author and committer set to Owolabenjade, co-author lines removed, four message lines reworded. Author and commit dates and every file tree are unchanged (checked commit by commit). The repo's local git identity is now Owolabenjade. New commits carry no co-author line.
Alternatives: Leave history as it was.
Consequences: Every commit ID changed (for example the first commit e17f1b1 is now 16b2dae, and the redesign 2d64327 is now 5d2b342). Commit IDs in EVIDENCE, DECISIONS, DEPENDENCIES and STATE were updated to the new IDs. Old IDs in chat logs or Render's deploy history no longer resolve on the branch.
