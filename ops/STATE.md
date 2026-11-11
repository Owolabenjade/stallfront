# STATE

Updated (UTC): 2026-11-11T05:33Z
Verified at commit: 9743551
Phase: tracer bullet (gate 2026-11-11T13:00+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Shop page registers 4 WebMCP tools; getTools/executeTool work in headless Chrome; calls are traced on the page (E-003).
- search_products respects the budget; shop and tool APIs answer (E-004).
- MCP endpoint /mcp/<slug>: tools/list and tools/call from a real MCP client (E-005).

## Written, not yet verified (needs keys)
- PayPal: OAuth, Orders v2 create, return-URL capture, Catalog product creation (server/paypal.js).
- Claude: buyer-agent turn with server-side tool list, photo-to-listing drafts with JSON schema output (server/claude.js), model claude-opus-5-5 with server-side refusal fallback.
- Pages: /new (onboarding), /s/<slug>/dashboard (seller view), landing, order page.
- render.yaml (not deployed).

## Broken or known issues
- Demo shop products have no photos (placeholder icon). Sample photos for /new missing (public/img/samples/*.jpg).
- No README yet.

## Next action
1. Human: fill PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, ANTHROPIC_API_KEY in .env (I-002).
2. Claude: `npm run smoke`, then one browser purchase with the sandbox buyer to verify capture (I-004).
3. Human: empty public GitHub repo + Render signup (I-003); Claude pushes and deploys.

## Blockers and waiting on
- PayPal sandbox credentials and Anthropic key (human).
- Product photos: real photos from the human, or generated samples (decision pending).

## Open unknowns
- Whether `fallbacks: "default"` and `output_config.format` are accepted together by @anthropic-ai/sdk 1.8.0 beta messages (first real call will show).
