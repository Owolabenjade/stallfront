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
