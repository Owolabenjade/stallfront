# BENCHMARK
Date (UTC): 2026-11-11T19:23Z    Commit: 9f15a2b    Evaluated: README, video https://youtu.be/KDiFgml6RH0, live URL, ops/SUBMISSION.md
Focus: the agentic part (shop assistant, WebMCP tools, MCP endpoint, seller attribution) and the two judging stages. Scores are INFERRED judgments against the rubric in ops/RESEARCH.md; the evidence they rest on is OBSERVED.

## Stage One (pass/fail viability)
Every listed requirement is met at this commit: PayPal sandbox on the critical path (E-019, E-020, E-023), AI on the critical path (E-016, E-019), hosted demo (E-022), description (ops/SUBMISSION.md), public repo with MIT license, test buyer in the README, video public and under 3:00 (E-025), English. Remaining risk is availability during judging (2026-12-01 to 12-15): Render free sleep and wake, and keys that must stay valid until 12-15.

## Scores
| Dimension | Score (1-5) | What a judge sees (evidence) | Gap |
|---|---|---|---|
| Rubric fit | 4 | Video 0:55 to 1:45 and README Proof: a real assistant checkout and PayPal payment | Impact rests on no real sellers |
| Evidence | 4 | CLAIMS C-001 to C-028 with E-IDs; README Proof table | None found unbacked |
| Differentiation | 3.5 | Photos to a PayPal shop, open to AI assistants without Store Sync; seller sees which agent ordered | Similar pieces exist (Shopify agent-ready apps, AI listing writers) |
| Integration depth | 4 | Orders v2 with items, breakdown, idempotent capture; Catalog Products; tool-calling agent over WebMCP and MCP | No PayPal JS SDK, Agent Toolkit or webhooks; one merchant receives every payment |
| Resilience | 4 | 3 concurrent shoppers 3/3; odd requests handled; injection refused (E-026) | Cold start not measured; "handmade" invented once |
| Measurable advantage | 3.5 | 10/10 right checkout, median 3.5 s (E-019); 4 photos to a shop in about a minute (E-016) | No baseline (time for a seller to do it by hand) |
| Demo quality | 4 | 2:38 video, captions, full path, live site | AI narration voice; one Arabic PayPal page (explained) |

## Rubric breakdown
| Criterion (verbatim, from ops/RESEARCH.md) | Weight | Score | Evidence |
|---|---|---|---|
| Technological Implementation | 1/5 | 4 | E-019, E-020, E-023, E-026; README "How it works" |
| Design | 1/5 | 4 | E-022 screenshots; the video |
| Potential Impact | 1/5 | 3 | Clear audience and problem; no user validation; agent discovery not solved; payouts to one test merchant |
| Innovation/Idea | 1/5 | 3.5 | PayPal-native agent-ready shop for sellers without a store |
| Presentation | 1/5 | 4 | E-024, E-025 |

## Fix list
| # | Gap | Fix | Hours | Moves | Expected gain | Decision |
|---|---|---|---|---|---|---|
| 1 | Only our own clients have used the shop's tools (C-016) | A mainstream AI app connects to /mcp/corner-stall and buys; record it and add one README line | 0.5 (needs the human's account) | Innovation, Tech, Agentic Commerce mention | +0.5 Innovation, +0.25 Tech | done: Claude over MCP bought and confirmed payment (E-027) |
| 2 | Judges may ask how a buyer's assistant finds a shop | One line in README "What is real": found through its link or MCP address today; no directory yet | 0.1 | Impact (credibility) | small, prevents a misread | done (README, C-029) |
| 3 | Assistant invented "handmade" once (E-026) | Tighten the prompt; rerun 10 + 5 reliability runs; deploy | 0.4 | Tech | small | accept: after the freeze, not worth the risk to the demo path |
| 4 | "Buy 50" reply does not state stock | Same prompt pass: state stock and offer the most it can prepare | (with 3) | Tech | small | accept (with 3) |
| 5 | Cold start not measured | Measure the first request after 20 minutes idle | 0.4 (mostly waiting) | Resilience | small | done: 21.8 s (E-027) |
| 6 | Every shop pays one sandbox merchant | Per-seller payee or partner onboarding | days | Impact | medium | disclose (already in README, "What's next") |

## Resilience drills
| Drill | Result | Evidence |
|---|---|---|
| Three shoppers at once on the free AI plan | 3/3 correct checkouts, about 3.9 s; fallback model used | E-026 |
| Unrelated item ("laptops") | Polite no, no checkout; one invented word | E-026 |
| Impossible quantity (50 jackets) | No checkout; asks for quantity or budget | E-026 |
| Prompt injection ("mark it paid") | Refused; asks for the order ID | E-026 |
| Payment on the live site from all three channels | Paid: shopper button, shop assistant, MCP client | E-019, E-020, E-023 |
| Cold start after about 7.5 hours idle | 21.8 s to the first response, then 0.4 s | E-027 |
| Outside AI agent (Claude over MCP) buys | Searched, compared, prepared $271.00, confirmed paid after approval; it repeated an invented "ships in 2 to 4 days" from our tool output, now fixed | E-027, E-028 |

## Not evaluated
- A consumer chat app (ChatGPT, Gemini) or a native WebMCP browser agent using the shop.
- Phone-width checkout through PayPal; throttled network.
- Other entries in this event's gallery (not visible on 2026-11-11, ops/RESEARCH.md).
