# PLAN

Project: Stallfront
Thesis: For makers who sell a handful of products through social posts and PayPal links, Stallfront turns product photos into a PayPal-backed shop that AI assistants can browse and buy from through WebMCP tools, with the buyer approving every payment in PayPal, so an agent goes from "find me a gift under $40" to a paid PayPal order in a few tool calls.
Tagline: Turn product photos into a PayPal shop AI agents can buy from.
Timebox: hackathon
Deadline and gates: see ops/CLOCK.md

Change this plan only through a DECISION entry. Keep it to one screen.

## Demo path
The single flow that must work every time. Everything else is optional.
1. Seller opens `/new`, drops 3 to 6 product photos (or one-click sample photos). Claude vision drafts structured listings (title, description, price, attributes, gift tags). Seller edits one price and publishes: PayPal Catalog products are created and the shop goes live at `/s/<slug>`.
2. The shop page registers WebMCP tools (`search_products`, `get_product`, `create_checkout`, `get_order_status`). The same tools are served over MCP at `/mcp/<slug>`.
3. A buyer's AI assistant (the in-page agent panel, or any MCP client) is asked "find me a gift under $40 for a tea lover". It calls the tools; a visible trace shows each call.
4. `create_checkout` creates a PayPal Orders v2 order with line items and returns the approval link. The agent never sees payment credentials; the buyer clicks "Review and pay in PayPal" and approves with the sandbox buyer account.
5. On return the server captures the order. The buyer sees the PayPal capture ID; the seller dashboard shows the order tagged with its channel (WebMCP agent, MCP agent, human) and the agent's tool trace.

## Milestones
| ID | Milestone | Done when (observable) | Gate | Status |
|---|---|---|---|---|
| M1 | Tracer bullet | One seeded product, `create_checkout` tool, PayPal sandbox order created, approved and captured, on a public Render URL; smoke check passes | Tracer bullet | todo |
| M2 | Core | Steps 1 to 5 with real Claude and PayPal sandbox calls; MCP endpoint answers a real MCP client | Feature freeze | todo |
| M3 | Hardened | Loading, empty and error states on the demo path; design floor passes; benchmark gaps fixed or disclosed | Video recorded | todo |
| M4 | Shipped | README, video and submission done; pre-submission checks pass; platform shows submitted | Submitted | todo |

Status: todo | doing | done | cut

## Targeted tracks and prizes
| Track or prize | Requirement (verbatim, with source) | Where we meet it | Status |
|---|---|---|---|
| Grand prizes (1st to 3rd) | "your project must meaningfully use both PayPal and AI" (Devpost overview, pasted 2026-11-10) | PayPal Orders v2 and Catalog on steps 1 and 4 to 5; Claude on steps 1 and 3 | todo |
| Best Use of Agentic Commerce | "All Eligible Submissions" (Official Rules s.8) | Steps 2 to 5: an agent shops and prepares a PayPal checkout the buyer approves | todo |
| Best Use of PayPal + AI | "All Eligible Submissions" (Official Rules s.8) | Same build | todo |
| Best Use of Render | "All Eligible Submissions that use any Render tools" (Official Rules s.8) | Hosted on Render from `render.yaml` | todo |

Prize cap (Official Rules s.8): at most one Grand Prize or one Honorable Mention, plus one Sponsor Prize.

## Out of scope
- Real seller authentication (a shop is edited by its private admin link)
- Live PayPal, vaulted or saved payment methods, agent spending mandates
- Shipping rates, taxes, inventory sync, multi-currency (USD only)
- PayPal Store Sync integration (Stallfront targets sellers without it)
- Refund and dispute UI
- A native mobile app
- AG Grid, Channel3, APIMatic and the other sponsor prizes (none sits on the demo path)
