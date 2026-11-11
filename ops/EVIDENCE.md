# EVIDENCE

Each entry records a check that actually ran. If it did not run, it is not evidence: write it as a proposed check in ISSUES instead.

Format (copy for each entry, numbering upward):

    ## E-001: <what was checked>
    Date (UTC): 2026-01-01T12:00Z
    Commit: abc1234
    Environment: OS, browser or device, network, chain or model and version
    Method: exact command, steps or URL
    Result: what you observed: output, numbers, links, screenshot path
    Label: OBSERVED or DERIVED
    Limits: what this does not show

## Entries

## E-001: Local toolchain and package availability
Date (UTC): 2026-11-11T05:14Z
Commit: none (before first commit)
Environment: Windows 11 Pro, Git Bash, npm 10.9.3
Method: `node -v`; `git --version`; `gh --version`; `npm view <pkg> version` for @paypal/agent-toolkit, @paypal/mcp, @paypal/paypal-server-sdk, @paypal/paypal-js, @mcp-b/global, @modelcontextprotocol/sdk, @anthropic-ai/sdk
Result: node v22.20.0; git 2.51.0.windows.2; gh not found. npm latest: @paypal/agent-toolkit 1.11.0, @paypal/mcp 1.8.1, @paypal/paypal-server-sdk 2.5.0, @paypal/paypal-js 11.3.0 (all modified 2026-11-05); @mcp-b/global 6.2.0; @modelcontextprotocol/sdk 1.32.2; @anthropic-ai/sdk 1.8.0
Label: OBSERVED
Limits: npm registry responses show the packages exist at those versions; they do not show the packages work for our flow.

## E-002: PayPal WebMCP Agent Ready announcement
Date (UTC): 2026-11-11T05:00Z
Commit: none (before first commit)
Environment: web fetch of developer.paypal.com
Method: read https://developer.paypal.com/community/blog/WebMCP_PayPal_Agent_Ready
Result: Post dated 2026-09-16, "WebMCP is here: PayPal is helping every merchant become agent-ready". States the WebMCP capability through the PayPal JavaScript SDK is optional and "limited to Store Sync customers today". Buyer is handed to PayPal to sign in, choose funding and approve; agents do not take payment credentials. Benchmark: three structured tool calls instead of more than 30 interface steps, called "directional" by PayPal.
Label: DERIVED
Limits: A blog post, not API documentation; says nothing about sandbox availability of WebMCP checkout.

## E-003: WebMCP tools register and execute in a real browser
Date (UTC): 2026-11-11T05:24Z
Commit: 9cad810
Environment: Windows 11, headless Chrome via puppeteer-core 25.17.0, local server on port 3111, @mcp-b/global 6.2.0 IIFE served from node_modules
Method: `node scripts/browser-check.mjs http://localhost:3111 --screenshot <scratchpad>/shop-tracer.png`
Result: badge "Agent-ready: 4 WebMCP tools on this page"; document.modelContext.getTools() returned create_checkout, get_order_status, get_product, search_products; executeTool(search_products, {query:"tea", max_price_usd:40}) returned 4 results; one trace row rendered on the page; no page errors.
Label: OBSERVED
Limits: Polyfill path only (no native WebMCP browser). The checkout tool was not executed here because PayPal credentials are not set yet.

## E-004: Smoke check without PayPal credentials
Date (UTC): 2026-11-11T05:23Z
Commit: 9cad810 (code as committed)
Environment: local, Node 22.20.0, no .env
Method: `node scripts/smoke.mjs http://localhost:3111`
Result: health, shop API, tool definitions and search_products (budget respected) passed; create_checkout failed with "PayPal is not configured" as designed; get_order_status skipped as a consequence.
Label: OBSERVED
Limits: No PayPal call has run yet.

## E-005: MCP endpoint answers a real MCP client
Date (UTC): 2026-11-11T05:28Z
Commit: working tree after 2c5e43c (server/mcp.js, scripts/mcp-check.mjs)
Environment: local, Node 22.20.0, @modelcontextprotocol/sdk 1.32.2 client and server, Streamable HTTP, stateful sessions
Method: `node scripts/mcp-check.mjs http://localhost:3111`
Result: tools/list returned search_products, get_product, create_checkout, get_order_status; tools/call search_products {query:"teapot strainer", max_price_usd:100} returned "Large stoneware teapot $64.00; Ceramic tea strainer $18.00"; server instructions delivered.
Label: OBSERVED
Limits: Local only; create_checkout over MCP not run yet (no PayPal credentials).

