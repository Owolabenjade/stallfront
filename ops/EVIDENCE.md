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
