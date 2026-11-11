# SUBMISSION (Devpost draft)

Paste each field into the Devpost form. Keep it consistent with README.md and ops/CLAIMS.md.
Check the real form for fields not listed here and add them.

## Project name
Stallfront

## Elevator pitch (tagline)
Turn product photos into a PayPal shop AI agents can buy from.

## Links ("Try it out")
- Live demo: https://stallfront.onrender.com
- Demo shop: https://stallfront.onrender.com/s/corner-stall
- Code: https://github.com/Owolabenjade/stallfront

## Video demo link
VIDEO_LINK (YouTube, public, under 3:00)

## Built with
javascript, node.js, express, html, css, paypal, paypal-orders-v2, paypal-catalog-products, groq, gpt-oss-120b, qwen, webmcp, model-context-protocol, render, puppeteer

## Image gallery (upload in this order)
1. docs/img/cover.png (thumbnail)
2. docs/img/shop-assistant.png: The assistant used the page's WebMCP tools and prepared a $33.50 PayPal checkout.
3. docs/img/receipt.png: Paid with PayPal, with the PayPal order and capture IDs.
4. docs/img/seller-view.png: The seller sees the channel, the agent and each tool call behind every order.
5. docs/img/review.png: Listings drafted from photos, with the points the seller should check.

## Prizes to select (cap: one Grand or Honorable Mention, plus one Sponsor prize; Rules s.8)
- Grand prize and Honorable Mentions: considered automatically if the form doesn't ask.
- Sponsor prize: Render (the app runs on Render from render.yaml).

## About the project (paste as Markdown)

### Inspiration
AI assistants are starting to shop for people, but an assistant can only buy where a shop gives it tools to call. PayPal's own WebMCP "agent ready" checkout is limited to Store Sync customers today. The makers we had in mind sell a handful of things through Instagram posts and PayPal links. They have no catalog and no structured product data, so agents can't see their stock or check out. We wanted them to get the same thing in a few minutes, starting from the photos they already have.

### What it does
- **Photos become listings.** A seller adds up to six product photos. A vision model drafts each listing (title, description, price, tags, who it suits as a gift) and flags what the photo can't confirm. The seller checks the drafts and publishes, and each product is registered in the PayPal catalog.
- **The shop speaks to agents.** Every shop page registers four WebMCP tools: `search_products`, `get_product`, `create_checkout` and `get_order_status`. The same tools are served over MCP at `/mcp/<shop>`, so a browser agent or any MCP client can shop without scraping the page.
- **The buyer approves in PayPal.** `create_checkout` creates a PayPal order and returns its approval link. The agent can't pay: the buyer signs in to PayPal and approves, and Stallfront captures the payment on return. The seller sees which channel and which agent placed each order, along with the tool calls behind it.

### How we built it
- **PayPal:** Orders v2 (OAuth client credentials, orders with line items and an amount breakdown, `experience_context` return and cancel URLs, capture with a `PayPal-Request-Id` so a repeated return can't capture twice) and Catalog Products v1, all in the sandbox. Code: `server/paypal.js`, `server/tools.js`.
- **AI tools:**
  - `openai/gpt-oss-120b` on Groq runs the in-page shopping assistant with tool calling, falling back to `openai/gpt-oss-20b` when the free plan is busy.
  - `qwen/qwen3.8-27b` on Groq drafts listings from photos in a strict JSON schema, with fallbacks when strict decoding fails.
  - The server always sends its own tool list, so the endpoint can't be used as a general model proxy. Code: `server/ai.js`.
- **Agent protocols:** WebMCP through the `@mcp-b/global` polyfill. The browser runs every tool call the model names through `document.modelContext.executeTool`, the same path any WebMCP agent uses. MCP through `@modelcontextprotocol/sdk` (Streamable HTTP). One set of tool definitions serves the web page, the MCP endpoint and the assistant.
- **Hosting:** a Render web service from `render.yaml` (Blueprint, free plan), redeployed on every push.
- **Checks:** scripted end-to-end checks drive headless Chrome against the live URL: a smoke check, the WebMCP check, the assistant, sandbox approval as the test buyer, MCP checkout, onboarding from photos, and repeated-run reliability. There are also 11 unit tests.

### Challenges we ran into
- The first sandbox merchant account couldn't receive payments (`PAYEE_ACCOUNT_LOCKED_OR_CLOSED`); a new US business account fixed it.
- Groq's strict JSON mode rejects `enum` in the schema and sometimes fails to decode, so listing drafts fall back to the model's partial output, then to JSON mode, and categories are mapped on the server.
- The free AI plan allows about 8,000 tokens a minute, so drafting runs one photo per request and waits out 429s with a countdown.
- Agent reliability. In early runs the assistant asked "should I add it to your cart?" instead of preparing the checkout, and once it said "I'll create a checkout" and stopped. We measured it, changed the instructions, and added a one-time server reminder when a reply promises an action without a tool call. The gift request went from 0/3 to 5/5.

### Accomplishments that we're proud of
- On the live site, the assistant reached the right checkout in 20 out of 20 runs of the travel request, with a median of 4.75 seconds to the PayPal handoff.
- Real sandbox payments captured from the public URL, through both WebMCP and MCP, each showing in the seller view with its agent and tool trace.
- Four phone photos became a live shop with four PayPal catalog products in 47 to 67 seconds on the free plan.

### What we learned
- The approval link is the right boundary for agentic checkout: the agent does the searching and the order building, and the buyer keeps the payment decision in PayPal.
- Measuring agent runs beats trusting one good run. The travel request passed every time on every prompt version, while the gift request failed on the first two.
- Vision models still misread odd objects. Ours called a phone stand a footrest, so the seller review step is necessary.

### What's next for Stallfront
- Per-seller PayPal onboarding, so each shop is paid into its own PayPal account (today every shop pays into one sandbox merchant).
- Capture and refund webhooks, and order emails for the seller.
- Using PayPal's own agent-ready checkout once it opens beyond Store Sync merchants.

## Testing instructions (if the form has the field)
Open https://stallfront.onrender.com/s/corner-stall (the free hosting sleeps when idle; the first load can take about a minute). Click the suggestion "Travelling next week…", then "Review and pay in PayPal", and log in with the PayPal sandbox buyer listed in the README (no real money). The seller view is at /s/corner-stall/dashboard. MCP endpoint: https://stallfront.onrender.com/mcp/corner-stall.

## Disclosures
Work started on 2026-11-11, and nothing existed before. The code was written with Claude Code (Anthropic) as the coding assistant. MIT license. Sandbox only.
