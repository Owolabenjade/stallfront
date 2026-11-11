# STATE

Updated (UTC): 2026-11-11T11:56Z
Verified at commit: aad798d on Render (later commits are docs, tests and ops only)
Phase: hardening and shipping docs (feature freeze 2026-11-12T02:00+01:00; video gate 2026-11-12T15:30+01:00)

Overwrite this file at every handoff and keep it under 60 lines. It describes the present only; history lives in git, DECISIONS and EVIDENCE. Every line under "Works now" cites an evidence ID.

## Works now
- Live at https://stallfront.onrender.com: smoke 6/6, WebMCP, MCP, assistant, sandbox capture (E-013, E-016).
- Assistant: travel prompt 20/20 on Render (median 4.75 s to handoff); gift prompt 5/5 on the final prompt; off-catalog request makes no checkout (E-015).
- Trace shows product names; the reply points to the PayPal button instead of pasting the link (E-015, E-017).
- MCP client buys through to capture (local), and creates a checkout on Render (E-014, E-016).
- Photos to a published shop on Render: 4 drafts in 47 to 67 s, 4 of 4 PayPal catalog products (E-016).
- Seller view: channel, agent, IDs and trace; layout fixed at 1366 px and 390 px (E-017).
- Fresh clone runs; `npm test` 11/11; no secrets in git history (E-016, E-018).
- README as proof, ops/DEMO.md (video script and recording steps), ops/SUBMISSION.md (Devpost text), docs/img/cover.png.

## Written, not yet verified
- Vision fallback paths (failed_generation, json_object) have not fired in a recorded run.

## Broken or known issues
- Vision names the phone stand a footrest or pedal stand (0 of 3); the seller fixes it in review (E-016).
- Render free disk is ephemeral: shops and orders made on the server vanish on each deploy.
- The PayPal sandbox buyer pages show in Arabic (buyer account country); a US English buyer is needed for the video (I-019).
- Video link is a placeholder in README.md and ops/SUBMISSION.md.

## Next action
1. Human: create a US English sandbox buyer and send the login (I-019); set the GitHub repo description and topics.
2. Claude: put the new buyer in .env and README; before recording, redeploy, warm the site, seed one paid MCP order (ops/DEMO.md).
3. Human: record and upload the video by 2026-11-12T15:30+01:00; submit by 18:00+01:00 (I-012).
4. Claude: optional design floor pass (I-010) before the freeze.

## Blockers and waiting on
- Human: English sandbox buyer, video recording.

## Open unknowns
- Measured cold-start time on Render (Render says 50 s or more).
