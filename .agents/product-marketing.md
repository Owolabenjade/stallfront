# Product Marketing Context

**Document version:** v3
**Last updated:** 2026-11-11

## Product Overview
**One-liner:** Turn product photos into a PayPal shop in minutes. (Proposed in D-009; it replaces "...a PayPal shop AI agents can buy from" once the builder approves it.)
**Order of the story:** the seller first (photos, listings, PayPal shop, orders without DMs), then shoppers (pay with PayPal, or send an AI assistant), then developers and AI apps (WebMCP and MCP).
**What it does:** A maker adds photos of what they sell. Stallfront drafts the listings, registers each product with PayPal and opens a shop page where people buy with PayPal, and where AI shopping assistants can search and prepare orders too. The buyer always approves the payment in PayPal.
**Product category:** Online shop builder for small sellers (the shelf: "simple online store", "PayPal shop", "sell on Instagram").
**Product type:** Web app (hackathon prototype, PayPal sandbox).
**Business model:** None yet. Free during the hackathon.

## Target Audience
**Who:** Makers and market-stall sellers with a handful of products (mugs, bags, prints, candles) who sell through Instagram or WhatsApp posts and get paid with PayPal links.
**Primary use case:** Get a proper shop with PayPal checkout without building a store, and be findable by the AI assistants their buyers are starting to use.
**Jobs to be done:**
- "Turn the photos on my phone into listings I don't have to write myself."
- "Let people (and their AI assistants) order and pay without messaging me first."
- "See every order and know it's paid."
**Second audience:** Shoppers who ask an AI assistant to find and buy something for them.
**Third audience (this week):** Hackathon judges, who need to see the PayPal and AI work clearly in a 3-minute video.

## Problems & Pain Points
**Core problem:** A seller with five products has no catalog. Buyers ask in DMs, the seller replies with a PayPal link, and nothing is searchable by an AI assistant.
**Why alternatives fall short:**
- Full store builders take setup time and monthly fees for five products.
- PayPal's own agent-ready checkout is limited to Store Sync merchants today.
- Social posts and payment links carry no structured product data.
**What it costs them:** Sales lost to slow replies; buyers whose assistants can't see the shop at all.
**Emotional tension:** "I make good things but I'm not a tech person."

## Differentiation
- Starts from photos: the AI writes the first draft of every listing, and the seller only checks it.
- Every shop is ready for AI shopping assistants from the first minute (WebMCP on the page, MCP for other agents).
- Payment stays with PayPal and the buyer: an assistant can prepare an order but never pay.
- The seller sees which assistant placed each order and what it did.

## Objections
| Objection | Response |
|-----------|----------|
| "Will an AI spend my buyers' money?" | No. The assistant prepares the order; the buyer approves it in PayPal. |
| "I'm not technical." | Add photos, check the drafts, press Publish. |
| "What if the AI gets my product wrong?" | It flags what it can't tell from the photo and you fix it before publishing. |

**Anti-persona:** Stores with hundreds of products, inventory sync or multi-currency needs.

## Customer Language
**Words to use:** shop, products, photos, listings, order, pay with PayPal, AI shopping assistant, approve, seller, buyer, ready for AI assistants.
**Words to avoid in user-facing copy (keep them in small technical labels or developer sections):** WebMCP, MCP, tool calls, endpoint, schema, function names (search_products), model names (qwen, gpt-oss), "agent-ready", "channel", "session", IDs other than PayPal receipt numbers.
**Glossary:**
| Term | Meaning |
|------|---------|
| AI shopping assistant | Any AI that shops for a person (our in-page assistant, a browser agent, or an app connected over MCP) |
| Seller view | The private page where a seller sees orders |
| Ready for AI assistants | The shop page offers WebMCP tools and an MCP address |

## Brand Voice
| Attribute | Means | Doesn't mean | Example line |
|-----------|-------|--------------|--------------|
| Plain | Words a market seller uses | Dumbed down or vague | "Add photos. Check the drafts. Open your shop." |
| Honest | Say what the AI can get wrong | Hedging everything | "It flags what a photo can't show, so you check it." |
| Warm | A market stall, not a bank | Cute or jokey | "Corner Stall is open." |

**Tone by context:**
- Errors: say what happened and what to do next, in one line.
- Technical details: present but secondary, for judges and developers.

## Proof Points
**Metrics (sandbox, measured):** assistant reached the right checkout in 10 of 10 runs, median 3.5 s, and 5 of 5 for the gift request (E-019); four photos to a published shop with four PayPal catalog products in about a minute (E-016, E-019); a shopper's "Buy with PayPal" click reached PayPal checkout in 3.4 s and was paid (E-020).
**Customers:** none yet [NEED: real sellers]. Demo shop photos are from Unsplash.
**Testimonials:** none [NEED: real quotes]. Do not invent.

## Goals
**Business goal:** Win the PayPal AI Hackathon; show the full flow working.
**Conversion action:** "Open your shop from photos" (sellers); "Try the demo shop" (judges and shoppers).

## Learnings
| Date | Learning | Evidence | Applies to | Status |
|------|----------|----------|------------|--------|
| 2026-11-11 | Lead with the seller's job. AI shopping assistants are what sets the shop apart, not the headline; sell the MCP side to developers separately | builder feedback ("the developer who use mcp for ai agent can be sold some other way"), D-009 | headline, Devpost, README, video | active |
| 2026-11-11 | No test statistics or hackathon notes on the site; proof belongs in the README and video | builder feedback ("such information does not serve a user") | site copy | active |
| 2026-11-11 | The builder found the UI full of code words no user understands; user-facing copy must use plain words and keep technical names secondary | builder feedback | all pages | active |

## Changelog
- v3 (2026-11-11) — Seller-first one-liner and story order (D-009); current proof points (E-019, E-020).
- v2 (2026-11-11) — Learnings: no test stats on the site; demo shop now uses Unsplash photos (leather goods, mugs, denim).
- v1 (2026-11-11) — Initial context, drafted from the README, landing page and builder feedback.
