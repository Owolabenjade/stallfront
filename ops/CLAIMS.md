# CLAIMS

Every claim made in public (README, video, deck, submission form, UI copy, posts) gets a row with its exact wording.
Status: verified (evidence shows it) | estimated (the public copy says "estimated") | mocked (the public copy says it is simulated or seeded) | planned (must not appear in public copy as present fact) | retracted
A `verified` row cites at least one evidence ID that exists in EVIDENCE.

| ID | Claim (exact public wording) | Where it appears | Evidence | Status |
|---|---|---|---|---|
| C-001 | For makers who sell a handful of products through social posts and PayPal links, Stallfront turns product photos into a PayPal-backed shop that AI assistants can browse and buy from through WebMCP tools. The buyer approves every payment in PayPal, so an agent goes from "find me a gift under $20" to a paid PayPal order in a few tool calls. | README intro, video opening, submission | E-019 (gift prompt 5/5 to checkout in 2 to 3 calls; paid order from an agent checkout), E-016 (photos to shop) | verified |
| C-002 | Turn product photos into a PayPal shop AI agents can buy from. | README title, site headline, repo description, video title card (Devpost pitch moved to C-023; the rest follow once the human approves the new headline, D-009) | E-016, E-019 | verified |
| C-003 | PayPal's own WebMCP "agent ready" checkout is limited to Store Sync customers today | README "Why it matters", video hook | E-002 | verified |
| C-004 | The agent can't pay: the buyer signs in to PayPal and approves. Site: "The assistant stops at this button. Only the buyer can approve the payment, in PayPal." / "Nothing is charged until you approve it in PayPal." | README, video, site | E-013, E-019 (approval through the sandbox buyer login; tools return an approval link) | verified |
| C-005 | 10/10 runs reached the briefcase and the jacket for $271.00 in two tool calls; median 3.5 s and max 3.7 s to the PayPal handoff | README Proof | E-019 | verified |
| C-006 | "a gift under $20 for a coffee lover": 5/5 reached the coffee mug for $24.00; median 4.1 s. An earlier prompt version asked "should I add it to your cart?" instead (0/3), which we fixed | README Proof | E-015, E-019 | verified |
| C-007 | Order ord_66d4bdfabdcc: PayPal order 31P99297WK614384W, capture 1XT10488423082226, $271.00, channel WebMCP | README Proof | E-019 | verified |
| C-008 | SDK client: search, get, create_checkout, buyer approves, capture (local); create_checkout on Render, PayPal order 3HN04577SY5380117 | README Proof | E-014, E-019 | verified |
| C-009 | The four sample photos drafted, published, 4 of 4 PayPal catalog products; about a minute on the free AI plan | README Proof | E-016 (47 s, 66.8 s), E-019 (65.7 s local; Render run published 4 of 4) | verified |
| C-010 | Smoke 6/6 on Render and on a fresh clone; npm test 13/13 | README Proof | E-016, E-019 | verified |
| C-011 | Every shop is paid into one sandbox merchant account (the app's) | README "What is real" | E-018 | verified |
| C-012 | With older photos, the model also misnamed a phone stand as a "pedal stand" and a "footrest" | README "What is real" | E-011, E-016 | verified |
| C-013 | The Render service sleeps after idle (about 50 s to wake) | README "What is real", "Try it" | E-018 (Render's statement, not measured) | verified |
| C-014 | Photo drafting manages about three photos a minute | README "What is real" | E-016, E-019 (4 photos in 47 to 67 s with 429 waits; 8K TPM limit) | estimated |
| C-015 | Work started on 2026-11-11 (UTC) and nothing existed before | README "Built during" | E-018 | verified |
| C-016 | We have not tested a browser's built-in WebMCP agent. MCP checkout was tested with our own SDK client script, not with Claude Desktop | README "What is real" | E-003, E-014 (limits) | verified |
| C-017 | Four photos became a live shop with four PayPal catalog products in about a minute on the free plan | Submission "Accomplishments" | E-016, E-019 | verified |
| C-018 | The gift request went from 0/3 to 5/5 | Submission "Challenges", "What we learned" | E-015, E-019 | verified |
| C-019 | Video: "We tested it ten times on the live site, and it reached the right checkout every time, in under four seconds" | Video script | E-019 (10/10, max 3.7 s) | verified |
| C-020 | Corner Stall's six listings were drafted by the vision model from six Unsplash photos, through the same pipeline as /new. Two things were edited by hand (loafers' category; one unfinished description). Drafted prices vary between runs: the jacket came back at $65, $120 and $180 | README "What is real" | E-019 | verified |
| C-021 | Site: "From Corner Stall, our demo shop. Every listing there started as a photo." | Landing page caption | E-019 | verified |
| C-022 | Site sample transcript: "Searched the shop: "leather work bag", up to $280. Found five, including the Tan Leather Briefcase, $145, and the Indigo Denim Jacket, $120" then "Got a PayPal checkout ready: briefcase and jacket, $265 plus $6 shipping", total $271.00 | Landing page | E-019 (search output captured 12:30Z; every run made these two calls) | verified |
| C-023 | Devpost pitch: "Turn product photos into a PayPal shop in minutes. AI writes the listings. Shoppers pay with PayPal, or ask their AI assistant to shop for them." Proposed headline: "Turn product photos into a PayPal shop in minutes." | Devpost elevator pitch; site, README and video once approved (D-009) | E-016 and E-019 (four photos to a published shop with PayPal catalog products in about a minute), E-020 (shopper pays with PayPal), E-019 (assistant to checkout) | verified |
| C-024 | Every product has a "Buy with PayPal" button that goes straight to PayPal checkout. Sandbox payments went through from the "Buy with PayPal" button and from the assistant | Submission "What it does", "Accomplishments" | E-020 (button, $31.00 captured on Render), E-019 (assistant order captured on Render) | verified |
| C-025 | An outside MCP client searched the shop, built a checkout and completed a sandbox payment. That full run was local; creating the checkout was also confirmed on the live site. (Replaces the earlier draft line "captured from the public URL, through both WebMCP and MCP", which overstated the MCP part) | Submission "Accomplishments" | E-014 (local, captured), E-019 (Render, create_checkout) | verified |
| C-026 | Every shop publishes its actions as WebMCP tools on the page and over MCP. "This is the pattern PayPal describes for its agent-ready checkout, offered here to sellers who don't use Store Sync." | Submission "What it does" | E-002 (PayPal: tools to discover products and start checkout, buyer approves in PayPal; Store Sync only), E-003, E-019 | verified |
