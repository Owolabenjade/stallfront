# RESEARCH
Checked (UTC): 2026-11-11    Event: PayPal AI Hackathon https://paypalaihackathon.devpost.com

Sources: event overview, Official Rules and sponsor resources pasted by the human on 2026-11-10 (copied from the Devpost pages); PayPal pages read 2026-11-11.
Scoring arithmetic, prize math and competitor notes: ops/private/research-notes.md.

## Event facts
| Fact | Value | Source | Read (UTC) |
|---|---|---|---|
| Organizer, platform | PayPal Inc. (sponsor), Devpost (administrator) | Official Rules s.2 | 2026-11-10 |
| Submission period | 2026-10-01 09:15 PT to 2026-11-12 12:00 PT | Official Rules s.1 | 2026-11-10 |
| Deadline in UTC | 2026-11-12T20:00Z (PST, UTC-8, after DST ended 2026-11-01) | DERIVED | 2026-11-11 |
| Judging period | 2026-12-01 to 2026-12-15; winners about 2026-12-21 | Official Rules s.1 | 2026-11-10 |
| Format | Online, async: Stage One pass/fail viability, Stage Two scored by judges; may include AI-driven analysis | Official Rules s.6 | 2026-11-10 |
| Eligibility | Age of majority; excluded: Brazil, Quebec, Russia, Crimea, Cuba, Iran, North Korea, OFAC-sanctioned countries | Official Rules s.3 | 2026-11-10 |
| New or existing code | New, or significantly updated after 2026-10-01 (explain the update) | Official Rules s.4 | 2026-11-10 |

## Rules and deliverables checklist
- [ ] Meaningfully integrates at least one PayPal technology, using the free sandbox (overview, Rules s.4)
- [ ] Meaningfully incorporates AI (overview)
- [ ] Working prototype: hosted demo URL or complete run instructions; mockups do not count (Rules s.4)
- [ ] Text description of features and functionality (Rules s.4)
- [ ] Tools section: which models or AI services, and how they are used (overview)
- [ ] Public repo on GitHub, GitLab or Bitbucket with all source, assets and instructions (Rules s.4)
- [ ] Open-source license detectable in the repo's About section (Rules s.4)
- [ ] Test credentials, API keys or sandbox logins judges need, in the README (Rules s.4 Testing)
- [ ] Project free to test until judging ends, 2026-12-15 (Rules s.4 Testing)
- [ ] Video under 3 minutes, public on YouTube, shows the project working on its device, no unlicensed music or marks (Rules s.4)
- [ ] English materials (Rules s.4)

## Rubric
Equally weighted (Official Rules s.6), verbatim:
- Technological Implementation: How thoroughly and skillfully does the project use PayPal Developer Platform and AI tool(s)? Does the project reflect genuine effort and a working, non-trivial implementation?
- Design: Does the project deliver a complete, coherent product experience, not just a technical proof of concept?
- Potential Impact: Does the project make a credible, specific case for solving a real problem for a real audience, and does the solution actually address that problem based on what's demonstrated?
- Innovation/Idea: How creative and novel is the concept and does the project differ from existing concepts?
- Presentation: Does the video clearly demonstrate the project working end-to-end? Does the pitch communicate what problem is solved, who it's for, and why it matters? Is the overall presentation easy to follow?

Tie-break: criteria in the order above.

## Tracks and prizes
No tracks. Grand: $12,000 / $8,000 / $5,000. Honorable mentions, $5,000 each: Most Creative, Most Impactful, Best Demo Delivery, Best Use of PayPal + AI, Best Use of Agentic Commerce. Sponsor: AG Grid ($5,000 / $2,000 / 3 x $1,000), APIMatic (3 x $1,000 + subscription), Bryntum (3 x $1,000), Channel3 ($1,500), Render ($1,000 / $750 / $500 credits). Cap: one Grand or one Honorable Mention, plus one Sponsor prize (Rules s.8).

## Sponsor intent
- PayPal blog 2026-09-16, "WebMCP is here: PayPal is helping every merchant become agent-ready": WebMCP lets assistants discover products, build carts and start checkout through declared tools; the buyer is handed to PayPal to approve; "limited to Store Sync customers today". Benchmark: 3 structured tool calls instead of 30+ interface steps (PayPal calls it directional). https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready
- Agent tools reference (updated 2026-10-29): about 30 tools across catalog, disputes, invoices, orders, reporting, shipment tracking, subscriptions; remote MCP gift-card commerce tools behind a feature flag. https://developer.paypal.com/ai-tools/agent-tools
- Hackathon blog post (2026-09-30): no tracks, no required product; "meaningfully use both PayPal and AI". https://developer.paypal.com/community/blog/PayPal_AI_Hackathon

## Past winners and patterns
PayPal Dev Days 2025 hackathon (https://developer.paypal.com/community/blog/winners-dev-days-hackathon): 1st an AI paywall agent built on PayPal APIs; 2nd a Shopware upgrade to JS SDK v6; 3rd a PYUSD social trading app. One event only, so patterns are weak (INFERRED): PayPal rewards agentic use of its APIs and adoption of its newest SDKs.

## Saturation scan
| Candidate | Close matches | Level | Angle |
|---|---|---|---|
| Agent-ready shop | Shopify apps that make shops agent-ready (3 found); no PayPal-native, photo-first match found | Medium | No Shopify needed; photos to shop; WebMCP plus PayPal buyer-approved checkout |
| Voice POS | POS is on PayPal's idea list; several stall POS apps exist | Medium | Voice to invoice QR |
| AG Grid ops copilot | Dashboard plus chat is common | Medium | Preview-then-commit batch PayPal actions |

The Devpost gallery for this event was not visible on 2026-11-11, so entries could not be counted (UNKNOWN).

## Dependencies
See ops/DEPENDENCIES.md.

## Candidates and scores
Top three: agent-ready shop 4.40, voice POS 3.90, AG Grid ops copilot 3.85 (arithmetic in ops/private/research-notes.md).

## Pick and rationale
Agent-ready shop (D-002): it closes the gap PayPal itself named (Agent Ready limited to Store Sync), puts PayPal Orders and Catalog on the critical path, and its demo moment (an outside agent buys from a shop that was photos a minute earlier) fits the first 30 seconds.

## Kill list
See D-002.

## Open unknowns
| Question | Why it matters | How and when we resolve it |
|---|---|---|
| Can the human create a PayPal developer account from their country? | Blocks every PayPal call | Human signs up now (I-002) |
| Which browsers or assistants consume WebMCP natively today? | Decides whether judges can use their own agent | Read the @mcp-b/global docs during the tracer bullet; the in-page agent and MCP endpoint cover it either way |
| Does sandbox Orders v2 capture work with the default sandbox personal account? | Step 5 of the demo path | Tracer bullet |