## E-006: PayPal sandbox OAuth and Orders v2 create
Date (UTC): 2026-11-11T08:54Z
Commit: b7ccaa4
Environment: local server, PayPal sandbox app "Stallfront" (first app, developer account's default sandbox business account)
Method: `node --env-file=.env scripts/smoke.mjs http://localhost:3000`; plus a create_checkout for strainer + chai
Result: all 6 smoke steps passed; PayPal orders 7M623080F81914803 ($22.00) and 3GK14662EH504750K ($38.00) created with status awaiting buyer approval; approve URLs on www.sandbox.paypal.com
Label: OBSERVED
Limits: Creation only; capture not reached (see E-007).

## E-007: Sandbox approval blocked by the payee account
Date (UTC): 2026-11-11T08:54Z
Commit: b7ccaa4
Environment: headless Chrome via scripts/approve-sandbox.mjs, sandbox personal buyer from the same developer account
Method: `node --env-file=.env scripts/approve-sandbox.mjs https://www.sandbox.paypal.com/checkoutnow?token=3GK14662EH504750K`
Result: buyer login succeeded; PayPal redirected to genericError?code=UEFZRUVfQUNDT1VOVF9MT0NLRURfT1JfQ0xPU0VE (base64 for PAYEE_ACCOUNT_LOCKED_OR_CLOSED), page text "The merchant isn't able to accept PayPal payments at this time."
Label: OBSERVED
Limits: Cause INFERRED: the app's sandbox business account cannot receive payments (likely its country). Fix in progress: a US sandbox business account and a new app (I-002).

## E-008: Full payment loop in the PayPal sandbox (create, buyer approval, capture)
Date (UTC): 2026-11-11T09:35Z
Commit: 8a92017
Environment: local server, PayPal sandbox app "Original Stallfront" (US sandbox business account), sandbox personal buyer sb-n1jy253844531 (account set to Arabic, Dubai address), headless Chrome
Method: create_checkout via the WebMCP tool endpoint (strainer + chai), then `node --env-file=.env scripts/approve-sandbox.mjs <approve_url>`, then GET /api/orders/ord_f48eed84bb2d
Result: buyer logged in, pressed the purchase button, PayPal redirected to /s/kiln-and-leaf/orders/ord_f48eed84bb2d; order page "Paid with PayPal"; status paid, PayPal order 9SU8772198274373F, capture 99K72367WP461105U, total $38.00
Label: OBSERVED
Limits: Local server (return URL on localhost); not yet on the public URL. Earlier attempts failed on the first app's locked payee (E-007) and on script bugs (button text, remembered email), since fixed.

## E-009: Groq models, agent tool call and vision listing
Date (UTC): 2026-11-11T09:35Z
Commit: 8a92017
Environment: Groq API with the human's free key; local server
Method: GET https://api.groq.com/openai/v1/models; POST /api/agent with "Find me a gift under $40 for a tea lover"; direct chat completions on qwen/qwen3.8-27b with json_schema variants; server draftListing() on public/img/samples/mug.jpg
Result: 11 models on the key, including openai/gpt-oss-120b, openai/gpt-oss-20b and qwen/qwen3.8-27b. Agent turn returned a search_products tool call (669 input, 51 output tokens). Vision: a simple strict json_schema worked (HTTP 200, about 1.8K prompt tokens per image); the full schema with an enum failed ("Failed to generate JSON"); without the enum it worked in 2.5 s and produced "White Ceramic Mug with Red Leaf Design and Blue Rim", $12, needs_seller_check capacity/dimensions. Rate limit headers: 8000 tokens per minute; a 429 reported ITPM limit 7000 for qwen/qwen3.8-27b.
Label: OBSERVED
Limits: One photo; listing quality on the other photos not yet seen. The free plan allows roughly three photos per minute.

## E-010: In-page buyer assistant end to end (Groq + WebMCP)
Date (UTC): 2026-11-11T09:35Z
Commit: 8a92017
Environment: headless Chrome, local server, openai/gpt-oss-120b
Method: `node scripts/agent-check.mjs http://localhost:3000`
Result: tool calls through WebMCP: search_products ("tea lover gift", max $40) then create_checkout (1 x prd_strn01); handoff card "Total $24.00, Review and pay in PayPal" with a sandbox PayPal link; 3.7 s to handoff.
Label: OBSERVED
Limits: One passing run. The first attempt stalled after search_products and the check then recorded no transcript; reliability over repeated runs not measured yet.

## E-011: Photos to listings to PayPal catalog products (seller onboarding pipeline)
Date (UTC): 2026-11-11T09:41Z
Commit: e987b26
Environment: local server; Groq qwen/qwen3.8-27b; PayPal sandbox app "Original Stallfront"
Method: `node scripts/build-demo-shop.mjs http://localhost:3000 <out> "Corner Stall" x public/img/samples/{mug,duffel-bag,glass,phone-stand}.jpg`, then POST /api/shops with the drafts
Result: 4 drafts in json_schema mode (1.2 to 1.8 s each; two 19 s waits on the free-plan rate limit): "White Ceramic Mug with Red Leaf Design and Blue Rim" $12, "Blue Fabric Utility Bag with White Webbing Handles" $12.50, "Faceted Clear Glass Tumbler" $15, "Adjustable Black Metal Pedal Stand..." $15 (wrong: it is a phone stand; corrected by hand before publishing). Publish returned 4 PayPal catalog products: PROD-39929499C8406084A, PROD-8AT00409M59283218, PROD-76N25752G8965680S, PROD-3B651817VT425422A; no warnings.
Label: OBSERVED
Limits: One earlier draft attempt on the same server failed with "Failed to generate JSON" before the fallback chain existed; the fallback paths themselves have not been exercised yet.

## E-012: Buyer assistant on Corner Stall, two items under budget
Date (UTC): 2026-11-11T09:41Z
Commit: e987b26
Environment: headless Chrome, local server from the new seed, openai/gpt-oss-120b
Method: `node scripts/agent-check.mjs http://localhost:3000` (prompt "Travelling next week: get me a bag and a phone stand, under $30 for both"); also smoke and mcp-check on corner-stall
Result: WebMCP calls search_products("bag", max $30), search_products("phone stand", max $30), create_checkout(bag + stand); handoff total $33.50 ($27.50 items + $6 shipping) in 4.1 s. Smoke: 6/6 passed, PayPal order 3T120472BF085773K. MCP: tools/list and search over /mcp/corner-stall.
Label: OBSERVED
Limits: Single run of the agent prompt; repeat-run reliability still unmeasured.

## E-013: Full demo path on the public Render URL, through to a captured sandbox payment
Date (UTC): 2026-11-11T11:07Z
Commit: e643512 (deployed by Render Blueprint, service srv-dbq4mbrrjlhs73b85hv0, free plan)
Environment: https://stallfront.onrender.com; checks run from the builder's machine with headless Chrome; PayPal sandbox; Groq openai/gpt-oss-120b
Method: `curl /healthz`; `node scripts/smoke.mjs <url>`; `node scripts/mcp-check.mjs <url>`; `node scripts/browser-check.mjs <url>`; `node scripts/agent-check.mjs <url>`; `node --env-file=.env scripts/approve-sandbox.mjs <approve_url>`; then GET /api/orders/<id> and /api/shops/corner-stall/dashboard
Result: healthz ok (paypal=true, ai=true), 1.3 s on first hit (service was warm after deploy). Smoke 6/6 (PayPal order 3C557017B01558320). MCP tools/list returns 4 tools and search works. WebMCP badge "Agent-ready: 4 WebMCP tools"; getTools and executeTool work. Assistant: search_products("bag", max $30), search_products("phone stand", max $30), create_checkout(bag + stand), handoff $33.50 in 4.9 s. Sandbox buyer approved PayPal order 1T517544FV170642A; return URL captured it: order ord_75d87bd82ee3 status paid, capture 05368800VL640091W, channel webmcp. The seller view API lists the order as paid with 3 trace rows. GitHub API: repo public, license MIT, branch main.
Label: OBSERVED
Limits: One run. The assistant wrote no text reply before the handoff card (tool calls only). Render free disk is ephemeral: orders and shops created on the server are lost on redeploy or restart (the seed shop reloads). Cold start after idle was not measured in this run.
