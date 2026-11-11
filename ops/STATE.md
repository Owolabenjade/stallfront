# STATE

Updated (UTC): 2026-11-11T15:15Z
Verified at commit: 5d2b342 app code on Render (every later commit is docs, ops or test scripts)
Phase: submission text and video prep (feature freeze 2026-11-12T02:00+01:00; video gate 2026-11-12T15:30+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Live at https://stallfront.onrender.com in the bold magazine design with plain-English copy (E-019, D-006).
- Demo shop Corner Stall: six products from the human's Unsplash photos, six PayPal catalog products (E-019, D-007).
- Shopper path: a product's "Buy with PayPal" button opens PayPal checkout and the payment is captured on Render (E-020).
- Assistant on Render: work-bag prompt 10/10 ($271.00, median 3.5 s); coffee-lover gift 5/5 ($24.00) (E-019).
- MCP: create_checkout on Render; full buy through to capture locally (E-014, E-019).
- Onboarding on Render: four sample photos to a published shop, 4 of 4 catalog products (E-019).
- `npm test` 13/13; smoke 6/6 on Render after the history rewrite (E-019; smoke rerun 2026-11-11T14:12Z).
- Git history: 31 commits rewritten to the Owolabenjade identity with no co-author lines; commit IDs in ops updated (D-008).
- Devpost text rewritten seller-first (D-009) in ops/SUBMISSION.md and the human's doc "Stallfront Devpost description" (https://claude.ai/artifact/2UQb5M2ibCJ6vb3ZwHthFP).

## Written, not yet verified
- Nothing on the demo path.

## Broken or known issues
- The old agent-led tagline is still on the site hero and page title, README title and intro, cover image, video title card and narration, package.json and (if set) the GitHub About text (I-022).
- Vision prices vary between runs of the same photo (jacket $65 to $180); the seller sets prices on review.
- Render free disk is ephemeral: shops and orders made on the server vanish on restart or deploy (the E-019 paid order was already gone at 14:12Z).
- The sandbox buyer's PayPal pages are in Arabic; the human uses Google Translate while recording (I-019 cut).
- Video link is a placeholder in README.md and ops/SUBMISSION.md.

## Next action
1. Human: approve or change the headline "Turn product photos into a PayPal shop in minutes."
2. Claude: roll it out (I-022): site hero and title, README, cover image, ops/DEMO.md title card and narration, package.json; redeploy; retake screenshots; presubmit.
3. Human: set the GitHub repo description, website and topics, using the new line.
4. Claude, right before recording: warm the site and seed one paid order of each kind (ops/DEMO.md).
5. Human: record and upload the video by 2026-11-12T15:30+01:00, then submit on Devpost by 18:00+01:00 (I-012).
6. Claude: add the video link, sync the doc into ops/SUBMISSION.md, run presubmit --online, tag the submission.

## Blockers and waiting on
- Human: headline approval; video recording.

## Open unknowns
- Measured cold-start time on Render (Render says 50 s or more).
- Whether Devpost's story editor renders `$...$` as math (check its preview before pasting).
