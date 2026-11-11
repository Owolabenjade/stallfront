# SUBMISSION (Devpost draft)

Paste each field into the Devpost form. Keep it consistent with README.md and ops/CLAIMS.md.
Check the real form for fields not listed here and add them.
The human's editable copy is the doc "Stallfront Devpost description" (https://claude.ai/artifact/2UQb5M2ibCJ6vb3ZwHthFP). If it was edited, read it and copy the changes here before submitting.
Positioning: lead with the seller; AI assistants come second (D-009).
Before pasting: check Devpost's preview. If prices between two `$` signs render as a formula, put a backslash before each `$`.

## Project name
Stallfront

## Elevator pitch (tagline, 200 characters max)
Turn product photos into a PayPal shop in minutes. AI writes the listings. Shoppers pay with PayPal, or ask their AI assistant to shop for them.

## Links ("Try it out")
- Live demo: https://stallfront.onrender.com
- Demo shop: https://stallfront.onrender.com/s/corner-stall
- Code: https://github.com/Owolabenjade/stallfront

## Video demo link
VIDEO_LINK (YouTube, public, under 3:00)

## Built with
javascript, node.js, express, html, css, paypal, paypal-orders-v2, paypal-catalog-products, groq, gpt-oss-120b, qwen, webmcp, model-context-protocol, render, puppeteer

## Image gallery (upload in this order)
1. docs/img/cover.png (thumbnail; remake it with the new headline once approved, I-022)
2. docs/img/review.png: AI drafts each listing from a photo and lists what the seller should check.
3. docs/img/shop-assistant.png: Asked for a work bag and a jacket under $280, the shop's assistant prepared a $271.00 PayPal checkout.
4. docs/img/receipt.png: The buyer approved in PayPal, and the receipt shows the PayPal payment ID.
5. docs/img/seller-view.png: The seller sees every order, how it came in and each step an assistant took.

## Prizes to select (cap: one Grand or Honorable Mention, plus one Sponsor prize; Rules s.8)
- Grand prizes and Honorable Mentions: tick them if the form lists them; otherwise they are considered automatically.
- Sponsor prize: Render (the app runs on Render from render.yaml).

## About the project (paste as Markdown)

### Inspiration
Stallfront is for makers who sell a handful of products through Instagram or WhatsApp posts and get paid with PayPal links. For them, every sale starts with a message: "Is this still available? How much?" The seller answers when they can and sends a PayPal link, and by then some buyers have moved on.

Setting up a full online store is a lot of work for six products. Meanwhile, AI assistants are starting to shop for people, and an assistant can't buy from a post. PayPal [launched agent-ready checkout in September 2026](https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready), but it is limited to Store Sync merchants today.

We wanted a seller with a phone full of product photos to get a real PayPal shop in minutes. People should be able to order from it without messaging first, and their AI assistants should be able to shop there too.

### What it does
**For sellers: from photos to a shop in minutes.**

1. Add up to six product photos and a shop name.
2. AI drafts each listing: title, description, a suggested price with its reasoning, category and search words. It also lists anything the photo can't confirm, so the seller checks it.
3. The seller fixes what's wrong and presses Publish. Each product is registered in the PayPal catalog, and the shop page goes live.

**For shoppers: pay with PayPal, or send an assistant.**

- Every product has a "Buy with PayPal" button that goes straight to PayPal checkout.
- Or the shopper asks the shop's built-in assistant in plain words: "New job on Monday: get me a leather work bag and a jacket, under $280 for both." It searches the shop, picks the Tan Leather Briefcase ($145) and the Indigo Denim Jacket ($120), and prepares one PayPal checkout for $271.00 with shipping.
- The assistant stops at the PayPal button. Only the buyer can approve a payment, in PayPal.

**For sellers again: every order explained.** The seller view lists each order with its PayPal payment ID and how it came in: a shopper, the shop's assistant, or an outside AI app. For assistant orders, it shows each step the assistant took.

**For AI apps and developers: open from the first minute.** Every shop publishes its actions (search, product details, checkout, order status) as WebMCP tools on the page and over MCP at `/mcp/<shop>`. A browser agent or any MCP client can shop without scraping the page. This is the pattern PayPal describes for its agent-ready checkout, offered here to sellers who don't use Store Sync.

