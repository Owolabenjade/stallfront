# CLAIMS

Every claim made in public (README, video, deck, submission form, UI copy, posts) gets a row with its exact wording.
Status: verified (evidence shows it) | estimated (the public copy says "estimated") | mocked (the public copy says it is simulated or seeded) | planned (must not appear in public copy as present fact) | retracted
A `verified` row cites at least one evidence ID that exists in EVIDENCE.

| ID | Claim (exact public wording) | Where it appears | Evidence | Status |
|---|---|---|---|---|
| C-001 | For makers who sell a handful of products through social posts and PayPal links, Stallfront turns product photos into a PayPal-backed shop that AI assistants can browse and buy from through WebMCP tools. The buyer approves every payment in PayPal, so an agent goes from "find me a gift under $20" to a paid PayPal order in a few tool calls. | README intro, video opening, submission | E-013 (paid order from an agent checkout), E-015 (gift prompt 5/5 to checkout in 2 to 3 calls), E-016 (photos to shop) | verified |
| C-002 | Turn product photos into a PayPal shop AI agents can buy from. | README title, repo description, video title card, Devpost tagline | E-013, E-016 | verified |
| C-003 | PayPal's own WebMCP "agent ready" checkout is limited to Store Sync customers today | README "Why it matters", video hook | E-002 | verified |
| C-004 | The agent can't pay: the buyer signs in to PayPal and approves | README, video, UI | E-013 (approval through the sandbox buyer login; tools return an approval link, code in server/tools.js) | verified |
| C-005 | 20/20 runs reached the right $33.50 checkout across three prompt versions; 4.75 s median and 6.6 s max to the PayPal handoff | README Proof | E-015 | verified |
| C-006 | "a gift under $20 for a coffee lover": 5/5 on the final prompt (0/3 and 2/3 on the two earlier versions, now fixed) | README Proof | E-015 | verified |
| C-007 | Order ord_75d87bd82ee3: PayPal order 1T517544FV170642A, capture 05368800VL640091W, $33.50, channel WebMCP | README Proof | E-013 | verified |
| C-008 | SDK client: search, get, create_checkout, buyer approves, capture 9DS38542FR532492N (local); create_checkout on Render | README Proof | E-014, E-016 | verified |
| C-009 | 4 sample photos drafted in 47 s (free plan rate limits), published, 4 of 4 PayPal catalog products | README Proof | E-016 | verified |
| C-010 | Smoke 6/6 on Render and on a fresh clone; npm test 11/11 | README Proof | E-013, E-016 | verified |
| C-011 | Every shop is paid into one sandbox merchant account (the app's) | README "What is real" | E-018 | verified |
| C-012 | the model called the phone stand a "pedal stand", and a footrest in later runs (0 of 3 correct for that photo) | README "What is real" | E-011, E-016 | verified |
| C-013 | The Render service sleeps after idle (about 50 s to wake) | README "What is real", "Try it" | E-018 (Render's statement, not measured) | verified |
| C-014 | photo drafting manages about three photos a minute | README "What is real" | E-016 (4 photos in 47 s and 66.8 s with 429 waits; 8K TPM limit) | estimated |
| C-015 | Work started on 2026-11-11 (UTC) and nothing existed before | README "Built during" | E-018 | verified |
| C-016 | We have not tested a browser's built-in WebMCP agent. MCP checkout was tested with our own SDK client script, not with Claude Desktop | README "What is real" | E-003, E-014 (limits) | verified |
| C-017 | Four phone photos became a live shop with four PayPal catalog products in 47 to 67 seconds on the free plan | Submission "Accomplishments" | E-016 | verified |
| C-018 | The gift request went from 0/3 to 5/5; the travel request passed every time on every prompt version, while the gift request failed on the first two | Submission "Challenges", "What we learned" | E-015 | verified |
| C-019 | in under five seconds on median (spoken: "twenty out of twenty reached the right checkout") | Video script | E-015 (median 4.75 s) | verified |
