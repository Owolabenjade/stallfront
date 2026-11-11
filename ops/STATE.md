# STATE

Updated (UTC): 2026-11-11T11:10Z
Verified at commit: e643512 (live on Render)
Phase: core build (tracer gate met; next gate feature freeze 2026-11-12T02:00+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Public URL https://stallfront.onrender.com: health, shop, tools, smoke 6/6 (E-013).
- Buyer assistant on the public demo shop: 3 WebMCP tool calls to a $33.50 PayPal handoff (E-012 local, E-013 public).
- Sandbox payment captured from the public URL; order shows paid with capture ID, channel and tool trace in the seller view API (E-013).
- PayPal Orders v2 create and capture, Catalog Products (E-008, E-011).
- Photos to listings with Groq vision, then publish to the PayPal catalog (E-011).
- MCP /mcp/<slug>: tools/list and search_products from a real MCP client, local and public (E-005, E-013).
- Repo public on GitHub with MIT license (E-013).

## Written, not yet verified
- MCP create_checkout from an MCP client (I-008).
- Seller dashboard page rendering of a paid order (API verified only) (I-009).
- Vision fallback paths (failed_generation, json_object) (E-011 limits).
- /new onboarding on the public URL.

## Broken or known issues
- Render free disk is ephemeral: shops and orders made on the server vanish on each deploy or restart; seed shop reloads.
- Assistant sometimes ends with no text reply (handoff card only) (E-013).
- Trace shows raw product IDs in create_checkout args (I-015).
- No README, video script or submission text yet (I-011).

## Next action
1. Claude: MCP create_checkout check (I-008), product names in the trace (I-015), 10 reliability runs (I-016).
2. Claude: README as proof, DEMO.md, SUBMISSION.md (I-011).
3. Human: record the video after the last deploy (I-012).

## Blockers and waiting on
- None.

## Open unknowns
- Cold-start time on Render after idle (Render says 50 s or more).
- Agent pass rate over repeated runs.
