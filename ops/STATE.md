# STATE

Updated (UTC): 2026-11-12T03:09Z
Verified at commit: ee1dca2 on Render (E-028)
Phase: submission (video made; upload and Devpost submit by the human)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Cold start measured once: 21.8 s after about 7.5 hours idle, then 0.4 s (E-027).
- Live at https://stallfront.onrender.com with the seller-first headline "Turn product photos into a PayPal shop in minutes.", followed by the AI-assistant line (E-022, D-009).
- Demo shop Corner Stall: six products from the human's Unsplash photos, six PayPal catalog products (E-019, D-007).
- Shopper path: a product's "Buy with PayPal" button opens PayPal checkout, and the payment is captured on Render (E-020, E-022).
- Assistant on Render: work-bag prompt 10/10 ($271.00, median 3.5 s), coffee-lover gift 5/5 ($24.00) (E-019); one run after the latest deploy, 3.4 s (E-022).
- Seller view labels each order's channel; a shopper's own order shows no assistant steps; an opened step list stays open across refreshes (E-022, E-024).
- Outside agents: our SDK test client (E-023) and Claude over MCP (E-027) each bought through to a captured payment on Render; Claude confirmed the payment afterwards.
- Onboarding on Render: four sample photos to a published shop, 4 of 4 catalog products (E-019).
- `npm test` 13/13; smoke and WebMCP browser checks pass on Render; presubmit online 0 errors (E-022).
- Cover image rebuilt from docs/cover.html with `node scripts/cover.mjs` (E-022).
- Devpost text: ops/SUBMISSION.md and the human's doc "Stallfront Devpost description" (https://claude.ai/artifact/2UQb5M2ibCJ6vb3ZwHthFP), seller-first, no coding-tool credit.
- Git history: Owolabenjade identity, no co-author lines (D-008).

## Video
- Demo video public on YouTube: https://youtu.be/KDiFgml6RH0 (E-025). Made from the live site: C:UsersPAB-NETWORKVideosStallfront demo.mp4, 2:38, captions burned in (E-024). Script and upload steps: ops/DEMO.md.

## Written, not yet verified
- Nothing on the demo path.

## Broken or known issues
- The shop assistant once called the goods "handmade" (not in the shop data) and does not state stock when asked for more than exists (E-026); accepted after the freeze (ops/BENCHMARK.md).
- Vision prices vary between runs of the same photo (jacket $65 to $180); the seller sets prices on review.
- Render free disk is ephemeral: shops and orders made on the server vanish on restart, sleep or deploy.
- The sandbox buyer's PayPal review page is in Arabic; PayPal ignores every English setting we tried (E-024). The video explains it on screen.

## Next action
1. Human: set the GitHub About box; fill the Devpost form from ops/SUBMISSION.md and submit by 2026-11-12T18:00+01:00 (I-012).
2. Claude: after the submit, tag the submitted commit and record the submission as evidence.

## Blockers and waiting on
- Human: the Devpost submit.

## Open unknowns
- Whether Devpost's story editor renders `$...$` as math (check its preview before pasting).
