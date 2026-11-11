# STATE

Updated (UTC): 2026-11-11T16:16Z
Verified at commit: 8d81b88 on Render (E-022)
Phase: video prep (feature freeze 2026-11-12T02:00+01:00; video gate 2026-11-12T15:30+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Live at https://stallfront.onrender.com with the seller-first headline "Turn product photos into a PayPal shop in minutes.", followed by the AI-assistant line (E-022, D-009).
- Demo shop Corner Stall: six products from the human's Unsplash photos, six PayPal catalog products (E-019, D-007).
- Shopper path: a product's "Buy with PayPal" button opens PayPal checkout, and the payment is captured on Render (E-020, E-022).
- Assistant on Render: work-bag prompt 10/10 ($271.00, median 3.5 s), coffee-lover gift 5/5 ($24.00) (E-019); one run after the latest deploy, 3.4 s (E-022).
- Seller view labels each order's channel; a shopper's own order shows no assistant steps (E-022).
- MCP: our SDK test client bought through to a captured payment on Render (E-023).
- Onboarding on Render: four sample photos to a published shop, 4 of 4 catalog products (E-019).
- `npm test` 13/13; smoke and WebMCP browser checks pass on Render; presubmit online 0 errors (E-022).
- Cover image rebuilt from docs/cover.html with `node scripts/cover.mjs` (E-022).
- Devpost text: ops/SUBMISSION.md and the human's doc "Stallfront Devpost description" (https://claude.ai/artifact/2UQb5M2ibCJ6vb3ZwHthFP), seller-first, no coding-tool credit.
- Git history: Owolabenjade identity, no co-author lines (D-008).

## Ready for recording
- Live seller view seeded at 16:11 to 16:13Z: a paid shopper order ($24.00) and a paid AI-app order over MCP ($126.00) (E-023).
- A keep-awake ping hits /healthz every 4 minutes until about 19:10Z, so the site does not sleep and wipe the orders.
- No deploys until the video is done: every push carries [skip render].

## Written, not yet verified
- ops/DEMO.md: the reordered video script (seller's problem, pitch, photos to shop, shopper and assistant, seller view) has not been read aloud against a timer.

## Broken or known issues
- Vision prices vary between runs of the same photo (jacket $65 to $180); the seller sets prices on review.
- Render free disk is ephemeral: shops and orders made on the server vanish on restart, sleep or deploy.
- The sandbox buyer's PayPal pages are in Arabic; the human uses Google Translate while recording (I-019 cut).
- Video link is a placeholder in README.md and ops/SUBMISSION.md.

## Next action
1. Human: set the GitHub repo About: description = the Devpost pitch, website https://stallfront.onrender.com, topics.
2. Done: live site seeded and kept awake for recording (see above).
3. Human: record and upload the video by 2026-11-12T15:30+01:00, then submit on Devpost by 18:00+01:00 (I-012).
4. Claude: add the video link, sync the doc into ops/SUBMISSION.md, run presubmit --online, tag the submission.

## Blockers and waiting on
- Human: video recording.

## Open unknowns
- Measured cold-start time on Render (Render says 50 s or more).
- Whether Devpost's story editor renders `$...$` as math (check its preview before pasting).
