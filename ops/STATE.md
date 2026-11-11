# STATE

Updated (UTC): 2026-11-11T12:56Z
Verified at commit: 2d64327 on Render (later commits are docs and ops only)
Phase: shipping docs and video prep (feature freeze 2026-11-12T02:00+01:00; video gate 2026-11-12T15:30+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Live at https://stallfront.onrender.com in the bold magazine design with plain-English copy (E-019, D-006).
- Demo shop Corner Stall: six products from the human's Unsplash photos, six PayPal catalog products (E-019, D-007).
- Assistant on Render: "New job on Monday: get me a leather work bag and a jacket, under $280 for both" 10/10 ($271.00, median 3.5 s); "A gift under $20 for a coffee lover" 5/5 ($24.00) (E-019).
- Sandbox payment captured on Render: ord_66d4bdfabdcc, capture 1XT10488423082226 (E-019).
- MCP: create_checkout on Render; full buy through to capture locally (E-014, E-019).
- Onboarding on Render: four sample photos to a published shop, 4 of 4 catalog products (E-019).
- Vision drafts reject partial replies; json_object fallback seen working (E-019).
- `npm test` 13/13; smoke 6/6; fresh clone runs; no secrets in git history (E-016, E-018, E-019).
- README, ops/DEMO.md (video script for the new shop), ops/SUBMISSION.md, docs/img/* (all retaken in the new design).

## Written, not yet verified
- Nothing on the demo path.

## Broken or known issues
- Vision prices vary between runs of the same photo (jacket $65 to $180); the seller sets prices on review.
- Render free disk is ephemeral: shops and orders made on the server vanish on each deploy.
- The sandbox buyer's PayPal pages are in Arabic; the human uses Google Translate while recording (I-019 cut).
- Video link is a placeholder in README.md and ops/SUBMISSION.md.

## Next action
1. Human: set the GitHub repo description, website and topics.
2. Claude, right before recording: redeploy, warm the site, seed one paid MCP order (ops/DEMO.md).
3. Human: record and upload the video by 2026-11-12T15:30+01:00, then submit on Devpost by 18:00+01:00 (I-012).
4. Claude: add the video link, run presubmit --online, tag the submission.

## Blockers and waiting on
- Human: video recording.

## Open unknowns
- Measured cold-start time on Render (Render says 50 s or more).