### How we built it
- **PayPal:** Orders v2 with OAuth client credentials. Each order carries line items, an amount breakdown and `experience_context` return and cancel URLs. It is captured on return with a `PayPal-Request-Id`, so a repeated return can't capture twice. Catalog Products v1 registers every listing. Everything runs in the sandbox (`server/paypal.js`, `server/tools.js`).
- **AI on Groq:** `qwen/qwen3.8-27b` drafts listings from photos in a strict JSON schema, with fallbacks when strict decoding fails or a reply is cut off. `openai/gpt-oss-120b` runs the shop assistant with tool calling and falls back to `openai/gpt-oss-20b` when the free plan is busy. The server always sends its own tool list, so it can't be used as a general model proxy (`server/ai.js`).
- **WebMCP and MCP:** WebMCP through the `@mcp-b/global` polyfill. The in-page assistant runs every tool call through `document.modelContext.executeTool`, the same path any WebMCP agent uses. MCP through `@modelcontextprotocol/sdk` over Streamable HTTP. One set of tool definitions serves the page, the MCP endpoint and the assistant (`public/js/shop.js`, `server/mcp.js`).
- **App and hosting:** Node 22 and Express serving plain HTML, CSS and JavaScript with no build step, on a Render web service deployed from `render.yaml`.
- **Checks:** scripts drive headless Chrome against the live site. They cover a smoke check, WebMCP, the assistant, the shopper's Buy button, sandbox approval as a test buyer, MCP checkout, onboarding from photos and repeated-run reliability. There are also 13 unit tests.

### Challenges we ran into
- **An assistant that asked instead of acting.** In early runs it replied "should I add it to your cart?", or said "I'll create a checkout" and stopped. We measured it, rewrote the instructions, and added a one-time reminder when a reply promises an action without taking it. The gift request went from 0 of 3 to 5 of 5.
- **Cut-off AI replies.** Once, a half-finished reply from the vision model became a listing called "Untitled product" at $10. Drafts now need a title and a price, or the next fallback runs.
- **The free AI plan.** Groq's strict JSON mode rejects `enum` in schemas and sometimes fails to decode, so drafts fall back to partial output, then to JSON mode. The plan allows about 8,000 tokens a minute, so drafting sends one photo per request and waits out rate limits with a countdown.
- **A sandbox merchant that couldn't be paid.** The first sandbox business account returned `PAYEE_ACCOUNT_LOCKED_OR_CLOSED`. A new US business account fixed it.
- **Plain language.** The first version of the site was full of tool and model names. We rewrote every page in plain words and kept the technical names as small labels for developers.

### Accomplishments that we're proud of
- The whole journey works on the live site. Four photos became a published shop with four PayPal catalog products in about a minute. Sandbox payments went through from the "Buy with PayPal" button and from the assistant.
- The assistant reached the right checkout in 10 of 10 runs of the work-bag request, with a median of 3.5 seconds to the PayPal handoff, and in 5 of 5 runs of the coffee-lover gift.
- An outside MCP client searched the shop, built a checkout and completed a sandbox payment. That full run was local; creating the checkout was also confirmed on the live site.
- Every order reaches the seller with its PayPal IDs, how it came in and, for assistant orders, each step the assistant took.

### What we learned
- The PayPal approval step is the right line for AI shopping. The assistant finds products and builds the order; the buyer keeps the payment decision.
- Measure agent runs instead of trusting one good run. One request passed every time, while the other failed on two prompt versions before we fixed it.
- AI drafts are a starting point. The same jacket photo was priced at $65, $120 and $180 on different runs, so the seller's review step stays.

### What's next for Stallfront
- Put it in front of real market sellers and see what they change.
- Let each seller connect their own PayPal account. Today every shop is paid into one sandbox merchant account.
- Order emails, capture and refund webhooks, and shipment tracking.
- Move to PayPal's own agent-ready checkout once it opens beyond Store Sync merchants.

## Testing instructions (if the form has the field)
Open https://stallfront.onrender.com/s/corner-stall. The free hosting sleeps when idle, so the first load can take about a minute. Click "Buy with PayPal" on any product, or tap the suggestion "New job on Monday…" and then the PayPal button. Log in with the PayPal sandbox buyer listed in the README; it is test money only, and PayPal shows that test account's pages in Arabic. The seller view is at /s/corner-stall/dashboard, and the MCP endpoint is https://stallfront.onrender.com/mcp/corner-stall.

## Disclosures
Work started on 2026-11-11, and nothing existed before. The code was written with Claude Code (Anthropic) as the coding assistant. Product photos are from Unsplash, with credits in the README. MIT license. PayPal sandbox only.
