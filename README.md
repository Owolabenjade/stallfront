# Stallfront: turn product photos into a PayPal shop in minutes

[Live demo](https://stallfront.onrender.com) · [Demo shop](https://stallfront.onrender.com/s/corner-stall) · [Seller view](https://stallfront.onrender.com/s/corner-stall/dashboard) · MCP endpoint: `https://stallfront.onrender.com/mcp/corner-stall` · [Video (2:45)](https://youtu.be/y0kJiRzCfWo)

AI writes the listings. Shoppers pay with PayPal, or ask their AI assistant to shop for them. Only the buyer can approve a payment, in PayPal.

Stallfront is for makers who sell a handful of products through Instagram or WhatsApp posts and get paid with PayPal links. Each listing is drafted from a photo, each published product is registered in the PayPal catalog, and every shop is open to AI assistants from the start: the page offers its actions as WebMCP tools, and other AI apps connect over MCP.

![The demo shop: the assistant searched the shop and prepared a $271.00 PayPal checkout through the page's WebMCP tools](docs/img/shop-assistant.png)

*The live demo shop. Asked for "a leather work bag and a jacket, under $280 for both", the assistant called `search_products` and then `create_checkout` through the page's WebMCP tools. The PayPal order is ready, and only the buyer can approve it.*

## What it does

- **Photos become listings.** A seller adds up to six product photos. A vision model drafts each listing (title, description, price, tags, who it suits as a gift) and flags what the photo can't confirm. The seller checks the drafts and publishes, and each product is registered in the PayPal catalog.
- **Shoppers pay with PayPal.** Every product has a **Buy with PayPal** button. It creates a PayPal order for that product and sends the shopper to PayPal to approve it.
- **AI assistants can shop too.** Every shop page registers four WebMCP tools: `search_products`, `get_product`, `create_checkout` and `get_order_status`. The same tools are served over MCP at `/mcp/<shop>`, so a browser agent or any MCP client can shop without scraping the page.
- **The buyer approves in PayPal.** `create_checkout` creates a PayPal order and returns its approval link. The agent can't pay: the buyer signs in to PayPal and approves, and Stallfront captures the payment on return. The seller sees which channel and which agent placed each order, along with the tool calls behind it.

## Why it matters

A maker who sells a few bags and mugs through Instagram posts and PayPal links has no shop. Buyers often message to ask whether something is still available and what it costs, and setting up a full online store is a lot of work for six products. AI assistants are starting to shop for people too, but an assistant can only buy where a shop gives it tools to call, and PayPal's own WebMCP "agent ready" checkout is limited to Store Sync customers today ([PayPal developer blog, 16 Sep 2026](https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready)). Stallfront gives that seller a PayPal shop in minutes, starting from the photos they already have, and opens it to AI assistants at the same time.

## How it works

```mermaid
flowchart LR
  P[Product photos] -->|Groq vision, JSON schema| L[Listing drafts]
  L -->|seller checks and publishes| S[(Shop + products)]
  S -->|Catalog Products API| PC[PayPal catalog]
  S --> W[Shop page: 4 WebMCP tools]
  S --> M[MCP endpoint /mcp/shop]
  A1[In-page assistant or browser agent] --> W
  A2[Any MCP client] --> M
  W & M -->|create_checkout| O[PayPal Orders v2: order + approval link]
  O -->|buyer approves in PayPal| C[Capture on return URL]
  C --> D[Seller view: channel, agent, tool trace, capture ID]
```

1. `/new` resizes each photo in the browser and sends it to [`draftListing`](server/ai.js#L198), which asks `qwen/qwen3.8-27b` on Groq for a listing in a strict JSON schema. If strict decoding fails, it tries the model's partial output (kept only if it has a title and a price), then JSON mode. [`normalize`](server/ai.js#L177) clamps prices, maps categories and turns `snake_case` words into plain words.
2. Publishing saves the shop and calls [`createCatalogProduct`](server/paypal.js#L125) for each product.
3. The shop page loads the `@mcp-b/global` WebMCP polyfill and [registers the tools](public/js/shop.js#L105) on `document.modelContext`. Each tool runs on the server through [`runTool`](server/tools.js#L245), which logs the call with its channel (WebMCP, MCP or website) for the seller view.
4. The in-page assistant ([`runAgent`](public/js/shop.js#L196)) sends the conversation to [`agentTurn`](server/ai.js#L79). That function calls `openai/gpt-oss-120b` on Groq with the server's own tool list, so the endpoint can't be used as a general model proxy. The browser then executes the tool calls the model names through `document.modelContext.executeTool`, the same path any WebMCP agent uses. Each step is shown in plain words ("Searched the shop", "Got a PayPal checkout ready"), with the tool name as a small label.
5. [`create_checkout`](server/tools.js#L139) checks stock and calls [`createOrder`](server/paypal.js#L65): Orders v2 with line items, an amount breakdown, and `experience_context` return and cancel URLs. It returns the `payer-action` link.
6. When the buyer comes back from PayPal, [`settleOrder`](server/tools.js#L202) reads the order and [captures it](server/paypal.js#L110) with a `PayPal-Request-Id`, so a repeated return can't capture twice.
7. [`/mcp/<shop>`](server/mcp.js#L46) serves the same `TOOL_DEFS` over Streamable HTTP with the MCP TypeScript SDK, and records the client's name as the agent.

## Built with PayPal

- **Orders v2** ([`server/paypal.js`](server/paypal.js)): OAuth client credentials, order creation with items and breakdown, `payment_source.paypal.experience_context` (`PAY_NOW`, return and cancel URLs), order lookup, and idempotent capture. This is the only way money moves. Agents get an approval link, never a payment method.
- **Catalog Products v1** ([`createCatalogProduct`](server/paypal.js#L125)): each published listing becomes a PayPal product with its name and description, plus its image and shop URL when the site is served over https.
- Everything runs against the PayPal **sandbox**.

## Built with AI

- **Agent:** `openai/gpt-oss-120b` on Groq, with tool calling. It falls back to `openai/gpt-oss-20b` when the free plan returns 429.
  - Rules in the [system prompt](server/ai.js#L37): no invented products or qualities, prepare the checkout rather than ask, and never claim payment before `get_order_status` says paid.
  - If a reply promises an action without calling a tool, the server [reminds the model once](server/ai.js#L79).
- **Vision:** `qwen/qwen3.8-27b` on Groq drafts listings from photos ([`draftListing`](server/ai.js#L198)).
- **Agent protocols:** WebMCP through [`@mcp-b/global`](https://www.npmjs.com/package/@mcp-b/global) 6.2.0 on the shop page, and MCP through [`@modelcontextprotocol/sdk`](https://www.npmjs.com/package/@modelcontextprotocol/sdk) 1.32.2 at `/mcp/<shop>`.

## Built with Render

The app runs as a Render web service defined by [`render.yaml`](render.yaml) (Blueprint, free plan, Node 22, health check `/healthz`). Pushing to `main` redeploys it. Secrets are entered in Render, not stored in the repo.

## Proof

All checks below ran against the live Render URL unless marked local. The full method and limits for each are in [`ops/EVIDENCE.md`](ops/EVIDENCE.md).

| What | Result | How |
|---|---|---|
| Buyer assistant, "a leather work bag and a jacket, under $280 for both" | 10/10 runs reached the briefcase and the jacket for $271.00 in two tool calls; median 3.5 s and max 3.7 s to the PayPal handoff | [`scripts/reliability.mjs`](scripts/reliability.mjs), headless Chrome, E-019 |
| Buyer assistant, "a gift under $20 for a coffee lover" | 5/5 reached the coffee mug for $24.00; median 4.1 s. An earlier prompt version asked "should I add it to your cart?" instead (0/3), which we fixed | same, E-015, E-019 |
| Payment captured from the public URL | Order `ord_66d4bdfabdcc`: PayPal order `31P99297WK614384W`, capture `1XT10488423082226`, $271.00, channel WebMCP | [`scripts/approve-sandbox.mjs`](scripts/approve-sandbox.mjs) logs in as the sandbox buyer, E-019 |
| Shopper's Buy button, no assistant | **Buy with PayPal** on the gold-handle mug opened PayPal checkout 3.4 s after the click. Paid: order `ord_19f98700e5bd`, PayPal order `74U52681SM570642S`, capture `97D51285HA094451P`, $31.00, channel website | [`scripts/buy-check.mjs`](scripts/buy-check.mjs), then `approve-sandbox.mjs`, E-020 |
| MCP client buys | Our SDK test client on Render: search, get, `create_checkout`, buyer approves, capture. Order `ord_534e78962c81`: PayPal order `99071419PF318441L`, capture `6UY59471TP497654C`, $126.00, channel MCP | [`scripts/mcp-check.mjs`](scripts/mcp-check.mjs) `--checkout`, then `approve-sandbox.mjs`, E-014 (local), E-023 |
| Outside AI agent buys | Claude, connected from outside over MCP with only the shop's four actions, was asked for "a leather work bag and a jacket, under $280 for both". It searched, compared the two bags, prepared the $271.00 checkout and gave the PayPal link. After approval it checked back and confirmed the order paid: order `ord_9fd433ff3c19`, capture `9FW18031CS098121D` | E-027 |
| Photos to a live shop | The four sample photos drafted, published, 4 of 4 PayPal catalog products; about a minute on the free AI plan | [`scripts/onboard-check.mjs`](scripts/onboard-check.mjs), E-016, E-019 |
| Smoke check and unit tests | Smoke 6/6 on Render and on a fresh clone; `npm test` 13/13 | E-016, E-019 |

| Seller view | Receipt | Listing review |
|---|---|---|
| ![Seller view with a paid MCP order and a paid WebMCP order, each with the steps the assistant took](docs/img/seller-view.png) | ![Receipt with the PayPal order and payment IDs](docs/img/receipt.png) | ![Listing drafts from photos, with the points the seller should check](docs/img/review.png) |

## Try it

**On the live site** (the free plan sleeps when idle, so the first load can take about a minute):

1. Open the [demo shop](https://stallfront.onrender.com/s/corner-stall). Click **Buy with PayPal** on any product, or click the suggestion "New job on Monday: get me a leather work bag and a jacket, under $280 for both", watch the steps appear, then click **Review and pay in PayPal**.
2. Log in with the PayPal sandbox test buyer below and pay. This is PayPal's sandbox, so no real money moves. You return to a receipt with the PayPal payment ID.
3. Open the [seller view](https://stallfront.onrender.com/s/corner-stall/dashboard) to see the order, the assistant that placed it and each step it took.
4. Optional: connect an MCP client, for example `claude mcp add --transport http corner-stall https://stallfront.onrender.com/mcp/corner-stall`, and ask it to shop.
5. Optional: [open your own shop](https://stallfront.onrender.com/new). Click "Use our four sample photos", then **Write my listings**, check the drafts, and **Publish my shop**.

PayPal sandbox buyer: `sb-n1jy253844531@personal.example.com` / `./@|U9bV` (the PayPal pages for this test account show in Arabic)

**Run it locally** (Node 22; tested on a fresh clone, E-016):

```bash
git clone https://github.com/Owolabenjade/stallfront.git
cd stallfront
npm ci
cp .env.example .env   # add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (a sandbox REST app) and GROQ_API_KEY
npm start              # http://localhost:3000
npm run smoke          # in a second terminal: health, tools, a real sandbox order
npm test               # unit tests, no network
```

## What is real and what is not

- **Sandbox only.** All payments use PayPal's sandbox and a test buyer. Every shop is paid into one sandbox merchant account (the app's). A production version would onboard each seller to PayPal so money goes to their own account.
- **The demo shop is seeded.** Corner Stall's six listings were drafted by the vision model from six Unsplash photos, through the same pipeline as `/new` (E-019). Two things were edited by hand before publishing: the loafers' category ("other" to "apparel"), and one description that stopped mid-sentence.
  - Drafted prices vary between runs of the same photo: the jacket came back at $65, $120 and $180. That's why the seller sets the price on the review screen.
  - With older photos, the model also misnamed a phone stand as a "pedal stand" and a "footrest" (E-011, E-016).
- **The in-page assistant is ours.** It's a Groq model loop whose tool calls run through the page's WebMCP tools via the `@mcp-b/global` polyfill. We have not tested a browser's built-in WebMCP agent. Outside agents were tested with our own SDK client script and with Claude connected over MCP (E-027), not yet with ChatGPT or Gemini.
- **Free hosting and a free AI plan.**
  - The Render service sleeps after idle. The first request after a night idle took 22 s (E-027); Render says waking can take 50 s or more. Its disk is wiped on every deploy, so shops and orders made on the live site disappear while the seed shop stays.
  - Groq's free plan limits tokens per minute. Photo drafting manages about three photos a minute, and the assistant falls back to a smaller model when the plan is busy.
- **How assistants find a shop.** A buyer's AI assistant reaches a shop through its link (WebMCP on the page) or its MCP address. There is no directory of shops yet, so an assistant can't discover them on its own.
- **No seller accounts.** A shop's private seller-view link is its only key. The demo shop's seller view is public on purpose.
- **Capture on return.** The payment is captured when the buyer comes back from PayPal. There are no webhooks yet, so a buyer who approves and closes the tab leaves the order approved until someone checks its status.

## Built during the PayPal AI Hackathon

Work started on 2026-11-11 (UTC) and nothing existed before.

Product photos from Unsplash, under the Unsplash License: [Caio Coelho](https://unsplash.com/photos/QRN47la37gw) (denim jacket), [Latico Leathers](https://unsplash.com/photos/-qgDzKxrHMg) (totes), [Mel Poole](https://unsplash.com/photos/vQQoZzKO9Ig) (slogan mugs), [Noah Smith](https://unsplash.com/photos/LkuH3Txi_gs) (loafers), [Nong](https://unsplash.com/photos/2dDJdOlA3CY) (gold-handle mug) and [PersonalGraphic.com](https://unsplash.com/photos/IFlg3kFbR0E) (briefcase).

## Team

[Owolabenjade](https://github.com/Owolabenjade), solo.

## What's next

- Put it in front of real market sellers and see what they change.
- Per-seller PayPal onboarding, so each shop is paid into its own account.
- Capture and refund webhooks, and order emails for the seller.
- Use PayPal's own agent-ready checkout once it opens beyond Store Sync merchants.

## License

[MIT](LICENSE)
